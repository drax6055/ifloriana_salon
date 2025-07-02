const express = require("express");
const router = express.Router();
const Product = require("../models/Product");
const Variation = require("../models/Variation");
 
// Utility to validate that submitted variation values exist in the variation model
async function validateProductVariations(variationsInput) {
  for (const variationEntry of variationsInput) {
    const variationDoc = await Variation.findById(variationEntry.variation_id);
    if (!variationDoc) {
      throw new Error(`Variation ID ${variationEntry.variation_id} not found`);
    }
    const allValuesValid = variationEntry.value_names.every(value => variationDoc.value.includes(value));
    if (!allValuesValid) {
      throw new Error(`Invalid variation values for "${variationDoc.name}"`);
    }
  }
}

// Create a new product
router.post("/", async (req, res) => {
  try {
    const productData = { ...req.body };

    // Handle image upload if provided
    if (req.file) {
      productData.image = req.file.path;
    }

    // Convert and validate fields
    productData.has_variations = productData.has_variations === "1" || productData.has_variations === 1 || productData.has_variations === true;
    if (productData.price) productData.price = Number(productData.price);
    if (productData.stock) productData.stock = Number(productData.stock);
    if (productData.status) productData.status = Number(productData.status);

    if (productData.variations && typeof productData.variations === "string") {
      try {
        productData.variations = JSON.parse(productData.variations);
      } catch (e) {
        return res.status(400).json({ message: "Invalid variations format. Must be JSON." });
      }
    }

    if (productData.has_variations && productData.variations) {
      await validateProductVariations(productData.variations);
    }

    const newProduct = new Product(productData);
    await newProduct.save();
    res.status(201).json({ message: "Product created successfully", product: newProduct });
  } catch (error) {
    res.status(500).json({ message: "Error creating product", error: error.message });
  }
});

// Get all products
router.get("/", async (req, res) => {
  const { salon_id } = req.query;

  if (!salon_id) {
    return res.status(400).json({ message: "salon_id is required" });
  }

  try {
    const products = await Product.find({ salon_id })
      .populate("branch_id")
      .populate("brand_id")
      .populate("category_id")
      .populate("tag_id")
      .populate("unit_id")
      .populate("variation_id");

    res.status(200).json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ message: "Error fetching products", error });
  }
});

// Get all product names and ids
router.get("/names", async (req, res) => {
  try {
    const { salon_id } = req.query;
    if (!salon_id) {
      return res.status(400).json({ message: "salon_id is required" });
    }
    const products = await Product.find({ salon_id }, { _id: 1, product_name: 1 });
    const result = products.map(p => ({ id: p._id, name: p.product_name }));
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: "Error fetching product names", error: error.message });
  }
});

// Get a single product by ID
router.get("/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate("branch_id")
      .populate("brand_id")
      .populate("category_id")
      .populate("tag_id")
      .populate("unit_id")
      .populate("variation_id");

    if (!product) return res.status(404).json({ message: "Product not found" });

    res.status(200).json(product);
  } catch (error) {
    res.status(500).json({ message: "Error fetching product", error });
  }
});

// Update a product by ID
router.put("/:id", async (req, res) => {
  try {
    const productData = { ...req.body };

    // Handle image upload if provided
    if (req.file) {
      productData.image = req.file.path;
    }

    if (productData.has_variations && typeof productData.variations === "string") {
      try {
        productData.variations = JSON.parse(productData.variations);
      } catch (e) {
        return res.status(400).json({ message: "Invalid variations format. Must be JSON." });
      }
    }

    if (productData.has_variations && productData.variations) {
      await validateProductVariations(productData.variations);
    }

    const updatedProduct = await Product.findByIdAndUpdate(req.params.id, productData, { new: true });

    if (!updatedProduct) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.status(200).json({ message: "Product updated successfully", product: updatedProduct });
  } catch (error) {
    res.status(500).json({ message: "Error updating product", error: error.message });
  }
});

// Delete a product by ID
router.delete("/:id", async (req, res) => {
  try {
    const deletedProduct = await Product.findByIdAndDelete(req.params.id);
    if (!deletedProduct) return res.status(404).json({ message: "Product not found" });
    res.status(200).json({ message: "Product deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting product", error });
  }
});

router.patch("/:id/stock", async (req, res) => {
  try {
    const { stock, variant_sku, variant_stock } = req.body;

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Update product-level stock if provided
    if (typeof stock !== "undefined") {
      product.stock = Number(stock);
    }

    // Update specific variant stock if SKU and stock provided
    if (variant_sku && typeof variant_stock !== "undefined") {
      const variant = product.variants.find(v => v.sku === variant_sku);
      if (!variant) {
        return res.status(404).json({ message: "Variant not found" });
      }
      variant.stock = Number(variant_stock);
    }

    await product.save();

    res.status(200).json({ message: "Stock updated successfully", product });
  } catch (error) {
    res.status(500).json({ message: "Error updating stock", error: error.message });
  }
});

module.exports = router;
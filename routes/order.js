const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

// Helper to generate PDF invoice and return file path
function generateOrderInvoicePDF(invoice, order_code) {
  const PDFDocument = require("pdfkit");
  const fs = require("fs");
  const path = require("path");

  const doc = new PDFDocument({ margin: 50 });
  const fileName = `invoice-${order_code}.pdf`;
  const filePath = path.join(__dirname, "../uploads", fileName);
  const stream = fs.createWriteStream(filePath);
  doc.pipe(stream);

  // Header
  const salon = invoice.salon || {};
  const branch = invoice.branch || {};
  doc.fontSize(22).font("Helvetica-Bold").text(salon.salon_name || "-", { align: "center" });
  doc.fontSize(14).text(branch.name || "-", { align: "center" });

  const address = branch.address || salon.address || "-";
  doc.fontSize(10).font("Helvetica").text(address, { align: "center" });

  const phone = branch.contact_number || salon.contact_number || "-";
  const email = branch.contact_email || salon.contact_email || "-";
  doc.text(`Phone: ${phone}`, { align: "center" });
  doc.text(`Email: ${email}`, { align: "center" });

  doc.moveDown(1);

  // Invoice Title
  doc.fontSize(16).font("Helvetica-Bold").text("Invoice", { align: "center" });
  doc.moveDown(1);

  // Order Info
  const customer = invoice.customer || {};
  doc.fontSize(11);
  doc.font("Helvetica-Bold").text(`Order Code: `, { continued: true }).font("Helvetica").text(invoice.order_code || "-");
  doc.font("Helvetica-Bold").text(`Customer: `, { continued: true }).font("Helvetica").text(customer.full_name || customer.name || "-");
  doc.font("Helvetica-Bold").text(`Phone: `, { continued: true }).font("Helvetica").text(customer.phone_number || "-", { continued: false });
  doc.font("Helvetica-Bold").text(`Date: `, { continued: true }).font("Helvetica").text(new Date(invoice.createdAt).toLocaleString());
  doc.moveDown(1);

  // Products Section
  doc.fontSize(12).font("Helvetica-Bold").text("Products", { underline: true });
  doc.moveDown(0.5);
  doc.fontSize(10).font("Helvetica");

  if (invoice.products && invoice.products.length > 0) {
    // Define column X positions
    const startX = 50;
    const qtyX = 250;
    const unitPriceX = 330;
    const totalX = 420;

    // Table Headers
    const yStart = doc.y;
    doc.font("Helvetica-Bold");
    doc.text("Product", startX, yStart);
    doc.text("Qty", qtyX, yStart);
    doc.text("Unit Price", unitPriceX, yStart);
    doc.text("Total", totalX, yStart);
    doc.moveDown(0.2);
    doc.moveTo(startX, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(0.3);

    doc.font("Helvetica");

    // Table Rows
    invoice.products.forEach((p) => {
      const prod = p.product || {};
      const y = doc.y;
      doc.text(prod.product_name || prod.name || "-", startX, y);
      doc.text(p.quantity?.toString() || "-", qtyX, y);
      doc.text(p.unit_price?.toFixed(2) || "-", unitPriceX, y);
      doc.text(p.total_price?.toFixed(2) || "-", totalX, y);
      doc.moveDown(0.5);
    });
  } else {
    doc.text("No products.");
  }

  // Summary Section
  doc.moveDown(1);
  doc.fontSize(12).font("Helvetica-Bold").text("Summary", { underline: true });
  doc.moveDown(0.5);
  const total = invoice.total_price?.toFixed(2) || "0.00";
  doc.font("Helvetica").fontSize(10)
    .text(`Subtotal: ₹${total}`, { align: "right" })
    .text(`Total Payable: ₹${total}`, { align: "right" });
  doc.moveDown(2);

  // Footer
  doc.fontSize(9).font("Helvetica-Oblique").text("Thank you for choosing us!", { align: "center" });
  doc.font("Helvetica-Oblique").text("This is a system-generated invoice.", { align: "center" });

  doc.end();

  return new Promise((resolve, reject) => {
    stream.on("finish", () => resolve(fileName));
    stream.on("error", reject);
  });
}


// Helper to build invoice object for an order
function buildOrderInvoice(order) {
  return {
    order_id: order._id,
    order_code: order.order_code,
    createdAt: order.createdAt,
    salon: order.salon_id,
    branch: order.branch_id,
    customer: order.customer_id,
    payment_method: order.payment_method,
    total_price: order.total_price,
    products: (order.products || []).map(p => ({
      product: p.product_id,
      variant: p.variant_id,
      quantity: p.quantity,
      unit_price: p.unit_price,
      total_price: p.total_price
    }))
  };
}
const express = require("express");
const router = express.Router();
const Order = require("../models/Order");
const Product = require("../models/Product");

// POST: Create a new order (buy products)
router.post("/", async (req, res) => {
  try {
    const { salon_id, branch_id, products, customer_id, payment_method } = req.body;
    if (!salon_id || !branch_id || !Array.isArray(products) || products.length === 0 || !customer_id || !payment_method) {
      return res.status(400).json({ message: "Missing required fields or products array is empty" });
    }
    let total_price = 0;
    const orderProducts = [];
    for (const item of products) {
      const { product_id, variant_id, quantity } = item;
      const qty = parseInt(quantity);
      if (!product_id || isNaN(qty) || qty < 1) {
        return res.status(400).json({ message: "Invalid product or quantity" });
      }
      const product = await Product.findById(product_id);
      if (!product) return res.status(404).json({ message: `Product not found: ${product_id}` });
      let unit_price;
      if (variant_id) {
        const variant = product.variants.find(v => v._id.toString() === variant_id);
        if (!variant) return res.status(404).json({ message: `Variant not found for product: ${product_id}` });
        unit_price = variant.price;
        if (variant.stock !== undefined) {
          if (variant.stock < qty) {
            return res.status(400).json({ message: `Not enough stock for variant of product: ${product_id}` });
          }
          variant.stock -= qty;
        } 
      } else {
        unit_price = product.price;
        if (product.stock !== undefined) {
          if (product.stock < qty) {
            return res.status(400).json({ message: `Not enough stock for product: ${product_id}` });
          }
          product.stock -= qty;
        }
      }
      const line_total = unit_price * qty;
      total_price += line_total;
      orderProducts.push({ product_id, variant_id: variant_id || null, quantity: qty, unit_price, total_price: line_total });
      await product.save();
    }
    const order = new Order({
      salon_id,
      branch_id,
      products: orderProducts,
      customer_id,
      total_price,
      payment_method
    });
    await order.save();
    // Populate for invoice
    await order.populate([
      { path: "salon_id" },
      { path: "branch_id" },
      { path: "customer_id" },
      { path: "products.product_id" },
      { path: "products.variant_id" }
    ]);
    const invoice = buildOrderInvoice(order);
    const pdfFileName = await generateOrderInvoicePDF(invoice, order.order_code);
    res.status(201).json({
      message: "Order created successfully",
      order_code: order.order_code,
      order,
      invoice,
      invoice_pdf_url: `/api/uploads/${pdfFileName}`
    });
  } catch (error) {
    res.status(500).json({ message: "Error creating order", error: error.message });
  }
});

// GET: Get all orders (optionally filter by salon_id, customer_id)
router.get("/", async (req, res) => {
  try {
    const { salon_id, customer_id } = req.query;
    if (!salon_id) {
      return res.status(400).json({ message: "salon_id is required" });
    }
    const filter = { salon_id };
    if (customer_id) filter.customer_id = customer_id;
    const orders = await Order.find(filter)
      .populate("products.product_id")
      .populate("products.variant_id")
      .populate("customer_id")
      .populate("branch_id");
    // Add productCount to each order
    const ordersWithProductCount = await Promise.all(orders.map(async order => {
      const obj = order.toObject();
      obj.productCount = obj.products ? obj.products.length : 0;
      obj.order_code = order.order_code;
      // Populate for invoice
      await order.populate([
        { path: "salon_id" },
        { path: "branch_id" },
        { path: "customer_id" },
        { path: "products.product_id" },
        { path: "products.variant_id" }
      ]);
      obj.invoice = buildOrderInvoice(order);
      // Generate PDF for each order (optional: comment out if not needed for all)
      obj.invoice_pdf_url = `/api/uploads/invoice-${order.order_code}.pdf`;
      return obj;
    }));
    res.status(200).json({ success: true, data: ordersWithProductCount });
  } catch (error) {
    res.status(500).json({ message: "Error fetching orders", error: error.message });
  }
});

// GET: Get a single order by ID
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findById(id)
      .populate("products.product_id")
      .populate("products.variant_id")
      .populate("customer_id")
      .populate("branch_id")
      .populate("salon_id");
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    // Populate for invoice
    await order.populate([
      { path: "salon_id" },
      { path: "branch_id" },
      { path: "customer_id" },
      { path: "products.product_id" },
      { path: "products.variant_id" }
    ]);
    const invoice = buildOrderInvoice(order);
    const pdfFileName = `/api/uploads/invoice-${order.order_code}.pdf`;
    res.status(200).json({
      success: true,
      order_code: order.order_code,
      order,
      invoice,
      invoice_pdf_url: pdfFileName
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching order", error: error.message });
  }
});

// PUT: Update an order by ID
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity, variant_id } = req.body;
    const order = await Order.findById(id);
    if (!order) return res.status(404).json({ message: "Order not found" });
    if (quantity) {
      const qty = parseInt(quantity);
      if (isNaN(qty) || qty < 1) {
        return res.status(400).json({ message: "Invalid quantity" });
      }
      order.quantity = qty;
      // Recalculate total_price
      let unit_price = order.unit_price;
      if (variant_id) {
        const product = await Product.findById(order.product_id);
        if (!product) return res.status(404).json({ message: "Product not found" });
        const variant = product.variants.find(v => v._id.toString() === variant_id);
        if (!variant) return res.status(404).json({ message: "Variant not found" });
        unit_price = variant.price;
        order.variant_id = variant_id;
        order.unit_price = unit_price;
      }
      order.total_price = order.unit_price * order.quantity;
    }
    await order.save();
    await order.populate([
      { path: "salon_id" },
      { path: "branch_id" },
      { path: "customer_id" },
      { path: "products.product_id" },
      { path: "products.variant_id" }
    ]);
    const invoice = buildOrderInvoice(order);
    const pdfFileName = await generateOrderInvoicePDF(invoice, order.order_code);
    res.status(200).json({
      message: "Order updated successfully",
      order_code: order.order_code,
      order,
      invoice,
      invoice_pdf_url: `/api/uploads/${pdfFileName}`
    });
  } catch (error) {
    res.status(500).json({ message: "Error updating order", error: error.message });
  }
});

// DELETE: Delete an order by ID
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Order.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: "Order not found" });
    res.status(200).json({ message: "Order deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting order", error: error.message });
  }
});

module.exports = {
  router,
  buildOrderInvoice,
  generateOrderInvoicePDF
};

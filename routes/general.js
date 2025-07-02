const express = require("express");
const router = express.Router();
const General = require("../models/General");

// Create a new general entry
router.post("/", async (req, res) => {
  try {
    const general = new General(req.body);
    const savedGeneral = await general.save();
    res.status(201).json(savedGeneral);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get all general entries
router.get("/", async (req, res) => {
  try {
    const generalEntries = await General.find();
    res.status(200).json(generalEntries);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get a single general entry by ID
router.get("/:id", async (req, res) => {
  try {
    const general = await General.findById(req.params.id);
    if (!general) return res.status(404).json({ error: "General entry not found" });
    res.status(200).json(general);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update a general entry by ID
router.put("/:id", async (req, res) => {
  try {
    const updatedGeneral = await General.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedGeneral) return res.status(404).json({ error: "General entry not found" });
    res.status(200).json(updatedGeneral);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete a general entry by ID
router.delete("/:id", async (req, res) => {
  try {
    const deletedGeneral = await General.findByIdAndDelete(req.params.id);
    if (!deletedGeneral) return res.status(404).json({ error: "General entry not found" });
    res.status(200).json({ message: "General entry deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

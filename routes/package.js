const express = require('express');
const router = express.Router();
const SuperAdminPackage = require('../models/SuperAdminPackage');

// Get all packages
router.get('/', async (req, res) => {
  try {
    const packages = await SuperAdminPackage.find(); 
    res.json(packages);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching packages', error });
  }
});

// Get single package by ID
router.get('/:id', async (req, res) => {
  try {
    const pkg = await SuperAdminPackage.findById(req.params.id);
    if (!pkg) return res.status(404).json({ message: 'Package not found' });
    res.json(pkg);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// Create new package
router.post('/', async (req, res) => {
  try {
    const newPackage = new SuperAdminPackage(req.body);
    await newPackage.save();
    res.status(201).json({ message: 'Package created successfully', data: newPackage });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// Update package
router.put('/:id', async (req, res) => {
  try {
    const updatedPackage = await SuperAdminPackage.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updatedPackage) return res.status(404).json({ message: 'Package not found' });
    res.json({ message: 'Package updated', data: updatedPackage });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// Delete package
router.delete('/:id', async (req, res) => {
  try {
    const deletedPackage = await SuperAdminPackage.findByIdAndDelete(req.params.id);
    if (!deletedPackage) return res.status(404).json({ message: 'Package not found' });
    res.json({ message: 'Package deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

module.exports = router;
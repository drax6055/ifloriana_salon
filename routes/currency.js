const express = require('express');
const router = express.Router();
const Currency = require('../models/Currency');

// Create Currency with salon_id validation
router.post('/', async (req, res) => {
    const { salon_id, name, symbol, exchange_rate, status } = req.body;

    if (!salon_id) {
        return res.status(400).json({ message: 'salon_id is required' });
    }

    try {
        if (req.body.is_primary === 1) {
            await Currency.updateMany({ is_primary: 1 }, { $set: { is_primary: 0 } });
        }
        const newCurrency = new Currency({ salon_id, name, symbol, exchange_rate, status });
        await newCurrency.save();
        res.status(201).json({ message: 'Currency created successfully', data: newCurrency });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});

// Get all currencies with salon_id filter
router.get('/', async (req, res) => {
    const { salon_id } = req.query;

    if (!salon_id) {
        return res.status(400).json({ message: 'salon_id is required' });
    }

    try {
        const currencies = await Currency.find({ salon_id });
        res.status(200).json({ message: 'Currencies fetched successfully', data: currencies });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});

// Get Single Currency
router.get('/:id', async (req, res) => {
  try {
    const currency = await Currency.findById(req.params.id);
    if (!currency) return res.status(404).json({ message: 'Currency not found' });
    res.status(200).json({ message: 'Currency fetched successfully', data: currency });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update Currency
router.put('/:id', async (req, res) => {
  try {
    if (req.body.is_primary === 1) {
      await Currency.updateMany({ _id: { $ne: req.params.id }, is_primary: 1 }, { $set: { is_primary: 0 } });
    }
    const currency = await Currency.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!currency) return res.status(404).json({ message: 'Currency not found' });
    res.status(200).json({ message: 'Currency updated successfully', data: currency });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete Currency
router.delete('/:id', async (req, res) => {
  try {
    const currency = await Currency.findByIdAndDelete(req.params.id);
    if (!currency) return res.status(404).json({ message: 'Currency not found' });
    res.status(200).json({ message: 'Currency deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
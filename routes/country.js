const express = require('express');
const router = express.Router();
const Country = require('../models/Country');

// Create a new country
router.post('/', async (req, res) => {
    try {
        const { name, status } = req.body;
        const newCountry = new Country({ name, status });
        await newCountry.save();
        res.status(201).json({ message: 'Country created successfully', country: newCountry });
    } catch (error) {
        res.status(500).json({ message: 'Error creating country', error });
    }
});

// Get all countries
router.get('/', async (req, res) => {
    try {
        const countries = await Country.find();
        res.status(200).json(countries);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching countries', error });
    }
});

// Get a single country by ID
router.get('/:id', async (req, res) => {
    try {
        const country = await Country.findById(req.params.id);
        if (!country) return res.status(404).json({ message: 'Country not found' });
        res.status(200).json(country);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching country', error });
    }
});

// Update a country by ID
router.put('/:id', async (req, res) => {
    try {
        const { name, status } = req.body;
        const updatedCountry = await Country.findByIdAndUpdate(
            req.params.id,
            { name, status },
            { new: true }
        );
        if (!updatedCountry) return res.status(404).json({ message: 'Country not found' });
        res.status(200).json({ message: 'Country updated successfully', country: updatedCountry });
    } catch (error) {
        res.status(500).json({ message: 'Error updating country', error });
    }
});

// Delete a country by ID
router.delete('/:id', async (req, res) => {
    try {
        const deletedCountry = await Country.findByIdAndDelete(req.params.id);
        if (!deletedCountry) return res.status(404).json({ message: 'Country not found' });
        res.status(200).json({ message: 'Country deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting country', error });
    }
});

module.exports = router;
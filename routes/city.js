const express = require('express');
const router = express.Router();
const City = require('../models/City');

// Create a new city
router.post('/', async (req, res) => {
    try {
        const { name, state_id, country_id, status } = req.body;
        const newCity = new City({ name, state_id, country_id, status });
        await newCity.save();
        res.status(201).json({ message: 'City created successfully', city: newCity });
    } catch (error) {
        console.error('Error creating city:', error); // <-- Log for debugging
        res.status(500).json({ message: 'Error creating city', error: error.message });

    }
});

// Get all cities
router.get('/', async (req, res) => {
    try {
        const cities = await City.find().populate({
            path: 'state_id',
            populate: {
                path: 'country_id',
                model: 'Country'
            }
        });
        res.status(200).json(cities);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching cities', error });
    }
});

// Get a single city by ID
router.get('/:id', async (req, res) => {
    try {
        const city = await City.findById(req.params.id).populate({
            path: 'state_id',
            populate: {
                path: 'country_id',
                model: 'Country'
            }
        });
        if (!city) return res.status(404).json({ message: 'City not found' });
        res.status(200).json(city);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching city', error });
    }
});

// Update a city by ID
router.put('/:id', async (req, res) => {
    try {
        const { name, state_id, status } = req.body;
        const updatedCity = await City.findByIdAndUpdate(
            req.params.id,
            { name, state_id, status },
            { new: true }
        );
        if (!updatedCity) return res.status(404).json({ message: 'City not found' });
        res.status(200).json({ message: 'City updated successfully', city: updatedCity });
    } catch (error) {
        res.status(500).json({ message: 'Error updating city', error });
    }
});

// Delete a city by ID
router.delete('/:id', async (req, res) => {
    try {
        const deletedCity = await City.findByIdAndDelete(req.params.id);
        if (!deletedCity) return res.status(404).json({ message: 'City not found' });
        res.status(200).json({ message: 'City deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting city', error });
    }
});

module.exports = router;
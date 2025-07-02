const express = require('express');
const router = express.Router();
const State = require('../models/State');

// Create a new state
router.post('/', async (req, res) => {
    try {
        const { name, country_id, status } = req.body;
        const newState = new State({ name, country_id, status });
        await newState.save();
        res.status(201).json({ message: 'State created successfully', state: newState });
    } catch (error) {
        res.status(500).json({ message: 'Error creating state', error });
    }
});

// Get all states
router.get('/', async (req, res) => {
    try {
        const states = await State.find().populate('country_id');
        res.status(200).json(states);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching states', error });
    }
});

// Get a single state by ID
router.get('/:id', async (req, res) => {
    try {
        const state = await State.findById(req.params.id).populate('country_id');
        if (!state) return res.status(404).json({ message: 'State not found' });
        res.status(200).json(state);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching state', error });
    }
});

// Update a state by ID
router.put('/:id', async (req, res) => {
    try {
        const { name, country_id, status } = req.body;
        const updatedState = await State.findByIdAndUpdate(
            req.params.id,
            { name, country_id, status },
            { new: true }
        );
        if (!updatedState) return res.status(404).json({ message: 'State not found' });
        res.status(200).json({ message: 'State updated successfully', state: updatedState });
    } catch (error) {
        res.status(500).json({ message: 'Error updating state', error });
    }
});

// Delete a state by ID
router.delete('/:id', async (req, res) => {
    try {
        const deletedState = await State.findByIdAndDelete(req.params.id);
        if (!deletedState) return res.status(404).json({ message: 'State not found' });
        res.status(200).json({ message: 'State deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting state', error });
    }
});

module.exports = router;
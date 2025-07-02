const express = require('express');
const router = express.Router();
const AppBanner = require('../models/AppBanner');

// Create a new app banner with salon_id
router.post('/', async (req, res) => {
    const { salon_id, image, name, url, type, link_id, status } = req.body;

    if (!salon_id) {
        return res.status(400).json({ message: 'salon_id is required' });
    }

    try {
        const newAppBanner = new AppBanner({ salon_id, image, name, url, type, link_id, status });
        await newAppBanner.save();
        res.status(201).json({ message: 'App banner created successfully', data: newAppBanner });
    } catch (error) {
        res.status(500).json({ message: 'Error creating app banner', error });
    }
});

// Get all app banners with salon_id filter
router.get('/', async (req, res) => {
    const { salon_id } = req.query;

    if (!salon_id) {
        return res.status(400).json({ message: 'salon_id is required' });
    }

    try {
        const appBanners = await AppBanner.find({ salon_id });
        res.status(200).json(appBanners);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching app banners', error });
    }
});

// Get a single app banner by ID with salon_id validation
router.get('/:id', async (req, res) => {
    const { salon_id } = req.query;

    if (!salon_id) {
        return res.status(400).json({ message: 'salon_id is required' });
    }

    try {
        const appBanner = await AppBanner.findOne({ _id: req.params.id, salon_id });
        if (!appBanner) return res.status(404).json({ message: 'App banner not found' });
        res.status(200).json(appBanner);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching app banner', error });
    }
});

// Update an app banner by ID with salon_id validation
router.put('/:id', async (req, res) => {
    const { salon_id, image, name, url, type, link_id, status } = req.body;

    if (!salon_id) {
        return res.status(400).json({ message: 'salon_id is required' });
    }

    try {
        const updatedAppBanner = await AppBanner.findOneAndUpdate(
            { _id: req.params.id, salon_id },
            { image, name, url, type, link_id, status },
            { new: true }
        );
        if (!updatedAppBanner) return res.status(404).json({ message: 'App banner not found' });
        res.status(200).json({ message: 'App banner updated successfully', data: updatedAppBanner });
    } catch (error) {
        res.status(500).json({ message: 'Error updating app banner', error });
    }
});

// Delete an app banner by ID with salon_id validation
router.delete('/:id', async (req, res) => {
    const { salon_id } = req.query;

    if (!salon_id) {
        return res.status(400).json({ message: 'salon_id is required' });
    }

    try {
        const deletedAppBanner = await AppBanner.findOneAndDelete({ _id: req.params.id, salon_id });
        if (!deletedAppBanner) return res.status(404).json({ message: 'App banner not found' });
        res.status(200).json({ message: 'App banner deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting app banner', error });
    }
});

module.exports = router;
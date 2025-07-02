const express = require('express');
const router = express.Router();
const Role = require('../models/Role');

// Create a new role
router.post('/', async (req, res) => {
    const { salon_id, name, import_from_role } = req.body;

    if (!salon_id) {
        return res.status(400).json({ message: 'salon_id is required' });
    }

    try {
        const newRole = new Role({ salon_id, name, import_from_role });
        await newRole.save();
        res.status(201).json({ message: 'Role created successfully', data: newRole });
    } catch (error) {
        res.status(500).json({ message: 'Error creating role', error });
    }
});

// Get all roles
router.get('/', async (req, res) => {
    const { salon_id } = req.query;

    if (!salon_id) {
        return res.status(400).json({ message: 'salon_id is required' });
    }

    try {
        const roles = await Role.find({ salon_id });
        res.status(200).json(roles);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching roles', error });
    }
});

// Get a single role by ID
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    const { salon_id } = req.query;

    if (!salon_id) {
        return res.status(400).json({ message: 'salon_id is required' });
    }

    try {
        const role = await Role.findOne({ _id: id, salon_id });
        if (!role) return res.status(404).json({ message: 'Role not found' });
        res.status(200).json(role);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching role', error });
    }
});

// Update a role by ID
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { salon_id, name, import_from_role } = req.body;

    if (!salon_id) {
        return res.status(400).json({ message: 'salon_id is required' });
    }

    try {
        const updatedRole = await Role.findOneAndUpdate(
            { _id: id, salon_id },
            { name, import_from_role },
            { new: true }
        );
        if (!updatedRole) return res.status(404).json({ message: 'Role not found' });
        res.status(200).json({ message: 'Role updated successfully', data: updatedRole });
    } catch (error) {
        res.status(500).json({ message: 'Error updating role', error });
    }
});

// Delete a role by ID
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    const { salon_id } = req.query;

    if (!salon_id) {
        return res.status(400).json({ message: 'salon_id is required' });
    }

    try {
        const deletedRole = await Role.findOneAndDelete({ _id: id, salon_id });
        if (!deletedRole) return res.status(404).json({ message: 'Role not found' });
        res.status(200).json({ message: 'Role deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting role', error });
    }
});

module.exports = router;
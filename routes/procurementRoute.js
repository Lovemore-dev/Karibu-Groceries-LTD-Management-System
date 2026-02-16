const express = require('express');

const router = express.Router();

const produce = require('../models/Produce');

// Routes for procurement
router
  .route('/')
  // @desc Get all procurements
  .get(async (req, res) => {
    try {
      const procurements = await produce.find().sort({ createdAt: -1 });
      return res.status(200).json(procurements);
    } catch (error) {
      return res.status(500).json({ error: 'Failed to fetch procurements', message: error });
    }
  })
  // @desc Create procurement
  .post(async (req, res) => {
    try {
      const newProcurement = await produce.create(req.body);
      return res.status(201).json(newProcurement);
    } catch (error) {
      return res.status(400).json({ error: 'Failed to create procurement', message: error });
    }
  });

// Routes for specific procurement by ID
router
  .route('/:id')
  // @desc Get a single procurement
  .get(async (req, res) => {
    try {
      // Attempt to find the procurement by ID
      const procurement = await produce.findById(req.params.id);
      // Handle case where procurement is not found
      if (!procurement) {
        return res.status(404).json({ error: 'Procurement not found' });
      }
      // If procurement is found, return it
      return res.status(200).json(procurement);
    } catch (error) {
      // Handle errors that may occur during the database query
      return res.status(500).json({
        error: 'Server error',
        message: `Could not get procurement for ID: ${req.params.id}`,
      });
    }
  })
  // @desc Update a procurement
  .patch(async (req, res) => {
    try {
      const updatedProcurement = await produce.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
      });
      if (!updatedProcurement) {
        return res.status(404).json({ error: `Procurement not found` });
      }
      return res.status(200).json(updatedProcurement);
    } catch (error) {
      return res.status(400).json({ error: `Update failed`, message: error.message });
    }
  })
  // @desc Delete a procurement
  .delete(async (req, res) => {
    try {
      const deletedProcurement = await produce.findByIdAndDelete(req.params.id);

      if (!deletedProcurement) {
        return res.status(404).json({ error: `Procurement not found` });
      }
      return res
        .status(200)
        .json({ message: `Procurement deleted successfully`, id: req.params.id });
    } catch (error) {
      return res.status(500).json({ error: `Delete failed`, message: error.message });
    }
  });

module.exports = router;

const express = require('express');

const router = express.Router();

const produce = require('../models/Produce');

// import authentication middleware
const { protect, restrictTo } = require('../middleware/auth');

// Middleware to ensure only authorized staff see procurements
router.use(protect);

// Routes for procurement
router
  .route('/')
  // @desc Get all procurements
  .get(restrictTo('Manager', 'Director'), async (req, res) => {
    try {
      // RULE: Director should only see totals or aggregations
      if (req.user.role === 'Director') {
        const aggregations = await produce.aggregate([
          {
            $group: {
              _id: '$branch',
              totalTonnage: { $sum: '$tonnage' },
              totalStockValue: { $sum: { $multiply: ['$tonnage', '$cost'] } },
            },
          },
        ]);
        return res.status(200).json({ status: 'success', data: aggregations });
      }
      // Filter by branch so managers only see their own branch's produce
      const procurements = await produce.find({ branch: req.user.branch }).sort({ createdAt: -1 });
      return res.status(200).json(procurements);
    } catch (error) {
      return res.status(500).json({ error: 'Failed to fetch procurements', message: error });
    }
  })
  // @desc Create procurement
  // Only manager can create procurements
  .post(restrictTo('Manager'), async (req, res) => {
    try {
      // RULE: Individual dealers must provide not least than 1000kg
      if (req.body.tonnage < 1000) {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'Produce from individual dealers must be at least 1000kg',
        });
      }
      // The procurement will be associated with the manager's branch and name
      // This prevents data entry errors
      const procurementData = {
        ...req.body,
        branch: req.user.branch, // Automatically associate the procurement with the manager's branch
        procuredBy: req.user.fullName, // Automatically associate the procurement with the manager's name
      };
      const newProcurement = await produce.create(procurementData);
      return res.status(201).json(newProcurement);
    } catch (error) {
      return res.status(400).json({ error: 'Failed to create procurement', message: error });
    }
  });

// Routes for specific procurement by ID
router
  .route('/:id')
  // @desc Get a single procurement
  .get(restrictTo('Manager'), async (req, res) => {
    try {
      // Attempt to find the procurement by ID
      const procurement = await produce.findById(req.params.id);
      // Handle case where procurement is not found
      if (!procurement) {
        return res.status(404).json({ error: 'Procurement not found' });
      }
      // Business rule: Managers can only access procurements from their own branch. This ensures data privacy and proper access control. If a manager tries to access a procurement that does not belong to their branch, the system should return a 403 Forbidden error.
      if (procurement.branch !== req.user.branch) {
        return res
          .status(403)
          .json({ error: 'Access denied. This procurement does not belong to your branch.' });
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
  .patch(restrictTo('Manager'), async (req, res) => {
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
  .delete(restrictTo('Manager'), async (req, res) => {
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

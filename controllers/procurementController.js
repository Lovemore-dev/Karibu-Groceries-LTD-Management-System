const produce = require('../models/Produce');

// @desc Get all procurements
// @route GET /api/procurements

const getProcurements = async (req, res) => {
  try {
    const procurements = await produce.find().sort({ createdAt: -1 });
    return res.status(200).json(procurements);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch procurements', message: error });
  }
};

// @desc Create procurement
// @route POST /api/procurements

const createProcurement = async (req, res) => {
  try {
    const newProcurement = await produce.create(req.body);
    return res.status(201).json(newProcurement);
  } catch (error) {
    return res.status(400).json({ error: 'Failed to create procurement', message: error });
  }
};

// @desc Get a procurement
// @route GET /api/procurements/:id

const getProcurement = async (req, res) => {
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
};

// @desc update procurement
// @route PATCH /api/procurements/:id

const updateProcurement = async (req, res) => {
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
};

// @desc delete procurement
// @route DELETE /api/procurements/:id

const deleteProcurement = async (req, res) => {
  try {
    const deletedProcurement = await produce.findByIdAndDelete(req.params.id);

    if (!deletedProcurement) {
      return res.status(404).json({ error: `Procurement not found` });
    }
    return res.status(200).json({ message: `Procurement deleted successfully`, id: req.params.id });
  } catch (error) {
    return res.status(500).json({ error: `Delete failed`, message: error.message });
  }
};

module.exports = {
  getProcurements,
  getProcurement,
  createProcurement,
  updateProcurement,
  deleteProcurement,
};

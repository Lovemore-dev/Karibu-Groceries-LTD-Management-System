// @desc Get all procurements
// @route GET /api/procurements
// @access public

const getProcurements = (req, res) => {
  res.status(200).json({ message: 'I am getting procurements' });
};

// @desc Get all procurements
// @route GET /api/procurements
// @access public

const getProcurement = (req, res) => {
  res.status(200).json({ message: `I am getting procurement for ${req.params.id}` });
};

// @desc Create procurement
// @route POST /api/procurements
// @access public

const createProcurement = (req, res) => {
  res.status(201).json({ message: 'I am adding procurement' });
};

// @desc update procurement
// @route PATCH /api/procurements
// @access public

const updateProcurement = (req, res) => {
  res.status(200).json({ message: `I am updating procurement for ${req.params.id}` });
};

// @desc delete procurement
// @route DELETE /api/procurements
// @access public

const deleteProcurement = (req, res) => {
  res.status(200).json({ message: `I am deleting procurement for ${req.params.id}` });
};

module.exports = {
  getProcurements,
  getProcurement,
  createProcurement,
  updateProcurement,
  deleteProcurement,
};

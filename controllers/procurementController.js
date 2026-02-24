const produce = require('../models/Produce');
const catchAsync = require('../utils/catchAsync');
const KGLError = require('../utils/kglError');

// @desc Get all procurements
exports.getAllProcurements = catchAsync(async (req, res) => {
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

  const procurements = await produce.find({ branch: req.user.branch }).sort({ createdAt: -1 });
  return res
    .status(200)
    .json({ status: 'success', results: procurements.length, data: procurements });
});

// @desc Create a procurement
exports.createProcurement = catchAsync(async (req, res, next) => {
  if (req.body.tonnage < 1000) {
    return next(new KGLError('Produce from individual dealers must be at least 1000kg', 400));
  }

  const newProcurement = await produce.create({
    ...req.body,
    branch: req.user.branch,
    procuredBy: req.user.fullName,
  });

  return res.status(201).json({ status: 'success', data: newProcurement });
});

// @desc Get single procurement
exports.getProcurement = catchAsync(async (req, res, next) => {
  const procurement = await produce.findById(req.params.id);

  if (!procurement) {
    return next(new KGLError('No procurement found with that ID', 404));
  }

  if (procurement.branch !== req.user.branch) {
    return next(new KGLError('Access denied. This is not your branch.', 403));
  }

  return res.status(200).json({ status: 'success', data: procurement });
});

// @desc Update procurement
exports.updateProcurement = catchAsync(async (req, res, next) => {
  const updatedProcurement = await produce.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!updatedProcurement) {
    return next(new KGLError('No procurement found with that ID', 404));
  }

  return res.status(200).json({ status: 'success', data: updatedProcurement });
});

// @desc Delete procurement
exports.deleteProcurement = catchAsync(async (req, res, next) => {
  const deletedProcurement = await produce.findByIdAndDelete(req.params.id);

  if (!deletedProcurement) {
    return next(new KGLError('No procurement found with that ID', 404));
  }

  return res.status(200).json({ status: 'success', message: 'Deleted successfully' });
});

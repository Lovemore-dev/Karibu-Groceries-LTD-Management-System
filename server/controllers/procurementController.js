const produce = require('../models/Produce');
const catchAsync = require('../utils/catchAsync');
const KGLError = require('../utils/kglError');

// @desc Get all procurements
exports.getAllProcurements = catchAsync(async (req, res) => {
  const query = {};

  // 1. Filter by branch if not Director
  if (req.user.role !== 'Director') {
    query.branch = req.user.branch;
  }

  // 2. Always get the actual list for the table (organized by produce name, then newest first)
  const procurements = await produce.find(query).sort({ produceName: 1, createdAt: -1 });

  // 3. Always compute stats (by branch): Director sees all branches, Manager sees their branch
  const stats = await produce.aggregate([
    { $match: query },
    {
      $group: {
        _id: '$branch',
        totalTonnageBought: { $sum: '$tonnage' },
        currentTonnageInStore: { $sum: '$currentInventory' },
        totalInvestment: { $sum: '$cost' },
        currentAssetValue: {
          $sum: {
            $multiply: [{ $divide: ['$currentInventory', '$tonnage'] }, '$cost'],
          },
        },
      },
    },
  ]);

  return res.status(200).json({
    status: 'success',
    results: procurements.length,
    data: procurements,
    stats,
  });
});

// @desc Create a procurement
exports.createProcurement = catchAsync(async (req, res, next) => {
  // Business rule: only Managers can record procurements
  if (!req.user || req.user.role !== 'Manager') {
    return next(new KGLError('Only Managers can create procurements', 403));
  }

  if (req.body.tonnage < 1000) {
    return next(new KGLError('Produce from individual dealers must be at least 1000kg', 400));
  }

  const newProcurement = await produce.create({
    ...req.body,
    currentInventory: req.body.tonnage,
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

  // Directors can see all branches; others limited to their branch
  if (req.user.role !== 'Director' && procurement.branch !== req.user.branch) {
    return next(new KGLError('Access denied. This is not your branch.', 403));
  }

  return res.status(200).json({ status: 'success', data: procurement });
});

// @desc Update procurement
exports.updateProcurement = catchAsync(async (req, res, next) => {
  // Only Managers may update procurements, and only within their branch
  if (!req.user || req.user.role !== 'Manager') {
    return next(new KGLError('Only Managers can update procurements', 403));
  }

  const existing = await produce.findById(req.params.id);

  if (!existing) {
    return next(new KGLError('No procurement found with that ID', 404));
  }

  if (existing.branch !== req.user.branch) {
    return next(new KGLError('Access denied. This is not your branch.', 403));
  }

  // Never overwrite currentInventory from tonnage on update—sales reduce currentInventory only
  const { tonnage, currentInventory, ...rest } = req.body;
  const updatedProcurement = await produce.findByIdAndUpdate(
    req.params.id,
    { ...rest, tonnage },
    {
      new: true,
      runValidators: true,
    },
  );

  return res.status(200).json({ status: 'success', data: updatedProcurement });
});

// @desc Delete procurement
exports.deleteProcurement = catchAsync(async (req, res, next) => {
  // Only Managers may delete procurements, and only within their branch
  if (!req.user || req.user.role !== 'Manager') {
    return next(new KGLError('Only Managers can delete procurements', 403));
  }

  const existing = await produce.findById(req.params.id);

  if (!existing) {
    return next(new KGLError('No procurement found with that ID', 404));
  }

  if (existing.branch !== req.user.branch) {
    return next(new KGLError('Access denied. This is not your branch.', 403));
  }

  const deletedProcurement = await produce.findByIdAndDelete(req.params.id);

  return res.status(200).json({ status: 'success', message: 'Deleted successfully' });
});

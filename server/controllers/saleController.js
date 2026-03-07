const Produce = require('../models/Produce');
const Sale = require('../models/Sale');
const CreditSale = require('../models/CreditSale');
const catchAsync = require('../utils/catchAsync');
const KGLError = require('../utils/kglError');

// @desc Process a new cash sale
exports.createCashSale = catchAsync(async (req, res, next) => {
  if (!req.user || !['Manager', 'Sales Agent'].includes(req.user.role)) {
    return next(new KGLError('Only Managers and Sales Agents can create cash sales', 403));
  }

  const { produceName, tonnage } = req.body;
  const { branch } = req.user;

  if (!tonnage || tonnage <= 0) {
    return next(new KGLError('Tonnage must be a positive number', 400));
  }

  // FIFO: Sort by createdAt 1 (oldest first)
  const batches = await Produce.find({
    produceName,
    branch,
    currentInventory: { $gt: 0 },
  }).sort({ createdAt: 1 });

  const totalAvailable = batches.reduce((acc, batch) => acc + batch.currentInventory, 0);

  if (totalAvailable < tonnage) {
    return next(new KGLError(`Insufficient inventory. Only ${totalAvailable}kg available.`, 400));
  }

  let remainingToDeduct = tonnage;
  let totalSaleValue = 0;
  const bulkOps = [];

  for (let i = 0; i < batches.length; i += 1) {
    if (remainingToDeduct <= 0) break;
    const batch = batches[i];
    let deductedFromThisBatch = 0;

    if (batch.currentInventory >= remainingToDeduct) {
      deductedFromThisBatch = remainingToDeduct;
      remainingToDeduct = 0;
    } else {
      deductedFromThisBatch = batch.currentInventory;
      remainingToDeduct -= batch.currentInventory;
    }

    totalSaleValue += deductedFromThisBatch * batch.sellingPrice;

    bulkOps.push({
      updateOne: {
        filter: { _id: batch._id },
        update: { $inc: { currentInventory: -deductedFromThisBatch } },
      },
    });
  }

  if (bulkOps.length > 0) await Produce.bulkWrite(bulkOps);

  const newSale = await Sale.create({
    ...req.body,
    amountPaid: totalSaleValue,
    saleAgent: req.user.fullName,
    branch,
    date: new Date(),
  });

  return res.status(201).json({ status: 'success', data: newSale });
});

// @desc Process a new credit sale (FIXED with FIFO logic)
exports.createCreditSale = catchAsync(async (req, res, next) => {
  if (!req.user || !['Manager', 'Sales Agent'].includes(req.user.role)) {
    return next(new KGLError('Only Managers and Sales Agents can create credit sales', 403));
  }

  const { nationalId, produceName, tonnage, buyersName, dueDate, contact, location } = req.body;
  const { branch } = req.user;

  if (!tonnage || tonnage <= 0) {
    return next(new KGLError('Tonnage must be a positive number', 400));
  }

  const ninRegex = /^(CF|CM)[A-Z0-9]{12}$/;
  if (!nationalId || !ninRegex.test(nationalId)) {
    return next(new KGLError('NIN must follow the Ugandan format (CF/CM + 12 chars)', 400));
  }

  // 1. Find all batches for FIFO deduction
  const batches = await Produce.find({
    produceName,
    branch,
    currentInventory: { $gt: 0 },
  }).sort({ createdAt: 1 });

  const totalAvailable = batches.reduce((acc, batch) => acc + batch.currentInventory, 0);

  if (totalAvailable < tonnage) {
    return next(new KGLError(`Insufficient inventory. Only ${totalAvailable}kg available.`, 400));
  }

  let remainingToDeduct = tonnage;
  let totalAmountDue = 0;
  let produceType = '';
  const bulkOps = [];

  for (let i = 0; i < batches.length; i += 1) {
    if (remainingToDeduct <= 0) break;
    const batch = batches[i];
    if (!produceType) produceType = batch.produceType;

    let deducted = 0;
    if (batch.currentInventory >= remainingToDeduct) {
      deducted = remainingToDeduct;
      remainingToDeduct = 0;
    } else {
      deducted = batch.currentInventory;
      remainingToDeduct -= batch.currentInventory;
    }

    totalAmountDue += deducted * batch.sellingPrice;

    bulkOps.push({
      updateOne: {
        filter: { _id: batch._id },
        update: { $inc: { currentInventory: -deducted } },
      },
    });
  }

  if (bulkOps.length > 0) await Produce.bulkWrite(bulkOps);

  // 2. Create the credit sale record
  const newCreditSale = await CreditSale.create({
    nationalId,
    produceName,
    tonnage,
    buyersName,
    dueDate,
    contact,
    location,
    produceType,
    amountDue: totalAmountDue,
    saleAgent: req.user.fullName,
    branch,
    dispatchDate: new Date(),
  });

  return res.status(201).json({ status: 'success', data: newCreditSale });
});

// @desc Get all sales
exports.getAllSales = catchAsync(async (req, res) => {
  if (req.user.role === 'Director') {
    const cashAggregations = await Sale.aggregate([
      {
        $group: {
          _id: '$branch',
          totalRevenue: { $sum: '$amountPaid' },
          totalTonnage: { $sum: '$tonnage' },
        },
      },
    ]);
    const creditAggregations = await CreditSale.aggregate([
      {
        $group: {
          _id: '$branch',
          totalOwed: { $sum: '$amountDue' },
          totalTonnage: { $sum: '$tonnage' },
        },
      },
    ]);
    return res
      .status(200)
      .json({ status: 'success', role: 'Director', cashAggregations, creditAggregations });
  }

  const query = { branch: req.user.branch.trim() };
  const cashSales = await Sale.find(query).sort({ createdAt: -1 });
  const creditSales = await CreditSale.find(query).sort({ createdAt: -1 });

  return res.status(200).json({ status: 'success', cashSales, creditSales });
});

// @desc Get available stock (for sales validation)
// - Staff (Manager / Sales Agent): scoped to their branch
// - Director: can request per-branch via ?branch=Maganjo|Matugga, otherwise returns all-branch breakdown
exports.getAvailableStock = catchAsync(async (req, res) => {
  const produceName = req.query.produceName?.trim();
  const branchQuery = req.query.branch?.trim();

  const match = { currentInventory: { $gt: 0 } };

  if (req.user.role === 'Director') {
    if (branchQuery) match.branch = branchQuery;
  } else {
    match.branch = req.user.branch;
  }

  if (produceName) match.produceName = produceName;

  // If Director and no branch specified, return breakdown by branch + produceName
  if (req.user.role === 'Director' && !branchQuery && !produceName) {
    const data = await Produce.aggregate([
      { $match: match },
      {
        $group: {
          _id: { branch: '$branch', produceName: '$produceName' },
          totalAvailable: { $sum: '$currentInventory' },
        },
      },
      { $sort: { '_id.branch': 1, '_id.produceName': 1 } },
    ]);

    return res.status(200).json({ status: 'success', data });
  }

  // Branch-scoped (or produce-scoped) totals
  const grouped = await Produce.aggregate([
    { $match: match },
    { $group: { _id: '$produceName', totalAvailable: { $sum: '$currentInventory' } } },
    { $sort: { _id: 1 } },
  ]);

  if (produceName) {
    const row = grouped.find((r) => r._id === produceName);
    const totalAvailable = row ? row.totalAvailable : 0;
    // Get selling price from first available batch for amount preview on frontend
    const firstBatch = await Produce.findOne(match).select('sellingPrice').lean();
    const sellingPricePerKg = firstBatch?.sellingPrice ? firstBatch.sellingPrice : null;
    return res.status(200).json({
      status: 'success',
      data: {
        branch: match.branch || null,
        produceName,
        totalAvailable,
        sellingPricePerKg,
      },
    });
  }

  return res.status(200).json({
    status: 'success',
    data: grouped.map((r) => ({ produceName: r._id, totalAvailable: r.totalAvailable })),
    branch: match.branch || null,
  });
});

const Produce = require('../models/Produce');
const Sale = require('../models/Sale');
const CreditSale = require('../models/CreditSale');
const catchAsync = require('../utils/catchAsync');
const KGLError = require('../utils/kglError');

// @desc Process a new cash sale
exports.createCashSale = catchAsync(async (req, res, next) => {
  const { produceName, tonnage } = req.body;
  const { branch } = req.user;

  // FIFO: Sort by createdAt 1 (oldest first)
  const batches = await Produce.find({
    produceName,
    branch,
    tonnage: { $gt: 0 },
  }).sort({ createdAt: 1 });

  const totalAvailable = batches.reduce((acc, batch) => acc + batch.tonnage, 0);

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

    if (batch.tonnage >= remainingToDeduct) {
      deductedFromThisBatch = remainingToDeduct;
      remainingToDeduct = 0;
    } else {
      deductedFromThisBatch = batch.tonnage;
      remainingToDeduct -= batch.tonnage;
    }

    totalSaleValue += deductedFromThisBatch * batch.sellingPrice;

    bulkOps.push({
      updateOne: {
        filter: { _id: batch._id },
        update: { $inc: { tonnage: -deductedFromThisBatch } },
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
  const { nationalId, produceName, tonnage, buyersName, dueDate, contact, location } = req.body;
  const { branch } = req.user;

  const ninRegex = /^(CF|CM)[A-Z0-9]{12}$/;
  if (!nationalId || !ninRegex.test(nationalId)) {
    return next(new KGLError('NIN must follow the Ugandan format (CF/CM + 12 chars)', 400));
  }

  // 1. Find all batches for FIFO deduction
  const batches = await Produce.find({
    produceName,
    branch,
    tonnage: { $gt: 0 },
  }).sort({ createdAt: 1 });

  const totalAvailable = batches.reduce((acc, batch) => acc + batch.tonnage, 0);

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
    if (batch.tonnage >= remainingToDeduct) {
      deducted = remainingToDeduct;
      remainingToDeduct = 0;
    } else {
      deducted = batch.tonnage;
      remainingToDeduct -= batch.tonnage;
    }

    totalAmountDue += deducted * batch.sellingPrice;

    bulkOps.push({
      updateOne: {
        filter: { _id: batch._id },
        update: { $inc: { tonnage: -deducted } },
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
    dateOfDispatch: new Date(),
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

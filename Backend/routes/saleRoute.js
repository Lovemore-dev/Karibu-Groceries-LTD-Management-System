const express = require('express');

const router = express.Router();

const Produce = require('../models/Produce');
const Sale = require('../models/Sale');
const CreditSale = require('../models/CreditSale');
const { protect, restrictTo } = require('../middleware/auth');

// apply protection to all sales routes
router.use(protect);

/**
 * @swagger
 * /api/sales/cash:
 *   post:
 *     summary: Process a new cash sale
 *     tags: [Sales]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [produceName, tonnage]
 *             properties:
 *               produceName: { type: string }
 *               tonnage: { type: number, description: "Must be available in branch inventory" }
 *               buyerName: { type: string }
 *     responses:
 *       201:
 *         description: Cash sale recorded successfully
 *       400:
 *         description: Insufficient inventory or validation error
 */

// Routes for sales
// Cash sale route
router.post('/cash', restrictTo('Manager', 'Sales Agent'), async (req, res) => {
  try {
    const { produceName, tonnage } = req.body;
    // Filter by the agent's specific branch to ensure they can only sell produce from their branch
    // Check if the produce exists in inventory
    const produce = await Produce.findOne({ produceName, branch: req.user.branch });

    // Business rule: Sales agents can only sell produce that exists in their branch's inventory. This ensures proper inventory management and accountability. If the produce does not exist or if the requested tonnage exceeds available stock, the system should prevent the sale and prompt the agent to notify the manager for restocking.
    if (!produce || produce.tonnage < tonnage) {
      return res.status(400).json({
        error: 'Insufficient produce in inventory.',
        notifyManager: true,
        message: `Stock for ${produceName} is low or unavailable. Please notify the manager.`,
      });
    }
    // If all checks pass, create the cash sale
    const calculatedAmount = tonnage * produce.sellingPrice; // Calculate amount paid based on tonnage and selling price
    const newSale = await Sale.create({
      ...req.body,
      // Automatically associate the sale with the logged-in sales agent and current date
      amountPaid: calculatedAmount, // Calculate amount paid based on tonnage and selling price
      saleAgent: req.user.fullName,
      branch: req.user.branch,
      date: new Date(),
      time: new Date().toLocaleTimeString(),
    });

    // reduce tonnage in produce after the sale is done
    produce.tonnage -= tonnage;
    await produce.save();

    return res.status(201).json(newSale);
  } catch (error) {
    return res.status(400).json({ error: 'Failed to create cash sale', message: error });
  }
});

/**
 * @swagger
 * /api/sales/credit:
 *   post:
 *     summary: Process a new credit sale
 *     tags: [Sales]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nationalId, produceName, tonnage]
 *             properties:
 *               nationalId: { type: string, pattern: "^(CF|CM)[A-Z0-9]{12}$", description: "Ugandan NIN format (CF or CM followed by 12 characters)" }
 *               produceName: { type: string }
 *               tonnage: { type: number }
 *               buyerName: { type: string }
 *               dueDate: { type: string, format: date }
 *     responses:
 *       201:
 *         description: Credit sale recorded successfully
 *       400:
 *         description: Invalid NIN or insufficient inventory
 */

// Credit sale route
router.post('/credit', restrictTo('Manager', 'Sales Agent'), async (req, res) => {
  try {
    const { nationalId, produceName, tonnage } = req.body;

    // Check to confirm that NIN is a valid format
    const ninRegex = /^(CF|CM)[A-Z0-9]{12}$/;
    if (!nationalId || !ninRegex.test(nationalId)) {
      return res.status(400).json({ error: 'NIN must follow the format of NIN in Uganda' });
    }

    // Check if the produce exists in inventory before making the sale
    const produce = await Produce.findOne({ produceName, branch: req.user.branch });
    if (!produce || produce.tonnage < tonnage) {
      return res
        .status(400)
        .json({ error: 'Insufficient produce in inventory. Please notify the manager.' });
    }

    // Rule: Use Manager's price and include produceType + dateofDispatch
    const calculatedAmountDue = produce.sellingPrice * tonnage; // Calculate amount due based on tonnage and selling price

    const newCreditSale = await CreditSale.create({
      ...req.body,
      // Automatically associate the sale with the logged-in sales agent and current date
      produceType: produce.produceType,
      amountDue: calculatedAmountDue, // Calculate amount due based on tonnage and selling price
      saleAgent: req.user.fullName,
      branch: req.user.branch,
      dateOfDispatch: new Date(),
    });

    // reduce tonnage in produce after the sale is done
    produce.tonnage -= tonnage;
    await produce.save();

    return res.status(201).json(newCreditSale);
  } catch (error) {
    return res.status(400).json({ error: 'Failed to create credit sale', message: error });
  }
});

/**
 * @swagger
 * /api/sales:
 *   get:
 *     summary: Get sales records (Aggregated for Director, List for Staff)
 *     tags: [Sales]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 cashSales: { type: array, items: { type: object } }
 *                 creditSales: { type: array, items: { type: object } }
 *                 cashAggregations: { type: array, description: "Only returned for Directors" }
 *       500:
 *         description: Server error
 */

// Secure Get Route (Aggregation for Director)
router.get('/', restrictTo('Director', 'Manager', 'Sales Agent'), async (req, res) => {
  try {
    // RULE: Directors should only see totals or aggregations
    if (req.user.role === 'Director') {
      const cashAggregations = await Sale.aggregate([
        { $match: { branch: { $exists: true, $ne: null } } },
        {
          $group: {
            _id: '$branch',
            totalRevenue: { $sum: '$amountPaid' },
            totalTonnage: { $sum: '$tonnage' },
          },
        },
      ]);
      const creditAggregations = await CreditSale.aggregate([
        { $match: { branch: { $exists: true, $ne: null } } },
        {
          $group: {
            _id: '$branch',
            totalOwed: { $sum: '$amountDue' },
            totalTonnage: { $sum: '$tonnage' },
          },
        },
      ]);
      return res.status(200).json({ role: 'Director', cashAggregations, creditAggregations });
    }

    // For managers and agents, show all sales from their branch
    const branch = req.user.branch.trim();
    const query = { branch };
    const cashSales = await Sale.find(query).sort({ createdAt: -1 });
    const creditSales = await CreditSale.find(query).sort({ createdAt: -1 });

    return res.status(200).json({
      cashSales,
      creditSales,
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch sales records' });
  }
});

module.exports = router;

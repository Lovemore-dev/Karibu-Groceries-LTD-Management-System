const express = require('express');

const router = express.Router();
const saleController = require('../controllers/saleController');
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
router.post('/cash', restrictTo('Manager', 'Sales Agent'), saleController.createCashSale);

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
router.post('/credit', restrictTo('Manager', 'Sales Agent'), saleController.createCreditSale);

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
router.get('/', restrictTo('Director', 'Manager', 'Sales Agent'), saleController.getAllSales);

module.exports = router;

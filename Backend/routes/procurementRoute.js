const express = require('express');

const router = express.Router();

const procurementController = require('../controllers/procurementController');

// import authentication middleware
const { protect, restrictTo } = require('../middleware/auth');

// Middleware to ensure only authorized staff see procurements
router.use(protect);

/**
 * @swagger
 * /api/procurements:
 *   get:
 *     summary: Get all procurements
 *     description: Managers see their branch list; Directors see aggregated branch totals.
 *     tags: [Procurements]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 */

// Routes for procurement
router
  .route('/')
  // @desc Get all procurements
  .get(restrictTo('Manager', 'Director'), procurementController.getAllProcurements);

/**
 * @swagger
 * /api/procurements:
 *   post:
 *     summary: Create a procurement (Manager only)
 *     tags: [Procurements]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               produceName: { type: string }
 *               tonnage: { type: number, description: "Must be >= 1000kg" }
 *               cost: { type: number }
 *     responses:
 *       201:
 *         description: Created
 *       400:
 *         description: Validation error
 */
// Middleware to handle every route that is restricted to manager
router.use(restrictTo('Manager'));

router
  .route('/')
  // @desc Create procurement
  // Only manager can create procurements
  .post(procurementController.createProcurement);

/**
 * @swagger
 * /api/procurements/{id}:
 *   get:
 *     summary: Get a single procurement
 *     tags: [Procurements]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Procurement found
 *       403:
 *         description: Access denied (wrong branch)
 */

// Routes for specific procurement by ID
router
  .route('/:id')
  // @desc Get a single procurement
  .get(procurementController.getProcurement)

  /**
   * @swagger
   * /api/procurements/{id}:
   *   patch:
   *     summary: Update a procurement
   *     tags: [Procurements]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Updated
   */

  // @desc Update a procurement
  .patch(procurementController.updateProcurement)

  /**
   * @swagger
   * /api/procurements/{id}:
   *   delete:
   *     summary: Delete a procurement
   *     tags: [Procurements]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Deleted
   */

  // @desc Delete a procurement
  .delete(procurementController.deleteProcurement);

module.exports = router;

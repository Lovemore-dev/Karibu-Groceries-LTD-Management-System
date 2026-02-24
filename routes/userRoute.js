/* eslint-disable no-console */
const express = require('express');

const router = express.Router();
const userController = require('../controllers/userController');
const { protect, restrictTo } = require('../middleware/auth');

/**
 * @swagger
 * /api/user/login:
 *   post:
 *     summary: Authenticate user and get token
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Authentication failed
 */
// login endpoint
router.post('/login', userController.loginUser);

/**
 * @swagger
 * /api/user/register:
 *   post:
 *     summary: Register a new user (Director only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fullName
 *               - username
 *               - email
 *               - password
 *             properties:
 *               fullName: { type: string }
 *               username: { type: string }
 *               email: { type: string }
 *               password: { type: string }
 *               role: { type: string, enum: [Director, Manager, Sales] }
 *               branch: { type: string }
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Validation error or user already exists
 */

// User Management */
router.post('/register', protect, restrictTo('Director'), userController.registerUser);

/**
 * @swagger
 * /api/user:
 *   get:
 *     summary: Get all users (Director only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of users retrieved successfully
 */
// Get all users (for Director)
router.get('/', protect, restrictTo('Director'), userController.getAllUsers);

/**
 * @swagger
 * /api/user/director/totals:
 *   get:
 *     summary: Get financial totals for Director view
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Revenue and credit stats
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 revenue: { type: number }
 *                 outstandingCredit: { type: number }
 *                 reportGeneratedAt: { type: string, format: date-time }
 */
// This route serves the "Director's View"
router.get('/director/totals', protect, restrictTo('Director'), userController.getDirectorTotals);
module.exports = router;

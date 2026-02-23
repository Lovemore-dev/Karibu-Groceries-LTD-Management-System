/* eslint-disable no-console */
const express = require('express');

const router = express.Router();

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Sale = require('../models/Sale');
const CreditSale = require('../models/CreditSale');
const { protect, restrictTo } = require('../middleware/auth');

// Public Routes
/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User manager and authentication
 */

/**
 * @swagger
 * /api/user/login:
 *   post:
 *     summary: Authenticate user and get token
 *     tags: [Users]
 *     requestBody: true
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
router.post('/login', async (req, res) => {
  const { username, email, password } = req.body; // username, email can be either username or email
  const identifier = username || email; // Use whichever is provided for authentication
  try {
    // Validation to ensure either username or email is provided
    if (!identifier || !password) {
      return res.status(400).json({
        error: 'Missing credentials.',
        message: 'Please provide either a username or email along with the password.',
      });
    }

    const cleanIdentifier = identifier.trim().toLowerCase(); // Normalize the identifier for consistent querying
    // Logic to check the database for user
    const user = await User.findOne({
      $or: [{ email: cleanIdentifier }, { username: cleanIdentifier }],
    });
    // If user is not found, return error
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({
        error: 'Authentication failed.',
        message: 'The user does not exist in our records.',
      });
    }

    // // Check password match
    // const isMatch = await bcrypt.compare(password, user.password);
    // if (!isMatch) {
    //   return res.status(401).json({
    //     error: 'Authentication failed.',
    //     message: 'Invalid credentials provided.',
    //   });
    // }
    console.log(`User found, attempting to sign token for:`, user.username);

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' },
    );
    console.log(`Token generated successfully`);

    // If authentication is successful, return success response
    return res.status(200).json({
      message: 'Login successful.',
      token, // Send the token to the client for use in authenticated requests
      user: {
        id: user.id,
        fullName: user.fullName,
        username: user.username,
        email: user.email,
        role: user.role,
        branch: user.branch,
      },
    });
  } catch (error) {
    return res.status(500).json({
      error: 'Server error during authentication.',
      message: error.message,
    });
  }
});

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
router.post('/register', protect, restrictTo('Director'), async (req, res) => {
  try {
    const { fullName, username, email, password, role, branch } = req.body;

    // Check if user with the same email or username already exists
    const userExists = await User.findOne({ $or: [{ email }, { username }] });
    if (userExists) {
      return res
        .status(400)
        .json({ error: 'A user with the same email or username already exists.' });
    }

    // Hash the password before saving
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create a new user with the hashed password
    const newUser = await User.create({
      fullName,
      username,
      email,
      password: hashedPassword,
      role,
      branch,
    });

    return res.status(201).json({
      message: 'User registered successfully.',
      user: {
        username: newUser.username,
        email: newUser.email,
        role: newUser.role,
        branch: newUser.branch,
      },
    });
  } catch (error) {
    return res.status(400).json({ error: 'Failed to register user', message: error.message });
  }
});

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
router.get('/', protect, restrictTo('Director'), async (req, res) => {
  try {
    const users = await User.find().select('-password'); // Don't send passwords back
    return res.status(200).json(users);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch users', message: error.message });
  }
});

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
router.get('/director/totals', protect, restrictTo('Director'), async (req, res) => {
  try {
    // Aggregate Total Revenue from Cash Sales
    const totalCash = await Sale.aggregate([
      { $group: { _id: null, total: { $sum: '$amountPaid' } } },
    ]);

    // Aggregate Total Credit Owed
    const totalCredit = await CreditSale.aggregate([
      { $group: { _id: null, total: { $sum: '$amountDue' } } },
    ]);

    // Fix: Using standard logic instead of optional chaining if parser is failing
    const revenueValue = totalCash.length > 0 ? totalCash[0].total : 0;
    const creditValue = totalCredit.length > 0 ? totalCredit[0].total : 0;

    res.status(200).json({
      revenue: revenueValue,
      outstandingCredit: creditValue,
      reportGeneratedAt: new Date(),
    });
  } catch (error) {
    res.status(500).json({ error: 'Reporting error', message: error.message });
  }
});
module.exports = router;

const express = require('express');

const router = express.Router();

const bcrypt = require('bcryptjs');
const User = require('../models/User');

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
    if (!user) {
      return res.status(401).json({
        error: 'Authentication failed.',
        message: 'The user does not exist in our records.',
      });
    }

    // Check password match
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        error: 'Authentication failed.',
        message: 'Invalid credentials provided.',
      });
    }
    // If authentication is successful, return success response
    return res.status(200).json({
      message: 'Login successful.',
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

// User Management */
router.post('/register', async (req, res) => {
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
// Get all users (for IT Admin)
router.get('/', async (req, res) => {
  try {
    const users = await User.find().select('-password'); // Don't send passwords back
    return res.status(200).json(users);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch users', message: error.message });
  }
});

module.exports = router;

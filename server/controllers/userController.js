const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Sale = require('../models/Sale');
const CreditSale = require('../models/CreditSale');
const catchAsync = require('../utils/catchAsync');
const KGLError = require('../utils/kglError');

// @desc Authenticate user & get token
exports.loginUser = catchAsync(async (req, res, next) => {
  const { username, email, password } = req.body;
  const identifier = username || email;

  if (!identifier || !password) {
    return next(new KGLError('Please provide a username/email and password', 400));
  }

  const cleanIdentifier = identifier.trim().toLowerCase();

  // Find user and explicitly select password if it's hidden by default in schema
  const user = await User.findOne({
    $or: [{ email: cleanIdentifier }, { username: cleanIdentifier }],
  });

  if (!user || !(await bcrypt.compare(password, user.password))) {
    return next(new KGLError('Incorrect username/email or password', 401));
  }

  // Generate JWT token
  const token = jwt.sign(
    { id: user._id, username: user.username, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '1h' },
  );

  return res.status(200).json({
    status: 'success',
    token,
    user: {
      id: user._id,
      fullName: user.fullName,
      username: user.username,
      email: user.email,
      role: user.role,
      branch: user.branch,
    },
  });
});

// @desc Register a new user (Director only)
exports.registerUser = catchAsync(async (req, res, next) => {
  // Business rule: only Directors can register users
  if (!req.user || req.user.role !== 'Director') {
    return next(new KGLError('Only Directors can register users', 403));
  }

  const { fullName, username, email, password, role, branch } = req.body;

  const userExists = await User.findOne({ $or: [{ email }, { username }] });
  if (userExists) {
    return next(new KGLError('A user with that email or username already exists', 400));
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const newUser = await User.create({
    fullName,
    username,
    email,
    password: hashedPassword,
    role,
    branch,
  });

  return res.status(201).json({
    status: 'success',
    data: {
      username: newUser.username,
      role: newUser.role,
      branch: newUser.branch,
    },
  });
});

// @desc Update a user (Director only)
exports.updateUser = catchAsync(async (req, res, next) => {
  // 1. Check permissions
  if (!req.user || req.user.role !== 'Director') {
    return next(new KGLError('Only Directors can update users', 403));
  }

  // 2. Filter out password updates (should be a separate "reset password" flow)
  const { password, ...updateData } = req.body;

  const user = await User.findByIdAndUpdate(req.params.id, updateData, {
    new: true,
    runValidators: true,
  });

  if (!user) {
    return next(new KGLError('No user found with that ID', 404));
  }

  return res.status(200).json({
    status: 'success',
    data: user,
  });
});

// @desc Delete a user (Director only)
// @desc Remove a user (Director only)
exports.removeUser = catchAsync(async (req, res, next) => {
  // 1. Business rule: only Directors can remove users
  if (!req.user || req.user.role !== 'Director') {
    return next(new KGLError('Only Directors can remove users', 403));
  }

  const user = await User.findByIdAndDelete(req.params.id);

  if (!user) {
    return next(new KGLError('No user found with that ID', 404));
  }

  return res.status(200).json({
    status: 'success',
    message: 'User removed successfully',
  });
});
// @desc Get financial totals for Director view
exports.getDirectorTotals = catchAsync(async (req, res, next) => {
  const totalCash = await Sale.aggregate([
    { $group: { _id: null, total: { $sum: '$amountPaid' } } },
  ]);

  if (!totalCash) return next(new KGLError('Could not calculate revenue'));
  const totalCredit = await CreditSale.aggregate([
    { $group: { _id: null, total: { $sum: '$amountDue' } } },
  ]);
  if (!totalCash) return next(new KGLError('Could not calculate total credit'));

  return res.status(200).json({
    status: 'success',
    data: {
      revenue: totalCash.length > 0 ? totalCash[0].total : 0,
      outstandingCredit: totalCredit.length > 0 ? totalCredit[0].total : 0,
      reportGeneratedAt: new Date(),
    },
  });
});

// @desc Get all users
exports.getAllUsers = catchAsync(async (req, res, next) => {
  const users = await User.find().select('-password');
  if (!users) return next(new KGLError('Could load all users'));
  return res.status(200).json({
    status: 'success',
    results: users.length,
    data: users,
  });
});

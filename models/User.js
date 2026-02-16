const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
    },
    username: {
      type: String,
      unique: true,
      required: [true, 'Username is required'],
      trim: true,
      lowercase: true,
    },
    email: {
      type: String,
      unique: true,
      required: [true, 'Email address is required'],
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
    },
    role: {
      type: String,
      required: [true, 'User role is required'],
      enum: {
        values: ['IT Admin', 'Director', 'Manager', 'Sales Agent'],
        message: '{VALUE} is not a valid role',
      },
    },
    branch: {
      type: String,
      required: [true, 'Branch location is required'],
      // KGL has two branches: Maganjo and Matugga
      // I am using headquarters to cover for the director who oversees both branches
      enum: {
        values: ['Maganjo', 'Matugga', 'Headquarters'],
        message: '{VALUE} is not a valid branch',
      },
    },
    status: {
      type: String,
      enum: ['Active', 'Pending'],
      default: 'Pending',
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model('User', userSchema);

const mongoose = require('mongoose');

const produceSchema = new mongoose.Schema(
  {
    // Name of produce: alpha-numeric
    produceName: {
      type: String,
      required: [true, 'Produce name is required'],
      match: [/^[a-zA-Z0-9 ]+$/, 'Produce name must be alpha-numeric'],
    },
    // Type: alphabets only, not less than 2 characters, not empty
    produceType: {
      type: String,
      required: [true, 'Produce type is required'],
      minlength: [2, 'Produce type must be at least 2 characters'],
      match: [/^[A-Za-z ]+$/, 'Produce type must contain alphabets only'],
    },
    // Tonnage: numeric, not empty, not less than 3 characters (e.g., 100kg+)
    tonnage: {
      type: Number,
      required: [true, 'Tonnage is required'],
      min: [100, 'Tonnage must be at least 3 digits (100kg)'],
    },
    // Cost: numeric, not empty, not less than 5 characters (e.g., 10,000+)
    cost: {
      type: Number,
      required: [true, 'Cost is required'],
      min: [10000, 'Cost must be at least 5 digits (10,000 UgX)'],
    },
    // Name of dealer: alpha-numeric, not empty, not less than 2 characters
    dealerName: {
      type: String,
      required: [true, 'Dealer name is required'],
      minlength: [2, 'Dealer name must be at least 2 characters'],
      match: [/^[a-zA-Z0-9 ]+$/, 'Dealer name must be alpha-numeric'],
    },
    // Branch Name: Already known (Maganjo or Matugga)
    branch: {
      type: String,
      required: true,
      enum: ['Maganjo', 'Matugga'],
    },
    // Contact: valid phone numbers
    contact: {
      type: String,
      required: [true, 'Contact is required'],
      match: [/^(\+256|256|0)7[0-9]{8}$/, 'Contact must be a valid phone number in Uganda'],
    },
    // Price to be sold at
    sellingPrice: {
      type: Number,
      required: [true, 'Selling price is required'],
      min: [1, 'Selling price must be greater than 0'],
    },
    // Date and Time: Not empty
    // Using timestamps ensures these are automatically generated and not empty
  },
  { timestamps: true },
);

module.exports = mongoose.model('Produce', produceSchema);

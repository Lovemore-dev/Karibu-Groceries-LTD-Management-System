const mongoose = require('mongoose');

const saleSchema = new mongoose.Schema(
  {
    // Fields for sales
    produceName: {
      type: String,
      required: [true, `Produce name is required`],
      match: [/^[a-zA-Z0-9 ]+$/, 'Produce name should be alpha-numeric'],
    },
    tonnage: {
      type: Number,
      required: [true, `Tonnage is required`],
    },
    amountPaid: {
      type: Number,
      required: [true, `The amount paid is required`],
      min: [10000, `The minimum amount paid must be 10,000 UGX`],
    },
    buyersName: {
      type: String,
      required: [true, `Buyer's name is required`],
      match: [/^[a-zA-Z0-9 ]+$/, `Buyer's name should be alpha-numeric`],
      minLength: [2, `Buyer's name must not be less than 2 characters`],
    },
    saleAgent: {
      type: String,
      required: [true, `Sales agent's name is required`],
      match: [/^[a-zA-Z0-9 ]+$/, `Sales agent's name should be alpha-numeric`],
      minLength: [2, `Sales agent's name must not be less than 2 characters`],
    },
    branch: {
      type: String,
      required: [true, 'A sale must belong to a branch'],
    },
    // Explicit date and time fields
    date: {
      type: Date,
      required: [true, `Date of sale is required`],
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model(`Sale`, saleSchema);

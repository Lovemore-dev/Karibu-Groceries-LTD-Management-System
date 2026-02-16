const mongoose = require('mongoose');

const creditSaleSchema = new mongoose.Schema(
  {
    // Fields for creditSales
    // Buyer's name is alpha--numeric, not less than 2 characters
    buyersName: {
      type: String,
      required: [true, `Buyer's name is required`],
      match: [/^[a-zA-Z0-9 ]+$/, `Buyer's name should be alpha-numeric`],
      minLength: [2, `Buyer's name must not be less than 2 characters`],
    },
    // Valid format of NIN
    nationalId: {
      type: String,
      required: [true, `NIN is required`],
      uppercase: true,
      //   Matches the format of NIN in Uganda: starts with 'CF' or 'CM' followed by 12 alphanumeric characters
      match: [/^(CF|CM)[A-Z0-9]{12}$/, `Follow the format of NIN in Uganda`],
    },
    // Contact: valid phone numbers
    contact: {
      type: String,
      required: [true, 'Contact is required'],
      match: [/^(\+256|256|0)7[0-9]{8}$/, `Contact must be a valid phone number in Uganda`],
    },
    // Amount due in ugx should not be less than 5 characters
    amountDue: {
      type: Number,
      required: [true, `The amount due is required`],
      min: [10000, `The minimum amount due must be 10,000 UGX`],
    },
    // Sales agent details should be alpha-numeric and not less than 2 characters
    saleAgent: {
      type: String,
      required: [true, `Sales agent's name is required`],
      match: [/^[a-zA-Z0-9 ]+$/, `Sales agent's name should be alpha-numeric`],
      minLength: [2, `Sales agent's name must not be less than 2 characters`],
    },
    // Due date should be a valid date and not empty
    dueDate: {
      type: Date,
      required: [true, 'Due date is required'],
      validate: {
        validator(value) {
          // Check if the due date is at least today or in the future
          return value >= new Date().setHours(0, 0, 0, 0);
        },
        message: 'The due date cannot be in the past',
      },
    },
    // Produce name should be alpha-numeric and not less than 2 characters and not empty
    produceName: {
      type: String,
      required: [true, `Produce name is required`],
      match: [/^[a-zA-Z0-9 ]+$/, 'Produce name should be alpha-numeric'],
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
      required: [true, `Tonnage is required`],
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model(`CreditSale`, creditSaleSchema);

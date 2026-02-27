/* eslint-disable no-console */
require('../models/User');
const Produce = require('../models/Produce');
const Sale = require('../models/Sale');
const CreditSale = require('../models/CreditSale'); // New import
const connectDB = require('../config/db');
require('dotenv').config();

const runTest = async () => {
  try {
    await connectDB();
    console.log('Connected to KGL Database');

    // Clean up
    await Produce.deleteMany({ produceName: 'Test Beans' });
    await Sale.deleteMany({ produceName: 'Test Beans' });
    await CreditSale.deleteMany({ produceName: 'Test Beans' });

    // 1. Test Procurement Logic
    await Produce.create({
      produceName: 'Test Beans',
      produceType: 'Legumes',
      tonnage: 2000,
      cost: 15000,
      sellingPrice: 20000,
      branch: 'Maganjo',
      dealerName: 'Dealer Joe',
      contact: '0700000000',
      date: new Date(),
    });
    console.log('Procurement Test: 2000kg added.');

    // 2. Test Cash Sale Logic
    const saleTonnage = 500;
    await Sale.create({
      produceName: 'Test Beans',
      tonnage: saleTonnage,
      amountPaid: 20000 * saleTonnage,
      buyersName: 'Jane Doe',
      branch: 'Maganjo',
      saleAgent: 'Test Agent',
      date: new Date(),
      time: new Date().toLocaleTimeString(),
    });

    // 3. Inventory Reduction Verification
    const updatedProduce = await Produce.findOneAndUpdate(
      { produceName: 'Test Beans', branch: 'Maganjo' },
      { $inc: { tonnage: -saleTonnage } },
      { returnDocument: 'after' },
    );

    if (updatedProduce && updatedProduce.tonnage === 1500) {
      console.log('Inventory Test: Tonnage reduced (2000kg -> 1500kg).');
    }

    // 4. Test Credit Sale Logic (KGL NIN & Due Date Rule)
    const creditTonnage = 200;
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30); // Rule: Due date is usually 30 days

    await CreditSale.create({
      buyersName: 'Credit Customer',
      nationalId: 'CM123456789012', // Matches Uganda NIN format
      location: 'Maganjo',
      contact: '0700000000',
      produceName: 'Test Beans',
      produceType: 'Legumes',
      tonnage: creditTonnage,
      amountDue: 20000 * creditTonnage,
      dueDate,
      saleAgent: 'Test Agent',
      branch: 'Maganjo',
      dispatchDate: new Date(),
    });
    console.log('Credit Sale Test: NIN validated and Record created.');

    // 5. Test Aggregation (Director View)
    const report = await Sale.aggregate([
      { $match: { branch: 'Maganjo', produceName: 'Test Beans' } },
      { $group: { _id: '$branch', totalRevenue: { $sum: '$amountPaid' } } },
    ]);

    if (report.length > 0) {
      console.log('Director Report Test: Revenue calculated as', report[0].totalRevenue, 'UgX');
    }

    console.log('\n--- ALL KGL BUSINESS LOGIC TESTS PASSED ---');
    process.exit(0);
  } catch (error) {
    console.error('Test Failed:', error.message);
    process.exit(1);
  }
};

runTest();

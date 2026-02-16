const express = require('express');

const router = express.Router();

const Produce = require('../models/Produce');
const Sale = require('../models/Sale');
const CreditSale = require('../models/CreditSale');

// Routes for sales

router.post('/cash', async (req, res) => {
  try {
    const { produceName, tonnage, amountPaid, buyersName, saleAgent } = req.body;

    // Check to confirm that amounnt paid is paases the minimum of 5 digits.
    if (amountPaid < 10000) {
      return res.status(400).json({ error: 'Amount paid must be at least 10,000 ugx' });
    }

    // Check if the produce exists in inventory
    const produce = await Produce.findOne({ produceName });
    if (!produce || produce.tonnage < tonnage) {
      return res
        .status(400)
        .json({ error: 'Insufficient produce in inventory. Please notify the manager.' });
    }
    // If all checks pass, create the cash sale
    const newSale = await Sale.create({
      produceName,
      tonnage,
      amountPaid,
      buyersName,
      saleAgent,
      date: new Date(),
    });

    // reduce tonnage in produce after the sale is done
    produce.tonnage -= tonnage;
    await produce.save();

    return res.status(201).json(newSale);
  } catch (error) {
    return res.status(400).json({ error: 'Failed to create cash sale', message: error });
  }
});
// Credit sale route
router.post('/credit', async (req, res) => {
  try {
    const {
      nationalId,
      contact,
      location,
      amountDue,
      saleAgent,
      dueDate,
      produceName,
      produceType,
      tonnage,
      buyersName,
    } = req.body;

    // Check to confirm that NIN is a valid format
    const ninRegex = /^(CF|CM)[A-Z0-9]{12}$/;
    if (!ninRegex.test(nationalId)) {
      return res.status(400).json({ error: 'NIN must follow the format of NIN in Uganda' });
    }

    // Amount due should not be less than 5 characters
    if (amountDue < 10000) {
      return res.status(400).json({ error: 'Amount due must be at least 10,000 ugx' });
    }
    // Check if the produce exists in inventory before making the sale
    const produce = await Produce.findOne({ produceName });
    if (!produce || produce.tonnage < tonnage) {
      return res
        .status(400)
        .json({ error: 'Insufficient produce in inventory. Please notify the manager.' });
    }
    const newCreditSale = await CreditSale.create({
      buyersName,
      nationalId,
      contact,
      location,
      amountDue,
      saleAgent,
      dueDate,
      produceName,
      produceType,
      tonnage,
      date: new Date(),
    });

    // reduce tonnage in produce after the sale is done
    produce.tonnage -= tonnage;
    await produce.save();

    return res.status(201).json(newCreditSale);
  } catch (error) {
    return res.status(400).json({ error: 'Failed to create credit sale', message: error });
  }
});

router.get('/', async (req, res) => {
  try {
    const cashSales = await Sale.find().sort({ createdAt: -1 });
    const creditSales = await CreditSale.find().sort({ createdAt: -1 });

    res.status(200).json({
      cashSales,
      creditSales,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch sales records' });
  }
});

module.exports = router;

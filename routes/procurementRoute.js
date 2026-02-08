const express = require('express');

const router = express.Router();

router.route('/').get((req, res) => {
  res.status(200).json({ message: 'I am getting procurements' });
});

router.route('/').post((req, res) => {
  res.status(200).json({ message: 'I am adding procurement' });
});

router.route('/:id').get((req, res) => {
  res.status(200).json({ message: `I am getting procurement for ${req.params.id}` });
});


router.route('/:id').patch((req, res) => {
  res.status(200).json({ message: `I am updating procurement for ${req.params.id}` });
});

router.route('/:id').delete((req, res) => {
  res.status(200).json({ message: `I am deleting procurement for ${req.params.id}` });
});

module.exports = router;

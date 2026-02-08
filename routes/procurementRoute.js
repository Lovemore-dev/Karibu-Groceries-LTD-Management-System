const express = require('express');

const router = express.Router();
const {
  getProcurements,
  getProcurement,
  createProcurement,
  updateProcurement,
  deleteProcurement,
} = require('../controllers/procurementController');

router.route('/').get(getProcurements);

router.route('/:id').get(getProcurement);

router.route('/').post(createProcurement);

router.route('/:id').patch(updateProcurement);

router.route('/:id').delete(deleteProcurement);

module.exports = router;

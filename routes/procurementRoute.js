const express = require('express');

const router = express.Router();
const {
  getProcurements,
  getProcurement,
  createProcurement,
  updateProcurement,
  deleteProcurement,
} = require('../controllers/procurementController');

router.route('/').get(getProcurements).post(createProcurement);
router.route('/:id').get(getProcurement).patch(updateProcurement).delete(deleteProcurement);

module.exports = router;

import express from 'express';
import {
  createBooking,
  getBookings,
  getBooking,
  updateBooking,
  deleteBooking,
  submitTransferProof
} from '../controllers/bookingController.js';
import { protect, admin } from '../middleware/auth.js';

const router = express.Router();

router.route('/').post(createBooking).get(protect, admin, getBookings);
router.post('/transfer-proof', submitTransferProof);
router.route('/reference/:reference').get(getBooking);
router.route('/:id').patch(protect, admin, updateBooking).delete(protect, admin, deleteBooking);

export default router;
import express from 'express';
import {
  createBooking,
  getBookings,
  getBooking,
  updateBooking
} from '../controllers/bookingController.js';
import { protect, admin } from '../middleware/auth.js';

const router = express.Router();

router.route('/').post(createBooking).get(protect, admin, getBookings);
router.route('/:reference').get(getBooking);
router.route('/:id').patch(protect, admin, updateBooking);

export default router;
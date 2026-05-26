import express from 'express';
import { protect, admin, allowRoles } from '../middleware/auth.js';
import {
  createStaff,
  listStaff,
  getMyStaffProfile,
  updateStaff,
  staffSummary
} from '../controllers/staffController.js';

const router = express.Router();

router.get('/me', protect, getMyStaffProfile);
router.get('/summary', protect, allowRoles('admin', 'accountant', 'manager'), staffSummary);
router.get('/', protect, allowRoles('admin', 'accountant', 'manager'), listStaff);
router.post('/', protect, admin, createStaff);
router.patch('/:id', protect, admin, updateStaff);

export default router;
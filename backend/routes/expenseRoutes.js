import express from 'express';
import { protect, allowRoles } from '../middleware/auth.js';
import {
  createExpense,
  listExpenses,
  updateExpense,
  deleteExpense,
  erpSummary
} from '../controllers/expenseController.js';

const router = express.Router();

router.get('/summary', protect, allowRoles('admin', 'accountant', 'manager'), erpSummary);
router.get('/', protect, allowRoles('admin', 'accountant', 'manager'), listExpenses);
router.post('/', protect, allowRoles('admin', 'accountant', 'manager'), createExpense);
router.patch('/:id', protect, allowRoles('admin', 'accountant'), updateExpense);
router.delete('/:id', protect, allowRoles('admin', 'accountant'), deleteExpense);

export default router;

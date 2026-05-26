import express from 'express';
import { protect, allowRoles } from '../middleware/auth.js';
import {
  createInventoryItem,
  listInventoryItems,
  updateInventoryItem,
  moveInventoryStock,
  deleteInventoryItem,
  inventoryMovements,
  inventorySummary
} from '../controllers/inventoryController.js';

const router = express.Router();

router.get('/summary', protect, allowRoles('admin', 'accountant', 'manager', 'housekeeping', 'maintenance'), inventorySummary);
router.get('/movements', protect, allowRoles('admin', 'accountant', 'manager', 'housekeeping', 'maintenance'), inventoryMovements);
router.get('/', protect, allowRoles('admin', 'accountant', 'manager', 'housekeeping', 'maintenance'), listInventoryItems);
router.post('/', protect, allowRoles('admin', 'manager'), createInventoryItem);
router.patch('/:id', protect, allowRoles('admin', 'manager'), updateInventoryItem);
router.post('/:id/move', protect, allowRoles('admin', 'manager', 'housekeeping', 'maintenance'), moveInventoryStock);
router.delete('/:id', protect, allowRoles('admin', 'manager'), deleteInventoryItem);

export default router;

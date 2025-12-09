
import express from 'express';
import {
  getRooms,
  getRoom,
  createRoom,
  updateRoom,
  deleteRoom
} from '../controllers/roomController.js';
import { protect, admin } from '../middleware/auth.js';

const router = express.Router();

router.route('/').get(getRooms).post(protect, admin, createRoom);
router.route('/:id').get(getRoom).put(protect, admin, updateRoom).delete(protect, admin, deleteRoom);

export default router;
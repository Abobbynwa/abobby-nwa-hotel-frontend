import express from 'express';
import { sendContactMessage, getContactMessages, replyContactMessage } from '../controllers/contactController.js';
import { protect, admin } from '../middleware/auth.js';

const router = express.Router();

router.post('/', sendContactMessage);
router.get('/', protect, admin, getContactMessages);
router.post('/:id/reply', protect, admin, replyContactMessage);

export default router;

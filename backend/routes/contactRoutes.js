import express from 'express';
import { sendContactMessage, getContactMessages, replyContactMessage, sendAdminMessage } from '../controllers/contactController.js';
import { protect, admin } from '../middleware/auth.js';

const router = express.Router();

router.post('/', sendContactMessage);
router.get('/', protect, admin, getContactMessages);
router.post('/admin/send', protect, admin, sendAdminMessage);
router.post('/:id/reply', protect, admin, replyContactMessage);

export default router;

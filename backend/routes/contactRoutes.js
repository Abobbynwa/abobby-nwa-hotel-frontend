import express from 'express';
import {
  sendContactMessage,
  getContactMessages,
  replyContactMessage,
  sendAdminMessage,
  moveContactToTrash,
  restoreContactFromTrash,
  permanentlyDeleteContact,
  testAdminEmail
} from '../controllers/contactController.js';
import { protect, admin } from '../middleware/auth.js';

const router = express.Router();

router.post('/', sendContactMessage);
router.get('/', protect, admin, getContactMessages);
router.post('/admin/send', protect, admin, sendAdminMessage);
router.post('/admin/test-email', protect, admin, testAdminEmail);
router.post('/:id/reply', protect, admin, replyContactMessage);
router.patch('/:id/trash', protect, admin, moveContactToTrash);
router.patch('/:id/restore', protect, admin, restoreContactFromTrash);
router.delete('/:id/permanent', protect, admin, permanentlyDeleteContact);

export default router;

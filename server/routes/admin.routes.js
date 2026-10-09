import express from 'express';
import {
  getDashboard,
  getAlerts,
  getHealth,
  getAllAccounts,
} from '../controllers/admin.controller.js';
import { protect, admin } from '../middleware/auth.js';

const router = express.Router();

router.get('/', protect, admin, getDashboard);
router.get('/alerts', protect, admin, getAlerts);
router.get('/health', protect, admin, getHealth);
router.get('/accounts', protect, admin, getAllAccounts);

export default router;

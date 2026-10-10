import express from 'express';
import {
  createBorrowRequest,
  getIncomingRequests,
  getMyBorrows,
  getLendingHistory,
  acceptRequest,
  rejectRequest,
  signalReturn,
  confirmReturn,
  payDeposit,
  confirmDepositReceived,
  rejectDepositPayment,
  confirmDepositReturnSent,
  acknowledgeDepositReturn,
  payFine,
  confirmFineReceived,
  rejectFinePayment,
  rateBorrower,
  rateOwnerAndItem,
  getFinancialSummary,
} from '../controllers/borrow.controller.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/', protect, createBorrowRequest);
router.get('/mine', protect, getMyBorrows);
router.get('/incoming', protect, getIncomingRequests);
router.get('/lending', protect, getLendingHistory);
router.get('/financial', protect, getFinancialSummary);

router.put('/:id/accept', protect, acceptRequest);
router.put('/:id/reject', protect, rejectRequest);
router.put('/:id/signal-return', protect, signalReturn);
router.put('/:id/confirm-return', protect, confirmReturn);

router.put('/:id/pay-deposit', protect, payDeposit);
router.put('/:id/confirm-deposit', protect, confirmDepositReceived);
router.put('/:id/reject-deposit', protect, rejectDepositPayment);
router.put('/:id/return-deposit', protect, confirmDepositReturnSent);
router.put('/:id/acknowledge-deposit-return', protect, acknowledgeDepositReturn);
router.put('/:id/pay-fine', protect, payFine);
router.put('/:id/confirm-fine', protect, confirmFineReceived);
router.put('/:id/reject-fine', protect, rejectFinePayment);

router.put('/:id/rate-borrower', protect, rateBorrower);
router.put('/:id/rate-owner-item', protect, rateOwnerAndItem);

export default router;

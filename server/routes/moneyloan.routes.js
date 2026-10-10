import express from 'express';
import {
  createLoanRequest,
  getAvailableLenders,
  getMyLoanRequests,
  getIncomingLoanRequests,
  getLendingHistory,
  acceptLoan,
  rejectLoan,
  reportDisbursement,
  confirmDisbursement,
  repayLoan,
  confirmRepayment,
  rateLender,
  rateBorrower,
  getLoanFinancialSummary
} from '../controllers/moneyloan.controller.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/lenders', getAvailableLenders);
router.get('/mine', getMyLoanRequests);
router.get('/incoming', getIncomingLoanRequests);
router.get('/lending', getLendingHistory);
router.get('/financial', getLoanFinancialSummary);

router.post('/', createLoanRequest);

router.put('/:id/accept', acceptLoan);
router.put('/:id/reject', rejectLoan);
router.put('/:id/report-disbursement', reportDisbursement);
router.put('/:id/confirm-disbursement', confirmDisbursement);
router.put('/:id/repay', repayLoan);
router.put('/:id/confirm-repay', confirmRepayment);
router.put('/:id/rate-lender', rateLender);
router.put('/:id/rate-borrower', rateBorrower);

export default router;

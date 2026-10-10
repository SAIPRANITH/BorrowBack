import assert from 'node:assert/strict';
import test from 'node:test';
import {
  isDepositReadyForAcceptance,
  resolveDepositStatus,
  transitionDepositStatus,
} from '../utils/depositWorkflow.js';
import { transitionMoneyLoanStatus } from '../utils/moneyLoanWorkflow.js';
import {
  resolveFinePaymentStatus,
  transitionFinePaymentStatus,
} from '../utils/finePaymentWorkflow.js';
import { calculateFine } from '../utils/fineCalculator.js';

const borrow = (overrides = {}) => ({
  status: 'active',
  depositAmount: 250,
  depositPaid: false,
  ...overrides,
});

test('deposit lifecycle requires owner confirmation and borrower acknowledgement', () => {
  const record = borrow();
  assert.equal(transitionDepositStatus(record, 'report_payment'), 'payment_pending');

  record.depositStatus = 'payment_pending';
  assert.equal(transitionDepositStatus(record, 'report_payment'), undefined);
  assert.equal(transitionDepositStatus(record, 'confirm_payment'), 'held');

  record.depositStatus = 'held';
  record.status = 'returned';
  assert.equal(transitionDepositStatus(record, 'complete_return'), undefined);
  record.status = 'active';
  assert.equal(transitionDepositStatus(record, 'complete_return'), 'return_pending');

  record.status = 'returned';
  record.depositStatus = 'return_pending';
  assert.equal(transitionDepositStatus(record, 'send_deposit_return'), 'return_sent');
  record.depositStatus = 'return_sent';
  assert.equal(transitionDepositStatus(record, 'acknowledge_deposit_return'), 'returned');
});

test('a deposit is paid and confirmed before the owner can accept a request', () => {
  const record = borrow({ status: 'pending' });
  assert.equal(isDepositReadyForAcceptance(record), false);
  assert.equal(transitionDepositStatus(record, 'accept_request'), undefined);
  assert.equal(transitionDepositStatus(record, 'report_payment'), 'payment_pending');

  record.depositStatus = 'payment_pending';
  assert.equal(isDepositReadyForAcceptance(record), false);
  assert.equal(transitionDepositStatus(record, 'confirm_payment'), 'held');

  record.depositStatus = 'held';
  assert.equal(isDepositReadyForAcceptance(record), true);
  assert.equal(transitionDepositStatus(record, 'accept_request'), 'active');
});

test('rejected requests return confirmed deposits through both parties', () => {
  const record = borrow({ status: 'pending', depositStatus: 'held', depositPaid: true });
  assert.equal(transitionDepositStatus(record, 'reject_request'), 'return_pending');

  record.status = 'rejected';
  record.depositStatus = 'return_pending';
  assert.equal(transitionDepositStatus(record, 'send_deposit_return'), 'return_sent');
  record.depositStatus = 'return_sent';
  assert.equal(transitionDepositStatus(record, 'acknowledge_deposit_return'), 'returned');
});

test('an unresolved deposit report blocks request rejection', () => {
  const record = borrow({ status: 'pending', depositStatus: 'payment_pending' });
  assert.equal(transitionDepositStatus(record, 'reject_request'), undefined);
  assert.equal(transitionDepositStatus(record, 'reject_payment'), 'pending');
});

test('a reported deposit payment must be resolved before return confirmation', () => {
  const record = borrow({ depositStatus: 'payment_pending' });
  assert.equal(transitionDepositStatus(record, 'complete_return'), undefined);
  assert.equal(transitionDepositStatus(record, 'reject_payment'), 'pending');
});

test('legacy deposits map to their safe current lifecycle state', () => {
  assert.equal(resolveDepositStatus(borrow({ depositStatus: undefined, depositPaid: true })), 'held');
  assert.equal(
    resolveDepositStatus(borrow({ status: 'returned', depositStatus: undefined, depositPaid: true })),
    'return_pending'
  );
  assert.equal(
    resolveDepositStatus(borrow({ status: 'rejected', depositStatus: undefined, depositPaid: true })),
    'return_pending'
  );
  assert.equal(resolveDepositStatus(borrow({ depositAmount: 0, depositStatus: undefined })), 'not_required');
});

test('peer loan repayment completes only after lender confirmation', () => {
  const loan = { status: 'active' };
  assert.equal(transitionMoneyLoanStatus(loan, 'report_repayment'), 'repaid_pending');
  loan.status = 'repaid_pending';
  assert.equal(transitionMoneyLoanStatus(loan, 'report_repayment'), undefined);
  assert.equal(transitionMoneyLoanStatus(loan, 'confirm_repayment'), 'repaid');
  loan.status = 'repaid';
  assert.equal(transitionMoneyLoanStatus(loan, 'confirm_repayment'), undefined);
});

test('peer loan funds move to active only after both sides verify disbursement', () => {
  const loan = { status: 'pending' };
  assert.equal(transitionMoneyLoanStatus(loan, 'report_disbursement'), undefined);
  assert.equal(transitionMoneyLoanStatus(loan, 'accept'), 'disbursement_pending');

  loan.status = 'disbursement_pending';
  assert.equal(transitionMoneyLoanStatus(loan, 'confirm_disbursement'), undefined);
  assert.equal(transitionMoneyLoanStatus(loan, 'report_disbursement'), 'disbursement_sent');

  loan.status = 'disbursement_sent';
  assert.equal(transitionMoneyLoanStatus(loan, 'report_repayment'), undefined);
  assert.equal(transitionMoneyLoanStatus(loan, 'confirm_disbursement'), 'active');
});

test('loan repayment cannot begin before disbursement is acknowledged', () => {
  for (const status of ['pending', 'disbursement_pending', 'disbursement_sent']) {
    assert.equal(transitionMoneyLoanStatus({ status }, 'report_repayment'), undefined);
  }
});

test('late fine payments require borrower report and owner confirmation', () => {
  const borrow = { status: 'returned', fineAmount: 30, finePaid: false };
  assert.equal(resolveFinePaymentStatus(borrow), 'pending');
  assert.equal(transitionFinePaymentStatus(borrow, 'confirm_payment'), undefined);
  assert.equal(transitionFinePaymentStatus(borrow, 'report_payment'), 'payment_pending');

  borrow.finePaymentStatus = 'payment_pending';
  assert.equal(transitionFinePaymentStatus(borrow, 'report_payment'), undefined);
  assert.equal(transitionFinePaymentStatus(borrow, 'reject_payment'), 'pending');
  assert.equal(transitionFinePaymentStatus(borrow, 'confirm_payment'), 'paid');
});

test('late fines accrue once per overdue day', () => {
  const dueDate = new Date('2025-01-01T00:00:00.000Z');
  const twoDaysLate = new Date('2025-01-03T00:00:00.000Z');

  assert.deepEqual(calculateFine(dueDate, 15, twoDaysLate), {
    daysOverdue: 2,
    fineAmount: 30,
  });
  assert.deepEqual(calculateFine(dueDate, 15, dueDate), {
    daysOverdue: 0,
    fineAmount: 0,
  });
});

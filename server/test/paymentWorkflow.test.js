import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveDepositStatus, transitionDepositStatus } from '../utils/depositWorkflow.js';
import { transitionMoneyLoanStatus } from '../utils/moneyLoanWorkflow.js';

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

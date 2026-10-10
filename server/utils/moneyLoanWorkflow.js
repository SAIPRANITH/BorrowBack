export const transitionMoneyLoanStatus = (loan, event) => {
  if (event === 'accept' && loan.status === 'pending') {
    return 'disbursement_pending';
  }
  if (event === 'report_disbursement' && loan.status === 'disbursement_pending') {
    return 'disbursement_sent';
  }
  if (event === 'confirm_disbursement' && loan.status === 'disbursement_sent') {
    return 'active';
  }
  if (event === 'report_repayment' && ['active', 'overdue'].includes(loan.status)) {
    return 'repaid_pending';
  }
  if (event === 'confirm_repayment' && loan.status === 'repaid_pending') {
    return 'repaid';
  }
  return undefined;
};

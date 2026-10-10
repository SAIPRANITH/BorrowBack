export const transitionMoneyLoanStatus = (loan, event) => {
  if (event === 'report_repayment' && ['active', 'overdue'].includes(loan.status)) {
    return 'repaid_pending';
  }
  if (event === 'confirm_repayment' && loan.status === 'repaid_pending') {
    return 'repaid';
  }
  return undefined;
};

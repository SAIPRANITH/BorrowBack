export const resolveFinePaymentStatus = (borrow) => {
  if (!(Number(borrow.fineAmount) > 0)) return 'not_required';
  if (borrow.finePaid) return 'paid';
  return borrow.finePaymentStatus || 'pending';
};

export const transitionFinePaymentStatus = (borrow, event) => {
  const status = resolveFinePaymentStatus(borrow);

  if (event === 'report_payment' && borrow.status === 'returned' && status === 'pending') {
    return 'payment_pending';
  }
  if (event === 'confirm_payment' && borrow.status === 'returned' && status === 'payment_pending') {
    return 'paid';
  }
  if (event === 'reject_payment' && borrow.status === 'returned' && status === 'payment_pending') {
    return 'pending';
  }
  return undefined;
};

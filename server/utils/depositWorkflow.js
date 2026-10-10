export const resolveDepositStatus = (borrow) => {
  if (borrow.depositStatus) return borrow.depositStatus;
  if (!(Number(borrow.depositAmount) > 0)) return 'not_required';
  if (borrow.depositPaid) {
    return borrow.status === 'returned' ? 'return_pending' : 'held';
  }
  return 'pending';
};

export const transitionDepositStatus = (borrow, event) => {
  const current = resolveDepositStatus(borrow);
  const active = ['active', 'overdue'].includes(borrow.status);

  switch (event) {
    case 'report_payment':
      return active && Number(borrow.depositAmount) > 0 && current === 'pending'
        ? 'payment_pending'
        : undefined;
    case 'confirm_payment':
      return active && current === 'payment_pending' ? 'held' : undefined;
    case 'reject_payment':
      return active && current === 'payment_pending' ? 'pending' : undefined;
    case 'complete_return':
      if (!active || current === 'payment_pending') return undefined;
      return current === 'held' ? 'return_pending' : current;
    case 'send_deposit_return':
      return borrow.status === 'returned' && current === 'return_pending'
        ? 'return_sent'
        : undefined;
    case 'acknowledge_deposit_return':
      return borrow.status === 'returned' && current === 'return_sent'
        ? 'returned'
        : undefined;
    default:
      return undefined;
  }
};

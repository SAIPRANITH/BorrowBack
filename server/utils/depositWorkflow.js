export const resolveDepositStatus = (borrow) => {
  if (borrow.depositStatus) return borrow.depositStatus;
  if (!(Number(borrow.depositAmount) > 0)) return 'not_required';
  if (borrow.depositPaid) {
    return ['returned', 'rejected'].includes(borrow.status) ? 'return_pending' : 'held';
  }
  return 'pending';
};

export const transitionDepositStatus = (borrow, event) => {
  const current = resolveDepositStatus(borrow);
  const active = ['active', 'overdue'].includes(borrow.status);
  const pending = borrow.status === 'pending';

  switch (event) {
    case 'report_payment':
      return (pending || active) && Number(borrow.depositAmount) > 0 && current === 'pending'
        ? 'payment_pending'
        : undefined;
    case 'confirm_payment':
      return (pending || active) && current === 'payment_pending' ? 'held' : undefined;
    case 'reject_payment':
      return (pending || active) && current === 'payment_pending' ? 'pending' : undefined;
    case 'accept_request':
      return pending && (
        Number(borrow.depositAmount) > 0 ? current === 'held' : current === 'not_required'
      ) ? 'active' : undefined;
    case 'reject_request':
      return pending && current !== 'payment_pending'
        ? current === 'held' ? 'return_pending' : current
        : undefined;
    case 'complete_return':
      if (!active || current === 'payment_pending') return undefined;
      return current === 'held' ? 'return_pending' : current;
    case 'send_deposit_return':
      return ['returned', 'rejected'].includes(borrow.status) && current === 'return_pending'
        ? 'return_sent'
        : undefined;
    case 'acknowledge_deposit_return':
      return ['returned', 'rejected'].includes(borrow.status) && current === 'return_sent'
        ? 'returned'
        : undefined;
    default:
      return undefined;
  }
};

export const isDepositReadyForAcceptance = (borrow) => {
  const status = resolveDepositStatus(borrow);
  return Number(borrow.depositAmount) > 0 ? status === 'held' : status === 'not_required';
};

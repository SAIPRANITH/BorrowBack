export const calculateFine = (dueDate, finePerDay) => {
  const now = new Date();
  const due = new Date(dueDate);

  if (now > due) {
    const diffTime = Math.abs(now - due);
    const daysOverdue = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return {
      daysOverdue,
      fineAmount: daysOverdue * finePerDay,
    };
  }

  return {
    daysOverdue: 0,
    fineAmount: 0,
  };
};

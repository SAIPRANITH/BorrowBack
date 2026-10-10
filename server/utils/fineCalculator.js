export const calculateFine = (dueDate, finePerDay, throughDate = new Date()) => {
  const now = new Date(throughDate);
  const due = new Date(dueDate);

  if (now > due) {
    const diffTime = now - due;
    const daysOverdue = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return {
      daysOverdue,
      fineAmount: daysOverdue * Number(finePerDay || 0),
    };
  }

  return {
    daysOverdue: 0,
    fineAmount: 0,
  };
};

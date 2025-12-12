export const formatCHF = (cents: number) => {
  return (cents / 100).toFixed(2) + ' CHF';
};

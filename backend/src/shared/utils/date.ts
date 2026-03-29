export const daysBetween = (from: Date, to: Date = new Date()): number => {
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.floor((to.getTime() - from.getTime()) / msPerDay);
};

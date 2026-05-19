/** Retorna a data de início do ciclo atual (04:50 da madrugada) */
export function getCycleStart(): string {
  const now = new Date();
  const cycleStart = new Date(now);
  cycleStart.setHours(4, 50, 0, 0);
  if (now < cycleStart) {
    cycleStart.setDate(cycleStart.getDate() - 1);
  }
  return cycleStart.toISOString();
}

export function calculateMAE(predictions, actuals) {
  if (!predictions.length || predictions.length !== actuals.length) return 0;
  const sum = predictions.reduce((acc, p, i) => acc + Math.abs(p - actuals[i]), 0);
  return sum / predictions.length;
}

export function calculateRMSE(predictions, actuals) {
  if (!predictions.length || predictions.length !== actuals.length) return 0;
  const sum = predictions.reduce((acc, p, i) => {
    const e = p - actuals[i];
    return acc + e * e;
  }, 0);
  return Math.sqrt(sum / predictions.length);
}

export function calculateAccuracy(predictions, actuals) {
  if (!predictions.length || predictions.length !== actuals.length) return 0;
  const mae = calculateMAE(predictions, actuals);
  const meanActual = actuals.reduce((a, b) => a + b, 0) / actuals.length;
  if (!meanActual) return 0;
  return Math.max(0, Math.min(100, 100 * (1 - mae / meanActual)));
}
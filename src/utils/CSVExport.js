function escapeCSV(value) {
  if (value === null || value === undefined) return "";
  const s = String(value);
  return /[,"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function downloadResultsAsCSV(data) {
  const result = data?.result || data;
  if (!result || typeof result !== "object") {
    window.alert("No data to download");
    return;
  }

  let csv = "Meter ID,Prediction,Timestamp,Original Value\r\n";
  let rows = 0;

  Object.entries(result).forEach(([motorId, predictions]) => {
    if (!Array.isArray(predictions)) return;
    predictions.forEach((p) => {
      const meter = p.meter_id || motorId;
      const pred = typeof p.prediction === "number" ? p.prediction.toFixed(4) : (p.prediction ?? "");
      const ts = p.timestamp ?? "";
      const original = typeof p.original_value === "number" ? p.original_value.toFixed(3) : (p.original_value ?? "");
      csv += [escapeCSV(meter), escapeCSV(pred), escapeCSV(ts), escapeCSV(original)].join(",") + "\r\n";
      rows++;
    });
  });

  if (!rows) {
    window.alert("No prediction data to export");
    return;
  }

  const uri = "data:text/csv;charset=utf-8," + encodeURIComponent(csv);
  const a = document.createElement("a");
  a.href = uri;
  a.download = `predictions_${new Date().toISOString().split("T")[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
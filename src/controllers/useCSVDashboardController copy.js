import { useEffect, useMemo, useRef, useState } from "react";
import { clearUpload, getResult, getStatus, uploadCsv } from "../services/dashboardApi";
import { calculateAccuracy, calculateMAE, calculateRMSE } from "../utils/metrics";
import { downloadResultsAsCSV } from "../utils/csvExport";

const stageMessages = {
  accepted: { text: "File uploaded successfully! Processing will start shortly...", type: "loading" },
  data_retrieving: { text: "Retrieving processed data from database...", type: "loading" },
  getting_prediction: { text: "Running ATFT Prediction...", type: "loading" },
  completed: { text: "Workflow completed successfully! Click VIEW FORECAST to see results.", type: "success" },
};

export function useCsvDashboardController() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [currentUploadId, setCurrentUploadId] = useState(null);
  const [predictionData, setPredictionData] = useState(null);

  const [status, setStatus] = useState({ text: "", type: "" });
  const [isUploading, setIsUploading] = useState(false);

  const [metrics, setMetrics] = useState({ rmse: "—", mae: "—", accuracy: "—" });
  const [meterLabel, setMeterLabel] = useState("—");
  const [chartPayload, setChartPayload] = useState({ timestamps: [], predictions: [], actuals: [] });

  const pollRef = useRef(null);

  const canUpload = !!selectedFile && !isUploading;
  const canView = !!predictionData;
  const canDownload = !!predictionData;

  const fileDisplay = useMemo(() => {
    if (!selectedFile) return "";
    return `✓ Selected: ${selectedFile.name} (${(selectedFile.size / 1024).toFixed(2)} KB)`;
  }, [selectedFile]);

  function pickFile(file) {
    if (!file) return;
    const isCsv = file.type === "text/csv" || file.name.toLowerCase().endsWith(".csv");
    if (!isCsv) {
      setSelectedFile(null);
      setStatus({ text: "❌ Please select a valid CSV file", type: "error" });
      return;
    }
    setSelectedFile(file);
    setPredictionData(null);
    setStatus({ text: "", type: "" });
  }

  async function startUpload() {
    if (!selectedFile) {
      setStatus({ text: "❌ Please select a file first", type: "error" });
      return;
    }

    setIsUploading(true);
    setStatus({ text: "Uploading file...", type: "loading" });

    try {
      const data = await uploadCsv(selectedFile);
      if (data.status !== "accepted") throw new Error(`Unexpected status: ${data.status}`);
      setCurrentUploadId(data.upload_id);
      setStatus({ text: `✓ File uploaded! Upload ID: ${data.upload_id}`, type: "success" });
      startPolling(data.upload_id);
    } catch (e) {
      setStatus({ text: `❌ ${e.message}`, type: "error" });
      setIsUploading(false);
    }
  }

  function parseAndSetDashboard(data) {
    const result = data?.result || data;
    const predictions = [];
    const actuals = [];
    const timestamps = [];
    const meterIds = [];

    if (result && typeof result === "object" && !Array.isArray(result)) {
      Object.entries(result).forEach(([motorId, rows]) => {
        if (!Array.isArray(rows)) return;
        rows.forEach((r) => {
          const p = r.prediction ?? 0;
          const a = r.original_value ?? 0;
          if (typeof p === "number" && typeof a === "number") {
            predictions.push(p);
            actuals.push(a);
            timestamps.push(r.timestamp ?? "N/A");
            meterIds.push(r.meter_id || motorId);
          }
        });
      });
    }

    const mae = calculateMAE(predictions, actuals);
    const rmse = calculateRMSE(predictions, actuals);
    const accuracy = calculateAccuracy(predictions, actuals);

    setMetrics({
      rmse: `${rmse.toFixed(4)} kWh`,
      mae: `${mae.toFixed(4)} kWh`,
      accuracy: `${accuracy.toFixed(2)}%`,
    });

    const unique = [...new Set(meterIds)];
    if (unique.length === 1) setMeterLabel(`Meter Id ${unique[0]}`);
    else if (unique.length > 1) setMeterLabel(`Multiple Meters (${unique.join(", ")})`);
    else setMeterLabel("Meter Id —");

    setChartPayload({ timestamps, predictions, actuals });
  }

  function viewForecast() {
    if (!predictionData) return window.alert("No prediction data available");
    parseAndSetDashboard(predictionData);
    setStatus({ text: "✅ Forecast displayed on dashboard!", type: "success" });
  }

  function downloadForecast() {
    if (!predictionData) return window.alert("No prediction data available to download");
    downloadResultsAsCSV(predictionData);
    setStatus({ text: "✅ Forecast CSV downloaded successfully!", type: "success" });
  }

  async function clearAll() {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }

    if (currentUploadId) {
      try { await clearUpload(currentUploadId); } catch {}
    }

    setSelectedFile(null);
    setCurrentUploadId(null);
    setPredictionData(null);
    setStatus({ text: "", type: "" });
    setIsUploading(false);
    setMetrics({ rmse: "—", mae: "—", accuracy: "—" });
    setMeterLabel("Meter Id —");
    setChartPayload({ timestamps: [], predictions: [], actuals: [] });
  }

  function startPolling(uploadId) {
    if (pollRef.current) clearInterval(pollRef.current);

    pollRef.current = setInterval(async () => {
      try {
        const data = await getStatus(uploadId);
        const stage = data?.status?.stage || data?.status || data?.stage;

        if (stage === "reset") {
          setStatus({ text: `❌ ${data.message || "Processing failed and server was reset."}`, type: "error" });
          clearInterval(pollRef.current);
          pollRef.current = null;
          setIsUploading(false);
          return;
        }

        if (stageMessages[stage]) setStatus(stageMessages[stage]);

        if (stage === "completed") {
          const result = await getResult(uploadId).catch(() => data);
          setPredictionData(result);
          setStatus({ text: "✅ Workflow completed successfully! Click VIEW FORECAST to see results.", type: "success" });
          setIsUploading(false);
          clearInterval(pollRef.current);
          pollRef.current = null;
        }
      } catch (e) {
        setStatus({ text: `❌ Error checking status: ${e.message}`, type: "error" });
        setIsUploading(false);
      }
    }, 2000);
  }

  useEffect(() => () => pollRef.current && clearInterval(pollRef.current), []);

  return {
    selectedFile, fileDisplay, status, metrics, meterLabel, chartPayload,
    canUpload, canView, canDownload, isUploading,
    pickFile, startUpload, viewForecast, downloadForecast, clearAll,
  };
}
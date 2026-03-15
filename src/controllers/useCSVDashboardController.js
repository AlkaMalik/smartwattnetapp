import { useEffect, useMemo, useRef, useState } from "react";
import { clearUpload, getResult, getStatus, uploadCsv } from "../services/DashboardApi";
import { calculateAccuracy, calculateMAE, calculateRMSE } from "../utils/metrics";
import { downloadResultsAsCSV } from "../utils/CSVExport";

const stageMessages = {
  accepted: { text: "File uploaded successfully! Processing will start shortly...", type: "loading" },
  data_retrieving: { text: "Retrieving Knowledge Graph Ontology from Database...", type: "loading" },
  getting_prediction: { text: "Running ATFT Prediction...", type: "loading" },
  completed: { text: "Workflow completed successfully! Forecast is now displayed.", type: "success" },
};

export function useCsvDashboardController() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [currentUploadId, setCurrentUploadId] = useState(null);
  const [predictionData, setPredictionData] = useState(null);

  const [status, setStatus] = useState({ text: "", type: "" });
  const [isUploading, setIsUploading] = useState(false);

  const [progressDialog, setProgressDialog] = useState({ open: false, text: "" });

  const [metrics, setMetrics] = useState({ rmse: "—", mae: "—", accuracy: "—" });
  const [meterLabel, setMeterLabel] = useState("—");
  const [chartPayload, setChartPayload] = useState({ timestamps: [], predictions: [], actuals: [] });

  // NEW: store per-key buckets + current selected key index
  const [seriesBuckets, setSeriesBuckets] = useState([]);
  const [activeSeriesIndex, setActiveSeriesIndex] = useState(0);

  const pollRef = useRef(null);

  const fileDisplay = useMemo(() => selectedFile?.name ?? "", [selectedFile]);

  const canUpload = !!selectedFile && !isUploading;
  const canView = !!predictionData;
  const canDownload = !!predictionData;

  // NEW: prev/next controls
  const canPrevSeries = activeSeriesIndex > 0;
  const canNextSeries = activeSeriesIndex < seriesBuckets.length - 1;
  const activeSeriesKey = seriesBuckets[activeSeriesIndex]?.key ?? "—";

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
    setProgressDialog({ open: true, text: "Uploading file..." });

    try {
      const data = await uploadCsv(selectedFile);
      if (data.status !== "accepted") throw new Error(`Unexpected status: ${data.status}`);
      setCurrentUploadId(data.upload_id);

      setStatus(stageMessages.accepted);
      setProgressDialog({ open: true, text: stageMessages.accepted.text });

      startPolling(data.upload_id);
    } catch (e) {
      if (e?.status === 409) {
        setStatus({
          text: "⚠️ Upload conflict: another workflow may already be active. Clear existing upload/workflow and retry.",
          type: "error",
        });
      } else {
        setStatus({ text: `❌ ${e.message}`, type: "error" });
      }
      setProgressDialog({ open: false, text: "" });
      setIsUploading(false);
    }
  }

  function toSeriesBuckets(data) {
    const result = data?.result || data;

    if (result && typeof result === "object" && !Array.isArray(result)) {
      return Object.entries(result)
        .filter(([, rows]) => Array.isArray(rows))
        .map(([key, rows]) => ({ key, rows }));
    }

    if (Array.isArray(result)) {
      return [{ key: "Result", rows: result }];
    }

    return [];
  }

  function applySeriesToDashboard(buckets, index) {
    if (!buckets.length) {
      setMetrics({ rmse: "—", mae: "—", accuracy: "—" });
      setMeterLabel("Meter Id —");
      setChartPayload({ timestamps: [], predictions: [], actuals: [] });
      return;
    }

    const safeIndex = Math.max(0, Math.min(index, buckets.length - 1));
    const { key, rows } = buckets[safeIndex];

    const predictions = [];
    const actuals = [];
    const timestamps = [];
    const meterIds = [];

    rows.forEach((r) => {
      const p = r?.prediction ?? 0;
      const a = r?.original_value ?? 0;
      if (typeof p === "number" && typeof a === "number") {
        predictions.push(p);
        actuals.push(a);
        timestamps.push(r.timestamp ?? "N/A");
        meterIds.push(r.meter_id || key);
      }
    });

    const mae = predictions.length ? calculateMAE(predictions, actuals) : 0;
    const rmse = predictions.length ? calculateRMSE(predictions, actuals) : 0;
    const accuracy = predictions.length ? calculateAccuracy(predictions, actuals) : 0;

    setMetrics({
      rmse: `${rmse.toFixed(4)} kWh`,
      mae: `${mae.toFixed(4)} kWh`,
      accuracy: `${accuracy.toFixed(2)}%`,
    });

    const unique = [...new Set(meterIds)];
    if (unique.length === 1) setMeterLabel(`Meter Id ${unique[0]}`);
    else if (unique.length > 1) setMeterLabel(`Multiple Meters (${unique.join(", ")})`);
    else setMeterLabel(`Meter Id ${key}`);

    setChartPayload({ timestamps, predictions, actuals });
  }

  function parseAndSetDashboard(data, targetIndex = 0) {
    const buckets = toSeriesBuckets(data);
    setSeriesBuckets(buckets);

    const safeIndex = Math.max(0, Math.min(targetIndex, Math.max(buckets.length - 1, 0)));
    setActiveSeriesIndex(safeIndex);
    applySeriesToDashboard(buckets, safeIndex);
  }

  // NEW: navigation actions
  function showPrevSeries() {
    if (!canPrevSeries) return;
    const nextIndex = activeSeriesIndex - 1;
    setActiveSeriesIndex(nextIndex);
    applySeriesToDashboard(seriesBuckets, nextIndex);
  }

  function showNextSeries() {
    if (!canNextSeries) return;
    const nextIndex = activeSeriesIndex + 1;
    setActiveSeriesIndex(nextIndex);
    applySeriesToDashboard(seriesBuckets, nextIndex);
  }

  function viewForecast() {
    if (!predictionData) return window.alert("No prediction data available");
    parseAndSetDashboard(predictionData, activeSeriesIndex);
    setStatus({ text: "Forecast displayed on dashboard!", type: "success" });
  }

  function downloadForecast() {
    if (!predictionData) return window.alert("No prediction data available to download");
    downloadResultsAsCSV(predictionData);
    setStatus({ text: "Forecast CSV downloaded successfully!", type: "success" });
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
    setProgressDialog({ open: false, text: "" });
    setIsUploading(false);
    setMetrics({ rmse: "—", mae: "—", accuracy: "—" });
    setMeterLabel("Meter Id —");
    setChartPayload({ timestamps: [], predictions: [], actuals: [] });

    // NEW reset
    setSeriesBuckets([]);
    setActiveSeriesIndex(0);
  }

  function startPolling(uploadId) {
    if (pollRef.current) clearInterval(pollRef.current);

    pollRef.current = setInterval(async () => {
      try {
        const data = await getStatus(uploadId);
        const stage = data?.status?.stage || data?.status || data?.stage;

        if (stage === "reset") {
          setStatus({ text: `❌ ${data.message || "Processing failed and server was reset."}`, type: "error" });
          setProgressDialog({ open: false, text: "" });
          clearInterval(pollRef.current);
          pollRef.current = null;
          setIsUploading(false);
          return;
        }

        if (stageMessages[stage]) {
          setStatus(stageMessages[stage]);
          setProgressDialog({ open: true, text: stageMessages[stage].text });
        }

        if (stage === "completed") {
          const result = await getResult(uploadId).catch(() => data);
          setPredictionData(result);

          // Auto-generate chart + metrics immediately on completion
          parseAndSetDashboard(result);

          setStatus(stageMessages.completed);
          setProgressDialog({ open: false, text: "" });
          setIsUploading(false);
          clearInterval(pollRef.current);
          pollRef.current = null;
        }
      } catch (e) {
        setStatus({ text: `❌ Error checking status: ${e.message}`, type: "error" });
        setProgressDialog({ open: false, text: "" });
        setIsUploading(false);
      }
    }, 5000);
  }

  useEffect(() => () => pollRef.current && clearInterval(pollRef.current), []);

  return {
    selectedFile, fileDisplay, status, metrics, meterLabel, chartPayload,
    canUpload, canView, canDownload, isUploading,
    pickFile, startUpload, viewForecast, downloadForecast, clearAll,

    // NEW exports for Prev/Next buttons
    canPrevSeries,
    canNextSeries,
    activeSeriesKey,
    activeSeriesIndex,
    totalSeries: seriesBuckets.length,
    showPrevSeries,
    showNextSeries,

    progressDialogOpen: progressDialog.open,
    progressDialogText: progressDialog.text,
  };
}
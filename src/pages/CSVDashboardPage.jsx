import { useEffect, useRef } from "react";
import Chart from "chart.js/auto";
import { useCsvDashboardController } from "../controllers/useCSVDashboardController";
import logoIcon from "../assets/Logo.ico";
import "../styles/csvDashboard.css";

export default function CsvDashboardPage() {
  const {
    fileDisplay, status, metrics, meterLabel, chartPayload,
    canUpload, canView, canDownload, isUploading,
    pickFile, startUpload, viewForecast, downloadForecast, clearAll,
  } = useCsvDashboardController();

  const isBusy = isUploading || status?.type === "loading";
  const fileRef = useRef(null);
  const canvasRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current || !chartPayload.timestamps.length) return;
    chartRef.current?.destroy();

    const step = Math.max(1, Math.floor(chartPayload.timestamps.length / 20));
    chartRef.current = new Chart(canvasRef.current, {
      type: "line",
      data: {
        labels: chartPayload.timestamps,
        datasets: [
          { label: "Predicted Energy", data: chartPayload.predictions, borderColor: "#e74c3c", fill: true, tension: 0.3, pointRadius: 2 },
          { label: "Actual Energy", data: chartPayload.actuals, borderColor: "#34a86a", fill: false, tension: 0.3, pointRadius: 2 },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: { ticks: { callback: (_, i) => (i % step === 0 ? chartPayload.timestamps[i] : "") } },
          y: { title: { display: true, text: "Energy (kWh)" } },
        },
      },
    });

    return () => chartRef.current?.destroy();
  }, [chartPayload]);

  return (
    <div className="app">
      <input
        ref={fileRef}
        type="file"
        accept=".csv"
        style={{ display: "none" }}
        disabled={isBusy}
        onChange={(e) => pickFile(e.target.files?.[0])}
      />

      <aside className="sidebar">
        <div className="brand">
  <div className="brand-icon">
    <img src={logoIcon} alt="SmartWatt Net logo" className="brand-icon-img" />
  </div>
  <div className="brand-title">SmartWatt Net</div>
</div>
      </aside>

      <div className="main">
        <header className="topbar">
          <div className="title-block">
            <h1>SmartWatt Net DashBoard: Short-term Energy Forecast for Smart Meters</h1>
          </div>
        </header>

        <main className="content">
          <div className="top-row">
            <section className="card upload-card">
              <div
                className={`upload-zone ${isBusy ? "disabled" : ""}`}
                onClick={() => !isBusy && fileRef.current?.click()}
                aria-disabled={isBusy}
                title={isBusy ? "Upload in progress. Please wait for results." : "Click to browse or drag and drop"}
              >
                <div className="upload-text">Click to browse or drag and drop</div>
                <div className="upload-subtext">CSV files only</div>
              </div>

              {fileDisplay && <div className="file-name active">{fileDisplay}</div>}

              <div className="upload-actions">
                <button className="btn btn-primary" disabled={!canUpload} onClick={startUpload}>Upload Data</button>
                <button className="btn btn-secondary" disabled={isUploading} onClick={clearAll}>Clear Uploaded Data</button>
              </div>

              {!!status.text && (
                <div className={`status-message show ${status.type}`}>
                  {status.type === "loading" ? <span className="spinner" /> : null}
                  {status.text}
                </div>
              )}
            </section>

            <section className="card summary-card">
              <h2>Overview Summary</h2>
              <div className="summary-grid">
                <div className="summary-item"><h3>RMSE</h3><div className="value">{metrics.rmse}</div></div>
                <div className="summary-item green"><h3>MAE</h3><div className="value">{metrics.mae}</div></div>
              </div>
            </section>
          </div>

          <section className="card chart-card">
            <h2>Short-Term Energy Consumption Forecast</h2>
            <div className="meter-id-label">{meterLabel}</div>
            <div className="chart-placeholder"><canvas ref={canvasRef} id="dashboardChart" /></div>
          </section>

          <section className="cta-wrap">
            <button className="btn btn-cta" disabled={!canView} onClick={viewForecast}>View Forecast</button>
            <button className="btn btn-cta" disabled={!canDownload} onClick={downloadForecast}>Download Forecast</button>
          </section>
        </main>

      </div>
    </div>
  );
}
import { useEffect, useRef } from "react";
import Chart from "chart.js/auto";
import { useCsvDashboardController } from "../controllers/useCSVDashboardController";
import logoIcon from "../assets/Logo.ico";
import "../styles/CSVDashboard.css";

export default function CsvDashboardPage() {
  const {
    fileDisplay, status, metrics, meterLabel, chartPayload,
    canUpload, canDownload, isUploading,
    pickFile, startUpload, downloadForecast, clearAll,
    progressDialogOpen,
    progressDialogText,
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

  const handleUploadZoneClick = async () => {
    if (isBusy) return;

    // perform same reset behavior as "Clear Uploaded Data"
    await clearAll();

    // reset file input and reopen picker
    if (fileRef.current) fileRef.current.value = "";
    fileRef.current?.click();
  };

  const showInlineStatus = status?.type === "error"; // only show errors in upload section

  return (
    <>
      {/* Single foreground progress dialog */}
      {progressDialogOpen && (
        <div className="progress-overlay" role="dialog" aria-modal="true" aria-live="polite">
          <div className="progress-dialog">
            <div className="spinner" />
            <p>{progressDialogText}</p>
          </div>
        </div>
      )}

      {/* Main app layout */}
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
                  onClick={handleUploadZoneClick}
                  aria-disabled={isBusy}
                  title={isBusy ? "Upload in progress. Please wait for results." : "Click to browse or drag and drop"}
                >
                  <div className="upload-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" className="svg-icon" focusable="false">
                      <path d="M19 20H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2Z" fill="none" stroke="currentColor" strokeWidth="1.8" />
                      <path d="M12 16V10m0 0-2.5 2.5M12 10l2.5 2.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <div className="upload-text">Click to browse or drag and drop</div>
                  <div className="upload-subtext">CSV files only</div>
                </div>

                {fileDisplay && <div className="file-name active">{fileDisplay}</div>}

                <div className="upload-actions">
                  <button className="btn btn-primary" disabled={!canUpload} onClick={startUpload}>Upload Data</button>
                  <button className="btn btn-secondary" disabled={isUploading} onClick={clearAll}>Clear Uploaded Data</button>
                </div>

                {showInlineStatus && (
                  <div className={`status-message show ${status.type}`}>
                    {status.text}
                  </div>
                )}
              </section>

              <section className="card summary-card">
                <h2>Overview Summary</h2>
                <div className="summary-grid">
                  <div className="summary-item">
                    <h3>
                      <span className="metric-icon" aria-hidden="true">
                        <svg viewBox="0 0 24 24" className="svg-icon" focusable="false">
                          <path d="M4 18h16M7 15l3-3 3 2 4-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </span>
                      RMSE
                    </h3>
                    <div className="value">{metrics.rmse}</div>
                  </div>
                  <div className="summary-item green">
                    <h3>
                      <span className="metric-icon" aria-hidden="true">
                        <svg viewBox="0 0 24 24" className="svg-icon" focusable="false">
                          <path d="M4 7h10M4 12h16M4 17h7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                          <path d="M18 5v14" fill="none" stroke="currentColor" strokeWidth="1.8" />
                        </svg>
                      </span>
                      MAE
                    </h3>
                    <div className="value">{metrics.mae}</div>
                  </div>
                </div>
              </section>
            </div>

            <section className="card chart-card">
              <h2>Short-Term Energy Consumption Forecast</h2>
              <div className="meter-id-label">{meterLabel}</div>
              <div className="chart-placeholder"><canvas ref={canvasRef} id="dashboardChart" /></div>
            </section>

            <section className="cta-wrap">
              <button className="btn btn-cta" disabled={!canDownload} onClick={downloadForecast}>Download Forecast</button>
            </section>
          </main>
        </div>
      </div>
    </>
  );
}
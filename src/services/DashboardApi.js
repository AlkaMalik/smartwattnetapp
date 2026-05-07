const API_BASE = import.meta.env.VITE_API_BASE || "http://127.0.0.1:8000" || "http://0.0.0.0:8000/";

async function toHttpError(res, fallback) {
  let detail = "";
  try {
    const contentType = res.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const body = await res.json();
      detail = body?.detail || body?.message || JSON.stringify(body);
    } else {
      detail = await res.text();
    }
  } catch {
    // ignore parse errors
  }

  const msg = `${fallback} (${res.status})${detail ? `: ${detail}` : ""}`;
  const err = new Error(msg);
  err.status = res.status;
  return err;
}

export async function uploadCsv(file) {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API_BASE}/upload/`, {
    method: "POST",
    body: formData,
    headers: { Accept: "application/json" },
  });

  if (!res.ok) throw await toHttpError(res, "Upload failed");
  return res.json();
}

export async function getStatus(uploadId) {
  const res = await fetch(`${API_BASE}/status/?id=${uploadId}`, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw await toHttpError(res, "Status failed");
  return res.json();
}

export async function getResult(uploadId) {
  const res = await fetch(`${API_BASE}/result/?id=${uploadId}`, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw await toHttpError(res, "Result failed");
  return res.json();
}

export async function clearUpload(uploadId) {
  const res = await fetch(`${API_BASE}/clear/?id=${uploadId}`);
  if (!res.ok) throw await toHttpError(res, "Clear failed");
}
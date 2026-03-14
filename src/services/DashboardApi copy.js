//const API_BASE = "http://0.0.0.0:8000";
const API_BASE = import.meta.env.VITE_API_BASE || "http://127.0.0.1:8000";

export async function uploadCsv(file) {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API_BASE}/upload/`, { method: "POST", body: formData });
  if (!res.ok) throw new Error(`Upload failed: ${res.statusText}`);
  return res.json();
}

export async function getStatus(uploadId) {
  const res = await fetch(`${API_BASE}/status/?id=${uploadId}`);
  if (!res.ok) throw new Error(`Status failed: ${res.statusText}`);
  return res.json();
}

export async function getResult(uploadId) {
  const res = await fetch(`${API_BASE}/result/?id=${uploadId}`);
  if (!res.ok) throw new Error(`Result failed: ${res.statusText}`);
  return res.json();
}

export async function clearUpload(uploadId) {
  await fetch(`${API_BASE}/clear/?id=${uploadId}`);
}
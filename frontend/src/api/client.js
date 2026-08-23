const API_URL = import.meta.env.VITE_API_URL;

async function apiPost(path, body, token) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const response = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body ?? {}),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.error || "Something went wrong. Please try again.");
    error.status = response.status;
    const retryAfter = response.headers.get("Retry-After");
    if (retryAfter) error.retryAfterSeconds = parseInt(retryAfter, 10);
    throw error;
  }

  return data;
}

async function apiGet(path) {
  const response = await fetch(`${API_URL}${path}`);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.error || "Something went wrong. Please try again.");
    error.status = response.status;
    const retryAfter = response.headers.get("Retry-After");
    if (retryAfter) error.retryAfterSeconds = parseInt(retryAfter, 10);
    throw error;
  }

  return data;
}

export { apiGet, apiPost };
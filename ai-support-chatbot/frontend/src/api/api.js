const BASE_URL = "http://localhost:5000/api";

export async function uploadDocument(file) {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(`${BASE_URL}/documents/upload`, {
    method: "POST",
    body: formData,
  });
  return res.json();
}

export async function sendMessage(sessionId, question) {
  const res = await fetch(`${BASE_URL}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId, question }),
  });
  return res.json();
}
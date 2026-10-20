const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export function getAccessToken() {
  return localStorage.getItem('civicconnect.accessToken');
}
export function setAccessToken(token) {
  if (token) localStorage.setItem('civicconnect.accessToken', token);
  else localStorage.removeItem('civicconnect.accessToken');
}
export async function apiRequest(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  const token = getAccessToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (response.status === 401) setAccessToken(null);
    throw new Error(payload.message || `Request failed (${response.status}).`);
  }
  return payload;
}
export async function login(email, password) {
  const result = await apiRequest('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }), headers: {} });
  setAccessToken(result.accessToken);
  return result.user;
}
export async function registerAccount(name, email, password) {
  return apiRequest('/auth/register', { method: 'POST', body: JSON.stringify({ name, email, password }), headers: {} });
}
export async function logout() {
  try { await apiRequest('/auth/logout', { method: 'POST' }); } finally { setAccessToken(null); }
}
export { API_BASE };

export async function uploadRequestAttachments(requestId, files) {
  const token=getAccessToken();
  const form=new FormData();
  files.forEach(file=>form.append('files',file));
  const response=await fetch(`${API_BASE}/requests/${encodeURIComponent(requestId)}/attachments`,{
    method:'POST',headers:token?{Authorization:`Bearer ${token}`}:{},body:form
  });
  const result=await response.json().catch(()=>({}));
  if(!response.ok)throw new Error(result.message||`Upload failed (${response.status}).`);
  return result;
}

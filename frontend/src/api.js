export async function apiRequest({ baseUrl, path, method = 'GET', body, token, onUnauthorized }){
  const headers = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'Pragma': 'no-cache' }
  if (token) headers.Authorization = `Bearer ${token}`
  const res = await fetch(`${baseUrl}/api${path}`, {
    method,
    headers,
    cache: 'no-store',
    body: body ? JSON.stringify(body) : undefined
  })
  let data
  try { data = await res.json() } catch { data = {} }
  if (res.status === 401) {
    if (onUnauthorized) onUnauthorized()
    throw Object.assign(new Error(data.error || 'Unauthorized'), { status: 401 })
  }
  if (!res.ok) throw new Error(data.error || 'Request failed')
  return data
}

export function apiGet(baseUrl, path, token, onUnauthorized){
  return apiRequest({ baseUrl, path, method: 'GET', token, onUnauthorized })
}

export function apiPost(baseUrl, path, body, token, onUnauthorized){
  return apiRequest({ baseUrl, path, method: 'POST', body, token, onUnauthorized })
}



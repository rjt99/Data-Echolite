const BASE = '/api'

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || `HTTP ${res.status}`)
  }
  return res.json()
}

// ── Upload ─────────────────────────────────────────────────────
export async function uploadFiles(files, workflowName = '') {
  const form = new FormData()
  files.forEach(f => form.append('files', f.file || f))
  if (workflowName) form.append('workflow_name', workflowName)
  const res = await fetch(`${BASE}/upload`, { method: 'POST', body: form })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || `Upload failed: HTTP ${res.status}`)
  }
  return res.json() // { job_id, files, file_count, message }
}

// ── Job status ─────────────────────────────────────────────────
export const getJobStatus  = (jobId) => request(`/jobs/${jobId}/status`)
export const getJobResults = (jobId) => request(`/jobs/${jobId}`)
export const listJobs      = ()      => request('/jobs')

// ── Dashboard data ─────────────────────────────────────────────
export const getReport    = (jobId) => request(`/jobs/${jobId}/report`)
export const getInsights  = (jobId) => request(`/jobs/${jobId}/insights`)
export const getConflicts = (jobId) => request(`/jobs/${jobId}/conflicts`)
export const getEntities  = (jobId) => request(`/jobs/${jobId}/entities`)
export const getFacts     = (jobId) => request(`/jobs/${jobId}/facts`)
export const getGraph     = (jobId) => request(`/jobs/${jobId}/graph`)

// ── NL Query ──────────────────────────────────────────────────
export async function askQuery(jobId, query) {
  return request('/query', {
    method: 'POST',
    body: JSON.stringify({ job_id: jobId, query }),
  })
}

// ── SSE stream factory ─────────────────────────────────────────
// Returns an EventSource connected to /api/stream/:jobId
// Calls onEvent(parsedPayload) for each SSE message
// Calls onDone() when the pipeline finishes
// Returns a cleanup function: call it to close the stream
export function openStream(jobId, { onEvent, onDone, onError }) {
  const es = new EventSource(`${BASE}/stream/${jobId}`)

  es.onmessage = (e) => {
    try {
      const payload = JSON.parse(e.data)
      if (payload.type === 'done') {
        es.close()
        onDone?.()
      } else {
        onEvent?.(payload)
      }
    } catch {
      // ignore parse errors
    }
  }

  es.onerror = () => {
    es.close()
    onError?.()
  }

  return () => es.close()
}

import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowRight, Clock, X, AlertCircle, RefreshCw } from 'lucide-react'
import TopBar from '../components/TopBar'
import PipelineStages from '../components/PipelineStages'
import AgentStream from '../components/AgentStream'
import { openStream, getJobStatus } from '../api/client'

function ElapsedTimer({ running }) {
  const [seconds, setSeconds] = useState(0)
  useEffect(() => {
    if (!running) return
    const id = setInterval(() => setSeconds(s => s + 1), 1000)
    return () => clearInterval(id)
  }, [running])
  const m = String(Math.floor(seconds / 60)).padStart(2, '0')
  const s = String(seconds % 60).padStart(2, '0')
  return <span className="font-mono text-orange-400">{m}:{s}</span>
}

// Derive stage number from event agent name
const AGENT_TO_STAGE = {
  IngestionAgent: 1, DocumentParserAgent: 2, VisionAgent: 3, VideoAgent: 4,
  ChunkingAgent: 5, EntityExtractionAgent: 6, CrossDocumentAgent: 7,
  KnowledgeGraphAgent: 7, InsightAgent: 8, ReportAgent: 8,
}

export default function ProcessingPage({ user }) {
  const { jobId }                         = useParams()
  const [events, setEvents]               = useState([])
  const [currentStage, setCurrentStage]   = useState(null)
  const [completedStages, setCompleted]   = useState([])
  const [skippedStages, setSkipped]       = useState([])
  const [done, setDone]                   = useState(false)
  const [error, setError]                 = useState('')
  const [stats, setStats]                 = useState({ chunks: null, entities: null, facts: null })
  const [files, setFiles]                 = useState([])
  const navigate                          = useNavigate()
  const cleanupRef                        = useRef(null)
  const pipelineFailedRef                 = useRef(false)
  const skippedRef                        = useRef(new Set())  // mirrors skippedStages inside closures

  // Derive file list from first complete event
  useEffect(() => {
    const ingestComplete = events.find(
      e => e.agent === 'IngestionAgent' && e.type === 'complete' && e.data?.documents
    )
    if (ingestComplete?.data?.documents) {
      setFiles(ingestComplete.data.documents)
    }
  }, [events])

  // Update stats from completion events
  useEffect(() => {
    events.forEach(e => {
      if (e.agent === 'ChunkingAgent'          && e.type === 'complete') setStats(s => ({ ...s, chunks: e.data?.total_chunks }))
      if (e.agent === 'EntityExtractionAgent'  && e.type === 'complete') setStats(s => ({ ...s, entities: e.data?.entity_count, facts: e.data?.fact_count }))
    })
  }, [events])

  useEffect(() => {
    if (!jobId) return

    // Check if job already completed before we connect (e.g., page refresh)
    getJobStatus(jobId).then(status => {
      if (status.status === 'completed') {
        // The SSE subscribe() will replay history — just open the stream
      }
    }).catch(() => {})

    const cleanup = openStream(jobId, {
      onEvent: (payload) => {
        setEvents(prev => [...prev, payload])

        // Track pipeline stages from progress events
        if (payload.type === 'progress' && payload.data?.stage) {
          const stage = payload.data.stage
          setCurrentStage(stage)
          setCompleted(prev => {
            const s = new Set(prev)
            for (let i = 1; i < stage; i++) s.add(i)
            return [...s]
          })
        }

        // Detect skipped stages — update both state (for render) and ref (for closures)
        if (payload.type === 'action' && payload.agent === 'Orchestrator') {
          const c = payload.content.toLowerCase()
          if (c.includes('skipping video'))    { skippedRef.current.add(4); setSkipped(p => [...new Set([...p, 4])]) }
          if (c.includes('skipping vision'))   { skippedRef.current.add(3); setSkipped(p => [...new Set([...p, 3])]) }
          if (c.includes('single document'))   { skippedRef.current.add(7); setSkipped(p => [...new Set([...p, 7])]) }
          if (c.includes('text/pdf mode'))     { skippedRef.current.add(3); skippedRef.current.add(4)
                                                 setSkipped(p => [...new Set([...p, 3, 4])]) }
        }

        // Any error event — record it and stop the stage spinner
        if (payload.type === 'error') {
          pipelineFailedRef.current = true
          setError(payload.content || 'Pipeline encountered an error.')
          setCurrentStage(null)
        }

        // Only mark all stages complete if no error was seen; exclude skipped stages
        if (payload.type === 'complete' && payload.agent === 'Orchestrator') {
          if (!pipelineFailedRef.current) {
            setDone(true)
            setCurrentStage(null)
            setCompleted([1, 2, 3, 4, 5, 6, 7, 8].filter(s => !skippedRef.current.has(s)))
          }
        }
      },
      onDone: () => {
        if (pipelineFailedRef.current) return
        setDone(true)
        setCurrentStage(null)
        setCompleted([1, 2, 3, 4, 5, 6, 7, 8].filter(s => !skippedRef.current.has(s)))
      },
      onError: () => {
        // SSE dropped — check job status to see if it completed anyway
        getJobStatus(jobId).then(s => {
          if (s.status === 'completed') { setDone(true); setCompleted([1,2,3,4,5,6,7,8]) }
          else if (s.status === 'failed') setError(s.error || 'Pipeline failed.')
          else setError('Lost connection to stream. Refresh to reconnect.')
        }).catch(() => setError('Lost connection to stream.'))
      },
    })

    cleanupRef.current = cleanup
    return () => cleanup()
  }, [jobId])

  const handleCancel = () => {
    cleanupRef.current?.()
    navigate('/workflow')
  }

  if (!jobId) {
    return (
      <div className="min-h-screen bg-surface-base flex flex-col">
        <TopBar user={user} />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-text-muted">No job selected. <button onClick={() => navigate('/workflow')} className="text-orange-400 underline">Start a new analysis</button></p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface-base flex flex-col">
      <TopBar user={user} />

      {/* Sub-header */}
      <div className="border-b border-surface-border bg-surface-base px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center gap-4 flex-wrap">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 text-xs text-text-muted mb-1">
              <span>Analysis</span><span>/</span>
              <span className="font-mono text-text-secondary truncate max-w-xs">{jobId}</span>
            </div>
            {/* File pills from actual ingestion events */}
            {files.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {files.map(f => (
                  <span key={f.id || f.filename} className="text-xs px-2.5 py-1 rounded-lg border border-surface-border bg-surface-elevated text-text-secondary font-mono">
                    {f.filename}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-text-muted">Initializing...</p>
            )}
          </div>

          {/* Stats */}
          <div className="flex items-center gap-5">
            {[
              { label: 'Files',    value: files.length || '—' },
              { label: 'Chunks',   value: stats.chunks   ?? '—' },
              { label: 'Entities', value: stats.entities ?? '—' },
              { label: 'Facts',    value: stats.facts    ?? '—' },
            ].map(s => (
              <div key={s.label} className="text-center">
                <p className="text-base font-semibold text-text-primary">{s.value}</p>
                <p className="text-[10px] text-text-muted uppercase tracking-wider">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Timer + CTA */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-text-muted">
              <Clock size={12} />
              <ElapsedTimer running={!done && !error} />
            </div>
            {done ? (
              <button
                onClick={() => navigate(`/dashboard/${jobId}`)}
                className="btn-primary flex items-center gap-2 text-sm"
              >
                View Dashboard <ArrowRight size={14} />
              </button>
            ) : (
              <button onClick={handleCancel} className="btn-ghost text-sm flex items-center gap-1.5">
                <X size={13} /> Cancel
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-6 flex gap-6 min-h-0"
            style={{ maxHeight: 'calc(100vh - 112px)' }}>

        <PipelineStages
          currentStage={currentStage}
          completedStages={completedStages}
          skippedStages={skippedStages}
        />

        <div className="w-px bg-surface-border shrink-0" />

        <div className="flex-1 min-w-0 flex flex-col gap-4 overflow-hidden">
          {/* Error banner */}
          {error && (
            <div className="flex items-center gap-3 px-4 py-3 bg-red-900/10 border border-red-800/30 rounded-xl">
              <AlertCircle size={14} className="text-red-400 shrink-0" />
              <p className="text-sm text-red-400 flex-1">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300"
              >
                <RefreshCw size={12} /> Reconnect
              </button>
            </div>
          )}

          {/* Done banner */}
          {done && (
            <div className="animate-fade-in flex items-center gap-4 px-5 py-3.5 bg-green-900/10 border border-green-800/20 rounded-xl">
              <div className="w-8 h-8 rounded-full bg-green-900/30 border border-green-700/40 flex items-center justify-center shrink-0">
                <span className="text-green-400 text-base">✓</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-green-300">Pipeline Complete</p>
                <p className="text-xs text-text-secondary mt-0.5">
                  {[
                    stats.entities != null && `${stats.entities} entities`,
                    stats.facts    != null && `${stats.facts} facts`,
                    'insights generated'
                  ].filter(Boolean).join(' · ')}
                </p>
              </div>
              <button
                onClick={() => navigate(`/dashboard/${jobId}`)}
                className="btn-primary text-sm flex items-center gap-2 shrink-0"
              >
                View Dashboard <ArrowRight size={14} />
              </button>
            </div>
          )}

          {/* Live stream */}
          <div className="flex-1 min-h-0 overflow-hidden">
            <AgentStream events={events} isRunning={!done && !error} />
          </div>
        </div>
      </main>
    </div>
  )
}

import { useEffect, useRef, useMemo } from 'react'
import {
  Brain, Zap, CheckCircle2, XCircle, BarChart3,
  ChevronRight, Info, AlertTriangle, Sparkles
} from 'lucide-react'

const AGENT_COLORS = {
  Orchestrator:           'text-zinc-400',
  IngestionAgent:         'text-blue-400',
  DocumentParserAgent:    'text-orange-400',
  VisionAgent:            'text-purple-400',
  VideoAgent:             'text-pink-400',
  ChunkingAgent:          'text-cyan-400',
  EntityExtractionAgent:  'text-yellow-400',
  CrossDocumentAgent:     'text-red-400',
  KnowledgeGraphAgent:    'text-teal-400',
  InsightAgent:           'text-green-400',
  ReportAgent:            'text-orange-300',
}

const AGENT_SHORT = {
  Orchestrator:           'ORC',
  IngestionAgent:         'ING',
  DocumentParserAgent:    'DOC',
  VisionAgent:            'VIS',
  VideoAgent:             'VID',
  ChunkingAgent:          'EMB',
  EntityExtractionAgent:  'ENT',
  CrossDocumentAgent:     'CRX',
  KnowledgeGraphAgent:    'KGR',
  InsightAgent:           'INS',
  ReportAgent:            'RPT',
}

function AgentBadge({ agent }) {
  const color = AGENT_COLORS[agent] || 'text-zinc-400'
  const short = AGENT_SHORT[agent] || agent.slice(0, 3).toUpperCase()
  return (
    <span className={`font-mono text-[10px] font-semibold px-1.5 py-0.5 rounded bg-surface-elevated border border-surface-border ${color}`}>
      {short}
    </span>
  )
}

// Merge consecutive token events into streaming blocks
function buildDisplayList(events) {
  const items = []
  const streamMap = {}  // key -> index in items

  for (const ev of events) {
    if (ev.type === 'token') {
      const key = ev.data?.key || ev.agent
      if (key in streamMap) {
        const existing = items[streamMap[key]]
        items[streamMap[key]] = { ...existing, content: existing.content + ev.content }
      } else {
        streamMap[key] = items.length
        items.push({ type: 'streaming', agent: ev.agent, key, content: ev.content, timestamp: ev.timestamp })
      }
    } else {
      items.push(ev)
    }
  }
  return items
}

function StreamEntry({ event, isLastStreaming }) {
  const { agent, type, content, data } = event

  if (type === 'streaming') {
    return (
      <div className="stream-event flex gap-3 py-2">
        <div className="flex items-start gap-2 pt-0.5">
          <AgentBadge agent={agent} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <Sparkles size={11} className="text-purple-400/70 shrink-0" />
            <span className="text-[10px] font-medium text-purple-400/70 uppercase tracking-wider">LLM Reasoning</span>
            {isLastStreaming && (
              <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
            )}
          </div>
          <div className="bg-surface-raised border border-purple-500/10 rounded-lg px-3.5 py-2.5 relative overflow-hidden max-h-36 overflow-y-auto">
            <div className="absolute left-0 top-0 bottom-0 w-0.5 rounded-full bg-purple-500/30" />
            <p className="text-xs text-text-secondary leading-relaxed pl-1 font-mono whitespace-pre-wrap break-words">
              {content}
              {isLastStreaming && (
                <span className="inline-block w-[2px] h-[12px] ml-0.5 bg-purple-400 animate-pulse align-middle" />
              )}
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (type === 'thinking') {
    return (
      <div className="stream-event flex gap-3 py-2">
        <div className="flex items-start gap-2 pt-0.5">
          <AgentBadge agent={agent} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <Brain size={11} className="text-orange-400/70 shrink-0" />
            <span className="text-[10px] font-medium text-orange-400/70 uppercase tracking-wider">Thinking</span>
          </div>
          <div className="bg-surface-raised border border-orange-500/10 rounded-lg px-3.5 py-2.5 relative overflow-hidden">
            <div className="absolute left-0 top-0 bottom-0 w-0.5 rounded-full bg-orange-500/30" />
            <p className="text-xs text-text-secondary leading-relaxed pl-1">{content}</p>
          </div>
        </div>
      </div>
    )
  }

  if (type === 'action') {
    return (
      <div className="stream-event flex items-center gap-3 py-1.5">
        <AgentBadge agent={agent} />
        <ChevronRight size={11} className="text-surface-border shrink-0" />
        <div className="flex items-center gap-2 min-w-0">
          <Zap size={11} className="text-orange-500/60 shrink-0" />
          <p className="text-xs text-text-secondary font-mono truncate">{content}</p>
        </div>
      </div>
    )
  }

  if (type === 'result') {
    return (
      <div className="stream-event flex gap-3 py-1.5">
        <AgentBadge agent={agent} />
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2 px-3 py-2 bg-surface-elevated rounded-lg border border-surface-border">
            <Info size={11} className="text-blue-400/70 mt-0.5 shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-text-primary leading-relaxed">{content}</p>
              {data && Object.keys(data).length > 0 && (
                <div className="flex flex-wrap gap-2 mt-1.5">
                  {Object.entries(data).map(([k, v]) => (
                    <span key={k} className="text-[10px] px-1.5 py-0.5 rounded bg-surface-overlay border border-surface-border text-text-muted font-mono">
                      {k}: <span className="text-text-secondary">{typeof v === 'object' ? JSON.stringify(v) : String(v)}</span>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (type === 'progress') {
    const pct = data?.percent ?? 0
    const stage = data?.stage
    const total = data?.total
    return (
      <div className="stream-event flex gap-3 py-2">
        <AgentBadge agent={agent} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-xs font-medium text-text-primary">{content}</p>
            {stage && total && (
              <span className="text-[10px] text-text-muted font-mono">{stage}/{total}</span>
            )}
          </div>
          {pct > 0 && (
            <div className="h-1 bg-surface-border rounded-full overflow-hidden">
              <div className="h-full bg-orange-500 rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
            </div>
          )}
        </div>
      </div>
    )
  }

  if (type === 'complete') {
    return (
      <div className="stream-event flex items-start gap-3 py-1.5">
        <AgentBadge agent={agent} />
        <div className="flex items-start gap-2 px-3 py-2 bg-green-900/10 border border-green-800/20 rounded-lg flex-1 min-w-0">
          <CheckCircle2 size={12} className="text-green-400 mt-0.5 shrink-0" />
          <p className="text-xs text-green-300 leading-relaxed">{content}</p>
        </div>
      </div>
    )
  }

  if (type === 'error') {
    return (
      <div className="stream-event flex items-start gap-3 py-1.5">
        <AgentBadge agent={agent} />
        <div className="flex items-start gap-2 px-3 py-2 bg-red-900/10 border border-red-800/20 rounded-lg flex-1">
          <XCircle size={12} className="text-red-400 mt-0.5 shrink-0" />
          <p className="text-xs text-red-400">{content}</p>
        </div>
      </div>
    )
  }

  return null
}

export default function AgentStream({ events, isRunning }) {
  const bottomRef = useRef()
  const displayList = useMemo(() => buildDisplayList(events), [events])

  // Find the index of the last streaming block (for cursor display)
  const lastStreamingIdx = isRunning
    ? displayList.reduce((acc, item, idx) => item.type === 'streaming' ? idx : acc, -1)
    : -1

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [displayList.length])

  return (
    <div className="flex-1 min-h-0 flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <p className="section-title mb-0">Agent Activity Stream</p>
        <div className="flex items-center gap-2">
          {isRunning ? (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
              <span className="text-xs text-orange-400">Live</span>
            </>
          ) : events.length > 0 ? (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
              <span className="text-xs text-green-400">Complete</span>
            </>
          ) : null}
          <span className="text-xs text-text-muted">{events.length} events</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-0.5 pr-1">
        {displayList.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-center">
            <div className="flex gap-1 mb-3">
              <span className="thinking-dot" />
              <span className="thinking-dot" />
              <span className="thinking-dot" />
            </div>
            <p className="text-sm text-text-muted">Initializing pipeline...</p>
          </div>
        ) : (
          <>
            {displayList.map((event, idx) => {
              const prevAgent = idx > 0 ? displayList[idx - 1].agent : null
              const showDivider = prevAgent && prevAgent !== event.agent && event.type !== 'streaming'
              return (
                <div key={idx}>
                  {showDivider && (
                    <div className="flex items-center gap-3 py-2 my-1">
                      <div className="flex-1 h-px bg-surface-border" />
                      <span className="text-[10px] text-text-muted">{event.agent}</span>
                      <div className="flex-1 h-px bg-surface-border" />
                    </div>
                  )}
                  <StreamEntry event={event} isLastStreaming={idx === lastStreamingIdx} />
                </div>
              )
            })}
            <div ref={bottomRef} />
          </>
        )}
      </div>
    </div>
  )
}

import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  FileText, Tag, Hash, Lightbulb, GitCompare,
  Network, BookOpen, ChevronDown, ChevronUp,
  AlertTriangle, Download, Send, Shield, Loader,
  RefreshCw, ArrowLeft
} from 'lucide-react'
import TopBar from '../components/TopBar'
import InsightCard from '../components/InsightCard'
import ConflictCard from '../components/ConflictCard'
import KnowledgeGraph from '../components/KnowledgeGraph'
import {
  getReport, getInsights, getConflicts,
  getEntities, getFacts, getGraph, askQuery
} from '../api/client'

// ── Stat card ──────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, sub, accent }) {
  return (
    <div className="card flex items-center gap-4">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center border shrink-0 ${accent}`}>
        <Icon size={17} />
      </div>
      <div>
        <p className="text-2xl font-bold text-text-primary leading-none">{value}</p>
        <p className="text-xs text-text-secondary mt-0.5">{label}</p>
        {sub && <p className="text-[10px] text-text-muted mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

// ── Horizontal bar chart (CSS only) ───────────────────────────
function BarChart({ data, label }) {
  if (!data || !Object.keys(data).length) return null
  const entries = Object.entries(data).sort(([,a],[,b]) => b - a)
  const max = Math.max(...entries.map(([,v]) => v))
  const COLORS = ['bg-orange-500', 'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-teal-500', 'bg-pink-500']
  return (
    <div>
      <p className="section-title">{label}</p>
      <div className="space-y-2.5">
        {entries.map(([key, val], i) => (
          <div key={key} className="flex items-center gap-3">
            <span className="text-xs text-text-muted w-20 text-right truncate shrink-0">{key}</span>
            <div className="flex-1 h-2 bg-surface-elevated rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${COLORS[i % COLORS.length]}`}
                   style={{ width: `${(val / max) * 100}%` }} />
            </div>
            <span className="text-xs font-semibold text-text-primary w-6 shrink-0">{val}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Entity type chips ──────────────────────────────────────────
const TYPE_CHIP = {
  ORG:     'text-blue-400  bg-blue-900/20  border-blue-800/30',
  PERSON:  'text-purple-400 bg-purple-900/20 border-purple-800/30',
  DATE:    'text-green-400 bg-green-900/20 border-green-800/30',
  MONEY:   'text-yellow-400 bg-yellow-900/20 border-yellow-800/30',
  PRODUCT: 'text-cyan-400  bg-cyan-900/20  border-cyan-800/30',
  GPE:     'text-pink-400  bg-pink-900/20  border-pink-800/30',
}

function EntitySection({ entities }) {
  if (!entities?.length) return <p className="text-xs text-text-muted">No entities extracted.</p>
  const grouped = entities.reduce((acc, e) => {
    acc[e.entity_type] = acc[e.entity_type] || []
    acc[e.entity_type].push(e)
    return acc
  }, {})
  return (
    <div className="space-y-4">
      {Object.entries(grouped).map(([type, ents]) => {
        const chipClass = TYPE_CHIP[type] || 'text-zinc-400 bg-zinc-800/30 border-zinc-700/30'
        return (
          <div key={type}>
            <div className="flex items-center gap-2 mb-2">
              <span className={`badge border text-[10px] font-semibold ${chipClass}`}>{type}</span>
              <span className="text-xs text-text-muted">{ents.length}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {ents.map(e => (
                <div key={e.id} className="group relative">
                  <div className={`px-2.5 py-1 rounded-lg border text-xs font-medium cursor-default ${chipClass}`}>
                    {e.canonical_name}
                    {e.aliases?.length > 0 && (
                      <span className="ml-1 text-[10px] opacity-60">+{e.aliases.length}</span>
                    )}
                  </div>
                  {(e.aliases?.length > 0 || e.source_docs?.length > 0) && (
                    <div className="absolute bottom-full left-0 mb-1.5 hidden group-hover:block z-10 min-w-max">
                      <div className="bg-surface-overlay border border-surface-border rounded-lg px-3 py-2 shadow-card">
                        {e.aliases?.length > 0 && (
                          <p className="text-[10px] text-text-muted mb-1">
                            Aliases: <span className="text-text-secondary">{e.aliases.join(', ')}</span>
                          </p>
                        )}
                        {e.source_docs?.length > 0 && (
                          <p className="text-[10px] text-text-muted">
                            In: <span className="text-text-secondary">{e.source_docs.join(', ')}</span>
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Facts table ────────────────────────────────────────────────
function FactsTable({ facts }) {
  if (!facts?.length) return <p className="text-xs text-text-muted">No facts extracted.</p>
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-surface-border">
            {['Subject', 'Attribute', 'Value', 'Source', 'Confidence'].map(h => (
              <th key={h} className="text-left py-2 px-3 text-text-muted font-medium uppercase tracking-wider text-[10px]">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-surface-border/50">
          {facts.slice(0, 20).map(f => (
            <tr key={f.id} className="hover:bg-surface-elevated/50 transition-colors">
              <td className="py-2 px-3 font-medium text-text-primary">{f.subject}</td>
              <td className="py-2 px-3 text-text-secondary">{f.attribute}</td>
              <td className="py-2 px-3 font-mono text-orange-300">{f.value}</td>
              <td className="py-2 px-3 text-text-muted font-mono truncate max-w-[150px]">{f.source_doc}</td>
              <td className="py-2 px-3">
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1 bg-surface-border rounded-full max-w-12">
                    <div className="h-full bg-orange-500 rounded-full" style={{ width: `${f.confidence * 100}%` }} />
                  </div>
                  <span className="text-text-muted">{Math.round(f.confidence * 100)}%</span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {facts.length > 20 && (
        <p className="text-xs text-text-muted mt-2 px-3">{facts.length - 20} more facts not shown.</p>
      )}
    </div>
  )
}

// ── Collapsible section ────────────────────────────────────────
function Section({ title, icon: Icon, count, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="card">
      <button onClick={() => setOpen(p => !p)} className="flex items-center justify-between w-full text-left">
        <div className="flex items-center gap-2.5">
          <Icon size={15} className="text-orange-400" />
          <h2 className="text-sm font-semibold text-text-primary">{title}</h2>
          {count !== undefined && (
            <span className="badge bg-surface-elevated text-text-muted border border-surface-border text-[10px]">{count}</span>
          )}
        </div>
        {open ? <ChevronUp size={15} className="text-text-muted" /> : <ChevronDown size={15} className="text-text-muted" />}
      </button>
      {open && <div className="mt-5">{children}</div>}
    </div>
  )
}

// ── Add positions for graph nodes (circular layout) ────────────
function addPositions(nodes) {
  const n = nodes.length
  if (!n) return nodes
  const cx = 360, cy = 170, r = Math.min(140, 30 * n)
  return nodes.map((node, i) => ({
    ...node,
    x: cx + r * Math.cos((2 * Math.PI * i) / n - Math.PI / 2),
    y: cy + r * Math.sin((2 * Math.PI * i) / n - Math.PI / 2),
    size: 10,
  }))
}

// ── Loading skeleton ───────────────────────────────────────────
function Skeleton({ className = '' }) {
  return <div className={`bg-surface-elevated rounded animate-pulse ${className}`} />
}

// ── NL Query panel ─────────────────────────────────────────────
function QueryPanel({ jobId }) {
  const [q, setQ]         = useState('')
  const [loading, setL]   = useState(false)
  const [result, setR]    = useState(null)
  const [err, setE]       = useState('')

  const submit = async () => {
    if (!q.trim() || loading) return
    setL(true); setR(null); setE('')
    try {
      const res = await askQuery(jobId, q.trim())
      setR(res)
    } catch (ex) {
      setE(ex.message || 'Query failed')
    } finally {
      setL(false)
    }
  }

  return (
    <div className="card">
      <div className="flex items-center gap-2 mb-4">
        <Send size={14} className="text-orange-400" />
        <h2 className="text-sm font-semibold text-text-primary">Ask a Question</h2>
        <span className="badge bg-surface-elevated text-text-muted border border-surface-border text-[10px]">RAG</span>
      </div>
      <div className="flex gap-2">
        <input
          value={q}
          onChange={e => setQ(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && submit()}
          placeholder="e.g., What is the Q1 revenue? Which vendor has no contract?"
          className="input-base flex-1 text-sm"
        />
        <button
          onClick={submit}
          disabled={!q.trim() || loading}
          className="btn-primary flex items-center gap-2 shrink-0"
        >
          {loading ? <Loader size={14} className="animate-spin" /> : <Send size={14} />}
        </button>
      </div>

      {err && <p className="text-xs text-red-400 mt-3">{err}</p>}

      {result && (
        <div className="mt-4 space-y-3 animate-fade-in">
          <div className="px-4 py-3 bg-surface-elevated rounded-xl border border-orange-500/10 border-l-2 border-l-orange-500">
            <p className="text-sm text-text-primary leading-relaxed">{result.answer}</p>
          </div>
          {result.sources?.length > 0 && (
            <div>
              <p className="text-[10px] text-text-muted uppercase tracking-wider mb-2">Sources</p>
              <div className="space-y-1.5">
                {result.sources.map((s, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs">
                    <span className="text-orange-400 font-mono shrink-0">[{i+1}]</span>
                    <div>
                      <span className="text-text-secondary font-mono">{s.filename}</span>
                      {s.page && <span className="text-text-muted"> · p.{s.page}</span>}
                      {s.excerpt && (
                        <p className="text-text-muted mt-0.5 line-clamp-2 leading-relaxed">{s.excerpt}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Main Dashboard ─────────────────────────────────────────────
export default function DashboardPage({ user }) {
  const { jobId } = useParams()
  const navigate  = useNavigate()

  const [data, setData]     = useState({
    report: null, insights: [], conflicts: [],
    entities: [], facts: [], graph: null,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')

  useEffect(() => {
    if (!jobId) return
    setLoading(true)

    Promise.all([
      getReport(jobId).catch(() => null),
      getInsights(jobId).catch(() => []),
      getConflicts(jobId).catch(() => []),
      getEntities(jobId).catch(() => []),
      getFacts(jobId).catch(() => []),
      getGraph(jobId).catch(() => null),
    ]).then(([report, insights, conflicts, entities, facts, graph]) => {
      // Normalise graph: backend returns {nodes, links} — add positions
      let normGraph = null
      if (graph?.nodes?.length) {
        normGraph = {
          nodes: addPositions(graph.nodes),
          edges: graph.links || [],
        }
      }
      setData({ report, insights, conflicts, entities, facts, graph: normGraph })
    }).catch(err => {
      setError(err.message || 'Failed to load dashboard data.')
    }).finally(() => setLoading(false))
  }, [jobId])

  const chart = data.report?.chart_data || {}
  const summary = data.report?.executive_summary || ''

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

      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-7 space-y-6">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs text-text-muted mb-1.5">
              <button onClick={() => navigate('/workflow')} className="hover:text-text-secondary flex items-center gap-1">
                <ArrowLeft size={11} /> Workspace
              </button>
              <span>/</span>
              <span className="font-mono text-text-secondary truncate max-w-xs">{jobId}</span>
              <span>/</span>
              <span className="text-orange-400">Dashboard</span>
            </div>
            <h1 className="text-2xl font-semibold text-text-primary">Analysis Results</h1>
            {!loading && (
              <p className="text-sm text-text-secondary mt-1">
                {data.facts.length} facts · {data.entities.length} entities · {data.insights.length} insights · {data.conflicts.length} conflicts
              </p>
            )}
          </div>
          <button
            onClick={() => window.location.reload()}
            className="btn-ghost flex items-center gap-2 text-sm"
          >
            <RefreshCw size={14} /> Refresh
          </button>
        </div>

        {/* Error state */}
        {error && (
          <div className="flex items-center gap-3 px-4 py-3 bg-red-900/10 border border-red-800/30 rounded-xl">
            <AlertTriangle size={14} className="text-red-400 shrink-0" />
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {/* Loading skeletons */}
        {loading ? (
          <div className="space-y-5">
            <div className="grid grid-cols-4 gap-4">
              {[1,2,3,4].map(i => <Skeleton key={i} className="h-20" />)}
            </div>
            <Skeleton className="h-40" />
            <div className="grid grid-cols-3 gap-6">
              <div className="col-span-2 space-y-4">
                <Skeleton className="h-64" />
                <Skeleton className="h-48" />
              </div>
              <div className="space-y-4">
                <Skeleton className="h-64" />
                <Skeleton className="h-40" />
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Stats */}
            <div className="grid grid-cols-4 gap-4">
              <StatCard icon={FileText}  label="Documents"     value={data.report?.sections?.[0]?.stats?.documents ?? '—'}
                sub={chart.docs_by_type ? Object.keys(chart.docs_by_type).join(' · ').toUpperCase() : ''}
                accent="bg-blue-900/20 border-blue-800/30 text-blue-400" />
              <StatCard icon={Tag}       label="Entities"      value={data.entities.length}
                sub="After deduplication"
                accent="bg-purple-900/20 border-purple-800/30 text-purple-400" />
              <StatCard icon={Hash}      label="Facts"         value={data.facts.length}
                sub="Across all sources"
                accent="bg-teal-900/20 border-teal-800/30 text-teal-400" />
              <StatCard icon={Lightbulb} label="Insights"      value={data.insights.length}
                sub={`${data.conflicts.length} conflicts detected`}
                accent="bg-orange-900/20 border-orange-800/30 text-orange-400" />
            </div>

            {/* Executive Summary */}
            {summary && (
              <div className="card">
                <div className="flex items-center gap-2.5 mb-4">
                  <BookOpen size={15} className="text-orange-400" />
                  <h2 className="text-sm font-semibold text-text-primary">Executive Summary</h2>
                  <span className="badge bg-orange-900/20 text-orange-400 border border-orange-800/30 text-[10px]">AI Generated</span>
                </div>
                <div className="space-y-3">
                  {summary.split('\n\n').filter(Boolean).map((para, i) => (
                    <p key={i} className="text-sm text-text-secondary leading-7">{para}</p>
                  ))}
                </div>
              </div>
            )}

            {/* NL Query */}
            <QueryPanel jobId={jobId} />

            {/* Main grid */}
            <div className="grid grid-cols-3 gap-6">
              {/* Left 2/3 */}
              <div className="col-span-2 space-y-5">

                {data.insights.length > 0 && (
                  <Section title="Insights" icon={Lightbulb} count={data.insights.length}>
                    <div className="grid grid-cols-2 gap-3">
                      {data.insights.map(insight => (
                        <InsightCard key={insight.id} insight={insight} />
                      ))}
                    </div>
                  </Section>
                )}

                {data.conflicts.length > 0 && (
                  <Section title="Data Conflicts" icon={GitCompare} count={data.conflicts.length}>
                    <div className="space-y-3">
                      {data.conflicts.map((c, i) => (
                        <ConflictCard key={c.id} conflict={c} index={i} />
                      ))}
                    </div>
                  </Section>
                )}

                {data.graph?.nodes?.length > 0 && (
                  <Section title="Knowledge Graph" icon={Network}>
                    <p className="text-xs text-text-muted mb-3">
                      {data.graph.nodes.length} entity nodes · {data.graph.edges?.length || 0} relationships. Hover a node to highlight connections.
                    </p>
                    <KnowledgeGraph graph={data.graph} />
                  </Section>
                )}

                {data.facts.length > 0 && (
                  <Section title="Extracted Facts" icon={Hash} count={data.facts.length} defaultOpen={false}>
                    <FactsTable facts={data.facts} />
                  </Section>
                )}
              </div>

              {/* Right 1/3 */}
              <div className="space-y-5">

                {/* Charts */}
                {(chart.entity_types || chart.insight_types || chart.docs_by_type) && (
                  <div className="card space-y-6">
                    {chart.entity_types  && <BarChart data={chart.entity_types}  label="Entities by Type" />}
                    {chart.insight_types && Object.keys(chart.insight_types).length > 0 && (
                      <>
                        <div className="h-px bg-surface-border" />
                        <BarChart data={chart.insight_types} label="Insights by Type" />
                      </>
                    )}
                    {chart.docs_by_type  && (
                      <>
                        <div className="h-px bg-surface-border" />
                        <BarChart data={chart.docs_by_type}  label="Documents by Type" />
                      </>
                    )}
                  </div>
                )}

                {/* Data quality */}
                {data.report && (
                  <div className="card">
                    <div className="flex items-center gap-2 mb-4">
                      <Shield size={14} className="text-orange-400" />
                      <h3 className="text-xs font-semibold text-text-primary">Analysis Coverage</h3>
                    </div>
                    <div className="space-y-2.5">
                      {[
                        { label: 'Entities resolved', value: data.entities.length > 0 ? Math.min(data.entities.length / 50, 1) : 0 },
                        { label: 'Facts extracted',   value: data.facts.length > 0 ? Math.min(data.facts.length / 100, 1) : 0 },
                        { label: 'Conflicts checked', value: data.conflicts.length > 0 ? 1 : 0.5 },
                      ].map(({ label, value }) => (
                        <div key={label} className="flex items-center gap-2">
                          <span className="text-[10px] text-text-muted w-28">{label}</span>
                          <div className="flex-1 h-1 bg-surface-elevated rounded-full">
                            <div className="h-full bg-orange-500 rounded-full" style={{ width: `${value*100}%` }} />
                          </div>
                          <span className="text-[10px] text-text-muted">{Math.round(value*100)}%</span>
                        </div>
                      ))}
                    </div>
                    {data.conflicts.length > 0 && (
                      <div className="mt-4 flex items-start gap-2 px-3 py-2 bg-yellow-900/10 border border-yellow-800/20 rounded-lg">
                        <AlertTriangle size={11} className="text-yellow-400 mt-0.5 shrink-0" />
                        <p className="text-[11px] text-yellow-300/80 leading-relaxed">
                          {data.conflicts.length} unresolved cross-document conflict{data.conflicts.length !== 1 ? 's' : ''} detected.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Entities */}
                {data.entities.length > 0 && (
                  <Section title="Entities" icon={Tag} count={data.entities.length}>
                    <EntitySection entities={data.entities} />
                  </Section>
                )}

                {/* Empty state */}
                {!loading && data.insights.length === 0 && data.entities.length === 0 && (
                  <div className="card text-center py-8">
                    <p className="text-text-muted text-sm mb-2">No results yet</p>
                    <p className="text-xs text-text-muted">
                      The pipeline may still be running.{' '}
                      <button onClick={() => navigate(`/processing/${jobId}`)} className="text-orange-400 underline">
                        Check processing status
                      </button>
                    </p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  )
}

import { GitCompare, CheckCircle2, HelpCircle } from 'lucide-react'

function ConfidencePill({ value }) {
  const pct = Math.round(value * 100)
  const color = value >= 0.8 ? 'bg-green-900/20 text-green-400 border-green-800/30'
              : value >= 0.6 ? 'bg-yellow-900/20 text-yellow-400 border-yellow-800/30'
              :                'bg-zinc-800 text-text-muted border-surface-border'
  return (
    <span className={`badge border text-[10px] ${color}`}>
      {pct}% confidence
    </span>
  )
}

export default function ConflictCard({ conflict, index }) {
  // Parse description: "'Subject Attribute': 'DocA' says 'ValA', 'DocB' says 'ValB'"
  const match = conflict.description.match(/'([^']+)': '([^']+)' says '([^']+)', '([^']+)' says '([^']+)'/)
  const label = match?.[1] || 'Conflicting Fact'
  const docA  = match?.[2] || 'Source A'
  const valA  = match?.[3] || '—'
  const docB  = match?.[4] || 'Source B'
  const valB  = match?.[5] || '—'

  return (
    <div className="bg-surface-raised border border-surface-border rounded-xl p-4 hover:bg-surface-elevated transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded bg-red-900/20 border border-red-800/30 flex items-center justify-center shrink-0">
            <GitCompare size={11} className="text-red-400" />
          </div>
          <p className="text-xs font-semibold text-text-primary">{label}</p>
        </div>
        <ConfidencePill value={conflict.confidence} />
      </div>

      {/* Side by side comparison */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="px-3 py-2.5 bg-surface-elevated rounded-lg border border-surface-border">
          <p className="text-[10px] text-text-muted mb-1 font-mono truncate">{docA}</p>
          <p className="text-sm font-semibold text-text-primary">{valA}</p>
        </div>
        <div className="px-3 py-2.5 bg-surface-elevated rounded-lg border border-surface-border">
          <p className="text-[10px] text-text-muted mb-1 font-mono truncate">{docB}</p>
          <p className="text-sm font-semibold text-text-primary">{valB}</p>
        </div>
      </div>

      {/* Resolution */}
      {conflict.resolution && (
        <div className="flex items-start gap-2 px-3 py-2 bg-surface-overlay rounded-lg border border-surface-border">
          {conflict.confidence >= 0.7 ? (
            <CheckCircle2 size={11} className="text-green-400 mt-0.5 shrink-0" />
          ) : (
            <HelpCircle size={11} className="text-yellow-400 mt-0.5 shrink-0" />
          )}
          <p className="text-[11px] text-text-secondary leading-relaxed">{conflict.resolution}</p>
        </div>
      )}
    </div>
  )
}

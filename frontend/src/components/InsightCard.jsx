import { AlertTriangle, TrendingUp, Search, AlertOctagon, Lightbulb, ArrowRight } from 'lucide-react'

const TYPE_CONFIG = {
  contradiction: {
    label: 'Contradiction',
    icon: AlertTriangle,
    border: 'border-l-red-500',
    badge: 'bg-red-900/20 text-red-400 border-red-800/30',
    dot: 'bg-red-500',
  },
  risk: {
    label: 'Risk',
    icon: AlertOctagon,
    border: 'border-l-yellow-500',
    badge: 'bg-yellow-900/20 text-yellow-400 border-yellow-800/30',
    dot: 'bg-yellow-500',
  },
  pattern: {
    label: 'Pattern',
    icon: TrendingUp,
    border: 'border-l-blue-500',
    badge: 'bg-blue-900/20 text-blue-400 border-blue-800/30',
    dot: 'bg-blue-500',
  },
  gap: {
    label: 'Data Gap',
    icon: Search,
    border: 'border-l-purple-500',
    badge: 'bg-purple-900/20 text-purple-400 border-purple-800/30',
    dot: 'bg-purple-500',
  },
  discovery: {
    label: 'Discovery',
    icon: Lightbulb,
    border: 'border-l-orange-500',
    badge: 'bg-orange-900/20 text-orange-400 border-orange-800/30',
    dot: 'bg-orange-500',
  },
  trend: {
    label: 'Trend',
    icon: TrendingUp,
    border: 'border-l-teal-500',
    badge: 'bg-teal-900/20 text-teal-400 border-teal-800/30',
    dot: 'bg-teal-500',
  },
}

function ConfidenceRing({ value }) {
  const r = 16
  const circ = 2 * Math.PI * r
  const offset = circ - (value * circ)
  return (
    <div className="relative w-10 h-10 shrink-0">
      <svg className="w-10 h-10 -rotate-90" viewBox="0 0 40 40">
        <circle cx="20" cy="20" r={r} fill="none" stroke="#2A2A2A" strokeWidth="3" />
        <circle
          cx="20" cy="20" r={r} fill="none"
          stroke={value >= 0.8 ? '#C65E1A' : value >= 0.6 ? '#C4A21A' : '#6A6A6A'}
          strokeWidth="3"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[10px] font-semibold text-text-primary">
        {Math.round(value * 100)}
      </span>
    </div>
  )
}

export default function InsightCard({ insight }) {
  const config = TYPE_CONFIG[insight.insight_type] || TYPE_CONFIG.discovery
  const Icon = config.icon

  return (
    <div className={`bg-surface-raised border border-surface-border border-l-2 ${config.border} rounded-xl p-4 hover:bg-surface-elevated transition-colors`}>
      {/* Header */}
      <div className="flex items-start gap-3">
        <ConfidenceRing value={insight.confidence} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className={`badge border text-[10px] ${config.badge}`}>
              <Icon size={9} className="inline mr-1" />
              {config.label}
            </span>
          </div>
          <h3 className="text-sm font-semibold text-text-primary leading-tight">{insight.title}</h3>
        </div>
      </div>

      {/* Description */}
      <p className="text-xs text-text-secondary leading-relaxed mt-3">{insight.description}</p>

      {/* Evidence */}
      {insight.evidence?.length > 0 && (
        <div className="mt-3 space-y-1">
          {insight.evidence.slice(0, 2).map((e, i) => (
            <div key={i} className="flex items-start gap-1.5">
              <span className={`w-1 h-1 rounded-full mt-1.5 shrink-0 ${config.dot}`} />
              <p className="text-[11px] text-text-muted font-mono leading-relaxed">{e}</p>
            </div>
          ))}
        </div>
      )}

      {/* Action */}
      {insight.recommended_action && (
        <div className="mt-3 pt-3 border-t border-surface-border">
          <div className="flex items-start gap-2">
            <ArrowRight size={11} className="text-orange-400 mt-0.5 shrink-0" />
            <p className="text-xs text-orange-300/80 leading-relaxed">{insight.recommended_action}</p>
          </div>
        </div>
      )}
    </div>
  )
}

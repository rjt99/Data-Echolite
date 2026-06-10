import {
  Upload, FileText, Eye, Video, Database, Tag, GitMerge, Lightbulb,
  Check, Loader, MinusCircle
} from 'lucide-react'

const ICONS = { Upload, FileText, Eye, Video, Database, Tag, GitMerge, Lightbulb }

const STAGES = [
  { id: 1, name: 'Ingestion',          icon: 'Upload',     skipLabel: 'Skipped' },
  { id: 2, name: 'Document Parsing',   icon: 'FileText',   skipLabel: 'Skipped' },
  { id: 3, name: 'Vision Analysis',    icon: 'Eye',        skipLabel: 'No images uploaded' },
  { id: 4, name: 'Video Processing',   icon: 'Video',      skipLabel: 'No video uploaded' },
  { id: 5, name: 'Vector Embedding',   icon: 'Database',   skipLabel: 'Skipped' },
  { id: 6, name: 'Entity Extraction',  icon: 'Tag',        skipLabel: 'Skipped' },
  { id: 7, name: 'Cross-Doc Analysis', icon: 'GitMerge',   skipLabel: 'Single document' },
  { id: 8, name: 'Insight Synthesis',  icon: 'Lightbulb',  skipLabel: 'Skipped' },
]

export default function PipelineStages({ currentStage, completedStages, skippedStages = [] }) {
  return (
    <div className="w-60 shrink-0">
      <p className="section-title mb-5">Pipeline Stages</p>
      <div className="space-y-1">
        {STAGES.map((stage) => {
          const done    = completedStages.includes(stage.id)
          const active  = currentStage === stage.id
          const skipped = skippedStages.includes(stage.id)
          const pending = !done && !active && !skipped

          const Icon = ICONS[stage.icon] || FileText

          return (
            <div key={stage.id} className="relative">
              {stage.id < 8 && (
                <div className={`absolute left-[18px] top-[34px] w-px h-[calc(100%+4px)] ${
                  done ? 'bg-orange-500/40' : 'bg-surface-border'
                }`} />
              )}

              <div className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                active  ? 'bg-orange-500/10 border border-orange-500/20' :
                done    ? 'bg-surface-raised' :
                skipped ? 'bg-surface-base border border-dashed border-surface-border opacity-60' :
                          'opacity-50'
              }`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 border ${
                  done    ? 'bg-orange-500/20 border-orange-500/40' :
                  active  ? 'bg-orange-500/30 border-orange-500/60' :
                  skipped ? 'bg-surface-elevated border-surface-border' :
                            'bg-surface-elevated border-surface-border'
                }`}>
                  {done ? (
                    <Check size={12} className="text-orange-400" />
                  ) : active ? (
                    <Loader size={12} className="text-orange-400 animate-spin" />
                  ) : skipped ? (
                    <MinusCircle size={11} className="text-text-muted" />
                  ) : (
                    <Icon size={11} className="text-text-muted" />
                  )}
                </div>

                <div className="min-w-0">
                  <p className={`text-xs font-medium truncate ${
                    active  ? 'text-orange-300' :
                    done    ? 'text-text-primary' :
                    skipped ? 'text-text-muted line-through decoration-dotted' :
                              'text-text-muted'
                  }`}>
                    {stage.name}
                  </p>
                  <p className={`text-xs truncate ${
                    skipped ? 'text-text-muted italic' : 'text-text-muted'
                  }`}>
                    {done ? 'Complete' : active ? 'Running...' : skipped ? stage.skipLabel : 'Queued'}
                  </p>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

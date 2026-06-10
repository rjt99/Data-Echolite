import { useState } from 'react'

const NODE_COLORS = {
  ORG:     { fill: '#1A2E4A', stroke: '#2E5280', text: '#7CB4E8' },
  PERSON:  { fill: '#2E1A4A', stroke: '#522E80', text: '#B47CE8' },
  DATE:    { fill: '#1A3A2E', stroke: '#2E6652', text: '#7CE8B4' },
  MONEY:   { fill: '#3A2E1A', stroke: '#80662E', text: '#E8C47C' },
  PRODUCT: { fill: '#1A3A3A', stroke: '#2E8080', text: '#7CE8E8' },
  GPE:     { fill: '#3A1A2E', stroke: '#80305A', text: '#E87CB4' },
  UNKNOWN: { fill: '#2A2A2A', stroke: '#3A3A3A', text: '#8A8A8A' },
}

export default function KnowledgeGraph({ graph }) {
  const [hoveredNode, setHoveredNode] = useState(null)

  if (!graph || !graph.nodes?.length) {
    return (
      <div className="flex items-center justify-center h-full text-text-muted text-sm">
        No graph data available
      </div>
    )
  }

  const { nodes, edges } = graph
  const W = 720, H = 340

  return (
    <div className="relative overflow-hidden rounded-lg bg-surface-elevated border border-surface-border">
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} className="block">
        <defs>
          <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
            <polygon points="0 0, 8 3, 0 6" fill="#2A2A2A" />
          </marker>
        </defs>

        {/* Edges */}
        {edges.map((edge, i) => {
          const src = nodes.find(n => n.id === edge.source)
          const tgt = nodes.find(n => n.id === edge.target)
          if (!src || !tgt) return null
          const isHighlighted = hoveredNode && (src.id === hoveredNode || tgt.id === hoveredNode)
          return (
            <g key={i}>
              <line
                x1={src.x} y1={src.y} x2={tgt.x} y2={tgt.y}
                stroke={isHighlighted ? '#C65E1A' : '#2A2A2A'}
                strokeWidth={isHighlighted ? 1.5 : 1}
                strokeOpacity={isHighlighted ? 0.8 : 0.5}
                markerEnd="url(#arrowhead)"
              />
              {isHighlighted && (
                <text
                  x={(src.x + tgt.x) / 2}
                  y={(src.y + tgt.y) / 2 - 4}
                  textAnchor="middle"
                  fontSize="8"
                  fill="#C65E1A"
                  opacity="0.8"
                >
                  {edge.rel}
                </text>
              )}
            </g>
          )
        })}

        {/* Nodes */}
        {nodes.map((node) => {
          const colors = NODE_COLORS[node.type] || NODE_COLORS.UNKNOWN
          const r = node.size || 10
          const isHovered = hoveredNode === node.id
          return (
            <g
              key={node.id}
              onMouseEnter={() => setHoveredNode(node.id)}
              onMouseLeave={() => setHoveredNode(null)}
              style={{ cursor: 'pointer' }}
            >
              <circle
                cx={node.x} cy={node.y} r={isHovered ? r + 3 : r}
                fill={colors.fill}
                stroke={isHovered ? '#C65E1A' : colors.stroke}
                strokeWidth={isHovered ? 2 : 1.5}
                style={{ transition: 'r 0.15s, stroke 0.15s' }}
              />
              <text
                x={node.x} y={node.y + r + 12}
                textAnchor="middle"
                fontSize="9"
                fill={isHovered ? '#EBEBEB' : '#8A8A8A'}
                style={{ pointerEvents: 'none', transition: 'fill 0.15s' }}
              >
                {node.id.length > 14 ? node.id.slice(0, 13) + '…' : node.id}
              </text>
              {isHovered && (
                <text
                  x={node.x} y={node.y + 4}
                  textAnchor="middle"
                  fontSize="7"
                  fill={colors.text}
                  fontWeight="600"
                  style={{ pointerEvents: 'none' }}
                >
                  {node.type}
                </text>
              )}
            </g>
          )
        })}
      </svg>

      {/* Legend */}
      <div className="absolute bottom-3 right-3 flex flex-wrap gap-2 max-w-xs">
        {Object.entries(NODE_COLORS).slice(0, 6).map(([type, c]) => (
          <div key={type} className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full" style={{ background: c.stroke }} />
            <span className="text-[9px] text-text-muted">{type}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

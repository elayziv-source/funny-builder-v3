import React, { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import { ZoomIn, ZoomOut, Search, ArrowRight } from 'lucide-react';
import { useFunnel } from '../context/FunnelContext';
import { PageConfig } from '../types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface FunnelFlowViewProps {
  onSelectPage: (pageId: string) => void;
}

interface PageNode {
  id: string;
  page: PageConfig;
  pathNum: number;
  phase: Phase;
  firedEvents: string[];
}

interface Connection {
  fromId: string;
  toId: string;
  event: string;
}

type Phase = 'identity' | 'behavioral' | 'problem' | 'visualization';

// ---------------------------------------------------------------------------
// Phase helpers
// ---------------------------------------------------------------------------

const PHASE_META: Record<Phase, { label: string; color: string; glow: string; range: string }> = {
  identity:      { label: 'Identity',      color: '#60a5fa', glow: 'rgba(96,165,250,0.45)',  range: '1 - 5'  },
  behavioral:    { label: 'Behavioral',    color: '#34d399', glow: 'rgba(52,211,153,0.45)',  range: '6 - 15' },
  problem:       { label: 'Problem',       color: '#fb923c', glow: 'rgba(251,146,60,0.45)',  range: '16 - 25'},
  visualization: { label: 'Visualization', color: '#c084fc', glow: 'rgba(192,132,252,0.45)', range: '26+'    },
};

function getPhase(pathNum: number): Phase {
  if (pathNum <= 5) return 'identity';
  if (pathNum <= 15) return 'behavioral';
  if (pathNum <= 25) return 'problem';
  return 'visualization';
}

// ---------------------------------------------------------------------------
// Layout constants
// ---------------------------------------------------------------------------

const NODE_W = 220;
const NODE_H = 82;
const GAP_Y = 100;
const COL_GAP = 300;
const PADDING = 60;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const FunnelFlowView: React.FC<FunnelFlowViewProps> = ({ onSelectPage }) => {
  const { config, activePageId } = useFunnel();
  const containerRef = useRef<HTMLDivElement>(null);

  // State
  const [zoom, setZoom] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);

  // -----------------------------------------------------------------------
  // Build nodes from config.pages
  // -----------------------------------------------------------------------
  const nodes: PageNode[] = useMemo(() => {
    if (!config?.pages) return [];
    return (Object.entries(config.pages) as [string, PageConfig][])
      .map(([id, page]) => {
        const pathNum = parseInt(page.path, 10) || 0;
        return { id, page, pathNum, phase: getPhase(pathNum), firedEvents: [] as string[] };
      })
      .sort((a, b) => a.pathNum - b.pathNum);
  }, [config?.pages]);

  // -----------------------------------------------------------------------
  // Build page-event map & connections
  // -----------------------------------------------------------------------
  const { connections, nodeMap } = useMemo(() => {
    const eventRouting = config?.event_routing ?? {};
    const nMap = new Map<string, PageNode>();
    const pathToId = new Map<string, string>();

    for (const node of nodes) {
      nMap.set(node.id, node);
      pathToId.set(node.page.path, node.id);
    }

    // Scan template_data values for event names
    const pageFiredEvents = new Map<string, Set<string>>();
    for (const node of nodes) {
      const fired = new Set<string>();
      const td = node.page.template_data;
      if (td) {
        const scanValue = (val: unknown) => {
          if (typeof val === 'string' && eventRouting[val]) {
            fired.add(val);
          } else if (Array.isArray(val)) {
            val.forEach(scanValue);
          } else if (val && typeof val === 'object') {
            Object.values(val as Record<string, unknown>).forEach(scanValue);
          }
        };
        Object.values(td).forEach(scanValue);
      }
      pageFiredEvents.set(node.id, fired);
      node.firedEvents = Array.from(fired);
    }

    // Build connections
    const conns: Connection[] = [];
    for (const node of nodes) {
      const fired = pageFiredEvents.get(node.id) ?? new Set();
      for (const evt of fired) {
        const routing = eventRouting[evt];
        const targetPath: string | undefined = routing?.route?.to;
        if (targetPath) {
          const toId = pathToId.get(targetPath);
          if (toId) {
            conns.push({ fromId: node.id, toId, event: evt });
          }
        }
      }
    }

    return { connections: conns, nodeMap: nMap };
  }, [nodes, config?.event_routing]);

  // -----------------------------------------------------------------------
  // Filter by search
  // -----------------------------------------------------------------------
  const filteredNodes = useMemo(() => {
    if (!searchTerm.trim()) return nodes;
    const q = searchTerm.toLowerCase();
    return nodes.filter(
      (n) =>
        n.page.name.toLowerCase().includes(q) ||
        n.page.template.toLowerCase().includes(q) ||
        n.page.path.includes(q) ||
        n.id.toLowerCase().includes(q),
    );
  }, [nodes, searchTerm]);

  const filteredIds = useMemo(() => new Set(filteredNodes.map((n) => n.id)), [filteredNodes]);

  // -----------------------------------------------------------------------
  // Layout: position nodes in columns by phase, top-to-bottom
  // -----------------------------------------------------------------------
  const { positions, svgWidth, svgHeight } = useMemo(() => {
    const phaseOrder: Phase[] = ['identity', 'behavioral', 'problem', 'visualization'];
    const columns: Record<Phase, PageNode[]> = {
      identity: [],
      behavioral: [],
      problem: [],
      visualization: [],
    };
    for (const node of filteredNodes) {
      columns[node.phase].push(node);
    }

    const pos = new Map<string, { x: number; y: number }>();
    let colIndex = 0;
    let maxRows = 0;

    for (const phase of phaseOrder) {
      const col = columns[phase];
      if (col.length === 0) continue;
      maxRows = Math.max(maxRows, col.length);
      const x = PADDING + colIndex * (NODE_W + COL_GAP);
      col.forEach((node, rowIdx) => {
        const y = PADDING + rowIdx * (NODE_H + GAP_Y);
        pos.set(node.id, { x, y });
      });
      colIndex++;
    }

    const totalCols = colIndex || 1;
    const w = PADDING * 2 + totalCols * NODE_W + (totalCols - 1) * COL_GAP;
    const h = PADDING * 2 + maxRows * NODE_H + (maxRows - 1) * GAP_Y;

    return { positions: pos, svgWidth: Math.max(w, 800), svgHeight: Math.max(h, 500) };
  }, [filteredNodes]);

  // -----------------------------------------------------------------------
  // SVG bezier path builder
  // -----------------------------------------------------------------------
  const buildPath = useCallback(
    (fromId: string, toId: string): string | null => {
      const from = positions.get(fromId);
      const to = positions.get(toId);
      if (!from || !to) return null;

      const x1 = from.x + NODE_W;
      const y1 = from.y + NODE_H / 2;
      const x2 = to.x;
      const y2 = to.y + NODE_H / 2;

      // If target is in the same or earlier column, curve backwards
      const dx = x2 - x1;
      const cpOffset = Math.max(Math.abs(dx) * 0.5, 80);

      return `M ${x1} ${y1} C ${x1 + cpOffset} ${y1}, ${x2 - cpOffset} ${y2}, ${x2} ${y2}`;
    },
    [positions],
  );

  // -----------------------------------------------------------------------
  // Zoom handlers
  // -----------------------------------------------------------------------
  const zoomIn = useCallback(() => setZoom((z) => Math.min(z + 0.15, 2.5)), []);
  const zoomOut = useCallback(() => setZoom((z) => Math.max(z - 0.15, 0.3)), []);

  // Scroll active page into view on mount
  useEffect(() => {
    if (!activePageId || !containerRef.current) return;
    const el = containerRef.current.querySelector(`[data-node-id="${activePageId}"]`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
    }
  }, [activePageId]);

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: '100%',
        background: '#1e1e2e',
        color: '#cdd6f4',
        fontFamily: "'Inter', 'Segoe UI', sans-serif",
        borderRadius: 8,
        overflow: 'hidden',
      }}
    >
      {/* Toolbar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '10px 16px',
          borderBottom: '1px solid #313244',
          background: '#181825',
          flexShrink: 0,
        }}
      >
        <span style={{ fontWeight: 600, fontSize: 14, marginRight: 'auto', letterSpacing: 0.3 }}>
          Funnel Flow
        </span>

        {/* Search */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          {searchOpen && (
            <input
              autoFocus
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filter pages..."
              style={{
                width: 180,
                padding: '5px 10px',
                borderRadius: 6,
                border: '1px solid #45475a',
                background: '#1e1e2e',
                color: '#cdd6f4',
                fontSize: 13,
                outline: 'none',
                marginRight: 4,
              }}
            />
          )}
          <ToolbarButton onClick={() => { setSearchOpen((o) => !o); if (searchOpen) setSearchTerm(''); }} title="Search">
            <Search size={16} />
          </ToolbarButton>
        </div>

        {/* Zoom */}
        <ToolbarButton onClick={zoomOut} title="Zoom Out">
          <ZoomOut size={16} />
        </ToolbarButton>
        <span style={{ fontSize: 12, minWidth: 40, textAlign: 'center', opacity: 0.7 }}>
          {Math.round(zoom * 100)}%
        </span>
        <ToolbarButton onClick={zoomIn} title="Zoom In">
          <ZoomIn size={16} />
        </ToolbarButton>
      </div>

      {/* Canvas */}
      <div
        ref={containerRef}
        style={{
          flex: 1,
          overflow: 'auto',
          position: 'relative',
        }}
      >
        <div
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: 'top left',
            width: svgWidth,
            height: svgHeight,
            position: 'relative',
          }}
        >
          {/* SVG layer — connections */}
          <svg
            width={svgWidth}
            height={svgHeight}
            style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}
          >
            <defs>
              <marker
                id="arrowhead"
                markerWidth="8"
                markerHeight="6"
                refX="8"
                refY="3"
                orient="auto"
              >
                <polygon points="0 0, 8 3, 0 6" fill="#585b70" />
              </marker>
              {/* Glow filter */}
              <filter id="connGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="2.5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {connections.map((conn, i) => {
              if (!filteredIds.has(conn.fromId) || !filteredIds.has(conn.toId)) return null;
              const d = buildPath(conn.fromId, conn.toId);
              if (!d) return null;
              const fromNode = nodeMap.get(conn.fromId);
              const phaseColor = fromNode ? PHASE_META[fromNode.phase].color : '#585b70';
              return (
                <g key={`${conn.fromId}-${conn.toId}-${i}`}>
                  <path
                    d={d}
                    fill="none"
                    stroke={phaseColor}
                    strokeWidth={2}
                    strokeOpacity={0.5}
                    filter="url(#connGlow)"
                    markerEnd="url(#arrowhead)"
                  />
                  {/* Event label at midpoint */}
                  {(() => {
                    const from = positions.get(conn.fromId);
                    const to = positions.get(conn.toId);
                    if (!from || !to) return null;
                    const mx = (from.x + NODE_W + to.x) / 2;
                    const my = (from.y + NODE_H / 2 + to.y + NODE_H / 2) / 2 - 8;
                    return (
                      <text
                        x={mx}
                        y={my}
                        textAnchor="middle"
                        fontSize={9}
                        fill="#7f849c"
                        fontFamily="'Inter', sans-serif"
                      >
                        {conn.event.length > 24 ? conn.event.slice(0, 22) + '...' : conn.event}
                      </text>
                    );
                  })()}
                </g>
              );
            })}
          </svg>

          {/* Node layer */}
          {filteredNodes.map((node) => {
            const pos = positions.get(node.id);
            if (!pos) return null;
            const isActive = node.id === activePageId;
            const meta = PHASE_META[node.phase];
            return (
              <div
                key={node.id}
                data-node-id={node.id}
                onClick={() => onSelectPage(node.id)}
                style={{
                  position: 'absolute',
                  left: pos.x,
                  top: pos.y,
                  width: NODE_W,
                  height: NODE_H,
                  borderRadius: 10,
                  background: isActive ? '#2a2a3c' : '#1e1e2e',
                  border: `2px solid ${isActive ? meta.color : '#313244'}`,
                  boxShadow: isActive
                    ? `0 0 14px ${meta.glow}, inset 0 0 18px rgba(0,0,0,0.3)`
                    : `0 0 6px ${meta.glow.replace('0.45', '0.15')}`,
                  cursor: 'pointer',
                  padding: '10px 14px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  gap: 4,
                  transition: 'border-color 0.2s, box-shadow 0.2s, background 0.2s',
                  overflow: 'hidden',
                  userSelect: 'none',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = meta.color;
                  (e.currentTarget as HTMLDivElement).style.boxShadow = `0 0 14px ${meta.glow}`;
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    (e.currentTarget as HTMLDivElement).style.borderColor = '#313244';
                    (e.currentTarget as HTMLDivElement).style.boxShadow = `0 0 6px ${meta.glow.replace('0.45', '0.15')}`;
                  }
                }}
              >
                {/* Path badge + name */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 24,
                      height: 24,
                      borderRadius: 6,
                      background: meta.color,
                      color: '#1e1e2e',
                      fontSize: 11,
                      fontWeight: 700,
                      flexShrink: 0,
                    }}
                  >
                    {node.page.path}
                  </span>
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      color: '#cdd6f4',
                    }}
                    title={node.page.name}
                  >
                    {node.page.name}
                  </span>
                </div>

                {/* Template tag */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, paddingLeft: 32 }}>
                  <ArrowRight size={10} style={{ opacity: 0.4, flexShrink: 0 }} />
                  <span
                    style={{
                      fontSize: 10,
                      opacity: 0.55,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                    title={node.page.template}
                  >
                    {node.page.template}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 20,
          padding: '8px 16px',
          borderTop: '1px solid #313244',
          background: '#181825',
          flexShrink: 0,
          flexWrap: 'wrap',
        }}
      >
        {(Object.entries(PHASE_META) as [Phase, typeof PHASE_META[Phase]][]).map(([key, meta]) => (
          <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: 3,
                background: meta.color,
                display: 'inline-block',
                boxShadow: `0 0 6px ${meta.glow}`,
              }}
            />
            <span style={{ fontSize: 11, opacity: 0.8 }}>
              {meta.label}{' '}
              <span style={{ opacity: 0.5 }}>({meta.range})</span>
            </span>
          </div>
        ))}

        <span style={{ marginLeft: 'auto', fontSize: 11, opacity: 0.45 }}>
          {filteredNodes.length} page{filteredNodes.length !== 1 ? 's' : ''}
          {searchTerm ? ` matching "${searchTerm}"` : ''}
        </span>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Toolbar button helper
// ---------------------------------------------------------------------------

function ToolbarButton({
  onClick,
  children,
  title,
}: {
  onClick: () => void;
  children: React.ReactNode;
  title?: string;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 30,
        height: 30,
        borderRadius: 6,
        border: '1px solid #45475a',
        background: 'transparent',
        color: '#cdd6f4',
        cursor: 'pointer',
        transition: 'background 0.15s',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background = '#313244';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
      }}
    >
      {children}
    </button>
  );
}

export default FunnelFlowView;

import type { QueryToolType } from '../core/types.js';
import { colors, spacing, fontSize, fontWeight, fontFamily, borderRadius, shadows, transitions } from '../core/theme.js';

// Re-export the type for convenience
export type QueryTool = QueryToolType;

export interface QueryToolsPanelProps {
  activeTool: QueryToolType | null;
  onToolSelect: (tool: QueryToolType | null) => void;
  availableTools?: QueryToolType[];
}

const TOOL_CONFIG: Record<QueryToolType, { icon: string; label: string; description: string }> = {
  point: {
    icon: '🎯',
    label: 'Point',
    description: 'Click to query data at a point'
  },
  aoi: {
    icon: '📐',
    label: 'AOI',
    description: 'Draw polygon to query area'
  }
};

export function QueryToolsPanel({
  activeTool,
  onToolSelect,
  availableTools = ['point', 'aoi'],
}: QueryToolsPanelProps) {

  return (
    <div
      style={{
        position: 'absolute',
        top: '10px',
        right: '10px',
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(8px)',
        borderRadius: borderRadius.md,
        boxShadow: shadows.md,
        padding: spacing[1.5],
        display: 'flex',
        gap: spacing[1],
        zIndex: 1000,
        fontFamily: fontFamily.sans,
      }}
    >
      {availableTools.map(tool => {
        const config = TOOL_CONFIG[tool];
        const isActive = activeTool === tool;
        
        return (
          <button
            key={tool}
            onClick={() => onToolSelect(isActive ? null : tool)}
            title={config.description}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: spacing[1],
              padding: `${spacing[1.5]} ${spacing[2.5]}`,
              background: isActive ? colors.slate[800] : 'transparent',
              border: `1px solid ${isActive ? colors.slate[600] : 'transparent'}`,
              borderRadius: borderRadius.sm,
              cursor: 'pointer',
              fontSize: fontSize.sm,
              fontWeight: fontWeight.medium,
              fontFamily: fontFamily.sans,
              color: isActive ? colors.foreground : colors.slate[600],
              transition: transitions.default,
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={(e) => {
              if (!isActive) {
                e.currentTarget.style.background = colors.slate[100];
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive) {
                e.currentTarget.style.background = 'transparent';
              }
            }}
          >
            <span style={{ fontSize: fontSize.base }}>{config.icon}</span>
            <span>{config.label}</span>
          </button>
        );
      })}
    </div>
  );
}

import type { ClickInfoConfig } from '../core/types.js';

export interface ClickInfoProps {
  x: number;
  y: number;
  properties: Record<string, any> | null;
  clickInfoConfig: ClickInfoConfig | null;
  visible: boolean;
  onClose: () => void;
}

export function ClickInfo({ x, y, properties, clickInfoConfig, visible, onClose }: ClickInfoProps) {
  if (!visible || !properties || !clickInfoConfig) {
    return null;
  }

  const title = clickInfoConfig.title ? clickInfoConfig.title(properties) : 'Feature Info';

  return (
    <div
      data-click-info-popup
      style={{
        position: 'absolute',
        left: x + 10,
        top: y - 10,
        background: 'rgba(0, 0, 0, 0.9)',
        color: 'white',
        padding: '12px 16px',
        borderRadius: '8px',
        fontSize: '13px',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
        pointerEvents: 'auto',
        zIndex: 1000,
        maxWidth: '350px',
        minWidth: '200px',
        border: '1px solid rgba(255,255,255,0.2)',
      }}
    >
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'flex-start',
        marginBottom: title ? '8px' : '0'
      }}>
        {title && (
          <div style={{ 
            fontWeight: 'bold', 
            fontSize: '14px',
            flex: 1
          }}>
            {title}
          </div>
        )}
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: 'rgba(255,255,255,0.7)',
            cursor: 'pointer',
            fontSize: '16px',
            padding: '0',
            marginLeft: '8px',
            lineHeight: '1',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'white';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'rgba(255,255,255,0.7)';
          }}
        >
          ×
        </button>
      </div>
      
      {title && (
        <div style={{ 
          borderBottom: '1px solid rgba(255,255,255,0.3)',
          marginBottom: '8px'
        }} />
      )}
      
      {clickInfoConfig.fields.map(field => {
        const value = properties[field.key];
        if (value === undefined || value === null) return null;
        
        const formattedValue = field.format ? field.format(value) : String(value);
        
        return (
          <div key={field.key} style={{ marginBottom: '6px' }}>
            <span style={{ color: 'rgba(255,255,255,0.8)' }}>
              {field.label}:
            </span>{' '}
            <span style={{ fontWeight: '500' }}>
              {formattedValue}
            </span>
          </div>
        );
      })}
    </div>
  );
}

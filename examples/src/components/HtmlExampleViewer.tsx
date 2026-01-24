import { useState } from 'react';
import { Highlight, themes } from 'prism-react-renderer';

interface HtmlExampleViewerProps {
  title: string;
  htmlPath: string; // e.g., "/google-maps-example.html" - used for iframe src
  sourceCode: string; // Raw HTML source (imported via ?raw)
  onBack?: () => void;
}

export default function HtmlExampleViewer({
  title,
  htmlPath,
  sourceCode,
  onBack
}: HtmlExampleViewerProps) {
  const [showCode, setShowCode] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(sourceCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div style={{
      height: '100vh',
      width: '100vw',
      display: 'flex',
      flexDirection: 'column',
      background: '#0a0a0b',
      fontFamily: 'Space Grotesk, -apple-system, BlinkMacSystemFont, sans-serif',
      overflow: 'hidden'
    }}>
      {/* Top Bar */}
      <div style={{
        height: '56px',
        background: '#18181b',
        borderBottom: '1px solid #27272a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 20px',
        flexShrink: 0
      }}>
        {/* Left: Back button + Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {onBack && (
            <button
              onClick={onBack}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#a1a1aa',
                cursor: 'pointer',
                padding: '8px',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#27272a';
                e.currentTarget.style.color = '#e4e4e7';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = '#a1a1aa';
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
            </button>
          )}
          <h1 style={{
            margin: 0,
            fontSize: '16px',
            fontWeight: 600,
            color: 'white',
            letterSpacing: '-0.01em'
          }}>
            {title}
          </h1>
          {/* HTML badge */}
          <span style={{
            fontSize: '10px',
            fontWeight: 600,
            color: '#f97316',
            background: 'rgba(249, 115, 22, 0.15)',
            padding: '4px 8px',
            borderRadius: '4px',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            HTML
          </span>
        </div>

        {/* Right: Code toggle */}
        <button
          onClick={() => setShowCode(!showCode)}
          style={{
            background: showCode ? '#facc15' : 'transparent',
            border: showCode ? 'none' : '1px solid #3f3f46',
            borderRadius: '8px',
            padding: '10px 16px',
            color: showCode ? '#0a0a0b' : '#e4e4e7',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.15s'
          }}
          onMouseEnter={(e) => {
            if (!showCode) {
              e.currentTarget.style.background = '#27272a';
              e.currentTarget.style.borderColor = '#52525b';
            }
          }}
          onMouseLeave={(e) => {
            if (!showCode) {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.borderColor = '#3f3f46';
            }
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="16 18 22 12 16 6"/>
            <polyline points="8 6 2 12 8 18"/>
          </svg>
          {showCode ? 'Hide Code' : 'Show Code'}
        </button>
      </div>

      {/* Main Content Area */}
      <div style={{
        flex: 1,
        display: 'flex',
        overflow: 'hidden',
        minHeight: 0
      }}>
        {/* Example Panel - iframe */}
        <div style={{
          flex: showCode ? '0 0 50%' : '1 1 100%',
          transition: 'flex 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          overflow: 'hidden',
          position: 'relative',
          minWidth: 0
        }}>
          <iframe
            src={htmlPath}
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              background: 'white'
            }}
            title={title}
          />
        </div>

        {/* Code Panel */}
        <div style={{
          flex: showCode ? '0 0 50%' : '0 0 0%',
          background: '#0d1117',
          borderLeft: showCode ? '1px solid #27272a' : 'none',
          overflow: 'hidden',
          transition: 'flex 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0
        }}>
          {showCode && (
            <>
              {/* Code Panel Header */}
              <div style={{
                height: '48px',
                background: '#161b22',
                borderBottom: '1px solid #30363d',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 16px',
                flexShrink: 0
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <span style={{
                    fontSize: '13px',
                    color: '#8b949e',
                    fontFamily: '"JetBrains Mono", "Fira Code", monospace'
                  }}>
                    HTML
                  </span>
                </div>
                <button
                  onClick={handleCopy}
                  style={{
                    background: copied ? '#238636' : 'transparent',
                    border: copied ? 'none' : '1px solid #30363d',
                    borderRadius: '6px',
                    padding: '6px 12px',
                    color: copied ? 'white' : '#8b949e',
                    fontSize: '12px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.15s'
                  }}
                  onMouseEnter={(e) => {
                    if (!copied) {
                      e.currentTarget.style.background = '#21262d';
                      e.currentTarget.style.color = '#e6edf3';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!copied) {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = '#8b949e';
                    }
                  }}
                >
                  {copied ? (
                    <>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                      Copied!
                    </>
                  ) : (
                    <>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                      </svg>
                      Copy
                    </>
                  )}
                </button>
              </div>

              {/* Code Content with Prism highlighting */}
              <div style={{
                flex: 1,
                overflow: 'auto',
                minHeight: 0
              }}>
                <Highlight
                  theme={themes.nightOwl}
                  code={sourceCode.trim()}
                  language="markup"
                >
                  {({ className, style, tokens, getLineProps, getTokenProps }) => (
                    <pre
                      className={className}
                      style={{
                        ...style,
                        margin: 0,
                        padding: '16px',
                        background: 'transparent',
                        fontFamily: '"JetBrains Mono", "Fira Code", "SF Mono", Consolas, monospace',
                        fontSize: '13px',
                        lineHeight: 1.6,
                        overflowX: 'auto',
                        minWidth: '100%',
                        boxSizing: 'border-box'
                      }}
                    >
                      {tokens.map((line, i) => {
                        const lineProps = getLineProps({ line, key: i });
                        return (
                          <div
                            key={i}
                            {...lineProps}
                            style={{
                              ...lineProps.style,
                              display: 'flex',
                              minHeight: '21px'
                            }}
                          >
                            {/* Line number */}
                            <span
                              style={{
                                display: 'inline-block',
                                width: '48px',
                                flexShrink: 0,
                                textAlign: 'right',
                                paddingRight: '16px',
                                color: '#484f58',
                                userSelect: 'none',
                                fontSize: '12px'
                              }}
                            >
                              {i + 1}
                            </span>
                            {/* Code content */}
                            <span style={{ flex: 1 }}>
                              {line.map((token, key) => (
                                <span key={key} {...getTokenProps({ token, key })} />
                              ))}
                            </span>
                          </div>
                        );
                      })}
                    </pre>
                  )}
                </Highlight>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

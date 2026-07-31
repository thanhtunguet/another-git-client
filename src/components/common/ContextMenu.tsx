import React from 'react';
import { useGitClient } from '../../context/GitClientContext';

export const ContextMenu: React.FC = () => {
  const { menu, closeMenu } = useGitClient();

  if (!menu) return null;

  return (
    <div className="gc-context-menu-overlay" onClick={closeMenu} onContextMenu={closeMenu}>
      <div
        className="gc-context-menu"
        style={{
          left: `${menu.x}px`,
          top: `${menu.y}px`
        }}
        onClick={e => e.stopPropagation()}
      >
        {menu.title && (
          <div
            style={{
              padding: '5px 9px 6px',
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              color: 'var(--fg3)',
              borderBottom: '1px solid var(--line)',
              marginBottom: '4px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
          >
            {menu.title}
          </div>
        )}
        {menu.items.map((m, i) => {
          if (m.sep) {
            return (
              <div
                key={i}
                style={{
                  height: '1px',
                  margin: '4px 6px',
                  background: 'var(--line)'
                }}
              />
            );
          }

          return (
            <div
              key={i}
              onClick={() => {
                closeMenu();
                if (m.run) m.run();
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                height: '25px',
                padding: '0 9px',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                background: 'transparent',
                color: m.danger ? 'var(--del)' : 'var(--fg)',
                fontSize: '12.5px'
              }}
              className="gc-menu-item"
            >
              <span style={{ flex: 1, whiteSpace: 'nowrap' }}>{m.label}</span>
              {m.hint && (
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '10.5px',
                    color: 'var(--fg3)'
                  }}
                >
                  {m.hint}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

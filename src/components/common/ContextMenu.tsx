import React, { useEffect, useRef } from 'react';
import { useGitClient } from '../../context/GitClientContext';

export const ContextMenu: React.FC = () => {
  const { menu, closeMenu } = useGitClient();
  const itemRefs = useRef<Array<HTMLDivElement | null>>([]);
  const actionableIndices = (menu?.items || [])
    .map((m, i) => (m.sep ? -1 : i))
    .filter(i => i >= 0);

  useEffect(() => {
    if (menu && actionableIndices.length) {
      itemRefs.current[actionableIndices[0]]?.focus();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [menu]);

  if (!menu) return null;

  const focusRelative = (fromIndex: number, delta: number) => {
    const pos = actionableIndices.indexOf(fromIndex);
    if (pos < 0 || !actionableIndices.length) return;
    const nextPos = (pos + delta + actionableIndices.length) % actionableIndices.length;
    itemRefs.current[actionableIndices[nextPos]]?.focus();
  };

  return (
    <div className="gc-context-menu-overlay" onClick={closeMenu} onContextMenu={closeMenu}>
      <div
        className="gc-context-menu"
        role="menu"
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
                role="separator"
                style={{
                  height: '1px',
                  margin: '4px 6px',
                  background: 'var(--line)'
                }}
              />
            );
          }

          const activate = () => {
            closeMenu();
            if (m.run) m.run();
          };

          return (
            <div
              key={i}
              ref={el => { itemRefs.current[i] = el; }}
              role="menuitem"
              tabIndex={-1}
              onClick={activate}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  activate();
                } else if (e.key === 'ArrowDown') {
                  e.preventDefault();
                  focusRelative(i, 1);
                } else if (e.key === 'ArrowUp') {
                  e.preventDefault();
                  focusRelative(i, -1);
                }
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

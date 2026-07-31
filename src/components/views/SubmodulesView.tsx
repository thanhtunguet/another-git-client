import React from 'react';
import { useGitClient } from '../../context/GitClientContext';
import { Button } from '../common/Button';
import { SubmoduleItem } from '../../types/git-client';

export const SubmodulesView: React.FC = () => {
  const { act, openMenu, updateAll } = useGitClient();

  const rawSubmodules: SubmoduleItem[] = [
    {
      group: 'Needs attention',
      groupColor: 'var(--warn)',
      path: 'tools/lib/bpf',
      url: 'https://github.com/libbpf/libbpf.git',
      state: 'out of sync — recorded 2f8a1c4',
      sha: '9b41ac2',
      dot: 'var(--warn)',
      icon: 'ph-warning-circle',
      mark: 'var(--warn)'
    },
    {
      path: 'tools/testing/selftests/bpf/bpftool',
      url: 'https://github.com/libbpf/bpftool.git',
      state: 'modified content',
      sha: '77de1b0',
      dot: 'var(--warn)',
      icon: 'ph-warning-circle',
      mark: 'var(--warn)'
    },
    {
      group: 'Clean',
      groupColor: 'var(--fg3)',
      path: 'Documentation/sphinx-static',
      url: 'https://git.kernel.org/pub/scm/docs/sphinx.git',
      state: 'up to date',
      sha: '4c1f9ab',
      dot: 'var(--add)',
      icon: 'ph-package',
      mark: 'transparent'
    },
    {
      path: 'scripts/dtc/libfdt',
      url: 'https://github.com/dgibson/dtc.git',
      state: 'up to date',
      sha: 'a80e4b6',
      dot: 'var(--add)',
      icon: 'ph-package',
      mark: 'transparent'
    },
    {
      group: 'Uninitialized',
      groupColor: 'var(--fg3)',
      path: 'tools/perf/pmu-events/jevents',
      url: 'https://github.com/intel/perfmon.git',
      state: 'not initialized',
      sha: '—',
      dot: 'var(--fg3)',
      icon: 'ph-package',
      mark: 'transparent'
    },
    {
      group: 'Nested',
      groupColor: 'var(--fg3)',
      path: 'tools/lib/bpf/xsk',
      url: 'https://github.com/xdp-project/xsk.git',
      state: 'up to date',
      sha: 'd59f2c1',
      dot: 'var(--add)',
      icon: 'ph-package',
      mark: 'transparent',
      pad: 34
    }
  ];

  const handleMenu = (e: React.MouseEvent, m: SubmoduleItem) => {
    openMenu(e, m.path, [
      { label: 'Init', run: act('Submodule init', `submodule init ${m.path}`) },
      { label: 'Update', run: act('Submodule update', `submodule update ${m.path}`) },
      { label: 'Update --recursive', run: () => updateAll() },
      { label: 'Sync URL', run: act('Submodule sync') },
      { sep: true },
      { label: 'Checkout recorded commit', run: act('Checkout recorded commit') },
      { label: 'Pull tracked branch', run: act('Pull submodule') },
      { label: 'Show pointer diff', run: act('Show pointer diff') },
      { label: 'Stage pointer change', run: act('Stage pointer') },
      { label: 'Open in new window', run: act('Open submodule') },
      { sep: true },
      { label: 'Deinit', danger: true, run: act('Deinit') }
    ]);
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <div
        style={{
          flex: '0 0 auto',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          height: '38px',
          padding: '0 var(--space-4)',
          borderBottom: '1px solid var(--line)',
          background: 'var(--panel)'
        }}
      >
        <span style={{ fontWeight: 500 }}>Submodules</span>
        <span style={{ fontSize: '11px', color: 'var(--fg3)' }}>7 total · 2 need attention</span>
        <div style={{ flex: 1 }} />
        <Button
          variant="secondary"
          style={{ height: '25px' }}
          onClick={act('Init all submodules', 'submodule init')}
        >
          Init all
        </Button>
        <Button
          variant="secondary"
          style={{ height: '25px' }}
          onClick={act('Sync submodule URLs', 'submodule sync --recursive')}
        >
          Sync URLs
        </Button>
        <Button variant="primary" style={{ height: '25px' }} onClick={updateAll}>
          Update all --recursive
        </Button>
      </div>

      <div style={{ flex: 1, overflow: 'auto', minHeight: 0, padding: 'var(--space-1) 0' }}>
        {rawSubmodules.map((s, i) => {
          const pad = s.pad || 14;
          const stateColor = s.dot === 'var(--warn)' ? 'var(--warn)' : 'var(--fg3)';

          return (
            <div key={i}>
              {s.group && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-2)',
                    height: '26px',
                    padding: '0 var(--space-4)',
                    marginTop: 'var(--space-2)',
                    fontSize: '10.5px',
                    textTransform: 'uppercase',
                    letterSpacing: '.07em',
                    color: s.groupColor || 'var(--fg3)'
                  }}
                >
                  <span>{s.group}</span>
                  <span style={{ flex: 1, height: '1px', background: 'var(--line)' }} />
                </div>
              )}
              <div
                onClick={e => handleMenu(e, s)}
                onContextMenu={e => handleMenu(e, s)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-4)',
                  height: '42px',
                  paddingRight: 'var(--space-4)',
                  paddingLeft: `${pad}px`,
                  cursor: 'pointer',
                  borderLeft: `2px solid ${s.mark}`
                }}
                className="gc-hover-bg"
              >
                <i className={`ph ${s.icon}`} style={{ fontSize: '16px', color: s.dot }} />
                <span
                  style={{
                    width: '210px',
                    flex: '0 0 auto',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '12.5px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {s.path}
                </span>
                <span
                  style={{
                    flex: 1,
                    minWidth: 0,
                    fontSize: '11.5px',
                    color: 'var(--fg3)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {s.url}
                </span>
                <span style={{ fontSize: '11px', color: stateColor }}>{s.state}</span>
                <span
                  style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--iris)' }}
                >
                  {s.sha}
                </span>
                <i className="ph ph-dots-three" style={{ fontSize: '15px', color: 'var(--fg3)' }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

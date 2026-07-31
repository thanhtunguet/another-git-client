import React from 'react';
import { useGitClient } from '../../context/GitClientContext';
import { Button } from '../common/Button';

export const DiffView: React.FC = () => {
  const { diffTab, setDiffTab, act } = useGitClient();

  const tabs: [id: 'work' | 'index' | 'parent' | 'refs' | 'merge' | 'sources', label: string][] = [
    ['work', 'Working tree ↔ HEAD'],
    ['index', 'Index ↔ HEAD'],
    ['parent', 'Commit ↔ parent'],
    ['refs', 'main ↔ feature/mlx5-next'],
    ['merge', '3-way merge — 2 conflicts'],
    ['sources', 'Compare two text sources']
  ];

  const monoStyle: React.CSSProperties = {
    fontFamily: 'var(--font-mono)',
    fontSize: '11.8px',
    lineHeight: '18px'
  };

  const renderDiffPane = () => {
    if (diffTab === 'merge') {
      const col = (title: string, tint: string, lines: [string, number][], fill: string) => (
        <div
          style={{
            flex: 1,
            minWidth: 0,
            display: 'flex',
            flexDirection: 'column',
            borderRight: '1px solid var(--line)'
          }}
        >
          <div
            style={{
              height: '26px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '0 10px',
              background: 'var(--panel)',
              borderBottom: '1px solid var(--line)',
              fontSize: '11px'
            }}
          >
            <span style={{ width: '7px', height: '7px', borderRadius: '2px', background: tint }} />{' '}
            {title}
          </div>
          <div style={{ flex: 1, overflow: 'auto', padding: '6px 0' }}>
            {lines.map((l, i) => (
              <div
                key={i}
                style={{
                  ...monoStyle,
                  whiteSpace: 'pre',
                  padding: '0 10px',
                  background: l[1] ? fill : 'transparent',
                  color: l[1] ? 'var(--fg)' : 'var(--fg2)'
                }}
              >
                {l[0]}
              </div>
            ))}
          </div>
        </div>
      );

      const left: [string, number][] = [
        ['\tif (unlikely(!priv->channels.num))', 0],
        ['\t\treturn;', 0],
        ['\tmlx5e_reporter_tx_err_cqe(sq);', 1],
        ['\tqueue_work(priv->wq, &sq->recover_work);', 1]
      ];
      const mid: [string, number][] = [
        ['\tif (unlikely(!priv->channels.num))', 0],
        ['\t\treturn;', 0],
        ['<<<<<<< HEAD', 1],
        ['\tmlx5e_reporter_tx_err_cqe(sq);', 1],
        ['=======', 1],
        ['\tmlx5e_reporter_tx_err_cqe(sq, ctx);', 1],
        ['>>>>>>> feature/mlx5-next', 1]
      ];
      const right: [string, number][] = [
        ['\tif (unlikely(!priv->channels.num))', 0],
        ['\t\treturn;', 0],
        ['\tmlx5e_reporter_tx_err_cqe(sq, ctx);', 1],
        ['\tmlx5e_tx_flush(sq);', 1]
      ];

      return (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <div
            style={{
              flex: '0 0 auto',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '0 12px',
              background: 'var(--panel)',
              borderBottom: '1px solid var(--line)'
            }}
          >
            <span style={{ fontSize: '11.5px', color: 'var(--warn)' }}>2 conflicts remaining</span>
            <span style={{ flex: 1 }} />
            <Button
              variant="secondary"
              onClick={act('Previous conflict')}
              style={{ height: '22px', fontSize: '11.5px' }}
            >
              ↑ Previous
            </Button>
            <Button
              variant="secondary"
              onClick={act('Next conflict')}
              style={{ height: '22px', fontSize: '11.5px' }}
            >
              ↓ Next
            </Button>
            <Button
              variant="secondary"
              onClick={act('Take left')}
              style={{ height: '22px', fontSize: '11.5px' }}
            >
              Take left
            </Button>
            <Button
              variant="secondary"
              onClick={act('Take right')}
              style={{ height: '22px', fontSize: '11.5px' }}
            >
              Take right
            </Button>
            <Button
              variant="primary"
              onClick={act('Mark resolved')}
              style={{ height: '22px', fontSize: '11.5px' }}
            >
              Resolve
            </Button>
          </div>
          <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
            {col('Local — main', 'var(--color-accent)', left, 'var(--delbg)')}
            {col('Result — working tree', 'var(--warn)', mid, 'var(--raised)')}
            {col('Remote — feature/mlx5-next', 'var(--add)', right, 'var(--addbg)')}
          </div>
        </div>
      );
    }

    const hunk: [string, string][] = [
      [
        '@@ -412,9 +412,14 @@ static void mlx5e_tx_err_cqe_work(struct work_struct *recover_work)',
        'h'
      ],
      [' \tstruct mlx5e_txqsq *sq = container_of(recover_work, struct mlx5e_txqsq,', ' '],
      [' \t\t\t\t      recover_work);', ' '],
      [' ', ' '],
      ['-\tmlx5e_reporter_tx_err_cqe(sq);', '-'],
      ['-\tif (unlikely(!priv->channels.num))', '-'],
      ['+\tif (unlikely(!priv->channels.num ||', '+'],
      ['+\t\t     !test_bit(MLX5E_STATE_OPENED, &priv->state)))', '+'],
      ['+\t\treturn;', '+'],
      ['+', '+'],
      ['+\tmlx5e_reporter_tx_err_cqe(sq);', '+'],
      [' \t\treturn;', ' '],
      [' }', ' '],
      [
        '@@ -488,6 +493,8 @@ int mlx5e_open_txqsq(struct mlx5e_channel *c, u32 tisn, int txq_ix,',
        'h'
      ],
      [' \tsq->stop_room = param->stop_room;', ' '],
      ['+\tsq->tunnel_steering = MLX5_CAP_ETH(mdev, tunnel_stateless_gre);', '+'],
      [' \tINIT_WORK(&sq->recover_work, mlx5e_tx_err_cqe_work);', ' ']
    ];

    let oldN = 411;
    let newN = 411;

    const rows = hunk.map((h, i) => {
      const text = h[0];
      const k = h[1];
      const bg =
        k === '+'
          ? 'var(--addbg)'
          : k === '-'
            ? 'var(--delbg)'
            : k === 'h'
              ? 'var(--raised)'
              : 'transparent';
      const fg =
        k === '+'
          ? 'var(--add)'
          : k === '-'
            ? 'var(--del)'
            : k === 'h'
              ? 'var(--fg3)'
              : 'var(--fg)';
      let ln1: string | number = '';
      let ln2: string | number = '';

      if (k === 'h') {
        const m = /\+(\d+)/.exec(text);
        if (m) {
          newN = +m[1] - 1;
          oldN = +m[1] - 1;
        }
      } else {
        if (k !== '+') ln1 = ++oldN;
        if (k !== '-') ln2 = ++newN;
      }

      return (
        <div key={i} style={{ display: 'flex', background: bg, ...monoStyle }}>
          <span
            style={{
              width: '46px',
              flex: '0 0 auto',
              textAlign: 'right',
              paddingRight: '8px',
              color: 'var(--fg3)',
              userSelect: 'none'
            }}
          >
            {ln1}
          </span>
          <span
            style={{
              width: '46px',
              flex: '0 0 auto',
              textAlign: 'right',
              paddingRight: '10px',
              color: 'var(--fg3)',
              userSelect: 'none',
              borderRight: '1px solid var(--line)'
            }}
          >
            {ln2}
          </span>
          <span style={{ paddingLeft: '10px', whiteSpace: 'pre', color: fg, flex: 1 }}>{text}</span>
        </div>
      );
    });

    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <div
          style={{
            flex: '0 0 auto',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '0 12px',
            background: 'var(--panel)',
            borderBottom: '1px solid var(--line)'
          }}
        >
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
            drivers/net/ethernet/mellanox/mlx5/core/en_tx.c
          </span>
          <span style={{ fontSize: '11px', color: 'var(--add)' }}>+7</span>
          <span style={{ fontSize: '11px', color: 'var(--del)' }}>−2</span>
          <span style={{ flex: 1 }} />
          <Button
            variant="secondary"
            style={{ height: '22px', fontSize: '11.5px' }}
            onClick={() => setDiffTab(diffTab === 'sources' ? 'work' : 'sources')}
          >
            {diffTab === 'sources' ? 'Unified' : 'Split'}
          </Button>
          <Button
            variant="secondary"
            style={{ height: '22px', fontSize: '11.5px' }}
            onClick={act('Stage hunk')}
          >
            Stage hunk
          </Button>
          <Button
            variant="secondary"
            style={{ height: '22px', fontSize: '11.5px' }}
            onClick={act('Copy patch')}
          >
            Copy patch
          </Button>
        </div>
        <div
          style={{
            flex: 1,
            overflow: 'auto',
            minHeight: 0,
            padding: '6px 0',
            background: 'var(--color-bg)'
          }}
        >
          {rows}
        </div>
      </div>
    );
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <div
        style={{
          flex: '0 0 auto',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          height: '38px',
          padding: '0 var(--space-3)',
          borderBottom: '1px solid var(--line)',
          background: 'var(--panel)',
          overflow: 'auto'
        }}
      >
        {tabs.map(t => {
          const active = diffTab === t[0];
          return (
            <Button
              key={t[0]}
              variant="secondary"
              onClick={() => setDiffTab(t[0])}
              style={{
                flex: '0 0 auto',
                height: '25px',
                fontSize: '11.5px',
                whiteSpace: 'nowrap',
                color: active ? 'var(--color-accent)' : 'var(--fg2)',
                boxShadow: active ? 'inset 0 0 0 1px var(--color-accent)' : 'none'
              }}
            >
              {t[1]}
            </Button>
          );
        })}
        <div style={{ flex: 1, minWidth: '20px' }} />
        <Button
          variant="secondary"
          onClick={act('Swap diff direction')}
          style={{ flex: '0 0 auto', height: '25px', fontSize: '11.5px' }}
        >
          <i className="ph ph-arrows-left-right" style={{ fontSize: '13px' }} /> Swap direction
        </Button>
        <Button
          variant="secondary"
          onClick={act('Compare with revision')}
          style={{ flex: '0 0 auto', height: '25px', fontSize: '11.5px' }}
        >
          Compare with Revision…
        </Button>
      </div>
      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        {renderDiffPane()}
      </div>
    </div>
  );
};

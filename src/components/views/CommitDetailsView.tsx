import React, { useState, useEffect } from 'react';
import { useGitClient, statusColor } from '../../context/GitClientContext';
import { Button } from '../common/Button';
import { DiffFile } from '../../types/git-client';

export const CommitDetailsView: React.FC = () => {
  const {
    sel,
    commits,
    getCommitHash,
    getCommitFullSha,
    getFileList,
    fetchCommitFiles,
    cherryPickCommit,
    revertCommit,
    setView,
    act,
    openMenu,
    diffTab,
    setDiffTab
  } = useGitClient();

  const detailIdx = sel[0] !== undefined ? sel[0] : 0;
  const isMulti = sel.length > 1;

  const [realFiles, setRealFiles] = useState<DiffFile[]>([]);

  useEffect(() => {
    let active = true;
    const sha = getCommitFullSha(detailIdx);
    if (!sha) {
      setRealFiles([]);
      return;
    }
    void fetchCommitFiles(sha).then(files => {
      if (active) setRealFiles(files);
    });
    return () => { active = false; };
  }, [detailIdx, getCommitFullSha, fetchCommitFiles]);

  const dfiles: DiffFile[] = realFiles.length ? realFiles : (
    isMulti ? sel.slice(0, 4).flatMap(i => getFileList(i)) : getFileList(detailIdx)
  );

  const dirs: Record<string, DiffFile[]> = {};
  dfiles.forEach(f => {
    const d = f.path.split('/').slice(0, -1).join('/');
    if (!dirs[d]) dirs[d] = [];
    dirs[d].push(f);
  });

  const detailKicker = isMulti ? `Merged range — ${sel.length} commits, net changes` : 'Commit';
  const detailSubject = isMulti
    ? `${commits[sel[sel.length - 1]][0]}  …  ${commits[sel[0]][0]}`
    : commits[detailIdx][0];
  const detailAuthor = isMulti
    ? `${new Set(sel.map(i => commits[i][1])).size} authors`
    : commits[detailIdx][1];
  const detailDate = commits[detailIdx][2];
  const detailHash = isMulti
    ? `${getCommitHash(sel[sel.length - 1])}..${getCommitHash(sel[0])}`
    : getCommitHash(detailIdx);

  const handleFileMenu = (e: React.MouseEvent, path: string) => {
    openMenu(e, path, [
      { label: 'Open diff', run: () => setView('diff') },
      { label: 'Compare with Revision…', run: act('Compare with revision') },
      { label: 'Revert this file’s changes', run: act('Revert file') },
      { label: 'Cherry-pick this file only', run: act('Cherry-pick file') },
      { sep: true },
      { label: 'Create patch from selection…', run: act('Create patch') },
      { label: 'Copy patch to clipboard', run: act('Copy patch') },
      { label: 'Apply patch to working tree…', run: act('Apply patch') },
      { sep: true },
      { label: `Directory timeline for ${path.split('/')[0]}/`, run: act('Directory timeline') },
      { label: 'Copy path', run: act('Copy path') }
    ]);
  };

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
    <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
      <div
        style={{
          flex: '0 0 380px',
          display: 'flex',
          flexDirection: 'column',
          borderRight: '1px solid var(--line)',
          background: 'var(--panel)',
          minHeight: 0
        }}
      >
        <div
          style={{
            flex: '0 0 auto',
            padding: 'var(--space-4)',
            borderBottom: '1px solid var(--line)'
          }}
        >
          <h6 style={{ margin: '0 0 6px', color: 'var(--color-accent)' }}>{detailKicker}</h6>
          <div
            style={{
              fontSize: '14px',
              fontWeight: 500,
              marginBottom: 'var(--space-2)',
              textWrap: 'pretty'
            }}
          >
            {detailSubject}
          </div>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 'var(--space-2)',
              fontSize: '11.5px',
              color: 'var(--fg2)'
            }}
          >
            <span>{detailAuthor}</span>
            <span style={{ color: 'var(--fg3)', fontFamily: 'var(--font-mono)' }}>
              {detailDate}
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--iris)' }}>
              {detailHash}
            </span>
          </div>
        </div>

        <div
          style={{
            flex: '0 0 auto',
            display: 'flex',
            gap: '6px',
            padding: 'var(--space-2) var(--space-3)',
            borderBottom: '1px solid var(--line)',
            flexWrap: 'wrap'
          }}
        >
          <Button
            variant="secondary"
            style={{ height: '23px', fontSize: '11.5px' }}
            onClick={() => setView('diff')}
          >
            {`Open diffs (${dfiles.length})`}
          </Button>
          <Button
            variant="secondary"
            style={{ height: '23px', fontSize: '11.5px' }}
            onClick={() => void revertCommit(getCommitFullSha(detailIdx))}
          >
            Revert selected
          </Button>
          <Button
            variant="secondary"
            style={{ height: '23px', fontSize: '11.5px' }}
            onClick={() => void cherryPickCommit(getCommitFullSha(detailIdx))}
          >
            Cherry-pick selected
          </Button>
          <Button
            variant="secondary"
            style={{ height: '23px', fontSize: '11.5px' }}
            onClick={act('Create patch')}
          >
            Create patch…
          </Button>
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: 'var(--space-2) 0', minHeight: 0 }}>
          {Object.keys(dirs).map(d => (
            <React.Fragment key={d}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '7px',
                  height: '23px',
                  paddingLeft: '10px',
                  paddingRight: 'var(--space-4)',
                  fontSize: '11.5px',
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--fg2)'
                }}
              >
                <i
                  className="ph ph-caret-down"
                  style={{ fontSize: '11px', color: 'var(--fg3)', width: '10px' }}
                />
                <span>{d}/</span>
              </div>
              {dirs[d].map((f, k) => (
                <div
                  key={k}
                  onClick={() => setView('diff')}
                  onContextMenu={e => handleFileMenu(e, f.path)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '7px',
                    height: '23px',
                    paddingLeft: '28px',
                    paddingRight: 'var(--space-4)',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '11.5px',
                    background: k === 0 ? 'var(--sel)' : 'transparent'
                  }}
                >
                  <span
                    style={{
                      width: '11px',
                      textAlign: 'center',
                      color: statusColor(f.status),
                      fontWeight: 600
                    }}
                  >
                    {f.status}
                  </span>
                  <span
                    style={{
                      flex: 1,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      color: 'var(--fg)'
                    }}
                  >
                    {f.path.split('/').pop()}
                  </span>
                  <span style={{ color: 'var(--add)', fontSize: '11px' }}>+{f.add}</span>
                  <span style={{ color: 'var(--del)', fontSize: '11px' }}>−{f.del}</span>
                </div>
              ))}
            </React.Fragment>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        {renderDiffPane()}
      </div>
    </div>
  );
};

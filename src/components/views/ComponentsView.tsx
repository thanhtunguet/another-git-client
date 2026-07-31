import React from 'react';
import { Card } from '../common/Card';
import { Tag, TagProps } from '../common/Tag';
import { Button, ButtonProps } from '../common/Button';
import { COLORS } from '../../context/GitClientContext';

export const ComponentsView: React.FC = () => {
  const mono = { fontFamily: 'var(--font-mono)' };

  const row = (icon: string, label: string, meta: string, bg?: string) => (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        height: '24px',
        padding: '0 8px',
        borderRadius: '4px',
        background: bg || 'transparent',
        ...mono,
        fontSize: '11.5px'
      }}
    >
      <i className={`ph ${icon}`} style={{ fontSize: '13px', color: 'var(--color-accent)' }} />
      <span style={{ flex: 1 }}>{label}</span>
      <span style={{ color: 'var(--fg3)', fontSize: '11px' }}>{meta}</span>
    </div>
  );

  const tagComp = (t: string, cls: NonNullable<TagProps['variant']>) => (
    <Tag key={t} variant={cls} style={{ ...mono, fontSize: '10.5px', padding: '1px 6px' }}>
      {t}
    </Tag>
  );

  const btnComp = (
    t: string,
    variant: NonNullable<ButtonProps['variant']>,
    style?: React.CSSProperties
  ) => (
    <Button variant={variant} style={{ height: '24px', fontSize: '11.5px', ...style }}>
      {t}
    </Button>
  );

  const specCards = [
    {
      title: 'Tree row',
      tag: '24px · mono',
      note: 'Indent 12px per depth, Phosphor leading icon, right-aligned meta. Selection is a 20% accent tint with a 2px accent inset — never a fill.',
      demo: (
        <>
          {row('ph-git-branch', 'feature/mlx5-next', '3 ahead', 'var(--sel)')}
          {row('ph-git-branch', 'release/6.18.y', '')}
          {row('ph-tag', 'v6.19-rc4', 'tag')}
        </>
      )
    },
    {
      title: 'Ref badge',
      tag: '.tag',
      note: 'HEAD uses .tag-accent, local branches .tag-accent-2, remotes .tag-neutral, tags .tag-outline. Straight from the ramps.',
      demo: (
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {tagComp('HEAD → main', 'accent')}
          {tagComp('feature/mlx5-next', 'accent-2')}
          {tagComp('origin/main', 'neutral')}
          {tagComp('v6.19-rc4', 'outline')}
        </div>
      )
    },
    {
      title: 'Context menu',
      tag: 'surface + shadow-lg',
      note: 'Mono title naming the object acted on, 25px items, hairline separators, destructive items in the red status colour and always routed through the confirm dialog.',
      demo: (
        <div
          style={{
            borderRadius: 'var(--radius-md)',
            background: 'var(--color-surface)',
            boxShadow: 'var(--shadow-md)',
            padding: '5px',
            width: '220px'
          }}
        >
          <div
            style={{
              padding: '4px 9px 6px',
              ...mono,
              fontSize: '11px',
              color: 'var(--fg3)',
              borderBottom: '1px solid var(--line)',
              marginBottom: '4px'
            }}
          >
            feature/mlx5-next
          </div>
          <div
            style={{
              padding: '3px 9px',
              fontSize: '12.5px',
              borderRadius: '4px',
              background: 'var(--sel)'
            }}
          >
            Checkout
          </div>
          <div style={{ padding: '3px 9px', fontSize: '12.5px' }}>Merge into main</div>
          <div style={{ height: '1px', background: 'var(--line)', margin: '4px 6px' }} />
          <div style={{ padding: '3px 9px', fontSize: '12.5px', color: 'var(--del)' }}>
            Delete branch
          </div>
        </div>
      )
    },
    {
      title: 'Buttons',
      tag: '.btn',
      note: 'Nocturne outlines its primaries — accent border on transparent, never an accent flood. Destructive actions borrow the same outline in the red status colour.',
      demo: (
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {btnComp('Commit', 'primary')}
          {btnComp('Fetch', 'secondary')}
          {btnComp('Force remove', 'primary', { color: 'var(--del)', borderColor: 'var(--del)' })}
          {btnComp('Cancel', 'ghost')}
        </div>
      )
    },
    {
      title: 'Status bar',
      tag: '26px',
      note: 'Idle shows branch, ahead/behind and working-tree counts; during an operation the same strip becomes the operation controller.',
      demo: (
        <>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              height: '26px',
              padding: '0 8px',
              background: 'var(--panel)',
              border: '1px solid var(--line)',
              borderRadius: '5px',
              fontSize: '11.5px',
              ...mono,
              color: 'var(--fg2)'
            }}
          >
            <i className="ph ph-git-branch" style={{ color: 'var(--color-accent)' }} /> main
            <span style={{ color: 'var(--add)' }}>↓12</span>
            <span style={{ color: 'var(--warn)' }}>↑3</span>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              height: '26px',
              padding: '0 8px',
              background: 'var(--raised)',
              border: '1px solid var(--line)',
              borderRadius: '5px',
              fontSize: '11px'
            }}
          >
            <Tag
              variant="outline"
              style={{
                fontSize: '10px',
                padding: '0 6px',
                color: 'var(--warn)',
                borderColor: 'var(--warn)'
              }}
            >
              REBASING
            </Tag>
            Step 2 of 5
            <span style={{ flex: 1 }} />
            {btnComp('Continue', 'primary', { height: '18px', fontSize: '10.5px' })}
            {btnComp('Abort', 'primary', {
              height: '18px',
              fontSize: '10.5px',
              color: 'var(--del)',
              borderColor: 'var(--del)'
            })}
          </div>
        </>
      )
    },
    {
      title: 'Progress toast',
      tag: '.card .elev-md',
      note: 'Bottom-right, always cancellable; the detail line mirrors the streamed console output.',
      demo: (
        <Card elevation="md">
          <div style={{ display: 'flex', gap: '8px' }}>
            <span style={{ flex: 1, fontSize: '12.5px', fontWeight: 500 }}>
              Updating 7 submodules
            </span>
            {btnComp('Cancel', 'secondary', { height: '19px', fontSize: '10.5px' })}
          </div>
          <div style={{ ...mono, fontSize: '11px', color: 'var(--fg3)' }}>
            tools/lib/bpf — receiving objects 42%
          </div>
          <div style={{ height: '3px', borderRadius: '2px', background: 'var(--raised2)' }}>
            <div
              style={{
                height: '100%',
                width: '42%',
                background: 'var(--color-accent)',
                borderRadius: '2px'
              }}
            />
          </div>
        </Card>
      )
    },
    {
      title: 'Confirm dialog',
      tag: '.dialog',
      note: 'Destructive actions only. States the consequence in plain language and shows the exact git command that will run.',
      demo: (
        <div className="dialog elev-lg" style={{ width: '100%', padding: 'var(--space-3)' }}>
          <div className="dialog-title" style={{ fontSize: '15px' }}>
            Hard reset main to origin/main?
          </div>
          <div className="dialog-body" style={{ fontSize: '12px' }}>
            12 modified files will be permanently discarded.
          </div>
          <div
            style={{
              padding: '6px 9px',
              border: '1px solid var(--line)',
              borderRadius: '6px',
              background: 'var(--color-bg)',
              ...mono,
              fontSize: '11px',
              color: 'var(--fg2)'
            }}
          >
            git reset --hard origin/main
          </div>
          <div className="dialog-actions">
            {btnComp('Cancel', 'secondary')}
            {btnComp('Reset --hard', 'primary', { color: 'var(--del)', borderColor: 'var(--del)' })}
          </div>
        </div>
      )
    },
    {
      title: 'Diff line',
      tag: '18px line box',
      note: 'Two 46px gutters, hairline separator. The add/remove tints are the only saturated surfaces in the app — 13% of a status hue, never a flood.',
      demo: (
        <div
          style={{
            ...mono,
            fontSize: '11.5px',
            border: '1px solid var(--line)',
            borderRadius: '6px',
            overflow: 'hidden'
          }}
        >
          <div style={{ background: 'var(--raised)', color: 'var(--fg3)', padding: '2px 8px' }}>
            @@ -412,9 +412,14 @@
          </div>
          <div style={{ background: 'var(--delbg)', color: 'var(--del)', padding: '2px 8px' }}>
            − if (unlikely(!priv-&gt;channels.num))
          </div>
          <div style={{ background: 'var(--addbg)', color: 'var(--add)', padding: '2px 8px' }}>
            + if (unlikely(!priv-&gt;channels.num ||
          </div>
        </div>
      )
    },
    {
      title: 'Graph lane',
      tag: '15px pitch',
      note: 'Seven lane hues at one OKLCH lightness and chroma — the accent hue leads, the rest are its neighbours. Merge commits are hollow, ordinary commits filled.',
      demo: (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <svg width={70} height={30} style={{ display: 'block', flex: '0 0 auto' }}>
            <path
              d="M12 0L12 15"
              stroke={COLORS[0]}
              strokeWidth={1.7}
              fill="none"
              strokeLinecap="round"
            />
            <path
              d="M12 15L12 30"
              stroke={COLORS[0]}
              strokeWidth={1.7}
              fill="none"
              strokeLinecap="round"
            />
            <path
              d="M12 15C12 22.5,27 22.5,27 30"
              stroke={COLORS[1]}
              strokeWidth={1.7}
              fill="none"
              strokeLinecap="round"
            />
            <path
              d="M42 0L42 30"
              stroke={COLORS[2]}
              strokeWidth={1.7}
              fill="none"
              strokeLinecap="round"
            />
            <circle
              cx={12}
              cy={15}
              r={4.4}
              fill="var(--color-bg)"
              stroke={COLORS[0]}
              strokeWidth={1.9}
            />
          </svg>
          <span style={{ fontSize: '11.5px', color: 'var(--fg3)' }}>
            merge commit, lane 0 → lanes 0 + 1
          </span>
        </div>
      )
    }
  ];

  return (
    <div
      style={{
        flex: 1,
        overflow: 'auto',
        minHeight: 0,
        padding: 'var(--space-8) var(--space-8) 70px'
      }}
    >
      <h3 style={{ margin: '0 0 var(--space-1)' }}>Shared components</h3>
      <p style={{ fontSize: '12.5px', color: 'var(--fg3)', marginBottom: 'var(--space-6)' }}>
        Nocturne classes and tokens, specialised for a git client.
      </p>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill,minmax(330px,1fr))',
          gap: 'var(--space-4)'
        }}
      >
        {specCards.map((s, i) => (
          <Card key={i} elevation="sm" style={{ padding: 0, overflow: 'hidden' }}>
            <div
              style={{
                padding: 'var(--space-3)',
                borderBottom: '1px solid var(--line)',
                display: 'flex',
                alignItems: 'baseline',
                gap: 'var(--space-2)'
              }}
            >
              <span style={{ fontSize: '12.5px', fontWeight: 500 }}>{s.title}</span>
              <span
                style={{ fontSize: '11px', color: 'var(--fg3)', fontFamily: 'var(--font-mono)' }}
              >
                {s.tag}
              </span>
            </div>
            <div
              style={{
                padding: 'var(--space-4) var(--space-3)',
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                gap: 'var(--space-2)',
                background: 'var(--color-bg)'
              }}
            >
              {s.demo}
            </div>
            <div
              style={{
                padding: 'var(--space-2) var(--space-3)',
                borderTop: '1px solid var(--line)',
                fontSize: '11px',
                color: 'var(--fg3)',
                textWrap: 'pretty'
              }}
            >
              {s.note}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

import React from 'react';
import { Input, Select, Checkbox, Textarea } from '../common/FormControls';
import { SettingsSection, SettingControlType } from '../../types/git-client';

export const SettingsView: React.FC = () => {
  const settingsNav = [
    { id: 'git', href: '#git', label: 'Git executable' },
    { id: 'graph', href: '#graph', label: 'Graph & history' },
    { id: 'perf', href: '#perf', label: 'Performance' },
    { id: 'compare', href: '#compare', label: 'Compare & export' },
    { id: 'commit', href: '#commit', label: 'Commit' },
    { id: 'diff', href: '#diff', label: 'Diff & merge' }
  ];

  const renderControl = (
    type: SettingControlType,
    defVal?: string | boolean,
    opts?: string[],
    width?: number
  ) => {
    if (type === 'input') {
      return (
        <Input
          defaultValue={defVal as string}
          style={{
            width: width || 220,
            minHeight: 0,
            height: '26px',
            fontSize: '12px',
            fontFamily: 'var(--font-mono)'
          }}
        />
      );
    }
    if (type === 'select') {
      return (
        <Select
          defaultValue={defVal as string}
          options={opts || []}
          style={{ width: 'auto', minHeight: 0, height: '26px', fontSize: '12px' }}
        />
      );
    }
    if (type === 'checkbox') {
      return (
        <Checkbox
          defaultChecked={defVal as boolean}
          label="Enabled"
          style={{ fontSize: '12px', color: 'var(--fg2)' }}
        />
      );
    }
    if (type === 'textarea') {
      return (
        <Textarea
          defaultValue={defVal as string}
          rows={4}
          style={{
            maxWidth: '420px',
            minHeight: '84px',
            fontFamily: 'var(--font-mono)',
            fontSize: '11.5px'
          }}
        />
      );
    }
    return null;
  };

  const sections: SettingsSection[] = [
    {
      id: 'git',
      title: 'Git executable',
      rows: [
        {
          label: 'Git executable path',
          hint: 'Blank resolves from PATH',
          control: 'input',
          defaultValue: '/opt/homebrew/bin/git',
          width: 300
        },
        {
          label: 'Command timeout',
          hint: 'Seconds before a git process is killed',
          control: 'input',
          defaultValue: '30',
          width: 90
        },
        {
          label: 'Environment',
          hint: 'Extra variables passed to every invocation',
          control: 'input',
          defaultValue: 'GIT_SSH_COMMAND=ssh -i ~/.ssh/id_ed25519',
          width: 300
        }
      ]
    },
    {
      id: 'graph',
      title: 'Graph & history',
      rows: [
        {
          label: 'Graph page size',
          hint: 'Commits loaded per “Load more”',
          control: 'select',
          defaultValue: '100',
          options: ['100', '250', '500', '1000']
        },
        {
          label: 'Recent branches count',
          hint: 'Entries kept in the Recent group',
          control: 'input',
          defaultValue: '8',
          width: 90
        },
        {
          label: 'Virtualize commit list',
          hint: 'Render only visible rows — required above ~5k commits',
          control: 'checkbox',
          defaultValue: true
        },
        {
          label: 'Default layout',
          hint: 'Rows or grouped by day',
          control: 'select',
          defaultValue: 'Rows',
          options: ['Rows', 'Grouped by day']
        }
      ]
    },
    {
      id: 'perf',
      title: 'Performance',
      rows: [
        {
          label: 'Filter debounce',
          hint: 'Milliseconds before live filters re-run',
          control: 'input',
          defaultValue: '180',
          width: 90
        },
        {
          label: 'Status poll interval',
          hint: 'Working-tree refresh cadence',
          control: 'input',
          defaultValue: '2000',
          width: 90
        },
        {
          label: 'Max concurrent git processes',
          hint: '',
          control: 'input',
          defaultValue: '4',
          width: 90
        }
      ]
    },
    {
      id: 'compare',
      title: 'Compare & export',
      rows: [
        {
          label: 'Export format',
          hint: 'Two CSVs or one workbook with two sheets',
          control: 'select',
          defaultValue: 'Excel workbook (.xlsx)',
          options: ['Excel workbook (.xlsx)', 'Two CSV files']
        },
        {
          label: 'Default compare layout',
          hint: '',
          control: 'select',
          defaultValue: 'Side by side',
          options: ['Side by side', 'Stacked', 'Graph']
        },
        {
          label: 'Compare-with-revision direction',
          hint: 'Which side the picked revision lands on',
          control: 'select',
          defaultValue: 'Revision → working tree',
          options: ['Revision → working tree', 'Working tree → revision']
        },
        {
          label: 'Remember recent compare pairs',
          hint: '',
          control: 'checkbox',
          defaultValue: true
        }
      ]
    },
    {
      id: 'commit',
      title: 'Commit',
      rows: [
        {
          label: 'Message templates',
          hint: 'Placeholders: {branch} {ticket} {scope} {cursor}',
          control: 'textarea',
          defaultValue:
            '{scope}: {cursor}\n\nRefs: {ticket}\nSigned-off-by: Jakub Kicinski <kuba@kernel.org>'
        },
        {
          label: 'Ticket pattern',
          hint: 'Regex used to extract {ticket} from branch names',
          control: 'input',
          defaultValue: '([A-Z]{2,8}-\\d+)',
          width: 220
        },
        {
          label: 'AI generate timeout',
          hint: 'Seconds before generation is cancelled',
          control: 'input',
          defaultValue: '20',
          width: 90
        },
        { label: 'Wrap message body', hint: '', control: 'input', defaultValue: '72', width: 90 }
      ]
    },
    {
      id: 'diff',
      title: 'Diff & merge',
      rows: [
        {
          label: 'Default diff view',
          hint: '',
          control: 'select',
          defaultValue: 'Unified',
          options: ['Unified', 'Split']
        },
        {
          label: 'Whitespace',
          hint: '',
          control: 'select',
          defaultValue: 'Show all',
          options: ['Show all', 'Ignore trailing', 'Ignore all']
        },
        {
          label: 'Gutter markers',
          hint: 'Change markers and their thresholds',
          control: 'checkbox',
          defaultValue: true
        },
        {
          label: 'Merge tool',
          hint: '',
          control: 'select',
          defaultValue: 'Built-in 3-way',
          options: ['Built-in 3-way', 'External: kdiff3']
        }
      ]
    }
  ];

  return (
    <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
      <div
        style={{
          flex: '0 0 200px',
          borderRight: '1px solid var(--line)',
          background: 'var(--panel)',
          padding: 'var(--space-3) 0',
          overflow: 'auto'
        }}
      >
        {settingsNav.map(s => (
          <a
            key={s.id}
            href={s.href}
            style={{
              display: 'block',
              padding: '6px var(--space-4)',
              fontSize: '12.5px',
              color: 'var(--fg2)',
              textDecoration: 'none'
            }}
            className="gc-hover-bg"
          >
            {s.label}
          </a>
        ))}
      </div>
      <div style={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
        <div style={{ maxWidth: '760px', padding: 'var(--space-8) var(--space-8) 60px' }}>
          <h3 style={{ margin: '0 0 var(--space-1)' }}>Preferences</h3>
          <p style={{ fontSize: '12.5px', color: 'var(--fg3)', marginBottom: 'var(--space-8)' }}>
            Settings apply per repository unless marked Global.
          </p>

          {sections.map(sec => (
            <div key={sec.id} id={sec.id} style={{ marginBottom: 'var(--space-8)' }}>
              <h6
                style={{
                  margin: '0 0 var(--space-3)',
                  paddingBottom: 'var(--space-2)',
                  borderBottom: '1px solid var(--line)',
                  color: 'var(--fg3)'
                }}
              >
                {sec.title}
              </h6>
              {sec.rows.map((r, i) => (
                <div
                  key={i}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '260px 1fr',
                    gap: 'var(--space-6)',
                    alignItems: 'start',
                    padding: 'var(--space-2) 0'
                  }}
                >
                  <div>
                    <div style={{ fontSize: '12.5px' }}>{r.label}</div>
                    <div style={{ fontSize: '11px', color: 'var(--fg3)', textWrap: 'pretty' }}>
                      {r.hint}
                    </div>
                  </div>
                  <div>{renderControl(r.control, r.defaultValue, r.options, r.width)}</div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { Input, Select, Checkbox, Textarea } from '../common/FormControls';
import { SettingsSection, SettingControlType } from '../../types/git-client';
import { useGitClient } from '../../context/GitClientContext';

export const SettingsView: React.FC = () => {
  const { preferences, updatePreference, graphLayout, setGraphLayout, compareLayout, setCompareLayout } = useGitClient();

  const settingsNav = [
    { id: 'graph', href: '#graph', label: 'Graph & history' },
    { id: 'perf', href: '#perf', label: 'Performance' },
    { id: 'compare', href: '#compare', label: 'Compare & export' },
    { id: 'commit', href: '#commit', label: 'Commit' },
    { id: 'diff', href: '#diff', label: 'Diff & merge' }
  ];

  const renderControl = (
    type: SettingControlType,
    settingKey: string | undefined,
    defVal?: string | boolean,
    opts?: string[],
    width?: number,
    label?: string
  ) => {
    if (!settingKey) return null;

    let value = preferences[settingKey] !== undefined ? preferences[settingKey] : defVal;

    // Map existing strongly-typed state
    if (settingKey === 'graphLayout') value = graphLayout === 'grouped' ? 'Grouped by day' : 'Rows';
    if (settingKey === 'compareLayout') value = compareLayout === 'stack' ? 'Stacked' : 'Side by side';

    const handleChange = (newVal: any) => {
      if (settingKey === 'graphLayout') {
        setGraphLayout(newVal === 'Grouped by day' ? 'grouped' : 'rows');
      } else if (settingKey === 'compareLayout') {
        setCompareLayout(newVal === 'Stacked' ? 'stack' : 'side');
      } else {
        updatePreference(settingKey, newVal);
      }
    };

    if (type === 'input') {
      return (
        <Input
          id={settingKey}
          value={value as string}
          onChange={e => handleChange(e.target.value)}
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
          id={settingKey}
          value={value as string}
          onChange={e => handleChange(e.target.value)}
          options={opts || []}
          style={{ width: 'auto', minHeight: 0, height: '26px', fontSize: '12px' }}
        />
      );
    }
    if (type === 'checkbox') {
      return (
        <Checkbox
          id={settingKey}
          checked={value as boolean}
          onChange={e => handleChange(e.target.checked)}
          label={label || 'Enabled'}
          style={{ fontSize: '12px', color: 'var(--fg2)' }}
        />
      );
    }
    if (type === 'textarea') {
      return (
        <Textarea
          id={settingKey}
          value={value as string}
          onChange={e => handleChange(e.target.value)}
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
      id: 'graph',
      title: 'Graph & history',
      rows: [
        {
          label: 'Graph page size',
          hint: 'Commits loaded initially and per “Load more”',
          control: 'select',
          settingKey: 'graphPageSize',
          defaultValue: '100',
          options: ['100', '250', '500', '1000']
        },
        {
          label: 'Virtualize commit list',
          hint: 'Render only visible rows — required above ~5k commits',
          control: 'checkbox',
          settingKey: 'virtualizeCommitList',
          defaultValue: true
        },
        {
          label: 'Default layout',
          hint: 'Rows or grouped by day',
          control: 'select',
          settingKey: 'graphLayout',
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
          label: 'Status poll interval',
          hint: 'Milliseconds between automatic working-tree status refreshes',
          control: 'input',
          settingKey: 'statusPollInterval',
          defaultValue: '2000',
          width: 90
        }
      ]
    },
    {
      id: 'compare',
      title: 'Compare & export',
      rows: [
        {
          label: 'Default compare layout',
          hint: '',
          control: 'select',
          settingKey: 'compareLayout',
          defaultValue: 'Side by side',
          options: ['Side by side', 'Stacked']
        },
        {
          label: 'Compare-with-revision direction',
          hint: 'Which side a picked branch/commit lands on when comparing with current',
          control: 'select',
          settingKey: 'compareDirection',
          defaultValue: 'Revision → working tree',
          options: ['Revision → working tree', 'Working tree → revision']
        }
      ]
    },
    {
      id: 'commit',
      title: 'Commit',
      rows: [
        {
          label: 'Message templates',
          hint: 'Placeholders: {branch} {ticket} {scope} {cursor} — available from the commit box\'s Template menu as "Custom template"',
          control: 'textarea',
          settingKey: 'messageTemplates',
          defaultValue:
            '{scope}: {cursor}\n\nRefs: {ticket}\nSigned-off-by: Jakub Kicinski <kuba@kernel.org>'
        },
        {
          label: 'Ticket pattern',
          hint: 'Regex used to extract {ticket} from the current branch name',
          control: 'input',
          settingKey: 'ticketPattern',
          defaultValue: '([A-Z]{2,8}-\\d+)',
          width: 220
        },
        { label: 'Wrap message body', hint: 'Max characters per line in the commit message box', control: 'input', settingKey: 'wrapMessageBody', defaultValue: '72', width: 90 }
      ]
    },
    {
      id: 'diff',
      title: 'Diff & merge',
      rows: [
        {
          label: 'Default diff view',
          hint: '2 Sides (Split) or 1 Side (Inline/Unified) layout for diff viewer',
          control: 'select',
          settingKey: 'diffMode',
          defaultValue: 'split',
          options: ['split', 'inline']
        },
        {
          label: 'Gutter markers',
          hint: 'Show old/new line-number columns in diff views',
          control: 'checkbox',
          settingKey: 'gutterMarkers',
          defaultValue: true
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
            Settings are saved for this installation and apply across every repository you open.
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
                    {r.control === 'checkbox' ? (
                      <div style={{ fontSize: '12.5px' }}>{r.label}</div>
                    ) : (
                      <label htmlFor={r.settingKey} style={{ fontSize: '12.5px', display: 'block' }}>
                        {r.label}
                      </label>
                    )}
                    <div style={{ fontSize: '11px', color: 'var(--fg3)', textWrap: 'pretty' }}>
                      {r.hint}
                    </div>
                  </div>
                  <div>{renderControl(r.control, r.settingKey, r.defaultValue, r.options, r.width, r.label)}</div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

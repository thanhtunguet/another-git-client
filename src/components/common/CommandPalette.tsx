import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useGitClient } from '../../context/GitClientContext';
import {
  tauriGitBackend,
  type BranchRef,
  type GraphCommitRow,
  type TagRef
} from '../../services/tauriGitBackend';
import { type PaletteItem } from '../../types/git-client';

const fuzzyMatch = (query: string, candidate: string) => {
  const needle = query.toLowerCase().replace(/[\s/_-]/g, '');
  const haystack = candidate.toLowerCase().replace(/[\s/_-]/g, '');
  let candidateIndex = 0;

  for (const character of needle) {
    candidateIndex = haystack.indexOf(character, candidateIndex);
    if (candidateIndex < 0) return false;
    candidateIndex += 1;
  }
  return true;
};

const isCommitId = (value: string) => /^[0-9a-f]{4,40}$/i.test(value);

export const CommandPalette: React.FC = () => {
  const {
    paletteOpen,
    closePalette,
    paletteQ,
    setPaletteQ,
    paletteAll,
    repoPath,
    runPaletteQuery
  } = useGitClient();
  const [activeIndex, setActiveIndex] = useState(0);
  const itemRefs = useRef<Array<HTMLDivElement | null>>([]);
  const [branches, setBranches] = useState<BranchRef[]>([]);
  const [tags, setTags] = useState<TagRef[]>([]);
  const [commitMatch, setCommitMatch] = useState<GraphCommitRow | null>(null);

  const query = paletteQ.trim();
  const actionMatches = useMemo(
    () =>
      paletteOpen
        ? paletteAll().filter(item => !query || fuzzyMatch(query, `${item.group} ${item.label}`))
        : [],
    [paletteOpen, paletteAll, query]
  );
  const referenceMatches = useMemo((): PaletteItem[] => {
    if (!query) return [];
    return [
      ...branches
        .filter(branch => fuzzyMatch(query, branch.name))
        .slice(0, 12)
        .map(branch => ({
          group: 'Branch',
          label: branch.name,
          hint: branch.current ? 'current' : 'Checkout',
          run: () => void runPaletteQuery(branch.name)
        })),
      ...tags
        .filter(tag => fuzzyMatch(query, tag.name))
        .slice(0, 12)
        .map(tag => ({
          group: 'Tag',
          label: tag.name,
          hint: 'View commit',
          run: () => void runPaletteQuery(tag.name)
        }))
    ];
  }, [query, branches, tags, runPaletteQuery]);
  const shouldSearchCommit =
    !!query && (isCommitId(query) || (actionMatches.length === 0 && referenceMatches.length === 0));

  useEffect(() => {
    if (!paletteOpen || !repoPath) {
      setBranches([]);
      setTags([]);
      return;
    }

    let active = true;
    void Promise.all([tauriGitBackend.getBranches(repoPath), tauriGitBackend.getTags(repoPath)])
      .then(([branchList, tagList]) => {
        if (!active) return;
        setBranches(branchList);
        setTags(tagList);
      })
      .catch(() => {
        if (!active) return;
        setBranches([]);
        setTags([]);
      });

    return () => {
      active = false;
    };
  }, [paletteOpen, repoPath]);

  useEffect(() => {
    if (!paletteOpen || !repoPath || !shouldSearchCommit) {
      setCommitMatch(null);
      return;
    }

    let active = true;
    const timeoutId = window.setTimeout(() => {
      void tauriGitBackend
        .getRefGraph(repoPath, query, { maxCount: 1 })
        .then(rows => {
          if (active) setCommitMatch(rows[0] || null);
        })
        .catch(() => {
          if (active) setCommitMatch(null);
        });
    }, 150);

    return () => {
      active = false;
      window.clearTimeout(timeoutId);
    };
  }, [paletteOpen, query, repoPath, shouldSearchCommit]);

  const filtered = useMemo((): PaletteItem[] => {
    const commit: PaletteItem[] = commitMatch
      ? [
          {
            group: 'Commit',
            label: `${commitMatch.shortSha}  ${commitMatch.subject}`,
            hint: 'View details',
            run: () => void runPaletteQuery(commitMatch.sha)
          }
        ]
      : [];

    return [...actionMatches, ...referenceMatches, ...commit];
  }, [actionMatches, referenceMatches, commitMatch, runPaletteQuery]);

  useEffect(() => {
    setActiveIndex(0);
  }, [paletteQ, paletteOpen]);

  useEffect(() => {
    itemRefs.current[activeIndex]?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  if (!paletteOpen) return null;

  const runItem = (index: number) => {
    const query = paletteQ.trim();
    if (query && filtered.length === 0) {
      void runPaletteQuery(query);
      return;
    }
    const item = filtered[index];
    if (!item) return;
    closePalette();
    item.run();
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(prev => (filtered.length ? (prev + 1) % filtered.length : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(prev =>
        filtered.length ? (prev - 1 + filtered.length) % filtered.length : 0
      );
    } else if (e.key === 'Enter') {
      e.preventDefault();
      runItem(activeIndex);
    }
  };

  return (
    <div className="dialog-backdrop gc-command-palette-backdrop" onClick={closePalette}>
      <div className="dialog gc-command-palette" onClick={e => e.stopPropagation()}>
        <input
          value={paletteQ}
          onChange={e => setPaletteQ(e.target.value)}
          onKeyDown={handleInputKeyDown}
          autoFocus
          placeholder="Type an action, branch, or commit…"
          aria-label="Command palette search"
          role="combobox"
          aria-expanded={true}
          aria-controls="gc-command-palette-listbox"
          aria-activedescendant={
            filtered[activeIndex] ? `gc-command-palette-option-${activeIndex}` : undefined
          }
          style={{
            height: '44px',
            background: 'transparent',
            border: 0,
            borderBottom: '1px solid var(--line)',
            borderRadius: 0,
            padding: '0 var(--space-4)',
            fontFamily: 'inherit',
            fontSize: '14px',
            color: 'var(--fg)',
            outline: 'none'
          }}
        />
        <div
          id="gc-command-palette-listbox"
          role="listbox"
          style={{ flex: 1, overflow: 'auto', padding: 'var(--space-2)' }}
        >
          {filtered.map((p, i) => (
            <div
              key={i}
              id={`gc-command-palette-option-${i}`}
              role="option"
              aria-selected={i === activeIndex}
              ref={el => {
                itemRefs.current[i] = el;
              }}
              onMouseEnter={() => setActiveIndex(i)}
              onClick={() => runItem(i)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                height: '32px',
                padding: '0 var(--space-3)',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                background: i === activeIndex ? 'var(--sel)' : 'transparent'
              }}
            >
              <span
                style={{
                  fontSize: '10px',
                  textTransform: 'uppercase',
                  color: 'var(--fg3)',
                  width: '74px',
                  flex: '0 0 auto'
                }}
              >
                {p.group}
              </span>
              <span
                style={{
                  flex: 1,
                  fontSize: '12.5px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
              >
                {p.label}
              </span>
              {p.hint && (
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '10.5px',
                    color: 'var(--fg3)'
                  }}
                >
                  {p.hint}
                </span>
              )}
            </div>
          ))}
          {filtered.length === 0 && paletteQ.trim() && (
            <div
              role="status"
              style={{ padding: 'var(--space-3)', fontSize: '12px', color: 'var(--fg3)' }}
            >
              No matching actions, branches, tags, or commit IDs.
            </div>
          )}
        </div>
        <div
          style={{
            height: '26px',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            padding: '0 var(--space-3)',
            borderTop: '1px solid var(--line)',
            fontSize: '10.5px',
            color: 'var(--fg3)',
            fontFamily: 'var(--font-mono)'
          }}
        >
          <span>↑↓ navigate</span>
          <span>↵ select</span>
          <span>esc close</span>
        </div>
      </div>
    </div>
  );
};

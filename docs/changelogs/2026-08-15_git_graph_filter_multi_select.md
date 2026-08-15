# Git Graph multi-select filters

## Summary

- Replaced the free-text **Branch / ref** filter with a searchable multi-select **Branch / tag** picker populated from the repository's branches and tags.
- Replaced the free-text **Author** filter with a searchable multi-select picker populated from authors in the loaded graph.
- Kept each picker open while values are selected, show selected values as removable chips, and update the active-filter count per field.
- Apply selected branch or tag references with OR semantics. Author, message, date, and reference filter categories combine with AND semantics.
- Made **From** and **To** native date pickers. From includes commits from 00:00 on the selected day; To includes commits through 23:59 on the selected day.

## Verification

- `npm run typecheck`
- `npm run lint`

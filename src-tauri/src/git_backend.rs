use serde::Serialize;
use std::collections::HashMap;
use std::path::{Path, PathBuf};
use std::process::Command;

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct GitCommandResult {
  pub stdout: String,
  pub stderr: String,
  pub exit_code: i32,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct BranchRef {
  pub name: String,
  pub full_ref: String,
  pub upstream: Option<String>,
  pub ahead: i32,
  pub behind: i32,
  pub current: bool,
  pub kind: String,
  pub last_commit_epoch: Option<i64>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct TagRef {
  pub name: String,
  pub full_ref: String,
  pub sha: String,
  pub last_commit_epoch: Option<i64>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct GraphCommitRow {
  pub graph: String,
  pub sha: String,
  pub short_sha: String,
  pub parents: Vec<String>,
  pub refs: Vec<String>,
  pub author: String,
  pub date: String,
  pub subject: String,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ChangedFile {
  pub status: String,
  pub path: String,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct WorktreeEntry {
  pub path: String,
  pub head: Option<String>,
  pub branch: Option<String>,
  pub detached: bool,
  pub bare: bool,
  pub locked: bool,
  pub lock_reason: Option<String>,
  pub prunable_reason: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SubmoduleEntry {
  pub path: String,
  pub name: Option<String>,
  pub url: Option<String>,
  pub sha: Option<String>,
  pub initialized: bool,
  pub status: String,
}

fn canonical_repo_path(repo_path: &str) -> Result<PathBuf, String> {
  let path = PathBuf::from(repo_path);
  if !path.exists() {
    return Err(format!("Repository path does not exist: {repo_path}"));
  }
  path
    .canonicalize()
    .map_err(|e| format!("Failed to resolve repository path {repo_path}: {e}"))
}

fn run_git_allow_failure(repo: &Path, args: &[String]) -> Result<GitCommandResult, String> {
  let output = Command::new("git")
    .args(args)
    .current_dir(repo)
    .output()
    .map_err(|e| format!("Failed to spawn git: {e}"))?;

  Ok(GitCommandResult {
    stdout: String::from_utf8_lossy(&output.stdout).to_string(),
    stderr: String::from_utf8_lossy(&output.stderr).to_string(),
    exit_code: output.status.code().unwrap_or(-1),
  })
}

fn run_git(repo: &Path, args: &[String]) -> Result<GitCommandResult, String> {
  let result = run_git_allow_failure(repo, args)?;
  if result.exit_code == 0 {
    return Ok(result);
  }

  let rendered_args = args.join(" ");
  let details = if result.stderr.trim().is_empty() {
    result.stdout.trim().to_string()
  } else {
    result.stderr.trim().to_string()
  };

  Err(format!(
    "git {rendered_args} failed with exit code {}: {}",
    result.exit_code, details
  ))
}

fn parse_ahead_behind(track: &str) -> (i32, i32) {
  let mut ahead = 0;
  let mut behind = 0;

  for segment in track.split(',').map(|s| s.trim()) {
    if let Some(raw) = segment.strip_prefix("[ahead ") {
      ahead = raw
        .trim_end_matches(']')
        .parse::<i32>()
        .unwrap_or(0);
    }
    if let Some(raw) = segment.strip_prefix("behind ") {
      behind = raw
        .trim_end_matches(']')
        .parse::<i32>()
        .unwrap_or(0);
    }
    if let Some(raw) = segment.strip_prefix("[behind ") {
      behind = raw
        .trim_end_matches(']')
        .parse::<i32>()
        .unwrap_or(0);
    }
  }

  (ahead, behind)
}

fn parse_submodule_map(raw: &str) -> HashMap<String, (Option<String>, Option<String>)> {
  let mut by_name: HashMap<String, (Option<String>, Option<String>)> = HashMap::new();

  for line in raw.lines().map(str::trim).filter(|line| !line.is_empty()) {
    let mut parts = line.splitn(2, ' ');
    let key = parts.next().unwrap_or_default();
    let value = parts.next().unwrap_or_default().trim().to_string();

    if let Some(rest) = key.strip_prefix("submodule.") {
      let mut sub_parts = rest.split('.');
      let name = sub_parts.next().unwrap_or_default().to_string();
      let field = sub_parts.next().unwrap_or_default();
      let entry = by_name.entry(name).or_insert((None, None));
      if field == "path" {
        entry.0 = Some(value);
      } else if field == "url" {
        entry.1 = Some(value);
      }
    }
  }

  let mut by_path: HashMap<String, (Option<String>, Option<String>)> = HashMap::new();
  for (name, (path, url)) in by_name {
    if let Some(path_value) = path {
      by_path.insert(path_value, (Some(name), url));
    }
  }

  by_path
}

#[tauri::command]
pub fn git_is_repo(repo_path: String) -> Result<bool, String> {
  let repo = canonical_repo_path(&repo_path)?;
  let args = vec![
    "rev-parse".to_string(),
    "--is-inside-work-tree".to_string(),
  ];
  let result = run_git_allow_failure(&repo, &args)?;
  if result.exit_code != 0 {
    return Ok(false);
  }
  Ok(result.stdout.trim() == "true")
}

#[tauri::command]
pub fn git_get_branches(repo_path: String) -> Result<Vec<BranchRef>, String> {
  let repo = canonical_repo_path(&repo_path)?;
  let format = "%(*refname:short)%x1f%(refname:short)%x1f%(refname)%x1f%(upstream:short)%x1f%(upstream:track)%x1f%(HEAD)%x1f%(committerdate:unix)";
  let args = vec![
    "for-each-ref".to_string(),
    "refs/heads".to_string(),
    "refs/remotes".to_string(),
    format!("--format={format}"),
  ];

  let output = run_git(&repo, &args)?.stdout;
  let mut branches = Vec::new();

  for line in output.lines().map(str::trim).filter(|line| !line.is_empty()) {
    let parts: Vec<&str> = line.split('\u{1f}').collect();
    if parts.len() < 7 {
      continue;
    }

    let name = if !parts[0].is_empty() {
      parts[0].to_string()
    } else {
      parts[1].to_string()
    };
    let full_ref = parts[2].to_string();
    let upstream = if parts[3].is_empty() {
      None
    } else {
      Some(parts[3].to_string())
    };
    let (ahead, behind) = parse_ahead_behind(parts[4]);
    let current = parts[5].trim() == "*";
    let kind = if full_ref.starts_with("refs/remotes/") {
      "remote".to_string()
    } else {
      "local".to_string()
    };
    let last_commit_epoch = parts[6].parse::<i64>().ok();

    branches.push(BranchRef {
      name,
      full_ref,
      upstream,
      ahead,
      behind,
      current,
      kind,
      last_commit_epoch,
    });
  }

  branches.sort_by(|a, b| {
    if a.current != b.current {
      return b.current.cmp(&a.current);
    }
    if a.kind != b.kind {
      return a.kind.cmp(&b.kind);
    }
    a.name.cmp(&b.name)
  });

  Ok(branches)
}

#[tauri::command]
pub fn git_get_tags(repo_path: String) -> Result<Vec<TagRef>, String> {
  let repo = canonical_repo_path(&repo_path)?;
  let format = "%(refname:short)%x1f%(refname)%x1f%(objectname)%x1f%(*objectname)%x1f%(creatordate:unix)";
  let args = vec![
    "for-each-ref".to_string(),
    "refs/tags".to_string(),
    format!("--format={format}"),
  ];

  let output = run_git(&repo, &args)?.stdout;
  let mut tags = Vec::new();

  for line in output.lines().map(str::trim).filter(|line| !line.is_empty()) {
    let parts: Vec<&str> = line.split('\u{1f}').collect();
    if parts.len() < 5 {
      continue;
    }

    let resolved_sha = if parts[3].is_empty() { parts[2] } else { parts[3] };
    tags.push(TagRef {
      name: parts[0].to_string(),
      full_ref: parts[1].to_string(),
      sha: resolved_sha.to_string(),
      last_commit_epoch: parts[4].parse::<i64>().ok(),
    });
  }

  tags.sort_by(|a, b| {
    b.last_commit_epoch
      .unwrap_or_default()
      .cmp(&a.last_commit_epoch.unwrap_or_default())
      .then(a.name.cmp(&b.name))
  });

  Ok(tags)
}

#[tauri::command]
pub fn git_get_graph(
  repo_path: String,
  max_count: Option<usize>,
  skip: Option<usize>,
  all_refs: Option<bool>,
) -> Result<Vec<GraphCommitRow>, String> {
  let repo = canonical_repo_path(&repo_path)?;
  let count = max_count.unwrap_or(200);
  let offset = skip.unwrap_or(0);
  let mut args = vec![
    "log".to_string(),
    "--date=iso-strict".to_string(),
    "--decorate=full".to_string(),
    format!("--max-count={count}"),
    "--format=%m%x1f%H%x1f%h%x1f%P%x1f%D%x1f%an%x1f%aI%x1f%s%x1e".to_string(),
  ];
  if offset > 0 {
    args.push(format!("--skip={offset}"));
  }
  if all_refs.unwrap_or(true) {
    args.push("--all".to_string());
  }

  let output = run_git(&repo, &args)?.stdout;
  let mut rows = Vec::new();

  for row in output
    .split('\u{1e}')
    .map(str::trim)
    .filter(|line| !line.is_empty())
  {
    let parts: Vec<&str> = row.split('\u{1f}').collect();
    if parts.len() < 8 {
      continue;
    }

    let refs = parts[4]
      .split(',')
      .map(str::trim)
      .filter(|r| !r.is_empty())
      .map(|r| r.to_string())
      .collect::<Vec<_>>();

    let parents = parts[3]
      .split(' ')
      .map(str::trim)
      .filter(|p| !p.is_empty())
      .map(|p| p.to_string())
      .collect::<Vec<_>>();

    rows.push(GraphCommitRow {
      graph: parts[0].to_string(),
      sha: parts[1].to_string(),
      short_sha: parts[2].to_string(),
      parents,
      refs,
      author: parts[5].to_string(),
      date: parts[6].to_string(),
      subject: parts[7].to_string(),
    });
  }

  Ok(rows)
}

#[tauri::command]
pub fn git_get_changed_files(repo_path: String) -> Result<Vec<ChangedFile>, String> {
  let repo = canonical_repo_path(&repo_path)?;
  let args = vec!["status".to_string(), "--porcelain=v1".to_string()];
  let output = run_git(&repo, &args)?.stdout;
  let mut files = Vec::new();

  for line in output.lines() {
    if line.len() < 4 {
      continue;
    }

    let status = line[0..2].trim().to_string();
    let mut path = line[3..].trim().to_string();
    if let Some((_, to)) = path.split_once(" -> ") {
      path = to.to_string();
    }

    files.push(ChangedFile { status, path });
  }

  Ok(files)
}

#[tauri::command]
pub fn git_get_worktrees(repo_path: String) -> Result<Vec<WorktreeEntry>, String> {
  let repo = canonical_repo_path(&repo_path)?;
  let args = vec!["worktree".to_string(), "list".to_string(), "--porcelain".to_string()];
  let output = run_git(&repo, &args)?.stdout;

  let mut entries = Vec::new();
  let mut current: Option<WorktreeEntry> = None;

  for line in output.lines() {
    let trimmed = line.trim();
    if trimmed.is_empty() {
      if let Some(entry) = current.take() {
        entries.push(entry);
      }
      continue;
    }

    if let Some(path) = trimmed.strip_prefix("worktree ") {
      if let Some(entry) = current.take() {
        entries.push(entry);
      }
      current = Some(WorktreeEntry {
        path: path.to_string(),
        head: None,
        branch: None,
        detached: false,
        bare: false,
        locked: false,
        lock_reason: None,
        prunable_reason: None,
      });
      continue;
    }

    let Some(entry) = current.as_mut() else {
      continue;
    };

    if let Some(head) = trimmed.strip_prefix("HEAD ") {
      entry.head = Some(head.to_string());
      continue;
    }
    if let Some(branch) = trimmed.strip_prefix("branch ") {
      entry.branch = Some(branch.trim_start_matches("refs/heads/").to_string());
      continue;
    }
    if trimmed == "detached" {
      entry.detached = true;
      continue;
    }
    if trimmed == "bare" {
      entry.bare = true;
      continue;
    }
    if let Some(reason) = trimmed.strip_prefix("locked") {
      entry.locked = true;
      let cleaned = reason.trim();
      if !cleaned.is_empty() {
        entry.lock_reason = Some(cleaned.to_string());
      }
      continue;
    }
    if let Some(reason) = trimmed.strip_prefix("prunable") {
      let cleaned = reason.trim();
      if !cleaned.is_empty() {
        entry.prunable_reason = Some(cleaned.to_string());
      }
      continue;
    }
  }

  if let Some(entry) = current.take() {
    entries.push(entry);
  }

  Ok(entries)
}

#[tauri::command]
pub fn git_get_submodules(repo_path: String, recursive: Option<bool>) -> Result<Vec<SubmoduleEntry>, String> {
  let repo = canonical_repo_path(&repo_path)?;

  let mut status_args = vec!["submodule".to_string(), "status".to_string()];
  if recursive.unwrap_or(true) {
    status_args.push("--recursive".to_string());
  }

  let status_output = run_git_allow_failure(&repo, &status_args)?;
  let module_output = run_git_allow_failure(
    &repo,
    &[
      "config".to_string(),
      "--file".to_string(),
      ".gitmodules".to_string(),
      "--get-regexp".to_string(),
      "^submodule\\..*\\.(path|url)$".to_string(),
    ],
  )?;

  let mapping = parse_submodule_map(&module_output.stdout);
  let mut out = Vec::new();

  for raw_line in status_output.stdout.lines() {
    let line = raw_line.trim_end();
    if line.is_empty() {
      continue;
    }

    let flag = line.chars().next().unwrap_or(' ');
    let body = line[1..].trim();
    let mut parts = body.split_whitespace();
    let sha = parts.next().map(|v| v.to_string());
    let path = parts.next().unwrap_or_default().to_string();
    if path.is_empty() {
      continue;
    }

    let (name, url) = mapping
      .get(&path)
      .cloned()
      .unwrap_or((None, None));

    let initialized = flag != '-';
    let status = match flag {
      '-' => "uninitialized",
      '+' => "pointer-mismatch",
      'U' => "merge-conflict",
      _ => "clean",
    }
    .to_string();

    out.push(SubmoduleEntry {
      path,
      name,
      url,
      sha,
      initialized,
      status,
    });
  }

  Ok(out)
}

#[tauri::command]
pub fn git_checkout_branch(repo_path: String, branch: String) -> Result<GitCommandResult, String> {
  let repo = canonical_repo_path(&repo_path)?;
  run_git(&repo, &["checkout".to_string(), branch])
}

#[tauri::command]
pub fn git_fetch(
  repo_path: String,
  remote: Option<String>,
  prune: Option<bool>,
) -> Result<GitCommandResult, String> {
  let repo = canonical_repo_path(&repo_path)?;
  let mut args = vec!["fetch".to_string()];
  if prune.unwrap_or(false) {
    args.push("--prune".to_string());
  }
  if let Some(remote_name) = remote {
    args.push(remote_name);
  }
  run_git(&repo, &args)
}

#[tauri::command]
pub fn git_pull(
  repo_path: String,
  remote: Option<String>,
  branch: Option<String>,
) -> Result<GitCommandResult, String> {
  let repo = canonical_repo_path(&repo_path)?;
  let mut args = vec!["pull".to_string()];
  if let Some(remote_name) = remote {
    args.push(remote_name);
  }
  if let Some(branch_name) = branch {
    args.push(branch_name);
  }
  run_git(&repo, &args)
}

#[tauri::command]
pub fn git_push(
  repo_path: String,
  remote: Option<String>,
  branch: Option<String>,
  set_upstream: Option<bool>,
) -> Result<GitCommandResult, String> {
  let repo = canonical_repo_path(&repo_path)?;
  let mut args = vec!["push".to_string()];
  if set_upstream.unwrap_or(false) {
    args.push("--set-upstream".to_string());
  }
  if let Some(remote_name) = remote {
    args.push(remote_name);
  }
  if let Some(branch_name) = branch {
    args.push(branch_name);
  }
  run_git(&repo, &args)
}

#[tauri::command]
pub fn git_create_stash(
  repo_path: String,
  message: Option<String>,
  include_untracked: Option<bool>,
) -> Result<GitCommandResult, String> {
  let repo = canonical_repo_path(&repo_path)?;
  let mut args = vec!["stash".to_string(), "push".to_string()];
  if include_untracked.unwrap_or(false) {
    args.push("--include-untracked".to_string());
  }
  if let Some(stash_message) = message {
    args.push("-m".to_string());
    args.push(stash_message);
  }
  run_git(&repo, &args)
}

#[tauri::command]
pub fn git_apply_stash(
  repo_path: String,
  stash_ref: String,
  pop: Option<bool>,
) -> Result<GitCommandResult, String> {
  let repo = canonical_repo_path(&repo_path)?;
  let mut args = vec!["stash".to_string()];
  if pop.unwrap_or(false) {
    args.push("pop".to_string());
  } else {
    args.push("apply".to_string());
  }
  args.push(stash_ref);
  run_git(&repo, &args)
}

#[tauri::command]
pub fn git_drop_stash(repo_path: String, stash_ref: String) -> Result<GitCommandResult, String> {
  let repo = canonical_repo_path(&repo_path)?;
  run_git(
    &repo,
    &["stash".to_string(), "drop".to_string(), stash_ref],
  )
}

#[tauri::command]
pub fn git_worktree_add(
  repo_path: String,
  path: String,
  reference: Option<String>,
  new_branch: Option<String>,
  detach: Option<bool>,
) -> Result<GitCommandResult, String> {
  let repo = canonical_repo_path(&repo_path)?;
  let mut args = vec!["worktree".to_string(), "add".to_string()];

  if let Some(branch_name) = new_branch {
    args.push("-b".to_string());
    args.push(branch_name);
  }
  if detach.unwrap_or(false) {
    args.push("--detach".to_string());
  }

  args.push(path);
  if let Some(reference_value) = reference {
    args.push(reference_value);
  }

  run_git(&repo, &args)
}

#[tauri::command]
pub fn git_worktree_remove(
  repo_path: String,
  path: String,
  force: Option<bool>,
) -> Result<GitCommandResult, String> {
  let repo = canonical_repo_path(&repo_path)?;
  let mut args = vec!["worktree".to_string(), "remove".to_string()];
  if force.unwrap_or(false) {
    args.push("--force".to_string());
  }
  args.push(path);
  run_git(&repo, &args)
}

#[tauri::command]
pub fn git_submodule_update(
  repo_path: String,
  path: Option<String>,
  init: Option<bool>,
  recursive: Option<bool>,
) -> Result<GitCommandResult, String> {
  let repo = canonical_repo_path(&repo_path)?;
  let mut args = vec!["submodule".to_string(), "update".to_string()];
  if init.unwrap_or(true) {
    args.push("--init".to_string());
  }
  if recursive.unwrap_or(false) {
    args.push("--recursive".to_string());
  }
  if let Some(path_value) = path {
    args.push("--".to_string());
    args.push(path_value);
  }
  run_git(&repo, &args)
}

#[tauri::command]
pub fn git_submodule_sync(
  repo_path: String,
  path: Option<String>,
  recursive: Option<bool>,
) -> Result<GitCommandResult, String> {
  let repo = canonical_repo_path(&repo_path)?;
  let mut args = vec!["submodule".to_string(), "sync".to_string()];
  if recursive.unwrap_or(false) {
    args.push("--recursive".to_string());
  }
  if let Some(path_value) = path {
    args.push("--".to_string());
    args.push(path_value);
  }
  run_git(&repo, &args)
}

#[tauri::command]
pub fn git_submodule_deinit(
  repo_path: String,
  path: String,
  force: Option<bool>,
) -> Result<GitCommandResult, String> {
  let repo = canonical_repo_path(&repo_path)?;
  let mut args = vec!["submodule".to_string(), "deinit".to_string()];
  if force.unwrap_or(false) {
    args.push("--force".to_string());
  }
  args.push("--".to_string());
  args.push(path);
  run_git(&repo, &args)
}

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
  pub index_status: String,
  pub worktree_status: String,
  pub staged: bool,
  pub unstaged: bool,
  pub untracked: bool,
  pub old_path: Option<String>,
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

async fn run_git_spawn_blocking(repo: PathBuf, args: Vec<String>) -> Result<GitCommandResult, String> {
  tauri::async_runtime::spawn_blocking(move || run_git(&repo, &args))
    .await
    .map_err(|e| format!("Failed to join git task: {e}"))?
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
  let format = "%(*refname:short)%x1f%(refname:short)%x1f%(refname)%x1f%(upstream:short)%x1f%(upstream:track)%x1f%(HEAD)%x1f%(committerdate:unix)%x1f%(symref)";
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

    // Skip symbolic refs such as refs/remotes/origin/HEAD — they mirror another
    // ref rather than naming a real branch and would otherwise show up as a
    // phantom leaf (e.g. an "origin" entry inside the "origin" remote folder).
    let is_symref = parts.get(7).is_some_and(|symref| !symref.is_empty());
    if is_symref {
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
pub fn git_get_current_branch(repo_path: String) -> Result<String, String> {
  let repo = canonical_repo_path(&repo_path)?;
  let args = vec![
    "branch".to_string(),
    "--show-current".to_string(),
  ];
  let output = run_git(&repo, &args)?.stdout.trim().to_string();
  Ok(output)
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
    if line.len() < 3 {
      continue;
    }

    let status = line.get(0..2).unwrap_or("  ").to_string();
    let index_status = line
      .chars()
      .next()
      .unwrap_or(' ')
      .to_string();
    let worktree_status = line
      .chars()
      .nth(1)
      .unwrap_or(' ')
      .to_string();

    let raw_path = line.get(3..).unwrap_or_default().trim().to_string();
    if raw_path.is_empty() {
      continue;
    }

    let (old_path, path) = if let Some((from, to)) = raw_path.split_once(" -> ") {
      (Some(from.to_string()), to.to_string())
    } else {
      (None, raw_path)
    };

    let x = index_status.chars().next().unwrap_or(' ');
    let y = worktree_status.chars().next().unwrap_or(' ');
    let untracked = x == '?' && y == '?';
    let staged = !untracked && x != ' ' && x != '!';
    let unstaged = !untracked && y != ' ' && y != '!';

    if !staged && !unstaged && !untracked {
      continue;
    }

    files.push(ChangedFile {
      status,
      index_status,
      worktree_status,
      staged,
      unstaged,
      untracked,
      old_path,
      path,
    });
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
pub fn git_create_branch(
  repo_path: String,
  branch: String,
  base: Option<String>,
) -> Result<GitCommandResult, String> {
  let repo = canonical_repo_path(&repo_path)?;
  let mut args = vec!["branch".to_string(), branch];
  if let Some(base_ref) = base {
    if !base_ref.trim().is_empty() {
      args.push(base_ref);
    }
  }
  run_git(&repo, &args)
}

#[tauri::command]
pub fn git_clone_repo(url: String, destination: String) -> Result<GitCommandResult, String> {
  if url.trim().is_empty() {
    return Err("Clone URL is required".to_string());
  }
  if destination.trim().is_empty() {
    return Err("Clone destination is required".to_string());
  }

  let args = vec!["clone".to_string(), url, destination];
  let output = Command::new("git")
    .args(&args)
    .output()
    .map_err(|e| format!("Failed to spawn git: {e}"))?;

  let result = GitCommandResult {
    stdout: String::from_utf8_lossy(&output.stdout).to_string(),
    stderr: String::from_utf8_lossy(&output.stderr).to_string(),
    exit_code: output.status.code().unwrap_or(-1),
  };

  if result.exit_code != 0 {
    let details = if result.stderr.trim().is_empty() {
      result.stdout.trim().to_string()
    } else {
      result.stderr.trim().to_string()
    };
    return Err(format!(
      "git clone failed with exit code {}: {}",
      result.exit_code, details
    ));
  }

  Ok(result)
}

#[tauri::command]
pub async fn git_fetch(
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
  run_git_spawn_blocking(repo, args).await
}

#[tauri::command]
pub async fn git_pull(
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
  run_git_spawn_blocking(repo, args).await
}

#[tauri::command]
pub async fn git_push(
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
  run_git_spawn_blocking(repo, args).await
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


#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct StashEntry {
  pub index: usize,
  pub stash_ref: String,
  pub sha: String,
  pub message: String,
  pub branch: String,
  pub date: String,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CommitFileChange {
  pub path: String,
  pub status: String,
  pub additions: i32,
  pub deletions: i32,
}

#[tauri::command]
pub fn git_rename_branch(
  repo_path: String,
  old_name: Option<String>,
  new_name: String,
) -> Result<GitCommandResult, String> {
  let repo = canonical_repo_path(&repo_path)?;
  let mut args = vec!["branch".to_string(), "-m".to_string()];
  if let Some(old) = old_name {
    if !old.trim().is_empty() {
      args.push(old);
    }
  }
  args.push(new_name);
  run_git(&repo, &args)
}

#[tauri::command]
pub fn git_delete_branch(
  repo_path: String,
  branch: String,
  is_remote: Option<bool>,
  force: Option<bool>,
) -> Result<GitCommandResult, String> {
  let repo = canonical_repo_path(&repo_path)?;
  if is_remote.unwrap_or(false) {
    let parts: Vec<&str> = branch.splitn(2, "/").collect();
    if parts.len() == 2 {
      let remote_name = parts[0];
      let branch_name = parts[1];
      run_git(&repo, &["push".to_string(), remote_name.to_string(), "--delete".to_string(), branch_name.to_string()])
    } else {
      Err(format!("Invalid remote branch name: {branch}"))
    }
  } else {
    let flag = if force.unwrap_or(true) { "-D" } else { "-d" };
    run_git(&repo, &["branch".to_string(), flag.to_string(), branch])
  }
}

#[tauri::command]
pub fn git_set_upstream(
  repo_path: String,
  branch: Option<String>,
  upstream: Option<String>,
) -> Result<GitCommandResult, String> {
  let repo = canonical_repo_path(&repo_path)?;
  let mut args = vec!["branch".to_string()];
  if let Some(up) = upstream {
    if up.trim().is_empty() {
      args.push("--unset-upstream".to_string());
    } else {
      args.push(format!("--set-upstream-to={up}"));
    }
  } else {
    args.push("--unset-upstream".to_string());
  }
  if let Some(b) = branch {
    if !b.trim().is_empty() {
      args.push(b);
    }
  }
  run_git(&repo, &args)
}

#[tauri::command]
pub fn git_merge_branch(
  repo_path: String,
  reference: String,
) -> Result<GitCommandResult, String> {
  let repo = canonical_repo_path(&repo_path)?;
  run_git(&repo, &["merge".to_string(), reference])
}

#[tauri::command]
pub fn git_rebase_branch(
  repo_path: String,
  reference: String,
) -> Result<GitCommandResult, String> {
  let repo = canonical_repo_path(&repo_path)?;
  run_git(&repo, &["rebase".to_string(), reference])
}

#[tauri::command]
pub fn git_reset(
  repo_path: String,
  reference: String,
  mode: Option<String>,
) -> Result<GitCommandResult, String> {
  let repo = canonical_repo_path(&repo_path)?;
  let flag = match mode.as_deref().unwrap_or("mixed") {
    "soft" => "--soft",
    "hard" => "--hard",
    _ => "--mixed",
  };
  run_git(&repo, &["reset".to_string(), flag.to_string(), reference])
}

#[tauri::command]
pub fn git_get_commit_files(
  repo_path: String,
  sha: String,
) -> Result<Vec<CommitFileChange>, String> {
  let repo = canonical_repo_path(&repo_path)?;
  let args = vec![
    "show".to_string(),
    "--numstat".to_string(),
    "--format=".to_string(),
    sha,
  ];
  let output = run_git(&repo, &args)?.stdout;
  let mut files = Vec::new();

  for line in output.lines().map(str::trim).filter(|l| !l.is_empty()) {
    let parts: Vec<&str> = line.split_whitespace().collect();
    if parts.len() >= 3 {
      let add = parts[0].parse::<i32>().unwrap_or(0);
      let del = parts[1].parse::<i32>().unwrap_or(0);
      let path = parts[2..].join(" ");
      let status = if add > 0 && del == 0 {
        "A".to_string()
      } else if add == 0 && del > 0 {
        "D".to_string()
      } else {
        "M".to_string()
      };
      files.push(CommitFileChange {
        path,
        status,
        additions: add,
        deletions: del,
      });
    }
  }

  Ok(files)
}

#[tauri::command]
pub fn git_get_commit_diff(
  repo_path: String,
  sha: String,
  file_path: Option<String>,
) -> Result<String, String> {
  let repo = canonical_repo_path(&repo_path)?;
  let mut args = vec!["show".to_string(), sha];
  if let Some(path) = file_path {
    if !path.trim().is_empty() {
      args.push("--".to_string());
      args.push(path);
    }
  }
  let result = run_git(&repo, &args)?;
  Ok(result.stdout)
}

#[tauri::command]
pub fn git_cherry_pick(
  repo_path: String,
  sha: String,
) -> Result<GitCommandResult, String> {
  let repo = canonical_repo_path(&repo_path)?;
  run_git(&repo, &["cherry-pick".to_string(), sha])
}

#[tauri::command]
pub fn git_revert_commit(
  repo_path: String,
  sha: String,
) -> Result<GitCommandResult, String> {
  let repo = canonical_repo_path(&repo_path)?;
  run_git(&repo, &["revert".to_string(), "--no-edit".to_string(), sha])
}

#[tauri::command]
pub fn git_create_tag(
  repo_path: String,
  tag_name: String,
  sha: Option<String>,
) -> Result<GitCommandResult, String> {
  let repo = canonical_repo_path(&repo_path)?;
  let mut args = vec!["tag".to_string(), tag_name];
  if let Some(target_sha) = sha {
    if !target_sha.trim().is_empty() {
      args.push(target_sha);
    }
  }
  run_git(&repo, &args)
}

#[tauri::command]
pub fn git_delete_tag(
  repo_path: String,
  tag_name: String,
) -> Result<GitCommandResult, String> {
  let repo = canonical_repo_path(&repo_path)?;
  run_git(&repo, &["tag".to_string(), "-d".to_string(), tag_name])
}

#[tauri::command]
pub fn git_stage_file(
  repo_path: String,
  path: String,
) -> Result<GitCommandResult, String> {
  let repo = canonical_repo_path(&repo_path)?;
  run_git(&repo, &["add".to_string(), "--".to_string(), path])
}

#[tauri::command]
pub fn git_stage_all(repo_path: String) -> Result<GitCommandResult, String> {
  let repo = canonical_repo_path(&repo_path)?;
  run_git(&repo, &["add".to_string(), "-A".to_string()])
}

#[tauri::command]
pub fn git_unstage_file(
  repo_path: String,
  path: String,
) -> Result<GitCommandResult, String> {
  let repo = canonical_repo_path(&repo_path)?;
  run_git(&repo, &["restore".to_string(), "--staged".to_string(), "--".to_string(), path])
}

#[tauri::command]
pub fn git_unstage_all(repo_path: String) -> Result<GitCommandResult, String> {
  let repo = canonical_repo_path(&repo_path)?;
  run_git(&repo, &["restore".to_string(), "--staged".to_string(), ".".to_string()])
}

#[tauri::command]
pub fn git_discard_changes(
  repo_path: String,
  path: String,
  is_untracked: Option<bool>,
) -> Result<GitCommandResult, String> {
  let repo = canonical_repo_path(&repo_path)?;
  if is_untracked.unwrap_or(false) {
    run_git(&repo, &["clean".to_string(), "-fd".to_string(), "--".to_string(), path])
  } else {
    run_git(&repo, &["restore".to_string(), "--".to_string(), path])
  }
}

#[tauri::command]
pub fn git_discard_all(repo_path: String) -> Result<GitCommandResult, String> {
  let repo = canonical_repo_path(&repo_path)?;
  let _ = run_git_allow_failure(&repo, &["restore".to_string(), ".".to_string()]);
  let _ = run_git_allow_failure(&repo, &["clean".to_string(), "-fd".to_string()]);
  Ok(GitCommandResult {
    stdout: "All working tree changes discarded".to_string(),
    stderr: String::new(),
    exit_code: 0,
  })
}

#[tauri::command]
pub fn git_commit(
  repo_path: String,
  message: String,
  amend: Option<bool>,
) -> Result<GitCommandResult, String> {
  let repo = canonical_repo_path(&repo_path)?;
  let mut args = vec!["commit".to_string(), "-m".to_string(), message];
  if amend.unwrap_or(false) {
    args.push("--amend".to_string());
  }
  run_git(&repo, &args)
}

#[tauri::command]
pub fn git_get_stashes(repo_path: String) -> Result<Vec<StashEntry>, String> {
  let repo = canonical_repo_path(&repo_path)?;
  let format = "%gd%x1f%H%x1f%gs%x1f%cr";
  let args = vec!["stash".to_string(), "list".to_string(), format!("--format={format}")];

  let output = run_git_allow_failure(&repo, &args)?;
  if output.exit_code != 0 {
    return Ok(Vec::new());
  }

  let mut stashes = Vec::new();
  for (idx, line) in output.stdout.lines().enumerate() {
    let parts: Vec<&str> = line.split("\u{1f}").collect();
    if parts.len() < 4 {
      continue;
    }

    let stash_ref = parts[0].to_string();
    let sha = parts[1].to_string();
    let raw_msg = parts[2].to_string();
    let date = parts[3].to_string();

    let (branch, message) = if let Some((b, m)) = raw_msg.split_once(": ") {
      (b.trim_start_matches("WIP on ").trim_start_matches("On ").to_string(), m.to_string())
    } else {
      ("main".to_string(), raw_msg)
    };

    stashes.push(StashEntry {
      index: idx,
      stash_ref,
      sha,
      message,
      branch,
      date,
    });
  }

  Ok(stashes)
}

#[tauri::command]
pub fn git_show_file_diff(
  repo_path: String,
  path: String,
  staged: Option<bool>,
) -> Result<String, String> {
  let repo = canonical_repo_path(&repo_path)?;
  let mut args = vec!["diff".to_string()];
  if staged.unwrap_or(false) {
    args.push("--staged".to_string());
  }
  args.push("--".to_string());
  args.push(path);
  let result = run_git(&repo, &args)?;
  Ok(result.stdout)
}

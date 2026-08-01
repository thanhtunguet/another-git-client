mod git_backend;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![
      git_backend::git_is_repo,
      git_backend::git_get_branches,
      git_backend::git_get_tags,
      git_backend::git_get_graph,
      git_backend::git_get_changed_files,
      git_backend::git_get_worktrees,
      git_backend::git_get_submodules,
      git_backend::git_checkout_branch,
      git_backend::git_fetch,
      git_backend::git_pull,
      git_backend::git_push,
      git_backend::git_create_stash,
      git_backend::git_apply_stash,
      git_backend::git_drop_stash,
      git_backend::git_worktree_add,
      git_backend::git_worktree_remove,
      git_backend::git_submodule_update,
      git_backend::git_submodule_sync,
      git_backend::git_submodule_deinit,
    ])
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}

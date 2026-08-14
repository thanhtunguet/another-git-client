mod git_backend;

use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![
      git_backend::git_is_repo,
      git_backend::git_get_branches,
      git_backend::git_get_current_branch,
      git_backend::git_get_tags,
      git_backend::git_get_commit_count,
      git_backend::git_get_graph,
      git_backend::git_get_changed_files,
      git_backend::git_get_worktrees,
      git_backend::git_get_submodules,
      git_backend::git_checkout_branch,
      git_backend::git_create_branch,
      git_backend::git_rename_branch,
      git_backend::git_delete_branch,
      git_backend::git_set_upstream,
      git_backend::git_merge_branch,
      git_backend::git_rebase_branch,
      git_backend::git_reset,
      git_backend::git_clone_repo,
      git_backend::git_fetch,
      git_backend::git_pull,
      git_backend::git_push,
      git_backend::git_get_commit_files,
      git_backend::git_get_commit_diff,
      git_backend::git_cherry_pick,
      git_backend::git_revert_commit,
      git_backend::git_create_tag,
      git_backend::git_delete_tag,
      git_backend::git_stage_file,
      git_backend::git_stage_all,
      git_backend::git_unstage_file,
      git_backend::git_unstage_all,
      git_backend::git_discard_changes,
      git_backend::git_discard_all,
      git_backend::git_commit,
      git_backend::git_get_stashes,
      git_backend::git_create_stash,
      git_backend::git_apply_stash,
      git_backend::git_drop_stash,
      git_backend::git_show_file_diff,
      git_backend::git_worktree_add,
      git_backend::git_worktree_remove,
      git_backend::git_submodule_update,
      git_backend::git_submodule_sync,
      git_backend::git_submodule_deinit,
      git_backend::git_worktree_lock,
      git_backend::git_worktree_unlock,
      git_backend::git_worktree_prune,
      git_backend::git_open_path_in_file_manager,
      git_backend::git_open_path_in_terminal,
      git_backend::terminal_start,
      git_backend::terminal_write,
      git_backend::terminal_resize,
      git_backend::terminal_stop,
      git_backend::git_submodule_init,
      git_backend::git_submodule_pointer_diff,
      git_backend::git_submodule_stage_pointer,
      git_backend::git_submodule_checkout_recorded,
      git_backend::git_submodule_pull_tracked,
      git_backend::git_get_compare,
      git_backend::git_create_patch,
      git_backend::git_apply_patch,
      git_backend::git_add_remote,
      git_backend::git_delete_remote,
      git_backend::git_get_remotes,
      git_backend::git_set_remote_url,
      git_backend::git_get_staged_diff,
    ])
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }

      app.handle().plugin(tauri_plugin_dialog::init())?;

      if let Some(main_window) = app.get_webview_window("main") {
        let _ = main_window.maximize();
      }

      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}

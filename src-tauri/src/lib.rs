#[tauri::command]
fn detect_windows_installer_target() -> String {
  #[cfg(not(target_os = "windows"))]
  {
    return "windows-x86_64".to_string();
  }

  #[cfg(target_os = "windows")]
  {
    let exe_path = std::env::current_exe()
      .ok()
      .and_then(|p| p.to_str().map(|s| s.to_lowercase()))
      .unwrap_or_default();

    // NSIS default installs per-user under AppData\Local\Programs.
    if exe_path.contains("\\appdata\\local\\programs\\") || exe_path.contains("nsis") {
      return "windows-x86_64-exe".to_string();
    }

    // MSI commonly installs to Program Files.
    if exe_path.contains("\\program files\\") || exe_path.contains("\\program files (x86)\\") {
      return "windows-x86_64-msi".to_string();
    }

    // Safe default for unknown install location.
    "windows-x86_64-msi".to_string()
  }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_http::init())
    .plugin(tauri_plugin_updater::Builder::new().build())
    .invoke_handler(tauri::generate_handler![detect_windows_installer_target])
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

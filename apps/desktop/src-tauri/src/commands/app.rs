use crate::domain::models::DesktopSummary;

#[tauri::command]
pub fn desktop_summary(app: tauri::AppHandle) -> DesktopSummary {
    DesktopSummary {
        app_name: app.package_info().name.clone(),
        tauri_version: "2.x".to_string(),
        target_triple: format!("{}-{}", std::env::consts::OS, std::env::consts::ARCH),
        profile: if cfg!(debug_assertions) {
            "debug".to_string()
        } else {
            "release".to_string()
        },
    }
}

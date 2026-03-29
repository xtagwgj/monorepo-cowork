use serde::Serialize;

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct DesktopSummary {
    app_name: String,
    tauri_version: String,
    target_triple: String,
    profile: String,
}

#[tauri::command]
fn desktop_summary(app: tauri::AppHandle) -> DesktopSummary {
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

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![desktop_summary])
        .run(tauri::generate_context!())
        .expect("failed to run Tauri application");
}

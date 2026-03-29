mod commands;
mod domain;

use commands::{app, files, system};
use domain::{access::AccessPolicy, sessions::SessionState};

fn main() {
    tauri::Builder::default()
        .manage(AccessPolicy::default())
        .manage(SessionState::default())
        .invoke_handler(tauri::generate_handler![
            app::desktop_summary,
            files::close_read_session,
            files::close_write_session,
            files::copy_file_streaming,
            files::flush_write_session,
            files::list_directory,
            files::open_read_session,
            files::open_write_session,
            files::read_chunk,
            files::write_chunk,
            system::open_path_in_system,
            system::pick_file,
            system::pick_folder
        ])
        .run(tauri::generate_context!())
        .expect("failed to run Tauri application");
}

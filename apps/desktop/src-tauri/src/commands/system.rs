use crate::domain::error::{DesktopError, DesktopResult};
use std::{
    path::{Path, PathBuf},
    process::Command,
};

#[tauri::command]
pub fn open_path_in_system(path: String) -> Result<(), String> {
    platform_open(Path::new(&path)).map_err(|error| error.to_string())
}

#[tauri::command]
pub fn pick_folder(initial_directory: Option<String>) -> Result<Option<String>, String> {
    let initial = initial_directory.as_deref().map(Path::new);
    let picked = pick_folder_with_system_dialog(initial).map_err(|error| error.to_string())?;
    Ok(picked.map(|path| path.to_string_lossy().to_string()))
}

fn platform_open(path: &Path) -> DesktopResult<()> {
    let status = if cfg!(target_os = "macos") {
        Command::new("open").arg(path).status()?
    } else if cfg!(target_os = "windows") {
        Command::new("cmd")
            .args(["/C", "start", "", &path.to_string_lossy()])
            .status()?
    } else {
        Command::new("xdg-open").arg(path).status()?
    };

    if status.success() {
        Ok(())
    } else {
        Err(DesktopError::message(format!(
            "Failed to open {} with the system shell.",
            path.display()
        )))
    }
}

fn pick_folder_with_system_dialog(initial_directory: Option<&Path>) -> DesktopResult<Option<PathBuf>> {
    if cfg!(target_os = "macos") {
        let command = match initial_directory {
            Some(path) => format!(
                "POSIX path of (choose folder with prompt \"Select a folder\" default location POSIX file \"{}\")",
                path.display()
            ),
            None => "POSIX path of (choose folder with prompt \"Select a folder\")".to_string(),
        };

        let output = Command::new("osascript").args(["-e", &command]).output()?;
        if output.status.success() {
            let selection = String::from_utf8_lossy(&output.stdout).trim().to_string();
            return Ok((!selection.is_empty()).then(|| PathBuf::from(selection)));
        }

        let stderr = String::from_utf8_lossy(&output.stderr);
        if stderr.contains("-128") {
            return Ok(None);
        }

        return Err(DesktopError::message(stderr.trim().to_string()));
    }

    if cfg!(target_os = "windows") {
        let script = match initial_directory {
            Some(path) => format!(
                "Add-Type -AssemblyName System.Windows.Forms; $dialog = New-Object System.Windows.Forms.FolderBrowserDialog; $dialog.SelectedPath = '{}'; if ($dialog.ShowDialog() -eq 'OK') {{ Write-Output $dialog.SelectedPath }}",
                path.display()
            ),
            None => "Add-Type -AssemblyName System.Windows.Forms; $dialog = New-Object System.Windows.Forms.FolderBrowserDialog; if ($dialog.ShowDialog() -eq 'OK') { Write-Output $dialog.SelectedPath }".to_string(),
        };

        let output = Command::new("powershell")
            .args(["-NoProfile", "-Command", &script])
            .output()?;

        if output.status.success() {
            let selection = String::from_utf8_lossy(&output.stdout).trim().to_string();
            return Ok((!selection.is_empty()).then(|| PathBuf::from(selection)));
        }

        return Err(DesktopError::message(
            String::from_utf8_lossy(&output.stderr).trim().to_string(),
        ));
    }

    let output = Command::new("sh")
        .args([
            "-c",
            "command -v zenity >/dev/null && zenity --file-selection --directory || command -v kdialog >/dev/null && kdialog --getexistingdirectory || true",
        ])
        .output()?;

    if output.status.success() {
        let selection = String::from_utf8_lossy(&output.stdout).trim().to_string();
        return Ok((!selection.is_empty()).then(|| PathBuf::from(selection)));
    }

    Err(DesktopError::message(
        "No supported folder picker is available on this platform.".to_string(),
    ))
}

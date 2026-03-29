use crate::domain::{
    access::AccessPolicy,
    error::{DesktopError, DesktopResult},
    models::PickedPath,
};
use std::{
    path::{Path, PathBuf},
    process::Command,
};

#[tauri::command]
pub fn open_path_in_system(
    path: String,
    access_policy: tauri::State<'_, AccessPolicy>,
) -> Result<(), String> {
    let approved = access_policy
        .ensure_allowed_path(Path::new(&path))
        .map_err(|error| error.to_string())?;

    platform_open(&approved).map_err(|error| error.to_string())
}

#[tauri::command]
pub fn pick_folder(
    initial_directory: Option<String>,
    access_policy: tauri::State<'_, AccessPolicy>,
) -> Result<Option<String>, String> {
    let initial = initial_directory.as_deref().map(Path::new);
    let picked = pick_folder_with_system_dialog(initial).map_err(|error| error.to_string())?;

    match picked {
        Some(path) => {
            let approved = access_policy.approve_path(&path).map_err(|error| error.to_string())?;
            Ok(Some(approved.to_string_lossy().to_string()))
        }
        None => Ok(None),
    }
}

#[tauri::command]
pub fn pick_file(
    initial_directory: Option<String>,
    access_policy: tauri::State<'_, AccessPolicy>,
) -> Result<Option<PickedPath>, String> {
    let initial = initial_directory.as_deref().map(Path::new);
    let picked = pick_file_with_system_dialog(initial).map_err(|error| error.to_string())?;

    match picked {
        Some(path) => {
            let approved = access_policy.approve_path(&path).map_err(|error| error.to_string())?;
            Ok(Some(PickedPath {
                path: approved.to_string_lossy().to_string(),
            }))
        }
        None => Ok(None),
    }
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

fn pick_file_with_system_dialog(initial_directory: Option<&Path>) -> DesktopResult<Option<PathBuf>> {
    if cfg!(target_os = "macos") {
        let command = match initial_directory {
            Some(path) => format!(
                "POSIX path of (choose file with prompt \"Select a file\" default location POSIX file \"{}\")",
                path.display()
            ),
            None => "POSIX path of (choose file with prompt \"Select a file\")".to_string(),
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
                "Add-Type -AssemblyName System.Windows.Forms; $dialog = New-Object System.Windows.Forms.OpenFileDialog; $dialog.InitialDirectory = '{}'; if ($dialog.ShowDialog() -eq 'OK') {{ Write-Output $dialog.FileName }}",
                path.display()
            ),
            None => "Add-Type -AssemblyName System.Windows.Forms; $dialog = New-Object System.Windows.Forms.OpenFileDialog; if ($dialog.ShowDialog() -eq 'OK') { Write-Output $dialog.FileName }".to_string(),
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
            "command -v zenity >/dev/null && zenity --file-selection || command -v kdialog >/dev/null && kdialog --getopenfilename || true",
        ])
        .output()?;

    if output.status.success() {
        let selection = String::from_utf8_lossy(&output.stdout).trim().to_string();
        return Ok((!selection.is_empty()).then(|| PathBuf::from(selection)));
    }

    Err(DesktopError::message(
        "No supported file picker is available on this platform.".to_string(),
    ))
}

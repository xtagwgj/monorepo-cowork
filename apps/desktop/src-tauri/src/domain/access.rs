use crate::domain::error::{DesktopError, DesktopResult};
use std::{
    collections::HashSet,
    env,
    path::{Path, PathBuf},
    sync::Mutex,
};

#[derive(Default)]
pub struct AccessPolicy {
    approved_roots: Mutex<HashSet<PathBuf>>,
}

impl AccessPolicy {
    pub fn ensure_allowed_path(&self, path: &Path) -> DesktopResult<PathBuf> {
        let canonical_path = canonicalize_with_context(path)?;
        let approved_roots = self
            .approved_roots
            .lock()
            .map_err(|_| DesktopError::lock("approved roots"))?;

        if builtin_roots()
            .into_iter()
            .chain(approved_roots.iter().cloned())
            .any(|root| canonical_path.starts_with(root))
        {
            return Ok(canonical_path);
        }

        Err(DesktopError::message(format!(
            "Access denied for {}. Select the file or folder in the system dialog first, or use a path inside the workspace, Home, Desktop, Documents, or Downloads.",
            canonical_path.display()
        )))
    }

    pub fn approve_path(&self, path: &Path) -> DesktopResult<PathBuf> {
        let canonical_path = canonicalize_with_context(path)?;
        let root = if canonical_path.is_dir() {
            canonical_path.clone()
        } else {
            canonical_path.parent().map(Path::to_path_buf).ok_or_else(|| {
                DesktopError::message("Could not resolve the parent directory for the selected path.")
            })?
        };

        self.approved_roots
            .lock()
            .map_err(|_| DesktopError::lock("approved roots"))?
            .insert(root);

        Ok(canonical_path)
    }
}

fn canonicalize_with_context(path: &Path) -> DesktopResult<PathBuf> {
    path.canonicalize().map_err(|error| {
        DesktopError::message(format!("Failed to resolve {}: {error}", path.display()))
    })
}

fn builtin_roots() -> Vec<PathBuf> {
    let mut roots = Vec::new();

    if let Ok(current_dir) = env::current_dir() {
        roots.push(current_dir);
    }

    if let Some(home_dir) = home_dir() {
        roots.push(home_dir.clone());
        roots.push(home_dir.join("Desktop"));
        roots.push(home_dir.join("Documents"));
        roots.push(home_dir.join("Downloads"));
    }

    roots
}

fn home_dir() -> Option<PathBuf> {
    env::var_os("HOME")
        .map(PathBuf::from)
        .or_else(|| env::var_os("USERPROFILE").map(PathBuf::from))
}

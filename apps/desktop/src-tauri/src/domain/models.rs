use serde::{Deserialize, Serialize};

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DesktopSummary {
    pub app_name: String,
    pub tauri_version: String,
    pub target_triple: String,
    pub profile: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct FileSessionInfo {
    pub session_id: u64,
    pub path: String,
    pub size: Option<u64>,
    pub bytes_processed: u64,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ReadChunkResult {
    pub bytes: Vec<u8>,
    pub bytes_read: usize,
    pub total_bytes_read: u64,
    pub eof: bool,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct WriteChunkResult {
    pub bytes_written: usize,
    pub total_bytes_written: u64,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct FileEntry {
    pub path: String,
    pub name: String,
    pub is_dir: bool,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct OpenWriteSessionPayload {
    pub path: String,
    pub truncate: Option<bool>,
    pub create_parent: Option<bool>,
}

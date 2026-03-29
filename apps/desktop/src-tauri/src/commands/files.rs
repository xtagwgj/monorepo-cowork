use crate::domain::{
    access::AccessPolicy,
    error::{DesktopError, DesktopResult},
    models::{FileEntry, FileSessionInfo, OpenWriteSessionPayload, ReadChunkResult, WriteChunkResult},
    sessions::{
        next_session_id, normalize_chunk_size, ReadSession, SessionState, WriteSession,
        DEFAULT_BUFFER_CAPACITY,
    },
};
use std::{
    fs::{self, File, OpenOptions},
    io::{BufReader, BufWriter, Read, Write},
    path::PathBuf,
};

#[tauri::command]
pub fn open_read_session(
    path: String,
    access_policy: tauri::State<'_, AccessPolicy>,
    state: tauri::State<'_, SessionState>,
) -> Result<FileSessionInfo, String> {
    open_read_session_impl(path, access_policy.inner(), state.inner()).map_err(|error| error.to_string())
}

#[tauri::command]
pub fn read_chunk(
    session_id: u64,
    chunk_size: usize,
    state: tauri::State<'_, SessionState>,
) -> Result<ReadChunkResult, String> {
    read_chunk_impl(session_id, chunk_size, state.inner()).map_err(|error| error.to_string())
}

#[tauri::command]
pub fn close_read_session(session_id: u64, state: tauri::State<'_, SessionState>) -> Result<(), String> {
    close_read_session_impl(session_id, state.inner()).map_err(|error| error.to_string())
}

#[tauri::command]
pub fn open_write_session(
    payload: OpenWriteSessionPayload,
    access_policy: tauri::State<'_, AccessPolicy>,
    state: tauri::State<'_, SessionState>,
) -> Result<FileSessionInfo, String> {
    open_write_session_impl(payload, access_policy.inner(), state.inner()).map_err(|error| error.to_string())
}

#[tauri::command]
pub fn write_chunk(
    session_id: u64,
    bytes: Vec<u8>,
    state: tauri::State<'_, SessionState>,
) -> Result<WriteChunkResult, String> {
    write_chunk_impl(session_id, bytes, state.inner()).map_err(|error| error.to_string())
}

#[tauri::command]
pub fn flush_write_session(session_id: u64, state: tauri::State<'_, SessionState>) -> Result<(), String> {
    flush_write_session_impl(session_id, state.inner()).map_err(|error| error.to_string())
}

#[tauri::command]
pub fn close_write_session(session_id: u64, state: tauri::State<'_, SessionState>) -> Result<(), String> {
    close_write_session_impl(session_id, state.inner()).map_err(|error| error.to_string())
}

#[tauri::command]
pub fn copy_file_streaming(
    source_path: String,
    destination_path: String,
    chunk_size: usize,
    access_policy: tauri::State<'_, AccessPolicy>,
) -> Result<WriteChunkResult, String> {
    copy_file_streaming_impl(source_path, destination_path, chunk_size, access_policy.inner())
        .map_err(|error| error.to_string())
}

#[tauri::command]
pub fn list_directory(
    path: String,
    access_policy: tauri::State<'_, AccessPolicy>,
) -> Result<Vec<FileEntry>, String> {
    list_directory_impl(path, access_policy.inner()).map_err(|error| error.to_string())
}

fn open_read_session_impl(
    path: String,
    access_policy: &AccessPolicy,
    state: &SessionState,
) -> DesktopResult<FileSessionInfo> {
    let approved_path = access_policy.ensure_allowed_path(PathBuf::from(&path).as_path())?;
    let file = File::open(&approved_path)?;
    let size = file.metadata()?.len();
    let session_id = next_session_id(state);
    let session = ReadSession {
        path: approved_path.clone(),
        reader: BufReader::with_capacity(DEFAULT_BUFFER_CAPACITY, file),
        size,
        bytes_read: 0,
    };

    state
        .readers
        .lock()
        .map_err(|_| DesktopError::lock("read sessions"))?
        .insert(session_id, session);

    Ok(FileSessionInfo {
        session_id,
        path: approved_path.to_string_lossy().to_string(),
        size: Some(size),
        bytes_processed: 0,
    })
}

fn read_chunk_impl(session_id: u64, chunk_size: usize, state: &SessionState) -> DesktopResult<ReadChunkResult> {
    let mut readers = state
        .readers
        .lock()
        .map_err(|_| DesktopError::lock("read sessions"))?;
    let session = readers
        .get_mut(&session_id)
        .ok_or_else(|| DesktopError::message(format!("Unknown read session: {session_id}")))?;

    let mut buffer = vec![0_u8; normalize_chunk_size(chunk_size)];
    let bytes_read = session.reader.read(&mut buffer)?;
    buffer.truncate(bytes_read);
    session.bytes_read += bytes_read as u64;

    Ok(ReadChunkResult {
        bytes: buffer,
        bytes_read,
        total_bytes_read: session.bytes_read,
        eof: bytes_read == 0 || session.bytes_read >= session.size,
    })
}

fn close_read_session_impl(session_id: u64, state: &SessionState) -> DesktopResult<()> {
    let mut readers = state
        .readers
        .lock()
        .map_err(|_| DesktopError::lock("read sessions"))?;
    let session = readers
        .remove(&session_id)
        .ok_or_else(|| DesktopError::message(format!("Unknown read session: {session_id}")))?;

    let _ = session.path;
    Ok(())
}

fn open_write_session_impl(
    payload: OpenWriteSessionPayload,
    access_policy: &AccessPolicy,
    state: &SessionState,
) -> DesktopResult<FileSessionInfo> {
    let requested_path = PathBuf::from(&payload.path);

    if payload.create_parent.unwrap_or(true) {
        if let Some(parent) = requested_path.parent() {
            fs::create_dir_all(parent)?;
            access_policy.approve_path(parent)?;
        }
    }

    let approved_path = access_policy.ensure_allowed_path(&requested_path)?;
    let mut options = OpenOptions::new();
    options.write(true).create(true);

    if payload.truncate.unwrap_or(true) {
        options.truncate(true);
    } else {
        options.append(true);
    }

    let file = options.open(&approved_path)?;
    let bytes_written = if payload.truncate.unwrap_or(true) {
        0
    } else {
        file.metadata()?.len()
    };

    let session_id = next_session_id(state);
    let session = WriteSession {
        path: approved_path.clone(),
        writer: BufWriter::with_capacity(DEFAULT_BUFFER_CAPACITY, file),
        bytes_written,
    };

    state
        .writers
        .lock()
        .map_err(|_| DesktopError::lock("write sessions"))?
        .insert(session_id, session);

    Ok(FileSessionInfo {
        session_id,
        path: approved_path.to_string_lossy().to_string(),
        size: None,
        bytes_processed: bytes_written,
    })
}

fn write_chunk_impl(session_id: u64, bytes: Vec<u8>, state: &SessionState) -> DesktopResult<WriteChunkResult> {
    let mut writers = state
        .writers
        .lock()
        .map_err(|_| DesktopError::lock("write sessions"))?;
    let session = writers
        .get_mut(&session_id)
        .ok_or_else(|| DesktopError::message(format!("Unknown write session: {session_id}")))?;

    session.writer.write_all(&bytes)?;
    session.bytes_written += bytes.len() as u64;

    Ok(WriteChunkResult {
        bytes_written: bytes.len(),
        total_bytes_written: session.bytes_written,
    })
}

fn flush_write_session_impl(session_id: u64, state: &SessionState) -> DesktopResult<()> {
    let mut writers = state
        .writers
        .lock()
        .map_err(|_| DesktopError::lock("write sessions"))?;
    let session = writers
        .get_mut(&session_id)
        .ok_or_else(|| DesktopError::message(format!("Unknown write session: {session_id}")))?;

    session.writer.flush()?;
    Ok(())
}

fn close_write_session_impl(session_id: u64, state: &SessionState) -> DesktopResult<()> {
    let mut writers = state
        .writers
        .lock()
        .map_err(|_| DesktopError::lock("write sessions"))?;
    let mut session = writers
        .remove(&session_id)
        .ok_or_else(|| DesktopError::message(format!("Unknown write session: {session_id}")))?;

    session.writer.flush()?;
    let _ = session.path;
    Ok(())
}

fn copy_file_streaming_impl(
    source_path: String,
    destination_path: String,
    chunk_size: usize,
    access_policy: &AccessPolicy,
) -> DesktopResult<WriteChunkResult> {
    let approved_source = access_policy.ensure_allowed_path(PathBuf::from(&source_path).as_path())?;
    let requested_destination = PathBuf::from(&destination_path);

    if let Some(parent) = requested_destination.parent() {
        fs::create_dir_all(parent)?;
        access_policy.approve_path(parent)?;
    }

    let approved_destination = access_policy.ensure_allowed_path(&requested_destination)?;
    let source = File::open(&approved_source)?;
    let destination = File::create(&approved_destination)?;
    let mut reader = BufReader::with_capacity(DEFAULT_BUFFER_CAPACITY, source);
    let mut writer = BufWriter::with_capacity(DEFAULT_BUFFER_CAPACITY, destination);
    let mut buffer = vec![0_u8; normalize_chunk_size(chunk_size)];
    let mut total_bytes_written = 0_u64;

    loop {
        let bytes_read = reader.read(&mut buffer)?;
        if bytes_read == 0 {
            break;
        }

        writer.write_all(&buffer[..bytes_read])?;
        total_bytes_written += bytes_read as u64;
    }

    writer.flush()?;

    Ok(WriteChunkResult {
        bytes_written: 0,
        total_bytes_written,
    })
}

fn list_directory_impl(path: String, access_policy: &AccessPolicy) -> DesktopResult<Vec<FileEntry>> {
    let approved_path = access_policy.ensure_allowed_path(PathBuf::from(&path).as_path())?;
    let mut entries = Vec::new();

    for entry in fs::read_dir(&approved_path)? {
        let entry = entry?;
        let entry_path = entry.path();
        let metadata = entry.metadata()?;

        entries.push(FileEntry {
            path: entry_path.to_string_lossy().to_string(),
            name: entry.file_name().to_string_lossy().to_string(),
            is_dir: metadata.is_dir(),
        });
    }

    entries.sort_by(|left, right| left.name.to_lowercase().cmp(&right.name.to_lowercase()));
    Ok(entries)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::domain::{access::AccessPolicy, sessions::SessionState};

    #[test]
    fn chunk_size_is_capped() {
        assert_eq!(normalize_chunk_size(0), 1);
        assert_eq!(normalize_chunk_size(1024), 1024);
        assert_eq!(
            normalize_chunk_size(64 * 1024 * 1024),
            crate::domain::sessions::MAX_CHUNK_SIZE
        );
    }

    #[test]
    fn session_ids_are_monotonic() {
        let state = SessionState::default();
        let first = next_session_id(&state);
        let second = next_session_id(&state);

        assert_eq!(first + 1, second);
    }

    #[test]
    fn approved_paths_pass_policy_checks() {
        let policy = AccessPolicy::default();
        let temp_dir = std::env::temp_dir();
        let approved = policy.approve_path(&temp_dir).expect("approve temp dir");
        let checked = policy
            .ensure_allowed_path(&approved)
            .expect("path should be allowed");

        assert_eq!(approved, checked);
    }
}

use std::{
    collections::HashMap,
    fs::File,
    io::{BufReader, BufWriter},
    path::PathBuf,
    sync::{
        atomic::{AtomicU64, Ordering},
        Mutex,
    },
};

pub const DEFAULT_BUFFER_CAPACITY: usize = 1024 * 1024;
pub const MAX_CHUNK_SIZE: usize = 8 * 1024 * 1024;

#[derive(Default)]
pub struct SessionState {
    pub next_id: AtomicU64,
    pub readers: Mutex<HashMap<u64, ReadSession>>,
    pub writers: Mutex<HashMap<u64, WriteSession>>,
}

pub struct ReadSession {
    pub path: PathBuf,
    pub reader: BufReader<File>,
    pub size: u64,
    pub bytes_read: u64,
}

pub struct WriteSession {
    pub path: PathBuf,
    pub writer: BufWriter<File>,
    pub bytes_written: u64,
}

pub fn next_session_id(state: &SessionState) -> u64 {
    state.next_id.fetch_add(1, Ordering::Relaxed) + 1
}

pub fn normalize_chunk_size(chunk_size: usize) -> usize {
    chunk_size.clamp(1, MAX_CHUNK_SIZE)
}

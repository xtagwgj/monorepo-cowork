#[derive(Debug)]
pub enum DesktopError {
    Io(std::io::Error),
    Message(String),
}

pub type DesktopResult<T> = Result<T, DesktopError>;

impl DesktopError {
    pub fn message(message: impl Into<String>) -> Self {
        Self::Message(message.into())
    }

    pub fn lock(name: &str) -> Self {
        Self::Message(format!("Failed to lock {name}."))
    }
}

impl std::fmt::Display for DesktopError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::Io(error) => write!(f, "{error}"),
            Self::Message(message) => write!(f, "{message}"),
        }
    }
}

impl From<std::io::Error> for DesktopError {
    fn from(value: std::io::Error) -> Self {
        Self::Io(value)
    }
}

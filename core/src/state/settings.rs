use serde::{Deserialize, Serialize};
use std::{
    collections::HashSet,
    path::{Path, PathBuf},
};
use tokio::fs;

// TODO: convert to semver
const CURRENT_FORMAT_VERSION: u32 = 1;

// Types
#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(default)]
pub struct Settings {
    pub memory: MemorySettings,
    pub game_resolution: WindowSize,
    pub custom_java_args: Vec<String>,
    pub java_8_path: Option<PathBuf>,
    pub java_17_path: Option<PathBuf>,
    pub default_user: Option<uuid::Uuid>,
    pub hooks: Hooks,
    pub max_concurrent_downloads: usize,
    pub version: u32,
}

impl Default for Settings {
    fn default() -> Self {
        Self {
            memory: MemorySettings::default(),
            game_resolution: WindowSize::default(),
            custom_java_args: Vec::new(),
            java_8_path: None,
            java_17_path: None,
            default_user: None,
            hooks: Hooks::default(),
            max_concurrent_downloads: 64,
            version: CURRENT_FORMAT_VERSION,
        }
    }
}

impl Settings {
    #[tracing::instrument]
    pub async fn init(file: &Path) -> crate::error::Result<Self> {
        if file.exists() {
            fs::read(&file)
                .await
                .map_err(|err| {
                    crate::error::CoreErrors::FSError(format!(
                        "Error reading settings file: {err}"
                    ))
                    .as_error()
                })
                .and_then(|it| {
                    serde_json::from_slice::<Settings>(&it)
                        .map_err(crate::error::Error::from)
                })
        } else {
            Ok(Settings::default())
        }
    }

    #[tracing::instrument(skip(self))]
    pub async fn sync(&self, to: &Path) -> crate::error::Result<()> {
        fs::write(to, serde_json::to_vec_pretty(self)?)
            .await
            .map_err(|err| {
                crate::error::CoreErrors::FSError(format!(
                    "Error saving settings to file: {err}"
                ))
                .as_error()
            })
    }
}

/// Minecraft memory settings
#[derive(Serialize, Deserialize, Debug, Clone, Copy)]
pub struct MemorySettings {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub minimum: Option<u32>,
    pub maximum: u32,
}

impl Default for MemorySettings {
    fn default() -> Self {
        Self {
            minimum: None,
            maximum: 2048,
        }
    }
}

/// Game window size
#[derive(Serialize, Deserialize, Debug, Clone, Copy)]
pub struct WindowSize(pub u16, pub u16);

impl Default for WindowSize {
    fn default() -> Self {
        Self(854, 480)
    }
}

/// Game initialization hooks
#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(default)]
pub struct Hooks {
    #[serde(skip_serializing_if = "HashSet::is_empty")]
    pub pre_launch: HashSet<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub wrapper: Option<String>,
    #[serde(skip_serializing_if = "HashSet::is_empty")]
    pub post_exit: HashSet<String>,
}

impl Default for Hooks {
    fn default() -> Self {
        Self {
            pre_launch: HashSet::<String>::new(),
            wrapper: None,
            post_exit: HashSet::<String>::new(),
        }
    }
}
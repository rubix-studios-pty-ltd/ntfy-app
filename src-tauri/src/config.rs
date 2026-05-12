use serde::{ Deserialize, Serialize };
use std::fs;
use std::path::PathBuf;
use tauri::Manager;

const CONFIG_FILE: &str = "ntfy-config.json";

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppConfig {
  pub instance_url: Option<String>,
}

fn get_config_path(app_handle: &tauri::AppHandle) -> PathBuf {
  app_handle.path().app_config_dir().expect("Failed to get app config directory").join(CONFIG_FILE)
}

pub fn load_config(app_handle: &tauri::AppHandle) -> AppConfig {
  let config_path = get_config_path(app_handle);

  if !config_path.exists() {
    return AppConfig {
      instance_url: None,
    };
  }

  match fs::read_to_string(&config_path) {
    Ok(content) =>
      serde_json::from_str::<AppConfig>(&content).unwrap_or(AppConfig { instance_url: None }),
    Err(_) => AppConfig { instance_url: None },
  }
}

pub fn save_config(app_handle: &tauri::AppHandle, config: &AppConfig) -> Result<(), String> {
  let config_path = get_config_path(app_handle);

  if let Some(parent) = config_path.parent() {
    fs::create_dir_all(parent).map_err(|e| e.to_string())?;
  }

  let json = serde_json::to_string_pretty(config).map_err(|e| e.to_string())?;

  fs::write(&config_path, json).map_err(|e| e.to_string())
}

pub fn clear_instance_url(app_handle: &tauri::AppHandle) -> Result<(), String> {
  let mut config = load_config(app_handle);
  config.instance_url = None;
  save_config(app_handle, &config)
}

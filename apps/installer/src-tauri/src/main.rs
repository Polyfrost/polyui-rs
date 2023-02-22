#![cfg_attr(
	all(not(debug_assertions), target_os = "windows"),
	windows_subsystem = "windows"
)]

use std::{error::Error, path::PathBuf, sync::Arc, time::Duration};

use polyui_core::Node;

use tauri::{api::path, async_runtime::block_on, Manager, RunEvent};
use tokio::{task::block_in_place, time::sleep};
use tracing::{debug, error};

mod menu;

#[tauri::command(async)]
async fn app_ready(app_handle: tauri::AppHandle) {
	let window = app_handle.get_window("main").unwrap();

	window.show().unwrap();
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn Error>> {
    let data_dir = path::data_dir()
		.unwrap_or_else(|| PathBuf::from("./"))
		.join("oneinstaller");

    #[cfg(debug_assertions)]
	let data_dir = data_dir.join("dev");

	let (node, router) = Node::new(data_dir).await?;

	let app = tauri::Builder::default().plugin(rspc::integrations::tauri::plugin(router, {
		let node = Arc::clone(&node);
		move || node.get_request_context()
	}));

    
}
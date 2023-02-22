use std::{
	sync::Arc,
	time::{Duration, Instant},
};

use crate::{
	job::JobManager,
	library::LibraryManager,
	node::{NodeConfig, NodeConfigManager},
};
use rspc::{Config, Type};
use serde::{Deserialize, Serialize};
use tokio::sync::broadcast;

use utils::{InvalidRequests, InvalidateOperationEvent};

pub type Router = rspc::Router<Ctx>;
pub(crate) type RouterBuilder = rspc::RouterBuilder<Ctx>;

#[derive(Debug, Clone, Serialize, Type)]
pub enum CoreEvent {
	InvalidateOperation(InvalidateOperationEvent),
	InvalidateOperationDebounced(InvalidateOperationEvent),
}

pub struct Ctx {
	pub library_manager: Arc<LibraryManager>,
	pub config: Arc<NodeConfigManager>,
	pub jobs: Arc<JobManager>,
	pub event_bus: broadcast::Sender<CoreEvent>,
}

mod instance;
mod java;
mod jobs;
mod launcher;
mod libraries;
mod microsoft;
mod minecraft;
mod mod_sync;
mod mod_extraction;
pub mod utils;

pub mod data {
	pub use crate::state::{
		DirectoryInfo, Hooks, JavaSettings, MemorySettings, ModLoader,
        ProfileMetadata, Settings, WindowSize,
	};
}

pub mod prelude {
	pub use crate::{
		entities::launcher::msapi::{self, Credentials},
		api::data::*,
		state::Profile,
		state::State,
		helpers::*,
	};
}

#[derive(Serialize, Deserialize, Debug, Type)]
struct NodeState {
	#[serde(flatten)]
	config: NodeConfig,
	data_path: String,
}

pub(crate) fn mount() -> Arc<Router> {
	let config = Config::new().set_ts_bindings_header("/* eslint-disable */");

	#[cfg(all(debug_assertions, not(feature = "mobile")))]
	let config = config.export_ts_bindings(
		std::path::PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("../packages/client/src/core.ts"),
	);

	let r = <Router>::new()
		.config(config)
		.query("buildInfo", |t| {
			#[derive(Serialize, Type)]
			pub struct BuildInfo {
				version: &'static str,
				commit: &'static str,
			}

			t(|_, _: ()| BuildInfo {
				version: env!("CARGO_PKG_VERSION"),
				commit: env!("GIT_HASH"),
			})
		})
		.query("nodeState", |t| {
			t(|ctx, _: ()| async move {
				Ok(NodeState {
					config: ctx.config.get().await,
					data_path: ctx.config.data_directory().to_string_lossy().into_owned(),
				})
			})
		})
		.merge("library.", libraries::mount())
		.merge("jobs.", jobs::mount())
		.merge("instance.", instance::mount())
		.merge("minecraft.", minecraft::mount())
		.merge("java.", java::mount())
		.merge("launcher.", launcher::mount())
		.merge("microsoft.", microsoft::mount())
		.subscription("invalidateQuery", |t| {
			t(|ctx, _: ()| {
				let mut event_bus_rx = ctx.event_bus.subscribe();
				let mut last = Instant::now();
				async_stream::stream! {
					while let Ok(event) = event_bus_rx.recv().await {
						match event {
							CoreEvent::InvalidateOperation(op) => yield op,
							CoreEvent::InvalidateOperationDebounced(op) => {
								let current = Instant::now();
								if current.duration_since(last) > Duration::from_millis(1000 / 60) {
									last = current;
									yield op;
								}
							},
							_ => {}
						}
					}
				}
			})
		})
		.build()
		.arced();
	InvalidRequests::validate(r.clone()); // This validates all invalidation calls.

	r
}

#[cfg(test)]
mod tests {
	#[test]
	fn test_and_export_rspc_bindings() {
		super::mount();
	}
}

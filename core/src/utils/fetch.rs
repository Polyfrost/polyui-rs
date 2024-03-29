//! Functions for fetching infromation from the Internet
use crate::config::REQWEST_CLIENT;
use futures::prelude::*;
use std::{collections::LinkedList, convert::TryInto, path::{Path, PathBuf}, sync::Arc, io::copy};
use tokio::{
    fs::{self, File},
    io::AsyncWriteExt,
    sync::{Semaphore, SemaphorePermit},
};
use tempfile::Builder;

const FETCH_ATTEMPTS: usize = 3;

#[tracing::instrument(skip(_permit))]
pub async fn fetch<'a>(
    url: &str,
    sha1: Option<&str>,
    _permit: &SemaphorePermit<'a>,
) -> crate::error::Result<bytes::Bytes> {
    let mut attempts = LinkedList::new();
    for _ in 0..FETCH_ATTEMPTS {
        attempts.push_back(
            async {
                let content = REQWEST_CLIENT.get(url).send().await?;
                let bytes = content.bytes().await?;

                if let Some(hash) = sha1 {
                    let actual_hash = sha1_async(bytes.clone()).await;
                    if actual_hash != hash {
                        return Err(crate::error::CoreErrors::HashError(
                            actual_hash,
                            String::from(hash),
                        )
                        .into());
                    }
                }

                Ok(bytes)
            }
            .boxed(),
        )
    }

    log::debug!("Done downloading URL {url}");
    future::select_ok(attempts).map_ok(|it| it.0).await
}

#[allow(dead_code)]
#[tracing::instrument(skip(sem))]
pub async fn fetch_mirrors(
    urls: &[&str],
    sha1: Option<&str>,
    permits: u32,
    sem: &Semaphore,
) -> crate::error::Result<bytes::Bytes> {
    let _permits = sem.acquire_many(permits).await.unwrap();
    let sem = Arc::new(Semaphore::new(permits.try_into().unwrap()));

    future::select_ok(urls.into_iter().map(|url| {
        let sha1 = sha1.map(String::from);
        let url = String::from(*url);
        let sem = Arc::clone(&sem);

        tokio::spawn(async move {
            let permit = sem.acquire().await.unwrap();
            fetch(&url, sha1.as_deref(), &permit).await
        })
        .map(Result::unwrap)
        .boxed()
    }))
    .await
    .map(|it| it.0)
}

#[tracing::instrument(skip(bytes, _permit))]
pub async fn write<'a>(
    path: &Path,
    bytes: &[u8],
    _permit: &SemaphorePermit<'a>,
) -> crate::error::Result<()> {
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).await?;
    }

    let mut file = fs::File::create(path).await?;
    log::debug!("Done writing file {}", path.display());
    file.write_all(bytes).await?;
    Ok(())
}

pub async fn sha1_async(bytes: bytes::Bytes) -> String {
    tokio::task::spawn_blocking(move || sha1::Sha1::from(bytes).hexdigest())
        .await
        .unwrap()
}

#[tracing::instrument]
pub async fn download_file(file_url: &String) -> crate::error::Result<String> {
    let tmp_dir = Builder::new().prefix("temp").tempdir()?;
    let response = reqwest::get(file_url).await?;

    let f_path: PathBuf;

    let mut dest = {
        let fname = response
            .url()
            .path_segments()
            .and_then(|segments| segments.last())
            .and_then(|name| if name.is_empty() { None } else { Some(name) })
            .unwrap_or("tmp.bin");

        f_path = tmp_dir.path().join(fname);
        std::fs::File::create(fname)?
    };
    let content =  response.text().await?;
    copy(&mut content.as_bytes(), &mut dest)?;
    Ok(String::from(f_path.to_str().expect("No path found!")))
}
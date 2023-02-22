use std::path::Path;
use std::io::BufReader;
use std::time::SystemTime;
use std::fs::File;
use serde_json::Value;
use zip::ZipArchive;

use crate::entities::model::mod_type::JARLoadedMod;
use crate::utils::fetch::sha1_async;
use crate::error::Error;

/// Extract meta-data from JAR file.
#[tracing::instrument]
pub async fn extract_info_from_jar(file_path: String) -> crate::error::Result<JARLoadedMod> {
    let path = Path::new(&file_path);

    let jar_buf = std::fs::read(path).expect("Failed to read JAR");
    let jar_bytes = bytes::Bytes::from(jar_buf);
    let jar_hash = sha1_async(jar_bytes).await;

    let json_metadata = &read_config_from_jar(path).expect("Failed to extract JSON from JAR");

    let mod_name = json_metadata["name"].as_str().map(String::from);
    let mod_description = json_metadata["description"].as_str().map(String::from);
    let timestamp_added = get_file_datetime(path);

    Ok(JARLoadedMod {
        file_hash: jar_hash,
        absolute_path: file_path,
        timestamp_added: timestamp_added,
        mod_name: mod_name,
        description: mod_description,
    })
}

// Get timestamp of the file being modified.
fn get_file_datetime(file_path: &Path) -> Option<SystemTime> {
    std::fs::metadata(file_path).ok().map(|metadata| metadata.modified())?.ok()
}

// Loader agnostic extraction.
fn read_config_from_jar(jar_file: &Path) -> Result<Value, String> {
    let entries = std::fs::read_dir(jar_file).map_err(|e| e.to_string())?;
    for entry in entries {
        let entry = entry.map_err(|e| e.to_string())?;
        // skip nested directories
        if !entry.file_name().to_str().unwrap().contains("/") {
            let file = File::open(entry.path()).map_err(|e| e.to_string())?;
            let mut archive = ZipArchive::new(BufReader::new(file)).map_err(|e| e.to_string())?;
            for i in 0..archive.len() {
                let file = archive.by_index(i).map_err(|e| e.to_string())?;
                let file_name = file.name();
                if file_name.ends_with(".json") {
                    let content: Value = serde_json::from_reader(file).expect("JSON was not well-formed");
                    return Ok(content);
                }
                if file_name.ends_with(".toml") {
                    let data = std::fs::read_to_string(file_name).expect("Could not read file");
                    let value: toml::Value = toml::from_str(&data).expect("TOML was not well-formed");
                    return Ok(serde_json::to_value(value).expect("Could not serialize value as JSON"));
                }
            }
        }
    }
    return Err("No JSON files found!".to_string());
}

// TODO: make it actually work

#[cfg(test)]
mod tests {
    use super::*;
    use pretty_assertions::assert_str_eq;

    //#[tokio::test]
    async fn mod_extraction_test() -> Result<(), Error> {
        // todo: rewrite above methods to be mock-friendly by passing file as param
        let fabric_mod_path = String::from("/REPLACE/WITH/PATH/TO/FABRIC_JAR");

        let jar_loaded_mod = extract_info_from_jar(fabric_mod_path).await?;
        assert_str_eq!(jar_loaded_mod.mod_name.unwrap(), "Fabric API");
        Ok(())
    }
}
use std::fs;
use std::path::PathBuf;

fn get_data_path() -> PathBuf {
    let mut path = dirs::data_local_dir().unwrap_or_else(|| PathBuf::from("."));
    path.push("BudgetMaster");
    fs::create_dir_all(&path).ok();
    path.push("budget-data.json");
    path
}

#[tauri::command]
fn save_budget_data(data: String) -> Result<(), String> {
    let path = get_data_path();
    fs::write(&path, data).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
fn load_budget_data() -> Result<String, String> {
    let path = get_data_path();
    if path.exists() {
        fs::read_to_string(&path).map_err(|e| e.to_string())
    } else {
        Ok(String::from("null"))
    }
}

#[tauri::command]
fn get_data_file_path() -> String {
    get_data_path().to_string_lossy().to_string()
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            save_budget_data,
            load_budget_data,
            get_data_file_path
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

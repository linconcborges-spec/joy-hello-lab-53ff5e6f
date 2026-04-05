// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::process::Command;

#[tauri::command]
fn get_printers() -> Vec<String> {
    #[cfg(target_os = "windows")]
    {
        // Executes a Powershell command to list all installed printers in Windows
        let output = Command::new("powershell")
            .args(&["-Command", "(Get-Printer).Name"])
            .output();

        if let Ok(output) = output {
            let stdout = String::from_utf8_lossy(&output.stdout);
            let mut printers = Vec::new();
            for line in stdout.lines() {
                let p = line.trim();
                if !p.is_empty() {
                    printers.push(p.to_string());
                }
            }
            return printers;
        }
        return vec![];
    }
    
    #[cfg(not(target_os = "windows"))]
    {
        vec![]
    }
}

fn main() {
  tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![get_printers])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}

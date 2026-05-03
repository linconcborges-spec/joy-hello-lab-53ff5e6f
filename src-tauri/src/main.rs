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

#[tauri::command]
fn silent_print(printer_name: String, content: String) -> Result<String, String> {
    #[cfg(target_os = "windows")]
    {
        use std::io::Write;
        let mut temp_file = std::env::temp_dir();
        temp_file.push("print_temp.txt");
        
        // Salva o conteúdo em um arquivo temporário
        let mut file = std::fs::File::create(&temp_file).map_err(|e| e.to_string())?;
        file.write_all(content.as_bytes()).map_err(|e| e.to_string())?;

        // Comando PowerShell para imprimir silenciosamente
        // Get-Content lê o arquivo e Out-Printer envia para a impressora especificada
        let status = Command::new("powershell")
            .args(&[
                "-Command",
                &format!("Get-Content -Path '{}' | Out-Printer -Name '{}'", temp_file.display(), printer_name)
            ])
            .output()
            .map_err(|e| e.to_string())?;

        if status.status.success() {
            Ok("Impressão enviada com sucesso".to_string())
        } else {
            Err(String::from_utf8_lossy(&status.stderr).to_string())
        }
    }

    #[cfg(not(target_os = "windows"))]
    {
        Err("Impressão silenciosa suportada apenas no Windows".to_string())
    }
}

fn main() {
  tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![get_printers, silent_print])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}

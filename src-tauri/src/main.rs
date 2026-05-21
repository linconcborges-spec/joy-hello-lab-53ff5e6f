// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::process::Command;

#[tauri::command]
fn get_printers() -> Vec<String> {
    #[cfg(target_os = "windows")]
    {
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

        let mut file = std::fs::File::create(&temp_file).map_err(|e| e.to_string())?;
        file.write_all(b"\xEF\xBB\xBF").map_err(|e| e.to_string())?;
        file.write_all(content.as_bytes()).map_err(|e| e.to_string())?;

        let ps_command = if printer_name.is_empty() {
            format!("Get-Content -Path '{}' | Out-Printer", temp_file.display())
        } else {
            format!(
                "Get-Content -Path '{}' | Out-Printer -Name '{}'",
                temp_file.display(),
                printer_name
            )
        };

        let status = Command::new("powershell")
            .args(&["-WindowStyle", "Hidden", "-Command", &ps_command])
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

// ─── ESC/POS RAW PRINTING ────────────────────────────────────────────────────

#[cfg(target_os = "windows")]
fn raw_send_to_printer(printer_name: &str, data: &[u8]) -> Result<(), String> {
    use std::ffi::CString;
    use std::ptr;
    use winapi::um::winspool::{
        ClosePrinter, EndDocPrinter, EndPagePrinter, OpenPrinterA, StartDocPrinterA,
        StartPagePrinter, WritePrinter, DOC_INFO_1A,
    };

    let resolved_name = if printer_name.is_empty() {
        get_default_printer_name().ok_or("Nenhuma impressora padrão encontrada")?
    } else {
        printer_name.to_string()
    };

    let p_name = CString::new(resolved_name.as_str()).map_err(|e| e.to_string())?;
    let p_datatype = CString::new("RAW").map_err(|e| e.to_string())?;
    let p_docname = CString::new("Pedido").map_err(|e| e.to_string())?;

    unsafe {
        let mut h_printer = ptr::null_mut();
        if OpenPrinterA(p_name.as_ptr() as *mut i8, &mut h_printer, ptr::null_mut()) == 0 {
            return Err(format!("Impressora não encontrada: {}", resolved_name));
        }

        let mut doc_info = DOC_INFO_1A {
            pDocName: p_docname.as_ptr() as *mut i8,
            pOutputFile: ptr::null_mut(),
            pDatatype: p_datatype.as_ptr() as *mut i8,
        };

        if StartDocPrinterA(h_printer, 1, &mut doc_info as *mut _ as *mut u8) == 0 {
            ClosePrinter(h_printer);
            return Err("Falha ao iniciar documento de impressão".to_string());
        }

        StartPagePrinter(h_printer);

        let mut bytes_written: u32 = 0;
        WritePrinter(
            h_printer,
            data.as_ptr() as *mut _,
            data.len() as u32,
            &mut bytes_written,
        );

        EndPagePrinter(h_printer);
        EndDocPrinter(h_printer);
        ClosePrinter(h_printer);
    }

    Ok(())
}

#[cfg(target_os = "windows")]
fn get_default_printer_name() -> Option<String> {
    use winapi::um::winspool::GetDefaultPrinterA;
    let mut buf = vec![0i8; 512];
    let mut size = 512u32;
    unsafe {
        if GetDefaultPrinterA(buf.as_mut_ptr(), &mut size) != 0 {
            let s = std::ffi::CStr::from_ptr(buf.as_ptr())
                .to_string_lossy()
                .into_owned();
            Some(s)
        } else {
            None
        }
    }
}

/// Normaliza caracteres especiais do português para CP850/ASCII
/// (impressoras térmicas ESC/POS geralmente não suportam UTF-8 completo)
#[cfg(target_os = "windows")]
fn normalize_pt(text: &str) -> String {
    text.chars()
        .map(|c| match c {
            'Ã' | 'Â' | 'À' | 'Á' => 'A',
            'ã' | 'â' | 'à' | 'á' => 'a',
            'É' | 'Ê' | 'È' => 'E',
            'é' | 'ê' | 'è' => 'e',
            'Í' | 'Î' | 'Ì' => 'I',
            'í' | 'î' | 'ì' => 'i',
            'Ó' | 'Õ' | 'Ô' | 'Ò' => 'O',
            'ó' | 'õ' | 'ô' | 'ò' => 'o',
            'Ú' | 'Û' | 'Ù' => 'U',
            'ú' | 'û' | 'ù' => 'u',
            'Ç' => 'C',
            'ç' => 'c',
            'Ñ' => 'N',
            'ñ' => 'n',
            c => c,
        })
        .collect()
}

/// Gera bytes ESC/POS com conteúdo de texto + QR code ao final
#[cfg(target_os = "windows")]
fn build_escpos(content: &str, qr_url: &str) -> Vec<u8> {
    let mut buf: Vec<u8> = Vec::new();

    // ESC @ — inicializa impressora
    buf.extend_from_slice(b"\x1b\x40");

    // Imprime o texto normalizado linha a linha
    let normalized = normalize_pt(content);
    buf.extend_from_slice(normalized.as_bytes());

    // Separador antes do QR
    buf.extend_from_slice(b"\n");

    if !qr_url.is_empty() {
        // Centraliza
        buf.extend_from_slice(b"\x1b\x61\x01");

        // Cabeçalho do QR
        buf.extend_from_slice(b"CONFIRMAR SAIDA P/ ENTREGA:\n\n");

        // GS ( k — QR Code Model 2
        buf.extend_from_slice(b"\x1d\x28\x6b\x04\x00\x31\x41\x32\x00");

        // GS ( k — tamanho do módulo (4 = ~6mm, bom para leitura)
        buf.extend_from_slice(b"\x1d\x28\x6b\x03\x00\x31\x43\x04");

        // GS ( k — nível de correção M
        buf.extend_from_slice(b"\x1d\x28\x6b\x03\x00\x31\x45\x31");

        // GS ( k — armazena dados (pL pH cn fn m data...)
        let data = qr_url.as_bytes();
        let data_len = data.len() + 3; // +3 para cn fn m
        let pl = (data_len & 0xFF) as u8;
        let ph = ((data_len >> 8) & 0xFF) as u8;
        buf.extend_from_slice(&[0x1d, 0x28, 0x6b, pl, ph, 0x31, 0x50, 0x30]);
        buf.extend_from_slice(data);

        // GS ( k — imprime QR
        buf.extend_from_slice(b"\x1d\x28\x6b\x03\x00\x31\x51\x30");

        buf.extend_from_slice(b"\n");

        // Volta para alinhamento esquerda
        buf.extend_from_slice(b"\x1b\x61\x00");
    }

    // Avança papel e corta (GS V A 5)
    buf.extend_from_slice(b"\n\n\n\n");
    buf.extend_from_slice(b"\x1d\x56\x41\x05");

    buf
}

/// Impressão ESC/POS direta para Bematech / térmicas compatíveis.
/// Inclui QR code ao final da comanda.
#[tauri::command]
fn escpos_print(
    printer_name: String,
    content: String,
    qr_url: String,
) -> Result<String, String> {
    #[cfg(target_os = "windows")]
    {
        let bytes = build_escpos(&content, &qr_url);
        raw_send_to_printer(&printer_name, &bytes)?;
        Ok("ESC/POS enviado com sucesso".to_string())
    }

    #[cfg(not(target_os = "windows"))]
    {
        Err("ESC/POS suportado apenas no Windows".to_string())
    }
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            get_printers,
            silent_print,
            escpos_print
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

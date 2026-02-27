use aes_gcm::aead::{Aead, KeyInit};
use aes_gcm::{Aes256Gcm, Nonce};
use base64::{engine::general_purpose, Engine as _};
use rand::RngCore;
use wasm_bindgen::prelude::*;

static mut KEY: Option<[u8; 32]> = None;

#[wasm_bindgen(start)]
pub fn init() {
    console_error_panic_hook::set_once();
}

#[wasm_bindgen]
pub fn init_key(key_bytes: Vec<u8>) -> Result<(), JsValue> {
    if key_bytes.len() != 32 {
        return Err(JsValue::from_str("Key must be 32 bytes"));
    }

    let mut key = [0u8; 32];
    key.copy_from_slice(&key_bytes);

    unsafe {
        KEY = Some(key);
    }

    Ok(())
}

fn get_cipher() -> Result<Aes256Gcm, JsValue> {
    unsafe {
        match KEY {
            Some(key) => {
                Aes256Gcm::new_from_slice(&key)
                    .map_err(|e| JsValue::from_str(&format!("{:?}", e)))
            }
            None => Err(JsValue::from_str("Encryption key not initialized")),
        }
    }
}

#[wasm_bindgen]
pub fn encrypt(plain_text: String) -> Result<String, JsValue> {
    let cipher = get_cipher()?;

    // 12-byte nonce required for AES-GCM
    let mut nonce_bytes = [0u8; 12];
    rand::thread_rng().fill_bytes(&mut nonce_bytes);

    let nonce = Nonce::from_slice(&nonce_bytes);

    let ciphertext = cipher
        .encrypt(nonce, plain_text.as_bytes())
        .map_err(|e| JsValue::from_str(&format!("{:?}", e)))?;

    // Store nonce + ciphertext together
    let mut combined = nonce_bytes.to_vec();
    combined.extend(ciphertext);

    Ok(general_purpose::STANDARD.encode(combined))
}

#[wasm_bindgen]
pub fn decrypt(encoded: String) -> Result<String, JsValue> {
    let cipher = get_cipher()?;

    let data = general_purpose::STANDARD
        .decode(encoded)
        .map_err(|e| JsValue::from_str(&format!("{:?}", e)))?;

    if data.len() < 12 {
        return Err(JsValue::from_str("Invalid encrypted data"));
    }

    let (nonce_bytes, ciphertext) = data.split_at(12);

    let nonce = Nonce::from_slice(nonce_bytes);

    let decrypted = cipher
        .decrypt(nonce, ciphertext)
        .map_err(|e| JsValue::from_str(&format!("{:?}", e)))?;

    String::from_utf8(decrypted)
        .map_err(|e| JsValue::from_str(&format!("{:?}", e)))
}
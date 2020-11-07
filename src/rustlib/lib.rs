extern crate wasm_bindgen;
use wasm_bindgen::prelude::*;

static DEBUG: bool = false;

#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = console)]
    fn log(a: &str);

    #[wasm_bindgen(js_namespace = console)]
    fn error(a: &str);

    #[wasm_bindgen(js_namespace = console)]
    fn warn(a: &str);

    #[wasm_bindgen(js_namespace = console)]
    fn debug(a: &str);
}

// cfg_if! {
// if #[cfg(feature = "wee_alloc")] {
// #[global_allocator]
// static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;
// }
// }

macro_rules! cout {
    ($($t:tt)*) => (log(&format_args!($($t)*).to_string()))
}

macro_rules! cerr {
    ($($t:tt)*) => (error(&format_args!($($t)*).to_string()))
}

macro_rules! cwarn {
    ($($t:tt)*) => (warn(&format_args!($($t)*).to_string()))
}

macro_rules! cdbg {
    ($($t:tt)*) => (
		if DEBUG {
			debug(&format_args!($($t)*).to_string())
		}
	)
}

#[wasm_bindgen(js_name = usernameToHash)]
pub fn username_to_hash(_name: String) -> u64 {
    if _name.len() > 12 {
        cerr!(
            "[WASM] Problem encoding base37 username: provided username ({}) was invalid",
            _name
        );
        return 0 as u64;
    }
    let mut hash = 0 as u64;

    for ch in _name.to_lowercase().as_bytes().iter() {
        let codepoint = *ch as u64;
        hash *= 37;
        if codepoint >= ('a' as u64) && codepoint <= ('z' as u64) {
            hash += 1 + codepoint - 97;
        } else if codepoint >= ('0' as u64) && codepoint <= ('9' as u64) {
            hash += 27 + codepoint - 48;
            cdbg!("[WASM] next codepoint:{}", codepoint);
        }
        cdbg!("[WASM] hash step:{}", hash);
    }

    cdbg!("[WASM] hash:{}", hash);

    hash
}

#[wasm_bindgen(js_name = hashToUsername)]
pub fn hash_to_username(mut _hash: u64) -> String {
    if _hash <= 0 {
        cerr!(
            "[WASM] Problem decoding base37 encoded username: provided hash ({}) was invalid",
            _hash
        );
        return "null".to_string();
    }
    let mut _username = String::with_capacity(12);
    cdbg!("[WASM] Decoding:{}", _hash);
    while _hash > 0 && _username.len() <= 12 {
        cdbg!(
            "[WASM] intermediate hash:{}, intermediate result:{}",
            _hash,
            _username
        );
        let codepoint = (_hash % 37) as u8;
        _hash /= 37;
        if codepoint == 0 {
            _username.push(' ');
        }
        if codepoint < 27 {
            if _hash % 37 == 0 {
                cdbg!(
                    "[WASM] remainder:{}, next codepoint:{}",
                    codepoint,
                    (codepoint + ('A' as u8)) - 1
                );
                _username.push(char::from(codepoint + ('A' as u8) - 1));
            } else {
                cdbg!(
                    "[WASM] remainder:{}, next codepoint:{}",
                    codepoint,
                    (codepoint + ('a' as u8)) - 1
                );
                _username.push(char::from(codepoint + ('a' as u8) - 1));
            }
        } else {
            cdbg!(
                "[WASM] remainder:{}, next codepoint:{}",
                codepoint,
                (codepoint + ('0' as u8)) - 1
            );
            _username.push(char::from(codepoint + ('0' as u8) - 27));
        }
    }
    cdbg!("[WASM] result:{}, hash:{}", _username, _hash);
    _username.chars().rev().collect::<String>()
}

#[wasm_bindgen(js_name = hashRecoveryAnswer)]
pub fn hash_recovery_answer(_answer: String) -> u64 {
    let mut hash = 0 as u64;

    let mut idx = 0 as u64;
    for ch in _answer.to_ascii_lowercase().as_bytes().iter() {
        let codepoint = *ch as u64;

        if codepoint >= ('a' as u64) && codepoint <= ('z' as u64)
            || codepoint >= ('0' as u64) && codepoint <= ('9' as u64)
        {
            hash = hash * 47 * (hash - (codepoint * 6) - (idx * 7));
            hash += codepoint - 32 + idx * codepoint;
            idx += 1;
        }
        //		idx++
    }

    hash
}

#[wasm_bindgen(js_name = hashFileName)]
pub fn hash_file_name(_file: String) -> i32 {
    let mut hash = 0 as i32;
    for ch in _file.to_ascii_uppercase().as_bytes().iter() {
        hash = (hash * 61 + (*ch as i32)) - 32;
    }
    hash
}

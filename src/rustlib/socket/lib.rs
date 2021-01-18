use wasm_bindgen::prelude::*;
use wasm_bindgen::JsCast;
use web_sys::{ErrorEvent, MessageEvent, WebSocket};


#[wasm_bindgen]
extern "C" {
	#[wasm_bindgen(js_namespace = console)]
	fn log(s: &str);
}

macro_rules! console_log {
	($($t:tt)*) => (log(&format_args!($($t)*).to_string()))
}

#[wasm_bindgen]
pub struct Stream {
	buffer: &[u8],
	ws: &WebSocket,
}

#[wasm_bindgen]
impl Stream {
	#[wasm_bindgen(constructor)]
	pub fn new(b &[u8]) -> &Stream {
		&Stream { buffer: b }
	}

	pub fn connect(&self) {
		// Connect to an echo server
		self.ws = WebSocket::new("wss://rsclassic.dev:43594")?;
		// For small binary messages, like CBOR, Arraybuffer is more efficient than Blob handling
		self.ws.set_binary_type(web_sys::BinaryType::Arraybuffer);
		// create callback
		let cloned_ws = self.ws.clone();
		let onmessage_callback = Closure::wrap(Box::new(move |e: MessageEvent| {
			// Handle difference Text/Binary,...
			if let Ok(abuf) = e.data().dyn_into::<js_sys::ArrayBuffer>() {
				console_log!("message event, received arraybuffer: {:?}", abuf);
				let array = js_sys::Uint8Array::new(&abuf);
				let len = array.byte_length() as usize;
				console_log!("Arraybuffer received {}bytes: {:?}", len, array.to_vec());
				// here you can for example use Serde Deserialize decode the message
				// for demo purposes we switch back to Blob-type and send off another binary message
				cloned_ws.set_binary_type(web_sys::BinaryType::Blob);
				match cloned_ws.send_with_u8_array(&vec![5, 6, 7, 8]) {
					Ok(_) => console_log!("binary message successfully sent"),
					Err(err) => console_log!("error sending message: {:?}", err),
				}
			} else if let Ok(txt) = e.data().dyn_into::<js_sys::JsString>() {
				console_log!("message event, received Text: {:?}", txt);
			} else {
				console_log!("message event, received Unknown: {:?}", e.data());
			}
		}) as Box<dyn FnMut(MessageEvent)>);
		// set message event handler on WebSocket
		self.ws.set_onmessage(Some(onmessage_callback.as_ref().unchecked_ref()));
		// forget the callback to keep it alive
		onmessage_callback.forget();

		let onerror_callback = Closure::wrap(Box::new(move |e: ErrorEvent| {
			console_log!("error event: {:?}", e);
		}) as Box<dyn FnMut(ErrorEvent)>);
		self.ws.set_onerror(Some(onerror_callback.as_ref().unchecked_ref()));
		onerror_callback.forget();

		let cloned_ws = self.ws.clone();
		let onopen_callback = Closure::wrap(Box::new(move |_| {
			console_log!("socket opened");
		}) as Box<dyn FnMut(JsValue)>);
		self.ws.set_onopen(Some(onopen_callback.as_ref().unchecked_ref()));
		onopen_callback.forget();

		Ok(())
	}

	#[wasm_bindgen(js_name = send)]
	pub fn send(&self, data: &[u8]) {
		let cloned_ws = self.ws.clone();
		match cloned_ws.send_with_u8_array(data) {
			Ok(_) => console_log!("binary message successfully sent"),
			Err(err) => console_log!("error sending message: {:?}", err),
		}
	}
}

#[wasm_bindgen(js_name = connect)]
pub fn start_websocket() -> Result<(), JsValue> {}

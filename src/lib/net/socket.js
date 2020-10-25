class Socket {
	constructor(host, port) {
		this.host = host;
		this.port = port;

		this.client = null;
		this.connected = false;

		// amount of bytes are left to read since last read call (in total)
		this.bytesAvailable = 0;
		// the message buffers that arrive from the websocket
		this.bufferList = [];
		// the current buffer we're reading
		this.buffer = null;
		// amount of bytes we read in current buffer
		this.bufferOffset = 0;
		// amount of bytes left in current buffer
		this.bufferRemains = 0;
		// this.connect();
	}


	connect() {
		return new Promise((resolve, reject) => {
			this.client = new WebSocket(`${this.host}:${this.port}`, 'binary');
			this.client.binaryType = 'arraybuffer';

			let open, error, onPacket, onClose;
			onClose = () => {
				this.client.removeEventListener('close', onClose);
				this.client.removeEventListener('error', error);
				if (this.connected)
					this.client.removeEventListener('message', onPacket);
				else
					this.client.removeEventListener('open', open);
				this.connected = false;
				this.clear();
			};
			onPacket = (msg) => {
				this.bufferList.push(new Uint8Array(msg.data));
				this.bytesAvailable += msg.data.byteLength;
				this.refreshCurrentBuffer();
			};
			error = (err) => {
				this.client.removeEventListener('error', error);
				// this.client.removeEventListener('open', open);
				if (this.connected)
					this.client.removeEventListener('message', onPacket);
				else
					this.client.removeEventListener('open', open);
				this.client.removeEventListener('close', onClose);
				// this.client.removeEventListener('message', onPacket);
				this.connected = false;
				this.clear();
				reject(err);
			};
			open = () => {
				this.connected = true;
				this.client.removeEventListener('open', open);
				this.client.addEventListener('message', onPacket);
				resolve();
			};
			this.client.addEventListener('close', onClose);
			this.client.addEventListener("error", error);
			this.client.addEventListener("open", open);
		});
	}

	write(bytes, off = 0, len = bytes.length) {
		// if (!this.connected) {
			// this.close();
			// return;
		// }
		if (!this.connected) throw new Error('attempting to write to closed socket');

		this.client.send(bytes.slice(off, off + len));
	}

	refreshCurrentBuffer() {
		if (this.bufferList.length > 0 && !this.buffer || (this.bufferRemains === 0 && this.available() > 0)) {
			this.bufferOffset = 0;

			this.buffer = this.bufferList.shift();
			if (this.buffer && this.buffer.length) {
				this.bufferRemains = this.buffer.length;
			} else {
				this.bufferRemains = 0;
			}
		}
	}

	// read the first byte available in the buffer, or wait for one to be sent
	// if none are available.
	async readByte() {
		if (!this.connected)
			return -1;

		if (this.available() > 0 && this.bufferRemains > 0 && this.buffer) {
			this.bufferRemains--;
			this.bytesAvailable--;

			return this.buffer[this.bufferOffset++] & 0xFF;
		}

		return new Promise((resolve, reject) => {
			let onClose, onError, onNextMessage;
			onClose = () => {
				this.client.removeEventListener('error', onError);
				this.client.removeEventListener('message', onNextMessage);
				this.client.removeEventListener('close', onClose);
				resolve(-1);
			};
			onError = err => {
				this.client.removeEventListener('error', onError);
				this.client.removeEventListener('message', onNextMessage);
				this.client.removeEventListener('close', onClose);
				reject(err);
			};
			onNextMessage = async () => {
				this.client.removeEventListener('error', onError);
				this.client.removeEventListener('message', onNextMessage);
				this.client.removeEventListener('close', onClose);
				resolve(await this.readByte());
			};

			this.client.addEventListener('error', onError);
			this.client.addEventListener('close', onClose);
			this.client.addEventListener('message', onNextMessage);
		});
	}

	// read multiple bytes (specified by `len`) and put them into the `dst`
	// array at specified `off` (0 by default).
	async readBytes(dst, off = 0, len = dst.length) {
		if (!this.connected)
			return -1;

		if (this.available() >= len && this.bufferRemains >= len && this.buffer) {
			// We have enough data for this request
			for (let i = 0; i < len; i++) {
				dst[off+i] = this.buffer[this.bufferOffset++] & 0xFF;
				this.bytesAvailable -= 1;
				this.bufferRemains -= 1;
				if (this.bufferRemains <= 0)
					this.refreshCurrentBuffer();
			}
			return len;
		}

		return new Promise((resolve, reject) => {
			let onClose, onError, onNextMessage;
			onClose = () => {
				this.client.removeEventListener('error', onError);
				this.client.removeEventListener('close', onClose);
				this.client.removeEventListener('message', onNextMessage);
				resolve(-1);
			};
			onError = err => {
				this.client.removeEventListener('error', onError);
				this.client.removeEventListener('close', onClose);
				this.client.removeEventListener('message', onNextMessage);
				reject(err);
			};
			onNextMessage = async () => {
				this.client.removeEventListener('error', onError);
				this.client.removeEventListener('close', onClose);
				this.client.removeEventListener('message', onNextMessage);
				resolve(await this.readBytes(dst, off, len));
			};

			this.client.addEventListener('error', onError);
			this.client.addEventListener('close', onClose);
			this.client.addEventListener('message', onNextMessage);
		});
	}

	close() {
		if (!this.connected)
			return;
		this.client.close();
	}

	available() {
		return this.bytesAvailable;
	}

	clear() {
		this.close();
		this.buffer = null;
		this.bufferList = [];
		this.bufferOffset = 0;
		this.bufferRemains = 0;
		this.bytesAvailable = 0;
	}
}

module.exports = Socket;

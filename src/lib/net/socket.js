class Socket {
	constructor(host,port) {
		// this.client.addEventListener('message', this.onPacket);
		// amount of bytes are left to read since last read call (in total)
		this.totalBytes = 0;
		// the message buffers that arrive from the websocket
		this.bufferList = [];
		// the current buffer we're reading
		this.buffer = void 0;
		// amount of bytes we read in current buffer
		this.bufferOffset = 0;
		this.host = host;
		this.port = port;
		this.open = false;
	}

	connect() {
		return new Promise((resolve,reject) => {
			this.client = new WebSocket(`${this.host}:${this.port}`, 'binary');
			this.client.binaryType = 'arraybuffer';
			let open,close,packet
			const handleErr = err => {
				this.client.removeEventListener('error', handleErr);
				this.client.removeEventListener('open', open);
				this.client.removeEventListener('close', close);
				this.client.removeEventListener('message', packet);
				console.debug("WS connection closed due to an error:", err)
				this.clear();
				reject(err);
			};
			open = () => {
				this.client.removeEventListener('error', handleErr);
				this.client.removeEventListener('open', open);
				console.debug("WS connection opened to server.")
				resolve();
			};
			close = () => {
				this.client.removeEventListener('error', handleErr);
				this.client.removeEventListener('open', open);
				this.client.removeEventListener('close', close);
				this.client.removeEventListener('message', packet);
				console.debug("WS connection closed.")
				this.clear();
			};
			packet = msg => {
				this.bufferList.push(Buffer.from(msg.data));
				this.totalBytes += msg.data.byteLength;
				this.refreshCurrentBuffer();
			};
			this.client.addEventListener('open', open);
			this.client.addEventListener('error', handleErr);
			this.client.addEventListener('close', close);
			this.client.addEventListener('message', packet);
		})
	}

	get connected() {
		// returns true on connecting or connected states.
		return this.client && (this.client.readyState === 1);
	}

	write(bytes, off = 0, len = bytes.length) {
		this.client.send(bytes.slice(off, off + len));
	}

	refreshCurrentBuffer() {
		if (this.bufferList.length > 0 && !this.buffer || (this.bufferRemains === 0 && this.available > 0)) {
			this.bufferOffset = 0;
			this.buffer = this.bufferList.shift();
		}
	}

	// read the first byte available in the buffer, or wait for one to be sent
	// if none are available.
	async readByte() {
		if (!this.connected)
			// throw new Error('attempting to read from closed socket');
			return -1;

		if (this.connected && this.available > 0 && this.bufferRemains > 0 && this.buffer) {
			this.totalBytes--;

			return this.buffer[this.bufferOffset++] & 0xFF;
		}

		return new Promise((resolve,reject) => {
			let close, msg;
			const handleErr = err => {
				this.client.removeEventListener('message', msg);
				this.client.removeEventListener('error', handleErr);
				this.client.removeEventListener('close', close);
				reject(err);
			};
			close = () => {
				this.client.removeEventListener('message', msg);
				this.client.removeEventListener('error', handleErr);
				this.client.removeEventListener('close', close);
				reject(-1);
			};
			msg = p => {
				this.client.removeEventListener('message', msg);
				this.client.removeEventListener('error', handleErr);
				this.client.removeEventListener('close', close);
				Promise.resolve().then(async () => {
					resolve(await this.readByte());
				});
			};
			this.client.addEventListener('error', handleErr);
			this.client.addEventListener('close', close);
			this.client.addEventListener('message', msg);
		});
	}

	// read multiple bytes (specified by `len`) and put them into the `dst`
	// array at specified `off` (0 by default).
	async readBytes(dst, off = 0, len = dst.length) {
		if (!this.connected)
			// throw new Error('attempting to read from closed socket');
			return -1;

		if (this.connected && this.available >= len) {
			// We have enough data for this request
			// for (let i = 0; i < len; i++) {
			while (len > 0) {
				dst[off++] = this.buffer[this.bufferOffset++] & 0xFF;
				len -= 1
				this.totalBytes -= 1;
				if (this.bufferRemains <= 0)
					this.refreshCurrentBuffer();
			}
			return;
		}

		return new Promise((resolve,reject) => {
			let close, msg;
			const handleErr = err => {
				this.client.removeEventListener('message', msg);
				this.client.removeEventListener('error', handleErr);
				this.client.removeEventListener('close', close);
				reject(err);
			};
			close = () => {
				this.client.removeEventListener('message', msg);
				this.client.removeEventListener('error', handleErr);
				this.client.removeEventListener('close', close);
				reject(-1);
			};
			msg = p => {
				this.client.removeEventListener('message', msg);
				this.client.removeEventListener('error', handleErr);
				this.client.removeEventListener('close', close);
				Promise.resolve().then(async () => {
					resolve(await this.readBytes(dst, off, len));
				});
			};
			this.client.addEventListener('error', handleErr);
			this.client.addEventListener('close', close);
			this.client.addEventListener('message', msg);
		});
	}

	close() {
		if (!this.connected)
			return;
		this.client.close();
		this.open = false;
	}

	get available() {
		return this.totalBytes;
	}

	get bufferRemains() {
		if (!this.buffer)
			return 0;
		return this.buffer.length - this.bufferOffset;
	}

	clear() {
		this.close();
		this.buffer = null;
		this.bufferList = [];
		this.bufferOffset = 0;
		this.totalBytes = 0;
	}
}

module.exports = Socket;

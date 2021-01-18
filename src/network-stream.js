import Packet from './packet';
import Socket from './lib/net/socket';
let Ops = require('./packets');
let Timer = require('./timer');

async function createSocket(host, port) {
	let socket = new Socket(host, port);
	await socket.connect();
	return socket;
}

// class NetworkStream/* extends Packet*/ {
function NetworkStream() {
	let closing = false;
	let closed = false;
	let readTries = 0;
	let buffered = 0;
	let frameLen = 0;
	let socket = void 0;
	let writer = new Timer(20);
	let packets = [];

	async function connect(host, port) {
		closing = closed = false;
		socket = await createSocket(host, port);
	}

	function connected() {
		return socket && !closed;
	}

	function close() {
		if (!connected()) {
			closing = true;
			socket.close();
			closed = true;
		}
	}

	async function read() {
		return connected() ? await socket.readByte() : 0;
	}

	function available() {
		return connected() ? socket.available : 0;
	}

	async function readPacket() {
		let frameSize = 0;
		let readTries = 0;

		return new Promise(async (resolve, reject) => {
			if (!connected()) {
				reject(Error("Unable to read from a disconnected socket!"));
				return;
			}
			if (readTries++ >= 100) {
				reject(Error("Socket timed out (100 client ticks should be about 10 seconds hopefully)"));
				return;
			}

			// header
			if (frameSize === 0 && socket.available >= 2) {
				readTries = 0;
				frameSize = await socket.readByte() & 0xFF;
				if (frameSize >= 160) {
					frameSize = ((frameSize - 160) << 8) | (await socket.readByte() & 0xFF);
				}
			}

			// frame
			if (frameSize > 0 && socket.available >= frameSize) {
				let buff = Buffer.alloc(frameSize);
				if (frameSize < 160)
					buff[--frameSize] = await socket.readByte() & 0xFF;

				if (frameSize > 0)
					await socket.readBytes(buff, 0, frameSize);

				frameSize = readTries = 0;
				if (Ops.inCipher)
					buff[0] = (buff[0] - Ops.inCipher.random()) & 0xFF;

				resolve(Int8Array.from(buff));
			}
		});
	}

	function add(p) {
		packets.push(p);
	}

	function send(p) {
		if (!p || !p.packet)
			console.warn("Trying send an empty (header-less) packet!");
		let data = (p.packet || p).slice();
		if (Ops.outCipher) {
			if (data.length <= 2) {
				data[1] = (data[1] + Ops.outCipher.random()) & 0xFF;
			} else {
				if (data[2])
					data[2] = (data[2] + Ops.outCipher.random()) & 0xFF;
			}
		}
		socket.write(data);
	}

	function needsFlush() {
		return packets && packets.length;
	}

	function flush() {
		if (!needsFlush()) {
			writer.tickCount = writer.tickThreshold - 1;
			return;
		}
		writer.tickCount = 0;
		for (let packet = packets.shift(); packet; packet = packets.shift())
			send(packet);
	}
	
	return {
		closeStream: close,
		readStream: read,
		connectedStream: connected,
		availableStream: available,
		connected,
		available,
		nextPacket: readPacket,
		queue: add,
		connect,
		close,
		read,
		add,
		send,
		flush,
		needsFlush,
		writer,
	};
	// async readStreamBytes(buff, off, len) {
		// if (this.closed)
			// return;
// 
		// await this.socket.readBytes(buff, off, len);
	// }
// 
	// writeStreamBytes(buff, off = 0, len = (buff.length - off)) {
		// if (this.closing || this.closed)
			// return;
// 
		// this.socket.write(buff, off, len);
	// }
}

// modulw.exporta = NetworkStream;
// modulw.exporta.default = NetworkStream;
export {NetworkStream as default, NetworkStream}

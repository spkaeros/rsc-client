import Packet from './packet';
import Socket from './lib/net/socket';

class NetworkStream extends Packet {
	constructor() {
		super();
		this.closing = false;
		this.closed = false;
		// this.socket = socket;
	}
	
	async connect(host, port) {
		this.closing = this.closed = false;
		this.socket = await createSocket(host, port);
	}

	closeStream() {
		this.closing = true;
		if (this.socket)
			this.socket.close();
		this.closed = true;
	}

	availableStream() {
		if (this.closing || this.closed)
			return 0;

		return this.socket.available;
	}

	async readStream() {
		if (this.closing || this.closed)
			return 0;

		return await this.socket.readByte();
	} 

	async readStreamBytes(buff, off, len) {
		if (this.closing || this.closed)
			return;

		await this.socket.readBytes(buff, off, len);
	}

	writeStreamBytes(buff, off = 0, len = (buff.length - off)) {
		if (this.closing || this.closed) {
			return;
		}

		this.socket.write(buff, off, len);
	}
}

async function createSocket(host, port) {
	let socket = new Socket(host, port);
	await socket.connect();
	return socket;
}

export { NetworkStream as default };

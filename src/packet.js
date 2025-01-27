let GameException = require('./lib/game-exception');
let rng = require('./lib/isaac');
let Timer = require('./timer');
let Ops = require('./packets');

// let {Timer} = require('./timer');
// import PacketBuilder from './packets';
const txtEncoder = new TextEncoder('utf-8');

// The meta-data byte length for our packets.
// structured as 2 bytes reserved for possible length information, and then 1 byte for the opcode.
// Technically the 1 byte for opcode can be placed in the second byte maybe in the event
// we're dealing with a frame-less or `raw` packet, I do believe
const HEADER_SZ = 3;
//24575 is maximum encodable byte length with the Jagex protocol (+3 for header/opcode)
//the buffer can not possibly be filled in one packet beyond that length.
// JaGEx and also I think it's plenty reasonable to default the buffer to 5000 bytes
const BYTES_LIMIT = 5000;

class Packet {
	get opcode() {
		return this._opcode;
	}

	set opcode(op) {
		this._opcode = op;
	}
	
	constructor(op = -1) {
		this.data = new Int8Array(BYTES_LIMIT+HEADER_SZ);
		this.readLength = 0;
		this.writeMarker = 0;
		this.endMarker = HEADER_SZ;
		this.didError = false;
		this.exceptionMessage = '';
		this.writer = new Timer(20); // 1 write flush every 20 engine loops(.4 sec), 2.5 per sec
		this.reader = new Timer(5); // 1 read call every 5 engine loops(.1 sec), 10 per sec
		this.readTries = 0;
		this.opcode = op;
		this.pqueue = [];
	}

	static bare(opcode) {
		let packet = new Packet(opcode);
		packet.startAccess();
		packet.stopAccess();
		return packet;
	}
	
	async readBytes(len, buff) {
		await this.readStreamBytes(len, 0, buff);
	}
	
	hasPacket() {
		return this.writeMarker > 0 || this.pqueue.length > 0;
	}

	// TODO:Rename sendPacket to something like encodePacket or just encode
	// Prepares the current packet buffer for transmission, encoding the length and
	// the opcode directly before the payload, and setting the start offset to the previous
	// packets end offset.
	stopAccess() {
		// length is just the end carets position minus the start carets position,
		// minus the headers length (2 bytes)
		let length = this.endMarker - this.writeMarker - 2;

		// Jagex `smart int` encoding: <= 160 saves us using one byte out of the payload
		// Why 160 (base2=10100000)?  seems so arbitrary
		if (length >= 160) {
			// if length is >= 160 or 0b10100000, we encode it as a 2-byte integer
			this.data[this.writeMarker] = (160 + (length >> 8)) & 0xFF;
			this.data[this.writeMarker + 1] = length & 0xFF;
		} else {
			this.data[this.writeMarker] = length & 0xFF;
			this.endMarker--;
			// the procedures that wrote this data decide if it gets masked
			this.data[this.writeMarker + 1] = this.data[this.endMarker];
		}
		
		// set output buffer writer to start at end of this message stream, as it's state is now finalized for server
		this.writeMarker = this.endMarker;
	}

	newPacket(op) {
		this.startAccess(op);
	}
	
	sendPacket() {
		this.stopAccess();
	}

	startAccess(op = this.opcode) {
		// 80%
		if (this.writeMarker >= Math.floor(BYTES_LIMIT*4/5)) {
			try {
				this.tick();
			} catch (e) {
				this.exceptionMessage = e.message;
				this.didError = true;
			}
		}

		if (!this.data)
			this.data = new Uint8Array(BYTES_LIMIT+HEADER_SZ);

		this.data[this.writeMarker + 2] = op & 0xFF;
		if (op && Ops.outCipher)
			this.data[this.writeMarker + 2] = (op + Ops.outCipher.random()) & 0xFF;
		// set end caret to the buffer position directly following header bytes and opcode
		this.endMarker = this.writeMarker + 3;
		this.data[this.endMarker] = 0;
	}

	reset() {
		// Subtract the flushed payload bytes from the payload size
		this.endMarker -= this.writeMarker;
		// reset header caret
		this.writeMarker = 0;
	}

	// Reads an unsigned byte (uint8) from the network buffer and returns it.
	async UInt8() {
		return await this.readStream() & 0xFF;
	}

	async Int8() {
		return await this.readStream();
	}

	async getString() {
		if (this.UInt8() !== 0) {
			return "";
		}
		let s = "";
		for (let i = this.UInt8(); i !== 0; i = this.UInt8())
			s += String.fromCharCode(i);

		return s;
	}

	// Reads a big-endian unsigned short integer (uint16) from the network buffer and returns it.
	async UInt16() {
		return (await this.UInt8() << 8) | await this.UInt8();
	}

	// Reads a big-endian unsigned integer (uint32) from the network buffer and returns it.
	async UInt32() {
		return (await this.UInt16() << 16) | await this.UInt16()
	}

	async getSmart08_32() {
		let i = await this.UInt8();
		if (i >= 128) {
			return ((i-128)<<24) | (await this.UInt8() << 16) | (await this.UInt8() << 8) | await this.UInt8();
		}
		return i;
	}

	// Reads a big-endian unsigned long integer (uint64) from the network buffer and returns it.
	async getLong() {
		return 	((BigInt(await this.UInt32()) << 32n) | BigInt(await this.UInt32()));
		// let high = await this.getInt();
		// let low = await this.getInt();
		// return new Long(low, high, true);
	}

	// Queues up a C-string (null-terminated char array) into the current output packet buffer.
	putString(s) {
		this.putBytes(txtEncoder.encode(s));
		this.putByte('\0');
	}

	putBuffer(b) {
		this.putShort(b.length);
		this.putBytes(b);
	}

	// Queues up an unsigned byte into the current output packet buffer.
	putByte(i) {
		this.data[this.endMarker++] = i;
	}
	
	// Queues up an unsigned byte into the current output packet buffer.
	putUByte(i) {
		this.data[this.endMarker++] = i & 0xFF;
	}
	
	// Queues up a boolean value represented as a single byte (encoded as 1 for true, 0 for false)
	putBoolean(b) {
		this.data[this.endMarker++] = b ? 1 : 0;
	}
	
	// Queues up a boolean value represented as a single byte (encoded as 1 for true, 0 for false)
	putBool(b) {
		this.data[this.endMarker++] = b ? 1 : 0;
	}

	// Queues up a big-endian unsigned short integer (uint16) into the current output packet buffer.
	putShort(i) {
		this.putUByte(i >>> 8);
		this.putUByte(i);
	}
	
	// Queues up a big-endian unsigned integer (uint32) into the current output packet buffer.
	putInt(i) {
		this.putShort(i >>> 16);
		this.putShort(i);
	}

	putSmart08_64(i) {
		if (i >= 128) {
			this.data[this.endMarker++] = Number((BigInt(i) >> 56n) + 128n) & 0xFF;
			this.data[this.endMarker++] = Number(BigInt(i) >> 48n) & 0xFF;
			this.data[this.endMarker++] = Number(BigInt(i) >> 40n) & 0xFF;
			this.data[this.endMarker++] = Number(BigInt(i) >> 32n) & 0xFF;
			this.data[this.endMarker++] = Number(BigInt(i) >> 24n) & 0xFF;
			this.data[this.endMarker++] = Number(BigInt(i) >> 16n) & 0xFF;
			this.data[this.endMarker++] = Number(BigInt(i) >> 8n) & 0xFF;
			this.data[this.endMarker++] = Number(BigInt(i) >> 0n) & 0xFF;
			return;
		}
		this.putUByte(i);
	}

	putSmart08_32(i) {
		if (i >= 128) {
			this.putUByte((i>>24) + 128);
			this.putUByte(i>>16);
			this.putUByte(i>>8);
			this.putUByte(i);
			return;
		}
		this.putUByte(i);
	}

	putSmart08_16(i) {
		if (i >= 160) {
			this.putUByte((i>>8) + 160);
			this.putUByte(i);
			return;
		}
		this.putUByte(i);
	}

	putSmart16_64(i) {
		if (i >= 128) {
			this.data[this.endMarker++] = Number((BigInt(i) >> 56n) + 128n) & 0xFF;
			this.data[this.endMarker++] = Number(BigInt(i) >> 48n) & 0xFF;
			this.data[this.endMarker++] = Number(BigInt(i) >> 40n) & 0xFF;
			this.data[this.endMarker++] = Number(BigInt(i) >> 32n) & 0xFF;
			this.data[this.endMarker++] = Number(BigInt(i) >> 24n) & 0xFF;
			this.data[this.endMarker++] = Number(BigInt(i) >> 16n) & 0xFF;
			this.data[this.endMarker++] = Number(BigInt(i) >> 8n) & 0xFF;
			this.data[this.endMarker++] = Number(BigInt(i) >> 0n) & 0xFF;
//			this.putLong(i+128);
			return;
		}
		this.putShort(i);
	}

	putSmart16_32(i) {
		if (i >= 128) {
			this.putUByte((i>>24) + 128);
			this.putUByte(i>>16);
			this.putUByte(i>>8);
			this.putUByte(i);
			return;
		}
		this.putShort(i);
	}
	
	putSmart32_64(i) {
		if (i >= 128) {
			this.data[this.endMarker++] = Number((BigInt(i) >> 56n) + 128n) & 0xFF;
			this.data[this.endMarker++] = Number(BigInt(i) >> 48n) & 0xFF;
			this.data[this.endMarker++] = Number(BigInt(i) >> 40n) & 0xFF;
			this.data[this.endMarker++] = Number(BigInt(i) >> 32n) & 0xFF;
			this.data[this.endMarker++] = Number(BigInt(i) >> 24n) & 0xFF;
			this.data[this.endMarker++] = Number(BigInt(i) >> 16n) & 0xFF;
			this.data[this.endMarker++] = Number(BigInt(i) >> 8n) & 0xFF;
			this.data[this.endMarker++] = Number(BigInt(i) >> 0n) & 0xFF;
			return;
		}
		this.putInt(i);
	}

	// Queues up a big-endian unsigned long integer (uint64) into the current output packet buffer.
	putLong(i) {
		this.data[this.endMarker++] = Number(BigInt(i) >> 56n) & 0xFF;
		this.data[this.endMarker++] = Number(BigInt(i) >> 48n) & 0xFF;
		this.data[this.endMarker++] = Number(BigInt(i) >> 40n) & 0xFF;
		this.data[this.endMarker++] = Number(BigInt(i) >> 32n) & 0xFF;
		this.data[this.endMarker++] = Number(BigInt(i) >> 24n) & 0xFF;
		this.data[this.endMarker++] = Number(BigInt(i) >> 16n) & 0xFF;
		this.data[this.endMarker++] = Number(BigInt(i) >> 8n) & 0xFF;
		this.data[this.endMarker++] = Number(BigInt(i) >> 0n) & 0xFF;
	}

	// Queues up an array of unsigned bytes into the current output packet buffer.
	// offset and len are optional, and default to offset=0, len=src.length
	putBytes(src, offset = 0, len = src.length) {
		for (let i = offset; i < offset+len && i < src.length; i++)
			this.putByte(src[i]);
	}

}

module.exports = Packet;

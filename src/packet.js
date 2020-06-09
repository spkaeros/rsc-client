const Long = require('long');
const Timer = require('./timer');

function toCharArray(s) {
	let a = new Uint8Array(s.length);
	for (let i = 0; i < s.length; i += 1) {
		a[i] = s.charCodeAt(i);
	}
	return a;
}

class Packet {
	constructor() {
		this.readTicksCount = 0;
		this.readTicksMax = 0;
		this.packetStart = 0;
		// 24575 is maximum encodable byte length with the Jagex protocol (+3 for header/opcode)
		// the limitation is in the header encoding.  Length is encoded conditionally,
		// and one branch subtracts 160 from the first byte (big-endian), before the shift resulting in
		// a range of up to 24320, add 255 to this and you get 24575, our maximum encodable smart length.
		this.packetMaxLength = 24578;
		this.packetData = new Int8Array(this.packetMaxLength);
		this.bufferSize = 0;
		this.packetEnd = 3;
		this.socketException = false;
		this.socketExceptionMessage = '';
		this.writer = new Timer(20);
	}
	
	async readBytes(len, buff) {
		await this.readStreamBytes(len, 0, buff);
	}
	
	async readPacket(buff) {
		try {
			this.readTicksCount++;
			if (this.readTicksMax > 0 && this.readTicksCount > this.readTicksMax) {
				this.readTicksCount = 0;
				this.socketException = true;
				this.socketExceptionMessage = 'time-out';
				return 0;
			}
			// if the first byte is >=0xA0 that means its a flag to indicate we need to decode a uint16 for frame size
			// otherwise the 1st byte has the frame size and second byte contains the last byte of the frame
			if (this.bufferSize === 0 && this.availableStream() >= 2) {
				this.bufferSize = await this.readStream();
				if (this.bufferSize >= 160)
					this.bufferSize = (this.bufferSize - 160) << 8 | await this.readStream();
			}
			// frame
			if (this.bufferSize > 0 && this.availableStream() >= this.bufferSize) {
				let size = this.bufferSize;
				if (size > 0) {
					if (this.bufferSize < 0xA0) {
						this.bufferSize -= 1;
						buff[this.bufferSize] = await this.readStream() & 0xFF
					}
					await this.readBytes(this.bufferSize, buff);
				}
				
				this.bufferSize = this.readTicksCount = 0;
				return size;
			}
		} catch (e) {
			this.socketException = true;
			this.socketExceptionMessage = e.message;
		}
		
		return 0;
	}
	
	hasPacket() {
		return this.packetStart > 0;
	}

	resetOutgoingBuffer() {
		// Subtract the flushed payload bytes from the payload size
		this.packetEnd -= this.packetStart;
		// reset header caret
		this.packetStart = 0;
		// header is 2 bytes, opcode is 1 bytes, total of 3 for an initial end caret position
//		this.packetEnd = 3;
	}

	// Increments the timer 
	tickWriter() {
		// Check to see if something went horribly wrong with our socket
		if (this.socketException) {
			this.socketException = false;
			this.resetOutgoingBuffer();

			throw new Error(this.socketExceptionMessage);
			return;
		}
		// TODO: Can this be done by simply passing in the method directly?
		this.writer.tick(() => {
			this.flushWriter();
		});
	}

	flushWriter() {
		if (this.packetStart <= 0) {
			// No data to flush, we need to try again next tick
			this.writer.tickCount = 19;
			return;
		}
		this.writeStreamBytes(this.packetData, 0, this.packetStart);
		this.resetOutgoingBuffer();
	}

	// TODO:Rename sendPacket to something like encodePacket or just encode
	// Prepares the current packet buffer for transmission, encoding the length and
	// the opcode directly before the payload, and setting the start offset to the previous
	// packets end offset.
	sendPacket() {
		// length is just the end carets position minus the start carets position,
		// minus the headers length (2 bytes)
		let length = this.packetEnd - this.packetStart - 2;

		// Jagex `smart` length encoding: <= 160 saves us using one byte out of the payload
		// Why 160?  seems so arbitrary
		if (length >= 160) {
			// if length is >= 160 or 0b10100000, we encode it as a 2-byte integer
			this.packetData[this.packetStart] = (160 + (length >> 8)) & 0xFF;
			this.packetData[this.packetStart + 1] = length & 0xFF;
		} else {
			this.packetData[this.packetStart] = length & 0xFF;
			this.packetEnd--;
			// the procedures that wrote this data decide if it gets masked
			this.packetData[this.packetStart + 1] = this.packetData[this.packetEnd];
		}
		
		// tracks opcode throughput in frames and bytes sent by opcode
		// if (this.packetMaxLength <= 10000) {
		//     let opcode = this.packetData[this.packetStart + 2] & 0xFF;
		//
		//     Packet.anIntArray537[opcode]++;
		//     Packet.anIntArray541[opcode] += this.packetEnd - this.packetStart;
		// }

		// reset output packet buffer caret position
		this.packetStart = this.packetEnd;
	}
	
	newPacket(i) {
		if (this.packetStart > (this.packetMaxLength * 4 / 5) | 0) {
			try {
				// TODO: Add checks to ensure no flushes mid-packet construction?
				// In practice, client uses one thread this should not happen right?
				this.tickWriter();
			} catch (e) {
				this.socketExceptionMessage = e.message;
				this.socketException = true;
			}
		}
		
		if (!this.packetData)
			this.packetData = new Int8Array(this.packetMaxLength);
		
		this.packetData[this.packetStart + 2] = i & 0xFF;
		// set end caret to the buffer position directly following header bytes and opcode
		this.packetEnd = this.packetStart + 3;
		// Fake a payload byte to accomodate 0-byte payloads with opcodes without breaking header encoding
		this.packetData[this.packetEnd] = 0;
	}

	// Reads an unsigned byte (uint8) from the network buffer and returns it.
	async getByte() {
		return await this.readStream() & 0xFF;
	}
	
	// Reads a big-endian unsigned short integer (uint16) from the network buffer and returns it.
	async getShort() {
		return (await this.getByte() << 8) | await this.getByte();
	}

	// Reads a big-endian unsigned integer (uint32) from the network buffer and returns it.
	async getInt() {
		return (await this.getShort() << 16) | await this.getShort()
	}
	
	// Reads a big-endian unsigned long integer (uint64) from the network buffer and returns it.
	async getLong() {
		let high = await this.getInt();
		let low = await this.getInt();
		return new Long(low, high, true);
	}
	
	// Queues up a C-string (null-terminated char array) into the current output packet buffer.
	putString(s) {
		this.putBytes(toCharArray(s));
		this.putByte('\0');
	}
	
	// Queues up a boolean value represented as a single byte (encoded as 1 for true, 0 for false)
	putBool(b) {
		this.putByte(b ? 1 : 0);
	}

	// Queues up an unsigned byte into the current output packet buffer.
	putByte(i) {
		this.packetData[this.packetEnd++] = i;
	}
	
	// Queues up a big-endian unsigned short integer (uint16) into the current output packet buffer.
	putShort(i) {
		this.putByte(i >> 8);
		this.putByte(i);
	}
	
	// Queues up a big-endian unsigned integer (uint32) into the current output packet buffer.
	putInt(i) {
		this.putShort(i >> 16);
		this.putShort(i);
	}
	
	// Queues up a big-endian unsigned long integer (uint64) into the current output packet buffer.
	putLong(l) {
		this.putInt(l.shiftRight(32).toInt());
		this.putInt(l.toInt());
	}

	// Queues up an array of unsigned bytes into the current output packet buffer.
	// offset and len are optional, and default to offset=0, len=src.length
	putBytes(src, offset = 0, len = src.length) {
		for (let i = offset; i < offset+len; i++) {
			if (i > src.length)
				break;
			this.packetData[this.packetEnd++] = src[i];
		}
	}

	// Flushes the outgoing packet buffer contents to the underlying socket connection.
	flushPacket() {
		this.sendPacket();
		this.flushWriter();
	}
}

module.exports = Packet;

const Long = require('long');

function toCharArray(s) {
	let a = new Uint16Array(s.length);
	
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
		this.packetData = null;
		this.bufferSize = 0;
		this.socketException = false;
		this.flushTimer = 0;
		
		this.packetEnd = 3;
		this.packetMaxLength = 5000;
		this.socketExceptionMessage = '';
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
				if (this.bufferSize >= 0xA0) {
					this.bufferSize = (this.bufferSize - 0xA0) << 8 | await this.readStream();
				}
			}
			// frame
			if (this.bufferSize > 0 && this.availableStream() >= this.bufferSize) {
				let frameBufferSize = this.bufferSize;
				if (frameBufferSize > 0) {
					if (this.bufferSize < 0xA0) {
						this.bufferSize -= 1;
						buff[this.bufferSize] = await this.readStream() & 0xFF
					}
					await this.readBytes(this.bufferSize, buff);
				}
				
				this.bufferSize = this.readTicksCount = 0;
				return frameBufferSize;
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
	
	writePacket(i) {
		if (this.socketException) {
			this.packetStart = 0;
			this.packetEnd = 3;
			this.socketException = false;

			throw Error(this.socketExceptionMessage);
		}

		this.flushTimer++;
		
		if (this.flushTimer < i) {
			return;
		}
		
		if (this.packetStart > 0) {
			this.flushTimer = 0;
			this.writeStreamBytes(this.packetData, 0, this.packetStart);
		}
		
		this.packetStart = 0;
		this.packetEnd = 3;
	}
	
	sendPacket() {
		let length = this.packetEnd - this.packetStart - 2;
		
		if (length >= 160) {
			this.packetData[this.packetStart] = 160 + (length >> 8) & 0xFF;
			this.packetData[this.packetStart + 1] = length & 0xFF;
		} else {
			this.packetData[this.packetStart] = length & 0xFF;
			this.packetEnd--;
			this.packetData[this.packetStart + 1] = this.packetData[this.packetEnd];
		}
		
		// tracks opcode throughput in frames and bytes sent by opcode
		// if (this.packetMaxLength <= 10000) {
		//     let opcode = this.packetData[this.packetStart + 2] & 0xFF;
		//
		//     Packet.anIntArray537[opcode]++;
		//     Packet.anIntArray541[opcode] += this.packetEnd - this.packetStart;
		// }
		
		this.packetStart = this.packetEnd;
	}
	
	newPacket(i) {
		if (this.packetStart > (((this.packetMaxLength * 4) / 5) | 0)) {
			try {
				this.writePacket(0);
			} catch (e) {
				this.socketException = true;
				this.socketExceptionMessage = e.message;
			}
		}
		
		if (this.packetData === null) {
			this.packetData = new Int8Array(this.packetMaxLength);
		}
		
		this.packetData[this.packetStart + 2] = i & 0xFF;
		this.packetData[this.packetStart + 3] = 0;
		this.packetEnd = this.packetStart + 3;
	}
	
	async getByte() {
		return await this.readStream() & 0xFF;
	}
	
	async getShort() {
		return (await this.getByte() << 8) | await this.getByte();
	}
	async getInt() {
		return (await this.getShort() << 16) | await this.getShort()
	}
	
	async getLong() {
		return Long.fromInt(await this.getInt()).shiftLeft(32).or(Long.fromInt(await this.getInt()));
	}
	
	putString(s) {
		this.putBytes(toCharArray(s), 0, s.length);
		this.putByte(0);
	}
	
	putByte(i) {
		this.packetData[this.packetEnd++] = i & 0xFF;
	}
	
	putBool(b) {
		this.putByte(b ? 1 : 0);
	}
	
	putShort(i) {
		this.putByte(i >> 8);
		this.putByte(i);
	}
	
	putInt(i) {
		this.putShort(i >> 16);
		this.putShort(i);
	}
	
	putLong(l) {
		this.putInt(l.shiftRight(32).toInt());
		this.putInt(l.toInt());
	}
	
	putBytes(src, srcPos, len) {
		for (let c of src.slice(srcPos, srcPos+len)) {
			this.putByte(c)
		}
	}
	
	flushPacket() {
		this.sendPacket();
		this.writePacket(0);
	}
}

module.exports = Packet;

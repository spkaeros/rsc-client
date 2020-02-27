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
		this.readTries = 0;
		this.maxReadTries = 0;
		this.packetStart = 0;
		this.packetData = null;
		this.length = 0;
		this.socketException = false;
		this.delay = 0;
		
		this.packetEnd = 3;
		this.packetMaxLength = 5000;
		this.socketExceptionMessage = '';
	}
	
	async readBytes(len, buff) {
		await this.readStreamBytes(len, 0, buff);
	}
	
	async readPacket(buff) {
		try {
			this.readTries++;
			
			if (this.maxReadTries > 0 && this.readTries > this.maxReadTries) {
				this.socketException = true;
				this.socketExceptionMessage = 'time-out';
				this.maxReadTries += this.maxReadTries;
				return 0;
			}
			
			if (this.length === 0 && this.availableStream() >= 2) {
				this.length = await this.readStream();
				
				if (this.length >= 160) this.length = ((this.length - 160) << 8) | await this.readStream();
			}
			
			if (this.length > 0 && this.availableStream() >= this.length) {
				if (this.length >= 160) {
					await this.readBytes(this.length, buff);
				} else {
					buff[this.length - 1] = await this.readStream() & 0xFF;
					
					if (this.length > 1) {
						await this.readBytes(this.length - 1, buff);
					}
				}
				
				let i = this.length;
				
				this.length = 0;
				this.readTries = 0;
				
				return i;
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

		this.delay++;
		
		if (this.delay < i) {
			return;
		}
		
		if (this.packetStart > 0) {
			this.delay = 0;
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
		this.putByte('\0')
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
		for (let k = 0; k < len; k++) {
			this.putByte(src[srcPos + k]);
		}
	}
	
	flushPacket() {
		this.sendPacket();
		this.writePacket(0);
	}
}

module.exports = Packet;

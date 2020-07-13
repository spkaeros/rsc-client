let decoder = new TextDecoder('utf-8');
let encoder = new TextEncoder('utf-8');

class GameBuffer {
	constructor(buffer = new Uint8Array(100)) {
		this.buffer = buffer;
		this.offset = 0;
	}

	putByte(i) {
		this.buffer[this.offset++] = i;
	}

	putInt(i) {
		this.buffer[this.offset++] = (i >> 24) & 0xFF;
		this.buffer[this.offset++] = (i >> 16) & 0xFF;
		this.buffer[this.offset++] = (i >> 8) & 0xFF;
		this.buffer[this.offset++] = i & 0xFF;
	}

	putLong(i) {
		this.buffer[this.offset++] = Number((i >> 56n) & 0xFFn);
		this.buffer[this.offset++] = Number((i >> 48n) & 0xFFn);
		this.buffer[this.offset++] = Number((i >> 40n) & 0xFFn);
		this.buffer[this.offset++] = Number((i >> 32n) & 0xFFn);
		this.buffer[this.offset++] = Number((i >> 24n) & 0xFFn);
		this.buffer[this.offset++] = Number((i >> 16n) & 0xFFn);
		this.buffer[this.offset++] = Number((i >> 8n) & 0xFFn);
		this.buffer[this.offset++] = Number((i) & 0xFFn);
	}

	putString(s) {
		this.putBytes(encoder.encode(s));
		this.putByte(0);
	}

	putBytes(src, srcPos = 0, len = src.length) {
		for (let i = srcPos; i < len; i++)
			this.putByte(src[i]);
	}

	getUnsignedByte() {
		return this.buffer[this.offset++] & 0xFF;
	}

	getUnsignedShort() {
		return (this.getUnsignedByte() << 8) | this.getUnsignedByte();
	}

	getUnsignedInt() {
		return (this.getUnsignedShort() << 16) | this.getUnsignedShort();
	}

	getUnsignedLong() {
		let high = this.getUnsignedInt();
		let low = this.getUnsignedInt();
		return ((BigInt(this.getUnsignedInt()) << 32n) & 0xFFFFFFn) | (BigInt(this.getUnsignedInt()) & 0xFFFFFFn)
	}

	availableBytes() {
		if (!this.buffer)
			return 0;
		return this.buffer.length;
	}

	getString(len = 0) {
		if (this.buffer.length - this.offset > len)
			len = this.buffer.length-this.offset;
		else if (len < 0)
			return '';

		let ret = decoder.decode(this.buffer.slice(this.offset, this.offset+len));

		this.offset += len;
		if (this.offset > this.buffer.length)
			this.offset = this.buffer.length;

		return ret;
	}
}

export { GameBuffer as default };

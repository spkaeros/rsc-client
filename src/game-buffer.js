class GameBuffer {
	constructor(buffer) {
		this.buffer = buffer;
		this.offset = 0;
	}

	putByte(i) {
		this.buffer[this.offset++] = i;
	}

	putInt(i) {
		this.putByte(i >> 24);
		this.putByte(i >> 16);
		this.putByte(i >> 8);
		this.putByte(i);
	}

	putString(s) {
		for (let i = 0; i < s.length; i++)
			this.putByte(s.charCodeAt(i));

		// line-feed as terminator
		// TODO: Is this ok or should I switch to c-strings (\0 terminated)
		this.buffer[this.offset++] = '\n';
	}

	putBytes(src, srcPos, len) {
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
		return new Long(this.getUnsignedInt(), this.getUnsignedInt());
	}

	getString(len = 0) {
		if (len < 0)
			return '';

		this.offset += len;
		if (this.offset > this.buffer.length)
			this.offset = this.buffer.length;

		return new TextDecoder().decode(this.buffer.slice(this.offset-len, this.offset));
	}
}

module.exports = GameBuffer;

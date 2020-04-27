const bigInt = require('big-integer');

const EXPONENT = bigInt("12256971504525176577999115521306614075749098639988274452692554670619288210288814203087336665303501555493198422881032409199392946347224070978354126295353401");
const MODULUS = bigInt("121727957757863576101561860005285292626079113266451124223351027655156011238254177877652729098983576274837395085392103662934978533548660507677480253506715648449246069310428873797293036242698272731265802720055413141023411018398284944110799347717001885969188133010830020603318079626459849229187149790609728348667");

class GameBuffer {
	constructor(buffer) {
		this.buffer = buffer;
		this.offset = 0;
		this.decoder = new TextDecoder('utf8');
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

	putString(s) {
		for (let i = 0; i < s.length; i++)
			this.putByte(s.charCodeAt(i));

		// TODO: Is this ok or should I switch to c-strings (\0 terminated)
		this.putByte('\n');
	}

	putCredentials(user, pass) {
		for (let i = 0; i < user.length; i++)
			this.buffer[this.offset++] = user.charCodeAt(i);
		this.buffer[this.offset++] = '\0';
		
		for (let i = 0; i < pass.length; i++)
			this.buffer[this.offset++] = pass.charCodeAt(i);
		this.buffer[this.offset++] = '\0';
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
		let high = this.getUnsignedInt();
		let low = this.getUnsignedInt();
		return new Long(low, high, true);
	}

	getString(len = 0) {
		if (len < 0)
			return '';

		this.offset += len;
		if (this.offset > this.buffer.length)
			this.offset = this.buffer.length;

		return this.decoder.decode(Uint8Array.from(this.buffer.slice(this.offset-len, this.offset)));
	}

    getCryptoBuffer() {
        return (bigInt.fromArray(Array.from(this.buffer.slice(0, this.offset)), 256)).modPow(EXPONENT, MODULUS).toArray(256);
    }
}

module.exports = GameBuffer;

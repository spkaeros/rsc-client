let BZLib = require('./bzlib');
let Enum = require('./lib/enum');
let RSA = require('./rsa');

const C_0 = '0'.charCodeAt(0), C_9 = '9'.charCodeAt(0), C_A = 'a'.charCodeAt(0), C_BIG_A = 'A'.charCodeAt(0),
	C_BIG_Z = 'Z'.charCodeAt(0), C_Z = 'z'.charCodeAt(0);

class Utility {
	/* buffer functions start */
	static getBytes(buf, off = 0, len = (buf.length - off)) {
		// Fallback to returning entire buffer, decoded as a UTF-8 char-stream, if offset was out of bounds
		if (off >= len)
			return buf.slice();
		// Fallback to returning buf[off:], decoded as a UTF-8 char-stream, if length was out of bounds
		if (off+len >= buf.length)
			return buf.slice(off);
		// inputs were seemingly sane and valid; slice buf[off:off+len] from the buffer and return it
		return buf.slice(off, off+len);
	}

	static rsaEncrypt(data) {
		return RSA(Uint8Array.from(data.slice()));
	}
	
	static getUnsignedByte(data) {
		return data & 0xFF;
	}

	static getBoolean(b) {
		return Utility.getUnsignedByte(b) !== 0;
	}
	
	static getUnsignedShort(data, off) {
		return (Utility.getUnsignedByte(data[off]) << 8 | Utility.getUnsignedByte(data[off + 1]));
	}

	static getUnsignedInt(data, off) {
		return (Utility.getUnsignedShort(data, off) << 16 | Utility.getUnsignedShort(data, off+2));
	}
	
	static getUTriByte(data, off) {
		return (Utility.getUnsignedByte(data[off]) << 16 | Utility.getUnsignedShort(data, off+1));
	}

	static getSmart0816(data, off) {
		let msgSize = Utility.getUnsignedByte(data[off++]);
		if (msgSize >= 128)
			msgSize = ((msgSize - 128) << 8) | Utility.getUnsignedByte(data[off++]);
		return msgSize;
	}

	static getString(pdata, off) {
		if (pdata[off++]&0xFF !== 0) {
			return "";
		}
		let s = "";
		for (let i = pdata[off++] & 0xFF; i !== 0; i = pdata[off++] & 0xFF)
			s += String.fromCharCode(i);
		return s;
	}

	static getUnsignedLong(data, off) {
		return BigInt(Utility.getUnsignedByte(data[off])) << 56n |
				BigInt(Utility.getUnsignedByte(data[off+1])) << 48n |
				BigInt(Utility.getUnsignedByte(data[off+2])) << 40n |
				BigInt(Utility.getUnsignedByte(data[off+3])) << 32n |
				BigInt(Utility.getUnsignedByte(data[off+4])) << 24n |
				BigInt(Utility.getUnsignedByte(data[off+5])) << 16n |
				BigInt(Utility.getUnsignedByte(data[off+6])) << 8n |
				BigInt(Utility.getUnsignedByte(data[off+7]));
	}

	static getSignedShort(data, off) {
		let i = Utility.getUnsignedShort(data, off);
		if (i >= 0x8000)
			i -= 0x10000;
		
		return i;
	}

	static getSmart08_32(data, off) {
		let one = Utility.getUnsignedByte(data[off]);
		// Check if we need to read the rest of the data
		if (one >= 0x80) // check length, if we exceed 
			return (one-0x80)<<24 | Utility.getUnsignedByte(data[off + 1]) << 16 | Utility.getUnsignedByte(data[off + 2]) << 8 | Utility.getUnsignedByte(data[off + 3]);

		return one-0x80;
	}

	static getSmartShort(data, off) {
		let one = Utility.getUnsignedByte(data[off]);
		// Check if we need to read the rest of the data
		if (one >= 0x80) // check length, if we exceed 
			return (one-0x80) << 24 | Utility.getUnsignedByte(data[off + 1]) << 16 | Utility.getUnsignedByte(data[off + 2]) << 8 | Utility.getUnsignedByte(data[off + 3]);

		return (one << 8) | Utility.getUnsignedByte(data[off+1]);
	}

	static getBitMask(data, off, len) {
		let k = off >>> 3;
		let l = 8 - (off & 7);
		let i1 = 0;
		
		for (; len > l; l = 8) {
			i1 += (data[k++] & bitmasks[l]) << len - l;
			len -= l;
		}

		if (len === l)
			i1 += data[k] & bitmasks[l];
		else
			i1 += data[k] >> l - len & bitmasks[len];
		return i1;
	}
	/* buffer functions end */ 

	/* hash functions start */
	static recoveryToHash(answer) {
		if (global.wasmMod)
			return global.wasmMod.hashRecoveryAnswer(answer);
		answer = answer.toLowerCase().trim();

		let hash = 0n;
		let index = 0n;
		for (let i = 0; i < answer.length; i++) {
			let rune = answer.charCodeAt(i);
			if (/([a-z]|[A-Z]|[0-9])/.match(rune)) {// >= C_A && rune <= C_Z || rune >= C_0 && rune <= C_9) {
				hash = hash * 47n * (hash - BigInt(rune*6) - BigInt(index*7));
				hash += BigInt(rune - 32) + BigInt(index * rune);
				// hash = hash.mul(47).mul(hash.sub(rune * 6).sub(index * 7));
				// hash = hash.add(rune - 32 + index * rune);
				index++;
			}
		}

		return hash;
	}

	static formatAndTruncate(s, maxLen) {
		let value = '';
		for (let j = 0; j < maxLen && j < s.length; j++) {
			let c = s.charCodeAt(j);
			if (c >= C_A && c <= C_Z || c >= C_BIG_A && c <= C_BIG_Z || c >= C_0 && c <= C_9)
				value += String.fromCharCode(c);
			else
				value += '_';
		}

		return value;
	}

	static getIntegerAsString(i) {
		return (i >> 24 & 0xFF) + '.' + (i >> 16 & 0xFF) + '.' + (i >> 8 & 0xFF) + '.' + (i & 0xFF);
	}

	static usernameToHash(s) {
		if (global.wasmMod)
			return global.wasmMod.usernameToHash(s);
		// polyfill to encode base37 string hashes
		// used if wasm just happens not to be supported for any reason
		let username = '';

		for (let i = 0; i < s.length && i <= 20; i++) {
			let rune = s.charCodeAt(i);
			if (rune >= C_BIG_A && rune <= C_BIG_Z)
				rune = (rune+97)-65;
			if (rune >= C_A && rune <= C_Z || rune >= C_0 && rune <= C_9)
				username += String.fromCharCode(rune);
			else
				username += ' ';
		}
		username = username.trim();

		let hash = 0n;
		for (let i = 0; i < username.length; i++) {
			let rune = username.charCodeAt(i);
			hash *= 37n;

			if (rune >= C_A && rune <= C_Z)
				hash += BigInt((1+rune) - 97);
			else if (rune >= C_0 && rune <= C_9)
				hash += BigInt((27+rune) - 48);
		}

		return hash;
	}

	static hashToUsername(hash) {
		if (global.wasmMod)
			return global.wasmMod.hashToUsername(hash);
		// polyfill to decode base37 string hashes
		// used if wasm just happens not to be supported for any reason
		if (hash <= 0n)
			return 'invalid_name';
		let username = '';

		while (hash > 0n) {
			let i = hash%37n
			hash /= 37n;
			let wordStart = (hash % 37n) === 0n;
			let next = ' ';

			if (i > 0n) {
				if (i < 27n)
					next = String.fromCharCode(Number(i + BigInt(wordStart ? C_BIG_A : C_A) - 1n));
				else
					next = String.fromCharCode(Number(i + BigInt(C_0) - 27n));
			}
			username = next + username
		}
		return username;
	}
	/* hash functions end */

	static hashFileName(fileName) {
		if (global.wasmMod)
			return  global.wasmMod.hashFileName(fileName);
		let targetHash = 0;
		fileName = fileName.toUpperCase();
		for (let i = 0; i < fileName.length; i++)
			targetHash = (((targetHash * 61) | 0) + fileName.charCodeAt(i)) - 32;
		return targetHash;
	}
}

let bitmasks = new Int32Array(32);
for (let i in bitmasks)
	bitmasks[i] = (1 << i) - 1;

class State extends Enum {
	constructor(s) {
		super(s);
	}
}

class WelcomeState extends State {
	constructor(s) {
		super(s);
		super.ordinal = WelcomeState.state++;
	}
}

Object.defineProperty(WelcomeState, "state", {
	get:() => {
		return WelcomeState._state;
	},
	set:(i) => {
		WelcomeState._state = i;
	},
});

class GamePanel extends Enum {
	constructor(s) {
		super(s);
		super.ordinal = GamePanel.state++;
	}
}

Object.defineProperty(GamePanel, "state", {
	get:() => {
		return GamePanel._state;
	},
	set:(i) => {
		GamePanel._state = i;
	},
});

class GameState extends State {
	constructor(s) {
		super(s);
		super.ordinal = GameState.state++;
	}
}

Object.defineProperty(GameState, "state", {
	get:() => {
		return GameState._state;
	},
	set:(i) => {
		GameState._state = i;
	},
});

class EngineState extends State { 
	constructor(s) {
		super(s);
		super.ordinal = EngineState.state++;
	}
}

Object.defineProperty(EngineState, "state", {
	get:() => {
		return EngineState._state;
	},
	set:(i) => {
		EngineState._state = i;
	},
});

let EngineStates = {
	LAUNCH: new EngineState("Launching game engine"),
	INITIALIZE_DATA: new EngineState("Downloading and setting up all the game assets"),
	RUNNING: new EngineState("Engine clock is ticking"),
	SHUTDOWN: new EngineState("Engine is shutting down"),
};

let GameStates = {
	LOGIN: new GameState("Welcome or Login screen view"),
	WORLD: new GameState("World/Player sky-down view"),
};

let GamePanels = {
	APPEARANCE: new GamePanel('Avatar Creation View'),
	CHAT: new GamePanel('Game Chat View'),
};

let WelcomeStates = {
	WELCOME: new WelcomeState('Welcome view'),
	NEW_USER: new WelcomeState('New User view'),
	EXISTING_USER: new WelcomeState('Existing User view'),
};

module.exports = Utility;
module.exports.Utility = Utility;
module.exports.GameStates = GameStates;
module.exports.GamePanels = GamePanels;
module.exports.WelcomeStates = WelcomeStates;
module.exports.EngineStates = EngineStates;

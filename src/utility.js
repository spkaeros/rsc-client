import BZLib from './bzlib';
import FileDownloadStream from './lib/net/file-download-stream';
import Enum from './lib/enum';

const C_0 = '0'.charCodeAt(0);
const C_9 = '9'.charCodeAt(0);
const C_A = 'a'.charCodeAt(0);
const C_BIG_A = 'A'.charCodeAt(0);
const C_BIG_Z = 'Z'.charCodeAt(0);
const C_Z = 'z'.charCodeAt(0);

class Utility {
	static openFile(s) {
		return new FileDownloadStream(s);
	}
	
	/* buffer functions start */

	static getBoolean(b) {
		return Utility.getUnsignedByte(b) !== 0;
	}
	
	static getBytes(buf, off = 0, len = buf.length) {
		if (buf.length < off)
			// Fallback to returning entire buffer, decoded as a UTF-8 char-stream, if offset was out of bounds
			return buf.slice();
		if (buf.length < off+len)
			// Fallback to returning buf[off:], decoded as a UTF-8 char-stream, if length was out of bounds
			return buf.slice(off);
		// inputs were seemingly sane and valid; slice buf[off:off+len] from the buffer and return it decoded as a UTF-8 char-stream
		return buf.slice(off, off+len);
	}
	
	static getUnsignedByte(data) {
		return data & 0xFF;
	}

	static getUnsignedShort(data, off) {
		return (Utility.getUnsignedByte(data[off]) << 8 | Utility.getUnsignedByte(data[off + 1]));
	}

	static getUnsignedInt(data, off) {
		return (Utility.getUnsignedShort(data, off) << 16 | Utility.getUnsignedShort(data, off+2));
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
		// return BigInt(Utility.getUnsignedInt(data, off+4) << 32) | BigInt(Utility.getUnsignedInt(data, off));
		// return new Long(Utility.getUnsignedInt(data, off + 4), Utility.getUnsignedInt(data, off), true);
	}

	static getSignedShort(data, off) {
		let one = Utility.getUnsignedShort(data, off);
		// mimic 16-bit signed integer behavior
		if (one >= 0x8000)
			return one-0x10000;

		return one;
	}

	static getSmart08_32(data, off) {
		let one = Utility.getUnsignedByte(data[off]);
		// Check if we need to read the rest of the data
		if (one >= 0x80) // check for bitwise flag indicating a 4-byte read
			return (one-0x80)<<24 | Utility.getUnsignedByte(data[off + 1]) << 16 | Utility.getUnsignedByte(data[off + 2]) << 8 | Utility.getUnsignedByte(data[off + 3]);

		return one&~0x80;
	}

	static getBitMask(buff, off, len) {
		let k = off >> 3;
		let l = 8 - (off & 7);
		let i1 = 0;
		
		for (; len > l; l = 8) {
			i1 += (buff[k++] & bitmasks[l]) << len - l;
			len -= l;
		}

		if (len === l)
			i1 += buff[k] & bitmasks[l];
		else
			i1 += buff[k] >> l - len & bitmasks[len];
		return i1;
	}
/*
	static getBitMask(data, off, len) {
		let k = off >> 3;
		let l = 8 - (off & 7);
		let ret = 0;

		for (let l = 8 - (off & 7); l <= len; len -= l, l = 8) {
			ret += (data[k++] & bitmasks[l]) << len - l;
			len -= l;
		}

		if (len === l)
			ret += data[k] & bitmasks[l];
		else
			ret += data[k] >> l - len & bitmasks[len];
		return ret;
	}
*/
	/* buffer functions end */ 

	/* hash functions start */
	static recoveryToHash(answer) {
		if (!Utility.wasmMod) {
			answer = answer.toLowerCase().trim();

			// let hash = new Long(0);
			let hash = 0n;
			let index = 0n;
			for (let i = 0; i < answer.length; i++) {
				let rune = answer.charCodeAt(i);
				if (rune >= C_A && rune <= C_Z || rune >= C_0 && rune <= C_9) {
					hash = hash * 47n * (hash - BigInt(rune*6) - BigInt(index*7));
					hash += BigInt(rune - 32) + BigInt(index * rune);
					// hash = hash.mul(47).mul(hash.sub(rune * 6).sub(index * 7));
					// hash = hash.add(rune - 32 + index * rune);
					index++;
				}
			}

			return hash;
		}
		return Utility.wasmMod.hashRecoveryAnswer(answer);
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
		if (!Utility.wasmMod) {
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

		return Utility.wasmMod.usernameToHash(s);
	}

	static hashToUsername(hash) {
		if (!Utility.wasmMod) {
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
		return Utility.wasmMod.hashToUsername(hash);
	}
	/* hash functions end */

	static getDataFileOffset(filename, data) {
		let numEntries = Utility.getUnsignedShort(data, 0);
		let wantedHash = 0;

		filename = filename.toUpperCase();
		for (let k = 0; k < filename.length; k++)
			wantedHash = (((wantedHash * 61) | 0) + filename.charCodeAt(k)) - 32;

		let offset = 2 + numEntries * 10;
		for (let entry = 0; entry < numEntries; entry++) {
			let fileHash = (data[entry * 10 + 2] & 0xff) << 24 | (data[entry * 10 + 3] & 0xff) << 16 | (data[entry * 10 + 4] & 0xff) << 8 | data[entry * 10 + 5] & 0xff;
			let fileSize = (data[entry * 10 + 9] & 0xff) << 16 | (data[entry * 10 + 10] & 0xff) << 8 | data[entry * 10 + 11] & 0xff;

			if (fileHash === wantedHash)
				return offset;

			offset += fileSize;
		}

		return 0;
	}

	static getDataFileLength(filename, data) {
		let numEntries = Utility.getUnsignedShort(data, 0);
		filename = filename.toUpperCase();

		let wantedHash = 0;
		for (let k = 0; k < filename.length; k++)
			wantedHash = (((wantedHash * 61) | 0) + filename.charCodeAt(k)) - 32;

		let offset = 2 + numEntries * 10;
		for (let i1 = 0; i1 < numEntries; i1++) {
			let fileHash = (data[i1 * 10 + 2] & 0xff) << 24 | (data[i1 * 10 + 3] & 0xff) << 16 | (data[i1 * 10 + 4] & 0xff) << 8 | data[i1 * 10 + 5] & 0xff;
			let fileSize = (data[i1 * 10 + 6] & 0xff) << 16 | (data[i1 * 10 + 7] & 0xff) << 8 | data[i1 * 10 + 8] & 0xff;
			let fileSizeCompressed = (data[i1 * 10 + 9] & 0xff) << 16 | (data[i1 * 10 + 10] & 0xff) << 8 | data[i1 * 10 + 11] & 0xff;

			if (fileHash === wantedHash)
				return fileSize;

			offset += fileSizeCompressed;
		}

		return 0;
	}

	static loadData(s, i, abyte0) {
		return Utility.unpackData(s, i, abyte0, null);
	}

	static unpackData(filename, i, archiveData, fileData) {
		let numEntries = (archiveData[0] & 0xFF) << 8 | archiveData[1] & 0xFF;
		let wantedHash = 0;
		filename = filename.toUpperCase();
		for (let l = 0; l < filename.length; l++)
			wantedHash = (((wantedHash * 61) | 0) + filename.charCodeAt(l)) - 32;

		let offset = 2 + numEntries * 10;

		for (let entry = 0; entry < numEntries; entry++) {
			let fileHash = ((archiveData[entry * 10 + 2] & 0xff) << 24) + ((archiveData[entry * 10 + 3] & 0xff) << 16) + ((archiveData[entry * 10 + 4] & 0xff) << 8) + (archiveData[entry * 10 + 5] & 0xff) | 0;
			let fileSize = ((archiveData[entry * 10 + 6] & 0xff) << 16) + ((archiveData[entry * 10 + 7] & 0xff) << 8) + (archiveData[entry * 10 + 8] & 0xff) | 0;
			let fileSizeCompressed = ((archiveData[entry * 10 + 9] & 0xff) << 16) + ((archiveData[entry * 10 + 10] & 0xff) << 8) + (archiveData[entry * 10 + 11] & 0xff) | 0;

			if (fileHash === wantedHash) {
				if (fileData === null)
					fileData = new Int8Array(fileSize + i);

				if (fileSize !== fileSizeCompressed) {
					BZLib.decompress(fileData, fileSize, archiveData, fileSizeCompressed, offset);
					return fileData;
				}
				for (let j = 0; j < fileSize; j++)
					fileData[j] = archiveData[offset + j];

				return fileData;
			}

			offset += fileSizeCompressed;
		}

		return null;
	}

	static initializeWasm(wasm) {
		Utility.wasmMod = wasm;
	}
	
}

let bitmasks = new Int32Array(66);
for (let i in bitmasks)
	bitmasks[i] = (1<<i)-1;

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

// import('../dist/rsc_client').then((wasm) => {
	// console.log(wasm);
	// Utility.initializeWasm(wasm);
// })
// 
// (async () => await import('../dist/rsc_client').then((wasm) => {
	// console.log(wasm);
	// Utility.initializeWasm(wasm);
// }));

// fetch('static/rustyclient.js').then(response => response.arrayBuffer())
// .then(bytes => WebAssembly.instantiate(bytes, {}))
// .then(results => {
	// Utility.wasmMod = results.instance;
	// console.log(results);
	// console.log(results.instance);
	// console.log(results.instance.exports);
// });

// if (Utility.wasmMod) console.log("Got it");

// if (!Utility.wasmMod)
	// (async () => {
		// Load up wasm module to facilitate rust interop
		// all wasm calls to rust will be performed through this single API point
		// Utility.wasmMod = await import('../pkg/rsc_client');
		// console.log(test.toUnsigned().toString(), Utility.wasmMod.hashRecoveryAnswer("hello this is a test"));
	// })();
// else
	// console.info("Wasm module loaded without async parenthetical");

export { Utility as Utility, EngineStates as EngineStates, GameStates as GameStates, GamePanels as GamePanels, WelcomeStates as WelcomeStates };

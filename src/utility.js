const {Enum} = require('./lib/enum');
const BZLib = require('./bzlib');
const FileDownloadStream = require('./lib/net/file-download-stream');
const Long = require('long');

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

	static getBoolean(b) {
		return Utility.getUnsignedByte(b) === 0;
	}
	static getUnsignedByte(byte0) {
		return byte0 & 0xFF;
	}

	static getUnsignedShort(data, off) {
		return (Utility.getUnsignedByte(data[off]) << 8 | Utility.getUnsignedByte(data[off + 1]));
	}

	static getUnsignedInt(data, off) {
		return (Utility.getUnsignedShort(data, off) << 16 | Utility.getUnsignedShort(data, off+2));
	}

	static getUnsignedLong(data, off) {
		return new Long(Utility.getUnsignedInt(data, off + 4), Utility.getUnsignedInt(data, off), true);
	}

	static recoveryToHash(answer) {
		answer = answer.toLowerCase().trim();

		let hash = new Long(0);
		let index = 0;
		for (let i = 0; i < answer.length; i++) {
			let rune = answer.charCodeAt(i);
			if (rune >= C_A && rune <= C_Z || rune >= C_0 && rune <= C_9) {
				hash = hash.mul(47).mul(hash.sub(rune * 6).sub(index * 7));
				hash = hash.add(rune - 32 + index * rune);
				index++;
			}
		}

		return hash;
	}


	static getSignedShort(data, off) {
		let j = Utility.getUnsignedShort(data, off);
		// mimic 16-bit signed integer behavior
		if (j >= 0x8000)
			return j-0x10000;

		return j;
	}

	static getSmart08_32(data, off) {
		let one = Utility.getUnsignedByte(data[off]);
		// Check if we need to read the rest of the data
		if (one < 0x80)
			return one;

		one -= 0x80;
		return one << 24 | Utility.getUnsignedByte(data[off + 1]) << 16 | Utility.getUnsignedByte(data[off + 2]) << 8 | Utility.getUnsignedByte(data[off + 3]);
	}

	static getBitMask(data, off, len) {
		let k = off >> 3;
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

	static uint32ToIpAddress(i) {
		return (i >> 24 & 0xFF) + '.' + (i >> 16 & 0xFF) + '.' + (i >> 8 & 0xFF) + '.' + (i & 0xFF);
	}

	static encodeBase37(s) {
		let username = '';

		for (let i = 0; i < s.length && i <= 12; i++) {
			let rune = s.charCodeAt(i);
			if (rune >= C_BIG_A && rune <= C_BIG_Z)
				rune = (rune+97)-65;
			if (rune >= C_A && rune <= C_Z || rune >= C_0 && rune <= C_9)
				username += String.fromCharCode(rune);
			else
				username += ' ';
		}
		username = username.trim();

		let hash = new Long(0);
		for (let i = 0; i < username.length; i++) {
			let rune = username.charCodeAt(i);
			hash = hash.mul(37);

			if (rune >= C_A && rune <= C_Z)
				hash = hash.add((1 + rune) - 97);
			else if (rune >= C_0 && rune <= C_9)
				hash = hash.add((27 + rune) - 48);
		}

		return hash;
	}

	static hashToUsername(hash) {
		if (hash.lessThan(0))
			return 'invalid_name';
		let username = '';

		while (!hash.eq(0)) {
			let i = hash.mod(37).toInt();
			hash = hash.div(37);
			let afterSpace = hash.mod(37).equals(0);
			let next = ' ';

			if (i > 0) {
				if (i < 27)
					next = String.fromCharCode((i + (afterSpace ? C_BIG_A : C_A)) - 1);
				else
					next = String.fromCharCode((i + C_0) - 27);
			}
			username = next + username;

/*
			if (i === 0) {
				username = ' ' + username;
			} else if (i < 27) {
				if (hash.modulo(37).equals(0))
					username = String.fromCharCode((i + 65) - 1) + username;
				else
					username = String.fromCharCode((i + 97) - 1) + username;
			} else
				username = String.fromCharCode((i + 48) - 27) + username;
*/
		}

		return username;
	}

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
}

const bitmasks = new Int32Array(64);
for (let i in bitmasks)
	bitmasks[i] = (1<<i)-1;

class WelcomeState extends Enum {}
WelcomeState.WELCOME = new WelcomeState('Welcome view');
WelcomeState.NEW_USER = new WelcomeState('New User view');
WelcomeState.EXISTING_USER = new WelcomeState('Existing User view');

class GamePanel extends Enum {}
GamePanel.APPEARANCE = new GamePanel('Avatar Maker');
GamePanel.CHAT = new GamePanel('Game Chat');

let GameStateL = {
	LOGIN: 0,
	WORLD: 1,
};

module.exports = {Utility, GameState: GameStateL, WelcomeState, GamePanel};

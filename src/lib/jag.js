let BZLib = require('../bzlib')

function jagLoad(file, name = "N/A") {
	let data = Buffer.from(file.slice());
	let archiveSize = (data[0] << 16) | (data[1] << 8) | (data[2] & 0xFF);
	let compressedSize = (data[3] << 16) | (data[4] << 8) | (data[5] & 0xFF);
	data = data.slice(6);
	if (archiveSize !== compressedSize) {
		let decompressed = new Uint8Array(archiveSize);
		let size = BZLib.decompress(decompressed, archiveSize, data, compressedSize, 0);
		if (size !== archiveSize)
			throw Error("Archive decompression returned incorrect byte count: expected " + archiveSize, "got", size);
		data = Buffer.from(decompressed);
	} else if (data.length !== compressedSize)
		throw Error("Archive file not correct size: expected " + compressedSize + " got " + data.length);
	let fileCount = data.readUInt16BE(0);
	let dataOffset = 10*fileCount+2;
	let entryData = Buffer.from(data.slice(10*fileCount+2));
	let entrySet = [];
	let entryOffset = 0;
	let offset = 2;
	
	for (let f = 0; f < fileCount; f++) {
		let hash = data.readIntBE(offset, 4);
		offset += 4;
		let sz  = data.readUIntBE(offset, 3);
		offset += 3;
		let csz  = data.readUIntBE(offset, 3);
		offset += 3;
		let buf = entryData.slice(entryOffset, entryOffset+csz)
		if (sz !== csz) {
			let retData = new Uint8Array(sz);
			let dsz = BZLib.decompress(retData, sz, buf, csz, 0);
			if (sz !== dsz)
				throw Error("Decompression for archive entry returned incorrect byte count: expected " + sz + " got " + dsz);
			buf = Buffer.from(retData);
		} else if (buf.length !== sz) {
			throw Error("Entry of archive has incorrect size reported: expected " + sz + " got " + buf.length)
		}
		entrySet[hash] = {
			get internals() {
				return {
					hash,
					offset: entryOffset,
					length: sz,
					compSize: csz,
				};
			},
			length: sz,
			offset: entryOffset,
			data: Uint8Array.from(buf.slice()),
		};
		entryOffset += csz;
	}

	return {
		...entrySet,
		file,
		get: name => entrySet[jagHash(name || 'NOT_FOUND')],
	};
}

function jagHash(name) {
	if (global.wasmMod)
		return global.wasmMod.hashFileName(name)

	let hash = 0;
	name = name.toUpperCase();
	for (let i = 0; i < name.length; i += 1)
		hash = (((hash * 0x3D) | 0) + name.charCodeAt(i)) - 0x20;
	return hash;
}

module.exports = jagLoad;
module.exports.jagHash = jagHash;

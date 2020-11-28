let chatCipher = (() => {
	const specialChars = [
		'\u20ac', '?', '\u201a', '\u0192', '\u201e', '\u2026', '\u2020', '\u2021', '\u02c6',
		'\u2030', '\u0160', '\u2039', '\u0152', '?', '\u017d', '?', '?', '\u2018', '\u2019', '\u201c',
		'\u201d', '\u2022', '\u2013', '\u2014', '\u02dc', '\u2122', '\u0161', '\u203a', '\u0153', '?',
		'\u017e', '\u0178'
	];
	
	let specMap = {};

	const charLens = Uint8Array.of(22, 22, 22, 22, 22, 22, 21, 22, 22, 20, 22, 22, 22, 21, 22, 22,
				22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 3, 8, 22, 16, 22, 16, 17, 7, 13, 13, 13, 16,
				7, 10, 6, 16, 10, 11, 12, 12, 12, 12, 13, 13, 14, 14, 11, 14, 19, 15, 17, 8, 11, 9, 10, 10, 10, 10, 11, 10,
				9, 7, 12, 11, 10, 10, 9, 10, 10, 12, 10, 9, 8, 12, 12, 9, 14, 8, 12, 17, 16, 17, 22, 13, 21, 4, 7, 6, 5, 3,
				6, 6, 5, 4, 10, 7, 5, 6, 4, 4, 6, 10, 5, 4, 4, 5, 7, 6, 10, 6, 10, 22, 19, 22, 14, 22, 22, 22, 22, 22, 22,
				22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22,
				22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22,
				22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22,
				22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22,
				22, 22, 22, 22, 22, 22, 21, 22, 21, 22, 22, 22, 21, 22, 22);

	let cipherBlock = new Int32Array(charLens.length);
	let cipherDictionary = new Int32Array(8);//new Int8Array(8);//new Uint8Array(8);
	let chatBuffer = [];
	let msgBuilder = new String();

	(() => {
		//Initialize the special character map
		for (let i = 0; i < specialChars.length; ++i)
			specMap[specialChars[i]] = String.fromCharCode(i - 128);

		//Initialize cipher blocks
		let blockBuilder = new Int32Array(33);
		let cipherDictIndexTemp = 0;
		for (let initPos = 0; initPos < charLens.length; ++initPos) {
			let initValue = charLens[initPos];
			let builderBitSelector = 1 << (32 - initValue);
			let builderValue = blockBuilder[initValue];
			cipherBlock[initPos] = builderValue;
			let builderValueBit;
			if ((builderValue & builderBitSelector) === 0) {
				builderValueBit = builderValue | builderBitSelector;
				for (let initValueCounter = initValue - 1; initValueCounter > 0; --initValueCounter) {
					let builderValue2 = blockBuilder[initValueCounter];
					if (builderValue != builderValue2)
						break;
					let builderValue2BitSelector = 1 << (32 - initValueCounter);
					if ((builderValue2 & builderValue2BitSelector) === 0)
						blockBuilder[initValueCounter] = builderValue2BitSelector | builderValue2;
					else {
						blockBuilder[initValueCounter] = blockBuilder[initValueCounter - 1];
						break;
					}
				}
			} else {
				builderValueBit = blockBuilder[initValue + -1];
			}
			blockBuilder[initValue] = builderValueBit;
			for (let initValueCounter = initValue + 1; initValueCounter <= 32; ++initValueCounter) {
				if (builderValue === blockBuilder[initValueCounter])
					blockBuilder[initValueCounter] = builderValueBit;
			}
			let cipherDictIndex = 0;
			for (let initValueCounter = 0; initValueCounter < initValue; ++initValueCounter) {
				let builderBitSelector2 = 0x80000000 >>> initValueCounter;
				if ((builderValue & builderBitSelector2) === 0)
					cipherDictIndex++;
				else {
					if (cipherDictionary[cipherDictIndex] === 0)
						cipherDictionary[cipherDictIndex] = cipherDictIndexTemp;

					cipherDictIndex = cipherDictionary[cipherDictIndex];
				}
				if (cipherDictionary.length <= cipherDictIndex) {
					// let newCipherDict = Buffer.concat([cipherDictionary, Buffer.alloc(cipherDictionary.length)]);
					let newCipherDict = new Int32Array(cipherDictionary.length*2);
					for (let i = 0; i < cipherDictionary.length; i++)
						// newCipherDict.writeUInt16LE(cipherDictionary[i], i);
						newCipherDict[i] = cipherDictionary[i];
					// System.arraycopy(cipherDictionary, 0, newCipherDict, 0, cipherDictionary.length);
					cipherDictionary = newCipherDict.slice();
				}
			}
			cipherDictionary[cipherDictIndex] = ~initPos;
			if (cipherDictIndex >= cipherDictIndexTemp)
				cipherDictIndexTemp = cipherDictIndex + 1;
		}
	})()

	function encipher(message) {
		let out = [];
		convertMessageToBytes(message);
		let encipheredByte = 0;
		let outputBitOffset = 0;
		for (let messageIndex = 0; message.length > messageIndex; ++messageIndex) {
			let messageCharacter = chatBuffer[messageIndex] & 0xff;
			let cipherBlockValue = cipherBlock[messageCharacter];
			let initValue = charLens[messageCharacter];

			let outputByteOffset = outputBitOffset >> 3;
			let cipherBlockShifter = 0x7 & outputBitOffset;
			encipheredByte &= -cipherBlockShifter >> 31;
			let outputByteOffset2 = outputByteOffset + ((cipherBlockShifter + initValue - 1) >> 3);
			outputBitOffset += initValue;
			cipherBlockShifter += 24;
			encipheredByte |= (cipherBlockValue >>> cipherBlockShifter);
			out[outputByteOffset] = encipheredByte & 0xFF;
			if (outputByteOffset2 > outputByteOffset) {
				outputByteOffset++;
				cipherBlockShifter -= 8;
				encipheredByte = cipherBlockValue >>> cipherBlockShifter
				out[outputByteOffset] = encipheredByte & 0xFF;
				if (outputByteOffset < outputByteOffset2) {
					outputByteOffset++;
					cipherBlockShifter -= 8;
					encipheredByte = cipherBlockValue >>> cipherBlockShifter
					out[outputByteOffset] = encipheredByte & 0xFF;
					if (outputByteOffset2 > outputByteOffset) {
						outputByteOffset++;
						cipherBlockShifter -= 8;
						encipheredByte = cipherBlockValue >>> cipherBlockShifter
						out[outputByteOffset] = encipheredByte & 0xFF;
						if (outputByteOffset2 > outputByteOffset) {
							cipherBlockShifter -= 8;
							outputByteOffset++;
							encipheredByte = cipherBlockValue << -cipherBlockShifter
							out[outputByteOffset] = encipheredByte & 0xFF;
						}
					}
				}
			}
		}
		return {buffer: Int8Array.from(out.slice()), size: message.length, encSize: (outputBitOffset + 7) >>> 3, };
	}
	function convertMessageToBytes(charSequence) {
		chatBuffer = [];
		for (let messageIndex = 0; messageIndex < charSequence.length; messageIndex++) {
			let c = charSequence.charCodeAt(messageIndex);
			if (c >= 128 && c <= 160)
				chatBuffer[messageIndex] = (specMap[String.fromCharCode(c)] || '?'.charCodeAt(0));
			else
				chatBuffer[messageIndex] = c;
		}
	}

	function decipher(msg) {
		let decipheredLength = msg.size;
		let encSize = msg.encSize || msg.buffer.length;

		let bufferIndex = 0;
		let inIndex = 0;
		let decipherIndex = 0;
		let cipherDictValue;

		chatBuffer = [];
		while (bufferIndex < decipheredLength && inIndex < encSize) {
			let encipheredByte = msg.buffer[inIndex++];
			decipherIndex = encipheredByte < 0 ? cipherDictionary[decipherIndex] : decipherIndex + 1;

			cipherDictValue = cipherDictionary[decipherIndex];
			if (0 > cipherDictValue) {
				chatBuffer[bufferIndex++] =  (~cipherDictValue);
				if (bufferIndex >= decipheredLength)
					break;

				decipherIndex = 0;
			}

			let andVal = 0x40;
			while (andVal > 0) {
				decipherIndex = (encipheredByte & andVal) == 0 ? decipherIndex + 1 : cipherDictionary[decipherIndex];
				if ((cipherDictValue = cipherDictionary[decipherIndex]) < 0) {
					chatBuffer[bufferIndex++] = (~cipherDictValue);
					if (bufferIndex >= decipheredLength)
						break;

					decipherIndex = 0;
				}
				andVal >>= 1;
			}
		}

		msgBuilder = '';
		//Swap bytes for unicode characters
		for (bufferIndex = 0; bufferIndex < decipheredLength; ++bufferIndex) {
			let bufferValue = chatBuffer[bufferIndex] & 0xFF;
			if (bufferValue != 0) {
				if (bufferValue >= 128 && bufferValue < 160)
					bufferValue = specMap[String.fromCharCode(bufferValue - 128)];

				msgBuilder += String.fromCodePoint(bufferValue);
			}
		}
		return {msg: msgBuilder, encSize: encSize};
	}

	function internals() {
		return {chatBuffer, msgBuilder, cipherDictionary, cipherBlock, specialChars, specMap, charLens};
	}

	return {encipher, internals, decipher};
});


export { chatCipher as default, chatCipher, };

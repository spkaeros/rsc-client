import { Utility } from './utility';

let C_TILDE = 126, C_EXCLM = 33, C_PRCNT = 37, C_AT = 64, C_ZERO = '0'.charCodeAt(0), C_NINE = '9'.charCodeAt(0),
		C_ASTERISK = '*'.charCodeAt(0), C_BACKSLASH = '\\'.charCodeAt(0), C_BIG_A = 'A'.charCodeAt(0),
		C_BIG_Z = 'Z'.charCodeAt(0), C_COMMA = ','.charCodeAt(0), C_DOT = '.'.charCodeAt(0), C_J = 'j'.charCodeAt(0),
		C_Q = 'q'.charCodeAt(0), C_SINGLE_QUOTE = '\''.charCodeAt(0), C_SLASH = '/'.charCodeAt(0), C_SPACE = ' '.charCodeAt(0),
		C_V = 'v'.charCodeAt(0), C_X = 'x'.charCodeAt(0), C_Z = 'z'.charCodeAt(0), C_A = 'a'.charCodeAt(0);
let UPPER_MODIFIER = 0x20;
let DEBUGTLD = true, DEBUGWORD = true, forceLowerCase = true;
let CHAT_LIMIT = 80;
let ignoreList = [ 'cook', 'cook\'s', 'cooks', 'seeks', 'sheet' ];
let ENCODER = new TextEncoder('utf-8');
let DECODER = new TextDecoder('utf-8');

class Chat {
	constructor(buff) {
		Filter.readFilteredWords(Buffer.from(Utility.loadData("badenc.txt", 0, buff)));
		Filter.readFilteredHosts(Buffer.from(Utility.loadData("hostenc.txt", 0, buff)));
		Filter.readFilteredHashFragments(Buffer.from(Utility.loadData("fragmentsenc.txt", 0, buff)));
		Filter.readFilteredTLDs(Buffer.from(Utility.loadData("tldlist.txt", 0, buff)));
	}

	decode(input) {
		return Chat.DECODER.decode(input);
	}

	encode(input) {
		return Chat.ENCODER.encode(input);
	}

    filter(input) {
        let inputChars = this.encode(input.toLowerCase());

        Filter.applyDotSlashFilter(inputChars);
        Filter.applyBadwordFilter(inputChars);
        Filter.applyHostFilter(inputChars);
        Filter.heywhathteufck(inputChars);

        for (let ignoreIdx = 0; ignoreIdx < ignoreList.length; ignoreIdx++) {
            for (let inputIgnoreIdx = -1; (inputIgnoreIdx = input.indexOf(ignoreList[ignoreIdx], inputIgnoreIdx + 1)) !== -1;) {
                let ignoreWordChars = (ignoreList[ignoreIdx]);

                for (let ignorewordIdx = 0; ignorewordIdx < ignoreWordChars.length; ignorewordIdx++) {
                    inputChars[ignorewordIdx + inputIgnoreIdx] = ignoreWordChars[ignorewordIdx];
                }
            }
        }

        if (forceLowerCase) {
            inputChars = this.encode(Filter.stripLowerCase(input.toLowerCase()));
        }

        return this.decode(inputChars);
    };

	normalize(msg) {
		let message = new String();
		let letterMod = UPPER_MODIFIER;
msgIter:
		for (let index = 0; index < msg.length; index++) {
			let code = msg.charCodeAt(index);
			if (code === C_TILDE) {
				if (index <= msg.length-5 && msg[index+4] === code) {
					console.debug("Processing absoluteX text input position block")
					let absX = '';
					let posOff = 0;
					for (let posOff = index; posOff < msg.length; posOff++) {
						if (msg[index+posOff] === C_TILDE) {
							letterMod = UPPER_MODIFIER;
							let absXn = Number(absX)%512;
							console.debug("new abs pos for text input:" + absXn);
							index += posOff+1;
							continue msgIter;
						}
						absX = absX.concat(msg[posOff]);
					}
					// message[index] = C_SPACE;
					code = C_SPACE;
				}
			} else if (code === C_AT) {
				if (index <= msg.length-5 && msg[index+4] === code) {
					for (let posOff = index; posOff < msg.length; posOff++)
						if(msg[index+posOff] === C_AT) {
							index += posOff+1;
							letterMod = UPPER_MODIFIER;
							continue msgIter;
						}
					
					letterMod = UPPER_MODIFIER;
					// msg = msg.slice(0,index).concat(msg.slice(index+5));
				} else // Ignore all non-colour related `@` characters as spaces
					code = C_SPACE;
			} else if (code === C_PRCNT || code === C_DOT || code === C_EXCLM) {
				if (code === C_PRCNT)
					// Trigger `Upper Case Text' on '.' characters, and '!' characters
					code = C_SPACE;
				else
					letterMod = UPPER_MODIFIER;
			}
			if (letterMod !== 0 && code >= C_A && code <= C_Z) {
				code ^= letterMod;
				letterMod = 0;
			}
			message = message.concat(String.fromCharCode(code));
		}
		return message;
	}

};

let Filter = class{
    static stripLowerCase(input, dummyVar) {
    	let output = [];
        for (let i = 0; i < input.length; i++) {
            if (output[i] !== C_ASTERISK && Filter.isUpperCase(input[i])) {
                output[i] = input[i];
            }
        }
        return output;
    };

    static applyBadwordFilter(input) {
    	if (!Filter.badList || !Filter.badCharIds)
    		return;
        for (let i = Filter.badList.length - 1; i > -1; i--)
	    	if (Filter.badList[i] && Filter.badCharIds[i])
	            Filter.apply(input, Filter.badList[i], Filter.badCharIds[i]);
        // for (let i = 0; i < 2; i++) {
            // for (let j = Filter.badList.length - 1; j >= 0; j--) {
                // Filter.apply(input, Filter.badList[j], Filter.badCharIds[j]);
            // }
        // }
    }

    static applyHostFilter(input) {
        // for (let i = Filter.hostList.length - 1; i >= 0; i--) {
            // Filter.apply(input, Filter.hostList[i], Filter.hostCharIds[i]);
        // }
    	if (!Filter.hostList || !Filter.hostCharIds)
    		return;
        for (let i = Filter.badList.length - 1; i > -1; i--)
	    	if (Filter.hostList[i] && Filter.hostCharIds[i])
	            Filter.apply(input, Filter.hostList[i], Filter.hostCharIds[i]);
    }

    static applyDotSlashFilter(input) {
        let input1 = input.slice(0);
        Filter.apply(input1, Chat.ENCODER.encode('dot'), null);
        let input2 = input.slice(0);
        Filter.apply(input2, Chat.ENCODER.encode('slash'), null);

        for (let domain of Filter.tldList) {
            Filter.applyTldFilter(input, input1, input2, domain.value, domain.score);
        }
    }

    static applyTldFilter(input, input1, input2, tld, type) {
        if (tld.length > input.length)
            return;

        for (let charIndex = 0; charIndex <= input.length - tld.length; charIndex++) {
            let inputCharCount = charIndex;
            let l = 0;

            while (inputCharCount < input.length) {
                let i1 = 0;
                let current = input[inputCharCount];
                let next = 0;

                if (inputCharCount + 1 < input.length) {
                    next = input[inputCharCount + 1];
                }

                if (l < tld.length && (i1 = Filter.compareLettersNumbers(tld[l], current, next)) > 0) {
                    inputCharCount += i1;
                    l++;
                    continue;
                }

                if (l === 0) {
                    break;
                }

                if ((i1 = Filter.compareLettersNumbers(tld[l - 1], current, next)) > 0) {
                    inputCharCount += i1;
                    continue;
                }

                if (l >= tld.length || !Filter.isSpecial(current)) {
                    break;
                }

                inputCharCount++;
            }

            if (l >= tld.length) {
                let flag = false;
                let startMatch = Filter.getAsteriskCount(input, input1, charIndex);
                let endMatch = Filter.getAsteriskCount2(input, input2, inputCharCount - 1);

                if (DEBUGTLD)
                    console.debug(`Potential tld: ${tld} at char ${charIndex} (type="${type}, startmatch="${startMatch}, endmatch=${endMatch})`);

                if (type === 1 && startMatch > 0 && endMatch > 0)
                    flag = true;

                if (type === 2 && (startMatch > 2 && endMatch > 0 || startMatch > 0 && endMatch > 2))
                    flag = true;

                if (type === 3 && startMatch > 0 && endMatch > 2)
                    flag = true;

                if (flag) {
                    if (DEBUGTLD)
                        console.log(`Filtered tld: ${tld} at char ${charIndex}`);

                    let l1 = charIndex;
                    let i2 = inputCharCount - 1;

                    if (startMatch > 2) {
                        if (startMatch === 4) {
                            let flag1 = false;

                            for (let k2 = l1 - 1; k2 >= 0; k2--) {
                                if (flag1) {
                                    if (input1[k2] !== C_ASTERISK) {
                                        break;
                                    }

                                    l1 = k2;
                                } else if (input1[k2] === C_ASTERISK) {
                                    l1 = k2;
                                    flag1 = true;
                                }
                            }
                        }

                        let flag2 = false;

                        for (let l2 = l1 - 1; l2 >= 0; l2--) {
                            if (flag2) {
                                if (Filter.isSpecial(input[l2])) {
                                    break;
                                }

                                l1 = l2;
                            } else if (!Filter.isSpecial(input[l2])) {
                                flag2 = true;
                                l1 = l2;
                            }
                        }
                    }

                    if (endMatch > 2) {
                        if (endMatch === 4) {
                            let flag3 = false;

                            for (let i3 = i2 + 1; i3 < input.length; i3++) {
                                if (flag3) {
                                    if (input2[i3] !== C_ASTERISK) {
                                        break;
                                    }

                                    i2 = i3;
                                } else if (input2[i3] === C_ASTERISK) {
                                    i2 = i3;
                                    flag3 = true;
                                }
                            }
                        }

                        let flag4 = false;

                        for (let j3 = i2 + 1; j3 < input.length; j3++) {
                            if (flag4) {
                                if (Filter.isSpecial(input[j3])) {
                                    break;
                                }

                                i2 = j3;
                            } else if (!Filter.isSpecial(input[j3])) {
                                flag4 = true;
                                i2 = j3;
                            }
                        }
                    }

                    for (let j2 = l1; j2 <= i2; j2++) {
                        input[j2] = C_ASTERISK;
                    }
                }
            }
        }
    }

    static compareLettersSymbols(filterChar, currentChar, nextChar) {
        filterChar = String.fromCharCode(filterChar);
        currentChar = String.fromCharCode(currentChar);
        nextChar = String.fromCharCode(nextChar);

        if (filterChar === '*') {
            return 0;
        }

        if (filterChar === currentChar) {
            return 1;
        }

        if (filterChar >= 'a' && filterChar <= 'z') {
            if (filterChar === 'e') {
                return currentChar === '3' ? 1 : 0;
            }

            if (filterChar === 't') {
                return currentChar === '7' ? 1 : 0;
            }

            if (filterChar === 'a') {
                return currentChar === '4' || currentChar === '@' ? 1 : 0;
            }

            if (filterChar === 'o') {
                if (currentChar === '0' || currentChar === '*') {
                    return 1;
                }

                return currentChar === '(' && nextChar === ')' ? 2 : 0;
            }

            if (filterChar === 'i') {
                return currentChar === 'y' || currentChar === 'l' || currentChar === 'j' || currentChar === 'l' || currentChar === '!' || currentChar === ':' || currentChar === ';' ? 1 : 0;
            }

            if (filterChar === 'n') {
                return 0;
            }

            if (filterChar === 's') {
                return currentChar === '5' || currentChar === 'z' || currentChar === '$' ? 1 : 0;
            }

            if (filterChar === 'r') {
                return 0;
            }

            if (filterChar === 'h') {
                return 0;
            }

            if (filterChar === 'l') {
                return currentChar === '1' ? 1 : 0;
            }

            if (filterChar === 'd') {
                return 0;
            }

            if (filterChar === 'c') {
                return currentChar === '(' ? 1 : 0;
            }

            if (filterChar === 'u') {
                return currentChar === 'v' ? 1 : 0;
            }

            if (filterChar === 'm') {
                return 0;
            }

            if (filterChar === 'f') {
                return currentChar === 'p' && nextChar === 'h' ? 2 : 0;
            }

            if (filterChar === 'p') {
                return 0;
            }

            if (filterChar === 'g') {
                return currentChar === '9' || currentChar === '6' ? 1 : 0;
            }

            if (filterChar === 'w') {
                return currentChar === 'v' && nextChar === 'v' ? 2 : 0;
            }

            if (filterChar === 'y') {
                return 0;
            }

            if (filterChar === 'b') {
                return currentChar === '1' && nextChar === '3' ? 2 : 0;
            }

            if (filterChar === 'v') {
                return 0;
            }

            if (filterChar === 'k') {
                return 0;
            }

            if (filterChar === 'x') {
                return currentChar === ')' && nextChar === '(' ? 2 : 0;
            }

            if (filterChar === 'j') {
                return 0;
            }

            if (filterChar === 'q') {
                return 0;
            }

            if (filterChar === 'z') {
                return 0;
            }
        }

        if (filterChar >= '0' && filterChar <= '9') {
            if (filterChar === '0') {
                if (currentChar === 'o' || currentChar === 'O') {
                    return 1;
                }

                return currentChar === '(' && nextChar === ')' ? 2 : 0;
            }
            if (filterChar === '1') {
                return currentChar !== 'l' ? 0 : 1;
            }

            if (filterChar === '2') {
                return 0;
            }

            if (filterChar === '3') {
                return 0;
            }

            if (filterChar === '4') {
                return 0;
            }

            if (filterChar === '5') {
                return 0;
            }

            if (filterChar === '6') {
                return 0;
            }

            if (filterChar === '7') {
                return 0;
            }

            if (filterChar === '8') {
                return 0;
            }

            if (filterChar === '9') {
                return 0;
            }
        }

        if (filterChar === '-') {
            return 0;
        }

        if (filterChar === ',') {
            return currentChar === '.' ? 1 : 0;
        }

        if (filterChar === '.') {
            return currentChar === ',' ? 1 : 0;
        }

        if (filterChar === '(') {
            return 0;
        }

        if (filterChar === ')') {
            return 0;
        }

        if (filterChar === '!') {
            return currentChar === 'i' ? 1 : 0;
        }

        if (filterChar === '\'') {
            return 0;
        }

        if (DEBUGWORD) {
            console.log(`Letter=${filterChar} not matched`);
        }

        return 0;
    }
   static getAsteriskCount(input, input1, len) {
       if (len === 0)
           return 2;

       for (let j = len - 1; j >= 0; j--) {
           if (!Filter.isSpecial(input[j]))
               break;

           if (input[j] === C_COMMA || input[j] === C_DOT)
               return 3;
       }

       let filtered = 0;

       for (let l = len - 1; l >= 0; l--) {
           if (!Filter.isSpecial(input1[l])) {
               break;
           }

           if (input1[l] === C_ASTERISK) {
               filtered++;
           }
       }

       if (filtered >= 3) {
           return 4;
       }

       return Filter.isSpecial(input[len - 1]) ? 1 : 0;
   };

   static getAsteriskCount2(input, input1, len) {
       if ((len + 1) === input.length) {
           return 2;
       }

       for (let j = len + 1; j < input.length; j++) {
           if (!Filter.isSpecial(input[j])) {
               break;
           }

           if (input[j] === C_BACKSLASH || input[j] === C_SLASH) {
               return 3;
           }
       }

       let filtered = 0;

       for (let l = len + 1; l < input.length; l++) {
           if (!Filter.isSpecial(input1[l])) {
               break;
           }

           if (input1[l] === C_ASTERISK) {
               filtered++;
           }
       }

       if (filtered >= 5) {
           return 4;
       }

       return Filter.isSpecial(input[len + 1]) ? 1 : 0;
   }

   static apply(input, wordList, charIds) {
       if (wordList.length > input.length)
           return;

       for (let charIndex = 0; charIndex <= input.length - wordList.length; charIndex++) {
           let inputCharCount = charIndex;
           let k = 0;
           let specialChar = false;

           while (inputCharCount < input.length) {
               let l = 0;
               let inputChar = input[inputCharCount];
               let nextChar = 0;

               if ((inputCharCount + 1) < input.length) {
                   nextChar = input[inputCharCount + 1];
               }

               if (k < wordList.length && (l = Filter.compareLettersSymbols(wordList[k], inputChar, nextChar)) > 0) {
                   inputCharCount += l;
                   k++;
                   continue;
               }

               if (k === 0)
                   break;

               if ((l = Filter.compareLettersSymbols(wordList[k - 1], inputChar, nextChar)) > 0) {
                   inputCharCount += l;
                   continue;
               }

               if (k >= wordList.length || !Filter.isNotLowerCase(inputChar))
                   break;

               if (Filter.isSpecial(inputChar) && inputChar !== C_SINGLE_QUOTE)
                   specialChar = true;

               inputCharCount++;
           }

           if (k >= wordList.length) {
               let filter = true;

               if (DEBUGTLD)
                   console.log(`Potential word: ${wordList} at char ${charIndex}`);

               if (!specialChar) {
                   let prevChar = C_SPACE;

                   if ((charIndex - 1) >= 0)
                       prevChar = input[charIndex - 1];

                   let curChar = C_SPACE;

                   if (inputCharCount < input.length)
                       curChar = input[inputCharCount];

                   let prevId = getCharId(prevChar);
                   let curId = getCharId(curChar);

                   if (charIds && Filter.compareCharIds(charIds, prevId, curId))
                       filter = false;
               } else {
                   let flag2 = false;
                   let flag3 = false;

                   if ((charIndex - 1) < 0 || Filter.isSpecial(input[charIndex - 1]) && input[charIndex - 1] !== C_SINGLE_QUOTE) {
                       flag2 = true;
                   }

                   if (inputCharCount >= input.length || Filter.isSpecial(input[inputCharCount]) && input[inputCharCount] !== C_SINGLE_QUOTE) {
                       flag3 = true;
                   }

                   if (!flag2 || !flag3) {
                       let flag4 = false;
                       let j1 = charIndex - 2;

                       if (flag2) {
                           j1 = charIndex;
                       }

                       for (; !flag4 && j1 < inputCharCount; j1++) {
                           if (j1 >= 0 && (!Filter.isSpecial(input[j1]) || input[j1] === C_SINGLE_QUOTE)) {
                               let ac2 = new Uint16Array(3);
                               let k1;

                               for (k1 = 0; k1 < 3; k1++) {
                                   if ((j1 + k1) >= input.length || Filter.isSpecial(input[j1 + k1]) && input[j1 + k1] !== C_SINGLE_QUOTE) {
                                       break;
                                   }

                                   ac2[k1] = input[j1 + k1];
                               }

                               let flag5 = true;

                               if (k1 === 0) {
                                   flag5 = false;
                               }

                               if (k1 < 3 && j1 - 1 >= 0 && (!Filter.isSpecial(input[j1 - 1]) || input[j1 - 1] === C_SINGLE_QUOTE)) {
                                   flag5 = false;
                               }

                               if (flag5 && !Filter.containsFragmentHashes(ac2)) {
                                   flag4 = true;
                               }
                           }
                       }

                       if (!flag4) {
                           filter = false;
                       }
                   }
               }

               if (filter) {
                   if (DEBUGWORD) {
                       console.log(`Filtered word: ${wordList} at char ${charIndex}`);
                   }

                   for (let i1 = charIndex; i1 < inputCharCount; i1++) {
                       input[i1] = C_ASTERISK;
                   }
               }
           }
       }
   }

   static getCharId(c) {
       if (c >= C_A && c <= C_Z)
           return c - C_A + 1;
       if (c === C_SINGLE_QUOTE)
           return 28;
       if (c >= C_ZERO && c <= C_NINE)
           return c - C_ZERO + 29;
       return 27;
   }

   static heywhathteufck(input) {
       let digitIndex = 0;
       let fromIndex = 0;
       let k = 0;
       let l = 0;

       while ((digitIndex = Filter.indexOfDigit(input, fromIndex)) != -1) {
           let flag = false;

           for (let i = fromIndex; i >= 0 && i < digitIndex && !flag; i++) {
               if (!Filter.isSpecial(input[i]) && !Filter.isNotLowerCase(input[i])) {
                   flag = true;
               }
           }

           if (flag) {
               k = 0;
           }

           if (k === 0) {
               l = digitIndex;
           }

           fromIndex = Filter.indexOfNonDigit(input, digitIndex);

           let j1 = 0;

           for (let k1 = digitIndex; k1 < fromIndex; k1++) {
               j1 = (j1 * 10 + input[k1]) - 48;
           }

           if (j1 > 0xFF || fromIndex - digitIndex > 8) {
               k = 0;
           } else {
               k++;
           }

           if (k === 4) {
               for (let i = l; i < fromIndex; i++) {
                   input[i] = C_ASTERISK;
               }

               k = 0;
           }
       }
   }

   static indexOfDigit(input, fromIndex) {
       for (let i = fromIndex; i < input.length && i >= 0; i++) {
           if (input[i] >= C_ZERO && input[i] <= C_NINE) {
               return i;
           }
       }

       return -1;
   }

   static indexOfNonDigit(input, fromIndex) {
       for (let i = fromIndex; i < input.length && i >= 0; i++) {
           if (input[i] < C_ZERO && input[i] > C_NINE) {
               return i;
           }
       }

       return -1;
   }

   static containsFragmentHashes(input) {
       let notNum = true;

       for (let i = 0; i < input.length; i++)
           if (!isDigit(input[i]) && input[i] !== 0)
               notNum = false;

       if (notNum)
           return true;

       let inputHash = wordToHash(input);
       let first = 0;
       let last = hashFragments.length - 1;

       if (inputHash === hashFragments[first] || inputHash === hashFragments[last])
           return true;

       while (first !== last && first + 1 != last) {
           let middle = ((first + last) / 2) | 0;

           if (inputHash === hashFragments[middle])
               return true;

           if (inputHash < hashFragments[middle])
               last = middle;
           else
               first = middle;
       }

       return false;
   };

   static isSpecial(c) {
       return !isLetter(c) && !isDigit(c);
   };

   static wordToHash(word) {
       if (word.length > 6)
           return 0;

       let hash = 0;
       for (let i = 0; i < word.length; i++) { 
           let c = word[word.length - i - 1];

           if (c >= C_A && c <= C_Z) {
               hash = (hash * 38 + c - 97 + 1) | 0;
           } else if (c === C_SINGLE_QUOTE) {
               hash = (hash * 38 + 27) | 0;
           } else if (c >= C_ZERO && c <= C_NINE) {
               hash = (hash * 38 + c - 48 + 28) | 0;
           } else if (c !== 0) {
               if (DEBUGWORD)
                   console.debug(`wordToHash failed on ${Chat.DECODER.decode(word)}`);
               return 0;
           }
       }

       return hash;
   };

	static readFilteredTLDs(buffer) {
		// if (buffer.availableBytes() < 5)
			// return;
		let offset = 4;
    	// offset += 4;
	    for (let i = 0; i < buffer.readUInt32BE(0); i++) {
	        const score = buffer.readUIntBE(offset, 1);
	        offset += 1;
	        // if (buffer.availableBytes() < 1)
	        	// return;
	        let wordLen = buffer.readUIntBE(offset, 1);
	        offset += 1;
	        let value = buffer.slice(offset, offset+wordLen);
	        offset += wordLen;
	        
	        
	        if (value) {
	            Filter.tldList.push({
	            	score,
	            	value,
	            });
	        }
	    }
	}

	static readFilteredWords(buffer) {
	    let wordCount = buffer.readUInt32BE(0);
	    // Filter.badList.length = wordCount;
	    // Filter.badCharIds.length = wordCount;
	    // Filter.readBuffer(buffer, Filter.badList, Filter.badCharIds);
	    // let {badList, badCharIds} = Filter.unmarshal(buffer, wordCount);
	    // for (let i = 0; i < badList.length; i++)
	    	// Filter.badList[i] = badList[i];
	    // for (let i = 0; i < badCharIds.length; i++)
	    	// Filter.badCharIds[i] = badCharIds[i];
	    Filter.unmarshal(buffer, wordCount, Filter.badList, Filter.badCharIds);
	}

	static readFilteredHashFragments(buffer) {
		let offset = 0;
		let len = buffer.readUInt32BE(offset);
    	offset += 4;
	    for (let i = 0; i < len; i++) {
	        Filter.hashFragments[i] = buffer.readUIntBE(offset, 2);
	    	offset += 2;
	    }
	};

	static readFilteredHosts(buffer) {
		let offset = 0;
	    let wordCount = buffer.readUInt32BE(0);
	    // Filter.hostList.length = wordCount
	    // Filter.hostCharIds.length = wordCount;
	    // readBuffer(buffer, Filter.hostList, Filter.hostCharIds);
	    Filter.unmarshal(buffer, wordCount, Filter.hostList, Filter.hostCharIds);
	};

   static compareCharIds(charIdData, prevCharId, curCharId) {
       let first = 0;
       if (charIdData[first][0] === prevCharId && charIdData[first][1] === curCharId)
           return true;

       let last = charIdData.length - 1;
       if (charIdData[last][0] === prevCharId && charIdData[last][1] === curCharId)
           return true;

       while (first !== last && (first + 1) !== last) {
           let middle = ((first + last) / 2) | 0;

           if (charIdData[middle][0] === prevCharId && charIdData[middle][1] === curCharId) {
               return true;
           }

           if (prevCharId < charIdData[middle][0] || prevCharId === charIdData[middle][0] && curCharId < charIdData[middle][1]) {
               last = middle;
           } else {
               first = middle;
           }
       }

       return false;
   }

	static unmarshal(buffer, wordCount, wordList, idList) {
		let offset = 4;
		for (let i = 0; i < wordCount; i++) {
			let currentWord = '';
			let wordLen = buffer.readUIntBE(offset, 1);
			offset++;
			wordList.push(buffer.slice(offset, offset+wordLen).toString());
			offset += wordLen;

			let idCount = buffer.readUIntBE(offset, 4);
			offset += 4;
			for (let j = 0; j < idCount; j++)
				idList.push([ buffer.readUIntBE(offset++, 1), buffer.readUIntBE(offset++, 1) ]);
		}
	};
	static readBuffer(buffer, wordCount, charIds) {
		let offset = 4;
		let wordList = new Array(wordCount);
		for (let i = 0; i < wordList.length; i++) {
			let currentWord = '';
			let wordLen = buffer.readUIntBE(offset, 1);
			offset += 1;
			wordList.push(buffer.slice(offset, offset+wordLen).toString());
			offset += wordLen;
			// wordList[i] = buffer.getString(wordLen)

			charIds = new Array(buffer.readUIntBE(offset, 4));
			offset += 4;
			for (let j = 0; j < charIds.length; j++)
				charIds[j] = [ buffer.readUIntBE(offset++, 1), buffer.readUIntBE(offset++, 1) ];
		}
	};

	static isNumeral(c) {
		return c >= C_ZERO && c <= C_NINE;
	};

	static isLatin(c) {
		return (c >= C_A && C <= C_Z) || (c >= C_BIG_A && c <= C_BIG_Z);
	};
   static isNotLowerCase(c) {
       if (c < C_A || c > C_Z) {
           return true;
       }

       return c === C_V || c === C_X || c === C_J || c === C_Q || c === C_Z;
   }

   static isLetter(c) {
       return c >= C_A && c <= C_Z || c >= C_BIG_A && c <= C_BIG_Z;
   }

   static isDigit(c) {
       return c >= C_ZERO && c <= C_NINE;
   }

   static isLowerCase(c) {
       return c >= C_A && c <= C_Z;
   }

   static isUpperCase(c) {
       return c >= C_BIG_A && c <= C_BIG_Z;
   }
};

Object.defineProperty(Chat, "ENCODER", {
	get: () => {
		return ENCODER;
	},
	set: undefined,
});

Object.defineProperty(Chat, "DECODER", {
	get: () => {
		return DECODER;
	},
	set: undefined,
});

Object.defineProperty(Filter, 'tldList', {
	get: () => {
		return Filter._tldList || [];
	},
	set: (l) => {
		Filter._tldList = l;
	},
});

Object.defineProperty(Filter, 'badList', {
	get: () => {
		return Filter._badList || [];
	},
	set: (l) => {
		Filter._badList = l;
	},
});
Object.defineProperty(Filter, 'hostList', {
	get: () => {
		return Filter._hostList || [];
	},
	set: (l) => {
		Filter._hostList = l;
	},
});
Object.defineProperty(Filter, 'hostCharIds', {
	get: () => {
		return Filter._hostCharIds || [];
	},
	set: (l) => {
		Filter._hostCharIds = l;
	},
});
Object.defineProperty(Filter, 'badCharIds', {
	get: () => {
		return Filter._badCharIds || [];
	},
	set: (l) => {
		Filter._badCharIds = l;
	},
});
Object.defineProperty(Filter, 'hashFragments', {
	get: () => {
		return Filter._hashFragments || [];
	},
	set: (l) => {
		Filter._hashFragments = l;
	},
});

export { Chat as Chat, Filter as Filter };
// module.exports.Chat = Chat;
// module.exports.Filter = Filter;

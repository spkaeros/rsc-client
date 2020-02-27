// const charMap = new TextEncoder('utf8').encode(' etaoihnsrdlumwcyfgpbvkxjqz0123456789 !?.,:;()-&*\\\'@#+=£$%"[]');
const encoder = new TextEncoder('utf-8');
const decoder = new TextDecoder('utf-8');

const C_SPACE = 32;
const C_EXCLM = 33;
const C_PRCNT = 37;
const C_DOT = 46;
const C_COLON = 58;
const C_AT = 64;
const C_A = 97;
const C_Z = 122;
const C_CENT = 65504;

let normalize = msg => {
    let nextCaseMod = C_CENT;
    for (let index = 0; index < msg.length; index++) {
        if (msg[index] === C_AT) {
            if (index === 4 && msg[index-4] === C_AT)
                nextCaseMod = C_CENT;
            else if (index === 0 && msg[index+4] === C_AT) {
                nextCaseMod = 0;
            } else {
                msg[index] = C_SPACE;
            }
        } else if (msg[index] === C_PRCNT) {
            msg[index] = C_SPACE;
        } else if (msg[index] === C_DOT || msg[index] === C_EXCLM) {
            nextCaseMod = C_CENT;
        } else if (msg[index] >= C_A && msg[index] <= C_Z) {
            msg[index] += nextCaseMod;
            nextCaseMod = 0;
        }
    }
    return msg;
};

const decodeString = buff => {
    return decoder.decode(normalize(buff));
    // let msg = new Uint8Array(100);
    // let bitsBuf = -1;
    // let off = 0;
    // // we read lower 4 bits, see if they are of use right now, and if not stash them
    // // then read upper 4 bits and add the two halfs to get your next message characters alphabet idx.
    // // repeat until all data is exhausted
    // for (let current of buff) {
    //     for (let curHalf of [(current >> 4) & 0xF, current & 0xF]) {
    //         if (bitsBuf === -1) {
    //             if (curHalf < 13) {
    //                 msg[off++] = charMap[curHalf];
    //             } else {
    //                 bitsBuf = curHalf;
    //             }
    //         } else {
    //             msg[off++] = charMap[((bitsBuf << 4) | curHalf) - 195];
    //             bitsBuf = -1;
    //         }
    //     }
    // }
    
    // return String(normalize(msg.slice(0, off)).map(c => String.fromCharCode(c)).join(''));
};

const encodeString = (s) => {
    if (s.length > 80) {
        s = s.slice(0, 80);
    }
    s = s.toLowerCase();
    
    return encoder.encode(s);
    // let off = 0;
    // let msg = new Uint8Array(100);
    // let bitBuf = -1;
    //
    // for (let k = 0; k < s.length; k++) {
    //     let foundCharMapIdx = 0; // 0 is space key, if no matches default to it.
    //
    //     for (let n = 0; n < charMap.length; n++) {
    //         if (s.charCodeAt(k) === charMap[n]) {
    //             foundCharMapIdx = n;
    //             break;
    //         }
    //     }
    //     if (foundCharMapIdx > 12) {
    //         // why rly?
    //         foundCharMapIdx += 195;
    //     }
    //
    //     if (bitBuf === -1) {
    //         if (foundCharMapIdx < 13) {
    //             bitBuf = foundCharMapIdx;
    //         } else {
    //             msg[off++] = foundCharMapIdx & 0xFF;
    //         }
    //     } else if (foundCharMapIdx < 13) {
    //         msg[off++] = (bitBuf << 4) + foundCharMapIdx & 0xFF;
    //         bitBuf = -1;
    //     } else {
    //         msg[off++] = (bitBuf << 4) + (foundCharMapIdx >> 4) & 0xFF;
    //         bitBuf = foundCharMapIdx & 0xF;
    //     }
    // }
    //
    // if (bitBuf !== -1) {
    //     msg[off++] = (bitBuf << 4) & 0xFF;
    // }
    //
    // return msg.slice(0, off);
};

module.exports = {decodeString, encodeString};

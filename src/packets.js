let xtea = require('xtea');
let VERSION = require('./version');
let OPS = require('./opcodes/client');
let rng = require('./lib/isaac');
let Packet = require('./packet');
let {Utility} = require('./utility');
let {encryptBytes} = require('./rsa');

let inCipher = void 0, outCipher = void 0;

function PacketBuilder(opcode = 0) {
	let frame = Buffer.alloc(5000);
	let caret = 0;
	frame[caret++] = opcode;

	return {
		set opcode(o) {
			// opcode = o;
			frame[0] = o;
		},
		get opcode() {
			return frame[0];
		},
		get packet() {
			let data = Buffer.concat([Buffer.alloc(2), frame.slice(0, caret)]);
			// let op = frame[0] & 0xFF;
			// if (op && outCipher)
				// op = data[2] = (frame[0] + outCipher.random()) & 0xFF;
			let headerLen = 0;
			if (caret >= 160) {
				data[0] = ((caret >>> 8) + 160) & 0xFF;
				data[1] = caret & 0xFF;
			} else {
				data[0] = caret & 0xFF;
				data[1] = data[data.length-1];
//				if (caret <= 0)
//					data[1] = op;
				data = data.slice(0, -1);
			}
			return data;
		},
		put(b) {
			if (caret+1 < 5000)
				frame.writeUInt8(b & 0xFF, caret++);
			return this;
		},
		putByte(b) {
			if (caret+1 < 5000)
				frame.writeUInt8(b & 0xFF, caret++);
			return this;
		},
		putBoolean(b) {
			if (caret+1 < 5000)
				frame.writeUInt8(b ? 1 : 0, caret++);
			return this;
		},
		putBool(b) {
			if (caret+1 < 5000)
				frame.writeUInt8(b ? 1 : 0, caret++);
			return this;
		},
		putString(s) {
			if (typeof s !== 'string')
				throw Error('Type of string put into packet was not a string');

			// this.putUtfString(s);
			for (let b of Buffer.from(s))
				this.put(b);
			return this;
		},
		putLong(l) {
			if (typeof l === "number")
				l = BigInt(l);
			if (typeof l !== "bigint") 
				throw Error('Type of alleged 64 bit uint is not a bigint!')

			if (caret+8 < 5000) {
				frame.writeUInt8(Number(l >> 56n & 0xFFn), caret);
				frame.writeUInt8(Number(l >> 48n & 0xFFn), caret+1);
				frame.writeUInt8(Number(l >> 40n & 0xFFn), caret+2);
				frame.writeUInt8(Number(l >> 32n & 0xFFn), caret+3);
				frame.writeUInt8(Number(l >> 24n & 0xFFn), caret+4);
				frame.writeUInt8(Number(l >> 16n & 0xFFn), caret+5);
				frame.writeUInt8(Number(l >> 8n & 0xFFn), caret+6);
				frame.writeUInt8(Number(l & 0xFFn), caret+7);
				caret += 8;
			}
			return this;
		},
		putUint64(l) {
			if (typeof l === "number")
				l = BigInt(l);
			if (typeof l !== "bigint") 
				throw Error('Type of alleged 64 bit uint is not a bigint!')

			if (caret+8 < 5000) {
				frame.writeUInt8(Number(l >> 56n & 0xFFn), caret);
				frame.writeUInt8(Number(l >> 48n & 0xFFn), caret+1);
				frame.writeUInt8(Number(l >> 40n & 0xFFn), caret+2);
				frame.writeUInt8(Number(l >> 32n & 0xFFn), caret+3);
				frame.writeUInt8(Number(l >> 24n & 0xFFn), caret+4);
				frame.writeUInt8(Number(l >> 16n & 0xFFn), caret+5);
				frame.writeUInt8(Number(l >> 8n & 0xFFn), caret+6);
				frame.writeUInt8(Number(l & 0xFFn), caret+7);
				caret += 8;
			}
			return this;
		},
		putInt(i) {
			if (caret+4 < 5000) {
				frame.writeUInt8(i >>> 24 & 0xFF, caret);
				frame.writeUInt8(i >>> 16 & 0xFF, caret+1);
				frame.writeUInt8(i >>> 8 & 0xFF, caret+2);
				frame.writeUInt8(i & 0xFF, caret+3);
				caret += 4;
			}
			return this;
		},
		putUint32(i) {
			if (caret+4 < 5000) {
				frame.writeUInt8(i >>> 24 & 0xFF, caret);
				frame.writeUInt8(i >>> 16 & 0xFF, caret+1);
				frame.writeUInt8(i >>> 8 & 0xFF, caret+2);
				frame.writeUInt8(i & 0xFF, caret+3);
				caret += 4;
			}
			return this;
		},
		putBuffer(buf) {
			this.putShort(buf.length);
			for (let b of Buffer.from(buf))
			// for (let b = 0; b < buf.length; b++)
				frame.writeUInt8(b & 0xFF, caret++);
			return this;
		},
		putBytes(buf) {
			for (let b = 0; b < buf.length; b++)
				frame.writeUInt8(buf[b] & 0xFF, caret++);
			return this;
		},
		putSmart08_16(i) {
			if (i < 0x80) {
				frame.writeUInt8(i, caret++);
			} else {
				frame.writeUInt8(((i >>> 8) + 0x80) & 0xFF, caret++);
				frame.writeUInt8(i & 0xFF, caret++);
			}
			return this;
		},
		putUtfString(buf) {
			for (let b of Buffer.from(buf))
				frame.writeUInt8(b, caret++);
			// for (let i = 0; i < buf.length; i++)
			return this;
		},
		putShort(i) {
			if (caret+2 < 5000) {
				frame.writeUInt8((i >>> 8) & 0xFF, caret++);
				frame.writeUInt8(i & 0xFF, caret++);
			}
			return this;
		},
		putUint16(i) {
			if (caret+2 < 5000) {
				frame.writeUInt8((i >>> 8) & 0xFF, caret++);
				frame.writeUInt8(i & 0xFF, caret++);
			}
			return this;
		},
		putUint(i, sz = 0) {
			if (sz > 0) {
				switch(sz) {
				case 8:
				case 7:
				case 6:
				case 5:
					this.putUint64(i);
					break;
				case 4:
				case 3:
					this.putUint32(i);
					break;
				case 2:
					this.putUint16(i);
					break;
				case 1:
					this.put(i);
					break;
				default:
					break;
				}
				return this;
			}
			if (typeof i === 'bigint') {
				if (i > 0xFFFFFFFFn) {
					this.putUint64(i);
					return this;
				}
				i = Number(i);
			}

			if (i <= 0xFF) {
				// fits in one byte
				this.put(i);
			} else if(i <= 0xFFFF) {
				// fits in two bytes
				this.putUint16(Number(i));
			} else if(i <= 0xFFFFFFFF) {
				// fits in 4 bytes
				this.putUint32(i);
			} else {
				// fits in >4 bytes, shove into 8 bytes...
				this.putUint64(i);
			}
			return this;
		},
	}
}

function bare(opcode) {
	return new PacketBuilder(opcode);
}

module.exports = {
	LOGIN: (username, password, reconnecting = false) => {
		let keyWords = Buffer.alloc(6);
		crypto.getRandomValues(keyWords);
		inCipher = rng();
		inCipher.seed(keyWords.slice(0, 4))
		outCipher = rng();
		outCipher.seed(keyWords.slice(0, 4))
		let keys = Buffer.alloc(24);
		for (let i = 0; i < 4; i++)
			keys.writeUInt32BE(keyWords[i], i<<2);
		let p = new PacketBuilder(OPS.LOGIN);
		// let p = new PacketBuilder(OPS.LOGIN);
		p.putBool(reconnecting);
		p.putInt(VERSION.CLIENT);
		// RSA block structure is as follows:
		//  -  Single constant byte with value 0xA, likely used as a checksum to identify when the block failed decyption
		//  -  16 random bytes, making up 4x32bit integers; used to seed ISAAC opcode cipher and XTEA username block
		//  -  Password as plaintext string, always padded to take 20 bytes long using a single whitespace char (0x32), terminated by a NULL byte.
		//  -  8 more random bytes, this could either be a nonce, or used as an IV to ensure the block is semantically secure.
		p.putBuffer(Utility.rsaEncrypt(Buffer.concat([Buffer.of(10), keys.slice(0, 16), Buffer.from(password, 'utf-8'), Buffer.alloc(19-password.length, 0x20), Buffer.of(0), keys.slice(16, 24)])));
		// XTEA block structure as follows:
		//  - Single NULL byte
		//  - 24 random bytes of data, this is probably an IV to make sure the XTEA block is semantically secure, but also could be a nonce.
		//  - Username, encoded as a UTF-8 string, using a NULL terminating byte.
		//  - Single NULL byte
		p.putBuffer(xtea.encrypt(Buffer.concat([Buffer.of(0), keys, Buffer.from(username), Buffer.of(0)]), keys));
		return p;
	},
	ACCEPT_TRADE_TWO: () => bare(OPS.TRADE_CONFIRM_ACCEPT),
	ACCEPT_TRADE_ONE: () => bare(OPS.TRADE_ACCEPT),
	DECLINE_TRADE: () => bare(OPS.TRADE_DECLINE),
	ACCEPT_DUEL_ONE: () => bare(OPS.DUEL_ACCEPT),
	ACCEPT_DUEL_TWO: () => bare(OPS.DUEL_CONFIRM_ACCEPT),
	DECLINE_DUEL: () => bare(OPS.DUEL_DECLINE),
	CLOSE_BANK: () => bare(OPS.BANK_CLOSE),
	CLOSE_SHOP: () => bare(OPS.SHOP_CLOSE),
	PING: () => bare(OPS.PING),
	LOGOUT: () => bare(OPS.LOGOUT),
	DISCONNECT: () => bare(OPS.CLOSE_CONNECTION),
	UNEQUIP: (item) => {
		let p = new PacketBuilder(OPS.INV_UNEQUIP);
		p.putShort(item);
		return p;
	},
	EQUIP: (item) => {
		let p = new PacketBuilder(OPS.INV_WEAR);
		p.putShort(item);
		return p;
	},
	INVENTORY_ACTION: (item) => {
		let p = new PacketBuilder(OPS.INV_CMD);
		p.putShort(item);
		return p;
	},
	DROP_ITEM: (item) => {
		let p = new PacketBuilder(OPS.INV_DROP);
		p.putShort(item);
		return p;
	},
	CAST_INVENTORY: (target, spell) => {
		let p = new PacketBuilder(OPS.CAST_INVITEM);
		p.putShort(target);
		p.putShort(spell);
		return p;
	},
	ON_BOUNDARY: (x, y, target, invItem) => {
		let p = new PacketBuilder(OPS.USEWITH_WALLOBJECT);
		p.putShort(x + global.ctx.regionX);
		p.putShort(y + global.ctx.regionY);
		p.putByte(target);
		p.putShort(invItem);
		return p;
	},
	BOUNDARY_ACTION: (click, x, y, target) => {
		let p = new PacketBuilder(click === 0 ? OPS.WALL_OBJECT_COMMAND1 : OPS.WALL_OBJECT_COMMAND2);
		p.putShort(x + global.ctx.regionX);
		p.putShort(y + global.ctx.regionY);
		p.putByte(target);
		return p;
	},
	CAST_SCENARY: (x, y, spell) => {
		let p = new PacketBuilder(OPS.CAST_OBJECT);
		p.putShort(x + global.ctx.regionX);
		p.putShort(y + global.ctx.regionY);
		p.putShort(spell);
		return p;
	},
	ON_SCENARY: (x, y, invItem) => {
		let p = new PacketBuilder(OPS.USEWITH_OBJECT);
		p.putShort(x + global.ctx.regionX);
		p.putShort(y + global.ctx.regionY);
		p.putShort(invItem);
		return p;
	},
	SCENARY_ACTION: (click, x, y) => {
		let p = new PacketBuilder(click === 0 ? OPS.OBJECT_CMD1 : OPS.OBJECT_CMD2);
		p.putShort(x + global.ctx.regionX);
		p.putShort(y + global.ctx.regionY);
		return p;
	},
	FOLLOW: target => {
		let p = new PacketBuilder(OPS.PLAYER_FOLLOW);
		p.putShort(target);
		return p;
	},
	SHOP_ACTION: (id, cost, buying) => {
		let p = new PacketBuilder(buying ? OPS.SHOP_BUY : OPS.SHOP_SELL);
		p.putShort(id);
		p.putInt(cost);
		return p;
	},
	CAST_NPC: (target, item) => {
		let p = new PacketBuilder(OPS.CAST_NPC);
		p.putShort(target);
		p.putShort(item);
		return p;
	},
	CAST_PLAYER: (target, item) => {
		let p = new PacketBuilder(OPS.CAST_PLAYER);
		p.putShort(target);
		p.putShort(item);
		return p;
	},
	ON_NPC: (target, item) => {
		let p = new PacketBuilder(OPS.USEWITH_NPC);
		p.putShort(target);
		p.putShort(item);
		return p;
	},
	ON_PLAYER: (target, item) => {
		let p = new PacketBuilder(OPS.USEWITH_PLAYER);
		p.putShort(target);
		p.putShort(item);
		return p;
	},
	TALK_NPC: target => {
		let p = new PacketBuilder(OPS.NPC_TALK);
		p.putShort(target);
		return p;
	},
	NPC_ACTION: target => {
		let p = new PacketBuilder(OPS.NPC_CMD);
		p.putShort(target);
		return p;
	},
	ATTACK_NPC: target => {
		let p = new PacketBuilder(OPS.NPC_ATTACK);
		p.putShort(target);
		return p;
	},
	ATTACK_PLAYER: target => {
		let p = new PacketBuilder(OPS.PLAYER_ATTACK);
		p.putShort(target);
		return p;
	},
	REQUEST_TRADE: target => {
		let p = new PacketBuilder(OPS.PLAYER_TRADE);
		p.putShort(target);
		return p;
	},
	REQUEST_DUEL: target => {
		let p = new PacketBuilder(OPS.PLAYER_DUEL);
		p.putShort(target);
		return p;
	},
	CAST_SELF: spell => {
		let p = new PacketBuilder(OPS.CAST_SELF);
		p.putShort(spell);
		return p;
	},
	CAST_GROUND: (x, y, spell) => {
		let p = new PacketBuilder(OPS.CAST_GROUND);
		p.putShort(x+global.ctx.regionX);
		p.putShort(y+global.ctx.regionY);
		p.putShort(spell);
		return p;
	},
	COMMAND: (s) => {
		let p = new PacketBuilder(OPS.COMMAND);
		p.put(0);
		p.putUtfString(s);
		p.put(0);
		return p;
	},
	CHAT: (s, len = s.length) => {
		let p = new PacketBuilder(OPS.CHAT);
		if (!s || !s.length)
			s = '', len = 0;
		p.putSmart08_16(len);
		p.putUtfString(s);
		return p;
	},
	FIGHT_STYLE: (idx) => {
		let p = new PacketBuilder(OPS.COMBAT_STYLE);
		p.putByte(idx);
		return p;
	},
	CHOOSE_MENU: (idx) => {
		let p = new PacketBuilder(OPS.CHOOSE_OPTION);
		p.putByte(idx);
		return p;
	},
	TOGGLE_PRAYER: (idx, on) => {
		let p = new PacketBuilder(on ? OPS.PRAYER_ON : OPS.PRAYER_OFF);
		p.putByte(idx);
		return p;
	},
	BANK_ACTION: (slot, amount, withdraw) => {
		let p = new PacketBuilder(withdraw ? OPS.BANK_WITHDRAW : OPS.BANK_DEPOSIT);
		p.putShort(slot);
		p.putInt(amount);
		p.putInt(withdraw ? 0x12345678 : 0x87654321);
		return p;
	},
	TRADE_ITEMS: (count) => {
		let p = new PacketBuilder(OPS.TRADE_ITEM_UPDATE);
		p.putByte(count);
		for (let i = 0; i < count; i++) {
			p.putShort(global.ctx.tradeItems[i]);
			p.putInt(global.ctx.tradeItemCount[i]);
		}
		return p;
	},
	SETTINGS: (idx, value) => {
		let p = new PacketBuilder(OPS.SETTINGS_GAME);
		p.putByte(idx);
		p.putBool(value);
		return p;
	},
	PM: (u, s, len = s.length) => {
		let p = new PacketBuilder(OPS.PM);
		p.putLong(u);
		p.putUtfString(s);
		return p;
	},
	REMOVE_FRIEND: (u) => {
		let p = new PacketBuilder(OPS.FRIEND_REMOVE);
		p.putLong(u);
		return p;
	},
	CHANGE_PASSWORD: (oldp, newp) => {
		let p = new PacketBuilder(OPS.CHANGE_PASSWORD);
		p.putString(oldp);
		p.putString(newp);
		return p;
	},
	REMOVE_IGNORE: (u) => {
		let p = new PacketBuilder(OPS.IGNORE_REMOVE);
		p.putLong(u);
		return p;
	},
	ADD_FRIEND: (u) => {
		let p = new PacketBuilder(OPS.FRIEND_ADD);
		p.putLong(u);
		return p;
	},
	ADD_IGNORE: (u) => {
		let p = new PacketBuilder(OPS.IGNORE_ADD);
		p.putLong(u);
		return p;
	},
	PRIVACY_SETTINGS: (pub, priv, trade, duel) => {
		let p = new PacketBuilder(OPS.SETTINGS_PRIVACY);
		p.putBoolean(pub);
		p.putBoolean(priv);
		p.putBoolean(trade);
		p.putBoolean(duel);
		return p;
	},
	REGISTER: (username, password) => {
		let p = new PacketBuilder(OPS.REGISTER);
		p.putShort(VERSION.CLIENT);
		p.putLong(Utility.usernameToHash(username));
		p.putString(password);
		return p;
	},
	REPORT_ABUSE: (name, offenceType, action) => {
		let p = new PacketBuilder(OPS.REPORT_ABUSE);
		p.putLong(Utility.usernameToHash(name));
		p.putByte(offenceType);
		p.putByte(action);
		return p;
	},
	CHANGE_APPEARANCE: (gender, headType, bodyType, legType, hairColor, bodyColor, legColor, skinColor) => {
		let p = new PacketBuilder(OPS.APPEARANCE);
		p.putByte(gender);
		p.putByte(headType);
		p.putByte(bodyType);
		p.putByte(legType);
		p.putByte(hairColor);
		p.putByte(bodyColor);
		p.putByte(legColor);
		p.putByte(skinColor);
		return p;
	},
	WALK: (steps, startX, startY, x1, y1, x2, y2, checkObjects, walkToAction, walkPathX, walkPathY) => {
		let p = new PacketBuilder(OPS.WALK);
		if (!walkToAction)
			p.opcode = OPS.WALK_ACTION;
	
		// add start point
		p.putShort(startX + global.ctx.regionX);
		p.putShort(startY + global.ctx.regionY);
	
		if (walkToAction && steps === -1 && (startX + global.ctx.regionX) % 5 === 0)
			steps = 0;
	
		// add pivot point deltas
		for (let l1 = steps; l1 >= 0 && l1 > steps - 25; l1--) {
			p.putByte(walkPathX[l1] - startX);
			p.putByte(walkPathY[l1] - startY);
		}
	
		return p;
	},
	CAST_GROUND_ITEM: (x, y, target, spell) => {
		let p = new PacketBuilder(OPS.CAST_GROUNDITEM);
		p.putShort(x + global.ctx.regionX);
		p.putShort(y + global.ctx.regionY);
		p.putShort(target);
		p.putShort(spell);
		return p;
	},
	ON_GROUND_ITEM: (x, y, target, invItem) => {
		let p = new PacketBuilder(OPS.USEWITH_GROUNDITEM);
		p.putShort(x + global.ctx.regionX);
		p.putShort(y + global.ctx.regionY);
		p.putShort(target);
		p.putShort(invItem);
		return p;
	},
	TAKE_GROUND_ITEM: (x, y, target, unused) => {
		let p = new PacketBuilder(OPS.GROUNDITEM_TAKE);
		p.putShort(x + global.ctx.regionX);
		p.putShort(y + global.ctx.regionY);
		p.putShort(target);
		p.putShort(unused);
		return p;
	},
	CAST_BOUNDARY: (x, y, target, spell) => {
		let p = new PacketBuilder(OPS.CAST_WALLOBJECT);
		p.putShort(x + global.ctx.regionX);
		p.putShort(y + global.ctx.regionY);
		p.putByte(target);
		p.putShort(spell);
		return p;
	},
	ON_INVENTORY: (target, item) => {
		let p = new PacketBuilder(OPS.USEWITH_INVITEM);
		p.putShort(target);
		p.putShort(item);
		return p;
	},
	get inCipher() {
		return inCipher;
	},
	get outCipher() {
		return outCipher;
	},
};
module.exports.bare = bare;

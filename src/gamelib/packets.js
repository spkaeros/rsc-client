import VERSION from '../version';
import OPS from '../opcodes/client';
import Packet from '../packet';
import GameBuffer from '../game-buffer';
import xtea from 'xtea';
// import XTEA from '../lib/xtea';
import {Buffer} from 'buffer';
import {Utility} from '../utility';
import {encryptBytes} from './rsa';

class Ops {
	static COMMAND(s) {
		let p = new Packet(OPS.COMMAND);
		p.startAccess();
		p.putString(s);
		p.stopAccess();
		return p;
	}

	static CHANGE_PASSWORD(oldp, newp) {
		let p = new Packet(OPS.CHANGE_PASSWORD);
		p.startAccess();
		p.putString(oldp);
		p.putString(newp);
		p.stopAccess();
		return p;
	}
	
	static CHAT(s, len = s.length) {
		let p = new Packet(OPS.CHAT);
		p.startAccess();
		p.putBytes(s, 0, len);
		p.stopAccess();
		return p;
	}
	
	static PM(u, s, len = s.length) {
		let p = new Packet(OPS.PM);
		p.startAccess();
		p.putLong(u);
		p.putBytes(s, 0, len);
		p.stopAccess();
		return p;
	}
	static REMOVE_FRIEND(u) {
		let p = new Packet(OPS.FRIEND_REMOVE);
		p.startAccess();
		p.putLong(u);
		p.stopAccess();
		return p;
	}
	static REMOVE_IGNORE(u) {
		let p = new Packet(OPS.IGNORE_REMOVE);
		p.startAccess();
		p.putLong(u);
		p.stopAccess();
		return p;
	}
	
	static ADD_FRIEND(u) {
		let p = new Packet(OPS.FRIEND_ADD);
		p.startAccess();
		p.putLong(u);
		p.stopAccess();
		return p;
	}
	
	static ADD_IGNORE(u) {
		let p = new Packet(OPS.IGNORE_ADD);
		p.startAccess();
		p.putLong(u);
		p.stopAccess();
		return p;
	}
	static PRIVACY_SETTINGS(pub, priv, trade, duel) {
		let p = new Packet(OPS.SETTINGS_PRIVACY);
		p.startAccess();
		p.putBoolean(pub);
		p.putBoolean(priv);
		p.putBoolean(trade);
		p.putBoolean(duel);
		p.stopAccess();
		return p;
	}

	static LOGIN(username, password, reconnecting = false) {
		// below seeds the opcode cipher.
		// I deprecated the security of the traditional Jagex protocol (rsa+isaac) in favor of traditional TLS mechanisms
		// which are inherently more secure and also we gain the support for it through built-in standardized libraries automatically
		// Even though we no longer need to, I still encrypt the login block for the reason that one may wish to provide non-TLS
		// client support and this will protect the user login credentials in this case.

		let rsaBlock = new GameBuffer(new Uint8Array(128));
		rsaBlock.putByte(10);
		let randArr = new Uint32Array(4);
		crypto.getRandomValues(randArr);
		for (let i = 0; i < randArr.length; i += 1)
			rsaBlock.putInt(randArr[i]);
			// rsaBlock.putInt(((randArr[i] << 24) & 0xFF) | ((randArr[i+1] << 16) & 0xFF) | ((randArr[i+2] << 8) & 0xFF) | (randArr[i+3] & 0xFF));
		let randB = Buffer.alloc(16)
		for (let i = 0; i < randB.length; i += 4) {
			randB.writeUInt32BE(randArr[i>>2], i)
		}
		rsaBlock.putString(password);
		let rand = Buffer.alloc(24);
		crypto.getRandomValues(rand);
		// let x = new XTEA(Buffer.from(randB)).encrypt(Buffer.concat([Buffer.alloc(1), Buffer.from(randB), Buffer.alloc(8), Buffer.from(username, 'utf8'), Buffer.alloc(1)]));
		let x = xtea.encrypt(Buffer.concat([Buffer.alloc(1), Buffer.from(randB), Buffer.alloc(8), Buffer.from(username, 'utf8'), Buffer.alloc(1)]), randB);
		console.log(x);

		let p = new Packet(OPS.LOGIN);
		p.startAccess();
		p.putBool(reconnecting);
		p.putInt(235);
		p.putBigBuffer(encryptBytes(rsaBlock.buffer.slice(0, rsaBlock.offset)));
		p.putBigBuffer(x.slice());
		p.stopAccess();
		return p;
	}

	static REGISTER(username, password) {
		let p = new Packet(OPS.REGISTER);
		p.startAccess();
		p.putShort(VERSION.CLIENT);
		p.putLong(Utility.usernameToHash(username));
		p.putString(password);
		p.stopAccess();
		return p;
	}
	static REPORT_ABUSE(name, offenceType, action) {
		let p = new Packet(OPS.REPORT_ABUSE);
		p.startAccess();
		p.putLong(Utility.usernameToHash(name));
		p.putByte(offenceType);
		p.putByte(action);
		p.stopAccess();
		return p;
	}
	
	static CHANGE_APPEARANCE(gender, headType, bodyType, legType, hairColor, bodyColor, legColor, skinColor) {
		let p = new Packet(OPS.APPEARANCE);
		p.startAccess();
		p.putByte(gender);
		p.putByte(headType);
		p.putByte(bodyType);
		p.putByte(legType);
		p.putByte(hairColor);
		p.putByte(bodyColor);
		p.putByte(legColor);
		p.putByte(skinColor);
		p.stopAccess();
		return p;
	}

}

Ops.DISCONNECT = Packet.bare(OPS.CLOSE_CONNECTION);
Ops.PING = Packet.bare(OPS.PING);
Ops.CLOSE_BANK = Packet.bare(OPS.BANK_CLOSE);
Ops.DECLINE_DUEL = Packet.bare(OPS.DUEL_DECLINE);
Ops.ACCEPT_DUEL_ONE = Packet.bare(OPS.DUEL_ACCEPT);
Ops.ACCEPT_DUEL_TWO = Packet.bare(OPS.DUEL_CONFIRM_ACCEPT);
Ops.DECLINE_TRADE = Packet.bare(OPS.TRADE_DECLINE);
Ops.ACCEPT_TRADE_ONE = Packet.bare(OPS.TRADE_ACCEPT);
Ops.ACCEPT_TRADE_TWO = Packet.bare(OPS.TRADE_CONFIRM_ACCEPT);


export { Ops as default };

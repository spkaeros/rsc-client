import VERSION from '../version';
import OPS from '../opcodes/client';
import Packet from '../packet';
import GameBuffer from '../game-buffer';
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
		let randArr = new Uint32Array(4);
		crypto.getRandomValues(randArr);
		for (let i = 0; i < randArr.length; i++)
			rsaBlock.putInt(randArr[i]);
		// rsaBlock.putInt(randArr[0]);
		// rsaBlock.putInt(randArr[1]);
		// rsaBlock.putInt(randArr[2]);
		// rsaBlock.putInt(randArr[3]);
		// rsaBlock.putInt(Math.random() * 0xFFFFFF);
		// rsaBlock.putInt(Math.random() * 0xFFFFFF);
		// rsaBlock.putInt(Math.random() * 0xFFFFFF);
		// rsaBlock.putInt(Math.random() * 0xFFFFFF);
		rsaBlock.putLong(Utility.usernameToHash(username));
		rsaBlock.putString(password);
		
		let p = new Packet(OPS.LOGIN);
		p.startAccess();
		p.putBool(reconnecting);
		p.putShort(VERSION.CLIENT);
		p.putBigBuffer(encryptBytes(rsaBlock.buffer.slice(0, rsaBlock.offset)));
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
		let p = new Packet(C_OPCODES.REPORT_ABUSE);
		p.startAccess();
		p.putLong(Utility.usernameToHash(name));
		p.putByte(offenceType);
		p.putByte(action);
		p.stopAccess();
		return p;
	}
}

Ops.DISCONNECT = Packet.bare(OPS.CLOSE_CONNECTION);
Ops.PING = Packet.bare(OPS.PING);
Ops.CLOSE_BANK = Packet.bare(OPS.BANK_CLOSE);
Ops.DECLINE_DUEL = Packet.bare(OPS.DUEL_DECLINE);
Ops.DECLINE_TRADE = Packet.bare(OPS.TRADE_DECLINE);
Ops.ACCEPT_TRADE_ONE = Packet.bare(OPS.TRADE_ACCEPT);
Ops.ACCEPT_TRADE_TWO = Packet.bare(OPS.TRADE_CONFIRM_ACCEPT);

export { Ops as default };

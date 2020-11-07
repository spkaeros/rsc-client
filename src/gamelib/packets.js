import VERSION from '../version';
import OPS from '../opcodes/client';
import Packet from '../packet';
import xtea from 'xtea';
import { Utility } from '../utility';
import { encryptBytes } from './rsa';

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

	static FIGHT_STYLE(idx) {
		let p = new Packet(OPS.COMBAT_STYLE);
		p.startAccess();
		p.putByte(idx);
		p.stopAccess();
		return p;
	}

	static CHOOSE_MENU(idx) {
		let p = new Packet(OPS.CHOOSE_OPTION);
		p.startAccess();
		p.putByte(idx);
		p.stopAccess();
		return p;
	}

	static TOGGLE_PRAYER(idx, on) {
		let p = new Packet(on ? OPS.PRAYER_ON : OPS.PRAYER_OFF);
		p.startAccess();
		p.putByte(idx);
		p.stopAccess();
		return p;
	}

	static BANK_ACTION(slot, amount, withdraw) {
		let p = new Packet(withdraw ? OPS.BANK_WITHDRAW : OPS.BANK_DEPOSIT);
		p.startAccess();
		p.putShort(idx);
		p.putInt(amount);
		p.putInt(withdraw ? 0x12345678 : 0x87654321)
		p.stopAccess();
		return p;
	}

	static TRADE_ITEMS(count) {
		let p = new Packet(OPS.TRADE_ITEM_UPDATE);
		p.startAccess();
		p.putByte(count);
		for (let i = 0; i < count; i++) {
			p.putShort(Ops.MC.tradeItems[i]);
			p.putInt(Ops.MC.tradeItemCount[i]);
		}
		p.stopAccess();
		return p;
	}

	static SETTINGS(idx, value) {
		let p = new Packet(OPS.SETTINGS_GAME);
		p.startAccess();
		p.putByte(idx);
		p.putBool(value);
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
		// I deprecated the security of the traditional Jagex protocol (rsa+isaac) in favor of traditional TLS mechanisms
		// which are inherently more secure and also we gain the support for it through built-in standardized libraries automatically
		// Even though we no longer need to, I still encrypt the login block for the reason that one may wish to provide non-TLS
		// client support and this will protect the user login credentials in this case.

		// 45 bytes??  set it to 64 just for safety
		let keyWords = Buffer.alloc(6);
		crypto.getRandomValues(keyWords);
		Packet.isaacSeeds = keyWords.slice(0, 4);
		let keys = Buffer.alloc(24);
		for (let i = 0; i < 4; i++)
			keys.writeUInt32BE(keyWords[i], i<<2);
		let p = new Packet(OPS.LOGIN);
		p.startAccess();
		p.putBool(reconnecting);
		p.putInt(VERSION.CLIENT);
		p.putBigBuffer(Utility.rsaEncrypt(Buffer.concat([Buffer.of(10), keys.slice(0, 16), Buffer.from(password, 'utf-8'), Buffer.alloc(19-password.length, 0x20), Buffer.of(0), keys.slice(16, 24)])));
		p.putBigBuffer(xtea.encrypt(Buffer.concat([Buffer.of(0), keys, Buffer.from(username), Buffer.of(0)]), keys));
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

	static WALK(steps, startX, startY, x1, y1, x2, y2, checkObjects, walkToAction) {
		let p = new Packet(OPS.WALK);
		if (!walkToAction)
			p.opcode = OPS.WALK_ACTION;
		p.startAccess();

		// add start point
		p.putShort(startX + Ops.MC.regionX);
		p.putShort(startY + Ops.MC.regionY);

		if (walkToAction && steps === -1 && (startX + Ops.MC.regionX) % 5 === 0)
			steps = 0;

		// add pivot point deltas
		for (let l1 = steps; l1 >= 0 && l1 > steps - 25; l1--) {
			p.putByte(Ops.MC.walkPathX[l1] - startX);
			p.putByte(Ops.MC.walkPathY[l1] - startY);
		}

		p.stopAccess();
		return p;
	}

	static GET_PLAYER_TICKETS(count) {
		let p = new Packet(OPS.KNOWN_PLAYERS);
		p.startAccess();
		p.putShort(count);
		for (let i = 0; i < count; i++) {
			let player = Ops.MC.playerServer[Ops.MC.playerServerIndexes[i]];
			p.putShort(player.serverIndex);
			p.putShort(player.appearanceTicket);
		}
		p.stopAccess();
		return p;
	}
	
	static CAST_GROUND_ITEM(x, y, target, spell) {
		let p = new Packet(OPS.CAST_GROUNDITEM);
		p.startAccess();
		p.putShort(x + Ops.MC.regionX);
		p.putShort(y + Ops.MC.regionY);
		p.putShort(target);
		p.putShort(spell);
		p.stopAccess();
		return p;
	}
	
	static ON_GROUND_ITEM(x, y, target, invItem) {
		let p = new Packet(OPS.USEWITH_GROUNDITEM);
		p.startAccess();
		p.putShort(x + Ops.MC.regionX);
		p.putShort(y + Ops.MC.regionY);
		p.putShort(target);
		p.putShort(invItem);
		p.stopAccess();
		return p;
	}
	
	static TAKE_GROUND_ITEM(x, y, target, unused) {
		let p = new Packet(OPS.GROUNDITEM_TAKE);
		p.startAccess();
		p.putShort(x + Ops.MC.regionX);
		p.putShort(y + Ops.MC.regionY);
		p.putShort(target);
		p.putShort(unused);
		p.stopAccess();
		return p;
	}
	
	static CAST_BOUNDARY(x, y, target, spell) {
		let p = new Packet(OPS.CAST_WALLOBJECT);
		p.startAccess();
		p.putShort(x + Ops.MC.regionX);
		p.putShort(y + Ops.MC.regionY);
		p.putByte(target);
		p.putShort(spell);
		p.stopAccess();
		return p;
	}
	
	static ON_INVENTORY(target, item) {
		let p = new Packet(OPS.USEWITH_INVITEM);
		p.startAccess();
		p.putShort(target);
		p.putShort(item);
		p.stopAccess();
		return p;
	}
	
	static UNEQUIP(item) {
		let p = new Packet(OPS.INV_UNEQUIP);
		p.startAccess();
		p.putShort(item);
		p.stopAccess();
		return p;
	}
	
	static EQUIP(item) {
		let p = new Packet(OPS.INV_WEAR);
		p.startAccess();
		p.putShort(item);
		p.stopAccess();
		return p;
	}
	
	static INVENTORY_ACTION(item) {
		let p = new Packet(OPS.INV_CMD);
		p.startAccess();
		p.putShort(item);
		p.stopAccess();
		return p;
	}
	
	static DROP_ITEM(item) {
		let p = new Packet(OPS.INV_DROP);
		p.startAccess();
		p.putShort(item);
		p.stopAccess();
		return p;
	}
	
	static CAST_INVENTORY(target, spell) {
		let p = new Packet(OPS.CAST_INVITEM);
		p.startAccess();
		p.putShort(target);
		p.putShort(spell);
		p.stopAccess();
		return p;
	}
	
	static ON_BOUNDARY(x, y, target, invItem) {
		let p = new Packet(OPS.USEWITH_WALLOBJECT);
		p.startAccess();
		p.putShort(x + Ops.MC.regionX);
		p.putShort(y + Ops.MC.regionY);
		p.putByte(target);
		p.putShort(invItem);
		p.stopAccess();
		return p;
	}
	
	static BOUNDARY_ACTION(click, x, y, target) {
		let p = new Packet(click === 0 ? OPS.WALL_OBJECT_COMMAND1 : OPS.WALL_OBJECT_COMMAND2);
		p.startAccess();
		p.putShort(x + Ops.MC.regionX);
		p.putShort(y + Ops.MC.regionY);
		p.putByte(target);
		p.stopAccess();
		return p;
	}

	static CAST_SCENARY(x, y, spell) {
		let p = new Packet(OPS.CAST_OBJECT);
		p.startAccess();
		p.putShort(x + Ops.MC.regionX);
		p.putShort(y + Ops.MC.regionY);
		p.putShort(spell);
		p.stopAccess();
		return p;
	}

	static ON_SCENARY(x, y, invItem) {
		let p = new Packet(OPS.USEWITH_OBJECT);
		p.startAccess();
		p.putShort(x + Ops.MC.regionX);
		p.putShort(y + Ops.MC.regionY);
		p.putShort(invItem);
		p.stopAccess();
		return p;
	}

	static SCENARY_ACTION(click, x, y) {
		let p = new Packet(click === 0 ? OPS.OBJECT_CMD1 : OBJECT_CMD2);
		p.startAccess();
		p.putShort(x + Ops.MC.regionX);
		p.putShort(y + Ops.MC.regionY);
		p.stopAccess();
		return p;
	}

	static CAST_NPC(idx, spell) {
		let p = new Packet(OPS.CAST_NPC);
		p.startAccess();
		p.putShort(idx);
		p.putShort(spell);
		p.stopAccess();
		return p;
	}

	static CAST_PLAYER(idx, spell) {
		let p = new Packet(OPS.CAST_PLAYER);
		p.startAccess();
		p.putShort(idx);
		p.putShort(spell);
		p.stopAccess();
		return p;
	}

	static ON_NPC(idx, spell) {
		let p = new Packet(OPS.USEWITH_NPC);
		p.startAccess();
		p.putShort(idx);
		p.putShort(spell);
		p.stopAccess();
		return p;
	}

	static ON_PLAYER(idx, spell) {
		let p = new Packet(OPS.USEWITH_PLAYER);
		p.startAccess();
		p.putShort(idx);
		p.putShort(spell);
		p.stopAccess();
		return p;
	}

	static TALK_NPC(idx) {
		let p = new Packet(OPS.NPC_TALK);
		p.startAccess();
		p.putShort(idx);
		p.stopAccess();
		return p;
	}

	static NPC_ACTION(idx) {
		let p = new Packet(OPS.NPC_CMD);
		p.startAccess();
		p.putShort(idx);
		p.stopAccess();
		return p;
	}

	static ATTACK_NPC(idx) {
		let p = new Packet(OPS.NPC_ATTACK);
		p.startAccess();
		p.putShort(idx);
		p.stopAccess();
		return p;
	}

	static ATTACK_PLAYER(idx) {
		let p = new Packet(OPS.PLAYER_ATTACK);
		p.startAccess();
		p.putShort(idx);
		p.stopAccess();
		return p;
	}
	
	static CAST_GROUND(x,y,spell) {
		let p = new Packet(OPS.CAST_GROUND);
		p.startAccess();
		p.putShort(x+Ops.MC.regionX);
		p.putShort(y+Ops.MC.regionY);
		p.putShort(spell);
		p.stopAccess();
		return p;
	}
	
	static CAST_SELF(spell) {
		let p = new Packet(OPS.CAST_SELF);
		p.startAccess();
		p.putShort(spell);
		p.stopAccess();
		return p;
	}
	
	static REQUEST_DUEL(target) {
		let p = new Packet(OPS.PLAYER_DUEL);
		p.startAccess();
		p.putShort(target);
		p.stopAccess();
		return p;
	}
	
	static REQUEST_TRADE(target) {
		let p = new Packet(OPS.PLAYER_TRADE);
		p.startAccess();
		p.putShort(target);
		p.stopAccess();
		return p;
	}

	static SHOP_ACTION(id, cost, buying) {
		let p = new Packet(buying ? OPS.SHOP_BUY : OPS.SHOP_SELL);
		p.startAccess();
		p.putShort(id);
		p.putInt(cost);
		p.stopAccess();
		return p;
	}
	
	static FOLLOW(target) {
		let p = new Packet(OPS.PLAYER_FOLLOW);
		p.startAccess();
		p.putShort(target);
		p.stopAccess();
		return p;
	}
	
	static DISCONNECT() {
		return Packet.bare(OPS.CLOSE_CONNECTION);
	}
	
	static LOGOUT() {
		return Packet.bare(OPS.LOGOUT);
	}

	static PING() {
		return Packet.bare(OPS.PING);
	}
	static CLOSE_SHOP() {
		return Packet.bare(OPS.SHOP_CLOSE);
	}

	static CLOSE_BANK() {
		return Packet.bare(OPS.BANK_CLOSE);
	}

	static DECLINE_DUEL() {
		return Packet.bare(OPS.DUEL_DECLINE);
	}

	static ACCEPT_DUEL_ONE() {
		return Packet.bare(OPS.DUEL_ACCEPT);
	}

	static ACCEPT_DUEL_TWO() {
		return Packet.bare(OPS.DUEL_CONFIRM_ACCEPT);
	}

	static DECLINE_TRADE() {
		return Packet.bare(OPS.TRADE_DECLINE);
	}

	static ACCEPT_TRADE_ONE() {
		return Packet.bare(OPS.TRADE_ACCEPT);
	}

	static ACCEPT_TRADE_TWO() {
		return Packet.bare(OPS.TRADE_CONFIRM_ACCEPT);
	}
}

export { Ops as default };


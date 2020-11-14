import Color from './lib/graphics/color';
import Font from './lib/graphics/font';
import GameShell from './game-shell';
import Packet from './packet'
import GameException from './lib/game-exception';
import NetworkStream from './network-stream';
import { Utility, EngineStates, WelcomeStates, GameStates, GamePanels } from './utility';
import { getCookie as getCookie } from './mudclient';
import VERSION from './version';
import Ops from './gamelib/packets';
import S_OPCODES from './opcodes/server';
import C_OPCODES from './opcodes/client';
import Timer from './timer';

export default class GameConnection extends GameShell {
	constructor(canvas) {
		super(canvas);
		this.settingsBlockChat = false;
		this.settingsBlockPrivate = false;
		this.settingsBlockTrade = false;
		this.settingsBlockDuel = false;
		this.server = 'rsclassic.dev';
		this.port = 43594;
		this.username = getCookie('username');
		this.password = '';
		this.friendListCount = 0;
		this.friendListHashes = new BigUint64Array(GameConnection.socialListSize);
		this.friendListOnline = new Array(GameConnection.socialListSize);
		this.ignoreListCount = 0;
		this.ignoreList = new BigUint64Array(GameConnection.socialListSize);
		this.privateMessageIds = new Uint32Array(GameConnection.socialListSize);
		this.timeoutCheck = Timer.fromSeconds(5);
	}
	
	async registerAccount(username, password) {
		try {
			let user = Utility.formatAndTruncate(username, 12);
			let pass = Utility.formatAndTruncate(password, 20);

			if (this.clientStream)
				this.clientStream.closeStream();
			
			this.updateWelcomeStatuses('Please wait...', 'creating new account...');
			this.clientStream = new NetworkStream(await this.createSocket(window.location.protocol.replace('http', 'ws') + "//" + window.location.hostname, this.port), this);
			this.clientStream.send(Ops.REGISTER(user, pass));
			let response = await this.clientStream.readStream();
			console.log('newplayer response: ' + response);
			this.clientStream.closeStream();
			switch(response) {
			case 2: // success
				this.resetLoginVars();
				await this.login(user, pass, false)
				return;
			case 13: // username taken
			case 3:
				this.updateWelcomeStatuses('Username already taken.', 'Please choose another username');
				return;
			case 4: // username in use. distinction??
				this.updateWelcomeStatuses('That username is already in use.', 'Wait 60 seconds then retry');
				return;
			case 5: // client has been updated
				this.updateWelcomeStatuses('The client has been updated.', 'Please reload this page');
				return;
			case 6: // IP in use
				this.updateWelcomeStatuses('You may only use 1 character at once.', 'Your ip-address is already in use');
				return;
			case 7: // spam throttle was hit
				this.updateWelcomeStatuses('Login attempts exceeded!', 'Please try again in 5 minutes');
				return;
			case 11: // temporary ban
				this.updateWelcomeStatuses('Account has been temporarily disabled', 'for cheating or abuse');
				return;
			case 12: // permanent ban
				this.updateWelcomeStatuses('Account has been permanently disabled', 'for cheating or abuse');
				return;
			case 14: // server full
				this.updateWelcomeStatuses('Sorry! The server is currently full.', 'Please try again later');
				this.worldFullTimeout = secondsToFrames(30);
				return;
			case 15: // members account needed
				this.updateWelcomeStatuses('You need a members account', 'to login to this server');
				return;
			case 16: // switch to members server
				this.updateWelcomeStatuses('Please login to a members server', 'to access member-only features');
				return;
			case 19: // Username or password length was out of bounds
				this.updateWelcomeStatuses('Bad username/password', 'Please check your input and try again');
				return;
			}
			this.updateWelcomeStatuses('Error unable to create user.', 'Unrecognised response code');
		} catch(e) {
			console.error(e);
			this.updateWelcomeStatuses('Error unable to create user.', 'Unrecognised response code');
		}
	}
	
	
	changePassword(oldPass, newPass) {
		this.clientStream.queue(Ops.CHANGE_PASSWORD(Utility.formatAndTruncate(oldPass, 20), Utility.formatAndTruncate(newPass, 20)));
	}
	
	async login(u, p, reconnecting, save) {
		if (this.worldFullTimeout > 0) {
			this.updateWelcomeStatuses('Please wait...', 'Connecting to server');
			await this.sleep(2000);
			this.updateWelcomeStatuses('Sorry! The server is currently full.', 'Please try again later');
			return;
		}

		try {
			this.username = u;
			u = Utility.formatAndTruncate(u, 20);
			this.password = p;
			p = Utility.formatAndTruncate(p, 20);

			if (u.trim().length === 0) {
				this.updateWelcomeStatuses('You must enter both a username', 'and a password - Please try again');
				return;
			}

			if (reconnecting)
				this.drawTextBox('Connection lost! Please wait...', 'Attempting to re-establish');
			else
				this.updateWelcomeStatuses('Please wait...', 'Connecting to server');


			if (this.clientStream)
				this.clientStream.closeStream();

			this.clientStream = new NetworkStream(await this.createSocket(window.location.protocol.replace("http", "ws") + "//" + window.location.hostname, this.port), this);
			this.clientStream.send(Ops.LOGIN(u, p, reconnecting));

			let resp = await this.clientStream.readStream();
			console.log('login response:' + resp&~64 + ' raw:' + resp);
			switch ((resp&~64)) {
			case 25:
			case 24:
				this.autoLoginTimeout = 0;
				this.moderatorLevel = (resp&~64)-23;
				this.resetWorldState();
				return;
			case 0:
				this.autoLoginTimeout = 0;
				this.moderatorLevel = 0;
				this.resetWorldState();
				return;
			case 1:
				if (reconnecting)
					this.resetLoginVars();
				this.autoLoginTimeout = 0;
				return;
			case -1:
				this.updateWelcomeStatuses('Error unable to login.', 'Server timed out');
				break;
			case 3:
				this.updateWelcomeStatuses('Invalid username or password.', 'Try again, or create a new account');
				break;
			case 4:
				this.updateWelcomeStatuses('That username is already logged in.', 'Wait 60 seconds then retry');
				break;
			case 5:
				this.updateWelcomeStatuses('The client has been updated.', 'Please reload this page');
				break;
			case 6:
				this.updateWelcomeStatuses('You may only use 1 character at once.', 'Your ip-address is already in use');
				break;
			case 7:
				this.updateWelcomeStatuses('Login attempts exceeded!', 'Please try again in 5 minutes');
				break;
			case 8:
				this.updateWelcomeStatuses('Error unable to login.', 'Server rejected session');
				break;
			case 9:
				this.updateWelcomeStatuses('Error unable to login.', 'Loginserver rejected session');
				break;
			case 10:
				this.updateWelcomeStatuses('That username is already in use.', 'Wait 60 seconds then retry');
				break;
			case 11:
				this.updateWelcomeStatuses('Account temporarily disabled.', 'Check your message inbox for details');
				break;
			case 12:
				this.updateWelcomeStatuses('Account permanently disabled.', 'Check your message inbox for details');
				break;
			case 14:
				this.updateWelcomeStatuses('Sorry! This world is currently full.', 'Please try a different world');
				this.worldFullTimeout = secondsToFrames(30);
				break;
			case 15:
				this.updateWelcomeStatuses('You need a members account', 'to login to this world');
				break;
			case 16:
				this.updateWelcomeStatuses('Error - no reply from loginserver.', 'Please try again');
				break;
			case 17:
				this.updateWelcomeStatuses('Error - failed to decode profile.', 'Contact customer support');
				break;
			case 18:
				this.updateWelcomeStatuses('Account suspected stolen.', 'Press \'recover a locked account\' on front page.');
				break;
			case 20:
				this.updateWelcomeStatuses('Error - loginserver mismatch', 'Please try a different world');
				break;
			case 21:
				this.updateWelcomeStatuses('Unable to login.', 'That is not an RS-Classic account');
				break;
			case 22:
				this.updateWelcomeStatuses('Password suspected stolen.', 'Press \'change your password\' on front page.');
				break;
			default:
				this.updateWelcomeStatuses('Error unable to login.', 'Unrecognised response code');
				break;
			}
			if (this.autoLoginTimeout > 0) {
				this.autoLoginTimeout--;
				await this.sleep(5000);
				await this.login(u,p,reconnecting,save);
			}
			if (resp&64 !== 64)
				this.clientStream.closeStream();
			return;
		} catch (e) {
			this.networkException = new GameException(e);
			console.log(this.networkException);
		}
		this.updateWelcomeStatuses('Sorry! Unable to connect.', 'Check internet settings or try another world');
	}
	
	closeConnection() {
		if (this.clientStream) {
			try {
				this.clientStream.send(Ops.DISCONNECT());
				this.clientStream.closeStream();
			} catch (e) {
				console.error(e);
			}
		}
		
		this.resetLoginVars();
	}
	
	async lostConnection() {
		// this.closeConnection();
		try {
			this.socketException = new GameException(Error('Lost connection - attempting to re-establish...'), false);
			throw this.socketException;
		} catch (e) {
			console.info('Network connection lost; re-establishing...');
			console.error(e);
		}

		this.drawTextBox("Lost connection", "attempting to re-establish...");

		this.autoLoginTimeout = 10;
		await this.login(this.username, this.password, true);
	}
	
	drawTextBox(s, s1) {
		// border
		this.graphics.setColor(Color.WHITE);
		this.graphics.drawRect(Math.floor(this.surface.width2 / 2) - 140, Math.floor(this.surface.height2 / 2) - 25, 280, 50);
		// box
		this.graphics.setColor(Color.BLACK);
		this.graphics.fillRect(Math.floor(this.surface.width2 / 2) - 140, Math.floor(this.surface.height2 / 2) - 25, 280, 50);
		// text
		let font = Font.HELVETICA.bold(15);
		this.drawString(this.graphics, s, font, Math.floor(this.surface.width2 / 2), Math.floor(this.surface.height2 / 2) - 10);
		this.drawString(this.graphics, s1, font, Math.floor(this.surface.width2 / 2), Math.floor(this.surface.height2/2) + 10);
	}
	
	async checkConnection() {
		this.timeoutCheck.tick(() => {
			this.clientStream.queue(Ops.PING());
		})

		if (this.clientStream.hasPacket()) {
			this.timeoutCheck.tickCount = 0;
		}
		
		try {
			this.clientStream.tick();
		} catch (e) {
			console.error(e.message);
			console.warn('Error in socket write subroutine:', e)
			await this.lostConnection();
			return;
		}

		try {
			let buffer = await this.clientStream.nextPacket();
			if (this.clientStream.didError) {
				await this.lostConnection();
				return;
			}
			if (!buffer || buffer.length <= 0)
				return;
			this.handlePacket(buffer);
		} catch(e) {
			console.warn('Error in socket read subroutine:', e)
			await this.lostConnection();
			return;
		}
	}
	
	handlePacket(data) {
		let offset = 0;
		let size = data.length;
		let opcode = Utility.getUnsignedByte(data[offset++]);
		// console.info(`Incoming Packet: <opcode:${opcode};size:${size}>`);
		if (opcode === S_OPCODES.MESSAGE) {
			this.showServerMessage(this.chatSystem.decode(data.slice(offset)));
			return;
		}
		if (opcode === S_OPCODES.CLOSE_CONNECTION){
			this.closeConnection();
			return;
		}
		if (opcode === S_OPCODES.LOGOUT_DENY) {
			this.cantLogout();
			return;
		}
		if (opcode === S_OPCODES.FRIEND_LIST) {
			this.friendListCount = Utility.getUnsignedByte(data[offset++]);
			
			for (let idx = 0; idx < this.friendListCount; idx++) {
				this.friendListHashes[idx] = Utility.getUnsignedLong(data, offset);
				offset += 8;
				this.friendListOnline[idx] = Utility.getUnsignedByte(data[offset++]);
			}
			
			this.sortFriendsList();
			return;
		}
		
		if (opcode === S_OPCODES.FRIEND_STATUS_CHANGE) {
			let hash = Utility.getUnsignedLong(data, offset);
			offset += 8;
			let online = Utility.getUnsignedByte(data[offset++]);
			for (let idx = 0; idx < this.friendListCount; idx++) {
				if (this.friendListHashes[idx] === hash) {
					if (this.friendListOnline[idx] !== online)
						this.showServerMessage('@pri@' + Utility.hashToUsername(hash) + ' has logged ' + (online !== 0 ? 'in'  : 'out'));
					this.friendListOnline[idx] = online;
					this.sortFriendsList();
					return;
				}
			}

			this.friendListHashes[this.friendListCount] = hash;
			this.friendListOnline[this.friendListCount++] = online;
			this.sortFriendsList();
			return;
		}
		
		if (opcode === S_OPCODES.IGNORE_LIST) {
			this.ignoreListCount = Utility.getUnsignedByte(data[offset++]);
			for (let idx = 0; idx < this.ignoreListCount; idx++) {
				this.ignoreList[idx] = Utility.getUnsignedLong(data, offset);
				offset += 8;
			}
			return;
		}
		
		if (opcode === S_OPCODES.PRIVACY_SETTINGS) {
			this.settingsBlockChat = Utility.getBoolean(data[offset++]);
			this.settingsBlockPrivate = Utility.getBoolean(data[offset++]);
			this.settingsBlockTrade = Utility.getBoolean(data[offset++]);
			this.settingsBlockDuel = Utility.getBoolean(data[offset++]);
			return;
		}
		
		if (opcode === S_OPCODES.FRIEND_MESSAGE) {
			let fromHash = Utility.getUnsignedLong(data, offset);
			offset += 8;
			let pmUuid = Utility.getUnsignedInt(data, offset);
			offset += 4;
			// Make sure this is not a duplicate private message
			for (let uuid of this.privateMessageIds)
				if (uuid === pmUuid)
					return;
			this.privateMessageIds[GameConnection.privateMessageUuid] = pmUuid;
			this.showServerMessage('@pri@' + Utility.hashToUsername(fromHash) + ': tells you ' + this.chatSystem.decode(data.slice(offset)));
			return;
		}
		
		this.handleIncomingPacket(opcode, size, data);
	}

	sortFriendsList() {
		for (let updating = true; updating; ) {
			updating = false;
			for (let i = 0; i < this.friendListCount-1; i++) {
				if (this.friendListOnline[i]&0xFF !== 0xFF && this.friendListOnline[i + 1]&0xFF === 0xFF || this.friendListOnline[i]&0xFF === 0 && this.friendListOnline[i + 1]&0xFF !== 0) {
					this.friendListOnline[i], this.friendListOnline[i+1] = this.friendListOnline[i+1], this.friendListOnline[i];
					this.friendListHashes[i], this.friendListHashes[i+1] = this.friendListHashes[i+1], this.friendListHashes[i];
					updating = true;
				}
			}
		}
	}
	
	sendPrivacySettings(chat, priv, trade, duel) {
		this.clientStream.queue(Ops.PRIVACY_SETTINGS(chat, priv, trade, duel));
	}

	ignoreIdx(s) {
		for (let ignored = 0; ignored < this.ignoreListCount; ignored++)
			if (this.ignoreList[ignored] === Utility.usernameToHash(s))
				return ignored;
		return -1;
	}
	
	hasIgnore(s) {
		return this.ignoreIdx(s) >= 0;
	}
	
	friendIdx(s) {
		for (let friend = 0; friend < this.friendListCount; friend++)
			if (this.friendListHashes[friend] === Utility.usernameToHash(s))
				return friend;
		return -1;
	}

	hasFriend(s) {
		return this.friendIdx(s) >= 0;
	}
	
	ignoreAdd(s) {
		// scan for previous entry, return early if found
		if (this.hasIgnore(s)) {
			return;
		}

		let l = Utility.usernameToHash(s);
		this.clientStream.queue(Ops.ADD_IGNORE(l));
		if (this.ignoreListCount < GameConnection.socialListSize)
			this.ignoreList[this.ignoreListCount++] = l;
	}
	
	ignoreRemove(l) {
		// for (let ignored = 0; ignored < this.ignoreListCount; ignored++) {
			// if (this.ignoreList[ignored] === l) {
				// this.ignoreListCount--;
				// for (let j = ignored; j < this.ignoreListCount; j++)
					// this.ignoreList[j] = this.ignoreList[j + 1];
				// return;
			// }
		// }
		let idx = this.ignoreIdx(Utility.hashToUsername(l));
		if (idx < 0)
			return;
		this.ignoreListCount -= 1;
		for (let i = idx; i < this.ignoreListCount; i += 1)
			this.ignoreList[i] = this.ignoreList[i+1];
		this.clientStream.queue(Ops.REMOVE_IGNORE(l));
	}
	
	friendAdd(s) {
		let l = Utility.usernameToHash(s);
		if (this.hasFriend(s)) {
			displayMessage("You're already friends with that person!", 6);
			return;
		}

		this.clientStream.queue(Ops.ADD_FRIEND(l));
		if (this.friendListCount < GameConnection.maxSocialListSize) {
			this.friendListHashes[this.friendListCount] = l;
			this.friendListOnline[this.friendListCount++] = 0;
		}
	}
	
	friendRemove(l) {
		let idx = this.friendIdx(Utility.hashToUsername(l));
		if (idx < 0)
			return;
		this.friendListCount -= 1;
		for (let i = idx; i < this.friendListCount; i += 1) {
			this.friendListHashes[i] = this.friendListHashes[i+1];
			this.friendListOnline[i] = this.friendListOnline[i+1];
		}
		this.clientStream.queue(Ops.REMOVE_FRIEND(l));
		this.showServerMessage('@pri@' + Utility.hashToUsername(l) + ' has been removed from your friends list');
		// displayMessage("Problem removing contact from friends.  You're not even a friend of that person!", 6);
	}
	
	sendPrivateMessage(u, buff, len = buff.length) {
		this.clientStream.queue(Ops.PM(u, buff));
	}
	
	sendChatMessage(buff, len = buff.length) {
		this.clientStream.queue(Ops.CHAT(buff));
	}
	
	sendCommandString(s) {
		this.clientStream.queue(Ops.COMMAND(s));
	}
	
	stop() {
		super.stop();
		return;
	}
}

Object.defineProperty(GameConnection, 'socialListSize', {
	value: 200,
});

Object.defineProperties(GameConnection, {
	'privateMessageUuid': {
		get: () => {
			if (!GameConnection._privateMessageUuid)
				GameConnection._privateMessageUuid = 0;
			GameConnection._privateMessageUuid = (++GameConnection._privateMessageUuid) % GameConnection.socialListSize;

			return GameConnection._privateMessageUuid;
		},
		set: void 0,
	},
});

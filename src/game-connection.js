
const C_OPCODES = require('./opcodes/client');
const VERSION = require('./version.json');
const {decodeString} = require('./chat-message');
const ClientStream = require('./client-stream');
const Color = require('./lib/graphics/color');
const Font = require('./lib/graphics/font');
const GameShell = require('./game-shell');
const GameBuffer = require('./game-buffer');
const Long = require('long');

const {FontStyle} = require('./lib/graphics/fontStyle')

const S_OPCODES = require('./opcodes/server');
const {Utility} = require('./utility');
const {WordFilter, filter} = require('./word-filter');
const sleep = require('sleep-promise');

function fromCharArray(a) {
	return Array.from(a).map(c => String.fromCharCode(c)).join('');
}

class GameConnection extends GameShell {
	constructor(canvas) {
		super(canvas);
		
		this.clientStream = null;
		this.friendListCount = 0;
		this.ignoreListCount = 0;
		this.settingsBlockChat = 0;
		this.settingsBlockPrivate = 0;
		this.settingsBlockTrade = 0;
		this.settingsBlockDuel = 0;
		this.worldFullTimeout = 0;
		this.moderatorLevel = 0;
		this.packetLastRead = 0;
		this.nextPrivateMessage = 0;
		
		this.server = '127.0.0.1';
		this.port = 43595;
		this.username = '';
		this.password = '';
		this.incomingPacket = new Int8Array(5000);
		// this.incomingPacket = new Int8Array(5000);
		
		this.friendListHashes = [];
		
		for (let i = 0; i < 200; i += 1) this.friendListHashes.push(new Long(0));
		
		this.friendListOnline = new Int32Array(200);
		this.ignoreList = [];
		
		for (let i = 0; i < GameConnection.maxSocialListSize; i += 1) this.ignoreList.push(new Long(0));
		
		this.privateMessageIds = new Int32Array(GameConnection.maxSocialListSize);
	}
	
	
	async registerAccount(user, pass) {
		try {
			user = Utility.formatAndTruncate(user, 12);
			pass = Utility.formatAndTruncate(pass, 20);
			
			if (this.clientStream !== null) {
				this.clientStream.closeStream();
			}
			
			this.showLoginScreenStatus('Please wait...', 'creating new account...');
			this.clientStream = new ClientStream(await this.createSocket(this.server, this.port, this.transportLayerSecurity), this);
			this.clientStream.readTicksMax = 1000;
			
			this.clientStream.newPacket(C_OPCODES.REGISTER);
			this.clientStream.putShort(VERSION.CLIENT);
			this.clientStream.putLong(Utility.encodeBase37(user));
			this.clientStream.putString(pass);
			this.clientStream.flushPacket();
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
				this.showLoginScreenStatus('Username already taken.', 'Please choose another username');
				return;
			case 4: // username in use. distinction??
				this.showLoginScreenStatus('That username is already in use.', 'Wait 60 seconds then retry');
				return;
			case 5: // client has been updated
				this.showLoginScreenStatus('The client has been updated.', 'Please reload this page');
				return;
			case 6: // IP in use
				this.showLoginScreenStatus('You may only use 1 character at once.', 'Your ip-address is already in use');
				return;
			case 7: // spam throttle was hit
				this.showLoginScreenStatus('Login attempts exceeded!', 'Please try again in 5 minutes');
				return;
			case 11: // temporary ban
				this.showLoginScreenStatus('Account has been temporarily disabled', 'for cheating or abuse');
				return;
			case 12: // permanent ban
				this.showLoginScreenStatus('Account has been permanently disabled', 'for cheating or abuse');
				return;
			case 14: // server full
				this.showLoginScreenStatus('Sorry! The server is currently full.', 'Please try again later');
				this.worldFullTimeout = 1500;
				return;
			case 15: // members account needed
				this.showLoginScreenStatus('You need a members account', 'to login to this server');
				return;
			case 16: // switch to members server
				this.showLoginScreenStatus('Please login to a members server', 'to access member-only features');
				return;
			case 19: // Username or password length was out of bounds
				this.showLoginScreenStatus('Bad username/password', 'Please check your input and try again');
				return;
			}
			this.showLoginScreenStatus('Error unable to create user.', 'Unrecognised response code');
		} catch(e) {
			console.error(e);
			this.showLoginScreenStatus('Error unable to create user.', 'Unrecognised response code');
		}
	}
	
	
	changePassword(oldPass, newPass) {
		oldPass = Utility.formatAndTruncate(oldPass, 20);
		newPass = Utility.formatAndTruncate(newPass, 20);
		
		this.clientStream.newPacket(C_OPCODES.CHANGE_PASSWORD);
		this.clientStream.putString(oldPass);
		this.clientStream.putString(newPass);
		this.clientStream.sendPacket();
	}
	
	async login(u, p, reconnecting, save) {
		if (this.worldFullTimeout > 0) {
			this.showLoginScreenStatus('Please wait...', 'Connecting to server');
			await sleep(2000);
			this.showLoginScreenStatus('Sorry! The server is currently full.', 'Please try again later');
			return;
		}

		try {
			this.username = u;
			u = Utility.formatAndTruncate(u, 20);
			
			this.password = p;
			p = Utility.formatAndTruncate(p, 20);

			if (u.trim().length === 0) {
				this.showLoginScreenStatus('You must enter both a username', 'and a password - Please try again');
				return;
			}

			if (reconnecting) {
				this.drawTextBox('Connection lost! Please wait...', 'Attempting to re-establish');
			} else {
				this.showLoginScreenStatus('Please wait...', 'Connecting to server');
			}


			if (this.clientStream !== null) {
				this.clientStream.closeStream();
			}

			this.clientStream = new ClientStream(await this.createSocket(this.server, this.port, this.transportLayerSecurity), this);
			this.clientStream.readTicksMax = 1000;

			let randArr = new Uint32Array(4);
			crypto.getRandomValues(randArr);
			let rsaBlock = new GameBuffer(new Uint8Array(1024));
			rsaBlock.putInt(randArr[0]);
			rsaBlock.putInt(randArr[1]);
			rsaBlock.putInt(randArr[2]);
			rsaBlock.putInt(randArr[3]);
			rsaBlock.putCredentials(u, p);
			
			// TODO: XTEA block over the username, placed directly after the RSA block I believe

			this.clientStream.newPacket(C_OPCODES.LOGIN);
			this.clientStream.putBool(reconnecting);
			this.clientStream.putShort(VERSION.CLIENT);
			let rsaData = rsaBlock.getCryptoBuffer().value;
			this.clientStream.putShort(rsaData.length);
			this.clientStream.putBytes(rsaData);
			this.clientStream.flushPacket();

			let resp = await this.clientStream.readStream();
			console.log('login response:' + resp);
			switch ((resp&~64)) {
			case 25:
			case 24:
				this.autoLoginTimeout = 0;
				this.moderatorLevel = 1;
				this.resetGame();
				return;
			case 0:
				this.autoLoginTimeout = 0;
				this.moderatorLevel = 0;
				this.resetGame();
				return;
			case 1:
				this.autoLoginTimeout = 0;
				return;
			case -1:
				this.showLoginScreenStatus('Error unable to login.', 'Server timed out');
				break;
			case 3:
				this.showLoginScreenStatus('Invalid username or password.', 'Try again, or create a new account');
				break;
			case 4:
				this.showLoginScreenStatus('That username is already logged in.', 'Wait 60 seconds then retry');
				break;
			case 5:
				this.showLoginScreenStatus('The client has been updated.', 'Please reload this page');
				break;
			case 6:
				this.showLoginScreenStatus('You may only use 1 character at once.', 'Your ip-address is already in use');
				break;
			case 7:
				this.showLoginScreenStatus('Login attempts exceeded!', 'Please try again in 5 minutes');
				break;
			case 8:
				this.showLoginScreenStatus('Error unable to login.', 'Server rejected session');
				break;
			case 9:
				this.showLoginScreenStatus('Error unable to login.', 'Loginserver rejected session');
				break;
			case 10:
				this.showLoginScreenStatus('That username is already in use.', 'Wait 60 seconds then retry');
				break;
			case 11:
				this.showLoginScreenStatus('Account temporarily disabled.', 'Check your message inbox for details');
				break;
			case 12:
				this.showLoginScreenStatus('Account permanently disabled.', 'Check your message inbox for details');
				break;
			case 14:
				this.showLoginScreenStatus('Sorry! This world is currently full.', 'Please try a different world');
				this.worldFullTimeout = 1500;
				break;
			case 15:
				this.showLoginScreenStatus('You need a members account', 'to login to this world');
				break;
			case 16:
				this.showLoginScreenStatus('Error - no reply from loginserver.', 'Please try again');
				break;
			case 17:
				this.showLoginScreenStatus('Error - failed to decode profile.', 'Contact customer support');
				break;
			case 18:
				this.showLoginScreenStatus('Account suspected stolen.', 'Press \'recover a locked account\' on front page.');
				break;
			case 20:
				this.showLoginScreenStatus('Error - loginserver mismatch', 'Please try a different world');
				break;
			case 21:
				this.showLoginScreenStatus('Unable to login.', 'That is not an RS-Classic account');
				break;
			case 22:
				this.showLoginScreenStatus('Password suspected stolen.', 'Press \'change your password\' on front page.');
				break;
			default:
				this.showLoginScreenStatus('Error unable to login.', 'Unrecognised response code');
				break;
			}
			if (resp&64 !== 64) {
				this.clientStream.closeStream();
			}
			return;
		} catch (e) {
			console.error(e);
		}
		if (this.autoLoginTimeout > 0) {
			await sleep(5000);
			this.autoLoginTimeout--;
			await this.login(this.username, this.password, reconnecting);
		}
		
		if (reconnecting) {
			// this.username = '';
			// this.password = '';
			this.resetLoginVars();
		} else {
			this.showLoginScreenStatus('Sorry! Unable to connect.', 'Check internet settings or try another world');
		}
	}
	
	closeConnection() {
		if (this.clientStream !== null) {
			try {
				this.clientStream.newPacket(C_OPCODES.CLOSE_CONNECTION);
				this.clientStream.flushPacket();
			} catch (e) {
				console.error(e);
			}
			this.clientStream.closeStream();
		}
		
		// this.username = '';
		// this.password = '';
		
		this.resetLoginVars();
	}
	
	async lostConnection() {
		try {
			throw new Error('Lost connection - forcing reconnect');
		} catch (e) {
			console.log('Lost connection');
			console.error(e);
		}
		
		this.autoLoginTimeout = 10;
		await this.login(this.username, this.password, true);
	}
	
	drawTextBox(s, s1) {
		let g = this.getGraphics();
		let font = Font.HELVETICA.withConfig(FontStyle.BOLD, 15);
		let w = this.width;
		let h = this.height;
		g.setColor(Color.black);
		g.fillRect((this.width >> 1 | 0) - 140, (this.height >> 1 | 0) - 25, 280, 50);
		
		g.setColor(Color.white);
		g.drawRect((this.width >> 1 | 0) - 140, (this.height >> 1 | 0) - 25, 280, 50);
		
		this.drawString(g, s, font, this.width >> 1 | 0, ((h / 2) | 0) - 10);
		
		this.drawString(g, s1, font, this.width >> 1 | 0, ((h / 2) | 0) + 10);
	}
	
	async checkConnection() {
		let l = Date.now();
		
		if (this.clientStream.hasPacket()) {
			this.packetLastRead = l;
		}
		
		if (l - this.packetLastRead > 5000) {
			this.packetLastRead = l;
			this.clientStream.newPacket(C_OPCODES.PING);
			this.clientStream.sendPacket();
		}
		
		try {
			this.clientStream.writePacket(20);
		} catch (e) {
			await this.lostConnection();
			return;
		}
		
		let psize = await this.clientStream.readPacket(this.incomingPacket);
		if (psize > 0) {
			// let ptype = this.clientStream.isaacCommand(this.incomingPacket[0] & 0xff);
			let ptype = this.incomingPacket[0] & 0xFF;
			this.handlePacket(ptype, psize);
		}
	}
	
	handlePacket(opcode, psize) {
		// console.log('opcode:' + opcode + ' psize:' + psize);
		if (opcode === S_OPCODES.MESSAGE) {
			let s = fromCharArray(this.incomingPacket.slice(1, psize));
			this.showServerMessage(s);
			return;
		}
		
		if (opcode === S_OPCODES.CLOSE_CONNECTION) {
			this.closeConnection();
			return;
		}
		
		if (opcode === S_OPCODES.LOGOUT_DENY) {
			this.cantLogout();
			return;
		}
		
		if (opcode === S_OPCODES.FRIEND_LIST) {
			this.friendListCount = Utility.getUnsignedByte(this.incomingPacket[1]);
			
			for (let k = 0; k < this.friendListCount; k++) {
				this.friendListHashes[k] = Utility.getUnsignedLong(this.incomingPacket, 2 + k * 9);
				this.friendListOnline[k] = Utility.getUnsignedByte(this.incomingPacket[10 + k * 9]);
			}
			
			this.sortFriendsList();
			return;
		}
		
		if (opcode === S_OPCODES.FRIEND_STATUS_CHANGE) {
			let hash = Utility.getUnsignedLong(this.incomingPacket, 1);
			let online = this.incomingPacket[9] & 0xFF;
			
			for (let i2 = 0; i2 < this.friendListCount; i2++) {
				if (this.friendListHashes[i2].equals(hash)) {
					if (this.friendListOnline[i2] === 0 && online !== 0) {
						this.showServerMessage('@pri@' + Utility.hashToUsername(hash) + ' has logged in');
					}
					
					if (this.friendListOnline[i2] !== 0 && online === 0) {
						this.showServerMessage('@pri@' + Utility.hashToUsername(hash) + ' has logged out');
					}
					
					this.friendListOnline[i2] = online;
//					psize = 0; // not sure what this is for
					this.sortFriendsList();
					return;
				}
			}
			
			this.friendListHashes[this.friendListCount] = hash;
			this.friendListOnline[this.friendListCount] = online;
			this.friendListCount++;
			this.sortFriendsList();
			return;
		}
		
		if (opcode === S_OPCODES.IGNORE_LIST) {
			this.ignoreListCount = Utility.getUnsignedByte(this.incomingPacket[1]);
			
			for (let i1 = 0; i1 < this.ignoreListCount; i1++) {
				this.ignoreList[i1] = Utility.getUnsignedLong(this.incomingPacket, 2 + i1 * 8);
			}
			
			return;
		}
		
		if (opcode === S_OPCODES.PRIVACY_SETTINGS) {
			this.settingsBlockChat = this.incomingPacket[1];
			this.settingsBlockPrivate = this.incomingPacket[2];
			this.settingsBlockTrade = this.incomingPacket[3];
			this.settingsBlockDuel = this.incomingPacket[4];
			return;
		}
		
		if (opcode === S_OPCODES.FRIEND_MESSAGE) {
			let from = Utility.getUnsignedLong(this.incomingPacket, 1);
			let id = Utility.getUnsignedInt(this.incomingPacket, 9);
			
			for (let j2 = 0; j2 < GameConnection.maxSocialListSize; j2++) {
				if (this.privateMessageIds[j2] === id) {
					return;
				}
			}
			
			this.privateMessageIds[this.nextPrivateMessage] = id;
			this.nextPrivateMessage = (this.nextPrivateMessage + 1) % GameConnection.maxSocialListSize;
			let msg = filter(decodeString(this.incomingPacket.slice(13, psize)));
			this.showServerMessage('@pri@' + Utility.hashToUsername(from) + ': tells you ' + msg);
			return;
		}
		
		this.handleIncomingPacket(opcode, psize, this.incomingPacket);
	}
	
	sortFriendsList() {
		// TODO: Rewrite this cleaner.
		let sorting = true;
		
		while (sorting) {
			sorting = false;
			
			for (let i = 0; i < this.friendListCount - 1; i++) {
				if (this.friendListOnline[i] !== 255 && this.friendListOnline[i + 1] === 255 || this.friendListOnline[i] === 0 && this.friendListOnline[i + 1] !== 0) {
					let j = this.friendListOnline[i];
					this.friendListOnline[i] = this.friendListOnline[i + 1];
					this.friendListOnline[i + 1] = j;
					
					let l = this.friendListHashes[i];
					this.friendListHashes[i] = this.friendListHashes[i + 1];
					this.friendListHashes[i + 1] = l;
					
					sorting = true;
				}
			}
		}
	}
	
	sendPrivacySettings(chat, priv, trade, duel) {
		this.clientStream.newPacket(C_OPCODES.SETTINGS_PRIVACY);
		this.clientStream.putByte(chat);
		this.clientStream.putByte(priv);
		this.clientStream.putByte(trade);
		this.clientStream.putByte(duel);
		this.clientStream.sendPacket();
	}
	
	ignoreAdd(s) {
		let l = Utility.encodeBase37(s);
		
		for (let i = 0; i < this.ignoreListCount; i++) {
			if (this.ignoreList[i].equals(l)) {
				return;
			}
		}
		
		this.clientStream.newPacket(C_OPCODES.IGNORE_ADD);
		this.clientStream.putLong(l);
		this.clientStream.sendPacket();
		
		if (this.ignoreListCount < GameConnection.maxSocialListSize) {
			this.ignoreList[this.ignoreListCount++] = l;
		}
	}
	
	ignoreRemove(l) {
		this.clientStream.newPacket(C_OPCODES.IGNORE_REMOVE);
		this.clientStream.putLong(l);
		this.clientStream.sendPacket();
		
		for (let i = 0; i < this.ignoreListCount; i++) {
			if (this.ignoreList[i].equals(l)) {
				this.ignoreListCount--;
				
				for (let j = i; j < this.ignoreListCount; j++) {
					this.ignoreList[j] = this.ignoreList[j + 1];
				}
				
				return;
			}
		}
	}
	
	friendAdd(s) {
		this.clientStream.newPacket(C_OPCODES.FRIEND_ADD);
		this.clientStream.putLong(Utility.encodeBase37(s));
		this.clientStream.sendPacket();
		
		let l = Utility.encodeBase37(s);
		
		for (let i = 0; i < this.friendListCount; i++) {
			if (this.friendListHashes[i].equals(l)) {
				return;
			}
		}
		
		if (this.friendListCount >= GameConnection.maxSocialListSize) {
			return;
		} else {
			this.friendListHashes[this.friendListCount] = l;
			this.friendListOnline[this.friendListCount] = 0;
			this.friendListCount++;
			return;
		}
	}
	
	friendRemove(l) {
		this.clientStream.newPacket(C_OPCODES.FRIEND_REMOVE);
		this.clientStream.putLong(l);
		this.clientStream.sendPacket();
		
		for (let i = 0; i < this.friendListCount; i++) {
			if (!this.friendListHashes[i].equals(l)) {
				continue;
			}
			
			this.friendListCount--;
			
			for (let j = i; j < this.friendListCount; j++) {
				this.friendListHashes[j] = this.friendListHashes[j + 1];
				this.friendListOnline[j] = this.friendListOnline[j + 1];
			}
			
			break;
		}
		
		this.showServerMessage('@pri@' + Utility.hashToUsername(l) + ' has been removed from your friends list');
	}
	
	sendPrivateMessage(u, buff, len) {
		this.clientStream.newPacket(C_OPCODES.PM);
		this.clientStream.putLong(u);
		this.clientStream.putBytes(buff, 0, len);
		this.clientStream.sendPacket();
	}
	
	sendChatMessage(buff, len) {
		this.clientStream.newPacket(C_OPCODES.CHAT);
		this.clientStream.putBytes(buff, 0, len);
		this.clientStream.sendPacket();
	}
	
	sendCommandString(s) {
		this.clientStream.newPacket(C_OPCODES.COMMAND);
		this.clientStream.putString(s);
		this.clientStream.sendPacket();
	}
	
	method43() {
		return true;
	}
}

GameConnection.maxReadTries = 0;
GameConnection.maxSocialListSize = 100;

module.exports = GameConnection;

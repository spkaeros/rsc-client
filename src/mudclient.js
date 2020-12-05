import Color from './lib/graphics/color';
import Font from './lib/graphics/font';
import {Chat, Filter} from './word-filter';
import chatCipher from './chat-cipher';
import GameCharacter from './game-character';
import GameConnection from './game-connection';
import GameException from './lib/game-exception';
import GameData from './game-data';
import GameModel from './game-model';
import Panel from './panel';
import Bubble from './bubble';
import Scene from './scene';
import StreamAudioPlayer from './stream-audio-player';
import Surface from './surface';
import SurfaceSprite from './surface-sprite';
import { Utility, EngineStates, WelcomeStates, GameStates, GamePanels } from './utility';
import World from './world';
import Timer from './timer';
import Packet from './packet';
import VERSION from './version';
import S_OPCODES from './opcodes/server';
import C_OPCODES from './opcodes/client';
import Ops from './gamelib/packets';

const NPC_GIANT_BAT = 43;
const MAX_STAT = 200;
const ZOOM_MIN = 450;
const ZOOM_MAX = 1250;
const ZOOM_INDOORS = 550;
const ZOOM_OUTDOORS = 750;
const MOB_REMOVED_MASK = 0xC;
const ENTITY_LIMIT = 500;
const WINDMILL = 74;

export function getCookie (cname) {
	const name = `${cname}=`;
	const decodedCookie = decodeURIComponent(document.cookie);
	const ca = decodedCookie.split(';');
	for (let i = 0; i < ca.length; i++) {
		let c = ca[i];
		while (c.charAt(0) === ' ') {
			c = c.substring(1);
		}
		if (c.indexOf(name) === 0) {
			return c.substring(name.length, c.length);
		}
	}
	return "";
}

export function setCookie (cname,cvalue) {
	document.cookie = (`${cname}=${cvalue}; Max-Age=2600000; SameSite=Lax; Secure;`);
}

export function framesToSeconds(n) {
	return n/50;
}

export function secondsToFrames(n) {
	return n*50;
}

export function formatNumber(n) {
	let s = i.toString();
	for (let j = s.length - 3; j > 0; j -= 3)
		s = s.substring(0, j) + ',' + s.substring(j);

	if (s.length > 8)
		s = '@gre@' + s.substring(0, s.length - 8) + ' million @whi@(' + s + ')';
	else if (s.length > 4)
		s = '@cya@' + s.substring(0, s.length - 4) + 'K @whi@(' + s + ')';

	return s;
}

export function remove(arr,elem) {
	for (let t = 0; t < arr.length; t += 1) {
		if (arr[t] === elem) {
			if (t < arr.length-1) {
				arr = arr.slice(0, t).concat(arr.slice(t+1));
			} else {
				arr = arr.slice(0, t);
			}
			return arr;
		}
	}
	return;
}

export function removeIdx(arr,t) {
	return arr.slice(0, t).concat(arr.slice(t+1))
}

export function append(arr,elem) {
	return arr.concat(elem);
}

export function fromCharArray(a) {
	return Array.from(a).map(c => String.fromCharCode(c)).join('');
}

export default class mudclient extends GameConnection {
	constructor(canvas) {
		super(canvas);
		this.welcomed = false;
		this.prayers = [ false, false, false, false, false, false, false, false, false, false, false, false, false, false ];
		this.chatHistory = [];
		this.tickables = [];
		this.tickablesCaret = 0;
		this.combatTimer = new Timer(-1);
		this.addTimer(this.combatTimer);
		this.pathStepsMax = 8000;
		this.entitysMax = ENTITY_LIMIT;
		this.playersMax = ENTITY_LIMIT;
		this.npcsMax = ENTITY_LIMIT;
		this.wallObjectsMax = ENTITY_LIMIT;
		this.playersServerMax = 4000;
		this.groundItemsMax = ENTITY_LIMIT*10;
		this.npcsServerMax = ENTITY_LIMIT*10;
		this.objectsMax = ENTITY_LIMIT*3;
		this.playerStatCount = 18;
		this.playerStatEquipmentCount = 5;
		this.questCount = 50;
		this.savePass = getCookie("savePass") === 'true';
		this.localRegionX = 0;
		this.localRegionY = 0;
		this.controlTextListChat = 0;
		this.controlTextListAll = 0;
		this.controlTextListQuest = 0;
		this.controlTextListPrivate = 0;
		this.messageTabSelected = 0;
		this.mouseClickXX = 0;
		this.mouseClickXY = 0;
		this.controlListSocialPlayers = 0;
		this.uiTabSocialSubTab = 0;
		this.privateMessageTarget = 0;
		this.controlListQuest = 0;
		this.uiTabPlayerInfoSubTab = 0;
		this.controlListMagic = 0;
		this.tabMagicPrayer = 0;
		this.packetErrorCount = 0;
		this.mouseButtonDownTime = 0;
		this.mouseItemTickDelta = 0;
		this.anInt659 = 0;
		this.anInt660 = 0;
		this.cameraRotationX = 0;
		this.scene = void 0;
		this.reportAbuseState = 0;
		this.tradeConfirmAccepted = false;
		this.audioPlayer = void 0;
		this.appearanceHeadType = 0;
		this.appearanceSkinColour = 0;
		this.contactsInputCtx = 0;
		this.dialogItemInput = 0;
		this.anInt707 = 0;
		this.deathScreenTimeout = 0;
		this.cameraRotationY = 0;
		this.combatStyle = 0;
		this.unreadMessageCount = 0;
		this.controlButtonAppearanceHead1 = 0;
		this.controlButtonAppearanceHead2 = 0;
		this.controlButtonAppearanceHair1 = 0;
		this.controlButtonAppearanceHair2 = 0;
		this.controlButtonAppearanceGender1 = 0;
		this.controlButtonAppearanceGender2 = 0;
		this.controlButtonAppearanceTop1 = 0;
		this.controlButtonAppearanceTop2 = 0;
		this.controlButtonAppearanceSkin1 = 0;
		this.controlButtonAppearanceSkin2 = 0;
		this.controlButtonAppearanceBottom1 = 0;
		this.controlButtonAppearanceBottom2 = 0;
		this.controlButtonAppearanceAccept = 0;
		this.logoutBoxFrames = 0;
		this.tradeRecipientConfirmHash = 0;
		this.frameCounter = 0;
		this.npcCombatModelArray2 = Int32Array.from([0, 0, 0, 0, 0, 1, 2, 1]);
		this.systemUpdate = 0;
		this.regionX = 0;
		this.regionY = 0;
		this.mouseButtonClick = 0;
		this.questName = [
			'Black knight\'s fortress', 'Cook\'s assistant', 'Demon slayer', 'Doric\'s quest', 'The restless ghost', 'Goblin diplomacy', 'Ernest the chicken', 'Imp catcher', 'Pirate\'s treasure', 'Prince Ali rescue',
			'Romeo & Juliet', 'Sheep shearer', 'Shield of Arrav', 'The knight\'s sword', 'Vampire slayer', 'Witch\'s potion', 'Dragon slayer', 'Witch\'s house (members)', 'Lost city (members)', 'Hero\'s quest (members)',
			'Druidic ritual (members)', 'Merlin\'s crystal (members)', 'Scorpion catcher (members)', 'Family crest (members)', 'Tribal totem (members)', 'Fishing contest (members)', 'Monk\'s friend (members)', 'Temple of Ikov (members)', 'Clock tower (members)', 'The Holy Grail (members)',
			'Fight Arena (members)', 'Tree Gnome Village (members)', 'The Hazeel Cult (members)', 'Sheep Herder (members)', 'Plague City (members)', 'Sea Slug (members)', 'Waterfall quest (members)', 'Biohazard (members)', 'Jungle potion (members)', 'Grand tree (members)',
			'Shilo village (members)', 'Underground pass (members)', 'Observatory quest (members)', 'Tourist trap (members)', 'Watchtower (members)', 'Dwarf Cannon (members)', 'Murder Mystery (members)', 'Digsite (members)', 'Gertrude\'s Cat (members)', 'Legend\'s Quest (members)'
		];
		this.healthBarCount = 0;
		this.controlLoginStatus = 0;
		this.controlLoginUser = 0;
		this.controlLoginPass = 0;
		this.controlLoginOk = 0;
		this.controlLoginCancel = 0;
		this.teleportBubbleCount = 0;
		this.mouseClickCount = 0;
		this.shopSellPriceMod = 0;
		this.shopBuyPriceMod = 0;
		this.duelOptionRetreat = 0;
		this.duelOptionMagic = 0;
		this.duelOptionPrayer = 0;
		this.duelOptionWeapons = 0;
		this.groundItemCount = 0;
		this.receivedMessagesCount = 0;
		this.messageTabFlashAll = 0;
		this.messageTabFlashHistory = 0;
		this.messageTabFlashQuest = 0;
		this.messageTabFlashPrivate = 0;
		this.bankItemCount = 0;
		this.objectAnimationNumberFireLightningSpell = 0;
		this.objectAnimationNumberTorch = 0;
		this.objectAnimationNumberClaw = 0;
		this.npcCount = 0;
		this.npcCacheCount = 0;
		this.objectAnimationCount = 0;
		this.tradeConfirmItemsCount = 0;
		this.mouseClickXStep = 0;
		this.newBankItemCount = 0;
		this.npcAnimationArray = [
			Int32Array.from([11, 2, 9, 7, 1, 6, 10, 0, 5, 8, 3, 4]),
			Int32Array.from([11, 2, 9, 7, 1, 6, 10, 0, 5, 8, 3, 4]),
			Int32Array.from([11, 3, 2, 9, 7, 1, 6, 10, 0, 5, 8, 4]),
			Int32Array.from([3, 4, 2, 9, 7, 1, 6, 10, 8, 11, 0, 5]),
			Int32Array.from([3, 4, 2, 9, 7, 1, 6, 10, 8, 11, 0, 5]),
			Int32Array.from([4, 3, 2, 9, 7, 1, 6, 10, 8, 11, 0, 5]),
			Int32Array.from([11, 4, 2, 9, 7, 1, 6, 10, 0, 5, 8, 3]),
			Int32Array.from([11, 2, 9, 7, 1, 6, 10, 0, 5, 8, 4, 3]),
		];
		this.controlWelcomeNewuser = 0;
		this.controlWelcomeExistinguser = 0;
		this.npcWalkModel = Int32Array.from([0, 1, 2, 1]);
		this.referid = 0;
		this.controlRegisterUser = 0;
		this.controlRegisterPassword = 0;
		this.controlRegisterConfirmPassword = 0;
		this.controlRegisterSubmit = 0;
		this.controlRegisterCancel = 0;
		this.controlRegisterCheckbox = 0;
		this.controlLoginSavePass = 0;
		this.controlRegisterStatus = 0;
		// this.combatTimeout = 0;
		this.optionMenuCount = 0;
		this.reportAbuseOffence = 0;
		this.cameraRotationTime = 0;
		this.duelOpponentItemsCount = 0;
		this.duelItemsCount = 0;
		this.characterSkinColours = Int32Array.from([0xecded0, 0xccb366, 0xb38c40, 0x997326, 0x906020]);
		this.duelOfferOpponentItemCount = 0;
		this.characterTopBottomColours = Int32Array.from([
			0xff0000, 0xff8000, 0xffe000, 0xa0e000, 57344, 32768, 41088, 45311, 33023, 12528,
			0xe000e0, 0x303030, 0x604000, 0x805000, 0xffffff
		]);
		this.itemsAboveHeadCount = 0;
		this.wildAwarenessLvl = 0;
		this.selectedItemInventoryIndex = 0;
		this.soundData = void 0;
		this.statFatigue = 0;
		this.fatigueSleeping = 0;
		this.tradeRecipientConfirmItemsCount = 0;
		this.tradeRecipientItemsCount = 0;
		this.showDialogServermessage = false;
		this.menuX = 0;
		this.menuY = 0;
		this.menuWidth = 0;
		this.menuHeight = 0;
		this.menuItemsCount = 0;
		this.menuMaxSize = 256;
		this.menuItemID = new Uint32Array(this.menuMaxSize);
		this.menuItemText1 = new Array(this.menuMaxSize);
		this.menuItemText2 = new Array(this.menuMaxSize);
		this.menuIndices = new Uint32Array(this.menuMaxSize);
		this.menuItemX = new Uint32Array(this.menuMaxSize);
		this.menuItemY = new Uint32Array(this.menuMaxSize);
		this.menuSourceType = new Uint32Array(this.menuMaxSize);
		this.menuSourceIndex = new Uint32Array(this.menuMaxSize);
		this.menuTargetIndex = new Uint32Array(this.menuMaxSize);
		this.showUiTab = 0;
		this.tradeItemsCount = 0;
		this.planeWidth = 0;
		this.planeHeight = 0;
		this.planeMultiplier = 0;
		this.playerQuestPoints = 0;
		this.characterHairColours = Int32Array.from([0xFFC030, 0xFFA040, 0x805030, 0x604020, 0x303030, 0xFF6020, 0xFF4000, 0xFFFFFF, 0x00FF00, 0x00FFFF]);
		this.bankActivePage = 0;
		this.daysSinceLogin = 0;
		this.equipmentStatNames = ['Armour', 'WeaponAim', 'WeaponPower', 'Magic', 'Prayer'];
		this.inventoryItemsCount = 0;
		this.skillNameShort = [
			'Attack', 'Defense', 'Strength', 'Hits', 'Ranged', 'Prayer', 'Magic', 'Cooking', 'Woodcut', 'Fletching',
			'Fishing', 'Firemaking', 'Crafting', 'Smithing', 'Mining', 'Herblaw', 'Agility', 'Thieving'
		];
		this.duelOpponentNameHash = 0;
		this.objectCount = 0;
		this.skillNamesLong = [
			'Attack', 'Defense', 'Strength', 'Hits', 'Ranged', 'Prayer', 'Magic', 'Cooking', 'Woodcutting', 'Fletching',
			'Fishing', 'Firemaking', 'Crafting', 'Smithing', 'Mining', 'Herblaw', 'Agility', 'Thieving'
		];
		this.duelOfferItemCount = 0;
		this.cameraAutoRotatePlayerX = 0;
		this.cameraAutoRotatePlayerY = 0;
		this.npcCombatModelArray1 = Int32Array.from([0, 1, 2, 1, 0, 0, 0, 0]);
		this.playerCount = 0;
		this.knownPlayerCount = 0;
		this.spriteCount = 0;
		this.wallObjectCount = 0;
		this.welcomeRecoverySetDays = 0;
		this.localLowerX = 0;
		this.localLowerY = 0;
		this.localUpperX = 0;
		this.localUpperY = 0;
		this.world = void 0;
		this.lastRemoteIP = 0;
		this.sleepWordDelayTimer = 0;
		this.cameraAutoAngleDebug = false;
		this.wallObjectDirection = new Int32Array(this.wallObjectsMax);
		this.wallObjectId = new Int32Array(this.wallObjectsMax);
		this.cameraRotationXIncrement = 2;
		this.inventoryMaxItemCount = 30;
		this.bankItemsMax = 48*4;
		this.optionMenuEntry = new Array(5);
		this.newBankItems = new Int32Array(256);
		this.newBankItemsCount = new Int32Array(256);
		this.teleportBubbleTime = new Int32Array(50);
		this.tradeConfirmVisible = false;
		this.tradeConfirmAccepted = false;
		this.receivedMessageX = new Int32Array(50);
		this.receivedMessageY = new Int32Array(50);
		this.receivedMessageMidPoint = new Int32Array(50);
		this.receivedMessageHeight = new Int32Array(50);
		this.localPlayer = new GameCharacter();
		this.localPlayerServerIndex = -1;
		this.tradeConfigVisible = false;
		this.bankItems = new Int32Array(256);
		this.bankItemsCount = new Int32Array(256);
		this.appearanceBodyGender = 1;
		this.appearance2Colour = 2;
		this.appearanceHairColour = 2;
		this.appearanceTopColour = 8;
		this.appearanceBottomColour = 14;
		this.appearanceHeadGender = 1;
		this.loginUser = getCookie("username");
		this.loginPass = '';
		this.registerUser = '';
		this.registerPassword = '';
		this.cameraAngle = 1;
		this.members = false;
		this.optionSoundDisabled = false;
		this.visibleContextMenu = false;
		this.cameraRotationYIncrement = 2;
		this.objectAlreadyInMenu = new Uint8Array(this.objectsMax);
		this.duelOpponentName = '';
		this.lastObjectAnimationNumberFireLightningSpell = -1;
		this.lastObjectAnimationNumberTorch = -1;
		this.lastObjectAnimationNumberClaw = -1;
		this.planeIndex = -1;
		this.isSleeping = false;
		this.cameraRotation = 128;
		this.playerExperience = new Int32Array(this.playerStatCount);
		this.tradeRecipientAccepted = false;
		this.tradeAccepted = false;
		// this.mouseClickXHistory = new Int32Array(8192);
		// this.mouseClickYHistory = new Int32Array(8192);
		this.teleportBubbleX = new Int32Array(50);
		this.teleportBubbleY = new Int32Array(50);
		this.receivedMessages = new Array(50);
		this.duelConfirmVisible = false;
		this.duelAccepted = false;
		this.playersServerIndexes = new Int32Array(this.playersMax);
		this.players = new Array(this.playersMax);
		this.wallObjectAlreadyInMenu = new Int8Array(this.wallObjectsMax);
		this.tileSize = 128;
		this.fogOfWar = false;
		this.gameWidth = 512;
		this.gameHeight = 334;
		this.tradeConfirmItems = new Int32Array(14);
		this.tradeConfirmItemCount = new Int32Array(14);
		this.tradeRecipientName = '';
		this.selectedSpell = -1;
		this.showOptionMenu = false;
		this.playerStatCurrent = new Int32Array(this.playerStatCount);
		this.teleportBubbleType = new Int32Array(50);
		this.shopVisible = false;
		this.shopItem = new Int32Array(256);
		this.shopItemCount = new Int32Array(256);
		this.shopItemPrice = new Int32Array(256);
		this.duelOfferOpponentAccepted = false;
		this.duelOfferAccepted = false;
		this.gameModels = new Array(1000);
		this.duelConfigVisible = false;
		this.serverMessage = '';
		this.serverMessageBoxTop = false;
		this.duelOpponentItemList = [];
		this.duelItemList = [];
		this.playerStatBase = new Int32Array(this.playerStatCount);
		this.npcsCache = new Array(this.npcsMax);
		this.groundItemX = new Int32Array(this.groundItemsMax);
		this.groundItemY = new Int32Array(this.groundItemsMax);
		this.groundItemId = new Int32Array(this.groundItemsMax);
		this.groundItemZ = new Int32Array(this.groundItemsMax);
		this.bankSelectedItemSlot = -1;
		this.bankSelectedItem = -2;
		this.duelOfferItemList = [];
		this.duelOfferOpponentItemList = [];
		this.duelOfferOpponentItemId = new Int32Array(8);
		this.duelOfferOpponentItemStack = new Int32Array(8);
		this.optionCameraModeAuto = true;
		this.objectX = new Int32Array(this.objectsMax);
		this.objectY = new Int32Array(this.objectsMax);
		this.objectId = new Int32Array(this.objectsMax);
		this.objectDirection = new Int32Array(this.objectsMax);
		this.selectedItemInventoryIndex = -1;
		this.selectedItemName = '';
		this.loadingArea = false;
		this.tradeRecipientConfirmItems = new Int32Array(14);
		this.tradeRecipientConfirmItemCount = new Int32Array(14);
		this.tradeRecipientItems = new Int32Array(14);
		this.tradeRecipientItemCount = new Int32Array(14);
		this.showDialogServermessage = false;
		this.questComplete = new Array(this.questCount);
		this.wallObjectModel = new Array(this.wallObjectsMax);
		this.actionBubbleX = new Int32Array(50);
		this.actionBubbleY = new Int32Array(50);
		this.cameraZoom = ZOOM_INDOORS; // 400-1250
		this.tradeItems = new Int32Array(14);
		this.tradeItemCount = new Int32Array(14);
		this.lastHeightOffset = -1;
		this.duelSettingsRetreat = false;
		this.duelSettingsMagic = false;
		this.duelSettingsPrayer = false;
		this.duelSettingsWeapons = false;
		this.bankVisible = false;
		this.optionMouseButtonOne = false;
		this.inventoryItemId = new Uint16Array(30);
		this.inventoryItemStackCount = new Uint32Array(30);
		this.inventoryEquipped = new Array(30);
		this.knownPlayers = new Array(this.playersMax);
		this.messageHistory = [];
		this.reportAbuseMute = false;
		this.actionBubbleScale = new Int32Array(50);
		this.actionBubbleItem = new Int32Array(50);
		this.sleepWordDelay = true;
		this.showAppearanceChange = false;
		this.shopSelectedItemIndex = -1;
		this.shopSelectedItemType = -2;
		this.projectileFactor = 40;
		this.npcs = new Array(this.npcsMax);
		this.healthBarX = new Int32Array(50);
		this.healthBarY = new Int32Array(50);
		this.healthBarMissing = new Int32Array(50);
		this.playersServer = new Array(this.playersServerMax);
		this.walkPathX = new Int16Array(this.pathStepsMax);
		this.walkPathY = new Int16Array(this.pathStepsMax);
		this.wallObjectX = new Int32Array(this.wallObjectsMax);
		this.wallObjectY = new Int32Array(this.wallObjectsMax);
		this.npcsServer = new Array(this.npcsServerMax);
		this.playerStatEquipment = new Uint32Array(this.playerStatEquipmentCount);
		this.objectModel = new Array(this.objectsMax);
	}

	addTimer(timer) {
		// this.tickables = append(this.tickables, timer);
		this.tickables = this.tickables.concat(timer);
	}

	removeTimer() {
		this.tickables = remove(this.tickables, timer);
	}

	playSoundFile(s) {
		if (!this.audioPlayer)
			return;

		if (!this.optionSoundDisabled)
			this.audioPlayer.writeStream(this.soundData, Utility.getDataFileOffset(s + '.pcm', this.soundData), Utility.getDataFileLength(s + '.pcm', this.soundData));
	}

	renderReportAbuse() {
		this.reportAbuseOffence = 0;
		let y = 135;

		for (let i = 0; i < 12; i++) {
			if (this.mouseX > 66 && this.mouseX < 446 && this.mouseY >= y - 12 && this.mouseY < y + 3) {
				this.reportAbuseOffence = i + 1;
			}

			y += 14;
		}

		if (this.mouseButtonClick !== 0 && this.reportAbuseOffence !== 0) {
			this.mouseButtonClick = 0;
			this.reportAbuseState = 2;
			this.inputTextCurrent = '';
			this.inputTextFinal = '';
			return;
		}

		y += 15;

		if (this.mouseButtonClick !== 0) {
			this.mouseButtonClick = 0;

			if (this.mouseX < 56 || this.mouseY < 35 || this.mouseX > 456 || this.mouseY > 325) {
				this.reportAbuseState = 0;
				return;
			}

			if (this.mouseX > 66 && this.mouseX < 446 && this.mouseY >= y - 15 && this.mouseY < y + 5) {
				this.reportAbuseState = 0;
				return;
			}
		}

		this.surface.drawBox(56, 35, 400, 290, 0);
		this.surface.drawBoxEdge(56, 35, 400, 290, 0xffffff);
		y = 50;
		this.surface.drawStringCenter('This form is for reporting players who are breaking our rules', 256, y, 1, 0xffffff);
		y += 15;
		this.surface.drawStringCenter('Using it sends a snapshot of the last 60 secs of activity to us', 256, y, 1, 0xffffff);
		y += 15;
		this.surface.drawStringCenter('If you misuse this form, you will be banned.', 256, y, 1, 0xff8000);
		y += 15;
		y += 10;
		this.surface.drawStringCenter('First indicate which of our 12 rules is being broken. For a detailed', 256, y, 1, 0xffff00);
		y += 15;
		this.surface.drawStringCenter('explanation of each rule please read the manual on our website.', 256, y, 1, 0xffff00);
		y += 15;

		let textColour = 0;

		if (this.reportAbuseOffence === 1) {
			this.surface.drawBoxEdge(66, y - 12, 380, 15, 0xffffff);
			textColour = 0xff8000;
		} else {
			textColour = 0xffffff;
		}

		this.surface.drawStringCenter('1: Offensive language', 256, y, 1, textColour);
		y += 14;

		if (this.reportAbuseOffence === 2) {
			this.surface.drawBoxEdge(66, y - 12, 380, 15, 0xffffff);
			textColour = 0xff8000;
		} else {
			textColour = 0xffffff;
		}

		this.surface.drawStringCenter('2: Item scamming', 256, y, 1, textColour);
		y += 14;

		if (this.reportAbuseOffence === 3) {
			this.surface.drawBoxEdge(66, y - 12, 380, 15, 0xffffff);
			textColour = 0xff8000;
		} else {
			textColour = 0xffffff;
		}

		this.surface.drawStringCenter('3: Password scamming', 256, y, 1, textColour);
		y += 14;

		if (this.reportAbuseOffence === 4) {
			this.surface.drawBoxEdge(66, y - 12, 380, 15, 0xffffff);
			textColour = 0xff8000;
		} else {
			textColour = 0xffffff;
		}

		this.surface.drawStringCenter('4: Bug abuse', 256, y, 1, textColour);
		y += 14;

		if (this.reportAbuseOffence === 5) {
			this.surface.drawBoxEdge(66, y - 12, 380, 15, 0xffffff);
			textColour = 0xff8000;
		} else {
			textColour = 0xffffff;
		}

		this.surface.drawStringCenter('5: Jagex Staff impersonation', 256, y, 1, textColour);
		y += 14;

		if (this.reportAbuseOffence === 6) {
			this.surface.drawBoxEdge(66, y - 12, 380, 15, 0xffffff);
			textColour = 0xff8000;
		} else {
			textColour = 0xffffff;
		}

		this.surface.drawStringCenter('6: Account sharing/trading', 256, y, 1, textColour);
		y += 14;

		if (this.reportAbuseOffence === 7) {
			this.surface.drawBoxEdge(66, y - 12, 380, 15, 0xffffff);
			textColour = 0xff8000;
		} else {
			textColour = 0xffffff;
		}

		this.surface.drawStringCenter('7: Macroing', 256, y, 1, textColour);
		y += 14;

		if (this.reportAbuseOffence === 8) {
			this.surface.drawBoxEdge(66, y - 12, 380, 15, 0xffffff);
			textColour = 0xff8000;
		} else {
			textColour = 0xffffff;
		}

		this.surface.drawStringCenter('8: Mutiple logging in', 256, y, 1, textColour);
		y += 14;

		if (this.reportAbuseOffence === 9) {
			this.surface.drawBoxEdge(66, y - 12, 380, 15, 0xffffff);
			textColour = 0xff8000;
		} else {
			textColour = 0xffffff;
		}

		this.surface.drawStringCenter('9: Encouraging others to break rules', 256, y, 1, textColour);
		y += 14;

		if (this.reportAbuseOffence === 10) {
			this.surface.drawBoxEdge(66, y - 12, 380, 15, 0xffffff);
			textColour = 0xff8000;
		} else {
			textColour = 0xffffff;
		}

		this.surface.drawStringCenter('10: Misuse of customer support', 256, y, 1, textColour);
		y += 14;

		if (this.reportAbuseOffence === 11) {
			this.surface.drawBoxEdge(66, y - 12, 380, 15, 0xffffff);
			textColour = 0xff8000;
		} else {
			textColour = 0xffffff;
		}

		this.surface.drawStringCenter('11: Advertising / website', 256, y, 1, textColour);
		y += 14;

		if (this.reportAbuseOffence === 12) {
			this.surface.drawBoxEdge(66, y - 12, 380, 15, 0xffffff);
			textColour = 0xff8000;
		} else {
			textColour = 0xffffff;
		}

		this.surface.drawStringCenter('12: Real world item trading', 256, y, 1, textColour);
		y += 14;
		y += 15;
		textColour = 0xffffff;

		if (this.mouseX > 196 && this.mouseX < 316 && this.mouseY > y - 15 && this.mouseY < y + 5) {
			textColour = 0xffff00;
		}

		this.surface.drawStringCenter('Click here to cancel', 256, y, 1, textColour);
	}

	walkToMob(sx, sy, dx, dy, action) {
		this.walkToEntity(sx, sy, dx, dy, dx, dy, false, action);
	}

	walkToPoint(x, y, dstX, dstY) {
		this.walkToEntity(x, y, dstX, dstY, dstX, dstY, false, false);
	}
	
	walkToEntity(startX, startY, x1, y1, x2, y2, checkObjects, walkToAction) {
		let steps = this.world.route(startX, startY, x1, y1, x2, y2, this.walkPathX, this.walkPathY, checkObjects);

		if (steps === -1) {
			if (walkToAction) {
				steps = 1;
				this.walkPathX[0] = x1;
				this.walkPathY[0] = y1;
			} else {
				return false;
			}
		}
		
		steps--;
		startX = this.walkPathX[steps];
		startY = this.walkPathY[steps];
		steps--;

		this.clientStream.queue(Ops.WALK(steps, startX, startY, x1, y1, x2, y2, checkObjects, walkToAction));
		this.mouseClickXStep = -24;
		this.mouseClickXX = this.mouseX;
		this.mouseClickXY = this.mouseY;
		return true;
	}

	walkTo(startX, startY, x1, y1, x2, y2, checkObjects, walkToAction) {
		let steps = this.world.route(startX, startY, x1, y1, x2, y2, this.walkPathX, this.walkPathY, checkObjects);

		if (steps === -1)
			return false;

		steps--;
		startX = this.walkPathX[steps];
		startY = this.walkPathY[steps];
		steps--;

		this.clientStream.queue(Ops.WALK(steps, startX, startY, x1, y1, x2, y2, checkObjects, walkToAction));

		this.mouseClickXStep = -24;
		this.mouseClickXX = this.mouseX;
		this.mouseClickXY = this.mouseY;

		return true;
	}

	drawMinimapEntity(x, y, c) {
		this.surface.setPixel(x, y, c);
		this.surface.setPixel(x - 1, y, c);
		this.surface.setPixel(x + 1, y, c);
		this.surface.setPixel(x, y - 1, c);
		this.surface.setPixel(x, y + 1, c);
	}

	updateBankItems() {
		this.bankItemCount = this.newBankItemCount;

		for (let i = 0; i < this.newBankItemCount; i++) {
			this.bankItems[i] = this.newBankItems[i];
			this.bankItemsCount[i] = this.newBankItemsCount[i];
		}

inventory:
		for (let invIdx = 0; invIdx < this.inventoryItemsCount; invIdx++) {
			if (this.bankItemCount >= this.bankItemsMax)
				break;

			let invId = this.inventoryItemId[invIdx];

			for (let bankidx = 0; bankidx < this.bankItemCount; bankidx++) {
				if (this.bankItems[bankidx] === invId) {
					continue inventory;
				}
			}
			this.bankItems[this.bankItemCount] = invId;
			this.bankItemsCount[this.bankItemCount] = 0;//this.inventoryItemStackCount[invIdx];
			this.bankItemCount++;
		}
	}

	renderWildernessWarning() {
		let y = 97;
		this.surface.drawBox(86, 77, 340, 180, 0);
		this.surface.drawBoxEdge(86, 77, 340, 180, 0xffffff);
		this.surface.drawStringCenter('Warning! Proceed with caution', 256, y, 4, 0xff0000);
		y += 26;
		this.surface.drawStringCenter('If you go much further north you will enter the', 256, y, 1, 0xffffff);
		y += 13;
		this.surface.drawStringCenter('wilderness. This a very dangerous area where', 256, y, 1, 0xffffff);
		y += 13;
		this.surface.drawStringCenter('other players can attack you!', 256, y, 1, 0xffffff);
		y += 22;
		this.surface.drawStringCenter('The further north you go the more dangerous it', 256, y, 1, 0xffffff);
		y += 13;
		this.surface.drawStringCenter('becomes, but the more treasure you will find.', 256, y, 1, 0xffffff);
		y += 22;
		this.surface.drawStringCenter('In the wilderness an indicator at the bottom-right', 256, y, 1, 0xffffff);
		y += 13;
		this.surface.drawStringCenter('of the screen will show the current level of danger', 256, y, 1, 0xffffff);
		y += 22;

		let color = (this.mouseY > y - 12 && this.mouseY <= y && this.mouseX > 181 && this.mouseX < 331) ? 0xFF0000 : 0xFFFFFF;
		this.surface.drawStringCenter('Click here to close window', 256, y, 1, color);

		if (this.mouseButtonClick !== 0) {
			if (this.mouseY > y - 12 && this.mouseY <= y && this.mouseX > 181 && this.mouseX < 331)
				this.wildAwarenessLvl = 2;

			if (this.mouseX < 86 || this.mouseX > 426 || this.mouseY < 77 || this.mouseY > 257)
				this.wildAwarenessLvl = 2;

			this.mouseButtonClick = 0;
		}
	}

	renderLocalMobEffects() {
		for (let msgIdx = 0; msgIdx < this.receivedMessagesCount; msgIdx++) {
			let txtHeight = this.surface.textHeight(1);
			let x = this.receivedMessageX[msgIdx];
			let y = this.receivedMessageY[msgIdx];
			let mId = this.receivedMessageMidPoint[msgIdx];
			let msgHeight = this.receivedMessageHeight[msgIdx];
			let flag = true;

			while (flag) {
				flag = false;

				for (let i4 = 0; i4 < msgIdx; i4++) {
					if (y + msgHeight > this.receivedMessageY[i4] - txtHeight && y - txtHeight < this.receivedMessageY[i4] + this.receivedMessageHeight[i4] &&
							x - mId < this.receivedMessageX[i4] + this.receivedMessageMidPoint[i4] && x + mId > this.receivedMessageX[i4] - this.receivedMessageMidPoint[i4] &&
							this.receivedMessageY[i4] - txtHeight - msgHeight < y) {
						y = this.receivedMessageY[i4] - txtHeight - msgHeight;
						flag = true;
					}
				}
			}

			this.receivedMessageY[msgIdx] = y;
			this.surface.centrepara(this.receivedMessages[msgIdx], x, y, 1, 0xffff00, 300);
		}

		for (let itemIdx = 0; itemIdx < this.itemsAboveHeadCount; itemIdx++) {
			let x = this.actionBubbleX[itemIdx];
			let y = this.actionBubbleY[itemIdx];
			let scale = this.actionBubbleScale[itemIdx];
			let id = this.actionBubbleItem[itemIdx];
			let scaleX = (39 * scale) / 100 | 0;
			let scaleY = (27 * scale) / 100 | 0;

			this.surface.drawActionBubble(x - ((scaleX / 2) | 0), y - scaleY, scaleX, scaleY, mudclient.spriteMedia + 9, 85);

			let scaleXClip = Math.floor((36 * scale) / 100);
			let scaleYClip = Math.floor((24 * scale) / 100);

			this.surface._spriteClipping_from9(x - Math.floor(scaleXClip / 2), (y - scaleY + Math.floor(scaleY / 2)) - ((scaleYClip / 2) | 0), scaleXClip, scaleYClip, GameData.itemPicture[id] + mudclient.spriteItem, GameData.itemMask[id], 0, 0, false);
		}

		for (let j1 = 0; j1 < this.healthBarCount; j1++) {
			let i2 = this.healthBarX[j1];
			let l2 = this.healthBarY[j1];
			let k3 = this.healthBarMissing[j1];

			this.surface.drawBoxAlpha(i2 - 15, l2 - 3, k3, 5, 0x00FF00, 0xC0);
			this.surface.drawBoxAlpha((i2 - 15) + k3, l2 - 3, 30 - k3, 5, 0xff0000, 0xC0);
		}
	}

	createMessageTabPanel() {
		this.panelGame[GamePanels.CHAT] = new Panel(this.surface, 10);
		this.controlTextListAll = this.panelGame[GamePanels.CHAT].addTextListInput(7, 324, 498, 14, 1, 80, false, true);
		this.controlTextListChat = this.panelGame[GamePanels.CHAT].addTextList(5, 269, 502, 56, 1, 20, true);
		this.controlTextListQuest = this.panelGame[GamePanels.CHAT].addTextList(5, 269, 502, 56, 1, 20, true);
		this.controlTextListPrivate = this.panelGame[GamePanels.CHAT].addTextList(5, 269, 502, 56, 1, 20, true);
		this.panelGame[GamePanels.CHAT].setFocus(this.controlTextListAll);
	}

	freeCacheMemory() {
		if (this.surface) {
			this.surface.clear();
			this.surface.pixels = void 0;
			this.surface = void 0;
		}

		if (this.scene) {
			this.scene.dispose();
			this.scene = void 0;
		}

		this.gameModels = void 0;
		this.objectModel = void 0;
		this.wallObjectModel = void 0;
		this.playersServer = void 0;
		this.players = void 0;
		this.npcsServer = void 0;
		this.npcs = void 0;
		this.localPlayer = new GameCharacter();

		if (this.world) {
			this.world.terrainModels = void 0;
			this.world.wallModels = void 0;
			this.world.roofModels = void 0;
			this.world.parentModel = void 0;
			this.world = void 0;
		}
	}

	drawUi() {
		if (this.logoutBoxFrames !== 0) {
			this.renderLogoutNotification();
			this.mouseButtonClick = 0;
			return;
		}
		if (this.welcomeBoxVisible) {
			this.renderWelcomeNotification();
			this.mouseButtonClick = 0;
			return;
		}
		if (this.serverMessageVisible) {
			this.renderServerMessageBox();
			this.mouseButtonClick = 0;
			return;
		}
		if (this.wildAwarenessLvl === 1) {
			this.renderWildernessWarning();
			this.mouseButtonClick = 0;
			return;
		}
		if (this.bankVisible && !this.combatTimer.enabled) {
			this.renderBank();
			this.mouseButtonClick = 0;
			return;
		}
		if (this.shopVisible && !this.combatTimer.enabled) {
			this.renderShop();
			this.mouseButtonClick = 0;
			return;
		}
		if (this.tradeConfirmVisible) {
			this.renderConfirmTrade();
			this.mouseButtonClick = 0;
			return;
		}
		if (this.tradeConfigVisible) {
			this.renderTradeScreen();
			this.mouseButtonClick = 0;
			return;
		}
		if (this.duelConfirmVisible) {
			this.renderConfirmDuel();
			this.mouseButtonClick = 0;
			return;
		}
		if (this.duelConfigVisible) {
			this.renderDuelScreen();
			this.mouseButtonClick = 0;
			return;
		}
		if (this.reportAbuseState === 1) {
			this.renderReportAbuse();
			this.mouseButtonClick = 0;
			return;
		}
		if (this.reportAbuseState === 2) {
			this.renderReportAbuseInputs();
			this.mouseButtonClick = 0;
			return;
		}
		if (this.contactsInputCtx !== 0) {
			this.renderSocialInputBox();
			this.mouseButtonClick = 0;
			return;
		}

		// cyan OptionMenu in top left
		if (this.showOptionMenu)
			this.renderOptionsMenu();

		// Fight mode selector in top left
		if (this.localPlayer.isFighting())
			this.renderFightModeSelect();

		// Actuates the onhover behaviors observed with the top right buttons
		this.openHoveredTab();

		let noVisibleMenus = !this.showOptionMenu && !this.visibleContextMenu;
		if (noVisibleMenus) {
			this.menuItemsCount = 0;

			// this check is maybe to allow overlayed panels the chance to have their own right click menu entries
			if (this.showUiTab === 0)
				this.populateContextMenu();
		}

		if (this.showUiTab === 1)
			this.renderInventoryTab(noVisibleMenus);
		if (this.showUiTab === 2)
			this.renderMinimapTab(noVisibleMenus);
		if (this.showUiTab === 3)
			this.renderStatsTab(noVisibleMenus);
		if (this.showUiTab === 4)
			this.renderMagicTab(noVisibleMenus);
		if (this.showUiTab === 5)
			this.renderContactsTab(noVisibleMenus);
		if (this.showUiTab === 6)
			this.renderConfigurationTab(noVisibleMenus);

		if (!this.showOptionMenu) {
			// We can have context menus for the tab panels, too
			// never return early here for things you intend to use right click functionality with
			if (this.visibleContextMenu)
				this.handleContextClick();
			else
				this.handleDefaultClick();
		}

		this.mouseButtonClick = 0;
	}

	renderTradeScreen() {
		if (this.mouseButtonClick !== 0 && this.mouseItemTickDelta === 0) {
			this.mouseItemTickDelta = 1;
		}

		if (this.mouseItemTickDelta > 0) {
			let mouseX = this.mouseX - 22;
			let mouseY = this.mouseY - 36;

			if (mouseX >= 0 && mouseY >= 0 && mouseX < 468 && mouseY < 262) {
				if (mouseX > 216 && mouseY > 30 && mouseX < 462 && mouseY < 235) {
					let slot = Math.floor((mouseX - 217) / 49) + Math.floor((mouseY - 31) / 34) * 5;

					if (slot >= 0 && slot < this.inventoryItemsCount) {
						let sendUpdate = false;
						let itemCountAdd = 0;
						let itemType = this.inventoryItemId[slot];

						for (let itemIndex = 0; itemIndex < this.tradeItemsCount; itemIndex++) {
							if (this.tradeItems[itemIndex] === itemType) {
								if (GameData.itemStackable[itemType] === 0) {
									for (let i4 = 0; i4 < this.mouseItemTickDelta; i4++) {
										if (this.tradeItemCount[itemIndex] < this.inventoryItemStackCount[slot]) {
											this.tradeItemCount[itemIndex]++;
										}
										sendUpdate = true;
									}
								} else {
									itemCountAdd++;
								}
							}
						}

						if (this.getInventoryCount(itemType) <= itemCountAdd)
							sendUpdate = true;

						// quest items? or just tagged as 'special'
						if (GameData.itemSpecial[itemType] === 1) {
							this.showMessage('This object cannot be traded with other players', 3);
							sendUpdate = true;
						}

						if (!sendUpdate && this.tradeItemsCount < 12) {
							this.tradeItems[this.tradeItemsCount] = itemType;
							this.tradeItemCount[this.tradeItemsCount] = 1;
							this.tradeItemsCount++;
							sendUpdate = true;
						}

						if (sendUpdate) {
							this.clientStream.queue(Ops.TRADE_ITEMS(this.tradeItemCount));
							this.tradeRecipientAccepted = false;
							this.tradeAccepted = false;
						}
					}
				}

				if (mouseX > 8 && mouseY > 30 && mouseX < 205 && mouseY < 133) {
					let itemIndex = (((mouseX - 9) / 49) | 0) + (((mouseY - 31) / 34) | 0) * 4;

					if (itemIndex >= 0 && itemIndex < this.tradeItemsCount) {
						let itemType = this.tradeItems[itemIndex];

						for (let i2 = 0; i2 < this.mouseItemTickDelta; i2++) {
							if (GameData.itemStackable[itemType] === 0 && this.tradeItemCount[itemIndex] > 1) {
								this.tradeItemCount[itemIndex]--;
								continue;
							}
							this.tradeItemsCount--;
							this.mouseButtonDownTime = 0;

							for (let l2 = itemIndex; l2 < this.tradeItemsCount; l2++) {
								this.tradeItems[l2] = this.tradeItems[l2 + 1];
								this.tradeItemCount[l2] = this.tradeItemCount[l2 + 1];
							}

							break;
						}

						this.clientStream.queue(Ops.TRADE_ITEMS(this.tradeItemCount));
						this.tradeRecipientAccepted = false;
						this.tradeAccepted = false;
					}
				}

				if (mouseX >= 217 && mouseY >= 238 && mouseX <= 286 && mouseY <= 259) {
					this.tradeAccepted = true;
					this.clientStream.queue(Ops.ACCEPT_TRADE_ONE());
				}

				if (mouseX >= 394 && mouseY >= 238 && mouseX < 463 && mouseY < 259) {
					this.tradeConfigVisible = false;
					this.clientStream.queue(Ops.DECLINE_TRADE());
					// this.clientStream.newPacket(C_OPCODES.TRADE_DECLINE);
					// this.clientStream.sendPacket();
				}
			} else if (this.mouseButtonClick !== 0) {
				this.tradeConfigVisible = false;
				this.clientStream.queue(Ops.DECLINE_TRADE());
				// this.clientStream.newPacket(C_OPCODES.TRADE_DECLINE);
				// this.clientStream.sendPacket();
			}

			this.mouseButtonClick = 0;
			this.mouseItemTickDelta = 0;
		}

		if (!this.tradeConfigVisible) {
			return;
		}

		let dialogX = 22;
		let dialogY = 36;

		this.surface.drawBox(dialogX, dialogY, 468, 12, 192);
		this.surface.drawBoxAlpha(dialogX, dialogY + 12, 468, 18, 0x989898, 160);
		this.surface.drawBoxAlpha(dialogX, dialogY + 30, 8, 248, 0x989898, 160);
		this.surface.drawBoxAlpha(dialogX + 205, dialogY + 30, 11, 248, 0x989898, 160);
		this.surface.drawBoxAlpha(dialogX + 462, dialogY + 30, 6, 248, 0x989898, 160);
		this.surface.drawBoxAlpha(dialogX + 8, dialogY + 133, 197, 22, 0x989898, 160);
		this.surface.drawBoxAlpha(dialogX + 8, dialogY + 258, 197, 20, 0x989898, 160);
		this.surface.drawBoxAlpha(dialogX + 216, dialogY + 235, 246, 43, 0x989898, 160);
		this.surface.drawBoxAlpha(dialogX + 8, dialogY + 30, 197, 103, 0xd0d0d0, 160);
		this.surface.drawBoxAlpha(dialogX + 8, dialogY + 155, 197, 103, 0xd0d0d0, 160);
		this.surface.drawBoxAlpha(dialogX + 216, dialogY + 30, 246, 205, 0xd0d0d0, 160);

		for (let j2 = 0; j2 < 4; j2++) {
			this.surface.drawLineHoriz(dialogX + 8, dialogY + 30 + j2 * 34, 197, 0);
		}

		for (let j3 = 0; j3 < 4; j3++) {
			this.surface.drawLineHoriz(dialogX + 8, dialogY + 155 + j3 * 34, 197, 0);
		}

		for (let l3 = 0; l3 < 7; l3++) {
			this.surface.drawLineHoriz(dialogX + 216, dialogY + 30 + l3 * 34, 246, 0);
		}

		for (let k4 = 0; k4 < 6; k4++) {
			if (k4 < 5) {
				this.surface.drawLineVert(dialogX + 8 + k4 * 49, dialogY + 30, 103, 0);
			}

			if (k4 < 5) {
				this.surface.drawLineVert(dialogX + 8 + k4 * 49, dialogY + 155, 103, 0);
			}

			this.surface.drawLineVert(dialogX + 216 + k4 * 49, dialogY + 30, 205, 0);
		}

		this.surface.drawString('Trading with: ' + this.tradeRecipientName, dialogX + 1, dialogY + 10, 1, 0xffffff);
		this.surface.drawString('Your Offer', dialogX + 9, dialogY + 27, 4, 0xffffff);
		this.surface.drawString('Opponent\'s Offer', dialogX + 9, dialogY + 152, 4, 0xffffff);
		this.surface.drawString('Your Inventory', dialogX + 216, dialogY + 27, 4, 0xffffff);

		if (!this.tradeAccepted)
			this.surface.drawSpriteID(dialogX + 217, dialogY + 238, mudclient.spriteMedia + 25);

		this.surface.drawSpriteID(dialogX + 394, dialogY + 238, mudclient.spriteMedia + 26);

		if (this.tradeRecipientAccepted) {
			this.surface.drawStringCenter('Other player', dialogX + 341, dialogY + 246, 1, 0xffffff);
			this.surface.drawStringCenter('has accepted', dialogX + 341, dialogY + 256, 1, 0xffffff);
		}

		if (this.tradeAccepted) {
			this.surface.drawStringCenter('Waiting for', dialogX + 217 + 35, dialogY + 246, 1, 0xffffff);
			this.surface.drawStringCenter('other player', dialogX + 217 + 35, dialogY + 256, 1, 0xffffff);
		}

		for (let itemIndex = 0; itemIndex < this.inventoryItemsCount; itemIndex++) {
			let slotX = 217 + dialogX + (itemIndex % 5) * 49;
			let slotY = 31 + dialogY + ((itemIndex / 5) | 0) * 34;

			this.surface._spriteClipping_from9(slotX, slotY, 48, 32, mudclient.spriteItem + GameData.itemPicture[this.inventoryItemId[itemIndex]], GameData.itemMask[this.inventoryItemId[itemIndex]], 0, 0, false);

			if (GameData.itemStackable[this.inventoryItemId[itemIndex]] === 0) {
				this.surface.drawString(this.inventoryItemStackCount[itemIndex].toString(), slotX + 1, slotY + 10, 1, 0xffff00);
			}
		}

		for (let itemIndex = 0; itemIndex < this.tradeItemsCount; itemIndex++) {
			let slotX = 9 + dialogX + (itemIndex & 3) * 49;
			let slotY = 31 + dialogY + ((itemIndex / 4) | 0) * 34;

			this.surface._spriteClipping_from9(slotX, slotY, 48, 32, mudclient.spriteItem + GameData.itemPicture[this.tradeItems[itemIndex]], GameData.itemMask[this.tradeItems[itemIndex]], 0, 0, false);

			if (GameData.itemStackable[this.tradeItems[itemIndex]] === 0) {
				this.surface.drawString(this.tradeItemCount[itemIndex].toString(), slotX + 1, slotY + 10, 1, 0xffff00);
			}

			if (this.mouseX > slotX && this.mouseX < slotX + 48 && this.mouseY > slotY && this.mouseY < slotY + 32) {
				this.surface.drawString(GameData.itemName[this.tradeItems[itemIndex]] + ': @whi@' + GameData.itemDescription[this.tradeItems[itemIndex]], dialogX + 8, dialogY + 273, 1, 0xffff00);
			}
		}

		for (let itemIndex = 0; itemIndex < this.tradeRecipientItemsCount; itemIndex++) {
			let slotX = 9 + dialogX + (itemIndex & 3) * 49;
			let slotY = 156 + dialogY + ((itemIndex / 4) | 0) * 34;

			this.surface._spriteClipping_from9(slotX, slotY, 48, 32, mudclient.spriteItem + GameData.itemPicture[this.tradeRecipientItems[itemIndex]], GameData.itemMask[this.tradeRecipientItems[itemIndex]], 0, 0, false);

			if (GameData.itemStackable[this.tradeRecipientItems[itemIndex]] === 0)
				this.surface.drawString(this.tradeRecipientItemCount[itemIndex].toString(), slotX + 1, slotY + 10, 1, 0xffff00);

			if (this.mouseX > slotX && this.mouseX < slotX + 48 && this.mouseY > slotY && this.mouseY < slotY + 32)
				this.surface.drawString(GameData.itemName[this.tradeRecipientItems[itemIndex]] + ': @whi@' + GameData.itemDescription[this.tradeRecipientItems[itemIndex]], dialogX + 8, dialogY + 273, 1, 0xffff00);
		}
	}

	resetWorldState() {
		this.resetLoginPanels();
		this.welcomeState = WelcomeStates.WELCOME;
		this.gameState = GameStates.WORLD;
		this.systemUpdate = 0;
		this.combatStyle = 0;

		this.resetPMText();
		this.surface.blackScreen();
		this.surface.draw(this.graphics, 0, 0);

		for (let i = 0; i < this.objectCount; i++) {
			// remove from scenegraph then from world map
			this.scene.removeModel(this.objectModel[i]);
			this.world.removeObject(this.objectX[i], this.objectY[i], this.objectId[i]);
		}
		this.objectCount = 0;

		for (let j = 0; j < this.wallObjectCount; j++) {
			this.scene.removeModel(this.wallObjectModel[j]);
			this.world.removeWallObject(this.wallObjectX[j], this.wallObjectY[j], this.wallObjectDirection[j], this.wallObjectId[j]);
		}
		this.wallObjectCount = 0;
		this.groundItemCount = 0;
		this.playerCount = 0;
		this.players = new Array(this.playersMax);
		this.playersServer = new Array(this.playersMax);
		this.npcCount = 0;
		this.npcs = new Array(this.npcsMax);
		this.npcsServer = new Array(this.npcsMax);

		this.prayers = [ false, false, false, false, false, false, false, false, false, false, false, false, false, false ];
		this.mouseButtonClick = 0;
		this.lastMouseButtonDown = 0;
		this.mouseButtonDown = 0;
		this.shopVisible = false;
		this.bankVisible = false;
		this.isSleeping = false;
		this.visibleContextMenu = false;
		this.showOptionMenu = false;
		this.friendListOnline = new Array(GameConnection.socialListSize);
		this.friendListHashes = new BigUint64Array(GameConnection.socialListSize);
		this.ignoreList = new BigUint64Array(GameConnection.socialListSize);
		this.ignoreListCount = 0;
	}

	renderContactsTab(nomenus) {
		let uiX = this.surface.width2 - 199;
		let uiY = 36;

		this.surface.drawSpriteID(uiX - 49, 3, mudclient.spriteMedia + 5);

		let uiWidth = 196;
		let uiHeight = 182;
		let l = 0;
		let k = l = Surface.rgbToLong(160, 160, 160);

		if (this.uiTabSocialSubTab === 0) {
			k = Surface.rgbToLong(220, 220, 220);
		} else {
			l = Surface.rgbToLong(220, 220, 220);
		}

		this.surface.drawBoxAlpha(uiX, uiY, uiWidth / 2 | 0, 24, k, 128);
		this.surface.drawBoxAlpha(uiX + ((uiWidth / 2) | 0), uiY, uiWidth / 2 | 0, 24, l, 128);
		this.surface.drawBoxAlpha(uiX, uiY + 24, uiWidth, uiHeight - 24, Surface.rgbToLong(220, 220, 220), 128);
		this.surface.drawLineHoriz(uiX, uiY + 24, uiWidth, 0);
		this.surface.drawLineVert(uiX + ((uiWidth / 2) | 0), uiY, 24, 0);
		this.surface.drawLineHoriz(uiX, (uiY + uiHeight) - 16, uiWidth, 0);
		this.surface.drawStringCenter('Friends', uiX + ((uiWidth / 4) | 0), uiY + 16, 4, 0);
		this.surface.drawStringCenter('Ignore', uiX + ((uiWidth / 4) | 0) + ((uiWidth / 2) | 0), uiY + 16, 4, 0);

		this.panelSocialList.clearList(this.controlListSocialPlayers);

		if (this.uiTabSocialSubTab === 0) {
			for (let i1 = 0; i1 < this.friendListCount; i1++) {
				let s = '';

				let world = this.friendListOnline[i1] & 0xFF;
				if (world !== 0) {
					if (world === 0xFF)
						s = '@gre@';
					else
						s = '@yel@';
				} else
					s = '@red@';

				this.panelSocialList.addListEntry(this.controlListSocialPlayers, i1, s + Utility.hashToUsername(this.friendListHashes[i1]) + '~' + (this.width2 - 73) + '~@whi@Remove         WWWWWWWWWW');
			}

		}

		if (this.uiTabSocialSubTab === 1) {
			for (let j1 = 0; j1 < this.ignoreListCount; j1++) {
				this.panelSocialList.addListEntry(this.controlListSocialPlayers, j1, '@yel@' + Utility.hashToUsername(this.ignoreList[j1]) + '~'+(this.width2 - 73)+'~@whi@Remove         WWWWWWWWWW');
			}
		}

		this.panelSocialList.render();

		if (this.uiTabSocialSubTab === 0) {
			let k1 = this.panelSocialList.getListEntryIndex(this.controlListSocialPlayers);

			if (k1 >= 0 && this.mouseX < 489) {
				if (this.mouseX > 429) {
					this.surface.drawStringCenter('Click to remove ' + Utility.hashToUsername(this.friendListHashes[k1]), uiX + ((uiWidth / 2) | 0), uiY + 35, 1, 0xffffff);
				} else if (this.friendListOnline[k1] === 255) {
					this.surface.drawStringCenter('Click to message ' + Utility.hashToUsername(this.friendListHashes[k1]), uiX + ((uiWidth / 2) | 0), uiY + 35, 1, 0xffffff);
				} else if (this.friendListOnline[k1] > 0) {
					if (this.friendListOnline[k1] < 200) {
						this.surface.drawStringCenter(Utility.hashToUsername(this.friendListHashes[k1]) + ' is on world ' + (this.friendListOnline[k1] - 9), uiX + ((uiWidth / 2) | 0), uiY + 35, 1, 0xffffff);
					} else {
						this.surface.drawStringCenter(Utility.hashToUsername(this.friendListHashes[k1]) + ' is on classic ' + (this.friendListOnline[k1] - 219), uiX + ((uiWidth / 2) | 0), uiY + 35, 1, 0xffffff);
					}
				} else {
					this.surface.drawStringCenter(Utility.hashToUsername(this.friendListHashes[k1]) + ' is offline', uiX + ((uiWidth / 2) | 0), uiY + 35, 1, 0xffffff);
				}
			} else {
				this.surface.drawStringCenter('Click a name to send a message', uiX + ((uiWidth / 2) | 0), uiY + 35, 1, 0xffffff);
			}

			let colour = 0;

			if (this.mouseX > uiX && this.mouseX < uiX + uiWidth && this.mouseY > (uiY + uiHeight) - 16 && this.mouseY < uiY + uiHeight) {
				colour = 0xffff00;
			} else {
				colour = 0xffffff;
			}

			this.surface.drawStringCenter('Click here to add a friend', uiX + ((uiWidth / 2) | 0), (uiY + uiHeight) - 3, 1, colour);
		}

		if (this.uiTabSocialSubTab === 1) {
			let l1 = this.panelSocialList.getListEntryIndex(this.controlListSocialPlayers);

			if (l1 >= 0 && this.mouseX < 489 && this.mouseX > 429) {
				if (this.mouseX > 429) {
					this.surface.drawStringCenter('Click to remove ' + Utility.hashToUsername(this.ignoreList[l1]), uiX + ((uiWidth / 2) | 0), uiY + 35, 1, 0xffffff);
				}
			} else {
				this.surface.drawStringCenter('Blocking messages from:', uiX + ((uiWidth / 2) | 0), uiY + 35, 1, 0xffffff);
			}

			let l2 = 0;

			if (this.mouseX > uiX && this.mouseX < uiX + uiWidth && this.mouseY > (uiY + uiHeight) - 16 && this.mouseY < uiY + uiHeight) {
				l2 = 0xffff00;
			} else {
				l2 = 0xffffff;
			}

			this.surface.drawStringCenter('Click here to add a name', uiX + ((uiWidth / 2) | 0), (uiY + uiHeight) - 3, 1, l2);
		}

		if (!nomenus) {
			return;
		}

		uiX = this.mouseX - (this.surface.width2 - 199);
		uiY = this.mouseY - 36;

		if (uiX >= 0 && uiY >= 0 && uiX < 196 && uiY < 182) {
			this.panelSocialList.handleMouse(uiX + (this.surface.width2 - 199), uiY + 36, this.lastMouseButtonDown, this.mouseButtonDown, this.mouseScrollDelta);

			if (uiY <= 24 && this.mouseButtonClick === 1) {
				if (uiX < 98 && this.uiTabSocialSubTab === 1) {
					this.uiTabSocialSubTab = 0;
					this.panelSocialList.resetListProps(this.controlListSocialPlayers);
				} else if (uiX > 98 && this.uiTabSocialSubTab === 0) {
					this.uiTabSocialSubTab = 1;
					this.panelSocialList.resetListProps(this.controlListSocialPlayers);
				}
			}

			if (this.mouseButtonClick === 1 && this.uiTabSocialSubTab === 0) {
				let i2 = this.panelSocialList.getListEntryIndex(this.controlListSocialPlayers);

				if (i2 >= 0 && this.mouseX < 489) {
					if (this.mouseX > 429) {
						this.friendRemove(this.friendListHashes[i2]);
					} else if (this.friendListOnline[i2] !== 0) {
						this.contactsInputCtx = 2;
						this.privateMessageTarget = this.friendListHashes[i2];
						this.inputPmCurrent = '';
						this.inputPmFinal = '';
					}
				}
			}

			if (this.mouseButtonClick === 1 && this.uiTabSocialSubTab === 1) {
				let j2 = this.panelSocialList.getListEntryIndex(this.controlListSocialPlayers);

				if (j2 >= 0 && this.mouseX < 489 && this.mouseX > 429) {
					this.ignoreRemove(this.ignoreList[j2]);
				}
			}

			if (uiY > 166 && this.mouseButtonClick === 1 && this.uiTabSocialSubTab === 0) {
				this.contactsInputCtx = 1;
				this.inputTextCurrent = '';
				this.inputTextFinal = '';
			}

			if (uiY > 166 && this.mouseButtonClick === 1 && this.uiTabSocialSubTab === 1) {
				this.contactsInputCtx = 3;
				this.inputTextCurrent = '';
				this.inputTextFinal = '';
			}

			this.mouseButtonClick = 0;
		}
	}

	sendLogout() {
		if (this.gameState !== GameStates.WORLD)
			return;

		if (this.combatTimer.enabled) {
			if (this.combatTimer.tickCount < secondsToFrames(1)) {
				this.showMessage("@cya@You can't logout during combat!", 3);
				return;
			}
			this.showMessage("@cya@You can't logout for 10 seconds after combat!", 3);
			return;
		}

		// this.clientStream.newPacket(C_OPCODES.LOGOUT);
		this.clientStream.send(Ops.LOGOUT());
		this.logoutBoxFrames = secondsToFrames(20);
	}

	createPlayer(serverIndex, x, y, anim) {
		let player = this.playersServer[serverIndex];
		
		if (!player) {
			player = this.playersServer[serverIndex] = new GameCharacter();
			this.playersServer[serverIndex].serverIndex = serverIndex;
			this.playersServer[serverIndex].appearanceTicket = 0;
		}

		let flag = false;

		for (let i1 = 0; i1 < this.knownPlayerCount; i1++) {
			if (this.knownPlayers[i1] && this.knownPlayers[i1].serverIndex !== serverIndex)
				continue;

			flag = true;
			break;
		}

		if (flag) {
			player.animationNext = anim;
			let step = player.waypointCurrent;
			if (x !== player.waypointsX[step] || y !== player.waypointsY[step]) {
				player.waypointCurrent = step = (step+1)%10;
				player.waypointsX[step] = x;
				player.waypointsY[step] = y;
			}
		} else {
			player.serverIndex = serverIndex;
			player.targetWaypoint = 0;
			player.waypointCurrent = 0;
			player.waypointsX[0] = player.currentX = x;
			player.waypointsY[0] = player.currentY = y;
			player.animationNext = player.animationCurrent = anim;
			player.stepCount = 0;
		}
		this.players[this.playerCount++] = player;

		return player;
	}

	renderSocialInputBox() {
		if (this.mouseButtonClick !== 0) {
			this.mouseButtonClick = 0;

			if ((this.contactsInputCtx === 3 || this.contactsInputCtx === 1) && 
					(this.mouseX < 106 || this.mouseY < 145 || this.mouseX > 406 || this.mouseY > 215)) {
				this.contactsInputCtx = 0;
				return;
			}

			if (this.contactsInputCtx === 2 && (this.mouseX < 6 || this.mouseY < 145 || this.mouseX > 506 || this.mouseY > 215)) {
				this.contactsInputCtx = 0;
				return;
			}

			if (this.mouseX > 236 && this.mouseX < 276 && this.mouseY > 193 && this.mouseY < 213) {
				this.contactsInputCtx = 0;
				return;
			}
		}

		let i = 145;

		if (this.contactsInputCtx === 1) {
			this.surface.drawBox(106, i, 300, 70, 0);
			this.surface.drawBoxEdge(106, i, 300, 70, 0xffffff);
			i += 20;
			this.surface.drawStringCenter('Enter name to add to friends list', 256, i, 4, 0xffffff);
			i += 20;
			this.surface.drawStringCenter(this.inputTextCurrent + '*', 256, i, 4, 0xffffff);

			if (this.inputTextFinal.length > 0) {
				let raw = this.inputTextFinal.trim();
				this.inputTextCurrent = '';
				this.inputTextFinal = '';
				this.contactsInputCtx = 0;

				this.privateMessageTarget = Utility.usernameToHash(raw);
				if (this.privateMessageTarget > 0 && this.localPlayer.hash !== this.privateMessageTarget) {
					this.friendAdd(Utility.hashToUsername(this.privateMessageTarget));
					this.showMessage('@que@'+Utility.hashToUsername(this.privateMessageTarget)+' has been added to your friend-list.', 3);
				} else
					this.showMessage('@que@You can\'t add yourself!!', 3);
			}
		}

		if (this.contactsInputCtx === 2) {
			this.surface.drawBox(6, i, 500, 70, 0);
			this.surface.drawBoxEdge(6, i, 500, 70, 0xffffff);
			i += 20;
			this.surface.drawStringCenter('Enter message to send to ' + Utility.hashToUsername(this.privateMessageTarget), 256, i, 4, 0xffffff);
			i += 20;
			this.surface.drawStringCenter(this.inputPmCurrent + '*', 256, i, 4, 0xffffff);

			if (this.inputPmFinal.length > 0) {
				this.contactsInputCtx = 0;
				if (this.privateMessageTarget > 0)
					return;
				let msg = this.chatSystem.encode(this.inputPmFinal.slice(0,80).toLowerCase());
				this.inputPmCurrent = '';
				this.inputPmFinal = '';
				if (msg && this.privateMessageTarget !== 0 && this.privateMessageTarget !== this.localPlayer.hash) {
					this.sendPrivateMessage(this.privateMessageTarget, msg, msg.length);
					this.showServerMessage('@pri@You tell ' + Utility.hashToUsername(this.privateMessageTarget) + ': ' + this.chatSystem.normalize(this.chatSystem.decode(msg)));
				} else
					this.showMessage('@que@Problem sending private message to target!', 3);
			}
		}

		if (this.contactsInputCtx === 3) {
			this.surface.drawBox(106, i, 300, 70, 0);
			this.surface.drawBoxEdge(106, i, 300, 70, 0xffffff);
			i += 20;
			this.surface.drawStringCenter('Enter name to add to ignore list', 256, i, 4, 0xffffff);
			i += 20;
			this.surface.drawStringCenter(this.inputTextCurrent + '*', 256, i, 4, 0xffffff);

			if (this.inputTextFinal.length > 0) {
				let formatted = Utility.hashToUsername(Utility.usernameToHash(this.inputTextFinal.trim()));
				this.contactsInputCtx = 0;
				this.inputTextCurrent = '';
				this.inputTextFinal = '';

				if (formatted.length > 0) {
					if (Utility.usernameToHash(this.localPlayer.name) === Utility.usernameToHash(formatted)) {
						this.showMessage('@que@You can\'t ignore yourself!', 3);
						return;
					}
					this.showMessage('@que@'+formatted+' has been added to your ignored-list.', 3);
					super.ignoreAdd(formatted);
				}
			}
		}

		let j = 0xFFFFFF;

		if (this.mouseX > 236 && this.mouseX < 276 && this.mouseY > 193 && this.mouseY < 213) {
			j = 0xFFFF00;
		}

		this.surface.drawStringCenter('Cancel', 256, 208, 1, j);
	}

	createAppearancePanel() {
		this.panelGame[GamePanels.APPEARANCE] = new Panel(this.surface, 100);
		this.panelGame[GamePanels.APPEARANCE].addText(256, 10, 'Please design Your Character', 4, true);

		let x = 140;
		let y = 34;

		x += 116;
		y -= 10;

		this.panelGame[GamePanels.APPEARANCE].addText(x - 55, y + 110, 'Front', 3, true);
		this.panelGame[GamePanels.APPEARANCE].addText(x, y + 110, 'Side', 3, true);
		this.panelGame[GamePanels.APPEARANCE].addText(x + 55, y + 110, 'Back', 3, true);

		let xOff = 54;

		y += 145;

		this.panelGame[GamePanels.APPEARANCE].addBoxRounded(x - xOff, y, 53, 41);
		this.panelGame[GamePanels.APPEARANCE].addText(x - xOff, y - 8, 'Head', 1, true);
		this.panelGame[GamePanels.APPEARANCE].addText(x - xOff, y + 8, 'Type', 1, true);
		this.panelGame[GamePanels.APPEARANCE].addSprite(x - xOff - 40, y, Panel.spriteStart + 7);
		this.controlButtonAppearanceHead1 = this.panelGame[GamePanels.APPEARANCE].addButton(x - xOff - 40, y, 20, 20);
		this.panelGame[GamePanels.APPEARANCE].addSprite((x - xOff) + 40, y, Panel.spriteStart + 6);
		this.controlButtonAppearanceHead2 = this.panelGame[GamePanels.APPEARANCE].addButton((x - xOff) + 40, y, 20, 20);
		this.panelGame[GamePanels.APPEARANCE].addBoxRounded(x + xOff, y, 53, 41);
		this.panelGame[GamePanels.APPEARANCE].addText(x + xOff, y - 8, 'Hair', 1, true);
		this.panelGame[GamePanels.APPEARANCE].addText(x + xOff, y + 8, 'Color', 1, true);
		this.panelGame[GamePanels.APPEARANCE].addSprite((x + xOff) - 40, y, Panel.spriteStart + 7);
		this.controlButtonAppearanceHair1 = this.panelGame[GamePanels.APPEARANCE].addButton((x + xOff) - 40, y, 20, 20);
		this.panelGame[GamePanels.APPEARANCE].addSprite(x + xOff + 40, y, Panel.spriteStart + 6);
		this.controlButtonAppearanceHair2 = this.panelGame[GamePanels.APPEARANCE].addButton(x + xOff + 40, y, 20, 20);
		y += 50;
		this.panelGame[GamePanels.APPEARANCE].addBoxRounded(x - xOff, y, 53, 41);
		this.panelGame[GamePanels.APPEARANCE].addText(x - xOff, y, 'Gender', 1, true);
		this.panelGame[GamePanels.APPEARANCE].addSprite(x - xOff - 40, y, Panel.spriteStart + 7);
		this.controlButtonAppearanceGender1 = this.panelGame[GamePanels.APPEARANCE].addButton(x - xOff - 40, y, 20, 20);
		this.panelGame[GamePanels.APPEARANCE].addSprite((x - xOff) + 40, y, Panel.spriteStart + 6);
		this.controlButtonAppearanceGender2 = this.panelGame[GamePanels.APPEARANCE].addButton((x - xOff) + 40, y, 20, 20);
		this.panelGame[GamePanels.APPEARANCE].addBoxRounded(x + xOff, y, 53, 41);
		this.panelGame[GamePanels.APPEARANCE].addText(x + xOff, y - 8, 'Top', 1, true);
		this.panelGame[GamePanels.APPEARANCE].addText(x + xOff, y + 8, 'Color', 1, true);
		this.panelGame[GamePanels.APPEARANCE].addSprite((x + xOff) - 40, y, Panel.spriteStart + 7);
		this.controlButtonAppearanceTop1 = this.panelGame[GamePanels.APPEARANCE].addButton((x + xOff) - 40, y, 20, 20);
		this.panelGame[GamePanels.APPEARANCE].addSprite(x + xOff + 40, y, Panel.spriteStart + 6);
		this.controlButtonAppearanceTop2 = this.panelGame[GamePanels.APPEARANCE].addButton(x + xOff + 40, y, 20, 20);
		y += 50;
		this.panelGame[GamePanels.APPEARANCE].addBoxRounded(x - xOff, y, 53, 41);
		this.panelGame[GamePanels.APPEARANCE].addText(x - xOff, y - 8, 'Skin', 1, true);
		this.panelGame[GamePanels.APPEARANCE].addText(x - xOff, y + 8, 'Color', 1, true);
		this.panelGame[GamePanels.APPEARANCE].addSprite(x - xOff - 40, y, Panel.spriteStart + 7);
		this.controlButtonAppearanceSkin1 = this.panelGame[GamePanels.APPEARANCE].addButton(x - xOff - 40, y, 20, 20);
		this.panelGame[GamePanels.APPEARANCE].addSprite((x - xOff) + 40, y, Panel.spriteStart + 6);
		this.controlButtonAppearanceSkin2 = this.panelGame[GamePanels.APPEARANCE].addButton((x - xOff) + 40, y, 20, 20);
		this.panelGame[GamePanels.APPEARANCE].addBoxRounded(x + xOff, y, 53, 41);
		this.panelGame[GamePanels.APPEARANCE].addText(x + xOff, y - 8, 'Bottom', 1, true);
		this.panelGame[GamePanels.APPEARANCE].addText(x + xOff, y + 8, 'Color', 1, true);
		this.panelGame[GamePanels.APPEARANCE].addSprite((x + xOff) - 40, y, Panel.spriteStart + 7);
		this.controlButtonAppearanceBottom1 = this.panelGame[GamePanels.APPEARANCE].addButton((x + xOff) - 40, y, 20, 20);
		this.panelGame[GamePanels.APPEARANCE].addSprite(x + xOff + 40, y, Panel.spriteStart + 6);
		this.controlButtonAppearanceBottom2 = this.panelGame[GamePanels.APPEARANCE].addButton(x + xOff + 40, y, 20, 20);
		y += 82;
		y -= 35;
		this.panelGame[GamePanels.APPEARANCE].addButtonBackground(x, y, 200, 30);
		this.panelGame[GamePanels.APPEARANCE].addText(x, y, 'Accept', 4, false);
		this.controlButtonAppearanceAccept = this.panelGame[GamePanels.APPEARANCE].addButton(x, y, 200, 30);
	}

	resetPMText() {
		this.inputPmCurrent = '';
		this.inputPmFinal = '';
	}

	renderWelcomeNotification() {
		let i = 65;
		if (this.welcomeRecoverySetDays !== 201)
			i += 60;
		if (this.unreadMessageCount > 0)
			i += 60;
		if (this.lastRemoteIP !== 0)
			i += 45;
		let y = 167 - ((i / 2) | 0);

		this.surface.drawBox(56, 167 - ((i / 2) | 0), 400, i, 0);
		this.surface.drawBoxEdge(56, 167 - ((i / 2) | 0), 400, i, 0xffffff);
		y += 20;
		this.surface.drawStringCenter('Welcome to RuneScape ' + this.loginUser, 256, y, 4, 0xffff00);
		y += 30;

		let s = '';
		if (this.daysSinceLogin === 0)
			s = 'earlier today';
		else if (this.daysSinceLogin === 1)
			s = 'yesterday';
		else
			s = this.daysSinceLogin + ' days ago';

		if (this.lastRemoteIP !== 0) {
			this.surface.drawStringCenter('You last logged in ' + s, 256, y, 1, 0xffffff);
			y += 15;

			if (!this.lastRemoteHost)
				this.lastRemoteHost = this.getHostnameIP(this.lastRemoteIP);

			this.surface.drawStringCenter('from: ' + this.lastRemoteHost, 256, y, 1, 0xffffff);
			y += 15;
			y += 15;
		}

		if (this.unreadMessageCount > 0) {
			let k = 0xffffff;

			this.surface.drawStringCenter('Jagex staff will NEVER email you. We use the', 256, y, 1, k);
			y += 15;
			this.surface.drawStringCenter('message-centre on this website instead.', 256, y, 1, k);
			y += 15;

			if (this.unreadMessageCount === 1)
				this.surface.drawStringCenter('You have @yel@0@whi@ unread messages in your message-centre', 256, y, 1, 0xffffff);
			else
				this.surface.drawStringCenter('You have @gre@' + (this.unreadMessageCount - 1) + ' unread messages @whi@in your message-centre', 256, y, 1, 0xffffff);
			y += 15;
			y += 15;
		}

		if (this.welcomeRecoverySetDays === 0) {
			this.surface.drawStringCenter('You have not yet set any password recovery questions.', 256, y, 1, 0xff8000);
			y += 15;
			this.surface.drawStringCenter('We strongly recommend you do so now to secure your account.', 256, y, 1, 0xff8000);
			y += 15;
			this.surface.drawStringCenter('Do this from the \'account management\' area on our front webpage', 256, y, 1, 0xff8000);
			y += 15;
		} else if (this.welcomeRecoverySetDays !== 201) {
			this.welcomeRecoverySetDays--;
			let recoveryStatus = this.welcomeRecoverySetDays + ' days ago';

			if (this.welcomeRecoverySetDays === 0) {
				recoveryStatus = 'Earlier today';
			} else if (this.welcomeRecoverySetDays === 1) {
				recoveryStatus = 'Yesterday';
			}

			this.surface.drawStringCenter(recoveryStatus + ' you changed your recovery questions', 0xFF, y, 1, 0xff8000);
			y += 15;
			this.surface.drawStringCenter('If you do not remember making this change then cancel it immediately', 0xFF, y, 1, 0xff8000);
			y += 15;
			this.surface.drawStringCenter('Do this from the \'account management\' area on our front webpage', 0xFF, y, 1, 0xff8000);
			y += 15;
			y += 15;
		}

		let l = 0xffffff;

		if (this.mouseY > y - 12 && this.mouseY <= y && this.mouseX > 106 && this.mouseX < 406) {
			l = 0xff0000;
		}

		this.surface.drawStringCenter('Click here to close window', 256, y, 1, l);

		if (this.mouseButtonClick === 1) {
			if (l === 0xff0000)
				this.welcomeBoxVisible = false;

			if ((this.mouseX < 86 || this.mouseX > 426) && (this.mouseY < 167 - ((i / 2) | 0) || this.mouseY > 167 + ((i / 2) | 0)))
				this.welcomeBoxVisible = false;
		}

		this.mouseButtonClick = 0;
	}

	drawAppearancePanelCharacterSprites() {
		this.surface.interlace = false;
		this.surface.blackScreen();
		this.panelGame[GamePanels.APPEARANCE].render();
		let i = 140;
		let j = 50;
		i += 116;
		j -= 25;
		i -= 32;
		this.surface._spriteClipping_from9(i - 55, j, 64, 102, GameData.animationNumber[this.appearanceHeadType], this.characterHairColours[this.appearanceHairColour], this.characterSkinColours[this.appearanceSkinColour], 0, false);
		this.surface._spriteClipping_from9(i - 55, j, 64, 102, GameData.animationNumber[this.appearanceBodyGender], this.characterTopBottomColours[this.appearanceTopColour], this.characterSkinColours[this.appearanceSkinColour], 0, false);
		this.surface._spriteClipping_from6(i - 55, j, 64, 102, GameData.animationNumber[this.appearance2Colour], this.characterTopBottomColours[this.appearanceBottomColour]);
		this.surface._spriteClipping_from9(i, j, 64, 102, GameData.animationNumber[this.appearanceHeadType] + 6, this.characterHairColours[this.appearanceHairColour], this.characterSkinColours[this.appearanceSkinColour], 0, false);
		this.surface._spriteClipping_from9(i, j, 64, 102, GameData.animationNumber[this.appearanceBodyGender] + 6, this.characterTopBottomColours[this.appearanceTopColour], this.characterSkinColours[this.appearanceSkinColour], 0, false);
		this.surface._spriteClipping_from6(i, j, 64, 102, GameData.animationNumber[this.appearance2Colour] + 6, this.characterTopBottomColours[this.appearanceBottomColour]);
		this.surface._spriteClipping_from9(i + 55, j, 64, 102, GameData.animationNumber[this.appearanceHeadType] + 12, this.characterHairColours[this.appearanceHairColour], this.characterSkinColours[this.appearanceSkinColour], 0, false);
		this.surface._spriteClipping_from9(i + 55, j, 64, 102, GameData.animationNumber[this.appearanceBodyGender] + 12, this.characterTopBottomColours[this.appearanceTopColour], this.characterSkinColours[this.appearanceSkinColour], 0, false);
		this.surface._spriteClipping_from6(i + 55, j, 64, 102, GameData.animationNumber[this.appearance2Colour] + 12, this.characterTopBottomColours[this.appearanceBottomColour]);
		this.surface.drawSpriteID(0, this.gameHeight, mudclient.spriteMedia + 22);
		this.surface.draw(this.graphics, 0, 0);
	}

	drawItem(x, y, w, h, id, tx, ty) {
		let picture = GameData.itemPicture[id] + mudclient.spriteItem;
		let mask = GameData.itemMask[id];
		this.surface._spriteClipping_from9(x, y, w, h, picture, mask, 0, 0, false);
	}

	async handleGameInput() {
		await this.checkConnection();

		if (this.systemUpdate !== 0)
			this.systemUpdate--;

		if (this.logoutBoxFrames > 0)
			this.logoutBoxFrames--;

		if (this.localPlayer.isFighting())
			this.combatTimer.tickThreshold = secondsToFrames(10);

		for (let t = 0; t < this.tickables.length; t += 1) {
			let tickable = this.tickables[t];
			if (tickable && tickable.enabled) {
				if (tickable.cb) {
					await tickable.tick();
				} else {
					await tickable.tick(() => {
						tickable.disable();
						// this.removeTimer(tickable);
					});
				}
			}
		}
		if (this.deathScreenTimeout > 0) {
			if (--this.deathScreenTimeout === 0) {
				this.showMessage('You have been granted another life. Be more careful this time!', 3);
				this.showMessage('You retain your skills. Your objects land where you died', 3);
			}
		}

		if (this.showAppearanceChange) {
			this.handleAppearancePanelControls();
			return;
		}
		// This shit was whack.  Logs a person out after 90 seconds.
		// if (this.mouseActionTimeout > 4500 && this.combatTimeout === 0 && this.logoutTimeout === 0) {
		//     this.mouseActionTimeout -= 500;
		//     this.sendLogout();
		//     return;
		// }

		for (let i = 0; i < this.playerCount; i++) {
			let player = this.players[i];
			if (!player) {
				console.log(`missing players[${i}]; max index:${this.playerCount}`);
				return;
			}
			
			player.traversePath();

			if (player.messageTimeout > 0)
				player.messageTimeout--;
			if (player.bubble)
				player.bubble.tick(() => {
					player.bubble = void 0;
				});
			// if (player.bubbleTimeout > 0)
				// player.bubbleTimeout--;
			// if (player.combatTimer > 0)
				// player.combatTimer--;
			if (player.projectileRange > 0)
				player.projectileRange--;
			player.healthTimer.tick(() => {
				player.healthTimer.disable();
			})
			
		}

		for (let j = 0; j < this.npcCount; j++) {
			let npc = this.npcs[j];
			if (!npc) {
				console.log(`missing npcs[${j}]; max index:${this.npcCount}`);
				return;
			}
			npc.traversePath();
			// giant bats have to flap 2x for every 1 human step
			if (npc.typeID === NPC_GIANT_BAT)
				npc.stepCount++;
			
			if (npc.messageTimeout > 0)
				npc.messageTimeout--;
			if (npc.bubble)
				npc.bubble.tick(() => {
					npc.bubble = void 0;
				});
			// if (npc.bubbleTimeout > 0)
				// npc.bubbleTimeout--;
			npc.healthTimer.tick(() => {
				npc.healthTimer.disable();
			});

		}

		if (this.showUiTab !== 2) {
			// activeTab !== TabMinimap
			// FIXME: WTF is this
			if (Surface.anInt346 > 0)
				this.sleepWordDelayTimer++;

			if (Surface.anInt347 > 0)
				this.sleepWordDelayTimer = 0;

			Surface.anInt346 = 0;
			Surface.anInt347 = 0;
		}

		if (Math.abs(this.cameraAutoRotatePlayerX - this.localPlayer.currentX) > 500 || Math.abs(this.cameraAutoRotatePlayerY - this.localPlayer.currentY) > 500) {
			this.cameraAutoRotatePlayerX = this.localPlayer.currentX;
			this.cameraAutoRotatePlayerY = this.localPlayer.currentY;
		}

		if (!this.cameraAutoAngleDebug) {
			if (this.cameraAutoRotatePlayerX !== this.localPlayer.currentX)
				this.cameraAutoRotatePlayerX += (this.localPlayer.currentX - this.cameraAutoRotatePlayerX) / (16 + (((this.cameraZoom - 500) / 15) | 0)) | 0;

			if (this.cameraAutoRotatePlayerY !== this.localPlayer.currentY)
				this.cameraAutoRotatePlayerY += (this.localPlayer.currentY - this.cameraAutoRotatePlayerY) / (16 + (((this.cameraZoom - 500) / 15) | 0)) | 0;

			if (this.optionCameraModeAuto) {
				let pivotAngle = this.cameraAngle << 5;
				if (pivotAngle === this.cameraRotation)
					this.autoAngleFrameStep = 0;
				else {
					let rotationDelta = Math.abs(pivotAngle - this.cameraRotation);
					if (rotationDelta > 128) rotationDelta = 256 - rotationDelta;
					let pivotStep = (++this.autoAngleFrameStep * rotationDelta + 0xFF) >> 8;

					this.cameraRotation += (pivotAngle < this.cameraRotation) ? -pivotStep : pivotStep;
					this.cameraRotation &= 0xFF;
				}
			}
		}

		if (this.sleepWordDelayTimer > 20) {
			// FIXME: ???
			this.sleepWordDelay = false;
			this.sleepWordDelayTimer = 0;
		}

		if (this.isSleeping) {
			if (this.inputTextFinal) {
				if (/^::/.test(this.inputTextFinal)) {
					let cmd = this.inputTextFinal.slice(2);
					if (/^closecon$/i.test(cmd)) {
						this.clientStream.closeStream();
						return;
					}
					if (/^logout$/i.test(cmd)) {
						this.closeConnection();
						return;
					}
					if (/^lostcon$/i.test(cmd)) {
						await this.lostConnection();
						return;
					}
					return;
				}
				this.doGuessCaptcha(this.inputTextFinal);
			}

			if (this.lastMouseButtonDown === 1 && this.mouseY > 275 && this.mouseY < 310 && this.mouseX > 56 && this.mouseX < 456)
				this.doGuessCaptcha('-null-');

			this.lastMouseButtonDown = 0;
			return;
		}

		if (this.mouseY > this.gameHeight - 4) {
			if (this.mouseX > 15 && this.mouseX < 96 && this.lastMouseButtonDown === 1)
				this.messageTabSelected = 0;

			if (this.mouseX > 110 && this.mouseX < 194 && this.lastMouseButtonDown === 1) {
				this.messageTabSelected = 1;
				this.panelGame[GamePanels.CHAT].controlFlashText[this.controlTextListChat] = 999999;
			}

			if (this.mouseX > 215 && this.mouseX < 295 && this.lastMouseButtonDown === 1) {
				this.messageTabSelected = 2;
				this.panelGame[GamePanels.CHAT].controlFlashText[this.controlTextListQuest] = 999999;
			}

			if (this.mouseX > 315 && this.mouseX < 395 && this.lastMouseButtonDown === 1) {
				this.messageTabSelected = 3;
				this.panelGame[GamePanels.CHAT].controlFlashText[this.controlTextListPrivate] = 999999;
			}

			if (this.mouseX > 417 && this.mouseX < 497 && this.lastMouseButtonDown === 1) {
				this.reportAbuseState = 1;
				this.reportAbuseOffence = 0;
				this.inputTextCurrent = '';
				this.inputTextFinal = '';
			}

			this.lastMouseButtonDown = 0;
			this.mouseButtonDown = 0;
		}

		this.panelGame[GamePanels.CHAT].handleMouse(this.mouseX, this.mouseY, this.lastMouseButtonDown, this.mouseButtonDown, this.mouseScrollDelta);

		// FIXME: What is this spot on screen and why do this?? 18 pixels from righthand-side and within 66 pixels of the bottom
		if (this.messageTabSelected > 0 && this.mouseX >= this.gameWidth2-18 && this.mouseY >= this.gameHeight2 - 66)
			this.lastMouseButtonDown = 0;

		if (this.panelGame[GamePanels.CHAT].isClicked(this.controlTextListAll)) {
			let s = this.panelGame[GamePanels.CHAT].getText(this.controlTextListAll);
			if (s.length > 0) {
				this.chatHistoryIndex = -1;
				this.chatHistory.push(s);

				this.panelGame[GamePanels.CHAT].setTextHandle(this.controlTextListAll, '');
				if (/^::.*/.test(s)) {
					let cmd = s.substring(2);
					if ( /^closeconn?$/i.test(cmd) ) {
						this.clientStream.closeStream();
						return;
					}
					if ( /^logout$/i.test(cmd) ) {
						this.closeConnection();
						return;
					}
					if ( /^(lostconn?|dc)$/i.test(cmd) ) {
						await this.lostConnection();
						return;
					}
					this.sendCommandString(cmd);
					return;
				}
				let msg = this.chatSystem.encode(s);
				if (msg.length === 0)
					return;
				this.sendChatMessage(msg, msg.length);
				if (!this.localPlayer)
					return;
				s = this.chatSystem.decode(msg);
				this.localPlayer.messageTimeout = secondsToFrames(3);
				this.localPlayer.message = s;
				this.showMessage(this.localPlayer.name + ': ' + s, 2);
			}
		}

		if (this.messageTabSelected === 0)
			for (let i = 0; i < this.messageHistory.length; i++) {
				if (this.messageHistory[i].ticks > 0) {
					this.messageHistory[i].ticks -= 1;
				} else {
					this.messageHistory.pop();
				}
			}

		if (this.deathScreenTimeout > 0)
			this.lastMouseButtonDown = 0;

		if (this.tradeConfigVisible || this.duelConfigVisible) {
			if (this.mouseButtonDown === 1)
				this.mouseButtonDownTime += 1
			else
				this.mouseButtonDownTime = 0

			if (this.mouseButtonDownTime > secondsToFrames(12))
				this.mouseItemTickDelta += 5000;
			else if (this.mouseButtonDownTime > secondsToFrames(9))
				this.mouseItemTickDelta += 500;
			else if (this.mouseButtonDownTime > secondsToFrames(6))
				this.mouseItemTickDelta += 50;
			else if (this.mouseButtonDownTime > secondsToFrames(3))
				this.mouseItemTickDelta += 5;
			else if (this.mouseButtonDownTime > secondsToFrames(1))
				this.mouseItemTickDelta++;
			else if (this.mouseButtonDownTime > 20 && (this.mouseButtonDownTime & 0b0101) === 0)
				this.mouseItemTickDelta++;
		} else {
			this.mouseButtonDownTime = 0;
			this.mouseItemTickDelta = 0;
		}

		if (this.lastMouseButtonDown === 1)
			this.mouseButtonClick = 1;
		else if (this.lastMouseButtonDown === 2)
			this.mouseButtonClick = 2;

		this.scene.setMouseLoc(this.mouseX, this.mouseY);
		this.lastMouseButtonDown = 0;

		if (this.optionCameraModeAuto) {
			if (this.anInt707 === 0 || this.cameraAutoAngleDebug) {
				if (this.keyLeft) {
					this.cameraAngle = this.cameraAngle + 1 & 7;
					this.keyLeft = false;

					if (!this.fogOfWar) {
						if ((this.cameraAngle & 1) === 0)
							this.cameraAngle = this.cameraAngle + 1 & 7;

						for (let i2 = 0; i2 < 8; i2++) {
							if (this.isValidCameraAngle(this.cameraAngle))
								break;

							this.cameraAngle = (this.cameraAngle + 1) & 7;
						}
					}
				}

				if (this.keyRight) {
					this.cameraAngle = (this.cameraAngle + 7) & 7;
					this.keyRight = false;

					if (!this.fogOfWar) {
						if ((this.cameraAngle & 1) === 0)
							this.cameraAngle = this.cameraAngle + 7 & 7;

						for (let j2 = 0; j2 < 8; j2++) {
							if (this.isValidCameraAngle(this.cameraAngle)) {
								break;
							}

							this.cameraAngle = this.cameraAngle + 7 & 7;
						}
					}
				}
			}
		} else if (this.keyLeft) {
			this.cameraRotation = this.cameraRotation + 2 & 0xFF;
		} else if (this.keyRight) {
			this.cameraRotation = this.cameraRotation - 2 & 0xFF;
		}

		if (!this.optionCameraModeAuto && this.options.middleClickCamera && this.middleButtonDown)
			this.cameraRotation = this.originRotation + (this.mouseX - this.originMouseX) / 2 & 0xff;

		if (this.options.zoomCamera) {
			this.handleCameraZoom();
		} else {
			if (this.fogOfWar && this.cameraZoom > ZOOM_INDOORS) {
				this.cameraZoom -= 4;
			} else if (!this.fogOfWar && this.cameraZoom < ZOOM_OUTDOORS) {
				this.cameraZoom += 4;
			}
		}

		if (this.mouseClickXStep !== 0)
			this.mouseClickXStep += -Math.sign(this.mouseClickXStep);

		// 17 is fountain
		this.scene.doSOemthingWithTheFuckinFountainFuck(17);
		this.objectAnimationCount++;

		if (this.objectAnimationCount > 5) {
			this.objectAnimationCount = 0;
			this.objectAnimationNumberFireLightningSpell = (this.objectAnimationNumberFireLightningSpell + 1) % 3;
			this.objectAnimationNumberTorch = (this.objectAnimationNumberTorch + 1) & 3;
			this.objectAnimationNumberClaw = (this.objectAnimationNumberClaw + 1) % 5;
		}

		for (let k2 = 0; k2 < this.objectCount; k2++) {
			let l3 = this.objectX[k2];
			let l4 = this.objectY[k2];

			// spin dem windmills
			if (this.objectX[k2] >= 0 && this.objectY[k2] >= 0 && this.objectX[k2] < 96 && this.objectY[k2] < 96 && this.objectId[k2] === WINDMILL) {
				this.objectModel[k2].rotate(1, 0, 0);
			}
		}

		for (let i4 = 0; i4 < this.teleportBubbleCount; i4++) {
			this.teleportBubbleTime[i4]++;

			if (this.teleportBubbleTime[i4] > secondsToFrames(1)) {
				this.teleportBubbleCount--;

				for (let i5 = i4; i5 < this.teleportBubbleCount; i5++) {
					this.teleportBubbleX[i5] = this.teleportBubbleX[i5 + 1];
					this.teleportBubbleY[i5] = this.teleportBubbleY[i5 + 1];
					this.teleportBubbleTime[i5] = this.teleportBubbleTime[i5 + 1];
					this.teleportBubbleType[i5] = this.teleportBubbleType[i5 + 1];
				}
			}
		}
	}

	doGuessCaptcha(s) {
		let p = new Packet(C_OPCODES.SLEEP_WORD);
		p.startAccess();
		p.putString(s);
		if (!this.sleepWordDelay) {
			// ??
			p.putByte(0);
			this.sleepWordDelay = true;
		}
		p.stopAccess();
		this.clientStream.add(p);

		this.inputTextCurrent = '';
		this.inputTextFinal = '';
		this.sleepingStatusText = 'Please wait...';
	}

	handleCameraZoom() {
		if (this.keyUp)
			this.cameraZoom -= 8;
		else if (this.keyDown)
			this.cameraZoom += 8;
		else if (this.keyHome)
			this.cameraZoom = ZOOM_OUTDOORS;
		else if (this.keyPgUp)
			this.cameraZoom = ZOOM_MIN;
		else if (this.keyPgDown)
			this.cameraZoom = ZOOM_MAX;

		if (this.mouseScrollDelta !== 0 && (this.showUiTab === 2 || this.showUiTab === 0)) {
			if (this.messageTabSelected !== 0 && this.mouseY > this.gameHeight - 64)
				return;

			this.cameraZoom += this.mouseScrollDelta * 24;
		}

		if (this.cameraZoom >= ZOOM_MAX)
			this.cameraZoom = ZOOM_MAX;
		else if (this.cameraZoom <= ZOOM_MIN)
			this.cameraZoom = ZOOM_MIN;
	}

	renderLoginScreenViewports() {
		let rh = 0;
		let rx = 50; //49;
		let ry = 50; //47;

		this.world._loadSection_from3(rx * 48 + 23, ry * 48 + 23, rh);
		this.world.addModels(this.gameModels);

		let x = 9728;
		let y = 6400;
		let zoom = 1100;
		let rotation = 888;

		this.scene.clipFar3d = 4100;
		this.scene.clipFar2d = 4100;
		this.scene.fogZFalloff = 1;
		this.scene.fogZDistance = 4000;
		this.surface.blackScreen();
		this.scene.setCamera(x, -this.world.getElevation(x, y), y, 912, rotation, 0, zoom * 2);
		this.scene.render();
		this.surface.fadeToBlack();
		this.surface.fadeToBlack();
		this.surface.drawBox(0, 0, this.gameWidth, 6, 0);

		for (let j = 6; j >= 1; j--) {
			this.surface.drawLineAlpha(0, j, 0, j, this.gameWidth, 8);
		}

		this.surface.drawBox(0, 194, 512, 20, 0);

		for (let k = 6; k >= 1; k--) {
			this.surface.drawLineAlpha(0, k, 0, 194 - k, this.gameWidth, 8);
		}

		// runescape logo
		this.surface.drawSpriteID(((this.gameWidth / 2) | 0) - ((this.surface.spriteWidth[mudclient.spriteMedia + 10] / 2) | 0), 15, mudclient.spriteMedia + 10);
		this.surface._drawSprite_from5(mudclient.spriteLogo, 0, 0, this.gameWidth, 200);
		this.surface.drawWorld(mudclient.spriteLogo);

		x = 9216;
		y = 9216;
		zoom = 1100;
		rotation = 888;

		this.scene.clipFar3d = 4100;
		this.scene.clipFar2d = 4100;
		this.scene.fogZFalloff = 1;
		this.scene.fogZDistance = 4000;

		this.surface.blackScreen();
		this.scene.setCamera(x, -this.world.getElevation(x, y), y, 912, rotation, 0, zoom * 2);
		this.scene.render();
		this.surface.fadeToBlack();
		this.surface.fadeToBlack();
		this.surface.drawBox(0, 0, this.gameWidth, 6, 0);

		for (let l = 6; l >= 1; l--) {
			this.surface.drawLineAlpha(0, l, 0, l, this.gameWidth, 8);
		}

		this.surface.drawBox(0, 194, this.gameWidth, 20, 0);

		for (let i1 = 6; i1 >= 1; i1--) {
			this.surface.drawLineAlpha(0, i1, 0, 194 - i1, this.gameWidth, 8);
		}

		this.surface.drawSpriteID(((this.gameWidth / 2) | 0) - ((this.surface.spriteWidth[mudclient.spriteMedia + 10] / 2) | 0), 15, mudclient.spriteMedia + 10);
		this.surface._drawSprite_from5(mudclient.spriteLogo + 1, 0, 0, this.gameWidth, 200);
		this.surface.drawWorld(mudclient.spriteLogo + 1);

		for (let j1 = 0; j1 < 64; j1++) {
			this.scene.removeModel(this.world.roofModels[0][j1]);
			this.scene.removeModel(this.world.wallModels[1][j1]);
			this.scene.removeModel(this.world.roofModels[1][j1]);
			this.scene.removeModel(this.world.wallModels[2][j1]);
			this.scene.removeModel(this.world.roofModels[2][j1]);
		}

		x = 11136;
		y = 10368;
		zoom = 500;
		rotation = 376;

		this.scene.clipFar3d = 4100;
		this.scene.clipFar2d = 4100;
		this.scene.fogZFalloff = 1;
		this.scene.fogZDistance = 4000;
		this.surface.blackScreen();
		this.scene.setCamera(x, -this.world.getElevation(x, y), y, 912, rotation, 0, zoom * 2);
		this.scene.render();
		this.surface.fadeToBlack();
		this.surface.fadeToBlack();
		this.surface.drawBox(0, 0, this.gameWidth, 6, 0);

		for (let k1 = 6; k1 >= 1; k1--)
			this.surface.drawLineAlpha(0, k1, 0, k1, this.gameWidth, 8);

		this.surface.drawBox(0, 194, this.gameWidth, 20, 0);

		for (let l1 = 6; l1 >= 1; l1--)
			this.surface.drawLineAlpha(0, l1, 0, 194, this.gameWidth, 8);

		this.surface.drawSpriteID(((this.gameWidth / 2) | 0) - ((this.surface.spriteWidth[mudclient.spriteMedia + 10] / 2) | 0), 15, mudclient.spriteMedia + 10);
		this.surface._drawSprite_from5(mudclient.spriteMedia + 10, 0, 0, this.gameWidth, 200);
		this.surface.drawWorld(mudclient.spriteMedia + 10);
	}

	createLoginPanels() {
		this.panelLogin[WelcomeStates.WELCOME] = new Panel(this.surface, 50);
		this.panelLogin[WelcomeStates.NEW_USER] = new Panel(this.surface, 50);
		this.panelLogin[WelcomeStates.EXISTING_USER] = new Panel(this.surface, 50);

		let y = 40;
		let x = Math.floor(this.gameWidth / 2);

		this.panelLogin[WelcomeStates.WELCOME].addText(x, 200 + y, 'Click on an option', 5, true);
		this.panelLogin[WelcomeStates.WELCOME].addButtonBackground(x - 100, 240 + y, 120, 35);
		this.panelLogin[WelcomeStates.WELCOME].addButtonBackground(x + 100, 240 + y, 120, 35);
		this.panelLogin[WelcomeStates.WELCOME].addText(x - 100, 240 + y, 'New User', 5, false);
		this.panelLogin[WelcomeStates.WELCOME].addText(x + 100, 240 + y, 'Existing User', 5, false);
		this.controlWelcomeNewuser = this.panelLogin[WelcomeStates.WELCOME].addButton(x - 100, 240 + y, 120, 35);
		this.controlWelcomeExistinguser = this.panelLogin[WelcomeStates.WELCOME].addButton(x + 100, 240 + y, 120, 35);

		y = 70;

		this.controlRegisterStatus = this.panelLogin[WelcomeStates.NEW_USER].addText(x, y + 8, 'To create an account please enter all the requested details', 4, true);
		let relY = y + 25;
		this.panelLogin[WelcomeStates.NEW_USER].addButtonBackground(x, relY + 17, 250, 34);
		this.panelLogin[WelcomeStates.NEW_USER].addText(x, relY + 8, 'Choose a Username', 4, false);
		this.controlRegisterUser = this.panelLogin[WelcomeStates.NEW_USER].addTextInput(x, relY + 25, 200, 40, 4, 12, false, false);
		this.panelLogin[WelcomeStates.NEW_USER].setFocus(this.controlRegisterUser);
		relY += 40;
		this.panelLogin[WelcomeStates.NEW_USER].addButtonBackground(x - 115, relY + 17, 220, 34);
		this.panelLogin[WelcomeStates.NEW_USER].addText(x - 115, relY + 8, 'Choose a Password', 4, false);
		this.controlRegisterPassword = this.panelLogin[WelcomeStates.NEW_USER].addTextInput(x - 115, relY + 25, 220, 40, 4, 20, true, false);
		this.panelLogin[WelcomeStates.NEW_USER].addButtonBackground(x + 115, relY + 17, 220, 34);
		this.panelLogin[WelcomeStates.NEW_USER].addText(x + 115, relY + 8, 'Confirm Password', 4, false);
		this.controlRegisterConfirmPassword = this.panelLogin[WelcomeStates.NEW_USER].addTextInput(x + 115, relY + 25, 220, 40, 4, 20, true, false);
		relY += 60;
		this.controlRegisterCheckbox = this.panelLogin[WelcomeStates.NEW_USER].addCheckbox(x - 196 - 7, relY - 7, 14, 14);
		this.panelLogin[WelcomeStates.NEW_USER].addTextAbsolute(x - 181, relY, 'I have read and agree to the terms and conditions', 4, true);
		relY += 15;
		this.panelLogin[WelcomeStates.NEW_USER].addText(x, relY, '(to view these click the relevant link below this game window)', 4, true);
		relY += 20;
		this.panelLogin[WelcomeStates.NEW_USER].addButtonBackground(x - 100, relY + 17, 150, 34);
		this.panelLogin[WelcomeStates.NEW_USER].addText(x - 100, relY + 17, 'Submit', 5, false);
		this.controlRegisterSubmit = this.panelLogin[WelcomeStates.NEW_USER].addButton(x - 100, relY + 17, 150, 34);
		this.panelLogin[WelcomeStates.NEW_USER].addButtonBackground(x + 100, relY + 17, 150, 34);
		this.panelLogin[WelcomeStates.NEW_USER].addText(x + 100, relY + 17, 'Cancel', 5, false);
		this.controlRegisterCancel = this.panelLogin[WelcomeStates.NEW_USER].addButton(x + 100, relY + 17, 150, 34);

		y = 230;
		this.controlLoginStatus = this.panelLogin[WelcomeStates.EXISTING_USER].addText(x, y - 10, 'Please enter your username and password', 4, true);
		y += 28;
		this.panelLogin[WelcomeStates.EXISTING_USER].addButtonBackground(x - 116, y, 200, 40);
		this.panelLogin[WelcomeStates.EXISTING_USER].addText(x - 116, y - 10, 'Username:', 4, false);
		this.panelLogin[WelcomeStates.EXISTING_USER].addText(x-55, y - 5, "Save?", 2, false);
		this.controlLoginSavePass = this.panelLogin[WelcomeStates.EXISTING_USER].addCheckbox(x-60, y + 5, 10, 10);
		this.controlLoginUser = this.panelLogin[WelcomeStates.EXISTING_USER].addTextInput(x - 116, y + 10, 200, 40, 4, 12, false, false);
		y += 47;
		this.panelLogin[WelcomeStates.EXISTING_USER].addButtonBackground(x - 66, y, 200, 40);
		this.panelLogin[WelcomeStates.EXISTING_USER].addText(x - 66, y - 10, 'Password:', 4, false);
		this.controlLoginPass = this.panelLogin[WelcomeStates.EXISTING_USER].addTextInput(x - 66, y + 10, 200, 40, 4, 20, true, false);
		y -= 55;
		this.panelLogin[WelcomeStates.EXISTING_USER].addButtonBackground(x + 154, y, 120, 25);
		this.panelLogin[WelcomeStates.EXISTING_USER].addText(x + 154, y, 'Ok', 4, false);
		this.controlLoginOk = this.panelLogin[WelcomeStates.EXISTING_USER].addButton(x + 154, y, 120, 25);
		y += 30;
		this.panelLogin[WelcomeStates.EXISTING_USER].addButtonBackground(x + 154, y, 120, 25);
		this.panelLogin[WelcomeStates.EXISTING_USER].addText(x + 154, y, 'Cancel', 4, false);
		this.controlLoginCancel = this.panelLogin[WelcomeStates.EXISTING_USER].addButton(x + 154, y, 120, 25);
		y += 30;
		this.panelLogin[WelcomeStates.EXISTING_USER].setFocus(this.controlLoginUser);
	}

	renderInventoryTab(nomenus) {
		let uiX = this.surface.width2 - 248;

		this.surface.drawSpriteID(uiX, 3, mudclient.spriteMedia + 1);

		for (let itemIndex = 0; itemIndex < this.inventoryMaxItemCount; itemIndex++) {
			let slotX = uiX + (itemIndex % 5) * 49;
			let slotY = 36 + Math.floor(itemIndex / 5) * 34;

			if (itemIndex < this.inventoryItemsCount && this.inventoryEquipped[itemIndex])
				this.surface.drawBoxAlpha(slotX, slotY, 49, 34, 0xff0000, 128);
			else
				this.surface.drawBoxAlpha(slotX, slotY, 49, 34, Surface.rgbToLong(181, 181, 181), 128);

			if (itemIndex < this.inventoryItemsCount) {
				this.surface._spriteClipping_from9(slotX, slotY, 48, 32, mudclient.spriteItem + GameData.itemPicture[this.inventoryItemId[itemIndex]], GameData.itemMask[this.inventoryItemId[itemIndex]], 0, 0, false);

				if (GameData.itemStackable[this.inventoryItemId[itemIndex]] === 0)
					this.surface.drawString(this.inventoryItemStackCount[itemIndex].toString(), slotX + 1, slotY + 10, 1, 0xffff00);
			}
		}

		for (let rows = 1; rows <= 4; rows++)
			this.surface.drawLineVert(uiX + rows * 49, 36, ((this.inventoryMaxItemCount / 5) | 0) * 34, 0);

		for (let cols = 1; cols <= ((this.inventoryMaxItemCount / 5) | 0) - 1; cols++)
			this.surface.drawLineHoriz(uiX, 36 + cols * 34, 245, 0);

		if (!nomenus)
			return;

		let mouseX = this.mouseX - (this.surface.width2 - 248);
		let mouseY = this.mouseY - 36;

		if (mouseX >= 0 && mouseY >= 0 && mouseX < 248 && mouseY < Math.floor(this.inventoryMaxItemCount / 5)* 34) {
			let itemIndex = Math.floor(mouseX / 49) + Math.floor(mouseY / 34) * 5;

			if (itemIndex < this.inventoryItemsCount) {
				let i2 = this.inventoryItemId[itemIndex];

				if (this.selectedSpell >= 0) {
					if (GameData.spellType[this.selectedSpell] === 3) {
						this.menuItemText1[this.menuItemsCount] = 'Cast ' + GameData.spellName[this.selectedSpell] + ' on';
						this.menuItemText2[this.menuItemsCount] = '@lre@' + GameData.itemName[i2];
						this.menuItemID[this.menuItemsCount] = 600;
						this.menuSourceType[this.menuItemsCount] = itemIndex;
						this.menuSourceIndex[this.menuItemsCount] = this.selectedSpell;
						this.menuItemsCount++;

					}
				} else {
					if (this.selectedItemInventoryIndex >= 0) {
						this.menuItemText1[this.menuItemsCount] = 'Use ' + this.selectedItemName + ' with';
						this.menuItemText2[this.menuItemsCount] = '@lre@' + GameData.itemName[i2];
						this.menuItemID[this.menuItemsCount] = 610;
						this.menuSourceType[this.menuItemsCount] = itemIndex;
						this.menuSourceIndex[this.menuItemsCount] = this.selectedItemInventoryIndex;
						this.menuItemsCount++;
						return;
					}

					if (this.inventoryEquipped[itemIndex]) {
						this.menuItemText1[this.menuItemsCount] = 'Remove';
						this.menuItemText2[this.menuItemsCount] = '@lre@' + GameData.itemName[i2];
						this.menuItemID[this.menuItemsCount] = 620;
						this.menuSourceType[this.menuItemsCount] = itemIndex;
						this.menuItemsCount++;
					} else if (GameData.itemWearable[i2] !== 0) {
						if ((GameData.itemWearable[i2] & 24) !== 0) {
							this.menuItemText1[this.menuItemsCount] = 'Wield';
						} else {
							this.menuItemText1[this.menuItemsCount] = 'Wear';
						}

						this.menuItemText2[this.menuItemsCount] = '@lre@' + GameData.itemName[i2];
						this.menuItemID[this.menuItemsCount] = 630;
						this.menuSourceType[this.menuItemsCount] = itemIndex;
						this.menuItemsCount++;
					}

					if (GameData.itemCommand[i2] !== '') {
						this.menuItemText1[this.menuItemsCount] = GameData.itemCommand[i2];
						this.menuItemText2[this.menuItemsCount] = '@lre@' + GameData.itemName[i2];
						this.menuItemID[this.menuItemsCount] = 640;
						this.menuSourceType[this.menuItemsCount] = itemIndex;
						this.menuItemsCount++;
					}

					this.menuItemText1[this.menuItemsCount] = 'Use';
					this.menuItemText2[this.menuItemsCount] = '@lre@' + GameData.itemName[i2];
					this.menuItemID[this.menuItemsCount] = 650;
					this.menuSourceType[this.menuItemsCount] = itemIndex;
					this.menuItemsCount++;
					this.menuItemText1[this.menuItemsCount] = 'Drop';
					this.menuItemText2[this.menuItemsCount] = '@lre@' + GameData.itemName[i2];
					this.menuItemID[this.menuItemsCount] = 660;
					this.menuSourceType[this.menuItemsCount] = itemIndex;
					this.menuItemsCount++;
					this.menuItemText1[this.menuItemsCount] = 'Examine';
					this.menuItemText2[this.menuItemsCount] = '@lre@' + GameData.itemName[i2];
					this.menuItemID[this.menuItemsCount] = 3600;
					this.menuSourceType[this.menuItemsCount] = i2;
					this.menuItemsCount++;
				}
			}
		}
	}

	autorotateCamera() {
		if ((this.cameraAngle & 1) === 1 && this.isValidCameraAngle(this.cameraAngle)) {
			return;
		}

		if ((this.cameraAngle & 1) === 0 && this.isValidCameraAngle(this.cameraAngle)) {
			if (this.isValidCameraAngle(this.cameraAngle + 1 & 7)) {
				this.cameraAngle = this.cameraAngle + 1 & 7;
				return;
			}

			if (this.isValidCameraAngle(this.cameraAngle + 7 & 7)) {
				this.cameraAngle = this.cameraAngle + 7 & 7;
			}

			return;
		}

		let ai = Int32Array.from([1, -1, 2, -2, 3, -3, 4]);

		for (let i = 0; i < 7; i++) {
			if (!this.isValidCameraAngle(this.cameraAngle + ai[i] + 8 & 7)) {
				continue;
			}

			this.cameraAngle = this.cameraAngle + ai[i] + 8 & 7;
			break;
		}

		if ((this.cameraAngle & 1) === 0 && this.isValidCameraAngle(this.cameraAngle)) {
			if (this.isValidCameraAngle(this.cameraAngle + 1 & 7)) {
				this.cameraAngle = this.cameraAngle + 1 & 7;
				return;
			}

			if (this.isValidCameraAngle(this.cameraAngle + 7 & 7)) {
				this.cameraAngle = this.cameraAngle + 7 & 7;
			}
		}
	}

	handleContextClick() {
/*		if (this.mouseButtonClick !== 0) {
			for (let entry = 0; entry < this.menuItemsCount; entry++) {
				let entryX = this.menuX + 2;
				let entryY = this.menuY + 27 + i * 15;

				if (this.mouseX > entryX+7 && this.mouseY > entryY-15 && this.mouseY <= entryY && this.mouseX <= entryX + this.menuWidth+7) {
					this.menuItemClick(this.menuIndices[entry]);
					break;
				}
			}

			this.mouseButtonClick = 0;
			this.visibleContextMenu = false;
			return;
		}
*/
		if (this.mouseX < this.menuX - 10 || this.mouseY < this.menuY - 10 || this.mouseX > this.menuX + this.menuWidth + 10 || this.mouseY > this.menuY + this.menuHeight + 10) {
			this.visibleContextMenu = false;
			return;
		}

		this.surface.drawBoxAlpha(this.menuX, this.menuY, this.menuWidth, this.menuHeight, 0xd0d0d0, 160);
		this.surface.drawString('Choose option', this.menuX + 2, this.menuY + 12, 1, 0x00FFFF);

		for (let entry = 0; entry < this.menuItemsCount; entry++) {
			let entryX = this.menuX + 2;
			let entryY = this.menuY + 27 + entry * 15;
			let color = 0xffffff;

			if (this.isClicking() && (this.mouseX > entryX+7 && this.mouseY > entryY-15 && this.mouseY <= entryY && this.mouseX <= entryX + this.menuWidth+7)) {
				this.visibleContextMenu = false;
				this.menuItemClick(this.menuIndices[entry]);
				this.mouseButtonClick = 0;
				// return;
			} else if (this.mouseX > entryX - 2 && this.mouseY > entryY-15 && this.mouseY < entryY && this.mouseX < (entryX-2) + this.menuWidth) {
				color = 0xffff00;
				if (this.isClicking()) {
					this.visibleContextMenu = false;
					this.menuItemClick(this.menuIndices[entry]);
					this.mouseButtonClick = 0;
					// return;
				}
			}

			this.surface.drawString(this.menuItemText1[this.menuIndices[entry]] + ' ' + this.menuItemText2[this.menuIndices[entry]], entryX, entryY, 1, color);
		}
	}

	renderMinimapTab(nomenus) {
		let startX = this.surface.width2 - 199;
		let startY = 3;
		let width = 156;
		let height = 152;

		// Draw the minimap tab sprite on top of the tab bar sprite
		this.surface.drawSpriteID(startX - 49, startY, mudclient.spriteMedia + 2);
		startX += 40;
		startY += 33;
		this.surface.drawBox(startX, startY, width, height, 0);
		this.surface.setBounds(startX, startY, startX + width, startY + height);

//		let k = 192 + this.minimapRandom_2;
		let k = 192;
//		let i1 = this.cameraRotation + this.minimapRandom_1 & 0xff;
		let i1 = this.cameraRotation & 0xFF;
		let k1 = ((this.localPlayer.currentX - 6040) * 3 * k) / 2048 | 0;
		let i3 = ((this.localPlayer.currentY - 6040) * 3 * k) / 2048 | 0;
		let k4 = Scene.sin2048Cache[1024 - i1 * 4 & 0x3ff];
		let i5 = Scene.sin2048Cache[(1024 - i1 * 4 & 0x3ff) + 1024];
		let k5 = i3 * k4 + k1 * i5 >> 18;

		i3 = i3 * i5 - k1 * k4 >> 18;
		k1 = k5;

		// landscape
		this.surface.drawMinimapSprite(startX + Math.floor(width / 2) - k1, 36 + Math.floor(height / 2) + i3, mudclient.spriteMedia - 1, i1 + 64 & 255, k);

		for (let i = 0; i < this.objectCount; i++) {
			let l1 = (((this.objectX[i] * this.tileSize + 64) - this.localPlayer.currentX) * 3 * k) / 2048 | 0;
			let j3 = (((this.objectY[i] * this.tileSize + 64) - this.localPlayer.currentY) * 3 * k) / 2048 | 0;
			let l5 = j3 * k4 + l1 * i5 >> 18;

			j3 = j3 * i5 - l1 * k4 >> 18;
			l1 = l5;

			this.drawMinimapEntity(startX + Math.floor(width / 2) + l1, 36 + Math.floor(height / 2) - j3, 65535);
		}

		for (let j7 = 0; j7 < this.groundItemCount; j7++) {
			let i2 = (((this.groundItemX[j7] * this.tileSize + 64) - this.localPlayer.currentX) * 3 * k) / 2048 | 0;
			let k3 = (((this.groundItemY[j7] * this.tileSize + 64) - this.localPlayer.currentY) * 3 * k) / 2048 | 0;
			let i6 = k3 * k4 + i2 * i5 >> 18;

			k3 = k3 * i5 - i2 * k4 >> 18;
			i2 = i6;

			this.drawMinimapEntity(startX + Math.floor(width / 2) + i2, 36 + Math.floor(height / 2) - k3, 0xff0000);
		}

		for (let k7 = 0; k7 < this.npcCount; k7++) {
			let character = this.npcs[k7];

			let j2 = ((character.currentX - this.localPlayer.currentX) * 3 * k) / 2048 | 0;
			let l3 = ((character.currentY - this.localPlayer.currentY) * 3 * k) / 2048 | 0;
			let j6 = l3 * k4 + j2 * i5 >> 18;

			l3 = l3 * i5 - j2 * k4 >> 18;
			j2 = j6;

			this.drawMinimapEntity(startX + Math.floor(width / 2) + j2, 36 + Math.floor(height / 2) - l3, 0xffff00);
		}

		for (let l7 = 0; l7 < this.playerCount; l7++) {
			let player = this.players[l7];
			let deltaX = ((player.currentX - this.localPlayer.currentX) * 3 * k) / 2048 | 0;
			let deltaY = ((player.currentY - this.localPlayer.currentY) * 3 * k) / 2048 | 0;
			let k6 = deltaY * k4 + deltaX * i5 >> 18;

			deltaY = deltaY * i5 - deltaX * k4 >> 18;
			deltaX = k6;

			// White
			let indicatorColor = 0xffffff;

			for (let friendIdx = 0; friendIdx < this.friendListCount; friendIdx++) {
				// Green
				if (player.hash === (this.friendListHashes[friendIdx]) && this.friendListOnline[friendIdx] === 0xFF)
					indicatorColor = 0x00ff00;
			}

			this.drawMinimapEntity(startX + Math.floor(width / 2) + deltaX, (36 + Math.floor(height / 2)) - deltaY, indicatorColor);
		}

		this.surface.drawCircle(startX + ((width / 2) | 0), 36 + ((height / 2) | 0), 2, 0xffffff, 255);

		// compass
		this.surface.drawMinimapSprite(startX + 19, 55, mudclient.spriteMedia + 24, this.cameraRotation + 128 & 255, 128);
		this.surface.setBounds(0, 0, this.gameWidth, this.gameHeight + 12);

		if (!nomenus) {
			return;
		}

		let mouseX = this.mouseX - (this.surface.width2 - 199);
		let mouseY = this.mouseY - 36;

		if (this.options.resetCompass && this.mouseButtonClick === 1 && mouseX > 42 && mouseX < 75 && mouseY > 3 && mouseY < 36) {
			this.cameraRotation = 0x80;
			this.mouseButtonClick = 0;
			return;
		}

		if (mouseX >= 40 && mouseY >= 0 && mouseX < 196 && mouseY < 152) {
			let c1 = 156;
			let c3 = 152;
//			let l = 192 + this.minimapRandom_2;
			let l = 192;
			let j1 = this.cameraRotation & 0xFF;
//			let j1 = this.cameraRotation + this.minimapRandom_1 & 0xff;
			let j = this.surface.width2 - 199;

			j += 40;

			let dx = ((this.mouseX - (j + ((c1 / 2) | 0))) * 16384) / (3 * l) | 0;
			let dy = ((this.mouseY - (36 + ((c3 / 2) | 0))) * 16384) / (3 * l) | 0;
			let l4 = Scene.sin2048Cache[1024 - j1 * 4 & 1023];
			let j5 = Scene.sin2048Cache[(1024 - j1 * 4 & 1023) + 1024];
			let l6 = dy * l4 + dx * j5 >> 15;

			dy = dy * j5 - dx * l4 >> 15;
			dx = l6;
			dx += this.localPlayer.currentX;
			dy = this.localPlayer.currentY - dy;

			if (this.mouseButtonClick === 1) {
				this.walkToMob(this.localRegionX, this.localRegionY, dx / 128 | 0, dy / 128 | 0, false);

				this.mouseButtonClick = 0;
			}
		}
	}

	renderConfirmTrade() {
		let dialogX = 22;
		let dialogY = 36;

		this.surface.drawBox(dialogX, dialogY, 468, 16, 192);
		this.surface.drawBoxAlpha(dialogX, dialogY + 16, 468, 246, 0x989898, 160);
		this.surface.drawStringCenter('Please confirm your trade with @yel@' + Utility.hashToUsername(this.tradeRecipientConfirmHash), dialogX + 234, dialogY + 12, 1, 0xffffff);
		this.surface.drawStringCenter('You are about to give:', dialogX + 117, dialogY + 30, 1, 0xffff00);

		for (let j = 0; j < this.tradeConfirmItemsCount; j++) {
			let s = GameData.itemName[this.tradeConfirmItems[j]];

			if (GameData.itemStackable[this.tradeConfirmItems[j]] === 0) {
				s = s + ' x ' + formatNumber(this.tradeConfirmItemCount[j]);
			}

			this.surface.drawStringCenter(s, dialogX + 117, dialogY + 42 + j * 12, 1, 0xffffff);
		}

		if (this.tradeConfirmItemsCount === 0) {
			this.surface.drawStringCenter('Nothing!', dialogX + 117, dialogY + 42, 1, 0xffffff);
		}

		this.surface.drawStringCenter('In return you will receive:', dialogX + 351, dialogY + 30, 1, 0xffff00);

		for (let k = 0; k < this.tradeRecipientConfirmItemsCount; k++) {
			let s1 = GameData.itemName[this.tradeRecipientConfirmItems[k]];

			if (GameData.itemStackable[this.tradeRecipientConfirmItems[k]] === 0) {
				s1 = s1 + ' x ' + formatNumber(this.tradeRecipientConfirmItemCount[k]);
			}

			this.surface.drawStringCenter(s1, dialogX + 351, dialogY + 42 + k * 12, 1, 0xffffff);
		}

		if (this.tradeRecipientConfirmItemsCount === 0) {
			this.surface.drawStringCenter('Nothing!', dialogX + 351, dialogY + 42, 1, 0xffffff);
		}

		this.surface.drawStringCenter('Are you sure you want to do this?', dialogX + 234, dialogY + 200, 4, 65535);
		this.surface.drawStringCenter('There is NO WAY to reverse a trade if you change your mind.', dialogX + 234, dialogY + 215, 1, 0xffffff);
		this.surface.drawStringCenter('Remember that not all players are trustworthy', dialogX + 234, dialogY + 230, 1, 0xffffff);

		if (!this.tradeConfirmAccepted) {
			this.surface.drawSpriteID((dialogX + 118) - 35, dialogY + 238, mudclient.spriteMedia + 25);
			this.surface.drawSpriteID((dialogX + 352) - 35, dialogY + 238, mudclient.spriteMedia + 26);
		} else {
			this.surface.drawStringCenter('Waiting for other player...', dialogX + 234, dialogY + 250, 1, 0xffff00);
		}

		if (this.mouseButtonClick === 1) {
			if (this.mouseX < dialogX || this.mouseY < dialogY || this.mouseX > dialogX + 468 || this.mouseY > dialogY + 262) {
				this.tradeConfirmVisible = false;
				this.clientStream.queue(Ops.DECLINE_TRADE());
			}

			if (this.mouseX >= (dialogX + 118) - 35 && this.mouseX <= dialogX + 118 + 70 && this.mouseY >= dialogY + 238 && this.mouseY <= dialogY + 238 + 21) {
				this.tradeConfirmAccepted = true;
				this.clientStream.queue(Ops.ACCEPT_TRADE_TWO());
			}

			if (this.mouseX >= (dialogX + 352) - 35 && this.mouseX <= dialogX + 353 + 70 && this.mouseY >= dialogY + 238 && this.mouseY <= dialogY + 238 + 21) {
				this.tradeConfirmVisible = false;
				this.clientStream.queue(Ops.DECLINE_TRADE());
			}

			this.mouseButtonClick = 0;
		}
	}

	mouseWithin(x, y, width, height) {
		return this.mouseX > x && this.mouseX <= x+width &&
				this.mouseY > y && this.mouseY <= y+height;
	}

	openHoveredTab() {
		let previous = this.showUiTab;
		// tabs is 3px from top/left edges of screen
		let padding = 3;
		let border = 1;
		// 32x32 buttons, or 32x23 when viewing a tab
		let height = (previous === 0 ? 32 : 23);
		let width = 32;
		// just near the top-right edge
		let x = this.surface.width2 - padding;
		let y = padding;

		// 6:config panel, 5:friends panel, 4:mage/pray panel, 3:stats panel, 2:minimap panel, 1:inventory panel
		for (let slot = 1; slot <= 6; slot++) {
			x -= width+border;
			if (this.mouseWithin(x, y, width, height)) {
				this.showUiTab = slot;
				break;
			}
		}

		// inventory tab content is wider than the others
		let tabX = this.surface.width2 - (this.showUiTab === 1 ? 149 : 199);
		let rowCount = this.inventoryMaxItemCount/5;
		let contentY = padding+border+height;
		if (this.showUiTab === 0)
			return;
		switch (this.showUiTab) {
		case 1:
			if (this.mouseY > rowCount*34+contentY+10 || this.mouseX < this.surface.width2 - 249)
				this.showUiTab = 0;
			break;
		case 3:
		case 6:
			if (this.mouseY > 316 || this.mouseX < this.surface.width2 - 199)
				this.showUiTab = 0;
			break;
		case 2:
		case 4:
		case 5:
			if (this.mouseY > 240 || this.mouseX < this.surface.width2 - 199)
				this.showUiTab = 0;
			break;
		default:
			return;
		}
	}

	renderOptionsMenu() {
		if (this.mouseButtonClick !== 0) {
			for (let i = 0; i < this.optionMenuCount; i++) {
				if (this.mouseX >= this.surface.textWidth(this.optionMenuEntry[i], 1) || this.mouseY <= i * 12 || this.mouseY >= 12 + i * 12) {
					continue;
				}

				this.clientStream.queue(Ops.CHOOSE_MENU(i));
				break;
			}

			this.mouseButtonClick = 0;
			this.showOptionMenu = false;
			return;
		}

		for (let j = 0; j < this.optionMenuCount; j++) {
			let k = 0x00FFFF;

			if (this.mouseX < this.surface.textWidth(this.optionMenuEntry[j], 1) && this.mouseY > j * 12 && this.mouseY < 12 + j * 12) {
				k = 0xFF0000;
			}

			this.surface.drawString(this.optionMenuEntry[j], 6, 12 + j * 12, 1, k);
		}
	}

	drawNpc(x, y, w, h, id, tx, ty) {
		let npc = this.npcs[id];
		let l1 = (npc.animationCurrent + (this.cameraRotation + 16) / 32) & 7;
		let flag = false;
		let i2 = l1;

		if (i2 === 5) {
			i2 = 3;
			flag = true;
		} else if (i2 === 6) {
			i2 = 2;
			flag = true;
		} else if (i2 === 7) {
			i2 = 1;
			flag = true;
		}

		let j2 = i2 * 3 + this.npcWalkModel[Math.floor(npc.stepCount / GameData.npcWalkModel[npc.typeID]) & 3];

		if (npc.animationCurrent === 8) {
			i2 = 5;
			l1 = 2;
			flag = false;
			x -= (GameData.npcCombatAnimation[npc.typeID] * ty) / 100 | 0;
			j2 = i2 * 3 + this.npcCombatModelArray1[(((this.frameCounter / (GameData.npcCombatModel[npc.typeID]) | 0) - 1)) & 7];
		} else if (npc.animationCurrent === 9) {
			i2 = 5;
			l1 = 2;
			flag = true;
			x += (GameData.npcCombatAnimation[npc.typeID] * ty) / 100 | 0;
			j2 = i2 * 3 + this.npcCombatModelArray2[((this.frameCounter / GameData.npcCombatModel[npc.typeID]) | 0) & 7];
		}

		for (let k2 = 0; k2 < 12; k2++) {
			let l2 = this.npcAnimationArray[l1][k2];
			let k3 = GameData.npcSprite.get(npc.typeID, l2);

			if (k3 >= 0) {
				let i4 = 0;
				let j4 = 0;
				let k4 = j2;

				if (flag && i2 >= 1 && i2 <= 3 && GameData.animationHasF[k3] === 1) {
					k4 += 15;
				}

				if (i2 !== 5 || GameData.animationHasA[k3] === 1) {
					let l4 = k4 + GameData.animationNumber[k3];

					i4 = (i4 * w) / this.surface.spriteWidthFull[l4] | 0;
					j4 = (j4 * h) / this.surface.spriteHeightFull[l4] | 0;

					let i5 = (w * this.surface.spriteWidthFull[l4]) / this.surface.spriteWidthFull[GameData.animationNumber[k3]] | 0;

					i4 -= (i5 - w) / 2 | 0;

					let col = GameData.animationCharacterColour[k3];
					let skincol = 0;

					if (col === 1) {
						col = GameData.npcColourHair[npc.typeID];
						skincol = GameData.npcColourSkin[npc.typeID];
					} else if (col === 2) {
						col = GameData.npcColourTop[npc.typeID];
						skincol = GameData.npcColourSkin[npc.typeID];
					} else if (col === 3) {
						col = GameData.npcColorBottom[npc.typeID];
						skincol = GameData.npcColourSkin[npc.typeID];
					}

					this.surface._spriteClipping_from9(x + i4, y + j4, i5, h, l4, col, skincol, tx, flag);
				}
			}
		}

		if (npc.messageTimeout > 0) {
			this.receivedMessageMidPoint[this.receivedMessagesCount] = this.surface.textWidth(npc.message, 1) / 2 | 0;

			if (this.receivedMessageMidPoint[this.receivedMessagesCount] > secondsToFrames(3)) {
				this.receivedMessageMidPoint[this.receivedMessagesCount] = secondsToFrames(3);
			}

			this.receivedMessageHeight[this.receivedMessagesCount] = Math.floor(this.surface.textWidth(npc.message, 1) / 300) * this.surface.textHeight(1);
			this.receivedMessageX[this.receivedMessagesCount] = x + Math.floor(w / 2);
			this.receivedMessageY[this.receivedMessagesCount] = y;
			this.receivedMessages[this.receivedMessagesCount++] = npc.message;
		}

		if (npc.isFighting() || npc.healthTimer.tickThreshold > 0) {
			if (npc.healthTimer.tickThreshold > 0) {
				let relX = x;

				// left melee fighter
				if (npc.animationCurrent === 8)
					relX -= (20 * ty) / 100 | 0;
				// right melee fighter
				else if (npc.animationCurrent === 9)
					relX += (20 * ty) / 100 | 0;

				this.healthBarX[this.healthBarCount] = relX + ((w / 2) | 0);
				this.healthBarY[this.healthBarCount] = y;
				this.healthBarMissing[this.healthBarCount++] = Math.floor((npc.healthCurrent * 30) / npc.healthMax);

				if (npc.healthTimer.tickCount < secondsToFrames(3)) {
					let relX = x;

					if (npc.animationCurrent === 8)
						relX -= (10 * ty) / 100 | 0;
					else if (npc.animationCurrent === 9)
						relX += (10 * ty) / 100 | 0;

					// hit splat sprite
					this.surface.drawSpriteID(Math.floor(w / 2) + relX - 12, Math.floor(h / 2) + y - 12, mudclient.spriteMedia + 12);
					this.surface.drawStringCenter(npc.damageTaken.toString(), Math.floor(w / 2) + relX - 1, Math.floor(h / 2) + y + 5, 3, 0xFFFFFF);
				}
			}
		}
	}

	walkToWallObject(i, j, k) {
		if (k === 0) {
			this.walkTo(this.localRegionX, this.localRegionY, i, j - 1, i, j, false, true);
			return;
		}
		if (k === 1) {
			this.walkTo(this.localRegionX, this.localRegionY, i - 1, j, i, j, false, true);
			return;
		}

		this.walkTo(this.localRegionX, this.localRegionY, i, j, i, j, true, true);
	}

	async fetchDefinitions() {
		let buff = await this.readDataFile('config' + VERSION.CONFIG + '.jag', 'Entity Information', 10);
		if (!buff) {
			this.exception = new GameException(e, true);
			return;
		}

		GameData.loadDefinitions(buff, this.members);
	}

	async fetchChatFilters() {
		let buff = await this.readDataFile('filter' + VERSION.FILTER + '.jag', 'Chat filters', 15);
		if (!buff) {
			this.runtimeException = new GameException("Error loading chat system!\n\n" + e.message, true);
			return;
		}
		this.chatSystem = new Chat(buff);
	}

	addNpc(serverIndex, x, y, sprite, type) {
		if (!this.npcsServer[serverIndex]) {
			this.npcsServer[serverIndex] = new GameCharacter();
			this.npcsServer[serverIndex].serverIndex = serverIndex;
		}

		let npc = this.npcsServer[serverIndex];
		let exists = false;

		for (let i = 0; i < this.npcCacheCount; i++) {
			if (this.npcsCache[i] && this.npcsCache[i].serverIndex !== serverIndex) {
				continue;
			}

			exists = true;
			break;
		}

		if (exists) {
			npc.typeID = type;
			npc.animationNext = sprite;
			let waypointIdx = npc.waypointCurrent;
			if (x !== npc.waypointsX[waypointIdx] || y !== npc.waypointsY[waypointIdx]) {
				npc.waypointCurrent = waypointIdx = (waypointIdx+1)%10;
				npc.waypointsX[waypointIdx] = x;
				npc.waypointsY[waypointIdx] = y;
			}
		} else {
			npc.serverIndex = serverIndex;
			npc.targetWaypoint = 0;
			npc.waypointCurrent = 0;
			npc.waypointsX[0] = npc.currentX = x;
			npc.waypointsY[0] = npc.currentY = y;
			npc.typeID = type;
			npc.animationNext = npc.animationCurrent = sprite;
			npc.stepCount = 0;
		}

		this.npcs[this.npcCount++] = npc;
		return npc;
	}

	resetLoginPanels() {
		this.welcomeState = WelcomeStates.WELCOME;
		this.gameState = GameStates.LOGIN;
		this.logoutBoxFrames = 0;
		this.systemUpdate = 0;
	}

	renderBank() {
		let dialogWidth = 408;
		let dialogHeight = 334;

		for (let page = 0; page < 3; page++)
			if (this.bankActivePage > page && this.bankItemCount <= (page+1)*48)
				this.bankActivePage = page;

		if (this.bankSelectedItemSlot >= this.bankItemCount || this.bankSelectedItemSlot < 0)
			this.bankSelectedItemSlot = -1;

		if (this.bankSelectedItemSlot !== -1 && this.bankItems[this.bankSelectedItemSlot] !== this.bankSelectedItem) {
			this.bankSelectedItemSlot = -1;
			this.bankSelectedItem = -2;
		}

		let x = Math.floor(this.gameWidth / 2) - Math.floor(dialogWidth / 2);
		let y = Math.floor(this.gameHeight / 2) - Math.floor(dialogHeight / 2);

		this.surface.drawBox(x, y, dialogWidth, 12, 0xC0);
		this.surface.drawBoxAlpha(x, y + 12, dialogWidth, 17, 0x989898, 0xA0);
		this.surface.drawBoxAlpha(x, y + 29, 8, 204, 0x989898, 0xA0);
		this.surface.drawBoxAlpha(x + (dialogWidth-9), y + 29, 9, 204, 0x989898, 0xA0);
		this.surface.drawBoxAlpha(x, y + 233, dialogWidth, 47, 0x989898, 0xA0);
		this.surface.drawString('Bank', x + 1, y + 10, 1, 0xffffff);

		let xOff = 50;

		if (this.bankItemCount > 48) {
			let l2 = 0xffffff;

			if (this.bankActivePage === 0) {
				l2 = 0xff0000;
			} else if (this.mouseX > x + xOff && this.mouseY >= y && this.mouseX < x + xOff + 65 && this.mouseY < y + 12) {
				l2 = 0xffff00;
				if (this.mouseButtonClick !== 0) {
					this.mouseButtonClick = 0;
					this.bankActivePage = 0;
				}
			}

			this.surface.drawString('<page 1>', x + xOff, y + 10, 1, l2);
			xOff += 65;
			l2 = 0xffffff;

			if (this.bankActivePage === 1) {
				l2 = 0xff0000;
			} else if (this.mouseX > x + xOff && this.mouseY >= y && this.mouseX < x + xOff + 65 && this.mouseY < y + 12) {
				l2 = 0xffff00;
				if (this.mouseButtonClick !== 0) {
					this.mouseButtonClick = 0;
					this.bankActivePage = 1;
				}
			}

			this.surface.drawString('<page 2>', x + xOff, y + 10, 1, l2);
			xOff += 65;
		}

		if (this.bankItemCount > 96) {
			let i3 = 0xffffff;
			if (this.bankActivePage === 2) {
				i3 = 0xff0000;
			} else if (this.mouseX > x + xOff && this.mouseY >= y && this.mouseX < x + xOff + 65 && this.mouseY < y + 12) {
				i3 = 0xffff00;
				if (this.mouseButtonClick !== 0) {
					this.mouseButtonClick = 0;
					this.bankActivePage = 2;
				}
			}

			this.surface.drawString('<page 3>', x + xOff, y + 10, 1, i3);
			xOff += 65;
		}

		if (this.bankItemCount > 144) {
			let j3 = 0xffffff;

			if (this.bankActivePage === 3) {
				j3 = 0xff0000;
			} else if (this.mouseX > x + xOff && this.mouseY >= y && this.mouseX < x + xOff + 65 && this.mouseY < y + 12) {
				j3 = 0xffff00;
				if (this.mouseButtonClick !== 0) {
					this.mouseButtonClick = 0;
					this.bankActivePage = 3;
				}
			}

			this.surface.drawString('<page 4>', x + xOff, y + 10, 1, j3);
			xOff += 65;
		}

		let colour = 0xffffff;

		if (this.mouseX > x + 320 && this.mouseY >= y && this.mouseX < x + 408 && this.mouseY < y + 12) {
			colour = 0xff0000;
		}

		let slot = this.bankActivePage * 48;

		for (let row = 0; row < 6; row++) {
			for (let column = 0; column < 8; column++) {
				let startX = x + 7 + column * 49;
				let startY = y + 28 + row * 34;
				// draw bank slot
				this.surface.drawBoxAlpha(startX, startY, 49, 34, this.bankSelectedItemSlot === slot ? 0xFF0000 : 0xD0D0D0, 0xA0);
				// draw bank slot border
				this.surface.drawBoxEdge(startX, startY, 50, 35, 0);

				if (slot < this.bankItemCount && this.bankItems[slot] !== -1) {
					this.surface._spriteClipping_from9(startX, startY, 48, 32, mudclient.spriteItem + GameData.itemPicture[this.bankItems[slot]], GameData.itemMask[this.bankItems[slot]], 0, 0, false);
					this.surface.drawString(this.bankItemsCount[slot].toString(), startX + 1, startY + 10, 1, 65280);
					this.surface.drawStringRight(this.getInventoryCount(this.bankItems[slot]).toString(), startX + 47, startY + 29, 1, 65535);
					let mouseX = this.mouseX - (Math.floor(this.gameWidth / 2) - Math.floor(dialogWidth / 2));
					let mouseY = this.mouseY - (Math.floor(this.gameHeight / 2) - Math.floor(dialogHeight / 2));

					if (this.mouseButtonClick !== 0 && this.dialogItemInput === 0 && mouseX < startX && mouseX > startX-49 && mouseY < startY + 34 && mouseY > startY) {
						this.mouseButtonClick = 0;
						this.bankSelectedItem = this.bankItems[slot];
						this.bankSelectedItemSlot = slot;
					}
				}

				slot++;
			}
		}

		this.surface.drawStringRight('Close window', x + 406, y + 10, 1, colour);

		if (this.mouseButtonClick !== 0 && (this.mouseY < 12 || this.mouseY >= 280 || this.mouseX >= 475)) {
			this.clientStream.queue(Ops.CLOSE_BANK());
			this.bankVisible = false;
			if (this.dialogItemInput === 2 || this.dialogItemInput === 1)
				this.dialogItemInput = 0;
			return;
		}

		this.surface.drawString('Number in bank in green', x + 7, y + 24, 1, 65280);
		this.surface.drawString('Number held in blue', x + 289, y + 24, 1, 65535);

		this.surface.drawLineHoriz(x + 5, y + 256, 398, 0);

		if (this.bankSelectedItemSlot === -1) {
			this.surface.drawStringCenter('Select an object to withdraw or deposit', x + 204, y + 248, 3, 0xffff00);
			return;
		}

		let itemType = 0;

		if (this.bankSelectedItemSlot < 0) {
			itemType = -1;
		} else {
			itemType = this.bankItems[this.bankSelectedItemSlot];
		}

		if (itemType !== -1) {
			let itemCount = this.bankItemsCount[this.bankSelectedItemSlot];

/*
			if (GameData.itemStackable[itemType] === 1 && itemCount > 1) {
				itemCount = 1;
			}
*/

			if (itemCount > 0) {
				this.surface.drawString('Withdraw ' + GameData.itemName[itemType], x + 2, y + 248, 1, 0xffffff);
				colour = 0xffffff;
				let textHeight = 11;
				let textWidth = 30;
				let minY = y + 238;
				let maxY = minY + textHeight;
				let minX = x + 230;
				let maxX = minX + textWidth;

				if (this.dialogItemInput === 0 && this.mouseX >= minX && this.mouseY >= minY && this.mouseX < maxX && this.mouseY <= maxY) {
					colour = 0xff0000;
					if (this.mouseButtonClick === 1 && this.bankSelectedItemSlot >= 0) {
						this.mouseButtonClick = 0;

						let slot = this.bankItems[this.bankSelectedItemSlot];
						this.clientStream.queue(Ops.BANK_ACTION(slot, 1, true));
					}
				}
				this.surface.drawString('One', minX, maxY, 1, colour);
				minX += textWidth;
				maxX += textWidth;

				if (itemCount >= 5) {
					colour = 0xffffff;
					if (this.dialogItemInput === 0 && this.mouseX >= minX && this.mouseY >= minY && this.mouseX < maxX && this.mouseY <= maxY) {
						colour = 0xff0000;
						if (this.mouseButtonClick === 1 && this.bankSelectedItemSlot >= 0) {
							this.mouseButtonClick = 0;

							let slot = this.bankItems[this.bankSelectedItemSlot];
							this.clientStream.queue(Ops.BANK_ACTION(slot, 5, true));
						}
					}
					this.surface.drawString('Five', minX, maxY, 1, colour);
					minX += textWidth;
					maxX += textWidth;

				}

				if (itemCount >= 10) {
					colour = 0xffffff;
					if (this.dialogItemInput === 0 && this.mouseX >= minX && this.mouseY >= minY && this.mouseX < maxX && this.mouseY <= maxY) {
						colour = 0xff0000;
						if (this.mouseButtonClick === 1 && this.bankSelectedItemSlot >= 0) {
							this.mouseButtonClick = 0;

							let slot = this.bankItems[this.bankSelectedItemSlot];
							this.clientStream.queue(Ops.BANK_ACTION(slot, 10, true));
						}
					}
					this.surface.drawString('10', minX, maxY, 1, colour);
					minX += textWidth;
					maxX += textWidth;
				}

				if (itemCount >= 50) {
					colour = 0xffffff;
					if (this.dialogItemInput === 0 && this.mouseX >= minX && this.mouseY >= minY && this.mouseX < maxX && this.mouseY <= maxY) {
						colour = 0xff0000;
						if (this.mouseButtonClick === 1 && this.bankSelectedItemSlot >= 0) {
							this.mouseButtonClick = 0;

							let slot = this.bankItems[this.bankSelectedItemSlot];
							this.clientStream.queue(Ops.BANK_ACTION(slot, 50, true));
						}
					}
					this.surface.drawString('50', minX, maxY, 1, colour);
					minX += textWidth;
					maxX += textWidth;
				}
				colour = 0xffffff;

				if (this.dialogItemInput === 0 && this.mouseX >= minX && this.mouseY >= minY && this.mouseX < maxX && this.mouseY <= maxY) {
					colour = 0xff0000;
					if (this.mouseButtonClick === 1 && this.bankSelectedItemSlot >= 0) {
						this.mouseButtonClick = 0;
						this.dialogItemInput = 1;
					}
				}
				this.surface.drawString('X', minX+2, maxY, 1, colour);
				minX += textWidth;
				maxX += textWidth;

				colour = 0xffffff;

				if (this.dialogItemInput === 0 && this.mouseX >= minX && this.mouseY >= minY && this.mouseX < maxX && this.mouseY <= maxY) {
					colour = 0xff0000;
					if (this.mouseButtonClick === 1 && this.bankSelectedItemSlot >= 0) {
						this.mouseButtonClick = 0;

						let slot = this.bankItems[this.bankSelectedItemSlot];
						this.clientStream.queue(Ops.BANK_ACTION(slot, itemCount, true));
					}
				}
				this.surface.drawString('All', minX, maxY, 1, colour);
				minX += textWidth;
				maxX += textWidth;
			}

			if (this.getInventoryCount(itemType) > 0) {
				this.surface.drawString('Deposit ' + GameData.itemName[itemType], x + 2, y + 273, 1, 0xffffff);
				colour = 0xffffff;
				let textHeight = 11;
				let textWidth = 30;
				let minY = y + 262;
				let maxY = minY + textHeight;
				let minX = x + 230;
				let maxX = minX + textWidth;
				if (this.dialogItemInput === 0 && this.mouseX >= minX && this.mouseY >= minY && this.mouseX < maxX && this.mouseY <= maxY) {
					colour = 0xff0000;
					if (this.mouseButtonClick === 1 && this.bankSelectedItemSlot >= 0) {
						this.mouseButtonClick = 0;

						let slot = this.bankItems[this.bankSelectedItemSlot];
						this.clientStream.queue(Ops.BANK_ACTION(slot, 1, false));
					}
				}
				this.surface.drawString('One', minX, maxY, 1, colour);

				minX += textWidth;
				maxX += textWidth;

				if (this.getInventoryCount(itemType) >= 5) {
					colour = 0xffffff;
					if (this.dialogItemInput === 0 && this.mouseX >= minX && this.mouseY >= minY && this.mouseX < maxX && this.mouseY <= maxY) {
						colour = 0xff0000;
						if (this.mouseButtonClick === 1 && this.bankSelectedItemSlot >= 0) {
							this.mouseButtonClick = 0;

							let slot = this.bankItems[this.bankSelectedItemSlot];
							this.clientStream.queue(Ops.BANK_ACTION(slot, 5, false));
						}
					}
					this.surface.drawString('Five', minX, maxY, 1, colour);
					minX += textWidth;
					maxX += textWidth;
				}

				if (this.getInventoryCount(itemType) >= 10) {
					colour = 0xffffff;
					if (this.dialogItemInput === 0 && this.mouseX >= minX && this.mouseY >= minY && this.mouseX < maxX && this.mouseY <= maxY) {
						colour = 0xff0000;
						if (this.mouseButtonClick === 1 && this.bankSelectedItemSlot >= 0) {
							this.mouseButtonClick = 0;

							let slot = this.bankItems[this.bankSelectedItemSlot];
							this.clientStream.queue(Ops.BANK_ACTION(slot, 10, false));
						}
					}
					this.surface.drawString('10', minX, maxY, 1, colour);
					minX += textWidth;
					maxX += textWidth;
				}

				if (this.getInventoryCount(itemType) >= 50) {
					colour = 0xffffff;
					if (this.dialogItemInput === 0 && this.mouseX >= minX && this.mouseY >= minY && this.mouseX < maxX && this.mouseY <= maxY) {
						colour = 0xff0000;
						if (this.mouseButtonClick === 1 && this.bankSelectedItemSlot >= 0) {
							this.mouseButtonClick = 0;

							let slot = this.bankItems[this.bankSelectedItemSlot];
							this.clientStream.queue(Ops.BANK_ACTION(slot, 50, false));
						}
					}
					this.surface.drawString('50', minX, maxY, 1, colour);
					minX += textWidth;
					maxX += textWidth;
				}

				colour = 0xffffff;
				if (this.dialogItemInput === 0 && this.mouseX >= minX && this.mouseY >= minY && this.mouseX < maxX && this.mouseY <= maxY) {
					colour = 0xff0000;
					if (this.mouseButtonClick === 1 && this.bankSelectedItemSlot >= 0) {
						this.mouseButtonClick = 0;
						this.dialogItemInput = 2;
					}
				}
				this.surface.drawString('X', minX+2, maxY, 1, colour);
				minX += textWidth;
				maxX += textWidth;

				colour = 0xffffff;
				if (this.dialogItemInput === 0 && this.mouseX >= minX && this.mouseY >= minY && this.mouseX < maxX && this.mouseY <= maxY) {
					colour = 0xff0000;
					if (this.mouseButtonClick === 1 && this.bankSelectedItemSlot >= 0) {
						this.mouseButtonClick = 0;

						let slot = this.bankItems[this.bankSelectedItemSlot];
						this.clientStream.queue(Ops.BANK_ACTION(slot, this.getInventoryCount(itemType), false));
					}
				}
				this.surface.drawString('All', minX, maxY, 1, colour);
				minX += textWidth;
				maxX += textWidth;

			}
		}
		if (this.dialogItemInput === 2 || this.dialogItemInput === 1) {
			let y = 145;
			this.surface.drawBox(106, y, 300, 70, 0);
			this.surface.drawBoxEdge(106, y, 300, 70, 0xffffff);
			y += 20;

			let textColor = 0xFFFFFF;
			if (this.mouseX > 236 && this.mouseX < 276 && this.mouseY > 193 && this.mouseY < 213)
				textColor = 0xFFFF00;
			this.surface.drawStringCenter('Cancel', 256, 208, 1, textColor);
			if (this.mouseButtonClick !== 0 && (textColor !== 0xFFFFFF || this.mouseX < 106 || this.mouseY < 145 || this.mouseX > 406 || this.mouseY > 215 ||textColor !== 0xFFFFFF)) {
				this.mouseButtonClick = 0;
				this.dialogItemInput = 0;
				return;
			}


			if (this.dialogItemInput === 1) {
				this.surface.drawStringCenter('Enter amount to withdraw', 256, y, 4, 0xffffff);
			} else if (this.dialogItemInput === 2) {
				this.surface.drawStringCenter('Enter amount to deposit', 256, y, 4, 0xffffff);
			}
			y += 20;
			this.surface.drawStringCenter(this.inputTextCurrent + '*', 256, y, 4, 0xffffff);

			// This gets set by our keyboard event handler when the user presses enter
			if (this.inputTextFinal.length > 0) {
				let text = this.inputTextFinal.trim();
				this.inputTextCurrent = '';
				this.inputTextFinal = '';
				if (text.length <= 0) {
					return;
				}
				let max = this.dialogItemInput === 1 ? this.bankItemsCount[this.bankSelectedItemSlot] : this.getInventoryCount(this.bankItems[this.bankSelectedItemSlot]);
				let amount = Math.max(0, Math.min(max, Number(text)));
				let slot = this.bankItems[this.bankSelectedItemSlot];
				this.clientStream.queue(Ops.BANK_ACTION(slot, amount, this.dialogItemInput === 1));
				this.dialogItemInput = 0;
			}
		}
	}

	renderDuelScreen() {
		if (this.mouseButtonClick !== 0 && this.mouseItemTickDelta === 0) {
			this.mouseItemTickDelta = 1;
		}

		if (this.mouseItemTickDelta > 0) {
			let mouseX = this.mouseX - 22;
			let mouseY = this.mouseY - 36;

			if (mouseX >= 0 && mouseY >= 0 && mouseX < 468 && mouseY < 262) {
				if (mouseX > 216 && mouseY > 30 && mouseX < 462 && mouseY < 235) {
					let slot = ((((mouseX - 217) | 0) / 49) | 0) + (((mouseY - 31) / 34) | 0) * 5;
					if (slot >= 0 && slot < this.inventoryItemsCount) {
						let sendUpdate = false;
						let l1 = 0;
						let item = this.inventoryItemId[slot];

						for (let k3 = 0; k3 < this.duelOfferItemCount; k3++) {
							if (this.duelOfferItemList[k3].id === item) {
								if (GameData.itemStackable[item] === 0) {
									for (let i4 = 0; i4 < this.mouseItemTickDelta; i4++) {
										if (this.duelOfferItemList[k3].amount < this.inventoryItemStackCount[slot]) {
											this.duelOfferItemList[k3].amount += 1;
										}

										sendUpdate = true;
									}
								} else {
									l1++;
								}
							}
						}

						if (this.getInventoryCount(item) <= l1) {
							sendUpdate = true;
						}

						if (GameData.itemSpecial[item] === 1) {
							this.showMessage('This object cannot be added to a duel offer', 3);
							sendUpdate = true;
						}

						if (!sendUpdate && this.duelOfferItemCount < 8) {
							this.duelOfferItemList = append(this.duelOfferItemList, {
								id: item,
								amount: 1,
							})
							this.duelOfferItemCount++;
							// this.duelOfferItemList[this.duelOfferItemCount].id = item;
							// this.duelOfferItemList[this.duelOfferItemCount++].amount = 1;
							sendUpdate = true;
						}

						if (sendUpdate) {
							this.clientStream.newPacket(C_OPCODES.DUEL_ITEM_UPDATE);
							this.clientStream.putByte(this.duelOfferItemCount);

							for (let j4 = 0; j4 < this.duelOfferItemCount; j4++) {
								this.clientStream.putShort(this.duelOfferItemList[j4].id);
								this.clientStream.putInt(this.duelOfferItemList[j4].amount);
							}

							this.clientStream.sendPacket();
							this.duelOfferOpponentAccepted = false;
							this.duelOfferAccepted = false;
						}
					}
				}

				if (mouseX > 8 && mouseY > 30 && mouseX < 205 && mouseY < 129) {
					let slot = (((mouseX - 9) / 49) | 0) + (((mouseY - 31) / 34) | 0) * 4;

					if (slot >= 0 && slot < this.duelOfferItemCount) {
						let j1 = this.duelOfferItemList[slot].id;
						for (let i2 = 0; i2 < this.mouseItemTickDelta; i2++) {
							if (GameData.itemStackable[j1] === 0 && this.duelOfferItemList[slot].amount > 1) {
								this.duelOfferItemList[slot].amount -= 1;
								continue;
							}

							this.duelOfferItemList = remove(this.duelOfferItemList, slot)

							this.duelOfferItemCount -= 1;
							this.mouseButtonDownTime = 0;

//							for (let l2 = slot; l2 < this.duelOfferItemCount; l2++)
//								this.duelOfferItemList[l2] = this.duelOfferItemList[l2 + 1];

							break;
						}

						this.clientStream.newPacket(C_OPCODES.DUEL_ITEM_UPDATE);
						this.clientStream.putByte(this.duelOfferItemCount);

						for (let i3 = 0; i3 < this.duelOfferItemCount; i3++) {
							this.clientStream.putShort(this.duelOfferItemList[i3].id);
							this.clientStream.putInt(this.duelOfferItemList[i3].amount);
						}

						this.clientStream.sendPacket();
						this.duelOfferOpponentAccepted = false;
						this.duelOfferAccepted = false;
					}
				}

				let flag = false;

				if (mouseX >= 93 && mouseY >= 221 && mouseX <= 104 && mouseY <= 232) {
					this.duelSettingsRetreat = !this.duelSettingsRetreat;
					flag = true;
				}

				if (mouseX >= 93 && mouseY >= 240 && mouseX <= 104 && mouseY <= 251) {
					this.duelSettingsMagic = !this.duelSettingsMagic;
					flag = true;
				}

				if (mouseX >= 191 && mouseY >= 221 && mouseX <= 202 && mouseY <= 232) {
					this.duelSettingsPrayer = !this.duelSettingsPrayer;
					flag = true;
				}

				if (mouseX >= 191 && mouseY >= 240 && mouseX <= 202 && mouseY <= 251) {
					this.duelSettingsWeapons = !this.duelSettingsWeapons;
					flag = true;
				}

				if (flag) {
					this.clientStream.newPacket(C_OPCODES.DUEL_SETTINGS);
					this.clientStream.putByte(this.duelSettingsRetreat ? 1 : 0);
					this.clientStream.putByte(this.duelSettingsMagic ? 1 : 0);
					this.clientStream.putByte(this.duelSettingsPrayer ? 1 : 0);
					this.clientStream.putByte(this.duelSettingsWeapons ? 1 : 0);
					this.clientStream.sendPacket();
					this.duelOfferOpponentAccepted = false;
					this.duelOfferAccepted = false;
				}

				if (mouseX >= 217 && mouseY >= 238 && mouseX <= 286 && mouseY <= 259) {
					this.duelOfferAccepted = true;
					// this.clientStream.newPacket(C_OPCODES.DUEL_ACCEPT);
					this.clientStream.queue(Ops.ACCEPT_DUEL_ONE());
				}

				if (mouseX >= 394 && mouseY >= 238 && mouseX < 463 && mouseY < 259) {
					this.duelConfigVisible = false;
					// this.clientStream.newPacket(C_OPCODES.DUEL_DECLINE);
					// this.clientStream.sendPacket();
					this.clientStream.queue(Ops.DECLINE_DUEL());
				}
			} else if (this.mouseButtonClick !== 0) {
				this.duelConfigVisible = false;
				this.clientStream.queue(Ops.DECLINE_DUEL());
				// this.clientStream.newPacket(C_OPCODES.DUEL_DECLINE);
				// this.clientStream.sendPacket();
			}

			this.mouseButtonClick = 0;
			this.mouseItemTickDelta = 0;
		}

		if (!this.duelConfigVisible) {
			return;
		}

		//let dialogX = this.gameWidth / 2 - 468 / 2 + 22;
		//let dialogY = this.gameHeight / 2 - 262 / 2 + 22;
		let dialogX = 22;
		let dialogY = 36;

		this.surface.drawBox(dialogX, dialogY, 468, 12, 0xc90b1d);
		this.surface.drawBoxAlpha(dialogX, dialogY + 12, 468, 18, 0x989898, 160);
		this.surface.drawBoxAlpha(dialogX, dialogY + 30, 8, 248, 0x989898, 160);
		this.surface.drawBoxAlpha(dialogX + 205, dialogY + 30, 11, 248, 0x989898, 160);
		this.surface.drawBoxAlpha(dialogX + 462, dialogY + 30, 6, 248, 0x989898, 160);
		this.surface.drawBoxAlpha(dialogX + 8, dialogY + 99, 197, 24, 0x989898, 160);
		this.surface.drawBoxAlpha(dialogX + 8, dialogY + 192, 197, 23, 0x989898, 160);
		this.surface.drawBoxAlpha(dialogX + 8, dialogY + 258, 197, 20, 0x989898, 160);
		this.surface.drawBoxAlpha(dialogX + 216, dialogY + 235, 246, 43, 0x989898, 160);
		this.surface.drawBoxAlpha(dialogX + 8, dialogY + 30, 197, 69, 0xd0d0d0, 160);
		this.surface.drawBoxAlpha(dialogX + 8, dialogY + 123, 197, 69, 0xd0d0d0, 160);
		this.surface.drawBoxAlpha(dialogX + 8, dialogY + 215, 197, 43, 0xd0d0d0, 160);
		this.surface.drawBoxAlpha(dialogX + 216, dialogY + 30, 246, 205, 0xd0d0d0, 160);

		for (let j2 = 0; j2 < 3; j2++) {
			this.surface.drawLineHoriz(dialogX + 8, dialogY + 30 + j2 * 34, 197, 0);
		}

		for (let j3 = 0; j3 < 3; j3++) {
			this.surface.drawLineHoriz(dialogX + 8, dialogY + 123 + j3 * 34, 197, 0);
		}

		for (let l3 = 0; l3 < 7; l3++) {
			this.surface.drawLineHoriz(dialogX + 216, dialogY + 30 + l3 * 34, 246, 0);
		}

		for (let k4 = 0; k4 < 6; k4++) {
			if (k4 < 5) {
				this.surface.drawLineVert(dialogX + 8 + k4 * 49, dialogY + 30, 69, 0);
			}

			if (k4 < 5) {
				this.surface.drawLineVert(dialogX + 8 + k4 * 49, dialogY + 123, 69, 0);
			}

			this.surface.drawLineVert(dialogX + 216 + k4 * 49, dialogY + 30, 205, 0);
		}

		this.surface.drawLineHoriz(dialogX + 8, dialogY + 215, 197, 0);
		this.surface.drawLineHoriz(dialogX + 8, dialogY + 257, 197, 0);
		this.surface.drawLineVert(dialogX + 8, dialogY + 215, 43, 0);
		this.surface.drawLineVert(dialogX + 204, dialogY + 215, 43, 0);
		this.surface.drawString('Preparing to duel with: ' + this.duelOpponentName, dialogX + 1, dialogY + 10, 1, 0xffffff);
		this.surface.drawString('Your Stake', dialogX + 9, dialogY + 27, 4, 0xffffff);
		this.surface.drawString('Opponent\'s Stake', dialogX + 9, dialogY + 120, 4, 0xffffff);
		this.surface.drawString('Duel Options', dialogX + 9, dialogY + 212, 4, 0xffffff);
		this.surface.drawString('Your Inventory', dialogX + 216, dialogY + 27, 4, 0xffffff);
		this.surface.drawString('No retreating', dialogX + 8 + 1, dialogY + 215 + 16, 3, 0xffff00);
		this.surface.drawString('No magic', dialogX + 8 + 1, dialogY + 215 + 35, 3, 0xffff00);
		this.surface.drawString('No prayer', dialogX + 8 + 102, dialogY + 215 + 16, 3, 0xffff00);
		this.surface.drawString('No weapons', dialogX + 8 + 102, dialogY + 215 + 35, 3, 0xffff00);
		this.surface.drawBoxEdge(dialogX + 93, dialogY + 215 + 6, 11, 11, 0xffff00);

		if (this.duelSettingsRetreat) {
			this.surface.drawBox(dialogX + 95, dialogY + 215 + 8, 7, 7, 0xffff00);
		}

		this.surface.drawBoxEdge(dialogX + 93, dialogY + 215 + 25, 11, 11, 0xffff00);

		if (this.duelSettingsMagic) {
			this.surface.drawBox(dialogX + 95, dialogY + 215 + 27, 7, 7, 0xffff00);
		}

		this.surface.drawBoxEdge(dialogX + 191, dialogY + 215 + 6, 11, 11, 0xffff00);

		if (this.duelSettingsPrayer) {
			this.surface.drawBox(dialogX + 193, dialogY + 215 + 8, 7, 7, 0xffff00);
		}

		this.surface.drawBoxEdge(dialogX + 191, dialogY + 215 + 25, 11, 11, 0xffff00);

		if (this.duelSettingsWeapons) {
			this.surface.drawBox(dialogX + 193, dialogY + 215 + 27, 7, 7, 0xffff00);
		}

		if (!this.duelOfferAccepted) {
			this.surface.drawSpriteID(dialogX + 217, dialogY + 238, mudclient.spriteMedia + 25);
		}

		this.surface.drawSpriteID(dialogX + 394, dialogY + 238, mudclient.spriteMedia + 26);

		if (this.duelOfferOpponentAccepted) {
			this.surface.drawStringCenter('Other player', dialogX + 341, dialogY + 246, 1, 0xffffff);
			this.surface.drawStringCenter('has accepted', dialogX + 341, dialogY + 256, 1, 0xffffff);
		}

		if (this.duelOfferAccepted) {
			this.surface.drawStringCenter('Waiting for', dialogX + 217 + 35, dialogY + 246, 1, 0xffffff);
			this.surface.drawStringCenter('other player', dialogX + 217 + 35, dialogY + 256, 1, 0xffffff);
		}

		for (let i = 0; i < this.inventoryItemsCount; i++) {
			let x = 217 + dialogX + (i % 5) * 49;
			let y = 31 + dialogY + ((i / 5) | 0) * 34;
			this.surface._spriteClipping_from9(x, y, 48, 32, mudclient.spriteItem + GameData.itemPicture[this.inventoryItemId[i]], GameData.itemMask[this.inventoryItemId[i]], 0, 0, false);

			if (GameData.itemStackable[this.inventoryItemId[i]] === 0) {
				this.surface.drawString(this.inventoryItemStackCount[i].toString(), x + 1, y + 10, 1, 0xffff00);
			}
		}

		for (let i = 0; i < this.duelOfferItemCount; i++) {
			let x = 9 + dialogX + (i & 3) * 49;
			let y = 31 + dialogY + ((i / 4) | 0) * 34;

			this.surface._spriteClipping_from9(x, y, 48, 32, mudclient.spriteItem + GameData.itemPicture[this.duelOfferItemList[i].id], GameData.itemMask[this.duelOfferItemList[i].id], 0, 0, false);

			if (GameData.itemStackable[this.duelOfferItemList[i].id] === 0) {
				this.surface.drawString(this.duelOfferItemList[i].amount.toString(), x + 1, y + 10, 1, 0xffff00);
			}

			if (this.mouseX > x && this.mouseX < x + 48 && this.mouseY > y && this.mouseY < y + 32) {
				this.surface.drawString(GameData.itemName[this.duelOfferItemList[i].id] + ': @whi@' + GameData.itemDescription[this.duelOfferItemList[i].id], dialogX + 8, dialogY + 273, 1, 0xffff00);
			}
		}

		for (let i = 0; i < this.duelOfferOpponentItemCount; i++) {
			let x = 9 + dialogX + (i & 3) * 49;
			let y = 124 + dialogY + ((i / 4) | 0) * 34;

			this.surface._spriteClipping_from9(x, y, 48, 32, mudclient.spriteItem + GameData.itemPicture[this.duelOfferOpponentItemList[i].id], GameData.itemMask[this.duelOfferOpponentItemList[i].id], 0, 0, false);

				if (GameData.itemStackable[this.duelOfferOpponentItemList[i].id] === 0) {
				this.surface.drawString(this.duelOfferOpponentItemList[i].amount.toString(), x + 1, y + 10, 1, 0xffff00);
			}

			if (this.mouseX > x && this.mouseX < x + 48 && this.mouseY > y && this.mouseY < y + 32) {
				this.surface.drawString(GameData.itemName[this.duelOfferOpponentItemList[i].id] + ': @whi@' + GameData.itemDescription[this.duelOfferOpponentItemList[i].id], dialogX + 8, dialogY + 273, 1, 0xffff00);
			}
		}
	}

	loadNextRegion(lx, ly) {
        if (this.deathScreenTimeout !== 0) {
            this.world.playerAlive = false;
            return false;
        }

        this.loadingArea = false;
        lx += this.planeWidth;
        ly += this.planeHeight;

        if (this.lastHeightOffset === this.planeIndex && lx > this.localLowerX && lx < this.localUpperX && ly > this.localLowerY && ly < this.localUpperY) {
            this.world.playerAlive = true;
            return false;
        }

        this.surface.drawStringCenter('Loading... Please wait', 256, 192, 1, 0xffffff);
        this.drawChatMessageTabs();
        this.surface.draw(this.graphics, 0, 0);

        let ax = this.regionX;
        let ay = this.regionY;
        let sectionX = ((lx + 24) / 48) | 0;
        let sectionY = ((ly + 24) / 48) | 0;

        this.lastHeightOffset = this.planeIndex;
        this.regionX = sectionX * 48 - 48;
        this.regionY = sectionY * 48 - 48;
        this.localLowerX = sectionX * 48 - 32;
        this.localLowerY = sectionY * 48 - 32;
        this.localUpperX = sectionX * 48 + 32;
        this.localUpperY = sectionY * 48 + 32;

        this.world._loadSection_from3(lx, ly, this.lastHeightOffset);

        this.regionX -= this.planeWidth;
        this.regionY -= this.planeHeight;

        let offsetX = this.regionX - ax;
        let offsetY = this.regionY - ay;
		for (let objIdx = 0; objIdx < this.objectCount; objIdx++) {
			try {
				this.objectX[objIdx] -= offsetX;
				this.objectY[objIdx] -= offsetY;
				let objx = this.objectX[objIdx];
				let objy = this.objectY[objIdx];
				let objid = this.objectId[objIdx];
				let objDir = this.objectDirection[objIdx];
				let objW = (objDir === 0 || objDir === 4) ? GameData.objectWidth[objid] : GameData.objectHeight[objid];
				let objH = (objDir === 0 || objDir === 4) ? GameData.objectHeight[objid] : GameData.objectWidth[objid];
				// let objW = GameData.objectWidth[objid];
				// let objH = GameData.objectHeight[objid];

				// if (objType === 0 || objType === 4) {
					// objW = GameData.objectWidth[objid];
					// objH = GameData.objectHeight[objid];
				// } else {
					// objH = GameData.objectWidth[objid];
					// objW = GameData.objectHeight[objid];
				// }

				let objMeshX = Math.floor(((objx + objx + objW) * this.tileSize) / 2);
				let objMeshY = Math.floor(((objy + objy + objH) * this.tileSize) / 2);

				if (objx >= 0 && objy >= 0 && objx < 96 && objy < 96) {
					let gameModel = this.objectModel[objIdx];
					this.scene.addModel(gameModel);
					gameModel.place(objMeshX, -this.world.getElevation(objMeshX, objMeshY), objMeshY);
					this.world.removeObject2(objx, objy, objid);

					// windmill gets translated to appear high in the air
					if (objid === WINDMILL)
						gameModel.translate(0, -480, 0);
				}
			} catch (e) {
				console.log('Scenary Error: ' + e.message);
				console.error(e);
			}
		}

		for (let k2 = 0; k2 < this.wallObjectCount; k2++) {
			try {
				this.wallObjectX[k2] -= offsetX;
				this.wallObjectY[k2] -= offsetY;

				let i3 = this.wallObjectX[k2];
				let l3 = this.wallObjectY[k2];
				let j4 = this.wallObjectId[k2];
				let i5 = this.wallObjectDirection[k2];
				this.world._setObjectAdjacency_from4(i3, l3, i5, j4);
				this.wallObjectModel[k2] = this.createBoundaryModel(i3, l3, i5, j4, k2);
			} catch (e) {
				console.log('Boundary Error: ' + e.message);
				console.error(e);
			}
		}

		for (let j3 = 0; j3 < this.groundItemCount; j3++) {
			this.groundItemX[j3] -= offsetX;
			this.groundItemY[j3] -= offsetY;
		}

		for (let i4 = 0; i4 < this.playerCount; i4++) {
			let player = this.players[i4];
			player.currentX -= offsetX * this.tileSize;
			player.currentY -= offsetY * this.tileSize;

			for (let idx = 0; idx <= player.waypointCurrent; idx++) {
				player.waypointsX[idx] -= offsetX * this.tileSize;
				player.waypointsY[idx] -= offsetY * this.tileSize;
			}
		}

		for (let k4 = 0; k4 < this.npcCount; k4++) {
			let npc = this.npcs[k4];
			npc.currentX -= offsetX * this.tileSize;
			npc.currentY -= offsetY * this.tileSize;

			for (let idx = 0; idx <= npc.waypointCurrent; idx++) {
				npc.waypointsX[idx] -= offsetX * this.tileSize;
				npc.waypointsY[idx] -= offsetY * this.tileSize;
			}
		}

		this.world.playerAlive = true;
		return true;
	}

	drawPlayer(x, y, w, h, id, tx, ty) {
		let player = this.players[id];

		// this means the character is invisible! MOD!!!
		// EDIT: More likely this is not a mod thing but actually to prevent the rendering
		// of players that have yet to create their avatar, and thus possess a bottom color
		// of -1, which when represented as a uint8, becomes 0xFF
		if (player.colourBottom === 0xFF)
			return;

		let l1 = player.animationCurrent + ((this.cameraRotation + 16) >>> 5) & 7;
		let flag = false;
		let i2 = l1;

		if (i2 === 5) {
			i2 = 3;
			flag = true;
		} else if (i2 === 6) {
			i2 = 2;
			flag = true;
		} else if (i2 === 7) {
			i2 = 1;
			flag = true;
		}

		let j2 = i2 * 3 + this.npcWalkModel[Math.floor(player.stepCount / 6) & 3];

		if (player.animationCurrent === 8) {
			i2 = 5;
			l1 = 2;
			flag = false;
			x -= Math.floor((5 * ty) / 100);
			j2 = i2 * 3 + this.npcCombatModelArray1[Math.floor(this.frameCounter / 5) & 7];
		} else if (player.animationCurrent === 9) {
			i2 = 5;
			l1 = 2;
			flag = true;
			x += Math.floor((5 * ty) / 100);
			j2 = i2 * 3 + this.npcCombatModelArray2[Math.floor(this.frameCounter / 6) & 7];
		}

		for (let k2 = 0; k2 < 12; k2++) {
			let l2 = this.npcAnimationArray[l1][k2];
			let l3 = player.equippedItem[l2] - 1;

			if (l3 >= 0) {
				let k4 = 0;
				let i5 = 0;
				let j5 = j2;

				if (flag && i2 >= 1 && i2 <= 3) {
					if (GameData.animationHasF[l3] === 1) {
						j5 += 15;
					} else if (l2 === 4 && i2 === 1) {
						k4 = -22;
						i5 = -3;
						j5 = i2 * 3 + this.npcWalkModel[(2 + Math.floor(player.stepCount / 6)) & 3];
					} else if (l2 === 4 && i2 === 2) {
						k4 = 0;
						i5 = -8;
						j5 = i2 * 3 + this.npcWalkModel[(2 + Math.floor(player.stepCount / 6)) & 3];
					} else if (l2 === 4 && i2 === 3) {
						k4 = 26;
						i5 = -5;
						j5 = i2 * 3 + this.npcWalkModel[(2 + Math.floor(player.stepCount / 6)) & 3];
					} else if (l2 === 3 && i2 === 1) {
						k4 = 22;
						i5 = 3;
						j5 = i2 * 3 + this.npcWalkModel[(2 + Math.floor(player.stepCount / 6)) & 3];
					} else if (l2 === 3 && i2 === 2) {
						k4 = 0;
						i5 = 8;
						j5 = i2 * 3 + this.npcWalkModel[(2 + Math.floor(player.stepCount / 6)) & 3];
					} else if (l2 === 3 && i2 === 3) {
						k4 = -26;
						i5 = 5;
						j5 = i2 * 3 + this.npcWalkModel[(2 + Math.floor(player.stepCount / 6)) & 3];
					}
				}

				if (i2 !== 5 || GameData.animationHasA[l3] === 1) {
					let k5 = j5 + GameData.animationNumber[l3];

					k4 = Math.floor((k4 * w) / this.surface.spriteWidthFull[k5]);
					i5 = Math.floor((i5 * h) / this.surface.spriteHeightFull[k5]);

					let l5 = Math.floor((w * this.surface.spriteWidthFull[k5]) / this.surface.spriteWidthFull[GameData.animationNumber[l3]]);

					k4 -= ((l5 - w) >>> 1);

					let i6 = GameData.animationCharacterColour[l3];
					let j6 = this.characterSkinColours[player.colourSkin];

					if (i6 === 1) {
						i6 = this.characterHairColours[player.colourHair];
					} else if (i6 >= 2 && i6 <= 3) {
						i6 = this.characterTopBottomColours[i6 === 2 ? player.colourTop : player.colourBottom];
					}

					this.surface._spriteClipping_from9(x + k4, y + i5, l5, h, k5, i6, j6, tx, flag);
				}
			}
		}

		if (player.messageTimeout > 0) {
			this.receivedMessageMidPoint[this.receivedMessagesCount] = Math.floor(this.surface.textWidth(player.message, 1) / 2);

			if (this.receivedMessageMidPoint[this.receivedMessagesCount] > secondsToFrames(3))
				this.receivedMessageMidPoint[this.receivedMessagesCount] = secondsToFrames(3);

			this.receivedMessageHeight[this.receivedMessagesCount] = Math.floor(this.surface.textWidth(player.message, 1) / 300) * this.surface.textHeight(1);
			this.receivedMessageX[this.receivedMessagesCount] = x + (w >>> 1);
			this.receivedMessageY[this.receivedMessagesCount] = y;
			this.receivedMessages[this.receivedMessagesCount++] = player.message;
		}

		if (player.bubble) {
			let scaleX = Math.floor((39 * ty) / 100);
			let scaleY = Math.floor((27 * ty) / 100);
			this.surface.drawActionBubble(x + (w>>>1) - (scaleX >>> 1), y - scaleY, scaleX, scaleY, mudclient.spriteMedia + 9, 85);
			let scaleXItem = Math.floor((36 * ty) / 100);
			let scaleYItem = Math.floor((24 * ty) / 100);
			this.surface._spriteClipping_from9(x + (w >>> 1) - (scaleXItem >>> 1), y - scaleY + (scaleY >>> 1) - (scaleYItem >>> 1), scaleXItem, scaleYItem, mudclient.spriteItem + GameData.itemPicture[player.bubble.id], GameData.itemMask[player.bubble.id], 0, 0, false);
		}

		// if (player.bubbleTimeout > 0) {
			// this.actionBubbleX[this.itemsAboveHeadCount] = x + Math.floor(w / 2);
			// this.actionBubbleY[this.itemsAboveHeadCount] = y;
			// this.actionBubbleScale[this.itemsAboveHeadCount] = ty;
			// this.actionBubbleItem[this.itemsAboveHeadCount++] = player.bubbleItem;
		// }

		if (player.isFighting() || player.healthTimer.tickThreshold > 0) {
			if (player.healthTimer.tickThreshold > 0) {
				// TODO: Wrong, really Y??
				let healthX = x;
				if (player.animationCurrent === 8) {
					healthX -= Math.floor((20 * ty) / 100);
				} else if (player.animationCurrent === 9) {
					healthX += Math.floor((20 * ty) / 100);
				}

				this.healthBarX[this.healthBarCount] = healthX + (w>>>1);
				this.healthBarY[this.healthBarCount] = y;
				this.healthBarMissing[this.healthBarCount++] = Math.floor((player.healthCurrent * 30) / player.healthMax);

				if (player.healthTimer.tickCount < secondsToFrames(3)) {
					// TODO: Wrong, really Y
					let splatX = x;
					if (player.animationCurrent === 8) {
						splatX -= Math.floor((10 * ty) / 100);
					} else if (player.animationCurrent === 9) {
						splatX += Math.floor((10 * ty) / 100);
					}

					this.surface.drawSpriteID(splatX + (w>>>1) - 12, y + (h>>>1) - 12, mudclient.spriteMedia + 11);
					this.surface.drawStringCenter(player.damageTaken.toString(), (splatX + (w>>>1)) - 1, y + (h>>>1) + 5, 3, 0xFFFFFF);
				}
			}
		}

		if (player.skullVisible === 1 && !player.bubble) {
			// TODO: Wrong, really Y
			let skullX = tx + x + (w>>>1);

			if (player.animationCurrent === 8) {
				skullX -= Math.floor((20 * ty) / 100);
			} else if (player.animationCurrent === 9) {
				skullX += Math.floor((20 * ty) / 100);
			}

			let j4 = Math.floor((16 * ty) / 100);
//			let l4 = (16 * ty) / 100 | 0;
			let length = Math.floor((16 * ty) / 100);
			let middle = length>>>1;
			this.surface._spriteClipping_from5(skullX - middle, y - middle - Math.floor(length/2.5), length, length, mudclient.spriteMedia + 13);
		}
	}

	async loadMedia() {
		let media = await this.readDataFile('media' + VERSION.MEDIA + '.jag', '2d graphics', 20);

		if (!media) {
			this.runtimeException = new GameException("Error loading media sprites!\n\n" + e.message, true);
			return;
		}

		let buff = Utility.loadData('index.dat', 0, media);

		this.surface.parseSprite(mudclient.spriteMedia, Utility.loadData('inv1.dat', 0, media), buff, 1);
		this.surface.parseSprite(mudclient.spriteMedia + 1, Utility.loadData('inv2.dat', 0, media), buff, 6);
		this.surface.parseSprite(mudclient.spriteMedia + 9, Utility.loadData('bubble.dat', 0, media), buff, 1);
		this.surface.parseSprite(mudclient.spriteMedia + 10, Utility.loadData('runescape.dat', 0, media), buff, 1);
		this.surface.parseSprite(mudclient.spriteMedia + 11, Utility.loadData('splat.dat', 0, media), buff, 3);
		this.surface.parseSprite(mudclient.spriteMedia + 14, Utility.loadData('icon.dat', 0, media), buff, 8);
		this.surface.parseSprite(mudclient.spriteMedia + 22, Utility.loadData('hbar.dat', 0, media), buff, 1);
		this.surface.parseSprite(mudclient.spriteMedia + 23, Utility.loadData('hbar2.dat', 0, media), buff, 1);
		this.surface.parseSprite(mudclient.spriteMedia + 24, Utility.loadData('compass.dat', 0, media), buff, 1);
		this.surface.parseSprite(mudclient.spriteMedia + 25, Utility.loadData('buttons.dat', 0, media), buff, 2);
		this.surface.parseSprite(mudclient.spriteUtil, Utility.loadData('scrollbar.dat', 0, media), buff, 2);
		this.surface.parseSprite(mudclient.spriteUtil + 2, Utility.loadData('corners.dat', 0, media), buff, 4);
		this.surface.parseSprite(mudclient.spriteUtil + 6, Utility.loadData('arrows.dat', 0, media), buff, 2);
		this.surface.parseSprite(mudclient.spriteProjectile, Utility.loadData('projectile.dat', 0, media), buff, GameData.projectileSprite);

		let i = GameData.itemSpriteCount;

		for (let j = 1; i > 0; j++) {
			let k = Math.min(30, i);
			i -= 30;

			this.surface.parseSprite(mudclient.spriteItem + (j - 1) * 30, Utility.loadData('objects' + j + '.dat', 0, media), buff, k);
		}

		this.surface.loadSprite(mudclient.spriteMedia);
		this.surface.loadSprite(mudclient.spriteMedia + 9);

		for (let l = 11; l <= 26; l++) {
			this.surface.loadSprite(mudclient.spriteMedia + l);
		}

		for (let i1 = 0; i1 < GameData.projectileSprite; i1++) {
			this.surface.loadSprite(mudclient.spriteProjectile + i1);
		}

		for (let j1 = 0; j1 < GameData.itemSpriteCount; j1++) {
			this.surface.loadSprite(mudclient.spriteItem + j1);
		}
	}

	drawChatMessageTabs() {
		this.surface.drawSpriteID(0, this.gameHeight - 4, mudclient.spriteMedia + 23);

		this.surface.drawStringCenter('All messages', 54, this.gameHeight + 6, 0, this.messageTabFlashAll % 30 > 15 ? 0xFF3232 : (this.messageTabSelected === 0 ? 0xFFC832 : 0xC8C8FF));
		this.surface.drawStringCenter('Chat history', 155, this.gameHeight + 6, 0, this.messageTabFlashHistory % 30 > 15 ? 0xFF3232 : (this.messageTabSelected === 1 ? 0xFFC832 : 0xC8C8FF));
		this.surface.drawStringCenter('Quest history', 255, this.gameHeight + 6, 0, this.messageTabFlashQuest % 30 > 15 ? 0xFF3232 : (this.messageTabSelected === 2 ? 0xFFC832 : 0xC8C8FF));
		this.surface.drawStringCenter('Private history', 355, this.gameHeight + 6, 0, this.messageTabFlashPrivate % 30 > 15 ? 0xFF3232 : (this.messageTabSelected === 3 ? 0xFFC832 : 0xC8C8FF));
		this.surface.drawStringCenter('Report abuse', 457, this.gameHeight + 6, 0, 0xFFFFFF);
	}

	async startGame() {
		this.port = this.port || 43594;

		await this.fetchDefinitions();
		await this.fetchChatFilters();

		if (this.runtimeException)
			return;

		this.surface = new SurfaceSprite(this.gameWidth, this.gameHeight + 12, 4000, this);
		this.surface.mudclientref = this;
		this.surface.setBounds(0, 0, this.gameWidth, this.gameHeight + 12);

		Panel.drawBackgroundArrow = false;
		Panel.spriteStart = mudclient.spriteUtil;

		this.panelMagic = new Panel(this.surface, 5);

		let x = this.surface.width2 - 199;
		let y = 36;

		this.controlListMagic = this.panelMagic.addTextListInteractive(x, y + 24, 196, 90, 1, 500, true);
		this.panelSocialList = new Panel(this.surface, 5);
		this.controlListSocialPlayers = this.panelSocialList.addTextListInteractive(x, y + 40, 196, 126, 1, 500, true);
		this.panelQuestList = new Panel(this.surface, 5);
		this.controlListQuest = this.panelQuestList.addTextListInteractive(x, y + 24, 196, 251, 1, 500, true);

		await this.loadMedia();
		if (this.runtimeException)
			return;

		await this.loadEntities();
		if (this.runtimeException)
			return;

		this.scene = new Scene(this.surface, 15000, 15000, 1000);
		// this used to be in scene's constructor
		this.scene.view = GameModel._from2(1000 * 1000, 10000);
		this.scene.setBounds(Math.floor(this.gameWidth / 2), Math.floor(this.gameHeight / 2), Math.floor(this.gameWidth / 2), Math.floor(this.gameHeight / 2), this.gameWidth, 9);
		this.scene.clipFar3d = 2400;
		this.scene.clipFar2d = 2400;
		this.scene.fogZFalloff = 1;
		this.scene.fogZDistance = 2300;
		this.scene.setLightSourceCoords(-50, -10, -50);

		Ops.MC = this;

		this.world = new World(this.scene, this.surface);
		this.world.baseMediaSprite = mudclient.spriteMedia;

		await this.loadTextures();
		if (this.runtimeException)
			return;

		await this.loadModels();
		if (this.runtimeException)
			return;

		await this.loadMaps();
		if (this.runtimeException)
			return;

		await this.loadSounds();
		if (this.runtimeException)
			return;

		this.updateLoadingStatus(95, 'Creating interfaces...');
		this.createMessageTabPanel();
		this.createLoginPanels();
		this.createAppearancePanel();

		this.updateLoadingStatus(100, 'Starting game...');
		this.setTargetFps(50);
		this.resetGameState();
		this.renderLoginScreenViewports();
	}

	renderMagicTab(nomenus) {
		let uiX = this.surface.width2 - 199;
		let uiY = 36;
		this.surface.drawSpriteID(uiX - 49, 3, mudclient.spriteMedia + 4);
		let uiWidth = 196;
		let uiHeight = 182;
		let l = 0;
		let k = l = Surface.rgbToLong(160, 160, 160);

		if (this.tabMagicPrayer === 0) {
			k = Surface.rgbToLong(220, 220, 220);
		} else {
			l = Surface.rgbToLong(220, 220, 220);
		}

		this.surface.drawBoxAlpha(uiX, uiY, uiWidth / 2 | 0, 24, k, 128);
		this.surface.drawBoxAlpha(uiX + ((uiWidth / 2) | 0), uiY, uiWidth / 2 | 0, 24, l, 128);
		this.surface.drawBoxAlpha(uiX, uiY + 24, uiWidth, 90, Surface.rgbToLong(220, 220, 220), 128);
		this.surface.drawBoxAlpha(uiX, uiY + 24 + 90, uiWidth, uiHeight - 90 - 24, Surface.rgbToLong(160, 160, 160), 128);
		this.surface.drawLineHoriz(uiX, uiY + 24, uiWidth, 0);
		this.surface.drawLineVert(uiX + ((uiWidth / 2) | 0), uiY, 24, 0);
		this.surface.drawLineHoriz(uiX, uiY + 113, uiWidth, 0);
		this.surface.drawStringCenter('Magic', uiX + ((uiWidth / 4) | 0), uiY + 16, 4, 0);
		this.surface.drawStringCenter('Prayers', uiX + ((uiWidth / 4) | 0) + ((uiWidth / 2) | 0), uiY + 16, 4, 0);

		if (this.tabMagicPrayer === 0) {
			this.panelMagic.clearList(this.controlListMagic);

			let i1 = 0;

			for (let spell = 0; spell < GameData.spellCount; spell++) {
				let s = '@yel@';

				for (let rune = 0; rune < GameData.spellRunesRequired[spell]; rune++) {
					let k4 = GameData.spellRunesId[spell][rune];

					if (this.hasInventoryItems(k4, GameData.spellRunesCount[spell][rune])) {
						continue;
					}

					s = '@whi@';
					break;
				}

				let l4 = this.playerStatCurrent[6];

				if (GameData.spellLevel[spell] > l4) {
					s = '@bla@';
				}

				this.panelMagic.addListEntry(this.controlListMagic, i1++, s + 'Level ' + GameData.spellLevel[spell] + ': ' + GameData.spellName[spell]);
			}

			this.panelMagic.render();

			let i3 = this.panelMagic.getListEntryIndex(this.controlListMagic);

			if (i3 !== -1) {
				this.surface.drawString('Level ' + GameData.spellLevel[i3] + ': ' + GameData.spellName[i3], uiX + 2, uiY + 124, 1, 0xffff00);
				this.surface.drawString(GameData.spellDescription[i3], uiX + 2, uiY + 136, 0, 0xffffff);

				for (let i4 = 0; i4 < GameData.spellRunesRequired[i3]; i4++) {
					let i5 = GameData.spellRunesId[i3][i4];
					this.surface.drawSpriteID(uiX + 2 + i4 * 44, uiY + 150, mudclient.spriteItem + GameData.itemPicture[i5]);
					let j5 = this.getInventoryCount(i5);
					let k5 = GameData.spellRunesCount[i3][i4];
					let s2 = '@red@';

					if (this.hasInventoryItems(i5, k5)) {
						s2 = '@gre@';
					}

					this.surface.drawString(s2 + j5 + '/' + k5, uiX + 2 + i4 * 44, uiY + 150, 1, 0xffffff);
				}

			} else {
				this.surface.drawString('Point at a spell for a description', uiX + 2, uiY + 124, 1, 0);
			}
		}

		if (this.tabMagicPrayer === 1) {
			this.panelMagic.clearList(this.controlListMagic);
			let j1 = 0;

			for (let j2 = 0; j2 < GameData.prayerCount; j2++) {
				let s1 = '@whi@';

				if (GameData.prayerLevel[j2] > this.playerStatBase[5]) {
					s1 = '@bla@';
				}

				if (this.prayers[j2]) {
					s1 = '@gre@';
				}

				this.panelMagic.addListEntry(this.controlListMagic, j1++, s1 + 'Level ' + GameData.prayerLevel[j2] + ': ' + GameData.prayerName[j2]);
			}

			this.panelMagic.render();

			let j3 = this.panelMagic.getListEntryIndex(this.controlListMagic);

			if (j3 !== -1) {
				this.surface.drawStringCenter('Level ' + GameData.prayerLevel[j3] + ': ' + GameData.prayerName[j3], uiX + ((uiWidth / 2) | 0), uiY + 130, 1, 0xffff00);
				this.surface.drawStringCenter(GameData.prayerDescription[j3], uiX + ((uiWidth / 2) | 0), uiY + 145, 0, 0xffffff);
				this.surface.drawStringCenter('Drain rate: ' + GameData.prayerDrain[j3], uiX + ((uiWidth / 2) | 0), uiY + 160, 1, 0);
			} else {
				this.surface.drawString('Point at a prayer for a description', uiX + 2, uiY + 124, 1, 0);
			}
		}

		if (!nomenus) {
			return;
		}

		let mouseX = this.mouseX - (this.surface.width2 - 199);
		let mouseY = this.mouseY - 36;

		if (mouseX >= 0 && mouseY >= 0 && mouseX < 196 && mouseY < 182) {
			this.panelMagic.handleMouse(mouseX + (this.surface.width2 - 199), mouseY + 36, this.lastMouseButtonDown, this.mouseButtonDown, this.mouseScrollDelta);

			if (mouseY <= 24 && this.mouseButtonClick === 1) {
				if (mouseX < 98 && this.tabMagicPrayer === 1) {
					this.tabMagicPrayer = 0;
					this.panelMagic.resetListProps(this.controlListMagic);
				} else if (mouseX > 98 && this.tabMagicPrayer === 0) {
					this.tabMagicPrayer = 1;
					this.panelMagic.resetListProps(this.controlListMagic);
				}
			}

			if (this.mouseButtonClick === 1 && this.tabMagicPrayer === 0) {
				let idx = this.panelMagic.getListEntryIndex(this.controlListMagic);

				if (idx !== -1) {
					let k2 = this.playerStatCurrent[6];

					if (GameData.spellLevel[idx] > k2) {
						this.showMessage('Your magic ability is not high enough for this spell', 3);
					} else {
						let k3 = 0;

						for (k3 = 0; k3 < GameData.spellRunesRequired[idx]; k3++) {
							let j4 = GameData.spellRunesId[idx][k3];

							if (this.hasInventoryItems(j4, GameData.spellRunesCount[idx][k3])) {
								continue;
							}

							this.showMessage('You don\'t have all the reagents you need for this spell', 3);
							k3 = -1;
							break;
						}

						if (k3 === GameData.spellRunesRequired[idx]) {
							this.selectedSpell = idx;
							this.selectedItemInventoryIndex = -1;
						}
					}
				}
			}

			if (this.mouseButtonClick === 1 && this.tabMagicPrayer === 1) {
				let l1 = this.panelMagic.getListEntryIndex(this.controlListMagic);

				if (l1 !== -1) {
					let l2 = this.playerStatBase[5];

					if (GameData.prayerLevel[l1] > l2) {
						this.showMessage('Your prayer ability is not high enough for this prayer', 3);
					} else if (this.playerStatCurrent[5] === 0) {
						this.showMessage('You have run out of prayer points. Return to a church to recharge', 3);
					} else if (this.prayers[l1]) {
						this.clientStream.queue(Ops.TOGGLE_PRAYER(l1, false));
						this.prayers[l1] = false;
						this.playSoundFile('prayeroff');
					} else {
						this.clientStream.queue(Ops.TOGGLE_PRAYER(l1, true));
						this.prayers[l1] = true;
						this.playSoundFile('prayeron');
					}
				}
			}

			this.mouseButtonClick = 0;
		}
	}

	renderShop() {
		if (this.mouseButtonClick !== 0) {
			this.mouseButtonClick = 0;

			let mouseX = this.mouseX - 52;
			let mouseY = this.mouseY - 44;

			if (mouseX >= 0 && mouseY >= 12 && mouseX < 408 && mouseY < 246) {
				let itemIndex = 0;

				for (let row = 0; row < 5; row++) {
					for (let col = 0; col < 8; col++) {
						let slotX = 7 + col * 49;
						let slotY = 28 + row * 34;

						if (mouseX > slotX && mouseX < slotX + 49 && mouseY > slotY && mouseY < slotY + 34 && this.shopItem[itemIndex] !== -1) {
							this.shopSelectedItemIndex = itemIndex;
							this.shopSelectedItemType = this.shopItem[itemIndex];
						}

						itemIndex++;
					}

				}

				if (this.shopSelectedItemIndex >= 0) {
					let itemType = this.shopItem[this.shopSelectedItemIndex];

					if (itemType !== -1) {
						if (this.shopItemCount[this.shopSelectedItemIndex] > 0 && mouseX > 298 && mouseY >= 204 && mouseX < 408 && mouseY <= 215) {
							let priceMod = this.shopBuyPriceMod + this.shopItemPrice[this.shopSelectedItemIndex];
							let itemPrice = (Math.max(10, priceMod) * GameData.itemBasePrice[itemType]) / 100 | 0;
							this.clientStream.queue(Ops.SHOP_ACTION(this.shopItem[this.shopSelectedItemIndex], itemPrice, true))
						}

						if (this.getInventoryCount(itemType) > 0 && mouseX > 2 && mouseY >= 229 && mouseX < 112 && mouseY <= 240) {
							let priceMod = this.shopSellPriceMod + this.shopItemPrice[this.shopSelectedItemIndex];
							let itemPrice = (Math.max(10, priceMod) * GameData.itemBasePrice[itemType]) / 100 | 0;
							this.clientStream.queue(Ops.SHOP_ACTION(this.shopItem[this.shopSelectedItemIndex], itemPrice, false))
						}
					}
				}
			} else {
				// this.clientStream.newPacket(C_OPCODES.SHOP_CLOSE);
				this.clientStream.queue(Ops.CLOSE_SHOP());
				this.shopVisible = false;
				return;
			}
		}

		let dialogX = 52;
		let dialogY = 44;

		this.surface.drawBox(dialogX, dialogY, 408, 12, 192);
		this.surface.drawBoxAlpha(dialogX, dialogY + 12, 408, 17, 0x989898, 160);
		this.surface.drawBoxAlpha(dialogX, dialogY + 29, 8, 170, 0x989898, 160);
		this.surface.drawBoxAlpha(dialogX + 399, dialogY + 29, 9, 170, 0x989898, 160);
		this.surface.drawBoxAlpha(dialogX, dialogY + 199, 408, 47, 0x989898, 160);
		this.surface.drawString('Buying and selling items', dialogX + 1, dialogY + 10, 1, 0xffffff);
		let colour = 0xffffff;

		if (this.mouseX > dialogX + 320 && this.mouseY >= dialogY && this.mouseX < dialogX + 408 && this.mouseY < dialogY + 12) {
			colour = 0xff0000;
		}

		this.surface.drawStringRight('Close window', dialogX + 406, dialogY + 10, 1, colour);
		this.surface.drawString('Shops stock in green', dialogX + 2, dialogY + 24, 1, 65280);
		this.surface.drawString('Number you own in blue', dialogX + 135, dialogY + 24, 1, 65535);
		this.surface.drawString('Your money: ' + this.getInventoryCount(10) + 'gp', dialogX + 280, dialogY + 24, 1, 0xffff00);
		let itemIndex = 0;

		for (let row = 0; row < 5; row++) {
			for (let col = 0; col < 8; col++) {
				let slotX = dialogX + 7 + col * 49;
				let slotY = dialogY + 28 + row * 34;

				if (this.shopSelectedItemIndex === itemIndex) {
					this.surface.drawBoxAlpha(slotX, slotY, 49, 34, 0xff0000, 160);
				} else {
					this.surface.drawBoxAlpha(slotX, slotY, 49, 34, 0xd0d0d0, 160);
				}

				this.surface.drawBoxEdge(slotX, slotY, 50, 35, 0);

				if (this.shopItem[itemIndex] !== -1) {
					this.surface._spriteClipping_from9(slotX, slotY, 48, 32, mudclient.spriteItem + GameData.itemPicture[this.shopItem[itemIndex]], GameData.itemMask[this.shopItem[itemIndex]], 0, 0, false);
					this.surface.drawString(this.shopItemCount[itemIndex].toString(), slotX + 1, slotY + 10, 1, 65280);
					this.surface.drawStringRight(this.getInventoryCount(this.shopItem[itemIndex]).toString(), slotX + 47, slotY + 10, 1, 65535);
				}

				itemIndex++;
			}

		}

		this.surface.drawLineHoriz(dialogX + 5, dialogY + 222, 398, 0);

		if (this.shopSelectedItemIndex === -1) {
			this.surface.drawStringCenter('Select an object to buy or sell', dialogX + 204, dialogY + 214, 3, 0xffff00);
			return;
		}

		let selectedItemType = this.shopItem[this.shopSelectedItemIndex];

		if (selectedItemType !== -1) {
			if (this.shopItemCount[this.shopSelectedItemIndex] > 0) {
				let priceMod = this.shopBuyPriceMod + this.shopItemPrice[this.shopSelectedItemIndex];

				if (priceMod < 10) {
					priceMod = 10;
				}

				let itemPrice = (priceMod * GameData.itemBasePrice[selectedItemType]) / 100 | 0;
				this.surface.drawString('Buy a new ' + GameData.itemName[selectedItemType] + ' for ' + itemPrice + 'gp', dialogX + 2, dialogY + 214, 1, 0xffff00);

				colour = 0xffffff;
				if (this.mouseX > dialogX + 298 && this.mouseY >= dialogY + 204 && this.mouseX < dialogX + 408 && this.mouseY <= dialogY + 215) {
					colour = 0xff0000;
				}

				this.surface.drawStringRight('Click here to buy', dialogX + 405, dialogY + 214, 3, colour);
			} else {
				this.surface.drawStringCenter('This item is not currently available to buy', dialogX + 204, dialogY + 214, 3, 0xffff00);
			}

			if (this.getInventoryCount(selectedItemType) > 0) {
				let priceMod = this.shopSellPriceMod + this.shopItemPrice[this.shopSelectedItemIndex];

				if (priceMod < 10) {
					priceMod = 10;
				}

				let itemPrice = (priceMod * GameData.itemBasePrice[selectedItemType]) / 100 | 0;

				this.surface.drawStringRight('Sell your ' + GameData.itemName[selectedItemType] + ' for ' + itemPrice + 'gp', dialogX + 405, dialogY + 239, 1, 0xffff00);

				colour = 0xffffff;

				if (this.mouseX > dialogX + 2 && this.mouseY >= dialogY + 229 && this.mouseX < dialogX + 112 && this.mouseY <= dialogY + 240) {
					colour = 0xff0000;
				}

				this.surface.drawString('Click here to sell', dialogX + 2, dialogY + 239, 3, colour);
				return;
			}

			this.surface.drawStringCenter('You do not have any of this item to sell', dialogX + 204, dialogY + 239, 3, 0xffff00);
		}
	}

	hasInventoryItems(id, mincount) {
		if (id === 31 && (this.isItemEquipped(197) || this.isItemEquipped(615) || this.isItemEquipped(682))) {
			return true;
		}

		if (id === 32 && (this.isItemEquipped(102) || this.isItemEquipped(616) || this.isItemEquipped(683))) {
			return true;
		}

		if (id === 33 && (this.isItemEquipped(101) || this.isItemEquipped(617) || this.isItemEquipped(684))) {
			return true;
		}

		if (id === 34 && (this.isItemEquipped(103) || this.isItemEquipped(618) || this.isItemEquipped(685))) {
			return true;
		}

		return this.getInventoryCount(id) >= mincount;
	}

	getHostnameIP(i) {
		return Utility.getIntegerAsString(i);
	}

	cantLogout() {
		this.logoutBoxFrames = 0;
		this.showMessage("@cya@Sorry, you can't logout at the moment", 3);
	}

	drawGame() {
		if (this.deathScreenTimeout !== 0) {
			this.surface.fadeToBlack();
			this.surface.drawStringCenter('Oh dear! You are dead...', this.gameWidth / 2 | 0, this.gameHeight / 2 | 0, 7, 0xff0000);
			this.drawChatMessageTabs();
			this.surface.draw(this.graphics, 0, 0);
			return;
		}

		if (this.showAppearanceChange) {
			this.drawAppearancePanelCharacterSprites();
			return;
		}

		if (this.isSleeping) {
			this.surface.fadeToBlack();

			if (Math.random() < 0.15)
				this.surface.drawStringCenter('ZZZ', Math.random() * 80 | 0, Math.random() * 334 | 0, 5, Math.random() * 0xFFFFFF | 0);

			if (Math.random() < 0.15)
				this.surface.drawStringCenter('ZZZ', 512 - ((Math.random() * 80) | 0), Math.random() * 334 | 0, 5, Math.random() * 0xFFFFFF | 0);

			this.surface.drawBox((this.gameWidth2/2|0) - 100, 160, 200, 40, 0);
			this.surface.drawStringCenter('You are sleeping', this.gameWidth / 2 | 0, 50, 7, 0xffff00);
			this.surface.drawStringCenter('Fatigue: ' + (((this.fatigueSleeping * 100) / 750) | 0) + '%', this.gameWidth / 2 | 0, 90, 7, 0xffff00);
			this.surface.drawStringCenter('When you want to wake up just use your', this.gameWidth / 2 | 0, 140, 5, 0xffffff);
			this.surface.drawStringCenter('keyboard to type the word in the box below', this.gameWidth / 2 | 0, 160, 5, 0xffffff);
			this.surface.drawStringCenter(this.inputTextCurrent + '*', this.gameWidth / 2 | 0, 180, 5, 65535);

			if (!this.sleepingStatusText) {
				this.surface.drawSpriteID(((this.gameWidth / 2) | 0) - 127, 230, mudclient.spriteTexture + 1);
			} else {
				this.surface.drawStringCenter(this.sleepingStatusText, this.gameWidth / 2 | 0, 260, 5, 0xff0000);
			}

			this.surface.drawBoxEdge(((this.gameWidth / 2) | 0) - 128, 229, 257, 42, 0xffffff);
			this.drawChatMessageTabs();
			this.surface.drawStringCenter('If you can\'t read the word', this.gameWidth / 2 | 0, 290, 1, 0xffffff);
			this.surface.drawStringCenter('@yel@click here@whi@ to get a different one', this.gameWidth / 2 | 0, 305, 1, 0xffffff);
			this.surface.draw(this.graphics, 0, 0);
			return;
		}

		if (!this.world.playerAlive)
			return;

		for (let i = 0; i < 64; i++) {
			this.scene.removeModel(this.world.roofModels[this.lastHeightOffset][i]);

			if (this.lastHeightOffset === 0) {
				this.scene.removeModel(this.world.wallModels[1][i]);
				this.scene.removeModel(this.world.roofModels[1][i]);
				this.scene.removeModel(this.world.wallModels[2][i]);
				this.scene.removeModel(this.world.roofModels[2][i]);
			}

			if (this.options.showRoofs) {
				this.fogOfWar = true;

				if (this.lastHeightOffset === 0 && (this.world.objectAdjacency.get(this.localPlayer.currentX >>> 7, ((this.localPlayer.currentY >>> 7))) & 0x80) === 0) {
					this.scene.addModel(this.world.roofModels[this.lastHeightOffset][i]);

					if (this.lastHeightOffset === 0) {
						this.scene.addModel(this.world.wallModels[1][i]);
						this.scene.addModel(this.world.roofModels[1][i]);
						this.scene.addModel(this.world.wallModels[2][i]);
						this.scene.addModel(this.world.roofModels[2][i]);
					}

					this.fogOfWar = false;
				}
			}
		}

		if (this.objectAnimationNumberFireLightningSpell !== this.lastObjectAnimationNumberFireLightningSpell) {
			this.lastObjectAnimationNumberFireLightningSpell = this.objectAnimationNumberFireLightningSpell;

			for (let j = 0; j < this.objectCount; j++) {
				if (this.objectId[j] === 97) {
					this.updateObjectAnimation(j, 'firea' + (this.objectAnimationNumberFireLightningSpell + 1));
				}

				if (this.objectId[j] === 274) {
					this.updateObjectAnimation(j, 'fireplacea' + (this.objectAnimationNumberFireLightningSpell + 1));
				}

				if (this.objectId[j] === 1031) {
					this.updateObjectAnimation(j, 'lightning' + (this.objectAnimationNumberFireLightningSpell + 1));
				}

				if (this.objectId[j] === 1036) {
					this.updateObjectAnimation(j, 'firespell' + (this.objectAnimationNumberFireLightningSpell + 1));
				}

				if (this.objectId[j] === 1147) {
					this.updateObjectAnimation(j, 'spellcharge' + (this.objectAnimationNumberFireLightningSpell + 1));
				}
			}
		}

		if (this.objectAnimationNumberTorch !== this.lastObjectAnimationNumberTorch) {
			this.lastObjectAnimationNumberTorch = this.objectAnimationNumberTorch;

			for (let k = 0; k < this.objectCount; k++) {
				if (this.objectId[k] === 51) {
					this.updateObjectAnimation(k, 'torcha' + (this.objectAnimationNumberTorch + 1));
				}

				if (this.objectId[k] === 143) {
					this.updateObjectAnimation(k, 'skulltorcha' + (this.objectAnimationNumberTorch + 1));
				}
			}
		}

		if (this.objectAnimationNumberClaw !== this.lastObjectAnimationNumberClaw) {
			this.lastObjectAnimationNumberClaw = this.objectAnimationNumberClaw;

			for (let l = 0; l < this.objectCount; l++) {
				if (this.objectId[l] === 1142) {
					this.updateObjectAnimation(l, 'clawspell' + (this.objectAnimationNumberClaw + 1));
				}
			}

		}

		this.scene.reduceSprites(this.spriteCount);
		this.spriteCount = 0;

		for (let i = 0; i < this.playerCount; i++) {
			let player = this.players[i];

			if (player.colourBottom !== 0xFF) {
				let elev = -this.world.getElevation(player.currentX, player.currentY);
				let id = this.scene.addSprite(5000 + i, player.currentX, elev, player.currentY, 145, 220, i + 10000);

				this.spriteCount++;

				if (player === this.localPlayer) {
					this.scene.setLocalPlayer(id);
				}

				// left hand side in combat
				if (player.animationCurrent === 8)
					this.scene.setSpriteTranslateX(id, -30);

				// right hand side in combat
				if (player.animationCurrent === 9)
					this.scene.setSpriteTranslateX(id, 30);
			}
			if (player.projectileRange > 0) {
				let character = void 0;

				if (player.attackingNpcServerIndex !== -1)
					character = this.npcsServer[player.attackingNpcServerIndex];
				else if (player.attackingPlayerServerIndex !== -1)
					character = this.playersServer[player.attackingPlayerServerIndex];

				if (character) {
					let sx = player.currentX;
					let sy = player.currentY;
					let selev = -this.world.getElevation(sx, sy) - 110;
					let dx = character.currentX;
					let dy = character.currentY;
					let delev = -this.world.getElevation(dx, dy) - Math.floor(GameData.npcHeight[character.typeID] / 2);
					let rx = Math.floor((sx * player.projectileRange + dx * (this.projectileFactor - player.projectileRange)) / this.projectileFactor);
					let rz = Math.floor((selev * player.projectileRange + delev * (this.projectileFactor - player.projectileRange)) / this.projectileFactor);
					let ry = Math.floor((sy * player.projectileRange + dy * (this.projectileFactor - player.projectileRange)) / this.projectileFactor);

					this.scene.addSprite(mudclient.spriteProjectile + player.incomingProjectileSprite, rx, rz, ry, 32, 32, 0);
					this.spriteCount++;
				}
			}
		}

		for (let i = 0; i < this.npcCount; i++) {
			let npc = this.npcs[i];
			let i3 = npc.currentX;
			let j4 = npc.currentY;
			let i7 = -this.world.getElevation(i3, j4);
			let i9 = this.scene.addSprite(20000 + i, i3, i7, j4, GameData.npcWidth[npc.typeID], GameData.npcHeight[npc.typeID], i + 30000);
			this.spriteCount++;

			if (npc.animationCurrent === 8)
				this.scene.setSpriteTranslateX(i9, -30);

			if (npc.animationCurrent === 9)
				this.scene.setSpriteTranslateX(i9, 30);
		}

		for (let i = 0; i < this.groundItemCount; i++) {
			let x = this.groundItemX[i] * this.tileSize+64;
			let y = this.groundItemY[i] * this.tileSize+64;

			this.scene.addSprite(40000 + this.groundItemId[i], x, -this.world.getElevation(x, y) - this.groundItemZ[i], y, 96, 64, i + 20000);
			this.spriteCount++;
		}

		for (let i = 0; i < this.teleportBubbleCount; i++) {
			let l4 = this.teleportBubbleX[i] * this.tileSize+64;
			let j7 = this.teleportBubbleY[i] * this.tileSize+64;
			let j9 = this.teleportBubbleType[i];

			if (j9 === 0) {
				this.scene.addSprite(50000 + i, l4, -this.world.getElevation(l4, j7), j7, 128, 256, i + 50000);
				this.spriteCount++;
			}

			if (j9 === 1) {
				this.scene.addSprite(50000 + i, l4, -this.world.getElevation(l4, j7), j7, 128, 64, i + 50000);
				this.spriteCount++;
			}
		}

		this.surface.interlace = false;
		this.surface.blackScreen();
		this.surface.interlace = this.interlace;

		// basement plane flicker effect
		if (this.lastHeightOffset === 3) {
			// let ambienceOffset = rand(40, 43)
			// let diffusionOffset = rand(40, 47)
			let ambienceOffset = 40 + Math.floor(Math.random() * 3);
			let diffusionOffset = 40 + Math.floor(Math.random() * 7);

			// light source for basement flicker is at -50,-10,50 in the world mesh
			// Is this just arbitrary or is there a reasoning for it?  Needs investigation.
			this.scene.createLightSource(ambienceOffset, diffusionOffset, -50, -10, -50);
		}

		this.itemsAboveHeadCount = 0;
		this.receivedMessagesCount = 0;
		this.healthBarCount = 0;

		if (this.cameraAutoAngleDebug) {
			if (this.optionCameraModeAuto && !this.fogOfWar) {
				let j5 = this.cameraAngle;

				this.autorotateCamera();

				if (this.cameraAngle !== j5) {
					this.cameraAutoRotatePlayerX = this.localPlayer.currentX;
					this.cameraAutoRotatePlayerY = this.localPlayer.currentY;
				}
			}

			this.scene.clipFar3d = 3000;
			this.scene.clipFar2d = 3000;
			this.scene.fogZFalloff = 1;
			this.scene.fogZDistance = 2800;
			this.cameraRotation = this.cameraAngle << 5;

			let x = this.cameraAutoRotatePlayerX + this.cameraRotationX;
			let y = this.cameraAutoRotatePlayerY + this.cameraRotationY;

			this.scene.setCamera(x, -this.world.getElevation(x, y), y, 912, this.cameraRotation << 2, 0, 2000);
		} else {
			if (this.optionCameraModeAuto && !this.fogOfWar)
				this.autorotateCamera();

			if (!this.interlace) {
				this.scene.clipFar3d = 2400;
				this.scene.clipFar2d = 2400;
				this.scene.fogZFalloff = 1;
				this.scene.fogZDistance = 2300;
			} else {
				this.scene.clipFar3d = 2200;
				this.scene.clipFar2d = 2200;
				this.scene.fogZFalloff = 1;
				this.scene.fogZDistance = 2100;
			}

			if (this.cameraZoom > ZOOM_OUTDOORS) {
				this.scene.clipFar3d += 1400;
				this.scene.clipFar2d += 1400;
				this.scene.fogZDistance += 1400;
			}

			let x = this.cameraAutoRotatePlayerX + this.cameraRotationX;
			let y = this.cameraAutoRotatePlayerY + this.cameraRotationY;

			this.scene.setCamera(x, -this.world.getElevation(x, y), y, 912, this.cameraRotation << 2, 0, this.cameraZoom << 1);
		}

		this.scene.render();
		this.renderLocalMobEffects();

		if (this.mouseClickXStep > 0)
			this.surface.drawSpriteID(this.mouseClickXX - 8, this.mouseClickXY - 8, mudclient.spriteMedia + 14 + Math.floor((24 - this.mouseClickXStep) / 6));
		else if (this.mouseClickXStep < 0)
			this.surface.drawSpriteID(this.mouseClickXX - 8, this.mouseClickXY - 8, mudclient.spriteMedia + 18 + Math.floor((24 + this.mouseClickXStep) / 6));

		if (this.systemUpdate !== 0) {
			let seconds = Math.floor(this.systemUpdate / 50);
			let minutes = Math.floor(seconds / 60);
			seconds %= 60;

			this.surface.drawStringCenter('System update in: ' + minutes + (seconds < 10 ? ':0' + seconds : ':' + seconds), 256, this.gameHeight - 7, 1, 0xffff00);
			// if (seconds < 10)
				// this.surface.drawStringCenter('System update in: ' + minutes + ':0' + seconds, 256, this.gameHeight - 7, 1, 0xffff00);
			// else
				// this.surface.drawStringCenter('System update in: ' + minutes + ':' + seconds, 256, this.gameHeight - 7, 1, 0xffff00);
		}

		let dy = 8;
		if (this.debug) {
			this.surface.drawStringCenter(`Mouse:${this.mouseX},${this.mouseY}`, 256, 15, 1, 0xffff00);
			this.surface.drawStringCenter(`Player:${(this.localPlayer.currentX >>> 7) + this.regionX},${(this.localPlayer.currentY >>> 7) + this.regionY}`, 256, 30, 1, 0xffff00);
		}
		if (this.showFps && this.fps > 0) {
			this.surface.drawStringCenter('FPS:' + this.fps, 465, this.gameHeight - dy, 1, 0xffff00);
			dy += 20
		}

		if (!this.loadingArea) {
			let wildY = 2203 - (this.localRegionY + this.planeHeight + this.regionY);

			if (this.localRegionX + this.planeWidth + this.regionX >= 2640)
				wildY = -50;

			if (wildY > 0) {
				if (this.wildAwarenessLvl === 0)
					this.wildAwarenessLvl = 2;

				let wildlvl = Math.floor(wildY / 6) + 1; // one wilderness level per 6 vertical tiles
				this.surface.drawSpriteID(453, this.gameHeight - (dy+56), mudclient.spriteMedia + 13);
				this.surface.drawStringCenter('Wilderness', 465, this.gameHeight - (dy+20), 1, 0xffff00);
				this.surface.drawStringCenter('Level: ' + wildlvl, 465, this.gameHeight - (dy+7), 1, 0xffff00);
			} else if (wildY > -10 && this.wildAwarenessLvl === 0)
				this.wildAwarenessLvl = 1;
		}

		if (this.messageTabSelected === 0) {
			for (let k6 = 0; k6 < this.messageHistory.length; k6++) {
				if (this.messageHistory[k6].ticks > 0) {
					this.surface.drawString(this.messageHistory[k6].message, 7, this.gameHeight - 18 - k6 * 12, 1, 0xffff00);
				} else {
					this.messageHistory.pop();
				}
			}
		}

		this.panelGame[GamePanels.CHAT].setVisible(this.controlTextListChat, this.messageTabSelected === 1);
		this.panelGame[GamePanels.CHAT].setVisible(this.controlTextListQuest, this.messageTabSelected === 2);
		this.panelGame[GamePanels.CHAT].setVisible(this.controlTextListPrivate, this.messageTabSelected === 3);
		
		Panel.textListEntryHeightMod = 2;
		this.panelGame[GamePanels.CHAT].render();
		Panel.textListEntryHeightMod = 0;
		this.surface.fadeThenDrawSpriteID(this.surface.width2 - 3 - 197, 3, mudclient.spriteMedia, 128);
		this.drawUi();
		this.surface.worldVisible = false;
		this.drawChatMessageTabs();
		this.surface.draw(this.graphics, 0, 0);
	}

	async loadSounds() {
		try {
			this.soundData = await this.readDataFile('sounds' + VERSION.SOUNDS + '.mem', 'Sound effects', 90);
			this.audioPlayer = new StreamAudioPlayer();
		} catch (e) {
			console.log('Unable to init sounds:' + e.message);
			console.error(e);
		}
	}

	isItemEquipped(i) {
		for (let j = 0; j < this.inventoryItemsCount; j++) {
			if (this.inventoryItemId[j] === i && this.inventoryEquipped[j]) {
				return true;
			}
		}

		return false;
	}

	async loadEntities() {
		let entityBuff = void 0;
		let indexDat = void 0;

		entityBuff = await this.readDataFile('entity' + VERSION.ENTITY + '.jag', 'people and monsters', 30);
		if (!entityBuff) {
			this.runtimeException = new GameException("Error loading people and monster sprites!\n\n" + e.message, true);
			return;
		}

		indexDat = Utility.loadData('index.dat', 0, entityBuff);

		let entityBuffMem = void 0;
		let indexDatMem = void 0;

		if (this.members) {
			entityBuffMem = await this.readDataFile('entity' + VERSION.ENTITY + '.mem', 'member graphics', 45);

			if (!entityBuffMem) {
				this.runtimeException = new GameException("Error loading member sprites!\n\n" + e.message, true);
				return;
			}

			indexDatMem = Utility.loadData('index.dat', 0, entityBuffMem);
		}

		let frameCount = 0;

		this.anInt659 = 0;
		this.anInt660 = this.anInt659;

label0:
		for (let j = 0; j < GameData.animationCount; j++) {
			let s = GameData.animationName[j];

			for (let k = 0; k < j; k++) {
				if (GameData.animationName[k].toLowerCase() === s.toLowerCase()) {
					GameData.animationNumber[j] = GameData.animationNumber[k];
					continue label0;
				}
			}

			let abyte7 = Utility.loadData(s + '.dat', 0, entityBuff);
			let abyte4 = indexDat;

			if (!abyte7 && this.members) {
				abyte7 = Utility.loadData(s + '.dat', 0, entityBuffMem);
				abyte4 = indexDatMem;
			}

			if (abyte7) {
				this.surface.parseSprite(this.anInt660, abyte7, abyte4, 15);

				frameCount += 15;

				if (GameData.animationHasA[j] === 1) {
					let aDat = Utility.loadData(s + 'a.dat', 0, entityBuff);
					let aIndexDat = indexDat;

					if (!aDat && this.members) {
						aDat = Utility.loadData(s + 'a.dat', 0, entityBuffMem);
						aIndexDat = indexDatMem;
					}

					this.surface.parseSprite(this.anInt660 + 15, aDat, aIndexDat, 3);
					frameCount += 3;
				}

				if (GameData.animationHasF[j] === 1) {
					let fDat = Utility.loadData(s + 'f.dat', 0, entityBuff);
					let fDatIndex = indexDat;

					if (!fDat && this.members) {
						fDat = Utility.loadData(s + 'f.dat', 0, entityBuffMem);
						fDatIndex = indexDatMem;
					}

					this.surface.parseSprite(this.anInt660 + 18, fDat, fDatIndex, 9);
					frameCount += 9;
				}

				if (GameData.animationSomething[j] !== 0) {
					for (let l = this.anInt660; l < this.anInt660 + 27; l++) {
						this.surface.loadSprite(l);
					}
				}
			}

			GameData.animationNumber[j] = this.anInt660;
			this.anInt660 += 27;
		}

		console.log('Loaded: ' + frameCount + ' frames of animation');
	}

	handleAppearancePanelControls() {
		this.panelGame[GamePanels.APPEARANCE].handleMouse(this.mouseX, this.mouseY, this.lastMouseButtonDown, this.mouseButtonDown);

		if (this.panelGame[GamePanels.APPEARANCE].isClicked(this.controlButtonAppearanceHead1)) {
			do {
				this.appearanceHeadType = ((this.appearanceHeadType - 1) + GameData.animationCount) % GameData.animationCount;
			} while ((GameData.animationSomething[this.appearanceHeadType] & 3) !== 1 || (GameData.animationSomething[this.appearanceHeadType] & 4 * this.appearanceHeadGender) === 0);
		}

		if (this.panelGame[GamePanels.APPEARANCE].isClicked(this.controlButtonAppearanceHead2)) {
			do {
				this.appearanceHeadType = (this.appearanceHeadType + 1) % GameData.animationCount;
			} while ((GameData.animationSomething[this.appearanceHeadType] & 3) !== 1 || (GameData.animationSomething[this.appearanceHeadType] & 4 * this.appearanceHeadGender) === 0);
		}

		if (this.panelGame[GamePanels.APPEARANCE].isClicked(this.controlButtonAppearanceHair1)) {
			this.appearanceHairColour = ((this.appearanceHairColour - 1) + this.characterHairColours.length) % this.characterHairColours.length;
		}

		if (this.panelGame[GamePanels.APPEARANCE].isClicked(this.controlButtonAppearanceHair2)) {
			this.appearanceHairColour = (this.appearanceHairColour + 1) % this.characterHairColours.length;
		}

		if (this.panelGame[GamePanels.APPEARANCE].isClicked(this.controlButtonAppearanceGender1) || this.panelGame[GamePanels.APPEARANCE].isClicked(this.controlButtonAppearanceGender2)) {
			for (this.appearanceHeadGender = 3 - this.appearanceHeadGender; (GameData.animationSomething[this.appearanceHeadType] & 3) !== 1 || (GameData.animationSomething[this.appearanceHeadType] & 4 * this.appearanceHeadGender) === 0; this.appearanceHeadType = (this.appearanceHeadType + 1) % GameData.animationCount);
			for (; (GameData.animationSomething[this.appearanceBodyGender] & 3) !== 2 || (GameData.animationSomething[this.appearanceBodyGender] & 4 * this.appearanceHeadGender) === 0; this.appearanceBodyGender = (this.appearanceBodyGender + 1) % GameData.animationCount);
		}

		if (this.panelGame[GamePanels.APPEARANCE].isClicked(this.controlButtonAppearanceTop1)) {
			this.appearanceTopColour = ((this.appearanceTopColour - 1) + this.characterTopBottomColours.length) % this.characterTopBottomColours.length;
		}

		if (this.panelGame[GamePanels.APPEARANCE].isClicked(this.controlButtonAppearanceTop2)) {
			this.appearanceTopColour = (this.appearanceTopColour + 1) % this.characterTopBottomColours.length;
		}

		if (this.panelGame[GamePanels.APPEARANCE].isClicked(this.controlButtonAppearanceSkin1)) {
			this.appearanceSkinColour = ((this.appearanceSkinColour - 1) + this.characterSkinColours.length) % this.characterSkinColours.length;
		}

		if (this.panelGame[GamePanels.APPEARANCE].isClicked(this.controlButtonAppearanceSkin2)) {
			this.appearanceSkinColour = (this.appearanceSkinColour + 1) % this.characterSkinColours.length;
		}

		if (this.panelGame[GamePanels.APPEARANCE].isClicked(this.controlButtonAppearanceBottom1)) {
			this.appearanceBottomColour = ((this.appearanceBottomColour - 1) + this.characterTopBottomColours.length) % this.characterTopBottomColours.length;
		}

		if (this.panelGame[GamePanels.APPEARANCE].isClicked(this.controlButtonAppearanceBottom2)) {
			this.appearanceBottomColour = (this.appearanceBottomColour + 1) % this.characterTopBottomColours.length;
		}

		if (this.panelGame[GamePanels.APPEARANCE].isClicked(this.controlButtonAppearanceAccept)) {
			// let p = new Packet(C_OPCODES.APPEARANCE);
			// p.startAccess();
			// p.putByte(this.appearanceHeadGender);
			// p.putByte(this.appearanceHeadType);
			// p.putByte(this.appearanceBodyGender);
			// p.putByte(this.appearance2Colour);
			// p.putByte(this.appearanceHairColour);
			// p.putByte(this.appearanceTopColour);
			// p.putByte(this.appearanceBottomColour);
			// p.putByte(this.appearanceSkinColour);
			// p.stopAccess();
			// this.clientStream.add(p);
			this.clientStream.queue(Ops.CHANGE_APPEARANCE(this.appearanceHeadGender, this.appearanceHeadType, this.appearanceBodyGender,
					this.appearance2Colour, this.appearanceHairColour, this.appearanceTopColour, this.appearanceBottomColour, this.appearanceSkinColour));
			this.surface.blackScreen();
			this.showAppearanceChange = false;
		}
	}

	draw() {
		if (this.runtimeException) {
			let g = this.getGraphics();

			g.setColor(Color.BLACK);
			g.fillRect(0, 0, this.gameWidth, this.gameHeight);

			g.setFont(Font.HELVETICA.bold(16));
			g.setColor(Color.YELLOW);
			g.drawString('Sorry, an error has occurred whilst loading RSCGo', 30, 35);

			g.setColor(Color.WHITE);
			g.drawString('To fix this try the following (in order):', 30, 85);

			g.setFont(Font.HELVETICA.bold(12));
			g.drawString('1: Try closing ALL open web-browser windows, and reloading', 30, 135);
			g.drawString('2: Try clearing your web-browsers cache from tools->internet options', 30, 165);
			g.drawString('3: Try using a different game-world', 30, 195);
			g.drawString('4: Try rebooting your computer', 30, 225);
			g.drawString('5: Try selecting a different version of Java from the play-game menu', 30, 255);

			this.setTargetFps(1);
			return;
		}

		if (this.initException) {
			let g1 = this.getGraphics();

			g1.setColor(Color.BLACK);
			g1.fillRect(0, 0, this.gameWidth, this.gameHeight);

			g1.setFont(Font.HELVETICA.bold(20));
			g1.setColor(Color.WHITE);
			g1.drawString('Error - unable to load game!', 50, 50);
			g1.drawString('To play RuneScape make sure you play from', 50, 100);
			g1.drawString('http://rsclassic.dev', 50, 150);

			this.setTargetFps(1);
			return;
		}

		// if (this.runtimeException) {
			// this.clearResources();
			// let g1 = this.getGraphics();
// 
			// g1.setColor(Color.BLACK);
			// g1.fillRect(0, 0, this.gameWidth, this.gameHeight);
// 
			// g1.setFont(Font.HELVETICA.bold(20));
			// g1.setColor(Color.WHITE);
			// g1.drawString('Error - out of memory!', 50, 50);
			// g1.drawString('Close ALL unnecessary programs', 50, 100);
			// g1.drawString('and windows before loading the game', 50, 150);
			// g1.drawString('RuneScape needs about 48meg of spare RAM', 50, 200);
// 
			// this.setTargetFps(1);
			// return;
		// }

		try {
			switch (this.gameState) {
			case GameStates.LOGIN:
				this.surface.worldVisible = false;
				this.drawLoginScreens();
				break;
			case GameStates.WORLD:
				this.surface.worldVisible = true;
				this.drawGame();
				break;
			default:
				return;
			}
		} catch (e) {
			this.runtimeException = e;
			this.clearResources();
			console.error(e);
		}
	}

	clearResources() {
		this.closeConnection();
		this.freeCacheMemory();

		if (this.audioPlayer)
			this.audioPlayer.stopPlayer();
	}

	renderConfirmDuel() {
		let dialogX = 22;
		let dialogY = 36;

		this.surface.drawBox(dialogX, dialogY, 468, 16, 192);
		this.surface.drawBoxAlpha(dialogX, dialogY + 16, 468, 246, 0x989898, 160);
		this.surface.drawStringCenter('Please confirm your duel with @yel@' + Utility.hashToUsername(this.duelOpponentNameHash), dialogX + 234, dialogY + 12, 1, 0xffffff);
		this.surface.drawStringCenter('Your stake:', dialogX + 117, dialogY + 30, 1, 0xffff00);

		if (this.duelItemsCount <= 0) {
			this.surface.drawStringCenter('Nothing!', dialogX + 117, dialogY + 42, 1, 0xffffff);
		} else {
			// for (let idx = 0; idx < this.duelItemsCount; idx++) {
			let offsetY = 0;
			for (let item of this.duelItemList) {
				let entry = GameData.itemName[item.id] + (GameData.itemStackable[item.id] === 0 ? ' x ' + formatNumber(item.amount) : '');
				if (item && entry)
					this.surface.drawStringCenter(entry, dialogX+117, dialogY+42+offsetY, 1, 0xFFFFFF);
				offsetY += 12;
			}
		}

		this.surface.drawStringCenter("Your opponent's stake:", dialogX + 351, dialogY + 30, 1, 0xffff00);

		if (this.duelOpponentItemsCount <= 0)
			this.surface.drawStringCenter('Nothing!', dialogX + 351, dialogY + 42, 1, 0xffffff);
		else {
			let offsetY = 0;
			// for (let idx = 0; idx < this.duelOpponentItemsCount; idx++) {
			for (let item of this.duelOpponentItemList) {
				// let item = this.duelOpponentItemList[idx];
				let entry = GameData.itemName[item.id];
				if (GameData.itemStackable[item.id] === 0)
					entry += ' x ' + formatNumber(item.amount);
				else {
					entry += '';
				}
				if(item&&entry)
					this.surface.drawStringCenter(entry, dialogX+351, dialogY+42+offsetY, 1, 0xFFFFFF);
				offsetY += 12;
			}
		}

		// let retreatCheck = this.duelOptionRetreat === 0;
		// let magicCheck = this.duelOptionMagic === 0;
		// let prayerCheck = this.duelOptionPrayer === 0;
		// let weaponsCheck = this.duelOptionWeapons === 0;

		this.surface.drawStringCenter(this.duelOptionRetreat === 0 ? 'You can retreat from this duel' : 'No retreat is possible',
				dialogX + 234, dialogY + 204, 1, this.duelOptionRetreat === 0 ? 0x00FF00 : 0xFF0000);
				// dialogX + 234, dialogY + 204, 1, retreatCheck ? 0x00FF00 : 0xFF0000);
		this.surface.drawStringCenter('Magic ' + this.duelOptionMagic === 0 ? 'may' : 'cannot' + ' be used',
				dialogX + 234, dialogY + 204, 1, this.duelOptionMagic === 0 ? 0x00FF00 : 0xFF0000);
				// dialogX + 234, dialogY + 204, 1, magicCheck ? 0x00FF00 : 0xFF0000);
		this.surface.drawStringCenter('Prayer ' + this.duelOptionPrayer === 0 ? 'may' : 'cannot' + ' be used',
				dialogX + 234, dialogY + 204, 1, this.duelOptionPrayer === 0 ? 0x00FF00 : 0xFF0000);
				// dialogX + 234, dialogY + 204, 1, prayerCheck ? 0x00FF00 : 0xFF0000);
		this.surface.drawStringCenter('Weapons ' + this.duelOptionWeapons === 0 ? 'may' : 'cannot' + ' be used',
				dialogX + 234, dialogY + 204, 1, this.duelOptionWeapons === 0 ? 0x00FF00 : 0xFF0000);
				// dialogX + 234, dialogY + 216, 1, weaponsCheck ? 0x00FF00 : 0xFF0000);

		this.surface.drawStringCenter("If you are sure click 'Accept' to begin the duel", dialogX + 234, dialogY + 230, 1, 0xffffff);

		if (!this.duelAccepted) {
			this.surface.drawSpriteID((dialogX + 118) - 35, dialogY + 238, mudclient.spriteMedia + 25);
			this.surface.drawSpriteID((dialogX + 352) - 35, dialogY + 238, mudclient.spriteMedia + 26);
		} else {
			this.surface.drawStringCenter('Waiting for other player...', dialogX + 234, dialogY + 250, 1, 0xffff00);
		}

		if (this.isClicking()) {
			if (this.mouseX >= (dialogX + 118) - 35 && this.mouseX <= dialogX + 118 + 70 && this.mouseY >= dialogY + 238 && this.mouseY <= dialogY + 238 + 21) {
				this.duelAccepted = true;
				this.clientStream.queue(Ops.ACCEPT_DUEL_TWO)
			}

			if ((this.mouseX >= (dialogX + 352) - 35 && this.mouseX <= dialogX + 353 + 70 && this.mouseY >= dialogY + 238 && this.mouseY <= dialogY + 238 + 21) ||
					(this.mouseX < dialogX || this.mouseY < dialogY || this.mouseX > dialogX + 468 || this.mouseY > dialogY + 262)) {
				this.duelConfirmVisible = false;
				this.clientStream.queue(Ops.DECLINE_DUEL);
			}

			this.mouseButtonClick = 0;
		}
	}

	walkToGroundItem(i, j, k, l, walkToAction) {
		if (!this.walkTo(i, j, k, l, k, l, false, walkToAction))
			this.walkToEntity(i, j, k, l, k, l, true, walkToAction);
	}

	async loadModels() {
		GameData.getModelIndex('torcha2');
		GameData.getModelIndex('torcha3');
		GameData.getModelIndex('torcha4');
		GameData.getModelIndex('skulltorcha2');
		GameData.getModelIndex('skulltorcha3');
		GameData.getModelIndex('skulltorcha4');
		GameData.getModelIndex('firea2');
		GameData.getModelIndex('firea3');
		GameData.getModelIndex('fireplacea2');
		GameData.getModelIndex('fireplacea3');
		GameData.getModelIndex('firespell2');
		GameData.getModelIndex('firespell3');
		GameData.getModelIndex('lightning2');
		GameData.getModelIndex('lightning3');
		GameData.getModelIndex('clawspell2');
		GameData.getModelIndex('clawspell3');
		GameData.getModelIndex('clawspell4');
		GameData.getModelIndex('clawspell5');
		GameData.getModelIndex('spellcharge2');
		GameData.getModelIndex('spellcharge3');

		let abyte0 = await this.readDataFile('models' + VERSION.MODELS + '.jag', '3d models', 60);

		if (!abyte0) {
			this.initException = new GameException("Error loading 3d models!\n\n" + e.message, true);
			return;
		}

		for (let j = 0; j < GameData.modelCount; j++) {
			let k = Utility.getDataFileOffset(GameData.modelName[j] + '.ob3', abyte0);
			if (k !== 0)
				this.gameModels[j] = GameModel._from3(abyte0, k, true);
			else
				this.gameModels[j] = GameModel._from2(1, 1);

			if (GameData.modelName[j].toLowerCase() === 'giantcrystal')
				this.gameModels[j].transparent = true;
		}
	}

	renderServerMessageBox() {
		let width = 400;
		let height = 100;

		if (this.serverMessageBoxTop) {
			height = 450;
			height = 300;
		}

		this.surface.drawBox(256 - Math.floor(width / 2), 167 - Math.floor(height / 2), width, height, 0);
		this.surface.drawBoxEdge(256 - Math.floor(width / 2), 167 - Math.floor(height / 2), width, height, 0xFFFFFF);
		this.surface.centrepara(this.serverMessage, 256, (167 - Math.floor(height / 2)) + 20, 1, 0xFFFFFF, width - 40);

		let i = 157 + Math.floor(height / 2);
		let j = 0xFFFFFF;

		if (this.mouseY > i - 12 && this.mouseY <= i && this.mouseX > 106 && this.mouseX < 406)
			j = 0xFF0000;

		this.surface.drawStringCenter('Click here to close window', 256, i, 1, j);

		if (this.mouseButtonClick !== 0)
			if (j !== 0xFFFFFF || (this.mouseX < 256 - ((width / 2) | 0) || this.mouseX > 256 + ((width / 2) | 0)) && (this.mouseY < 167 - ((height / 2) | 0) || this.mouseY > 167 + ((height / 2) | 0)))
				this.showDialogServermessage = false;

		this.mouseButtonClick = 0;
	}

	renderReportAbuseInputs() {
		if (this.inputTextFinal.length > 0) {
			let name = this.inputTextFinal.trim().substring(0,12);

			this.inputTextCurrent = '';
			this.inputTextFinal = '';

			if (name.length > 0)
				this.clientStream.queue(Ops.REPORT_ABUSE(name, this.reportAbuseOffence, this.reportAbuseMute ? 1 : 0))

			this.reportAbuseState = 0;
			return;
		}
		this.surface.drawBox(56, 130, 400, 100, 0);
		this.surface.drawBoxEdge(56, 130, 400, 100, 0xffffff);
		let i = 160;
		this.surface.drawStringCenter('Now type the name of the offending player, and press enter', 256, i, 1, 0xffff00);
		i += 18;
		this.surface.drawStringCenter('Name: ' + this.inputTextCurrent + '*', 256, i, 4, 0xffffff);
		if (this.moderatorLevel > 0)
			this.surface.drawStringCenter(`Moderator option: Mute player for 48 hours: ${this.reportAbuseMute ? 'ON' : 'OFF'}>`, 256, 207, 1, (this.reportAbuseMute ? 0xFF8000 : Color.WHITE.toRGB()));

		i = 222;
		let j = Color.WHITE.toRGB();
		if (this.mouseX > 196 && this.mouseX < 316 && this.mouseY > i - 13 && this.mouseY < i + 2)
			j = Color.YELLOW.toRGB();
		this.surface.drawStringCenter('Click here to cancel', 256, i, 1, j);
		if (this.mouseButtonClick === 1) {
			if (this.moderatorLevel > 0 && this.mouseX > 106 && this.mouseX < 406 && this.mouseY > 194 && this.mouseY < 209) {
				this.reportAbuseMute = !this.reportAbuseMute;
				this.mouseButtonClick = 0;
				return;
			} else if (j !== Color.WHITE.toRGB() || this.mouseX < 56 || this.mouseX > 456 || this.mouseY < 130 || this.mouseY > 230) {
				this.mouseButtonClick = 0;
				this.reportAbuseState = 0;
				return;
			}
		}

	}

	showMessage(message, type) {
		if (type === 2 || type === 4 || type === 6) {
			for (let idx = 0; idx < message.length-5 && message[idx] === '@' && message[idx+4] === '@'; ) message = message.substring(idx+5);

			let j = message.indexOf(':');
			if (j > -1) {
				let s1 = message.substring(0, j);
				let l = Utility.usernameToHash(s1);
				if (l > 0) {
					for (let i1 = 0; i1 < this.ignoreListCount; i1++) {
						if (this.ignoreList[i1] === l) {
							return;
						}
					}
				}
			}
		}
		message = message.replace("[GLOBAL] ", "");

		if (type === 2)
			message = '@yel@' + message;

		if (type === 3 || type === 4)
			message = '@whi@' + message;

		if (type === 6)
			message = '@cya@' + message;

		if (this.messageTabSelected !== 0) {
			if (type === 4 || type === 3)
				this.messageTabFlashAll = secondsToFrames(4);

			if (type === 2 && this.messageTabSelected !== 1)
				this.messageTabFlashHistory = secondsToFrames(4);

			if (type === 5 && this.messageTabSelected !== 2)
				this.messageTabFlashQuest = secondsToFrames(4);

			if (type === 6 && this.messageTabSelected !== 3)
				this.messageTabFlashPrivate = secondsToFrames(4);

			if (type === 3 && this.messageTabSelected !== 0)
				this.messageTabSelected = 0;

			if (type === 6 && this.messageTabSelected !== 3 && this.messageTabSelected !== 0)
				this.messageTabSelected = 0;
		}

		this.messageHistory.unshift({ticks: secondsToFrames(6), message: message});

		if (type === 2)
			this.panelGame[GamePanels.CHAT].removeListEntry(this.controlTextListChat, message, this.panelGame[GamePanels.CHAT].controlFlashText[this.controlTextListChat] === this.panelGame[GamePanels.CHAT].controlListEntryCount[this.controlTextListChat] - 4);

		if (type === 5)
			this.panelGame[GamePanels.CHAT].removeListEntry(this.controlTextListQuest, message, this.panelGame[GamePanels.CHAT].controlFlashText[this.controlTextListQuest] === this.panelGame[GamePanels.CHAT].controlListEntryCount[this.controlTextListQuest] - 4);

		if (type === 6)
			this.panelGame[GamePanels.CHAT].removeListEntry(this.controlTextListPrivate, message, this.panelGame[GamePanels.CHAT].controlFlashText[this.controlTextListPrivate] === this.panelGame[GamePanels.CHAT].controlListEntryCount[this.controlTextListPrivate] - 4);
	}

	walkToObject(x, y, id, index) {
		let w = 0;
		let h = 0;

		if (id === 0 || id === 4) {
			w = GameData.objectWidth[index];
			h = GameData.objectHeight[index];
		} else {
			h = GameData.objectWidth[index];
			w = GameData.objectHeight[index];
		}

		if (GameData.objectType[index] === 2 || GameData.objectType[index] === 3) {
			if (id === 0) {
				x--;
				w++;
			}

			if (id === 2) {
				h++;
			}

			if (id === 4) {
				w++;
			}

			if (id === 6) {
				y--;
				h++;
			}

			this.walkToEntity(this.localRegionX, this.localRegionY, x, y, (x + w) - 1, (y + h) - 1, false, true);

		} else {
			this.walkToEntity(this.localRegionX, this.localRegionY, x, y, (x + w) - 1, (y + h) - 1, true, true);

		}
	}

	getInventoryCount(id) {
		let count = 0;

		for (let k = 0; k < this.inventoryItemsCount; k++) {
			if (this.inventoryItemId[k] === id) {
				if (GameData.itemStackable[id] === 1) {
					count++;
				} else {
					count += this.inventoryItemStackCount[k];
				}
			}
		}

		return count;
	}

	drawLoginScreens() {
		this.welcomed = false;
		this.surface.interlace = false;

		this.surface.blackScreen();
		if (this.welcomeState === WelcomeStates.NEW_USER) {
			this.panelLogin[WelcomeStates.NEW_USER].render();
			this.surface.drawSpriteID(0, this.gameHeight - 4, mudclient.spriteMedia + 22);
			this.surface.draw(this.graphics, 0, 0);
			return;
		}

		let layerAlpha = (this.frameCounter * 2) % 3072;
		if (layerAlpha < 1024) {
			this.surface.drawSpriteID(0, 10, mudclient.spriteLogo);

			if (layerAlpha > 768)
				this.surface.fadeThenDrawSpriteID(0, 10, mudclient.spriteLogo + 1, layerAlpha - 768);
		} else if (layerAlpha < 2048) {
			this.surface.drawSpriteID(0, 10, mudclient.spriteLogo + 1);

			if (layerAlpha > 1792)
				this.surface.fadeThenDrawSpriteID(0, 10, mudclient.spriteMedia + 10, layerAlpha - 1792);
		} else {
			this.surface.drawSpriteID(0, 10, mudclient.spriteMedia + 10);

			if (layerAlpha > 2816)
				this.surface.fadeThenDrawSpriteID(0, 10, mudclient.spriteLogo, layerAlpha - 2816);
		}

		if (this.welcomeState === WelcomeStates.WELCOME) {
			this.panelLogin[WelcomeStates.WELCOME].render();
		}

		if (this.welcomeState === WelcomeStates.EXISTING_USER) {
			this.panelLogin[WelcomeStates.EXISTING_USER].render();
		}

		// blue bar
		this.surface.drawSpriteID(0, this.gameHeight - 4, mudclient.spriteMedia + 22);
		this.surface.draw(this.graphics, 0, 0);
	}

	renderConfigurationTab(flag) {
		let uiX = this.surface.width2 - 199;
		let uiY = 36;

		this.surface.drawSpriteID(uiX - 49, 3, mudclient.spriteMedia + 6);

		let uiWidth = 196;

		this.surface.drawBoxAlpha(uiX, 36, uiWidth, 65, Surface.rgbToLong(181, 181, 181), 160);
		this.surface.drawBoxAlpha(uiX, 101, uiWidth, 65, Surface.rgbToLong(201, 201, 201), 160);
		this.surface.drawBoxAlpha(uiX, 166, uiWidth, 95, Surface.rgbToLong(181, 181, 181), 160);
		this.surface.drawBoxAlpha(uiX, 261, uiWidth, 40, Surface.rgbToLong(201, 201, 201), 160);

		let x = uiX + 3;
		let y = uiY + 15;

		this.surface.drawString('Game options - click to toggle', x, y, 1, 0);
		y += 15;

		if (this.optionCameraModeAuto) {
			this.surface.drawString('Camera angle mode - @gre@Auto', x, y, 1, 0xffffff);
		} else {
			this.surface.drawString('Camera angle mode - @red@Manual', x, y, 1, 0xffffff);
		}

		y += 15;

		if (this.optionMouseButtonOne) {
			this.surface.drawString('Mouse buttons - @red@One', x, y, 1, 0xffffff);
		} else {
			this.surface.drawString('Mouse buttons - @gre@Two', x, y, 1, 0xffffff);
		}

		y += 15;

		if (this.optionSoundDisabled) {
			this.surface.drawString('Sound effects - @red@off', x, y, 1, 0xffffff);
		} else {
			this.surface.drawString('Sound effects - @gre@on', x, y, 1, 0xffffff);
		}

		y += 15;
		y += 5;
		this.surface.drawString('Account Settings', x, y, 1, 0);

		let color = 0xFFFFFF;
		y += 15;
		if (this.mouseX > x && this.mouseX < x + uiWidth && this.mouseY > y - 12 && this.mouseY < y + 4)
			color = 0xFFFF00;
		this.surface.drawString('Change password', x, y, 1, color);
		color = 0xFFFFFF;
		y += 15;
		if (this.mouseX > x && this.mouseX < x + uiWidth && this.mouseY > y - 12 && this.mouseY < y + 4)
			color = 0xFFFF00;
		this.surface.drawString('Set recovery questions', x, y, 1, color);
		y += 15;

		y += 5;
/*
		y += 15;
		y += 15;
		this.surface.drawString('To change your contact details,', x, y, 0, 0xffffff);
		y += 15;
		this.surface.drawString('password, recovery questions, etc..', x, y, 0, 0xffffff);
		y += 15;
		this.surface.drawString('please select \'account management\'', x, y, 0, 0xffffff);
		y += 15;

		if (this.referid === 0) {
			this.surface.drawString('from the runescape.com front page', x, y, 0, 0xffffff);
		} else if (this.referid === 1) {
			this.surface.drawString('from the link below the gamewindow', x, y, 0, 0xffffff);
		} else {
			this.surface.drawString('from the runescape front webpage', x, y, 0, 0xffffff);
		}
*/

		this.surface.drawString('Privacy settings. Will be applied to', uiX + 3, y, 1, 0);
		y += 15;
		this.surface.drawString('all people not on your friends list', uiX + 3, y, 1, 0);
		y += 15;

		if (!this.settingsBlockChat) {
			this.surface.drawString('Block chat messages: @red@<off>', uiX + 3, y, 1, 0xffffff);
		} else {
			this.surface.drawString('Block chat messages: @gre@<on>', uiX + 3, y, 1, 0xffffff);
		}

		y += 15;

		if (!this.settingsBlockPrivate) {
			this.surface.drawString('Block private messages: @red@<off>', uiX + 3, y, 1, 0xffffff);
		} else {
			this.surface.drawString('Block private messages: @gre@<on>', uiX + 3, y, 1, 0xffffff);
		}

		y += 15;

		if (!this.settingsBlockTrade) {
			this.surface.drawString('Block trade requests: @red@<off>', uiX + 3, y, 1, 0xffffff);
		} else {
			this.surface.drawString('Block trade requests: @gre@<on>', uiX + 3, y, 1, 0xffffff);
		}

		y += 15;

		if (!this.settingsBlockDuel) {
			this.surface.drawString('Block duel requests: @red@<off>', uiX + 3, y, 1, 0xffffff);
		} else {
			this.surface.drawString('Block duel requests: @gre@<on>', uiX + 3, y, 1, 0xffffff);
		}

		y += 15;
		y += 5;
		this.surface.drawString('Always logout when you finish', x, y, 1, 0);
		y += 15;
		let k1 = 0xffffff;

		if (this.mouseX > x && this.mouseX < x + uiWidth && this.mouseY > y - 12 && this.mouseY < y + 4) {
			k1 = 0xffff00;
		}

		this.surface.drawString('Click here to logout', uiX + 3, y, 1, k1);

		if (!flag) {
			return;
		}

		let mouseX = this.mouseX - (this.surface.width2 - 199);
		let mouseY = this.mouseY - 36;

		if (mouseX >= 0 && mouseY >= 0 && mouseX < 196 && mouseY < 265) {
			// rendering starts 199px from right-hand-side of client?
			let startX = this.surface.width2 - 199;
			// rendering starts 36px from top of client?
			let startY = 36;
			// 196px wide?
			let width = 196;// '\304';
			// Panel elements begin 3px from the left side of the panel?
			let panelX = startX + 3;
			// Panel elements begin 30px below top of panel?
			let panelY = startY + 30;

			if (this.mouseButtonClick === 1) {
				if (this.mouseX > panelX && this.mouseX < panelX + width && this.mouseY > panelY - 12 && this.mouseY < panelY + 4) {
					this.optionCameraModeAuto = !this.optionCameraModeAuto;
					this.clientStream.queue(Ops.SETTINGS(0, this.optionCameraModeAuto));
				}
				if (this.mouseX > panelX && this.mouseX < panelX + width && this.mouseY > panelY+15 - 12 && this.mouseY < panelY+15 + 4) {
					this.optionMouseButtonOne = !this.optionMouseButtonOne;
					this.clientStream.queue(Ops.SETTINGS(2, this.optionMouseButtonOne));
				}
				if (this.mouseX > panelX && this.mouseX < panelX + width && this.mouseY > panelY+30 - 12 && this.mouseY < panelY+30 + 4) {
					this.optionSoundDisabled = !this.optionSoundDisabled;
					this.clientStream.queue(Ops.SETTINGS(3, this.optionSoundDisabled));
				}
			}
			panelY += 45

			panelY += 5;
			panelY += 15;
			// change pass here
			panelY += 15;
			// set recovery questions here
			panelY += 15;

			// Privacy settings label here
			panelY += 5;
			panelY += 15;
			// 2 line label
			panelY += 15;

			if (this.mouseButtonClick === 1) {
				// privacy settings here
				// makes a button with 2 states, on and off
				// neat trick, uninitialized var defaults to 0 and: 1 - 0 == 1 aka true, 1 - 1 == 0 aka false
				if (this.mouseX > panelX && this.mouseX < panelX + width && this.mouseY > panelY - 12 && this.mouseY < panelY + 4) {
					this.settingsBlockChat = 1 - this.settingsBlockChat;
					this.sendPrivacySettings(this.settingsBlockChat, this.settingsBlockPrivate, this.settingsBlockTrade, this.settingsBlockDuel);
				}
				if (this.mouseX > panelX && this.mouseX < panelX + width && this.mouseY > panelY+15 - 12 && this.mouseY < panelY+15 + 4) {
					this.settingsBlockPrivate = 1 - this.settingsBlockPrivate;
					this.sendPrivacySettings(this.settingsBlockChat, this.settingsBlockPrivate, this.settingsBlockTrade, this.settingsBlockDuel);
				}
				if (this.mouseX > panelX && this.mouseX < panelX + width && this.mouseY > panelY+30 - 12 && this.mouseY < panelY+30 + 4) {
					this.settingsBlockTrade = 1 - this.settingsBlockTrade;
					this.sendPrivacySettings(this.settingsBlockChat, this.settingsBlockPrivate, this.settingsBlockTrade, this.settingsBlockDuel);
				}
				if (this.mouseX > panelX && this.mouseX < panelX + width && this.mouseY > panelY+45 - 12 && this.mouseY < panelY+45 + 4) {
					this.settingsBlockDuel = 1 - this.settingsBlockDuel;
					this.sendPrivacySettings(this.settingsBlockChat, this.settingsBlockPrivate, this.settingsBlockTrade, this.settingsBlockDuel);
				}
			}

			panelY += 60;

			panelY += 15;
			panelY += 5;
			if (this.mouseX > panelX && this.mouseX < panelX + width && this.mouseY > panelY - 12 && this.mouseY < panelY + 4 && this.mouseButtonClick === 1)
				this.sendLogout();

			this.mouseButtonClick = 0;
		}
	}

	async loadTextures() {
		let buffTextures = await this.readDataFile('textures' + VERSION.TEXTURES + '.jag', 'Textures', 50);

		if (!buffTextures) {
			this.runtimeException = new GameException("Error loading textures!\n\n" + e.message, true);
			return;
		}

		let buffIndex = Utility.loadData('index.dat', 0, buffTextures);
		this.scene.allocateTextures(GameData.textureCount, 7, 11);
		for (let i = 0; i < GameData.textureCount; i++) {
			let name = GameData.textureName[i];
			let buff1 = Utility.loadData(name + '.dat', 0, buffTextures);

			this.surface.parseSprite(mudclient.spriteTexture, buff1, buffIndex, 1);
			// 128x128 magenta/pink box at 0,0
			this.surface.drawBox(0, 0, 128, 128, 0xFF00FF);
			this.surface.drawSpriteID(0, 0, mudclient.spriteTexture);

			let width = this.surface.spriteWidthFull[mudclient.spriteTexture];
			let nameSub = GameData.textureSubtypeName[i];

			if (nameSub && nameSub.length > 0) {
				let buff2 = Utility.loadData(nameSub + '.dat', 0, buffTextures);

				this.surface.parseSprite(mudclient.spriteTexture, buff2, buffIndex, 1);
				this.surface.drawSpriteID(0, 0, mudclient.spriteTexture);
			}

			this.surface._drawSprite_from5(mudclient.spriteTextureWorld + i, 0, 0, width, width);

			let area = width * width;

			// below replaces max green pixels with purple/pink (max red and max blue) pixels
			for (let j = 0; j < area; j++)
				if (this.surface.surfacePixels[mudclient.spriteTextureWorld + i][j] === 0x00FF00)
					this.surface.surfacePixels[mudclient.spriteTextureWorld + i][j] = 0xFF00FF;

			this.surface.drawWorld(mudclient.spriteTextureWorld + i);
			this.scene.defineTexture(i, this.surface.spriteColoursUsed[mudclient.spriteTextureWorld + i], this.surface.spritePalettes[mudclient.spriteTextureWorld + i], (width >> 6) - 1);
		}
	}

	handleMouseDown(button, x, y) {
		// this.mouseClickXHistory[this.mouseClickCount] = x;
		// this.mouseClickYHistory[this.mouseClickCount] = y;
		// this.mouseClickCount = (this.mouseClickCount++) & 0x1FFF;

		// TODO: Audit mouse history array usage and figure out reason for them
		// So post-audit, this looks to be a tremendous drain of resources in an environment which
		// I would like to squeeze the most out of.  Basically loops about 8e6 times for every click
		// made in-game
		// for (let l = 10; l < 4000; l++) { // l=range(10,3999)
			// let clickIdx = this.mouseClickCount - l & 0x1FFF;
// 
			// if (this.mouseClickXHistory[clickIdx] === x && this.mouseClickYHistory[clickIdx] === y) {
				// let flag = false;
// 
				// for (let j1 = 1; j1 < l; j1++) {
					// let firstIdx = this.mouseClickCount - j1 & 0x1FFF;
					// let secondIdx = clickIdx - j1 & 0x1FFF;
// 
					// // mouse history not equal to x,y from caller
					// if (this.mouseClickXHistory[secondIdx] !== x || this.mouseClickYHistory[secondIdx] !== y)
						// flag = true;
// 
					// if (this.mouseClickXHistory[firstIdx] !== this.mouseClickXHistory[secondIdx] || this.mouseClickYHistory[firstIdx] !== this.mouseClickYHistory[secondIdx])
						// break;
// 
					// if (secondIdx === l - 1 && flag && this.combatTimeout === 0 && this.logoutBoxFrames === 0) {
						// this.sendLogout();
						// return;
					// }
				// }
			// }
		// }
	}

	drawTeleportBubble(x, y, w, h, id, tx, ty) {
		let type = this.teleportBubbleType[id];
		let time = this.teleportBubbleTime[id];

		if (type === 0) {
			// let j2 = 0x0000FF + time * 5 * 256;
			// this.surface.drawCircle(x + (w >> 1), y + (h >> 1), 20 + time * 2, 0x0000FF + time * 5 * 256, 0xFF - time * 5);
			this.surface.drawCircle(x + (w >> 1), y + (h >> 1), 20 + (time << 1), 0x00FF00 + time * 0x500, 0xFF - time * 5);
		}

		if (type === 1) {
			// let k2 = 0xFF0000 + time * 5 * 256;
			this.surface.drawCircle(x + (w >> 1), y + (h >> 1), 10 + time, 0xFF0000 + time * 0x500, 0xFF - time * 5);
			// this.surface.drawCircle(x + ((w / 2) | 0), y + ((h / 2) | 0), 10 + time, k2, 0xFF - time * 5);
		}
		if (type === 2) {
			// let k2 = 0xFF0000 + time * 5 * 256;
			this.surface.drawCircle(x + (w >> 1), y + (h >> 1), 10 + time, 0xFF0000 + time * 0x500, 0xFF - time * 5);
			// this.surface.drawCircle(x + ((w / 2) | 0), y + ((h / 2) | 0), 10 + time, k2, 0xFF - time * 5);
		}
	}

	showServerMessage(s) {
		if (/^@bor@/.test(s)) {
			this.showMessage(s, 4);
			return;
		}

		if (/^@que@/.test(s)) {
			this.showMessage('@whi@' + s, 5);
			return;
		}

		if (/^@pri@/.test(s)) {
			this.showMessage(s, 6);
			return;
		}

		this.showMessage(s, 3);
	}

	// looks like it just updates objects like torches etc to flip between the different models and appear "animated"
	updateObjectAnimation(i, s) {
		let j = this.objectX[i];
		let k = this.objectY[i];
		let l = j - (this.localPlayer.currentX >>> 7);
		let i1 = k - (this.localPlayer.currentY >>> 7);
		let byte0 = 7;

		if (j >= 0 && k >= 0 && j < 96 && k < 96 && l > -byte0 && l < byte0 && i1 > -byte0 && i1 < byte0) {
			this.scene.removeModel(this.objectModel[i]);

			let j1 = GameData.getModelIndex(s);
			let gameModel = this.gameModels[j1].copy();

			this.scene.addModel(gameModel);
			gameModel.createGouraudLightSource(true, 48, 48, -50, -10, -50);
			gameModel.copyPosition(this.objectModel[i]);
			gameModel.key = i;
			this.objectModel[i] = gameModel;
		}
	}

	isClicking() {
		return this.mouseButtonClick === 1 || this.isMiddleClicking();
	}

	isRightClicking() {
		return this.mouseButtonClick === 2 || (this.optionMouseButtonOne && this.isClicking());
	}

	isMiddleClicking() {
		return this.mouseButtonClick === 3;
	}

	sortContextMenu() {
		// lets reset the indices
		for (let i = 0; i < this.menuItemsCount; i++)
			this.menuIndices[i] = i;
		// now we'll loop repeatedly from top to bottom of entry list, and if any adjacent nodes get moved, loop through the list all over
		// we stop once we can iterate the entire entry set without reordering any entries.
sorter:
		while (true) {
			for (let idx = 0; idx < this.menuItemsCount - 1; idx++) {
				if (this.menuItemID[this.menuIndices[idx]] > this.menuItemID[this.menuIndices[idx+1]]) {
					let higher = this.menuIndices[idx];
					this.menuIndices[idx] = this.menuIndices[idx+1];
					this.menuIndices[idx+1] = higher;
					continue sorter;
				}
			}
			break sorter;
		}
	}

	handleDefaultClick() {
		if (this.selectedSpell >= 0 || this.selectedItemInventoryIndex >= 0) {
			this.menuItemText1[this.menuItemsCount] = 'Cancel';
			this.menuItemText2[this.menuItemsCount] = '';
			this.menuItemID[this.menuItemsCount] = 4000;
			this.menuItemsCount++;
		}

		this.sortContextMenu();

		if (this.menuItemsCount > 20)
			this.menuItemsCount = 20;

		if (this.menuItemsCount > 0) {
			let defaultAction = -1;

			for (let entry = 0; entry < this.menuItemsCount; entry++) {
				let idx = this.menuIndices[entry];
				if (this.menuItemText2[idx] && this.menuItemText2[idx].length > 0) {
					defaultAction = entry;
					break;
				}
			}

			if (this.selectedItemInventoryIndex >= 0 || this.selectedSpell >= 0) {
				if (this.menuItemsCount === 1)
					this.surface.drawString('Choose a target' + (
						'@whi@' + this.menuItemsCount === 2 ? ' / 1 more option' : (this.menuItemsCount > 2 ? ' / '+(this.menuItemsCount-1)+' more options' : '')
					), 6, 14, 1, 0xFFFF00);
				else if (this.menuItemsCount > 1)
					this.surface.drawString('@whi@' + this.menuItemText1[this.menuIndices[0]] + ' ' + this.menuItemText2[this.menuIndices[0]] + (
						'@whi@' + this.menuItemsCount === 2 ? ' / 1 more option' : (this.menuItemsCount > 2 ? ' / '+(this.menuItemsCount-1)+' more options' : '')
					), 6, 14, 1, 0xFFFF00);
			} else if (defaultAction >= 0)
				this.surface.drawString(this.menuItemText2[this.menuIndices[defaultAction]] + ': @whi@' + this.menuItemText1[this.menuIndices[0]] + (
					'@whi@' + this.menuItemsCount === 2 ? ' / 1 more option' : (this.menuItemsCount > 2 ? ' / '+(this.menuItemsCount-1)+' more options' : '')
				), 6, 14, 1, 0xFFFF00);

			if (this.isClicking() && this.menuItemsCount >= 1) {
				this.menuItemClick(this.menuIndices[0]);
				this.mouseButtonClick = 0;
				return;
			}

			if (this.isRightClicking()) {
				this.menuHeight = (this.menuItemsCount + 1) * 15;
				this.menuWidth = this.surface.textWidth('Choose option', 1) + 5;

				for (let entry = 0; entry < this.menuItemsCount; entry++) {
					let len = this.surface.textWidth(this.menuItemText2[entry] + ' ' + this.menuItemText1[entry], 1) + 5;

					if (len > this.menuWidth)
						this.menuWidth = len;
				}

				this.menuX = Math.max(0, this.mouseX - Math.floor(this.menuWidth / 2));
				if (this.menuX + this.menuWidth > 510)
					this.menuX = 510 - this.menuWidth;
				this.menuY = Math.max(0, this.mouseY - 7);
				if (this.menuY + this.menuHeight > 315)
					this.menuY = 315 - this.menuHeight;

				this.visibleContextMenu = true;
				this.mouseButtonClick = 0;
				return;
			}
		}
	}

	renderLogoutNotification() {
		// black box
		this.surface.drawBox(126, 137, 260, 60, 0x0);
		// white border
		this.surface.drawBoxEdge(126, 137, 260, 60, 0xFFFFFF);
		this.surface.drawStringCenter('Logging out...', 256, 173, 5, 0xFFFFFF);
	}

	renderFightModeSelect() {
		let byte0 = 7;
		let byte1 = 15;
		let width = 175;

		if (this.mouseButtonClick !== 0) {
			for (let i = 0; i < 5; i++) {
				if (i <= 0 || this.mouseX <= byte0 || this.mouseX >= byte0 + width || this.mouseY <= byte1 + i * 20 || this.mouseY >= byte1 + i * 20 + 20)
					continue;
				this.combatStyle = i - 1;
				this.mouseButtonClick = 0;
				this.clientStream.queue(Ops.FIGHT_STYLE(this.combatStyle));
				break;
			}
		}

		for (let j = 0; j < 5; j++) {
			if (j === this.combatStyle + 1)
				this.surface.drawBoxAlpha(byte0, byte1 + j * 20, width, 20, Surface.rgbToLong(255, 0, 0), 128);
			else
				this.surface.drawBoxAlpha(byte0, byte1 + j * 20, width, 20, Surface.rgbToLong(190, 190, 190), 128);

			this.surface.drawLineHoriz(byte0, byte1 + j * 20, width, 0);
			this.surface.drawLineHoriz(byte0, byte1 + j * 20 + 20, width, 0);
		}

		this.surface.drawStringCenter('Select combat style', byte0 + ((width / 2) | 0), byte1 + 16, 3, 0xffffff);
		this.surface.drawStringCenter('Controlled (+1 of each)', byte0 + ((width / 2) | 0), byte1 + 36, 3, 0);
		this.surface.drawStringCenter('Aggressive (+3 strength)', byte0 + ((width / 2) | 0), byte1 + 56, 3, 0);
		this.surface.drawStringCenter('Accurate   (+3 attack)', byte0 + ((width / 2) | 0), byte1 + 76, 3, 0);
		this.surface.drawStringCenter('Defensive  (+3 defense)', byte0 + ((width / 2) | 0), byte1 + 96, 3, 0);
	}

	menuItemClick(i) {
		let mx = this.menuItemX[i];
		let my = this.menuItemY[i];
		let mIdx = this.menuSourceType[i];
		let mSrcIdx = this.menuSourceIndex[i];
		let mTargetIndex = this.menuTargetIndex[i];
		let mItemId = this.menuItemID[i];

		if (mItemId === 200) {
			this.walkToGroundItem(this.localRegionX, this.localRegionY, mx, my, true);
			this.clientStream.queue(Ops.CAST_GROUND_ITEM(mx, my, mIdx, mSrcIdx));
			this.selectedSpell = -1;
		}

		if (mItemId === 210) {
			this.walkToGroundItem(this.localRegionX, this.localRegionY, mx, my, true);
			this.clientStream.queue(Ops.ON_GROUND_ITEM(mx, my, mIdx, mSrcIdx));
			this.selectedItemInventoryIndex = -1;
		}

		if (mItemId === 220) {
			this.walkToGroundItem(this.localRegionX, this.localRegionY, mx, my, true);
			this.clientStream.queue(Ops.TAKE_GROUND_ITEM(mx, my, mIdx, mSrcIdx));
		}

		if (mItemId === 3200) {
			this.showMessage(GameData.itemDescription[mIdx], 3);
		}

		if (mItemId === 300) {
			this.walkToWallObject(mx, my, mIdx);
			this.clientStream.queue(Ops.CAST_BOUNDARY(mx, my, mIdx, mSrcIdx));
			this.selectedSpell = -1;
		}

		if (mItemId === 310) {
			this.walkToWallObject(mx, my, mIdx);
			this.clientStream.queue(Ops.ON_BOUNDARY(mx, my, mIdx, mSrcIdx));
			this.selectedItemInventoryIndex = -1;
		}

		if (mItemId === 320) {
			this.walkToWallObject(mx, my, mIdx);
			this.clientStream.queue(Ops.BOUNDARY_ACTION(0, mx, my, mIdx));
		}

		if (mItemId === 2300) {
			this.walkToWallObject(mx, my, mIdx);
			this.clientStream.queue(Ops.BOUNDARY_ACTION(1, mx, my, mIdx));
		}

		if (mItemId === 3300) {
			this.showMessage(GameData.wallObjectDescription[mIdx], 3);
		}

		if (mItemId === 400) {
			this.walkToObject(mx, my, mIdx, mSrcIdx);
			this.clientStream.queue(Ops.CAST_SCENARY(mx, my, mTargetIndex));
			this.selectedSpell = -1;
		}

		if (mItemId === 410) {
			this.walkToObject(mx, my, mIdx, mSrcIdx);
			this.clientStream.queue(Ops.ON_SCENARY(mx, my, mTargetIndex));
			this.selectedItemInventoryIndex = -1;
		}

		if (mItemId === 420) {
			this.walkToObject(mx, my, mIdx, mSrcIdx);
			this.clientStream.queue(Ops.SCENARY_ACTION(0, mx, my));
		}

		if (mItemId === 2400) {
			this.walkToObject(mx, my, mIdx, mSrcIdx);
			this.clientStream.queue(Ops.SCENARY_ACTION(1, mx, my));
		}

		if (mItemId === 3400) {
			this.showMessage(GameData.objectDescription[mIdx], 3);
		}

		if (mItemId === 600) {
			this.clientStream.queue(Ops.CAST_INVENTORY(mIdx, mSrcIdx));
			this.selectedSpell = -1;
		}

		if (mItemId === 610) {
			this.clientStream.queue(Ops.ON_INVENTORY(mIdx, mSrcIdx));
			this.selectedItemInventoryIndex = -1;
		}

		if (mItemId === 620) {
			this.clientStream.queue(Ops.UNEQUIP(mIdx));
		}

		if (mItemId === 630) {
			this.clientStream.queue(Ops.EQUIP(mIdx));
		}

		if (mItemId === 640) {
			this.clientStream.queue(Ops.INVENTORY_ACTION(mIdx));
		}

		if (mItemId === 650) {
			this.selectedItemInventoryIndex = mIdx;
			this.showUiTab = 0;
			this.selectedItemName = GameData.itemName[this.inventoryItemId[this.selectedItemInventoryIndex]];
		}

		if (mItemId === 660) {
			this.clientStream.queue(Ops.DROP_ITEM(mIdx));
			this.selectedItemInventoryIndex = -1;
			this.showUiTab = 0;
			this.showMessage('Dropping ' + GameData.itemName[this.inventoryItemId[mIdx]], 4);
		}

		if (mItemId === 3600) {
			this.showMessage(GameData.itemDescription[mIdx], 3);
		}

		if (mItemId === 700) {
			let l1 = (mx - 64) / this.tileSize | 0;
			let l3 = (my - 64) / this.tileSize | 0;

			this.walkToMob(this.localRegionX, this.localRegionY, l1, l3, true);
			this.clientStream.queue(Ops.CAST_NPC(mIdx, mSrcIdx));
			this.selectedSpell = -1;
		}

		if (mItemId === 710) {
			let i2 = (mx - 64) / this.tileSize | 0;
			let i4 = (my - 64) / this.tileSize | 0;

			this.walkToMob(this.localRegionX, this.localRegionY, i2, i4, true);
			this.clientStream.queue(Ops.ON_NPC(mIdx, mSrcIdx));
			this.selectedItemInventoryIndex = -1;
		}

		if (mItemId === 720) {
			let j2 = (mx - 64) / this.tileSize | 0;
			let j4 = (my - 64) / this.tileSize | 0;

			this.walkToMob(this.localRegionX, this.localRegionY, j2, j4, true);
			this.clientStream.queue(Ops.TALK_NPC(mIdx));
		}

		if (mItemId === 725) {
			let k2 = (mx - 64) / this.tileSize | 0;
			let k4 = (my - 64) / this.tileSize | 0;

			this.walkToMob(this.localRegionX, this.localRegionY, k2, k4, true);
			this.clientStream.queue(Ops.NPC_ACTION(mIdx));
		}

		if (mItemId === 715 || mItemId === 2715) {
			let l2 = (mx - 64) / this.tileSize | 0;
			let l4 = (my - 64) / this.tileSize | 0;

			this.walkToMob(this.localRegionX, this.localRegionY, l2, l4, true);
			this.clientStream.queue(Ops.ATTACK_NPC(mIdx));
		}

		if (mItemId === 3700) {
			this.showMessage(GameData.npcDescription[mIdx], 3);
		}

		if (mItemId === 800) {
			let i3 = (mx - 64) / this.tileSize | 0;
			let i5 = (my - 64) / this.tileSize | 0;

			this.walkToMob(this.localRegionX, this.localRegionY, i3, i5, true);
			this.clientStream.queue(Ops.CAST_PLAYER(mIdx, mSrcIdx));
			this.selectedSpell = -1;
		}

		if (mItemId === 810) {
			let j3 = (mx - 64) / this.tileSize | 0;
			let j5 = (my - 64) / this.tileSize | 0;

			this.walkToMob(this.localRegionX, this.localRegionY, j3, j5, true);
			this.clientStream.queue(Ops.ON_PLAYER(mIdx, mSrcIdx));
			this.selectedItemInventoryIndex = -1;
		}

		if (mItemId === 805 || mItemId === 2805) {
			let k3 = (mx - 64) / this.tileSize | 0;
			let k5 = (my - 64) / this.tileSize | 0;

			this.walkToMob(this.localRegionX, this.localRegionY, k3, k5, true);
			this.clientStream.queue(Ops.ATTACK_PLAYER(mIdx, mSrcIdx));
		}

		if (mItemId === 2806) {
			this.clientStream.queue(Ops.REQUEST_DUEL(mIdx));
		}

		if (mItemId === 2810) {
			this.clientStream.queue(Ops.REQUEST_TRADE(mIdx));
		}

		if (mItemId === 2820) {
			this.clientStream.queue(Ops.FOLLOW(mIdx));
		}

		if (mItemId === 900) {
			this.walkToMob(this.localRegionX, this.localRegionY, mx, my, true);
			this.clientStream.queue(Ops.CAST_GROUND(mx, my, this.selectedSpell));
			this.selectedSpell = -1;
		}

		if (mItemId === 920) {
			this.walkToMob(this.localRegionX, this.localRegionY, mx, my, false);

			if (this.mouseClickXStep === -24)
				this.mouseClickXStep = 24;
		}

		if (mItemId === 1000) {
			this.clientStream.queue(Ops.CAST_SELF(this.selectedSpell));
			this.selectedSpell = -1;
		}

		if (mItemId === 4000) {
			this.selectedItemInventoryIndex = -1;
			this.selectedSpell = -1;
		}
	}

	updateWelcomeStatuses(s, s1) {
		switch (this.welcomeState) {
		case WelcomeStates.NEW_USER:
			this.panelLogin[WelcomeStates.NEW_USER].setTextHandle(this.controlRegisterStatus, `${s} ${s1}`);
			break;
		case WelcomeStates.EXISTING_USER:
			this.panelLogin[WelcomeStates.EXISTING_USER].setTextHandle(this.controlLoginStatus, `${s} ${s1}`);
			break;
		default:
			break;
		}

		this.drawLoginScreens();
		this.unsetFrameTimes();
	}

	async lostConnection() {
		if (this.logoutBoxFrames !== 0) {
			this.resetLoginPanels();
			return;
		}

		await super.lostConnection();
	}

	isValidCameraAngle(i) {
		// server tiles translate to mesh model tiles in multiples of 128
		// the right shift of first 7 bits off the top of the value gives us the server coords.
		// mesh tiles = server tiles * 128
		let j = this.localPlayer.currentX >>> 7;
		let k = this.localPlayer.currentY >>> 7;

		// check within 2 tiles of our player
		for (let l = 2; l > 0; l--) {
			// TODO: Check cache map-data loading routines and determine significance of 7th bit.
			// I have this feeling it's the we've got a roof bit
			// NorthWest check x,y-l;x-l,y;x-l,y-l; = toward northeast
			if (i === 1 && ((this.world.objectAdjacency.get(j, k - l) & 0x80) === 0x80 || (this.world.objectAdjacency.get(j - l, k) & 0x80) === 0x80 || (this.world.objectAdjacency.get(j - l, k - l) & 0x80) === 0x80))
				return false;

			// SouthWest check x,y+l;x-l,y;x-l,y+l = toward southeast
			if (i === 3 && ((this.world.objectAdjacency.get(j, k + l) & 0x80) === 0x80 || (this.world.objectAdjacency.get(j - l, k) & 0x80) === 0x80 || (this.world.objectAdjacency.get(j - l, k + l) & 0x80) === 0x80))
				return false;

			// SouthEast check x,y+l;x+l,y;x+l,y+l = toward southwest
			if (i === 5 && ((this.world.objectAdjacency.get(j, k + l) & 0x80) === 0x80 || (this.world.objectAdjacency.get(j + l, k) & 0x80) === 0x80 || (this.world.objectAdjacency.get(j + l, k + l) & 0x80) === 0x80))
				return false;

			// NorthEast check x,y-l;x+l,y;x+l,y-l toward northwest
			if (i === 7 && ((this.world.objectAdjacency.get(j, k - l) & 0x80) === 0x80 || (this.world.objectAdjacency.get(j + l, k) & 0x80) === 0x80 || (this.world.objectAdjacency.get(j + l, k - l) & 0x80) === 0x80))
				return false;

			// North check x,y-l = north
			if (i === 0 && (this.world.objectAdjacency.get(j, k - l) & 0x80) === 0x80)
				return false;

			// West check x-l,y = east
			if (i === 2 && (this.world.objectAdjacency.get(j - l, k) & 0x80) === 0x80)
				return false;

			// South check x,y+l = south
			if (i === 4 && (this.world.objectAdjacency.get(j, k + l) & 0x80) === 0x80)
				return false;

			// East check x+l,y = west
			if (i === 6 && (this.world.objectAdjacency.get(j + l, k) & 0x80) === 0x80)
				return false;
		}

		return true;
	}

	static getCookie() {
		return getCookie(s);
	}

	resetGameState() {
		this.gameState = GameStates.LOGIN;
		this.welcomeState = WelcomeStates.WELCOME;
		this.loginUser = getCookie('username');
		if (!this.loginPass)
			this.loginPass = '';
		this.playerCount = 0;
		this.npcCount = 0;
	}

	// TODO: let's move each of these to its own file
	handleIncomingPacket(opcode, psize, pdata) {
		try {
			let offset = 1;
			if (opcode === S_OPCODES.REGION_PLAYERS) {
				this.knownPlayerCount = this.playerCount;
				// this.knownPlayers = this.players.slice(0, this.knownPlayerCount);
				for (let idx = 0; idx < this.knownPlayerCount; idx++) this.knownPlayers[idx] = this.players[idx];

				let bitOffset = offset<<3;
				this.localRegionX = Utility.getBitMask(pdata, bitOffset, 11);
				bitOffset += 11;
				this.localRegionY = Utility.getBitMask(pdata, bitOffset, 13);
				bitOffset += 13;
				let localSprite = Utility.getBitMask(pdata, bitOffset, 4);
				bitOffset += 4;

				let loadedNewSector = this.loadNextRegion(this.localRegionX, this.localRegionY);

				this.localRegionX -= this.regionX;
				this.localRegionY -= this.regionY;

				// 3D landscape model coordinates location??
				let meshX = this.localRegionX * this.tileSize + 64;
				let meshY = this.localRegionY * this.tileSize + 64;

				if (loadedNewSector) {
					// Reset path upon sector reload, prevents cached waypoint 3D coords invalidation
					this.localPlayer.waypointCurrent = 0;
					this.localPlayer.targetWaypoint = 0;
					this.localPlayer.currentX = this.localPlayer.waypointsX[0] = meshX;
					this.localPlayer.currentY = this.localPlayer.waypointsY[0] = meshY;
				}

				this.playerCount = 0;
				this.localPlayer = this.createPlayer(this.localPlayerServerIndex, meshX, meshY, localSprite);

				let knownMobCount = Utility.getBitMask(pdata, bitOffset, 8);
				bitOffset += 8;
				for (let mobIndex = 0; mobIndex < knownMobCount; mobIndex++) {
					let mobToUpdate = this.knownPlayers[mobIndex + 1];
					if (Utility.getBitMask(pdata, bitOffset++, 1) !== 0) {
						if (Utility.getBitMask(pdata, bitOffset++, 1) === 0) {
							let direction = Utility.getBitMask(pdata, bitOffset, 3);
							bitOffset += 3;
							let step = mobToUpdate.waypointCurrent;
							let curX = mobToUpdate.waypointsX[step];
							let curY = mobToUpdate.waypointsY[step];

							switch(direction) {
							case 1:
							case 2:
							case 3:
								curX += this.tileSize;
								break;
							case 5:
							case 6:
							case 7:
								curX -= this.tileSize;
								break;
							}
							switch(direction) {
							case 3:
							case 4:
							case 5:
								curY += this.tileSize;
								break;
							case 7:
							case 0:
							case 1:
								curY -= this.tileSize;
								break;
							}

							mobToUpdate.animationNext = direction;
							mobToUpdate.waypointCurrent = step = (step+1) % 10;
							mobToUpdate.waypointsX[step] = curX;
							mobToUpdate.waypointsY[step] = curY;
						} else {
							let status = Utility.getBitMask(pdata, bitOffset, 4);
							bitOffset += 2;
							// Removing a mob uses only 2 bits, continue to next mob in list
							if (status&0b1100 === 0b1100)
								continue;

							// this branch is mainly for combat initiation, as the
							// bits needed to store a right fighting stance is more 
							// than what's needed for walk directions...
							// Sometimes we could see this if npcs change dir to face
							// a player or etc too
							mobToUpdate.animationNext = status;
							bitOffset += 2;
						}
					}

					this.players[this.playerCount++] = mobToUpdate;
				}

				let newCount = 0;
				// add 24 bits to the offset to represent the header for this packet
				while (bitOffset+24 < psize<<3) {
					let serverIndex = Utility.getBitMask(pdata, bitOffset, 11);
					bitOffset += 11;

					let areaX = Utility.getBitMask(pdata, bitOffset, 5);
					bitOffset += 5;
					if (areaX > 15)
						areaX -= 32;

					let areaY = Utility.getBitMask(pdata, bitOffset, 5);
					bitOffset += 5;
					if (areaY > 15)
						areaY -= 32;

					let direction = Utility.getBitMask(pdata, bitOffset, 4);
					bitOffset += 4;

					let meshX = (this.localRegionX + areaX) * this.tileSize + 64;
					let meshY = (this.localRegionY + areaY) * this.tileSize + 64;

					this.createPlayer(serverIndex, meshX, meshY, direction);
					// TODO: Erase for 235
					// if (Utility.getBitMask(pdata, bitOffset++, 1) === 0)
						// this.playersServerIndexes[newCount++] = serverIndex;
				}

				// if (newCount > 0) {
					// // TODO: Erase for 235
					// this.clientStream.queue(Ops.GET_PLAYER_TICKETS(newCount));
				// }

				return;
			}

			if (opcode === S_OPCODES.REGION_GROUND_ITEMS) {
				for (; offset < psize; )
					if (Utility.getUnsignedByte(pdata[offset]) === 0xFF) {
						offset++;
						// The target should be removed when the first byte is maxed out
						// determine mesh-chunk (8x8 tiles in a square) coordinates from
						// the entity location deltas
						let deltamX = this.localRegionX + pdata[offset++] >> 3;
						let deltamY = this.localRegionY + pdata[offset++] >> 3;

						let savedItems = 0;
						for (let item = 0; item < this.groundItemCount; item++) {
							let itemDeltaX = (this.groundItemX[item] >> 3) - deltamX;
							let itemDeltaY = (this.groundItemY[item] >> 3) - deltamY;

							if (itemDeltaX === 0 && itemDeltaY === 0)
								continue;

							if (savedItems !== item) {
								this.groundItemX[savedItems] = this.groundItemX[item];
								this.groundItemY[savedItems] = this.groundItemY[item];
								this.groundItemId[savedItems] = this.groundItemId[item];
								this.groundItemZ[savedItems] = this.groundItemZ[item];
							}
 							savedItems++;
						}

						this.groundItemCount = savedItems;
					} else {
						let itemID = Utility.getUnsignedShort(pdata, offset);
						offset += 2;

						let deltamX = this.localRegionX + pdata[offset++];
						let deltamY = this.localRegionY + pdata[offset++];

						if ((itemID & 0x8000) === 0) {
							this.groundItemX[this.groundItemCount] = deltamX;
							this.groundItemY[this.groundItemCount] = deltamY;
							this.groundItemId[this.groundItemCount] = itemID;
							this.groundItemZ[this.groundItemCount] = 0;

							for (let k23 = 0; k23 < this.objectCount; k23++) {
								if (this.objectX[k23] !== deltamX || this.objectY[k23] !== deltamY) {
									continue;
								}

								// TODO: Investigate if this handles objects covering 2 tiles
								this.groundItemZ[this.groundItemCount] = GameData.objectElevation[this.objectId[k23]];
								break;
							}

							this.groundItemCount++;
						} else {
							// The bit for removing one specific ID at one specific tile was set
							itemID &= 0x7FFF;

							let savedItems = 0;
							for (let item = 0; item < this.groundItemCount; item++) {
								if (this.groundItemX[item] === deltamX && this.groundItemY[item] === deltamY && this.groundItemId[item] === itemID) {
									itemID = -123;
									continue
								}
					//			if (item === savedItems)
					//				continue;
								this.groundItemX[savedItems] = this.groundItemX[item];
								this.groundItemY[savedItems] = this.groundItemY[item];
								this.groundItemId[savedItems] = this.groundItemId[item];
								this.groundItemZ[savedItems++] = this.groundItemZ[item];
							}

							this.groundItemCount = savedItems;
						}
					}

				return;
			}

			if (opcode === S_OPCODES.REGION_OBJECTS) {
				for (let i1 = 1; i1 < psize; ) {
					if (Utility.getUnsignedByte(pdata[i1]) === 0xFF) {
						let chunkX = this.localRegionX + pdata[i1+1] >> 3;
						let chunkY = this.localRegionY + pdata[i1+2] >> 3;
						i1 += 3;

						let listIndex = 0;
						for (let idx = 0; idx < this.objectCount; idx++) {
							let deltaX = (this.objectX[idx] >> 3) - chunkX;
							let deltaY = (this.objectY[idx] >> 3) - chunkY;

							if (deltaX !== 0 || deltaY !== 0) {
								if (idx !== listIndex) {
									this.objectModel[listIndex] = this.objectModel[idx];
									this.objectModel[listIndex].key = listIndex;
									this.objectX[listIndex] = this.objectX[idx];
									this.objectY[listIndex] = this.objectY[idx];
									this.objectId[listIndex] = this.objectId[idx];
									this.objectDirection[listIndex] = this.objectDirection[idx];
								}
								listIndex++;
								continue;
							}
							this.scene.removeModel(this.objectModel[idx]);
							this.world.removeObject(this.objectX[idx], this.objectY[idx], this.objectId[idx]);
						}

						this.objectCount = listIndex;
					} else {
						let id = Utility.getUnsignedShort(pdata, i1);
						i1 += 2;

						let deltaX = this.localRegionX + pdata[i1++];
						let deltaY = this.localRegionY + pdata[i1++];
						let listIndex = 0;

						for (let idx = 0; idx < this.objectCount; idx++) {
							if (this.objectX[idx] !== deltaX || this.objectY[idx] !== deltaY) {
								if (idx !== listIndex) {
									this.objectModel[listIndex] = this.objectModel[idx];
									this.objectModel[listIndex].key = listIndex;
									this.objectX[listIndex] = this.objectX[idx];
									this.objectY[listIndex] = this.objectY[idx];
									this.objectId[listIndex] = this.objectId[idx];
									this.objectDirection[listIndex] = this.objectDirection[idx];
								}

								listIndex++;
							} else {
								this.scene.removeModel(this.objectModel[idx]);
								this.world.removeObject(this.objectX[idx], this.objectY[idx], this.objectId[idx]);
							}
						}

						this.objectCount = listIndex;

						if (id !== 0xEA60) {
							// this is kinda neat.  The game seems to figure out
							// the orientation for a scenary object from the maps
							// in the cache files.  One would assume it was detailed
							// in the protocol, but it is not!
							let direction = this.world.getTileDirection(deltaX, deltaY);
							let height = GameData.objectHeight[id];
							let width = GameData.objectWidth[id];

							if (direction !== 0 && direction !== 4) {
								height = GameData.objectWidth[id];
								width = GameData.objectHeight[id];
							}

							let mX = ((deltaX + deltaX + width ) * this.tileSize) >> 1;
							let mY = ((deltaY + deltaY + height) * this.tileSize) >> 1;
							let modelIdx = GameData.objectModelIndex[id];
							let model = this.gameModels[modelIdx].copy();

							this.scene.addModel(model);

							// index?
							model.key = this.objectCount;
							// Each direction has a granularity of 32 rotation units
							// this shift acts same as direction*32
							model.rotate(0, direction << 5, 0);
							// Move the model up/down to wherever they need to be
							model.translate(mX, -this.world.getElevation(mX, mY), mY);
							// Standard daylight uses -50, -10, -50 as coords, 48,48 as ambience/magnitude, or something
							// Strong possibility these are not really what the values represent just a novice with 3D math
							model.createGouraudLightSource(true, 48, 48, -50, -10, -50);

							this.world.removeObject2(deltaX, deltaY, id);

							if (id === WINDMILL) {
								// Windmill goes way up into the air, 480 units into the air to be precise...
								model.translate(0, -480, 0);
							}

							this.objectX[this.objectCount] = deltaX;
							this.objectY[this.objectCount] = deltaY;
							this.objectId[this.objectCount] = id;
							this.objectDirection[this.objectCount] = direction;
							this.objectModel[this.objectCount++] = model;
						}
					}
				}

				return;
			}

			if (opcode === S_OPCODES.INVENTORY_ITEMS) {
				let offset = 1;
				
				this.inventoryItemsCount = Utility.getUnsignedByte(pdata[offset++]);
				for (let i = 0; i < this.inventoryItemsCount; i++) {
					this.inventoryItemId[i] = Utility.getUnsignedShort(pdata, offset) & 0x7FFF;
					this.inventoryEquipped[i] = this.inventoryItemId[i] !== Utility.getUnsignedShort(pdata, offset);
					offset += 2;

					if (GameData.itemStackable[this.inventoryItemId[i]] !== 0) {
						this.inventoryItemStackCount[i] = 1;
						continue;
					}
					this.inventoryItemStackCount[i] = Utility.getSmart08_32(pdata, offset);
					if (this.inventoryItemStackCount[i] >= 128)
						offset += 4;
					else
						offset += 1;
				}
				return;
			}

			if (opcode === S_OPCODES.REGION_PLAYER_UPDATE) {
				let updateCount = Utility.getUnsignedShort(pdata, offset);
				offset += 2;
updateLoop:
				for (let update = 0; update < updateCount; update++) {
					let updatePlayer = this.playersServer[Utility.getUnsignedShort(pdata, offset)];
					offset += 2;

					let updateType = pdata[offset++];
					if (updateType === 0) {
						// speech bubble with an item in it
						let id = Utility.getUnsignedShort(pdata, offset);
						offset += 2;

						if (updatePlayer)
							updatePlayer.bubble = new Bubble(id);
					} else if (updateType === 1) {
						// chat
						// let messageLength = pdata[offset++];
						let msgIcon = Utility.getUnsignedByte(pdata, offset++);
						let msgSize = Utility.getSmart0816(pdata, offset);
						offset += 1;
						if (msgSize >= 128)
							offset += 1;
						let data = pdata.slice(offset);
						let cryptMsg = chatCipher().decipher({buffer: data, size: msgSize, encSize: data.length});
						let msg = this.chatSystem.normalize(cryptMsg.msg);
						offset += cryptMsg.encSize;
						if (updatePlayer) {
							// let msg = this.chatSystem.normalize(this.chatSystem.decode(pdata.slice(offset, offset+messageLength)));
							// offset += messageLength;
							for (let idx = 0; idx < this.ignoreList.length; idx++)
								if (this.ignoreList[idx] === updatePlayer.hash)
									continue updateLoop;

							updatePlayer.messageTimeout = secondsToFrames(3);
							updatePlayer.message = cryptMsg.msg;
							this.showMessage(updatePlayer.name + ': ' + updatePlayer.message, 2);
						}
					} else if (updateType === 2) {
						// combat damage and hp
						let damage = Utility.getUnsignedByte(pdata[offset++]);
						let current = Utility.getUnsignedByte(pdata[offset++]);
						let max = Utility.getUnsignedByte(pdata[offset++]);

						if (updatePlayer) {
							updatePlayer.damageTaken = damage;
							updatePlayer.healthCurrent = current;
							updatePlayer.healthMax = max;
							// updatePlayer.healthTimer.tickThreshold = secondsToFrames(4);
							updatePlayer.healthTimer = Timer.fromSeconds(4);
							if (updatePlayer === this.localPlayer) {
								this.playerStatCurrent[3] = current;
								this.playerStatBase[3] = max;
								this.welcomeBoxVisible = false;
								this.serverMessageVisible = false;
							}
						}
					} else if (updateType === 3 || updateType === 4) {
						// new outgoing projectile toward a mob
						if (updatePlayer) {
							updatePlayer.incomingProjectileSprite = Utility.getUnsignedShort(pdata, offset);
							if (updateType === 3) {
								// npc
								updatePlayer.attackingNpcServerIndex = Utility.getUnsignedShort(pdata, offset+2);
								updatePlayer.attackingPlayerServerIndex = -1;
							} else {
								updatePlayer.attackingPlayerServerIndex = Utility.getUnsignedShort(pdata, offset+2);
								updatePlayer.attackingNpcServerIndex = -1;
							}
							updatePlayer.projectileRange = this.projectileFactor;
						}
						offset += 4;
					} else if (updateType === 5) {
						// Appearances/vital information
						if (updatePlayer) {
							updatePlayer.appearanceTicket = Utility.getUnsignedShort(pdata, offset);
							offset += 2;
							// updatePlayer.hash = Utility.getUnsignedLong(pdata, offset);
							updatePlayer.name = Utility.getString(pdata, offset);
							offset += 4 + (updatePlayer.name.length*2);
							// updatePlayer.name = Utility.hashToUsername(updatePlayer.hash);
							// offset += 8;

							let equipmentSprites = Utility.getUnsignedByte(pdata[offset++]);
							for (let count = 0; count < 12; count++)
								updatePlayer.equippedItem[count] = (count < equipmentSprites ? Utility.getUnsignedByte(pdata[offset++]) : 0);

							updatePlayer.colourHair = Utility.getUnsignedByte(pdata[offset++]);
							updatePlayer.colourTop = Utility.getUnsignedByte(pdata[offset++]);
							updatePlayer.colourBottom = Utility.getUnsignedByte(pdata[offset++]);
							updatePlayer.colourSkin = Utility.getUnsignedByte(pdata[offset++]);
							updatePlayer.level = Utility.getUnsignedByte(pdata[offset++]);
							updatePlayer.skullVisible = Utility.getBoolean(pdata[offset++]);
						} else {
							offset += 10;
							let unused = Utility.getUnsignedByte(pdata[offset]);
							offset += unused + 1;
						}
					} else if (updateType === 6) {
						// quest-chat
						let msgSize = Utility.getSmart0816(pdata, offset);
						offset += 1;
						if (msgSize >= 128)
							offset += 1;
						let data = pdata.slice(offset);
						let cryptMsg = chatCipher().decipher({buffer: data, size: msgSize, encSize: data.length});
						offset += cryptMsg.encSize;

						// let mLen = pdata[offset++] & 0xFF;
						let msg = this.chatSystem.normalize(cryptMsg.msg);
						// let msg = this.chatSystem.normalize(this.chatSystem.decode(pdata.slice(offset, offset+mLen)));
						// offset += mLen;
						if (updatePlayer) {
							updatePlayer.messageTimeout = secondsToFrames(3);
							updatePlayer.message = cryptMsg.msg;

							if (updatePlayer === this.localPlayer)
								this.showMessage(updatePlayer.name + ': ' + updatePlayer.message, 5);
						}
					}
				}

				return;
			}

			if (opcode === S_OPCODES.REGION_WALL_OBJECTS) {
				for (let offset = 1; offset < psize; )
					if (Utility.getUnsignedByte(pdata[offset]) === 0xFF) {
						let count = 0;
						let lX = this.localRegionX + pdata[offset + 1] >> 3;
						let lY = this.localRegionY + pdata[offset + 2] >> 3;

						offset += 3;

						for (let i = 0; i < this.wallObjectCount; i++) {
							let sX = (this.wallObjectX[i] >> 3) - lX;
							let sY = (this.wallObjectY[i] >> 3) - lY;

							if (sX !== 0 || sY !== 0) {
								if (i !== count) {
									this.wallObjectModel[count] = this.wallObjectModel[i];
									this.wallObjectModel[count].key = count + 10000;
									this.wallObjectX[count] = this.wallObjectX[i];
									this.wallObjectY[count] = this.wallObjectY[i];
									this.wallObjectDirection[count] = this.wallObjectDirection[i];
									this.wallObjectId[count] = this.wallObjectId[i];
								}

								count++;
							} else {
								this.scene.removeModel(this.wallObjectModel[i]);
								this.world.removeWallObject(this.wallObjectX[i], this.wallObjectY[i], this.wallObjectDirection[i], this.wallObjectId[i]);
							}
						}

						this.wallObjectCount = count;
					} else {
						let id = Utility.getUnsignedShort(pdata, offset);

						offset += 2;

						let lX = this.localRegionX + pdata[offset++];
						let lY = this.localRegionY + pdata[offset++];
						let direction = pdata[offset++];
						let count = 0;

						for (let i = 0; i < this.wallObjectCount; i++) {
							if (this.wallObjectX[i] !== lX || this.wallObjectY[i] !== lY || this.wallObjectDirection[i] !== direction) {
								if (i !== count) {
									this.wallObjectModel[count] = this.wallObjectModel[i];
									this.wallObjectModel[count].key = count + 10000;
									this.wallObjectX[count] = this.wallObjectX[i];
									this.wallObjectY[count] = this.wallObjectY[i];
									this.wallObjectDirection[count] = this.wallObjectDirection[i];
									this.wallObjectId[count] = this.wallObjectId[i];
								}

								count++;
							} else {
								this.scene.removeModel(this.wallObjectModel[i]);
								this.world.removeWallObject(this.wallObjectX[i], this.wallObjectY[i], this.wallObjectDirection[i], this.wallObjectId[i]);
							}
						}

						this.wallObjectCount = count;

						// This block never can run??? why is it even here
						if (id !== 0xFFFF) {
							this.world._setObjectAdjacency_from4(lX, lY, direction, id);
							this.wallObjectModel[this.wallObjectCount] = this.createBoundaryModel(lX, lY, direction, id, this.wallObjectCount);
							this.wallObjectX[this.wallObjectCount] = lX;
							this.wallObjectY[this.wallObjectCount] = lY;
							this.wallObjectId[this.wallObjectCount] = id;
							this.wallObjectDirection[this.wallObjectCount++] = direction;
						}
					}

				return;
			}

			if (opcode === S_OPCODES.REGION_NPCS) {
				this.npcCacheCount = this.npcCount;
				// this.npcsCache = this.npcs.slice(0, this.npcCacheCount);
				for (let i2 = 0; i2 < this.npcCacheCount; i2++) this.npcsCache[i2] = this.npcs[i2];

				let bitOffset = offset*8;
				let localCount = Utility.getBitMask(pdata, bitOffset, 8);
				bitOffset += 8;

				this.npcCount = 0;
				for (let cur = 0; cur < localCount; cur++) {
					let npc = this.npcsCache[cur];
					if (Utility.getBitMask(pdata, bitOffset++, 1) !== 0) {
						if (Utility.getBitMask(pdata, bitOffset++, 1) === 0) {
							let direction = Utility.getBitMask(pdata, bitOffset, 3);
							bitOffset += 3;
							let step = npc.waypointCurrent;
							let curX = npc.waypointsX[step];
							let curY = npc.waypointsY[step];

							switch(direction) {
							case 1:
							case 2:
							case 3:
								curX += this.tileSize;
								break;
							case 5:
							case 6:
							case 7:
								curX -= this.tileSize;
								break;
							}
							switch(direction) {
							case 3:
							case 4:
							case 5:
								curY += this.tileSize;
								break;
							case 7:
							case 0:
							case 1:
								curY -= this.tileSize;
								break;
							}

							npc.animationNext = direction;
							npc.waypointCurrent = step = (step+1) % 10;
							npc.waypointsX[step] = curX;
							npc.waypointsY[step] = curY;
						} else {
							let sprite = Utility.getBitMask(pdata, bitOffset, 2);
							bitOffset += 2;
							// first 2 bits were on, means remove from list and the other 2 bits belong elsewhere
							if (sprite === 0b11)
								continue;

							npc.animationNext = (sprite << 2) | Utility.getBitMask(pdata, bitOffset, 2);
							bitOffset += 2;
						}
					}

					this.npcs[this.npcCount++] = npc;
				}

				while (bitOffset + 34 < psize*8) {
					let serverIndex = Utility.getBitMask(pdata, bitOffset, 12);
					bitOffset += 12;

					let areaX = Utility.getBitMask(pdata, bitOffset, 5);
					bitOffset += 5;
					if (areaX > 15)
						areaX -= 32;

					let areaY = Utility.getBitMask(pdata, bitOffset, 5);
					bitOffset += 5;
					if (areaY > 15)
						areaY -= 32;

					let sprite = Utility.getBitMask(pdata, bitOffset, 4);
					bitOffset += 4;

					let x = (this.localRegionX + areaX) * this.tileSize + 64;
					let y = (this.localRegionY + areaY) * this.tileSize + 64;
					let type = Utility.getBitMask(pdata, bitOffset, 10);
					bitOffset += 10;

					if (type >= GameData.npcCount)
						type = 24;

					this.addNpc(serverIndex, x, y, sprite, type);
				}

				return;
			}

			if (opcode === S_OPCODES.REGION_NPC_UPDATE) {
				let updateCount = Utility.getUnsignedShort(pdata, offset);
				offset += 2;
				if (updateCount <= 0)
					return;

				for (let idx = 0; idx < updateCount; idx++) {
					let updatingNpc = this.npcsServer[Utility.getUnsignedShort(pdata, offset)];
					offset += 2;
					let updateType = Utility.getUnsignedByte(pdata[offset++]);
					if (updateType === 1) {
						let target = Utility.getUnsignedShort(pdata, offset);
						offset += 2;
						let msgSize = Utility.getSmart0816(pdata, offset);
						offset += 1;
						if (msgSize >= 128)
							offset += 1;
						let data = pdata.slice(offset);
						let cryptMsg = chatCipher().decipher({buffer: data, size: msgSize, encSize: data.length});
						updatingNpc.message = /*this.chatSystem.normalize(*/cryptMsg.msg/*)*/;
						offset += cryptMsg.encSize;
						updatingNpc.messageTimeout = secondsToFrames(3);
						if (target === this.localPlayer.serverIndex)
							this.showMessage('@yel@' + GameData.npcName[updatingNpc.typeID] + ': ' + updatingNpc.message, 5);
					} else if (updateType === 2) {
						updatingNpc.damageTaken = Utility.getUnsignedByte(pdata[offset++]);
						updatingNpc.healthCurrent = Utility.getUnsignedByte(pdata[offset++]);
						updatingNpc.healthMax = Utility.getUnsignedByte(pdata[offset++]);
						// updatingNpc.healthTimer.tickThreshold = secondsToFrames(4);
						updatingNpc.healthTimer = Timer.fromSeconds(4);
					}
				}

				return;
			}
			if (opcode === S_OPCODES.OPTION_LIST) {
				this.optionMenuCount = Utility.getUnsignedByte(pdata[offset++]);
				for (let i = 0; i < this.optionMenuCount; i++) {
					// let strLen = Utility.getUnsignedByte(pdata[offset++]);
					let option = Utility.getString(pdata, offset);
					this.optionMenuEntry[i] = option;
					offset += option.length+2;
				}

				this.showOptionMenu = true;
				return;
			}
			if (opcode === S_OPCODES.OPTION_LIST_CLOSE) {
				this.showOptionMenu = false;
				return;
			}
			if (opcode === S_OPCODES.WORLD_INFO) {
				this.loadingArea = true;
				this.localPlayerServerIndex = Utility.getUnsignedShort(pdata, offset);
				offset += 2;
				this.planeWidth = Utility.getUnsignedShort(pdata, offset);
				offset += 2;
				this.planeHeight = Utility.getUnsignedShort(pdata, offset);
				offset += 2;
				this.planeIndex = Utility.getUnsignedShort(pdata, offset);
				offset += 2;
				this.planeMultiplier = Utility.getUnsignedShort(pdata, offset);
				offset += 2;
				this.planeHeight -= this.planeIndex * this.planeMultiplier;
				return;
			}

			if (opcode === S_OPCODES.PLAYER_STAT_LIST) {
				for (let i = 0; i < this.playerStatCount; i++)
					this.playerStatCurrent[i] = Utility.getUnsignedByte(pdata[offset++]);

				for (let i = 0; i < this.playerStatCount; i++)
					this.playerStatBase[i] = Utility.getUnsignedByte(pdata[offset++]);

				for (let i = 0; i < this.playerStatCount; i++)
					this.playerExperience[i] = Utility.getUnsignedInt(pdata, offset+(i<<2));
				offset += this.playerStatCount<<2;

				this.playerQuestPoints = Utility.getUnsignedByte(pdata[offset++]);
				return;
			}

			if (opcode === S_OPCODES.PLAYER_STAT_EQUIPMENT_BONUS) {
				for (let i3 = 0; i3 < this.playerStatEquipmentCount; i3++)
					this.playerStatEquipment[i3] = Utility.getUnsignedByte(pdata[offset+i3]);
				return;
			}

			if (opcode === S_OPCODES.PLAYER_DIED) {
				this.deathScreenTimeout = secondsToFrames(5);
				return;
			}

			if (opcode === S_OPCODES.REGION_ENTITY_UPDATE) {
				let chunkCount = Math.floor((psize - 1) >>> 2);

				for (let chunk = 0; chunk < chunkCount; chunk++) {
					let chunkX = this.localRegionX + Utility.getSignedShort(pdata, offset) >> 3;
					offset += 2;
					let chunkY = this.localRegionY + Utility.getSignedShort(pdata, offset) >> 3;
					offset += 2;
					// let chunkX = this.localRegionX + Utility.getSignedShort(pdata, 1 + chunk * 4) >> 3;
					// let chunkY = this.localRegionY + Utility.getSignedShort(pdata, 3 + chunk * 4) >> 3;
					let entityCount = 0;

					for (let idx = 0; idx < this.groundItemCount; idx++) {
						let deltaX = (this.groundItemX[idx] >> 3) - chunkX;
						let deltaY = (this.groundItemY[idx] >> 3) - chunkY;

						if (deltaX !== 0 || deltaY !== 0) {
							if (idx !== entityCount) {
								this.groundItemX[entityCount] = this.groundItemX[idx];
								this.groundItemY[entityCount] = this.groundItemY[idx];
								this.groundItemId[entityCount] = this.groundItemId[idx];
								this.groundItemZ[entityCount] = this.groundItemZ[idx];
							}

							entityCount++;
						}
					}

					this.groundItemCount = entityCount;
					entityCount = 0;

					for (let idx = 0; idx < this.objectCount; idx++) {
						let deltaX = (this.objectX[idx] >> 3) - chunkX;
						let deltaY = (this.objectY[idx] >> 3) - chunkY;

						if (deltaX !== 0 || deltaY !== 0) {
							if (idx !== entityCount) {
								this.objectModel[entityCount] = this.objectModel[idx];
								this.objectModel[entityCount].key = entityCount;
								this.objectX[entityCount] = this.objectX[idx];
								this.objectY[entityCount] = this.objectY[idx];
								this.objectId[entityCount] = this.objectId[idx];
								this.objectDirection[entityCount] = this.objectDirection[idx];
							}

							entityCount++;
						} else {
							this.scene.removeModel(this.objectModel[idx]);
							this.world.removeObject(this.objectX[idx], this.objectY[idx], this.objectId[idx]);
						}
					}

					this.objectCount = entityCount;
					entityCount = 0;

					for (let idx = 0; idx < this.wallObjectCount; idx++) {
						let deltaX = (this.wallObjectX[idx] >> 3) - chunkX;
						let deltaY = (this.wallObjectY[idx] >> 3) - chunkY;

						if (deltaX !== 0 || deltaY !== 0) {
							if (idx !== entityCount) {
								this.wallObjectModel[entityCount] = this.wallObjectModel[idx];
								this.wallObjectModel[entityCount].key = entityCount + 10000;
								this.wallObjectX[entityCount] = this.wallObjectX[idx];
								this.wallObjectY[entityCount] = this.wallObjectY[idx];
								this.wallObjectDirection[entityCount] = this.wallObjectDirection[idx];
								this.wallObjectId[entityCount] = this.wallObjectId[idx];
							}

							entityCount++;
						} else {
							this.scene.removeModel(this.wallObjectModel[idx]);
							this.world.removeWallObject(this.wallObjectX[idx], this.wallObjectY[idx], this.wallObjectDirection[idx], this.wallObjectId[idx]);
						}
					}

					this.wallObjectCount = entityCount;
				}
				return;
			}

			if (opcode === S_OPCODES.APPEARANCE) {
				this.showAppearanceChange = true;
				return;
			}

			if (opcode === S_OPCODES.TRADE_OPEN) {
				let serverIndex = Utility.getUnsignedShort(pdata, offset);
				offset += 2;

				if (this.playersServer[serverIndex])
					this.tradeRecipientName = this.playersServer[serverIndex].name;

				this.tradeConfigVisible = true;
				this.tradeRecipientAccepted = false;
				this.tradeAccepted = false;
				this.tradeItemsCount = 0;
				this.tradeRecipientItemList = [];
				this.tradeRecipientItems = [];
				this.tradeRecipientItemsCount = 0;
				return;
			}

			if (opcode === S_OPCODES.TRADE_CLOSE) {
				this.tradeConfigVisible = false;
				this.tradeConfirmVisible = false;
				return;
			}

			if (opcode === S_OPCODES.TRADE_ITEMS) {
				this.tradeRecipientItemsCount = Utility.getUnsignedByte(pdata[1]);

				let l3 = 2;

				for (let i11 = 0; i11 < this.tradeRecipientItemsCount; i11++) {
					this.tradeRecipientItems[i11] = Utility.getUnsignedShort(pdata, l3);
					l3 += 2;
					this.tradeRecipientItemCount[i11] = Utility.getUnsignedInt(pdata, l3);
					l3 += 4;
				}

				this.tradeRecipientAccepted = false;
				this.tradeAccepted = false;

				return;
			}

			if (opcode === S_OPCODES.TRADE_RECIPIENT_STATUS) {
				this.tradeRecipientAccepted = Utility.getBoolean(pdata[1]);
				return;
			}

			if (opcode === S_OPCODES.SHOP_OPEN) {
				this.shopVisible = true;

				let off = 1;
				let newItemCount = Utility.getUnsignedByte(pdata[off++]);
				let shopType = Utility.getUnsignedByte(pdata[off++]);

				this.shopSellPriceMod = Utility.getUnsignedByte(pdata[off++]);
				this.shopBuyPriceMod = Utility.getUnsignedByte(pdata[off++]);

				for (let itemIndex = 0; itemIndex < 40; itemIndex++) {
					this.shopItem[itemIndex] = -1;
				}

				for (let itemIndex = 0; itemIndex < newItemCount; itemIndex++) {
					this.shopItem[itemIndex] = Utility.getUnsignedShort(pdata, off);
					off += 2;
					this.shopItemCount[itemIndex] = Utility.getUnsignedShort(pdata, off);
					off += 2;
					this.shopItemPrice[itemIndex] = pdata[off++];
				}

				// shopType === 1 means this is a general shop
				if (shopType === 1) {
					let l28 = 39;

					for (let k33 = 0; k33 < this.inventoryItemsCount; k33++) {
						if (l28 < newItemCount) {
							break;
						}

						let flag2 = false;

						for (let j39 = 0; j39 < 40; j39++) {
							if (this.shopItem[j39] !== this.inventoryItemId[k33]) {
								continue;
							}

							flag2 = true;
							break;
						}

						if (this.inventoryItemId[k33] === 10) {
							flag2 = true;
						}

						if (!flag2) {
							this.shopItem[l28] = this.inventoryItemId[k33] & 0x7FFF;
							this.shopItemCount[l28] = 0;
							this.shopItemPrice[l28] = 0;
							l28--;
						}
					}

				}

				if (this.shopSelectedItemIndex >= 0 && this.shopSelectedItemIndex < 40 && this.shopItem[this.shopSelectedItemIndex] !== this.shopSelectedItemType) {
					this.shopSelectedItemIndex = -1;
					this.shopSelectedItemType = -2;
				}

				return;
			}
			if (opcode === S_OPCODES.SHOP_CLOSE) {
				this.shopVisible = false;
				return;
			}
			if (opcode === S_OPCODES.TRADE_STATUS) {
				this.tradeAccepted = Utility.getBoolean(pdata[1]);
				return;
			}
			if (opcode === S_OPCODES.GAME_SETTINGS) {
				this.optionCameraModeAuto = Utility.getBoolean(pdata[1]);
				this.optionMouseButtonOne = Utility.getBoolean(pdata[2]);
				this.optionSoundDisabled = Utility.getBoolean(pdata[3]);
				return;
			}
			if (opcode === S_OPCODES.PRAYER_STATUS) {
				for (let j4 = 0; j4 < psize-1; j4++) {
					if (this.prayers[j4] - Utility.getUnsignedByte(pdata[offset++]) !== 0) {
						this.playSoundFile('prayero' + this.prayers[j4] ? 'ff' : 'n');
						this.prayers[j4] = !this.prayers[j4];
					}
				}
				return;
			}
			if (opcode === S_OPCODES.PLAYER_QUEST_LIST) {
				for (let i = 0; i < this.questCount; i++)
					this.questComplete[i] = Utility.getBoolean(pdata[offset+i]);
				return;
			}
			if (opcode === S_OPCODES.BANK_OPEN) {
				this.bankVisible = true;

				this.newBankItemCount = Utility.getUnsignedByte(pdata[offset++]);
				this.bankItemsMax = Utility.getUnsignedByte(pdata[offset++]);
				for (let k11 = 0; k11 < this.newBankItemCount; k11++) {
					this.newBankItems[k11] = Utility.getUnsignedShort(pdata, offset);
					offset += 2;
					this.newBankItemsCount[k11] = Utility.getSmart08_32(pdata, offset);
					if (this.newBankItemsCount[k11] >= 128)
						offset += 4;
					else
						offset++;
				}

				this.updateBankItems();
				return;
			}
			if (opcode === S_OPCODES.BANK_CLOSE) {
				this.bankVisible = false;
				return;
			}
			if (opcode === S_OPCODES.PLAYER_STAT_EXPERIENCE_UPDATE) {
				this.playerExperience[Utility.getUnsignedByte(pdata[1])] = Utility.getUnsignedInt(pdata, 2);
				return;
			}
			if (opcode === S_OPCODES.DUEL_OPEN) {
				let j5 = Utility.getUnsignedShort(pdata, 1);

				if (this.playersServer[j5])
					this.duelOpponentName = this.playersServer[j5].name;

				this.duelConfigVisible = true;
				this.duelOfferOpponentAccepted = false;
				for (let i = 0; i < this.duelOfferOpponentItemsCount; i++)
					this.duelOfferOpponentItemList = remove(this.duelOfferOpponentItemList, this.duelOfferOpponentItemList[i]);
				this.duelOfferOpponentItemCount = 0;
				for (let i = 0; i < this.duelOfferItemsCount; i++)
					this.duelOfferItemList = remove(this.duelOfferItemList, this.duelOfferItemList[i]);
				this.duelOfferItemCount = 0;
				for (let i = 0; i < this.duelItemsCount; i++)
					this.duelItemList = remove(this.duelItemList, this.duelItemList[i]);
				this.duelItemsCount = 0;
				for (let i = 0; i < this.duelOpponentItemsCount; i++)
					this.duelOpponentItemList = remove(this.duelOpponentItemList, this.duelOpponentItemList[i]);
				this.duelOpponentItemsCount = 0;
				this.duelOfferAccepted = false;
				this.duelSettingsRetreat = false;
				this.duelSettingsMagic = false;
				this.duelSettingsPrayer = false;
				this.duelSettingsWeapons = false;
				return;
			}
			if (opcode === S_OPCODES.DUEL_CLOSE) {
				this.duelConfigVisible = false;
				this.duelConfirmVisible = false;
				for (let i = 0; i < this.duelOfferOpponentItemsCount; i++)
					this.duelOfferOpponentItemList = remove(this.duelOfferOpponentItemList, this.duelOfferOpponentItemList[i]);
				this.duelOfferOpponentItemCount = 0;
				for (let i = 0; i < this.duelOfferItemsCount; i++)
					this.duelOfferItemList = remove(this.duelOfferItemList, this.duelOfferItemList[i]);
				this.duelOfferItemCount = 0;
				for (let i = 0; i < this.duelItemsCount; i++)
					this.duelItemList = remove(this.duelItemList, this.duelItemList[i]);
				this.duelItemsCount = 0;
				for (let i = 0; i < this.duelOpponentItemsCount; i++)
					this.duelOpponentItemList = remove(this.duelOpponentItemList, this.duelOpponentItemList[i]);
				this.duelOpponentItemsCount = 0;
				return;
			}

			if (opcode === S_OPCODES.TRADE_CONFIRM_OPEN) {
				this.tradeConfirmVisible = true;
				this.tradeConfirmAccepted = false;
				this.tradeConfigVisible = false;

				let k5 = 1;

				this.tradeRecipientConfirmHash = Utility.getUnsignedLong(pdata, k5);
				k5 += 8;
				this.tradeRecipientConfirmItemsCount = Utility.getUnsignedByte(pdata[k5++]);

				for (let l11 = 0; l11 < this.tradeRecipientConfirmItemsCount; l11++) {
					this.tradeRecipientConfirmItems[l11] = Utility.getUnsignedShort(pdata, k5);
					k5 += 2;
					this.tradeRecipientConfirmItemCount[l11] = Utility.getUnsignedInt(pdata, k5);
					k5 += 4;kj
				}

				this.tradeConfirmItemsCount = Utility.getUnsignedByte(pdata[k5++]);

				for (let k17 = 0; k17 < this.tradeConfirmItemsCount; k17++) {
					this.tradeConfirmItems[k17] = Utility.getUnsignedShort(pdata, k5);
					k5 += 2;
					this.tradeConfirmItemCount[k17] = Utility.getUnsignedInt(pdata, k5);
					k5 += 4;
				}

				return;
			}
			if (opcode === S_OPCODES.DUEL_UPDATE) {
				let off = 1;

				this.duelOfferOpponentItemList = new Array(8);
				this.duelOfferOpponentItemCount = Utility.getUnsignedByte(pdata[off++]);

				for (let idx = 0; idx <= this.duelOfferOpponentItemCount; idx++) {
					this.duelOfferOpponentItemList[idx] = {
						id: Utility.getUnsignedShort(pdata, off),
						amount: Utility.getUnsignedInt(pdata, off+2),
					};
					off += 6;
				}

				this.duelOfferOpponentAccepted = false;
				this.duelOfferAccepted = false;
				return;
			}

			if (opcode === S_OPCODES.DUEL_SETTINGS) {
				this.duelSettingsRetreat = Utility.getBoolean(pdata[offset++]);
				this.duelSettingsMagic = Utility.getBoolean(pdata[offset++]);
				this.duelSettingsPrayer = Utility.getBoolean(pdata[offset++]);
				this.duelSettingsWeapons = Utility.getBoolean(pdata[offset++]);
				this.duelOfferOpponentAccepted = false;
				this.duelOfferAccepted = false;
				return;
			}

			if (opcode === S_OPCODES.BANK_UPDATE) {
				let itemsCountOld = Utility.getUnsignedByte(pdata[offset++]);
				let item = Utility.getUnsignedShort(pdata, offset);
				offset += 2;

				let itemCount = Utility.getSmart08_32(pdata, offset);
				if (itemCount >= 128) {
					offset += 4;
				} else {
					offset++;
				}

				if (itemCount <= 0) {
					this.newBankItemCount--;

					for (let k25 = itemsCountOld; k25 < this.newBankItemCount; k25++) {
						this.newBankItems[k25] = this.newBankItems[k25 + 1];
						this.newBankItemsCount[k25] = this.newBankItemsCount[k25 + 1];
					}
				} else {
					this.newBankItems[itemsCountOld] = item;
					this.newBankItemsCount[itemsCountOld] = itemCount;

					if (itemsCountOld >= this.newBankItemCount)
						this.newBankItemCount = itemsCountOld + 1;
				}

				this.updateBankItems();
				return;
			}

			if (opcode === S_OPCODES.INVENTORY_ITEM_UPDATE) {
				let offset = 1;
				let index = Utility.getUnsignedByte(pdata[offset++]);
				let id = Utility.getUnsignedShort(pdata, offset);
				offset += 2;

				let stack = 1;
				if (GameData.itemStackable[id & 0x7FFF] === 0) {
					stack = Utility.getSmart08_32(pdata, offset);
					if (stack >= 128)
						offset += 4;
					else
						offset++;
				}

				this.inventoryItemId[index] = (id & 0x7FFF);
				this.inventoryEquipped[index] = (id & 0x8000) !== 0;
				this.inventoryItemStackCount[index] = stack;
				if (index >= this.inventoryItemsCount)
					this.inventoryItemsCount = index + 1;
				return;
			}

			if (opcode === S_OPCODES.INVENTORY_ITEM_REMOVE) {
				let index = Utility.getUnsignedByte(pdata[offset++]);
				for (let slot = index; slot < this.inventoryItemsCount-1; slot++) {
					this.inventoryItemId[slot] = this.inventoryItemId[slot + 1];
					this.inventoryItemStackCount[slot] = this.inventoryItemStackCount[slot + 1];
					this.inventoryEquipped[slot] = this.inventoryEquipped[slot + 1];
				}
				this.inventoryItemsCount--;
				return;
			}

			if (opcode === S_OPCODES.PLAYER_STAT_UPDATE) {
				let stat = Utility.getUnsignedByte(pdata[offset++]);
				this.playerStatCurrent[stat] = Utility.getUnsignedByte(pdata[offset++]);
				this.playerStatBase[stat] = Utility.getUnsignedByte(pdata[offset++]);
				this.playerExperience[stat] = Utility.getUnsignedInt(pdata, offset);
				offset += 4;
				return;
			}

			if (opcode === S_OPCODES.DUEL_OPPONENT_ACCEPTED) {
				this.duelOfferOpponentAccepted = Utility.getBoolean(pdata[offset++]);
				return;
			}

			if (opcode === S_OPCODES.DUEL_ACCEPTED) {
				this.duelOfferAccepted = Utility.getBoolean(pdata[offset++]);
				return;
			}

			if (opcode === S_OPCODES.DUEL_CONFIRM_OPEN) {
				this.duelConfirmVisible = true;
				this.duelAccepted = false;
				this.duelConfigVisible = false;

				this.duelOpponentNameHash = Utility.getUnsignedLong(pdata, offset);
				offset += 8;
/*
				this.duelOpponentItemsCount = pdata[off++] & 0xff;

				for (let j13 = 0; j13 < this.duelOpponentItemsCount; j13++) {
					this.duelOpponentItems[j13] = Utility.getUnsignedShort(pdata, off);
					off += 2;
					this.duelOpponentItemCount[j13] = Utility.getUnsignedInt(pdata, off);
					off += 4;
				}
*/
				this.duelOpponentItemsCount = Utility.getUnsignedByte(pdata[offset++]);
				for (let idx = 0; idx <= this.duelOpponentItemsCount; idx++) {
					this.duelOpponentItemList.push({
						id: Utility.getUnsignedShort(pdata, offset),
						amount: Utility.getUnsignedInt(pdata, offset+2),
					});
					offset += 6;
				}

				this.duelItemsCount = Utility.getUnsignedByte(pdata[offset++]);
				for (let idx = 0; idx <= this.duelItemsCount; idx++) {
					this.duelItemList.push({
						id: Utility.getUnsignedShort(pdata, offset),
						amount: Utility.getUnsignedInt(pdata, offset+2),
					});
					offset += 6;
				}

/*
				for (let idx in this.duelItemList) {
					this.duelItemList[idx] = {
						id: Utility.getUnsignedShort(pdata, off),
						amount: Utility.getUnsignedInt(pdata, off+2),
					}
					off += 6;
				}
*/
//				for (let idx = 0; idx < this.duelItemsCount; idx++) {
//					this.duelItems[j18] = Utility.getUnsignedShort(pdata, off);
//					off += 2;
//					this.duelItemCount[j18] = Utility.getUnsignedInt(pdata, off);
//					off += 4;
//				}

				this.duelOptionRetreat = Utility.getBoolean(pdata[offset++]);
				this.duelOptionMagic = Utility.getBoolean(pdata[offset++]);
				this.duelOptionPrayer = Utility.getBoolean(pdata[offset++]);
				this.duelOptionWeapons = Utility.getBoolean(pdata[offset++]);
				return;
			}

			if (opcode === S_OPCODES.SOUND) {
				this.playSoundFile(this.chatSystem.decode(pdata.slice(offset)));
				return;
			}

			if (opcode === S_OPCODES.TELEPORT_BUBBLE) {
				for (let poff=1; this.teleportBubbleCount++ < 50 && poff+3<pdata.length; poff += 3) {
					this.teleportBubbleTime[this.teleportBubbleCount] = 0;
					this.teleportBubbleType[this.teleportBubbleCount] = Utility.getUnsignedByte(pdata[poff]);
					this.teleportBubbleX[this.teleportBubbleCount] = pdata[poff+1] + this.localRegionX;
					this.teleportBubbleY[this.teleportBubbleCount++] = pdata[poff+2] + this.localRegionY;
				}
				return;
			}

			if (opcode === S_OPCODES.WELCOME) {
				if (!this.welcomed) {
					this.welcomed = true;
					this.lastRemoteIP = Utility.getUnsignedInt(pdata, 1);
					this.daysSinceLogin = Utility.getUnsignedShort(pdata, 5);
					this.welcomeRecoverySetDays = Utility.getUnsignedByte(pdata[7]);
					this.unreadMessageCount = Utility.getUnsignedShort(pdata, 8);
					this.lastRemoteHost = this.getHostnameIP(this.lastRemoteIP);
					this.welcomeBoxVisible = true;
				}
				return;
			}

			if (opcode === S_OPCODES.SERVER_MESSAGE_ONTOP || opcode === S_OPCODES.SERVER_MESSAGE) {
				this.serverMessage = this.chatSystem.decode(pdata.slice(offset));
				this.showDialogServermessage = true;
				this.serverMessageBoxTop = opcode === S_OPCODES.SERVER_MESSAGE_ONTOP;
				return;
			}

			if (opcode === S_OPCODES.PLAYER_STAT_FATIGUE) {
				this.statFatigue = Utility.getUnsignedShort(pdata, offset);
				offset += 2;
				return;
			}

			if (opcode === S_OPCODES.PLAYER_STAT_FATIGUE_ASLEEP) {
				this.fatigueSleeping = Utility.getUnsignedShort(pdata, offset);
				offset += 2;
				return;
			}

			if (opcode === S_OPCODES.SLEEP_OPEN) {
				if (!this.isSleeping) {
					this.fatigueSleeping = this.statFatigue;
				}

				this.isSleeping = true;
				this.inputTextCurrent = '';
				this.inputTextFinal = '';
				this.surface.readSleepWord(mudclient.spriteTexture + 1, pdata);
				this.sleepingStatusText = void 0;
				return;
			}

			if (opcode === S_OPCODES.SLEEP_CLOSE) {
				this.isSleeping = false;
				return;
			}

			if (opcode === S_OPCODES.SLEEP_INCORRECT) {
				this.sleepingStatusText = 'Incorrect - Please wait...';
				return;
			}

			if (opcode === S_OPCODES.SYSTEM_UPDATE) {
				// one timer unit == one server tick
				// one server tick == 32 client ticks
				// 32 client ticks translates to .64 seconds, or 640ms.  So if the value here is 10, the time duration represented is 6.4 seconds
				this.systemUpdate = Utility.getUnsignedShort(pdata, offset) * 32;
				return;
			}
			
			if (opcode === S_OPCODES.COMBAT_POINTS) {
				this.combatPoints = Utility.getUnsignedInt(pdata, offset);
				offset += 4;
				return;
			}
			console.log("unhandled packet: " + opcode, ",\tsize:",psize);
			return;
		} catch (e) {
			console.error(e);

			if (this.packetErrorCount < 3) {
				let s1 = e.stack;
				let slen = s1.length;

				this.clientStream.newPacket(C_OPCODES.PACKET_EXCEPTION);
				this.clientStream.putShort(slen);
				this.clientStream.putString(s1);
				this.clientStream.putShort(slen = (s1 = 'p-type: ' + opcode + ', p-size:' + psize).length);
				this.clientStream.putString(s1);
				this.clientStream.putShort(slen = (s1 = 'rx:' + this.localRegionX + ' ry:' + this.localRegionY + ' num3l:' + this.objectCount).length);
				this.clientStream.putString(s1);

				s1 = '';

				for (let l18 = 0; l18 < 80 && l18 < psize; l18++) {
					s1 = s1 + pdata[l18] + ' ';
				}

				this.clientStream.putShort(s1.length);
				this.clientStream.putString(s1);
				this.clientStream.sendPacket();
				this.packetErrorCount++;
			}

			this.clientStream.closeStream();
			this.resetLoginPanels();
		}
	}

	renderStatsTab(nomenus) {
		let uiX = this.surface.width2 - 199;
		let uiY = 36;

		this.surface.drawSpriteID(uiX - 49, 3, mudclient.spriteMedia + 3);

		let uiWidth = 196;
		let uiHeight = 275;
		let l = 0;
		let k = l = 0xA0A0A0;

		if (this.uiTabPlayerInfoSubTab === 0)
			k = 0xDCDCDC;
		else
			l = 0xDCDCDC;

		this.surface.drawBoxAlpha(uiX, uiY, uiWidth >>> 1, 24, k, 0x80);
		this.surface.drawBoxAlpha(uiX + (uiWidth >>> 1), uiY, uiWidth >>> 1, 24, l, 0x80);
		this.surface.drawBoxAlpha(uiX, uiY + 24, uiWidth, uiHeight - 24, 0xDCDCDC, 0x80);
		this.surface.drawLineHoriz(uiX, uiY + 24, uiWidth, 0);
		this.surface.drawLineVert(uiX + (uiWidth >>> 1), uiY, 24, 0);
		this.surface.drawStringCenter('Stats', uiX + (uiWidth >>> 2), uiY + 16, 4, 0);
		this.surface.drawStringCenter('Quests', uiX + (uiWidth >>> 2) + Math.floor(uiWidth >>> 1), uiY + 16, 4, 0);

		if (this.uiTabPlayerInfoSubTab === 0) {
			let i1 = 72;
			let skillIndex = -1;

			this.surface.drawString('Skills', uiX + 5, i1, 3, 0xFFFF00);

			i1 += 13;

			for (let l1 = 0; l1 < 9; l1++) {
				let color = 0xFFFFFF;

				if (this.mouseX > uiX + 3 && this.mouseY >= i1 - 11 && this.mouseY < i1 + 2 && this.mouseX < uiX + 90) {
					color = 0xFF0000;
					skillIndex = l1;
				}

				this.surface.drawString(`${this.skillNameShort[l1]}:@yel@${this.playerStatCurrent[l1]}/${this.playerStatBase[l1]}`, uiX + 5, i1, 1, color);
				color = 0xFFFFFF;

				if (this.mouseX >= uiX + 90 && this.mouseY >= i1 - 13 - 11 && this.mouseY < (i1 - 13) + 2 && this.mouseX < uiX + 196) {
					color = 0xFF0000;
					skillIndex = l1 + 9;
				}

				this.surface.drawString(`${this.skillNameShort[l1 + 9]}:@yel@${this.playerStatCurrent[l1 + 9]}/${this.playerStatBase[l1 + 9]}`, (uiX + (uiWidth >>> 1)) - 5, i1 - 13, 1, color);
				i1 += 13;
			}

			this.surface.drawString('Quest Points:@yel@' + this.playerQuestPoints, uiX + Math.floor(uiWidth / 2) - 5, i1 - 13, 1, 0xFFFFFF);
			i1 += 12;
			this.surface.drawString('Fatigue: @yel@' + Math.floor((this.statFatigue * 100) / 750) + '%', uiX + 5, i1 - 13, 1, 0xFFFFFF);
			i1 += 8;
			this.surface.drawString('Equipment Status', uiX + 5, i1, 3, 0xFFFF00);
			i1 += 12;

			for (let j2 = 0; j2 < 3; j2++) {
				this.surface.drawString(this.equipmentStatNames[j2] + ':@yel@' + this.playerStatEquipment[j2], uiX + 5, i1, 1, 0xffffff);

				if (j2 < 2)
					this.surface.drawString(this.equipmentStatNames[j2 + 3] + ':@yel@' + this.playerStatEquipment[j2 + 3], uiX + Math.floor(uiWidth / 2) + 25, i1, 1, 0xffffff);
				i1 += 13;
			}

			i1 += 6;
			this.surface.drawLineHoriz(uiX, i1 - 15, uiWidth, 0);

			if (skillIndex !== -1) {
				this.surface.drawString(this.skillNamesLong[skillIndex] + ' skill', uiX + 5, i1, 1, 0xffff00);
				i1 += 12;

				let expThresh = mudclient.experienceTable[0];
				for (let lvl = 1; lvl < MAX_STAT-1; lvl++)
					if (this.playerExperience[skillIndex] >= Math.floor(expThresh / 4))
						expThresh = mudclient.experienceTable[lvl];

				this.surface.drawString('Total xp: ' + Math.floor(this.playerExperience[skillIndex]), uiX + 5, i1, 1, 0xFFFFFF);
				i1 += 12;
				this.surface.drawString('Next level at: ' + Math.floor(expThresh / 4), uiX + 5, i1, 1, 0xFFFFFF);
			} else {
				this.surface.drawString('Overall levels', uiX + 5, i1, 1, 0xFFFF00);
				i1 += 12;

				let skillTotal = 0;
				for (let lvl = 0; lvl < this.playerStatCount; lvl++)
					skillTotal += this.playerStatBase[lvl];
				this.surface.drawString('Skill total: ' + skillTotal, uiX + 5, i1, 1, 0xffffff);
				i1 += 12;
				this.surface.drawString('Combat level: ' + this.localPlayer.level, uiX + 5, i1, 1, 0xffffff);
				i1 += 12;
			}
		} else if (this.uiTabPlayerInfoSubTab === 1) {
			this.panelQuestList.clearList(this.controlListQuest);
			this.panelQuestList.addListEntry(this.controlListQuest, 0, '@whi@Quest-list (green=completed)');

			for (let j1 = 0; j1 < this.questCount; j1++)
				this.panelQuestList.addListEntry(this.controlListQuest, j1 + 1, (this.questComplete[j1] ? '@gre@' : '@red@') + this.questName[j1]);

			this.panelQuestList.render();
		}

		if (!nomenus)
			return;

		let mouseX = this.mouseX - (this.surface.width2 - 199);
		let mouseY = this.mouseY - 36;
		if (mouseX >= 0 && mouseY >= 0 && mouseX < uiWidth && mouseY < uiHeight) {
			if (this.uiTabPlayerInfoSubTab === 1)
				this.panelQuestList.handleMouse(mouseX + (this.surface.width2 - 199), mouseY + 36, this.lastMouseButtonDown, this.mouseButtonDown, this.mouseScrollDelta);

			if (mouseY <= 24 && this.mouseButtonClick === 1) {
				if (mouseX < 98) {
					this.uiTabPlayerInfoSubTab = 0;
					return;
				}

				if (mouseX > 98)
					this.uiTabPlayerInfoSubTab = 1;
			}
		}
	}

	populateContextMenu() {
		// wildlvl
		let i = 2203 - (this.localRegionY + this.planeHeight + this.regionY);

		if (this.localRegionX + this.planeWidth + this.regionX >= 2640)
			i = -50;

		let j = -1;

		for (let k = 0; k < this.objectCount; k++) {
			this.objectAlreadyInMenu[k] = false;
		}

		for (let l = 0; l < this.wallObjectCount; l++) {
			this.wallObjectAlreadyInMenu[l] = false;
		}

		let i1 = this.scene.getMousePickedCount();
		let objs = this.scene.getMousePickedModels();
		let plyrs = this.scene.getMousePickedFaces();

		for (let menuIdx = 0; menuIdx < i1; menuIdx++) {
			if (this.menuItemsCount > 200) {
				break;
			}

			let pid = plyrs[menuIdx];
			let gameModel = objs[menuIdx];
			if (gameModel.faceTag[pid] <= 0xFFFF || gameModel.faceTag[pid] >= 200000 && gameModel.faceTag[pid] <= 300000)  {
				if (gameModel === this.scene.view) {
					let idx = gameModel.faceTag[pid] % 10000;
					let type = Math.floor(gameModel.faceTag[pid] / 10000);

					if (type === 1) {
						let s = '';
						let combatDelta = this.localPlayer.level - this.players[idx].level;

						if (this.localPlayer.level === 0 || this.players[idx].level === 0)
							s = '@whi@';
						else if (combatDelta < 0)
							s = '@or1@';
						else if (combatDelta < -3)
							s = '@or2@';
						else if (combatDelta < -6)
							s = '@or3@';
						else if (combatDelta < -9)
							s = '@red@';
						else if (combatDelta > 0)
							s = '@gr1@';
						else if (combatDelta > 3)
							s = '@gr2@';
						else if (combatDelta > 6)
							s = '@gr3@';
						else if (combatDelta > 9)
							s = '@gre@';
						let combatDifferential = ` ${s}(level-${this.players[idx].level})`;

						if (this.selectedSpell >= 0) {
							if (GameData.spellType[this.selectedSpell] === 1 || GameData.spellType[this.selectedSpell] === 2) {
								this.menuItemText1[this.menuItemsCount] = 'Cast ' + GameData.spellName[this.selectedSpell] + ' on';
								this.menuItemText2[this.menuItemsCount] = '@whi@' + this.players[idx].name + combatDifferential;
								this.menuItemID[this.menuItemsCount] = 800;
								this.menuItemX[this.menuItemsCount] = this.players[idx].currentX;
								this.menuItemY[this.menuItemsCount] = this.players[idx].currentY;
								this.menuSourceType[this.menuItemsCount] = this.players[idx].serverIndex;
								this.menuSourceIndex[this.menuItemsCount] = this.selectedSpell;
								this.menuItemsCount++;
							}
						} else if (this.selectedItemInventoryIndex >= 0) {
							this.menuItemText1[this.menuItemsCount] = 'Use ' + this.selectedItemName + ' with';
							this.menuItemText2[this.menuItemsCount] = '@whi@' + this.players[idx].name + combatDifferential;
							this.menuItemID[this.menuItemsCount] = 810;
							this.menuItemX[this.menuItemsCount] = this.players[idx].currentX;
							this.menuItemY[this.menuItemsCount] = this.players[idx].currentY;
							this.menuSourceType[this.menuItemsCount] = this.players[idx].serverIndex;
							this.menuSourceIndex[this.menuItemsCount] = this.selectedItemInventoryIndex;
							this.menuItemsCount++;
						} else {
							if (i > 0 && Math.floor((this.players[idx].currentY - 64) / this.tileSize + this.planeHeight + this.regionY) < 2203) {
								this.menuItemText1[this.menuItemsCount] = 'Attack';
								this.menuItemText2[this.menuItemsCount] = '@whi@' + this.players[idx].name + combatDifferential;

								if (combatDelta >= 0 && combatDelta < 5) {
									this.menuItemID[this.menuItemsCount] = 805;
								} else {
									this.menuItemID[this.menuItemsCount] = 2805;
								}

								this.menuItemX[this.menuItemsCount] = this.players[idx].currentX;
								this.menuItemY[this.menuItemsCount] = this.players[idx].currentY;
								this.menuSourceType[this.menuItemsCount] = this.players[idx].serverIndex;
								this.menuItemsCount++;
							} else if (this.members) {
								this.menuItemText1[this.menuItemsCount] = 'Duel with';
								this.menuItemText2[this.menuItemsCount] = '@whi@' + this.players[idx].name + combatDifferential;
								this.menuItemX[this.menuItemsCount] = this.players[idx].currentX;
								this.menuItemY[this.menuItemsCount] = this.players[idx].currentY;
								this.menuItemID[this.menuItemsCount] = 2806;
								this.menuSourceType[this.menuItemsCount] = this.players[idx].serverIndex;
								this.menuItemsCount++;
							}

							this.menuItemText1[this.menuItemsCount] = 'Trade with';
							this.menuItemText2[this.menuItemsCount] = '@whi@' + this.players[idx].name + combatDifferential;
							this.menuItemID[this.menuItemsCount] = 2810;
							this.menuSourceType[this.menuItemsCount] = this.players[idx].serverIndex;
							this.menuItemsCount++;
							this.menuItemText1[this.menuItemsCount] = 'Follow';
							this.menuItemText2[this.menuItemsCount] = '@whi@' + this.players[idx].name + combatDifferential;
							this.menuItemID[this.menuItemsCount] = 2820;
							this.menuSourceType[this.menuItemsCount] = this.players[idx].serverIndex;
							this.menuItemsCount++;
						}
					} else if (type === 2) {
						if (this.selectedSpell >= 0) {
							if (GameData.spellType[this.selectedSpell] === 3) {
								this.menuItemText1[this.menuItemsCount] = 'Cast ' + GameData.spellName[this.selectedSpell] + ' on';
								this.menuItemText2[this.menuItemsCount] = '@lre@' + GameData.itemName[this.groundItemId[idx]];
								this.menuItemID[this.menuItemsCount] = 200;
								this.menuItemX[this.menuItemsCount] = this.groundItemX[idx];
								this.menuItemY[this.menuItemsCount] = this.groundItemY[idx];
								this.menuSourceType[this.menuItemsCount] = this.groundItemId[idx];
								this.menuSourceIndex[this.menuItemsCount] = this.selectedSpell;
								this.menuItemsCount++;
							}
						} else if (this.selectedItemInventoryIndex >= 0) {
							this.menuItemText1[this.menuItemsCount] = 'Use ' + this.selectedItemName + ' with';
							this.menuItemText2[this.menuItemsCount] = '@lre@' + GameData.itemName[this.groundItemId[idx]];
							this.menuItemID[this.menuItemsCount] = 210;
							this.menuItemX[this.menuItemsCount] = this.groundItemX[idx];
							this.menuItemY[this.menuItemsCount] = this.groundItemY[idx];
							this.menuSourceType[this.menuItemsCount] = this.groundItemId[idx];
							this.menuSourceIndex[this.menuItemsCount] = this.selectedItemInventoryIndex;
							this.menuItemsCount++;
						} else {
							this.menuItemText1[this.menuItemsCount] = 'Take';
							this.menuItemText2[this.menuItemsCount] = '@lre@' + GameData.itemName[this.groundItemId[idx]];
							this.menuItemID[this.menuItemsCount] = 220;
							this.menuItemX[this.menuItemsCount] = this.groundItemX[idx];
							this.menuItemY[this.menuItemsCount] = this.groundItemY[idx];
							this.menuSourceType[this.menuItemsCount] = this.groundItemId[idx];
							this.menuItemsCount++;
							this.menuItemText1[this.menuItemsCount] = 'Examine';
							this.menuItemText2[this.menuItemsCount] = '@lre@' + GameData.itemName[this.groundItemId[idx]];
							this.menuItemID[this.menuItemsCount] = 3200;
							this.menuSourceType[this.menuItemsCount] = this.groundItemId[idx];
							this.menuItemsCount++;
						}
					} else if (type === 3) {
						let s1 = '';
						let levelDiff = -1;
						if (!this.npcs[idx])
							continue;
						let id = this.npcs[idx].typeID;

						if (GameData.npcAttackable[id] > 0) {
							let npcLevel = Math.floor((GameData.npcAttack[id] + GameData.npcDefense[id] + GameData.npcStrength[id] + GameData.npcHits[id]) / 4);
							// Adds 27 levels to the total before dividing for the average; makes lvl3.25 default 1,1,1,10 stats to lv10 combat or lvl99 stats 99,99,99,99 stats to 105.75 combat
							let playerLevel = Math.floor((this.playerStatBase[0] + this.playerStatBase[1] + this.playerStatBase[2] + this.playerStatBase[3] + 27) / 4);

							levelDiff = playerLevel - npcLevel;
							s1 = '@yel@';
							if (levelDiff < 0)
								s1 = '@or1@';
							if (levelDiff < -3)
								s1 = '@or2@';
							if (levelDiff < -6)
								s1 = '@or3@';
							if (levelDiff < -9)
								s1 = '@red@';
							if (levelDiff > 0)
								s1 = '@gr1@';
							if (levelDiff > 3)
								s1 = '@gr2@';
							if (levelDiff > 6)
								s1 = '@gr3@';
							if (levelDiff > 9)
								s1 = '@gre@';
							s1 = ' ' + s1 + '(level-' + npcLevel + ')';
						}

						if (this.selectedSpell >= 0) {
							if (GameData.spellType[this.selectedSpell] === 2) {
								this.menuItemText1[this.menuItemsCount] = 'Cast ' + GameData.spellName[this.selectedSpell] + ' on';
								this.menuItemText2[this.menuItemsCount] = '@yel@' + GameData.npcName[this.npcs[idx].typeID];
								this.menuItemID[this.menuItemsCount] = 700;
								this.menuItemX[this.menuItemsCount] = this.npcs[idx].currentX;
								this.menuItemY[this.menuItemsCount] = this.npcs[idx].currentY;
								this.menuSourceType[this.menuItemsCount] = this.npcs[idx].serverIndex;
								this.menuSourceIndex[this.menuItemsCount] = this.selectedSpell;
								this.menuItemsCount++;
							}
						} else if (this.selectedItemInventoryIndex >= 0) {
							this.menuItemText1[this.menuItemsCount] = 'Use ' + this.selectedItemName + ' with';
							this.menuItemText2[this.menuItemsCount] = '@yel@' + GameData.npcName[this.npcs[idx].typeID];
							this.menuItemID[this.menuItemsCount] = 710;
							this.menuItemX[this.menuItemsCount] = this.npcs[idx].currentX;
							this.menuItemY[this.menuItemsCount] = this.npcs[idx].currentY;
							this.menuSourceType[this.menuItemsCount] = this.npcs[idx].serverIndex;
							this.menuSourceIndex[this.menuItemsCount] = this.selectedItemInventoryIndex;
							this.menuItemsCount++;
						} else {
							if (GameData.npcAttackable[id] > 0) {
								this.menuItemText1[this.menuItemsCount] = 'Attack';
								this.menuItemText2[this.menuItemsCount] = '@yel@' + GameData.npcName[this.npcs[idx].typeID] + s1;

								if (levelDiff >= 0) {
									this.menuItemID[this.menuItemsCount] = 715;
								} else {
									this.menuItemID[this.menuItemsCount] = 2715;
								}

								this.menuItemX[this.menuItemsCount] = this.npcs[idx].currentX;
								this.menuItemY[this.menuItemsCount] = this.npcs[idx].currentY;
								this.menuSourceType[this.menuItemsCount] = this.npcs[idx].serverIndex;
								this.menuItemsCount++;
							}

							this.menuItemText1[this.menuItemsCount] = 'Talk-to';
							this.menuItemText2[this.menuItemsCount] = '@yel@' + GameData.npcName[this.npcs[idx].typeID];
							this.menuItemID[this.menuItemsCount] = 720;
							this.menuItemX[this.menuItemsCount] = this.npcs[idx].currentX;
							this.menuItemY[this.menuItemsCount] = this.npcs[idx].currentY;
							this.menuSourceType[this.menuItemsCount] = this.npcs[idx].serverIndex;
							this.menuItemsCount++;

							if (GameData.npcCommand[id] !== '') {
								this.menuItemText1[this.menuItemsCount] = GameData.npcCommand[id];
								this.menuItemText2[this.menuItemsCount] = '@yel@' + GameData.npcName[this.npcs[idx].typeID];
								this.menuItemID[this.menuItemsCount] = 725;
								this.menuItemX[this.menuItemsCount] = this.npcs[idx].currentX;
								this.menuItemY[this.menuItemsCount] = this.npcs[idx].currentY;
								this.menuSourceType[this.menuItemsCount] = this.npcs[idx].serverIndex;
								this.menuItemsCount++;
							}

							this.menuItemText1[this.menuItemsCount] = 'Examine';
							this.menuItemText2[this.menuItemsCount] = '@yel@' + GameData.npcName[this.npcs[idx].typeID];
							this.menuItemID[this.menuItemsCount] = 3700;
							this.menuSourceType[this.menuItemsCount] = this.npcs[idx].typeID;
							this.menuItemsCount++;
						}
					}
				} else if (gameModel && gameModel.key >= 10000) {
					let idx = gameModel.key - 10000;
					let id = this.wallObjectId[idx];

					if (!this.wallObjectAlreadyInMenu[idx]) {
						if (this.selectedSpell >= 0) {
							if (GameData.spellType[this.selectedSpell] === 4) {
								this.menuItemText1[this.menuItemsCount] = 'Cast ' + GameData.spellName[this.selectedSpell] + ' on';
								this.menuItemText2[this.menuItemsCount] = '@cya@' + GameData.wallObjectName[id];
								this.menuItemID[this.menuItemsCount] = 300;
								this.menuItemX[this.menuItemsCount] = this.wallObjectX[idx];
								this.menuItemY[this.menuItemsCount] = this.wallObjectY[idx];
								this.menuSourceType[this.menuItemsCount] = this.wallObjectDirection[idx];
								this.menuSourceIndex[this.menuItemsCount] = this.selectedSpell;
								this.menuItemsCount++;
							}
						} else if (this.selectedItemInventoryIndex >= 0) {
							this.menuItemText1[this.menuItemsCount] = 'Use ' + this.selectedItemName + ' with';
							this.menuItemText2[this.menuItemsCount] = '@cya@' + GameData.wallObjectName[id];
							this.menuItemID[this.menuItemsCount] = 310;
							this.menuItemX[this.menuItemsCount] = this.wallObjectX[idx];
							this.menuItemY[this.menuItemsCount] = this.wallObjectY[idx];
							this.menuSourceType[this.menuItemsCount] = this.wallObjectDirection[idx];
							this.menuSourceIndex[this.menuItemsCount] = this.selectedItemInventoryIndex;
							this.menuItemsCount++;
						} else {
							if (!/^WalkTo$/i.test(GameData.wallObjectCommand1[id])) {
								this.menuItemText1[this.menuItemsCount] = GameData.wallObjectCommand1[id];
								this.menuItemText2[this.menuItemsCount] = '@cya@' + GameData.wallObjectName[id];
								this.menuItemID[this.menuItemsCount] = 320;
								this.menuItemX[this.menuItemsCount] = this.wallObjectX[idx];
								this.menuItemY[this.menuItemsCount] = this.wallObjectY[idx];
								this.menuSourceType[this.menuItemsCount] = this.wallObjectDirection[idx];
								this.menuItemsCount++;
							}

							if (!/^Examine$/i.test(GameData.wallObjectCommand2[id])) {
								this.menuItemText1[this.menuItemsCount] = GameData.wallObjectCommand2[id];
								this.menuItemText2[this.menuItemsCount] = '@cya@' + GameData.wallObjectName[id];
								this.menuItemID[this.menuItemsCount] = 2300;
								this.menuItemX[this.menuItemsCount] = this.wallObjectX[idx];
								this.menuItemY[this.menuItemsCount] = this.wallObjectY[idx];
								this.menuSourceType[this.menuItemsCount] = this.wallObjectDirection[idx];
								this.menuItemsCount++;
							}

							this.menuItemText1[this.menuItemsCount] = 'Examine';
							this.menuItemText2[this.menuItemsCount] = '@cya@' + GameData.wallObjectName[id];
							this.menuItemID[this.menuItemsCount] = 3300;
							this.menuSourceType[this.menuItemsCount] = id;
							this.menuItemsCount++;
						}

						this.wallObjectAlreadyInMenu[idx] = true;
					}
				} else if (gameModel && gameModel.key >= 0) {
					let idx = gameModel.key;
					let id = this.objectId[idx];

					if (!this.objectAlreadyInMenu[idx]) {
						if (this.selectedSpell >= 0) {
							if (GameData.spellType[this.selectedSpell] === 5) {
								this.menuItemText1[this.menuItemsCount] = 'Cast ' + GameData.spellName[this.selectedSpell] + ' on';
								this.menuItemText2[this.menuItemsCount] = '@cya@' + GameData.objectName[id];
								this.menuItemID[this.menuItemsCount] = 400;
								this.menuItemX[this.menuItemsCount] = this.objectX[idx];
								this.menuItemY[this.menuItemsCount] = this.objectY[idx];
								this.menuSourceType[this.menuItemsCount] = this.objectDirection[idx];
								this.menuSourceIndex[this.menuItemsCount] = this.objectId[idx];
								this.menuTargetIndex[this.menuItemsCount] = this.selectedSpell;
								this.menuItemsCount++;
							}
						} else if (this.selectedItemInventoryIndex >= 0) {
							this.menuItemText1[this.menuItemsCount] = 'Use ' + this.selectedItemName + ' with';
							this.menuItemText2[this.menuItemsCount] = '@cya@' + GameData.objectName[id];
							this.menuItemID[this.menuItemsCount] = 410;
							this.menuItemX[this.menuItemsCount] = this.objectX[idx];
							this.menuItemY[this.menuItemsCount] = this.objectY[idx];
							this.menuSourceType[this.menuItemsCount] = this.objectDirection[idx];
							this.menuSourceIndex[this.menuItemsCount] = this.objectId[idx];
							this.menuTargetIndex[this.menuItemsCount] = this.selectedItemInventoryIndex;
							this.menuItemsCount++;
						} else {
							if (!/^WalkTo$/i.test(GameData.objectCommand1[id])) {
								this.menuItemText1[this.menuItemsCount] = GameData.objectCommand1[id];
								this.menuItemText2[this.menuItemsCount] = '@cya@' + GameData.objectName[id];
								this.menuItemID[this.menuItemsCount] = 420;
								this.menuItemX[this.menuItemsCount] = this.objectX[idx];
								this.menuItemY[this.menuItemsCount] = this.objectY[idx];
								this.menuSourceType[this.menuItemsCount] = this.objectDirection[idx];
								this.menuSourceIndex[this.menuItemsCount] = this.objectId[idx];
								this.menuItemsCount++;
							}

							if (!/^Examine$/i.test(GameData.objectCommand2[id])) {
								this.menuItemText1[this.menuItemsCount] = GameData.objectCommand2[id];
								this.menuItemText2[this.menuItemsCount] = '@cya@' + GameData.objectName[id];
								this.menuItemID[this.menuItemsCount] = 2400;
								this.menuItemX[this.menuItemsCount] = this.objectX[idx];
								this.menuItemY[this.menuItemsCount] = this.objectY[idx];
								this.menuSourceType[this.menuItemsCount] = this.objectDirection[idx];
								this.menuSourceIndex[this.menuItemsCount] = this.objectId[idx];
								this.menuItemsCount++;
							}

							this.menuItemText1[this.menuItemsCount] = 'Examine';
							this.menuItemText2[this.menuItemsCount] = '@cya@' + GameData.objectName[id];
							this.menuItemID[this.menuItemsCount] = 3400;
							this.menuSourceType[this.menuItemsCount] = id;
							this.menuItemsCount++;
						}

						this.objectAlreadyInMenu[idx] = true;
					}
				} else {
					if (pid >= 0) {
						pid = gameModel.faceTag[pid] - 200000;
					}

					if (pid >= 0) {
						j = pid;
					}
				}
			}
		}

		if (this.selectedSpell >= 0 && GameData.spellType[this.selectedSpell] <= 1) {
			this.menuItemText1[this.menuItemsCount] = 'Cast ' + GameData.spellName[this.selectedSpell] + ' on self';
			this.menuItemText2[this.menuItemsCount] = '';
			this.menuItemID[this.menuItemsCount] = 1000;
			this.menuSourceType[this.menuItemsCount] = this.selectedSpell;
			this.menuItemsCount++;
		}

		if (j !== -1) {
			if (this.selectedSpell >= 0) {
				if (GameData.spellType[this.selectedSpell] === 6) {
					this.menuItemText1[this.menuItemsCount] = 'Cast ' + GameData.spellName[this.selectedSpell] + ' on ground';
					this.menuItemText2[this.menuItemsCount] = '';
					this.menuItemID[this.menuItemsCount] = 900;
					this.menuItemX[this.menuItemsCount] = this.world.localX[j];
					this.menuItemY[this.menuItemsCount] = this.world.localY[j];
					this.menuSourceType[this.menuItemsCount] = this.selectedSpell;
					this.menuItemsCount++;


				}
			} else if (this.selectedItemInventoryIndex < 0) {
				this.menuItemText1[this.menuItemsCount] = 'Walk here';
				this.menuItemText2[this.menuItemsCount] = '';
				this.menuItemID[this.menuItemsCount] = 920;
				this.menuItemX[this.menuItemsCount] = this.world.localX[j];
				this.menuItemY[this.menuItemsCount++] = this.world.localY[j];
			}
		}
	}

	async handleInputs() {
		if (this.runtimeException || !this.surface)
			return;

		this.frameCounter++;
		try {
			if (this.gameState === GameStates.LOGIN)
				// idle frame count, reset upon any user input or login screen
				//this.mouseActionTimeout = 0;
				await this.handleLoginScreenInput();
			else if (this.gameState === GameStates.WORLD)
//				this.mouseActionTimeout++;
				await this.handleGameInput();
		} catch (e) {
			this.freeCacheMemory();
			// OutOfMemory
			this.runtimeException = new GameException(e, true);
			console.error(e);
		}

		this.lastMouseButtonDown = 0;
		// this.middleButtonDown = false;
		this.cameraRotationTime++;
		if (this.messageTabFlashAll > 0)
			this.messageTabFlashAll--;
		if (this.messageTabFlashHistory > 0)
			this.messageTabFlashHistory--;
		if (this.messageTabFlashQuest > 0)
			this.messageTabFlashQuest--;
		if (this.messageTabFlashPrivate > 0)
			this.messageTabFlashPrivate--;
	}

	async handleLoginScreenInput() {
		if (this.worldFullTimeout > 0)
			this.worldFullTimeout--;

		if (this.welcomeState === WelcomeStates.WELCOME && this.panelLogin[WelcomeStates.WELCOME]) {
			this.panelLogin[WelcomeStates.WELCOME].handleMouse(this.mouseX, this.mouseY, this.lastMouseButtonDown, this.mouseButtonDown);

			if (this.panelLogin[WelcomeStates.WELCOME].isClicked(this.controlWelcomeNewuser)) {
				this.panelLogin[WelcomeStates.NEW_USER].setTextHandle(this.controlRegisterStatus, 'To create an account please enter all the requested details');
				this.panelLogin[WelcomeStates.NEW_USER].setTextHandle(this.controlRegisterUser, '');
				this.panelLogin[WelcomeStates.NEW_USER].setTextHandle(this.controlRegisterPassword, '');
				this.panelLogin[WelcomeStates.NEW_USER].setTextHandle(this.controlRegisterConfirmPassword, '');
				this.panelLogin[WelcomeStates.NEW_USER].toggleCheckbox(this.controlRegisterCheckbox, false);
				this.panelLogin[WelcomeStates.NEW_USER].setFocus(this.controlRegisterUser);
				this.welcomeState = WelcomeStates.NEW_USER;
			} else if (this.panelLogin[WelcomeStates.WELCOME].isClicked(this.controlWelcomeExistinguser)) {
				this.panelLogin[WelcomeStates.EXISTING_USER].setTextHandle(this.controlLoginStatus, 'Please enter your username and password');

				if (getCookie('savePass') !== 'true') {
					this.panelLogin[WelcomeStates.EXISTING_USER].toggleCheckbox(this.controlLoginSavePass, false);
					this.panelLogin[WelcomeStates.EXISTING_USER].setTextHandle(this.controlLoginUser, '');
					this.panelLogin[WelcomeStates.EXISTING_USER].setTextHandle(this.controlLoginPass, '');
					this.panelLogin[WelcomeStates.EXISTING_USER].setFocus(this.controlLoginUser);
				} else {
					this.panelLogin[WelcomeStates.EXISTING_USER].toggleCheckbox(this.controlLoginSavePass, true);
					this.panelLogin[WelcomeStates.EXISTING_USER].setTextHandle(this.controlLoginUser, this.loginUser || getCookie('username'));
					this.panelLogin[WelcomeStates.EXISTING_USER].setFocus(this.controlLoginPass);
				}
				this.welcomeState = WelcomeStates.EXISTING_USER;
			}
		} else if (this.welcomeState === WelcomeStates.NEW_USER && this.panelLogin[WelcomeStates.NEW_USER]) {
			this.panelLogin[WelcomeStates.NEW_USER].handleMouse(this.mouseX, this.mouseY, this.lastMouseButtonDown, this.mouseButtonDown);

			if (this.panelLogin[WelcomeStates.NEW_USER].isClicked(this.controlRegisterCancel)) {
				this.welcomeState = WelcomeStates.WELCOME;
				return;
			}

			if (this.panelLogin[WelcomeStates.NEW_USER].isClicked(this.controlRegisterUser)) {
				this.panelLogin[WelcomeStates.NEW_USER].setFocus(this.controlRegisterPassword);
				return;
			}

			if (this.panelLogin[WelcomeStates.NEW_USER].isClicked(this.controlRegisterPassword)) {
				this.panelLogin[WelcomeStates.NEW_USER].setFocus(this.controlRegisterConfirmPassword);
				return;
			}

			if (this.panelLogin[WelcomeStates.NEW_USER].isClicked(this.controlRegisterConfirmPassword) || this.panelLogin[WelcomeStates.NEW_USER].isClicked(this.controlRegisterSubmit)) {
				let username = this.panelLogin[WelcomeStates.NEW_USER].getText(this.controlRegisterUser);
				let pass = this.panelLogin[WelcomeStates.NEW_USER].getText(this.controlRegisterPassword);
				let confPass = this.panelLogin[WelcomeStates.NEW_USER].getText(this.controlRegisterConfirmPassword);
				if (!username || !pass || !confPass) {
					this.panelLogin[WelcomeStates.NEW_USER].setTextHandle(this.controlRegisterStatus, '@yel@You must provide a username and password to continue.');
					return;
				}

				if (!this.panelLogin[WelcomeStates.NEW_USER].isActivated(this.controlRegisterCheckbox)) {
					this.panelLogin[WelcomeStates.NEW_USER].setTextHandle(this.controlRegisterStatus, '@yel@You must read and agree to the terms+conditions to continue.');
					return;
				}

				if (username.length < 3 || username.length > 12) {
					this.panelLogin[WelcomeStates.NEW_USER].setTextHandle(this.controlRegisterStatus, '@yel@Your username must be between 3 and 12 characters long.');
					return;
				}
				if (pass.length < 5 || pass.length > 20) {
					this.panelLogin[WelcomeStates.NEW_USER].setTextHandle(this.controlRegisterStatus, '@yel@Your password must be between 5 and 20 characters long.');
					return;
				}
				if (pass !== confPass) {
					this.panelLogin[WelcomeStates.NEW_USER].setTextHandle(this.controlRegisterStatus, '@yel@The two passwords entered are not the same as each other!');
					return;
				}
				if (pass === username) {
					this.panelLogin[WelcomeStates.NEW_USER].setTextHandle(this.controlRegisterStatus, '@yel@Your password can not be the same as your username!');
					return;
				}
				this.panelLogin[WelcomeStates.NEW_USER].setTextHandle(this.controlRegisterStatus, 'Please wait... attempting to create user');

				await super.registerAccount(username, pass);
				return;
			}
		} else if (this.welcomeState === WelcomeStates.EXISTING_USER) {
			if (!this.panelLogin[WelcomeStates.EXISTING_USER]) {
				return;
			}
			this.panelLogin[WelcomeStates.EXISTING_USER].handleMouse(this.mouseX, this.mouseY, this.lastMouseButtonDown, this.mouseButtonDown);

			if (this.panelLogin[WelcomeStates.EXISTING_USER].isClicked(this.controlLoginCancel)) {
				this.welcomeState = WelcomeStates.WELCOME;
				return;
			}

			if (this.panelLogin[WelcomeStates.EXISTING_USER].isClicked(this.controlLoginUser)) {
				this.panelLogin[WelcomeStates.EXISTING_USER].setFocus(this.controlLoginPass);
				return;
			}

			if (this.panelLogin[WelcomeStates.EXISTING_USER].isClicked(this.controlLoginPass) || this.panelLogin[WelcomeStates.EXISTING_USER].isClicked(this.controlLoginOk)) {
				this.loginUser = this.panelLogin[WelcomeStates.EXISTING_USER].getText(this.controlLoginUser);
				this.loginPass = this.panelLogin[WelcomeStates.EXISTING_USER].getText(this.controlLoginPass);
				setCookie('username', this.panelLogin[WelcomeStates.EXISTING_USER].getText(this.controlLoginUser), 30);
				setCookie('savePass', this.panelLogin[WelcomeStates.EXISTING_USER].isActivated(this.controlLoginSavePass), 30);
				await super.login(this.panelLogin[WelcomeStates.EXISTING_USER].getText(this.controlLoginUser),
						this.panelLogin[WelcomeStates.EXISTING_USER].getText(this.controlLoginPass), false,
						this.panelLogin[WelcomeStates.EXISTING_USER].isActivated(this.controlLoginSavePass));
				return;
			}
		}
	}

	async loadMaps() {
		this.world.mapPack = await this.readDataFile('maps' + VERSION.MAPS + '.jag', 'map', 70);

		if (this.members)
			this.world.memberMapPack = await this.readDataFile('maps' + VERSION.MAPS + '.mem', 'members map', 75);

		this.world.landscapePack = await this.readDataFile('land' + VERSION.MAPS + '.jag', 'landscape', 80);

		if (this.members)
			this.world.memberLandscapePack = await this.readDataFile('land' + VERSION.MAPS + '.mem', 'members landscape', 85);
	}

	createBoundaryModel(x, y, direction, id, count) {
		let x1 = x;
		let y1 = y;
		let x2 = x;
		let y2 = y;
		let j2 = GameData.wallObjectTextureFront[id];
		let k2 = GameData.wallObjectTextureBack[id];
		let l2 = GameData.wallObjectHeight[id];
		let gameModel = GameModel._from2(4, 1);
		switch (direction) {
		case 0:
			x2++;
			break;
		case 1:
			y2++;
			break;
		case 2:
			x1++;
			y2++;
			break;
		case 3:
			x2++;
			y2++;
			break;
		}

		// x1 *= this.tileSize;
		// y1 *= this.tileSize;
		// x2 *= this.tileSize;
		// y2 *= this.tileSize;
		x1 <<= 7;
		y1 <<= 7;
		x2 <<= 7;
		y2 <<= 7;

		let i3 = gameModel.vertexAt(x1, -this.world.getElevation(x1, y1), y1);
		let j3 = gameModel.vertexAt(x1, -this.world.getElevation(x1, y1) - l2, y1);
		let k3 = gameModel.vertexAt(x2, -this.world.getElevation(x2, y2) - l2, y2);
		let l3 = gameModel.vertexAt(x2, -this.world.getElevation(x2, y2), y2);
		let ai = new Int32Array([i3, j3, k3, l3]);

		gameModel.createFace(4, ai, j2, k2);
		// 60,24 is for ambience/magnitude presumptively
		// TODO: Verify my assumptions
		gameModel.createGouraudLightSource(false, 60, 24, -50, -10, -50);

		if (x >= 0 && y >= 0 && x < 96 && y < 96)
			this.scene.addModel(gameModel);

		gameModel.key = count + 10000;

		return gameModel;
	}

	destroy() {
		super.stop();
	}
}

Object.defineProperties(mudclient, {
	'spriteMedia': {
		value: 2000,
	},
	'spriteUtil': {
		value: 2100,
	},
	'spriteItem': {
		value: 2150,
	},
	'spriteLogo': {
		value: 3150,
	},
	'spriteProjectile': {
		value: 3160,
	},
	'spriteTexture': {
		value: 3210,
	},
	'spriteTextureWorld': {
		value: 3220,
	},
	'experienceTable': {
		value: (() => {
			if (!mudclient._experienceTable) {
				mudclient._experienceTable = new Uint32Array(MAX_STAT);
				let totalExp = 0;
				for (let level = 0; level < MAX_STAT-1; level++) {
					let exp = level+1 + 300 * (2 ** ((level+1) / 7)) >>> 0;
					totalExp += exp;
					// AND (NOT 3) will disable final 2 bits; identical semantics here to AND 0xFFFFFFC
					mudclient._experienceTable[level] = totalExp & (~3 >>> 0);
				}
			}
			return mudclient._experienceTable;
		})(),
	},
});
export {
	mudclient
}

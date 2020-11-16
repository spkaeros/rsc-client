import BZLib from './bzlib';
import Color from './lib/graphics/color';
import Font from './lib/graphics/font';
import Graphics from './lib/graphics/graphics';
import Socket from './lib/net/socket';
import Surface from './surface';
import { Utility, EngineStates, WelcomeStates, GameStates, GamePanels } from './utility';
import VERSION from './version';
import { TGA } from './lib/tga';
import download from './lib/net/file-download-stream'

const ModifierKeyNames = ['Control', 'Shift', 'Alt', 'CapsLock', 'OS', 'Delete', 'Insert', 'Tab', 'Unidentified', 'AudioVolumeMute', 'AudioVolumeUp', 'AudioVolumeDown',
		'MediaTrackPrevious', 'MediaPlay', 'MediaTrackNext', 'BrowserSearch', 'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12'];

function controlKey(key) {
	for (let name of ModifierKeyNames)
		if (key === name)
			return true;
	return false;
}

function keyPress(e) {
	switch (e.which) {
	case 27: // escape
		this.drawWelcomeNotification = false;
		this.bankVisible = false;
		this.shopVisible = false;
		this.tradeConfigVisible = false;
		this.duelConfigVisible = false;
		this.dialogItemInput = 0;
		this.abuseReportWindow = 0;
		this.contactsInputFormIndex = 0;
		e.preventDefault();
		break;
	case 37: // ← left arrow key
		this.keyLeft = true;
		e.preventDefault();
		break;
	case 39: // → right arrow key
		this.keyRight = true;
		e.preventDefault();
		break;
	case 38: // ↑ up arrow key
		e.preventDefault();
		if (++this.chatHistoryIndex >= this.chatHistory.length) {
			this.showMessage("Reached the top of chat history", 3);
			this.chatHistoryIndex = this.chatHistory.length-1;
			return;
		}
		this.panelGame[GamePanels.CHAT].setTextHandle(this.controlTextListAll, this.chatHistory[this.chatHistory.length - 1 - this.chatHistoryIndex]);
		return;
	case 40: // ↓ down arrow key
		e.preventDefault();
		if (--this.chatHistoryIndex < 0) {
			this.showMessage("Reached the bottom of chat history", 3);
			this.panelGame[GamePanels.CHAT].setTextHandle(this.controlTextListAll, '');
			this.chatHistoryIndex = -1;
			return;
		}
		this.panelGame[GamePanels.CHAT].setTextHandle(this.controlTextListAll, this.chatHistory[this.chatHistory.length - 1 - this.chatHistoryIndex]);
		return;
	case 32:
		this.keySpace = true;
		e.preventDefault();
		break;
	case 36:
		this.keyHome = true;
		e.preventDefault();
		break;
	case 33:
		this.keyUp = true;
		e.preventDefault();
		break;
	case 34:
		this.keyDown = true;
		e.preventDefault();
		break;
	case 112:
		this.interlace = !this.interlace;
		e.preventDefault();
		break;
	case 113:
		this.options.showRoofs = !this.options.showRoofs;
		e.preventDefault();
		break;
	case 114:
		this.showFps = !this.showFps;
		this.debug = !this.debug;
		this.dumpRequested = true;
		break;
	case 115:
		this.showFps = !this.showFps;
		this.debug = !this.debug;
		this.dumpRequested = true;
		break;
	case 116:
		this.showFps = !this.showFps;
		this.debug = !this.debug;
		this.dumpRequested = true;
		break;
	case 13:
		if (this.inputTextCurrent.length > 0)
			this.inputTextFinal = this.inputTextCurrent;
		if (this.inputPmCurrent.length > 0)
			this.inputPmFinal = this.inputPmCurrent;
		e.preventDefault();
		break;
	case 8:
		if (this.inputTextCurrent.length > 0)
			this.inputTextCurrent = this.inputTextCurrent.substring(0, this.inputTextCurrent.length - 1);
		if (this.inputPmCurrent.length > 0)
			this.inputPmCurrent = this.inputPmCurrent.substring(0, this.inputPmCurrent.length - 1);
		e.preventDefault();
		break;
	default:
		if (controlKey(e.key)) {
			
		}
		if (this.inputTextCurrent.length < 20)
			this.inputTextCurrent += e.key;
		if (this.inputPmCurrent.length < 80)
			this.inputPmCurrent += e.key;
		e.preventDefault();
		break;
	}
	if (this.gameState === GameStates.LOGIN && this.panelLogin && this.panelLogin[this.welcomeState]) {


		this.panelLogin[this.welcomeState].keyPress(e.which, e.key);
		e.preventDefault();
		return;
	}
	if (this.gameState === GameStates.WORLD) {
		if (this.showAppearanceChange && this.panelGame[GamePanels.APPEARANCE]) {
			// TODO: Need this?  No text input fields to speak of
			this.panelGame[GamePanels.APPEARANCE].keyPress(e.which, e.key);
			e.preventDefault();
			return;
		}
		if (this.dialogItemInput === 0 && this.contactsInputCtx === 0 && this.reportAbuseState === 0 && !this.isSleeping && this.panelGame[GamePanels.CHAT]) {
			e.preventDefault();
			this.panelGame[GamePanels.CHAT].keyPress(e.which, e.key);
			return;
		}
	}
}

function keyRelease(e) {
	e.preventDefault();
	switch (e.which) {
	case 37:
		this.keyLeft = false;
		break;
	case 39:
		this.keyRight = false;
		break;
	case 32:
		this.keySpace = false;
		break;
	case 36:
		this.keyHome = false;
		break;
	case 33:
		this.keyUp = false;
		break;
	case 34:
		this.keyDown = false;
		break;
	}
}

export default class GameShell {
	constructor(canvas) {
		this.engineState = EngineStates.IDLE;
		this.welcomeState = WelcomeStates.WELCOME;
		this.gameState = GameStates.LOGIN;
		this._canvas = canvas;
		this._graphics = new Graphics(this._canvas);
		this.options = {
			middleClickCamera: false,
			mouseWheel: false,
			resetCompass: false,
			zoomCamera: false,
			showRoofs: false
		};
		this.loopData = {
			frameIndex: 0,
			updateFactor: 256,
			lastUpdateFactor: 256,
			sleepDuration: 1,
			lastSleepDuration: 1,
			updateCounter: 0,
			intex: 0
		};
		this.middleButtonDown = false;
		this.mouseScrollDelta = 0;
		this.panelLogin = {};
		this.panelGame = {};
		// this.logoHeaderText = null;
		this.controlTextListAll = 0;
		this.mouseX = 0;
		this.mouseY = 0;
		this.mouseButtonDown = 0;
		this._shutdownCounter = 0;
		this.lastMouseButtonDown = 0;
		this.timings = [];
		this.loadingProgressPercent = 0;
		this.imageLogo = void 0;
		this.appletWidth = 512;
		this.appletHeight = 346;
		this.targetFrameTime = 20;
		this.hasRefererLogoNotUsed = false;
		this.loadingProgessText = 'Loading';
		this.showFps = false;
		this.debug = false;
		this.keyLeft = false;
		this.keyRight = false;
		this.keyUp = false;
		this.keyDown = false;
		this.keySpace = false;
		this.keyHome = false;
		this.keyPgUp = false;
		this.keyPgDown = false;
		this.maxTickTimeout = 1;
		this.interlace = false;
		this.inputTextCurrent = '';
		this.inputTextFinal = '';
		this.inputPmCurrent = '';
		this.inputPmFinal = '';
		this.chatHistory = [];
		this.chatHistoryIndex = 0;
		this.threadSleep = 1;
	}
	
	async startApplication(width, height) {
		this.engineState = EngineStates.IDLE;
		
		this._canvas.width = width;
		this._canvas.height = height;
		this.appletWidth = width;
		this.appletHeight = height;

        GameShell.gameFrame = this._canvas.getContext('2d', {
            alpha: false,
            desynchronized: true,
            antialias: true,
            depth: true,
            premultipliedAlpha: true,
            powerPreference: 'high-performance',
        });

        console.log('Starting engine...');

        // this._canvas.addEventListener('touchmove', this.mouseMoved.bind(this));
        // this._canvas.addEventListener('touchstart', this.mousePressed.bind(this));
        // this._canvas.addEventListener('touchend', this.mouseReleased.bind(this));

        this._canvas.addEventListener('mouseout', this.mouseOut.bind(this));
        this._canvas.addEventListener('mousedown', this.mousePressed.bind(this));
        this._canvas.addEventListener('mouseup', this.mouseReleased.bind(this));
        this._canvas.addEventListener('mousemove', this.mouseMoved.bind(this));
		this._canvas.addEventListener('mousewheel', this.mouseWheel.bind(this));
		this._canvas.addEventListener('wheel', this.mouseWheel.bind(this));
        this._canvas.addEventListener('contextmenu', this.eventBlocker.bind(this));
		window.addEventListener('keydown', keyPress.bind(this));
		window.addEventListener('keyup', keyRelease.bind(this));

		this.graphics = this.getGraphics();

		this.engineState = EngineStates.INITIALIZE_DATA;
		this.drawLoadingScreen(0, 'Loading...');
		await this.loadFonts();
		this.imageLogo = await this.fetchLogo();

		await this.run();
	}

	eventBlocker(e) {
		e.preventDefault();
	}

	setTargetFps(i) {
		this.targetFrameTime = 1000 / i;
	}

	unsetFrameTimes() {
		for (let i = 0; i < 10; i++) this.timings[i] = 0;
	}

	setFrameTimes() {
		for (let i = 0; i < 10; i++) this.timings[i] = Date.now();
	}

	mouseMoved(e) {
		e.preventDefault();
		this.mouseX = e.offsetX;
		this.mouseY = e.offsetY;
	}
	
	mouseReleased(e) {
		e.preventDefault();
		this.mouseX = e.offsetX;
		this.mouseY = e.offsetY;
		
		if (e.button === 1)
			this.middleButtonDown = false;
		this.mouseButtonDown = 0;
		return false;
	}
	
	mouseOut(e) {
		e.preventDefault();
		this.mouseX = e.offsetX;
		this.mouseY = e.offsetY;
		// this.mouseButtonDown = 0;
		// this.middleButtonDown = false;
		return false;
	}
	
	mousePressed(e) {
		e.preventDefault();
		this.mouseX = e.offsetX;
		this.mouseY = e.offsetY;

		// if (this.options.middleClickCamera && e.button === 1) {
			// this.middleButtonDown = true;
			// this.originRotation = this.cameraRotation;
			// this.originMouseX = this.mouseX;
			// return false;
		// }
		
		if (e.button > 3 || e.button < 0) {
			return false;
		}

		switch (e.button) {
		case 0:
			this.mouseButtonDown = 1;
			break;
		case 1:
			this.mouseButtonDown = 3;
			if (this.options.middleClickCamera) {
				this.middleButtonDown = true;
				this.originRotation = this.cameraRotation;
				this.originMouseX = this.mouseX;
			}
			break;
		case 2:
			this.mouseButtonDown = 2;
			break;
		}
		this.lastMouseButtonDown = this.mouseButtonDown;
		
		this.handleMouseDown(this.mouseButtonDown, this.mouseX, this.mouseY);
		return false;
	}
	
	handleMouseDown(button, x, y) {  }

	mouseWheel(e) {
		if (!this.options.mouseWheel)
			return;
		
		if (e.deltaMode === 0) {
			// deltaMode === 0 means deltaX/deltaY is given in pixels (chrome)
			this.mouseScrollDelta = Math.floor(e.deltaY / 14);
		} else if (e.deltaMode === 1) {
			// deltaMode === 1 means deltaX/deltaY is given in lines (firefox)
			this.mouseScrollDelta = Math.floor(e.deltaY);
		}
		
		return false;
	}
	
	start() {
		this.shutdownCounter = 0;
	}

	get shutdownCounter() {
		return !this._shutdownCounter ? 0 : this._shutdownCounter;
	}

	set shutdownCounter(count) {
		if (!this._shutdownCounter) {
			this._shutdownCounter = 0;
		} else {
			this._shutdownCounter = count;
		}
	}
	
	stop() {
		this.shutdownCounter = 4000 / this.targetFrameTime;
	}

	async handleInputs() {}
	async draw() {}

	async sleep(ms) {
		return new Promise(res => setTimeout(res, ms));
	}
	
	async run() {
		await this.startGame();
		this.engineState = EngineStates.RUNNING;

		let i = 0;
		let j = 256;
		let sleep = 1;
		let i1 = 0;

		for (let j1 = 0; j1 < 10; j1++)
			this.timings[j1] = Date.now();
			
		while (this._shutdownCounter >= 0) {
			if (this._shutdownCounter > 0) {
				if (--this._shutdownCounter <= 0) {
					this.clearResources();
					return;
				}
			}
//			this.loopData.lastUpdateFactor = this.loopData.updateFactor;
// 			this.loopData.updateFactor = 300;
//			this.loopData.lastSleepDuration = this.loopData.sleepDuration;
// 			this.loopData.sleepDuration = 1;
/*			const frameTime = Date.now();
			if (this.clockTimings[this.loopData.frameIndex] !== 0) {
				const clockDelta = frameTime - this.clockTimings[this.loopData.frameIndex];

//				this.loopData.updateFactor = 300;
//				this.loopData.sleepDuration = 1;
				if (clockDelta > 0)
					this.loopData.updateFactor = 2560*this.targetFrameTime / clockDelta | 0;

				if (this.loopData.updateFactor > 256) {
					this.loopData.updateFactor = 256;
					this.loopData.sleepDuration = Math.max(1, Math.min(20, this.targetFrameTime - clockDelta / 10 | 0));
				}

				// if (this.showFps)
				// 	console.log(clockDelta, "ratio=" + this.loopData.updateFactor, "ld=" + this.loopData.sleepDuration);
			}

			await zzz(this.loopData.sleepDuration);

			this.clockTimings[this.loopData.frameIndex] = frameTime;
			this.loopData.frameIndex = (this.loopData.frameIndex + 1) % 10;
			if (this.loopData.sleepDuration > 1)
				for (let optim of this.clockTimings)
					if (optim !== 0)
						optim += this.loopData.sleepDuration;

			while (this.loopData.updateCounter < 256) {
				await this.handleInputs();
				this.loopData.updateCounter += this.loopData.updateFactor;
			}
/*
			for (let inputs = 0; this.loopData.updateCounter < 256; inputs++) {
				this.loopData.updateCounter += this.loopData.updateFactor
				if (inputs > 12) {
					this.interlace = true;
					break;
				}
			}
* /
			this.loopData.updateCounter &= 0xFF;

			// Formula changed for faster calc with 50fps vars
			if (this.showFps && this.targetFrameTime > 0)
//				this.fps = (this.loopData.updateFactor >> 8) * (1000/this.targetFrameTime);
				this.fps = (1000*this.loopData.updateFactor) / (this.targetFrameTime << 8) | 0;

			this.draw();
			this.mouseScrollDelta = 0;
*/
			let k1 = j;
			let lastSleep = sleep;

			j = 300;
			sleep = 1;

			let time = Date.now();

			if (this.timings[i] === 0) {
				j = k1;
				sleep = lastSleep;
			} else if (time > this.timings[i])
				j = Math.floor(((2560 * this.targetFrameTime) / (time - this.timings[i])));

			if (j < 25)
				j = 25;

			if (j > 256) {
				j = 256;
				sleep = this.targetFrameTime - Math.floor((time - this.timings[i]) / 10);
			}

			if (sleep < this.threadSleep)
				sleep = this.threadSleep;
			await this.sleep(sleep);

			this.timings[i] = time;
			i = (i + 1) % 10;

			if (sleep > 1) {
				for (let j2 = 0; j2 < 10; j2++) {
					if (this.timings[j2] !== 0) {
						this.timings[j2] += sleep;
					}
				}
			}

			let k2 = 0;
			while (i1 < 256) {
				await this.handleInputs();
				i1 += j;
			}
			this.interlaceTimer--;
			if (this.dumpRequested || this.showFps && this.targetFrameTime > 0)
				this.fps = (1000*j) / (this.targetFrameTime << 8) | 0;
			i1 &= 0xFF;
			this.draw();

			this.mouseScrollDelta = 0;
			if (this.dumpRequested) {
				console.info("ntime:" + time);
				for (let i2 = 0; i2 < 10; i2++) {
					let optim = (i - i2 - 1 + 20) % 10;
					console.info("otim" + optim + ":" + this.timings[optim]);
				}
				console.info("fps:" + this.fps + " ratio:" + j + " count:" + i1);
				console.info("del:" + sleep + " targetFrameTime:" + this.targetFrameTime + " mindel:" + this.threadSleep);
				console.info("opos:" + i);
				this.dumpRequested = false;
			}
		}
	}

	update(g) {
		this.paint(g);
	}
	
	paint(g) {
		if (this.engineState.toNumber() < EngineStates.RUNNING.toNumber()) {
			if (this.imageLogo) {
				this.drawLoadingScreen(this.loadingProgressPercent, this.loadingProgessText);
			}
		}
	}
	
	async fetchLogo() {
		let buff = await this.readDataFile('jagex.jag', 'ZlackCode library', 0);
		if (!buff)
			return void 0;
		
		return this.createImage(Utility.loadData('logo.tga', 0, buff))
	}
	
	async loadFonts() {
		let buff = await this.readDataFile(`fonts` + VERSION.FONTS + `.jag`, 'Game fonts', 5);
		if (!buff)
			return;

		Surface.createFont(Utility.loadData('h11p.jf', 0, buff), 0);
		Surface.createFont(Utility.loadData('h12b.jf', 0, buff), 1);
		Surface.createFont(Utility.loadData('h12p.jf', 0, buff), 2);
		Surface.createFont(Utility.loadData('h13b.jf', 0, buff), 3);
		Surface.createFont(Utility.loadData('h14b.jf', 0, buff), 4);
		Surface.createFont(Utility.loadData('h16b.jf', 0, buff), 5);
		Surface.createFont(Utility.loadData('h20b.jf', 0, buff), 6);
		Surface.createFont(Utility.loadData('h24b.jf', 0, buff), 7);
	}
	
	drawLoadingScreen(percent, text) {
		if(!this.graphics)
			return;

		let midX = (this.appletWidth - 281) >>> 1;
		let midY = (this.appletHeight - 148) >>> 1;
		this.graphics.setColor(Color.BLACK);
		this.graphics.fillRect(0, 0, this.appletWidth, this.appletHeight);
		if (this.imageLogo)
			this.graphics.drawImage(this.imageLogo, midX, midY);
		this.graphics.setColor(Color.SHADOW_GRAY);
		midX += 2;
		midY += 90;
		this.loadingProgessText = text;
		this.loadingProgressPercent = percent;
		this.graphics.drawRect(midX - 2, midY - 2, 280, 23);
		this.graphics.fillRect(midX, midY, Math.floor((277 * percent) / 100), 20);
		
		this.graphics.setColor(Color.SILVER);
		this.drawString(this.graphics, this.loadingProgessText, Font.HELVETICA.withSize(12), midX + 138, midY + 12);
		this.drawString(this.graphics, 'Powered by RSCGo, a free and open source software project', Font.HELVETICA.bold(13), midX + 138, midY + 35);
		this.drawString(this.graphics, '\u00a92019-2020 Zach Knight, and the 2003scape team', Font.HELVETICA.bold(13), midX + 138, midY + 49);
		
		// not sure where this would have been used. maybe to indicate a special client?
		// if (this.logoHeaderText !== null) {
		//     this.graphics.setColor(Color.white);
		//     this.drawString(this.graphics, this.logoHeaderText, this.fontHelvetica13b, midX + 138, midY - 120);
		// }
	}
	
	updateLoadingStatus(curPercent, statusText) {
		if (!this.graphics)
			return;
		this.loadingProgressPercent = curPercent;
		this.loadingProgessText = statusText;
		let j = (this.appletWidth - 281) >>> 1;
		let k = (this.appletHeight - 148) >>> 1;
		j += 2;
		k += 90;

		let l = ((277 * curPercent) / 100) | 0;
		this.graphics.setColor(new Color(132, 132, 132));
		this.graphics.fillRect(j, k, l, 20);
		this.graphics.setColor(Color.black);
		this.graphics.fillRect(j + l, k, 277 - l, 20);

		this.graphics.setColor(new Color(198, 198, 198));
		this.drawString(this.graphics, statusText, Font.TIMES.bold(15), j + 138, k + 12);
	}
	
	drawString(g, s, font, i, j) {
		g.setFont(font);
		const { width, height } = g.ctx.measureText(s);
		g.drawString(s, i - (width >>> 1), j + (height >>> 1));
	}
	
	createImage(buff) {
		return new TGA(buff.buffer).getCanvas().getContext('2d').getImageData(0, 0, this._canvas.width, this._canvas.height);
	}
	
	async readDataFile(file, description, percent) {
		this.updateLoadingStatus(percent, `Loading ${description} - 0%`);
		let fileData = await download(`./static/cache/${file}`);
		let header = fileData.slice(0, 6);
		let archiveSize = ((header[0] & 0xFF) << 16) + ((header[1] & 0xFF) << 8) + (header[2] & 0xFF);
		let archiveSizeCompressed = ((header[3] & 0xFF) << 16) + ((header[4] & 0xFF) << 8) + (header[5] & 0xFF);
		
		let archiveData = fileData.slice(6);
		if (archiveData.length < archiveSizeCompressed) {
			return;
		}
		// this.updateLoadingStatus(percent, 'Loading ' + description + ' - ' + (5 + ((fileData.length - 6) * 95) / archiveSizeCompressed | 0) + '%');

		this.updateLoadingStatus(percent, 'Unpacking ' + description);
		if (archiveSizeCompressed !== archiveSize) {
			// archive was bzip-compressed as a whole, as a jagball
			let decompressed = Buffer.alloc(archiveSize);
			BZLib.decompress(decompressed, archiveSize, archiveData, archiveSizeCompressed, 0);
			return decompressed;
		}
		// Each entry has its own compression, or there is no compression involved here.
		return archiveData;
	}
	
	getGraphics() {
		return this._graphics;
	}
	
	async createSocket(host, port) {
		let socket = new Socket(host, port);
		await socket.connect();
		return socket;
	}
}

const BZLib = require('./bzlib');
const Color = require('./lib/graphics/color');
const Font = require('./lib/graphics/font');
const Graphics = require('./lib/graphics/graphics');
const Socket = require('./lib/net/socket');
const Surface = require('./surface');
const {Utility, WelcomeState, GameState, GamePanel} = require('./utility');
const VERSION = require('./version');
const { TGA } = require('./lib/tga');
const {FontStyle} = require('./lib/graphics/fontStyle');
const {Enum} = require('./lib/enum');
const zzz = require('sleep-promise');

class EngineState extends Enum {}
EngineState.LAUNCH = new EngineState("Launching game engine");
EngineState.INITIALIZE_DATA = new EngineState("Downloading and setting up all the game assets");
EngineState.RUNNING = new EngineState("Engine clock is ticking");
EngineState.SHUTDOWN = new EngineState("Engine is shutting down");

const ModifierKeyNames = ['Control', 'Shift', 'Alt', 'CapsLock', 'OS', 'Delete', 'Insert', 'Tab', 'Unidentified', 'AudioVolumeMute', 'AudioVolumeUp', 'AudioVolumeDown',
		'MediaTrackPrevious', 'MediaPlay', 'MediaTrackNext', 'BrowserSearch', 'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12']

class GameShell {
	constructor(canvas) {
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
		this.mouseActionTimeout = 0;
		this.panelLogin = {};
		this.panelGame = {};
		this.engineState = EngineState.IDLE;
		this.gameState = GameState.LOGIN;
		this.welcomeState = WelcomeState.WELCOME;
		// this.logoHeaderText = null;
		this.controlTextListAll = 0;
		this.mouseX = 0;
		this.mouseY = 0;
		this.mouseButtonDown = 0;
		this.lastMouseButtonDown = 0;
		this.timings = [];
		this.shutdownCounter = 0;
		this.loadingProgressPercent = 0;
		this.imageLogo = null;
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
		this.lastLog = [];
		this.lastLogIdx = 0;
		this.threadSleep2 = 1;
	}
	
	async startApplication(width, height) {
		this.engineState = EngineState.IDLE;
		
		this._canvas.width = width;
		this._canvas.height = height;
		this.appletWidth = width;
		this.appletHeight = height;

        GameShell.gameFrame = this._canvas.getContext('2d', {
            alpha: false,
            desynchronized: true,
//            antialias: true,
        });

        console.log('Starting engine...');

        this._canvas.addEventListener('touchstart', this.mousePressed.bind(this));
        this._canvas.addEventListener('touchmove', this.mouseMoved.bind(this));
        this._canvas.addEventListener('touchend', this.mouseReleased.bind(this));

        this._canvas.addEventListener('mouseout', this.mouseOut.bind(this));
        this._canvas.addEventListener('mousedown', this.mousePressed.bind(this));
        this._canvas.addEventListener('contextmenu', this.eventBlocker.bind(this));
        this._canvas.addEventListener('mousemove', this.mouseMoved.bind(this));
        this._canvas.addEventListener('mouseup', this.mouseReleased.bind(this));
		this._canvas.addEventListener('wheel', this.mouseWheel.bind(this));
		window.addEventListener('keydown', this.keyPressed.bind(this));
		window.addEventListener('keyup', this.keyReleased.bind(this));
		
		this.graphics = this.getGraphics();

		this.engineState = EngineState.INITIALIZE_DATA;
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

    keyPressed(e) {
		if (this.gameState === GameState.LOGIN && this.panelLogin && this.panelLogin[this.welcomeState]) {
			for (let name of ModifierKeyNames) {
				if (e.key === name) {
					return true;
				}
			}

			this.panelLogin[this.welcomeState].keyPress(e.which, e.key);
			e.preventDefault();
			return;
        }
        if (this.gameState === GameState.WORLD) {
            if (this.showAppearanceChange && this.panelGame[GamePanel.APPEARANCE] !== null) {
                // TODO: Need this?  No text input fields to speak of
                this.panelGame[GamePanel.APPEARANCE].keyPress(e.which, e.key);
                e.preventDefault();
                return;
            }
			if (this.dialogItemInput === 0 && this.contactsInputCtx === 0 && this.reportAbuseState === 0 && !this.isSleeping && this.panelGame[GamePanel.CHAT]) {
                if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    if (this.lastLogIdx >= this.lastLog.length - 1) {
                        this.showMessage("End of chat history", 3);
                        return
                    }
                    this.lastLogIdx += 1;
                    this.panelGame[GamePanel.CHAT].updateText(this.controlTextListAll, this.lastLog[this.lastLog.length - 1 - this.lastLogIdx]);
                    return;
                } else if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    if (this.lastLogIdx > 0) {
                        this.lastLogIdx -= 1;
                        this.panelGame[GamePanel.CHAT].updateText(this.controlTextListAll, this.lastLog[this.lastLog.length - 1 - this.lastLogIdx]);
                    } else {
                        this.lastLogIdx = -1;
                        this.panelGame[GamePanel.CHAT].updateText(this.controlTextListAll, '');
                    }
                    return;
                }
                this.panelGame[GamePanel.CHAT].keyPress(e.which, e.key);
                e.preventDefault();
            }
        }

        switch (e.which) {
        case 27:
			this.drawWelcomeNotification = false;
			this.bankVisible = false;
			this.shopVisible = false;
			this.tradeConfigVisible = false;
			this.duelConfigVisible = false;
			this.contactsInputCtx = 0;
			this.dialogItemInput = 0;
			this.abuseReportWindow = 0;
			this.contactsInputFormIndex = 0;
			e.preventDefault();
			break;

		case 37:
			this.keyLeft = true;
			e.preventDefault();
			break;
		// case 38:
		// 	this.keyUp = true;
		// 	e.preventDefault();
		// 	break;
		case 39:
			this.keyRight = true;
			e.preventDefault();
			break;
		// case 40:
		// 	this.keyDown = true;
		// 	e.preventDefault();
		// 	break;
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
			// this.dumpRequested = true;
			this.showFps = !this.showFps;
			break;
		case 115:
			// this.dumpRequested = true;
			this.dumpRequested = true;
			break;
		case 116:
			// this.dumpRequested = true;
			this.debug = !this.debug;
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
			for (let name of ModifierKeyNames) {
				if (e.key === name) {
					return true;
				}
			}

			if (this.inputTextCurrent.length < 20)
				this.inputTextCurrent += e.key;
			if (this.inputPmCurrent.length < 80)
				this.inputPmCurrent += e.key;
			e.preventDefault();
			break;
        }

        return false;
    }

    keyReleased(e) {
        e.preventDefault();

        switch (e.which) {
            case 37:
                this.keyLeft = false;
                break;
            // case 38:
            // 	this.keyUp = false;
            // 	break;
            case 39:
                this.keyRight = false;
                break;
            // case 40:
            // 	this.keyDown = false;
            // 	break;
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

        return false;
    }

	mouseMoved(e) {
		e.preventDefault();
		this.mouseX = e.offsetX;
		this.mouseY = e.offsetY;
		this.mouseActionTimeout = 0;
	}
	
	mouseReleased(e) {
		e.preventDefault();
		this.mouseX = e.offsetX;
		this.mouseY = e.offsetY;
		this.mouseButtonDown = 0;
		
		if (e.button === 1) {
			this.middleButtonDown = false;
		}
	}
	
	mouseOut(e) {
		e.preventDefault();
		this.mouseX = e.offsetX;
		this.mouseY = e.offsetY;
		this.mouseButtonDown = 0;
		this.middleButtonDown = false;
	}
	
	mousePressed(e) {
		e.preventDefault();
		
		let x = e.offsetX;
		let y = e.offsetY;
		
		this.mouseX = x;
		this.mouseY = y;
		
		if (this.options.middleClickCamera && e.button === 1) {
			this.middleButtonDown = true;
			this.originRotation = this.cameraRotation;
			this.originMouseX = this.mouseX;
			return false;
		}
		
		if(e.button === 0) {
			this.mouseButtonDown = 1;
		} else if(e.button === 2) {
			this.mouseButtonDown = 2;
		} else {
			return false;
		}
		
		this.lastMouseButtonDown = this.mouseButtonDown;
		this.mouseActionTimeout = 0;
		this.handleMouseDown(this.mouseButtonDown, x, y);
		
		return false;
	}
	
	mouseWheel(e) {
		e.preventDefault();
		if (!this.options.mouseWheel) {
			return;
		}
		
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
		if (this.shutdownCounter >= 0)
			this.shutdownCounter = 0;
	}
	
	stop() {
		if (this.shutdownCounter >= 0)
			this.shutdownCounter = 4000 / this.targetFrameTime;
	}

	async handleInputs() {}
	async draw() {}

	async sleep(ms) {
		return new Promise(res => setTimeout(res, ms));
	}
	
	async run() {
		await this.startGame();
		this.engineState = EngineState.RUNNING;

		let i = 0;
		let j = 256;
		let sleep = 1;
		let i1 = 0;

//		this.setFrameTimes();

		for (let j1 = 0; j1 < 10; j1++)
			this.timings[j1] = Date.now();
		while (this.shutdownCounter >= 0) {
			if (this.shutdownCounter > 0) {
				if (--this.shutdownCounter === 0) {
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
				} else if (time > this.timings[i]) {
					j = (((2560 * this.targetFrameTime) / (time - this.timings[i]))) | 0;
				}

				if (j < 25) {
					j = 25;
				}

				if (j > 256) {
					j = 256;
					sleep = (this.targetFrameTime - ((time - this.timings[i]) / 10)) | 0;
				}

				if (sleep < this.threadSleep2) {
					sleep = this.threadSleep2;
				}
//			}

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
			i1 &= 0xff;
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
	
	// eslint-disable-next-line no-unused-vars
	paint(g) {
		if (this.engineState.toNumber() < EngineState.RUNNING.toNumber()) {
			if (this.imageLogo !== null) {
				this.drawLoadingScreen(this.loadingProgressPercent, this.loadingProgessText);
			}
		}
	}
	
	async fetchLogo() {
		let buff = await this.readDataFile('jagex.jag', 'ZlackCode library', 0);
		if (buff === null) {
			return null;
		}
		
		return this.createImage(Utility.loadData('logo.tga', 0, buff))
	}
	
	async loadFonts() {
		let buff = await this.readDataFile(`fonts${VERSION.FONTS}.jag`, 'Game fonts', 5);
		
		if (buff === null) {
			return;
		}
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
		let midX = ((this.appletWidth - 281) / 2) | 0;
		let midY = ((this.appletHeight - 148) / 2) | 0;
		
		this.graphics.setColor(Color.black);
		this.graphics.fillRect(0, 0, this.appletWidth, this.appletHeight);
		
		if (!this.hasRefererLogoNotUsed) {
			if (this.imageLogo !== null) {
				this.graphics.drawImage(this.imageLogo, midX, midY);
			}
			this.graphics.setColor(new Color(132, 132, 132));
		} else {
			
			this.graphics.setColor(new Color(220, 0, 0));
		}
		midX += 2;
		midY += 90;
		this.loadingProgessText = text;
		this.loadingProgressPercent = percent;
		this.graphics.drawRect(midX - 2, midY - 2, 280, 23);
		this.graphics.fillRect(midX, midY, (277 * percent) / 100 | 0, 20);
		
		if (!this.hasRefererLogoNotUsed) {
			this.graphics.setColor(new Color(198, 198, 198));
		} else {
			this.graphics.setColor(new Color(255, 255, 255));
		}
		this.drawString(this.graphics, this.loadingProgessText, Font.HELVETICA.withConfig(FontStyle.NORMAL, 12), midX + 138, midY + 12);
		
		if (!this.hasRefererLogoNotUsed) {
			this.drawString(this.graphics, 'Powered by RSCGo, a free and open source software project', Font.HELVETICA.withConfig(FontStyle.BOLD, 13), midX + 138, midY + 35);
			this.drawString(this.graphics, '\u00a92019-2020 Zach Knight, and the 2003scape team', Font.HELVETICA.withConfig(FontStyle.BOLD, 13), midX + 138, midY + 49);
			// this.drawString(this.graphics, 'Created by JAGeX - visit www.jagex.com', Font.HELVETICA.withConfig(FontStyle.BOLD, 13), midX + 138, midY + 35); // midY + 30
			// this.drawString(this.graphics, '\u00a92001-2002 Andrew Gower and Jagex Ltd', Font.HELVETICA.withConfig(FontStyle.BOLD, 13), midX + 138, midY + 49); // midY + 44
		} else {
			this.graphics.setColor(new Color(132, 132, 152));
			this.drawString(this.graphics, '\u00a92019-2020 Zach Knight, and the 2003scape team', Font.HELVETICA.withConfig(FontStyle.BOLD, 13), midX + 138, midY - 20);
			// this.drawString(this.graphics, '\u00a92001-2002 Andrew Gower and Jagex Ltd', Font.HELVETICA.withConfig(FontStyle.NORMAL, 12), midX + 138, this.appletHeight - 20);
		}
		// not sure where this would have been used. maybe to indicate a special client?
		// if (this.logoHeaderText !== null) {
		//     this.graphics.setColor(Color.white);
		//     this.drawString(this.graphics, this.logoHeaderText, this.fontHelvetica13b, midX + 138, midY - 120);
		// }
	}
	
	updateLoadingStatus(curPercent, statusText) {
		this.loadingProgressPercent = curPercent;
		this.loadingProgessText = statusText;
		let j = ((this.appletWidth - 281) / 2) | 0;
		let k = ((this.appletHeight - 148) / 2) | 0;
		j += 2;
		k += 90;
		
		this.graphics.setColor(new Color(132, 132, 132));
		if (this.hasRefererLogoNotUsed) {
			this.graphics.setColor(new Color(220, 0, 0));
		}
		let l = ((277 * curPercent) / 100) | 0;
		this.graphics.fillRect(j, k, l, 20);
		this.graphics.setColor(Color.black);
		this.graphics.fillRect(j + l, k, 277 - l, 20);
		
		this.graphics.setColor(new Color(198, 198, 198));
		if (this.hasRefererLogoNotUsed) {
			this.graphics.setColor(new Color(255, 255, 255));
		}
		
		this.drawString(this.graphics, statusText, Font.TIMES.withConfig(FontStyle.BOLD, 15), j + 138, k + 12);
	}
	
	drawString(g, s, font, i, j) {
		g.setFont(font);
		const { width, height } = g.ctx.measureText(s);
		g.drawString(s, i - ((width / 2) | 0), j + ((height / 4) | 0));
	}
	
	createImage(buff) {
		let tgaImage = new TGA(buff.buffer);
		
		const canvas = tgaImage.getCanvas();
		const ctx = canvas.getContext('2d');
		const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
		
		return imageData;
	}
	
	async readDataFile(file, description, percent) {
		file = './static/cache/' + file;
		
		
		this.updateLoadingStatus(percent, 'Loading ' + description + ' - 0%');
		
		let fileDownloadStream = Utility.openFile(file);
		let header = new Int8Array(6);
		
		await fileDownloadStream.readFully(header, 0, 6);
		
		let archiveSize = ((header[0] & 0xFF) << 16) + ((header[1] & 0xFF) << 8) + (header[2] & 0xFF);
		let archiveSizeCompressed = ((header[3] & 0xFF) << 16) + ((header[4] & 0xFF) << 8) + (header[5] & 0xFF);
		
		this.updateLoadingStatus(percent, 'Loading ' + description + ' - 5%');
		
		let read = 0;
		let archiveData = new Int8Array(archiveSizeCompressed);
		
		while (read < archiveSizeCompressed) {
			let length = Math.min(archiveSizeCompressed - read, 8192);
			await fileDownloadStream.readFully(archiveData, read, length);
			read += length;

			this.updateLoadingStatus(percent, 'Loading ' + description + ' - ' + (5 + (read * 95) / archiveSizeCompressed | 0) + '%');
		}
		
		
		this.updateLoadingStatus(percent, 'Unpacking ' + description);
		if (archiveSizeCompressed !== archiveSize) {
			// archive was bzip-compressed as a whole, like a jagball or something
			let decompressed = new Int8Array(archiveSize);
			BZLib.decompress(decompressed, archiveSize, archiveData, archiveSizeCompressed, 0);
			return decompressed;
		} else {
			// Each entry has its own compression, or there is no compression involved here.
			return archiveData;
		}
	}
	
	getGraphics() {
		//return new Graphics(this.canvas);
		return this._graphics;
	}
	
	async createSocket(s, i) {
		let socket = new Socket(s, i);
		await socket.connect();
		return socket;
	}
}

GameShell.gameFrame = null;

module.exports = GameShell;

const BZLib = require('./bzlib');
const Color = require('./lib/graphics/color');
const Font = require('./lib/graphics/font');
const Graphics = require('./lib/graphics/graphics');
const Socket = require('./lib/net/socket');
const Surface = require('./surface');
const {Utility, WelcomeState, GameState, GamePanel} = require('./utility');
const VERSION = require('./version');
const zzz = require('sleep-promise');
const { TGA } = require('./lib/tga');
const {FontStyle} = require('./lib/graphics/fontStyle')
const {Enum} = require('./lib/enum');

class EngineState extends Enum {}
EngineState.LAUNCH = new EngineState("Launching game engine")
EngineState.INITIALIZE_DATA = new EngineState("Downloading and setting up all the game assets")
EngineState.RUNNING = new EngineState("Engine clock is ticking")
EngineState.SHUTDOWN = new EngineState("Emgine is shutting down")

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
		this.middleButtonDown = false;
		this.mouseScrollDelta = 0;
		this.mouseActionTimeout = 0;
		this.panelLogin = {};
		this.panelGame = {};
		this.engineState = EngineState.IDLE;
		this.gameState = GameState.LOGIN;
		this.welcomeState = WelcomeState.WELCOME;
		// this.logoHeaderText = null;
		this.mouseX = 0;
		this.mouseY = 0;
		this.mouseButtonDown = 0;
		this.lastMouseButtonDown = 0;
		this.clockTimings = [];
		this.unsetFrameTimes();
		this.shutdownCounter = 0;
		this.powerThrottle = 0;
		this.loadingProgressPercent = 0;
		this.imageLogo = null;
		this.appletWidth = 512;
		this.appletHeight = 346;
		this.targetFps = 20;
		this.inputClockRate = 1000;
		this.hasRefererLogoNotUsed = false;
		this.loadingProgessText = 'Loading';
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
	}
	
	// eslint-disable-next-line no-unused-vars
	async startApplication(width, height, title, resizeable) {
		this.engineState = EngineState.IDLE;
		
		// window.document.title = title;
		this._canvas.width = width;
		this._canvas.height = height;
		
		console.log('Started application');
		this.appletWidth = width;
		this.appletHeight = height;
		
		GameShell.gameFrame = this._canvas.getContext('2d', {
			alpha: false,
			desynchronized: true,
			depth:true,
			antialias:true,
		});
		
		this._canvas.addEventListener('mousedown', this.mousePressed.bind(this));
		this._canvas.addEventListener('contextmenu', this.eventBlocker.bind(this));
		this._canvas.addEventListener('mousemove', this.mouseMoved.bind(this));
		this._canvas.addEventListener('mouseup', this.mouseReleased.bind(this));
		this._canvas.addEventListener('mouseout', this.mouseOut.bind(this));
		this._canvas.addEventListener('wheel', this.mouseWheel.bind(this));
		window.addEventListener('keydown', this.keyPressed.bind(this));
		window.addEventListener('keyup', this.keyReleased.bind(this));
		
		this.graphics = this.getGraphics();

		this.engineState = EngineState.INITIALIZE_DATA;
		this.drawLoadingScreen(0, 'Loading...');
		await this.loadFonts();
		this.imageLogo = await this.fetchLogo();
		
		await this.startGame();
		await this.run();
	}
	
	eventBlocker(e) {
		e.preventDefault();
	}
	
	setTargetFps(i) {
		this.targetFps = 1000 / i;
	}
	
	unsetFrameTimes() {
		for (let i = 0; i < 10; i++) this.clockTimings[i] = 0;
	}
	
	setFrameTimes() {
		for (let i = 0; i < 10; i++) this.clockTimings[i] = Date.now();
	}
	
	keyPressed(e) {
		if (this.gameState === GameState.LOGIN && this.panelLogin !== null && this.panelLogin[this.welcomeState] !== null) {
			this.panelLogin[this.welcomeState].keyPress(e.which, e.key);
			e.preventDefault();
			return;
		}

		if (this.gameState === GameState.WORLD) {
			if (this.showAppearanceChange && this.panelGame[GamePanel.APPEARANCE] !== null) {
				this.panelGame[GamePanel.APPEARANCE].keyPress(e.which, e.key);
				return;
			}

			if (this.showDialogSocialInput === 0 && this.showDialogReportAbuseStep === 0 && !this.isSleeping && this.panelGame[GamePanel.CHAT]) {
				this.panelGame[GamePanel.CHAT].keyPress(e.which, e.key);
			}
		}
		switch (e.which) {
		case 37:
			this.keyLeft = true;
			e.preventDefault();
			break;
		case 38:
			this.keyUp = true;
			e.preventDefault();
			break;
		case 39:
			this.keyRight = true;
			e.preventDefault();
			break;
		case 40:
			this.keyDown = true;
			e.preventDefault();
			break;
		case 32:
			this.keySpace = true;
			e.preventDefault();
			break;
		case 36:
			this.keyHome = true;
			e.preventDefault();
			break;
		case 33:
			this.keyPgUp = true;
			e.preventDefault();
			break;
		case 34:
			this.keyPgDown = true;
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
		case 13:
			this.inputTextFinal = this.inputTextCurrent;
			this.inputPmFinal = this.inputPmCurrent;
			e.preventDefault();
			break;
		case 8:
			if (this.inputTextCurrent.length > 0) {
				this.inputTextCurrent = this.inputTextCurrent.substring(0, this.inputTextCurrent.length - 1);
			}
			
			if (this.inputPmCurrent.length > 0) {
				this.inputPmCurrent = this.inputPmCurrent.substring(0, this.inputPmCurrent.length - 1);
			}
			e.preventDefault();
			break;
		default:
			if (this.inputTextCurrent.length < 20) {
				this.inputTextCurrent += e.key;
			}
			
			if (this.inputPmCurrent.length < 80) {
				this.inputPmCurrent += e.key;
			}
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
		case 38:
			this.keyUp = false;
			break;
		case 39:
			this.keyRight = false;
			break;
		case 40:
			this.keyDown = false;
			break;
		case 32:
			this.keySpace = false;
			break;
		case 36:
			this.keyHome = false;
			break;
		case 33:
			this.keyPgUp = false;
			break;
		case 34:
			this.keyPgDown = false;
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
			// deltaMode === 0 means deltaY/deltaY is given in pixels (chrome)
			this.mouseScrollDelta = Math.floor(e.deltaY / 14);
		} else if (e.deltaMode === 1) {
			// deltaMode === 1 means deltaY/deltaY is given in lines (firefox)
			this.mouseScrollDelta = Math.floor(e.deltaY);
		}
		
		return false;
	}
	
	start() {
		if (this.shutdownCounter >= 0) {
			this.shutdownCounter = 0;
		}
	}
	
	stop() {
		if (this.shutdownCounter >= 0) {
			this.shutdownCounter = 4000 / this.targetFps;
		}
	}
	
	async run() {
		// if (this.engineState.toNumber() < EngineState.INITIALIZE_DATA.toNumber()) {
		// 	this.engineState = EngineState.INITIALIZE_DATA;
		// 	this.drawLoadingScreen(0, 'Loading...');
		// 	await this.loadFonts()
		// 	this.imageLogo = await this.fetchLogo()
		// 	await this.startGame();
		// }
		this.engineState = EngineState.RUNNING;
		
		let clockTick = 0;
		let lastInputTimeslice = 256;
		let lastTickTimeout = 1;
		let inputTiming = 0;
		
		this.setFrameTimes()
		
		while (this.shutdownCounter >= 0) {
			if (this.shutdownCounter > 0) {
				this.shutdownCounter--;
				
				if (this.shutdownCounter === 0) {
					this.clearResources();
					return;
				}
			}
			
			let inputTimeslice = 300;
			let tickTimeout = 1;
			
			let time = Date.now();
			
			if (this.clockTimings[clockTick] === 0) {
				inputTimeslice = Math.max(25, lastInputTimeslice);
				tickTimeout = lastTickTimeout;
			} else if (time > this.clockTimings[clockTick]) {
				inputTimeslice = Math.max(25, (2560 * this.targetFps) / (time - this.clockTimings[clockTick]) | 0);
			}
			
			if (inputTimeslice > 256) {
				inputTimeslice = 256;
				tickTimeout = Math.max(1, this.targetFps - (time - this.clockTimings[clockTick]) / 10 | 0);
			}
			lastInputTimeslice = inputTimeslice;
			
			await zzz(tickTimeout);
			
			this.clockTimings[clockTick] = time;
			clockTick = (clockTick + 1) % 10;
			
			if (tickTimeout > 1) {
				for (let tick = 0; tick < 10; tick++)
					if (this.clockTimings[tick] !== 0)
						this.clockTimings[tick] += tickTimeout;
			}
			lastTickTimeout = tickTimeout;

			let inputCounter = 0;
			while (inputTiming < 256) {
				await this.handleInputs();
				inputTiming += inputTimeslice;
				
				// if our input processing is using up too much of the engine cycle, possibly render every other line
				// as compensation.  Less time during the render phase may make up for the loss during input
				if (++inputCounter > this.inputClockRate) {
					inputTiming = 0;
					this.powerThrottle += 6;
					
					if (this.powerThrottle > 25) {
						this.powerThrottle = 0;
						this.interlace = true;
					}
					break;
				}
			}
			
			lastInputTimeslice = inputTimeslice;
			this.powerThrottle--;
			
			// faster than equivalent: i1 = Math.min(255, i1);
			inputTiming &= 0xFF;
			
			this.draw();
			
			this.mouseScrollDelta = 0;
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
		
		this.drawString(this.graphics, statusText, Font.TIMES_ROMAN.withConfig(FontStyle.BOLD, 15), j + 138, k + 12);
	}
	
	drawString(g, s, font, i, j) {
		g.setFont(font);
		const { width, height } = g.ctx.measureText(s);
		g.drawString(s, i - ((width / 2) | 0), j + ((height / 4) | 0));
	}
	
	createImage(buff) {
		let tgaImage = new TGA(buff.buffer);;
		
		const canvas = tgaImage.getCanvas();
		const ctx = canvas.getContext('2d');
		const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
		
		return imageData;
	}
	
	async readDataFile(file, description, percent) {
		file = './data204/' + file;
		
		
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

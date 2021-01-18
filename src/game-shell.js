import BZLib from './bzlib';
import Graphics from './lib/graphics/graphics';
import Color from './lib/graphics/color';
import Font from './lib/graphics/font';
import Socket from './lib/net/socket';
import Surface from './surface';
import { EngineStates, WelcomeStates, GameStates, GamePanels } from './utility';
import VERSION from './version';
import { TGA } from './lib/tga';
import download from './lib/net/file-download-stream';
import sleepMillis from './lib/sleep';
import JagArchive from './lib/jag';
import Inputs from './lib/input';

const SLEEP_MIN = 1;

const state = {
	lastInputSlice: 256,
	inputSlice: 256,
	inputTimer: 0,
	lastSleepMillis: 1,
	sleepMillis: 1,
	curTime: Date.now(),
	frameClock: new Array(10),
	get frameTimeout() {
		return Math.max(SLEEP_MIN, this.sleepMillis);
	},
	get frame() {
		return (this._frame || 0) % 10;
	},
	set frame(f) {
		this._frame = f % 10;
	},
	startClock() {
		for (let i in this.frameClock) {
			this.frameClock[i] = Date.now();
		}
	},
	async clockedSleep() {
		await sleepMillis(this.frameTimeout);
		
		this.frameClock[this.frame++] = this.curTime;

		if (this.frameTimeout > SLEEP_MIN) {
			for (let i in this.frameClock) {
				if (this.frameClock[i]) {
					this.frameClock[i] += this.frameTimeout;
				}
			}
		}
	},
	stopClock() {
		for (let i in this.frameClock) {
			this.frameClock[i] = 0;
		}
	},
};

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
		this.middleButtonDown = false;
		this.mouseScrollDelta = 0;
		this.panelLogin = {};
		this.panelGame = {};
		this.controlTextListAll = 0;
		this.mouseX = 0;
		this.mouseY = 0;
		this.mouseButtonDown = 0;
		this._shutdownCounter = 0;
		this.lastMouseButtonDown = 0;
		this.timings = [];
		this.loadingProgressPercent = 0;
		this.imageLogo = void 0;
		this.targetFrameTime = 20;
		this.hasRefererLogoNotUsed = false;
		this.loadingProgessText = 'Loading';
		this.showFps = false;
		this.debug = false;
		this.maxTickTimeout = 1;
		this.interlace = false;
		this.inputBuffer = '';
		this.submittedInput = '';
		this.inputPmCurrent = '';
		this.inputPmFinal = '';
		this.chatHistory = [];
		this.chatHistoryIndex = 0;
		this.threadSleep = 1;
	}
	
	async startApplication(width, height) {
		this._canvas.width = width;
		this._canvas.height = height;

		this.engineState = EngineStates.IDLE;
        this._canvas.addEventListener('mousemove', Inputs.Mouse.moved.bind(this));
        this._canvas.addEventListener('mousedown', Inputs.Mouse.pressed.bind(this));
        this._canvas.addEventListener('mouseup', Inputs.Mouse.released.bind(this));
		this._canvas.addEventListener('mousewheel', Inputs.Mouse.wheeled.bind(this));
		this._canvas.addEventListener('wheel', Inputs.Mouse.wheeled.bind(this));
        this._canvas.addEventListener('mouseout', Inputs.Mouse.unfocused.bind(this));
        this._canvas.addEventListener('contextmenu', Inputs.Ignore.bind(this));
		window.addEventListener('keydown', Inputs.Keyboard.keyPressed.bind(this));
		window.addEventListener('keyup', Inputs.Keyboard.keyReleased.bind(this));

        console.log('Starting engine...');

		this.graphics = this.getGraphics();
		this.engineState = EngineStates.INITIALIZE_DATA;
		this.drawLoadingScreen(0, 'Loading...');
		this.imageLogo = await this.loadLogo();
		await this.loadFonts();

		await this.run();
	}

	setFrameRate(fps) {
		this.targetFrameTime = 1000 / fps;
	}

	resetClockHistory() {
		state.stopClock();
	}
		
	handleMouseDown(button, x, y) {  }

	start() {
		this.shutdownCounter = 0;
	}

	get shutdownCounter() {
		return !this._shutdownCounter ? 0 : this._shutdownCounter;
	}

	get dead() {
		return this.shutdownCounter < 0;
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

	async handleInputs() {
		// Method stub for input handler routines
		// must be implemented in either a super-class, or right here
		// currently implemented by mudclient I believe
	}

	async draw() {
		// Method stub for frame rendering routines
		// must be implemented in either a super-class, or right here
		// currently implemented by mudclient I believe
	}

	async run() {
		await this.startGame();
		this.engineState = EngineStates.RUNNING;

		let i = 0;
		let j = 256;
		let sleep = 1;
		let i1 = 0;

		state.startClock();

		while (this._shutdownCounter >= 0) {
			if (this._shutdownCounter > 0) {
				if (--this._shutdownCounter <= 0) {
					this.clearResources();
					return;
				}
			}

			let k1 = j;
			let lastSleep = sleep;

			j = 300;
			sleep = 1;

			state.lastInputSlice = state.inputSlice,
			state.inputSlice = 300,
			state.lastSleepMillis = state.sleepMillis,
			state.sleepMillis = 1;

			let time = state.curTime = Date.now();
			let frameTime = state.frameClock[state.frame];
			let frameDelta = time - frameTime;

			if (!frameTime) {
				state.inputSlice = state.lastInputSlice;
				state.sleepMillis = state.lastSleepMillis;
			} else if (time > state.frameClock[state.frame]) {
				// this is for when the target frame is in the past
				// targetFrameTime is 1000/FPS, value of 20 at default 50FPS
				// makes this equation equivalent to: 51200 / deltaFrameMillis
				// under this algorithm, an ideal delta would seem to be 200ms
				// each frame is allocated 20ms slices of time, we keep a history
				// that is 10 frames long...right?
				state.inputSlice = Math.floor(256 * 10 * this.targetFrameTime / frameDelta);
			}

			// this is approx 10x slower than anticipated, so like <= 5FPS
			if (state.inputSlice < 25)
				state.inputSlice = 25;

			// We're doing better than 50FPS!  Sleep off the excess allotted time
			if (state.inputSlice > 256) {
				state.inputSlice = 256;
				state.sleepMillis = this.targetFrameTime - Math.floor(frameDelta / 10);
			}

			await state.clockedSleep();

			for (; state.inputTimer < 256; state.inputTimer += state.inputSlice)
				await this.handleInputs();
			state.inputTimer &= 0xFF;
			if (this.showFps && this.targetFrameTime > 0)
				this.fps = Math.floor(1000*state.inputSlice / (this.targetFrameTime << 8));
			this.draw();

			this.mouseScrollDelta = 0;
		}
	}

	update(g) {
		this.paint(g);
	}
	
	paint(g) {
		if (this.engineState.number < EngineStates.RUNNING.number)
			this.updateLoadingStatus(this.loadingProgressPercent, this.loadingProgessText);
	}
	
	async loadLogo() {
		this.updateLoadingStatus(0, `Loading assets...`);
		let archive = new JagArchive(await download(`./static/cache/jagex.jag`), 'jagex.jag');
		if (!archive)
			throw Error("Could not read data file:'jagex.jag'");
			
		return this.createImage(archive.get('logo.tga').data);
	}
	
	async loadFonts() {
		// this.updateLoadingStatus(percent, 'Loading ' + description + ' - ' + (5 + ((fileData.length - 6) * 95) / fileData.readUIntBE(3, 3) | 0) + '%');
		this.updateLoadingStatus(5, `Loading bitmap fonts...`);
		let archive = new JagArchive(await download(`./static/cache/fonts${VERSION.FONTS}.jag`), 'fonts.jag');
		if (!archive)
			return;

		let font = 0;
		Surface.createFont(archive.get('h11p.jf').data, font++);
		Surface.createFont(archive.get('h12b.jf').data, font++);
		Surface.createFont(archive.get('h12p.jf').data, font++);
		Surface.createFont(archive.get('h13b.jf').data, font++);
		Surface.createFont(archive.get('h14b.jf').data, font++);
		Surface.createFont(archive.get('h16b.jf').data, font++);
		Surface.createFont(archive.get('h20b.jf').data, font++);
		Surface.createFont(archive.get('h24b.jf').data, font++);
	}
	
	drawLoadingScreen(percent = this.loadingProgressPercent, text = this.loadingProgessText) {
		this.loadingProgessText = text;
		this.loadingProgressPercent = percent;
		if(!this.graphics)
			return;
		// clear screen
		this.graphics.setColor(Color.BLACK);
		this.graphics.fillRect(0, 0, this._canvas.width, this._canvas.height);

		// half of: client width minus status bar width (+ border)
		let midX = (this._canvas.width - 281) / 2;
		// half of: client height minus (10 + status bar height)
		let midY = (this._canvas.height - 148) / 2;
		if (this.imageLogo)
			this.graphics.drawImage(this.imageLogo, midX, midY);
		midX += 2;
		midY += 90;
		this.graphics.setColor(Color.SHADOW_GRAY);
		// draw border probably, a 280x23 empty centered box
		// leaves a pixel of whitespace around the status box
		// to make the status box touch the border when filling, remove these ` - 2`s below 
		this.graphics.drawRect(midX - 2, midY - 2, 280, 23);
		// fill in some of status bar to match our completion percentage
		this.graphics.fillRect(midX, midY, Math.floor((277 * percent) / 100), 20);
		
		this.graphics.setColor(Color.SILVER);
		// Draw the current status text, usually a loading stage or action...
		this.drawString(this.graphics, text, Font.HELVETICA.withSize(12), midX + 138, midY + 12);

		// Draw the copyright footer directly below the status bar
		// TODO: Do I want to make this pop out more?
		this.graphics.setColor(Color.WHITE);
		this.drawString(this.graphics, 'Powered by RSCGo, a free and open source software project', Font.HELVETICA.bold(13), midX + 138, midY + 35);
		this.drawString(this.graphics, '\xA9 2019-2020 Zach Knight, and the 2003scape team', Font.HELVETICA.bold(13), midX + 138, midY + 49);
		// not sure where this would have been used. maybe to indicate a special client?
		// if (this.logoHeaderText !== null) {
		//     this.graphics.setColor(Color.WHITE);
		//     this.drawString(this.graphics, this.logoHeaderText, this.fontHelvetica13b, midX + 138, midY - 120);
		// }
	}
	
	updateLoadingStatus(curPercent, statusText) {
		if (!this.graphics)
			return;
		this.loadingProgressPercent = curPercent;
		this.loadingProgessText = statusText;
		let j = (this._canvas.width - 281) / 2;
		let k = (this._canvas.height - 148) / 2;
		j += 2;
		k += 90;
	
		let l = ((277 * curPercent) / 100) | 0;
		// Empty portion of status bar
		this.graphics.setColor(Color.BLACK);
		this.graphics.fillRect(j + l, k, 277 - l, 20);
		// Filled portion of status bar
		this.graphics.setColor(Color.SHADOW_GRAY);
		this.graphics.fillRect(j, k, l, 20);
		// Status text
		this.graphics.setColor(Color.SILVER);
		this.drawString(this.graphics, statusText, Font.HELVETICA.bold(15), j + 138, k + 12);
	}
	
	drawString(g, s, font, i, j) {
		g.setFont(font);
		const { width, height } = g.ctx.measureText(s);
		g.drawString(s, i - Math.floor(width / 2), j + Math.floor(height / 2));
	}
	
	createImage(buff) {
		let tga = new TGA(buff.buffer);
		if (!tga)
			throw Error('Could not create TGA image from provided buffer!');
		let canvas = tga.getCanvas();
		return canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height);
	}

	getGraphics() {
		return this._graphics;
	}

	moveChatBuffer(up = true) {
		if (up) {
			if (++this.chatHistoryIndex >= this.chatHistory.length) {
				this.showMessage("Reached the top of chat history", 3);
				this.chatHistoryIndex = this.chatHistory.length-1;
				return;
			}
			this.panelGame[GamePanels.CHAT].setTextHandle(this.controlTextListAll, this.chatHistory[this.chatHistory.length - 1 - this.chatHistoryIndex]);
		} else {
			if (--this.chatHistoryIndex < 0) {
				this.showMessage("Reached the bottom of chat history", 3);
				this.panelGame[GamePanels.CHAT].setTextHandle(this.controlTextListAll, '');
				this.chatHistoryIndex = -1;
				return;
			}
			this.panelGame[GamePanels.CHAT].setTextHandle(this.controlTextListAll, this.chatHistory[this.chatHistory.length - 1 - this.chatHistoryIndex]);
		}
	}
	
	async createSocket(host, port) {
		let socket = new Socket(host, port);
		await socket.connect();
		return socket;
	}

	get keyLeft() {
		return Inputs.Keyboard.pressed('ArrowLeft');
	}

	get keyRight() {
		return Inputs.Keyboard.pressed('ArrowRight');
	}

	get keyUp() {
		return Inputs.Keyboard.pressed('ArrowUp');
	}

	get keyDown() {
		return Inputs.Keyboard.pressed('ArrowDown');
	}

	get keyPgUp() {
		return Inputs.Keyboard.pressed('PageUp');
	}

	get keyPgDown() {
		return Inputs.Keyboard.pressed('PageDown');
	}

	get keyHome() {
		return Inputs.Keyboard.pressed('Home');
	}

	get keySpace() {
		return Inputs.Keyboard.pressed(' ');
	}
}

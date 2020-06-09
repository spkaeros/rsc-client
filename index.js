const mudclient = require('./src/mudclient');

if (typeof window === 'undefined') {
	const mcCanvas = createCanvas(512, 346);
	const mc = new mudclient(mcCanvas);
	mc.options.middleClickCamera = true;
	mc.options.mouseWheel = true;
	mc.options.resetCompass = true;
	mc.options.zoomCamera = true;
	mc.members = false;
}

(async () => {
	const mcCanvas = window.document.getElementById('gameCanvas') || createCanvas(512, 346);
	const mc = new mudclient(mcCanvas);
	mc.options.middleClickCamera = true;
	mc.options.mouseWheel = true;
	mc.options.resetCompass = true;
	mc.options.zoomCamera = true;
	// const args = window.location.hash.slice(1).split(',');
	// mc.members = args[0] === 'members';
	mc.members = true;
	window.mcOptions = mc.options;
	mc.port = 43594;

	// Sleep limit for game loop
	mc.threadSleep = 1000/50 | 0;
	await mc.startApplication(512, 346, 'RSCTurmoil - Powered by RSCGo', false);
})();

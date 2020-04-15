const mudclient = require('./src/mudclient');

if (typeof window === 'undefined') {
	const {createCanvas} = require('canvas');
	const mcCanvas = createCanvas(512,346);
	const mc = new mudclient(mcCanvas);
	mc.options.middleClickCamera = true;
	mc.options.mouseWheel = true;
	mc.options.resetCompass = true;
	mc.options.zoomCamera = true;
	mc.members = false;
}

(async () => {
	const mcCanvas = document.getElementById('gameCanvas');
	const args = window.location.hash.slice(1).split(',');
	const mc = new mudclient(mcCanvas);
	mc.options.middleClickCamera = true;
	mc.options.mouseWheel = true;
	mc.options.resetCompass = true;
	mc.options.zoomCamera = true;
	mc.members = args[0] === 'members';
	window.mcOptions = mc.options;
	// To connect to a remote server on another machine, change the below to match your server processes IP and port.
//	mc.server = 'rscturmoil.com';
	mc.server = '127.0.0.1';
	mc.port = 43595;
	// to enable SSL set mc.transportLayerSecurity var to true (please note that RSCGo must have been provided SSL certs to use this feature)
	// Thw websocket library takes care of the heavy lifting for us, and we reap the benefit of full stream encryption at the cost of changing one var
	mc.transportLayerSecurity = true;

	// Maximum time engine allowed to sleep between frames
	mc.threadSleep = 1;
	await mc.startApplication(512, 346, 'RSCTurmoil - RSCGo by ZlackCode LLC', false);
})();

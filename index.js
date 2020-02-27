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
    mc.server = 'rscturmoil.com';
    mc.port = 43595;

    // Maximum time engine allowed to sleep between frames
    mc.threadSleep = 10;
    await mc.startApplication(512, 346, 'RSCTurmoil - RSCGo by ZlackCode LLC', false);
})();

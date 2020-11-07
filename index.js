import {Utility} from './src/utility';
import mudclient from './src/mudclient';

if (!Utility.wasmMod) {
	// initialize wasm environment for the client to use, with the Utility helper class acting as a bridge
	(async () => {
		Utility.wasmMod = await import('./dist/librsc.js');
	})()
}

if (typeof window === 'undefined') {
	console.error("Window doesn't exist!  Currently running this client outside a web-browser is not possible.  Eventually it may be, but for now the alternative is the client that is written in Java.")
	//return;
} else {
	(async () => {
		const mc = new mudclient(window.document.getElementById('gameCanvas') || createCanvas(512,346));
		mc.options.middleClickCamera = true;
		mc.options.mouseWheel = true;
		mc.options.resetCompass = true;
		mc.options.zoomCamera = true;
		const args = window.location.hash.slice(1).split(',');
		if (args.length > 0)
			mc.members = args[0] === 'members';
		mc.port = 43594;

		await mc.startApplication(512, 346, 'RSCTurmoil - Powered by RSCGo', false);
	})();
}

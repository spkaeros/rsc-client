import mudclient from './src/mudclient';

(async () => {
	// initialize wasm module, stash into global scope for easy access
	global.wasmMod = await import('./dist/librsc.js');
	if (typeof window !== 'object') {
		console.error("Window doesn't exist!  Currently running this client outside a web-browser is not possible.  Eventually it may be, but for now the alternative is the client that is written in Java.");
		throw Error("No window available for blitting to in current environment.");
	}
	const mc = global.ctx = new mudclient(window.document.getElementById('gameCanvas') || createCanvas(512,346));
	mc.options.middleClickCamera = true;
	mc.options.mouseWheel = true;
	mc.options.resetCompass = true;
	mc.options.zoomCamera = true;
	const args = window.location.hash.slice(1).split(',');
	if (args.length)
		mc.members = (args[0].toLowerCase() === 'members');
	mc.port = 43594;
	await mc.startApplication(512, 346);
})();

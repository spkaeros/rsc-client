
function mouseMoved(e) {
	e.preventDefault();
	this.mouseX = e.offsetX;
	this.mouseY = e.offsetY;
}

function mouseReleased(e) {
	e.preventDefault();
	this.mouseX = e.offsetX;
	this.mouseY = e.offsetY;
	
	if (e.button === 1)
		this.middleButtonDown = false;
	this.mouseButtonDown = 0;
}
function mouseOut(e) {
	e.preventDefault();
	this.mouseX = e.offsetX;
	this.mouseY = e.offsetY;
	// this.mouseButtonDown = 0;
	// this.middleButtonDown = false;
}

function mousePressed(e) {
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
}

function mouseWheel(e) {
	if (!this.options.mouseWheel)
		return;
	
	if (!e.deltaMode) {
		// a falsey deltaMode implies the deltas are measured as pixel-sized units (ala chromium)
		this.mouseScrollDelta = Math.floor(e.deltaY / 14);
	} else {
		// a truthy deltaMode implies the deltas are measured as text-line sized units (ala Firefox)
		this.mouseScrollDelta = Math.floor(e.deltaY);
	}
}

module.exports = {
	moved: mouseMoved,
	pressed: mousePressed,
	released: mouseReleased,
	wheeled: mouseWheel,
	unfocused: mouseOut,
}

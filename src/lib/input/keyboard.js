let Utility = require('../../utility');

const MetaKeyNames = /^(Control|Shift|Alt|Delete|Insert|CapsLock|OS|Unidentified|ContextMenu)$/;
const MediaKeyNames = /^(AudioVolumeMute|AudioVolumeUp|AudioVolumeDown|MediaTrackPrevious|MediaPlay|MediaTrackNext|BrowserSearch)$/;
const FunctionKeyNames = /^F([1-9]|1[0-2])$/;
// here I am listing any quotation marks 2 times to prevent my text editors parser from bugging out
// this breaks nothing within the confines of the [brackets]
const InputKeyNames = /^(["'``'"\ A-Za-z0-9\|\~\.\/\,\\\!\@\#\$\%\^\&\(\)\*\+\;\_\[\]\}\{\=\-\<\>\?\:\£]|Enter|Tab|Backspace)$/;

// Special, or non-input characters
const SpecialKeys = [MetaKeyNames, MediaKeyNames, FunctionKeyNames];

// Acts as a set of all the keys currently actively pressed
const PressedKeys = { };

// Returns true if this key isn't supposed to produce textual output, e.g control, shift, so on..
const ControlKey = key => {
	for (let p of SpecialKeys)
		if (p.test(key))
			return true;
	
	return false;
};

// Returns true if the provided key is being held down, otherwise returns false
const pressed = key => PressedKeys[key] || false;

// Returns true if the provided key is valid input for chats
const chatAllows = e => InputKeyNames.test(e.key);

// A function designed to handle keydown events.
function keyPressed(e) {
	PressedKeys[e.key] = true;
	switch (e.key) {
	case 'Escape':
		this.welcomeBoxVisible = false;
		this.bankVisible = false;
		this.shopVisible = false;
		this.tradeConfigVisible = false;
		this.duelConfigVisible = false;
		this.dialogItemInput = 0;
		this.abuseReportWindow = 0;
		this.contactsInputFormIndex = 0;
		e.preventDefault();
		return;
	case 'F1':
		this.interlace = !this.interlace;
		e.preventDefault();
		return;
	case 'F3':
		this.debug = !this.debug;
		this.showFps = !this.showFps;
		e.preventDefault();
		return;
	case 'F4':
		this.options.showRoofs = !this.options.showRoofs;
		e.preventDefault();
		return;
	case 'F6':
		this.showFps = !this.showFps;
		e.preventDefault();
		return;
	case 'Home':
		e.preventDefault();
		return;
	}
	if (/^Arrow/.test(e.key)) {
		if (/(Up|Down)$/.test(e.key))
			this.moveChatBuffer(/Up$/.test(e.key))
		e.preventDefault();
		return;
	}
	if (ControlKey(e.key))
		return;

	// only chat-relevant keys should make it here...
	if (this.gameState === Utility.GameStates.LOGIN && this.panelLogin && this.panelLogin[this.welcomeState]) {
		if (chatAllows(e)) {
			this.panelLogin[this.welcomeState].keyPress(e.which, e.key);
			e.preventDefault();
		}
		return;
	}
	if (this.gameState === Utility.GameStates.WORLD) {
		if (this.dialogItemInput || this.contactsInputCtx || this.reportAbuseState || this.isSleeping) {
			if (chatAllows(e)) {
				if (e.key === 'Enter') {
					if (this.inputBuffer.length)
						this.submittedInput = this.inputBuffer;
					if (this.inputPmCurrent.length)
						this.inputPmFinal = this.inputPmCurrent;
					e.preventDefault();
					return;
				} else if (e.key === 'Backspace') {
					if (this.inputBuffer.length)
						this.inputBuffer = this.inputBuffer.slice(0, -1);
					if (this.inputPmCurrent.length)
						this.inputPmCurrent = this.inputPmCurrent.slice(0, -1);
					e.preventDefault();
					return;
				} else if (e.key === 'Tab') {
					e.preventDefault();
					return;
				}
				if (this.inputBuffer.length < 20)
					this.inputBuffer += e.key;
				if (this.inputPmCurrent.length < 80)
					this.inputPmCurrent += e.key;
				e.preventDefault();
			}
			return;
		}
		if (this.showAppearanceChange) {
			if (chatAllows(e)) {
				if (this.panelGame[Utility.GamePanels.APPEARANCE])
					this.panelGame[Utility.GamePanels.APPEARANCE].keyPress(e.which, e.key);
				e.preventDefault();
			}
			return;
		}
				
		if (chatAllows(e)) {
			if (this.panelGame[Utility.GamePanels.CHAT])
				this.panelGame[Utility.GamePanels.CHAT].keyPress(e.which, e.key);
			e.preventDefault();
			return;
		}
		return;
	}
}

function keyReleased(e) {
	delete(PressedKeys[e.key]);
	e.preventDefault();
}

module.exports = {
	PressedKeys,
	MetaKeyNames,
	MediaKeyNames,
	FunctionKeyNames,
	InputKeyNames,
	ControlKey,
	SpecialKeys,
	keyPressed,
	keyReleased,
	pressed,
};

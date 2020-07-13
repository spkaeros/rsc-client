import Timer from './timer';
import {Utility} from './utility';

const STEP_SIZE = 4;
const TILE_SIZE = 128;
const TELEPORT_THRESHOLD = TILE_SIZE*3;

const NORTH = 0;
const NORTHWEST = 1;
const WEST = 2;
const SOUTHWEST = 3;
const SOUTH = 4;
const SOUTHEAST = 5;
const EAST = 6;
const NORTHEAST = 7;
const FIGHTING_RIGHT = 8;
const FIGHTING_LEFT = 9;

class GameCharacter {
    constructor() {
        this.serverIndex = 0;
        this.appearanceTicket = 0;
        this.waypointsX = new Uint32Array(10);
        this.waypointsY = new Uint32Array(10);
        this.equippedItem = new Uint32Array(12);
        this.currentX = 0;
        this.currentY = 0;
        this.level = -1;
        this.typeID = 0;
        this.stepCount = 0;
        this.animationCurrent = 0;
        this.animationNext = 0;
        this.waypointCurrent = 0;
        this.targetWaypoint = 0;
        this.message = void 0;
        this.bubble = void 0;
        this.messageTimeout = 0;
        this.damageTaken = 0;
        this.healthCurrent = 0;
        this.healthMax = 0;
        this.healthTimer = new Timer(-1);
        this.level = 0;
        this.colourHair = 0;
        this.colourTop = 0;
        this.colourBottom = 0;
        this.colourSkin = 0;
        this.incomingProjectileSprite = 0;
        this.attackingPlayerServerIndex = 0;
        this.attackingNpcServerIndex = 0;
        this.projectileRange = 0;
        this.skullVisible = 0;
    }
    
    isFighting() {
        return this.animationCurrent === FIGHTING_LEFT || this.animationCurrent === FIGHTING_RIGHT;
    }

    isRecentlyHurt() {
    	return this.healthTimer.tickThreshold > 0;
    }

    waypoint(idx) {
    	return [ this.waypointsX[idx], this.waypointsY[idx] ];
    }

    longestDelta(x, y) {
    	return Math.max(Math.abs(this.currentX - x), Math.abs(this.currentY - y));
    }

    at(location) {
    	return this.currentX === location[0] && this.currentY === location[1];
    }

	traversePath() {
		let curStep = (this.waypointCurrent+1)%10;
		let nextStep = this.targetWaypoint;
		if (nextStep === curStep) {
			// No path to traverse, just update sprite in case of a new fight or something and return
			this.animationCurrent = this.animationNext;
			return;
		}
		
		let stepDelta = curStep - nextStep;
		if (stepDelta < 1)
			stepDelta += 10;
		let stepSize =  Math.max(1, stepDelta-1) * STEP_SIZE;
		let deltaX = this.currentX - this.waypointsX[nextStep];
		let deltaY = this.currentY - this.waypointsY[nextStep];

		if (Math.abs(deltaX) > TELEPORT_THRESHOLD * 3 || Math.abs(deltaY) > TELEPORT_THRESHOLD * 3 || stepDelta > 8) {
			// server suddenly jumped them far away (over 8 steps away, or over 3*4 tile units away)
			// to avoid looking like flash gordon we just set coords to target instead of stepping all the way
			this.currentX = this.waypointsX[nextStep];
			this.currentY = this.waypointsY[nextStep];
			this.targetWaypoint = (nextStep+1)%10;
			return;
		}
		let nextSprite = -1;
		if (deltaX !== 0) {
			this.stepCount++;
			if (deltaX > 0) {
				this.currentX -= stepSize;
				nextSprite = EAST; // east
			} else if (deltaX < 0) {
				this.currentX += stepSize;
				nextSprite = WEST; // west
			}
			// when near target tile, we can safely set respective coordinate to target
			if (Math.abs(this.currentX - this.waypointsX[nextStep]) < stepSize)
				this.currentX = this.waypointsX[nextStep];
		}

		if (deltaY !== 0) {
			this.stepCount++;
			if (deltaY > 0) {
				this.currentY -= stepSize;
				if (deltaX > 0)
					nextSprite = NORTHEAST;
				else if (deltaX < 0)
					nextSprite = NORTHWEST;
				else
					nextSprite = NORTH;
			} else if (deltaY < 0) {
				this.currentY += stepSize;
				if (deltaX > 0)
					nextSprite = SOUTHEAST;
				else if (deltaX < 0)
					nextSprite = SOUTHWEST;
				else
					nextSprite = SOUTH;
			}
			if (Math.abs(this.currentY - this.waypointsY[nextStep]) < stepSize)
				this.currentY = this.waypointsY[nextStep];
		}

		// We have moved
		if (nextSprite !== -1)
			this.animationCurrent = nextSprite;
		// This checks that we have finished moving this character to the next waypoint in its path, and
		// updates this characters state to begin movement to the next waypoint on the next tick
		if (this.currentX === this.waypointsX[nextStep] && this.currentY === this.waypointsY[nextStep])
			this.targetWaypoint = (nextStep+1) % 10;
	}

	get name() {
		if (!this._name) {
			if (this.hash > 0)
				return Utility.hashToUsername(this._hash);
			return 'null';
		}
		return this._name;
	}

	set name(name) {
		if (!name) {
			this._name = void 0;
			return;
		}
		if (name.length > 12) {
			this._name = name.slice(0,12);
			return;
		}
		this._name = name;
	}

	get hash() {
		if (!this._hash)
			if (this._name)
				return Utility.usernameToHash(this._name);
			return 0n;
		return this._hash;
	}

	set hash(hash) {
		this._hash = hash;
		this._name = Utility.hashToUsername(hash);
	}
}

export { GameCharacter as default };

const Long = require('long');

const STEP_SIZE = 4;
const TILE_SIZE = 128;
const WALK_DELTA_THRESHOLD = TILE_SIZE*3;

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
        this.hash = new Long(0);
        this.name = null;
        this.serverIndex = 0;
        this.serverId = 0;
        this.currentX = 0;
        this.currentY = 0;
        this.npcId = 0;
        this.stepCount = 0;
        this.animationCurrent = 0;
        this.animationNext = 0;
        this.movingStep = 0;
        this.waypointCurrent = 0;
        this.message = null;
        this.messageTimeout = 0;
        this.bubbleItem = 0;
        this.bubbleTimeout = 0;
        this.damageTaken = 0;
        this.healthCurrent = 0;
        this.healthMax = 0;
        this.combatTimer = 0;
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
        this.waypointsX = new Int32Array(10);
        this.waypointsY = new Int32Array(10);
        this.equippedItem = new Int32Array(12);
        this.level = -1;
    }
    
    isFighting() {
        return this.animationCurrent === FIGHTING_LEFT || this.animationCurrent === FIGHTING_RIGHT;
    }

    waypointX(idx) {
    	return this.waypointsX[idx];
    }

    waypointY(idx) {
    	return this.waypointsY[idx];
    }

    waypoint(idx) {
    	return [this.waypointsX[idx], this.waypointsY[idx]];
    }

    absMeshDeltas(x, y) {
    	return [Math.abs(this.currentX-x), Math.abs(this.currentY-y)];
    }

    meshDeltaX(target) {
    	return this.currentX-target[0];
    }

    meshDeltaY(target) {
    	return this.currentY-target[1];
    }

    nextWaypoint() {
    	return (this.waypointCurrent+1)%10;
    }

    at(location) {
    	return this.currentX === location[0] && this.currentY === location[1];
    }

	traversePath() {
		let curStep = this.nextWaypoint();
		let nextStep = this.movingStep;
		if (nextStep === curStep) {
			// No path to traverse, just update sprite in case of a new fight or something and return
			this.animationCurrent = this.animationNext;
			return;
		}
		
		let stepDelta = curStep - nextStep;
		if (stepDelta < 1)
			stepDelta += 10;
		let stepSize =  Math.max(1, stepDelta-1) * STEP_SIZE;
		let stepLocation = this.waypoint(nextStep);
		let deltaX = this.currentX - this.waypointsX[nextStep];
		let deltaY = this.currentY - this.waypointsY[nextStep];
		
		if (stepDelta > 8 || Math.abs(deltaX) > TILE_SIZE * 3 || Math.abs(deltaY) > TILE_SIZE * 3) {
			// server suddenly jumped them far away
			// to avoid looking like flash gordon we just set coords instead of stepping all the way
			this.currentX = this.waypointsX[nextStep];
			this.currentY = this.waypointsY[nextStep];
			this.movingStep = (nextStep + 1) % 10;
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
			if (Math.abs(this.meshDeltaX(stepLocation)) < stepSize)
				this.currentX = this.waypointsX[nextStep];
		}

		if (deltaY !== 0) {
			this.stepCount++;
			if (deltaY > 0) {
				this.currentY -= stepSize;
				nextSprite = (nextSprite === -1) ? NORTH : (nextSprite === WEST) ? NORTHWEST : NORTHEAST;
			} else if (deltaY < 0) {
				this.currentY += stepSize;
				nextSprite = (nextSprite === -1) ? SOUTH : (nextSprite === WEST) ? SOUTHWEST : SOUTHEAST;
			}
			if (Math.abs(this.meshDeltaY(stepLocation)) < stepSize)
				this.currentY = this.waypointsY[nextStep];
		}

		// We have moved
		if (nextSprite !== -1)
			this.animationCurrent = nextSprite;
		// This checks that we have finished moving this character to the next waypoint in its path, and
		// updates this characters state to begin movement to the next waypoint on the next tick
		if (this.at(this.waypoint(nextStep)))
			this.movingStep = (nextStep + 1) % 10;
	}
}

module.exports = GameCharacter;

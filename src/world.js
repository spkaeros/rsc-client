import GameData from './game-data';
import Scene from './scene';
import GameModel from './game-model';
import ndarray from 'ndarray';

const OBJECT_MAPS_START = 48000;

class World {
	constructor(scene, surface) {
		this.regionWidth = 96;
		this.regionHeight = 96;
		this.tileSize = 128;
		this.parentModel = null;

		// Int8Arrays 
		this.landscapePack = null; 
		this.mapPack = null; 
		this.memberLandscapePack = null;
		this.memberMapPack = null;

		this.worldInitialised = true;
		this.objectAdjacency = ndarray(new Int32Array(this.regionWidth * this.regionHeight), [this.regionWidth, this.regionHeight]);
		this.tileDirection = ndarray(new Int8Array(4 * 2304), [4, 2304]);

		this.wallModels = [];
		this.roofModels = [];

		for (let i = 0; i < 4; i += 1) {
			this.wallModels.push([]);
			this.roofModels.push([]);

			for (let j = 0; j < 64; j += 1) {
				this.wallModels[i].push(null);
				this.roofModels[i].push(null);
			}
		}

		this.terrainColours = new Int32Array(256);
		this.wallsNorthSouth = ndarray(new Int8Array(4 * 2304), [4, 2304]);
		this.wallsRoof = ndarray(new Int8Array(4 * 2304), [4, 2304]);
		this.terrainHeight = ndarray(new Int8Array(4 * 2304), [4, 2304]);
		this.terrainColour = ndarray(new Int8Array(4 * 2304), [4, 2304]);
		this.localY = new Int32Array(18432);
		this.tileDecoration = ndarray(new Int8Array(4 * 2304), [4, 2304]);
		this.routeVia = ndarray(new Int32Array(this.regionWidth * this.regionHeight), [this.regionWidth, this.regionHeight]);
		this.wallsDiagonal = ndarray(new Int32Array(4 * 2304), [4, 2304]);
		this.wallsEastWest = ndarray(new Int8Array(4 * 2304), [4, 2304]);
		this.aBoolean592 = false;
		this.playerAlive = false;
		this.terrainHeightLocal = ndarray(new Int32Array(this.regionWidth * this.regionHeight), [this.regionWidth, this.regionHeight]);

		this.terrainModels = [];
		this.terrainModels.length = 64;
		this.terrainModels.fill(null);

		this.localX = new Int32Array(18432);
		this.baseMediaSprite = 750;

		this.scene = scene;
		this.surface = surface;

		for (let i = 0; i < 64; i++) {
			this.terrainColours[i] = Scene.rgb(255 - i * 4, 255 - ((i * 1.75) | 0), 255 - i * 4);
		}

		for (let j = 0; j < 64; j++) {
			this.terrainColours[j + 64] = Scene.rgb(j * 3, 144, 0);
		}

		for (let k = 0; k < 64; k++) {
			this.terrainColours[k + 128] = Scene.rgb(192 - ((k * 1.5) | 0), 144 - ((k * 1.5) | 0), 0);
		}

		for (let l = 0; l < 64; l++) {
			this.terrainColours[l + 192] = Scene.rgb(96 - ((l * 1.5) | 0), 48 + ((l * 1.5) | 0), 0);
		}
	}

	getWallEastWest(x, y) {
		if (x < 0 || x >= this.regionWidth || y < 0 || y >= this.regionHeight) {
			return 0;
		}

		let h = 0;

		if (x >= 48 && y < 48) {
			h = 1;
			x -= 48;
		} else if (x < 48 && y >= 48) {
			h = 2;
			y -= 48;
		} else if (x >= 48 && y >= 48) {
			h = 3;
			x -= 48;
			y -= 48;
		}

		return this.wallsEastWest.get(h, x * 48 + y) & 0xff;
	}

	setTerrainAmbience(x, y, x2, y2, ambience) {
		let gameModel = this.terrainModels[x + y * 8];

		for (let j1 = 0; j1 < gameModel.numVertices; j1++) {
			if (gameModel.vertexX[j1] === x2 * this.tileSize && gameModel.vertexZ[j1] === y2 * this.tileSize) {
				gameModel.setVertexAmbience(j1, ambience);
				return;
			}
		}
	}

	getWallRoof(x, y) {
		if (x < 0 || x >= this.regionWidth || y < 0 || y >= this.regionHeight) {
			return 0;
		}

		let h = 0;

		if (x >= 48 && y < 48) {
			h = 1;
			x -= 48;
		} else if (x < 48 && y >= 48) {
			h = 2;
			y -= 48;
		} else if (x >= 48 && y >= 48) {
			h = 3;
			x -= 48;
			y -= 48;
		}

		return this.wallsRoof.get(h, x * 48 + y);
	}

	getElevation(x, y) {
		let sX = x >> 7;
		let sY = y >> 7;
		let aX = x & 0x7f;
		let aY = y & 0x7f;

		if (sX < 0 || sY < 0 || sX >= 95 || sY >= 95) {
			return 0;
		}

		let h = 0;
		let hx = 0;
		let hy = 0;

		if (aX <= this.tileSize - aY) {
			h = this.getTerrainHeight(sX, sY);
			hx = this.getTerrainHeight(sX + 1, sY) - h;
			hy = this.getTerrainHeight(sX, sY + 1) - h;
		} else {
			h = this.getTerrainHeight(sX + 1, sY + 1);
			hx = this.getTerrainHeight(sX, sY + 1) - h;
			hy = this.getTerrainHeight(sX + 1, sY) - h;
			aX = this.tileSize - aX;
			aY = this.tileSize - aY;
		}

		let elevation = h + (((hx * aX) / this.tileSize) | 0) + (((hy * aY) / this.tileSize) | 0);

		return elevation;
	}

	getWallDiagonal(x, y) {
		if (x < 0 || x >= this.regionWidth || y < 0 || y >= this.regionHeight) {
			return 0;
		}

		let h = 0;

		if (x >= 48 && y < 48) {
			h = 1;
			x -= 48;
		} else if (x < 48 && y >= 48) {
			h = 2;
			y -= 48;
		} else if (x >= 48 && y >= 48) {
			h = 3;
			x -= 48;
			y -= 48;
		}

		return this.wallsDiagonal.get(h, x * 48 + y);
	}

	removeObject2(x, y, id) {
		if (x < 0 || y < 0 || x >= 95 || y >= 95) {
			return;
		}

		if (GameData.objectType[id] === 1 || GameData.objectType[id] === 2) {
			let tileDir = this.getTileDirection(x, y);
			let modelWidth = 0;
			let modelHeight = 0;

			if (tileDir === 0 || tileDir === 4) {
				modelWidth = GameData.objectWidth[id];
				modelHeight = GameData.objectHeight[id];
			} else {
				modelHeight = GameData.objectWidth[id];
				modelWidth = GameData.objectHeight[id];
			}

			for (let mx = x; mx < x + modelWidth; mx++) {
				for (let my = y; my < y + modelHeight; my++) {
					const adjacency = this.objectAdjacency.get(mx, my);

					if (GameData.objectType[id] === 1) {
						this.objectAdjacency.set(mx, my, adjacency | 0x40);
					} else if (tileDir === 0) {
						this.objectAdjacency.set(mx, my, adjacency | 2);

						if (mx > 0) {
							this._setObjectAdjacency_from3(mx - 1, my, 8);
						}
					} else if (tileDir === 2) {
						this.objectAdjacency.set(mx, my, adjacency | 4);

						if (my < 95) {
							this._setObjectAdjacency_from3(mx, my + 1, 1);
						}
					} else if (tileDir === 4) {
						this.objectAdjacency.set(mx, my, adjacency | 8);

						if (mx < 95) {
							this._setObjectAdjacency_from3(mx + 1, my, 2);
						}
					} else if (tileDir === 6) {
						this.objectAdjacency.set(mx, my, adjacency | 1);

						if (my > 0) {
							this._setObjectAdjacency_from3(mx, my - 1, 4);
						}
					}
				}
			}

			this.method404(x, y, modelWidth, modelHeight);
		}
	}

	removeWallObject(x, y, k, id) {
		if (x < 0 || y < 0 || x >= 95 || y >= 95) {
			return;
		}

		if (GameData.wallObjectAdjacent[id] === 1) {
			const adjacency = this.objectAdjacency.get(x, y);

			if (k === 0) {
				this.objectAdjacency.set(x, y, adjacency & 0xfffe);

				if (y > 0) {
					this.method407(x, y - 1, 4);
				}
			} else if (k === 1) {
				this.objectAdjacency.set(x, y, adjacency & 0xfffd);

				if (x > 0) {
					this.method407(x - 1, y, 8);
				}
			} else if (k === 2) {
				this.objectAdjacency.set(x, y, adjacency & 0xffef);
			} else if (k === 3) {
				this.objectAdjacency.set(x, y, adjacency & 0xffdf);
			}

			this.method404(x, y, 1, 1);
		}
	}

	method402(i, j, k, l, i1) {
		let j1 = i * 3;
		let k1 = j * 3;
		let l1 = this.scene.method302(l);
		let i2 = this.scene.method302(i1);
		l1 = l1 >> 1 & 0x7f7f7f;
		i2 = i2 >> 1 & 0x7f7f7f;

		if (k === 0) {
			this.surface.drawLineHoriz(j1, k1, 3, l1);
			this.surface.drawLineHoriz(j1, k1 + 1, 2, l1);
			this.surface.drawLineHoriz(j1, k1 + 2, 1, l1);
			this.surface.drawLineHoriz(j1 + 2, k1 + 1, 1, i2);
			this.surface.drawLineHoriz(j1 + 1, k1 + 2, 2, i2);

			return;
		}

		if (k === 1) {
			this.surface.drawLineHoriz(j1, k1, 3, i2);
			this.surface.drawLineHoriz(j1 + 1, k1 + 1, 2, i2);
			this.surface.drawLineHoriz(j1 + 2, k1 + 2, 1, i2);
			this.surface.drawLineHoriz(j1, k1 + 1, 1, l1);
			this.surface.drawLineHoriz(j1, k1 + 2, 2, l1);
		}
	}

	decodeSector(x, y, plane, chunk) {
		let mapName = 'm' + plane + ((x / 10) | 0) + x % 10 + ((y / 10) | 0) + y % 10;
		if (this.landscapePack) {
			let map = this.landscapePack.get(mapName + '.hei');

			if (!map && this.memberLandscapePack)
				map = this.memberLandscapePack.get(mapName + '.hei');

			if (map && map.data) {
				let mapData = map.data;
				let off = 0;
				let lastVal = 0;

				for (let tile = 0; tile < 2304; ) {
					let val = mapData[off++] & 0xff;

					if (val < 128) {
						this.terrainHeight.set(chunk, tile++, val & 0xff);
						lastVal = val;
					}

					if (val >= 128) {
						for (let i = 0; i < val - 128; i++) {
							this.terrainHeight.set(chunk, tile++, lastVal & 0xff);
						}
					}
				}

				lastVal = 64;

				for (let tileY = 0; tileY < 48; tileY++) {
					for (let tileX = 0; tileX < 48; tileX++) {
						lastVal = this.terrainHeight.get(chunk, tileX * 48 + tileY) + lastVal & 0x7f;
						this.terrainHeight.set(chunk, tileX * 48 + tileY, (lastVal * 2) & 0xff);
					}
				}

				lastVal = 0;

				for (let tile = 0; tile < 2304; ) {
					let val = mapData[off++] & 0xff;

					if (val < 128) {
						this.terrainColour.set(chunk, tile++, val & 0xff);
						lastVal = val;
					}

					if (val >= 128) {
						for (let i = 0; i < val - 128; i++) {
							this.terrainColour.set(chunk, tile++, lastVal & 0xff);
						}
					}
				}

				lastVal = 35;

				for (let tileY = 0; tileY < 48; tileY++) {
					for (let tileX = 0; tileX < 48; tileX++) {
						lastVal = this.terrainColour.get(chunk, tileX * 48 + tileY) + lastVal & 0x7f; // p sure this is just some RLE checks being masked off
						this.terrainColour.set(chunk, tileX * 48 + tileY, (lastVal * 2) & 0xff);
					}
				}
			} else {
				for (let tile = 0; tile < 2304; tile++) {
					this.terrainHeight.set(chunk, tile, 0);
					this.terrainColour.set(chunk, tile, 0);
				}
			}

			map = this.mapPack.get(`${mapName}.dat`);

			if (!map && this.memberMapPack)
				map = this.memberMapPack.get(`${mapName}.dat`);

			if (!map || !map.data) {
				for (let tile = 0; tile < 2304; tile++) {
					this.terrainHeight.set(chunk, tile, 0);
					this.terrainColour.set(chunk, tile, 0);
					this.wallsNorthSouth.set(chunk, tile, 0);
					this.wallsEastWest.set(chunk, tile, 0);
					this.wallsDiagonal.set(chunk, tile, 0);
					this.wallsRoof.set(chunk, tile, 0);
					this.tileDecoration.set(chunk, tile, 0);

					// -6 should overflow to -250 and represents water tiles on ground plane
					if (plane === 0)
						this.tileDecoration.set(chunk, tile, -6);

					// 8 is a solid black non-clickable tile, but since it is on basement plane,
					// I believe some properties of it are unique to the upper planes (e.g. plane1,2)
					if (plane === 3)
						this.tileDecoration.set(chunk, tile, 8);
	
					this.tileDirection.set(chunk, tile, 0);
				}
				return;
			}
			let mapData = map.data;

			let off = 0;

			for (let tile = 0; tile < 2304; tile++)
				this.wallsNorthSouth.set(chunk, tile, mapData[off++]);

			for (let tile = 0; tile < 2304; tile++)
				this.wallsEastWest.set(chunk, tile, mapData[off++]);

			for (let tile = 0; tile < 2304; tile++)
				this.wallsDiagonal.set(chunk, tile, mapData[off++] & 0xFF);

			for (let tile = 0; tile < 2304; tile++) {
				let val = mapData[off++] & 0xff;

				if (val > 0)
					this.wallsDiagonal.set(chunk, tile, val + 12000); // this tells us this is the opposite diag p sure
			}

			for (let tile = 0; tile < 2304; ) {
				let val = mapData[off++] & 0xff;

				if (val < 128) {
					this.wallsRoof.set(chunk, tile++, val & 0xff);
				} else {
					// RLE shit
					for (let i = 0; i < val - 128; i++) {
						this.wallsRoof.set(chunk, tile++, 0);
					}
				}
			}

			// RLE tmp var
			let lastVal = 0;

			for (let tile = 0; tile < 2304; ) {
				let val = mapData[off++] & 0xff;

				if (val < 128) {
					this.tileDecoration.set(chunk, tile++, val & 0xff);
					// RLE shit
					lastVal = val;
				} else {
					// RLE shit
					for (let i = 0; i < val - 128; i++) {
						this.tileDecoration.set(chunk, tile++, lastVal);
					}
				}
			}

			for (let tile = 0; tile < 2304; ) {
				let val = mapData[off++] & 0xff;

				if (val < 128) {
					this.tileDirection.set(chunk, tile++, val & 0xff);
				} else {
					// RLE, run of blank dirs, I could be wrong but this is for I think scenary object orientation
					for (let i = 0; i < val - 128; i++) {
						this.tileDirection.set(chunk, tile++, 0);
					}
				}
			}

			map = this.mapPack.get(mapName + '.loc');

			if (map && map.data) {
				let mapData = map.data;
				off = 0;

				for (let tile = 0; tile < 2304; ) {
					let val = mapData[off++] & 0xFF;

					if (val < 0x80)
						this.wallsDiagonal.set(chunk, tile++, val + 48000);
					else
						tile += val - 128;
				}
			}
		}
	}

	loadSection(...args) {
		switch (args.length) {
		case 3:
			return this._loadSection_from3(...args);
		case 4:
			if (typeof args[3] === 'number') {
				return this.decodeSector(...args);
			}

			return this.loadRegionThenMakeModel(...args);
		}
	}

	method404(x, y, width, height) {
		if (x < 1 || y < 1 || x + width >= this.regionWidth || y + height >= this.regionHeight)
			return;

		for (let xx = x; xx <= x + width; xx++) {
			for (let yy = y; yy <= y + height; yy++) {
				if ((this.getObjectAdjacency(xx, yy) & 0x63) !== 0 || (this.getObjectAdjacency(xx - 1, yy) & 0x59) !== 0 || (this.getObjectAdjacency(xx, yy - 1) & 0x56) !== 0 || (this.getObjectAdjacency(xx - 1, yy - 1) & 0x6c) !== 0) {
					this.method425(xx, yy, 35);
				} else {
					this.method425(xx, yy, 0);
				}
			}
		}
	}

	getObjectAdjacency(x, y) {
		if (x < 0 || y < 0 || x >= this.regionWidth || y >= this.regionHeight) {
			return 0;
		} else {
			return this.objectAdjacency.get(x, y);
		}
	}

	hasRoof(x, y) {
		return this.getWallRoof(x, y) > 0 && this.getWallRoof(x - 1, y) > 0 && this.getWallRoof(x - 1, y - 1) > 0 && this.getWallRoof(x, y - 1) > 0;
	}

	method407(i, j, k) {
		const adjacency = this.objectAdjacency.get(i, j);
		this.objectAdjacency.set(i, j, adjacency & 0xffff - k);
	}

	getTerrainColour(x, y) {
		if (x < 0 || x >= this.regionWidth || y < 0 || y >= this.regionHeight) {
			return 0;
		}

		let h = 0;

		if (x >= 48 && y < 48) {
			h = 1;
			x -= 48;
		} else if (x < 48 && y >= 48) {
			h = 2;
			y -= 48;
		} else if (x >= 48 && y >= 48) {
			h = 3;
			x -= 48;
			y -= 48;
		}

		return this.terrainColour.get(h, x * 48 + y) & 0xff;
	}

	reset() {
		if (this.worldInitialised)
			this.scene.dispose();

		for (let i = 0; i < 64; i++) {
			this.terrainModels[i] = null;

			for (let j = 0; j < 4; j++) {
				this.wallModels[j][i] = null;
			}

			for (let k = 0; k < 4; k++) {
				this.roofModels[k][i] = null;
			}

		}
	}

	fillEmptySectorsAndBorder() {
		for (let x = 0; x < this.regionWidth; x++) {
			for (let y = 0; y < this.regionHeight; y++) {
				// basically, if a tile is part of an autofilled empty sector
				// on plane 0 but it's next to traversable real plane map sectors,
				// we render a border made up of white non-walkable tiles as a separator
				if (this.getOverlayID(x, y, 0) === 250) {
					// if we found a non-water tile adjacent to the ocean
					if ((x === 47 && this.getOverlayID(x + 1, y, 0) !== 250 && this.getOverlayID(x + 1, y, 0) !== 2) ||
						(y === 47 && this.getOverlayID(x, y + 1, 0) !== 250 && this.getOverlayID(x, y + 1, 0) !== 2)) {
						// set to white border
						this.setTileDecoration(x, y, 9);
					} else {
						// otherwise set to normal water overlay, since plane 0 is ground level and we want users to
						// see oceans in null sectors
						this.setTileDecoration(x, y, 2);
					}
				}
			}
		}
	}

	getWallNorthSouth(x, y) {
		if (x < 0 || x >= this.regionWidth || y < 0 || y >= this.regionHeight)
			return 0;

		let h = 0;

		if (x >= 48 && y < 48) {
			h = 1;
			x -= 48;
		} else if (x < 48 && y >= 48) {
			h = 2;
			y -= 48;
		} else if (x >= 48 && y >= 48) {
			h = 3;
			x -= 48;
			y -= 48;
		}

		return this.wallsNorthSouth.get(h, x * 48 + y) & 0xff;
	}

	getTileDirection(x, y) {
		if (x < 0 || x >= this.regionWidth || y < 0 || y >= this.regionHeight) {
			return 0;
		}

		let h = 0;

		if (x >= 48 && y < 48) {
			h = 1;
			x -= 48;
		} else if (x < 48 && y >= 48) {
			h = 2;
			y -= 48;
		} else if (x >= 48 && y >= 48) {
			h = 3;
			x -= 48;
			y -= 48;
		}

		return this.tileDirection.get(h, x * 48 + y);
	}

	_getTileDecoration_from4(x, y, unused, def) {
		let deco = this._getTileDecoration_from3(x, y, unused);

		if (deco === 0) {
			return def;
		}
		
		return GameData.tileDecoration[deco - 1];
	}

	_getTileDecoration_from3(x, y, unused) {
		if (x < 0 || x >= this.regionWidth || y < 0 || y >= this.regionHeight) {
			return 0;
		}

		let h = 0;

		if (x >= 48 && y < 48) {
			h = 1;
			x -= 48;
		} else if (x < 48 && y >= 48) {
			h = 2;
			y -= 48;
		} else if (x >= 48 && y >= 48) {
			h = 3;
			x -= 48;
			y -= 48;
		}

		return this.tileDecoration.get(h, x * 48 + y) & 0xff;
	}

	getOverlayID(...args) {
		switch (args.length) {
		case 3:
			return this._getTileDecoration_from3(...args);
		case 4:
			return this._getTileDecoration_from4(...args);
		}
	}

	setTileDecoration(x, y, v) {
		if (x < 0 || x >= this.regionWidth || y < 0 || y >= this.regionHeight) {
			return;
		}

		let h = 0;

		if (x >= 48 && y < 48) {
			h = 1;
			x -= 48;
		} else if (x < 48 && y >= 48) {
			h = 2;
			y -= 48;
		} else if (x >= 48 && y >= 48) {
			h = 3;
			x -= 48;
			y -= 48;
		}

		this.tileDecoration.set(h, x * 48 + y, v & 0xff);
	}

	route(startX, startY, endX1, endY1, endX2, endY2, routeX, routeY, objects) {
		for (let x = 0; x < this.regionWidth; x++) {
			for (let y = 0; y < this.regionHeight; y++) {
				this.routeVia.set(x, y, 0);
			}
		}

		let writePtr = 0;
		let readPtr = 0;
		let x = startX;
		let y = startY;

		this.routeVia.set(startX, startY, 99);
		routeX[writePtr] = startX;
		routeY[writePtr++] = startY;

		let size = routeX.length;
		let reached = false;

		while (readPtr !== writePtr) {
			x = routeX[readPtr];
			y = routeY[readPtr];
			readPtr = (readPtr + 1) % size;

			if (x >= endX1 && x <= endX2 && y >= endY1 && y <= endY2) {
				reached = true;
				break;
			}

			if (objects) {
				if (x > 0 && x - 1 >= endX1 && x - 1 <= endX2 && y >= endY1 && y <= endY2 && (this.objectAdjacency.get(x - 1, y) & 8) === 0) {
					reached = true;
					break;
				}

				if (x < 95 && x + 1 >= endX1 && x + 1 <= endX2 && y >= endY1 && y <= endY2 && (this.objectAdjacency.get(x + 1, y) & 2) === 0) {
					reached = true;
					break;
				}

				if (y > 0 && x >= endX1 && x <= endX2 && y - 1 >= endY1 && y - 1 <= endY2 && (this.objectAdjacency.get(x, y - 1) & 4) === 0) {
					reached = true;
					break;
				}

				if (y < 95 && x >= endX1 && x <= endX2 && y + 1 >= endY1 && y + 1 <= endY2 && (this.objectAdjacency.get(x, y + 1) & 1) === 0) {
					reached = true;
					break;
				}
			}

			// x-1,y
			if (x > 0 && this.routeVia.get(x - 1, y) === 0 && (this.objectAdjacency.get(x - 1, y) & 0b1111000) === 0) {
				routeX[writePtr] = x - 1;
				routeY[writePtr] = y;
				writePtr = (writePtr + 1) % size;
				this.routeVia.set(x - 1, y, 2);
			}

			// 8, x+1,y
			if (x < 95 && this.routeVia.get(x + 1, y) === 0 && (this.objectAdjacency.get(x + 1, y) & 0b1110010) === 0) {
				routeX[writePtr] = x + 1;
				routeY[writePtr] = y;
				writePtr = (writePtr + 1) % size;
				this.routeVia.set(x + 1, y, 8);
			}

			// 1, x,y-1
			if (y > 0 && this.routeVia.get(x, y - 1) === 0 && (this.objectAdjacency.get(x, y - 1) & 0b1110100) === 0) {
				routeX[writePtr] = x;
				routeY[writePtr] = y - 1;
				writePtr = (writePtr + 1) % size;
				this.routeVia.set(x, y - 1, 1);
			}

			// 4, x,y+1
			if (y < 95 && this.routeVia.get(x, y + 1) === 0 && (this.objectAdjacency.get(x, y + 1) & 0b1110001) === 0) {
				routeX[writePtr] = x;
				routeY[writePtr] = y + 1;
				writePtr = (writePtr + 1) % size;
				this.routeVia.set(x, y + 1, 4);
			}

			// 2|1, x,y-1 x-1,y x-1,y-1
			if (x > 0 && y > 0 && (this.objectAdjacency.get(x, y - 1) & 0b1110100) === 0 && (this.objectAdjacency.get(x - 1, y) & 0b1111000) === 0 && (this.objectAdjacency.get(x - 1, y - 1) & 0b1111100) === 0 && this.routeVia.get(x - 1, y - 1) === 0) {
				routeX[writePtr] = x - 1;
				routeY[writePtr] = y - 1;
				writePtr = (writePtr + 1) % size;
				this.routeVia.set(x - 1, y - 1, 3);
			}

			// 8|1, x,y-1, x+1,y, x+1,y-1
			if (x < 95 && y > 0 && (this.objectAdjacency.get(x, y - 1) & 0b1110100) === 0 && (this.objectAdjacency.get(x + 1, y) & 0b1110010) === 0 && (this.objectAdjacency.get(x + 1, y - 1) & 0b1110110) === 0 && this.routeVia.get(x + 1, y - 1) === 0) {
				routeX[writePtr] = x + 1;
				routeY[writePtr] = y - 1;
				writePtr = (writePtr + 1) % size;
				this.routeVia.set(x + 1, y - 1, 9);
			}

			// 4|2, x,y+1 x-1,y x-1,y+1
			if (x > 0 && y < 95 && (this.objectAdjacency.get(x, y + 1) & 0b1110001) === 0 && (this.objectAdjacency.get(x - 1, y) & 0b1111000) === 0 && (this.objectAdjacency.get(x - 1, y + 1) & 0b1111001) === 0 && this.routeVia.get(x - 1, y + 1) === 0) {
				routeX[writePtr] = x - 1;
				routeY[writePtr] = y + 1;
				writePtr = (writePtr + 1) % size;
				this.routeVia.set(x - 1, y + 1, 6);
			}

			// 8|4, x,y+1, x+1,y x+1,y+1
			if (x < 95 && y < 95 && (this.objectAdjacency.get(x, y + 1) & 0b1110001) === 0 && (this.objectAdjacency.get(x + 1, y) & 0b1110010) === 0 && (this.objectAdjacency.get(x + 1,y + 1) & 0b1110011) === 0 && this.routeVia.get(x + 1, y + 1) === 0) {
				routeX[writePtr] = x + 1;
				routeY[writePtr] = y + 1;
				writePtr = (writePtr + 1) % size;
				this.routeVia.set(x + 1, y + 1, 12);
			}
		}

		if (!reached) {
			return -1;
		}

		readPtr = 0;
		routeX[readPtr] = x;
		routeY[readPtr++] = y;

		let stride;

		for (let step = stride = this.routeVia.get(x, y); x !== startX || y !== startY; step = this.routeVia.get(x, y)) {
			if (step !== stride) {
				stride = step;
				routeX[readPtr] = x;
				routeY[readPtr++] = y;
			}

			if ((step & 2) !== 0) {
				x++;
			} else if ((step & 8) !== 0) {
				x--;
			}

			if ((step & 1) !== 0) {
				y++;
			} else if ((step & 4) !== 0) {
				y--;
			}
		}

		return readPtr;
	}

	_setObjectAdjacency_from4(x, y, dir, id) {
		if (x < 0 || y < 0 || x >= 95 || y >= 95) {
			return;
		}

		if (GameData.wallObjectAdjacent[id] === 1) {
			const adjacency = this.objectAdjacency.get(x, y);

			if (dir === 0) {
				this.objectAdjacency.set(x, y, adjacency | 1);

				if (y > 0) {
					this._setObjectAdjacency_from3(x, y - 1, 4);
				}
			} else if (dir === 1) {
				this.objectAdjacency.set(x, y, adjacency | 2);

				if (x > 0) {
					this._setObjectAdjacency_from3(x - 1, y, 8);
				}
			} else if (dir === 2) {
				this.objectAdjacency.set(x, y, adjacency | 0x10);
			} else if (dir === 3) {
				this.objectAdjacency.set(x, y, adjacency | 0x20);
			}

			this.method404(x, y, 1, 1);
		}
	}

	setObjectAdjacency(...args) {
		switch (args.length) {
		case 4:
			return this._setObjectAdjacency_from4(...args);
		case 3:
			return this._setObjectAdjacency_from3(...args);
		}
	}

	loadRegionThenMakeModel(x, y, plane, flag) {
		let l = ((x + 24) / 48) | 0;
		let i1 = ((y + 24) / 48) | 0;

		this.decodeSector(l - 1, i1 - 1, plane, 0);
		this.decodeSector(l, i1 - 1, plane, 1);
		this.decodeSector(l - 1, i1, plane, 2);
		this.decodeSector(l, i1, plane, 3);
		this.fillEmptySectorsAndBorder();

		if (this.parentModel === null)
			this.parentModel = GameModel._from7(0x4900, 0x4900, true, true, false, false, true);

		if (flag) {
			this.surface.blackScreen();

			for (let j1 = 0; j1 < this.regionWidth; j1++) {
				for (let l1 = 0; l1 < this.regionHeight; l1++) {
					this.objectAdjacency.set(j1, l1, 0);
				}
			}

			let gameModel = this.parentModel;
			gameModel.clear();
	
			// for each tile, we offset the ambience, to make the world seem less fake??
			// the tile vectors new ambience will be set to (256 - (rand(-5, 5)*4)
			for (let x = 0; x < this.regionWidth; x++) for (let y = 0; y < this.regionHeight; y++) {
				let z = -this.getTerrainHeight(x, y);
	
				for (let xOff = -1; xOff < 1; xOff++) {
					for (let yOff = -1; yOff < 1; yOff++) {
						let overlayID = this.getOverlayID(x + xOff, y + yOff, plane);
						if (overlayID > 0 && GameData.overlays[overlayID-1] === 4) {
							z = 0;
							break;
						}
					}
				}
				// if (this.getOverlayID(x, y, plane) > 0 && GameData.overlays[this.getOverlayID(x, y, plane) - 1] === 4) {
				//	 z = 0;
				// }
				//
				// if (this.getOverlayID(x - 1, y, plane) > 0 && GameData.overlays[this.getOverlayID(x - 1, y, plane) - 1] === 4) {
				//	 z = 0;
				// }
				//
				// if (this.getOverlayID(x, y - 1, plane) > 0 && GameData.overlays[this.getOverlayID(x, y - 1, plane) - 1] === 4) {
				//	 z = 0;
				// }
				//
				// if (this.getOverlayID(x - 1, y - 1, plane) > 0 && GameData.overlays[this.getOverlayID(x - 1, y - 1, plane) - 1] === 4) {
				//	 z = 0;
				// }
	
				let vertexHandle = gameModel.vertexAt(x * this.tileSize, z, y * this.tileSize);
				// let ambienceOffset = rand(-5, 5)
				let ambienceOffset = (Math.random() * 10 | 0) - 5;

				gameModel.setVertexAmbience(vertexHandle, ambienceOffset);
			}
	
			for (let lx = 0; lx < 95; lx++) {
				for (let ly = 0; ly < 95; ly++) {
					let groundColor = this.getTerrainColour(lx, ly);
					let colour = this.terrainColours[groundColor];
					let colour_1 = colour;
					let colour_2 = colour;
					let l14 = 0;

					if (plane === 1 || plane === 2) {
						// Set default ground colors to transparent on upper levels
						colour = World.colourTransparent;
						colour_1 = World.colourTransparent;
						colour_2 = World.colourTransparent;
					}
	
					let overlayIndex = this.getOverlayID(lx, ly, plane);
					if (overlayIndex > 0) {
						// We are dealing with a tile that has an overlay
						let overlay = GameData.overlays[overlayIndex - 1];
						let tileType = this.getTileType(lx, ly, plane);

						colour = colour_1 = GameData.tileDecoration[overlayIndex - 1];

						// bridge is 4
						if (overlay === 4) {
							colour = 1;
							colour_1 = 1;

							// some other type of bridge idk
							if (overlayIndex === 12) {
								colour = 31;
								colour_1 = 31;
							}
						}

						if (overlay === 5) {
							// If stone floor overlay and a diagonal wall are on this tile
							if (this.getWallDiagonal(lx, ly) > 0 && this.getWallDiagonal(lx, ly) < 24000) {
								if (this.getOverlayID(lx - 1, ly, plane, colour_2) !== World.colourTransparent && this.getOverlayID(lx, ly - 1, plane, colour_2) !== World.colourTransparent) {
									colour = this.getOverlayID(lx - 1, ly, plane, colour_2);
									l14 = 0;
								} else if (this.getOverlayID(lx + 1, ly, plane, colour_2) !== World.colourTransparent && this.getOverlayID(lx, ly + 1, plane, colour_2) !== World.colourTransparent) {
									colour_1 = this.getOverlayID(lx + 1, ly, plane, colour_2);
									l14 = 0;
								} else if (this.getOverlayID(lx + 1, ly, plane, colour_2) !== World.colourTransparent && this.getOverlayID(lx, ly - 1, plane, colour_2) !== World.colourTransparent) {
									colour_1 = this.getOverlayID(lx + 1, ly, plane, colour_2);
									l14 = 1;
								} else if (this.getOverlayID(lx - 1, ly, plane, colour_2) !== World.colourTransparent && this.getOverlayID(lx, ly + 1, plane, colour_2) !== World.colourTransparent) {
									colour = this.getOverlayID(lx - 1, ly, plane, colour_2);
									l14 = 1;
								}
							}
						} else if (overlay !== 2 || this.getWallDiagonal(lx, ly) > 0 && this.getWallDiagonal(lx, ly) < 24000) {
							// if overlay isn't water, or stone floor, and a diagonal wall is on this tile
							if (this.getTileType(lx - 1, ly, plane) !== tileType && this.getTileType(lx, ly - 1, plane) !== tileType) {
								colour = colour_2;
								l14 = 0;
							} else if (this.getTileType(lx + 1, ly, plane) !== tileType && this.getTileType(lx, ly + 1, plane) !== tileType) {
								colour_1 = colour_2;
								l14 = 0;
							} else if (this.getTileType(lx + 1, ly, plane) !== tileType && this.getTileType(lx, ly - 1, plane) !== tileType) {
								colour_1 = colour_2;
								l14 = 1;
							} else if (this.getTileType(lx - 1, ly, plane) !== tileType && this.getTileType(lx, ly + 1, plane) !== tileType) {
								colour = colour_2;
								l14 = 1;
							}
						}

						// TODO: figure more out on tileAdjacent it's basically unknown right now to me.
						if (GameData.tileAdjacent[overlayIndex - 1] !== 0) {
							const adjacency = this.objectAdjacency.get(lx, ly);
							this.objectAdjacency.set(lx, ly, adjacency | 0x40);
						}

						// Water set full block
						if (GameData.overlays[overlayIndex - 1] === 2) {
							const adjacency = this.objectAdjacency.get(lx, ly);
							this.objectAdjacency.set(lx, ly, adjacency | 0x80);
						}
					}

					this.method402(lx, ly, l14, colour, colour_1);

					let i17 = ((this.getTerrainHeight(lx + 1, ly + 1) - this.getTerrainHeight(lx + 1, ly)) + this.getTerrainHeight(lx, ly + 1)) - this.getTerrainHeight(lx, ly);

					if (colour !== colour_1 || i17 !== 0) {
						let ai = new Int32Array(3);
						let ai7 = new Int32Array(3);

						if (l14 === 0) {
							if (colour !== World.colourTransparent) {
								ai[0] = ly + lx * 96 + 96;
								ai[1] = ly + lx * 96;
								ai[2] = ly + lx * 96 + 1;

								let l21 = gameModel.createFace(3, ai, World.colourTransparent, colour);

								this.localX[l21] = lx;
								this.localY[l21] = ly;

								gameModel.faceTag[l21] = 0x30d40 + l21;
							}

							if (colour_1 !== World.colourTransparent) {
								ai7[0] = ly + lx * 96 + 1;
								ai7[1] = ly + lx * 96 + 96 + 1;
								ai7[2] = ly + lx * 96 + 96;

								let i22 = gameModel.createFace(3, ai7, World.colourTransparent, colour_1);

								this.localX[i22] = lx;
								this.localY[i22] = ly;

								gameModel.faceTag[i22] = 0x30d40 + i22;
							}
						} else {
							if (colour !== World.colourTransparent) {
								ai[0] = ly + lx * 96 + 1;
								ai[1] = ly + lx * 96 + 96 + 1;
								ai[2] = ly + lx * 96;

								let j22 = gameModel.createFace(3, ai, World.colourTransparent, colour);

								this.localX[j22] = lx;
								this.localY[j22] = ly;

								gameModel.faceTag[j22] = 0x30d40 + j22;
							}

							if (colour_1 !== World.colourTransparent) {
								ai7[0] = ly + lx * 96 + 96;
								ai7[1] = ly + lx * 96;
								ai7[2] = ly + lx * 96 + 96 + 1;

								let k22 = gameModel.createFace(3, ai7, World.colourTransparent, colour_1);

								this.localX[k22] = lx;
								this.localY[k22] = ly;

								gameModel.faceTag[k22] = 0x30d40 + k22;
							}
						}
					} else if (colour !== World.colourTransparent) {
						let ai1 = new Int32Array(4);
						ai1[0] = ly + lx * 96 + 96;
						ai1[1] = ly + lx * 96;
						ai1[2] = ly + lx * 96 + 1;
						ai1[3] = ly + lx * 96 + 96 + 1;

						let l19 = gameModel.createFace(4, ai1, World.colourTransparent, colour);

						this.localX[l19] = lx;
						this.localY[l19] = ly;

						gameModel.faceTag[l19] = 0x30d40 + l19;
					}
				}
			}

			for (let k4 = 1; k4 < 95; k4++) {
				for (let i6 = 1; i6 < 95; i6++) {
					if (this.getOverlayID(k4, i6, plane) > 0 && GameData.overlays[this.getOverlayID(k4, i6, plane) - 1] === 4) {
						let l7 = GameData.tileDecoration[this.getOverlayID(k4, i6, plane) - 1];
						let j10 = gameModel.vertexAt(k4 * this.tileSize, -this.getTerrainHeight(k4, i6), i6 * this.tileSize);
						let l12 = gameModel.vertexAt((k4 + 1) * this.tileSize, -this.getTerrainHeight(k4 + 1, i6), i6 * this.tileSize);
						let i15 = gameModel.vertexAt((k4 + 1) * this.tileSize, -this.getTerrainHeight(k4 + 1, i6 + 1), (i6 + 1) * this.tileSize);
						let j17 = gameModel.vertexAt(k4 * this.tileSize, -this.getTerrainHeight(k4, i6 + 1), (i6 + 1) * this.tileSize);
						let ai2 = new Int32Array([j10, l12, i15, j17]);
						let i20 = gameModel.createFace(4, ai2, l7, World.colourTransparent);
						this.localX[i20] = k4;
						this.localY[i20] = i6;
						gameModel.faceTag[i20] = 0x30d40 + i20;
						this.method402(k4, i6, 0, l7, l7);
					} else if (this.getOverlayID(k4, i6, plane) === 0 || GameData.overlays[this.getOverlayID(k4, i6, plane) - 1] !== 3) {
						if (this.getOverlayID(k4, i6 + 1, plane) > 0 && GameData.overlays[this.getOverlayID(k4, i6 + 1, plane) - 1] === 4) {
							let i8 = GameData.tileDecoration[this.getOverlayID(k4, i6 + 1, plane) - 1];
							let k10 = gameModel.vertexAt(k4 * this.tileSize, -this.getTerrainHeight(k4, i6), i6 * this.tileSize);
							let i13 = gameModel.vertexAt((k4 + 1) * this.tileSize, -this.getTerrainHeight(k4 + 1, i6), i6 * this.tileSize);
							let j15 = gameModel.vertexAt((k4 + 1) * this.tileSize, -this.getTerrainHeight(k4 + 1, i6 + 1), (i6 + 1) * this.tileSize);
							let k17 = gameModel.vertexAt(k4 * this.tileSize, -this.getTerrainHeight(k4, i6 + 1), (i6 + 1) * this.tileSize);
							let ai3 = new Int32Array([k10, i13, j15, k17]);
							let j20 = gameModel.createFace(4, ai3, i8, World.colourTransparent);
							this.localX[j20] = k4;
							this.localY[j20] = i6;
							gameModel.faceTag[j20] = 0x30d40 + j20;
							this.method402(k4, i6, 0, i8, i8);
						}

						if (this.getOverlayID(k4, i6 - 1, plane) > 0 && GameData.overlays[this.getOverlayID(k4, i6 - 1, plane) - 1] === 4) {
							let j8 = GameData.tileDecoration[this.getOverlayID(k4, i6 - 1, plane) - 1];
							let l10 = gameModel.vertexAt(k4 * this.tileSize, -this.getTerrainHeight(k4, i6), i6 * this.tileSize);
							let j13 = gameModel.vertexAt((k4 + 1) * this.tileSize, -this.getTerrainHeight(k4 + 1, i6), i6 * this.tileSize);
							let k15 = gameModel.vertexAt((k4 + 1) * this.tileSize, -this.getTerrainHeight(k4 + 1, i6 + 1), (i6 + 1) * this.tileSize);
							let l17 = gameModel.vertexAt(k4 * this.tileSize, -this.getTerrainHeight(k4, i6 + 1), (i6 + 1) * this.tileSize);
							let ai4 = new Int32Array([l10, j13, k15, l17]);
							let k20 = gameModel.createFace(4, ai4, j8, World.colourTransparent);
							this.localX[k20] = k4;
							this.localY[k20] = i6;
							gameModel.faceTag[k20] = 0x30d40 + k20;
							this.method402(k4, i6, 0, j8, j8);
						}

						if (this.getOverlayID(k4 + 1, i6, plane) > 0 && GameData.overlays[this.getOverlayID(k4 + 1, i6, plane) - 1] === 4) {
							let k8 = GameData.tileDecoration[this.getOverlayID(k4 + 1, i6, plane) - 1];
							let i11 = gameModel.vertexAt(k4 * this.tileSize, -this.getTerrainHeight(k4, i6), i6 * this.tileSize);
							let k13 = gameModel.vertexAt((k4 + 1) * this.tileSize, -this.getTerrainHeight(k4 + 1, i6), i6 * this.tileSize);
							let l15 = gameModel.vertexAt((k4 + 1) * this.tileSize, -this.getTerrainHeight(k4 + 1, i6 + 1), (i6 + 1) * this.tileSize);
							let i18 = gameModel.vertexAt(k4 * this.tileSize, -this.getTerrainHeight(k4, i6 + 1), (i6 + 1) * this.tileSize);
							let ai5 = new Int32Array([i11, k13, l15, i18]);
							let l20 = gameModel.createFace(4, ai5, k8, World.colourTransparent);
							this.localX[l20] = k4;
							this.localY[l20] = i6;
							gameModel.faceTag[l20] = 0x30d40 + l20;
							this.method402(k4, i6, 0, k8, k8);
						}

						if (this.getOverlayID(k4 - 1, i6, plane) > 0 && GameData.overlays[this.getOverlayID(k4 - 1, i6, plane) - 1] === 4) {
							let l8 = GameData.tileDecoration[this.getOverlayID(k4 - 1, i6, plane) - 1];
							let j11 = gameModel.vertexAt(k4 * this.tileSize, -this.getTerrainHeight(k4, i6), i6 * this.tileSize);
							let l13 = gameModel.vertexAt((k4 + 1) * this.tileSize, -this.getTerrainHeight(k4 + 1, i6), i6 * this.tileSize);
							let i16 = gameModel.vertexAt((k4 + 1) * this.tileSize, -this.getTerrainHeight(k4 + 1, i6 + 1), (i6 + 1) * this.tileSize);
							let j18 = gameModel.vertexAt(k4 * this.tileSize, -this.getTerrainHeight(k4, i6 + 1), (i6 + 1) * this.tileSize);
							let ai6 = new Int32Array([j11, l13, i16, j18]);
							let i21 = gameModel.createFace(4, ai6, l8, World.colourTransparent);
							this.localX[i21] = k4;
							this.localY[i21] = i6;
							gameModel.faceTag[i21] = 0x30d40 + i21;
							this.method402(k4, i6, 0, l8, l8);
						}
					}
				}
			}

			gameModel.createGouraudLightSource(true, 40, 48, -50, -10, -50);
			this.terrainModels = this.parentModel.split(0, 0, 1536, 1536, 8, 64, 233, false);

			for (let j6 = 0; j6 < 64; j6++) {
				this.scene.addModel(this.terrainModels[j6]);
			}

			for (let X = 0; X < this.regionWidth; X++) {
				for (let Y = 0; Y < this.regionHeight; Y++) {
					this.terrainHeightLocal.set(X, Y, this.getTerrainHeight(X, Y));
				}
			}
		}

		this.parentModel.clear();
		let k1 = 0x606060;

		for (let i2 = 0; i2 < 95; i2++) {
			for (let k2 = 0; k2 < 95; k2++) {
				let k3 = this.getWallEastWest(i2, k2);

				// bits 1 and 4 are for vertical walls
				if (k3 > 0 && (GameData.wallObjectInvisible[k3 - 1] === 0 || this.aBoolean592)) {
					this.method422(this.parentModel, k3 - 1, i2, k2, i2 + 1, k2);

					if (flag && GameData.wallObjectAdjacent[k3 - 1] !== 0) {
						const adjacency = this.objectAdjacency.get(i2, k2);
						this.objectAdjacency.set(i2, k2, adjacency | 1);

						if (k2 > 0) {
							this._setObjectAdjacency_from3(i2, k2 - 1, 4);
						}
					}

					if (flag) {
						this.surface.drawLineHoriz(i2 * 3, k2 * 3, 3, k1);
					}
				}

				k3 = this.getWallNorthSouth(i2, k2);

				// bits 2 and 8 are for horizontal walls
				if (k3 > 0 && (GameData.wallObjectInvisible[k3 - 1] === 0 || this.aBoolean592)) {
					this.method422(this.parentModel, k3 - 1, i2, k2, i2, k2 + 1);

					if (flag && GameData.wallObjectAdjacent[k3 - 1] !== 0) {
						const adjacency = this.objectAdjacency.get(i2, k2);
						this.objectAdjacency.set(i2, k2, adjacency | 2);

						if (i2 > 0) {
							this._setObjectAdjacency_from3(i2 - 1, k2, 8); 
						}
					}

					if (flag) {
						this.surface.drawLineVert(i2 * 3, k2 * 3, 3, k1);
					}
				}
				// bits 16 and 32 are for diag walls

				k3 = this.getWallDiagonal(i2, k2);

				if (k3 > 0 && k3 < 12000 && (GameData.wallObjectInvisible[k3 - 1] === 0 || this.aBoolean592)) {
					this.method422(this.parentModel, k3 - 1, i2, k2, i2 + 1, k2 + 1);

					if (flag && GameData.wallObjectAdjacent[k3 - 1] !== 0) { 
						const adjacency = this.objectAdjacency.get(i2, k2);
						this.objectAdjacency.set(i2, k2, adjacency | 0x20);
					}

					if (flag) {
						this.surface.setPixel(i2 * 3, k2 * 3, k1);
						this.surface.setPixel(i2 * 3 + 1, k2 * 3 + 1, k1);
						this.surface.setPixel(i2 * 3 + 2, k2 * 3 + 2, k1);
					}
				}

				if (k3 > 12000 && k3 < 24000 && (GameData.wallObjectInvisible[k3 - 12001] === 0 || this.aBoolean592)) {
					this.method422(this.parentModel, k3 - 12001, i2 + 1, k2, i2, k2 + 1);

					if (flag && GameData.wallObjectAdjacent[k3 - 12001] !== 0) {
						const adjacency = this.objectAdjacency.get(i2, k2);
						this.objectAdjacency.set(i2, k2, adjacency | 0x10);
					}

					if (flag) {
						this.surface.setPixel(i2 * 3 + 2, k2 * 3, k1);
						this.surface.setPixel(i2 * 3 + 1, k2 * 3 + 1, k1);
						this.surface.setPixel(i2 * 3, k2 * 3 + 2, k1);
					}
				}
			}
		}

		if (flag) {
			this.surface.drawSpriteMinimap(this.baseMediaSprite - 1, 0, 0, 285, 285);
		}

		this.parentModel.createGouraudLightSource(false, 60, 24, -50, -10, -50);

		this.wallModels[plane] = this.parentModel.split(0, 0, 1536, 1536, 8, 64, 338, true);

		for (let l2 = 0; l2 < 64; l2++) {
			this.scene.addModel(this.wallModels[plane][l2]);
		}

		for (let l3 = 0; l3 < 95; l3++) {
			for (let l4 = 0; l4 < 95; l4++) {
				let k6 = this.getWallEastWest(l3, l4);

				if (k6 > 0) {
					this.method428(k6 - 1, l3, l4, l3 + 1, l4);
				}

				k6 = this.getWallNorthSouth(l3, l4);

				if (k6 > 0) {
					this.method428(k6 - 1, l3, l4, l3, l4 + 1);
				}

				k6 = this.getWallDiagonal(l3, l4);

				if (k6 > 0 && k6 < 12000) {
					this.method428(k6 - 1, l3, l4, l3 + 1, l4 + 1);
				}

				if (k6 > 12000 && k6 < 24000) {
					this.method428(k6 - 12001, l3 + 1, l4, l3, l4 + 1);
				}
			}
		}

		for (let i5 = 1; i5 < 95; i5++) {
			for (let l6 = 1; l6 < 95; l6++) {
				let j9 = this.getWallRoof(i5, l6);

				if (j9 > 0) {
					let l11 = i5;
					let i14 = l6;
					let j16 = i5 + 1;
					let k18 = l6;
					let j19 = i5 + 1;
					let j21 = l6 + 1;
					let l22 = i5;
					let j23 = l6 + 1;
					let l23 = 0;
					let j24 = this.terrainHeightLocal.get(l11, i14);
					let l24 = this.terrainHeightLocal.get(j16, k18);
					let j25 = this.terrainHeightLocal.get(j19, j21);
					let l25 = this.terrainHeightLocal.get(l22, j23);

					if (j24 > 80000) {
						j24 -= 80000;
					}

					if (l24 > 80000) {
						l24 -= 80000;
					}

					if (j25 > 80000) {
						j25 -= 80000;
					}

					if (l25 > 80000) {
						l25 -= 80000;
					}

					if (j24 > l23) {
						l23 = j24;
					}

					if (l24 > l23) {
						l23 = l24;
					}

					if (j25 > l23) {
						l23 = j25;
					}

					if (l25 > l23) {
						l23 = l25;
					}

					if (l23 >= 80000) {
						l23 -= 80000;
					}

					if (j24 < 80000) {
						this.terrainHeightLocal.set(l11, i14, l23);
					} else {
						const height = this.terrainHeightLocal.get(l11, i14);
						this.terrainHeightLocal.set(l11, i14, height - 80000);
					}

					if (l24 < 80000) {
						this.terrainHeightLocal.set(j16, k18, l23);
					} else {
						const height = this.terrainHeightLocal.get(j16, k18);
						this.terrainHeightLocal.set(j16, k18, height - 80000);
					}

					if (j25 < 80000) {
						this.terrainHeightLocal.set(j19, j21, l23);
					} else {
						const height = this.terrainHeightLocal.get(j19, j21);
						this.terrainHeightLocal.set(j19, j21, height - 80000);
					}

					if (l25 < 80000) {
						this.terrainHeightLocal.set(l22, j23, l23);
					} else {
						const height = this.terrainHeightLocal.get(l22, j23);
						this.terrainHeightLocal.set(l22, j23, height - 80000);
					}
				}
			}
		}

		this.parentModel.clear();

		for (let i7 = 1; i7 < 95; i7++) {
			for (let k9 = 1; k9 < 95; k9++) {
				let roofNvs = this.getWallRoof(i7, k9);

				if (roofNvs > 0) {
					let j14 = i7;
					let k16 = k9;
					let l18 = i7 + 1;
					let k19 = k9;
					let k21 = i7 + 1;
					let i23 = k9 + 1;
					let k23 = i7;
					let i24 = k9 + 1;
					let k24 = i7 * this.tileSize;
					let i25 = k9 * this.tileSize;
					let k25 = k24 + this.tileSize;
					let i26 = i25 + this.tileSize;
					let j26 = k24;
					let k26 = i25;
					let l26 = k25;
					let i27 = i26;
					let j27 = this.terrainHeightLocal.get(j14, k16);
					let k27 = this.terrainHeightLocal.get(l18, k19);
					let l27 = this.terrainHeightLocal.get(k21, i23);
					let i28 = this.terrainHeightLocal.get(k23, i24);
					let unknown = GameData.roofHeight[roofNvs - 1];

					if (this.hasRoof(j14, k16) && j27 < 80000) {
						j27 += unknown + 80000;
						this.terrainHeightLocal.set(j14, k16, j27);
					}

					if (this.hasRoof(l18, k19) && k27 < 80000) {
						k27 += unknown + 80000;
						this.terrainHeightLocal.set(l18, k19, k27);
					}

					if (this.hasRoof(k21, i23) && l27 < 80000) {
						l27 += unknown + 80000;
						this.terrainHeightLocal.set(k21, i23, l27);
					}

					if (this.hasRoof(k23, i24) && i28 < 80000) {
						i28 += unknown + 80000;
						this.terrainHeightLocal.set(k23, i24, i28);
					}

					if (j27 >= 80000) {
						j27 -= 80000;
					}

					if (k27 >= 80000) {
						k27 -= 80000;
					}

					if (l27 >= 80000) {
						l27 -= 80000;
					}

					if (i28 >= 80000) {
						i28 -= 80000;
					}

					let byte0 = 16;

					if (!this.roofsLeadTo(j14 - 1, k16)) {
						k24 -= byte0;
					}

					if (!this.roofsLeadTo(j14 + 1, k16)) {
						k24 += byte0;
					}

					if (!this.roofsLeadTo(j14, k16 - 1)) {
						i25 -= byte0;
					}

					if (!this.roofsLeadTo(j14, k16 + 1)) {
						i25 += byte0;
					}

					if (!this.roofsLeadTo(l18 - 1, k19)) {
						k25 -= byte0;
					}

					if (!this.roofsLeadTo(l18 + 1, k19)) {
						k25 += byte0;
					}

					if (!this.roofsLeadTo(l18, k19 - 1)) {
						k26 -= byte0;
					}

					if (!this.roofsLeadTo(l18, k19 + 1)) {
						k26 += byte0;
					}

					if (!this.roofsLeadTo(k21 - 1, i23)) {
						l26 -= byte0;
					}

					if (!this.roofsLeadTo(k21 + 1, i23)) {
						l26 += byte0;
					}

					if (!this.roofsLeadTo(k21, i23 - 1)) {
						i26 -= byte0;
					}

					if (!this.roofsLeadTo(k21, i23 + 1)) {
						i26 += byte0;
					}

					if (!this.roofsLeadTo(k23 - 1, i24)) {
						j26 -= byte0;
					}

					if (!this.roofsLeadTo(k23 + 1, i24)) {
						j26 += byte0;
					}

					if (!this.roofsLeadTo(k23, i24 - 1)) {
						i27 -= byte0;
					}

					if (!this.roofsLeadTo(k23, i24 + 1)) {
						i27 += byte0;
					}

					roofNvs = GameData.roofNumVertices[roofNvs - 1];
					j27 = -j27;
					k27 = -k27;
					l27 = -l27;
					i28 = -i28;

					if (this.getWallDiagonal(i7, k9) > 12000 && this.getWallDiagonal(i7, k9) < 24000 && this.getWallRoof(i7 - 1, k9 - 1) === 0) {
						let ai8 = new Int32Array(3);
						ai8[0] = this.parentModel.vertexAt(l26, l27, i26);
						ai8[1] = this.parentModel.vertexAt(j26, i28, i27);
						ai8[2] = this.parentModel.vertexAt(k25, k27, k26);

						this.parentModel.createFace(3, ai8, roofNvs, World.colourTransparent);
					} else if (this.getWallDiagonal(i7, k9) > 12000 && this.getWallDiagonal(i7, k9) < 24000 && this.getWallRoof(i7 + 1, k9 + 1) === 0) {
						let ai9 = new Int32Array(3);
						ai9[0] = this.parentModel.vertexAt(k24, j27, i25);
						ai9[1] = this.parentModel.vertexAt(k25, k27, k26);
						ai9[2] = this.parentModel.vertexAt(j26, i28, i27);

						this.parentModel.createFace(3, ai9, roofNvs, World.colourTransparent);
					} else if (this.getWallDiagonal(i7, k9) > 0 && this.getWallDiagonal(i7, k9) < 12000 && this.getWallRoof(i7 + 1, k9 - 1) === 0) {
						let ai10 = new Int32Array(3);
						ai10[0] = this.parentModel.vertexAt(j26, i28, i27);
						ai10[1] = this.parentModel.vertexAt(k24, j27, i25);
						ai10[2] = this.parentModel.vertexAt(l26, l27, i26);

						this.parentModel.createFace(3, ai10, roofNvs, World.colourTransparent);
					} else if (this.getWallDiagonal(i7, k9) > 0 && this.getWallDiagonal(i7, k9) < 12000 && this.getWallRoof(i7 - 1, k9 + 1) === 0) {
						let ai11 = new Int32Array(3);
						ai11[0] = this.parentModel.vertexAt(k25, k27, k26);
						ai11[1] = this.parentModel.vertexAt(l26, l27, i26);
						ai11[2] = this.parentModel.vertexAt(k24, j27, i25);

						this.parentModel.createFace(3, ai11, roofNvs, World.colourTransparent);
					} else if (j27 === k27 && l27 === i28) {
						let ai12 = new Int32Array(4);
						ai12[0] = this.parentModel.vertexAt(k24, j27, i25);
						ai12[1] = this.parentModel.vertexAt(k25, k27, k26);
						ai12[2] = this.parentModel.vertexAt(l26, l27, i26);
						ai12[3] = this.parentModel.vertexAt(j26, i28, i27);

						this.parentModel.createFace(4, ai12, roofNvs, World.colourTransparent);
					} else if (j27 === i28 && k27 === l27) {
						let ai13 = new Int32Array(4);
						ai13[0] = this.parentModel.vertexAt(j26, i28, i27);
						ai13[1] = this.parentModel.vertexAt(k24, j27, i25);
						ai13[2] = this.parentModel.vertexAt(k25, k27, k26);
						ai13[3] = this.parentModel.vertexAt(l26, l27, i26);

						this.parentModel.createFace(4, ai13, roofNvs, World.colourTransparent);
					} else {
						let flag1 = true;

						if (this.getWallRoof(i7 - 1, k9 - 1) > 0) {
							flag1 = false;
						}

						if (this.getWallRoof(i7 + 1, k9 + 1) > 0) {
							flag1 = false;
						}

						if (!flag1) {
							let ai14 = new Int32Array(3);
							ai14[0] = this.parentModel.vertexAt(k25, k27, k26);
							ai14[1] = this.parentModel.vertexAt(l26, l27, i26);
							ai14[2] = this.parentModel.vertexAt(k24, j27, i25);

							this.parentModel.createFace(3, ai14, roofNvs, World.colourTransparent);

							let ai16 = new Int32Array(3);
							ai16[0] = this.parentModel.vertexAt(j26, i28, i27);
							ai16[1] = this.parentModel.vertexAt(k24, j27, i25);
							ai16[2] = this.parentModel.vertexAt(l26, l27, i26);

							this.parentModel.createFace(3, ai16, roofNvs, World.colourTransparent);
						} else {
							let ai15 = new Int32Array(3);
							ai15[0] = this.parentModel.vertexAt(k24, j27, i25);
							ai15[1] = this.parentModel.vertexAt(k25, k27, k26);
							ai15[2] = this.parentModel.vertexAt(j26, i28, i27);

							this.parentModel.createFace(3, ai15, roofNvs, World.colourTransparent);

							let ai17 = new Int32Array(3);
							ai17[0] = this.parentModel.vertexAt(l26, l27, i26);
							ai17[1] = this.parentModel.vertexAt(j26, i28, i27);
							ai17[2] = this.parentModel.vertexAt(k25, k27, k26);

							this.parentModel.createFace(3, ai17, roofNvs, World.colourTransparent);
						}
					}
				}
			}
		}

		this.parentModel.createGouraudLightSource(true, 50, 50, -50, -10, -50);
		this.roofModels[plane] = this.parentModel.split(0, 0, 1536, 1536, 8, 64, 169, true);

		for (let l9 = 0; l9 < 64; l9++) {
			this.scene.addModel(this.roofModels[plane][l9]);
		}

		if (this.roofModels[plane][0] === null) {
			throw new EvalError('null roof!');
		}

		for (let j12 = 0; j12 < this.regionWidth; j12++) {
			for (let k14 = 0; k14 < this.regionHeight; k14++) {
				if (this.terrainHeightLocal.get(j12, k14) >= 80000) {
					const height = this.terrainHeightLocal.get(j12, k14);
					this.terrainHeightLocal.set(j12, k14, height - 80000);
				}
			}
		}
	}

	_setObjectAdjacency_from3(i, j, k) {
		const adjacency = this.objectAdjacency.get(i, j);
		this.objectAdjacency.set(i, j, adjacency | k);
	}

	getTileType(i, j, k) {
		let l = this.getOverlayID(i, j, k);

		if (l === 0) {
			return -1;
		}

		let i1 = GameData.overlays[l - 1];

		return i1 !== 2 ? 0 : 1;
	}

	addModels(models) {
		for (let x = 0; x < 94; x++) {
			for (let y = 0; y < 94; y++) {
				let diagVal = this.getWallDiagonal(x, y);
				if (diagVal > OBJECT_MAPS_START && diagVal < OBJECT_MAPS_START+12000) {
					let objectID = diagVal - OBJECT_MAPS_START - 1;
					let height = GameData.objectWidth[objectID];
					let width = GameData.objectHeight[objectID];
	
					// dir goes counter-clockwise, 0 = North, 4 = south
					let objectDir = this.getTileDirection(x, y);
					if (objectDir === 0 || objectDir === 4) {
						height = GameData.objectWidth[objectID];
						width = GameData.objectHeight[objectID];
					}

					this.removeObject2(x, y, objectID);

					let gameModel = models[GameData.objectModelIndex[objectID]].copy(false, true, false, false);
					let k1 = (((x + x + height) * this.tileSize) / 2) | 0;
					let i2 = (((y + y + width) * this.tileSize) / 2) | 0;
					gameModel.translate(k1, -this.getElevation(k1, i2), i2);
					gameModel.orient(0, this.getTileDirection(x, y) * 32, 0);
					this.scene.addModel(gameModel);
					gameModel.offsetLightSourceCoords(48, 48, -50, -10, -50);

					if (height > 1 || width > 1) {
						for (let xOff = x; xOff < x + height; xOff++) {
							for (let yOff = y; yOff < y + width; yOff++) {
								if ((xOff > x || yOff > y) && this.getWallDiagonal(xOff, yOff) - (OBJECT_MAPS_START+1) === objectID) {
									let regionX = xOff;
									let regionY = yOff;
									let plane = 0;

									if (regionX >= 48 && regionY < 48) {
										plane = 1;
										regionX -= 48;
									} else if (regionX < 48 && regionY >= 48) {
										plane = 2;
										regionY -= 48;
									} else if (regionX >= 48 && regionY >= 48) {
										plane = 3;
										regionX -= 48;
										regionY -= 48;
									}

									this.wallsDiagonal.set(plane, regionX * 48 + regionY,  0);
								}
							}
						}
					}
				}
			}
		}
	}

	method422(gameModel, i, j, k, l, i1) {
		this.method425(j, k, 40);
		this.method425(l, i1, 40);

		let h = GameData.wallObjectHeight[i];
		let front = GameData.wallObjectTextureFront[i];
		let back = GameData.wallObjectTextureBack[i];
		let i2 = j * this.tileSize;
		let j2 = k * this.tileSize;
		let k2 = l * this.tileSize;
		let l2 = i1 * this.tileSize;
		let i3 = gameModel.vertexAt(i2, -this.terrainHeightLocal.get(j, k), j2);
		let j3 = gameModel.vertexAt(i2, -this.terrainHeightLocal.get(j, k) - h, j2);
		let k3 = gameModel.vertexAt(k2, -this.terrainHeightLocal.get(l, i1) - h, l2);
		let l3 = gameModel.vertexAt(k2, -this.terrainHeightLocal.get(l, i1), l2);
		let ai = new Int32Array([i3, j3, k3, l3]);
		let i4 = gameModel.createFace(4, ai, front, back);

		if (GameData.wallObjectInvisible[i] === 5) {
			gameModel.faceTag[i4] = 30000 + i;
			return;
		}
		gameModel.faceTag[i4] = 0;
	}

	getTerrainHeight(x, y) {
		if (x < 0 || x >= this.regionWidth || y < 0 || y >= this.regionHeight) {
			return 0;
		}

		let h = 0;

		if (x >= 48 && y < 48) {
			h = 1;
			x -= 48;
		} else if (x < 48 && y >= 48) {
			h = 2;
			y -= 48;
		} else if (x >= 48 && y >= 48) {
			h = 3;
			x -= 48;
			y -= 48;
		}

		return (this.terrainHeight.get(h, x * 48 + y) & 0xff) * 3;
	}

	_loadSection_from3(x, y, plane) {
		this.reset();

		let l = ((x + 24) / 48) | 0;
		let i1 = ((y + 24) / 48) | 0;

		this.loadRegionThenMakeModel(x, y, plane, true);

	   	// for ground world level plane, if we want to render entire buildings with roofing
	   	// we have to load up the two regions directly above us on planes 1,2 as well as our own
		if (plane === 0) {
		   	// Note: the last flag in the load calls probably disables all information we don't need?
		   	// idk just a guess
			this.loadRegionThenMakeModel(x, y, 1, false);
			this.loadRegionThenMakeModel(x, y, 2, false);
			this.decodeSector(l - 1, i1 - 1, plane, 0);
			this.decodeSector(l, i1 - 1, plane, 1);
			this.decodeSector(l - 1, i1, plane, 2);
			this.decodeSector(l, i1, plane, 3);
			this.fillEmptySectorsAndBorder();
		}
	}

	method425(i, j, k) {
		let l = (i / 12) | 0;
		let i1 = (j / 12) | 0;
		let j1 = ((i - 1) / 12) | 0;
		let k1 = ((j - 1) / 12) | 0;

		this.setTerrainAmbience(l, i1, i, j, k);

		if (l !== j1) {
			this.setTerrainAmbience(j1, i1, i, j, k);
		}

		if (i1 !== k1) {
			this.setTerrainAmbience(l, k1, i, j, k);
		}

		if (l !== j1 && i1 !== k1) {
			this.setTerrainAmbience(j1, k1, i, j, k);
		}
	}

	removeObject(x, y, id) {
		if (x < 0 || y < 0 || x >= 95 || y >= 95) {
			return;
		}

		if (GameData.objectType[id] === 1 || GameData.objectType[id] === 2) {
			let direction = this.getTileDirection(x, y);
			let height = GameData.objectHeight[id];
			let width = GameData.objectWidth[id];

			if (direction === 0 || direction === 4) {
				height = GameData.objectWidth[id];
				width = GameData.objectHeight[id];
			}

			for (let k1 = x; k1 < x + height; k1++) {
				for (let l1 = y; l1 < y + width; l1++) {
					const adjacency = this.objectAdjacency.get(k1, l1);

					if (GameData.objectType[id] === 1) {
						this.objectAdjacency.set(k1, l1, adjacency & 0b1111111110111111);
					} else if (direction === 0) {
						this.objectAdjacency.set(k1, l1, adjacency & 0b1111111111111101);

						if (k1 > 0) {
							this.method407(k1 - 1, l1, 8);
						}
					} else if (direction === 2) {
						this.objectAdjacency.set(k1, l1, adjacency & 0b1111111111111011);

						if (l1 < 95) {
							this.method407(k1, l1 + 1, 1);
						}
					} else if (direction === 4) {
						this.objectAdjacency.set(k1, l1, adjacency & 0b1111111111110111);

						if (k1 < 95) {
							this.method407(k1 + 1, l1, 2);
						}
					} else if (direction === 6) {
						this.objectAdjacency.set(k1, l1, adjacency & 0b1111111111111110);

						if (l1 > 0) {
							this.method407(k1, l1 - 1, 4);
						}
					}
				}
			}

			this.method404(x, y, height, width);
		}
	}
	
	roofsLeadTo(i, j) {
		return this.getWallRoof(i, j) > 0 || this.getWallRoof(i - 1, j) > 0 || this.getWallRoof(i - 1, j - 1) > 0 || this.getWallRoof(i, j - 1) > 0;
	}
	
	method428(i, j, k, l, i1) {
		let j1 = GameData.wallObjectHeight[i];

		const height = this.terrainHeightLocal.get(j, k);

		if (height < 80000) {
			this.terrainHeightLocal.set(j, k, height + 80000 + j1);
		}

		const height2 = this.terrainHeightLocal.get(l, i1);

		if (height2 < 80000) {
			this.terrainHeightLocal.set(l, i1, height2 + 80000 + j1);
		}
	}
}

World.colourTransparent = 12345678;

export { World as default };

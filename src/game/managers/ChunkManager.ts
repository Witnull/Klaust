// ChunkManager.ts
import Phaser from "phaser";
import { MapGenerator, Room } from "./MapGenerator";
import { CONFIG } from "../config";
import { PlayerData } from "../types/PlayerData";
import { playerDataManager } from "./PlayerDataManager";
import { MapExporter } from "./MapExporter";
import { Player } from "../entities/Player";
import { EntityManager } from "./EntityManager";
import { showToast } from "./ToastManager";

interface ChunkData {
    map: number[][];
    tilemap: Phaser.Tilemaps.Tilemap;
    neighbors: { top?: string; bottom?: string; left?: string; right?: string };
    rooms: Room[];
}

export class ChunkManager {
    private scene: Phaser.Scene;
    private chunks: Map<string, ChunkData> = new Map();
    private fullMapRooms: Map<string, Room[]> = new Map();
    private mapGenerator: MapGenerator;
    private chunkSize: number = 32;
    private chunkBorders: Map<string, Phaser.GameObjects.Rectangle> = new Map();
    private chunkGrids: Map<string, Phaser.GameObjects.Group> = new Map();
    private visibleChunks: Set<string> = new Set();
    private player: Player | null;
    private entityManager: EntityManager;

    public showBorders: boolean = false;
    
    constructor(scene: Phaser.Scene, player: Player) {
        this.scene = scene;
        this.mapGenerator = new MapGenerator(this.chunkSize);
        this.player = player 
    }

    hasChunks(): boolean {
        return this.chunks.size > 0;
    }

    setEntityManager(entityManager: EntityManager) {
        this.entityManager = entityManager;
    }

    initializeSpawnChunk(playerData: PlayerData) {
        const chunkX = 0;
        const chunkY = 0;
        const chunkKey = `${chunkX},${chunkY}`;
        const { map: chunkMap, rooms, chests } = this.mapGenerator.generateChunk(chunkX, chunkY, true);

        this.chunks.set("0,0", {
            map: chunkMap,
            tilemap: this.createTilemap(chunkMap, 0, 0),
            neighbors: {},
            rooms,
        });
        this.fullMapRooms.set(chunkKey, rooms);

        const room0 = rooms[0]
        let startX =room0.centerX, startY = room0.centerY;
        playerDataManager.updatePlayerData({ position: { x: startX, y: startY } });

        // Add grid lines
        const gridGroup = this.scene.add.group();
        for (let x = 0; x < this.chunkSize; x++) {
            const line = this.scene.add
                .rectangle(
                    chunkX * this.chunkSize * 16 + x * 16,
                    chunkY * this.chunkSize * 16 + this.chunkSize * 8,
                    1,
                    this.chunkSize * 16,
                    0x00ff00,
                    0.5
                )
                .setVisible(this.showBorders);
            gridGroup.add(line);
        }

        for (let y = 0; y < this.chunkSize; y++) {
            const line = this.scene.add
                .rectangle(
                    chunkX * this.chunkSize * 16 + this.chunkSize * 8,
                    chunkY * this.chunkSize * 16 + y * 16,
                    this.chunkSize * 16,
                    1,
                    0x00ff00,
                    0.5
                )
                .setVisible(this.showBorders);
            gridGroup.add(line);
        }
        this.chunkGrids.set(chunkKey, gridGroup);



    }

    updateChunks(playerPos: { x: number; y: number }) {
        const chunkX = Math.floor(playerPos.x / this.chunkSize);
        const chunkY = Math.floor(playerPos.y / this.chunkSize);
        const renderDistance = (this.scene.cameras.main.zoom > 1 ? 1 : 2);

        const newVisibleChunks = new Set<string>();
        for (let y = chunkY - renderDistance; y <= chunkY + renderDistance; y++) {
            for (let x = chunkX - renderDistance; x <= chunkX + renderDistance; x++) {
                const key = `${x},${y}`;
                newVisibleChunks.add(key);
                if (!this.chunks.has(key)) this.loadChunk(x, y);
            }
        }

        this.chunks.forEach((_, key) => {
            if (!newVisibleChunks.has(key)) this.unloadChunk(key);
        });
        this.visibleChunks = newVisibleChunks;
    }

    private loadChunk(chunkX: number, chunkY: number) {
        const isSpawnChunk = chunkX === 0 && chunkY === 0;
        const chunkKey = `${chunkX},${chunkY}`;
        const { map, rooms } = this.mapGenerator.generateChunk(chunkX, chunkY, isSpawnChunk);
        const neighbors = {
            top: `${chunkX},${chunkY - 1}`,
            bottom: `${chunkX},${chunkY + 1}`,
            left: `${chunkX - 1},${chunkY}`,
            right: `${chunkX + 1},${chunkY}`,
        };

        const tilemap = this.createTilemap(map, chunkX, chunkY);
        this.chunks.set(chunkKey, { map, tilemap, neighbors, rooms });
        this.fullMapRooms.set(chunkKey, rooms);

        // Connect to adjacent chunks (optimized to 1-2 connections)
        const numberOfConnections = Phaser.Math.Between(2, 6);

        for (let i = 0; i < numberOfConnections; i++) {
            const randomRoom = rooms[Phaser.Math.Between(0, rooms.length - 1)];
            const dir = Phaser.Utils.Array.GetRandom(["top", "bottom", "left", "right"]);
            const adjKey = neighbors[dir as keyof typeof neighbors];
            if (this.fullMapRooms.has(adjKey)) {
                const adjRooms = this.fullMapRooms.get(adjKey)!;
                const adjRandomRoom = Phaser.Utils.Array.GetRandom(adjRooms);

                let intersectX, intersectY, adjIntersectX, adjIntersectY;
                if (dir === "top") {
                    intersectX = Math.round((randomRoom.centerX + adjRandomRoom.centerX) / 2);
                    intersectY = 0;
                    adjIntersectX = intersectX;
                    adjIntersectY = this.chunkSize - 1;
                } else if (dir === "bottom") {
                    intersectX = Math.round((randomRoom.centerX + adjRandomRoom.centerX) / 2);
                    intersectY = this.chunkSize - 1;
                    adjIntersectX = intersectX;
                    adjIntersectY = 0;
                } else if (dir === "left") {
                    intersectX = 0;
                    intersectY = Math.round((randomRoom.centerY + adjRandomRoom.centerY) / 2);
                    adjIntersectX = this.chunkSize - 1;
                    adjIntersectY = intersectY;
                } else { // right
                    intersectX = this.chunkSize - 1;
                    intersectY = Math.round((randomRoom.centerY + adjRandomRoom.centerY) / 2);
                    adjIntersectX = 0;
                    adjIntersectY = intersectY;
                }

                const chunk = this.chunks.get(chunkKey)!;
                chunk.map = this.mapGenerator.carveLShapedPath(chunk.map, randomRoom.centerX, randomRoom.centerY, intersectX, intersectY);
                this.updateTiles(chunkKey, chunk.map, randomRoom.centerX, randomRoom.centerY, intersectX, intersectY);

                const adjChunk = this.chunks.get(adjKey)!;
                adjChunk.map = this.mapGenerator.carveLShapedPath(adjChunk.map, adjRandomRoom.centerX, adjRandomRoom.centerY, adjIntersectX, adjIntersectY);
                this.updateTiles(adjKey, adjChunk.map, adjRandomRoom.centerX, adjRandomRoom.centerY, adjIntersectX, adjIntersectY);
            }
        }

        // Spawn entities for every new chunk
        if(this.entityManager){
            this.entityManager.loadEntities(chunkX, chunkY, isSpawnChunk);
            this.entityManager.initializeChests(chunkX, chunkY); 
        }

     
        const border = this.scene.add
            .rectangle(
                chunkX * this.chunkSize * 16 + this.chunkSize * 8,
                chunkY * this.chunkSize * 16 + this.chunkSize * 8,
                this.chunkSize * 16,
                this.chunkSize * 16,
                0xff0000,
                0
            )
            .setStrokeStyle(2, 0xff0000)
            .setVisible(this.showBorders);
        this.chunkBorders.set(chunkKey, border);

        // Add grid lines
        const gridGroup = this.scene.add.group();
        for (let x = 0; x < this.chunkSize; x++) {
            const line = this.scene.add
                .rectangle(
                    chunkX * this.chunkSize * 16 + x * 16,
                    chunkY * this.chunkSize * 16 + this.chunkSize * 8,
                    1,
                    this.chunkSize * 16,
                    0x00ff00,
                    0.5
                )
                .setVisible(this.showBorders);
            gridGroup.add(line);
        }

        for (let y = 0; y < this.chunkSize; y++) {
            const line = this.scene.add
                .rectangle(
                    chunkX * this.chunkSize * 16 + this.chunkSize * 8,
                    chunkY * this.chunkSize * 16 + y * 16,
                    this.chunkSize * 16,
                    1,
                    0x00ff00,
                    0.5
                )
                .setVisible(this.showBorders);
            gridGroup.add(line);
        }
        this.chunkGrids.set(chunkKey, gridGroup);

        // Ensure player stays above new tilemap
        const playerSprite = (this.scene as any).player?.getSprite(); // Type assertion for simplicity
        if (playerSprite) {
            playerSprite.setDepth(10);
        }
    }



    private unloadChunk(key: string) {
        const chunk = this.chunks.get(key);
        if (chunk) {
            chunk.tilemap.destroy();
            this.chunks.delete(key);
            this.fullMapRooms.delete(key);
        }
        const border = this.chunkBorders.get(key);
        if (border) {
            border.destroy();
            this.chunkBorders.delete(key);
        }
        const grid = this.chunkGrids.get(key);
        if (grid) {
            grid.destroy(true); // Destroy all grid lines
            this.chunkGrids.delete(key);
        }
    }

    private createTilemap(map: number[][], chunkX: number, chunkY: number): Phaser.Tilemaps.Tilemap {
        const tilemap = this.scene.make.tilemap({
            data: map,
            tileWidth: CONFIG.TILE_SIZE,
            tileHeight: CONFIG.TILE_SIZE,
            insertNull: true,
        });
        const tileset = tilemap.addTilesetImage("tiles");
        if (tileset) {
            const layer = tilemap.createLayer(0, tileset, chunkX * this.chunkSize * 16, chunkY * this.chunkSize * 16);
            layer!.setDepth(0);
        }
        return tilemap;
    }

    private updateTiles(chunkKey: string, map: number[][], x1: number, y1: number, x2: number, y2: number) {
        const chunk = this.chunks.get(chunkKey);
        if (!chunk) return;

        const layer = chunk.tilemap.layers[0].tilemapLayer;
        for (let x = Math.min(x1, x2); x <= Math.max(x1, x2); x++) {
            layer.putTileAt(map[y1][x], x, y1);
            layer.putTileAt(map[y1][x], x, y1 + 1);
        }
        for (let y = Math.min(y1, y2); y <= Math.max(y1, y2); y++) {
            layer.putTileAt(map[y][x2], x2, y);
            layer.putTileAt(map[y][x2], x2 + 1, y);
        }
    }

    toggleChunkBorders() {
        this.showBorders = !this.showBorders;
        this.chunkBorders.forEach((border) => border.setVisible(this.showBorders));
        this.chunkGrids.forEach((grid) => grid.getChildren().forEach((line) => (line as Phaser.GameObjects.Rectangle).setVisible(this.showBorders)));
    }

    getMapAt(x: number, y: number): number {
        const chunkX = Math.floor(x / this.chunkSize);
        const chunkY = Math.floor(y / this.chunkSize);
        const localX = ((x % this.chunkSize) + this.chunkSize) % this.chunkSize;
        const localY = ((y % this.chunkSize) + this.chunkSize) % this.chunkSize;
        const chunk = this.chunks.get(`${chunkX},${chunkY}`);
        return chunk?.map[localY]?.[localX] ?? 1; // Default to wall
    }

    exportMap(playerPos: { x: number; y: number }, entities: { enemies: Map<string, any>; chests: Map<string, any> }) {
        // Export logic moved to MapExporter.ts
        const exporter = new MapExporter(this.chunks, this.chunkSize, this.visibleChunks);
        exporter.exportMap(playerPos, entities);
    }
    public getChunkMap(chunkKey: string): number[][] | undefined {
        return this.chunks.get(chunkKey)?.map;
    }
}
// MapExporter.ts
import { saveAs } from "file-saver";

interface ChunkData {
    map: number[][];
    tilemap: Phaser.Tilemaps.Tilemap;
    neighbors: { top?: string; bottom?: string; left?: string; right?: string };
    rooms: any[];
}

export class MapExporter {
    private chunks: Map<string, ChunkData>;
    private chunkSize: number;
    private visibleChunks: Set<string>;

    constructor(chunks: Map<string, ChunkData>, chunkSize: number, visibleChunks: Set<string>) {
        this.chunks = chunks;
        this.chunkSize = chunkSize;
        this.visibleChunks = visibleChunks;
    }

    exportMap(playerPos: { x: number; y: number }, entities: { enemies: Map<string, any>; chests: Map<string, any> }) {
        let minChunkX = Infinity, maxChunkX = -Infinity, minChunkY = Infinity, maxChunkY = -Infinity;
        this.visibleChunks.forEach((key) => {
            const [x, y] = key.split(",").map(Number);
            minChunkX = Math.min(minChunkX, x);
            maxChunkX = Math.max(maxChunkX, x);
            minChunkY = Math.min(minChunkY, y);
            maxChunkY = Math.max(maxChunkY, y);
        });

        // Handle edge case where no chunks are visible
        if (!this.visibleChunks.size) {
            console.warn("No visible chunks to export");
            const emptyMap = "No map data available";
            saveAs(new Blob([emptyMap], { type: "text/plain;charset=utf-8" }), `map_${Date.now()}.txt`);
            return;
        }

        const width = (maxChunkX - minChunkX + 1) * this.chunkSize;
        const height = (maxChunkY - minChunkY + 1) * this.chunkSize;
        const mapExport: string[][] = Array.from({ length: height }, () => Array(width).fill("#"));

        // Only process visible chunks
        this.visibleChunks.forEach((key) => {
            const chunk = this.chunks.get(key);
            if (!chunk) return; // Skip if chunk is somehow missing

            const [chunkX, chunkY] = key.split(",").map(Number);
            const offsetX = (chunkX - minChunkX) * this.chunkSize;
            const offsetY = (chunkY - minChunkY) * this.chunkSize;

            chunk.map.forEach((row, y) => {
                row.forEach((tile, x) => {
                    const exportY = offsetY + y;
                    const exportX = offsetX + x;
                    // Ensure indices are within bounds (defensive check)
                    if (exportY >= 0 && exportY < height && exportX >= 0 && exportX < width) {
                        mapExport[exportY][exportX] = tile === 0 ? "." : "#";
                    }
                });
            });
        });

        const playerX = playerPos.x - minChunkX * this.chunkSize;
        const playerY = playerPos.y - minChunkY * this.chunkSize;
        if (playerX >= 0 && playerX < width && playerY >= 0 && playerY < height) {
            mapExport[playerY][playerX] = "P";
        }

        entities.enemies.forEach((enemy) => {
            const pos = enemy.getPos();
            const enemyX = pos.x - minChunkX * this.chunkSize;
            const enemyY = pos.y - minChunkY * this.chunkSize;
            if (enemyX >= 0 && enemyX < width && enemyY >= 0 && enemyY < height) {
                mapExport[enemyY][enemyX] = "E";
            }
        });

        entities.chests.forEach((chest) => {
            const chestX = Math.floor(chest.x / 16) - minChunkX * this.chunkSize;
            const chestY = Math.floor(chest.y / 16) - minChunkY * this.chunkSize;
            if (chestX >= 0 && chestX < width && chestY >= 0 && chestY < height) {
                mapExport[chestY][chestX] = "@";
            }
        });

        const mapString = mapExport.map((row) => row.join("")).join("\n");
        const blob = new Blob([mapString], { type: "text/plain;charset=utf-8" });
        saveAs(blob, `map_${Date.now()}.txt`);
    }
}
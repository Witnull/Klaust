// GameScene.ts
import Phaser from "phaser";
import { Player } from "../entities/Player";
import { playerDataManager } from "../managers/PlayerDataManager";
import { ChunkManager } from "../managers/ChunkManager";
import { EntityManager } from "../managers/EntityManager";


export class GameScene extends Phaser.Scene {
    private player!: Player;
    private chunkManager: ChunkManager;
    private entityManager: EntityManager;
    private keys!: {
        w: Phaser.Input.Keyboard.Key;
        a: Phaser.Input.Keyboard.Key;
        s: Phaser.Input.Keyboard.Key;
        d: Phaser.Input.Keyboard.Key;
        p: Phaser.Input.Keyboard.Key;
        plus: Phaser.Input.Keyboard.Key;
        minus: Phaser.Input.Keyboard.Key;
        b: Phaser.Input.Keyboard.Key;
    };

    private minRenderDistance: number = 1; // should be devisible by 2
    private maxRenderDistance: number = 8;
    private playerHitbox!: Phaser.GameObjects.Rectangle;

    // Movement timing optimization
    private lastMoveTime: number = 0;
    private moveDelay: number = 160; // Base movement delay
    private diagonalMoveDelay: number = 200; // Slightly longer for diagonal movement

    constructor() {
        super("GameScene");
        this.chunkManager = new ChunkManager(this);
        this.entityManager = new EntityManager(this, this.chunkManager);
        this.chunkManager.setEntityManager(this.entityManager);

    }

    preload() {
        this.load.image("tiles", "/assets/tiles/dungeon_tileset3.png");
        this.load.image("player", "/assets/sprites/player.png");
        this.load.image("enemy", "/assets/sprites/enemy.png");
        this.load.image("chest", "/assets/sprites/chest.png");
        this.load.image('noise', '/assets/tiles/noise.png');
    }

    create() {
        let playerLogicalPos = playerDataManager.getPos(); // initial pos selected in ChunkManager
        if (!this.chunkManager.hasChunks()) { // If no chunks are loaded, initialize spawn chunk
            this.chunkManager.initializeSpawnChunk();

            // Get updated position from PlayerDataManager after chunk initialization
            const playerLogicalPos = playerDataManager.getPos();

            // Convert logical position to sprite position
            const playerSpritePos = this.normPlayerSpritePos(playerLogicalPos);

            // Create player sprite at the sprite position
            this.player = new Player(
                this,
                playerSpritePos.x,
                playerSpritePos.y,
            );

            this.entityManager.initializeChests(0, 0);
            console.log("GameScene: Initial player position set to", playerLogicalPos,
                "Sprite position:", playerSpritePos,
                "Actual sprite pos:", this.player.getSpritePos());

        } else {
            // Convert logical position to sprite position
            const playerSpritePos = this.normPlayerSpritePos(playerLogicalPos);

            // Create player sprite at the sprite position
            this.player = new Player(
                this,
                playerSpritePos.x,
                playerSpritePos.y,
            );

            this.chunkManager.updateChunks(playerLogicalPos);
        }

        this.player.getSprite().setDepth(10);        // Get current sprite position for hitbox and camera
        const currentSpritePos = this.player.getSpritePos();

        // Add player hitbox
        this.playerHitbox = this.add
            .rectangle(
                currentSpritePos.x,
                currentSpritePos.y,
                16,
                16,
                0xffff00,
                0
            )
            .setStrokeStyle(2, 0xffff00)
            .setVisible(false)
            .setDepth(2);

        this.cameras.main.setBounds(-Infinity, -Infinity, Infinity, Infinity);
        this.cameras.main.startFollow(this.player.getSprite(), false, 0.08, 0.08); // Slightly smoother camera follow
        this.cameras.main.centerOn(currentSpritePos.x, currentSpritePos.y);
        this.cameras.main.setZoom(1); this.keys = {
            w: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
            a: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
            s: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
            d: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D),
            p: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.P),
            plus: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.PLUS),
            minus: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.MINUS),
            b: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.B),
        };

        // Sync with PlayerDataManager updates
        playerDataManager.on("playerDataUpdated", () => {
            const playerNewPos = playerDataManager.getPos();
            const normNewPlayerSpritePos = this.normPlayerSpritePos(playerNewPos);
            const currentPlayerSpritePos = this.player.getSpritePos();

            // Check if positions are different using proper comparison
            if (currentPlayerSpritePos.x !== normNewPlayerSpritePos.x ||
                currentPlayerSpritePos.y !== normNewPlayerSpritePos.y) {
                // For external position updates, use standard movement without diagonal timing
                this.player.move(normNewPlayerSpritePos, false);
                this.playerHitbox.setPosition(normNewPlayerSpritePos.x, normNewPlayerSpritePos.y);
            }

            // Only update chunks if needed (this event is not fired for position-only updates anymore)
            this.chunkManager.updateChunks(playerNewPos);
        });

        this.chunkManager.updateChunks(playerLogicalPos);
    }

    update() {
        const currentTime = this.time.now;

        // Use timing-based movement for smoother controls with diagonal support
        const currentDelay = this.keys.w.isDown || this.keys.s.isDown ?
            (this.keys.a.isDown || this.keys.d.isDown ? this.diagonalMoveDelay : this.moveDelay) :
            this.moveDelay;

        if (currentTime - this.lastMoveTime > currentDelay) {
            let dx = 0, dy = 0;

            // Check for horizontal movement
            if (this.keys.a.isDown) dx = -1;
            else if (this.keys.d.isDown) dx = 1;

            // Check for vertical movement
            if (this.keys.w.isDown) dy = -1;
            else if (this.keys.s.isDown) dy = 1;

            // If any movement input is detected, handle the move
            if (dx !== 0 || dy !== 0) {
                this.handleMove(dx, dy);
                this.lastMoveTime = currentTime;
            }
        }

        if (this.keys.p.isDown) this.exportMap();
        else if (Phaser.Input.Keyboard.JustDown(this.keys.plus)) this.adjustZoom(0.1);
        else if (Phaser.Input.Keyboard.JustDown(this.keys.minus)) this.adjustZoom(-0.1);
        else if (Phaser.Input.Keyboard.JustDown(this.keys.b)) {
            this.chunkManager.toggleChunkBorders();
            this.playerHitbox.setVisible(!this.playerHitbox.visible);
            this.entityManager.toggleHitboxes(this.chunkManager.showBorders); // Pass showBorders state
        }
    }


    private normPlayerSpritePos(playerPos: { x: number, y: number }): { x: number, y: number } {
        return {
            x: playerPos.x * 16 + 8,
            y: playerPos.y * 16 + 8
        };
    } private handleMove(dx: number, dy: number) {
        // Get current logical position
        const currentPos = playerDataManager.getPos();

        // Calculate new logical position
        const newLogicalPos = { x: currentPos.x + dx, y: currentPos.y + dy };

        // Check if this is diagonal movement
        const isDiagonal = dx !== 0 && dy !== 0;

        if (isDiagonal) {
            // For diagonal movement, check destination AND both intermediate paths
            const destinationClear = this.chunkManager.getMapAt(newLogicalPos.x, newLogicalPos.y) === 0;
            const horizontalPathClear = this.chunkManager.getMapAt(currentPos.x + dx, currentPos.y) === 0;
            const verticalPathClear = this.chunkManager.getMapAt(currentPos.x, currentPos.y + dy) === 0;

            // Only allow diagonal movement if destination AND both paths are clear
            if (!destinationClear || !horizontalPathClear || !verticalPathClear) {
                return; // Blocked - cannot cut through corners
            }
        } else {
            // For straight movement, just check the destination
            if (this.chunkManager.getMapAt(newLogicalPos.x, newLogicalPos.y) !== 0) {
                return; // Blocked by wall or obstacle
            }
        }

        // Convert logical position to sprite position for visual display
        const newSpritePos = this.normPlayerSpritePos(newLogicalPos);

        // Move the sprite
        this.player.move(newSpritePos, isDiagonal);

        // Update player data silently (without triggering events)
        playerDataManager.updatePlayerDataSilent({ position: newLogicalPos });

        // Only update chunks if we moved to a different chunk
        const currentChunk = {
            x: Math.floor(currentPos.x / 32),
            y: Math.floor(currentPos.y / 32)
        };
        const newChunk = {
            x: Math.floor(newLogicalPos.x / 32),
            y: Math.floor(newLogicalPos.y / 32)
        };

        if (currentChunk.x !== newChunk.x || currentChunk.y !== newChunk.y) {
            this.chunkManager.updateChunks(newLogicalPos);
        }

        // Update hitbox position
        this.playerHitbox.setPosition(newSpritePos.x, newSpritePos.y);

        // Check for interactions at the new position
        this.entityManager.handleInteractions(newLogicalPos);
    }

    private adjustZoom(delta: number) {
        const newZoom = Phaser.Math.Clamp(this.cameras.main.zoom + delta, 2 / this.maxRenderDistance, 2 * this.minRenderDistance);
        this.cameras.main.setZoom(newZoom);
        this.chunkManager.updateChunks(playerDataManager.getPos());
    }

    private exportMap() {
        this.chunkManager.exportMap(playerDataManager.getPos(), this.entityManager.getEntities());
    }
}
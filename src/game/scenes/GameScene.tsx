// GameScene.ts
import Phaser from "phaser";
import { Player } from "../entities/Player";
import { PlayerData } from "../types/GameTypes";
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

    constructor() {
        super("GameScene");
        this.chunkManager = new ChunkManager(this);
        this.entityManager = new EntityManager(this, this.chunkManager);
        this.chunkManager.setEntityManager(this.entityManager);

    }

    preload() {
        this.load.image("tiles", "/assets/tiles/dungeon_tileset.png");
        this.load.image("player", "/assets/sprites/player.png");
        this.load.image("enemy", "/assets/sprites/enemy.png");
        this.load.image("chest", "/assets/sprites/chest.png");
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
        this.cameras.main.startFollow(this.player.getSprite(), false, 0.1, 0.1);
        this.cameras.main.centerOn(currentSpritePos.x, currentSpritePos.y);
        this.cameras.main.setZoom(1);this.keys = {
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
        playerDataManager.on("playerDataUpdated", (updatedData: PlayerData) => {
            //console.log("GameScene: Player data updated", updatedData);
            const playerNewPos = playerDataManager.getPos();
            const normNewPlayerSpritePos = this.normPlayerSpritePos(playerNewPos);
            const currentPlayerSpritePos = this.player.getSpritePos();
            
            // Check if positions are different using proper comparison
            if (currentPlayerSpritePos.x !== normNewPlayerSpritePos.x || 
                currentPlayerSpritePos.y !== normNewPlayerSpritePos.y) {
                this.player.move(normNewPlayerSpritePos);
            }
            
            this.chunkManager.updateChunks(playerNewPos);
            this.playerHitbox.setPosition(normNewPlayerSpritePos.x, normNewPlayerSpritePos.y);
            this.player.getSprite().setDepth(10);
        });

        this.chunkManager.updateChunks(playerLogicalPos);
    }

    update() {

        if (this.keys.w.isDown) this.handleMove(0, -1);
        if (this.keys.s.isDown) this.handleMove(0, 1);
        if (this.keys.a.isDown) this.handleMove(-1, 0);
        if (this.keys.d.isDown) this.handleMove(1, 0);

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
    }    private handleMove(dx: number, dy: number) {
        // Don't allow movement if animation is in progress
        if (this.tweens.getTweensOf(this.player.getSprite()).length > 0) return;
        
        // Get current logical position
        const currentPos = playerDataManager.getPos();
        
        // Calculate new logical position
        const newLogicalPos = { x: currentPos.x + dx, y: currentPos.y + dy };
        
        // Check if the new position is walkable
        // ChunkManager expects tile coordinates, not pixel coordinates
        if (this.chunkManager.getMapAt(newLogicalPos.x, newLogicalPos.y) !== 0) {
            return; // Blocked by wall or obstacle
        }
        
        // Convert logical position to sprite position for visual display
        const newSpritePos = this.normPlayerSpritePos(newLogicalPos);
        
        console.log(`Player moved to: ${JSON.stringify(newLogicalPos)} (sprite pos: ${JSON.stringify(newSpritePos)})`);
        
        // Move the sprite
        this.player.move(newSpritePos);
        
        // Update player data with the new logical position
        playerDataManager.updatePlayerData({ position: newLogicalPos });
        
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
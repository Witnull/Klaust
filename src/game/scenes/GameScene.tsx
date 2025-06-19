// GameScene.ts
import Phaser from "phaser";
import { Player } from "../entities/Player";
import { CONFIG } from "../config";
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
        this.chunkManager = new ChunkManager(this, this.player);
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
        const playerData = playerDataManager.getPlayerData();

        if (!this.chunkManager.hasChunks()) {
            this.chunkManager.initializeSpawnChunk(playerData);
            this.player = new Player(
                this,
                playerData.position.x,
                playerData.position.y,
                playerData,
                this.chunkManager.getMapAt.bind(this.chunkManager)
            );
            this.entityManager.initializeChests(0, 0);
        } else {
            this.player = new Player(
                this,
                playerData.position.x,
                playerData.position.y,
                playerData,
                this.chunkManager.getMapAt.bind(this.chunkManager)
            );
            this.chunkManager.updateChunks(this.player.getPos());
        }

        this.player.getSprite().setDepth(10);

        // Add player hitbox
        this.playerHitbox = this.add
            .rectangle(
                playerData.position.x * 16 + 8,
                playerData.position.y * 16 + 8,
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
        this.cameras.main.centerOn(playerData.position.x * 16, playerData.position.y * 16);
        this.cameras.main.setZoom(1);

        this.keys = {
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
            console.log("GameScene: Player data updated", updatedData);
            this.player.updatePlayerData(updatedData);
            this.chunkManager.updateChunks(this.player.getPos());
            this.playerHitbox.setPosition(updatedData.position.x * 16 + 8, updatedData.position.y * 16 + 8);
            this.player.getSprite().setDepth(10);
        });

        this.chunkManager.updateChunks(this.player.getPos());
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

    private handleMove(dx: number, dy: number) {
        if (this.tweens.getTweensOf(this.player.getSprite()).length > 0) return;

        this.player.move(dx, dy);
        const playerPos = this.player.getPos();
        playerDataManager.updatePlayerData({ position: playerPos });

        this.entityManager.handleInteractions(playerPos);
        this.chunkManager.updateChunks(playerPos);
    }

    private adjustZoom(delta: number) {
        const newZoom = Phaser.Math.Clamp(this.cameras.main.zoom + delta, 2 / this.maxRenderDistance, 2 * this.minRenderDistance);
        this.cameras.main.setZoom(newZoom);
        this.chunkManager.updateChunks(this.player.getPos());
    }

    private exportMap() {
        this.chunkManager.exportMap(this.player.getPos(), this.entityManager.getEntities());
    }
}
// EntityManager.ts
import Phaser from "phaser";
import { Enemy } from "../entities/Enemy";
import { playerDataManager } from "../managers/PlayerDataManager";
import { generateRandomEquipment } from "../utils/GenRandomEquipment";
import {combatEvent} from "../EventBus";
import { ChunkManager } from "./ChunkManager";
import { showToast } from "./ToastManager";
import { EnemyData } from "../types/PlayerData";
import { v4 as uuid4 } from 'uuid';


export class EntityManager {
    private scene: Phaser.Scene;
    private chunkManager: ChunkManager;
    private enemies: Map<string, Enemy> = new Map();
    private chests: Map<string, Phaser.GameObjects.Sprite> = new Map();
    private chunkSize: number = 32;
    private enemyHitboxes: Map<string, Phaser.GameObjects.Rectangle> = new Map();
    private chestHitboxes: Map<string, Phaser.GameObjects.Rectangle> = new Map();
    
    public isCombatActive: boolean = false;

    constructor(scene: Phaser.Scene, chunkManager: ChunkManager) {
        this.scene = scene;
        this.chunkManager = chunkManager;
    }

    initializeChests(chunkX: number, chunkY: number) {
        const chests = this.generateChests(chunkX, chunkY);
        chests.forEach((pos, i) => {
            const globalX = chunkX * this.chunkSize + pos.x;
            const globalY = chunkY * this.chunkSize + pos.y;
            const chest = this.scene.add
                .sprite((globalX + 0.5) * 16, (globalY + 0.5) * 16, "chest")
                .setScale(this.scene.cameras.main.width / (32 * 16));
            this.chests.set(`${chunkX},${chunkY},${i}`, chest);

            const hitbox = this.scene.add
                .rectangle(
                    (globalX + 0.5) * 16,
                    (globalY + 0.5) * 16,
                    16,
                    16,
                    0x00ffff,
                    0
                )
                .setStrokeStyle(2, 0x00ffff)
                .setVisible(false)
                .setDepth(2);
            this.chestHitboxes.set(`${chunkX},${chunkY},${i}`, hitbox);
        });
    }
    loadEntities(chunkX: number, chunkY: number, isSpawnChunk: boolean) {
        if (!isSpawnChunk) {
            const chunkKey = `${chunkX},${chunkY}`;
            const chunk = this.chunkManager["chunks"].get(chunkKey);
            if (!chunk) return;

            for (let i = 0; i < Phaser.Math.Between(1, 2); i++) {
                let globalX, globalY;
                let attempts =0;
                const maxAttempts  =5;
                do {
                    globalX = chunkX * this.chunkSize + Phaser.Math.Between(1, this.chunkSize - 2);
                    globalY = chunkY * this.chunkSize + Phaser.Math.Between(1, this.chunkSize - 2);
                    attempts++;
                    if(attempts >= maxAttempts){
                        break;
                    }
                } while (this.chunkManager.getMapAt(globalX, globalY) !== 0);

                if(this.chunkManager.getMapAt(globalX, globalY) !== 0){
                    continue;
                }

                const enemy = new Enemy(
                    this.scene,
                    globalX,
                    globalY,
                    this.generateRandomEnemy({x:globalX, y:globalY}),
                    this.chunkManager.getMapAt.bind(this.chunkManager)
                );
                
                this.enemies.set(`${chunkX},${chunkY},${i}`, enemy);

                const hitbox = this.scene.add
                    .rectangle(
                        globalX * 16 + 8,
                        globalY * 16 + 8,
                        16,
                        16,
                        0xff00ff,
                        0
                    )
                    .setStrokeStyle(2, 0xff00ff)
                    .setVisible(false)
                    .setDepth(2);
                this.enemyHitboxes.set(`${chunkX},${chunkY},${i}`, hitbox);
            }
        }
    }

    handleInteractions(playerPos: { x: number; y: number }) {
        this.enemies.forEach((enemy, key) => {
            const enemyPos = enemy.getPos();
            enemy.moveTowardPlayer(playerDataManager.getPlayerData());
            const hitbox = this.enemyHitboxes.get(key);
            if (hitbox) {
                hitbox.setPosition(enemyPos.x * 16 +8, enemyPos.y * 16 +8);
            }
            if (playerPos.x === enemyPos.x && playerPos.y === enemyPos.y) {
                this.scene.scene.pause("GameScene");
                this.scene.scene.launch("CombatScene", {
                    player: playerDataManager.getPlayerData(),
                    enemyData: enemy.getEnemyData(),
                });

                const handleCombatEnd = ({ result }: { result: "victory" | "defeat" | "fled" }) => {
                    console.log(`GameScene: combatEnd received with result: ${result}`);
                    if (result === "victory") {
                        enemy.destroy();
                        this.enemies.delete(key);
                        const hitbox = this.enemyHitboxes.get(key);
                        if (hitbox) {
                            hitbox.destroy();
                            this.enemyHitboxes.delete(key);
                        }
                    }
                    this.scene.scene.resume("GameScene");
                    this.scene.scene.stop("CombatScene"); // Redundant but safe
                    this.isCombatActive = false;
                    combatEvent.off("combatEnd", handleCombatEnd); // Use combatEvent
                };

                combatEvent.off("combatEnd", handleCombatEnd);
                combatEvent.on("combatEnd", handleCombatEnd);
            }
        });

        this.chests.forEach((chest, key) => {
            if (
                Math.abs(chest.x / 16 - playerPos.x) <= 1 &&
                Math.abs(chest.y / 16 - playerPos.y) <= 1
            ) {
                this.openChest(chest, key);
            }
        });
    }
   private generateRandomEnemy(position : {x:number , y:number}): EnemyData{
        const plrLvl = playerDataManager.getPlayerData().level
        const level = Math.max( 1 , Math.floor(Phaser.Math.Between(plrLvl, plrLvl + 5*Math.floor(plrLvl/2) +5 )/2)) ;
        const enemyData: EnemyData = {
            id: uuid4(),
            position: position,
            name: "Enemy",
            level: level,
            coins: Math.floor(Phaser.Math.Between(10, 20) *level/2), // Adjust as needed
            stats: {
                maxhp: Phaser.Math.Between(10, 50) *level,
                hp : 1,
                maxmana: Phaser.Math.Between(0, 30*level) ,
                mana: 1,
                attack: Phaser.Math.Between(1, 3 * level),
                defense: Phaser.Math.Between(0, 5 * level) ,
                speed: Phaser.Math.Between(3, 25 * level/2) ,
                magic: Phaser.Math.Between(0, 10 * level ) ,
            },
        };
        enemyData.stats.hp = enemyData.stats.maxhp;
        enemyData.stats.mana = enemyData.stats.maxmana;
        return enemyData;
   }
   private generateChests(chunkX: number, chunkY: number): { x: number; y: number }[] {
        const chunkKey = `${chunkX},${chunkY}`;
        const chunk = this.chunkManager["chunks"].get(chunkKey); // Access chunks directly
        if (!chunk) return [];

        const chestPositions: { x: number; y: number }[] = [];
        const numChests = Phaser.Math.Between(1, 2); // Adjust as needed
        for (let i = 0; i < numChests; i++) {
            let x, y;
            let attempt = 0;
            const maxAttempts = 5;
            do {
                x = Phaser.Math.Between(1, this.chunkSize - 2);
                y = Phaser.Math.Between(1, this.chunkSize - 2);
                attempt++;
                if (attempt >= maxAttempts) break;

            } while (chunk.map[y][x] !== 0); // Ensure floor tile
            if (chunk.map[y][x] !== 0) {
                continue;
            }
            chestPositions.push({ x, y });
        }
        return chestPositions;
    }

    private openChest(chest: Phaser.GameObjects.Sprite, key: string) {
        const currentData = playerDataManager.getPlayerData();
        const rewardCoins = Phaser.Math.Between(15, 30);
        const coins = currentData.coins + rewardCoins;
        const itemChance = Math.random();
        const rewardEquipmentName:string[] =[] ;
        const inventory = [...currentData.inventory];
        const numberOfItems = Phaser.Math.Between(0, 3);
        
        if (itemChance < 0.5) {
            for (let i = 0; i < numberOfItems; i++) {
                const equipment = generateRandomEquipment({ level: currentData.level });
                console.log("Generated equipment:", equipment);
                rewardEquipmentName.push(equipment.name);
                inventory.push(equipment);
            }
           currentData.inventory = inventory;
        }
        chest.destroy();
        this.chests.delete(key);
        const hitbox = this.chestHitboxes.get(key);
        if (hitbox) {
            hitbox.destroy();
            this.chestHitboxes.delete(key);
        }
        showToast.congrats("Collected treasure!", `+${rewardCoins} coins${rewardEquipmentName.length > 0 ? ", " + rewardEquipmentName.join(", ") : ""}`);
        playerDataManager.updatePlayerData({ coins, inventory });
        
    }

    toggleHitboxes(showBorders: boolean) {
        this.enemyHitboxes.forEach((hitbox) => hitbox.setVisible(showBorders));
        this.chestHitboxes.forEach((hitbox) => hitbox.setVisible(showBorders));
    }

    getEntities() {
        return { enemies: this.enemies, chests: this.chests };
    }
}
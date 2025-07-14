// EntityManager.ts
import Phaser from "phaser";
import { Enemy } from "../entities/Enemy";
import { playerDataManager } from "../managers/PlayerDataManager";
import { generateRandomEquipment } from "../utils/GenRandomItem";
import { combatEvent } from '../EventBus';
import { ChunkManager } from "./ChunkManager";
import { showToast } from "./ToastManager";
import { EnemyData } from "../types/GameTypes";
import { v4 as uuid4 } from 'uuid';
import { generateEnemySkills, generateRandomSkill } from "../utils/GenRandomSkill";

export class EntityManager {
    private gameScene: Phaser.Scene;
    private chunkManager: ChunkManager;
    private enemies: Map<string, Enemy> = new Map();
    private chests: Map<string, Phaser.GameObjects.Sprite> = new Map();
    private chunkSize: number = 32;
    private enemyHitboxes: Map<string, Phaser.GameObjects.Rectangle> = new Map();
    private chestHitboxes: Map<string, Phaser.GameObjects.Rectangle> = new Map();

    public isCombatActive: boolean = false;

    constructor(gameScene: Phaser.Scene, chunkManager: ChunkManager) {
        this.gameScene = gameScene;
        this.chunkManager = chunkManager;
    }

    initializeChests(chunkX: number, chunkY: number) {
        const chests = this.generateChests(chunkX, chunkY);
        chests.forEach((pos, i) => {
            const globalX = chunkX * this.chunkSize + pos.x;
            const globalY = chunkY * this.chunkSize + pos.y;
            const spriteX = (globalX + 0.5) * 16;
            const spriteY = (globalY + 0.5) * 16;
            const chest = this.gameScene.add
                .sprite(spriteX, spriteY, "chest")
                .setScale(this.gameScene.cameras.main.width / (32 * 16));
            this.chests.set(`${chunkX},${chunkY},${i}`, chest);

            const hitbox = this.gameScene.add
                .rectangle(
                    spriteX,
                    spriteY,
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
            const chunk = this.chunkManager["chunks"].get(chunkKey); // Access chunks directly
            if (!chunk) return; // If chunk does not exist, return early

            for (let i = 0; i < Phaser.Math.Between(1, 2); i++) {
                let globalX, globalY;
                let attempts = 0;
                const maxAttempts = 5;
                do {
                    globalX = chunkX * this.chunkSize + Phaser.Math.Between(1, this.chunkSize - 2);
                    globalY = chunkY * this.chunkSize + Phaser.Math.Between(1, this.chunkSize - 2);
                    attempts++;
                    if (attempts >= maxAttempts) {
                        break;
                    }
                } while (this.getMapAtWithEnemyCollision(globalX, globalY) !== 0);

                if (this.getMapAtWithEnemyCollision(globalX, globalY) !== 0) {
                    continue;
                }

                const enemy = new Enemy(
                    this.gameScene,
                    globalX,
                    globalY,
                    this.generateRandomEnemy({ x: globalX, y: globalY }),
                    (x: number, y: number) => this.getMapAtWithEnemyCollision(x, y)
                );

                this.enemies.set(`${chunkX},${chunkY},${i}`, enemy);

                const hitbox = this.gameScene.add
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
        // Don't process enemy interactions if combat is already active
        if (this.isCombatActive) return;

        this.enemies.forEach((enemy, key) => {
            const enemyPos = enemy.getPos();
            const playerPos = playerDataManager.getPos();
            enemy.moveTowardPlayer(playerPos);
            const hitbox = this.enemyHitboxes.get(key);
            if (hitbox) {
                hitbox.setPosition(enemyPos.x * 16 + 8, enemyPos.y * 16 + 8);
            }
            if (playerPos.x === enemyPos.x && playerPos.y === enemyPos.y && !this.isCombatActive) {
                this.isCombatActive = true; // Set combat active immediately
                this.gameScene.scene.pause("GameScene");
                this.gameScene.scene.launch("CombatScene", {
                    player: playerDataManager.getPlayerData(),
                    enemyData: enemy.getEnemyData(),
                });

                const handleCombatEnd = ({ result, penaltyMessage }: { result: "victory" | "defeat" | "fled", penaltyMessage?: string }) => {
                    console.log(`GameScene: combatEnd received with result: ${result}`);

                    // Always reset combat state first
                    this.isCombatActive = false;

                    if (result === "victory") {
                        enemy.destroy();
                        this.enemies.delete(key);
                        const hitbox = this.enemyHitboxes.get(key);
                        if (hitbox) {
                            hitbox.destroy();
                            this.enemyHitboxes.delete(key);
                        }
                    } else if (result === "defeat") {
                        // Show death penalty message if provided
                        if (penaltyMessage) {
                            showToast.error("Defeated!", 5000);
                            // Add a second toast for the penalty details
                            setTimeout(() => showToast.error(penaltyMessage, 7000), 500);
                        } else {
                            showToast.error("Defeated!", 3000);
                        }
                        // Move player away from enemy after a short delay to ensure proper positioning
                        setTimeout(() => {
                            this.movePlayerAwayFromEnemy(enemyPos);
                        }, 100);
                    } else if (result === "fled") {
                        // When player flees, teleport them away from the enemy
                        setTimeout(() => {
                            this.movePlayerAwayFromEnemy(enemyPos);
                        }, 100);
                    }

                    this.gameScene.scene.resume("GameScene");
                    this.gameScene.scene.stop("CombatScene"); // Redundant but safe
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
    private generateRandomEnemy(position: { x: number, y: number }): EnemyData {
        const plrLvl = playerDataManager.getPlayerData().level
        const level = Math.max(1, Math.floor(Phaser.Math.Between(plrLvl, plrLvl + 5 * Math.floor(plrLvl / 2) + 5) / 2));
        const enemyData: EnemyData = {
            id: uuid4(),
            position: position,
            name: "Enemy",
            level: level,
            coins: Math.floor(Phaser.Math.Between(10, 20) * level / 2), // Adjust as needed
            stats: {
                max_hp: Phaser.Math.Between(10, 50) * level,
                hp: 1,
                max_mana: Phaser.Math.Between(0, 30 * level),
                mana: 1,
                attack: Phaser.Math.Between(1, 3 * level),
                defense: Phaser.Math.Between(0, 5 * level),
                speed: Phaser.Math.Between(3, 25 * level / 2),
                magic: Phaser.Math.Between(0, 10 * level),
                crit_chance: Phaser.Math.Between(0, 0.5 * level / 2),
                crit_damage: Phaser.Math.Between(0, 2 * level),
            },
            // Generate random skills for the enemy
            skills: generateEnemySkills(level),
        };
        enemyData.stats.hp = enemyData.stats.max_hp;
        enemyData.stats.mana = enemyData.stats.max_mana;
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

            } while (chunk?.map[y][x] !== 0); // Ensure floor tile
            if (chunk?.map[y][x] !== 0) {
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
        const skillChance = Math.random();
        const rewardEquipmentName: string[] = [];
        const rewardSkillName: string[] = [];
        const inventory = [...currentData.inventory];
        const skills = [...(currentData.skills || [])];
        const numberOfItems = Phaser.Math.Between(0, 3);

        // 50% chance to find equipment items
        if (itemChance < 0.5) {
            for (let i = 0; i < numberOfItems; i++) {
                if (!playerDataManager.hasInventorySpace()) {
                    showToast.error("Inventory full! You cannot collect more items");
                    return;
                }
                const equipment = generateRandomEquipment({ level: currentData.level });
                console.log("Generated equipment:", equipment);
                rewardEquipmentName.push(equipment.name);
                inventory.push(equipment);
            }
        }

        // 25% chance to find a skill
        if (skillChance < 0.25) {
            const newSkill = generateRandomSkill({ level: currentData.level });
            console.log("Generated skill:", newSkill);
            rewardSkillName.push(newSkill.name);
            skills.push(newSkill);
        }

        chest.destroy();
        this.chests.delete(key);
        const hitbox = this.chestHitboxes.get(key);
        if (hitbox) {
            hitbox.destroy();
            this.chestHitboxes.delete(key);
        }

        // Create toast message for all rewards
        let rewardMessage = "";
        if (rewardCoins > 0) {
            rewardMessage += `+${rewardCoins} coins`;
        }
        if (rewardEquipmentName.length > 0) {
            rewardMessage += rewardMessage ? ", " : "";
            rewardMessage += rewardEquipmentName.join(", ");
        }
        if (rewardSkillName.length > 0) {
            rewardMessage += rewardMessage ? ", " : "";
            rewardMessage += "Skill: " + rewardSkillName.join(", ");
        }

        showToast.congrats("Collected treasure!", rewardMessage);

        // Update player data with all rewards
        playerDataManager.updatePlayerData({
            coins,
            inventory,
            skills
        });
    }

    // Move the player to a safe location away from the enemy after fleeing
    private movePlayerAwayFromEnemy(enemyPos: { x: number, y: number }) {
        // Try to move player 3-5 tiles away from enemy in a random direction
        const distance = Math.floor(Math.random() * 3) + 3; // 3-5 tiles
        const directions = [
            { dx: 0, dy: -1 },  // North
            { dx: 1, dy: -1 },  // Northeast
            { dx: 1, dy: 0 },   // East
            { dx: 1, dy: 1 },   // Southeast
            { dx: 0, dy: 1 },   // South
            { dx: -1, dy: 1 },  // Southwest
            { dx: -1, dy: 0 },  // West
            { dx: -1, dy: -1 }  // Northwest
        ];

        // Shuffle directions for better randomness
        const shuffledDirections = [...directions].sort(() => Math.random() - 0.5);

        // Try each direction until we find a valid position
        for (const dir of shuffledDirections) {
            const dX = (dir.dx * distance);
            const dY = (dir.dy * distance);
            const newX = enemyPos.x + dX;
            const newY = enemyPos.y + dY;

            // Check if the new position is valid (not a wall or occupied)
            if (this.chunkManager.getMapAt(newX, newY) === 0) { // 0 == ok
                // Update player position (using full update since this is a significant game event)
                playerDataManager.updatePlayerData({ position: { x: newX, y: newY } });
                // Show a message to the player
                showToast.congrats("Escaped!", "You fled to safety");
                return;
            }
        }

        // If all directions failed, try a simpler approach: just move away in a random valid direction
        for (let i = 0; i < 10; i++) { // Try up to 10 times
            const randomDir = directions[Math.floor(Math.random() * directions.length)];
            const dX = (randomDir.dx * (6 + i)); // At least 6 tiles away
            const dY = (randomDir.dy * (6 + i));
            const newX = enemyPos.x + dX;
            const newY = enemyPos.y + dY;

            if (this.chunkManager.getMapAt(newX, newY) === 0) { // 0 == ok
                playerDataManager.updatePlayerData({ position: { x: newX, y: newY } });
                showToast.congrats("Escaped!", "You fled to safety");
                return;
            }
        }

        // If all else fails, simply notify the player
        showToast.congrats("Failed to escape!", "You couldn't escape!");
    }

    toggleHitboxes(showBorders: boolean) {
        this.enemyHitboxes.forEach((hitbox) => hitbox.setVisible(showBorders));
        this.chestHitboxes.forEach((hitbox) => hitbox.setVisible(showBorders));
    }

    getEntities() {
        return { enemies: this.enemies, chests: this.chests };
    }

    // Check map collision including enemy positions to prevent enemies from stacking
    private getMapAtWithEnemyCollision(x: number, y: number): number {
        // First check if it's a wall
        const mapTile = this.chunkManager.getMapAt(x, y);
        if (mapTile !== 0) return mapTile; // Wall or obstacle

        // Then check if any enemy is already at this position
        for (const [, enemy] of this.enemies) {
            const enemyPos = enemy.getPos();
            if (enemyPos.x === x && enemyPos.y === y) {
                return 1; // Treat enemy position as blocked
            }
        }

        return 0; // Position is free
    }

}
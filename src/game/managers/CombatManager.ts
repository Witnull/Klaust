import Phaser from "phaser";
import { EnemyData, PlayerData, Stats } from "../types/PlayerData";
import { combatEvent } from "../EventBus";
import { generateRandomEquipment } from "../utils/GenRandomEquipment";
import { playerDataManager } from "./PlayerDataManager";
import { showToast } from "./ToastManager";

export class CombatManager {
    private player: PlayerData;
    private enemyData: EnemyData;
    private turn: "player" | "enemy" = "player";
    private isFled: boolean = false;

    constructor(player: PlayerData, enemyData: EnemyData) {
        this.player = JSON.parse(JSON.stringify(player)); // Fresh copy
        this.enemyData = JSON.parse(JSON.stringify(enemyData));
        console.log("CombatManager initialized for new combat"); // Debug
    }

    startCombat() {
        combatEvent.emit("enterCombat", {
            player: this.player,
            enemy: this.enemyData,
        });
    }

    private nextTurn(): void {
        if (this.isCombatOver()) return;
        console.log(`Turn: ${this.turn}`);

        if (this.turn === "player") {
            this.turn = "enemy";
            this.enemyTurn();
        } else if (this.turn === "enemy") {
            this.turn = "player";
        }

        combatEvent.emit("combatUpdate", {
            player: this.player,
            enemy: this.enemyData,
        });
        playerDataManager.updatePlayerData(this.player);
    }

    normalAttack(): void {
        if (this.turn !== "player") return;
        const damage = playerDataManager.calcAttack(this.player);
        const final_damage = Math.floor(Math.max(Math.random()*damage - this.enemyData.stats.defense, 1));
        combatEvent.emit("showDamage", { attacker: this.player.name, target: this.enemyData.name, damage: final_damage });
        this.enemyData.stats.hp -= final_damage;

        const manaGain = playerDataManager.calcManaGain(this.player); // Explicit constant
        this.player.stats.mana = Math.min(this.player.stats.mana + manaGain, this.player.stats.maxmana);
        console.log(`Normal attack: Dealt ${damage} damage, Gained ${manaGain} mana (new mana: ${this.player.stats.mana})`);
        this.nextTurn();
    }

    fireball(): void {
        if (this.turn !== "player" || this.player.stats.mana < 10) return;

        const damage = Math.max(this.player.stats.magic * 1.5 - this.enemyData.stats.defense, 1);
        combatEvent.emit("showDamage",  {attacker: this.player.name, target: this.enemyData.name, damage });
        console.log({attacker: this.player.name, target: this.enemyData.name, damage });
        this.enemyData.stats.hp -= damage;
        const manaCost = 10; // Explicit constant
        this.player.stats.mana -= manaCost;
        console.log(`Fireball: Dealt ${damage} damage, Used ${manaCost} mana (new mana: ${this.player.stats.mana})`);
        this.nextTurn();
    }

    flee(): void {
        if (this.turn !== "player") return;

        const fleeChance = Math.max(10, Math.min(90, this.player.stats.speed - this.enemyData.stats.speed + 50));
        this.isFled = Math.random() * 100 < fleeChance;
        console.log(`Flee attempt: ${this.isFled ? "Success" : "Failed"}`);
        this.nextTurn();
    }

    private enemyTurn() {
        if (this.turn !== "enemy") return;

        const damage = Math.max(this.enemyData.stats.attack - this.player.stats.defense, 1);
        combatEvent.emit("showDamage", { attacker: this.enemyData.name, target: this.player.name, damage });
        this.player.stats.hp -= damage;
        console.log(`Enemy attack: Dealt ${damage} damage (new HP: ${this.player.stats.hp})`);
        this.nextTurn();
    }

    private isCombatOver(): boolean {
        if (this.enemyData.stats.hp <= 0) {
            const rewardCoins = Phaser.Math.Between(10, 20);
            const coins = this.player.coins + rewardCoins ;
            const rewardXp = Phaser.Math.Between(10, 20);
            const xp = this.player.xp + rewardXp;

            const rewardEquipmentName:string[] =[] ;
            const itemChance = Math.random();
            const numberOfItems = Phaser.Math.Between(0, 3);
            const newInventory = [...this.player.inventory];

            if (itemChance < 0.5) {
                
                for (let i = 0; i < numberOfItems; i++) {
                    const equipment = generateRandomEquipment({ level: this.player.level });
                    console.log("Generated equipment:", equipment);
                    rewardEquipmentName.push(equipment.name);
                    newInventory.push(equipment);
                }
                this.player.inventory = newInventory;
            }
            
            playerDataManager.updatePlayerData({ coins, xp ,inventory: newInventory});
            combatEvent.emit("combatEnd", { result: "victory" });
            console.log("Combat ended: Player wins");
            showToast.congrats("Batlle wins!", `+${rewardCoins} coins, +${rewardXp} xp${rewardEquipmentName.length > 0 ? ", " + rewardEquipmentName.join(", ") : ""}`);
            return true;
        }

        if (this.player.stats.hp <= 0) {
            playerDataManager.updatePlayerData(this.player);
            combatEvent.emit("combatEnd", { result: "defeat" });
            console.log("Combat ended: Player loses");
            showToast.congrats("Batlle lost!", `You lost the battle`);
            return true;
        }

        if (this.isFled && this.player.stats.hp > 0) {
            playerDataManager.updatePlayerData(this.player);
            combatEvent.emit("combatEnd", { result: "fled" });
            console.log("Combat ended: Player flees");
            showToast.congrats("Batlle fled!", `You have fled the battle`);
            return true;
        }

        return false;
    }
}
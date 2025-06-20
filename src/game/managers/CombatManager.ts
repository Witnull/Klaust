import Phaser from "phaser";
import { EnemyData, PlayerData, Stats, Skill, StatusEffects } from "../types/GameTypes";
import { combatEvent } from "../EventBus";
import { generateRandomEquipment } from "../utils/GenRandomUtils";
import { generateRandomSkill } from "../utils/GenRandomSkill";
import { playerDataManager } from "./PlayerDataManager";
import { showToast } from "./ToastManager";
// Define the interface for list items
interface ListItem {
    name: "player" | "enemy";
    number: number;
}
export class CombatManager {
    private playerData: PlayerData;
    private enemyData: EnemyData;
    private isFled: boolean = false;
    public sortedList: ListItem[] = [];
    private turn: "player" | "enemy" = "player"; // Track whose turn it is
    // Tracks skill cooldowns for player
    private playerSkillCooldowns: Map<string, number> = new Map();
    // Tracks status effects durations and intervals
    private statusEffects: Array<{
        id: string;
        target: "player" | "enemy";
        type: string;
        duration: number;
        interval: number;
        elapsed: number;
        amount: number;
        effect: any;
    }> = [];

    constructor(player: PlayerData, enemyData: EnemyData) {
        this.playerData = JSON.parse(JSON.stringify(player)); // Fresh copy
        this.enemyData = JSON.parse(JSON.stringify(enemyData));
        console.log("CombatManager initialized for new combat"); // Debug
    } startCombat() {
        // Initialize turn order based on speed stats
        this.sortedList = [];

        // Player goes first if their speed is higher or equal
        if (this.playerData.stats.speed >= this.enemyData.stats.speed) {
            this.insertTurn("player", 0);
            this.insertTurn("enemy", 0);
        } else {
            this.insertTurn("enemy", 0);
            this.insertTurn("player", 0);
        }

        combatEvent.emit("enterCombat", {
            player: this.playerData,
            enemy: this.enemyData,
            turnOrder: this.sortedList
        });
    }    private nextTurn(): void {
        if (this.isCombatOver()) return;

        if (this.sortedList.length === 0) {
            // This shouldn't happen in normal gameplay
            console.error("Turn list is empty, resetting turns");
            this.insertTurn("player", 0);
            this.insertTurn("enemy", 0);
        }

        // Get the current turn item (entity with lowest number)
        const item = this.sortedList.shift() || { name: "player" as const, number: 0 };
        const subtractAmount = item.number; // This is the amount to subtract from all other items
        
        // Subtract this amount from all other items in the list
        this.sortedList.forEach(listItem => {
            listItem.number -= subtractAmount;
        });
        
        // Also decrease all skill cooldowns
        this.decreaseCooldowns(subtractAmount);
        
        // Process status effects based on the subtracted amount
        this.processStatusEffects(subtractAmount);
        
        this.turn = item.name;
        console.log(`Next turn: ${this.turn}`);

        if (this.turn === "enemy") {
            this.enemyTurn();
        }

        // Emit updated combat state with turn info
        combatEvent.emit("combatUpdate", {
            player: this.playerData,
            enemy: this.enemyData,
            currentTurn: this.turn,
            turnOrder: this.sortedList
        });

        playerDataManager.updatePlayerData(this.playerData);
    }    /**
     * Insert a turn into the sorted list based on when the entity can act next
     * @param name The entity taking the turn (player or enemy)
     * @param actionCooldown The cooldown before this entity can act again
     */
    insertTurn(name: "player" | "enemy", actionCooldown: number): void {
        // Calculate when the entity can take their next turn
        const baseSpeed = name === "player" ? this.playerData.stats.speed : this.enemyData.stats.speed;

        // Speed affects how quickly an entity can act again (higher speed = lower wait time)
        // Base action cooldown is modified by speed
        const speedFactor = Math.max(0.5, 100 / (baseSpeed + 50)); // Speed reduction factor, bottoms out at 50% reduction
        const adjustedCooldown = Math.max(1, Math.floor(actionCooldown * speedFactor));

        // Find the next absolute turn number
        const currentMaxTurn = this.sortedList.length > 0
            ? Math.max(...this.sortedList.map(item => item.number))
            : 0;

        const nextTurnNumber = currentMaxTurn + adjustedCooldown;

        // Create the turn item
        const newItem: ListItem = { name, number: nextTurnNumber };

        // Find the correct insertion index based on turn number
        const insertIndex = this.sortedList.findIndex(item => item.number > nextTurnNumber);

        // If no item has a larger number, append to the end
        if (insertIndex === -1) {
            this.sortedList.push(newItem);
        } else {
            // Insert at the correct position
            this.sortedList.splice(insertIndex, 0, newItem);
        }

        // Log the turn schedule for debugging
        console.log(`${name} will act again at turn ${nextTurnNumber}`);
        console.log(`Current turn order:`, this.sortedList);
    }

    normalAttack(): void {
        if (this.turn !== "player") return;

        const damage = playerDataManager.calcAttack(this.playerData);
        const final_damage = Math.floor(Math.max(Math.random() * damage - this.enemyData.stats.defense, 1));

        combatEvent.emit("showDamage", {
            attacker: this.playerData.name,
            target: this.enemyData.name,
            damage: final_damage
        });

        this.enemyData.stats.hp -= final_damage;

        const manaGain = playerDataManager.calcManaGain(this.playerData);
        this.playerData.stats.mana = Math.min(this.playerData.stats.mana + manaGain, this.playerData.stats.max_mana);

        console.log(`Normal attack: Dealt ${damage} damage, Gained ${manaGain} mana (new mana: ${this.playerData.stats.mana})`);

        // Normal attack has a base action cooldown of 20
        const BASE_ATTACK_COOLDOWN = 20;
        this.insertTurn("player", BASE_ATTACK_COOLDOWN);

        this.nextTurn();
    }    useSkill(skill_id: string): void {
        if (this.turn !== "player") return;

        const skill_info = this.playerData.skills?.find(skill => skill.id === skill_id);
        if (!skill_info) {
            console.error(`Skill with ID ${skill_id} not found`);
            showToast.congrats("Skill Error", "Skill not found");
            return;
        }

        if (skill_info.type !== "active") {
            console.error(`Skill with ID ${skill_id} is not an active skill`);
            showToast.congrats("Skill Error", "Cannot use passive skill actively");
            return;
        }

        // Check if the skill is on cooldown
        if (this.playerSkillCooldowns.has(skill_id)) {
            const remainingCooldown = this.playerSkillCooldowns.get(skill_id) || 0;
            console.error(`Skill ${skill_info.name} is on cooldown (${remainingCooldown} remaining)`);
            showToast.congrats("Skill Cooldown", `${skill_info.name} will be ready in ${remainingCooldown} turns`);
            return;
        }

        // Check if player has enough mana
        if (this.playerData.stats.mana < skill_info.manaCost) {
            console.error(`Not enough mana to use skill ${skill_info.name}`);
            showToast.congrats("Not enough mana", `You need ${skill_info.manaCost} mana to use this skill`);
            return;
        }

        // Consume mana
        this.playerData.stats.mana -= skill_info.manaCost;

        // Log skill use
        console.log(`Used skill: ${skill_info.name} (Mana: ${skill_info.manaCost})`);
        switch (skill_info.effects.type) {
            case "damage": {
                switch (skill_info.damage_type) {
                    case "physical": {
                        const damage = playerDataManager.calcAttack(this.playerData);
                        const final_damage = Math.floor(Math.max(Math.random() * damage - this.enemyData.stats.defense, 1));
                        combatEvent.emit("showDamage", { attacker: this.playerData.name, target: this.enemyData.name, damage: final_damage });
                        this.enemyData.stats.hp -= final_damage;
                        console.log(`Skill ${skill_info.name}: Dealt ${final_damage} physical damage`);
                        break;
                    }
                    case "magical": {
                        const damage = playerDataManager.calcMagic(this.playerData);
                        const final_damage = Math.floor(Math.max(Math.random() * damage - this.enemyData.stats.defense, 1));
                        combatEvent.emit("showDamage", { attacker: this.playerData.name, target: this.enemyData.name, damage: final_damage });
                        this.enemyData.stats.hp -= final_damage;
                        console.log(`Skill ${skill_info.name}: Dealt ${final_damage} magic damage`);
                        break;
                    }
                    case "true": {
                        const damage = playerDataManager.calcAttack(this.playerData);
                        const final_damage = Math.floor(Math.max(damage - this.enemyData.stats.defense, 1));
                        combatEvent.emit("showDamage", { attacker: this.playerData.name, target: this.enemyData.name, damage: final_damage });
                        this.enemyData.stats.hp -= final_damage;
                        console.log(`Skill ${skill_info.name}: Dealt ${final_damage} true damage`);
                        break;
                    }
                    default:
                        console.error(`Unknown skill type: ${skill_info.damage_type}`);
                }
                break;
            }
            case "buff": {
                // Apply buff to player's stats based on the skill's effect
                const buffValue = skill_info.effects.value;

                // Since we don't have explicit stat field in effects, we'll infer from status effects
                if (skill_info.statusEffects && skill_info.statusEffects.length > 0) {
                    skill_info.statusEffects.forEach(effect => {
                        if (effect.increase_stat) {
                            const stat = effect.increase_stat.stat;
                            const amount = effect.increase_stat.amount[effect.increase_stat.level - 1] || effect.increase_stat.amount[0];

                            // Apply the buff to the player's stats
                            if (stat in this.playerData.stats) {
                                this.playerData.stats[stat] += amount;
                                console.log(`Skill ${skill_info.name}: Buffed ${stat} by ${amount} (new ${stat}: ${this.playerData.stats[stat]})`);
                                combatEvent.emit("showBuff", {
                                    target: this.playerData.name,
                                    stat,
                                    amount,
                                    duration: effect.increase_stat.duration
                                });
                            }
                        }
                    });
                } else {
                    // Generic buff if no specific stat is mentioned
                    // Default to attack
                    this.playerData.stats.attack += buffValue;
                    console.log(`Skill ${skill_info.name}: Buffed attack by ${buffValue} (new attack: ${this.playerData.stats.attack})`);
                    combatEvent.emit("showBuff", {
                        target: this.playerData.name,
                        stat: 'attack',
                        amount: buffValue,
                        duration: skill_info.effects.duration || 3
                    });
                }
                break;
            }
            case "debuff": {
                // Apply debuff to enemy's stats based on the skill's effect
                const debuffValue = skill_info.effects.value;

                // Check for specific status effects
                if (skill_info.statusEffects && skill_info.statusEffects.length > 0) {
                    skill_info.statusEffects.forEach(effect => {
                        if (effect.decrease_stat) {
                            const stat = effect.decrease_stat.stat;
                            const amount = effect.decrease_stat.amount[effect.decrease_stat.level - 1] || effect.decrease_stat.amount[0];

                            // Apply the debuff to the enemy's stats
                            if (stat in this.enemyData.stats) {
                                this.enemyData.stats[stat] = Math.max(1, this.enemyData.stats[stat] - amount);
                                console.log(`Skill ${skill_info.name}: Debuffed enemy ${stat} by ${amount} (new ${stat}: ${this.enemyData.stats[stat]})`);
                                combatEvent.emit("showDebuff", {
                                    target: this.enemyData.name,
                                    stat,
                                    amount,
                                    duration: effect.decrease_stat.duration
                                });
                            }
                        }
                    });
                } else {
                    // Generic debuff if no specific stat is mentioned
                    // Default to defense
                    this.enemyData.stats.defense = Math.max(0, this.enemyData.stats.defense - debuffValue);
                    console.log(`Skill ${skill_info.name}: Debuffed enemy defense by ${debuffValue} (new defense: ${this.enemyData.stats.defense})`);
                    combatEvent.emit("showDebuff", {
                        target: this.enemyData.name,
                        stat: 'defense',
                        amount: debuffValue,
                        duration: skill_info.effects.duration || 3
                    });
                }
                break;
            }
            case "heal": {
                const healValue = skill_info.effects.value;

                // Check if there are specific heal over time effects
                if (skill_info.statusEffects && skill_info.statusEffects.length > 0) {
                    skill_info.statusEffects.forEach(effect => {
                        if (effect.heal_over_time) {
                            const amount = effect.heal_over_time.amount[effect.heal_over_time.level - 1] || effect.heal_over_time.amount[0];
                            const healAmount = effect.heal_over_time.effect_based_on === 'maxhp'
                                ? Math.floor(this.playerData.stats.max_hp * amount / 100)
                                : amount;

                            this.playerData.stats.hp = Math.min(
                                this.playerData.stats.hp + healAmount,
                                this.playerData.stats.max_hp
                            );

                            console.log(`Skill ${skill_info.name}: Healed ${healAmount} HP over time (new HP: ${this.playerData.stats.hp})`);
                            combatEvent.emit("showHeal", {
                                target: this.playerData.name,
                                amount: healAmount
                            });
                        }
                    });
                } else {
                    // Direct heal
                    const healAmount = healValue;
                    this.playerData.stats.hp = Math.min(
                        this.playerData.stats.hp + healAmount,
                        this.playerData.stats.max_hp
                    );

                    console.log(`Skill ${skill_info.name}: Healed ${healAmount} HP (new HP: ${this.playerData.stats.hp})`);
                    combatEvent.emit("showHeal", {
                        target: this.playerData.name,
                        amount: healAmount
                    });
                }
                break;
            }
        }        // Apply status effects if they exist
        this.applyStatusEffects(skill_info);

        // Set skill cooldown
        const skillCooldown = skill_info.cooldown || 3;
        // Convert seconds to our turn system units (approximately)
        // More complex skills have longer cooldowns
        const cooldownInTurns = Math.ceil(skillCooldown * 10);
        this.playerSkillCooldowns.set(skill_id, cooldownInTurns);
        
        console.log(`Skill ${skill_info.name} put on cooldown for ${cooldownInTurns} turns`);

        // Use skill's action cooldown or default to 30
        // Add player speed to the calculation
        const playerSpeed = this.playerData.stats.speed;
        const baseCD = skill_info.actionCooldown || 30;
        // Formula: base cooldown + (skill cooldown * 5)
        const actionCD = baseCD + (skillCooldown * 5);
        
        this.insertTurn("player", actionCD);

        this.nextTurn();
    } flee(): void {
        if (this.turn !== "player") return;

        const fleeChance = Math.max(10, Math.min(90, this.playerData.stats.speed - this.enemyData.stats.speed + 50));
        this.isFled = Math.random() * 100 < fleeChance;
        console.log(`Flee attempt: ${this.isFled ? "Success" : "Failed"}`);

        if (!this.isFled) {
            // Failed flee attempt still counts as an action
            const FLEE_ATTEMPT_COOLDOWN = 15;
            this.insertTurn("player", FLEE_ATTEMPT_COOLDOWN);
        }

        this.nextTurn();
    }

    private enemyTurn() {
        if (this.turn !== "enemy") return;

        // Enemy AI - choose an action based on what's available
        if (this.enemyData.skills && this.enemyData.skills.length > 0 && Math.random() < 0.4) {
            // Use a random skill from available skills
            const randomSkillIndex = Math.floor(Math.random() * this.enemyData.skills.length);
            const chosenSkill = this.enemyData.skills[randomSkillIndex];

            console.log(`Enemy uses skill: ${chosenSkill.name}`);

            let damage = 0;

            // Calculate damage based on skill type
            switch (chosenSkill.damage_type) {
                case 'physical':
                    damage = Math.max(this.enemyData.stats.attack * 1.2 - this.playerData.stats.defense, 1);
                    break;
                case 'magical':
                    damage = Math.max(this.enemyData.stats.magic * 1.3 - this.playerData.stats.defense / 2, 1);
                    break;
                case 'true':
                    damage = Math.max(this.enemyData.stats.attack - this.playerData.stats.defense / 3, 1);
                    break;
            }

            // Apply damage
            combatEvent.emit("showDamage", {
                attacker: this.enemyData.name,
                target: this.playerData.name,
                damage,
                skill: chosenSkill.name
            });

            this.playerData.stats.hp -= damage;
            console.log(`Enemy skill attack: Dealt ${damage} damage (new HP: ${this.playerData.stats.hp})`);

            // Apply skill's action cooldown
            const actionCD = chosenSkill.actionCooldown || 30;
            this.insertTurn("enemy", actionCD);
        } else {
            // Normal attack
            const damage = Math.max(this.enemyData.stats.attack - this.playerData.stats.defense, 1);
            combatEvent.emit("showDamage", {
                attacker: this.enemyData.name,
                target: this.playerData.name,
                damage
            });
            this.playerData.stats.hp -= damage;
            console.log(`Enemy attack: Dealt ${damage} damage (new HP: ${this.playerData.stats.hp})`);

            // Use base enemy attack cooldown
            const ENEMY_ATTACK_COOLDOWN = 25;
            this.insertTurn("enemy", ENEMY_ATTACK_COOLDOWN);
        }

        this.nextTurn();
    }

    private isCombatOver(): boolean {
        if (this.enemyData.stats.hp <= 0) {
            const rewardCoins = Phaser.Math.Between(10, 20);
            const coins = this.playerData.coins + rewardCoins;
            const rewardXp = Phaser.Math.Between(10, 20);
            const xp = this.playerData.xp + rewardXp;

            const rewardEquipmentName: string[] = [];
            const itemChance = Math.random();
            const numberOfItems = Phaser.Math.Between(0, 3);
            const newInventory = [...this.playerData.inventory];

            if (itemChance < 0.5) {

                for (let i = 0; i < numberOfItems; i++) {
                    const equipment = generateRandomEquipment({ level: this.playerData.level });
                    console.log("Generated equipment:", equipment);
                    rewardEquipmentName.push(equipment.name);
                    newInventory.push(equipment);
                }
                this.playerData.inventory = newInventory;
            }

            playerDataManager.updatePlayerData({ coins, xp, inventory: newInventory });
            combatEvent.emit("combatEnd", { result: "victory" });
            console.log("Combat ended: Player wins");
            showToast.congrats("Batlle wins!", `+${rewardCoins} coins, +${rewardXp} xp${rewardEquipmentName.length > 0 ? ", " + rewardEquipmentName.join(", ") : ""}`);
            return true;
        }

        if (this.playerData.stats.hp <= 0) {
            playerDataManager.updatePlayerData(this.playerData);
            combatEvent.emit("combatEnd", { result: "defeat" });
            console.log("Combat ended: Player loses");
            showToast.congrats("Batlle lost!", `You lost the battle`);
            return true;
        }

        if (this.isFled && this.playerData.stats.hp > 0) {
            playerDataManager.updatePlayerData(this.playerData);
            combatEvent.emit("combatEnd", { result: "fled" });
            console.log("Combat ended: Player flees");
            showToast.congrats("Batlle fled!", `You have fled the battle`);
            return true;
        }

        return false;
    }

    /**
     * Applies status effects from a skill to either the player or enemy
     * @param skill The skill containing status effects to apply
     */    private applyStatusEffects(skill: Skill): void {
        if (!skill.statusEffects || skill.statusEffects.length === 0) return;

        // Process each status effect
        skill.statusEffects.forEach(statusEffect => {
            // Handle damage over time effects (poison, burn, chill, bleed)
            const dotEffects = ['poison', 'burn', 'chill', 'bleed'] as const;
            dotEffects.forEach(dotType => {
                const effect = statusEffect[dotType];
                if (effect) {
                    this.applyDamageOverTimeEffect(dotType, statusEffect, this.enemyData);
                    
                    // Track the effect for the timing system
                    const amount = effect.amount[effect.level - 1] || effect.amount[0];
                    const effectId = `${dotType}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
                    const interval = dotType === 'poison' ? 3 : 
                                    dotType === 'burn' ? 5 : 
                                    dotType === 'chill' ? 4 : 2; // bleed is faster
                    
                    this.statusEffects.push({
                        id: effectId,
                        target: "enemy",
                        type: "damage",
                        duration: effect.duration,
                        interval: interval,
                        elapsed: 0,
                        amount: amount,
                        effect: effect
                    });
                    
                    console.log(`Tracking ${dotType} effect with ID ${effectId} for timing system`);
                }
            });

            // Handle debuff effects (freeze, stun, silence, blind)
            const debuffEffects = ['freeze', 'stun', 'silence', 'blind'] as const;
            debuffEffects.forEach(debuffType => {
                if (statusEffect[debuffType]) {
                    this.applyDebuffEffect(debuffType, statusEffect, this.enemyData);
                }
            });

            // Handle heal over time effect for player
            if (statusEffect.heal_over_time) {
                const effect = statusEffect.heal_over_time;
                const amount = effect.amount[effect.level - 1] || effect.amount[0];
                const healAmount = effect.effect_based_on === 'maxhp'
                    ? Math.floor(this.playerData.stats.max_hp * amount / 100)
                    : amount;

                console.log(`Applied heal over time effect: ${effect.id}, healing ${healAmount} HP over ${effect.duration} seconds`);
                combatEvent.emit("applyStatusEffect", {
                    target: this.playerData.name,
                    effectId: effect.id,
                    type: "heal",
                    duration: effect.duration,
                    amount: healAmount
                });
                
                // Track healing effect for timing system
                const effectId = `heal_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
                this.statusEffects.push({
                    id: effectId,
                    target: "player",
                    type: "heal",
                    duration: effect.duration,
                    interval: 5, // Apply healing every 5 time units
                    elapsed: 0,
                    amount: healAmount,
                    effect: effect
                });
                
                console.log(`Tracking heal effect with ID ${effectId} for timing system`);
            }
            
            // Handle stat increases and decreases for timing system
            if (statusEffect.increase_stat) {
                const effect = statusEffect.increase_stat;
                const effectId = `buff_${effect.stat}_${Date.now()}`;
                
                // Note: The actual stat increase is already handled in the useSkill method
                // Here we just track it for the timing system to handle duration
                this.statusEffects.push({
                    id: effectId,
                    target: "player",
                    type: "buff",
                    duration: effect.duration,
                    interval: effect.duration, // Only needs to be processed once at the end
                    elapsed: 0,
                    amount: effect.amount[effect.level - 1] || effect.amount[0],
                    effect: effect
                });
            }
            
            if (statusEffect.decrease_stat) {
                const effect = statusEffect.decrease_stat;
                const effectId = `debuff_${effect.stat}_${Date.now()}`;
                
                // Note: The actual stat decrease is already handled in the useSkill method
                // Here we just track it for the timing system to handle duration
                this.statusEffects.push({
                    id: effectId,
                    target: "enemy",
                    type: "debuff",
                    duration: effect.duration,
                    interval: effect.duration, // Only needs to be processed once at the end
                    elapsed: 0,
                    amount: effect.amount[effect.level - 1] || effect.amount[0],
                    effect: effect
                });
            }
        });
    }

    /**
     * Helper method to apply damage over time effects
     * @param effectType The type of effect (poison, burn, etc.)
     * @param statusEffect The status effect object
     * @param target The target of the effect (usually enemy)
     */
    private applyDamageOverTimeEffect(
        effectType: 'poison' | 'burn' | 'chill' | 'bleed',
        statusEffect: Partial<StatusEffects>,
        target: EnemyData
    ): void {
        const effect = statusEffect[effectType];
        if (!effect) return;

        const amount = effect.amount[effect.level - 1] || effect.amount[0];
        const damageAmount = effect.effect_based_on === 'maxhp'
            ? Math.floor(target.stats.max_hp * amount / 100)
            : amount;

        console.log(`Applied ${effectType} effect: ${effect.id}, dealing ${damageAmount} damage over ${effect.duration} seconds`);
        combatEvent.emit("applyStatusEffect", {
            target: target.name,
            effectId: effect.id,
            type: "damage",
            effectType: effectType,
            duration: effect.duration,
            amount: damageAmount,
            hits: effect.number_of_hits || 1
        });
    }

    /**
     * Helper method to apply debuff effects
     * @param effectType The type of effect (freeze, stun, etc.)
     * @param statusEffect The status effect object
     * @param target The target of the effect (usually enemy)
     */
    private applyDebuffEffect(
        effectType: 'freeze' | 'stun' | 'silence' | 'blind',
        statusEffect: Partial<StatusEffects>,
        target: EnemyData
    ): void {
        const effect = statusEffect[effectType];
        if (!effect) return;
        console.log(`Applied ${effectType} effect: ${effect.id}, duration: ${effect.duration} seconds`);
        const eventData = {
            target: target.name,
            effectId: effect.id,
            type: "debuff",
            effectType: effectType,
            duration: effect.duration
        };

        // For freeze, include slow percentage if it exists
        if (effectType === 'freeze' && 'slow_percentage' in effect) {
            combatEvent.emit("applyStatusEffect", {
                ...eventData,
                slowPercentage: effect.slow_percentage
            });
        } else {
            combatEvent.emit("applyStatusEffect", eventData);
        }
    }

    /**
     * Decrease all skill cooldowns by the given amount
     * @param amount The amount to decrease cooldowns by
     */
    private decreaseCooldowns(amount: number): void {
        // Update skill cooldowns
        this.playerSkillCooldowns.forEach((cooldown, skillId) => {
            const newCooldown = cooldown - amount;
            if (newCooldown <= 0) {
                this.playerSkillCooldowns.delete(skillId);
            } else {
                this.playerSkillCooldowns.set(skillId, newCooldown);
            }
        });
    }
    
    /**
     * Process all active status effects based on the elapsed time
     * @param elapsedTime The amount of time that has passed
     */
    private processStatusEffects(elapsedTime: number): void {
        // Process each status effect
        const effectsToRemove: string[] = [];
        
        this.statusEffects.forEach(effect => {
            // Update elapsed time and duration
            effect.elapsed += elapsedTime;
            effect.duration -= elapsedTime;
            
            // Check if the effect has expired
            if (effect.duration <= 0) {
                effectsToRemove.push(effect.id);
                return;
            }
            
            // Calculate how many intervals have passed
            const intervals = Math.floor(effect.elapsed / effect.interval);
            
            // Reset elapsed time if intervals have passed
            if (intervals > 0) {
                effect.elapsed = effect.elapsed % effect.interval;
                
                // Apply the effect for each interval
                switch (effect.type) {
                    case "damage":
                        // Apply damage
                        const damageTarget = effect.target === "player" ? this.playerData : this.enemyData;
                        const totalDamage = effect.amount * intervals;
                        damageTarget.stats.hp = Math.max(0, damageTarget.stats.hp - totalDamage);
                        
                        combatEvent.emit("showDamage", {
                            attacker: effect.target === "player" ? this.enemyData.name : this.playerData.name,
                            target: effect.target === "player" ? this.playerData.name : this.enemyData.name,
                            damage: totalDamage
                        });
                        break;
                        
                    case "heal":
                        // Apply healing
                        const healTarget = effect.target === "player" ? this.playerData : this.enemyData;
                        const totalHeal = effect.amount * intervals;
                        healTarget.stats.hp = Math.min(healTarget.stats.max_hp, healTarget.stats.hp + totalHeal);
                        
                        combatEvent.emit("showHeal", {
                            target: effect.target === "player" ? this.playerData.name : this.enemyData.name,
                            amount: totalHeal
                        });
                        break;
                }
            }
        });
        
        // Remove expired effects
        this.statusEffects = this.statusEffects.filter(effect => !effectsToRemove.includes(effect.id));
    }
}
import { EQUIPMENT_TYPES, PlayerData, Stats } from "../types/GameTypes";
import { playerDataEvent } from "../EventBus";
import { showToast } from "./ToastManager";

// Singleton class to manage player data
export class PlayerDataManager {
    private static instance: PlayerDataManager;
    private playerData: PlayerData;
    private eventBus = playerDataEvent;

    private static generateInitialPlayerData(options: Partial<PlayerData> = {}): PlayerData {
        // Base stats configuration
        const baseStats = {
            hp: 100,
            max_hp: 100,
            mana: 50,
            max_mana: 50,
            attack: 10,
            defense: 5,
            speed: 20,
            magic: 15,
            crit_chance: 5,
            crit_damage: 50,
        };

        // Generate a unique player ID
        const playerId = `p_${Math.random().toString(36).substr(2, 7)}`;

        // Default player data
        const equipmentSlots = EQUIPMENT_TYPES;
        const equipment = Object.fromEntries(
            equipmentSlots.map(slot => [slot, null])
        ) as Record<typeof equipmentSlots[number], null>;

        const defaultData: PlayerData = {
            id: playerId,
            name: "Hero",
            level: 1,
            xp: 0,
            coins: 0,
            maxInventorySlots: 10,
            total_xp: 0,
            total_statsPoints: 0,
            statsPoints: 0,
            distributedBonusStatsPoints: {
                Str: 0,
                Int: 0,
                Agi: 0,
                Luc: 0
            },
            baseStats: { ...baseStats },
            stats: { ...baseStats },
            equipment,
            inventory: [],
            position: { x: 16, y: 16 },
        };

        // Merge provided options with default data
        return { ...defaultData, ...options };
    }
    private constructor() {
        // Try to load saved data, fall back to initial data if none exists
        //const savedData = this.loadPlayerData();
        this.playerData = PlayerDataManager.generateInitialPlayerData();
    }

    // Singleton getter
    public static getInstance(): PlayerDataManager {
        if (!PlayerDataManager.instance) {
            PlayerDataManager.instance = new PlayerDataManager();
        }
        return PlayerDataManager.instance;
    }

    // Get current player data
    public getPlayerData(): PlayerData {
        return { ...this.playerData }; // Return a copy to prevent direct mutation
    }

    // Update player data and notify subscribers
    public updatePlayerData(updates: Partial<PlayerData>): void {
        // Validate inventory updates
        if (updates.inventory) {
            if (updates.inventory.length > this.playerData.maxInventorySlots) {
                showToast.error("Inventory Full - Cannot add more items than inventory capacity");
                return;
            }
        }

        // Validate stats updates
        if (updates.baseStats) {
            // Check if base stats are within bounds
            const baseStats = updates.baseStats;
            for (const stats in baseStats) {
                const statKey = stats as keyof typeof baseStats;
                if (baseStats[statKey] < 0) {
                    baseStats[statKey] = 0; // Reset to 0 if negative
                }
                if (baseStats[statKey] > 10000) {
                    baseStats[statKey] = 10000; // Reset to 10000 if greater
                }
            }
        }

        if (updates.stats) {
            // Check if stats are within bounds
            const stats = updates.stats;
            if (stats.hp < 0) {
                stats.hp = 0;
            } else if (stats.hp > this.playerData.baseStats.max_hp) {
                stats.hp = this.playerData.baseStats.max_hp;
            }
            if (stats.mana < 0) {
                stats.mana = 0;
            } else if (stats.mana > this.playerData.baseStats.max_mana) {
                stats.mana = this.playerData.baseStats.max_mana;
            }
        }

        this.playerData = { ...this.playerData, ...updates };
        this.tryLevelUp(this.playerData);  // Check if level up is needed
        //this.savePlayerData();  // Save after each update
        this.eventBus.emit("playerDataUpdated", this.getPlayerData());
    }

    private tryLevelUp(playerData: PlayerData): void {
        const xpRequired = this.calcXpRequired(playerData);
        if (playerData.xp >= xpRequired) {
            playerData.xp -= xpRequired;
            playerData.level++;
            playerData.statsPoints += 3;
            showToast.congrats(`Level up!`, `You are now level ${playerData.level}`);
            this.tryLevelUp(playerData); // Check if multiple level ups are possible
        }
    }

    // Inventory management
    public hasInventorySpace(): boolean {
        return this.playerData.inventory.length < this.playerData.maxInventorySlots;
    }

    public getEmptySlots(): number {
        return this.playerData.maxInventorySlots - this.playerData.inventory.length;
    }

    public incXp(amount: number): void {
        const newTotal = this.playerData.total_xp + amount;
        this.updatePlayerData({
            xp: this.playerData.xp + amount,
            total_xp: newTotal
        });
    }

    public calcXpRequired(playerData: PlayerData): number {
        return Math.floor(100 * Math.pow(1.1, playerData.level));
    }

    public distributeBonusStatsPoints(stats: keyof PlayerData["distributedBonusStatsPoints"], amount: number = 1): void {
        const playerData = this.getPlayerData();
        if (playerData.statsPoints >= amount) {
            playerData.statsPoints -= amount;
            playerData.distributedBonusStatsPoints[stats] += amount;
            // Recalculate all stats after distribution
            this.updateAllDerivedStats(playerData);
            this.updatePlayerData(playerData);
        }
    }

    // Calculate all stats methods
    public calcMaxHP(playerData: PlayerData): number {
        return playerData.stats.max_hp + (playerData.distributedBonusStatsPoints.Str * 5);
    }

    public calcmax_mana(playerData: PlayerData): number {
        return playerData.stats.max_mana + (playerData.distributedBonusStatsPoints.Int * 5);
    }

    public calcAttack(playerData: PlayerData): number {
        return playerData.stats.attack + (playerData.distributedBonusStatsPoints.Str / 2);
    }

    public calcDefense(playerData: PlayerData): number {
        return playerData.stats.defense + (playerData.distributedBonusStatsPoints.Str / 2 + playerData.distributedBonusStatsPoints.Int / 2);
    }

    public calcSpeed(playerData: PlayerData): number {
        return playerData.stats.speed + (playerData.distributedBonusStatsPoints.Agi / 2);
    }

    public calcMagic(playerData: PlayerData): number {
        return playerData.stats.magic + (playerData.distributedBonusStatsPoints.Int / 2);
    }

    public calcManaGain(playerData: PlayerData): number {
        return 5 + Math.floor(playerData.distributedBonusStatsPoints.Int / 2);
    }

    public calcCrit(playerData: PlayerData): number {
        return playerData.stats.crit_chance + (playerData.distributedBonusStatsPoints.Luc / 3);
    }
    public calcCritDamage(playerData: PlayerData): number {
        return playerData.stats.crit_damage + (playerData.distributedBonusStatsPoints.Luc);
    }

    // Calculate and update all derived stats at once
    public updateAllDerivedStats(playerData: PlayerData): void {
        const updatedStats = this.calculateAllDerivedStats(playerData);
        this.updatePlayerData({ stats: updatedStats });
    }

    // Calculate all derived stats without automatically updating player data
    public calculateAllDerivedStats(playerData: PlayerData): Stats {
        return {
            ...playerData.stats,
            max_hp: this.calcMaxHP(playerData),
            max_mana: this.calcmax_mana(playerData),
            attack: this.calcAttack(playerData),
            defense: this.calcDefense(playerData),
            speed: this.calcSpeed(playerData),
            magic: this.calcMagic(playerData)
        };
    }

    // // Save/Load functionality
    // private savePlayerData(): void {
    //     try {
    //         localStorage.setItem('playerData', JSON.stringify(this.playerData));
    //     } catch (error) {
    //         console.error('Failed to save player data:', error);
    //     }
    // }

    // private loadPlayerData(): PlayerData | null {
    //     try {
    //         const savedData = localStorage.getItem('playerData');
    //         if (savedData) {
    //             return JSON.parse(savedData) as PlayerData;
    //         }
    //     } catch (error) {
    //         console.error('Failed to load player data:', error);
    //     }
    //     return null;
    // }

    // Event subscription methods
    public on(event: "playerDataUpdated", callback: (data: PlayerData) => void): void {
        this.eventBus.on(event, callback);
    }

    public off(event: "playerDataUpdated", callback: (data: PlayerData) => void): void {
        this.eventBus.off(event, callback);
    }
}

export const playerDataManager = PlayerDataManager.getInstance();
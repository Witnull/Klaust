import { PlayerData } from "../types/PlayerData";
import { playerDataEvent } from "../EventBus";
import { showToast } from "./ToastManager";

// Singleton class to manage player data
export class PlayerDataManager {
  private static instance: PlayerDataManager;
  private playerData: PlayerData;
  private eventBus = playerDataEvent;

  private constructor() {
    // Initial player data
    this.playerData = {
        id:"p_0000001",
        name: "Hero",
        level: 1,
        xp :0,
        coins: 0,
        total_xp: 0,
        total_statsPoints: 0,
        statsPoints: 0,
        distributedBonusStatsPoints: {
            Str: 0,
            Int: 0,
            Agi: 0,
            Luc: 0
        },
        baseStats: {
            hp: 100,
            maxhp: 100,
            mana: 50,
            maxmana: 50,
            attack: 10,
            defense: 5,
            speed: 20,
            magic: 15,
        },
        stats: {
            hp: 100,
            maxhp: 100,
            mana: 50,
            maxmana: 50,
            attack: 10,
            defense: 5,
            speed: 20,
            magic: 15,
        },
        equipment: {},
        inventory: [],
        position: { x: 16, y: 16 },
        };
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
    // add checks when update is called

    if (updates.baseStats) {
      // Check if base stats are within bounds
      const baseStats = updates.baseStats;
      if (baseStats.hp < 0) {
        baseStats.hp = 0;
      }
      if (baseStats.mana < 0) {
        baseStats.mana = 0;
      }
      if (baseStats.attack < 0) {
        baseStats.attack = 0;
      }
      if (baseStats.defense < 0) {
        baseStats.defense = 0;
      }
      if (baseStats.speed < 0) {
        baseStats.speed = 0;
      }
      if (baseStats.magic < 0) {
        baseStats.magic = 0;
      }
    }

    if (updates.stats) {
      // Check if stats are within bounds
      const stats = updates.stats;
      if (stats.hp < 0) {
        stats.hp = 0;
      } else if (stats.hp > this.playerData.baseStats.maxhp) {
        stats.hp = this.playerData.baseStats.maxhp;
      }
      if (stats.mana < 0) {
        stats.mana = 0;
      } else if (stats.mana > this.playerData.baseStats.maxmana) {
        stats.mana = this.playerData.baseStats.maxmana;
      }
    }

    this.playerData = { ...this.playerData, ...updates };
    //console.log("PlayerDataManager: Player data updated", this.playerData);
    this.tryLevelUp(this.playerData);  // Check if level up is needed and apply if necessary
    // Notify subscribers about the updated player data
    this.eventBus.emit("playerDataUpdated", this.getPlayerData());
  }

  private tryLevelUp(playerData: PlayerData): void {
    const xpRequired = this.calcXpRequired(playerData);
    if (playerData.xp >= xpRequired) {
      playerData.xp -= xpRequired;
      playerData.level++;
      playerData.statsPoints += 3;
      showToast.congrats(`Level up!`,`You are now level ${playerData.level}`);
      this.tryLevelUp(playerData); // Check if multiple level ups are possible
    }
  }

  public incXp(amount: number): void {
    this.updatePlayerData({ xp: this.playerData.xp + amount });
 }

  public calcXpRequired(playerData: PlayerData): number {
    return Math.floor(100 * Math.pow(1.1, playerData.level));
  }

  public distributeBonusStatsPoints(stats: keyof PlayerData["distributedBonusStatsPoints"], amount: number = 1): void {
    const playerData = this.getPlayerData();
    if (playerData.statsPoints >= amount) {
      playerData.statsPoints -= amount;
      playerData.distributedBonusStatsPoints[stats] += amount;
      this.updatePlayerData(playerData);
    }
  }

  public calcMaxHP(playerData: PlayerData): number {
    return playerData.stats.maxhp + (playerData.distributedBonusStatsPoints.Str * 5);
  }
  public calcMaxMana(playerData: PlayerData): number {
    return playerData.stats.maxmana + (playerData.distributedBonusStatsPoints.Int * 5);
  }
  public calcAttack(playerData: PlayerData): number {
    return playerData.stats.attack + (playerData.distributedBonusStatsPoints.Str/2);
  }
    public calcDefense(playerData: PlayerData): number {
        return playerData.stats.defense + (playerData.distributedBonusStatsPoints.Str/2 + playerData.distributedBonusStatsPoints.Int/2);
    }
    public calcSpeed(playerData: PlayerData): number {
        return playerData.stats.speed + (playerData.distributedBonusStatsPoints.Agi/2);
    }
    public calcMagic(playerData: PlayerData): number {
        return playerData.stats.magic + (playerData.distributedBonusStatsPoints.Int/2);
    }   
    public calcManaGain(playerData: PlayerData): number {
        return 5 + Math.floor(playerData.distributedBonusStatsPoints.Int/2);
    }


  // Subscribe to player data updates
  public on(event: "playerDataUpdated", callback: (data: PlayerData) => void): void {
    this.eventBus.on(event, callback);
  }

  // Unsubscribe from player data updates
  public off(event: "playerDataUpdated", callback: (data: PlayerData) => void): void {
    this.eventBus.off(event, callback);
  }

}

export const playerDataManager = PlayerDataManager.getInstance();
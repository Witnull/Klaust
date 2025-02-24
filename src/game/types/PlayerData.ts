export interface Stats {
    hp: number | 0;
    maxhp: number;
    mana: number| 0;
    maxmana: number;
    attack: number;
    defense: number;
    speed: number;
    magic: number;
}

export interface BonusStatsPoints{
    Str : number;
    Int : number;
    Agi : number;
    Luc : number;
}

export interface Equipment {
    id: string;
    name: string;
    type: 'weapon' | 'helmet' | 'armor' | 'gloves' | 'boots' | "ring" |"necklace" ;
    rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'mythic';
    levelRequired?: number;
    level?: number;
    stats?: {
      mainStat: Partial<Stats>;
      subStats?: Partial<Stats>[];
    };
    image?: string;
    quantity?: number;
    value?: number;
}

export interface Item {
    id: string;
    name: string;
    type:  'consumable' | 'collectible' | 'other';
    rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'mythic';
    level?: number;
    stats?: {
        mainStat: Partial<Stats>;
        subStats?: Partial<Stats>[];
    };
    image?: string;
    quantity?: number;
    value?: number;
}

  
  export interface PlayerData {
    id: string;
    name: string;
    level: number;
    xp: number;
    total_xp: number;
    baseStats: Stats; // Unmodified stats
    stats: Stats; // Stats from equipment
    statsPoints: number;
    total_statsPoints: number;
    distributedBonusStatsPoints: BonusStatsPoints; //
    coins: number;
    equipment: {
      weapon?: Equipment;
      helmet?: Equipment;
      armor?: Equipment;
      gloves?: Equipment;
      leggings?: Equipment;
      boots?: Equipment;
      necklace?: Equipment;
      ring?: Equipment;
      leftHand?: Equipment;
    };
    inventory: Equipment[];
    position: { x: number; y: number };
  }

  export interface EnemyData {
    id: string;
    name: string;
    level: number;
    stats: Stats; // Stats
    coins: number;
    position: { x: number; y: number };
  }
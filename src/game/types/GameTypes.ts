export interface Stats {
    hp: number | 0;
    max_hp: number;
    mana: number | 0;
    max_mana: number;
    attack: number;
    defense: number;
    speed: number;
    magic: number;
    crit_chance: number;
    crit_damage: number;
}
// Define the stats types as a constant array
export const LIMIT_STATS_TYPES = ['max_hp', 'max_mana', 'hp', 'mana' ] as const;
export type LimitStatsType = typeof LIMIT_STATS_TYPES[number];

export const DIRECT_STATS_TYPES = [
    'attack', 
    'defense', 
    'speed', 
    'magic', 
    'crit_chance', 
    'crit_damage'
] as const;
export type StatsType = typeof DIRECT_STATS_TYPES[number];

export interface BonusStatsPoints {
    Str: number;
    Int: number;
    Agi: number;
    Luc: number;
}

export const EQUIPMENT_TYPES = [
    'weapon', 'helmet', 'armor', 'gloves', 'boots', 'ring', 'necklace'
] as const;
export type EquipmentType = typeof EQUIPMENT_TYPES[number];


export const ITEM_TYPES = [
    'consumable', 'collectible', 'other'
] as const;
export type ItemType = typeof ITEM_TYPES[number];   


export const RARITY_TYPES = ["common", "uncommon", "rare", "epic", "legendary", "mythic"] as const;
export type RarityType = typeof RARITY_TYPES[number];

export const ITEM_CLASS = ['equipment' , 'item' , 'skill'] as const; // Class to differentiate between equipment, items, and skills
export type ItemsClassType = typeof ITEM_CLASS[number];

export interface Equipment {
    id: string;
    name: string;
    description?: string;
    type: EquipmentType;
    class: 'equipment'; // Class to differentiate from skills and items
    rarity: RarityType;
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
    description?: string;
    type:  ItemType;
    class: 'item'; // Class to differentiate from skills and equipment
    rarity: RarityType;
    level?: number;
    stats?: {
        mainStat: Partial<Stats>;
        subStats?: Partial<Stats>[];
    };
    image?: string;
    quantity?: number;
    value?: number;
}

export const TYPE_OF_DAMAGE = ['physical', 'magical', 'true'] as const; // Types of damage that can be dealt by skills or equipment
export type TypeOfDamage = typeof TYPE_OF_DAMAGE[number];

export interface StatusEffects {
    poison?: {
        id: string; // Unique identifier for the poison effect
        duration: number; // in seconds
        number_of_hits?: number; // Optional for damage over time
        type: "damage"; // Type of effect, in this case, damage
        amount: [3, 5, 7, 10, 20]; // Fixed damage value for poison
        level: number | 1;
        effect_based_on: 'maxhp';
        image?: string; // Optional image for the poison effect
    };
    burn?: {
        id: string; // Unique identifier for the burn effect
        duration: number; // in seconds
        number_of_hits?: number; // Optional for damage over time
        type: "damage"; // Type of effect, in this case, damage
        amount: [3, 5, 7, 10, 20]; // Fixed damage value for burn
        level: number | 1;
        effect_based_on: 'maxhp';
        image?: string; 
    };
    chill?: {
        id: string; // Unique identifier for the chill effect
        duration: number; // in seconds
        number_of_hits?: number; // Optional for damage over time
        type: "damage"; // Type of effect, in this case, damage
        amount: [3, 5, 7, 10, 20]; // Fixed damage value for chill
        level: number | 1;
        effect_based_on: 'maxhp';
        image?: string; 
    };
    bleed?: {
        id: string; // Unique identifier for the bleed effect
        duration: number; // in seconds
        number_of_hits?: number; // Optional for damage over time
        type: "damage"; // Type of effect, in this case, damage
        amount: [3, 5, 7, 10, 20]; // Fixed damage value for bleed
        level: number | 1;
        effect_based_on: 'maxhp';
        image?: string; 
    };
    freeze?: {
        id: string; // Unique identifier for the freeze effect
        duration: number; // in seconds
        slow_percentage: number; // Percentage of speed reduction
        type: "debuff"; // Type of effect, in this case, debuff
        image?: string; // Optional image for the freeze effect
    };
    stun?: {
        id: string; // Unique identifier for the stun effect
        duration: number; // in seconds
        type: "debuff"; // Type of effect, in this case, debuff
        image?: string; // Optional image for the stun effect
    };
    silence?: {
        id: string; // Unique identifier for the silence effect
        duration: number; // in seconds
        type: "debuff"; // Type of effect, in this case, debuff
        image?: string; // Optional image for the silence effect
    };
    blind?: {
        id: string; // Unique identifier for the blind effect
        duration: number; // in seconds
        type:"debuff"; // Type of effect, in this case, debuff
        image?: string; // Optional image for the blind effect
    };
    heal_over_time?: {
        id: string; // Unique identifier for the heal over time effect
        duration: number; // in seconds
        number_of_hits?: number; // Optional for heal over time
        type:"heal"; // Type of effect, in this case, heal
        amount: [3, 5, 7, 10, 25, 50, 75]; // Amount of healing per tick
        level: number | 1;
        effect_based_on: 'maxhp'; // Healing based on max HP
        image?: string; // Optional image for the heal over time effect
    };
    
    increase_stat?: {
        id: string; // Unique identifier for the buff
        duration: number; // in seconds
        stat: keyof Stats; // Stat to buff (e.g., 'attack', 'defense')
        type: 'buff'; // Type of effect, in this case, buff
        amount: [10, 20, 30, 50, 70, 100, 150, 200, 500, 1000, 2500]; // Amount to buff the stat
        level: number | 1; // Level of the buff
        image?: string; // Optional image for the buff effect
    };
    decrease_stat?: {
        id: string; // Unique identifier for the debuff
        duration: number; // in seconds
        stat: keyof Stats; // Stat to debuff (e.g., 'attack', 'defense')
        type: 'debuff'; // Type of effect, in this case, debuff
        amount: [5, 10, 25, 50, 75, 90, 99]; // Amount to debuff the stat
        level: number | 1; // Level of the debuff
        image?: string; // Optional image for the debuff effect
    };
}

export interface Skill {
    id: string;
    level: number | 1;
    name: string;
    description?: string;
    levelRequired: number | 0;
    manaCost: number | 0;
    cooldown: number | 0; // in seconds
    class: 'skill';
    type: 'active' | 'passive'; // Active skills require activation, passive skills are always active
    damage_type: TypeOfDamage; // Type of damage dealt by the skill
    statusEffects?: Partial<StatusEffects>[]; // Optional status effects applied by the skill
    effects:{ // Direct hit effects of the skill
        type: 'damage' | 'heal' | 'buff' | 'debuff';
        value: number | 0; // Amount of damage/heal/buff/debuff
        duration?: number | 0; // in seconds, optional for buffs/debuffs
        number_of_hits?: number | 1; // Optional for damage over time or heal over time
    };
    image?: string; // Optional image for the skill
    actionCooldown?: number; // Cooldown for turn-based system, determines when the entity can act again
}

export type InventoryItemType = Item | Equipment | Skill;


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
    maxInventorySlots: number; 
    equipment: Record<EquipmentType, Equipment | null>; // Record of equipment items
    inventory: (Equipment | Item)[]; // Array of items in inventory
    skills?: Skill[]; // Array of skills
    equippedSkills?: Skill[]; // Array of equipped skills (max 4)
    equippedConsumables?: Item[]; // Array of equipped consumable items (max 4)
    position: { x: number; y: number };
}

export interface EnemyData {
    id: string;
    name: string;
    level: number;
    stats: Stats; // Stats
    skills?: Skill[]; // Skills available to the enemy
    coins: number;
    position: { x: number; y: number };
}
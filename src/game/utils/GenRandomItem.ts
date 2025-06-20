import { Equipment, Item, Stats, RarityType, RARITY_TYPES, EquipmentType, EQUIPMENT_TYPES, ITEM_TYPES, ItemType } from '../types/GameTypes';
import { v4 as uuid4 } from 'uuid';

const RARITY_WEIGHTS = {
    common: 0.5,
    uncommon: 0.25,
    rare: 0.15,
    epic: 0.08,
    mythic: 0.02
};

// Mapping of EquipmentType to possible main stat(s)
const MAIN_STAT_BY_TYPE: Partial<Record<EquipmentType, (keyof Stats)[]>> = {
    weapon: ['attack'],
    armor: ['max_hp'],
    helmet: ['defense'],
    boots: ['speed'],
    gloves: ['crit_chance', 'crit_damage']
};

export function generateRandomStats(
    level: number,
    rarity: RarityType,
    options?: {
        usedStats?: (keyof Stats)[];
        isMainStat?: boolean;
        equipmentType?: EquipmentType;
    }
): Partial<Stats> {
    // Precalculated multipliers
    const multiplier = {
        common: 1,
        uncommon: 1.2,
        rare: 1.5,
        epic: 2,
        legendary: 2.5,
        mythic: 3
    }[rarity];

    // Precalculated stat factors
    const statFactors: [keyof Stats, number][] = [
        ['max_hp', 5],
        ['max_mana', 2],
        ['attack', 2],
        ['defense', 2],
        ['speed', 0.25],
        ['magic', 2],
        ['crit_chance', 0.5],
        ['crit_damage', 2]
    ];

    let selectedStat: [keyof Stats, number];

    if (options?.isMainStat && options?.equipmentType && MAIN_STAT_BY_TYPE[options.equipmentType]) {
        // For main stat with defined type, select randomly from specified stats
        const possibleMainStats = MAIN_STAT_BY_TYPE[options.equipmentType]!;
        const randomMainStatKey = possibleMainStats[Math.floor(Math.random() * possibleMainStats.length)];
        const statFactor = statFactors.find(([key]) => key === randomMainStatKey);
        if (!statFactor) {
            throw new Error(`Invalid main stat for equipment type: ${options.equipmentType}`);
        }
        selectedStat = statFactor;
    } else {
        // For sub-stats or undefined main stat types, pick a random stat
        const usedStats = options?.usedStats || [];
        const availableStats = options?.isMainStat ? statFactors : statFactors.filter(([statKey]) => !usedStats.includes(statKey));
        
        if (availableStats.length === 0) {
            return {};
        }

        const randomIndex = Math.floor(Math.random() * availableStats.length);
        selectedStat = availableStats[randomIndex];
    }

    const [statKey, factor] = selectedStat;
    const value = Math.ceil(Math.random() * multiplier + factor * level);

    return { [statKey]: value } as Partial<Stats>;
}

export function generateRandomEquipment(
    params?: {
        level?: number,
        type?: EquipmentType,
        rarity?: RarityType,
        levelRequired?: number,
        stats?: {
            mainStat?: Partial<Stats>,
            subStats?: Partial<Stats>[]
        }
    }
): Equipment {
    const level = params?.level || Math.floor(Math.random() * 50) + 1;
    const type = params?.type || EQUIPMENT_TYPES[Math.floor(Math.random() * EQUIPMENT_TYPES.length)];
    const rarity = params?.rarity || weightedRandomRarity();
    const rarities = RARITY_TYPES;

    const subStatsCount = {
        common: [0, 1],
        uncommon: [0, 2],
        rare: [1, 3],
        epic: [2, 4],
        legendary: [2, 5],
        mythic: [5, 5]
    };

    const mainStat = params?.stats?.mainStat || generateRandomStats(level, rarity, {
        isMainStat: true,
        equipmentType: type
    });
    
    const [smin, smax] = subStatsCount[rarity];
    const sStatsCount = Math.floor(Math.random() * (smax - smin + 1)) + smin;

    const usedStats: (keyof Stats)[] = mainStat ? Object.keys(mainStat) as (keyof Stats)[] : [];
    const subStats = params?.stats?.subStats || Array(sStatsCount)
        .fill(null)
        .map(() => {
            const stat = generateRandomStats(level, rarity, { usedStats });
            const statKey = Object.keys(stat)[0] as keyof Stats;
            if (statKey) {
                usedStats.push(statKey);
            }
            return stat;
        })
        .filter(stat => Object.keys(stat).length > 0);

    return {
        id: "equip_" + uuid4(),
        name: `${rarity} ${type}`,
        type,
        class: 'equipment', // Class to differentiate from skills and items
        rarity,
        level: level,
        stats: {
            mainStat: mainStat,
            subStats: subStats
        },
        value: level * 50 * (rarities.indexOf(rarity) + 1),
        
    };
}

export function generateRandomItem(
    params?: {
        level?: number,
        type?: ItemType,
        rarity?: RarityType
    }
): Item {
    const level = params?.level || Math.floor(Math.random() * 50) + 1;
    const type = params?.type || ITEM_TYPES[Math.floor(Math.random() * ITEM_TYPES.length)];
    const rarity = params?.rarity || weightedRandomRarity();
    const rarities = RARITY_TYPES;

    return {
        id: "item_" + uuid4(),
        name: `${rarity} ${type}`,
        type,
        class: 'item', // Class to differentiate from skills and equipment
        rarity,
        level,
        stats: type === 'consumable' ? {
            mainStat: generateRandomStats(level, rarity),
        } : undefined,
        value: level * 50 * (rarities.indexOf(rarity) + 1)
    };
}

function weightedRandomRarity(): RarityType {
    const random = Math.random();
    let sum = 0;

    for (const [rarity, weight] of Object.entries(RARITY_WEIGHTS)) {
        sum += weight;
        if (random <= sum) {
            return rarity as RarityType;
        }
    }

    return 'common';
}
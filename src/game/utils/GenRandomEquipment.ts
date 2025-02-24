
import { Equipment, Item, Stats } from '../types/PlayerData';
import { v4 as uuid4 } from 'uuid';



const RARITY_WEIGHTS = {
    common: 0.5,
    uncommon: 0.25,
    rare: 0.15,
    epic: 0.08,
    mythic: 0.02
};

export function generateRandomStats(level: number, rarity: Equipment['rarity']): Partial<Stats> {
    const multiplier = {
        common: 1,
        uncommon: 1.2,
        rare: 1.5,
        epic: 2,
        mythic: 3
    }[rarity];

    return {
        hp: Math.floor(Math.random() * 10 * level * multiplier),
        attack: Math.floor(Math.random() * 5 * level * multiplier),
        defense: Math.floor(Math.random() * 5 * level * multiplier),
        speed: Math.floor(Math.random() * 3 * level * multiplier),
        magic: Math.floor(Math.random() * 5 * level * multiplier),
    };
}

export function generateRandomEquipment(
    params?: {
        level?: number,
        type?: Equipment['type'],
        rarity?: Equipment['rarity']
        levelRequired?: number,
        stats?: {
            mainStat?: Partial<Stats>
            subStats?: Partial<Stats>[]
        }
    }
): Equipment {
    const level = params?.level || Math.floor(Math.random() * 50) + 1;
    const types: Equipment['type'][] = ['weapon', 'helmet', 'armor', 'gloves', 'boots'];
    const rarities: Equipment['rarity'][] = ['common', 'uncommon', 'rare', 'epic', 'mythic'];
    
    const type = params?.type || types[Math.floor(Math.random() * types.length)];
    const rarity = params?.rarity || weightedRandomRarity();
    
    const subStatsCount = rarity === 'common' ? 0 : 
                         rarity === 'uncommon' ? 1 : 
                         rarity === 'rare' ? 2 : 
                         rarity === 'epic' ? 3 : 4;

    return {
        id: uuid4(),
        name: `${rarity} ${type}`,
        type,
        rarity,
        levelRequired: params?.levelRequired ?? level,
        stats: {
            mainStat: params?.stats?.mainStat || generateRandomStats(level, rarity),
            subStats: params?.stats?.subStats || 
                     Array(subStatsCount)
                         .fill(null)
                         .map(() => generateRandomStats(level, rarity))
        },
        value: level * 100 * (rarities.indexOf(rarity) + 1)
    };
}

export function generateRandomItem(
    params?: {
        level?: number,
        type?: Item['type'],
        rarity?: Item['rarity']
    }
): Item {
    const level = params?.level || Math.floor(Math.random() * 50) + 1;
    const types: Item['type'][] = ['consumable', 'collectible', 'other'];
    const rarities: Item['rarity'][] = ['common', 'uncommon', 'rare', 'epic', 'mythic'];
    
    const type = params?.type || types[Math.floor(Math.random() * types.length)];
    const rarity = params?.rarity || weightedRandomRarity();

    return {
        id: "i_"+uuid4(),
        name: `${rarity} ${type}`,
        type,
        rarity,
        level,
        stats: type === 'consumable' ? {
            mainStat: generateRandomStats(level, rarity),
        } : undefined,
        value: level * 50 * (rarities.indexOf(rarity) + 1)
    };
}

function weightedRandomRarity(): Equipment['rarity'] {
    const random = Math.random();
    let sum = 0;
    
    for (const [rarity, weight] of Object.entries(RARITY_WEIGHTS)) {
        sum += weight;
        if (random <= sum) {
            return rarity as Equipment['rarity'];
        }
    }
    
    return 'common';
}
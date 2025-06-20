import { v4 as uuid4 } from 'uuid';
import { Skill, TYPE_OF_DAMAGE, TypeOfDamage, StatusEffects, Stats } from '../types/GameTypes';

// Define skill names for different types
const SKILL_NAMES = {
    damage: {
        physical: ['Slash', 'Cleave', 'Smash', 'Strike', 'Bash', 'Pummel', 'Crush', 'Stab'],
        magical: ['Fireball', 'Ice Spike', 'Lightning Bolt', 'Arcane Missile', 'Frost Nova', 'Flame Burst', 'Thunder Strike'],
        true: ['Divine Strike', 'Void Blast', 'Soul Pierce', 'Ethereal Cut', 'Cosmic Ray']
    },
    heal: ['Healing Touch', 'Rejuvenate', 'Mend Wounds', 'Life Surge', 'Divine Blessing', 'Renew'],
    buff: ['Fortify', 'Empower', 'Battle Trance', 'Arcane Intellect', 'Divine Shield', 'Valor'],
    debuff: ['Weaken', 'Enfeeble', 'Curse', 'Sap Strength', 'Vulnerability', 'Hex']
};

// Define skill descriptions
const SKILL_DESCRIPTIONS = {
    damage: {
        physical: [
            'A powerful strike that deals physical damage.',
            'Attacks the enemy with brute force.',
            'Delivers a devastating blow to the opponent.'
        ],
        magical: [
            'Summons magical energy to damage the enemy.',
            'Channels arcane power into a devastating spell.',
            'Conjures elemental forces to strike the opponent.'
        ],
        true: [
            'A special attack that bypasses defense.',
            'Deals damage directly to the enemy\'s essence.',
            'An attack that cannot be mitigated by conventional means.'
        ]
    },
    heal: [
        'Restores health points.',
        'Channels healing energy to mend wounds.',
        'A soothing spell that repairs injuries.'
    ],
    buff: [
        'Enhances abilities for a limited time.',
        'Temporarily boosts performance in battle.',
        'Grants superior capabilities for a short duration.'
    ],
    debuff: [
        'Weakens the enemy\'s capabilities.',
        'Reduces the opponent\'s combat effectiveness.',
        'Hampers the target\'s ability to fight.'
    ]
};

// Define possible status effects for each skill type
const SKILL_STATUS_EFFECTS: Record<string, Array<keyof StatusEffects>> = {
    'physical': ['bleed', 'stun'],
    'magical_fire': ['burn'],
    'magical_ice': ['chill', 'freeze'],
    'magical_lightning': ['stun'],
    'magical_arcane': ['silence'],
    'true': ['decrease_stat'],
    'heal': ['heal_over_time'],
    'buff': ['increase_stat'],
    'debuff': ['decrease_stat', 'silence', 'blind']
};

// Skill effect values based on player level
const calculateEffectValue = (level: number, effectType: string): number => {
    const baseValues = {
        damage: 10,
        heal: 15,
        buff: 20,
        debuff: 15
    };

    const base = baseValues[effectType as keyof typeof baseValues] || 10;
    return Math.floor(base + (level * 1.5));
};

// Calculate mana cost based on level and effect
const calculateManaCost = (level: number, effectType: string, damageType?: TypeOfDamage): number => {
    const baseCost = {
        damage: {
            physical: 5,
            magical: 10,
            true: 15
        },
        heal: 10,
        buff: 8,
        debuff: 12
    };

    let base = 5;
    if (effectType === 'damage' && damageType) {
        base = baseCost.damage[damageType];
    } else if (effectType in baseCost) {
        base = baseCost[effectType as keyof typeof baseCost] as number;
    }

    return Math.floor(base + (level * 0.5));
};

// Calculate cooldown based on effect type and damage type
const calculateCooldown = (effectType: string, damageType?: TypeOfDamage): number => {
    const baseCooldowns = {
        damage: {
            physical: 1,
            magical: 2,
            true: 3
        },
        heal: 2,
        buff: 3,
        debuff: 2
    };

    let base = 1;
    if (effectType === 'damage' && damageType) {
        base = baseCooldowns.damage[damageType];
    } else if (effectType in baseCooldowns) {
        base = baseCooldowns[effectType as keyof typeof baseCooldowns] as number;
    }

    return base;
};

// Calculate action cooldown for the turn system
const calculateActionCooldown = (effectType: string, damageType?: TypeOfDamage): number => {
    const baseActionCDs = {
        damage: {
            physical: 20,
            magical: 30,
            true: 40
        },
        heal: 25,
        buff: 15,
        debuff: 20
    };

    let base = 20;
    if (effectType === 'damage' && damageType) {
        base = baseActionCDs.damage[damageType];
    } else if (effectType in baseActionCDs) {
        base = baseActionCDs[effectType as keyof typeof baseActionCDs] as number;
    }

    return base;
};

// Generate status effects for a skill based on its type
const generateStatusEffects = (
    effectType: string,
    damageType: TypeOfDamage | undefined,
    level: number
): Partial<StatusEffects>[] => {
    const effects: Partial<StatusEffects>[] = [];

    // Determine which status effects pool to use
    let effectsPool: (keyof StatusEffects)[] = [];

    if (effectType === 'damage' && damageType) {
        if (damageType === 'magical') {
            // For magical damage, pick a random element
            const elements = ['fire', 'ice', 'lightning', 'arcane'];
            const element = elements[Math.floor(Math.random() * elements.length)];
            effectsPool = SKILL_STATUS_EFFECTS[`magical_${element}`] || [];
        } else {
            effectsPool = SKILL_STATUS_EFFECTS[damageType] || [];
        }
    } else {
        effectsPool = SKILL_STATUS_EFFECTS[effectType] || [];
    }

    // No applicable status effects
    if (effectsPool.length === 0) return effects;

    // Chance to apply status effect increases with level
    const chanceToApply = Math.min(0.3 + (level * 0.02), 0.8);

    if (Math.random() < chanceToApply) {
        // Pick a random effect from the pool
        const effectKey = effectsPool[Math.floor(Math.random() * effectsPool.length)];

        switch (effectKey) {
            case 'burn':
                effects.push({
                    burn: {
                        id: `burn-${uuid4().substring(0, 8)}`,
                        duration: 3,
                        number_of_hits: 3,
                        type: "damage",
                        amount: [3, 5, 7, 10, 20],
                        level: Math.min(Math.ceil(level / 10), 5) || 1,
                        effect_based_on: 'maxhp'
                    }
                });
                break;

            case 'poison':
                effects.push({
                    poison: {
                        id: `poison-${uuid4().substring(0, 8)}`,
                        duration: 5,
                        number_of_hits: 5,
                        type: "damage",
                        amount: [3, 5, 7, 10, 20],
                        level: Math.min(Math.ceil(level / 10), 5) || 1,
                        effect_based_on: 'maxhp'
                    }
                });
                break;

            case 'chill':
                effects.push({
                    chill: {
                        id: `chill-${uuid4().substring(0, 8)}`,
                        duration: 2,
                        number_of_hits: 2,
                        type: "damage",
                        amount: [3, 5, 7, 10, 20],
                        level: Math.min(Math.ceil(level / 10), 5) || 1,
                        effect_based_on: 'maxhp'
                    }
                });
                break;

            case 'bleed':
                effects.push({
                    bleed: {
                        id: `bleed-${uuid4().substring(0, 8)}`,
                        duration: 4,
                        number_of_hits: 4,
                        type: "damage",
                        amount: [3, 5, 7, 10, 20],
                        level: Math.min(Math.ceil(level / 10), 5) || 1,
                        effect_based_on: 'maxhp'
                    }
                });
                break;

            case 'freeze':
                effects.push({
                    freeze: {
                        id: `freeze-${uuid4().substring(0, 8)}`,
                        duration: 2,
                        slow_percentage: 30,
                        type: "debuff"
                    }
                });
                break;

            case 'stun':
                effects.push({
                    stun: {
                        id: `stun-${uuid4().substring(0, 8)}`,
                        duration: 1,
                        type: "debuff"
                    }
                });
                break;

            case 'silence':
                effects.push({
                    silence: {
                        id: `silence-${uuid4().substring(0, 8)}`,
                        duration: 2,
                        type: "debuff"
                    }
                });
                break;

            case 'blind':
                effects.push({
                    blind: {
                        id: `blind-${uuid4().substring(0, 8)}`,
                        duration: 2,
                        type: "debuff"
                    }
                });
                break;

            case 'heal_over_time':
                effects.push({
                    heal_over_time: {
                        id: `hot-${uuid4().substring(0, 8)}`,
                        duration: 3,
                        number_of_hits: 3,
                        type: "heal",
                        amount: [3, 5, 7, 10, 25, 50, 75],
                        level: Math.min(Math.ceil(level / 8), 7) || 1,
                        effect_based_on: 'maxhp'
                    }
                });
                break;

            case 'increase_stat': {
                const stats: Array<keyof Stats> = ['attack', 'defense', 'speed', 'magic', 'crit_chance', 'crit_damage'];
                const stat = stats[Math.floor(Math.random() * stats.length)];

                effects.push({
                    increase_stat: {
                        id: `buff-${stat}-${uuid4().substring(0, 8)}`,
                        duration: 3,
                        stat,
                        type: 'buff',
                        amount: [10, 20, 30, 50, 70, 100, 150, 200, 500, 1000, 2500],
                        level: Math.min(Math.ceil(level / 5), 11) || 1
                    }
                });
                break;
            }

            case 'decrease_stat': {
                const stats: Array<keyof Stats> = ['attack', 'defense', 'speed'];
                const stat = stats[Math.floor(Math.random() * stats.length)];

                effects.push({
                    decrease_stat: {
                        id: `debuff-${stat}-${uuid4().substring(0, 8)}`,
                        duration: 2,
                        stat,
                        type: 'debuff',
                        amount: [5, 10, 25, 50, 75, 90, 99],
                        level: Math.min(Math.ceil(level / 7), 7) || 1
                    }
                });
                break;
            }
        }
    }

    return effects;
};

// Interface for skill generation parameters
export interface SkillGenParams {
    level?: number;
    effectType?: 'damage' | 'heal' | 'buff' | 'debuff';
    damageType?: TypeOfDamage;
    minLevel?: number;
}

/**
 * Generate a random skill based on parameters
 * @param params Parameters to guide skill generation
 */
export function generateRandomSkill(params?: SkillGenParams): Skill {
    // Default to level 1 if not specified
    const level = params?.level || 1;
    const minLevel = params?.minLevel || Math.max(1, level - 5);
    // Determine effect type (damage, heal, buff, debuff)
    const effectType = params?.effectType || (['damage', 'heal', 'buff', 'debuff'][Math.floor(Math.random() * 4)] as 'damage' | 'heal' | 'buff' | 'debuff');

    // For damage skills, determine damage type
    let damageType: TypeOfDamage | undefined;
    if (effectType === 'damage') {
        damageType = params?.damageType || TYPE_OF_DAMAGE[Math.floor(Math.random() * TYPE_OF_DAMAGE.length)];
    }

    // Generate a name for the skill
    let name: string;
    if (effectType === 'damage' && damageType) {
        const nameList = SKILL_NAMES.damage[damageType];
        name = nameList[Math.floor(Math.random() * nameList.length)];
    } else if (effectType === 'heal') {
        const nameList = SKILL_NAMES.heal;
        name = nameList[Math.floor(Math.random() * nameList.length)];
    } else if (effectType === 'buff') {
        const nameList = SKILL_NAMES.buff;
        name = nameList[Math.floor(Math.random() * nameList.length)];
    } else {
        const nameList = SKILL_NAMES.debuff;
        name = nameList[Math.floor(Math.random() * nameList.length)];
    }

    // Generate a description
    let description: string;
    if (effectType === 'damage' && damageType) {
        const descList = SKILL_DESCRIPTIONS.damage[damageType];
        description = descList[Math.floor(Math.random() * descList.length)];
    } else if (effectType === 'heal') {
        const descList = SKILL_DESCRIPTIONS.heal;
        description = descList[Math.floor(Math.random() * descList.length)];
    } else if (effectType === 'buff') {
        const descList = SKILL_DESCRIPTIONS.buff;
        description = descList[Math.floor(Math.random() * descList.length)];
    } else {
        const descList = SKILL_DESCRIPTIONS.debuff;
        description = descList[Math.floor(Math.random() * descList.length)];
    }

    // Calculate effect value based on level and effect type
    const effectValue = calculateEffectValue(level, effectType);

    // Calculate mana cost based on level and effect type
    const manaCost = calculateManaCost(level, effectType, damageType);

    // Calculate cooldown
    const cooldown = calculateCooldown(effectType, damageType);

    // Generate status effects
    const statusEffects = generateStatusEffects(effectType, damageType, level);

    // Generate the skill
    return {
        id: "skill_"+uuid4(),
        level: 1,
        name,
        description,
        levelRequired: minLevel,
        manaCost,
        cooldown,
        class: 'skill', // Class to differentiate from items and equipment
        type: 'active', // Could randomly select passive sometimes too
        damage_type: damageType || 'physical', // Default for non-damage skills
        statusEffects,
        effects: {
            type: effectType,
            value: effectValue,
            duration: effectType === 'buff' || effectType === 'debuff' ? 3 : 0,
            number_of_hits: effectType === 'damage' || effectType === 'heal' ? 1 : undefined
        },
        actionCooldown: calculateActionCooldown(effectType, damageType) // Add actionCooldown for turn system
    };
}

/**
 * Generate a set of skills appropriate for a player level
 * @param level Player level
 * @param count Number of skills to generate
 */
export function generatePlayerSkills(level: number, count: number = 3): Skill[] {
    const skills: Skill[] = [];

    // Always include at least one damage skill
    skills.push(generateRandomSkill({
        level,
        effectType: 'damage',
        minLevel: Math.max(1, level - 5)
    }));

    // Generate the rest randomly
    for (let i = 1; i < count; i++) {
        skills.push(generateRandomSkill({
            level,
            minLevel: Math.max(1, level - 5)
        }));
    }

    return skills;
}

/**
 * Generate skills for an enemy based on their level
 * @param level Enemy level
 */
export function generateEnemySkills(level: number): Skill[] {
    const skillCount = Math.floor(Math.random() * 2) + 1; // 1-2 skills
    return generatePlayerSkills(level, skillCount);
}

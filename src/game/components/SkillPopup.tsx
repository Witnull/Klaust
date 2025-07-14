import React from 'react';
import { Skill } from '../types/GameTypes';
import { TagPfx } from '../types/GamePrefixCSS';
import { capitalizeFirstLetter } from '../utils/utils';

interface SkillPopupProps {
    skill: Skill;
    onEquip?: () => void;
    onUnequip?: () => void;
    onDelete?: () => void;
}

export const SkillPopup: React.FC<SkillPopupProps> = ({ skill, onEquip, onUnequip, onDelete }) => {
    return (
        <div className="w-full h-full">
            <div className="text-lg font-bold text-blue-400">{capitalizeFirstLetter(skill.name)}</div>
            <div className='flex gap-2'>
                <span className={`${TagPfx} bg-blue-700 text-blue-200`}>Skill</span>
                <span className={`${TagPfx} bg-purple-700 text-purple-200`}>{capitalizeFirstLetter(skill.type)}</span>
                {skill.damage_type && (
                    <span className={`${TagPfx} ${skill.damage_type === 'physical' ? 'bg-red-700 text-red-200' :
                            skill.damage_type === 'magical' ? 'bg-indigo-700 text-indigo-200' :
                                'bg-purple-700 text-purple-200'
                        }`}>
                        {capitalizeFirstLetter(skill.damage_type)}
                    </span>
                )}
            </div>

            {skill.levelRequired > 0 && <p className="text-sm text-gray-300 font-bold">Required Level: {skill.levelRequired}</p>}
            <p className="text-sm text-gray-300">Mana Cost: {Math.floor(skill.manaCost)}</p>
            <p className="text-sm text-gray-300">Cooldown: {skill.cooldown}s</p>

            {skill.description && (
                <div className="mt-1 text-sm text-gray-300">
                    <p>{skill.description}</p>
                </div>
            )}

            <div className="mt-2 max-h-32 overflow-y-auto">
                <p className="text-sm">
                    {skill.effects.type === 'damage' && `Deals ${Math.floor(skill.effects.value)} ${skill.damage_type} damage`}
                    {skill.effects.type === 'heal' && `Heals for ${Math.floor(skill.effects.value)} HP`}
                    {skill.effects.type === 'buff' && `Buffs for ${skill.effects.duration}s`}
                    {skill.effects.type === 'debuff' && `Debuffs for ${skill.effects.duration}s`}
                </p>

                {skill.statusEffects && skill.statusEffects.length > 0 && (
                    <div className="mt-1">
                        <p className="text-sm font-semibold">Status Effects:</p>
                        {skill.statusEffects.map((effect, index) => (
                            <div key={index} className="text-xs mt-1">
                                {Object.entries(effect).map(([effectName, effectData]) => (
                                    effectName !== 'id' && (
                                        <p key={effectName}>
                                            {capitalizeFirstLetter(effectName)}: {
                                                typeof effectData === 'object'
                                                    ? JSON.stringify(effectData)
                                                    : effectData
                                            }
                                        </p>
                                    )
                                ))}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {onEquip && (
                <button
                    onClick={onEquip}
                    className="mt-2 bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                >
                    Equip
                </button>
            )}
            {onUnequip && (
                <button
                    onClick={onUnequip}
                    className="mt-2 bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 ml-2"
                >
                    Unequip
                </button>
            )}
            {onDelete && (
                <button
                    onClick={onDelete}
                    className="mt-2 bg-yellow-600 text-white px-3 py-1 rounded hover:bg-yellow-700 ml-2"
                >
                    Delete
                </button>
            )}
        </div>
    );
};

export default SkillPopup;

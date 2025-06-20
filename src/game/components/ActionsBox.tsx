import React, { useState } from "react";
import { playerDataManager } from "../managers/PlayerDataManager";
import { combatEvent } from "../EventBus";
import { PlayerData, EnemyData, Skill } from "../types/GameTypes";

interface ActionsBoxProps {
    player: PlayerData;
    enemy: EnemyData;
    currentTurn: "player" | "enemy";
}

export const ActionsBox: React.FC<ActionsBoxProps> = ({ player, enemy: _, currentTurn }) => {
    // State to keep track of which section is active (skills or consumables)
    const [activeTab, setActiveTab] = useState<'skills' | 'consumables'>('skills');

    // Action Handlers
    const handleNormalAttack = () => combatEvent.emit('normalAttack');
    const handleUseSkill = (skillId: string) => combatEvent.emit('useSkill', skillId);
    const handleFlee = () => combatEvent.emit('flee');
    const handleUseConsumable = (itemId: string) => combatEvent.emit('useConsumable', itemId);

    // Helper function to get cooldown display text
    const getCooldownText = (skill: Skill): string | null => {
        const cooldownRemaining = skill.actionCooldown || 0;
        return cooldownRemaining ? `${cooldownRemaining}` : null;
    };

    // Helper function to check if a skill is on cooldown
    const isSkillOnCooldown = (skill: Skill): boolean => {
        const cooldownRemaining = (skill as any).cooldownRemaining || 0;
        return cooldownRemaining > 0;
    };

    // Helper function to render skill buttons
    const renderSkillButtons = () => {
        if (!player.equippedSkills || player.equippedSkills.filter(skill => skill !== null).length === 0) {
            return (
                <div className="col-span-2 h-12 flex items-center justify-center text-gray-400 border border-gray-700 rounded-lg bg-gray-800/40">
                    No skills equipped
                </div>
            );
        }

        return player.equippedSkills
            .filter(skill => skill !== null)
            .map((skill) => {
                // Determine button color based on skill type
                let buttonClass = "relative w-full h-12 ";
                if (skill.effects.type === 'damage') {
                    if (skill.damage_type === 'physical') {
                        buttonClass += "bg-gradient-to-r from-red-800 to-gray-700";
                    } else if (skill.damage_type === 'magical') {
                        buttonClass += "bg-gradient-to-r from-indigo-800 to-gray-700";
                    } else if (skill.damage_type === 'true') {
                        buttonClass += "bg-gradient-to-r from-purple-800 to-gray-700";
                    }
                } else if (skill.effects.type === 'heal') {
                    buttonClass += "bg-gradient-to-r from-green-800 to-gray-700";
                } else if (skill.effects.type === 'buff') {
                    buttonClass += "bg-gradient-to-r from-blue-800 to-gray-700";
                } else if (skill.effects.type === 'debuff') {
                    buttonClass += "bg-gradient-to-r from-yellow-800 to-gray-700";
                }

                buttonClass += " hover:to-amber-600 text-white py-1 px-2 rounded-md shadow-md transition-colors duration-200 overflow-hidden";

                // Disable button if not player's turn, not enough mana, or on cooldown
                const isDisabled = currentTurn !== 'player' || player.stats.mana < skill.manaCost;
                const onCooldown = isSkillOnCooldown(skill);
                const cooldownText = getCooldownText(skill);

                return (
                    <button
                        key={skill.id}
                        onClick={() => handleUseSkill(skill.id)}
                        className={`${buttonClass} ${(isDisabled || onCooldown) ? 'opacity-50 cursor-not-allowed' : ''}`}
                        disabled={isDisabled || onCooldown}
                        title={skill.description || skill.name}
                    >
                        <div className="flex justify-between items-center">
                            <div className="">
                                <p className="text-sm font-semibold">{skill.name}</p>
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-cyan-400 font-semibold">-{skill.manaCost} Mp</span>
                                    {cooldownText && (
                                        <span className={`${onCooldown ? 'text-red-400' : 'text-green-400'} font-semibold ml-2`}>
                                            {cooldownText}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </button>
                );
            });
    };

    // Helper function to render consumable buttons
    const renderConsumableButtons = () => {
        if (!player.equippedConsumables || player.equippedConsumables.filter(item => item !== null).length === 0) {
            return (
                <div className="col-span-2 h-12 flex items-center justify-center text-gray-400 border border-gray-700 rounded-lg bg-gray-800/40">
                    No consumables equipped
                </div>
            );
        }

        return player.equippedConsumables
            .filter(item => item !== null)
            .map(item => {
                if (!item) return null;

                let buttonClass = "relative w-full h-12 ";

                // Style consumables based on their effect
                if (item.stats?.mainStat?.hp) {
                    buttonClass += "bg-gradient-to-r from-green-800 to-gray-700";
                } else if (item.stats?.mainStat?.mana) {
                    buttonClass += "bg-gradient-to-r from-blue-800 to-gray-700";
                } else {
                    buttonClass += "bg-gradient-to-r from-amber-800 to-gray-700";
                }

                buttonClass += " hover:to-amber-600 text-white py-1 px-2 rounded-md shadow-md transition-colors duration-200 overflow-hidden";

                // Disable button if not player's turn
                const isDisabled = currentTurn !== 'player';

                return (
                    <button
                        key={item.id}
                        onClick={() => handleUseConsumable(item.id)}
                        className={`${buttonClass} ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                        disabled={isDisabled}
                    >
                        <div className="flex justify-between items-center">
                            <div className="flex-1">
                                <p className="text-sm font-semibold">{item.name}</p>
                                <span className="text-xs">
                                    {item.stats?.mainStat?.hp
                                        ? `+${item.stats.mainStat.hp} HP`
                                        : item.stats?.mainStat?.mana
                                            ? `+${item.stats.mainStat.mana} MP`
                                            : 'Consumable'
                                    }
                                </span>
                            </div>
                        </div>
                    </button>
                );
            });
    };

    return (
        <div className="w-full flex flex-col gap-1">
            {/* Main action buttons row */}
            <div className="grid grid-cols-3 items-end gap-2 mb-1">
                <button
                    onClick={() => setActiveTab('skills')}
                    className={` col-span-1 h-2/3 text-sm font-semibold rounded-md transition-colors  ${activeTab === 'skills' ? 'bg-blue-700 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                >
                    Skills
                </button>

                <button
                    onClick={handleNormalAttack}
                    className="col-span-1 h-full bg-gradient-to-r from-gray-500 to-gray-700 hover:to-amber-600 text-white py-1 px-3 rounded-md shadow-md transition-colors duration-200 overflow-hidden"
                    disabled={currentTurn !== 'player'}
                >
                    <div className="flex justify-between items-center">
                        <div>
                            <p className="font-semibold text-base text-gray-200">Attack</p>
                            <span className="text-sm font-semibold text-cyan-400">+{playerDataManager.calcManaGain(player)} Mp</span>
                        </div>
                       <svg className="h-10 w-10" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path fill-rule="evenodd" clip-rule="evenodd" d="M19 1.48416e-05L23 0C23.2652 -9.53668e-07 23.5195 0.105355 23.7071 0.292891C23.8946 0.480426 24 0.73478 24 0.999997L24 5.00001C24 5.26523 23.8946 5.51958 23.7071 5.70712L11.9142 17.5L13.7071 19.2929C14.0976 19.6834 14.0976 20.3166 13.7071 20.7071C13.3166 21.0977 12.6834 21.0977 12.2929 20.7071L9.79289 18.2071L9.46376 17.878L5.9999 20.9955C6.00096 21.7635 5.70873 22.534 5.12132 23.1214C3.94975 24.293 2.05025 24.293 0.87868 23.1214C-0.292893 21.9498 -0.292893 20.0503 0.87868 18.8787C1.46607 18.2913 2.23647 17.9991 3.00451 18.0002L6.12202 14.5363L5.79287 14.2071L3.29289 11.7071C2.90237 11.3166 2.90237 10.6834 3.29289 10.2929C3.68342 9.90239 4.31658 9.90239 4.70711 10.2929L6.49998 12.0858L18.2929 0.292907C18.4804 0.105372 18.7348 1.57952e-05 19 1.48416e-05ZM7.91419 13.5L8.2071 13.7929L10.2071 15.7929L10.5 16.0858L22 4.5858L22 2L19.4142 2.00001L7.91419 13.5ZM7.53819 15.9524L5.00435 18.7678C5.0441 18.8035 5.08311 18.8405 5.12132 18.8787C5.15952 18.9169 5.19648 18.9559 5.23221 18.9957L8.04759 16.4618L7.53819 15.9524ZM3.20676 20.0214C2.88445 19.954 2.54009 20.0458 2.29289 20.293C1.90237 20.6835 1.90237 21.3166 2.29289 21.7072C2.68342 22.0977 3.31658 22.0977 3.70711 21.7072C3.95431 21.46 4.0461 21.1156 3.97862 20.7933C3.94032 20.6103 3.85075 20.4366 3.70711 20.293C3.56346 20.1493 3.3897 20.0597 3.20676 20.0214Z" fill="hsla(0,0%,0%,1)"></path> </g></svg>
                    </div>
                </button>

                <button
                    onClick={() => setActiveTab('consumables')}
                    className={`col-span-1 h-2/3  text-sm font-semibold rounded-md transition-colors ${activeTab === 'consumables' ? 'bg-green-700 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                >
                    Items
                </button>
            </div>
            {/* Skills and consumables section */}
            <div className="grid grid-cols-2 gap-2 mt-1">
                {activeTab === 'skills' ? renderSkillButtons() : renderConsumableButtons()}
            </div>

            {/* Flee button */}
            <div className="flex justify-end mb-1">
                <button
                    onClick={handleFlee}
                    className="w-24 h-8 bg-gradient-to-r from-red-900 to-gray-700 hover:to-amber-600 text-white py-1 px-2 rounded-md shadow-md transition-colors duration-200 text-sm"
                    disabled={currentTurn !== 'player'}
                >
                    <div className="flex justify-between items-center">
                        <span>Flee</span>
                        <span className="text-xs">50%</span>
                    </div>
                </button>
            </div>


        </div>
    );
};

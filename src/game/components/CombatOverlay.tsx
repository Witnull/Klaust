import React, { useState, useEffect, useRef } from "react";
import { combatEvent } from "../EventBus";
import { EnemyData, PlayerData } from "../types/GameTypes";
import { playerDataManager } from "../managers/PlayerDataManager";

interface DamagePopup {
    id: string;
    target: string;
    damage: number;
    x: number;
    y: number;
    opacity: number;
    duration: number; // Time remaining for animation
}



const CombatOverlay: React.FC = () => {
    const [inCombat, setInCombat] = useState(false);    const [player, setPlayer] = useState<PlayerData | null>(null);
    const [enemy, setEnemy] = useState<EnemyData | null>(null);
    const [isEnemyShaking, setIsEnemyShaking] = useState(false); // Track shake effect for enemy
    const [damagePopups, setDamagePopups] = useState<DamagePopup[]>([]);
    const [turnOrder, setTurnOrder] = useState<Array<{name: "player" | "enemy", number: number}>>([]);
    const [currentTurn, setCurrentTurn] = useState<"player" | "enemy">("player");
    const [activeEffects, setActiveEffects] = useState<Array<{id: string, type: string, duration: number, target: string}>>([]);
    const combatLogRef = useRef<HTMLDivElement>(null);
    const popupIdCounter = useRef(0); // Counter for unique keys

    useEffect(() => {
        // Event Handlers
        const handleEnterCombat = ({ 
            player, 
            enemy, 
            turnOrder 
        }: { 
            player: PlayerData, 
            enemy: EnemyData, 
            turnOrder: Array<{name: "player" | "enemy", number: number}>
        }) => {
            setPlayer(player);
            setEnemy(enemy);
            setInCombat(true);
            setIsEnemyShaking(false);
            setDamagePopups([]);
            setTurnOrder(turnOrder);
            setCurrentTurn("player");
            setActiveEffects([]);
            if (combatLogRef.current) combatLogRef.current.innerHTML = ''; // Clear log on new combat
        };

        const handleCombatUpdate = ({ 
            player, 
            enemy, 
            currentTurn, 
            turnOrder 
        }: { 
            player: PlayerData, 
            enemy: EnemyData, 
            currentTurn?: "player" | "enemy",
            turnOrder?: Array<{name: "player" | "enemy", number: number}>
        }) => {
            setPlayer({ ...player });
            setEnemy({ ...enemy });
            setIsEnemyShaking(false);
            if (currentTurn) setCurrentTurn(currentTurn);
            if (turnOrder) setTurnOrder(turnOrder);
        };

        const handleCombatEnd = () => {
            setInCombat(false);
            setPlayer(null);
            setEnemy(null);
            setIsEnemyShaking(false);
            setDamagePopups([]);
            if (combatLogRef.current) combatLogRef.current.innerHTML = ''; // Clear log on combat end
        };

        const handleAttack = () => {
            setIsEnemyShaking(true);
            setTimeout(() => setIsEnemyShaking(false), 500);
        };        const handleShowDamage = (data: { 
            target: string, 
            attacker: string, 
            damage: number, 
            skill?: string 
        }) => {
            console.log(`CombatOverlay: showDamage received with attacker:${data.attacker}`);
            const enemyImage = document.querySelector('.enemy-image');
            const enemyRect = enemyImage?.getBoundingClientRect();
            const enemyClass = 'text-red-200 text-sm py-1';
            const playerClass = 'text-emerald-200 text-sm py-1';

            if (enemyRect) {
                // Calculate position relative to the enemy image's top-left corner
                let relativeX = Math.random() * enemyRect.width * 5;
                let relativeY = enemyRect.height;

                if (data.target == player?.name) {
                    relativeX = Math.random() * enemyRect.width * 4;
                    relativeY = enemyRect.height + 200;
                }

                const uniqueId = `${Date.now()}-${popupIdCounter.current++}`;
                setDamagePopups((prev) => [
                    ...prev,
                    { id: uniqueId, target: data.target, damage: data.damage, x: relativeX, y: relativeY, opacity: 1, duration: 3500 },
                ]);

                if (combatLogRef.current) {
                    const logEntry = document.createElement('p');
                    const skillText = data.skill ? ` using ${data.skill}` : '';
                    logEntry.textContent = `${data.attacker}${skillText}: dealt ${data.damage} damage to ${data.target}`;
                    logEntry.className = data.attacker === player?.name ? playerClass : enemyClass;
                    combatLogRef.current.appendChild(logEntry);
                    combatLogRef.current.scrollTop = combatLogRef.current.scrollHeight;
                }
            }
        };

        const handleApplyStatusEffect = (data: {
            target: string,
            effectId: string,
            type: string,
            effectType?: string,
            duration: number,
            amount?: number
        }) => {
            console.log(`Status effect applied: ${data.effectType || data.type} on ${data.target} for ${data.duration} seconds`);
            
            // Add effect to active effects list
            setActiveEffects(prev => [...prev, {
                id: data.effectId,
                type: data.effectType || data.type,
                duration: data.duration,
                target: data.target
            }]);
            
            // Add to combat log
            if (combatLogRef.current) {
                const logEntry = document.createElement('p');
                const effectClass = data.type === 'buff' ? 'text-blue-200 text-sm py-1' : 
                                  data.type === 'debuff' ? 'text-purple-200 text-sm py-1' : 
                                  data.type === 'heal' ? 'text-green-200 text-sm py-1' : 
                                  'text-orange-200 text-sm py-1';
                                  
                logEntry.textContent = `${data.target} affected by ${data.effectType || data.type} for ${data.duration} seconds`;
                logEntry.className = effectClass;
                combatLogRef.current.appendChild(logEntry);
                combatLogRef.current.scrollTop = combatLogRef.current.scrollHeight;
            }
        };
        
        const handleShowBuff = (data: {
            target: string,
            stat: string,
            amount: number,
            duration: number
        }) => {
            console.log(`Buff applied: +${data.amount} ${data.stat} to ${data.target} for ${data.duration} seconds`);
            
            // Add to combat log
            if (combatLogRef.current) {
                const logEntry = document.createElement('p');
                logEntry.textContent = `${data.target} gained +${data.amount} ${data.stat} for ${data.duration} seconds`;
                logEntry.className = 'text-blue-200 text-sm py-1';
                combatLogRef.current.appendChild(logEntry);
                combatLogRef.current.scrollTop = combatLogRef.current.scrollHeight;
            }
        };
        
        const handleShowDebuff = (data: {
            target: string,
            stat: string,
            amount: number,
            duration: number
        }) => {
            console.log(`Debuff applied: -${data.amount} ${data.stat} to ${data.target} for ${data.duration} seconds`);
            
            // Add to combat log
            if (combatLogRef.current) {
                const logEntry = document.createElement('p');
                logEntry.textContent = `${data.target} suffered -${data.amount} ${data.stat} for ${data.duration} seconds`;
                logEntry.className = 'text-purple-200 text-sm py-1';
                combatLogRef.current.appendChild(logEntry);
                combatLogRef.current.scrollTop = combatLogRef.current.scrollHeight;
            }
        };
        
        const handleShowHeal = (data: {
            target: string,
            amount: number
        }) => {
            console.log(`Healing: ${data.target} healed for ${data.amount}`);
            
            // Add to combat log
            if (combatLogRef.current) {
                const logEntry = document.createElement('p');
                logEntry.textContent = `${data.target} healed for ${data.amount} HP`;
                logEntry.className = 'text-green-200 text-sm py-1';
                combatLogRef.current.appendChild(logEntry);
                combatLogRef.current.scrollTop = combatLogRef.current.scrollHeight;
            }
        };        // Event Listeners
        combatEvent.on('enterCombat', handleEnterCombat);
        combatEvent.on('combatUpdate', handleCombatUpdate);
        combatEvent.on('combatEnd', handleCombatEnd);
        combatEvent.on('normalAttack', handleAttack);
        combatEvent.on('useSkill', handleAttack);
        combatEvent.on('showDamage', handleShowDamage);
        combatEvent.on('applyStatusEffect', handleApplyStatusEffect);
        combatEvent.on('showBuff', handleShowBuff);
        combatEvent.on('showDebuff', handleShowDebuff);
        combatEvent.on('showHeal', handleShowHeal);

        return () => {
            combatEvent.off('enterCombat', handleEnterCombat);
            combatEvent.off('combatUpdate', handleCombatUpdate);
            combatEvent.off('combatEnd', handleCombatEnd);
            combatEvent.off('normalAttack', handleAttack);
            combatEvent.off('useSkill', handleAttack);
            combatEvent.off('showDamage', handleShowDamage);
            combatEvent.off('applyStatusEffect', handleApplyStatusEffect);
            combatEvent.off('showBuff', handleShowBuff);
            combatEvent.off('showDebuff', handleShowDebuff);
            combatEvent.off('showHeal', handleShowHeal);
        };
    }, [player?.name, enemy?.name]); // Dependencies for log text

    useEffect(() => {
        let animationFrameId: number;
        const animatePopups = () => {
            setDamagePopups((prev) =>
                prev
                    .map((popup) => ({
                        ...popup,
                        y: popup.y - 1, // Move up relative to initial position
                        opacity: Math.max(0, popup.opacity - 0.02),
                        duration: popup.duration - 16,
                    }))
                    .filter((popup) => popup.duration > 0 && popup.opacity > 0)
            );
            animationFrameId = requestAnimationFrame(animatePopups);
        };
        animationFrameId = requestAnimationFrame(animatePopups);
        return () => cancelAnimationFrame(animationFrameId);
    }, []);    // Action Handlers
    const handleNormalAttack = () => combatEvent.emit('normalAttack');
    const handleUseSkill = (skillId: string) => combatEvent.emit('useSkill', skillId);
    const handleFlee = () => combatEvent.emit('flee');
    const handleUseConsumable = (itemId: string) => combatEvent.emit('useConsumable', itemId);


    if (!inCombat || !player || !enemy) return null;
    const p_hpPercent = (player.stats.hp / player.stats.max_hp) * 100;
    const p_manaPercent = (player.stats.mana / player.stats.max_mana) * 100;

    const e_hpPercent = (enemy.stats.hp / enemy.stats.max_hp) * 100;
    const e_manaPercent = (enemy.stats.mana / enemy.stats.max_mana) * 100;

    return (
        <div className="absolute inset-0 z-50 flex justify-center items-center bg-black/75">

            <div className="grid grid-cols-7 gap-6 w-[80%] h-[90%] max-h-[650px]">

                {/* Combat Info Box */}
                <div className="col-span-2 flex items-center justify-center text-gray-300">
                    <div className="w-full h-[80%] rounded-xl bg-gray-800 p-4">
                        <div className="text-lg font-bold text-teal-400 mb-2">Combat Info</div>

                        <div className="flex flex-col justify-between h-[90%] overflow-y-auto">
                            {/* Enemy Info */}
                            <div className="">

                                <div className="">
                                    <p className="text-base font-medium">
                                        Hp: {enemy.stats.hp} / {enemy.stats.max_hp}
                                    </p>
                                    <div className="w-full h-2 bg-gray-600 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-red-400 to-green-500 rounded-full transition-all duration-300"
                                            style={{ width: `${e_hpPercent}%` }}
                                        />
                                    </div>
                                </div>

                                <div className="">
                                    <p className="text-base font-medium">
                                        Mp: {enemy.stats.mana} / {enemy.stats.max_mana}
                                    </p>
                                    <div className="w-full h-2 bg-gray-600 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-cyan-500 rounded-full transition-all duration-300"
                                            style={{ width: `${e_manaPercent}%` }}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Turn Order Info */}
                            <div className="mb-4">
                                <h3 className="text-md font-semibold text-yellow-300 mb-1">Turn Order</h3>
                                <div className="bg-gray-700/40 rounded-lg p-2 mb-2">
                                    <div className="flex items-center mb-2">
                                        <div className={`w-3 h-3 rounded-full mr-2 ${currentTurn === 'player' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                        <span className={`${currentTurn === 'player' ? 'text-green-300 font-bold' : 'text-red-300 font-bold'}`}>
                                            {currentTurn === 'player' ? 'Your Turn' : 'Enemy Turn'}
                                        </span>
                                    </div>
                                    
                                    <div className="flex flex-col gap-1">
                                        {turnOrder.slice(0, 3).map((turn, index) => (
                                            <div key={index} className="flex items-center">
                                                <span className="text-gray-400 mr-2">{index + 1}.</span>
                                                <span className={`${turn.name === 'player' ? 'text-blue-300' : 'text-red-300'}`}>
                                                    {(turn.name === 'player' ? player.name: enemy.name ) + "[" + turn.number + "]"}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Active Effects */}
                            <div className="mb-4">
                                <h3 className="text-md font-semibold text-yellow-300 mb-1">Active Effects</h3>
                                <div className="bg-gray-700/40 rounded-lg p-2">
                                    {activeEffects.length > 0 ? (
                                        <div className="flex flex-col gap-1">
                                            {activeEffects.map((effect, index) => {
                                                // Determine effect color based on type
                                                const effectColor = 
                                                    effect.type === 'buff' || effect.type === 'heal' || effect.type === 'heal_over_time' ? 'text-green-300' :
                                                    effect.type === 'debuff' || effect.type === 'stun' || effect.type === 'silence' ? 'text-purple-300' :
                                                    effect.type === 'burn' ? 'text-red-300' :
                                                    effect.type === 'poison' ? 'text-green-500' :
                                                    effect.type === 'chill' || effect.type === 'freeze' ? 'text-blue-300' :
                                                    effect.type === 'bleed' ? 'text-red-500' :
                                                    'text-white';
                                                
                                                return (
                                                    <div key={index} className="flex justify-between">
                                                        <span className={effectColor}>{effect.type}</span>
                                                        <span className="text-gray-400">
                                                            {effect.duration}s on {effect.target === player.name ? 'you' : 'enemy'}
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <div className="text-gray-400 text-sm">No active effects</div>
                                    )}
                                </div>
                            </div>

                            {/* Player Stats */}
                            <div>
                                <div className="mt-2 grid grid-cols-9 grid-rows-2 gap-1 overflow-hidden">
                                    {/* Player effects */}
                                </div>
                                <div className="grid grid-cols-3 text-sm font-medium">
                                    <p>Attack: {playerDataManager.calcAttack(player)}</p>
                                    <p>Magic: {playerDataManager.calcMagic(player)}</p>
                                    <p>Defense: {playerDataManager.calcDefense(player)}</p>
                                    <p>Speed: {playerDataManager.calcSpeed(player)}</p>
                                    <p>Crit: {playerDataManager.calcCrit(player)}%</p>
                                    <p>CritDmg: {playerDataManager.calcCritDamage(player)}%</p>
                                </div>

                                <div className="f">
                                    <p className="text-base font-medium">
                                        Hp: {player.stats.hp} / {playerDataManager.calcMaxHP(player)}
                                    </p>
                                    <div className="w-full h-2 bg-gray-600 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-red-400 to-green-500 rounded-full transition-all duration-300"
                                            style={{ width: `${p_hpPercent}%` }}
                                        />
                                    </div>
                                </div>

                                <div className="">
                                    <p className="text-base font-medium">
                                        Mp: {player.stats.mana} / {playerDataManager.calcmax_mana(player)}
                                    </p>
                                    <div className="w-full h-2 bg-gray-600 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-cyan-500 rounded-full transition-all duration-300"
                                            style={{ width: `${p_manaPercent}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Stats Box */}
                <div className="col-span-3 h-full flex flex-col overflow-hidden bg-gray-800 rounded-xl p-6 text-gray-200 cursor-default select-none">
                    <div className="text-xl text-center font-bold mb-4">
                        {enemy.name} - Lv.{enemy.level}
                    </div>


                    {/* Enemy Image */}
                    <div className="relative w-full h-64 bg-gray-700/40 flex items-center justify-center rounded-lg transition-transform duration-500 mb-4">
                        <img
                            src="/assets/sprites/enemy.png"
                            alt="Enemy"
                            className={`min-w-30 min-h-30 max-w-full max-h-full object-contain enemy-image ${isEnemyShaking ? 'animate-shake' : ''}`}
                        />
                        {damagePopups.map((popup) => (
                            <div
                                key={popup.id}
                                className={`absolute ${popup.target == enemy.name ? "text-red-600" : "text-yellow-700"} text-5xl font-bold pointer-events-none`}
                                style={{
                                    left: `${popup.x}px`,
                                    top: `${popup.y}px`,
                                    opacity: popup.opacity,
                                    transform: 'translate(50%, -50%)',
                                }}
                            >
                                -{popup.damage}
                            </div>
                        ))}
                    </div>


                    <div className="grid grid-cols-[1fr_2fr_1fr] gap-3">
                        <div className="flex items-center justify-center">
                            <button
                                onClick={handleNormalAttack}
                                className="relative w-full h-16 bg-gradient-to-r from-gray-700 to-gray-600 hover:to-amber-600 text-white py-2 px-4 rounded-lg shadow-lg transition-colors duration-200 overflow-hidden"
                            >
                                <div className="absolute inset-0 flex items-center justify-end p-2">
                                    <svg className="w15 h-15" fill="#1C274C" viewBox="0 0 256 256" id="Flat" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M224.48535,31.51465A11.9987,11.9987,0,0,0,216,28h-.03809l-63.79882.20117a11.99773,11.99773,0,0,0-8.84082,3.92774l-71.53418,78.6875-1.64649-1.64649a20.02681,20.02681,0,0,0-28.28418.002L25.17285,125.85645a19.9986,19.9986,0,0,0-.001,28.28515l14.05859,14.05957L20.11719,187.31348a20.02339,20.02339,0,0,0,0,28.28466l20.28515,20.2837a19.9992,19.9992,0,0,0,28.28418.00048l19.11231-19.11279,14.05957,14.06055a20.02636,20.02636,0,0,0,28.28418-.002l16.68457-16.68457a19.9986,19.9986,0,0,0,.001-28.28515l-1.645-1.64551,78.688-71.53418a12.00066,12.00066,0,0,0,3.92774-8.8418L228,40.03809A12.00167,12.00167,0,0,0,224.48535,31.51465ZM116,211.02979,101.94141,196.9707a19.9986,19.9986,0,0,0-28.28418,0L54.544,216.083,39.916,201.45605,59.0293,182.34277a20.02222,20.02222,0,0,0,0-28.28369L44.9707,140,56,128.97021l35.51221,35.5127.00244.00244.00244.00244L127.0293,200Zm87.81543-112.5542-75.62207,68.74707L116.9707,156l51.51465-51.51465a12.0001,12.0001,0,0,0-16.9707-16.9707L100,139.0293,88.77734,127.80615l68.74707-75.62158,46.4375-.14648Z"></path> </g></svg>                  </div>
                                <p className="relative z-10 text-left font-semibold text-lg text-gray-200">
                                    Attack
                                    <span className="block text-xs">+{playerDataManager.calcManaGain(player)} mana</span>
                                </p>
                            </button>
                        </div>                        <div className="grid grid-cols-2 gap-3">
                            {/* Dynamic skill buttons - show equipped skills instead of first 2 */}
                            {player.equippedSkills && player.equippedSkills.filter(skill => skill !== null).map((skill) => {
                                // Determine button color based on skill type
                                let buttonClass = "relative w-full h-16 ";
                                if (skill.effects.type === 'damage') {
                                    if (skill.damage_type === 'physical') {
                                        buttonClass += "bg-gradient-to-r from-red-800 to-gray-600";
                                    } else if (skill.damage_type === 'magical') {
                                        buttonClass += "bg-gradient-to-r from-indigo-800 to-gray-600";
                                    } else if (skill.damage_type === 'true') {
                                        buttonClass += "bg-gradient-to-r from-purple-800 to-gray-600";
                                    }
                                } else if (skill.effects.type === 'heal') {
                                    buttonClass += "bg-gradient-to-r from-green-800 to-gray-600";
                                } else if (skill.effects.type === 'buff') {
                                    buttonClass += "bg-gradient-to-r from-blue-800 to-gray-600";
                                } else if (skill.effects.type === 'debuff') {
                                    buttonClass += "bg-gradient-to-r from-yellow-800 to-gray-600";
                                }
                                
                                buttonClass += " hover:to-amber-600 text-white py-2 px-4 rounded-lg shadow-lg transition-colors duration-200 overflow-hidden";
                                
                                // Disable button if not player's turn or not enough mana
                                const isDisabled = currentTurn !== 'player' || player.stats.mana < skill.manaCost;
                                
                                return (
                                    <button
                                        key={skill.id}
                                        onClick={() => handleUseSkill(skill.id)}
                                        className={buttonClass + (isDisabled ? ' opacity-50 cursor-not-allowed' : '')}
                                        disabled={isDisabled}
                                    >
                                        <div className="absolute inset-0 flex items-center justify-end p-2">
                                            {/* SVG icon based on skill type */}
                                            {skill.effects.type === 'damage' && skill.damage_type === 'magical' && (
                                                <svg className="w15 h-15" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M3 13.1111C3 20.2222 8.28889 22 10.9333 22C12.2874 22 14.2481 21.6432 16 20.6097M18.7207 18C19.5021 16.7537 20 15.152 20 13.1111C20 8.58427 17.1653 5.35127 14.6023 3.49767C13.4438 2.65985 12 3.58 12 5.00971V5.33334C12 6.7752 11.3938 9.40705 9.70932 10.5017C8.84932 11.0606 7.92052 10.2241 7.816 9.20382L7.73017 8.36598C7.6304 7.39197 6.63841 6.80069 5.85996 7.39454C5.18794 7.90718 4.50139 8.60486 3.96944 9.5" stroke="#1C274C" stroke-width="1.5" stroke-linecap="round"></path> <path d="M8 18.4445C8 21.2889 10.4889 22 11.7333 22C12.8222 22 15 21.2889 15 18.4445C15 17.3435 14.4107 16.6002 13.8404 16.1713C13.4424 15.872 12.8828 16.1408 12.7459 16.6196C12.5675 17.2437 11.9228 17.636 11.5944 17.0759C11.2941 16.5638 11.2941 15.7957 11.2941 15.3334C11.2941 14.6968 10.6539 14.2847 10.1389 14.6589C9.10649 15.4091 8 16.6815 8 18.4445Z" stroke="#1C274C" stroke-width="1.5"></path> </g></svg>
                                            )}
                                            {/* Add more SVG icons for other skill types */}
                                        </div>
                                        <p className="relative z-10 text-left font-semibold text-lg text-gray-200">
                                            {skill.name}
                                            <span className="block text-xs">{skill.manaCost} mana</span>
                                        </p>
                                    </button>
                                );
                            })}                            {/* If player has no equipped skills, show placeholders */}
                            {(!player.equippedSkills || player.equippedSkills.filter(skill => skill !== null).length === 0) && (
                                <>
                                    <div className="relative w-full h-16 bg-gray-700/50 text-white py-2 px-4 rounded-lg shadow-lg transition-colors duration-200 overflow-hidden flex items-center justify-center">
                                        <p className="text-gray-400 text-sm">No equipped skill</p>
                                    </div>
                                    <div className="relative w-full h-16 bg-gray-700/50 text-white py-2 px-4 rounded-lg shadow-lg transition-colors duration-200 overflow-hidden flex items-center justify-center">
                                        <p className="text-gray-400 text-sm">No equipped skill</p>
                                    </div>
                                </>
                            )}
                            
                            {/* Show only one placeholder if one skill is equipped */}
                            {(player.equippedSkills && player.equippedSkills.filter(skill => skill !== null).length === 1) && (
                                <div className="relative w-full h-16 bg-gray-700/50 text-white py-2 px-4 rounded-lg shadow-lg transition-colors duration-200 overflow-hidden flex items-center justify-center">
                                    <p className="text-gray-400 text-sm">No equipped skill</p>
                                </div>
                            )}
                            
                            {/* Consumable Items Section */}
                            <div className="mt-4">
                                <h3 className="text-sm font-bold text-yellow-300 mb-2">Consumable Items</h3>
                                <div className="grid grid-cols-2 gap-2">
                                    {player.equippedConsumables?.filter(item => item !== null).map(item => {
                                        if (!item) return null;
                                        
                                        let buttonClass = "relative h-16 ";
                                        
                                        // Style consumables based on their effect
                                        if (item.stats?.mainStat?.hp) {
                                            buttonClass += "bg-gradient-to-r from-green-800 to-gray-600";
                                        } else if (item.stats?.mainStat?.mana) {
                                            buttonClass += "bg-gradient-to-r from-blue-800 to-gray-600";
                                        } else {
                                            buttonClass += "bg-gradient-to-r from-amber-800 to-gray-600";
                                        }
                                        
                                        buttonClass += " hover:to-amber-600 text-white py-2 px-4 rounded-lg shadow-lg transition-colors duration-200 overflow-hidden";
                                        
                                        // Disable button if not player's turn
                                        const isDisabled = currentTurn !== 'player';
                                        
                                        return (
                                            <button
                                                key={item.id}
                                                onClick={() => handleUseConsumable(item.id)}
                                                className={buttonClass + (isDisabled ? ' opacity-50 cursor-not-allowed' : '')}
                                                disabled={isDisabled}
                                            >
                                                <div className="absolute inset-0 flex items-center justify-end p-2">
                                                    {/* SVG icon based on item effect */}
                                                    {item.stats?.mainStat?.hp && (
                                                        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9 12H15" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path><path d="M12 9L12 15" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path><path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="#ffffff" strokeWidth="1.5"></path></svg>
                                                    )}
                                                    {item.stats?.mainStat?.mana && (
                                                        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8.8 14C8.8 16.21 10.59 18 12.8 18H18C19.1 18 20 17.1 20 16V15C20 13.9 19.1 13 18 13H16C16 11.9 15.1 11 14 11H12C10.9 11 10 11.9 10 13V14H8.82998C8.83998 14 8.8 14 8.8 14Z" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path><path d="M4.8 14C4.8 11.79 6.59 10 8.8 10L10.69 10L12.2 8.5" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path><path d="M21.5 2.5L16 8" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path><path d="M15 2.5H21.5V9" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path></svg>
                                                    )}
                                                </div>
                                                <p className="relative z-10 text-left font-semibold text-lg text-gray-200">
                                                    {item.name}
                                                    <span className="block text-xs">{
                                                        item.stats?.mainStat?.hp 
                                                        ? `+${item.stats.mainStat.hp} HP` 
                                                        : item.stats?.mainStat?.mana 
                                                        ? `+${item.stats.mainStat.mana} MP` 
                                                        : 'Consumable'
                                                    }</span>
                                                </p>
                                            </button>
                                        );
                                    })}
                                    
                                    {/* If player has no equipped consumables, show placeholders */}
                                    {(!player.equippedConsumables || player.equippedConsumables.filter(item => item !== null).length === 0) && (
                                        <>
                                            <div className="relative w-full h-16 bg-gray-700/50 text-white py-2 px-4 rounded-lg shadow-lg transition-colors duration-200 overflow-hidden flex items-center justify-center">
                                                <p className="text-gray-400 text-sm">No consumable</p>
                                            </div>
                                            <div className="relative w-full h-16 bg-gray-700/50 text-white py-2 px-4 rounded-lg shadow-lg transition-colors duration-200 overflow-hidden flex items-center justify-center">
                                                <p className="text-gray-400 text-sm">No consumable</p>
                                            </div>
                                        </>
                                    )}
                                    
                                    {/* Show placeholders for remaining empty slots */}
                                    {player.equippedConsumables && player.equippedConsumables.filter(item => item !== null).length === 1 && (
                                        <div className="relative w-full h-16 bg-gray-700/50 text-white py-2 px-4 rounded-lg shadow-lg transition-colors duration-200 overflow-hidden flex items-center justify-center">
                                            <p className="text-gray-400 text-sm">No consumable</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center justify-center">
                            <button
                                onClick={handleFlee}
                                className="relative w-full h-16 bg-gradient-to-r from-gray-700 to-gray-600 hover:to-amber-600 text-white py-2 px-4 rounded-lg shadow-lg transition-colors duration-200 overflow-hidden"
                            >
                                <div className="absolute inset-0 flex items-center justify-end p-2">
                                    <svg className="w15 h-15" viewBox="0 0 24 24" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" fill="#000000"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <title>run_line</title> <g id="页面-1" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd"> <g id="Transport" transform="translate(-816.000000, 0.000000)"> <g id="run_line" transform="translate(816.000000, 0.000000)"> <path d="M24,0 L24,24 L0,24 L0,0 L24,0 Z M12.5934901,23.257841 L12.5819402,23.2595131 L12.5108777,23.2950439 L12.4918791,23.2987469 L12.4918791,23.2987469 L12.4767152,23.2950439 L12.4056548,23.2595131 C12.3958229,23.2563662 12.3870493,23.2590235 12.3821421,23.2649074 L12.3780323,23.275831 L12.360941,23.7031097 L12.3658947,23.7234994 L12.3769048,23.7357139 L12.4804777,23.8096931 L12.4953491,23.8136134 L12.4953491,23.8136134 L12.5071152,23.8096931 L12.6106902,23.7357139 L12.6232938,23.7196733 L12.6232938,23.7196733 L12.6266527,23.7031097 L12.609561,23.275831 C12.6075724,23.2657013 12.6010112,23.2592993 12.5934901,23.257841 L12.5934901,23.257841 Z M12.8583906,23.1452862 L12.8445485,23.1473072 L12.6598443,23.2396597 L12.6498822,23.2499052 L12.6498822,23.2499052 L12.6471943,23.2611114 L12.6650943,23.6906389 L12.6699349,23.7034178 L12.6699349,23.7034178 L12.678386,23.7104931 L12.8793402,23.8032389 C12.8914285,23.8068999 12.9022333,23.8029875 12.9078286,23.7952264 L12.9118235,23.7811639 L12.8776777,23.1665331 C12.8752882,23.1545897 12.8674102,23.1470016 12.8583906,23.1452862 L12.8583906,23.1452862 Z M12.1430473,23.1473072 C12.1332178,23.1423925 12.1221763,23.1452606 12.1156365,23.1525954 L12.1099173,23.1665331 L12.0757714,23.7811639 C12.0751323,23.7926639 12.0828099,23.8018602 12.0926481,23.8045676 L12.108256,23.8032389 L12.3092106,23.7104931 L12.3186497,23.7024347 L12.3186497,23.7024347 L12.3225043,23.6906389 L12.340401,23.2611114 L12.337245,23.2485176 L12.337245,23.2485176 L12.3277531,23.2396597 L12.1430473,23.1473072 Z" id="MingCute" fill-rule="nonzero"> </path> <path d="M13,2 C14.6569,2 16,3.34315 16,5 C16,6.4374176 14.989097,7.6387305 13.6394248,7.93171628 L13.469,7.96356 L14.9049,10.261 L16.6286,9.57152 C17.1414,9.36641 17.7234,9.61583 17.9285,10.1286 C18.11895,10.6047714 17.9175097,11.1406102 17.4771844,11.3789437 L17.3714,11.4285 L15.6477,12.118 C14.8018647,12.4562588 13.842291,12.1788775 13.3046353,11.4607677 L13.2089,11.321 L13.0463,11.0609 L12.4403,13.4851 C12.38606,13.7019 12.298348,13.901548 12.184076,14.0798456 L12.0935,14.2095 L13.7468,15.4376 C14.1430667,15.732 14.4146519,16.161037 14.5132351,16.640361 L14.542,16.8223 L14.895,20 L15,20 C15.5523,20 16,20.4477 16,21 C16,21.51285 15.613973,21.9355092 15.1166239,21.9932725 L15,22 L14.0895,22 C13.5690357,22 13.1258286,21.63665 13.0156081,21.1386974 L12.9962,21.0215 L12.5542,17.0431 L9.40368,14.7028 C9.34671,14.6605 9.29553,14.6132 9.2503,14.5621 C8.69851333,14.1200733 8.40463653,13.4019044 8.52705735,12.6715052 L8.55972,12.5149 L9.35399,9.33783 L7.78454,9.80867 L6.94868,12.3162 C6.77404,12.8402 6.20772,13.1233 5.68377,12.9487 C5.19725429,12.7864786 4.9183499,12.286602 5.0208232,11.7965551 L5.05132,11.6838 L5.88717,9.17621 C6.07583833,8.61019583 6.50617896,8.16078701 7.05678434,7.94576318 L7.20984,7.89302 L10.6474,6.86174 C10.2421,6.3502 10,5.70337 10,5 C10,3.34315 11.3431,2 13,2 Z M8.2,15.4 C8.53137,14.9582 9.15817,14.8686 9.6,15.2 C10.0078154,15.5059077 10.1155314,16.0635172 9.86903487,16.4949808 L9.8,16.6 L8.5838,18.2216 C8.13599375,18.8186938 7.32402148,18.990309 6.67848165,18.6455613 L6.55175,18.5697 L4.62197,17.2832 C4.22939,17.5957 3.65616,17.5704 3.29289,17.2071 C2.93241,16.8466385 2.90468077,16.2793793 3.20970231,15.8871027 L3.29289,15.7929 L3.7871,15.2987 C4.09658182,14.9892455 4.56555124,14.9173942 4.94922239,15.107564 L5.06152,15.1725 L7.26759,16.6432 L8.2,15.4 Z M13,4 C12.4477,4 12,4.44772 12,5 C12,5.55228 12.4477,6 13,6 C13.5523,6 14,5.55228 14,5 C14,4.44772 13.5523,4 13,4 Z" id="形状" fill="#09244B"> </path> </g> </g> </g> </g></svg>
                                </div>
                                <p className="relative z-10 text-left font-semibold text-lg text-gray-200">
                                    Flee
                                    <span className="block text-xs">50%</span>
                                </p>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Combat Log Box */}
                <div className="col-span-2 max-h-[650px] flex items-center justify-center">
                    <div className="w-full h-[80%] rounded-xl bg-gray-800 p-4">
                        <h3 className="text-lg font-bold text-teal-400">Combat Log</h3>
                        <div ref={combatLogRef} id="combatLog" className="w-full h-[95%] bg-gray-700/40 rounded-lg p-2 overflow-y-auto">
                        </div>
                    </div>
                </div>


            </div>
        </div>
    );
};


export default CombatOverlay;

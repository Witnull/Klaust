import React, { useState, useEffect, useRef } from "react";
import { combatEvent } from "../EventBus";
import { EnemyData, PlayerData } from "../types/GameTypes";
import { playerDataManager } from "../managers/PlayerDataManager";
import { ActionsBox } from "./ActionsBox";

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
    const [inCombat, setInCombat] = useState(false);
    const [combatResult, setCombatResult] = useState<"victory" | "defeat" | "fled" | null>(null);
    const [player, setPlayer] = useState<PlayerData | null>(null);
    const [enemy, setEnemy] = useState<EnemyData | null>(null);
    const [isEnemyShaking, setIsEnemyShaking] = useState(false); // Track shake effect for enemy
    const [damagePopups, setDamagePopups] = useState<DamagePopup[]>([]);
    const [turnOrder, setTurnOrder] = useState<Array<{ name: "player" | "enemy", number: number }>>([]);
    const [currentTurn, setCurrentTurn] = useState<"player" | "enemy">("player");
    const [activeEffects, setActiveEffects] = useState<Array<{ id: string, type: string, duration: number, target: string }>>([]);
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
            turnOrder: Array<{ name: "player" | "enemy", number: number }>
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
            turnOrder?: Array<{ name: "player" | "enemy", number: number }>
        }) => {
            setPlayer({ ...player });
            setEnemy({ ...enemy });
            setIsEnemyShaking(false);
            if (currentTurn) setCurrentTurn(currentTurn);
            if (turnOrder) setTurnOrder(turnOrder);
        };

        const handleCombatEnd = ({ result, penaltyMessage }: { result: "victory" | "defeat" | "fled", penaltyMessage?: string }) => {
            setCombatResult(result);
            setCurrentTurn("player"); // Reset turn for display

            // If there's a penalty message (from death), show it in combat log
            if (penaltyMessage && combatLogRef.current) {
                const logEntry = document.createElement('p');
                logEntry.textContent = penaltyMessage;
                logEntry.className = 'text-red-400 text-sm py-1 font-semibold';
                combatLogRef.current.appendChild(logEntry);
                combatLogRef.current.scrollTop = combatLogRef.current.scrollHeight;
            }

            // Don't close combat immediately, wait for user confirmation
        };

        const handleAttack = () => {
            setIsEnemyShaking(true);
            setTimeout(() => setIsEnemyShaking(false), 500);
        }; const handleShowDamage = (data: {
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
                    logEntry.textContent = `${data.attacker}${skillText}: dealt ${Math.floor(data.damage)} damage to ${data.target}`;
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
                logEntry.textContent = `${data.target} healed for ${Math.floor(data.amount)} HP`;
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
    }, []);


    // Function to handle combat confirmation and cleanup
    const handleCombatConfirmation = () => {
        setInCombat(false);
        setCombatResult(null);
        setPlayer(null);
        setEnemy(null);
        setIsEnemyShaking(false);
        setDamagePopups([]);
        if (combatLogRef.current) combatLogRef.current.innerHTML = ''; // Clear log on combat end
    };

    if (!inCombat || !player || !enemy) return null;
    const p_hpPercent = Math.floor((player.stats.hp / player.stats.max_hp) * 100);
    const p_manaPercent = Math.floor((player.stats.mana / player.stats.max_mana) * 100);

    const e_hpPercent = Math.floor((enemy.stats.hp / enemy.stats.max_hp) * 100);
    const e_manaPercent = Math.floor((enemy.stats.mana / enemy.stats.max_mana) * 100);

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
                                        Hp: {Math.floor(enemy.stats.hp)} / {Math.floor(enemy.stats.max_hp)}
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
                                        Mp: {Math.floor(enemy.stats.mana)} / {Math.floor(enemy.stats.max_mana)}
                                    </p>
                                    <div className="w-full h-2 bg-gray-600 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-cyan-500 rounded-full transition-all duration-300"
                                            style={{ width: `${e_manaPercent}%` }}
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-3 text-sm font-medium">
                                    <p>Attack: {Math.floor(enemy.stats.attack)}</p>
                                    <p>Magic: {Math.floor(enemy.stats.magic)}</p>
                                    <p>Defense: {Math.floor(enemy.stats.defense)}</p>
                                    <p>Speed: {Math.floor(enemy.stats.speed)}</p>
                                    <p>Crit: {Math.floor(enemy.stats.crit_chance)}%</p>
                                    <p>CritDmg: {Math.floor(enemy.stats.crit_damage)}%</p>
                                </div>
                            </div>

                            {/* Turn Order Info */}
                            <div className="">
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
                                                    {(turn.name === 'player' ? player.name : enemy.name) + "[" + turn.number + "]"}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Active Effects */}
                            <div className="">
                                <div className="">
                                    {activeEffects.length > 0 && (
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
                                    )}
                                </div>
                            </div>

                            {/* Player Stats */}
                            <div>
                                <div className="mt-2 grid grid-cols-9 grid-rows-2 gap-1 overflow-hidden">
                                    {/* Player effects */}
                                </div>
                                <div className="grid grid-cols-3 text-sm font-medium">
                                    <p>Attack: {Math.floor(playerDataManager.calcAttack(player))}</p>
                                    <p>Magic: {Math.floor(playerDataManager.calcMagic(player))}</p>
                                    <p>Defense: {Math.floor(playerDataManager.calcDefense(player))}</p>
                                    <p>Speed: {Math.floor(playerDataManager.calcSpeed(player))}</p>
                                    <p>Crit: {Math.floor(playerDataManager.calcCrit(player))}%</p>
                                    <p>CritDmg: {Math.floor(playerDataManager.calcCritDamage(player))}%</p>
                                </div>

                                <div className="f">
                                    <p className="text-base font-medium">
                                        Hp: {Math.floor(player.stats.hp)} / {Math.floor(playerDataManager.calcMaxHP(player))}
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
                                        Mp: {Math.floor(player.stats.mana)} / {Math.floor(playerDataManager.calcmax_mana(player))}
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
                                -{Math.floor(popup.damage)}
                            </div>
                        ))}
                    </div>
                    <ActionsBox
                        player={player!}
                        enemy={enemy!}
                        currentTurn={combatResult ? "enemy" : currentTurn} // Disable actions if combat ended
                    />
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

            {/* Combat Result Confirmation Dialog */}
            {combatResult && (
                <div className="absolute inset-0 z-60 flex justify-center items-center bg-black/85">
                    <div className="bg-gray-800 rounded-xl p-8 max-w-md w-full mx-4 border-2 border-gray-600">
                        <div className="text-center">
                            <h2 className={`text-3xl font-bold mb-4 ${combatResult === 'victory' ? 'text-green-400' :
                                    combatResult === 'defeat' ? 'text-red-400' : 'text-yellow-400'
                                }`}>
                                {combatResult === 'victory' ? 'Victory!' :
                                    combatResult === 'defeat' ? 'Defeated!' : 'Fled!'}
                            </h2>

                            <p className="text-gray-300 mb-6">
                                {combatResult === 'victory' ? 'You have emerged victorious!' :
                                    combatResult === 'defeat' ? 'You have been defeated...' : 'You have fled from battle!'}
                            </p>

                            <button
                                onClick={handleCombatConfirmation}
                                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors duration-200"
                            >
                                Continue
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};


export default CombatOverlay;

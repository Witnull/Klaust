import React, { useEffect, useRef, useState } from "react";
import { PhaserGame } from "./game/PhaserGame";
import CombatOverlay from "./game/components/CombatOverlay";
import StatsBar from "./game/components/AdditionalStats";
import Inventory from "./game/components/Inventory";
import SaveLoad from "./game/components/SaveLoad";
import { PlayerData } from "./game/types/GameTypes";
import { playerDataManager } from './game/managers/PlayerDataManager';
import { ToastContainer } from "react-toastify";
import EquipmentGrid from "./game/components/EquipmentGrid";
import { AdminConsole } from "./game/components/AdminConsole";


const App: React.FC = () => {
    const gameRef = useRef<HTMLDivElement>(null);
    const phaserRef = useRef<PhaserGame | null>(null);
    const [playerData, setPlayerData] = useState<PlayerData>(playerDataManager.getPlayerData());
    const [showAdminConsole, setShowAdminConsole] = useState<boolean>(false);

    useEffect(() => {
        if (gameRef.current && !phaserRef.current) {
            phaserRef.current = new PhaserGame(gameRef.current);
            console.log("App.tsx: Phaser game initialized");
            // Initial sync with Phaser can be handled by PlayerDataManager listeners in GameScene
        }

        // Listen for player data updates from PlayerDataManager
        const handlePlayerDataUpdate = (updatedPlayerData: PlayerData) => {
            //  console.log("App.tsx: Received player data update", updatedPlayerData);
            setPlayerData(updatedPlayerData); // Sync React state
        };
        playerDataManager.on("playerDataUpdated", handlePlayerDataUpdate);

        return () => {
            if (phaserRef.current) {
                phaserRef.current.destroy();
                phaserRef.current = null;
            }
            playerDataManager.off("playerDataUpdated", handlePlayerDataUpdate);
        };
    }, []);

    const hpPercent = (playerData.stats.hp / playerData.stats.max_hp) * 100;
    const manaPercent = (playerData.stats.mana / playerData.stats.max_mana) * 100;

    return (
        <div className="h-screen w-screen grid grid-cols-5 grid-rows-3 gap-4 bg-gray-500 p-4 overflow-hidden">
            {/* Cell 1: Player Name, Level, XP */}
            <div className="gap-4 bg-gray-800 text-white p-4 rounded-lg drop-shadow-xl">

                <div className="col-span-1 flex flex-col">
                    <div className="text-2xl font-bold">
                        {playerData.name}
                        <span className="text-sm font-light text-amber-400">
                            {" " + "[Beginner]"}
                        </span>
                    </div>

                    <div className="flex justify-between">
                        <span className="text-sm">
                            Lv:{" " + playerData.level}
                        </span>
                        <span className="text-sm">
                            Xp:{" " + playerData.xp + " /" + playerDataManager.calcXpRequired(playerData)}
                        </span>
                    </div>

                    <div className="mb-1">
                        <div className="w-full bg-gray-300 rounded-full h-1.5">
                            <div
                                className="bg-linear-to-r from-purple-200 to-indigo-600 h-full rounded-full transition-all duration-300"
                                style={{
                                    width: `${((playerData.xp) /
                                        playerDataManager.calcXpRequired(playerData)) * 100
                                        }%`,
                                }}
                            />
                        </div>
                    </div>

                    <div className="mb-1">
                        <span> Hp: {playerData.stats.hp + " /" + playerData.stats.max_hp}</span>
                        <div className="w-full bg-gray-300 rounded-full h-2.5">
                            <div
                                className="bg-linear-to-r from-red-400 to-green-600 h-full rounded-full transition-all duration-300"
                                style={{ width: `${hpPercent}%` }}
                            />
                        </div>
                    </div>
                    <div className="mb-1">
                        <div className="w-full bg-gray-300 rounded-full h-1.5">
                            <div
                                className="bg-linear-to-r from-cyan-300 to-blue-500 h-full rounded-full transition-all duration-300"
                                style={{ width: `${manaPercent}%` }}
                            />
                        </div>
                        <span className="text-sm" >Mp: {playerData.stats.mana + " /" + playerData.stats.max_mana}</span>
                    </div>

                    <span className="text-gray-400 text-sm">
                        X: {playerData.position.x} - Y: {playerData.position.y}
                    </span>
                    <span className="text-amber-300">
                        Coins: {playerData.coins}
                    </span>

                </div>

            </div>

            {/* Cell 2: Empty */}
            {/*<div className="col-span-1 row-span-1" />*/}

            {/* Cell 234-789-12 13 14: Game Map */}
            <div className="col-span-3 row-span-3 flex justify-center items-center">
                <div
                    ref={gameRef}
                    id="game-container"
                    className="bg-black rounded-lg drop-shadow-xl"
                />
                <div
                    id="shaodow"
                    className="bg-black "
                />
                <CombatOverlay />
            </div>
            {/* Cell 5: Equipped Items */}
            <div className="col-span-1 row-span-1 bg-gray-800 text-white p-4 rounded-lg shadow-lg flex flex-col">
                <h3 className="text-lg font-bold mb-4 text-teal-600">
                    Equipped
                </h3>
                <EquipmentGrid playerData={playerData} />
            </div>

            {/* Cell 11: Player Stats */}
            <div className="col-span-1 row-span-1">
                <StatsBar playerData={playerData} />
            </div>

            {/* Cell 10 15: Inventory */}
            <div className="col-span-1 row-span-2 bg-gray-800 text-white p-4 rounded-lg shadow-lg overflow-y-auto">
                <Inventory
                    playerData={playerData}
                    onUpdate={(updatedData) =>
                        playerDataManager.updatePlayerData(updatedData)
                    }
                />
            </div>            {/* Cell 11: Save/Load */}
            <div className="col-span-1 row-span-1 flex justify-center bg-gray-800 rounded-lg shadow-lg p-4">
                <SaveLoad playerData={playerData} />
                <button
                    onClick={() => setShowAdminConsole(prev => !prev)}
                    className="absolute bottom-4 right-4 bg-red-700 hover:bg-red-800 text-white p-2 rounded-md shadow-lg transition-all"
                    title="Toggle Admin Console"
                >
                    <span className="text-sm font-bold">Admin</span>
                </button>
            </div>

            {/* Admin Console (Draggable) */}
            <AdminConsole
                playerData={playerData}
                isVisible={showAdminConsole}
            />

            {/* Cell 12: Empty */}
            <div className="col-span-1 row-span-1" >

            </div>
            {/* Cell 13: Empty */}

            <div className="col-span-1 row-span-1" />
            {/* Cell 14: Empty */}
            <div className="col-span-1 row-span-1" />

            {/* Cell 15: Popup */}
            <div className="col-span-1 row-span-1">

                <ToastContainer limit={3} />
            </div>
        </div>
    );
};

export default App;
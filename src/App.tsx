import React, { useEffect, useRef, useState } from "react";
import { PhaserGame } from "./game/PhaserGame";
import CombatOverlay from "./game/components/CombatOverlay";
import StatsBar from "./game/components/StatsBar";
import Inventory from "./game/components/Inventory";
import SaveLoad from "./game/components/SaveLoad";
import { Item, Equipment, PlayerData } from "./game/types/PlayerData";
import EquipmentSlot from "./game/components/EquipmentSlot";
import { ItemPopup } from "./game/components/ItemPopup";
import { playerDataManager } from './game/managers/PlayerDataManager';
import { ToastContainer } from "react-toastify";
import { showToast} from "./game/managers/ToastManager";
const App: React.FC = () => {
    const gameRef = useRef<HTMLDivElement>(null);
    const phaserRef = useRef<PhaserGame | null>(null);

    const [popup, setPopup] = useState<{
        item: Item | Equipment;
        position: { x: number; y: number };
        onEquip?: () => void;
        onUnequip?: () => void;
        onDelete?: () => void;
        isHovered?: boolean;
    } | null>(null);

    const popupRef = useRef<HTMLDivElement>(null);
    const hoverTimeout = useRef<NodeJS.Timeout | null>(null);
    const popupWidth = 224;

    const [actionDebounce, setActionDebounce] = useState(false);
    const [playerData, setPlayerData] = useState<PlayerData>(playerDataManager.getPlayerData());

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

    const handleHover = (
        item: Item | Equipment | undefined,
        position: { x: number; y: number } | null,
        onEquip?: () => void,
        onUnequip?: () => void,
        onDelete?: () => void
    ) => {
        if (item && position) {
            setPopup({
                item,
                position,
                onEquip,
                onUnequip,
                onDelete,
                isHovered: false,
            });
            if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
        } else {
            hoverTimeout.current = setTimeout(() => setPopup(null), 300);
        }
    };

    const handleMouseEnterPopup = () => {
        if (popup) {
            setPopup({ ...popup, isHovered: true });
            if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
        }
    };

    const handleMouseLeavePopup = () => {
        if (popup) {
            setPopup({ ...popup, isHovered: false });
            hoverTimeout.current = setTimeout(() => setPopup(null), 300);
        }
    };
    const handleEquip = (item: Equipment) => {
        if (actionDebounce) return;
        setActionDebounce(true);

        const currentData = playerDataManager.getPlayerData();
        if (!currentData.inventory.some((i: Equipment) => i.id === item.id)) {
            showToast.warn("Cannot equip item: Item not found in inventory");
            setActionDebounce(false);
            return;
        }

        const slot = item.type as keyof typeof currentData.equipment;
        const currentItem = currentData.equipment[slot];

        if (currentItem === item) {
            setActionDebounce(false);
            return;
        }

        const updatedData = JSON.parse(JSON.stringify(currentData)); // Deep copy
        console.log("Equipping item:", item, "into slot:", slot);

        // Handle replacing an existing item
        if (currentItem) {
            // Check if inventory has space
            if (updatedData.inventory.length >= 45) {
                showToast.warn("Cannot equip item: Inventory is full");
                setActionDebounce(false);
                return;
            }

            // Reverse stats of the current item
            if (currentItem.stats) {
                const hpBonus =
                    (currentItem.stats?.mainStat?.maxhp || 0) +
                    (currentItem.stats?.subStats?.find((stat) => stat?.maxhp !== undefined)?.maxhp || 0);
                updatedData.stats.maxhp -= hpBonus;
                updatedData.stats.hp = Math.min(updatedData.stats.hp, updatedData.stats.maxhp);

                const manaBonus =
                    (currentItem.stats?.mainStat?.maxmana || 0) +
                    (currentItem.stats?.subStats?.find((stat) => stat?.maxmana !== undefined)?.maxmana || 0);
                updatedData.stats.maxmana -= manaBonus;
                updatedData.stats.mana = Math.min(updatedData.stats.mana, updatedData.stats.maxmana);

                const attackBonus =
                    (currentItem.stats?.mainStat?.attack || 0) +
                    (currentItem.stats?.subStats?.find((stat) => stat?.attack !== undefined)?.attack || 0);
                updatedData.stats.attack -= attackBonus;

                const defenseBonus =
                    (currentItem.stats?.mainStat?.defense || 0) +
                    (currentItem.stats?.subStats?.find((stat) => stat?.defense !== undefined)?.defense || 0);
                updatedData.stats.defense -= defenseBonus;

                const speedBonus =
                    (currentItem.stats?.mainStat?.speed || 0) +
                    (currentItem.stats?.subStats?.find((stat) => stat?.speed !== undefined)?.speed || 0);
                updatedData.stats.speed -= speedBonus;

                const magicBonus =
                    (currentItem.stats?.mainStat?.magic || 0) +
                    (currentItem.stats?.subStats?.find((stat) => stat?.magic !== undefined)?.magic || 0);
                updatedData.stats.magic -= magicBonus;
            }

            // Add the old item back to inventory
            updatedData.inventory.push(currentItem);
        }

        // Remove the new item from inventory and equip it
        updatedData.inventory = updatedData.inventory.filter((i: Equipment) => i.id !== item.id);
        updatedData.equipment[slot] = item;

        // Apply stats of the new item
        if (item.stats) {
            const hpBonus =
                (item.stats?.mainStat?.maxhp || 0) +
                (item.stats?.subStats?.find((stat) => stat?.maxhp !== undefined)?.maxhp || 0);
            updatedData.stats.maxhp += hpBonus;
            updatedData.stats.hp = Math.min(updatedData.stats.hp + hpBonus, updatedData.stats.maxhp);

            const manaBonus =
                (item.stats?.mainStat?.maxmana || 0) +
                (item.stats?.subStats?.find((stat) => stat?.maxmana !== undefined)?.maxmana || 0);
            updatedData.stats.maxmana += manaBonus;
            updatedData.stats.mana = Math.min(updatedData.stats.mana + manaBonus, updatedData.stats.maxmana);

            const attackBonus =
                (item.stats?.mainStat?.attack || 0) +
                (item.stats?.subStats?.find((stat) => stat?.attack !== undefined)?.attack || 0);
            updatedData.stats.attack += attackBonus;

            const defenseBonus =
                (item.stats?.mainStat?.defense || 0) +
                (item.stats?.subStats?.find((stat) => stat?.defense !== undefined)?.defense || 0);
            updatedData.stats.defense += defenseBonus;

            const speedBonus =
                (item.stats?.mainStat?.speed || 0) +
                (item.stats?.subStats?.find((stat) => stat?.speed !== undefined)?.speed || 0);
            updatedData.stats.speed += speedBonus;

            const magicBonus =
                (item.stats?.mainStat?.magic || 0) +
                (item.stats?.subStats?.find((stat) => stat?.magic !== undefined)?.magic || 0);
            updatedData.stats.magic += magicBonus;
        }

        console.log(
            "Updated inventory after equip:",
            updatedData.inventory,
            "Updated equipment:",
            updatedData.equipment
        );

        setPopup(null);
        playerDataManager.updatePlayerData(updatedData);
        showToast.success("Item " + item.name +" [" + slot +"] equipped!");
        setActionDebounce(false);
    };

    const handleUnequip = (slot: keyof typeof playerData.equipment) => {
        if (actionDebounce) return;
        setActionDebounce(true);

        const currentData = playerDataManager.getPlayerData();
        const item = currentData.equipment[slot];

        if (item && currentData.inventory.length < 45) {
            const updatedData = JSON.parse(JSON.stringify(currentData));
            updatedData.inventory.push(item);
            updatedData.equipment[slot] = undefined;

            // Reverse stat bonuses if applicable
            if (item.stats) {
                const hpBonus =
                    (item.stats?.mainStat?.maxhp || 0) +
                    (item.stats?.subStats?.find((stat) => stat?.maxhp !== undefined)?.maxhp || 0);
                updatedData.stats.maxhp -= hpBonus;
                updatedData.stats.hp = Math.min(updatedData.stats.hp, updatedData.stats.maxhp);

                const manaBonus =
                    (item.stats?.mainStat?.maxmana || 0) +
                    (item.stats?.subStats?.find((stat) => stat?.maxmana !== undefined)?.maxmana || 0);
                updatedData.stats.maxmana -= manaBonus;
                updatedData.stats.mana = Math.min(updatedData.stats.mana, updatedData.stats.maxmana);

                const attackBonus =
                    (item.stats?.mainStat?.attack || 0) +
                    (item.stats?.subStats?.find((stat) => stat?.attack !== undefined)?.attack || 0);
                updatedData.stats.attack -= attackBonus;

                const defenseBonus =
                    (item.stats?.mainStat?.defense || 0) +
                    (item.stats?.subStats?.find((stat) => stat?.defense !== undefined)?.defense || 0);
                updatedData.stats.defense -= defenseBonus;

                const speedBonus =
                    (item.stats?.mainStat?.speed || 0) +
                    (item.stats?.subStats?.find((stat) => stat?.speed !== undefined)?.speed || 0);
                updatedData.stats.speed -= speedBonus;

                const magicBonus =
                    (item.stats?.mainStat?.magic || 0) +
                    (item.stats?.subStats?.find((stat) => stat?.magic !== undefined)?.magic || 0);
                updatedData.stats.magic -= magicBonus;
            }

            setPopup(null);
            playerDataManager.updatePlayerData(updatedData);
            showToast.success("Item " + item.name +" [" + slot +"] unequipped!");
        } else {
            showToast.warn("Cannot unequip item: Inventory is full or no item in slot");
        }

        setActionDebounce(false);
    };

    const handleDelete = (
        item: Item | Equipment | undefined,
        isEquipped: boolean
    ) => {
        if (actionDebounce || !item) return;
        setActionDebounce(true);

        const currentData = playerDataManager.getPlayerData();
        const updatedData = JSON.parse(JSON.stringify(currentData));

        console.log(
            "Deleting item:",
            item,
            "from",
            isEquipped ? "equipment" : "inventory"
        );

        if (isEquipped) {
            const slot = item.type as keyof typeof updatedData.equipment;
            if (slot && updatedData.equipment[slot]) {
                updatedData.equipment[slot] = undefined;

                // Reverse stat bonuses if applicable
                if ("stats" in item && item.stats) {
                    const hpBonus =
                        (item.stats?.mainStat?.maxhp || 0) +
                        (item.stats?.subStats?.find((stat) => stat?.maxhp !== undefined)?.maxhp || 0);
                    updatedData.stats.maxhp -= hpBonus;
                    updatedData.stats.hp = Math.min(updatedData.stats.hp, updatedData.stats.maxhp);

                    const manaBonus =
                        (item.stats?.mainStat?.maxmana || 0) +
                        (item.stats?.subStats?.find((stat) => stat?.maxmana !== undefined)?.maxmana || 0);
                    updatedData.stats.maxmana -= manaBonus;
                    updatedData.stats.mana = Math.min(updatedData.stats.mana, updatedData.stats.maxmana);

                    const attackBonus =
                        (item.stats?.mainStat?.attack || 0) +
                        (item.stats?.subStats?.find((stat) => stat?.attack !== undefined)?.attack || 0);
                    updatedData.stats.attack -= attackBonus;

                    const defenseBonus =
                        (item.stats?.mainStat?.defense || 0) +
                        (item.stats?.subStats?.find((stat) => stat?.defense !== undefined)?.defense || 0);
                    updatedData.stats.defense -= defenseBonus;

                    const speedBonus =
                        (item.stats?.mainStat?.speed || 0) +
                        (item.stats?.subStats?.find((stat) => stat?.speed !== undefined)?.speed || 0);
                    updatedData.stats.speed -= speedBonus;

                    const magicBonus =
                        (item.stats?.mainStat?.magic || 0) +
                        (item.stats?.subStats?.find((stat) => stat?.magic !== undefined)?.magic || 0);
                    updatedData.stats.magic -= magicBonus;
                }
            }
        } else {
            updatedData.inventory = updatedData.inventory.filter(
                (i: Item | Equipment) => i.id !== item.id
            );
        }

        console.log(
            "Updated inventory after delete:",
            updatedData.inventory,
            "Updated equipment:",
            updatedData.equipment
        );

        setPopup(null);
        playerDataManager.updatePlayerData(updatedData);
        showToast.success("Item deleted!");
        setActionDebounce(false);
    };

    const calculatePopupPosition = (position: { x: number; y: number }) => {
        const left = position.x - popupWidth -20;
        const top = position.y;
        const adjustedLeft = Math.max(
            0,
            Math.min(window.innerWidth - popupWidth, left)
        );
        return { left: `${adjustedLeft}px`, top: `${top}px` };
    };

    const hpPercent = (playerData.stats.hp / playerData.stats.maxhp) * 100;
    const manaPercent = (playerData.stats.mana / playerData.stats.maxmana) * 100;

    return (
        <div className="h-screen w-screen grid grid-cols-[1fr_2fr_1fr] grid-rows-3 gap-4  bg-gray-600 p-4 overflow-hidden">
            {/* Cell 1: Player Name, Level, XP */}
            <div className="col-span-1 row-span-1 grid grid-cols-[2fr_1fr] gap-4 bg-gray-800 text-white p-4 rounded-lg shadow-lg">
                
                <div className="col-span-1 flex flex-col">
                    <h2 className="text-xl md:text-2xl font-bold mb-3">
                        {playerData.name}
                    </h2>
                    <div className="flex justify-between">
                        <p className="text-sm md:text-base">
                            Level: {playerData.level}   
                        </p>
                        <p className="text-sm md:text-base">
                            Xp: {playerData.xp} / {playerDataManager.calcXpRequired(playerData)} 
                        </p>
                    </div>
                    <div className="mb-1">
                        <div className="w-full bg-gray-600 rounded-full h-2.5">
                            <div
                                className="bg-linear-to-r from-green-400 to-blue-600 h-2.5 rounded-full transition-all duration-300"
                                style={{
                                    width: `${((playerData.xp) /
                                        playerDataManager.calcXpRequired(playerData))*100
                                        }%`,
                                }}
                            />
                        </div>
                    </div>

                    <div className="mb-1">
                        <p> Health: {playerData.stats.hp} / {playerData.stats.maxhp}</p>
                        <div className="w-full bg-gray-600 rounded-full h-2.5">
                            <div
                                className="bg-linear-to-r from-red-400 to-green-600 h-2.5 rounded-full transition-all duration-300"
                                style={{ width: `${hpPercent}%` }}
                            />
                        </div>
                    </div>
                    <div className="mb-1">
                        <p>Mana: {playerData.stats.mana} / {playerData.stats.maxmana}</p>
                        <div className="w-full bg-gray-600 rounded-full h-2.5">
                            <div
                                className="bg-cyan-600 h-2.5 rounded-full transition-all duration-300"
                                style={{ width: `${manaPercent}%` }}
                            />
                        </div>
                    </div>
                    <p className="text-gray-300 text-sm">
                        X {playerData.position.x} - Y {playerData.position.y}
                    </p>
                </div>
                <div className="col-span-1 flex flex-col bg-gray-700/50 p-2 rounded-lg">
                    <div className=" *:text-base overflow-y-auto overflow-x-hidden">
                        <p className="text-amber-300">
                            Coins: {playerData.coins}
                        </p>
                        
                    </div>
                </div>
            </div>

            {/* Cell 2: Empty */}
            <div className="col-span-1 row-span-1" />

            {/* Cell 3: Equipped Items */}
            <div className="col-span-1 row-span-1 bg-gray-800 text-white p-4 rounded-lg shadow-lg flex flex-col">
                <h3 className="text-lg font-bold mb-4 text-teal-600">
                    Equipped
                </h3>
                <div className="flex flex-wrap gap-2 mb-4 justify-center">
                    <EquipmentSlot
                        slotType="weapon"
                        item={playerData.equipment.weapon}
                        onUnequip={() => handleUnequip("weapon")}
                        onDelete={() =>
                            handleDelete(playerData.equipment.weapon, true)
                        }
                        onHover={(position) =>
                            handleHover(
                                playerData.equipment.weapon,
                                position,
                                undefined,
                                () => handleUnequip("weapon"),
                                () =>
                                    handleDelete(
                                        playerData.equipment.weapon,
                                        true
                                    )
                            )
                        }
                    />
                    <EquipmentSlot
                        slotType="helmet"
                        item={playerData.equipment.helmet}
                        onUnequip={() => handleUnequip("helmet")}
                        onDelete={() =>
                            handleDelete(playerData.equipment.helmet, true)
                        }
                        onHover={(position) =>
                            handleHover(
                                playerData.equipment.helmet,
                                position,
                                undefined,
                                () => handleUnequip("helmet"),
                                () =>
                                    handleDelete(
                                        playerData.equipment.helmet,
                                        true
                                    )
                            )
                        }
                    />
                    <EquipmentSlot
                        slotType="armor"
                        item={playerData.equipment.armor}
                        onUnequip={() => handleUnequip("armor")}
                        onDelete={() =>
                            handleDelete(playerData.equipment.armor, true)
                        }
                        onHover={(position) =>
                            handleHover(
                                playerData.equipment.armor,
                                position,
                                undefined,
                                () => handleUnequip("armor"),
                                () =>
                                    handleDelete(
                                        playerData.equipment.armor,
                                        true
                                    )
                            )
                        }
                    />
                    <EquipmentSlot
                        slotType="gloves"
                        item={playerData.equipment.gloves}
                        onUnequip={() => handleUnequip("gloves")}
                        onDelete={() =>
                            handleDelete(playerData.equipment.gloves, true)
                        }
                        onHover={(position) =>
                            handleHover(
                                playerData.equipment.gloves,
                                position,
                                undefined,
                                () => handleUnequip("gloves"),
                                () =>
                                    handleDelete(
                                        playerData.equipment.gloves,
                                        true
                                    )
                            )
                        }
                    />
                    <EquipmentSlot
                        slotType="boots"
                        item={playerData.equipment.boots}
                        onUnequip={() => handleUnequip("boots")}
                        onDelete={() =>
                            handleDelete(playerData.equipment.boots, true)
                        }
                        onHover={(position) =>
                            handleHover(
                                playerData.equipment.boots,
                                position,
                                undefined,
                                () => handleUnequip("boots"),
                                () =>
                                    handleDelete(
                                        playerData.equipment.boots,
                                        true
                                    )
                            )
                        }
                    />
                </div>
            </div>

            {/* Cell 4: Player Stats */}
            <div className="col-span-1 row-span-1">
                <StatsBar playerData={playerData} />
            </div>

            {/* Cell 5: Game Map */}
            <div className="col-span-1 row-span-1 flex justify-center items-center">
                <div
                    ref={gameRef}
                    id="game-container"
                    className="w-[80%] max-w-[60vw] h-[80%] max-h-[60vh] bg-black rounded-lg shadow-lg"
                />
                <CombatOverlay />
            </div>

            {/* Cell 6: Inventory */}
            <div className="col-span-1 row-span-2 bg-gray-800 text-white p-4 rounded-lg shadow-lg overflow-y-auto">
                <Inventory
                    playerData={playerData}
                    onUpdate={(updatedData) =>
                        playerDataManager.updatePlayerData(updatedData)
                    }
                    onHover={(item, position) =>
                        handleHover(
                            item,
                            position,
                            () => {
                                if (item && "type" in item)
                                    handleEquip(item as Equipment);
                            },
                            undefined,
                            () => handleDelete(item, false)
                        )
                    }
                />
            </div>

            {/* Cell 7: Save/Load */}
            <div className="col-span-1 row-span-1 flex justify-center bg-gray-800 rounded-lg shadow-lg p-4">
                <SaveLoad playerData={playerData} />
            </div>

            {/* Cell 8: Popup */}
            <div className="col-span-1 row-span-1">
            <ToastContainer/>
                {popup && (
                    <div
                        ref={popupRef}
                        className="absolute z-50 bg-gray-800 text-white p-4 rounded-lg shadow-lg border border-teal-500 max-w-xs min-w-52"
                        style={calculatePopupPosition(popup.position)}
                        onMouseEnter={handleMouseEnterPopup}
                        onMouseLeave={handleMouseLeavePopup}
                    >
                        <ItemPopup
                            item={popup.item}
                            position={popup.position}
                            onEquip={popup.onEquip}
                            onUnequip={popup.onUnequip}
                            onDelete={popup.onDelete}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default App;
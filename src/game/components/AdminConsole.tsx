
import { useState, useRef, useEffect } from 'react';
import { generateRandomEquipment, generateRandomItem } from '../utils/GenRandomEquipment';
import { playerDataManager } from '../managers/PlayerDataManager';
import { PlayerData, EQUIPMENT_TYPES } from '../types/GameTypes';

export const AdminConsole: React.FC<{
    playerData: PlayerData;
    isVisible?: boolean;
}> = ({
    playerData,
    isVisible = false
}) => {
        const [coinAmount, setCoinAmount] = useState<number>(100);
        const [expAmount, setExpAmount] = useState<number>(100);
        const [position, setPosition] = useState({ x: 20, y: 20 });
        const [isDragging, setIsDragging] = useState(false);
        const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
        const consoleRef = useRef<HTMLDivElement>(null);

        // Handle dragging
        const handleMouseDown = (e: React.MouseEvent) => {
            if (consoleRef.current) {
                const rect = consoleRef.current.getBoundingClientRect();
                setDragOffset({
                    x: e.clientX - rect.left,
                    y: e.clientY - rect.top
                });
                setIsDragging(true);
            }
        };

        // Handle mouse move for dragging
        useEffect(() => {
            const handleMouseMove = (e: MouseEvent) => {
                if (isDragging) {
                    setPosition({
                        x: e.clientX - dragOffset.x,
                        y: e.clientY - dragOffset.y
                    });
                }
            };

            const handleMouseUp = () => {
                setIsDragging(false);
            };

            if (isDragging) {
                document.addEventListener('mousemove', handleMouseMove);
                document.addEventListener('mouseup', handleMouseUp);
            }

            return () => {
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
            };
        }, [isDragging, dragOffset]);

        const handleAddRandomEquipment = () => {
            if (playerDataManager.hasInventorySpace()) {
                const newEquipment = generateRandomEquipment();
                playerDataManager.updatePlayerData({
                    inventory: [...playerData.inventory, newEquipment]
                });
            }
        };

        const handleAddRandomItem = () => {
            if (playerDataManager.hasInventorySpace()) {
                const newItem = generateRandomItem();
                playerDataManager.updatePlayerData({
                    inventory: [...playerData.inventory, newItem]
                });
            }
        };

        const handleAddCoins = () => {
            playerDataManager.updatePlayerData({
                coins: playerData.coins + coinAmount
            });
        };

        const handleClearInventory = () => {
            playerDataManager.updatePlayerData({
                inventory: []
            });
        };
        const handleClearEquipment = () => {
            // Create an object with all equipment slots set to null
            const emptyEquipment = {} as Record<typeof EQUIPMENT_TYPES[number], null>;

            // Set each equipment slot to null
            EQUIPMENT_TYPES.forEach(slot => {
                emptyEquipment[slot] = null;
            });

            playerDataManager.updatePlayerData({
                equipment: emptyEquipment
            });
        };

        const handleAddExp = () => {
            playerDataManager.incXp(expAmount);
        }; if (!isVisible) return null;

        return (
            <div
                ref={consoleRef}
                style={{
                    position: 'absolute',
                    left: `${position.x}px`,
                    top: `${position.y}px`,
                    zIndex: 1000,
                    cursor: isDragging ? 'grabbing' : 'grab',
                }}
                className="bg-gray-800 border border-gray-700 rounded-lg p-4 text-white shadow-xl"
            >
                <div
                    className="flex justify-between items-center mb-4 border-b border-gray-600 pb-2 cursor-move"
                    onMouseDown={handleMouseDown}
                >
                    <h2 className="text-xl font-bold">Admin Console</h2>
                    <div className="flex gap-2">
                        <button
                            className="bg-gray-600 hover:bg-gray-700 w-6 h-6 rounded-full flex items-center justify-center text-xs"
                            title="Move console"
                        >
                            ⋮⋮
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Item Management */}
                    <div className="bg-gray-700 p-3 rounded-md">
                        <h3 className="font-semibold mb-2 text-yellow-300">Items</h3>
                        <div className="flex flex-col gap-2">
                            <button onClick={handleAddRandomEquipment}
                                className="bg-indigo-600 hover:bg-indigo-700 px-3 py-1 rounded-md transition-colors">
                                Add Random Equipment
                            </button>
                            <button onClick={handleAddRandomItem}
                                className="bg-purple-600 hover:bg-purple-700 px-3 py-1 rounded-md transition-colors">
                                Add Random Item
                            </button>
                            <button onClick={handleClearInventory}
                                className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded-md transition-colors">
                                Clear Inventory
                            </button>
                            <button onClick={handleClearEquipment}
                                className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded-md transition-colors">
                                Clear Equipment
                            </button>
                        </div>
                    </div>

                    {/* Resources Management */}
                    <div className="bg-gray-700 p-3 rounded-md">
                        <h3 className="font-semibold mb-2 text-yellow-300">Resources</h3>
                        <div className="flex flex-col gap-3">
                            <div className="flex flex-col gap-1">
                                <label className="text-sm text-gray-300">Coins:</label>
                                <div className="flex gap-2">
                                    <input
                                        type="number"
                                        value={coinAmount}
                                        onChange={(e) => setCoinAmount(Number(e.target.value))}
                                        className="border border-gray-600 bg-gray-800 rounded-md p-1 w-full text-white"
                                    />
                                    <button onClick={handleAddCoins}
                                        className="bg-yellow-600 hover:bg-yellow-700 px-3 py-1 rounded-md whitespace-nowrap transition-colors">
                                        Add Coins
                                    </button>
                                </div>
                            </div>

                            <div className="flex flex-col gap-1">
                                <label className="text-sm text-gray-300">Experience:</label>
                                <div className="flex gap-2">
                                    <input
                                        type="number"
                                        value={expAmount}
                                        onChange={(e) => setExpAmount(Number(e.target.value))}
                                        className="border border-gray-600 bg-gray-800 rounded-md p-1 w-full text-white"
                                    />
                                    <button onClick={handleAddExp}
                                        className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded-md whitespace-nowrap transition-colors">
                                        Add XP
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

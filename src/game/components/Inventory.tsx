import React from 'react';
import { PlayerData, Equipment } from '../types/GameTypes';
import InventoryCell from './InventoryCell';
import AddCapacityCell from './AddCapacityCell';
import { equipmentManager } from '../managers/EquipmentManager';

interface InventoryProps {
    playerData: PlayerData;
    onUpdate: (updatedData: PlayerData) => void;
}

const Inventory: React.FC<InventoryProps> = ({ playerData }) => {


    return (
        <div className="flex flex-col h-full bg-gray-700/35 p-4 rounded-lg shadow-lg text-white">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-teal-400">Inventory</h3>
                <span className="text-sm text-gray-400">
                    {playerData.inventory.length}/{playerData.maxInventorySlots || 10} slots
                </span>
            </div>

            <div className="flex-grow relative overflow-hidden">
                <div
                    className="grid grid-cols-5 gap-2 h-full overflow-y-auto"
                    style={{
                        gridAutoRows: 'min-content',
                        alignContent: 'start'
                    }}
                >
                    {playerData.inventory.map((item, index) => (
                        <div
                            key={item.id || index}
                            className="transition-transform hover:scale-95 duration-200"
                        >
                            <InventoryCell
                                item={item}
                                isEquipped={false}
                                onEquip={() => "type" in item && equipmentManager.handleEquip(item as Equipment)}
                                onDelete={() => equipmentManager.handleDelete(item, false)}
                                slotType="inventory"
                            />
                        </div>
                    ))}

                    {/* Show add capacity cell  */}
                    <div className="transition-transform hover:scale-95 duration-200">
                        <AddCapacityCell currentCapacity={playerData.maxInventorySlots || 10} />
                    </div>
                    
                </div>
            </div>

            {/* Footer statistics */}
            <div className="mt-4 pt-2 border-t border-gray-700/50">
                <div className="text-xs text-gray-400 flex justify-between">
                    <span>Total Value: {playerData.inventory.reduce((total, item) => total + (item.value || 0), 0)} coins</span>
                </div>
            </div>
        </div>
    );
};

export default Inventory;
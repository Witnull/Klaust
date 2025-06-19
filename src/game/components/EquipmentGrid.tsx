import React from 'react';
import { PlayerData, EQUIPMENT_TYPES } from '../types/GameTypes';
import InventoryCell from './InventoryCell';
import { equipmentManager } from '../managers/EquipmentManager';
interface EquipmentGridProps {
    playerData: PlayerData;
}

const EQUIPMENT_SLOTS = EQUIPMENT_TYPES;
const EquipmentGrid: React.FC<EquipmentGridProps> = ({ playerData }) => {
    return (
        <div className="flex flex-wrap gap-2 mb-4 justify-center">
            {EQUIPMENT_SLOTS.map((slotType) => (
                <InventoryCell
                    key={slotType}
                    item={playerData.equipment[slotType]}
                    onUnequip={() => equipmentManager.handleUnequip(slotType)}
                    onDelete={() => playerData.equipment[slotType] &&
                        equipmentManager.handleDelete(playerData.equipment[slotType], true)}
                    slotType="equipment"
                    equipmentType={slotType}
                    isEquipped={!!playerData.equipment[slotType]}
                />
            ))}
        </div>
    );
};

export default EquipmentGrid;

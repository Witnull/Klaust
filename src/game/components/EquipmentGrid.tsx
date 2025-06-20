import React from 'react';
import { PlayerData, EQUIPMENT_TYPES } from '../types/GameTypes';
import InventoryCell from './InventoryCell';
import { equipmentManager } from '../managers/EquipmentManager';
import { skillManager } from '../managers/SkillManager';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface EquipmentGridProps {
    playerData: PlayerData;
}

const EQUIPMENT_SLOTS = EQUIPMENT_TYPES;

const EquipmentGrid: React.FC<EquipmentGridProps> = ({ playerData }) => {
    // Get equipped skills (limited to 4 slots)
    const equippedSkills = playerData.equippedSkills || [];

    // Get equipped consumables (limited to 4 slots)
    const equippedConsumables = playerData.equippedConsumables || [];

    return (
        <div className="flex flex-col gap-3">

            <Tabs defaultValue="equipment" className="w-full">
                <div className="flex items-center justify-around gap-3 mb-4">
                    <div className="text-lg font-bold text-teal-400"> Equipped </div>
                    <TabsList className="*:rounded-md bg-transparent m-0 p-0 *:text-teal-600 *:data-[state=active]:bg-gray-800/50 *:data-[state=active]:font-bold *:data-[state=active]:text-teal-400 *:data-[state=active]:shadow-md *:data-[state=active]:shadow-teal-600">
                        <TabsTrigger value="equipment">Equip</TabsTrigger>
                        <TabsTrigger value="skill">Skill</TabsTrigger>
                        <TabsTrigger value="item">Item</TabsTrigger>
                    </TabsList>
                </div>
                {/* Equipment Section */}
                <TabsContent value="equipment">
                    <div>
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
                    </div>
                </TabsContent>
                {/* Equipped Skills Section */}
                <TabsContent value="skill">
                    <div>
                        <div className="flex flex-wrap justify-center gap-2 mb-4">
                            {[0, 1, 2, 3].map((slot) => (
                                <InventoryCell
                                    key={`skill-slot-${slot}`}
                                    item={equippedSkills[slot] || null}
                                    onUnequip={() => skillManager.unequipSkill(slot)}
                                    onDelete={() => equippedSkills[slot] &&
                                        skillManager.deleteSkill(equippedSkills[slot].id)}
                                    slotType="equipment"
                                    equipmentType="skill"
                                    isEquipped={!!equippedSkills[slot]}
                                />
                            ))}
                        </div>
                    </div>
                </TabsContent>
                {/* Equipped Consumables Section */}
                <TabsContent value="item">
                    <div>
                        <div className="flex flex-wrap justify-center gap-2 mb-4">
                            {[0, 1, 2, 3].map((slot) => (
                                <InventoryCell key={`consumable-slot-${slot}`}
                                    item={equippedConsumables[slot] || null}
                                    onUnequip={() => skillManager.unequipConsumable(slot)}
                                    onDelete={() => equippedConsumables[slot] &&
                                        skillManager.deleteConsumable(equippedConsumables[slot].id, true)}
                                    slotType="equipment"
                                    equipmentType="item"
                                    isEquipped={!!equippedConsumables[slot]}
                                />
                            ))}
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default EquipmentGrid;

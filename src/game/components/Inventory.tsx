import React, { useState } from 'react';
import { PlayerData, Equipment, Item, Skill, EQUIPMENT_TYPES, ITEM_TYPES } from '../types/GameTypes';
import InventoryCell from './InventoryCell';
import AddCapacityCell from './AddCapacityCell';
import { equipmentManager } from '../managers/EquipmentManager';
import { skillManager } from '../managers/SkillManager';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HoverCard } from '@radix-ui/react-hover-card';

interface InventoryProps {
    playerData: PlayerData;
    onUpdate: (updatedData: PlayerData) => void;
}

const Inventory: React.FC<InventoryProps> = ({ playerData }) => {
    // State for active filter tab
    const [activeTab, setActiveTab] = useState<string>("all");

    // Get all available skills
    const availableSkills = playerData.skills || [];

    // Filter items based on the active tab
    const getFilteredItems = () => {
        switch (activeTab) {
            case 'equipment':
                return playerData.inventory.filter(item => item.class === "equipment");
            case 'skills':
                return availableSkills;
            case 'items':
                return playerData.inventory.filter(item => item.class === "item");
            case 'all':
            default:
                // Show equipment and items, but not skills
                return playerData.inventory;
        }
    };

    const filteredItems = getFilteredItems();  

    // Render a unified item cell based on item type
    const renderItem = (item: Equipment | Item | Skill, index: number) => {
        return (
            <div
                key={item.id || index}
                className="transition-transform hover:scale-95 duration-200"
            >
                <InventoryCell
                    item={item}
                    isEquipped={false}
                    onEquip={() => {
                        if (item.class === "skill") {
                            const equippedSkills = playerData.equippedSkills || [];
                            const emptySlotIndex = equippedSkills.findIndex(s => !s);
                            const slotToUse = emptySlotIndex >= 0 ? emptySlotIndex : 0;
                            skillManager.equipSkill(item, slotToUse);
                        } else if (item.class === "equipment") {
                            equipmentManager.handleEquip(item);
                        } else if (item.class === "item" && item.type === "consumable") {
                            const equippedConsumables = playerData.equippedConsumables || [];
                            const emptySlotIndex = equippedConsumables.findIndex(s => !s);
                            const slotToUse = emptySlotIndex >= 0 ? emptySlotIndex : 0;
                            skillManager.equipConsumable(item.id, slotToUse);
                        }
                    }}
                    onDelete={() => {
                        if (item.class === "skill") {
                            skillManager.deleteSkill(item.id);
                        } else if (item.class === "equipment" || item.class === "item") {
                            equipmentManager.handleDelete(item, false);
                        }
                    }}
                    slotType="inventory"
                />
            </div>
        );
    };

    return (
        <div className="flex flex-col h-[90%] p-1 text-white overflow-hidden">
            {/* Tabs as filters */}
            <div className="text-lg font-bold text-teal-400">Inventory</div>
            <Tabs defaultValue='all' value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="*:rounded-md bg-transparent m-0 p-0 *:text-teal-600 *:data-[state=active]:bg-gray-800/50 *:data-[state=active]:font-bold *:data-[state=active]:text-teal-400 *:data-[state=active]:shadow-md *:data-[state=active]:shadow-teal-600">
                    <TabsTrigger value="all">All</TabsTrigger>
                    <TabsTrigger value="equipment">Equip</TabsTrigger>
                    <TabsTrigger value="items">Item</TabsTrigger>
                    <TabsTrigger value="skills">Skill</TabsTrigger>
                </TabsList>
            </Tabs>

            {/* Inventory capacity indicator */}
            <div className="flex justify-end items-center mb-2">
                {activeTab !== 'skills' &&
                    <span className="text-sm text-gray-300">
                        {playerData.inventory.length}/{playerData.maxInventorySlots || 10} slots
                    </span>
                }
            </div>
            {/* Unified inventory grid with filtered items */}
            <div className="flex-grow relative overflow-hidden">
                <div
                    className="grid grid-cols-5 gap-2 h-full overflow-y-auto"
                    style={{
                        gridAutoRows: 'min-content',
                        alignContent: 'start'
                    }}
                >
                    {filteredItems.map((item, index) => renderItem(item, index))}

                    {/* Show add capacity cell only in the "all" or "equipment" tabs */}
                    {(activeTab !== 'skills') && (
                        <div className="transition-transform hover:scale-95 duration-200">
                            <AddCapacityCell currentCapacity={playerData.maxInventorySlots || 10} />
                        </div>
                    )}

                    {/* Show message when no items are available */}
                    {filteredItems.length === 0 && (
                        <div className="col-span-full text-center p-4 text-gray-500">
                            It's empty here! Try adding some items.
                        </div>
                    )}
                </div>
            </div>

            {/* Footer statistics */}
            <div className="mt-4 pt-2 border-t border-gray-700/50">
                {activeTab !== 'skills' && (
                    <div className="text-xs text-gray-300 flex justify-between">
                        <span>Total Value: {playerData.inventory.reduce((total, item) => total + (item.value || 0), 0)} coins</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Inventory;
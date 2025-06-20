import React, { useState } from 'react';
import { PlayerData, Equipment, Item, Skill, EQUIPMENT_TYPES, ITEM_TYPES } from '../types/GameTypes';
import InventoryCell from './InventoryCell';
import AddCapacityCell from './AddCapacityCell';
import { equipmentManager } from '../managers/EquipmentManager';
import { skillManager } from '../managers/SkillManager';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
    SelectSeparator,
} from "@/components/ui/select"
import { capitalizeFirstLetter } from '../utils/utils';

interface InventoryProps {
    playerData: PlayerData;
    onUpdate: (updatedData: PlayerData) => void;
}

const Inventory: React.FC<InventoryProps> = ({ playerData }) => {    // State for active filter tab
    const [activeTab, setActiveTab] = useState<string>("all");

    // Handler to change tab and reset type filter
    const handleTabChange = (value: string) => {
        setActiveTab(value);
        // Reset type filters when changing tabs
        setEquipmentTypeFilter("all");
        setItemTypeFilter("all");
        setSkillTypeFilter("all");
    };

    // State for active type filter for each tab
    const [equipmentTypeFilter, setEquipmentTypeFilter] = useState<string>("all");
    const [itemTypeFilter, setItemTypeFilter] = useState<string>("all");
    const [skillTypeFilter, setSkillTypeFilter] = useState<string>("all");

    // Get all available skills
    const availableSkills = playerData.skills || [];    // Filter items based on the active tab and type filter
    const getFilteredItems = () => {
        let initialFiltered;

        // First filter by class (tab)
        switch (activeTab) {
            case 'equipment':
                initialFiltered = playerData.inventory.filter(item => item.class === "equipment");
                // Then filter by equipment type if a specific type is selected
                return equipmentTypeFilter === "all"
                    ? initialFiltered
                    : initialFiltered.filter(item =>
                        item.class === "equipment" && (item as Equipment).type === equipmentTypeFilter);

            case 'skills':
                initialFiltered = availableSkills;
                // Filter by skill type if a specific type is selected
                return skillTypeFilter === "all"
                    ? initialFiltered
                    : initialFiltered.filter(skill =>
                        skill.type === skillTypeFilter ||
                        (skillTypeFilter === "damage" && skill.effects.type === "damage") ||
                        (skillTypeFilter === "heal" && skill.effects.type === "heal") ||
                        (skillTypeFilter === "utility" && (skill.effects.type === "buff" || skill.effects.type === "debuff")));

            case 'items':
                initialFiltered = playerData.inventory.filter(item => item.class === "item");
                // Filter by item type if a specific type is selected
                return itemTypeFilter === "all"
                    ? initialFiltered
                    : initialFiltered.filter(item =>
                        item.class === "item" && (item as Item).type === itemTypeFilter);

            case 'all':
            default:
                // Show equipment and items, but not skills
                initialFiltered = playerData.inventory;
                return initialFiltered;
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
                    }} onDelete={() => {
                        if (item.class === "skill") {
                            skillManager.deleteSkill(item.id);
                        } else if (item.class === "equipment") {
                            equipmentManager.handleDelete(item, false);
                        } else if (item.class === "item" && item.type === "consumable") {
                            skillManager.deleteConsumable(item.id, false);
                        } else if (item.class === "item") {
                            equipmentManager.handleDelete(item, false);
                        }
                    }}
                    slotType="inventory"
                />
            </div>
        );
    };    // Custom styling for the select components
    const selectContentPfx = "bg-gray-800 text-gray-300 font-semibold border border-teal-700/50";
    const selectTriggerPfx = "bg-gray-800/70 border-teal-600/50 text-teal-300 hover:bg-gray-700 focus:ring-teal-500/30 focus:border-teal-500";
    const selectItemPfx = "focus:bg-teal-800/30 focus:text-teal-200 data-[selected]:bg-teal-900/50 data-[selected]:text-teal-300";
    const selectSeparatorPfx = "bg-teal-700/20";

    return (
        <div className="flex flex-col h-full p-1 text-white overflow-hidden">            {/* Tabs as filters */}
            <div className="text-lg font-bold text-teal-400">Inventory</div>
            <Tabs defaultValue='all' value={activeTab} onValueChange={handleTabChange} className="w-full">
                <TabsList className="*:rounded-md bg-transparent *:text-teal-600 *:data-[state=active]:bg-gray-800/50 *:data-[state=active]:font-bold *:data-[state=active]:text-teal-400 *:data-[state=active]:shadow-md *:data-[state=active]:shadow-teal-600">
                    <TabsTrigger value="all">All</TabsTrigger>
                    <TabsTrigger value="equipment">Equip</TabsTrigger>
                    <TabsTrigger value="items">Item</TabsTrigger>
                    <TabsTrigger value="skills">Skill</TabsTrigger>
                </TabsList>
            </Tabs>
            <div className=''>
                {/* Type filters based on active tab */}                {activeTab === 'equipment' && (
                    <Select value={equipmentTypeFilter} onValueChange={setEquipmentTypeFilter}>
                        <SelectTrigger className={`mt-2 ${selectTriggerPfx}`}>
                            <SelectValue placeholder="Equipment Type" />
                        </SelectTrigger>
                        <SelectContent className={selectContentPfx}>
                            <SelectItem value="all" className={selectItemPfx}>All Equipment</SelectItem>
                            {EQUIPMENT_TYPES.map((type) => (
                                <SelectItem key={type} value={type} className={selectItemPfx}>
                                    {capitalizeFirstLetter(type)}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                )}                {activeTab === 'items' && (
                    <Select value={itemTypeFilter} onValueChange={setItemTypeFilter}>
                        <SelectTrigger className={`mt-2 ${selectTriggerPfx}`}>
                            <SelectValue placeholder="Item Type" />
                        </SelectTrigger>
                        <SelectContent className={selectContentPfx}>
                            <SelectItem value="all" className={selectItemPfx}>All Items</SelectItem>
                            {ITEM_TYPES.map((type) => (
                                <SelectItem key={type} value={type} className={selectItemPfx}>
                                    {capitalizeFirstLetter(type)}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                )}                {activeTab === 'skills' && (
                    <Select value={skillTypeFilter} onValueChange={setSkillTypeFilter}>
                        <SelectTrigger className={`mt-2 ${selectTriggerPfx}`}>
                            <SelectValue placeholder="Skill Type" />
                        </SelectTrigger>
                        <SelectContent className={selectContentPfx}>
                            <SelectItem value="all" className={selectItemPfx}>All Skills</SelectItem>
                            <SelectItem value="active" className={selectItemPfx}>Active</SelectItem>
                            <SelectItem value="passive" className={selectItemPfx}>Passive</SelectItem>
                            <SelectSeparator className={selectSeparatorPfx} />
                            <SelectItem value="damage" className={selectItemPfx}>Damage</SelectItem>
                            <SelectItem value="heal" className={selectItemPfx}>Healing</SelectItem>
                            <SelectItem value="utility" className={selectItemPfx}>Utility</SelectItem>
                        </SelectContent>
                    </Select>
                )}
            </div>
            {/* Inventory capacity and filter indicators */}
            <div className="flex justify-between items-center mb-2 mt-2">
                <div>
                    {/* Show active filters */}
                    {activeTab === 'equipment' && equipmentTypeFilter !== 'all' && (
                        <span className="text-xs bg-teal-800/50 text-teal-200 px-2 py-1 rounded-full">
                            Filter: {capitalizeFirstLetter(equipmentTypeFilter)}
                        </span>
                    )}
                    {activeTab === 'items' && itemTypeFilter !== 'all' && (
                        <span className="text-xs bg-teal-800/50 text-teal-200 px-2 py-1 rounded-full">
                            Filter: {capitalizeFirstLetter(itemTypeFilter)}
                        </span>
                    )}
                    {activeTab === 'skills' && skillTypeFilter !== 'all' && (
                        <span className="text-xs bg-teal-800/50 text-teal-200 px-2 py-1 rounded-full">
                            Filter: {capitalizeFirstLetter(skillTypeFilter)}
                        </span>
                    )}
                    {/* Show count of filtered items */}
                    <span className="ml-2 text-xs text-gray-400">
                        {filteredItems.length} item{filteredItems.length !== 1 ? 's' : ''}
                    </span>
                </div>

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
            <div className="pt-2 border-t border-gray-700/50">
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
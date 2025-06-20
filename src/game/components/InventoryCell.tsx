import React from 'react';
import { Item, Equipment, Skill, InventoryItemType } from '../types/GameTypes';
import { SlotIcons } from '../types/GameIcons';
import ItemPopup from './ItemPopup';
import SkillPopup from './SkillPopup';
import {
    HoverCard,
    HoverCardContent,
    HoverCardTrigger,
} from "@/components/ui/hover-card"
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { RarityPfx, RarityPfx_Border } from '../types/GamePrefixCSS';


interface InventoryCellProps {
    item?: InventoryItemType | null;
    onEquip?: () => void;
    onUnequip?: () => void;
    onDelete?: () => void;
    isEquipped?: boolean; // Used for equipment slots to indicate if the item is equipped
    slotType: 'inventory' | 'equipment'; // inventory, equipment (e.g., weapon, armor), etc.
    equipmentType?: string; // Optional, used for equipment slots for empty slots
}

const InventoryCell: React.FC<InventoryCellProps> = ({
    item,
    onEquip,
    onUnequip,
    onDelete,
    isEquipped,
    slotType = "inventory",
    equipmentType = "",
}) => {
    const handleAction = (action?: () => void) => {
        if (action) {
            action();
        }
    };    // Define the rarity-based styling
    const getRarityClass = (item?: InventoryItemType | null) => {
        if (!item) return 'border-gray-300';

        // Special handling for skills
        if ('effects' in item) {
            // For skills, use a blue border to differentiate them
            return 'border-blue-500';
        }

        // For regular items with rarity
        if (!item.rarity) return 'border-gray-300';
        return RarityPfx[item.rarity];
    };

    const getRarityBorderClass = (item?: InventoryItemType | null) => {
        if (!item) return '';

        // Special handling for skills
        if (item.class === "skill") {
            // For skills, use a blue border
            return 'border-blue-500';
        }

        // For regular items with rarity
        if (!item.rarity) return '';
        return RarityPfx_Border[item.rarity];
    };

    // Helper function to render the appropriate icon for an item
    const renderItemIcon = (item: InventoryItemType) => {
        if (item.image) {
            return <img src={item.image} alt={item.name} className="w-10 h-10 object-cover" />;
        } else {
            // For regular items
            return (
                <span className="text-gray-400">
                    {SlotIcons[item.type as keyof typeof SlotIcons] || SlotIcons[item.class as keyof typeof SlotIcons] || item.class || "U"}
                </span>
            );
        }
    };

    return (
        <HoverCard openDelay={500} closeDelay={100}>
            <HoverCardTrigger asChild>
                <div
                    className={`col-span-1 row-span-1 h-10 w-10 border-2 rounded-lg flex flex-col items-center justify-center relative transition-all duration-200 hover:border-teal-500 ${getRarityClass(item)}`}
                >
                    <Tooltip>
                        <TooltipTrigger>
                            {slotType === "equipment" && equipmentType !== "" && (!item ? (
                                <span className="text-gray-400">
                                    {equipmentType in SlotIcons ? (
                                        SlotIcons[equipmentType as keyof typeof SlotIcons] || equipmentType
                                    ) : (
                                        <span className="text-gray-400">
                                            {equipmentType.charAt(0).toUpperCase() + equipmentType.slice(1)}
                                        </span>
                                    )}
                                </span>
                            ) : (
                                <>
                                    {renderItemIcon(item)}
                                </>
                            ))}
                        </TooltipTrigger>
                        <TooltipContent>
                            <span className="text-sm text-gray-300">
                                {equipmentType === "skill" ? "Skill" :
                                    equipmentType === "consumable" ? "Item" :
                                        equipmentType.charAt(0).toUpperCase() + equipmentType.slice(1)}
                            </span>
                        </TooltipContent>
                    </Tooltip>

                    {slotType === "inventory" && (item ? (
                        <>
                            {renderItemIcon(item)}
                            {/* Show quantity badge for items with quantity > 1 */}
                            {'quantity' in item && item.quantity && item.quantity > 1 && (
                                <span className="absolute bottom-0 right-0 bg-gray-800 text-white text-xs px-1 rounded">
                                    {item.quantity}
                                </span>
                            )}
                            {/* Show special badge for skills */}
                            {item.class === "skill" && (
                                <span className="absolute bottom-0 right-0 bg-blue-800 text-white text-xs px-1 rounded">
                                    Skill
                                </span>
                            )}
                        </>
                    ) : (<span className="text-gray-400 text-xs">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M18 6l-12 12" /><path d="M6 6l12 12" /></svg></span>
                    ))}
                </div>
            </HoverCardTrigger>
            {item && (
                <HoverCardContent sideOffset={3} className={`w-64 bg-gray-600 ${getRarityBorderClass(item)} border-4`}>
                {item.class === "skill" ? (
                    <SkillPopup
                        skill={item as Skill}
                        onEquip={isEquipped ? undefined : () => handleAction(onEquip)}
                        onUnequip={isEquipped ? () => handleAction(onUnequip) : undefined}
                        onDelete={() => handleAction(onDelete)}
                    />
                ) : (
                    <ItemPopup
                        item={item as (Item | Equipment)}
                        onEquip={isEquipped ? undefined : () => handleAction(onEquip)}
                        onUnequip={isEquipped ? () => handleAction(onUnequip) : undefined}
                        onDelete={() => handleAction(onDelete)}
                    />
                )}
            </HoverCardContent>
            )}
        </HoverCard>
    );
};

export default InventoryCell;
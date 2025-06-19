import React from 'react';
import { Item, Equipment } from '../types/GameTypes';
import { SlotIcons } from '../types/GameIcons';
import ItemPopup from './ItemPopup';
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
    item?: Item | Equipment | null;
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
    };

    return (
        <HoverCard openDelay={500} closeDelay={100}>
            <HoverCardTrigger asChild>
                <div
                    className={`col-span-1 row-span-1 h-10 w-10 border-2 rounded-lg flex flex-col items-center justify-center relative transition-all duration-200 hover:border-teal-500 ${item ? `${RarityPfx[item.rarity]}` : 'border-gray-300'}`}
                >
                    <Tooltip>
                        <TooltipTrigger>
                            {slotType === "equipment" && equipmentType !== "" && (!item ? (
                                <span className="text-gray-400">
                                    {SlotIcons[equipmentType as keyof typeof SlotIcons] || equipmentType}
                                </span>
                            ) : (
                                <>
                                    {item.image ? (
                                        <img src={item.image} alt={item.name} className="w-10 h-10 object-cover" />
                                    ) : (
                                        <span className="text-gray-400">
                                            {SlotIcons[item.type as keyof typeof SlotIcons] || item.type}
                                        </span>

                                    )}
                                </>
                            ))}
                        </TooltipTrigger>
                        <TooltipContent>
                            <span className="text-sm text-gray-300">
                                {equipmentType.charAt(0).toUpperCase() + equipmentType.slice(1)}
                            </span>
                        </TooltipContent>
                    </Tooltip>

                    {slotType === "inventory" && (item ? (
                        <>
                            {item.image ? (
                                <img src={item.image} alt={item.name} className="w-10 h-10 object-cover" />
                            ) : (
                                <span className="text-gray-400">
                                    {SlotIcons[item.type as keyof typeof SlotIcons] || item.type}
                                </span>

                            )}
                            {item.quantity && item.quantity > 1 && (
                                <span className="absolute bottom-0 right-0 bg-gray-800 text-white text-xs px-1 rounded">
                                    {item.quantity}
                                </span>
                            )}
                        </>
                    ) : (
                        <span className="text-gray-400 text-xs">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" ><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M18 6l-12 12" /><path d="M6 6l12 12" /></svg></span>
                    ))}
                </div>
            </HoverCardTrigger>

            {item && (<HoverCardContent sideOffset={3} className={`w-64 bg-gray-600 ${RarityPfx_Border[item.rarity]} border-4`}>
                <ItemPopup
                    item={item}
                    onEquip={isEquipped ? undefined : () => handleAction(onEquip)}
                    onUnequip={isEquipped ? () => handleAction(onUnequip) : undefined}
                    onDelete={() => handleAction(onDelete)}
                />
            </HoverCardContent>
            )}
        </HoverCard>
    );
};

export default InventoryCell;
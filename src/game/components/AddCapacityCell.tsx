import React from 'react';
import { playerDataManager } from '../managers/PlayerDataManager';
import { showToast } from '../managers/ToastManager';
import {
    HoverCard,
    HoverCardContent,
    HoverCardTrigger,
} from "@/components/ui/hover-card"
import { ButtonPfx, TxtPfx } from '../types/GamePrefixCSS';
interface AddCapacityCellProps {
    currentCapacity: number;
}

const AddCapacityCell: React.FC<AddCapacityCellProps> = ({ currentCapacity }) => {
    const calculatePrice = (capacity: number) => {
        // Base price 100, doubles every purchase
        return Math.floor(100 * Math.pow(2, (capacity - 10) / 5));
    };

    const handleAddCapacity = () => {
        const currentData = playerDataManager.getPlayerData();
        const price = calculatePrice(currentCapacity);

        if (currentData.coins >= price) {
            const updatedData = { ...currentData };
            updatedData.coins -= price;
            updatedData.maxInventorySlots = currentCapacity + 5;
            playerDataManager.updatePlayerData(updatedData);
            showToast.success(`Inventory capacity increased by 5! (${currentCapacity + 5} slots total)`, 800,"addCapacitySuccess");
        } else {
            showToast.error(`Not enough coins! Need ${price} coins`, 800, "addCapacityError");
        }
    };

    return (
         <HoverCard>
            <HoverCardTrigger asChild>
                <div
                    className="w-10 h-10 col-span-1 row-span-1 flex items-center justify-center bg-gray-700/30 rounded-lg border-2 border-dashed border-gray-600/50 hover:border-teal-500/50 hover:bg-gray-700/50 transition-all duration-200 group hover:scale-105"
                >
                    <div className="flex flex-col items-center">
                        <svg
                            className="w-6 h-6 text-gray-500 group-hover:text-teal-400 transition-colors"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 4v16m8-8H4"
                            />
                        </svg>
                    </div>
                </div>
            </HoverCardTrigger>
            <HoverCardContent className="w-64 bg-gray-600 translate-y-2">
                <div className="text-sm text-gray-300 flex flex-col items-center">
                    <span>Add 5 slots for <span className={`${TxtPfx.coins}`}>{calculatePrice(currentCapacity)}</span> coins</span>
                    <button className={`${ButtonPfx.confirm}`} onClick={handleAddCapacity}>
                        Add Capacity
                    </button>
                </div>
            </HoverCardContent>
        </HoverCard>

    );
};

export default AddCapacityCell;

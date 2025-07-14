import React from 'react';
import { Item, Equipment } from '../types/GameTypes';
import { RarityPfx, TagPfx } from '../types/GamePrefixCSS';
import { capitalizeFirstLetter } from '../utils/utils';
interface ItemPopupProps {
    item: Item | Equipment;
    onEquip?: () => void;
    onUnequip?: () => void;
    onDelete?: () => void;
}

export const ItemPopup: React.FC<ItemPopupProps> = ({ item, onEquip, onUnequip, onDelete }) => {

    return (
        <div className="w-full h-full">
            <div className="text-lg font-bold text-teal-400">{capitalizeFirstLetter(item.name)}</div>
            <div className='flex gap-2'> {/* Display tags */}
                <span className={`${TagPfx} bg-gray-500 text-gray-300`}>{capitalizeFirstLetter(item.type)}</span>
                <span className={`${TagPfx} ${RarityPfx[item.rarity]}`}>{capitalizeFirstLetter(item.rarity)}</span>
            </div>
            {item.level && <p className="text-sm text-gray-300 font-bold">Level: {item.level}</p>}
            {item.quantity && item.quantity > 1 && <p className="text-sm">Quantity: {item.quantity}</p>}

            <div className="mt-2 max-h-32 overflow-y-auto">
                {item.stats && (
                    <>
                        {Object.entries(item.stats.mainStat).map(([statName, value]) => {
                            if (value === undefined || value === 0) return null; // Skip undefined or zero values
                            return (
                                <p key={statName} className="font-semibold text-lg text-gray-300">
                                    {capitalizeFirstLetter(statName)}: {typeof value === 'number' ? Math.floor(value) : value}
                                </p>
                            );
                        })}
                        {item.stats.subStats?.map((subStat, index) => (
                            <div key={index}>
                                {Object.entries(subStat).map(([statName, value]) => (
                                    <p key={statName} className="text-sm text-gray-300">
                                        {capitalizeFirstLetter(statName)}: {typeof value === 'number' ? Math.floor(value) : value}
                                    </p>
                                ))}
                            </div>
                        ))}
                    </>
                )}
            </div>
            <p className="text-sm mt-2">Value: {item.value} Coins</p>
            {onEquip && (item.class === "equipment" || (item.class === "item" && item.type === "consumable")) && (
                <button
                    onClick={onEquip}
                    className="mt-2 bg-teal-600 text-white px-3 py-1 rounded hover:bg-teal-700"
                >
                    Equip
                </button>
            )}
            {onUnequip && (item.class === "equipment" || (item.class === "item" && item.type === "consumable")) && (
                <button
                    onClick={onUnequip}
                    className="mt-2 bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 ml-2"
                >
                    Unequip
                </button>
            )}
            {onDelete && (
                <button
                    onClick={onDelete}
                    className="mt-2 bg-yellow-600 text-white px-3 py-1 rounded hover:bg-yellow-700 ml-2"
                >
                    Delete
                </button>
            )}
        </div>
    );
};

export default ItemPopup;
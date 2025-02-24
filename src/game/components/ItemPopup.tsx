import React from 'react';
import { Item, Equipment } from '../types/PlayerData';

interface ItemPopupProps {
  item: Item | Equipment;
  position: { x: number; y: number };
  onEquip?: () => void;
  onUnequip?: () => void;
  onDelete?: () => void;
}

export const ItemPopup: React.FC<ItemPopupProps> = ({ item, position, onEquip, onUnequip, onDelete }) => {
  const rarityColors = {
    common: 'bg-green-500',
    uncommon: 'bg-blue-500',
    rare: 'bg-purple-500',
    epic: 'bg-orange-500',
    mythic: 'bg-yellow-500',
  };

  return (
    <div className="w-full h-full">
      <h3 className="text-lg font-bold text-teal-400">{item.name}</h3>
      <p className="text-sm capitalize">{item.type}</p>
      <p className={`text-sm ${rarityColors[item.rarity]} px-2 rounded inline-block`}>{item.rarity}</p>

      {item.level && <p className="text-sm">Level: {item.level}</p>}
      {item.quantity && item.quantity > 1 && <p className="text-sm">Quantity: {item.quantity}</p>}

      <div className="mt-2 max-h-32 overflow-y-auto">
        {item.stats && (
          <>
            {Object.entries(item.stats.mainStat).map(([statName, value]) => (
              <p key={statName} className="font-semibold">
            {statName}: {value}
              </p>
            ))}
            {item.stats.subStats?.map((subStat, index) => (
              <div key={index}>
            {Object.entries(subStat).map(([statName, value]) => (
              <p key={statName} className="text-sm text-gray-300">
                {statName}: {value}
              </p>
            ))}
              </div>
            ))}
          </>
        )}
      </div>
      <p className="text-sm mt-2">Value: {item.value} Coins</p>
      {onEquip && (
        <button
          onClick={onEquip}
          className="mt-2 bg-teal-600 text-white px-3 py-1 rounded hover:bg-teal-700"
        >
          Equip
        </button>
      )}
      {onUnequip && (
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
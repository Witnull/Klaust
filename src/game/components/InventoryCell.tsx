import React, { useState, useRef } from 'react';
import { Item , Equipment } from '../types/PlayerData';
import ItemPopup from './ItemPopup';

interface InventoryCellProps {
  item?: Item | Equipment | null;
  onClick?: () => void;
//   onEquip?: () => void;
//   onUnequip?: () => void;
//   onDelete?: () => void;
  onHover?: (position: { x: number; y: number }) => void;
}

const InventoryCell: React.FC<InventoryCellProps> = ({ item, onClick, onHover }) => {
    const cellRef = useRef<HTMLDivElement>(null);

  const rarityColors = {
    common: 'border-green-500',
    uncommon: 'border-blue-500',
    rare: 'border-purple-500',
    epic: 'border-orange-500',
    mythic: 'border-yellow-500',
  };

    const handleMouseEnter = (e: React.MouseEvent) => {
        if (item && cellRef.current && onHover) {
        const rect = cellRef.current.getBoundingClientRect();
        onHover({ x: rect.right + 10, y: rect.top });
        }
    };

    const handleMouseLeave = () => {
        if (onHover) onHover(null as any); // Clear hover state
    };

  return (
    <div
      ref={cellRef}
      className={`w-12 h-12 border-2 rounded-lg flex flex-col items-center justify-center relative transition-all duration-200 ${
        item ? `${rarityColors[item.rarity]} hover:border-teal-400` : 'border-gray-500'
      }`}
      onClick={onClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {item ? (
        <>
          {item.image ? (
            <img src={item.image} alt={item.name} className="w-10 h-10 object-cover" />
          ) : (
            <span className="text-white text-xs truncate">{item.name}</span>
          )}
          {item.quantity && item.quantity > 1 && (
            <span className="absolute bottom-0 right-0 bg-gray-800 text-white text-xs px-1 rounded">
              {item.quantity}
            </span>
          )}
        </>
      ) : (
        <span className="text-gray-400 text-xs">Empty</span>
      )}
    </div>
  );
};

export default InventoryCell;
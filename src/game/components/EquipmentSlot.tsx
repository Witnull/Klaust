import React, { useRef } from 'react';
import { Item, Equipment } from '../types/PlayerData';


interface EquipmentSlotProps {
    slotType: string;
    item?: Item | Equipment;
    onUnequip?: () => void;
    onDelete?: () => void;
    onHover?: (position: { x: number; y: number }) => void;
  }
  
const EquipmentSlot: React.FC<EquipmentSlotProps> = ({ slotType, item, onUnequip, onDelete, onHover }) => {
    const cellRef = useRef<HTMLDivElement>(null);
    const slotIcons = {
        weapon: '⚔️',
        helmet: '🪖',
        armor: '🛡️',
        gloves: '🧤',
        boots: '🥾',
        leggings: '🩳',
        necklace: '📿',
        rings: '��',

    };

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
      className={`w-12 h-12 border-2 rounded-lg flex items-center justify-center transition-all duration-200 ${
        item ? `${rarityColors[item.rarity]} hover:border-teal-400` : 'border-gray-500'
      }`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {item ? (
        <img src={item.image || '/default-item.png'} alt={item.name} className="w-10 h-10 object-cover" />
      ) : (
        <span className="text-gray-400 text-xl">
          {slotIcons[slotType as keyof typeof slotIcons] || slotType}
        </span>
      )}
    </div>
  );
};

export default EquipmentSlot;
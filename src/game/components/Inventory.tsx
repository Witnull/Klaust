import React from 'react';
import { PlayerData, Item, Equipment } from '../types/PlayerData';
import InventoryCell from './InventoryCell';
import { playerDataManager } from '../managers/PlayerDataManager';

const Inventory: React.FC<{
  playerData: PlayerData;
  onUpdate: (updatedData: PlayerData) => void;
  onHover: (item: Item | Equipment | undefined, position: { x: number; y: number }) => void;
}> = ({ playerData, onUpdate, onHover }) => {
  const handleEquip = (item: Equipment) => {
    const currentData = playerDataManager.getPlayerData();
    const slot = item.type as keyof typeof currentData.equipment;
    const currentItem = currentData.equipment[slot];

    // Early return if item is already equipped
    if (currentItem === item) return;

    const updatedData = JSON.parse(JSON.stringify(currentData)); // Deep copy

    if (currentItem && !Array.isArray(currentItem)) {
      if (updatedData.inventory.length < 45) {
        updatedData.inventory.push(currentItem);
        updatedData.equipment[slot] = undefined;
      } else {
        console.warn("Inventory full: Cannot unequip current item to equip new one");
        return;
      }
    }

    updatedData.inventory = updatedData.inventory.filter((i: Equipment) => i.id !== item.id);
    updatedData.equipment[slot] = item;

    if (item.stats) {
      const hpBonus =
        (item.stats?.mainStat?.maxhp || 0) +
        (item.stats?.subStats?.find(stat => stat?.maxhp !== undefined)?.maxhp || 0);
      updatedData.stats.maxhp += hpBonus;
      updatedData.stats.hp = Math.min(updatedData.stats.hp + hpBonus, updatedData.stats.maxhp);

      const manaBonus =
        (item.stats?.mainStat?.maxmana || 0) +
        (item.stats?.subStats?.find(stat => stat?.maxmana !== undefined)?.maxmana || 0);
      updatedData.stats.maxmana += manaBonus;
      updatedData.stats.mana = Math.min(updatedData.stats.mana + manaBonus, updatedData.stats.maxmana);

      const attackBonus =
        (item.stats?.mainStat?.attack || 0) +
        (item.stats?.subStats?.find(stat => stat?.attack !== undefined)?.attack || 0);
      updatedData.stats.attack += attackBonus;

      const defenseBonus =
        (item.stats?.mainStat?.defense || 0) +
        (item.stats?.subStats?.find(stat => stat?.defense !== undefined)?.defense || 0);
      updatedData.stats.defense += defenseBonus;

      const speedBonus =
        (item.stats?.mainStat?.speed || 0) +
        (item.stats?.subStats?.find(stat => stat?.speed !== undefined)?.speed || 0);
      updatedData.stats.speed += speedBonus;

      const magicBonus =
        (item.stats?.mainStat?.magic || 0) +
        (item.stats?.subStats?.find(stat => stat?.magic !== undefined)?.magic || 0);
      updatedData.stats.magic += magicBonus;
    }

    playerDataManager.updatePlayerData(updatedData);
    onUpdate(updatedData); // Notify App.tsx (though this might be redundant with PlayerDataManager)
  };

  const handleDelete = (item: Item | Equipment | undefined, isEquipped: boolean) => {
    if (!item) return;

    const currentData = playerDataManager.getPlayerData();
    const updatedData = JSON.parse(JSON.stringify(currentData)); // Deep copy

    if (isEquipped) {
      const slot = item.type as keyof typeof updatedData.equipment;
      updatedData.equipment[slot] = undefined;

      // Reverse stat bonuses if applicable
      if ("stats" in item && item.stats) {
        const hpBonus =
          (item.stats?.mainStat?.maxhp || 0) +
          (item.stats?.subStats?.find(stat => stat?.maxhp !== undefined)?.maxhp || 0);
        updatedData.stats.maxhp -= hpBonus;
        updatedData.stats.hp = Math.min(updatedData.stats.hp, updatedData.stats.maxhp);

        const manaBonus =
          (item.stats?.mainStat?.maxmana || 0) +
          (item.stats?.subStats?.find(stat => stat?.maxmana !== undefined)?.maxmana || 0);
        updatedData.stats.maxmana -= manaBonus;
        updatedData.stats.mana = Math.min(updatedData.stats.mana, updatedData.stats.maxmana);

        const attackBonus =
          (item.stats?.mainStat?.attack || 0) +
          (item.stats?.subStats?.find(stat => stat?.attack !== undefined)?.attack || 0);
        updatedData.stats.attack -= attackBonus;

        const defenseBonus =
          (item.stats?.mainStat?.defense || 0) +
          (item.stats?.subStats?.find(stat => stat?.defense !== undefined)?.defense || 0);
        updatedData.stats.defense -= defenseBonus;

        const speedBonus =
          (item.stats?.mainStat?.speed || 0) +
          (item.stats?.subStats?.find(stat => stat?.speed !== undefined)?.speed || 0);
        updatedData.stats.speed -= speedBonus;

        const magicBonus =
          (item.stats?.mainStat?.magic || 0) +
          (item.stats?.subStats?.find(stat => stat?.magic !== undefined)?.magic || 0);
        updatedData.stats.magic -= magicBonus;
      }
    } else {
      updatedData.inventory = updatedData.inventory.filter((i : Equipment ) => i.id !== item.id);
    }

    playerDataManager.updatePlayerData(updatedData);
    onUpdate(updatedData); // Notify App.tsx
  };

  return (
    <div className="flex flex-col h-full bg-gray-800 p-4 rounded-lg shadow-lg text-white">
      <h3 className="text-lg font-bold mb-4 text-teal-600">Inventory</h3>
      <div className="grid grid-cols-5 gap-2 overflow-y-scroll h-full">
        {playerData.inventory.map((item, index) => (
          <InventoryCell
            key={item.id || index} // Use item.id if available for better uniqueness
            item={item}
            //onClick={() => "type" in item && handleEquip(item as Equipment)} // Only equip if it’s Equipment
            onHover={(position) => onHover(item, position)}
          />
        ))}
        {Array.from({ length: Math.max(0, 45 - playerData.inventory.length) }).map((_, index) => (
          <InventoryCell
            key={`empty-${index}`}
            onHover={(position) => onHover(undefined, position)}
          />
        ))}
      </div>
    </div>
  );
};

export default Inventory;
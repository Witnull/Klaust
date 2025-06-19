import { get } from 'http';
import { PlayerData, Item, Equipment, Stats, DIRECT_STATS_TYPES, LIMIT_STATS_TYPES  } from '../types/GameTypes';
import { playerDataManager } from './PlayerDataManager';
import { showToast } from './ToastManager';

class EquipmentManager {
    private actionDebounce = false;

    handleEquip = (item: Equipment) => {
        if (this.actionDebounce) return;
        this.actionDebounce = true;

        const currentData = playerDataManager.getPlayerData();
        if (!currentData.inventory.some((i: Equipment | Item) => i.id === item.id)) {
            showToast.warn("Cannot equip item: Item not found in inventory");
            this.actionDebounce = false;
            return;
        }

        const slot = item.type;
        const currentItem = currentData.equipment[slot];

        if (currentItem === item) {
            this.actionDebounce = false;
            return;
        }

        const updatedData = JSON.parse(JSON.stringify(currentData));

        // Handle replacing an existing item
        if (currentItem) {
            // Check if inventory has space
            if (updatedData.inventory.length >= updatedData.maxInventorySlots + 1) {
                showToast.warn("Cannot equip item: Inventory is full");
                this.actionDebounce = false;
                return;
            }

            // Reverse stats of the current item
            if (currentItem.stats) {
                this.removeItemStats(updatedData, currentItem);
            }

            // Add the old item back to inventory
            updatedData.inventory.push(currentItem);
        }

        // Remove the new item from inventory and equip it
        updatedData.inventory = updatedData.inventory.filter((i: Equipment) => i.id !== item.id);
        updatedData.equipment[slot] = item;        // Apply stats of the new item
        if (item.stats) {
            this.applyItemStats(updatedData, item);
        }
        playerDataManager.updatePlayerData(updatedData);
        showToast.success(`Item ${item.name} [${slot}] equipped!`);
        this.actionDebounce = false;
    };

    handleUnequip = (slot: keyof PlayerData['equipment']) => {
        if (this.actionDebounce) return;
        this.actionDebounce = true;

        const currentData = playerDataManager.getPlayerData();
        const item = currentData.equipment[slot];

        if (item && currentData.inventory.length < currentData.maxInventorySlots) {
            const updatedData = JSON.parse(JSON.stringify(currentData));
            updatedData.inventory.push(item);
            updatedData.equipment[slot] = undefined;            // Reverse stat bonuses if applicable
            if (item.stats) {
                this.removeItemStats(updatedData, item);
            }
            playerDataManager.updatePlayerData(updatedData);
            showToast.success(`Item ${item.name} [${slot}] unequipped!`);
        } else {
            showToast.warn("Cannot unequip item: Inventory is full or no item in slot");
        }

        this.actionDebounce = false;
    };

    handleDelete = (item: Item | Equipment | undefined, isEquipped: boolean) => {
        if (this.actionDebounce || !item) return;
        this.actionDebounce = true;

        const currentData = playerDataManager.getPlayerData();
        const updatedData = JSON.parse(JSON.stringify(currentData));

        if (isEquipped) {
            const slot = item.type as keyof typeof updatedData.equipment;
            if (slot && updatedData.equipment[slot]) {
                updatedData.equipment[slot] = undefined;

                // Reverse stat bonuses if applicable
                if ("stats" in item && item.stats) {
                    this.removeItemStats(updatedData, item as Equipment);
                }
            }
        } else {
            updatedData.inventory = updatedData.inventory.filter(
                (i: Item | Equipment) => i.id !== item.id
            );
        }

        playerDataManager.updatePlayerData(updatedData);
        showToast.success("Item deleted!");
        this.actionDebounce = false;
    };

    private applyItemStats(playerData: PlayerData, item: Equipment) {
        if (!item.stats) return;

        const hpBonus = this.calculateStatBonus(item, 'max_hp');
        playerData.stats.max_hp += hpBonus;
        playerData.stats.hp = Math.min(playerData.stats.hp + hpBonus, playerData.stats.max_hp);

        const manaBonus = this.calculateStatBonus(item, 'max_mana');
        playerData.stats.max_mana += manaBonus;
        playerData.stats.mana = Math.min(playerData.stats.mana + manaBonus, playerData.stats.max_mana);

        // Add other stats loop
        for (const stat of DIRECT_STATS_TYPES) {
            playerData.stats[stat] += this.calculateStatBonus(item, stat);
        }
    }

    private removeItemStats(playerData: PlayerData, item: Equipment) {
        if (!item.stats) return;

        const hpBonus = this.calculateStatBonus(item, 'max_hp');
        playerData.stats.max_hp -= hpBonus;
        playerData.stats.hp = Math.min(playerData.stats.hp, playerData.stats.max_hp);

        const manaBonus = this.calculateStatBonus(item, 'max_mana');
        playerData.stats.max_mana -= manaBonus;
        playerData.stats.mana = Math.min(playerData.stats.mana, playerData.stats.max_mana);

        // Remove other stats loop
        for (const stat of DIRECT_STATS_TYPES) {
            playerData.stats[stat] -= this.calculateStatBonus(item, stat);
        }
    }

    private calculateStatBonus(item: Equipment, statName: keyof Stats): number {
        if (!item.stats) return 0;
        //console.log(`Calculating stat bonus for ${statName} on item:`, item);
        const mainStatBonus = item.stats.mainStat?.[statName] || 0;

        const subStatBonus = item.stats.subStats?.reduce((total, subStat) => {
            return total + (subStat?.[statName] || 0);
        }, 0) || 0;
        //console.log(`Calculating stat bonus for ${statName}: mainStat=${mainStatBonus}, subStats=${subStatBonus}`);
        return mainStatBonus + subStatBonus;
    }
}

export const equipmentManager = new EquipmentManager();

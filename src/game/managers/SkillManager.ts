import { Skill } from '../types/GameTypes';
import { playerDataManager } from './PlayerDataManager';
import { showToast } from './ToastManager';
import { combatEvent } from '../EventBus';

class SkillManager {
    private actionDebounce = false;
    private MAX_EQUIPPED_SKILLS = 4;

    /**
     * Equip a skill to a specific slot
     * @param skill The skill to equip
     * @param slot The slot to equip to (0-3)
     */    equipSkill = (skill: Skill, slot: number) => {
        if (this.actionDebounce) return;
        this.actionDebounce = true;

        if (slot < 0 || slot >= this.MAX_EQUIPPED_SKILLS) {
            showToast.warn(`Invalid skill slot: ${slot}`);
            this.actionDebounce = false;
            return;
        }

        const currentData = playerDataManager.getPlayerData();

        // Check if the skill exists in the player's skill list
        if (!currentData.skills?.some(s => s.id === skill.id)) {
            showToast.warn("Cannot equip skill: Skill not found");
            this.actionDebounce = false;
            return;
        }

        // Create a copy of the current data to work with
        const updatedData = JSON.parse(JSON.stringify(currentData));

        // Check if there's already a skill in the target slot
        const currentSkill = updatedData.equippedSkills && updatedData.equippedSkills[slot];
        if (currentSkill) {
            // Put the currently equipped skill back in the skills array
            if (!updatedData.skills) {
                updatedData.skills = [];
            }
            updatedData.skills.push(currentSkill);
        }

        // Create or update equipped skills array
        const equippedSkills = [...(updatedData.equippedSkills || [])];

        // Fill with null values if needed
        while (equippedSkills.length < this.MAX_EQUIPPED_SKILLS) {
            equippedSkills.push(null as unknown as Skill);
        }

        // Remove the skill from the skills array
        updatedData.skills = updatedData.skills.filter((s: Skill) => s.id !== skill.id);

        // Replace the skill at the specified slot
        equippedSkills[slot] = skill;
        updatedData.equippedSkills = equippedSkills;

        playerDataManager.updatePlayerData(updatedData);

        showToast.success(`Skill ${skill.name} equipped to slot ${slot + 1}`);
        this.actionDebounce = false;
    };

    /**
     * Unequip a skill from a slot
     * @param slot The slot to unequip (0-3)
     */    unequipSkill = (slot: number) => {
        if (this.actionDebounce) return;
        this.actionDebounce = true;

        if (slot < 0 || slot >= this.MAX_EQUIPPED_SKILLS) {
            showToast.warn(`Invalid skill slot: ${slot}`);
            this.actionDebounce = false;
            return;
        }

        const currentData = playerDataManager.getPlayerData();

        if (!currentData.equippedSkills || !currentData.equippedSkills[slot]) {
            showToast.warn("No skill equipped in this slot");
            this.actionDebounce = false;
            return;
        }

        // Create a copy of the current data to work with
        const updatedData = JSON.parse(JSON.stringify(currentData));

        // Get the skill being unequipped
        const skillToUnequip = updatedData.equippedSkills[slot];

        // Add the skill back to the skills array
        if (!updatedData.skills) {
            updatedData.skills = [];
        }
        updatedData.skills.push(skillToUnequip);

        // Create a copy of the equipped skills
        const equippedSkills = [...updatedData.equippedSkills];

        // Set the slot to null
        equippedSkills[slot] = null as unknown as Skill;
        updatedData.equippedSkills = equippedSkills;

        playerDataManager.updatePlayerData(updatedData);

        showToast.success(`Skill unequipped from slot ${slot + 1}`);
        this.actionDebounce = false;
    };

    /**
     * Use a skill in combat by slot
     * @param slot The slot of the skill to use (0-3)
     */
    useSkillBySlot = (slot: number) => {
        if (this.actionDebounce) return;
        this.actionDebounce = true;

        const currentData = playerDataManager.getPlayerData();

        if (!currentData.equippedSkills || !currentData.equippedSkills[slot]) {
            showToast.warn("No skill equipped in this slot");
            this.actionDebounce = false;
            return;
        }

        const skill = currentData.equippedSkills[slot];

        // Use the skill in combat
        combatEvent.emit('useSkill', skill.id);

        this.actionDebounce = false;
    };

    /**
     * Equip a consumable item to a specific slot
     * @param itemId The ID of the consumable to equip
     * @param slot The slot to equip to (0-3)
     */    equipConsumable = (itemId: string, slot: number) => {
        if (this.actionDebounce) return;
        this.actionDebounce = true;

        // Similar to equipSkill but for consumables
        const currentData = playerDataManager.getPlayerData();

        // Find the item in inventory
        const item = currentData.inventory.find(i => i.id === itemId && "type" in i && i.type === "consumable");

        if (!item) {
            showToast.warn("Cannot equip item: Item not found or not a consumable");
            this.actionDebounce = false;
            return;
        }

        // Create a copy of the current data to work with
        const updatedData = JSON.parse(JSON.stringify(currentData));

        // Check if there's already a consumable in the target slot
        const currentItem = updatedData.equippedConsumables && updatedData.equippedConsumables[slot];
        if (currentItem) {
            // Put the currently equipped consumable back in the inventory
            updatedData.inventory.push(currentItem);
        }

        // Create or update equipped consumables array
        const equippedConsumables = [...(updatedData.equippedConsumables || [])];

        // Fill with null values if needed
        while (equippedConsumables.length < this.MAX_EQUIPPED_SKILLS) {
            equippedConsumables.push(null as any);
        }

        // Remove the consumable from inventory
        updatedData.inventory = updatedData.inventory.filter((i: any) => i.id !== itemId);

        // Replace the item at the specified slot
        equippedConsumables[slot] = item as any;
        updatedData.equippedConsumables = equippedConsumables;

        playerDataManager.updatePlayerData(updatedData);

        showToast.success(`Item ${item.name} equipped to slot ${slot + 1}`);
        this.actionDebounce = false;
    };

    /**
     * Unequip a consumable from a slot
     * @param slot The slot to unequip (0-3)
     */    unequipConsumable = (slot: number) => {
        if (this.actionDebounce) return;
        this.actionDebounce = true;

        if (slot < 0 || slot >= this.MAX_EQUIPPED_SKILLS) {
            showToast.warn(`Invalid consumable slot: ${slot}`);
            this.actionDebounce = false;
            return;
        }

        const currentData = playerDataManager.getPlayerData();

        if (!currentData.equippedConsumables || !currentData.equippedConsumables[slot]) {
            showToast.warn("No consumable equipped in this slot");
            this.actionDebounce = false;
            return;
        }

        // Create a copy of the current data to work with
        const updatedData = JSON.parse(JSON.stringify(currentData));

        // Get the item being unequipped
        const itemToUnequip = updatedData.equippedConsumables[slot];

        // Check if we have inventory space
        if (updatedData.inventory.length >= updatedData.maxInventorySlots) {
            showToast.warn("Cannot unequip item: Inventory is full");
            this.actionDebounce = false;
            return;
        }

        // Add the item back to inventory
        updatedData.inventory.push(itemToUnequip);

        // Create a copy of the equipped consumables
        const equippedConsumables = [...updatedData.equippedConsumables];

        // Set the slot to null
        equippedConsumables[slot] = null as any;
        updatedData.equippedConsumables = equippedConsumables;

        playerDataManager.updatePlayerData(updatedData);

        showToast.success(`Item unequipped from slot ${slot + 1}`);
        this.actionDebounce = false;
    };

    /**
     * Delete a skill from the player's skill list
     * @param skillId The ID of the skill to delete
     */    deleteSkill = (skillId: string) => {
        if (this.actionDebounce) return;
        this.actionDebounce = true;

        const currentData = playerDataManager.getPlayerData();

        // Create a copy of the current data to work with
        const updatedData = JSON.parse(JSON.stringify(currentData));

        // Check if the skill exists in either the skills list or equipped skills
        const skillInList = updatedData.skills?.some((s: Skill) => s.id === skillId);
        const equippedIndex = updatedData.equippedSkills?.findIndex((s: Skill) => s && s.id === skillId) ?? -1;

        if (!skillInList && equippedIndex < 0) {
            showToast.warn("Cannot delete skill: Skill not found");
            this.actionDebounce = false;
            return;
        }

        // If the skill is in the regular skills array, remove it
        if (skillInList) {
            updatedData.skills = updatedData.skills.filter((s: Skill) => s.id !== skillId);
        }

        // If the skill is equipped, remove it from there too
        if (equippedIndex >= 0) {
            // Create a copy of the equipped skills
            const equippedSkills = [...updatedData.equippedSkills];

            // Set the slot to null
            equippedSkills[equippedIndex] = null as unknown as Skill;
            updatedData.equippedSkills = equippedSkills;
        }

        playerDataManager.updatePlayerData(updatedData);

        showToast.success("Skill deleted successfully");
        this.actionDebounce = false;
    };

    /**
     * Delete a consumable item from either inventory or equipped slots
     * @param itemId The ID of the consumable to delete
     * @param isEquipped Whether the consumable is equipped or in inventory
     */
    deleteConsumable = (itemId: string, isEquipped: boolean) => {
        if (this.actionDebounce) return;
        this.actionDebounce = true;

        const currentData = playerDataManager.getPlayerData();

        // Create a copy of the current data to work with
        const updatedData = JSON.parse(JSON.stringify(currentData));

        if (isEquipped) {
            // Find which slot the consumable is equipped in
            const equippedIndex = updatedData.equippedConsumables?.findIndex((c: any) => c && c.id === itemId) ?? -1;

            if (equippedIndex < 0) {
                showToast.warn("Cannot delete item: Item not found in equipped slots");
                this.actionDebounce = false;
                return;
            }

            // Create a copy of the equipped consumables
            const equippedConsumables = [...updatedData.equippedConsumables];

            // Set the slot to null
            equippedConsumables[equippedIndex] = null;
            updatedData.equippedConsumables = equippedConsumables;
        } else {
            // Remove the item from inventory
            const itemExists = updatedData.inventory.some((i: any) => i.id === itemId);

            if (!itemExists) {
                showToast.warn("Cannot delete item: Item not found in inventory");
                this.actionDebounce = false;
                return;
            }

            updatedData.inventory = updatedData.inventory.filter((i: any) => i.id !== itemId);
        }

        playerDataManager.updatePlayerData(updatedData);

        showToast.success("Item deleted successfully");
        this.actionDebounce = false;
    };
}

export const skillManager = new SkillManager();

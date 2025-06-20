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
     */
    equipSkill = (skill: Skill, slot: number) => {
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

        // Create or update equipped skills array
        const equippedSkills = [...(currentData.equippedSkills || [])];
        
        // Fill with null values if needed
        while (equippedSkills.length < this.MAX_EQUIPPED_SKILLS) {
            equippedSkills.push(null as unknown as Skill);
        }
        
        // Replace the skill at the specified slot
        equippedSkills[slot] = skill;

        playerDataManager.updatePlayerData({
            equippedSkills
        });
        
        showToast.success(`Skill ${skill.name} equipped to slot ${slot + 1}`);
        this.actionDebounce = false;
    };

    /**
     * Unequip a skill from a slot
     * @param slot The slot to unequip (0-3)
     */
    unequipSkill = (slot: number) => {
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

        // Create a copy of the equipped skills
        const equippedSkills = [...currentData.equippedSkills];
        
        // Set the slot to null
        equippedSkills[slot] = null as unknown as Skill;
        
        playerDataManager.updatePlayerData({
            equippedSkills
        });
        
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
     */
    equipConsumable = (itemId: string, slot: number) => {
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

        // Create or update equipped consumables array
        const equippedConsumables = [...(currentData.equippedConsumables || [])];
        
        // Fill with null values if needed
        while (equippedConsumables.length < this.MAX_EQUIPPED_SKILLS) {
            equippedConsumables.push(null as any);
        }
        
        // Replace the item at the specified slot
        equippedConsumables[slot] = item as any;

        playerDataManager.updatePlayerData({
            equippedConsumables
        });
        
        showToast.success(`Item ${item.name} equipped to slot ${slot + 1}`);
        this.actionDebounce = false;
    };

    /**
     * Unequip a consumable from a slot
     * @param slot The slot to unequip (0-3)
     */
    unequipConsumable = (slot: number) => {
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

        // Create a copy of the equipped consumables
        const equippedConsumables = [...currentData.equippedConsumables];
        
        // Set the slot to null
        equippedConsumables[slot] = null as any;
        
        playerDataManager.updatePlayerData({
            equippedConsumables
        });
        
        showToast.success(`Item unequipped from slot ${slot + 1}`);
        this.actionDebounce = false;
    };

    /**
     * Delete a skill from the player's skill list
     * @param skillId The ID of the skill to delete
     */
    deleteSkill = (skillId: string) => {
        if (this.actionDebounce) return;
        this.actionDebounce = true;

        const currentData = playerDataManager.getPlayerData();
        
        // Check if the skill exists in the player's skill list
        if (!currentData.skills?.some(s => s.id === skillId)) {
            showToast.warn("Cannot delete skill: Skill not found");
            this.actionDebounce = false;
            return;
        }

        // First check if the skill is equipped and unequip it if needed
        const equippedIndex = currentData.equippedSkills?.findIndex(s => s && s.id === skillId) ?? -1;
        if (equippedIndex >= 0) {
            this.unequipSkill(equippedIndex);
        }

        // Remove the skill from the skills array
        const updatedSkills = currentData.skills.filter(s => s.id !== skillId);
        
        playerDataManager.updatePlayerData({
            skills: updatedSkills
        });
        
        showToast.success("Skill deleted successfully");
        this.actionDebounce = false;
    };
}

export const skillManager = new SkillManager();

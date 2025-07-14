// CombatScene.tsx
import Phaser from 'phaser';
import { CombatManager } from '../managers/CombatManager';
import { EnemyData, PlayerData } from '../types/GameTypes';
import { combatEvent } from '../EventBus';

export default class CombatScene extends Phaser.Scene {
    private combatManager!: CombatManager;

    constructor() {
        super('CombatScene');
    }

    init(data: { player: PlayerData; enemyData: EnemyData }) {
        this.combatManager = new CombatManager(data.player, data.enemyData);
    }    
    
    create() {
        // Define action handlers
        const handleNormalAttack = () => this.combatManager.normalAttack();
        const handleUseSkill = (skillId: string) => this.combatManager.useSkill(skillId);
        const handleFlee = () => this.combatManager.flee();
        const handleUseConsumable = (itemId: string) => this.combatManager.useConsumable(itemId);

        // Register combat action listeners
        combatEvent.on('normalAttack', handleNormalAttack);
        combatEvent.on('useSkill', handleUseSkill);
        combatEvent.on('flee', handleFlee);
        combatEvent.on('useConsumable', handleUseConsumable);

        // Start combat
        this.combatManager.startCombat();

        // Handle combat end
        const handleCombatEnd = ({ result }: { result: 'victory' | 'defeat' | 'fled' }) => {
            console.log(`CombatScene: combatEnd received with result: ${result}`);
            // if (result === 'victory' || result === 'fled') {
            //     this.scene.resume('GameScene');
            // } else if (result === 'defeat') {
            //     this.scene.start('GameScene'); // Restart on defeat
            // }
            this.scene.resume('GameScene');
            this.scene.stop('CombatScene');            // Clean up listeners
            combatEvent.off('normalAttack', handleNormalAttack);
            combatEvent.off('useSkill', handleUseSkill);
            combatEvent.off('flee', handleFlee);
            combatEvent.off('useConsumable', handleUseConsumable);
            combatEvent.off('consumableUsed'); // Remove any lingering consumableUsed listeners
            combatEvent.off('combatEnd', handleCombatEnd);
        };

        // Ensure no duplicate combatEnd listeners
        combatEvent.off('combatEnd', handleCombatEnd);
        combatEvent.on('combatEnd', handleCombatEnd);
    }

    shutdown() {
        // Optional: Cleanup all combatEvent listeners if scene is stopped externally
        combatEvent.removeAllListeners(); // Be cautious if other scenes use combatEvent

    }
}
import Phaser from 'phaser';
import { EnemyData, Stats } from '../types/PlayerData';

export class Enemy {
    private sprite: Phaser.GameObjects.Sprite;
    private enemyData: EnemyData;
    private scene: Phaser.Scene;
    private getMapAt: (x: number, y: number) => number;
    private offset = 0.5;

    constructor(scene: Phaser.Scene, x: number, y: number, enemyData: EnemyData, getMapAt: (x: number, y: number) => number) {
      this.scene = scene;
      this.enemyData = enemyData;
      this.getMapAt = getMapAt;
      this.sprite = scene.add.sprite((x + this.offset )* 16, (y+ this.offset) * 16, 'enemy');
      this.setInitialScale();
    }
  
    private setInitialScale() {
      const scaleFactor = this.scene.cameras.main.width / (32 * 16);
      this.sprite.setScale(scaleFactor);
    }
  
    moveTowardPlayer(player: { position: { x: number; y: number } }) {
      const dx = player.position.x - this.enemyData.position.x;
      const dy = player.position.y - this.enemyData.position.y;
      if (Math.abs(dx) <= 8 && Math.abs(dy) <= 8) {
        const moveX = dx !== 0 ? Math.sign(dx) : 0;
        const moveY = dy !== 0 ? Math.sign(dy) : 0;
        const newX = this.enemyData.position.x + moveX;
        const newY = this.enemyData.position.y + moveY;

        if (this.getMapAt(newX, newY) === 0) {
          this.enemyData.position.x = newX;
          this.enemyData.position.y = newY;
          this.scene.tweens.add({
            targets: this.sprite,
            x: (this.enemyData.position.x + this.offset) * 16,
            y: (this.enemyData.position.y  + this.offset)* 16,
            duration: 180,
            ease: 'Linear',
          });
        }
      }
    }
  
    getSprite(): Phaser.GameObjects.Sprite {
      return this.sprite;
    }
  

    /**
     * Gets the enemy's stats.
     * @returns {Stats} The enemy's current stats.
     */
    getEnemyData(): EnemyData {
        return { ...this.enemyData };
    }
    /**
     * Gets the enemy's position.
     * @returns {position} The enemy's current position.
     */
    getPos(): {x :number, y:number} {
        return this.enemyData.position;
    }
    /**
   * Cleans up the enemy instance completely.
   */
  destroy() {
    this.sprite.destroy(); // Destroy sprite and its resources
    this.scene.tweens.killTweensOf(this.sprite); // Kill any active tweens
    this.scene = null!; // Clear scene reference
    this.getMapAt = null!; // Clear function reference
    this.enemyData = null!; // Clear stats
  }

}
import Phaser from 'phaser';
import { EnemyData } from '../types/GameTypes';

export class Enemy {
    private sprite: Phaser.GameObjects.Sprite;
    private enemyData: EnemyData;
    private scene: Phaser.Scene;
    private getMapAt: (x: number, y: number) => number;
    private offset = 0.5;
    private spawnPoint: { x: number; y: number }; // Track leash anchor position
    private leashDistance: number = 10; // Max distance from anchor before stopping chase
    private isLeashed: boolean = false; // Track if enemy is currently leashed
    private playerProximityCount: number = 0; // Count how many moves player has been close
    private proximityThreshold: number = 5; // Distance threshold for proximity detection
    private proximityMovesRequired: number = 3; // Number of moves player must be close

    constructor(scene: Phaser.Scene, x: number, y: number, enemyData: EnemyData, getMapAt: (x: number, y: number) => number) {
        this.scene = scene;
        this.enemyData = enemyData;
        this.getMapAt = getMapAt;
        this.spawnPoint = { x, y }; // Store initial leash anchor position
        this.sprite = scene.add.sprite((x + this.offset) * 16, (y + this.offset) * 16, 'enemy');
        this.setInitialScale();
    }

    private setInitialScale() {
        const scaleFactor = this.scene.cameras.main.width / (32 * 16);
        this.sprite.setScale(scaleFactor);
    }

    moveTowardPlayer(player_pos: { x: number; y: number }) {
        // Calculate distance from leash anchor point
        const distanceFromAnchor = Math.max(
            Math.abs(this.enemyData.position.x - this.spawnPoint.x),
            Math.abs(this.enemyData.position.y - this.spawnPoint.y)
        );

        // Calculate distance to player
        const distanceToPlayer = Math.max(
            Math.abs(this.enemyData.position.x - player_pos.x),
            Math.abs(this.enemyData.position.y - player_pos.y)
        );

        // Temporary debug: Show distance calculations every few moves
        // if (Math.random() < 0.1) { // 10% chance to log
        //     console.log(`🔍 Enemy at (${this.enemyData.position.x}, ${this.enemyData.position.y}), Spawn: (${this.spawnPoint.x}, ${this.spawnPoint.y}), Distance from anchor: ${distanceFromAnchor}/${this.leashDistance}, Player distance: ${distanceToPlayer}`);
        // }

        // Check if enemy should be leashed (distance from anchor >= 10)
        if (distanceFromAnchor >= this.leashDistance) {
            // Only log when enemy first becomes leashed or when proximity counting happens
            // if (!this.isLeashed) {
            //     console.log(`🔒 Enemy LEASHED at (${this.enemyData.position.x}, ${this.enemyData.position.y}), Anchor: (${this.spawnPoint.x}, ${this.spawnPoint.y}), Distance: ${distanceFromAnchor}`);
            // }

            this.isLeashed = true;

            // Check if player is close enough for proximity counting (within 5 cells)
            if (distanceToPlayer < this.proximityThreshold) {
                this.playerProximityCount++;
                // console.log(`📍 Player close to leashed enemy: ${this.playerProximityCount}/${this.proximityMovesRequired} moves (distance: ${distanceToPlayer})`);

                // If player has been close for 3 moves, reset anchor to current enemy position
                if (this.playerProximityCount >= this.proximityMovesRequired) {
                    this.spawnPoint = { ...this.enemyData.position }; // Reset anchor to current position
                    this.isLeashed = false;
                    this.playerProximityCount = 0;
                    // console.log(`🔄 Enemy anchor RESET to (${this.spawnPoint.x}, ${this.spawnPoint.y}) - can chase again!`);
                }
            } else {
                // Player moved away, reset proximity counter
                // if (this.playerProximityCount > 0) {
                //     // console.log(`❌ Player moved away (distance: ${distanceToPlayer}), resetting proximity counter`);
                // }
                this.playerProximityCount = 0;
            }

            // If still leashed, stop chasing
            if (this.isLeashed) {
                return;
            }
        } else {
            // Not leashed, reset leashed state and proximity counter
            if (this.isLeashed) {
                console.log(`✅ Enemy no longer leashed (distance ${distanceFromAnchor} < ${this.leashDistance}) - resuming chase`);
            }
            this.isLeashed = false;
            this.playerProximityCount = 0;
        }

        // Normal chasing behavior starts here
        const dx = player_pos.x - this.enemyData.position.x;
        const dy = player_pos.y - this.enemyData.position.y;

        // Only move if player is within detection range (8 cells)
        if (Math.abs(dx) <= 8 && Math.abs(dy) <= 8) {
            const moveX = dx !== 0 ? Math.sign(dx) : 0;
            const moveY = dy !== 0 ? Math.sign(dy) : 0;

            // Check if the intended move would exceed leash distance from anchor
            const intendedX = this.enemyData.position.x + moveX;
            const intendedY = this.enemyData.position.y + moveY;
            const intendedDistanceFromAnchor = Math.max(
                Math.abs(intendedX - this.spawnPoint.x),
                Math.abs(intendedY - this.spawnPoint.y)
            );

            // If the intended move would exceed leash distance, don't pursue player
            // BUT allow the move if it would put us exactly at the leash boundary (so we can get leashed)
            if (intendedDistanceFromAnchor > this.leashDistance) {
                return;
            }

            // Try diagonal movement first (if both directions needed)
            if (moveX !== 0 && moveY !== 0) {
                const diagonalX = this.enemyData.position.x + moveX;
                const diagonalY = this.enemyData.position.y + moveY;

                // Check diagonal movement: destination + both intermediate cells must be clear
                const destinationClear = this.getMapAt(diagonalX, diagonalY) === 0;
                const horizontalPathClear = this.getMapAt(this.enemyData.position.x + moveX, this.enemyData.position.y) === 0;
                const verticalPathClear = this.getMapAt(this.enemyData.position.x, this.enemyData.position.y + moveY) === 0;

                // Only allow diagonal movement if destination AND both intermediate paths are clear
                if (destinationClear && horizontalPathClear && verticalPathClear) {
                    this.moveToPosition(diagonalX, diagonalY);
                    return;
                }
            }

            // Fallback to individual axis movement if diagonal is blocked
            // Try horizontal movement first
            if (moveX !== 0) {
                const horizontalX = this.enemyData.position.x + moveX;
                const horizontalY = this.enemyData.position.y;

                if (this.getMapAt(horizontalX, horizontalY) === 0) {
                    this.moveToPosition(horizontalX, horizontalY);
                    return;
                }
            }

            // Try vertical movement if horizontal is blocked
            if (moveY !== 0) {
                const verticalX = this.enemyData.position.x;
                const verticalY = this.enemyData.position.y + moveY;

                if (this.getMapAt(verticalX, verticalY) === 0) {
                    this.moveToPosition(verticalX, verticalY);
                    return;
                }
            }
        }
    }

    private moveToPosition(newX: number, newY: number) {
        const oldX = this.enemyData.position.x;
        const oldY = this.enemyData.position.y;

        this.enemyData.position.x = newX;
        this.enemyData.position.y = newY;

        // Calculate if this is diagonal movement
        const isDiagonal = Math.abs(newX - oldX) > 0 && Math.abs(newY - oldY) > 0;
        const duration = isDiagonal ? 200 : 180; // Longer for diagonal movement

        this.scene.tweens.add({
            targets: this.sprite,
            x: (this.enemyData.position.x + this.offset) * 16,
            y: (this.enemyData.position.y + this.offset) * 16,
            duration: duration,
            ease: 'Power2', // Use same easing as player for consistency
        });
        this.sprite.setDepth(10);
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
    getPos(): { x: number, y: number } {
        return this.enemyData.position;
    }
    /**
     * Gets the enemy's current leash anchor point.
     * @returns {position} The enemy's current leash anchor position.
     */
    getAnchorPoint(): { x: number, y: number } {
        return { ...this.spawnPoint };
    }
    /**
     * Gets the enemy's current leash status and proximity information.
     * @returns {object} Leash status information for debugging.
     */
    getLeashStatus(): {
        isLeashed: boolean;
        proximityCount: number;
        anchorPoint: { x: number; y: number };
        distanceFromAnchor: number;
    } {
        const distanceFromAnchor = Math.max(
            Math.abs(this.enemyData.position.x - this.spawnPoint.x),
            Math.abs(this.enemyData.position.y - this.spawnPoint.y)
        );

        return {
            isLeashed: this.isLeashed,
            proximityCount: this.playerProximityCount,
            anchorPoint: { ...this.spawnPoint },
            distanceFromAnchor
        };
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
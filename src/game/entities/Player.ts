import Phaser from "phaser";

export class Player {
    private sprite: Phaser.GameObjects.Sprite;
    private spritePos: { x: number; y: number } = { x: 0, y: 0 };
    private scene: Phaser.Scene; constructor(
        scene: Phaser.Scene,
        x: number,
        y: number,
    ) {
        this.scene = scene;
        this.spritePos = { x, y };
        // Create sprite at the exact pixel position
        this.sprite = scene.add.sprite(x, y, "player");
        this.setInitialScale();
    }

    private setInitialScale() {
        const scaleFactor = this.scene.cameras.main.width / (32 * 16);
        this.sprite.setScale(scaleFactor);
    } move(playerPos: { x: number; y: number }, isDiagonal: boolean = false) {
        this.spritePos = playerPos;
        const duration = isDiagonal ? 180 : 150; // Slightly longer for diagonal movement
        this.scene.tweens.add({
            targets: this.sprite,
            x: playerPos.x,
            y: playerPos.y,
            duration: duration,
            ease: "Power2", // Changed from Linear for smoother feel
            onComplete: () => {
                // Ensure sprite is exactly at the correct position when complete
                this.sprite.setPosition(playerPos.x, playerPos.y);
            }
        });
    }

    // Update sprite position without animation for free movement
    updateSpritePos(playerPos: { x: number; y: number }) {
        this.spritePos = playerPos;
    }

    getSprite(): Phaser.GameObjects.Sprite {
        return this.sprite;
    }

    getSpritePos(): { x: number; y: number } {
        return this.spritePos;
    }
}

import Phaser from "phaser";
import { Equipment, PlayerData } from "../types/GameTypes";

export class Player {
    private sprite: Phaser.GameObjects.Sprite;
    private data: PlayerData;
    private scene: Phaser.Scene;
    private getMapAt: (x: number, y: number) => number;

    constructor(
        scene: Phaser.Scene,
        x: number,
        y: number,
        data: PlayerData,
        getMapAt: (x: number, y: number) => number
    ) {
        this.scene = scene;
        this.data = data;
        this.getMapAt = getMapAt;
        this.sprite = scene.add.sprite((x + .5) * 16, (y + .5) * 16, "player");
        this.setInitialScale();
    }

    private setInitialScale() {
        const scaleFactor = this.scene.cameras.main.width / (32 * 16);
        this.sprite.setScale(scaleFactor);
    }

    move(dx: number, dy: number) {
        const newX = this.data.position.x + dx;
        const newY = this.data.position.y + dy;
        if (this.getMapAt(newX, newY) === 0) {
            // Use dynamic map check
            this.data.position.x = newX;
            this.data.position.y = newY;
            this.scene.tweens.add({
                targets: this.sprite,
                x: (this.data.position.x + 0.5) * 16,
                y: (this.data.position.y + 0.5) * 16,
                duration: 180,
                ease: "Linear",
            });
        }
    }

    updatePlayerData(updatedData: PlayerData) {
        this.data = updatedData;
    }

    getSprite(): Phaser.GameObjects.Sprite {
        return this.sprite;
    }

    /**
     *get position of player
    */
    getPos() {
        return this.data.position;
    }

    getData(): PlayerData {
        return this.data;
    }
}

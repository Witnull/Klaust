import Phaser from 'phaser';

export default class MainMenuScene extends Phaser.Scene {
    constructor() {
        super('MainMenuScene');
    }

    create() {
        this.add.text(400, 300, 'RPG Roguelike\nClick to Start', {
            fontSize: '32px',
            color: '#fff',
            align: 'center',
        }).setOrigin(0.5);

        this.input.on('pointerdown', () => {
            this.scene.start('GameScene');
        });
    }
}
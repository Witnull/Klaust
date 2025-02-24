import Phaser from 'phaser';
import {GameScene} from '../game/scenes/GameScene';
import CombatScene from '../game/scenes/CombatScene';

export class PhaserGame {
  private game: Phaser.Game;

  constructor(parent: HTMLElement) {
    this.game = new Phaser.Game({
      type: Phaser.AUTO,
      width: 512,
      height: 512,
      parent,
      scene: [GameScene, CombatScene],
      backgroundColor: '#000000',
      scale: {
        mode: Phaser.Scale.ENVELOP,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        parent: 'game-container',
      },
      physics: {
        default: 'arcade',
        arcade: { debug: false },
      },
      input: {
        keyboard: true,
      },
      render: { pixelArt: true },
      fps: { target: 60 }, // Cap FPS to reduce CPU load
    });
    document.body.style.overflow = 'hidden';
  }

  destroy(): void {
    this.game.destroy(true);
  }

  getGame(): Phaser.Game {
    return this.game;
  }
}
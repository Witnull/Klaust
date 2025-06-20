import { Events } from 'phaser';

// Used to emit events between React components and Phaser scenes
// https://newdocs.phaser.io/docs/3.70.0/Phaser.Events.EventEmitter
export const combatEvent = new Events.EventEmitter();
export const playerDataEvent = new Events.EventEmitter();
export const generationEvent = new Events.EventEmitter();
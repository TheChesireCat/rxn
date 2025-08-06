import { describe, it, expect } from 'vitest';
import { 
  generateMoveAnimations, 
  getPlayerColor, 
  getCellPosition,
  ANIMATION_TIMING 
} from '../animationUtils';
import { Cell } from '@/types/game';
import { PLAYER_COLORS } from '../gameLogic';

describe('animationUtils', () => {
  describe('getPlayerColor', () => {
    it('should return consistent color for same player ID', () => {
      const playerId = 'player-123';
      const color1 = getPlayerColor(playerId, PLAYER_COLORS);
      const color2 = getPlayerColor(playerId, PLAYER_COLORS);
      
      expect(color1).toBe(color2);
      expect(PLAYER_COLORS).toContain(color1);
    });

    it('should return different colors for different player IDs', () => {
      const player1 = 'player-1';
      const player2 = 'player-2';
      
      const color1 = getPlayerColor(player1, PLAYER_COLORS);
      const color2 = getPlayerColor(player2, PLAYER_COLORS);
      
      // Note: This might occasionally fail due to hash collisions, but very unlikely
      expect(color1).not.toBe(color2);
    });
  });

  describe('getCellPosition', () => {
    it('should calculate correct position for cell at origin', () => {
      const position = getCellPosition(0, 0, 60, 8);
      expect(position).toEqual({ x: 8, y: 8 });
    });

    it('should calculate correct position for cell at (1,1)', () => {
      const position = getCellPosition(1, 1, 60, 8);
      expect(position).toEqual({ x: 76, y: 76 }); // 1 * (60 + 8) + 8
    });
  });

  describe('generateMoveAnimations', () => {
    it('should generate placement animation for simple move', () => {
      const oldGrid: Cell[][] = [
        [{ orbs: 0, ownerId: undefined, criticalMass: 2 }]
      ];
      const newGrid: Cell[][] = [
        [{ orbs: 1, ownerId: 'player-1', criticalMass: 2 }]
      ];

      const animations = generateMoveAnimations(
        oldGrid,
        newGrid,
        'player-1',
        '#0070f3',
        0,
        0
      );

      expect(animations.placementAnimation).toBeDefined();
      expect(animations.placementAnimation.row).toBe(0);
      expect(animations.placementAnimation.col).toBe(0);
      expect(animations.placementAnimation.color).toBe('#0070f3');
      expect(animations.explosionAnimations).toHaveLength(0);
      expect(animations.orbAnimations).toHaveLength(0);
    });

    it('should generate explosion animations for critical mass', () => {
      const oldGrid: Cell[][] = [
        [
          { orbs: 1, ownerId: 'player-1', criticalMass: 2 },
          { orbs: 0, ownerId: undefined, criticalMass: 3 }
        ]
      ];
      const newGrid: Cell[][] = [
        [
          { orbs: 0, ownerId: undefined, criticalMass: 2 },
          { orbs: 1, ownerId: 'player-1', criticalMass: 3 }
        ]
      ];

      const animations = generateMoveAnimations(
        oldGrid,
        newGrid,
        'player-1',
        '#0070f3',
        0,
        0
      );

      expect(animations.placementAnimation).toBeDefined();
      expect(animations.explosionAnimations.length).toBeGreaterThan(0);
      expect(animations.orbAnimations.length).toBeGreaterThan(0);
    });
  });

  describe('ANIMATION_TIMING', () => {
    it('should have all required timing constants', () => {
      expect(ANIMATION_TIMING.PLACEMENT_DURATION).toBeDefined();
      expect(ANIMATION_TIMING.EXPLOSION_DURATION).toBeDefined();
      expect(ANIMATION_TIMING.ORB_MOVEMENT_DURATION).toBeDefined();
      expect(ANIMATION_TIMING.WAVE_DELAY).toBeDefined();
      expect(ANIMATION_TIMING.PULSE_DURATION).toBeDefined();
    });

    it('should have reasonable timing values', () => {
      expect(ANIMATION_TIMING.PLACEMENT_DURATION).toBeGreaterThan(0);
      expect(ANIMATION_TIMING.EXPLOSION_DURATION).toBeGreaterThan(0);
      expect(ANIMATION_TIMING.ORB_MOVEMENT_DURATION).toBeGreaterThan(0);
      expect(ANIMATION_TIMING.WAVE_DELAY).toBeGreaterThan(0);
      expect(ANIMATION_TIMING.PULSE_DURATION).toBeGreaterThan(0);
    });
  });
});
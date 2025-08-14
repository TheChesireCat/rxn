import { describe, it, expect } from 'vitest';
import { generateMoveAnimations } from '../animationUtils';
import { Cell } from '@/types/game';

describe('Animation Utils - Stable ID Generation', () => {
  it('should generate stable, deterministic animation IDs', () => {
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

    // Generate animations twice with same parameters
    const animations1 = generateMoveAnimations(
      oldGrid,
      newGrid,
      'player-1',
      '#0070f3',
      0,
      0
    );

    const animations2 = generateMoveAnimations(
      oldGrid,
      newGrid,
      'player-1',
      '#0070f3',
      0,
      0
    );

    // Placement animation IDs should be identical
    expect(animations1.placementAnimation.id).toBe(animations2.placementAnimation.id);

    // Explosion animation IDs should be identical
    expect(animations1.explosionAnimations.length).toBe(animations2.explosionAnimations.length);
    animations1.explosionAnimations.forEach((anim1, index) => {
      const anim2 = animations2.explosionAnimations[index];
      expect(anim1.id).toBe(anim2.id);
    });

    // Orb animation IDs should be identical
    expect(animations1.orbAnimations.length).toBe(animations2.orbAnimations.length);
    animations1.orbAnimations.forEach((anim1, index) => {
      const anim2 = animations2.orbAnimations[index];
      expect(anim1.id).toBe(anim2.id);
    });
  });

  it('should not include timestamp patterns in animation IDs', () => {
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

    // Check placement animation ID doesn't contain timestamp
    expect(animations.placementAnimation.id).not.toMatch(/\d{13}/); // 13-digit timestamp pattern

    // Check explosion animation IDs don't contain timestamps
    animations.explosionAnimations.forEach(anim => {
      expect(anim.id).not.toMatch(/\d{13}/);
    });

    // Check orb animation IDs don't contain timestamps
    animations.orbAnimations.forEach(anim => {
      expect(anim.id).not.toMatch(/\d{13}/);
    });
  });

  it('should include wave property in animation objects', () => {
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

    // Check that explosion animations have wave property
    animations.explosionAnimations.forEach(anim => {
      expect(anim).toHaveProperty('wave');
      expect(typeof anim.wave).toBe('number');
      expect(anim.wave).toBeGreaterThanOrEqual(0);
    });

    // Check that orb animations have wave property
    animations.orbAnimations.forEach(anim => {
      expect(anim).toHaveProperty('wave');
      expect(typeof anim.wave).toBe('number');
      expect(anim.wave).toBeGreaterThanOrEqual(0);
    });
  });

  it('should generate predictable ID formats', () => {
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

    // Placement ID format: placement-{row}-{col}
    expect(animations.placementAnimation.id).toMatch(/^placement-\d+-\d+$/);

    // Explosion ID format: explosion-{row}-{col}-{wave}
    animations.explosionAnimations.forEach(anim => {
      expect(anim.id).toMatch(/^explosion-\d+-\d+-\d+$/);
    });

    // Orb ID format: orb-{fromRow}-{fromCol}-to-{toRow}-{toCol}-{wave}-{index}
    animations.orbAnimations.forEach(anim => {
      expect(anim.id).toMatch(/^orb-\d+-\d+-to-\d+-\d+-\d+-\d+$/);
    });
  });
});
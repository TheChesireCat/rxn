import { Cell, GameState } from '@/types/game';
import { getAdjacentCells } from './gameLogic';

export interface OrbAnimation {
  id: string;
  fromRow: number;
  fromCol: number;
  toRow: number;
  toCol: number;
  color: string;
  delay: number;
  wave: number;
}

export interface ExplosionAnimation {
  id: string;
  row: number;
  col: number;
  color: string;
  delay: number;
  wave: number;
}

export interface PlacementAnimation {
  id: string;
  row: number;
  col: number;
  color: string;
}

/**
 * Generate animations for a move and its resulting chain reactions
 */
export function generateMoveAnimations(
  oldGrid: Cell[][],
  newGrid: Cell[][],
  playerId: string,
  playerColor: string,
  moveRow: number,
  moveCol: number
): {
  placementAnimation: PlacementAnimation;
  explosionAnimations: ExplosionAnimation[];
  orbAnimations: OrbAnimation[];
} {
  const rows = oldGrid.length;
  const cols = oldGrid[0].length;
  
  // Initial placement animation
  const placementAnimation: PlacementAnimation = {
    id: `placement-${moveRow}-${moveCol}`,
    row: moveRow,
    col: moveCol,
    color: playerColor,
  };

  const explosionAnimations: ExplosionAnimation[] = [];
  const orbAnimations: OrbAnimation[] = [];
  
  // Simulate the explosion waves to generate animations
  let currentGrid = oldGrid.map(row => row.map(cell => ({ ...cell })));
  
  // Place the initial orb
  currentGrid[moveRow][moveCol] = {
    ...currentGrid[moveRow][moveCol],
    orbs: currentGrid[moveRow][moveCol].orbs + 1,
    ownerId: playerId,
  };
  
  let wave = 0;
  const maxWaves = 100;
  const waveDelay = 150; // Reduced from 200ms for snappier chains
  const orbAnimationDuration = 120; // Reduced from 180ms for faster orb movement
  
  while (wave < maxWaves) {
    const unstableCells: Array<{ row: number; col: number }> = [];
    
    // Find unstable cells
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const cell = currentGrid[row][col];
        if (cell.orbs >= cell.criticalMass) {
          unstableCells.push({ row, col });
        }
      }
    }
    
    if (unstableCells.length === 0) break;
    
    // Create explosion animations for this wave
    unstableCells.forEach(({ row, col }) => {
      const cell = currentGrid[row][col];
      explosionAnimations.push({
        id: `explosion-${row}-${col}-${wave}`,
        row,
        col,
        color: playerColor,
        delay: wave * waveDelay,
        wave,
      });
      
      // Create orb movement animations
      const adjacentCells = getAdjacentCells(row, col, rows, cols);
      adjacentCells.forEach((adjacent, index) => {
        orbAnimations.push({
          id: `orb-${row}-${col}-to-${adjacent.row}-${adjacent.col}-${wave}-${index}`,
          fromRow: row,
          fromCol: col,
          toRow: adjacent.row,
          toCol: adjacent.col,
          color: playerColor,
          delay: wave * waveDelay + 30, // Reduced delay for snappier response
          wave,
        });
      });
    });
    
    // Process explosions for next iteration
    const newGridState = currentGrid.map(row => row.map(cell => ({ ...cell })));
    
    unstableCells.forEach(({ row, col }) => {
      const cell = currentGrid[row][col];
      
      // Clear exploding cell
      newGridState[row][col] = {
        ...cell,
        orbs: 0,
        ownerId: undefined,
      };
      
      // Add orbs to adjacent cells
      const adjacentCells = getAdjacentCells(row, col, rows, cols);
      adjacentCells.forEach(adjacent => {
        const targetCell = newGridState[adjacent.row][adjacent.col];
        newGridState[adjacent.row][adjacent.col] = {
          ...targetCell,
          orbs: targetCell.orbs + 1,
          ownerId: playerId,
        };
      });
    });
    
    currentGrid = newGridState;
    wave++;
  }
  
  return {
    placementAnimation,
    explosionAnimations,
    orbAnimations,
  };
}

/**
 * Calculate animation timing constants - SNAPPIER VERSION
 * Inspired by the reference chain reaction demo
 */
export const ANIMATION_TIMING = {
  PLACEMENT_DURATION: 100,    // Super fast placement (was 150)
  EXPLOSION_DURATION: 150,    // Snappy explosions (was 200)
  ORB_MOVEMENT_DURATION: 120, // Quick orb movements (was 180)
  WAVE_DELAY: 150,            // Faster wave propagation (was 200)
  PULSE_DURATION: 80,         // Quick pulse effect (was 100)
} as const;

/**
 * Spring configurations for different animation types
 * Using higher tension and lower friction for snappier feel
 */
export const SPRING_CONFIG = {
  // For cell hover and interaction
  hover: { tension: 600, friction: 20 },    // Very responsive
  
  // For orb placement
  placement: { tension: 500, friction: 15 }, // Snappy bounce
  
  // For explosions
  explosion: { tension: 300, friction: 10 }, // Dramatic and fast
  
  // For orb movement between cells
  orbMovement: { tension: 200, friction: 20 }, // Smooth but quick
  
  // For critical mass pulsing
  pulse: { tension: 450, friction: 25 },     // Subtle but responsive
  
  // For background flashes
  flash: { tension: 550, friction: 18 },     // Quick flash effect
  
  // Default gentle animation
  gentle: { tension: 280, friction: 60 },    // Smooth default
  
  // Wobbly effect for fun animations
  wobbly: { tension: 180, friction: 12 },    // Bouncy and playful
} as const;

/**
 * Get player color by ID (consistent with gameLogic.ts)
 */
export function getPlayerColor(playerId: string, playerColors: readonly string[]): string {
  let hash = 0;
  for (let i = 0; i < playerId.length; i++) {
    hash = ((hash << 5) - hash + playerId.charCodeAt(i)) & 0xffffffff;
  }
  return playerColors[Math.abs(hash) % playerColors.length];
}

/**
 * Calculate cell position in pixels for animations
 * Now that AnimationLayer is inside the grid, cells start at (0,0)
 */
export function getCellPosition(
  row: number,
  col: number,
  cellSize: number,
  gap: number
): { x: number; y: number } {
  return {
    x: col * (cellSize + gap),
    y: row * (cellSize + gap),
  };
}
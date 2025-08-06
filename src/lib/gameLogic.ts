import { Cell, GameState, Player } from '@/types/game';

/**
 * Calculate the critical mass for a cell based on its position
 */
export function calculateCriticalMass(row: number, col: number, rows: number, cols: number): number {
  let mass = 4;
  
  // Corner cells have critical mass of 2
  if ((row === 0 || row === rows - 1) && (col === 0 || col === cols - 1)) {
    mass = 2;
  }
  // Edge cells have critical mass of 3
  else if (row === 0 || row === rows - 1 || col === 0 || col === cols - 1) {
    mass = 3;
  }
  
  return mass;
}

/**
 * Initialize an empty game grid
 */
export function createEmptyGrid(rows: number, cols: number): Cell[][] {
  return Array.from({ length: rows }, (_, row) =>
    Array.from({ length: cols }, (_, col) => ({
      orbs: 0,
      ownerId: undefined,
      criticalMass: calculateCriticalMass(row, col, rows, cols),
    }))
  );
}

/**
 * Check if a move is valid
 */
export function isValidMove(
  gameState: GameState,
  playerId: string,
  row: number,
  col: number
): { valid: boolean; error?: string } {
  // Check if game is active
  if (gameState.status !== 'active') {
    return { valid: false, error: 'Game is not active' };
  }

  // Check if player is eliminated
  const player = gameState.players.find(p => p.id === playerId);
  if (!player) {
    return { valid: false, error: 'Player not found' };
  }
  
  if (player.isEliminated) {
    return { valid: false, error: 'You have been eliminated and are now spectating' };
  }

  // Check if it's the player's turn
  if (gameState.currentPlayerId !== playerId) {
    return { valid: false, error: 'Not your turn' };
  }

  // Check if coordinates are valid
  if (row < 0 || row >= gameState.grid.length || col < 0 || col >= gameState.grid[0].length) {
    return { valid: false, error: 'Invalid coordinates' };
  }

  const cell = gameState.grid[row][col];

  // Check if cell is empty or owned by the player
  if (cell.ownerId && cell.ownerId !== playerId) {
    return { valid: false, error: 'Cell is owned by another player' };
  }

  return { valid: true };
}

/**
 * Get adjacent cell coordinates
 */
export function getAdjacentCells(row: number, col: number, rows: number, cols: number): Array<{ row: number; col: number }> {
  const adjacent = [];
  
  // Up
  if (row > 0) adjacent.push({ row: row - 1, col });
  // Down
  if (row < rows - 1) adjacent.push({ row: row + 1, col });
  // Left
  if (col > 0) adjacent.push({ row, col: col - 1 });
  // Right
  if (col < cols - 1) adjacent.push({ row, col: col + 1 });
  
  return adjacent;
}

/**
 * Count total orbs for each player
 */
export function countPlayerOrbs(grid: Cell[][], players: Player[]): number[] {
  const counts = Array(players.length).fill(0);
  
  grid.flat().forEach((cell) => {
    if (cell.ownerId) {
      const playerIndex = players.findIndex(p => p.id === cell.ownerId);
      if (playerIndex !== -1) {
        counts[playerIndex] += cell.orbs;
      }
    }
  });
  
  return counts;
}

/**
 * Check for eliminated players
 */
export function checkEliminatedPlayers(gameState: GameState): Player[] {
  const orbCounts = countPlayerOrbs(gameState.grid, gameState.players);
  
  return gameState.players.map((player, index) => {
    // A player is eliminated if they have 0 orbs and have made at least one move
    const hasNoOrbs = orbCounts[index] === 0;
    const hasMoved = gameState.moveCount > gameState.players.length; // Everyone has had at least one turn
    
    // Once eliminated, player remains eliminated (no coming back)
    const isEliminated = player.isEliminated || (hasNoOrbs && hasMoved);
    
    return {
      ...player,
      isEliminated,
      orbCount: orbCounts[index],
    };
  });
}

/**
 * Get the next active player
 */
export function getNextPlayer(players: Player[], currentPlayerId: string): string {
  const activePlayers = players.filter(p => !p.isEliminated);
  const currentIndex = activePlayers.findIndex(p => p.id === currentPlayerId);
  const nextIndex = (currentIndex + 1) % activePlayers.length;
  
  return activePlayers[nextIndex].id;
}

/**
 * Check win condition
 */
export function checkWinCondition(players: Player[]): string | null {
  const activePlayers = players.filter(p => !p.isEliminated);
  
  if (activePlayers.length === 1) {
    return activePlayers[0].id;
  }
  
  // Edge case: if all players are eliminated (shouldn't happen in normal gameplay)
  if (activePlayers.length === 0) {
    // Return the last player who was eliminated (most recent)
    const sortedPlayers = [...players].sort((a, b) => b.orbCount - a.orbCount);
    return sortedPlayers[0]?.id || null;
  }
  
  return null;
}

/**
 * Check if game state allows moves (prevents moves in finished games)
 */
export function canMakeMove(gameState: GameState): { canMove: boolean; reason?: string } {
  if (gameState.status === 'finished') {
    return { canMove: false, reason: 'Game has finished' };
  }
  
  if (gameState.status === 'runaway') {
    return { canMove: false, reason: 'Game ended due to runaway chain reaction' };
  }
  
  if (gameState.status === 'lobby') {
    return { canMove: false, reason: 'Game has not started yet' };
  }
  
  if (gameState.status !== 'active') {
    return { canMove: false, reason: 'Game is not active' };
  }
  
  return { canMove: true };
}

/**
 * Simulate explosion chain reactions with wave processing
 */
export function simulateExplosions(
  grid: Cell[][],
  playerId: string,
  maxWaves: number = 1000
): { grid: Cell[][]; waves: number; isRunaway: boolean } {
  const rows = grid.length;
  const cols = grid[0].length;
  let currentGrid = grid.map(row => row.map(cell => ({ ...cell })));
  let waves = 0;
  
  while (waves < maxWaves) {
    const unstableCells: Array<{ row: number; col: number }> = [];
    
    // Find all unstable cells in current wave
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const cell = currentGrid[row][col];
        if (cell.orbs >= cell.criticalMass) {
          unstableCells.push({ row, col });
        }
      }
    }
    
    // If no unstable cells, chain reaction is complete
    if (unstableCells.length === 0) {
      break;
    }
    
    waves++;
    
    // Process all explosions in this wave simultaneously
    const newGrid = currentGrid.map(row => row.map(cell => ({ ...cell })));
    
    for (const { row, col } of unstableCells) {
      const cell = currentGrid[row][col];
      
      // Clear the exploding cell
      newGrid[row][col] = {
        ...cell,
        orbs: 0,
        ownerId: undefined,
      };
      
      // Distribute orbs to adjacent cells
      const adjacentCells = getAdjacentCells(row, col, rows, cols);
      
      for (const adjacent of adjacentCells) {
        const targetCell = newGrid[adjacent.row][adjacent.col];
        newGrid[adjacent.row][adjacent.col] = {
          ...targetCell,
          orbs: targetCell.orbs + 1,
          ownerId: playerId, // Adjacent cells are claimed by the current player
        };
      }
    }
    
    currentGrid = newGrid;
  }
  
  return {
    grid: currentGrid,
    waves,
    isRunaway: waves >= maxWaves,
  };
}

/**
 * Process a player move and handle chain reactions
 */
export function processMove(
  gameState: GameState,
  playerId: string,
  row: number,
  col: number
): {
  success: boolean;
  newGameState?: GameState;
  error?: string;
  isRunaway?: boolean;
} {
  // Check if game allows moves
  const moveCheck = canMakeMove(gameState);
  if (!moveCheck.canMove) {
    return { success: false, error: moveCheck.reason };
  }

  // Validate the move
  const validation = isValidMove(gameState, playerId, row, col);
  if (!validation.valid) {
    return { success: false, error: validation.error };
  }
  
  // Create a copy of the game state
  const newGameState: GameState = {
    ...gameState,
    grid: gameState.grid.map(row => row.map(cell => ({ ...cell }))),
    players: gameState.players.map(player => ({ ...player })),
    moveCount: gameState.moveCount + 1,
    turnStartedAt: Date.now(),
  };
  
  // Place the orb
  const targetCell = newGameState.grid[row][col];
  targetCell.orbs += 1;
  targetCell.ownerId = playerId;
  
  // Simulate explosions
  const explosionResult = simulateExplosions(newGameState.grid, playerId);
  newGameState.grid = explosionResult.grid;
  
  // Handle runaway chain reactions
  if (explosionResult.isRunaway) {
    newGameState.status = 'runaway';
    newGameState.winner = playerId;
    return {
      success: true,
      newGameState,
      isRunaway: true,
    };
  }
  
  // Update player states and check for eliminations
  newGameState.players = checkEliminatedPlayers(newGameState);
  
  // Check for win condition
  const winner = checkWinCondition(newGameState.players);
  if (winner) {
    newGameState.status = 'finished';
    newGameState.winner = winner;
  } else {
    // Move to next player
    newGameState.currentPlayerId = getNextPlayer(newGameState.players, playerId);
  }
  
  return {
    success: true,
    newGameState,
  };
}

/**
 * Check if a game has timed out based on game or move time limits
 */
export function checkTimeouts(
  gameState: GameState,
  settings: { gameTimeLimit?: number; moveTimeLimit?: number },
  gameStartTime: number
): {
  isGameTimeout: boolean;
  isMoveTimeout: boolean;
  winner?: string;
} {
  const now = Date.now();
  
  // Check game time limit
  const isGameTimeout = settings.gameTimeLimit 
    ? (now - gameStartTime) > (settings.gameTimeLimit * 60 * 1000)
    : false;
  
  // Check move time limit
  const isMoveTimeout = settings.moveTimeLimit
    ? (now - gameState.turnStartedAt) > (settings.moveTimeLimit * 1000)
    : false;
  
  let winner: string | undefined;
  
  if (isGameTimeout) {
    // Find player with most orbs
    const orbCounts = countPlayerOrbs(gameState.grid, gameState.players);
    let maxOrbs = -1;
    let winnerIndex = -1;
    
    gameState.players.forEach((player, index) => {
      if (!player.isEliminated && orbCounts[index] > maxOrbs) {
        maxOrbs = orbCounts[index];
        winnerIndex = index;
      }
    });
    
    if (winnerIndex !== -1) {
      winner = gameState.players[winnerIndex].id;
    }
  }
  
  return {
    isGameTimeout,
    isMoveTimeout,
    winner,
  };
}

/**
 * Handle move timeout by skipping the current player's turn
 */
export function handleMoveTimeout(gameState: GameState): GameState {
  const newGameState = {
    ...gameState,
    currentPlayerId: getNextPlayer(gameState.players, gameState.currentPlayerId),
    turnStartedAt: Date.now(),
  };
  
  return newGameState;
}

// Player colors are now imported from shared constants
// See /src/lib/constants.ts for PLAYER_COLORS
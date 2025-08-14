# MockBoard Enhancement Requirements Document

## Introduction

The MockBoard component is used in the tutorial system to demonstrate game mechanics to new players. Currently, it uses a simplified 3x3 grid with basic animation logic that doesn't match the sophisticated wave-based animation system of the main GameBoard component. This creates an inconsistent learning experience where the tutorial animations don't accurately represent the actual game behavior.

This enhancement will refactor MockBoard to perfectly mirror the advanced wave-based animation logic of GameBoard, upgrade it to a 5x5 grid for better demonstration of complex chain reactions, and redesign the tutorial slides to provide a more effective and visually consistent learning experience.

## Requirements

### Requirement 1: Architecture Alignment

**User Story:** As a developer, I want the MockBoard component to use the same architectural patterns as GameBoard, so that the tutorial animations are consistent with the actual game experience.

#### Acceptance Criteria

1. WHEN MockBoard handles user interactions THEN it SHALL use the same state-driven animation pattern as GameBoard (lastMove state triggers useEffect)
2. WHEN MockBoard processes moves THEN it SHALL separate logical grid state from display grid state like GameBoard
3. WHEN MockBoard animates explosions THEN it SHALL use the same wave-based animation system as GameBoard
4. WHEN MockBoard simulates chain reactions THEN it SHALL use the same explosion simulation logic as GameBoard
5. WHEN MockBoard manages animation state THEN it SHALL use the same refs and state variables as GameBoard (waveDataRef, lastProcessedMove, etc.)

### Requirement 2: Grid Size Enhancement

**User Story:** As a player learning the game, I want the tutorial to use a 5x5 grid instead of 3x3, so that I can see more complex chain reaction scenarios that better represent actual gameplay.

#### Acceptance Criteria

1. WHEN the tutorial loads THEN MockBoard SHALL render a 5x5 grid instead of the current 3x3 grid
2. WHEN tutorial slides are displayed THEN they SHALL be designed for the 5x5 grid layout
3. WHEN chain reactions occur in tutorials THEN they SHALL demonstrate multi-wave explosions that are only possible on larger grids
4. WHEN players interact with tutorial scenarios THEN they SHALL experience the same spatial relationships as in real games

### Requirement 3: Animation System Consistency

**User Story:** As a player, I want the tutorial animations to look and behave exactly like the real game, so that I'm not confused by different visual behaviors when I start playing.

#### Acceptance Criteria

1. WHEN orbs are placed in MockBoard THEN they SHALL use the same spring-based animation system as GameBoard
2. WHEN cells explode in MockBoard THEN they SHALL use the same cell scaling and orb disappearance effects as GameBoard
3. WHEN chain reactions occur in MockBoard THEN they SHALL show the same flying orb animations as GameBoard
4. WHEN animations complete in MockBoard THEN they SHALL have the same timing and visual feedback as GameBoard
5. WHEN multiple waves of explosions occur THEN they SHALL be processed and displayed with the same wave-by-wave timing as GameBoard

### Requirement 4: State Management Refactor

**User Story:** As a developer, I want MockBoard to use proper state separation, so that animations can be controlled independently from game logic like in GameBoard.

#### Acceptance Criteria

1. WHEN MockBoard initializes THEN it SHALL maintain separate logicalGrid and displayGrid state variables
2. WHEN a move is made THEN MockBoard SHALL set lastMove state to trigger the animation useEffect
3. WHEN animations are running THEN MockBoard SHALL use isAnimating state to prevent further interactions
4. WHEN explosion waves are processed THEN MockBoard SHALL use waveDataRef to store wave information
5. WHEN moves are processed THEN MockBoard SHALL use lastProcessedMove ref to prevent duplicate animations

### Requirement 5: Tutorial Content Enhancement

**User Story:** As a new player, I want the tutorial slides to teach me the game mechanics effectively using realistic scenarios, so that I understand how to play before starting a real game.

#### Acceptance Criteria

1. WHEN Slide 1 loads THEN it SHALL demonstrate basic orb placement with a two-player interactive sandbox on 5x5 grid
2. WHEN Slide 2 loads THEN it SHALL show a cell ready to explode (pulsing) and allow the player to trigger the explosion
3. WHEN Slide 3 loads THEN it SHALL display examples of corner, edge, and center cells with their different critical mass values
4. WHEN Slide 4 loads THEN it SHALL demonstrate cell infection/capture with an interactive explosion scenario
5. WHEN Slide 5 loads THEN it SHALL showcase a complex chain reaction with multiple waves of explosions
6. WHEN any interactive slide is used THEN the player SHALL be able to click and see immediate, realistic animation feedback

### Requirement 6: Code Architecture Consistency

**User Story:** As a developer maintaining the codebase, I want MockBoard to follow the same patterns as GameBoard, so that the code is easier to understand and maintain.

#### Acceptance Criteria

1. WHEN MockBoard handles cell clicks THEN the handleCellClick function SHALL only validate and set lastMove state (no direct animation logic)
2. WHEN MockBoard processes animations THEN it SHALL use a useEffect hook that watches lastMove changes
3. WHEN MockBoard simulates explosions THEN it SHALL use the same simulateExplosionsWithWaves function as GameBoard
4. WHEN MockBoard manages wave animations THEN it SHALL use the same waveIndex-based useEffect pattern as GameBoard
5. WHEN MockBoard updates state THEN it SHALL follow the same atomic state update patterns as GameBoard

### Requirement 7: Tutorial Slide Redesign

**User Story:** As a new player, I want each tutorial slide to focus on one key concept with clear visual examples, so that I can learn the game mechanics step by step.

#### Acceptance Criteria

1. WHEN Slide 1 is displayed THEN it SHALL teach basic orb placement with a two-player scenario and clear instructions
2. WHEN Slide 2 is displayed THEN it SHALL teach critical mass concept with a pulsing cell ready to explode
3. WHEN Slide 3 is displayed THEN it SHALL teach cell capacity differences with visual examples of corner/edge/center cells
4. WHEN Slide 4 is displayed THEN it SHALL teach cell infection mechanics with an interactive capture scenario
5. WHEN Slide 5 is displayed THEN it SHALL teach chain reactions with a complex multi-wave explosion setup
6. WHEN any slide text is displayed THEN it SHALL be concise, clear, and focused on the specific learning objective

### Requirement 8: Performance and Reliability

**User Story:** As a player using the tutorial, I want it to be smooth and responsive, so that I can focus on learning without technical distractions.

#### Acceptance Criteria

1. WHEN MockBoard animations run THEN they SHALL perform as smoothly as GameBoard animations
2. WHEN multiple tutorial interactions occur THEN MockBoard SHALL prevent race conditions and animation conflicts
3. WHEN tutorial slides are switched THEN MockBoard SHALL properly reset all animation state
4. WHEN complex chain reactions are demonstrated THEN they SHALL complete without performance issues
5. WHEN players interact rapidly with tutorial elements THEN the system SHALL handle input gracefully without breaking
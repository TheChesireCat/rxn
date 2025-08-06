# Requirements Document

## Introduction

The Live Chain Reaction game is a real-time, multiplayer strategy game where players place orbs on a grid to trigger chain reactions. Players compete to capture opponent cells through strategic orb placement and chain reaction mechanics. The game supports 2-8 players with real-time synchronization, spectator mode, and social features like chat and reactions.

**Project Location:** All development for this project SHALL be contained within the `rxn/` folder. All file paths, imports, and project structure references should be relative to the `rxn/` directory as the project root.

## Requirements

### Requirement 1: Core Gameplay Logic

**User Story:** As a player, I want to place my orbs to trigger chain reactions, so that I can capture opponent cells and win the game.

#### Acceptance Criteria

1. WHEN it is the player's turn THEN the system SHALL allow them to place an orb in an empty cell or a cell they already own
2. IF a player attempts to place an orb in a cell owned by an opponent THEN the system SHALL reject the move
3. WHEN a cell accumulates a number of orbs equal to its critical mass (2 for corners, 3 for edges, 4 for center) THEN it SHALL explode
4. WHEN a cell explodes THEN its orbs SHALL be removed, one orb SHALL be sent to each adjacent cell, and the adjacent cells SHALL be claimed by the current player
5. WHEN chain reactions occur THEN they SHALL be processed in waves where all unstable cells from one wave must explode before the next wave of explosions is calculated

### Requirement 2: Game Integrity and Security

**User Story:** As a user, I want the game to be secure and fair, so that all outcomes are based on valid moves and the game cannot be compromised by malicious actors.

#### Acceptance Criteria

1. WHEN a client sends a move request THEN the system's backend SHALL validate the move against the current authoritative game state
2. IF a move is invalid THEN the system's backend SHALL reject the request and SHALL NOT modify the game state
3. WHEN game state changes occur THEN all game state-altering logic SHALL be executed exclusively on a server-authoritative component
4. WHEN database operations occur THEN the system SHALL use database security rules to prevent clients from directly writing to protected game state fields

### Requirement 3: Game Board and UI

**User Story:** As a player, I want an interactive, responsive, and visually appealing game board so that I can enjoy playing on any device.

#### Acceptance Criteria

1. WHEN a game starts THEN the system SHALL render a grid of cells corresponding to the selected board size
2. WHEN the UI is accessed on different devices THEN it SHALL be mobile-first, ensuring a functional and pleasant experience on small screens, and adapt to larger screens
3. WHEN the game is active THEN the system SHALL display the current player's turn, highlighting their name and color
4. WHEN the game state changes THEN the system SHALL display a list or chart of all players, their colors, and their current orb count, which updates in real-time
5. WHEN a player taps a cell THEN the system SHALL register it as a move attempt
6. WHEN game events occur THEN the system SHALL use smooth animations for orb placement, explosions, and movement
7. IF the per-game time limit is enabled THEN the system SHALL display a visual timer for the overall game duration
8. IF the per-move time limit is enabled THEN the system SHALL display a visual timer for the current player's turn

### Requirement 4: Real-time State Synchronization

**User Story:** As a player, I want to see all game events as they happen, so that the experience feels live and interactive.

#### Acceptance Criteria

1. WHEN a player makes a move THEN the game state (grid, player stats) SHALL be instantly updated for all other players in the room using InstantDB
2. WHEN a cell explodes THEN the resulting animations SHALL be triggered on all clients simultaneously
3. WHEN a player's connection status changes THEN their online status SHALL be updated for others in the room

### Requirement 5: Win and Loss Conditions

**User Story:** As a player, I want the game to have clear win and loss conditions so that there is a definitive outcome.

#### Acceptance Criteria

1. IF a player has placed at least one orb AND their orb count drops to zero THEN they SHALL be eliminated
2. WHEN only one player with orbs remains on the board THEN they SHALL be declared the winner
3. WHEN a winner is declared THEN the system SHALL display a victory message and prevent further moves
4. IF a per-game time limit expires THEN the player with the highest orb count SHALL be declared the winner
5. IF a per-move time limit expires THEN their turn SHALL be automatically forfeited
6. WHEN a player is eliminated THEN they SHALL automatically transition to spectator mode

### Requirement 6: Game Room Management

**User Story:** As a user, I want to create or join game rooms so that I can play with friends or other people online.

#### Acceptance Criteria

1. WHEN a user wants to start playing THEN the system SHALL provide options to "Create a New Game" or "Join a Game"
2. WHEN creating a game THEN the system SHALL allow setting room name, max players (2-8), board size, time limits, and undo option
3. WHEN a new room is created THEN the system SHALL generate a unique, shareable URL for the room
4. WHEN joining a game THEN the system SHALL allow joining via room name or direct URL
5. WHEN players join or leave THEN the system SHALL update the player/spectator list in real-time
6. WHEN the room creator is in-game THEN they SHALL be able to modify settings

### Requirement 7: Player Identity & Session

**User Story:** As a player, I want to have a username and be able to rejoin a game if I get disconnected.

#### Acceptance Criteria

1. WHEN a user first joins THEN the system SHALL prompt for a username
2. WHEN a username is provided without a password THEN the system SHALL treat it as a temporary identity
3. WHEN a user plays THEN the system SHALL store session/room info in local storage
4. IF session data exists for an active game THEN the system SHALL prompt to rejoin the game
5. WHEN persistent accounts are implemented THEN the system SHALL support accounts with passwords

### Requirement 8: Spectator Mode

**User Story:** As a user, I want to watch an ongoing game without participating.

#### Acceptance Criteria

1. WHEN a room is full or a game is in progress THEN the system SHALL offer a spectator option
2. WHEN spectating THEN spectators SHALL see all game updates in real-time
3. WHEN spectating THEN spectators SHALL NOT be able to interact with the game board
4. WHEN spectating THEN spectators SHALL be able to use chat and reactions
5. WHEN displaying users THEN the UI SHALL clearly distinguish between players and spectators

### Requirement 9: In-Game Communication

**User Story:** As a player, I want to communicate with others in my game room.

#### Acceptance Criteria

1. WHEN in a game room THEN the system SHALL provide a real-time chat panel for all users
2. WHEN communicating THEN the system SHALL provide a set of predefined emoji reactions that display for all users

### Requirement 10: Undo Move

**User Story:** As a player, I want to undo my last move if the game rules allow it.

#### Acceptance Criteria

1. WHEN undo is enabled in room settings THEN the 'Undo' button SHALL be available
2. WHEN undo is used THEN it SHALL revert the game to the state before the last move
3. WHEN undo is available THEN only the current player SHALL be able to undo, and only as their immediate next action
4. WHEN a move is undone THEN the reverted state SHALL be broadcast to all players

### Requirement 11: Player Statistics

**User Story:** As a player, I want to track my performance over time.

#### Acceptance Criteria

1. WHEN games are completed THEN the system SHALL track basic stats like total wins and games played
2. WHEN viewing profile THEN the system SHALL display stats on a user profile page
3. WHEN leaderboards are implemented THEN the system SHALL implement a leaderboard feature
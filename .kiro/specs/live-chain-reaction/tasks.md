# Implementation Plan

- [x] 1. Initialize Next.js project and install dependencies
  - Create new Next.js project with TypeScript and TailwindCSS
  - Install InstantDB, react-spring, and other required dependencies
  - Set up basic project structure with src/app directory
  - Configure TypeScript and ESLint settings
  - _Requirements: All requirements depend on basic project setup_

- [x] 2. Set up InstantDB schema and configuration
  - Create instant.schema.ts file with complete database schema
  - Configure InstantDB client with proper permissions
  - Set up environment variables for InstantDB connection
  - Create database security rules for server-authoritative model
  - _Requirements: 2.1, 2.3, 4.1_

- [x] 3. Implement core game logic utilities
  - Create lib/game-logic.ts with cell critical mass calculations
  - Implement explosion simulation algorithm with wave processing
  - Add win condition detection and player elimination logic
  - Create comprehensive unit tests for all game logic functions
  - _Requirements: 1.1, 1.3, 1.4, 1.5, 5.1, 5.2_

- [x] 4. Create room management API endpoints
  - Implement POST /api/room/create endpoint with room settings validation
  - Implement POST /api/room/join endpoint with capacity checking
  - Add GET /api/room/[id] endpoint for room state retrieval
  - Create room URL generation and validation utilities
  - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [x] 5. Implement server-authoritative move processing API
  - Create POST /api/game/move endpoint with complete move validation
  - Integrate game logic utilities for explosion simulation
  - Implement atomic database transactions for state updates
  - Add runaway chain reaction detection and handling
  - _Requirements: 1.1, 1.2, 2.1, 2.2, 2.3_

- [x] 6. Build user session and identity management
  - Create POST /api/user/create endpoint for temporary sessions
  - Implement session storage and retrieval in localStorage
  - Add session validation and restoration logic
  - Create user reconnection flow for active games
  - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [x] 7. Create game state provider and hooks
  - Implement GameProvider React context with InstantDB integration
  - Create useGameState hook for real-time state synchronization
  - Add usePresence hook for player connection status
  - Implement error boundary for game state management
  - _Requirements: 4.1, 4.3_

- [x] 8. Build main game board component
  - Create GameBoard component with responsive grid layout
  - Implement Cell component with click handlers and visual states
  - Add player color coding and orb count display
  - Integrate move submission with server API
  - _Requirements: 3.1, 3.2, 3.5_

- [x] 9. Implement game UI components
  - Create PlayerList component with real-time player stats
  - Build TurnIndicator component showing current player
  - Add GameControls component with action buttons
  - Implement mobile-first responsive design
  - _Requirements: 3.3, 3.4_

- [x] 10. Add game animations with react-spring
  - Implement orb placement animations
  - Create explosion animation sequences
  - Add smooth orb movement during chain reactions
  - Synchronize animations across all connected clients
  - _Requirements: 3.6, 4.2_

- [x] 11. Implement win/loss conditions and game end states
  - Add win condition checking in move processing
  - Create victory message display component
  - Implement automatic spectator mode transition for eliminated players
  - Add game state prevention for finished games
  - _Requirements: 5.1, 5.2, 5.3, 5.6_

- [x] 12. Create home page and lobby interface
  - Build HomePage component with create/join game options
  - Implement game creation form with settings configuration
  - Add room joining interface with name/URL input
  - Create lobby view showing players and game settings
  - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [x] 13. Implement real-time player list and presence
  - Create real-time player list with connection status
  - Add presence indicators for online/offline players
  - Implement automatic list updates when players join/leave
  - Show player roles (player vs spectator) clearly
  - _Requirements: 6.5, 8.5_

- [x] 14. Add game timer functionality
  - Create timer components for game and move time limits
  - Implement server-side timer validation and enforcement
  - Add visual countdown displays in the UI
  - Handle automatic turn forfeiture on timeout
  - _Requirements: 3.7, 3.8, 5.4, 5.5_

- [x] 15. Implement undo move feature
  - Create POST /api/game/undo endpoint with validation
  - Add undo button to game controls (conditional on settings)
  - Implement game state rollback with history tracking
  - Broadcast undo state changes to all clients
  - _Requirements: 10.1, 10.2, 10.3, 10.4_

- [x] 16. Build spectator mode functionality
  - Create spectator join flow for full/active games
  - Implement read-only game board for spectators
  - Add spectator indicators in player lists
  - Ensure spectators receive real-time game updates
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [x] 17. Implement in-game chat system
  - Create ChatPanel component with real-time messaging
  - Implement POST /api/chat/send endpoint for message handling
  - Add chat message display with user identification
  - Integrate chat with InstantDB for real-time sync
  - _Requirements: 9.1_

- [ ] 18. Add emoji reactions feature
  - Create reaction picker component with predefined emojis
  - Implement ephemeral reactions using InstantDB topics
  - Add reaction display overlay on game board
  - Create reaction broadcasting to all room participants
  - _Requirements: 9.2_

- [ ] 19. Implement player statistics tracking
  - Create GET /api/user/stats endpoint for statistics retrieval
  - Add win/loss tracking in game completion logic
  - Build user profile page displaying statistics
  - Implement statistics persistence in user records
  - _Requirements: 11.1, 11.2_

- [ ] 20. Add comprehensive error handling and edge cases
  - Implement network error recovery in frontend
  - Add graceful handling of disconnected players
  - Create error boundaries for all major components
  - Add user-friendly error messages and retry mechanisms
  - _Requirements: 2.2, 4.3_

- [ ] 21. Create end-to-end tests for complete game flows
  - Write tests for full game creation to completion cycle
  - Test multi-player concurrent interaction scenarios
  - Add tests for disconnection and reconnection flows
  - Implement automated testing for chain reaction scenarios
  - _Requirements: All requirements validation through testing_
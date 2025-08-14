# MockBoard Enhancement Implementation Plan

## Overview

This implementation plan converts the MockBoard enhancement design into a series of discrete, manageable coding tasks that will refactor the MockBoard component to perfectly mirror GameBoard's wave-based animation system while upgrading to a 5x5 grid and redesigning tutorial content.

Each task builds incrementally on previous tasks and focuses on specific coding activities that can be executed by a development agent. The plan prioritizes architectural consistency, animation accuracy, and educational effectiveness.

## Implementation Tasks

- [x] 1. Refactor MockBoard state management architecture
  - Replace single `grid` state with separate `logicalGrid` and `displayGrid` state variables
  - Add `lastMove` state variable to trigger animations (same pattern as GameBoard)
  - Add `lastProcessedMove` ref to prevent duplicate animation processing
  - Add `isAnimating` state to control user interactions during animations
  - Update TypeScript interfaces to match GameBoard patterns
  - _Requirements: 1.1, 1.2, 4.1, 4.2, 4.3, 6.1, 6.2_

- [x] 2. Upgrade grid dimensions from 3x3 to 5x5
  - Change `rows` and `cols` constants from 3 to 5
  - Update `createInitialGrid` function to handle 5x5 grid initialization
  - Modify responsive sizing calculations for 5x5 grid layout
  - Update critical mass calculations to work correctly with 5x5 positioning
  - Test that all existing functionality works with larger grid
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [x] 3. Implement wave-based explosion simulation system
  - Copy `simulateExplosionsWithWaves` function from GameBoard to MockBoard
  - Adapt the function to work with MockCell interface instead of Cell interface
  - Add `getAdjacentCells` helper function for 5x5 grid operations
  - Implement wave data storage using `waveDataRef` pattern from GameBoard
  - Add wave index state management (`waveIndex` state variable)
  - _Requirements: 1.3, 1.4, 3.1, 3.2, 4.4, 6.3_

- [x] 4. Refactor handleCellClick to use state-driven pattern
  - Remove all direct animation logic and setTimeout calls from handleCellClick
  - Simplify function to only validate moves and set `lastMove` state
  - Add immediate `setIsAnimating(true)` to prevent further clicks
  - Remove async/await pattern and complex timing logic
  - Ensure function only handles move validation and state setting
  - _Requirements: 1.1, 6.1, 6.4, 8.1, 8.2_

- [x] 5. Implement main animation useEffect hook
  - Create useEffect hook that watches `lastMove` state changes
  - Add logic to prevent processing the same move twice using `lastProcessedMove` ref
  - Implement placement simulation and display grid updates
  - Add explosion detection and wave machine initialization
  - Handle simple placements (no explosions) with proper timing
  - Mirror the exact logic flow from GameBoard's animation useEffect
  - _Requirements: 1.1, 1.2, 1.5, 3.3, 3.4, 6.2, 6.3_

- [x] 6. Implement wave-by-wave animation useEffect hook
  - Create useEffect hook that watches `waveIndex` state changes
  - Add wave completion detection and final state application
  - Implement explosion and orb animation generation for each wave
  - Add proper cleanup when all waves are complete
  - Ensure player switching occurs after animation completion
  - Use same timing and animation patterns as GameBoard
  - _Requirements: 1.3, 1.4, 3.1, 3.2, 3.3, 6.4_

- [x] 7. Update animation system integration
  - Ensure ExplosionAnimation and OrbAnimation interfaces include required `wave` property
  - Fix animation ID generation to use stable, deterministic IDs instead of Date.now()
  - Update AnimationLayer integration to work with new wave-based system
  - Add proper animation completion handling to advance wave index
  - Test that all animations render correctly with new system
  - _Requirements: 3.1, 3.2, 3.4, 8.1, 8.3_

- [x] 8. Redesign tutorial slide configurations for 5x5 grid
  - Update Slide 1 setup: Create two-player interactive sandbox with strategic orb placement
  - Update Slide 2 setup: Position critical mass cell for explosion demonstration
  - Update Slide 3 setup: Show corner, edge, and center cells with different critical masses
  - Update Slide 4 setup: Create infection scenario with blue trigger and red target cells
  - Update Slide 5 setup: Design complex chain reaction with multiple waves of explosions
  - Test each slide setup to ensure educational effectiveness
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ] 9. Update TutorialModal slide content and instructions
  - Rewrite Slide 1 text to explain two-player sandbox interaction on 5x5 grid
  - Rewrite Slide 2 text to emphasize critical mass concept and pulsing visual cue
  - Rewrite Slide 3 text to explain capacity differences with 5x5 grid examples
  - Rewrite Slide 4 text to clearly explain infection mechanics with interactive example
  - Rewrite Slide 5 text to build excitement about chain reactions and multi-wave explosions
  - Ensure all text is concise, clear, and focused on specific learning objectives
  - _Requirements: 5.6, 7.6_

- [ ] 10. Add proper state cleanup and error handling
  - Implement state reset logic when `initialSetup` prop changes
  - Add cleanup of refs and timers on component unmount
  - Prevent race conditions during rapid slide transitions
  - Add error boundaries for animation failures
  - Ensure consistent state synchronization between logical and display grids
  - Handle edge cases like rapid clicking during animations
  - _Requirements: 6.5, 8.1, 8.2, 8.3, 8.4, 8.5_

- [ ] 11. Optimize performance and responsive behavior
  - Implement memoization for expensive calculations (board dimensions, animations)
  - Add requestAnimationFrame usage for smooth animation timing
  - Optimize cell size calculations for 5x5 grid on different screen sizes
  - Ensure touch interactions work properly on mobile devices
  - Add loading states if needed for complex chain reaction simulations
  - Test performance on lower-end devices and optimize if necessary
  - _Requirements: 8.1, 8.4, 8.5_

- [ ] 12. Create comprehensive tests for MockBoard enhancements
  - Write unit tests for new state management logic
  - Test wave-based explosion simulation accuracy
  - Create integration tests comparing MockBoard vs GameBoard animation behavior
  - Test all tutorial slide configurations and interactions
  - Add responsive design tests for 5x5 grid on different screen sizes
  - Test animation performance and memory usage
  - _Requirements: All requirements validation through testing_

- [ ] 13. Validate animation consistency with GameBoard
  - Perform side-by-side visual comparison of MockBoard vs GameBoard animations
  - Test identical scenarios in both components to ensure consistent behavior
  - Verify timing, visual effects, and user feedback match between components
  - Ensure tutorial animations accurately represent real game experience
  - Document any remaining differences and justify or fix them
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 3.1, 3.2, 3.3, 3.4_

## Implementation Notes

### Key Architectural Changes
1. **State Separation**: MockBoard will maintain separate logical and display grids like GameBoard
2. **Event-Driven Animation**: Move from imperative setTimeout chains to reactive useEffect hooks
3. **Wave Processing**: Implement identical wave-by-wave explosion processing as GameBoard
4. **Grid Scaling**: Upgrade to 5x5 for richer tutorial scenarios

### Critical Success Factors
1. **Animation Consistency**: Tutorial animations must match real game behavior exactly
2. **Educational Effectiveness**: Each slide must teach one clear concept progressively
3. **Performance**: Animations must be smooth on all devices despite increased complexity
4. **Code Maintainability**: Architecture must be consistent with GameBoard for easier maintenance

### Testing Priorities
1. **Visual Consistency**: Ensure MockBoard animations look identical to GameBoard
2. **Educational Flow**: Verify tutorial progression teaches game mechanics effectively
3. **Performance**: Confirm smooth animations on mobile and desktop devices
4. **Error Handling**: Test edge cases and rapid user interactions

This implementation plan provides a systematic approach to creating a MockBoard component that perfectly mirrors GameBoard's sophisticated animation system while delivering an enhanced educational experience through the 5x5 grid and redesigned tutorial content.
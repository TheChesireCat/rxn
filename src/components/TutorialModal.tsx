'use client';

import React from 'react';
import { MockBoard } from './MockBoard';

interface TutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TutorialModal({ isOpen, onClose }: TutorialModalProps) {
  const [currentSlide, setCurrentSlide] = React.useState(0);
  const [currentTutorialPlayer, setCurrentTutorialPlayer] = React.useState<{ id: string, color: string }>({
    id: 'player1',
    color: '#3B82F6'
  });
  const totalSlides = 5;

  // Handler for when MockBoard's current player changes
  const handleCurrentPlayerChange = React.useCallback((playerId: string, playerColor: string) => {
    setCurrentTutorialPlayer(prev => {
      // Only update if the player actually changed
      if (prev.id !== playerId) {
        return { id: playerId, color: playerColor };
      }
      return prev;
    });
  }, []);

  // Reset tutorial player state when slide changes
  React.useEffect(() => {
    setCurrentTutorialPlayer({ id: 'player1', color: '#3B82F6' });
  }, [currentSlide]);

  if (!isOpen) return null;

  // Enhanced tutorial slide configurations for 5x5 grid
  const getTutorialSlide = () => {
    switch (currentSlide) {
      case 0:
        // Slide 1: Two-player interactive sandbox with strategic orb placement
        return (
          <div className="text-center">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              1. Try It: Place Your Orbs
            </h3>
            <p className="text-lg mb-6">
              You can place orbs in empty cells or cells you already own. <span
                className="font-bold"
                style={{ color: '#3B82F6' }}
              >
                {currentTutorialPlayer.id === 'player1' ? 'BLUE' : 'blue'}
              </span> and <span
                className="font-bold"
                style={{ color: '#EF4444' }}
              >
                {currentTutorialPlayer.id === 'player1' ? 'red' : 'RED'}
              </span> orbs show different players' territories.
            </p>

            <div className="flex justify-center mb-4">
              <MockBoard
                key={`slide-${currentSlide}`}
                className="scale-75 sm:scale-100"
                interactive={true}
                initialSetup="slide1"
                currentPlayer="player1"
                onCurrentPlayerChange={handleCurrentPlayerChange}
              />
            </div>

            <div className="text-sm text-gray-500 dark:text-gray-400 space-y-2">
              <p><strong>Interactive:</strong> Click any empty cell or <span
                className="inline-block w-8 text-center font-bold"
                style={{ color: currentTutorialPlayer.color }}
              >
                {currentTutorialPlayer.id === 'player1' ? 'blue' : 'red'}
              </span> cell to place your orbs!</p>
              <div
                className="p-2 rounded-lg border-2 transition-colors duration-300"
                style={{
                  borderColor: currentTutorialPlayer.color,
                  backgroundColor: `${currentTutorialPlayer.color}10` // 10% opacity
                }}
              >
                <p><strong>Tip:</strong> The <span style={{ color: currentTutorialPlayer.color, fontWeight: 'bold' }}>
                  {currentTutorialPlayer.id === 'player1' ? 'blue' : 'red'}
                </span> glow around the board shows it's the <span style={{ color: currentTutorialPlayer.color, fontWeight: 'bold' }}>
                    {currentTutorialPlayer.id === 'player1' ? 'blue' : 'red'}
                  </span> player's turn right now.</p>
              </div>
            </div>
          </div>
        );

      case 1:
        // Slide 2: Critical mass cell for explosion demonstration
        return (
          <div className="text-center">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              2. Try It: Trigger an Explosion!
            </h3>
            <p className="text-lg mb-6">
              When a cell reaches its limit, it explodes! The red pulsing dot means this center cell is ready to explode with one more orb.
            </p>

            <div className="flex justify-center mb-4">
              <MockBoard
                key={`slide-${currentSlide}`}
                className="scale-75 sm:scale-100"
                interactive={true}
                initialSetup="slide2"
                currentPlayer="player1"
              />
            </div>

            <p className="text-sm text-gray-500 dark:text-gray-400">
              <strong>Interactive:</strong> Click the pulsing center cell to trigger an explosion!
            </p>
          </div>
        );

      case 2:
        // Slide 3: Show corner, edge, and center cells with different critical masses
        return (
          <div className="text-center">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              3. Cell Capacity Rules
            </h3>
            <p className="text-lg mb-6">
              Different positions have different limits. All these cells are one orb away from exploding!
            </p>

            <div className="flex justify-center mb-4">
              <MockBoard
                key={`slide-${currentSlide}`}
                className="scale-75 sm:scale-100"
                initialSetup="slide3"
                interactive={true}
              />
            </div>

            <div className="text-sm text-gray-500 dark:text-gray-400 space-y-1">
              <p><strong>Corner (top-left):</strong> 1/2 orbs - explodes at 2</p>
              <p><strong>Edge (top-center):</strong> 2/3 orbs - explodes at 3</p>
              <p><strong>Center:</strong> 3/4 orbs - explodes at 4</p>
              <strong>Interactive:</strong> Click the blue center cell to capture all 4 red neighbors!
            </div>
          </div>
        );

      case 3:
        // Slide 4: Infection scenario with blue trigger and red target cells
        return (
          <div className="text-center">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              4. Try It: Capture Enemy Cells!
            </h3>
            <p className="text-lg mb-6">
              When your cell explodes, it sends orbs to neighboring cells and captures them! Watch the red cells turn blue.
            </p>

            <div className="flex justify-center mb-4">
              <MockBoard
                key={`slide-${currentSlide}`}
                className="scale-75 sm:scale-100"
                interactive={true}
                initialSetup="slide4"
                currentPlayer="player1"
              />
            </div>

            <p className="text-sm text-gray-500 dark:text-gray-400">
              <strong>Interactive:</strong> Click the blue center cell to capture all 4 red neighbors!
            </p>
          </div>
        );

      case 4:
        // Slide 5: Complex chain reaction with multiple waves of explosions
        return (
          <div className="text-center">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              5. Try It: Chain Reactions!
            </h3>
            <p className="text-lg mb-6">
              The best part: when captured cells also reach their limit, they explode too! This creates massive chain reactions.
            </p>

            <div className="flex justify-center mb-4">
              <MockBoard
                key={`slide-${currentSlide}`}
                className="scale-75 sm:scale-100"
                interactive={true}
                initialSetup="slide5"
                currentPlayer="player1"
              />
            </div>

            <p className="text-sm text-gray-500 dark:text-gray-400">
              <strong>Interactive:</strong> Click the blue center to start a spectacular chain reaction!
            </p>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="glass backdrop-blur-sm rounded-2xl shadow-xl max-w-4xl w-full  max-h-[95vh] overflow-y-auto border border-gray-200/50 dark:border-gray-700/50">
        {/* Header */}
        <div className="flex items-center justify-between p-6 sm:p-8 border-b border-gray-200/50 dark:border-gray-700/50">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            How to Play Chain Reaction
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-all duration-200 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 sm:p-8 h-[600px] flex items-center justify-center">
          <div className="text-gray-600 dark:text-gray-300 space-y-6 w-full">
            {getTutorialSlide()}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center px-4 py-3 sm:px-6 sm:py-4 border-t border-gray-200/50 dark:border-gray-700/50 h-40">
          {/* Navigation */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setCurrentSlide(Math.max(0, currentSlide - 1))}
              disabled={currentSlide === 0}
              className="px-3 py-1 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              ← Previous
            </button>

            <div className="flex items-center gap-2">
              {Array.from({ length: totalSlides }, (_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full transition-colors ${i === currentSlide
                    ? 'bg-blue-600 dark:bg-blue-400'
                    : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                />
              ))}
            </div>

            <button
              onClick={() => setCurrentSlide(Math.min(totalSlides - 1, currentSlide + 1))}
              disabled={currentSlide === totalSlides - 1}
              className="px-3 py-1 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next →
            </button>
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            className={`bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 hover:from-blue-700 hover:via-blue-800 hover:to-blue-900 text-white font-bold py-3 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl ${currentSlide === totalSlides - 1
              ? 'shadow-blue-500/50 shadow-2xl ring-2 ring-blue-400/50'
              : ''
              }`}
          >
            {currentSlide === totalSlides - 1 ? "Let's Play!" : "Got it!"}
          </button>
        </div>
      </div>
    </div>
  );
}
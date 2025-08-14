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

  // Renders the content for the current tutorial slide
  const getTutorialSlide = () => {
    switch (currentSlide) {
      case 0:
        return (
          <div className="text-center">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              Place Your Orbs
            </h3>
            <p className="text-base mb-4 min-h-[72px]">
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
                className="scale-75"
                interactive={true}
                initialSetup="slide1"
                currentPlayer="player1"
                onCurrentPlayerChange={handleCurrentPlayerChange}
              />
            </div>

            <div className="text-sm text-gray-500 dark:text-gray-400 space-y-2 min-h-[112px] flex flex-col justify-center">
              <div
                className="p-2 rounded-lg border-2 transition-colors duration-300"
                style={{
                  borderColor: currentTutorialPlayer.color,
                  backgroundColor: `${currentTutorialPlayer.color}10`
                }}
              >
                <p> <strong>Tip:</strong> The <span style={{ color: currentTutorialPlayer.color, fontWeight: 'bold' }}>
                  {currentTutorialPlayer.id === 'player1' ? 'blue' : 'red'}
                </span> glow around the board shows it's their turn.
                </p>
              </div>
            </div>
          </div>
        );

      case 1:
        return (
          <div className="text-center">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              Trigger an Explosion
            </h3>
            <p className="text-base mb-4 min-h-[72px]">
              When a cell reaches its limit, it explodes! The pulsing dot means this cell is ready to explode with one more orb.
            </p>

            <div className="flex justify-center mb-4">
              <MockBoard
                key={`slide-${currentSlide}`}
                className="scale-75"
                interactive={true}
                initialSetup="slide2"
                currentPlayer="player1"
              />
            </div>

            <div className="text-sm text-gray-500 dark:text-gray-400 min-h-[112px] flex flex-col justify-center">
              <p><strong>Interactive:</strong> Click the pulsing cell to trigger an explosion!</p>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="text-center">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              Cell Capacity Rules
            </h3>
            <p className="text-base mb-4 min-h-[72px]">
              Different positions have different limits. These cells are one orb away from exploding.
            </p>

            <div className="flex justify-center mb-4">
              <MockBoard
                key={`slide-${currentSlide}`}
                className="scale-75"
                initialSetup="slide3"
                interactive={true}
              />
            </div>

            <div className="text-sm text-gray-500 dark:text-gray-400 space-y-1 min-h-[112px] flex flex-col justify-center">
              <p>
                Critical mass by position: <strong>Corner</strong> (2), <strong>Edge</strong> (3), <strong>Center</strong> (4).
              </p>
              <p className="mt-2">
                <strong>Interactive:</strong> Click any cell to see it explode!
              </p>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="text-center">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              Capture Enemy Cells
            </h3>
            <p className="text-base mb-4 min-h-[72px]">
              When your cell explodes, it sends orbs to neighboring cells and captures them! Watch the red cells turn blue.
            </p>

            <div className="flex justify-center mb-4">
              <MockBoard
                key={`slide-${currentSlide}`}
                className="scale-75"
                interactive={true}
                initialSetup="slide4"
                currentPlayer="player1"
              />
            </div>

            <div className="text-sm text-gray-500 dark:text-gray-400 min-h-[112px] flex flex-col justify-center">
              <p><strong>Interactive:</strong> Click the blue center cell to capture the red cells.</p>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="text-center">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              Chain Reactions
            </h3>
            <p className="text-base mb-4 min-h-[72px]">
              When captured cells also reach their limit, they explode too! This creates massive chain reactions.
            </p>

            <div className="flex justify-center mb-4">
              <MockBoard
                key={`slide-${currentSlide}`}
                className="scale-75"
                interactive={true}
                initialSetup="slide5"
                currentPlayer="player1"
              />
            </div>

            <div className="text-sm text-gray-500 dark:text-gray-400 min-h-[112px] flex flex-col justify-center">
              <p><strong>Interactive:</strong> Click the blue center to start a spectacular chain reaction!</p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="glass backdrop-blur-sm rounded-2xl shadow-xl max-w-4xl w-full max-h-[98vh] overflow-y-auto border border-gray-200/50 dark:border-gray-700/50">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200/50 dark:border-gray-700/50">
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
        <div className="px-6 pb-4 pt-6">
          <div className="text-gray-600 dark:text-gray-300 space-y-4 w-full">
            {getTutorialSlide()}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center px-4 py-3 border-t border-gray-200/50 dark:border-gray-700/50">
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
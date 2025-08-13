'use client';

import React from 'react';
import { MockBoard } from './MockBoard';

interface TutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TutorialModal({ isOpen, onClose }: TutorialModalProps) {
  const [currentSlide, setCurrentSlide] = React.useState(0);
  const totalSlides = 5;

  if (!isOpen) return null;

  // Player colors for demonstration
  const PLAYER_COLORS = {
    blue: '#3B82F6',
    red: '#EF4444',
  };



  // Tutorial slide configurations
  const getTutorialSlide = () => {
    switch (currentSlide) {
      case 0:
        // Slide 1: Interactive basic orb placement - center has 1 orb
        return (
          <div className="text-center">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              1. Try It: Place Orbs in Cells
            </h3>
            <p className="text-lg mb-6">
              When it's your turn, you can place an orb in any empty cell or a cell you already own.
            </p>
            
            <div className="flex justify-center mb-4">
              <MockBoard 
                key={`slide-${currentSlide}`}
                className="scale-75 sm:scale-100" 
                interactive={true}
                initialSetup="slide1"
                currentPlayer="player1"
              />
            </div>
            
            <p className="text-sm text-gray-500 dark:text-gray-400">
              <strong>Interactive:</strong> Click on any cell to place your blue orbs!
            </p>
          </div>
        );

      case 1:
        // Slide 2: Stacking orbs until critical mass - center has 3 orbs (critical-1)
        return (
          <div className="text-center">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              2. Try It: Trigger an Explosion!
            </h3>
            <p className="text-lg mb-6">
              When a cell reaches its critical mass, it explodes! Notice the red pulsing dot - it means one more orb will cause an explosion.
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
              <strong>Interactive:</strong> Click the center cell with the red dot to trigger an explosion!
            </p>
          </div>
        );

      case 2:
        // Slide 3: Different positions have different capacities - all at critical-1
        return (
          <div className="text-center">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              3. Different Positions, Different Limits
            </h3>
            <p className="text-lg mb-6">
              Corner cells hold 2 orbs max, edge cells hold 3, and center cells hold 4. Notice all the red pulsing dots!
            </p>
            
            <div className="flex justify-center mb-4">
              <MockBoard 
                key={`slide-${currentSlide}`}
                className="scale-75 sm:scale-100" 
                initialSetup="slide3"
                interactive={false}
              />
            </div>
            
            <div className="text-sm text-gray-500 dark:text-gray-400 space-y-1">
              <p><strong>Corner:</strong> 1/2 orbs (red dot = critical next turn)</p>
              <p><strong>Edge:</strong> 2/3 orbs (red dot = critical next turn)</p>
              <p><strong>Center:</strong> 3/4 orbs (red dot = critical next turn)</p>
            </div>
          </div>
        );

      case 3:
        // Slide 4: Interactive infection demo - blue center critical-1, red edge
        return (
          <div className="text-center">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              4. Try It: Infect Your Opponents!
            </h3>
            <p className="text-lg mb-6">
              When your orbs explode next to enemy cells, you take them over! Click the blue center cell to see infection in action.
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
              <strong>Interactive:</strong> Click the blue center cell to explode and infect the red cell above!
            </p>
          </div>
        );

      case 4:
        // Slide 5: Interactive chain reaction demo - both players at critical-1
        return (
          <div className="text-center">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              5. Try It: Create Chain Reactions!
            </h3>
            <p className="text-lg mb-6">
              When infected cells also reach critical mass, they explode too! Click the blue center to trigger a massive chain reaction.
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
              <strong>Interactive:</strong> Click the blue center cell and watch the chain reaction spread!
            </p>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="glass backdrop-blur-sm rounded-2xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto border border-gray-200/50 dark:border-gray-700/50">
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
        <div className="p-6 sm:p-8">
          <div className="text-gray-600 dark:text-gray-300 space-y-6">
            {getTutorialSlide()}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center p-6 sm:p-8 border-t border-gray-200/50 dark:border-gray-700/50">
          {/* Navigation */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setCurrentSlide(Math.max(0, currentSlide - 1))}
              disabled={currentSlide === 0}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              ← Previous
            </button>
            
            <div className="flex items-center gap-2">
              {Array.from({ length: totalSlides }, (_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    i === currentSlide 
                      ? 'bg-blue-600 dark:bg-blue-400' 
                      : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                />
              ))}
            </div>
            
            <button
              onClick={() => setCurrentSlide(Math.min(totalSlides - 1, currentSlide + 1))}
              disabled={currentSlide === totalSlides - 1}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next →
            </button>
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 hover:from-blue-700 hover:via-blue-800 hover:to-blue-900 text-white font-bold py-3 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            {currentSlide === totalSlides - 1 ? "Let's Play!" : "Got it!"}
          </button>
        </div>
      </div>
    </div>
  );
}
'use client';

import React, { useEffect, useRef } from 'react';
import { useSpring, animated, useSpringValue, config } from '@react-spring/web';
import { Cell as CellType } from '@/types/game';
import { PLAYER_COLORS } from '@/lib/gameLogic';
import { ANIMATION_TIMING, SPRING_CONFIG } from '@/lib/animationUtils';

interface AnimatedCellProps {
  cell: CellType;
  row: number;
  col: number;
  isCurrentPlayerTurn: boolean;
  currentPlayerId: string;
  onCellClick: (row: number, col: number) => void;
  disabled?: boolean;
  isAnimating?: boolean;
  shouldPulse?: boolean;
}

export function AnimatedCell({
  cell,
  row,
  col,
  isCurrentPlayerTurn,
  currentPlayerId,
  onCellClick,
  disabled = false,
  isAnimating = false,
  shouldPulse = false,
}: AnimatedCellProps) {
  const canClick = !disabled && !isAnimating && isCurrentPlayerTurn && (!cell.ownerId || cell.ownerId === currentPlayerId);
  const prevOrbCount = useRef(cell.orbs);
  
  // Get player color index based on ownerId
  const getPlayerColorIndex = (ownerId: string | undefined): number => {
    if (!ownerId) return 0;
    let hash = 0;
    for (let i = 0; i < ownerId.length; i++) {
      hash = ((hash << 5) - hash + ownerId.charCodeAt(i)) & 0xffffffff;
    }
    return Math.abs(hash) % PLAYER_COLORS.length;
  };

  const playerColorIndex = getPlayerColorIndex(cell.ownerId);
  const playerColor = PLAYER_COLORS[playerColorIndex];

  // Ultra-fast orb count animation
  const orbCountSpring = useSpringValue(cell.orbs, {
    config: SPRING_CONFIG.placement,
  });

  // Snappy background animation for feedback
  const [backgroundSpring, backgroundApi] = useSpring(() => ({
    scale: 1,
    opacity: 0.15,
    config: SPRING_CONFIG.flash,
  }));

  // Animation for critical mass pulsing with more drama
  const [pulseSpring, pulseApi] = useSpring(() => ({
    scale: 1,
    opacity: 1,
    glow: 0,
    config: SPRING_CONFIG.pulse,
  }));

  // Animation for ultra-responsive hover
  const [hoverSpring, hoverApi] = useSpring(() => ({
    scale: 1,
    borderWidth: 2,
    shadow: 0,
    config: SPRING_CONFIG.hover,
  }));

  // Trigger explosive background flash when orbs are added
  useEffect(() => {
    if (cell.orbs > prevOrbCount.current && cell.orbs > 0) {
      backgroundApi.start({
        from: { scale: 1, opacity: 0.15 },
        to: async (next) => {
          await next({ scale: 1.12, opacity: 0.45 }); // More dramatic flash
          await next({ scale: 1, opacity: 0.15 });
        },
        config: SPRING_CONFIG.explosion,
      });
    }
    prevOrbCount.current = cell.orbs;
  }, [cell.orbs, backgroundApi]);

  // Handle critical mass pulsing with more intensity
  useEffect(() => {
    if (shouldPulse && cell.orbs >= cell.criticalMass) {
      const pulse = () => {
        pulseApi.start({
          from: { scale: 1, opacity: 1, glow: 0 },
          to: async (next) => {
            await next({ scale: 1.05, opacity: 0.8, glow: 20 }); // More dramatic pulse
            await next({ scale: 1, opacity: 1, glow: 0 });
          },
          config: SPRING_CONFIG.wobbly,
        });
      };
      
      pulse();
      const interval = setInterval(pulse, ANIMATION_TIMING.PULSE_DURATION * 4);
      return () => clearInterval(interval);
    } else {
      pulseApi.start({ scale: 1, opacity: 1, glow: 0 });
    }
  }, [shouldPulse, cell.orbs, cell.criticalMass, pulseApi]);

  // Update orb count animation
  useEffect(() => {
    orbCountSpring.start(cell.orbs);
  }, [cell.orbs, orbCountSpring]);

  const handleClick = () => {
    if (canClick) {
      // Add a little feedback animation on click
      hoverApi.start({
        from: { scale: 1.02 },
        to: { scale: 1 },
        config: { tension: 300, friction: 10 },
      });
      onCellClick(row, col);
    }
  };

  const handleMouseEnter = () => {
    if (canClick) {
      hoverApi.start({
        scale: 1.03, // More noticeable hover
        borderWidth: 4,
        shadow: 15,
      });
    }
  };

  const handleMouseLeave = () => {
    hoverApi.start({
      scale: 1,
      borderWidth: 2,
      shadow: 0,
    });
  };

  // Determine if cell is near critical mass for visual warning
  const isNearCritical = cell.orbs === cell.criticalMass - 1;
  const isCritical = cell.orbs >= cell.criticalMass;

  return (
    <animated.button
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      disabled={!canClick}
      className={`
        relative w-full h-full
        border-2
        border-gray-300 dark:border-gray-600
        transition-none
        ${canClick 
          ? 'cursor-pointer' 
          : 'cursor-not-allowed opacity-75'
        }
        ${isCritical 
          ? 'border-red-500' 
          : isNearCritical 
            ? 'border-yellow-500'
            : ''
        }
        rounded-lg
        flex items-center justify-center
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1
        overflow-hidden
        bg-white dark:bg-gray-800
      `}
      style={{
        transform: hoverSpring.scale.to(s => `scale(${s})`),
        borderWidth: hoverSpring.borderWidth,
        borderColor: cell.ownerId ? playerColor : undefined,
        backgroundColor: cell.ownerId 
          ? `${playerColor}15` 
          : '#ffffff',
        boxShadow: hoverSpring.shadow.to(s => 
          canClick ? `0 0 ${s}px ${playerColor}40` : 'none'
        ),
      }}
      aria-label={`Cell at row ${row + 1}, column ${col + 1}. ${cell.orbs} orbs. ${
        cell.ownerId ? `Owned by player` : 'Empty'
      }. Critical mass: ${cell.criticalMass}`}
    >
      {/* Animated background for orb placement feedback */}
      <animated.div
        className="absolute inset-0 rounded"
        style={{
          backgroundColor: playerColor,
          transform: backgroundSpring.scale.to(s => `scale(${s})`),
          opacity: backgroundSpring.opacity,
        }}
      />

      {/* Pulse overlay for critical cells with glow */}
      {(isCritical || shouldPulse) && (
        <animated.div
          className="absolute inset-0 rounded border-2 border-red-500"
          style={{
            transform: pulseSpring.scale.to(s => `scale(${s})`),
            opacity: pulseSpring.opacity,
            boxShadow: pulseSpring.glow.to(g => `0 0 ${g}px ${playerColor}`),
            animation: isCritical ? 'critical-pulse 0.8s infinite ease-in-out' : 'none',
          }}
        />
      )}

      {/* Enhanced orb display with better animations */}
      {cell.orbs > 0 && (
        <div className="absolute inset-0 flex items-center justify-center p-2 pointer-events-none">
          {/* For 1-4 orbs, show individual orbs with bouncy animations */}
          {cell.orbs === 1 && (
            <animated.div
              className="w-5 h-5 rounded-full shadow-lg orb-float"
              style={{ 
                backgroundColor: playerColor,
                boxShadow: `0 0 15px ${playerColor}80, 0 2px 8px rgba(0,0,0,0.2)`,
                transform: orbCountSpring.to(count => `scale(${Math.min(count, 1)})`),
                filter: 'brightness(1.3)',
              }}
            />
          )}
          {cell.orbs === 2 && (
            <div className="flex gap-2">
              {[0, 1].map((index) => (
                <animated.div
                  key={index}
                  className="w-4 h-4 rounded-full shadow-md orb-float"
                  style={{ 
                    backgroundColor: playerColor,
                    boxShadow: `0 0 10px ${playerColor}60, 0 2px 6px rgba(0,0,0,0.2)`,
                    transform: orbCountSpring.to(count => {
                      const shouldShow = index < Math.floor(count);
                      return shouldShow ? 'scale(1)' : 'scale(0)';
                    }),
                    filter: 'brightness(1.2)',
                    animationDelay: `${index * 0.1}s`,
                  }}
                />
              ))}
            </div>
          )}
          {cell.orbs === 3 && (
            <div className="relative w-full h-full">
              {[
                { top: '25%', left: '50%', transform: 'translate(-50%, -50%)' },
                { top: '55%', left: '35%', transform: 'translate(-50%, -50%)' },
                { top: '55%', left: '65%', transform: 'translate(-50%, -50%)' },
              ].map((pos, index) => (
                <animated.div
                  key={index}
                  className="absolute w-3.5 h-3.5 rounded-full shadow-md orb-float"
                  style={{ 
                    ...pos,
                    backgroundColor: playerColor,
                    boxShadow: `0 0 10px ${playerColor}60, 0 2px 5px rgba(0,0,0,0.2)`,
                    transform: orbCountSpring.to(count => {
                      const shouldShow = index < Math.floor(count);
                      return `${pos.transform} scale(${shouldShow ? 1 : 0})`;
                    }),
                    filter: 'brightness(1.2)',
                    animationDelay: `${index * 0.08}s`,
                  }}
                />
              ))}
            </div>
          )}
          {cell.orbs >= 4 && (
            /* For 4+ orbs, show dramatic count display */
            <div className="flex flex-col items-center">
              <animated.div
                className="w-6 h-6 rounded-full shadow-lg animate-pulse"
                style={{ 
                  backgroundColor: playerColor,
                  boxShadow: `0 0 20px ${playerColor}80, 0 3px 10px rgba(0,0,0,0.3)`,
                  transform: orbCountSpring.to(count => `scale(${Math.min(count / cell.orbs * 1.2, 1.2)})`),
                  filter: 'brightness(1.4)',
                }}
              />
              <animated.span 
                className="text-sm font-bold mt-1"
                style={{ 
                  color: playerColor,
                  textShadow: `0 0 8px ${playerColor}60`,
                  transform: orbCountSpring.to(count => `scale(${Math.min(count / cell.orbs * 1.1, 1.1)})`),
                }}
              >
                {orbCountSpring.to(count => Math.floor(count))}
              </animated.span>
            </div>
          )}
        </div>
      )}

      {/* Critical mass indicator with better visibility */}
      <div className="absolute bottom-1 right-1 text-[10px] text-gray-500 dark:text-gray-400 font-mono opacity-70 pointer-events-none">
        {cell.orbs}/{cell.criticalMass}
      </div>

      {/* Enhanced visual feedback for clickable state */}
      {canClick && (
        <animated.div 
          className="absolute inset-0 rounded border-2 border-transparent pointer-events-none"
          style={{
            borderColor: hoverSpring.scale.to(s => 
              s > 1.01 ? `${playerColor}50` : 'transparent'
            ),
          }}
        />
      )}
    </animated.button>
  );
}
'use client';

import React, { useEffect, useState } from 'react';
import { useSpring, animated, config } from '@react-spring/web';
import { 
  OrbAnimation, 
  ExplosionAnimation, 
  PlacementAnimation,
  ANIMATION_TIMING,
  getCellPosition 
} from '@/lib/animationUtils';

interface FlyingOrbProps {
  animation: OrbAnimation;
  cellSize: number;
  gap: number;
  onComplete: () => void;
}

// Individual flying orb component
function FlyingOrb({ animation, cellSize, gap, onComplete }: FlyingOrbProps) {
  const fromPos = getCellPosition(animation.fromRow, animation.fromCol, cellSize, gap);
  const toPos = getCellPosition(animation.toRow, animation.toCol, cellSize, gap);
  
  const fromPx = { 
    x: fromPos.x + cellSize / 2, 
    y: fromPos.y + cellSize / 2 
  };
  const toPx = { 
    x: toPos.x + cellSize / 2, 
    y: toPos.y + cellSize / 2 
  };

  // Calculate orb size relative to cell size
  const orbSize = Math.max(12, Math.floor(cellSize * 0.25)); // 25% of cell size, min 12px

  const spring = useSpring({
    from: { ...fromPx, scale: 1, opacity: 1 },
    to: async (next) => {
      // Wait for the delay
      await new Promise(resolve => setTimeout(resolve, animation.delay));
      // Fly to target
      await next({ 
        ...toPx, 
        scale: 0.8, 
        opacity: 0.9, 
        config: { tension: 200, friction: 20 } 
      });
      // Fade out
      await next({ 
        scale: 0.5, 
        opacity: 0, 
        config: { duration: 100 } 
      });
      onComplete();
    },
  });

  return (
    <animated.div
      className="absolute rounded-full pointer-events-none"
      style={{
        width: orbSize,
        height: orbSize,
        background: animation.color,
        left: spring.x,
        top: spring.y,
        transform: spring.scale.to(s => `translate(-50%, -50%) scale(${s})`),
        opacity: spring.opacity,
        boxShadow: `0 0 20px ${animation.color}`,
        filter: 'brightness(1.5)',
        zIndex: 100,
      }}
    />
  );
}

interface AnimationLayerProps {
  placementAnimation?: PlacementAnimation;
  explosionAnimations: ExplosionAnimation[];
  orbAnimations: OrbAnimation[];
  cellSize: number;
  gap: number;
  onAnimationComplete?: () => void;
}

export function AnimationLayer({
  placementAnimation,
  explosionAnimations,
  orbAnimations,
  cellSize,
  gap,
  onAnimationComplete,
}: AnimationLayerProps) {
  const [activeOrbs, setActiveOrbs] = useState<OrbAnimation[]>([]);
  const [completedOrbs, setCompletedOrbs] = useState<Set<string>>(new Set());

  // Start orb animations
  useEffect(() => {
    if (orbAnimations.length > 0) {
      setActiveOrbs(orbAnimations);
      setCompletedOrbs(new Set());
    } else {
      // Reset state when no orb animations
      setActiveOrbs([]);
      setCompletedOrbs(new Set());
    }
  }, [orbAnimations]);

  // Handle case where there are no animations at all
  useEffect(() => {
    // If no orb animations and no explosion animations, complete immediately
    if (orbAnimations.length === 0 && explosionAnimations.length === 0 && onAnimationComplete) {
      // Small delay for visual feedback
      const timer = setTimeout(() => {
        onAnimationComplete();
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [orbAnimations.length, explosionAnimations.length, onAnimationComplete]);

  // Check if all animations are complete
  useEffect(() => {
    if (activeOrbs.length > 0 && completedOrbs.size === activeOrbs.length) {
      // All orbs have completed their animation
      setTimeout(() => {
        setActiveOrbs([]);
        setCompletedOrbs(new Set());
        onAnimationComplete?.();
      }, 100);
    }
  }, [activeOrbs.length, completedOrbs.size, onAnimationComplete]);

  const handleOrbComplete = (orbId: string) => {
    setCompletedOrbs(prev => new Set(prev).add(orbId));
  };

  // Note: We're not rendering explosion animations as a separate overlay anymore
  // They're handled by the cell itself in AnimatedCell component
  
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* Flying orbs */}
      {activeOrbs.map((orb) => (
        <FlyingOrb
          key={orb.id}
          animation={orb}
          cellSize={cellSize}
          gap={gap}
          onComplete={() => handleOrbComplete(orb.id)}
        />
      ))}
    </div>
  );
}
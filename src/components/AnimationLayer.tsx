'use client';

import React, { useEffect, useState } from 'react';
import { useSpring, animated, useSprings } from '@react-spring/web';
import { 
  OrbAnimation, 
  ExplosionAnimation, 
  PlacementAnimation,
  ANIMATION_TIMING,
  getCellPosition 
} from '@/lib/animationUtils';

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
  const [activeAnimations, setActiveAnimations] = useState<{
    explosions: ExplosionAnimation[];
    orbs: OrbAnimation[];
    placement?: PlacementAnimation;
  }>({
    explosions: [],
    orbs: [],
  });

  // Start animations when new ones are provided
  useEffect(() => {
    if (placementAnimation || explosionAnimations.length > 0 || orbAnimations.length > 0) {
      setActiveAnimations({
        placement: placementAnimation,
        explosions: explosionAnimations,
        orbs: orbAnimations,
      });

      // Calculate total animation duration
      const maxExplosionDelay = Math.max(0, ...explosionAnimations.map(a => a.delay));
      const maxOrbDelay = Math.max(0, ...orbAnimations.map(a => a.delay));
      const totalDuration = Math.max(
        ANIMATION_TIMING.PLACEMENT_DURATION,
        maxExplosionDelay + ANIMATION_TIMING.EXPLOSION_DURATION,
        maxOrbDelay + ANIMATION_TIMING.ORB_MOVEMENT_DURATION
      );

      // Clear animations after completion
      const timeout = setTimeout(() => {
        setActiveAnimations({ explosions: [], orbs: [] });
        onAnimationComplete?.();
      }, totalDuration + 100);

      return () => clearTimeout(timeout);
    }
  }, [placementAnimation, explosionAnimations, orbAnimations, onAnimationComplete]);

  // Placement animation spring
  const placementSpring = useSpring({
    opacity: activeAnimations.placement ? 1 : 0,
    scale: activeAnimations.placement ? 1 : 0,
    config: { tension: 400, friction: 25 },
    reset: !!activeAnimations.placement,
  });

  // Explosion animations
  const explosionSprings = useSprings(
    activeAnimations.explosions.length,
    activeAnimations.explosions.map((explosion, index) => ({
      from: { scale: 0, opacity: 1 },
      to: async (next: any) => {
        // Wait for delay
        await new Promise(resolve => setTimeout(resolve, explosion.delay));
        // Expand
        await next({ scale: 1.5, opacity: 0.8 });
        // Fade out
        await next({ scale: 2, opacity: 0 });
      },
      config: { tension: 300, friction: 20 },
      reset: true,
    }))
  );

  // Orb movement animations
  const orbSprings = useSprings(
    activeAnimations.orbs.length,
    activeAnimations.orbs.map((orb, index) => {
      const fromPos = getCellPosition(orb.fromRow, orb.fromCol, cellSize, gap);
      const toPos = getCellPosition(orb.toRow, orb.toCol, cellSize, gap);
      
      return {
        from: { 
          x: fromPos.x + cellSize / 2, 
          y: fromPos.y + cellSize / 2, 
          scale: 1, 
          opacity: 1 
        },
        to: async (next: any) => {
          // Wait for delay
          await new Promise(resolve => setTimeout(resolve, orb.delay));
          // Move to target
          await next({ 
            x: toPos.x + cellSize / 2, 
            y: toPos.y + cellSize / 2, 
            scale: 0.8,
            opacity: 0.9 
          });
          // Fade out on arrival
          await next({ scale: 0, opacity: 0 });
        },
        config: { tension: 200, friction: 25 },
        reset: true,
      };
    })
  );

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* Placement animation */}
      {activeAnimations.placement && (
        <animated.div
          className="absolute w-4 h-4 rounded-full shadow-lg z-20"
          style={{
            backgroundColor: activeAnimations.placement.color,
            left: getCellPosition(activeAnimations.placement.row, activeAnimations.placement.col, cellSize, gap).x + cellSize / 2 - 8,
            top: getCellPosition(activeAnimations.placement.row, activeAnimations.placement.col, cellSize, gap).y + cellSize / 2 - 8,
            opacity: placementSpring.opacity,
            transform: placementSpring.scale.to(s => `scale(${s})`),
          }}
        />
      )}

      {/* Explosion animations */}
      {explosionSprings.map((spring, index) => {
        const explosion = activeAnimations.explosions[index];
        if (!explosion) return null;

        const position = getCellPosition(explosion.row, explosion.col, cellSize, gap);
        
        return (
          <animated.div
            key={explosion.id}
            className="absolute rounded-full z-10"
            style={{
              left: position.x + cellSize / 2 - 20,
              top: position.y + cellSize / 2 - 20,
              width: 40,
              height: 40,
              backgroundColor: explosion.color,
              opacity: spring.opacity,
              transform: spring.scale.to(s => `scale(${s})`),
            }}
          />
        );
      })}

      {/* Orb movement animations */}
      {orbSprings.map((spring, index) => {
        const orb = activeAnimations.orbs[index];
        if (!orb) return null;

        return (
          <animated.div
            key={orb.id}
            className="absolute w-3 h-3 rounded-full shadow-md z-15"
            style={{
              backgroundColor: orb.color,
              left: spring.x.to(x => x - 6),
              top: spring.y.to(y => y - 6),
              opacity: spring.opacity,
              transform: spring.scale.to(s => `scale(${s})`),
            }}
          />
        );
      })}
    </div>
  );
}
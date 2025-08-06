'use client';

import React, { useEffect, useState } from 'react';
import { animated, useSpring, useTransition } from '@react-spring/web';

export interface Reaction {
  id: string;
  emoji: string;
  senderId: string;
  senderName: string;
  timestamp: number;
  x?: number;
  y?: number;
}

interface ReactionOverlayProps {
  reactions: Reaction[];
  className?: string;
}

interface AnimatedReaction extends Reaction {
  animationId: string;
}

export function ReactionOverlay({ reactions, className = '' }: ReactionOverlayProps) {
  const [animatedReactions, setAnimatedReactions] = useState<AnimatedReaction[]>([]);

  // Convert reactions to animated reactions and manage their lifecycle
  useEffect(() => {
    const newAnimatedReactions = reactions.map(reaction => ({
      ...reaction,
      animationId: `${reaction.id}-${reaction.timestamp}`,
      // Add random position if not specified
      x: reaction.x ?? Math.random() * 80 + 10, // 10-90% of container width
      y: reaction.y ?? Math.random() * 80 + 10, // 10-90% of container height
    }));

    setAnimatedReactions(newAnimatedReactions);

    // Remove reactions after animation duration
    const timeout = setTimeout(() => {
      setAnimatedReactions(prev => 
        prev.filter(r => !reactions.some(newR => newR.id === r.id))
      );
    }, 3000); // 3 second animation duration

    return () => clearTimeout(timeout);
  }, [reactions]);

  // Spring transitions for reactions
  const transitions = useTransition(animatedReactions, {
    keys: (item: AnimatedReaction) => item.animationId,
    from: { 
      opacity: 0, 
      transform: 'scale(0.5) translateY(0px)',
    },
    enter: { 
      opacity: 1, 
      transform: 'scale(1.2) translateY(-20px)',
    },
    update: {
      transform: 'scale(1) translateY(-40px)',
    },
    leave: { 
      opacity: 0, 
      transform: 'scale(0.8) translateY(-60px)',
    },
    config: {
      tension: 300,
      friction: 20,
    },
  });

  if (animatedReactions.length === 0) {
    return null;
  }

  return (
    <div className={`absolute inset-0 pointer-events-none overflow-hidden ${className}`}>
      {transitions((style, reaction) => (
        <animated.div
          key={reaction.animationId}
          style={{
            ...style,
            position: 'absolute',
            left: `${reaction.x}%`,
            top: `${reaction.y}%`,
            zIndex: 50,
          }}
          className="flex flex-col items-center"
        >
          {/* Emoji */}
          <div className="text-2xl sm:text-3xl mb-1 drop-shadow-lg">
            {reaction.emoji}
          </div>
          
          {/* Sender name */}
          <div className="
            text-xs px-2 py-1 rounded-full
            bg-black/70 text-white
            whitespace-nowrap
            max-w-[100px] truncate
          ">
            {reaction.senderName}
          </div>
        </animated.div>
      ))}
    </div>
  );
}
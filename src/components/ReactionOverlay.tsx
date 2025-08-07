'use client';

import React, { useEffect, useRef } from 'react';
import { animated, useTransition } from '@react-spring/web';

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
  // Track which reactions we've already seen to avoid re-animating them
  const seenReactions = useRef<Set<string>>(new Set());
  const activeReactions = useRef<Map<string, AnimatedReaction>>(new Map());
  
  // Process new reactions
  const currentReactions: AnimatedReaction[] = [];
  
  reactions.forEach(reaction => {
    const reactionKey = `${reaction.id}-${reaction.timestamp}`;
    
    // Only process reactions we haven't seen yet
    if (!seenReactions.current.has(reactionKey)) {
      seenReactions.current.add(reactionKey);
      
      const animatedReaction: AnimatedReaction = {
        ...reaction,
        animationId: reactionKey,
        x: reaction.x ?? Math.random() * 80 + 10,
        y: reaction.y ?? Math.random() * 80 + 10,
      };
      
      activeReactions.current.set(reactionKey, animatedReaction);
      
      // Remove after animation duration (3 seconds)
      setTimeout(() => {
        activeReactions.current.delete(reactionKey);
      }, 3000);
    }
  });
  
  // Get all active reactions for display
  activeReactions.current.forEach(reaction => {
    currentReactions.push(reaction);
  });
  
  // Clean up old reactions from seenReactions periodically
  useEffect(() => {
    const cleanup = setInterval(() => {
      const now = Date.now();
      const cutoff = now - 20000; // Keep track for 20 seconds
      
      seenReactions.current.forEach(key => {
        const timestamp = parseInt(key.split('-').pop() || '0');
        if (timestamp < cutoff) {
          seenReactions.current.delete(key);
        }
      });
    }, 5000); // Clean up every 5 seconds
    
    return () => clearInterval(cleanup);
  }, []);

  // Spring transitions for reactions with enhanced animation
  // Using array syntax for multi-stage animation
  const transitions = useTransition(currentReactions, {
    keys: (item: AnimatedReaction) => item.animationId,
    from: { 
      opacity: 0, 
      transform: 'scale(0.3) translateY(10px) rotate(0deg)',
    },
    enter: [
      { 
        opacity: 1, 
        transform: 'scale(1.3) translateY(-15px) rotate(5deg)',
        config: { tension: 300, friction: 10 }
      },
      {
        transform: 'scale(1.1) translateY(-25px) rotate(-3deg)',
        config: { tension: 200, friction: 15 }
      },
      {
        transform: 'scale(1.0) translateY(-35px) rotate(2deg)',
        config: { tension: 180, friction: 20 }
      }
    ],
    leave: { 
      opacity: 0, 
      transform: 'scale(0.6) translateY(-55px) rotate(10deg)',
      config: { tension: 200, friction: 25 }
    },
  });

  if (currentReactions.length === 0) {
    return null;
  }

  return (
    <div className={`absolute inset-0 pointer-events-none overflow-hidden ${className}`}>
      {transitions((style, reaction) => reaction && (
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
          {/* Emoji with enhanced styling */}
          <div className="text-3xl sm:text-4xl mb-1 drop-shadow-2xl filter">
            <span className="inline-block animate-pulse">
              {reaction.emoji}
            </span>
          </div>
          
          {/* Sender name with improved styling */}
          <div className="
            text-xs px-3 py-1.5 rounded-full
            bg-gradient-to-r from-black/80 to-gray-800/80 text-white
            backdrop-blur-sm border border-white/20
            whitespace-nowrap shadow-lg
            max-w-[120px] truncate
            font-medium
          ">
            {reaction.senderName}
          </div>
        </animated.div>
      ))}
    </div>
  );
}

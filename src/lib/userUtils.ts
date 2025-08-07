/**
 * Utility functions for handling claimed vs unclaimed users
 */
import type { User } from '@/types/game';

/**
 * Get display information for a user including claimed status
 */
export function getUserDisplayInfo(user: User) {
  return {
    name: user.name,
    isClaimed: user.isClaimed || false,
    badge: user.isClaimed ? 'Registered' : 'Guest',
    badgeColor: user.isClaimed ? 'green' : 'gray',
    icon: user.isClaimed ? '✓' : '👤',
  };
}

/**
 * Get presence display information with claimed status
 */
export function getPresenceDisplayInfo(presence: any) {
  return {
    ...presence,
    displayName: presence.name,
    statusIcon: presence.isClaimed ? '✓' : '👤',
    statusText: presence.isClaimed ? 'Registered' : 'Guest',
    statusColor: presence.isClaimed ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400',
  };
}

/**
 * Enhanced tooltip for user status
 */
export function getUserStatusTooltip(user: User): string {
  if (user.isClaimed) {
    const claimedDate = user.nameClaimedAt ? new Date(user.nameClaimedAt).toLocaleDateString() : 'Unknown';
    return `Registered player since ${claimedDate} • Stats are saved`;
  }
  
  return 'Guest player • Stats will not be saved unless you claim your username';
}

/**
 * Get user stats text with claimed status context
 */
export function getUserStatsText(user: User): string {
  const gamesText = `${user.gamesPlayed} game${user.gamesPlayed !== 1 ? 's' : ''}`;
  const winsText = `${user.wins} win${user.wins !== 1 ? 's' : ''}`;
  
  if (user.isClaimed) {
    return `${winsText} • ${gamesText} • Registered player`;
  }
  
  return `${winsText} • ${gamesText} • Guest (stats not saved)`;
}

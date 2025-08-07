/**
 * Username suggestion generator for when usernames are taken
 * Implements Requirement 1.5: suggest alternatives when username is already taken
 */

/**
 * Generate alternative username suggestions when original is taken
 * @param originalUsername The desired username that's unavailable
 * @param count Number of suggestions to generate (default: 6)
 * @returns Array of suggested alternative usernames
 */
export function generateUsernameSuggestions(originalUsername: string, count: number = 6): string[] {
  if (!originalUsername || originalUsername.length < 2) {
    return [];
  }

  const suggestions = new Set<string>();
  const baseUsername = originalUsername.toLowerCase().replace(/[^a-z0-9]/g, '');
  
  // Strategy 1: Add numbers at the end
  for (let i = 1; i <= Math.min(count, 999); i++) {
    if (suggestions.size < count) {
      suggestions.add(`${originalUsername}${i}`);
    }
  }
  
  // Strategy 2: Add cool suffixes
  const suffixes = [
    'Pro', 'X', 'Master', 'Elite', 'Prime', 'Max', 'Ultra', 'Plus',
    'Star', 'Hero', 'Ace', 'Legend', 'Boss', 'King', 'Queen', 'Ninja',
    'Gamer', 'Player', 'Winner', 'Champ'
  ];
  
  for (const suffix of suffixes) {
    if (suggestions.size >= count) break;
    suggestions.add(`${originalUsername}${suffix}`);
  }
  
  // Strategy 3: Add prefixes
  const prefixes = [
    'The', 'Real', 'True', 'Super', 'Mega', 'Epic', 'Cool', 'Best',
    'Top', 'Mr', 'Ms', 'Sir', 'Lord', 'Lady'
  ];
  
  for (const prefix of prefixes) {
    if (suggestions.size >= count) break;
    const suggestion = `${prefix}${originalUsername}`;
    if (suggestion.length <= 20) { // Respect max length
      suggestions.add(suggestion);
    }
  }
  
  // Strategy 4: Add underscores with variations
  const underscoreVariations = [
    `${originalUsername}_`,
    `_${originalUsername}`,
    `${originalUsername}_1`,
    `_${originalUsername}_`
  ];
  
  for (const variation of underscoreVariations) {
    if (suggestions.size >= count) break;
    if (variation.length <= 20) {
      suggestions.add(variation);
    }
  }
  
  // Strategy 5: Letter substitutions (l33t speak)
  const substitutions: { [key: string]: string } = {
    'a': '4',
    'e': '3',
    'i': '1',
    'o': '0',
    's': '5',
    't': '7'
  };
  
  let leetUsername = originalUsername.toLowerCase();
  for (const [letter, number] of Object.entries(substitutions)) {
    leetUsername = leetUsername.replace(new RegExp(letter, 'g'), number);
  }
  
  if (leetUsername !== originalUsername.toLowerCase() && leetUsername.length <= 20) {
    suggestions.add(leetUsername);
  }
  
  // Strategy 6: Year additions
  const currentYear = new Date().getFullYear();
  const years = [currentYear, currentYear - 1, currentYear + 1];
  
  for (const year of years) {
    if (suggestions.size >= count) break;
    const suggestion = `${originalUsername}${year}`;
    if (suggestion.length <= 20) {
      suggestions.add(suggestion);
    }
  }
  
  // Strategy 7: Random two-digit numbers
  for (let i = 0; i < 10; i++) {
    if (suggestions.size >= count) break;
    const randomNum = Math.floor(Math.random() * 100).toString().padStart(2, '0');
    const suggestion = `${originalUsername}${randomNum}`;
    if (suggestion.length <= 20) {
      suggestions.add(suggestion);
    }
  }
  
  // Convert to array and return requested count
  return Array.from(suggestions)
    .slice(0, count)
    .filter(s => s.length >= 3 && s.length <= 20) // Validate length
    .filter(s => /^[a-zA-Z0-9_-]+$/.test(s)); // Validate format
}

/**
 * Generate suggestions based on username validation error type
 * @param originalUsername The username that failed validation
 * @param validationError The specific validation error
 * @returns Array of suggestions that address the validation issue
 */
export function generateValidationSuggestions(
  originalUsername: string, 
  validationError: string
): string[] {
  const suggestions: string[] = [];
  
  if (validationError.includes('too short') || validationError.includes('at least 3')) {
    // Username too short - pad with common endings
    const endings = ['123', 'Pro', 'X', '99', '2024'];
    for (const ending of endings) {
      const suggestion = `${originalUsername}${ending}`;
      if (suggestion.length >= 3 && suggestion.length <= 20) {
        suggestions.push(suggestion);
      }
    }
  }
  
  if (validationError.includes('too long') || validationError.includes('20 characters')) {
    // Username too long - try shorter versions
    const base = originalUsername.slice(0, 15); // Leave room for additions
    suggestions.push(
      base,
      base + '1',
      base + 'X',
      originalUsername.slice(0, 18),
      originalUsername.slice(0, 17) + '1'
    );
  }
  
  if (validationError.includes('invalid characters') || validationError.includes('can only contain')) {
    // Invalid characters - clean and suggest
    const cleaned = originalUsername.replace(/[^a-zA-Z0-9_-]/g, '');
    if (cleaned.length >= 3) {
      suggestions.push(
        cleaned,
        cleaned + '1',
        cleaned + 'X',
        cleaned.replace(/[^a-zA-Z0-9]/g, ''), // Remove all special chars
        cleaned + '_1'
      );
    }
  }
  
  if (validationError.includes('reserved')) {
    // Reserved username - add modifiers to make it unique
    const modifiers = ['Player', 'User', 'Gamer', '2024', 'Real', 'The'];
    for (const modifier of modifiers) {
      const suggestion1 = `${originalUsername}${modifier}`;
      const suggestion2 = `${modifier}${originalUsername}`;
      
      if (suggestion1.length <= 20) suggestions.push(suggestion1);
      if (suggestion2.length <= 20) suggestions.push(suggestion2);
    }
  }
  
  return suggestions
    .filter((s, index, arr) => arr.indexOf(s) === index) // Remove duplicates
    .slice(0, 6); // Limit to 6 suggestions
}

/**
 * Check if a suggested username is likely to be valid
 * @param username The username to validate
 * @returns boolean indicating if the username passes basic validation
 */
export function isValidSuggestion(username: string): boolean {
  if (!username || typeof username !== 'string') return false;
  
  const trimmed = username.trim();
  
  // Check length
  if (trimmed.length < 3 || trimmed.length > 20) return false;
  
  // Check format
  if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) return false;
  
  // Check for reserved names
  const reservedNames = [
    'admin', 'administrator', 'mod', 'moderator', 'system', 'bot', 'api',
    'support', 'help', 'guest', 'anonymous', 'user', 'player', 'spectator',
    'null', 'undefined', 'true', 'false', 'test', 'demo'
  ];
  
  if (reservedNames.includes(trimmed.toLowerCase())) return false;
  
  return true;
}

/**
 * Generate smart suggestions that are likely to be available
 * Combines multiple strategies and filters out poor suggestions
 */
export function generateSmartSuggestions(originalUsername: string): string[] {
  const allSuggestions = generateUsernameSuggestions(originalUsername, 12);
  
  // Score suggestions based on likelihood of availability and quality
  const scoredSuggestions = allSuggestions.map(suggestion => {
    let score = 0;
    
    // Prefer shorter additions
    const addition = suggestion.replace(originalUsername, '');
    if (addition.length <= 2) score += 3;
    else if (addition.length <= 4) score += 2;
    else score += 1;
    
    // Prefer numbers over words (more likely to be available)
    if (/^\d+$/.test(addition)) score += 2;
    
    // Prefer simple patterns
    if (suggestion.endsWith('1') || suggestion.endsWith('2')) score += 1;
    
    // Penalize very long usernames
    if (suggestion.length > 15) score -= 1;
    
    return { suggestion, score };
  });
  
  // Sort by score (descending) and return top 6
  return scoredSuggestions
    .sort((a, b) => b.score - a.score)
    .slice(0, 6)
    .map(item => item.suggestion)
    .filter(isValidSuggestion);
}

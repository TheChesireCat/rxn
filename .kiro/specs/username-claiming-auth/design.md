# Design Document

## Overview

This design implements a username claiming system with magic code authentication using InstantDB's built-in auth system. The solution allows users to claim persistent usernames tied to their email addresses, enabling seamless login with just their username in future sessions.

The system builds upon the existing user management infrastructure and integrates InstantDB's magic code authentication to provide a secure, passwordless experience.

## Architecture

### High-Level Flow

1. **Username Entry**: User enters desired username
2. **Availability Check**: System validates username availability and format
3. **Email Collection**: For new claims, user provides email address
4. **Magic Code Delivery**: InstantDB sends verification code to email
5. **Verification**: User enters code to complete authentication
6. **Username Linking**: System links username to authenticated user account
7. **Future Logins**: User enters username → system looks up email → sends magic code → user verifies

### Database Schema Integration

The existing schema already supports username claiming through these fields in the `users` entity:
- `authUserId`: Links to InstantDB's `$users.id` when claimed
- `email`: Stores email address for claimed usernames
- `nameClaimedAt`: Timestamp when username was registered

## Components and Interfaces

### 1. Enhanced Login Flow Component

**Location**: `src/components/auth/MagicCodeLogin.tsx`

```typescript
interface MagicCodeLoginProps {
  onAuthenticated: (user: User) => void;
  initialUsername?: string;
}

interface LoginState {
  step: 'username' | 'email' | 'code';
  username: string;
  email: string;
  isNewClaim: boolean;
}
```

**Responsibilities**:
- Handle username input and validation
- Determine if username is claimed or needs claiming
- Manage email collection for new claims
- Coordinate magic code flow with InstantDB
- Handle authentication success/failure

### 2. Username Availability Service

**Location**: `src/lib/usernameService.ts`

```typescript
interface UsernameCheckResult {
  available: boolean;
  isClaimed: boolean;
  isActive: boolean;
  email?: string; // For claimed usernames
  lastActive?: number;
  reason?: string;
}

export class UsernameService {
  static async checkAvailability(username: string): Promise<UsernameCheckResult>
  static async getEmailForUsername(username: string): Promise<string | null>
  static async claimUsername(username: string, authUserId: string, email: string): Promise<void>
}
```

### 3. Enhanced API Routes

#### `/api/auth/username-login` (NEW)
- **Purpose**: Handle username-based login initiation
- **Input**: `{ username: string }`
- **Output**: `{ needsEmail: boolean, email?: string }`
- **Logic**: 
  - Check if username is claimed
  - If claimed, return associated email
  - If unclaimed, indicate email needed

#### `/api/auth/claim-username` (ENHANCED)
- **Purpose**: Link authenticated user to username
- **Input**: `{ username: string, authUserId: string, email: string }`
- **Output**: `{ success: boolean, user: User }`
- **Logic**: Update user record with auth linking

### 4. InstantDB Integration Layer

**Location**: `src/lib/auth.ts`

```typescript
export class AuthService {
  static async sendMagicCodeToEmail(email: string): Promise<void>
  static async sendMagicCodeToUsername(username: string): Promise<void>
  static async verifyMagicCode(email: string, code: string): Promise<User>
  static async getCurrentUser(): Promise<User | null>
  static async signOut(): Promise<void>
}
```

## Data Models

### User Model Enhancement

The existing `users` entity supports the required fields:

```typescript
interface ClaimedUser extends User {
  authUserId: string;        // Links to $users.id
  email: string;             // Email for magic code delivery
  nameClaimedAt: number;     // Claim timestamp
  updatedAt: number;         // Last update timestamp
}
```

### Username Lookup Cache

For performance, implement a simple in-memory cache for username-to-email lookups:

```typescript
interface UsernameLookupCache {
  [username: string]: {
    email: string;
    lastUpdated: number;
  };
}
```

## Error Handling

### Username Validation Errors
- **Invalid Format**: "Username must be 3-20 characters (letters, numbers, _, -)"
- **Reserved Name**: "This username is reserved"
- **Already Claimed**: "This username is registered. Sign in to use it."
- **Currently Active**: "This username is currently in use. Try another."

### Authentication Errors
- **Invalid Email**: "Please enter a valid email address"
- **Code Send Failed**: "Failed to send verification code. Please try again."
- **Invalid Code**: "Invalid verification code. Please try again."
- **Code Expired**: "Verification code expired. Please request a new one."

### System Errors
- **Database Error**: "System temporarily unavailable. Please try again."
- **Rate Limiting**: "Too many attempts. Please wait before trying again."

## Testing Strategy

### Unit Tests
1. **Username Validation**: Test format validation, reserved names, availability checking
2. **Email Lookup**: Test username-to-email resolution
3. **Magic Code Flow**: Mock InstantDB auth calls and test flow logic
4. **Error Handling**: Test all error scenarios and user feedback

### Integration Tests
1. **End-to-End Auth Flow**: Complete username claim and login process
2. **Database Operations**: Test user record updates and linking
3. **InstantDB Integration**: Test magic code sending and verification
4. **Session Management**: Test user session persistence

### User Experience Tests
1. **New User Flow**: Username claim with email verification
2. **Returning User Flow**: Username login with magic code
3. **Error Recovery**: Handle failed codes, network issues, etc.
4. **Mobile Responsiveness**: Test on various screen sizes

## Security Considerations

### Username Claiming Security
- **Rate Limiting**: Limit username checks and claim attempts per IP
- **Email Verification**: Require magic code verification before claiming
- **Reserved Names**: Prevent claiming of system/admin usernames
- **Case Sensitivity**: Treat usernames as case-insensitive for uniqueness

### Authentication Security
- **Magic Code Expiry**: InstantDB handles code expiration (typically 10 minutes)
- **Single Use Codes**: Codes are invalidated after successful use
- **Email Validation**: Validate email format before sending codes
- **Session Security**: Leverage InstantDB's secure session management

### Data Protection
- **Email Storage**: Store emails securely in InstantDB
- **User Consent**: Clear messaging about email usage and data storage
- **Data Retention**: Follow InstantDB's data retention policies
- **GDPR Compliance**: Support user data deletion requests

## Performance Optimizations

### Caching Strategy
- **Username Lookups**: Cache username-to-email mappings for 5 minutes
- **Availability Checks**: Cache availability results for 30 seconds
- **User Sessions**: Leverage InstantDB's built-in session caching

### Database Optimization
- **Indexed Queries**: Utilize existing indexes on `name` and `authUserId` fields
- **Batch Operations**: Group related database updates in transactions
- **Query Optimization**: Use specific field selections to minimize data transfer

### User Experience
- **Instant Feedback**: Real-time username availability checking
- **Progressive Enhancement**: Graceful degradation for slow connections
- **Loading States**: Clear loading indicators during async operations
- **Error Recovery**: Automatic retry for transient failures
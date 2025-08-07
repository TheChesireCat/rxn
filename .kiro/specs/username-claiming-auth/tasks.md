# Implementation Plan

- [x] 1. Create username-based authentication service layer
  - Implement AuthService class with magic code methods for username-based login
  - Add username-to-email lookup functionality
  - Create error handling for authentication failures
  - _Requirements: 2.1, 2.2, 2.3_

- [x] 2. Build enhanced magic code login component
  - Create MagicCodeLogin component with multi-step flow (username → email → code)
  - Implement state management for login steps and user input
  - Add form validation and error display
  - _Requirements: 1.1, 1.2, 2.1, 2.2_

- [x] 3. Implement username-based login API endpoint
  - Create /api/auth/username-login route to handle username lookup
  - Add logic to determine if username is claimed or needs email
  - Implement rate limiting and input validation
  - _Requirements: 2.1, 2.2, 4.1_

- [x] 4. Enhance username claiming flow with magic code verification
  - Update ClaimUsernameModal to use new AuthService methods
  - Integrate magic code verification before username claiming
  - Add proper error handling and user feedback
  - _Requirements: 1.3, 1.4, 1.5_

- [x] 5. Create username availability checking with real-time feedback
  - Implement real-time username availability checking in UserSetupForm
  - Add visual indicators for available/taken/claimed usernames
  - Create debounced API calls to prevent excessive requests
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 6. Update user session management for claimed usernames
  - Modify user creation flow to handle both claimed and unclaimed users
  - Update session persistence to maintain username-email associations
  - Ensure consistent username display across all game components
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [x] 7. Implement comprehensive error handling and user feedback
  - Add specific error messages for all authentication failure scenarios
  - Create user-friendly error recovery flows
  - Implement proper loading states and progress indicators
  - _Requirements: 1.5, 2.4, 4.4_

- [ ] 8. Create integration tests for username claiming and login flows
  - Write tests for complete username claim process with magic code verification
  - Test returning user login flow with username-to-email lookup
  - Add error scenario testing for failed codes and network issues
  - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 2.3_

- [ ] 9. Add security enhancements and rate limiting
  - Implement rate limiting for username checks and authentication attempts
  - Add input sanitization and validation for all user inputs
  - Create reserved username protection and validation
  - _Requirements: 4.5, 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 10. Update HomePage component to integrate new authentication flow
  - Replace existing UserSetupForm with enhanced MagicCodeLogin component
  - Add support for both new user registration and returning user login
  - Ensure smooth transition between different authentication states
  - _Requirements: 1.1, 2.1, 3.1_
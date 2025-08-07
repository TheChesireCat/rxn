# InstantDB Magic Code Authentication - Troubleshooting Guide

## Error: "Record not found: app-user-magic-code"

This error typically occurs when there's a mismatch in the magic code authentication flow. Here's how to fix it:

## Common Causes & Solutions

### 1. **Code Expiration** (Most Common)
- Magic codes expire after **10 minutes**
- Each code can only be used **once**
- **Solution**: Request a new code if more than 10 minutes have passed

### 2. **Email Mismatch**
- The email used to verify must match EXACTLY with the email the code was sent to
- Check for typos, extra spaces, or case differences
- **Solution**: Ensure the same email is used for both sending and verifying

### 3. **InstantDB Configuration Issues**

#### Check Your Dashboard Settings:
1. Go to [InstantDB Dashboard](https://instantdb.com/dash)
2. Select your app (ID: `b77288d8-9085-41f6-927e-79e8a8ac5c45`)
3. Navigate to **Settings** → **Authentication**
4. Ensure **Magic Code Auth** is enabled
5. Check email provider settings (should be configured by default)

#### Verify Admin Token:
Your `.env` file has the admin token, but verify it's correct:
```bash
INSTANT_ADMIN_TOKEN=01d2214a-336b-4169-9cf2-ec5b5d15f9c9
```

### 4. **Testing the Authentication Flow**

I've created a test page for you. Run your dev server and navigate to:
```
http://localhost:3000/test-magic-auth
```

This page includes:
- Detailed debug logging
- Error handling with hints
- Resend code functionality
- Attempt tracking

### 5. **Step-by-Step Debugging Process**

1. **Test with the Debug Page**:
   ```bash
   npm run dev
   ```
   Navigate to: http://localhost:3000/test-magic-auth

2. **Check Browser Console**:
   - Open DevTools (F12)
   - Look for any network errors in the Network tab
   - Check Console for detailed error messages

3. **Verify Email Delivery**:
   - Check your spam/junk folder
   - Ensure the email address is valid
   - Try with a different email provider (Gmail, Outlook, etc.)

4. **Code Format**:
   - The code should be exactly 6 digits
   - No spaces or special characters
   - Copy-paste to avoid typos

### 6. **Alternative Solutions**

If magic codes continue to fail:

#### Option A: Use Test Mode
In development, you can use test emails that auto-approve:
```javascript
// Test emails that work without actual email sending
const testEmail = "test@example.com"; // Auto-approves with code "000000"
```

#### Option B: Implement Google OAuth
InstantDB also supports Google OAuth as an alternative:
```javascript
// Alternative: Google OAuth
db.auth.signInWithGoogle();
```

### 7. **Check InstantDB Service Status**

Sometimes the issue might be on InstantDB's end:
1. Check [InstantDB Status](https://status.instantdb.com/)
2. Check their [Discord](https://discord.com/invite/instantdb) for any reported issues

### 8. **Common Error Messages & Meanings**

| Error | Meaning | Solution |
|-------|---------|----------|
| `Record not found: app-user-magic-code` | Code doesn't exist or expired | Request new code |
| `Invalid magic code` | Wrong code entered | Check for typos |
| `Magic code expired` | Code older than 10 minutes | Request new code |
| `Too many attempts` | Rate limited | Wait a few minutes |

### 9. **Integration with Your RXN Game**

Your RXN game currently uses a custom session-based auth system. To integrate InstantDB magic codes:

1. **Keep both systems temporarily**:
   - Use InstantDB for authentication (login)
   - Use your session system for game state

2. **Migration path**:
   ```javascript
   // After successful InstantDB auth
   const instantUser = await db.auth.getAuth();
   
   // Create/update your game user
   await createUser(instantUser.email, instantUser.id, instantUser.email);
   ```

3. **Update your User type**:
   ```typescript
   interface User {
     id: string;
     name: string;
     email?: string;
     authUserId?: string; // InstantDB user ID
     isClaimed?: boolean;
   }
   ```

### 10. **Quick Test Checklist**

- [ ] Magic code auth enabled in InstantDB dashboard
- [ ] Correct app ID in `.env`
- [ ] Valid admin token in `.env`
- [ ] Email received within 10 minutes
- [ ] Code entered exactly as received
- [ ] Same email for send and verify
- [ ] No browser extensions blocking requests
- [ ] Network connection stable

## Need More Help?

1. **Test Page**: http://localhost:3000/test-magic-auth
2. **InstantDB Docs**: https://instantdb.com/docs
3. **InstantDB Discord**: https://discord.com/invite/instantdb
4. **Check browser console for detailed errors**

## Working Example

The test page I created (`/src/app/test-magic-auth/page.tsx`) implements the exact pattern from InstantDB docs with added debugging. Use it to:

1. Test if magic codes work at all
2. See detailed error messages
3. Debug the authentication flow
4. Verify your configuration

Once it works there, you can integrate it into your main game flow.

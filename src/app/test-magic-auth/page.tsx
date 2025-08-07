"use client";

import React, { useState } from "react";
import { db } from "@/lib/instant";
import { User } from "@instantdb/react";

/**
 * Test page for debugging InstantDB Magic Code Authentication
 * This implements the exact pattern from InstantDB docs with additional debugging
 */
export default function TestMagicAuth() {
  const { isLoading, user, error } = db.useAuth();
  const [debugInfo, setDebugInfo] = useState<string[]>([]);

  const addDebugInfo = (info: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setDebugInfo(prev => [...prev, `[${timestamp}] ${info}`]);
  };

  if (isLoading) {
    return <div className="p-4">Loading auth state...</div>;
  }

  if (error) {
    return (
      <div className="p-4 space-y-4">
        <div className="text-red-500">
          <h2 className="text-xl font-bold">Auth Error:</h2>
          <pre className="bg-red-50 p-2 rounded mt-2">{JSON.stringify(error, null, 2)}</pre>
        </div>
      </div>
    );
  }

  if (user) {
    return <AuthenticatedView user={user} onDebug={addDebugInfo} debugInfo={debugInfo} />;
  }

  return <LoginView onDebug={addDebugInfo} debugInfo={debugInfo} />;
}

function AuthenticatedView({ 
  user, 
  onDebug, 
  debugInfo 
}: { 
  user: User; 
  onDebug: (info: string) => void;
  debugInfo: string[];
}) {
  const handleSignOut = async () => {
    try {
      onDebug("Signing out...");
      await db.auth.signOut();
      onDebug("Sign out successful");
    } catch (err: any) {
      onDebug(`Sign out error: ${err.message}`);
    }
  };

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto">
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <h1 className="text-2xl font-bold text-green-800">Authentication Successful! ✓</h1>
        <div className="mt-4 space-y-2">
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>User ID:</strong> {user.id}</p>
          <p><strong>Created At:</strong> {new Date(user.createdAt).toLocaleString()}</p>
        </div>
      </div>

      <button
        onClick={handleSignOut}
        className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
      >
        Sign Out
      </button>

      <DebugPanel debugInfo={debugInfo} />
    </div>
  );
}

function LoginView({ 
  onDebug, 
  debugInfo 
}: { 
  onDebug: (info: string) => void;
  debugInfo: string[];
}) {
  const [sentEmail, setSentEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold">InstantDB Magic Code Auth Test</h1>
          <p className="text-gray-600 mt-2">Testing magic code authentication flow</p>
        </div>

        {!sentEmail ? (
          <EmailStep 
            onSendEmail={setSentEmail} 
            onDebug={onDebug}
            isLoading={isLoading}
            setIsLoading={setIsLoading}
          />
        ) : (
          <CodeStep 
            sentEmail={sentEmail} 
            onReset={() => setSentEmail("")}
            onDebug={onDebug}
            isLoading={isLoading}
            setIsLoading={setIsLoading}
          />
        )}

        <DebugPanel debugInfo={debugInfo} />
      </div>
    </div>
  );
}

function EmailStep({ 
  onSendEmail, 
  onDebug,
  isLoading,
  setIsLoading
}: { 
  onSendEmail: (email: string) => void;
  onDebug: (info: string) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      onDebug(`Sending magic code to: ${email}`);
      
      // Send the magic code
      await db.auth.sendMagicCode({ email });
      
      onDebug(`Magic code sent successfully to ${email}`);
      onSendEmail(email);
    } catch (err: any) {
      const errorMessage = err.body?.message || err.message || "Failed to send magic code";
      setError(errorMessage);
      onDebug(`Error sending magic code: ${errorMessage}`);
      
      // Log full error for debugging
      console.error("Full error object:", err);
      onDebug(`Full error: ${JSON.stringify(err, null, 2)}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Email Address
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="you@example.com"
          required
          disabled={isLoading}
          autoFocus
        />
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? "Sending..." : "Send Magic Code"}
      </button>

      <div className="text-sm text-gray-600">
        <p>• Codes expire after 10 minutes</p>
        <p>• Check your spam folder if you don't see the email</p>
        <p>• You can request a new code if needed</p>
      </div>
    </form>
  );
}

function CodeStep({ 
  sentEmail, 
  onReset,
  onDebug,
  isLoading,
  setIsLoading
}: { 
  sentEmail: string;
  onReset: () => void;
  onDebug: (info: string) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [attempts, setAttempts] = useState(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    setAttempts(prev => prev + 1);

    try {
      onDebug(`Attempting to sign in with code: ${code} (attempt #${attempts + 1})`);
      onDebug(`Email being used: ${sentEmail}`);
      
      // Sign in with the magic code
      await db.auth.signInWithMagicCode({ 
        email: sentEmail, 
        code: code.trim() // Trim whitespace
      });
      
      onDebug("Sign in successful!");
    } catch (err: any) {
      const errorMessage = err.body?.message || err.message || "Failed to verify code";
      setError(errorMessage);
      onDebug(`Error verifying code: ${errorMessage}`);
      
      // Log detailed error info
      console.error("Full error object:", err);
      onDebug(`Full error details: ${JSON.stringify(err, null, 2)}`);
      
      // Common error hints
      if (errorMessage.includes("not found")) {
        onDebug("Hint: Code may have expired or been used already");
      }
      if (errorMessage.includes("invalid")) {
        onDebug("Hint: Check that the code matches exactly (no typos)");
      }
      
      setCode(""); // Clear the code field
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    setError("");
    setIsLoading(true);
    
    try {
      onDebug(`Resending magic code to: ${sentEmail}`);
      await db.auth.sendMagicCode({ email: sentEmail });
      onDebug("New magic code sent successfully");
      setError("");
      setCode("");
      setAttempts(0);
    } catch (err: any) {
      const errorMessage = err.body?.message || err.message || "Failed to resend code";
      setError(errorMessage);
      onDebug(`Error resending code: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm">
          Magic code sent to: <strong>{sentEmail}</strong>
        </p>
        <button
          type="button"
          onClick={onReset}
          className="text-blue-600 hover:underline text-sm mt-1"
        >
          Use a different email
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Enter Your 6-Digit Code
          </label>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-center text-lg font-mono"
            placeholder="123456"
            maxLength={6}
            pattern="[0-9]{6}"
            required
            disabled={isLoading}
            autoFocus
            autoComplete="one-time-code"
          />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">
            <strong>Error:</strong> {error}
            {attempts > 2 && (
              <p className="mt-2">
                Having trouble? Try requesting a new code below.
              </p>
            )}
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading || code.length !== 6}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? "Verifying..." : "Verify Code"}
        </button>
      </form>

      <div className="flex justify-center">
        <button
          type="button"
          onClick={handleResendCode}
          disabled={isLoading}
          className="text-blue-600 hover:underline text-sm disabled:opacity-50"
        >
          Resend Code
        </button>
      </div>

      <div className="text-xs text-gray-500 space-y-1">
        <p>• Codes are valid for 10 minutes</p>
        <p>• Each code can only be used once</p>
        <p>• Attempts made: {attempts}</p>
      </div>
    </div>
  );
}

function DebugPanel({ debugInfo }: { debugInfo: string[] }) {
  if (debugInfo.length === 0) return null;

  return (
    <div className="mt-8 border-t pt-4">
      <details className="text-sm">
        <summary className="cursor-pointer font-medium text-gray-700">
          Debug Information ({debugInfo.length} events)
        </summary>
        <div className="mt-2 bg-gray-50 rounded p-3 max-h-48 overflow-y-auto">
          {debugInfo.map((info, index) => (
            <div key={index} className="text-xs font-mono text-gray-600">
              {info}
            </div>
          ))}
        </div>
      </details>
    </div>
  );
}

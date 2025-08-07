import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { ClaimUsernameModal } from '../ClaimUsernameModal';
import { AuthService } from '@/lib/authService';

// Mock the AuthService
vi.mock('@/lib/authService', () => ({
  AuthService: {
    sendMagicCodeToEmail: vi.fn(),
    verifyMagicCode: vi.fn(),
    claimUsername: vi.fn(),
    getCurrentUser: vi.fn(),
  },
}));

// Mock the instant db
vi.mock('@/lib/instant', () => ({
  db: {
    auth: {
      user: vi.fn(),
    },
  },
}));

const mockProps = {
  username: 'testuser',
  stats: { wins: 5, gamesPlayed: 10 },
  isOpen: true,
  onClose: vi.fn(),
  onSuccess: vi.fn(),
};

describe('ClaimUsernameModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the modal with username and stats', () => {
    render(<ClaimUsernameModal {...mockProps} />);
    
    expect(screen.getByText('🎮 testuser')).toBeInTheDocument();
    expect(screen.getByText('🏆 5 wins')).toBeInTheDocument();
    expect(screen.getByText('🎯 10 games')).toBeInTheDocument();
    expect(screen.getByText('📊 50% win rate')).toBeInTheDocument();
  });

  it('shows email input form initially', () => {
    render(<ClaimUsernameModal {...mockProps} />);
    
    expect(screen.getByLabelText('Email Address')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('your@email.com')).toBeInTheDocument();
    expect(screen.getByText('Send Verification Code')).toBeInTheDocument();
  });

  it('shows helpful tip about future logins', () => {
    render(<ClaimUsernameModal {...mockProps} />);
    
    expect(screen.getByText(/After claiming, you can login with just your username/)).toBeInTheDocument();
  });

  it('validates email before sending magic code', async () => {
    render(<ClaimUsernameModal {...mockProps} />);
    
    const sendButton = screen.getByText('Send Verification Code');
    
    // Button should be disabled when email is empty
    expect(sendButton).toBeDisabled();
    
    // Try clicking anyway - should not proceed
    fireEvent.click(sendButton);
    
    // Should still be on the email step
    expect(screen.getByPlaceholderText('your@email.com')).toBeInTheDocument();
  });

  it('sends magic code when valid email is provided', async () => {
    const mockSendMagicCode = vi.mocked(AuthService.sendMagicCodeToEmail);
    mockSendMagicCode.mockResolvedValue({ success: true });

    render(<ClaimUsernameModal {...mockProps} />);
    
    const emailInput = screen.getByPlaceholderText('your@email.com');
    const sendButton = screen.getByText('Send Verification Code');
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.click(sendButton);
    
    await waitFor(() => {
      expect(mockSendMagicCode).toHaveBeenCalledWith('test@example.com');
    });
  });

  it('shows code input after successfully sending magic code', async () => {
    const mockSendMagicCode = vi.mocked(AuthService.sendMagicCodeToEmail);
    mockSendMagicCode.mockResolvedValue({ success: true });

    render(<ClaimUsernameModal {...mockProps} />);
    
    const emailInput = screen.getByPlaceholderText('your@email.com');
    const sendButton = screen.getByText('Send Verification Code');
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.click(sendButton);
    
    await waitFor(() => {
      expect(screen.getByText('Enter the 6-digit code sent to:')).toBeInTheDocument();
      expect(screen.getByText('test@example.com')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('000000')).toBeInTheDocument();
    });
  });

  it('shows error when magic code sending fails', async () => {
    const mockSendMagicCode = vi.mocked(AuthService.sendMagicCodeToEmail);
    mockSendMagicCode.mockResolvedValue({ 
      success: false, 
      error: 'Failed to send verification code' 
    });

    render(<ClaimUsernameModal {...mockProps} />);
    
    const emailInput = screen.getByPlaceholderText('your@email.com');
    const sendButton = screen.getByText('Send Verification Code');
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.click(sendButton);
    
    await waitFor(() => {
      expect(screen.getByText('Failed to send verification code')).toBeInTheDocument();
    });
  });

  it('validates code length before verification', async () => {
    const mockSendMagicCode = vi.mocked(AuthService.sendMagicCodeToEmail);
    mockSendMagicCode.mockResolvedValue({ success: true });

    render(<ClaimUsernameModal {...mockProps} />);
    
    // First send the magic code
    const emailInput = screen.getByPlaceholderText('your@email.com');
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.click(screen.getByText('Send Verification Code'));
    
    await waitFor(() => {
      expect(screen.getByPlaceholderText('000000')).toBeInTheDocument();
    });
    
    // Try to claim with incomplete code
    const codeInput = screen.getByPlaceholderText('000000');
    const claimButton = screen.getByText('Claim Username');
    
    fireEvent.change(codeInput, { target: { value: '123' } });
    
    // Button should be disabled when code is incomplete
    expect(claimButton).toBeDisabled();
    
    // Try clicking anyway - should not proceed
    fireEvent.click(claimButton);
    
    // Should still be on the code step
    expect(screen.getByPlaceholderText('000000')).toBeInTheDocument();
  });

  it('successfully claims username with valid code', async () => {
    const mockSendMagicCode = vi.mocked(AuthService.sendMagicCodeToEmail);
    const mockVerifyMagicCode = vi.mocked(AuthService.verifyMagicCode);
    const mockClaimUsername = vi.mocked(AuthService.claimUsername);
    
    mockSendMagicCode.mockResolvedValue({ success: true });
    mockVerifyMagicCode.mockResolvedValue({ success: true });
    mockClaimUsername.mockResolvedValue({ success: true });

    // Mock the instant db user
    const { db } = await import('@/lib/instant');
    vi.mocked(db.auth.user).mockReturnValue({ id: 'auth-user-123' } as any);

    render(<ClaimUsernameModal {...mockProps} />);
    
    // Send magic code
    const emailInput = screen.getByPlaceholderText('your@email.com');
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.click(screen.getByText('Send Verification Code'));
    
    await waitFor(() => {
      expect(screen.getByPlaceholderText('000000')).toBeInTheDocument();
    });
    
    // Enter code and claim
    const codeInput = screen.getByPlaceholderText('000000');
    fireEvent.change(codeInput, { target: { value: '123456' } });
    fireEvent.click(screen.getByText('Claim Username'));
    
    await waitFor(() => {
      expect(mockVerifyMagicCode).toHaveBeenCalledWith('test@example.com', '123456');
      expect(mockClaimUsername).toHaveBeenCalledWith('testuser', 'auth-user-123', 'test@example.com');
      expect(mockProps.onSuccess).toHaveBeenCalled();
      expect(mockProps.onClose).toHaveBeenCalled();
    });
  });

  it('shows error when code verification fails', async () => {
    const mockSendMagicCode = vi.mocked(AuthService.sendMagicCodeToEmail);
    const mockVerifyMagicCode = vi.mocked(AuthService.verifyMagicCode);
    
    mockSendMagicCode.mockResolvedValue({ success: true });
    mockVerifyMagicCode.mockResolvedValue({ 
      success: false, 
      error: 'Invalid verification code' 
    });

    render(<ClaimUsernameModal {...mockProps} />);
    
    // Send magic code
    const emailInput = screen.getByPlaceholderText('your@email.com');
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.click(screen.getByText('Send Verification Code'));
    
    await waitFor(() => {
      expect(screen.getByPlaceholderText('000000')).toBeInTheDocument();
    });
    
    // Enter invalid code
    const codeInput = screen.getByPlaceholderText('000000');
    fireEvent.change(codeInput, { target: { value: '123456' } });
    fireEvent.click(screen.getByText('Claim Username'));
    
    await waitFor(() => {
      expect(screen.getByText('Invalid verification code')).toBeInTheDocument();
    });
  });

  it('shows error when username claiming fails', async () => {
    const mockSendMagicCode = vi.mocked(AuthService.sendMagicCodeToEmail);
    const mockVerifyMagicCode = vi.mocked(AuthService.verifyMagicCode);
    const mockClaimUsername = vi.mocked(AuthService.claimUsername);
    
    mockSendMagicCode.mockResolvedValue({ success: true });
    mockVerifyMagicCode.mockResolvedValue({ success: true });
    mockClaimUsername.mockResolvedValue({ 
      success: false, 
      error: 'Username is not available' 
    });

    // Mock the instant db user
    const { db } = await import('@/lib/instant');
    vi.mocked(db.auth.user).mockReturnValue({ id: 'auth-user-123' } as any);

    render(<ClaimUsernameModal {...mockProps} />);
    
    // Send magic code
    const emailInput = screen.getByPlaceholderText('your@email.com');
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.click(screen.getByText('Send Verification Code'));
    
    await waitFor(() => {
      expect(screen.getByPlaceholderText('000000')).toBeInTheDocument();
    });
    
    // Enter code and try to claim
    const codeInput = screen.getByPlaceholderText('000000');
    fireEvent.change(codeInput, { target: { value: '123456' } });
    fireEvent.click(screen.getByText('Claim Username'));
    
    await waitFor(() => {
      expect(screen.getByText('Username is not available')).toBeInTheDocument();
    });
  });

  it('allows user to reset flow and use different email', async () => {
    const mockSendMagicCode = vi.mocked(AuthService.sendMagicCodeToEmail);
    mockSendMagicCode.mockResolvedValue({ success: true });

    render(<ClaimUsernameModal {...mockProps} />);
    
    // Send magic code
    const emailInput = screen.getByPlaceholderText('your@email.com');
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.click(screen.getByText('Send Verification Code'));
    
    await waitFor(() => {
      expect(screen.getByText('Use different email')).toBeInTheDocument();
    });
    
    // Reset flow
    fireEvent.click(screen.getByText('Use different email'));
    
    expect(screen.getByPlaceholderText('your@email.com')).toBeInTheDocument();
    expect(screen.getByText('Send Verification Code')).toBeInTheDocument();
  });

  it('shows helpful message about checking spam folder', async () => {
    const mockSendMagicCode = vi.mocked(AuthService.sendMagicCodeToEmail);
    mockSendMagicCode.mockResolvedValue({ success: true });

    render(<ClaimUsernameModal {...mockProps} />);
    
    // Send magic code
    const emailInput = screen.getByPlaceholderText('your@email.com');
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.click(screen.getByText('Send Verification Code'));
    
    await waitFor(() => {
      expect(screen.getByText(/Check your spam folder/)).toBeInTheDocument();
    });
  });

  it('shows request new code option when code expires', async () => {
    const mockSendMagicCode = vi.mocked(AuthService.sendMagicCodeToEmail);
    const mockVerifyMagicCode = vi.mocked(AuthService.verifyMagicCode);
    
    mockSendMagicCode.mockResolvedValue({ success: true });
    mockVerifyMagicCode.mockResolvedValue({ 
      success: false, 
      error: 'Verification code expired. Please request a new one.' 
    });

    render(<ClaimUsernameModal {...mockProps} />);
    
    // Send magic code
    const emailInput = screen.getByPlaceholderText('your@email.com');
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.click(screen.getByText('Send Verification Code'));
    
    await waitFor(() => {
      expect(screen.getByPlaceholderText('000000')).toBeInTheDocument();
    });
    
    // Enter expired code
    const codeInput = screen.getByPlaceholderText('000000');
    fireEvent.change(codeInput, { target: { value: '123456' } });
    fireEvent.click(screen.getByText('Claim Username'));
    
    await waitFor(() => {
      expect(screen.getByText(/expired/)).toBeInTheDocument();
      expect(screen.getByText('Request a new code')).toBeInTheDocument();
    });
  });

  it('resets all state when modal is closed', () => {
    const mockOnClose = vi.fn();
    const { rerender } = render(<ClaimUsernameModal {...mockProps} onClose={mockOnClose} />);
    
    // Enter some data
    const emailInput = screen.getByPlaceholderText('your@email.com');
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    
    // Simulate closing the modal by clicking the close button
    const closeButton = screen.getByLabelText('Close');
    fireEvent.click(closeButton);
    
    // Verify onClose was called
    expect(mockOnClose).toHaveBeenCalled();
    
    // Reopen modal with fresh props
    rerender(<ClaimUsernameModal {...mockProps} onClose={mockOnClose} isOpen={true} />);
    
    // Should be reset
    expect(screen.getByPlaceholderText('your@email.com')).toHaveValue('');
  });
});
import { Link } from 'react-router-dom';
import { IconLock, IconLockOpen, IconLoader } from '@tabler/icons-react';
import Button from './Button';
import Card from './Card';
import Input from './Input';

interface PasswordPromptStateProps {
  title?: string;
  subtitle?: string;
  eventTitle?: string;
  password: string;
  onPasswordChange: (value: string) => void;
  error?: string;
  onSubmit: () => void;
  isLoading?: boolean;
}

/**
 * Reusable password prompt component for password-protected events
 * Used across multiple pages (Voting, Results, Venue, Event Summary)
 */
export default function PasswordPromptState({
  title = 'Password Protected Event',
  subtitle = 'This event requires a password',
  eventTitle,
  password,
  onPasswordChange,
  error,
  onSubmit,
  isLoading = false
}: PasswordPromptStateProps) {
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading) {
      onSubmit();
    }
  };

  return (
      <div className="min-h-screen p-4 md:p-8 flex items-center justify-center bg-gradient-to-b from-ocean-50 to-ocean-100">
        <div className="max-w-md mx-auto">
          <Card>
            <div className="text-center mb-6">
              <div className="flex justify-center mb-4">
                <IconLock size={64} className="text-ocean-600" />
              </div>
              <h1 className="text-2xl font-bold text-ocean-700 mb-2">
                {title}
              </h1>
              <p className="text-ocean-600">{subtitle}</p>
              {eventTitle && (
                <p className="text-sm text-ocean-500 mt-2 italic">
                  Event: {eventTitle}
                </p>
              )}
            </div>

            <div className="space-y-4">
              <Input
                label="Password"
                type="password"
                placeholder="Enter event password"
                value={password}
                onChange={(e) => onPasswordChange(e.target.value)}
                onKeyPress={handleKeyPress}
                fullWidth
                autoFocus
              />

              {error && (
                <div className="p-3 bg-red-50 border-2 border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}

              <Button
                onClick={onSubmit}
                variant="primary"
                size="lg"
                fullWidth
                disabled={isLoading || !password.trim()}
              >
                {isLoading ? (
                  <><IconLoader size={18} className="inline mr-1 animate-spin" /> Unlocking...</>
                ) : (
                  <><IconLockOpen size={18} className="inline mr-1" /> Unlock Event</>
                )}
              </Button>

              <div className="text-center pt-4">
                <Link
                  to="/"
                  className="text-sm text-ocean-600 hover:text-ocean-700 underline"
                >
                  ← Back to Home
                </Link>
              </div>
            </div>
          </Card>
        </div>
      </div>
  );
}

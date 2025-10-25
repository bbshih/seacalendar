import { useState, useEffect } from 'react';
import Card from './Card';
import Input from './Input';
import Button from './Button';
import Modal from './Modal';
import {
  getGitHubToken,
  saveGitHubToken,
  clearGitHubToken,
  validateGitHubToken,
} from '../../utils/githubStorage';

export interface GitHubTokenSetupProps {
  onTokenReady: (token: string) => void;
  requireToken?: boolean;
}

export default function GitHubTokenSetup({
  onTokenReady,
  requireToken = true,
}: GitHubTokenSetupProps) {
  const [token, setToken] = useState('');
  const [hasToken, setHasToken] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState('');
  const [showInfo, setShowInfo] = useState(false);

  useEffect(() => {
    // Check for token in localStorage first
    const savedToken = getGitHubToken();
    if (savedToken) {
      setHasToken(true);
      onTokenReady(savedToken);
      return;
    }

    // Check for token in environment variables
    const envToken = import.meta.env.VITE_GITHUB_TOKEN;
    if (envToken) {
      saveGitHubToken(envToken);
      setHasToken(true);
      onTokenReady(envToken);
    }
  }, [onTokenReady]);

  const handleSaveToken = async () => {
    if (!token.trim()) {
      setError('Please enter a token');
      return;
    }

    setIsValidating(true);
    setError('');

    try {
      const isValid = await validateGitHubToken(token.trim());
      if (!isValid) {
        setError('Invalid token - please check and try again');
        setIsValidating(false);
        return;
      }

      saveGitHubToken(token.trim());
      setHasToken(true);
      onTokenReady(token.trim());
      setToken('');
    } catch (err) {
      setError('Failed to validate token - please try again');
    } finally {
      setIsValidating(false);
    }
  };

  const handleClearToken = () => {
    clearGitHubToken();
    setHasToken(false);
    setToken('');
  };

  if (hasToken && !requireToken) {
    return null;
  }

  if (hasToken) {
    return (
      <Card className="bg-seaweed-50 border-seaweed-500" hover3d={false}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <svg
              className="w-6 h-6 text-seaweed-600"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
            </svg>
            <div>
              <p className="font-medium text-seaweed-800">GitHub Connected</p>
              <p className="text-sm text-seaweed-600">
                Token saved - you won't need to enter it again
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={handleClearToken}>
            Disconnect
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <>
      <Card className="bg-ocean-50 border-ocean-400" hover3d={false}>
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <svg
              className="w-6 h-6 text-ocean-600 flex-shrink-0 mt-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div className="flex-1">
              <h3 className="font-semibold text-ocean-800 mb-1">
                GitHub Token Required
              </h3>
              <p className="text-sm text-ocean-700 mb-3">
                SeaCalendar uses private encrypted GitHub Gists to store votes
                securely. You'll need a GitHub Personal Access Token to create and
                manage events.
              </p>
              <button
                onClick={() => setShowInfo(true)}
                className="text-sm text-ocean-600 hover:text-ocean-800 underline"
              >
                How do I get a token?
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <Input
              label="GitHub Personal Access Token"
              type="password"
              placeholder="ghp_xxxxxxxxxxxx"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              error={error}
              helperText="Saved in your browser - you only need to enter this once"
              fullWidth
            />

            <Button
              onClick={handleSaveToken}
              disabled={isValidating}
              variant="primary"
              fullWidth
            >
              {isValidating ? 'Validating...' : 'Save Token'}
            </Button>
          </div>
        </div>
      </Card>

      {/* Info Modal */}
      <Modal
        isOpen={showInfo}
        onClose={() => setShowInfo(false)}
        title="How to Create a GitHub Token"
        size="md"
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-semibold text-ocean-700">Step 1: Go to GitHub</h4>
            <p className="text-sm text-gray-600">
              Visit{' '}
              <a
                href="https://github.com/settings/tokens/new"
                target="_blank"
                rel="noopener noreferrer"
                className="text-ocean-600 hover:underline"
              >
                github.com/settings/tokens/new
              </a>
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold text-ocean-700">Step 2: Configure Token</h4>
            <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
              <li>Note: "SeaCalendar App"</li>
              <li>Expiration: Choose your preferred duration (90 days recommended)</li>
              <li>
                <strong>Scopes:</strong> Check only <code className="bg-gray-100 px-1 rounded">gist</code>
              </li>
            </ul>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold text-ocean-700">Step 3: Generate & Copy</h4>
            <p className="text-sm text-gray-600">
              Click "Generate token" at the bottom, then copy the token (starts with ghp_)
            </p>
          </div>

          <div className="bg-sand-100 p-4 rounded-lg">
            <p className="text-sm text-gray-700">
              <strong>Privacy Note:</strong> Your token is saved in your browser's
              local storage (persists across sessions) and is used exclusively to communicate
              with GitHub's API. It's never sent to any third-party servers. You can disconnect
              anytime to remove it.
            </p>
          </div>
        </div>
      </Modal>
    </>
  );
}

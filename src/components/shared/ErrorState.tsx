import Button from './Button';
import Card from './Card';
import AnimatedBackground from './AnimatedBackground';

interface ErrorStateProps {
  title?: string;
  error: string;
  onRetry?: () => void;
  onGoHome?: () => void;
}

/**
 * Reusable error state component with optional retry and home actions
 * Used across multiple pages to show error states
 */
export default function ErrorState({
  title = 'Oops! Something went wrong',
  error,
  onRetry,
  onGoHome
}: ErrorStateProps) {
  const handleGoHome = () => {
    if (onGoHome) {
      onGoHome();
    } else {
      window.location.hash = '/';
    }
  };

  return (
    <AnimatedBackground variant="bubbles">
      <div className="min-h-screen p-4 md:p-8 flex items-center justify-center">
        <div className="max-w-md mx-auto">
          <Card>
            <div className="text-center">
              <div className="text-6xl mb-4">🌊</div>
              <h1 className="text-2xl font-bold text-ocean-700 mb-4">
                {title}
              </h1>
              <p className="text-red-600 mb-6">{error}</p>
              <div className="flex gap-3 justify-center">
                {onRetry && (
                  <Button onClick={onRetry} variant="secondary" size="md">
                    🔄 Try Again
                  </Button>
                )}
                <Button onClick={handleGoHome} variant="primary" size="md">
                  🏠 Go Home
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </AnimatedBackground>
  );
}

import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Card from '../shared/Card';

export default function AuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { loadUser } = useAuth();

  useEffect(() => {
    const processCallback = async () => {
      const token = searchParams.get('token');
      const refreshToken = searchParams.get('refreshToken');
      const state = searchParams.get('state');

      if (token && refreshToken) {
        // Store tokens
        localStorage.setItem('accessToken', token);
        localStorage.setItem('refreshToken', refreshToken);

        // Load user into AuthContext
        await loadUser();

        // Redirect to original destination or home
        const redirectTo = state || '/';
        navigate(redirectTo, { replace: true });
      } else {
        // Auth failed
        navigate('/login', { replace: true });
      }
    };

    processCallback();
  }, [searchParams, navigate, loadUser]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-sand-50 to-ocean-50 p-4 flex items-center justify-center">
      <Card className="max-w-md w-full text-center">
        <p className="text-gray-600">Completing sign in...</p>
      </Card>
    </div>
  );
}

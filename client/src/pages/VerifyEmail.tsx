import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

export default function VerifyEmail() {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  const verifyEmailMutation = trpc.auth.verifyEmail.useMutation({
    onSuccess: () => {
      setStatus('success');
      // Redirect to home after 3 seconds
      setTimeout(() => {
        setLocation('/');
      }, 3000);
    },
    onError: (error) => {
      setStatus('error');
      setErrorMessage(error.message);
    },
  });

  useEffect(() => {
    // Get token from URL query parameters
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');

    if (!token) {
      setStatus('error');
      setErrorMessage('No verification token provided');
      return;
    }

    // Verify the token
    verifyEmailMutation.mutate({ token });
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        {status === 'loading' && (
          <>
            <Loader2 className="h-16 w-16 mx-auto text-green-600 animate-spin mb-4" />
            <h1 className="text-2xl font-bold mb-2">{t('Verifying Email...')}</h1>
            <p className="text-gray-600">{t('Please wait while we verify your email address.')}</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle className="h-16 w-16 mx-auto text-green-600 mb-4" />
            <h1 className="text-2xl font-bold mb-2 text-green-600">{t('emailVerified')}</h1>
            <p className="text-gray-600 mb-4">{t('Your email has been successfully verified. You can now update your profile and receive notifications.')}</p>
            <p className="text-sm text-gray-500">{t('Redirecting to homepage...')}</p>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle className="h-16 w-16 mx-auto text-red-600 mb-4" />
            <h1 className="text-2xl font-bold mb-2 text-red-600">{t('verificationFailed')}</h1>
            <p className="text-gray-600 mb-4">{errorMessage || t('The verification link is invalid or has expired.')}</p>
            <Button onClick={() => setLocation('/')} className="mt-4">
              {t('Return to Homepage')}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

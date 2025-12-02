import { useState, useEffect } from 'react';
import { X, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { promptInstall, isPWA } from '@/registerSW';
import { useTranslation } from 'react-i18next';

/**
 * PWA Install Banner Component
 * Shows a banner prompting users to install the app
 * Only shows on mobile devices when PWA is not already installed
 */
export function PWAInstallBanner() {
  const { t } = useTranslation();
  const [showBanner, setShowBanner] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  useEffect(() => {
    // Don't show if already installed as PWA
    if (isPWA()) {
      return;
    }

    // Listen for install prompt availability
    const handleInstallAvailable = () => {
      // Check if user has dismissed the banner before
      const dismissed = localStorage.getItem('pwa-install-dismissed');
      if (!dismissed) {
        setShowBanner(true);
      }
    };

    const handleInstallCompleted = () => {
      setShowBanner(false);
      localStorage.removeItem('pwa-install-dismissed');
    };

    window.addEventListener('pwa-install-available', handleInstallAvailable);
    window.addEventListener('pwa-install-completed', handleInstallCompleted);

    return () => {
      window.removeEventListener('pwa-install-available', handleInstallAvailable);
      window.removeEventListener('pwa-install-completed', handleInstallCompleted);
    };
  }, []);

  const handleInstall = async () => {
    setIsInstalling(true);
    const accepted = await promptInstall();
    setIsInstalling(false);

    if (accepted) {
      setShowBanner(false);
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    // Remember dismissal for 7 days
    const dismissedUntil = Date.now() + 7 * 24 * 60 * 60 * 1000;
    localStorage.setItem('pwa-install-dismissed', dismissedUntil.toString());
  };

  if (!showBanner) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-r from-green-600 to-green-700 text-white shadow-lg animate-in slide-in-from-bottom duration-300">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1">
            <div className="hidden sm:flex items-center justify-center w-12 h-12 bg-white/20 rounded-lg">
              <Download className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-sm sm:text-base">
                {t('Install BOB Home Care App')}
              </h3>
              <p className="text-xs sm:text-sm text-white/90">
                {t('Get quick access and work offline')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={handleInstall}
              disabled={isInstalling}
              size="sm"
              className="bg-white text-green-700 hover:bg-white/90"
            >
              {isInstalling ? t('Installing...') : t('Install')}
            </Button>
            <Button
              onClick={handleDismiss}
              size="sm"
              variant="ghost"
              className="text-white hover:bg-white/20"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

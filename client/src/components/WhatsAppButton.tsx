import { Button } from "@/components/ui/button";
import { MessageCircle, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useState } from "react";

export function WhatsAppButton({ variant = "default", size = "default", className = "" }: { 
  variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}) {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  
  const handleWhatsAppClick = () => {
    setIsLoading(true);
    
    // BOB Home Care WhatsApp number
    const phoneNumber = "201273518887"; // +201273518887
    const message = encodeURIComponent("Hello! I would like to book a cleaning service.");
    window.open(`https://wa.me/${phoneNumber}?text=${message}`, '_blank');
    
    // Reset loading state after delay
    setTimeout(() => setIsLoading(false), 1500);
  };

  return (
    <Button 
      variant={variant}
      size={size}
      onClick={handleWhatsAppClick}
      disabled={isLoading}
      className={`gap-2 ${className}`}
    >
      {isLoading ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : (
        <MessageCircle className="h-5 w-5" />
      )}
      {t('bookViaWhatsApp')}
    </Button>
  );
}

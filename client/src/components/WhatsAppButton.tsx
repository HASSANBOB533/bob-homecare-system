import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";
import { useTranslation } from "react-i18next";

export function WhatsAppButton({ variant = "default", size = "default", className = "" }: { 
  variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}) {
  const { t } = useTranslation();
  
  const handleWhatsAppClick = () => {
    // BOB Home Care WhatsApp number
    const phoneNumber = "201273518887"; // +201273518887
    const message = encodeURIComponent("Hello! I would like to book a cleaning service.");
    window.open(`https://wa.me/${phoneNumber}?text=${message}`, '_blank');
  };

  return (
    <Button 
      variant={variant}
      size={size}
      onClick={handleWhatsAppClick}
      className={`gap-2 ${className}`}
    >
      <MessageCircle className="h-5 w-5" />
      {t('bookViaWhatsApp')}
    </Button>
  );
}

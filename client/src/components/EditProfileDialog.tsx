import { useState } from "react";
import { useTranslation } from "react-i18next";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";


interface EditProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: {
    name: string | null;
    email: string | null;
    emailVerified?: Date | null;
    phone?: string | null;
  };
}

export function EditProfileDialog({ open, onOpenChange, user }: EditProfileDialogProps) {
  const { t } = useTranslation();
  const utils = trpc.useUtils();
  const [verificationSent, setVerificationSent] = useState(false);
  
  const [formData, setFormData] = useState({
    name: user.name || "",
    email: user.email || "",
    phone: user.phone || "",
  });

  const updateProfileMutation = trpc.auth.updateProfile.useMutation({
    onSuccess: () => {
      alert(t("profileUpdated"));
      utils.auth.me.invalidate();
      onOpenChange(false);
    },
    onError: (error) => {
      alert(t("profileUpdateFailed") + ": " + error.message);
    },
  });

  const sendVerificationMutation = trpc.auth.sendVerificationEmail.useMutation({
    onSuccess: (data) => {
      setVerificationSent(true);
      // In development, show the token for testing
      if (data.token) {
        alert(t("verificationEmailSent") + "\n\nDev Token: " + data.token);
      } else {
        alert(t("verificationEmailSent"));
      }
    },
    onError: (error) => {
      alert(t("verificationFailed") + ": " + error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate({
      name: formData.name || undefined,
      email: formData.email || undefined,
      phone: formData.phone || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t("editProfile")}</DialogTitle>
          <DialogDescription>
            {t("Fill in the form below to book your cleaning service")}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          {/* Email Verification Banner */}
          {user.email && !user.emailVerified && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-2">
              <div className="flex items-start gap-2">
                <div className="flex-1">
                  <p className="text-sm font-medium text-yellow-800">{t("emailNotVerified")}</p>
                  <p className="text-xs text-yellow-700 mt-1">{t("verifyEmailMessage")}</p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => sendVerificationMutation.mutate()}
                  disabled={sendVerificationMutation.isPending || verificationSent}
                  className="text-xs"
                >
                  {verificationSent ? t("verificationEmailSent") : t("sendVerificationEmail")}
                </Button>
              </div>
            </div>
          )}
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">{t("Full Name")}</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder={t("Enter your full name")}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">{t("Email")}</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@example.com"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone">{t("Phone Number")}</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+20 123 456 7890"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={updateProfileMutation.isPending}
            >
              {t("cancel")}
            </Button>
            <Button type="submit" disabled={updateProfileMutation.isPending}>
              {updateProfileMutation.isPending ? t("saving") : t("updateProfile")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

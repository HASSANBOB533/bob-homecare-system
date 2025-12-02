import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Copy, Share2, Mail, CheckCircle2, Clock, Gift, Users, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Link, useLocation } from "wouter";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export default function Referrals() {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      window.location.href = getLoginUrl();
    }
  }, [authLoading, isAuthenticated]);

  // Fetch referral data
  const { data: codeData, isLoading: codeLoading } = trpc.referrals.getMyCode.useQuery();
  const { data: stats, isLoading: statsLoading } = trpc.referrals.getStats.useQuery();
  const { data: history, isLoading: historyLoading } = trpc.referrals.getHistory.useQuery();

  const referralCode = codeData?.referralCode || "";
  const referralLink = `${window.location.origin}/book?ref=${referralCode}`;

  // Copy code to clipboard
  const handleCopy = () => {
    navigator.clipboard.writeText(referralCode);
    setCopied(true);
    toast.success(t("referrals.codeCopied"));
    setTimeout(() => setCopied(false), 2000);
  };

  // Copy link to clipboard
  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink);
    toast.success(t("referrals.linkCopied"));
  };

  // Share via WhatsApp
  const handleWhatsAppShare = () => {
    const message = t("referrals.whatsappMessage", { code: referralCode, link: referralLink });
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");
  };

  // Share via Email
  const handleEmailShare = () => {
    const subject = t("referrals.emailSubject");
    const body = t("referrals.emailBody", { code: referralCode, link: referralLink });
    const mailtoUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoUrl;
  };

  if (authLoading || codeLoading || statsLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-32 bg-muted rounded"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="h-24 bg-muted rounded"></div>
            <div className="h-24 bg-muted rounded"></div>
            <div className="h-24 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-white sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/">
              <a className="flex items-center gap-2">
                <span className="text-2xl">🏠</span>
                <span className="text-xl font-bold text-green-700">BOB Home Care</span>
              </a>
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            {user && (
              <span className="text-sm text-muted-foreground">{user.name}</span>
            )}
          </div>
        </div>
      </header>

      <div className="container mx-auto py-8">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate("/dashboard")}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t("common.back")}
        </Button>
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{t("referrals.title")}</h1>
          <p className="text-muted-foreground">{t("referrals.description")}</p>
        </div>

        {/* Referral Code Card */}
        <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="w-5 h-5" />
            {t("referrals.yourCode")}
          </CardTitle>
          <CardDescription>{t("referrals.codeDescription")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Code Display */}
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-muted p-4 rounded-lg text-center">
              <span className="text-3xl font-bold tracking-wider">{referralCode}</span>
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={handleCopy}
              className="shrink-0"
            >
              {copied ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>

          {/* Link Display */}
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-muted p-3 rounded-lg text-sm overflow-hidden">
              <span className="text-muted-foreground truncate block">{referralLink}</span>
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={handleCopyLink}
              className="shrink-0"
            >
              <Copy className="w-4 h-4" />
            </Button>
          </div>

          {/* Share Buttons */}
          <div className="flex gap-2">
            <Button
              variant="default"
              className="flex-1 bg-green-600 hover:bg-green-700"
              onClick={handleWhatsAppShare}
            >
              <Share2 className="w-4 h-4 mr-2" />
              {t("referrals.shareWhatsApp")}
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleEmailShare}
            >
              <Mail className="w-4 h-4 mr-2" />
              {t("referrals.shareEmail")}
            </Button>
          </div>
        </CardContent>
        </Card>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("referrals.totalSent")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              <span className="text-2xl font-bold">{stats?.totalSent || 0}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("referrals.pending")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-yellow-600" />
              <span className="text-2xl font-bold">{stats?.pending || 0}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("referrals.completed")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <span className="text-2xl font-bold">{stats?.completed || 0}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("referrals.totalRewards")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Gift className="w-5 h-5 text-purple-600" />
              <span className="text-2xl font-bold">
                {((stats?.totalRewards || 0) / 100).toFixed(0)} {t("common.currency")}
              </span>
            </div>
          </CardContent>
        </Card>
        </div>

        {/* Referral History */}
        <Card>
        <CardHeader>
          <CardTitle>{t("referrals.history")}</CardTitle>
          <CardDescription>{t("referrals.historyDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          {historyLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              {t("common.loading")}
            </div>
          ) : !history || history.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {t("referrals.noHistory")}
            </div>
          ) : (
            <div className="space-y-4">
              {history.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{item.referralCode}</span>
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          item.status === "completed"
                            ? "bg-green-100 text-green-700"
                            : item.status === "pending" && item.referredUser
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {t(`referrals.status.${item.status}`)}
                      </span>
                    </div>
                    {item.referredUser && (
                      <p className="text-sm text-muted-foreground">
                        {t("referrals.referredUser")}: {item.referredUser.name}
                      </p>
                    )}
                    {item.booking && (
                      <p className="text-sm text-muted-foreground">
                        {t("referrals.bookingDate")}: {new Date(item.booking.dateTime).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    {item.rewardAmount && (
                      <p className="text-lg font-bold text-green-600">
                        +{(item.rewardAmount / 100).toFixed(0)} {t("common.currency")}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
        </Card>
      </div>
    </div>
  );
}

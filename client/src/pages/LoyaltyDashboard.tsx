import { useState } from "react";
import { useTranslation } from "react-i18next";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Award, Gift, History, Star, TrendingUp } from "lucide-react";


export default function LoyaltyDashboard() {
  const { t, i18n } = useTranslation();

  const [selectedReward, setSelectedReward] = useState<any>(null);
  const [redeemDialogOpen, setRedeemDialogOpen] = useState(false);

  const { data: points, refetch: refetchPoints } = trpc.loyalty.getPoints.useQuery();
  const { data: transactions } = trpc.loyalty.getTransactions.useQuery();
  const { data: rewards } = trpc.loyalty.getRewards.useQuery();
  const { data: redemptions } = trpc.loyalty.getRedemptions.useQuery();

  const redeemMutation = trpc.loyalty.redeemReward.useMutation({
    onSuccess: () => {
      alert(t("loyalty.redeemSuccess"));
      setRedeemDialogOpen(false);
      refetchPoints();
    },
    onError: (error) => {
      alert(`${t("loyalty.redeemError")}: ${error.message}`);
    },
  });

  const handleRedeemClick = (reward: any) => {
    setSelectedReward(reward);
    setRedeemDialogOpen(true);
  };

  const handleConfirmRedeem = () => {
    if (selectedReward) {
      redeemMutation.mutate({ rewardId: selectedReward.id });
    }
  };

  const getDiscountText = (reward: any) => {
    if (reward.discountType === "percentage") {
      return `${reward.discountValue}% ${t("loyalty.discount")}`;
    } else if (reward.discountType === "fixed") {
      return `${reward.discountValue} ${t("loyalty.fixedDiscount")}`;
    } else {
      return t("loyalty.freeService");
    }
  };

  const isRTL = i18n.language === "ar";

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{t("loyalty.title")}</h1>
        <p className="text-muted-foreground">{t("loyalty.description")}</p>
      </div>

      {/* Points Balance Card */}
      <Card className="mb-8 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 border-green-200 dark:border-green-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-6 w-6 text-green-600" />
            {t("loyalty.yourPoints")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-5xl font-bold text-green-600 mb-2">{points || 0}</div>
          <p className="text-sm text-muted-foreground">{t("loyalty.pointsBalance")}</p>
        </CardContent>
      </Card>

      <Tabs defaultValue="rewards" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="rewards">
            <Gift className={`h-4 w-4 ${isRTL ? "ml-2" : "mr-2"}`} />
            {t("loyalty.rewards")}
          </TabsTrigger>
          <TabsTrigger value="history">
            <History className={`h-4 w-4 ${isRTL ? "ml-2" : "mr-2"}`} />
            {t("loyalty.history")}
          </TabsTrigger>
          <TabsTrigger value="redemptions">
            <TrendingUp className={`h-4 w-4 ${isRTL ? "ml-2" : "mr-2"}`} />
            {t("loyalty.redemptions")}
          </TabsTrigger>
        </TabsList>

        {/* Rewards Tab */}
        <TabsContent value="rewards" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {rewards?.map((reward) => (
              <Card key={reward.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="text-lg">
                    {isRTL ? reward.name : reward.nameEn}
                  </CardTitle>
                  <CardDescription>
                    {isRTL ? reward.description : reward.descriptionEn}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">{t("loyalty.cost")}</span>
                      <Badge variant="secondary" className="text-lg">
                        <Star className={`h-4 w-4 ${isRTL ? "ml-1" : "mr-1"}`} />
                        {reward.pointsCost}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">{t("loyalty.discount")}</span>
                      <span className="font-semibold text-green-600">
                        {getDiscountText(reward)}
                      </span>
                    </div>
                    {reward.serviceName && (
                      <div className="text-sm text-muted-foreground">
                        {t("loyalty.applicableTo")}: {isRTL ? reward.serviceName : reward.serviceNameEn}
                      </div>
                    )}
                    <Button
                      className="w-full"
                      onClick={() => handleRedeemClick(reward)}
                      disabled={(points || 0) < reward.pointsCost}
                    >
                      {(points || 0) < reward.pointsCost
                        ? t("loyalty.insufficientPoints")
                        : t("loyalty.redeem")}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          {(!rewards || rewards.length === 0) && (
            <div className="text-center py-12 text-muted-foreground">
              {t("loyalty.noRewards")}
            </div>
          )}
        </TabsContent>

        {/* Transaction History Tab */}
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t("loyalty.transactionHistory")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {transactions?.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between py-3 border-b last:border-0"
                  >
                    <div>
                      <p className="font-medium">{transaction.description}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(transaction.createdAt).toLocaleDateString(isRTL ? "ar-EG" : "en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                    <Badge
                      variant={transaction.points > 0 ? "default" : "secondary"}
                      className={transaction.points > 0 ? "bg-green-600" : ""}
                    >
                      {transaction.points > 0 ? "+" : ""}
                      {transaction.points}
                    </Badge>
                  </div>
                ))}
                {(!transactions || transactions.length === 0) && (
                  <div className="text-center py-8 text-muted-foreground">
                    {t("loyalty.noTransactions")}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Redemptions Tab */}
        <TabsContent value="redemptions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t("loyalty.redemptionHistory")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {redemptions?.map((redemption) => (
                  <div
                    key={redemption.id}
                    className="flex items-center justify-between py-3 border-b last:border-0"
                  >
                    <div>
                      <p className="font-medium">
                        {isRTL ? redemption.rewardName : redemption.rewardNameEn}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(redemption.createdAt).toLocaleDateString(isRTL ? "ar-EG" : "en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline">{t(`loyalty.status.${redemption.status}`)}</Badge>
                      <p className="text-sm text-muted-foreground mt-1">
                        -{redemption.pointsSpent} {t("loyalty.points")}
                      </p>
                    </div>
                  </div>
                ))}
                {(!redemptions || redemptions.length === 0) && (
                  <div className="text-center py-8 text-muted-foreground">
                    {t("loyalty.noRedemptions")}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Redeem Confirmation Dialog */}
      <Dialog open={redeemDialogOpen} onOpenChange={setRedeemDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("loyalty.confirmRedeem")}</DialogTitle>
            <DialogDescription>
              {t("loyalty.confirmRedeemDesc")}
            </DialogDescription>
          </DialogHeader>
          {selectedReward && (
            <div className="space-y-4 py-4">
              <div className="flex items-center justify-between">
                <span className="font-medium">{t("loyalty.reward")}:</span>
                <span>{isRTL ? selectedReward.name : selectedReward.nameEn}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium">{t("loyalty.cost")}:</span>
                <Badge variant="secondary">
                  <Star className={`h-4 w-4 ${isRTL ? "ml-1" : "mr-1"}`} />
                  {selectedReward.pointsCost}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium">{t("loyalty.yourPoints")}:</span>
                <span>{points || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium">{t("loyalty.afterRedeem")}:</span>
                <span className="font-bold text-green-600">
                  {(points || 0) - selectedReward.pointsCost}
                </span>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setRedeemDialogOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button onClick={handleConfirmRedeem} disabled={redeemMutation.isPending}>
              {redeemMutation.isPending ? t("common.loading") : t("loyalty.confirmButton")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

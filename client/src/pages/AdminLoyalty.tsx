import { useState } from "react";
import { useTranslation } from "react-i18next";
import { trpc } from "@/lib/trpc";
import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Award, Gift, Users, Plus, Edit, Trash2, TrendingUp, TrendingDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function AdminLoyalty() {
  const { t, i18n } = useTranslation();
  const [rewardDialogOpen, setRewardDialogOpen] = useState(false);
  const [editingReward, setEditingReward] = useState<any>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [adjustPointsDialog, setAdjustPointsDialog] = useState<{ userId: number; userName: string } | null>(null);

  const { data: rewards = [], refetch: refetchRewards } = trpc.loyalty.getAllRewards.useQuery();
  const { data: users = [], refetch: refetchUsers } = trpc.loyalty.getAllUsersWithPoints.useQuery();
  const { data: services = [] } = trpc.services.list.useQuery();

  const [rewardForm, setRewardForm] = useState({
    name: "",
    nameEn: "",
    description: "",
    descriptionEn: "",
    pointsCost: "",
    discountType: "percentage" as "percentage" | "fixed" | "free_service",
    discountValue: "",
    serviceId: "",
  });

  const [adjustForm, setAdjustForm] = useState({
    points: "",
    description: "",
  });

  const createRewardMutation = trpc.loyalty.createReward.useMutation({
    onSuccess: () => {
      alert(t("Reward created successfully!"));
      setRewardDialogOpen(false);
      resetRewardForm();
      refetchRewards();
    },
    onError: (error) => {
      alert(`Error: ${error.message}`);
    },
  });

  const updateRewardMutation = trpc.loyalty.updateReward.useMutation({
    onSuccess: () => {
      alert(t("Reward updated successfully!"));
      setRewardDialogOpen(false);
      setEditingReward(null);
      resetRewardForm();
      refetchRewards();
    },
    onError: (error) => {
      alert(`Error: ${error.message}`);
    },
  });

  const deleteRewardMutation = trpc.loyalty.deleteReward.useMutation({
    onSuccess: () => {
      alert(t("Reward deleted successfully!"));
      setDeleteConfirm(null);
      refetchRewards();
    },
    onError: (error) => {
      alert(`Error: ${error.message}`);
    },
  });

  const adjustPointsMutation = trpc.loyalty.adjustUserPoints.useMutation({
    onSuccess: () => {
      alert(t("Points adjusted successfully!"));
      setAdjustPointsDialog(null);
      setAdjustForm({ points: "", description: "" });
      refetchUsers();
    },
    onError: (error) => {
      alert(`Error: ${error.message}`);
    },
  });

  const resetRewardForm = () => {
    setRewardForm({
      name: "",
      nameEn: "",
      description: "",
      descriptionEn: "",
      pointsCost: "",
      discountType: "percentage",
      discountValue: "",
      serviceId: "",
    });
  };

  const handleCreateReward = () => {
    setEditingReward(null);
    resetRewardForm();
    setRewardDialogOpen(true);
  };

  const handleEditReward = (reward: any) => {
    setEditingReward(reward);
    setRewardForm({
      name: reward.name || "",
      nameEn: reward.nameEn || "",
      description: reward.description || "",
      descriptionEn: reward.descriptionEn || "",
      pointsCost: reward.pointsCost?.toString() || "",
      discountType: reward.discountType || "percentage",
      discountValue: reward.discountValue?.toString() || "",
      serviceId: reward.serviceId?.toString() || "",
    });
    setRewardDialogOpen(true);
  };

  const handleSaveReward = () => {
    const data = {
      name: rewardForm.name,
      nameEn: rewardForm.nameEn,
      description: rewardForm.description || undefined,
      descriptionEn: rewardForm.descriptionEn || undefined,
      pointsCost: parseInt(rewardForm.pointsCost),
      discountType: rewardForm.discountType,
      discountValue: rewardForm.discountValue ? parseInt(rewardForm.discountValue) : undefined,
      serviceId: rewardForm.serviceId ? parseInt(rewardForm.serviceId) : undefined,
    };

    if (editingReward) {
      updateRewardMutation.mutate({ id: editingReward.id, ...data });
    } else {
      createRewardMutation.mutate(data);
    }
  };

  const handleDeleteReward = (id: number) => {
    setDeleteConfirm(id);
  };

  const confirmDelete = () => {
    if (deleteConfirm) {
      deleteRewardMutation.mutate({ id: deleteConfirm });
    }
  };

  const handleAdjustPoints = () => {
    if (adjustPointsDialog && adjustForm.points && adjustForm.description) {
      adjustPointsMutation.mutate({
        userId: adjustPointsDialog.userId,
        points: parseInt(adjustForm.points),
        description: adjustForm.description,
      });
    }
  };

  const isRTL = i18n.language === "ar";

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">{t("Loyalty Program Management")}</h1>
          <p className="text-muted-foreground">{t("Manage rewards and customer loyalty points")}</p>
        </div>

        <Tabs defaultValue="rewards" className="w-full">
          <TabsList>
            <TabsTrigger value="rewards">
              <Gift className={`h-4 w-4 ${isRTL ? "ml-2" : "mr-2"}`} />
              {t("Rewards")}
            </TabsTrigger>
            <TabsTrigger value="users">
              <Users className={`h-4 w-4 ${isRTL ? "ml-2" : "mr-2"}`} />
              {t("User Points")}
            </TabsTrigger>
          </TabsList>

          {/* Rewards Tab */}
          <TabsContent value="rewards" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold">{t("Manage Rewards")}</h2>
              <Button onClick={handleCreateReward}>
                <Plus className={`h-4 w-4 ${isRTL ? "ml-2" : "mr-2"}`} />
                {t("Create Reward")}
              </Button>
            </div>

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("Reward")}</TableHead>
                      <TableHead>{t("Points Cost")}</TableHead>
                      <TableHead>{t("Discount")}</TableHead>
                      <TableHead>{t("Service")}</TableHead>
                      <TableHead>{t("Status")}</TableHead>
                      <TableHead>{t("Actions")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rewards.map((reward) => (
                      <TableRow key={reward.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{isRTL ? reward.name : reward.nameEn}</p>
                            <p className="text-sm text-muted-foreground">
                              {isRTL ? reward.description : reward.descriptionEn}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            <Award className={`h-3 w-3 ${isRTL ? "ml-1" : "mr-1"}`} />
                            {reward.pointsCost}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {reward.discountType === "percentage" && `${reward.discountValue}%`}
                          {reward.discountType === "fixed" && `${reward.discountValue}`}
                          {reward.discountType === "free_service" && t("Free Service")}
                        </TableCell>
                        <TableCell>
                          {reward.serviceName
                            ? isRTL
                              ? reward.serviceName
                              : reward.serviceNameEn
                            : "-"}
                        </TableCell>
                        <TableCell>
                          <Badge variant={reward.active ? "default" : "secondary"}>
                            {reward.active ? t("Active") : t("Inactive")}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditReward(reward)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteReward(reward.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {rewards.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    {t("No rewards created yet")}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-4">
            <h2 className="text-2xl font-semibold">{t("User Loyalty Points")}</h2>

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("User")}</TableHead>
                      <TableHead>{t("Email")}</TableHead>
                      <TableHead>{t("Points Balance")}</TableHead>
                      <TableHead>{t("Actions")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.name || "N/A"}</TableCell>
                        <TableCell>{user.email || "N/A"}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="text-lg">
                            <Award className={`h-4 w-4 ${isRTL ? "ml-1" : "mr-1"}`} />
                            {user.loyaltyPoints || 0}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setAdjustPointsDialog({ userId: user.id, userName: user.name || "User" })
                            }
                          >
                            {t("Adjust Points")}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {users.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    {t("No users found")}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Create/Edit Reward Dialog */}
        <Dialog open={rewardDialogOpen} onOpenChange={setRewardDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingReward ? t("Edit Reward") : t("Create Reward")}
              </DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">{t("Name (Arabic)")}</Label>
                  <Input
                    id="name"
                    value={rewardForm.name}
                    onChange={(e) => setRewardForm({ ...rewardForm, name: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="nameEn">{t("Name (English)")}</Label>
                  <Input
                    id="nameEn"
                    value={rewardForm.nameEn}
                    onChange={(e) => setRewardForm({ ...rewardForm, nameEn: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="description">{t("Description (Arabic)")}</Label>
                  <Textarea
                    id="description"
                    value={rewardForm.description}
                    onChange={(e) => setRewardForm({ ...rewardForm, description: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="descriptionEn">{t("Description (English)")}</Label>
                  <Textarea
                    id="descriptionEn"
                    value={rewardForm.descriptionEn}
                    onChange={(e) =>
                      setRewardForm({ ...rewardForm, descriptionEn: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="pointsCost">{t("Points Cost")}</Label>
                  <Input
                    id="pointsCost"
                    type="number"
                    value={rewardForm.pointsCost}
                    onChange={(e) => setRewardForm({ ...rewardForm, pointsCost: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="discountType">{t("Discount Type")}</Label>
                  <Select
                    value={rewardForm.discountType}
                    onValueChange={(value: any) =>
                      setRewardForm({ ...rewardForm, discountType: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">{t("Percentage")}</SelectItem>
                      <SelectItem value="fixed">{t("Fixed Amount")}</SelectItem>
                      <SelectItem value="free_service">{t("Free Service")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="discountValue">{t("Discount Value")}</Label>
                  <Input
                    id="discountValue"
                    type="number"
                    value={rewardForm.discountValue}
                    onChange={(e) =>
                      setRewardForm({ ...rewardForm, discountValue: e.target.value })
                    }
                    disabled={rewardForm.discountType === "free_service"}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="serviceId">{t("Service (Optional)")}</Label>
                <Select
                  value={rewardForm.serviceId}
                  onValueChange={(value) => setRewardForm({ ...rewardForm, serviceId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("Select a service")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">{t("None")}</SelectItem>
                    {services.map((service) => (
                      <SelectItem key={service.id} value={service.id.toString()}>
                        {isRTL ? service.name : service.nameEn}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setRewardDialogOpen(false)}>
                {t("cancel")}
              </Button>
              <Button onClick={handleSaveReward}>
                {editingReward ? t("saveChanges") : t("Create")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteConfirm !== null} onOpenChange={() => setDeleteConfirm(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("Delete Reward")}</DialogTitle>
            </DialogHeader>
            <p>{t("Are you sure you want to delete this reward?")}</p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
                {t("cancel")}
              </Button>
              <Button variant="destructive" onClick={confirmDelete}>
                {t("Delete")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Adjust Points Dialog */}
        <Dialog
          open={adjustPointsDialog !== null}
          onOpenChange={() => setAdjustPointsDialog(null)}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {t("Adjust Points for")} {adjustPointsDialog?.userName}
              </DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div>
                <Label htmlFor="points">{t("Points (positive to add, negative to deduct)")}</Label>
                <Input
                  id="points"
                  type="number"
                  value={adjustForm.points}
                  onChange={(e) => setAdjustForm({ ...adjustForm, points: e.target.value })}
                  placeholder="e.g., 50 or -20"
                />
              </div>
              <div>
                <Label htmlFor="description">{t("Reason")}</Label>
                <Textarea
                  id="description"
                  value={adjustForm.description}
                  onChange={(e) => setAdjustForm({ ...adjustForm, description: e.target.value })}
                  placeholder={t("Describe why you're adjusting points")}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAdjustPointsDialog(null)}>
                {t("cancel")}
              </Button>
              <Button onClick={handleAdjustPoints}>
                {parseInt(adjustForm.points) > 0 ? (
                  <TrendingUp className={`h-4 w-4 ${isRTL ? "ml-2" : "mr-2"}`} />
                ) : (
                  <TrendingDown className={`h-4 w-4 ${isRTL ? "ml-2" : "mr-2"}`} />
                )}
                {t("Adjust Points")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}

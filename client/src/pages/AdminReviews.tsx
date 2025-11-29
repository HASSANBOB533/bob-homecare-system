import { useState } from "react";
import { useTranslation } from "react-i18next";
import { trpc } from "@/lib/trpc";
import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Star, Check, X, Edit, Trash2 } from "lucide-react";

export function AdminReviews() {
  const { t } = useTranslation();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [editingReview, setEditingReview] = useState<any>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  const { data: reviews = [], refetch } = trpc.reviews.allReviews.useQuery();
  const updateStatus = trpc.reviews.updateStatus.useMutation({
    onSuccess: () => {
      refetch();
    },
  });
  const updateContent = trpc.reviews.updateContent.useMutation({
    onSuccess: () => {
      setEditingReview(null);
      refetch();
    },
  });
  const deleteReview = trpc.reviews.delete.useMutation({
    onSuccess: () => {
      setDeleteConfirm(null);
      refetch();
    },
  });

  const filteredReviews = reviews.filter((review: any) => {
    if (statusFilter === "all") return true;
    return review.status === statusFilter;
  });

  const handleApprove = (id: number) => {
    updateStatus.mutate({ id, status: "approved" });
  };

  const handleReject = (id: number) => {
    updateStatus.mutate({ id, status: "rejected" });
  };

  const handleEdit = (review: any) => {
    setEditingReview({
      id: review.id,
      rating: review.rating,
      reviewText: review.reviewText || "",
    });
  };

  const handleSaveEdit = () => {
    if (!editingReview) return;
    updateContent.mutate({
      id: editingReview.id,
      rating: editingReview.rating,
      reviewText: editingReview.reviewText,
    });
  };

  const handleDelete = (id: number) => {
    setDeleteConfirm(id);
  };

  const confirmDelete = () => {
    if (deleteConfirm) {
      deleteReview.mutate({ id: deleteConfirm });
    }
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-800",
      approved: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status as keyof typeof colors]}`}>
        {t(status)}
      </span>
    );
  };

  return (
    <AdminLayout>
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{t("reviewManagement")}</CardTitle>
              <div className="flex items-center gap-2">
                <Label>{t("filterByStatus")}:</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("allStatuses")}</SelectItem>
                    <SelectItem value="pending">{t("pending")}</SelectItem>
                    <SelectItem value="approved">{t("approved")}</SelectItem>
                    <SelectItem value="rejected">{t("rejected")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredReviews.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">{t("noReviews")}</p>
            ) : (
              <div className="space-y-4">
                {filteredReviews.map((review: any) => (
                  <div key={review.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="flex">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-4 h-4 ${
                                  i < review.rating
                                    ? "fill-yellow-400 text-yellow-400"
                                    : "text-gray-300"
                                }`}
                              />
                            ))}
                          </div>
                          {getStatusBadge(review.status)}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {review.reviewText || <em>{t("noReviews")}</em>}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>
                            {t("customer")}: {review.userName} ({review.userEmail})
                          </span>
                          <span>
                            {t("service")}: {review.serviceNameEn || review.serviceName}
                          </span>
                          <span>
                            {t("reviewedOn")}: {new Date(review.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {review.status === "pending" && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-green-600 hover:text-green-700"
                              onClick={() => handleApprove(review.id)}
                            >
                              <Check className="w-4 h-4 mr-1" />
                              {t("approveReview")}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 hover:text-red-700"
                              onClick={() => handleReject(review.id)}
                            >
                              <X className="w-4 h-4 mr-1" />
                              {t("rejectReview")}
                            </Button>
                          </>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(review)}
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          {t("editReview")}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 hover:text-red-700"
                          onClick={() => handleDelete(review.id)}
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          {t("deleteReview")}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingReview} onOpenChange={() => setEditingReview(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("editReviewTitle")}</DialogTitle>
          </DialogHeader>
          {editingReview && (
            <div className="space-y-4">
              <div>
                <Label>{t("rating")}</Label>
                <Input
                  type="number"
                  min="1"
                  max="5"
                  value={editingReview.rating}
                  onChange={(e) =>
                    setEditingReview({
                      ...editingReview,
                      rating: parseInt(e.target.value),
                    })
                  }
                />
              </div>
              <div>
                <Label>{t("yourReview")}</Label>
                <Textarea
                  value={editingReview.reviewText}
                  onChange={(e) =>
                    setEditingReview({
                      ...editingReview,
                      reviewText: e.target.value,
                    })
                  }
                  rows={4}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingReview(null)}>
              {t("cancel")}
            </Button>
            <Button onClick={handleSaveEdit} disabled={updateContent.isPending}>
              {updateContent.isPending ? t("saving") : t("saveChanges")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("deleteReview")}</DialogTitle>
          </DialogHeader>
          <p>{t("confirmDeleteReview")}</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
              {t("cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleteReview.isPending}
            >
              {deleteReview.isPending ? t("saving") : t("deleteReview")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { trpc } from "@/lib/trpc";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star } from "lucide-react";

interface ReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookingId: number;
  serviceId: number;
  serviceName: string;
  onSuccess?: () => void;
}

export function ReviewDialog({
  open,
  onOpenChange,
  bookingId,
  serviceId,
  serviceName,
  onSuccess,
}: ReviewDialogProps) {
  const { t } = useTranslation();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const utils = trpc.useUtils();

  const createReviewMutation = trpc.reviews.create.useMutation({
    onSuccess: () => {
      alert(t("reviewSubmitted"));
      setRating(0);
      setReviewText("");
      onOpenChange(false);
      onSuccess?.();
      // Invalidate queries to refresh data
      utils.reviews.getServiceReviews.invalidate({ serviceId });
      utils.reviews.getServiceRating.invalidate({ serviceId });
    },
    onError: (error) => {
      alert(error.message || t("reviewFailed"));
    },
  });

  const handleSubmit = () => {
    if (rating === 0) {
      alert(t("Please select a rating"));
      return;
    }

    createReviewMutation.mutate({
      bookingId,
      serviceId,
      rating,
      reviewText: reviewText.trim() || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t("leaveReview")}</DialogTitle>
          <DialogDescription>
            {t("shareExperience")} - {serviceName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Star Rating */}
          <div className="space-y-2">
            <label className="text-sm font-medium">{t("rateService")}</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    className={`h-8 w-8 ${
                      star <= (hoverRating || rating)
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-300"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Review Text */}
          <div className="space-y-2">
            <label className="text-sm font-medium">{t("writeYourReview")}</label>
            <Textarea
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder={t("shareExperience")}
              rows={4}
              className="resize-none"
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={createReviewMutation.isPending}
            >
              {t("cancel")}
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={rating === 0 || createReviewMutation.isPending}
            >
              {createReviewMutation.isPending ? t("submitting") : t("submitReview")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

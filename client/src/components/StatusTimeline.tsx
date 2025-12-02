import { useTranslation } from "react-i18next";
import { Check } from "lucide-react";

interface StatusTimelineProps {
  currentStatus: "pending" | "confirmed" | "completed" | "cancelled";
}

export function StatusTimeline({ currentStatus }: StatusTimelineProps) {
  const { t } = useTranslation();

  const stages = [
    { key: "pending", label: t("statusTimeline.pending") },
    { key: "confirmed", label: t("statusTimeline.confirmed") },
    { key: "completed", label: t("statusTimeline.completed") },
  ];

  // If cancelled, show only cancelled status
  if (currentStatus === "cancelled") {
    return (
      <div className="flex items-center justify-center py-4">
        <div className="flex flex-col items-center">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
            <span className="text-red-600 text-xl">✕</span>
          </div>
          <p className="mt-2 text-sm font-medium text-red-600">
            {t("statusTimeline.cancelled")}
          </p>
        </div>
      </div>
    );
  }

  const getStageIndex = (status: string) => {
    const index = stages.findIndex((s) => s.key === status);
    return index === -1 ? 0 : index;
  };

  const currentStageIndex = getStageIndex(currentStatus);

  return (
    <div className="py-4">
      <div className="flex items-center justify-between relative">
        {/* Progress Line */}
        <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200">
          <div
            className="h-full bg-green-500 transition-all duration-500"
            style={{
              width: `${(currentStageIndex / (stages.length - 1)) * 100}%`,
            }}
          />
        </div>

        {/* Stages */}
        {stages.map((stage, index) => {
          const isCompleted = index <= currentStageIndex;
          const isCurrent = index === currentStageIndex;

          return (
            <div
              key={stage.key}
              className="flex flex-col items-center relative z-10"
              style={{ flex: 1 }}
            >
              {/* Stage Circle */}
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                  isCompleted
                    ? "bg-green-500 text-white"
                    : "bg-gray-200 text-gray-400"
                } ${isCurrent ? "ring-4 ring-green-100" : ""}`}
              >
                {isCompleted ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <span className="text-sm font-semibold">{index + 1}</span>
                )}
              </div>

              {/* Stage Label */}
              <p
                className={`mt-2 text-xs font-medium text-center ${
                  isCompleted ? "text-green-600" : "text-gray-500"
                } ${isCurrent ? "font-bold" : ""}`}
              >
                {stage.label}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

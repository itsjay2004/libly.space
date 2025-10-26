'use client';

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { AlertTriangle, XCircle } from "lucide-react"; // lightweight icons

interface BannerProps {
  type: "warning" | "error";
  message: string;
  buttonText?: string;
  onButtonClick?: () => void;
}

export default function Banner({
  type,
  message,
  buttonText,
  onButtonClick,
}: BannerProps) {
  const router = useRouter();

  const isWarning = type === "warning";

  const bgColor = isWarning
    ? "bg-yellow-50 dark:bg-yellow-950/40"
    : "bg-red-50 dark:bg-red-950/40";

  const textColor = isWarning
    ? "text-yellow-800 dark:text-yellow-300"
    : "text-red-800 dark:text-red-300";

  const borderGradient = isWarning
    ? "from-yellow-400 via-amber-500 to-orange-400"
    : "from-red-400 via-rose-500 to-pink-500";

  const Icon = isWarning ? AlertTriangle : XCircle;

  return (
    <div
      className={`relative overflow-hidden p-[2px] rounded-xl transition-all duration-300`}
    >
      <div
        className={`absolute inset-0 bg-gradient-to-r ${borderGradient} opacity-70 blur-md animate-pulse`}
      ></div>
      <div
        className={`relative flex items-center justify-between gap-4 rounded-xl px-4 py-3 ${bgColor} ${textColor} backdrop-blur-md border border-transparent`}
      >
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0">
            <Icon
              className={`h-6 w-6 ${
                isWarning
                  ? "text-yellow-500 dark:text-yellow-400"
                  : "text-red-500 dark:text-red-400"
              }`}
            />
          </div>
          <p className="text-sm sm:text-base font-medium">{message}</p>
        </div>

        {buttonText && onButtonClick && (
          <Button
            onClick={onButtonClick}
            className={`text-sm font-medium shadow-md transition-all duration-200 hover:scale-[1.03] ${
              isWarning
                ? "bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-400 text-yellow-900 hover:opacity-90"
                : "bg-gradient-to-r from-red-400 via-rose-500 to-pink-500 text-white hover:opacity-90"
            }`}
          >
            {buttonText}
          </Button>
        )}
      </div>
    </div>
  );
}

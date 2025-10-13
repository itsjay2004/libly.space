'use client';

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

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

  const bgColor = type === "warning" ? "bg-yellow-100" : "bg-red-100";
  const textColor = type === "warning" ? "text-yellow-800" : "text-red-800";

  return (
    <div className={`p-4 rounded-md ${bgColor} ${textColor}`}>
      <div className="flex items-center justify-between">
        <p>{message}</p>
        {buttonText && onButtonClick && (
          <Button onClick={onButtonClick}>{buttonText}</Button>
        )}
      </div>
    </div>
  );
}

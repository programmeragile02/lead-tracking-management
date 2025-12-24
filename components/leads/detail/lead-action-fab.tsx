"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Plus,
  Calendar,
  RotateCw,
  Edit3,
  GitBranch,
  FileText,
  Sparkles,
  Wrench,
  Activity,
  Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";

const actions = [
  {
    id: "sync",
    label: "Sinkronisasi Chat",
    icon: RotateCw,
    color: "bg-cyan-500 hover:bg-cyan-600",
  },
  {
    id: "ai",
    label: "Analisis AI Chat",
    icon: Sparkles,
    color: "bg-purple-500 hover:bg-purple-600",
  },
  {
    id: "activity",
    label: "Tambah Aktivitas",
    icon: Edit3,
    color: "bg-emerald-500 hover:bg-emerald-600",
  },
  {
    id: "price",
    label: "Input / Update Harga",
    icon: FileText,
    color: "bg-indigo-500 hover:bg-indigo-600",
  },
  {
    id: "followup",
    label: "Atur Follow Up",
    icon: Calendar,
    color: "bg-sky-500 hover:bg-sky-600",
  },
  {
    id: "substatus",
    label: "Sub Status Lead",
    icon: Layers,
    color: "bg-yellow-500 hover:bg-yellow-600",
  },
  {
    id: "status",
    label: "Status Lead",
    icon: Activity,
    color: "bg-rose-500 hover:bg-rose-600",
  },
  {
    id: "stage",
    label: "Tahapan Lead",
    icon: GitBranch,
    color: "bg-amber-500 hover:bg-amber-600",
  },
];

type LeadActionFabProps = {
  onFollowUp: () => void;
  onPrice: () => void;
  onActivity: () => void;
  onSyncChat: () => Promise<void>;
  onAnalyzeAi: () => void;
  onStatus: () => void;
  onStage: () => void;
  onSubStatus: () => void;
};

export function LeadActionFab({
  onFollowUp,
  onPrice,
  onActivity,
  onSyncChat,
  onAnalyzeAi,
  onStatus,
  onStage,
  onSubStatus
}: LeadActionFabProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleActionClick = async (actionId: string) => {
    setIsOpen(false);

    switch (actionId) {
      case "followup":
        onFollowUp();
        break;

      case "price":
        onPrice();
        break;

      case "activity":
        onActivity();
        break;

      case "sync":
        await onSyncChat();
        break;

      case "ai":
        onAnalyzeAi();
        break;

      case "status":
        onStatus();
        break;

      case "stage":
        onStage();
        break;

      case "substatus":
        onSubStatus();
        break;
    }
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20 pointer-events-auto"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Action buttons */}
      <div className="fixed bottom-36 md:bottom-25 right-4 z-50 flex flex-col-reverse gap-3 pointer-events-none">
        {isOpen &&
          actions.map((action, index) => {
            const Icon = action.icon;
            return (
              <div
                key={action.id}
                className="flex items-center gap-3 pointer-events-auto animate-in slide-in-from-bottom-5 duration-200"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <span className="text-sm font-medium text-gray-900 bg-white px-3 py-1.5 rounded-lg shadow-md">
                  {action.label}
                </span>
                <Button
                  size="icon"
                  className={cn(
                    "w-12 h-12 rounded-full shadow-lg",
                    action.color
                  )}
                  onClick={() => handleActionClick(action.id)}
                >
                  <Icon className="w-5 h-5" />
                </Button>
              </div>
            );
          })}
      </div>

      {/* Main FAB */}
      <Button
        size="icon"
        className={cn(
          "fixed bottom-20 right-4 lg:bottom-6 lg:right-8 w-14 h-14 rounded-full shadow-lg transition-all z-50 pointer-events-auto",
          isOpen
            ? "bg-gray-700 hover:bg-gray-800 rotate-45"
            : "bg-primary hover:bg-primary"
        )}
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <Plus className="w-6 h-6" /> : <Wrench className="w-6 h-6" />}
      </Button>
    </>
  );
}

import { Package, Sparkles } from "lucide-react";
import type { LootBox } from "../types";

interface LootBoxCardProps {
  lootBox: LootBox;
  onOpen: (lootBox: LootBox) => void;
  isOpening: boolean;
}

export function LootBoxCard({ lootBox, onOpen, isOpening }: LootBoxCardProps) {
  return (
    <div
      className={`relative bg-gradient-to-br from-purple-900/50 to-indigo-900/50 rounded-2xl p-6 border-2 border-purple-500/50 backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:border-purple-400 ${
        isOpening ? "animate-shake" : "animate-float"
      }`}
    >
      <div className="absolute -top-2 -right-2">
        <span className="bg-purple-600 text-white text-xs font-bold px-2 py-1 rounded-full">
          #{lootBox.boxNumber}
        </span>
      </div>

      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <Package
            className={`w-20 h-20 text-purple-400 ${
              isOpening ? "" : "animate-pulse"
            }`}
          />
          <Sparkles className="absolute -top-1 -right-1 w-6 h-6 text-yellow-400 animate-pulse" />
        </div>

        <h3 className="text-white font-bold text-lg">Mystery Loot Box</h3>

        <button
          onClick={() => onOpen(lootBox)}
          disabled={isOpening}
          className={`w-full py-3 px-6 rounded-xl font-bold text-white transition-all duration-300 ${
            isOpening
              ? "bg-gray-600 cursor-not-allowed"
              : "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 hover:shadow-lg hover:shadow-purple-500/50"
          }`}
        >
          {isOpening ? "Opening..." : "Open Box"}
        </button>
      </div>
    </div>
  );
}

import { useEffect, useState } from "react";
import { X, Sparkles, Star } from "lucide-react";
import type { GameItem, RarityTier } from "../types";
import { RARITY_NAMES, RARITY_COLORS } from "../constants";
import { GameItemCard } from "./GameItemCard";

interface RevealModalProps {
  item: GameItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export function RevealModal({ item, isOpen, onClose }: RevealModalProps) {
  const [showItem, setShowItem] = useState(false);

  useEffect(() => {
    if (isOpen && item) {
      setShowItem(false);
      const timer = setTimeout(() => setShowItem(true), 500);
      return () => clearTimeout(timer);
    }
  }, [isOpen, item]);

  if (!isOpen || !item) return null;

  const rarity = item.rarity as RarityTier;
  const colors = RARITY_COLORS[rarity];
  const rarityName = RARITY_NAMES[rarity];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative z-10 max-w-md w-full">
        <button
          onClick={onClose}
          className="absolute -top-12 right-0 text-white/60 hover:text-white transition-colors"
        >
          <X className="w-8 h-8" />
        </button>

        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold text-white mb-2">
            {showItem ? "You Got!" : "Opening..."}
          </h2>
          {showItem && (
            <div className="flex items-center justify-center gap-2">
              <Star className={`w-5 h-5 ${colors.text}`} />
              <span className={`text-xl font-semibold ${colors.text}`}>
                {rarityName}
              </span>
              <Star className={`w-5 h-5 ${colors.text}`} />
            </div>
          )}
        </div>

        {!showItem ? (
          <div className="flex justify-center">
            <div className="relative">
              <div className="w-32 h-32 bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl animate-shake flex items-center justify-center">
                <Sparkles className="w-16 h-16 text-white animate-pulse" />
              </div>
              <div className="absolute inset-0 bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl blur-xl opacity-50 animate-pulse" />
            </div>
          </div>
        ) : (
          <div className="flex justify-center">
            <div className="w-64">
              <GameItemCard item={item} isRevealing={true} />
            </div>
          </div>
        )}

        {showItem && (
          <div className="mt-6 text-center">
            <button
              onClick={onClose}
              className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold rounded-xl transition-all duration-300 hover:scale-105"
            >
              Awesome!
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

import { Sword, Send, Flame, Zap } from "lucide-react";
import type { GameItem, RarityTier } from "../types";
import { RARITY_NAMES, RARITY_COLORS } from "../constants";

interface GameItemCardProps {
  item: GameItem;
  onTransfer?: (item: GameItem) => void;
  onBurn?: (item: GameItem) => void;
  isRevealing?: boolean;
}

export function GameItemCard({
  item,
  onTransfer,
  onBurn,
  isRevealing = false,
}: GameItemCardProps) {
  const rarity = item.rarity as RarityTier;
  const colors = RARITY_COLORS[rarity];
  const rarityName = RARITY_NAMES[rarity];

  return (
    <div
      className={`relative bg-gradient-to-br ${colors.bg} rounded-2xl p-5 border-2 ${colors.border} backdrop-blur-sm transition-all duration-300 hover:scale-105 ${
        isRevealing ? "animate-reveal" : ""
      } ${rarity === 3 ? "shadow-lg shadow-yellow-500/30" : ""}`}
    >
      <div className="absolute -top-2 -right-2">
        <span
          className={`${
            rarity === 3 ? "bg-yellow-500" : "bg-white/20"
          } text-white text-xs font-bold px-2 py-1 rounded-full`}
        >
          #{item.itemNumber}
        </span>
      </div>

      <div className="flex flex-col items-center gap-3">
        <div className="relative">
          <Sword className="w-16 h-16 text-white drop-shadow-lg" />
          {rarity === 3 && (
            <Zap className="absolute -top-2 -right-2 w-6 h-6 text-yellow-300 animate-pulse" />
          )}
        </div>

        <div className="text-center">
          <h3 className="text-white font-bold text-lg">{item.name}</h3>
          <span
            className={`inline-block mt-1 px-3 py-1 rounded-full text-xs font-semibold ${
              rarity === 3
                ? "bg-yellow-500/30 text-yellow-200"
                : "bg-white/20 text-white"
            }`}
          >
            {rarityName}
          </span>
        </div>

        <div className="flex items-center gap-2 bg-black/20 rounded-lg px-4 py-2">
          <Zap className="w-4 h-4 text-yellow-400" />
          <span className="text-white font-bold">{item.power}</span>
          <span className="text-white/60 text-sm">Power</span>
        </div>

        {(onTransfer || onBurn) && (
          <div className="flex gap-2 w-full mt-2">
            {onTransfer && (
              <button
                onClick={() => onTransfer(item)}
                className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-blue-600/80 hover:bg-blue-500 rounded-lg text-white text-sm font-medium transition-colors"
              >
                <Send className="w-4 h-4" />
                Transfer
              </button>
            )}
            {onBurn && (
              <button
                onClick={() => onBurn(item)}
                className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-red-600/80 hover:bg-red-500 rounded-lg text-white text-sm font-medium transition-colors"
              >
                <Flame className="w-4 h-4" />
                Burn
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

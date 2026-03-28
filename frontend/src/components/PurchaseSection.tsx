import { useState } from "react";
import { ShoppingCart, Coins, TrendingUp } from "lucide-react";
import { LOOT_BOX_PRICE_SUI } from "../constants";

interface PurchaseSectionProps {
  onPurchase: (quantity: number) => void;
  isPurchasing: boolean;
  balance: number;
  totalBoxesSold: number;
}

export function PurchaseSection({
  onPurchase,
  isPurchasing,
  balance,
  totalBoxesSold,
}: PurchaseSectionProps) {
  const [quantity, setQuantity] = useState(1);
  const totalCost = quantity * LOOT_BOX_PRICE_SUI;
  const canAfford = balance >= totalCost;

  return (
    <div className="bg-white/5 backdrop-blur-md rounded-3xl p-8 border border-white/10">
      <div className="flex items-center gap-3 mb-6">
        <ShoppingCart className="w-8 h-8 text-purple-400" />
        <h2 className="text-2xl font-bold text-white">Purchase Loot Boxes</h2>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-black/20 rounded-xl p-4">
            <span className="text-gray-300">Price per box</span>
            <span className="text-white font-bold flex items-center gap-2">
              <Coins className="w-5 h-5 text-blue-400" />
              {LOOT_BOX_PRICE_SUI} SUI
            </span>
          </div>

          <div className="flex items-center justify-between bg-black/20 rounded-xl p-4">
            <span className="text-gray-300">Your Balance</span>
            <span className="text-white font-bold flex items-center gap-2">
              <Coins className="w-5 h-5 text-green-400" />
              {balance.toFixed(4)} SUI
            </span>
          </div>

          <div className="flex items-center justify-between bg-black/20 rounded-xl p-4">
            <span className="text-gray-300">Total Boxes Sold</span>
            <span className="text-white font-bold flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-purple-400" />
              {totalBoxesSold.toLocaleString()}
            </span>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-black/20 rounded-xl p-4">
            <label className="text-gray-300 text-sm mb-2 block">Quantity</label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-10 h-10 rounded-lg bg-purple-600/50 hover:bg-purple-600 text-white font-bold transition-colors"
              >
                -
              </button>
              <input
                type="number"
                min="1"
                max="10"
                value={quantity}
                onChange={(e) =>
                  setQuantity(Math.max(1, Math.min(10, parseInt(e.target.value) || 1)))
                }
                className="flex-1 bg-black/30 border border-white/20 rounded-lg px-4 py-2 text-white text-center font-bold text-xl focus:outline-none focus:border-purple-500"
              />
              <button
                onClick={() => setQuantity(Math.min(10, quantity + 1))}
                className="w-10 h-10 rounded-lg bg-purple-600/50 hover:bg-purple-600 text-white font-bold transition-colors"
              >
                +
              </button>
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-900/50 to-pink-900/50 rounded-xl p-4 border border-purple-500/30">
            <div className="flex items-center justify-between mb-4">
              <span className="text-gray-300">Total Cost</span>
              <span className="text-2xl font-bold text-white">
                {totalCost.toFixed(2)} SUI
              </span>
            </div>

            <button
              onClick={() => onPurchase(quantity)}
              disabled={isPurchasing || !canAfford}
              className={`w-full py-4 rounded-xl font-bold text-lg transition-all duration-300 ${
                isPurchasing || !canAfford
                  ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 hover:scale-[1.02]"
              }`}
            >
              {isPurchasing
                ? "Processing..."
                : !canAfford
                ? "Insufficient Balance"
                : `Buy ${quantity} Loot Box${quantity > 1 ? "es" : ""}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

import { Package, Sword } from "lucide-react";
import type { GameItem, LootBox } from "../types";
import { LootBoxCard } from "./LootBoxCard";
import { GameItemCard } from "./GameItemCard";

interface InventoryProps {
  lootBoxes: LootBox[];
  items: GameItem[];
  onOpenBox: (lootBox: LootBox) => void;
  onTransferItem: (item: GameItem) => void;
  onBurnItem: (item: GameItem) => void;
  isOpening: boolean;
  openingBoxId: string | null;
}

export function Inventory({
  lootBoxes,
  items,
  onOpenBox,
  onTransferItem,
  onBurnItem,
  isOpening,
  openingBoxId,
}: InventoryProps) {
  return (
    <div className="space-y-8">
      {/* Loot Boxes Section */}
      <div className="bg-white/5 backdrop-blur-md rounded-3xl p-8 border border-white/10">
        <div className="flex items-center gap-3 mb-6">
          <Package className="w-8 h-8 text-purple-400" />
          <h2 className="text-2xl font-bold text-white">
            Your Loot Boxes ({lootBoxes.length})
          </h2>
        </div>

        {lootBoxes.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">No loot boxes yet. Purchase some above!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {lootBoxes.map((box) => (
              <LootBoxCard
                key={box.id}
                lootBox={box}
                onOpen={onOpenBox}
                isOpening={isOpening && openingBoxId === box.id}
              />
            ))}
          </div>
        )}
      </div>

      {/* Items Section */}
      <div className="bg-white/5 backdrop-blur-md rounded-3xl p-8 border border-white/10">
        <div className="flex items-center gap-3 mb-6">
          <Sword className="w-8 h-8 text-yellow-400" />
          <h2 className="text-2xl font-bold text-white">
            Your Items ({items.length})
          </h2>
        </div>

        {items.length === 0 ? (
          <div className="text-center py-12">
            <Sword className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">
              No items yet. Open some loot boxes to get items!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {items.map((item) => (
              <GameItemCard
                key={item.id}
                item={item}
                onTransfer={onTransferItem}
                onBurn={onBurnItem}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

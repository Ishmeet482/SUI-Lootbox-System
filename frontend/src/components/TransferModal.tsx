import { useState } from "react";
import { X, Send } from "lucide-react";
import type { GameItem } from "../types";

interface TransferModalProps {
  item: GameItem | null;
  isOpen: boolean;
  onClose: () => void;
  onTransfer: (item: GameItem, recipient: string) => void;
  isTransferring: boolean;
}

export function TransferModal({
  item,
  isOpen,
  onClose,
  onTransfer,
  isTransferring,
}: TransferModalProps) {
  const [recipient, setRecipient] = useState("");

  if (!isOpen || !item) return null;

  const isValidAddress = recipient.startsWith("0x") && recipient.length >= 64;

  const handleTransfer = () => {
    if (isValidAddress) {
      onTransfer(item, recipient);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative z-10 bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 max-w-md w-full border border-white/10">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <Send className="w-6 h-6 text-blue-400" />
          <h2 className="text-xl font-bold text-white">Transfer Item</h2>
        </div>

        <div className="bg-black/20 rounded-xl p-4 mb-4">
          <p className="text-gray-400 text-sm mb-1">Transferring</p>
          <p className="text-white font-semibold">{item.name}</p>
          <p className="text-gray-400 text-sm">Power: {item.power}</p>
        </div>

        <div className="mb-6">
          <label className="text-gray-300 text-sm mb-2 block">
            Recipient Address
          </label>
          <input
            type="text"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            placeholder="0x..."
            className="w-full bg-black/30 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
          />
          {recipient && !isValidAddress && (
            <p className="text-red-400 text-sm mt-2">
              Please enter a valid Sui address
            </p>
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleTransfer}
            disabled={!isValidAddress || isTransferring}
            className={`flex-1 py-3 font-semibold rounded-xl transition-all ${
              isValidAddress && !isTransferring
                ? "bg-blue-600 hover:bg-blue-500 text-white"
                : "bg-gray-600 text-gray-400 cursor-not-allowed"
            }`}
          >
            {isTransferring ? "Transferring..." : "Transfer"}
          </button>
        </div>
      </div>
    </div>
  );
}

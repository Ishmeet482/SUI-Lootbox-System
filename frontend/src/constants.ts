// Contract constants - Update these after deploying your contract
export const PACKAGE_ID = "0x_YOUR_PACKAGE_ID_HERE";
export const GAME_CONFIG_ID = "0x_YOUR_GAME_CONFIG_ID_HERE";

// Network configuration
export const NETWORK = "testnet";

// Rarity configuration
export const RARITY_NAMES = ["Common", "Rare", "Epic", "Legendary"] as const;
export const RARITY_COLORS = {
  0: { bg: "from-gray-500 to-gray-400", border: "border-gray-400", text: "text-gray-300" },
  1: { bg: "from-blue-600 to-blue-400", border: "border-blue-400", text: "text-blue-300" },
  2: { bg: "from-purple-600 to-purple-400", border: "border-purple-400", text: "text-purple-300" },
  3: { bg: "from-amber-500 to-yellow-400", border: "border-yellow-400", text: "text-yellow-300" },
} as const;

// Power ranges per rarity
export const POWER_RANGES = {
  0: { min: 1, max: 10 },
  1: { min: 11, max: 25 },
  2: { min: 26, max: 40 },
  3: { min: 41, max: 50 },
} as const;

// Loot box price in MIST (0.1 SUI = 100_000_000 MIST)
export const LOOT_BOX_PRICE = 100_000_000;
export const LOOT_BOX_PRICE_SUI = 0.1;

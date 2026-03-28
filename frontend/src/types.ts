export interface GameItem {
  id: string;
  name: string;
  rarity: number;
  power: number;
  itemNumber: number;
}

export interface LootBox {
  id: string;
  boxNumber: number;
}

export interface GameConfig {
  id: string;
  lootBoxPrice: number;
  rarityWeights: number[];
  totalBoxesSold: number;
  totalItemsMinted: number;
}

export interface RevealedItem {
  item: GameItem;
  isNew: boolean;
}

export type RarityTier = 0 | 1 | 2 | 3;

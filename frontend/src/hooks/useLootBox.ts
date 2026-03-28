import { useState, useEffect, useCallback } from "react";
import {
  useCurrentAccount,
  useSignAndExecuteTransaction,
  useSuiClient,
} from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import type { GameItem, LootBox } from "../types";
import { PACKAGE_ID, GAME_CONFIG_ID, LOOT_BOX_PRICE } from "../constants";

export function useLootBox() {
  const account = useCurrentAccount();
  const client = useSuiClient();
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();

  const [balance, setBalance] = useState(0);
  const [lootBoxes, setLootBoxes] = useState<LootBox[]>([]);
  const [items, setItems] = useState<GameItem[]>([]);
  const [pityCounter, setPityCounter] = useState(0);
  const [totalBoxesSold, setTotalBoxesSold] = useState(0);
  const [rarityWeights, setRarityWeights] = useState([60, 25, 12, 3]);

  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isOpening, setIsOpening] = useState(false);
  const [isTransferring, setIsTransferring] = useState(false);
  const [openingBoxId, setOpeningBoxId] = useState<string | null>(null);

  const [revealedItem, setRevealedItem] = useState<GameItem | null>(null);
  const [showReveal, setShowReveal] = useState(false);

  // Fetch user balance
  const fetchBalance = useCallback(async () => {
    if (!account?.address) return;
    try {
      const balanceResult = await client.getBalance({
        owner: account.address,
        coinType: "0x2::sui::SUI",
      });
      setBalance(Number(balanceResult.totalBalance) / 1_000_000_000);
    } catch (error) {
      console.error("Error fetching balance:", error);
    }
  }, [account?.address, client]);

  // Fetch user's loot boxes
  const fetchLootBoxes = useCallback(async () => {
    if (!account?.address) return;
    try {
      const objects = await client.getOwnedObjects({
        owner: account.address,
        filter: {
          StructType: `${PACKAGE_ID}::lootbox::LootBox`,
        },
        options: { showContent: true },
      });

      const boxes: LootBox[] = objects.data
        .filter((obj) => obj.data?.content?.dataType === "moveObject")
        .map((obj) => {
          const content = obj.data!.content as unknown as { fields: { id: { id: string }; box_number: string } };
          return {
            id: content.fields.id.id,
            boxNumber: Number(content.fields.box_number),
          };
        });

      setLootBoxes(boxes);
    } catch (error) {
      console.error("Error fetching loot boxes:", error);
    }
  }, [account?.address, client]);

  // Fetch user's game items
  const fetchItems = useCallback(async () => {
    if (!account?.address) return;
    try {
      const objects = await client.getOwnedObjects({
        owner: account.address,
        filter: {
          StructType: `${PACKAGE_ID}::lootbox::GameItem`,
        },
        options: { showContent: true },
      });

      const gameItems: GameItem[] = objects.data
        .filter((obj) => obj.data?.content?.dataType === "moveObject")
        .map((obj) => {
          const content = obj.data!.content as unknown as {
            fields: {
              id: { id: string };
              name: number[];
              rarity: number;
              power: number;
              item_number: string;
            };
          };
          return {
            id: content.fields.id.id,
            name: String.fromCharCode(...content.fields.name),
            rarity: content.fields.rarity,
            power: content.fields.power,
            itemNumber: Number(content.fields.item_number),
          };
        });

      setItems(gameItems);
    } catch (error) {
      console.error("Error fetching items:", error);
    }
  }, [account?.address, client]);

  // Fetch game config
  const fetchGameConfig = useCallback(async () => {
    try {
      const config = await client.getObject({
        id: GAME_CONFIG_ID,
        options: { showContent: true },
      });

      if (config.data?.content?.dataType === "moveObject") {
        const fields = (config.data.content as unknown as {
          fields: {
            total_boxes_sold: string;
            rarity_weights: number[];
          };
        }).fields;
        setTotalBoxesSold(Number(fields.total_boxes_sold));
        setRarityWeights(fields.rarity_weights);
      }
    } catch (error) {
      console.error("Error fetching game config:", error);
    }
  }, [client]);

  // Fetch pity counter
  const fetchPityCounter = useCallback(async () => {
    if (!account?.address) return;
    // Note: This would require a custom RPC call or indexer to fetch dynamic fields
    // For now, we'll track it locally or set to 0
    setPityCounter(0);
  }, [account?.address]);

  // Purchase loot boxes
  const purchaseLootBoxes = async (quantity: number) => {
    if (!account?.address) return;
    setIsPurchasing(true);

    try {
      const tx = new Transaction();

      for (let i = 0; i < quantity; i++) {
        const [coin] = tx.splitCoins(tx.gas, [LOOT_BOX_PRICE]);
        tx.moveCall({
          target: `${PACKAGE_ID}::lootbox::purchase_loot_box_entry`,
          arguments: [tx.object(GAME_CONFIG_ID), coin],
        });
      }

      await signAndExecute({ transaction: tx });

      // Refresh data
      await Promise.all([fetchBalance(), fetchLootBoxes(), fetchGameConfig()]);
    } catch (error) {
      console.error("Error purchasing loot boxes:", error);
      throw error;
    } finally {
      setIsPurchasing(false);
    }
  };

  // Open loot box
  const openLootBox = async (lootBox: LootBox) => {
    if (!account?.address) return;
    setIsOpening(true);
    setOpeningBoxId(lootBox.id);

    try {
      const tx = new Transaction();

      tx.moveCall({
        target: `${PACKAGE_ID}::lootbox::open_loot_box`,
        arguments: [
          tx.object(GAME_CONFIG_ID),
          tx.object(lootBox.id),
          tx.object("0x8"), // Random object
        ],
      });

      await signAndExecute({ transaction: tx });

      // Wait for transaction to be indexed
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Refresh data
      await Promise.all([fetchLootBoxes(), fetchItems(), fetchPityCounter()]);

      // Find the newly minted item (the one with highest item number)
      const updatedItems = await client.getOwnedObjects({
        owner: account.address,
        filter: {
          StructType: `${PACKAGE_ID}::lootbox::GameItem`,
        },
        options: { showContent: true },
      });

      if (updatedItems.data.length > 0) {
        const latestItem = updatedItems.data
          .filter((obj) => obj.data?.content?.dataType === "moveObject")
          .map((obj) => {
            const content = obj.data!.content as unknown as {
              fields: {
                id: { id: string };
                name: number[];
                rarity: number;
                power: number;
                item_number: string;
              };
            };
            return {
              id: content.fields.id.id,
              name: String.fromCharCode(...content.fields.name),
              rarity: content.fields.rarity,
              power: content.fields.power,
              itemNumber: Number(content.fields.item_number),
            };
          })
          .sort((a, b) => b.itemNumber - a.itemNumber)[0];

        if (latestItem) {
          setRevealedItem(latestItem);
          setShowReveal(true);
        }
      }
    } catch (error) {
      console.error("Error opening loot box:", error);
      throw error;
    } finally {
      setIsOpening(false);
      setOpeningBoxId(null);
    }
  };

  // Transfer item
  const transferItem = async (item: GameItem, recipient: string) => {
    if (!account?.address) return;
    setIsTransferring(true);

    try {
      const tx = new Transaction();

      tx.moveCall({
        target: `${PACKAGE_ID}::lootbox::transfer_item`,
        arguments: [tx.object(item.id), tx.pure.address(recipient)],
      });

      await signAndExecute({ transaction: tx });

      // Refresh items
      await fetchItems();
    } catch (error) {
      console.error("Error transferring item:", error);
      throw error;
    } finally {
      setIsTransferring(false);
    }
  };

  // Burn item
  const burnItem = async (item: GameItem) => {
    if (!account?.address) return;

    try {
      const tx = new Transaction();

      tx.moveCall({
        target: `${PACKAGE_ID}::lootbox::burn_item`,
        arguments: [tx.object(item.id)],
      });

      await signAndExecute({ transaction: tx });

      // Refresh items
      await fetchItems();
    } catch (error) {
      console.error("Error burning item:", error);
      throw error;
    }
  };

  // Close reveal modal
  const closeReveal = () => {
    setShowReveal(false);
    setRevealedItem(null);
  };

  // Fetch all data on mount and account change
  useEffect(() => {
    if (account?.address) {
      fetchBalance();
      fetchLootBoxes();
      fetchItems();
      fetchGameConfig();
      fetchPityCounter();
    }
  }, [account?.address, fetchBalance, fetchLootBoxes, fetchItems, fetchGameConfig, fetchPityCounter]);

  return {
    // State
    balance,
    lootBoxes,
    items,
    pityCounter,
    totalBoxesSold,
    rarityWeights,
    isPurchasing,
    isOpening,
    isTransferring,
    openingBoxId,
    revealedItem,
    showReveal,

    // Actions
    purchaseLootBoxes,
    openLootBox,
    transferItem,
    burnItem,
    closeReveal,
    refreshData: () => {
      fetchBalance();
      fetchLootBoxes();
      fetchItems();
      fetchGameConfig();
    },
  };
}

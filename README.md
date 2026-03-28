# Sui Loot Box System

A blockchain-based loot box system built on Sui Move with on-chain randomness for fair and verifiable NFT drops.

## Overview

This project implements a gaming loot box system where players can:
- Purchase loot boxes using SUI tokens
- Open loot boxes to receive randomly generated NFT items
- Trade or burn their items

The randomness is verifiable and tamper-proof using Sui's native on-chain randomness module.

## Features

### Core Mechanics
- **Purchase Flow**: Players pay SUI tokens to receive an unopened loot box
- **Secure Opening**: Uses `sui::random` for cryptographically secure randomness
- **NFT Minting**: Creates unique game item NFTs based on random outcomes
- **Rarity Tiers**: Common, Rare, Epic, and Legendary with different drop rates

### Rarity Distribution

| Tier      | Weight | Drop Rate | Power Range |
|-----------|--------|-----------|-------------|
| Common    | 60     | 60%       | 1 - 10      |
| Rare      | 25     | 25%       | 11 - 25     |
| Epic      | 12     | 12%       | 26 - 40     |
| Legendary | 3      | 3%        | 41 - 50     |

### Pity System (Bonus Feature)
If a user opens 30 loot boxes without receiving a Legendary item, their next box is guaranteed to be Legendary. The counter is tracked per-user using dynamic fields.

## Project Structure

```
sui-lootbox/
├── Move.toml              # Package configuration
├── README.md              # This file
├── sources/
│   └── lootbox.move       # Main smart contract
├── tests/
│   └── lootbox_tests.move # Test suite
└── frontend/              # React UI
    ├── src/
    │   ├── components/    # UI components
    │   ├── hooks/         # Custom React hooks
    │   ├── App.tsx        # Main application
    │   └── constants.ts   # Contract addresses
    └── package.json
```

## Smart Contract Functions

### Initialization
- `init()` - One-time initializer creating shared GameConfig with rarity weights, price, and AdminCap

### Player Functions
- `purchase_loot_box()` - Pay SUI tokens to receive an owned LootBox object
- `open_loot_box()` - Opens loot box using on-chain randomness, mints GameItem NFT (entry function)
- `transfer_item()` - Transfer a GameItem to another address
- `burn_item()` - Destroy an unwanted item

### View Functions
- `get_item_stats()` - Returns item's name, rarity tier, and power level
- `get_loot_box_price()` - Get current loot box price
- `get_rarity_weights()` - Get current rarity distribution
- `get_pity_counter()` - Get user's pity counter

### Admin Functions
- `update_rarity_weights()` - Adjust drop rates (requires AdminCap)
- `update_price()` - Change loot box price
- `withdraw_treasury()` - Withdraw collected funds

## Object Model

- **GameConfig**: Shared object storing game settings and treasury
- **LootBox**: Owned object representing an unopened loot box
- **GameItem**: Owned NFT with `key` and `store` abilities
- **AdminCap**: Capability for admin functions

## Events

- `LootBoxPurchased` - Emitted when a loot box is purchased
- `LootBoxOpened` - Emitted when a loot box is opened (includes item ID, rarity, power, owner)
- `ItemBurned` - Emitted when an item is destroyed
- `PityTriggered` - Emitted when pity system activates

## Building

```bash
# Install Sui CLI if not already installed
# https://docs.sui.io/build/install

# Build the package
sui move build

# Run tests
sui move test
```

## Deployment

```bash
# Deploy to testnet
sui client publish --gas-budget 100000000

# After deployment, note the package ID and GameConfig object ID
```

## Usage Examples

### Purchase a Loot Box
```bash
sui client call \
  --package <PACKAGE_ID> \
  --module lootbox \
  --function purchase_loot_box_entry \
  --args <GAME_CONFIG_ID> <COIN_OBJECT_ID> \
  --gas-budget 10000000
```

### Open a Loot Box
```bash
sui client call \
  --package <PACKAGE_ID> \
  --module lootbox \
  --function open_loot_box \
  --args <GAME_CONFIG_ID> <LOOT_BOX_ID> 0x8 \
  --gas-budget 10000000
```

### Transfer an Item
```bash
sui client call \
  --package <PACKAGE_ID> \
  --module lootbox \
  --function transfer_item \
  --args <GAME_ITEM_ID> <RECIPIENT_ADDRESS> \
  --gas-budget 10000000
```

## Security Considerations

1. **On-Chain Randomness**: The `open_loot_box` function is marked as `entry` (not `public`) to prevent manipulation through composability attacks
2. **RandomGenerator**: Never passed as a function argument; always created within the consuming function
3. **Admin Controls**: All admin functions require the AdminCap capability object

## Testing

The test suite covers:
- Game initialization with correct defaults
- Loot box purchase with exact and excess payment
- Insufficient payment rejection
- Rarity determination logic
- Admin functions (update weights, price, withdraw)
- Multiple purchases tracking

Run tests with:
```bash
sui move test
```

## Frontend Setup

The project includes a React-based UI for interacting with the loot box system.

### Prerequisites
- Node.js 18+
- A Sui wallet (Sui Wallet, Suiet, etc.)

### Running the Frontend

```bash
cd frontend
npm install
npm run dev
```

The app will be available at `http://localhost:5173`

### Configuration

After deploying the smart contract, update `frontend/src/constants.ts` with your deployed addresses:

```typescript
export const PACKAGE_ID = "0x_YOUR_PACKAGE_ID_HERE";
export const GAME_CONFIG_ID = "0x_YOUR_GAME_CONFIG_ID_HERE";
```

### Frontend Features

- **Wallet Connection**: Connect with any Sui-compatible wallet
- **Purchase Loot Boxes**: Buy multiple boxes at once with automatic refund for excess payment
- **Open Boxes**: Animated reveal experience when opening loot boxes
- **Inventory Management**: View all your loot boxes and items
- **Item Actions**: Transfer items to other addresses or burn unwanted items
- **Stats Dashboard**: View pity counter progress and drop rates
- **Responsive Design**: Works on desktop and mobile

## License

MIT License

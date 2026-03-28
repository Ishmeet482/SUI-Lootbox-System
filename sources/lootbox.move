/// Loot Box System with On-Chain Randomness
/// A gaming NFT system where players purchase loot boxes and receive randomly generated items
#[allow(lint(public_entry, self_transfer))]
module lootbox::lootbox {
    use sui::coin::{Self, Coin};
    use sui::sui::SUI;
    use sui::balance::{Self, Balance};
    use sui::random::{Self, Random};
    use sui::event;
    use sui::dynamic_field as df;

    // ============== Error Codes ==============
    const EInsufficientPayment: u64 = 0;
    const EInvalidRarityWeights: u64 = 1;

    // ============== Constants ==============
    const RARITY_COMMON: u8 = 0;
    const RARITY_RARE: u8 = 1;
    const RARITY_EPIC: u8 = 2;
    const RARITY_LEGENDARY: u8 = 3;

    const PITY_THRESHOLD: u64 = 30;

    // ============== Structs ==============

    /// Admin capability for privileged operations
    public struct AdminCap has key, store {
        id: UID,
    }

    /// Shared game configuration storing settings and treasury
    public struct GameConfig has key {
        id: UID,
        /// Price of a loot box in SUI (in MIST, 1 SUI = 10^9 MIST)
        loot_box_price: u64,
        /// Rarity weights: [common, rare, epic, legendary]
        rarity_weights: vector<u8>,
        /// Treasury to collect payments
        treasury: Balance<SUI>,
        /// Total loot boxes sold
        total_boxes_sold: u64,
        /// Total items minted
        total_items_minted: u64,
    }

    /// Unopened loot box owned by a player
    public struct LootBox has key, store {
        id: UID,
        /// Box number for tracking
        box_number: u64,
    }

    /// Game item NFT with varying rarity and power
    public struct GameItem has key, store {
        id: UID,
        /// Item name based on rarity
        name: vector<u8>,
        /// Rarity tier: 0=Common, 1=Rare, 2=Epic, 3=Legendary
        rarity: u8,
        /// Power level within the rarity range
        power: u8,
        /// Item number for uniqueness
        item_number: u64,
    }

    /// Key for tracking pity counter per user (used with dynamic fields)
    public struct PityKey has copy, drop, store {
        user: address,
    }

    // ============== Events ==============

    /// Emitted when a loot box is opened
    public struct LootBoxOpened has copy, drop {
        item_id: ID,
        rarity: u8,
        rarity_name: vector<u8>,
        power: u8,
        owner: address,
        box_number: u64,
        item_number: u64,
    }

    /// Emitted when a loot box is purchased
    public struct LootBoxPurchased has copy, drop {
        box_id: ID,
        buyer: address,
        price: u64,
        box_number: u64,
    }

    /// Emitted when an item is burned
    public struct ItemBurned has copy, drop {
        item_id: ID,
        rarity: u8,
        power: u8,
        owner: address,
    }

    /// Emitted when pity system triggers
    public struct PityTriggered has copy, drop {
        user: address,
        boxes_opened: u64,
    }

    // ============== Initialization ==============

    /// One-time initializer creating shared GameConfig with default settings
    fun init(ctx: &mut TxContext) {
        // Create admin capability and transfer to deployer
        let admin_cap = AdminCap {
            id: object::new(ctx),
        };
        transfer::transfer(admin_cap, ctx.sender());

        // Default rarity weights: Common=60, Rare=25, Epic=12, Legendary=3
        let rarity_weights = vector[60u8, 25u8, 12u8, 3u8];

        // Create shared game config
        let game_config = GameConfig {
            id: object::new(ctx),
            loot_box_price: 100_000_000, // 0.1 SUI default price
            rarity_weights,
            treasury: balance::zero(),
            total_boxes_sold: 0,
            total_items_minted: 0,
        };
        transfer::share_object(game_config);
    }

    // ============== Public Functions ==============

    /// Purchase a loot box by paying the required amount of SUI
    public fun purchase_loot_box(
        config: &mut GameConfig,
        payment: Coin<SUI>,
        ctx: &mut TxContext,
    ): LootBox {
        let payment_amount = coin::value(&payment);
        assert!(payment_amount >= config.loot_box_price, EInsufficientPayment);

        // Handle exact payment or refund excess
        if (payment_amount > config.loot_box_price) {
            let mut payment_balance = coin::into_balance(payment);
            let exact_payment = balance::split(&mut payment_balance, config.loot_box_price);
            balance::join(&mut config.treasury, exact_payment);
            
            // Refund excess
            let refund = coin::from_balance(payment_balance, ctx);
            transfer::public_transfer(refund, ctx.sender());
        } else {
            balance::join(&mut config.treasury, coin::into_balance(payment));
        };

        config.total_boxes_sold = config.total_boxes_sold + 1;

        let loot_box = LootBox {
            id: object::new(ctx),
            box_number: config.total_boxes_sold,
        };

        event::emit(LootBoxPurchased {
            box_id: object::id(&loot_box),
            buyer: ctx.sender(),
            price: config.loot_box_price,
            box_number: config.total_boxes_sold,
        });

        loot_box
    }

    /// Entry function to purchase and receive loot box directly
    public entry fun purchase_loot_box_entry(
        config: &mut GameConfig,
        payment: Coin<SUI>,
        ctx: &mut TxContext,
    ) {
        let loot_box = purchase_loot_box(config, payment, ctx);
        transfer::transfer(loot_box, ctx.sender());
    }

    /// Opens loot box using sui::random. Mints GameItem NFT. Burns LootBox.
    /// MUST be entry function for secure randomness consumption
    entry fun open_loot_box(
        config: &mut GameConfig,
        loot_box: LootBox,
        r: &Random,
        ctx: &mut TxContext,
    ) {
        let LootBox { id, box_number } = loot_box;
        object::delete(id);

        let owner = ctx.sender();
        
        // Create random generator within this function (CRITICAL: never pass as argument)
        let mut generator = random::new_generator(r, ctx);
        
        // Check pity system first
        let pity_key = PityKey { user: owner };
        let pity_count = if (df::exists_(&config.id, pity_key)) {
            *df::borrow<PityKey, u64>(&config.id, pity_key)
        } else {
            0
        };

        // Determine rarity
        let rarity = if (pity_count >= PITY_THRESHOLD) {
            // Pity triggered - guaranteed Legendary
            event::emit(PityTriggered {
                user: owner,
                boxes_opened: pity_count + 1,
            });
            RARITY_LEGENDARY
        } else {
            // Normal random roll
            let roll = random::generate_u8_in_range(&mut generator, 0, 99);
            determine_rarity(&config.rarity_weights, roll)
        };

        // Update pity counter
        if (rarity == RARITY_LEGENDARY) {
            // Reset pity counter on Legendary
            if (df::exists_(&config.id, pity_key)) {
                let counter = df::borrow_mut<PityKey, u64>(&mut config.id, pity_key);
                *counter = 0;
            };
        } else {
            // Increment pity counter
            if (df::exists_(&config.id, pity_key)) {
                let counter = df::borrow_mut<PityKey, u64>(&mut config.id, pity_key);
                *counter = *counter + 1;
            } else {
                df::add(&mut config.id, pity_key, 1u64);
            };
        };

        // Generate power based on rarity
        let power = generate_power(&mut generator, rarity);

        // Generate item name
        let name = get_item_name(rarity);

        config.total_items_minted = config.total_items_minted + 1;

        let item = GameItem {
            id: object::new(ctx),
            name,
            rarity,
            power,
            item_number: config.total_items_minted,
        };

        let rarity_name = get_rarity_name(rarity);

        event::emit(LootBoxOpened {
            item_id: object::id(&item),
            rarity,
            rarity_name,
            power,
            owner,
            box_number,
            item_number: config.total_items_minted,
        });

        transfer::transfer(item, owner);
    }

    /// View function returning item's name, rarity tier, and power level
    public fun get_item_stats(item: &GameItem): (vector<u8>, u8, u8) {
        (item.name, item.rarity, item.power)
    }

    /// Get item name
    public fun get_item_name_view(item: &GameItem): vector<u8> {
        item.name
    }

    /// Get item rarity
    public fun get_item_rarity(item: &GameItem): u8 {
        item.rarity
    }

    /// Get item power
    public fun get_item_power(item: &GameItem): u8 {
        item.power
    }

    /// Get item number
    public fun get_item_number(item: &GameItem): u64 {
        item.item_number
    }

    /// Allows owner to transfer a GameItem to another address
    public entry fun transfer_item(item: GameItem, recipient: address) {
        transfer::public_transfer(item, recipient);
    }

    /// Owner can destroy an unwanted item
    public entry fun burn_item(item: GameItem, ctx: &TxContext) {
        let GameItem { id, name: _, rarity, power, item_number: _ } = item;
        
        event::emit(ItemBurned {
            item_id: object::uid_to_inner(&id),
            rarity,
            power,
            owner: ctx.sender(),
        });

        object::delete(id);
    }

    // ============== Admin Functions ==============

    /// Admin can adjust drop rates. Requires AdminCap.
    public entry fun update_rarity_weights(
        _admin: &AdminCap,
        config: &mut GameConfig,
        common: u8,
        rare: u8,
        epic: u8,
        legendary: u8,
    ) {
        // Weights must sum to 100
        let total = (common as u64) + (rare as u64) + (epic as u64) + (legendary as u64);
        assert!(total == 100, EInvalidRarityWeights);

        config.rarity_weights = vector[common, rare, epic, legendary];
    }

    /// Admin can update loot box price
    public fun update_price(
        _admin: &AdminCap,
        config: &mut GameConfig,
        new_price: u64,
    ) {
        config.loot_box_price = new_price;
    }

    /// Admin can withdraw treasury funds
    public fun withdraw_treasury(
        _admin: &AdminCap,
        config: &mut GameConfig,
        amount: u64,
        recipient: address,
        ctx: &mut TxContext,
    ) {
        let withdrawn = balance::split(&mut config.treasury, amount);
        let coin = coin::from_balance(withdrawn, ctx);
        transfer::public_transfer(coin, recipient);
    }

    // ============== View Functions ==============

    /// Get current loot box price
    public fun get_loot_box_price(config: &GameConfig): u64 {
        config.loot_box_price
    }

    /// Get current rarity weights
    public fun get_rarity_weights(config: &GameConfig): vector<u8> {
        config.rarity_weights
    }

    /// Get treasury balance
    public fun get_treasury_balance(config: &GameConfig): u64 {
        balance::value(&config.treasury)
    }

    /// Get total boxes sold
    public fun get_total_boxes_sold(config: &GameConfig): u64 {
        config.total_boxes_sold
    }

    /// Get total items minted
    public fun get_total_items_minted(config: &GameConfig): u64 {
        config.total_items_minted
    }

    /// Get user's pity counter
    public fun get_pity_counter(config: &GameConfig, user: address): u64 {
        let pity_key = PityKey { user };
        if (df::exists_(&config.id, pity_key)) {
            *df::borrow<PityKey, u64>(&config.id, pity_key)
        } else {
            0
        }
    }

    // ============== Internal Functions ==============

    /// Determine rarity based on random roll and weights
    fun determine_rarity(weights: &vector<u8>, roll: u8): u8 {
        let common_threshold = *vector::borrow(weights, 0);
        let rare_threshold = common_threshold + *vector::borrow(weights, 1);
        let epic_threshold = rare_threshold + *vector::borrow(weights, 2);

        if (roll < common_threshold) {
            RARITY_COMMON
        } else if (roll < rare_threshold) {
            RARITY_RARE
        } else if (roll < epic_threshold) {
            RARITY_EPIC
        } else {
            RARITY_LEGENDARY
        }
    }

    /// Generate power level based on rarity
    /// Common: 1-10, Rare: 11-25, Epic: 26-40, Legendary: 41-50
    fun generate_power(generator: &mut random::RandomGenerator, rarity: u8): u8 {
        if (rarity == RARITY_COMMON) {
            random::generate_u8_in_range(generator, 1, 10)
        } else if (rarity == RARITY_RARE) {
            random::generate_u8_in_range(generator, 11, 25)
        } else if (rarity == RARITY_EPIC) {
            random::generate_u8_in_range(generator, 26, 40)
        } else {
            random::generate_u8_in_range(generator, 41, 50)
        }
    }

    /// Get item name based on rarity
    fun get_item_name(rarity: u8): vector<u8> {
        if (rarity == RARITY_COMMON) {
            b"Common Sword"
        } else if (rarity == RARITY_RARE) {
            b"Rare Blade"
        } else if (rarity == RARITY_EPIC) {
            b"Epic Excalibur"
        } else {
            b"Legendary Dragon Slayer"
        }
    }

    /// Get rarity name as bytes
    fun get_rarity_name(rarity: u8): vector<u8> {
        if (rarity == RARITY_COMMON) {
            b"Common"
        } else if (rarity == RARITY_RARE) {
            b"Rare"
        } else if (rarity == RARITY_EPIC) {
            b"Epic"
        } else {
            b"Legendary"
        }
    }

    // ============== Test Functions ==============
    #[test_only]
    public fun init_game_for_testing(ctx: &mut TxContext) {
        init(ctx)
    }

    #[test_only]
    public fun init_for_testing(ctx: &mut TxContext) {
        init(ctx)
    }

    #[test_only]
    public fun create_loot_box_for_testing(config: &mut GameConfig, ctx: &mut TxContext): LootBox {
        config.total_boxes_sold = config.total_boxes_sold + 1;
        LootBox {
            id: object::new(ctx),
            box_number: config.total_boxes_sold,
        }
    }

    #[test_only]
    public fun determine_rarity_for_testing(weights: &vector<u8>, roll: u8): u8 {
        determine_rarity(weights, roll)
    }
}

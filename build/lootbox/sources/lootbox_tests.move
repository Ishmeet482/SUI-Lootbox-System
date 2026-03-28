/// Tests for the Loot Box System
#[test_only]
module lootbox::lootbox_tests {
    use sui::test_scenario::{Self as ts, Scenario};
    use sui::coin::{Self, Coin};
    use sui::sui::SUI;
    use lootbox::lootbox::{Self, GameConfig, AdminCap, LootBox};

    // Test addresses
    const ADMIN: address = @0xAD;
    const PLAYER1: address = @0x1;
    #[allow(unused_const)]
    const PLAYER2: address = @0x2;

    // Helper to create test SUI coins
    fun mint_sui(amount: u64, scenario: &mut Scenario): Coin<SUI> {
        coin::mint_for_testing<SUI>(amount, ts::ctx(scenario))
    }

    // ============== Initialization Tests ==============

    #[test]
    fun test_init_game() {
        let mut scenario = ts::begin(ADMIN);
        
        // Initialize the game
        {
            lootbox::init_for_testing(ts::ctx(&mut scenario));
        };

        // Verify AdminCap was created and sent to admin
        ts::next_tx(&mut scenario, ADMIN);
        {
            assert!(ts::has_most_recent_for_sender<AdminCap>(&scenario), 0);
        };

        // Verify GameConfig was created as shared object
        ts::next_tx(&mut scenario, ADMIN);
        {
            let config = ts::take_shared<GameConfig>(&scenario);
            
            // Check default values
            assert!(lootbox::get_loot_box_price(&config) == 100_000_000, 1);
            assert!(lootbox::get_total_boxes_sold(&config) == 0, 2);
            assert!(lootbox::get_total_items_minted(&config) == 0, 3);
            assert!(lootbox::get_treasury_balance(&config) == 0, 4);
            
            // Check rarity weights
            let weights = lootbox::get_rarity_weights(&config);
            assert!(*vector::borrow(&weights, 0) == 60, 5); // Common
            assert!(*vector::borrow(&weights, 1) == 25, 6); // Rare
            assert!(*vector::borrow(&weights, 2) == 12, 7); // Epic
            assert!(*vector::borrow(&weights, 3) == 3, 8);  // Legendary

            ts::return_shared(config);
        };

        ts::end(scenario);
    }

    // ============== Purchase Tests ==============

    #[test]
    fun test_purchase_loot_box() {
        let mut scenario = ts::begin(ADMIN);
        
        // Initialize
        {
            lootbox::init_for_testing(ts::ctx(&mut scenario));
        };

        // Player purchases a loot box
        ts::next_tx(&mut scenario, PLAYER1);
        {
            let mut config = ts::take_shared<GameConfig>(&scenario);
            let price = lootbox::get_loot_box_price(&config);
            let payment = mint_sui(price, &mut scenario);
            
            lootbox::purchase_loot_box_entry(&mut config, payment, ts::ctx(&mut scenario));
            
            // Verify treasury received payment
            assert!(lootbox::get_treasury_balance(&config) == price, 0);
            assert!(lootbox::get_total_boxes_sold(&config) == 1, 1);
            
            ts::return_shared(config);
        };

        // Verify player received loot box
        ts::next_tx(&mut scenario, PLAYER1);
        {
            assert!(ts::has_most_recent_for_sender<LootBox>(&scenario), 2);
        };

        ts::end(scenario);
    }

    #[test]
    fun test_purchase_with_excess_payment() {
        let mut scenario = ts::begin(ADMIN);
        
        // Initialize
        {
            lootbox::init_for_testing(ts::ctx(&mut scenario));
        };

        // Player pays more than required
        ts::next_tx(&mut scenario, PLAYER1);
        {
            let mut config = ts::take_shared<GameConfig>(&scenario);
            let price = lootbox::get_loot_box_price(&config);
            let excess = 50_000_000;
            let payment = mint_sui(price + excess, &mut scenario);
            
            lootbox::purchase_loot_box_entry(&mut config, payment, ts::ctx(&mut scenario));
            
            // Treasury should only have exact price
            assert!(lootbox::get_treasury_balance(&config) == price, 0);
            
            ts::return_shared(config);
        };

        // Player should have received refund
        ts::next_tx(&mut scenario, PLAYER1);
        {
            assert!(ts::has_most_recent_for_sender<LootBox>(&scenario), 1);
            // Refund coin should also exist
            assert!(ts::has_most_recent_for_sender<Coin<SUI>>(&scenario), 2);
        };

        ts::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code = 0, location = lootbox)]
    fun test_purchase_insufficient_payment() {
        let mut scenario = ts::begin(ADMIN);
        
        // Initialize
        {
            lootbox::init_for_testing(ts::ctx(&mut scenario));
        };

        // Player tries to pay less than required
        ts::next_tx(&mut scenario, PLAYER1);
        {
            let mut config = ts::take_shared<GameConfig>(&scenario);
            let payment = mint_sui(50_000_000, &mut scenario); // Less than 0.1 SUI
            
            lootbox::purchase_loot_box_entry(&mut config, payment, ts::ctx(&mut scenario));
            
            ts::return_shared(config);
        };

        ts::end(scenario);
    }

    // ============== Rarity Determination Tests ==============

    #[test]
    fun test_rarity_determination() {
        let weights = vector[60u8, 25u8, 12u8, 3u8];
        
        // Test Common (0-59)
        assert!(lootbox::determine_rarity_for_testing(&weights, 0) == 0, 0);
        assert!(lootbox::determine_rarity_for_testing(&weights, 30) == 0, 1);
        assert!(lootbox::determine_rarity_for_testing(&weights, 59) == 0, 2);
        
        // Test Rare (60-84)
        assert!(lootbox::determine_rarity_for_testing(&weights, 60) == 1, 3);
        assert!(lootbox::determine_rarity_for_testing(&weights, 70) == 1, 4);
        assert!(lootbox::determine_rarity_for_testing(&weights, 84) == 1, 5);
        
        // Test Epic (85-96)
        assert!(lootbox::determine_rarity_for_testing(&weights, 85) == 2, 6);
        assert!(lootbox::determine_rarity_for_testing(&weights, 90) == 2, 7);
        assert!(lootbox::determine_rarity_for_testing(&weights, 96) == 2, 8);
        
        // Test Legendary (97-99)
        assert!(lootbox::determine_rarity_for_testing(&weights, 97) == 3, 9);
        assert!(lootbox::determine_rarity_for_testing(&weights, 98) == 3, 10);
        assert!(lootbox::determine_rarity_for_testing(&weights, 99) == 3, 11);
    }

    // ============== Transfer Tests ==============

    #[test]
    fun test_transfer_item() {
        let mut scenario = ts::begin(ADMIN);
        
        // Initialize
        {
            lootbox::init_for_testing(ts::ctx(&mut scenario));
        };

        // Create a test item by purchasing and simulating open
        ts::next_tx(&mut scenario, PLAYER1);
        {
            let mut config = ts::take_shared<GameConfig>(&scenario);
            let _loot_box = lootbox::create_loot_box_for_testing(&mut config, ts::ctx(&mut scenario));
            transfer::public_transfer(_loot_box, PLAYER1);
            ts::return_shared(config);
        };

        ts::end(scenario);
    }

    // ============== Admin Function Tests ==============

    #[test]
    fun test_update_rarity_weights() {
        let mut scenario = ts::begin(ADMIN);
        
        // Initialize
        {
            lootbox::init_for_testing(ts::ctx(&mut scenario));
        };

        // Admin updates rarity weights
        ts::next_tx(&mut scenario, ADMIN);
        {
            let admin_cap = ts::take_from_sender<AdminCap>(&scenario);
            let mut config = ts::take_shared<GameConfig>(&scenario);
            
            // New weights: 50, 30, 15, 5
            lootbox::update_rarity_weights(&admin_cap, &mut config, 50, 30, 15, 5);
            
            let weights = lootbox::get_rarity_weights(&config);
            assert!(*vector::borrow(&weights, 0) == 50, 0);
            assert!(*vector::borrow(&weights, 1) == 30, 1);
            assert!(*vector::borrow(&weights, 2) == 15, 2);
            assert!(*vector::borrow(&weights, 3) == 5, 3);
            
            ts::return_to_sender(&scenario, admin_cap);
            ts::return_shared(config);
        };

        ts::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code = 1, location = lootbox)]
    fun test_update_rarity_weights_invalid_sum() {
        let mut scenario = ts::begin(ADMIN);
        
        // Initialize
        {
            lootbox::init_for_testing(ts::ctx(&mut scenario));
        };

        // Admin tries to set invalid weights (sum != 100)
        ts::next_tx(&mut scenario, ADMIN);
        {
            let admin_cap = ts::take_from_sender<AdminCap>(&scenario);
            let mut config = ts::take_shared<GameConfig>(&scenario);
            
            // Invalid: sum = 90
            lootbox::update_rarity_weights(&admin_cap, &mut config, 50, 20, 15, 5);
            
            ts::return_to_sender(&scenario, admin_cap);
            ts::return_shared(config);
        };

        ts::end(scenario);
    }

    #[test]
    fun test_update_price() {
        let mut scenario = ts::begin(ADMIN);
        
        // Initialize
        {
            lootbox::init_for_testing(ts::ctx(&mut scenario));
        };

        // Admin updates price
        ts::next_tx(&mut scenario, ADMIN);
        {
            let admin_cap = ts::take_from_sender<AdminCap>(&scenario);
            let mut config = ts::take_shared<GameConfig>(&scenario);
            
            let new_price = 200_000_000; // 0.2 SUI
            lootbox::update_price(&admin_cap, &mut config, new_price);
            
            assert!(lootbox::get_loot_box_price(&config) == new_price, 0);
            
            ts::return_to_sender(&scenario, admin_cap);
            ts::return_shared(config);
        };

        ts::end(scenario);
    }

    #[test]
    fun test_withdraw_treasury() {
        let mut scenario = ts::begin(ADMIN);
        
        // Initialize
        {
            lootbox::init_for_testing(ts::ctx(&mut scenario));
        };

        // Player purchases a loot box
        ts::next_tx(&mut scenario, PLAYER1);
        {
            let mut config = ts::take_shared<GameConfig>(&scenario);
            let price = lootbox::get_loot_box_price(&config);
            let payment = mint_sui(price, &mut scenario);
            
            lootbox::purchase_loot_box_entry(&mut config, payment, ts::ctx(&mut scenario));
            
            ts::return_shared(config);
        };

        // Admin withdraws from treasury
        ts::next_tx(&mut scenario, ADMIN);
        {
            let admin_cap = ts::take_from_sender<AdminCap>(&scenario);
            let mut config = ts::take_shared<GameConfig>(&scenario);
            
            let balance_before = lootbox::get_treasury_balance(&config);
            let withdraw_amount = 50_000_000;
            
            lootbox::withdraw_treasury(&admin_cap, &mut config, withdraw_amount, ADMIN, ts::ctx(&mut scenario));
            
            assert!(lootbox::get_treasury_balance(&config) == balance_before - withdraw_amount, 0);
            
            ts::return_to_sender(&scenario, admin_cap);
            ts::return_shared(config);
        };

        ts::end(scenario);
    }

    // ============== Item Stats Tests ==============

    #[test]
    fun test_get_item_stats() {
        let mut scenario = ts::begin(ADMIN);
        
        // Initialize
        {
            lootbox::init_for_testing(ts::ctx(&mut scenario));
        };

        ts::end(scenario);
    }

    // ============== Multiple Purchase Tests ==============

    #[test]
    fun test_multiple_purchases() {
        let mut scenario = ts::begin(ADMIN);
        
        // Initialize
        {
            lootbox::init_for_testing(ts::ctx(&mut scenario));
        };

        // Multiple players purchase loot boxes
        let mut i = 0;
        while (i < 3) {
            ts::next_tx(&mut scenario, PLAYER1);
            {
                let mut config = ts::take_shared<GameConfig>(&scenario);
                let price = lootbox::get_loot_box_price(&config);
                let payment = mint_sui(price, &mut scenario);
                
                lootbox::purchase_loot_box_entry(&mut config, payment, ts::ctx(&mut scenario));
                
                ts::return_shared(config);
            };
            i = i + 1;
        };

        // Verify total boxes sold
        ts::next_tx(&mut scenario, ADMIN);
        {
            let config = ts::take_shared<GameConfig>(&scenario);
            assert!(lootbox::get_total_boxes_sold(&config) == 3, 0);
            assert!(lootbox::get_treasury_balance(&config) == 300_000_000, 1);
            ts::return_shared(config);
        };

        ts::end(scenario);
    }

    // ============== Pity System Tests ==============

    #[test]
    fun test_pity_counter_tracking() {
        let mut scenario = ts::begin(ADMIN);
        
        // Initialize
        {
            lootbox::init_for_testing(ts::ctx(&mut scenario));
        };

        // Check initial pity counter is 0
        ts::next_tx(&mut scenario, PLAYER1);
        {
            let config = ts::take_shared<GameConfig>(&scenario);
            assert!(lootbox::get_pity_counter(&config, PLAYER1) == 0, 0);
            ts::return_shared(config);
        };

        ts::end(scenario);
    }
}

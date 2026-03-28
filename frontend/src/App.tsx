import { useState } from "react";
import { Package, Sparkles, RefreshCw, ShoppingCart, Sword, Send, Flame, Zap, Target, BarChart3, Shield, Users, Settings, Wallet, TrendingUp, LogOut, Lock } from "lucide-react";
import type { GameItem, LootBox } from "./types";
import { RARITY_NAMES, LOOT_BOX_PRICE_SUI } from "./constants";

type UserRole = "admin" | "user" | null;

// Demo credentials
const CREDENTIALS = {
  admin: { username: "admin", password: "admin123" },
  user: { username: "player", password: "player123" },
};

function App() {
  // Auth state
  const [role, setRole] = useState<UserRole>(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginType, setLoginType] = useState<"admin" | "user">("user");
  
  // Demo mode - no wallet connection needed
  const [balance, setBalance] = useState(100);
  const [lootBoxes, setLootBoxes] = useState<LootBox[]>([]);
  const [items, setItems] = useState<GameItem[]>([]);
  const [pityCounter, setPityCounter] = useState(0);
  const [totalBoxesSold, setTotalBoxesSold] = useState(0);
  const [rarityWeights, setRarityWeights] = useState([60, 25, 12, 3]);
  const [lootBoxPrice, setLootBoxPrice] = useState(LOOT_BOX_PRICE_SUI);
  const [treasury, setTreasury] = useState(0);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isOpening, setIsOpening] = useState(false);
  const [isTransferring, setIsTransferring] = useState(false);
  const [openingBoxId, setOpeningBoxId] = useState<string | null>(null);
  const [revealedItem, setRevealedItem] = useState<GameItem | null>(null);
  const [showReveal, setShowReveal] = useState(false);

  const [quantity, setQuantity] = useState(1);
  const [transferModalItem, setTransferModalItem] = useState<GameItem | null>(null);
  const [transferAddress, setTransferAddress] = useState("");
  
  // Admin edit states
  const [editWeights, setEditWeights] = useState([60, 25, 12, 3]);
  const [editPrice, setEditPrice] = useState(LOOT_BOX_PRICE_SUI);
  const [isUpdating, setIsUpdating] = useState(false);

  const totalCost = quantity * lootBoxPrice;
  const canAfford = balance >= totalCost;

  // Login handler
  const handleLogin = () => {
    const creds = CREDENTIALS[loginType];
    if (username === creds.username && password === creds.password) {
      setRole(loginType);
      setLoginError("");
      setUsername("");
      setPassword("");
    } else {
      setLoginError("Invalid username or password");
    }
  };

  // Logout handler
  const handleLogout = () => {
    setRole(null);
    setUsername("");
    setPassword("");
    setLoginError("");
  };

  // Demo handlers - simulate blockchain actions
  const handlePurchase = async () => {
    if (!canAfford) return;
    setIsPurchasing(true);
    await new Promise(r => setTimeout(r, 1500));
    const newBoxes: LootBox[] = [];
    for (let i = 0; i < quantity; i++) {
      newBoxes.push({ id: `box-${Date.now()}-${i}`, boxNumber: totalBoxesSold + i + 1 });
    }
    setLootBoxes([...lootBoxes, ...newBoxes]);
    setBalance(balance - totalCost);
    setTreasury(treasury + totalCost);
    setTotalBoxesSold(totalBoxesSold + quantity);
    setIsPurchasing(false);
  };

  // Admin handlers
  const handleUpdateWeights = async () => {
    const sum = editWeights.reduce((a, b) => a + b, 0);
    if (sum !== 100) {
      alert("Weights must sum to 100!");
      return;
    }
    setIsUpdating(true);
    await new Promise(r => setTimeout(r, 1000));
    setRarityWeights([...editWeights]);
    setIsUpdating(false);
    alert("Rarity weights updated! (Demo)");
  };

  const handleUpdatePrice = async () => {
    if (editPrice <= 0) {
      alert("Price must be greater than 0!");
      return;
    }
    setIsUpdating(true);
    await new Promise(r => setTimeout(r, 1000));
    setLootBoxPrice(editPrice);
    setIsUpdating(false);
    alert("Loot box price updated! (Demo)");
  };

  const handleWithdrawTreasury = async () => {
    if (treasury <= 0) {
      alert("Treasury is empty!");
      return;
    }
    setIsUpdating(true);
    await new Promise(r => setTimeout(r, 1000));
    const amount = treasury;
    setTreasury(0);
    setIsUpdating(false);
    alert(`Withdrawn ${amount.toFixed(2)} SUI from treasury! (Demo)`);
  };

  const handleOpenBox = async (box: LootBox) => {
    setIsOpening(true);
    setOpeningBoxId(box.id);
    await new Promise(r => setTimeout(r, 2000));
    
    // Random item generation with pity system
    let rarity: number;
    if (pityCounter >= 29) {
      // Guaranteed Legendary at 30 opens without one
      rarity = 3;
    } else {
      const rarities = [0, 0, 0, 0, 0, 0, 1, 1, 1, 2, 2, 3]; // weighted
      rarity = rarities[Math.floor(Math.random() * rarities.length)];
    }
    const names = [
      ["Iron Sword", "Wooden Shield", "Cloth Armor", "Basic Staff"],
      ["Steel Blade", "Knight Shield", "Chain Mail", "Magic Wand"],
      ["Mystic Sword", "Dragon Shield", "Plate Armor", "Arcane Staff"],
      ["Legendary Excalibur", "Divine Aegis", "Celestial Armor", "Staff of Eternity"]
    ];
    const powerRanges = [[1, 10], [11, 25], [26, 40], [41, 50]];
    const [minP, maxP] = powerRanges[rarity];
    
    const newItem: GameItem = {
      id: `item-${Date.now()}`,
      name: names[rarity][Math.floor(Math.random() * names[rarity].length)],
      rarity,
      power: Math.floor(Math.random() * (maxP - minP + 1)) + minP,
      itemNumber: items.length + 1,
    };
    
    setLootBoxes(lootBoxes.filter(b => b.id !== box.id));
    setItems([...items, newItem]);
    setRevealedItem(newItem);
    setShowReveal(true);
    setIsOpening(false);
    setOpeningBoxId(null);
    
    // Update pity counter - reset on Legendary, increment otherwise
    if (rarity === 3) {
      setPityCounter(0);
    } else {
      setPityCounter(prev => prev + 1);
    }
  };

  const handleTransfer = async () => {
    if (transferModalItem && transferAddress) {
      setIsTransferring(true);
      await new Promise(r => setTimeout(r, 1500));
      setItems(items.filter(i => i.id !== transferModalItem.id));
      setTransferModalItem(null);
      setTransferAddress("");
      setIsTransferring(false);
      alert("Item transferred successfully! (Demo)");
    }
  };

  const handleBurn = async (item: GameItem) => {
    if (window.confirm(`Burn "${item.name}"? This cannot be undone.`)) {
      await new Promise(r => setTimeout(r, 500));
      setItems(items.filter(i => i.id !== item.id));
    }
  };

  const closeReveal = () => {
    setShowReveal(false);
    setRevealedItem(null);
  };

  const refreshData = () => {
    // Demo - just show a message
    alert("Data refreshed! (Demo mode)");
  };

  const getRarityColor = (rarity: number) => {
    const colors = [
      "from-gray-500 to-gray-400 border-gray-400",
      "from-blue-600 to-blue-400 border-blue-400",
      "from-purple-600 to-purple-400 border-purple-400",
      "from-amber-500 to-yellow-400 border-yellow-400",
    ];
    return colors[rarity] || colors[0];
  };

  // If not logged in, show login screen
  if (!role) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-white/5 backdrop-blur rounded-2xl p-8 border border-white/10 w-full max-w-md">
          <div className="text-center mb-8">
            <div className="relative inline-block mb-4">
              <Package className="w-16 h-16 text-purple-400" />
              <Sparkles className="absolute -top-1 -right-1 w-6 h-6 text-yellow-400" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Loot Box</h1>
            <p className="text-gray-400">Powered by Sui • Demo Mode</p>
          </div>

          {/* Login Type Tabs */}
          <div className="flex bg-black/30 rounded-xl p-1 mb-6 border border-white/10">
            <button
              onClick={() => setLoginType("user")}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-medium transition-all ${
                loginType === "user" ? "bg-purple-600 text-white" : "text-gray-400 hover:text-white"
              }`}
            >
              <Users className="w-4 h-4" /> Player
            </button>
            <button
              onClick={() => setLoginType("admin")}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-medium transition-all ${
                loginType === "admin" ? "bg-amber-600 text-white" : "text-gray-400 hover:text-white"
              }`}
            >
              <Shield className="w-4 h-4" /> Admin
            </button>
          </div>

          {/* Login Form */}
          <div className="space-y-4">
            <div>
              <label className="text-gray-400 text-sm mb-2 block">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={loginType === "admin" ? "admin" : "player"}
                className="w-full bg-black/30 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-500"
              />
            </div>
            <div>
              <label className="text-gray-400 text-sm mb-2 block">Password</label>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-black/30 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-500"
                  onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                />
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              </div>
            </div>

            {loginError && (
              <p className="text-red-400 text-sm text-center">{loginError}</p>
            )}

            <button
              onClick={handleLogin}
              className={`w-full py-3 rounded-xl font-bold text-white ${
                loginType === "admin"
                  ? "bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500"
                  : "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500"
              }`}
            >
              Login as {loginType === "admin" ? "Admin" : "Player"}
            </button>
          </div>

        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-black/20 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Package className="w-10 h-10 text-purple-400" />
              <Sparkles className="absolute -top-1 -right-1 w-4 h-4 text-yellow-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Loot Box</h1>
              <p className="text-xs text-gray-400">Powered by Sui • Demo Mode</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={refreshData} className="p-2 text-gray-400 hover:text-white">
              <RefreshCw className="w-5 h-5" />
            </button>
            {/* User Badge & Logout */}
            <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border ${
              role === "admin" 
                ? "bg-amber-500/20 text-amber-400 border-amber-500/30" 
                : "bg-purple-500/20 text-purple-400 border-purple-500/30"
            }`}>
              {role === "admin" ? <Shield className="w-4 h-4" /> : <Users className="w-4 h-4" />}
              <span className="font-medium">{role === "admin" ? "Admin" : "Player"}</span>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-red-500/20 text-red-400 rounded-xl border border-red-500/30 hover:bg-red-500/30"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {role === "admin" ? (
          /* Admin Panel */
          <div className="space-y-8">
            <div className="bg-gradient-to-r from-amber-900/30 to-orange-900/30 rounded-2xl p-6 border border-amber-500/30">
              <div className="flex items-center gap-3 mb-2">
                <Shield className="w-8 h-8 text-amber-400" />
                <h2 className="text-2xl font-bold text-white">Admin Panel</h2>
              </div>
              <p className="text-amber-200/70">Manage game configuration with AdminCap privileges</p>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              {/* Treasury */}
              <div className="bg-white/5 backdrop-blur rounded-2xl p-6 border border-white/10">
                <div className="flex items-center gap-3 mb-6">
                  <Wallet className="w-6 h-6 text-green-400" />
                  <h3 className="text-xl font-bold text-white">Treasury</h3>
                </div>
                <div className="space-y-4">
                  <div className="bg-black/20 rounded-lg p-4">
                    <p className="text-gray-400 text-sm">Current Balance</p>
                    <p className="text-3xl font-bold text-green-400">{treasury.toFixed(4)} SUI</p>
                  </div>
                  <div className="bg-black/20 rounded-lg p-4">
                    <p className="text-gray-400 text-sm">Total Boxes Sold</p>
                    <p className="text-2xl font-bold text-white">{totalBoxesSold}</p>
                  </div>
                  <button
                    onClick={handleWithdrawTreasury}
                    disabled={isUpdating || treasury <= 0}
                    className={`w-full py-3 rounded-xl font-bold ${
                      isUpdating || treasury <= 0
                        ? "bg-gray-600 text-gray-400"
                        : "bg-green-600 hover:bg-green-500 text-white"
                    }`}
                  >
                    {isUpdating ? "Processing..." : "Withdraw Treasury"}
                  </button>
                </div>
              </div>

              {/* Update Price */}
              <div className="bg-white/5 backdrop-blur rounded-2xl p-6 border border-white/10">
                <div className="flex items-center gap-3 mb-6">
                  <TrendingUp className="w-6 h-6 text-blue-400" />
                  <h3 className="text-xl font-bold text-white">Loot Box Price</h3>
                </div>
                <div className="space-y-4">
                  <div className="bg-black/20 rounded-lg p-4">
                    <p className="text-gray-400 text-sm">Current Price</p>
                    <p className="text-2xl font-bold text-white">{lootBoxPrice} SUI</p>
                  </div>
                  <div className="bg-black/20 rounded-lg p-4">
                    <label className="text-gray-400 text-sm">New Price (SUI)</label>
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={editPrice}
                      onChange={(e) => setEditPrice(parseFloat(e.target.value) || 0)}
                      className="w-full mt-2 bg-black/30 border border-white/20 rounded-lg px-4 py-2 text-white"
                    />
                  </div>
                  <button
                    onClick={handleUpdatePrice}
                    disabled={isUpdating}
                    className={`w-full py-3 rounded-xl font-bold ${
                      isUpdating ? "bg-gray-600 text-gray-400" : "bg-blue-600 hover:bg-blue-500 text-white"
                    }`}
                  >
                    {isUpdating ? "Updating..." : "Update Price"}
                  </button>
                </div>
              </div>
            </div>

            {/* Rarity Weights */}
            <div className="bg-white/5 backdrop-blur rounded-2xl p-6 border border-white/10">
              <div className="flex items-center gap-3 mb-6">
                <Settings className="w-6 h-6 text-purple-400" />
                <h3 className="text-xl font-bold text-white">Rarity Weights</h3>
                <span className="text-gray-400 text-sm">(Must sum to 100)</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {["Common", "Rare", "Epic", "Legendary"].map((tier, i) => (
                  <div key={tier} className="bg-black/20 rounded-lg p-4">
                    <label className={`text-sm font-medium ${
                      ["text-gray-400", "text-blue-400", "text-purple-400", "text-yellow-400"][i]
                    }`}>{tier}</label>
                    <div className="flex items-center gap-2 mt-2">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={editWeights[i]}
                        onChange={(e) => {
                          const newWeights = [...editWeights];
                          newWeights[i] = parseInt(e.target.value) || 0;
                          setEditWeights(newWeights);
                        }}
                        className="w-full bg-black/30 border border-white/20 rounded-lg px-3 py-2 text-white text-center"
                      />
                      <span className="text-gray-400">%</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Current: {rarityWeights[i]}%</p>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between">
                <p className={`text-sm ${editWeights.reduce((a, b) => a + b, 0) === 100 ? "text-green-400" : "text-red-400"}`}>
                  Total: {editWeights.reduce((a, b) => a + b, 0)}%
                </p>
                <button
                  onClick={handleUpdateWeights}
                  disabled={isUpdating || editWeights.reduce((a, b) => a + b, 0) !== 100}
                  className={`px-6 py-3 rounded-xl font-bold ${
                    isUpdating || editWeights.reduce((a, b) => a + b, 0) !== 100
                      ? "bg-gray-600 text-gray-400"
                      : "bg-purple-600 hover:bg-purple-500 text-white"
                  }`}
                >
                  {isUpdating ? "Updating..." : "Update Weights"}
                </button>
              </div>
            </div>

            {/* Game Stats Overview */}
            <div className="bg-white/5 backdrop-blur rounded-2xl p-6 border border-white/10">
              <div className="flex items-center gap-3 mb-6">
                <BarChart3 className="w-6 h-6 text-purple-400" />
                <h3 className="text-xl font-bold text-white">Current Game Configuration</h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-black/20 rounded-lg p-4 text-center">
                  <p className="text-gray-400 text-sm">Price</p>
                  <p className="text-xl font-bold text-white">{lootBoxPrice} SUI</p>
                </div>
                <div className="bg-black/20 rounded-lg p-4 text-center">
                  <p className="text-gray-400 text-sm">Total Sold</p>
                  <p className="text-xl font-bold text-white">{totalBoxesSold}</p>
                </div>
                <div className="bg-black/20 rounded-lg p-4 text-center">
                  <p className="text-gray-400 text-sm">Treasury</p>
                  <p className="text-xl font-bold text-green-400">{treasury.toFixed(2)} SUI</p>
                </div>
                <div className="bg-black/20 rounded-lg p-4 text-center">
                  <p className="text-gray-400 text-sm">Pity Threshold</p>
                  <p className="text-xl font-bold text-yellow-400">30</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Player View */
          <div className="space-y-8">
            {/* Purchase & Stats */}
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Purchase Section */}
              <div className="lg:col-span-2 bg-white/5 backdrop-blur rounded-2xl p-6 border border-white/10">
                <div className="flex items-center gap-3 mb-6">
                  <ShoppingCart className="w-6 h-6 text-purple-400" />
                  <h2 className="text-xl font-bold text-white">Purchase Loot Boxes</h2>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex justify-between bg-black/20 rounded-lg p-3">
                      <span className="text-gray-400">Price per box</span>
                      <span className="text-white font-bold">{lootBoxPrice} SUI</span>
                    </div>
                    <div className="flex justify-between bg-black/20 rounded-lg p-3">
                      <span className="text-gray-400">Your Balance</span>
                      <span className="text-green-400 font-bold">{balance.toFixed(4)} SUI</span>
                    </div>
                    <div className="flex justify-between bg-black/20 rounded-lg p-3">
                      <span className="text-gray-400">Total Sold</span>
                      <span className="text-white font-bold">{totalBoxesSold}</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="bg-black/20 rounded-lg p-3">
                      <label className="text-gray-400 text-sm">Quantity</label>
                      <div className="flex items-center gap-2 mt-2">
                        <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-10 h-10 bg-purple-600/50 hover:bg-purple-600 rounded-lg text-white font-bold">-</button>
                        <input type="number" min="1" max="10" value={quantity} onChange={(e) => setQuantity(Math.max(1, Math.min(10, parseInt(e.target.value) || 1)))} className="flex-1 bg-black/30 border border-white/20 rounded-lg px-3 py-2 text-white text-center font-bold" />
                        <button onClick={() => setQuantity(Math.min(10, quantity + 1))} className="w-10 h-10 bg-purple-600/50 hover:bg-purple-600 rounded-lg text-white font-bold">+</button>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Total</span>
                      <span className="text-2xl font-bold text-white">{totalCost.toFixed(2)} SUI</span>
                    </div>
                    <button onClick={handlePurchase} disabled={isPurchasing || !canAfford} className={`w-full py-3 rounded-xl font-bold ${isPurchasing || !canAfford ? "bg-gray-600 text-gray-400" : "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white"}`}>
                      {isPurchasing ? "Processing..." : !canAfford ? "Insufficient Balance" : `Buy ${quantity} Box${quantity > 1 ? "es" : ""}`}
                    </button>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="bg-white/5 backdrop-blur rounded-2xl p-6 border border-white/10">
                <div className="flex items-center gap-3 mb-4">
                  <BarChart3 className="w-6 h-6 text-purple-400" />
                  <h3 className="text-lg font-bold text-white">Stats</h3>
                </div>
                <div className="space-y-4">
                  <div className="bg-black/20 rounded-lg p-3">
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-400 flex items-center gap-2"><Target className="w-4 h-4" />Pity Counter</span>
                      <span className="text-white font-bold">{pityCounter}/30</span>
                    </div>
                    <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-purple-600 to-yellow-500" style={{ width: `${(pityCounter / 30) * 100}%` }} />
                    </div>
                    <p className="text-gray-500 text-xs mt-1">Guaranteed Legendary after 30!</p>
                  </div>
                  <div className="bg-black/20 rounded-lg p-3 grid grid-cols-2 gap-2 text-sm">
                    {["Common", "Rare", "Epic", "Legendary"].map((tier, i) => (
                      <div key={tier} className="flex justify-between">
                        <span className={`text-${["gray", "blue", "purple", "yellow"][i]}-400`}>{tier}</span>
                        <span className="text-white">{rarityWeights[i]}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Loot Boxes */}
            <div className="bg-white/5 backdrop-blur rounded-2xl p-6 border border-white/10">
              <div className="flex items-center gap-3 mb-6">
                <Package className="w-6 h-6 text-purple-400" />
                <h2 className="text-xl font-bold text-white">Your Loot Boxes ({lootBoxes.length})</h2>
              </div>
              {lootBoxes.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Package className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>No loot boxes yet. Purchase some above!</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {lootBoxes.map((box) => (
                    <div key={box.id} className="bg-gradient-to-br from-purple-900/50 to-indigo-900/50 rounded-xl p-4 border border-purple-500/50 text-center">
                      <Package className={`w-12 h-12 mx-auto text-purple-400 mb-2 ${isOpening && openingBoxId === box.id ? "animate-bounce" : ""}`} />
                      <p className="text-white text-sm mb-2">Box #{box.boxNumber}</p>
                      <button onClick={() => handleOpenBox(box)} disabled={isOpening} className={`w-full py-2 rounded-lg text-sm font-bold ${isOpening ? "bg-gray-600 text-gray-400" : "bg-purple-600 hover:bg-purple-500 text-white"}`}>
                        {isOpening && openingBoxId === box.id ? "Opening..." : "Open"}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Items */}
            <div className="bg-white/5 backdrop-blur rounded-2xl p-6 border border-white/10">
              <div className="flex items-center gap-3 mb-6">
                <Sword className="w-6 h-6 text-yellow-400" />
                <h2 className="text-xl font-bold text-white">Your Items ({items.length})</h2>
              </div>
              {items.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Sword className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>No items yet. Open some loot boxes!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {items.map((item) => (
                    <div key={item.id} className={`bg-gradient-to-br ${getRarityColor(item.rarity)} rounded-xl p-4 border-2`}>
                      <div className="flex justify-between items-start mb-2">
                        <Sword className="w-10 h-10 text-white" />
                        <span className="bg-white/20 text-white text-xs px-2 py-1 rounded">#{item.itemNumber}</span>
                      </div>
                      <h3 className="text-white font-bold">{item.name}</h3>
                      <p className="text-white/80 text-sm">{RARITY_NAMES[item.rarity]}</p>
                      <div className="flex items-center gap-1 mt-2 bg-black/20 rounded px-2 py-1 w-fit">
                        <Zap className="w-4 h-4 text-yellow-400" />
                        <span className="text-white font-bold">{item.power}</span>
                      </div>
                      <div className="flex gap-2 mt-3">
                        <button onClick={() => setTransferModalItem(item)} className="flex-1 py-2 bg-blue-600/80 hover:bg-blue-500 rounded text-white text-xs font-medium flex items-center justify-center gap-1">
                          <Send className="w-3 h-3" /> Transfer
                        </button>
                        <button onClick={() => handleBurn(item)} className="flex-1 py-2 bg-red-600/80 hover:bg-red-500 rounded text-white text-xs font-medium flex items-center justify-center gap-1">
                          <Flame className="w-3 h-3" /> Burn
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      <footer className="border-t border-white/10 mt-8">
        <div className="max-w-7xl mx-auto px-4 py-6 text-center text-gray-500 text-sm">
          Built with Sui Move • On-Chain Randomness • NFT Gaming
        </div>
      </footer>

      {/* Reveal Modal */}
      {showReveal && revealedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-8 max-w-sm w-full text-center border border-white/20">
            <h2 className="text-2xl font-bold text-white mb-4">You Got!</h2>
            <div className={`bg-gradient-to-br ${getRarityColor(revealedItem.rarity)} rounded-xl p-6 border-2 mb-4`}>
              <Sword className="w-16 h-16 text-white mx-auto mb-2" />
              <h3 className="text-white font-bold text-lg">{revealedItem.name}</h3>
              <p className="text-white/80">{RARITY_NAMES[revealedItem.rarity]}</p>
              <div className="flex items-center justify-center gap-1 mt-2">
                <Zap className="w-5 h-5 text-yellow-400" />
                <span className="text-white font-bold text-xl">{revealedItem.power}</span>
              </div>
            </div>
            <button onClick={closeReveal} className="px-8 py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl">
              Awesome!
            </button>
          </div>
        </div>
      )}

      {/* Transfer Modal */}
      {transferModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 max-w-md w-full border border-white/20">
            <h2 className="text-xl font-bold text-white mb-4">Transfer Item</h2>
            <p className="text-gray-400 mb-4">Transferring: {transferModalItem.name}</p>
            <input
              type="text"
              placeholder="Recipient address (0x...)"
              value={transferAddress}
              onChange={(e) => setTransferAddress(e.target.value)}
              className="w-full bg-black/30 border border-white/20 rounded-lg px-4 py-3 text-white mb-4"
            />
            <div className="flex gap-3">
              <button onClick={() => { setTransferModalItem(null); setTransferAddress(""); }} className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl">
                Cancel
              </button>
              <button onClick={handleTransfer} disabled={!transferAddress || isTransferring} className={`flex-1 py-3 rounded-xl font-bold ${!transferAddress || isTransferring ? "bg-gray-600 text-gray-400" : "bg-blue-600 hover:bg-blue-500 text-white"}`}>
                {isTransferring ? "Transferring..." : "Transfer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;

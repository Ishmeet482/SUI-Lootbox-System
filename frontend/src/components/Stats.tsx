import { BarChart3, Target, Percent } from "lucide-react";

interface StatsProps {
  pityCounter: number;
  rarityWeights: number[];
}

export function Stats({ pityCounter, rarityWeights }: StatsProps) {
  const pityProgress = (pityCounter / 30) * 100;

  return (
    <div className="bg-white/5 backdrop-blur-md rounded-3xl p-6 border border-white/10">
      <div className="flex items-center gap-3 mb-4">
        <BarChart3 className="w-6 h-6 text-purple-400" />
        <h3 className="text-lg font-bold text-white">Game Stats</h3>
      </div>

      <div className="space-y-4">
        {/* Pity System */}
        <div className="bg-black/20 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-300 flex items-center gap-2">
              <Target className="w-4 h-4" />
              Pity Counter
            </span>
            <span className="text-white font-bold">{pityCounter}/30</span>
          </div>
          <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-600 to-yellow-500 transition-all duration-500"
              style={{ width: `${pityProgress}%` }}
            />
          </div>
          <p className="text-gray-500 text-xs mt-2">
            Guaranteed Legendary after 30 boxes without one!
          </p>
        </div>

        {/* Drop Rates */}
        <div className="bg-black/20 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Percent className="w-4 h-4 text-gray-400" />
            <span className="text-gray-300">Drop Rates</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Common</span>
              <span className="text-gray-300 font-medium">{rarityWeights[0]}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-blue-400">Rare</span>
              <span className="text-blue-300 font-medium">{rarityWeights[1]}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-purple-400">Epic</span>
              <span className="text-purple-300 font-medium">{rarityWeights[2]}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-yellow-400">Legendary</span>
              <span className="text-yellow-300 font-medium">{rarityWeights[3]}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

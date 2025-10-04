'use client';

import { predictionLevels } from "@/lib/utils";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface BakuwakiIndexDisplayProps {
  bakuwakiIndex: number;
  level: number;
  name: string;
  description: string;
}

const renderHotaruikaIcons = (level: number, src: string, size = 'w-10 h-10', animated = true) => {
  if (level <= 0) return null;
  const count = Math.min(level, 5);
  return Array.from({ length: count }).map((_, index) => (
    <img
      key={index}
      src={src}
      alt="ホタルイカ"
      className={`${size} ${animated ? 'floating' : ''} [filter:drop-shadow(0_0_0.5rem_rgba(255,255,255,0.8))]`}
      style={{ animationDelay: `${index * 0.4}s` }}
    />
  ));
};

export default function BakuwakiIndexDisplay({
  bakuwakiIndex,
  level,
  name,
  description,
}: BakuwakiIndexDisplayProps) {
  const chartData = [
    { name: '湧き指数', value: bakuwakiIndex, fill: 'url(#colorUv)' },
    { name: '残り', value: Math.max(100 - bakuwakiIndex, 0), fill: '#374151' }, // gray-700
  ];

  const levelInfo = predictionLevels.find(p => p.level === level) || predictionLevels[0];
  const hotaruikaIconSrc = level >= 5 ? '/hotaruika_aikon_3.png' : level >= 3 ? '/hotaruika_aikon_2.png' : '/hotaruika_aikon.png';

  return (
    <div className="w-full bg-slate-900/50 backdrop-blur-sm border-blue-500/20 rounded-2xl p-4 sm:p-6 shadow-lg">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-8">
        
        {/* Left Side: Chart and Index */}
        <div className="flex items-center gap-4">
          <div className="relative w-28 h-28 sm:w-32 sm:h-32">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <defs>
                  <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8884d8" stopOpacity={0.9}/>
                    <stop offset="95%" stopColor="#8884d8" stopOpacity={0.3}/>
                  </linearGradient>
                </defs>
                <Tooltip 
                  cursor={false}
                  contentStyle={{ display: 'none' }} // ツールチップは表示しない
                />
                <Pie
                  data={chartData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius="70%"
                  outerRadius="100%"
                  startAngle={90}
                  endAngle={-270}
                  paddingAngle={0}
                  cornerRadius={5}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xs text-slate-400">湧き指数</span>
              <span className="text-3xl sm:text-4xl font-bold text-white tracking-tighter">
                {bakuwakiIndex}
                <span className="text-lg sm:text-xl font-medium">%</span>
              </span>
            </div>
          </div>
        </div>

        {/* Right Side: Level Info and Icons */}
        <div className="flex-1 flex flex-col items-center sm:items-start text-center sm:text-left">
          <p className={`text-sm font-semibold ${levelInfo.color}`}>{description}</p>
          <h3 className={`text-3xl sm:text-4xl font-bold ${levelInfo.color}`}>{name}</h3>
          <div className="flex items-center justify-center sm:justify-start mt-2 h-10">
            {renderHotaruikaIcons(level, hotaruikaIconSrc)}
          </div>
        </div>

      </div>
    </div>
  );
}

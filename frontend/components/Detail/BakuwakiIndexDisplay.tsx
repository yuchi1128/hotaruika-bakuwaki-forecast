'use client';

import { useMemo } from 'react';
import { predictionLevels } from "@/lib/utils";
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { CardTitle } from '@/components/ui/card';

interface BakuwakiIndexDisplayProps {
  bakuwakiIndex: number;
  level: number;
  name: string;
  description: string;
  isMobile: boolean;
}

export default function BakuwakiIndexDisplay({
  bakuwakiIndex,
  level,
  name,
  description,
  isMobile,
}: BakuwakiIndexDisplayProps) {

  const chartData = [
    { name: 'Bakuwaki Index', value: bakuwakiIndex, fill: 'url(#chartGradient)' },
    { name: 'Remaining', value: Math.max(100 - bakuwakiIndex, 0), fill: 'rgba(0, 0, 0, 0.2)' },
  ];

  const levelInfo = predictionLevels.find(p => p.level === level) || predictionLevels[0];
  const hotaruikaIconSrc = level >= 5 ? '/hotaruika_aikon_3.png' : level >= 3 ? '/hotaruika_aikon_2.png' : '/hotaruika_aikon.png';

  const count = useMemo(() => {
    let num = 0;
    if (isMobile) {
      if (bakuwakiIndex > 150) num = 15;
      else if (bakuwakiIndex > 120) num = 12;
      else if (bakuwakiIndex > 100) num = 10;
      else if (bakuwakiIndex > 80) num = 8;
      else if (bakuwakiIndex > 60) num = 6;
      else if (bakuwakiIndex > 40) num = 4;
      else if (bakuwakiIndex > 25) num = 2;
      else if (bakuwakiIndex > 10) num = 1;
    } else {
      if (bakuwakiIndex > 150) num = 30;
      else if (bakuwakiIndex > 120) num = 25;
      else if (bakuwakiIndex > 100) num = 20;
      else if (bakuwakiIndex > 80) num = 16;
      else if (bakuwakiIndex > 60) num = 12;
      else if (bakuwakiIndex > 40) num = 8;
      else if (bakuwakiIndex > 25) num = 5;
      else if (bakuwakiIndex > 10) num = 2;
    }
    return num;
  }, [bakuwakiIndex, isMobile]);

  const positions = useMemo(() => {
    const newPositions: { top: number; left: number; s: number; }[] = [];
    const sizes = [2.5, 3, 2, 3.5, 2.25, 3.5]; // in rem
    const minDistance = isMobile ? 18 : 15;
    const maxAttempts = 20;

    for (let i = 0; i < count; i++) {
      let top, left;
      let attempts = 0;
      let isOverlapping;

      do {
        top = 5 + Math.random() * 90;
        left = 5 + Math.random() * 90;
        isOverlapping = false;

        for (const p of newPositions) {
          const dist = Math.sqrt(Math.pow(p.left - left, 2) + Math.pow(p.top - top, 2));
          if (dist < minDistance) {
            isOverlapping = true;
            break;
          }
        }
        attempts++;
      } while (isOverlapping && attempts < maxAttempts);

      newPositions.push({
        top: top,
        left: left,
        s: sizes[i % sizes.length],
      });
    }

    return newPositions.map(p => ({
        top: `${p.top}%`,
        left: `${p.left}%`,
        s: p.s,
        transform: 'translate(-50%, -50%)',
    }));
  }, [count, isMobile]);

  return (
    <div className="relative">
      <CardTitle className="mt-6 text-lg sm:text-xl text-blue-100 mb-3 ml-1">
        湧き指数
      </CardTitle>
      
      <div className={`relative w-full overflow-hidden glow-effect bg-gradient-to-br from-gray-900 via-blue-900/40 to-gray-900 border border-blue-500/30 rounded-3xl shadow-2xl p-6 ${levelInfo.bgColor}`}>      

        <div className="absolute inset-0 z-0 opacity-40">
          {positions.map((p, index) => (
            <div
              key={index}
              className="absolute"
              style={{ 
                top: p.top, 
                left: p.left, 
                transform: p.transform,
                width: `${p.s}rem`,
                height: `${p.s}rem`,
                zIndex: 1 
              }}
            >
              <img
                src={hotaruikaIconSrc}
                alt="ホタルイカ"
                className={`w-full h-full floating [filter:drop-shadow(0_0_8px_rgba(187,247,208,0.5))]`}
                style={{ animationDelay: `${(index * 0.2)}s` }}
              />
            </div>
          ))}
        </div>

        {/* Main Content Area */}
        <div className="relative z-10 flex flex-col items-center justify-center h-full">
          
          <div className="relative flex items-center justify-center w-48 h-48 md:w-52 md:h-52">
            {/* Background Chart */}
            <div className="absolute inset-0 z-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <defs>
                    <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#a7f3d0" stopOpacity={0.7}/>
                      <stop offset="95%" stopColor="#34d399" stopOpacity={0.3}/>
                    </linearGradient>
                  </defs>
                  <Pie
                    data={chartData}
                    dataKey="value"
                    cx="50%"
                    cy="50%"
                    innerRadius="70%"
                    outerRadius="100%"
                    startAngle={90}
                    endAngle={-270}
                    isAnimationActive={false}
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} stroke="none" />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Text Content in the center */}
            <div className="relative z-10 flex flex-col items-center justify-center w-full h-full bg-black/10 rounded-full backdrop-blur-sm">
              <span className="text-sm text-slate-300">湧き指数</span>
              <span className="text-5xl font-bold text-white tracking-tighter">
                {bakuwakiIndex}
                <span className="text-2xl font-medium">%</span>
              </span>
            </div>
          </div>

          {/* Level Name and Description below the chart */}
          <div className="mt-4 text-center">
            <p className={`text-4xl md:text-5xl font-bold ${levelInfo.color} ${level > 0 ? 'text-glow-normal' : 'text-glow-weak'}`}>
              {name}
            </p>
            <p className="text-base text-gray-300 mt-1">{description}</p>
          </div>

        </div>
      </div>
    </div>
  );
}
'use client';

import { useState, useEffect, useMemo } from 'react';
import { predictionLevels } from "@/lib/utils";
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

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
  const [animatedIndex, setAnimatedIndex] = useState(0);

  useEffect(() => {
    let animationFrameId: number;
    let startTimestamp: number | null = null;
    const animationDuration = 800; // ms

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / animationDuration, 1);
      const currentValue = Math.floor(progress * bakuwakiIndex);
      
      setAnimatedIndex(currentValue);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(step);
      }
    };

    animationFrameId = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [bakuwakiIndex]);

  const levelColor = useMemo(() => {
    if (level >= 5) return { start: '#f9a8d4', end: '#c084fc', shadow: 'rgba(249, 168, 212, 0.5)' }; // Pink-Purple
    if (level >= 4) return { start: '#fcd34d', end: '#fb923c', shadow: 'rgba(252, 211, 77, 0.5)' }; // Yellow-Orange
    if (level === 3) return { start: '#86efac', end: '#22c55e', shadow: 'rgba(134, 239, 172, 0.5)' }; // Green
    if (level > 0) return { start: '#93c5fd', end: '#60a5fa', shadow: 'rgba(147, 197, 253, 0.5)' }; // Light Blue-Blue
    return { start: '#9ca3af', end: '#6b7280', shadow: 'rgba(156, 163, 175, 0.4)' }; // Gray
  }, [level]);

  const chartData = [
    { name: 'Bakuwaki Index', value: animatedIndex, fill: 'url(#chartGradient)' },
    { name: 'Remaining', value: Math.max(100 - animatedIndex, 0), fill: '#374151' }, // Darker gray background
  ];

  const levelInfo = predictionLevels.find(p => p.level === level) || predictionLevels[0];
  const hotaruikaIconSrc = level >= 5 ? '/hotaruika_aikon_3.png' : level >= 3 ? '/hotaruika_aikon_2.png' : '/hotaruika_aikon.png';

  const count = useMemo(() => {
    if (level === 0) {
      return 0;
    }
    let num = 0;
    if (isMobile) {
        if (bakuwakiIndex > 170) num = 30;
        else if (bakuwakiIndex > 150) num = 27;
        else if (bakuwakiIndex > 135) num = 23;
        else if (bakuwakiIndex > 120) num = 19;
        else if (bakuwakiIndex > 110) num = 16;
        else if (bakuwakiIndex > 100) num = 15;
        else if (bakuwakiIndex > 90) num = 15;
        else if (bakuwakiIndex > 83) num = 15;
        else if (bakuwakiIndex > 70) num = 11;
        else if (bakuwakiIndex > 60) num = 9;
        else if (bakuwakiIndex > 50) num = 7;
        else if (bakuwakiIndex > 40) num = 6;
        else if (bakuwakiIndex > 30) num = 4;
        else if (bakuwakiIndex > 20) num = 3;
        else if (bakuwakiIndex > 10) num = 2;
    } else {
        if (bakuwakiIndex > 170) num = 45;
        else if (bakuwakiIndex > 150) num = 40;
        else if (bakuwakiIndex > 135) num = 37;
        else if (bakuwakiIndex > 120) num = 35;
        else if (bakuwakiIndex > 110) num = 32;
        else if (bakuwakiIndex > 100) num = 30;
        else if (bakuwakiIndex > 90) num = 30;
        else if (bakuwakiIndex > 83) num = 30;
        else if (bakuwakiIndex > 70) num = 20;
        else if (bakuwakiIndex > 60) num = 16;
        else if (bakuwakiIndex > 50) num = 9;
        else if (bakuwakiIndex > 45) num = 7;
        else if (bakuwakiIndex > 40) num = 6;
        else if (bakuwakiIndex > 30) num = 5;
        else if (bakuwakiIndex > 20) num = 3;
        else if (bakuwakiIndex > 10) num = 2;
    }
    return num;
  }, [bakuwakiIndex, isMobile, level]);

  const positions = useMemo(() => {
    const newPositions: { top: number; left: number; s: number; }[] = [];
    const sizes = [2.5, 3, 2, 3.5, 2.25, 3.5]; // in rem
    const minDistance = isMobile ? 22 : 18;
    const maxAttempts = 100;

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
                      <stop offset="5%" stopColor={levelColor.start} stopOpacity={0.8}/>
                      <stop offset="95%" stopColor={levelColor.end} stopOpacity={0.6}/>
                    </linearGradient>
                    <filter id="pie-shadow" x="-50%" y="-50%" width="200%" height="200%">
                      <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor={levelColor.shadow} />
                    </filter>
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
                    filter="url(#pie-shadow)"
                    strokeWidth={2}
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} stroke={'rgba(255, 255, 255, 0.2)'} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Text Content in the center */}
            <div className="relative z-10 flex flex-col items-center justify-center w-full h-full bg-black/20 rounded-full backdrop-blur-sm border border-white/10 shadow-inner-2xl">
              {/* Gloss effect overlay */}
              <div 
                className="absolute inset-x-0 top-0 h-1/2 rounded-t-full opacity-80"
                style={{ background: 'linear-gradient(to bottom, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 100%)' }}
              />
              <span className="relative text-sm font-medium text-slate-300">湧き指数</span>
              <span className="relative text-5xl font-bold text-white tracking-tighter drop-shadow-lg">
                {bakuwakiIndex}
                <span className="text-2xl font-medium ml-1">%</span>
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
  );
}
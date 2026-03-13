'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BarChart2, Plus, X } from 'lucide-react';
import { MAX_POLL_OPTION_LENGTH, MIN_POLL_OPTIONS, MAX_POLL_OPTIONS, POLL_DURATION_OPTIONS } from '@/lib/constants';
import type { CreatePollParams } from '@/lib/api/posts';

interface PollCreatorProps {
  onChange: (pollData: CreatePollParams | null) => void;
  onReset?: boolean;
}

export default function PollCreator({ onChange, onReset }: PollCreatorProps) {
  const [isEnabled, setIsEnabled] = useState(false);
  const [options, setOptions] = useState<string[]>(['', '']);
  const [durationHours, setDurationHours] = useState<number>(12);

  // 親からリセットされた場合
  if (onReset && isEnabled) {
    setIsEnabled(false);
    setOptions(['', '']);
    setDurationHours(24);
    onChange(null);
  }

  const handleToggle = () => {
    if (isEnabled) {
      setIsEnabled(false);
      setOptions(['', '']);
      setDurationHours(24);
      onChange(null);
    } else {
      setIsEnabled(true);
    }
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
    emitChange(newOptions, durationHours);
  };

  const addOption = () => {
    if (options.length < MAX_POLL_OPTIONS) {
      const newOptions = [...options, ''];
      setOptions(newOptions);
      emitChange(newOptions, durationHours);
    }
  };

  const removeOption = (index: number) => {
    if (options.length > MIN_POLL_OPTIONS) {
      const newOptions = options.filter((_, i) => i !== index);
      setOptions(newOptions);
      emitChange(newOptions, durationHours);
    }
  };

  const handleDurationChange = (hours: number) => {
    setDurationHours(hours);
    emitChange(options, hours);
  };

  const emitChange = (opts: string[], hours: number) => {
    onChange({ options: opts.map((o) => o.trim()), duration_hours: hours });
  };

  const filledCount = options.filter((o) => o.trim() !== '').length;
  const hasError = options.some((o) => o.length > MAX_POLL_OPTION_LENGTH);
  const hasInsufficientOptions = isEnabled && filledCount < MIN_POLL_OPTIONS;

  return (
    <div className="mb-4">
      <button
        type="button"
        onClick={handleToggle}
        className={`flex items-center gap-1.5 text-sm transition-colors ${
          isEnabled
            ? 'text-purple-300 hover:text-purple-200'
            : 'text-gray-400 hover:text-gray-200'
        }`}
      >
        <BarChart2 className="w-4 h-4" />
        {isEnabled ? 'アンケートを削除' : 'アンケートを追加'}
      </button>

      {isEnabled && (
        <div className="mt-3 p-3 bg-slate-700/30 rounded-lg border border-purple-500/20 space-y-3">
          {/* 選択肢 */}
          <div className="space-y-2">
            {options.map((option, index) => (
              <div key={index} className="flex items-center gap-2">
                <Input
                  placeholder={`選択肢${index + 1}`}
                  value={option}
                  onChange={(e) => updateOption(index, e.target.value)}
                  className={`h-8 text-sm bg-slate-600/50 border-purple-500/30 text-white placeholder-gray-400 ${
                    option.length > MAX_POLL_OPTION_LENGTH ? 'border-red-500' : ''
                  }`}
                />
                {options.length > MIN_POLL_OPTIONS && (
                  <button
                    type="button"
                    onClick={() => removeOption(index)}
                    className="p-1 text-gray-400 hover:text-red-400 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
            {hasError && (
              <p className="text-xs text-red-400">
                ※選択肢は{MAX_POLL_OPTION_LENGTH}文字以内で入力してください
              </p>
            )}
            {hasInsufficientOptions && !hasError && (
              <p className="text-xs text-red-400">
                ※選択肢を{MIN_POLL_OPTIONS}つ以上入力してください
              </p>
            )}
          </div>

          {/* 選択肢追加ボタン */}
          {options.length < MAX_POLL_OPTIONS && (
            <button
              type="button"
              onClick={addOption}
              className="flex items-center gap-1 text-xs text-purple-300 hover:text-purple-200 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              選択肢を追加
            </button>
          )}

          {/* 期限選択 */}
          <div>
            <span className="text-xs text-gray-400 font-bold">投票期間：</span>
            <div className="flex gap-2 mt-1">
              {POLL_DURATION_OPTIONS.map((opt) => (
                <Button
                  key={opt.hours}
                  type="button"
                  className={`h-7 px-3 text-xs font-bold ${
                    durationHours === opt.hours
                      ? 'bg-purple-600 hover:bg-purple-700 text-white'
                      : 'border-purple-500 text-purple-300 hover:bg-purple-900/20'
                  }`}
                  variant={durationHours === opt.hours ? 'default' : 'outline'}
                  onClick={() => handleDurationChange(opt.hours)}
                >
                  {opt.label}
                </Button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

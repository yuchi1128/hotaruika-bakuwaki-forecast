import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// このファイルにはサーバーでもクライアントでも安全に使える関数だけを残します。
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const getWeatherFromCode = (code: number): string => {
  if (code >= 0 && code <= 2) return '晴れ';
  if (code === 3) return '曇り';
  if ((code >= 4 && code <= 5) || (code >= 10 && code <= 12) || (code >= 41 && code <= 49)) return '曇り';
  if (code === 17 || code === 95 || code === 97) return '雷';
  if (code === 18) return 'にわか雨';
  if (code === 20 || (code >= 51 && code <= 55)) return '小雨';
  if (code === 21 || code === 24 || code === 25 || code === 61 || code === 80) return '雨';
  if (code === 63 || code === 81) return '雨';
  if (code === 65 || code === 82) return '激しい雨';
  if (code === 22 || code === 26 || (code >= 71 && code <= 75)) return '雪';
  if (code === 23) return 'みぞれ';
  if (code === 27) return 'ひょう';
  return '不明';
};

export const getWindDirection = (degrees: number): string => {
  const directions = ['北', '北北東', '北東', '東北東', '東', '東南東', '南東', '南南東', '南', '南南西', '南西', '西南西', '西', '西北西', '北西', '北北西'];
  const index = Math.round(degrees / 22.5) % 16;
  return directions[index];
};

export const getLastUpdateTime = (): Date => {
  const now = new Date();
  const updateHours = [2, 5, 8, 11, 14, 17, 20, 23];
  const currentHour = now.getHours();

  const lastUpdateHourToday = [...updateHours].reverse().find((hour) => currentHour >= hour);

  const lastUpdateDate = new Date(now);

  if (lastUpdateHourToday !== undefined) {
    lastUpdateDate.setHours(lastUpdateHourToday, 0, 0, 0);
  } else {
    lastUpdateDate.setDate(now.getDate() - 1);
    lastUpdateDate.setHours(23, 0, 0, 0);
  }
  return lastUpdateDate;
};

export const formatDateForWeek = (date: Date) => {
  return date.toLocaleDateString('ja-JP', {
    month: 'numeric',
    day: 'numeric',
    weekday: 'short',
  });
};

export const formatDate = (date: Date) => {
  const nextDay = new Date(date);
  nextDay.setDate(date.getDate() + 1);
  const dateOptions: Intl.DateTimeFormatOptions = { month: 'numeric', day: 'numeric', weekday: 'short' };
  const dateStr = date.toLocaleDateString('ja-JP', dateOptions);
  const nextDayStr = nextDay.toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric', weekday: 'short' });
  return `${dateStr}深夜 〜 ${nextDayStr}朝の身投げ`;
};

export const formatTime = (date: Date) => {
    const datePart = date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
    });
    const timePart = date.toLocaleTimeString('ja-JP', {
      hour: '2-digit',
      minute: '2-digit',
    });
    return `${datePart} ${timePart}`;
  };

export const getOffSeasonMessage = (date: Date) => {
  const month = date.getMonth();
  if (month === 0) {
    return '現在はホタルイカの身投げの時期ではありません。2月から予測を再開します';
  }
  return '現在はホタルイカの身投げの時期ではありません。来年の2月から予測を再開します。';
};
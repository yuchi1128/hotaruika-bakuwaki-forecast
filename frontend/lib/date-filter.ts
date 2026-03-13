import { format, subDays } from 'date-fns';

const BOUNDARY_HOUR = 6;

/**
 * 現在のJST時刻を取得（ブラウザのタイムゾーンに依存しない）
 */
function getJSTNow(): Date {
  const now = new Date();
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
  return new Date(utcMs + 9 * 60 * 60000);
}

/**
 * JST日時からISO 8601文字列（+09:00）を生成
 * jstDate: JST空間での日時（getJSTNowで取得したもの、またはそこから計算したもの）
 */
function toJSTISO(jstDate: Date): string {
  const y = jstDate.getFullYear();
  const m = String(jstDate.getMonth() + 1).padStart(2, '0');
  const d = String(jstDate.getDate()).padStart(2, '0');
  const h = String(jstDate.getHours()).padStart(2, '0');
  const min = String(jstDate.getMinutes()).padStart(2, '0');
  const s = String(jstDate.getSeconds()).padStart(2, '0');
  return `${y}-${m}-${d}T${h}:${min}:${s}+09:00`;
}

/**
 * 論理的な「今日」の開始時刻（午前6時 JST）を取得
 * 午前6時より前の場合、前日の午前6時が「今日」の開始
 */
function getLogicalTodayStart(jstNow: Date): Date {
  const todayAtBoundary = new Date(jstNow);
  todayAtBoundary.setHours(BOUNDARY_HOUR, 0, 0, 0);

  if (jstNow < todayAtBoundary) {
    return subDays(todayAtBoundary, 1);
  }
  return todayAtBoundary;
}

export interface DateFilterOption {
  value: string;
  label: string;
  dateFrom?: string;
  dateTo?: string;
  rangeText?: string;
}

/**
 * 日付フィルターのプリセットオプションを生成
 */
export function getDateFilterOptions(): DateFilterOption[] {
  const jstNow = getJSTNow();
  const todayStart = getLogicalTodayStart(jstNow);
  const yesterdayStart = subDays(todayStart, 1);
  const dayBeforeStart = subDays(todayStart, 2);

  const fmtDate = (d: Date) => `${format(d, 'M/d')} 午前${BOUNDARY_HOUR}時`;

  return [
    {
      value: 'all',
      label: 'すべて',
    },
    {
      value: 'today',
      label: `今日（${fmtDate(todayStart)} 〜）`,
      dateFrom: toJSTISO(todayStart),
      rangeText: `${fmtDate(todayStart)} 〜 現在`,
    },
    {
      value: 'yesterday',
      label: `昨日（${fmtDate(yesterdayStart)} 〜 ${fmtDate(todayStart)}）`,
      dateFrom: toJSTISO(yesterdayStart),
      dateTo: toJSTISO(todayStart),
      rangeText: `${fmtDate(yesterdayStart)} 〜 ${fmtDate(todayStart)}`,
    },
    {
      value: 'day_before',
      label: `一昨日（${fmtDate(dayBeforeStart)} 〜 ${fmtDate(yesterdayStart)}）`,
      dateFrom: toJSTISO(dayBeforeStart),
      dateTo: toJSTISO(yesterdayStart),
      rangeText: `${fmtDate(dayBeforeStart)} 〜 ${fmtDate(yesterdayStart)}`,
    },
    {
      value: 'custom',
      label: '開始日と終了日を指定',
    },
  ];
}

/**
 * カスタム日付の範囲を計算（指定日の午前6時〜翌日午前6時）
 * calendarDate: カレンダーで選択された日付（ローカルタイムゾーン）
 */
export function getCustomDateRange(calendarDate: Date): {
  dateFrom: string;
  dateTo: string;
  rangeText: string;
  label: string;
} {
  // カレンダーの日付をJST空間での午前6時に変換
  const jstNow = getJSTNow();
  const localNow = new Date();
  const offsetMs = jstNow.getTime() - localNow.getTime();

  const jstDate = new Date(calendarDate.getTime() + offsetMs);
  const dayStart = new Date(jstDate);
  dayStart.setHours(BOUNDARY_HOUR, 0, 0, 0);

  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);

  const fmtDate = (d: Date) => `${format(d, 'M/d')} 午前${BOUNDARY_HOUR}時`;

  return {
    dateFrom: toJSTISO(dayStart),
    dateTo: toJSTISO(dayEnd),
    rangeText: `${fmtDate(dayStart)} 〜 ${fmtDate(dayEnd)}`,
    label: `${format(jstDate, 'M/d')}の投稿`,
  };
}

// API URL
export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

// 1ページあたりの表示件数
export const COMMENTS_PER_PAGE = 20;

// 文字数制限
export const MAX_USERNAME_LENGTH = 30;
export const MAX_CONTENT_LENGTH = 150;
export const MAX_ADMIN_CONTENT_LENGTH = 1000;

// アンケート
export const MAX_POLL_OPTION_LENGTH = 15;
export const MIN_POLL_OPTIONS = 2;
export const MAX_POLL_OPTIONS = 4;
export const POLL_DURATION_OPTIONS = [1, 3, 7] as const;

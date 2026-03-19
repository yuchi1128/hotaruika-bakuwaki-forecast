-- Migration: IP BAN → デバイスID BAN への移行
-- ip_address カラムを device_id に置き換え、banned_ips を banned_devices に置き換え

ALTER TABLE posts ADD COLUMN IF NOT EXISTS device_id TEXT;
ALTER TABLE posts DROP COLUMN IF EXISTS ip_address;

ALTER TABLE replies ADD COLUMN IF NOT EXISTS device_id TEXT;
ALTER TABLE replies DROP COLUMN IF EXISTS ip_address;

CREATE TABLE IF NOT EXISTS banned_devices (
    id SERIAL PRIMARY KEY,
    device_id TEXT NOT NULL UNIQUE,
    reason TEXT,
    banned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

DROP TABLE IF EXISTS banned_ips;

CREATE TABLE posts (
    id SERIAL PRIMARY KEY,
    username TEXT NOT NULL,
    content TEXT NOT NULL,
    image_urls TEXT[],
    label VARCHAR(50) NOT NULL CHECK (label IN ('現地情報', 'その他', '管理人')),
    device_id TEXT,
    is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE replies (
    id SERIAL PRIMARY KEY,
    post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    parent_reply_id INTEGER REFERENCES replies(id) ON DELETE CASCADE,
    username TEXT NOT NULL,
    content TEXT NOT NULL,
    image_urls TEXT[],
    label VARCHAR(20) DEFAULT NULL,
    device_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE reactions (
    id SERIAL PRIMARY KEY,
    post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
    reply_id INTEGER REFERENCES replies(id) ON DELETE CASCADE,
    reaction_type VARCHAR(4) NOT NULL CHECK (reaction_type IN ('good', 'bad')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_post_or_reply CHECK (post_id IS NOT NULL OR reply_id IS NOT NULL)
);

CREATE TABLE polls (
    id SERIAL PRIMARY KEY,
    post_id INTEGER NOT NULL UNIQUE REFERENCES posts(id) ON DELETE CASCADE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    total_votes INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE poll_options (
    id SERIAL PRIMARY KEY,
    poll_id INTEGER NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
    option_text TEXT NOT NULL,
    vote_count INTEGER NOT NULL DEFAULT 0,
    display_order SMALLINT NOT NULL
);

CREATE TABLE banned_devices (
    id SERIAL PRIMARY KEY,
    device_id TEXT NOT NULL UNIQUE,
    reason TEXT,
    banned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
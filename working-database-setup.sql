-- Production-Grade Database Setup for CultNode
-- This script creates all necessary tables, indexes, and RLS policies

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users table (using TEXT for Clerk user IDs)
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY, -- Clerk user ID (string format)
    email TEXT UNIQUE NOT NULL,
    first_name TEXT,
    last_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Channels table
CREATE TABLE IF NOT EXISTS channels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    created_by TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Channel members table
CREATE TABLE IF NOT EXISTS channel_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    channel_id UUID NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'moderator', 'member')),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(channel_id, user_id)
);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    channel_id UUID NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Online users table
CREATE TABLE IF NOT EXISTS online_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    channel_id UUID NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, channel_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_channels_created_by ON channels(created_by);
CREATE INDEX IF NOT EXISTS idx_channel_members_channel_id ON channel_members(channel_id);
CREATE INDEX IF NOT EXISTS idx_channel_members_user_id ON channel_members(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_channel_id ON messages(channel_id);
CREATE INDEX IF NOT EXISTS idx_messages_user_id ON messages(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_online_users_channel_id ON online_users(channel_id);
CREATE INDEX IF NOT EXISTS idx_online_users_user_id ON online_users(user_id);

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE channel_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE online_users ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can view their own profile" ON users
    FOR SELECT USING (auth.uid()::text = id);

CREATE POLICY "Users can update their own profile" ON users
    FOR UPDATE USING (auth.uid()::text = id);

CREATE POLICY "Users can insert their own profile" ON users
    FOR INSERT WITH CHECK (auth.uid()::text = id);

-- RLS Policies for channels table
CREATE POLICY "Anyone can view public channels" ON channels
    FOR SELECT USING (true);

CREATE POLICY "Channel creators can update their channels" ON channels
    FOR UPDATE USING (auth.uid()::text = created_by);

CREATE POLICY "Channel creators can delete their channels" ON channels
    FOR DELETE USING (auth.uid()::text = created_by);

CREATE POLICY "Authenticated users can create channels" ON channels
    FOR INSERT WITH CHECK (auth.uid()::text = created_by);

-- RLS Policies for channel_members table
CREATE POLICY "Channel members can view channel members" ON channel_members
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM channel_members cm 
            WHERE cm.channel_id = channel_id 
            AND cm.user_id = auth.uid()::text
        )
    );

CREATE POLICY "Channel admins can manage members" ON channel_members
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM channel_members cm 
            WHERE cm.channel_id = channel_id 
            AND cm.user_id = auth.uid()::text 
            AND cm.role IN ('admin', 'moderator')
        )
    );

CREATE POLICY "Users can join channels" ON channel_members
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

-- RLS Policies for messages table
CREATE POLICY "Channel members can view messages" ON messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM channel_members cm 
            WHERE cm.channel_id = channel_id 
            AND cm.user_id = auth.uid()::text
        )
    );

CREATE POLICY "Channel members can send messages" ON messages
    FOR INSERT WITH CHECK (
        auth.uid()::text = user_id AND
        EXISTS (
            SELECT 1 FROM channel_members cm 
            WHERE cm.channel_id = channel_id 
            AND cm.user_id = auth.uid()::text
        )
    );

CREATE POLICY "Message authors can update their messages" ON messages
    FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Message authors can delete their messages" ON messages
    FOR DELETE USING (auth.uid()::text = user_id);

-- RLS Policies for online_users table
CREATE POLICY "Channel members can view online users" ON online_users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM channel_members cm 
            WHERE cm.channel_id = channel_id 
            AND cm.user_id = auth.uid()::text
        )
    );

CREATE POLICY "Users can update their online status" ON online_users
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their online status" ON online_users
    FOR UPDATE USING (auth.uid()::text = user_id);

-- Create functions for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_channels_updated_at BEFORE UPDATE ON channels
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_messages_updated_at BEFORE UPDATE ON messages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to clean up old online status entries
CREATE OR REPLACE FUNCTION cleanup_old_online_users()
RETURNS void AS $$
BEGIN
    DELETE FROM online_users 
    WHERE last_seen < NOW() - INTERVAL '5 minutes';
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled job to clean up old online users (if using pg_cron)
-- SELECT cron.schedule('cleanup-online-users', '*/5 * * * *', 'SELECT cleanup_old_online_users();');

-- Insert some sample data for testing
INSERT INTO users (id, email, first_name, last_name) VALUES
    ('user_2zzeTozDxPSm7DumoecNKOhtZV1', 'test@example.com', 'Test', 'User')
ON CONFLICT (id) DO NOTHING;

INSERT INTO channels (name, description, created_by) VALUES
    ('General', 'General discussion channel', 'user_2zzeTozDxPSm7DumoecNKOhtZV1'),
    ('Movies', 'Movie discussions', 'user_2zzeTozDxPSm7DumoecNKOhtZV1'),
    ('Games', 'Gaming discussions', 'user_2zzeTozDxPSm7DumoecNKOhtZV1')
ON CONFLICT DO NOTHING;

-- Add the test user to all channels
INSERT INTO channel_members (channel_id, user_id, role) 
SELECT c.id, 'user_2zzeTozDxPSm7DumoecNKOhtZV1', 'admin'
FROM channels c
ON CONFLICT DO NOTHING;

-- Insert some sample messages
INSERT INTO messages (channel_id, user_id, content) VALUES
    ((SELECT id FROM channels WHERE name = 'General' LIMIT 1), 'user_2zzeTozDxPSm7DumoecNKOhtZV1', 'Hello everyone!'),
    ((SELECT id FROM channels WHERE name = 'General' LIMIT 1), 'user_2zzeTozDxPSm7DumoecNKOhtZV1', 'Welcome to CultNode!'),
    ((SELECT id FROM channels WHERE name = 'Movies' LIMIT 1), 'user_2zzeTozDxPSm7DumoecNKOhtZV1', 'What movies are you watching?'),
    ((SELECT id FROM channels WHERE name = 'Games' LIMIT 1), 'user_2zzeTozDxPSm7DumoecNKOhtZV1', 'Any good games lately?')
ON CONFLICT DO NOTHING;

-- Set the test user as online in General channel
INSERT INTO online_users (user_id, channel_id, last_seen) VALUES
    ('user_2zzeTozDxPSm7DumoecNKOhtZV1', (SELECT id FROM channels WHERE name = 'General' LIMIT 1), NOW())
ON CONFLICT (user_id, channel_id) DO UPDATE SET last_seen = NOW(); 
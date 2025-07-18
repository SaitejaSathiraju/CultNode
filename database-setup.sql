-- Production-grade Channel System Database Schema
-- Run this in your Supabase SQL editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Clerk user data)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY,
  username VARCHAR(255) NOT NULL,
  avatar_url TEXT,
  online BOOLEAN DEFAULT false,
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Channels table
CREATE TABLE IF NOT EXISTS channels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  is_private BOOLEAN DEFAULT false,
  created_by UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Channel members table
CREATE TABLE IF NOT EXISTS channel_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  channel_id UUID REFERENCES channels(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(50) DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(channel_id, user_id)
);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  channel_id UUID REFERENCES channels(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_channels_name ON channels(name);
CREATE INDEX IF NOT EXISTS idx_channels_created_by ON channels(created_by);
CREATE INDEX IF NOT EXISTS idx_channel_members_channel_id ON channel_members(channel_id);
CREATE INDEX IF NOT EXISTS idx_channel_members_user_id ON channel_members(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_channel_id ON messages(channel_id);
CREATE INDEX IF NOT EXISTS idx_messages_user_id ON messages(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_users_online ON users(online);
CREATE INDEX IF NOT EXISTS idx_users_last_seen ON users(last_seen);

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE channel_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view all users" ON users
  FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Channels policies
CREATE POLICY "Anyone can view public channels" ON channels
  FOR SELECT USING (is_private = false);

CREATE POLICY "Channel members can view private channels" ON channels
  FOR SELECT USING (
    is_private = false OR 
    EXISTS (
      SELECT 1 FROM channel_members 
      WHERE channel_id = channels.id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Authenticated users can create channels" ON channels
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Channel creators can update their channels" ON channels
  FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Channel creators can delete their channels" ON channels
  FOR DELETE USING (auth.uid() = created_by);

-- Channel members policies
CREATE POLICY "Channel members can view channel members" ON channel_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM channels 
      WHERE channels.id = channel_members.channel_id 
      AND (channels.is_private = false OR 
           EXISTS (
             SELECT 1 FROM channel_members cm2 
             WHERE cm2.channel_id = channels.id AND cm2.user_id = auth.uid()
           ))
    )
  );

CREATE POLICY "Channel admins can manage members" ON channel_members
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM channel_members cm 
      WHERE cm.channel_id = channel_members.channel_id 
      AND cm.user_id = auth.uid() 
      AND cm.role = 'admin'
    )
  );

CREATE POLICY "Users can join public channels" ON channel_members
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM channels 
      WHERE channels.id = channel_members.channel_id 
      AND channels.is_private = false
    ) AND auth.uid() = user_id
  );

-- Messages policies
CREATE POLICY "Channel members can view messages" ON messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM channels 
      WHERE channels.id = messages.channel_id 
      AND (channels.is_private = false OR 
           EXISTS (
             SELECT 1 FROM channel_members cm 
             WHERE cm.channel_id = channels.id AND cm.user_id = auth.uid()
           ))
    )
  );

CREATE POLICY "Channel members can send messages" ON messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM channels 
      WHERE channels.id = messages.channel_id 
      AND (channels.is_private = false OR 
           EXISTS (
             SELECT 1 FROM channel_members cm 
             WHERE cm.channel_id = channels.id AND cm.user_id = auth.uid()
           ))
    ) AND auth.uid() = user_id
  );

CREATE POLICY "Message authors can update their messages" ON messages
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Message authors and channel admins can delete messages" ON messages
  FOR UPDATE USING (
    auth.uid() = user_id OR 
    EXISTS (
      SELECT 1 FROM channel_members cm 
      WHERE cm.channel_id = messages.channel_id 
      AND cm.user_id = auth.uid() 
      AND cm.role = 'admin'
    )
  );

-- Functions for automatic updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_channels_updated_at BEFORE UPDATE ON channels
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_messages_updated_at BEFORE UPDATE ON messages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically add channel creator as admin member
CREATE OR REPLACE FUNCTION add_channel_creator_as_admin()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO channel_members (channel_id, user_id, role)
  VALUES (NEW.id, NEW.created_by, 'admin');
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to add channel creator as admin
CREATE TRIGGER add_channel_creator_as_admin_trigger
  AFTER INSERT ON channels
  FOR EACH ROW EXECUTE FUNCTION add_channel_creator_as_admin();

-- Insert some default channels
INSERT INTO channels (name, description, is_private, created_by) VALUES
  ('general', 'General discussion for everyone', false, (SELECT id FROM users LIMIT 1)),
  ('random', 'Random topics and fun conversations', false, (SELECT id FROM users LIMIT 1)),
  ('help', 'Get help and ask questions', false, (SELECT id FROM users LIMIT 1)),
  ('announcements', 'Important announcements and updates', false, (SELECT id FROM users LIMIT 1))
ON CONFLICT (name) DO NOTHING;

-- Create a function to clean up offline users
CREATE OR REPLACE FUNCTION cleanup_offline_users()
RETURNS void AS $$
BEGIN
  UPDATE users 
  SET online = false 
  WHERE last_seen < NOW() - INTERVAL '5 minutes';
END;
$$ language 'plpgsql';

-- Create a cron job to clean up offline users (if using pg_cron extension)
-- SELECT cron.schedule('cleanup-offline-users', '*/5 * * * *', 'SELECT cleanup_offline_users();'); 
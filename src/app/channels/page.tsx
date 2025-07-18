"use client";
import React, { useState, useRef, useEffect } from 'react';
import { useUser, SignedIn } from '@clerk/nextjs';
import { supabase } from '../../utils/supabaseClient';
import { toast } from 'react-hot-toast';

interface Channel {
  id: string;
  name: string;
  description?: string;
  created_by: string;
  created_at: string;
  member_count: number;
}

interface User {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
}

interface Message {
  id: string;
  user_id: string;
  username: string;
  avatar_url?: string;
  content: string;
  created_at: string;
}

const ChannelPage = () => {
  const { user, isLoaded } = useUser();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [channelsLoading, setChannelsLoading] = useState(true);
  const [selectedChannel, setSelectedChannel] = useState<string | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [input, setInput] = useState('');
  const [showChannels, setShowChannels] = useState(false);
  const [showUsers, setShowUsers] = useState(false);
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelDescription, setNewChannelDescription] = useState('');
  const [userRole, setUserRole] = useState<'admin' | 'member' | null>(null);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Update user online status
  useEffect(() => {
    if (!user) return;

    const updateOnlineStatus = async () => {
      try {
        await supabase
          .from('users')
          .upsert({
            id: user.id,
            username: user.username || user.firstName || 'Anonymous',
            avatar_url: user.imageUrl,
            online: true
          });
      } catch (error) {
        console.error('Error updating online status:', error);
      }
    };

    updateOnlineStatus();

    // Update online status when user leaves
    const handleBeforeUnload = () => {
      supabase
        .from('users')
        .update({ online: false })
        .eq('id', user.id);
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [user]);

  // Fetch user's channels
  useEffect(() => {
    if (!user) return;

    async function fetchUserChannels() {
      try {
        setChannelsLoading(true);
        
        // Get all channels
        const { data: publicChannels, error: publicError } = await supabase
          .from('channels')
          .select('id, name, description, created_by, created_at');

        if (publicError) throw publicError;

        // Get channels where user is a member
        const { data: memberChannels, error: memberError } = await supabase
          .from('channel_members')
          .select(`
            channel_id,
            channels (
              id,
              name,
              description,
              created_by,
              created_at
            )
          `)
          .eq('user_id', user?.id);

        if (memberError) throw memberError;

        // Combine channels
        const memberChannelData = memberChannels?.map(mc => mc.channels).filter(Boolean) || [];
        const allChannels = [...memberChannelData, ...(publicChannels || [])];

        // Remove duplicates
        const uniqueChannels = allChannels.filter((channel: any, index, self) => 
          index === self.findIndex((c: any) => c.id === channel.id)
        );

        // Get member counts
        const channelsWithCounts = await Promise.all(
          uniqueChannels.map(async (channel: any) => {
            const { count } = await supabase
              .from('channel_members')
              .select('*', { count: 'exact', head: true })
              .eq('channel_id', channel.id);
            
            return {
              ...channel,
              member_count: count || 0
            } as Channel;
          })
        );

        setChannels(channelsWithCounts);
        if (!selectedChannel && channelsWithCounts.length > 0 && user) {
          setSelectedChannel(channelsWithCounts[0].id);
        }
      } catch (error) {
        console.error('Error fetching channels:', error);
        toast.error('Failed to load channels');
      } finally {
        setChannelsLoading(false);
      }
    }

    fetchUserChannels();
  }, [user, selectedChannel]);

  // Fetch online users
  useEffect(() => {
    async function fetchOnlineUsers() {
      try {
        setUsersLoading(true);
        const { data, error } = await supabase
          .from('online_users')
          .select(`
            user_id,
            users!online_users_user_id_fkey (
              id,
              email,
              first_name,
              last_name,
              avatar_url
            )
          `)
          .order('last_seen', { ascending: false });

        if (error) throw error;
        
        const formattedUsers = data?.map((item: any) => ({
          id: item.users.id,
          email: item.users.email,
          first_name: item.users.first_name,
          last_name: item.users.last_name,
          avatar_url: item.users.avatar_url
        })) || [];
        
        setOnlineUsers(formattedUsers);
      } catch (error) {
        console.error('Error fetching online users:', error);
        toast.error('Failed to load online users');
      } finally {
        setUsersLoading(false);
      }
    }

    fetchOnlineUsers();
  }, []);

  // Get user role in selected channel
  useEffect(() => {
    if (!selectedChannel || !user) return;

    async function getUserRole() {
      try {
        const { data, error } = await supabase
          .from('channel_members')
          .select('role')
          .eq('channel_id', selectedChannel)
          .eq('user_id', user?.id)
          .single();

        if (!error && data) {
          setUserRole(data.role);
        } else {
          setUserRole('member'); // Default role for public channels
        }
      } catch (error) {
        setUserRole('member');
      }
    }

    getUserRole();
  }, [selectedChannel, user]);

  // Fetch messages and subscribe to real-time updates
  useEffect(() => {
    if (!selectedChannel) return;

    let subscription: any = null;

    async function fetchMessagesAndSubscribe() {
      try {
        setMessagesLoading(true);
        
        const { data, error } = await supabase
          .from('messages')
          .select(`
            id,
            user_id,
            content,
            created_at,
            users!messages_user_id_fkey (
              email,
              first_name,
              last_name,
              avatar_url
            )
          `)
          .eq('channel_id', selectedChannel)
          .order('created_at', { ascending: true });

        if (error) throw error;

        const formattedMessages = data?.map((msg: any) => ({
          id: msg.id,
          user_id: msg.user_id,
          username: msg.users?.first_name || msg.users?.email?.split('@')[0] || 'Unknown',
          avatar_url: msg.users?.avatar_url,
          content: msg.content,
          created_at: msg.created_at
        })) || [];

        setMessages(formattedMessages);
        
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);

        // Subscribe to new messages
        subscription = supabase
          .channel(`messages-${selectedChannel}`)
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'messages',
              filter: `channel_id=eq.${selectedChannel}`
            },
            async (payload) => {
              const newMessage = payload.new as any;
              
              // Get user info for the new message
              const { data: userData } = await supabase
                .from('users')
                .select('email, first_name, last_name, avatar_url')
                .eq('id', newMessage.user_id)
                .single();

              const formattedMessage = {
                id: newMessage.id,
                user_id: newMessage.user_id,
                username: (userData as any)?.first_name || (userData as any)?.email?.split('@')[0] || 'Unknown',
                avatar_url: (userData as any)?.avatar_url,
                content: newMessage.content,
                created_at: newMessage.created_at
              };

              setMessages(prev => [...prev, formattedMessage]);
              
              setTimeout(() => {
                messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
              }, 100);
            }
          )
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'messages',
              filter: `channel_id=eq.${selectedChannel}`
            },
            (payload) => {
              const updatedMessage = payload.new as any;
              setMessages(prev => 
                prev.map(msg => 
                  msg.id === updatedMessage.id 
                    ? { ...msg, content: updatedMessage.content }
                    : msg
                )
              );
            }
          )
          .subscribe();

      } catch (error) {
        console.error('Error fetching messages:', error);
        toast.error('Failed to load messages');
      } finally {
        setMessagesLoading(false);
      }
    }

    fetchMessagesAndSubscribe();

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [selectedChannel]);

  // Send message
  const sendMessage = async () => {
    if (!input.trim() || !selectedChannel || !user) return;

    try {
      const { error } = await supabase
        .from('messages')
        .insert([{
          channel_id: selectedChannel,
          user_id: user.id,
          content: input.trim()
        }]);

      if (error) throw error;

      setInput('');
      inputRef.current?.focus();
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    }
  };

  // Create new channel
  const createChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newChannelName.trim()) return;

    try {
      const { data: channel, error: channelError } = await supabase
        .from('channels')
        .insert([{
          name: newChannelName.trim(),
          description: newChannelDescription.trim() || null,
          created_by: user.id
        }])
        .select()
        .single();

      if (channelError) throw channelError;

      // Add creator as admin member
      await supabase
        .from('channel_members')
        .insert([{
          channel_id: channel.id,
          user_id: user.id,
          role: 'admin'
        }]);

      setNewChannelName('');
      setNewChannelDescription('');
      setShowCreateChannel(false);
      toast.success('Channel created successfully!');
    } catch (error) {
      console.error('Error creating channel:', error);
      toast.error('Failed to create channel');
    }
  };

  // Delete message (only for message owner or channel admin)
  const deleteMessage = async (messageId: string, messageUserId: string) => {
    if (!user || !selectedChannel) return;

    const canDelete = messageUserId === user.id || userRole === 'admin';
    if (!canDelete) {
      toast.error('You can only delete your own messages');
      return;
    }

    try {
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', messageId);

      if (error) throw error;
      toast.success('Message deleted');
    } catch (error) {
      console.error('Error deleting message:', error);
      toast.error('Failed to delete message');
    }
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900">
      <input
        type="text"
        className="mb-6 w-full max-w-md px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-400 text-lg bg-white text-gray-800 shadow-sm"
        placeholder="Search channels (coming soon)"
        disabled
      />
      <div className="px-6 py-4 bg-gray-200 text-gray-700 rounded-lg font-semibold text-center mb-8">
        Channel display will be available soon, as it is not ready.
      </div>
      <SignedIn>
        <div className="min-h-screen flex flex-col bg-white dark:bg-black">
          {/* Top bar */}
          <header className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-black sticky top-16 z-10">
            <div className="flex items-center gap-2">
              <button 
                className="md:hidden px-3 py-2 rounded bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                onClick={() => setShowChannels(v => !v)}
              >
                Channels
              </button>
              <span className="font-bold text-lg text-orange-500">
                {channels.find(c => c.id === selectedChannel)?.name || 'Select Channel'}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <button 
                className="md:hidden px-3 py-2 rounded bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                onClick={() => setShowUsers(v => !v)}
              >
                Online ({onlineUsers.length})
              </button>
              <button
                onClick={() => setShowCreateChannel(true)}
                className="px-3 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 transition-colors"
              >
                + New Channel
              </button>
            </div>
          </header>

          <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
            {/* Channels sidebar */}
            <aside className={`bg-gray-50 dark:bg-gray-900 w-64 p-4 space-y-4 border-r border-gray-200 dark:border-gray-800 md:block ${showChannels ? 'block fixed inset-0 z-20' : 'hidden'} md:static md:z-auto md:h-auto h-full`}>
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-lg">Channels</h2>
                <button 
                  className="md:hidden text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  onClick={() => setShowChannels(false)}
                >
                  ✕
                </button>
              </div>
              
              {channelsLoading ? (
                <div className="text-gray-400">Loading channels...</div>
              ) : channels.length === 0 ? (
                <div className="text-gray-400">No channels available.</div>
              ) : (
                <div className="space-y-2">
                  {channels.map((channel) => (
                    <button
                      key={channel.id}
                      className={`w-full text-left p-3 rounded-lg transition-colors ${
                        selectedChannel === channel.id 
                          ? 'bg-orange-500 text-white' 
                          : 'hover:bg-orange-100 dark:hover:bg-orange-900'
                      }`}
                      onClick={() => { 
                        setSelectedChannel(channel.id); 
                        setShowChannels(false); 
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">#{channel.name}</span>
                        <span className="text-xs opacity-75">{channel.member_count}</span>
                      </div>
                      {channel.description && (
                        <p className="text-xs opacity-75 mt-1 truncate">{channel.description}</p>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </aside>

            {/* Online users sidebar */}
            <aside className={`bg-gray-50 dark:bg-gray-900 w-64 p-4 space-y-4 border-l border-gray-200 dark:border-gray-800 md:block ${showUsers ? 'block fixed inset-0 z-20' : 'hidden'} md:static md:z-auto md:h-auto h-full`}>
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-lg">Online Users</h2>
                <button 
                  className="md:hidden text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  onClick={() => setShowUsers(false)}
                >
                  ✕
                </button>
              </div>
              
              {usersLoading ? (
                <div className="text-gray-400">Loading users...</div>
              ) : onlineUsers.length === 0 ? (
                <div className="text-gray-400">No one online.</div>
              ) : (
                <div className="space-y-2">
                  {onlineUsers.map(user => (
                    <div key={user.id} className="flex items-center gap-2 p-2 rounded bg-green-50 dark:bg-green-900">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm font-medium">{user.first_name || user.email?.split('@')[0] || 'Anonymous'}</span>
                    </div>
                  ))}
                </div>
              )}
            </aside>

            {/* Main chat area */}
            <main className="flex-1 flex flex-col bg-white dark:bg-black">
              {/* Chat messages */}
              <section className="flex-1 overflow-y-auto p-4 space-y-4">
                {messagesLoading ? (
                  <div className="text-gray-400 text-center">Loading messages...</div>
                ) : messages.length === 0 ? (
                  <div className="text-gray-400 text-center">No messages yet. Start the conversation!</div>
                ) : (
                  messages.map((msg) => {
                    const isOwn = msg.user_id === user?.id;
                    return (
                      <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-xs md:max-w-md lg:max-w-lg w-fit p-3 rounded-lg relative group ${
                          isOwn 
                            ? 'bg-orange-500 text-white' 
                            : 'bg-gray-100 dark:bg-gray-800 text-black dark:text-white'
                        }`}>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-semibold">{msg.username}</span>
                            <span className="text-xs opacity-75">{new Date(msg.created_at).toLocaleTimeString()}</span>
                          </div>
                          <div className="break-words">{msg.content}</div>
                          
                          {/* Delete button for own messages or admin */}
                          {(isOwn || userRole === 'admin') && (
                            <button
                              onClick={() => deleteMessage(msg.id, msg.user_id)}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 text-xs opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                              title="Delete message"
                            >
                              ×
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
                
                <div ref={messagesEndRef} />
              </section>

              {/* Input bar */}
              <footer className="p-4 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-black">
                <div className="flex items-center gap-2">
                  <input
                    ref={inputRef}
                    type="text"
                    className="flex-1 px-3 py-2 rounded border border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white dark:bg-gray-800"
                    placeholder="Type a message..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => { 
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                    disabled={!selectedChannel}
                  />
                  <button
                    onClick={sendMessage}
                    className="px-4 py-2 rounded bg-orange-500 text-white font-semibold hover:bg-orange-600 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    disabled={!input.trim() || !selectedChannel}
                  >
                    Send
                  </button>
                </div>
              </footer>
            </main>
          </div>

          {/* Create Channel Modal */}
          {showCreateChannel && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-full max-w-md mx-4">
                <h2 className="text-xl font-bold mb-4">Create New Channel</h2>
                <form onSubmit={createChannel} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Channel Name</label>
                    <input
                      type="text"
                      value={newChannelName}
                      onChange={(e) => setNewChannelName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white dark:bg-gray-700"
                      placeholder="Enter channel name"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Description (optional)</label>
                    <textarea
                      value={newChannelDescription}
                      onChange={(e) => setNewChannelDescription(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white dark:bg-gray-700"
                      placeholder="Enter channel description"
                      rows={3}
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="flex-1 px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 transition-colors"
                    >
                      Create Channel
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowCreateChannel(false)}
                      className="flex-1 px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </SignedIn>
    </div>
  );
};

export default ChannelPage; 
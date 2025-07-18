const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// In-memory message store: { channelName: [ { user, text, timestamp } ] }
const channels = {};
// In-memory user store: { channelName: Set<userId> }
const channelUsers = {};
const userInfo = {};
// In-memory channel list
const channelList = new Set(["general", "anime", "movies", "games", "music", "off-topic"]);
// Voice call user store: { channelName: Set<userId> }
const voiceUsers = {};
// In-memory poll store: { channelName: [ { id, question, options, votes, creator, createdAt } ] }
const polls = {};
// In-memory comments store: { type: { slug: [ { id, parent_id, userId, username, avatarUrl, text, createdAt } ] } }
const comments = { movie: {}, anime: {}, game: {} };
// In-memory ratings store: { type: { slug: { userId: rating, ... } } }
const ratings = { movie: {}, anime: {}, game: {} };

const { v4: uuidv4 } = require('uuid');

function emitUserList(channel) {
  const userIds = Array.from(channelUsers[channel] || []);
  const users = userIds.map((id) => userInfo[id]).filter(Boolean);
  io.to(channel).emit('user-list', users);
}

function emitChannelList() {
  io.emit('channel-list', Array.from(channelList));
}

function emitVoiceUsers(channel) {
  const userIds = Array.from(voiceUsers[channel] || []);
  const users = userIds.map((id) => userInfo[id]).filter(Boolean);
  io.to(channel).emit('voice-users', users);
}

io.on('connection', (socket) => {
  socket.on('join', ({ channel, user }) => {
    socket.join(channel);
    socket.data.user = user;
    socket.data.channel = channel;
    userInfo[user.userId] = user;
    if (!channelUsers[channel]) channelUsers[channel] = new Set();
    channelUsers[channel].add(user.userId);
    // Send existing messages
    socket.emit('history', channels[channel] || []);
    // Notify others
    socket.to(channel).emit('user-joined', user);
    emitUserList(channel);
  });

  socket.on('message', ({ channel, message }) => {
    const msg = {
      ...message,
      timestamp: new Date().toISOString(),
    };
    if (!channels[channel]) channels[channel] = [];
    channels[channel].push(msg);
    io.to(channel).emit('message', msg);
  });

  socket.on('create-channel', (channelName) => {
    if (typeof channelName === 'string' && channelName.trim().length > 0) {
      channelList.add(channelName);
      emitChannelList();
    }
  });

  socket.on('get-channels', () => {
    socket.emit('channel-list', Array.from(channelList));
  });

  socket.on('join-voice', ({ channel, user }) => {
    if (!voiceUsers[channel]) voiceUsers[channel] = new Set();
    voiceUsers[channel].add(user.userId);
    socket.join(channel + '-voice');
    emitVoiceUsers(channel);
    // Notify others to start signaling
    socket.to(channel + '-voice').emit('voice-join', user.userId);
  });

  socket.on('leave-voice', ({ channel, userId }) => {
    if (voiceUsers[channel]) voiceUsers[channel].delete(userId);
    socket.leave(channel + '-voice');
    emitVoiceUsers(channel);
    socket.to(channel + '-voice').emit('voice-leave', userId);
  });

  socket.on('create-poll', ({ channel, poll }) => {
    if (!polls[channel]) polls[channel] = [];
    polls[channel].push(poll);
    io.to(channel).emit('polls', polls[channel]);
  });

  socket.on('vote-poll', ({ channel, pollId, userId, optionIdx }) => {
    const channelPolls = polls[channel] || [];
    const poll = channelPolls.find(p => p.id === pollId);
    if (!poll) return;
    // Remove previous vote by this user
    Object.values(poll.votes).forEach((v, idx) => {
      if (v[userId] !== undefined) delete v[userId];
    });
    // Add new vote
    if (!poll.votes[optionIdx]) poll.votes[optionIdx] = {};
    poll.votes[optionIdx][userId] = true;
    io.to(channel).emit('polls', channelPolls);
  });

  socket.on('get-polls', (channel) => {
    socket.emit('polls', polls[channel] || []);
  });

  socket.on('get-comments', ({ type, slug }) => {
    socket.join(`${type}:${slug}`);
    socket.emit('comments', comments[type]?.[slug] || []);
  });

  socket.on('add-comment', ({ type, slug, comment }) => {
    if (!comments[type]) comments[type] = {};
    if (!comments[type][slug]) comments[type][slug] = [];
    const newComment = { id: uuidv4(), ...comment };
    comments[type][slug].push(newComment);
    io.to(`${type}:${slug}`).emit('comments', comments[type][slug]);
    socket.emit('comments', comments[type][slug]);
  });

  socket.on('get-ratings', ({ type, slug }) => {
    socket.join(`ratings:${type}:${slug}`);
    socket.emit('ratings', ratings[type]?.[slug] || {});
  });

  socket.on('add-rating', ({ type, slug, userId, rating }) => {
    if (!ratings[type]) ratings[type] = {};
    if (!ratings[type][slug]) ratings[type][slug] = {};
    ratings[type][slug][userId] = rating;
    io.to(`ratings:${type}:${slug}`).emit('ratings', ratings[type][slug]);
    socket.emit('ratings', ratings[type][slug]);
  });

  // WebRTC signaling relay
  socket.on('signal', ({ channel, to, from, data }) => {
    // Relay the signal to the intended peer in the same channel
    for (const [id, s] of Object.entries(io.sockets.sockets)) {
      if (s.data.user && s.data.user.userId === to && s.data.channel === channel) {
        s.emit('signal', { from, data });
      }
    }
  });

  socket.on('disconnect', () => {
    const { user, channel } = socket.data;
    if (user && channel && channelUsers[channel]) {
      channelUsers[channel].delete(user.userId);
      emitUserList(channel);
    }
    if (user && channel && voiceUsers[channel]) {
      voiceUsers[channel].delete(user.userId);
      emitVoiceUsers(channel);
      socket.to(channel + '-voice').emit('voice-leave', user.userId);
    }
  });
});

const PORT = process.env.SOCKET_PORT || 4000;
server.listen(PORT, () => {
  console.log(`Socket.IO server running on port ${PORT}`);
}); 
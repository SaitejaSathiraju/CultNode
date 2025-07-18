"use client";
import { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import { useUser, SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";
import UserCard from "../../../components/UserCard";
import ChannelSidebar from "../../../components/ChannelSidebar";
import { use } from "react";
import { v4 as uuidv4 } from "uuid";

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4000";

function formatTime(ts: string) {
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

const ICE_SERVERS = [{ urls: "stun:stun.l.google.com:19302" }];

export default function ChannelPage({ params }: { params: Promise<{ channelName: string }> }) {
  const { channelName } = use(params);
  const { user } = useUser();
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [socket, setSocket] = useState<any>(null);
  const [onlineUsers, setOnlineUsers] = useState<any[]>([]);
  const [inVoice, setInVoice] = useState(false);
  const [voiceUsers, setVoiceUsers] = useState<any[]>([]);
  const [audioStreams, setAudioStreams] = useState<{ [userId: string]: MediaStream }>({});
  const [polls, setPolls] = useState<any[]>([]);
  const [showPollForm, setShowPollForm] = useState(false);
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState(["", ""]);
  const localStreamRef = useRef<MediaStream | null>(null);
  const peerConnections = useRef<{ [userId: string]: RTCPeerConnection }>({});
  const audioRefs = useRef<{ [userId: string]: HTMLAudioElement | null }>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  // Remove mobileSidebarOpen, mobileOnlineOpen, and all WhatsApp-like/floating/modal logic

  useEffect(() => {
    if (!user) return;
    const s = io(SOCKET_URL);
    setSocket(s);
    s.emit("join", {
      channel: channelName,
      user: {
        userId: user.id,
        username: user.username,
        avatarUrl: user.imageUrl,
      },
    });
    s.on("history", (msgs: any[]) => setMessages(msgs));
    s.on("message", (msg: any) => setMessages((m) => [...m, msg]));
    s.on("user-list", (users: any[]) => setOnlineUsers(users));
    // Voice call events
    s.on("voice-users", (users: any[]) => setVoiceUsers(users));
    s.on("voice-join", async (userId: string) => {
      if (!inVoice || !user || !localStreamRef.current) return;
      await createOffer(userId);
    });
    s.on("voice-leave", (userId: string) => {
      if (peerConnections.current[userId]) {
        peerConnections.current[userId].close();
        delete peerConnections.current[userId];
      }
      setAudioStreams((prev) => {
        const copy = { ...prev };
        delete copy[userId];
        return copy;
      });
    });
    s.on("signal", async ({ from, data }) => {
      if (!inVoice || !user) return;
      let pc = peerConnections.current[from];
      if (!pc) {
        pc = createPeerConnection(from);
        peerConnections.current[from] = pc;
      }
      if (data.sdp) {
        await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
        if (data.sdp.type === "offer") {
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          socket.emit("signal", {
            channel: channelName,
            to: from,
            from: user.id,
            data: { sdp: pc.localDescription },
          });
        }
      } else if (data.candidate) {
        await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
      }
    });
    s.on("polls", (pollList: any[]) => setPolls(pollList));
    s.emit("get-polls", channelName);
    return () => { s.disconnect(); };
    // eslint-disable-next-line
  }, [user, channelName, inVoice]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    // Clean up audio streams on leave
    if (!inVoice) {
      Object.values(peerConnections.current).forEach((pc) => pc.close());
      peerConnections.current = {};
      setAudioStreams({});
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
        localStreamRef.current = null;
      }
    }
  }, [inVoice]);

  async function createOffer(peerId: string) {
    const pc = createPeerConnection(peerId);
    peerConnections.current[peerId] = pc;
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    socket.emit("signal", {
      channel: channelName,
      to: peerId,
      from: user.id,
      data: { sdp: pc.localDescription },
    });
  }

  function createPeerConnection(peerId: string) {
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => pc.addTrack(track, localStreamRef.current!));
    }
    pc.onicecandidate = (e) => {
      if (e.candidate) {
        socket.emit("signal", {
          channel: channelName,
          to: peerId,
          from: user.id,
          data: { candidate: e.candidate },
        });
      }
    };
    pc.ontrack = (e) => {
      setAudioStreams((prev) => ({ ...prev, [peerId]: e.streams[0] }));
    };
    return pc;
  }

  function sendMessage() {
    if (!input.trim() || !socket || !user) return;
    socket.emit("message", {
      channel: channelName,
      message: {
        userId: user.id,
        username: user.username,
        avatarUrl: user.imageUrl,
        text: input,
      },
    });
    setInput("");
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  // Basic emoji support: convert :smile: to unicode
  function parseEmojis(text: string) {
    const emojiMap: Record<string, number> = {
      smile: 0x1f604,
      heart: 0x2764,
      thumbsup: 0x1f44d,
      fire: 0x1f525,
      star: 0x2b50,
    };
    return text.replace(/:([a-z_]+):/g, (m, code) => {
      if (emojiMap[code]) {
        return String.fromCodePoint(emojiMap[code]);
      }
      return m;
    });
  }

  async function joinVoice() {
    if (!socket || !user?.id || !user?.username || !user?.imageUrl) return;
    const safeUser = user as NonNullable<typeof user>;
    const { id, username, imageUrl } = safeUser;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStreamRef.current = stream;
      setAudioStreams((prev) => ({ ...prev, [id]: stream }));
      socket.emit("join-voice", { channel: channelName, user: {
        userId: id,
        username,
        avatarUrl: imageUrl,
      }});
      setInVoice(true);
    } catch (err) {
      alert("Could not access microphone");
    }
  }

  function leaveVoice() {
    if (!socket || !user?.id) return;
    const safeUser = user as NonNullable<typeof user>;
    const { id } = safeUser;
    socket.emit("leave-voice", { channel: channelName, userId: id });
    setInVoice(false);
  }

  function handleCreatePoll(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    const options = pollOptions.map(opt => opt.trim()).filter(Boolean);
    if (!pollQuestion.trim() || options.length < 2) return;
    const poll = {
      id: uuidv4(),
      question: pollQuestion.trim(),
      options,
      votes: {}, // { optionIdx: { userId: true } }
      creator: {
        userId: user.id,
        username: user.username,
        avatarUrl: user.imageUrl,
      },
      createdAt: new Date().toISOString(),
    };
    socket.emit("create-poll", { channel: channelName, poll });
    setShowPollForm(false);
    setPollQuestion("");
    setPollOptions(["", ""]);
  }

  function handleVote(pollId: string, optionIdx: number) {
    if (!user) return;
    socket.emit("vote-poll", {
      channel: channelName,
      pollId,
      userId: user.id,
      optionIdx,
    });
  }

  // Add delete handlers
  function handleDeletePoll(pollId: string) {
    if (!user) return;
    socket.emit("delete-poll", { channel: channelName, pollId });
  }
  function handleDeleteMessage(msgId: string) {
    if (!user) return;
    socket.emit("delete-message", { channel: channelName, msgId });
  }

  return (
    <>
      <SignedIn>
        <div className="flex flex-col sm:flex-row h-[80vh] max-w-6xl w-full mx-auto bg-card rounded-2xl shadow-soft border border-soft overflow-hidden">
          {/* Collapsible sidebar on mobile */}
          <div className="sm:w-56 w-full bg-card border-b sm:border-b-0 sm:border-r border-soft flex flex-col py-4 z-20">
            <details className="sm:hidden w-full" open>
              <summary className="text-accent font-bold px-4 py-2 cursor-pointer select-none text-lg">Channels</summary>
              <div className="px-4 pt-2 pb-4">
                <ChannelSidebar currentChannel={channelName} />
              </div>
            </details>
            <div className="hidden sm:block h-full">
              <ChannelSidebar currentChannel={channelName} />
            </div>
          </div>
          {/* Main chat area */}
          <div className="flex flex-col flex-1 h-full min-w-0 bg-background">
            <div className="flex items-center gap-2 px-4 sm:px-8 py-4 sm:py-6 border-b border-soft bg-background">
              <span className="text-xl sm:text-2xl font-extrabold text-accent">#{channelName}</span>
              <div className="ml-auto flex gap-2 sm:gap-3">
                <button onClick={() => setShowPollForm(v => !v)} className="px-3 sm:px-4 py-2 bg-accent hover:bg-accent-hover rounded-lg font-semibold text-sm sm:text-base text-white shadow-soft transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-accent">{showPollForm ? "Cancel" : "Create Poll"}</button>
                {!inVoice ? (
                  <button onClick={joinVoice} className="px-3 sm:px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg font-semibold text-sm sm:text-base text-white shadow-soft transition-all duration-150">Join Voice</button>
                ) : (
                  <button onClick={leaveVoice} className="px-3 sm:px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg font-semibold text-sm sm:text-base text-white shadow-soft transition-all duration-150">Leave Voice</button>
                )}
              </div>
            </div>
            {showPollForm && (
              <form onSubmit={handleCreatePoll} className="bg-card p-4 sm:p-6 flex flex-col gap-3 border-b border-soft rounded-b-2xl shadow-soft mx-2 sm:mx-4 mt-2 sm:mt-4">
                <input
                  className="rounded-lg bg-background text-foreground p-3 text-lg border border-soft focus:outline-none focus:ring-2 focus:ring-accent"
                  placeholder="Poll question"
                  value={pollQuestion}
                  onChange={e => setPollQuestion(e.target.value)}
                  maxLength={100}
                />
                {pollOptions.map((opt, i) => (
                  <input
                    key={i}
                    className="rounded-lg bg-background text-foreground p-2 text-sm border border-soft focus:outline-none focus:ring-2 focus:ring-accent"
                    placeholder={`Option ${i + 1}`}
                    value={opt}
                    onChange={e => setPollOptions(opts => opts.map((o, idx) => idx === i ? e.target.value : o))}
                    maxLength={40}
                  />
                ))}
                <div className="flex gap-2 mt-2">
                  <button type="button" onClick={() => setPollOptions(opts => [...opts, ""])} className="px-3 py-1 bg-card border border-soft rounded text-accent hover:bg-accent/10 transition">+ Option</button>
                  {pollOptions.length > 2 && (
                    <button type="button" onClick={() => setPollOptions(opts => opts.slice(0, -1))} className="px-3 py-1 bg-card border border-soft rounded text-accent hover:bg-accent/10 transition">- Option</button>
                  )}
                  <button type="submit" className="ml-auto px-5 py-2 bg-accent hover:bg-accent-hover rounded-lg font-semibold text-white shadow-soft transition-all duration-150">Create</button>
                </div>
              </form>
            )}
            {inVoice && (
              <div className="flex items-center gap-4 px-4 sm:px-8 py-3 bg-background border-b border-soft">
                <span className="font-semibold text-accent">In Voice:</span>
                {voiceUsers.map((u) => (
                  <div key={u.userId} className="flex flex-col items-center">
                    <UserCard avatarUrl={u.avatarUrl} username={u.username || 'Unknown'} />
                    {audioStreams[u.userId] && (
                      <audio
                        ref={(el) => {
                          audioRefs.current[u.userId] = el;
                          if (el && audioStreams[u.userId]) {
                            el.srcObject = audioStreams[u.userId];
                          }
                        }}
                        autoPlay
                        playsInline
                        controls={false}
                        onCanPlay={() => audioRefs.current[u.userId]?.play()}
                      />
                    )}
                  </div>
                ))}
              </div>
            )}
            {/* Simple chat area */}
            <div className="flex-1 overflow-y-auto px-2 sm:px-8 py-4 sm:py-6 space-y-4 bg-background">
              {/* Render polls */}
              {polls.map((poll) => {
                type VotesType = Record<string, Record<string, boolean>>;
                const votesObj: VotesType = poll.votes || {};
                const totalVotes = Object.values(votesObj).reduce((sum: number, v) => sum + Object.keys(v || {}).length, 0);
                const userVote = user ? Object.entries(votesObj).find(([idx, v]) => v && v[user.id]) : undefined;
                const isCreator = user && poll.creator.userId === user.id;
                return (
                  <div key={poll.id} className="bg-card rounded-xl p-4 sm:p-5 mb-4 shadow-soft border border-accent flex flex-col gap-2 relative" style={{ marginBottom: 16 }}>
                    {isCreator && (
                      <button
                        onClick={() => handleDeletePoll(poll.id)}
                        className="absolute top-3 right-3 text-xs text-red-500 hover:underline font-bold z-10"
                        title="Delete Poll"
                      >
                        Delete
                      </button>
                    )}
                    <div className="flex items-center gap-3 mb-1">
                      <UserCard avatarUrl={poll.creator.avatarUrl} username={poll.creator.username || 'Unknown'} />
                      <span className="text-xs text-secondary ml-2">{new Date(poll.createdAt).toLocaleString()}</span>
                    </div>
                    <div className="font-bold text-lg mb-2 text-accent">{poll.question}</div>
                    <div className="flex flex-col gap-2">
                      {poll.options.map((opt: string, i: number) => {
                        const votes = votesObj[i] ? Object.keys(votesObj[i]).length : 0;
                        const percent = totalVotes ? Math.round((votes / totalVotes) * 100) : 0;
                        return (
                          <button
                            key={i}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all duration-150 font-medium ${userVote ? (userVote[0] == i.toString() ? "bg-accent text-white border-accent" : "bg-card text-secondary border-soft") : "bg-background hover:bg-accent/10 hover:text-accent border-soft"}`}
                            disabled={!!userVote}
                            onClick={() => handleVote(poll.id, i)}
                          >
                            <span className="flex-1 text-left">{opt}</span>
                            <span className="text-xs">{votes} vote{votes !== 1 ? "s" : ""} ({percent}%)</span>
                          </button>
                        );
                      })}
                    </div>
                    {userVote && <div className="text-green-600 text-xs mt-2">You voted: {poll.options[parseInt(userVote[0])]}</div>}
                  </div>
                );
              })}
              {messages.map((msg, i) => {
                const isSender = user && msg.userId === user.id;
                return (
                  <div
                    key={i}
                    className={`flex items-start gap-3 bg-card rounded-xl p-4 sm:p-4 shadow-soft border border-soft relative ${isSender ? 'bg-accent/10 sm:bg-card justify-end' : ''}`}
                    style={{ marginBottom: 12, flexDirection: isSender ? 'row-reverse' : 'row' }}
                    aria-label={isSender ? 'Your message' : 'Message'}
                  >
                    {isSender && (
                      <button
                        onClick={() => handleDeleteMessage(msg.id)}
                        className="absolute top-3 right-3 text-xs text-red-500 hover:underline font-bold z-10"
                        title="Delete Message"
                        aria-label="Delete your message"
                      >
                        Delete
                      </button>
                    )}
                    <UserCard avatarUrl={msg.avatarUrl} username={msg.username || 'Unknown'} />
                    <div className="flex-1">
                      <div className="text-base text-foreground mb-1" style={{ fontSize: '1.08rem' }}>
                        <span dangerouslySetInnerHTML={{ __html: parseEmojis(msg.text) }} />
                      </div>
                      <div className="text-xs text-secondary mt-1" style={{ fontSize: '0.98rem' }}>{formatTime(msg.timestamp)}</div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
              <div style={{ height: 16 }} />
            </div>
            {/* Simple input bar at the bottom */}
            <div className="p-2 sm:p-6 border-t border-soft flex gap-2 sm:gap-3 bg-card rounded-b-2xl shadow-soft">
              <textarea
                className="flex-1 rounded-lg bg-background text-foreground p-3 border border-soft focus:outline-none focus:ring-2 focus:ring-accent text-base sm:text-lg"
                rows={1}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a message... (use :smile:, :heart:, :thumbsup:, :fire:, :star:)"
              />
              <button
                className="px-5 py-2 bg-accent hover:bg-accent-hover rounded-lg font-semibold text-white shadow-soft transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-accent text-base sm:text-lg"
                onClick={sendMessage}
              >
                Send
              </button>
            </div>
          </div>
          {/* Online list for mobile */}
          <details className="sm:hidden w-full border-t border-soft" open>
            <summary className="text-accent font-bold px-4 py-2 cursor-pointer select-none text-lg">Online</summary>
            <div className="flex flex-col gap-3 px-4 pb-4">
              {onlineUsers.map((u) => (
                <UserCard key={u.userId} avatarUrl={u.avatarUrl} username={u.username || 'Unknown'} />
              ))}
            </div>
          </details>
          {/* Online list for desktop */}
          <aside className="hidden sm:flex w-56 bg-card border-l border-soft h-full flex-col py-6">
            <div className="px-6 pb-4 text-lg font-bold text-accent">Online</div>
            <div className="flex-1 flex flex-col gap-3 px-2 overflow-y-auto">
              {onlineUsers.map((u) => (
                <UserCard key={u.userId} avatarUrl={u.avatarUrl} username={u.username || 'Unknown'} />
              ))}
            </div>
          </aside>
        </div>
      </SignedIn>
      <SignedOut>
        <div className="flex flex-col items-center justify-center h-[60vh]">
          <h2 className="text-2xl font-bold mb-4">Sign in to join the chat</h2>
          <SignInButton mode="modal">
            <button className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-lg font-semibold text-lg">Sign In</button>
          </SignInButton>
        </div>
      </SignedOut>
    </>
  );
} 
type UserCardProps = {
  avatarUrl: string;
  username: string;
  flair?: string;
};

export default function UserCard({ avatarUrl, username, flair }: UserCardProps) {
  return (
    <div className="flex items-center gap-4 p-3 bg-gray-800 rounded-lg shadow">
      <img
        src={avatarUrl}
        alt={username + "'s avatar"}
        className="w-12 h-12 rounded-full border-2 border-indigo-500 object-cover"
      />
      <div>
        <div className="font-bold text-lg text-indigo-300">{username}</div>
        {flair && <div className="text-xs text-indigo-400">{flair}</div>}
      </div>
    </div>
  );
} 
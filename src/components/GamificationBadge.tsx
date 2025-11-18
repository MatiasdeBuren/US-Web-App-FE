import { Trophy } from "lucide-react";
import { useEffect, useState } from "react";
import { getGamificationProfile, type UserGamification, formatPoints } from "../api_calls/gamification";

interface GamificationBadgeProps {
  userId: number;
  onClick?: () => void;
}

export default function GamificationBadge({ userId, onClick }: GamificationBadgeProps) {
  const [profile, setProfile] = useState<UserGamification | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, [userId]);

  const loadProfile = async () => {
    try {
      const data = await getGamificationProfile(userId);
      setProfile(data);
    } catch (error) {
      console.error("Error loading gamification profile:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !profile) {
    return null;
  }

  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-500/10 to-blue-500/10 hover:from-purple-500/20 hover:to-blue-500/20 border border-purple-500/20 transition-all duration-200"
    >
      <div 
        className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg"
        style={{ backgroundColor: profile.level.color }}
      >
        <Trophy className="w-3.5 h-3.5" />
      </div>
      
      <div className="flex flex-col items-start">
        <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">
          {profile.level.displayName}
        </span>
        <span className="text-[10px] text-gray-500 dark:text-gray-400">
          {formatPoints(profile.totalPoints)} pts
        </span>
      </div>
    </button>
  );
}

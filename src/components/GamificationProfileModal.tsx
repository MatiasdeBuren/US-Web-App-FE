import { X, Trophy, Star, TrendingUp, Award, Calendar } from "lucide-react";
import { useEffect, useState } from "react";
import { 
  getGamificationProfile, 
  type UserGamification, 
  formatPoints, 
  calculateLevelProgress 
} from "../api_calls/gamification";

interface GamificationProfileModalProps {
  userId: number;
  onClose: () => void;
}

export default function GamificationProfileModal({ userId, onClose }: GamificationProfileModalProps) {
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
      console.error("Error loading profile:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  const levelProgress = calculateLevelProgress(profile.totalPoints, profile.level);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Mi Perfil de Gamificación</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div 
            className="rounded-xl p-6 text-white"
            style={{ 
              background: `linear-gradient(135deg, ${profile.level.color}dd, ${profile.level.color}99)` 
            }}
          >
            <div className="flex items-center gap-4 mb-4">
              <div 
                className="w-16 h-16 rounded-full flex items-center justify-center shadow-lg"
                style={{ backgroundColor: profile.level.color }}
              >
                <Trophy className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold">{profile.level.displayName}</h3>
                <p className="text-white/90">{formatPoints(profile.totalPoints)} puntos</p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progreso al siguiente nivel</span>
                <span>{levelProgress.pointsToNext} pts restantes</span>
              </div>
              <div className="w-full bg-white/20 rounded-full h-3">
                <div
                  className="bg-white rounded-full h-3 transition-all duration-500"
                  style={{ width: `${levelProgress.percentage}%` }}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              icon={<Calendar className="w-5 h-5" />}
              label="Días consecutivos"
              value={profile.consecutiveDays}
              color="blue"
            />
            <StatCard
              icon={<Trophy className="w-5 h-5" />}
              label="Reservas completadas"
              value={profile.reservationsCompleted}
              color="green"
            />
            <StatCard
              icon={<Star className="w-5 h-5" />}
              label="Calificaciones"
              value={profile.ratingsGiven}
              color="yellow"
            />
            <StatCard
              icon={<TrendingUp className="w-5 h-5" />}
              label="Reclamos creados"
              value={profile.claimsCreated}
              color="purple"
            />
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Award className="w-5 h-5" />
              Logros Desbloqueados ({profile.achievements.length})
            </h3>
            
            {profile.achievements.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                Aún no has desbloqueado ningún logro. ¡Sigue participando!
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {profile.achievements.slice(0, 6).map((ua) => (
                  <div
                    key={ua.id}
                    className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50"
                  >
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
                      style={{ 
                        backgroundColor: ua.achievement.rarity.color + '20',
                        border: `2px solid ${ua.achievement.rarity.color}`
                      }}
                    >
                      {ua.achievement.icon}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-sm text-gray-900 dark:text-white">
                        {ua.achievement.displayName}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {ua.achievement.description}
                      </p>
                      {ua.timesEarned > 1 && (
                        <span className="text-xs text-purple-600 dark:text-purple-400 font-medium">
                          x{ua.timesEarned}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: 'blue' | 'green' | 'yellow' | 'purple';
}

function StatCard({ icon, label, value, color }: StatCardProps) {
  const colors = {
    blue: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    green: 'bg-green-500/10 text-green-600 dark:text-green-400',
    yellow: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400',
    purple: 'bg-purple-500/10 text-purple-600 dark:text-purple-400'
  };

  return (
    <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700/50">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-2 ${colors[color]}`}>
        {icon}
      </div>
      <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
      <p className="text-xs text-gray-600 dark:text-gray-400">{label}</p>
    </div>
  );
}

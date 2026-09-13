import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useUser, type UserProfile } from '../context/UserContext';
import { useSessions, type Session } from '../context/SessionContext';
import { ACHIEVEMENTS, TIERS } from '../lib/achievements';
import Sidebar from '../components/Sidebar';
import PageTransition from '../components/PageTransition';
import { ConsistencyMatrix } from '../components/ConsistencyMatrix';
import { CircadianHorizon } from '../components/CircadianHorizon';
import { calculateCircadian, generateMatrix } from '../lib/telemetry';

export default function Profile() {
  const { userId } = useParams<{ userId?: string }>();
  const navigate = useNavigate();
  const { profile: currentUserProfile, updateProfileDetails } = useUser();
  const { sessions: currentUserSessions } = useSessions();

  // If no userId is provided, we're viewing our own profile
  const isSelf = !userId || (currentUserProfile && userId === currentUserProfile.uid);
  const targetUserId = isSelf ? (currentUserProfile?.uid || '') : (userId || '');

  const [loading, setLoading] = useState(!isSelf);
  const [profileData, setProfileData] = useState<UserProfile | null>(isSelf ? currentUserProfile : null);
  const [sessionData, setSessionData] = useState<Session[]>(isSelf ? currentUserSessions : []);
  
  // Editing state
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editBio, setEditBio] = useState('');

  // Selected year for matrix
  const [selectedYear, setSelectedYear] = useState<number | 'last-365'>('last-365');

  // Fetch targeted user data if not self
  useEffect(() => {
    if (isSelf) {
      setProfileData(currentUserProfile);
      setSessionData(currentUserSessions);
      setEditName(currentUserProfile?.displayName || '');
      setEditBio(currentUserProfile?.bio || '');
      setLoading(false);
      return;
    }

    if (!targetUserId) return;

    let isMounted = true;
    const fetchUser = async () => {
      setLoading(true);
      try {
        const docRef = doc(db, 'users', targetUserId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists() && isMounted) {
          const fetchedProfile = docSnap.data() as UserProfile;
          setProfileData(fetchedProfile);
          
          // Fetch public sessions
          const sessionsRef = collection(db, 'users', targetUserId, 'sessions');
          const sessionsSnap = await getDocs(sessionsRef);
          const fetchedSessions = sessionsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Session));
          setSessionData(fetchedSessions);
        } else if (isMounted) {
          setProfileData(null); // User not found
        }
      } catch (err) {
        console.error("Failed to fetch user profile", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchUser();
    return () => { isMounted = false; };
  }, [isSelf, targetUserId, currentUserProfile, currentUserSessions]);

  // Derived state
  const totalFocusMinutes = profileData?.totalFocusMinutes || 0;
  const totalFocusHours = Math.floor(totalFocusMinutes / 60);
  const totalTasks = profileData?.totalTasks || 0;
  const currentStreak = profileData?.currentStreak || 0;
  const level = profileData?.level || 1;
  const ap = profileData?.ap || 0;
  
  const xp = profileData?.xp || 0;
  const currentLevelBaseXP = 100 * Math.pow(level - 1, 2);
  const nextLevelBaseXP = 100 * Math.pow(level, 2);
  const xpProgress = xp - currentLevelBaseXP;
  const xpRequired = nextLevelBaseXP - currentLevelBaseXP;
  const progressPercent = Math.min(100, Math.max(0, (xpProgress / xpRequired) * 100));

  const unlockedIds = profileData?.achievements || [];
  const claimedIds = profileData?.claimedAchievements || [];
  const equippedTitle = profileData?.equipped?.title?.replace('title-', '')?.replace('-', ' ')?.toUpperCase() || 'NOVICE';
  
  const monogram = profileData?.displayName?.charAt(0).toUpperCase() || '?';

  // Handle saving edits
  const handleSaveEdit = async () => {
    if (!isSelf || !currentUserProfile) return;
    setIsEditing(false);
    await updateProfileDetails({
      displayName: editName.trim() || currentUserProfile.displayName,
      bio: editBio.trim()
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex text-[var(--text-primary)]" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <Sidebar />
        <main className="flex-1 md:ml-60 flex items-center justify-center">
          <div className="font-mono animate-pulse uppercase tracking-widest text-[var(--text-muted)]">
            Loading Dossier...
          </div>
        </main>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="min-h-screen flex text-[var(--text-primary)]" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <Sidebar />
        <main className="flex-1 md:ml-60 flex items-center justify-center flex-col">
          <div className="font-mono text-xl mb-4 text-[var(--text-muted)]">404_ASCENDER_NOT_FOUND</div>
          <button onClick={() => navigate(-1)} className="font-mono text-sm underline hover:text-[var(--accent)]">
            RETURN TO PREVIOUS
          </button>
        </main>
      </div>
    );
  }

  // Derive highest mastery tier
  let highestTier = 0;
  for (let i = 6; i >= 1; i--) {
    if (claimedIds.includes(`tier-${i}-mastery`)) {
      highestTier = i;
      break;
    }
  }

  const { startDate, endDate } = (() => {
    if (selectedYear === 'last-365') {
      const end = new Date();
      const start = new Date();
      start.setDate(end.getDate() - 364);
      return { startDate: start, endDate: end };
    } else {
      return {
        startDate: new Date(selectedYear, 0, 1),
        endDate: new Date(selectedYear, 11, 31)
      };
    }
  })();

  const matrixData = generateMatrix(sessionData, startDate, endDate);
  const circadianData = calculateCircadian(sessionData);

  return (
    <PageTransition>
      <div className="min-h-screen flex" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <Sidebar />
        
        <main className="flex-1 md:ml-60 relative overflow-y-auto custom-scrollbar text-[var(--text-primary)] pt-24 md:pt-0">
          <div className="max-w-5xl mx-auto p-4 md:p-12">
            
            {!isSelf && (
              <button 
                onClick={() => navigate('/leaderboard')}
                className="mb-8 font-mono text-xs tracking-widest text-[var(--text-muted)] hover:text-white flex items-center gap-2 transition-colors"
              >
                ← BACK TO LEADERBOARD
              </button>
            )}

            {/* IDENTITY HEADER */}
            <div className="flex flex-col md:flex-row gap-10 items-start md:items-center mb-16">
              
              <div className="relative">
                <div className="w-32 h-32 flex items-center justify-center border-2" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface-1)' }}>
                  <span className="text-5xl font-light font-mono text-white">{monogram}</span>
                </div>
                {/* Level Ring / Badge */}
                <div className="absolute -bottom-3 -right-3 w-10 h-10 border flex items-center justify-center bg-black font-mono text-xs font-bold" style={{ borderColor: 'var(--accent)' }}>
                  {level}
                </div>
              </div>

              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <div>
                    {isEditing ? (
                      <div className="mb-2">
                        <input 
                          type="text" 
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="text-4xl font-medium tracking-tight bg-transparent border-b border-white/30 text-white focus:outline-none focus:border-white px-1 py-0.5"
                          placeholder="Display Name"
                          maxLength={24}
                        />
                      </div>
                    ) : (
                      <h1 className="text-4xl font-medium tracking-tight mb-2 text-white flex items-center gap-3">
                        {profileData.displayName}
                        {highestTier > 0 && (
                          <span className="text-xs px-2 py-0.5 border border-[var(--accent)] text-[var(--accent)] font-mono tracking-widest uppercase">
                            TIER {highestTier} ASCENDANT
                          </span>
                        )}
                      </h1>
                    )}
                    
                    <div className="font-mono text-sm tracking-widest text-[var(--accent)] mb-4">
                      [ {equippedTitle} ]
                    </div>
                  </div>

                  {isSelf && (
                    <div>
                      {isEditing ? (
                        <button 
                          onClick={handleSaveEdit}
                          className="font-mono text-xs border border-white/20 px-4 py-2 hover:bg-white hover:text-black transition-colors"
                        >
                          SAVE CHANGES
                        </button>
                      ) : (
                        <button 
                          onClick={() => setIsEditing(true)}
                          className="font-mono text-xs border border-white/20 px-4 py-2 text-[var(--text-muted)] hover:text-white transition-colors"
                        >
                          EDIT DOSSIER
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <div className="max-w-2xl">
                  {isEditing ? (
                    <input 
                      type="text" 
                      value={editBio}
                      onChange={(e) => setEditBio(e.target.value)}
                      className="w-full text-sm font-mono tracking-wide bg-transparent border-b border-white/30 text-[var(--text-secondary)] focus:outline-none focus:border-white px-1 py-0.5"
                      placeholder="Add a motto or short bio..."
                      maxLength={100}
                    />
                  ) : (
                    <p className="text-sm font-mono tracking-wide text-[var(--text-secondary)]">
                      {profileData.bio || (isSelf ? "No motto set. Click 'Edit Dossier' to add one." : "No motto provided.")}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* CORE VITALS */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-16">
              <div className="border p-5 flex flex-col justify-between" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface-1)' }}>
                <div className="text-[10px] font-mono tracking-widest text-[var(--text-muted)] mb-2 uppercase">Lifetime Focus</div>
                <div className="text-2xl font-medium text-white">{totalFocusHours} <span className="text-sm text-[var(--text-muted)]">HRS</span></div>
              </div>
              <div className="border p-5 flex flex-col justify-between" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface-1)' }}>
                <div className="text-[10px] font-mono tracking-widest text-[var(--text-muted)] mb-2 uppercase">Tasks Conquered</div>
                <div className="text-2xl font-medium text-white">{totalTasks}</div>
              </div>
              <div className="border p-5 flex flex-col justify-between" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface-1)' }}>
                <div className="text-[10px] font-mono tracking-widest text-[var(--text-muted)] mb-2 uppercase">Current Streak</div>
                <div className="text-2xl font-medium text-white flex items-baseline gap-2">
                  {currentStreak} <span className="text-sm text-[var(--text-muted)]">DAYS</span>
                  {profileData.streakShields > 0 && <span className="text-xs text-[var(--accent)]" title="Shield Active">🛡️</span>}
                </div>
              </div>
              <div className="border p-5 flex flex-col justify-between relative overflow-hidden" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface-1)' }}>
                <div className="text-[10px] font-mono tracking-widest text-[var(--text-muted)] mb-2 uppercase">Total AP Earned</div>
                <div className="text-2xl font-medium text-white">{ap}</div>
              </div>
              <div className="border p-5 flex flex-col justify-between relative overflow-hidden" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface-1)' }}>
                <div className="text-[10px] font-mono tracking-widest text-[var(--text-muted)] mb-2 uppercase">Next Level</div>
                <div className="text-2xl font-medium text-white">{Math.round(progressPercent)}%</div>
                <div className="absolute bottom-0 left-0 h-1 bg-[var(--accent)]" style={{ width: `${progressPercent}%` }} />
              </div>
            </div>

            {/* TELEMETRY MATRIX */}
            <div className="mb-16">
              <div className="flex justify-between items-end mb-6 border-b border-[var(--border)] pb-2">
                <h2 className="font-mono text-xl tracking-wider uppercase">Activity Matrix</h2>
                <select 
                  value={selectedYear} 
                  onChange={(e) => setSelectedYear(e.target.value === 'last-365' ? 'last-365' : parseInt(e.target.value))}
                  className="bg-transparent text-[var(--text-secondary)] font-mono text-sm border-none focus:outline-none cursor-pointer"
                >
                  <option value="last-365">Last 365 Days</option>
                  <option value={new Date().getFullYear()}>{new Date().getFullYear()}</option>
                  <option value={new Date().getFullYear() - 1}>{new Date().getFullYear() - 1}</option>
                </select>
              </div>
              <div className="border p-6" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface-1)' }}>
                <ConsistencyMatrix matrix={matrixData} />
              </div>
            </div>

            {/* CIRCADIAN & ACHIEVEMENTS */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
              <div>
                <h2 className="font-mono text-xl tracking-wider mb-6 border-b border-[var(--border)] pb-2 uppercase">Circadian Rhythm</h2>
                <div className="border p-6 h-64" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface-1)' }}>
                  <CircadianHorizon 
                    hourly={circadianData.hourly}
                    quartiles={circadianData.quartiles}
                    peakWindow={circadianData.peakWindow}
                  />
                </div>
              </div>

              <div>
                <h2 className="font-mono text-xl tracking-wider mb-6 border-b border-[var(--border)] pb-2 uppercase">Feats & Mastery</h2>
                <div className="border p-6 h-64 flex flex-col" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface-1)' }}>
                  
                  <div className="flex justify-between items-end mb-4">
                    <div className="text-3xl font-medium text-white">{unlockedIds.length} <span className="text-sm text-[var(--text-muted)] font-mono">/ 108</span></div>
                    <div className="text-[10px] font-mono tracking-widest text-[var(--text-muted)] uppercase">Total Unlocked</div>
                  </div>

                  <div className="flex-1 overflow-y-auto hidden-scrollbar space-y-2 mt-4">
                    {TIERS.slice().reverse().map(tier => {
                      const tierAchs = ACHIEVEMENTS.filter(a => a.tier === tier.level);
                      const isMastered = claimedIds.includes(`tier-${tier.level}-mastery`);
                      const unlockedCount = tierAchs.filter(a => unlockedIds.includes(a.id)).length;
                      
                      if (unlockedCount === 0) return null;

                      return (
                        <div key={tier.level} className="flex justify-between items-center text-sm font-mono border-b border-white/5 pb-2">
                          <span className={`tracking-widest ${isMastered ? 'text-white font-bold' : 'text-[var(--text-secondary)]'}`}>
                            {isMastered ? `★ TIER ${tier.level}: ${tier.name.toUpperCase()}` : `TIER ${tier.level}: ${tier.name.toUpperCase()}`}
                          </span>
                          <span className={isMastered ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]'}>
                            {isMastered ? 'MASTERED' : `${unlockedCount}/${tierAchs.length}`}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  
                  {isSelf && (
                    <button 
                      onClick={() => navigate('/achievements')}
                      className="mt-4 w-full py-2 border border-white/20 font-mono text-xs tracking-widest text-[var(--text-muted)] hover:text-white transition-colors"
                    >
                      VIEW ALL ACHIEVEMENTS
                    </button>
                  )}
                </div>
              </div>
            </div>
            
            {/* LOADOUT */}
            <div className="mb-16">
              <h2 className="font-mono text-xl tracking-wider mb-6 border-b border-[var(--border)] pb-2 uppercase">Equipped Loadout</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="border p-4 flex items-center justify-between" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface-1)' }}>
                  <div>
                    <div className="text-[10px] font-mono tracking-widest text-[var(--text-muted)] mb-1 uppercase">Theme</div>
                    <div className="font-mono text-sm text-white tracking-wide">{profileData.equipped?.theme?.replace('theme-', '') || 'Default'}</div>
                  </div>
                  {isSelf && <button onClick={() => navigate('/store')} className="text-[10px] font-mono border px-2 py-1 hover:bg-white hover:text-black">CHANGE</button>}
                </div>
                <div className="border p-4 flex items-center justify-between" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface-1)' }}>
                  <div>
                    <div className="text-[10px] font-mono tracking-widest text-[var(--text-muted)] mb-1 uppercase">Title</div>
                    <div className="font-mono text-sm text-white tracking-wide">{equippedTitle}</div>
                  </div>
                  {isSelf && <button onClick={() => navigate('/store')} className="text-[10px] font-mono border px-2 py-1 hover:bg-white hover:text-black">CHANGE</button>}
                </div>
                <div className="border p-4 flex items-center justify-between" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface-1)' }}>
                  <div>
                    <div className="text-[10px] font-mono tracking-widest text-[var(--text-muted)] mb-1 uppercase">Soundscape</div>
                    <div className="font-mono text-sm text-white tracking-wide">{profileData.equipped?.sound?.replace('sound-', '') || 'None'}</div>
                  </div>
                  {isSelf && <button onClick={() => navigate('/store')} className="text-[10px] font-mono border px-2 py-1 hover:bg-white hover:text-black">CHANGE</button>}
                </div>
              </div>
            </div>

          </div>
        </main>
      </div>
    </PageTransition>
  );
}

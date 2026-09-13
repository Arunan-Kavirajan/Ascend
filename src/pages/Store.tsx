import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Sidebar from "../components/Sidebar";
import PageTransition from "../components/PageTransition";
import { STORE_ITEMS, type StoreItem } from '../lib/constants';
import { useUser } from "../context/UserContext";
import { createAmbienceEngine, type AmbienceEngine, type AmbienceType } from "../lib/ambience";

type Tab = 'titles' | 'themes' | 'soundscapes' | 'provisions';

export default function Store() {
  const { profile, purchaseItem, equipItem, unequipItem } = useUser();
  const [activeTab, setActiveTab] = useState<Tab>('soundscapes');
  
  // Audio Engine State
  const engineRef = useRef<AmbienceEngine | null>(null);
  const [previewingSound, setPreviewingSound] = useState<string | null>(null);

  useEffect(() => {
    engineRef.current = createAmbienceEngine();
    engineRef.current.setVolume(0.5); // Preview volume
    return () => {
      engineRef.current?.stop();
    };
  }, []);

  const togglePreview = (soundId: string) => {
    if (!engineRef.current) return;
    
    if (previewingSound === soundId) {
      engineRef.current.stop();
      setPreviewingSound(null);
    } else {
      const type = soundId.replace('sound-', '') as AmbienceType;
      engineRef.current.start(type);
      setPreviewingSound(soundId);
    }
  };

  const [confirmingItem, setConfirmingItem] = useState<StoreItem | null>(null);

  const handlePurchase = async (item: StoreItem) => {
    if (!profile) return;
    if (profile.ap < item.price) {
      alert("Not enough AP!");
      return;
    }
    setConfirmingItem(item);
  };

  const executePurchase = async () => {
    if (!confirmingItem) return;
    await purchaseItem(confirmingItem.id, confirmingItem.price, confirmingItem.levelReq, confirmingItem.type);
    setConfirmingItem(null);
  };

  const handleEquip = async (type: 'title' | 'theme' | 'sound', id: string) => {
    await equipItem(type, id);
    if (type === 'sound' && previewingSound) {
      engineRef.current?.stop();
      setPreviewingSound(null);
    }
  };

  const renderItems = (items: StoreItem[], type: 'title' | 'theme' | 'sound' | 'consumable') => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <AnimatePresence>
        {items.map((item, i) => {
          if (!profile) return null;
          
          let isOwned = false;
          let isEquipped = false;
          let currentAmount = 0;
          let isMaxed = false;

          if (type === 'title' || type === 'sound' || type === 'theme') {
            isOwned = profile.inventory.includes(item.id) || item.price === 0;
            if (type === 'title') isEquipped = profile.equipped?.title === item.id;
            if (type === 'theme') isEquipped = profile.equipped?.theme === item.id;
            if (type === 'sound') isEquipped = profile.equipped?.sound === item.id;
          } else if (type === 'consumable') {
            if (item.id === 'streak-shield') {
              currentAmount = profile.streakShields || 0;
              isMaxed = currentAmount >= 3;
            } else {
              currentAmount = profile.boosters?.[item.id] || 0;
              // No hard max for elixirs, but maybe visually cap
            }
          }

          const isLocked = item.levelReq > profile.level;
          
          return (
            <motion.div 
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: i * 0.05 }}
              className={`border p-6 transition-all duration-200 flex flex-col justify-between min-h-[180px] rounded-none ${isLocked && !isOwned ? 'border-[var(--border)] bg-[var(--bg-primary)] opacity-50 grayscale' : 'border-[var(--border)] bg-[var(--surface-1)] hover:border-[var(--border-hover)]'}`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-mono text-lg text-[var(--text-primary)]">{item.name}</h3>
                  {type === 'theme' && item.preview && (
                    <div 
                      className="w-8 h-4 rounded border flex items-center justify-center p-0.5" 
                      style={{ backgroundColor: item.preview.bg, borderColor: item.preview.border }}
                    >
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.preview.accent }} />
                    </div>
                  )}
                  {type === 'consumable' && (
                    <span className="text-[var(--accent)] text-sm font-mono font-bold">[{currentAmount}{item.id === 'streak-shield' ? '/3' : ''}]</span>
                  )}
                  {type === 'sound' && (
                    <button 
                      onClick={() => togglePreview(item.id)}
                      className={`w-8 h-8 rounded-full flex items-center justify-center border transition-colors ${previewingSound === item.id ? 'border-[var(--accent)] text-[var(--accent)]' : 'border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--text-primary)]'}`}
                      title={previewingSound === item.id ? 'Stop Preview' : 'Preview Audio'}
                    >
                      {previewingSound === item.id ? (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>
                      ) : (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="ml-0.5"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                      )}
                    </button>
                  )}
                </div>
                <p className="text-[var(--text-secondary)] text-sm font-sans leading-relaxed">{item.description}</p>
              </div>
              
              <div className="mt-6 flex items-center justify-between">
                {isOwned && type !== 'consumable' ? (
                  isEquipped ? (
                    <div className="flex items-center gap-3 w-full justify-between">
                      <span className="text-[var(--text-primary)] font-mono text-sm tracking-widest font-semibold">[ EQUIPPED ]</span>
                      {type === 'title' && (
                        <button 
                          onClick={() => unequipItem('title')}
                          className="font-mono text-xs text-[var(--text-muted)] hover:text-[var(--accent-danger)] transition-all cursor-pointer tracking-wider hover:underline"
                        >
                          [ UNEQUIP ]
                        </button>
                      )}
                    </div>
                  ) : (
                    <button 
                      onClick={() => handleEquip(type as 'title' | 'theme' | 'sound', item.id)}
                      className="font-mono text-sm text-[var(--text-primary)] hover:text-[var(--accent)] transition-all cursor-pointer tracking-widest hover:underline"
                    >
                      [ EQUIP ]
                    </button>
                  )
                ) : isLocked ? (
                  <button 
                    disabled
                    className="font-mono text-sm text-[var(--accent-rose)] opacity-80 cursor-not-allowed tracking-widest"
                  >
                    [ REQUIRES LVL {item.levelReq} ]
                  </button>
                ) : isMaxed ? (
                  <span className="text-[var(--text-muted)] font-mono text-sm tracking-widest">[ MAXED ]</span>
                ) : (
                  <button 
                    onClick={() => handlePurchase(item)}
                    disabled={profile.ap < item.price}
                    className={`font-mono text-sm transition-all tracking-widest ${profile.ap >= item.price ? 'text-[var(--text-primary)] hover:text-[var(--accent)] cursor-pointer hover:underline' : 'text-[var(--text-faint)] cursor-not-allowed'}`}
                  >
                    [ BUY - {item.price} AP ]
                  </button>
                )}
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );

  return (
    <PageTransition>
      <div className="min-h-screen flex" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <Sidebar />
        
        <main className="flex-1 md:ml-60 relative overflow-y-auto pt-24 md:pt-0">
          <div className="max-w-5xl mx-auto p-6 md:p-12">
            
            <div className="flex justify-between items-end border-b border-[var(--border)] pb-8 mb-8">
              <div>
                <h1 className="font-mono text-4xl tracking-tight mb-2 uppercase text-[var(--text-primary)]">The Emporium</h1>
                <p className="text-sm text-[var(--text-secondary)] font-mono uppercase tracking-widest">
                  Exchange AP for Cosmetics, Soundscapes, and Boosters
                </p>
              </div>
              {profile && (
                <div className="text-right">
                  <p className="text-xs text-[var(--text-muted)] font-mono uppercase mb-1 tracking-widest">Balance</p>
                  <p className="font-mono text-2xl text-[var(--accent)] font-bold">{profile.ap} AP</p>
                </div>
              )}
            </div>

            {/* Tabs */}
            <div className="flex space-x-6 md:space-x-8 border-b border-[var(--border)] mb-12 overflow-x-auto whitespace-nowrap scrollbar-hide pb-2">
              {(['soundscapes', 'titles', 'themes', 'provisions'] as Tab[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => {
                    setActiveTab(tab);
                    if (previewingSound) {
                      engineRef.current?.stop();
                      setPreviewingSound(null);
                    }
                  }}
                  className={`pb-4 font-mono text-sm uppercase tracking-widest transition-colors relative ${activeTab === tab ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'}`}
                >
                  {tab}
                  {activeTab === tab && (
                    <motion.div 
                      layoutId="activeTab"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--text-primary)]"
                    />
                  )}
                </button>
              ))}
            </div>

            {!profile ? (
              <div className="text-[var(--text-muted)] font-mono animate-pulse">LOADING DATABANKS...</div>
            ) : (
              <div>
                {activeTab === 'soundscapes' && renderItems(STORE_ITEMS.filter(i => i.type === 'sound'), 'sound')}
                {activeTab === 'titles' && renderItems(STORE_ITEMS.filter(i => i.type === 'title'), 'title')}
                {activeTab === 'themes' && renderItems(STORE_ITEMS.filter(i => i.type === 'theme'), 'theme')}
                {activeTab === 'provisions' && renderItems(STORE_ITEMS.filter(i => i.type === 'consumable'), 'consumable')}
              </div>
            )}

          </div>
        </main>
      </div>

      {/* Purchase Confirmation Modal */}
      <AnimatePresence>
        {confirmingItem && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              className="bg-[var(--bg-primary)] border border-[var(--border)] p-8 max-w-md w-full"
            >
              <h3 className="font-mono text-xl text-[var(--text-primary)] mb-2 uppercase tracking-widest">Confirm Acquisition</h3>
              <p className="text-[var(--text-secondary)] text-sm mb-6">Are you sure you want to exchange AP for <span className="text-[var(--text-primary)] font-bold">{confirmingItem.name}</span>?</p>
              
              <div className="flex justify-between items-center mb-8 border border-[var(--border)] p-4 bg-[var(--surface-1)]">
                <span className="font-mono text-xs text-[var(--text-muted)] tracking-widest uppercase">Cost</span>
                <span className="font-mono text-[var(--accent)] font-bold text-lg">-{confirmingItem.price} AP</span>
              </div>

              <div className="flex justify-end gap-4">
                <button 
                  onClick={() => setConfirmingItem(null)}
                  className="px-6 py-2 border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--text-primary)] font-mono text-xs uppercase tracking-widest transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={executePurchase}
                  className="px-6 py-2 bg-[var(--text-primary)] text-[var(--bg-primary)] font-mono text-xs uppercase tracking-widest font-bold hover:opacity-90 transition-opacity"
                >
                  Confirm
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </PageTransition>
  );
}

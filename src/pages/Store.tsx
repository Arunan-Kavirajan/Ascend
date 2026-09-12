import { motion } from "framer-motion";
import Sidebar from "../components/Sidebar";
import { STORE_ITEMS } from '../lib/constants';
import type { StoreItem } from '../lib/constants';
import { useUser } from "../context/UserContext";
import { useTheme } from "../context/ThemeContext";

export default function Store() {
  const { profile, purchaseItem, equipItem } = useUser();
  const { setTheme } = useTheme();

  const handlePurchase = async (id: string, price: number, levelReq: number) => {
    if (!profile) return;
    if (profile.ap < price) {
      alert("Not enough AP!");
      return;
    }
    await purchaseItem(id, price, levelReq);
  };

  const handleEquip = async (type: 'theme' | 'sound' | 'title', id: string) => {
    await equipItem(type, id);
    if (type === 'theme') {
      setTheme(id);
    }
  };

  const renderItems = (items: StoreItem[], title: string) => (
    <div className="mb-12">
      <h2 className="font-mono text-xl tracking-wider mb-6 border-b border-[var(--border)] pb-2 uppercase">{title}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((item, i) => {
          if (!profile) return null;
          const isOwned = profile.inventory.includes(item.id);
          const isEquipped = profile.equipped[item.type] === item.id;
          const isLocked = item.levelReq > profile.level;
          
          return (
            <motion.div 
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`border p-5 transition-colors flex flex-col justify-between min-h-[160px] rounded-none ${isLocked && !isOwned ? 'border-[var(--border)] bg-[var(--bg-primary)] opacity-50 grayscale' : 'border-[var(--border)] bg-[var(--surface-1)] hover:border-[var(--border-hover)]'}`}
            >
              <div>
                <h3 className="font-mono text-lg text-[var(--text-primary)]">{item.name}</h3>
                <p className="text-[var(--text-secondary)] text-sm mt-2 font-sans leading-relaxed">{item.description}</p>
              </div>
              <div className="mt-6">
                {isOwned ? (
                  isEquipped ? (
                    <span className="text-[var(--text-muted)] font-mono text-sm tracking-widest">[ EQUIPPED ]</span>
                  ) : (
                    <button 
                      onClick={() => handleEquip(item.type, item.id)}
                      className="font-mono text-sm text-[var(--text-primary)] hover:text-[var(--accent-indigo)] transition-colors cursor-pointer tracking-widest"
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
                ) : (
                  <button 
                    onClick={() => handlePurchase(item.id, item.price, item.levelReq)}
                    disabled={profile.ap < item.price}
                    className={`font-mono text-sm transition-colors tracking-widest ${profile.ap >= item.price ? 'text-[var(--text-primary)] hover:text-[var(--accent-emerald)] cursor-pointer' : 'text-[var(--text-faint)] cursor-not-allowed'}`}
                  >
                    [ BUY - {item.price} AP ]
                  </button>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] font-sans">
      <Sidebar />
      <main className="ml-72 min-h-screen p-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-5xl mx-auto"
        >
          <div className="flex justify-between items-end border-b border-[var(--border)] pb-8 mb-12">
            <div>
              <h1 className="font-mono text-4xl tracking-tight mb-2 uppercase">Store</h1>
              <p className="text-sm text-[var(--text-secondary)] font-mono uppercase tracking-widest">
                Exchange AP for Cosmetics
              </p>
            </div>
            {profile && (
              <div className="text-right">
                <p className="text-xs text-[var(--text-muted)] font-mono uppercase mb-1 tracking-widest">Balance</p>
                <p className="font-mono text-2xl text-[var(--accent-amber)]">{profile.ap} AP</p>
              </div>
            )}
          </div>

          {!profile ? (
            <div className="text-[var(--text-muted)] font-mono animate-pulse">LOADING STORE DATABANKS...</div>
          ) : (
            <>
              {renderItems(STORE_ITEMS.filter(i => i.type === 'theme'), 'Themes')}
              {renderItems(STORE_ITEMS.filter(i => i.type === 'sound'), 'Sounds')}
              {renderItems(STORE_ITEMS.filter(i => i.type === 'title'), 'Titles')}
            </>
          )}

        </motion.div>
      </main>
    </div>
  );
}

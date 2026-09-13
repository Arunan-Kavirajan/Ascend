import { motion, AnimatePresence } from 'framer-motion';

interface AmbienceBackgroundProps {
  activeAmbience: 'rain' | 'campfire' | 'ocean' | 'forest' | 'brown-noise' | 'white-noise' | null;
}

const styles = `
@keyframes rain-fall {
  0% { transform: translateY(-10vh) translateX(0); }
  100% { transform: translateY(110vh) translateX(-10vh); }
}
@keyframes ember-rise {
  0% { transform: translateY(0) scale(1) translateX(0); opacity: 1; }
  100% { transform: translateY(-60vh) scale(0) translateX(20px); opacity: 0; }
}
@keyframes fire-wobble {
  0%, 100% { transform: scaleY(1) rotate(0deg); }
  50% { transform: scaleY(1.1) rotate(2deg); }
}
@keyframes ocean-wave {
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}
@keyframes leaf-drift {
  0% { transform: translate(-5vw, -10vh) rotate(0deg); }
  100% { transform: translate(15vw, 110vh) rotate(360deg); }
}
@keyframes orb-pulse {
  0%, 100% { transform: scale(1) translate(-50%, -50%); opacity: 0.4; }
  50% { transform: scale(1.2) translate(-50%, -50%); opacity: 0.7; }
}
@keyframes noise-static {
  0% { transform: translate(0, 0); }
  25% { transform: translate(-1%, 1%); }
  50% { transform: translate(1%, -1%); }
  75% { transform: translate(1%, 1%); }
  100% { transform: translate(0, 0); }
}
`;

const Rain = () => {
  const drops = Array.from({ length: 40 }).map((_, i) => ({
    left: `${(i * 13) % 100}%`,
    duration: 0.8 + ((i * 7) % 7) * 0.1,
    delay: ((i * 11) % 20) * 0.1,
    opacity: 0.3 + ((i * 3) % 7) * 0.1,
  }));

  return (
    <div className="absolute inset-0 bg-gradient-to-b from-[#1a202c] to-[#2d3748] overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-32 bg-white/5 blur-3xl rounded-b-[100%]" />
      {drops.map((drop, i) => (
        <div
          key={i}
          className="absolute top-0 w-[2px] h-12 bg-white/40 rounded-full"
          style={{
            left: drop.left,
            opacity: drop.opacity,
            animation: `rain-fall ${drop.duration}s linear ${drop.delay}s infinite`,
            willChange: 'transform',
          }}
        />
      ))}
    </div>
  );
};

const Campfire = () => {
  const embers = Array.from({ length: 15 }).map((_, i) => ({
    left: `calc(50% + ${((i * 23) % 100) - 50}px)`,
    duration: 2 + ((i * 5) % 5) * 0.5,
    delay: ((i * 7) % 20) * 0.2,
    size: 4 + ((i * 11) % 6) + 'px',
  }));

  return (
    <div className="absolute inset-0 bg-gradient-to-t from-[#2a1306] to-[#0a0a0a] overflow-hidden flex flex-col justify-end items-center">
      {embers.map((ember, i) => (
        <div
          key={i}
          className="absolute bottom-32 rounded-full bg-orange-400 blur-[1px]"
          style={{
            left: ember.left,
            width: ember.size,
            height: ember.size,
            animation: `ember-rise ${ember.duration}s ease-in ${ember.delay}s infinite`,
            willChange: 'transform, opacity',
          }}
        />
      ))}
      <div className="absolute bottom-10 w-96 h-96 bg-orange-500/20 rounded-full blur-3xl" />
      <div className="relative w-40 h-40 flex justify-center items-end bottom-12">
        <div className="absolute bottom-0 w-24 h-32 bg-gradient-to-t from-red-600 to-orange-400 rounded-t-[100%] origin-bottom" style={{ animation: 'fire-wobble 2s ease-in-out infinite alternate', willChange: 'transform' }} />
        <div className="absolute bottom-0 w-16 h-24 bg-gradient-to-t from-orange-500 to-yellow-300 rounded-t-[100%] origin-bottom" style={{ animation: 'fire-wobble 1.5s ease-in-out 0.2s infinite alternate', willChange: 'transform' }} />
        <div className="absolute bottom-0 w-10 h-16 bg-gradient-to-t from-yellow-400 to-yellow-100 rounded-t-[100%] origin-bottom" style={{ animation: 'fire-wobble 1s ease-in-out 0.4s infinite alternate', willChange: 'transform' }} />
      </div>
      <div className="absolute bottom-8 flex gap-2">
        <div className="w-20 h-6 bg-amber-950 rounded-full rotate-12 translate-x-4" />
        <div className="w-20 h-6 bg-amber-950 rounded-full -rotate-12 -translate-x-4" />
      </div>
    </div>
  );
};

const Ocean = () => {
  return (
    <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] to-[#1e1b4b] overflow-hidden">
      <div className="absolute top-16 right-16 w-24 h-24 bg-blue-100 rounded-full shadow-[0_0_60px_20px_rgba(219,234,254,0.3)]" />
      {Array.from({ length: 20 }).map((_, i) => (
        <div key={i} className="absolute bg-white rounded-full opacity-60" style={{
          top: `${(i * 17) % 50}%`,
          left: `${(i * 29) % 100}%`,
          width: `${2 + (i % 3)}px`,
          height: `${2 + (i % 3)}px`,
        }} />
      ))}
      <div className="absolute bottom-0 left-0 right-0 h-64 opacity-50 flex items-end">
        {[
          { color: '#1e3a8a', time: 15, delay: 0, height: 120 },
          { color: '#1d4ed8', time: 20, delay: -5, height: 80 },
          { color: '#2563eb', time: 25, delay: -10, height: 40 }
        ].map((wave, i) => (
          <div key={i} className="absolute w-[200%] h-full flex items-end" style={{
             animation: `ocean-wave ${wave.time}s linear ${wave.delay}s infinite`,
             willChange: 'transform',
          }}>
            <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="w-1/2" style={{ height: wave.height }}>
              <path d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z" opacity=".25" fill={wave.color}></path>
              <path d="M0,0V15.81C13,36.92,27.64,56.86,47.69,72.05,99.41,111.27,165,111,224.58,91.58c31.15-10.15,60.09-26.07,89.67-39.8,40.92-19,84.73-46,130.83-49.67,36.26-2.85,70.9,9.42,98.6,31.56,31.77,25.39,62.32,62,103.63,73,40.44,10.79,81.35-6.69,119.13-24.28s75.16-39,116.92-43.05c59.73-5.85,113.28,22.88,168.9,38.84,30.2,8.66,59,6.17,87.09-7.5,22.43-10.89,48-26.93,60.65-23.82V0Z" opacity=".5" fill={wave.color}></path>
              <path d="M0,0V5.63C149.93,59,314.09,71.32,475.83,42.57c43-7.64,84.23-20.12,127.61-26.46,59-8.63,112.48,12.24,165.56,35.4C827.93,77.22,886,95.24,951.2,90c86.53-7,172.46-45.71,248.8-84.81V0Z" fill={wave.color}></path>
            </svg>
            <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="w-1/2" style={{ height: wave.height }}>
              <path d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z" opacity=".25" fill={wave.color}></path>
              <path d="M0,0V15.81C13,36.92,27.64,56.86,47.69,72.05,99.41,111.27,165,111,224.58,91.58c31.15-10.15,60.09-26.07,89.67-39.8,40.92-19,84.73-46,130.83-49.67,36.26-2.85,70.9,9.42,98.6,31.56,31.77,25.39,62.32,62,103.63,73,40.44,10.79,81.35-6.69,119.13-24.28s75.16-39,116.92-43.05c59.73-5.85,113.28,22.88,168.9,38.84,30.2,8.66,59,6.17,87.09-7.5,22.43-10.89,48-26.93,60.65-23.82V0Z" opacity=".5" fill={wave.color}></path>
              <path d="M0,0V5.63C149.93,59,314.09,71.32,475.83,42.57c43-7.64,84.23-20.12,127.61-26.46,59-8.63,112.48,12.24,165.56,35.4C827.93,77.22,886,95.24,951.2,90c86.53-7,172.46-45.71,248.8-84.81V0Z" fill={wave.color}></path>
            </svg>
          </div>
        ))}
      </div>
    </div>
  );
};

const Forest = () => {
  const leaves = Array.from({ length: 20 }).map((_, i) => ({
    left: `${(i * 19) % 100}%`,
    duration: 8 + ((i * 7) % 7),
    delay: -((i * 11) % 15),
  }));

  return (
    <div className="absolute inset-0 bg-gradient-to-t from-[#022c22] to-[#0f172a] overflow-hidden">
      <div className="absolute top-10 left-10 w-64 h-64 bg-amber-200/20 rounded-full blur-[80px]" />
      {leaves.map((leaf, i) => (
        <div key={i} className="absolute w-4 h-4 text-emerald-800/60" style={{
          left: leaf.left,
          top: '-10%',
          animation: `leaf-drift ${leaf.duration}s linear ${leaf.delay}s infinite`,
          willChange: 'transform'
        }}>
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M17 8C8 10 5 16 5 16s1-5 4-8 8-5 8-5 0 3-4 5z"/></svg>
        </div>
      ))}
      <div className="absolute bottom-0 left-0 right-0 h-48 flex items-end justify-around opacity-80">
        {[1, 2, 3, 4, 5, 6, 7].map(i => (
          <div key={i} className="relative flex flex-col items-center">
            <div className={`w-0 h-0 border-l-[30px] border-r-[30px] border-b-[60px] border-transparent border-b-[#064e3b] ${i%2===0 ? 'scale-125 origin-bottom' : ''}`} />
            <div className="w-4 h-8 bg-green-950" />
          </div>
        ))}
      </div>
    </div>
  );
};

const BrownNoise = () => {
  const orbs = [
    { top: '20%', left: '30%', size: '400px', color: '#78350f', delay: '0s' },
    { top: '60%', left: '70%', size: '300px', color: '#451a03', delay: '2s' },
    { top: '40%', left: '50%', size: '500px', color: '#92400e', delay: '4s' },
    { top: '80%', left: '20%', size: '350px', color: '#b45309', delay: '6s' },
  ];

  return (
    <div className="absolute inset-0 bg-[#1c0f0a] overflow-hidden">
      <div className="absolute inset-0 opacity-40 mix-blend-screen filter blur-[60px]">
        {orbs.map((orb, i) => (
          <div key={i} className="absolute rounded-full origin-center" style={{
            top: orb.top, left: orb.left, width: orb.size, height: orb.size,
            backgroundColor: orb.color,
            animation: `orb-pulse 8s ease-in-out ${orb.delay} infinite`,
            willChange: 'transform, opacity'
          }} />
        ))}
      </div>
    </div>
  );
};

const WhiteNoise = () => {
  return (
    <div className="absolute inset-0 bg-neutral-900 overflow-hidden">
      <div className="absolute -inset-[100%] opacity-[0.03]" style={{
        backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")',
        animation: 'noise-static 0.4s steps(4) infinite',
        willChange: 'transform'
      }} />
    </div>
  );
};

export function AmbienceBackground({ activeAmbience }: AmbienceBackgroundProps) {
  if (!activeAmbience) return null;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: styles }} />
      <div className="fixed inset-0 z-0 pointer-events-none opacity-15">
        <AnimatePresence mode="wait">
          {activeAmbience && (
            <motion.div
              key={activeAmbience}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1 }}
              className="absolute inset-0"
            >
              {activeAmbience === 'rain' && <Rain />}
              {activeAmbience === 'campfire' && <Campfire />}
              {activeAmbience === 'ocean' && <Ocean />}
              {activeAmbience === 'forest' && <Forest />}
              {activeAmbience === 'brown-noise' && <BrownNoise />}
              {activeAmbience === 'white-noise' && <WhiteNoise />}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}

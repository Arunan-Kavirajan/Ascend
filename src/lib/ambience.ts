export type AmbienceType = 'rain' | 'campfire' | 'ocean' | 'forest' | 'brown-noise' | 'white-noise';

export interface AmbienceEngine {
  start: (type: AmbienceType) => void;
  stop: () => void;
  setVolume: (volume: number) => void; // 0.0 - 1.0
  getActive: () => AmbienceType | null;
}

export function createAmbienceEngine(): AmbienceEngine {
  let ctx: AudioContext | null = null;
  let masterGain: GainNode | null = null;
  let activeType: AmbienceType | null = null;
  
  let activeNodes: AudioNode[] = [];
  let timeoutIds: number[] = [];
  let currentVolume = 1.0;

  const getContext = () => {
    if (!ctx) {
      ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      masterGain = ctx.createGain();
      masterGain.connect(ctx.destination);
      masterGain.gain.value = currentVolume;
    }
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    return { ctx, masterGain: masterGain! };
  };

  const createWhiteNoiseBuffer = (context: AudioContext) => {
    const bufferSize = context.sampleRate * 2;
    const buffer = context.createBuffer(1, bufferSize, context.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    return buffer;
  };

  const createBrownNoiseBuffer = (context: AudioContext) => {
    const bufferSize = context.sampleRate * 2;
    const buffer = context.createBuffer(1, bufferSize, context.sampleRate);
    const output = buffer.getChannelData(0);
    let lastOut = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      output[i] = (lastOut + 0.02 * white) / 1.02;
      lastOut = output[i];
      output[i] *= 3.5;
    }
    return buffer;
  };

  const cleanup = () => {
    timeoutIds.forEach(clearTimeout);
    timeoutIds = [];
    
    if (activeNodes.length > 0 && masterGain && ctx) {
      const now = ctx.currentTime;
      masterGain.gain.cancelScheduledValues(now);
      masterGain.gain.setValueAtTime(masterGain.gain.value, now);
      masterGain.gain.linearRampToValueAtTime(0, now + 0.5);
      
      const nodesToStop = [...activeNodes];
      activeNodes = [];
      
      setTimeout(() => {
        nodesToStop.forEach(node => {
          try {
            if (node instanceof AudioScheduledSourceNode) {
              node.stop();
            }
            node.disconnect();
          } catch (e) {
            // ignore
          }
        });
      }, 550);
    }
  };

  const startRain = (context: AudioContext, gain: GainNode) => {
    const buffer = createBrownNoiseBuffer(context);
    const source = context.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const filter = context.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 800;

    source.connect(filter);
    filter.connect(gain);
    source.start();
    activeNodes.push(source, filter);

    const scheduleDrip = () => {
      if (activeType !== 'rain') return;

      const osc = context.createOscillator();
      const dropGain = context.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(400 + Math.random() * 800, context.currentTime);
      
      dropGain.gain.setValueAtTime(0.1, context.currentTime);
      dropGain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.1);
      
      osc.connect(dropGain);
      dropGain.connect(gain);
      
      osc.start();
      osc.stop(context.currentTime + 0.1);
      
      activeNodes.push(osc, dropGain);

      const nextInterval = 200 + Math.random() * 600;
      timeoutIds.push(window.setTimeout(scheduleDrip, nextInterval));
    };

    scheduleDrip();
  };

  const startCampfire = (context: AudioContext, gain: GainNode) => {
    const osc = context.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = 60;
    const rumbleGain = context.createGain();
    rumbleGain.gain.value = 0.2;
    osc.connect(rumbleGain);
    rumbleGain.connect(gain);
    osc.start();
    activeNodes.push(osc, rumbleGain);

    const scheduleCrackle = () => {
      if (activeType !== 'campfire') return;

      const duration = 0.05 + Math.random() * 0.1;
      const buffer = createWhiteNoiseBuffer(context);
      const source = context.createBufferSource();
      source.buffer = buffer;
      source.loop = true;

      const filter = context.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 300 + Math.random() * 300;

      const burstGain = context.createGain();
      burstGain.gain.setValueAtTime(0.1 + Math.random() * 0.2, context.currentTime);
      burstGain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + duration);

      source.connect(filter);
      filter.connect(burstGain);
      burstGain.connect(gain);

      source.start();
      source.stop(context.currentTime + duration);

      activeNodes.push(source, filter, burstGain);

      const nextInterval = 100 + Math.random() * 300;
      timeoutIds.push(window.setTimeout(scheduleCrackle, nextInterval));
    };

    scheduleCrackle();
  };

  const createOceanWave = (context: AudioContext, master: GainNode, lfoFreq: number, filterFreq: number) => {
    const buffer = createWhiteNoiseBuffer(context);
    const source = context.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const filter = context.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = filterFreq;

    const waveGain = context.createGain();
    waveGain.gain.value = 0.5;

    const lfo = context.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = lfoFreq;

    const lfoGain = context.createGain();
    lfoGain.gain.value = 0.5;

    lfo.connect(lfoGain);
    lfoGain.connect(waveGain.gain);

    source.connect(filter);
    filter.connect(waveGain);
    waveGain.connect(master);

    source.start();
    lfo.start();

    activeNodes.push(source, filter, waveGain, lfo, lfoGain);
  };

  const startOcean = (context: AudioContext, gain: GainNode) => {
    createOceanWave(context, gain, 0.1, 400);
    createOceanWave(context, gain, 0.07, 600);
  };

  const startForest = (context: AudioContext, gain: GainNode) => {
    const buffer = createWhiteNoiseBuffer(context);
    const source = context.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const filter = context.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 1000;

    const lfo = context.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.05;
    const lfoGain = context.createGain();
    lfoGain.gain.value = 300;
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);

    const windGain = context.createGain();
    windGain.gain.value = 0.2;

    source.connect(filter);
    filter.connect(windGain);
    windGain.connect(gain);

    source.start();
    lfo.start();

    activeNodes.push(source, filter, lfo, lfoGain, windGain);

    const scheduleBird = () => {
      if (activeType !== 'forest') return;

      const osc = context.createOscillator();
      const birdGain = context.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(800 + Math.random() * 400, context.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1600 + Math.random() * 400, context.currentTime + 0.1);

      birdGain.gain.setValueAtTime(0, context.currentTime);
      birdGain.gain.linearRampToValueAtTime(0.3, context.currentTime + 0.02);
      birdGain.gain.linearRampToValueAtTime(0, context.currentTime + 0.1);

      osc.connect(birdGain);
      birdGain.connect(gain);

      osc.start();
      osc.stop(context.currentTime + 0.1);

      activeNodes.push(osc, birdGain);

      const nextInterval = 3000 + Math.random() * 5000;
      timeoutIds.push(window.setTimeout(scheduleBird, nextInterval));
    };

    scheduleBird();
  };

  const startBrownNoise = (context: AudioContext, gain: GainNode) => {
    const buffer = createBrownNoiseBuffer(context);
    const source = context.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const filter = context.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1000;
    filter.Q.value = 0.5;

    source.connect(filter);
    filter.connect(gain);

    source.start();
    activeNodes.push(source, filter);
  };

  const startWhiteNoise = (context: AudioContext, gain: GainNode) => {
    const buffer = createWhiteNoiseBuffer(context);
    const source = context.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const filter = context.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 200;

    source.connect(filter);
    filter.connect(gain);

    source.start();
    activeNodes.push(source, filter);
  };

  return {
    start: (type: AmbienceType) => {
      if (activeType === type) return;

      const { ctx: context, masterGain: gain } = getContext();
      
      cleanup();
      activeType = type;

      // Reset master gain to full current volume since cleanup might have faded it out
      gain.gain.cancelScheduledValues(context.currentTime);
      gain.gain.setValueAtTime(currentVolume, context.currentTime);

      switch (type) {
        case 'rain': startRain(context, gain); break;
        case 'campfire': startCampfire(context, gain); break;
        case 'ocean': startOcean(context, gain); break;
        case 'forest': startForest(context, gain); break;
        case 'brown-noise': startBrownNoise(context, gain); break;
        case 'white-noise': startWhiteNoise(context, gain); break;
      }
    },
    stop: () => {
      activeType = null;
      cleanup();
    },
    setVolume: (volume: number) => {
      currentVolume = Math.max(0, Math.min(1, volume));
      if (masterGain && ctx) {
        masterGain.gain.cancelScheduledValues(ctx.currentTime);
        masterGain.gain.linearRampToValueAtTime(currentVolume, ctx.currentTime + 0.1);
      }
    },
    getActive: () => activeType
  };
}

export class AudioManager {
	private ctx: AudioContext;
	private masterGain: GainNode;
	private noiseBuffer: AudioBuffer;

	private isMuted: boolean = false;
	private volume: number = 0.3;

	constructor() {
		const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
		this.ctx = new AudioContext();

		this.masterGain = this.ctx.createGain();
		this.masterGain.gain.value = this.volume;
		this.masterGain.connect(this.ctx.destination);
		this.noiseBuffer = this.createNoiseBuffer();
	}

	private resumeContext() {
		if (this.ctx.state == "suspended") this.ctx.resume();
	}

	private createNoiseBuffer(): AudioBuffer {
		const bufferSize = this.ctx.sampleRate * 2;
		const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
		const output = buffer.getChannelData(0);
		for (let i = 0; i < bufferSize; i++) {
			output[i] = Math.random() * 2 - 1;
		}

		return buffer;
	}

	playSplash(duration: number, filterFreq: number, vol: number) {
			if (this.isMuted) return;

			const source = this.ctx.createBufferSource();
			source.buffer = this.noiseBuffer;
			
			// Filter: Highpass haalt de brommende lage tonen weg -> "PSSHH"
			const filter = this.ctx.createBiquadFilter();
			filter.type = "highpass";
			filter.frequency.value = filterFreq;

			const gain = this.ctx.createGain();
			
			// Envelope: Harde klap, dan zacht uitdoven
			gain.gain.setValueAtTime(vol, this.ctx.currentTime);
			gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);

			// Verbinden: Source -> Filter -> Gain -> Master
			source.connect(filter);
			filter.connect(gain);
			gain.connect(this.masterGain);

			source.start();
			source.stop(this.ctx.currentTime + duration);
    }

	private playTone(
		freq: number,
		type: OscillatorType,
		duration: number,
		vol: number = 0.5
	) {
		if (this.isMuted) return;

		const osc = this.ctx.createOscillator();
		const gain = this.ctx.createGain();

		osc.type = type;
		osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

		gain.gain.setValueAtTime(0, this.ctx.currentTime);
		gain.gain.linearRampToValueAtTime(vol, this.ctx.currentTime + 0.01);

		gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
		
		osc.connect(gain);
		gain.connect(this.masterGain);

		osc.start();
		osc.stop(this.ctx.currentTime + duration);
	}

	playSine(freq: number, duration: number, volume: number = 0.5) {
		this.playTone(freq, "sine", duration, volume);
	}

	playSquare(freq: number, duration: number, volume: number = 0.5) {
		this.playTone(freq, "square", duration, volume);
	}

	playSawtooth(freq: number, duration: number, volume: number = 0.5) {
		this.playTone(freq, "sawtooth", duration, volume);
	}

	playTriangle(freq: number, duration: number, volume: number = 0.5) {
		this.playTone(freq, "triangle", duration, volume);
	}

	private playSlideTone(
		startFreq: number,
		endFreq: number,
		type: OscillatorType,
		duration: number,
		vol: number = 0.5
	) {
		if (this.isMuted) return;

		const osc = this.ctx.createOscillator();
		const gain = this.ctx.createGain();

		osc.type = type;

		osc.frequency.setValueAtTime(startFreq, this.ctx.currentTime);
		osc.frequency.exponentialRampToValueAtTime(endFreq, this.ctx.currentTime + duration);

		gain.gain.setValueAtTime(0, this.ctx.currentTime);
		gain.gain.linearRampToValueAtTime(vol, this.ctx.currentTime + 0.01);
		gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

		osc.connect(gain);
		gain.connect(this.masterGain);

		osc.start();
		osc.stop(this.ctx.currentTime + duration);
	}

	playSineSlide(startFreq: number, endFreq: number, duration: number, volume: number = 0.5) {
		this.playSlideTone(startFreq, endFreq, "sine", duration, volume);
	}

	playSquareSlide(startFreq: number, endFreq: number, duration: number, volume: number = 0.5) {
		this.playSlideTone(startFreq, endFreq, "square", duration, volume);
	}

	playSawtoothSlide(startFreq: number, endFreq: number, duration: number, volume: number = 0.5) {
		this.playSlideTone(startFreq, endFreq, "sawtooth", duration, volume);
	}

	playTriangleSlide(startFreq: number, endFreq: number, duration: number, volume: number = 0.5) {
		this.playSlideTone(startFreq, endFreq, "triangle", duration, volume);
	}

	setVolume(volume: number) {
		this.volume = Math.max(0, Math.min(1, volume));
		this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
	}

	toggleMute() {
		this.isMuted = !this.isMuted;

		if (this.isMuted) {
			this.masterGain.gain.setValueAtTime(0, this.ctx.currentTime);
		} else {
			this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
		}
	}
}

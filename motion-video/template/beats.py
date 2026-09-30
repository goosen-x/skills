# .venv/bin/python beats.py assets/audio/track.wav > beats.json   (needs: pip install librosa numpy soundfile)
import sys, json, numpy as np, librosa

y, sr = librosa.load(sys.argv[1], sr=None, mono=True)
tempo, frames = librosa.beat.beat_track(y=y, sr=sr, units="frames")
beats = librosa.frames_to_time(frames, sr=sr).round(3).tolist()
onset = librosa.onset.onset_strength(y=y, sr=sr)
peaks = librosa.util.peak_pick(onset, pre_max=3, post_max=3, pre_avg=3, post_avg=5, delta=0.5, wait=10)
rms = librosa.feature.rms(y=y)[0]
rms_t = librosa.frames_to_time(np.arange(len(rms)), sr=sr)
per_sec = [round(float(rms[(rms_t >= s) & (rms_t < s + 1)].mean()), 4) for s in range(int(rms_t[-1]))]
json.dump({
    "bpm": float(np.atleast_1d(tempo)[0]),
    "beats": beats,
    "hits": librosa.frames_to_time(peaks, sr=sr).round(3).tolist(),
    "rms_per_sec": per_sec,
}, sys.stdout, indent=1)

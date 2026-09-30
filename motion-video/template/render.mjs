// node render.mjs [--fps 60] [--sub 2] [--from 0] [--to DUR] [--out out/video.mp4] [--audio path|none]
// Walks time, calls window.seek(t) per subframe, pipes PNGs into ffmpeg; SUB>1 blends subframes into motion blur.
import { spawn, execFileSync } from 'node:child_process';
import { mkdirSync, existsSync } from 'node:fs';
import { openStage, frame } from './lib.mjs';

const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const FPS = Number(arg('fps', 60)), SUB = Number(arg('sub', 2)), OUT = arg('out', 'out/video.mp4');
const AUDIO = arg('audio', existsSync('assets/audio/track.wav') ? 'assets/audio/track.wav' : 'none');
const SILENT = 'out/silent.mp4';
mkdirSync('out', { recursive: true });

const { browser, page, dur } = await openStage();
const FROM = Number(arg('from', 0)), TO = Number(arg('to', dur));

const vf = SUB > 1 ? `tmix=frames=${SUB},select='eq(mod(n\\,${SUB})\\,${SUB - 1})',setpts=N/${FPS}/TB` : 'null';
const ff = spawn('ffmpeg', ['-v', 'error', '-y', '-f', 'image2pipe', '-framerate', String(FPS * SUB), '-i', '-',
  '-vf', vf, '-r', String(FPS), '-c:v', 'libx264', '-crf', '16', '-preset', 'slow', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', SILENT],
  { stdio: ['pipe', 'inherit', 'inherit'] });

const total = Math.round((TO - FROM) * FPS * SUB), t0 = Date.now();
for (let i = 0; i < total; i++) {
  const png = await frame(page, FROM + i / (FPS * SUB));
  if (!ff.stdin.write(png)) await new Promise((r) => ff.stdin.once('drain', r));
  if (i % (FPS * SUB) === 0) console.log(`${(FROM + i / (FPS * SUB)).toFixed(1)}s / ${TO}s  (${((Date.now() - t0) / 1000).toFixed(0)}s elapsed)`);
}
ff.stdin.end();
await new Promise((r) => ff.on('close', r));
await browser.close();

if (AUDIO === 'none') {
  execFileSync('cp', [SILENT, OUT]);
} else {
  const len = TO - FROM, fade = Math.min(1.5, len / 4);
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', SILENT, '-ss', String(FROM), '-t', String(len), '-i', AUDIO,
    '-af', `afade=t=out:st=${len - fade}:d=${fade},loudnorm=I=-14:TP=-1.5:LRA=11`, '-ar', '48000',
    '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart', OUT]);
}
console.log('done:', OUT);

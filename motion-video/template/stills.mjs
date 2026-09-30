// node stills.mjs [--step 0.5] [--from 0] [--to DUR] [--cols 6] [--name contact]
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { openStage, frame } from './lib.mjs';

const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const { browser, page, dur } = await openStage();
const STEP = Number(arg('step', 0.5)), FROM = Number(arg('from', 0)), TO = Number(arg('to', dur)), COLS = Number(arg('cols', 6)), NAME = arg('name', 'contact');
rmSync('out/stills', { recursive: true, force: true });
mkdirSync('out/stills', { recursive: true });
let n = 0;
for (let t = FROM; t < TO - 1e-6; t += STEP, n++) writeFileSync(`out/stills/${String(n).padStart(3, '0')}.png`, await frame(page, t));
await browser.close();
const rows = Math.ceil(n / COLS);
execFileSync('ffmpeg', ['-v', 'error', '-y', '-framerate', '1', '-i', 'out/stills/%03d.png', '-vf', `scale=480:-1,tile=${COLS}x${rows}:padding=4:color=red`, '-frames:v', '1', `out/${NAME}.png`]);
console.log(`out/${NAME}.png  (${n} stills, ${FROM}..${TO} step ${STEP}, row-major)`);

<div align="center">
<img width="1200" height="475" alt="Aibry TrackMaster Banner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />

# AIBRY TRACKMASTER-COMPARATOR
### Professional Solid State A/B Mastering Utility // Model 4000
</div>

---

## ⚡ Overview
**TrackMaster** is a high-fidelity, hardware-inspired audio comparison tool designed for mastering engineers and music producers. It allows for seamless, sample-accurate switching between a **Source Mix** and a **Mastered Target**, featuring real-time frequency analysis and analog-style calibration controls.

### 🛠 Key Features
* **Zero-Latency A/B Switching:** Seamlessly toggle between signals to hear the impact of your mastering chain.
* **Real-Time LED Spectrum:** 16-band industrial LED frequency analyzer synced to the active track.
* **Phase Nudge Calibration:** Fine-tune the alignment of your master by +/- milliseconds to compensate for plugin latency.
* **Mono Summing:** Instant L+R collapse with -3dB gain compensation to verify phase compatibility.
* **Hardware Interface:** Precision retro faders and a CRT-style waveform display.

---

## 🚀 Runtime Model
TrackMaster-Comparator is a stateless browser app. It does not require a
database, auth service, Fedora-hosted runtime dependency, or API secrets.

The Windows production runtime is:

- build the Vite app into `dist/`
- serve the static bundle with `server/static-server.mjs`
- keep the process alive with PM2 as `trackmaster-comparator`
- expose `0.0.0.0:8081` so the Fedora front-door proxy can reach Windows

---

## 💻 Local Development

**Prerequisites:** [Node.js](https://nodejs.org/) (v20+ recommended)

1. **Clone the repository**

2. **Install dependencies:**

```powershell
npm install
```

3. **Run the development server:**

```powershell
npm run dev
```

4. **Build for production:**

```powershell
npm run build
```

## Windows Runtime

For a Git-based deployment, make sure `server/static-server.mjs` is committed;
`npm start` and PM2 both depend on it. The generated `dist/` bundle and
`node_modules/` directory are intentionally ignored and should be recreated with
`npm install` and `npm run build` on the Windows host.

Start the Windows PM2 runtime:

```powershell
npm install
npm run build
npm run pm2:start
npm run pm2:save
```

This uses `ecosystem.config.cjs`:

- PM2 process name: `trackmaster-comparator`
- Script: `server/static-server.mjs`
- Host: `0.0.0.0`
- Port: `8081`
- Local validation URL: `http://127.0.0.1:8081`
- Fedora/LAN upstream URL: `http://<windows-lan-ip>:8081`

For a local-only manual run without PM2:

```powershell
npm run build
$env:HOST = "127.0.0.1"
$env:PORT = "8081"
npm start
```

Validate PM2 and the static server:

```powershell
pm2 status trackmaster-comparator
pm2 logs trackmaster-comparator --lines 50
(Invoke-WebRequest -UseBasicParsing http://127.0.0.1:8081/).StatusCode
```

For public exposure through Fedora nginx, keep the Windows runtime on
`0.0.0.0:8081`, allow inbound TCP `8081` through Windows Firewall for the
Fedora host or LAN, and proxy Fedora nginx to `http://<windows-lan-ip>:8081`.


🎛 How to Use

    Calibration: Drag your unmastered mix into CH A and your mastered version into CH B.

    Level Match: Adjust the Trim faders so both tracks peak at the same perceived loudness.

    Align: If your master has processing delay, use the Phase Nudge on CH B until the transients align perfectly.

    Evaluate: Switch between Source and Mastered while monitoring the LED Spectrum to visualize the tonal changes.


<div align="center">
<p align="center">Built with React 19, Vite 6, and WaveSurfer.js</p>
<p align="center"><i>"In Phase We Trust"</i></p>
</div>

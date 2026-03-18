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

## 🚀 Deployment (Vercel)
This app is optimized for Vercel. Because it uses the Web Audio API, it requires no backend and runs entirely on the client for maximum privacy and performance.

1.  **Push** this repo to GitHub.
2.  **Connect** the repo to Vercel.
3.  **Deploy.** Vercel will automatically detect the Vite configuration.

---

## 💻 Local Development

**Prerequisites:** [Node.js](https://nodejs.org/) (v20+ recommended)

1. **Clone the repository**

2. **Install dependencies:**

 bash

 npm install

3. **Run the development server:**

Bash

npm run dev

4. **Build for production:**

Bash

npm run build



🎛 How to Use

    Calibration: Drag your unmastered mix into CH A and your mastered version into CH B.

    Level Match: Adjust the Trim faders so both tracks peak at the same perceived loudness.

    Align: If your master has processing delay, use the Phase Nudge on CH B until the transients align perfectly.

    Evaluate: Switch between Source and Mastered while monitoring the LED Spectrum to visualize the tonal changes.


<div align="center">
<p align="center">Built with React 19, Vite 6, and WaveSurfer.js</p>
<p align="center"><i>"In Phase We Trust"</i></p>
</div>
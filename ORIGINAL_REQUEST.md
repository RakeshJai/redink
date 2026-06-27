# Original User Request

## Initial Request — 2026-06-26T13:39:31-05:00

RedInk is a Chrome Extension (Manifest V3) that performs real-time fact-checking of browser tab audio (debates, speeches, interviews) using live transcription (Deepgram Nova-2) and a single-pass LLM pipeline (Featherless API). The extension displays claim-by-claim verdicts in an injected, newspaper-themed sidebar.

Working directory: c:\Users\rakes\Desktop\Coding\redink
Integrity mode: development

## Requirements

### R1. Extension Structure & Lifecycle
- Manifest V3 extension, loaded as an unpacked extension in Developer Mode.
- No bundlers, compilers, or build steps. Use clean, plain vanilla Javascript, CSS, and HTML.
- Single flat folder structure with maximum 12 files (manifest.json, background.js, offscreen.html, offscreen.js, popup.html, popup.js, popup.css, content.js, content.css, icon16.png, icon48.png, icon128.png).
- Popup handles API keys saving (Deepgram, Featherless) and model name (default: meta-llama/Llama-3.2-3B-Instruct) to chrome.storage.local.
- Start/Stop session toggle in the popup. Clicking "Start" requests a user gesture, uses tabCapture to obtain a stream ID, and passes it to an offscreen document.

### R2. Offscreen Document (Audio Capture & Speech-to-Text)
- Offscreen document uses navigator.mediaDevices.getUserMedia with the stream ID.
- Captured audio is streamed via WebSocket to the Deepgram API (wss://api.deepgram.com) with Smart Format, smart_format=true, diarization=true, and interim_results=true.
- Accumulates transcription segments with speaker attribution and forwards them to background.js when sentences are completed or after a 2-second silence.

### R3. Single-Pass LLM Fact-Checking (Featherless API)
- Background script receives transcription segments and calls Featherless API (https://api.featherless.ai/v1/chat/completions) using the OpenAI-compatible client or fetch.
- Employs a single system prompt to do both claim extraction and verdict determination in a single LLM pass (No Serper/RAG).
- System prompt instructs LLM to extract check-worthy claims and instantly output a structured JSON of findings containing claims, speaker, verdict (CONFIRMED, MOSTLY TRUE, FALSE, MISLEADING, UNVERIFIED), and a concise explanation based on training knowledge.
- Avoid duplicate processing of identical claims using local deduplication cache.

### R4. Newspaper-Themed Sidebar Injector
- Content script injects a fixed-position sidebar (width: 400px, right: 0, full-height) into the active tab via Shadow DOM (insulating styles).
- Visual style mimics an old newspaper/broadsheet:
  - Aged parchment background (HSL/CSS-styled #f5f0e1) with paper texture/aging.
  - Masthead: "THE RED INK" in bold, letterspaced serif font (Georgia or Times New Roman), wrapped in double-rule borders.
  - Claims styled as article cards: bold news-style headlines, italic speaker bylines, and body text with a serif floated drop-cap on the first letter.
  - Verdict rubber stamps: large uppercase rotated text overlay (transform: rotate(-8deg), border: 3px solid, font-weight: 900, opacity: 0.85), color-coded by verdict (FALSE = red #c1121f, CONFIRMED = green #2d6a4f, MOSTLY TRUE = olive #606c38, MISLEADING = orange #bc6c25, UNVERIFIED = gray #6c757d).
  - Interactive collapsed/expanded state styled as a folded newspaper corner.

## Verification Criteria

### Acceptance Criteria
- [ ] Extension loads successfully in Chrome (chrome://extensions) with no errors.
- [ ] Settings popup correctly retrieves and persists API keys and model options.
- [ ] Start session successfully spawns the offscreen document and captures tab audio (verifiable by capturing audio-playing tabs).
- [ ] Live transcription flows from offscreen document to background script.
- [ ] Background script calls the Featherless API and successfully parses the JSON payload.
- [ ] Newspaper-styled sidebar is injected into the active tab and visually matches the broadsheet specification.
- [ ] Verdicts appear in real-time as rotated ink stamps, and explanations include floated drop caps.
- [ ] Clicking "Stop" in the popup stops audio recording, closes the offscreen document, and terminates connection.
- [ ] Code follows the "ponytail: lazy senior developer" principles: clean, minimal, flat file structure, vanilla implementation, zero build steps, standard library/native API usage, and inline documentation where appropriate.

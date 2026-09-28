/* Secure Morse Messenger — Caesar +3 + Morse code (vanilla JS) */
(function () {
  'use strict';

  // ---------- Morse table ----------
  const MORSE = {
    A: '.-', B: '-...', C: '-.-.', D: '-..', E: '.', F: '..-.', G: '--.', H: '....',
    I: '..', J: '.---', K: '-.-', L: '.-..', M: '--', N: '-.', O: '---', P: '.--.',
    Q: '--.-', R: '.-.', S: '...', T: '-', U: '..-', V: '...-', W: '.--', X: '-..-',
    Y: '-.--', Z: '--..',
    0: '-----', 1: '.----', 2: '..---', 3: '...--', 4: '....-',
    5: '.....', 6: '-....', 7: '--...', 8: '---..', 9: '----.'
  };
  // Reverse lookup: '.-' -> 'A'
  const REVERSE = Object.fromEntries(Object.entries(MORSE).map(([ch, code]) => [code, ch]));

  const SHIFT = 3;
  const UNIT = 0.08; // seconds per Morse "unit" (dot length)

  // ---------- State (kept private inside this closure) ----------
  const el = {};
  let lastMorse = '';     // Morse text used by the audio player
  let lastOutput = '';    // text used by the copy button
  let audioCtx = null;
  let endTimer = null;
  let statusTimer = null;

  // ---------- Caesar cipher ----------
  // Shifts letters only, keeping case. Digits and spaces are left unchanged.
  function shiftLetters(text, amount) {
    return text.replace(/[a-z]/gi, (ch) => {
      const base = ch <= 'Z' ? 65 : 97; // uppercase or lowercase start
      return String.fromCharCode(((ch.charCodeAt(0) - base + amount) % 26 + 26) % 26 + base);
    });
  }
  function caesarEncrypt(text) { return shiftLetters(text, SHIFT); }
  function caesarDecrypt(text) { return shiftLetters(text, -SHIFT); }

  // ---------- Morse conversion ----------
  // Letters separated by a space, words by " / ". Throws on unsupported characters.
  function textToMorse(text) {
    const words = text.trim().split(/\s+/).filter(Boolean);
    return words.map((word) =>
      Array.from(word).map((ch) => {
        const code = MORSE[ch.toUpperCase()];
        if (!code) throw new Error('Unsupported character "' + ch + '". Use only letters, numbers and spaces.');
        return code;
      }).join(' ')
    ).join(' / ');
  }

  function morseToText(morse) {
    if (/[^.\-\/\s]/.test(morse)) {
      throw new Error('Invalid Morse input. Use only dots (.), dashes (-), spaces and "/" between words.');
    }
    const words = morse.trim().split(/\s*\/\s*/).filter((w) => w.trim() !== '');
    if (words.length === 0) throw new Error('No Morse code found in the input.');
    return words.map((word) =>
      word.trim().split(/\s+/).map((code) => {
        const ch = REVERSE[code];
        if (!ch) throw new Error('Unknown Morse sequence "' + code + '".');
        return ch;
      }).join('')
    ).join(' ');
  }

  // ---------- UI helpers ----------
  function showStatus(message, type) {
    clearTimeout(statusTimer);
    el.status.textContent = message;
    el.status.className = 'status ' + (type || '');
    if (type === 'ok') statusTimer = setTimeout(() => { el.status.textContent = ''; }, 2500);
  }

  function showSteps(labels, values) {
    [1, 2, 3].forEach((n, i) => {
      el['label' + n].textContent = labels[i];
      el['step' + n].textContent = values[i] || '—';
    });
  }

  function showOutput(text) {
    lastOutput = text;
    el.output.textContent = text;
  }

  // ---------- Main actions ----------
  function encryptMessage() {
    stopMorse();
    const input = el.message.value;
    if (!input.trim()) return showStatus('Please enter a message first.', 'error');
    try {
      const caesar = caesarEncrypt(input.trim());
      const morse = textToMorse(caesar);
      showSteps(['Original Text', 'Caesar +3', 'Morse Code'], [input.trim(), caesar.toUpperCase(), morse]);
      showOutput(morse);
      lastMorse = morse;
      showStatus('Message encrypted.', 'ok');
    } catch (err) {
      showStatus(err.message, 'error');
    }
  }

  function decryptMessage() {
    stopMorse();
    const input = el.message.value;
    if (!input.trim()) return showStatus('Please enter Morse code first.', 'error');
    try {
      const decoded = morseToText(input);
      const original = caesarDecrypt(decoded);
      showSteps(['Morse Code', 'Decoded Text (before Caesar)', 'Caesar −3 → Original Text'], [input.trim(), decoded, original]);
      showOutput(original);
      lastMorse = input.trim();
      showStatus('Message decrypted.', 'ok');
    } catch (err) {
      showStatus(err.message, 'error');
    }
  }

  async function copyOutput() {
    if (!lastOutput) return showStatus('Nothing to copy yet.', 'error');
    try {
      await navigator.clipboard.writeText(lastOutput);
      showStatus('Copied to clipboard!', 'ok');
    } catch (e) {
      // Fallback for browsers/contexts where the Clipboard API is blocked
      const tmp = document.createElement('textarea');
      tmp.value = lastOutput;
      document.body.appendChild(tmp);
      tmp.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(tmp);
      showStatus(ok ? 'Copied to clipboard!' : 'Copy failed. Select the output and copy manually.', ok ? 'ok' : 'error');
    }
  }

  function clearAll() {
    stopMorse();
    el.message.value = '';
    lastMorse = '';
    lastOutput = '';
    showSteps(['Original Text', 'Caesar +3', 'Morse Code'], ['', '', '']);
    el.output.textContent = 'Your result will appear here.';
    showStatus('Cleared.', 'ok');
    el.message.focus();
  }

  // ---------- Morse audio (Web Audio API) ----------
  function playMorse() {
    if (!lastMorse) return showStatus('Encrypt or decrypt a message first, then play its Morse code.', 'error');
    stopMorse();
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return showStatus('Web Audio is not supported in this browser.', 'error');

    audioCtx = new AC();
    let t = audioCtx.currentTime + 0.1;

    // Schedule one beep of the given length (in units) at time t
    function beep(units) {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.frequency.value = 650;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.25, t + 0.005);
      gain.gain.setValueAtTime(0.25, t + units * UNIT - 0.005);
      gain.gain.linearRampToValueAtTime(0, t + units * UNIT);
      osc.connect(gain).connect(audioCtx.destination);
      osc.start(t);
      osc.stop(t + units * UNIT);
    }

    const words = lastMorse.trim().split(/\s*\/\s*/);
    words.forEach((word, wi) => {
      word.trim().split(/\s+/).forEach((letter, li) => {
        Array.from(letter).forEach((sym, si) => {
          beep(sym === '.' ? 1 : 3);
          t += (sym === '.' ? 1 : 3) * UNIT;
          if (si < letter.length - 1) t += UNIT;   // gap between symbols
        });
        if (li < word.trim().split(/\s+/).length - 1) t += 3 * UNIT; // gap between letters
      });
      if (wi < words.length - 1) t += 7 * UNIT;     // gap between words
    });

    el.playBtn.disabled = true;
    el.stopBtn.disabled = false;
    showStatus('Playing Morse code…');
    endTimer = setTimeout(stopMorse, (t - audioCtx.currentTime + 0.2) * 1000);
  }

  function stopMorse() {
    clearTimeout(endTimer);
    if (audioCtx) {
      audioCtx.close();
      audioCtx = null;
      showStatus('');
    }
    el.playBtn.disabled = false;
    el.stopBtn.disabled = true;
  }

  // ---------- Setup ----------
  function init() {
    ['message', 'status', 'output', 'encryptBtn', 'decryptBtn', 'clearBtn', 'copyBtn', 'playBtn', 'stopBtn',
      'label1', 'label2', 'label3', 'step1', 'step2', 'step3'].forEach((id) => { el[id] = document.getElementById(id); });

    el.encryptBtn.addEventListener('click', encryptMessage);
    el.decryptBtn.addEventListener('click', decryptMessage);
    el.clearBtn.addEventListener('click', clearAll);
    el.copyBtn.addEventListener('click', copyOutput);
    el.playBtn.addEventListener('click', playMorse);
    el.stopBtn.addEventListener('click', stopMorse);
    // Ctrl/Cmd + Enter encrypts quickly
    el.message.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') encryptMessage();
    });
  }

  document.addEventListener('DOMContentLoaded', init);
})();

# 🔐 Secure Morse Messenger

**Caesar +3 Encryption + Morse Code** — a responsive, cybersecurity-themed web app built with only HTML, CSS and vanilla JavaScript.

> ⚠️ This project is intended for educational purposes. Caesar Cipher +3 is not suitable for protecting sensitive information because it is easily breakable.

## Description
Secure Morse Messenger shifts every letter of a message by 3 positions (Caesar cipher), then converts the result to Morse code. It can also reverse the process and play the Morse code as audio.

## Features
- 🔒 Encrypt: text → Caesar +3 → Morse
- 🔓 Decrypt: Morse → text → Caesar −3
- Step-by-step process visualization
- Supports A–Z, a–z, 0–9 and spaces (`/` separates words)
- 📋 Copy output with the Clipboard API
- 🔊 Morse audio (Web Audio API, no audio files) with ⏹ Stop
- Friendly validation for empty input, unsupported characters and invalid Morse
- Dark glassmorphism UI, responsive and keyboard accessible

## Technologies
HTML5 · CSS3 · Vanilla JavaScript (no frameworks, no backend)

## How Encryption Works
1. Read the input text.
2. Shift each letter 3 places forward (A→D, X→A). Digits and spaces are unchanged.
3. Convert each character to Morse; letters are separated by spaces and words by `/`.

## How Decryption Works
1. Validate that the input only has `.`, `-`, `/` and spaces.
2. Decode Morse back to characters.
3. Shift each letter 3 places backward. The result is uppercase.

## Example
```
HELLO  →  KHOOR  →  -.- .... --- --- .-.
-.- .... --- --- .-.  →  KHOOR  →  HELLO
```

## Installation
```bash
git clone https://github.com/<your-username>/secure-morse-messenger.git
cd secure-morse-messenger
```

## How to Run
Open `index.html` directly in Chrome, Edge or Firefox. No build step or server is required.

## Project Structure
```
secure-morse-messenger/
├── index.html
├── style.css
├── script.js
├── README.md
└── assets/
```

## Screenshots
_Add screenshots here: `assets/screenshot-main.png`_

## Security Limitations
- Caesar +3 has only one possible key and can be broken instantly.
- Morse code is an encoding, not encryption; anyone can decode it.
- Never use this tool for passwords, personal data or confidential messages.

## Future Improvements
- AES-256 encryption
- Password-based encryption
- QR-code generation
- Morse audio transmission
- Real-time messaging
- File encryption
- Backend API
- User authentication
- Database integration

## Author
**Your Name** — [GitHub](https://github.com/your-username) · [LinkedIn](https://www.linkedin.com/in/your-profile)

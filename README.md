# TeachHelp

![TeachHelp Icon](assets/icon.png)

**TeachHelp** is an AI-powered lesson plan generator that helps teachers create complete, structured lessons in minutes. Simply describe your lesson topic, and the app uses the Google Gemini API to generate a full lesson package—including step-by-step plans, presentation slides, flashcards, and a quiz—all in one cohesive, ready-to-use format.

**Made by [AJ (Ahmed Jouini)](https://github.com)**

---

## Features

- **One-Click Lesson Generation** — Enter a lesson description (topic, grade level, objectives) and get a complete lesson package
- **Step-by-Step Lesson Plan** — Structured introduction, main content steps, and conclusion aligned with learning objectives
- **Professional Slideshow** — Exactly 5 slides with an engaging opener, designed for classroom projection
- **Interactive Flashcards** — Key terms and concepts for review
- **Final Quiz** — Multiple-choice assessment to check student mastery
- **Model Order** — Choose which Gemini model is tried 1st, 2nd and 3rd (1.5 Flash, 1.5 Pro, 2.0/2.5 variants); if one fails, the next is used
- **Local Storage** — API key and model preference saved in your browser for convenience
- **Single HTML Output** — Generated lesson opens in a new tab as a standalone HTML page with navigation

---

## How It Works

1. Enter your **Gemini API key** (get one free at [Google AI Studio](https://makersuite.google.com/app/apikey))
2. Pick your **1st, 2nd and 3rd choice Gemini models** (Gemini 1.5 Flash recommended first for free tier)
3. Describe your lesson (e.g., *"Photosynthesis for 5th grade, covering the process and key components"*)
4. Click **Generate Lesson**
5. The app creates a full HTML lesson site with:
   - Learning objectives
   - Detailed lesson plan
   - 5-slide presentation (with keyboard navigation)
   - Flashcards (click to flip)
   - Quiz with instant feedback

---

## Quick Start

1. Clone the repository
2. Open `index.html` in your browser (no server required)
3. Add your Gemini API key and start generating

```bash
git clone https://github.com/YOUR_USERNAME/TeachHelp.git
cd TeachHelp
# Open index.html in your browser
```

---

## Tech Stack

- **Frontend:** HTML, CSS, JavaScript (vanilla, no frameworks)
- **AI:** Google Gemini API (v1beta)
- **Storage:** Browser localStorage (API key, model selection)

---

## Requirements

- A modern web browser
- A [Google Gemini API key](https://makersuite.google.com/app/apikey) (free tier available)

---

## File Structure

```
TeachHelp/
├── index.html      # Main app interface
├── app.js          # Gemini API integration & lesson HTML generator
├── style.css       # Styling
├── assets/
│   └── icon.png    # TeachHelp app icon
└── README.md
```

---

## License

This project is open source and available for educational use.

---

**TeachHelp** — *Helping teachers create amazing lessons, one prompt at a time.*

*Created by AJ (Ahmed Jouini)*

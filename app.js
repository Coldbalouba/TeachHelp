// Store API key and model in localStorage
let apiKey = localStorage.getItem('geminiApiKey') || '';
let selectedModel = localStorage.getItem('geminiModel') || 'gemini-1.5-flash';

// Initialize UI
document.addEventListener('DOMContentLoaded', () => {
    const apiKeyInput = document.getElementById('apiKey');
    const modelSelect = document.getElementById('modelSelect');
    const generateBtn = document.getElementById('generateBtn');
    const lessonPrompt = document.getElementById('lessonPrompt');
    
    // Load saved API key
    if (apiKey) {
        apiKeyInput.value = apiKey;
    }
    
    // Load saved model selection
    if (selectedModel) {
        modelSelect.value = selectedModel;
    }
    
    // Save API key when changed
    apiKeyInput.addEventListener('input', (e) => {
        apiKey = e.target.value;
        localStorage.setItem('geminiApiKey', apiKey);
    });
    
    // Save model selection when changed
    modelSelect.addEventListener('change', (e) => {
        selectedModel = e.target.value;
        localStorage.setItem('geminiModel', selectedModel);
    });
    
    // Generate lesson
    generateBtn.addEventListener('click', handleGenerate);
    lessonPrompt.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key === 'Enter') {
            handleGenerate();
        }
    });
});

async function handleGenerate() {
    const apiKeyInput = document.getElementById('apiKey');
    const modelSelect = document.getElementById('modelSelect');
    const lessonPrompt = document.getElementById('lessonPrompt');
    const generateBtn = document.getElementById('generateBtn');
    const statusMessage = document.getElementById('statusMessage');
    
    const apiKey = apiKeyInput.value.trim();
    const model = modelSelect.value;
    const prompt = lessonPrompt.value.trim();
    
    // Validation
    if (!apiKey) {
        showStatus('Please enter your Gemini API key', 'error');
        return;
    }
    
    if (!prompt) {
        showStatus('Please enter a lesson description', 'error');
        return;
    }
    
    // Disable button and show loading
    generateBtn.disabled = true;
    generateBtn.querySelector('.btn-text').style.display = 'none';
    generateBtn.querySelector('.btn-loader').style.display = 'inline';
    hideStatus();
    
    try {
        const selectedModelName = modelSelect.options[modelSelect.selectedIndex].text;
        showStatus(`Generating your lesson plan using ${selectedModelName}... This may take a minute.`, 'info');
        console.log(`Attempting to generate lesson with model: ${model}`);
        
        // Generate lesson content using Gemini
        const lessonContent = await generateLessonContent(apiKey, prompt, model);
        
        // Create HTML site
        const htmlContent = generateLessonHTML(lessonContent);
        
        // Save and open HTML file
        const blob = new Blob([htmlContent], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        
        // Open in new tab
        window.open(url, '_blank');
        
        showStatus('Lesson generated successfully! Opening in new tab...', 'success');
        
        // Clean up after a delay
        setTimeout(() => {
            URL.revokeObjectURL(url);
        }, 1000);
        
    } catch (error) {
        console.error('Error generating lesson:', error);
        showStatus(`Error: ${error.message}`, 'error');
    } finally {
        // Re-enable button
        generateBtn.disabled = false;
        generateBtn.querySelector('.btn-text').style.display = 'inline';
        generateBtn.querySelector('.btn-loader').style.display = 'none';
    }
}

async function generateLessonContent(apiKey, userPrompt, modelName) {
    // Use the selected model, with fallback if it fails
    // Prioritize free tier models that are more likely to work
    const fallbackModels = ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-2.0-flash-exp', 'gemini-2.0-flash'];
    const modelsToTry = [modelName, ...fallbackModels.filter(m => m !== modelName)];
    
    for (const model of modelsToTry) {
        try {
            return await tryGenerateWithModel(apiKey, userPrompt, model);
        } catch (error) {
            // If it's a rate limit error, try next model
            const errorMsg = error.message.toLowerCase();
            const isModelError = errorMsg.includes('not found') || errorMsg.includes('not supported') || errorMsg.includes('404');
            const isRateLimitError = errorMsg.includes('rate limit') || errorMsg.includes('quota') || errorMsg.includes('exceeded');
            
            // If it's not a model or rate limit error, throw immediately (e.g., API key error)
            if (!isModelError && !isRateLimitError) {
                throw error;
            }
            
            // Otherwise, try next model (only if not the last one)
            if (model !== modelsToTry[modelsToTry.length - 1]) {
                const errorType = isRateLimitError ? 'rate limit exceeded' : 'not available';
                console.log(`Model ${model} ${errorType}, trying fallback...`);
            } else {
                // Last model failed, throw with helpful message
                if (isRateLimitError) {
                    throw new Error(`All models exceeded rate limits. This might mean:\n• You're on free tier and some models aren't available\n• You've hit your daily quota\n• Try again later or check your usage in Google AI Studio\n\nLast error: ${error.message}`);
                }
            }
        }
    }
    
    throw new Error(`Model ${modelName} and fallback models are not accessible. Please check your API key and model selection.`);
}

async function tryGenerateWithModel(apiKey, userPrompt, modelName) {
    const prompt = `You are an expert educational content creator and an amazing, wonderful, fun teacher. Based on the following lesson description, create a comprehensive lesson package in JSON format.

Lesson Description: ${userPrompt}

CRITICAL REQUIREMENTS:
1. Create EXACTLY 5 slides maximum - no more, no less
2. The FIRST slide must be an engaging, attention-grabbing opening that hooks students immediately - think of what an amazing teacher would create to start a class (could be a thought-provoking question, an interesting fact, a visual hook, or an interactive element)
3. ALL content must be CONNECTED and COHESIVE - the lesson plan, slides, flashcards, and quiz must all align and flow together as one unified lesson
4. Slides should progress logically and build upon each other
5. Flashcards should reinforce key concepts from the slides and lesson plan
6. Quiz questions should test understanding of the material covered in the slides and lesson plan

Please generate a complete lesson package with the following structure. Return ONLY valid JSON, no markdown formatting, no code blocks:

{
  "title": "Lesson title",
  "objectives": ["objective 1", "objective 2", "objective 3"],
  "lessonPlan": {
    "introduction": "Introduction section that connects to slide 1",
    "mainContent": [
      {
        "step": 1,
        "title": "Step title",
        "description": "Detailed description of this step that connects to the slides"
      }
    ],
    "conclusion": "Conclusion section"
  },
  "slides": [
    {
      "slideNumber": 1,
      "title": "Engaging opening slide title (hook students immediately!)",
      "content": "First slide content - make it amazing, engaging, and attention-grabbing like a wonderful teacher would create"
    },
    {
      "slideNumber": 2,
      "title": "Slide title",
      "content": "Slide content that builds on slide 1"
    },
    {
      "slideNumber": 3,
      "title": "Slide title",
      "content": "Slide content that continues the flow"
    },
    {
      "slideNumber": 4,
      "title": "Slide title",
      "content": "Slide content that progresses the lesson"
    },
    {
      "slideNumber": 5,
      "title": "Slide title",
      "content": "Final slide content that wraps up key points"
    }
  ],
  "flashcards": [
    {
      "front": "Question or term related to the lesson content",
      "back": "Answer or definition that reinforces the lesson"
    }
  ],
  "quiz": {
    "title": "Quiz title",
    "questions": [
      {
        "question": "Question text that tests understanding of the lesson",
        "options": ["Option A", "Option B", "Option C", "Option D"],
        "correctAnswer": 0
      }
    ]
  }
}

IMPORTANT: 
- Create EXACTLY 5 slides (no more, no less)
- Make slide 1 absolutely engaging and attention-grabbing
- Ensure all content is connected - flashcards and quiz must align with slides and lesson plan
- Include 10-15 flashcards that reinforce key concepts from the lesson
- Include 5-8 quiz questions that test the learning objectives
- Make everything flow as one cohesive, structured lesson`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            contents: [{
                parts: [{
                    text: prompt
                }]
            }]
        })
    });
    
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error?.message || `API Error: ${response.status} ${response.statusText}`;
        const errorCode = errorData.error?.code || response.status;
        
        // Provide helpful error messages for different error types
        const errorMsgLower = errorMessage.toLowerCase();
        
        // Rate limit / Quota errors
        if (errorMsgLower.includes('quota') || errorMsgLower.includes('rate limit') || 
            errorMsgLower.includes('exceeded') || errorMsgLower.includes('429') ||
            errorCode === 429 || response.status === 429) {
            throw new Error(`Rate limit exceeded for model "${modelName}". This might mean:\n• The model isn't available on free tier\n• You've hit your daily/hourly limit\n• Try a different model (like Gemini 1.5 Flash)\n\nFull error: ${errorMessage}`);
        }
        
        // Model not found errors
        if (errorMsgLower.includes('not found') || errorMsgLower.includes('not supported') || 
            errorMsgLower.includes('404') || response.status === 404) {
            throw new Error(`Model "${modelName}" not found or not available. The app will try fallback models. Error: ${errorMessage}`);
        }
        
        // Permission/API key errors
        if (errorMsgLower.includes('permission') || errorMsgLower.includes('api key') || 
            errorMsgLower.includes('invalid') || errorMsgLower.includes('401') ||
            response.status === 401 || response.status === 403) {
            throw new Error(`API key issue: ${errorMessage}. Please check your API key is correct and has proper permissions.`);
        }
        
        // Generic error with full details
        throw new Error(`API Error (${response.status}): ${errorMessage}\n\nModel attempted: ${modelName}`);
    }
    
    const data = await response.json();
    
    // Check if response has valid content
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content || !data.candidates[0].content.parts || !data.candidates[0].content.parts[0]) {
        throw new Error('Invalid response format from Gemini API. Please try again.');
    }
    
    const text = data.candidates[0].content.parts[0].text;
    
    // Extract JSON from response (handle cases where Gemini adds markdown)
    let jsonText = text.trim();
    
    // Remove markdown code blocks if present
    if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    }
    
    // Try to extract JSON object if there's extra text
    const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
        jsonText = jsonMatch[0];
    }
    
    try {
        const lessonData = JSON.parse(jsonText);
        
        // Validate and ensure exactly 5 slides
        if (!lessonData.slides || !Array.isArray(lessonData.slides)) {
            throw new Error('Invalid slide data received from API');
        }
        
        // Take exactly 5 slides (first 5 if more, pad if less)
        if (lessonData.slides.length > 5) {
            lessonData.slides = lessonData.slides.slice(0, 5);
        } else if (lessonData.slides.length < 5) {
            // If we have fewer than 5, we'll work with what we have
            // The prompt should ensure 5, but this is a safety check
            console.warn(`Received ${lessonData.slides.length} slides, expected 5`);
        }
        
        // Ensure slide numbers are correct
        lessonData.slides.forEach((slide, index) => {
            slide.slideNumber = index + 1;
        });
        
        return lessonData;
    } catch (parseError) {
        console.error('Failed to parse JSON:', jsonText);
        throw new Error('Failed to parse lesson content. Please try again.');
    }
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function generateLessonHTML(lessonContent) {
    const { title, objectives, lessonPlan, slides, flashcards, quiz } = lessonContent;
    
    // Escape all content before inserting into template
    const escapedTitle = escapeHtml(title);
    const escapedObjectives = objectives.map(obj => escapeHtml(obj));
    const escapedIntroduction = escapeHtml(lessonPlan.introduction);
    const escapedConclusion = escapeHtml(lessonPlan.conclusion);
    const escapedSteps = lessonPlan.mainContent.map(step => ({
        step: step.step,
        title: escapeHtml(step.title),
        description: escapeHtml(step.description)
    }));
    const escapedSlides = slides.map(slide => ({
        title: escapeHtml(slide.title),
        content: escapeHtml(slide.content)
    }));
    const escapedFlashcards = flashcards.map(card => ({
        front: escapeHtml(card.front),
        back: escapeHtml(card.back)
    }));
    const escapedQuiz = {
        title: escapeHtml(quiz.title),
        questions: quiz.questions.map(q => ({
            question: escapeHtml(q.question),
            options: q.options.map(opt => escapeHtml(opt)),
            correctAnswer: q.correctAnswer
        }))
    };
    
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(title)} - Lesson Plan</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            color: #333;
            background: #f5f5f5;
        }
        
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px 20px;
            text-align: center;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        
        .header h1 {
            font-size: 2.5rem;
            margin-bottom: 10px;
        }
        
        .nav {
            background: white;
            padding: 20px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
            position: sticky;
            top: 0;
            z-index: 100;
        }
        
        .nav ul {
            list-style: none;
            display: flex;
            justify-content: center;
            flex-wrap: wrap;
            gap: 15px;
        }
        
        .nav a {
            text-decoration: none;
            color: #667eea;
            padding: 10px 20px;
            border: 2px solid #667eea;
            border-radius: 25px;
            transition: all 0.3s;
            font-weight: 600;
        }
        
        .nav a:hover {
            background: #667eea;
            color: white;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 40px 20px;
        }
        
        .section {
            background: white;
            padding: 40px;
            margin-bottom: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        
        .section h2 {
            color: #667eea;
            margin-bottom: 20px;
            font-size: 2rem;
            border-bottom: 3px solid #667eea;
            padding-bottom: 10px;
        }
        
        .objectives {
            list-style: none;
            padding-left: 0;
        }
        
        .objectives li {
            padding: 15px;
            margin-bottom: 10px;
            background: #f8f9fa;
            border-left: 4px solid #667eea;
            border-radius: 5px;
        }
        
        .objectives li:before {
            content: "✓ ";
            color: #667eea;
            font-weight: bold;
            margin-right: 10px;
        }
        
        .step {
            margin-bottom: 30px;
            padding: 20px;
            background: #f8f9fa;
            border-radius: 8px;
        }
        
        .step h3 {
            color: #764ba2;
            margin-bottom: 10px;
        }
        
        .slideshow-container {
            position: relative;
            max-width: 1000px;
            margin: 30px auto;
            background: white;
            box-shadow: 0 8px 30px rgba(0,0,0,0.15);
            border-radius: 15px;
            overflow: hidden;
        }
        
        .slide {
            display: none;
            padding: 80px 60px;
            text-align: center;
            min-height: 600px;
            display: flex;
            flex-direction: column;
            justify-content: center;
            animation: slideIn 0.5s ease-in-out;
            background: linear-gradient(135deg, #f8f9ff 0%, #ffffff 100%);
        }
        
        .slide[data-slide="0"] {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }
        
        .slide[data-slide="0"] h3 {
            color: white;
            font-size: 2.5rem;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.2);
            animation: pulse 2s ease-in-out infinite;
        }
        
        .slide[data-slide="0"] .slide-content {
            color: white;
            font-size: 1.5rem;
            text-shadow: 1px 1px 2px rgba(0,0,0,0.2);
        }
        
        @keyframes slideIn {
            from {
                opacity: 0;
                transform: translateX(20px);
            }
            to {
                opacity: 1;
                transform: translateX(0);
            }
        }
        
        @keyframes pulse {
            0%, 100% {
                transform: scale(1);
            }
            50% {
                transform: scale(1.02);
            }
        }
        
        .slide.active {
            display: flex;
        }
        
        .slide h3 {
            font-size: 2.2rem;
            color: #667eea;
            margin-bottom: 40px;
            font-weight: 700;
            line-height: 1.3;
        }
        
        .slide-content {
            font-size: 1.4rem;
            line-height: 2;
            color: #333;
            white-space: pre-line;
            max-width: 800px;
            margin: 0 auto;
        }
        
        .slide-nav {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 25px 30px;
            background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
            border-top: 3px solid #667eea;
        }
        
        .slide-btn {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            padding: 14px 35px;
            border-radius: 30px;
            cursor: pointer;
            font-size: 1.05rem;
            font-weight: 600;
            transition: all 0.3s ease;
            box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
        }
        
        .slide-btn:hover:not(:disabled) {
            background: linear-gradient(135deg, #764ba2 0%, #667eea 100%);
            transform: translateY(-3px);
            box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
        }
        
        .slide-btn:active:not(:disabled) {
            transform: translateY(-1px);
        }
        
        .slide-btn:disabled {
            opacity: 0.4;
            cursor: not-allowed;
            background: #ccc;
            box-shadow: none;
        }
        
        .slide-counter {
            display: flex;
            align-items: center;
            gap: 10px;
            font-weight: 700;
            font-size: 1.1rem;
            color: #667eea;
            background: white;
            padding: 10px 20px;
            border-radius: 20px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        
        .flashcards-container {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 20px;
            margin-top: 30px;
        }
        
        .flashcard {
            perspective: 1000px;
            height: 250px;
        }
        
        .flashcard-inner {
            position: relative;
            width: 100%;
            height: 100%;
            transition: transform 0.6s;
            transform-style: preserve-3d;
        }
        
        .flashcard.flipped .flashcard-inner {
            transform: rotateY(180deg);
        }
        
        .flashcard-front,
        .flashcard-back {
            position: absolute;
            width: 100%;
            height: 100%;
            backface-visibility: hidden;
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
            box-shadow: 0 4px 10px rgba(0,0,0,0.1);
            cursor: pointer;
        }
        
        .flashcard-front {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }
        
        .flashcard-back {
            background: white;
            color: #333;
            transform: rotateY(180deg);
            border: 2px solid #667eea;
        }
        
        .quiz-container {
            max-width: 800px;
            margin: 0 auto;
        }
        
        .question {
            background: #f8f9fa;
            padding: 25px;
            margin-bottom: 20px;
            border-radius: 10px;
            border-left: 4px solid #667eea;
        }
        
        .question h3 {
            margin-bottom: 15px;
            color: #333;
        }
        
        .options {
            list-style: none;
        }
        
        .options li {
            padding: 12px;
            margin-bottom: 10px;
            background: white;
            border: 2px solid #e0e0e0;
            border-radius: 5px;
            cursor: pointer;
            transition: all 0.3s;
        }
        
        .options li:hover {
            border-color: #667eea;
            background: #f0f0ff;
        }
        
        .options li.selected {
            background: #667eea;
            color: white;
            border-color: #667eea;
        }
        
        .options li.correct {
            background: #28a745;
            color: white;
            border-color: #28a745;
        }
        
        .options li.incorrect {
            background: #dc3545;
            color: white;
            border-color: #dc3545;
        }
        
        .submit-quiz {
            background: #667eea;
            color: white;
            border: none;
            padding: 15px 40px;
            border-radius: 25px;
            font-size: 1.1rem;
            font-weight: 600;
            cursor: pointer;
            margin: 20px auto;
            display: block;
            transition: all 0.3s;
        }
        
        .submit-quiz:hover {
            background: #764ba2;
            transform: translateY(-2px);
        }
        
        .quiz-results {
            text-align: center;
            padding: 30px;
            background: #f8f9fa;
            border-radius: 10px;
            margin-top: 20px;
            display: none;
        }
        
        .quiz-results.show {
            display: block;
        }
        
        .score {
            font-size: 2rem;
            font-weight: bold;
            color: #667eea;
            margin: 10px 0;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>${escapedTitle}</h1>
    </div>
    
    <nav class="nav">
        <ul>
            <li><a href="#lesson-plan">Lesson Plan</a></li>
            <li><a href="#slides">Slides</a></li>
            <li><a href="#flashcards">Flashcards</a></li>
            <li><a href="#quiz">Quiz</a></li>
        </ul>
    </nav>
    
    <div class="container">
        <section id="lesson-plan" class="section">
            <h2>📋 Learning Objectives</h2>
            <ul class="objectives">
                ${escapedObjectives.map(obj => `<li>${obj}</li>`).join('')}
            </ul>
            
            <h2 style="margin-top: 40px;">📖 Step-by-Step Lesson Plan</h2>
            
            <div class="step">
                <h3>Introduction</h3>
                <p>${escapedIntroduction}</p>
            </div>
            
            ${escapedSteps.map(step => `
                <div class="step">
                    <h3>Step ${step.step}: ${step.title}</h3>
                    <p>${step.description}</p>
                </div>
            `).join('')}
            
            <div class="step">
                <h3>Conclusion</h3>
                <p>${escapedConclusion}</p>
            </div>
        </section>
        
        <section id="slides" class="section">
            <h2>📊 Presentation Slides</h2>
            <div class="slideshow-container">
                ${escapedSlides.map((slide, index) => `
                    <div class="slide ${index === 0 ? 'active' : ''}" data-slide="${index}">
                        <h3>${slide.title}</h3>
                        <div class="slide-content">${slide.content}</div>
                    </div>
                `).join('')}
                
                <div class="slide-nav">
                    <button class="slide-btn" id="prevBtn" onclick="changeSlide(-1)">← Previous</button>
                    <div class="slide-counter">
                        <span id="slideNumber">1</span> / <span id="totalSlides">${escapedSlides.length}</span>
                    </div>
                    <button class="slide-btn" id="nextBtn" onclick="changeSlide(1)">Next →</button>
                </div>
            </div>
        </section>
        
        <section id="flashcards" class="section">
            <h2>🃏 Flashcards</h2>
            <p style="margin-bottom: 20px; color: #666;">Click on any card to flip it and see the answer.</p>
            <div class="flashcards-container">
                ${escapedFlashcards.map((card, index) => `
                    <div class="flashcard" onclick="flipCard(${index})">
                        <div class="flashcard-inner">
                            <div class="flashcard-front">
                                <div style="font-size: 1.2rem; font-weight: 600;">${card.front}</div>
                            </div>
                            <div class="flashcard-back">
                                <div style="font-size: 1.1rem;">${card.back}</div>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </section>
        
        <section id="quiz" class="section">
            <h2>📝 Final Quiz</h2>
            <div class="quiz-container">
                ${escapedQuiz.questions.map((q, qIndex) => `
                    <div class="question" data-question="${qIndex}">
                        <h3>${qIndex + 1}. ${q.question}</h3>
                        <ul class="options">
                            ${q.options.map((option, oIndex) => `
                                <li onclick="selectOption(${qIndex}, ${oIndex}, ${q.correctAnswer})">${option}</li>
                            `).join('')}
                        </ul>
                    </div>
                `).join('')}
                
                <button class="submit-quiz" onclick="submitQuiz()">Submit Quiz</button>
                
                <div class="quiz-results" id="quizResults">
                    <h3>Quiz Results</h3>
                    <div class="score" id="quizScore"></div>
                    <p id="quizFeedback"></p>
                </div>
            </div>
        </section>
    </div>
    
    <script>
        // Slideshow functionality
        let currentSlide = 0;
        const slides = document.querySelectorAll('.slide');
        const totalSlides = slides.length;
        
        function updateSlideDisplay() {
            slides.forEach((slide, index) => {
                slide.classList.toggle('active', index === currentSlide);
            });
            
            document.getElementById('slideNumber').textContent = currentSlide + 1;
            document.getElementById('prevBtn').disabled = currentSlide === 0;
            document.getElementById('nextBtn').disabled = currentSlide === totalSlides - 1;
        }
        
        function changeSlide(direction) {
            currentSlide += direction;
            if (currentSlide < 0) currentSlide = 0;
            if (currentSlide >= totalSlides) currentSlide = totalSlides - 1;
            updateSlideDisplay();
        }
        
        // Keyboard navigation for slides
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft') changeSlide(-1);
            if (e.key === 'ArrowRight') changeSlide(1);
        });
        
        // Flashcard functionality
        function flipCard(index) {
            const card = document.querySelectorAll('.flashcard')[index];
            card.classList.toggle('flipped');
        }
        
        // Quiz functionality
        const selectedAnswers = {};
        const correctAnswers = {};
        
        ${escapedQuiz.questions.map((q, qIndex) => `
            correctAnswers[${qIndex}] = ${q.correctAnswer};
        `).join('')}
        
        function selectOption(questionIndex, optionIndex, correctAnswer) {
            const question = document.querySelector(\`[data-question="\${questionIndex}"]\`);
            const options = question.querySelectorAll('.options li');
            
            // Remove previous selection
            options.forEach(opt => {
                opt.classList.remove('selected', 'correct', 'incorrect');
            });
            
            // Mark selected
            options[optionIndex].classList.add('selected');
            selectedAnswers[questionIndex] = optionIndex;
        }
        
        function submitQuiz() {
            let score = 0;
            const totalQuestions = ${escapedQuiz.questions.length};
            
            // Show results
            Object.keys(selectedAnswers).forEach(qIndex => {
                const question = document.querySelector(\`[data-question="\${qIndex}"]\`);
                const options = question.querySelectorAll('.options li');
                const selected = selectedAnswers[qIndex];
                const correct = correctAnswers[qIndex];
                
                // Mark correct answer
                options[correct].classList.add('correct');
                
                if (selected === correct) {
                    score++;
                } else if (selected !== undefined) {
                    options[selected].classList.add('incorrect');
                }
            });
            
            // Show score
            const percentage = Math.round((score / totalQuestions) * 100);
            document.getElementById('quizScore').textContent = \`\${score} / \${totalQuestions} (\${percentage}%)\`;
            
            let feedback = '';
            if (percentage >= 90) {
                feedback = 'Excellent! You have mastered the learning objectives! 🌟';
            } else if (percentage >= 70) {
                feedback = 'Good job! Review the incorrect answers to improve. 👍';
            } else {
                feedback = 'Keep practicing! Review the lesson material and try again. 💪';
            }
            
            document.getElementById('quizFeedback').textContent = feedback;
            document.getElementById('quizResults').classList.add('show');
            
            // Scroll to results
            document.getElementById('quizResults').scrollIntoView({ behavior: 'smooth' });
        }
        
        // Smooth scrolling for navigation
        document.querySelectorAll('.nav a').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = link.getAttribute('href').substring(1);
                document.getElementById(targetId).scrollIntoView({ behavior: 'smooth' });
            });
        });
    </script>
</body>
</html>`;
}

function showStatus(message, type) {
    const statusMessage = document.getElementById('statusMessage');
    statusMessage.textContent = message;
    statusMessage.className = `status-message ${type}`;
    statusMessage.style.display = 'block';
}

function hideStatus() {
    const statusMessage = document.getElementById('statusMessage');
    statusMessage.style.display = 'none';
}

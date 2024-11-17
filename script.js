const typingText = document.querySelector('.typingtest p');
const inputField = document.querySelector('.input-field');
const timeSpan = document.querySelector('.time span b') || document.querySelector('.stat-value');
const mistakeSpan = document.querySelector('.mistake span') || document.querySelector('.mistake .stat-value');
const wpmSpan = document.querySelector('.wpm span') || document.querySelector('.wpm .stat-value');
const cpmSpan = document.querySelector('.cpm span') || document.querySelector('.cpm .stat-value');
const tryAgainBtn = document.querySelector('.try-again');
const shareBtn = document.querySelector('.share-results');
const difficultySelect = document.querySelector('.difficulty-select');
const accuracySpan = document.querySelector('.accuracy span');
const highscoreSpan = document.querySelector('.highscore span');

let timer;
let maxTime = 60;
let timeLeft = maxTime;
let charIndex = 0;
let mistakes = 0;
let isTyping = false;
let highScore = localStorage.getItem('typingHighScore') || 0;
let selectedDifficulty = 'medium';
let soundEnabled = localStorage.getItem('soundEnabled') === 'true';

const paragraphsByDifficulty = {
    easy: [
        "The sun is shining, and the sky is blue. A cat naps on the warm mat, dreaming of playful adventures. Let's run in the park!",
        "Dogs bark and chase balls, while birds soar high above. The fish swim in calm waters, and the kids laugh nearby.",
        "It's lunchtime, and sandwiches are ready. Books sit neatly on the shelf. As night falls, it's time to sleep and dream."
    ],
    medium: [
        "The quick brown fox jumps over a lazy dog, showcasing agility and speed. This phrase is a favorite for keyboard practice.",
        "Life throws challenges, but our response shapes the outcome. Staying positive can turn struggles into valuable lessons.",
        "Courage fuels persistence when success feels distant. Failure is a teacher, reminding us that growth comes with effort."
    ],
    hard: [
        "Quantum mechanics explores the fundamental principles of nature by examining the behavior of matter and energy on atomic and subatomic scales, employing sophisticated algorithms and mathematical models to unravel the mysteries of the universe.",
        "Photosynthesis is a highly intricate biochemical process in which plants, algae, and certain bacteria capture sunlight and convert it into chemical energy stored in glucose, releasing oxygen as a byproduct critical to sustaining life on Earth.",
        "The relationship between microeconomic principles such as supply and demand and macroeconomic phenomena like inflation and economic growth highlights the intricate, interconnected nature of global financial systems and the delicate balance required for stability."
    ]
};


function updateTimerOptions(duration) {
    maxTime = duration;
    resetGame();
}

function loadParagraph() {
    const paragraphs = paragraphsByDifficulty[selectedDifficulty];
    const ranIndex = Math.floor(Math.random() * paragraphs.length);
    typingText.innerHTML = "";
    paragraphs[ranIndex].split("").forEach(char => {
        let span = `<span>${char}</span>`;
        typingText.innerHTML += span;
    });

    typingText.querySelector("span").classList.add("active");
    document.addEventListener("keydown", () => inputField.focus());
    inputField.value = "";
    inputField.focus();
}

const audioContext = new (window.AudioContext || window.webkitAudioContext)();

function createKeySound() {
    if (!soundEnabled) return;
    
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    
    oscillator.start();
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
    
    setTimeout(() => {
        oscillator.stop();
    }, 100);
}

function createErrorSound() {
    if (!soundEnabled) return;
    
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(200, audioContext.currentTime);
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    
    oscillator.start();
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
    
    setTimeout(() => {
        oscillator.stop();
    }, 200);
}

function playSound(isError = false) {
    if (soundEnabled) {
        try {
            if (audioContext.state === 'suspended') {
                audioContext.resume();
            }
            
            isError ? createErrorSound() : createKeySound();
        } catch (error) {
            console.error('Error playing sound:', error);
        }
    }
}

// Initialize sound toggle
const soundToggleBtn = document.querySelector('.sound-toggle');
if (soundToggleBtn) {
    soundToggleBtn.textContent = soundEnabled ? '🔊 Sound' : '🔇 Muted';
    
    soundToggleBtn.addEventListener('click', async (e) => {
        soundEnabled = !soundEnabled;
        localStorage.setItem('soundEnabled', soundEnabled);
        e.target.textContent = soundEnabled ? '🔊 Sound' : '🔇 Muted';
        
        if (soundEnabled && audioContext.state === 'suspended') {
            try {
                await audioContext.resume();
            } catch (error) {
                console.error('Error resuming audio context:', error);
            }
        }
    });
}

function updateAccuracy() {
    const totalCharacters = charIndex;
    const accuracy = totalCharacters === 0 ? 100 : Math.round(((totalCharacters - mistakes) / totalCharacters) * 100);
    accuracySpan.innerText = `${accuracy}%`;
}

function initTimer() {
    if (timeLeft > 0) {
        timeLeft--;
        timeSpan.innerText = timeLeft;
        updateAccuracy();
    } else {
        finishTyping();
    }
}

function finishTyping() {
    clearInterval(timer);
    inputField.disabled = true;
    
    let wpm = Math.round(((charIndex - mistakes) / 5) / (maxTime - timeLeft) * 60);
    wpm = wpm < 0 || !wpm || wpm === Infinity ? 0 : wpm;
    
    if (wpm > highScore) {
        highScore = wpm;
        localStorage.setItem('typingHighScore', highScore);
        highscoreSpan.innerText = `${highScore} WPM`;
        showMessage("New High Score! 🎉");
    }

    wpmSpan.innerText = wpm;
    cpmSpan.innerText = charIndex - mistakes;
    updateAccuracy();
}

function showMessage(text) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message');
    messageDiv.textContent = text;
    document.body.appendChild(messageDiv);
    
    setTimeout(() => {
        messageDiv.remove();
    }, 3000);
}

function initTyping() {
    const characters = typingText.querySelectorAll("span");
    let typedChar = inputField.value[charIndex];
    
    if (!isTyping && !inputField.disabled) {
        timer = setInterval(initTimer, 1000);
        isTyping = true;
    }

    if (characters[charIndex] && timeLeft > 0) {
        if (!typedChar) {
            if (charIndex > 0) {
                charIndex--;
                if (characters[charIndex].classList.contains("incorrect")) {
                    mistakes--;
                }
                characters[charIndex].classList.remove("correct", "incorrect");
            }
        } else {
            const isCorrect = characters[charIndex].innerText === typedChar;
            if (isCorrect) {
                characters[charIndex].classList.add("correct");
                playSound(false);
            } else {
                mistakes++;
                characters[charIndex].classList.add("incorrect");
                playSound(true);
            }
            charIndex++;
        }

        mistakeSpan.innerText = mistakes;
        let wpm = Math.round(((charIndex - mistakes) / 5) / (maxTime - timeLeft) * 60);
        wpm = wpm < 0 || !wpm || wpm === Infinity ? 0 : wpm;
        wpmSpan.innerText = wpm;
        cpmSpan.innerText = charIndex - mistakes;
        updateAccuracy();

        characters.forEach(span => span.classList.remove("active"));
        if (characters[charIndex]) {
            characters[charIndex].classList.add("active");
        }

        if (charIndex >= characters.length) {
            finishTyping();
        }
    } else {
        finishTyping();
    }
}

function resetGame() {
    console.log('Resetting the game...');
    loadParagraph();  // Ensure a new paragraph is loaded
    timeLeft = maxTime;
    charIndex = mistakes = isTyping = 0;
    timeSpan.innerText = timeLeft;
    wpmSpan.innerText = 0;
    mistakeSpan.innerText = 0;
    cpmSpan.innerText = 0;
    accuracySpan.innerText = "100%";
    
    // Enable the input field and clear any existing text
    inputField.disabled = false;
    inputField.value = '';
    
    // Clear any active span classes from the previous typing session
    typingText.querySelectorAll('span').forEach(span => {
        span.classList.remove('correct', 'incorrect', 'active');
    });
    
    // Focus on the input field to start typing immediately
    inputField.focus();
    
    // Clear the timer to prevent multiple intervals from running
    clearInterval(timer);
    console.log('Game reset complete.');
}

// Share results functionality
function shareResults() {
    const wpm = wpmSpan.innerText;
    const accuracy = accuracySpan.innerText;
    const shareText = `🎯 Just typed ${wpm} WPM with ${accuracy} accuracy on Speed Typer Pro! Can you beat my score?`;
    
    if (navigator.share) {
        navigator.share({
            title: 'My Typing Test Results',
            text: shareText
        }).catch(console.error);
    } else {
        // Fallback to copying to clipboard
        navigator.clipboard.writeText(shareText)
            .then(() => showMessage('Results copied to clipboard!'))
            .catch(() => showMessage('Unable to share results'));
    }
}

// Event Listeners
loadParagraph();
inputField.addEventListener("input", initTyping);
tryAgainBtn.addEventListener("click", resetGame);
shareBtn?.addEventListener("click", shareResults);

// Difficulty selector
difficultySelect?.addEventListener("change", (e) => {
    selectedDifficulty = e.target.value;
    resetGame();
});

// Initialize high score display
highscoreSpan.innerText = `${highScore} WPM`;
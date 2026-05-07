let currentQuestions = [];
let userAnswers = [];
let currentIndex = 0; 
let timer; 
let timeLeft = 15; 

function decodeHtml(html) {
    const txt = document.createElement("textarea");
    txt.innerHTML = html;
    return txt.value;
}

async function loadCategories() {
    try {
        const response = await fetch("/api/quiz/categories")
        const data = await response.json()
        if (data.success) {
            const categorySelect = document.getElementById("category")
            data.categories.forEach((category) => {
                const option = document.createElement("option")
                option.value = category.id
                option.textContent = category.name
                categorySelect.appendChild(option)
            })
        }
    } catch (error) {
        console.error("Error loading categories:", error)
    }
}

async function getQuestions() {
    const amount = document.getElementById("amount").value
    const category = document.getElementById("category").value
    const difficulty = document.getElementById("difficulty").value

    const container = document.getElementById("quiz-container")
    container.innerHTML = '<div class="loading"><div class="spinner"></div><div class="loading-text">Fetching questions from OpenTDB...</div></div>'

    const startButton = document.getElementById('start-quiz-btn');
    if (startButton) startButton.disabled = true

    try {
        let url = `/api/quiz/questions?amount=${amount}`
        if (category) url += `&category=${category}`
        if (difficulty) url += `&difficulty=${difficulty}`

        const response = await fetch(url)
        const data = await response.json()

        if (data.success) {
            currentQuestions = data.results;
            userAnswers = new Array(data.results.length).fill(null);
            currentIndex = 0; 
            displaySingleQuestion(); 
        } else {
            container.innerHTML = `<div class="error">Error: ${data.error}</div>`
        }
    } catch (error) {
        console.error("Error fetching questions:", error)
        container.innerHTML = '<div class="error">Failed to load questions. Please try again.</div>'
    } finally {
        if (startButton) startButton.disabled = false
    }
}

function displaySingleQuestion() {
    const container = document.getElementById("quiz-container");
    container.innerHTML = "";
    
    const question = currentQuestions[currentIndex];
    const questionDiv = document.createElement("div");
    questionDiv.className = "question";

    const timerDiv = document.createElement("div");
    timerDiv.id = "quiz-timer";
    timerDiv.style = "font-size: 20px; font-weight: bold; color: #dc3545; margin-bottom: 10px; text-align: center;";
    timerDiv.innerHTML = `Time Left: 15s`; 
    container.appendChild(timerDiv);

    const answers = [...question.incorrect_answers, question.correct_answer];
    
    for (let i = answers.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [answers[i], answers[j]] = [answers[j], answers[i]];
    }

questionDiv.innerHTML = `
    <h3>Question ${currentIndex + 1} of ${currentQuestions.length}: ${decodeHtml(question.question)}</h3>
    <div class="question-info">
        <span><strong>Category:</strong> ${question.category}</span>
        <span><strong>Difficulty:</strong> ${question.difficulty}</span>
    </div>
    <div class="answers">
        ${answers.map((answer) => `
            <button class="answer-option-btn quiz-choice" 
                    data-answer="${answer.replace(/"/g, '&quot;')}" 
                    style="display: block; width: 100%; margin: 5px 0; padding: 10px; cursor: pointer;">
                ${decodeHtml(answer)}
            </button>
        `).join("")}
    </div>
`;

container.appendChild(questionDiv);

const choiceButtons = questionDiv.querySelectorAll('.quiz-choice');
choiceButtons.forEach(btn => {
    btn.addEventListener('click', function() {
        const selectedAnswer = this.getAttribute('data-answer');
        handleAnswerSelection(selectedAnswer);
    });
});

startTimer();
}

function startTimer() {
    timeLeft = 15;
    clearInterval(timer);
    timer = setInterval(() => {
        timeLeft--;
        document.getElementById("quiz-timer").innerHTML = `Time Left: ${timeLeft}s`;
        if (timeLeft <= 0) {
            clearInterval(timer);
            handleAnswerSelection(null); 
        }
    }, 1000);
}

function handleAnswerSelection(answer) {

    clearInterval(timer);

    const buttons = document.querySelectorAll('.answer-option-btn');
    buttons.forEach(btn => btn.disabled = true);

    userAnswers[currentIndex] = answer;
    currentIndex++;

    if (currentIndex < currentQuestions.length) {
        displaySingleQuestion();
    } else {
        submitQuiz();
    }
}

function submitQuiz() {
    
    clearInterval(timer);

    const container = document.getElementById("quiz-container");
    container.innerHTML = '<div class="loading"><div class="spinner"></div><div class="loading-text">Calculating results...</div></div>';

    fetch("/api/quiz/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            answers: userAnswers,
            questions: currentQuestions,
        }),
    })
    .then((response) => response.json())
    .then((data) => {
        if (data.success) {
            displayResults(data);
        } else {
            alert("Error submitting quiz: " + data.error);
        }
    })
    .catch((error) => {
        console.error("Error submitting quiz:", error);
        alert("Failed to submit quiz. Please try again.");
    });
}

function displayResults(data) {
    const container = document.getElementById("quiz-container")
    container.innerHTML = ""

    const scoreDiv = document.createElement("div")
    scoreDiv.className = "score-display"
    scoreDiv.innerHTML = `
        <h2>Quiz Results</h2>
        <p>You scored ${data.correct} out of ${data.total} (${data.percentage}%)</p>
    `
    container.appendChild(scoreDiv)

    data.results.forEach((result, index) => {
        const resultDiv = document.createElement("div")
        resultDiv.className = `result ${result.correct ? "correct" : "incorrect"}`
        resultDiv.innerHTML = `
            <h4>Question ${index + 1}: ${decodeHtml(result.question)}</h4>
            <p><strong>Your answer:</strong> ${result.userAnswer ? decodeHtml(result.userAnswer) : '<span style="color:red">No Answer (Timeout)</span>'}</p>
            <p><strong>Correct answer:</strong> ${decodeHtml(result.correctAnswer)}</p>
        `
        container.appendChild(resultDiv)
    })

    const resetButton = document.createElement("button")
    resetButton.textContent = "Take Another Quiz"
    resetButton.id = "reset-results-btn"
    resetButton.style.background = "#007bff"
    resetButton.style.marginTop = "20px"
    container.appendChild(resetButton)
    resetButton.addEventListener('click', resetQuiz)
}

function resetQuiz() {
    const container = document.getElementById("quiz-container")
    container.innerHTML = ""
    currentQuestions = []
    userAnswers = []
    currentIndex = 0;
    clearInterval(timer);
}

document.addEventListener("DOMContentLoaded", loadCategories);
const startBtn = document.getElementById('start-quiz-btn');
const resetBtn = document.getElementById('reset-quiz-btn');
if (startBtn) startBtn.addEventListener('click', getQuestions);
if (resetBtn) resetBtn.addEventListener('click', resetQuiz);
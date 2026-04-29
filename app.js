let learnWords = [];
let learnIndex = 0;
let testWords = [];
let testIndex = 0;
let testCorrect = 0;
let missedWords = [];
let answered = false;
let currentTestSaved = false;

const screens = [
  "homeScreen",
  "learnMenu",
  "learnScreen",
  "testMenu",
  "testScreen",
  "resultsScreen",
  "progressScreen",
  "settingsScreen"
];

function showScreen(id) {
  screens.forEach(screen => {
    const el = document.getElementById(screen);
    if (el) el.classList.remove("active");
  });

  const target = document.getElementById(id);
  if (target) target.classList.add("active");
}

function showHome() {
  showScreen("homeScreen");
}

function getChapters() {
  return [...new Set(VOCAB
    .map(w => w.chapter)
    .filter(ch => ch !== undefined)
  )].sort((a, b) => a - b);
}

function buildChapterCheckboxes(containerId, name) {
  const container = document.getElementById(containerId);
  container.innerHTML = "";

  getChapters().forEach(chapter => {
    const label = document.createElement("label");

    label.innerHTML = `
      <input type="checkbox" name="${name}" value="${chapter}" />
      Ch. ${chapter}
    `;

    const input = label.querySelector("input");

    // set initial selected state
    if (input.checked) label.classList.add("selected");

    input.addEventListener("change", () => {
      label.classList.toggle("selected", input.checked);
    });

    container.appendChild(label);
  });
}

function getSelectedChapters(name) {
  return [...document.querySelectorAll(`input[name="${name}"]:checked`)]
    .map(input => Number(input.value));
}

function setAllChapters(name, checked) {
  const inputs = document.querySelectorAll(`input[name="${name}"]`);

  inputs.forEach(input => {
    input.checked = checked;

    const label = input.closest("label");
    if (label) {
      label.classList.toggle("selected", checked);
    }
  });
}

function showLearnMenu() {
  buildChapterCheckboxes("learnChapterList", "learnChapter");
  showScreen("learnMenu");
}

function startLearning(customWords = null) {
  if (customWords) {
    learnWords = customWords;
  } else {
    const chapters = getSelectedChapters("learnChapter");
    learnWords = VOCAB.filter(word => chapters.includes(word.chapter));
  }

  learnIndex = 0;

  if (learnWords.length === 0) {
    alert("Choose at least one chapter.");
    return;
  }

  showScreen("learnScreen");
  renderLearnCard();
}
function renderLearnCard() {
  const word = learnWords[learnIndex];

  document.getElementById("learnGreek").textContent = word.greek;
  document.getElementById("learnMeaning").textContent = word.meaning;
  document.getElementById("learnProgress").textContent = `${learnIndex + 1} / ${learnWords.length}`;
  document.getElementById("learnCard").classList.remove("flipped");

  document.getElementById("swipeHint").style.display = learnIndex === 0 ? "block" : "none";
}

function flipCard() {
  document.getElementById("learnCard").classList.toggle("flipped");
}

function nextLearnCard() {
  if (learnIndex < learnWords.length - 1) {
    const card = document.getElementById("learnCard");

    card.classList.add("slide-out");

    setTimeout(() => {
      learnIndex++;
      renderLearnCard();
      card.classList.remove("slide-out");
    }, 180);
  }
}

function prevLearnCard() {
  if (learnIndex > 0) {
    const card = document.getElementById("learnCard");

    card.classList.add("slide-out");

    setTimeout(() => {
      learnIndex--;
      renderLearnCard();
      card.classList.remove("slide-out");
    }, 180);
  }
}

let startX = 0;
let endX = 0;

const learnCard = document.getElementById("learnCard");

learnCard.addEventListener("touchstart", e => {
  startX = e.touches[0].clientX;
});

learnCard.addEventListener("touchend", e => {
  endX = e.changedTouches[0].clientX;
  const diff = startX - endX;

  if (diff > 50) nextLearnCard();
  if (diff < -50) prevLearnCard();
});

function showTestMenu() {
  buildChapterCheckboxes("testChapterList", "testChapter");
  showScreen("testMenu");
}

function startTest() {
  const amount = Number(document.getElementById("testAmount").value);
  const chapters = getSelectedChapters("testChapter");
  const focusMode = document.getElementById("focusMode").checked;

  let pool = VOCAB.filter(word => chapters.includes(word.chapter));

  if (focusMode) {
    const weakWords = getWeakWords(pool);
    if (weakWords.length === 0) {
      alert("You do not have weak words yet. Take a normal test first.");
      return;
    }
    pool = weakWords;
  }

  if (pool.length === 0) {
    alert("Choose at least one chapter.");
    return;
  }

  if (focusMode) {
  testWords = pool.slice(0, Math.min(amount, pool.length));
} else {
  testWords = shuffle(pool).slice(0, Math.min(amount, pool.length));
}
  testIndex = 0;
testCorrect = 0;
missedWords = [];
answered = false;
currentTestSaved = false;

  showScreen("testScreen");
  renderTestWord();
}

function renderTestWord() {
  const word = testWords[testIndex];

  document.getElementById("testGreek").textContent = word.greek;
  document.getElementById("testProgress").textContent = `${testIndex + 1} / ${testWords.length}`;
  document.getElementById("answerInput").value = "";
  document.getElementById("feedback").textContent = "";
  document.getElementById("feedback").className = "feedback";
  document.getElementById("answerInput").disabled = false;
  document.getElementById("answerInput").focus();

  answered = false;
}

function submitAnswer() {
  if (answered) {
    nextTestWord();
    return;
  }

  const word = testWords[testIndex];
  const userAnswer = document.getElementById("answerInput").value;
  const correct = isCorrect(userAnswer, word.meaning);

  const feedback = document.getElementById("feedback");

  if (correct) {
    testCorrect++;
    feedback.textContent = "Correct!";
    feedback.classList.add("correct");
    updateWordStats(word.id, true);
  } else {
    feedback.textContent = `Incorrect. Answer: ${word.meaning}`;
    feedback.classList.add("incorrect");
    missedWords.push(word);
    updateWordStats(word.id, false);
  }

  document.getElementById("answerInput").disabled = true;
  answered = true;

  setTimeout(() => {
    nextTestWord();
  }, correct ? 700 : 1600);
}

function nextTestWord() {
  if (testIndex < testWords.length - 1) {
    testIndex++;
    renderTestWord();
  } else {
    finishTest();
  }
}

document.getElementById("answerInput").addEventListener("keydown", e => {
  if (e.key === "Enter") {
    submitAnswer();
  }
});

function finishTest() {
   if (currentTestSaved) return;
  currentTestSaved = true;

  saveTestScore(testCorrect, testWords.length);

  document.getElementById("scoreResult").textContent =
    `${testCorrect} / ${testWords.length}`;

  const missedContainer = document.getElementById("missedWords");

  if (missedWords.length === 0) {
    missedContainer.innerHTML = "<p>You did not miss any words.</p>";
  } else {
    missedContainer.innerHTML = "<h3>Words to review</h3>";
    missedWords.forEach(word => {
      const div = document.createElement("div");
      div.className = "review-word";
      div.innerHTML = `<strong>${word.greek}</strong><br>${word.meaning}`;
      missedContainer.appendChild(div);
    });
  }

  showScreen("resultsScreen");
}

function studyMissedWords() {
  if (missedWords.length === 0) return;
  learnWords = missedWords;
  learnIndex = 0;
  showScreen("learnScreen");
  renderLearnCard();
}

function normalize(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[.,;:!?]/g, "")
    .replace(/\s+/g, " ");
}

function splitUserAnswers(input) {
  return input
    .split(/[,;]/)
    .map(answer => normalize(answer))
    .filter(Boolean);
}

function splitCorrectAnswers(meaning) {
  return meaning
    .split(/[,;]/)
    .map(answer => normalize(answer))
    .filter(Boolean);
}

function isCorrect(userInput, meaning) {
  const userAnswers = splitUserAnswers(userInput);
  const correctAnswers = splitCorrectAnswers(meaning);

  return userAnswers.some(userAnswer =>
    correctAnswers.some(correctAnswer =>
      userAnswer === correctAnswer
    )
  );
}

function shuffle(array) {
  return [...array].sort(() => Math.random() - 0.5);
}

function getStats() {
  return JSON.parse(localStorage.getItem("greekVocabStats")) || {
    tests: [],
    words: {}
  };
}

function saveStats(stats) {
  localStorage.setItem("greekVocabStats", JSON.stringify(stats));
}

function updateWordStats(wordId, wasCorrect) {
  const stats = getStats();

  if (!stats.words[wordId]) {
    stats.words[wordId] = { correct: 0, wrong: 0 };
  }

  if (wasCorrect) {
    stats.words[wordId].correct++;
  } else {
    stats.words[wordId].wrong++;
  }

  saveStats(stats);
}

function saveTestScore(correct, total) {
  if (!total || total <= 0) return;

  const stats = getStats();

  stats.tests.push({
    correct: Number(correct),
    total: Number(total),
    percent: Math.round((correct / total) * 100),
    date: new Date().toLocaleString()
  });

  saveStats(stats);
}

function getWeakWords(pool) {
  const stats = getStats();

  return pool
    .map(word => {
      const wordStats = stats.words[word.id];
      if (!wordStats) return null;

      const attempts = wordStats.correct + wordStats.wrong;
      if (attempts === 0) return null;

      const accuracy = wordStats.correct / attempts;
      const isWeak = wordStats.wrong >= 2 || accuracy < 0.7;

      if (!isWeak) return null;

      return {
        ...word,
        weakScore: calculateWeakScore(wordStats.correct, wordStats.wrong)
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.weakScore - a.weakScore);
}

function calculateWeakScore(correct, wrong) {
  const attempts = correct + wrong;
  const accuracy = attempts === 0 ? 1 : correct / attempts;

  return wrong * 2 + (1 - accuracy) * 5;
}

function showProgress() {
  const stats = getStats();
  const container = document.getElementById("progressStats");

  if (stats.tests.length === 0) {
    container.innerHTML = "<p>No tests taken yet.</p>";
    showScreen("progressScreen");
    return;
  }

  const totalTests = stats.tests.length;
  const latest = stats.tests[stats.tests.length - 1];
  const best = Math.max(...stats.tests.map(t => t.percent));
  const average = Math.round(
    stats.tests.reduce((sum, t) => sum + t.percent, 0) / totalTests
  );

 const hardest = Object.entries(stats.words)
  .map(([id, stat]) => {
    const word = VOCAB.find(w => w && w.id === Number(id));

    if (!word) return null;

    return {
      word,
      wrong: stat.wrong || 0,
      correct: stat.correct || 0
    };
  })
  .filter(item => item && item.wrong > 0)
  .sort((a, b) => b.wrong - a.wrong)
  .slice(0, 10);

  container.innerHTML = `
    <p><strong>Total tests:</strong> ${totalTests}</p>
    <p><strong>Latest score:</strong> ${latest.percent}%</p>
    <p><strong>Best score:</strong> ${best}%</p>
    <p><strong>Average score:</strong> ${average}%</p>
    <h3>Most missed words</h3>
  `;

  if (hardest.length === 0) {
    container.innerHTML += "<p>No missed words yet.</p>";
  } else {
    hardest.forEach(item => {
      container.innerHTML += `
        <div class="review-word">
          <strong>${item.word.greek}</strong><br>
          ${item.word.meaning}<br>
          Missed: ${item.wrong}
        </div>
      `;
    });
  }

  showScreen("progressScreen");
}

function showSettings() {
  showScreen("settingsScreen");
}

function resetTestData() {
  const confirmed = confirm(
    "Are you sure?\n\nThis will permanently reset all test scores, progress stats, and weak-word tracking. This cannot be undone."
  );

  if (!confirmed) return;

  localStorage.removeItem("greekVocabStats");

  alert("Test data has been reset.");
  showHome();
}
function toggleDarkMode() {
  const isDark = document.getElementById("darkModeToggle").checked;
  document.body.classList.toggle("dark", isDark);

  localStorage.setItem("darkMode", isDark);
}

// load saved preference
window.addEventListener("load", () => {
  const saved = localStorage.getItem("darkMode") === "true";
  document.body.classList.toggle("dark", saved);

  const toggle = document.getElementById("darkModeToggle");
  if (toggle) toggle.checked = saved;
});

function toggleResetSection() {
  const el = document.getElementById("resetContent");
  el.classList.toggle("open");
}

function showInfoModal() {
  const modal = document.getElementById("infoModal");
  if (modal) modal.classList.add("open");
}

function hideInfoModal() {
  const modal = document.getElementById("infoModal");
  if (modal) modal.classList.remove("open");
}

function closeInfoModal(event) {
  if (event.target.id === "infoModal") {
    hideInfoModal();
  }
}

function showLearnInfoModal() {
  const modal = document.getElementById("learnInfoModal");
  if (modal) modal.classList.add("open");
}

function hideLearnInfoModal() {
  const modal = document.getElementById("learnInfoModal");
  if (modal) modal.classList.remove("open");
}

function closeLearnInfoModal(event) {
  if (event.target.id === "learnInfoModal") {
    hideLearnInfoModal();
  }
}

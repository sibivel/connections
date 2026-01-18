/**
 * @typedef {object} Guess
 * @property {string[]} words - The words that were guessed.
 * @property {GuessResult[keyof GuessResult]} result - The result of the guess.
 */

/**
 * @readonly
 * @enum {string}
 */
const GuessResult = {
  NO_MATCHES: 'no_matches',
  THREE_FOUND: 'three_found',
  GROUP_FOUND: 'group_found',
};

document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  /** @type {HTMLInputElement | null} */
  const wordInput = document.getElementById('word-input');
  /** @type {HTMLElement | null} */
  const wordList = document.getElementById('word-list');
  /** @type {HTMLButtonElement | null} */
  const guessBtn = document.getElementById('guess-btn');
  /** @type {HTMLElement | null} */
  const resultModal = document.getElementById('result-modal');
  /** @type {HTMLButtonElement | null} */
  const noMatchesBtn = document.getElementById('no-matches-btn');
  /** @type {HTMLButtonElement | null} */
  const groupFoundBtn = document.getElementById('group-found-btn');
  /** @type {HTMLButtonElement | null} */
  const threeFoundBtn = document.getElementById('three-found-btn');
  /** @type {HTMLElement | null} */
  const guessesContainer = document.getElementById('guesses-container');
    /** @type {HTMLButtonElement | null} */
    const clearWordsBtn = document.getElementById('clear-words-btn');
    /** @type {HTMLButtonElement | null} */
    const clearGuessesBtn = document.getElementById('clear-guesses-btn');

  // State
  /** @type {string[]} */
  let words = [];
  /** @type {string[]} */
  let selectedWords = [];
  /** @type {Guess[]} */
  let guesses = [];
  /** @type {string[]} */
  let foundWords = [];
  /** @type {string[]} */
  let invalidWords = [];

  // --- Analytics Function (To be implemented by user) ---
  /**
   * @param {string[]} selected - The currently selected words.
   * @param {string[]} allWords - All words on the board.
   * @param {Guess[]} guesses - All past guesses.
   * @returns {string[]} - An array of words that are invalid candidates.
   */
  function getInvalidCandidates(selected, allWords, guesses) {
    invalidCandidates = [];
    for (let word of allWords) {
      if (selected.includes(word)) {
        continue;
      }
      if (!validateCandidate(selected, word, allWords, guesses)) {
        invalidCandidates.push(word);
      }
    }
    return invalidCandidates;
  }

  function validateCandidate(selected, word, allWords, guesses) {
    if (selected.length == 4) {
      return false
    }
    numGroupsNeeded = allWords.length / 4;
    group1 = new Set(selected);
    group1.add(word);
    groups = [group1];
    for (let g = 1; g < numGroupsNeeded; g++) {
      groups.push(new Set());
    }
    remainingWords = allWords.filter((w) => !group1.has(w));
    return checkGuesses(groups, remainingWords, guesses);
  }

  function checkGuesses(groups, remainingWords, guesses) {
    for (let guess of guesses) {
      if (guess.result === GuessResult.GROUP_FOUND) {
        continue;
      }
      for (let group of groups) {
        if (guess.result === GuessResult.NO_MATCHES && !checkNoMatchesGuess(group, guess)) {
          return false;
        }
        if (guess.result === GuessResult.THREE_FOUND && !checkThreeFoundGuess(group, guess)) {
          return false;
        }
      }
    }

    if (remainingWords.length == 0) {
      return true;
    }
    remainingWord = remainingWords.pop();
    for (group of groups) {
      if (group.length === 4) {
        continue;
      }
      group.add(remainingWord);
      if (checkGuesses(groups, remainingWords, guesses)) {
        return true;
      }
      group.delete(remainingWord);
    }
    return false;
  }

  function checkNoMatchesGuess(group, guess) {
    let count = guess.words.filter((word) => group.has(word)).length;
    return count <= 2;
  }

  function checkThreeFoundGuess(group, guess) {
    if (group.size < 4) {
      return true;
    }
    let count = guess.words.filter((word) => group.has(word)).length;
    return count == 3 || count <= 1;
  }

  // --- Local Storage Functions ---
  function saveData() {
    localStorage.setItem('connections_words', JSON.stringify(words));
    localStorage.setItem('connections_guesses', JSON.stringify(guesses));
    localStorage.setItem('connections_found_words', JSON.stringify(foundWords));
  }

  function loadData() {
    const storedWords = localStorage.getItem('connections_words');
    if (storedWords) words = JSON.parse(storedWords);

    const storedGuesses = localStorage.getItem('connections_guesses');
    if (storedGuesses) guesses = JSON.parse(storedGuesses);

    const storedFoundWords = localStorage.getItem('connections_found_words');
    if (storedFoundWords) foundWords = JSON.parse(storedFoundWords);
  }

  // --- Guess Handling ---
  /**
   * @param {GuessResult[keyof GuessResult]} result
   * @returns {void}
   */
  function handleGuessResult(result) {
    const guess = { words: [...selectedWords], result: result };
    guesses.push(guess);
    if (result === GuessResult.GROUP_FOUND) {
      foundWords.push(...selectedWords);
    }
    selectedWords = [];
    invalidWords = [];
    saveData();
    renderAll();
    updateGuessButton();
  }

  // --- UI Update & Render Functions ---
  function updateInvalidWords() {
    if (selectedWords.length > 0) {
      invalidWords = getInvalidCandidates(
        selectedWords,
        words.filter((w) => !foundWords.includes(w)),
        guesses
      );
    } else {
      invalidWords = [];
    }
  }

  function renderAll() {
    renderWords();
    renderGuesses();
  }

  function renderWords() {
    if (!wordList) return;
    wordList.innerHTML = '';
    words.forEach((word) => {
      const wordItem = document.createElement('div');
      wordItem.className = 'word-item';

      const wordText = document.createElement('span');
      wordText.className = 'word-text';
      wordText.textContent = word;
      wordItem.appendChild(wordText);

      const isFound = foundWords.includes(word);
      const isInvalid = invalidWords.includes(word);

      if (isFound) {
        wordItem.classList.add('found');
      } else if (isInvalid) {
        wordItem.classList.add('invalid');
      } else {
        if (selectedWords.includes(word)) {
          wordItem.classList.add('selected');
        }

        wordItem.addEventListener('click', () => {
          if (selectedWords.includes(word)) {
            selectedWords = selectedWords.filter((w) => w !== word);
          } else if (selectedWords.length < 4) {
            selectedWords.push(word);
          }
          updateInvalidWords();
          renderAll();
          updateGuessButton();
        });

        const removeBtn = document.createElement('button');
        removeBtn.className = 'remove-btn';
        removeBtn.textContent = 'x';
        removeBtn.onclick = function (e) {
          e.stopPropagation();
          words = words.filter((w) => w !== word);
          selectedWords = selectedWords.filter((w) => w !== word);
          updateInvalidWords();
          saveData();
          renderAll();
          updateGuessButton();
        };
        wordItem.appendChild(removeBtn);
      }
      wordList.appendChild(wordItem);
    });
  }

  function renderGuesses() {
    if (!guessesContainer) return;
    guessesContainer.innerHTML = '<h2>Past Guesses</h2>';
    if (guesses.length === 0) {
      guessesContainer.innerHTML += '<p>No guesses made yet.</p>';
      return;
    }
    guesses.forEach((guess) => {
      const guessItem = document.createElement('div');
      guessItem.className = 'guess-item';
      const wordsText = guess.words.join(', ');
      let resultText = 'Unknown';
      switch (guess.result) {
        case GuessResult.NO_MATCHES:
          resultText = 'No Matches';
          break;
        case GuessResult.THREE_FOUND:
          resultText = 'Three Found';
          break;
        case GuessResult.GROUP_FOUND:
          resultText = 'Group Found!';
          break;
      }
      guessItem.innerHTML = `<span class="guess-words">${wordsText}</span><span class="guess-result ${guess.result}">${resultText}</span>`;
      guessesContainer.appendChild(guessItem);
    });
  }

  function updateGuessButton() {
    if (guessBtn) {
      guessBtn.disabled = selectedWords.length !== 4;
    }
  }

  /**
   * @param {string} word
   * @returns {void}
   */
  function addWordToList(word) {
    if (!words.includes(word)) {
      words.push(word);
      saveData();
      renderAll();
    }
  }

  // --- Event Listeners ---
  if (wordInput) {
    wordInput.addEventListener('keydown', function (e) {
      if ((e.key === 'Enter' || e.key === ' ') && this.value.trim() !== '') {
        e.preventDefault();
        addWordToList(this.value.trim().toLowerCase());
        this.value = '';
      }
    });
  }

  if (guessBtn) {
    guessBtn.addEventListener('click', () => {
      if (resultModal && selectedWords.length === 4) {
        resultModal.style.display = 'flex';
      }
    });
  }

  /**
   * @param {GuessResult[keyof GuessResult]} result
   */
  const modalResultHandler = (result) => {
    handleGuessResult(result);
    if (resultModal) {
      resultModal.style.display = 'none';
    }
  };

  noMatchesBtn?.addEventListener('click', () => modalResultHandler(GuessResult.NO_MATCHES));
  groupFoundBtn?.addEventListener('click', () => modalResultHandler(GuessResult.GROUP_FOUND));
  threeFoundBtn?.addEventListener('click', () => modalResultHandler(GuessResult.THREE_FOUND));

  // --- Initial Load ---
  loadData();
  renderAll();
});

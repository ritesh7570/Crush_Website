// ---------- config ----------
const NAME = 'Roshani';
const TYPE_SPEED = 130;

// Static-safe answer delivery. Put a Formspree endpoint here after setup:
// example: https://formspree.io/f/yourFormId
// Do not put email passwords or secret keys in this file.
const ANSWER_ENDPOINT = '';

// ---------- gameplay state ----------
const state = {
  currentLevel: 0,
  answers: [],
  sessionId: `roshani-${Date.now()}`,
  result: null,
  submitted: false,
  noAttempts: 0
};

const elements = {
  overlay: document.getElementById('gameOverlay'),
  title: document.getElementById('gameTitle'),
  prompt: document.getElementById('gamePrompt'),
  topline: document.getElementById('gameTopline'),
  choices: document.getElementById('gameChoices'),
  reaction: document.getElementById('gameReaction'),
  next: document.getElementById('gameNext'),
  replay: document.getElementById('gameReplay'),
  siteShell: document.getElementById('siteShell'),
  lampBtn: document.getElementById('lampBtn'),
  lampHint: document.getElementById('lampHint'),
  nameText: document.getElementById('nameText'),
  hero: document.getElementById('hero'),
  soundToggle: document.getElementById('soundToggle'),
  bgAudio: document.getElementById('bgAudio'),
  finalCard: document.getElementById('finalCard'),
  finalYes: document.getElementById('finalYes'),
  finalNo: document.getElementById('finalNo'),
  finalChoiceText: document.getElementById('finalChoiceText')
};

const FRIENDSHIP_LEVEL = {
  type: 'friendship',
  level: 'Level 00: Very Official',
  title: 'Tiny friendship audit',
  prompt: 'Before this unnecessary little experiment starts, one dangerous question: should this website allow Ritesh to apply for friendship?'
};

const STORY_LEVELS = [
  {
    type: 'rapid',
    level: 'Level 04: Rapid Fire 🧸⚡',
    title: 'Rapid fire! ⚡ Answer 8 quick questions!',
    prompt: '🧸 Pick fast. (Teddy has a stopwatch. No pressure.) Funny comments come after each answer!',
    questions: [
      { 
        q: '☕ Tea or coffee?', 
        options: ['Tea 🧋', 'Coffee ☕'],
        reactions: ['☕ Tea lover! Calm and thoughtful. (Teddy approves.)', '☕ Coffee energy! You like things fast and bold. (Teddy is caffeinated now too!)']
      },
      { 
        q: '🌅 Sunrise or midnight?', 
        options: ['Sunrise 🌅', 'Midnight 🌙'],
        reactions: ['🌅 Early bird! The world is yours at dawn. (Teddy is impressed.)', '🌙 Night owl! Where the magic happens. (Teddy gets it.)']
      },
      { 
        q: '📍 Planned trip or random adventure?', 
        options: ['Planned 📋', 'Random 🎲'],
        reactions: ['📋 Planner! Organization is your superpower. (Teddy loves order.)', '🎲 Spontaneous! Life is the adventure. (Teddy is ready to go!)']
      },
      { 
        q: '📞 Call or text?', 
        options: ['Call 📞', 'Text 💬'],
        reactions: ['📞 Call lover! Brave of you. (Teddy respects the courage.)', '💬 Text master! More time to think. (Teddy understands perfectly.)']
      },
      { 
        q: '🎵 Music or silence?', 
        options: ['Music 🎵', 'Silence 🤫'],
        reactions: ['🎵 Music lover! Rhythm flows through you. (Teddy is dancing now.)', '🤫 Silence seeker! Peace is your space. (Teddy nods wisely.)']
      },
      { 
        q: '📚 Fiction or reality?', 
        options: ['Fiction 📖', 'Reality 📰'],
        reactions: ['📖 Dreamer! Stories make the world beautiful. (Teddy loves good tales.)', '📰 Realist! Truth is powerful. (Teddy respects that.)']
      },
      { 
        q: '🍕 Food adventure or comfort food?', 
        options: ['Adventure 🌶️', 'Comfort 🍲'],
        reactions: ['🌶️ Food adventurer! Life is spicy. (Teddy wants some!)', '🍲 Comfort seeker! Warmth is wisdom. (Teddy\'s favorite kind.)']
      },
      { 
        q: '✨ Deeply ambitious or happily content?', 
        options: ['Ambitious 🚀', 'Content 🌿'],
        reactions: ['🚀 Ambitious soul! Sky is not the limit. (Teddy believes in you!)', '🌿 Content spirit! Growth comes naturally. (Teddy is proud.)']
      }
    ]
  }
];

let gameDeck = [];
let lit = false;

function shuffle(array) {
  const copy = [...array];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
}

function clearGame() {
  elements.choices.innerHTML = '';
  elements.reaction.textContent = '';
  elements.next.hidden = true;
  elements.replay.hidden = true;
  elements.next.onclick = null;
}

function goNext() {
  state.currentLevel += 1;
  revealLevel(state.currentLevel);
}

function recordAnswer(level, question, answer, reaction) {
  state.answers.push({
    sessionId: state.sessionId,
    level,
    question,
    answer,
    reaction,
    timestamp: new Date().toISOString()
  });
}

function buildSummary() {
  const lines = [
    'Roshani Game Session',
    `Session ID: ${state.sessionId}`,
    `Timestamp: ${new Date().toISOString()}`,
    ''
  ];

  state.answers.forEach((entry) => {
    lines.push(`Level: ${entry.level}`);
    lines.push(`Question: ${entry.question}`);
    lines.push(`Answer: ${entry.answer}`);
    lines.push(`Reaction: ${entry.reaction}`);
    lines.push('');
  });

  if (state.result) {
    lines.push(`Result: ${state.result.title}`);
    lines.push(state.result.message);
  }

  return lines.join('\n');
}

async function sendAnswerSummary() {
  if (state.submitted) return;
  state.submitted = true;

  const summary = buildSummary();
  const payload = {
    sessionId: state.sessionId,
    timestamp: new Date().toISOString(),
    answers: state.answers,
    result: state.result,
    message: summary
  };

  localStorage.setItem('roshani-game-session', JSON.stringify(payload));

  if (!ANSWER_ENDPOINT) return;

  try {
    const response = await fetch(ANSWER_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        _subject: 'Roshani game session',
        email: 'ritesh0468@gmail.com',
        ...payload
      })
    });

    if (!response.ok) throw new Error(`Answer endpoint returned ${response.status}`);
  } catch (error) {
    console.warn('Answer summary could not be sent. Local backup saved.', error);
  }
}

function buildResult() {
  const scores = { midnight: 0, quiet: 0, chaos: 0, mystery: 0 };

  state.answers.forEach((entry) => {
    const text = String(entry.answer).toLowerCase();
    if (/(ride|midnight|random|moon|call)/.test(text)) scores.midnight += 1;
    if (/(temple|diya|lamp|tea|sunrise|leaf|planned)/.test(text)) scores.quiet += 1;
    if (/(food|mood|coffee|pretend)/.test(text)) scores.chaos += 1;
    if (/(hints|wait|text|depends|om)/.test(text)) scores.mystery += 1;
  });

  const winner = Object.entries(scores).sort((a, b) => b[1] - a[1])[0][0];
  const resultMap = {
    midnight: {
      title: 'THE MIDNIGHT EXPLORER',
      message: 'Spontaneous plans, long conversations, and decisions that become stories later.'
    },
    quiet: {
      title: 'THE DIYA SOUL',
      message: 'Peaceful, observant, and secretly powerful in the calmest possible way.'
    },
    chaos: {
      title: 'THE CHAOS SCHOLAR',
      message: 'Planning is optional, snacks are strategic, and the mood has voting rights.'
    },
    mystery: {
      title: 'THE MYSTERY PERSON',
      message: 'Somehow revealing a lot while revealing almost nothing. Impressive and inconvenient.'
    }
  };

  state.result = resultMap[winner];
  return state.result;
}

function makeButton(label, className = 'game-choice-btn') {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = className;
  button.textContent = label;
  return button;
}

function moveButtonAway(button) {
  state.noAttempts += 1;
  const panel = button.closest('.game-panel');
  const maxX = Math.max(24, panel.clientWidth - button.offsetWidth - 32);
  const maxY = Math.max(24, panel.clientHeight - button.offsetHeight - 32);
  const x = Math.floor(Math.random() * maxX) - maxX / 2;
  const y = Math.floor(Math.random() * maxY) - maxY / 3;
  button.classList.add('runaway-no');
  button.style.transform = `translate(${x}px, ${y}px) rotate(${state.noAttempts % 2 ? '-' : ''}6deg)`;
  const messages = [
    '🧸 No? That button seems emotionally unavailable.',
    '🧸😅 Teddy is shaking their head gently.',
    '🧸👀 The No button has joined witness protection. Try the friendly button (Teddy insists).',
    '🧸💔 Even the teddy bear is disappointed. (But in a very cute way.)'
  ];
  elements.reaction.textContent = messages[Math.min(state.noAttempts - 1, messages.length - 1)];
}

function renderFriendship(level) {
  elements.topline.textContent = level.level;
  elements.title.textContent = level.title + ' 🧸💕';
  elements.prompt.textContent = level.prompt + ' (The teddy bear says: choose wisely.)';

  const wrap = document.createElement('div');
  wrap.className = 'friendship-row';

  const yes = makeButton('Yes, friendship accepted');
  const no = makeButton('No', 'game-choice-btn no-choice');

  yes.addEventListener('click', () => {
    const reaction = '🧸✨ Correct answer. Your bravery has been approved by the diya committee (and the teddy bear).';
    recordAnswer(level.level, level.prompt, 'yes_friendship', reaction);
    elements.reaction.textContent = reaction;
    yes.classList.add('selected');
    no.disabled = true;
    elements.next.hidden = false;
    elements.next.textContent = 'Start the tiny game';
    elements.next.onclick = goNext;
  });

  ['pointerenter', 'focus', 'click', 'touchstart'].forEach((eventName) => {
    no.addEventListener(eventName, (event) => {
      event.preventDefault();
      moveButtonAway(no);
    });
  });

  wrap.append(yes, no);
  elements.choices.appendChild(wrap);
}

function renderChoice(level) {
  level.options.forEach((option) => {
    const button = makeButton(option.label);
    button.addEventListener('click', () => {
      recordAnswer(level.level, level.prompt, option.value, option.reaction);
      document.querySelectorAll('.game-choice-btn').forEach((item) => item.classList.remove('selected'));
      button.classList.add('selected');
      elements.reaction.textContent = option.reaction;
      elements.next.hidden = false;
      elements.next.textContent = 'Next';
      elements.next.onclick = goNext;
    });
    elements.choices.appendChild(button);
  });
}

function renderCards(level) {
  const wrap = document.createElement('div');
  wrap.className = 'card-grid';

  level.cards.forEach((card) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'story-card';
    button.innerHTML = `<span class="card-icon">${card.icon}</span><h3>${card.title}</h3><p>${card.text}</p>`;
    button.addEventListener('click', () => {
      document.querySelectorAll('.story-card').forEach((item) => item.classList.remove('selected'));
      button.classList.add('selected');
      recordAnswer(level.level, level.prompt, card.key, card.reaction);
      elements.reaction.textContent = card.reaction;
      elements.next.hidden = false;
      elements.next.textContent = 'Portal accepted';
      elements.next.onclick = goNext;
    });
    wrap.appendChild(button);
  });

  elements.choices.appendChild(wrap);
}

function renderMemory(level) {
  const wrap = document.createElement('div');
  wrap.className = 'memory-grid';
  const cards = shuffle(level.cards);
  let hidden = false;
  let locked = true;

  cards.forEach((card, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'memory-card revealed';
    button.setAttribute('aria-label', `Memory card ${index + 1}`);
    button.textContent = card.symbol;

    button.addEventListener('click', () => {
      if (locked || !hidden) return;
      button.classList.add('revealed');
      button.textContent = card.symbol;

      if (card.key === 'lamp') {
        locked = true;
        const reaction = 'Found it. The diya approves your detective career.';
        recordAnswer(level.level, level.prompt, 'lamp_found', reaction);
        elements.reaction.textContent = reaction;
        elements.next.hidden = false;
        elements.next.textContent = 'Continue';
        elements.next.onclick = goNext;
        return;
      }

      elements.reaction.textContent = 'That was not the diya. The diya is being dramatic. Try again.';
      setTimeout(() => {
        button.classList.remove('revealed');
        button.textContent = '?';
      }, 650);
    });

    wrap.appendChild(button);
  });

  elements.choices.appendChild(wrap);
  elements.reaction.textContent = 'Look carefully...';

  setTimeout(() => {
    hidden = true;
    locked = false;
    wrap.querySelectorAll('.memory-card').forEach((button) => {
      button.classList.remove('revealed');
      button.textContent = '?';
    });
    elements.reaction.textContent = 'Now tap where the diya was.';
  }, 1500);
}

function renderRapid(level) {
  let index = 0;
  let questionIndex = 0;
  const selected = [];

  function drawQuestion() {
    const question = level.questions[questionIndex];
    if (!question) {
      const answer = selected.map((item) => `${item.question}: ${item.answer}`).join(' | ');
      const reaction = '✨ Result: dangerously interesting. The research team needs chai. ✨';
      recordAnswer(level.level, 'Rapid fire answers', answer, reaction);
      elements.title.textContent = '🧸 Calculated.';
      elements.prompt.textContent = 'Your personality report is loading with unnecessary seriousness...';
      elements.choices.innerHTML = '<div class="progress-line"><span style="width:100%"></span></div>';
      elements.reaction.textContent = reaction;
      elements.next.hidden = false;
      elements.next.textContent = 'Show result';
      elements.next.onclick = goNext;
      return;
    }

    elements.title.textContent = `🧸 Rapid fire! Question ${questionIndex + 1}/8`;
    elements.prompt.textContent = question.q;
    elements.choices.innerHTML = '';
    elements.reaction.textContent = '';

    const progress = document.createElement('div');
    progress.className = 'progress-line';
    progress.innerHTML = `<span style="width:${(questionIndex / level.questions.length) * 100}%"></span>`;
    elements.choices.appendChild(progress);

    const wrap = document.createElement('div');
    wrap.className = 'rapid-fire-wrap';
    question.options.forEach((option, optionIndex) => {
      const button = makeButton(option);
      button.addEventListener('click', () => {
        button.classList.add('selected');
        const reaction = question.reactions[optionIndex] || '🧸 Good choice!';
        selected.push({ question: question.q, answer: option });
        
        // Show reaction
        elements.reaction.textContent = reaction;
        
        // Disable all buttons
        document.querySelectorAll('.rapid-fire-wrap button').forEach(b => b.disabled = true);
        
        // Move to next question after a delay
        questionIndex += 1;
        setTimeout(drawQuestion, 1200);
      });
      wrap.appendChild(button);
    });
    elements.choices.appendChild(wrap);
  }

  drawQuestion();
}

function showGameResult() {
  const result = buildResult();
  clearGame();
  elements.topline.textContent = 'Official Result';
  elements.title.textContent = result.title;
  elements.prompt.textContent = result.message;
  elements.reaction.textContent = 'One tiny diya is waiting at the end. Obviously.';
  elements.next.hidden = false;
  elements.next.textContent = 'Reveal the diya';
  elements.next.onclick = async () => {
    await sendAnswerSummary();
    showSite();
  };
  elements.replay.hidden = false;
  elements.replay.textContent = 'Play again';
  elements.replay.onclick = initGame;
}

function revealLevel(levelIndex) {
  const level = gameDeck[levelIndex];
  if (!level) {
    showGameResult();
    return;
  }

  clearGame();
  elements.topline.textContent = level.level;
  elements.title.textContent = level.title;
  elements.prompt.textContent = level.prompt;

  if (level.type === 'friendship') renderFriendship(level);
  if (level.type === 'choice') renderChoice(level);
  if (level.type === 'cards') renderCards(level);
  if (level.type === 'memory') renderMemory(level);
  if (level.type === 'rapid') renderRapid(level);
}

function showSite() {
  elements.overlay.classList.add('hidden');
  document.body.classList.add('story-passed');
  elements.siteShell.classList.add('story-visible');
  document.querySelectorAll('.reveal-section').forEach((el) => el.classList.add('visible'));
  setTimeout(() => elements.hero.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
}

function initGame() {
  gameDeck = [FRIENDSHIP_LEVEL, ...shuffle(STORY_LEVELS)];
  state.currentLevel = 0;
  state.answers = [];
  state.result = null;
  state.submitted = false;
  state.noAttempts = 0;
  state.sessionId = `roshani-${Date.now()}`;
  elements.overlay.classList.remove('hidden');
  document.body.classList.remove('story-passed');
  revealLevel(state.currentLevel);
}

function typeName() {
  let i = 0;
  const cursor = document.createElement('span');
  cursor.className = 'cursor';
  cursor.textContent = '|';

  const tick = () => {
    if (i <= NAME.length) {
      elements.nameText.textContent = NAME.slice(0, i);
      elements.nameText.appendChild(cursor);
      i += 1;
      setTimeout(tick, TYPE_SPEED);
    } else {
      setTimeout(() => cursor.remove(), 900);
    }
  };
  tick();
}

function lightLamp() {
  if (lit) return;
  lit = true;

  elements.lampBtn.classList.add('lit');
  elements.lampHint.classList.add('hidden');
  elements.hero.classList.add('lit-active');

  typeName();

  elements.soundToggle.hidden = false;
  elements.bgAudio.volume = 0.55;
  elements.bgAudio.play().catch(() => {
    elements.soundToggle.classList.add('muted');
  });
}

// ---------- hidden interactions ----------
document.querySelectorAll('.tap-reveal, .hidden-line-trigger').forEach((btn) => {
  const text = btn.dataset.reveal;
  if (!text) return;

  const note = document.createElement('span');
  note.className = 'tap-reveal-note';
  note.hidden = true;
  note.textContent = text;
  btn.after(note);

  btn.addEventListener('click', () => {
    note.hidden = !note.hidden;
    btn.setAttribute('aria-pressed', String(!note.hidden));
  });
});

document.querySelectorAll('.reveal-target').forEach((card) => {
  const toggle = () => {
    const note = card.querySelector('.target-note');
    if (note) note.hidden = !note.hidden;
  };

  card.addEventListener('click', toggle);
  card.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      toggle();
    }
  });
});

// ---------- final tiny yes/no ----------
if (elements.finalYes && elements.finalNo) {
  elements.finalYes.addEventListener('click', () => {
    elements.finalCard.hidden = false;
    elements.finalChoiceText.textContent = 'Small diya message unlocked: May your path stay bright, peaceful, and a little funny.';
  });

  ['pointerenter', 'focus', 'click', 'touchstart'].forEach((eventName) => {
    elements.finalNo.addEventListener(eventName, (event) => {
      event.preventDefault();
      const x = Math.floor(Math.random() * 120) - 60;
      const y = Math.floor(Math.random() * 90) - 45;
      elements.finalNo.style.transform = `translate(${x}px, ${y}px)`;
      elements.finalChoiceText.textContent = 'The No button is shy. The Yes button is emotionally stable.';
    });
  });
}

// ---------- sound toggle ----------
elements.soundToggle.addEventListener('click', () => {
  if (elements.bgAudio.paused) {
    elements.bgAudio.play().catch(() => {});
    elements.soundToggle.classList.remove('muted');
  } else {
    elements.bgAudio.pause();
    elements.soundToggle.classList.add('muted');
  }
});

// ---------- lamp interaction ----------
elements.lampBtn.addEventListener('click', lightLamp);
elements.lampBtn.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    lightLamp();
  }
});

// ---------- scroll reveal ----------
const revealEls = document.querySelectorAll('.reveal-section');
const io = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      io.unobserve(entry.target);
    }
  });
}, { threshold: 0.18 });

revealEls.forEach((el) => io.observe(el));

// ---------- start ----------
window.addEventListener('load', () => {
  initGame();
});

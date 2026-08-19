// ---------- config ----------
const NAME = 'Roshani';
const TYPE_SPEED = 130;

// Formspree endpoint for email delivery
const ANSWER_ENDPOINT = 'https://formspree.io/f/xeajppgd';

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
  shivaAudio: document.getElementById('shivaAudio'),
  finalCard: document.getElementById('finalCard'),
  finalYes: document.getElementById('finalYes'),
  finalNo: document.getElementById('finalNo'),
  finalChoiceText: document.getElementById('finalChoiceText')
};

const FRIENDSHIP_LEVEL = {
  type: 'friendship',
  level: 'Level 0: Very Official',
  title: 'Tiny friendship audit',
  prompt: 'Before this unnecessary little experiment starts, one dangerous question: should this website allow Ritesh to apply for friendship?'
};

const STORY_LEVELS = [
  {
    type: 'choice',
    level: 'Level 1: Soft Start',
    title: 'Teddy wants to know one thing',
    prompt: 'What kind of friendship feels sweetest to you?',
    options: [
      { label: 'Laughing on silly things', value: 'funny', reaction: 'Teddy says: excellent, comedy is a serious friendship skill.' },
      { label: 'Deep talks without judgement', value: 'deep', reaction: 'Teddy has written this down with a tiny golden pen.' },
      { label: 'Small care, no drama', value: 'care', reaction: 'Very classy. Teddy is clapping very politely.' },
      { label: 'Random plans and memories', value: 'random', reaction: 'Adventure department approved. Teddy packed imaginary snacks.' }
    ]
  },
  {
    type: 'cards',
    level: 'Level 2: Teddy Picks A Mood',
    title: 'Choose a cute little mood',
    prompt: 'No right answer. Teddy will only judge a little.',
    cards: [
      { key: 'diya', icon: 'Soft diya', title: 'Peaceful Glow', text: 'Warm light, calm talk, and no unnecessary noise.', reaction: 'Teddy says this is girlfriend-friendly peace level 100.' },
      { key: 'moon', icon: 'Moon note', title: 'Moon Message', text: 'A late little text that somehow becomes a full conversation.', reaction: 'Noted. Teddy is pretending not to smile.' },
      { key: 'chai', icon: 'Chai plan', title: 'Chai Secret', text: 'Tea, snacks, and a conversation that forgets the time.', reaction: 'Teddy approves this plan with both paws.' }
    ]
  },
  {
    type: 'memory',
    level: 'Level 3: Teddy Memory',
    title: 'Find teddy heart',
    prompt: 'Memorize the cards. When they hide, tap where the teddy heart was.',
    cards: [
      { symbol: 'Teddy heart', key: 'heart' },
      { symbol: 'Moon', key: 'moon' },
      { symbol: 'Om', key: 'om' },
      { symbol: 'Leaf', key: 'leaf' }
    ]
  },
  {
    type: 'rapid',
    level: 'Level 4: Rapid Fire',
    title: 'Rapid fire! Four tiny questions',
    prompt: 'Pick fast. Teddy has a stopwatch, but thankfully no exam paper.',
    questions: [
      {
        q: 'Tea or coffee?',
        options: ['Tea', 'Coffee'],
        reactions: ['Tea lover. Calm, thoughtful, and teddy-approved.', 'Coffee energy. Teddy is now alert and slightly dramatic.']
      },
      {
        q: 'Sunrise or midnight?',
        options: ['Sunrise', 'Midnight'],
        reactions: ['Soft morning energy. Teddy respects the discipline.', 'Midnight mood. Teddy understands the secret conversation timing.']
      },
      {
        q: 'Planned trip or random plan?',
        options: ['Planned', 'Random'],
        reactions: ['Planner energy. Teddy loves a clean itinerary.', 'Random plan accepted. Teddy has no idea where we are going, but is ready.']
      },
      {
        q: 'Call or text?',
        options: ['Call', 'Text'],
        reactions: ['Call chosen. Brave, direct, and very clear.', 'Text chosen. Thoughtful typing mode activated.']
      }
    ]
  },
  {
    type: 'choice',
    level: 'Level 5: Teddy Confidential',
    title: 'One last cute question',
    prompt: 'If someone remembers tiny details about you, what is that?',
    options: [
      { label: 'Sweet', value: 'sweet', reaction: 'Teddy agrees. Small details are basically tiny flowers.' },
      { label: 'Very sweet', value: 'very_sweet', reaction: 'That answer has been wrapped in a small ribbon.' },
      { label: 'Suspiciously sweet', value: 'suspicious', reaction: 'Correct. Teddy is wearing detective glasses now.' },
      { label: 'Depends who it is', value: 'depends', reaction: 'Aha. Teddy has stopped blinking. Interesting.' }
    ]
  }
];

let gameDeck = [];
let lit = false;
let audioContext;

function playUiSound(kind = 'tap') {
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return;

  audioContext = audioContext || new AudioCtx();
  if (audioContext.state === 'suspended') audioContext.resume();

  const now = audioContext.currentTime;
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  const soundMap = {
    tap: [520, 700, 0.055],
    focus: [420, 520, 0.04],
    success: [620, 880, 0.11],
    wrong: [190, 145, 0.1]
  };
  const [startFrequency, endFrequency, duration] = soundMap[kind] || soundMap.tap;

  oscillator.type = kind === 'wrong' ? 'triangle' : 'sine';
  oscillator.frequency.setValueAtTime(startFrequency, now);
  oscillator.frequency.exponentialRampToValueAtTime(endFrequency, now + duration);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(kind === 'wrong' ? 0.035 : 0.045, now + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  oscillator.connect(gain);
  gain.connect(audioContext.destination);
  oscillator.start(now);
  oscillator.stop(now + duration + 0.02);
}

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

function getDeviceInfo() {
  const platform = navigator.userAgentData?.platform || navigator.platform || 'Unknown device';
  return { deviceName: platform };
}

async function sendAnswerSummary() {
  if (state.submitted) return;
  state.submitted = true;

  const summary = buildSummary();
  const deviceInfo = getDeviceInfo();

  const payload = {
    sessionId: state.sessionId,
    timestamp: new Date().toISOString(),
    answers: state.answers,
    result: state.result,
    message: summary,
    device: deviceInfo
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
  const scores = { midnight: 0, quiet: 0, chaos: 0, sweet: 0 };

  state.answers.forEach((entry) => {
    const text = String(entry.answer).toLowerCase();
    if (/(random|midnight|moon|call)/.test(text)) scores.midnight += 1;
    if (/(care|diya|tea|sunrise|leaf|planned)/.test(text)) scores.quiet += 1;
    if (/(funny|coffee|suspicious)/.test(text)) scores.chaos += 1;
    if (/(deep|sweet|very_sweet|chai|text|depends|heart)/.test(text)) scores.sweet += 1;
  });

  const winner = Object.entries(scores).sort((a, b) => b[1] - a[1])[0][0];
  const resultMap = {
    midnight: {
      title: 'THE MIDNIGHT EXPLORER',
      message: 'Spontaneous, curious, and very capable of turning one small plan into a full memory.'
    },
    quiet: {
      title: 'THE DIYA SOUL',
      message: 'Soft, peaceful, and quietly powerful. Teddy says this is premium calm energy.'
    },
    chaos: {
      title: 'THE CUTE CHAOS SCHOLAR',
      message: 'Funny, expressive, and just unpredictable enough to keep the website nervous.'
    },
    sweet: {
      title: 'THE TEDDY HEART',
      message: 'Warm, thoughtful, and difficult not to smile around. Teddy is taking full credit.'
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
  playUiSound('wrong');
  const panel = button.closest('.game-panel');
  const maxX = Math.max(24, panel.clientWidth - button.offsetWidth - 32);
  const maxY = Math.max(24, panel.clientHeight - button.offsetHeight - 32);
  const x = Math.floor(Math.random() * maxX) - maxX / 2;
  const y = Math.floor(Math.random() * maxY) - maxY / 3;
  button.classList.add('runaway-no');
  button.style.transform = `translate(${x}px, ${y}px) rotate(${state.noAttempts % 2 ? '-' : ''}6deg)`;
  const messages = [
    'No? Teddy is politely confused.',
    'Teddy is shaking its head gently.',
    'The No button has joined witness protection. Try the friendly button.',
    'Even teddy is disappointed, but in a very cute way.'
  ];
  elements.reaction.textContent = messages[Math.min(state.noAttempts - 1, messages.length - 1)];
}

function renderFriendship(level) {
  elements.topline.textContent = level.level;
  elements.title.textContent = `${level.title} with teddy`;
  elements.prompt.textContent = `${level.prompt} Teddy says: choose wisely.`;

  const wrap = document.createElement('div');
  wrap.className = 'friendship-row';

  const yes = makeButton('Yes, friendship accepted');
  const no = makeButton('No', 'game-choice-btn no-choice');

  yes.addEventListener('click', () => {
    playUiSound('success');
    const reaction = 'Correct answer. Your bravery has been approved by the diya committee and teddy.';
    recordAnswer(level.level, level.prompt, 'yes_friendship', reaction);
    elements.reaction.textContent = reaction;
    yes.classList.add('selected');
    no.disabled = true;
    elements.next.hidden = false;
    elements.next.textContent = 'Start the cute game';
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
      playUiSound('success');
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
      playUiSound('success');
      document.querySelectorAll('.story-card').forEach((item) => item.classList.remove('selected'));
      button.classList.add('selected');
      recordAnswer(level.level, level.prompt, card.key, card.reaction);
      elements.reaction.textContent = card.reaction;
      elements.next.hidden = false;
      elements.next.textContent = 'Mood accepted';
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

      if (card.key === 'heart') {
        locked = true;
        playUiSound('success');
        const reaction = 'Found it. Teddy is holding the heart like a trophy.';
        recordAnswer(level.level, level.prompt, 'teddy_heart_found', reaction);
        elements.reaction.textContent = reaction;
        elements.next.hidden = false;
        elements.next.textContent = 'Continue';
        elements.next.onclick = goNext;
        return;
      }

      playUiSound('wrong');
      elements.reaction.textContent = 'Not that one. Teddy hid the heart better than expected. Try again.';
      setTimeout(() => {
        button.classList.remove('revealed');
        button.textContent = '?';
      }, 650);
    });

    wrap.appendChild(button);
  });

  elements.choices.appendChild(wrap);
  elements.reaction.textContent = 'Look carefully. Teddy is being mysterious.';

  setTimeout(() => {
    hidden = true;
    locked = false;
    wrap.querySelectorAll('.memory-card').forEach((button) => {
      button.classList.remove('revealed');
      button.textContent = '?';
    });
    elements.reaction.textContent = 'Now tap where teddy heart was.';
    playUiSound('focus');
  }, 1500);
}

function renderRapid(level) {
  let questionIndex = 0;
  const selected = [];

  function drawQuestion() {
    const question = level.questions[questionIndex];
    if (!question) {
      const answer = selected.map((item) => `${item.question}: ${item.answer}`).join(' | ');
      const reaction = 'Result: dangerously cute. Teddy needs chai after all this research.';
      recordAnswer(level.level, 'Rapid fire answers', answer, reaction);
      elements.title.textContent = 'Calculated.';
      elements.prompt.textContent = 'Your personality report is loading with unnecessary seriousness...';
      elements.choices.innerHTML = '<div class="progress-line"><span style="width:100%"></span></div>';
      elements.reaction.textContent = reaction;
      elements.next.hidden = false;
      elements.next.textContent = 'Show result';
      elements.next.onclick = goNext;
      playUiSound('success');
      return;
    }

    elements.title.textContent = `Rapid fire! Question ${questionIndex + 1}/${level.questions.length}`;
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
        playUiSound('tap');
        button.classList.add('selected');
        const reaction = question.reactions[optionIndex] || 'Good choice. Teddy approves.';
        selected.push({ question: question.q, answer: option });
        elements.reaction.textContent = reaction;
        document.querySelectorAll('.rapid-fire-wrap button').forEach((item) => { item.disabled = true; });
        questionIndex += 1;
        setTimeout(drawQuestion, 1050);
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
  elements.reaction.textContent = 'One tiny diya is waiting at the end. Teddy is guarding it.';
  elements.next.hidden = false;
  elements.next.textContent = 'Reveal the diya';
  elements.next.onclick = async () => {
    playUiSound('success');
    sendAnswerSummary();
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
  gameDeck = [FRIENDSHIP_LEVEL, ...STORY_LEVELS];
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
  playUiSound('success');

  elements.lampBtn.classList.add('lit');
  elements.lampHint.classList.add('hidden');
  elements.hero.classList.add('lit-active');

  typeName();

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

// ---------- post-reveal mini choice ----------
document.querySelectorAll('.game-choice').forEach((button) => {
  button.addEventListener('click', () => {
    const result = document.getElementById('gameResult');
    const isCorrect = button.dataset.correct === 'true';
    playUiSound(isCorrect ? 'success' : 'wrong');
    document.querySelectorAll('.game-choice').forEach((item) => item.classList.remove('selected'));
    button.classList.add('selected');
    if (result) {
      result.textContent = isCorrect
        ? 'Correct. The lamp and teddy were secretly on the same team.'
        : 'Close, but teddy says the lamp is still the main character.';
    }
  });
});

// ---------- final tiny yes/no ----------
if (elements.finalYes && elements.finalNo) {
  elements.finalYes.addEventListener('click', () => {
    playUiSound('success');
    elements.finalCard.hidden = false;
    elements.finalChoiceText.textContent = 'Small diya message unlocked: May your path stay bright, peaceful, and a little funny.';
  });

  ['pointerenter', 'focus', 'click', 'touchstart'].forEach((eventName) => {
    elements.finalNo.addEventListener(eventName, (event) => {
      event.preventDefault();
      playUiSound('wrong');
      const x = Math.floor(Math.random() * 120) - 60;
      const y = Math.floor(Math.random() * 90) - 45;
      elements.finalNo.style.transform = `translate(${x}px, ${y}px)`;
      elements.finalChoiceText.textContent = 'The No button is shy. Teddy recommends Yes.';
    });
  });
}

// ---------- sound toggle ----------
elements.soundToggle.addEventListener('click', () => {
  playUiSound('tap');
  if (elements.bgAudio.paused) {
    elements.bgAudio.play().catch(() => {});
    elements.soundToggle.classList.remove('muted');
  } else {
    elements.bgAudio.pause();
    elements.soundToggle.classList.add('muted');
  }
});

// ---------- all button feedback ----------
document.addEventListener('click', (event) => {
  if (event.target.closest('button')) playUiSound('tap');
});

document.addEventListener('focusin', (event) => {
  if (event.target.closest('button')) playUiSound('focus');
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

// Shiva audio source: WhatsApp Audio 2026-08-19 at 19.32.47.mpeg in the project root.
if (elements.shivaAudio) {
  elements.shivaAudio.volume = 0.25;
  const shivaAudioObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        elements.shivaAudio.play().catch(() => {});
      } else {
        elements.shivaAudio.pause();
      }
    });
  }, { threshold: 0.35 });

  shivaAudioObserver.observe(document.getElementById('tribute'));
}

// ---------- start ----------
window.addEventListener('load', () => {
  initGame();
});

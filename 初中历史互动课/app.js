const steps = [
  { no: '01 · LOOK AT THE ROUTE', title: '从哪里出发？', coach: '先看“在哪里”，再问“为什么”。路线背后常常藏着地形、水源与人的选择。', sub: '把地图当成一个需要解释的问题，而不只是需要记忆的答案。' },
  { no: '02 · READ THE CHOICE', title: '为什么走这里？', coach: '一条路从来不是自然出现的。请用“条件”解释人们的路线选择。', sub: '历史解释不是套结论，要回到当时人面对的地形、补给和风险。' },
  { no: '03 · OPEN THE EVIDENCE', title: '路上流动着什么？', coach: '一张物品卡就是一条证据：它告诉我们，不同地区在交换彼此拥有和需要的东西。', sub: '交流不仅是“运货”，也会慢慢改变生活、技术和观念。' },
  { no: '04 · BECOME A MERCHANT', title: '用条件做决策', coach: '站在历史人物的位置想一想：带什么、走哪里、在哪里补给，都会影响一次远行。', sub: '用“条件—选择—结果”写解释，比只写结论更像历史学习。' }
];

const storageKey = 'silk-road-history-lab-v1';
const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
let current = 0;
let done = new Set();
let stops = new Set();
let cards = new Set();

function toast(message) {
  const item = $('#toast'); item.textContent = message; item.classList.add('show');
  clearTimeout(window.toastTimer); window.toastTimer = setTimeout(() => item.classList.remove('show'), 2300);
}
function renderProgress() {
  $('#progressText').textContent = `${done.size} / 4 已解锁`;
  $('#doneCount').textContent = `${done.size} / 4`;
  $$('.route').forEach((route, index) => route.classList.toggle('done', done.has(index)));
  $('#visitedStops').innerHTML = stops.size ? [...stops].map(stop => `<span>${stop}</span>`).join('') : '<span>尚未开始</span>';
}
function save() {
  localStorage.setItem(storageKey, JSON.stringify({ current, done: [...done], stops: [...stops], cards: [...cards], exit: $('#exitText').value, savedExit: $('#savedExit').textContent }));
}
function selectStep(index, shouldScroll = true) {
  current = index;
  $$('.panel').forEach((panel, item) => panel.classList.toggle('active', item === index));
  $$('.route').forEach((route, item) => route.classList.toggle('active', item === index));
  $('#stageNo').textContent = steps[index].no; $('#stageTitle').textContent = steps[index].title;
  $('#coachText').textContent = steps[index].coach; $('#coachSub').textContent = steps[index].sub;
  save(); if (shouldScroll) window.scrollTo({ top: 0, behavior: 'smooth' });
}
function answer(group, button) {
  const correct = button.dataset.value === 'right';
  group.querySelectorAll('button').forEach(item => item.classList.remove('correct', 'incorrect'));
  button.classList.add(correct ? 'correct' : 'incorrect');
  const feedback = group.dataset.question === 'terrain' ? $('#terrainFeedback') : group.dataset.question === 'merchant' ? $('#merchantFeedback') : null;
  if (feedback) { feedback.textContent = correct ? '判断有依据：路线选择要兼顾通行、补给与风险。' : '回到商旅面对的条件：地形、水源、补给和安全。'; feedback.classList.toggle('good', correct); }
  if (correct) { done.add(group.dataset.question === 'terrain' ? 1 : group.dataset.question === 'exchange' ? 2 : 3); toast('解释有依据，继续前进。'); } else toast('再看一看题目里的条件。');
  renderProgress(); save();
}
function flip(card) {
  card.classList.toggle('flipped'); cards.add(card.dataset.card);
  if (cards.size >= 3) done.add(2);
  renderProgress(); save(); toast(`${card.querySelector('.front b').textContent}：一条交流证据已记录。`);
}
function load() {
  try {
    const state = JSON.parse(localStorage.getItem(storageKey)); if (!state) return;
    current = Number.isInteger(state.current) ? state.current : 0; done = new Set(state.done || []); stops = new Set(state.stops || []); cards = new Set(state.cards || []);
    $('#exitText').value = state.exit || ''; $('#savedExit').textContent = state.savedExit || '完成任务后，这里会保存你的答案。';
    const stopOrder = ['长安', '河西走廊', '西域'];
    $$('.map-stop').forEach(button => { if (stops.has(stopOrder[['changan','hexi','xiyu'].indexOf(button.dataset.stop)])) button.classList.add('active'); });
    cards.forEach(card => $(`.evidence-card[data-card="${card}"]`)?.classList.add('flipped'));
  } catch { localStorage.removeItem(storageKey); }
}
function exportNotes() {
  const text = ['行走的丝路｜初中历史互动课', '', `路标：${stops.size ? [...stops].join(' → ') : '尚未完成'}`, `证据：${cards.size ? [...cards].join('、') : '尚未翻开'}`, `我的历史解释：${$('#savedExit').textContent}`, '', '本课一句话：丝路是一张由地形、需求与交流共同织成的网络。'].join('\n');
  const link = document.createElement('a'); link.href = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' })); link.download = '丝绸之路学习笔记.txt'; link.click(); URL.revokeObjectURL(link.href); toast('学习笔记已导出。');
}

$$('.route').forEach((button, index) => button.addEventListener('click', () => selectStep(index)));
$$('.map-stop').forEach(button => button.addEventListener('click', () => {
  const order = ['changan', 'hexi', 'xiyu']; const labels = { changan: '长安', hexi: '河西走廊', xiyu: '西域' };
  const expected = order[stops.size];
  if (button.dataset.stop !== expected) { $('#mapFeedback').textContent = `请按东到西的顺序：下一站应是“${labels[expected] || '完成'}”。`; toast('顺着路线从东往西走。'); return; }
  button.classList.add('active'); stops.add(labels[button.dataset.stop]);
  $('#mapFeedback').textContent = stops.size === 3 ? '路线拼好了：从长安出发，经河西走廊进入西域，继续连接更远地区。' : `已到达${labels[button.dataset.stop]}，继续向西。`;
  $('#mapFeedback').classList.toggle('good', stops.size === 3);
  if (stops.size === 3) { done.add(0); toast('路线已点亮。'); }
  renderProgress(); save();
}));
$$('[data-question]').forEach(group => group.querySelectorAll('button').forEach(button => button.addEventListener('click', () => answer(group, button))));
$$('.evidence-card').forEach(card => card.addEventListener('click', () => flip(card)));
$('#exitText').addEventListener('input', () => { $('#countText').textContent = `${$('#exitText').value.length} / 100`; save(); });
$('#saveExit').addEventListener('click', () => {
  const text = $('#exitText').value.trim();
  if (text.length < 8) { $('#exitFeedback').textContent = '请至少写出一组“条件”和一次“交流”。'; return; }
  $('#savedExit').textContent = text; $('#exitFeedback').textContent = '已保存。你正在用条件解释历史。'; $('#exitFeedback').classList.add('good'); done.add(3); renderProgress(); save(); toast('历史解释已保存。');
});
$('#reset').addEventListener('click', () => { if (current === 0) { stops.clear(); $$('.map-stop').forEach(button => button.classList.remove('active')); $('#mapFeedback').textContent = '先从“长安”开始。'; done.delete(0); } if (current === 2) { cards.clear(); $$('.evidence-card').forEach(card => card.classList.remove('flipped')); done.delete(2); } if (current === 3) { $('#exitText').value = ''; $('#savedExit').textContent = '完成任务后，这里会保存你的答案。'; $('#countText').textContent = '0 / 100'; done.delete(3); } renderProgress(); save(); toast('本步骤已重置。'); });
$('#exportNotes').addEventListener('click', exportNotes);
load(); renderProgress(); $('#countText').textContent = `${$('#exitText').value.length} / 100`; selectStep(current, false);

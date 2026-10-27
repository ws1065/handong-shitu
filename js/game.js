/* =========================================================
   汉东仕途 · 游戏逻辑
   ========================================================= */
(function () {
  'use strict';

  /* ---------------- 基础工具 ---------------- */
  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.prototype.slice.call((root || document).querySelectorAll(sel));
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const clone = (o) => JSON.parse(JSON.stringify(o));
  const esc = (str) => String(str == null ? '' : str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

  const CN_DIGITS = ['〇', '一', '二', '三', '四', '五', '六', '七', '八', '九'];
  const CN_SEASONS = ['冬', '秋', '夏', '春'];

  function cnYear(year) {
    return String(year).split('').map((d) => CN_DIGITS[Number(d)] || d).join('');
  }
  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
  function weightedPick(arr) {
    const total = arr.reduce((sum, item) => sum + (item.weight || 1), 0);
    let roll = Math.random() * total;
    for (let i = 0; i < arr.length; i++) {
      roll -= (arr[i].weight || 1);
      if (roll <= 0) return arr[i];
    }
    return arr[arr.length - 1];
  }
  function pickOne(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function signed(n) { return (n > 0 ? '+' : '') + n; }

  const FACTION_LABEL = { 沙: '沙瑞金', 李: '李达康', 高: '高育良', 中立: '未站队' };
  const FACTION_DESC = {
    沙: '改革派 · 清廉实干',
    李: '发展派 · 政绩优先',
    高: '政法系 · 师生故旧',
    中立: '不站队 · 独善其身'
  };
  const TABS = [
    { id: 'career', icon: '仕', label: '仕途' },
    { id: 'affairs', icon: '风', label: '风云' },
    { id: 'relations', icon: '缘', label: '关系' },
    { id: 'family', icon: '家', label: '家庭' },
    { id: 'archive', icon: '档', label: '档案' }
  ];

  const GRADE_STYLE = {
    '优秀': { color: '#ad8750', line: '考察组在你的名字后面画了一个圈。这一年吃的苦，总算有人看见。' },
    '称职': { color: '#4e6b4a', line: '不好不坏，中规中矩。你的名字安静地躺在名册中间。' },
    '基本称职': { color: '#9c6b3a', line: '考察组找你谈了话。措辞很客气，意思却很清楚。' },
    '不称职': { color: '#8d2f27', line: '通报下来那天，办公室格外安静。你听见有人轻轻叹了口气。' }
  };

  const SCENE_WINDS = [
    { id: '廉政', label: '今年省里抓作风，守正之举更容易被看见。', stances: ['守正'], fx: { stats: { 廉政: 2 }, risk: -1 } },
    { id: '政绩', label: '今年考核看项目，实干的人更容易出成绩。', stances: ['实干'], fx: { stats: { 政绩: 2 } } },
    { id: '口碑', label: '今年群众测评权重上升，民意更能加分。', stances: ['群众'], fx: { stats: { 口碑: 2 } } },
    { id: '关系', label: '今年人事调整频繁，人脉比平时更值钱。', stances: ['逢迎', '权谋'], fx: { stats: { 人脉: 1 } } }
  ];

  const SYNERGY_STAT = { 守正: '廉政', 实干: '政绩', 逢迎: '人脉', 权谋: '人脉', 群众: '口碑', 抽身: '健康' };

  const ECHO_BY_STANCE = {
    守正: '你的清名已经传开，有人愿意把材料交到你手里，也有人开始防着你。',
    实干: '你办成过几件硬事，领导用你时放心，同事跟着你却觉得累。',
    逢迎: '你被归进了“自己人”的圈子，路好走了，退路也窄了。',
    权谋: '你手里的牌越来越多，知道你有牌的人也越来越多。',
    群众: '基层开始有人点名找你，机关里也有人说你“爱出风头”。',
    抽身: '你几次都恰好不在风口上，有人说你稳，也有人说你滑。'
  };

  const PATH_ENDING_LINES = {
    守正: '很多年后，人们记不住你签过的字，却记得你没有签的那些字。',
    实干: '你留下的路、桥和项目还在，名字却慢慢被新的路牌盖住了。',
    逢迎: '你学会了对谁笑、对谁沉默，最后连自己都分不清哪张脸是真的。',
    权谋: '你算准了很多事，唯独没算到，绳子另一头始终握在别人手里。',
    群众: '你走的时候，单位没有组织送行，倒是几个老上访户在门口站了很久。',
    抽身: '你全身而退，像一片没有落进棋盘的叶子。'
  };

  let state = null;
  let activeTab = 'career';
  let selectedOrigin = 'xuandiao';
  let busy = false;
  let starting = false;

  /* ---------------- 状态 ---------------- */
  function createState(name, originId) {
    const origin = ORIGINS.find((o) => o.id === originId) || ORIGINS[0];
    const stats = { 政绩: 50, 口碑: 50, 廉政: 50, 人脉: 50, 能力: 50, 健康: 72, 亲情: 62 };
    Object.keys(origin.stats).forEach((k) => {
      stats[k] = clamp((stats[k] || 0) + origin.stats[k], 0, 100);
    });
    const relations = {};
    CHARACTERS.forEach((c) => {
      relations[c.id] = { met: !!c.met, rel: c.initialRel || 0 };
    });
    return {
      version: 2,
      year: START_YEAR,
      turn: 1,
      ap: 3,
      player: {
        name: name,
        origin: origin.id,
        age: START_AGE,
        rank: 0,
        points: 0,
        yearsInRank: 0,
        place: origin.start.place,
        dept: origin.start.dept,
        position: origin.start.position,
        system: origin.start.system,
        stats: stats,
        risk: 0,
        allegiance: '中立',
        loyalty: 0,
        patron: null,
        patronName: '',
        patronRel: 0,
        marriage: null,
        children: [],
        lastGrade: '',
        consecutiveExcellent: 0,
        poorAssessments: 0,
        achievements: []
      },
      relations: relations,
      usedActions: {},
      firedEvents: [],
      flags: {},
      log: [],
      yearStartStats: clone(stats),
      profile: emptyProfile(),
      methods: emptyMethods(),
      sceneDeck: buildSceneDeck(),
      sceneHistory: [],
      ended: false
    };
  }

  function emptyProfile() {
    const out = {};
    STANCES.forEach((st) => { out[st.id] = 0; });
    return out;
  }

  function emptyMethods() {
    const out = {};
    METHODS.forEach((m) => { out[m.id] = 0; });
    return out;
  }

  function syncPatron(s) {
    const p = s.player;
    if (p.patron && s.relations[p.patron]) {
      p.patronRel = s.relations[p.patron].rel;
      const c = CHARACTERS.find((x) => x.id === p.patron);
      p.patronName = c ? c.name : p.patron;
    } else {
      p.patronRel = 0;
      p.patronName = '';
    }
  }

  function protectionOf(s) {
    const p = s.player;
    if (!p.patron || p.allegiance === '中立' || p.loyalty < 20) return 0;
    const rel = s.relations[p.patron] ? s.relations[p.patron].rel : 0;
    return Math.min(28, Math.floor(rel / 6 + p.loyalty / 4));
  }

  function eventCtx(s) {
    const p = s.player;
    return Object.assign({}, s, {
      player: Object.assign({}, p, {
        patronRel: p.patron && s.relations[p.patron] ? s.relations[p.patron].rel : 0,
        patronName: p.patronName || (p.patron ? p.patron : '领导')
      })
    });
  }

  /* ---------------- 场景牌组 ---------------- */
  function readSeenScenes() {
    try {
      const arr = JSON.parse(localStorage.getItem(SEEN_KEY) || '[]');
      return Array.isArray(arr) ? arr.filter((x) => typeof x === 'string') : [];
    } catch (e) {
      return [];
    }
  }

  function writeSeenScenes(ids) {
    try { localStorage.setItem(SEEN_KEY, JSON.stringify(ids)); } catch (e) { /* ignore */ }
  }

  function readLastDeck() {
    try {
      const arr = JSON.parse(localStorage.getItem(LAST_DECK_KEY) || '[]');
      return Array.isArray(arr) ? arr.filter((x) => typeof x === 'string') : [];
    } catch (e) {
      return [];
    }
  }

  function writeLastDeck(ids) {
    try { localStorage.setItem(LAST_DECK_KEY, JSON.stringify(ids)); } catch (e) { /* ignore */ }
  }

  function buildSceneDeck() {
    const deck = [];
    const seen = new Set(readSeenScenes());
    const lastDeck = new Set(readLastDeck());
    SCENE_ERAS.forEach((era) => {
      const all = SCENES.filter((s) => s.era === era.id);
      let fresh = shuffle(all.filter((s) => !seen.has(s.id)));
      if (fresh.length < era.count) {
        all.forEach((s) => seen.delete(s.id));
        fresh = shuffle(all.filter((s) => !lastDeck.has(s.id)));
        if (fresh.length < era.count) fresh = shuffle(all);
      }
      const pool = fresh.slice(0, era.count);
      const years = shuffle(era.years.slice()).slice(0, era.count);
      if (era.anchor && years.indexOf(era.anchor) < 0) years[0] = era.anchor;
      pool.forEach((scene, i) => {
        deck.push({ year: years[i], sceneId: scene.id, era: era.id });
      });
    });
    deck.sort((a, b) => a.year - b.year);
    deck.forEach((d) => seen.add(d.sceneId));
    writeSeenScenes(Array.from(seen));
    writeLastDeck(deck.map((d) => d.sceneId));
    return deck;
  }

  function sceneById(id) {
    return SCENES.find((s) => s.id === id) || null;
  }

  function pendingScene(s) {
    if (!s.sceneDeck) return null;
    const entry = s.sceneDeck.find((d) => d.year === s.year);
    if (!entry) return null;
    if (s.firedEvents.includes('scene:' + entry.sceneId)) return null;
    return sceneById(entry.sceneId);
  }

  function topStance(profile) {
    if (!profile) return null;
    let best = null;
    STANCES.forEach((st) => {
      const n = profile[st.id] || 0;
      if (n > 0 && (!best || n > (profile[best.id] || 0))) best = st;
    });
    return best;
  }

  function sceneEcho(s) {
    const history = s.sceneHistory || [];
    const last = history[history.length - 1];
    const top = topStance(s.profile);
    const parts = [];
    if (last) {
      parts.push('上一次，你选择了“' + last.branch + '”。这件事之后，机关里对你的看法又清楚了一分。');
    }
    if (top && history.length >= 2) {
      parts.push(ECHO_BY_STANCE[top.id]);
    }
    return parts.join('');
  }

  function effectInline(fx) {
    const stats = Object.keys(fx.stats || {})
      .filter((k) => fx.stats[k])
      .sort((a, b) => Math.abs(fx.stats[b]) - Math.abs(fx.stats[a]))
      .slice(0, 3)
      .map((k) => k + signed(fx.stats[k]));
    if (fx.risk) stats.push('风险' + signed(fx.risk));
    if (fx.loyalty) stats.push('忠诚' + signed(fx.loyalty));
    if (fx.align) stats.push('站队' + FACTION_LABEL[fx.align]);
    return stats.join(' ') || '影响轻微';
  }

  function buildSceneOptions(scene, s) {
    const wind = pickOne(SCENE_WINDS);
    const profile = s.profile || {};
    const options = [];
    STANCES.forEach((st) => {
      METHODS.forEach((m) => {
        const hook = scene.hooks[st.id];
        if (!hook) return;
        const fx = { stats: {}, risk: 0, loyalty: 0 };
        const add = (src) => {
          if (!src) return;
          Object.keys(src).forEach((k) => {
            fx.stats[k] = (fx.stats[k] || 0) + src[k];
          });
        };
        add(st.stats);
        add(m.stats);
        if (scene.fx) {
          add(scene.fx.stats);
          fx.risk += scene.fx.risk || 0;
        }
        fx.risk += (st.risk || 0) + (m.risk || 0);
        fx.loyalty += (st.loyalty || 0) + (m.loyalty || 0);

        const windHit = wind.stances.indexOf(st.id) >= 0;
        if (windHit) {
          add(wind.fx.stats);
          fx.risk += wind.fx.risk || 0;
        }

        const prior = profile[st.id] || 0;
        const synergy = prior >= 3;
        if (synergy) {
          const key = SYNERGY_STAT[st.id];
          fx.stats[key] = (fx.stats[key] || 0) + 1;
          fx.risk -= 1;
        }

        let align = null;
        if (st.id === '逢迎' && m.id === '请示') align = scene.patron;
        else if ((st.id === '守正' || st.id === '群众') && m.id === '公开') align = scene.reformer || '沙';
        else if (st.id === '权谋' && m.id === '借力') align = scene.rival;
        if (align) fx.align = align;

        options.push({
          stance: st.id,
          method: m.id,
          path: st.path,
          color: st.color,
          branch: st.path + ' · ' + m.short,
          text: hook.label + ' · ' + m.name,
          hint: st.path + ' · ' + m.name + '｜' + effectInline(fx) + (synergy ? '｜熟练' : ''),
          result: hook.result + m.result + st.future,
          fx: fx,
          windHit: windHit,
          synergy: synergy,
          synergyFrom: prior
        });
      });
    });
    return { options: shuffle(options), wind: wind };
  }

  function pickSceneOptions(pool, count) {
    const byStance = {};
    pool.forEach((o) => {
      if (!byStance[o.stance]) byStance[o.stance] = [];
      byStance[o.stance].push(o);
    });
    const stances = shuffle(Object.keys(byStance)).slice(0, count);
    return stances.map((id) => pickOne(byStance[id]));
  }

  async function runScene(scene) {
    if (state.ended) return;
    const firedId = 'scene:' + scene.id;
    const built = buildSceneOptions(scene, state);
    const options = pickSceneOptions(built.options, 3);
    const echo = sceneEcho(state);

    const rows = options.map((o, i) =>
      '<button class="choice-btn" type="button" data-choice="' + i + '">' +
        '<span><span class="choice-btn__text">' + esc(o.text) + '</span>' +
        '<span class="choice-btn__hint" style="display:block">' + esc(o.hint) + '</span></span>' +
        '<span class="choice-btn__arrow">›</span>' +
      '</button>'
    ).join('');

    const custom =
      '<div class="modal__kicker">' + cnYear(state.year) + '年 · ' + scene.cat + (scene.crossroad ? ' · 十字路口' : '') + '</div>' +
      '<div class="modal__title">' + scene.title + '</div>' +
      '<div class="modal__body">' +
        '<p>' + scene.text + '</p>' +
        (echo ? '<p class="scene-echo">' + echo + '</p>' : '') +
        '<div class="scene-wind">本年风向：' + built.wind.label + '</div>' +
        '<div class="scene-count">每次只出现三条路，换一局，场景和选项都会不同</div>' +
      '</div>' +
      (scene.quote ? '<div class="modal__quote">“' + scene.quote + '”</div>' : '') +
      '<div class="modal__choices">' + rows + '</div>';

    const idx = await showModal({ custom: custom, wide: true });
    const choice = options[Number(idx)] || options[0];
    if (!state.firedEvents.includes(firedId)) state.firedEvents.push(firedId);

    const res = applyFx(state, choice.fx);
    state.profile[choice.stance] = (state.profile[choice.stance] || 0) + 1;
    state.methods[choice.method] = (state.methods[choice.method] || 0) + 1;
    state.sceneHistory.push({
      year: state.year,
      sceneId: scene.id,
      title: scene.title,
      stance: choice.stance,
      method: choice.method,
      path: choice.path,
      branch: choice.branch
    });
    state.flags.lastStance = choice.stance;
    state.flags.lastMethod = choice.method;
    if (state.profile[choice.stance] === 5) achieve(state, '底色·' + choice.path);

    addLog(state, {
      type: 'scene',
      title: scene.title,
      text: '你选择了“' + choice.branch + '”。' + choice.result
    });
    syncPatron(state);

    const notesHtml = res.notes.map((n) => '<p class="muted small">' + n + '</p>').join('');
    const windNote = choice.windHit ? '<p class="muted small">顺风：' + built.wind.label + '</p>' : '';
    const synergyNote = choice.synergy
      ? '<p class="muted small">底色加成：你在这条路上已经走过 ' + choice.synergyFrom + ' 次，办起来更顺手。</p>'
      : '';
    const shift =
      '<div class="path-shift">' +
        '<span class="path-badge" style="--c:' + choice.color + '">' + choice.path + '</span>' +
        '<span>底色 +1 · 手段：' + choice.method + '</span>' +
        (choice.synergy ? '<span class="path-shift__tag">熟练</span>' : '') +
      '</div>';

    await showModal({
      kicker: '选择结果 · ' + choice.path,
      title: scene.title,
      body: '<p>' + choice.result + '</p>' + windNote + synergyNote + notesHtml + shift + renderChips(res.chips),
      choices: [{ text: '继续' }],
      wide: true
    });

    renderAll();
    saveGame(true);

    if (res.ending) {
      triggerEnding(res.ending);
      return;
    }
    if (state.player.stats.健康 <= 0) triggerEnding('sick');
  }

  function addLog(s, entry) {
    s.log.push(Object.assign({ year: s.year }, entry));
    if (s.log.length > 240) s.log = s.log.slice(-200);
  }

  function achieve(s, text) {
    if (!s.player.achievements.includes(text)) s.player.achievements.push(text);
  }

  /* ---------------- 数值结算 ---------------- */
  function applyAlign(s, align) {
    const p = s.player;
    if (!align) return '';
    if (align === '中立') {
      if (p.allegiance === '中立') return '';
      p.allegiance = '中立';
      p.patron = null;
      p.patronName = '';
      p.patronRel = 0;
      return '你退出了原来的派系。从此以后，没有人再为你遮风挡雨。';
    }
    const was = p.allegiance;
    let msg = '';
    if (was !== '中立' && was !== align) {
      p.risk = clamp(p.risk + 8, 0, 100);
      p.loyalty = 20;
      msg = '你改换门庭，转投' + FACTION_LABEL[align] + '一系。旧主不会忘记，新主也未必全信——风险 +8，忠诚从头算起。';
    } else if (was === '中立') {
      p.loyalty = 0;
      msg = '你正式站到了' + FACTION_LABEL[align] + '一边。从此有了靠山，也有了软肋。';
    }
    p.allegiance = align;
    const leader = CHARACTERS.find((c) => c.faction === align);
    if (leader) {
      p.patron = leader.id;
      p.patronName = leader.name;
      if (s.relations[leader.id]) {
        s.relations[leader.id].met = true;
        s.relations[leader.id].rel = clamp(s.relations[leader.id].rel + 2, 0, 100);
      }
    }
    syncPatron(s);
    return msg;
  }

  function applyFx(s, fx, opts) {
    const chips = [];
    const notes = [];
    if (!fx) return { chips: chips, notes: notes, ending: null };
    if (fx.stats) {
      Object.keys(fx.stats).forEach((k) => {
        const v = fx.stats[k];
        if (!v) return;
        s.player.stats[k] = clamp((s.player.stats[k] || 0) + v, 0, 100);
        chips.push({ label: k, val: v });
      });
    }
    if (fx.risk) {
      s.player.risk = clamp(s.player.risk + fx.risk, 0, 100);
      chips.push({ label: '风险', val: fx.risk });
    }
    if (fx.points) {
      s.player.points += fx.points;
      chips.push({ label: '考核积分', val: fx.points });
    }
    if (fx.rel) {
      Object.keys(fx.rel).forEach((id) => {
        const v = fx.rel[id];
        if (!s.relations[id]) return;
        s.relations[id].met = true;
        s.relations[id].rel = clamp(s.relations[id].rel + v, 0, 100);
        chips.push({ label: id + ' 关系', val: v });
      });
    }
    if (fx.meet) {
      fx.meet.forEach((id) => {
        if (!s.relations[id]) return;
        if (!s.relations[id].met) {
          notes.push('你结识了' + id + '。');
          achieve(s, '结识' + id);
        }
        s.relations[id].met = true;
      });
    }
    if (fx.align) {
      const msg = applyAlign(s, fx.align);
      if (msg) notes.push(msg);
    }
    if (fx.loyalty) {
      s.player.loyalty = clamp(s.player.loyalty + fx.loyalty, 0, 100);
      chips.push({ label: '忠诚', val: fx.loyalty });
    }
    if (fx.flags) Object.assign(s.flags, fx.flags);
    if (fx.factionVisit) {
      let target = s.player.patron;
      if (!target || !s.relations[target] || !s.relations[target].met) {
        const leaders = ['沙瑞金', '李达康', '高育良']
          .filter((n) => s.relations[n] && s.relations[n].met)
          .sort((a, b) => s.relations[b].rel - s.relations[a].rel);
        target = leaders[0] || '李达康';
      }
      if (s.relations[target]) {
        s.relations[target].met = true;
        s.relations[target].rel = clamp(s.relations[target].rel + 5, 0, 100);
        chips.push({ label: target + ' 关系', val: 5 });
        notes.push('你向' + target + '汇报了思想。有些话没有说透，但对方听懂了。');
      }
      if (s.player.allegiance !== '中立') {
        s.player.loyalty = clamp(s.player.loyalty + 2, 0, 100);
        chips.push({ label: '忠诚', val: 2 });
      }
    }
    syncPatron(s);
    return { chips: chips, notes: notes, ending: fx.ending || null };
  }

  function renderChips(chips) {
    if (!chips || !chips.length) return '';
    return '<div class="delta-chips">' + chips.map((c) => {
      const cls = c.val < 0 ? 'delta--neg' : '';
      return '<span class="delta ' + cls + '">' + esc(c.label) + ' ' + signed(c.val) + '</span>';
    }).join('') + '</div>';
  }

  /* ---------------- 弹窗 ---------------- */
  function showModal(opts) {
    return new Promise((resolve) => {
      const o = opts || {};
      const root = $('#modal-root');
      let inner;
      if (o.custom) {
        inner = o.custom;
      } else {
        const choices = o.choices || null;
        inner =
          (o.kicker ? '<div class="modal__kicker">' + o.kicker + '</div>' : '') +
          (o.title ? '<div class="modal__title">' + o.title + '</div>' : '') +
          (o.body ? '<div class="modal__body">' + o.body + '</div>' : '') +
          (o.quote ? '<div class="modal__quote">' + o.quote + '</div>' : '') +
          (choices ? '<div class="modal__choices">' + choices.map((c, i) =>
            '<button class="choice-btn" type="button" data-choice="' + i + '">' +
              '<span><span class="choice-btn__text">' + c.text + '</span>' +
              (c.hint ? '<span class="choice-btn__hint" style="display:block">' + c.hint + '</span>' : '') +
              '</span><span class="choice-btn__arrow">›</span>' +
            '</button>').join('') + '</div>' : '') +
          (o.footer ? '<div class="modal__footer">' + o.footer + '</div>' : '');
      }
      root.innerHTML =
        '<div class="modal-backdrop"></div>' +
        '<div class="modal-wrap"><div class="modal ' + (o.wide ? 'modal--wide ' : '') + (o.scene ? 'modal--scene ' : '') + (o.notice ? 'modal--notice' : '') + '">' +
        inner + '</div></div>';
      root.classList.add('is-open');
      const close = (value) => {
        root.classList.remove('is-open');
        root.innerHTML = '';
        resolve(value);
      };
      $$('[data-choice]', root).forEach((btn) => {
        btn.addEventListener('click', () => close(btn.getAttribute('data-choice')));
      });
      $$('[data-close]', root).forEach((btn) => {
        btn.addEventListener('click', () => close(btn.getAttribute('data-close') || '0'));
      });
      const modal = $('.modal', root);
      if (modal) modal.scrollTop = 0;
    });
  }

  function showInfo(opts) {
    return showModal({
      kicker: opts.kicker,
      title: opts.title,
      body: opts.body,
      quote: opts.quote,
      wide: opts.wide,
      choices: [{ text: opts.button || '继续' }]
    });
  }

  /* ---------------- 开始页 ---------------- */
  function renderOrigins() {
    const grid = $('#origin-grid');
    if (!grid) return;
    grid.innerHTML = ORIGINS.map((o) => {
      return '<button class="origin-card ' + (o.id === selectedOrigin ? 'is-selected' : '') + '" type="button" data-origin="' + o.id + '">' +
        '<span class="origin-card__badge">' + o.badge + '</span>' +
        '<span class="origin-card__name">' + o.name + '</span>' +
        '<span class="origin-card__tag">' + o.tag + '</span>' +
        '<span class="origin-card__desc">' + o.desc + '</span>' +
        '<span class="origin-card__perk">专长：' + o.perk + '</span>' +
      '</button>';
    }).join('');
  }

  function hasSave() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return false;
      const data = JSON.parse(raw);
      return !!(data && data.player && data.version === 2 && !data.ended);
    } catch (e) {
      return false;
    }
  }

  function saveGame(silent) {
    if (!state || state.ended) return;
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(state));
      if (!silent) toast('仕途档案已存入本机');
    } catch (e) {
      if (!silent) toast('存档失败：浏览器存储空间不足');
    }
  }

  function loadGame() {
    try {
      const data = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null');
      if (!data || !data.player || data.version !== 2 || data.ended) {
        toast('没有可读取的存档');
        return false;
      }
      state = data;
      if (!Array.isArray(state.sceneDeck) || !state.sceneDeck.length) state.sceneDeck = buildSceneDeck();
      if (!state.profile || typeof state.profile !== 'object') state.profile = emptyProfile();
      if (!state.methods || typeof state.methods !== 'object') state.methods = emptyMethods();
      if (!Array.isArray(state.sceneHistory)) state.sceneHistory = [];
      syncPatron(state);
      $('#start-screen').classList.add('hidden');
      $('#ending-screen').classList.add('hidden');
      $('#game-screen').classList.remove('hidden');
      activeTab = 'career';
      renderAll();
      window.scrollTo(0, 0);
      toast('已回到' + cnYear(state.year) + '年');
      if (!state.flags.yearEventsDone) startYearEvents();
      return true;
    } catch (e) {
      toast('存档读取失败');
      return false;
    }
  }

  async function startNewGame(name, originId) {
    state = createState(name, originId);
    $('#start-screen').classList.add('hidden');
    $('#ending-screen').classList.add('hidden');
    $('#game-screen').classList.remove('hidden');
    activeTab = 'career';
    window.scrollTo(0, 0);
    addLog(state, { type: 'start', title: '踏入仕途', text: '你进入' + state.player.dept + '，成为一名' + state.player.position + '。' });
    renderAll();
    saveGame(true);
    await beginYear(true);
  }

  /* ---------------- 年度循环 ---------------- */
  async function beginYear(isFirst) {
    state.ap = 3;
    state.usedActions = {};
    state.yearStartStats = clone(state.player.stats);
    state.flags.visitedPatron = false;
    state.flags.loveTriedThisYear = false;
    state.flags.yearEventsDone = false;
    syncPatron(state);
    renderAll();
    saveGame(true);
    if (!isFirst) {
      const seasonText = cnYear(state.year) + '年';
      addLog(state, { type: 'year', title: seasonText, text: '新的一年开始了。' });
    }
    await startYearEvents();
  }

  function safeCond(ev, ctx) {
    try {
      return !ev.cond || ev.cond(ctx);
    } catch (err) {
      console.warn('事件条件计算失败：' + ev.id, err);
      return false;
    }
  }

  function collectYearEvents() {
    const ctx = eventCtx(state);
    const fired = state.firedEvents;
    const out = [];
    const scene = pendingScene(state);
    if (scene) out.push({ kind: 'scene', scene: scene });

    const abandon = LOYALTY_EVENTS.find((e) => e.id === 'abandoned');
    if (abandon && !fired.includes(abandon.id) && safeCond(abandon, ctx)) {
      out.push(abandon);
      return out;
    }

    if (state.year > START_YEAR && out.length < 2) {
      const randomChance = scene ? 0.55 : 0.72;
      const pool = RANDOM_EVENTS.filter((e) =>
        safeCond(e, ctx) && !fired.includes(e.id)
      );
      if (pool.length && Math.random() < randomChance) {
        out.push(weightedPick(pool));
      }
      const loyaltyPool = LOYALTY_EVENTS.filter((e) =>
        e.id !== 'abandoned' && safeCond(e, ctx) && !fired.includes(e.id)
      );
      if (loyaltyPool.length && out.length < 2 && Math.random() < 0.45) {
        out.push(weightedPick(loyaltyPool));
      }
    }
    return out;
  }

  async function startYearEvents() {
    const events = collectYearEvents();
    for (let i = 0; i < events.length; i++) {
      const item = events[i];
      try {
        if (item.kind === 'scene') await runScene(item.scene);
        else await runEvent(item);
      } catch (err) {
        console.error('事件执行出错：' + (item.scene ? item.scene.id : item.id), err);
        toast('这段往事有些模糊，先跳过吧');
      }
      if (state.ended) return;
    }
    state.flags.yearEventsDone = true;
    renderAll();
    saveGame(true);
  }

  async function runEvent(ev) {
    if (state.ended) return;
    const ctx = eventCtx(state);
    if (ev.cond && !ev.cond(ctx)) return;
    const text = typeof ev.text === 'function' ? ev.text(ctx) : ev.text;
    if (!state.firedEvents.includes(ev.id)) state.firedEvents.push(ev.id);

    const idx = await showModal({
      kicker: cnYear(state.year) + '年 · ' + ev.cat + (ev.crossroad ? ' · 十字路口' : ''),
      title: ev.title,
      body: '<p>' + text + '</p>',
      quote: ev.quote ? '“' + ev.quote + '”' : '',
      choices: ev.choices.map((c) => ({ text: c.text, hint: c.hint })),
      wide: true
    });
    const choice = ev.choices[Number(idx)] || ev.choices[0];
    const res = applyFx(state, choice.fx || {});
    addLog(state, { type: 'event', title: ev.title, text: choice.result || '' });
    syncPatron(state);

    const notesHtml = res.notes.map((n) => '<p class="muted small">' + n + '</p>').join('');
    await showModal({
      kicker: '事件结果',
      title: ev.title,
      body: '<p>' + (choice.result || '') + '</p>' + notesHtml + renderChips(res.chips),
      choices: [{ text: '继续' }],
      wide: true
    });

    renderAll();
    saveGame(true);

    if (res.ending) {
      triggerEnding(res.ending);
      return;
    }
    if (state.player.stats.健康 <= 0) {
      triggerEnding('sick');
    }
  }

  /* ---------------- 年度考核 ---------------- */
  function computeScore() {
    const st = state.player.stats;
    const base =
      st.政绩 * 0.30 + st.口碑 * 0.18 + st.廉政 * 0.18 +
      st.能力 * 0.14 + st.人脉 * 0.10 + st.健康 * 0.05 + st.亲情 * 0.05;
    const loyaltyBonus = state.player.allegiance !== '中立' ? Math.min(6, state.player.loyalty * 0.06) : 0;
    const patronBonus = state.player.patronRel >= 30 ? 2 : 0;
    const noise = rand(-4, 4);
    return clamp(Math.round(base + loyaltyBonus + patronBonus + noise), 0, 100);
  }

  function annualAssessment() {
    const score = computeScore();
    const threshold = RANKS[state.player.rank].threshold;
    let grade, pts;
    if (score >= threshold + 10) { grade = '优秀'; pts = 4; }
    else if (score >= threshold - 2) { grade = '称职'; pts = 2; }
    else if (score >= threshold - 12) { grade = '基本称职'; pts = 1; }
    else { grade = '不称职'; pts = 0; }

    const p = state.player;
    p.points += pts;
    p.lastGrade = grade;
    if (grade === '优秀') {
      p.consecutiveExcellent++;
      p.stats.口碑 = clamp(p.stats.口碑 + 2, 0, 100);
      p.stats.政绩 = clamp(p.stats.政绩 + 2, 0, 100);
      p.poorAssessments = 0;
      if (p.consecutiveExcellent === 3) achieve(state, '三年优秀');
      if (p.consecutiveExcellent === 6) achieve(state, '六连优秀');
    } else {
      p.consecutiveExcellent = 0;
      if (grade === '基本称职') {
        p.risk = clamp(p.risk + 1, 0, 100);
        p.poorAssessments = 0;
      } else if (grade === '不称职') {
        p.stats.口碑 = clamp(p.stats.口碑 - 3, 0, 100);
        p.risk = clamp(p.risk + 3, 0, 100);
        p.poorAssessments++;
      } else {
        p.poorAssessments = 0;
      }
    }
    addLog(state, { type: 'grade', title: '年度考核：' + grade, text: '综合得分 ' + score + '，考核积分 +' + pts + '。' });

    return { score: score, grade: grade, pts: pts, threshold: threshold };
  }

  async function showAssessment(result) {
    const diffRows = Object.keys(state.player.stats).map((k) => {
      const before = state.yearStartStats[k] || 0;
      const now = state.player.stats[k];
      const d = now - before;
      if (!d) return '';
      return '<div class="year-stat-row"><span>' + k + '</span><span><b>' + now + '</b> <span class="' + (d > 0 ? 'up' : 'down') + '">' + signed(d) + '</span></span></div>';
    }).filter(Boolean).join('');
    const style = GRADE_STYLE[result.grade] || GRADE_STYLE['称职'];
    const p = state.player;
    let patronLine = '你尚未明确站队。没有人庇护，所有风险都要自己扛。';
    if (p.allegiance !== '中立') {
      const prot = protectionOf(state);
      patronLine = '派系：' + FACTION_LABEL[p.allegiance] + ' · 忠诚 ' + p.loyalty + ' · 庇护 ' + prot +
        (p.loyalty < 25 ? '（忠诚不足，靠山已不再为你说话）' : '');
    }
    const body =
      '<div class="year-summary">' +
        '<div class="year-summary__year">' + cnYear(state.year) + '年 · 年度考核</div>' +
        '<div class="year-summary__grade" style="--grade-color:' + style.color + '">' + result.grade + '</div>' +
        '<div class="year-summary__score">综合得分 ' + result.score + ' · 考核积分 +' + result.pts + '（累计 ' + p.points + '）</div>' +
        '<div class="year-summary__text">' + style.line + '</div>' +
        (diffRows ? '<div class="year-stat-list">' + diffRows + '</div>' : '') +
        '<div class="year-promo-note">' + patronLine + '</div>' +
      '</div>';
    await showModal({ kicker: '岁末', title: '年度考核', body: body, choices: [{ text: '继续' }] });
  }

  function annualRiskCheck() {
    const p = state.player;
    let exposure = p.risk - protectionOf(state);
    if (p.stats.廉政 < 40) exposure += (40 - p.stats.廉政) * 0.5;
    if (exposure < 25) return null;
    const chance = Math.min(0.8, (exposure - 20) / 120);
    if (Math.random() < chance) return 'jailed';
    if (exposure >= 35) return 'warning';
    return null;
  }

  function checkPromotion() {
    const p = state.player;
    if (p.rank >= RANKS.length - 1) return null;
    const next = RANKS[p.rank + 1];
    const riskCap = next.index >= 9 ? 24 : next.index >= 5 ? 30 : 45;
    const pointsOk = p.points >= next.points;
    const yearsOk = p.yearsInRank >= next.minYears;
    const breakthrough = p.consecutiveExcellent === 6;
    if (!pointsOk) return null;
    if (!yearsOk && !breakthrough) return null;
    if (p.risk > riskCap) {
      toast('廉政审查未通过，提拔暂缓');
      addLog(state, { type: 'promotion', title: '提拔暂缓', text: '你的考核积分已经够了，但廉政审查没有通过。' });
      return null;
    }
    return { nextIndex: next.index, breakthrough: breakthrough && !yearsOk };
  }

  async function promote(promo) {
    const next = RANKS[promo.nextIndex];
    const pool = (POSTING_POOLS[promo.nextIndex] || []).slice();
    if (!pool.length) return false;
    const options = shuffle(pool).slice(0, 4);
    const idx = await showModal({
      kicker: '组织谈话',
      title: '拟任' + next.rankName,
      body: '<p>考察组找你谈话，桌上放着一份拟任名单。组织上准备给你压担子，但去哪里、干什么，还要听你的想法。</p>',
      choices: options.map((po) => ({
        text: po.title,
        hint: po.org + ' · ' + FACTION_DESC[po.faction] + ' · ' + effectSummary(po.effect)
      })),
      wide: true
    });
    const posting = options[Number(idx)] || options[0];
    const oldLevel = RANKS[state.player.rank].levelName;

    state.player.rank = promo.nextIndex;
    state.player.yearsInRank = 0;
    state.player.points = 0;
    state.player.position = posting.title;
    state.player.dept = posting.org;
    state.player.place = posting.place;
    state.player.system = posting.system;
    applyFx(state, posting.effect || {});
    if (posting.faction && posting.faction !== '中立') {
      const leader = CHARACTERS.find((c) => c.faction === posting.faction);
      if (leader && state.relations[leader.id]) {
        state.relations[leader.id].met = true;
        state.relations[leader.id].rel = clamp(state.relations[leader.id].rel + 2, 0, 100);
      }
    }
    if (promo.breakthrough) {
      achieve(state, '破格提拔');
      state.player.consecutiveExcellent = 0;
    }    achieve(state, '晋升' + next.levelName);
    addLog(state, {
      type: 'promotion',
      title: '晋升' + next.levelName,
      text: '由' + oldLevel + '提拔为' + posting.title + '（' + posting.org + '）。'
    });
    syncPatron(state);
    renderAll();
    await showAppointment(posting, next);
    return true;
  }

  function effectSummary(effect) {
    if (!effect || !effect.stats) return '无额外影响';
    return Object.keys(effect.stats).map((k) => k + signed(effect.stats[k])).join(' · ');
  }

  async function showAppointment(posting, rank) {
    const central = rank.index >= 9;
    const provincial = rank.index >= 5;
    const org = central ? '中央组织部' : (provincial ? '中共汉东省委组织部' : '中共京州市委组织部');
    const no = (central ? '中' : (provincial ? '汉' : '京')) + '组任字〔' + state.year + '〕第 ' + String(rand(1, 99)).padStart(2, '0') + ' 号';
    const body =
      '<div class="notice">' +
        '<div class="notice__org">' + org + '</div>' +
        '<div class="notice__no">' + no + '</div>' +
        '<div class="notice__title">任 命 通 知</div>' +
        '<div class="notice__rule"></div>' +
        '<div class="notice__body">经研究决定，任命 <b>' + esc(state.player.name) + '</b> 同志为 <b>' + posting.title + '</b>。</div>' +
        '<div class="notice__tail">特此通知。</div>' +
        '<div class="notice__sign">' +
          '<div class="notice__sign-text">' + org + '<br>' + cnYear(state.year) + '年 三月</div>' +
          '<div class="notice__stamp">' + org + '</div>' +
        '</div>' +
        '<div class="notice__actions"><button class="btn btn--primary btn--block" type="button" data-close="0">接过任命</button></div>' +
      '</div>';
    await showModal({ notice: true, custom: body });
  }

  /* ---------------- 家庭 ---------------- */
  async function offerMarriage(force) {
    if (state.ended || state.player.marriage) return false;
    if (state.player.age < 26) {
      if (force) toast('你还没有到组织上操心的年纪');
      return false;
    }
    if (!force && state.flags.lastMarriageOffer && state.year - state.flags.lastMarriageOffer < 2) return false;
    state.flags.lastMarriageOffer = state.year;

    const choices = MARRIAGE_CANDIDATES.map((c) => ({
      text: c.name + ' · ' + c.age + '岁',
      hint: c.job + '。' + c.desc + '（' + statSummary(c.stats) + '）'
    }));
    choices.push({ text: '暂不考虑', hint: '先把心思放在工作上' });
    const idx = await showModal({
      kicker: '成家',
      title: '有人给你介绍对象',
      body: '<p>同事热心，给你安排了几次见面。你坐在茶馆里，听着对方聊工作、聊家庭、聊以后，忽然意识到自己也不年轻了。</p>',
      choices: choices,
      wide: true
    });
    const pick = Number(idx);
    if (pick < 0 || pick >= MARRIAGE_CANDIDATES.length) {
      toast('你说，再等等吧');
      return false;
    }
    const c = MARRIAGE_CANDIDATES[pick];
    applyFx(state, { stats: c.stats });
    state.player.marriage = {
      id: c.id, name: c.name, job: c.job, age: c.age,
      desc: c.desc, quote: c.quote, year: state.year
    };
    achieve(state, '成家');
    addLog(state, { type: 'family', title: '成家', text: '你与' + c.name + '结婚。' + c.quote });
    renderAll();
    saveGame(true);
    await showInfo({
      kicker: '家',
      title: '成家',
      body: '<p>你和' + c.name + '办了简单的婚礼，只请了几桌亲友。' + c.desc + '</p>',
      quote: '“' + c.quote + '”'
    });
    return true;
  }

  function statSummary(stats) {
    return Object.keys(stats).map((k) => k + signed(stats[k])).join(' · ');
  }

  async function introduce() {
    if (busy) return;
    if (state.player.marriage) {
      toast('你已经成家了');
      return;
    }
    if (state.player.age < 26) {
      toast('二十六岁以后，再让同事帮你张罗吧');
      return;
    }
    if (state.flags.loveTriedThisYear) {
      toast('今年已经托过人了，缘分急不来');
      return;
    }
    state.flags.loveTriedThisYear = true;
    await offerMarriage(true);
  }

  async function maybeMarriage() {
    if (state.player.marriage || state.player.age < 27) return;
    if (state.flags.lastMarriageOffer && state.year - state.flags.lastMarriageOffer < 2) return;
    if (Math.random() > 0.45) return;
    await offerMarriage(false);
  }

  async function maybeChild() {
    const p = state.player;
    if (!p.marriage || p.children.length >= 2) return;
    const years = state.year - p.marriage.year;
    if (years < 1) return;
    if (p.age > 57) return;
    if (Math.random() > 0.38) return;

    const gender = Math.random() < 0.5 ? '男' : '女';
    const pool = shuffle(CHILD_NAMES[gender === '男' ? 'boy' : 'girl']);
    const names = pool.slice(0, 2);
    const idx = await showModal({
      kicker: '家中',
      title: '孩子出生',
      body: '<p>' + esc(p.marriage.name) + '在医院生下了一个' + (gender === '男' ? '男孩' : '女孩') + '。你抱着那个小小的襁褓，忽然觉得这些年所有的奔波都有了归处。</p>',
      choices: names.map((n) => ({ text: n, hint: '为孩子取这个名字' })).concat([{ text: '让爱人取名', hint: '把这份权利交给她' }]),
    });
    let name;
    if (Number(idx) < names.length) name = names[Number(idx)];
    else name = pickOne(CHILD_NAMES[gender === '男' ? 'boy' : 'girl']);
    p.children.push({ name: name, gender: gender, birthYear: state.year });
    applyFx(state, { stats: { 亲情: 8, 健康: -2, 政绩: -1 } });
    achieve(state, '为人父母');
    addLog(state, { type: 'family', title: '孩子出生', text: '你们给孩子取名' + name + '。' });
    renderAll();
    saveGame(true);
    await showInfo({
      kicker: '家',
      title: '孩子出生',
      body: '<p>你和' + esc(p.marriage.name) + '给孩子取名“' + name + '”。产房外的走廊很长，你却在里面走了很久。</p>',
      quote: '“你忙你的，家里有我。”'
    });
  }

  function yearlyDrift() {
    const p = state.player;
    if (p.stats.亲情 >= 70) p.stats.健康 = clamp(p.stats.健康 + 2, 0, 100);
    else if (p.stats.亲情 <= 25) p.stats.健康 = clamp(p.stats.健康 - 1, 0, 100);
    else p.stats.健康 = clamp(p.stats.健康 + 1, 0, 100);
    if (p.marriage) p.stats.亲情 = clamp(p.stats.亲情 + 1, 0, 100);
    if (p.age >= 55) p.stats.健康 = clamp(p.stats.健康 - 2, 0, 100);
    else if (p.age >= 45) p.stats.健康 = clamp(p.stats.健康 - 1, 0, 100);

    const decay = p.stats.廉政 >= 70 ? 3 : 1;
    p.risk = clamp(p.risk - decay, 0, 100);
    if (p.stats.廉政 < 35) p.risk = clamp(p.risk + 2, 0, 100);

    if (p.allegiance !== '中立') {
      if (!state.flags.visitedPatron) p.loyalty = clamp(p.loyalty - 2, 0, 100);
      if (p.loyalty < 20) p.risk = clamp(p.risk + 1, 0, 100);
      if (p.loyalty >= 80) achieve(state, '忠心耿耿');
    }
    const h = p.stats.健康;
    if (h <= 20 && !state.flags.healthWarned) {
      state.flags.healthWarned = true;
      addLog(state, { type: 'risk', title: '体检报告', text: '医生提醒你，身体已经亮起红灯。再这样熬下去，恐怕撑不到退休。' });
      toast('身体亮起红灯：健康低于 20');
    } else if (h > 30) {
      state.flags.healthWarned = false;
    }
    syncPatron(state);
  }

  /* ---------------- 结束本年 ---------------- */
  async function endYear() {
    if (busy || !state || state.ended) return;
    if (state.ap > 0) {
      const idx = await showModal({
        kicker: '岁末',
        title: '结束本年？',
        body: '<p>你还有 <strong>' + state.ap + '</strong> 个行动点没有使用。确定要提前结束本年，进入年度考核吗？</p>',
        choices: [
          { text: '结束本年', hint: '进入年度考核与来年安排' },
          { text: '再想想', hint: '继续处理手头的事务' }
        ]
      });
      if (idx !== '0') return;
    }

    busy = true;
    try {
      renderAll();

      const result = annualAssessment();
      await showAssessment(result);
      if (state.ended) return;

      const riskResult = annualRiskCheck();
      if (riskResult === 'jailed') {
        await showInfo({
          kicker: '风暴',
          title: '纪委的人来了',
          body: '<p>谈话室里的灯很亮。他们把一份份材料摆在你面前，问的每一个问题，你都答不上来。</p><p>你曾经以为，只要站对了队、表够了忠心，就总有人会保你。可这一次，电话那头一直是忙音。</p>',
          quote: '“权力是人民赋予的，不是任何人赏给你的。”'
        });
        triggerEnding('jailed');
        return;
      }
      if (riskResult === 'warning') {
        toast('风声渐紧：有人开始打听你的事');
        addLog(state, { type: 'risk', title: '风声', text: '纪委的人找你谈了一次话，没有结论，但你知道，这事没完。' });
      }

      if (state.player.stats.健康 <= 0) {
        triggerEnding('sick');
        return;
      }

      const promo = checkPromotion();
      if (promo) {
        const ok = await promote(promo);
        if (ok) {
          addLog(state, { type: 'promotion', title: '履新', text: '你到' + state.player.dept + '报到。' });
        }
      }

      await maybeMarriage();
      if (state.ended) return;
      await maybeChild();
      if (state.ended) return;

      yearlyDrift();

      if (state.player.poorAssessments >= 3) {
        await showInfo({
          kicker: '组织决定',
          title: '提前退居二线',
          body: '<p>连续三年考核不称职，组织上找你谈了话。没有批评，也没有挽留，只是通知你：可以提前休息了。</p>'
        });
        triggerEnding('stagnant');
        return;
      }

      state.player.age += 1;

      if (state.player.age >= RETIRE_AGE) {
        addLog(state, { type: 'retire', title: '退休', text: '你到龄退休，离开了工作三十余年的机关大院。' });
        triggerEnding(evaluateEnding());
        return;
      }

      state.player.yearsInRank += 1;
      state.turn += 1;
      state.year += 1;
      saveGame(true);
      await beginYear(false);
    } catch (err) {
      console.error('年度结算出错', err);
      toast('这一年结算时出了点岔子，进度已保存');
      saveGame(true);
    } finally {
      busy = false;
      if (state && !state.ended) renderAll();
    }
  }

  function evaluateEnding() {
    const p = state.player;
    const st = p.stats;
    if (p.risk >= 65) return 'jailed';
    if (st.健康 <= 0) return 'sick';
    if (st.亲情 <= 15) return 'lonely';
    if (p.rank >= 10) return 'pinnacle';
    if (p.rank >= 9) return (st.廉政 >= 55 && st.口碑 >= 55) ? 'politburo' : 'top';
    if (st.廉政 >= 80 && st.口碑 >= 75 && p.rank >= 5) return 'best';
    if (p.rank >= 7) return st.廉政 >= 55 ? 'power' : 'top';
    if (p.rank >= 5) return st.廉政 >= 60 ? 'clean' : 'top';
    if (p.rank >= 3) return (st.廉政 >= 50 && st.亲情 >= 40) ? 'clean' : 'stagnant';
    return 'ordinary';
  }

  /* ---------------- 结局 ---------------- */
  function triggerEnding(key) {
    if (!state || state.ended) return;
    state.ended = true;
    try { localStorage.removeItem(SAVE_KEY); } catch (e) { /* ignore */ }
    const def = ENDING_DEFS[key] || ENDING_DEFS.clean;
    const p = state.player;
    const narrative = def.narrative.slice();
    if (key === 'clean') {
      if (p.marriage && p.children.length) {
        narrative[2] = '回家的路上，你买了两斤菜。' + esc(p.marriage.name) + '在厨房里喊你洗手，' + esc(p.children[0].name) + '打来电话说周末回家吃饭。日子忽然变得很轻。';
      } else if (p.marriage) {
        narrative[2] = '回家的路上，你买了两斤菜。' + esc(p.marriage.name) + '在厨房里喊你洗手。屋子不大，却足够两个人慢慢变老。';
      } else {
        narrative[2] = '回家的路上，你买了两斤菜。屋里只有你一个人，锅碗瓢盆的声音显得格外清楚。你打开电视，让新闻的声音填满房间。';
      }
    }
    if (key === 'lonely') {
      narrative[0] = p.marriage
        ? '退休以后，家里很安静。孩子在外地，你和' + esc(p.marriage.name) + '同住一个屋檐下，却很少说话。'
        : '退休以后，家里很安静。你一直没有成家，亲戚们也渐渐少了来往。';
    }
    const toneClass = def.tone === 'best' ? 'ending-hero--best' : (def.tone === 'dark' ? 'ending-hero--dark' : '');
    const top = topStance(state.profile);
    if (top) narrative.push(PATH_ENDING_LINES[top.id]);
    const achievements = p.achievements.length
      ? p.achievements.map((a) => '<span class="achieve ' + (def.tone === 'dark' ? '' : 'achieve--red') + '">' + esc(a) + '</span>').join('')
      : '<span class="muted small">这一生没有留下太多头衔。</span>';

    const logs = state.log.slice(-14).reverse().map((e) =>
      '<div class="log-item"><span class="log-item__year">' + cnYear(e.year) + '年</span><span class="log-item__text">' + esc(e.title) + '：' + esc(e.text) + '</span></div>'
    ).join('');

    const ending = $('#ending-content');
    ending.innerHTML =
      '<div class="ending-hero ' + toneClass + '">' +
        '<div class="ending-seal">' + def.seal + '</div>' +
        '<div class="ending-kicker">' + cnYear(state.year) + '年 · ' + p.age + '岁 · ' + esc(p.place || '汉东') + '</div>' +
        '<h1 class="ending-title">' + def.title + '</h1>' +
        '<p class="ending-subtitle">' + def.subtitle + '</p>' +
        '<div class="ending-narrative">' + narrative.map((x) => '<p>' + x + '</p>').join('') + '</div>' +
        '<div class="ending-stats ending-stats--six">' +
          '<div class="ending-stat"><div class="ending-stat__label">最终职级</div><div class="ending-stat__value">' + RANKS[p.rank].levelName + '</div></div>' +
          '<div class="ending-stat"><div class="ending-stat__label">政绩</div><div class="ending-stat__value">' + p.stats.政绩 + '</div></div>' +
          '<div class="ending-stat"><div class="ending-stat__label">廉政</div><div class="ending-stat__value">' + p.stats.廉政 + '</div></div>' +
          '<div class="ending-stat"><div class="ending-stat__label">口碑</div><div class="ending-stat__value">' + p.stats.口碑 + '</div></div>' +
          '<div class="ending-stat"><div class="ending-stat__label">仕途底色</div><div class="ending-stat__value">' + (top ? top.path : '未定') + '</div></div>' +
          '<div class="ending-stat"><div class="ending-stat__label">抉择场景</div><div class="ending-stat__value">' + (state.sceneHistory ? state.sceneHistory.length : 0) + '</div></div>' +
        '</div>' +
        '<div class="ending-section"><div class="ending-section__title">一生履历</div><div class="log-list">' + (logs || '<span class="muted small">履历空空如也。</span>') + '</div></div>' +
        '<div class="ending-section"><div class="ending-section__title">身后之名</div><div class="achieve-grid">' + achievements + '</div></div>' +
        '<div class="ending-actions">' +
          '<button class="btn btn--primary" type="button" id="btn-restart">再来一局</button>' +
        '</div>' +
      '</div>';

    $('#game-screen').classList.add('hidden');
    $('#start-screen').classList.add('hidden');
    $('#ending-screen').classList.remove('hidden');
    window.scrollTo(0, 0);
  }

  /* =========================================================
     渲染
     ========================================================= */
  function renderAll() {
    if (!state) return;
    syncPatron(state);
    renderTopbar();
    renderSidebar();
    renderNav();
    renderCareer();
    renderAffairs();
    renderRelations();
    renderFamily();
    renderArchive();
    applyTabVisibility();
  }

  function renderTopbar() {
    const p = state.player;
    const season = CN_SEASONS[clamp(state.ap, 0, 3)];
    $('#topbar-place').textContent = '汉东省 · ' + p.place;
    $('#topbar-date').textContent = cnYear(state.year) + '年 · ' + season;
    $('#topbar-turn').textContent = '第 ' + state.turn + ' 年';
  }

  function renderSidebar() {
    const p = state.player;
    const origin = ORIGINS.find((o) => o.id === p.origin) || ORIGINS[0];
    $('#sidebar-player').innerHTML =
      '<div class="side-player">' +
        '<div class="avatar">' + esc(p.name.slice(0, 1)) + '</div>' +
        '<div>' +
          '<div class="side-player__name">' + esc(p.name) + '</div>' +
          '<div class="side-player__meta">' + p.age + ' 岁 · ' + origin.name + '</div>' +
        '</div>' +
      '</div>' +
      '<div class="side-player__pos">' + esc(p.position) + '<br><span class="muted small">' + esc(p.dept) + '</span></div>';

    const rank = RANKS[p.rank];
    const next = RANKS[p.rank + 1];
    let pct = 100;
    let meta = '<span>已达最高职级</span><span>任职 ' + p.yearsInRank + ' 年</span>';
    if (next) {
      pct = clamp(Math.round((p.points / next.points) * 100), 0, 100);
      meta = '<span>积分 ' + p.points + '/' + next.points + '</span><span>任职 ' + p.yearsInRank + ' 年</span>';
    }
    $('#sidebar-rank').innerHTML =
      '<div class="side-rank__row"><span class="side-rank__label">现任职级</span><span class="side-rank__level">' + rank.levelName + '</span></div>' +
      '<div class="mini-progress"><span style="width:' + pct + '%"></span></div>' +
      '<div class="side-rank__meta">' + meta + '</div>';
  }

  function navHtml() {
    return TABS.map((t) => {
      const active = t.id === activeTab ? ' is-active' : '';
      return '<button class="' + (t.id === activeTab ? 'side-nav__item is-active' : 'side-nav__item') + '" type="button" data-tab="' + t.id + '">' +
        '<span class="side-nav__icon">' + t.icon + '</span><span>' + t.label + '</span></button>';
    }).join('');
  }

  function renderNav() {
    $('#sidebar-nav').innerHTML = navHtml();
    $('#bottom-nav').innerHTML = TABS.map((t) => {
      const active = t.id === activeTab ? ' is-active' : '';
      return '<button class="bottom-nav__item' + active + '" type="button" data-tab="' + t.id + '">' +
        '<span class="bottom-nav__icon">' + t.icon + '</span><span>' + t.label + '</span></button>';
    }).join('');
  }

  function applyTabVisibility() {
    TABS.forEach((t) => {
      const panel = $('#tab-' + t.id);
      if (panel) panel.classList.toggle('hidden', t.id !== activeTab);
    });
  }

  /* ---------------- 仕途 ---------------- */
  function renderCareer() {
    const p = state.player;
    const rank = RANKS[p.rank];
    const origin = ORIGINS.find((o) => o.id === p.origin) || ORIGINS[0];
    const tags = [
      '<span class="hero-tag">' + origin.tag + '</span>',
      '<span class="hero-tag">' + rank.rankName + '</span>',
      '<span class="hero-tag">' + p.system + '系统</span>',
      p.allegiance !== '中立'
        ? '<span class="hero-tag hero-tag--gold">' + FACTION_LABEL[p.allegiance] + '一系 · 忠诚 ' + p.loyalty + '</span>'
        : '<span class="hero-tag">未站队</span>'
    ];
    if (p.risk >= 30) tags.push('<span class="hero-tag">风险 ' + p.risk + '</span>');
    if (p.stats.健康 <= 25) tags.push('<span class="hero-tag hero-tag--alert">健康告急</span>');
    tags.push('<span class="hero-tag">场景 ' + (state.sceneHistory ? state.sceneHistory.length : 0) + '/' + SCENE_TOTAL + '</span>');

    const hero =
      '<div class="hero-card">' +
        '<div class="hero-top">' +
          '<div class="hero-avatar">' + esc(p.name.slice(0, 1)) + '</div>' +
          '<div class="hero-id">' +
            '<div class="hero-name-row"><span class="hero-name">' + esc(p.name) + '</span><span class="hero-age">' + p.age + ' 岁 · ' + origin.name + '</span></div>' +
            '<div class="hero-position">' + esc(p.position) + ' · ' + esc(p.dept) + '</div>' +
            '<div class="hero-tags">' + tags.join('') + '</div>' +
          '</div>' +
          '<div class="hero-seal">汉东</div>' +
        '</div>' +
        '<div class="hero-blessing">' +
          '<span class="hero-blessing__quote">“权力是人民赋予的，只能用来为人民谋利益。”</span>' +
          '<span>' + cnYear(state.year) + '年 · 第 ' + state.turn + ' 年</span>' +
        '</div>' +
      '</div>';

    const stats = '<div class="stat-grid">' + STAT_META.map((m) => {
      const v = p.stats[m.key] || 0;
      return '<div class="stat-cell" style="--c:' + m.color + '">' +
        '<div class="stat-cell__top"><span class="stat-cell__name">' + m.key + '</span><span class="stat-cell__num">' + v + '</span></div>' +
        '<div class="stat-cell__bar"><span style="width:' + v + '%"></span></div>' +
        '<div class="stat-cell__desc">' + m.desc + '</div>' +
      '</div>';
    }).join('') + '</div>';

    const prot = protectionOf(state);
    const integrity =
      '<div class="card integrity-card">' +
        '<div class="integrity-top">' +
          '<div><div class="section-title" style="margin:0">廉政与风险</div><div class="section-sub">底线、忠诚，以及靠山能挡住多少风雨</div></div>' +
          '<div class="integrity-score" style="--risk:' + (p.stats.廉政 >= 45 ? 'var(--green)' : 'var(--red)') + '"><strong>' + p.stats.廉政 + '</strong><span>廉政</span></div>' +
        '</div>' +
        '<div class="integrity-meters">' +
          meterRow('个人风险', p.risk, 100, p.risk >= 40 ? 'risk' : 'safe') +
          meterRow('忠诚', p.loyalty, 100, p.loyalty >= 45 ? 'safe' : 'risk') +
          meterRow('靠山庇护', prot, 28, 'safe') +
        '</div>' +
        '<div class="integrity-note ' + (p.risk >= 45 || p.loyalty < 20 ? 'integrity-note--warn' : '') + '">' +
          protectorNote(p, prot) +
        '</div>' +
      '</div>';

    const groups = ACTION_CATEGORIES.map((cat) => {
      const cards = ACTIONS.filter((a) => a.cat === cat).map((a) => {
        const locked = actionLocked(a);
        const tagsHtml = a.tags.map((t) =>
          '<span class="action-tag ' + (t.charAt(0) === '-' ? 'action-tag--neg' : '') + '">' + t + '</span>'
        ).join('');
        return '<button class="action-card" type="button" data-action="' + a.id + '"' + (locked ? ' disabled' : '') + '>' +
          '<div class="action-card__top"><span class="action-icon">' + a.icon + '</span><span class="action-card__name">' + a.name + (locked ? '<br><span class="muted small">' + locked + '</span>' : '') + '</span></div>' +
          '<div class="action-card__desc">' + a.desc + '</div>' +
          '<div class="action-card__tags">' + tagsHtml + '</div>' +
        '</button>';
      }).join('');
      return '<div class="action-group"><div class="action-group__head">' + cat + '</div><div class="action-grid">' + cards + '</div></div>';
    }).join('');

    const dots = [0, 1, 2].map((i) => '<span class="ap-dot' + (i >= state.ap ? ' is-empty' : '') + '"></span>').join('');
    const actions =
      '<div class="card actions-card">' +
        '<div class="ap-row">' +
          '<span class="ap-label">本年行动点</span>' +
          '<div class="ap-dots">' + dots + '</div>' +
          '<span class="ap-count">' + state.ap + ' / 3</span>' +
        '</div>' +
        groups +
        '<div class="year-end-bar">' +
          '<div class="year-end-bar__text"><strong>' + cnYear(state.year) + '年 · 岁末</strong><span>' +
            (state.ap > 0 ? '还剩 ' + state.ap + ' 个行动点，可以提前结束本年' : '行动点已用尽，该做年度总结了') +
          '</span></div>' +
          '<button class="btn btn--primary" type="button" data-end-year ' + (busy ? 'disabled' : '') + '>结束本年</button>' +
        '</div>' +
      '</div>';

    const timelineEntries = state.log.slice(-8).reverse();
    const timeline =
      '<div class="card timeline-card">' +
        '<div class="section-head"><div><div class="section-title">仕途纪事</div><div class="section-sub">最近发生的事</div></div></div>' +
        '<div class="timeline">' +
          (timelineEntries.length ? timelineEntries.map((e, i) =>
            '<div class="timeline-item ' + (i === 0 ? 'timeline-item--now' : '') + '">' +
              '<div class="timeline-item__year">' + cnYear(e.year) + '年</div>' +
              '<div class="timeline-item__title">' + esc(e.title) + '</div>' +
              '<div class="timeline-item__desc">' + esc(e.text) + '</div>' +
            '</div>').join('') : '<div class="timeline-empty">还没有值得记下的事。</div>') +
        '</div>' +
      '</div>';

    const metList = Object.keys(state.relations)
      .filter((id) => state.relations[id].met)
      .sort((a, b) => state.relations[b].rel - state.relations[a].rel)
      .slice(0, 4);
    const miniRelations =
      '<div class="card mini-rel-card">' +
        '<div class="section-head"><div><div class="section-title">关系网</div><div class="section-sub">走得最近的人</div></div><span class="section-aside">' + metList.length + ' 人</span></div>' +
        '<div class="mini-relations">' +
          (metList.length ? metList.map((id) => {
            const c = CHARACTERS.find((x) => x.id === id);
            const r = state.relations[id];
            return '<div class="mini-rel">' +
              '<div class="avatar avatar--small">' + esc(c.name.slice(0, 1)) + '</div>' +
              '<div class="mini-rel__main"><div class="mini-rel__name">' + c.name + '</div><div class="mini-rel__title">' + c.title + '</div></div>' +
              '<div class="mini-rel__bar"><span style="width:' + r.rel + '%"></span></div>' +
            '</div>';
          }).join('') : '<div class="timeline-empty">你还没有真正结识什么人。</div>') +
        '</div>' +
      '</div>';

    $('#tab-career').innerHTML =
      hero + stats +
      '<div class="content-grid">' +
        '<div class="content-col">' + integrity + actions + '</div>' +
        '<div class="content-col">' + pathCardHtml() + timeline + miniRelations + '</div>' +
      '</div>';
  }

  function pathCardHtml() {
    const history = state.sceneHistory || [];
    const total = history.length;
    const top = topStance(state.profile);
    const rows = STANCES.map((st) => {
      const n = (state.profile && state.profile[st.id]) || 0;
      const pct = total ? Math.round((n / total) * 100) : 0;
      const on = top && top.id === st.id;
      return '<div class="path-row' + (on ? ' path-row--on' : '') + '" style="--c:' + st.color + '">' +
        '<span class="path-row__name">' + st.path + '</span>' +
        '<div class="path-row__bar"><span style="width:' + pct + '%"></span></div>' +
        '<span class="path-row__num">' + n + '</span>' +
      '</div>';
    }).join('');
    const methodRows = METHODS.map((m) => {
      const n = (state.methods && state.methods[m.id]) || 0;
      return '<span class="method-tag' + (n ? '' : ' method-tag--off') + '">' + m.short + ' <b>' + n + '</b></span>';
    }).join('');
    const lead = top
      ? '<div class="path-lead" style="--c:' + top.color + '"><span class="path-lead__label">当前底色</span><strong>' + top.path + '</strong><span class="path-lead__desc">' + top.desc + '</span></div>'
      : '<div class="path-lead path-lead--empty">还没有做过场景选择。第一个路口，会决定别人怎么看你。</div>';
    return '<div class="card path-card">' +
      '<div class="section-head"><div><div class="section-title">仕途底色</div><div class="section-sub">每个路口都在给这一生上色</div></div><span class="section-aside">' + total + ' / ' + SCENE_TOTAL + '</span></div>' +
      lead +
      '<div class="path-rows">' + rows + '</div>' +
      '<div class="method-line"><span class="method-line__label">惯用手段</span>' + methodRows + '</div>' +
    '</div>';
  }

  function meterRow(label, value, max, kind) {
    const pct = clamp(Math.round((value / max) * 100), 0, 100);
    return '<div class="meter-row">' +
      '<div class="meter-row__head"><span>' + label + '</span><b>' + value + '</b></div>' +
      '<div class="meter meter--' + kind + '"><span style="width:' + pct + '%"></span></div>' +
    '</div>';
  }

  function protectorNote(p, prot) {
    if (p.allegiance === '中立') {
      return '你尚未站队。没有人庇护，所有风险都只能自己扛。站队能换来庇护，但忠心也有代价。';
    }
    if (p.loyalty < 20) {
      return '忠诚已经低到危险线以下。' + FACTION_LABEL[p.allegiance] + '一系不再为你说话，风险将直接落到你头上。';
    }
    if (p.loyalty < 40) {
      return '你还在' + FACTION_LABEL[p.allegiance] + '一系的名单上，但已经开始靠边。多走动走动，别让人忘了你。';
    }
    return FACTION_LABEL[p.allegiance] + '一系正在为你提供约 ' + prot + ' 点庇护。忠诚越高，靠山越稳；但靠山要你顶雷时，你也没有退路。';
  }

  function actionLocked(a) {
    if (state.ap <= 0) return '行动点已用完';
    if (a.oncePerYear && state.usedActions[a.id]) return '本年已做';
    if (a.req && !a.req(state)) {
      if (a.id === 'project') return '需副科级以上';
      if (a.id === 'rectify' || a.id === 'invest') return '需正科级以上';
      return '条件不足';
    }
    return '';
  }

  async function doAction(id) {
    if (busy || !state || state.ended) return;
    const a = ACTIONS.find((x) => x.id === id);
    if (!a) return;
    if (state.ap <= 0) { toast('本年行动点已经用完了'); return; }
    const locked = actionLocked(a);
    if (locked) { toast(locked); return; }

    state.ap -= 1;
    if (a.oncePerYear) state.usedActions[id] = true;
    const fx = typeof a.fx === 'function' ? a.fx(state) : a.fx;
    const res = applyFx(state, fx);

    if (id === 'visit') {
      const target = fx && fx.rel ? Object.keys(fx.rel)[0] : '';
      if (target && target === state.player.patron) {
        state.player.loyalty = clamp(state.player.loyalty + 3, 0, 100);
        state.flags.visitedPatron = true;
        res.chips.push({ label: '忠诚', val: 3 });
        res.notes.push('你去看了' + target + '，没有谈工作，只坐了半个小时。有些关系，就是靠这点时间维持的。');
      }
    }

    const summary = res.chips.map((c) => c.label + signed(c.val)).join(' · ');
    addLog(state, { type: 'action', title: a.name, text: summary });
    syncPatron(state);
    renderAll();
    saveGame(true);
    toast(a.name + '：' + summary + (res.notes.length ? '。' + res.notes[0] : ''));
  }

  /* ---------------- 风云 ---------------- */
  function renderAffairs() {
    const p = state.player;
    const prot = protectionOf(state);
    const next = RANKS[p.rank + 1];
    const overview =
      '<div class="affairs-overview">' +
        overviewCell('现任职级', RANKS[p.rank].levelName, RANKS[p.rank].rankName) +
        overviewCell('年度考评', p.lastGrade || '待考核', '') +
        overviewCell('派系', FACTION_LABEL[p.allegiance], '') +
        overviewCell('忠诚', p.loyalty, p.allegiance === '中立' ? '未站队' : '') +
        overviewCell('靠山庇护', prot, '') +
        overviewCell('个人风险', p.risk, p.risk >= 40 ? '危险' : '') +
      '</div>';

    const factions = ['沙', '李', '高'].map((f) => {
      const id = f === '沙' ? '沙瑞金' : f === '李' ? '李达康' : '高育良';
      const r = state.relations[id] || { rel: 0, met: false };
      return '<div class="faction-cell">' +
        '<div class="faction-cell__name">' + FACTION_LABEL[f] + '</div>' +
        '<div class="faction-cell__tag">' + FACTION_DESC[f] + '</div>' +
        '<div class="faction-cell__bar"><span style="width:' + r.rel + '%"></span></div>' +
        '<div class="faction-cell__num">' + (r.met ? '关系 ' + r.rel : '尚未结识') + '</div>' +
      '</div>';
    }).join('');

    let promoRows;
    if (next) {
      const yearsPct = clamp(Math.round((p.yearsInRank / next.minYears) * 100), 0, 100);
      const ptsPct = clamp(Math.round((p.points / next.points) * 100), 0, 100);
      const riskCap = next.index >= 5 ? 30 : 45;
      const riskPct = clamp(Math.round((p.risk / riskCap) * 100), 0, 100);
      promoRows =
        promoRow('任职年限', yearsPct, p.yearsInRank + ' / ' + next.minYears + ' 年') +
        promoRow('考核积分', ptsPct, p.points + ' / ' + next.points, true) +
        promoRow('廉政审查', riskPct, '风险 ' + p.risk + ' / 上限 ' + riskCap, false, true);
    } else {
      promoRows = '<div class="promo-tip">你已经走到了正省级。再往上，是另一片天空，也是另一片风浪。</div>';
    }

    const events = state.log.filter((e) => e.type === 'event' || e.type === 'promotion' || e.type === 'risk').slice(-9).reverse();
    $('#tab-affairs').innerHTML =
      '<div class="card page-card">' +
        '<div class="section-head"><div><div class="section-title">官场风云</div><div class="section-sub">汉东不是一潭死水，每一次风浪都会改变人的位置</div></div><span class="section-aside">' + cnYear(state.year) + '年</span></div>' +
        overview +
        '<div class="section-sub" style="margin-bottom:9px">三系格局</div>' +
        '<div class="faction-grid">' + factions + '</div>' +
        '<div class="promo-panel">' +
          '<div class="section-sub" style="margin:0 0 10px">晋升进度</div>' +
          promoRows +
          '<div class="promo-tip">' + (next
            ? '满足任职年限与考核积分后，还要通过廉政审查。连续六年考核优秀，可以破格提拔。'
            : '你已经站在汉东权力的最上层。') + '</div>' +
        '</div>' +
      '</div>' +
      '<div class="card page-card">' +
        '<div class="section-head"><div><div class="section-title">风云录</div><div class="section-sub">你亲历过的风浪</div></div></div>' +
        '<div class="log-list">' +
          (events.length ? events.map((e) =>
            '<div class="log-item"><span class="log-item__year">' + cnYear(e.year) + '年</span><span class="log-item__text"><strong>' + esc(e.title) + '</strong>　' + esc(e.text) + '</span></div>'
          ).join('') : '<span class="muted small">还没有什么值得写进风云录的事。</span>') +
        '</div>' +
      '</div>';
  }

  function overviewCell(label, value, note) {
    return '<div class="overview-cell"><div class="overview-cell__label">' + label + '</div><div class="overview-cell__value">' + value + (note ? '<small>' + note + '</small>' : '') + '</div></div>';
  }

  function promoRow(label, pct, text, gold, danger) {
    return '<div class="promo-row">' +
      '<span class="promo-row__label">' + label + '</span>' +
      '<div class="promo-row__bar' + (danger ? ' promo-row__bar--red' : '') + '"><span style="width:' + pct + '%"></span></div>' +
      '<span class="promo-row__num">' + text + '</span>' +
    '</div>';
  }

  /* ---------------- 关系 ---------------- */
  function renderRelations() {
    const cards = CHARACTERS.map((c) => {
      const r = state.relations[c.id] || { met: false, rel: 0 };
      return '<button class="rel-card ' + (r.met ? '' : 'rel-card--unmet') + '" type="button" data-char="' + c.id + '">' +
        '<div class="avatar avatar--small">' + esc(c.name.slice(0, 1)) + '</div>' +
        '<div class="rel-card__main">' +
          '<div class="rel-card__top"><span class="rel-card__name">' + c.name + '</span><span class="pill pill--ink">' + c.tag + '</span></div>' +
          '<div class="rel-card__title">' + c.title + '</div>' +
          '<div class="rel-card__quote">' + (r.met ? '“' + c.quote + '”' : '尚未结识') + '</div>' +
          '<div class="rel-card__foot">' +
            '<div class="rel-bar"><span style="width:' + (r.met ? r.rel : 0) + '%"></span></div>' +
            '<span class="rel-card__num">' + (r.met ? r.rel : '—') + '</span>' +
          '</div>' +
        '</div>' +
        (c.danger ? '<span class="rel-card__danger">危险</span>' : '') +
      '</button>';
    }).join('');

    $('#tab-relations').innerHTML =
      '<div class="card page-card">' +
        '<div class="section-head"><div><div class="section-title">关系网</div><div class="section-sub">在汉东，关系也是生产力。有些人能扶你上去，也能推你下去。</div></div><span class="section-aside">' + Object.keys(state.relations).filter((id) => state.relations[id].met).length + ' / ' + CHARACTERS.length + '</span></div>' +
        '<div class="rel-grid">' + cards + '</div>' +
      '</div>';
  }

  function openCharacter(id) {
    const c = CHARACTERS.find((x) => x.id === id);
    if (!c) return;
    const r = state.relations[id];
    if (!r || !r.met) {
      showInfo({
        kicker: c.tag,
        title: c.name,
        body: '<p>你还没有机会与' + c.name + '打交道。' + c.title + '，' + c.org + '。</p><p class="muted">也许某一天，你们会在某个会议上遇见。</p>'
      });
      return;
    }
    showInfo({
      kicker: c.tag + ' · 关系 ' + r.rel,
      title: c.name,
      body: '<p>' + c.desc + '</p><p class="muted">' + c.title + ' · ' + c.org + (c.faction !== '中立' ? ' · ' + FACTION_LABEL[c.faction] + '一系' : '') + '</p>',
      quote: '“' + c.quote + '”'
    });
  }

  /* ---------------- 家庭 ---------------- */
  function renderFamily() {
    const p = state.player;
    const married = !!p.marriage;
    const warmth = p.stats.亲情;
    const bonusText = warmth >= 70
      ? '家庭和睦。每年健康 +2，亲情是你的退路。'
      : warmth <= 25
        ? '亲情疏离。每年健康 -1，退休时可能会走向孤独。'
        : '家庭平稳。每年健康 +1。';

    let body = '';
    if (married) {
      const m = p.marriage;
      const spouseAge = m.age + (state.year - m.year);
      body += '<div class="family-section">' +
        '<div class="family-label">配偶</div>' +
        '<div class="family-grid">' +
          '<div class="family-person">' +
            '<div class="avatar avatar--small">' + esc(m.name.slice(0, 1)) + '</div>' +
            '<div class="family-person__main">' +
              '<div class="family-person__name">' + esc(m.name) + '</div>' +
              '<div class="family-person__meta">' + spouseAge + ' 岁 · ' + esc(m.job) + '</div>' +
              '<div class="family-person__desc">' + esc(m.desc) + '</div>' +
              '<div class="family-person__tags"><span class="pill pill--ink">' + cnYear(m.year) + '年结婚</span></div>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>';

      let childHtml = '';
      if (p.children.length) {
        childHtml = p.children.map((ch) => {
          const age = state.year - ch.birthYear;
          return '<div class="family-person">' +
            '<div class="avatar avatar--small">' + esc(ch.name.slice(0, 1)) + '</div>' +
            '<div class="family-person__main">' +
              '<div class="family-person__name">' + esc(ch.name) + '</div>' +
              '<div class="family-person__meta">' + age + ' 岁 · ' + (ch.gender === '男' ? '儿子' : '女儿') + '</div>' +
              '<div class="family-person__desc">' + childStage(age) + '</div>' +
              '<div class="family-person__tags"><span class="pill pill--ink">' + cnYear(ch.birthYear) + '年出生</span></div>' +
            '</div>' +
          '</div>';
        }).join('');
      } else {
        childHtml = '<div class="family-empty">还没有孩子。你和' + esc(p.marriage.name) + '都很忙，这件事一直往后拖。<span class="muted small">有了孩子之后，每年的亲情与健康会发生变化。</span></div>';
      }
      body += '<div class="family-section">' +
        '<div class="family-label">子女</div>' +
        '<div class="family-grid">' + childHtml + '</div>' +
      '</div>';
    } else {
      body += '<div class="family-empty">' +
        '你还没有成家。办公室的灯经常亮到很晚，回到家只有一室安静。' +
        '<span class="muted small">二十六岁以后，可以托同事帮忙介绍对象。</span>' +
        '<button class="btn btn--small" type="button" data-cmd="introduce"' + (p.age < 26 || state.flags.loveTriedThisYear ? ' disabled' : '') + '>' +
          (state.flags.loveTriedThisYear ? '今年已托人' : '托人介绍') +
        '</button>' +
      '</div>';
    }

    $('#tab-family').innerHTML =
      '<div class="card page-card">' +
        '<div class="family-banner">' +
          '<div class="family-banner__title">' + (married ? p.marriage.name + '和孩子，是你在这世上最柔软的牵挂' : '成家，还是不成的家') + '</div>' +
          '<div class="family-banner__text">' + (married
            ? '你在外面是领导、是下属、是别人棋盘上的子；回到家里，你只是丈夫和父亲。'
            : '你把青春都给了机关大院。至于家，你总觉得还来得及。') + '</div>' +
        '</div>' +
        '<div class="family-bonus ' + (warmth <= 25 ? 'family-bonus--off' : '') + '">' +
          '<span><strong>亲情 ' + warmth + '</strong>　' + bonusText + '</span>' +
        '</div>' +
        body +
      '</div>';
  }

  function childStage(age) {
    if (age <= 3) return '还在牙牙学语，见到你就伸手要抱。';
    if (age <= 6) return '上了幼儿园，每天回家都要讲一遍班里的事。';
    if (age <= 12) return '读小学了。你偶尔去开家长会，老师说你很少来。';
    if (age <= 15) return '读初中，开始有自己的心事，不太愿意跟你说话。';
    if (age <= 18) return '读高中。你尽量不把工作上的情绪带回家。';
    return '上大学了。家里忽然空了一块。';
  }

  /* ---------------- 档案 ---------------- */
  function renderArchive() {
    const p = state.player;
    const achievements = p.achievements.length
      ? p.achievements.map((a) => '<span class="achieve achieve--red">' + esc(a) + '</span>').join('')
      : '<span class="muted small">还没有获得任何称号。</span>';

    const ranks = RANKS.map((r) => {
      const current = r.index === p.rank;
      return '<div class="log-item"><span class="log-item__year">' + r.levelName + '</span><span class="log-item__text">' + r.rankName + ' · ' + r.title + (current ? '　<strong style="color:var(--red)">现任</strong>' : '') + '</span></div>';
    }).join('');

    const decisions = (state.sceneHistory || []).slice().reverse().map((d) => {
      const st = STANCES.find((x) => x.id === d.stance);
      return '<div class="decision-item">' +
        '<span class="log-item__year">' + cnYear(d.year) + '年</span>' +
        '<div class="decision-item__main">' +
          '<div class="decision-item__title">' + esc(d.title) + '</div>' +
          '<span class="path-badge" style="--c:' + (st ? st.color : '#888') + '">' + esc(d.branch) + '</span>' +
        '</div>' +
      '</div>';
    }).join('');

    const logs = state.log.slice(-24).reverse().map((e) =>
      '<div class="log-item"><span class="log-item__year">' + cnYear(e.year) + '年</span><span class="log-item__text"><strong>' + esc(e.title) + '</strong>　' + esc(e.text) + '</span></div>'
    ).join('');

    $('#tab-archive').innerHTML =
      '<div class="card page-card">' +
        '<div class="section-head"><div><div class="section-title">个人档案</div><div class="section-sub">' + esc(p.name) + ' · ' + p.age + ' 岁 · ' + RANKS[p.rank].levelName + '</div></div><span class="section-aside">' + ORIGINS.find((o) => o.id === p.origin).name + '</span></div>' +
        '<div class="archive-actions">' +
          '<button class="btn btn--small" type="button" data-cmd="save">保存进度</button>' +
          '<button class="btn btn--small" type="button" data-cmd="load">读取存档</button>' +
          '<button class="btn btn--small" type="button" data-cmd="restart">重新开始</button>' +
        '</div>' +
        '<div class="section-sub" style="margin-bottom:9px">获得称号</div>' +
        '<div class="achieve-grid">' + achievements + '</div>' +
      '</div>' +
      pathCardHtml() +
      '<div class="card page-card">' +
        '<div class="section-head"><div><div class="section-title">抉择年表</div><div class="section-sub">二十个路口，二十种走法</div></div><span class="section-aside">' + (state.sceneHistory ? state.sceneHistory.length : 0) + ' / ' + SCENE_TOTAL + '</span></div>' +
        '<div class="decision-list">' + (decisions || '<span class="muted small">还没有在任何路口留下脚印。</span>') + '</div>' +
      '</div>' +
      '<div class="card page-card">' +
        '<div class="section-head"><div><div class="section-title">职级序列</div><div class="section-sub">从科员到正省，你走到了哪一格</div></div></div>' +
        '<div class="log-list">' + ranks + '</div>' +
      '</div>' +
      '<div class="card page-card">' +
        '<div class="section-head"><div><div class="section-title">履历</div><div class="section-sub">机关大院里留下的痕迹</div></div></div>' +
        '<div class="log-list">' + (logs || '<span class="muted small">履历还是空白。</span>') + '</div>' +
      '</div>';
  }

  /* ---------------- 帮助 ---------------- */
  function showHelp() {
    const body =
      '<p><strong>二十个路口。</strong>一局仕途会经历 20 个场景，场景从 ' + SCENES.length + ' 个场景池中抽取，年份与顺序每局不同。最近几局看过的场景会被优先避开；每个场景背后有 30 种走法，但每次只随机给出 3 种——换一局，场景和选项都会变。</p>' +
      '<p><strong>一年三事。</strong>每一年有 3 个行动点。下基层、跑项目、处理信访、拜访领导、读书锻炼，都会改变你的属性。行动点用完后，结束本年进入考核。</p>' +
      '<p><strong>年度考核。</strong>政绩、口碑、廉政、能力、人脉、健康、亲情共同决定综合得分。优秀、称职、基本称职、不称职，分别对应不同的考核积分。连续六年优秀可以破格提拔。</p>' +
      '<p><strong>职级上限。</strong>从科员起步，经副科、正科、副处、正处、副厅、正厅、副省、正省，可继续进入中央政治局，最高至中央政治局常委。越往上，廉政审查越严，风险容错越低。</p>' +
      '<p><strong>仕途底色。</strong>守正、实干、逢迎、权谋、群众、抽身，六条路各有代价。连续三次走同一条路会形成“熟练”加成；场景会记住你上一次的选择，并在下一次用不同的方式回应你。结局也会写下你的底色。</p>' +
      '<p><strong>风向。</strong>每个场景都会有一种本年风向，顺风的选择会得到额外加成。风向每年随机，所以同一个选项在不同年份的价值并不相同。</p>' +
      '<p><strong>十字路口。</strong>标注“十字路口”的场景，往往决定你站到哪一边。官场允许一定的贪腐，但要求绝对的忠心——站队之后，靠山会给你庇护；忠诚不足，庇护就会消失。</p>' +
      '<p><strong>忠诚与庇护。</strong>忠诚高于 20 才会得到庇护。庇护可以抵消一部分被查风险。经常去拜访靠山可以维持忠诚；改换门庭会损失忠诚并增加风险。</p>' +
      '<p><strong>风险。</strong>收钱、批条子、替人遮掩都会累积风险。风险超过保护线后，每年都可能在年度考核后被纪委带走。廉政自查可以主动降风险。</p>' +
      '<p><strong>家庭。</strong>二十六岁以后可以成家。亲情高，每年健康增加；亲情低，退休时可能走向孤独结局。</p>' +
      '<p><strong>身体与退休。</strong>健康低于 20 会亮起红灯，归零则病退。五十岁后身体恢复变慢，锻炼与陪伴家人是少数能恢复健康的办法。六十岁到龄退休，结局由职级、廉政、口碑、家庭与仕途底色共同决定。</p>' +
      '<p class="muted small">进度自动保存在本机浏览器。更换浏览器或清除缓存后无法恢复。</p>';
    showInfo({ kicker: '玩法', title: '仕途须知', body: body, button: '知道了', wide: true });
  }

  /* ---------------- Toast ---------------- */
  function toast(message) {
    const root = $('#toast-root');
    if (!root) return;
    const el = document.createElement('div');
    el.className = 'toast';
    el.textContent = message;
    root.appendChild(el);
    setTimeout(() => {
      el.classList.add('toast--out');
      setTimeout(() => el.remove(), 320);
    }, 2600);
  }

  /* ---------------- 事件绑定 ---------------- */
  function bindEvents() {
    $('#origin-grid').addEventListener('click', (e) => {
      const card = e.target.closest('[data-origin]');
      if (!card) return;
      selectedOrigin = card.getAttribute('data-origin');
      renderOrigins();
    });

    $('#btn-start').addEventListener('click', async () => {
      if (starting) return;
      starting = true;
      const input = $('#player-name');
      const name = (input.value || '').trim().slice(0, 8) || '林川';
      await startNewGame(name, selectedOrigin);
      starting = false;
    });

    $('#btn-continue').addEventListener('click', () => {
      if (!loadGame()) {
        $('#btn-continue').classList.add('hidden');
      }
    });

    $('#btn-save').addEventListener('click', () => {
      if (state) saveGame(false);
    });
    $('#btn-help').addEventListener('click', () => showHelp());

    document.addEventListener('click', (e) => {
      const restart = e.target.closest('#btn-restart');
      if (restart) {
        try { localStorage.removeItem(SAVE_KEY); } catch (err) { /* ignore */ }
        location.reload();
        return;
      }

      const tabBtn = e.target.closest('[data-tab]');
      if (tabBtn) {
        activeTab = tabBtn.getAttribute('data-tab');
        renderNav();
        applyTabVisibility();
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }

      const actionBtn = e.target.closest('[data-action]');
      if (actionBtn) {
        doAction(actionBtn.getAttribute('data-action'));
        return;
      }

      if (e.target.closest('[data-end-year]')) {
        endYear();
        return;
      }

      const charBtn = e.target.closest('[data-char]');
      if (charBtn) {
        openCharacter(charBtn.getAttribute('data-char'));
        return;
      }

      const cmdBtn = e.target.closest('[data-cmd]');
      if (cmdBtn) {
        handleCommand(cmdBtn.getAttribute('data-cmd'));
      }
    });
  }

  async function handleCommand(cmd) {
    if (cmd === 'save') {
      saveGame(false);
      return;
    }
    if (cmd === 'load') {
      if (busy) { toast('先处理完手上的事'); return; }
      const idx = await showModal({
        kicker: '档案',
        title: '读取存档？',
        body: '<p>当前未保存的进度将会丢失。确定要回到上一次存档吗？</p>',
        choices: [{ text: '读取存档' }, { text: '取消' }]
      });
      if (idx === '0') loadGame();
      return;
    }
    if (cmd === 'restart') {
      const idx = await showModal({
        kicker: '档案',
        title: '重新开始？',
        body: '<p>当前的仕途将就此结束，所有进度与存档都会被清除。这一步无法撤销。</p>',
        choices: [{ text: '重新开始', hint: '清除存档并回到开始页' }, { text: '再想想' }]
      });
      if (idx === '0') {
        try { localStorage.removeItem(SAVE_KEY); } catch (e) { /* ignore */ }
        location.reload();
      }
      return;
    }
    if (cmd === 'introduce') {
      await introduce();
    }
  }

  /* ---------------- 初始化 ---------------- */
  function init() {
    renderOrigins();
    bindEvents();
    if (hasSave()) {
      $('#btn-continue').classList.remove('hidden');
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

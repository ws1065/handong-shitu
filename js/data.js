/* =========================================================
   汉东仕途 · 数据层
   官职、出身、行动、人物、剧情、结局
   ========================================================= */

const START_YEAR = 2010;
const START_AGE = 24;
const RETIRE_AGE = 60;
const SAVE_KEY = 'handong_shitu_save_v2';
const SEEN_KEY = 'handong_shitu_seen_v1';
const LAST_DECK_KEY = 'handong_shitu_last_deck_v1';

function rand(min, max){ return Math.floor(Math.random() * (max - min + 1)) + min; }
function pickOne(arr){ return arr[Math.floor(Math.random() * arr.length)]; }

const STAT_META = [
  { key: '政绩', color: '#9c3a2f', desc: '工作实绩与项目推进' },
  { key: '口碑', color: '#ad8750', desc: '群众与同事的评价' },
  { key: '廉政', color: '#4e6b4a', desc: '廉洁自律的底线' },
  { key: '人脉', color: '#5b6f7d', desc: '上下左右的关系网' },
  { key: '能力', color: '#6b5b7a', desc: '业务与治理能力' },
  { key: '健康', color: '#4f7a7a', desc: '身体是革命的本钱' },
  { key: '亲情', color: '#a05a5a', desc: '家庭的温度' }
];

const RANKS = [
  { index: 0, rankName: '科员级', levelName: '一级科员', minYears: 0, points: 0, threshold: 30, title: '科员' },
  { index: 1, rankName: '副科级', levelName: '四级主任科员', minYears: 2, points: 3, threshold: 36, title: '副科长' },
  { index: 2, rankName: '正科级', levelName: '二级主任科员', minYears: 3, points: 5, threshold: 42, title: '科长' },
  { index: 3, rankName: '副处级', levelName: '四级调研员', minYears: 3, points: 7, threshold: 47, title: '副处长' },
  { index: 4, rankName: '正处级', levelName: '二级调研员', minYears: 3, points: 9, threshold: 52, title: '处长' },
  { index: 5, rankName: '副厅级', levelName: '二级巡视员', minYears: 3, points: 11, threshold: 57, title: '副厅长' },
  { index: 6, rankName: '正厅级', levelName: '一级巡视员', minYears: 4, points: 12, threshold: 61, title: '厅长' },
  { index: 7, rankName: '副省级', levelName: '副省级', minYears: 4, points: 13, threshold: 65, title: '副省长' },
  { index: 8, rankName: '正省级', levelName: '正省级', minYears: 4, points: 14, threshold: 69, title: '省委书记' },
  { index: 9, rankName: '副国级', levelName: '中央政治局委员', minYears: 4, points: 15, threshold: 73, title: '政治局委员' },
  { index: 10, rankName: '正国级', levelName: '中央政治局常委', minYears: 4, points: 16, threshold: 77, title: '政治局常委' }
];

const ORIGINS = [
  {
    id: 'xuandiao',
    name: '名校选调生',
    tag: '综合管理',
    badge: '综',
    desc: '名校毕业，分配至市委办公室。起点高、视野广，但根基尚浅。',
    perk: '党校学习额外 +1 能力',
    start: {
      place: '京州市',
      dept: '市委办公室',
      position: '市委办公室综合科科员',
      system: '综合'
    },
    stats: { 能力: 8, 人脉: 6, 政绩: 2, 健康: -2 }
  },
  {
    id: 'jiceng',
    name: '基层公务员',
    tag: '乡镇一线',
    badge: '基',
    desc: '从乡镇干起，脚上沾泥，心里有底。群众口碑是你的立身之本。',
    perk: '下基层调研额外 +2 口碑',
    start: {
      place: '京州市金山县',
      dept: '光明镇党政办',
      position: '光明镇党政办科员',
      system: '综合'
    },
    stats: { 口碑: 10, 政绩: 5, 健康: 4, 人脉: -3 }
  },
  {
    id: 'caijing',
    name: '财经骨干',
    tag: '财经系统',
    badge: '财',
    desc: '从县财政局起步，懂项目、懂资金，也最容易被围猎。',
    perk: '招商引资额外 +2 政绩',
    start: {
      place: '京州市金山县',
      dept: '金山县财政局',
      position: '财政局预算科科员',
      system: '财经'
    },
    stats: { 能力: 6, 政绩: 4, 人脉: 3, 廉政: -4 }
  },
  {
    id: 'zhengfa',
    name: '政法干警',
    tag: '政法公安',
    badge: '法',
    desc: '警校出身，一身正气，习惯用证据说话。',
    perk: '专项整治额外 +2 廉政',
    start: {
      place: '京州市金山县',
      dept: '金山县公安局',
      position: '公安局刑侦大队科员',
      system: '政法'
    },
    stats: { 能力: 5, 廉政: 6, 健康: 5, 人脉: -2 }
  },
  {
    id: 'jizhe',
    name: '记者转岗',
    tag: '宣传系统',
    badge: '宣',
    desc: '笔杆子出身，善于同媒体和群众打交道。',
    perk: '群众座谈额外 +2 口碑',
    start: {
      place: '京州市',
      dept: '市委宣传部',
      position: '宣传部新闻科科员',
      system: '宣传'
    },
    stats: { 口碑: 7, 能力: 5, 人脉: 2, 政绩: -2 }
  }
];

const ACTION_CATEGORIES = ['政务', '社交', '修身'];

const ACTIONS = [
  {
    id: 'xiaceng', cat: '政务', name: '下基层调研', icon: '调',
    desc: '脚上沾泥，心里有底。',
    tags: ['+政绩', '+口碑', '-健康'],
    fx: (s) => ({
      stats: {
        政绩: rand(4, 7) + Math.floor(s.player.rank * .4),
        口碑: rand(3, 5) + (s.player.origin === 'jiceng' ? 2 : 0),
        健康: -rand(1, 2),
        能力: rand(0, 1)
      },
      risk: -1
    })
  },
  {
    id: 'project', cat: '政务', name: '推进重点项目', icon: '项',
    desc: '抓项目、抢工期，最容易出成绩，也最容易出事。',
    tags: ['+政绩', '+人脉', '-廉政'],
    req: (s) => s.player.rank >= 1,
    fx: (s) => ({
      stats: {
        政绩: rand(5, 8) + Math.floor(s.player.rank * .5),
        人脉: rand(1, 2),
        廉政: -rand(0, 2),
        健康: -2
      },
      risk: rand(1, 3)
    })
  },
  {
    id: 'petition', cat: '政务', name: '处理信访积案', icon: '访',
    desc: '把矛盾化解在基层，把口碑攒在民间。',
    tags: ['+口碑', '+廉政', '-健康'],
    fx: () => ({
      stats: { 口碑: rand(5, 8), 政绩: rand(1, 2), 健康: -1, 廉政: rand(0, 1) }
    })
  },
  {
    id: 'rectify', cat: '政务', name: '专项整治', icon: '治',
    desc: '刀刃向内，整顿作风。会得罪人，但能立威。',
    tags: ['+廉政', '+政绩', '-人脉'],
    req: (s) => s.player.rank >= 2,
    fx: (s) => ({
      stats: {
        政绩: rand(3, 5),
        廉政: rand(1, 2) + (s.player.origin === 'zhengfa' ? 2 : 0),
        口碑: rand(1, 3),
        人脉: -rand(1, 2)
      },
      risk: -rand(1, 2)
    })
  },
  {
    id: 'invest', cat: '政务', name: '招商引资', icon: '招',
    desc: '项目、资金、政策，都要靠腿跑出来。',
    tags: ['+政绩', '+人脉', '-廉政'],
    req: (s) => s.player.rank >= 2,
    fx: (s) => ({
      stats: {
        政绩: rand(4, 7) + (s.player.origin === 'caijing' ? 2 : 0),
        人脉: rand(3, 5),
        廉政: -rand(1, 2),
        健康: -1
      },
      risk: rand(1, 2)
    })
  },
  {
    id: 'visit', cat: '社交', name: '拜访老领导', icon: '访',
    desc: '逢年过节走动走动，关系是走出来的。',
    tags: ['+人脉', '-亲情'],
    fx: (s) => {
      const leaders = ['沙瑞金', '李达康', '高育良'].filter((n) => s.relations[n] && s.relations[n].met);
      const patron = s.player.patron;
      const target = patron && leaders.includes(patron) ? patron : (leaders.length ? pickOne(leaders) : '李达康');
      return {
        stats: { 人脉: rand(3, 5), 亲情: -1 },
        rel: { [target]: rand(3, 6) },
        meet: [target],
        risk: -1
      };
    }
  },
  {
    id: 'banquet', cat: '社交', name: '同僚宴请', icon: '宴',
    desc: '酒桌上是人情，也是把柄。',
    tags: ['+人脉', '-廉政'],
    fx: () => ({
      stats: { 人脉: rand(4, 6), 廉政: -rand(1, 2), 健康: -1 },
      risk: rand(1, 2)
    })
  },
  {
    id: 'party-school', cat: '社交', name: '党校学习', icon: '学',
    desc: '充电，也结识同路人。',
    tags: ['+能力', '+人脉'],
    fx: (s) => ({
      stats: {
        能力: rand(4, 6) + (s.player.origin === 'xuandiao' ? 1 : 0),
        人脉: rand(2, 3),
        政绩: rand(0, 1)
      }
    })
  },
  {
    id: 'forum', cat: '社交', name: '群众座谈', icon: '谈',
    desc: '听真话，讲实情。',
    tags: ['+口碑', '+政绩'],
    fx: (s) => ({
      stats: {
        口碑: rand(4, 7) + (s.player.origin === 'jizhe' ? 2 : 0),
        政绩: rand(1, 2),
        健康: -1
      }
    })
  },
  {
    id: 'study', cat: '修身', name: '读书研究', icon: '读',
    desc: '把文件读薄，把问题想透。',
    tags: ['+能力', '-亲情'],
    fx: () => ({ stats: { 能力: rand(4, 6), 亲情: -1 } })
  },
  {
    id: 'exercise', cat: '修身', name: '锻炼身体', icon: '健',
    desc: '身体是革命的本钱。',
    tags: ['+健康'],
    fx: () => ({ stats: { 健康: rand(5, 8), 能力: rand(0, 1) } })
  },
  {
    id: 'family', cat: '修身', name: '陪伴家人', icon: '家',
    desc: '官做多大，家才是归处。',
    tags: ['+亲情', '+健康'],
    fx: () => ({ stats: { 亲情: rand(6, 9), 健康: rand(1, 2) } })
  },
  {
    id: 'selfcheck', cat: '修身', name: '廉政自查', icon: '廉',
    desc: '主动向组织说明问题，争取宽大处理。',
    tags: ['+廉政', '-风险', '-政绩'],
    req: (s) => s.player.stats.廉政 < 55 || s.risk >= 25,
    oncePerYear: true,
    fx: () => ({
      stats: { 廉政: rand(4, 6), 政绩: -1, 人脉: -1 },
      risk: -rand(8, 12)
    })
  }
];

const CHARACTERS = [
  {
    id: '沙瑞金', name: '沙瑞金', title: '汉东省委书记', org: '省委', faction: '沙', tag: '改革派',
    desc: '空降汉东的省委书记，眼里揉不得沙子。他要打破旧格局，也要看看谁在裸泳。',
    quote: '不要怕得罪人，带病干部一个不提。',
    met: false, initialRel: 0
  },
  {
    id: '李达康', name: '李达康', title: '京州市委书记', org: '京州市委', faction: '李', tag: '发展派',
    desc: '秘书出身，雷厉风行，眼里只有项目、GDP 和京州的城市版图。',
    quote: '没有项目，你拿什么给老百姓交代？',
    met: false, initialRel: 6
  },
  {
    id: '高育良', name: '高育良', title: '省委副书记、政法委书记', org: '省委', faction: '高', tag: '政法系',
    desc: '学者型干部，汉大政法系的精神领袖，讲原则，也讲人情。',
    quote: '历史是任人打扮的小姑娘。',
    met: false, initialRel: 3
  },
  {
    id: '田国富', name: '田国富', title: '省纪委书记', org: '省纪委', faction: '沙', tag: '纪检',
    desc: '从北京空降的纪委书记，话不多，眼睛很亮。',
    quote: '有些干部，不是要不要提的问题，是要不要采取措施的问题。',
    met: false, initialRel: 0
  },
  {
    id: '季昌明', name: '季昌明', title: '省人民检察院检察长', org: '省检察院', faction: '中立', tag: '检察',
    desc: '汉东老人，处事谨慎，最擅长在风浪里稳住船。',
    quote: '按程序办，总不会错。',
    met: false, initialRel: 0
  },
  {
    id: '侯亮平', name: '侯亮平', title: '省检察院反贪局局长', org: '省检察院', faction: '沙', tag: '反贪',
    desc: '从最高检调来的“猴子”，认死理，也认证据。',
    quote: '反腐没有禁区，也没有例外。',
    met: false, initialRel: 0
  },
  {
    id: '陈海', name: '陈海', title: '省检察院反贪局局长', org: '省检察院', faction: '中立', tag: '反贪',
    desc: '陈岩石之子，老实、踏实，习惯和所有人保持距离。',
    quote: '有些事，总得有人去做。',
    met: false, initialRel: 0
  },
  {
    id: '陈岩石', name: '陈岩石', title: '原省检察院常务副检察长', org: '退休', faction: '中立', tag: '老革命',
    desc: '外号“老石头”，跟赵立春斗了大半辈子。退了休，还在为大风厂的工人奔走。',
    quote: '从人民中来，到人民中去。',
    met: true, initialRel: 5
  },
  {
    id: '陆亦可', name: '陆亦可', title: '省检察院反贪局一处处长', org: '省检察院', faction: '中立', tag: '反贪',
    desc: '干练、锋利，办案时六亲不认，生活里被母亲催婚。',
    quote: '证据不会说谎。',
    met: false, initialRel: 0
  },
  {
    id: '赵东来', name: '赵东来', title: '京州市公安局局长', org: '市公安局', faction: '李', tag: '公安',
    desc: '嗓门大、心思细，关键时候靠得住。',
    quote: '京州的案子，我赵东来管到底。',
    met: false, initialRel: 0
  },
  {
    id: '易学习', name: '易学习', title: '吕州高新区管委会主任', org: '吕州市', faction: '沙', tag: '实干',
    desc: '二十多年前就是县委书记，不跑不要，一直原地踏步。沙瑞金要找他这样的干部。',
    quote: '当官不为民做主，不如回家卖红薯。',
    met: false, initialRel: 0
  },
  {
    id: '孙连城', name: '孙连城', title: '京州市光明区区长', org: '光明区', faction: '中立', tag: '懒政',
    desc: '曾经的少年得志，如今的“宇宙区长”。不贪不占，也不办事。',
    quote: '宇宙那么大，人类算什么？',
    met: true, initialRel: 6
  },
  {
    id: '高小琴', name: '高小琴', title: '山水集团董事长', org: '山水集团', faction: '高', tag: '商界', danger: true,
    desc: '风姿绰约，书卷气与江湖气混在一起。山水庄园的每一盏灯，都照见不同的心思。',
    quote: '在汉东，朋友多了路好走。',
    met: false, initialRel: 0
  },
  {
    id: '赵瑞龙', name: '赵瑞龙', title: '赵立春之子、商人', org: '商界', faction: '高', tag: '商界', danger: true,
    desc: '顶着父亲的光环，在汉东的生意场上横着走。赵家倒了，他的影子还在。',
    quote: '在汉东，没有我赵家办不成的事。',
    met: false, initialRel: 0
  },
  {
    id: '祁同伟', name: '祁同伟', title: '省公安厅厅长', org: '省公安厅', faction: '高', tag: '政法',
    desc: '草根出身，靠一股拼命劲爬到今天。他信命，更想胜天半子。',
    quote: '我祁同伟，从来不服输。',
    met: false, initialRel: 0
  },
  {
    id: '吴慧芬', name: '吴慧芬', title: '汉东大学明史教授', org: '汉东大学', faction: '高', tag: '学界',
    desc: '高育良的夫人，讲明史，也看透了官场的兴衰。',
    quote: '历史里的账，迟早都要算。',
    met: false, initialRel: 0
  },
  {
    id: '蔡成功', name: '蔡成功', title: '大风厂老板', org: '大风厂', faction: '中立', tag: '商界', danger: true,
    desc: '侯亮平的发小，精于算计，也常常把自己算进去。',
    quote: '我只是想把厂子保住。',
    met: false, initialRel: 0
  },
  {
    id: '郑西坡', name: '郑西坡', title: '大风厂工会主席', org: '大风厂', faction: '中立', tag: '群众',
    desc: '爱写诗，也爱管闲事。大风厂的工人信他。',
    quote: '工人流的汗，不能白流。',
    met: false, initialRel: 0
  }
];

/* ---------------- 任命岗位池 ---------------- */
const POSTING_POOLS = {
  1: [
    { title: '金山县光明镇副镇长', org: '光明镇人民政府', place: '京州市金山县', system: '综合', faction: '李', effect: { stats: { 政绩: 2, 人脉: 1, 健康: -1 } } },
    { title: '金山县财政局副局长', org: '金山县财政局', place: '京州市金山县', system: '财经', faction: '李', effect: { stats: { 能力: 2, 人脉: 2, 廉政: -1 } } },
    { title: '金山县住建局副局长', org: '金山县住建局', place: '京州市金山县', system: '城建', faction: '李', effect: { stats: { 政绩: 3, 廉政: -2 } } },
    { title: '金山县公安局副局长', org: '金山县公安局', place: '京州市金山县', system: '政法', faction: '高', effect: { stats: { 廉政: 2, 能力: 1 } } },
    { title: '金山县委政法委副书记', org: '金山县委政法委', place: '京州市金山县', system: '政法', faction: '高', effect: { stats: { 人脉: 2, 廉政: 1 } } },
    { title: '金山县委办副主任', org: '金山县委办公室', place: '京州市金山县', system: '综合', faction: '沙', effect: { stats: { 能力: 1, 人脉: 2, 口碑: 1 } } },
    { title: '金山县法院副院长', org: '金山县人民法院', place: '京州市金山县', system: '司法', faction: '高', effect: { stats: { 廉政: 2, 能力: 1 } } },
    { title: '京州市发改委综合科副科长', org: '京州市发改委', place: '京州市', system: '综合', faction: '沙', effect: { stats: { 政绩: 2, 能力: 1 } } }
  ],
  2: [
    { title: '金山县光明镇镇长', org: '光明镇人民政府', place: '京州市金山县', system: '综合', faction: '李', effect: { stats: { 政绩: 3, 口碑: 1, 健康: -1 } } },
    { title: '金山县财政局局长', org: '金山县财政局', place: '京州市金山县', system: '财经', faction: '李', effect: { stats: { 能力: 2, 人脉: 2, 廉政: -1 } } },
    { title: '金山县住建局局长', org: '金山县住建局', place: '京州市金山县', system: '城建', faction: '李', effect: { stats: { 政绩: 4, 廉政: -2 } } },
    { title: '金山县公安局政委', org: '金山县公安局', place: '京州市金山县', system: '政法', faction: '高', effect: { stats: { 廉政: 2, 人脉: 1 } } },
    { title: '金山县委办公室主任', org: '金山县委办公室', place: '京州市金山县', system: '综合', faction: '沙', effect: { stats: { 能力: 2, 人脉: 2 } } },
    { title: '京州市委办公室综合科科长', org: '京州市委办公室', place: '京州市', system: '综合', faction: '沙', effect: { stats: { 政绩: 2, 人脉: 2 } } },
    { title: '京州市纪委第一监督检查室主任', org: '京州市纪委', place: '京州市', system: '纪检', faction: '沙', effect: { stats: { 廉政: 3, 人脉: -1 } } },
    { title: '京州市发改委投资科科长', org: '京州市发改委', place: '京州市', system: '综合', faction: '李', effect: { stats: { 政绩: 3, 能力: 1 } } }
  ],
  3: [
    { title: '金山县副县长', org: '金山县人民政府', place: '京州市金山县', system: '综合', faction: '李', effect: { stats: { 政绩: 4, 口碑: 2, 健康: -1 } } },
    { title: '京州市财政局副局长', org: '京州市财政局', place: '京州市', system: '财经', faction: '李', effect: { stats: { 能力: 2, 人脉: 2, 廉政: -1 } } },
    { title: '京州市住建局副局长', org: '京州市住建局', place: '京州市', system: '城建', faction: '李', effect: { stats: { 政绩: 4, 廉政: -2 } } },
    { title: '京州市公安局副局长', org: '京州市公安局', place: '京州市', system: '政法', faction: '高', effect: { stats: { 廉政: 2, 能力: 2 } } },
    { title: '京州市委政法委副书记', org: '京州市委政法委', place: '京州市', system: '政法', faction: '高', effect: { stats: { 人脉: 3, 廉政: 1 } } },
    { title: '京州市纪委常委', org: '京州市纪委', place: '京州市', system: '纪检', faction: '沙', effect: { stats: { 廉政: 3, 人脉: 1 } } },
    { title: '京州市中级人民法院副院长', org: '京州市中级人民法院', place: '京州市', system: '司法', faction: '高', effect: { stats: { 廉政: 2, 能力: 2 } } },
    { title: '京州市人民检察院副检察长', org: '京州市人民检察院', place: '京州市', system: '检察', faction: '高', effect: { stats: { 廉政: 2, 人脉: 1 } } }
  ],
  4: [
    { title: '金山县县长', org: '金山县人民政府', place: '京州市金山县', system: '综合', faction: '李', effect: { stats: { 政绩: 5, 口碑: 2, 健康: -2 } } },
    { title: '京州市光明区区长', org: '光明区人民政府', place: '京州市', system: '综合', faction: '李', effect: { stats: { 政绩: 5, 人脉: 2, 廉政: -1 } } },
    { title: '京州市光明区区委书记', org: '光明区委', place: '京州市', system: '综合', faction: '沙', effect: { stats: { 政绩: 4, 人脉: 2, 口碑: 1 } } },
    { title: '京州市财政局局长', org: '京州市财政局', place: '京州市', system: '财经', faction: '李', effect: { stats: { 能力: 2, 人脉: 3, 廉政: -1 } } },
    { title: '京州市住建局局长', org: '京州市住建局', place: '京州市', system: '城建', faction: '李', effect: { stats: { 政绩: 5, 廉政: -2 } } },
    { title: '京州市发改委主任', org: '京州市发改委', place: '京州市', system: '综合', faction: '沙', effect: { stats: { 政绩: 4, 能力: 2, 人脉: 1 } } },
    { title: '京州市委副秘书长', org: '京州市委办公室', place: '京州市', system: '综合', faction: '沙', effect: { stats: { 人脉: 3, 能力: 1 } } },
    { title: '京州市纪委副书记', org: '京州市纪委', place: '京州市', system: '纪检', faction: '沙', effect: { stats: { 廉政: 4, 人脉: 1 } } }
  ],
  5: [
    { title: '京州市副市长', org: '京州市人民政府', place: '京州市', system: '综合', faction: '李', effect: { stats: { 政绩: 5, 人脉: 3, 健康: -2 } } },
    { title: '汉东省财政厅副厅长', org: '汉东省财政厅', place: '汉东省', system: '财经', faction: '李', effect: { stats: { 能力: 3, 人脉: 2, 廉政: -1 } } },
    { title: '汉东省住建厅副厅长', org: '汉东省住建厅', place: '汉东省', system: '城建', faction: '李', effect: { stats: { 政绩: 4, 廉政: -1 } } },
    { title: '汉东省公安厅副厅长', org: '汉东省公安厅', place: '汉东省', system: '政法', faction: '高', effect: { stats: { 廉政: 2, 能力: 2 } } },
    { title: '汉东省委政法委专职副书记', org: '汉东省委政法委', place: '汉东省', system: '政法', faction: '高', effect: { stats: { 人脉: 3, 廉政: 1 } } },
    { title: '汉东省纪委常委', org: '汉东省纪委', place: '汉东省', system: '纪检', faction: '沙', effect: { stats: { 廉政: 4, 人脉: 1 } } },
    { title: '汉东省人民检察院副检察长', org: '汉东省人民检察院', place: '汉东省', system: '检察', faction: '高', effect: { stats: { 廉政: 3, 能力: 1 } } },
    { title: '京州市委常委、秘书长', org: '京州市委', place: '京州市', system: '综合', faction: '沙', effect: { stats: { 人脉: 4, 能力: 1 } } }
  ],
  6: [
    { title: '京州市市长', org: '京州市人民政府', place: '京州市', system: '综合', faction: '李', effect: { stats: { 政绩: 6, 口碑: 2, 健康: -2 } } },
    { title: '汉东省财政厅厅长', org: '汉东省财政厅', place: '汉东省', system: '财经', faction: '李', effect: { stats: { 能力: 3, 人脉: 3, 廉政: -1 } } },
    { title: '汉东省住建厅厅长', org: '汉东省住建厅', place: '汉东省', system: '城建', faction: '李', effect: { stats: { 政绩: 5, 廉政: -2 } } },
    { title: '汉东省公安厅厅长', org: '汉东省公安厅', place: '汉东省', system: '政法', faction: '高', effect: { stats: { 廉政: 2, 人脉: 2, 能力: 2 } } },
    { title: '汉东省委政法委副书记', org: '汉东省委政法委', place: '汉东省', system: '政法', faction: '高', effect: { stats: { 人脉: 4, 廉政: 1 } } },
    { title: '汉东省纪委副书记', org: '汉东省纪委', place: '汉东省', system: '纪检', faction: '沙', effect: { stats: { 廉政: 5, 人脉: 1 } } },
    { title: '汉东省委组织部常务副部长', org: '汉东省委组织部', place: '汉东省', system: '组织', faction: '沙', effect: { stats: { 人脉: 4, 能力: 2 } } },
    { title: '京州市委副书记', org: '京州市委', place: '京州市', system: '综合', faction: '李', effect: { stats: { 政绩: 4, 人脉: 3 } } }
  ],
  7: [
    { title: '汉东省副省长', org: '汉东省人民政府', place: '汉东省', system: '综合', faction: '沙', effect: { stats: { 政绩: 5, 人脉: 3, 健康: -2 } } },
    { title: '京州市委书记', org: '京州市委', place: '京州市', system: '综合', faction: '李', effect: { stats: { 政绩: 6, 人脉: 3, 健康: -2 } } },
    { title: '汉东省委常委、京州市委书记', org: '京州市委', place: '京州市', system: '综合', faction: '李', effect: { stats: { 政绩: 6, 人脉: 4, 健康: -3 } } },
    { title: '汉东省委常委、政法委书记', org: '汉东省委政法委', place: '汉东省', system: '政法', faction: '高', effect: { stats: { 人脉: 4, 廉政: 1, 政绩: 2 } } },
    { title: '汉东省委常委、省纪委书记', org: '汉东省纪委', place: '汉东省', system: '纪检', faction: '沙', effect: { stats: { 廉政: 6, 人脉: 2 } } },
    { title: '汉东省委副书记', org: '汉东省委', place: '汉东省', system: '综合', faction: '沙', effect: { stats: { 政绩: 4, 人脉: 5 } } }
  ],
  8: [
    { title: '汉东省省长', org: '汉东省人民政府', place: '汉东省', system: '综合', faction: '李', effect: { stats: { 政绩: 6, 人脉: 4, 健康: -3 } } },
    { title: '汉东省委书记', org: '汉东省委', place: '汉东省', system: '综合', faction: '沙', effect: { stats: { 政绩: 5, 人脉: 5, 健康: -3 } } }
  ],
  9: [
    { title: '中央政治局委员、中央组织部部长', org: '中共中央组织部', place: '北京', system: '组织', faction: '沙', effect: { stats: { 人脉: 5, 能力: 3, 健康: -2 } } },
    { title: '中央政治局委员、中央政法委书记', org: '中共中央政法委员会', place: '北京', system: '政法', faction: '高', effect: { stats: { 廉政: 3, 人脉: 4, 健康: -2 } } },
    { title: '中央政治局委员、国务院副总理', org: '国务院', place: '北京', system: '综合', faction: '李', effect: { stats: { 政绩: 6, 人脉: 3, 健康: -3 } } },
    { title: '中央政治局委员、中央书记处书记', org: '中共中央书记处', place: '北京', system: '综合', faction: '沙', effect: { stats: { 能力: 4, 人脉: 3, 健康: -2 } } },
    { title: '中央政治局委员、中央办公厅主任', org: '中共中央办公厅', place: '北京', system: '综合', faction: '沙', effect: { stats: { 人脉: 5, 廉政: 2, 健康: -2 } } },
    { title: '中央政治局委员、北京市委书记', org: '中共北京市委', place: '北京', system: '综合', faction: '李', effect: { stats: { 政绩: 5, 人脉: 4, 健康: -3 } } }
  ],
  10: [
    { title: '中央政治局常委、中央纪律检查委员会书记', org: '中共中央纪律检查委员会', place: '北京', system: '纪检', faction: '沙', effect: { stats: { 廉政: 6, 人脉: 4, 健康: -3 } } },
    { title: '中央政治局常委、国务院副总理', org: '国务院', place: '北京', system: '综合', faction: '李', effect: { stats: { 政绩: 7, 人脉: 4, 健康: -4 } } },
    { title: '中央政治局常委、中央书记处书记', org: '中共中央书记处', place: '北京', system: '综合', faction: '沙', effect: { stats: { 能力: 5, 人脉: 5, 健康: -3 } } },
    { title: '中央政治局常委、全国人大常委会委员长', org: '全国人民代表大会常务委员会', place: '北京', system: '综合', faction: '高', effect: { stats: { 人脉: 4, 口碑: 4, 健康: -3 } } },
    { title: '中央政治局常委、全国政协主席', org: '中国人民政治协商会议全国委员会', place: '北京', system: '综合', faction: '高', effect: { stats: { 人脉: 5, 口碑: 3, 健康: -3 } } },
    { title: '中央政治局常委、国务院总理', org: '国务院', place: '北京', system: '综合', faction: '李', effect: { stats: { 政绩: 8, 人脉: 5, 健康: -5 } } }
  ]
};

/* ---------------- 固定剧情事件 ---------------- */
const FIXED_EVENTS = [
  {
    id: 'first-task', year: 2010, cat: '仕途起点', title: '第一份差事',
    text: '报到第三天，办公室主任把一摞材料放在你桌上：“市里要一份基层治理调研，三天后交。你年轻，多跑跑。”同一间办公室里，老科员在泡茶，隔壁有人在打电话约晚上的饭局。',
    quote: '机关的第一课，往往不在文件里。',
    choices: [
      {
        text: '骑自行车跑遍三个乡镇，写一份有数据的调研',
        hint: '辛苦，但能摸到真情况',
        fx: { stats: { 政绩: 5, 口碑: 3, 能力: 3, 健康: -2, 亲情: -1 } },
        result: '三天后，你交上去的调研里夹着三十七户人家的走访记录。主任翻了翻，什么也没说，只把你的名字圈了出来。'
      },
      {
        text: '找老科员要往年稿子，改一改交上去',
        hint: '省力，也不会出错',
        fx: { stats: { 能力: 1, 政绩: 1, 人脉: 2 } },
        result: '稿子四平八稳，主任扫了一眼就放进了文件堆。你学会了机关里的第一种生存方式：不出错，也不出彩。'
      },
      {
        text: '请主任吃饭，先打听领导想要什么',
        hint: '懂人情，但容易欠下人情',
        fx: { stats: { 人脉: 4, 廉政: -2 }, risk: 3 },
        result: '饭桌上，主任提点了你几句。你听懂了，也记住了那顿饭是谁买的单。'
      }
    ]
  },
  {
    id: 'eight-rules', year: 2011, cat: '作风纪律', title: '一顿饭的规矩',
    text: '年底，单位按惯例订了酒店聚餐，每人还能领一份“土特产”。新来的纪委书记在会上念文件，台下有人打哈欠。办公室主任问你：“小同志，你去不去？”',
    quote: '规矩立起来，先疼的总是习惯。',
    choices: [
      {
        text: '不去，把土特产退掉',
        hint: '守住底线，但会显得不合群',
        fx: { stats: { 廉政: 6, 口碑: 2, 人脉: -3 } },
        result: '你留在办公室整理材料。第二天，桌上多了一盒没人认领的土特产，你原封不动交到了纪检组。'
      },
      {
        text: '去，但只吃饭、不拿东西',
        hint: '不得罪人，也不越线',
        fx: { stats: { 人脉: 2, 廉政: -1 } },
        result: '饭桌上觥筹交错，你只喝了半杯茶。散场时，你空着手回家，心里却比谁都踏实。'
      },
      {
        text: '去，还替领导挡酒',
        hint: '领导记住了你，纪律也记住了你',
        fx: { stats: { 人脉: 5, 健康: -2, 廉政: -3 }, risk: 3 },
        result: '你喝到胃里翻江倒海，领导拍着你的肩说“这小伙子不错”。第二天，纪委的通报里虽然没有你的名字，但你知道，有人把它记在了本子上。'
      }
    ]
  },
  {
    id: 'wind-change', year: 2012, cat: '风向', title: '风向变了',
    text: '电视里，新一届中央领导集体亮相。反腐、作风、纪律，这些词开始频繁出现在文件里。单位里几个常年不上班的人突然都来打卡了，食堂的包间也悄悄关了。',
    quote: '风起于青萍之末。',
    choices: [
      {
        text: '把手里经手的项目账目重新核一遍',
        hint: '谨慎，能睡个安稳觉',
        fx: { stats: { 廉政: 5, 能力: 2, 政绩: 2, 健康: -1 } },
        result: '你花了两个通宵，把账目一笔一笔对平。没有查出大问题，但你第一次知道，自己经手的每一分钱都去了哪里。'
      },
      {
        text: '先观望，等风头过去',
        hint: '不冒头，也不落后',
        fx: { stats: { 廉政: -2, 人脉: 1 } },
        result: '你照常上班、照常下班。风头确实会过去，但有些风，吹了很久。'
      },
      {
        text: '主动向纪检组说明过去收受的购物卡',
        hint: '坦白从宽，但要付出人情的代价',
        fx: { stats: { 廉政: 8, 人脉: -4 }, risk: -10 },
        result: '你把购物卡一张张摆在桌上。纪检组长看了你很久，说：“年轻人，路还长。”'
      }
    ]
  },
  {
    id: 'village', year: 2013, cat: '群众路线', title: '驻村三个月',
    text: '市里开展群众路线教育实践活动，要求干部驻村蹲点。你被分到金山县最偏远的一个村，村里连自来水都没通。村支书递给你一双胶鞋：“走山路，穿皮鞋不行。”',
    quote: '脚上沾多少泥，心里就有多少底。',
    choices: [
      {
        text: '挨家挨户走访，把问题记在本子上',
        hint: '最笨的办法，往往最有效',
        fx: { stats: { 口碑: 7, 政绩: 3, 能力: 1, 健康: -2 } },
        result: '三个月后，你的本子上记了二百多户人家的难处。回城那天，村口站满了来送你的村民。'
      },
      {
        text: '在村里挂个横幅，拍几张照片就回城',
        hint: '交差容易，口碑难挣',
        fx: { stats: { 政绩: 1, 口碑: -4, 廉政: -2 } },
        result: '照片上了单位的内刊，配文是“深入基层”。只有你自己知道，你连村东头那条路都没走完。'
      },
      {
        text: '自掏腰包给村里修一口井',
        hint: '花钱不多，但能记一辈子',
        fx: { stats: { 口碑: 5, 廉政: 2, 政绩: 2, 亲情: -2 } },
        result: '井水冒出来的那天，孩子们围着井台又跳又叫。村支书说，这口井，村里人会记你的好。'
      }
    ]
  },
  {
    id: 'neighbor-gone', year: 2014, cat: '廉政状况', title: '隔壁办公室空了',
    text: '隔壁科室的老周被纪委带走了。上周他还在食堂跟你讨论孩子上学的事。有人说他收了开发商的钱，也有人说他只是替人背了锅。办公室里的空气突然变得很安静。',
    quote: '雪崩的时候，没有一片雪花是无辜的。',
    choices: [
      {
        text: '主动配合调查，把自己知道的说清楚',
        hint: '配合组织，但可能得罪同事',
        fx: { stats: { 廉政: 4, 人脉: -2 }, risk: -4 },
        result: '你在谈话室里坐了三个小时，把知道的和盘托出。出来时，走廊尽头的灯正好灭了。'
      },
      {
        text: '装作什么都不知道',
        hint: '最安全，也最危险',
        fx: { stats: { 廉政: -2 }, risk: 2 },
        result: '你照常上班，照常打招呼。只是每次经过那间空办公室，你都会不自觉放轻脚步。'
      },
      {
        text: '把老周以前送你的烟酒交到纪检组',
        hint: '主动切割，代价是人情',
        fx: { stats: { 廉政: 6, 人脉: -3 }, risk: -6 },
        result: '纪检组的人收下东西，给你开了张收据。你把它夹在笔记本里，像夹着一道护身符。'
      }
    ]
  },
  {
    id: 'zhao-dehan', year: 2015, cat: '廉政状况', title: '小官巨贪',
    text: '部委项目处处长赵德汉被带走时，办案人员在他别墅里搜出两亿多元现金。电视里，他哭着说自己是农民的儿子。办公室一片沉默，有人悄悄把桌上的购物卡塞进了抽屉。',
    quote: '“我是农民的儿子……”',
    choices: [
      {
        text: '主动清退这些年收下的礼金',
        hint: '心里踏实，但会被人议论',
        fx: { stats: { 廉政: 8, 口碑: 3 }, risk: -8 },
        result: '你把一张张购物卡登记造册，交到了纪检组。有人笑你傻，但那天晚上，你睡得格外沉。'
      },
      {
        text: '把购物卡悄悄处理掉，装作无事',
        hint: '保住人脉，风险暗藏',
        fx: { stats: { 廉政: -4, 人脉: 2 }, risk: 6 },
        result: '抽屉空了，可你知道，有些东西一旦沾上，就再也擦不干净。'
      },
      {
        text: '借机举报单位里的送礼风气',
        hint: '可能得罪一批人',
        fx: { stats: { 廉政: 5, 口碑: 4, 人脉: -6 }, risk: -5 },
        result: '举报信递上去的第三天，单位里的笑声少了，投向你的目光多了。'
      }
    ]
  },
  {
    id: 'ding-call', year: 2015, cat: '汉东风云', title: '一个电话', crossroad: true,
    text: '深夜，你在光明区的一位老同学打来电话，声音发抖：“丁市长的事，你知道了吧？明天的会，你千万别多说话。有人让我问你，那份材料还在不在你手里。”窗外，市委大楼的灯还亮着。',
    quote: '有些人跑了，留下的人要替他收拾残局。',
    choices: [
      {
        text: '挂断电话，立刻向组织报告',
        hint: '投向沙瑞金，走清廉路线',
        fx: { stats: { 廉政: 8, 口碑: 3, 人脉: -5 }, risk: -8, rel: { 沙瑞金: 5 }, meet: ['沙瑞金'], align: '沙', loyalty: 8 },
        result: '你把材料交给了组织，并写了一份情况说明。几天后，你在省委大院远远看见沙瑞金，他朝你点了一下头。'
      },
      {
        text: '把材料锁进抽屉，装作没接到电话',
        hint: '暂时安全，但把柄留下了',
        fx: { stats: { 廉政: -4, 人脉: 3 }, risk: 8, loyalty: -3 },
        result: '抽屉锁上了。可从那以后，每次有人敲门，你都会先看一眼门缝。'
      },
      {
        text: '把材料交给高育良，请他“指点”',
        hint: '投靠政法系，风险与机会并存',
        fx: { stats: { 廉政: -6, 人脉: 3 }, risk: 6, rel: { 高育良: 8 }, meet: ['高育良'], align: '高', loyalty: 10 },
        result: '高育良看完材料，只说了句“知道了”。他的语气很平静，平静得让你后背发凉。'
      }
    ]
  },
  {
    id: 'factory-fire', year: 2015, cat: '突发事件', title: '火光里的选择', crossroad: true,
    text: '凌晨，大风厂拆迁现场燃起大火。工人和拆迁队对峙，有人受伤。朋友圈里全是火光视频。值班电话响个不停，领导让你“先稳住，别让媒体乱写”。',
    quote: '大火照见的，不只是夜色。',
    choices: [
      {
        text: '赶到现场，先组织救人',
        hint: '群众看着，良心也看着',
        fx: { stats: { 口碑: 8, 政绩: 3, 健康: -2 }, rel: { 陈岩石: 6, 李达康: 2 }, meet: ['陈岩石', '李达康'] },
        result: '你在现场守了一夜，帮着抬伤员、疏散群众。天亮时，陈岩石老人拍了拍你的肩：“小伙子，像样。”'
      },
      {
        text: '按领导要求，先控制舆情',
        hint: '执行命令，站到李达康一边',
        fx: { stats: { 政绩: 2, 口碑: -5, 廉政: -2 }, rel: { 李达康: 4 }, meet: ['李达康'], align: '李', loyalty: 8 },
        result: '视频被压了下去，现场也安静了。可工人们看你的眼神，像看一堵墙。'
      },
      {
        text: '支持工人依法维权，替他们找律师',
        hint: '站在群众一边，沙瑞金会记你一功',
        fx: { stats: { 口碑: 6, 政绩: -1, 人脉: -4, 廉政: 3 }, rel: { 陈岩石: 4 }, meet: ['陈岩石'], align: '沙', loyalty: 4 },
        result: '你帮工人联系了法律援助。开发商的人放话，说你不识抬举。你没回应，只是把工人的诉求一条条记了下来。'
      }
    ]
  },
  {
    id: 'chen-hai', year: 2016, cat: '汉东风云', title: '病房外的走廊',
    text: '省检察院反贪局局长陈海出了车祸，重度昏迷。陈岩石老人坐在 ICU 门外，手里攥着一封举报信。有人劝你：“这事水太深，别掺和。”',
    quote: '有些案子，是拿命在办。',
    choices: [
      {
        text: '留下来陪老人，帮他联系医生',
        hint: '不图什么，只图心安',
        fx: { stats: { 口碑: 5, 亲情: 3, 廉政: 3 }, rel: { 陈岩石: 8 }, meet: ['陈岩石'] },
        result: '你在医院走廊陪陈岩石坐到天亮。老人没怎么说话，只把举报信往你手里塞了塞。'
      },
      {
        text: '送个花圈就走，保持距离',
        hint: '不得罪人，也不沾麻烦',
        fx: { stats: { 人脉: 2, 口碑: -2 } },
        result: '花圈摆在病房门口，你转身离开。走廊很长，你走得很快。'
      },
      {
        text: '把陈海此前给你的线索交给侯亮平',
        hint: '把自己放进棋局，押注沙瑞金',
        fx: { stats: { 廉政: 6 }, risk: 4, rel: { 侯亮平: 8, 沙瑞金: 3 }, meet: ['侯亮平', '沙瑞金'], align: '沙', loyalty: 6 },
        result: '侯亮平看完线索，抬头看了你一眼：“你知不知道，这东西交出来，你就回不了头了？”你点了点头。'
      }
    ]
  },
  {
    id: 'hou-arrives', year: 2016, cat: '汉东风云', title: '新来的反贪局长',
    text: '侯亮平调任汉东省检察院反贪局局长。他请你喝茶，开门见山：“你在光明区待过，大风厂的事，你知道多少？”茶杯里的热气缓缓升起。',
    quote: '“猴子”来了，汉东的水要浑一阵子。',
    choices: [
      {
        text: '把自己知道的全部说出来',
        hint: '配合调查，押注沙瑞金',
        fx: { stats: { 廉政: 5, 人脉: -3 }, risk: -3, rel: { 侯亮平: 8, 沙瑞金: 4 }, meet: ['侯亮平', '沙瑞金'], align: '沙', loyalty: 6 },
        result: '你讲了两个多小时。侯亮平没打断你，只在最后说：“谢谢你，同志。”'
      },
      {
        text: '只说公开信息，不碰敏感部分',
        hint: '安全，但也不会被记住',
        fx: { stats: { 廉政: 1, 人脉: 1 }, rel: { 侯亮平: 2 }, meet: ['侯亮平'] },
        result: '侯亮平笑了笑，把茶喝完。你知道，他没信，也没打算逼你。'
      },
      {
        text: '替山水集团说几句好话',
        hint: '向高育良的圈子靠拢',
        fx: { stats: { 廉政: -6 }, risk: 6, rel: { 高小琴: 6 }, meet: ['高小琴'], align: '高', loyalty: 6 },
        result: '你说了几句“高总也不容易”。侯亮平没接话，只是把茶杯轻轻放下。'
      }
    ]
  },
  {
    id: 'shanshui', year: 2016, cat: '廉政状况', title: '山水有约', crossroad: true,
    text: '高小琴托人送来一张请柬，山水庄园的晚宴，作陪的有几位你叫得上名字的老板。请柬里还夹着一张不记名卡。秘书低声说：“高总说，只是交个朋友。”',
    quote: '山水庄园的灯，照得见人，也照得见鬼。',
    choices: [
      {
        text: '赴宴，但把卡退回去',
        hint: '给人面子，不给自己留把柄',
        fx: { stats: { 人脉: 4, 廉政: -1 }, risk: 2, rel: { 高小琴: 4 }, meet: ['高小琴'], loyalty: 2 },
        result: '宴席上，高小琴笑盈盈地接过卡，像什么都没发生。她说：“同志是个明白人。”'
      },
      {
        text: '婉拒，托人带一句“改日再叙”',
        hint: '不给面子，也不给机会',
        fx: { stats: { 人脉: -2, 廉政: 3 }, rel: { 高小琴: -2 }, meet: ['高小琴'], loyalty: 2 },
        result: '请柬退回去了。第二天，你发现自己负责的一个项目，突然多了几道审批程序。'
      },
      {
        text: '赴宴，收下卡',
        hint: '一步踏错，步步难回；高育良的圈子会接纳你',
        fx: { stats: { 人脉: 6, 廉政: -10 }, risk: 12, rel: { 高小琴: 8 }, meet: ['高小琴'], align: '高', loyalty: 8 },
        result: '卡很轻，揣在口袋里却像一块石头。回家的路上，你第一次觉得京州的夜这么长。'
      },
      {
        text: '带着录音笔赴宴，把谈话录下来',
        hint: '险棋，但可能成为关键证据；押注沙瑞金',
        fx: { stats: { 廉政: 4 }, risk: 5, rel: { 高小琴: -4, 沙瑞金: 4 }, meet: ['高小琴', '沙瑞金'], align: '沙', loyalty: 8, flags: { recorded: true } },
        result: '你把录音笔藏在袖口里，听高小琴谈笑风生。回家后，你把录音锁进了保险柜。'
      }
    ]
  },
  {
    id: 'lone-eagle', year: 2017, cat: '汉东风云', title: '孤鹰岭的枪声', crossroad: true,
    text: '祁同伟被围在孤鹰岭。省公安厅的警灯把山路照得惨白。有人主张强攻，有人主张谈判。你站在指挥车外，听见对讲机里传来他沙哑的声音：“我祁同伟，从来不服输。”',
    quote: '胜天半子，终究还是输了。',
    choices: [
      {
        text: '建议谈判，给老同学留一条回头路',
        hint: '讲人情，但可能被视作立场不稳',
        fx: { stats: { 口碑: 4, 廉政: 2 }, rel: { 祁同伟: 6, 沙瑞金: -2 }, meet: ['祁同伟'], loyalty: -2 },
        result: '你拿起对讲机，喊了一声“同伟”。对面沉默了很久，只回了一句：“晚了。”'
      },
      {
        text: '支持依法强攻，绝不姑息',
        hint: '立场鲜明，但旧情难再',
        fx: { stats: { 政绩: 3, 廉政: 4 }, rel: { 沙瑞金: 5, 祁同伟: -10 }, meet: ['祁同伟', '沙瑞金'], align: '沙', loyalty: 8 },
        result: '你签了字。枪声响起的时候，你转过身，没有看山上的方向。'
      },
      {
        text: '远远看着，不表态',
        hint: '不沾因果，也不会被记住',
        fx: { stats: { 人脉: 1, 廉政: -1 }, loyalty: -3 },
        result: '你站在人群后面，看着警灯一盏盏熄灭。第二天，关于这一夜的讨论铺天盖地，没有人提到你。'
      }
    ]
  },
  {
    id: 'gao-falls', year: 2017, cat: '汉东风云', title: '老师倒了', crossroad: true,
    text: '高育良被带走的消息在省委大院传开。你曾在他门下听过课，也曾在他家吃过师母做的红烧肉。现在，他的办公室门口贴着封条，走廊里没人敢停下脚步。',
    quote: '讲了一辈子明史，终究没看懂自己的结局。',
    choices: [
      {
        text: '主动向组织说明与高育良的往来',
        hint: '切割干净，也斩断旧情',
        fx: { stats: { 廉政: 6 }, risk: -10, rel: { 高育良: -10, 沙瑞金: 4 }, align: '沙', loyalty: 8 },
        result: '你把和高育良的每一次见面、每一句话都写了下来。写到最后，你发现自己其实并不了解这位老师。'
      },
      {
        text: '念师生情，去家里看望吴慧芬',
        hint: '人情难却，风险难料',
        fx: { stats: { 亲情: 2, 口碑: -2 }, risk: 4, rel: { 高育良: 6, 吴慧芬: 8 }, meet: ['吴慧芬'] },
        result: '吴慧芬给你倒了杯茶，说：“他讲明史的时候，总说历史是任人打扮的小姑娘。现在轮到别人打扮他了。”'
      },
      {
        text: '划清界限，在会议上公开表态',
        hint: '政治正确，但会被人说不厚道',
        fx: { stats: { 廉政: 3, 人脉: -3 }, rel: { 高育良: -8, 沙瑞金: 3 }, align: '沙', loyalty: 6 },
        result: '你在会上表了态，措辞很标准。散会后，没有人跟你说话，但你知道，有些人记住了你的立场。'
      }
    ]
  },
  {
    id: 'supervision', year: 2018, cat: '体制改革', title: '新牌子',
    text: '监察委员会挂牌，纪委和监委合署办公。原来检察院反贪局的同事转隶过来，办公桌还没摆好，案子已经堆了一摞。',
    quote: '牌子换了，刀没有钝。',
    choices: [
      {
        text: '主动申请转隶到监委',
        hint: '站到反腐第一线',
        fx: { stats: { 廉政: 4, 能力: 3 }, rel: { 田国富: 5 }, meet: ['田国富'] },
        result: '你成了监委的第一批干部。办公桌上摆着新牌子，也摆着一摞还没来得及看的举报信。'
      },
      {
        text: '留在原单位，继续做业务',
        hint: '不折腾，把手头的事做好',
        fx: { stats: { 政绩: 3, 人脉: 2 } },
        result: '你没有走。旧同事来告别时，你帮他们把办公室收拾干净，像送走一段旧时光。'
      },
      {
        text: '推荐一个信得过的年轻人去',
        hint: '成全别人，也结下一份善缘',
        fx: { stats: { 人脉: 4, 口碑: 2 } },
        result: '你推荐了单位里最能干的年轻人。他走的那天，给你鞠了一躬。'
      }
    ]
  },
  {
    id: 'crime-crackdown', year: 2019, cat: '专项斗争', title: '打伞破网',
    text: '扫黑除恶专项斗争进入深水区。你分管的一个项目，背后牵出一家涉黑物业公司。老板托人带话：“做事留一线，日后好相见。”',
    quote: '伞不破，网不收。',
    choices: [
      {
        text: '一查到底，连保护伞一起挖',
        hint: '动真格，会得罪很多人',
        fx: { stats: { 政绩: 5, 廉政: 5, 人脉: -5 }, risk: 4, rel: { 沙瑞金: 4 } },
        result: '专案组进驻的第三天，有人往你家门口放了一封信。你把信交给组织，继续查。'
      },
      {
        text: '只处理表面问题，交差了事',
        hint: '平安无事，但根子还在',
        fx: { stats: { 政绩: 1, 廉政: -4 }, risk: 3 },
        result: '案子结了，老板换了家公司，继续做生意。你知道，这事没完。'
      },
      {
        text: '把线索转给纪委，自己退到幕后',
        hint: '借力打力，保护自己',
        fx: { stats: { 廉政: 3, 政绩: 2, 人脉: -1 }, rel: { 田国富: 3 } },
        result: '你把线索整理成一份材料，悄悄送到了纪委。一个月后，那家物业公司换了法人。'
      }
    ]
  },
  {
    id: 'pandemic', year: 2020, cat: '大考', title: '大考',
    text: '突发公共卫生事件，全市进入应急状态。你负责的片区有小区被封控，居民在群里抢菜，基层干部连轴转。上面要求“零感染”，下面有人开始弄虚作假。',
    quote: '大考面前，最见人心。',
    choices: [
      {
        text: '到一线去，先解决居民吃饭和就医',
        hint: '最累，也最得人心',
        fx: { stats: { 口碑: 7, 政绩: 4, 健康: -3, 亲情: -2 } },
        result: '你在小区门口守了二十多天，手机里存了几十个居民的求助电话。解封那天，有人给你送来一面锦旗。'
      },
      {
        text: '把报表做漂亮，确保“零感染”',
        hint: '数字好看，良心难安',
        fx: { stats: { 政绩: 2, 口碑: -4, 廉政: -3 }, risk: 3 },
        result: '报表上的数字很漂亮。可是你每次路过那个被封的小区，都不敢抬头看楼上的窗户。'
      },
      {
        text: '如实上报困难，请求支援',
        hint: '不逞强，也不瞒报',
        fx: { stats: { 政绩: 2, 口碑: 4, 廉政: 3, 人脉: -1 } },
        result: '你把缺口一条条列出来，报了上去。上级调来了物资，也记住了你这个“敢说真话”的人。'
      }
    ]
  },
  {
    id: 'rural-revival', year: 2021, cat: '乡村振兴', title: '山乡巨变',
    text: '脱贫攻坚收官，乡村振兴接续。你联系的村子靠种茶脱了贫，但年轻人还是往外跑。村支书问你：“路修好了，产业怎么办？”',
    quote: '脱贫不是终点，是新生活的起点。',
    choices: [
      {
        text: '引进龙头企业，做品牌',
        hint: '见效快，但要防资本下乡伤农',
        fx: { stats: { 政绩: 5, 人脉: 3, 廉政: -2 }, risk: 2 },
        result: '龙头企业进了村，茶厂建起来了。签约那天，村支书笑得合不拢嘴，你也多了几分警惕。'
      },
      {
        text: '扶持合作社，让村民自己干',
        hint: '慢一些，但根扎得深',
        fx: { stats: { 口碑: 5, 政绩: 3, 廉政: 2 } },
        result: '合作社第一次分红，村民们排着队签字。有人把第一杯新茶端给你，说：“这是咱自己的茶。”'
      },
      {
        text: '搞一个示范点，先把场面撑起来',
        hint: '好看，但不一定好用',
        fx: { stats: { 政绩: 2, 口碑: -2, 廉政: -1 } },
        result: '示范点建得很漂亮，领导来了三拨。可示范点之外的村子，还是老样子。'
      }
    ]
  },
  {
    id: 'election', year: 2022, cat: '换届', title: '换届之年', crossroad: true,
    text: '五年一次的换届考察开始。有人开始频繁往省城跑，有人在饭桌上打听“上面的意思”。你的名字出现在一份推荐名单上，也出现在一封匿名举报信里。',
    quote: '换届是一面镜子，照见人心。',
    choices: [
      {
        text: '不跑不要，把工作做好',
        hint: '相信组织，也相信自己',
        fx: { stats: { 政绩: 4, 口碑: 3, 廉政: 3, 人脉: -2 } },
        result: '你没有去省城。考察组来的那天，你照常下基层，回来时裤腿上还沾着泥。'
      },
      {
        text: '去找老领导“汇报思想”',
        hint: '走动走动，或许有用',
        fx: { stats: { 人脉: 5, 廉政: -2 }, factionVisit: true, loyalty: 4 },
        result: '老领导听完你的汇报，只说了一句“组织会考虑”。你从办公室出来，心里却没底。'
      },
      {
        text: '追查那封举报信，看看是谁在背后捅刀',
        hint: '出了口气，也可能结下死仇',
        fx: { stats: { 人脉: -4, 口碑: -2 }, risk: 3 },
        result: '你查到了写信的人，是朝夕相处的同事。你没有声张，但从那以后，你们再也没一起吃过饭。'
      }
    ]
  },
  {
    id: 'environment', year: 2023, cat: '环保督察', title: '绿水青山',
    text: '中央环保督察组进驻汉东。你主政的地方有一家纳税大户，排污不达标，但解决了上千人就业。老板连夜来找你，手里拿着一份“整改方案”和一箱现金。',
    quote: '绿水青山，就是金山银山。',
    choices: [
      {
        text: '依法关停整改，绝不手软',
        hint: '得罪老板，但守住了底线',
        fx: { stats: { 政绩: 4, 廉政: 6, 口碑: 3, 人脉: -5 }, risk: -3 },
        result: '企业关了，工人暂时回了家。你协调了转岗培训，挨了不少骂，但督察组的反馈意见里，你的名字后面是“整改有力”。'
      },
      {
        text: '先收下钱，再让他“边生产边整改”',
        hint: '一时之利，滔天之祸',
        fx: { stats: { 廉政: -10, 人脉: 4 }, risk: 12 },
        result: '钱收下了，烟囱照常冒烟。三个月后，督察组杀了个回马枪。'
      },
      {
        text: '帮他找专家做技术升级，限期达标',
        hint: '既要环保，也要饭碗',
        fx: { stats: { 政绩: 5, 口碑: 2, 廉政: 1, 能力: 2 } },
        result: '你请来专家，帮企业改了工艺。半年后，排污达标了，订单也保住了。老板说：“你是真办事的人。”'
      }
    ]
  },
  {
    id: 'inspection', year: 2025, cat: '巡视', title: '巡视利剑',
    text: '省委巡视组进驻你所在的单位。动员会上，组长说：“这次巡视，既要发现问题，也要保护干部。”台下有人低头记笔记，有人手心出汗。',
    quote: '巡视是政治体检，不是请客吃饭。',
    choices: [
      {
        text: '主动汇报自己工作中的问题',
        hint: '早说早主动，但会影响考评',
        fx: { stats: { 廉政: 5, 政绩: -1 }, risk: -8, rel: { 沙瑞金: 4 } },
        result: '你把自己工作中的失误一条条摆出来。巡视组长听完，说：“能主动说，说明还有救。”'
      },
      {
        text: '把问题藏起来，等巡视组走',
        hint: '赌一把，输赢难料',
        fx: { stats: { 廉政: -4 }, risk: 10 },
        result: '巡视组走了，你松了口气。可你知道，他们留下了一份问题清单，也留下了一双眼睛。'
      },
      {
        text: '借巡视之力，整顿单位里的老问题',
        hint: '借势而为，会得罪既得利益者',
        fx: { stats: { 政绩: 4, 廉政: 4, 人脉: -4 } },
        result: '你借着巡视的势头，把几个久拖不决的问题摆上了桌面。有人拍手，有人咬牙。'
      }
    ]
  },
  {
    id: 'sha-li', year: 2026, cat: '仕途抉择', title: '沙李配局', crossroad: true, cond: (s) => s.player.rank >= 4,
    text: '沙瑞金与李达康的政治博弈浮出水面。省部级政治格局深刻变动，你的每一次表态都分量千钧。常委会上，两人为一个重大项目各执一词，所有人的目光都落在你身上。',
    quote: '站队是一门学问，不站队也是一门学问。',
    choices: [
      {
        text: '靠向沙瑞金',
        hint: '跟紧省委书记，走清廉实干路线',
        fx: { stats: { 廉政: 3 }, risk: -3, rel: { 沙瑞金: 10, 李达康: -6 }, meet: ['沙瑞金', '李达康'], align: '沙', loyalty: 12 },
        result: '你在会上表了态，支持沙瑞金的意见。散会后，李达康从你身边走过，没有看你。'
      },
      {
        text: '靠向李达康',
        hint: '跟紧京州的发展派，政绩优先',
        fx: { stats: { 政绩: 3 }, rel: { 李达康: 10, 沙瑞金: -6 }, meet: ['沙瑞金', '李达康'], align: '李', loyalty: 12 },
        result: '你站在了李达康一边。他拍了拍你的肩：“京州就需要你这样的干部。”'
      },
      {
        text: '周旋于两派',
        hint: '谁也不得罪，但谁都不完全信你',
        fx: { stats: { 人脉: 4, 口碑: -2 }, rel: { 沙瑞金: 2, 李达康: 2 }, meet: ['沙瑞金', '李达康'], align: '中立', loyalty: 0 },
        result: '你说了一堆两边都不得罪的话。会议结束了，项目没定，你的立场也没定。'
      },
      {
        text: '只谈方案，不谈站队',
        hint: '用专业说话，可能两边都不讨好',
        fx: { stats: { 政绩: 3, 廉政: 2, 人脉: -2 }, rel: { 沙瑞金: 3, 李达康: 3 }, meet: ['沙瑞金', '李达康'], align: '中立', loyalty: 2 },
        result: '你把方案讲得很细，数据、风险、收益，一条条摆开。沙瑞金点了点头，李达康也难得没有反驳。'
      }
    ]
  },
  {
    id: 'zhao-shadow', year: 2028, cat: '汉东风云', title: '赵家的影子', crossroad: true,
    text: '赵立春案余波未平。赵瑞龙昔日的生意伙伴找到你，希望你在一个项目审批上“抬抬手”。他带来一句话：“赵家虽然倒了，但汉东的生意，还得有人做。”',
    quote: '树倒了，影子还在。',
    choices: [
      {
        text: '严词拒绝，把情况报告组织',
        hint: '斩断旧网，可能被报复',
        fx: { stats: { 廉政: 6, 人脉: -3 }, risk: -5, rel: { 沙瑞金: 4 }, align: '沙', loyalty: 6 },
        result: '你把谈话记录交给了组织。几天后，那个老板的公司被列入了重点监管名单。'
      },
      {
        text: '不置可否，先拖一拖',
        hint: '不得罪，也不答应',
        fx: { stats: { 廉政: -2 }, risk: 3, loyalty: -4 },
        result: '你说“研究研究”。对方笑着走了。你知道，这句“研究研究”，他还会再来问。'
      },
      {
        text: '收下他递来的“股份”',
        hint: '与赵家的影子共舞，凶多吉少',
        fx: { stats: { 廉政: -10, 人脉: 5 }, risk: 12, rel: { 赵瑞龙: 8 }, meet: ['赵瑞龙'] },
        result: '股份协议签得很隐蔽。你告诉自己，只是一次投资。可你心里清楚，从签字那一刻起，你就成了别人棋盘上的子。'
      }
    ]
  },
  {
    id: 'govern', year: 2030, cat: '主政一方', title: '主政一方', crossroad: true, cond: (s) => s.player.rank >= 5,
    text: '组织决定让你主政一方。上任第一天，摆在桌上的是三份材料：一份财政缺口报告，一份群众信访积案，一份关于你前任的举报信。秘书问：“先看哪一份？”',
    quote: '一把手，就是最后兜底的那个人。',
    choices: [
      {
        text: '先看信访积案，群众的事最大',
        hint: '得民心，但财政窟窿还在',
        fx: { stats: { 口碑: 6, 政绩: 3, 廉政: 3 } },
        result: '你花了三天接待上访群众，把最难的几个案子揽在自己身上。财政报告还压在桌上，但你知道，人心比数字更要紧。'
      },
      {
        text: '先看财政缺口，没有钱什么都干不了',
        hint: '务实，但容易忽略群众感受',
        fx: { stats: { 政绩: 5, 人脉: 2, 廉政: -1 } },
        result: '你连夜召集财政、发改开会，先保工资、保运转、保民生。项目可以慢一点，但政府不能停摆。'
      },
      {
        text: '先看举报信，弄清前任留下了什么雷',
        hint: '谨慎，可能得罪前任的旧部',
        fx: { stats: { 能力: 4, 人脉: -2 }, risk: -5 },
        result: '举报信里提到了三个项目、五个人。你把材料锁进保险柜，决定先摸清情况，再动刀子。'
      }
    ]
  },
  {
    id: 'central-inspection', year: 2035, cat: '巡视', title: '京城来人', crossroad: true, cond: (s) => s.player.rank >= 6,
    text: '中央巡视组进驻汉东，重点是“一把手”和领导班子。你主政的地方被列为延伸巡视对象。深夜，你把这几年经手的重点项目在脑子里过了一遍。',
    quote: '越往高处走，越要如履薄冰。',
    choices: [
      {
        text: '主动说明问题，配合巡视',
        hint: '坦白可能疼，但能保命',
        fx: { stats: { 廉政: 5, 政绩: -2 }, risk: -8 },
        result: '你把该说的都说了。巡视组的人合上笔记本，说：“谢谢你的配合。”你走出房间，发现后背已经湿透。'
      },
      {
        text: '让下面的人“统一口径”',
        hint: '掩盖问题，往往问题更大',
        fx: { stats: { 廉政: -6, 人脉: -2 }, risk: 12 },
        result: '你打了一圈电话。可你忘了，电话那头的人，也在给自己留后路。'
      },
      {
        text: '把巡视当成一次整改机会，全面自查',
        hint: '主动整改，化危为机',
        fx: { stats: { 政绩: 4, 廉政: 4, 口碑: 2 }, risk: -4 },
        result: '你牵头成立了整改专班，把问题清单一条条销号。巡视结束时，组长说：“你们这里，动了真格。”'
      }
    ]
  },
  {
    id: 'handover', year: 2040, cat: '交班', title: '交班', crossroad: true, cond: (s) => s.player.rank >= 7,
    text: '你到了要交班的年纪。组织找你谈话，问你有没有合适的接班人。窗外，汉东的夜色一如既往。你想起自己刚参加工作时，也是在这样的夜里加班写材料。',
    quote: '铁打的营盘，流水的兵。',
    choices: [
      {
        text: '推荐那个最能干、但不太听话的年轻人',
        hint: '为事业选人，不为私心选人',
        fx: { stats: { 口碑: 4, 廉政: 3, 人脉: -2 } },
        result: '你说出了那个年轻人的名字，也说了他的缺点。组织部长笑了笑：“难得你肯说真话。”'
      },
      {
        text: '推荐自己的老部下',
        hint: '知根知底，但也容易结党',
        fx: { stats: { 人脉: 5, 口碑: -2 }, risk: 3 },
        result: '老部下接任后，逢年过节都会来看你。你心里欣慰，也隐隐有些不安。'
      },
      {
        text: '服从组织安排，不推荐任何人',
        hint: '干净利落，把选择交给组织',
        fx: { stats: { 廉政: 2, 人脉: -1 }, rel: { 沙瑞金: 3 } },
        result: '你说：“组织定谁，我都支持。”谈话很快结束，你走出大楼，发现天已经亮了。'
      }
    ]
  }
];

/* ---------------- 随机事件 ---------------- */
const RANDOM_EVENTS = [
  {
    id: 'tea-box', cat: '廉政状况', title: '茶叶盒', weight: 10,
    text: '一个做工程的老板来办公室汇报工作，临走时留下一个茶叶盒。你掂了掂，分量不对。打开一看，里面码着整整齐齐的现金。',
    quote: '所有的礼物，都在暗中标好了价格。',
    choices: [
      { text: '原封不动退回去，并记下这件事', hint: '守住底线，可能得罪人', fx: { stats: { 廉政: 6, 口碑: 2 }, risk: -6 }, result: '你把茶叶盒塞回他怀里。他脸上的笑僵了一下，从此再没来过你的办公室。' },
      { text: '收下，先放在柜子里', hint: '一时贪念，后患无穷', fx: { stats: { 廉政: -10, 人脉: 4 }, risk: 12 }, result: '柜子锁上了，可你每次经过，都觉得那里面有一双眼睛。' },
      { text: '上交纪检组，说明情况', hint: '最稳妥，也最得罪人', fx: { stats: { 廉政: 8, 口碑: 3, 人脉: -4 }, risk: -10, rel: { 田国富: 4 } }, result: '纪检组做了登记。消息传开后，找你“汇报工作”的人少了一半。' }
    ]
  },
  {
    id: 'old-classmate', cat: '人情', title: '老同学', weight: 8,
    text: '大学同学聚会，混得最好的那位端着酒杯坐到你身边。他说自己公司最近有个项目，卡在你分管的部门，“老同学，抬抬手”。',
    quote: '同学情是真的，利益也是真的。',
    choices: [
      { text: '帮他打个招呼', hint: '人情到位，风险也到位', fx: { stats: { 人脉: 4, 廉政: -4 }, risk: 5 }, result: '你打了一个电话。项目很快批了，老同学在群里发了个大红包，你没领。' },
      { text: '婉拒，让他按程序报', hint: '不给面子，但守住规矩', fx: { stats: { 人脉: -2, 廉政: 3 } }, result: '你说：“按程序报，符合条件我一定支持。”老同学笑了笑，酒没喝完就走了。' },
      { text: '把情况报告纪检组', hint: '最决绝，也最伤人情', fx: { stats: { 廉政: 4, 人脉: -5 }, risk: -2 }, result: '你把事情原原本本报告了。老同学从此没再联系你，同学群里也少了你的名字。' }
    ]
  },
  {
    id: 'democratic-eval', cat: '组织考察', title: '民主测评', weight: 8, cond: (s) => s.player.rank >= 2,
    text: '单位进行民主测评。测评前两天，有人开始挨个办公室串门，话里话外都是“互相支持”。你的名字也在候选名单上。',
    quote: '测评表上画的是勾，背后是人情。',
    choices: [
      { text: '也去走动走动，拉几张票', hint: '现实，但不够体面', fx: { stats: { 人脉: 4, 口碑: -3 }, risk: 3 }, result: '你走了几间办公室，说了些言不由衷的话。测评结果不错，但你总觉得那张表不干净。' },
      { text: '顺其自然，不拉票', hint: '相信群众的眼睛', fx: { stats: { 口碑: 2, 廉政: 2 } }, result: '你没有串门。测评结果出来，你的票数不算最高，但都是实打实的。' },
      { text: '把拉票的情况反映给考察组', hint: '得罪人，但维护了规则', fx: { stats: { 廉政: 4, 人脉: -3 } }, result: '考察组找了几个人谈话。拉票的风气刹住了，你也成了某些人眼里的“刺头”。' }
    ]
  },
  {
    id: 'reporter', cat: '媒体', title: '记者来访', weight: 7,
    text: '省台记者来采访你负责的民生项目。镜头已经架好，记者笑着问：“听说这个项目推进过程中，也有一些争议，您怎么看？”',
    quote: '镜头前面，最难的是说真话。',
    choices: [
      { text: '高调宣传成绩，争议一笔带过', hint: '好看，但经不起追问', fx: { stats: { 政绩: 3, 口碑: 2 }, risk: 2 }, result: '新闻播出后，项目成了典型。可评论区里，有人问了一句：“拆迁户安置了吗？”' },
      { text: '低调回应，只讲事实', hint: '不出彩，也不出错', fx: { stats: { 政绩: 1, 廉政: 2 } }, result: '你只讲了项目进度和资金使用情况。记者有些失望，但稿子写得很稳。' },
      { text: '如实说明问题，包括不足', hint: '真诚，但可能被做文章', fx: { stats: { 口碑: 5, 政绩: 1, 人脉: -2 } }, result: '你说了项目的难处，也说了下一步打算。节目播出后，有群众留言：“这个干部说的是人话。”' }
    ]
  },
  {
    id: 'demolition', cat: '群众工作', title: '门口的拆迁户', weight: 8, cond: (s) => s.player.rank >= 2,
    text: '一大早，一个拆迁户跪在单位门口，手里举着“还我家园”的纸牌。保安要拉人，围观的人越来越多。',
    quote: '群众跪下的地方，干部的脸就挂在那里。',
    choices: [
      { text: '把人请进办公室，听他讲完', hint: '费时间，但能化解矛盾', fx: { stats: { 口碑: 6, 政绩: 2, 健康: -1 } }, result: '你听了两个小时，记了满满三页纸。临走时，那人给你鞠了一躬：“你是第一个听我说完的。”' },
      { text: '让保安把人带走', hint: '场面安静了，人心凉了', fx: { stats: { 口碑: -6, 廉政: -3 }, risk: 4 }, result: '人被带走了。可当天下午，那段视频就在网上传开了。' },
      { text: '把问题上报，等领导批示', hint: '按程序办，但群众等不起', fx: { stats: { 政绩: 1, 口碑: -1 } }, result: '报告递上去了，批示还没下来。那个人在门口坐了一整天。' }
    ]
  },
  {
    id: 'site-accident', cat: '突发事件', title: '工地事故', weight: 6, cond: (s) => s.player.rank >= 2,
    text: '你分管的项目工地发生事故，两名工人受伤。项目经理打电话来，声音发颤：“领导，现场已经处理了，能不能先不上报？”',
    quote: '事故面前，瞒报比事故更可怕。',
    choices: [
      { text: '第一时间赶到现场，按规定上报', hint: '承担责任，不遮掩', fx: { stats: { 政绩: 3, 口碑: 4, 健康: -2 }, risk: -3 }, result: '你在现场守到深夜，伤员脱离了危险。通报发出去后，有人骂你，也有人说你“像个干部”。' },
      { text: '同意先“内部处理”', hint: '暂时压住，后患无穷', fx: { stats: { 政绩: -1, 廉政: -5 }, risk: 8 }, result: '事情压了三天，第四天被家属发到了网上。你再去现场时，围了更多的人。' },
      { text: '严肃追责，整顿工地', hint: '立规矩，但会得罪施工方', fx: { stats: { 廉政: 4, 口碑: 2, 人脉: -3 } }, result: '你停了工，查了责任。施工方老板放话要“讨个说法”，你没理他。' }
    ]
  },
  {
    id: 'health-check', cat: '家风家事', title: '体检报告', weight: 6, cond: (s) => s.player.age >= 40,
    text: '体检报告出来了，医生把你叫到一边：“血压、血脂都偏高，再这么熬下去，迟早要出问题。建议住院观察。”',
    quote: '身体垮了，什么都是别人的。',
    choices: [
      { text: '听医生的，住院调理', hint: '耽误工作，但保命要紧', fx: { stats: { 健康: 6, 政绩: -2, 亲情: 2 } }, result: '你在医院住了十天。病房里没有电话，没有文件，你第一次睡了个整觉。' },
      { text: '把报告收起来，继续上班', hint: '工作要紧，身体再说', fx: { stats: { 健康: -5, 政绩: 1 } }, result: '你把报告塞进抽屉，继续开会、批文件。只是每天下午，头都会隐隐作痛。' },
      { text: '不住院，但开始锻炼', hint: '折中的办法', fx: { stats: { 健康: 3, 能力: 1 } }, result: '你开始每天早起快走。京州的早晨很安静，你走了半年，血压降了一点。' }
    ]
  },
  {
    id: 'parent-ill', cat: '家风家事', title: '老家的电话', weight: 6,
    text: '老家打来电话，母亲病了，住进了县医院。父亲在电话里说：“你忙你的，不用回来。”可你听见他声音里的慌张。',
    quote: '父母在，人生尚有来处。',
    choices: [
      { text: '请假回去，守在病床前', hint: '工作可以等，父母等不了', fx: { stats: { 亲情: 8, 政绩: -2, 健康: -1 } }, result: '你在医院陪了三天。母亲醒来第一句话是：“你怎么回来了，不耽误工作吗？”你握着她的手，没说话。' },
      { text: '寄钱回去，请护工照顾', hint: '尽了责任，但少了陪伴', fx: { stats: { 亲情: 2 } }, result: '钱打回去了，护工也请了。可你每次打电话，母亲都说“挺好的”，然后很快挂断。' },
      { text: '让配偶回去一趟', hint: '有人照应，但心里过意不去', fx: { stats: { 亲情: -3, 政绩: 1 } }, result: '配偶回去了，把事情安排得妥妥当当。你在会上发言时，心里却一直想着老家的病房。' }
    ]
  },
  {
    id: 'spouse-complain', cat: '家风家事', title: '配偶的埋怨', weight: 6, cond: (s) => !!s.player.marriage,
    text: '深夜回家，客厅的灯还亮着。配偶坐在沙发上，没有睡：“你还记得这个家吗？孩子的家长会你去了几次？我生病的时候你在哪？”',
    quote: '每一个成功的干部背后，都有一个默默撑着家的人。',
    choices: [
      { text: '坐下来，好好陪她说说话', hint: '工作可以放一放', fx: { stats: { 亲情: 7, 政绩: -2 } }, result: '你关掉手机，听她说了很久。说到最后，她哭了，你也红了眼眶。' },
      { text: '敷衍几句，明天还有会', hint: '家越来越远', fx: { stats: { 亲情: -5, 政绩: 1 } }, result: '你说“知道了，早点睡”。她没再说话，起身回了房间，门关得很轻。' },
      { text: '吵一架，觉得她不理解你', hint: '赢了道理，输了感情', fx: { stats: { 亲情: -8, 健康: -2 } }, result: '你们吵到半夜。第二天你照常上班，只是早餐桌上，少了一副碗筷。' }
    ]
  },
  {
    id: 'parent-meeting', cat: '家风家事', title: '家长会', weight: 5, cond: (s) => s.player.children.some((c) => s.year - c.birthYear >= 6 && s.year - c.birthYear <= 17),
    text: '孩子的班主任打来电话，说下午开家长会，“孩子说你好久没去过学校了”。同一时间，市里有一个重要的协调会。',
    quote: '孩子的成长，只有一次。',
    choices: [
      { text: '请假去家长会', hint: '孩子会记得', fx: { stats: { 亲情: 5, 政绩: -1 } }, result: '你坐在孩子的小椅子上，听老师表扬了他。散会时，孩子跑过来拉住你的手，眼睛亮亮的。' },
      { text: '去市里开会', hint: '工作要紧，孩子会理解', fx: { stats: { 亲情: -4, 政绩: 1 } }, result: '会开得很顺利。晚上回家，孩子已经睡了，桌上放着一张没及格的试卷。' },
      { text: '让配偶去', hint: '有人代表，但孩子想的是你', fx: { stats: { 亲情: -1 } }, result: '配偶去了家长会。孩子回来后问：“爸爸是不是又开会？”你没敢看他的眼睛。' }
    ]
  },
  {
    id: 'old-leader-retire', cat: '人情', title: '老领导退休', weight: 5, cond: (s) => s.player.rank >= 2,
    text: '提携过你的老领导退居二线。送行那天，来的人不多。有人劝你：“人走茶凉，以后少来往，免得新领导多想。”',
    quote: '人走茶凉，是官场最真实的温度。',
    choices: [
      { text: '常去看望，逢年过节不落', hint: '重情义，但可能被误解', fx: { stats: { 人脉: 2, 口碑: 2, 廉政: 1 }, rel: { 李达康: 2 } }, result: '你每个月都去老领导家坐坐。他不再谈工作，只跟你下棋、喝茶。' },
      { text: '避嫌，渐渐断了来往', hint: '现实，但心里会空一块', fx: { stats: { 人脉: -3, 廉政: 2 } }, result: '你在楼梯间碰到老领导，打了个招呼就匆匆走了。他站在原地，看了你很久。' },
      { text: '转投新领导门下', hint: '现实，但名声不好', fx: { stats: { 人脉: 3, 口碑: -3 }, factionVisit: true }, result: '你很快出现在新领导的饭局上。老领导听说后，只叹了口气。' }
    ]
  },
  {
    id: 'anonymous-letter', cat: '廉政状况', title: '匿名举报信', weight: 7, cond: (s) => s.risk >= 25,
    text: '纪委收到一封匿名举报信，信里提到你名字的拼音，还有一笔说不清来源的款项。纪委书记找你谈话，语气很平静：“有什么要说明的吗？”',
    quote: '纸包不住火，信也藏不住事。',
    choices: [
      { text: '主动说明情况，配合核实', hint: '越早说清楚越好', fx: { stats: { 廉政: 4, 政绩: -1 }, risk: -10 }, result: '你把那笔款的来龙去脉讲清楚了。纪委书记记了满满一页，最后说：“组织会核实。”' },
      { text: '找人把信压下去', hint: '压得住信，压不住人心', fx: { stats: { 廉政: -4, 人脉: 2 }, risk: 8 }, result: '信暂时压住了。可你知道，写信的人还在暗处，而且可能不止一个。' },
      { text: '置之不理，清者自清', hint: '看似坦荡，实则被动', fx: { stats: { 廉政: -1 }, risk: 5 }, result: '你没有回应。三个月后，第二封信寄到了省纪委。' }
    ]
  },
  {
    id: 'discipline-talk', cat: '廉政状况', title: '纪委约谈', weight: 12, cond: (s) => s.risk >= 45,
    text: '省纪委通知你过去谈话。房间不大，桌上摆着一杯水。对面坐着两个人，一个记录，一个提问：“今天找你来，是想了解一些情况。希望你能如实回答。”',
    quote: '坦白从宽，抗拒从严。',
    choices: [
      { text: '如实交代，争取主动', hint: '疼一次，也许还能重来', fx: { stats: { 廉政: 5, 政绩: -2 }, risk: -15 }, result: '你讲了三个小时，把该说的都说了。走出谈话室时，你腿有些软，但心里那块石头落了地。' },
      { text: '避重就轻，试探底线', hint: '聪明反被聪明误', fx: { stats: { 廉政: -3 }, risk: 8 }, result: '你挑了些无关紧要的说。对方没打断你，只在最后问了一句：“就这些？”' },
      { text: '对抗，什么也不承认', hint: '最坏的选择', fx: { stats: { 廉政: -8 }, risk: 20 }, result: '你咬死了不承认。谈话结束后，对方合上本子，说：“希望下次见面，你还能这么说。”' }
    ]
  },
  {
    id: 'boss-invest', cat: '廉政状况', title: '老板的投资', weight: 6, cond: (s) => s.player.rank >= 2,
    text: '一位老板看中了你主政地方的一块地，想搞商业开发。他开出的条件很优厚：投资、税收、就业，还有一份“顾问费”。',
    quote: '资本来到世间，每个毛孔都滴着血和肮脏的东西。',
    choices: [
      { text: '依法依规办理，不搞特殊', hint: '慢，但稳', fx: { stats: { 政绩: 3, 廉政: 3 } }, result: '项目按程序走了招拍挂。老板没拿到地，但也没话说。' },
      { text: '变通一下，给他开绿灯', hint: '政绩来得快，风险也来得快', fx: { stats: { 政绩: 5, 廉政: -4 }, risk: 6 }, result: '项目很快落地，剪彩那天很热闹。几个月后，审计组进驻了。' },
      { text: '拒绝，并把情况上报', hint: '守住底线，可能失去投资', fx: { stats: { 廉政: 4, 政绩: -1, 人脉: -3 } }, result: '你把“顾问费”的事报告了。老板撤资走了，但你的名字留在了组织的考察表上。' }
    ]
  },
  {
    id: 'poverty-check', cat: '基层治理', title: '扶贫检查', weight: 5, cond: (s) => s.year >= 2018,
    text: '扶贫检查在即，你联系的村子还有几户没有达标。村干部提议：“先把表填好，检查过了再慢慢补。”',
    quote: '扶贫不是数字游戏。',
    choices: [
      { text: '实事求是，抓紧补短板', hint: '可能挨批评，但对得起良心', fx: { stats: { 政绩: 4, 口碑: 4, 健康: -2 } }, result: '你带着村干部一户户跑，熬了半个月。检查时虽然被指出了问题，但整改方案很扎实。' },
      { text: '先填表，把检查应付过去', hint: '过关容易，后患无穷', fx: { stats: { 政绩: 2, 廉政: -4 }, risk: 5 }, result: '检查顺利通过。可那几户人家的日子，还是老样子。' },
      { text: '把责任推给村干部', hint: '保自己，失人心', fx: { stats: { 人脉: -2, 口碑: -3 } }, result: '你在会上批评了村干部。他们没辩解，只是从那以后，再没人主动向你汇报工作。' }
    ]
  },
  {
    id: 'online-storm', cat: '舆情', title: '网络舆情', weight: 5, cond: (s) => s.player.rank >= 3,
    text: '你在一次会议上打瞌睡的视频被人发到了网上，配文是“这样的干部，能为民做主吗？”转发量很快过了十万。',
    quote: '网络时代，每个人都活在镜头下。',
    choices: [
      { text: '公开道歉，说明情况', hint: '承认错误，争取谅解', fx: { stats: { 口碑: 3, 政绩: -1 } }, result: '你录了一段道歉视频，说自己前一晚加班到凌晨。评论区里，有人骂，也有人说“理解”。' },
      { text: '让宣传部门删帖', hint: '删得掉帖子，删不掉记忆', fx: { stats: { 廉政: -3, 口碑: -2 }, risk: 5 }, result: '帖子删了，截图却传得更广。有人开始扒你的履历。' },
      { text: '不理会，等热度过去', hint: '冷处理，但形象受损', fx: { stats: { 口碑: -4 } }, result: '热度确实过去了。可每次开会，你都能感觉到有人在看你。' }
    ]
  },
  {
    id: 'aide-trouble', cat: '廉政状况', title: '身边人', weight: 5, cond: (s) => s.player.rank >= 3,
    text: '你的秘书最近换了新车，还在朋友圈晒了一块名表。有人提醒你：“他打着你的旗号，在外面办了不少事。”',
    quote: '管不住身边人，就管不住自己的权力。',
    choices: [
      { text: '严厉处理，调离身边', hint: '止损，但会被人说无情', fx: { stats: { 廉政: 5, 人脉: -3, 口碑: 2 } }, result: '你把秘书调到了偏远乡镇。他走的时候，没跟你告别。' },
      { text: '睁一只眼闭一只眼', hint: '纵容，就是给自己埋雷', fx: { stats: { 廉政: -4 }, risk: 5 }, result: '你什么也没说。秘书更殷勤了，可你总觉得，那辆新车在阳光下太刺眼。' },
      { text: '帮他把事情压下去', hint: '最危险的选择', fx: { stats: { 廉政: -8 }, risk: 10 }, result: '你打了几个电话。事情暂时平了，可你知道，从这一刻起，你们绑在了一条船上。' }
    ]
  },
  {
    id: 'old-subordinate', cat: '人情', title: '老部下求情', weight: 5, cond: (s) => s.player.rank >= 3,
    text: '一个跟了你多年的老部下出了事，被纪委立案。他的妻子找到你家，跪在门口：“他知道错了，求你跟组织说说情。”',
    quote: '人情再大，大不过纪法。',
    choices: [
      { text: '依法办理，不干预', hint: '守住原则，但会被人骂', fx: { stats: { 廉政: 4, 人脉: -3, 口碑: 2 } }, result: '你没有插手。案子依法办结，老部下被判了刑。他妻子再也没来过。' },
      { text: '帮忙打招呼，争取从轻', hint: '讲义气，但违反纪律', fx: { stats: { 人脉: 3, 廉政: -5 }, risk: 5 }, result: '你打了招呼。老部下少判了两年，可你的名字，也进了别人的笔记本。' },
      { text: '推脱，说自己管不了', hint: '不沾事，但显得凉薄', fx: { stats: { 人脉: -1, 廉政: 1 } }, result: '你说自己不便过问。老部下的妻子走了，走得很慢。' }
    ]
  },
  {
    id: 'party-classmate', cat: '人情', title: '党校同学', weight: 4,
    text: '党校同学聚会，一位做金融的同学把你拉到一边：“我这边有个内部项目，稳赚不赔，你投一点，算我送你的。”',
    quote: '天上不会掉馅饼，只会掉陷阱。',
    choices: [
      { text: '拒绝，保持距离', hint: '少赚一笔，少一分风险', fx: { stats: { 廉政: 4, 人脉: -2 } }, result: '你笑着摇了摇头。同学说你“太谨慎”，转头又去找了别人。' },
      { text: '投一点，试试水', hint: '尝到甜头，就收不住手', fx: { stats: { 廉政: -8, 人脉: 4 }, risk: 10 }, result: '第一笔收益很快到账。你开始后悔，当初为什么没有多投一点。' },
      { text: '把情况报告组织', hint: '最安全，也最不合群', fx: { stats: { 廉政: 6, 人脉: -5 }, risk: -3 }, result: '你把事情报告了。党校同学会被取消了，你成了同学口中的“告密者”。' }
    ]
  },
  {
    id: 'business-trip', cat: '作风建设', title: '出差顺道', weight: 4, cond: (s) => s.player.rank >= 2,
    text: '出差结束，当地接待方热情地安排了一辆车，说“顺路去景区看看，不耽误你回程”。同行的几个人都上了车。',
    quote: '小节不慎，大节难保。',
    choices: [
      { text: '婉拒，直接回程', hint: '不合群，但干净', fx: { stats: { 廉政: 2, 政绩: 1 } }, result: '你一个人去了机场。同行的人回来后，半开玩笑地说你“太认真”。' },
      { text: '跟着去，顺便放松一下', hint: '占了便宜，留下把柄', fx: { stats: { 健康: 2, 廉政: -3 }, risk: 4 }, result: '景区风景很好，照片拍得也不错。只是回到单位后，那几张照片被人看到了。' },
      { text: '自己掏钱，去看一看', hint: '公私分明，但显得生分', fx: { stats: { 健康: 3, 亲情: 2, 政绩: -1 } }, result: '你坚持自己买了门票。接待方有些尴尬，你倒觉得踏实。' }
    ]
  },
  {
    id: 'young-cadre', cat: '干部选拔', title: '年轻干部', weight: 4, cond: (s) => s.player.rank >= 3,
    text: '单位里有个年轻干部，业务能力强，但性格直，顶撞过你几次。现在有一个提拔名额，群众呼声很高。',
    quote: '用什么样的人，就会有什么样的风气。',
    choices: [
      { text: '举荐他，给他压担子', hint: '气度，也是格局', fx: { stats: { 口碑: 3, 政绩: 2, 人脉: -1 } }, result: '你在会上举荐了他。他上任后干得很出色，见你时还是那副不卑不亢的样子。' },
      { text: '压一压，用个听话的', hint: '顺手，但埋没人才', fx: { stats: { 人脉: 2, 口碑: -3 }, risk: 2 }, result: '你用了自己的老部下。那个年轻人递交了调动申请，去了省里。' },
      { text: '再观察观察', hint: '不犯错，也不担当', fx: { stats: { 政绩: 1 } }, result: '名额空着，事情拖着。年轻干部没有走，但眼里的光暗了一些。' }
    ]
  },
  {
    id: 'drinking', cat: '人情', title: '招商酒局', weight: 4, cond: (s) => s.player.rank >= 1,
    text: '招商引资的饭局上，老板端着酒杯站起来：“这杯酒，代表了我们对汉东的诚意。领导不喝，就是不给我们面子。”',
    quote: '酒桌上的诚意，往往是合同里的陷阱。',
    choices: [
      { text: '喝，舍命陪君子', hint: '签下项目，伤身伤胃', fx: { stats: { 人脉: 4, 健康: -3, 廉政: -1 } }, result: '你喝到半夜，项目签了。第二天醒来，头疼欲裂，合同里的条款却看得更清楚了。' },
      { text: '以茶代酒，把话说清楚', hint: '不伤身体，也不给借口', fx: { stats: { 人脉: -2, 健康: 1, 廉政: 1 } }, result: '你端起茶杯，说：“诚意在项目里，不在酒里。”老板愣了一下，笑着把酒喝了。' },
      { text: '让下属替你挡酒', hint: '保了自己，失了人心', fx: { stats: { 人脉: 2, 口碑: -2 } }, result: '下属替你喝倒了。你签了合同，却看见他被人扶出去时苍白的脸。' }
    ]
  },
  {
    id: 'old-colleague', cat: '廉政状况', title: '老同事落马', weight: 5, cond: (s) => s.player.rank >= 2,
    text: '一起进单位的老同事被带走了。你们曾在一个办公室熬夜写材料，也曾在酒桌上互相打趣。纪委的人问你：“他和你之间，有没有经济往来？”',
    quote: '共患难容易，共富贵难。',
    choices: [
      { text: '如实说明，配合调查', hint: '不落井下石，也不隐瞒', fx: { stats: { 廉政: 4, 人脉: -2 }, risk: -5 }, result: '你把知道的都说了，也说了他的好。纪委的人合上本子，说：“谢谢。”' },
      { text: '撇清关系，说不熟', hint: '自保，但显得凉薄', fx: { stats: { 廉政: -2, 人脉: -1 } }, result: '你说“只是普通同事”。可办公室里的人都知道，你们曾是最好的朋友。' },
      { text: '替他说情，甚至帮他遮掩', hint: '讲义气，害自己', fx: { stats: { 廉政: -6 }, risk: 8 }, result: '你替他说了几句好话。纪委的人看了你一眼，那一眼让你很久都忘不掉。' }
    ]
  }
];

/* ---------------- 忠诚事件 ----------------
   官场允许一定的贪腐，但要求绝对的忠心。
   站队之后，靠山提供庇护；忠诚不足，庇护消失；
   靠山要你顶雷时，不从则可能成为弃子。
   ------------------------------------------ */
const LOYALTY_EVENTS = [
  {
    id: 'loyalty-test', cat: '忠诚', title: '表态', weight: 0,
    cond: (s) => s.player.allegiance !== '中立' && s.player.loyalty < 55 && s.year >= 2016,
    text: (s) => `常委会前，${s.player.patronName}的秘书打来电话，说领导希望你在一份材料上联署，公开支持一个争议很大的项目。材料后面附着一句话：“这个时候，看的就是谁是自己人。”`,
    quote: '忠心不是嘴上说的，是关键时刻站出来的。',
    choices: [
      {
        text: '公开联署，替领导站台',
        hint: '忠心加分，风险也加分',
        fx: { stats: { 政绩: 2, 廉政: -3 }, risk: 5, loyalty: 12 },
        result: '你的名字签在了最前面。领导看到后只说了两个字：“不错。”'
      },
      {
        text: '口头答应，拖着不签',
        hint: '两边都不得罪，也两边都不落好',
        fx: { stats: { 人脉: 1 }, loyalty: -10 },
        result: '你说“再研究研究”。秘书此后再没打来电话，你知道，有些东西已经变了。'
      },
      {
        text: '婉言拒绝，只谈程序',
        hint: '守住底线，失去庇护',
        fx: { stats: { 廉政: 3 }, risk: 2, loyalty: -18 },
        result: '你说了很多程序上的理由。领导听完，笑着说“理解”，可那笑没有到眼睛里。'
      }
    ]
  },
  {
    id: 'loyalty-cost', cat: '忠诚', title: '投名状', weight: 0,
    cond: (s) => s.player.allegiance !== '中立' && s.player.loyalty >= 50 && s.player.risk >= 10 && s.year >= 2017,
    text: (s) => `${s.player.patronName}的远房亲戚找上门来，带着一个棚改项目的审批材料。他说得很直白：“领导不方便出面，这事只能你来办。办好了，大家都记得你。”`,
    quote: '投名状一旦递上去，就再也拿不回来了。',
    choices: [
      {
        text: '签字放行，把事办漂亮',
        hint: '彻底成为“自己人”',
        fx: { stats: { 人脉: 4, 廉政: -7, 政绩: 2 }, risk: 9, loyalty: 10 },
        result: '项目三天就批了。领导在饭桌上当着众人的面敬了你一杯酒，你知道，这杯酒很贵。'
      },
      {
        text: '按程序慢慢审，能拖就拖',
        hint: '不撕破脸，也不留把柄',
        fx: { stats: { 廉政: 2 }, risk: 2, loyalty: -8 },
        result: '你把材料压在最下面。亲戚来了三次，第三次走的时候，脸色已经很难看。'
      },
      {
        text: '把材料交给纪委',
        hint: '与靠山彻底决裂',
        fx: { stats: { 廉政: 5, 口碑: 3, 人脉: -5 }, risk: -6, loyalty: -40, align: '中立' },
        result: '你把材料交了上去。第二天，领导办公室的门对你关上了。你站在走廊里，忽然觉得轻松，又觉得冷。'
      }
    ]
  },
  {
    id: 'loyalty-reward', cat: '忠诚', title: '自己人', weight: 0,
    cond: (s) => s.player.allegiance !== '中立' && s.player.loyalty >= 70 && s.player.patronRel >= 25 && s.year >= 2018,
    text: (s) => `${s.player.patronName}把你叫到办公室，关上门，说：“上面有个位置，我准备推你。但你要想清楚，坐上去之后，就是我的人了。”`,
    quote: '权力给你的时候，绳子也一起给了。',
    choices: [
      {
        text: '当场表态，绝不辜负',
        hint: '拿到关键的一票',
        fx: { stats: { 人脉: 3 }, loyalty: 6, points: 2, flags: { promoBoost: true } },
        result: '你站起来，说了一句很重的话。领导点了点头，把桌上的一份名单推到你面前。'
      },
      {
        text: '感谢栽培，但希望凭实绩',
        hint: '保住体面，也保住距离',
        fx: { stats: { 廉政: 3, 口碑: 2 }, loyalty: -6 },
        result: '领导沉默了一会儿，说：“好，那就让实绩说话。”你听不出他是赞赏还是失望。'
      },
      {
        text: '推荐比自己更合适的同志',
        hint: '成全别人，也退出牌局',
        fx: { stats: { 口碑: 4, 人脉: 2 }, loyalty: -10 },
        result: '你说出了另一个人的名字。领导看了你很久，最后说：“你倒是想得开。”'
      }
    ]
  },
  {
    id: 'patron-falls', cat: '忠诚', title: '靠山倒了', weight: 0,
    cond: (s) => (s.player.allegiance === '李' || s.player.allegiance === '高') && s.year >= 2018 && (s.player.loyalty < 60 || s.player.risk >= 25),
    text: (s) => `深夜，你接到一个陌生号码的电话。对方说，${s.player.patronName}已经被带走谈话，几个项目正在被查。电话最后说：“领导让我转告你，有些事，只有你能扛。”`,
    quote: '树倒猢狲散，可树倒之前，总要有人垫背。',
    choices: [
      {
        text: '把所有事扛下来，保领导周全',
        hint: '以忠诚换一线生机，也可能万劫不复',
        fx: { stats: { 人脉: 4, 廉政: -4 }, risk: 25, loyalty: 20, ending: 'scapegoat' },
        result: '你在谈话室里坐了一夜。天亮的时候，你想起很多年前，第一次走进机关大院的那个下午。'
      },
      {
        text: '立即切割，主动说明问题',
        hint: '保住自己，从此再无靠山',
        fx: { stats: { 廉政: 4, 人脉: -6 }, risk: -4, loyalty: -30, align: '中立' },
        result: '你把所有往来写成材料交了上去。走出纪委大楼时，手机里那个熟悉的号码，已经被你删掉了。'
      },
      {
        text: '连夜去找新的靠山',
        hint: '换一棵树，继续往上爬',
        fx: { stats: { 人脉: 3 }, risk: 6, align: '沙', loyalty: 8 },
        result: '你在沙瑞金秘书的门口等到凌晨。门开的时候，你知道自己活下来了，也知道自己变成了另一种人。'
      }
    ]
  },
  {
    id: 'abandoned', cat: '忠诚', title: '弃子', weight: 0,
    cond: (s) => s.player.allegiance !== '中立' && s.player.loyalty < 15 && s.player.risk >= 30 && s.year >= 2017,
    text: (s) => `一份材料突然出现在巡视组的桌上，里面的事，桩桩件件都指向你。你打电话给${s.player.patronName}，响了很久才接通。对面只说了一句：“这个时候，不要给我打电话。”`,
    quote: '棋子没有用了，就会被拿掉。',
    choices: [
      {
        text: '认命，等待组织处理',
        hint: '把最后一点体面留给自己',
        fx: { risk: 20, ending: 'abandoned' },
        result: '你坐在办公室里，把手头的工作一件件交接清楚。窗外的天很蓝，你很久没有抬头看过了。'
      },
      {
        text: '鱼死网破，把知道的都说出来',
        hint: '拉所有人下水，也毁掉自己',
        fx: { stats: { 人脉: -10, 廉政: 2 }, risk: 15, ending: 'jailed' },
        result: '你写了一份很长的材料，签上名字，按了手印。按下去的那一刻，你听见自己心里有什么东西碎了。'
      }
    ]
  }
];

/* ---------------- 婚姻与家庭 ---------------- */
const MARRIAGE_CANDIDATES = [
  {
    id: 'shenqing', name: '沈清', age: 26, job: '市第一医院医生',
    desc: '朋友介绍认识的医生，说话轻声细语，值夜班时会给你发一条“早点睡”。',
    stats: { 亲情: 10, 健康: 3, 口碑: 2 },
    quote: '你忙你的，家里有我。'
  },
  {
    id: 'zhouning', name: '周宁', age: 27, job: '市直机关公务员',
    desc: '同一栋楼里办公的同事，懂机关的门道，也懂你的言外之意。',
    stats: { 亲情: 8, 人脉: 5, 廉政: -1 },
    quote: '有些话，不用说得太明白。'
  },
  {
    id: 'suwan', name: '苏婉', age: 29, job: '大港集团投资部经理',
    desc: '在招商会上认识的商界女性，干练、漂亮，酒量比你好。',
    stats: { 亲情: 6, 人脉: 8, 政绩: 2, 廉政: -4 },
    quote: '资源这东西，用对了就是政绩。'
  },
  {
    id: 'guyan', name: '顾言', age: 28, job: '汉东大学讲师',
    desc: '大学时的旧识，教政治学，喜欢在深夜跟你讨论制度与人心。',
    stats: { 亲情: 9, 能力: 4, 口碑: 1 },
    quote: '你可以改变一些事，但别让事情改变你。'
  }
];

const CHILD_NAMES = {
  boy: ['林远', '林澈', '林舟', '林岳', '林知远', '林望'],
  girl: ['林晚', '林溪', '林窈', '林知夏', '林念', '林昭']
};

/* ---------------- 结局 ---------------- */
const ENDING_DEFS = {
  best: {
    title: '人民的名义',
    subtitle: '你守住了权力最初的样子',
    seal: '人民',
    tone: 'best',
    narrative: [
      '很多年后，你已经不在那个位置上。可京州的老百姓说起你，还是会提起那些路、那些学校、那些在雨夜里被修好的下水道。',
      '你没有成为最有权势的人，也没有成为最富有的人。你只是把“为人民服务”五个字，从墙上请了下来，放进了自己的一生里。',
      '权力是人民赋予的，只能用来为人民谋利益。这句话，你终于可以问心无愧地再说一遍。'
    ]
  },
  pinnacle: {
    title: '问鼎中枢',
    subtitle: '你走进了权力的最深处',
    seal: '中枢',
    tone: 'best',
    narrative: [
      '常委会的会议室不大，桌子是深色的，窗帘常年拉着。你坐在其中一把椅子上，面前摆着一份关系到几千万人的文件。',
      '从汉东的乡镇到京州的机关，从县委书记到省委书记，你用了三十多年。那些雨夜、饭局、举报信和深夜的电话，最后都收进了这间安静的屋子。',
      '散会时，人们依次起身。你走到窗边，看见长安街上的车流像一条缓慢的河。你知道，从今天起，你说的每一句话，都会比从前更重。',
      '权力到了最高处，能约束它的，只剩自己。'
    ]
  },
  politburo: {
    title: '入局',
    subtitle: '你成为政治局的一员',
    seal: '局',
    tone: 'best',
    narrative: [
      '你的名字出现在那份名单上时，汉东的老同事们在群里沉默了很久，然后一个接一个地发来“祝贺”。',
      '你搬进了北京的办公室，窗外没有京州的梧桐。文件更厚了，会议室更静了，能说真话的人却更少了。',
      '你想起很多年前，自己第一次走进机关大院时，只想着把手头那份材料写好。如今你签下的每一个字，都可能改变无数人的命运。',
      '你还在局里，也还在路上。'
    ]
  },
  power: {
    title: '封疆大吏',
    subtitle: '你走到了汉东权力的最高处',
    seal: '汉东',
    tone: 'best',
    narrative: [
      '你站在省委大楼最高一层的窗前，看着京州的灯火从脚下一直铺到天边。三十年前，你也是这样看着这座城市，只是那时你站在人群里。',
      '你签过的每一份文件，都可能改变无数人的命运。你学会了沉默、平衡、等待，也学会了在关键时刻不再犹豫。',
      '有人说你是能臣，有人说你是政客。历史会怎么写你，你不知道。你只知道，这条路是你自己选的，而且你走到了最后。'
    ]
  },
  top: {
    title: '权倾一方',
    subtitle: '你成了别人口中的“领导”',
    seal: '权',
    tone: 'normal',
    narrative: [
      '你主政一方，说一不二。饭局上永远有人抢着买单，走廊里永远有人侧身让路。你渐渐习惯了这一切。',
      '你做过实事，也收过不该收的东西；你提拔过能人，也安插过自己人。你不再是当年那个非黑即白的年轻人。',
      '退休那天，你把办公室清理干净。抽屉最深处，是一封没有署名的举报信。你看了很久，最后把它锁进了抽屉。'
    ]
  },
  clean: {
    title: '平安着陆',
    subtitle: '你全身而退，把余生还给了自己',
    seal: '安',
    tone: 'normal',
    narrative: [
      '退休手续办完那天，你没有让任何人送。你把办公室的钥匙放在桌上，回头看了一眼那张坐了多年的椅子。',
      '你没有站到最高处，也没有跌进深渊。你在这个巨大的机器里做了一个不算显眼、却足够结实的零件。',
      '回家的路上，你买了两斤菜。妻子在厨房里喊你洗手，孙子在客厅里看动画片。日子忽然变得很轻。'
    ]
  },
  ordinary: {
    title: '平凡一生',
    subtitle: '你把青春留在了机关的格子间',
    seal: '凡',
    tone: 'normal',
    narrative: [
      '你退休时，职级不高，送行的人也不多。几个老同事在食堂包间里吃了顿饭，说了些年轻时的糗事。',
      '你曾经也想过要改变什么。后来你发现，光是把自己那一摊事做好，就已经用尽了全力。',
      '这样的一生，说不上成功，也说不上失败。至少，你没有对不起谁。'
    ]
  },
  stagnant: {
    title: '原地踏步',
    subtitle: '你停在了某个不高不低的位置',
    seal: '止',
    tone: 'normal',
    narrative: [
      '很多年前，你和同期的人站在同一条起跑线上。后来他们一个个调走、提拔、消失在你的视野里，而你始终在这个位置上。',
      '你不是没有能力，也不是没有机会。只是每一次需要往前迈一步的时候，你都选择了稳妥。',
      '退休那天，你把办公桌擦得很干净，像第一天来报到时那样。'
    ]
  },
  jailed: {
    title: '落马',
    subtitle: '风暴来的时候，你没有躲过去',
    seal: '罪',
    tone: 'dark',
    narrative: [
      '带走你的那天，办公室的人都在开会。你从后门被带走，没有惊动任何人。',
      '办案人员把你这些年签过的字、批过的条、收过的东西一件件摆在桌上。你看着那些熟悉的字迹，忽然觉得很陌生。',
      '你想起了很多年前的那个下午，你第一次走进机关大院，心里想着要做一个好官。'
    ]
  },
  scapegoat: {
    title: '替罪羊',
    subtitle: '你替人扛下了所有，包括不属于你的罪',
    seal: '忠',
    tone: 'dark',
    narrative: [
      '你把所有的事都扛了下来。你以为这样能保住那个人，保住这些年你相信的东西。',
      '可是树倒了，猢狲散了，你成了所有人急于切割的那一部分。审判席上，没有一个人替你说话。',
      '你到最后才明白，忠诚如果不能换来对等的庇护，就只是一种廉价的自我感动。'
    ]
  },
  abandoned: {
    title: '弃子',
    subtitle: '你被自己效忠的人亲手舍弃',
    seal: '弃',
    tone: 'dark',
    narrative: [
      '他们把你的名字从名单上划掉的时候，甚至没有通知你。你是在一份内部通报里，看见自己成为“有关人员”的。',
      '你曾经以为站队就是交心，以为忠心能换来庇护。后来你才知道，在棋盘上，棋子从来没有资格谈感情。',
      '很多年后，你在一个小城的街边看见当年的老领导。他也看见了你，然后转过了头。'
    ]
  },
  sick: {
    title: '病退',
    subtitle: '你把身体透支给了工作',
    seal: '病',
    tone: 'normal',
    narrative: [
      '你在办公室里晕倒的那天，桌上还摊着一份没改完的材料。醒来时，消毒水的味道盖过了一切。',
      '医生说要静养，组织上给你办了病退。你躺在家里，第一次有时间看完整场新闻联播。',
      '你不后悔。只是有时候会想，如果当年少熬几个夜，是不是还能多干几年。'
    ]
  },
  lonely: {
    title: '孤独的晚年',
    subtitle: '你把一生给了仕途，却弄丢了家',
    seal: '孤',
    tone: 'dark',
    narrative: [
      '退休以后，家里很安静。孩子在外地，妻子早些年就跟你离了婚。你每天最大的事，是去菜市场买菜。',
      '你曾经以为，等你功成名就，家人自然会理解。可等你终于停下来，才发现很多门已经关上了。',
      '电视里还在播新闻，你看着那些熟悉的地名和面孔，忽然想找个人说说话。手机通讯录翻到底，却不知道该打给谁。'
    ]
  }
};

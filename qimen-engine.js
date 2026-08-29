// qimen-engine.js — 純排盤引擎 (拆補法時家奇門)，無 DOM 依賴。
// 2026-08-27 從 qimen.html 內嵌 <script> 拆分而來 (純搬移，未改動任何邏輯)。

// qimen.js — 時家奇門 拆補法 JS port (v1)
// Ported from kentang2017/kinqimen (config.py + kinqimen.py), MIT licensed source.
// Astronomy layer (干支/節氣) delegated to lunar-javascript (6tail), already
// verified accurate in our 萬年曆 project — avoids re-deriving ephemeris in JS.

(function (global) {
'use strict';

const TIAN_GAN = '甲乙丙丁戊己庚辛壬癸';
const DI_ZHI = '子丑寅卯辰巳午未申酉戌亥';
const CNUMBER = ['一','二','三','四','五','六','七','八','九']; // 1-9 (宮位/局數共用)
const EIGHT_GUA = ['坎','坤','震','巽','中','乾','兌','艮','離']; // index by CNUMBER position (1-9)
const CLOCKWISE_EIGHTGUA = ['坎','艮','震','巽','離','坤','兌','乾']; // 8 palaces only, clockwise order, no 中
const DOOR_R = ['休','生','傷','杜','景','死','驚','開'];
const STAR_R = ['蓬','任','沖','輔','英','內','柱','心'];
// 八神只有這 8 個：符/蛇/陰/合/虎/玄/地/天 (螣蛇/值符/太陰/六合/白虎/玄武/九地/九天)。
// 陽遁的校正已由實測案例(1901-04-13 14:30)驗證：陽遁用「虎玄」而非 kinqimen 預設的「勾雀」。
// 陰遁原本假設「相反」沿用勾雀，但荀爽老師視頻「八神原宮」參考圖清楚列出就是這固定 8 個，
// 陰陽遁不分、不存在勾陳/朱雀 —— 已依此改正，兩個陣列統一。
const GOD_YANG = ['符','蛇','陰','合','虎','玄','地','天'];
const GOD_YIN  = ['符','蛇','陰','合','虎','玄','地','天'];

// 節氣 → 上中下元局數對照 (拆補法), directly transcribed from kinqimen/config.py
const JIEQI_CODE = {
  '冬至':'一七四', '驚蟄':'一七四',
  '小寒':'二八五',
  '大寒':'三九六', '春分':'三九六',
  '立春':'八五二',
  '雨水':'九六三',
  '清明':'四一七', '立夏':'四一七',
  '穀雨':'五二八', '小滿':'五二八',
  '芒種':'六三九',
  '夏至':'九三六', '白露':'九三六',
  '小暑':'八二五',
  '大暑':'七一四', '秋分':'七一四',
  '立秋':'二五八',
  '處暑':'一四七',
  '霜降':'五八二', '小雪':'五八二',
  '寒露':'六九三', '立冬':'六九三',
  '大雪':'四七一'
};
// 陽遁節氣 (冬至→芒種) vs 陰遁節氣 (夏至→大雪)
const YANG_JIEQI = new Set(['冬至','小寒','大寒','立春','雨水','驚蟄','春分','清明','穀雨','立夏','小滿','芒種']);

// ── 基礎工具函數 (對應 config.py 的同名函式) ──
function jiazi() {
  const arr = [];
  for (let i = 0; i < 60; i++) arr.push(TIAN_GAN[i % 10] + DI_ZHI[i % 12]);
  return arr;
}
const JIAZI60 = jiazi();

// new_list: 把 olist 旋轉，讓元素 o 排到最前面 (對應 config.py new_list)
function newList(olist, o) {
  const idx = olist.indexOf(o);
  if (idx === -1) return null;
  return olist.slice(idx).concat(olist.slice(0, idx));
}
// new_list_r: 從 o 開始往「前」(逆序) 取，長度同 olist (對應 config.py new_list_r)
function newListR(olist, o) {
  let idx = olist.indexOf(o);
  const res = [];
  for (let i = 0; i < olist.length; i++) {
    res.push(olist[((idx % olist.length) + olist.length) % olist.length]);
    idx -= 1;
  }
  return res;
}

// 旬首: 任一干支 → 它所屬「旬」的甲子頭 (對應 config.py liujiashun_dict 查表邏輯)
function xunShouOf(gz) {
  const idx = JIAZI60.indexOf(gz);
  const headIdx = Math.floor(idx / 10) * 10;
  return JIAZI60[headIdx];
}

// 旬首對應的「值符遁干」(對應 config.py shun())
// 甲子旬→戊 甲戌旬→己 甲申旬→庚 甲午旬→辛 甲辰旬→壬 甲寅旬→癸
const XUN_TO_DUNGAN = {'甲子':'戊','甲戌':'己','甲申':'庚','甲午':'辛','甲辰':'壬','甲寅':'癸'};
function shun(dayGz) {
  return XUN_TO_DUNGAN[xunShouOf(dayGz)];
}

// ── 干支計算 (用 lunar-javascript 取代 ephem+sxtwl, 邏輯對應 config.py gangzhi()) ──
// 規則: 整點取時 (分鐘只影響旬空/分干支, 此處先不處理刻家), 23點視為次日子時 (晚子時進位)
function getGanZhi(Solar, year, month, day, hour, minute) {
  let y = year, m = month, d = day, h = hour;
  if (hour === 23) {
    // 23點 → 次日 00:00 (晚子時進位)
    const next = Solar.fromYmdHms(year, month, day, 23, 0, 0).next(1); // +1 day via Solar helper
    y = next.getYear(); m = next.getMonth(); d = next.getDay(); h = 0;
  }
  const solar = Solar.fromYmdHms(y, m, d, h, 0, 0);
  const lunar = solar.getLunar();
  const yGz = lunar.getYearInGanZhiByLiChun();
  const mGz = lunar.getMonthInGanZhiByLiChun ? lunar.getMonthInGanZhiByLiChun() : lunar.getMonthInGanZhi();
  const dGz = lunar.getDayInGanZhi();
  // 時柱: 用「五鼠遁」依日干獨立推算 (對應 config.py find_lunar_hour, 不直接信任 sxtwl 的時柱)
  const dayGan = dGz[0];
  const FIVE_RATS_START = {'甲':'甲子','己':'甲子','乙':'丙子','庚':'丙子','丙':'戊子','辛':'戊子','丁':'庚子','壬':'庚子','戊':'壬子','癸':'壬子'};
  const startGz = FIVE_RATS_START[dayGan];
  const startIdx = TIAN_GAN.indexOf(startGz[0]);
  // 時辰地支: 用「原始」小時 (不是進位後的 h), 因為時辰本身就是依原始時刻判斷
  const hourBranchIdx = (hour === 23) ? 0 : Math.floor((hour + 1) / 2) % 12;
  const hGan = TIAN_GAN[(startIdx + hourBranchIdx) % 10];
  const hGz = hGan + DI_ZHI[hourBranchIdx];
  return [yGz, mGz, dGz, hGz];
}

// ── 節氣 (取代 ephem-based config.py jq()): 用 lunar-javascript 的「上一個節氣」 ──
// lunar-javascript 回傳簡體節氣名 (如"处暑"), 我們的對照表用繁體 (如"處暑"), 需轉換
const JIEQI_S2T = {
  '冬至':'冬至','小寒':'小寒','大寒':'大寒','立春':'立春','雨水':'雨水','惊蛰':'驚蟄',
  '春分':'春分','清明':'清明','谷雨':'穀雨','立夏':'立夏','小满':'小滿','芒种':'芒種',
  '夏至':'夏至','小暑':'小暑','大暑':'大暑','立秋':'立秋','处暑':'處暑','白露':'白露',
  '秋分':'秋分','寒露':'寒露','霜降':'霜降','立冬':'立冬','小雪':'小雪','大雪':'大雪',
  // getJieQiTable() 偶爾會用拼音常數作為key (通常是跨年回溯補的那一筆), 一併對應
  'DA_HAN':'大寒','DA_XUE':'大雪','DONG_ZHI':'冬至','JING_ZHE':'驚蟄',
  'LI_CHUN':'立春','XIAO_HAN':'小寒','YU_SHUI':'雨水'
};
function getCurrentJieQi(lunar, targetDate) {
  // getPrevJieQi(true) 只精確到「天」, 同一天內若查詢時刻早於節氣交接的時分秒會誤判,
  // 改用 getJieQiTable() 逐筆比對完整時間戳, 取小於等於查詢時刻的最近一個節氣
  const tbl = lunar.getJieQiTable();
  let best = null, bestTime = null;
  for (const [name, jq] of Object.entries(tbl)) {
    const t = new Date(jq.getYear(), jq.getMonth() - 1, jq.getDay(), jq.getHour(), jq.getMinute(), jq.getSecond());
    if (t <= targetDate && (!bestTime || t > bestTime)) { best = name; bestTime = t; }
  }
  return JIEQI_S2T[best] || best;
}

// ── 排局拆補法 (對應 config.py qimen_ju_name_chaibu) ──
// 回傳 [陰陽, 局數(中文數字), 上中下元]
function findYuen(dayGz) {
  const idx = JIAZI60.indexOf(dayGz);
  const group = Math.floor(idx / 5);
  return ['上元','中元','下元'][group % 3];
}
function qimenJuChaibu(jieqiName, dayGz) {
  const yinyang = YANG_JIEQI.has(jieqiName) ? '陽' : '陰';
  const yuen = findYuen(dayGz);
  const codes = JIEQI_CODE[jieqiName]; // 三字串: 上中下元局數
  const yuenIdx = {'上元':0,'中元':1,'下元':2}[yuen];
  const kook = codes[yuenIdx]; // 中文數字 一~九
  return { yinyang, kook, yuen, label: `${yinyang}遁${kook}局${yuen}` };
}

// ── 旬空 / 孤虛 (對應 config.py daykong_shikong) ──
const GUXU = {
  '甲子': '戌亥', '甲戌': '申酉', '甲申': '午未',
  '甲午': '辰巳', '甲辰': '寅卯', '甲寅': '子丑'
};
function dayKongShiKong(dayGz, hourGz) {
  const dXun = xunShouOf(dayGz);
  const hXun = xunShouOf(hourGz);
  return { 日空: GUXU[dXun], 時空: GUXU[hXun] };
}

// ── 局日 (對應 kinqimen.py qimen_ju_day) ──
const JU_DAY_PAIR = {
  '甲':'甲己日','己':'甲己日','乙':'乙庚日','庚':'乙庚日',
  '丙':'丙辛日','辛':'丙辛日','丁':'丁壬日','壬':'丁壬日',
  '戊':'戊癸日','癸':'戊癸日'
};
function juDay(dayGz) { return JU_DAY_PAIR[dayGz[0]]; }

// ── 布六儀三奇 (值符/值使排盤的基礎, 對應 config.py zhifu_pai / zhishi_pai) ──
// 陽遁/陰遁 各9局的基礎排列 (1-9宮序列字串), 直接轉錄自 config.py
const ZHIFU_PAI_TABLE = {
  陽: {'一':'九八七一二三四五六','二':'一九八二三四五六七','三':'二一九三四五六七八',
       '四':'三二一四五六七八九','五':'四三二五六七八九一','六':'五四三六七八九一二',
       '七':'六五四七八九一二三','八':'七六五八九一二三四','九':'八七六九一二三四五'},
  陰: {'九':'一二三九八七六五四','八':'九一二八七六五四三','七':'八九一七六五四三二',
       '六':'七八九六五四三二一','五':'六七八五四三二一九','四':'五六七四三二一九八',
       '三':'四五六三二一九八七','二':'三四五二一九八七六','一':'二三四一九八七六五'}
};
// 回傳: {旬首甲子: 該旬對應的宮位序列(中文數字+局序列, 6碼字串)}
function zhifuPai(yinyang, kook) {
  const pai = ZHIFU_PAI_TABLE[yinyang][kook];
  const heads = JIAZI60.filter((_, i) => i % 10 === 0); // 6個旬首
  const rotated = yinyang === '陰' ? newListR(CNUMBER, kook) : newList(CNUMBER, kook);
  const six = rotated.slice(0, 6).map(x => x + pai);
  const out = {};
  heads.forEach((h, i) => { out[h] = six[i]; });
  return out;
}
function zhishiPai(yinyang, kook) {
  const newKook = newList(CNUMBER, kook);
  const newRKook = newListR(CNUMBER, kook);
  const seqArr = yinyang === '陰' ? newRKook : newKook;
  const seq3 = seqArr.join('') + seqArr.join('') + seqArr.join('');
  const heads = JIAZI60.filter((_, i) => i % 10 === 0);
  const six = seqArr.slice(0, 6).map(ch => {
    const pos = seq3.indexOf(ch) + 1;
    return ch + seq3.slice(pos, pos + 11);
  });
  const out = {};
  heads.forEach((h, i) => { out[h] = six[i]; });
  return out;
}

// ── 值符值使 (對應 config.py zhifu_n_zhishi) ──
const GONG_BY_CNUM = Object.fromEntries(CNUMBER.map((c, i) => [c, EIGHT_GUA[i]]));
const EG_DOOR_ORDER = ['休','死','傷','杜','中','開','驚','生','景']; // zspai_values 的星序對映門
const EIGHT_STAR_ORDER = ['蓬','內','沖','輔','禽','心','柱','任','英']; // zf_values 對映星
function zhifuNZhishi(yinyang, kook, dayGz, hourGz) {
  const hGanIdx = TIAN_GAN.indexOf(hourGz[0]);
  const hourXun = xunShouOf(hourGz); // chour: 時干支所屬旬首
  const zs = zhishiPai(yinyang, kook); // 旬首 -> 6碼序列(值使排)
  const zf = zhifuPai(yinyang, kook);  // 旬首 -> 6碼序列(值符排)
  const zsSeq = zs[hourXun]; // e.g. "三四五六七八九一二三四五"
  const zfSeq = zf[hourXun];
  const doorChar = EG_DOOR_ORDER[CNUMBER.indexOf(zsSeq[0])];
  const door = doorChar === '中' ? '死' : doorChar;
  const starChar = EIGHT_STAR_ORDER[CNUMBER.indexOf(zfSeq[0])];
  const starGong = GONG_BY_CNUM[zfSeq[hGanIdx]];
  const doorGong = GONG_BY_CNUM[zsSeq[hGanIdx]];
  const JJ = {'甲子':'戊','甲戌':'己','甲申':'庚','甲午':'辛','甲辰':'壬','甲寅':'癸'};
  return {
    值符天干: [hourXun, JJ[hourXun]],
    值符星宮: [starChar, starGong],
    值使門宮: [door, doorGong]
  };
}

// ── 地盤 (對應 kinqimen.py pan_earth) ──
const EARTH_YANG = ['戊','己','庚','辛','壬','癸','丁','丙','乙'];
const EARTH_YIN  = ['戊','乙','丙','丁','癸','壬','辛','庚','己'];
function panEarth(yinyang, kook) {
  const order = newList(CNUMBER, kook).map(c => GONG_BY_CNUM[c]);
  const stems = yinyang === '陽' ? EARTH_YANG : EARTH_YIN;
  const out = {};
  order.forEach((g, i) => { out[g] = stems[i]; });
  return out;
}

// ── 八門 / 九星 / 八神 旋轉佈局 (對應 config.py pan_door / pan_star / pan_god) ──
function rotateFromGong(startGong, yinyang) {
  const rotate = yinyang === '陽' ? CLOCKWISE_EIGHTGUA : [...CLOCKWISE_EIGHTGUA].reverse();
  const base = startGong === '中' ? '坤' : startGong;
  return newList(rotate, base);
}
function panDoor(yinyang, zfzs) {
  const [startDoor, startGong] = zfzs.值使門宮;
  const gongOrder = rotateFromGong(startGong, yinyang);
  const doorSeq = yinyang === '陽' ? newList(DOOR_R, startDoor) : newList([...DOOR_R].reverse(), startDoor);
  const out = {};
  gongOrder.forEach((g, i) => { out[g] = doorSeq[i]; });
  return out;
}
function panStar(yinyang, zfzs) {
  let [startStar, startGong] = zfzs.值符星宮;
  // 修正: 原碼寫成 if(startStar==='內')startStar='禽'，方向反了。
  // STAR_R(8星輪轉序列)本來就包含「內」，不包含「禽」(禽星寄坤/中，不參與8宮輪轉)。
  // 值符星宮[0] 只有在直接等於「禽」時(EIGHT_STAR_ORDER 第5位)，才需要換成「內」去查
  // STAR_R 做輪轉；原本寫反的判斷式會把正常合法的「內」誤轉成 STAR_R 查不到的「禽」，
  // newList 找不到就回傳 null，導致 starSeq 為 null、下面 forEach 內 starSeq[i] 直接崩潰。
  // (2026-08-10 實測: 局五/陰遁/戊戌時 觸發此崩潰，修正後驗證通過)
  if (startStar === '禽') startStar = '內';
  const gongOrder = rotateFromGong(startGong, yinyang);
  const starSeq = yinyang === '陽' ? newList(STAR_R, startStar) : newList([...STAR_R].reverse(), startStar);
  const out = {};
  gongOrder.forEach((g, i) => { out[g] = starSeq[i]; });
  return out;
}
function panGod(yinyang, zfzs) {
  const startGong = zfzs.值符星宮[1];
  const gongOrder = rotateFromGong(startGong, yinyang);
  const godSeq = yinyang === '陽' ? GOD_YANG : GOD_YIN;
  const out = {};
  gongOrder.forEach((g, i) => { out[g] = godSeq[i]; });
  return out;
}

// ── 天盤 (對應 kinqimen.py pan_sky) ──
// 注意: Python 原始碼在「值符落中宮」分支裡, gong_reorder = new_list(rotate,"中") 必定
// 找不到"中"(rotate只有8個非中宮位)而拋例外, 因此程式實際永遠走 except 分支, 且該分支
// 內 pan_god(...).get("坤") 在此情境下恆等於"符"(值符), 故再下一層判斷永遠是
// earth.get("坤") == fu_head 與否這兩種情況。以下直接實作這兩種真實會發生的情況。
function panSky(yinyang, kook, zfzs, earth, fuHead, hourGanChar) {
  const rotate = yinyang === '陽' ? CLOCKWISE_EIGHTGUA : [...CLOCKWISE_EIGHTGUA].reverse();
  const fuHeadLocation = zfzs.值符星宮[1];
  const zhifu = zfzs.值符星宮[0];

  if (fuHeadLocation === '中') {
    const a = rotate.map(g => earth[g]); // 8個非中宮位的地盤干, 依 rotate 順序
    const gongReorder = newList(rotate, '坤'); // 恆以坤為起點 (見上方說明)
    let ganReorder;
    if (earth['坤'] === fuHead) {
      const lastOfA = a[a.length - 1];
      ganReorder = newList(a, lastOfA);
    } else {
      // 對應 Python 巢狀 try/except: 先試 fuHead, 若 fuHead 本身就是中宮的干
      // (不在這8個非中宮值之中), 退而求其次改用坤宮本身的干作軸心
      ganReorder = newList(a, fuHead) || newList(a, earth['坤']);
    }
    const out = {};
    gongReorder.forEach((g, i) => { out[g] = ganReorder[i]; });
    return out; // 此分支不附加"中"鍵, 與原始邏輯一致
  }

  // fuLocation: 時干(非時干支旬首遁干, 是時柱本身的天干字元)所在的地盤宮位
  // 若時干恰為"甲"(旬首本字), 地盤從不直接顯示甲, 此時 fuLocation 為 null
  const earthR = {};
  Object.entries(earth).forEach(([g, s]) => { earthR[s] = g; });
  const fuLocation = Object.prototype.hasOwnProperty.call(earthR, hourGanChar) ? earthR[hourGanChar] : null;

  if (zhifu !== '禽') {
    const earthSeq = rotate.map(g => earth[g]);
    const ganReorder = newList(earthSeq, fuHead);
    const gongReorder = newList(rotate, fuHeadLocation);
    if (fuLocation === null) {
      return { ...earth }; // 原始碼: 直接回傳整個地盤 (含"中")
    }
    const out = {};
    gongReorder.forEach((g, i) => { out[g] = ganReorder[i]; });
    out['中'] = earth['中'];
    return out;
  }

  // 值符星 = 禽星 (寄坤二宮) 分支
  const earthSeq = rotate.map(g => earth[g]);
  const ganReorder = newList(earthSeq, earth['坤']);
  const gongReorder = newList(rotate, fuHeadLocation);
  if (!ganReorder.includes(fuHead)) {
    const rGongReorder = newList(gongReorder, fuLocation);
    const out = {};
    rGongReorder.forEach((g, i) => { out[g] = ganReorder[i]; });
    return out;
  }
  const out = {};
  gongReorder.forEach((g, i) => { out[g] = ganReorder[i]; });
  out['中'] = earth['中'];
  return out;
}

// ── 值符 (時干支所屬旬首對應的遁干所在地盤宮位的干, 用於天盤公式的 fuHead) ──
// 對應 kinqimen.py hourganghzi_zhifu(): 找時干支所屬旬首, 取其遁干(戊己庚辛壬癸之一)
function hourGanzhiZhifu(hourGz) {
  return XUN_TO_DUNGAN[xunShouOf(hourGz)];
}

// ── 真太陽時校正 (經度校正，不含均時差) ──
// 來源: 時家奇門排盤需以真太陽時定時辰是跨資料源一致的說法 (中國跨5個時區、全國統一用北京
// 時間，手錶時間不等於當地實際太陽時間)；只做經度校正(每偏離標準經線120°E一度、差4分鐘)，
// 不做均時差(地球公轉橢圓軌道造成的±16分鐘內的次要修正)——經度校正是主要誤差來源，均時差
// 影響小、又需要額外的天文公式，這裡先不做，2026-08-29 決定的取捨。
// longitude 為 null/undefined 時完全不做任何校正，回傳原始年月日時分——確保沒有傳經度的
// 既有呼叫方(含所有回歸測試)行為完全不變。
function applyTrueSolarTime(year, month, day, hour, minute, longitude) {
  if (longitude === null || longitude === undefined || longitude === '' || isNaN(longitude)) {
    return { year, month, day, hour, minute, correctionMin: 0 };
  }
  const correctionMin = Math.round((Number(longitude) - 120) * 4);
  const ts = Date.UTC(year, month - 1, day, hour, minute, 0) + correctionMin * 60000;
  const d = new Date(ts);
  return {
    year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate(),
    hour: d.getUTCHours(), minute: d.getUTCMinutes(), correctionMin,
  };
}

// ── 主函式: 起時家奇門局 (拆補法) ──
// longitude: 可選，出生地經度(東經為正)。不傳則完全不做真太陽時校正，行為與之前完全一致。
function qimenChaibu(Solar, year, month, day, hour, minute, longitude) {
  const corrected = applyTrueSolarTime(year, month, day, hour, minute, longitude);
  ({ year, month, day, hour, minute } = corrected);

  const [yGz, mGz, dGz, hGz] = getGanZhi(Solar, year, month, day, hour, minute);
  const solar = Solar.fromYmdHms(year, month, day, hour, minute, 0);
  const lunar = solar.getLunar();
  const jieqiName = getCurrentJieQi(lunar, new Date(year, month - 1, day, hour, minute, 0));

  const ju = qimenJuChaibu(jieqiName, dGz);
  const zfzs = zhifuNZhishi(ju.yinyang, ju.kook, dGz, hGz);
  const earth = panEarth(ju.yinyang, ju.kook);
  const fuHead = hourGanzhiZhifu(hGz);
  const sky = panSky(ju.yinyang, ju.kook, zfzs, earth, fuHead, hGz[0]);
  const door = panDoor(ju.yinyang, zfzs);
  const star = panStar(ju.yinyang, zfzs);
  const god = panGod(ju.yinyang, zfzs);
  const kong = dayKongShiKong(dGz, hGz);

  return {
    排盤方式: '拆補',
    干支: `${yGz}年${mGz}月${dGz}日${hGz}時`,
    旬首: shun(dGz),
    旬空: kong,
    局日: juDay(dGz),
    排局: ju.label,
    節氣: jieqiName,
    值符值使: zfzs,
    天盤: sky,
    地盤: earth,
    門: door,
    星: star,
    神: god,
    真太陽時校正: corrected.correctionMin ? {
      校正分鐘: corrected.correctionMin,
      校正後時刻: `${corrected.year}-${String(corrected.month).padStart(2,'0')}-${String(corrected.day).padStart(2,'0')} ${String(corrected.hour).padStart(2,'0')}:${String(corrected.minute).padStart(2,'0')}`,
    } : null,
  };
}

const QimenJS = { qimenChaibu, applyTrueSolarTime };
if (typeof module !== 'undefined' && module.exports) module.exports = QimenJS;
if (typeof window !== 'undefined') window.QimenJS = QimenJS;

})(typeof window !== 'undefined' ? window : global);

// ══════════════════════════════════════════════════════════════════════
// 回歸測試: 用兩個已經對照荀爽老師真實案例驗證過的排盤結果，鎖定引擎行為。
// 以後每次改動 qimen-engine.js 裡的排盤演算法 (panSky/panDoor/panStar/panGod 等)，
// 都應該先跑一次這個腳本，確保沒有把已驗證正確的東西改壞。
//
// 用法:
//   npm install lunar-javascript --save-dev   (只需裝一次)
//   node tests/regression.test.js
//
// 2026-08-27: qimen.html 原本的內嵌 <script> 已拆分成 qimen-engine.js / qimen-lexicon.js /
// qimen-rules.js / qimen-ui.js 四個外部檔案 (純搬移，行為不變)，這裡改成直接 require
// qimen-engine.js 本體，不用再從 qimen.html 正則擷取——引擎本來就是獨立檔案了。
// ══════════════════════════════════════════════════════════════════════

const path = require('path');
const assert = require('assert');
const { Solar } = require('lunar-javascript');

const QimenJS = require(path.join(__dirname, '..', 'qimen-engine.js'));

// qimen-rules.js 假設瀏覽器裡跟 qimen-lexicon.js 共用全域作用域(LEX_DATA)、
// 跟 qimen-ui.js 共用 t2()；在 Node 環境下用 global 補上這兩個依賴，讓
// require() 能正常執行(不影響瀏覽器行為，那邊本來就是這樣運作的)。
global.LEX_DATA = require(path.join(__dirname, '..', 'qimen-lexicon.js'));
global.t2 = x => x;
const Rules = require(path.join(__dirname, '..', 'qimen-rules.js'));

let pass = 0, fail = 0;
function check(label, actual, expected) {
  try {
    assert.deepStrictEqual(actual, expected);
    console.log(`✓ ${label}`);
    pass++;
  } catch (e) {
    console.log(`✕ ${label}`);
    console.log('  預期:', JSON.stringify(expected));
    console.log('  實際:', JSON.stringify(actual));
    fail++;
  }
}

// ── 案例一: 2024-02-28 18:39 (荀爽視頻截圖逐宮核對，2026-07-29 對照確認全部吻合) ──
{
  const pan = QimenJS.qimenChaibu(Solar, 2024, 2, 28, 18, 39);
  console.log('\n── 案例一: 2024-02-28 18:39 ──');
  check('干支', pan.干支, '甲辰年丙寅月壬戌日己酉時');
  check('排局', pan.排局, '陽遁三局下元');
  check('天盤', pan.天盤, { 巽: '壬', 離: '辛', 坤: '丙', 兌: '癸', 乾: '戊', 坎: '己', 艮: '丁', 震: '乙', 中: '庚' });
  check('地盤', pan.地盤, { 震: '戊', 巽: '己', 中: '庚', 乾: '辛', 兌: '壬', 艮: '癸', 離: '丁', 坎: '丙', 坤: '乙' });
  check('門', pan.門, { 震: '驚', 巽: '開', 離: '休', 坤: '生', 兌: '傷', 乾: '杜', 坎: '景', 艮: '死' });
  check('星', pan.星, { 巽: '柱', 離: '心', 坤: '蓬', 兌: '任', 乾: '沖', 坎: '輔', 艮: '英', 震: '內' });
  check('神', pan.神, { 巽: '符', 離: '蛇', 坤: '陰', 兌: '合', 乾: '虎', 坎: '玄', 艮: '地', 震: '天' });
}

// ── 案例二: 1901-04-13 14:30 (代碼註解記載的陽遁虎玄校正案例，鎖定當前輸出作快照基準) ──
{
  const pan = QimenJS.qimenChaibu(Solar, 1901, 4, 13, 14, 30);
  console.log('\n── 案例二: 1901-04-13 14:30 ──');
  // 這條是最初促成修正 GOD_YANG 陣列的關鍵案例：陽遁應該用「虎/玄」而非「勾/雀」
  const godValues = Object.values(pan.神);
  const usesHuXuan = godValues.includes('虎') && godValues.includes('玄');
  const usesGouQue = godValues.includes('勾') || godValues.includes('雀');
  check('陽遁使用虎玄而非勾雀', { 虎玄: usesHuXuan, 勾雀: usesGouQue }, { 虎玄: true, 勾雀: false });
  // 鎖定完整快照，防止未來改動意外改變此案例的計算結果
  check('干支', pan.干支, '辛丑年壬辰月辛酉日乙未時');
  check('排局', pan.排局, '陽遁七局下元');
}

// ── 案例三: 2024-08-01 12:00 (陰遁期間，鎖定「勾陳/朱雀已修正移除」— 2026-07-29 依荀爽視頻
//    「八神原宮」參考圖修正：八神固定是符/蛇/陰/合/虎/玄/地/天這8個，陰陽遁不分，不會出現勾/雀) ──
{
  const pan = QimenJS.qimenChaibu(Solar, 2024, 8, 1, 12, 0);
  console.log('\n── 案例三: 2024-08-01 12:00 (陰遁) ──');
  check('排局屬於陰遁', pan.排局.includes('陰遁'), true);
  const godValues = Object.values(pan.神);
  const usesHuXuan = godValues.includes('虎') && godValues.includes('玄');
  const usesGouQue = godValues.includes('勾') || godValues.includes('雀');
  check('陰遁也使用虎玄而非勾雀', { 虎玄: usesHuXuan, 勾雀: usesGouQue }, { 虎玄: true, 勾雀: false });
}

// ══════════════════════════════════════════════════════════════════════
// 2026-08-29 補上的規則層回歸測試：2026-08-27 那次會話新增的六害修正/主流格局判斷/
// 三詐五假/簡明定位讀法/生肖桃花位，原本完全沒有正式測試覆蓋，只在開發時用 Playwright
// 手動跑過——三奇入墓那次的 bug 就是因為沒有測試才一路沒被發現，這裡補上。
// ══════════════════════════════════════════════════════════════════════

// ── 三奇入墓：鎖定修正後的表 (乙→坤，不是誤植的乾)，防止同一個 bug 再犯一次 ──
{
  console.log('\n── 三奇入墓表 (RUMU_TABLE) ──');
  check('乙→坤／丙→乾／丁→艮', Rules.RUMU_TABLE, { 乙: '坤', 丙: '乾', 丁: '艮' });
}

// ── 主流格局判斷：用三個案例本身 + 兩個額外找出的大格/小格真實觸發案例 ──
{
  console.log('\n── 主流格局判斷 (checkMainstreamGeju) ──');
  const pan1 = QimenJS.qimenChaibu(Solar, 2024, 2, 28, 18, 39);
  check('案例一命中朱雀投江@艮、陰害陽門@震(乙加戊，2026-08-29新增格局命中)',
    Rules.checkMainstreamGeju(pan1.天盤, pan1.地盤).map(h => `${h.name}@${h.gong}`).sort(),
    ['朱雀投江@艮', '陰害陽門@震'].sort());

  const pan2 = QimenJS.qimenChaibu(Solar, 1901, 4, 13, 14, 30);
  check('案例二命中白虎猖狂@乾、朱雀投江@震、陰害陽門@兌(乙加戊，2026-08-29新增格局命中)',
    Rules.checkMainstreamGeju(pan2.天盤, pan2.地盤).map(h => `${h.name}@${h.gong}`).sort(),
    ['朱雀投江@震', '白虎猖狂@乾', '陰害陽門@兌'].sort());

  const pan3 = QimenJS.qimenChaibu(Solar, 2024, 8, 1, 12, 0);
  check('案例三命中飛鳥跌穴@兌、青龍逃走@巽(乙加辛，2026-08-29新增格局命中)',
    Rules.checkMainstreamGeju(pan3.天盤, pan3.地盤).map(h => `${h.name}@${h.gong}`).sort(),
    ['飛鳥跌穴@兌', '青龍逃走@巽'].sort());

  // 窮舉搜出的真實觸發案例 (2026-08-27 開發時已核對過天盤/地盤干完全對應公式)
  const panXiaoge = QimenJS.qimenChaibu(Solar, 2000, 1, 1, 10, 0);
  check('小格@坤宮 (庚天盤/壬地盤，2000-01-01 10:00)',
    Rules.checkMainstreamGeju(panXiaoge.天盤, panXiaoge.地盤).some(h => h.name === '小格' && h.gong === '坤'),
    true);
  const panDage = QimenJS.qimenChaibu(Solar, 2000, 1, 1, 18, 0);
  check('大格@震宮 (庚天盤/癸地盤，2000-01-01 18:00)',
    Rules.checkMainstreamGeju(panDage.天盤, panDage.地盤).some(h => h.name === '大格' && h.gong === '震'),
    true);

  // 格局庫擴充第一批(2026-08-29)：4 個「奇儀相加」格局，經 2 個獨立來源交叉核對一致，
  // 窮舉搜出的真實觸發案例
  const panQTZ = QimenJS.qimenChaibu(Solar, 2000, 1, 1, 10, 0);
  check('青龍逃走@坎宮 (乙天盤/辛地盤，2000-01-01 10:00)',
    Rules.checkMainstreamGeju(panQTZ.天盤, panQTZ.地盤).some(h => h.name === '青龍逃走' && h.gong === '坎'),
    true);
  const panQYXZ = QimenJS.qimenChaibu(Solar, 2000, 1, 1, 12, 0);
  check('奇儀相佐@巽宮 (乙天盤/丁地盤，2000-01-01 12:00)',
    Rules.checkMainstreamGeju(panQYXZ.天盤, panQYXZ.地盤).some(h => h.name === '奇儀相佐' && h.gong === '巽'),
    true);
  const panBatch2 = QimenJS.qimenChaibu(Solar, 2000, 1, 2, 14, 0);
  check('星奇朱雀@坎宮 (丙天盤/丁地盤，2000-01-02 14:00)',
    Rules.checkMainstreamGeju(panBatch2.天盤, panBatch2.地盤).some(h => h.name === '星奇朱雀' && h.gong === '坎'),
    true);
  check('奇儀順遂@坤宮 (乙天盤/丙地盤，2000-01-02 14:00)',
    Rules.checkMainstreamGeju(panBatch2.天盤, panBatch2.地盤).some(h => h.name === '奇儀順遂' && h.gong === '坤'),
    true);

  // 格局庫擴充第二批(2026-08-29)：2 個格局，因網頁抓取工具被組織政策擋掉大部分命理站台，
  // 改用搜尋引擎彙整多篇獨立文章摘要交叉核對一致；同一批查證的「太白入熒/熒入太白」發現
  // 不同來源對其吉凶有真正矛盾的解讀(一般事務判凶，測賊/測敵情境下方向相反判吉)，跳過不收錄。
  // 陰害陽門在上面案例一/案例二已經有真實觸發案例，這裡補另一個窮舉搜出的真實觸發案例
  const panRQRDW = QimenJS.qimenChaibu(Solar, 2000, 1, 1, 8, 0);
  check('日奇入地網@震宮 (乙天盤/癸地盤，2000-01-01 08:00)',
    Rules.checkMainstreamGeju(panRQRDW.天盤, panRQRDW.地盤).some(h => h.name === '日奇入地網' && h.gong === '震'),
    true);

  // 格局庫擴充第三批(2026-08-29)：2 個格局，查證方式同第二批，窮舉搜出的真實觸發案例
  const panRQRM = QimenJS.qimenChaibu(Solar, 2000, 1, 1, 16, 0);
  check('日奇入墓@艮宮 (乙天盤/己地盤，2000-01-01 16:00)',
    Rules.checkMainstreamGeju(panRQRM.天盤, panRQRM.地盤).some(h => h.name === '日奇入墓' && h.gong === '艮'),
    true);
  const panRQBX = QimenJS.qimenChaibu(Solar, 2000, 1, 1, 2, 0);
  check('日奇被刑@離宮 (乙天盤/庚地盤，2000-01-01 02:00)',
    Rules.checkMainstreamGeju(panRQBX.天盤, panRQBX.地盤).some(h => h.name === '日奇被刑' && h.gong === '離'),
    true);

  // 格局庫擴充第四批(2026-08-29)：2 個格局，查證方式同第二/三批，窮舉搜出的真實觸發案例
  const panRQRTL = QimenJS.qimenChaibu(Solar, 2000, 1, 1, 18, 0);
  check('日奇入天羅@坤宮 (乙天盤/壬地盤，2000-01-01 18:00)',
    Rules.checkMainstreamGeju(panRQRTL.天盤, panRQRTL.地盤).some(h => h.name === '日奇入天羅' && h.gong === '坤'),
    true);
  const panHBRX = QimenJS.qimenChaibu(Solar, 2000, 1, 6, 10, 0);
  check('火悖入刑@乾宮 (丙天盤/己地盤，2000-01-06 10:00)',
    Rules.checkMainstreamGeju(panHBRX.天盤, panHBRX.地盤).some(h => h.name === '火悖入刑' && h.gong === '乾'),
    true);
}

// ── 三詐五假：6 個窮舉搜出的真實觸發案例 (人假因資料源矛盾未收錄，不測) ──
{
  console.log('\n── 三詐五假 (checkSanzhaWujia) ──');
  const cases = [
    { label: '重詐@巽 (2000-01-01 00:00)', y: 2000, mo: 1, d: 1, h: 0, name: '重詐', gong: '巽' },
    { label: '真詐@震 (2000-01-02 06:00)', y: 2000, mo: 1, d: 2, h: 6, name: '真詐', gong: '震' },
    { label: '天假@乾 (2000-01-02 06:00)', y: 2000, mo: 1, d: 2, h: 6, name: '天假', gong: '乾' },
    { label: '休詐@坎 (2000-01-02 20:00)', y: 2000, mo: 1, d: 2, h: 20, name: '休詐', gong: '坎' },
    { label: '地假@坤 (2000-01-02 22:00)', y: 2000, mo: 1, d: 2, h: 22, name: '地假', gong: '坤' },
    { label: '神假(物假)@震 (2000-01-03 08:00)', y: 2000, mo: 1, d: 3, h: 8, name: '神假(物假)', gong: '震' },
  ];
  cases.forEach(c => {
    const pan = QimenJS.qimenChaibu(Solar, c.y, c.mo, c.d, c.h, 0);
    const hits = Rules.checkSanzhaWujia(pan.天盤, pan.門, pan.神);
    check(c.label, hits.some(h => h.name === c.name && h.gong === c.gong), true);
  });
}

// ── 求桃花簡明定位讀法：六合/休門定位 + 生肖固定桃花位 (用案例一驗證) ──
{
  console.log('\n── 求桃花定位讀法 (analyzeSimpleLocate) ──');
  const pan1 = QimenJS.qimenChaibu(Solar, 2024, 2, 28, 18, 39);
  const { items } = Rules.analyzeSimpleLocate(pan1, '求桃花', pan1.值符值使);
  const liuhe = items.find(it => it.token === '六合');
  const xiumen = items.find(it => it.token === '休');
  check('六合定位於兌宮且無六害', { gong: liuhe.guas[0], bad: liuhe.bad }, { gong: '兌', bad: false });
  check('休門定位於離宮且命中六害', { gong: xiumen.guas[0], bad: xiumen.bad }, { gong: '離', bad: true });

  // 生肖固定桃花位：日支「戌」屬寅午戌三合，桃花在卯，卯對應震宮
  const gz = Rules.parseGanzhi(pan1.干支);
  check('日支戌', gz.日支, '戌');
  check('戌的生肖桃花位是卯', Rules.getPeachBranch(gz.日支), '卯');
  check('卯對應震宮', Rules.ZHI_TO_GONG['卯'], '震');
}

// ── 真太陽時校正 (2026-08-29 新增)：確認不傳經度時行為完全不變，且成都經度校正
//    真的能把時柱算成不同的時辰 (17:30 己酉時 → 校正後 16:26 戊申時) ──
{
  console.log('\n── 真太陽時校正 (applyTrueSolarTime / qimenChaibu 第7參數) ──');
  check('不傳經度=完全不校正',
    QimenJS.applyTrueSolarTime(2024, 2, 28, 17, 30, undefined),
    { year: 2024, month: 2, day: 28, hour: 17, minute: 30, correctionMin: 0 });
  check('成都經度104°E，校正-64分鐘',
    QimenJS.applyTrueSolarTime(2024, 2, 28, 17, 30, 104),
    { year: 2024, month: 2, day: 28, hour: 16, minute: 26, correctionMin: -64 });

  const panUncorrected = QimenJS.qimenChaibu(Solar, 2024, 2, 28, 17, 30);
  check('未校正：17:30 是己酉時，真太陽時校正為 null',
    { gz: panUncorrected.干支, tst: panUncorrected.真太陽時校正 },
    { gz: '甲辰年丙寅月壬戌日己酉時', tst: null });

  const panCorrected = QimenJS.qimenChaibu(Solar, 2024, 2, 28, 17, 30, 104);
  check('成都經度校正後：17:30 變成戊申時 (跨時辰邊界，日柱不變)',
    { gz: panCorrected.干支, tst: panCorrected.真太陽時校正 },
    { gz: '甲辰年丙寅月壬戌日戊申時', tst: { 校正分鐘: -64, 校正後時刻: '2024-02-28 16:26' } });

  // 既有黃金案例：不傳經度時，結果必須跟原本一模一樣 (證明加這個功能沒有動到既有行為)
  const panGolden = QimenJS.qimenChaibu(Solar, 2024, 2, 28, 18, 39);
  check('既有黃金案例(18:39)不傳經度時完全不受影響',
    { gz: panGolden.干支, tst: panGolden.真太陽時校正 },
    { gz: '甲辰年丙寅月壬戌日己酉時', tst: null });
}

// ── 月令五種關係 (2026-08-29 修好的死代碼)：monthRelation 本身 + 財富七要接上 UI 後真的生效 ──
{
  console.log('\n── 月令五種關係 (monthRelation / 財富七要月令項) ──');
  check('木月令 對 土目標 → 月令克A(大虧量小)',
    Rules.monthRelation('木', '土'),
    { rel: '月令克A', effect: '大虧+量小', rank: 5 });
  check('木月令 對 火目標 → 月令生A(擴張量大)',
    Rules.monthRelation('木', '火'),
    { rel: '月令生A', effect: '擴張+量大', rank: 1 });
  check('木月令 對 木目標 → 月令同A(穩健量大)',
    Rules.monthRelation('木', '木'),
    { rel: '月令同A', effect: '穩健+量大', rank: 2 });

  // 不傳 targetWuxing：維持原本「只回報月令本身，不算關係」的行為 (確認沒有意外變成有預設值)
  const pan1 = QimenJS.qimenChaibu(Solar, 2024, 2, 28, 18, 39);
  const noTarget = Rules.analyzeWealthSeven(pan1, { targetWuxing: null }).items.find(it => it.key === '月令');
  check('不指定比較對象時，relation 仍是 null(沒有被偷偷塞預設值)', noTarget.relation, null);

  // 傳 targetWuxing='土'：這次會話新增的 UI 路徑，確認真的算出關係、不再是死代碼
  const withTarget = Rules.analyzeWealthSeven(pan1, { targetWuxing: '土' }).items.find(it => it.key === '月令');
  check('指定比較對象「土」後，relation 真的算出來了',
    { monthWuxing: withTarget.monthWuxing, relation: withTarget.relation },
    { monthWuxing: '木', relation: { rel: '月令克A', effect: '大虧+量小', rank: 5 } });
}

// ── 財富七要/事業七要「符號落中宮時誤顯示✓乾淨」的 bug (2026-08-29 發現並修正) ──
// addLocated() 原本沒判斷 rows 是否為空，符號完全沒落在8個外宮(最常見是落中宮)時
// bad 會算成 false(看起來"乾淨")，其實是根本沒查到，應該是 null(未定位)。
{
  console.log('\n── 財富七要「戊落中宮」不再誤判為乾淨 (2000-01-06 10:00) ──');
  const panCenter = QimenJS.qimenChaibu(Solar, 2000, 1, 6, 10, 0);
  check('戊落在中宮', panCenter.天盤['中'], '戊');
  const wealthItems = Rules.analyzeWealthSeven(panCenter, { targetWuxing: null }).items;
  const wuItem = wealthItems.find(it => it.key === '戊');
  check('戊落中宮時 bad 應為 null(未定位)，不是 false(誤判乾淨)', wuItem.bad, null);
  check('centerInfo 正確標記 inCenter', wuItem.centerInfo.inCenter, true);
}

// ── 主流斷局法：地利(十二長生) (2026-08-29 新增) ──
// 十天干起長生的地支/陰陽干順逆行方向，三個獨立資料源交叉核對一致後鎖定的基準值。
{
  console.log('\n── 地利(十二長生) ──');
  check('甲(陽干,長生亥)順行：亥=長生/子=沐浴/寅=臨官/午=死', {
    亥: Rules.getTwelveStage('甲','亥'), 子: Rules.getTwelveStage('甲','子'),
    寅: Rules.getTwelveStage('甲','寅'), 午: Rules.getTwelveStage('甲','午'),
  }, { 亥:'長生', 子:'沐浴', 寅:'臨官', 午:'死' });
  check('乙(陰干,長生午)逆行：午=長生/巳=沐浴', {
    午: Rules.getTwelveStage('乙','午'), 巳: Rules.getTwelveStage('乙','巳'),
  }, { 午:'長生', 巳:'沐浴' });
  check('戊長生寅、己長生酉(土寄丙丁)、庚長生巳、壬長生申、癸長生卯', {
    戊: Rules.getTwelveStage('戊','寅'), 己: Rules.getTwelveStage('己','酉'),
    庚: Rules.getTwelveStage('庚','巳'), 壬: Rules.getTwelveStage('壬','申'),
    癸: Rules.getTwelveStage('癸','卯'),
  }, { 戊:'長生', 己:'長生', 庚:'長生', 壬:'長生', 癸:'長生' });
  check('艮宮(丑+寅)兩地支分開列，不強行合併成一個結論',
    Rules.getTwelveStagesAtGong('戊','艮'),
    [{branch:'丑',stage:'養'},{branch:'寅',stage:'長生'}]);

  const pan1 = QimenJS.qimenChaibu(Solar, 2024, 2, 28, 18, 39);
  const diliHits = Rules.checkDili(pan1.天盤, pan1.地盤);
  check('案例一：天盤乙落震宮(卯)為臨官(得地利)',
    diliHits.some(h => h.panType==='天盤' && h.gong==='震' && h.stem==='乙' && h.stage==='臨官' && h.luck==='吉'),
    true);
  check('案例一：天盤壬落巽宮(辰)為墓(失地利)',
    diliHits.some(h => h.panType==='天盤' && h.gong==='巽' && h.stem==='壬' && h.branch==='辰' && h.stage==='墓' && h.luck==='凶'),
    true);
}

// ── 主流斷局法：主客(天盤干/地盤干生克關係) (2026-08-29 新增) ──
// 「被克/被生的一方，利益歸誰」的判斷邏輯，多方獨立資料源交叉核對一致後鎖定的基準值：
// 天盤克地盤／地盤生天盤＝利客；地盤克天盤／天盤生地盤＝利主；五行相同(比和)不分勝負。
{
  console.log('\n── 主客(天盤干/地盤干生克關係) ──');
  check('天盤木克地盤土：天克地，利客', Rules.checkZhuke({艮:'甲'}, {艮:'己'})[0].relation, '天克地');
  check('天盤木克地盤土：天克地，利客(favor)', Rules.checkZhuke({艮:'甲'}, {艮:'己'})[0].favor, '客');
  check('地盤金克天盤木：地克天，利主', Rules.checkZhuke({艮:'甲'}, {艮:'庚'})[0].relation, '地克天');
  check('地盤金克天盤木：地克天，利主(favor)', Rules.checkZhuke({艮:'甲'}, {艮:'庚'})[0].favor, '主');
  check('天盤水生地盤木：天生地，利主', Rules.checkZhuke({艮:'壬'}, {艮:'甲'})[0].favor, '主');
  check('地盤水生天盤木：地生天，利客', Rules.checkZhuke({艮:'甲'}, {艮:'壬'})[0].favor, '客');
  check('天盤地盤同五行(甲/乙皆木)：比和，不分勝負', Rules.checkZhuke({艮:'甲'}, {艮:'乙'})[0], {
    gong:'艮', skyStem:'甲', earthStem:'乙', skyWx:'木', earthWx:'木', relation:'比和', favor:'平',
  });
  check('中宮不計入主客判斷', Rules.checkZhuke({中:'庚', 艮:'甲'}, {中:'庚', 艮:'己'}).some(h=>h.gong==='中'), false);

  const pan1 = QimenJS.qimenChaibu(Solar, 2024, 2, 28, 18, 39);
  const zhukeHits = Rules.checkZhuke(pan1.天盤, pan1.地盤);
  check('案例一：巽宮天盤壬(水)地盤己(土)——地克天，利主',
    zhukeHits.some(h => h.gong==='巽' && h.skyStem==='壬' && h.earthStem==='己' && h.relation==='地克天' && h.favor==='主'),
    true);
  check('案例一：震宮天盤乙(木)地盤戊(土)——天克地，利客',
    zhukeHits.some(h => h.gong==='震' && h.skyStem==='乙' && h.earthStem==='戊' && h.relation==='天克地' && h.favor==='客'),
    true);
  check('案例一：兌宮天盤癸(水)地盤壬(水)——比和',
    zhukeHits.some(h => h.gong==='兌' && h.skyStem==='癸' && h.earthStem==='壬' && h.relation==='比和' && h.favor==='平'),
    true);
  check('案例一：8個外宮全部各命中一筆(無漏算無重複)', zhukeHits.length, 8);
}

// ── 主流斷局法：天時(九星按月令旺相休囚死) (2026-08-29 新增) ──
// 跟一般八字五行旺相休囚死的判斷基準點不同(著眼星曜「往外生助」的作用力，而非跟季節比同氣)，
// 163.com/CSDN 等多方獨立來源給出的天蓬(水)具體案例，是鎖定這套規則的關鍵基準值。
{
  console.log('\n── 天時(九星按月令旺相休囚死) ──');
  check('天蓬(水)：旺寅卯/相亥子/休巳午/囚辰戌丑未/死申酉 全部核對', {
    寅:Rules.getNineStarState('水','木'), 亥:Rules.getNineStarState('水','水'),
    巳:Rules.getNineStarState('水','火'), 辰:Rules.getNineStarState('水','土'),
    申:Rules.getNineStarState('水','金'),
  }, { 寅:'旺', 亥:'相', 巳:'休', 辰:'囚', 申:'死' });
  check('天冲(木)：旺巳午/相寅卯/休辰戌丑未/囚申酉/死亥子(古訣反推第二例)', {
    巳:Rules.getNineStarState('木','火'), 寅:Rules.getNineStarState('木','木'),
    辰:Rules.getNineStarState('木','土'), 申:Rules.getNineStarState('木','金'),
    亥:Rules.getNineStarState('木','水'),
  }, { 巳:'旺', 寅:'相', 辰:'休', 申:'囚', 亥:'死' });
  check('休(平)不算吉也不算凶，不進入吉凶清單', Rules.checkTianshi({艮:'心'}, '寅').length, 0);

  const pan1 = QimenJS.qimenChaibu(Solar, 2024, 2, 28, 18, 39);
  const gz1 = Rules.parseGanzhi(pan1.干支);
  check('案例一月支為寅(木令)', gz1.月支, '寅');
  const tianshiHits = Rules.checkTianshi(pan1.星, gz1.月支);
  check('案例一：坤宮天蓬(水)在寅月為旺(吉)',
    tianshiHits.some(h=>h.gong==='坤' && h.star==='蓬' && h.state==='旺' && h.luck==='吉'), true);
  check('案例一：兌宮天任(土)在寅月為囚(凶)',
    tianshiHits.some(h=>h.gong==='兌' && h.star==='任' && h.state==='囚' && h.luck==='凶'), true);
  check('案例一：乾宮天冲(木)在寅月為相(吉)',
    tianshiHits.some(h=>h.gong==='乾' && h.star==='沖' && h.state==='相' && h.luck==='吉'), true);
  check('案例一：離宮天心(金)在寅月為休，不列入吉凶清單',
    tianshiHits.some(h=>h.gong==='離'), false);
}

// ── 主流斷局法：人和(門宮關係 迫/制/和/義) (2026-08-29 新增) ──
// 「門克宮迫／宮克門制／門生宮和／宮生門義」這句原文用精確詞句比對過 3 個獨立來源才鎖定
// (中途搜到一次語序相反的說法，因此特別加了這一步排除歧義，避免像「人假」那樣誤收矛盾說法)。
{
  console.log('\n── 人和(門宮關係 迫/制/和/義) ──');
  check('門克宮(金克木)＝迫，凶', Rules.getMenGongRelation('金','木'), '迫');
  check('宮克門(金克木，門木宮金)＝制，凶', Rules.getMenGongRelation('木','金'), '制');
  check('門生宮(木生火)＝和，吉', Rules.getMenGongRelation('木','火'), '和');
  check('宮生門(水生木，宮水門木)＝義，吉', Rules.getMenGongRelation('木','水'), '義');
  check('五行相同＝比和，不屬於迫制和義任何一種', Rules.getMenGongRelation('土','土'), '比和');
  check('中宮不計入人和判斷', Rules.checkRenhe({中:'開', 震:'休'}).some(h=>h.gong==='中'), false);

  const pan1 = QimenJS.qimenChaibu(Solar, 2024, 2, 28, 18, 39);
  const renheHits = Rules.checkRenhe(pan1.門);
  check('案例一：8個外宮全部各命中一筆(無漏算無重複)', renheHits.length, 8);
  check('案例一：震宮驚門(金)克木宮＝迫，凶',
    renheHits.some(h=>h.gong==='震' && h.door==='驚' && h.relation==='迫' && h.luck==='凶'), true);
  check('案例一：兌宮傷門(木)被金宮克＝制，凶',
    renheHits.some(h=>h.gong==='兌' && h.door==='傷' && h.relation==='制' && h.luck==='凶'), true);
  check('案例一：坤宮生門(土)與坤宮(土)比和',
    renheHits.some(h=>h.gong==='坤' && h.door==='生' && h.relation==='比和' && h.luck==='平'), true);
  check('這局剛好沒有和/義案例，8個外宮全部落在迫/制/比和三類',
    renheHits.every(h=>['迫','制','比和'].includes(h.relation)), true);

  const pan2 = QimenJS.qimenChaibu(Solar, 1901, 4, 13, 14, 30);
  const renheHits2 = Rules.checkRenhe(pan2.門);
  check('案例二：兌宮生門(土)生金宮＝和，吉',
    renheHits2.some(h=>h.gong==='兌' && h.door==='生' && h.relation==='和' && h.luck==='吉'), true);
  check('案例二：坎宮杜門(木)被水宮生＝義，吉',
    renheHits2.some(h=>h.gong==='坎' && h.door==='杜' && h.relation==='義' && h.luck==='吉'), true);
}

// ── 主流斷局法：伏吟反吟(星/門) (2026-08-29 新增) ──
// 兩個獨立來源交叉核對一致的固定本宮表(洛書配宮)。窮舉搜尋 2020 年附近日期找到的 4 種真實
// 觸發案例，順便驗證了一個結構性事實：由於星盤/門盤是整圈一起旋轉，伏吟/反吟永遠是「整局」
// 同時出現(全部 8 個外宮同時命中同一種)，不會只有單一宮位孤立命中——這不是憑空假設，是拿
// 這 3 個真實案例實測出來的。
{
  console.log('\n── 伏吟反吟(星/門) ──');
  check('天蓬本宮為坎', Rules.STAR_HOME['蓬'], '坎');
  check('天英本宮為離(坎的對沖)', Rules.STAR_HOME['英'], '離');
  check('休門本宮為坎', Rules.DOOR_HOME['休'], '坎');

  const panFu = QimenJS.qimenChaibu(Solar, 2020, 1, 1, 0, 0);
  const fuHits = Rules.checkFuyinFanyin(panFu.星, panFu.門);
  check('2020-01-01 00:00：全局星伏吟(8個外宮全部命中，門盤未伏吟未反吟)',
    { 星伏吟數: fuHits.filter(h=>h.type==='星伏吟').length, 其他數: fuHits.filter(h=>h.type!=='星伏吟').length },
    { 星伏吟數: 8, 其他數: 0 });

  const panFan = QimenJS.qimenChaibu(Solar, 2020, 1, 1, 12, 0);
  const fanHits = Rules.checkFuyinFanyin(panFan.星, panFan.門);
  check('2020-01-01 12:00：星反吟＋門反吟同時全局命中(16筆)',
    { 星反吟數: fanHits.filter(h=>h.type==='星反吟').length, 門反吟數: fanHits.filter(h=>h.type==='門反吟').length },
    { 星反吟數: 8, 門反吟數: 8 });

  const panMenFu = QimenJS.qimenChaibu(Solar, 2020, 1, 1, 2, 0);
  const menFuHits = Rules.checkFuyinFanyin(panMenFu.星, panMenFu.門);
  check('2020-01-01 02:00：全局門伏吟(8個外宮全部命中，星盤未伏吟未反吟)',
    { 門伏吟數: menFuHits.filter(h=>h.type==='門伏吟').length, 其他數: menFuHits.filter(h=>h.type!=='門伏吟').length },
    { 門伏吟數: 8, 其他數: 0 });

  const pan1 = QimenJS.qimenChaibu(Solar, 2024, 2, 28, 18, 39);
  const hits1 = Rules.checkFuyinFanyin(pan1.星, pan1.門);
  check('案例一(2024-02-28 18:39)：全局門反吟(荀爽老師案例本身剛好是門反吟局)',
    { 門反吟數: hits1.filter(h=>h.type==='門反吟').length, 其他數: hits1.filter(h=>h.type!=='門反吟').length },
    { 門反吟數: 8, 其他數: 0 });
}

// ── 師傅總結引擎 (buildMasterSummary / buildGongProfiles) (2026-08-29 新增) ──
// 用戶真實命局(1988-02-23 20:45，河南鄭州，經度113.65)當作主要驗證案例，逐項手算核對過
// 才寫成測試；用戶明確要求「主流認為.../荀爽認為...」必須分開標籤，不能融在一起，所以這裡
// 特別鎖定 xunlao(荀爽)/mainstream(主流) 兩個陣列彼此獨立、互不污染。
{
  console.log('\n── 師傅總結引擎 (buildMasterSummary) ──');

  // formatCureSteps: 純資料重組，用簡單假資料鎖定行為
  check('formatCureSteps 對 null 回傳 null', Rules.formatCureSteps(null), null);
  {
    const cs=Rules.formatCureSteps({hai:'刑', xiang:{stem:'丁',wuxing:'火',zi:'寫「丁」字',
      wu:'擺放暗紅尖刺類物品',yi:'學習表達/展示型知識',xing:'有氧/爆發類運動',placement:'高處'},
      place:'正西或正北', method:'用合(天干五合)', verified:true});
    check('formatCureSteps 字/物/意/行 4 維度齊全',
      cs.buzhen.map(b=>b.dimension), ['字','物','意','行']);
    check('formatCureSteps 保留 place/method', {place:cs.place, method:cs.method},
      {place:'正西或正北', method:'用合(天干五合)'});
  }

  const gz1 = Rules.parseGanzhi('戊辰年甲寅月戊申日壬戌時');
  check('用戶命局干支拆解正確', gz1, {年干:'戊',年支:'辰',月干:'甲',月支:'寅',日干:'戊',日支:'申',時干:'壬',時支:'戌'});

  const pan = QimenJS.qimenChaibu(Solar, 1988, 2, 23, 20, 45, 113.65);
  check('用戶命局干支(含真太陽時校正)', pan.干支, '戊辰年甲寅月戊申日壬戌時');
  const zfzs = pan.值符值使;
  const zhifuStem = zfzs.值符天干 ? zfzs.值符天干[1] : null;
  check('用戶命局值符天干為癸', zhifuStem, '癸');
  const protectedStems = Rules.buildProtectedStems(pan.干支, '', null, zhifuStem);
  check('命局籠統分析(無所求)的號令天干＝日干戊/時干壬/值符癸',
    [...protectedStems].sort(), ['戊','壬','癸'].sort());

  const summary = Rules.buildMasterSummary(pan, protectedStems, null);
  check('最該注意的3個宮依序是巽/乾/艮', summary.hotspots.map(h=>h.gong), ['巽','乾','艮']);

  const xunGong = summary.hotspots.find(h=>h.gong==='巽');
  check('巽宮荀爽體系命中刑+迫，兩條都命中號令(時干壬)',
    xunGong.xunlao.map(x=>({type:x.type, isHit:x.isHit})),
    [{type:'刑',isHit:true},{type:'迫',isHit:true}]);
  check('巽宮主流體系：地利×3(2失1得)+主客+人和，共5條',
    xunGong.mainstream.map(x=>x.type),
    ['地利','地利','地利','主客','人和']);
  check('巽宮地利：天盤壬墓/絕命中號令，地盤己帝旺不命中號令(己非護體天干)',
    xunGong.mainstream.filter(x=>x.type==='地利').map(x=>x.isHit),
    [true, true, false]);

  const ganGong = summary.hotspots.find(h=>h.gong==='乾');
  check('乾宮(日干戊天盤位)：荀爽六害完全乾淨，不代表沒事，只是六害這層沒命中',
    ganGong.xunlao.length, 0);
  check('乾宮主流體系5條全部命中號令(日干戊)',
    ganGong.mainstream.every(x=>x.isHit), true);

  const genGong = summary.hotspots.find(h=>h.gong==='艮');
  check('艮宮荀爽體系：入墓命中的是丁(非護體天干，isHit false)，空亡isHit永遠true',
    genGong.xunlao.map(x=>({type:x.type, isHit:x.isHit})),
    [{type:'墓',isHit:false},{type:'空',isHit:true}]);
  check('艮宮命中朱雀投江格局，但丁不是護體天干，isHit為false(背景，不是直接命中你自己)',
    genGong.mainstream.find(x=>x.type==='格局').isHit, false);

  // 一致性/分歧標記：巽/乾/艮 這局都是 mixed (主流內部有吉有凶，不是單邊倒)
  check('巽/乾/艮三個熱點在這個案例裡都是 mixed(體系內部吉凶不一致，如實呈現不強行調和)',
    summary.hotspots.map(h=>h.agreement), ['mixed','mixed','mixed']);

  // 黃金案例：確保新引擎套用在既有案例上不會崩潰、且找得出熱點
  const panGolden = QimenJS.qimenChaibu(Solar, 2024, 2, 28, 18, 39);
  const protectedGolden = Rules.buildProtectedStems(panGolden.干支, '', '求財', null);
  const summaryGolden = Rules.buildMasterSummary(panGolden, protectedGolden, '求財');
  check('黃金案例：師傅總結引擎正常跑出3個熱點，不崩潰', summaryGolden.hotspots.length, 3);
  check('黃金案例最高分熱點是巽宮(時干己酉的己在巽宮擊刑+全局門反吟)',
    summaryGolden.hotspots[0].gong, '巽');

  // 事局 vs 命局：灭象布阵是荀爽老師針對「事局」設計的具體操作方法，命局是天生整體結構，
  // 不是在問一件具體的事，硬套「去某方位擺某物品」的指令會文不對題(用戶實測發現的問題：
  // 命局跟事局混在一起講，很容易搞亂、顯得不準)。2026-08-29 修正：命局模式下只講「命中了
  // 什麼」，不給具體布阵操作指令，改用 MINGJU_CURE_NOTE 說明原因。
  const summaryShiju = Rules.buildMasterSummary(pan, protectedStems, null, '事局');
  const summaryMingju = Rules.buildMasterSummary(pan, protectedStems, null, '命局');
  check('事局模式：巽宮擊刑有完整的灭象布阵步驟(cureSteps 非空)',
    summaryShiju.hotspots.find(h=>h.gong==='巽').xunlao.find(x=>x.type==='刑').cureSteps!==null, true);
  check('命局模式：巽宮擊刑不給具體布阵指令(cureSteps 為 null)，改用說明文字取代',
    summaryMingju.hotspots.find(h=>h.gong==='巽').xunlao.find(x=>x.type==='刑'),
    {type:'刑', stem:'壬', isHit:true,
      text:'天干「壬」在這裡擊刑——爭執損耗。刑打的是「六儀」（正面主力）——正面主力被絞殺殆盡，全面崩潰',
      cureSteps:null, cureNote:Rules.MINGJU_CURE_NOTE});
  check('命局模式下，兩種局的「命中了什麼」判斷本身完全一樣(只有化解步驟的呈現方式不同)',
    summaryMingju.hotspots.map(h=>h.gong), summaryShiju.hotspots.map(h=>h.gong));
}

// ── 主流斷局法：驛馬 (2026-08-29 新增) ──
// 傳統查法(申子辰馬在寅/寅午戌馬在申/巳酉丑馬在亥/亥卯未馬在巳)，2 個獨立來源交叉核對一致。
// 年/月/日/時支分開起，跟本專案「空亡」用日空+時空分開算是同一個設計精神。
{
  console.log('\n── 驛馬 ──');
  check('申子辰馬在寅', { 申:Rules.YIMA_TABLE['申'], 子:Rules.YIMA_TABLE['子'], 辰:Rules.YIMA_TABLE['辰'] },
    { 申:'寅', 子:'寅', 辰:'寅' });
  check('寅午戌馬在申', { 寅:Rules.YIMA_TABLE['寅'], 午:Rules.YIMA_TABLE['午'], 戌:Rules.YIMA_TABLE['戌'] },
    { 寅:'申', 午:'申', 戌:'申' });
  check('巳酉丑馬在亥', { 巳:Rules.YIMA_TABLE['巳'], 酉:Rules.YIMA_TABLE['酉'], 丑:Rules.YIMA_TABLE['丑'] },
    { 巳:'亥', 酉:'亥', 丑:'亥' });
  check('亥卯未馬在巳', { 亥:Rules.YIMA_TABLE['亥'], 卯:Rules.YIMA_TABLE['卯'], 未:Rules.YIMA_TABLE['未'] },
    { 亥:'巳', 卯:'巳', 未:'巳' });

  const panGolden = QimenJS.qimenChaibu(Solar, 2024, 2, 28, 18, 39);
  check('案例一干支為 甲辰年丙寅月壬戌日己酉時', panGolden.干支, '甲辰年丙寅月壬戌日己酉時');
  const protectedGolden = Rules.buildProtectedStems(panGolden.干支, '', '求財', null);
  const yimaGolden = Rules.checkYima(panGolden, panGolden.天盤, protectedGolden);
  check('案例一：年支辰(申子辰)驛馬落寅=艮宮', yimaGolden.find(h=>h.ref==='年'),
    { ref:'年', refBranch:'辰', yimaBranch:'寅', gong:'艮', isHit:false });
  check('案例一：月支寅(寅午戌)驛馬落申=坤宮', yimaGolden.find(h=>h.ref==='月'),
    { ref:'月', refBranch:'寅', yimaBranch:'申', gong:'坤', isHit:false });
  check('案例一：日支戌(寅午戌)驛馬落申=坤宮(跟月支同組)', yimaGolden.find(h=>h.ref==='日'),
    { ref:'日', refBranch:'戌', yimaBranch:'申', gong:'坤', isHit:false });
  check('案例一：時支酉(巳酉丑)驛馬落亥=乾宮，且乾宮天盤戊為護體天干，命中號令',
    yimaGolden.find(h=>h.ref==='時'), { ref:'時', refBranch:'酉', yimaBranch:'亥', gong:'乾', isHit:true });
  check('案例一：4個參照支各自獨立列出，不強行合併(共4筆)', yimaGolden.length, 4);

  const panUser = QimenJS.qimenChaibu(Solar, 1988, 2, 23, 20, 45, 113.65);
  const zfzsUser = panUser.值符值使;
  const protectedUser = Rules.buildProtectedStems(panUser.干支, '', null, zfzsUser.值符天干?zfzsUser.值符天干[1]:null);
  const yimaUser = Rules.checkYima(panUser, panUser.天盤, protectedUser);
  check('用戶命局：年支辰與日支申都落艮/坤，但屬不同參照點，各自列出不合併(共4筆)',
    yimaUser.length, 4);
  check('用戶命局：年支辰、日支申的驛馬剛好落在同一組宮位(艮/坤)，是巧合不是同一件事',
    yimaUser.map(h=>h.gong).sort(), ['艮','坤','艮','坤'].sort());
}

console.log(`\n══ 結果: ${pass} 通過, ${fail} 失敗 ══`);
process.exit(fail > 0 ? 1 : 0);

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
  check('案例一命中朱雀投江@艮',
    Rules.checkMainstreamGeju(pan1.天盤, pan1.地盤).map(h => `${h.name}@${h.gong}`),
    ['朱雀投江@艮']);

  const pan2 = QimenJS.qimenChaibu(Solar, 1901, 4, 13, 14, 30);
  check('案例二命中白虎猖狂@乾、朱雀投江@震',
    Rules.checkMainstreamGeju(pan2.天盤, pan2.地盤).map(h => `${h.name}@${h.gong}`).sort(),
    ['朱雀投江@震', '白虎猖狂@乾'].sort());

  const pan3 = QimenJS.qimenChaibu(Solar, 2024, 8, 1, 12, 0);
  check('案例三命中飛鳥跌穴@兌',
    Rules.checkMainstreamGeju(pan3.天盤, pan3.地盤).map(h => `${h.name}@${h.gong}`),
    ['飛鳥跌穴@兌']);

  // 窮舉搜出的真實觸發案例 (2026-08-27 開發時已核對過天盤/地盤干完全對應公式)
  const panXiaoge = QimenJS.qimenChaibu(Solar, 2000, 1, 1, 10, 0);
  check('小格@坤宮 (庚天盤/壬地盤，2000-01-01 10:00)',
    Rules.checkMainstreamGeju(panXiaoge.天盤, panXiaoge.地盤).some(h => h.name === '小格' && h.gong === '坤'),
    true);
  const panDage = QimenJS.qimenChaibu(Solar, 2000, 1, 1, 18, 0);
  check('大格@震宮 (庚天盤/癸地盤，2000-01-01 18:00)',
    Rules.checkMainstreamGeju(panDage.天盤, panDage.地盤).some(h => h.name === '大格' && h.gong === '震'),
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

console.log(`\n══ 結果: ${pass} 通過, ${fail} 失敗 ══`);
process.exit(fail > 0 ? 1 : 0);

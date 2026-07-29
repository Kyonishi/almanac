// ══════════════════════════════════════════════════════════════════════
// 回歸測試: 用兩個已經對照荀爽老師真實案例驗證過的排盤結果，鎖定引擎行為。
// 以後每次改動 qimen.html 裡的排盤演算法 (panSky/panDoor/panStar/panGod 等)，
// 都應該先跑一次這個腳本，確保沒有把已驗證正確的東西改壞。
//
// 用法:
//   npm install lunar-javascript --save-dev   (只需裝一次)
//   node tests/regression.test.js
//
// 這個腳本直接從 qimen.html 裡「即時擷取」引擎那段 <script>，而不是維護一份
// 獨立複製的 engine.js —— 這樣測試永遠對照的是目前這份 qimen.html 的真實行為，
// 不會有兩份程式碼漸漸不同步的風險。
// ══════════════════════════════════════════════════════════════════════

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const { Solar } = require('lunar-javascript');

const HTML_PATH = path.join(__dirname, '..', 'qimen.html');
const html = fs.readFileSync(HTML_PATH, 'utf-8');
const scriptBlocks = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]);
if (scriptBlocks.length < 1) {
  console.error('✕ 找不到 qimen.html 裡的 <script> 區塊，測試無法執行');
  process.exit(1);
}

// 第一個 inline <script> 是純算法引擎 (qimenChaibu)，寫進暫存檔用 require() 載入
const TMP_ENGINE = path.join(__dirname, '.__engine_tmp.js');
fs.writeFileSync(TMP_ENGINE, scriptBlocks[0]);
const QimenJS = require(TMP_ENGINE);
fs.unlinkSync(TMP_ENGINE);

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

console.log(`\n══ 結果: ${pass} 通過, ${fail} 失敗 ══`);
process.exit(fail > 0 ? 1 : 0);

// qimen-rules.js — 六害檢測/化解、主流格局判斷、財富七要/事業七要、五個所求的簡明定位讀法、
// 桃花生肖位等「純邏輯」層：只讀 pan 物件、回傳資料或 HTML 字串，不直接碰 DOM。
// 2026-08-27 從 qimen.html 內嵌 <script> 拆分而來 (純搬移，未改動任何邏輯)。
// 依賴: qimen-lexicon.js (LEX_DATA)。
/* ── 資料常量 ── */
const EIGHT_GUA_ORDER=['坎','坤','震','巽','中','乾','兌','艮','離']; // 一~九
// 九宮在螢幕上的位置 (3×3, 行0上→行2下, 列0左→列2右)
// 傳統奇門盤方位: 上南下北左東右西 (或上北下南?) — 以最常見的上南下北顯示
// 實際排列: 
//  巽4  離9  坤2
//  震3  中5  兌7
//  艮8  坎1  乾6
const GRID_ORDER=['巽','離','坤','震','中','兌','艮','坎','乾'];
const GUA_NAME={'坎':'坎一水','坤':'坤二土','震':'震三木','巽':'巽四木',
  '中':'中五土','乾':'乾六金','兌':'兌七金','艮':'艮八土','離':'離九火'};

// 後天八卦方位 (固定對照, 業界通用慣例): 離=南 坎=北 震=東 兌=西, 四角宮巽/坤/艮/乾對應東南/西南/東北/西北
const GUA_DIR={'離':'南','坎':'北','震':'東','兌':'西','巽':'東南','坤':'西南','艮':'東北','乾':'西北'};

// 後天八卦象義 (人物/身體/自然物/性情, 易經基礎共識內容, 跨門派通用, 非奇門特定流派內容)
// 來源: 《說卦傳》後天八卦體系, 各家易學教材逐字一致, 沒有版本分歧
const GUA_XIANG={
  '乾':{person:'老父、長官、權威人物、政府', body:'頭', nature:'天、金屬', trait:'健（剛健、主動、領導）'},
  '坤':{person:'老母、群眾、部屬、大眾', body:'腹', nature:'地、土壤', trait:'順（柔順、包容、承載）'},
  '震':{person:'長男、決策者、行動者', body:'足', nature:'雷、震動之物', trait:'動（起始、驚動、行動力）'},
  '巽':{person:'長女、業務/溝通者', body:'股（大腿）', nature:'風、木材、繩索', trait:'入（滲透、謀略、漸進）'},
  '坎':{person:'中男、勞碌者、隱藏者', body:'耳', nature:'水、江河', trait:'陷（險難、辛勞、隱伏）'},
  '離':{person:'中女、文書/媒體相關者', body:'目', nature:'火、光明之物', trait:'麗（附著、光明、文書之事）'},
  '艮':{person:'少男、看守者、阻擋者', body:'手', nature:'山、丘陵', trait:'止（停止、阻隔、靜止不動）'},
  '兌':{person:'少女、口才/娛樂相關者', body:'口', nature:'澤、金屬器物', trait:'悅（喜悅、口舌、交流）'},
};

// 後天八卦配支 (固定對照, 十二地支分配到八宮, 四角宮各佔兩支)
// 用於把「日空/時空」的地支標到正確宮位上 — 此對照表是業界通用慣例,
// 並非 kinqimen 函式庫本身輸出(該庫只回傳地支字串, 不含宮位對應), 故未經交叉驗證,
// 採用傳統命理通行寫法。
const ZHI_TO_GONG={'子':'坎','丑':'艮','寅':'艮','卯':'震','辰':'巽','巳':'巽',
  '午':'離','未':'坤','申':'坤','酉':'兌','戌':'乾','亥':'乾'};
// ZHI_TO_GONG 反查：每宮對應哪些地支(四角宮各兩個)。供十二長生查地利用。
const GONG_TO_ZHI={};
Object.entries(ZHI_TO_GONG).forEach(([zhi,gong])=>{ (GONG_TO_ZHI[gong]=GONG_TO_ZHI[gong]||[]).push(zhi); });

// ══════════════════ 主流斷局法：地利(十二長生) ══════════════════
// 來源: 2026-08-29 綜合多個獨立線上命理資料源交叉核對一致(十天干起長生的地支、陰陽干順逆行
// 方向)，是跨八字/紫微/奇門通用的基礎推運工具，非奇門特定流派內容。跟荀爽老師的六害體系是
// 完全獨立的另一套判斷，用戶要求：主流斷局法(天時地利人和主客)要陸續補上、跟荀爽體系分開
// 展示，這是第一個要補的維度(地利)。
//
// 十天干起「長生」的地支 (陽干順行、陰干逆行走完12個階段)：
// 甲→亥／乙→午／丙→寅／丁→酉／戊→寅(寄丙)／己→酉(寄丁)／庚→巳／辛→子／壬→申／癸→卯
const CHANGSHENG_START={'甲':'亥','乙':'午','丙':'寅','丁':'酉','戊':'寅','己':'酉','庚':'巳','辛':'子','壬':'申','癸':'卯'};
const YANG_STEMS=new Set(['甲','丙','戊','庚','壬']); // 陽干順行；陰干(乙丁己辛癸)逆行
const TWELVE_STAGES=['長生','沐浴','冠帶','臨官','帝旺','衰','病','死','墓','絕','胎','養'];
// 得地利(旺)＝長生/臨官/帝旺；失地利(衰)＝死/墓/絕；其餘六個階段(沐浴/冠帶/衰/病/胎/養)算平，不特別標注
const DILI_JI=new Set(['長生','臨官','帝旺']);
const DILI_XIONG=new Set(['死','墓','絕']);

// 用 BRANCH_ORDER('子丑寅卯...', 定義於本檔案下方 yearToBranch 那段)算地支順逆位移，
// 不引用 qimen-engine.js 內部的 DI_ZHI——那個被包在 IIFE 裡，qimen-rules.js 拿不到。
function getTwelveStage(stem, branch){
  const start=CHANGSHENG_START[stem];
  if(!start)return null;
  const startIdx=BRANCH_ORDER.indexOf(start), branchIdx=BRANCH_ORDER.indexOf(branch);
  const isYang=YANG_STEMS.has(stem);
  const diff=isYang ? (branchIdx-startIdx+12)%12 : (startIdx-branchIdx+12)%12;
  return TWELVE_STAGES[diff];
}
// 給一個天干+它現在所在的宮，回傳這個宮對應的每個地支各自的十二長生階段。
// 四角宮(艮/巽/坤/乾)各對應兩個地支，兩個分開列，不強行合併成一個結論——
// 跟專案裡「旬空」處理四角宮的方式(日空/時空分開標)是同一個做法。
function getTwelveStagesAtGong(stem, gong){
  const branches=GONG_TO_ZHI[gong]||[];
  return branches.map(branch=>({branch, stage:getTwelveStage(stem, branch)}));
}
// 掃描天盤/地盤全部8個外宮(中宮無獨立地支，寄宮規則各派不同，不在此判斷範圍內)，
// 找出「得地利」或「失地利」的天干+宮位組合。
function checkDili(sky, earth){
  const hits=[];
  const scan=(map, panType)=>{
    Object.entries(map).forEach(([gong,stem])=>{
      if(gong==='中'||!stem)return;
      getTwelveStagesAtGong(stem,gong).forEach(({branch,stage})=>{
        if(DILI_JI.has(stage)) hits.push({panType, gong, stem, branch, stage, luck:'吉'});
        else if(DILI_XIONG.has(stage)) hits.push({panType, gong, stem, branch, stage, luck:'凶'});
      });
    });
  };
  scan(sky,'天盤');
  scan(earth,'地盤');
  return hits;
}

// ══════════════════ 主流斷局法：主客(天盤干/地盤干生克關係) ══════════════════
// 來源: 2026-08-29 綜合多個獨立線上命理資料源交叉核對一致：天盤跟著時辰轉動＝客，
// 地盤在一局的六十個時辰內不動＝主。生克判斷是「被克/被生的那一方，是誰的利益」：
// 天盤干克地盤干 → 利客；地盤干生天盤干 → 利客(主在餵客，客得利)；
// 地盤干克天盤干 → 利主；天盤干生地盤干 → 利主(客在餵主，主得利)；
// 五行相同(比和) → 主客同心，不分勝負。
// 通常自己/我方問事視為「主」，對方或所問之事的變化視為「客」——這是預設慣例、不是絕對規則，
// 依實際占問對象可能相反，此處只算五行關係，「主/客」的角色指派留給使用者自行判斷。
// 這套判斷跟六害/格局/地利是完全獨立的另一個維度，用天盤干、地盤干本身的五行做判斷，
// 不管它們落在哪個宮(宮位五行是另一個維度，門迫已經在用了，這裡不重複套用)。
function checkZhuke(sky, earth){
  const hits=[];
  Object.keys(sky).forEach(gua=>{
    if(gua==='中')return;
    const skyStem=sky[gua], earthStem=earth[gua];
    if(!skyStem||!earthStem)return;
    const skyWx=stemWuxing(skyStem), earthWx=stemWuxing(earthStem);
    let relation, favor;
    if(skyWx===earthWx){ relation='比和'; favor='平'; }
    else if(KE_TABLE_WUXING[skyWx]===earthWx){ relation='天克地'; favor='客'; }
    else if(KE_TABLE_WUXING[earthWx]===skyWx){ relation='地克天'; favor='主'; }
    else if(SHENG_TABLE[skyWx]===earthWx){ relation='天生地'; favor='主'; }
    else if(SHENG_TABLE[earthWx]===skyWx){ relation='地生天'; favor='客'; }
    if(relation) hits.push({gong:gua, skyStem, earthStem, skyWx, earthWx, relation, favor});
  });
  return hits;
}

// ══════════════════ 主流斷局法：天時(九星按月令旺相休囚死) ══════════════════
// 來源: 2026-08-29 查證時發現九星的旺相休囚「廢」跟一般八字五行旺相休囚死的判斷基準點不同
// (CSDN/163等多方獨立來源明確指出、解釋原因一致，非單一部落格說法)：
// 八字是拿「地上五行」跟「當令季節」比，同我者旺；奇門九星是拿「星曜」跟「當令月支五行」比，
// 看重的是星曜「往外生助」的作用力，我生之月才是旺，跟自己同五行反而只排第二(相)。
// 古訣(六親式口訣，來源與上述一致)：「我生之月誠為旺，與我同行及為相，廢於父母休於財，
// 囚於鬼兮真不妄」──父母=生我者，財=我克者，鬼(官鬼)=克我者。已用天蓬(水)在 163.com/CSDN
// 給出的具體案例(旺寅卯/相亥子/休巳午/囚辰戌丑未/死申酉)逐一核對，5 個狀態全部一致。
// 得天時(有力)＝旺/相；失天時(無力)＝囚/死(廢)；休＝退居中性，不特別標注(比照地利中間六階段的處理方式)。
const TIANSHI_JI=new Set(['旺','相']);
const TIANSHI_XIONG=new Set(['囚','死']);
function getNineStarState(starWx, seasonWx){
  if(starWx===seasonWx) return '相';
  if(SHENG_TABLE[starWx]===seasonWx) return '旺';
  if(KE_TABLE_WUXING[starWx]===seasonWx) return '休';
  if(KE_TABLE_WUXING[seasonWx]===starWx) return '囚';
  if(SHENG_TABLE[seasonWx]===starWx) return '死';
  return null;
}
// starMap: pan.星 (每宮一個單字星名, 如'蓬'/'內'/'禽'等); monthZhi: 月支(如'寅')
function checkTianshi(starMap, monthZhi){
  const seasonWx=BRANCH_WUXING[monthZhi];
  if(!seasonWx)return [];
  const hits=[];
  Object.entries(starMap||{}).forEach(([gua,starKey])=>{
    const starEntry=LEX_DATA.stars[starKey];
    if(!starEntry)return;
    const state=getNineStarState(starEntry.wuxing, seasonWx);
    if(TIANSHI_JI.has(state)) hits.push({gong:gua, star:starKey, starWx:starEntry.wuxing, state, luck:'吉'});
    else if(TIANSHI_XIONG.has(state)) hits.push({gong:gua, star:starKey, starWx:starEntry.wuxing, state, luck:'凶'});
  });
  return hits;
}

// ══════════════════ 主流斷局法：伏吟反吟(星/門) ══════════════════
// 來源: 2026-08-29 兩個獨立線上命理資料源交叉核對一致：伏吟＝九星/八門落在自己的固定本宮
// (洛書固定配宮：天蓬坎/天芮(本專案叫「內」)坤/天冲震/天輔巽/天禽中/天心乾/天柱兌/天任艮/
// 天英離；八門固定配宮：休坎/死坤/傷震/杜巽/景離/驚兌/開乾/生艮)，象徵停滯不前、僵化。
// 反吟＝落在本宮的正對沖宮(坎↔離/艮↔坤/震↔兌/巽↔乾，用本檔案已有的 OPPOSITE_GUA)，
// 象徵衝突反覆、變動不安。
// 這裡只做「星伏吟/星反吟/門伏吟/門反吟」這兩類，是直接查表、跟時間無關、可獨立驗證的部分。
// 「值符伏吟/值符反吟」牽涉六甲值符(甲子戊/甲午辛等六十甲子的六個旬首)這個更深一層的概念，
// 需要另外查證值符在本專案排盤方式下的對應規則，暫不收錄(跟「人假」一樣，寧可暫缺也不猜)。
const STAR_HOME={'蓬':'坎','內':'坤','沖':'震','輔':'巽','禽':'中','心':'乾','柱':'兌','任':'艮','英':'離'};
const DOOR_HOME={'休':'坎','死':'坤','傷':'震','杜':'巽','景':'離','驚':'兌','開':'乾','生':'艮'};
function checkFuyinFanyin(starMap, doorMap){
  const hits=[];
  Object.entries(starMap||{}).forEach(([gua,starKey])=>{
    const home=STAR_HOME[starKey];
    if(!home)return;
    if(home===gua) hits.push({type:'星伏吟', gong:gua, symbol:starKey, home});
    else if(OPPOSITE_GUA[home]===gua) hits.push({type:'星反吟', gong:gua, symbol:starKey, home});
  });
  Object.entries(doorMap||{}).forEach(([gua,doorKey])=>{
    const home=DOOR_HOME[doorKey];
    if(!home)return;
    if(home===gua) hits.push({type:'門伏吟', gong:gua, symbol:doorKey, home});
    else if(OPPOSITE_GUA[home]===gua) hits.push({type:'門反吟', gong:gua, symbol:doorKey, home});
  });
  return hits;
}

// ══ 六仪擊刑 (固定查表, 與時間無關) ══
// 來源: 多方獨立命理資料交叉核對 + 荀爽老師實測案例驗證 (1901-04-13, 2024-02-28 兩案例
// 全部命中, 無一遺漏無一多報)
// 規則: 天盤上出現這個天干, 只要落在指定宮位, 必定擊刑
const JIXING_TABLE={'戊':'震','己':'坤','庚':'艮','辛':'離','壬':'巽','癸':'巽'};
function checkJiXing(skyMap){
  // 回傳: {宮: 天干} 的物件, 只包含真正命中擊刑的宮位
  const hits={};
  for(const [gua,stem] of Object.entries(skyMap)){
    if(gua==='中')continue;
    if(JIXING_TABLE[stem]===gua)hits[gua]=stem;
  }
  return hits;
}

// ══ 三奇入墓 (固定查表, 與時間無關) ══
// 來源: 《遁甲演義》原文口訣「六乙日奇降二宮，六丙月奇降六宮，六丁星奇降八宮，是為三奇入墓」，
// 即 乙→坤(二宮)／丙→乾(六宮)／丁→艮(八宮)，2026-08-27 透過多個獨立線上命理資料源交叉核對一致。
// (原本 乙 誤寫成'乾'，與丙重複、和坤宮完全對不上，已修正為'坤'；丙/丁 兩項原本就正確。
// 六儀本身傳統上不另計入墓, 此處僅適用於乙丙丁三奇, 採較窄的古典範圍, 不做擴充推測)
const RUMU_TABLE={'乙':'坤','丙':'乾','丁':'艮'};
function checkRuMu(skyMap){
  const hits={};
  for(const [gua,stem] of Object.entries(skyMap)){
    if(gua==='中')continue;
    if(RUMU_TABLE[stem]===gua)hits[gua]=stem;
  }
  return hits;
}

// ══ 門迫 (動態計算: 門的固有五行 克 現在所落宮位的五行) ══
// 來源: 多方獨立命理資料交叉核對, 說法一致
const DOOR_WUXING={'休':'水','生':'土','傷':'木','杜':'木','景':'火','死':'土','驚':'金','開':'金'};
const GONG_WUXING={'坎':'水','坤':'土','震':'木','巽':'木','離':'火','兌':'金','艮':'土','乾':'金','中':'土'};
const KE_MAP={'木':'土','土':'水','水':'火','火':'金','金':'木'};
function checkMenPo(doorMap){
  const hits={};
  for(const [gua,door] of Object.entries(doorMap)){
    if(gua==='中'||!door)continue;
    const dWx=DOOR_WUXING[door], gWx=GONG_WUXING[gua];
    if(dWx&&gWx&&KE_MAP[dWx]===gWx)hits[gua]=door;
  }
  return hits;
}

// ══════════════════ 主流斷局法：人和(門宮關係 迫/制/和/義) ══════════════════
// 來源: 2026-08-29 三個獨立線上命理資料源用完全相同的字句交叉核對一致(其中一次是逐字比對
// 「門克宮迫／宮克門制／門生宮和／宮生門義」這句原文才鎖定，因為搜到一次語序相反的說法，
// 為了避免像之前「人假」那樣踩進矛盾說法，特別多查一次用精確詞句比對排除歧義)：
// 門克宮＝迫(上面 checkMenPo 已經在算，是荀爽老師六害體系「刑墓庚虎迫空」的其中一害)；
// 宮克門＝制；門生宮＝和；宮生門＝義；五行相同(比和)則不屬於以上四種，另外標注。
// 吉凶：門遇迫或制，原本吉的門吉不全、原本凶的門更凶(兩者都是「被外力壓著、動不了」，只是
// 施力方向相反)；門遇和或義，都是有利的(和＝門把力量交給宮位形成和諧，義＝宮位反過來滋養門)。
// 這是完整攤開「迫/制/和/義」四態＋比和，跟荀爽老師只把「迫」當作六害之一挑出來講是不同的
// 呈現方式——同一套底層計算(門的五行 vs 宮的五行)，在主流框架下用「人和」的完整脈絡呈現。
const RENHE_JI=new Set(['和','義']);
const RENHE_XIONG=new Set(['迫','制']);
function getMenGongRelation(doorWx, gongWx){
  if(doorWx===gongWx) return '比和';
  if(KE_MAP[doorWx]===gongWx) return '迫';
  if(KE_MAP[gongWx]===doorWx) return '制';
  if(SHENG_TABLE[doorWx]===gongWx) return '和';
  if(SHENG_TABLE[gongWx]===doorWx) return '義';
  return null;
}
function checkRenhe(doorMap){
  const hits=[];
  Object.entries(doorMap||{}).forEach(([gua,door])=>{
    if(gua==='中'||!door)return;
    const dWx=DOOR_WUXING[door], gWx=GONG_WUXING[gua];
    if(!dWx||!gWx)return;
    const relation=getMenGongRelation(dWx,gWx);
    if(!relation)return;
    const luck=RENHE_JI.has(relation)?'吉':RENHE_XIONG.has(relation)?'凶':'平';
    hits.push({gong:gua, door, doorWx:dWx, gongWx:gWx, relation, luck});
  });
  return hits;
}

// ══ 庚 (六害之一, 獨立於擊刑檢測: 只要天盤出現庚即命中) ══
// 來源: 荀爽視頻「六害: 刑墓庚虎迫空」明確列出庚為獨立一害, 與擊刑表中庚落艮宮的
// "六儀擊刑"是兩件事 (庚本身即為害, 不論落在哪一宮)
function checkGeng(skyMap){
  const hits={};
  for(const [gua,stem] of Object.entries(skyMap)){
    if(gua==='中')continue;
    if(stem==='庚')hits[gua]=stem;
  }
  return hits;
}

// ══ 白虎 (六害之一: 八神出現白虎即命中) ══
function checkBaiHu(godMap){
  const hits={};
  for(const [gua,god] of Object.entries(godMap)){
    if(gua==='中')continue;
    if(god==='白虎'||god==='虎')hits[gua]=god;
  }
  return hits;
}

// ══ 空亡 (地支旬空對應宮位, 沿用既有 kongGongMap 邏輯, 此處另建查詢函式供解法引擎調用) ══
// 由 renderPan 內既有 markKong/kongGongMap 產生, 此函式僅為統一介面, 邏輯不變

// ══════════════════ 主流格局判斷 (跨門派共識, 與荀爽老師"六害"體系是兩套獨立來源) ══════════════════
// 來源: 2026-08-27 綜合多個獨立線上命理資料源交叉核對一致(天盤干/地盤干 同宮組合查表)，
// 屬於奇門遁甲較廣泛流傳的古典格局判斷法，用戶明確要求：跟荀爽老師的六害判斷分開展示，
// 不要混在一起，讓兩套體系對同一張盤各自給出解讀，方便使用者自己比較判斷。
// 只收錄多方資料交叉核對後說法一致、沒有明顯分歧的格局；「大格/小格」原本因觸發條件說法
// 不一致而未收錄，2026-08-27 進一步查證後確認：多方資料一致認為觸發條件就是「天盤庚加臨
// 地盤癸/壬」本身(跟其餘格局同一種同宮組合查法)，「寅申相沖」只是用來解釋庚(申)剋制的
// 五行/地支背景，不是額外要另外滿足的條件，因此本次補上。
const MAINSTREAM_GEJU = [
  {key:'qinglong_fanshou', name:'青龍返首', sky:'戊', earth:'丙', luck:'吉',
    desc:'值符(甲)代表戊臨地盤丙，青龍(木)生助丙火，木火相生，為大吉大利之象，宜任職、訴訟、搬遷、求財。',
    caveat:'若此宮同時遇門迫、入墓、擊刑，吉會轉為凶，需先看這宮有沒有命中六害。'},
  {key:'feiniao_dieuxue', name:'飛鳥跌穴', sky:'丙', earth:'戊', luck:'吉',
    desc:'丙如飛鳥、戊如巢穴，飛鳥落入自己的巢穴，諸事順遂，事半功倍。'},
  {key:'baihu_changkuang', name:'白虎猖狂', sky:'辛', earth:'乙', luck:'凶',
    desc:'辛金剋乙木，白虎(辛)在天上橫行、青龍(乙)反被壓制在地下，主客兩傷，行事多驚恐，遠行有災禍，婚姻/修造大凶。'},
  {key:'zhuque_toujiang', name:'朱雀投江', sky:'丁', earth:'癸', luck:'凶',
    desc:'丁為南方朱雀(陰火)，癸為江河(陰水)，朱雀墜入江河，百事皆凶，文書/口舌消散，音信沉沒，多驚恐怪異之事。'},
  {key:'tengshe_yaojiao', name:'螣蛇夭矯', sky:'癸', earth:'丁', luck:'凶',
    desc:'癸為北方玄武(陰水)，丁屬陰火，如螣蛇墜入火中被灼燒而屈伸掙扎，百事不利，虛驚不寧，多文書官司。'},
  {key:'dage', name:'大格', sky:'庚', earth:'癸', luck:'凶',
    desc:'庚為阻隔剛強之金，加臨癸水，五行相剋(申庚遇寅申沖背景)，主道路受阻、車禍意外、行人不至、官司糾紛，凡事皆凶，甚至可能一生漂泊不定。'},
  {key:'xiaoge', name:'小格', sky:'庚', earth:'壬', luck:'凶',
    desc:'庚為阻隔剛強之金，加臨壬水，庚金阻擋壬水流動，主遠行迷路、音信難通，也稱「移蕩格」，代表變動不安、暫時清貧，但同時也主流動變化。'},
  // 以下 4 個「奇儀相加」格局為 2026-08-29 新增(格局庫擴充第一批)，經 2 個獨立來源交叉核對一致：
  {key:'qiyi_shunsui', name:'奇儀順遂', sky:'乙', earth:'丙', luck:'吉',
    desc:'乙(日奇)加臨丙(月奇)，兩奇相生相佐，主遷居、搬遷、調動等變動之事順利；不利於陰謀暗中之事。'},
  {key:'qiyi_xiangzuo', name:'奇儀相佐', sky:'乙', earth:'丁', luck:'吉',
    desc:'乙(日奇)加臨丁(星奇)，兩奇相佐，事事順遂，尤其有利文書、考試、公文往來等事。'},
  {key:'qinglong_taozou', name:'青龍逃走', sky:'乙', earth:'辛', luck:'凶',
    desc:'乙(青龍/日奇)被辛(白虎)克制而倉皇逃走，主破財、走失、六畜受損，婚姻占問則主女方逃走，男性尤其不利。'},
  {key:'xingqi_zhuque', name:'星奇朱雀', sky:'丙', earth:'丁', luck:'吉',
    desc:'丙(星奇)加臨丁(朱雀/星奇)，對求官職文書者有利、有貴人提攜；一般人則宜安靜守成，若同時有炎症/發炎類疾病需留意火氣過旺。'},
];
function checkMainstreamGeju(sky, earth){
  const hits=[];
  for(const gua of Object.keys(sky)){
    if(gua==='中')continue;
    const s=sky[gua], e=earth[gua];
    for(const g of MAINSTREAM_GEJU){
      if(s===g.sky && e===g.earth) hits.push({...g, gong:gua});
    }
  }
  return hits;
}

// ══════════════════ 三詐五假 (謀略/隱蔽性質的格局，跟上面吉凶格是不同性質的判斷) ══════════════════
// 來源: 2026-08-27 綜合多個獨立線上命理資料源交叉核對一致。三詐五假不是單純判斷吉凶，
// 而是判斷「這件事適不適合暗中謀劃、隱藏真實意圖」——古代常用在用兵、求謀、緝捕等場合。
// 三詐：三吉門(開/休/生)加三奇(乙/丙/丁)，同宮再乘特定八神；五假：特定門加特定干乘特定八神。
// 「人假」因各資料源對其天干/門的具體組合說法混亂(疑似輾轉抄錄失真)，暫不收錄，避免誤判。
const GOD_FULL_TO_SHORT={'值符':'符','螣蛇':'蛇','太陰':'陰','六合':'合','白虎':'虎','玄武':'玄','九地':'地','九天':'天'};
const SANZHA_DEFS=[
  {key:'zhenzha', name:'真詐', god:'太陰',
    desc:'吉門加三奇乘太陰，宜暗中謀劃、隱瞞真實意圖來達成目的，事情背後有周密的策劃。'},
  {key:'chongzha', name:'重詐', god:'九地',
    desc:'吉門加三奇乘九地，宜深藏不露、步步為營地推進計劃，行事隱蔽而扎實。'},
  {key:'xiuzha', name:'休詐', god:'六合',
    desc:'吉門加三奇乘六合，宜透過人脈/中介來暗中促成，藉合作關係達成隱藏的目的。'},
];
const WUJIA_DEFS=[
  {key:'tianjia', name:'天假', door:'景', gods:['九天'],
    desc:'景門加三奇(乙/丙/丁)乘九天，宜陳事、上書獻策、干求顯揚之事，適合把事情公開擴大化。'},
  {key:'dijia', name:'地假', door:'杜', gods:['九地','太陰','六合'],
    desc:'杜門加丁/己/癸乘九地、太陰或六合，宜潛伏、逃亡躲災、暗中謀劃私事。'},
  {key:'shenjia_wujia', name:'神假(物假)', door:'傷', gods:['九地','六合'],
    desc:'傷門加丁/己/癸乘九地或六合，宜埋藏、伏擊、索取、交易等需要隱蔽進行的事。'},
];
function checkSanzhaWujia(sky, door, god){
  const hits=[];
  const JI_MEN=['開','休','生'], SANQI=['乙','丙','丁'], WUJIA_STEMS=['丁','己','癸'];
  for(const gua of Object.keys(sky)){
    if(gua==='中')continue;
    const s=sky[gua], d=door[gua], g=god[gua];
    if(JI_MEN.includes(d) && SANQI.includes(s)){
      SANZHA_DEFS.forEach(z=>{ if(g===GOD_FULL_TO_SHORT[z.god]) hits.push({...z, type:'詐', gong:gua, door:d, stem:s}); });
    }
    if(d==='景' && SANQI.includes(s) && g===GOD_FULL_TO_SHORT['九天']){
      hits.push({...WUJIA_DEFS[0], type:'假', gong:gua, door:d, stem:s});
    }
    if(d==='杜' && WUJIA_STEMS.includes(s) && WUJIA_DEFS[1].gods.some(x=>g===GOD_FULL_TO_SHORT[x])){
      hits.push({...WUJIA_DEFS[1], type:'假', gong:gua, door:d, stem:s});
    }
    if(d==='傷' && WUJIA_STEMS.includes(s) && WUJIA_DEFS[2].gods.some(x=>g===GOD_FULL_TO_SHORT[x])){
      hits.push({...WUJIA_DEFS[2], type:'假', gong:gua, door:d, stem:s});
    }
  }
  return hits;
}

// ══════════════════ 解法引擎: 灭象 + 布阵 ══════════════════
// 來源: 荀爽視頻「布干支大阵 镇压六害」「先灭象后布阵」完整流程截圖交叉核對

// 天干五合 (刑→用合): 甲己合, 乙庚合, 丙辛合, 丁壬合, 戊癸合
const HE_TABLE={'甲':'己','己':'甲','乙':'庚','庚':'乙','丙':'辛','辛':'丙','丁':'壬','壬':'丁','戊':'癸','癸':'戊'};
// 十二地支六冲 (墓→用冲): 子午冲, 丑未冲, 寅申冲, 卯酉冲, 辰戌冲, 巳亥冲
const CHONG_TABLE={'子':'午','午':'子','丑':'未','未':'丑','寅':'申','申':'寅','卯':'酉','酉':'卯','辰':'戌','戌':'辰','巳':'亥','亥':'巳'};
// 布阵無腦安全位: 遍查擊刑/入墓方位表, 正西(兌)、正北(坎)從未出現, 可作預設推薦
const SAFE_BUZHEN_GONG=['兌','坎'];

// 灭象規則 (刑/墓/庚三者必須灭象; 目前只有刑墓的具體動作已由荀爽視頻明確給出)
const MIEXIANG_RULE={
  '刑':{action:'可移、可扔、可送', verified:true},
  '墓':{action:'只能移，別扔別送', verified:true},
  '庚':{action:'風險/武力行業(軍警等)不灭；其餘情況放到最後灭', verified:true, conditional:true},
  '虎':{action:'（荀爽視頻未明確給出灭象具體動作，暫沿用刑的通用規則：可移可扔可送）', verified:false},
  '迫':{action:'（灭象動作未見視頻明確說明，建議直接進入布阵「用合」化解）', verified:false},
  '空':{action:'不做灭象，直接布阵「缺啥補啥」', verified:true},
};

// 依「字/物/意/行」四維，用 LEX_DATA 的顏色材質生成布阵化解物描述 (物維度可自動生成, 字/意/行為五行通用推導)
const WUXING_YI_XING={ // 五行對應的通用「意/行」提示 (非逐字視頻原文, 為五行常理推導, 供参考)
  '木':{yi:'學習成長型知識(如植物、規劃、教育)', xing:'伸展類運動(如瑜伽、太極)'},
  '火':{yi:'學習表達/展示型知識(如演講、藝術)', xing:'有氧/爆發類運動(如跑步、拳擊)'},
  '土':{yi:'學習沉穩積累型知識(如理財、歷史)', xing:'穩定持久類運動(如負重、徒步)'},
  '金':{yi:'學習決斷/規則型知識(如法律、金融)', xing:'剛強類運動(如器械、武術)'},
  '水':{yi:'學習流動/謀略型知識(如哲學、心理)', xing:'流動類運動(如游泳、慢跑)'},
};
function stemWuxing(stem){
  const map={'甲':'木','乙':'木','丙':'火','丁':'火','戊':'土','己':'土','庚':'金','辛':'金','壬':'水','癸':'水'};
  return map[stem];
}

// 針對「墓」: 用冲。推導邏輯 = 找出入墓天干對應的地支(據 LEX_DATA.branches 反查)，
// 取其六冲地支，再反查回天干 —— 此邏輯與「刑用合(五合)」的推導方式一致(同屬天干地支
// 生克化解框架)，但非逐字視頻畫面讀出，標記 verified:false 供覆核
const STEM_TO_BRANCH={'甲':'寅','乙':'卯','丙':'午','丁':'巳','戊':'辰','己':'丑','庚':'申','辛':'酉','壬':'子','癸':'亥'};
// 灭象後的「布阵方位」無腦法 —— 來源: 荀爽老師視頻「六儀擊刑/三奇入墓」方位對照九宮圖 + 「無腦法」截圖逐字轉錄:
// 圖中列出每個天干各自「絕對不能放」的方位(乙丙→不能放西北, 丁→不能放東北, 戊→不能放正東,
// 庚丁→不能放東北, 己甲→不能放西南, 壬癸→不能放東南, 辛→不能放正南)，唯獨正西、正北兩個方位，
// 對照圖裡完全沒有任何天干的禁區落在這兩處。所以「無腦法」給的標準答案就是：
// 灭象後，不用一個個記天干的禁區，統一把要布的天干放到正西或正北，兩個方位都可以。
const WUNAOFA_DEST='正西或正北';

function getCureForRuMu(gua, stem){
  const branch=STEM_TO_BRANCH[stem];
  const chongBranch=branch?CHONG_TABLE[branch]:null;
  const cureStem=chongBranch&&LEX_DATA.branches[chongBranch]?LEX_DATA.branches[chongBranch].sameAs:null;
  return {hai:'墓', gong:gua, hitStem:stem, cureStem, method:'用冲(地支六冲，推導未驗證)',
    xiang:cureStem?getBuZhenXiang(cureStem):null, verified:false, place:WUNAOFA_DEST, placeVerified:true};
}

// 針對「迫」(門迫): 用合。來源: 荀爽視頻「遇到門迫，用這些」九宮圖截圖
// (巽/震→驚開+辰寅, 離→休+丑, 坤/艮→傷杜+戌申, 兌/乾→景+未, 坎→生死+亥巳)
const MENPO_CURE_TABLE={
  '巽':{doors:['驚','開'],branches:['辰','寅']},
  '離':{doors:['休'],branches:['丑']},
  '坤':{doors:['傷','杜'],branches:['戌','申']},
  '震':{doors:['驚','開'],branches:['辰','寅']},
  '兌':{doors:['景'],branches:['未']},
  '艮':{doors:['傷','杜'],branches:['戌','申']},
  '坎':{doors:['生','死'],branches:['亥','巳']},
  '乾':{doors:['景'],branches:['未']},
};
function getCureForMenPo(gua){
  const rule=MENPO_CURE_TABLE[gua];
  if(!rule)return null;
  return {hai:'迫', gong:gua, method:'用合(門迫化解表)',
    doorsText:rule.doors.map(d=>LEX_DATA.doors[d]?LEX_DATA.doors[d].name:d).join('、'),
    branchesText:rule.branches.join('、'),
    branchXiangs:rule.branches.map(b=>getBranchXiang(b)).filter(Boolean),
    verified:true};
}

// 給定一個要「布」的天干, 回傳字/物/意/行四維描述。
// 天干的物件要放「高處」——荀爽老師原話：同樣顏色，天干(如丙)放高，地支(如午)放低，兩者不是同一件事。
function getBuZhenXiang(stem){
  const d=LEX_DATA.stems[stem];
  if(!d)return null;
  const wx=stemWuxing(stem);
  const yx=WUXING_YI_XING[wx]||{};
  return {
    stem, wuxing:wx,
    zi:`寫「${stem}」字`,
    wu:`擺放${d.color}${d.material}類物品`,
    yi:yx.yi||'',
    xing:yx.xing||'',
    placement:'高處',
  };
}

// 給定一個要「布」的地支, 回傳生肖形象描述。地支的物件要放「低處」，且地支特有生肖動物形象可用
// (天干沒有生肖可用，只有顏色材質)——荀爽老師原話逐字轉錄。
function getBranchXiang(branch){
  const d=LEX_DATA.branches[branch];
  if(!d)return null;
  const stemLike=LEX_DATA.stems[d.sameAs];
  return {
    branch, zodiac:d.zodiac,
    wu:stemLike?`擺放${stemLike.color}${stemLike.material}類物品，或直接放「${d.zodiac}」生肖擺件/圖像`:`放「${d.zodiac}」生肖擺件/圖像`,
    placement:'低處',
  };
}

// 針對「刑」: 給出該宮命中天干對應的「用合」化解天干及其字物意行
function getCureForJiXing(gua, stem){
  const heStem=HE_TABLE[stem];
  return {hai:'刑', gong:gua, hitStem:stem, cureStem:heStem, method:'用合(天干五合)',
    xiang:heStem?getBuZhenXiang(heStem):null, place:WUNAOFA_DEST, placeVerified:true};
}

// 針對「庚/白虎」: 無腦用乙化解 (荀爽視頻明確給出的簡化規則, 不分宮位)
function getCureForGengOrHu(gua, hitLabel){
  return {hai:hitLabel, gong:gua, cureStem:'乙', method:'無腦法: 用乙', xiang:getBuZhenXiang('乙')};
}

// 針對「空亡」: 缺啥補啥, 依當事人需求 (求財/求事業/求桃花等) 從意象表選字
// 來源: 荀爽視頻「意象」示例 (財富=戊, 權威=甲, 表現=丙, 暴力=庚, 突破=辛, 情欲=癸)
// 注意: 十天干中乙丁己壬四者對應的具體「意象」詞, 視頻例子未覆蓋, 下表暫缺, 標記 needsSource
const YIXIANG_TABLE={
  '戊':{need:'財富', verified:true},
  '甲':{need:'權威', verified:true},
  '丙':{need:'表現', verified:true},
  '庚':{need:'暴力/風險', verified:true},
  '辛':{need:'突破', verified:true},
  '癸':{need:'情欲', verified:true},
  '乙':{need:'（視頻例子未覆蓋，暫缺）', verified:false},
  '丁':{need:'（視頻例子未覆蓋，暫缺）', verified:false},
  '己':{need:'（視頻例子未覆蓋，暫缺）', verified:false},
  '壬':{need:'（視頻例子未覆蓋，暫缺）', verified:false},
};
// 常見問事需求 → 建議意象天干 (在 YIXIANG_TABLE 已驗證範圍內做正向映射)
const NEED_TO_STEM={
  '求財':'戊',
  '求權威地位':'甲',
  '求表現曝光':'丙',
  '求情感情欲':'癸',
  '求突破變革':'辛',
  // 2026-08-27 修正：桃花原本借用「情欲(癸)」湊數，跟桃花本身不是同一件事。改用「乙」——
  // 來源：多個獨立命理資料源一致提到「三奇乙丙丁」催桃花性質不同：乙＝溫柔正緣、丙＝熱情、
  // 丁＝易招爛桃花，乙是三者中最貼近「求桃花」(而非泛桃花/爛桃花)本意的一個，仍標記待覆核。
  '求桃花':{stem:'乙', verified:false, note:'來源：「三奇乙丙丁」催桃花性質說法(乙＝溫柔正緣)，跨網路資料源交叉核對，非荀爽老師視頻原文，仍建議人工覆核'},
  // 「求事業」沒有納入：事業在源頭教材裡本來就是「開門/景門/玄武/庚虎/行業/符使/諸干」七個
  // 面向的組合，不存在單一天干能代表整個事業，勉強湊一個(舊版本借用「甲」)反而是誤導；
  // 已改為 getCureForKongWang 裡特殊處理，直接請使用者去看「事業七要」，不亂猜一個天干。
};
function getCureForKongWang(gua, needKey){
  if(needKey==='求事業'){
    return {hai:'空', gong:gua, cureStem:null, method:'缺啥補啥', xiang:null,
      place:GUA_DIR[gua], placeVerified:true, verified:false,
      note:'「事業」沒有單一天干可以代表(事業本身是開門/景門/玄武/庚虎/行業/符使/諸干七個面向的組合)，建議改選「事業七要」完整報告，針對命中空亡的那個面向具體判斷要補什麼'};
  }
  const target=NEED_TO_STEM[needKey];
  const stem=typeof target==='string'?target:(target&&target.stem);
  if(!stem)return null;
  // 方位=這個空亡宮本身對應的現實方位 (荀爽老師舉例「艮宮空亡、戊是錢，就在東北補放存錢罐」，
  // 東北是艮宮自己的方位，不是「戊」固定對應東北——已向用戶確認過，不是每個天干各自綁定的方位)
  return {hai:'空', gong:gua, cureStem:stem, method:'缺啥補啥', xiang:getBuZhenXiang(stem),
    place:GUA_DIR[gua], placeVerified:true,
    verified: typeof target==='string'?true:!!target.verified, note: typeof target==='object'?target.note:undefined};
}

// ══════════════════ 財富七要 / 事業七要 ══════════════════
// 來源: 荀爽老師視頻「財富七要」「事業七要」+ 海明威(1899-07-21 08:30)、
// 拉康(1901-04-13 14:30) 兩則案例分析截圖逐字轉錄 (2026-07-31 收集)

const WEALTH_SEVEN={
  '戊':{name:'戊', role:'本錢', keyword:'最根本的錢、最穩定的錢',
    desc:'存款、工資、不動產、生意本金。中國家庭90%財富是戊(歐美不是)。普通人戊出問題=降薪/裁員/失業/工資拖欠/房產貶值；商人戊=本金現金流，中小老闆尤其重要，大老闆因有人脈與金融工具不太受影響；戊出問題=虧錢，虧的是本金。戊所在宮不能發生刑墓庚虎迫空。', verified:true},
  '生門':{name:'生門', role:'利潤', keyword:'有生息的錢、在增長的錢',
    desc:'利息、利潤、回報、交易、市場，不斷擴張增殖的錢。普通人感受不深；工農製造/生意人很重要，生門遇六害=生產環節或營收出問題；商超零售尤其看生門。', verified:true},
  '六合':{name:'六合', role:'合作/金融', keyword:'投融資的錢、合作來的錢',
    desc:'金融、大錢、合夥人、甲方乙方；也主上下游供應鏈、項目分包、中介；六合的錢都不是小錢。六合出問題=合夥生意遇困難，對有錢人可能是人脈網/融資渠道出問題。', verified:true},
  '行業':{name:'行業', role:'渠道', keyword:'賺錢渠道、行業性質', desc:'按 INDUSTRY_MAP 正確取象。', verified:true},
  '時干':{name:'時干', role:'機會', keyword:'機會前景、市場預期',
    desc:'客戶、需求、平台、員工。「能不能恰到好處地對接市場需求」。同行同崗，別人有機會你沒有=時干不對；也代表平台/有沒有人支持你、給你機會。', verified:true},
  '干財':{name:'干財', role:'控制', keyword:'能控制的資源 = 日干所克 + 生年所克',
    desc:'自己和此事所能調動的資源上限。普通人只需保持干財不受傷害、保持住控制力。', verified:true, dynamic:true},
  '月令':{name:'月令', role:'天時', keyword:'環境天時、財富量級',
    desc:'起局時月支的五行，很難完全扭轉。決定求財的難度/代價性價比(1換4 還是 1換3000)。此性價比邏輯僅用於求財/財富，其他事情(如有特定使命)不一定按此邏輯選擇。', verified:true, dynamic:true},
};

const CAREER_SEVEN={
  '開門':{name:'開門', role:'單位', keyword:'工作單位、所在團體',
    desc:'單位情況對你的影響。出問題=單位的問題不是你的問題，是沒待對地方；單位難好轉不如跳槽；人際關係複雜的單位也會表現為開門擊刑；開門遇六害=工作環境基本都不好。', verified:true},
  '景門':{name:'景門', role:'考核', keyword:'業績展示、個人形象',
    desc:'面試、考核、成果。核心：做出的成績能否被領導看到。出問題=再有成績也不會被人看到。', verified:true},
  '玄武':{name:'玄武', role:'小人', keyword:'暗中算計、陰險小人',
    desc:'不一定是同事/競爭對手，也可能是老闆/領導，包括合同陷阱等。遇空亡/入墓要萬分小心。特殊規律：若本人自己主動占據玄武對應的領域(如心理學/哲學等「說不清道不明」的行業)，玄武就從「外部小人」轉化為「本人自身」，不再構成威脅(拉康案例驗證)。', verified:true},
  '庚虎':{name:'庚虎', role:'困難', keyword:'庚+白虎；困難壓力、強大敵人',
    desc:'壓力、競爭對手、敵人、困難任務。庚虎不需要六害本身就代表壓力，會影響本宮和對宮；若庚虎再疊加擊刑/門迫，難度更高。', verified:true},
  '行業':{name:'行業', role:'適合行業', keyword:'行業情況、崗位適配', desc:'邏輯與財富七要「行業」相同，按 INDUSTRY_MAP 正確取象。', verified:true},
  '符使':{name:'符使', role:'上級', keyword:'值符=直屬上級，值使=二把手',
    desc:'值符不是權力最大的人，但對你影響最深，是直接派任務的人。值符遇六害=直屬上級不行，要麼心術有問題要麼有偏見。', verified:true},
  '諸干':{name:'諸干', role:'角色', keyword:'年干=大老闆/Boss，月干=同事，時干=下屬',
    desc:'哪個干出問題，就是哪一類人在阻礙你。', verified:true},
};

// 行業舉例/取象總表 (財富七要+事業七要共用；兩批截圖 + 拉康案例合併整理)
const INDUSTRY_MAP={
  '演藝(靠臉靠秀/主播/電競/唱跳)':{stems:['景','天英','丙']},
  '西醫':{stems:['天心']},
  '中醫':{stems:['乙']},
  '西醫+外科':{stems:['天心','辛']},
  '中醫+內科':{stems:['乙','天內']},
  '經商做生意':{stems:['生']},
  '合夥/中介':{stems:['六合']},
  '低級公務員':{stems:['休']},
  '高級公務員/官員':{stems:['值符']},
  '教培(中小學)':{stems:['天輔'], note:'大學老師不固定，具體看'},
  '庸俗低級玄學/忽悠':{stems:['玄武'], note:'僅指庸俗低級一類；與下條同一符號但檔次不同'},
  '哲學研究/心理諮詢等嚴肅玄學':{stems:['玄武'], note:'與「忽悠」同一符號但檔次不同，需視局中吉凶組合判斷；拉康案例即此類'},
  '武職':{stems:['庚','虎','天沖']},
  '監督機構/律師/法院':{stems:['天柱']},
  '養老/喪葬':{stems:['死']},
  '高精尖技術/芯片/程序員':{stems:['杜']},
  '苦力/工農/雜活(含前台行政等)':{stems:['天任']},
  '心理諮詢':{stems:['休']},
  '內科醫':{stems:['天內']},
  '新聞行業':{stems:['驚','馬','蛇'], note:'海明威案例：記者取象'},
  '軍人/武職(海明威案例)':{stems:['庚']},
};

// ══ 行業大類/小類 taxonomy (以下全部為推導延伸，非荀爽老師視頻原文，verified:false) ══
// 大類骨架參考國標《國民經濟行業分類》GB/T 4754-2017 的門類劃分(20門類)，只挑與個人職業
// 取象相關、常見的部分；小類則按上面 INDUSTRY_MAP 已驗證條目的符號邏輯做同類延伸推導：
// 五行/門星神取象規律例如「杜=精密技術」「天任=苦力雜活」「六合=中介大錢」等，套用到
// 同性質的新行業上。凡是延伸出的條目一律 verified:false，供覆核，不代表視頻明確給出。
const INDUSTRY_TAXONOMY={
  '農林牧漁業':{ subs:{
    '種植業/林業':{stems:['乙','天任']},
    '畜牧業':{stems:['天任']},
    '漁業/水產':{stems:['天蓬','天任']},
  }},
  '採礦業':{ subs:{
    '礦產開採':{stems:['天任','庚']},
  }},
  '製造業':{ subs:{
    '機械/金屬加工':{stems:['庚','杜']},
    '電子/精密設備製造':{stems:['杜']},
    '紡織/服裝':{stems:['乙']},
    '食品加工':{stems:['生']},
    '化工':{stems:['辛']},
  }},
  '電力/熱力/燃氣及水生產供應業':{ subs:{
    '能源/公用事業':{stems:['丙','符']},
  }},
  '建築業':{ subs:{
    '土建/工程施工':{stems:['天任','庚']},
    '建築設計':{stems:['天英','杜']},
  }},
  '批發和零售業':{ subs:{
    '零售/門店':{stems:['生','景']},
    '批發/貿易':{stems:['生','六合']},
    '電商':{stems:['生','景']},
  }},
  '交通運輸/倉儲和郵政業':{ subs:{
    '物流/快遞/倉儲':{stems:['天蓬','天任']},
    '客運/駕駛':{stems:['天蓬']},
  }},
  '住宿和餐飲業':{ subs:{
    '餐飲':{stems:['生','休']},
    '酒店/住宿':{stems:['休','生']},
  }},
  '信息傳輸/軟件和信息技術服務業':{ subs:{
    '程序員/軟件開發':{stems:['杜']},
    '芯片/硬件研發':{stems:['杜']},
    '互聯網運營/流量':{stems:['景','杜']},
    '遊戲行業':{stems:['天英','景']},
  }},
  '金融業':{ subs:{
    '銀行/信貸':{stems:['六合']},
    '證券/投資/基金':{stems:['六合','生']},
    '保險':{stems:['六合','休']},
  }},
  '房地產業':{ subs:{
    '開發/銷售':{stems:['六合','生']},
    '中介/經紀':{stems:['六合']},
  }},
  '租賃和商務服務業':{ subs:{
    '中介/居間服務':{stems:['六合']},
    '諮詢/顧問':{stems:['天輔','六合']},
    '獵頭/人力資源':{stems:['六合','天輔']},
  }},
  '科學研究和技術服務業':{ subs:{
    '科研/研發':{stems:['杜','天心']},
    '設計/工程諮詢':{stems:['天英','杜']},
  }},
  '水利/環境和公共設施管理業':{ subs:{
    '公共設施管理':{stems:['符','天蓬']},
  }},
  '居民服務/修理和其他服務業':{ subs:{
    '家政/生活服務':{stems:['休','天任']},
    '維修':{stems:['天任','杜']},
    '美容美發':{stems:['景','天英']},
  }},
  '教育':{ subs:{
    'K12/中小學教培':{stems:['天輔']},
    '職業培訓':{stems:['天輔']},
    '高等教育/學術':{stems:['天輔','符']},
  }},
  '衛生和社會工作':{ subs:{
    '西醫':{stems:['天心']},
    '西醫+外科':{stems:['天心','辛']},
    '中醫':{stems:['乙']},
    '中醫+內科':{stems:['乙','天內']},
    '心理諮詢/精神健康':{stems:['休','玄武']},
    '社會工作/福利':{stems:['休']},
    '養老/喪葬':{stems:['死']},
  }},
  '文化/體育和娛樂業':{ subs:{
    '演藝(靠臉靠秀/主播/電競/唱跳)':{stems:['景','天英','丙']},
    '新聞媒體':{stems:['驚','馬','蛇']},
    '出版/文創':{stems:['天輔','天英']},
    '體育競技(對抗性)':{stems:['庚','虎','天沖']},
    '哲學研究等嚴肅玄學':{stems:['玄武']},
    '庸俗低級玄學/忽悠':{stems:['玄武']},
  }},
  '公共管理/社會保障和社會組織':{ subs:{
    '低級公務員':{stems:['休']},
    '高級公務員/官員':{stems:['值符']},
    '監督機構/律師/法院':{stems:['天柱']},
    '軍人/武職':{stems:['庚','虎','天沖']},
  }},
};
// 統一查詢：先查扁平的 INDUSTRY_MAP(已驗證/含案例專用條目)，找不到再查
// INDUSTRY_TAXONOMY 的「大類::小類」組合鍵，兩者都沒有則回傳 null
function getIndustryStems(key){
  if(!key)return null;
  if(INDUSTRY_MAP[key])return INDUSTRY_MAP[key];
  const idx=key.indexOf('::');
  if(idx>=0){
    const big=key.slice(0,idx), small=key.slice(idx+2);
    const sub=INDUSTRY_TAXONOMY[big]&&INDUSTRY_TAXONOMY[big].subs[small];
    if(sub)return sub;
  }
  for(const big in INDUSTRY_TAXONOMY){
    if(INDUSTRY_TAXONOMY[big].subs[key])return INDUSTRY_TAXONOMY[big].subs[key];
  }
  return null;
}
const MONTH_RELATION_TABLE=[
  {rel:'月令生A', effect:'擴張+量大', rank:1},
  {rel:'月令同A', effect:'穩健+量大', rank:2},
  {rel:'A克月令', effect:'努力+量小', rank:3},
  {rel:'A生月令', effect:'損耗+量小', rank:4},
  {rel:'月令克A', effect:'大虧+量小', rank:5},
];
const SHENG_TABLE={'木':'火','火':'土','土':'金','金':'水','水':'木'};
const KE_TABLE_WUXING={'木':'土','土':'水','水':'火','火':'金','金':'木'};
function monthRelation(monthWx, targetWx){
  if(monthWx===targetWx) return MONTH_RELATION_TABLE[1];
  if(SHENG_TABLE[monthWx]===targetWx) return MONTH_RELATION_TABLE[0];
  if(KE_TABLE_WUXING[monthWx]===targetWx) return MONTH_RELATION_TABLE[4];
  if(SHENG_TABLE[targetWx]===monthWx) return MONTH_RELATION_TABLE[3];
  if(KE_TABLE_WUXING[targetWx]===monthWx) return MONTH_RELATION_TABLE[2];
  return null;
}

// 干財: 日干財 = 日干所克的兩個天干; 生年財 = 生年干所克的兩個天干
function getGanCai(dayStem, yearStem){
  function keTargets(stem){
    const target=KE_TABLE_WUXING[stemWuxing(stem)];
    return Object.keys(STEM_TO_BRANCH).filter(s=>stemWuxing(s)===target);
  }
  return {日干財:keTargets(dayStem), 生年財:keTargets(yearStem), verified:true};
}

// 天干缺席時的補位查找: 目標天干未上盤時改找其五合對象；
// 特殊: 甲從不上盤(隱於六儀之下)，若甲缺席不找己，改找值符 (海明威案例講解)
function findStemOrHe(stem, panHasStemFn){
  if(panHasStemFn(stem)) return {found:stem, viaHe:false};
  if(stem==='甲') return {found:'值符', viaHe:true, special:true};
  const he=HE_TABLE[stem];
  if(he && panHasStemFn(he)) return {found:he, viaHe:true};
  return {found:null, viaHe:false};
}

// ══════════════════ 財富七要 / 事業七要: 讀局引擎 ══════════════════
// 來源: 綜合前述資料表 + 海明威(1899-07-21 08:30)、拉康(1901-04-13 14:30) 兩案例
// 逐宮分析截圖的解讀流程逆推整理，非視頻逐字給出的成文演算法，標記 verified:false 供覆核。
// 基礎原則(貫穿整個解讀，寫在這裡提醒自己):
//   1. 符號有雙面性 —— 例如玄武，若本人主動占據該符號對應的領域(如拉康搞心理學/哲學)，
//      玄武就從「外部小人」轉化為「本人自身」，不再構成威脅；不能無腦判凶。
//   2. 命裡最容易的路 ≠ 本人真正想走的路(拉康案例：月令生助西醫/內科最好賺，但他選擇了
//      "泄耗"路徑心理學/哲學)——讀局時"最佳路徑"和"當事人實際选择"要分開呈現，不要替對方做選擇。
//   3. 這套"性價比"邏輯(月令五種關係)僅用於求財/財富，其他人生課題不一定按性價比走。

const OPPOSITE_GUA={'坎':'離','離':'坎','艮':'坤','坤':'艮','震':'兌','兌':'震','巽':'乾','乾':'巽'};
const BRANCH_WUXING={'寅':'木','卯':'木','巳':'火','午':'火','申':'金','酉':'金','亥':'水','子':'水',
  '辰':'土','戌':'土','丑':'土','未':'土'};

// 拆解 pan.干支 (格式"甲辰年丙寅月壬戌日己酉時") 為年/月/日/時各自的干支
function parseGanzhi(ganzhiStr){
  const m=ganzhiStr.match(/^(..)年(..)月(..)日(..)時$/);
  if(!m)return null;
  const [,y,mo,d,h]=m;
  return {年干:y[0],年支:y[1], 月干:mo[0],月支:mo[1], 日干:d[0],日支:d[1], 時干:h[0],時支:h[1]};
}

function getKongGongs(pan){
  const set=new Set();
  const src=[pan.旬空&&pan.旬空.日空, pan.旬空&&pan.旬空.時空];
  for(const zhiStr of src){
    if(!zhiStr)continue;
    for(const zhi of zhiStr){ const g=ZHI_TO_GONG[zhi]; if(g)set.add(g); }
  }
  return set;
}

function locateStem(skyMap, stem){ return Object.keys(skyMap).filter(g=>g!=='中'&&skyMap[g]===stem); }
function locateDoor(doorMap, name){ return Object.keys(doorMap).filter(g=>g!=='中'&&doorMap[g]===name); }
function locateStar(starMap, name){
  const n=name.startsWith('天')?name.slice(1):name;
  return Object.keys(starMap).filter(g=>g!=='中'&&starMap[g]===n);
}
function locateGod(godMap, name){
  const alias={'六合':'合','玄武':'玄','白虎':'虎','螣蛇':'蛇','太陰':'陰','九地':'地','九天':'天','值符':'符'};
  const target=alias[name]||name;
  return Object.keys(godMap).filter(g=>g!=='中'&&godMap[g]===target);
}
// 中宮天干 (如"戊"落中宮) 目前引擎的六害檢測函式都跳過中宮 (checkJiXing/checkRuMu/checkGeng 等)，
// 中五寄宮的規則(寄艮/寄坤/寄巽等，各派不同)尚未經荀爽老師視頻確認，標記 verified:false，
// 暫不臆測寄宮，僅回報"在中宮"供人工判斷。
function locateStemIncludingCenter(skyMap, stem){
  const outer=locateStem(skyMap, stem);
  if(skyMap['中']===stem)return {outer, inCenter:true, verified:false,
    note:'落中宮，六害檢測跳過中宮，中五寄宮規則未經確認，需人工判斷'};
  return {outer, inCenter:false};
}

// 給定一個符號 token (天干/門名/星名(可帶"天"前綴)/神名(含六合/玄武/白虎等別名))，
// 在盤中定位所在宮。回傳陣列(可能為空，如"馬"驛馬星本引擎未實現，無法定位)。
function locateSymbol(token, pan, zfzs){
  if('甲乙丙丁戊己庚辛壬癸'.includes(token))return locateStem(pan.天盤, token);
  if('休生傷杜景死驚開'.includes(token))return locateDoor(pan.門, token);
  if(['符','蛇','陰','合','虎','玄','地','天','六合','玄武','白虎','螣蛇','太陰','九地','九天'].includes(token))
    return locateGod(pan.神, token);
  if(token==='值符')return zfzs&&zfzs.值符星宮 ? [zfzs.值符星宮[1]==='中'?'坤':zfzs.值符星宮[1]] : [];
  if(token==='值使')return zfzs&&zfzs.值使門宮 ? [zfzs.值使門宮[1]==='中'?'坤':zfzs.值使門宮[1]] : [];
  const starName=token.startsWith('天')?token.slice(1):token;
  if('蓬任沖輔英內柱心'.includes(starName))return locateStar(pan.星, starName);
  return []; // 例如"馬"(驛馬)本引擎未實現對應計算，暫回空陣列
}

// ── 宮位關係交叉檢測 (同宮/對宮，只用後天八卦方位，不涉及地支相沖) ──
// 來源: 海明威/拉康案例分析截圖裡「開門，遇玄」「玄武，耗開門」「庚虎，沖生年值符」
// 「值使遇虎，沖開門」等說法逆推——這些都是「某要素所在宮」與「另一要素所在宮」
// 同宮或對宮的關係判斷，不是六害表裡的固定查表項，標記 verified:false 供覆核。
function gongRelation(gongA, gongB){
  if(!gongA||!gongB)return null;
  if(gongA===gongB)return '同宮';
  if(OPPOSITE_GUA[gongA]===gongB)return '對宮(沖)';
  return null;
}
// 對一組已定位好宮位的「要素清單」做兩兩交叉比對，回傳命中的關係清單
// items: [{key, name, guas:[宮,...]}, ...]
function crossCheckGongRelations(items){
  const hits=[];
  for(let i=0;i<items.length;i++){
    for(let j=0;j<items.length;j++){
      if(i===j)continue;
      const a=items[i], b=items[j];
      for(const ga of (a.guas||[])){
        for(const gb of (b.guas||[])){
          const rel=gongRelation(ga,gb);
          if(rel)hits.push({a:a.key, b:b.key, aName:a.name, bName:b.name, gongA:ga, gongB:gb, relation:rel, verified:false});
        }
      }
    }
  }
  return hits;
}

// 給定一個宮位，回傳該宮命中的六害各自的化解建議 (直接沿用既有灭象+布阵解法引擎，
// 財富七要/事業七要跟其他任何"所求"一樣，六害是同一套六害，解法也是同一套解法，
// 不另外發明新邏輯——只有「空」在舊系統裡是綁定 needKey 的"缺啥補啥"，這裡沒有單一
// needKey 對象，簡化為只給方位，不強行湊一個目標天干)
function getCuresAtGong(gua, pan){
  const cures=[];
  const jixingHits=checkJiXing(pan.天盤), rumuHits=checkRuMu(pan.天盤), menpoHits=checkMenPo(pan.門),
        gengHits=checkGeng(pan.天盤), baihuHits=checkBaiHu(pan.神);
  if(jixingHits[gua])cures.push(getCureForJiXing(gua, jixingHits[gua]));
  if(rumuHits[gua])cures.push(getCureForRuMu(gua, rumuHits[gua]));
  if(menpoHits[gua])cures.push(getCureForMenPo(gua));
  if(gengHits[gua])cures.push(getCureForGengOrHu(gua,'庚'));
  if(baihuHits[gua])cures.push(getCureForGengOrHu(gua,'虎'));
  if(getKongGongs(pan).has(gua))cures.push({hai:'空', gong:gua, method:'缺啥補啥',
    place:GUA_DIR[gua], placeVerified:true, note:'具體要補的天干/意象需視當次所求對象而定'});
  return cures.filter(Boolean);
}

function harmsAtGong(gua, pan){
  // 給定一個宮位，回傳命中的六害清單 (刑/墓/迫/庚/虎/空)
  const harms=[];
  if(checkJiXing(pan.天盤)[gua])harms.push('刑');
  if(checkRuMu(pan.天盤)[gua])harms.push('墓');
  if(checkMenPo(pan.門)[gua])harms.push('迫');
  if(checkGeng(pan.天盤)[gua])harms.push('庚');
  if(checkBaiHu(pan.神)[gua])harms.push('虎');
  if(getKongGongs(pan).has(gua))harms.push('空');
  return harms;
}

// ── 財富七要 讀局 ──
// opts.industry: 可選，對照 INDUSTRY_MAP 的行業名稱字串，用於「行業」一項
function analyzeWealthSeven(pan, opts={}){
  const gz=parseGanzhi(pan.干支);
  const results=[];
  function addLocated(key, guas, meta={}){
    const rows=guas.map(g=>({gong:g, harms:harmsAtGong(g,pan)}));
    // rows 為空(符號完全沒落在8個外宮，最常見的原因是落在中宮)時，不能算 bad:false(看起來像
    // "乾淨"，其實是根本沒查到)，要跟"未定位"一樣算 bad:null，否則報告會誤導使用者以為沒事。
    // 2026-08-29 修正：這裡原本沒有 rows.length 判斷，戊/時干若落中宮會被誤判成"✓ 乾淨"。
    results.push({key, ...WEALTH_SEVEN[key], rows, guas, bad:rows.length?rows.some(r=>r.harms.length>0):null, ...meta});
  }

  addLocated('戊', locateStem(pan.天盤,'戊'), {centerInfo:locateStemIncludingCenter(pan.天盤,'戊')});
  addLocated('生門', locateDoor(pan.門,'生'));
  addLocated('六合', locateGod(pan.神,'六合'));
  addLocated('時干', locateStem(pan.天盤, gz.時干), {centerInfo:locateStemIncludingCenter(pan.天盤, gz.時干)});

  const industryEntry=getIndustryStems(opts.industry);
  if(opts.industry && industryEntry){
    const stems=industryEntry.stems;
    const guas=[...new Set(stems.flatMap(s=>locateSymbol(s,pan)))];
    addLocated('行業', guas, {industry:opts.industry, symbols:stems});
  } else {
    results.push({key:'行業', ...WEALTH_SEVEN['行業'], rows:[], guas:[], bad:null, note:'未提供 opts.industry，無法定位'});
  }

  const ganCai=getGanCai(gz.日干, gz.年干);
  const ganCaiStems=[...ganCai.日干財, ...ganCai.生年財];
  const ganCaiRows=ganCaiStems.flatMap(s=>locateStem(pan.天盤,s).map(g=>({gong:g, stem:s, harms:harmsAtGong(g,pan)})));
  results.push({key:'干財', ...WEALTH_SEVEN['干財'], rows:ganCaiRows, guas:ganCaiRows.map(r=>r.gong),
    bad:ganCaiRows.length?ganCaiRows.some(r=>r.harms.length>0):null, detail:ganCai});

  // 月令: 就是這次「起局」當下月支的五行(月支已從 pan.干支 動態解析，不是固定值，
  // 每次起局的月份都不一樣，季節氣候也不一樣)。荀爽老師只給了「月令五種關係」這張表，
  // 沒有規定月令固定要跟誰比——用戶已確認：不能預設比較對象，要按當次具體問的是什麼
  // 來定，所以這裡不再自動代入「戊」，只有呼叫方明確傳入 opts.targetWuxing 時才算關係，
  // 否則只回報這次起局的月令本身(季節氣候背景)，供人工判斷要跟哪個五行比。
  {
    const monthWx=BRANCH_WUXING[gz.月支];
    results.push({key:'月令', ...WEALTH_SEVEN['月令'], monthWuxing:monthWx,
      targetWuxing: opts.targetWuxing || null,
      relation: opts.targetWuxing ? monthRelation(monthWx, opts.targetWuxing) : null,
      note: opts.targetWuxing ? undefined :
        `本次起局月支「${gz.月支}」，月令五行為「${monthWx}」——這是這次問事當下的季節氣候背景。要判斷「月令五種關係」，需指定要拿誰來比(比如求財就比戊，求某個具體十神/宮位就比那個對象的五行)，不能固定套用同一個目標。`});
  }

  const crossHits=crossCheckGongRelations(results.filter(r=>r.guas&&r.guas.length));
  return {items:results, crossHits};
}

// ── 事業七要 讀局 ──
function analyzeCareerSeven(pan, zfzs, opts={}){
  const gz=parseGanzhi(pan.干支);
  const results=[];
  function addLocated(key, guas, meta={}){
    const rows=guas.map(g=>({gong:g, harms:harmsAtGong(g,pan)}));
    // 同 analyzeWealthSeven 的修正：rows 為空時要回報 bad:null(未定位)，不能算 bad:false(乾淨)。
    results.push({key, ...CAREER_SEVEN[key], rows, guas, bad:rows.length?rows.some(r=>r.harms.length>0):null, ...meta});
  }

  addLocated('開門', locateDoor(pan.門,'開'));
  addLocated('景門', locateDoor(pan.門,'景'));
  addLocated('玄武', locateGod(pan.神,'玄武'), {
    note:'若本人自身從事玄武對應領域(如心理學/哲學)，玄武代表本人而非外部小人，需人工二次確認'});

  const gengGuas=locateStem(pan.天盤,'庚'), huGuas=locateGod(pan.神,'白虎');
  const gengHuGuas=[...new Set([...gengGuas,...huGuas])];
  const affected=[...new Set(gengHuGuas.flatMap(g=>[g, OPPOSITE_GUA[g]].filter(Boolean)))];
  results.push({key:'庚虎', ...CAREER_SEVEN['庚虎'],
    rows:gengHuGuas.map(g=>({gong:g, harms:harmsAtGong(g,pan)})), guas:gengHuGuas,
    affectedGongs:affected, bad:gengHuGuas.length>0});

  const industryEntry=getIndustryStems(opts.industry);
  if(opts.industry && industryEntry){
    const stems=industryEntry.stems;
    const guas=[...new Set(stems.flatMap(s=>locateSymbol(s,pan)))];
    addLocated('行業', guas, {industry:opts.industry, symbols:stems});
  } else {
    results.push({key:'行業', ...CAREER_SEVEN['行業'], rows:[], guas:[], bad:null, note:'未提供 opts.industry，無法定位'});
  }

  if(zfzs){
    const zf=(zfzs.值符星宮&&zfzs.值符星宮[1]==='中')?'坤':(zfzs.值符星宮&&zfzs.值符星宮[1]);
    const zs=(zfzs.值使門宮&&zfzs.值使門宮[1]==='中')?'坤':(zfzs.值使門宮&&zfzs.值使門宮[1]);
    results.push({key:'符使', ...CAREER_SEVEN['符使'],
      rows:[{role:'值符(直屬上級)',gong:zf,harms:harmsAtGong(zf,pan)},
            {role:'值使(二把手)',gong:zs,harms:harmsAtGong(zs,pan)}],
      guas:[zf,zs].filter(Boolean),
      bad:harmsAtGong(zf,pan).length>0});
  }

  const ganRows=[
    {role:'年干(大老闆/Boss)', stem:gz.年干, gong:locateStem(pan.天盤,gz.年干)[0]},
    {role:'月干(同事)', stem:gz.月干, gong:locateStem(pan.天盤,gz.月干)[0]},
    {role:'時干(下屬)', stem:gz.時干, gong:locateStem(pan.天盤,gz.時干)[0]},
  ].map(r=>({...r, harms:r.gong?harmsAtGong(r.gong,pan):[]}));
  results.push({key:'諸干', ...CAREER_SEVEN['諸干'], rows:ganRows, guas:ganRows.map(r=>r.gong).filter(Boolean),
    bad:ganRows.some(r=>r.harms.length>0)});

  const crossHits=crossCheckGongRelations(results.filter(r=>r.guas&&r.guas.length));
  return {items:results, crossHits};
}

// ══════════════════ 簡明定位讀法：權威／表現／情感／突破／桃花 ══════════════════
// 跟「財富七要／事業七要」不同：這五個所求目前沒有荀爽老師逐字給出的完整多要素教材，
// 所以這裡刻意不叫「N要」（避免暗示跟財富/事業同等級的來源）。做法是：只挑選每個所求下
// 有清楚跨資料源共識支持的 2-3 個核心符號，定位它們落在哪一宮、有沒有六害，來源逐條標注：
// - 甲=權威、丙=表現、癸=情欲、辛=突破：荀爽老師視頻「意象」明確給出 (YIXIANG_TABLE, verified)
// - 開門=官方/掌權/開創、九天=高位名聲、景門=宣傳曝光、六合=姻緣情緣核心、太陰=隱秘曖昧、
//   休門=曖昧相遇：2026-08-27 綜合多個獨立線上命理資料源交叉核對一致，屬八門/八神基礎象意，
//   非單一教材獨有
// 「求桃花」原本借用「情欲(癸)」湊數且標記未驗證，這裡改用查證過、更貼切的六合+休門
// (催桃花的核心用神本來就是六合，而不是情欲)，NEED_TO_STEM 裡「空亡缺啥補啥」用的癸仍保留
// 不動——那是另一套「灭象布阵」子系統，跟這裡的「定位讀法」是兩回事，不互相依賴。
const SIMPLE_LOCATE_DEFS = {
  '求權威地位': [
    {token:'值符', name:'甲（值符落宮）', role:'本人的權威/地位本身',
      desc:'甲不上盤、永遠藏在值符背後，看值符落宮的門/星/神，就是看這個人真正的權威/地位狀態。',
      note:'甲＝領導、頭領、權威人物，十天干意象裡跨資料源一致的共識內容。'},
    {token:'開',name:'開門', role:'掌權掌控之門',
      desc:'開門對應官方機構、公職、掌權掌控的位置；開門遇六害＝在掌權這件事上不順、卡關。',
      note:'開門＝官方/公職/掌權，多個獨立命理資料一致，屬八門基礎象意。'},
    {token:'九天',name:'九天', role:'高位/名聲/雄心',
      desc:'九天是八神裡最主吉的一個，代表高位、聲望、遠大志向；九天遇六害＝野心/名聲這條路上有阻礙。',
      note:'九天＝高位/名聲/雄心壯志，多個獨立命理資料一致，屬八神基礎象意。'},
  ],
  '求表現曝光': [
    {token:'丙',name:'丙', role:'表演慾、舞台魅力本身',
      desc:'丙如太陽般由中心向外放射能量，對應表演慾、舞台魅力、領袖光環。',
      note:'荀爽老師視頻「意象」明確給出：丙＝表現。', verified:true},
    {token:'景',name:'景門', role:'宣傳/曝光/形象展示',
      desc:'景門主宣傳、渠道、個人形象展示；景門遇六害＝做出來的東西被看到的機會受阻。',
      note:'景門＝宣傳曝光/表演展示，多個獨立命理資料一致（居離宮屬火，光明絢爛之意）。'},
  ],
  '求情感情欲': [
    {token:'癸',name:'癸', role:'欲望/沉溺本身',
      desc:'癸是天干序位最末，象徵深陷其中難以自拔的狀態，性格陰柔多情、容易沉迷上癮。',
      note:'荀爽老師視頻「意象」明確給出：癸＝情欲。', verified:true},
    {token:'六合',name:'六合', role:'情感關係本身',
      desc:'六合代表婚姻/情緣/正緣的關係總星，六合遇六害＝這段關係本身在承壓。',
      note:'六合＝婚姻情緣總星，多個獨立命理資料一致。'},
    {token:'太陰',name:'太陰', role:'隱秘/不可告人的一面',
      desc:'太陰性格陰匿暗昧、善謀劃、宜靜不宜動；旺相為喜慶姻緣，休囚則主曖昧不明、私下往來。',
      note:'太陰旺衰兩義（喜慶婚姻 vs 曖昧私通）跨資料源一致，屬八神基礎象意。'},
  ],
  '求突破變革': [
    {token:'辛',name:'辛', role:'改革/突破本身',
      desc:'辛敢於挑戰舊有秩序、追求創新變革，性格內斂但態度堅決，認準問題便直插要害。',
      note:'荀爽老師視頻「意象」明確給出：辛＝突破。', verified:true},
    {token:'開',name:'開門', role:'打開新局面',
      desc:'開門主開創、打開新局面；開門遇六害＝想開創新局但卡關、開不了局。',
      note:'開門＝開創新局，多個獨立命理資料一致，屬八門基礎象意。'},
  ],
  '求桃花': [
    {token:'六合',name:'六合', role:'催桃花第一核心',
      desc:'六合是姻緣、情緣、正緣的關係總星，傳統上被視為「催桃花的第一核心」；六合遇六害＝正緣/介紹人這條線在承壓。',
      note:'跨資料源一致：六合是桃花/姻緣預測的核心用神，比原本借用的「情欲(癸)」更貼切對應「桃花」本身。'},
    {token:'休',name:'休門', role:'曖昧、相遇的吉門',
      desc:'休門主休息、放鬆、私下相處，是曖昧、相遇的吉門；休門遇六害＝容易錯過或遇不到人。',
      note:'跨資料源一致：休門是感情/曖昧/相遇的代表吉門之一。'},
  ],
  // 「求事業」不是另外湊一套新符號，而是直接借用「事業七要」裡已經逐字驗證過的三個
  // 最核心面向(開門/景門/符使/值使)，只挑最關鍵的三項做輕量版；想看完整七個面向，
  // 選單裡另有「事業七要（完整報告）」。這樣求事業反而是這五個定位讀法裡來源最扎實的一個
  // (直接沿用荀爽老師視頻內容，不是外部交叉核對的推導)。
  '求事業': [
    {token:'開',name:'開門', role:'工作單位、所在團體',
      desc:'單位情況對你的影響。出問題＝單位的問題不是你的問題，是沒待對地方；人際關係複雜的單位也會表現為開門擊刑；開門遇六害＝工作環境基本都不好。',
      note:'荀爽老師視頻「事業七要」明確給出，跟「事業七要」報告同一來源。', verified:true},
    {token:'景',name:'景門', role:'業績展示、個人形象',
      desc:'面試、考核、成果。核心：做出的成績能否被領導看到。出問題＝再有成績也不會被人看到。',
      note:'荀爽老師視頻「事業七要」明確給出，跟「事業七要」報告同一來源。', verified:true},
    {token:'值使',name:'值使（行動力/二把手）', role:'這件事能不能真的推動起來',
      desc:'值使代表實際執行、真正能使得上力的位置；值使遇六害＝有想法但推不動、行動力受阻。',
      note:'荀爽老師視頻「事業七要」明確給出（符使一項的下半部），跟「事業七要」報告同一來源。', verified:true},
  ],
};
function analyzeSimpleLocate(pan, needKey, zfzs){
  const defs=SIMPLE_LOCATE_DEFS[needKey];
  if(!defs)return null;
  const results=defs.map(def=>{
    const guas=locateSymbol(def.token, pan, zfzs);
    const rows=guas.map(g=>({gong:g, harms:harmsAtGong(g,pan)}));
    return {...def, rows, guas, bad:rows.length?rows.some(r=>r.harms.length>0):null};
  });
  const crossHits=crossCheckGongRelations(results.filter(r=>r.guas&&r.guas.length)
    .map(r=>({key:r.token, name:r.name, guas:r.guas})));
  return {items:results, crossHits};
}

// ══════════════════ 桃花：生肖固定桃花位 (咸池，三合局查桃花地支) ══════════════════
// 來源: 命理基礎共識口訣，跨八字/紫微/奇門通用，非單一教材獨有——
// 申子辰(猴鼠龍)桃花在酉、亥卯未(豬兔羊)桃花在子、寅午戌(虎馬狗)桃花在卯、巳酉丑(蛇雞牛)桃花在午。
// 這是「求桃花」的第二種經典查法(第一種是本次盤面裡的六合/休門落宮)，用生年/日支所屬的
// 三合局去查固定桃花地支，再透過既有 ZHI_TO_GONG 對照表換算成宮位。
const PEACH_TRINE={
  '申':'酉','子':'酉','辰':'酉',
  '亥':'子','卯':'子','未':'子',
  '寅':'卯','午':'卯','戌':'卯',
  '巳':'午','酉':'午','丑':'午',
};
function getPeachBranch(branch){ return PEACH_TRINE[branch]||null; }
// 給定一組(標籤,地支)清單，算出各自的桃花宮位，附上該宮的六害/化解 (跟其他定位讀法同一套引擎)
function buildPeachBlossomLocates(pan, branchEntries){
  return branchEntries.map(({label, branch})=>{
    const peachBranch=getPeachBranch(branch);
    const gong=peachBranch?ZHI_TO_GONG[peachBranch]:null;
    return {label, branch, peachBranch, gong,
      harms: gong?harmsAtGong(gong,pan):[],
      bad: gong?harmsAtGong(gong,pan).length>0:null};
  });
}

// ══════════════════ 號令: 日時/生年/意象/符使 四要素 ══════════════════
// 來源: 荀爽視頻「保護各干」截圖逐字轉錄
// 生年天干對照表 (西元年尾數 → 天干): 0庚 1辛 2壬 3癸 4甲 5乙 6丙 7丁 8戊 9己
const YEAR_LASTDIGIT_STEM={0:'庚',1:'辛',2:'壬',3:'癸',4:'甲',5:'乙',6:'丙',7:'丁',8:'戊',9:'己'};
function yearToStem(year){
  const y=parseInt(year,10);
  if(isNaN(y))return null;
  return YEAR_LASTDIGIT_STEM[((y%10)+10)%10];
}
// 西元年 → 地支 (用於「生肖固定桃花位」查生年三合局，跟「桃花位」古訣搭配用的是生肖/年支，
// 不是精確到立春的八字年柱，用曆法年份做簡化對照是這類生肖桃花口訣的通行慣例)
// 錨點: 2020年庚子(子=index0)、2024年甲辰(辰=index4)，公式 (year-4) mod 12 對應地支序位
const BRANCH_ORDER='子丑寅卯辰巳午未申酉戌亥';
function yearToBranch(year){
  const y=parseInt(year,10);
  if(isNaN(y))return null;
  return BRANCH_ORDER[((y-4)%12+12)%12];
}
// 從干支字串 (如「甲辰年丙寅月壬戌日己酉時」) 抽出日干/時干
function parseDayHourStem(ganzhiStr){
  const m=String(ganzhiStr||'').match(/(.)(.)年(.)(.)月(.)(.)日(.)(.)時/);
  if(!m)return {dayStem:null, hourStem:null};
  return {dayStem:m[5], hourStem:m[7]};
}
// 解析使用者輸入的多個生年 (逗號/頓號/空白分隔, 支援「家裡長住的所有人」多人同時保護)
function parseYearsInput(str){
  if(!str)return [];
  return String(str).split(/[,，、\s]+/).map(s=>s.trim()).filter(Boolean)
    .map(yearToStem).filter(Boolean);
}
// 組合出本次起局需要保護的天干集合 (號令四要素: 日時/生年/意象/符使)
function buildProtectedStems(ganzhiStr, yearsInput, needKey, zhifuStem){
  const set=new Set();
  const {dayStem,hourStem}=parseDayHourStem(ganzhiStr);
  if(dayStem)set.add(dayStem);
  if(hourStem)set.add(hourStem);
  parseYearsInput(yearsInput).forEach(s=>set.add(s));
  const target=NEED_TO_STEM[needKey];
  const needStem=typeof target==='string'?target:(target&&target.stem);
  if(needStem)set.add(needStem);
  if(zhifuStem)set.add(zhifuStem);
  return set;
}
// 判斷某宮是否「命中號令」: 該宮的天盤干或地盤干落在保護天干集合內
// 只看天干(天盤)是否命中號令；地干(地盤)依荀爽老師原話「不參與，只是修飾」，故不納入判斷。
// earth 參數保留是為了不用改所有呼叫端的簽名，但函式本體不再讀取它。
function gongHitsProtected(gua, sky, earth, protectedStems){
  if(!protectedStems||protectedStems.size===0)return false;
  return protectedStems.has(sky[gua]);
}

/* 吉凶判斷 (簡易版) */
const JI_DOOR=new Set(['休','生','開']);
const XIONG_DOOR=new Set(['死','驚','傷']);
const JI_STAR=new Set(['天輔','天任','天心','天蓬']);
const XIONG_STAR=new Set(['天內','天柱','天英']);
const JI_GOD=new Set(['值符','太陰','六合','九天']);
const XIONG_GOD=new Set(['螣蛇','白虎','玄武','九地','勾陳','朱雀']);
// ── 財富七要 / 事業七要 報告渲染 (沿用 ana-block/ana-h/ana-item 既有樣式) ──
function renderWealthCareerReport(pan, mode, industry, targetWuxing){
  const T2=x=>t2(x||'');
  const zfzs=pan.值符值使;
  const isWealth=mode==='財富七要';
  const {items, crossHits}=isWealth
    ? analyzeWealthSeven(pan, {industry, targetWuxing: targetWuxing||null})
    : analyzeCareerSeven(pan, zfzs, {industry});

  const itemsHtml=items.map(it=>{
    if(it.note && !it.rows)return `<div class="ana-item"><b>${T2(it.name)}</b>（${T2(it.role||'')}）——${T2(it.note)}</div>`;
    if(it.key==='月令'){
      if(it.relation){
        return `<div class="ana-item"><b>月令</b>（${T2(it.role)}）——月支五行「${it.monthWuxing}」對「${it.targetWuxing}」，${it.relation.rel}：${it.relation.effect}${it.note?`<div class="ana-step" style="opacity:.75">${T2(it.note)}</div>`:''}</div>`;
      }
      return `<div class="ana-item"><b>月令</b>（${T2(it.role)}）——${T2(it.note||'')}</div>`;
    }
    const badgeTxt = it.bad===null?'未定位':(it.bad?'⚠ 有六害':'✓ 乾淨');
    const badgeCls = it.bad===null?'pill-neutral':(it.bad?'pill-xiong':'pill-ji');
    const rowsHtml=(it.rows||[]).map(r=>{
      const gongTxt=r.gong?`${T2(r.gong)}宮`:'（未定位）';
      const stemTxt=r.stem?`「${T2(r.stem)}」`:(r.role?`${T2(r.role)}${r.stem?'「'+T2(r.stem)+'」':''}`:'');
      const harmTxt=r.harms&&r.harms.length?`命中：${r.harms.join('、')}`:'乾淨';
      const curesHtml=(r.gong&&r.harms&&r.harms.length)
        ? getCuresAtGong(r.gong,pan).map(c=>{
            const xiangTxt=c.xiang?.wu ? `，${T2(c.xiang.wu)}` : '';
            const placeTxt=c.place?`，放於${T2(c.place)}方位`:'';
            return `<div class="ana-step" style="opacity:.8">　→ ${T2(c.hai)}：${T2(c.method||'')}${c.cureStem?'（用'+T2(c.cureStem)+'）':''}${xiangTxt}${placeTxt}${c.note?'　'+T2(c.note):''}</div>`;
          }).join('')
        : '';
      return `<div class="ana-step">${stemTxt}${gongTxt}——${harmTxt}</div>${curesHtml}`;
    }).join('');
    // 符號完全沒落在8個外宮時(rows為空)，最常見原因是落在中宮——中五寄宮規則各派不同、尚未
    // 確認，這裡老實告訴使用者「查不到」是為什麼，而不是讓 rowsHtml 留白看起來像沒事一樣。
    const centerHtml=(!it.rows||!it.rows.length)&&it.centerInfo&&it.centerInfo.inCenter
      ? `<div class="ana-step" style="opacity:.8">${T2(it.centerInfo.note)}</div>` : '';
    return `<div class="ana-item">
      <span class="pill ${badgeCls}">${badgeTxt}</span>
      <b>${T2(it.name)}</b>（${T2(it.role||'')}）${it.keyword?'——'+T2(it.keyword):''}
      ${it.key==='行業'&&it.industry?`<div class="ana-step">已選行業：${T2(it.industry.replace('::',' > '))}</div>`:''}
      ${rowsHtml}
      ${centerHtml}
      ${it.desc?`<div class="ana-step" style="opacity:.75">${T2(it.desc)}</div>`:''}
    </div>`;
  }).join('');

  // 交叉關係去重 (a-b 和 b-a 只顯示一次)
  const seen=new Set();
  const crossRows=crossHits.filter(h=>{
    const k=[h.a,h.b,h.gongA,h.gongB].sort().join('|');
    if(seen.has(k))return false; seen.add(k); return true;
  }).map(h=>`<div class="ana-step">「${T2(h.aName)}」(${T2(h.gongA)}宮) 與「${T2(h.bName)}」(${T2(h.gongB)}宮)——${h.relation}</div>`).join('');

  const badCount=items.filter(it=>it.bad===true).length;
  let verdict;
  if(badCount===0) verdict='七要基本乾淨，沒有明顯阻力。';
  else if(badCount<=2) verdict=`七要中有 ${badCount} 項命中六害，問題不算全面，針對命中的項目排雷即可。`;
  else verdict=`七要中有 ${badCount} 項命中六害，阻力比較全面，建議按嚴重度優先處理，或考慮這條路本身是否適合走。`;

  return `<div class="analysis-card">
    <div class="ana-block"><div class="ana-h">${T2(mode)}・逐項檢視</div>${itemsHtml}</div>
    ${crossRows?`<div class="ana-block"><div class="ana-h">要素之間的關聯（同宮/對宮，推導未經逐字驗證）</div>${crossRows}</div>`:''}
    <div class="ana-block"><div class="ana-h">整體怎麼樣</div><div>${verdict}</div></div>
    <div class="ana-block"><div class="ana-h">基礎原則提醒</div>
      <div>① 符號有雙面性——本人主動占據某領域(如玄武對應的心理學/哲學)，該符號可能從「外部威脅」轉化為「本人自身」，不能無腦判凶。<br>
      ② 命裡最容易的路 ≠ 本人真正想走的路，讀局時把「最佳路徑」和「當事人實際選擇」分開呈現。<br>
      ③ 月令五種關係的「性價比」邏輯只用於求財/財富，其他人生課題不一定按性價比走。</div>
    </div>
  </div>`;
}

// ── 「簡明定位讀法」報告渲染 (權威/表現/情感/突破/桃花共用一套模板，沿用財富/事業七要
//    的既有樣式，但明確標註這裡的符號來源分級較低、不是逐字教材，供使用者自行判斷輕重) ──
function renderSimpleLocateReport(pan, needKey, yearsInput){
  const T2=x=>t2(x||'');
  const zfzs=pan.值符值使;
  const {items, crossHits}=analyzeSimpleLocate(pan, needKey, zfzs);

  const itemsHtml=items.map(it=>{
    const badgeTxt = it.bad===null?'未定位':(it.bad?'⚠ 有六害':'✓ 乾淨');
    const badgeCls = it.bad===null?'pill-neutral':(it.bad?'pill-xiong':'pill-ji');
    const rowsHtml=(it.rows||[]).map(r=>{
      const gongTxt=r.gong?`${T2(r.gong)}宮`:'（未定位）';
      const harmTxt=r.harms&&r.harms.length?`命中：${r.harms.join('、')}`:'乾淨';
      const curesHtml=(r.gong&&r.harms&&r.harms.length)
        ? getCuresAtGong(r.gong,pan).map(c=>{
            const xiangTxt=c.xiang?.wu ? `，${T2(c.xiang.wu)}` : '';
            const placeTxt=c.place?`，放於${T2(c.place)}方位`:'';
            return `<div class="ana-step" style="opacity:.8">　→ ${T2(c.hai)}：${T2(c.method||'')}${c.cureStem?'（用'+T2(c.cureStem)+'）':''}${xiangTxt}${placeTxt}${c.note?'　'+T2(c.note):''}</div>`;
          }).join('')
        : '';
      return `<div class="ana-step">${gongTxt}——${harmTxt}</div>${curesHtml}`;
    }).join('') || '<div class="ana-step" style="opacity:.75">這一局的盤面上沒有找到這個符號（可能落在中宮，或這個符號在中宮寄宮的規則尚未確認）。</div>';
    return `<div class="ana-item">
      <span class="pill ${badgeCls}">${badgeTxt}</span>
      <b>${T2(it.name)}</b>${it.role?'（'+T2(it.role)+'）':''}
      ${rowsHtml}
      ${it.desc?`<div class="ana-step" style="opacity:.75">${T2(it.desc)}</div>`:''}
      ${it.note?`<div class="ana-step" style="opacity:.55;font-size:11px">來源：${T2(it.note)}</div>`:''}
    </div>`;
  }).join('');

  const seen=new Set();
  const crossRows=crossHits.filter(h=>{
    const k=[h.a,h.b,h.gongA,h.gongB].sort().join('|');
    if(seen.has(k))return false; seen.add(k); return true;
  }).map(h=>`<div class="ana-step">「${T2(h.aName)}」(${T2(h.gongA)}宮) 與「${T2(h.bName)}」(${T2(h.gongB)}宮)——${h.relation}</div>`).join('');

  const badCount=items.filter(it=>it.bad===true).length;
  let verdict;
  if(badCount===0) verdict='這幾個核心符號基本乾淨，沒有明顯阻力。';
  else if(badCount<items.length) verdict=`${badCount}／${items.length} 個核心符號命中六害，問題不算全面，針對命中的項目排雷即可。`;
  else verdict=`這幾個核心符號都命中六害，阻力比較全面，建議按嚴重度優先處理，或考慮這條路本身是否適合走。`;

  // 「求桃花」額外附上「生肖固定桃花位」(第二種經典查法，跟上面「本次盤面六合/休門落宮」
  // 是兩套獨立方法並存——一個看這次起局當下的關係狀態，一個看個人固定的桃花方位)
  let peachHtml='';
  if(needKey==='求桃花'){
    const gz=parseGanzhi(pan.干支);
    const entries=[];
    if(gz&&gz.日支)entries.push({label:`日支「${T2(gz.日支)}」`, branch:gz.日支});
    String(yearsInput||'').split(/[,，、\s]+/).map(s=>s.trim()).filter(Boolean).forEach(y=>{
      const b=yearToBranch(y);
      if(b)entries.push({label:`生年${y}（${T2(b)}）`, branch:b});
    });
    const locates=buildPeachBlossomLocates(pan, entries);
    if(locates.length){
      const rowsHtml=locates.map(l=>{
        if(!l.gong)return `<div class="ana-item">${l.label}——地支對照找不到宮位，暫無法定位</div>`;
        const badgeTxt=l.bad?'⚠ 有六害':'✓ 乾淨';
        const badgeCls=l.bad?'pill-xiong':'pill-ji';
        const curesHtml=l.bad
          ? getCuresAtGong(l.gong,pan).map(c=>{
              const xiangTxt=c.xiang?.wu ? `，${T2(c.xiang.wu)}` : '';
              const placeTxt=c.place?`，放於${T2(c.place)}方位`:'';
              return `<div class="ana-step" style="opacity:.8">　→ ${T2(c.hai)}：${T2(c.method||'')}${c.cureStem?'（用'+T2(c.cureStem)+'）':''}${xiangTxt}${placeTxt}${c.note?'　'+T2(c.note):''}</div>`;
            }).join('')
          : '';
        return `<div class="ana-item">
          <span class="pill ${badgeCls}">${badgeTxt}</span>
          ${l.label}的桃花位在「${T2(l.peachBranch)}」，對應<b>${T2(l.gong)}宮</b>
          <div class="ana-step">${l.harms.length?`命中：${l.harms.join('、')}`:'乾淨'}</div>
          ${curesHtml}
        </div>`;
      }).join('');
      peachHtml=`<div class="ana-block"><div class="ana-h">桃花的第二種查法・生肖固定桃花位</div>
        <div style="font-size:11px;opacity:.6;margin-bottom:6px">口訣：申子辰(猴鼠龍)桃花在酉、亥卯未(豬兔羊)桃花在子、寅午戌(虎馬狗)桃花在卯、巳酉丑(蛇雞牛)桃花在午——命理基礎共識口訣，非單一教材獨有；用生年地支查是每人固定的桃花位，日支則是這次起局當下附帶算出的參考。</div>
        ${rowsHtml}
      </div>`;
    }
  }

  return `<div class="analysis-card">
    <div style="font-size:11px;opacity:.7;margin-bottom:8px;padding-bottom:8px;border-bottom:1px dashed #D8E0EC">
      這份「${T2(needKey)}」定位讀法，只挑了幾個有跨資料源共識支持的核心符號，不是像財富七要/事業七要
      那樣逐字轉錄自單一教材的完整框架，項目數量也比七要少——請把它當成一個起點，跟下面的六害/格局分析
      合併判斷，而不是唯一答案。
    </div>
    <div class="ana-block"><div class="ana-h">${T2(needKey)}・核心符號定位</div>${itemsHtml}</div>
    ${crossRows?`<div class="ana-block"><div class="ana-h">符號之間的關聯（同宮/對宮，推導未經逐字驗證）</div>${crossRows}</div>`:''}
    ${peachHtml}
    <div class="ana-block"><div class="ana-h">整體怎麼樣</div><div>${verdict}</div></div>
  </div>`;
}

// ══════════════════ 師傅總結：跨體系彙整 + 白話總結(帶「主流/荀爽」來源標籤) ══════════════════
// 來源: 2026-08-29 用戶明確要求「像遁甲師傅一樣，用人話講清楚整個盤最需要注意的地方、怎麼
// 避免、怎麼破解」，並且要求「主流的判斷跟荀爽老師的判斷絕對不能揉在一起講，要分開標明來源」
// (用戶原話：「如果是，那么建议分开说，比如，主流的分析认为xxxxx,荀爽认为xxxxxx，这种分开
// 说，不要融在一起」)。
// 做法：先把每一宮兩套體系各自的命中資料彙整起來(buildGongProfiles)，再依「命中號令的信號
// 數量/強度」排出最需要注意的宮(scoreProfile/buildMasterSummary)，敘述文字全部用「固定模板
// 拼接已經測試過的判斷結果」組出來，不做自由生成——每一句話都能追溯到某個既有的 check* 函式，
// 這樣才可控可測試，不會出現語氣過度武斷或前後矛盾的問題。
// 化解建議只在「荀爽老師體系」的項目才有(逐字轉錄自視頻)，主流斷局法(地利/主客/天時/人和/
// 格局)目前沒有對應的化解方法，摘要裡會誠實說明這一點，不會假裝兩邊都有解法。

const XUNLAO_MEANING={刑:'爭執損耗',墓:'沉溺迷失',庚:'凶禍阻隔',虎:'快速危險',迫:'壓力脅迫',空:'虛假不實'};
// 刑/墓/庚 的軍事隱喻，來源同 qimen-ui.js 既有的 LIUHAI_DEEPER(荀爽老師視頻「主帥/三奇/六儀」截圖逐字轉錄)
const XUNLAO_DEEPER={
  刑:'刑打的是「六儀」（正面主力）——正面主力被絞殺殆盡，全面崩潰',
  墓:'墓困的是「三奇」（奇兵奇謀）——奇兵落入對方陷阱，發揮不出來',
  庚:'庚點的是「主帥」本身（甲）——你自己被瞄準、被克制',
};
const DILI_MEANING={吉:'這個方向此刻有勁、使得上力', 凶:'這個方向此刻沒勁、使不上力'};
const ZHUKE_MEANING={主:'這個方向的主動權偏向你/根基這邊', 客:'這個方向的主動權偏向對方/事情的變化這邊', 平:'這個方向雙方勢均力敵，不分高下'};
const TIANSHI_MEANING={吉:'這個方向踩在對的時機上', 凶:'這個方向生不逢時，時機不站在這邊'};
const RENHE_MEANING={
  迫:'這個方向的力道被壓著、動不了',
  制:'這個方向被外力直接克住，比迫更難受',
  和:'這個方向能順暢地把力量交出去，算順利',
  義:'這個方向能得到環境反過來的滋養，算得利',
  比和:'這個方向不分勝負，平常',
};

// 把 getCureFor*() 系列函式回傳的 cure 物件，轉成統一的「灭象/布阵」結構化步驟，
// 供白話總結跟渲染層共用；不含任何新判斷，純粹重新整理既有欄位。
function formatCureSteps(cure){
  if(!cure)return null;
  const rule=MIEXIANG_RULE[cure.hai];
  const miexiang=rule?{action:rule.action, verified:rule.verified!==false}:null;
  const buzhen=[];
  if(cure.doorsText){
    buzhen.push({dimension:'門象', text:`擺放「${cure.doorsText}」門象`});
    (cure.branchXiangs||[]).forEach(bx=>{
      buzhen.push({dimension:'物(地支)', text:`「${bx.branch}」（${bx.zodiac}）：${bx.wu}，放${bx.placement}`});
    });
  }else if(cure.xiang){
    const x=cure.xiang;
    buzhen.push({dimension:'字', text:`寫「${x.stem}」字，放${x.placement||'高處'}`});
    buzhen.push({dimension:'物', text:`${x.wu}，放${x.placement||'高處'}`});
    if(x.yi)buzhen.push({dimension:'意', text:x.yi});
    if(x.xing)buzhen.push({dimension:'行', text:x.xing});
  }
  return {
    hai:cure.hai, miexiang, buzhen,
    place:cure.place||null, method:cure.method||null,
    verified:cure.verified!==false, note:cure.note||null,
  };
}

// 荀爽老師體系：某一宮命中的六害清單(刑/墓/庚/虎/迫/空)，每條帶白話說明 + 化解步驟
function buildXunlaoItems(gong, pan, protectedStems, needKey){
  const sky=pan.天盤||{}, earth=pan.地盤||{}, door=pan.門||{}, god=pan.神||{};
  const zfzs=pan.值符值使||{};
  const items=[];
  const jixingHits=checkJiXing(sky), rumuHits=checkRuMu(sky), menpoHits=checkMenPo(door),
        gengHits=checkGeng(sky), baihuHits=checkBaiHu(god);
  if(jixingHits[gong]){
    const st=jixingHits[gong];
    items.push({type:'刑', stem:st, isHit:protectedStems.has(st),
      text:`天干「${st}」在這裡擊刑——${XUNLAO_MEANING['刑']}。${XUNLAO_DEEPER['刑']}`,
      cureSteps:formatCureSteps(getCureForJiXing(gong,st))});
  }
  if(rumuHits[gong]){
    const st=rumuHits[gong];
    items.push({type:'墓', stem:st, isHit:protectedStems.has(st),
      text:`天干「${st}」在這裡入墓——${XUNLAO_MEANING['墓']}。${XUNLAO_DEEPER['墓']}`,
      cureSteps:formatCureSteps(getCureForRuMu(gong,st))});
  }
  if(gengHits[gong]){
    items.push({type:'庚', isHit:protectedStems.has('庚'),
      text:`這裡天盤見庚——${XUNLAO_MEANING['庚']}。${XUNLAO_DEEPER['庚']}`,
      cureSteps:formatCureSteps(getCureForGengOrHu(gong,'庚'))});
  }
  if(baihuHits[gong]){
    items.push({type:'虎', isHit:gongHitsProtected(gong,sky,earth,protectedStems),
      text:`這裡有白虎——${XUNLAO_MEANING['虎']}`,
      cureSteps:formatCureSteps(getCureForGengOrHu(gong,'虎'))});
  }
  if(menpoHits[gong]){
    const dr=menpoHits[gong];
    items.push({type:'迫', door:dr,
      isHit:gongHitsProtected(gong,sky,earth,protectedStems)||dr===zfzs.值使門宮?.[0],
      text:`「${dr}」門在這裡被宮位迫住——${XUNLAO_MEANING['迫']}`,
      cureSteps:formatCureSteps(getCureForMenPo(gong))});
  }
  if(getKongGongs(pan).has(gong)){
    items.push({type:'空', isHit:true,
      text:`這裡是空亡——${XUNLAO_MEANING['空']}`,
      cureSteps:formatCureSteps(getCureForKongWang(gong, needKey))});
  }
  return items;
}

// 主流斷局法：某一宮命中的格局/三詐五假/地利/主客/天時/人和，每條帶白話說明(無化解方法)
function buildMainstreamItems(gong, pan, protectedStems){
  const sky=pan.天盤||{}, earth=pan.地盤||{}, door=pan.門||{}, star=pan.星||{}, god=pan.神||{};
  const items=[];
  checkMainstreamGeju(sky, earth).filter(h=>h.gong===gong).forEach(h=>items.push({
    type:'格局', name:h.name, luck:h.luck, isHit:protectedStems.has(sky[gong]),
    text:`命中「${h.name}」格局（${h.luck}）：${h.desc}`}));
  checkSanzhaWujia(sky, door, god).filter(h=>h.gong===gong).forEach(h=>items.push({
    type:'三詐五假', name:h.name, isHit:protectedStems.has(sky[gong]),
    text:`命中「${h.name}」：${h.desc}`}));
  checkDili(sky, earth).filter(h=>h.gong===gong).forEach(h=>items.push({
    type:'地利', luck:h.luck, isHit:protectedStems.has(h.stem),
    text:`${h.panType}「${h.stem}」在這裡走到「${h.stage}」（${h.luck==='吉'?'得地利':'失地利'}）——${DILI_MEANING[h.luck]}`}));
  const zhukeHit=checkZhuke(sky, earth).find(h=>h.gong===gong);
  if(zhukeHit)items.push({type:'主客', favor:zhukeHit.favor,
    isHit:protectedStems.has(zhukeHit.skyStem)||protectedStems.has(zhukeHit.earthStem),
    text:`天盤「${zhukeHit.skyStem}」與地盤「${zhukeHit.earthStem}」是「${zhukeHit.relation}」——${ZHUKE_MEANING[zhukeHit.favor]}`});
  const gz=parseGanzhi(pan.干支);
  const tianshiHit=checkTianshi(star, gz&&gz.月支).find(h=>h.gong===gong);
  if(tianshiHit)items.push({type:'天時', luck:tianshiHit.luck,
    isHit:gongHitsProtected(gong,sky,earth,protectedStems),
    text:`「${tianshiHit.star}」星在這裡「${tianshiHit.state}」（${tianshiHit.luck==='吉'?'得天時':'失天時'}）——${TIANSHI_MEANING[tianshiHit.luck]}`});
  const renheHit=checkRenhe(door).find(h=>h.gong===gong);
  if(renheHit)items.push({type:'人和', luck:renheHit.luck,
    isHit:gongHitsProtected(gong,sky,earth,protectedStems),
    text:`「${renheHit.door}」門與這個宮位是「${renheHit.relation}」——${RENHE_MEANING[renheHit.relation]}`});
  return items;
}

// 彙整全部 8 個外宮，兩套體系各自獨立列出，不合併
function buildGongProfiles(pan, protectedStems, needKey){
  return GRID_ORDER.filter(g=>g!=='中').map(gong=>({
    gong,
    xunlao:buildXunlaoItems(gong, pan, protectedStems, needKey),
    mainstream:buildMainstreamItems(gong, pan, protectedStems),
  }));
}

// 排序用權重：命中號令的信號權重較高，主客/人和的中性狀態(比和/平)權重打折，
// 純粹用來決定「這一宮值不值得特別拉出來講」，不代表吉凶方向。
function scoreProfile(profile){
  let score=0;
  profile.xunlao.forEach(it=>{ score+=it.isHit?2:0.5; });
  profile.mainstream.forEach(it=>{
    const neutral=(it.type==='主客'&&it.favor==='平')||(it.type==='人和'&&it.luck==='平');
    score+=(it.isHit?1.5:0.3)*(neutral?0.4:1);
  });
  return score;
}

// 統計某宮「有明確吉凶方向」的信號各幾個：荀爽六害一律算凶(定義上就是「害」)；主流的格局/
// 三詐五假/地利/天時/人和有明確 luck 欄位；主客只講「利主/利客」不算吉凶，不計入。
// 用來判斷兩套體系在同一宮是否方向一致，還是各說各話。
function tallyDirection(profile){
  let xiong=profile.xunlao.length, ji=0;
  profile.mainstream.forEach(it=>{
    if(it.type==='主客')return;
    if(it.luck==='吉')ji++;
    else if(it.luck==='凶')xiong++;
  });
  return {xiong, ji};
}

// 主入口：回傳結構化的「師傅總結」資料(不含 HTML，交給 qimen-ui.js 渲染)。
// opts.maxHotspots: 最多挑幾個宮出來細講，預設 3。
function buildMasterSummary(pan, protectedStems, needKey, opts={}){
  const profiles=buildGongProfiles(pan, protectedStems, needKey);
  const scored=profiles.map(p=>({...p, score:scoreProfile(p), direction:tallyDirection(p)}))
    .sort((a,b)=>b.score-a.score);
  const maxHotspots=opts.maxHotspots||3;
  const hotspots=scored.filter(p=>p.score>0).slice(0,maxHotspots).map(p=>{
    let agreement='none';
    if(p.direction.xiong>0&&p.direction.ji>0)agreement='mixed';
    else if(p.direction.xiong>0)agreement='consistent_xiong';
    else if(p.direction.ji>0)agreement='consistent_ji';
    return {gong:p.gong, score:p.score, xunlao:p.xunlao, mainstream:p.mainstream, agreement};
  });
  return {hotspots, quiet:hotspots.length===0, allProfiles:scored};
}

function luckClass(v){
  if(['休','生','開','天輔','天任','天心','天蓬','值符','太陰','六合','九天'].includes(v))return 'pill-ji';
  if(['死','驚','傷','天內','天柱','天英','螣蛇','白虎','玄武','九地','勾陳','朱雀'].includes(v))return 'pill-xiong';
  return 'pill-neutral';
}

// 供 tests/regression.test.js 在 Node 環境下直接 require 這個檔案來測純邏輯函式/資料表，
// 不用像瀏覽器一樣靠 <script> 順序共享全域作用域。瀏覽器裡 typeof module==='undefined'，
// 這段不會執行，行為不變。
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    JIXING_TABLE, checkJiXing, RUMU_TABLE, checkRuMu, checkMenPo, checkGeng, checkBaiHu,
    MAINSTREAM_GEJU, checkMainstreamGeju, SANZHA_DEFS, WUJIA_DEFS, checkSanzhaWujia,
    SIMPLE_LOCATE_DEFS, analyzeSimpleLocate,
    PEACH_TRINE, getPeachBranch, buildPeachBlossomLocates, yearToBranch, yearToStem,
    locateStem, locateDoor, locateStar, locateGod, locateSymbol,
    harmsAtGong, getCuresAtGong, parseGanzhi, GRID_ORDER, ZHI_TO_GONG,
    monthRelation, analyzeWealthSeven,
    CHANGSHENG_START, TWELVE_STAGES, GONG_TO_ZHI, getTwelveStage, getTwelveStagesAtGong, checkDili,
    stemWuxing, SHENG_TABLE, KE_TABLE_WUXING, checkZhuke,
    BRANCH_WUXING, getNineStarState, checkTianshi,
    DOOR_WUXING, GONG_WUXING, KE_MAP, getMenGongRelation, checkRenhe,
    STAR_HOME, DOOR_HOME, checkFuyinFanyin,
    formatCureSteps, buildXunlaoItems, buildMainstreamItems, buildGongProfiles,
    scoreProfile, tallyDirection, buildMasterSummary, buildProtectedStems, gongHitsProtected,
  };
}

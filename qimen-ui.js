// qimen-ui.js — 會直接讀寫 DOM 的介面層：取象彈窗(openSheet)、起局儀式/歷史記錄面板、
// 時間工具、起局按鈕(calc)、主渲染函式(renderPan)、初始化。
// 2026-08-27 從 qimen.html 內嵌 <script> 拆分而來 (純搬移，未改動任何邏輯)。
// 依賴: qimen-engine.js (QimenJS/Solar)、qimen-lexicon.js (LEX_DATA/RITUAL_DATA)、qimen-rules.js。

/* ── OpenCC s2t init ── */
let t2 = x => x;
function initT2(){
  if(typeof OpenCC!=='undefined'){
    try{ t2=OpenCC.Converter({from:'cn',to:'tw'}); }catch(e){}
  }
}

/* ── 取象詞典彈窗 ── */
function luckBadge(luck){
  if(luck==='吉')return '<span class="sheet-tag luck-ji">吉</span>';
  if(luck==='凶')return '<span class="sheet-tag luck-xiong">凶</span>';
  if(luck)return `<span class="sheet-tag luck-neu">${luck}</span>`;
  return '';
}
function openSheet(kind, key, gua, role){
  const L=window.LEX_DATA||{};
  let title='', sub='', metaHtml='', desc='請查閱資料';
  if(kind==='stem'){
    const d=L.stems&&L.stems[key];
    if(d){
      title=`${d.name} 天干`;
      sub=d.keyword||'';
      metaHtml=`<span class="sheet-tag color">${d.color} · ${d.material}</span>`;
      desc=d.desc;
    }
  }else if(kind==='door'){
    const d=L.doors&&L.doors[key];
    if(d){title=d.name;sub=d.keyword||'';desc=d.desc;}
  }else if(kind==='star'){
    const d=L.stars&&L.stars[key];
    if(d){title=d.name;sub=d.keyword||'';
      metaHtml=luckBadge(d.luck)+(d.wuxing?`<span class="sheet-tag color">五行屬${d.wuxing}</span>`:'');
      desc=d.desc;}
  }else if(kind==='god'){
    const d=L.gods&&L.gods[key];
    if(d){title=d.name;sub=d.keyword||'';
      metaHtml=luckBadge(d.luck)+(d.wuxing?`<span class="sheet-tag color">五行屬${d.wuxing}</span>`:'');
      desc=d.desc;}
  }else if(kind==='gua'){
    const name=(typeof GUA_NAME!=='undefined'&&GUA_NAME[key])||key;
    const dir=(typeof GUA_DIR!=='undefined'&&GUA_DIR[key])||'';
    const x=typeof GUA_XIANG!=='undefined'?GUA_XIANG[key]:null;
    title=`${name}宮`;
    sub=dir?`方位：${dir}`:'';
    if(x){
      metaHtml=`<span class="sheet-tag color">人物：${x.person}</span>`
        +`<span class="sheet-tag color">身體：${x.body}</span>`
        +`<span class="sheet-tag color">性情：${x.trait}</span>`;
      desc=`自然物象：${x.nature}。這一宮的天干/門/星/神落在這裡，都可以往「${x.person}」「${x.body}」「${x.nature}」這幾個方向去對應現實中的人事物。`;
    }
  }
  // 這一宮這局命中的六害/格局摘要 (Phase 2: 由 renderPan 依 kind/role 事先組好放進
  // window.CURRENT_GONG_HITS，這裡純粹取用，不重新判斷)
  let hitsHtml='';
  const H=gua&&window.CURRENT_GONG_HITS&&window.CURRENT_GONG_HITS[gua];
  if(H){
    if(kind==='gua')hitsHtml=H.all;
    else if(kind==='door')hitsHtml=H.door;
    else if(kind==='god')hitsHtml=H.god;
    else if(kind==='star')hitsHtml=H.star;
    else if(kind==='stem')hitsHtml=(role==='earth')?H.earth:H.sky;
  }

  document.getElementById('sterm').textContent=t2(title)||key;
  document.getElementById('ssub').textContent=t2(sub);
  document.getElementById('smeta').innerHTML=metaHtml;
  document.getElementById('sdesc').textContent=t2(desc);
  document.getElementById('shits').innerHTML=hitsHtml||'';
  document.getElementById('smask').classList.add('show');
  document.getElementById('sheet').classList.add('show');
}
window.openSheet=openSheet;
window.closeSheet=function(){
  document.getElementById('smask').classList.remove('show');
  document.getElementById('sheet').classList.remove('show');
};

/* ── 起局須知 / 起局儀式 面板 ── */
function renderRitualHtml(){
  const R=RITUAL_DATA;
  return `
  <div class="r-sec">
    <div class="r-title">起局前自我檢查</div>
    ${R.notOk.map(t=>`<div class="r-no">✕ ${t2(t)}</div>`).join('')}
    ${R.ok.map(t=>`<div class="r-yes">✓ ${t2(t)}</div>`).join('')}
    <div style="margin-top:4px">${t2(R.oneEventOneJu.title)}，${t2(R.oneEventOneJu.note)}</div>
  </div>
  <div class="r-sec">
    <div class="r-title">起局前儀式</div>
    <div>${t2(R.preRitual.action)}</div>
    <div class="r-quote">${t2(R.preRitual.incantationClassic)}</div>
    <div style="opacity:.8">（現代版）</div>
    <div class="r-quote">${t2(R.preRitual.incantationModern)}</div>
    <div>起局後默念：${t2(R.preRitual.afterModern)}</div>
  </div>
  <div class="r-sec">
    <div class="r-title">${t2(R.efficacy.title)}</div>
    <div>${R.efficacy.forbid.map(t=>t2(t)).join('，')}</div>
    <div style="margin-top:3px">${t2(R.efficacy.note)}</div>
  </div>
  <div class="r-sec">
    <div class="r-title">有效期與封局</div>
    <div>${t2(R.validity.period)}</div>
    <div>${t2(R.sealAfter.rule)}：古代蓋印 / 現代版——${t2(R.sealAfter.modern)}</div>
  </div>
  <div class="r-sec" style="opacity:.75">
    <div class="r-title">完整流程</div>
    <div>${t2(R.flow)}</div>
  </div>`;
}
window.toggleRitual=function(){
  const p=document.getElementById('ritualPanel');
  if(p.style.display==='none'){
    p.innerHTML=renderRitualHtml();
    p.style.display='block';
  }else{
    p.style.display='none';
  }
};

/* ── 起局歷史記錄 (localStorage, 僅存本機瀏覽器, 不同裝置不互通, 建議定期匯出備份) ── */
const HISTORY_KEY='qimen_history_v1';
const HISTORY_MAX=300;
function loadHistory(){
  try{
    const raw=localStorage.getItem(HISTORY_KEY);
    return raw?JSON.parse(raw):[];
  }catch(e){ return []; }
}
function saveHistoryList(list){
  try{ localStorage.setItem(HISTORY_KEY, JSON.stringify(list)); }
  catch(e){ console.warn('歷史記錄儲存失敗(可能是瀏覽器儲存空間已滿)', e); }
}
// 只存起局的「輸入條件」與「摘要結果」，不存完整盤面 —— 之後重新排盤用同一套算法算，
// 未來算法若有修正，回看歷史時會自動用最新邏輯重算，而不是凍結在存檔當下的舊結果
function pushHistoryRecord(rec){
  const list=loadHistory();
  list.unshift(rec); // 最新的放最前面
  if(list.length>HISTORY_MAX) list.length=HISTORY_MAX;
  saveHistoryList(list);
}
function deleteHistoryRecord(id){
  const list=loadHistory().filter(r=>r.id!==id);
  saveHistoryList(list);
  renderHistoryPanel();
}
function clearHistoryAll(){
  if(!confirm('確定清空全部起局歷史記錄？此操作無法復原。'))return;
  saveHistoryList([]);
  renderHistoryPanel();
}
// 還原「大行業/小行業」下拉：小行業的值格式是 "大行業::小行業"(一般行業)或單純
// key(INDUSTRY_MAP 的常見行業)，要先選對大行業、觸發選項重新產生，才能把小行業設回去，
// 不能直接對小行業下拉設值(這時候小行業清單可能還是「先選大行業」的預設空清單)。
function restoreIndustrySelect(industry){
  const bigSel=document.getElementById('iIndustryBig'), smallSel=document.getElementById('iIndustrySmall');
  if(!bigSel||!smallSel)return;
  if(!industry){ bigSel.value=''; updateSmallIndustryOptions(); return; }
  bigSel.value = industry.includes('::') ? industry.split('::')[0] : '__FLAT__';
  updateSmallIndustryOptions();
  smallSel.value=industry;
}
function reloadHistoryRecord(id){
  const rec=loadHistory().find(r=>r.id===id);
  if(!rec)return;
  document.getElementById('iDate').value=rec.dateStr;
  document.getElementById('iTime').value=rec.timeStr;
  document.getElementById('iNeed').value=rec.needKey||'求財';
  document.getElementById('iYears').value=rec.yearsInput||'';
  document.getElementById('iJuType').value=rec.juType||'事局';
  // longitudeInput/industry/targetWuxing 是這次(2026-09-03)才開始存的欄位，舊記錄沒有這幾
  // 個欄位時一律還原成空值(=不校正/不選行業/不比較月令)，誠實反映「這筆舊記錄本來就沒存
  // 這項資訊」，不是隨便留著畫面上原本的值繼續用。
  document.getElementById('iLongitude').value=rec.longitudeInput!==undefined?rec.longitudeInput:'';
  restoreIndustrySelect(rec.industry||'');
  document.getElementById('iMonthTarget').value=rec.targetWuxing||'';
  updateNeedHint();
  document.getElementById('ritualPanel').style.display='none';
  document.getElementById('historyPanel').style.display='none';
  calc(true); // 只是回看舊記錄，不是新起一局，不該再往歷史清單多推一筆
  window.scrollTo({top:0,behavior:'smooth'});
}
function exportHistoryJson(){
  const list=loadHistory();
  const blob=new Blob([JSON.stringify(list,null,2)],{type:'application/json'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');
  a.href=url; a.download=`qimen_history_${new Date().toISOString().slice(0,10)}.json`;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
// 嚴格校驗匯入備份裡每一筆記錄的形狀，只留下欄位型別正確的部分，其餘一律丟棄或轉成安全的
// 空值——不是只檢查「這是不是陣列」就整包收下(Codex code review 2026-09-03 抓到的問題：
// 原本沒做這層校驗，dateStr/needKey/prediction 文字、id 等欄位會直接被拼進 innerHTML/
// onclick，被竄改過或來路不明的備份檔案可以藉此在瀏覽器裡跑任意腳本)。這裡只負責「型別
// 正確」，畫面顯示時 renderHistoryPanel()/renderPredictionSnapshot() 仍然會對所有文字做
// escHtml，雙層防護不互相取代。
function sanitizeHistoryRecord(r){
  if(!r||typeof r!=='object')return null;
  const id=Number(r.id);
  if(!Number.isFinite(id))return null;
  const str=v=>typeof v==='string'?v:'';
  const sanitizeItems=arr=>Array.isArray(arr)
    ?arr.filter(x=>x&&typeof x==='object').map(x=>({text:str(x.text), isHit:x.isHit===true}))
    :[];
  const prediction=Array.isArray(r.prediction)
    ?r.prediction.filter(hp=>hp&&typeof hp==='object').map(hp=>({
        gong:str(hp.gong), agreement:str(hp.agreement),
        xunlao:sanitizeItems(hp.xunlao), mainstream:sanitizeItems(hp.mainstream),
      }))
    :undefined; // undefined 保留「這筆記錄建立於功能上線前，沒有快照」的既有語意
  const reviewedAt=Number(r.reviewedAt);
  return {
    id, dateStr:str(r.dateStr), timeStr:str(r.timeStr), needKey:str(r.needKey),
    yearsInput:str(r.yearsInput), juType:str(r.juType), juLabel:str(r.juLabel), gz:str(r.gz),
    hitsSummary:str(r.hitsSummary), longitudeInput:str(r.longitudeInput),
    industry:str(r.industry), targetWuxing:str(r.targetWuxing), review:str(r.review),
    reviewedAt:Number.isFinite(reviewedAt)?reviewedAt:undefined,
    prediction,
  };
}
function importHistoryJson(fileInput){
  const file=fileInput.files&&fileInput.files[0];
  if(!file)return;
  const reader=new FileReader();
  reader.onload=e=>{
    try{
      const imported=JSON.parse(e.target.result);
      if(!Array.isArray(imported))throw new Error('格式不對');
      const sanitized=imported.map(sanitizeHistoryRecord).filter(Boolean);
      const existing=loadHistory();
      const existingIds=new Set(existing.map(r=>r.id));
      const merged=existing.concat(sanitized.filter(r=>!existingIds.has(r.id)));
      merged.sort((a,b)=>b.id-a.id);
      saveHistoryList(merged.slice(0,HISTORY_MAX));
      renderHistoryPanel();
      const skipped=imported.length-sanitized.length;
      alert(`已匯入，目前共有 ${merged.length} 筆歷史記錄${skipped>0?`（${skipped} 筆格式不正確已略過）`:''}`);
    }catch(err){ alert('匯入失敗：檔案格式不正確'); }
  };
  reader.readAsText(file);
  fileInput.value='';
}
// escHtml() 2026-09-06 搬到 qimen-rules.js(純函式，不碰 DOM，Node 測試也需要用到)，
// 這裡繼續沿用同一個全域函式，不重複定義第二份。
// 預註冊式驗證日誌：把起局當下鎖定的 prediction 快照渲染成唯讀文字，跟下面可編輯的
// 「事後回看」欄位並排放，方便對照「起局時真的判斷了什麼」vs「後來實際發生了什麼」。
// r.prediction 是 undefined 代表這筆記錄建立於功能上線前，沒有快照可看；是空陣列代表
// 那次起局本身是「無特別突出宮位」的平穩局，不是資料缺漏。
function renderPredictionSnapshot(r){
  if(r.prediction===undefined){
    return '<div class="h-pred-note">（此筆記錄建立於「預註冊式驗證日誌」上線前，沒有起局當下的判斷快照）</div>';
  }
  if(r.prediction.length===0){
    return '<div class="h-pred-note">起局當下判斷：這局整體沒有特別突出的宮位，算是比較平穩的一局。</div>';
  }
  const badge=x=>`<span class="h-badge ${x.isHit?'h-badge-hit':'h-badge-bg'}">${x.isHit?'命中號令':'背景'}</span>`;
  // 這裡的文字全部經過 escHtml：預註冊快照理論上是本專案自己算出來的內容，但也是匯入備份
  // 可以覆蓋的欄位，不能假設它一定乾淨(Codex code review 2026-09-03)。
  const body=r.prediction.map((hp,idx)=>`
    <div class="h-pred-gong">${idx+1}. ${escHtml(t2(hp.gong))}宮</div>
    ${hp.xunlao.map(x=>`<div class="h-pred-line">［荀爽］${escHtml(t2(x.text))}${badge(x)}</div>`).join('')}
    ${hp.mainstream.map(x=>`<div class="h-pred-line">［主流］${escHtml(t2(x.text))}${badge(x)}</div>`).join('')}
  `).join('');
  return `<details class="h-pred"><summary>起局當下的判斷（預註冊，鎖定不可改，共 ${r.prediction.length} 個熱點宮）</summary>${body}</details>`;
}
function renderHistoryPanel(){
  const p=document.getElementById('historyPanel');
  const list=loadHistory();
  const rows=list.map(r=>{
    const reviewed=r.review&&r.review.trim();
    // safeId：只接受有限整數，直接嵌進 onclick="...(${safeId})" 屬性裡不加引號，如果 id
    // 不是乾淨的數字，惡意字串可以直接跳出屬性、插入任意腳本(Codex code review
    // 2026-09-03)。所有其餘文字欄位也都經過 escHtml，雙層防護，不管 sanitizeHistoryRecord
    // 這層有沒有漏網之魚，畫面渲染這一層自己也要對每個欄位負責。
    const safeId=Number.isFinite(Number(r.id))?Number(r.id):0;
    return `
    <div class="h-row">
      <div class="h-row-top">
        <div class="h-row-main" onclick="reloadHistoryRecord(${safeId})">
          <div class="h-row-date">${escHtml(r.dateStr)} ${escHtml(r.timeStr)}
            <span class="h-badge ${reviewed?'h-badge-done':'h-badge-todo'}">${reviewed?'已復盤':'未復盤'}</span>
          </div>
          <div class="h-row-info">${escHtml(t2(r.juLabel||''))} · ${escHtml(t2(r.gz||''))}${r.needKey?(' · 所求：'+escHtml(r.needKey)):''}</div>
          ${r.hitsSummary?`<div class="h-row-hits">${escHtml(t2(r.hitsSummary))}</div>`:''}
        </div>
        <button class="h-row-del" onclick="deleteHistoryRecord(${safeId})" title="刪除">✕</button>
      </div>
      ${renderPredictionSnapshot(r)}
      <div class="h-review">
        <textarea class="h-review-input" id="review_${safeId}" placeholder="事後回看：這局準不準？實際發生了什麼？（用來校對方法論）">${r.review?escHtml(r.review):''}</textarea>
        <button class="h-btn" onclick="saveReview(${safeId})">保存復盤</button>
      </div>
    </div>`;
  }).join('');
  p.innerHTML=`
    <div class="h-toolbar">
      <span>共 ${list.length} 筆記錄（僅存本機瀏覽器）</span>
      <button class="h-btn" onclick="exportHistoryJson()">匯出備份</button>
      <label class="h-btn" style="cursor:pointer">匯入
        <input type="file" accept="application/json" style="display:none" onchange="importHistoryJson(this)">
      </label>
      <button class="h-btn h-btn-danger" onclick="clearHistoryAll()">清空</button>
    </div>
    <div class="h-list">${rows||'<div style="opacity:.6;padding:10px 0">尚無記錄</div>'}</div>`;
}
function saveReview(id){
  const list=loadHistory();
  const rec=list.find(r=>r.id===id);
  if(!rec)return;
  const ta=document.getElementById('review_'+id);
  rec.review=ta?ta.value:'';
  rec.reviewedAt=Date.now();
  saveHistoryList(list);
  renderHistoryPanel();
}
window.saveReview=saveReview;
// 師傅總結「白話版／專業版」切換：兩種都已經渲染好放在 DOM 裡，純粹是顯示/隱藏，
// 不重新計算、不重新排局——切換不會漏掉任何一套內容，兩邊資料來源完全相同。
window.setMasterMode=function(btn,mode){
  const scope=btn.parentElement.parentElement; // .master-toggle 的父層(#result)，同時包住兩種模式的內容
  scope.querySelectorAll('.mt-btn').forEach(b=>b.classList.toggle('mt-active', b.dataset.mode===mode));
  scope.querySelector('.master-mode-plain').style.display = mode==='plain'?'':'none';
  scope.querySelector('.master-mode-pro').style.display = mode==='pro'?'':'none';
};
window.toggleHistory=function(){
  const p=document.getElementById('historyPanel');
  if(p.style.display==='none'){
    renderHistoryPanel();
    p.style.display='block';
    document.getElementById('ritualPanel').style.display='none';
  }else{
    p.style.display='none';
  }
};

/* ── 城市經度快速帶入(2026-08-29 新增：大多數人不知道自己所在地精確經度，直接手動輸入不
   現實，改用常見城市下拉快速帶入，仍保留手動輸入欄位供更精確的地點使用) ──
   經度取城市中心點的概略值，真太陽時校正本身只做到分鐘級，城市級精度已經足夠。 */
const CITY_LONGITUDE=[
  {group:'中國大陸', cities:[
    ['北京','116.40'],['上海','121.47'],['天津','117.20'],['重慶','106.55'],
    ['廣州','113.26'],['深圳','114.06'],['成都','104.06'],['杭州','120.15'],
    ['南京','118.78'],['武漢','114.31'],['西安','108.95'],['蘇州','120.62'],
    ['鄭州','113.65'],['長沙','112.94'],['青島','120.33'],['大連','121.62'],
    ['廈門','118.10'],['瀋陽','123.43'],['哈爾濱','126.53'],['昆明','102.83'],
    ['南寧','108.37'],['濟南','117.00'],['合肥','117.27'],['福州','119.30'],
    ['蘭州','103.83'],['貴陽','106.71'],['南昌','115.86'],['太原','112.55'],
    ['石家莊','114.51'],['烏魯木齊','87.62'],
  ]},
  {group:'港澳台', cities:[
    ['香港','114.17'],['澳門','113.55'],['台北','121.56'],['台中','120.68'],
    ['高雄','120.30'],
  ]},
  {group:'海外常見', cities:[
    ['東京','139.69'],['首爾','126.98'],['新加坡','103.85'],['曼谷','100.50'],
    ['吉隆坡','101.69'],['雪梨','151.21'],['倫敦','-0.13'],['紐約','-74.01'],
    ['洛杉磯','-118.24'],['溫哥華','-123.12'],
  ]},
];
function initCityPreset(){
  const sel=document.getElementById('iCityPreset');
  if(!sel)return;
  CITY_LONGITUDE.forEach(({group,cities})=>{
    const og=document.createElement('optgroup');
    og.label=group;
    cities.forEach(([name,lng])=>{
      const opt=document.createElement('option');
      opt.value=lng;
      opt.textContent=`${name} ${lng}`;
      og.appendChild(opt);
    });
    sel.appendChild(og);
  });
}
function applyCityPreset(){
  const sel=document.getElementById('iCityPreset');
  if(!sel||!sel.value)return;
  document.getElementById('iLongitude').value=sel.value;
}
window.applyCityPreset=applyCityPreset;

/* ── 時間工具 ── */
function pad(n){return String(n).padStart(2,'0');}
function setNow(){
  const n=new Date();
  document.getElementById('iDate').value=`${n.getFullYear()}-${pad(n.getMonth()+1)}-${pad(n.getDate())}`;
  document.getElementById('iTime').value=`${pad(n.getHours())}:${pad(n.getMinutes())}`;
  document.getElementById('iJuType').value='事局';
  updateNeedHint();
}
// 「所求」跟「局類型」是兩個獨立欄位，但命局模式下「所求」的意義不是「問這件事的結果」
// (命局本身不是在問一件事)，而是「決定看這個人的哪個面向」——這個字段依然會影響號令保護
// 哪個意象天干、以及底部出現哪份報告，只是含義換了一層，容易讓人誤以為選錯或忘了改，
// 所以用一行動態提示把這個換算講清楚，而不是隱藏「所求」欄位或改變它的預設值。
function updateNeedHint(){
  const hint=document.getElementById('needHint');
  if(!hint)return;
  const jt=(document.getElementById('iJuType')||{}).value;
  hint.textContent = jt==='命局'
    ? '命局模式下，「所求」不是在問一件事的結果，而是決定要看這個人的哪個面向(財富/事業/桃花…)——會影響號令保護哪個意象天干、下面出現哪份報告，不用因為預設是「求財」而覺得選錯了。'
    : '事局模式下，「所求」就是這次要問的事本身。';
}
window.updateNeedHint=updateNeedHint;
function updHeader(){
  const n=new Date();
  const dw='日一二三四五六'[n.getDay()];
  document.getElementById('hdate').innerHTML=`${n.getFullYear()}.${n.getMonth()+1}.${n.getDate()} 星期${dw}<br>${pad(n.getHours())}:${pad(n.getMinutes())}`;
}
updHeader();setInterval(updHeader,30000);

/* ── 起局 ──
   skipHistory：從歷史記錄「重新載入」時傳 true，代表這不是一次新的起局，只是回看舊記錄，
   不應該再往歷史清單裡多推一筆——不然每點開一筆舊記錄就會多出一筆一模一樣的新記錄，
   長期會把清單洗版、擠掉真正的舊資料(Codex code review 2026-09-03 抓到的問題)。 */
function calc(skipHistory){
  const dv=document.getElementById('iDate').value;
  const tv=document.getElementById('iTime').value;
  if(!dv||!tv){alert('請輸入日期和時間');return;}
  const [y,m,d]=dv.split('-').map(Number);
  const [h,mi]=tv.split(':').map(Number);
  const needKey=document.getElementById('iNeed').value;
  const yearsInput=document.getElementById('iYears').value;
  const juType=document.getElementById('iJuType').value||'事局';
  const industry=(document.getElementById('iIndustrySmall')||{}).value||'';
  const targetWuxing=(document.getElementById('iMonthTarget')||{}).value||'';
  const lonRaw=(document.getElementById('iLongitude')||{}).value;
  const longitude=lonRaw===''||lonRaw===undefined?undefined:Number(lonRaw);
  try{
    const pan=QimenJS.qimenChaibu(Solar,y,m,d,h,mi,longitude);
    renderPan(pan,y,m,d,h,mi,needKey,yearsInput,juType,industry,targetWuxing,lonRaw,skipHistory);
  }catch(e){
    document.getElementById('result').innerHTML=
      `<div class="empty"><div class="big">⚠</div>起局失敗：${e.message}</div>`;
  }
}

/* ── 師傅總結：把 buildMasterSummary() 算好的結構化資料渲染成卡片 ──
   用戶明確要求「主流認為.../荀爽認為...」必須分開標籤，不能融在一起講，所以這裡刻意用
   liuhai-card(紅系，跟解讀二六害卡同色)裝荀爽老師體系的內容、geju-card(紫系，跟解讀一
   格局卡同色)裝主流斷局法的內容，一眼就能分辨這句話是哪套體系說的。 */
function renderMasterSummary(summary, juType){
  const T2=x=>t2(x||'');
  if(summary.quiet){
    return `<div class="master-card">
      <div class="master-title">師傅總結</div>
      <div class="ana-step">這局整體沒有特別突出的宮位——六害/格局/地利/主客/天時/人和都沒有明顯集中在你的號令天干上，算是比較平穩的一局，不用特別緊張哪個方向。</div>
    </div>`;
  }
  const renderCureSteps=(cs)=>{
    if(!cs)return '<div class="ana-step" style="opacity:.7">（化解方法暫缺，需人工覆核）</div>';
    const mx=cs.miexiang?`<div class="ana-step">灭象：${T2(cs.miexiang.action)}${cs.miexiang.verified?'':'（此步驟未見視頻原文明確說明，建議自行覆核）'}</div>`:'';
    // b.verified===false(目前只有「意」「行」兩維會這樣標)代表這一維是 WUXING_YI_XING 的
    // 五行通用推導，不是逐字視頻原文，即使 cs.verified 整體是 true 也要單獨標出來，不能被
    // 上層的驗證狀態蓋過去；b.crossSource(目前是「物」「物(地支)」兩維)代表這一維查的是
    // LEX_DATA(跨資料源交叉核對)，跟上層 cure 選定天干/地支所在的來源不是同一件事，也不能
    // 默默繼承上層「逐字驗證」的標籤(2026-09-06 修正，化解步驟可信度粒度)。
    const bz=(cs.buzhen||[]).map(b=>{
      const note=b.verified===false?'（五行常理推導，非視頻原文，僅供參考）'
        :b.crossSource?'（顏色材質/生肖形象參考跨資料源整理，非此步驟專屬的逐字視頻畫面）':'';
      return `<div class="ana-step">布阵（${T2(b.dimension)}）：${T2(b.text)}${note?`<span style="opacity:.7">${note}</span>`:''}</div>`;
    }).join('');
    // 這裡的「方位」指的是布阵物品/文字實際要擺放的位置(家裡或辦公室的哪個方向角落)，
    // 跟「你本人現實中該不該去這個方向」是兩件不相干的事，容易被誤讀成後者，所以講清楚。
    const placeLine=cs.place?`<div class="ana-step">擺放位置：把布阵的物品/文字放在家裡或辦公室的「${T2(cs.place)}」方位角落——這是物品要擺哪裡，跟你本人要不要去這個方向沒有關係。</div>`:'';
    const verifyNote=cs.verified?'':'<div class="ana-step" style="opacity:.7">（此化解方法為推導，非視頻原文逐字說明，僅供參考）</div>';
    const noteLine=cs.note?`<div class="ana-step" style="opacity:.7">${T2(cs.note)}</div>`:'';
    return mx+bz+placeLine+verifyNote+noteLine||'<div class="ana-step" style="opacity:.7">（化解方法暫缺，需人工覆核）</div>';
  };
  const AGREEMENT_NOTE={
    consistent_xiong:'這一宮兩套體系方向一致，都偏不利——多個獨立算出來的結果指向同一個地方，可信度比單一體系說凶更高。',
    consistent_ji:'這一宮兩套體系方向一致，都偏有利。',
    mixed:'這一宮同時有偏吉跟偏凶的判斷，不是單邊倒——這是這個宮本來就有的複雜面，不是矛盾，不用強行調和成一個結論，你自己感受哪個更準。',
    none:'',
  };
  const hotspotHtml=summary.hotspots.map((h,idx)=>{
    // 命局模式下每一條命中的 cureNote 都是同一句 MINGJU_CURE_NOTE，逐條重複貼一遍會顯得
    // 機械囉唆(2026-08-29 用戶點出的問題)，所以只在整張卡片最後統一講一次，不逐條重複。
    const mingjuNote=h.xunlao.find(x=>x.cureNote)?.cureNote;
    const xunlaoHtml=h.xunlao.length?`<div class="liuhai-card" style="margin-bottom:6px">
        <div class="liuhai-title">荀爽老師體系認為</div>
        ${h.xunlao.map(x=>`<div class="liuhai-sec">
          <div>${T2(x.text)}<span class="hl-badge ${x.isHit?'hl-hit':'hl-bg'}">${x.isHit?'命中號令':'背景'}</span></div>
          ${x.cureNote?'':renderCureSteps(x.cureSteps)}
        </div>`).join('')}
        ${mingjuNote?`<div class="ana-step" style="opacity:.75;margin-top:4px">${T2(mingjuNote)}</div>`:''}
      </div>`:'';
    const mainstreamHtml=h.mainstream.length?`<div class="geju-card" style="margin-bottom:0">
        <div class="geju-title">主流斷局法認為</div>
        ${h.mainstream.map(x=>`<div class="geju-item">
          ${T2(x.text)}<span class="hl-badge ${x.isHit?'hl-hit':'hl-bg'}">${x.isHit?'命中號令':'背景'}</span>
        </div>`).join('')}
        <div class="ana-step" style="opacity:.6;margin-top:6px">（主流斷局法目前沒有對應的化解方法；想知道具體怎麼破解，請看上面荀爽老師體系那部分）</div>
      </div>`:'';
    return `<div class="master-hotspot">
      <div class="master-hotspot-title">${idx+1}. ${T2(h.gong)}宮</div>
      ${AGREEMENT_NOTE[h.agreement]?`<div class="ana-step" style="margin-bottom:6px">${AGREEMENT_NOTE[h.agreement]}</div>`:''}
      ${xunlaoHtml}${mainstreamHtml}
    </div>`;
  }).join('');
  const mingjuIntro=juType==='命局'
    ?'　這是命局模式：下面「命中了什麼」的判斷照樣算給你看，但荀爽老師體系的灭象布阵(具體要擺什麼、放哪裡)這次先不給——那套方法是針對「事局」(問一件具體的事)設計的，命局是你天生的整體結構，硬套具體操作指令會文不對題，遇到這些宮對應的具體麻煩時，建議另外起一個事局來問。'
    :'';
  return `<div class="master-card">
    <div class="master-title">師傅總結</div>
    <div class="ana-step" style="margin-bottom:10px">下面依「這局最該注意的程度」排出最多 3 個宮，每個宮都把主流斷局法跟荀爽老師體系的判斷分開列出，絕不混在一起講。「命中號令」代表這件事直接壓在你自己（日干/時干/值符/所求對應天干）身上，比較要緊；「背景」代表這件事存在於這局，但不是直接衝著你來，程度上輕一些——如果想看完整的逐宮明細，往下滑可以看到兩套體系各自完整的判斷卡片。${mingjuIntro}</div>
    ${hotspotHtml}
  </div>`;
}

/* ── 師傅總結・白話版(2026-08-30 新增) ──
   背景：用戶覺得現有輸出「得有奇門遁甲基礎才看得懂」，拿一份 ChatGPT 生成的命盤分析做對比，
   覺得那種「像真人講話」的口吻、先給結論再展開的段落節奏很好讀。核對過那份分析後發現：它的
   「好讀」是純粹的表達技巧(分段、口語連接詞、類比)，但內容本身有真實問題——用五行生克算反的
   邏輯選「夫星」、把「用神定宮看意象」跟「方位擇吉」混為一談、套用來源不明的坊間標籤(如「丁壬
   合＝淫蕩之合」)、拿單一宮位代表整體財運、後段大量脫離盤面的通用建議(巴納姆效應)。這些問題
   都是「現編了沒查證的規則」，不是表達方式的問題——所以白話版只學表達，不學內容生成方式：
   這裡的每一句話，用的都是 buildMasterSummary() 已經算好、經過測試的 text/cureSteps 原始
   資料，只是換一種更順口的組裝方式(先講結論、用「另外」「不過」這類口語連接詞串起來、把「命中
   號令/背景」翻成白話)，絕不新增判斷、絕不把荀爽體系跟主流體系的結論揉在一起講。 */
// 把 formatCureSteps() 的結構化化解步驟，組成一段順口的話，而不是條列的「灭象：xxx／布阵：xxx」。
// 白話版的兩個渲染函式(逐宮版/命局故事版)共用同一份，用詞保持一致。
function plainCureText(cs){
  const T2=x=>t2(x||'');
  if(!cs)return '化解方法這裡暫時沒查到明確的說法，需要人工再核對一下。';
  const parts=[];
  if(cs.miexiang)parts.push(`第一步先「灭象」：${T2(cs.miexiang.action)}${cs.miexiang.verified?'':'（這步視頻裡沒有明講，僅供參考）'}`);
  if(cs.place)parts.push(`可以把化解用的東西放在家裡或辦公室「${T2(cs.place)}」這個方位角落——這是物品要擺哪裡，跟你本人要不要去這個方向沒有關係`);
  // b.verified===false 是「意」「行」這兩維專屬的標記(五行通用推導，非逐字視頻)；
  // b.crossSource 是「物」「物(地支)」專屬的標記(查的是 LEX_DATA 跨資料源整理，跟上層
  // cure 選定天干/地支的來源不是同一件事)——兩者即使整條 cs.verified 是 true 也要單獨標出來，
  // 見 formatCureSteps() 的說明。
  if(cs.buzhen&&cs.buzhen.length)parts.push(`具體怎麼布：${cs.buzhen.map(b=>{
    const note=b.verified===false?'(此項為五行常理推導，僅供參考)':b.crossSource?'(此項顏色材質參考跨資料源整理)':'';
    return `${T2(b.text)}${note}`;
  }).join('，')}`);
  if(cs.note)parts.push(T2(cs.note));
  if(cs.verified===false)parts.push('（這條化解方法是推導出來的，不是視頻原文逐字講的，僅供參考）');
  return parts.join('；')+'。';
}
// glossItem/domainParagraph 原本只給命局故事卡用，2026-09-06 改造事局白話版(見下方
// renderShijuStoryPlain)時抽成共用——兩邊都是「把財富七要/事業七要/簡明定位讀法裡已驗證的
// 單點符號兜成一段生活面向描述」的同一種組裝方式，不應該各自維護一份重複邏輯。
const glossItem=it=>{const T2=x=>t2(x||''); return (it.role&&it.role!==it.name)?`${T2(it.role)}(${T2(it.name)})`:T2(it.name);};
function domainParagraph(label, items){
  const T2=x=>t2(x||'');
  const positioned=items.filter(it=>it.rows&&it.rows.length);
  const bad=positioned.filter(it=>it.bad===true);
  const clean=positioned.filter(it=>it.bad===false);
  if(!positioned.length)return {text:`${label}方面這局沒有明確的定位資訊，暫時看不出來。`, bad:[], total:0, tier:'weak'};
  let text=`${label}方面，`;
  if(bad.length===0){
    text+=`「${clean.map(glossItem).join('」「')}」這幾個關鍵點位都還算乾淨，沒有明顯卡住的地方。`;
  }else{
    text+=`「${bad.map(glossItem).join('」「')}」這幾個點位命中了六害，需要留意`;
    if(clean.length)text+=`；「${clean.map(glossItem).join('」「')}」倒是乾淨的`;
    text+='。';
  }
  // combo：財富七要/事業七要/簡明定位讀法都是把好幾個已驗證的單點符號兜在一起才推出
  // 這個生活面向的結論，不是單一查表事實，所以標「組合取象」而不是「規則」。
  return {text, bad, total:positioned.length, tier:'combo'};
}
// 三層結構＋置信度標籤：標示每一段話是「查表就有的事實」(rule)、「把幾個已驗證符號的
// 意思兜在一起講」(combo)、還是「跨好幾個面向比出來的推論」(infer/weak)。標籤只是老實
// 講清楚這句話怎麼來的，不是免責聲明——寫的時候還是要對內容本身負責，不能拿標籤當藉口
// 亂寫。四個等級對應 ChatGPT 建議的【規則】【組合取象】【綜合推導】【弱推斷】，
// 【禁止輸出】那一級不會出現在畫面上，是「這種話本來就不該寫」的內部提醒。命局/事局
// 故事卡共用同一份，不各自維護一份重複標籤表。
// 2026-09-06 降視覺權重(用戶朋友(ChatGPT)反饋)：原本每段話都掛一個常駐顯示的彩色文字
// 徽章，視覺權重跟段落內容差不多重；改成預設只顯示一個小圓點(顏色沿用既有分級配色)，
// hover 有 title tooltip 顯示完整說明，點一下/點按才展開成文字標籤——手機沒有 hover，
// 點擊才是主要互動方式。CSS 對應 qimen.html 的 .conf-tag/.conf-dot/.conf-label。
const CONF_TAG={
  rule:['conf-tag-rule','規則','查表就有的事實'],
  combo:['conf-tag-combo','組合取象','把幾個已驗證的符號兜在一起講'],
  infer:['conf-tag-infer','綜合推導','跨好幾個面向比出來的相對判斷(不是鐵律)'],
  weak:['conf-tag-weak','弱推斷','資訊不足只能先這樣講'],
};
function confTag(tier){
  const [cls,label,desc]=CONF_TAG[tier]||CONF_TAG.rule;
  return `<span class="conf-tag ${cls}" onclick="toggleConfTag(this)" title="${label}：${desc}"><span class="conf-dot"></span><span class="conf-label">${label}</span></span>`;
}
function toggleConfTag(el){ el.classList.toggle('conf-open'); }

/* ── 命局白話版・整篇故事(2026-08-30 新增；2026-09 改版) ──
   2026-09 改版背景：用戶陸續拿這張卡對比朋友(ChatGPT)寫的一份自由生成命盤分析，中間經過
   好幾輪來回——先確認舊版「逐條命中六害/乾淨」的講法只是排列資訊、不是解讀；再針對「本人
   特點」重新查證命局測人專屬的方法論(日干落宮的後天八卦象義+同宮門星神收斂成一個主題+
   日干臨地盤干的固定組合)，不是套用事局的六害判斷或物品取象；最後用戶明確拍板一個重要的
   政策轉向：白話版跟專業版走「不完全相同的邏輯」——專業版繼續守住「不腦補、每句可溯源」
   這條線；白話版可以自由一點、讀起來更像真人分析，允許合理的跨符號心理推論(方向要跟符號的
   傳統象義一致)，但仍然不編造具體、無法追溯的人生情節或心理事件(比如「曾經受過情傷」「幾歲
   以後會變得現實」這類斷言)——這是雙方談過的中間地帶，不是完全放開。
   新結構(取代原本「性格→財運事業→感情婚姻→人生波動→怎麼破→總結建議→一句話」七段式)：
   先看結論(開場一句總覽) → 本人特點(日干落宮+同宮組合+日干臨地盤干) → 財運(日干／生門
   落宮生克，checkQiucaiYongshen) → 事業(日干／開門落宮生克，checkShiyeYongshen) →
   感情婚姻(乙／庚落宮生克，既有 checkYiGengMarriage) → 整體(綜合收尾，不重複統計)。
   不再逐條列「命中六害/乾淨」，也不再有「怎麼破」獨立段落——命局本來就不給灭象布阵操作
   指令(這條規則沒變，只是不再用整整一段去解釋「為什�麼沒有」)，完整的六害/格局/主流體系
   明細，切到「專業版」仍然一條不少地看得到，不受這次改版影響。 */
function renderMingjuStoryPlain(pan, sky, door, star, god, zfzs, dayStem, hourStem, needKey, industry, targetWuxing, yearsInput, masterSummary, marriageInfo, kongHitGongs, fuyinFanyinHits){
  const T2=x=>t2(x||'');
  const gz=parseGanzhi(pan.干支);
  const monthZhi=gz?gz.月支:null;
  const dayGong=dayStem?locateStem(sky,dayStem)[0]:null;

  // 本人特點：日干落宮的後天八卦象義(GUA_XIANG，《說卦傳》跨門派共識) + 同宮門/星/神的
  // 已驗證 keyword(LEX_DATA) + 日干臨地盤干的固定組合(getRiganJialinMeaning，目前只有
  // 「日干加壬」查到兩個獨立來源，其餘暫缺就不寫，不硬湊)。「這幾個信號湊在一起偏正面/
  // 偏需要留意」這句綜合判斷，沿用既有 luckClass() 對同宮門/星/神的吉凶分類去統計，不是
  // 另外發明一套新的性格分類器。
  let selfText='';
  if(dayGong){
    const traitInfo=GUA_XIANG[dayGong];
    const traitMatch=traitInfo?traitInfo.trait.match(/^(.)（(.+)）$/):null;
    const traitWord=traitMatch?traitMatch[1]:'', traitDetail=traitMatch?traitMatch[2]:'';
    selfText=`日干「${T2(dayStem)}」落${T2(dayGong)}宮——這一宮在後天八卦裡代表「${T2(traitWord)}」，也就是${T2(traitDetail)}這種底色，這類人給人的第一印象通常帶著這種味道。`;
    const dr=door[dayGong], st=star[dayGong], gd=god[dayGong];
    const drInfo=LEX_DATA.doors[dr], stInfo=LEX_DATA.stars[st], gdInfo=LEX_DATA.gods[gd];
    const symbolParts=[drInfo,stInfo,gdInfo].filter(Boolean);
    if(symbolParts.length){
      selfText+=`同宮的「${symbolParts.map(s=>T2(s.name)).join('」「')}」可以放在一起看：${symbolParts.map(s=>`${T2(s.name)}偏「${T2(s.keyword)}」`).join('；')}。`;
      const lucks=[dr,st,gd].filter(Boolean).map(v=>luckClass(v));
      const jiCount=lucks.filter(l=>l==='pill-ji').length, xiongCount=lucks.filter(l=>l==='pill-xiong').length;
      if(jiCount>xiongCount)selfText+='這幾個信號湊在一起，整體偏向討喜、順的一面。';
      else if(xiongCount>jiCount)selfText+='這幾個信號湊在一起，帶一點需要留意的地方，不是單純順風順水。';
      else selfText+='這幾個信號好壞都有，不是單一面向就能講完的人。';
    }
    const earthAtDayGong=pan.地盤?pan.地盤[dayGong]:null;
    const jialinMeaning=earthAtDayGong?getRiganJialinMeaning(earthAtDayGong):null;
    if(jialinMeaning)selfText+=`另外，「${T2(dayStem)}」這次臨地盤「${T2(earthAtDayGong)}」——傳統上這個組合常被認為${T2(jialinMeaning)}。`;
  }else{
    selfText='這局缺少日干的落宮資訊，本人特點這塊暫時看不出來。';
  }

  // 財運：日干／生門落宮生克 + 生門旺相休囚(checkQiucaiYongshen，見 qimen-rules.js 該
  // 函式上方查證註解)。
  const qc=checkQiucaiYongshen(sky, door, dayStem, monthZhi);
  let wealthText;
  if(qc){
    wealthText=`財運方面，日干「${T2(dayStem)}」落${T2(qc.dayGong)}宮(${T2(qc.dayWx)})，生門(代表財)落${T2(qc.shengmenGong)}宮(${T2(qc.smWx)})——是「${T2(qc.relation)}」的組合，方向${qc.favor==='有利'?'偏有利，付出的心力容易換來回報':(qc.favor==='不利'?'偏不利，容易覺得使不上力':'勢均力敵，不特別偏向哪一邊')}。`;
    if(qc.doorFavor)wealthText+=`不過生門這次本身的旺衰是「${T2(qc.doorState)}」，${qc.doorFavor==='得力'?'力道偏強，算是加分':(qc.doorFavor==='無力'?'力道偏弱，這份判斷要打一點折扣':'不特別旺也不特別弱')}。`;
  }else{
    wealthText='財運方面，這次日干或生門落在中宮，中五寄宮規則各派不同、本專案尚未確認，暫時無法判斷。';
  }

  // 事業：日干／開門落宮生克 + 開門旺相休囚(checkShiyeYongshen)。跟財運不同，這裡的「克」
  // 有方向性含義(日克開門＝本人想離開；開門克日＝單位不想要)，來源本身就這樣區分，照實講。
  const sy=checkShiyeYongshen(sky, door, dayStem, monthZhi);
  let careerText;
  if(sy){
    let favorText;
    if(sy.favor==='有利')favorText='方向偏順，跟所在單位/環境比較合拍，不容易格格不入';
    else if(sy.favor==='本人想離開')favorText='這個組合傳統上偏向「自己想換位置」，比較容易對現在的單位/工作感到不耐煩';
    else if(sy.favor==='單位不想要')favorText='這個組合傳統上偏向「單位這一頭不太想要」，工作上比較容易遇到不被續用或不被重視的狀況';
    else favorText='勢均力敵，不特別偏向哪一邊';
    careerText=`事業方面，日干「${T2(dayStem)}」落${T2(sy.dayGong)}宮(${T2(sy.dayWx)})，開門(代表單位)落${T2(sy.kaimenGong)}宮(${T2(sy.kmWx)})——是「${T2(sy.relation)}」的組合，${favorText}。`;
    if(sy.doorFavor)careerText+=`開門本身這次的旺衰是「${T2(sy.doorState)}」，${sy.doorFavor==='得力'?'現在比較有力，算是加分':(sy.doorFavor==='無力'?'現在比較沒勁，這份判斷要打一點折扣':'不特別旺也不特別弱，算是平常狀態')}。`;
  }else{
    careerText='事業方面，這次日干或開門落在中宮，中五寄宮規則各派不同、本專案尚未確認，暫時無法判斷。';
  }

  // 感情婚姻：乙／庚落宮生克(既有 checkYiGengMarriage)，跟改版前內容相同，只是拿掉了
  // confTag、拿掉了跟求桃花簡明定位讀法重複的「有沒有機會」那一段(專業版仍然完整保留)。
  let marriageText='';
  if(marriageInfo){
    const {yiGong, gengGong, favor, isJi, yiLuck, gengLuck}=marriageInfo;
    const yiKong=(kongHitGongs||[]).includes(yiGong), gengKong=(kongHitGongs||[]).includes(gengGong);
    const hasFuyinFanyin=(fuyinFanyinHits||[]).length>0;
    marriageText=`感情婚姻方面，乙(代表女方)落${T2(yiGong)}宮，庚(代表男方)落${T2(gengGong)}宮——是「${T2(favor)}」的方向，${isJi?'整體偏和睦':'需要多留意磨合'}。`;
    if(yiKong)marriageText+='女方這一側還逢旬空，感情或婚姻容易有虛浮不實的感覺。';
    if(gengKong)marriageText+='男方這一側還逢旬空，感情或婚姻容易有虛浮不實的感覺。';
    if(hasFuyinFanyin)marriageText+='這局整體還逢伏吟反吟，變動性也要一併考慮。';
    const luckWords=lk=>[lk.doorJi&&'吉門',lk.starJi&&'吉星',lk.godJi&&'吉神'].filter(Boolean);
    const yiWords=luckWords(yiLuck), gengWords=luckWords(gengLuck);
    if(yiWords.length)marriageText+=`另外，女方這一側額外還有${yiWords.join('、')}，算是加分項，不直接等於整體變好。`;
    if(gengWords.length)marriageText+=`男方這一側額外還有${gengWords.join('、')}，算是加分項，不直接等於整體變好。`;
  }else{
    marriageText='感情婚姻方面，這次乙或庚落在中宮，中五寄宮規則各派不同、本專案尚未確認，暫時無法判斷。';
  }

  // 整體：把上面四塊的方向(有利/不利)統計起來，收一段話——這是跨面向的相對判斷(infer)，
  // 不是重複列六害命中細節，也不編一個新的心理學結論。
  const favorFlags=[qc&&qc.isJi, sy&&sy.isJi, marriageInfo&&marriageInfo.isJi];
  const domainCount=favorFlags.filter(f=>f!==undefined&&f!==null).length;
  const favorCount=favorFlags.filter(Boolean).length;
  let overallText='把這幾塊放在一起看，';
  if(domainCount===0)overallText+='這局的財運/事業/婚姻用神大多落在中宮，暫時看不出明顯的傾向。';
  else if(favorCount===domainCount)overallText+='財運、事業、感情這幾塊方向都偏順，只是各自可能還沒到最旺的火候，需要一點耐心。';
  else if(favorCount===0)overallText+='財運、事業、感情這幾塊目前方向都偏卡，需要多花心思調整，不是天生的優勢面。';
  else overallText+='財運、事業、感情這幾塊有的順、有的卡，不是一路到底的順或不順，各自的狀況上面已經分開講清楚。';

  return `<div class="master-card">
    <div class="master-title">師傅總結</div>
    <div class="plain-p" style="opacity:.6;margin-bottom:10px;font-size:12px">下面是白話版——用比較口語、帶一點推論的方式講這個人整體大概是什麼樣，讀起來會比逐條列數據活潑一些；如果想看每一句話嚴格對應哪個規則、哪個來源，切到「專業版」，那邊完整保留逐宮、逐規則的明細，不會因為這裡寫得活潑就少了什麼。</div>
    <div class="plain-block"><div class="plain-gong">本人特點</div><div class="plain-p">${selfText}</div></div>
    <div class="plain-block"><div class="plain-gong">財運</div><div class="plain-p">${wealthText}</div></div>
    <div class="plain-block"><div class="plain-gong">事業</div><div class="plain-p">${careerText}</div></div>
    <div class="plain-block"><div class="plain-gong">感情婚姻</div><div class="plain-p">${marriageText}</div></div>
    <div class="plain-block" style="border-bottom:none"><div class="plain-gong">整體</div><div class="plain-p">${overallText}</div></div>
  </div>`;
}

/* ── 事局白話版・整篇故事(2026-09-06 新增，取代舊版逐宮列表 renderMasterSummaryPlain) ──
   背景：命局故事卡(renderMingjuStoryPlain)上線後，事局的白話版一直維持逐宮條列的舊結構
   (「來看X宮這邊」逐個講)，跟命局故事卡的讀故事節奏不一致，是明確留下的待辦事項。這裡不是
   把命局那套「性格→財運→事業→感情→人生波動」照搬過來——命局在問「這個人整體是什麼樣」，
   套用全部人生面向合理；事局只問「一件具體的事」，套同一套結構會文不對題(跟當初拆出命局
   專屬結構的理由完全對稱)。改成事局自己的敘事骨架：
     ①這件事目前的狀態(日干=本質/時干=表象，跟命局①同一組資料，只是換框架成「事」不是「人」)
     ②針對這次「所求」的核心讀局(只跑所求對應的那一個面向，不是命局那樣四個面向全展開)
     ③有沒有踩到雷(六害命中，跟命局④同一段邏輯)
     ④怎麼破(事局的重點——這裡跟命局最大的不同：事局可以給完整灭象布阵操作步驟，不用
       MINGJU_CURE_NOTE 擋掉)
     ⑤整體怎麼樣　⑥一句話概括
   每一句話仍然對應到既有已測試函式的輸出，不新增判斷方法論。 */
function renderShijuStoryPlain(pan, sky, door, star, god, zfzs, dayStem, hourStem, needKey, industry, targetWuxing, yearsInput, masterSummary, marriageInfo, kongHitGongs, fuyinFanyinHits){
  const T2=x=>t2(x||'');
  if(masterSummary.quiet){
    return `<div class="master-card">
      <div class="master-title">師傅總結</div>
      <div class="plain-p">${confTag('rule')}這局整體挺平穩的——六害、格局、地利、主客、天時、人和，沒有哪個特別揪著你，可以按原計劃推進，不用特別緊張哪個方向。</div>
    </div>`;
  }

  // ① 這件事目前的狀態：日干＝這件事的本質，時干＝這件事目前呈現出來的表象，跟命局①
  // 用的是同一組 LEX_DATA 取象描述，只是開場白換成「事」的框架，不是「人」的框架。
  const locateStemGong=(stem)=>{
    if(!stem)return null;
    for(const g of Object.keys(sky)){ if(sky[g]===stem)return g; }
    return null;
  };
  const frameLine=(label, stem)=>{
    if(!stem)return '';
    const g=locateStemGong(stem);
    if(!g)return `${label}干「${T2(stem)}」在天盤上沒有直接找到對應宮位（如果是「甲」，因為甲永遠藏在值符背後、不直接現於天盤，這是正常的，看值符落宮即可）。`;
    if(g==='中')return `${label}干「${T2(stem)}」落在中宮——中宮本身不單獨排門/星/神，中五寄宮規則各派不同、本專案尚未確認查清楚(跟 checkDili/checkYiGengMarriage 等其他模組遇到中宮時的處理方式一致)，這裡不代替你猜是哪一宮，需要人工判斷。`;
    const dr=door[g], st=star[g], gd=god[g];
    const doorInfo=LEX_DATA.doors[dr], starInfo=LEX_DATA.stars[st], godInfo=LEX_DATA.gods[gd];
    const names=[doorInfo?.name, starInfo?.name, godInfo?.name].filter(Boolean).map(T2).join('、');
    const descs=[doorInfo?.desc, starInfo?.desc, godInfo?.desc].filter(Boolean).map(T2).join(' ');
    return `${label}干「${T2(stem)}」落在<b>${T2(g)}宮</b>——這宮是${names}，${descs}`;
  };
  const dLine=frameLine('本質(日)', dayStem), hLine=frameLine('表象(時)', hourStem);
  const stateText=[dLine,hLine].filter(Boolean).join(' ')||'這局缺少日干/時干資訊，這件事目前的狀態暫時看不出來。';
  const stateTier=(dLine||hLine)?'rule':'weak';

  // ② 針對這次「所求」的核心讀局：只跑所求對應的那一個面向，不像命局那樣四個面向全展開——
  // 事局問的是一件事，不是整個人生。needKey 落在哪個既有分析方法，決定這裡怎麼讀：
  // 財富七要/事業七要有專屬完整方法；求權威/表現/情感/突破/事業/桃花有簡明定位讀法；
  // 「求財」(預設所求)原本沒有對應的深度方法，2026-09 補上求財用神(checkQiucaiYongshen，
  // 日干／生門落宮生克+生門旺相休囚，見 qimen-rules.js 該函式上方查證註解)；其餘所求若真的
  // 沒有對應方法，仍老實講清楚，不硬湊一個。
  let focusP;
  if(needKey==='財富七要'){
    focusP=domainParagraph('財運', analyzeWealthSeven(pan, {industry, targetWuxing: targetWuxing||null}).items);
  }else if(needKey==='事業七要'){
    focusP=domainParagraph('事業', analyzeCareerSeven(pan, zfzs, {industry}).items);
  }else if(SIMPLE_LOCATE_DEFS[needKey]){
    const locate=analyzeSimpleLocate(pan, needKey, zfzs);
    focusP=domainParagraph(T2(needKey).replace(/^求/,''), locate.items);
  }else if(needKey==='求財'){
    const gzQc=parseGanzhi(pan.干支);
    const qc=gzQc?checkQiucaiYongshen(sky, door, dayStem, gzQc.月支):null;
    if(qc){
      let text=`財運方面，日干「${T2(dayStem)}」落${T2(qc.dayGong)}宮、生門(財)落${T2(qc.shengmenGong)}宮，兩宮五行是「${T2(qc.relation)}」，方向上${qc.favor==='有利'?'偏有利':(qc.favor==='不利'?'偏不利':'勢均力敵，不分高下')}。`;
      if(qc.doorFavor)text+=`另外生門這次的旺衰是「${T2(qc.doorState)}」，${qc.doorFavor==='得力'?'現在比較有力':(qc.doorFavor==='無力'?'現在比較沒勁':'不特別旺也不特別弱')}。`;
      const notFavorable=!qc.isJi||qc.doorFavor==='無力';
      focusP={text, bad:notFavorable?[qc]:[], total:1, tier:'combo'};
    }else{
      focusP={text:'財運方面，這次日干或生門落在中宮，中五寄宮規則各派不同、本專案尚未確認，暫時無法判斷；如果想看更完整的財運面向，可以切到上面「所求」選單選「財富七要」重新起局。', bad:[], total:0, tier:'weak'};
    }
  }else{
    focusP={text:`「所求」目前是「${T2(needKey)}」，這個選項沒有專屬的深度讀局方法(想看具體的財運判斷可以切到上面「所求」選單選「財富七要」重新起局)，下面直接看六害命中跟怎麼破。`, bad:[], total:0, tier:'weak'};
  }
  // 求桃花時額外補一段婚姻用神(已經有對象/已婚的相處方向)，跟簡明定位讀法(有沒有機會)
  // 回答的是不同問題，都留著；其餘所求不主動帶出婚姻話題，避免答非所問。
  let marriageText='', marriageTier='combo';
  if(needKey==='求桃花'&&marriageInfo){
    const {yiGong, gengGong, favor, isJi, yiLuck, gengLuck}=marriageInfo;
    const yiKong=(kongHitGongs||[]).includes(yiGong), gengKong=(kongHitGongs||[]).includes(gengGong);
    const hasFuyinFanyin=(fuyinFanyinHits||[]).length>0;
    marriageText=`另外，如果問的是已經有對象或已婚的相處狀況（奇門固定用天盤乙代表女方、庚代表男方，這跟上面桃花旺不旺是兩件事）：目前${T2(favor)}${isJi?'，方向上偏和睦':'，方向上要多留意磨合'}。`;
    if(yiKong)marriageText+='女方這一側還逢旬空，感情或婚姻容易有虛浮不實的感覺。';
    if(gengKong)marriageText+='男方這一側還逢旬空，感情或婚姻容易有虛浮不實的感覺。';
    if(hasFuyinFanyin)marriageText+='這局整體還逢伏吟反吟，變動性也要一併考慮。';
    const luckWords=lk=>[lk.doorJi&&'吉門',lk.starJi&&'吉星',lk.godJi&&'吉神'].filter(Boolean);
    const yiWords=luckWords(yiLuck), gengWords=luckWords(gengLuck);
    if(yiWords.length)marriageText+=`女方這一側額外還有${yiWords.join('、')}，算是加分項，但不直接等於婚姻整體變好。`;
    if(gengWords.length)marriageText+=`男方這一側額外還有${gengWords.join('、')}，算是加分項，但不直接等於婚姻整體變好。`;
  }

  // ③ 有沒有踩到雷：跟命局④同一段邏輯，取全部8個外宮「命中號令」的六害條目，合併成一段話
  // 不逐宮分段。2026-09-06 修正(同命局④，用戶朋友(ChatGPT)覆核抓到)：改成掃
  // masterSummary.allProfiles(全部8宮)，不能只看 hotspots(前3熱點)，否則會漏掉沒排進
  // 前3、但確實命中六害的宮，「怎麼破」也會跟著漏掉對應的化解步驟。
  const wanderHits=[];
  masterSummary.allProfiles.forEach(hp=>{
    hp.xunlao.filter(x=>x.isHit).forEach(x=>wanderHits.push({...x, gong:hp.gong}));
  });
  const wanderText=wanderHits.length===0
    ?'目前盤面上刑墓庚虎迫空這幾種波動，沒有直接命中這件事，算是比較平穩的狀態。'
    :'具體來看，這件事容易卡住、不順的地方有：'+wanderHits.map(x=>`${T2(x.gong)}宮這邊，${T2(x.text)}`).join('；')+'。';
  const wanderTier='rule';

  // ④ 怎麼破：這是事局白話版跟命局白話版最大的不同——事局可以給完整灭象布阵操作步驟，
  // 不需要像命局那樣統一改成 MINGJU_CURE_NOTE。逐條沿用既有 plainCureText()。
  const cureText=wanderHits.length===0
    ?'目前沒有需要特別處理的地方，維持現狀就好。'
    :wanderHits.map(x=>`${T2(x.gong)}宮：${plainCureText(x.cureSteps)}`).join(' ');
  const cureTier='rule';

  // ⑤ 整體怎麼樣：有明確所求分析時，拿「所求」跟「人生波動」兩塊一起看；沒有的話只看波動。
  let overallText;
  if(focusP.total>0){
    const ratio=(focusP.total-focusP.bad.length)/focusP.total;
    overallText=ratio===1
      ?'這次所求對應的關鍵點位都還算乾淨，'
      :`這次所求對應的關鍵點位裡有 ${focusP.bad.length}／${focusP.total} 個命中六害，`;
    overallText+=wanderHits.length>0?`加上人生波動這塊命中了 ${wanderHits.length} 處，具體處理方式看上面「怎麼破」那段。`:'人生波動這塊目前沒有命中，整體算是相對平穩。';
  }else{
    overallText=wanderHits.length>0
      ?`人生波動這塊（刑墓庚虎迫空）目前命中了 ${wanderHits.length} 處，具體處理方式看上面「怎麼破」那段。`
      :'人生波動這塊（刑墓庚虎迫空）目前沒有命中，算是相對平穩。';
  }
  const overallTier='infer';

  // ⑥ 一句話概括：純數字統計，不夾帶心理學式的性格判斷。
  const totalBad=focusP.bad.length+wanderHits.length;
  const totalAll=focusP.total+wanderHits.length;
  const oneLinerTier=totalAll===0?'weak':'infer';
  const oneLiner=totalAll===0
    ?'這局資訊不足，暫時無法給出一句話概括。'
    :(totalBad===0
      ?'一句話概括：目前掃過的部分都還算乾淨，沒有特別需要緊張的地方。'
      :`一句話概括：這局命中六害的訊號集中在${[focusP.bad.length>0?'所求對應的面向':'',wanderHits.length>0?'人生波動':''].filter(Boolean).join('、')}，其餘部分相對平穩，具體怎麼處理可以看上面「怎麼破」那段。`);

  return `<div class="master-card">
    <div class="master-title">師傅總結</div>
    <div class="plain-p" style="opacity:.7;margin-bottom:4px">下面把這局拆成幾段來講事局的白話版——這件事目前的狀態、針對所求的讀局、有沒有踩雷、怎麼破，一路讀下去就好，不用先懂術語。這裡主流斷局法跟荀爽老師體系的判斷不特別分開標註，兩邊揉在一起講；如果想看兩套體系嚴格分開、逐宮完整的版本，切到「專業版」。</div>
    <div class="plain-p" style="opacity:.55;font-size:12px;margin-bottom:10px">每段話前面的小標籤是老實告訴你這句話怎麼來的：${confTag('rule')}查表就有的事實、${confTag('combo')}把幾個已驗證的符號兜在一起講、${confTag('infer')}跨好幾個面向比出來的相對判斷(不是鐵律)、${confTag('weak')}資訊不足只能先這樣講。標籤不是免責聲明，只是讓你自己判斷要多當真。</div>
    <div class="plain-block"><div class="plain-gong">這件事目前是什麼狀態</div><div class="plain-p">${confTag(stateTier)}${stateText}</div></div>
    <div class="plain-block"><div class="plain-gong">針對這次所求的讀局</div><div class="plain-p">${confTag(focusP.tier)}${focusP.text}</div>${marriageText?`<div class="plain-p">${confTag(marriageTier)}${marriageText}</div>`:''}</div>
    <div class="plain-block"><div class="plain-gong">有沒有踩到雷</div><div class="plain-p">${confTag(wanderTier)}${wanderText}</div></div>
    <div class="plain-block"><div class="plain-gong">怎麼破</div><div class="plain-p">${confTag(cureTier)}${cureText}</div></div>
    <div class="plain-block"><div class="plain-gong">整體怎麼樣</div><div class="plain-p">${confTag(overallTier)}${overallText}</div></div>
    <div class="plain-block" style="border-bottom:none"><div class="plain-p" style="font-weight:700">${confTag(oneLinerTier)}${oneLiner}</div></div>
  </div>`;
}

/* ── 渲染盤面 ── */
function renderPan(pan,y,m,d,h,mi,needKey,yearsInput,juType,industry,targetWuxing,longitudeInput,skipHistory){
  needKey=needKey||'求財';
  juType=juType||'事局';
  const sky=pan.天盤||{}, earth=pan.地盤||{};
  const door=pan.門||{}, star=pan.星||{}, god=pan.神||{};
  const zfzs=pan.值符值使||{};
  const zfGong=zfzs.值符星宮?zfzs.值符星宮[1]:'';
  const zsGong=zfzs.值使門宮?zfzs.值使門宮[1]:'';
  const kong=pan.旬空||{};
  const kongZhi=((kong.日空||'')+(kong.時空||'')); // 地支合集

  // 全星/門/神的繁體對應 (library輸出已是繁體, 但防萬一過一遍)
  const T2=x=>t2(x||'');

  /* 六害檢測: 刑/墓/庚 (固定查表或直查) + 虎 (八神查值) + 迫 (動態計算) + 空 (見下方 kongGongMap) */
  const jixingHits=checkJiXing(sky);
  const rumuHits=checkRuMu(sky);
  const menpoHits=checkMenPo(door);
  const gengHits=checkGeng(sky);
  const baihuHits=checkBaiHu(god);
  const gejuHits=checkMainstreamGeju(sky, earth);
  const sanzhaWujiaHits=checkSanzhaWujia(sky, door, god);
  const diliHits=checkDili(sky, earth);
  const zhukeHits=checkZhuke(sky, earth);
  const gzForTianshi=parseGanzhi(pan.干支);
  const tianshiHits=checkTianshi(star, gzForTianshi && gzForTianshi.月支);
  const renheHits=checkRenhe(door);
  const fuyinFanyinHits=checkFuyinFanyin(star, door);
  const marriageInfo=checkYiGengMarriage(sky, door, star, god);

  /* 號令: 日時/生年/意象/符使 四要素合併的保護天干集合 */
  const zhifuStem=zfzs.值符天干?zfzs.值符天干[1]:null;
  const protectedStems=buildProtectedStems(pan.干支, yearsInput, needKey, zhifuStem);
  const hasProtected=protectedStems.size>0;
  const masterSummary=buildMasterSummary(pan, protectedStems, needKey, juType);
  const yimaHits=checkYima(pan, sky, protectedStems);
  // 已經在師傅總結卡列出來過的宮，下面「解讀一」各張明細卡遇到同一個宮的資料時改用精簡格式，
  // 避免整段解釋文字重複兩遍(2026-08-29 用戶要求：把重複說明的內容進行刪減)。
  const hotspotGongs=new Set(masterSummary.hotspots.map(h=>h.gong));
  const seenNote='<span style="opacity:.55;font-size:10px">（同上方師傅總結，此處從簡）</span>';
  // 「命中號令」永遠直接顯示；「背景」條目(既非熱點宮、也沒命中號令)預設收進 <details>折疊，
  // 避免一個宮位大部分是背景資訊時，真正要緊的命中號令被淹沒(2026-08-29 用戶提出的檢視項目)。
  function renderWithBgCollapse(items, rowHtml){
    const always=items.filter(h=>hotspotGongs.has(h.gong)||h.isHit);
    const bg=items.filter(h=>!hotspotGongs.has(h.gong)&&!h.isHit);
    const bgHtml=bg.map(rowHtml).join('');
    return always.map(rowHtml).join('')+(bg.length?`<details class="bg-collapse"><summary>展開其餘 ${bg.length} 條背景資訊（沒有直接命中你）</summary>${bgHtml}</details>`:'');
  }

  /* 值符/值使宮判斷 (中宮值符寄坤) */
  const realZfGong=zfGong==='中'?'坤':zfGong;
  const realZsGong=zsGong==='中'?'坤':zsGong;

  /* 旬空宮位對照: 把「日空/時空」的地支拆開, 透過固定配支表查出對應宮位 */
  const kongGongMap={}; // gong -> ['日空'] / ['時空'] / ['日空','時空']
  function markKong(zhiStr,label){
    if(!zhiStr)return;
    for(const zhi of zhiStr){
      const g=ZHI_TO_GONG[zhi];
      if(!g)continue;
      (kongGongMap[g]=kongGongMap[g]||[]).push(label);
    }
  }
  markKong(kong.日空,'日');
  markKong(kong.時空,'時');
  // 空亡命中宮位 (只取有旬空標記的宮, 排除中宮) —— 提到外層讓摘要卡和明細卡共用
  const kongHitGongs=Object.keys(kongGongMap).filter(g=>g!=='中');

  /* ══ 把六害/主流格局的命中資訊，跟九宮格上每個可點符號的取象彈窗串起來 ══
     目的：點某宮的天干/門/星/神/宮位時，彈窗除了講這個符號本身的意思，還順便告訴使用者
     「這個符號在這一局正好命中了什麼、要不要緊、怎麼化解」，不用另外滑到下面的六害說明卡才看得到。
     這裡按「跟哪個符號有關」把每宮的命中資訊分類、事先組好 HTML，存進 window.CURRENT_GONG_HITS，
     openSheet() 依 kind/role 取對應那一份插入彈窗。不新增任何判斷方法論，純粹是把上面已經算好
     的 jixingHits/rumuHits/gengHits/baihuHits/menpoHits/kongGongMap/gejuHits 重新組織一次。 */
  const HAI_WORD_CLASS={刑:'lh-xing',墓:'lh-mu',庚:'lh-geng',虎:'lh-hu',迫:'lh-po',空:'lh-kong'};
  const HAI_MEANING={刑:'爭執損耗',墓:'沉溺迷失',庚:'凶禍阻隔',虎:'快速危險',迫:'壓力脅迫',空:'虛假不實'};
  // 用戶朋友(ChatGPT)覆核 2026-09-06 批次2 修正時抓到的漏改：點符號彈窗(openSheet，資料來源
  // 就是這裡的 cureBrief/menpoBrief)當時完全沒檢查 juType，命局模式下彈窗仍會印出「灭象後
  // 放到...方位」「用「乙」，放高處」這類具體事局才該有的操作指令，跟同一批已經改好的六害
  // 說明卡/財富七要報告/本局解讀narrative不一致——這裡補上同一條規則：命局模式不給具體
  // 化解文字，改成每個彈窗區塊統一補一次 MINGJU_CURE_NOTE。
  const isMingju=juType==='命局';
  // 精簡版化解摘要，措辭跟下面完整六害說明卡的 cureLine 對齊，只是縮成一行，方便塞進彈窗
  function cureBrief(cure){
    if(isMingju)return '';
    if(!cure)return '';
    const isKong=cure.hai==='空';
    const placeLine=cure.place
      ?(isKong?`這個空亡宮自己對應的方位是「${cure.place}」，缺啥補啥就去這裡補放`
              :`無腦法：灭象後放到「${cure.place}」方位`)
      :'';
    const noteTxt=cure.note?`（${T2(cure.note)}）`:'';
    const x=cure.xiang;
    if(!x)return (placeLine?`化解：${placeLine}${noteTxt}`:(cure.method?`化解：${cure.method}${noteTxt}`:''));
    const detail=`${cure.place&&!isKong?'（進階）':''}${cure.method}：用「${x.stem}」，放${x.placement||'高處'}`;
    return `化解：${placeLine?placeLine+'；':''}${detail}${noteTxt}`;
  }
  function menpoBrief(cure){
    if(isMingju)return '';
    if(!cure)return '';
    return `化解：用合，擺放「${cure.doorsText}」門象、對應地支「${cure.branchesText}」`;
  }
  const gongHitHtml={};
  GRID_ORDER.forEach(gua=>{
    if(gua==='中'){gongHitHtml[gua]={all:'',sky:'',earth:'',door:'',god:'',star:''};return;}
    const parts=[]; // {type,label,isHit,cureHtml,rel:[哪些符號種類跟這條有關]}
    if(jixingHits[gua]){
      const st=jixingHits[gua];
      parts.push({type:'刑',label:`${T2(st)}擊刑`,isHit:protectedStems.has(st),
        cureHtml:cureBrief(getCureForJiXing(gua,st)),rel:['sky']});
    }
    if(rumuHits[gua]){
      const st=rumuHits[gua];
      parts.push({type:'墓',label:`${T2(st)}入墓`,isHit:protectedStems.has(st),
        cureHtml:cureBrief(getCureForRuMu(gua,st)),rel:['sky']});
    }
    if(gengHits[gua]){
      parts.push({type:'庚',label:'天干庚',isHit:protectedStems.has('庚'),
        cureHtml:cureBrief(getCureForGengOrHu(gua,'庚')),rel:['sky']});
    }
    if(baihuHits[gua]){
      parts.push({type:'虎',label:'白虎',isHit:gongHitsProtected(gua,sky,earth,protectedStems),
        cureHtml:cureBrief(getCureForGengOrHu(gua,'虎')),rel:['god']});
    }
    if(menpoHits[gua]){
      const dr=menpoHits[gua];
      parts.push({type:'迫',label:`${T2(dr)}門迫`,
        isHit:gongHitsProtected(gua,sky,earth,protectedStems)||dr===zfzs.值使門宮?.[0],
        cureHtml:menpoBrief(getCureForMenPo(gua)),rel:['door']});
    }
    if(kongGongMap[gua]){
      parts.push({type:'空',label:`空亡（${kongGongMap[gua].join('')}空）`,isHit:true,
        cureHtml:cureBrief(getCureForKongWang(gua,needKey)),rel:['sky','earth','door','god','star']});
    }
    gejuHits.filter(h=>h.gong===gua).forEach(h=>{
      parts.push({type:'格',label:`${T2(h.name)}（${T2(h.luck)}格）`,isHit:true,
        cureHtml:h.caveat?T2(h.caveat):'',rel:['sky','earth']});
    });

    const renderParts=(rel)=>{
      const list=rel?parts.filter(p=>p.rel.includes(rel)):parts;
      if(!list.length)return '';
      const hasHaiType=list.some(p=>p.type!=='格');
      return `<div style="margin-top:8px;padding-top:8px;border-top:1px dashed #E5D5A8">
        <div style="font-size:10px;color:var(--sub);margin-bottom:4px;letter-spacing:1px">這一宮這局命中</div>
        ${list.map(p=>p.type==='格'
          ?`<div class="cure-line" style="margin-top:4px">
              <span class="pill ${p.label.includes('吉')?'pill-ji':'pill-xiong'}">格局</span>
              <b>${p.label}</b>${p.cureHtml?`<div style="margin-top:3px;opacity:.8">${p.cureHtml}</div>`:''}
            </div>`
          :`<div class="cure-line" style="margin-top:4px">
              <span class="lh-word ${HAI_WORD_CLASS[p.type]}">${T2(p.type)}</span>
              <b>${p.label}</b>——${HAI_MEANING[p.type]}
              <span class="hl-badge ${p.isHit?'hl-hit':'hl-bg'}">${p.isHit?'命中號令':'背景凶象'}</span>
              ${p.cureHtml?`<div style="margin-top:3px">${p.cureHtml}</div>`:''}
            </div>`
        ).join('')}
        ${isMingju&&hasHaiType?`<div class="cure-line" style="margin-top:6px;opacity:.7;font-size:11px">${T2(MINGJU_CURE_NOTE)}</div>`:''}
      </div>`;
    };
    gongHitHtml[gua]={all:renderParts(null),sky:renderParts('sky'),earth:renderParts('earth'),
      door:renderParts('door'),god:renderParts('god'),star:renderParts('star')};
  });
  window.CURRENT_GONG_HITS=gongHitHtml;

  /* 日干/時干拆解 (供「事局/命局」雙重解讀用):
     來源：荀爽老師視頻截圖——同一組日干時干可以同時看「事局」(日干=此事實質，時干=此事表象)
     跟「命局」(日干=此人內心，時干=此人外在)，兩種解讀並存，不是起局時的另一個選項。 */
  const gzMatch=(pan.干支||'').match(/^(.)(.)年(.)(.)月(.)(.)日(.)(.)時$/);
  const dayStem=gzMatch?gzMatch[5]:null, hourStem=gzMatch?gzMatch[7]:null;

  /* 九宮格格子 */
  function renderCell(gua){
    const s=sky[gua]||'', e=earth[gua]||'';
    const dr=door[gua]||'', st=star[gua]||'', gd=god[gua]||'';
    const isZf=gua===realZfGong;
    const isZs=gua===realZsGong;
    const isCenter=gua==='中';
    const isJx=!!jixingHits[gua];
    const isRm=!!rumuHits[gua];
    const isMp=!!menpoHits[gua];
    const isHu=!!baihuHits[gua];
    const kongLabels=kongGongMap[gua]||[];
    const isKw=kongLabels.length>0;

    let cls='cell';
    if(isCenter)cls+=' center-cell';
    if(isZf&&!isCenter)cls+=' is-zf';
    if(isZs&&!isCenter&&!isZf)cls+=' is-zs';

    const guaName=GUA_NAME[gua]||gua;
    const guaDir=GUA_DIR[gua]||'';
    // 天干顏色 class：嚴格對齊六害配色——擊刑紅／入墓藍／庚金黃，優先度 刑>墓>庚，其餘不上色(預設)
    const skyCls=isJx?' jixing':(isRm?' rumu':(s==='庚'?' geng-stem':''));
    // 門/星/神顯示用稍完整的名字（門: X門；星: 天X，省略「星」字；神: 完整名如玄武/九天），
    // 宮跟干維持單字不變。從 LEX_DATA 的 .name 取，不再硬拼免得跟之前一樣拼錯字。
    const doorDisp=dr?(LEX_DATA.doors[dr]?LEX_DATA.doors[dr].name:dr):'';
    const starDisp=st?(LEX_DATA.stars[st]?LEX_DATA.stars[st].name.replace(/星$/,''):st):'';
    const godDisp=gd?(LEX_DATA.gods[gd]?LEX_DATA.gods[gd].name:gd):'';

    return `<div class="${cls}">
      ${guaDir?`<div class="cell-dir">${guaDir}</div>`:''}
      ${kongLabels.length?`<div class="c-kong">空${kongLabels.join('')}</div>`:''}
      <div class="c-line c-line-top">
        ${s?`<span class="c-sky term${skyCls}" onclick="openSheet('stem','${s}','${gua}','sky')">${T2(s)}</span>`:'<span class="c-sky dim">—</span>'}
        ${!isCenter&&gd?`<span class="c-god-val term${isHu?' baihu':''}" onclick="openSheet('god','${gd}','${gua}')">${T2(godDisp)}</span>`:''}
      </div>
      ${!isCenter&&dr?`<div class="c-door-line"><span class="c-door-val term${isMp?' menpo':''}" onclick="openSheet('door','${dr}','${gua}')">${T2(doorDisp)}</span></div>`:''}
      <div class="c-line c-line-bottom">
        ${e?`<span class="c-earth term" onclick="openSheet('stem','${e}','${gua}','earth')">${T2(e)}</span>`:''}
        ${!isCenter&&st?`<span class="c-star-val term" onclick="openSheet('star','${st}','${gua}')">${T2(starDisp)}</span>`:''}
      </div>
      ${isZf?'<div class="c-special zf-tag">值符</div>':''}
      ${isZs&&!isZf?'<div class="c-special zs-tag">值使</div>':''}
      <div class="cell-gua${isKw?' kongwang':''}${isCenter?'':' term'}"${isCenter?'':` onclick="openSheet('gua','${gua}','${gua}')"`}>${guaName}</div>
    </div>`;
  }

  const gridHTML=GRID_ORDER.map(renderCell).join('');

  /* 局資訊 */
  const juLabel=T2(pan.排局||'');
  const gz=T2(pan.干支||'');
  const jq=T2(pan.節氣||'');
  const xunShou=T2(pan.旬首||'');
  const rikong=T2(kong.日空||'—');
  const shikong=T2(kong.時空||'—');
  const zfStar=T2(zfzs.值符星宮?zfzs.值符星宮[0]:'');
  const zfGongName=T2(realZfGong);
  const zsDoor=T2(zfzs.值使門宮?zfzs.值使門宮[0]:'');
  const zsGongName=T2(realZsGong);

  /* 組合 HTML */
  const html=`
  <div class="meta-card">
    <div class="meta-title">基本資訊</div>
    <div class="meta-gz">${gz}</div>
    <div class="meta-ju">${juLabel}</div>
    <div class="meta-grid">
      <div class="meta-item">
        <div class="meta-k">日干 / 時干</div>
        <div class="meta-v">${T2(dayStem)||'—'} &nbsp;·&nbsp; ${T2(hourStem)||'—'}</div>
      </div>
      <div class="meta-item">
        <div class="meta-k">生年</div>
        <div class="meta-v">${yearsInput?escHtml(T2(yearsInput)):'—'}</div>
      </div>
      <div class="meta-item">
        <div class="meta-k">值符星宮</div>
        <div class="meta-v zf">${zfStar}星 · ${zfGongName}</div>
      </div>
      <div class="meta-item">
        <div class="meta-k">值使門宮</div>
        <div class="meta-v zs">${zsDoor}門 · ${zsGongName}</div>
      </div>
      <div class="meta-item">
        <div class="meta-k">旬首 / 旬空</div>
        <div class="meta-v">${xunShou} &nbsp;·&nbsp; 空${rikong}</div>
      </div>
      <div class="meta-item">
        <div class="meta-k">節氣</div>
        <div class="meta-v">${jq}</div>
      </div>
    </div>
    ${pan.真太陽時校正?`<div style="margin-top:10px;padding:6px 8px;background:#F0F4FA;border-radius:6px;font-size:11px;color:#3A4A66">
      已依經度做真太陽時校正：輸入時刻校正 ${pan.真太陽時校正.校正分鐘>0?'+':''}${pan.真太陽時校正.校正分鐘} 分鐘，
      實際用於排盤的時刻是 <b>${pan.真太陽時校正.校正後時刻}</b>（只做經度校正，未含均時差，差距通常在16分鐘內）。
    </div>`:''}
    <div style="margin-top:10px;padding-top:8px;border-top:1px dashed #E5D5A8;font-size:11px;opacity:.75">
      本局有效期約三個月（局勢到最強，也可能提前變化結束），一事只起一局，事無變化不起新局。用完記得封局。
    </div>
  </div>

  <div class="pan-wrap">
    <div class="pan-header">
      <span style="opacity:.7;font-size:10px;margin-right:8px">南</span>天盤干 / 地盤干 / 門星神
      <span style="float:right;opacity:.7;font-size:10px">北</span>
    </div>
    <div class="pan-grid">${gridHTML}</div>
  </div>

  <div class="ana-step" style="opacity:.6;margin-bottom:8px">下面不管切到白話版還是專業版，格局/六害的描述都沿用傳統典籍/教材的原始意象用詞，部分措辭較重(如「百事皆凶」「車禍意外」)，是傳統文字上的比喻性/警示性描述，不是斷定你現實生活一定會發生這些事；尤其涉及健康、意外等字眼，請勿當作醫療或安全判斷依據。</div>
  <div class="master-toggle">
    <button class="mt-btn mt-active" data-mode="plain" onclick="setMasterMode(this,'plain')">白話版</button>
    <button class="mt-btn" data-mode="pro" onclick="setMasterMode(this,'pro')">專業版</button>
  </div>
  <div class="master-mode master-mode-plain">${
    juType==='命局'
      ?renderMingjuStoryPlain(pan, sky, door, star, god, zfzs, dayStem, hourStem, needKey, industry, targetWuxing, yearsInput, masterSummary, marriageInfo, kongHitGongs, fuyinFanyinHits)
      :renderShijuStoryPlain(pan, sky, door, star, god, zfzs, dayStem, hourStem, needKey, industry, targetWuxing, yearsInput, masterSummary, marriageInfo, kongHitGongs, fuyinFanyinHits)
  }</div>
  <div class="master-mode master-mode-pro" style="display:none">${renderMasterSummary(masterSummary, juType)}</div>

  <div class="section-label">解讀一・主流斷局法（跨門派共識，與下面荀爽老師體系是兩套不同來源）${BADGE_SOURCE_B}${BADGE_CONSENSUS_X}</div>
  ${gejuHits.length ? `<div class="geju-card">
    <div class="geju-title">命中的吉凶格局</div>
    ${gejuHits.map(h=>hotspotGongs.has(h.gong)?`<div class="geju-item">
      <span class="pill ${h.luck==='吉'?'pill-ji':'pill-xiong'}">${T2(h.luck)}格</span>
      <b>${T2(h.gong)}宮　${T2(h.name)}</b>　（天盤${T2(h.sky)}／地盤${T2(h.earth)}）${seenNote}
    </div>`:`<div class="geju-item">
      <span class="pill ${h.luck==='吉'?'pill-ji':'pill-xiong'}">${T2(h.luck)}格</span>
      <b>${T2(h.gong)}宮　${T2(h.name)}</b>　（天盤${T2(h.sky)}／地盤${T2(h.earth)}）<br>
      ${T2(h.desc)}${h.caveat?`<br><span style="opacity:.7">※ ${T2(h.caveat)}</span>`:''}
    </div>`).join('')}
  </div>` : `<div class="geju-card" style="opacity:.65">
    <div class="geju-title">命中的吉凶格局</div>
    <div>本局未命中青龍返首／飛鳥跌穴／白虎猖狂／朱雀投江／螣蛇夭矯／大格／小格／奇儀順遂／
    奇儀相佐／青龍逃走／星奇朱雀／日奇入地網／陰害陽門／日奇入墓／日奇被刑／日奇入天羅／
    火悖入刑／青龍轉光／青龍耀明／日月相會／玉女刑殺／太白逢星／人遁吉格／值符飛宮這 24
    個跨門派高共識格局。</div>
  </div>`}
  ${sanzhaWujiaHits.length ? `<div class="geju-card">
    <div class="geju-title">命中的三詐五假（謀略/隱蔽性質，不是單純吉凶判斷）</div>
    <div style="font-size:11px;opacity:.6;margin-bottom:6px">三詐五假判斷的是「這件事適不適合暗中謀劃、隱藏真實意圖」，古代常用在用兵/求謀/緝捕等場合，跟上面的吉凶格局是不同維度的判斷，不要混著看。</div>
    ${juType==='命局'?`<div style="font-size:11px;opacity:.7;margin-bottom:6px;padding:6px 8px;background:#F5F3FA;border-radius:6px">${T2(MINGJU_SANZHA_NOTE)}</div>`:''}
    ${sanzhaWujiaHits.map(h=>hotspotGongs.has(h.gong)?`<div class="geju-item">
      <span class="pill pill-neutral">${T2(h.type)}格</span>
      <b>${T2(h.gong)}宮　${T2(h.name)}</b>　（${T2(h.door)}門／天盤${T2(h.stem)}）${seenNote}
    </div>`:`<div class="geju-item">
      <span class="pill pill-neutral">${T2(h.type)}格</span>
      <b>${T2(h.gong)}宮　${T2(h.name)}</b>　（${T2(h.door)}門／天盤${T2(h.stem)}）<br>
      ${T2(h.desc)}
    </div>`).join('')}
  </div>` : ''}
  ${(function(){
    if(!diliHits.length)return '';
    const withHit=diliHits.map(h=>({...h, isHit:protectedStems.has(h.stem)}));
    const jiHits=withHit.filter(h=>h.luck==='吉').sort((a,b)=>(b.isHit-a.isHit));
    const xiongHits=withHit.filter(h=>h.luck==='凶').sort((a,b)=>(b.isHit-a.isHit));
    const rowHtml=h=>hotspotGongs.has(h.gong)?`<div class="ana-step" style="opacity:.55">
      ${T2(h.gong)}宮　${T2(h.panType)}${T2(h.stem)}(${T2(h.stage)})
      <span class="hl-badge ${h.isHit?'hl-hit':'hl-bg'}">${h.isHit?'命中號令':'背景'}</span>${seenNote}
    </div>`:`<div class="ana-step"${h.isHit?'':' style="opacity:.5"'}>
      ${T2(h.panType)}${T2(h.stem)}　落${T2(h.gong)}宮(${T2(h.branch)})——${T2(h.stage)}
      <span class="hl-badge ${h.isHit?'hl-hit':'hl-bg'}">${h.isHit?'命中號令':'背景'}</span>
    </div>`;
    return `<div class="geju-card">
      <div class="geju-title">主流斷局法：地利（十二長生）</div>
      <div style="font-size:11px;opacity:.6;margin-bottom:6px">跨八字/紫微/奇門通用的旺衰推運工具，跟六害/格局是完全獨立的第三套判斷。天盤干代表現在/未來的狀態，地盤干代表過去的狀態；長生/臨官/帝旺＝得地利，死/墓/絕＝失地利，其餘階段(沐浴/冠帶/衰/病/胎/養)算平不列出。四角宮(艮/巽/坤/乾)各對應兩個地支，分開列不強行合併。</div>
      ${jiHits.length?`<div class="ana-step" style="font-weight:700;color:var(--grn);margin-top:4px">得地利</div>${renderWithBgCollapse(jiHits,rowHtml)}`:''}
      ${xiongHits.length?`<div class="ana-step" style="font-weight:700;color:var(--red);margin-top:4px">失地利</div>${renderWithBgCollapse(xiongHits,rowHtml)}`:''}
    </div>`;
  })()}
  ${(function(){
    if(!zhukeHits.length)return '';
    const withHit=zhukeHits.map(h=>({...h, isHit:protectedStems.has(h.skyStem)||protectedStems.has(h.earthStem)}));
    const zhuHits=withHit.filter(h=>h.favor==='主').sort((a,b)=>(b.isHit-a.isHit));
    const keHits=withHit.filter(h=>h.favor==='客').sort((a,b)=>(b.isHit-a.isHit));
    const biheHits=withHit.filter(h=>h.favor==='平').sort((a,b)=>(b.isHit-a.isHit));
    const rowHtml=h=>hotspotGongs.has(h.gong)?`<div class="ana-step" style="opacity:.55">
      ${T2(h.gong)}宮——${T2(h.relation)}
      <span class="hl-badge ${h.isHit?'hl-hit':'hl-bg'}">${h.isHit?'命中號令':'背景'}</span>${seenNote}
    </div>`:`<div class="ana-step"${h.isHit?'':' style="opacity:.5"'}>
      ${T2(h.gong)}宮　天盤${T2(h.skyStem)}(${T2(h.skyWx)})／地盤${T2(h.earthStem)}(${T2(h.earthWx)})——${T2(h.relation)}
      <span class="hl-badge ${h.isHit?'hl-hit':'hl-bg'}">${h.isHit?'命中號令':'背景'}</span>
    </div>`;
    return `<div class="geju-card">
      <div class="geju-title">主流斷局法：主客（天盤干／地盤干生克關係）</div>
      <div style="font-size:11px;opacity:.6;margin-bottom:6px">天盤隨時辰轉動視為「客」，地盤在一局內不動視為「主」。被克/被生的一方，利益歸誰：天盤克地盤或地盤生天盤＝利客；地盤克天盤或天盤生地盤＝利主；五行相同(比和)則主客同心不分勝負。通常自己/我方問事預設為「主」，對方或事情的變化預設為「客」，實際指派請依占問對象自行判斷，跟六害/格局/地利是完全獨立的另一個維度。</div>
      ${zhuHits.length?`<div class="ana-step" style="font-weight:700;color:var(--grn);margin-top:4px">利主</div>${renderWithBgCollapse(zhuHits,rowHtml)}`:''}
      ${keHits.length?`<div class="ana-step" style="font-weight:700;color:var(--red);margin-top:4px">利客</div>${renderWithBgCollapse(keHits,rowHtml)}`:''}
      ${biheHits.length?`<div class="ana-step" style="font-weight:700;opacity:.7;margin-top:4px">比和(主客同心)</div>${renderWithBgCollapse(biheHits,rowHtml)}`:''}
    </div>`;
  })()}
  ${(function(){
    if(!marriageInfo)return '';
    const {yiGong, gengGong, yiWx, gengWx, relation, favor, isJi, yiLuck, gengLuck}=marriageInfo;
    const yiKong=kongHitGongs.includes(yiGong), gengKong=kongHitGongs.includes(gengGong);
    const hasFuyinFanyin=fuyinFanyinHits.length>0;
    const goodOverall=isJi && !yiKong && !gengKong && !hasFuyinFanyin;
    // 2026-09-06 修正：門/星/神哪一方吉、哪個維度吉分開列出，不是像原本的 hasLuckySymbol
    // 那樣把兩邊三個維度混成一個籠統的布爾值——這裡列出來只是額外參考資訊，不併入上面
    // 乙庚落宮生克的主判斷，也不影響 goodOverall 的顏色判斷。
    const luckWords=lk=>[lk.doorJi&&'吉門',lk.starJi&&'吉星',lk.godJi&&'吉神'].filter(Boolean);
    const yiWords=luckWords(yiLuck), gengWords=luckWords(gengLuck);
    return `<div class="geju-card">
      <div class="geju-title">主流斷局法：婚姻用神（天盤乙／庚落宮生克）</div>
      <div style="font-size:11px;opacity:.6;margin-bottom:6px">天盤乙代表女方，庚代表男方(奇門固定符號，跟八字「日干克我者為官殺/夫星」是不同體系，不要混用)。比較的是乙、庚「各自落宮」的五行生克關係(不是乙庚天干本身——乙庚天干本來就相合)：相生/比和感情較好，相克感情較差；任一方落空亡、或整局逢星/門伏吟反吟，都不利。「三奇入墓」等更細節的判法本專案查證後仍有疑義，暫不收錄，跟六害/格局/地利/主客/天時/人和是完全獨立的另一個維度。</div>
      <div class="ana-step" style="font-weight:700;${goodOverall?'color:var(--grn)':(isJi?'':'color:var(--red)')};margin-top:4px">
        ${T2(yiGong)}宮乙(${T2(yiWx)})／${T2(gengGong)}宮庚(${T2(gengWx)})——${T2(relation)}，${T2(favor)}
      </div>
      ${yiKong?`<div class="ana-step" style="opacity:.75">乙落${T2(yiGong)}宮逢旬空——女方這一側虛浮不實，感情或婚姻容易不穩</div>`:''}
      ${gengKong?`<div class="ana-step" style="opacity:.75">庚落${T2(gengGong)}宮逢旬空——男方這一側虛浮不實，感情或婚姻容易不穩</div>`:''}
      ${hasFuyinFanyin?`<div class="ana-step" style="opacity:.75">整局逢伏吟反吟——感情/婚姻的變動性要一併考慮，不是單純好壞</div>`:''}
      ${(!isJi&&!yiKong&&!gengKong&&!hasFuyinFanyin)?`<div class="ana-step" style="opacity:.6">單就乙庚落宮生克來看偏不利，但沒有旬空或伏吟反吟加重，程度上不算太嚴重</div>`:''}
      ${yiWords.length?`<div class="ana-step" style="opacity:.75">女方(乙落${T2(yiGong)}宮)額外命中${yiWords.join('、')}，屬於這一方單獨的加分參考，不併入上面的整體判斷</div>`:''}
      ${gengWords.length?`<div class="ana-step" style="opacity:.75">男方(庚落${T2(gengGong)}宮)額外命中${gengWords.join('、')}，屬於這一方單獨的加分參考，不併入上面的整體判斷</div>`:''}
    </div>`;
  })()}
  ${(function(){
    // 求財用神(2026-09 新增，見 checkQiucaiYongshen 上方查證註解)：跟婚姻用神同一種卡片，
    // 不看這次 needKey 選的是什麼——日干/生門的落宮位置是這張盤固有的結構，跟命局的
    // 婚姻用神(乙/庚落宮)一樣不受所求影響，所以一律計算、一律顯示，供參考。
    const gzQc=parseGanzhi(pan.干支);
    if(!gzQc)return '';
    const qc=checkQiucaiYongshen(sky, door, dayStem, gzQc.月支);
    if(!qc)return '';
    const goodOverall=qc.isJi&&qc.doorFavor!=='無力';
    return `<div class="geju-card">
      <div class="geju-title">主流斷局法：求財用神（日干／生門落宮生克）</div>
      <div style="font-size:11px;opacity:.6;margin-bottom:6px">日干代表占問者本人，生門代表財利/利潤(跟婚姻用神同一套方法論：比較兩符號「各自落宮」的五行生克，不是天干/門本身的固有五行)：相生/比和方向較有利，相克方向較不利。另外查生門固有五行相對這次月令的旺相休囚(跟天時同一套月令基準)，得力/無力是次要修正，不併入上面的主判斷。值符/值使/六合/月干等次要角色在查證時發現不同來源說法互相矛盾(值符代表買主還是貨主，說法相反)，暫不收錄，只取兩篇來源都同意的「日干/生門」這組核心關係，跟「甲子戊(戊)代表資本」已經在財富七要的「本錢」一項實作，這裡不重複。</div>
      <div class="ana-step" style="font-weight:700;${goodOverall?'color:var(--grn)':(qc.isJi?'':'color:var(--red)')};margin-top:4px">
        ${T2(qc.dayGong)}宮日干(${T2(qc.dayWx)})／${T2(qc.shengmenGong)}宮生門(${T2(qc.smWx)})——${T2(qc.relation)}，${T2(qc.favor)}
      </div>
      ${qc.doorFavor?`<div class="ana-step" style="opacity:.75">生門這次的旺衰是「${T2(qc.doorState)}」——${qc.doorFavor==='得力'?'現在比較有力，加分參考':(qc.doorFavor==='無力'?'現在比較沒勁，扣分參考':'不特別旺也不特別弱')}，不併入上面的主判斷</div>`:''}
    </div>`;
  })()}
  ${(function(){
    if(!tianshiHits.length)return '';
    const withHit=tianshiHits.map(h=>({...h, isHit:gongHitsProtected(h.gong,sky,earth,protectedStems)}));
    const jiHits=withHit.filter(h=>h.luck==='吉').sort((a,b)=>(b.isHit-a.isHit));
    const xiongHits=withHit.filter(h=>h.luck==='凶').sort((a,b)=>(b.isHit-a.isHit));
    const rowHtml=h=>hotspotGongs.has(h.gong)?`<div class="ana-step" style="opacity:.55">
      ${T2(h.gong)}宮——${T2(h.state)}
      <span class="hl-badge ${h.isHit?'hl-hit':'hl-bg'}">${h.isHit?'命中號令':'背景'}</span>${seenNote}
    </div>`:`<div class="ana-step"${h.isHit?'':' style="opacity:.5"'}>
      ${T2(h.gong)}宮　${T2(LEX_DATA.stars[h.star].name)}(${T2(h.starWx)})——${T2(h.state)}
      <span class="hl-badge ${h.isHit?'hl-hit':'hl-bg'}">${h.isHit?'命中號令':'背景'}</span>
    </div>`;
    return `<div class="geju-card">
      <div class="geju-title">主流斷局法：天時（九星按月令旺相休囚死）</div>
      <div style="font-size:11px;opacity:.6;margin-bottom:6px">跟一般五行旺相休囚死的判斷基準不同：九星看重的是「往外生助」的作用力，我生月令才是旺，跟月令同五行只排第二(相)；月令生我則最弱(死/廢)。得天時(有力)＝旺/相，失天時(無力)＝囚/死，休＝中性不列出。跟六害/格局/地利/主客是完全獨立的另一個維度。<br>這裡回答的是「這顆星現在的力量強弱」，跟上面「吉凶速覽」九宮格用顏色標的「這顆星本身先天偏吉還是偏凶」是兩套完全不同的資料，不是同一件事——一顆先天偏凶的星(如天蓬)一樣可以在這裡得天時(旺/相)，意思是「這股偏凶的力量現在比較有力」，不是矛盾，也不是「旺＝更凶」或「旺＝變吉」，兩者要分開看。</div>
      ${jiHits.length?`<div class="ana-step" style="font-weight:700;color:var(--grn);margin-top:4px">得天時</div>${renderWithBgCollapse(jiHits,rowHtml)}`:''}
      ${xiongHits.length?`<div class="ana-step" style="font-weight:700;color:var(--red);margin-top:4px">失天時</div>${renderWithBgCollapse(xiongHits,rowHtml)}`:''}
    </div>`;
  })()}
  ${(function(){
    if(!renheHits.length)return '';
    const withHit=renheHits.map(h=>({...h, isHit:gongHitsProtected(h.gong,sky,earth,protectedStems)}));
    const jiHits=withHit.filter(h=>h.luck==='吉').sort((a,b)=>(b.isHit-a.isHit));
    const xiongHits=withHit.filter(h=>h.luck==='凶').sort((a,b)=>(b.isHit-a.isHit));
    const pingHits=withHit.filter(h=>h.luck==='平').sort((a,b)=>(b.isHit-a.isHit));
    const rowHtml=h=>hotspotGongs.has(h.gong)?`<div class="ana-step" style="opacity:.55">
      ${T2(h.gong)}宮　${T2(h.door)}門——${T2(h.relation)}
      <span class="hl-badge ${h.isHit?'hl-hit':'hl-bg'}">${h.isHit?'命中號令':'背景'}</span>${seenNote}
    </div>`:`<div class="ana-step"${h.isHit?'':' style="opacity:.5"'}>
      ${T2(h.gong)}宮　${T2(h.door)}門(${T2(h.doorWx)})／宮(${T2(h.gongWx)})——${T2(h.relation)}
      <span class="hl-badge ${h.isHit?'hl-hit':'hl-bg'}">${h.isHit?'命中號令':'背景'}</span>
    </div>`;
    return `<div class="geju-card">
      <div class="geju-title">主流斷局法：人和（門宮關係 迫/制/和/義）</div>
      <div style="font-size:11px;opacity:.6;margin-bottom:6px">門克宮＝迫，宮克門＝制，門生宮＝和，宮生門＝義，五行相同則比和。迫跟制都是「被外力壓著、動不了」(只是施力方向相反)，原本吉的門吉不全、原本凶的門更凶；和跟義都是有利的。其中「迫」跟下面荀爽老師「六害：刑墓庚虎迫空」是同一個計算，這裡放在完整的迫/制/和/義脈絡下對照呈現。</div>
      ${jiHits.length?`<div class="ana-step" style="font-weight:700;color:var(--grn);margin-top:4px">和／義（有利）</div>${renderWithBgCollapse(jiHits,rowHtml)}`:''}
      ${xiongHits.length?`<div class="ana-step" style="font-weight:700;color:var(--red);margin-top:4px">迫／制（不利）</div>${renderWithBgCollapse(xiongHits,rowHtml)}`:''}
      ${pingHits.length?`<div class="ana-step" style="font-weight:700;opacity:.7;margin-top:4px">比和</div>${renderWithBgCollapse(pingHits,rowHtml)}`:''}
    </div>`;
  })()}
  ${(function(){
    if(!fuyinFanyinHits.length)return '';
    const withHit=fuyinFanyinHits.map(h=>({...h, isHit:gongHitsProtected(h.gong,sky,earth,protectedStems)}));
    const byType=type=>withHit.filter(h=>h.type===type).sort((a,b)=>(b.isHit-a.isHit));
    const xingFu=byType('星伏吟'), xingFan=byType('星反吟'), menFu=byType('門伏吟'), menFan=byType('門反吟');
    const rowHtml=h=>`<div class="ana-step"${h.isHit?'':' style="opacity:.5"'}>
      ${T2(h.gong)}宮　${T2(h.symbol)}(本宮${T2(h.home)})
      <span class="hl-badge ${h.isHit?'hl-hit':'hl-bg'}">${h.isHit?'命中號令':'背景'}</span>
    </div>`;
    const groupHtml=(label,list,note)=>list.length?`<div class="ana-step" style="font-weight:700;margin-top:4px">${T2(label)}（本局為整局現象，${list.length}個外宮同時命中——${T2(note)}）</div>${list.map(rowHtml).join('')}`:'';
    return `<div class="geju-card">
      <div class="geju-title">主流斷局法：伏吟反吟（星／門）</div>
      <div style="font-size:11px;opacity:.6;margin-bottom:6px">伏吟＝星或門落在自己的洛書固定本宮，反吟＝落在本宮的正對沖宮。因為星盤/門盤是整圈一起轉動，伏吟/反吟永遠是整局同時出現(8個外宮同時命中同一種)，不會只有單一宮位孤立命中。這裡不像上面幾項標吉凶——伏吟反吟的意象比較複雜，不是單純好壞，要配合實際問的事情解讀。值符伏吟/反吟(涉及六甲值符)本專案暫不收錄。</div>
      ${groupHtml('星伏吟', xingFu, '停滯不前、僵化、徘徊')}
      ${groupHtml('星反吟', xingFan, '衝突反覆、變動不安，主快、主變動、也可能失而復得')}
      ${groupHtml('門伏吟', menFu, '停滯不前、僵化、徘徊')}
      ${groupHtml('門反吟', menFan, '衝突反覆、變動不安，主快、主變動、也可能失而復得')}
    </div>`;
  })()}
  ${(function(){
    if(!yimaHits.length)return '';
    const rowHtml=h=>`<div class="ana-step"${h.isHit?'':' style="opacity:.5"'}>
      ${T2(h.ref)}支「${T2(h.refBranch)}」驛馬在「${T2(h.yimaBranch)}」——落${T2(h.gong)}宮
      <span class="hl-badge ${h.isHit?'hl-hit':'hl-bg'}">${h.isHit?'命中號令':'背景'}</span>
    </div>`;
    return `<div class="geju-card">
      <div class="geju-title">主流斷局法：驛馬</div>
      <div style="font-size:11px;opacity:.6;margin-bottom:6px">驛馬主奔波、走動、出行、搬家、轉職等跟移動有關的意象，跨八字/紫微/奇門通用，跟六害/格局/地利是完全獨立的另一個維度。傳統查法：申子辰馬在寅、寅午戌馬在申、巳酉丑馬在亥、亥卯未馬在巳。年支/月支/日支/時支分開起，四個參照點各自獨立列出，不強行合併——如果好幾個參照點的驛馬剛好落在同一個宮，可以當作比較值得注意的訊號。「馬星」在奇門裡其實還有天馬/丁馬兩套不同查法(要配合用神/旬首)，本專案目前只做了這裡的驛馬，天馬/丁馬暫不收錄。</div>
      ${renderWithBgCollapse([...yimaHits].sort((a,b)=>(b.isHit-a.isHit)),rowHtml)}
    </div>`;
  })()}

  <div class="section-label">解讀二・荀爽老師體系（六害：刑墓庚虎迫空 ＋ 灭象布阵化解）${BADGE_SOURCE_A}${BADGE_CONSENSUS_Y}</div>
  ${(function(){
    /* ══ 本局解讀：把上面已經算好的號令/六害/灭象布阵資料，整合成白話的一段分析 ══
       這裡不新增任何判斷方法論——文字用詞(争執損耗/沉溺迷失/凶禍阻隔/快速危險/壓力脅迫/虛假不實)
       直接沿用荀爽老師視頻「六害」截圖裡的原詞；事局/命局雙重解讀、值符值使的話語權/用武之地說法，
       也都是視頻截圖逐字轉錄；灭象動作(可移可扔可送/只能移別扔別送等)直接沿用 MIEXIANG_RULE，
       不是自己編的新規則。這一版把同一類化解方式相同的命中合併成一條，避免重複的布阵說明洗版；
       灭象跟布阵拆成兩行分開講清楚；整體用「一步步」的口吻寫，像人在旁邊講解，不是條列報告。 */
    // 「本局解讀」原本沒有區分命局/事局——灭象布阵是荀爽老師針對「事局」設計的化解方法，命局
    // 模式下不該給具體擺放/方位指令(跟 buildXunlaoItems/白話總結卡/財富七要報告同一條規則，
    // 2026-09-06 覆查財富七要報告時比對「本局解讀」發現這裡漏改)，這裡改成命局模式只講「命中了
    // 什麼」，不逐條印 stepsHtml/kongHtml 的具體灭象/布阵步驟，改成整段統一講一次 MINGJU_CURE_NOTE。
    const isMingju=juType==='命局';
    const LIUHAI_MEANING={刑:'争執損耗',墓:'沉溺迷失',庚:'凶禍阻隔',虎:'快速危險',迫:'壓力脅迫',空:'虛假不實'};
    /* 刑/墓/庚 的軍事隱喻 —— 來源: 荀爽老師視頻「主帥/三奇/六儀」截圖逐字轉錄:
       甲=主帥(指揮中樞，護主帥) / 乙丙丁=三奇(致勝奇謀，以奇勝) / 戊己庚辛壬癸=六儀(大規模正面主力，以正合)
       刑打六儀(正面主力被絞殺殆盡、崩潰)，墓困三奇(奇兵落入陷阱、發揮不出來)，庚點主帥本身(主帥被針對)。 */
    const LIUHAI_DEEPER={
      刑:'刑打的是「六儀」（正面主力）——正面主力被絞殺殆盡，全面崩潰',
      墓:'墓困的是「三奇」（奇兵奇謀）——奇兵落入對方陷阱，發揮不出來',
      庚:'庚點的是「主帥」本身（甲）——你自己被瞄準、被克制',
    };
    const GROUP_SUFFIX={刑:'皆擊刑',墓:'皆入墓',庚:'皆天干庚',虎:'皆白虎',迫:'皆門迫',空:'皆空亡'};

    // 逐條六害，按「先刑墓庚，再虎迫空」的順序合併成一個清單
    const hitList=[];
    Object.entries(jixingHits).forEach(([g,st])=>hitList.push({type:'刑',severity:1,gong:g,
      isHit:protectedStems.has(st), label:`${T2(g)}宮天干${T2(st)}擊刑`, cure:getCureForJiXing(g,st)}));
    Object.entries(rumuHits).forEach(([g,st])=>hitList.push({type:'墓',severity:2,gong:g,
      isHit:protectedStems.has(st), label:`${T2(g)}宮天干${T2(st)}入墓`, cure:getCureForRuMu(g,st)}));
    Object.entries(gengHits).forEach(([g])=>hitList.push({type:'庚',severity:3,gong:g,
      isHit:protectedStems.has('庚'), label:`${T2(g)}宮天干庚`, cure:getCureForGengOrHu(g,'庚')}));
    Object.entries(baihuHits).forEach(([g])=>hitList.push({type:'虎',severity:4,gong:g,
      isHit:gongHitsProtected(g,sky,earth,protectedStems), label:`${T2(g)}宮白虎`, cure:getCureForGengOrHu(g,'虎')}));
    Object.entries(menpoHits).forEach(([g,dr])=>hitList.push({type:'迫',severity:5,gong:g,
      isHit:gongHitsProtected(g,sky,earth,protectedStems)||dr===zfzs.值使門宮?.[0],
      label:`${T2(g)}宮${T2(dr)}門迫`, cureDoor:getCureForMenPo(g)}));
    kongHitGongs.forEach(g=>hitList.push({type:'空',severity:6,gong:g,isHit:true,
      label:`${T2(g)}宮空亡（${kongGongMap[g].join('')}空）`, cure:getCureForKongWang(g,needKey)}));
    hitList.sort((a,b)=>a.severity-b.severity);
    const hitOnly=hitList.filter(x=>x.isHit);

    // 灭象/布阵 兩步驟拆開講，灭象動作沿用 MIEXIANG_RULE (未驗證的部份誠實標註)
    const stepsHtml=(item)=>{
      if(isMingju)return '';
      const rule=MIEXIANG_RULE[item.type];
      const mxUnverified=(rule&&rule.verified===false&&!/^（/.test(rule.action))?'（暫缺視頻原文明確說明，建議人工覆核）':'';
      const mxLine=rule?`<div class="ana-step">灭象：${rule.action}${mxUnverified}</div>`:'';
      let buLine='';
      if(item.cureDoor){
        const c=item.cureDoor;
        if(c){
          const branchDetail=(c.branchXiangs&&c.branchXiangs.length)
            ?c.branchXiangs.map(bx=>`「${bx.branch}」（${bx.zodiac}）：${bx.wu}，放${bx.placement}`).join('；')
            :'';
          buLine=`<div class="ana-step">布阵：擺放「${c.doorsText}」門象，對應地支「${c.branchesText}」化解。</div>`
            +(branchDetail?`<div class="ana-step">地支形象：${branchDetail}</div>`:'');
        }else{
          buLine='<div class="ana-step">布阵：（暫缺，需人工覆核）</div>';
        }
      }else{
        const c=item.cure;
        if(c&&c.place){
          if(item.type==='空'){
            buLine+=`<div class="ana-step">布阵：這個空亡宮自己對應的現實方位是<b>${c.place}</b>，缺啥補啥就去這個方位補放。</div>`;
          }else{
            buLine+=`<div class="ana-step">布阵（無腦法）：灭象後，把要布的天干放到<b>${c.place}</b>方位，兩個方位都可以，不用另外挑特定天干。</div>`;
          }
        }
        if(c&&c.xiang){
          const x=c.xiang;
          const cvUnverified=c.verified===false?'（此為推導，未經視頻原文逐字驗證，僅供參考）':'';
          const prefix=item.type==='空'?'補放：':(c.place?'（進階，非必要）如果想搭配具體天干取象，可以用':'布阵：如果想搭配具體天干取象，可以用');
          buLine+=`<div class="ana-step">${prefix}「${T2(x.stem)}」——${x.wu}，放${x.placement}${cvUnverified}</div>`;
        }
        if(!buLine){
          buLine='<div class="ana-step">布阵：（暫缺，需人工覆核）</div>';
        }
      }
      return mxLine+buLine;
    };
    // 化解方式相同的命中(常見於同一次布阵用同一個天干/同一組門象)合併成一條，避免重複洗版
    const groupKey=(item)=>{
      if(item.cureDoor){
        const c=item.cureDoor;
        return c?`door|${item.type}|${c.doorsText}|${c.branchesText}`:`door|${item.type}|none|${item.gong}`;
      }
      const c=item.cure;
      return c&&c.xiang?`stem|${item.type}|${c.xiang.stem}|${c.place||''}`:`stem|${item.type}|none|${item.gong}`;
    };
    const groupsMap=new Map();
    hitOnly.forEach(item=>{
      const k=groupKey(item);
      if(!groupsMap.has(k))groupsMap.set(k,{type:item.type,severity:item.severity,items:[]});
      groupsMap.get(k).items.push(item);
    });
    const groupList=[...groupsMap.values()].sort((a,b)=>a.severity-b.severity);

    // 事局/命局 雙重解讀 (日干/時干)——第一步，先搞清楚這局在保護誰、話語權在哪
    // 具體定位：荀爽老師視頻裡的用法不是抽象講日干時干的意思，而是真的拿這兩個字去
    // 天盤干裡找它落在哪一宮，再把那一宮完整的門/星/神讀出來(喬布斯/海德格爾/拉康三個案例逐字核對過)。
    const locateStemGong=(stem)=>{
      if(!stem)return null;
      for(const g of Object.keys(sky)){ if(sky[g]===stem)return g; }
      return null;
    };
    const stemLocateLine=(label,stem)=>{
      if(!stem)return '';
      const g=locateStemGong(stem);
      if(!g){
        return `<div>${label}干「${T2(stem)}」在天盤上沒有直接找到對應宮位（如果是「甲」，因為甲永遠藏在值符背後、不直接現於天盤，這是正常的，看值符落宮即可）。</div>`;
      }
      if(g==='中'){
        return `<div>${label}干「${T2(stem)}」落在<b>中宮</b>——中宮本身不單獨排門/星/神，中五寄宮規則各派不同、本專案尚未確認查清楚(跟 checkDili/checkYiGengMarriage 等其他模組遇到中宮時的處理方式一致)，這裡不代替你猜是哪一宮，需要人工判斷。</div>`;
      }
      const dr=door[g], st=star[g], gd=god[g];
      const doorInfo=LEX_DATA.doors[dr], starInfo=LEX_DATA.stars[st], godInfo=LEX_DATA.gods[gd];
      const doorName=doorInfo?doorInfo.name:(dr?`${dr}門`:null);
      const starName=starInfo?starInfo.name:(st?`${st}星`:null);
      const godName=godInfo?godInfo.name:gd;
      const parts=[doorName,starName,godName].filter(Boolean).map(T2).join('、');
      const frameWord=juType==='命局'?(label==='日'?'內心':'對外樣子'):(label==='日'?'本質':'表象');
      let html=`<div>${label}干「${T2(stem)}」落在<b>${T2(g)}宮</b>——這宮是${parts}，${juType==='命局'?'這個人的':'這件事的'}${frameWord}就看這三個組合起來：</div>`;
      if(doorInfo)html+=`<div class="ana-step">門象「${T2(doorName)}」（${T2(doorInfo.keyword||'')}）：${T2(doorInfo.desc||'')}</div>`;
      if(starInfo)html+=`<div class="ana-step">星象「${T2(starName)}」（${T2(starInfo.keyword||'')}）：${T2(starInfo.desc||'')}</div>`;
      if(godInfo)html+=`<div class="ana-step">神象「${T2(godName)}」（${T2(godInfo.keyword||'')}）：${T2(godInfo.desc||'')}</div>`;
      return html;
    };

    let openingHtml='';
    if(dayStem&&hourStem){
      const dStem=LEX_DATA.stems[dayStem], hStem=LEX_DATA.stems[hourStem];
      const juTypeNote=juType==='命局'
        ?'這局是<b>命局</b>——用某個人的出生時刻起局，來分析這個人本身。日干是這個人的<b>內心</b>，時干是他對外展現的<b>樣子</b>。'
        :'這局是<b>事局</b>——問的是一件事、一件事的走向。日干是這件事的<b>本質</b>，時干是它目前呈現出來的<b>表象</b>。';
      openingHtml=`<div class="ana-block">
        <div class="ana-h">第一步・先看這局是為誰起的</div>
        <div>這次問的是「<b>${T2(needKey)}</b>」。日干「${T2(dayStem)}」（${dStem?dStem.keyword:''}），時干「${T2(hourStem)}」（${hStem?hStem.keyword:''}）——
        <br>${juTypeNote}</div>
        <div style="margin-top:6px">${stemLocateLine('日',dayStem)}${stemLocateLine('時',hourStem)}</div>
      </div>`;
    }
    if(realZfGong||realZsGong){
      openingHtml+=`<div class="ana-block">
        <div>再看誰在主導、誰能出力：值符落在<b>${T2(realZfGong)}宮</b>，這局的話語權/主導力量在這裡；
        值使落在<b>${T2(realZsGong)}宮</b>，真正能使得上力、行動見效的位置在這裡。</div>
      </div>`;
    }

    // 第二步：有沒有踩雷
    let attentionHtml='';
    if(hitOnly.length){
      const tripleHit=['刑','墓','庚'].every(t=>hitOnly.some(x=>x.type===t));
      const kongGroups=groupList.filter(g=>g.type==='空');
      const otherGroups=groupList.filter(g=>g.type!=='空');
      // 空亡的方位跟著宮走、每個宮不一樣，不能合併方位，但補放的天干/字物意行是同一套(同個所求)，
      // 所以拆開處理：方位逐宮列出，補放說明只講一次，比逐宮重複整段乾淨。
      let kongHtml='';
      if(kongGroups.length){
        const allItems=kongGroups.flatMap(g=>g.items);
        const gongDirList=allItems.map(it=>`${T2(it.gong)}宮(${GUA_DIR[it.gong]||''})`).join('、');
        const first=allItems[0];
        const rule=MIEXIANG_RULE['空'];
        const c=first.cure;
        let bu='';
        if(!isMingju&&c&&c.xiang){
          const x=c.xiang;
          const cvUnverified=c.verified===false?'（此為推導，未經視頻原文逐字驗證，僅供參考）':'';
          bu=`<div class="ana-step">補放：「${T2(x.stem)}」——${x.wu}，放${x.placement}${cvUnverified}</div>`;
        }
        kongHtml=`<div class="ana-item">
          <span class="lh-word lh-kong">空</span>
          ${gongDirList}皆空亡——${LIUHAI_MEANING['空']}
          ${isMingju?'':`<div class="ana-step">灭象：${rule?rule.action:''}</div>
          <div class="ana-step">布阵：每個空亡宮各自去自己對應的方位（如上列）補放，方位跟著宮走、不能合併成一個。</div>`}
          ${bu}
        </div>`;
      }
      attentionHtml=`<div class="ana-block">
        <div class="ana-h">第二步・有沒有踩到雷（只列命中本次號令的，按嚴重度由重到輕）</div>
        ${tripleHit?`<div class="ana-item"><b>刑、墓、庚同時命中</b>——正面主力（六儀）、奇兵奇謀（三奇）、主帥本身（甲）三個層級同時被打，是最重的疊加情況，建議優先全部處理完再看局勢。</div>`:''}
        ${otherGroups.map(grp=>{
          const first=grp.items[0];
          const gongList=grp.items.map(it=>T2(it.gong)).join('、');
          const headLine=grp.items.length>1?`${gongList}${grp.items.length}宮${GROUP_SUFFIX[grp.type]}`:first.label;
          return `<div class="ana-item">
            <span class="lh-word lh-${{刑:'xing',墓:'mu',庚:'geng',虎:'hu',迫:'po',空:'kong'}[grp.type]}">${grp.type}</span>
            ${headLine}——${LIUHAI_MEANING[grp.type]}${LIUHAI_DEEPER[grp.type]?`（${LIUHAI_DEEPER[grp.type]}）`:''}
            ${stepsHtml(first)}
          </div>`;
        }).join('')}
        ${kongHtml}
        ${isMingju?`<div class="ana-item" style="opacity:.8">${T2(MINGJU_CURE_NOTE)}</div>`:''}
      </div>`;
    }else if(hitList.length){
      attentionHtml=`<div class="ana-block"><div class="ana-h">第二步・有沒有踩到雷</div><div>本局有六害，但都沒有命中本次號令保護的天干/宮位，屬於盤面背景，不是真正衝著這次問事來的，可以先不用特別處理。</div></div>`;
    }else{
      attentionHtml=`<div class="ana-block"><div class="ana-h">第二步・有沒有踩到雷</div><div>本局沒有檢測到刑墓庚虎迫空六害，盤面比較乾淨。</div></div>`;
    }

    // 第三步：整體判斷 (基於已驗證的嚴重度排序做的合成描述，非新方法論)
    const hasSevere=hitOnly.some(x=>x.severity<=3);
    let verdict;
    if(hitOnly.length===0) verdict='整體比較順，沒有命中號令的凶象，可以按原計劃推進。';
    else if(hasSevere) verdict=isMingju?'有明顯阻力（命中了刑/墓/庚其中之一），命局模式暫不給具體灭象/布阵步驟，詳見上方說明。':'有明顯阻力（命中了刑/墓/庚其中之一），建議先把上面列的灭象/布阵做完，再看局勢有沒有轉順。';
    else verdict='有一些干擾（虎/迫/空層級），問題不算嚴重，但處理掉會更順。';

    return `<div class="analysis-card">
      ${openingHtml}
      ${attentionHtml}
      <div class="ana-block"><div class="ana-h">第三步・整體怎麼樣</div><div>${verdict}</div></div>
      ${isMingju?'':`<div class="ana-block"><div class="ana-h">第四步・排雷時要注意</div>
        <div>灭象、布阵一律「重天干、可忽略地干」，每個宮只看上面的天干；布阵時把化解用的天干/地支形象，按對你最有利的方式布入對應宮位（荀爽老師說的「利益最大原則」）。</div>
      </div>`}
    </div>`;
  })()}

  ${(function(){
    const anyHit=Object.keys(jixingHits).length||Object.keys(rumuHits).length||Object.keys(menpoHits).length
      ||Object.keys(gengHits).length||Object.keys(baihuHits).length||kongHitGongs.length;
    if(!anyHit)return '';
    const isMingju=juType==='命局';

    const cureLine=(cure)=>{
      if(isMingju)return '';
      if(!cure)return '';
      const isKong=cure.hai==='空';
      const placeLine=cure.place
        ?(isKong
          ?`<div class="cure-line">→ 這個空亡宮自己對應的現實方位是<b>${cure.place}</b>，缺啥補啥就去這個方位補放</div>`
          :`<div class="cure-line">→ 無腦法：灭象後放到<b>${cure.place}</b>方位，兩個方位都可以</div>`)
        :'';
      const noteLine=cure.note?`<div class="cure-line" style="opacity:.75">→ ${T2(cure.note)}</div>`:'';
      const x=cure.xiang;
      if(!x)return placeLine+noteLine;
      const unverified=cure.verified===false?'<span style="opacity:.6">（推導，未經視頻原文驗證，僅供參考）</span>':'';
      return placeLine+`<div class="cure-line">→ ${cure.place&&!isKong?'（進階）':''}${cure.method}：用「${x.stem}」，放${x.placement||'高處'}${unverified}<br>
        <span style="opacity:.85">字：${x.wu?x.wu:''}　字：${x.zi}</span><br>
        <span style="opacity:.85">意：${x.yi}　行：${x.xing}</span></div>`+noteLine;
    };
    // 標記該條六害是否「命中號令」(日時/生年/意象/符使 之一): 命中者正常顯示, 未命中者弱化
    const hlTag=(isHit)=>isHit
      ?`<span class="hl-badge hl-hit">命中號令</span>`
      :`<span class="hl-badge hl-bg">背景凶象</span>`;
    const rowClass=(isHit)=>isHit?'':' style="opacity:.45"';
    // 命中號令的條目，上面「本局解讀」第二步已經逐條講過完整的灭象/布阵步驟(含合併同化解方式的
    // 分組)，這裡沒有新資訊，只是把同一件事再列一次——改成精簡提示，不重複貼一次完整化解文字；
    // 背景凶象(未命中)則是這張卡獨有的資訊(本局解讀只講命中的部分)，維持完整顯示不做精簡。
    const dedupNote='<span style="opacity:.55;font-size:10px">（詳見上方「本局解讀」第二步，此處從簡）</span>';

    let html='<div class="liuhai-card">';
    if(hasProtected){
      html+=`<div style="font-size:11px;opacity:.7;margin-bottom:8px">
        本次號令保護天干：${[...protectedStems].map(s=>T2(s)).join('、')}
        （日時/生年/意象/符使）——只有命中這些天干或其所在宮位，才是真正衝著這次問事來的凶象；其餘為盤面背景，僅供參考</div>`;
    }

    if(Object.keys(jixingHits).length){
      html+=`<div class="liuhai-sec">
        <div class="liuhai-title jx"><span class="dot"></span><span class="lh-word lh-xing">刑</span>${isMingju?`（嚴重度最高，${HAI_MEANING['刑']}）`:`（嚴重度最高，灭象：${MIEXIANG_RULE['刑'].action}，布阵：用合）`}</div>
        ${Object.entries(jixingHits).map(([g,st])=>{
          const isHit=protectedStems.has(st);
          const cure=getCureForJiXing(g,st);
          return `<div${rowClass(isHit)}>· ${T2(g)}宮　天干${T2(st)}擊刑 ${hlTag(isHit)}${isHit?dedupNote:cureLine(cure)}</div>`;
        }).join('')}
      </div>`;
    }

    if(Object.keys(rumuHits).length){
      html+=`<div class="liuhai-sec">
        <div class="liuhai-title rm"><span class="dot"></span><span class="lh-word lh-mu">墓</span>${isMingju?`（${HAI_MEANING['墓']}）`:`（灭象：${MIEXIANG_RULE['墓'].action}，布阵：用冲）`}</div>
        ${Object.entries(rumuHits).map(([g,st])=>{
          const isHit=protectedStems.has(st);
          const cure=getCureForRuMu(g,st);
          return `<div${rowClass(isHit)}>· ${T2(g)}宮　天干${T2(st)}入墓 ${hlTag(isHit)}${isHit?dedupNote:cureLine(cure)}</div>`;
        }).join('')}
      </div>`;
    }

    if(Object.keys(gengHits).length){
      html+=`<div class="liuhai-sec">
        <div class="liuhai-title mp"><span class="dot"></span><span class="lh-word lh-geng">庚</span>${isMingju?`（${HAI_MEANING['庚']}）`:`（灭象：${MIEXIANG_RULE['庚'].action}，布阵：無腦用乙）`}</div>
        ${Object.entries(gengHits).map(([g,st])=>{
          const isHit=protectedStems.has('庚');
          const cure=getCureForGengOrHu(g,'庚');
          return `<div${rowClass(isHit)}>· ${T2(g)}宮　天干庚 ${hlTag(isHit)}${isHit?dedupNote:cureLine(cure)}</div>`;
        }).join('')}
      </div>`;
    }

    if(Object.keys(baihuHits).length){
      html+=`<div class="liuhai-sec">
        <div class="liuhai-title mp"><span class="dot"></span><span class="lh-word lh-hu">虎</span>${isMingju?`（白虎，${HAI_MEANING['虎']}）`:'（白虎，布阵：無腦用乙；灭象動作暫沿用「刑」的通用規則，未經視頻明確驗證）'}</div>
        ${Object.entries(baihuHits).map(([g,gd])=>{
          const isHit=gongHitsProtected(g,sky,earth,protectedStems);
          const cure=getCureForGengOrHu(g,'虎');
          return `<div${rowClass(isHit)}>· ${T2(g)}宮　白虎 ${hlTag(isHit)}${isHit?dedupNote:cureLine(cure)}</div>`;
        }).join('')}
      </div>`;
    }

    if(Object.keys(menpoHits).length){
      html+=`<div class="liuhai-sec">
        <div class="liuhai-title po"><span class="dot"></span><span class="lh-word lh-po">迫</span>${isMingju?`（門迫，${HAI_MEANING['迫']}，門克宮）`:'（門迫，壓力脅迫，門克宮；布阵：用合）'}</div>
        ${Object.entries(menpoHits).map(([g,dr])=>{
          const isHit=gongHitsProtected(g,sky,earth,protectedStems)||dr===zfzs.值使門宮?.[0];
          const cure=getCureForMenPo(g);
          const branchDetail=(cure&&cure.branchXiangs&&cure.branchXiangs.length)
            ?cure.branchXiangs.map(bx=>`「${bx.branch}」(${bx.zodiac})：${bx.wu}，放${bx.placement}`).join('；')
            :'';
          const cureHtml=(cure&&!isMingju)?`<div class="cure-line">→ 用合：擺放「${cure.doorsText}」門象、對應地支「${cure.branchesText}」<br>
            <span style="opacity:.85">地支形象：${branchDetail}</span></div>`:'';
          return `<div${rowClass(isHit)}>· ${T2(g)}宮　${T2(dr)}門迫 ${hlTag(isHit)}${isHit?dedupNote:cureHtml}</div>`;
        }).join('')}
      </div>`;
    }

    if(kongHitGongs.length){
      html+=`<div class="liuhai-sec">
        <div class="liuhai-title kw"><span class="dot"></span><span class="lh-word lh-kong">空</span>${isMingju?`（空亡，嚴重度最低，源自日時本身，${HAI_MEANING['空']}）`:`（空亡，嚴重度最低，源自日時本身，布阵：缺啥補啥——目前所求「${needKey}」）`}</div>
        ${kongHitGongs.map(g=>{
          return `<div>· ${T2(g)}宮　空亡（${kongGongMap[g].join('')}空）${hlTag(true)}${dedupNote}</div>`;
        }).join('')}
      </div>`;
    }

    if(isMingju){
      html+=`<div style="font-size:11px;opacity:.7;margin-top:6px">${T2(MINGJU_CURE_NOTE)}</div>`;
    }
    html+='</div>';
    return html;
  })()}

  ${(needKey==='財富七要'||needKey==='事業七要') ? renderWealthCareerReport(pan, needKey, industry, targetWuxing, juType)
    : (SIMPLE_LOCATE_DEFS[needKey] ? renderSimpleLocateReport(pan, needKey, yearsInput, juType) : '')}

  <div class="info-card">
    <div class="info-title">吉凶速覽</div>
    ${GRID_ORDER.filter(g=>g!=='中').map(g=>{
      const dr=door[g]||'', st=star[g]||'', gd=god[g]||'';
      if(!dr&&!st)return '';
      return `<div class="info-row">
        <div class="info-k">${T2(GUA_NAME[g]||g)}</div>
        <div class="info-v">
          <span class="pill ${luckClass(T2(dr))}">${T2(dr)}</span>
          <span class="pill ${luckClass(T2(st))}">${T2(st)}</span>
          <span class="pill ${luckClass(T2(gd))}">${T2(gd)}</span>
        </div>
      </div>`;
    }).join('')}
  </div>`;

  document.getElementById('result').innerHTML=html;

  /* 存入起局歷史記錄 (只存輸入條件與摘要, 不存完整盤面, 便於未來以最新算法回看) */
  const hitLabels=[];
  if(Object.keys(jixingHits).length)hitLabels.push('刑');
  if(Object.keys(rumuHits).length)hitLabels.push('墓');
  if(Object.keys(gengHits).length)hitLabels.push('庚');
  if(Object.keys(baihuHits).length)hitLabels.push('虎');
  if(Object.keys(menpoHits).length)hitLabels.push('迫');
  if(Object.keys(kongGongMap).filter(g=>g!=='中').length)hitLabels.push('空');
  // 預註冊式驗證日誌(2026-08-29 新增)：起局當下把師傅總結的熱點宮判斷原封不動存成快照，
  // 之後在歷史記錄裡唯讀顯示、永遠不會被之後的「事後回看」文字或算法更新覆蓋掉。這樣事後
  // 回看時，看到的是「起局那一刻真的判斷了什麼」而不是憑印象事後重構，才有校對意義——
  // 對照 ChatGPT 建議的「拿過去人生大事回測」，這裡是唯一站得住腳的驗證方式：先留下判斷，
  // 不看結果，時間到了再對照，而不是找到結果後回頭找理由解釋，避免確認偏誤。純粹紀錄，
  // 不強迫使用、不影響原本起局流程，用戶不填「事後回看」也完全不影響工具正常運作。
  const predictionSnapshot = masterSummary.quiet ? [] : masterSummary.hotspots.map(hp=>({
    gong: hp.gong,
    agreement: hp.agreement,
    xunlao: hp.xunlao.map(x=>({text:x.text, isHit:x.isHit})),
    mainstream: hp.mainstream.map(x=>({text:x.text, isHit:x.isHit})),
  }));
  // skipHistory：從歷史記錄重新載入時不重複推入新記錄(見 calc() 註解)。
  // longitudeInput/industry/targetWuxing：Codex code review 2026-09-03 抓到的問題——
  // 原本沒有存這三個欄位，「重新載入」舊記錄時會直接沿用畫面上目前的值，經度會影響真太陽時
  // 校正甚至時柱本身，同一筆歷史記錄重新排出來的盤可能因此跟起局當下不一樣，失去「回看」
  // 的意義，所以這三項也要原封不動存進記錄、重新載入時原封不動還原。
  if(!skipHistory){
    pushHistoryRecord({
      id: Date.now(),
      dateStr: `${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`,
      timeStr: `${String(h).padStart(2,'0')}:${String(mi).padStart(2,'0')}`,
      needKey,
      yearsInput: yearsInput||'',
      juType,
      juLabel,
      gz,
      hitsSummary: hitLabels.length?`六害命中：${hitLabels.join('、')}`:'六害：無命中',
      prediction: predictionSnapshot,
      longitudeInput: longitudeInput||'',
      industry: industry||'',
      targetWuxing: targetWuxing||'',
    });
  }
}

/* ── 初始化 ── */
const init=()=>{
  if(typeof Solar==='undefined'||typeof QimenJS==='undefined'){setTimeout(init,50);return;}
  initT2();
  setNow();
  initCityPreset();
  const bigSel=document.getElementById('iIndustryBig');
  if(bigSel){
    let opts='<option value="">（不選，僅財富/事業七要報告用到）</option>';
    opts+='<option value="__FLAT__">常見行業(視頻/案例已驗證)</option>';
    opts+=Object.keys(INDUSTRY_TAXONOMY).map(k=>`<option value="${k}">${k}</option>`).join('');
    bigSel.innerHTML=opts;
    bigSel.addEventListener('change', updateSmallIndustryOptions);
  }
  updateSmallIndustryOptions();
};
function updateSmallIndustryOptions(){
  const bigSel=document.getElementById('iIndustryBig'), smallSel=document.getElementById('iIndustrySmall');
  if(!bigSel||!smallSel)return;
  const big=bigSel.value;
  if(!big){ smallSel.innerHTML='<option value="">（先選大行業）</option>'; return; }
  if(big==='__FLAT__'){
    smallSel.innerHTML=Object.keys(INDUSTRY_MAP).map(k=>`<option value="${k}">${k}</option>`).join('');
    return;
  }
  const subs=(INDUSTRY_TAXONOMY[big]&&INDUSTRY_TAXONOMY[big].subs)||{};
  smallSel.innerHTML=Object.keys(subs).map(k=>`<option value="${big}::${k}">${k}</option>`).join('');
}
if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',init);}else{init();}

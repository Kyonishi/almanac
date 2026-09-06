// qimen-ui.js — 唯一會讀寫 DOM 的一層：時間工具、起局按鈕(calc)、九宮格渲染(renderPan)、
// 起局歷史記錄、初始化。這個檔案只負責「把命盤算出來、擺到畫面上」，不含任何解讀/取象/
// 吉凶判斷邏輯——那些屬於另一個私有專案。
// 依賴: qimen-engine.js (QimenJS/Solar)、qimen-lexicon.js (GRID_ORDER/GUA_NAME/GUA_DIR/
// ZHI_TO_GONG/DOOR_NAME/STAR_NAME/GOD_NAME/RITUAL_DATA)。

/* ── OpenCC s2t init (簡體→繁體顯示用，跟排盤邏輯無關) ── */
let t2 = x => x;
function initT2(){
  if(typeof OpenCC!=='undefined'){
    try{ t2=OpenCC.Converter({from:'cn',to:'tw'}); }catch(e){}
  }
}

function escHtml(s){
  return String(s||'').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

/* ── 起局儀軌面板 ── */
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

/* ── 起局歷史記錄 (localStorage, 僅存本機瀏覽器)──
   只存「輸入條件」與命盤摘要 (干支/排局)，不存解讀內容——排盤本身沒有解讀可存。 */
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
function pushHistoryRecord(rec){
  const list=loadHistory();
  list.unshift(rec);
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
function reloadHistoryRecord(id){
  const rec=loadHistory().find(r=>r.id===id);
  if(!rec)return;
  document.getElementById('iDate').value=rec.dateStr;
  document.getElementById('iTime').value=rec.timeStr;
  document.getElementById('iLongitude').value=rec.longitudeInput!==undefined?rec.longitudeInput:'';
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
// 嚴格校驗匯入備份裡每一筆記錄的形狀，只留下欄位型別正確的部分，避免竄改過的備份檔案
// 在瀏覽器裡透過 innerHTML/onclick 跑任意腳本。
function sanitizeHistoryRecord(r){
  if(!r||typeof r!=='object')return null;
  const id=Number(r.id);
  if(!Number.isFinite(id))return null;
  const str=v=>typeof v==='string'?v:'';
  return {
    id, dateStr:str(r.dateStr), timeStr:str(r.timeStr),
    longitudeInput:str(r.longitudeInput), gz:str(r.gz), juLabel:str(r.juLabel),
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
function renderHistoryPanel(){
  const p=document.getElementById('historyPanel');
  const list=loadHistory();
  const rows=list.map(r=>{
    const safeId=Number.isFinite(Number(r.id))?Number(r.id):0;
    return `
    <div class="h-row">
      <div class="h-row-top">
        <div class="h-row-main" onclick="reloadHistoryRecord(${safeId})">
          <div class="h-row-date">${escHtml(r.dateStr)} ${escHtml(r.timeStr)}</div>
          <div class="h-row-info">${escHtml(t2(r.juLabel||''))} · ${escHtml(t2(r.gz||''))}</div>
        </div>
        <button class="h-row-del" onclick="deleteHistoryRecord(${safeId})" title="刪除">✕</button>
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

/* ── 城市經度快速帶入 ── 經度取城市中心點概略值，真太陽時校正只做到分鐘級，城市級精度已足夠。 */
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
}
function updHeader(){
  const n=new Date();
  const dw='日一二三四五六'[n.getDay()];
  document.getElementById('hdate').innerHTML=`${n.getFullYear()}.${n.getMonth()+1}.${n.getDate()} 星期${dw}<br>${pad(n.getHours())}:${pad(n.getMinutes())}`;
}
updHeader();setInterval(updHeader,30000);

/* ── 起局 ──
   skipHistory：從歷史記錄「重新載入」時傳 true，代表這不是一次新的起局，只是回看舊記錄，
   不應該再往歷史清單裡多推一筆。 */
function calc(skipHistory){
  const dv=document.getElementById('iDate').value;
  const tv=document.getElementById('iTime').value;
  if(!dv||!tv){alert('請輸入日期和時間');return;}
  const [y,m,d]=dv.split('-').map(Number);
  const [h,mi]=tv.split(':').map(Number);
  const lonRaw=(document.getElementById('iLongitude')||{}).value;
  const longitude=lonRaw===''||lonRaw===undefined?undefined:Number(lonRaw);
  try{
    const pan=QimenJS.qimenChaibu(Solar,y,m,d,h,mi,longitude);
    renderPan(pan,lonRaw,skipHistory);
  }catch(e){
    document.getElementById('result').innerHTML=
      `<div class="empty"><div class="big">⚠</div>起局失敗：${e.message}</div>`;
  }
}

/* ── 九宮格 + 基本資訊渲染 (純排盤結果展示，不含任何解讀) ── */
function renderPan(pan, longitudeInput, skipHistory){
  const T2=x=>t2(x||'');
  const sky=pan.天盤||{}, earth=pan.地盤||{};
  const door=pan.門||{}, star=pan.星||{}, god=pan.神||{};
  const zfzs=pan.值符值使||{};
  const zfGong=zfzs.值符星宮?zfzs.值符星宮[1]:'';
  const zsGong=zfzs.值使門宮?zfzs.值使門宮[1]:'';
  const kong=pan.旬空||{};

  const realZfGong=zfGong==='中'?'坤':zfGong;
  const realZsGong=zsGong==='中'?'坤':zsGong;

  /* 旬空宮位對照: 日空/時空的地支拆開，透過固定配支表查出對應宮位 */
  const kongGongMap={};
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

  const gzMatch=(pan.干支||'').match(/^(.)(.)年(.)(.)月(.)(.)日(.)(.)時$/);
  const dayStem=gzMatch?gzMatch[5]:null, hourStem=gzMatch?gzMatch[7]:null;

  function renderCell(gua){
    const s=sky[gua]||'', e=earth[gua]||'';
    const dr=door[gua]||'', st=star[gua]||'', gd=god[gua]||'';
    const isZf=gua===realZfGong;
    const isZs=gua===realZsGong;
    const isCenter=gua==='中';
    const kongLabels=kongGongMap[gua]||[];
    const isKw=kongLabels.length>0;

    let cls='cell';
    if(isCenter)cls+=' center-cell';
    if(isZf&&!isCenter)cls+=' is-zf';
    if(isZs&&!isCenter&&!isZf)cls+=' is-zs';

    const guaName=GUA_NAME[gua]||gua;
    const guaDir=GUA_DIR[gua]||'';
    const doorDisp=dr?(DOOR_NAME[dr]||dr):'';
    const starDisp=st?(STAR_NAME[st]||st):'';
    const godDisp=gd?(GOD_NAME[gd]||gd):'';

    return `<div class="${cls}">
      ${guaDir?`<div class="cell-dir">${guaDir}</div>`:''}
      ${kongLabels.length?`<div class="c-kong">空${kongLabels.join('')}</div>`:''}
      <div class="c-line c-line-top">
        ${s?`<span class="c-sky">${T2(s)}</span>`:'<span class="c-sky dim">—</span>'}
        ${!isCenter&&gd?`<span class="c-god-val">${T2(godDisp)}</span>`:''}
      </div>
      ${!isCenter&&dr?`<div class="c-door-line"><span class="c-door-val">${T2(doorDisp)}</span></div>`:''}
      <div class="c-line c-line-bottom">
        ${e?`<span class="c-earth">${T2(e)}</span>`:''}
        ${!isCenter&&st?`<span class="c-star-val">${T2(starDisp)}</span>`:''}
      </div>
      ${isZf?'<div class="c-special zf-tag">值符</div>':''}
      ${isZs&&!isZf?'<div class="c-special zs-tag">值使</div>':''}
      <div class="cell-gua${isKw?' kongwang':''}">${guaName}</div>
    </div>`;
  }

  const gridHTML=GRID_ORDER.map(renderCell).join('');

  const juLabel=T2(pan.排局||'');
  const gz=T2(pan.干支||'');
  const jq=T2(pan.節氣||'');
  const xunShou=T2(pan.旬首||'');
  const rikong=T2(kong.日空||'—');
  const zfStar=T2(zfzs.值符星宮?zfzs.值符星宮[0]:'');
  const zfGongName=T2(realZfGong);
  const zsDoor=T2(zfzs.值使門宮?zfzs.值使門宮[0]:'');
  const zsGongName=T2(realZsGong);

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
  </div>

  <div class="pan-wrap">
    <div class="pan-header">
      <span style="opacity:.7;font-size:10px;margin-right:8px">南</span>天盤干 / 地盤干 / 門星神
      <span style="float:right;opacity:.7;font-size:10px">北</span>
    </div>
    <div class="pan-grid">${gridHTML}</div>
  </div>`;

  document.getElementById('result').innerHTML=html;

  if(!skipHistory){
    pushHistoryRecord({
      id: Date.now(),
      dateStr: document.getElementById('iDate').value,
      timeStr: document.getElementById('iTime').value,
      longitudeInput: longitudeInput||'',
      gz, juLabel,
    });
  }
}

/* ── 初始化 ── */
const init=()=>{
  if(typeof Solar==='undefined'||typeof QimenJS==='undefined'){setTimeout(init,50);return;}
  initT2();
  setNow();
  initCityPreset();
};
if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',init);}else{init();}

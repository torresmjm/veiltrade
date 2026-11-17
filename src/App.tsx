// @ts-nocheck
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
let requestRender = () => {};
let focusRestore = null;

const LOGO='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 2.5 4 6.5v5.2c0 4.6 3.4 8 8 9.8 4.6-1.8 8-5.200 8-9.800V6.5z"/><path d="M12 7.500 8 9.500v2.300c0 2.400 1.700 4 4 5 2.300-1 4-2.600 4-5V9.500z" fill="currentColor" fill-opacity=".35"/></svg>';
const S={w:'off',net:'Ethereum (mock)',hide:false,priv:null,view:'you',nav:false,
 t:{tok:'ETH',side:'buy',amt:'500',step:0,cat:'Crypto',mode:'Spot',tf:'1d',q:'',route:'shield'},m:{a:'ETH',tf:'1d',side:'buy',amt:'250',st:0},p:{thr:10000,st:0,v:'you'},pay:{mode:'send',asset:'USDC',amount:'100',recipient:'',step:0,copied:false},exchange:{from:'ETH',to:'USDC',amount:'1',step:0},wallet:{mode:'',asset:'USDC',amount:'100',step:0},pref:{auto:true,warn:true,proto:true}};
const TOK={ETH:3120.4,WBTC:94210.5,LINK:18.62,USDC:1};
const AST=[['ETH',9840,'#8b7cf6'],['USDC',6200,'#5b6a7a'],['WBTC',3900,'#c8c9d0'],['LINK',1100,'#3e3a73']];
const ACT=[['Swap 0.80 ETH → USDC','Shielded','Today 09:14'],['Shield 2,000 USDC','Shielded','Yesterday'],['Swap 500 USDC → LINK','Partially exposed','Nov 14'],['Public deposit 1.5 ETH','Public','Nov 12']];
const PS={Shielded:['s','Shielded','The balance and amounts sit inside a shielded pool. The public can verify that the transaction was valid, but not your balance or trade size. Deposits and withdrawals at the pool’s edge remain visible.'],
 Public:['r','Public','An ordinary on-chain transaction. Everyone can see the addresses and amounts. Moving funds into the shielded pool protects them from that point on; it does not make past activity private.'],
 'Partially exposed':['x','Partially exposed','Some detail can be inferred or was shared on purpose — for example timing links a deposit to a withdrawal, or you disclosed a fact to one party with a selective proof.'],
 Verifiable:['s','Verifiable','Anyone can independently check that this operation followed the public rules. Verifiable does not mean private: it says nothing about who can see amounts or addresses.'],
 'Demo only':['x','Demo only','This is a fictional interface record. No transaction was sent to a blockchain.']};
const $=n=>'$'+n.toLocaleString('en-US',{maximumFractionDigits:2});
const R=(v)=>S.hide?'<span class="red">••••••</span>':v;
const TOTAL=AST.reduce((a,b)=>a+b[1],0);
const addr='0x7a3f…c91e';
function tag(s){const p=PS[s];return `<span class="tag ${p[0]}">${s}</span>`}
function topbar(app){
 const links=[['overview','Overview'],['trade','Trade'],['portfolio','Portfolio'],['proofs','Proofs'],['learn','Learn']];
 const cur=location.hash.slice(1)||'overview';
 return `<header class="top"><div class="w"><a class="logo" href="#overview">${LOGO}VEIL</a>
 ${app?`<select class="hide-m" style="width:190px" data-net aria-label="Network">${['Ethereum (mock)','Arbitrum (mock)','Base (mock)'].map(n=>`<option ${n==S.net?'selected':''}>${n}</option>`).join('')}</select>`:`<nav class="${S.nav?'open':''}">${links.map(l=>`<a href="#${l[0]}" class="${l[0]==cur?'on':''}">${l[1]}</a>`).join('')}</nav>`}
 <span style="flex:${app?1:0}"></span>
 ${S.w=='on'&&app?'<span class="pill hide-m"><span class="dot"></span>Demo user</span>':''}
 <button class="btn p" data-act="wallet" ${S.w=='connecting'?'disabled':''}>${S.w=='off'?'Connect Wallet':S.w=='connecting'?'<span class="sp"></span>Connecting…':'● '+addr}</button>
 ${app?'':'<button class="btn menu" data-act="nav" aria-label="Menu">☰</button>'}</div></header>`}
const MK=[['ETH',3120.4,2.4],['WBTC',94210.5,-1.1],['LINK',18.62,4.9],['SOL',182.3,-3.2],['ARB',0.94,1.7]];
function ser(s,tf,chg){let x=0;for(const c of s+tf)x=(x*31+c.charCodeAt(0))%9973;const a=[];let v=0;for(let i=0;i<48;i++){x=(x*1103+12345)%65521;v+=(x/65521-.5)*2+chg*.04;a.push(v)}return a}
const CHARTS={};
const FEED={state:'loading',updated:0,available:0,assets:{}};
const API='https://data-api.binance.vision/api/v3';
const PAIRS={ETH:'ETHUSDT',WBTC:'WBTCUSDT',LINK:'LINKUSDT',SOL:'SOLUSDT',ARB:'ARBUSDT'};
const CHART_INTERVALS={'1h':'1h','1d':'1d','1w':'1w'};
function mockCandles(asset,interval,base,change){const vals=ser(asset,interval,change),mn=Math.min(...vals),mx=Math.max(...vals),unit=interval=='1h'?3600000:interval=='1d'?86400000:604800000;let prev=base*.98;return vals.map((v,i)=>{const close=base*(.98+((v-mn)/(mx-mn||1))*.04),open=prev,spread=base*.001*(.3+((i*17)%9)/10),row={time:Date.now()-(vals.length-1-i)*unit,open,high:Math.max(open,close)+spread,low:Math.min(open,close)-spread,close,volume:0};prev=close;return row})}
function money(n){return '$'+Number(n).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})}
function chart(asset,interval,base,change){const data=CHARTS[asset]?.[interval]||mockCandles(asset,interval,base,change),W=760,H=270,L=66,R=76,T=18,B=36,PW=W-L-R,PH=H-T-B,prices=data.flatMap(c=>[c.high,c.low,Number(base)]),min=Math.min(...prices),max=Math.max(...prices),pad=(max-min)*.08||Number(base)*.01,lo=min-pad,hi=max+pad,step=PW/data.length,bw=Math.max(2,Math.min(8,step*.62)),y=v=>T+(hi-v)/(hi-lo)*PH,x=i=>L+(i+.5)*step;
 const grid=Array.from({length:5},(_,i)=>{const val=hi-(hi-lo)*i/4,yy=T+PH*i/4;return `<line x1="${L}" y1="${yy}" x2="${W-R}" y2="${yy}" class="chart-gridline"/><text x="${W-R+8}" y="${yy+3}" class="chart-axis">${money(val)}</text>`}).join('');
 const candles=data.map((c,i)=>{const up=c.close>=c.open,yy1=y(c.high),yy2=y(c.low),bodyY=Math.min(y(c.open),y(c.close)),bodyH=Math.max(1,Math.abs(y(c.open)-y(c.close)));return `<g class="candle ${up?'up':'down'}" data-index="${i}"><line x1="${x(i)}" y1="${yy1}" x2="${x(i)}" y2="${yy2}"/><rect x="${x(i)-bw/2}" y="${bodyY}" width="${bw}" height="${bodyH}" rx="1"/></g>`}).join('');
 const markY=y(Number(base)),last=data.length-1,ticks=[0,.25,.5,.75,1].map(frac=>{const i=Math.round(last*frac),d=new Date(data[i].time),label=interval=='1h'?d.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}):d.toLocaleDateString([],{month:'short',day:'numeric'});return `<text x="${x(i)}" y="${H-8}" text-anchor="middle" class="chart-axis">${label}</text>`}).join('');
 const live=Boolean(CHARTS[asset]?.[interval]&&FEED.assets[asset]),feed=live?`Binance spot · refreshed ${new Date(FEED.updated).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit',second:'2-digit'})}`:FEED.state=='loading'?'Connecting to public market data…':'Sample chart · live feed unavailable';
 return `<div class="price-chart" data-chart data-candles="${encodeURIComponent(JSON.stringify(data))}" data-mark="${base}" data-low="${lo}" data-high="${hi}" data-left="${L}" data-top="${T}" data-plotw="${PW}" data-ploth="${PH}" data-interval="${interval}"><div class="chart-toolbar"><span class="chart-source ${live?'connected':''}"><i></i>${feed}</span><span class="chart-mark">LAST <b>${money(base)}</b></span></div><div class="chart-readout" data-readout>Move over a candle for OHLC details</div><svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" role="img" aria-label="${asset} candlestick chart with price scale and dates">${grid}<line x1="${L}" y1="${markY}" x2="${W-R}" y2="${markY}" class="mark-line"/><rect x="${W-R+3}" y="${markY-9}" width="${R-6}" height="18" rx="9" class="mark-label-bg"/><text x="${W-R+8}" y="${markY+3}" class="mark-label">${money(base)}</text>${candles}<line data-cross x1="0" y1="${T}" x2="0" y2="${T+PH}" class="crosshair" style="display:none"/><circle data-point cx="0" cy="0" r="3" class="hover-point" style="display:none"/>${ticks}</svg><span class="price-tip" data-tip style="display:none"></span></div>`}
function mkt(){const m=S.m,c=MK.find(k=>k[0]==m.a),amt=parseFloat(m.amt)||0,fee=amt*.003,got=m.side=='buy'?(amt-fee)/c[1]:amt-fee;
return `<div class="mk" id="demo"><div class="mklist">${MK.map(k=>`<button class="mkr ${k[0]==m.a?'on':''}" data-mk="${k[0]}"><b>${k[0]}</b><span class="num">${k[1].toLocaleString('en-US')}</span><small style="color:${k[2]>=0?'var(--ok)':'var(--rd)'}">${k[2]>0?'+':''}${k[2]}%</small></button>`).join('')}</div>
<div class="mkc"><div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap"><div><b style="font-size:20px">${c[0]}</b> <span class="num" style="font-size:20px;margin-left:8px">${money(c[1])}</span></div><div class="seg">${['1h','1d','1w'].map(t=>`<button data-tf="${t}" class="${t==m.tf?'on':''}">${t}</button>`).join('')}</div></div>${chart(c[0],m.tf,c[1],c[2])}<div class="row"><span>Route preview</span><span class="demo">Market data only · no trading integration</span></div></div>
<div class="mko"><div class="seg" role="group"><button data-ms="buy" class="${m.side=='buy'?'on':''}">Buy</button><button data-ms="sell" class="${m.side=='sell'?'on':''}">Sell</button></div><label for="ma">Amount (USD)</label><input id="ma" data-mamt inputmode="decimal" value="${m.amt}"><div class="row"><span>You get</span><span class="num">${m.side=='buy'?got.toFixed(4)+' '+c[0]:'$'+got.toFixed(2)}</span></div><div class="row"><span>Fee (0.30%)</span><span class="num">$${fee.toFixed(2)}</span></div>${m.st==0?`<button class="btn p" style="width:100%;margin-top:12px" data-act="mgo" ${amt>0?'':'disabled'}>Review ${m.side}</button>`:m.st==1?`<button class="btn" disabled style="width:100%;margin-top:12px"><span class="sp"></span>Proving &amp; submitting…</button>`:`<div class="pop"><span class="tag s">Filled (simulated)</span><p>Nothing was sent to a blockchain.</p><button class="btn" data-act="mreset">New order</button></div>`}</div></div>`}
/* ---------- landing ---------- */
function landing(){
 const rows=[['Swap','ETH → USDC','0.80','Valid ✓'],['Swap','USDC → LINK','500.00','Valid ✓'],['Shield','USDC','2,000.00','Valid ✓']];
 const you=S.view=='you';
 return topbar(0)+`<main id="main">
<section class="hero"><div class="w"><div class="hc">
<span class="eye">Private financial platform</span>
<h1>Your finances. Your visibility. Your choice.</h1>
<p style="font-size:19px;color:var(--tx)">Transparency for the system. Privacy for the individual.</p>
<p>Hold, send, receive, exchange, and trade digital assets while keeping control over what your financial activity reveals.</p>
<div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:22px;justify-content:center"><a class="btn p" href="#app">Explore Veil</a></div></div>
${mkt()}</div></section>

<section id="philosophy" class="lt"><div class="w ctr"><h2>Philosophy</h2><span class="eye">Transparent systems. Private financial lives.</span>
<p style="max-width:640px">Checking that an operation is valid is not the same as seeing everything behind it. Pick who is looking and see what they get.</p>
<div class="seg" role="group" style="margin:12px 0 18px"><button data-view="you" class="${you?'on':''}">You</button><button data-view="pub" class="${you?'':'on'}">Public verifier</button></div>
<div class="card" style="overflow-x:auto"><table><tr><th>Action</th><th>Pair</th><th>Amount</th><th>Balance after</th><th>Validity</th></tr>
${rows.map((r,i)=>`<tr><td>${r[0]}</td><td>${you?r[1]:'<span class="red">•••••</span>'}</td><td class="num">${you?r[2]:'<span class="red">••••</span>'}</td><td class="num">${you?['$21,040','$21,540','$23,540'][i]:'<span class="red">••••••</span>'}</td><td style="color:var(--ok)">${r[3]}</td></tr>`).join('')}</table></div>

<div class="g2" style="margin-top:36px;gap:16px"><div class="card"><h3>What the public verifies</h3><p>Contract rules · transaction validity · proof verification · protocol solvency and accounting · fees and execution rules.</p></div><div class="card"><h3>What you control</h3><p>Personal balances · trading strategies · individual history · financial identity · portfolio information.</p></div></div></div></section>

<section><div class="w ctr"><h2>How it works</h2><div class="g3" style="margin-top:24px">
${[['1  Protect','Your personal financial information stays private.'],['2  Prove','Cryptographic proofs show your claims and transactions are valid — without handing over the details.'],['3  Trade','Take part in DeFi while exposing as little as necessary.']].map(a=>`<div class="card"><h3>${a[0]}</h3><p>${a[1]}</p></div>`).join('')}</div></div></section>


<section class="lt"><div class="w ctr"><h2>Markets</h2><div class="card" style="overflow-x:auto;margin-top:20px"><table><tr><th>Market</th><th>Spot</th><th>Perpetuals</th></tr><tr><td>Crypto</td><td><span class="tag x">Prototype · initial focus</span></td><td><span class="tag x">Experimental</span></td></tr><tr><td>Tokenized stocks and eligible real-world assets</td><td><span class="tag">Coming soon</span></td><td><span class="tag">Coming soon</span></td></tr></table></div></div></section>
<section><div class="w ctr"><h2>Transparency principles</h2>
<p style="max-width:660px">Veil intends to keep its rules, verification methods and financial operations open to audit. It does not aim to hide the blockchain or make fraud untraceable.</p>
<div class="g2" style="gap:16px;margin-top:24px"><div class="card"><span class="tag s">Private to you</span><div class="row"><span>Balances</span><span class="red">•••••</span></div><div class="row"><span>Strategy</span><span class="red">•••••</span></div><div class="row"><span>History</span><span class="red">•••••</span></div></div>
<div class="card"><span class="tag">Public and verifiable</span><div class="row"><span>Contract rules</span><span>Open</span></div><div class="row"><span>Proof verification</span><span>Open</span></div><div class="row"><span>Solvency and fees</span><span>Open</span></div></div></div></div></section>

</main>`}
/* ---------- learn ---------- */
function learn(){
 const L=[['Why financial privacy matters','Your balance and history reveal your income, habits and risk. In a fully public ledger, anyone can follow them — and traders can copy or target your strategy.'],
 ['Transparency versus privacy','Open systems need public rules and checkable results. Individuals need room to keep their finances to themselves. Veil treats these as different layers, not opposites.'],
 ['How zero-knowledge proofs work','A proof lets you show a statement is true — “my balance is at least $10,000” — without revealing the balance. Anyone can check the proof; nobody learns the number.'],
 ['How shielded transactions work','Funds move into a shielded pool. Later spends come with a proof that they are valid and not double-spent, without linking to the original deposit publicly.'],
 ['What Veil can and cannot hide','Veil aims to protect balances, amounts and trading intent on routes that support it — today that is a prototype for crypto spot only. It cannot hide public deposits and withdrawals, contract code, the fact that proofs exist, or clues from timing when few people trade. Tokenized assets and perpetuals have no shielded execution yet, and a proof or private RPC alone does not make a trade private. It does not remove your legal obligations.']];
 return topbar(0)+`<main id="main"><section class="hero" style="padding-bottom:30px"><div class="w"><span class="eye">Learn</span><h1 style="font-size:clamp(32px,5vw,48px)">Understand it before you use it.</h1></div></section><div class="w" style="padding-bottom:60px">${L.map(l=>`<div class="card" style="margin-bottom:14px"><h3>${l[0]}</h3><p style="margin:0">${l[1]}</p></div>`).join('')}</div></main>`}
/* ---------- app shell ---------- */
function shell(body,id){
 const items=[['app','Overview'],['wallet','Wallet'],['payments','Send / Receive'],['exchange','Exchange'],['trade','Trade'],['portfolio','Portfolio'],['proofs','Proofs'],['activity','Activity'],['prefs','Settings']];
 return topbar(1)+`<div class="app"><aside class="side">${items.map(i=>`<a href="#${i[0]}" class="${i[0]==id?'on':''}">${i[1]}</a>`).join('')}</aside><main class="main" id="main">${body}</main></div>`}
function gate(){return `<div class="empty"><p>Connect a demo wallet to see your private view.</p><button class="btn p" data-act="wallet">Connect Wallet</button></div>`}
function privInd(){
 const k=S.priv;
 return `<div style="display:flex;gap:8px;flex-wrap:wrap">${Object.keys(PS).map(s=>`<button class="pill" data-priv="${s}" aria-expanded="${k==s}"><span class="dot ${PS[s][0]=='r'?'pub':PS[s][0]=='x'?'par':''}"></span>${s}</button>`).join('')}</div>${k?`<div class="pop"><b>${PS[k][1]}</b><p>${PS[k][2]}</p></div>`:'<p class="demo" style="margin-top:8px">Select a state to see what it means.</p>'}`}
function alloc(){return `<div class="bar">${AST.map(a=>`<i style="width:${a[1]/TOTAL*100}%;background:${a[2]}"></i>`).join('')}</div>${AST.map(a=>`<div class="row"><span><span class="dot" style="display:inline-block;background:${a[2]};margin-right:8px"></span>${a[0]}</span><span class="num">${R((a[1]/TOTAL*100).toFixed(1)+'%')}</span></div>`).join('')}`}
function actList(n){return ACT.slice(0,n).map(a=>`<div class="row"><span style="color:var(--tx)">${a[0]}<br><small class="demo">${a[2]}</small></span>${tag(a[1])}</div>`).join('')}
function dash(){
 if(S.w!='on')return shell(`<h2>Overview</h2>${gate()}`,'app');
 return shell(`<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px"><h2 style="margin:0">Overview</h2></div><p>Welcome back. Only you can see these numbers.</p>
<div class="dgrid"><div class="card c4"><span class="demo">Private total balance · sample</span><div class="big">${R($(TOTAL))}</div><button class="btn" data-act="hide" style="margin-top:10px">${S.hide?'Show':'Hide'} balances</button></div>
<div class="card c2"><span class="demo">Supported network</span><div style="margin:8px 0">${S.net}</div><span class="tag x">Testnet concept</span></div>
<div class="card c3"><h3>Asset allocation</h3>${alloc()}</div><div class="card c3"><h3>Privacy status</h3>${privInd()}</div>
<div class="card c4"><h3>Recent private activity · sample</h3>${actList(3)}</div><div class="card c2"><h3>Your money, your choice</h3><p>Move between wallet, payments, exchange, and crypto markets.</p><div style="display:flex;gap:7px;flex-wrap:wrap"><a class="btn p" href="#wallet">Wallet</a><a class="btn" href="#payments">Send / Receive</a><a class="btn" href="#exchange">Exchange</a><a class="btn" href="#trade">Trade</a></div></div></div>`,'app')}
const TM={Crypto:[['ETH',3120.4,2.4],['WBTC',94210.5,-1.1],['LINK',18.62,4.9],['SOL',182.3,-3.2],['ARB',0.94,1.7]],'Tokenized assets':[['TSLA',374.2,4.9],['AMZN',221.84,-3.9],['NFLX',96.12,5.3]]};
async function refreshMarketData(){
 const entries=await Promise.all(Object.entries(PAIRS).map(async([asset,symbol])=>{
  const tickerPromise=fetch(`${API}/ticker/24hr?symbol=${symbol}`,{cache:'no-store'}).then(r=>{if(!r.ok)throw Error('ticker unavailable');return r.json()}).catch(()=>null);
  const chartPromises=Object.entries(CHART_INTERVALS).map(async([ui,interval])=>{try{const r=await fetch(`${API}/klines?symbol=${symbol}&interval=${interval}&limit=60`,{cache:'no-store'});if(!r.ok)throw Error('candles unavailable');const rows=await r.json();return [ui,rows.map(k=>({time:Number(k[0]),open:Number(k[1]),high:Number(k[2]),low:Number(k[3]),close:Number(k[4]),volume:Number(k[5])}))]}catch{return [ui,null]}});
  const [ticker,...charts]=await Promise.all([tickerPromise,...chartPromises]);return {asset,ticker,charts};
 }));
 let live=0;FEED.assets={};
 for(const item of entries){if(!CHARTS[item.asset])CHARTS[item.asset]={};if(item.ticker){const price=Number(item.ticker.lastPrice),change=Number(item.ticker.priceChangePercent);if(Number.isFinite(price)){const rows=[...MK,...TM.Crypto].filter(r=>r[0]===item.asset);rows.forEach(r=>{r[1]=price;r[2]=change});FEED.assets[item.asset]=true;live++}}
  for(const [interval,candles] of item.charts)if(candles?.length)CHARTS[item.asset][interval]=candles;
 }
 FEED.available=live;FEED.state=live?'ready':'error';FEED.updated=Date.now();requestRender();
}
const PXX={ETH:3120.4,WBTC:94210.5,LINK:18.62,USDC:1};
const esc=s=>s.replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function priceOf(asset){return asset==='USDC'?1:(MK.find(r=>r[0]===asset)?.[1]||PXX[asset]||1)}
function walletPage(){
 const w=S.wallet,rows=AST.map(([asset,value])=>({asset,value,amount:value/priceOf(asset)}));
 let action='';
 if(w.mode&&w.step===1)action=`<div class="pop"><b>Review ${w.mode} · ${w.amount} ${w.asset}</b><p>${w.mode==='deposit'?'Deposits may be publicly visible on the source network.':'Withdrawals may reveal the destination address and amount.'} Mock review only.</p><div style="display:flex;gap:8px;margin-top:10px"><button class="btn p" data-act="wallet-confirm">Confirm demo ${w.mode}</button><button class="btn" data-act="wallet-cancel">Cancel</button></div></div>`;
 else if(w.mode&&w.step===2)action=`<div class="pop"><span class="tag s">${w.mode==='deposit'?'Deposit':'Withdrawal'} simulated</span><p>No transaction was created or sent to a network.</p><button class="btn" data-act="wallet-cancel">Done</button></div>`;
 else action=`<div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn p" data-act="wallet-deposit">Deposit · mock</button><button class="btn" data-act="wallet-withdraw">Withdraw · mock</button></div>`;
 return shell(`<h2>Wallet</h2><p>Holdings and account controls in one place. Sample balances only; no assets are connected.</p><div class="dgrid"><div class="card c4"><span class="demo">Private wallet value · demonstration</span><div class="big">${R($(TOTAL))}</div><button class="btn" data-act="hide" style="margin-top:10px">${S.hide?'Show':'Hide'} balances</button></div><div class="card c2"><span class="demo">Account state</span><div style="margin:8px 0">${S.w==='on'?'Demo wallet connected':'Guest demo view'}</div><span class="tag x">No real wallet keys</span></div><div class="card c3"><h3>Supported token holdings</h3>${rows.map(r=>`<div class="row"><span>${r.asset}<small class="demo" style="display:block">${R(r.amount.toFixed(r.asset==='USDC'?2:4))}</small></span><span class="num">${R($(r.value))}</span></div>`).join('')}</div><div class="card c3"><h3>Asset allocation</h3>${alloc()}</div><div class="card c3"><h3>Deposit or withdraw</h3><p>Preview a wallet boundary action. Public chain activity may expose addresses, amounts, and timing.</p><label>Asset</label><select data-wallet-asset>${AST.map(a=>`<option ${w.asset===a[0]?'selected':''}>${a[0]}</option>`).join('')}</select><label>Amount</label><input data-wallet-amount inputmode="decimal" value="${esc(w.amount)}">${action}</div><div class="card c3"><h3>Privacy visibility</h3><p>Indicators describe information types, not an active Veil privacy guarantee.</p>${privInd()}</div><div class="card c6"><h3>Private transaction history</h3><p class="demo">Fictional account activity · account-owner view</p>${actList(4)}</div><div class="card c6"><h3>Account & recovery</h3><div class="row"><span>Wallet connection</span><span>${S.w==='on'?'Connected (simulation)':'Not connected'}</span></div><div class="row"><span>Recovery setup</span><span class="tag x">Not configured · concept</span></div><p class="demo" style="margin-top:10px">Never enter a seed phrase in this prototype. Recovery options are not implemented.</p></div></div>`,'wallet')
}
function payments(){
 const p=S.pay,valid=Number(p.amount)>0&&p.recipient.trim().length>=3;
 const form=p.step===1?`<div class="card" style="margin-top:14px"><h3>Review private payment · demo</h3>${[['Recipient',esc(p.recipient)],['Asset and amount',`${esc(p.amount)} ${p.asset}`],['Estimated fee','Not available · mock'],['Status','No private transfer route connected']].map(r=>`<div class="row"><span>${r[0]}</span><span>${r[1]}</span></div>`).join('')}<div class="pop"><b>Privacy and visibility</b><p>No sender, recipient, or amount is protected in this prototype. Deposits, withdrawals, timing, and network activity could still reveal clues.</p><span class="tag x">Experimental · no route</span></div><div style="display:flex;gap:8px;margin-top:12px"><button class="btn p" data-act="send-confirm">Confirm demo send</button><button class="btn" data-act="send-cancel">Back</button></div></div>`:p.step===2?`<div class="pop" style="margin-top:14px"><span class="sp"></span>Preparing a simulated transfer preview…</div>`:p.step===3?`<div class="pop" style="margin-top:14px"><span class="tag s">Demo transfer complete</span><p>No blockchain transaction was sent.</p><button class="btn" data-act="send-reset">New payment</button></div>`:`<div class="card" style="margin-top:14px"><h3>Send to a Veil account</h3><label for="recipient">Veil payment address or account</label><input id="recipient" data-recipient value="${esc(p.recipient)}" placeholder="veil1… or account name" autocomplete="off"><label for="payasset">Asset</label><select id="payasset" data-pay-asset>${AST.map(a=>`<option ${p.asset===a[0]?'selected':''}>${a[0]}</option>`).join('')}</select><label for="payamount">Amount</label><input id="payamount" data-pay-amount inputmode="decimal" value="${esc(p.amount)}"><div class="row"><span>Indicative value · sample</span><span>${money(Number(p.amount||0)*priceOf(p.asset))}</span></div><p class="demo" style="color:var(--rd)">${p.amount&&Number(p.amount)>0&&!valid?'Enter a recipient account to continue.':''}</p><button class="btn p" data-act="send-review" ${valid?'':'disabled'}>Review payment</button></div>`;
 const receive=`<div class="card" style="margin-top:14px"><h3>Receive assets</h3><p>Share this demo address for the prototype. It cannot receive funds.</p><div class="receive-layout"><div class="qr-mock" aria-label="Nonfunctional QR placeholder"><span>DEMO<br>ONLY</span></div><div class="receive-address"><span class="demo">VEIL PAYMENT ADDRESS · MOCK</span><code>veil1demo8m4k2p7xq9n3v6t</code><button class="btn" data-act="copy-address">${p.copied?'Copied demo address':'Copy demo address'}</button></div></div><div class="pop"><b>What may remain visible</b><p>Public deposits, withdrawals, wallet identity, timing, and network activity can reveal information. A private payment route is not integrated.</p></div></div>`;
 return shell(`<h2>Send / Receive</h2><p>Move assets between Veil accounts with a simple payment flow. Private P2P settlement is not implemented.</p><div class="seg" role="group"><button data-pay-mode="send" class="${p.mode==='send'?'on':''}">Send</button><button data-pay-mode="receive" class="${p.mode==='receive'?'on':''}">Receive</button></div><div class="g2" style="align-items:start;gap:16px;margin-top:14px"><div>${p.mode==='send'?form:receive}</div><div class="card"><h3>Private payment history</h3><p class="demo">Account-owner view · fictional examples</p>${actList(4)}<div class="pop"><b>Privacy status · experimental</b><p>Amount, sender, and recipient privacy depend on an implemented route. Network activity and timing may still reveal clues.</p></div></div></div>`,'payments')
}
function exchangePage(){
 const x=S.exchange,fromPrice=priceOf(x.from),toPrice=priceOf(x.to),amount=Number(x.amount)||0,feeUsd=amount*fromPrice*.003,output=Math.max(0,(amount*fromPrice-feeUsd)/toPrice),canQuote=x.from!==x.to&&amount>0;
 const detail=x.step===1?`<div class="pop"><b>Review exchange · demo</b><div class="row"><span>You exchange</span><span>${esc(x.amount)} ${x.from}</span></div><div class="row"><span>Estimated output</span><span>${output.toFixed(x.to==='USDC'?2:6)} ${x.to}</span></div><div class="row"><span>Fee · slippage estimate</span><span>${money(feeUsd)} · 0.50%</span></div><p>Confirming only records a demo status. No quote or blockchain transaction is sent.</p><div style="display:flex;gap:8px"><button class="btn p" data-act="exchange-confirm">Confirm demo exchange</button><button class="btn" data-act="exchange-cancel">Back</button></div></div>`:x.step===2?`<div class="pop"><span class="tag s">Exchange simulated</span><p>No assets were exchanged.</p><button class="btn" data-act="exchange-reset">New exchange</button></div>`:'';
 return shell(`<h2>Exchange</h2><p>Swap supported crypto assets within your Veil account. The quote and execution route are illustrative.</p><div class="g2" style="align-items:start;gap:16px"><div class="card"><div class="seg"><button class="on">Exchange</button></div><label for="exfrom">You pay</label><div class="g2" style="gap:8px"><input id="examount" data-ex-amount inputmode="decimal" value="${esc(x.amount)}"><select id="exfrom" data-ex-from>${AST.map(a=>`<option ${x.from===a[0]?'selected':''}>${a[0]}</option>`).join('')}</select></div><button class="btn" data-act="exchange-flip" style="margin:10px 0">↓ Switch assets</button><label for="exto">You receive · estimated</label><div class="g2" style="gap:8px"><input readonly value="${output.toFixed(x.to==='USDC'?2:6)}"><select id="exto" data-ex-to>${AST.map(a=>`<option ${x.to===a[0]?'selected':''}>${a[0]}</option>`).join('')}</select></div><div class="row"><span>Exchange rate · sample</span><span>1 ${x.from} ≈ ${(fromPrice/toPrice).toFixed(6)} ${x.to}</span></div><div class="row"><span>Fee · price impact</span><span>${money(feeUsd)} · 0.02%</span></div><div class="row"><span>Slippage tolerance</span><span>0.50%</span></div>${x.step===0?`<button class="btn p" style="margin-top:12px" data-act="exchange-review" ${canQuote?'':'disabled'}>Review exchange</button>`:''}${detail}</div><div class="card"><h3>Privacy preview</h3><p class="demo">No exchange route is connected.</p><div class="row"><span>Wallet identity</span>${tag('Public')}</div><div class="row"><span>Trade amount</span>${tag('Public')}</div><div class="row"><span>Settlement</span>${tag('Demo only')}</div><div class="pop"><b>Route status</b><p>Ordinary public-route expectations, not an integrated execution preview. A proof or private RPC alone does not make a transaction private.</p><span class="tag x">Private exchange · planned</span></div></div></div>`,'exchange')
}
const RN={shield:'Shielded route (concept)',rpc:'Private RPC',pub:'Public route'};
const RW={shield:[['Wallet identity','Partially exposed','Your address shows when funds enter or leave the pool, not on each trade.'],['Trade amount','Shielded','Kept inside the pool.'],['Market used','Partially exposed','Pool-level activity can hint at which markets are active.'],['Settlement','Verifiable','Anyone can check the proof against public rules.']],
 rpc:[['Wallet identity','Public','Your address signs the transaction.'],['Trade amount','Public','Visible on-chain once it settles. A private RPC only hides it before inclusion.'],['Pending order','Partially exposed','Hidden from the public mempool, but the RPC operator can see it.'],['Settlement','Verifiable','Standard on-chain settlement.']],
 pub:[['Wallet identity','Public','Your address is visible.'],['Trade amount','Public','Visible to everyone.'],['Pending order','Public','Visible in the mempool and open to front-running.'],['Settlement','Verifiable','Standard on-chain settlement.']]};
function trade(){
 const t=S.t,sup=t.cat=='Crypto'&&t.mode=='Spot',perp=t.mode=='Perpetuals',L=TM[t.cat].filter(k=>k[0].toLowerCase().includes(t.q.toLowerCase())),c=TM[t.cat].find(k=>k[0]==t.tok)||TM[t.cat][0],amt=parseFloat(t.amt)||0,fee=amt*.003,imp=.02+amt/5e6*100,out=t.side=='buy'?(amt-fee)/c[1]:amt-fee,bad=amt<=0||amt>TOTAL;
 const st=t.cat!='Crypto'?'Coming soon':perp?'Experimental':'Prototype · initial focus',rows=RW[t.route];
 let act;
 if(!sup)act='<button class="btn" disabled style="width:100%">Not available yet</button>';
 else if(S.w!='on')act='<button class="btn p" data-act="wallet" style="width:100%">Connect Wallet to continue</button>';
 else if(t.step==0)act=`<button class="btn p" style="width:100%" data-act="review" ${bad?'disabled':''}>Review ${t.side}</button>`;
 else if(t.step==1)act=`<div class="pop"><b>Confirm ${t.side} ${$(amt)} of ${c[0]}?</b><p>Route: ${RN[t.route]}. The privacy preview describes this route, not a guarantee. Simulated; no signature requested.</p><div style="display:flex;gap:8px;margin-top:10px"><button class="btn p" data-act="confirm">Confirm</button><button class="btn" data-act="reset">Cancel</button></div></div>`;
 else if(t.step==2)act='<button class="btn" disabled style="width:100%"><span class="sp"></span>Submitting (simulated)…</button>';
 else act=`<div class="pop"><span class="tag s">Confirmed (simulated)</span>${[['Order',t.side+' '+c[0]],['Amount',$(amt)],['Fee',$(fee)],['Route',RN[t.route]],['Wallet identity',rows[0][1]],['Reference','demo-0x91ae…07']].map(r=>`<div class="row"><span>${r[0]}</span><span>${r[1]}</span></div>`).join('')}<p class="demo" style="margin-top:10px">Nothing was sent to any blockchain.</p><button class="btn" data-act="reset">New order</button></div>`;
 return shell(`<h2>Trade</h2><p>Spot and perpetual markets across crypto and tokenized assets.</p><div class="g2" style="align-items:start;gap:16px">
<div class="card"><div style="display:flex;gap:10px;flex-wrap:wrap"><div class="seg" role="group">${['Crypto','Tokenized assets'].map(k=>`<button data-cat="${k}" class="${t.cat==k?'on':''}">${k}</button>`).join('')}</div><div class="seg" role="group">${['Spot','Perpetuals'].map(k=>`<button data-mode="${k}" class="${t.mode==k?'on':''}">${k}</button>`).join('')}</div></div>
<label for="qs">Search assets</label><input id="qs" data-q value="${esc(t.q)}" placeholder="Search…" autocomplete="off">
<div style="margin-top:8px;border:1px solid var(--bd);border-radius:16px;overflow:hidden">${L.length?L.map(k=>`<button class="mkr ${k[0]==c[0]?'on':''}" data-mkt="${k[0]}"><b>${k[0]}</b><span class="num">${k[1].toLocaleString('en-US')}</span><small style="color:${k[2]>=0?'var(--ok)':'var(--rd)'}">${k[2]>0?'+':''}${k[2]}%</small></button>`).join(''):'<div class="empty" style="border:0">No assets match “'+esc(t.q)+'”.</div>'}</div>
<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;margin-top:14px"><span class="demo">${sup?'Binance Spot public market data':'Sample chart · market mode unavailable'}</span><div class="seg">${['1h','1d','1w'].map(tf=>`<button data-ttf="${tf}" class="${t.tf==tf?'on':''}">${tf}</button>`).join('')}</div></div>${chart(c[0],t.tf,c[1],c[2])}
<div class="seg" role="group"><button data-side="buy" class="${t.side=='buy'?'on':''}">Buy</button><button data-side="sell" class="${t.side=='sell'?'on':''}">Sell</button></div>
<label for="am">Amount (USD)</label><input id="am" data-amt inputmode="decimal" value="${esc(t.amt)}" aria-describedby="er"><div id="er" class="demo" style="color:var(--rd)">${amt<=0?'Enter an amount above 0.':amt>TOTAL?'Above your demo balance.':''}</div>
<div class="row"><span>Market price · ${FEED.assets[c[0]]?'Binance Spot':'sample'}</span><span class="num">${money(c[1])}</span></div><div class="row"><span>Estimated output</span><span class="num">${t.side=='buy'?out.toFixed(4)+' '+c[0]:$(out)}</span></div><div class="row"><span>Fee (0.30%)</span><span class="num">${$(fee)}</span></div><div class="row"><span>Price impact</span><span class="num">${imp.toFixed(2)}%</span></div>
${perp?[['Leverage','Coming soon'],['Margin','Coming soon'],['Liquidation price','Coming soon']].map(r=>`<div class="row"><span>${r[0]}</span><span class="tag x">${r[1]}</span></div>`).join(''):''}
<div style="margin-top:14px">${act}</div></div>
<div class="card"><h3>Privacy preview</h3><p class="demo">What this route reveals, before you confirm. Simulated.</p>${sup?`<div class="seg" role="group" style="margin-bottom:8px">${[['shield','Shielded'],['rpc','Private RPC'],['pub','Public']].map(r=>`<button data-route="${r[0]}" class="${t.route==r[0]?'on':''}">${r[1]}</button>`).join('')}</div>${rows.map(r=>`<div class="row" style="align-items:flex-start"><span>${r[0]}<small class="demo" style="display:block;max-width:230px">${r[2]}</small></span>${tag(r[1])}</div>`).join('')}`:'<div class="empty">No route supports this market yet, so nothing is previewed. Veil won’t label it private until a route can back that up.</div>'}
<p class="demo" style="margin-top:10px">Labels describe the route, not a guarantee. A proof or private RPC alone does not make a trade private. Pool deposits and withdrawals are public, and timing can leave clues.</p></div></div>`,'trade')}
/* ---------- trade ---------- */
function tradeOld(){
 const t=S.t,amt=parseFloat(t.amt)||0,px=TOK[t.tok],fee=amt*.003,got=t.side=='buy'?(amt-fee)/px:(amt*px-fee);
 let body;
 if(t.step==3)body=`<div class="card"><span class="tag s">Confirmed (simulated)</span><h3 style="margin-top:12px">Receipt</h3>${[['Action',t.side+' '+t.tok],['Amount',$(amt)],['Fee',$(fee)],['Privacy','Shielded (demo)'],['Reference','demo-0x91ae…07']].map(r=>`<div class="row"><span>${r[0]}</span><span>${r[1]}</span></div>`).join('')}<p class="demo" style="margin-top:12px">Nothing was sent to any blockchain.</p><button class="btn" data-act="reset">New order</button></div>`;
 else body=`<div class="card"><div class="seg" role="group"><button data-side="buy" class="${t.side=='buy'?'on':''}">Buy</button><button data-side="sell" class="${t.side=='sell'?'on':''}">Sell</button></div>
<label for="tk">Token</label><select id="tk" data-tok>${Object.keys(TOK).map(k=>`<option ${k==t.tok?'selected':''}>${k}</option>`).join('')}</select>
<label for="am">Order amount (USD)</label><input id="am" data-amt inputmode="decimal" value="${t.amt}" aria-describedby="er">
<div id="er" class="demo" style="color:var(--rd)">${amt<=0?'Enter an amount above 0.':amt>TOTAL?'Above your demo balance.':''}</div></div>
<div class="card" style="margin-top:14px"><h3>Execution preview</h3>${[['Price (demo)',$(px)],['You get',t.side=='buy'?got.toFixed(4)+' '+t.tok:$(got)],['Estimated fee (0.30%)',$(fee)],['Execution','Protected submission · experimental'],['Privacy status',tag('Shielded')+' <span class="demo">simulated</span>']].map(r=>`<div class="row"><span>${r[0]}</span><span>${r[1]}</span></div>`).join('')}
<p class="demo" style="margin-top:10px">Pending-trade protection is a planned feature. Deposits and withdrawals at the pool edge stay public.</p>
${S.w!='on'?'<button class="btn p" data-act="wallet" style="width:100%">Connect Wallet to continue</button>':t.step==0?`<button class="btn p" style="width:100%" data-act="review" ${amt<=0||amt>TOTAL?'disabled':''}>Review ${t.side}</button>`:t.step==1?`<div class="pop"><b>Confirm ${t.side} ${$(amt)} of ${t.tok}?</b><p>Simulated. No wallet signature is requested.</p><div style="display:flex;gap:8px;margin-top:10px"><button class="btn p" data-act="confirm">Confirm</button><button class="btn" data-act="reset">Cancel</button></div></div>`:'<button class="btn" disabled style="width:100%"><span class="sp"></span>Generating demo proof &amp; submitting…</button>'}</div>`;
 return shell(`<h2>Trade</h2><p>Interactive mock. <span class="tag x">Prototype</span></p><div style="max-width:520px">${body}</div>`,'trade')}
/* ---------- portfolio ---------- */
function portfolio(){
 if(S.w!='on')return shell('<h2>Portfolio</h2>'+gate(),'portfolio');
 return shell(`<h2>Portfolio</h2><div class="dgrid"><div class="card c3"><span class="demo">Private portfolio value</span><div class="big">${R($(TOTAL))}</div></div><div class="card c3"><span class="demo">Profit and loss</span><div class="big">${R('+$1,284')}</div><span class="tag x">Placeholder</span></div><div class="card c3"><h3>Allocation</h3>${alloc()}</div><div class="card c3"><h3>Privacy status</h3>${privInd()}</div><div class="card c3"><h3>Perpetual positions</h3><span class="tag x">Experimental · coming soon</span><div class="empty" style="margin-top:12px">No open positions. Hidden perpetual positions are not available yet.</div></div><div class="card c3"><h3>Reveal selectively</h3><p>Show a verifier one fact about this portfolio without sharing the rest.</p><a class="btn p" href="#proofs" style="display:inline-block">Generate proof</a></div><div class="card c6"><h3>Spot holdings</h3><table><tr><th>Asset</th><th>Amount</th><th>Value</th></tr>${AST.map(a=>`<tr><td>${a[0]}</td><td class="num">${R((a[1]/PXX[a[0]]).toFixed(a[0]=='USDC'?2:4))}</td><td class="num">${R($(a[1]))}</td></tr>`).join('')}</table></div><div class="card c6"><h3>Trading history</h3>${actList(4)}</div></div>`,'portfolio')}
function proofs(){
 const p=S.p,you=p.v=='you';
 const EX=[['Minimum portfolio value','Prove you hold at least a set amount without showing the exact balance.','Experimental'],['Asset ownership','Prove you own supported assets without revealing other holdings.','Experimental'],['Collateral eligibility','Prove your assets qualify as collateral for a venue or lender.','Coming soon'],['Trading performance','Prove returns over a period without exposing individual trades.','Coming soon']];
 const V=you?[['Portfolio value','$20,000'],['Eligible assets','$17,500'],['Claim: eligible assets exceed $10,000','True']]:[['Claim','Eligible assets exceed $10,000'],['Result','Proof valid ✓'],['Portfolio value','<span class="red">••••••</span>'],['Eligible amount','<span class="red">••••••</span>'],['Holdings','<span class="red">••••••</span>']];
 return shell(`<h2>Proofs</h2><p style="max-width:640px">Selective verification lets you prove one financial fact to a verifier without sharing the rest of your portfolio or history.</p>
<div class="g2" style="gap:16px;align-items:stretch">${EX.map(e=>`<div class="card"><span class="tag x">${e[2]}</span><h3 style="margin-top:12px">${e[0]}</h3><p style="margin:0">${e[1]}</p></div>`).join('')}</div>
<h3 style="margin:28px 0 12px">How a zero-knowledge proof works</h3>
<div class="g3">${[['1 · Private input','Your balances and holdings stay with you. The proof is built from them on your side.'],['2 · Public statement','A small claim anyone can check: “eligible assets exceed $10,000”.'],['3 · Verifier checks','The verifier learns the claim is true, and nothing about the exact amounts.']].map(a=>`<div class="card"><h3>${a[0]}</h3><p style="margin:0">${a[1]}</p></div>`).join('')}</div>
<div class="card" style="margin-top:28px"><h3 style="margin-top:0">Prove “eligible assets exceed $10,000”</h3><p>Fictional portfolio: $20,000, of which $17,500 is in assets this example treats as eligible.</p>
${p.st==0?'<button class="btn p" data-act="prove">Generate proof</button>':p.st==1?'<button class="btn" disabled><span class="sp"></span>Generating (simulated)…</button>':`<div class="seg" role="group" style="margin-bottom:8px"><button data-pv="you" class="${you?'on':''}">You see</button><button data-pv="ver" class="${you?'':'on'}">Verifier sees</button></div>${V.map(r=>`<div class="row"><span>${r[0]}</span><span>${r[1]}</span></div>`).join('')}<div style="margin-top:12px">${tag('Verifiable')} <button class="btn" data-act="pr" style="margin-left:8px">Start over</button></div>`}</div>
<div class="card" style="margin-top:16px"><h3>Verification history</h3><p class="demo">Example entries</p><table><tr><th>Claim</th><th>Verifier</th><th>Status</th></tr>${[['Portfolio ≥ $5,000','Lender A','Verified'],['Eligible assets > $10,000','Venue B','Verified'],['Asset held: ETH','Auditor C','Expired']].map(r=>`<tr><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]=='Verified'?'<span class="tag s">Verified</span>':'<span class="tag">Expired</span>'}</td></tr>`).join('')}</table></div>
<p class="demo" style="margin-top:12px;max-width:640px">A proof does not make past public activity private, and the verifier still learns the claim you chose to prove and that you made it.</p>`,'proofs')}
/* ---------- proofs ---------- */
function proofsOld(){
 const p=S.p,ok=TOTAL>=p.thr;
 return shell(`<h2>Proofs</h2><p style="max-width:620px">A zero-knowledge proof shows a statement is true without revealing the data behind it. Anyone can verify it; nobody learns your exact balance.</p>
<div class="card" style="max-width:560px"><span class="tag x">Experimental · simulated</span><h3 style="margin-top:12px">Prove “I hold at least $${p.thr.toLocaleString()}”</h3>
<label for="th">Threshold (USD)</label><input id="th" type="range" min="1000" max="30000" step="1000" value="${p.thr}" data-thr>
<div class="row"><span>Verifier sees</span><span>“Balance ≥ $${p.thr.toLocaleString()}” · ${ok?'true':'cannot be proven'}</span></div><div class="row"><span>Verifier does not see</span><span class="red">••••••</span></div>
${p.st==0?`<button class="btn p" style="margin-top:12px" data-act="prove" ${ok?'':'disabled'}>Generate proof</button>${ok?'':'<p class="demo">Your demo balance is below this threshold.</p>'}`:p.st==1?'<button class="btn" disabled style="margin-top:12px"><span class="sp"></span>Generating…</button>':`<div class="pop"><span class="tag s">Publicly verifiable (simulated)</span><p>Proof id demo-7f21…aa — verified against public rules.</p><button class="btn" data-act="pr" style="margin-top:8px">Create another</button></div>`}</div>
<div class="card" style="margin-top:16px"><h3>Verification history</h3><p class="demo">Example entries</p><table><tr><th>Claim</th><th>Verifier</th><th>Status</th></tr>${[['Balance ≥ $5,000','Lender A','Verified'],['Balance ≥ $10,000','Venue B','Verified'],['Asset held: ETH','Auditor C','Expired']].map(r=>`<tr><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]=='Verified'?'<span class="tag s">Verified</span>':'<span class="tag">Expired</span>'}</td></tr>`).join('')}</table></div>`,'proofs')}
function activity(){return shell(`<h2>Activity</h2><p>Private transaction and trading history for the account owner. Entries shown here are fictional demo records.</p>${S.w!='on'?gate():`<div class="card">${actList(4)}</div>`}`,'activity')}
function prefs(){
 const T=[['auto','Hide balances by default'],['warn','Warn before public transactions'],['proto','Use protected execution when available']];
 return shell(`<h2>Settings</h2><p>Wallet connection, recovery readiness, and privacy preferences.</p><div class="card" style="max-width:560px;margin-bottom:16px"><h3>Wallet & account</h3><div class="row"><span>Status</span><span>${S.w=='on'?'Connected (demo) '+addr:'Not connected'}</span></div><div class="row"><span>Network</span><span>${S.net}</span></div><div class="row"><span>Account</span><span>Demo user · no real account</span></div><div class="row"><span>Recovery</span><span class="tag x">Not configured · concept</span></div><a class="btn" href="#wallet" style="display:inline-block;margin-top:12px">Wallet and recovery details</a></div><div class="card" style="max-width:560px"><h3>Privacy preferences</h3>${T.map(t=>`<div class="tgl"><span>${t[1]}</span><button class="sw ${S.pref[t[0]]?'on':''}" role="switch" aria-checked="${S.pref[t[0]]}" aria-label="${t[1]}" data-pref="${t[0]}"></button></div>`).join('')}<p class="demo" style="margin-top:12px">Veil will never ask for a seed phrase or private key.</p></div>`,'prefs')}
/* ---------- router ---------- */
const PG={overview:landing,learn:learn,app:dash,wallet:walletPage,payments:payments,exchange:exchangePage,trade:trade,portfolio:portfolio,proofs:proofs,activity:activity,prefs:prefs};
function pageMarkup(){const k=location.hash.slice(1)||'overview';return (PG[k]||landing)();}
function go(f){f();requestRender()}

function installDelegatedHandlers(root){
root.addEventListener('pointermove',e=>{
 const wrap=e.target.closest('[data-chart]'),svg=e.target.closest('svg');if(!wrap||!svg)return;
 const rect=svg.getBoundingClientRect(),wrapRect=wrap.getBoundingClientRect(),W=760,H=270,px=(e.clientX-rect.left)/rect.width*W,py=(e.clientY-rect.top)/rect.height*H,left=Number(wrap.dataset.left),plotw=Number(wrap.dataset.plotw),top=Number(wrap.dataset.top),ploth=Number(wrap.dataset.ploth);
 if(!rect.width||px<left||px>left+plotw)return;
 const data=JSON.parse(decodeURIComponent(wrap.dataset.candles)),index=Math.max(0,Math.min(data.length-1,Math.floor((px-left)/plotw*data.length))),c=data[index],x=left+(index+.5)*plotw/data.length,closeY=top+(Number(wrap.dataset.high)-c.close)/(Number(wrap.dataset.high)-Number(wrap.dataset.low))*ploth;
 const line=wrap.querySelector('[data-cross]'),point=wrap.querySelector('[data-point]'),tip=wrap.querySelector('[data-tip]'),readout=wrap.querySelector('[data-readout]');
 line.setAttribute('x1',x);line.setAttribute('x2',x);line.style.display='';point.setAttribute('cx',x);point.setAttribute('cy',closeY);point.style.display='';
 const date=new Date(c.time).toLocaleString([],{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'});
 readout.innerHTML=`<b>${date}</b><span>O ${money(c.open)}</span><span>H ${money(c.high)}</span><span>L ${money(c.low)}</span><span>C ${money(c.close)}</span>`;
 tip.textContent=money(c.close);tip.style.left=((rect.left-wrapRect.left)+(x/W*rect.width))+'px';tip.style.top=((rect.top-wrapRect.top)+(closeY/H*rect.height))+'px';tip.style.display='';
});
root.addEventListener('pointerout',e=>{
 const wrap=e.target.closest('[data-chart]');if(!wrap||wrap.contains(e.relatedTarget))return;
 wrap.querySelector('[data-cross]').style.display='none';wrap.querySelector('[data-point]').style.display='none';wrap.querySelector('[data-tip]').style.display='none';wrap.querySelector('[data-readout]').textContent='Move over a candle for OHLC details';
});
root.addEventListener('click',e=>{
 const b=e.target.closest('[data-act],[data-priv],[data-view],[data-side],[data-pref],[data-scroll],[data-mk],[data-tf],[data-ttf],[data-ms],[data-cat],[data-mode],[data-mkt],[data-route],[data-pv],[data-pay-mode]');if(!b)return;const d=b.dataset;
 if(d.scroll){e.preventDefault();document.getElementById(d.scroll).scrollIntoView({behavior:'smooth'});return}
 if(d.cat)return go(()=>{S.t.cat=d.cat;S.t.tok=TM[d.cat][0][0];S.t.step=0;S.t.q=''});
 if(d.mode)return go(()=>{S.t.mode=d.mode;S.t.step=0});
 if(d.mkt)return go(()=>{S.t.tok=d.mkt;S.t.step=0});
 if(d.route)return go(()=>{S.t.route=d.route;S.t.step=0});
 if(d.pv)return go(()=>S.p.v=d.pv);
 if(d.payMode)return go(()=>{S.pay.mode=d.payMode;S.pay.step=0});
 if(d.mk)return go(()=>{S.m.a=d.mk;S.m.st=0});
 if(d.tf)return go(()=>S.m.tf=d.tf);
 if(d.ttf)return go(()=>S.t.tf=d.ttf);
 if(d.ms)return go(()=>{S.m.side=d.ms;S.m.st=0});
 if(d.priv)return go(()=>S.priv=S.priv==d.priv?null:d.priv);
 if(d.view)return go(()=>S.view=d.view);
 if(d.side)return go(()=>S.t.side=d.side);
 if(d.pref)return go(()=>S.pref[d.pref]=!S.pref[d.pref]);
 const a=d.act;
 if(a=='nav')go(()=>S.nav=!S.nav);
 if(a=='hide')go(()=>S.hide=!S.hide);
 if(a=='wallet-deposit'||a=='wallet-withdraw')go(()=>{S.wallet.mode=a==='wallet-deposit'?'deposit':'withdraw';S.wallet.step=1});
 if(a=='wallet-confirm')go(()=>{ACT.unshift([`${S.wallet.mode==='deposit'?'Demo deposit':'Demo withdrawal'} ${S.wallet.amount} ${S.wallet.asset}`,'Demo only','Just now']);S.wallet.step=2});
 if(a=='wallet-cancel')go(()=>{S.wallet.mode='';S.wallet.step=0});
 if(a=='send-review')go(()=>S.pay.step=1);
 if(a=='send-cancel')go(()=>S.pay.step=0);
 if(a=='send-reset')go(()=>{S.pay.step=0;S.pay.recipient='';S.pay.amount='100'});
 if(a=='send-confirm'){S.pay.step=2;requestRender();setTimeout(()=>{ACT.unshift([`Demo send ${S.pay.amount} ${S.pay.asset} · ${S.pay.recipient}`,'Demo only','Just now']);S.pay.step=3;requestRender()},1100)}
 if(a=='copy-address'){const copied=navigator.clipboard?.writeText('veil1demo8m4k2p7xq9n3v6t');if(copied)copied.then(()=>{S.pay.copied=true;requestRender()}).catch(()=>{S.pay.copied=false;requestRender()});else{S.pay.copied=false;requestRender()}}
 if(a=='exchange-flip')go(()=>{[S.exchange.from,S.exchange.to]=[S.exchange.to,S.exchange.from];S.exchange.step=0});
 if(a=='exchange-review')go(()=>S.exchange.step=1);
 if(a=='exchange-confirm')go(()=>{const q=S.exchange;ACT.unshift([`Demo exchange ${q.amount} ${q.from} → ${q.to}`,'Demo only','Just now']);S.exchange.step=2});
 if(a=='exchange-cancel'||a=='exchange-reset')go(()=>S.exchange.step=0);
 if(a=='wallet'){if(S.w=='on')return go(()=>S.w='off');if(S.w=='off'){S.w='connecting';requestRender();setTimeout(()=>{S.w='on';requestRender()},1200)}}
 if(a=='mgo'){S.m.st=1;requestRender();setTimeout(()=>{S.m.st=2;requestRender()},1400)}
 if(a=='mreset')go(()=>S.m.st=0);
 if(a=='review')go(()=>S.t.step=1);
 if(a=='reset')go(()=>{S.t.step=0});
 if(a=='confirm'){S.t.step=2;requestRender();setTimeout(()=>{S.t.step=3;requestRender()},1500)}
 if(a=='prove'){S.p.st=1;requestRender();setTimeout(()=>{S.p.st=2;requestRender()},1400)}
 if(a=='pr')go(()=>S.p.st=0);
});
root.addEventListener('change',e=>{const t=e.target;
 if(t.dataset.net!==undefined)S.net=t.value;
 if(t.dataset.tok!==undefined){S.t.tok=t.value;S.t.step=0}
 if(t.dataset.thr!==undefined){S.p.thr=+t.value;S.p.st=0}
 if(t.dataset.walletAsset!==undefined)S.wallet.asset=t.value;
 if(t.dataset.payAsset!==undefined)S.pay.asset=t.value;
 if(t.dataset.exFrom!==undefined){S.exchange.from=t.value;S.exchange.step=0}
 if(t.dataset.exTo!==undefined){S.exchange.to=t.value;S.exchange.step=0}
 requestRender()});
root.addEventListener('input',e=>{const t=e.target;
 if(t.dataset.q!==undefined){S.t.q=t.value;const p=t.selectionStart;requestRender();const n=document.getElementById('qs');n.focus();n.setSelectionRange(p,p)}
 if(t.dataset.mamt!==undefined){S.m.amt=t.value;S.m.st=0;const p=t.selectionStart;requestRender();const n=document.getElementById('ma');n.focus();n.setSelectionRange(p,p)}
 if(t.dataset.amt!==undefined){S.t.amt=t.value;S.t.step=0;const p=t.selectionStart;requestRender();const n=document.getElementById('am');n.focus();n.setSelectionRange(p,p)}
 if(t.dataset.recipient!==undefined){S.pay.recipient=t.value;requestRender()}
 if(t.dataset.payAmount!==undefined){S.pay.amount=t.value;requestRender()}
 if(t.dataset.exAmount!==undefined){S.exchange.amount=t.value;S.exchange.step=0;requestRender()}
 if(t.dataset.walletAmount!==undefined){S.wallet.amount=t.value;requestRender()}
 if(t.dataset.thr!==undefined){S.p.thr=+t.value;S.p.st=0;requestRender();const n=document.getElementById('th');n.focus()}});
}
function App(){
 const [,setVersion]=useState(0);
 const rootRef=useRef(null);
 requestRender=()=>{
   const root=rootRef.current;
   const el=document.activeElement;
   if(root&&el&&root.contains(el)&&el.matches('input[data-q],input[data-amt],input[data-mamt],input[data-recipient],input[data-pay-amount],input[data-ex-amount],input[data-wallet-amount]')) focusRestore={key:Object.keys(el.dataset).find(k=>['q','amt','mamt','recipient','payAmount','exAmount','walletAmount'].includes(k)),selection:el.selectionStart};
   setVersion(v=>v+1);
 };
 useLayoutEffect(()=>{
   if(!focusRestore||!rootRef.current)return;
   const attr={q:'data-q',amt:'data-amt',mamt:'data-mamt',recipient:'data-recipient',payAmount:'data-pay-amount',exAmount:'data-ex-amount',walletAmount:'data-wallet-amount'}[focusRestore.key];
   const el=rootRef.current.querySelector('['+attr+']');
   if(el){el.focus();if(focusRestore.selection!=null)el.setSelectionRange(focusRestore.selection,focusRestore.selection)}
   focusRestore=null;
 });
 useEffect(()=>{
   const root=rootRef.current;if(!root)return;
   installDelegatedHandlers(root);
   const onHash=()=>{S.nav=false;S.priv=null;requestRender();window.scrollTo(0,0)};
   window.addEventListener('hashchange',onHash);
   return ()=>window.removeEventListener('hashchange',onHash);
 },[]);
 useEffect(()=>{
   let busy=false;
   const load=async()=>{if(busy)return;busy=true;try{await refreshMarketData()}catch{FEED.state='error';FEED.available=0;FEED.updated=Date.now();requestRender()}finally{busy=false}};
   load();const timer=window.setInterval(load,60000);
   return ()=>window.clearInterval(timer);
 },[]);
 return <div ref={rootRef} dangerouslySetInnerHTML={{__html:pageMarkup()}}/>;
}
export default App;

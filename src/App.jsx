import { useState, useMemo, useEffect } from "react";

const age=(bd)=>{if(!bd)return{g:0,h:0};const g=(Date.now()-new Date(bd))/(365.25*864e5);return{g:+(g).toFixed(1),h:+(g*1.03069).toFixed(1)}};
const ageAt=(bd,td)=>{if(!bd||!td)return{g:0,h:0};const g=(new Date(td)-new Date(bd))/(365.25*864e5);return{g:+(g).toFixed(1),h:+(g*1.03069).toFixed(1)}};
// ── قواعد احتساب الأشهر في نظام التأمينات الاجتماعية ──────────
// قبل 01/02/2022: نفس الشهر=شهر كامل، البداية=شهر كامل، النهاية فقط إذا اكتملت
// من 01/02/2022: احتساب بالأيام (أيام الشهر ÷ إجمالي أيامه)
const GOSI_CUT=new Date('2022-02-01');
const _gldG=d=>{const dt=new Date(d);return new Date(dt.getFullYear(),dt.getMonth()+1,0).getDate()===dt.getDate()};
const _oldG=(s,e)=>{const sd=new Date(s),ed=new Date(e);if(sd.getFullYear()===ed.getFullYear()&&sd.getMonth()===ed.getMonth())return 1;return(ed.getFullYear()-sd.getFullYear())*12+(ed.getMonth()-sd.getMonth())+(_gldG(e)?1:0)};
const _newG=(s,e)=>{const sd=new Date(s),ed=new Date(e);let tot=0,cur=new Date(sd.getFullYear(),sd.getMonth(),1);while(cur<=ed){const nxt=new Date(cur.getFullYear(),cur.getMonth()+1,1);const dim=Math.round((nxt-cur)/864e5);const rs=sd>cur?sd:cur;const re=ed<new Date(nxt-864e5)?ed:new Date(nxt-864e5);if(re>=rs)tot+=(Math.round((re-rs)/864e5)+1)/dim;cur=nxt}return tot};
const mdf=(s,e)=>{if(!s||!e)return{m:0,d:0,t:0};const a=new Date(s),b=new Date(e);if(isNaN(a)||isNaN(b)||b<a)return{m:0,d:0,t:0};const tot=b<GOSI_CUT?_oldG(s,e):a>=GOSI_CUT?_newG(s,e):_oldG(s,new Date(+GOSI_CUT-864e5).toISOString().split('T')[0])+_newG('2022-02-01',e);const m=Math.floor(tot);return{m,d:Math.round((tot-m)*30),t:tot}};
const fmt=n=>new Intl.NumberFormat('en-US',{maximumFractionDigits:2}).format(n);
const fI=n=>new Intl.NumberFormat('en-US',{maximumFractionDigits:0}).format(n);
const fMD=t=>{const m=Math.floor(t);const d=Math.round((t-m)*30);return d>0?m+' شهر و '+d+' يوم':m+' شهر';};
const MA=['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];

// ── تقويم أم القرى ──────────────────────────────────────────
const dateToHijriParts=d=>{if(!d)return null;try{const p=new Intl.DateTimeFormat('en-u-ca-islamic-umalqura',{day:'numeric',month:'numeric',year:'numeric'}).formatToParts(new Date(d));const r={};for(const x of p){if(x.type==='year')r.hy=+x.value;else if(x.type==='month')r.hm=+x.value;else if(x.type==='day')r.hd=+x.value}return r.hy?r:null}catch{return null}};
const isoToHijriStr=iso=>{if(!iso)return'';const h=dateToHijriParts(iso);return h?`${h.hy}/${String(h.hm).padStart(2,'0')}/${String(h.hd).padStart(2,'0')}`:'';};
const hijriStrToIso=str=>{if(!str)return'';const m=str.replace(/\//g,'-').match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);if(!m)return'';const hy=+m[1],hm=+m[2],hd=+m[3];if(hy<1300||hy>1500||hm<1||hm>12||hd<1||hd>30)return'';const est=new Date(Date.UTC(622,6,16)+((hy-1)*354.367+(hm-1)*29.53+hd-1)*864e5);for(let o=-5;o<=5;o++){const d=new Date(est.getTime()+o*864e5);const h=dateToHijriParts(d);if(h&&h.hy===hy&&h.hm===hm&&h.hd===hd)return d.toISOString().split('T')[0]}return est.toISOString().split('T')[0];};
const hijriToDate=(hy,hm,hd)=>{const iso=hijriStrToIso(`${hy}/${String(hm).padStart(2,'0')}/${String(hd).padStart(2,'0')}`);return iso?new Date(iso):null;};
const hijriMonthDays=(hy,hm)=>{const d1=hijriToDate(hy,hm,1);const nm=hm===12?1:hm+1,ny=hm===12?hy+1:hy;const d2=hijriToDate(ny,nm,1);if(!d1||!d2)return 30;return Math.round((d2-d1)/864e5);};
const _gldH=iso=>{const h=dateToHijriParts(iso);return h?h.hd===hijriMonthDays(h.hy,h.hm):false};
const _oldH=(s,e)=>{const a=dateToHijriParts(s),b=dateToHijriParts(e);if(!a||!b)return 0;if(a.hy===b.hy&&a.hm===b.hm)return 1;return(b.hy-a.hy)*12+(b.hm-a.hm)+(_gldH(e)?1:0)};
const _newH=(s,e)=>{const a=dateToHijriParts(s),b=dateToHijriParts(e);if(!a||!b)return 0;let tot=0,hy=a.hy,hm=a.hm;const sd=new Date(s),ed=new Date(e);while(hy<b.hy||(hy===b.hy&&hm<=b.hm)){const mS=hijriToDate(hy,hm,1);if(!mS)break;const nhy=hm===12?hy+1:hy,nhm=hm===12?1:hm+1;const mEN=hijriToDate(nhy,nhm,1);if(!mEN)break;const mE=new Date(mEN.getTime()-864e5);const dim=Math.round((mE-mS)/864e5)+1;const rs=sd>mS?sd:mS;const re=ed<mE?ed:mE;if(re>=rs)tot+=(Math.round((re-rs)/864e5)+1)/dim;if(hm===12){hy++;hm=1}else hm++}return tot};
const mdfH=(s,e)=>{if(!s||!e)return{m:0,d:0,t:0};const a=new Date(s),b=new Date(e);if(isNaN(a)||isNaN(b)||b<a)return{m:0,d:0,t:0};const tot=b<GOSI_CUT?_oldH(s,e):a>=GOSI_CUT?_newH(s,e):_oldH(s,new Date(+GOSI_CUT-864e5).toISOString().split('T')[0])+_newH('2022-02-01',e);const m=Math.floor(tot);return{m,d:Math.round((tot-m)*30),t:tot}};
const mdfCal=(s,e,cal)=>cal==='h'?mdfH(s,e):mdf(s,e);
const hijriGap=(dA,dB)=>{const a=dateToHijriParts(dA),b=dateToHijriParts(dB);if(!a||!b){const ce=new Date(dA),re=new Date(dB);let dY=re.getFullYear()-ce.getFullYear(),dM=re.getMonth()-ce.getMonth(),dD=re.getDate()-ce.getDate();if(dD<0){dM--;dD+=new Date(re.getFullYear(),re.getMonth(),0).getDate()}if(dM<0){dY--;dM+=12}return{dY:Math.max(0,dY),dM:Math.max(0,dM),dD:Math.max(0,dD)}}let dD=b.hd-a.hd,dM=b.hm-a.hm,dY=b.hy-a.hy;if(dD<0){dM--;dD+=30}if(dM<0){dY--;dM+=12}return{dY:Math.max(0,dY),dM:Math.max(0,dM),dD:Math.max(0,dD)};};
const HM=['محرم','صفر','ربيع الأول','ربيع الثاني','جمادى الأولى','جمادى الثانية','رجب','شعبان','رمضان','شوال','ذو القعدة','ذو الحجة'];
const fmtHijri=iso=>{if(!iso)return'';const h=dateToHijriParts(iso);return h?`${h.hd} ${HM[h.hm-1]} ${h.hy}هـ`:'';};
const rdFromAge=(bd,yrs)=>{if(!bd||!yrs||isNaN(yrs)||+yrs<=0)return'';const b=new Date(bd),y=Math.floor(+yrs),mo=Math.round((+yrs-y)*12);return new Date(b.getFullYear()+y,b.getMonth()+mo,b.getDate()).toISOString().split('T')[0];};
const hijriRetAgeCalc=(bd,rd)=>{if(!bd||!rd)return null;const bH=dateToHijriParts(bd),rH=dateToHijriParts(rd);if(!bH||!rH)return null;let yrs=rH.hy-bH.hy,mths=rH.hm-bH.hm,days=rH.hd-bH.hd;if(days<0){mths--;days+=hijriMonthDays(rH.hm===1?bH.hy:rH.hy,rH.hm===1?12:rH.hm-1)||30}if(mths<0){yrs--;mths+=12}return{yrs:Math.max(0,yrs),mths:Math.max(0,mths)};};
const rdFromHijriAge=(bd,hYrs)=>{if(!bd||!hYrs||isNaN(hYrs)||+hYrs<=0)return'';const bH=dateToHijriParts(bd);if(!bH)return'';const totalM=Math.round(+hYrs*12);const hy=bH.hy+Math.floor((bH.hm-1+totalM)/12);const hm=((bH.hm-1+totalM)%12)+1;const hd=Math.min(bH.hd,hijriMonthDays(hy,hm)||30);return hijriStrToIso(`${hy}/${String(hm).padStart(2,'0')}/${String(hd).padStart(2,'0')}`)||'';};

// ── شرائح الاشتراك الاختياري ─────────────────────────────────
const BK=[1200,1400,1600,1800,2000,2200,2400,2600,2800,3000,3300,3600,3900,4200,4600,5000,5500,6000,6600,7200,7900,8600,9400,10300,11300,12400,13600,14900,16300,17800,19600,21600,23800,26200,28800,31700,34900,38400,42200,45000];
const nextBK=c=>{const i=BK.indexOf(c);return i>=0&&i<39?BK[i+1]:c};
const allowedBK=last=>{if(!last||last<=0)return BK;const cap=Math.min(last,45000);const mx=cap*1.1;return BK.filter(b=>b>=cap&&b<=mx).concat(BK.filter(b=>b>mx&&b<=45000).slice(0,1))};

// ── الجدول الاكتواري م/53 ─────────────────────────────────────
const AT={1:1.04,2:1.0816,3:1.12486,4:1.16986,5:1.21665,6:1.26532,7:1.31593,8:1.36857,9:1.42331,10:1.48024,11:1.53945,12:1.60103,13:1.66507,14:1.73168,15:1.80094,16:1.87298,17:1.9479,18:2.02582,19:2.10685,20:2.19112,21:2.27877,22:2.30992,23:2.46472,24:2.5633,25:2.66584,26:2.77247,27:2.88337,28:2.9987,29:3.11865,30:3.2434,31:3.37313,32:3.50806,33:3.64838,34:3.79432,35:3.94609,36:4.10393,37:4.26809,38:4.43881,39:4.61637,40:4.80102};
const actCalc=(y,m,d)=>{if(y<=0&&m<=0)return{aM:0,base:1,next:1,diff:0,final:1};const aM=d>=15?m+1:m,cy=Math.min(Math.max(y,1),40);const base=AT[cy],next=y>=40?AT[40]:AT[Math.min(cy+1,40)];const diff=+(next-base).toFixed(5),final=+(base+(diff*aM/12)).toFixed(5);return{aM,base,next,diff,final};};

// ── جداول التعديلات 3/7/2024م ────────────────────────────────
const RA=[{mn:48.5,rY:58,rM:0},{mn:48,mx:48.5,rY:58,rM:4},{mn:47,mx:48,rY:58,rM:8},{mn:46,mx:47,rY:59,rM:0},{mn:45,mx:46,rY:59,rM:4},{mn:44,mx:45,rY:59,rM:8},{mn:43,mx:44,rY:60,rM:0},{mn:42,mx:43,rY:60,rM:4},{mn:41,mx:42,rY:60,rM:8},{mn:40,mx:41,rY:61,rM:0},{mn:39,mx:40,rY:61,rM:4},{mn:38,mx:39,rY:61,rM:8},{mn:37,mx:38,rY:62,rM:0},{mn:36,mx:37,rY:62,rM:4},{mn:35,mx:36,rY:62,rM:8},{mn:34,mx:35,rY:63,rM:0},{mn:33,mx:34,rY:63,rM:4},{mn:32,mx:33,rY:63,rM:8},{mn:31,mx:32,rY:64,rM:0},{mn:30,mx:31,rY:64,rM:4},{mn:29,mx:30,rY:64,rM:8},{mn:0,mx:29,rY:65,rM:0}];
const ET=[{mnM:228,req:300,y:25},{mnM:216,mxM:227,req:312,y:26},{mnM:204,mxM:215,req:324,y:27},{mnM:192,mxM:203,req:336,y:28},{mnM:180,mxM:191,req:348,y:29},{mnM:0,mxM:179,req:360,y:30}];

const retInfo=(bd,mRAtRF)=>{
  if(!bd)return{rY:60,rM:0,lb:'60 سنة',dt:null,ex:false,eR:300,eY:25,aR:0,aRH:{yrs:0,mths:0}};
  const bdH=dateToHijriParts(bd),rfH=dateToHijriParts('2024-07-03');
  let aHYrs=rfH&&bdH?rfH.hy-bdH.hy:0,aHMths=rfH&&bdH?rfH.hm-bdH.hm:0,aHDays=rfH&&bdH?rfH.hd-bdH.hd:0;
  if(aHDays<0){aHMths--;aHDays+=30}if(aHMths<0){aHYrs--;aHMths+=12}
  const aH=Math.max(0,aHYrs+aHMths/12);
  const ex=aH>=48.5||mRAtRF>=240;
  let rY=60,rM=0;
  if(!ex)for(const r of RA){if(aH>=r.mn&&(!r.mx||aH<r.mx)){rY=r.rY;rM=r.rM;break}}
  let dt=null;
  if(bdH){
    const bTM=(bdH.hy-1)*12+(bdH.hm-1),rTM=bTM+rY*12+rM;
    const retHy=Math.floor(rTM/12)+1,retHm=(rTM%12)+1;
    const retHd=Math.min(bdH.hd,hijriMonthDays(retHy,retHm)||29);
    const iso=hijriStrToIso(`${retHy}/${String(retHm).padStart(2,'0')}/${String(retHd).padStart(2,'0')}`);
    dt=iso?new Date(iso):new Date(new Date(bd).getFullYear()+rY,new Date(bd).getMonth()+rM,new Date(bd).getDate());
  } else dt=new Date(new Date(bd).getFullYear()+rY,new Date(bd).getMonth()+rM,new Date(bd).getDate());
  let eR=300,eY=25;
  if(!ex)for(const r of ET){if(mRAtRF>=r.mnM&&(!r.mxM||mRAtRF<=r.mxM)){eR=r.req;eY=r.y;break}}
  return{rY,rM,lb:`${rY} سنة هجرية${rM>0?` و ${rM} شهراً`:''}`,dt,ex,eR,eY,aR:+aH.toFixed(1),aRH:{yrs:aHYrs,mths:aHMths}};
};

const SYS=['تأمينات - قطاع خاص','تأمينات - قطاع حكومي','تقاعد مدني','تقاعد عسكري','اشتراك اختياري'];

// ── حفظ البيانات محلياً ────────────────────────────────────────
const LS_KEY='gosi_calc_v2';
const lsLoad=k=>{try{const v=localStorage.getItem(LS_KEY);return v?JSON.parse(v)[k]:null}catch{return null}};

export default function App(){
  const[tab,setTab]=useState('merged');
  const[periods,setPeriods]=useState(()=>lsLoad('periods')||[]);
  const[info,setInfo]=useState(()=>lsLoad('info')||{bd:'',rd:''});
  const[retAge,setRetAge]=useState(()=>lsLoad('retAge')||'');
  const[retAgeH,setRetAgeH]=useState(()=>lsLoad('retAgeH')||'');
  const[deps,setDeps]=useState(()=>lsLoad('deps')||0);
  const[sals,setSals]=useState(()=>lsLoad('sals')||Array(24).fill(0));
  const[target,setTarget]=useState(()=>lsLoad('target')||0);
  const[mergedPeriods,setMergedPeriods]=useState(()=>lsLoad('mergedPeriods')||false);
  const[transferProgram,setTransferProgram]=useState(()=>lsLoad('transferProgram')||false);
  const[bdCal,setBdCal]=useState(()=>lsLoad('bdCal')||'g');
  const[bdH,setBdH]=useState(()=>lsLoad('bdH')||'');
  const[rdH,setRdH]=useState(()=>lsLoad('rdH')||'');
  const[mandRaise,setMandRaise]=useState(()=>lsLoad('mandRaise')??10);

  // حفظ تلقائي عند كل تغيير
  useEffect(()=>{try{localStorage.setItem(LS_KEY,JSON.stringify({periods,info,retAge,retAgeH,deps,sals,target,mergedPeriods,transferProgram,bdCal,bdH,rdH,mandRaise}))}catch{}},[periods,info,retAge,retAgeH,deps,sals,target,mergedPeriods,transferProgram,bdCal,bdH,rdH,mandRaise]);

  const handleRdChange=v=>{setInfo(p=>({...p,rd:v}));setRdH(isoToHijriStr(v));if(info.bd&&v){const a=ageAt(info.bd,v);setRetAge(a.g>0?String(a.g):'');const hA=hijriRetAgeCalc(info.bd,v);if(hA)setRetAgeH(String(+(hA.yrs+hA.mths/12).toFixed(2)));} };
  const handleRdHijriChange=v=>{setRdH(v);const iso=hijriStrToIso(v);if(iso){setInfo(p=>({...p,rd:iso}));if(info.bd){const a=ageAt(info.bd,iso);setRetAge(a.g>0?String(a.g):'');const hA=hijriRetAgeCalc(info.bd,iso);if(hA)setRetAgeH(String(+(hA.yrs+hA.mths/12).toFixed(2)));}}};
  const handleAgeChange=v=>{setRetAge(v);if(info.bd&&v&&+v>0){const rd=rdFromAge(info.bd,+v);if(rd){setInfo(p=>({...p,rd}));const hA=hijriRetAgeCalc(info.bd,rd);if(hA)setRetAgeH(String(+(hA.yrs+hA.mths/12).toFixed(2)));}}};
  const handleAgeHChange=v=>{setRetAgeH(v);if(info.bd&&v&&+v>0){const rd=rdFromHijriAge(info.bd,+v);if(rd){setInfo(p=>({...p,rd}));const a=ageAt(info.bd,rd);setRetAge(a.g>0?String(a.g):'');}}};
  const handleBdHijri=v=>{setBdH(v);const iso=hijriStrToIso(v);if(iso){setInfo(p=>({...p,bd:iso}));if(info.rd){const a=ageAt(iso,info.rd);setRetAge(a.g>0?String(a.g):'')}}};
  const handleBdCal=nc=>{setBdCal(nc);if(nc==='h')setBdH(isoToHijriStr(info.bd))};

  const aEnd=useMemo(()=>info.rd||new Date().toISOString().split('T')[0],[info.rd]);
  const s24=useMemo(()=>{const e=info.rd?new Date(info.rd):new Date();return Array.from({length:24},(_,i)=>{const d=new Date(e.getFullYear(),e.getMonth()-i,1);return`${MA[d.getMonth()]} ${d.getFullYear()}`}).reverse();},[info.rd]);

  const ps=useMemo(()=>{
    let oM=0,nM=0,vM=0,cM=0,wM=0,lS=0;
    const sd=[...periods].sort((a,b)=>new Date(a.sd)-new Date(b.sd));
    sd.forEach(p=>{if(p.st==='مستبعد')return;const e=p.ac?aEnd:p.ed;const c=mdfCal(p.sd,e,p.cal||'g');const m=c.t;
      if(p.sy==='تقاعد مدني')cM+=m;else if(p.sy==='تقاعد عسكري')wM+=m;
      else if(p.sy==='اشتراك اختياري')vM+=m;else{new Date(p.sd)<new Date('2001-04-25')?oM+=m:nM+=m}
      const ts=(p.sl||0)+(p.hs||0)+(p.cm||0);if(ts>0)lS=ts});
    return{oM,nM,vM,cM,wM,tM:oM+nM+vM+cM+wM,lS,sd};
  },[periods,aEnd]);

  const psAtRF=useMemo(()=>{
    const RF_ISO='2024-07-03';let oM=0,nM=0,vM=0,cM=0,wM=0;
    [...periods].sort((a,b)=>new Date(a.sd)-new Date(b.sd)).forEach(p=>{
      if(p.st==='مستبعد'||!p.sd||new Date(p.sd)>=new Date(RF_ISO))return;
      const eEnd=(p.ac||!p.ed)?RF_ISO:(p.ed>RF_ISO?RF_ISO:p.ed);
      const c=mdfCal(p.sd,eEnd,p.cal||'g');const m=c.t;
      if(p.sy==='تقاعد مدني')cM+=m;else if(p.sy==='تقاعد عسكري')wM+=m;
      else if(p.sy==='اشتراك اختياري')vM+=m;
      else{new Date(p.sd)<new Date('2001-04-25')?oM+=m:nM+=m}
    });
    return{oM,nM,vM,cM,wM,tM:oM+nM+vM+cM+wM};
  },[periods]);

  const s60=useMemo(()=>{
    let all=[];ps.sd.filter(p=>p.st!=='مستبعد'&&((p.sl||0)+(p.hs||0)+(p.cm||0))>0).forEach(p=>{
      const c=mdfCal(p.sd,p.ac?aEnd:p.ed,p.cal||'g');const psl=(p.sl||0)+(p.hs||0)+(p.cm||0);for(let i=0;i<c.t;i++)all.push(psl)});
    return all.length>=60?all[all.length-60]:(all[0]||0);
  },[ps,aEnd]);

  const avg=useMemo(()=>{const f=sals.filter(s=>s>0);return f.length?f.reduce((a,b)=>a+b,0)/f.length:0},[sals]);
  const r150=useMemo(()=>{if(!s60)return{on:false,app:Math.min(avg,45000)};const l=Math.min(s60*1.5,45000);return{on:true,l,ov:avg>l,app:avg>l?l:avg};},[s60,avg]);

  const tf=useMemo(()=>{
    const cp=periods.filter(p=>(p.sy==='تقاعد مدني'||p.sy==='تقاعد عسكري')&&p.st!=='مستبعد');
    if(!cp.length||!info.rd)return{has:false,act:{aM:0,base:1,next:1,diff:0,final:1},product:0,adj:0,pen:0,penNoMerge:0,pen1:0,pen2:0,cS:0,cM:0,cY:0,iY:0,tY:0,dY:0,dM:0,dD:0,cEnd:'',split:false,lastSys:''};
    const lc=cp[cp.length-1],cS=lc.sl||0,cEnd=lc.ac?aEnd:lc.ed;
    let cM=0;cp.forEach(p=>{cM+=mdfCal(p.sd,p.ac?aEnd:p.ed,p.cal||'g').t});
    const cY=cM/12,iM=ps.oM+ps.nM+ps.vM,iY=iM/12,tY=cY+iY;
    const penNoMerge=+(cS*cM/480).toFixed(2);
    const allSorted=[...periods].filter(p=>p.st!=='مستبعد').sort((a,b)=>new Date(a.sd)-new Date(b.sd));
    const lastSys=(allSorted[allSorted.length-1]?.sy||'').includes('تقاعد')?'تقاعد':'تأمينات';
    if(!cEnd)return{has:true,act:{aM:0,base:1,next:1,diff:0,final:1},product:0,adj:0,pen:0,penNoMerge,pen1:0,pen2:0,cS,cM,cY,iY,tY,dY:0,dM:0,dD:0,cEnd:'',split:false,lastSys};
    if(lastSys==='تقاعد'){const pen=+(cS*tY/40).toFixed(2);return{has:true,act:{aM:0,base:1,next:1,diff:0,final:1},product:cS,adj:cS,pen,penNoMerge,pen1:pen,pen2:0,cS,cM,cY,iY,tY,dY:0,dM:0,dD:0,cEnd,split:false,lastSys};}
    const{dY,dM,dD}=hijriGap(cEnd,info.rd);
    const act=actCalc(dY,dM,dD);
    const product=+(cS*act.final).toFixed(2),insAvg=avg||0;
    if(insAvg<=0){const pen=+(product*cY/40).toFixed(2);return{has:true,act,product,adj:product,pen,penNoMerge,pen1:pen,pen2:0,cS,cM,cY,iY,tY,dY,dM,dD,cEnd,split:false,lastSys};}
    if(product>insAvg){const pen=+(insAvg*tY/40).toFixed(2);return{has:true,act,product,adj:insAvg,pen,penNoMerge,pen1:pen,pen2:0,cS,cM,cY,iY,tY,dY,dM,dD,cEnd,split:false,lastSys,exceeded:true};}
    const pen1=+(product*cY/40).toFixed(2),pen2=+(insAvg*iY/40).toFixed(2),pen=+(pen1+pen2).toFixed(2);
    return{has:true,act,product,adj:product,pen,penNoMerge,pen1,pen2,cS,cM,cY,iY,tY,dY,dM,dD,cEnd,split:true,lastSys,exceeded:false};
  },[periods,info.rd,aEnd,avg,ps]);

  const ri=useMemo(()=>retInfo(info.bd,psAtRF.tM),[info.bd,psAtRF]);
  const rAge=useMemo(()=>info.bd&&info.rd?ageAt(info.bd,info.rd):null,[info.bd,info.rd]);
  const hijriRetAge=useMemo(()=>hijriRetAgeCalc(info.bd,info.rd),[info.bd,info.rd]);

  const hasMixedSys=useMemo(()=>{
    const ins=periods.some(p=>!p.sy.includes('تقاعد')&&p.sy!=='اشتراك اختياري'&&p.st!=='مستبعد');
    const gov=periods.some(p=>(p.sy==='تقاعد مدني'||p.sy==='تقاعد عسكري')&&p.st!=='مستبعد');
    return ins&&gov;
  },[periods]);

  const ageH=useMemo(()=>info.bd?age(info.bd).h:0,[info.bd]);
  const is50H=ageH>=50;
  const minRetAge=(mergedPeriods&&hasMixedSys)?60:(ri.rY+ri.rM/12);

  const pen=useMemo(()=>{
    const _ins=periods.some(p=>!p.sy.includes('تقاعد')&&p.sy!=='اشتراك اختياري'&&p.st!=='مستبعد');
    const _gov=periods.some(p=>(p.sy==='تقاعد مدني'||p.sy==='تقاعد عسكري')&&p.st!=='مستبعد');
    const actMode=(mergedPeriods||transferProgram)&&_ins&&_gov&&tf.has&&tf.pen>0;
    if(actMode){
      let pV=0;ps.sd.filter(p=>p.sy==='اشتراك اختياري'&&p.st!=='مستبعد').forEach(p=>{pV+=(mdfCal(p.sd,p.ac?aEnd:p.ed,p.cal||'g').t*p.sl)/480});
      const t=tf.pen+pV;
      return{pO:0,pN:0,dA:0,pV:+pV.toFixed(2),pC:tf.pen,t:+t.toFixed(2),f:t>0&&t<1983.75?1983.75:+t.toFixed(2),a:+(avg||ps.lS||0).toFixed(2),actMode:true,isMerged:mergedPeriods,isTransfer:transferProgram};
    }
    const a=r150.app;
    const pO=(ps.oM*a)/600,pN=(ps.nM*a)/480;
    const dr=deps>=3?.2:deps===2?.15:deps===1?.1:0;
    const dA=pO*dr;
    let pV=0;ps.sd.filter(p=>p.sy==='اشتراك اختياري'&&p.st!=='مستبعد').forEach(p=>{pV+=(mdfCal(p.sd,p.ac?aEnd:p.ed,p.cal||'g').t*p.sl)/480});
    const pC=tf.has?(tf.penNoMerge||0):0;
    const t=pO+pN+dA+pV+pC;
    return{pO:+pO.toFixed(2),pN:+pN.toFixed(2),dA:+dA.toFixed(2),pV:+pV.toFixed(2),pC,t:+t.toFixed(2),f:t>0&&t<1983.75?1983.75:+t.toFixed(2),a:+a.toFixed(2),actMode:false};
  },[ps,r150,deps,aEnd,tf,mergedPeriods,transferProgram,periods,avg]);

  const vOpts=useMemo(()=>allowedBK(ps.lS),[ps.lS]);
  const addP=()=>setPeriods(p=>[...p,{id:Date.now(),emp:'',sd:'',ed:'',ac:false,sl:0,hs:0,cm:0,sy:SYS[0],st:'منتهي',cal:'g',sdH:'',edH:''}]);
  const upP=(id,f,v)=>setPeriods(pr=>pr.map(p=>p.id===id?{...p,[f]:v}:p));
  const toggleCal=(id,nc)=>setPeriods(pr=>pr.map(p=>p.id!==id?p:{...p,cal:nc,sdH:nc==='h'?isoToHijriStr(p.sd):'',edH:nc==='h'?isoToHijriStr(p.ed):''}));
  const handleHijriDate=(id,field,val)=>setPeriods(pr=>pr.map(p=>{if(p.id!==id)return p;const hf=field==='sd'?'sdH':'edH';const iso=hijriStrToIso(val);return{...p,[hf]:val,...(iso?{[field]:iso}:{})}}));

  const optRows=useMemo(()=>{
    const start=vOpts[vOpts.length-1]||1200;let cur=start;const rows=[];
    const curY=new Date().getFullYear(),retY=info.rd?new Date(info.rd).getFullYear():curY+5;
    for(let i=0;curY+i<=retY&&cur<=45000;i++){rows.push({y:curY+i,b:cur,opt:+(cur*.18).toFixed(0)});cur=nextBK(cur);}
    return rows;
  },[vOpts,info.rd]);

  const mandRows=useMemo(()=>{
    let sal=Math.min(ps.lS||1200,45000);const r=mandRaise/100;
    const curY=new Date().getFullYear(),retY=info.rd?new Date(info.rd).getFullYear():curY+5;
    return Array.from({length:Math.max(1,retY-curY+1)},(_,i)=>{if(i>0)sal=Math.min(Math.round(sal*(1+r)),45000);return{y:curY+i,sal,emp:+(sal*.09).toFixed(0),er:+(sal*.12).toFixed(0),tot:+(sal*.21).toFixed(0)};});
  },[ps.lS,mandRaise,info.rd]);

  // ── Retirement Readiness Score (0-100) ──────────────────────────
  const readiness=useMemo(()=>{
    if(!ps.tM&&!pen.f)return 0;
    const svc=ri.eR>0?Math.min(60,Math.round((psAtRF.tM/ri.eR)*60)):0;
    const penAdq=pen.f>0?Math.min(40,Math.round((pen.f/8000)*40)):0;
    return Math.min(100,svc+penAdq);
  },[psAtRF,pen,ri,ps]);

  // ── Countdown to retirement ──────────────────────────────────────
  const countdown=useMemo(()=>{
    if(!info.rd)return null;
    const ms=Math.max(0,new Date(info.rd)-Date.now());
    const m=Math.round(ms/864e5/30.44);
    return{m,y:Math.floor(m/12),r:m%12};
  },[info.rd]);

  // ── Pension projection across retirement timings ─────────────────
  const projection=useMemo(()=>{
    if(!pen.f||!ps.lS)return[];
    const add=Math.min(ps.lS,45000)/480;
    return[-24,-12,0,12,24,36,60].map(x=>({
      lb:x===0?'مخطط':x>0?`+${x/12}س`:`${x/12}س`,
      pen:Math.max(1983.75,+(pen.f+x*add).toFixed(0)),
      cur:x===0,neg:x<0,
    }));
  },[pen.f,ps.lS]);

  // ── استخراج تقرير PDF (تصميم احترافي) ─────────────────────────
  const printReport=()=>{
    const tStr=new Date().toLocaleDateString('ar-SA',{year:'numeric',month:'long',day:'numeric'});
    const bdStr=info.bd?`${new Date(info.bd).toLocaleDateString('ar-SA')} (${fmtHijri(info.bd)})`:'—';
    const rdStr=info.rd?`${new Date(info.rd).toLocaleDateString('ar-SA')} (${fmtHijri(info.rd)})`:'—';
    const ageStr=info.bd?`${age(info.bd).g} م / ${age(info.bd).h} هـ`:'—';
    // penToday simplified
    const todayISO=new Date().toISOString().split('T')[0];
    let tO=0,tN=0,tV=0;
    periods.filter(p=>p.st!=='مستبعد'&&p.sd&&new Date(p.sd)<=new Date(todayISO)).forEach(p=>{
      const raw=p.ac?todayISO:(p.ed||'');const e=raw>todayISO?todayISO:raw;
      if(!e)return;const c=mdfCal(p.sd,e,p.cal||'g');const m=c.t;
      if(p.sy==='اشتراك اختياري')tV+=m;
      else if(!p.sy.includes('تقاعد')){new Date(p.sd)<new Date('2001-04-25')?tO+=m:tN+=m;}
    });
    const capT=s60?Math.min(ps.lS,Math.min(s60*1.5,45000)):Math.min(ps.lS,45000);
    const penTodayVal=Math.max(0,+(tO*capT/600+tN*capT/480+tV*capT/480).toFixed(0));
    // SVG Gauge
    const gR=52,gCX=68,gCY=70,gW=136,gH=105;
    const gSA=Math.PI*0.72,gEA=Math.PI*2.28,gRng=gEA-gSA;
    const gFA=gSA+gRng*(readiness/100);
    const gAP=(a1,a2,r)=>{const x1=(gCX+r*Math.cos(a1)).toFixed(1),y1=(gCY+r*Math.sin(a1)).toFixed(1),x2=(gCX+r*Math.cos(a2)).toFixed(1),y2=(gCY+r*Math.sin(a2)).toFixed(1),la=(a2-a1)>Math.PI?1:0;return`M${x1} ${y1} A${r} ${r} 0 ${la} 1 ${x2} ${y2}`;};
    const gClr=readiness>=70?'#059669':readiness>=40?'#D97706':'#EF4444';
    const gSegs=[{f:gSA,t:gSA+gRng*0.4,c:'#FCA5A5'},{f:gSA+gRng*0.4,t:gSA+gRng*0.7,c:'#FCD34D'},{f:gSA+gRng*0.7,t:gEA,c:'#6EE7B7'}];
    const gSvg=`<svg viewBox="0 0 ${gW} ${gH}" width="${gW}" height="${gH}">${gSegs.map(s=>`<path d="${gAP(s.f,s.t,gR)}" fill="none" stroke="${s.c}" stroke-width="10" stroke-linecap="butt" opacity="0.45"/>`).join('')}${readiness>0?`<path d="${gAP(gSA,gFA,gR)}" fill="none" stroke="${gClr}" stroke-width="10" stroke-linecap="round"/>`:''}
<text x="${gCX}" y="${gCY-10}" text-anchor="middle" font-size="28" font-weight="900" fill="${gClr}" font-family="Cairo,sans-serif">${readiness}</text>
<text x="${gCX}" y="${gCY+7}" text-anchor="middle" font-size="9" fill="#9CA3AF" font-family="Cairo,sans-serif">من 100</text>
<text x="${gCX}" y="${gCY+23}" text-anchor="middle" font-size="9" fill="${gClr}" font-weight="700" font-family="Cairo,sans-serif">${readiness>=70?'ممتاز ✓':readiness>=50?'جيد':readiness>=30?'متوسط':'يحتاج تطوير'}</text></svg>`;
    // SVG Donut
    const dSl=[{lb:'فترة قديمة',val:pen.actMode?0:pen.pO,clr:'#D97706'},{lb:'فترة جديدة',val:pen.actMode?0:pen.pN,clr:'#3B82F6'},{lb:'بدل إعالة',val:pen.actMode?0:pen.dA,clr:'#10B981'},{lb:'اشتراك اختياري',val:pen.pV,clr:'#7C3AED'},{lb:'معاش مدني/عسكري',val:pen.pC,clr:'#0891B2'}].filter(s=>s.val>0);
    const dTot=dSl.reduce((s,x)=>s+x.val,0)||1;
    const dCX=55,dCY=55,dR=40,dIR=24,dW=110;
    let dAng=-Math.PI/2;
    const dPaths=dSl.map(s=>{const sw=s.val/dTot*Math.PI*2,sa=dAng,ea=sa+sw;dAng=ea;const px=(v,r)=>(dCX+r*Math.cos(v)).toFixed(1),py=(v,r)=>(dCY+r*Math.sin(v)).toFixed(1),la=sw>Math.PI?1:0;return`<path d="M${px(sa,dR)} ${py(sa,dR)} A${dR} ${dR} 0 ${la} 1 ${px(ea,dR)} ${py(ea,dR)} L${px(ea,dIR)} ${py(ea,dIR)} A${dIR} ${dIR} 0 ${la} 0 ${px(sa,dIR)} ${py(sa,dIR)} Z" fill="${s.clr}" stroke="white" stroke-width="1.5"/>`;}).join('');
    const dSvg=`<svg viewBox="0 0 ${dW} ${dW}" width="${dW}" height="${dW}">${dPaths}<circle cx="${dCX}" cy="${dCY}" r="${dIR-1}" fill="white"/><text x="${dCX}" y="${dCY-4}" text-anchor="middle" font-size="7" fill="#9CA3AF" font-family="Cairo,sans-serif">الإجمالي</text><text x="${dCX}" y="${dCY+9}" text-anchor="middle" font-size="9" font-weight="900" fill="#059669" font-family="Cairo,sans-serif">${fI(Math.round(pen.f))}</text></svg>`;
    // SVG Bars
    const bBars=[{lb:'معاش الآن',val:penTodayVal,clr:'#94A3B8'},{lb:'عند التقاعد',val:pen.f,clr:'#059669'}];
    const bMxV=Math.max(...bBars.map(b=>b.val),1);
    const bBW=38,bGp=20,bPT=16,bCH=64,bPB=22,bSX=12;
    const bTW=bSX*2+bBars.length*(bBW+bGp)-bGp;
    const bSvg=`<svg viewBox="0 0 ${bTW} ${bPT+bCH+bPB+8}" width="${bTW}" height="${bPT+bCH+bPB+8}">${bBars.map((b,i)=>{const x=bSX+i*(bBW+bGp),h=Math.max(4,(b.val/bMxV)*bCH),y=bPT+bCH-h;return`<rect x="${x}" y="${y}" width="${bBW}" height="${h}" rx="4" fill="${b.clr}" opacity="0.88"/><text x="${x+bBW/2}" y="${y-4}" text-anchor="middle" font-size="7.5" font-weight="700" fill="${b.clr}" font-family="Cairo,sans-serif">${b.val>=1000?(b.val/1000).toFixed(1)+'K':b.val}</text><text x="${x+bBW/2}" y="${bPT+bCH+14}" text-anchor="middle" font-size="7" fill="#6B7280" font-family="Cairo,sans-serif">${b.lb}</text>`;}).join('')}<line x1="${bSX}" y1="${bPT+bCH}" x2="${bSX+bTW}" y2="${bPT+bCH}" stroke="#E5E7EB" stroke-width="0.8"/></svg>`;
    // Service rows
    const sysClr={'تقاعد عسكري':'#7C3AED','تقاعد مدني':'#3B82F6','اشتراك اختياري':'#059669'};
    const prRows=periods.filter(p=>p.st!=='مستبعد'&&p.sd).map((p,i)=>{
      const e=p.ac?new Date().toISOString().split('T')[0]:p.ed;
      const c=mdfCal(p.sd,e,p.cal||'g');
      const sc=sysClr[p.sy]||'#D97706';
      return`<tr style="background:${i%2===0?'white':'#FAFAFA'}"><td style="padding:7px 10px;color:#374151;font-weight:600">${i+1}</td><td style="padding:7px 10px;color:#111827;font-weight:600">${p.emp||'—'}</td><td style="padding:7px 10px;color:#6B7280;font-size:8.5pt;direction:ltr">${p.sd}</td><td style="padding:7px 10px;color:#6B7280;font-size:8.5pt;direction:ltr">${p.ed||'مستمر'}</td><td style="padding:7px 10px;font-weight:700;color:#059669">${c.m} ش</td><td style="padding:7px 10px"><span style="background:${sc}18;color:${sc};padding:2px 8px;border-radius:20px;font-size:8pt;font-weight:700;border:1px solid ${sc}30">${p.sy}</span></td><td style="padding:7px 10px;font-weight:700;text-align:left;direction:ltr">${fI(p.sl)} ر.س</td></tr>`;
    }).join('');
    // Pension calc rows
    const penCalcRows=pen.actMode?[
      {lb:`معاش اكتواري — ${tf.tY.toFixed(1)} سنة × معامل ${tf.act.final}`,val:pen.pC,clr:'#7C3AED',plus:false},
      ...(pen.pV>0?[{lb:'الاشتراك الاختياري',val:pen.pV,clr:'#7C3AED',plus:true}]:[]),
    ]:[
      ...(ps.oM>0?[{lb:`الفترة القديمة — ${ps.oM} شهر ÷ 600 × ${fmt(r150.app)} ر.س`,val:pen.pO,clr:'#D97706',plus:false}]:[]),
      {lb:`الفترة الجديدة — ${ps.nM} شهر ÷ 480 × ${fmt(r150.app)} ر.س`,val:pen.pN,clr:'#3B82F6',plus:false},
      ...(pen.dA>0?[{lb:`بدل إعالة — ${deps} معالين (${deps>=3?20:deps===2?15:10}%)`,val:pen.dA,clr:'#10B981',plus:true}]:[]),
      ...(pen.pV>0?[{lb:'الاشتراك الاختياري',val:pen.pV,clr:'#7C3AED',plus:true}]:[]),
      ...(pen.pC>0?[{lb:`معاش مدني/عسكري — ${tf.cM} شهر`,val:pen.pC,clr:'#0891B2',plus:true}]:[]),
    ];
    const penRows=penCalcRows.map((row,i)=>`<tr style="background:${i%2===0?'white':'#FAFAFA'}"><td style="padding:8px 11px;color:#4B5563;font-size:9pt">${row.lb}</td><td style="padding:8px 11px;font-weight:800;color:${row.clr};text-align:left;direction:ltr;font-size:10.5pt">${row.plus?'+':''}${fmt(row.val)} <span style="font-size:7.5pt;font-weight:400;color:#9CA3AF">ر.س</span></td></tr>`).join('');
    const html=`<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
<meta charset="UTF-8">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
<style>
@page{size:A4 portrait;margin:0}
*{font-family:'Cairo',sans-serif;box-sizing:border-box;margin:0;padding:0;print-color-adjust:exact;-webkit-print-color-adjust:exact}
body{font-size:10pt;color:#111827;direction:rtl;line-height:1.6;background:white}
.hdr{background:linear-gradient(135deg,#022C22 0%,#065F46 50%,#059669 100%);padding:24px 30px;position:relative;overflow:hidden}
.hdr-in{display:flex;justify-content:space-between;align-items:flex-end;position:relative;z-index:1}
.hdr h1{font-size:22pt;font-weight:900;color:white;margin:4px 0 0;letter-spacing:-0.3px}
.hdr .sub{font-size:8pt;color:rgba(255,255,255,0.6);letter-spacing:0.8px}
.hdr-badge{background:rgba(255,255,255,0.12);border:1px solid rgba(255,255,255,0.2);border-radius:10px;padding:8px 14px;text-align:center}
.hdr-badge .d{font-size:7pt;color:rgba(255,255,255,0.6);margin-bottom:2px}
.hdr-badge .v{font-size:10pt;color:white;font-weight:700}
.body{padding:20px 26px}
.sum-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:9px;margin-bottom:14px}
.sc{background:white;border:1px solid #E5E7EB;border-radius:11px;padding:12px 10px;text-align:center;box-shadow:0 1px 4px rgba(0,0,0,0.05)}
.sc .l{font-size:7pt;color:#9CA3AF;margin-bottom:3px;font-weight:500}
.sc .v{font-size:14pt;font-weight:900;color:#059669;line-height:1.1}
.sc .s{font-size:6.5pt;color:#9CA3AF;margin-top:2px}
.sc.hl{background:linear-gradient(135deg,#065F46,#059669);border:none}
.sc.hl .l,.sc.hl .s{color:rgba(255,255,255,0.65)}
.sc.hl .v{color:white;font-size:17pt}
.sb{border-radius:10px;padding:11px 15px;margin-bottom:14px;display:flex;align-items:center;gap:12px}
.sb.ok{background:#ECFDF5;border:1.5px solid #059669}.sb.ok h3{color:#065F46;font-size:10pt;font-weight:800}.sb.ok p{color:#047857;font-size:8pt;margin-top:1px}
.sb.warn{background:#FFFBEB;border:1.5px solid #D97706}.sb.warn h3{color:#92400E;font-size:10pt;font-weight:800}.sb.warn p{color:#B45309;font-size:8pt;margin-top:1px}
.sb .ic{font-size:18pt;flex-shrink:0}
.cr{display:flex;gap:11px;margin-bottom:14px;align-items:flex-start}
.cc{background:white;border:1px solid #E5E7EB;border-radius:11px;padding:12px 10px;box-shadow:0 1px 4px rgba(0,0,0,0.04)}
.cc h4{font-size:8pt;color:#4B5563;font-weight:700;margin-bottom:8px}
.lg{display:flex;flex-direction:column;gap:4px}
.li{display:flex;align-items:center;gap:5px;font-size:7pt}
.ld{width:7px;height:7px;border-radius:2px;flex-shrink:0}
.lv{margin-right:auto;font-weight:700;color:#374151}
table{width:100%;border-collapse:collapse}
th{background:#065F46;color:white;padding:7px 10px;text-align:right;font-size:8pt;font-weight:700}
td{border-bottom:1px solid #F3F4F6}
tr:last-child td{border-bottom:none}
.tw{border-radius:9px;overflow:hidden;border:1px solid #E5E7EB;margin-bottom:13px;box-shadow:0 1px 4px rgba(0,0,0,0.04)}
tfoot td{background:#ECFDF5;font-weight:800;color:#059669;padding:8px 10px;border-top:1.5px solid #059669}
.ph{background:linear-gradient(135deg,#022C22,#065F46 50%,#059669);border-radius:13px;padding:18px;text-align:center;margin-bottom:13px}
.ph .t{font-size:7.5pt;color:rgba(255,255,255,0.6);letter-spacing:1.5px;margin-bottom:4px}
.ph .a{font-size:32pt;font-weight:900;color:white;line-height:1}
.ph .c{font-size:9pt;color:rgba(255,255,255,0.55);margin-top:2px}
.ph .b{background:rgba(255,255,255,0.12);border-radius:20px;display:inline-block;padding:3px 12px;font-size:8pt;color:rgba(255,255,255,0.82);margin-top:6px}
.sec{font-size:10.5pt;font-weight:800;color:#065F46;margin:14px 0 9px;display:flex;align-items:center;gap:8px;padding-right:9px;border-right:3.5px solid #059669}
.two{display:grid;grid-template-columns:1fr 1fr;gap:11px;margin-bottom:12px}
.ic2{background:white;border:1px solid #E5E7EB;border-radius:9px;padding:11px}
.ir{display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid #F9FAFB;font-size:8.5pt}
.ir:last-child{border:none}
.ir .k{color:#6B7280}.ir .val{font-weight:700;color:#111827}
.prgb{background:#E5E7EB;border-radius:8px;height:8px;overflow:hidden;margin:5px 0 3px}
.prg{height:100%;border-radius:8px}
.disc{background:#F9FAFB;border-radius:8px;padding:9px 12px;font-size:7.5pt;color:#6B7280;line-height:1.9;border:1px solid #E5E7EB;margin-top:12px}
.ftr{margin-top:13px;padding-top:9px;border-top:1px solid #E5E7EB;display:flex;justify-content:space-between;font-size:7pt;color:#9CA3AF}
.pg{page-break-after:always}
</style>
</head>
<body>
<div class="hdr">
  <div style="position:absolute;top:-50px;right:-50px;width:180px;height:180px;background:radial-gradient(circle,rgba(255,255,255,0.08),transparent 70%);z-index:0"></div>
  <div style="position:absolute;bottom:-30px;left:-30px;width:140px;height:140px;background:radial-gradient(circle,rgba(255,255,255,0.05),transparent 70%);z-index:0"></div>
  <div class="hdr-in">
    <div>
      <div class="sub">المؤسسة العامة للتأمينات الاجتماعية • نظام م/33 • تعديلات 3 يوليو 2024م</div>
      <h1>تقرير المعاش التقاعدي</h1>
      <div class="sub" style="margin-top:5px">تبادل المنافع م/53 • نظام الاحتساب الاكتواري</div>
    </div>
    <div class="hdr-badge">
      <div class="d">تاريخ الإصدار</div>
      <div class="v">${tStr}</div>
    </div>
  </div>
</div>
<div class="body">
<div class="sum-grid">
  <div class="sc hl"><div class="l">المعاش التقاعدي المتوقع</div><div class="v">${fmt(pen.f)}</div><div class="s">ريال سعودي / شهر</div></div>
  <div class="sc"><div class="l">إجمالي مدة الخدمة</div><div class="v">${Math.floor(ps.tM/12)}</div><div class="s">${ps.tM} شهر — ${(ps.tM/12).toFixed(1)} سنة</div></div>
  <div class="sc"><div class="l">سن التقاعد النظامي</div><div class="v" style="font-size:11pt">${ri.lb}</div><div class="s">${ri.dt?ri.dt.toLocaleDateString('ar-SA'):'—'}</div></div>
  <div class="sc"><div class="l">التقاعد المبكر</div><div class="v" style="color:${ps.tM>=ri.eR?'#059669':'#EF4444'};font-size:11pt">${ps.tM>=ri.eR?'✓ مؤهل':'غير مؤهل'}</div><div class="s">${ps.tM}/${ri.eR} شهر</div></div>
</div>
<div class="sb ${ps.tM>=ri.eR?'ok':'warn'}">
  <div class="ic">${ps.tM>=ri.eR?'✅':'📋'}</div>
  <div><h3>${ps.tM>=ri.eR?'مؤهل للتقاعد المبكر':'جارٍ استكمال شروط التقاعد المبكر'}</h3>
  <p>${ps.tM>=ri.eR?`استكملت ${ps.tM} شهراً من أصل ${ri.eR} — بإمكانك التقاعد مبكراً الآن`:`متبقٍ ${ri.eR-ps.tM} شهراً لاستيفاء شرط التقاعد المبكر البالغ ${ri.eR} شهراً`}</p></div>
</div>
<div class="cr">
  <div class="cc" style="text-align:center;min-width:150px;flex:0 0 auto">
    <h4>مؤشر الجاهزية للتقاعد</h4>
    <div style="display:flex;justify-content:center">${gSvg}</div>
    <div class="prgb"><div class="prg" style="width:${readiness}%;background:${gClr}"></div></div>
    <div style="font-size:6.5pt;color:#9CA3AF">خدمة (60) + كفاية المعاش (40)</div>
  </div>
  <div class="cc" style="flex:1">
    <h4>توزيع مكونات المعاش (ريال / شهر)</h4>
    <div style="display:flex;gap:10px;align-items:center">
      <div>${dSvg}</div>
      <div class="lg" style="flex:1">
        ${dSl.map(s=>`<div class="li"><div class="ld" style="background:${s.clr}"></div><span style="color:#6B7280;flex:1">${s.lb}</span><span class="lv">${fmt(s.val)}</span></div>`).join('')}
        <div class="li" style="margin-top:4px;padding-top:4px;border-top:1px solid #E5E7EB"><div class="ld" style="background:#059669"></div><strong style="flex:1">الإجمالي</strong><strong class="lv" style="color:#059669">${fmt(pen.f)}</strong></div>
      </div>
    </div>
  </div>
  <div class="cc" style="text-align:center;min-width:128px;flex:0 0 auto">
    <h4>مقارنة المعاش</h4>
    <div style="display:flex;justify-content:center">${bSvg}</div>
    ${penTodayVal>0&&pen.f>penTodayVal?`<div style="background:#ECFDF5;border-radius:6px;padding:3px 8px;margin-top:4px;font-size:7.5pt;font-weight:700;color:#059669">+${fmt(pen.f-penTodayVal)} ر.س</div>`:''}
  </div>
</div>
<div class="ph">
  <div class="t">المعاش التقاعدي المتوقع عند تاريخ التقاعد المخطط</div>
  <div class="a">${fmt(pen.f)}</div>
  <div class="c">ريال سعودي / شهر</div>
  <div class="b">الأجر المعتمد: ${fmt(pen.a)} ر.س &nbsp;•&nbsp; مدة: ${(ps.tM/12).toFixed(1)} سنة</div>
</div>
<div class="sec">📋 البيانات الشخصية والتقاعدية</div>
<div class="two">
  <div class="ic2">
    <div class="ir"><span class="k">تاريخ الميلاد</span><span class="val">${bdStr}</span></div>
    <div class="ir"><span class="k">العمر الحالي</span><span class="val">${ageStr}</span></div>
    <div class="ir"><span class="k">تاريخ التقاعد المخطط</span><span class="val">${rdStr}</span></div>
    ${info.bd&&info.rd?`<div class="ir"><span class="k">العمر عند التقاعد</span><span class="val">${ageAt(info.bd,info.rd).g} م</span></div>`:''}
    <div class="ir"><span class="k">عدد المعالين</span><span class="val">${deps} معال${deps===0?' (لا إعالة)':deps===1?' (+10%)':deps===2?' (+15%)':' (+20%)'}</span></div>
  </div>
  <div class="ic2">
    <div class="ir"><span class="k">وضع 3/7/2024م</span><span class="val" style="color:${ri.ex?'#059669':'#D97706'}">${ri.ex?'✓ مُعفى':'مشمول بالتعديلات'}</span></div>
    <div class="ir"><span class="k">العمر الهجري في 3/7/2024</span><span class="val">${ri.aRH?ri.aRH.yrs+'س '+ri.aRH.mths+'ش':ri.aR+' س'} هجري</span></div>
    <div class="ir"><span class="k">سن التقاعد النظامي</span><span class="val">${ri.lb}</span></div>
    <div class="ir"><span class="k">تاريخ التقاعد النظامي</span><span class="val">${ri.dt?ri.dt.toLocaleDateString('ar-SA'):'—'}</span></div>
    <div class="ir"><span class="k">شرط التقاعد المبكر</span><span class="val">${ri.eR} شهر (${ri.eY} سنة)</span></div>
  </div>
</div>
</div>
<div class="pg"></div>
<div class="body" style="padding-top:16px">
<div class="sec">💼 مدد الخدمة</div>
<div class="tw">
  <table>
    <thead><tr><th>#</th><th>جهة العمل</th><th>من</th><th>إلى</th><th>المدة</th><th>النظام</th><th>الأجر</th></tr></thead>
    <tbody>${prRows||'<tr><td colspan="7" style="text-align:center;color:#9CA3AF;padding:14px">لا توجد مدد مدخلة</td></tr>'}</tbody>
    <tfoot><tr><td colspan="4">الإجمالي</td><td>${ps.tM} ش — ${(ps.tM/12).toFixed(1)} سنة</td><td>—</td><td style="text-align:left;direction:ltr">${fI(ps.lS)} ر.س</td></tr></tfoot>
  </table>
</div>
${ri.eR>0?`<div style="margin-bottom:13px">
  <div style="display:flex;justify-content:space-between;font-size:8.5pt;margin-bottom:4px">
    <span style="color:#4B5563;font-weight:600">نسبة استيفاء شرط التقاعد المبكر (${ri.eR} شهر)</span>
    <span style="color:#059669;font-weight:800">${Math.min(100,Math.round(psAtRF.tM/ri.eR*100))}%</span>
  </div>
  <div class="prgb"><div class="prg" style="width:${Math.min(100,psAtRF.tM/ri.eR*100).toFixed(0)}%;background:linear-gradient(90deg,${psAtRF.tM>=ri.eR?'#34D399,#059669':'#FCD34D,#D97706'})"></div></div>
  <div style="display:flex;justify-content:space-between;font-size:7pt;color:#9CA3AF;margin-top:2px"><span>0</span><span style="color:#4B5563;font-weight:600">${psAtRF.tM} من ${ri.eR} شهر</span><span>${ri.eR} شهر</span></div>
</div>`:''}
<div class="sec">📊 تفاصيل احتساب المعاش</div>
<div class="tw">
  <table>
    <thead><tr><th style="width:70%">البند</th><th style="text-align:left">القيمة</th></tr></thead>
    <tbody>${penRows||'<tr><td colspan="2" style="padding:12px;text-align:center;color:#9CA3AF">—</td></tr>'}</tbody>
    <tfoot><tr><td>الإجمالي — ${ps.tM} شهر (${(ps.tM/12).toFixed(1)} سنة)</td><td style="font-size:12pt;text-align:left;direction:ltr">${fmt(pen.f)} ر.س / شهر</td></tr></tfoot>
  </table>
</div>
${tf.has&&!pen.actMode?`<div class="sec">🔄 تبادل المنافع — نظام م/53</div>
<div class="ic2" style="margin-bottom:13px">
  <div class="ir"><span class="k">النظام الأخير</span><span class="val">${tf.lastSys==='تقاعد'?'التقاعد المدني':'التأمينات الاجتماعية'}</span></div>
  <div class="ir"><span class="k">آخر راتب مدني</span><span class="val">${fI(tf.cS)} ر.س</span></div>
  <div class="ir"><span class="k">المدة المدنية</span><span class="val">${tf.cY.toFixed(1)} سنة (${tf.cM} شهر)</span></div>
  <div class="ir"><span class="k">المعامل الاكتواري</span><span class="val" style="color:#3B82F6">${tf.act.final}</span></div>
  <div class="ir"><span class="k">إجمالي المدة المدمجة</span><span class="val">${tf.tY.toFixed(1)} سنة</span></div>
  <div class="ir"><span class="k">معاش تبادل المنافع</span><span class="val" style="color:#059669;font-size:11pt">${fmt(tf.pen)} ر.س / شهر</span></div>
</div>`:''}
<div class="disc">
  <strong style="color:#374151">📌 المراجع القانونية:</strong>
  نظام التأمينات الاجتماعية م/33 (1421هـ) المادة 38 &nbsp;•&nbsp;
  نظام تبادل المنافع م/53 (1424هـ) &nbsp;•&nbsp;
  قرار مجلس الوزراء 3/7/2024م البند خامساً &nbsp;•&nbsp;
  المادة 24 من لائحة التسجيل والاشتراكات.<br>
  <strong style="color:#374151">⚠️ تنبيه:</strong>
  الأرقام الواردة في هذا التقرير تقديرية وتستند إلى البيانات المدخلة، ولا تُعدّ وثيقة رسمية.
  يُنصح بمراجعة فرع التأمينات للحصول على كشف حساب رسمي.
</div>
<div class="ftr">
  <div>حاسبة التقاعد — المؤسسة العامة للتأمينات الاجتماعية</div>
  <div>${tStr}</div>
</div>
</div>
</body>
</html>`;
    const w=window.open('','_blank','width=960,height=700');
    if(!w){alert('يرجى السماح بفتح النوافذ المنبثقة لاستخراج التقرير');return;}
    w.document.write(html);
    w.document.close();
    if(w.document.fonts?.ready){w.document.fonts.ready.then(()=>setTimeout(()=>w.print(),500));}
    else{setTimeout(()=>w.print(),900);}
  };

  // ── الثيم الفاتح العصري ──────────────────────────────────────
  // ── Parco colour scheme ───────────────────────────────────────────
  const bg='#EEF1F9',bg2='#FFFFFF',card='#FFFFFF',brd='rgba(27,30,53,0.09)',brd2='rgba(27,30,53,0.05)';
  const gold='#1B2040',gold2='#0F1528',goldL='#E8EDF8';
  const grn='#10B981',grnL='#ECFDF5';
  const red='#EF4444',redL='#FFF1F0';
  const blu='#3B82F6',bluL='#EFF6FF';
  const pur='#7C3AED',purL='#F5F3FF';
  const org='#F97316',orgL='#FFF7ED';
  const txt='#0F172A',txt2='#64748B';

  const inp={width:'100%',padding:'11px 13px',borderRadius:12,border:`1.5px solid ${brd}`,background:'#FAFCFB',color:txt,fontSize:13,fontFamily:"'Tajawal',sans-serif",boxSizing:'border-box',outline:'none',transition:'border-color 0.2s',boxShadow:'inset 0 1px 3px rgba(0,0,0,0.04)'};
  const crd={background:card,borderRadius:20,padding:18,marginBottom:12,border:`1px solid ${brd}`,boxShadow:'0 2px 8px rgba(0,0,0,0.06),0 1px 2px rgba(0,0,0,0.04)'};
  const Tag=({color:c,bg:b,children,sm})=>(
    <span style={{background:b,color:c,borderRadius:20,padding:sm?'2px 9px':'3px 11px',fontSize:sm?9:10,fontWeight:700,border:`1px solid ${c}35`,letterSpacing:0.2}}>{children}</span>
  );
  const SH=({icon,label,color:c})=>(
    <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:14}}>
      <span style={{width:36,height:36,borderRadius:12,background:`${c||gold}15`,border:`1px solid ${c||gold}35`,display:'inline-flex',alignItems:'center',justifyContent:'center',fontSize:17,flexShrink:0,boxShadow:`0 0 12px ${c||gold}20`}}>{icon}</span>
      <span style={{fontSize:14,fontWeight:800,color:c||gold2,letterSpacing:-0.3}}>{label}</span>
    </div>
  );
  const Note=({icon,text,color:c,bgc})=>(
    <div style={{display:'flex',gap:8,padding:'9px 12px',borderRadius:10,background:bgc||bluL,border:`1px solid ${c||blu}30`,marginBottom:8,fontSize:10,color:c||blu,lineHeight:1.7,alignItems:'flex-start'}}>
      <span style={{fontSize:13,flexShrink:0}}>{icon}</span><span>{text}</span>
    </div>
  );

  return(
  <div style={{minHeight:'100dvh',fontFamily:"'Tajawal',sans-serif",direction:'rtl',background:bg,color:txt,paddingBottom:'calc(env(safe-area-inset-bottom,0px)+20px)'}}>
    <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;700;800;900&display=swap" rel="stylesheet"/>

    {/* ── Header ── */}
    <div style={{background:'linear-gradient(135deg,#1B1E35 0%,#252A4E 55%,#2E3566 100%)',padding:'24px 16px 18px',paddingTop:'calc(env(safe-area-inset-top,0px)+22px)',position:'relative',overflow:'hidden'}}>
      <div style={{position:'absolute',top:-80,right:-60,width:260,height:260,background:'radial-gradient(circle,rgba(255,255,255,0.07) 0%,transparent 65%)',pointerEvents:'none'}}/>
      <div style={{position:'absolute',bottom:-1,left:0,right:0,height:24,background:'linear-gradient(180deg,transparent,rgba(242,246,243,0.15))',borderRadius:'50% 50% 0 0 / 0 0 100% 100%'}}/>
      <div style={{textAlign:'center',position:'relative'}}>
        <div style={{fontSize:9,color:'rgba(255,255,255,0.6)',fontWeight:400,letterSpacing:3,marginBottom:8,textTransform:'uppercase'}}>المؤسسة العامة للتأمينات الاجتماعية</div>
        <h1 style={{fontSize:28,fontWeight:900,color:'#FFFFFF',margin:'0 0 8px',letterSpacing:-0.5,fontFamily:'inherit'}}>حاسبة التقاعد</h1>
        <div style={{display:'inline-flex',gap:6,alignItems:'center',background:'rgba(255,255,255,0.12)',border:'1px solid rgba(255,255,255,0.2)',borderRadius:20,padding:'4px 14px',backdropFilter:'blur(8px)'}}>
          <div style={{width:5,height:5,borderRadius:'50%',background:'#6EE7B7'}}/>
          <span style={{fontSize:9,color:'rgba(255,255,255,0.85)',letterSpacing:0.5}}>نظام م/33 • تبادل المنافع م/53 • تعديلات يوليو 2024</span>
        </div>
        {periods.length>0&&<div style={{marginTop:8}}>
          <button onClick={()=>{if(confirm('هل تريد مسح جميع البيانات والبدء من جديد؟')){localStorage.removeItem(LS_KEY);window.location.reload()}}} style={{padding:'3px 12px',borderRadius:20,border:'1px solid rgba(255,255,255,0.25)',background:'rgba(255,255,255,0.1)',color:'rgba(255,255,255,0.7)',fontSize:9,cursor:'pointer',fontFamily:'inherit',backdropFilter:'blur(4px)'}}>🗑️ مسح البيانات</button>
        </div>}
      </div>
    </div>

    {/* ── Tabs ── */}
    <div style={{background:'#FFFFFF',borderBottom:`1px solid ${brd}`,padding:'10px 12px',display:'flex',gap:6,position:'sticky',top:0,zIndex:20,boxShadow:'0 2px 12px rgba(0,0,0,0.06)'}}>
      {[{id:'merged',ic:'📋',lb:'البيانات'},{id:'result',ic:'✨',lb:'النتائج'},{id:'improve',ic:'💡',lb:'التحسين'}].map(t=>(
        <button key={t.id} onClick={()=>setTab(t.id)} style={{flex:1,padding:'9px 4px',borderRadius:14,border:'none',background:tab===t.id?gold:'transparent',color:tab===t.id?'#FFFFFF':txt2,fontWeight:700,fontSize:9,cursor:'pointer',fontFamily:'inherit',transition:'all 0.18s',boxShadow:tab===t.id?`0 4px 14px ${gold}35`:'none'}}>
          <span style={{display:'block',fontSize:17,marginBottom:2}}>{t.ic}</span>{t.lb}
        </button>
      ))}
    </div>

    <div style={{padding:'10px 12px 0'}}>

    {/* ════ تبويب البيانات والمدد ════ */}
    {tab==='merged'&&(<div>

      {/* البيانات الأساسية */}
      <div style={crd}>
        <SH icon="📅" label="البيانات الأساسية" color={gold}/>

        {/* تاريخ الميلاد */}
        <div style={{marginBottom:12}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:5}}>
            <div style={{fontSize:13,color:txt2,fontWeight:600}}>تاريخ الميلاد</div>
            <div style={{display:'flex',gap:4}}>
              {[{v:'g',lb:'م'},{v:'h',lb:'هـ'}].map(o=>(
                <button key={o.v} onClick={()=>handleBdCal(o.v)} style={{padding:'3px 10px',borderRadius:8,border:`1.5px solid ${bdCal===o.v?gold:brd}`,background:bdCal===o.v?gold2:'transparent',color:bdCal===o.v?bg:txt2,fontSize:9,cursor:'pointer',fontWeight:700,fontFamily:'inherit'}}>{o.lb}</button>
              ))}
            </div>
          </div>
          {bdCal==='h'
            ?<><input type="text" value={bdH} onChange={e=>handleBdHijri(e.target.value)} placeholder="1380/01/01" style={{...inp,direction:'ltr',textAlign:'center'}}/>
              {info.bd&&<div style={{fontSize:9,color:gold,marginTop:3,textAlign:'center'}}>{new Date(info.bd).toLocaleDateString('ar-SA')} — {fmtHijri(info.bd)}</div>}</>
            :<><input type="date" value={info.bd} onChange={e=>{const bd=e.target.value;setInfo(p=>({...p,bd}));if(info.rd&&bd){const a=ageAt(bd,info.rd);setRetAge(a.g>0?String(a.g):'')}}} style={{...inp,direction:'ltr',textAlign:'center'}}/>
              {info.bd&&<div style={{fontSize:9,color:gold,marginTop:3,textAlign:'center'}}>{fmtHijri(info.bd)}</div>}</>
          }
          {info.bd&&<>
            <div style={{textAlign:'center',margin:'8px 0 6px'}}>
              <div style={{fontSize:22,fontWeight:900,color:gold2,lineHeight:1}}>{age(info.bd).g} <span style={{fontSize:13,fontWeight:500,color:txt2}}>م</span> / {age(info.bd).h} <span style={{fontSize:13,fontWeight:500,color:txt2}}>هـ</span></div>
            </div>
            <div style={{borderRadius:14,overflow:'hidden',border:`1.5px solid ${ri.ex?grn:org}35`,marginBottom:8,boxShadow:`0 3px 14px ${ri.ex?grn:org}12`}}>
              {/* شريط الحالة */}
              <div style={{background:`linear-gradient(135deg,${ri.ex?'#065F46':gold2} 0%,${ri.ex?grn:org} 100%)`,padding:'10px 14px',display:'flex',alignItems:'center',gap:10}}>
                <span style={{fontSize:20,lineHeight:1,flexShrink:0}}>{ri.ex?'✅':'📋'}</span>
                <div style={{flex:1}}>
                  <div style={{fontSize:12,fontWeight:900,color:'#fff',letterSpacing:0.1}}>{ri.ex?'غير مشمول بتعديلات 2024':'مشمول بتعديلات 2024'}</div>
                  <div style={{fontSize:8,color:'rgba(255,255,255,0.72)',marginTop:1,fontWeight:500}}>قرار مجلس الوزراء — 3 يوليو 2024م</div>
                </div>
                <div style={{background:'rgba(255,255,255,0.18)',borderRadius:8,padding:'3px 9px',fontSize:8,color:'#fff',fontWeight:700,flexShrink:0,border:'1px solid rgba(255,255,255,0.3)'}}>📜 نظام م/33</div>
              </div>
              {/* وضعك */}
              <div style={{background:ri.ex?'#F0FDF4':'#FFFBEB',padding:'8px 14px',borderBottom:`1px solid ${ri.ex?grn:org}20`,display:'flex',gap:7,alignItems:'flex-start'}}>
                <span style={{fontSize:11,flexShrink:0,marginTop:1}}>{ri.ex?'🟢':'🟡'}</span>
                <div style={{fontSize:9,color:ri.ex?'#166534':gold2,lineHeight:1.8,fontWeight:500}}>
                  {ri.ex
                    ?'عمرك تجاوز 48.5 سنة هجرية أو خدمتك بلغت 240 شهراً فأكثر في تاريخ 3/7/2024م — يسري عليك النظام القديم دون تغيير.'
                    :`عمرك في 3/7/2024م: ${ri.aRH.yrs} سنة${ri.aRH.mths>0?` و ${ri.aRH.mths} شهر`:''} هجري — تنطبق عليك التعديلات الجديدة.`}
                </div>
              </div>
              {/* شرح القرار */}
              <div style={{background:'#FAFBFC',padding:'10px 14px',borderBottom:`1px solid ${brd}`}}>
                <div style={{fontSize:9,color:'#4B5563',lineHeight:2}}>
                  أقرّ مجلس الوزراء تعديلات جوهرية على نظامي التقاعد المدني والتأمينات الاجتماعية، تضمّنت رفع سن التقاعد النظامي تدريجياً ورفع الحد الأدنى لمدة الخدمة اللازمة للتقاعد المبكر.{' '}
                  <strong style={{color:'#1F2937'}}>أُعفي من هذه التعديلات</strong> كل من كان عمره الهجري{' '}
                  <strong style={{color:gold2}}>50 سنة فأكثر</strong>{' '}أو مدة خدمته{' '}
                  <strong style={{color:gold2}}>240 شهراً فأكثر</strong>{' '}
                  في <strong style={{color:'#1F2937'}}>03/07/2024م</strong>، ويسري عليهم النظام القديم كما كان.
                </div>
              </div>
              {/* رابط التفاصيل */}
              <div style={{background:bg,padding:'7px 14px',display:'flex',alignItems:'center',justifyContent:'center',gap:5}}>
                <span style={{fontSize:9,color:txt2}}>لمزيد من التفاصيل حول التعديلات:</span>
                <a href="https://awareness.gosi.gov.sa/" target="_blank" rel="noopener noreferrer" style={{color:blu,fontWeight:800,textDecoration:'none',fontSize:9,display:'inline-flex',alignItems:'center',gap:3,borderBottom:`1px solid ${blu}50`}}>زيارة الرابط ↗</a>
              </div>
            </div>
          </>}
          {/* تاريخ التقاعد */}
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginTop:10,marginBottom:8}}>
            <div>
              <div style={{fontSize:12,color:gold,marginBottom:4,fontWeight:700}}>📅 تاريخ التقاعد (م)</div>
              <input type="date" value={info.rd} onChange={e=>handleRdChange(e.target.value)} style={{...inp,border:`2px solid ${gold}60`,color:gold2,fontWeight:700,direction:'ltr',textAlign:'center'}}/>
              {info.rd&&<div style={{fontSize:8,color:txt2,marginTop:2,textAlign:'center'}}>{fmtHijri(info.rd)}</div>}
            </div>
            <div>
              <div style={{fontSize:12,color:gold,marginBottom:4,fontWeight:700}}>🌙 تاريخ التقاعد (هـ)</div>
              <input type="text" value={rdH||isoToHijriStr(info.rd)} onChange={e=>handleRdHijriChange(e.target.value)} placeholder="1446/07/01" style={{...inp,border:`2px solid ${gold}60`,color:gold2,fontWeight:700,direction:'ltr',textAlign:'center'}}/>
              {info.rd&&<div style={{fontSize:8,color:txt2,marginTop:2,textAlign:'center'}}>{new Date(info.rd).toLocaleDateString('ar-SA')}</div>}
            </div>
          </div>

          {/* العمر عند التقاعد */}
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:10}}>
            <div>
              <div style={{fontSize:12,color:gold,marginBottom:4,fontWeight:700}}>🎂 العمر عند التقاعد (م)</div>
              <input type="number" inputMode="decimal" min="40" max="70" step="0.5" value={retAge} onChange={e=>handleAgeChange(e.target.value)} placeholder={ri.rY?`${ri.rY+ri.rM/12}`:'60'} style={{...inp,border:`2px solid ${gold}50`,color:gold2,fontWeight:700,direction:'ltr',textAlign:'center'}}/>
            </div>
            <div>
              <div style={{fontSize:12,color:gold,marginBottom:4,fontWeight:700}}>🌙 العمر عند التقاعد (هـ)</div>
              <input type="number" inputMode="decimal" min="40" max="72" step="0.5" value={retAgeH} onChange={e=>handleAgeHChange(e.target.value)} placeholder="55.5" style={{...inp,border:`2px solid ${gold}50`,color:gold2,fontWeight:700,direction:'ltr',textAlign:'center'}}/>
              {hijriRetAge&&<div style={{fontSize:8,color:gold,marginTop:2,textAlign:'center'}}>{hijriRetAge.yrs} سنة{hijriRetAge.mths>0?` و ${hijriRetAge.mths} شهر`:''}</div>}
            </div>
          </div>

          {info.bd&&(()=>{
            const aH=ri.aR;
            const myRA=RA.find(r=>aH>=(r.mn||0)&&(!r.mx||aH<r.mx))||RA[RA.length-1];
            const myIdx=RA.indexOf(myRA);
            const raSlice=RA.slice(Math.max(0,myIdx-1),Math.min(RA.length,myIdx+3));
            const myET=ET.find(r=>psAtRF.tM>=r.mnM&&(!r.mxM||psAtRF.tM<=r.mxM))||ET[ET.length-1];
            const earlyDone=ri.eR<=psAtRF.tM;
            const earlyLeft=Math.max(0,ri.eR-psAtRF.tM);
            return(
            <div style={{marginTop:8}}>

              {/* القسمان: المبكر | النظامي */}
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>

                {/* ── النصف الأيمن: التقاعد المبكر ── */}
                <div style={{borderRadius:12,overflow:'hidden',border:`1.5px solid ${earlyDone?grn:red}30`}}>
                  <div style={{background:`linear-gradient(135deg,${earlyDone?'#065F46':'#991B1B'},${earlyDone?grn:red})`,padding:'8px 10px',textAlign:'center'}}>
                    <div style={{fontSize:10,fontWeight:800,color:'#fff'}}>⚡ التقاعد المبكر</div>
                  </div>
                  <div style={{background:earlyDone?grnL:redL,padding:'10px',textAlign:'center',borderBottom:`1px solid ${earlyDone?grn:red}20`}}>
                    <div style={{fontSize:8,color:txt2,marginBottom:2}}>المطلوب</div>
                    <div style={{fontSize:17,fontWeight:900,color:earlyDone?grn:red,lineHeight:1}}>{ri.eR} شهر</div>
                    <div style={{fontSize:8,color:txt2,marginTop:2}}>{ri.eY} سنة</div>
                    {psAtRF.tM>0&&<div style={{marginTop:5,fontSize:8,color:earlyDone?grn:txt2,fontWeight:600}}>
                      {earlyDone?`✓ مؤهل — ${fMD(psAtRF.tM)}`:`متبقٍ ${fMD(earlyLeft)}`}
                    </div>}
                  </div>
                  {!ri.ex&&(
                    <div>
                      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',background:'#F1F5F9',padding:'3px 8px',borderBottom:`1px solid ${brd}`}}>
                        {['الخدمة في 2024','المطلوب'].map((h,i)=>(
                          <div key={i} style={{fontSize:7,fontWeight:700,color:txt2,textAlign:'center'}}>{h}</div>
                        ))}
                      </div>
                      {ET.map((r,i)=>{
                        const isMe=r===myET;
                        return(
                          <div key={i} style={{display:'grid',gridTemplateColumns:'1fr 1fr',padding:'5px 8px',background:isMe?grnL:i%2===0?bg2:bg,borderBottom:`1px solid ${brd}`,position:'relative'}}>
                            {isMe&&<div style={{position:'absolute',right:0,top:0,bottom:0,width:3,background:grn}}/>}
                            <div style={{fontSize:isMe?10:8,fontWeight:isMe?800:400,color:isMe?grn:txt,textAlign:'center'}}>
                              {r.mxM?`${r.mnM}–${r.mxM}`:`${r.mnM}+`}
                              {isMe&&<div style={{fontSize:7,color:grn,fontWeight:700}}>← أنت</div>}
                            </div>
                            <div style={{fontSize:isMe?10:8,fontWeight:isMe?800:400,color:isMe?grn:txt,textAlign:'center'}}>{r.req}ش ({r.y}س)</div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* ── النصف الأيسر: التقاعد النظامي ── */}
                <div style={{borderRadius:12,overflow:'hidden',border:`1.5px solid ${gold}30`}}>
                  <div style={{background:`linear-gradient(135deg,${gold2},${gold})`,padding:'8px 10px',textAlign:'center'}}>
                    <div style={{fontSize:10,fontWeight:800,color:'#fff'}}>🏛 التقاعد النظامي</div>
                  </div>
                  <div style={{background:goldL,padding:'10px',textAlign:'center',borderBottom:`1px solid ${gold}20`}}>
                    <div style={{fontSize:8,color:txt2,marginBottom:2}}>سن التقاعد</div>
                    <div style={{fontSize:17,fontWeight:900,color:gold2,lineHeight:1}}>{ri.lb}</div>
                    {ri.dt&&<div style={{fontSize:8,color:txt2,marginTop:3}}>{ri.dt.toLocaleDateString('ar-SA')}</div>}
                  </div>
                  {!ri.ex&&(
                    <div>
                      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',background:'#F1F5F9',padding:'3px 8px',borderBottom:`1px solid ${brd}`}}>
                        {['نطاق العمر هـ','سن التقاعد'].map((h,i)=>(
                          <div key={i} style={{fontSize:7,fontWeight:700,color:txt2,textAlign:'center'}}>{h}</div>
                        ))}
                      </div>
                      {raSlice.map((r,i)=>{
                        const isMe=r===myRA;
                        return(
                          <div key={i} style={{display:'grid',gridTemplateColumns:'1fr 1fr',padding:'5px 8px',background:isMe?goldL:i%2===0?bg2:bg,borderBottom:`1px solid ${brd}`,position:'relative'}}>
                            {isMe&&<div style={{position:'absolute',right:0,top:0,bottom:0,width:3,background:gold}}/>}
                            <div style={{fontSize:isMe?10:8,fontWeight:isMe?800:400,color:isMe?gold2:txt,textAlign:'center'}}>
                              {r.mx?`${r.mn}–${r.mx}`:`${r.mn}+`}
                              {isMe&&<div style={{fontSize:7,color:gold,fontWeight:700}}>← أنت</div>}
                            </div>
                            <div style={{fontSize:isMe?10:8,fontWeight:isMe?800:400,color:isMe?gold2:txt,textAlign:'center'}}>{r.rY}س{r.rM>0?` ${r.rM}م`:''}</div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

              </div>{/* end grid */}
            </div>);
          })()}
        </div>

      </div>

      {/* المعالون */}
      <div style={{...crd,padding:'12px 16px',marginBottom:12}}>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <span style={{fontSize:13,color:txt2,fontWeight:600,flexShrink:0}}>👨‍👩‍👧 عدد المعالين:</span>
          <select value={deps} onChange={e=>setDeps(+e.target.value)} style={{...inp,appearance:'none',WebkitAppearance:'none',flex:1}}>
            <option value={0}>بدون معالين</option>
            <option value={1}>1 معال — يضيف 10% على المعاش</option>
            <option value={2}>2 معالين — يضيف 15% على المعاش</option>
            <option value={3}>3 معالين أو أكثر — يضيف 20% على المعاش</option>
          </select>
        </div>
        <div style={{fontSize:10,color:txt2,marginTop:5}}>المعالون: الزوج/الزوجة + الأبناء غير المتزوجين دون 18 سنة (أو حتى 26 للطلاب)</div>
      </div>

      {/* المدد */}
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
        <div style={{fontSize:13,fontWeight:700,color:gold2}}>المدد الوظيفية</div>
        <button onClick={addP} style={{padding:'7px 14px',borderRadius:10,border:`1.5px solid ${gold}`,background:'transparent',color:gold,fontWeight:700,fontSize:11,cursor:'pointer',fontFamily:'inherit'}}>+ إضافة</button>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:8,marginBottom:4}}>
      {periods.map((p,i)=>{
        const e=p.ac?aEnd:p.ed;const c=mdfCal(p.sd,e,p.cal||'g');
        const sc=p.sy==='تقاعد عسكري'?pur:p.sy==='تقاعد مدني'?blu:p.sy==='اشتراك اختياري'?gold:org;
        const sbg=p.sy==='تقاعد عسكري'?purL:p.sy==='تقاعد مدني'?bluL:p.sy==='اشتراك اختياري'?goldL:orgL;
        return(
          <div key={p.id} style={{background:sbg,borderRadius:12,padding:10,border:`1.5px solid ${sc}30`,borderRight:`4px solid ${sc}`}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6}}>
              <div style={{display:'flex',alignItems:'center',gap:6}}>
                <div style={{width:22,height:22,borderRadius:7,background:`${sc}20`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:800,color:sc,border:`1px solid ${sc}30`,flexShrink:0}}>{i+1}</div>
                <span style={{fontSize:11,fontWeight:700,color:txt}}>مدة {i+1}</span>
              </div>
              <button onClick={()=>setPeriods(x=>x.filter(q=>q.id!==p.id))} style={{padding:'3px 8px',borderRadius:7,border:'none',background:redL,color:red,fontSize:9,cursor:'pointer',fontFamily:'inherit',fontWeight:600}}>حذف</button>
            </div>

            <input value={p.emp} onChange={e=>upP(p.id,'emp',e.target.value)} placeholder="جهة العمل" style={{...inp,marginBottom:6,textAlign:'right',padding:'7px 10px',fontSize:12}}/>

            <div style={{display:'flex',gap:5,marginBottom:6,alignItems:'center'}}>
              <span style={{fontSize:10,color:txt2,fontWeight:600}}>التقويم:</span>
              {[{v:'g',lb:'م'},{v:'h',lb:'هـ'}].map(o=>(
                <button key={o.v} onClick={()=>toggleCal(p.id,o.v)} style={{padding:'3px 9px',borderRadius:7,border:`1.5px solid ${(p.cal||'g')===o.v?sc:brd}`,background:(p.cal||'g')===o.v?sc:'transparent',color:(p.cal||'g')===o.v?'#fff':txt2,fontSize:10,cursor:'pointer',fontWeight:700,fontFamily:'inherit'}}>{o.lb}</button>
              ))}
            </div>

            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6,marginBottom:6}}>
              <div>
                <div style={{fontSize:10,color:txt2,marginBottom:3}}>من {(p.cal||'g')==='h'?'(هجري)':'(ميلادي)'}</div>
                {(p.cal||'g')==='h'
                  ?<><input type="text" value={p.sdH!==undefined?p.sdH:isoToHijriStr(p.sd)} onChange={e=>handleHijriDate(p.id,'sd',e.target.value)} placeholder="1446/07/01" style={{...inp,direction:'ltr',textAlign:'center'}}/>
                    {p.sd&&<div style={{fontSize:8,color:txt2,marginTop:2,textAlign:'center'}}>{new Date(p.sd).toLocaleDateString('ar-SA')}</div>}</>
                  :<><input type="date" value={p.sd} onChange={e=>upP(p.id,'sd',e.target.value)} style={{...inp,direction:'ltr',textAlign:'center'}}/>
                    {p.sd&&<div style={{fontSize:8,color:txt2,marginTop:2,textAlign:'center'}}>{fmtHijri(p.sd)}</div>}</>
                }
              </div>
              <div>
                <div style={{fontSize:10,color:txt2,marginBottom:3}}>إلى {(p.cal||'g')==='h'?'(هجري)':'(ميلادي)'}</div>
                {p.ac
                  ?<div style={{padding:'7px 6px',borderRadius:8,background:grnL,color:grn,fontSize:9,fontWeight:600,textAlign:'center',border:`1px solid ${grn}30`}}>مستمر → {info.rd?new Date(info.rd).toLocaleDateString('ar-SA'):'التقاعد'}</div>
                  :(p.cal||'g')==='h'
                    ?<><input type="text" value={p.edH!==undefined?p.edH:isoToHijriStr(p.ed)} onChange={e=>handleHijriDate(p.id,'ed',e.target.value)} placeholder="1446/07/01" style={{...inp,direction:'ltr',textAlign:'center'}}/>
                      {p.ed&&<div style={{fontSize:8,color:txt2,marginTop:2,textAlign:'center'}}>{new Date(p.ed).toLocaleDateString('ar-SA')}</div>}</>
                    :<><input type="date" value={p.ed} onChange={e=>upP(p.id,'ed',e.target.value)} style={{...inp,direction:'ltr',textAlign:'center'}}/>
                      {p.ed&&<div style={{fontSize:8,color:txt2,marginTop:2,textAlign:'center'}}>{fmtHijri(p.ed)}</div>}</>
                }
              </div>
            </div>

            <label style={{display:'flex',alignItems:'center',gap:5,fontSize:10,color:grn,fontWeight:600,marginBottom:6,cursor:'pointer'}}>
              <input type="checkbox" checked={p.ac} onChange={e=>upP(p.id,'ac',e.target.checked)} style={{accentColor:grn,width:13,height:13}}/>
              على رأس العمل حتى التقاعد
            </label>

            {/* ── الأجر: أساسي + بدل سكن + عمولات ── */}
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:5,marginBottom:5}}>
              <div>
                <div style={{fontSize:9,color:txt2,marginBottom:3,fontWeight:600}}>الأجر (ر.س)</div>
                <input type="number" value={p.sl||''} onChange={e=>upP(p.id,'sl',+e.target.value)} placeholder="0" style={{...inp,direction:'ltr',textAlign:'center',padding:'6px 6px',fontSize:12}}/>
              </div>
              <div>
                <div style={{fontSize:9,color:txt2,marginBottom:3,fontWeight:600}}>بدل السكن</div>
                <input type="number" value={p.hs||''} onChange={e=>upP(p.id,'hs',+e.target.value)} placeholder="0" style={{...inp,direction:'ltr',textAlign:'center',padding:'6px 6px',fontSize:12}}/>
              </div>
              <div>
                <div style={{fontSize:9,color:txt2,marginBottom:3,fontWeight:600}}>العمولات</div>
                <input type="number" value={p.cm||''} onChange={e=>upP(p.id,'cm',+e.target.value)} placeholder="0" style={{...inp,direction:'ltr',textAlign:'center',padding:'6px 6px',fontSize:12}}/>
              </div>
            </div>

            {/* إجمالي الأجر */}
            {((p.sl||0)+(p.hs||0)+(p.cm||0))>0&&(
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',background:`${sc}12`,borderRadius:8,padding:'5px 10px',marginBottom:5,border:`1px solid ${sc}25`}}>
                <span style={{fontSize:9,color:txt2,fontWeight:600}}>إجمالي الأجر</span>
                <span style={{fontSize:13,fontWeight:900,color:sc}}>{fI((p.sl||0)+(p.hs||0)+(p.cm||0))} <span style={{fontSize:8,fontWeight:500}}>ر.س</span></span>
              </div>
            )}

            <div style={{display:'grid',gridTemplateColumns:`1fr 1fr${p.ac?'':' 1fr'}`,gap:5,marginBottom:0}}>
              <div>
                <div style={{fontSize:9,color:txt2,marginBottom:3,fontWeight:600}}>النظام</div>
                <select value={p.sy} onChange={e=>upP(p.id,'sy',e.target.value)} style={{...inp,fontSize:9,appearance:'none',WebkitAppearance:'none',padding:'6px 8px'}}>{SYS.map(s=><option key={s}>{s}</option>)}</select>
              </div>
              {!p.ac&&<div>
                <div style={{fontSize:9,color:txt2,marginBottom:3,fontWeight:600}}>الحالة</div>
                <select value={p.st} onChange={e=>upP(p.id,'st',e.target.value)} style={{...inp,appearance:'none',WebkitAppearance:'none',padding:'6px 8px',fontSize:9}}><option>نشط</option><option>منتهي</option><option>مستبعد</option></select>
              </div>}
            </div>

            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:4,background:bg2,borderRadius:8,padding:'5px 4px',marginTop:6,textAlign:'center',border:`1px solid ${brd2}`}}>
              <div><div style={{fontSize:7,color:txt2,marginBottom:1}}>أشهر</div><div style={{fontSize:15,fontWeight:800,color:gold2}}>{c.m}</div></div>
              <div><div style={{fontSize:7,color:txt2,marginBottom:1}}>أيام</div><div style={{fontSize:15,fontWeight:800,color:gold2}}>{c.d}</div></div>
              <div><div style={{fontSize:7,color:txt2,marginBottom:1}}>النظام</div><div style={{fontSize:8,fontWeight:700,color:new Date(p.sd)<new Date('2001-04-25')?org:blu}}>{new Date(p.sd)<new Date('2001-04-25')?'÷600':'÷480'}</div></div>
            </div>
          </div>
        );
      })}
      </div>

      {/* ── وضع التقاعد المبكر والنظامي — تحت المدد مباشرة ── */}
      {info.bd&&(()=>{
        const today=new Date();
        const todayISO=today.toISOString().split('T')[0];
        const monthsToStat=ri.dt?Math.max(0,Math.round((ri.dt-today)/864e5/30.44)):null;
        const earlyNeed=Math.max(0,ri.eR-ps.tM);
        const earlyNeedAtRF=Math.max(0,ri.eR-psAtRF.tM);
        let earlyDate=null;
        if(earlyNeed===0){earlyDate=todayISO;}
        else if(info.bd){const future=new Date(today.getFullYear(),today.getMonth()+earlyNeed,today.getDate());earlyDate=future.toISOString().split('T')[0];}
        return(
          <div style={{...crd,padding:'12px 14px',marginBottom:10}}>
            {/* شريط التقاعد النظامي */}
            {monthsToStat!==null&&(
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',fontSize:10,marginBottom:10,background:bg2,borderRadius:10,padding:'8px 12px',border:`1px solid ${brd}`}}>
                <span style={{color:txt2,fontWeight:600}}>متبقٍ للتقاعد النظامي</span>
                <strong style={{color:monthsToStat===0?grn:gold2,fontSize:11}}>{monthsToStat===0?'✓ بلغت السن النظامية':`${fI(monthsToStat)} شهر`}</strong>
              </div>
            )}
            {/* شريط التقاعد المبكر */}
            <div style={{background:earlyNeedAtRF===0?grnL:redL,borderRadius:12,padding:'12px 14px',marginBottom:10,border:`1.5px solid ${earlyNeedAtRF===0?grn:red}30`}}>
              {earlyNeedAtRF===0?(
                <div style={{fontSize:12,fontWeight:700,color:grn,textAlign:'center'}}>✓ مؤهل للتقاعد المبكر — {fMD(psAtRF.tM)} من أصل {ri.eR}</div>
              ):(
                <>
                <div style={{display:'flex',justifyContent:'space-between',marginBottom:8}}>
                  <span style={{fontSize:11,fontWeight:700,color:red}}>المطلوب للتقاعد المبكر: {ri.eR} شهر</span>
                  <span style={{fontSize:11,color:gold}}>متبقٍ: <strong>{fMD(earlyNeedAtRF)}</strong></span>
                </div>
                <div style={{height:7,borderRadius:7,background:`${red}20`,overflow:'hidden',marginBottom:6}}>
                  <div style={{height:'100%',borderRadius:7,background:`linear-gradient(90deg,${grn},${gold})`,width:`${Math.min(100,(psAtRF.tM/ri.eR)*100).toFixed(1)}%`,transition:'width 0.4s'}}/>
                </div>
                <div style={{fontSize:9,color:txt2,textAlign:'center'}}>خدمة في 3/7/2024: {fMD(psAtRF.tM)} / {ri.eR} شهر</div>
                </>
              )}
            </div>
            {/* بطاقتا المدة وأقرب تاريخ */}
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
              <div style={{background:bg2,borderRadius:12,padding:'10px 12px',border:`1px solid ${brd}`,textAlign:'center'}}>
                <div style={{fontSize:9,color:txt2,marginBottom:4}}>المدة المطلوبة للمبكر (الآن)</div>
                {earlyNeed===0
                  ?<div style={{fontSize:13,fontWeight:700,color:grn}}>✓ مؤهل الآن</div>
                  :<div style={{fontSize:11,fontWeight:800,color:red}}>{fMD(earlyNeed)}</div>}
              </div>
              <div style={{background:bg2,borderRadius:12,padding:'10px 12px',border:`1px solid ${brd}`,textAlign:'center'}}>
                <div style={{fontSize:9,color:txt2,marginBottom:4}}>أقرب تاريخ للمبكر</div>
                {earlyDate?(
                  <><div style={{fontSize:10,fontWeight:700,color:earlyNeed===0?grn:gold2}}>{fmtHijri(earlyDate)||new Date(earlyDate).toLocaleDateString('ar-SA')}</div>
                  <div style={{fontSize:8,color:txt2,marginTop:2}}>{new Date(earlyDate).toLocaleDateString('ar-SA')}</div></>
                ):<div style={{fontSize:11,color:txt2}}>—</div>}
              </div>
            </div>
          </div>
        );
      })()}

      <button onClick={()=>setTab('result')} style={{width:'100%',padding:'15px',borderRadius:16,border:'none',background:'linear-gradient(135deg,#1B1E35,#2E3566)',color:'#FFFFFF',fontWeight:900,fontSize:14,cursor:'pointer',fontFamily:'inherit',marginTop:4,boxShadow:'0 8px 32px rgba(27,30,53,0.35)',letterSpacing:0.3}}>احسب معاشي التقاعدي ←</button>
    </div>)}

    {/* ════ تبويب النتائج ════ */}
    {tab==='result'&&(<div>

      {/* ── Retirement Readiness Dashboard — Parco Style ── */}
      {(info.bd||periods.length>0)&&(
      <div style={{background:'#FFFFFF',borderRadius:20,marginBottom:14,overflow:'hidden',boxShadow:'0 4px 24px rgba(27,30,53,0.10)'}}>
        {/* Dark navy header strip */}
        <div style={{background:'linear-gradient(135deg,#1B1E35 0%,#252A4E 60%,#2E3566 100%)',padding:'14px 18px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <div>
            <div style={{fontSize:8,color:'rgba(255,255,255,0.55)',letterSpacing:2,textTransform:'uppercase',fontWeight:500}}>Retirement Readiness</div>
            <div style={{fontSize:15,fontWeight:900,color:'#FFFFFF',marginTop:2}}>مؤشر الجاهزية للتقاعد</div>
          </div>
          <div style={{background:'rgba(255,255,255,0.1)',borderRadius:10,padding:'7px 14px',border:'1px solid rgba(255,255,255,0.18)',textAlign:'center'}}>
            <div style={{fontSize:24,fontWeight:900,color:readiness>=70?'#34D399':readiness>=40?'#FCD34D':'#F87171',lineHeight:1}}>{readiness}%</div>
            <div style={{fontSize:7,color:'rgba(255,255,255,0.6)',marginTop:2}}>{readiness>=70?'ممتاز':readiness>=50?'جيد':readiness>=30?'متوسط':'ضعيف'}</div>
          </div>
        </div>

        <div style={{padding:'16px 14px 14px'}}>
          {/* Parco-style Speedometer Gauge */}
          <div style={{display:'flex',justifyContent:'center',marginBottom:12}}>
          {(()=>{
            const CX=100,CY=88,R=70,SW=14,W=200,H=100;
            const pct=readiness/100;
            const circ=Math.PI*R;
            const dashFill=pct*circ;
            const nA=Math.PI*(1-pct);
            const nx=(CX+R*Math.cos(nA)).toFixed(1);
            const ny=(CY-R*Math.sin(nA)).toFixed(1);
            const gClr=readiness>=70?'#10B981':readiness>=40?'#F97316':'#EF4444';
            const arcD=`M ${CX-R} ${CY} A ${R} ${R} 0 0 0 ${CX+R} ${CY}`;
            return(
              <svg viewBox={`0 0 ${W} ${H+4}`} style={{width:210,height:108,display:'block',overflow:'visible'}}>
                {/* Background track */}
                <path d={arcD} fill="none" stroke="#E2E8F0" strokeWidth={SW} strokeLinecap="round"/>
                {/* Dim colored zones */}
                <path d={arcD} fill="none" stroke="#EF4444" strokeWidth={SW} strokeLinecap="butt" opacity="0.18" strokeDasharray={`${(circ*0.4).toFixed(1)} ${circ.toFixed(1)}`}/>
                <path d={arcD} fill="none" stroke="#F97316" strokeWidth={SW} strokeLinecap="butt" opacity="0.18" strokeDasharray={`${(circ*0.3).toFixed(1)} ${circ.toFixed(1)}`} strokeDashoffset={`-${(circ*0.4).toFixed(1)}`}/>
                <path d={arcD} fill="none" stroke="#10B981" strokeWidth={SW} strokeLinecap="butt" opacity="0.18" strokeDasharray={`${(circ*0.3).toFixed(1)} ${circ.toFixed(1)}`} strokeDashoffset={`-${(circ*0.7).toFixed(1)}`}/>
                {/* Active fill */}
                {readiness>0&&<path d={arcD} fill="none" stroke={gClr} strokeWidth={SW} strokeLinecap="round" strokeDasharray={`${dashFill.toFixed(1)} ${(circ-dashFill).toFixed(1)}`}/>}
                {/* Needle */}
                <line x1={CX} y1={CY} x2={nx} y2={ny} stroke="#1B1E35" strokeWidth="2.5" strokeLinecap="round"/>
                <circle cx={CX} cy={CY} r="5.5" fill="#1B1E35"/>
                <circle cx={CX} cy={CY} r="2.5" fill="white"/>
                {/* Zone tick labels */}
                <text x={CX-R-6} y={CY+14} textAnchor="middle" fontSize="7.5" fill="#94A3B8" fontFamily="Cairo,sans-serif">0</text>
                <text x={CX} y="14" textAnchor="middle" fontSize="7.5" fill="#94A3B8" fontFamily="Cairo,sans-serif">50</text>
                <text x={CX+R+6} y={CY+14} textAnchor="middle" fontSize="7.5" fill="#94A3B8" fontFamily="Cairo,sans-serif">100</text>
                {/* Improve my score */}
                <text x={CX} y={CY+18} textAnchor="middle" fontSize="8" fill={gClr} fontWeight="700" fontFamily="Cairo,sans-serif">{readiness>=70?'ممتاز ✓':readiness>=50?'جيد':readiness>=30?'متوسط':'يحتاج تحسين'}</text>
              </svg>
            );
          })()}
          </div>

          {/* 3 Stat cards — Parco style */}
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8,marginBottom:ps.tM>0&&ri.eR>0?10:0}}>
            <div style={{background:'#F8FAFC',borderRadius:12,padding:'10px 8px',textAlign:'center',border:'1px solid #E2E8F0'}}>
              <div style={{display:'inline-flex',alignItems:'center',justifyContent:'center',width:24,height:24,borderRadius:8,background:'#ECFDF5',marginBottom:4}}>
                <span style={{fontSize:12}}>💰</span>
              </div>
              <div style={{fontSize:7,color:'#94A3B8',marginBottom:2,letterSpacing:0.3}}>Monthly Pension</div>
              <div style={{fontSize:pen.f?13:10,fontWeight:900,color:'#0F172A',lineHeight:1}}>{pen.f?fmt(pen.f):'—'}</div>
              <div style={{fontSize:6.5,color:'#94A3B8',marginTop:2}}>ر.س / شهر</div>
            </div>
            <div style={{background:'#F8FAFC',borderRadius:12,padding:'10px 8px',textAlign:'center',border:'1px solid #E2E8F0'}}>
              <div style={{display:'inline-flex',alignItems:'center',justifyContent:'center',width:24,height:24,borderRadius:8,background:'#EFF6FF',marginBottom:4}}>
                <span style={{fontSize:12}}>⏱️</span>
              </div>
              <div style={{fontSize:7,color:'#94A3B8',marginBottom:2,letterSpacing:0.3}}>Time to Retire</div>
              <div style={{fontSize:countdown?13:10,fontWeight:900,color:'#0F172A',lineHeight:1}}>{countdown?`${countdown.y}س ${countdown.r}ش`:'—'}</div>
              <div style={{fontSize:6.5,color:'#94A3B8',marginTop:2}}>{countdown?`${countdown.m} شهر`:''}</div>
            </div>
            <div style={{background:'#F8FAFC',borderRadius:12,padding:'10px 8px',textAlign:'center',border:'1px solid #E2E8F0'}}>
              <div style={{display:'inline-flex',alignItems:'center',justifyContent:'center',width:24,height:24,borderRadius:8,background:'#FFF7ED',marginBottom:4}}>
                <span style={{fontSize:12}}>📅</span>
              </div>
              <div style={{fontSize:7,color:'#94A3B8',marginBottom:2,letterSpacing:0.3}}>Service Progress</div>
              <div style={{fontSize:ps.tM?13:10,fontWeight:900,color:'#0F172A',lineHeight:1}}>{ps.tM?`${Math.floor(ps.tM/12)}س`:'—'}</div>
              <div style={{fontSize:6.5,color:'#94A3B8',marginTop:2}}>{ps.tM?`${ps.tM}/${ri.eR}ش`:''}</div>
            </div>
          </div>

          {/* Progress bar */}
          {ps.tM>0&&ri.eR>0&&(
            <div>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
                <span style={{fontSize:8,color:'#64748B',fontWeight:500}}>نسبة استيفاء التقاعد المبكر</span>
                <span style={{fontSize:8,color:'#0F172A',fontWeight:700}}>{Math.min(100,Math.round(psAtRF.tM/ri.eR*100))}%</span>
              </div>
              <div style={{height:7,borderRadius:7,background:'#E2E8F0',overflow:'hidden'}}>
                <div style={{height:'100%',borderRadius:7,background:psAtRF.tM>=ri.eR?'linear-gradient(90deg,#34D399,#10B981)':'linear-gradient(90deg,#FCD34D,#F97316)',width:`${Math.min(100,psAtRF.tM/ri.eR*100).toFixed(1)}%`,transition:'width 0.6s ease'}}/>
              </div>
            </div>
          )}
        </div>
      </div>
      )}

      {/* ── Pension Projection Chart ── */}
      {projection.length>0&&(
      <div style={{...crd,marginBottom:12}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12}}>
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            <span style={{width:32,height:32,borderRadius:10,background:`${gold}15`,border:`1px solid ${gold}35`,display:'inline-flex',alignItems:'center',justifyContent:'center',fontSize:16}}>📈</span>
            <span style={{fontSize:13,fontWeight:800,color:gold2}}>Pension Projection</span>
          </div>
          <span style={{fontSize:9,color:txt2}}>ر.س / شهر</span>
        </div>
        {(()=>{
          const maxP=Math.max(...projection.map(d=>d.pen));
          const W=320,H=120,PT=26,PB=30;
          const bW=32,gap=8,totalW=projection.length*(bW+gap)-gap;
          const sx=(W-totalW)/2;
          const ch=H-PT-PB;
          const bh=v=>Math.max(6,(v/maxP)*ch);
          const by=v=>PT+ch-bh(v);
          return(
            <svg viewBox={`0 0 ${W} ${H}`} style={{width:'100%',display:'block',maxWidth:360,margin:'0 auto'}}>
              {/* grid lines */}
              {[0.33,0.67,1].map((r,i)=>(
                <line key={i} x1={sx} y1={PT+ch-r*ch} x2={sx+totalW} y2={PT+ch-r*ch} stroke={brd} strokeWidth="0.5" strokeDasharray="3,4"/>
              ))}
              {projection.map((d,i)=>{
                const x=sx+i*(bW+gap);
                const h=bh(d.pen),y=by(d.pen);
                const clr=d.neg?'#94A3B8':d.cur?gold:'#10B981';
                return(
                  <g key={i}>
                    {/* shadow */}
                    <rect x={x+2} y={y+2} width={bW} height={h} rx={5} fill="rgba(0,0,0,0.05)"/>
                    {/* bar */}
                    <rect x={x} y={y} width={bW} height={h} rx={5} fill={clr} opacity={d.cur?1:0.72}/>
                    {/* highlight */}
                    {d.cur&&<rect x={x} y={y} width={bW} height={Math.min(h,12)} rx={5} fill="rgba(255,255,255,0.22)"/>}
                    {/* value */}
                    <text x={x+bW/2} y={y-5} textAnchor="middle" fontSize="8" fontWeight={d.cur?'800':'600'} fill={clr} fontFamily="Tajawal,sans-serif">
                      {d.pen>=1000?`${(d.pen/1000).toFixed(1)}K`:d.pen}
                    </text>
                    {/* label */}
                    <text x={x+bW/2} y={H-12} textAnchor="middle" fontSize="8" fill={d.cur?gold2:txt2} fontWeight={d.cur?'700':'400'} fontFamily="Tajawal,sans-serif">{d.lb}</text>
                  </g>
                );
              })}
              <line x1={sx} y1={PT+ch} x2={sx+totalW} y2={PT+ch} stroke={brd} strokeWidth="0.8"/>
            </svg>
          );
        })()}
        <div style={{display:'flex',gap:14,justifyContent:'center',marginTop:8,flexWrap:'wrap'}}>
          {[{clr:'#94A3B8',lb:'تقاعد مبكر'},{clr:gold,lb:'الموعد المخطط'},{clr:'#10B981',lb:'تقاعد متأخر'}].map((t,i)=>(
            <div key={i} style={{display:'flex',alignItems:'center',gap:5,fontSize:9,color:txt2}}>
              <div style={{width:10,height:6,borderRadius:2,background:t.clr}}/>{t.lb}
            </div>
          ))}
        </div>
        <div style={{marginTop:10,padding:'8px 12px',borderRadius:10,background:bluL,border:`1px solid ${blu}20`,fontSize:9,color:'#1E40AF',lineHeight:1.7}}>
          💡 كل سنة إضافية تزيد معاشك بحوالي <strong>{fmt(Math.round(Math.min(ps.lS,45000)/480*12))} ر.س</strong> سنوياً
        </div>
      </div>
      )}

      {/* empty state */}
      {periods.length===0&&(
        <div style={{textAlign:'center',padding:'48px 24px'}}>
          <div style={{fontSize:52,marginBottom:16}}>📋</div>
          <div style={{fontSize:16,fontWeight:800,color:txt,marginBottom:8}}>لا توجد بيانات بعد</div>
          <div style={{fontSize:13,color:txt2,marginBottom:24,lineHeight:1.8}}>أدخل تاريخ ميلادك والمدد الوظيفية في صفحة البيانات حتى تظهر نتائجك هنا.</div>
          <button onClick={()=>setTab('merged')} style={{padding:'13px 28px',borderRadius:14,border:'none',background:`linear-gradient(135deg,${gold},${grn})`,color:'#020A04',fontWeight:900,fontSize:14,cursor:'pointer',fontFamily:'inherit',boxShadow:`0 6px 24px ${gold}40`}}>← ابدأ بإدخال البيانات</button>
        </div>
      )}

      {/* الوضع الحالي */}
      {info.bd&&(
        <div style={{background:'linear-gradient(135deg,rgba(42,74,56,0.4),rgba(26,56,42,0.3))',borderRadius:14,padding:'12px 14px',marginBottom:12,border:`1px solid ${brd}`}}>
          <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
            <span style={{fontSize:12}}>📊</span><span style={{fontSize:12,fontWeight:700,color:gold2}}>وضعك الحالي</span>
            {ri.ex&&<Tag color={grn} bg={grnL} sm>غير مشمول</Tag>}
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:6}}>
            <div style={{background:card,borderRadius:10,padding:'8px 10px',textAlign:'center',border:`1px solid ${brd}`}}>
              <div style={{fontSize:8,color:txt2,marginBottom:1}}>المدة المتراكمة</div>
              <div style={{fontSize:18,fontWeight:800,color:gold2}}>{fI(ps.tM)}</div>
              <div style={{fontSize:8,color:txt2}}>شهر</div>
            </div>
            <div style={{background:card,borderRadius:10,padding:'8px 10px',textAlign:'center',border:`1px solid ${brd}`}}>
              <div style={{fontSize:8,color:txt2,marginBottom:1}}>السن النظامي</div>
              <div style={{fontSize:11,fontWeight:800,color:gold2}}>{ri.lb}</div>
              {ri.dt&&<div style={{fontSize:7,color:txt2}}>{ri.dt.toLocaleDateString('ar-SA')}</div>}
            </div>
            <div style={{background:ps.tM>=ri.eR?grnL:redL,borderRadius:10,padding:'8px 10px',textAlign:'center',border:`1px solid ${ps.tM>=ri.eR?grn:red}30`}}>
              <div style={{fontSize:8,color:txt2,marginBottom:1}}>التقاعد المبكر</div>
              {ps.tM>=ri.eR
                ?<div style={{fontSize:11,fontWeight:700,color:grn}}>✓ مؤهل</div>
                :<div style={{fontSize:10,fontWeight:800,color:red}}>{fMD(Math.max(0,ri.eR-ps.tM))}</div>
              }
            </div>
          </div>
        </div>
      )}

      {/* ── عداد الأشهر الدائري ── */}
      {(()=>{
        const todayISO=new Date().toISOString().split('T')[0];
        // أشهر حتى اليوم
        let tD={oM:0,nM:0,vM:0,cM:0,wM:0};
        periods.filter(p=>p.st!=='مستبعد'&&p.sd&&new Date(p.sd)<=new Date(todayISO)).forEach(p=>{
          const raw=p.ac?todayISO:(p.ed||'');
          const e=raw>todayISO?todayISO:raw;
          if(!e)return;
          const c=mdfCal(p.sd,e,p.cal||'g');const m=c.t;
          if(p.sy==='تقاعد مدني')tD.cM+=m;else if(p.sy==='تقاعد عسكري')tD.wM+=m;
          else if(p.sy==='اشتراك اختياري')tD.vM+=m;
          else{new Date(p.sd)<new Date('2001-04-25')?tD.oM+=m:tD.nM+=m}
        });
        const todayTotal=tD.oM+tD.nM+tD.vM+tD.cM+tD.wM;
        const fullTotal=ps.tM;
        if(!fullTotal)return null;

        // أنواع المدد
        const types=[
          {lb:'تأمينات قديم',actual:tD.oM,plan:ps.oM-tD.oM,clr:org,sub:'÷600'},
          {lb:'تأمينات 1421',actual:tD.nM,plan:ps.nM-tD.nM,clr:blu,sub:'÷480'},
          {lb:'مدني/عسكري',actual:tD.cM+tD.wM,plan:(ps.cM+ps.wM)-(tD.cM+tD.wM),clr:'#14B8A6',sub:'÷480'},
          {lb:'اختياري',actual:tD.vM,plan:ps.vM-tD.vM,clr:pur,sub:'÷480'},
        ].filter(t=>t.actual+t.plan>0);

        // بناء القطاعات: ملون=فعلي، رمادي=مخطط
        const allSegs=[];
        types.forEach(t=>{
          if(t.actual>0)allSegs.push({val:t.actual,clr:t.clr,real:true});
          if(t.plan>0)allSegs.push({val:t.plan,clr:'#CBD5E1',real:false});
        });

        const S=210,OR=86,IR=58,cx=S/2,cy=S/2;
        const GAP=allSegs.length>1?0.022:0;
        const usable=2*Math.PI-allSegs.length*GAP;
        let ang=-Math.PI/2;
        const paths=allSegs.map(s=>{
          const sw=s.val/fullTotal*usable;
          const sa=ang+GAP/2,ea=sa+sw;ang=ea+GAP/2;
          const la=sw>Math.PI?1:0;
          const px=(v,r)=>(cx+r*Math.cos(v)).toFixed(2),py=(v,r)=>(cy+r*Math.sin(v)).toFixed(2);
          return{...s,d:`M${px(sa,OR)} ${py(sa,OR)} A${OR} ${OR} 0 ${la} 1 ${px(ea,OR)} ${py(ea,OR)} L${px(ea,IR)} ${py(ea,IR)} A${IR} ${IR} 0 ${la} 0 ${px(sa,IR)} ${py(sa,IR)} Z`};
        });

        // احتساب المعاش حتى اليوم — نفس منطق المعاش الحالي
        const lSd=ps.lS||0;
        const cap150d=s60?Math.min(lSd,Math.min(s60*1.5,45000)):Math.min(lSd,45000);
        let penToday=0;
        if(tf.has&&tf.cEnd){
          const cY_d=tf.cM/12,iM_d=tD.oM+tD.nM+tD.vM,iY_d=iM_d/12,tY_d=cY_d+iY_d;
          if(tf.lastSys==='تقاعد'){
            penToday=+(tf.cS*tY_d/40).toFixed(0);
          } else {
            const{dY:dYd,dM:dMd,dD:dDd}=hijriGap(tf.cEnd,todayISO);
            const actD=actCalc(dYd,dMd,dDd);
            const prodD=tf.cS*actD.final;
            if(cap150d<=0){penToday=+(prodD*cY_d/40).toFixed(0);}
            else if(prodD>cap150d){penToday=+(cap150d*tY_d/40).toFixed(0);}
            else{penToday=+(prodD*cY_d/40+cap150d*iY_d/40).toFixed(0);}
          }
        } else {
          penToday=Math.max(0,+(tD.oM*cap150d/600+tD.nM*cap150d/480+tD.vM*cap150d/480).toFixed(0));
        }
        penToday=Math.max(0,penToday);
        const penFull=pen.f;

        return(
          <div style={{...crd,marginBottom:12}}>
            <SH icon="📊" label="ملخص المدد الزمنية" color={gold}/>

            {/* الدائرة — في المنتصف */}
            <div style={{display:'flex',justifyContent:'center',marginBottom:16}}>
              <div style={{position:'relative',width:S,flexShrink:0}}>
                <svg viewBox={`0 0 ${S} ${S}`} style={{width:'100%',display:'block',filter:'drop-shadow(0 6px 20px rgba(0,0,0,0.10))'}}>
                  {paths.map((p,i)=><path key={i} d={p.d} fill={p.clr} stroke={bg2} strokeWidth="2.5"/>)}
                  <circle cx={cx} cy={cy} r={IR-3} fill={bg2}/>
                  <text x={cx} y={cy-22} textAnchor="middle" fontSize="8" fill={txt2} fontFamily="Tajawal,sans-serif">حتى اليوم</text>
                  <text x={cx} y={cy-8} textAnchor="middle" fontSize="24" fontWeight="900" fill={gold2} fontFamily="Tajawal,sans-serif">{Math.floor(todayTotal)}</text>
                  <text x={cx} y={cy+8} textAnchor="middle" fontSize="9" fill={txt2} fontFamily="Tajawal,sans-serif">من {Math.floor(fullTotal)} شهر</text>
                  <text x={cx} y={cy+20} textAnchor="middle" fontSize="8" fill={txt2} fontFamily="Tajawal,sans-serif">{(todayTotal/12).toFixed(1)} / {(fullTotal/12).toFixed(1)} سنة</text>
                </svg>
              </div>
            </div>

            {/* مفتاح الألوان */}
            <div style={{display:'flex',justifyContent:'center',gap:12,marginBottom:14,flexWrap:'wrap'}}>
              <div style={{display:'flex',alignItems:'center',gap:5,fontSize:10,color:txt2}}>
                <div style={{width:12,height:8,borderRadius:3,background:types[0]?.clr||gold}}/>فعلي (حتى اليوم)
              </div>
              <div style={{display:'flex',alignItems:'center',gap:5,fontSize:10,color:txt2}}>
                <div style={{width:12,height:8,borderRadius:3,background:'#CBD5E1'}}/>مخطط (حتى التقاعد)
              </div>
            </div>

            {/* بطاقات الأنواع — 3 مستطيلات */}
            {(()=>{
              const insurA=tD.oM+tD.nM+tD.vM;
              const govA=tD.cM+tD.wM;
              const planAll=fullTotal-todayTotal;
              const three=[
                {lb:'تأمينات',val:insurA,clr:blu,gray:false,
                  rows:[...(tD.oM?[{lb:'قديم',val:tD.oM}]:[]),...(tD.nM?[{lb:'1421',val:tD.nM}]:[]),...(tD.vM?[{lb:'اختياري',val:tD.vM}]:[])],
                },
                {lb:'مدني/عسكري',val:govA,clr:'#14B8A6',gray:false,
                  rows:[...(tD.cM?[{lb:'مدني',val:tD.cM}]:[]),...(tD.wM?[{lb:'عسكري',val:tD.wM}]:[])],
                },
                {lb:'مخطط',val:planAll,clr:'#94A3B8',gray:true,
                  rows:[{lb:'حتى التقاعد',val:planAll}],
                },
              ].filter(t=>t.val>0);
              return(
                <div style={{display:'grid',gridTemplateColumns:`repeat(${three.length},1fr)`,gap:8,marginBottom:12}}>
                  {three.map((t,i)=>(
                    <div key={i} style={{background:t.gray?'#F8FAFC':bg,borderRadius:14,padding:'12px 10px',border:`1.5px solid ${t.gray?'#E2E8F0':t.clr+'25'}`}}>
                      <div style={{display:'flex',alignItems:'center',gap:5,marginBottom:8}}>
                        <div style={{width:8,height:8,borderRadius:3,background:t.clr,flexShrink:0}}/>
                        <span style={{fontSize:10,fontWeight:700,color:t.gray?'#64748B':txt}}>{t.lb}</span>
                        <span style={{fontSize:8,color:txt2,marginRight:'auto'}}>÷480</span>
                      </div>
                      <div style={{fontSize:14,fontWeight:900,color:t.clr,lineHeight:1.3,marginBottom:6}}>{fMD(t.val)}</div>
                      <div style={{fontSize:8,color:txt2,marginBottom:4}}>{(t.val*100/(fullTotal||1)).toFixed(0)}%</div>
                      {t.rows.length>1&&(
                        <div style={{display:'flex',flexDirection:'column',gap:3,borderTop:`1px solid ${brd}`,paddingTop:6}}>
                          {t.rows.map((r,j)=>(
                            <div key={j} style={{display:'flex',justifyContent:'space-between',fontSize:8}}>
                              <span style={{color:txt2}}>{r.lb}</span>
                              <strong style={{color:t.clr}}>{fMD(r.val)}</strong>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              );
            })()}

            {/* إجمالي + احتساب مستقل */}
            <div style={{display:'flex',alignItems:'center',gap:0}}>
              <div style={{flex:1,background:goldL,borderRadius:14,padding:'12px 6px',textAlign:'center',border:`1px solid ${gold}25`}}>
                <div style={{fontSize:8,color:txt2,marginBottom:2,fontWeight:500}}>حتى اليوم</div>
                <div style={{fontSize:14,fontWeight:900,color:gold2,lineHeight:1.2}}>{fMD(todayTotal)}</div>
                <div style={{fontSize:8,color:txt2,marginTop:2}}>{(todayTotal/12).toFixed(1)} سنة</div>
              </div>
              <div style={{fontSize:18,fontWeight:900,color:'#CBD5E1',padding:'0 6px',flexShrink:0,userSelect:'none'}}>+</div>
              <div style={{flex:1,background:'#F1F5F9',borderRadius:14,padding:'12px 6px',textAlign:'center',border:'1px solid #E2E8F0'}}>
                <div style={{fontSize:8,color:'#94A3B8',marginBottom:2,fontWeight:500}}>مخطط إضافي</div>
                <div style={{fontSize:14,fontWeight:900,color:'#94A3B8',lineHeight:1.2}}>{fMD(Math.max(0,fullTotal-todayTotal))}</div>
                <div style={{fontSize:8,color:'#94A3B8',marginTop:2}}>{((fullTotal-todayTotal)/12).toFixed(1)} سنة</div>
              </div>
              <div style={{fontSize:18,fontWeight:900,color:'#CBD5E1',padding:'0 6px',flexShrink:0,userSelect:'none'}}>=</div>
              <div style={{flex:1,background:bg,borderRadius:14,padding:'12px 6px',textAlign:'center',border:`1px solid ${brd}`}}>
                <div style={{fontSize:8,color:txt2,marginBottom:2,fontWeight:500}}>الإجمالي عند التقاعد</div>
                <div style={{fontSize:14,fontWeight:900,color:gold,lineHeight:1.2}}>{fMD(fullTotal)}</div>
                <div style={{fontSize:8,color:txt2,marginTop:2}}>{(fullTotal/12).toFixed(1)} سنة</div>
              </div>
            </div>

            {/* احتساب مستقل للمعاش */}
            {info.rd&&todayTotal>0&&(
              <div style={{marginTop:10,display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
                <div style={{background:goldL,borderRadius:12,padding:'10px',textAlign:'center',border:`1px solid ${gold}30`}}>
                  <div style={{fontSize:8,color:txt2,marginBottom:3}}>معاش لو تقاعدت اليوم</div>
                  <div style={{fontSize:18,fontWeight:900,color:gold2}}>{fmt(penToday)}</div>
                  <div style={{fontSize:8,color:txt2}}>ر.س / شهر</div>
                </div>
                <div style={{background:bg,borderRadius:12,padding:'10px',textAlign:'center',border:`1px solid ${brd}`}}>
                  <div style={{fontSize:8,color:txt2,marginBottom:3}}>معاش عند التقاعد المخطط</div>
                  <div style={{fontSize:18,fontWeight:900,color:gold}}>{fmt(penFull)}</div>
                  <div style={{fontSize:8,color:txt2}}>ر.س / شهر</div>
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {/* ══ مقارنة السيناريوهات (مدد مختلطة) ══ */}
      {hasMixedSys&&tf.has&&(()=>{
        // احتساب المعاش لكل سيناريو
        const a0=r150.app;
        const pO0=+(ps.oM*a0/600).toFixed(2);
        const pN0=+(ps.nM*a0/480).toFixed(2);
        const dr0=deps>=3?.2:deps===2?.15:deps===1?.1:0;
        const dA0=+(pO0*dr0).toFixed(2);
        let pV0=0;
        ps.sd.filter(p=>p.sy==='اشتراك اختياري'&&p.st!=='مستبعد').forEach(p=>{pV0+=(mdfCal(p.sd,p.ac?aEnd:p.ed,p.cal||'g').t*p.sl)/480});
        const pC0=tf.penNoMerge||0;
        const t0=pO0+pN0+dA0+pV0+pC0;
        const pen0=+(t0>0&&t0<1983.75?1983.75:t0).toFixed(0);

        const tAct=+(tf.pen+pV0).toFixed(0);
        const penAct=Math.max(1983.75,tAct);

        const lSl=ps.lS||1200;
        const addPen=m=>+(m*lSl/480).toFixed(0);

        const scenarios=[
          {
            id:'none',title:'بدون ضم',sub:'معاشان مستقلان',
            clr:blu,light:bluL,
            pen:pen0,
            retireLbl:'مبكر + نظامي',earlyOk:ps.tM>=ri.eR,
            rows:[
              ps.oM>0&&{lb:`قديم (${ps.oM}ش÷600)`,val:fmt(pO0),clr:org},
              {lb:`جديد (${ps.nM}ش÷480)`,val:fmt(pN0),clr:blu},
              pC0>0&&{lb:`مدني (${tf.cM}ش÷480)`,val:fmt(pC0),clr:'#14B8A6'},
              pV0>0&&{lb:'اختياري',val:fmt(pV0),clr:pur},
            ].filter(Boolean),
          },
          {
            id:'merged',title:'ضم بدون تحول',sub:'اكتواري — نظامي فقط',
            clr:'#D97706',light:'#FFFBEB',
            pen:penAct,
            retireLbl:'نظامي فقط (60س+)',earlyOk:false,
            rows:[
              {lb:`اكتواري (${tf.tY.toFixed(1)}س×${tf.act.final})`,val:fmt(tf.pen),clr:'#D97706'},
              pV0>0&&{lb:'اختياري',val:fmt(pV0),clr:pur},
            ].filter(Boolean),
          },
          {
            id:'transfer',title:'ضم مع تحول',sub:'اكتواري — مبكر + نظامي',
            clr:gold,light:goldL,
            pen:penAct,
            retireLbl:'مبكر + نظامي',earlyOk:ps.tM>=ri.eR,
            rows:[
              {lb:`اكتواري (${tf.tY.toFixed(1)}س×${tf.act.final})`,val:fmt(tf.pen),clr:gold2},
              pV0>0&&{lb:'اختياري',val:fmt(pV0),clr:pur},
            ].filter(Boolean),
          },
        ];

        return(
          <div style={{...crd,marginBottom:14}}>
            <SH icon="⚖️" label="مقارنة سيناريوهات الضم" color={gold}/>
            <div style={{overflowX:'auto',paddingBottom:8}}>
              <div style={{display:'flex',gap:10,justifyContent:'center',minWidth:'min-content',margin:'0 auto'}}>
                {scenarios.map(sc=>(
                  <div key={sc.id} style={{width:210,borderRadius:18,overflow:'hidden',border:`1.5px solid ${sc.clr}30`,boxShadow:'0 2px 14px rgba(0,0,0,0.07)',flexShrink:0,display:'flex',flexDirection:'column'}}>

                    {/* Header */}
                    <div style={{background:`linear-gradient(135deg,${sc.clr}E0,${sc.clr}90)`,padding:'12px 14px'}}>
                      <div style={{fontSize:12,fontWeight:800,color:'#fff'}}>{sc.title}</div>
                      <div style={{fontSize:8,color:'rgba(255,255,255,0.8)',marginTop:2}}>{sc.sub}</div>
                    </div>

                    {/* المعاش */}
                    <div style={{padding:'14px 14px 10px',textAlign:'center',background:bg2}}>
                      <div style={{fontSize:8,color:txt2,marginBottom:4}}>المعاش المتوقع</div>
                      <div style={{fontSize:26,fontWeight:900,color:sc.clr,lineHeight:1}}>{fI(sc.pen)}</div>
                      <div style={{fontSize:8,color:txt2,marginTop:2}}>ريال / شهر</div>
                      <div style={{marginTop:8,display:'inline-block',background:sc.earlyOk?grnL:redL,borderRadius:20,padding:'3px 9px',fontSize:8,fontWeight:700,color:sc.earlyOk?grn:red,border:`1px solid ${sc.earlyOk?grn:red}25`}}>
                        {sc.retireLbl}
                      </div>
                    </div>

                    {/* التفاصيل */}
                    <div style={{padding:'0 14px 10px',background:bg2,flex:1}}>
                      {sc.rows.map((r,i)=>(
                        <div key={i} style={{display:'flex',justifyContent:'space-between',padding:'5px 0',borderTop:`1px solid ${brd}`,fontSize:9}}>
                          <span style={{color:txt2,fontSize:8}}>{r.lb}</span>
                          <strong style={{color:r.clr}}>{r.val}</strong>
                        </div>
                      ))}
                    </div>

                    {/* خطة التحسين المختصرة */}
                    <div style={{padding:'10px 14px',background:sc.light,borderTop:`1px solid ${sc.clr}15`}}>
                      <div style={{fontSize:7.5,color:txt2,marginBottom:5,fontWeight:600}}>أثر الاشتراك الإضافي</div>
                      {[{m:12,lb:'+ سنة'},{m:60,lb:'+ 5 سنوات'}].map(x=>(
                        <div key={x.m} style={{display:'flex',justifyContent:'space-between',fontSize:9,marginBottom:3}}>
                          <span style={{color:txt2}}>{x.lb}</span>
                          <strong style={{color:sc.clr}}>+{fI(addPen(x.m))} ر.س</strong>
                        </div>
                      ))}
                      <button onClick={()=>setTab('improve')} style={{marginTop:6,width:'100%',padding:'6px',borderRadius:10,border:`1px solid ${sc.clr}40`,background:'transparent',color:sc.clr,fontWeight:700,fontSize:9,cursor:'pointer',fontFamily:'inherit'}}>
                        خطة التحسين ←
                      </button>
                    </div>

                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      })()}

      {/* مقارنة المعاش الحالي والمتوقع */}
      {(()=>{
        const todayISO=new Date().toISOString().split('T')[0];
        let tD2={oM:0,nM:0,vM:0};
        periods.filter(p=>p.st!=='مستبعد'&&p.sd&&new Date(p.sd)<=new Date(todayISO)).forEach(p=>{
          const raw=p.ac?todayISO:(p.ed||'');const e=raw>todayISO?todayISO:raw;
          if(!e)return;const c=mdfCal(p.sd,e,p.cal||'g');const m=c.t;
          if(p.sy==='اشتراك اختياري')tD2.vM+=m;
          else if(!p.sy.includes('تقاعد')){new Date(p.sd)<new Date('2001-04-25')?tD2.oM+=m:tD2.nM+=m}
        });
        // المعاش الحالي: تاريخ اليوم = تاريخ التقاعد، آخر أجر = متوسط الـ24 شهر (افتراض)
        const lS=ps.lS||0;
        const cap150=s60?Math.min(lS,Math.min(s60*1.5,45000)):Math.min(lS,45000);
        const iM_today=tD2.oM+tD2.nM+tD2.vM;
        let penNow=0,penCivil=0,penIns=0;
        if(tf.has&&tf.cEnd){
          const cY_now=tf.cM/12,iY_today=iM_today/12,tY_today=cY_now+iY_today;
          if(tf.lastSys==='تقاعد'){
            penNow=+(tf.cS*tY_today/40).toFixed(0);
            penCivil=penNow;penIns=0;
          } else {
            // فجوة من انتهاء الخدمة المدنية لليوم
            const{dY:dYt,dM:dMt,dD:dDt}=hijriGap(tf.cEnd,todayISO);
            const actT=actCalc(dYt,dMt,dDt);
            // معاش التقاعد = آخر راتب مدني × المعامل الاكتواري × سنوات مدنية ÷ 40
            const prodT=tf.cS*actT.final;
            penCivil=+(prodT*cY_now/40).toFixed(0);
            // معاش التأمينات = متوسط التأمينات × سنوات التأمينات ÷ 40
            penIns=cap150>0?+(cap150*iY_today/40).toFixed(0):0;
            // الإجمالي يراعي حالة تجاوز الحد (cap150)
            if(cap150<=0){penNow=penCivil;}
            else if(prodT>cap150){penNow=+(cap150*tY_today/40).toFixed(0);}
            else{penNow=penCivil+penIns;}
          }
        } else {
          penIns=Math.max(0,+(tD2.oM*cap150/600+tD2.nM*cap150/480+tD2.vM*cap150/480).toFixed(0));
          penCivil=0;penNow=penIns;
        }
        penNow=Math.max(0,penNow);
        const penExp=pen.f;
        if(!penNow&&!penExp)return null;

        const bars=[
          {lb:'المعاش الحالي',sub:'لو تقاعدت اليوم',val:penNow,clr:'#64748B',light:'#F1F5F9'},
          {lb:'المعاش المتوقع',sub:'عند تاريخ التقاعد',val:penExp,clr:gold,light:goldL},
        ];
        const maxV=Math.max(...bars.map(b=>b.val),1);

        // SVG
        const W=240,H=110,PL=0,PT=30,PB=28;
        const bW=46,gap=28,totalW=bars.length*(bW+gap)-gap;
        const startX=(W-totalW)/2;
        const ch=H-PT-PB;
        const bh=v=>Math.max(4,(v/maxV)*ch);
        const by=v=>PT+ch-bh(v);
        const abbr=v=>v>=1000?`${(v/1000).toFixed(1)}K`:String(v);

        return(
          <div style={{...crd,marginBottom:12}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:4}}>
              <span style={{fontSize:13,fontWeight:800,color:txt,letterSpacing:-0.3}}>مقارنة المعاش</span>
              <span style={{fontSize:9,color:txt2}}>ريال / شهر</span>
            </div>
            <div style={{display:'flex',gap:12,alignItems:'flex-start'}}>

              {/* الرسم */}
              <svg viewBox={`0 0 ${W} ${H}`} style={{flex:'0 0 auto',width:W,maxWidth:'55%',display:'block'}}>
                {/* خطوط شبكة أفقية خفيفة */}
                {[0.33,0.67,1].map((r,i)=>(
                  <line key={i} x1={startX} y1={PT+ch-(r*ch)} x2={startX+totalW} y2={PT+ch-(r*ch)} stroke={brd} strokeWidth="0.5" strokeDasharray="3,4"/>
                ))}
                {bars.map((b,i)=>{
                  const x=startX+i*(bW+gap);
                  const h=bh(b.val),y=by(b.val);
                  const R=6;
                  return(
                    <g key={i}>
                      {/* ظل خفيف */}
                      <rect x={x+2} y={y+2} width={bW} height={h} rx={R} fill="rgba(0,0,0,0.04)"/>
                      {/* العمود */}
                      <rect x={x} y={y} width={bW} height={h} rx={R} fill={b.clr} opacity="0.85"/>
                      {/* تدرج علوي */}
                      <rect x={x} y={y} width={bW} height={Math.min(h,20)} rx={R} fill="rgba(255,255,255,0.18)"/>
                      {/* القيمة فوق العمود */}
                      <text x={x+bW/2} y={y-6} textAnchor="middle" fontSize="9" fontWeight="700" fill={b.clr} fontFamily="Tajawal,sans-serif">{fI(b.val)}</text>
                      {/* التسمية */}
                      <text x={x+bW/2} y={H-12} textAnchor="middle" fontSize="7.5" fill={txt2} fontFamily="Tajawal,sans-serif">{b.lb}</text>
                    </g>
                  );
                })}
                {/* محور X */}
                <line x1={startX} y1={PT+ch} x2={startX+totalW} y2={PT+ch} stroke={brd} strokeWidth="0.8"/>
              </svg>

              {/* البيانات النصية */}
              <div style={{flex:1,display:'flex',flexDirection:'column',gap:10,paddingTop:4}}>
                {bars.map((b,i)=>(
                  <div key={i} style={{background:b.light,borderRadius:14,padding:'10px 12px',border:`1px solid ${b.clr}20`}}>
                    <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:4}}>
                      <div style={{width:8,height:8,borderRadius:2,background:b.clr,flexShrink:0}}/>
                      <span style={{fontSize:9,fontWeight:600,color:txt2}}>{b.lb}</span>
                    </div>
                    <div style={{fontSize:20,fontWeight:900,color:b.clr,lineHeight:1}}>{fmt(b.val)}</div>
                    <div style={{fontSize:8,color:txt2,marginTop:2}}>{b.sub}</div>
                    {i===0&&(penCivil>0||penIns>0)&&(
                      <div style={{marginTop:8,paddingTop:7,borderTop:'1px dashed #E2E8F0',display:'flex',alignItems:'center',gap:6}}>
                        {penCivil>0&&(
                          <div style={{flex:1,background:'#F0FDFA',borderRadius:8,padding:'5px 6px',textAlign:'center',border:'1px solid #99F6E4'}}>
                            <div style={{fontSize:7,color:'#0F766E',marginBottom:1,fontWeight:600}}>معاش التقاعد</div>
                            {(mergedPeriods||transferProgram)&&tf.has&&(
                              <div style={{fontSize:6,color:'#14B8A6',marginBottom:2,fontWeight:500,letterSpacing:0.2}}>احتساب اكتواري</div>
                            )}
                            <div style={{fontSize:12,fontWeight:800,color:'#0D9488'}}>{fmt(penCivil)}</div>
                          </div>
                        )}
                        {penCivil>0&&penIns>0&&(
                          <div style={{fontSize:12,fontWeight:700,color:'#CBD5E1',flexShrink:0}}>+</div>
                        )}
                        {penIns>0&&(
                          <div style={{flex:1,background:'#EFF6FF',borderRadius:8,padding:'5px 6px',textAlign:'center',border:`1px solid ${blu}30`}}>
                            <div style={{fontSize:7,color:blu,marginBottom:1,fontWeight:600}}>معاش التأمينات</div>
                            <div style={{fontSize:12,fontWeight:800,color:blu}}>{fmt(penIns)}</div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
                {penNow>0&&penExp>penNow&&(
                  <div style={{background:grnL,borderRadius:12,padding:'8px 10px',border:`1px solid ${grn}20`,textAlign:'center'}}>
                    <div style={{fontSize:8,color:txt2}}>الزيادة المتوقعة</div>
                    <div style={{fontSize:14,fontWeight:800,color:grn}}>+{fmt(penExp-penNow)}</div>
                    <div style={{fontSize:7,color:txt2}}>ريال / شهر</div>
                  </div>
                )}
              </div>

            </div>

            {/* ملاحظة الافتراضات */}
            <div style={{display:'flex',alignItems:'flex-start',gap:6,marginTop:10,padding:'8px 10px',borderRadius:10,background:'#F8FAFC',border:'1px solid #E2E8F0'}}>
              <span style={{fontSize:11,flexShrink:0,marginTop:1}}>ℹ️</span>
              <span style={{fontSize:8,color:'#64748B',lineHeight:1.7}}>
                <strong style={{color:'#475569'}}>افتراضات المعاش الحالي: </strong>
                تاريخ اليوم هو تاريخ التقاعد الافتراضي، والأجر الحالي ({fI(lS)} ر.س) يُعتبر متوسطاً لآخر 24 شهراً في التأمينات.
                {tf.has&&tf.cEnd&&<> المعامل الاكتواري محتسب من انتهاء الخدمة المدنية حتى اليوم ({tf.lastSys==='تقاعد'?'آخر نظام: مدني':'آخر نظام: تأمينات'}).</>}
                {' '}الأرقام تقديرية وقد تختلف عند تطبيق قاعدة الـ150% أو وجود مدد استثنائية.
              </span>
            </div>
          </div>
        );
      })()}

      {/* المعاش المتوقع */}
      <div style={{background:`linear-gradient(145deg,#022C22 0%,${gold} 55%,#10B981 100%)`,borderRadius:24,padding:'30px 16px',textAlign:'center',marginBottom:12,position:'relative',overflow:'hidden',boxShadow:`0 12px 40px ${gold}35`}}>
        <div style={{position:'absolute',top:-50,right:-50,width:180,height:180,background:'radial-gradient(circle,rgba(255,255,255,0.1) 0%,transparent 65%)'}}/>
        <div style={{position:'absolute',bottom:-30,left:-30,width:140,height:140,background:'radial-gradient(circle,rgba(255,255,255,0.06) 0%,transparent 70%)'}}/>
        <div style={{position:'relative'}}>
          <div style={{fontSize:10,color:'rgba(255,255,255,0.7)',letterSpacing:2,marginBottom:10,fontWeight:500}}>المعاش التقاعدي المتوقع</div>
          <div style={{fontSize:52,fontWeight:900,color:'#FFFFFF',lineHeight:1,marginBottom:8,textShadow:'0 2px 20px rgba(0,0,0,0.2)'}}>{fmt(pen.f)}</div>
          <div style={{fontSize:13,color:'rgba(255,255,255,0.6)'}}>ريال سعودي / شهر</div>
          <div style={{marginTop:10,background:'rgba(255,255,255,0.15)',borderRadius:20,display:'inline-block',padding:'5px 16px',fontSize:10,color:'rgba(255,255,255,0.9)'}}>الأجر المعتمد: <strong>{fmt(pen.a)} ر.س</strong></div>
        </div>
      </div>


      {/* شارة وضع الاحتساب */}
      {pen.actMode&&(
        <div style={{background:pen.isMerged?redL:bluL,borderRadius:12,padding:'10px 14px',marginBottom:10,border:`1px solid ${pen.isMerged?red:blu}30`,display:'flex',gap:10,alignItems:'center',fontSize:11}}>
          <span style={{fontSize:18}}>{pen.isMerged?'🔗':'🏢'}</span>
          <div>
            <div style={{fontWeight:700,color:pen.isMerged?red:blu}}>{pen.isMerged?'وضع ضم المدة — احتساب اكتواري موحّد':'وضع التخصيص والتحول — احتساب اكتواري'}</div>
            <div style={{fontSize:9,color:txt2,marginTop:2}}>{pen.isMerged?'لا يُسمح بالتقاعد قبل سن 60.':'يُسمح بالتقاعد المبكر إذا استوفيت شرط المدة.'}</div>
          </div>
        </div>
      )}

      {/* تفاصيل المعاش */}
      <div style={crd}>
        <SH icon="📊" label="تفاصيل المعاش" color={gold}/>
        {pen.actMode?[
          {lb:`معاش اكتواري موحّد (${tf.tY.toFixed(1)} سنة)`,val:pen.pC,clr:pur},
          pen.pV>0&&{lb:'الاشتراك الاختياري',val:pen.pV,clr:pur,p:true},
        ].filter(Boolean).map((row,i)=>(
          <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 0',borderBottom:`1px solid ${brd2}`}}>
            <span style={{fontSize:11,color:txt2}}>{row.lb}</span><strong style={{fontSize:13,color:row.clr}}>{row.p?'+':''}{fmt(row.val)}</strong>
          </div>
        )):[
          pen.pO>0&&{lb:`الفترة القديمة (${ps.oM} شهر ÷600)`,val:pen.pO,clr:org},
          {lb:`الفترة الجديدة (${ps.nM} شهر ÷480)`,val:pen.pN,clr:blu},
          pen.dA>0&&{lb:`بدل الإعالة (${deps} معال)`,val:pen.dA,clr:org,p:true},
          pen.pV>0&&{lb:'الاشتراك الاختياري',val:pen.pV,clr:pur,p:true},
          pen.pC>0&&{lb:`معاش مدني/عسكري (${tf.cM} ش × ${fI(tf.cS)} ÷ 480)`,val:pen.pC,clr:blu,p:true},
        ].filter(Boolean).map((row,i)=>(
          <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 0',borderBottom:`1px solid ${brd2}`}}>
            <span style={{fontSize:11,color:txt2}}>{row.lb}</span><strong style={{fontSize:13,color:row.clr}}>{row.p?'+':''}{fmt(row.val)}</strong>
          </div>
        ))}
        <div style={{display:'flex',justifyContent:'space-between',paddingTop:10,fontSize:11}}><span style={{fontWeight:700}}>إجمالي المدة</span><span style={{color:txt2}}>{fMD(ps.tM)} ({(ps.tM/12).toFixed(1)} سنة)</span></div>
      </div>

      {/* تبادل المنافع */}
      {tf.has&&!pen.actMode&&(
        <div style={{...crd,border:`1px solid ${blu}30`,borderRight:`3px solid ${blu}`}}>
          <SH icon="🔄" label="تبادل المنافع — نظام م/53" color={blu}/>
          <div style={{fontSize:11,lineHeight:2}}>
            <div>النظام الأخير: <strong style={{color:gold2}}>{tf.lastSys==='تقاعد'?'التقاعد المدني':'التأمينات الاجتماعية'}</strong></div>
            <div style={{color:txt2,fontSize:10}}>راتب مدني: <strong style={{color:txt}}>{fI(tf.cS)} ر.س</strong> | مدة مدنية: <strong>{tf.cY.toFixed(1)} سنة</strong> | إجمالي: <strong>{tf.tY.toFixed(1)} سنة</strong></div>
            {tf.lastSys==='تقاعد'?(
              <div style={{background:bluL,borderRadius:10,padding:'10px 12px',marginTop:8,border:`1px solid ${blu}25`}}>
                <div style={{fontSize:9,color:txt2}}>{fI(tf.cS)} × {tf.cM} ÷ 480</div>
                <div style={{fontSize:18,fontWeight:800,color:gold2,marginTop:4}}>{fmt(tf.penNoMerge)} ر.س / شهر</div>
              </div>
            ):(
              <>
              <div style={{background:bg2,borderRadius:10,padding:'10px 12px',marginTop:8,border:`1px solid ${brd}`}}>
                <div>الفجوة (هجري): <strong>{tf.dY}س {tf.dM}ش {tf.dD}ي</strong> | المعامل: <strong style={{color:blu}}>{tf.act.final}</strong></div>
                <div>حاصل الضرب: {fI(tf.cS)} × {tf.act.final} = <strong style={{color:tf.exceeded?red:grn}}>{fmt(tf.product)} ر.س</strong></div>
                <div style={{color:txt2}}>متوسط التأمينات: <strong style={{color:txt}}>{fmt(avg)} ر.س</strong></div>
              </div>
              <div style={{background:tf.exceeded?redL:grnL,borderRadius:10,padding:'10px 12px',marginTop:8,border:`1px solid ${tf.exceeded?red:grn}30`}}>
                {tf.exceeded?<><div style={{fontWeight:700,color:red,fontSize:11}}>تجاوز المتوسط → تسوية كاملة</div><div style={{fontSize:9,color:txt2}}>= {fmt(avg)} × {tf.tY.toFixed(1)} ÷ 40</div></>
                :tf.split?<><div style={{fontWeight:700,color:grn,fontSize:11}}>تسوية مقسومة</div>
                  <div style={{fontSize:9}}>مدني: {fmt(tf.product)} × {tf.cY.toFixed(1)} ÷ 40 = {fmt(tf.pen1)}</div>
                  <div style={{fontSize:9}}>تأمينات: {fmt(avg)} × {tf.iY.toFixed(1)} ÷ 40 = {fmt(tf.pen2)}</div></>
                :<div style={{fontSize:9}}>= {fmt(tf.product)} × {tf.cY.toFixed(1)} ÷ 40</div>}
                <div style={{fontSize:18,fontWeight:800,color:gold2,marginTop:4}}>الإجمالي: {fmt(tf.pen)} ر.س / شهر</div>
              </div>
              </>
            )}
          </div>
        </div>
      )}

      <div style={{background:bg2,borderRadius:12,padding:'8px 12px',fontSize:8,color:txt2,lineHeight:2,border:`1px solid ${brd}`,marginBottom:12}}>
        <strong style={{color:gold}}>المراجع: </strong>نظام التأمينات م/33 (1421هـ) م.38 • تبادل المنافع م/53 (1424هـ) • قرار م.الوزراء 3/7/2024م البند خامساً • م.24 لائحة التسجيل
      </div>

      <button onClick={()=>setTab('improve')} style={{
        width:'100%',padding:'15px',borderRadius:16,border:`2px solid ${gold}`,
        background:'transparent',color:gold2,fontWeight:800,fontSize:14,
        cursor:'pointer',fontFamily:'inherit',letterSpacing:0.2,
        display:'flex',alignItems:'center',justifyContent:'center',gap:10,
        transition:'all 0.2s',
      }}
        onMouseEnter={e=>{e.currentTarget.style.background=goldL}}
        onMouseLeave={e=>{e.currentTarget.style.background='transparent'}}
      >
        <span style={{fontSize:18}}>💡</span>
        ترغب في تحسين معاشك؟
        <span style={{fontSize:14}}>←</span>
      </button>
    </div>)}

    {/* ════ تبويب خطة التحسين ════ */}
    {tab==='improve'&&(<div>

      {/* أجور آخر 24 شهر — تخطيط عمودين */}
      <div style={{display:'flex',alignItems:'center',gap:10,margin:'0 0 8px'}}>
        <div style={{flex:1,height:1,background:brd}}/><div style={{fontSize:11,color:txt2,whiteSpace:'nowrap'}}>أجور آخر 24 شهر</div><div style={{flex:1,height:1,background:brd}}/>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:12,alignItems:'start'}}>

        {/* اليمين: جدول الأجور */}
        <div style={{background:card,borderRadius:16,padding:'10px 8px',border:`1px solid ${brd}`,boxShadow:'0 2px 8px rgba(0,0,0,0.05)'}}>
          <div style={{fontSize:11,fontWeight:700,color:gold2,marginBottom:6}}>💰 أجر كل شهر</div>
          <button onClick={()=>setSals(s24.map(()=>ps.lS||0))} style={{padding:'5px 8px',borderRadius:8,border:`1px solid ${pur}`,background:purL,color:pur,fontWeight:700,fontSize:9,cursor:'pointer',fontFamily:'inherit',marginBottom:6,width:'100%'}}>↙ تعبئة بآخر أجر ({fI(ps.lS)} ر.س)</button>
          <div style={{borderRadius:10,border:`1px solid ${brd}`,overflow:'hidden',maxHeight:400,overflowY:'auto'}}>
            {s24.map((l,i)=>(
              <div key={i} style={{display:'grid',gridTemplateColumns:'auto 1fr',padding:'2px 5px',borderBottom:`1px solid ${brd}`,background:i%2===0?bg2:card,alignItems:'center',gap:3}}>
                <div style={{fontSize:7.5,fontWeight:600,color:gold2,minWidth:38,lineHeight:1.3}}>{l.split(' ')[0]}<br/>{l.split(' ')[1]}</div>
                <div style={{display:'flex',gap:2,alignItems:'center'}}>
                  <input type="number" value={sals[i]||''} placeholder="0" onChange={e=>{const c=[...sals];c[i]=+e.target.value;setSals(c)}} style={{...inp,flex:1,minWidth:0,direction:'ltr',textAlign:'center',padding:'3px 4px',fontSize:11}}/>
                  {sals[i]>0&&<button onClick={()=>setSals(prev=>prev.map((s,j)=>j>i?sals[i]:s))} style={{padding:'3px 5px',borderRadius:6,border:`1px solid ${gold}50`,background:goldL,color:gold2,fontSize:8,cursor:'pointer',fontFamily:'inherit',flexShrink:0,lineHeight:1}}>↓</button>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* اليسار: المتوسط + 150% */}
        <div style={{display:'flex',flexDirection:'column',gap:8}}>
          <div style={{background:`linear-gradient(135deg,${gold} 0%,#10B981 100%)`,borderRadius:16,padding:'16px 10px',textAlign:'center',boxShadow:`0 6px 20px ${gold}30`}}>
            <div style={{fontSize:9,color:'rgba(255,255,255,0.75)',letterSpacing:1.5,marginBottom:3,fontWeight:500}}>متوسط آخر 24 شهر</div>
            <div style={{fontSize:30,fontWeight:900,color:'#FFFFFF',lineHeight:1}}>{fmt(avg)}</div>
            <div style={{fontSize:9,color:'rgba(255,255,255,0.6)',marginTop:3}}>ريال سعودي</div>
          </div>
          {s60>0&&(
            <div style={{background:card,borderRadius:14,padding:'10px 10px',border:`1px solid ${brd}`,boxShadow:'0 2px 8px rgba(0,0,0,0.05)'}}>
              <div style={{fontSize:11,fontWeight:700,color:blu,marginBottom:6}}>📐 قاعدة 150%</div>
              <div style={{fontSize:10,lineHeight:2}}>
                <div style={{display:'flex',justifyContent:'space-between',padding:'2px 0',borderBottom:`1px solid ${brd2}`}}><span style={{color:txt2,fontSize:9}}>أجر الشهر 60</span><strong style={{color:blu}}>{fI(s60)}</strong></div>
                <div style={{display:'flex',justifyContent:'space-between',padding:'2px 0'}}><span style={{color:txt2,fontSize:9}}>الحد 150%</span><strong>{fI(r150.l)}</strong></div>
                {r150.on&&<div style={{background:r150.ov?redL:grnL,borderRadius:8,padding:'6px 8px',marginTop:4,fontWeight:700,color:r150.ov?red:grn,fontSize:10,border:`1px solid ${r150.ov?red:grn}30`}}>{r150.ov?`تجاوز → ${fI(r150.l)} ر.س`:`ضمن الحد → ${fmt(r150.app)} ر.س`}</div>}
              </div>
            </div>
          )}
          <div style={{background:bluL,borderRadius:10,padding:'8px 10px',fontSize:9,color:blu,lineHeight:1.7,border:`1px solid ${blu}20`}}>
            💡 متوسط آخر 24 شهر هو أساس حساب معاشك. اضغط ↓ لنسخ الأجر للصفوف التالية.
          </div>
        </div>
      </div>

      {/* المعاش المستهدف */}
      <div style={{...crd,marginBottom:12}}>
        <SH icon="🎯" label="المعاش المستهدف" color={gold}/>
        <input type="number" value={target||''} onChange={e=>setTarget(+e.target.value)} placeholder="أدخل المعاش المرغوب (ريال/شهر)" style={{...inp,border:`2px solid ${gold}50`,color:gold2,fontSize:15,fontWeight:800,direction:'ltr',textAlign:'center',padding:'11px'}}/>
        {target>0&&target>pen.f&&(
          <div style={{background:redL,borderRadius:10,padding:'10px 12px',marginTop:8,border:`1px solid ${red}25`,fontSize:11,lineHeight:2}}>
            <div>الفرق: <strong style={{color:red}}>{fI(target-pen.f)} ريال / شهر</strong></div>
            <div style={{color:txt2}}>المدة الإضافية المقدّرة: <strong style={{color:txt}}>{Math.ceil(((target-pen.f)*480)/(pen.a||ps.lS||1200))} شهر</strong></div>
          </div>
        )}
        {target>0&&target<=pen.f&&<div style={{background:grnL,borderRadius:10,padding:'10px',marginTop:8,border:`1px solid ${grn}30`,fontSize:12,fontWeight:700,color:grn,textAlign:'center'}}>✓ المعاش المستهدف محقق!</div>}
      </div>

      <div style={crd}>
        <SH icon="💡" label="خطة تحسين المعاش" color={gold}/>

        {/* الشرح الاحترافي */}
        <div style={{background:'#F8FAFC',borderRadius:10,padding:'9px 12px',marginBottom:12,border:'1px solid #E2E8F0',fontSize:9,color:'#4B5563',lineHeight:2}}>
          <span style={{fontWeight:700,color:gold2}}>💡 كيف يعمل؟ </span>
          يمكنك زيادة معاشك عبر مسارين:{' '}
          <span style={{color:blu,fontWeight:600}}>📌 إلزامي</span> — كل زيادة في راتبك ترفع معاشك (9% موظف + 12% جهة)،{' '}
          <span style={{color:pur,fontWeight:600}}>📊 اختياري</span> — ترفع شريحتك 10% سنوياً بتكلفة 18% من الشريحة شهرياً (م.24 لائحة التسجيل).
          {is50H&&<><br/><span style={{color:org,fontWeight:600}}>⚠️ تنبيه: </span>عمرك تجاوز 50 سنة هجرية — الزيادة القصوى 10% سنوياً على الشريحة السابقة.</>}
        </div>

        {/* جدولا الاشتراك */}
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:12}}>

          {/* ── اختياري ── */}
          <div style={{borderRadius:12,overflow:'hidden',border:`1.5px solid ${pur}30`,boxShadow:`0 2px 10px ${pur}10`}}>
            <div style={{background:`linear-gradient(135deg,${pur},#9333EA)`,padding:'8px 10px'}}>
              <div style={{fontSize:11,fontWeight:800,color:'#fff'}}>📊 اشتراك اختياري</div>
              <div style={{fontSize:7.5,color:'rgba(255,255,255,0.75)',marginTop:1}}>18% من شريحة الأجر شهرياً</div>
            </div>
            <div style={{background:purL,padding:'0 0 6px'}}>
              <table style={{width:'100%',fontSize:8,borderCollapse:'collapse'}}>
                <thead>
                  <tr style={{background:`${pur}12`}}>
                    <th style={{padding:'5px 5px',textAlign:'right',color:pur,fontWeight:700,borderBottom:`1px solid ${pur}25`,fontSize:7.5}}>السنة</th>
                    <th style={{padding:'5px 5px',textAlign:'right',color:txt2,fontWeight:600,borderBottom:`1px solid ${pur}25`,fontSize:7.5}}>الشريحة</th>
                    <th style={{padding:'5px 5px',textAlign:'right',color:pur,fontWeight:800,borderBottom:`1px solid ${pur}25`,fontSize:8}}>شهري<br/><span style={{fontSize:6.5,fontWeight:500,color:txt2}}>(ر.س)</span></th>
                    <th style={{padding:'5px 5px',textAlign:'right',color:gold2,fontWeight:700,borderBottom:`1px solid ${pur}25`,fontSize:7.5}}>سنوي<br/><span style={{fontSize:6.5,fontWeight:400,color:txt2}}>(ر.س)</span></th>
                  </tr>
                </thead>
                <tbody>
                  {optRows.map((r,i)=>(
                    <tr key={r.y} style={{background:i%2===0?'rgba(255,255,255,0.6)':'transparent',borderBottom:`1px solid ${brd2}`}}>
                      <td style={{padding:'4px 5px',fontWeight:600,color:txt,fontSize:8}}>{r.y}</td>
                      <td style={{padding:'4px 5px',color:txt2,fontSize:7.5}}>{fI(r.b)}</td>
                      <td style={{padding:'4px 5px',fontWeight:900,color:pur,fontSize:9.5}}>{fI(r.opt)}</td>
                      <td style={{padding:'4px 5px',fontWeight:700,color:gold2,fontSize:8}}>{fI(r.b*0.18*12)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{background:`${pur}15`,borderTop:`1.5px solid ${pur}30`}}>
                    <td colSpan={2} style={{padding:'5px 5px',fontWeight:800,color:pur,fontSize:8.5}}>الإجمالي التراكمي</td>
                    <td style={{padding:'5px 5px',fontSize:7,color:txt2}}>—</td>
                    <td style={{padding:'5px 5px',fontWeight:900,color:pur,fontSize:9}}>{fI(Math.round(optRows.reduce((s,r)=>s+r.b*0.18*12,0)))}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* ── إلزامي ── */}
          <div style={{borderRadius:12,overflow:'hidden',border:`1.5px solid ${blu}30`,boxShadow:`0 2px 10px ${blu}10`}}>
            <div style={{background:`linear-gradient(135deg,${blu},#1D4ED8)`,padding:'8px 10px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <div>
                <div style={{fontSize:11,fontWeight:800,color:'#fff'}}>📌 اشتراك إلزامي</div>
                <div style={{fontSize:7.5,color:'rgba(255,255,255,0.75)',marginTop:1}}>9% موظف + 12% جهة العمل</div>
              </div>
              <div style={{display:'flex',alignItems:'center',gap:3,background:'rgba(255,255,255,0.15)',borderRadius:7,padding:'3px 6px'}}>
                <span style={{fontSize:7.5,color:'rgba(255,255,255,0.85)'}}>زيادة:</span>
                <input type="number" value={mandRaise} onChange={e=>setMandRaise(Math.max(0,Math.min(50,+e.target.value)))} style={{width:30,padding:'1px 3px',borderRadius:5,border:'none',fontSize:9,textAlign:'center',fontFamily:'inherit',background:'rgba(255,255,255,0.25)',color:'#fff'}}/>
                <span style={{fontSize:7.5,color:'rgba(255,255,255,0.85)'}}>%</span>
              </div>
            </div>
            <div style={{background:bluL,padding:'0 0 6px'}}>
              <table style={{width:'100%',fontSize:8,borderCollapse:'collapse'}}>
                <thead>
                  <tr style={{background:`${blu}10`}}>
                    <th style={{padding:'5px 5px',textAlign:'right',color:blu,fontWeight:700,borderBottom:`1px solid ${blu}25`,fontSize:7.5}}>السنة</th>
                    <th style={{padding:'5px 5px',textAlign:'right',color:txt2,fontWeight:600,borderBottom:`1px solid ${blu}25`,fontSize:7.5}}>الأجر</th>
                    <th style={{padding:'5px 5px',textAlign:'right',color:blu,fontWeight:800,borderBottom:`1px solid ${blu}25`,fontSize:8}}>موظف/شهر<br/><span style={{fontSize:6.5,fontWeight:500,color:txt2}}>(9%)</span></th>
                    <th style={{padding:'5px 5px',textAlign:'right',color:gold2,fontWeight:700,borderBottom:`1px solid ${blu}25`,fontSize:7.5}}>إجمالي/شهر<br/><span style={{fontSize:6.5,fontWeight:400,color:txt2}}>(21%)</span></th>
                  </tr>
                </thead>
                <tbody>
                  {mandRows.map((r,i)=>(
                    <tr key={r.y} style={{background:i%2===0?'rgba(255,255,255,0.6)':'transparent',borderBottom:`1px solid ${brd2}`}}>
                      <td style={{padding:'4px 5px',fontWeight:600,color:txt,fontSize:8}}>{r.y}</td>
                      <td style={{padding:'4px 5px',color:txt2,fontSize:7.5}}>{fI(r.sal)}</td>
                      <td style={{padding:'4px 5px',fontWeight:900,color:blu,fontSize:9.5}}>{fI(r.emp)}</td>
                      <td style={{padding:'4px 5px',fontWeight:700,color:gold2,fontSize:8}}>{fI(r.tot)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{background:`${blu}12`,borderTop:`1.5px solid ${blu}30`}}>
                    <td colSpan={2} style={{padding:'5px 5px',fontWeight:800,color:blu,fontSize:8.5}}>إجمالي الموظف</td>
                    <td style={{padding:'5px 5px',fontWeight:900,color:blu,fontSize:9}}>{fI(Math.round(mandRows.reduce((s,r)=>s+r.emp*12,0)))}</td>
                    <td style={{padding:'5px 5px',fontWeight:900,color:gold2,fontSize:9}}>{fI(Math.round(mandRows.reduce((s,r)=>s+r.tot*12,0)))}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

        </div>

        {/* التكلفة على المشترك والمعاش الناتج */}
        {(()=>{
          const BASE=pen.f;
          // تكلفة الاختياري التراكمية (18% × الشريحة)
          const optCostPts=[0,12,24,36,48,60,84,120].map(x=>{
            let cost=0,rem=x;
            for(const r of optRows){const take=Math.min(rem,12);cost+=take*r.b*0.18;rem-=take;if(rem<=0)break;}
            return{x,cost:Math.round(cost)};
          });
          // تكلفة الإلزامي التراكمية على الموظف فقط (9% × الأجر)
          const mandCostPts=[0,12,24,36,48,60,84,120].map(x=>{
            let cost=0,rem=x;
            for(const r of mandRows){const take=Math.min(rem,12);cost+=take*r.sal*0.09;rem-=take;if(rem<=0)break;}
            return{x,cost:Math.round(cost)};
          });
          // المعاش الناتج (نفسه للمسارين)
          const penPts=[0,12,24,36,48,60,84,120].map(x=>{
            let tot=BASE,rem=x;
            for(const r of mandRows){const take=Math.min(rem,12);tot+=take*r.sal/480;rem-=take;if(rem<=0)break;}
            return{x,pen:Math.round(tot)};
          });

          const ROWS=[12,24,60,120];
          const LBL={12:'سنة واحدة',24:'سنتان',60:'5 سنوات',120:'10 سنوات'};

          // بيانات الأعمدة — فقط النقاط المطلوبة
          const BAR_X=[12,24,60,120];
          const barData=BAR_X.map(x=>({
            x,
            lbl:LBL[x],
            opt:optCostPts.find(p=>p.x===x)?.cost??0,
            mand:mandCostPts.find(p=>p.x===x)?.cost??0,
            pen:penPts.find(p=>p.x===x)?.pen??BASE,
          }));
          const maxC=Math.max(...barData.flatMap(d=>[d.opt,d.mand]),1);
          const abbr=v=>v>=1000?`${(v/1000).toFixed(0)}K`:String(v);

          return(
            <div style={{...crd,marginBottom:12}}>
              <SH icon="📊" label="التكلفة على المشترك مقابل المعاش الناتج" color={gold}/>
              {/* الجدول */}
              <div style={{marginTop:10,borderRadius:12,overflow:'hidden',border:`1px solid ${brd}`}}>
                <table style={{width:'100%',fontSize:8,borderCollapse:'collapse'}}>
                  <thead>
                    <tr style={{background:bg}}>
                      {['المدة','المعاش الناتج','تكلفة الاختياري','تكلفة الإلزامي'].map(h=>(
                        <th key={h} style={{padding:'6px 6px',textAlign:'right',color:txt2,fontWeight:600,borderBottom:`1px solid ${brd}`}}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {barData.map((d,i)=>(
                      <tr key={d.x} style={{background:i%2?bg:'transparent',borderBottom:`1px solid ${brd2}`}}>
                        <td style={{padding:'6px 6px',fontWeight:700,color:txt}}>{d.lbl}</td>
                        <td style={{padding:'6px 6px',fontWeight:700,color:gold2}}>{fmt(d.pen)} ر.س</td>
                        <td style={{padding:'6px 6px',color:pur}}>{fI(d.opt)} ر.س</td>
                        <td style={{padding:'6px 6px',color:blu}}>{fI(d.mand)} ر.س</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })()}

        {/* ── ملخص التكلفة الشاملة ── */}
        {(()=>{
          const totalOptCost=Math.round(optRows.reduce((s,r)=>s+r.b*0.18*12,0));
          const addPenVol=Math.round(optRows.reduce((s,r)=>s+12*r.b/480,0));
          const today2=new Date();
          const earlyNeedNow=Math.max(0,ri.eR-ps.tM);
          const earlyDateISO2=earlyNeedNow===0?today2.toISOString().split('T')[0]:new Date(today2.getFullYear(),today2.getMonth()+earlyNeedNow,today2.getDate()).toISOString().split('T')[0];
          const planMonths=info.rd&&earlyDateISO2?Math.max(0,Math.round((new Date(info.rd)-new Date(earlyDateISO2))/864e5/30.44)):optRows.length*12;
          const opportunityCost=Math.round(pen.f*planMonths);
          const totalRealCost=totalOptCost+opportunityCost;
          const penAfter=pen.f+addPenVol;
          const breakEvenM=addPenVol>0?Math.ceil(totalRealCost/addPenVol):null;
          if(!optRows.length)return null;
          return(
            <div style={{borderRadius:16,overflow:'hidden',border:`1.5px solid ${gold}40`,marginBottom:12,boxShadow:`0 4px 20px ${gold}12`}}>
              {/* العنوان */}
              <div style={{background:`linear-gradient(135deg,${gold2},${gold})`,padding:'12px 14px'}}>
                <div style={{fontSize:13,fontWeight:900,color:'#fff',letterSpacing:-0.2}}>💰 ملخص التكلفة الشاملة لخطة التحسين</div>
                <div style={{fontSize:8.5,color:'rgba(255,255,255,0.75)',marginTop:2}}>تكلفة الاشتراك + الفرصة الضائعة + نقطة التعادل</div>
              </div>

              <div style={{background:bg2,padding:'12px 14px',display:'flex',flexDirection:'column',gap:10}}>

                {/* البند 1: تكلفة الاشتراك الاختياري */}
                <div style={{background:purL,borderRadius:12,padding:'10px 12px',border:`1px solid ${pur}25`}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:4}}>
                    <div style={{fontSize:10,fontWeight:700,color:pur}}>📊 إجمالي الاشتراك الاختياري</div>
                    <div style={{fontSize:8,color:txt2}}>طوال {optRows.length} سنة</div>
                  </div>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline'}}>
                    <div style={{fontSize:8,color:txt2,lineHeight:1.8}}>
                      {optRows.length} سنة × متوسط {fI(Math.round(optRows.reduce((s,r)=>s+r.opt,0)/optRows.length))} ريال/شهر × 12
                    </div>
                    <div style={{fontSize:17,fontWeight:900,color:pur}}>{fI(totalOptCost)} <span style={{fontSize:9,fontWeight:500}}>ر.س</span></div>
                  </div>
                </div>

                {/* البند 2: الفرصة الضائعة */}
                {planMonths>0&&pen.f>0&&(
                  <div style={{background:redL,borderRadius:12,padding:'10px 12px',border:`1px solid ${red}25`}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6}}>
                      <div style={{fontSize:10,fontWeight:700,color:red}}>⏳ تكلفة الفرصة الضائعة</div>
                      <div style={{fontSize:8,color:txt2,background:'rgba(239,68,68,0.1)',borderRadius:6,padding:'2px 6px'}}>معاش تقاعدي فائت</div>
                    </div>
                    <div style={{fontSize:8.5,color:'#6B1010',lineHeight:2,marginBottom:6}}>
                      أنت مؤهل للتقاعد المبكر براتب <strong style={{color:red}}>{fmt(pen.f)} ر.س/شهر</strong> — لكنك تؤجل التقاعد {fI(planMonths)} شهر لتحسين المعاش. هذا المعاش يُعدّ تكلفة فعلية لخطة التحسين.
                    </div>
                    <div style={{display:'grid',gridTemplateColumns:'1fr auto 1fr auto 1fr',alignItems:'center',gap:4,background:'rgba(239,68,68,0.06)',borderRadius:8,padding:'7px 10px',border:`1px solid ${red}15`}}>
                      <div style={{textAlign:'center'}}>
                        <div style={{fontSize:7,color:txt2}}>معاش المبكر</div>
                        <div style={{fontSize:11,fontWeight:800,color:red}}>{fmt(pen.f)}</div>
                      </div>
                      <div style={{fontSize:14,color:txt2,textAlign:'center'}}>×</div>
                      <div style={{textAlign:'center'}}>
                        <div style={{fontSize:7,color:txt2}}>أشهر التأجيل</div>
                        <div style={{fontSize:11,fontWeight:800,color:txt}}>{fI(planMonths)}</div>
                      </div>
                      <div style={{fontSize:14,color:txt2,textAlign:'center'}}>=</div>
                      <div style={{textAlign:'center'}}>
                        <div style={{fontSize:7,color:red}}>المعاش الضائع</div>
                        <div style={{fontSize:11,fontWeight:900,color:red}}>{fI(opportunityCost)}</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* البند 3: الإجمالي الحقيقي */}
                <div style={{background:`linear-gradient(135deg,${gold}12,${pur}08)`,borderRadius:12,padding:'12px 14px',border:`1.5px solid ${gold}35`}}>
                  <div style={{fontSize:10,color:txt2,marginBottom:6,fontWeight:600}}>إجمالي التكلفة الفعلية الشاملة</div>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline'}}>
                    <div style={{fontSize:8,color:txt2}}>
                      {fI(totalOptCost)} (اشتراك){planMonths>0&&pen.f>0?` + ${fI(opportunityCost)} (فرصة ضائعة)`:''}
                    </div>
                    <div style={{fontSize:20,fontWeight:900,color:gold2}}>{fI(totalRealCost)} <span style={{fontSize:10,fontWeight:500}}>ر.س</span></div>
                  </div>
                </div>

                {/* البند 4: الزيادة والتعادل */}
                {addPenVol>0&&(
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
                    <div style={{background:grnL,borderRadius:12,padding:'10px 12px',border:`1px solid ${grn}30`,textAlign:'center'}}>
                      <div style={{fontSize:8,color:txt2,marginBottom:3}}>زيادة المعاش بعد الخطة</div>
                      <div style={{fontSize:8,color:txt2,marginBottom:4}}>من {fmt(pen.f)} ← إلى</div>
                      <div style={{fontSize:15,fontWeight:900,color:grn}}>{fmt(penAfter)}</div>
                      <div style={{fontSize:8,color:grn,fontWeight:700,marginTop:2}}>+{fmt(addPenVol)} ر.س / شهر</div>
                    </div>
                    {breakEvenM&&(
                      <div style={{background:goldL,borderRadius:12,padding:'10px 12px',border:`1px solid ${gold}30`,textAlign:'center'}}>
                        <div style={{fontSize:8,color:txt2,marginBottom:3}}>نقطة التعادل</div>
                        <div style={{fontSize:8,color:txt2,marginBottom:4}}>تسترد تكلفتك بعد</div>
                        <div style={{fontSize:15,fontWeight:900,color:gold2}}>{fI(breakEvenM)}</div>
                        <div style={{fontSize:8,color:gold2,fontWeight:700,marginTop:2}}>شهر ({(breakEvenM/12).toFixed(1)} سنة)</div>
                      </div>
                    )}
                  </div>
                )}

              </div>
            </div>
          );
        })()}

        {/* زر استخراج التقرير */}
        <button onClick={printReport} style={{
          width:'100%',marginTop:4,padding:'15px',borderRadius:16,border:'none',
          background:`linear-gradient(135deg,${gold},#047857)`,
          color:'#FFFFFF',fontWeight:800,fontSize:14,cursor:'pointer',
          fontFamily:'inherit',letterSpacing:0.3,
          display:'flex',alignItems:'center',justifyContent:'center',gap:10,
          boxShadow:`0 8px 28px ${gold}35`,
        }}>
          <span style={{fontSize:18}}>📄</span>
          استخراج التقرير الكامل — PDF
        </button>

      </div>
    </div>)}

    </div>
  </div>
  );
}

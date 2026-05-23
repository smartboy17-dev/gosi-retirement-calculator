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
const allowedBK=last=>{if(!last||last<=0)return BK;const mx=last*1.1;return BK.filter(b=>b>=last&&b<=mx).concat(BK.filter(b=>b>mx).slice(0,1))};

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
      if(p.sl>0)lS=p.sl});
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
    let all=[];ps.sd.filter(p=>p.st!=='مستبعد'&&p.sl>0).forEach(p=>{
      const c=mdfCal(p.sd,p.ac?aEnd:p.ed,p.cal||'g');for(let i=0;i<c.t;i++)all.push(p.sl)});
    return all.length>=60?all[all.length-60]:(all[0]||0);
  },[ps,aEnd]);

  const avg=useMemo(()=>{const f=sals.filter(s=>s>0);return f.length?f.reduce((a,b)=>a+b,0)/f.length:0},[sals]);
  const r150=useMemo(()=>{if(!s60)return{on:false,app:avg};const l=s60*1.5;return{on:true,l,ov:avg>l,app:avg>l?l:avg};},[s60,avg]);

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
  const addP=()=>setPeriods(p=>[...p,{id:Date.now(),emp:'',sd:'',ed:'',ac:false,sl:0,sy:SYS[0],st:'منتهي',cal:'g',sdH:'',edH:''}]);
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

  // ── استخراج تقرير PDF ──────────────────────────────────────────
  const printReport=()=>{
    const tStr=new Date().toLocaleDateString('ar-SA',{year:'numeric',month:'long',day:'numeric'});
    const bdStr=info.bd?`${new Date(info.bd).toLocaleDateString('ar-SA')} — ${fmtHijri(info.bd)}`:'—';
    const rdStr=info.rd?`${new Date(info.rd).toLocaleDateString('ar-SA')} — ${fmtHijri(info.rd)}`:'—';
    const ageStr=info.bd?`${age(info.bd).g} م / ${age(info.bd).h} هـ`:'—';
    const prRows=periods.filter(p=>p.st!=='مستبعد'&&p.sd).map((p,i)=>{
      const e=p.ac?new Date().toISOString().split('T')[0]:p.ed;
      const c=mdfCal(p.sd,e,p.cal||'g');
      return`<tr><td>${i+1}</td><td>${p.emp||'—'}</td><td>${p.sd}</td><td>${p.ed||'مستمر'}</td><td>${c.m} شهر</td><td>${p.sy}</td><td>${fI(p.sl)} ر.س</td></tr>`;
    }).join('');
    const penRows=[
      ps.oM>0?`<tr><td>فترة قديمة ÷ 600</td><td>${ps.oM} شهر</td><td>${fmt(pen.pO)} ر.س</td></tr>`:'',
      `<tr><td>فترة جديدة ÷ 480</td><td>${ps.nM} شهر</td><td>${fmt(pen.pN)} ر.س</td></tr>`,
      pen.dA>0?`<tr><td>بدل إعالة (${deps} معال)</td><td>—</td><td>+${fmt(pen.dA)} ر.س</td></tr>`:'',
      pen.pV>0?`<tr><td>اشتراك اختياري</td><td>${ps.vM} شهر</td><td>+${fmt(pen.pV)} ر.س</td></tr>`:'',
      pen.pC>0?`<tr><td>معاش مدني/عسكري</td><td>${tf.cM} شهر</td><td>+${fmt(pen.pC)} ر.س</td></tr>`:'',
    ].filter(Boolean).join('');
    const html=`<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;700;900&display=swap" rel="stylesheet">
<style>
@page{size:A4 portrait;margin:14mm 18mm}
*{font-family:'Tajawal',sans-serif;box-sizing:border-box;margin:0;padding:0}
body{font-size:9.5pt;color:#111;direction:rtl;line-height:1.55}
.hdr{display:flex;justify-content:space-between;align-items:center;border-bottom:2pt solid #059669;padding-bottom:7pt;margin-bottom:12pt}
h1{font-size:16pt;color:#059669;font-weight:900}
h2{font-size:10.5pt;color:#059669;font-weight:800;margin:9pt 0 5pt;border-right:3pt solid #059669;padding-right:6pt}
.g2{display:grid;grid-template-columns:1fr 1fr;gap:7pt;margin-bottom:9pt}
.g3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:7pt;margin-bottom:9pt}
.g4{display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:6pt;margin-bottom:9pt}
.c{border:.5pt solid #E5E7EB;border-radius:4pt;padding:6pt 9pt}
.lbl{font-size:7pt;color:#6B7280;margin-bottom:2pt}
.val{font-size:10pt;font-weight:700;color:#0C1F14}
.vg{color:#059669}
table{width:100%;border-collapse:collapse;font-size:8.5pt;margin-bottom:9pt}
th{background:#059669;color:#fff;padding:4pt 6pt;text-align:right;font-weight:700;font-size:8pt}
td{padding:3.5pt 6pt;border-bottom:.5pt solid #F3F4F6}
tr:nth-child(even) td{background:#F9FAFB}
tfoot td{font-weight:700;background:#ECFDF5;color:#059669}
.pbox{background:#ECFDF5;border:1pt solid #059669;border-radius:5pt;padding:9pt;text-align:center;margin:8pt 0}
.pamt{font-size:24pt;font-weight:900;color:#059669}
.note{font-size:7pt;color:#6B7280;border:.5pt solid #E5E7EB;border-radius:4pt;padding:5pt 8pt;margin-top:8pt;line-height:1.7}
.pg{page-break-after:always}
.ftr{margin-top:12pt;padding-top:5pt;border-top:.5pt solid #E5E7EB;font-size:7pt;color:#9CA3AF;display:flex;justify-content:space-between}
.badge{display:inline-block;border-radius:20pt;padding:1.5pt 7pt;font-size:7.5pt;font-weight:700}
.bg{background:#ECFDF5;color:#059669;border:.5pt solid #059669}
.br{background:#FEF2F2;color:#EF4444;border:.5pt solid #EF4444}
</style></head><body>
<div class="hdr">
  <div><h1>تقرير المعاش التقاعدي</h1><div style="font-size:8pt;color:#6B7280;margin-top:2pt">المؤسسة العامة للتأمينات الاجتماعية • نظام م/33 • تبادل المنافع م/53 • تعديلات 3/7/2024م</div></div>
  <div style="text-align:left;font-size:8pt;color:#6B7280">${tStr}</div>
</div>
<h2>البيانات الشخصية</h2>
<div class="g3">
  <div class="c"><div class="lbl">تاريخ الميلاد</div><div class="val">${bdStr}</div></div>
  <div class="c"><div class="lbl">العمر الحالي</div><div class="val">${ageStr}</div></div>
  <div class="c"><div class="lbl">تاريخ التقاعد المخطط</div><div class="val">${rdStr}</div></div>
</div>
<h2>مدد الخدمة</h2>
<table><thead><tr><th>#</th><th>جهة العمل</th><th>من</th><th>إلى</th><th>المدة</th><th>النظام</th><th>الأجر</th></tr></thead>
<tbody>${prRows||'<tr><td colspan="7" style="text-align:center;color:#9CA3AF">لا توجد مدد</td></tr>'}</tbody>
<tfoot><tr><td colspan="4">الإجمالي</td><td>${ps.tM} شهر (${(ps.tM/12).toFixed(1)} سنة)</td><td>—</td><td>${fI(ps.lS)} ر.س</td></tr></tfoot></table>
<h2>الوضع التأميني — قرار 3/7/2024م</h2>
<div class="g4">
  <div class="c"><div class="lbl">العمر الهجري في 3/7/2024</div><div class="val">${ri.aRH?`${ri.aRH.yrs}س ${ri.aRH.mths}ش هجري`:`${ri.aR} سنة`}</div></div>
  <div class="c"><div class="lbl">الخدمة في 3/7/2024</div><div class="val">${psAtRF.tM} شهر</div></div>
  <div class="c"><div class="lbl">سن التقاعد النظامي</div><div class="val vg">${ri.lb}</div></div>
  <div class="c"><div class="lbl">تاريخ التقاعد النظامي</div><div class="val">${ri.dt?ri.dt.toLocaleDateString('ar-SA'):'—'}</div></div>
</div>
<div class="c" style="margin-bottom:9pt;${ps.tM>=ri.eR?'background:#ECFDF5;border-color:#059669':'background:#FEF2F2;border-color:#EF4444'}">
  <span class="lbl">التقاعد المبكر (${ri.eR} شهر): </span>
  <span class="val" style="color:${ps.tM>=ri.eR?'#059669':'#EF4444'}">${ps.tM>=ri.eR?`✓ مؤهل — ${ps.tM} شهر`:`ينقص ${ri.eR-ps.tM} شهر (المتحقق: ${ps.tM} شهر)`}</span>
</div>
<div class="pg"></div>
<h2>المعاش التقاعدي المتوقع</h2>
<div class="pbox"><div class="lbl">عند تاريخ التقاعد المخطط</div><div class="pamt">${fmt(pen.f)} <span style="font-size:11pt">ريال / شهر</span></div><div class="lbl">الأجر المعتمد: ${fmt(pen.a)} ر.س</div></div>
<h2>تفاصيل الاحتساب</h2>
<table><thead><tr><th>البند</th><th>التفاصيل</th><th>القيمة</th></tr></thead>
<tbody>${penRows||'<tr><td colspan="3" style="text-align:center;color:#9CA3AF">—</td></tr>'}</tbody>
<tfoot><tr><td>الإجمالي</td><td>${ps.tM} شهر (${(ps.tM/12).toFixed(1)} سنة)</td><td>${fmt(pen.f)} ر.س / شهر</td></tr></tfoot></table>
${tf.has?`<h2>تبادل المنافع — م/53</h2><div class="g4">
  <div class="c"><div class="lbl">آخر راتب مدني</div><div class="val">${fI(tf.cS)} ر.س</div></div>
  <div class="c"><div class="lbl">مدة مدنية</div><div class="val">${tf.cY.toFixed(1)} سنة</div></div>
  <div class="c"><div class="lbl">معامل اكتواري</div><div class="val">${tf.act.final}</div></div>
  <div class="c"><div class="lbl">إجمالي المدة</div><div class="val">${tf.tY.toFixed(1)} سنة</div></div>
</div>`:''}
${pen.actMode?`<div class="c" style="background:#F5F3FF;border-color:#7C3AED;margin-bottom:9pt"><span class="lbl" style="color:#7C3AED">وضع الاحتساب: </span><span class="val" style="color:#7C3AED">${pen.isMerged?'ضم المدة — احتساب اكتواري موحّد':'التخصيص والتحول — احتساب اكتواري'}</span></div>`:''}
<div class="note">
  <strong>المراجع:</strong> نظام التأمينات الاجتماعية م/33 (1421هـ) المادة 38 &nbsp;•&nbsp; نظام تبادل المنافع م/53 (1424هـ) &nbsp;•&nbsp; قرار مجلس الوزراء 3/7/2024م البند خامساً &nbsp;•&nbsp; المادة 24 من لائحة التسجيل والاشتراكات.<br>
  <strong>تنبيه:</strong> الأرقام الواردة في هذا التقرير تقديرية وتستند إلى البيانات المدخلة، ولا تُعدّ وثيقة رسمية.
</div>
<div class="ftr"><div>حاسبة التقاعد — المؤسسة العامة للتأمينات الاجتماعية</div><div>${tStr}</div></div>
</body></html>`;
    const w=window.open('','_blank','width=900,height=700');
    if(!w){alert('يرجى السماح بفتح النوافذ المنبثقة لاستخراج التقرير');return;}
    w.document.write(html);
    w.document.close();
    if(w.document.fonts?.ready){w.document.fonts.ready.then(()=>setTimeout(()=>w.print(),300));}
    else{setTimeout(()=>w.print(),700);}
  };

  // ── الثيم الفاتح العصري ──────────────────────────────────────
  const bg='#F2F6F3',bg2='#FFFFFF',card='#FFFFFF',brd='rgba(0,0,0,0.07)',brd2='rgba(0,0,0,0.04)';
  const gold='#059669',gold2='#047857',goldL='#ECFDF5';
  const grn='#10B981',grnL='#D1FAE5';
  const red='#EF4444',redL='#FEF2F2';
  const blu='#3B82F6',bluL='#EFF6FF';
  const pur='#7C3AED',purL='#F5F3FF';
  const org='#D97706',orgL='#FFFBEB';
  const txt='#0C1F14',txt2='#6B7280';

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
    <div style={{background:'linear-gradient(160deg,#022C22 0%,#065F46 55%,#059669 100%)',padding:'24px 16px 18px',paddingTop:'calc(env(safe-area-inset-top,0px)+22px)',position:'relative',overflow:'hidden'}}>
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
      {[{id:'merged',ic:'📋',lb:'البيانات'},{id:'status',ic:'📊',lb:'الوضع التأميني'},{id:'result',ic:'✨',lb:'النتائج'},{id:'improve',ic:'💡',lb:'التحسين'}].map(t=>(
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
          {info.bd&&<div style={{marginTop:6}}>
            <div style={{fontSize:13,fontWeight:700,color:gold2,textAlign:'center'}}>
              العمر الحالي: {age(info.bd).g} م / {age(info.bd).h} هـ
            </div>
            <div style={{fontSize:10,color:ri.ex?grn:txt2,textAlign:'center',marginTop:2}}>
              {ri.ex?'✓ غير مشمول بتعديلات 2024 — النظام القديم':'السن النظامي للتقاعد: '+ri.lb}
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:5,marginTop:7}}>
              <div style={{background:bg,borderRadius:9,padding:'5px 8px',border:`1px solid ${brd}`,textAlign:'center'}}>
                <div style={{fontSize:8,color:txt2}}>سن التقاعد النظامي</div>
                <div style={{fontSize:11,fontWeight:700,color:gold2}}>{ri.lb}</div>
              </div>
              <div style={{background:bg,borderRadius:9,padding:'5px 8px',border:`1px solid ${brd}`,textAlign:'center'}}>
                <div style={{fontSize:8,color:txt2}}>الخدمة للتقاعد المبكر</div>
                <div style={{fontSize:11,fontWeight:700,color:gold2}}>{ri.eR} شهر ({ri.eY} سنة)</div>
              </div>
            </div>
          </div>}
        </div>

        {/* تاريخ التقاعد */}
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:8}}>
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
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
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

      {periods.map((p,i)=>{
        const e=p.ac?aEnd:p.ed;const c=mdfCal(p.sd,e,p.cal||'g');
        const sc=p.sy.includes('اختياري')?pur:p.sy.includes('مدني')||p.sy.includes('عسكري')?blu:gold;
        return(
          <div key={p.id} style={{background:card,borderRadius:14,padding:14,marginBottom:10,border:`1px solid ${brd}`,borderRight:`3px solid ${sc}`}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
              <div style={{display:'flex',alignItems:'center',gap:8}}>
                <div style={{width:26,height:26,borderRadius:8,background:`${sc}20`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:800,color:sc,border:`1px solid ${sc}30`,flexShrink:0}}>{i+1}</div>
                <span style={{fontSize:12,fontWeight:700,color:txt}}>مدة {i+1}</span>
              </div>
              <button onClick={()=>setPeriods(x=>x.filter(q=>q.id!==p.id))} style={{padding:'4px 10px',borderRadius:8,border:'none',background:redL,color:red,fontSize:10,cursor:'pointer',fontFamily:'inherit',fontWeight:600}}>حذف</button>
            </div>

            <input value={p.emp} onChange={e=>upP(p.id,'emp',e.target.value)} placeholder="اسم جهة العمل (مثال: وزارة المالية / شركة أرامكو)" style={{...inp,marginBottom:4,textAlign:'right'}}/>
            <div style={{fontSize:9,color:txt2,marginBottom:8}}>سيظهر في التقرير النهائي كمرجع</div>

            <div style={{display:'flex',gap:6,marginBottom:8,alignItems:'center'}}>
              <span style={{fontSize:11,color:txt2,fontWeight:600}}>التقويم:</span>
              {[{v:'g',lb:'م ميلادي'},{v:'h',lb:'هـ هجري'}].map(o=>(
                <button key={o.v} onClick={()=>toggleCal(p.id,o.v)} style={{padding:'4px 10px',borderRadius:8,border:`1.5px solid ${(p.cal||'g')===o.v?sc:brd}`,background:(p.cal||'g')===o.v?sc:'transparent',color:(p.cal||'g')===o.v?'#fff':txt2,fontSize:10,cursor:'pointer',fontWeight:700,fontFamily:'inherit'}}>{o.lb}</button>
              ))}
            </div>

            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:8}}>
              <div>
                <div style={{fontSize:11,color:txt2,marginBottom:4}}>تاريخ البداية {(p.cal||'g')==='h'?'(هجري)':'(ميلادي)'}</div>
                {(p.cal||'g')==='h'
                  ?<><input type="text" value={p.sdH!==undefined?p.sdH:isoToHijriStr(p.sd)} onChange={e=>handleHijriDate(p.id,'sd',e.target.value)} placeholder="1446/07/01" style={{...inp,direction:'ltr',textAlign:'center'}}/>
                    {p.sd&&<div style={{fontSize:8,color:txt2,marginTop:2,textAlign:'center'}}>{new Date(p.sd).toLocaleDateString('ar-SA')}</div>}</>
                  :<><input type="date" value={p.sd} onChange={e=>upP(p.id,'sd',e.target.value)} style={{...inp,direction:'ltr',textAlign:'center'}}/>
                    {p.sd&&<div style={{fontSize:8,color:txt2,marginTop:2,textAlign:'center'}}>{fmtHijri(p.sd)}</div>}</>
                }
              </div>
              <div>
                <div style={{fontSize:11,color:txt2,marginBottom:4}}>تاريخ النهاية {(p.cal||'g')==='h'?'(هجري)':'(ميلادي)'}</div>
                {p.ac
                  ?<div style={{padding:'10px 8px',borderRadius:10,background:grnL,color:grn,fontSize:10,fontWeight:600,textAlign:'center',border:`1px solid ${grn}30`}}>مستمر → {info.rd?new Date(info.rd).toLocaleDateString('ar-SA'):'التقاعد'}</div>
                  :(p.cal||'g')==='h'
                    ?<><input type="text" value={p.edH!==undefined?p.edH:isoToHijriStr(p.ed)} onChange={e=>handleHijriDate(p.id,'ed',e.target.value)} placeholder="1446/07/01" style={{...inp,direction:'ltr',textAlign:'center'}}/>
                      {p.ed&&<div style={{fontSize:8,color:txt2,marginTop:2,textAlign:'center'}}>{new Date(p.ed).toLocaleDateString('ar-SA')}</div>}</>
                    :<><input type="date" value={p.ed} onChange={e=>upP(p.id,'ed',e.target.value)} style={{...inp,direction:'ltr',textAlign:'center'}}/>
                      {p.ed&&<div style={{fontSize:8,color:txt2,marginTop:2,textAlign:'center'}}>{fmtHijri(p.ed)}</div>}</>
                }
              </div>
            </div>

            <label style={{display:'flex',alignItems:'center',gap:6,fontSize:11,color:grn,fontWeight:600,marginBottom:8,cursor:'pointer'}}>
              <input type="checkbox" checked={p.ac} onChange={e=>upP(p.id,'ac',e.target.checked)} style={{accentColor:grn,width:15,height:15}}/>
              على رأس العمل حتى تاريخ التقاعد
            </label>

            <div style={{display:'grid',gridTemplateColumns:`1fr 1fr${p.ac?'':' 1fr'}`,gap:6}}>
              <div>
                <div style={{fontSize:11,color:txt2,marginBottom:4}}>الأجر الشهري (ر.س)</div>
                <input type="number" value={p.sl||''} onChange={e=>upP(p.id,'sl',+e.target.value)} style={{...inp,direction:'ltr',textAlign:'center'}}/>
                <div style={{fontSize:9,color:txt2,marginTop:3}}>الأجر الخاضع للتأمين (يُستخدم لحساب المعاش)</div>
              </div>
              <div>
                <div style={{fontSize:11,color:txt2,marginBottom:4}}>النظام</div>
                <select value={p.sy} onChange={e=>upP(p.id,'sy',e.target.value)} style={{...inp,fontSize:10,appearance:'none',WebkitAppearance:'none'}}>{SYS.map(s=><option key={s}>{s}</option>)}</select>
                <div style={{fontSize:9,color:txt2,marginTop:3}}>{p.sy.includes('مدني')||p.sy.includes('عسكري')?'التقاعد المدني: وزارات + جهات حكومية':p.sy.includes('اختياري')?'الاشتراك الاختياري: للمستقلين والعاطلين':p.sy.includes('حكومي')?'تأمينات حكومي: شركات حكومية كأرامكو':'تأمينات خاص: القطاع الخاص'}</div>
              </div>
              {!p.ac&&<div>
                <div style={{fontSize:11,color:txt2,marginBottom:4}}>الحالة</div>
                <select value={p.st} onChange={e=>upP(p.id,'st',e.target.value)} style={{...inp,appearance:'none',WebkitAppearance:'none'}}><option>نشط</option><option>منتهي</option><option>مستبعد</option></select>
              </div>}
            </div>

            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:6,background:bg2,borderRadius:10,padding:'8px 6px',marginTop:8,textAlign:'center',border:`1px solid ${brd2}`}}>
              <div><div style={{fontSize:8,color:txt2,marginBottom:2}}>أشهر {(p.cal||'g')==='h'?'هجرية':'ميلادية'}</div><div style={{fontSize:20,fontWeight:800,color:gold2}}>{c.m}</div></div>
              <div><div style={{fontSize:8,color:txt2,marginBottom:2}}>أيام</div><div style={{fontSize:20,fontWeight:800,color:gold2}}>{c.d}</div></div>
              <div><div style={{fontSize:8,color:txt2,marginBottom:2}}>النظام</div><div style={{fontSize:9,fontWeight:700,color:new Date(p.sd)<new Date('2001-04-25')?org:blu}}>{new Date(p.sd)<new Date('2001-04-25')?'قديم ÷600':'جديد ÷480'}</div></div>
            </div>
          </div>
        );
      })}


      {/* أجور آخر 24 شهر */}
      <div style={{display:'flex',alignItems:'center',gap:10,margin:'16px 0 10px'}}>
        <div style={{flex:1,height:1,background:brd}}/><div style={{fontSize:11,color:txt2,whiteSpace:'nowrap'}}>أجور آخر 24 شهر</div><div style={{flex:1,height:1,background:brd}}/>
      </div>
      <div style={crd}>
        <SH icon="💰" label={`أجور آخر 24 شهر — حتى ${info.rd?new Date(info.rd).toLocaleDateString('ar-SA'):'تاريخ التقاعد'}`} color={gold}/>
        <div style={{background:bluL,borderRadius:10,padding:'8px 12px',marginBottom:10,fontSize:10,color:blu,lineHeight:1.7,border:`1px solid ${blu}20`}}>
          💡 <strong>لماذا مهمة؟</strong> متوسط أجور آخر 24 شهر هو الأساس في حساب معاشك. أدخلها بدقة للحصول على نتيجة صحيحة. يمكنك تعبئتها تلقائياً بآخر أجر مدخل في المدد.
        </div>
        <button onClick={()=>setSals(s24.map(()=>ps.lS||0))} style={{padding:'7px 12px',borderRadius:10,border:`1px solid ${pur}`,background:purL,color:pur,fontWeight:700,fontSize:10,cursor:'pointer',fontFamily:'inherit',marginBottom:8}}>تعبئة بآخر أجر — {fI(ps.lS)} ر.س</button>
        <div style={{borderRadius:12,border:`1px solid ${brd}`,overflow:'hidden',maxHeight:340,overflowY:'auto'}}>
          {s24.map((l,i)=>(
            <div key={i} style={{display:'grid',gridTemplateColumns:'1fr auto auto',padding:'3px 8px',borderBottom:`1px solid ${brd}`,background:i%2===0?bg2:card,alignItems:'center',gap:4}}>
              <div style={{fontSize:10,fontWeight:600,color:gold2}}>{l}</div>
              <input type="number" value={sals[i]||''} placeholder="0" onChange={e=>{const c=[...sals];c[i]=+e.target.value;setSals(c)}} style={{...inp,width:80,direction:'ltr',textAlign:'center',padding:'4px 6px',fontSize:12}}/>
              {sals[i]>0&&<button onClick={()=>setSals(prev=>prev.map((s,j)=>j>i?sals[i]:s))} style={{padding:'3px 7px',borderRadius:7,border:`1px solid ${brd}`,background:bg,color:txt2,fontSize:9,cursor:'pointer',fontFamily:'inherit'}}>↓</button>}
            </div>
          ))}
        </div>
      </div>

      {/* متوسط الأجور */}
      <div style={{background:`linear-gradient(135deg,${gold} 0%,#10B981 100%)`,borderRadius:20,padding:'20px 16px',textAlign:'center',marginBottom:12,boxShadow:`0 8px 30px ${gold}30`}}>
        <div style={{fontSize:10,color:'rgba(255,255,255,0.75)',letterSpacing:2,marginBottom:4,fontWeight:500}}>متوسط آخر 24 شهر</div>
        <div style={{fontSize:40,fontWeight:900,color:'#FFFFFF',lineHeight:1}}>{fmt(avg)}</div>
        <div style={{fontSize:11,color:'rgba(255,255,255,0.6)',marginTop:4}}>ريال سعودي</div>
      </div>

      {/* قاعدة 150% */}
      {s60>0&&(
        <div style={crd}>
          <SH icon="📐" label="قاعدة 150% — المادة 38" color={blu}/>
          <div style={{fontSize:11,lineHeight:2}}>
            <div style={{display:'flex',justifyContent:'space-between',padding:'4px 0',borderBottom:`1px solid ${brd2}`}}><span style={{color:txt2}}>أجر الشهر الستين</span><strong style={{color:blu}}>{fI(s60)} ر.س</strong></div>
            <div style={{display:'flex',justifyContent:'space-between',padding:'4px 0'}}><span style={{color:txt2}}>الحد الأقصى 150%</span><strong>{fI(s60*1.5)} ر.س</strong></div>
            {r150.on&&<div style={{background:r150.ov?redL:grnL,borderRadius:10,padding:'8px 10px',marginTop:6,fontWeight:700,color:r150.ov?red:grn,fontSize:11,border:`1px solid ${r150.ov?red:grn}30`}}>{r150.ov?`تجاوز → المعتمد: ${fI(r150.l)} ر.س`:`ضمن الحد → المعتمد: ${fmt(r150.app)} ر.س`}</div>}
          </div>
        </div>
      )}

      <button onClick={()=>setTab('status')} style={{width:'100%',padding:'15px',borderRadius:16,border:'none',background:`linear-gradient(135deg,${gold},${grn})`,color:'#020A04',fontWeight:900,fontSize:14,cursor:'pointer',fontFamily:'inherit',marginTop:4,boxShadow:`0 8px 32px ${gold}40`,letterSpacing:0.3}}>اعرف وضعك التأميني الحالي ←</button>
    </div>)}

    {/* ════ تبويب الوضع التقاعدي ════ */}
    {tab==='status'&&(()=>{
      const today=new Date();
      const todayISO=today.toISOString().split('T')[0];
      const monthsToStat=ri.dt?Math.max(0,Math.round((ri.dt-today)/864e5/30.44)):null;
      const earlyNeed=Math.max(0,ri.eR-ps.tM);
      const earlyNeedAtRF=Math.max(0,ri.eR-psAtRF.tM);
      // تاريخ التقاعد المبكر المتوقع (من اليوم)
      let earlyDate=null;
      if(earlyNeed===0){earlyDate=todayISO;}
      else if(info.bd){
        const future=new Date(today.getFullYear(),today.getMonth()+earlyNeed,today.getDate());
        earlyDate=future.toISOString().split('T')[0];
      }
      return(<div>

      {/* عنوان الصفحة + شرح القرار */}
      <div style={{marginBottom:12}}>
        <div style={{fontSize:16,fontWeight:900,color:txt,marginBottom:8,letterSpacing:-0.3}}>الوضع التأميني الحالي</div>
        <div style={{background:'#F8FAFC',borderRadius:14,padding:'12px 14px',border:'1px solid #E2E8F0',position:'relative',overflow:'hidden'}}>
          <div style={{position:'absolute',top:0,right:0,width:60,height:60,background:`radial-gradient(circle,${gold}15,transparent 70%)`,pointerEvents:'none'}}/>
          <div style={{display:'flex',gap:8,alignItems:'flex-start'}}>
            <span style={{fontSize:14,flexShrink:0,marginTop:1}}>📜</span>
            <div>
              <div style={{fontSize:10,fontWeight:700,color:'#374151',marginBottom:5}}>
                تعديلات نظام التقاعد — قرار مجلس الوزراء 3 يوليو 2024م
              </div>
              <div style={{fontSize:9,color:'#6B7280',lineHeight:1.9}}>
                أقرّ مجلس الوزراء تعديلات جوهرية على نظامي التقاعد المدني والتأمينات الاجتماعية، تضمّنت رفع سن التقاعد النظامي تدريجياً ورفع الحد الأدنى لمدة الخدمة اللازمة للتقاعد المبكر.
                <br/>
                <strong style={{color:'#374151'}}>أُعفي من هذه التعديلات</strong> كل من كان عمره الهجري{' '}
                <strong style={{color:gold2}}>50 سنة فأكثر</strong>{' '}أو مدة خدمته{' '}
                <strong style={{color:gold2}}>240 شهراً (20 سنة) فأكثر</strong>{' '}
                في تاريخ تطبيق القرار <strong style={{color:'#374151'}}>03/07/2024م</strong>، ويسري عليهم النظام القديم كما كان.
                <br/>
                يوضّح هذا القسم موقعك بالنسبة لهذه التعديلات وأثرها على سن تقاعدك ومدة الخدمة المطلوبة.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* بطاقة التصنيف */}
      <div style={crd}>
        <SH icon="📋" label="التصنيف — قرار 3 يوليو 2024م" color={gold}/>
        {!info.bd?(
          <Note icon="ℹ️" text="أدخل تاريخ الميلاد في تبويب (البيانات) لعرض تصنيفك التقاعدي." color={blu} bgc={bluL}/>
        ):(
          <>
          {ri.ex?(
            <Note icon="✅" text="عمرك في 3/7/2024 تجاوز 48.5 سنة هجرية أو خدمتك بلغت 240 شهراً — غير مشمول بالتعديلات. يطبق عليك النظام القديم (60 سنة، 300 شهر)." color={grn} bgc={grnL}/>
          ):(
            <>
            {/* الشبكة الرئيسية */}
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:10}}>
              {[
                {lb:'العمر الهجري في 3/7/2024',val:ri.aRH.yrs>0||ri.aRH.mths>0?`${ri.aRH.yrs} سنة${ri.aRH.mths>0?` و ${ri.aRH.mths} شهر`:''} هجري`:`${ri.aR} سنة هجرية`,clr:blu},
                {lb:'أشهر الخدمة في 3/7/2024',val:`${psAtRF.tM} شهر (${(psAtRF.tM/12).toFixed(1)} سنة)`,clr:gold},
                {lb:'سن التقاعد النظامي',val:ri.lb,clr:gold2},
                {lb:'تاريخ التقاعد النظامي',val:ri.dt?(fmtHijri(ri.dt.toISOString().split('T')[0])||ri.dt.toLocaleDateString('ar-SA')):'-',clr:txt},
              ].map((x,i)=>(
                <div key={i} style={{background:bg2,borderRadius:12,padding:'10px 12px',border:`1px solid ${brd}`}}>
                  <div style={{fontSize:9,color:txt2,marginBottom:4}}>{x.lb}</div>
                  <div style={{fontSize:12,fontWeight:700,color:x.clr}}>{x.val}</div>
                </div>
              ))}
            </div>

            {/* شريط التقدم للتقاعد النظامي */}
            {monthsToStat!==null&&(
              <div style={{background:bg2,borderRadius:12,padding:'10px 12px',marginBottom:10,border:`1px solid ${brd}`}}>
                <div style={{display:'flex',justifyContent:'space-between',fontSize:10,marginBottom:6}}>
                  <span style={{color:txt2}}>متبقٍ للتقاعد النظامي</span>
                  <strong style={{color:monthsToStat===0?grn:gold2}}>{monthsToStat===0?'✓ بلغت السن النظامية':`${fI(monthsToStat)} شهر`}</strong>
                </div>
              </div>
            )}

            {/* التقاعد المبكر */}
            <div style={{background:earlyNeedAtRF===0?grnL:redL,borderRadius:12,padding:'12px 14px',marginBottom:10,border:`1px solid ${earlyNeedAtRF===0?grn:red}30`}}>
              {earlyNeedAtRF===0?(
                <div style={{fontSize:12,fontWeight:700,color:grn,textAlign:'center'}}>✓ مؤهل للتقاعد المبكر — {psAtRF.tM} شهر من أصل {ri.eR}</div>
              ):(
                <>
                <div style={{display:'flex',justifyContent:'space-between',marginBottom:6}}>
                  <span style={{fontSize:11,fontWeight:700,color:red}}>المطلوب للتقاعد المبكر: {ri.eR} شهر</span>
                  <span style={{fontSize:11,color:gold}}>متبقٍ: <strong>{earlyNeedAtRF} شهر</strong></span>
                </div>
                <div style={{height:6,borderRadius:6,background:`${red}20`,overflow:'hidden'}}>
                  <div style={{height:'100%',borderRadius:6,background:gold,width:`${Math.min(100,(psAtRF.tM/ri.eR)*100).toFixed(1)}%`}}/>
                </div>
                <div style={{fontSize:9,color:txt2,marginTop:4,textAlign:'center'}}>خدمة في 3/7/2024: {psAtRF.tM} / {ri.eR} شهر</div>
                </>
              )}
            </div>

            {/* الخلاصة: المدة المطلوبة + أقرب تاريخ مبكر */}
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
              <div style={{background:bg2,borderRadius:12,padding:'10px 12px',border:`1px solid ${brd}`,textAlign:'center'}}>
                <div style={{fontSize:9,color:txt2,marginBottom:4}}>المدة المطلوبة للمبكر (الآن)</div>
                {earlyNeed===0
                  ?<div style={{fontSize:13,fontWeight:700,color:grn}}>✓ مؤهل الآن</div>
                  :<><div style={{fontSize:20,fontWeight:800,color:red}}>{fI(earlyNeed)}</div><div style={{fontSize:9,color:txt2}}>شهر إضافي</div></>
                }
              </div>
              <div style={{background:bg2,borderRadius:12,padding:'10px 12px',border:`1px solid ${brd}`,textAlign:'center'}}>
                <div style={{fontSize:9,color:txt2,marginBottom:4}}>أقرب تاريخ للمبكر</div>
                {earlyDate?(
                  <><div style={{fontSize:10,fontWeight:700,color:earlyNeed===0?grn:gold2}}>{fmtHijri(earlyDate)||new Date(earlyDate).toLocaleDateString('ar-SA')}</div>
                  <div style={{fontSize:8,color:txt2,marginTop:2}}>{new Date(earlyDate).toLocaleDateString('ar-SA')}</div></>
                ):<div style={{fontSize:11,color:txt2}}>—</div>}
              </div>
            </div>
            </>
          )}
          </>
        )}
      </div>


      <div style={{background:bg2,borderRadius:12,padding:'8px 12px',fontSize:8,color:txt2,lineHeight:2,border:`1px solid ${brd}`,marginBottom:12}}>
        <strong style={{color:gold}}>المرجع: </strong>قرار مجلس الوزراء — تعديلات نظامي التقاعد المدني والتأمينات الاجتماعية — 3 يوليو 2024م
      </div>

      <button onClick={()=>setTab('result')} style={{width:'100%',padding:'15px',borderRadius:16,border:'none',background:`linear-gradient(135deg,${gold},${grn})`,color:'#020A04',fontWeight:900,fontSize:14,cursor:'pointer',fontFamily:'inherit',marginTop:4,boxShadow:`0 8px 32px ${gold}40`,letterSpacing:0.3}}>احسب معاشي التقاعدي ←</button>

      </div>);
    })()}

    {/* ════ تبويب النتائج ════ */}
    {tab==='result'&&(<div>

      {/* empty state */}
      {periods.length===0&&(
        <div style={{textAlign:'center',padding:'48px 24px'}}>
          <div style={{fontSize:52,marginBottom:16}}>📋</div>
          <div style={{fontSize:16,fontWeight:800,color:txt,marginBottom:8}}>لا توجد بيانات بعد</div>
          <div style={{fontSize:13,color:txt2,marginBottom:24,lineHeight:1.8}}>أدخل تاريخ ميلادك والمدد الوظيفية في صفحة البيانات حتى تظهر نتائجك هنا.</div>
          <button onClick={()=>setTab('merged')} style={{padding:'13px 28px',borderRadius:14,border:'none',background:`linear-gradient(135deg,${gold},${grn})`,color:'#020A04',fontWeight:900,fontSize:14,cursor:'pointer',fontFamily:'inherit',boxShadow:`0 6px 24px ${gold}40`}}>← ابدأ بإدخال البيانات</button>
        </div>
      )}

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
            <div style={{overflowX:'auto',marginRight:-18,marginLeft:-18,paddingRight:18,paddingLeft:18,paddingBottom:8}}>
              <div style={{display:'flex',gap:10,width:'max-content'}}>
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
                :<><div style={{fontSize:11,fontWeight:700,color:red}}>متبقٍ</div><div style={{fontSize:12,fontWeight:800,color:red}}>{ri.eR-ps.tM}<span style={{fontSize:8}}> ش</span></div></>
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
        const cap150d=s60?Math.min(lSd,s60*1.5):lSd;
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
                  <text x={cx} y={cy-8} textAnchor="middle" fontSize="24" fontWeight="900" fill={gold2} fontFamily="Tajawal,sans-serif">{todayTotal}</text>
                  <text x={cx} y={cy+8} textAnchor="middle" fontSize="9" fill={txt2} fontFamily="Tajawal,sans-serif">من {fullTotal} شهر</text>
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
                      <div style={{fontSize:26,fontWeight:900,color:t.clr,lineHeight:1,marginBottom:6}}>{t.val}</div>
                      <div style={{fontSize:8,color:txt2,marginBottom:4}}>{(t.val*100/(fullTotal||1)).toFixed(0)}%</div>
                      {t.rows.length>1&&(
                        <div style={{display:'flex',flexDirection:'column',gap:3,borderTop:`1px solid ${brd}`,paddingTop:6}}>
                          {t.rows.map((r,j)=>(
                            <div key={j} style={{display:'flex',justifyContent:'space-between',fontSize:8}}>
                              <span style={{color:txt2}}>{r.lb}</span>
                              <strong style={{color:t.clr}}>{r.val}</strong>
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
                <div style={{fontSize:22,fontWeight:900,color:gold2,lineHeight:1}}>{todayTotal}</div>
                <div style={{fontSize:8,color:txt2,marginTop:2}}>{(todayTotal/12).toFixed(1)} سنة</div>
              </div>
              <div style={{fontSize:18,fontWeight:900,color:'#CBD5E1',padding:'0 6px',flexShrink:0,userSelect:'none'}}>+</div>
              <div style={{flex:1,background:'#F1F5F9',borderRadius:14,padding:'12px 6px',textAlign:'center',border:'1px solid #E2E8F0'}}>
                <div style={{fontSize:8,color:'#94A3B8',marginBottom:2,fontWeight:500}}>مخطط إضافي</div>
                <div style={{fontSize:22,fontWeight:900,color:'#94A3B8',lineHeight:1}}>{fullTotal-todayTotal}</div>
                <div style={{fontSize:8,color:'#94A3B8',marginTop:2}}>{((fullTotal-todayTotal)/12).toFixed(1)} سنة</div>
              </div>
              <div style={{fontSize:18,fontWeight:900,color:'#CBD5E1',padding:'0 6px',flexShrink:0,userSelect:'none'}}>=</div>
              <div style={{flex:1,background:bg,borderRadius:14,padding:'12px 6px',textAlign:'center',border:`1px solid ${brd}`}}>
                <div style={{fontSize:8,color:txt2,marginBottom:2,fontWeight:500}}>الإجمالي عند التقاعد</div>
                <div style={{fontSize:22,fontWeight:900,color:gold,lineHeight:1}}>{fullTotal}</div>
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
        const cap150=s60?Math.min(lS,s60*1.5):lS;
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
        <div style={{display:'flex',justifyContent:'space-between',paddingTop:10,fontSize:11}}><span style={{fontWeight:700}}>إجمالي المدة</span><span style={{color:txt2}}>{ps.tM} شهر ({(ps.tM/12).toFixed(1)} سنة)</span></div>
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
        <div style={{background:`linear-gradient(135deg,${goldL} 0%,rgba(255,255,255,0) 100%)`,borderRadius:16,padding:'16px 16px',marginBottom:14,border:`1px solid ${gold}25`,position:'relative',overflow:'hidden'}}>
          <div style={{position:'absolute',top:-20,left:-20,width:100,height:100,background:`radial-gradient(circle,${gold}12,transparent 70%)`,pointerEvents:'none'}}/>
          <div style={{position:'relative'}}>
            <div style={{fontSize:13,fontWeight:800,color:gold2,marginBottom:10,lineHeight:1.5}}>
              كيف تزيد معاشك التقاعدي؟
            </div>
            <div style={{fontSize:11,color:txt,lineHeight:2,marginBottom:12}}>
              يُتيح نظام التأمينات الاجتماعية للمشترك رفع قيمة معاشه التقاعدي من خلال مسارين مستقلين يمكن الجمع بينهما:
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:10}}>
              <div style={{display:'flex',gap:12,alignItems:'flex-start',background:bg2,borderRadius:12,padding:'12px 12px',border:`1px solid ${blu}20`}}>
                <div style={{width:32,height:32,borderRadius:10,background:bluL,border:`1px solid ${blu}25`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,flexShrink:0}}>📌</div>
                <div>
                  <div style={{fontSize:12,fontWeight:700,color:blu,marginBottom:3}}>الاشتراك الإلزامي</div>
                  <div style={{fontSize:10,color:txt2,lineHeight:1.8}}>يُحتسب بنسبة <strong style={{color:txt}}>9%</strong> من الأجر الشهري على عاتق الموظف، و<strong style={{color:txt}}>12%</strong> على عاتق جهة العمل. تؤثر الزيادات السنوية في الأجر مباشرةً على حجم المعاش المستقبلي وفق معادلة الاحتساب.</div>
                </div>
              </div>
              <div style={{display:'flex',gap:12,alignItems:'flex-start',background:bg2,borderRadius:12,padding:'12px 12px',border:`1px solid ${pur}20`}}>
                <div style={{width:32,height:32,borderRadius:10,background:purL,border:`1px solid ${pur}25`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,flexShrink:0}}>📊</div>
                <div>
                  <div style={{fontSize:12,fontWeight:700,color:pur,marginBottom:3}}>الاشتراك الاختياري</div>
                  <div style={{fontSize:10,color:txt2,lineHeight:1.8}}>يُمكّن المشترك من رفع شريحة أجره الاشتراكية بنسبة تصل إلى <strong style={{color:txt}}>10% سنوياً</strong> وفق المادة 24 من لائحة التسجيل، بتكلفة شهرية قدرها <strong style={{color:txt}}>18%</strong> من قيمة الشريحة المختارة. كل شهر إضافي يُضاف مباشرةً إلى رصيد مدة الاشتراك.</div>
                </div>
              </div>
            </div>
            <div style={{marginTop:12,padding:'10px 12px',borderRadius:10,background:`${gold}10`,border:`1px solid ${gold}20`,fontSize:10,color:txt2,lineHeight:1.8}}>
              <strong style={{color:gold2}}>📋 الجداول أدناه</strong> توضح التكلفة الشهرية والسنوية لكلٍّ من المسارين بناءً على بياناتك، مع تقدير أثر كل سنة إضافية على قيمة معاشك.
            </div>
          </div>
        </div>

        {is50H&&<Note icon="⚠️" text="تنبيه (المادة 24): عمرك تجاوز 50 سنة هجرية — الزيادة القصوى 10% سنوياً على الشريحة السابقة." color={org} bgc={orgL}/>}

        {/* جدولا الاشتراك */}
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:12}}>
          {/* اختياري */}
          <div style={{background:purL,borderRadius:12,padding:10,border:`1px solid ${pur}25`}}>
            <div style={{fontSize:11,fontWeight:700,color:pur,marginBottom:4}}>📊 اختياري
              <div style={{fontSize:8,fontWeight:400,color:txt2}}>18% × الشريحة</div>
            </div>
            <table style={{width:'100%',fontSize:8,borderCollapse:'collapse'}}>
              <thead><tr>{['السنة','الشريحة','الاشتراك الشهري','التكلفة السنوية'].map(h=><th key={h} style={{padding:'4px 2px',textAlign:'right',color:pur,fontWeight:700,borderBottom:`1px solid ${pur}25`}}>{h}</th>)}</tr></thead>
              <tbody>{optRows.map(r=><tr key={r.y} style={{borderBottom:`1px solid ${brd2}`}}><td style={{padding:'4px 2px',fontWeight:600,color:txt}}>{r.y}</td><td style={{padding:'4px 2px',color:txt2}}>{fI(r.b)}</td><td style={{padding:'4px 2px',fontWeight:700,color:pur}}>{fI(r.opt)}</td><td style={{padding:'4px 2px',fontWeight:700,color:gold}}>{fI(r.b*0.18*12)}</td></tr>)}</tbody>
            </table>
          </div>
          {/* إلزامي */}
          <div style={{background:bluL,borderRadius:12,padding:10,border:`1px solid ${blu}25`}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:4}}>
              <div style={{fontSize:11,fontWeight:700,color:blu}}>📌 إلزامي<div style={{fontSize:8,fontWeight:400,color:txt2}}>9% موظف + 12% جهة</div></div>
              <div style={{display:'flex',alignItems:'center',gap:4}}>
                <span style={{fontSize:8,color:txt2}}>زيادة%:</span>
                <input type="number" value={mandRaise} onChange={e=>setMandRaise(Math.max(0,Math.min(50,+e.target.value)))} style={{width:36,padding:'2px 4px',borderRadius:6,border:`1px solid ${blu}40`,fontSize:9,textAlign:'center',fontFamily:'inherit',background:'rgba(0,0,0,0.2)',color:txt}}/>
              </div>
            </div>
            <table style={{width:'100%',fontSize:8,borderCollapse:'collapse'}}>
              <thead><tr>{['السنة','الأجر الخاضع','حصة الموظف','إجمالي الاشتراك'].map(h=><th key={h} style={{padding:'4px 2px',textAlign:'right',color:blu,fontWeight:700,borderBottom:`1px solid ${blu}25`}}>{h}</th>)}</tr></thead>
              <tbody>{mandRows.map(r=><tr key={r.y} style={{borderBottom:`1px solid ${brd2}`}}><td style={{padding:'4px 2px',fontWeight:600,color:txt}}>{r.y}</td><td style={{padding:'4px 2px',color:txt2}}>{fI(r.sal)}</td><td style={{padding:'4px 2px',color:blu,fontWeight:600}}>{fI(r.emp)}</td><td style={{padding:'4px 2px',fontWeight:700,color:gold}}>{fI(r.tot)}</td></tr>)}</tbody>
            </table>
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
            return{x,pen:Math.min(Math.round(tot),45000)};
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

          // أبعاد الرسم
          const W=270,H=130,PL=34,PR=8,PT=16,PB=26;
          const cw=W-PL-PR,ch=H-PT-PB;
          const nG=barData.length,gW=cw/nG;
          const bW=Math.min(gW*0.34,20),gap=3;
          const gx=i=>PL+i*gW+gW/2; // مركز المجموعة
          const bh=v=>(v/maxC)*ch;
          const by=v=>PT+ch-bh(v);
          const yTicks=[0,maxC*0.5,maxC];

          return(
            <div style={{...crd,marginBottom:12}}>
              <SH icon="📊" label="التكلفة على المشترك مقابل المعاش الناتج" color={gold}/>

              {/* المفتاح */}
              <div style={{display:'flex',gap:14,marginBottom:10,justifyContent:'center',flexWrap:'wrap'}}>
                {[{clr:pur,lb:'اشتراك اختياري'},{clr:blu,lb:'اشتراك إلزامي (حصة الموظف)'}].map(l=>(
                  <div key={l.lb} style={{display:'flex',alignItems:'center',gap:5,fontSize:9,color:txt2}}>
                    <div style={{width:10,height:10,borderRadius:3,background:l.clr,flexShrink:0}}/>
                    {l.lb}
                  </div>
                ))}
              </div>

              {/* الرسم البياني — أعمدة */}
              <svg viewBox={`0 0 ${W} ${H}`} style={{width:'100%',display:'block'}}>
                {/* شبكة أفقية */}
                {yTicks.map((v,i)=>(
                  <g key={i}>
                    <line x1={PL} y1={by(v)} x2={W-PR} y2={by(v)} stroke={brd} strokeWidth="0.5" strokeDasharray="3,4"/>
                    <text x={PL-3} y={by(v)+3} textAnchor="end" fontSize="6" fill={txt2} fontFamily="Tajawal,sans-serif">{abbr(v)}</text>
                  </g>
                ))}
                {/* محور X */}
                <line x1={PL} y1={PT+ch} x2={W-PR} y2={PT+ch} stroke={brd} strokeWidth="0.7"/>

                {/* الأعمدة */}
                {barData.map((d,i)=>{
                  const cx=gx(i);
                  const ox=cx-gap/2-bW; // عمود الاختياري (يمين المركز)
                  const mx=cx+gap/2;    // عمود الإلزامي (يسار المركز)
                  const oh=bh(d.opt),mh=bh(d.mand);
                  const R=3;
                  const rRect=(x,y,w,h,r)=>h<r*2?`M${x+r},${y} h${w-2*r} a${r},${r} 0 0 1 ${r},${r} v${h-r} h${-w} v${-(h-r)} a${r},${r} 0 0 1 ${r},${-r} Z`:`M${x+r},${y} h${w-2*r} a${r},${r} 0 0 1 ${r},${r} v${h-2*r} a0,0 0 0 0 0,0 h${-w} a0,0 0 0 0 0,0 v${-(h-2*r)} a${r},${r} 0 0 1 ${r},${-r} Z`;
                  return(
                    <g key={d.x}>
                      {/* عمود الاختياري */}
                      {oh>0&&<path d={rRect(ox,by(d.opt),bW,oh,R)} fill={pur} opacity="0.85"/>}
                      {/* عمود الإلزامي */}
                      {mh>0&&<path d={rRect(mx,by(d.mand),bW,mh,R)} fill={blu} opacity="0.85"/>}
                      {/* قيم أعلى الأعمدة */}
                      {oh>8&&<text x={ox+bW/2} y={by(d.opt)-2} textAnchor="middle" fontSize="5.5" fill={pur} fontWeight="600" fontFamily="Tajawal,sans-serif">{abbr(d.opt)}</text>}
                      {mh>8&&<text x={mx+bW/2} y={by(d.mand)-2} textAnchor="middle" fontSize="5.5" fill={blu} fontWeight="600" fontFamily="Tajawal,sans-serif">{abbr(d.mand)}</text>}
                      {/* المعاش فوق المجموعة */}
                      <text x={cx+bW/2} y={PT-4} textAnchor="middle" fontSize="6" fill={gold2} fontWeight="700" fontFamily="Tajawal,sans-serif">{fI(d.pen)}</text>
                      {/* تسمية المجموعة */}
                      <text x={cx+bW/2} y={H-8} textAnchor="middle" fontSize="6.5" fill={txt2} fontFamily="Tajawal,sans-serif">{d.lbl}</text>
                    </g>
                  );
                })}

                {/* تسمية المعاش */}
                <text x={W-PR} y={PT-4} textAnchor="end" fontSize="6" fill={gold} fontFamily="Tajawal,sans-serif">المعاش ↑</text>
              </svg>

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

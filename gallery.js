/* SYNAPTICA UI — live HUD asset gallery.
   Every asset is one full-screen-triangle fragment shader (1 draw call, 0 textures),
   drawn with signed distance fields. Exposed parameters map to material uniforms. */
(function(){
const S = window.SYN; if (!S) return;
const grid = document.getElementById('assetGrid'); if (!grid) return;

const COMMON = `precision mediump float;
uniform vec2 r,m;uniform float t,u,e,c;
#define TAU 6.2831853
#define PI 3.1415927
float aa;
const vec3 ACC=vec3(1.,.353,.122),FG=vec3(.925,.92,.906),DMG=vec3(1.,.165,.239),HEAL=vec3(.357,.89,.541),SHD=vec3(.243,.878,.769),WARN=vec3(1.,.69,0.);
float F(float d){return 1.-smoothstep(-aa,aa,d);}
float S(float d,float w){return F(abs(d)-w);}
float h1(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
vec2 rot(vec2 p,float a){float s=sin(a),k=cos(a);return vec2(k*p.x-s*p.y,s*p.x+k*p.y);}
float box(vec2 p,vec2 b){vec2 d=abs(p)-b;return length(max(d,0.))+min(max(d.x,d.y),0.);}
float ang(vec2 p){return fract(atan(p.x,p.y)/TAU);}
float adiff(float a,float b){return abs(mod(a-b+.5,1.)-.5);}
void lay(inout vec4 o,vec3 col,float a){a=clamp(a,0.,1.);o.rgb=o.rgb*(1.-a)+col*a;o.a=o.a+a*(1.-o.a);}
vec4 hud(vec2 p);
void main(){
 float s=min(r.x,r.y);vec2 p=(gl_FragCoord.xy-.5*r)/s*2.;aa=1.6/s;
 vec2 g=abs(fract(p*4.)-.5);float grid=smoothstep(.5-8./s,.5,max(g.x,g.y));
 vec3 col=vec3(.051,.039,.035)+grid*.028;
 col*=1.-.12*dot(p,p);
 vec4 o=hud(p);col=col*(1.-o.a)+o.rgb;
 col+=(h1(gl_FragCoord.xy+fract(t)*91.)-.5)*.018;
 gl_FragColor=vec4(col,1.);}
`;

const A = [
{ id:'reticle', name:'Dynamic reticle', file:'HUD_Reticle.mat', cat:'combat',
  desc:'Crosshair whose gap reacts to weapon spread and recoil. Click the preview to fire.',
  param:{n:'_Spread', d:.35, fmt:u=>(u*12).toFixed(1)+'°'},
  act:{label:'Fire', run:st=>{st.e=0;}},
  budget:'1 draw call · 0 KB · SDF box ticks',
  fs:`vec4 hud(vec2 p){vec4 o=vec4(0.);
 float kick=exp(-e*7.)*.2;float s=.08+u*.34+kick;
 vec2 q=abs(p);
 float d=min(box(q-vec2(s+.1,0.),vec2(.1,.015)),box(q-vec2(0.,s+.1),vec2(.015,.1)));
 vec3 tc=mix(FG,ACC,clamp(kick*6.,0.,1.));
 o.rgb+=tc*exp(-max(d,0.)*28.)*.22;
 lay(o,tc,F(d));
 lay(o,ACC,F(length(p)-.022));
 float rr=length(p);float a=fract(ang(p)+t*.025);
 lay(o,FG*.45,S(rr-.8,.006)*step(.1,adiff(fract(a*4.),0.)));
 lay(o,FG*.6,S(rr-.74,.025)*step(adiff(fract(a*32.),0.),.06)*step(.1,adiff(fract(a*4.),0.)));
 return o;}`},

{ id:'ammo', name:'Radial ammo counter', file:'HUD_AmmoRing.mat', cat:'combat',
  desc:'30-round segmented ring. Low ammo pulses; reload refills the segments in order.',
  param:{n:'_Ammo', d:.8, fmt:u=>Math.round(u*30)+' / 30'},
  act:{label:'Reload', run:st=>{st.e=0;}},
  read:st=>{const N=30;let n=Math.round(st.u*N);if(st.e<1.2)n=Math.min(n,Math.floor(st.e/1.2*N));return String(n).padStart(2,'0');},
  budget:'1 draw call · 0 KB · angular segment mask',
  fs:`vec4 hud(vec2 p){vec4 o=vec4(0.);
 float N=30.;float cnt=floor(u*N+.5);
 if(e<1.2)cnt=min(cnt,floor(e/1.2*N));
 float rr=length(p);float a=ang(p);
 float i=floor(a*N);float f=fract(a*N);
 float band=F(abs(rr-.62)-.075);
 float gm=smoothstep(.12,.2,f)*smoothstep(.88,.8,f);
 float on=step(i+.5,cnt);
 float low=step(cnt,N*.25);
 vec3 fc=mix(FG,WARN,low)*(1.-low*.35*(.5+.5*sin(t*10.)));
 lay(o,vec3(.17,.15,.14),band*gm*(1.-on));
 lay(o,fc,band*gm*on);
 lay(o,ACC,band*gm*on*step(cnt-1.5,i));
 o.rgb+=fc*band*on*.12;
 lay(o,FG*.35,S(rr-.47,.004));
 lay(o,FG*.35,S(rr-.77,.004));
 return o;}`},

{ id:'cooldown', name:'Ability cooldown', file:'HUD_Cooldown.mat', cat:'combat',
  desc:'Radial wipe with a sweep edge, then a ready flash and overshoot bounce.',
  param:{n:'_Cooldown', d:.3, fmt:u=>(1.5+u*4).toFixed(1)+' s'},
  read:st=>{const T=1.5+st.u*4;const k=(st.t%T)/T;return k>=.72?'READY':((.72-k)*T).toFixed(1)+'s';},
  budget:'1 draw call · 0 KB · radial fill + SDF icon',
  fs:`vec4 hud(vec2 p){vec4 o=vec4(0.);
 float T=1.5+u*4.;float k=mod(t,T)/T;float prog=clamp(k/.72,0.,1.);float ready=step(.72,k);
 float since=max(k-.72,0.)*T;
 float bounce=ready*exp(-since*6.)*sin(since*30.)*.06;
 vec2 q=p/(1.+bounce);
 float rr=length(q);float a=ang(q);
 float disc=rr-.5;
 lay(o,vec3(.11,.09,.08),F(disc));
 vec2 dq=rot(q,PI*.25);
 vec3 icc=mix(vec3(.4,.37,.35),ACC,ready);
 lay(o,icc,F(box(dq,vec2(.2))-.02));
 lay(o,vec3(.11,.09,.08),F(box(dq,vec2(.1))));
 lay(o,icc,F(box(dq,vec2(.045))));
 float shade=(1.-ready)*step(prog,a)*F(disc);
 o.rgb*=1.-shade*.6;
 float rd=abs(rr-.58)-.025;
 lay(o,vec3(.2,.18,.17),F(rd));
 lay(o,mix(ACC,FG,ready),F(rd)*(ready>.5?1.:step(a,prog)));
 lay(o,FG,(1.-ready)*F(disc)*F(adiff(a,prog)*TAU*rr-.006));
 o.rgb+=ACC*ready*exp(-since*3.)*exp(-abs(rr-.58)*12.)*.9;
 o.rgb+=ACC*ready*.12*exp(-abs(rr-.58)*20.)*(.6+.4*sin(t*4.));
 return o;}`},

{ id:'radar', name:'Radar minimap', file:'HUD_Radar.mat', cat:'navigation',
  desc:'Sweep beam with a decaying trail; blips light up as the beam passes and fade.',
  param:{n:'_SweepSpeed', d:.35, fmt:u=>(12+u*48).toFixed(0)+' rpm'},
  budget:'1 draw call · 0 KB · polar sweep, 6 blips in shader',
  fs:`vec4 hud(vec2 p){vec4 o=vec4(0.);
 float R=.82;float rr=length(p);float a=ang(p);
 float inside=F(rr-R);
 lay(o,vec3(.05,.07,.065),inside);
 float sw=fract(t*(.2+u*.8));
 float tr=fract(sw-a);
 o.rgb+=SHD*exp(-tr*7.)*inside*.32;
 float lines=max(max(S(rr-.27,.003),S(rr-.54,.003)),S(min(abs(p.x),abs(p.y)),.003));
 lay(o,SHD*.45,lines*inside);
 lay(o,SHD,S(rr-R,.008));
 lay(o,SHD,S(adiff(a,sw)*TAU*rr,.004)*inside);
 for(int i=0;i<6;i++){float fi=float(i);
  float ba=h1(vec2(fi,1.3));float br=.18+.55*h1(vec2(fi,2.7));
  ba=fract(ba+sin(t*.2+fi)*.01);
  vec2 bp=br*vec2(sin(ba*TAU),cos(ba*TAU));
  float age=fract(sw-ba);float it=exp(-age*2.5);
  vec3 bc=i<2?SHD:DMG;
  float bd=length(p-bp);
  lay(o,bc,F(bd-.028)*it);
  o.rgb+=bc*exp(-bd*22.)*it*.45;}
 lay(o,FG,F(box(rot(p,PI*.25),vec2(.022))));
 lay(o,FG*.4,S(rr-(R+.05),.02)*step(adiff(fract(a*36.),0.),.08));
 return o;}`},

{ id:'shield', name:'Hex shield', file:'HUD_ShieldHex.mat', cat:'status',
  desc:'Hex-cell energy dome. Cells dissolve as strength drops. Click to hit it.',
  param:{n:'_Strength', d:.85, fmt:u=>Math.round(u*100)+'%'},
  act:{label:'Hit', run:st=>{st.e=0;const a=Math.random()*6.283,d=.25+Math.random()*.4;st.m=[Math.sin(a)*d,Math.cos(a)*d];}},
  click:true,
  budget:'1 draw call · 0 KB · hex tiling + ripple',
  fs:`vec4 hud(vec2 p){vec4 o=vec4(0.);
 float rr=length(p);float dome=F(rr-.82);
 vec2 uv=p*6.;vec2 R=vec2(1.,1.7320508);vec2 H=R*.5;
 vec2 ga=mod(uv,R)-H;vec2 gb=mod(uv-H,R)-H;
 vec2 gv=dot(ga,ga)<dot(gb,gb)?ga:gb;vec2 id=uv-gv;
 vec2 ap=abs(gv);float hd=max(dot(ap,normalize(R)),ap.x);
 float n=h1(id);
 float alive=step(n,u*1.02);
 float edge=smoothstep(.40,.48,hd);
 float dm=length(p-m);float wave=exp(-abs(dm-e*1.3)*10.)*exp(-e*1.8);
 float fres=pow(clamp(rr/.82,0.,1.),3.);
 float flick=step(u-.08,n)*step(n,u)*(.5+.5*sin(t*30.+n*50.));
 float a1=dome*alive*(edge*.7+.06+fres*.35+wave*1.3)*(1.-flick*.7);
 lay(o,SHD*(1.+wave*.6),a1);
 lay(o,DMG*.6,dome*(1.-alive)*edge*.22*(.5+.5*sin(t*14.+n*40.)));
 lay(o,SHD,S(rr-.82,.006));
 o.rgb+=SHD*exp(-abs(rr-.82)*30.)*.3;
 return o;}`},

{ id:'damage', name:'Damage direction', file:'HUD_DamageDir.mat', cat:'combat',
  desc:'Tapered arc that points at the attacker and fades out. Take a hit to see it.',
  param:{n:'_Angle', d:.12, fmt:u=>Math.round(u*360)+'°'},
  act:{label:'Take hit', run:(st,set)=>{st.e=0;set(Math.random());}},
  budget:'1 draw call · 0 KB · angular falloff',
  fs:`vec4 hud(vec2 p){vec4 o=vec4(0.);
 float rr=length(p);float a=ang(p);
 float inten=exp(-e*1.1);float idle=.18;float k=max(inten,idle);
 lay(o,FG*.3,S(rr-.62,.004));
 lay(o,FG*.35,S(rr-.62,.03)*step(adiff(fract(a*24.),0.),.05));
 float ad=adiff(a,u);float w=.1;
 float taper=1.-smoothstep(0.,w,ad);
 vec3 dc=DMG*(1.+.25*sin(t*14.)*inten);
 lay(o,dc,F(abs(rr-.7)-.085*taper)*clamp(taper*1.6,0.,1.)*k);
 lay(o,mix(dc,FG,.5),F(abs(rr-.7)-.018*taper)*taper*inten);
 vec2 dir=vec2(sin(u*TAU),cos(u*TAU));
 vec2 q=vec2(dot(p,vec2(dir.y,-dir.x)),dot(p,dir));
 float cv=max(abs(q.y-.9+abs(q.x)*.9)-.016,abs(q.x)-.09);
 lay(o,dc,F(cv)*k);
 o.rgb+=dc*exp(-abs(rr-.7)*10.)*taper*inten*.9;
 o.rgb+=DMG*inten*.18*smoothstep(.4,1.4,dot(p,dir))*smoothstep(.6,1.2,rr);
 lay(o,FG,F(length(p)-.03));
 return o;}`},

{ id:'stamina', name:'Stamina bar', file:'HUD_Stamina.mat', cat:'status',
  desc:'Skewed segmented bar with a delayed damage chip, colour ramp and low pulse.',
  param:{n:'_Fill', d:.72, fmt:u=>Math.round(u*100)},
  act:{label:'Sprint −30', run:(st,set)=>{st.c=Math.max(st.c,st.u);set(Math.max(0,st.u-.3));}},
  tick:(st,dt)=>{if(st.c>st.u){st.hold-=dt;if(st.hold<0)st.c=Math.max(st.u,st.c-dt*.45);}else{st.c=st.u;st.hold=.45;}},
  budget:'1 draw call · 0 KB · segment mask + chip lerp',
  fs:`vec4 hud(vec2 p){vec4 o=vec4(0.);
 vec2 q=p;q.x+=q.y*.35;
 float W=.8,Hh=.075;
 float body=box(q,vec2(W,Hh));
 float x01=(q.x+W)/(2.*W);
 float N=12.;float f=fract(x01*N);
 float gap=smoothstep(0.,.05,f)*smoothstep(1.,.95,f);
 lay(o,vec3(.16,.14,.13),F(body)*gap);
 vec3 vc=u>.5?mix(WARN,HEAL,(u-.5)*2.):mix(DMG,WARN,u*2.);
 lay(o,FG*.85,F(body)*gap*step(x01,c)*step(u,x01));
 lay(o,vc,F(body)*gap*step(x01,u));
 float sh=exp(-abs(fract(t*.4)*2.6-.3-x01)*14.)*.35;
 o.rgb+=FG*sh*F(body)*step(x01,u)*gap;
 lay(o,FG*.5,S(box(q,vec2(W+.035,Hh+.035)),.004));
 o.rgb+=DMG*F(body)*step(u,.2)*(.5+.5*sin(t*9.))*.25;
 lay(o,FG,F(abs(q.x-(u*2.*W-W))-.008)*F(abs(q.y)-Hh-.05));
 return o;}`},

{ id:'objective', name:'Objective marker', file:'HUD_Objective.mat', cat:'navigation',
  desc:'Waypoint diamond with pulse rings, rotating brackets and a ground beam. Pulses faster as you get closer.',
  param:{n:'_Proximity', d:.4, fmt:u=>Math.round((1-u)*480+12)+' m'},
  read:st=>Math.round((1-st.u)*480+12)+' m',
  budget:'1 draw call · 0 KB · SDF diamonds + rings',
  fs:`vec4 hud(vec2 p){vec4 o=vec4(0.);
 float k=.4+u*1.8;
 vec2 q=p-vec2(0.,.12+sin(t*2.)*.02);
 vec2 dq=rot(q,PI*.25);
 for(int i=0;i<3;i++){float ph=fract(t*k*.5+float(i)/3.);
  o.rgb+=WARN*S(box(dq,vec2(.15+ph*.42)),.006)*(1.-ph)*.8;}
 lay(o,WARN,S(box(dq,vec2(.15)),.012));
 lay(o,WARN,F(box(dq,vec2(.065))));
 vec2 b=rot(q,t*.6);vec2 ab=abs(b);
 float br=max(abs(max(ab.x,ab.y)-.34)-.008,-(min(ab.x,ab.y)-.2));
 lay(o,FG*.75,F(br));
 float bt=clamp((-.12-p.y)/.6,0.,1.);
 lay(o,WARN*.6,F(abs(p.x)-.005)*step(p.y,-.12)*step(-.72,p.y)*(1.-bt*.6));
 lay(o,WARN*.6,S(length((p-vec2(0.,-.74))*vec2(1.,3.5))-.22,.02));
 o.rgb+=WARN*exp(-length(q)*6.)*.15;
 return o;}`},
];

const CATS = {combat:'Combat', navigation:'Navigation', status:'Status'};
const cards = [];

A.forEach(a=>{
  const el = document.createElement('article');
  el.className='asset'; el.dataset.cat=a.cat;
  el.innerHTML =
   `<div class="asset-view"><canvas role="img" aria-label="${a.name}: live shader preview"></canvas>
     <span class="asset-tag"><b>●</b> LIVE · ${a.file}</span>${a.read?'<output class="asset-read" aria-live="off"></output>':''}</div>
    <div class="asset-body">
     <div class="asset-top"><h3>${a.name}</h3><span class="pill">${CATS[a.cat]}</span></div>
     <p class="asset-desc">${a.desc}</p>
     <label class="asset-param"><span>${a.param.n}</span><input type="range" min="0" max="1000" value="${Math.round(a.param.d*1000)}" aria-label="${a.param.n}"><output></output></label>
     ${a.act?`<button class="btn btn-ghost btn-sm" type="button">${a.act.label}</button>`:''}
     <div class="spec">${a.budget}</div>
    </div>`;
  grid.appendChild(el);
  const cv = el.querySelector('canvas');
  const gl = S.mk(cv, COMMON + a.fs);
  const st = {u:a.param.d, e:99, c:a.param.d, hold:.45, m:[0,0], t:2, vis:false};
  const range = el.querySelector('input'), out = el.querySelector('.asset-param output'), read = el.querySelector('.asset-read');
  const set = v=>{st.u=v; range.value=Math.round(v*1000); out.textContent=a.param.fmt(v);};
  set(a.param.d);
  range.addEventListener('input',()=>{set(range.value/1000); if(S.reduce) draw(card);});
  const fire = ()=>{a.act&&a.act.run(st,set); if(S.reduce){st.e=.15; draw(card);}};
  const btn = el.querySelector('button'); if(btn) btn.addEventListener('click',fire);
  cv.addEventListener('pointerdown',ev=>{
    if(a.click){const b=cv.getBoundingClientRect(),s=Math.min(b.width,b.height);
      st.m=[(ev.clientX-b.left-b.width/2)/s*2,-(ev.clientY-b.top-b.height/2)/s*2];st.e=0;if(S.reduce){st.e=.15;draw(card);}}
    else fire();
  });
  const card = {a,el,cv,gl,st,read};
  cards.push(card);
  if('IntersectionObserver' in window) new IntersectionObserver(es=>{st.vis=es[0].isIntersecting;}).observe(el); else st.vis=true;
});

function draw(cd){
  const g=cd.gl; if(!g) return;
  S.fit(cd.cv,1.5);
  const x=g.gl; x.viewport(0,0,cd.cv.width,cd.cv.height); x.useProgram(g.pr);
  x.uniform2f(g.u('r'),cd.cv.width,cd.cv.height);
  x.uniform2f(g.u('m'),cd.st.m[0],cd.st.m[1]);
  x.uniform1f(g.u('t'),cd.st.t); x.uniform1f(g.u('u'),cd.st.u);
  x.uniform1f(g.u('e'),cd.st.e); x.uniform1f(g.u('c'),cd.st.c);
  x.drawArrays(x.TRIANGLES,0,3);
  if(cd.read) cd.read.textContent=cd.a.read(cd.st);
}

/* filters */
document.querySelectorAll('.filters button').forEach(b=>b.addEventListener('click',()=>{
  document.querySelectorAll('.filters button').forEach(x=>x.setAttribute('aria-pressed',x===b?'true':'false'));
  const f=b.dataset.filter;
  cards.forEach(cd=>{cd.el.hidden = f!=='all' && cd.a.cat!==f; if(!cd.el.hidden && S.reduce) draw(cd);});
}));

if(S.reduce){ cards.forEach(draw); addEventListener('resize',()=>cards.forEach(draw)); return; }
let last=0;
S.onFrame(ms=>{
  const dt=last?Math.min((ms-last)/1000,.1):0; last=ms;
  cards.forEach(cd=>{
    const st=cd.st; st.t=ms/1000; st.e+=dt;
    if(cd.a.tick) cd.a.tick(st,dt);
    if(st.vis && !cd.el.hidden) draw(cd);
  });
});
})();

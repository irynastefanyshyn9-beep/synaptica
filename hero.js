/* SYNAPTICA UI — hero holo card: a live SDF health ring on a card that tilts with the cursor.
   Click deals damage (chip lags behind, card shakes); health regenerates over time. */
(function(){
const S=window.SYN; if(!S) return;
const btn=document.querySelector('.holo'), inner=btn&&btn.querySelector('.holo-in'), cv=document.getElementById('holoGL');
if(!btn||!cv) return;

const FS=`precision mediump float;
uniform vec2 r;uniform float t,f,c,e;
#define TAU 6.2831853
float aa;
float F(float d){return 1.-smoothstep(-aa,aa,d);}
float h1(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float adiff(float a,float b){return abs(mod(a-b+.5,1.)-.5);}
void main(){
 vec2 p=(gl_FragCoord.xy-vec2(.5*r.x,.56*r.y))/r.x*2.;aa=2.2/r.x;
 vec3 col=vec3(0.);float al=0.;
 vec2 g=abs(fract(p*5.)-.5);float grid=smoothstep(.5-10./r.x,.5,max(g.x,g.y))*.05;
 col+=vec3(1.,.55,.35)*grid;al+=grid;
 float rr=length(p);float a=fract(atan(p.x,p.y)/TAU);
 vec3 hc=f>.5?mix(vec3(1.,.69,0.),vec3(.357,.89,.541),(f-.5)*2.):mix(vec3(1.,.165,.239),vec3(1.,.69,0.),f*2.);
 float band=F(abs(rr-.62)-.075);
 float sf=fract(a*24.);float gap=smoothstep(.04,.1,sf)*smoothstep(.96,.9,sf);
 float back=band*gap;
 col=mix(col,vec3(.16,.13,.12),back*.9);al=max(al,back*.9);
 float chip=band*gap*step(f,a)*step(a,c);
 col=mix(col,vec3(1.,.95,.9),chip);al=max(al,chip);
 float fill=band*gap*step(a,f);
 col=mix(col,hc,fill);al=max(al,fill);
 float flash=exp(-e*6.);
 col+=hc*exp(-abs(rr-.62)*9.)*(.35+flash*.9)*step(a,f+.02);al=max(al,exp(-abs(rr-.62)*9.)*.5);
 float tk=F(abs(rr-.82)-.018)*step(adiff(fract(a*48.+t*.05),0.),.08);
 col=mix(col,vec3(.93,.92,.9)*.55,tk);al=max(al,tk*.6);
 float rim=F(abs(rr-.48)-.004);col=mix(col,vec3(.93,.92,.9)*.35,rim);al=max(al,rim*.5);
 float head=F(length(p-.62*vec2(sin(f*TAU),cos(f*TAU)))-.03);col=mix(col,vec3(1.),head);al=max(al,head);
 col+=vec3(1.,.165,.239)*flash*.35*smoothstep(.3,1.3,rr);al=max(al,flash*.25*smoothstep(.3,1.3,rr));
 float sl=.92+.08*sin(gl_FragCoord.y*1.7);col*=sl;
 col+=(h1(gl_FragCoord.xy+fract(t*7.)*91.)-.5)*.03;
 gl_FragColor=vec4(col*al,al);}`;

const g=S.mk(cv,FS);
const st={f:.72,c:.72,hold:0,e:99,t:2};
const hp=document.getElementById('holoHp');
function draw(){
  if(!g) return; S.fit(cv,2);
  const x=g.gl; x.viewport(0,0,cv.width,cv.height); x.useProgram(g.pr);
  x.clearColor(0,0,0,0); x.clear(x.COLOR_BUFFER_BIT);
  x.uniform2f(g.u('r'),cv.width,cv.height); x.uniform1f(g.u('t'),st.t);
  x.uniform1f(g.u('f'),st.f); x.uniform1f(g.u('c'),st.c); x.uniform1f(g.u('e'),st.e);
  x.drawArrays(x.TRIANGLES,0,3);
  if(hp) hp.textContent=Math.round(st.f*100);
}

/* tilt + glare follow the pointer anywhere over the hero */
const hero=btn.closest('.hero')||document;
if(!S.reduce){
  hero.addEventListener('pointermove',ev=>{
    const b=btn.getBoundingClientRect();
    const nx=Math.max(-1,Math.min(1,(ev.clientX-(b.left+b.width/2))/(b.width*1.6)));
    const ny=Math.max(-1,Math.min(1,(ev.clientY-(b.top+b.height/2))/(b.height*1.4)));
    inner.style.setProperty('--ry',(nx*22-6).toFixed(2)+'deg');
    inner.style.setProperty('--rx',(-ny*16+4).toFixed(2)+'deg');
    inner.style.setProperty('--gx',(50+nx*45).toFixed(1)+'%');
    inner.style.setProperty('--gy',(40+ny*40).toFixed(1)+'%');
  });
  hero.addEventListener('pointerleave',()=>{['--rx','--ry','--gx','--gy'].forEach(k=>inner.style.removeProperty(k));});
}

btn.addEventListener('click',()=>{
  st.c=Math.max(st.c,st.f); st.hold=.5; st.e=0;
  st.f=Math.max(.06,st.f-(.12+Math.random()*.1));
  btn.classList.remove('hit'); void btn.offsetWidth; btn.classList.add('hit');
  if(S.reduce) draw();
});

/* FPS sparkline in the mini card, fed from the hero's own FPS counter */
const fpsEl=document.getElementById('heroFps'), fps2=document.getElementById('heroFps2'), line=document.getElementById('fpsLine');
const hist=[];
function pushFps(){
  const v=fpsEl?parseFloat(fpsEl.textContent)||60:60;
  hist.push(v); if(hist.length>32) hist.shift();
  if(fps2) fps2.textContent=Math.round(v);
  if(line) line.setAttribute('points',hist.map((y,i)=>((i/31)*160).toFixed(1)+','+(38-Math.min(36,y/72*36)).toFixed(1)).join(' '));
}
pushFps(); setInterval(pushFps,500);

if(S.reduce){ draw(); addEventListener('resize',draw); return; }
let visible=true,last=0;
if('IntersectionObserver' in window) new IntersectionObserver(es=>{visible=es[0].isIntersecting;}).observe(btn);
S.onFrame(ms=>{
  const dt=last?Math.min((ms-last)/1000,.1):0; last=ms;
  st.t=ms/1000; st.e+=dt;
  if(st.c>st.f){st.hold-=dt; if(st.hold<0) st.c=Math.max(st.f,st.c-dt*.5);} else st.c=st.f;
  if(st.e>1.2) st.f=Math.min(1,st.f+dt*.04);
  if(visible) draw();
});
})();

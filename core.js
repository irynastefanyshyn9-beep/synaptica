/* SYNAPTICA UI — shared runtime: WebGL helpers, cursor-reactive hero shader, nav state */
(function(){
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const VS='attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
function mk(canvas,fs){
  const gl=canvas.getContext('webgl',{antialias:true});
  if(!gl) return null;
  const sh=(t,s)=>{const o=gl.createShader(t);gl.shaderSource(o,s);gl.compileShader(o);if(!gl.getShaderParameter(o,gl.COMPILE_STATUS))console.warn(gl.getShaderInfoLog(o));return o;};
  const pr=gl.createProgram();gl.attachShader(pr,sh(gl.VERTEX_SHADER,VS));gl.attachShader(pr,sh(gl.FRAGMENT_SHADER,fs));gl.linkProgram(pr);gl.useProgram(pr);
  const b=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),gl.STATIC_DRAW);
  const l=gl.getAttribLocation(pr,'p');gl.enableVertexAttribArray(l);gl.vertexAttribPointer(l,2,gl.FLOAT,false,0,0);
  const u={};return {gl,pr,u:n=>u[n]||(u[n]=gl.getUniformLocation(pr,n))};
}
function fit(c,max){const d=Math.min(devicePixelRatio||1,max);const w=Math.max(1,Math.round(c.clientWidth*d)),h=Math.max(1,Math.round(c.clientHeight*d));if(c.width!==w||c.height!==h){c.width=w;c.height=h;}}
const NOISE=`float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+1.),f.x),f.y);}
float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<5;i++){v+=a*n(p);p*=2.03;a*=.5;}return v;}`;

/* frame loop shared by all pages */
const subs=[];
function onFrame(fn){subs.push(fn);}
function loop(ms){subs.forEach(f=>f(ms));requestAnimationFrame(loop);}

window.SYN={mk,fit,NOISE,reduce,onFrame};

/* nav: mark current page */
const here=(location.pathname.split('/').pop()||'index.html');
document.querySelectorAll('.links a, .menu nav a').forEach(a=>{
  const href=a.getAttribute('href');
  if(href===here||(here===''&&href==='index.html')||(here==='index.html'&&href==='index.html'))a.setAttribute('aria-current','page');
});
const pageKey=document.body.dataset.page;
if(pageKey)document.querySelectorAll('[data-nav="'+pageKey+'"]').forEach(a=>a.setAttribute('aria-current','page'));

/* hero: warm smoke, cursor heat distortion, embers, grain, scanlines */
const heroEl=document.querySelector('.hero');
const cv=heroEl&&heroEl.querySelector('.heroGL');
if(cv){
  const hue=parseFloat(heroEl.dataset.hue||'0');
  const SMOKE=`precision mediump float;uniform vec2 r,m;uniform float t,hue;${NOISE}
void main(){vec2 uv=gl_FragCoord.xy/r;vec2 asp=vec2(r.x/r.y,1.);vec2 p=uv*asp*2.2;vec2 mp=m*asp*2.2;
float md=length(p-mp);float heat=exp(-md*1.5);
p+=(p-mp)*heat*.16*sin(t*2.2-md*7.);
float q=fbm(p+vec2(t*.04,-t*.06));float s=fbm(p*1.3+q*1.6+vec2(-t*.05,t*.02)+hue);
vec3 c=mix(vec3(.067,.075,.082),vec3(.2,.19,.18),smoothstep(.35,.95,s));
c+=vec3(1.,.35,.12)*pow(smoothstep(.66,.97,s),3.)*.55*(.5+.5*uv.x);
c+=vec3(1.,.4,.15)*heat*heat*.3*(.6+.4*s);
float th=mix(.9972,.985,heat);float e=step(th,h(floor(gl_FragCoord.xy/3.)+floor(t*3.)))*(smoothstep(.2,.9,uv.y)+heat);c+=vec3(1.,.55,.25)*e*.6;
c*=.9+.1*sin(gl_FragCoord.y*1.6);
c+=(h(gl_FragCoord.xy+fract(t*7.)*91.)-.5)*.035;
float v=smoothstep(1.25,.25,length(uv-vec2(.7,.5)));c*=.4+.7*v;
gl_FragColor=vec4(c,1.);}`;
  /* raymarched industrial corridor: walls, ribs, pipes, flickering lamps, fog, dust */
  const SCENE=`precision highp float;uniform vec2 r,m;uniform float t,hue;${NOISE}
float sdCyl(vec2 p,vec2 c,float rr){return length(p-c)-rr;}
float map(vec3 p){
 float walls=min(2.2-abs(p.x),min(1.6-p.y,p.y+1.4));
 float pz=mod(p.z,3.)-1.5;
 float rib=max(abs(pz)-.09,min(1.95-abs(p.x),min(1.35-p.y,p.y+1.25)));
 float pipes=min(sdCyl(p.xy,vec2(1.75,1.2),.2),min(sdCyl(p.xy,vec2(-1.8,.7),.13),min(sdCyl(p.xy,vec2(-1.8,.38),.09),sdCyl(p.xy,vec2(1.85,-.9),.16))));
 float rail=length(vec2(abs(p.x)-1.55,p.y+.55))-.03;
 return min(min(walls,rib),min(pipes,rail));}
vec3 nrm(vec3 p){vec2 e=vec2(.003,0.);return normalize(vec3(map(p+e.xyy)-map(p-e.xyy),map(p+e.yxy)-map(p-e.yxy),map(p+e.yyx)-map(p-e.yyx)));}
void main(){
 vec2 uv=(gl_FragCoord.xy-.5*r)/r.y;
 float spd=t*.9;
 vec3 ro=vec3(.35*sin(t*.23)+(m.x-.5)*.5,-.1+.03*sin(t*3.1)+(m.y-.5)*.25,spd);
 vec3 fw=normalize(vec3((m.x-.5)*.35+.08*sin(t*.31),(m.y-.5)*.2,1.));vec3 rt=normalize(cross(vec3(0,1,0),fw));vec3 up=cross(fw,rt);
 float off=r.x>r.y?.38:0.;vec3 rd=normalize(fw*1.25+rt*(uv.x-off)+up*(uv.y+.04));
 float d=0.,glow=0.;vec3 p=ro;
 for(int i=0;i<72;i++){p=ro+rd*d;float s=map(p);
  float lz=floor(p.z/4.)*4.+2.;float ld=length(p-vec3(0.,1.4,lz));glow+=.006/(ld*ld+.03);
  if(s<.002||d>38.)break;d+=s*.9;}
 float lz=floor(p.z/4.)*4.+2.;float li=floor(p.z/4.);
 float fl=.65+.35*step(.18,n(vec2(li*7.1,t*9.)));
 vec3 n=nrm(p);vec3 L=vec3(0.,1.4,lz)-p;float ll=length(L);L/=ll;
 float dif=max(dot(n,L),0.)*fl/(1.+ll*ll*.06);
 float grime=fbm(p.zy*2.3+p.x)*.6+.4;
 vec3 base=mix(vec3(.13,.12,.115),vec3(.24,.17,.12),step(1.5,abs(p.x))*.6)*grime;
 if(p.y<-1.38){base=vec3(.09,.085,.08)*(.6+.4*step(.5,fract(p.x*6.))*step(.5,fract(p.z*6.)));}
 vec3 col=base*(.14+dif*vec3(1.,.62,.33)*3.2+max(n.y,0.)*.1);
 col+=vec3(1.,.55,.25)*pow(max(dot(reflect(-L,n),-rd),0.),24.)*dif*.6;
 float fog=1.-exp(-d*.06);vec3 haze=mix(vec3(.2,.13,.08),vec3(.62,.32,.14),.6+.2*sin(t*.4));
 col=mix(col,haze,fog);
 col+=vec3(1.,.58,.28)*glow*fl*.8;
 vec2 g=gl_FragCoord.xy/r;
 float dust=step(.9975,h(floor(gl_FragCoord.xy/2.)+floor(t*14.)))*smoothstep(.2,.8,g.y);col+=vec3(1.,.7,.45)*dust*.5;
 col=pow(col,vec3(.9));col*=.9+.1*sin(gl_FragCoord.y*1.5);
 col*=smoothstep(1.3,.3,length(g-.5));col+=(h(gl_FragCoord.xy+fract(t*7.)*91.)-.5)*.03;
 gl_FragColor=vec4(col,1.);}`;
  const isScene=heroEl.classList.contains('scene');
  const hero=mk(cv,isScene?SCENE:SMOKE);
  const M={x:.72,y:.5,tx:.72,ty:.5};
  heroEl.addEventListener('pointermove',e=>{const b=heroEl.getBoundingClientRect();M.tx=(e.clientX-b.left)/b.width;M.ty=1-(e.clientY-b.top)/b.height;});
  heroEl.addEventListener('pointerleave',()=>{M.tx=.72;M.ty=.5;});
  const ret=heroEl.querySelector('.reticle'),dist=heroEl.querySelector('.dist');
  let visible=true,hf=0,hl=0;
  if('IntersectionObserver' in window)new IntersectionObserver(es=>{visible=es[0].isIntersecting;}).observe(heroEl);
  const draw=ms=>{
    if(!hero)return;
    const g=hero.gl;fit(cv,isScene?(innerWidth<700?.5:.6):1);g.viewport(0,0,cv.width,cv.height);g.useProgram(hero.pr);
    g.uniform2f(hero.u('r'),cv.width,cv.height);g.uniform2f(hero.u('m'),M.x,M.y);g.uniform1f(hero.u('t'),ms/1000);g.uniform1f(hero.u('hue'),hue);
    g.drawArrays(g.TRIANGLES,0,3);
  };
  if(reduce){draw(4000);addEventListener('resize',()=>draw(4000));}
  else onFrame(ms=>{
    M.x+=(M.tx-M.x)*.08;M.y+=(M.ty-M.y)*.08;
    if(ret)ret.style.transform='translate('+((M.x-.72)*30).toFixed(1)+'px,'+((.5-M.y)*30).toFixed(1)+'px)';
    if(dist)dist.textContent=(90+Math.hypot(M.x-.72,M.y-.5)*400).toFixed(1);
    if(visible)draw(ms);hf++;if(ms-hl>500){const el=document.getElementById('heroFps');if(el)el.textContent=Math.round(hf*1000/(ms-hl));hf=0;hl=ms;}
  });
}
if(!reduce)requestAnimationFrame(loop);
})();

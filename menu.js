/* SYNAPTICA UI — isometric asset menu on the home hero.
   Eight glass panels (one per HUD asset) sit on an isometric line; the selected one lifts and glows,
   and its shader renders live in the preview. All 8 programs share one WebGL context. */
(function(){
const S=window.SYN, G=window.SYN_ASSETS; if(!S||!G) return;
const root=document.querySelector('.iso-hero'); if(!root) return;
const stack=root.querySelector('.iso-stack'), stage=root.querySelector('.iso-stage'), pool=root.querySelector('.iso-pool');
const cv=document.getElementById('isoGL');
const $=id=>document.getElementById(id);
const CATS={combat:'Combat',navigation:'Navigation',status:'Status'};

/* ---- WebGL: one context, 8 programs ---- */
const gl=cv.getContext('webgl',{antialias:true});
const VS='attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
let buf=null;
function prog(fs){
  const sh=(t,src)=>{const o=gl.createShader(t);gl.shaderSource(o,src);gl.compileShader(o);if(!gl.getShaderParameter(o,gl.COMPILE_STATUS))console.warn(gl.getShaderInfoLog(o));return o;};
  const pr=gl.createProgram();gl.attachShader(pr,sh(gl.VERTEX_SHADER,VS));gl.attachShader(pr,sh(gl.FRAGMENT_SHADER,fs));gl.linkProgram(pr);
  const u={};return {pr,u:n=>u[n]!==undefined?u[n]:(u[n]=gl.getUniformLocation(pr,n)),loc:gl.getAttribLocation(pr,'p')};
}
if(gl){buf=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buf);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),gl.STATIC_DRAW);}
const items=G.A.map(a=>({a,p:gl?prog(G.COMMON+a.fs):null,st:{u:a.param.d,e:99,c:a.param.d,hold:.45,m:[0,0],t:2}}));

/* ---- panels ---- */
const GHOST_BEFORE=0, GHOST_AFTER=2;
const SHORT=['Reticle','Ammo ring','Cooldown','Radar','Hex shield','Damage dir','Stamina','Objective'];
let slot=0;
function ghost(){const g=document.createElement('span');g.className='iso-card ghost';g.style.setProperty('--i',slot++);g.setAttribute('aria-hidden','true');stack.appendChild(g);}
for(let k=0;k<GHOST_BEFORE;k++) ghost();
items.forEach((it,i)=>{
  const b=document.createElement('button');
  b.type='button';b.className='iso-card';b.setAttribute('role','option');b.id='iso-opt-'+i;
  b.style.setProperty('--i',slot++);
  b.innerHTML='<span class="ic-n">'+String(i+1).padStart(2,'0')+'</span><span class="ic-t">'+SHORT[i]+'</span><span class="ic-d" aria-hidden="true"><i></i><i></i><i></i></span>';
  b.addEventListener('mouseenter',()=>{user();select(i);});
  b.addEventListener('focus',()=>select(i));
  b.addEventListener('click',()=>{user();select(i);fire();});
  it.el=b; stack.appendChild(b);
});
for(let k=0;k<GHOST_AFTER;k++) ghost();
stack.style.setProperty('--n',slot);

let cur=-1;
function select(i){
  if(i===cur) return; cur=i;
  items.forEach((it,k)=>{it.el.classList.toggle('on',k===i);it.el.setAttribute('aria-selected',k===i?'true':'false');});
  stack.setAttribute('aria-activedescendant','iso-opt-'+i);
  const it=items[i], a=it.a;
  pool.style.setProperty('--i',GHOST_BEFORE+i);
  $('isoName').textContent=a.name; $('isoDesc').textContent=a.desc;
  $('isoCat').textContent=CATS[a.cat]; $('isoBudget').textContent=a.budget;
  $('isoFile').textContent=a.file; $('isoIdx').textContent=String(i+1).padStart(2,'0')+' / 08';
  const info=root.querySelector('.iso-info'); info.classList.remove('swap'); void info.offsetWidth; info.classList.add('swap');
  if(S.reduce) draw();
}
function fire(){
  const it=items[cur]; if(!it) return;
  const a=it.a, st=it.st, set=v=>{st.u=v;};
  if(a.click){const ang=Math.random()*6.283,d=.25+Math.random()*.4;st.m=[Math.sin(ang)*d,Math.cos(ang)*d];st.e=0;}
  else if(a.act) a.act.run(st,set);
  else st.e=0;
  root.classList.remove('fired'); void root.offsetWidth; root.classList.add('fired');
  if(S.reduce){st.e=.15;draw();}
}
cv.addEventListener('pointerdown',()=>{user();fire();});

/* keyboard: arrows switch, A / Enter select+fire, X / Space fire, B opens gallery */
stack.addEventListener('keydown',ev=>{
  const k=ev.key;
  if(k==='ArrowRight'||k==='ArrowUp'){ev.preventDefault();user();select((cur+1)%items.length);}
  else if(k==='ArrowLeft'||k==='ArrowDown'){ev.preventDefault();user();select((cur+items.length-1)%items.length);}
  else if(k==='Enter'||k===' '||k==='a'||k==='x'){ev.preventDefault();user();fire();}
  else if(k==='b'){location.href='components.html#gallery';}
});

/* auto-cycle until the visitor touches anything */
let auto=!S.reduce, timer=null;
function user(){ if(auto){auto=false;clearInterval(timer);} }
if(auto) timer=setInterval(()=>{select((cur+1)%items.length); if(Math.random()<.6) fire();},3200);

/* scale the fixed-size stack to its column */
function fit(){const w=stage.clientWidth; const s=Math.min(1.05,w/820); stage.style.setProperty('--s',s.toFixed(3));}
addEventListener('resize',fit); fit();

/* ---- render ---- */
function draw(){
  const it=items[cur]; if(!gl||!it) return;
  S.fit(cv,1.6);
  gl.viewport(0,0,cv.width,cv.height); gl.useProgram(it.p.pr);
  gl.bindBuffer(gl.ARRAY_BUFFER,buf); gl.enableVertexAttribArray(it.p.loc); gl.vertexAttribPointer(it.p.loc,2,gl.FLOAT,false,0,0);
  const st=it.st,u=it.p.u;
  gl.uniform2f(u('r'),cv.width,cv.height); gl.uniform2f(u('m'),st.m[0],st.m[1]);
  gl.uniform1f(u('t'),st.t); gl.uniform1f(u('u'),st.u); gl.uniform1f(u('e'),st.e); gl.uniform1f(u('c'),st.c);
  gl.drawArrays(gl.TRIANGLES,0,3);
  if(it.a.read) $('isoRead').textContent=it.a.read(st); else $('isoRead').textContent='';
}
select(0);
if(S.reduce){ draw(); addEventListener('resize',draw); return; }
let visible=true,last=0,hf=0,hl=0;
if('IntersectionObserver' in window) new IntersectionObserver(es=>{visible=es[0].isIntersecting;}).observe(root);
const fpsEl=$('heroFps');
S.onFrame(ms=>{
  const dt=last?Math.min((ms-last)/1000,.1):0; last=ms;
  items.forEach(it=>{it.st.t=ms/1000; it.st.e+=dt; if(it.a.tick) it.a.tick(it.st,dt);});
  if(visible) draw();
  hf++; if(ms-hl>500){ if(fpsEl) fpsEl.textContent=Math.round(hf*1000/(ms-hl)); hf=0; hl=ms; }
});
})();

/* SYNAPTICA UI — home hero "Loadout": a stylized low-poly operator built procedurally in Three.js.
   Switch weapons (1–5 / list), click to fire (muzzle flash + recoil + ammo), R to reload, drag to rotate. */
import * as THREE from './vendor/three.module.min.js';

const root = document.querySelector('.lo-hero');
const cv = document.getElementById('loGL');
if (root && cv) init();

function init(){
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
let renderer;
try { renderer = new THREE.WebGLRenderer({canvas:cv, antialias:true, alpha:true}); }
catch(e){ root.classList.add('no-gl'); return; }
renderer.setPixelRatio(Math.min(devicePixelRatio||1, 1.75));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x0b0b0c, 7, 16);
const cam = new THREE.PerspectiveCamera(30, 1, .1, 50);

/* ---------- lights ---------- */
scene.add(new THREE.HemisphereLight(0x9aa4b0, 0x140c08, .55));
const key = new THREE.DirectionalLight(0xffe2cc, 3.2); key.position.set(-3, 5, 4); key.castShadow = true;
key.shadow.mapSize.set(1024,1024); key.shadow.camera.left=-2; key.shadow.camera.right=2; key.shadow.camera.top=3; key.shadow.camera.bottom=-1; key.shadow.bias=-0.0005;
scene.add(key);
const rim = new THREE.DirectionalLight(0xff5a1f, 3.2); rim.position.set(3, 3, -3); scene.add(rim);
const fill = new THREE.DirectionalLight(0x3ee0c4, .9); fill.position.set(-4, 2, -3); scene.add(fill);
const flashLight = new THREE.PointLight(0xffa060, 0, 3, 2); scene.add(flashLight);
const front = new THREE.DirectionalLight(0xdfe6ee, 1.1); front.position.set(1, 2, 6); scene.add(front);

/* ---------- materials ---------- */
const M = {
  suit:  new THREE.MeshStandardMaterial({color:0x2f343a, roughness:.7, metalness:.2}),
  armor: new THREE.MeshStandardMaterial({color:0x4b525a, roughness:.42, metalness:.55}),
  dark:  new THREE.MeshStandardMaterial({color:0x121417, roughness:.6, metalness:.4}),
  skin:  new THREE.MeshStandardMaterial({color:0x25282c, roughness:.9}),
  glow:  new THREE.MeshStandardMaterial({color:0xff5a1f, emissive:0xff5a1f, emissiveIntensity:2.6, roughness:.3}),
  gun:   new THREE.MeshStandardMaterial({color:0x5a6068, roughness:.3, metalness:.85}),
  gun2:  new THREE.MeshStandardMaterial({color:0x17191c, roughness:.5, metalness:.6}),
  lens:  new THREE.MeshStandardMaterial({color:0x3ee0c4, emissive:0x3ee0c4, emissiveIntensity:1.4, roughness:.1}),
};
const box = (w,h,d,m,x=0,y=0,z=0,p) => { const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m); o.position.set(x,y,z); o.castShadow=true; o.receiveShadow=true; if(p)p.add(o); return o; };
const cyl = (r1,r2,h,m,x=0,y=0,z=0,p,seg=14) => { const o=new THREE.Mesh(new THREE.CylinderGeometry(r1,r2,h,seg),m); o.position.set(x,y,z); o.castShadow=true; if(p)p.add(o); return o; };
const cap = (r,h,m,x=0,y=0,z=0,p) => { const o=new THREE.Mesh(new THREE.CapsuleGeometry(r,h,4,10),m); o.position.set(x,y,z); o.castShadow=true; if(p)p.add(o); return o; };

/* ---------- operator ---------- */
const hero = new THREE.Group(); scene.add(hero);
const body = new THREE.Group(); hero.add(body);
// legs
function leg(side){
  const g=new THREE.Group(); g.position.set(.11*side,.92,0); body.add(g);
  cap(.075,.32,M.suit,0,-.22,0,g);            // thigh
  box(.17,.14,.06,M.armor,0,-.2,.075,g);      // knee/thigh plate
  const sh=new THREE.Group(); sh.position.set(0,-.46,0); g.add(sh);
  cap(.065,.3,M.suit,0,-.2,0,sh);              // shin
  box(.14,.12,.07,M.armor,0,-.02,.06,sh);     // knee pad
  box(.13,.09,.26,M.dark,0,-.42,.05,sh);       // boot
  g.rotation.z = .03*side; g.rotation.x = side>0? .08 : -.06;
  return g;
}
leg(1); leg(-1);
// hips & torso
box(.34,.16,.2,M.suit,0,.95,0,body);
box(.36,.05,.22,M.dark,0,1.02,0,body);          // belt
box(.08,.08,.06,M.dark,.13,.98,.12,body); box(.08,.08,.06,M.dark,-.13,.98,.12,body); // pouches
const torso = new THREE.Group(); torso.position.set(0,1.05,0); body.add(torso);
box(.38,.44,.22,M.suit,0,.24,0,torso);
box(.4,.32,.08,M.armor,0,.27,.12,torso);        // vest front
box(.36,.28,.08,M.armor,0,.27,-.12,torso);      // vest back
box(.3,.04,.02,M.glow,0,.36,.165,torso);        // chest light strip
box(.1,.07,.04,M.dark,-.1,.16,.17,torso); box(.1,.07,.04,M.dark,0,.16,.17,torso); box(.1,.07,.04,M.dark,.1,.16,.17,torso); // mag pouches
box(.28,.3,.12,M.dark,0,.26,-.2,torso);         // backpack
cyl(.06,.06,.06,M.suit,0,.5,0,torso);           // neck
// head
const head = new THREE.Group(); head.position.set(0,.62,0); torso.add(head);
const skull = new THREE.Mesh(new THREE.SphereGeometry(.12,20,16),M.skin); skull.castShadow=true; head.add(skull);
const hood = new THREE.Mesh(new THREE.SphereGeometry(.145,20,16,0,Math.PI*2,0,Math.PI*.62),M.suit); hood.position.set(0,.01,-.015); hood.castShadow=true; head.add(hood);
box(.17,.045,.06,M.glow,0,.01,.1,head);         // visor
box(.2,.09,.1,M.dark,0,-.07,.06,head);          // mask
// shoulders + arms (pose: holding weapon at chest, aiming left-forward)
function arm(side){
  const sh=new THREE.Group(); sh.position.set(.23*side,.44,0); torso.add(sh);
  box(.13,.08,.16,M.armor,0,.02,0,sh);           // shoulder pad
  const up=new THREE.Group(); sh.add(up);
  cap(.055,.2,M.suit,0,-.15,0,up);
  const fo=new THREE.Group(); fo.position.set(0,-.3,0); up.add(fo);
  cap(.05,.19,M.suit,0,-.14,0,fo);
  box(.11,.09,.11,M.dark,0,-.28,0,fo);           // glove
  return {sh,up,fo};
}
const aR=arm(-1), aL=arm(1);
// weapon mount at chest, pointing +x in local space (to character's right side of screen → we rotate hero)
const mount = new THREE.Group(); mount.position.set(-.02,.16,.3); mount.scale.setScalar(1.45); torso.add(mount);
mount.rotation.y = -Math.PI/2; // weapon points along +z of torso (forward)

/* ---------- weapons (built along +x, grip at origin) ---------- */
function W(build){ const g=new THREE.Group(); build(g); g.traverse(o=>{if(o.isMesh)o.castShadow=true;}); return g; }
const muzzle = (g,x,y=0) => { const m=new THREE.Object3D(); m.position.set(x,y,0); m.name='muzzle'; g.add(m); };
const GUNS = [
 { id:'p9',  name:'P-9 Viper',   type:'Pistol',  mag:15, reserve:60,  rpm:420, stats:[42,55,30,92], foregrip:.06,
   mk:W(g=>{ box(.26,.07,.05,M.gun,.1,.03,0,g); box(.06,.13,.045,M.gun2,0,-.06,0,g); box(.16,.015,.052,M.glow,.11,.068,0,g); box(.05,.03,.04,M.gun2,.06,-.02,0,g); muzzle(g,.24,.03); }) },
 { id:'vx',  name:'VX-45 Wasp',  type:'SMG',     mag:32, reserve:128, rpm:900, stats:[48,92,40,80], foregrip:.22,
   mk:W(g=>{ box(.36,.1,.06,M.gun,.12,.02,0,g); box(.14,.035,.035,M.gun2,.36,.03,0,g); box(.05,.2,.04,M.gun2,.14,-.12,0,g); box(.06,.11,.045,M.gun2,0,-.07,0,g); box(.14,.05,.04,M.dark,-.1,.0,0,g); box(.2,.015,.062,M.glow,.12,.075,0,g); box(.07,.04,.045,M.dark,.1,.095,0,g); muzzle(g,.43,.03); }) },
 { id:'ar',  name:'AR-7 Ember',  type:'Rifle',   mag:30, reserve:120, rpm:680, stats:[68,70,72,62], foregrip:.32,
   mk:W(g=>{ box(.48,.1,.065,M.gun,.16,.03,0,g); box(.3,.03,.03,M.gun2,.55,.04,0,g); box(.22,.07,.06,M.gun2,.38,.0,0,g); box(.055,.2,.045,M.gun2,.16,-.11,0,g); box(.06,.12,.05,M.gun2,0,-.07,0,g); box(.24,.08,.05,M.dark,-.18,.0,0,g); box(.04,.12,.05,M.dark,-.3,-.02,0,g);
            cyl(.025,.025,.16,M.dark,.14,.12,0,g).rotation.z=Math.PI/2; box(.03,.03,.03,M.lens,.23,.12,0,g); box(.32,.015,.072,M.glow,.2,.085,0,g); muzzle(g,.7,.04); }) },
 { id:'sg',  name:'SG-12 Breach',type:'Shotgun', mag:8,  reserve:32,  rpm:80,  stats:[94,22,24,58], foregrip:.3,
   mk:W(g=>{ box(.4,.11,.07,M.gun,.12,.03,0,g); cyl(.032,.032,.42,M.gun2,.46,.05,0,g).rotation.z=Math.PI/2; cyl(.04,.04,.16,M.dark,.34,-.01,0,g).rotation.z=Math.PI/2; box(.06,.12,.05,M.gun2,0,-.07,0,g); box(.26,.09,.05,M.dark,-.2,-.01,0,g); box(.24,.02,.075,M.glow,.1,.09,0,g); muzzle(g,.67,.05); }) },
 { id:'lr',  name:'LR-50 Longshot',type:'Sniper',mag:5,  reserve:20,  rpm:40,  stats:[99,12,98,34], foregrip:.38,
   mk:W(g=>{ box(.5,.09,.06,M.gun,.16,.03,0,g); cyl(.02,.024,.6,M.gun2,.7,.04,0,g).rotation.z=Math.PI/2; box(.07,.05,.05,M.dark,1.0,.04,0,g); box(.05,.13,.045,M.gun2,.2,-.09,0,g); box(.06,.12,.05,M.gun2,0,-.07,0,g); box(.3,.1,.05,M.dark,-.22,.0,0,g);
            cyl(.04,.04,.3,M.dark,.18,.14,0,g).rotation.z=Math.PI/2; cyl(.045,.045,.02,M.lens,.335,.14,0,g).rotation.z=Math.PI/2; box(.36,.015,.066,M.glow,.2,.08,0,g);
            const bp=box(.015,.16,.015,M.dark,.62,-.06,.03,g); bp.rotation.z=.4; const bp2=box(.015,.16,.015,M.dark,.62,-.06,-.03,g); bp2.rotation.z=.4; muzzle(g,1.04,.04); }) },
];
GUNS.forEach(G=>{ G.mk.visible=false; mount.add(G.mk); });

/* muzzle flash sprite */
const flashMat = new THREE.MeshBasicMaterial({color:0xffc080, transparent:true, opacity:0, blending:THREE.AdditiveBlending, depthWrite:false, side:THREE.DoubleSide});
const flash = new THREE.Group();
for(let k=0;k<3;k++){ const p=new THREE.Mesh(new THREE.PlaneGeometry(.22,.09),flashMat); p.rotation.x=k*Math.PI/3; flash.add(p); }
const flashCore = new THREE.Mesh(new THREE.SphereGeometry(.035,10,8), flashMat); flash.add(flashCore);
scene.add(flash);

/* ---------- floor & pedestal ---------- */
const floor = new THREE.Mesh(new THREE.CircleGeometry(6,64), new THREE.ShadowMaterial({opacity:.55}));
floor.rotation.x=-Math.PI/2; floor.receiveShadow=true; scene.add(floor);
const ringMat = new THREE.MeshBasicMaterial({color:0xff5a1f, transparent:true, opacity:.85});
const ring = new THREE.Mesh(new THREE.RingGeometry(.62,.64,96), ringMat); ring.rotation.x=-Math.PI/2; ring.position.y=.003; scene.add(ring);
const ring2 = new THREE.Mesh(new THREE.RingGeometry(.78,.785,96,1,0,Math.PI*1.4), new THREE.MeshBasicMaterial({color:0xecebe7, transparent:true, opacity:.35})); ring2.rotation.x=-Math.PI/2; ring2.position.y=.003; scene.add(ring2);
const ticks = new THREE.Group(); scene.add(ticks);
for(let k=0;k<48;k++){ const t=new THREE.Mesh(new THREE.PlaneGeometry(.012,k%4?.04:.08), new THREE.MeshBasicMaterial({color:0xecebe7, transparent:true, opacity:k%4?.25:.6})); const a=k/48*Math.PI*2; t.position.set(Math.cos(a)*.9,.004,Math.sin(a)*.9); t.rotation.x=-Math.PI/2; t.rotation.z=-a+Math.PI/2; ticks.add(t); }
const glowDisc = new THREE.Mesh(new THREE.CircleGeometry(.62,64), new THREE.MeshBasicMaterial({color:0xff5a1f, transparent:true, opacity:.10})); glowDisc.rotation.x=-Math.PI/2; glowDisc.position.y=.002; scene.add(glowDisc);
const grid = new THREE.GridHelper(14, 28, 0x3a2a22, 0x1f1a17); grid.position.y=.001; grid.material.transparent=true; grid.material.opacity=.45; scene.add(grid);

/* ---------- pose ---------- */
function pose(G){
  // right hand on grip, left hand on foregrip; simple IK-ish angles tuned by eye
  const f=G.foregrip;
  aR.up.rotation.set(-.55,0,.32); aR.fo.rotation.set(-1.25,0,0);
  aL.up.rotation.set(-1.0 - f*.35, 0, -.42); aL.fo.rotation.set(-.55 - f*.4, 0, 0);
}

/* ---------- HUD wiring ---------- */
const $=id=>document.getElementById(id);
const list = $('loList'), statEls=[...root.querySelectorAll('.lo-stat i')], statN=[...root.querySelectorAll('.lo-stat b')];
GUNS.forEach((G,i)=>{
  const b=document.createElement('button'); b.type='button'; b.className='lo-w'; b.setAttribute('role','option'); b.id='lo-w-'+i;
  b.innerHTML='<kbd>'+(i+1)+'</kbd><span><b>'+G.name+'</b><em>'+G.type+'</em></span>';
  b.addEventListener('click',()=>equip(i)); list.appendChild(b); G.btn=b;
});
let cur=-1, ammo=0, reserve=0, reloading=0, cool=0, swapT=1, spin=0;
function equip(i){
  if(i===cur) return;
  const prev=GUNS[cur];
  cur=i; const G=GUNS[i];
  GUNS.forEach((g,k)=>{ g.mk.visible = k===i; g.btn.classList.toggle('on',k===i); g.btn.setAttribute('aria-selected',k===i?'true':'false'); });
  list.setAttribute('aria-activedescendant','lo-w-'+i);
  ammo=G.mag; reserve=G.reserve; reloading=0; swapT=0; spin = prev? 1 : 0;
  pose(G);
  $('loName').textContent=G.name; $('loType').textContent=G.type; $('loRpm').textContent=G.rpm+' RPM';
  G.stats.forEach((v,k)=>{ statEls[k].style.width=v+'%'; statN[k].textContent=v; });
  hud(); root.classList.remove('swap'); void root.offsetWidth; root.classList.add('swap');
}
function hud(){
  $('loAmmo').textContent = String(ammo).padStart(2,'0');
  $('loRes').textContent = '/ '+reserve;
  root.classList.toggle('low', ammo <= Math.ceil(GUNS[cur].mag*.25));
  $('loState').textContent = reloading>0 ? 'RELOADING' : 'EQUIPPED';
}
function fire(){
  const G=GUNS[cur]; if(reloading>0 || cool>0) return;
  if(ammo<=0){ reload(); return; }
  ammo--; cool = 60/G.rpm; kick = Math.min(1, kick + (G.stats[0]/100)*.9 + .25);
  const mz=G.mk.getObjectByName('muzzle'); mz.getWorldPosition(flash.position); flash.quaternion.copy(G.mk.getWorldQuaternion(new THREE.Quaternion()));
  flash.scale.setScalar(.7 + G.stats[0]/90); flashMat.opacity=1; flashLight.position.copy(flash.position); flashLight.intensity = 6;
  flash.rotation.x += Math.random();
  hud();
  if(ammo===0) setTimeout(reload, 220);
}
function reload(){ const G=GUNS[cur]; if(reloading>0 || ammo===G.mag || reserve===0) return; reloading = 1.1; hud(); }

let kick=0;
/* input */
let dragging=false, lx=0, rotY=-1.15, rotTarget=-1.15, mx=0, my=0;
cv.addEventListener('pointerdown',e=>{ dragging=true; lx=e.clientX; cv.setPointerCapture(e.pointerId); downX=e.clientX; });
let downX=0;
cv.addEventListener('pointermove',e=>{ if(dragging){ rotTarget += (e.clientX-lx)*.01; lx=e.clientX; } });
cv.addEventListener('pointerup',e=>{ dragging=false; if(Math.abs(e.clientX-downX)<5) fire(); });
root.addEventListener('pointermove',e=>{ const r=root.getBoundingClientRect(); mx=(e.clientX-r.left)/r.width-.5; my=(e.clientY-r.top)/r.height-.5; });
addEventListener('keydown',e=>{
  if(e.target.closest('input,textarea,select')) return;
  const r=root.getBoundingClientRect(); if(r.bottom<0||r.top>innerHeight) return;
  if(e.key>='1'&&e.key<='5'){ equip(+e.key-1); }
  else if(e.key==='r'||e.key==='R'){ reload(); }
  else if(e.key==='f'||e.key==='F'){ fire(); }
});
list.addEventListener('keydown',e=>{ if(e.key==='ArrowDown'){e.preventDefault();equip((cur+1)%GUNS.length);} if(e.key==='ArrowUp'){e.preventDefault();equip((cur+GUNS.length-1)%GUNS.length);} });
$('loFire').addEventListener('click',fire);
$('loReload').addEventListener('click',reload);

/* layout */
function size(){
  const w=root.clientWidth, h=root.clientHeight;
  const cw=cv.clientWidth, ch=cv.clientHeight;
  renderer.setSize(cw,ch,false); cam.aspect=cw/ch;
  const narrow = cw < 760;
  cam.fov = narrow? 34 : 30;
  cam.updateProjectionMatrix();
  base.set(narrow? 0 : -.1, 1.1, narrow? 4.3 : 7.2);
}
const base = new THREE.Vector3();
addEventListener('resize',size);

equip(2); size();

/* loop */
let last=performance.now(), t=0, visible=true, fpsN=0, fpsT=0;
const fpsEl=document.getElementById('heroFps');
if('IntersectionObserver' in window) new IntersectionObserver(es=>{visible=es[0].isIntersecting; if(visible) last=performance.now();}).observe(root);
function frame(now){
  requestAnimationFrame(frame);
  if(!visible) return;
  const dt=Math.min((now-last)/1000,.05); last=now; t+=dt;
  const G=GUNS[cur];
  // rotation & camera parallax
  if(!dragging && !reduce) rotTarget += Math.sin(t*.35)*.0006;
  rotY += (rotTarget-rotY)*.12; hero.rotation.y = rotY;
  cam.position.set(base.x + mx*.5, base.y - my*.25, base.z);
  cam.lookAt(base.x*.4, .98, 0);
  // idle breathing
  const br = reduce?0:Math.sin(t*2.1);
  torso.position.y = 1.05 + br*.006; torso.rotation.x = br*.01; head.rotation.y = Math.sin(t*.6)*.06;
  // swap animation
  if(swapT<1){ swapT=Math.min(1,swapT+dt*3.2); const k=swapT, e=1-Math.pow(1-k,3); G.mk.scale.setScalar(.2+.8*e); G.mk.rotation.x = (1-e)*Math.PI*1.5*spin; }
  // fire cooldown / auto fire while held key? no; recoil decay
  cool=Math.max(0,cool-dt);
  kick=Math.max(0,kick-dt*6);
  mount.position.z = .3 - kick*.06; mount.rotation.z = kick*.18;
  torso.rotation.y = -kick*.04;
  // reload anim
  if(reloading>0){ reloading-=dt; const p=1-Math.max(0,reloading)/1.1; mount.rotation.x = Math.sin(p*Math.PI)*.7; if(reloading<=0){ const need=G.mag-ammo, take=Math.min(need,reserve); ammo+=take; reserve-=take; reloading=0; mount.rotation.x=0; hud(); } }
  // flash fade
  flashMat.opacity=Math.max(0,flashMat.opacity-dt*22); flashLight.intensity=Math.max(0,flashLight.intensity-dt*90);
  // pedestal
  ring2.rotation.z = t*.25; ticks.rotation.y = -t*.08; glowDisc.material.opacity=.08+.04*Math.sin(t*2) + kick*.1;
  renderer.render(scene,cam);
  fpsN++; if(now-fpsT>500){ if(fpsEl) fpsEl.textContent=Math.round(fpsN*1000/(now-fpsT)); fpsN=0; fpsT=now; }
}
requestAnimationFrame(frame);
}

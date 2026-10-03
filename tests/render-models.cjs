const {chromium}=require(process.env.BRAM_PLAYWRIGHT_PATH || 'playwright');
(async()=>{
 const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--use-angle=swiftshader']});
 try {
  const page=await browser.newPage({viewport:{width:1400,height:850}});
  await page.route('**/__models-preview',r=>r.fulfill({contentType:'text/html',body:'<body style="margin:0;background:#13232b"></body>'}));
  await page.goto('http://127.0.0.1:5174/__models-preview');
  await page.evaluate(async()=>{
   const T=await import('/node_modules/three/build/three.module.js'),M=await import('/src/models.js');
   const renderer=new T.WebGLRenderer({antialias:true});renderer.setSize(1400,850);renderer.toneMapping=T.ACESFilmicToneMapping;document.body.append(renderer.domElement);
   const scene=new T.Scene();scene.background=new T.Color('#13232b');scene.add(new T.HemisphereLight('#e8ecff','#536551',2));
   const light=new T.DirectionalLight('#ffe2b5',3);light.position.set(-3,6,7);scene.add(light);
   const names=['Bram','Goblin','Orc','Knight','Necromancer','SkeletonBoss','Vampire','RockMonster','Bat'];
   names.forEach((name,i)=>{
    const model=M['create'+name]();model.position.set((i%5-2)*2.8,0,Math.floor(i/5)*4);model.rotation.y=.3;scene.add(model);
    const canvas=document.createElement('canvas');canvas.width=256;canvas.height=48;const ctx=canvas.getContext('2d');ctx.fillStyle='#e8d6aa';ctx.font='22px monospace';ctx.textAlign='center';ctx.fillText(name.replace('SkeletonBoss','Marrow King'),128,30);
    const label=new T.Sprite(new T.SpriteMaterial({map:new T.CanvasTexture(canvas),depthTest:false}));label.position.set(model.position.x,-.35,model.position.z+.55);label.scale.set(2.5,.47,1);scene.add(label);
   });
   const camera=new T.PerspectiveCamera(38,1400/850,.1,100);camera.position.set(1,10,20);camera.lookAt(0,.65,1.8);renderer.render(scene,camera);
  });await page.screenshot({path:'tests/artifacts/polished-models.png'});
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});

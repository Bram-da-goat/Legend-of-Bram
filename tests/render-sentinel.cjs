const {chromium}=require(process.env.BRAM_PLAYWRIGHT_PATH || 'playwright');
(async()=>{
 const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--use-angle=swiftshader']});
 try {
  const page=await browser.newPage({viewport:{width:900,height:900},deviceScaleFactor:1});
  await page.route('**/__sentinel-preview',route=>route.fulfill({contentType:'text/html',body:'<html><body style="margin:0"></body></html>'}));
  await page.goto('http://127.0.0.1:5174/__sentinel-preview');
  await page.evaluate(async()=>{
   const THREE=await import('/node_modules/three/build/three.module.js');
   const {createOathboundSentinel,walkUnit}=await import('/src/models.js');
   const renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});renderer.setSize(900,900);renderer.setPixelRatio(1);
   renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.1;
   document.body.append(renderer.domElement);
   const scene=new THREE.Scene();scene.background=new THREE.Color('#122532');
   scene.add(new THREE.HemisphereLight('#fff1d0','#416076',2.5));
   const key=new THREE.DirectionalLight('#ffe5ac',4);key.position.set(3,5,5);scene.add(key);
   const rim=new THREE.DirectionalLight('#93ddff',2);rim.position.set(-3,3,-2);scene.add(rim);
   const model=createOathboundSentinel();walkUnit(model,1.2);scene.add(model);
   const camera=new THREE.PerspectiveCamera(35,1,.1,40);camera.position.set(3.4,2.8,5.8);camera.lookAt(0,1.4,0);
   renderer.render(scene,camera);
  });
  await page.screenshot({path:'tests/artifacts/golden-sentinel.png'});
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});

import * as THREE from 'three';

export const terrainHeight = (x, z) =>
  Math.sin(x * 0.105) * 0.55 + Math.cos(z * 0.09) * 0.45 +
  Math.sin((x + z) * 0.045) * 0.8 + Math.sin(Math.hypot(x, z) * 0.16) * 0.22;

export function createTerrainMaterial() {
  return new THREE.ShaderMaterial({
    fog: true,
    uniforms: {
      uLightDirection: { value: new THREE.Vector3(-0.6, 0.8, 0.35).normalize() },
      uTime: { value: 0 },
      ...THREE.UniformsLib.fog,
    },
    vertexShader: `
      #include <fog_pars_vertex>
      varying vec3 vWorld; varying vec3 vNormalW; varying float vHeight;
      float heightAt(vec2 p){return sin(p.x*.105)*.55+cos(p.y*.09)*.45+sin((p.x+p.y)*.045)*.8+sin(length(p)*.16)*.22;}
      void main(){
        vec3 p=position; p.y+=heightAt(p.xz); vHeight=p.y;
        float e=.18; float hx=heightAt(p.xz+vec2(e,0.))-heightAt(p.xz-vec2(e,0.)); float hz=heightAt(p.xz+vec2(0.,e))-heightAt(p.xz-vec2(0.,e));
        vec3 n=normalize(vec3(-hx,2.*e,-hz)); vec4 world=modelMatrix*vec4(p,1.); vec4 mvPosition=viewMatrix*world; vWorld=world.xyz; vNormalW=normalize(mat3(modelMatrix)*n);
        gl_Position=projectionMatrix*mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: `
      #include <common>
      #include <fog_pars_fragment>
      uniform vec3 uLightDirection; uniform float uTime; varying vec3 vWorld; varying vec3 vNormalW; varying float vHeight;
      float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
      void main(){
        float broad=.5+.25*sin(vWorld.x*.31)+.18*cos(vWorld.z*.27)+.1*sin((vWorld.x+vWorld.z)*.61);
        float fine=.5+.5*sin(vWorld.x*2.7+sin(vWorld.z*1.9))*cos(vWorld.z*2.3);
        float n=clamp(broad+fine*.12,0.,1.);
        vec3 moss=mix(vec3(.095,.205,.145),vec3(.245,.335,.185),n);
        vec3 earth=vec3(.24,.19,.125); vec3 stone=vec3(.29,.32,.29);
        float path=smoothstep(3.2,1.1,abs(vWorld.x+sin(vWorld.z*.13)*3.));
        float slope=1.-max(dot(normalize(vNormalW),vec3(0,1,0)),0.);
        vec3 color=mix(moss,earth,path*.72); color=mix(color,stone,smoothstep(.24,.62,slope));
        float light=.32+.78*max(dot(normalize(vNormalW),uLightDirection),0.);float cloud=.92+.08*sin(vWorld.x*.075+uTime*.045)*sin(vWorld.z*.063-uTime*.032);color*=light*cloud;color+=vec3(.03,.05,.035)*smoothstep(-1.3,.7,vHeight);
        gl_FragColor=vec4(color,1.);
        #include <fog_fragment>
      }`,
  });
}

export function createWaterMaterial() {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: { uTime: { value: 0 }, uColorA: { value: new THREE.Color('#153e49') }, uColorB: { value: new THREE.Color('#68b6b5') } },
    vertexShader: `uniform float uTime; varying float vWave; varying vec3 vWorld; void main(){vec3 p=position;float w=sin(p.x*.7+uTime*1.1)*.09+cos(p.z*.9-uTime*.8)*.06;p.y+=w;vWave=w;vWorld=(modelMatrix*vec4(p,1.)).xyz;gl_Position=projectionMatrix*viewMatrix*vec4(vWorld,1.);}`,
    fragmentShader: `uniform vec3 uColorA;uniform vec3 uColorB;uniform float uTime;varying float vWave;varying vec3 vWorld;void main(){float lines=pow(.5+.5*sin((vWorld.x+vWorld.z)*2.5+uTime*1.8),14.);vec3 c=mix(uColorA,uColorB,.42+vWave*2.5)+lines*.16;gl_FragColor=vec4(c,.72);}`,
  });
}

export function createSkyMaterial() {
  return new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    uniforms: { uSun: { value: new THREE.Vector3(-0.45, 0.42, -0.6).normalize() } },
    vertexShader: `varying vec3 vDir;void main(){vDir=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader: `uniform vec3 uSun;varying vec3 vDir;void main(){float h=smoothstep(-.18,.7,vDir.y);vec3 low=vec3(.42,.48,.48),high=vec3(.025,.075,.12);vec3 c=mix(low,high,h);float sun=pow(max(dot(normalize(vDir),uSun),0.),420.);float glow=pow(max(dot(normalize(vDir),uSun),0.),8.);c+=vec3(1.,.56,.25)*sun*4.+vec3(.25,.12,.055)*glow;gl_FragColor=vec4(c,1.);}`,
  });
}

// Pipeline gráfico "3D pixel art": la escena se dibuja en baja resolución, se agranda sin suavizar,
// las luces brillan con bloom y un grading final agrega paleta con tramado, viñeta, grano y alarmas.
import * as THREE from "three";
import { EffectComposer } from "../vendor/addons/postprocessing/EffectComposer.js";
import { Pass, FullScreenQuad } from "../vendor/addons/postprocessing/Pass.js";
import { UnrealBloomPass } from "../vendor/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "../vendor/addons/postprocessing/OutputPass.js";
import { ShaderPass } from "../vendor/addons/postprocessing/ShaderPass.js";

class PixelRenderPass extends Pass {
  constructor(scene, camera, px) {
    super();
    this.scene = scene; this.camera = camera; this.px = px;
    this.needsSwap = true;
    this.rt = new THREE.WebGLRenderTarget(1, 1, { minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, type: THREE.HalfFloatType, samples: 0 });
    this.quad = new FullScreenQuad(new THREE.ShaderMaterial({
      uniforms: { tDiffuse: { value: null } },
      vertexShader: "varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
      fragmentShader: "uniform sampler2D tDiffuse; varying vec2 vUv; void main(){ gl_FragColor = texture2D(tDiffuse, vUv); }"
    }));
    this.w = 1; this.h = 1;
  }
  setSize(w, h) {
    this.w = w; this.h = h;
    this.rt.setSize(Math.max(1, Math.round(w / this.px)), Math.max(1, Math.round(h / this.px)));
  }
  render(renderer, writeBuffer) {
    renderer.setRenderTarget(this.rt);
    renderer.clear();
    renderer.render(this.scene, this.camera);
    this.quad.material.uniforms.tDiffuse.value = this.rt.texture;
    renderer.setRenderTarget(this.renderToScreen ? null : writeBuffer);
    this.quad.render(renderer);
  }
  dispose() { this.rt.dispose(); this.quad.dispose(); }
}

const GradeShader = {
  uniforms: {
    tDiffuse: { value: null }, uTime: { value: 0 }, uPx: { value: 3 }, uLevels: { value: 22 },
    uVig: { value: 0.42 }, uDanger: { value: 0 }, uFlash: { value: 0 }, uFlashColor: { value: new THREE.Color(1, 1, 1) },
    uGrain: { value: 0.035 }, uDither: { value: 1 }
  },
  vertexShader: "varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
  fragmentShader: `
    uniform sampler2D tDiffuse; uniform float uTime, uPx, uLevels, uVig, uDanger, uFlash, uGrain, uDither; uniform vec3 uFlashColor;
    varying vec2 vUv;
    float b2(vec2 a){ a = floor(a); return fract(dot(a, vec2(0.5, a.y * 0.75))); }
    float b4(vec2 a){ return b2(0.5 * a) * 0.25 + b2(a); }
    void main(){
      vec4 c = texture2D(tDiffuse, vUv);
      vec2 cell = floor(gl_FragCoord.xy / uPx);
      // paleta reducida con tramado ordenado sobre la grilla de pixeles
      float d = (b4(cell) - 0.5) * uDither;
      c.rgb = floor(c.rgb * uLevels + d + 0.5) / uLevels;
      float r = distance(vUv, vec2(0.5));
      c.rgb *= 1.0 - uVig * smoothstep(0.38, 0.9, r);
      float pulse = 0.55 + 0.45 * sin(uTime * 6.0);
      c.rgb = mix(c.rgb, vec3(0.85, 0.08, 0.14), uDanger * pulse * smoothstep(0.42, 0.85, r));
      float n = fract(sin(dot(cell + floor(uTime * 12.0), vec2(12.9898, 78.233))) * 43758.5453);
      c.rgb += (n - 0.5) * uGrain;
      c.rgb = mix(c.rgb, uFlashColor, uFlash);
      gl_FragColor = c;
    }`
};

export class Pipeline {
  constructor(renderer, scene, camera) {
    this.renderer = renderer;
    const c = this.composer = new EffectComposer(renderer);
    c.setPixelRatio(1);
    this.pixel = new PixelRenderPass(scene, camera, 3);
    this.bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.55, 0.35, 1.1);
    this.out = new OutputPass();
    this.grade = new ShaderPass(GradeShader);
    c.addPass(this.pixel); c.addPass(this.bloom); c.addPass(this.out); c.addPass(this.grade);
    this.flashT = 0;
  }
  setSize(w, h, coarse) {
    // pixeles más grandes en pantallas chicas: se nota el estilo y cuesta menos dibujar
    const base = Math.min(w, h);
    const px = Math.max(2, Math.min(4, Math.round(base / (coarse ? 170 : 230))));
    this.pixel.px = px;
    this.grade.uniforms.uPx.value = px;
    this.composer.setSize(w, h);
  }
  set danger(v) { this.grade.uniforms.uDanger.value = v; }
  set bloomStrength(v) { this.bloom.strength = v; }
  flash(color, amount = 0.45) {
    this.grade.uniforms.uFlashColor.value.set(color);
    this.grade.uniforms.uFlash.value = amount;
  }
  render(dt, scene, camera) {
    this.pixel.scene = scene; this.pixel.camera = camera;
    const u = this.grade.uniforms;
    u.uTime.value += dt;
    u.uFlash.value = Math.max(0, u.uFlash.value - dt * 1.8);
    this.composer.render(dt);
  }
}

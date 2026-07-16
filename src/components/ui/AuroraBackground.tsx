"use client";
import { useEffect, useRef } from "react";

/**
 * پس‌زمینه‌ی زنده‌ی «aurora / plasma» روی یک canvas سبک تمام‌صفحه (fixed).
 * از یک شیدر فرگمنت WebGL با value-noise چندلایه استفاده می‌کند که آرام و
 * سینمایی جریان دارد. کاملاً پشت محتوا، pointer-events-none، و روی
 * reduced-motion یا نبود WebGL به‌آرامی محو/غیرفعال می‌شود.
 */

const FRAG = `
precision mediump float;
uniform vec2 uRes;
uniform float uTime;
uniform vec2 uMouse;

// value noise
float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
float noise(vec2 p){
  vec2 i=floor(p), f=fract(p);
  float a=hash(i), b=hash(i+vec2(1.,0.)), c=hash(i+vec2(0.,1.)), d=hash(i+vec2(1.,1.));
  vec2 u=f*f*(3.-2.*f);
  return mix(a,b,u.x)+(c-a)*u.y*(1.-u.x)+(d-b)*u.x*u.y;
}
float fbm(vec2 p){
  float v=0.0, a=0.5;
  for(int i=0;i<5;i++){ v+=a*noise(p); p*=2.03; a*=0.5; }
  return v;
}

void main(){
  vec2 uv = gl_FragCoord.xy / uRes.xy;
  vec2 p = uv;
  p.x *= uRes.x / uRes.y;

  float t = uTime * 0.04;
  // جریان دامنه‌ای با کشش به سمت موس
  vec2 m = (uMouse - 0.5) * 0.4;
  float n = fbm(p * 2.2 + vec2(t, -t*0.7) + m);
  float n2 = fbm(p * 3.5 - vec2(t*0.6, t) + n);
  float blend = smoothstep(0.2, 0.9, n * 0.6 + n2 * 0.5);

  // پالت برند: بنفش → فیروزه‌ای → گرم
  // پالت «زغالی + زمردی + استخوانی»
  vec3 deep     = vec3(0.047, 0.051, 0.047); // #0C0D0C زغالی
  vec3 emerald  = vec3(0.122, 0.616, 0.420); // #1F9D6B زمردی
  vec3 emerald2 = vec3(0.247, 0.812, 0.557); // #3FCF8E زمردی روشن
  vec3 bone     = vec3(0.788, 0.663, 0.416); // #C9A96A طلایی گرم

  vec3 col = deep;
  col = mix(col, emerald,  smoothstep(0.25, 0.75, n) * 0.5);
  col = mix(col, emerald2, smoothstep(0.45, 0.95, n2) * 0.28);
  col = mix(col, bone,     pow(blend, 3.0) * 0.1);

  // vignette برای تمرکز و خوانایی محتوا
  float vig = smoothstep(1.15, 0.35, length(uv - 0.5));
  col *= 0.55 + vig * 0.7;

  gl_FragColor = vec4(col, 1.0);
}
`;

const VERT = `
attribute vec2 aPos;
void main(){ gl_Position = vec4(aPos, 0.0, 1.0); }
`;

export function AuroraBackground() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const canvas = ref.current;
    if (!canvas) return;

    const gl =
      (canvas.getContext("webgl", { antialias: false, alpha: false }) as WebGLRenderingContext) ||
      (canvas.getContext("experimental-webgl") as WebGLRenderingContext);
    if (!gl) return; // بدون WebGL: پس‌زمینه‌ی CSS پایه باقی می‌ماند

    const compile = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        gl.deleteShader(s);
        return null;
      }
      return s;
    };
    const vs = compile(gl.VERTEX_SHADER, VERT);
    const fs = compile(gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) return; // شیدر کامپایل نشد: پس‌زمینه‌ی CSS پایه باقی می‌ماند

    const prog = gl.createProgram()!;
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      gl.deleteProgram(prog);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      return;
    }
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 3, -1, -1, 3]),
      gl.STATIC_DRAW
    );
    const aPos = gl.getAttribLocation(prog, "aPos");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const uRes = gl.getUniformLocation(prog, "uRes");
    const uTime = gl.getUniformLocation(prog, "uTime");
    const uMouse = gl.getUniformLocation(prog, "uMouse");

    // روی موبایل/صفحات کوچک DPR را ۱ می‌کنیم تا مصرف GPU پایین بماند
    const isSmall = window.innerWidth < 768;
    const dpr = isSmall ? 1 : Math.min(window.devicePixelRatio || 1, 1.25);
    const resize = () => {
      const w = Math.floor(window.innerWidth * dpr);
      const h = Math.floor(window.innerHeight * dpr);
      canvas.width = w;
      canvas.height = h;
      canvas.style.width = window.innerWidth + "px";
      canvas.style.height = window.innerHeight + "px";
      gl.viewport(0, 0, w, h);
      gl.uniform2f(uRes, w, h);
    };
    resize();
    window.addEventListener("resize", resize);

    const mouse = { x: 0.5, y: 0.5 };
    const target = { x: 0.5, y: 0.5 };
    const onMove = (e: PointerEvent) => {
      target.x = e.clientX / window.innerWidth;
      target.y = 1 - e.clientY / window.innerHeight;
    };
    window.addEventListener("pointermove", onMove, { passive: true });

    let raf = 0;
    let running = true;
    const start = performance.now();
    // در reduced-motion فقط یک فریم ثابت رندر می‌کنیم
    const render = (now: number) => {
      if (!running) return;
      mouse.x += (target.x - mouse.x) * 0.05;
      mouse.y += (target.y - mouse.y) * 0.05;
      gl.uniform1f(uTime, reduced ? 8 : (now - start) / 1000);
      gl.uniform2f(uMouse, mouse.x, mouse.y);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      if (!reduced) raf = requestAnimationFrame(render);
    };
    render(start);

    const onVis = () => {
      if (document.hidden) {
        running = false;
        cancelAnimationFrame(raf);
      } else if (!reduced) {
        running = true;
        raf = requestAnimationFrame(render);
      }
    };
    document.addEventListener("visibilitychange", onVis);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("visibilitychange", onVis);
      // آزادسازی منابع WebGL
      try {
        gl.deleteBuffer(buf);
        gl.deleteProgram(prog);
        gl.deleteShader(vs);
        gl.deleteShader(fs);
        gl.getExtension("WEBGL_lose_context")?.loseContext();
      } catch {
        /* noop */
      }
    };
  }, []);

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 h-full w-full opacity-80"
    />
  );
}

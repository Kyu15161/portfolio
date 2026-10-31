"use client";

import React, { useEffect, useRef, useState } from "react";

interface WebGLBackgroundProps {
  currentColor?: string;
}

export default function WebGLBackground({ currentColor = "#e26947" }: WebGLBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const targetColorRef = useRef<[number, number, number]>([0.886, 0.412, 0.278]);
  const lerpedColorRef = useRef<[number, number, number]>([0.886, 0.412, 0.278]);
  const wakeUpRef = useRef<(() => void) | null>(null);
  const [webglSupported, setWebglSupported] = useState(true);

  useEffect(() => {
    function hexToRgb(hex: string): [number, number, number] {
      const cleanHex = hex.replace("#", "");
      if (cleanHex.length === 3) {
        const r = parseInt(cleanHex[0] + cleanHex[0], 16) / 255;
        const g = parseInt(cleanHex[1] + cleanHex[1], 16) / 255;
        const b = parseInt(cleanHex[2] + cleanHex[2], 16) / 255;
        return [r, g, b];
      }
      if (cleanHex.length === 6) {
        const r = parseInt(cleanHex.substring(0, 2), 16) / 255;
        const g = parseInt(cleanHex.substring(2, 4), 16) / 255;
        const b = parseInt(cleanHex.substring(4, 6), 16) / 255;
        return [r, g, b];
      }
      return [0.886, 0.412, 0.278];
    }

    targetColorRef.current = hexToRgb(currentColor);
    wakeUpRef.current?.();
  }, [currentColor]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl: WebGLRenderingContext | null = (() => {
      try {
        return (
          canvas.getContext("webgl") ||
          (canvas.getContext("experimental-webgl") as WebGLRenderingContext | null)
        );
      } catch {
        return null;
      }
    })();

    if (!gl) {
      const timer = requestAnimationFrame(() => setWebglSupported(false));
      return () => cancelAnimationFrame(timer);
    }

    const vsSource = `
      attribute vec2 aPosition;
      void main() {
        gl_Position = vec4(aPosition, 0.0, 1.0);
      }
    `;

    // Kodak Portra terracotta, tungsten ochre, and Nordic twilight teal darkroom field
    const fsSource = `
      precision mediump float;
      uniform vec2 uResolution;
      uniform float uTime;
      uniform vec3 uColor;

      vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
      float snoise(vec2 v){
        const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                 -0.577350269189626, 0.024390243902439);
        vec2 i  = floor(v + dot(v, C.yy) );
        vec2 x0 = v -   i + dot(i, C.xx);
        vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
        vec4 x12 = x0.xyxy + C.xxzz;
        x12.xy -= i1;
        i = mod(i, 289.0);
        vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
        + i.x + vec3(0.0, i1.x, 1.0 ));
        vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy),
          dot(x12.zw,x12.zw)), 0.0);
        m = m*m ;
        m = m*m ;
        vec3 x = 2.0 * fract(p * C.www) - 1.0;
        vec3 h = abs(x) - 0.5;
        vec3 ox = floor(x + 0.5);
        vec3 a0 = x - ox;
        m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
        vec3 g;
        g.x  = a0.x  * x0.x  + h.x  * x0.y;
        g.yz = a0.yz * x12.xz + h.yz * x12.yw;
        return 130.0 * dot(m, g);
      }

      void main() {
        vec2 uv = gl_FragCoord.xy / uResolution.xy;
        vec2 st = uv;
        st.x *= uResolution.x / uResolution.y;

        float n1 = snoise(st * 1.08 + vec2(uTime * 0.022, uTime * 0.014)) * 0.5 + 0.5;
        float n2 = snoise(st * 2.15 - vec2(uTime * 0.016, uTime * 0.024)) * 0.5 + 0.5;
        float n3 = snoise(st * 0.65 + vec2(-uTime * 0.012, uTime * 0.019)) * 0.5 + 0.5;
        float ribbon = smoothstep(0.18, 0.86, n1 * 0.58 + n2 * 0.42);

        vec3 baseEspresso = vec3(0.067, 0.055, 0.047);
        vec3 portraTerracotta = vec3(0.32, 0.135, 0.088);
        vec3 nordicTeal = vec3(0.085, 0.185, 0.225);
        vec3 tungstenOchre = vec3(0.285, 0.188, 0.092);

        float luma = dot(uColor, vec3(0.299, 0.587, 0.114));
        vec3 activePigment = mix(portraTerracotta * 1.45, uColor, clamp(luma * 2.5, 0.32, 1.0));

        float upperBloom = smoothstep(1.22, 0.06, length(uv - vec2(0.20, 0.80)));
        float lowerTealPool = smoothstep(1.25, 0.08, length(uv - vec2(0.84, 0.20)));
        float centerAmber = smoothstep(1.05, 0.14, length(uv - vec2(0.54, 0.52)));

        vec3 atmosphere = baseEspresso;
        atmosphere = mix(atmosphere, nordicTeal, lowerTealPool * (0.48 + 0.18 * n3));
        atmosphere = mix(atmosphere, tungstenOchre, (n2 * 0.55 + centerAmber * 0.45) * 0.22);
        atmosphere = mix(atmosphere, activePigment * 0.52, (ribbon * 0.52 + upperBloom * 0.48) * 0.64);

        float vignette = smoothstep(1.32, 0.28, length(uv - vec2(0.5, 0.52)));
        vec3 finalColor = mix(baseEspresso * 0.84, atmosphere, 0.48 + 0.52 * vignette);

        gl_FragColor = vec4(finalColor, 1.0);
      }
    `;

    function createShader(glCtx: WebGLRenderingContext, type: number, source: string) {
      const shader = glCtx.createShader(type);
      if (!shader) return null;
      glCtx.shaderSource(shader, source);
      glCtx.compileShader(shader);
      if (!glCtx.getShaderParameter(shader, glCtx.COMPILE_STATUS)) {
        glCtx.deleteShader(shader);
        return null;
      }
      return shader;
    }

    const vs = createShader(gl, gl.VERTEX_SHADER, vsSource);
    const fs = createShader(gl, gl.FRAGMENT_SHADER, fsSource);
    if (!vs || !fs) {
      const timer = requestAnimationFrame(() => setWebglSupported(false));
      return () => cancelAnimationFrame(timer);
    }

    const program = gl.createProgram();
    if (!program) {
      const timer = requestAnimationFrame(() => setWebglSupported(false));
      return () => cancelAnimationFrame(timer);
    }
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      const timer = requestAnimationFrame(() => setWebglSupported(false));
      return () => cancelAnimationFrame(timer);
    }

    const posBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([
        -1.0, -1.0,
         1.0, -1.0,
        -1.0,  1.0,
        -1.0,  1.0,
         1.0, -1.0,
         1.0,  1.0,
      ]),
      gl.STATIC_DRAW
    );

    const aPos = gl.getAttribLocation(program, "aPosition");
    const uRes = gl.getUniformLocation(program, "uResolution");
    const uTime = gl.getUniformLocation(program, "uTime");
    const uColor = gl.getUniformLocation(program, "uColor");

    const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    let animId: number | null = null;
    let isRunning = false;
    let lastActivityTime = performance.now();
    let lastRenderTime = 0;
    const startTime = performance.now();

    const render = () => {
      if (!canvas || !gl) return;
      if (document.visibilityState === "hidden") {
        isRunning = false;
        animId = null;
        return;
      }

      const now = performance.now();
      const prefersReducedMotion = reducedMotionQuery.matches;
      const elapsed = prefersReducedMotion ? 12.0 : (now - startTime) / 1000;

      const dr = Math.abs(targetColorRef.current[0] - lerpedColorRef.current[0]);
      const dg = Math.abs(targetColorRef.current[1] - lerpedColorRef.current[1]);
      const db = Math.abs(targetColorRef.current[2] - lerpedColorRef.current[2]);
      const colorDist = Math.max(dr, dg, db);
      const isConverged = colorDist < 0.002;

      if (isConverged || prefersReducedMotion) {
        lerpedColorRef.current[0] = targetColorRef.current[0];
        lerpedColorRef.current[1] = targetColorRef.current[1];
        lerpedColorRef.current[2] = targetColorRef.current[2];
      } else {
        lerpedColorRef.current[0] += (targetColorRef.current[0] - lerpedColorRef.current[0]) * 0.06;
        lerpedColorRef.current[1] += (targetColorRef.current[1] - lerpedColorRef.current[1]) * 0.06;
        lerpedColorRef.current[2] += (targetColorRef.current[2] - lerpedColorRef.current[2]) * 0.06;
      }

      gl.useProgram(program);
      gl.enableVertexAttribArray(aPos);
      gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
      gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform1f(uTime, elapsed);
      gl.uniform3f(
        uColor,
        lerpedColorRef.current[0],
        lerpedColorRef.current[1],
        lerpedColorRef.current[2]
      );

      gl.drawArrays(gl.TRIANGLES, 0, 6);

      if (prefersReducedMotion) {
        isRunning = false;
        animId = null;
        return;
      }

      const idleDuration = now - lastActivityTime;
      const isIdle = idleDuration > 2500;

      if (isIdle && isConverged) {
        if (idleDuration > 8000) {
          isRunning = false;
          animId = null;
          return;
        }

        if (now - lastRenderTime < 66) {
          animId = requestAnimationFrame(render);
          return;
        }
      }

      lastRenderTime = now;
      animId = requestAnimationFrame(render);
    };

    const wakeUp = () => {
      lastActivityTime = performance.now();
      if (!isRunning && document.visibilityState !== "hidden") {
        isRunning = true;
        animId = requestAnimationFrame(render);
      }
    };

    wakeUpRef.current = wakeUp;

    const resize = () => {
      if (!canvas || !gl) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.max(1, Math.floor(window.innerWidth * dpr));
      canvas.height = Math.max(1, Math.floor(window.innerHeight * dpr));
      gl.viewport(0, 0, canvas.width, canvas.height);
      wakeUp();
    };

    const onUserActivity = () => {
      if (!reducedMotionQuery.matches) {
        wakeUp();
      }
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        if (animId !== null) {
          cancelAnimationFrame(animId);
          animId = null;
        }
        isRunning = false;
      } else {
        wakeUp();
      }
    };

    window.addEventListener("resize", resize);
    window.addEventListener("mousemove", onUserActivity, { passive: true });
    window.addEventListener("scroll", onUserActivity, { passive: true });
    window.addEventListener("touchstart", onUserActivity, { passive: true });
    document.addEventListener("visibilitychange", onVisibilityChange);

    resize();

    return () => {
      wakeUpRef.current = null;
      if (animId !== null) {
        cancelAnimationFrame(animId);
      }
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onUserActivity);
      window.removeEventListener("scroll", onUserActivity);
      window.removeEventListener("touchstart", onUserActivity);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      gl.deleteProgram(program);
    };
  }, []);

  return (
    <>
      {/* Warm espresso, Kodak terracotta, and Nordic twilight teal fallback atmosphere */}
      <div
        className="fixed inset-0 pointer-events-none -z-20 w-screen h-screen bg-[#110e0c] bg-[radial-gradient(ellipse_85%_75%_at_20%_14%,rgba(226,105,71,0.22),transparent_64%),radial-gradient(ellipse_78%_70%_at_84%_86%,rgba(59,122,140,0.22),rgba(17,14,12,1))]"
        aria-hidden="true"
      />
      {webglSupported ? (
        <canvas
          ref={canvasRef}
          className="fixed inset-0 pointer-events-none -z-10 w-screen h-screen"
          style={{ width: "100vw", height: "100vh" }}
          aria-hidden="true"
        />
      ) : (
        <div
          className="fixed inset-0 pointer-events-none -z-10 w-screen h-screen opacity-80 bg-[radial-gradient(circle_at_28%_22%,rgba(226,105,71,0.2),transparent_56%),radial-gradient(circle_at_82%_76%,rgba(59,122,140,0.18),#110e0c_76%)]"
          aria-hidden="true"
        />
      )}
    </>
  );
}

"use client";

import * as React from "react";

// Animal Wonderland 3D stage — ported from Stitch screens:
//   d14a9b61423a49adb2d0a5bf05f5e5ed (Child-First 3D Play Home, ANIMATION_45 Rich)
//   4b8445bd757549bd9b59e61932c946c9 (isolated Three.js scene ANIMATION_45)
//   (supersedes f929a9c4 / ANIMATION_43 + b93346430a0f — same copy/layout,
//   validated Rich scene: candy mushrooms, bobbing counting apples,
//   15 deterministic stars, 4 birds, tap-jump burst)
//
// Fitted to Learnzzy Next.js conventions:
// - lazy-loads three r125 from CDN only on the client (no new npm dep, keeps PWA light)
// - honors prefers-reduced-motion (static frame, no loop)
// - cleans up renderer + listeners on unmount
// - CSS fallback (gradient island + emoji friends) when WebGL/CDN unavailable

declare global {
  interface Window {
    THREE?: any;
  }
}

const THREE_CDN = "https://ajax.googleapis.com/ajax/libs/threejs/r125/three.min.js";

function loadThree(): Promise<any> {
  if (typeof window === "undefined") return Promise.reject(new Error("ssr"));
  if (window.THREE) return Promise.resolve(window.THREE);
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[data-learnzzy-three]`);
    if (existing) {
      existing.addEventListener("load", () => resolve(window.THREE));
      existing.addEventListener("error", () => reject(new Error("three-cdn")));
      return;
    }
    const s = document.createElement("script");
    s.src = THREE_CDN;
    s.async = true;
    s.setAttribute("data-learnzzy-three", "1");
    s.onload = () => resolve(window.THREE);
    s.onerror = () => reject(new Error("three-cdn"));
    document.head.appendChild(s);
  });
}

export function AnimalWonderland3D({ height = 520 }: { height?: number }) {
  const mountRef = React.useRef<HTMLDivElement>(null);
  const [failed, setFailed] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    let renderer: any = null;
    let raf = 0;
    let onMouse: ((e: MouseEvent) => void) | null = null;
    let onResize: (() => void) | null = null;
    let onTap: (() => void) | null = null;
    const mountEl = mountRef.current;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    loadThree()
      .then((THREE) => {
        if (cancelled || !mountEl) return;
        const container = mountEl;
        const width = container.clientWidth || window.innerWidth;
        const h = container.clientHeight || height;

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(45, width / h, 0.1, 1000);
        camera.position.set(0, 4.5, 20);

        renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        renderer.setSize(width, h);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        container.appendChild(renderer.domElement);

        scene.add(new THREE.AmbientLight(0xffffff, 0.9));
        const sun = new THREE.DirectionalLight(0xfff7e6, 1.2);
        sun.position.set(12, 20, 15);
        sun.castShadow = true;
        scene.add(sun);
        const fill = new THREE.DirectionalLight(0xdbeafe, 0.6);
        fill.position.set(-15, 10, -10);
        scene.add(fill);

        // Island
        const island = new THREE.Group();
        scene.add(island);
        const mound = new THREE.Mesh(
          new THREE.CylinderGeometry(14, 11, 2.5, 32),
          new THREE.MeshToonMaterial({ color: 0x86efac })
        );
        mound.position.y = -1.5;
        mound.receiveShadow = true;
        island.add(mound);

        // Clouds
        const cloudMat = new THREE.MeshToonMaterial({ color: 0xffffff });
        const clouds: any[] = [];
        function makeCloud(x: number, y: number, z: number, s: number) {
          const g = new THREE.Group();
          const geo = new THREE.SphereGeometry(1, 16, 16);
          const p1 = new THREE.Mesh(geo, cloudMat);
          const p2 = new THREE.Mesh(geo, cloudMat);
          p2.position.set(0.9, -0.2, 0);
          p2.scale.set(0.8, 0.8, 0.8);
          const p3 = new THREE.Mesh(geo, cloudMat);
          p3.position.set(-0.9, -0.2, 0);
          p3.scale.set(0.75, 0.75, 0.75);
          const p4 = new THREE.Mesh(geo, cloudMat);
          p4.position.set(0.3, 0.5, 0.2);
          p4.scale.set(0.85, 0.85, 0.85);
          g.add(p1, p2, p3, p4);
          g.position.set(x, y, z);
          g.scale.set(s, s, s);
          scene.add(g);
          clouds.push(g);
        }
        makeCloud(-12, 7.5, -5, 1.4);
        makeCloud(12, 8.2, -6, 1.5);
        makeCloud(-2, 9.5, -10, 1.9);
        makeCloud(8, 4.5, -4, 1.0);

        // Rainbow
        const rainbow = new THREE.Group();
        [0xf87171, 0xfbbf24, 0x34d399, 0x60a5fa, 0xa78bfa].forEach((col, idx) => {
          const ring = new THREE.Mesh(
            new THREE.TorusGeometry(16 + idx * 0.45, 0.2, 12, 48, Math.PI),
            new THREE.MeshBasicMaterial({ color: col })
          );
          rainbow.add(ring);
        });
        rainbow.position.set(0, -1, -8);
        rainbow.rotation.y = 0.15;
        scene.add(rainbow);

        // Trees
        function makeTree(x: number, z: number, s: number) {
          const t = new THREE.Group();
          const trunk = new THREE.Mesh(
            new THREE.CylinderGeometry(0.25, 0.4, 1.5, 12),
            new THREE.MeshToonMaterial({ color: 0xd97706 })
          );
          trunk.position.y = 0.75;
          t.add(trunk);
          const top = new THREE.Mesh(
            new THREE.SphereGeometry(1.2, 16, 16),
            new THREE.MeshToonMaterial({ color: 0x4ade80 })
          );
          top.position.y = 2.0;
          t.add(top);
          t.position.set(x, -0.25, z);
          t.scale.set(s, s, s);
          island.add(t);
        }
        makeTree(-7.5, -3, 1.2);
        makeTree(8, -2, 1.3);
        makeTree(9, 2, 1.0);

        // Little candy mushrooms on the island (validated ANIMATION_45)
        function makeMushroom(x: number, z: number, capColor: number, s: number) {
          const mGroup = new THREE.Group();
          const stem = new THREE.Mesh(
            new THREE.CylinderGeometry(0.12, 0.18, 0.6, 10),
            new THREE.MeshToonMaterial({ color: 0xfffbeb })
          );
          stem.position.y = 0.3;
          mGroup.add(stem);
          const cap = new THREE.Mesh(
            new THREE.SphereGeometry(0.42, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2),
            new THREE.MeshToonMaterial({ color: capColor })
          );
          cap.position.y = 0.55;
          mGroup.add(cap);
          mGroup.position.set(x, -0.1, z);
          mGroup.scale.set(s, s, s);
          island.add(mGroup);
        }
        makeMushroom(-2.5, 3.5, 0xef4444, 1.1);
        makeMushroom(-3.1, 3.2, 0xf97316, 0.85);
        makeMushroom(2.8, 3.6, 0x38bdf8, 1.0);
        makeMushroom(3.4, 3.1, 0xa855f7, 0.8);
        makeMushroom(0.3, 4.2, 0xfacc15, 0.9);

        // Stars (validated: 15 deterministic, warm emissive)
        const stars: { mesh: any; speed: number; y: number }[] = [];
        const starGeo = new THREE.OctahedronGeometry(0.38, 0);
        const starMat = new THREE.MeshToonMaterial({ color: 0xfacc15, emissive: 0xfde047, emissiveIntensity: 0.6 });
        for (let i = 0; i < 15; i++) {
          const st = new THREE.Mesh(starGeo, starMat);
          const ang = (i / 15) * Math.PI * 2;
          const rad = 4.8 + (i % 3) * 2.2;
          st.position.set(Math.cos(ang) * rad, 1.5 + (i % 4) * 1.5, Math.sin(ang) * rad * 0.7);
          scene.add(st);
          stars.push({ mesh: st, speed: 1.2 + (i % 5) * 0.3, y: st.position.y });
        }

        // Juicy red counting apples for Teddy's math game (validated ANIMATION_45)
        const appleList: { group: any }[] = [];
        {
          const appleGroup = new THREE.Group();
          const appleMat = new THREE.MeshToonMaterial({ color: 0xef4444 });
          const leafMat = new THREE.MeshToonMaterial({ color: 0x22c55e });
          for (let i = 0; i < 5; i++) {
            const a = new THREE.Group();
            a.add(new THREE.Mesh(new THREE.SphereGeometry(0.28, 12, 12), appleMat));
            const stem = new THREE.Mesh(
              new THREE.CylinderGeometry(0.03, 0.03, 0.2, 6),
              new THREE.MeshBasicMaterial({ color: 0x78350f })
            );
            stem.position.set(0, 0.25, 0);
            stem.rotation.z = 0.2;
            a.add(stem);
            const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 6), leafMat);
            leaf.scale.set(1.5, 0.3, 0.8);
            leaf.position.set(0.1, 0.28, 0);
            a.add(leaf);
            a.position.set(-1.4 + i * 0.7, 0.1, 2.0 + Math.sin(i) * 0.4);
            appleGroup.add(a);
            appleList.push({ group: a });
          }
          island.add(appleGroup);
        }

        const dark = new THREE.MeshToonMaterial({ color: 0x1e293b });
        const white = new THREE.MeshToonMaterial({ color: 0xffffff });
        const pink = new THREE.MeshToonMaterial({ color: 0xf472b6 });

        // Teddy (center)
        const bear = new THREE.Group();
        const bearMat = new THREE.MeshToonMaterial({ color: 0xd97706 });
        const body = new THREE.Mesh(new THREE.SphereGeometry(1.2, 16, 16), bearMat);
        body.position.y = 1.2;
        bear.add(body);
        const head = new THREE.Mesh(new THREE.SphereGeometry(1.0, 16, 16), bearMat);
        head.position.set(0, 2.3, 0.2);
        bear.add(head);
        const armGeo = new THREE.CylinderGeometry(0.25, 0.3, 1.1, 10);
        const waveArm = new THREE.Mesh(armGeo, bearMat);
        waveArm.position.set(1.4, 1.6, 0.4);
        waveArm.rotation.z = -1.2;
        bear.add(waveArm);
        bear.position.set(0, -0.3, -0.5);
        scene.add(bear);

        // Puppy (left)
        const puppy = new THREE.Group();
        const pupMat = new THREE.MeshToonMaterial({ color: 0xfbbf24 });
        const pupBody = new THREE.Mesh(new THREE.SphereGeometry(1.0, 16, 16), pupMat);
        pupBody.position.y = 1.0;
        puppy.add(pupBody);
        const pupHead = new THREE.Mesh(new THREE.SphereGeometry(0.85, 16, 16), pupMat);
        pupHead.position.set(0, 1.8, 0.4);
        puppy.add(pupHead);
        const pupTail = new THREE.Mesh(
          new THREE.CylinderGeometry(0.08, 0.15, 0.8, 8),
          new THREE.MeshToonMaterial({ color: 0xd97706 })
        );
        pupTail.position.set(0, 1.3, -1.0);
        pupTail.rotation.x = -0.9;
        puppy.add(pupTail);
        puppy.position.set(-4.5, -0.2, 2.5);
        scene.add(puppy);

        // Bunny (right)
        const bunny = new THREE.Group();
        const bunBody = new THREE.Mesh(new THREE.SphereGeometry(0.85, 16, 16), white);
        bunBody.position.y = 0.9;
        bunny.add(bunBody);
        const bunHead = new THREE.Mesh(new THREE.SphereGeometry(0.75, 16, 16), white);
        bunHead.position.set(0, 1.8, 0.1);
        bunny.add(bunHead);
        const earGeo = new THREE.CylinderGeometry(0.15, 0.22, 1.4, 10);
        const earL = new THREE.Mesh(earGeo, white);
        earL.position.set(-0.35, 2.9, 0.1);
        const earR = new THREE.Mesh(earGeo, white);
        earR.position.set(0.35, 2.9, 0.1);
        bunny.add(earL, earR);
        const eyeGeo = new THREE.SphereGeometry(0.08, 8, 8);
        const eL = new THREE.Mesh(eyeGeo, dark);
        eL.position.set(-0.25, 1.9, 0.75);
        const eR = new THREE.Mesh(eyeGeo, dark);
        eR.position.set(0.25, 1.9, 0.75);
        const nose = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 8), pink);
        nose.position.set(0, 1.75, 0.82);
        bunny.add(eL, eR, nose);
        bunny.position.set(4.8, -0.2, 3.2);
        bunny.scale.set(0.85, 0.85, 0.85);
        scene.add(bunny);

        // Birds (validated: 4 birds, tighter wonder formation)
        const birds: any[] = [];
        const birdMat = new THREE.MeshToonMaterial({ color: 0x38bdf8 });
        const beakMat = new THREE.MeshToonMaterial({ color: 0xf59e0b });
        for (let b = 0; b < 4; b++) {
          const bird = new THREE.Group();
          const bb = new THREE.Mesh(new THREE.SphereGeometry(0.45, 12, 12), birdMat);
          bb.scale.set(1, 0.8, 1.4);
          bird.add(bb);
          const bh = new THREE.Mesh(new THREE.SphereGeometry(0.32, 10, 10), birdMat);
          bh.position.set(0, 0.25, 0.5);
          bird.add(bh);
          const beak = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.35, 8), beakMat);
          beak.position.set(0, 0.22, 0.85);
          beak.rotation.x = Math.PI / 2;
          bird.add(beak);
          const wingGeo = new THREE.BoxGeometry(0.85, 0.06, 0.48);
          const wL = new THREE.Mesh(wingGeo, birdMat);
          wL.position.set(-0.52, 0.08, 0);
          const wR = new THREE.Mesh(wingGeo, birdMat);
          wR.position.set(0.52, 0.08, 0);
          bird.add(wL, wR);
          bird.userData = {
            wingL: wL,
            wingR: wR,
            angle: (b / 4) * Math.PI * 2,
            radius: 7.2 + b * 2.0,
            speed: 0.85 + b * 0.15,
            height: 4.2 + b * 1.1,
          };
          scene.add(bird);
          birds.push(bird);
        }

        let mx = 0;
        let my = 0;
        let tx = 0;
        let ty = 0;
        let jumpBoost = 0;
        onMouse = (e: MouseEvent) => {
          mx = (e.clientX / window.innerWidth) * 2 - 1;
          my = -(e.clientY / window.innerHeight) * 2 + 1;
        };
        window.addEventListener("mousemove", onMouse);
        onTap = () => {
          jumpBoost = 1.0;
        };
        window.addEventListener("pointerdown", onTap);
        onResize = () => {
          const w = container.clientWidth || window.innerWidth;
          const hh = container.clientHeight || height;
          camera.aspect = w / hh;
          camera.updateProjectionMatrix();
          renderer.setSize(w, hh);
        };
        window.addEventListener("resize", onResize);

        const clock = new THREE.Clock();
        function renderFrame(t: number) {
          tx += (mx * 2.2 - tx) * 0.06;
          ty += (my * 1.2 - ty) * 0.06;
          camera.position.x = tx * 1.3;
          camera.position.y = 4.5 + ty * 0.9;
          camera.lookAt(0, 1.8, 0);
          jumpBoost *= 0.92;
          bear.position.y = -0.1 + Math.sin(t * 3.0) * 0.14 + jumpBoost * 0.6;
          head.rotation.y = Math.sin(t * 1.8) * 0.3;
          waveArm.rotation.z = -1.2 + Math.sin(t * 6.5) * 0.45;
          waveArm.rotation.x = Math.cos(t * 6.5) * 0.25;
          const hop = Math.abs(Math.sin(t * 4.4));
          puppy.position.y = 0.0 + hop * 0.9 + jumpBoost * 0.8;
          puppy.rotation.y = Math.sin(t * 2.2) * 0.4;
          pupTail.rotation.z = Math.sin(t * 18) * 0.8;
          const bhop = Math.abs(Math.sin(t * 5.0));
          bunny.position.y = 0.0 + bhop * 1.05 + jumpBoost * 0.9;
          bunny.rotation.y = -Math.sin(t * 2.2) * 0.4;
          birds.forEach((bd: any) => {
            bd.userData.angle += bd.userData.speed * 0.022;
            const r = bd.userData.radius;
            bd.position.x = Math.cos(bd.userData.angle) * r;
            bd.position.z = Math.sin(bd.userData.angle) * (r * 0.65) - 1.5;
            bd.position.y = bd.userData.height + Math.sin(t * 2.5 + bd.userData.angle) * 0.7;
            bd.rotation.y = -bd.userData.angle - Math.PI / 2;
            const flap = Math.sin(t * 20) * 0.7;
            bd.userData.wingL.rotation.z = flap;
            bd.userData.wingR.rotation.z = -flap;
          });
          stars.forEach((s, idx) => {
            s.mesh.position.y = s.y + Math.sin(t * s.speed + idx) * 0.45;
            s.mesh.rotation.y += 0.025;
            s.mesh.rotation.x += 0.018;
          });
          clouds.forEach((c: any, idx: number) => {
            c.position.x += Math.sin(t * 0.35 + idx) * 0.008;
          });
          appleList.forEach((ap, idx) => {
            ap.group.position.y = 0.1 + Math.sin(t * 3.0 + idx) * 0.06;
            ap.group.rotation.y += 0.015;
          });
          renderer.render(scene, camera);
        }

        if (reduced) {
          renderFrame(1.2);
        } else {
          function animate() {
            if (cancelled) return;
            raf = requestAnimationFrame(animate);
            renderFrame(clock.getElapsedTime());
          }
          animate();
        }
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });

    return () => {
      cancelled = true;
      if (raf) cancelAnimationFrame(raf);
      if (onMouse) window.removeEventListener("mousemove", onMouse);
      if (onTap) window.removeEventListener("pointerdown", onTap);
      if (onResize) window.removeEventListener("resize", onResize);
      try {
        if (renderer) {
          renderer.dispose?.();
          const el = renderer.domElement as HTMLCanvasElement | undefined;
          el?.parentElement?.removeChild(el);
        }
        mountEl?.replaceChildren();
      } catch {
        /* silent */
      }
    };
  }, [height]);

  if (failed) {
    return (
      <div
        aria-label="Animal Wonderland preview"
        className="flex w-full items-center justify-center gap-4 bg-gradient-to-b from-sky-100 via-sky-50 to-emerald-50 text-5xl"
        style={{ height }}
      >
        <span aria-hidden>🐶</span>
        <span aria-hidden>🧸</span>
        <span aria-hidden>🐰</span>
        <span aria-hidden>🐦</span>
      </div>
    );
  }

  return (
    <div className="relative w-full overflow-hidden bg-gradient-to-b from-sky-100 via-sky-50 to-emerald-50">
      <div ref={mountRef} style={{ width: "100%", height }} aria-hidden />
    </div>
  );
}

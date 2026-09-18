"use client";

import * as React from "react";

// Living Wonder Worlds Archipelago — ported from Stitch:
//   a1812dc1e5cb413aa73ef5541f70cf81 + 9fa2f565ae734cef81de7b2011059cf3 (ANIMATION_48)
//   Rich Full-Screen 3D Living Wonder Worlds Interactive Selector Scene
//   Master World Floating Archipelago with 3 biome islands, rainbow, 20 stars
// Fitted to Learnzzy Next.js conventions:
// - lazy-loads three r125 from CDN only on client
// - honors prefers-reduced-motion (static frame, no loop)
// - cleans up renderer + listeners on unmount
// - fixed full-screen background variant for Play page

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

export function WonderArchipelago3D({ height }: { height?: number }) {
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
        const h = (height ?? container.clientHeight) || window.innerHeight;
        const scene = new THREE.Scene();
        scene.fog = new THREE.FogExp2(0xf0f7ff, 0.018);
        const camera = new THREE.PerspectiveCamera(45, width / h, 0.1, 1000);
        camera.position.set(0, 5, 22);
        renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        renderer.setSize(width, h);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        container.innerHTML = "";
        container.appendChild(renderer.domElement);

        scene.add(new THREE.AmbientLight(0xffffff, 1.25));
        const sunLight = new THREE.DirectionalLight(0xfff5ea, 1.6);
        sunLight.position.set(15, 26, 18);
        sunLight.castShadow = true;
        sunLight.shadow.mapSize.width = 1024;
        sunLight.shadow.mapSize.height = 1024;
        scene.add(sunLight);
        const skyLight = new THREE.DirectionalLight(0xbae6fd, 0.85);
        skyLight.position.set(-15, 14, -12);
        scene.add(skyLight);
        const softWarmPoint = new THREE.PointLight(0xfed7aa, 1.1, 35);
        softWarmPoint.position.set(0, 3, 10);
        scene.add(softWarmPoint);

        const mainIsland = new THREE.Group();
        scene.add(mainIsland);
        const grassMat = new THREE.MeshToonMaterial({ color: 0x86efac });
        const centerMound = new THREE.Mesh(new THREE.CylinderGeometry(10.5, 8.2, 2.5, 36), grassMat);
        centerMound.position.y = -1.2;
        centerMound.receiveShadow = true;
        mainIsland.add(centerMound);
        const biscuitMat = new THREE.MeshToonMaterial({ color: 0xfef08a });
        const biscuit = new THREE.Mesh(new THREE.CylinderGeometry(8.2, 6.0, 1.6, 36), biscuitMat);
        biscuit.position.y = -2.8;
        mainIsland.add(biscuit);
        const floatRockMat = new THREE.MeshToonMaterial({ color: 0x93c5fd });
        const floatRock = new THREE.Mesh(new THREE.ConeGeometry(5.8, 3.8, 32), floatRockMat);
        floatRock.position.y = -5.0;
        floatRock.rotation.x = Math.PI;
        mainIsland.add(floatRock);

        const islandOrchard = new THREE.Group();
        const m1 = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 2.2, 1.4, 24), new THREE.MeshToonMaterial({ color: 0xfca5a5 }));
        m1.position.y = -0.7;
        islandOrchard.add(m1);
        const treeTrunk = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.35, 1.2, 12), new THREE.MeshToonMaterial({ color: 0x78350f }));
        treeTrunk.position.y = 0.6;
        islandOrchard.add(treeTrunk);
        const treeFoliage = new THREE.Mesh(new THREE.SphereGeometry(1.1, 14, 14), new THREE.MeshToonMaterial({ color: 0x22c55e }));
        treeFoliage.position.y = 1.6;
        islandOrchard.add(treeFoliage);
        islandOrchard.position.set(-9.5, 1.5, -2);
        scene.add(islandOrchard);

        const islandStar = new THREE.Group();
        const m2 = new THREE.Mesh(new THREE.CylinderGeometry(3.4, 2.4, 1.4, 24), new THREE.MeshToonMaterial({ color: 0xc4b5fd }));
        m2.position.y = -0.7;
        islandStar.add(m2);
        const crystalMat = new THREE.MeshToonMaterial({ color: 0x67e8f9, emissive: 0x0891b2, emissiveIntensity: 0.5 });
        const crystal = new THREE.Mesh(new THREE.OctahedronGeometry(0.85, 0), crystalMat);
        crystal.position.y = 1.0;
        islandStar.add(crystal);
        islandStar.position.set(9.5, 1.8, -1.5);
        scene.add(islandStar);

        const islandDino = new THREE.Group();
        const m3 = new THREE.Mesh(new THREE.CylinderGeometry(3.6, 2.5, 1.4, 24), new THREE.MeshToonMaterial({ color: 0x86efac }));
        m3.position.y = -0.7;
        islandDino.add(m3);
        islandDino.position.set(0, 3.2, -10);
        scene.add(islandDino);

        const rainbow = new THREE.Group();
        [0xf87171, 0xfbbf24, 0x34d399, 0x38bdf8, 0xa855f7].forEach((color, i) => {
          const ring = new THREE.Mesh(
            new THREE.TorusGeometry(14.5 + i * 0.48, 0.22, 14, 50, Math.PI),
            new THREE.MeshBasicMaterial({ color })
          );
          rainbow.add(ring);
        });
        rainbow.position.set(0, -0.6, -7.5);
        rainbow.rotation.y = 0.08;
        scene.add(rainbow);

        const cloudMat = new THREE.MeshToonMaterial({ color: 0xffffff });
        const clouds: any[] = [];
        function makeCloud(x: number, y: number, z: number, s: number) {
          const g = new THREE.Group();
          const p1 = new THREE.Mesh(new THREE.SphereGeometry(1.4, 16, 16), cloudMat);
          const p2 = new THREE.Mesh(new THREE.SphereGeometry(1.0, 14, 14), cloudMat);
          p2.position.set(1.3, -0.2, 0.1);
          const p3 = new THREE.Mesh(new THREE.SphereGeometry(0.95, 14, 14), cloudMat);
          p3.position.set(-1.2, -0.2, 0.1);
          const p4 = new THREE.Mesh(new THREE.SphereGeometry(1.05, 14, 14), cloudMat);
          p4.position.set(0.35, 0.7, 0.15);
          g.add(p1, p2, p3, p4);
          g.position.set(x, y, z);
          g.scale.set(s, s, s);
          scene.add(g);
          clouds.push(g);
        }
        makeCloud(-14, 8.5, -6, 1.4);
        makeCloud(14, 9.2, -7, 1.5);
        makeCloud(-2, 10.5, -12, 2.0);
        makeCloud(9, 5.2, -4, 1.1);
        makeCloud(-9, 4.0, -3, 0.9);

        const starMat = new THREE.MeshToonMaterial({ color: 0xfacc15, emissive: 0xfde047, emissiveIntensity: 0.7 });
        const stars: { mesh: any; initY: number; speed: number }[] = [];
        for (let i = 0; i < 20; i++) {
          const st = new THREE.Mesh(new THREE.OctahedronGeometry(0.38, 0), starMat);
          const angle = (i / 20) * Math.PI * 2;
          const rad = 5.5 + (i % 4) * 2.4;
          st.position.set(Math.cos(angle) * rad, 1.8 + (i % 5) * 1.6, Math.sin(angle) * rad * 0.75);
          scene.add(st);
          stars.push({ mesh: st, initY: st.position.y, speed: 1.1 + (i % 5) * 0.35 });
        }

        const bearMat = new THREE.MeshToonMaterial({ color: 0xd97706 });
        const bearMuzzleMat = new THREE.MeshToonMaterial({ color: 0xfef3c7 });
        const darkMat = new THREE.MeshToonMaterial({ color: 0x1e293b });
        const redBowMat = new THREE.MeshToonMaterial({ color: 0xef4444 });
        const whiteMat = new THREE.MeshToonMaterial({ color: 0xffffff });
        const teddy = new THREE.Group();
        const tBody = new THREE.Mesh(new THREE.SphereGeometry(1.4, 18, 18), bearMat);
        tBody.position.y = 1.35;
        teddy.add(tBody);
        const tHead = new THREE.Mesh(new THREE.SphereGeometry(1.15, 18, 18), bearMat);
        tHead.position.set(0, 2.7, 0.2);
        teddy.add(tHead);
        const tSnout = new THREE.Mesh(new THREE.SphereGeometry(0.45, 14, 14), bearMuzzleMat);
        tSnout.position.set(0, 2.5, 1.2);
        teddy.add(tSnout);
        const tNose = new THREE.Mesh(new THREE.SphereGeometry(0.14, 10, 10), darkMat);
        tNose.position.set(0, 2.65, 1.6);
        teddy.add(tNose);
        const tEyeL = new THREE.Mesh(new THREE.SphereGeometry(0.11, 10, 10), darkMat);
        tEyeL.position.set(-0.36, 2.85, 1.2);
        const tEyeR = new THREE.Mesh(new THREE.SphereGeometry(0.11, 10, 10), darkMat);
        tEyeR.position.set(0.36, 2.85, 1.2);
        teddy.add(tEyeL, tEyeR);
        const tEarGeo = new THREE.SphereGeometry(0.42, 12, 12);
        const tEarL = new THREE.Mesh(tEarGeo, bearMat);
        tEarL.position.set(-0.95, 3.65, 0.2);
        const tEarR = new THREE.Mesh(tEarGeo, bearMat);
        tEarR.position.set(0.95, 3.65, 0.2);
        teddy.add(tEarL, tEarR);
        const bowMesh = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.12, 8, 16), redBowMat);
        bowMesh.position.set(0, 1.95, 1.35);
        teddy.add(bowMesh);
        const armGeo = new THREE.CylinderGeometry(0.25, 0.35, 1.3, 12);
        const tArmR = new THREE.Mesh(armGeo, bearMat);
        tArmR.position.set(1.5, 1.9, 0.35);
        tArmR.rotation.z = -1.4;
        teddy.add(tArmR);
        const tArmL = new THREE.Mesh(armGeo, bearMat);
        tArmL.position.set(-1.5, 1.9, 0.35);
        tArmL.rotation.z = 1.4;
        teddy.add(tArmL);
        teddy.position.set(0, 0.0, 0.4);
        mainIsland.add(teddy);

        const puppy = new THREE.Group();
        const pupMat = new THREE.MeshToonMaterial({ color: 0xfbbf24 });
        const earMat = new THREE.MeshToonMaterial({ color: 0xd97706 });
        const pBody = new THREE.Mesh(new THREE.SphereGeometry(0.95, 16, 16), pupMat);
        pBody.position.y = 0.95;
        puppy.add(pBody);
        const pHead = new THREE.Mesh(new THREE.SphereGeometry(0.85, 16, 16), pupMat);
        pHead.position.set(0, 1.8, 0.4);
        puppy.add(pHead);
        const pSnout = new THREE.Mesh(new THREE.SphereGeometry(0.4, 12, 12), whiteMat);
        pSnout.position.set(0, 1.65, 1.05);
        puppy.add(pSnout);
        const pNose = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), darkMat);
        pNose.position.set(0, 1.8, 1.4);
        puppy.add(pNose);
        const pEyeL = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 8), darkMat);
        pEyeL.position.set(-0.3, 1.95, 1.15);
        const pEyeR = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 8), darkMat);
        pEyeR.position.set(0.3, 1.95, 1.15);
        puppy.add(pEyeL, pEyeR);
        const pEarGeo = new THREE.CylinderGeometry(0.16, 0.34, 1.1, 10);
        const pEarL = new THREE.Mesh(pEarGeo, earMat);
        pEarL.position.set(-0.75, 2.0, 0.35);
        pEarL.rotation.z = 0.65;
        const pEarR = new THREE.Mesh(pEarGeo, earMat);
        pEarR.position.set(0.75, 2.0, 0.35);
        pEarR.rotation.z = -0.65;
        puppy.add(pEarL, pEarR);
        const pTail = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.16, 0.8, 8), earMat);
        pTail.position.set(0, 1.15, -0.95);
        pTail.rotation.x = -0.95;
        puppy.add(pTail);
        const bandana = new THREE.Mesh(new THREE.TorusGeometry(0.68, 0.15, 8, 20), new THREE.MeshToonMaterial({ color: 0x06b6d4 }));
        bandana.position.set(0, 1.45, 0.3);
        bandana.rotation.x = Math.PI / 2.3;
        puppy.add(bandana);
        puppy.position.set(-4.2, 0.1, 2.6);
        mainIsland.add(puppy);

        const bunny = new THREE.Group();
        const pinkMat = new THREE.MeshToonMaterial({ color: 0xf472b6 });
        const bBody = new THREE.Mesh(new THREE.SphereGeometry(0.85, 16, 16), whiteMat);
        bBody.position.y = 0.9;
        bunny.add(bBody);
        const bHead = new THREE.Mesh(new THREE.SphereGeometry(0.76, 16, 16), whiteMat);
        bHead.position.set(0, 1.8, 0.12);
        bunny.add(bHead);
        const bEarGeo = new THREE.CylinderGeometry(0.14, 0.22, 1.4, 10);
        const bEarL = new THREE.Mesh(bEarGeo, whiteMat);
        bEarL.position.set(-0.32, 2.9, 0.12);
        bEarL.rotation.z = -0.15;
        const bEarR = new THREE.Mesh(bEarGeo, whiteMat);
        bEarR.position.set(0.32, 2.9, 0.12);
        bEarR.rotation.z = 0.15;
        bunny.add(bEarL, bEarR);
        const bEyeL = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 8), darkMat);
        bEyeL.position.set(-0.24, 1.9, 0.76);
        const bEyeR = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 8), darkMat);
        bEyeR.position.set(0.24, 1.9, 0.76);
        const bNose = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), pinkMat);
        bNose.position.set(0, 1.75, 0.84);
        bunny.add(bEyeL, bEyeR, bNose);
        bunny.position.set(4.2, 0.1, 2.8);
        mainIsland.add(bunny);

        const birds: any[] = [];
        const birdMat = new THREE.MeshToonMaterial({ color: 0x38bdf8 });
        for (let i = 0; i < 4; i++) {
          const bird = new THREE.Group();
          const bBodyM = new THREE.Mesh(new THREE.SphereGeometry(0.38, 10, 10), birdMat);
          bBodyM.scale.set(1, 0.75, 1.3);
          bird.add(bBodyM);
          const head = new THREE.Mesh(new THREE.SphereGeometry(0.26, 8, 8), birdMat);
          head.position.set(0, 0.22, 0.45);
          bird.add(head);
          const beak = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.28, 6), new THREE.MeshToonMaterial({ color: 0xf59e0b }));
          beak.position.set(0, 0.2, 0.75);
          beak.rotation.x = Math.PI / 2;
          bird.add(beak);
          const wingGeo = new THREE.BoxGeometry(0.8, 0.05, 0.45);
          const wL = new THREE.Mesh(wingGeo, birdMat);
          wL.position.set(-0.48, 0.08, 0);
          const wR = new THREE.Mesh(wingGeo, birdMat);
          wR.position.set(0.48, 0.08, 0);
          bird.add(wL, wR);
          bird.userData = { wL, wR, angle: (i / 4) * Math.PI * 2, rad: 8.5 + i * 2.2, spd: 0.9 + i * 0.15, yBase: 5.5 + i * 1.2 };
          scene.add(bird);
          birds.push(bird);
        }

        let mouseX = 0, mouseY = 0, tgtX = 0, tgtY = 0, jumpBoost = 0;
        onMouse = (e: MouseEvent) => {
          mouseX = (e.clientX / window.innerWidth) * 2 - 1;
          mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
        };
        window.addEventListener("mousemove", onMouse);
        onTap = () => { jumpBoost = 1.0; };
        window.addEventListener("pointerdown", onTap);
        // Companion event hook (Stitch buddy-btn → 3D jump)
        const onCompanion = (e: Event) => { jumpBoost = 1.0; };
        window.addEventListener("wonder:companion:trigger" as any, onCompanion);
        onResize = () => {
          const w = container.clientWidth || window.innerWidth;
          const hh = (height ?? container.clientHeight) || window.innerHeight;
          camera.aspect = w / hh;
          camera.updateProjectionMatrix();
          renderer.setSize(w, hh);
        };
        window.addEventListener("resize", onResize);
        const clock = new THREE.Clock();
        function renderFrame(t: number) {
          tgtX += (mouseX * 2.8 - tgtX) * 0.05;
          tgtY += (mouseY * 1.5 - tgtY) * 0.05;
          camera.position.x = tgtX * 1.4;
          camera.position.y = 5.0 + tgtY * 0.9;
          camera.lookAt(0, 1.8, 0);
          jumpBoost *= 0.92;
          mainIsland.position.y = Math.sin(t * 1.2) * 0.15;
          islandOrchard.position.y = 1.5 + Math.sin(t * 1.5 + 1) * 0.25;
          islandStar.position.y = 1.8 + Math.sin(t * 1.4 + 2) * 0.25;
          islandDino.position.y = 3.2 + Math.sin(t * 1.1 + 3) * 0.2;
          crystal.rotation.y += 0.03;
          crystal.rotation.x += 0.015;
          teddy.position.y = 0.0 + Math.sin(t * 3.0) * 0.12 + jumpBoost * 0.6;
          tHead.rotation.y = Math.sin(t * 1.8) * 0.25;
          tArmR.rotation.z = -1.4 + Math.sin(t * 6.5) * 0.45;
          tArmR.rotation.x = Math.cos(t * 6.5) * 0.25;
          tArmL.rotation.z = 1.4 - Math.sin(t * 6.5 + 0.5) * 0.45;
          tArmL.rotation.x = Math.cos(t * 6.5 + 0.5) * 0.25;
          const pupHop = Math.abs(Math.sin(t * 4.5));
          puppy.position.y = 0.1 + pupHop * 0.85 + jumpBoost * 0.8;
          pTail.rotation.z = Math.sin(t * 18) * 0.8;
          pEarL.rotation.z = 0.65 + Math.sin(t * 9) * 0.22;
          pEarR.rotation.z = -0.65 - Math.sin(t * 9) * 0.22;
          puppy.rotation.y = Math.sin(t * 2.2) * 0.35;
          const bunHop = Math.abs(Math.sin(t * 5.2));
          bunny.position.y = 0.1 + bunHop * 1.0 + jumpBoost * 0.9;
          bEarL.rotation.x = Math.sin(t * 5.5) * 0.3;
          bEarR.rotation.x = Math.sin(t * 5.5 + 0.3) * 0.3;
          bunny.rotation.y = -Math.sin(t * 2.2) * 0.35;
          birds.forEach((b: any) => {
            b.userData.angle += b.userData.spd * 0.02;
            const r = b.userData.rad;
            b.position.x = Math.cos(b.userData.angle) * r;
            b.position.z = Math.sin(b.userData.angle) * (r * 0.7) - 2.0;
            b.position.y = b.userData.yBase + Math.sin(t * 2.5 + b.userData.angle) * 0.7;
            b.rotation.y = -b.userData.angle - Math.PI / 2;
            const flap = Math.sin(t * 22) * 0.7;
            b.userData.wL.rotation.z = flap;
            b.userData.wR.rotation.z = -flap;
          });
          stars.forEach((s: any, idx: number) => {
            s.mesh.position.y = s.initY + Math.sin(t * s.speed + idx) * 0.45;
            s.mesh.rotation.y += 0.025;
            s.mesh.rotation.x += 0.02;
          });
          clouds.forEach((c: any, idx: number) => {
            c.position.x += Math.sin(t * 0.35 + idx) * 0.008;
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
        // store companion remover for cleanup
        (onTap as any)._companion = onCompanion;
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });

    return () => {
      cancelled = true;
      if (raf) cancelAnimationFrame(raf);
      if (onMouse) window.removeEventListener("mousemove", onMouse);
      if (onTap) {
        window.removeEventListener("pointerdown", onTap);
        const comp = (onTap as any)._companion;
        if (comp) window.removeEventListener("wonder:companion:trigger" as any, comp);
      }
      if (onResize) window.removeEventListener("resize", onResize);
      try {
        if (renderer) {
          renderer.dispose?.();
          const el = renderer.domElement as HTMLCanvasElement | undefined;
          el?.parentElement?.removeChild(el);
        }
        mountEl?.replaceChildren();
      } catch {}
    };
  }, [height]);

  if (failed) {
    return (
      <div aria-label="Wonder archipelago preview" className="flex h-full w-full items-center justify-center gap-4 bg-gradient-to-b from-sky-100 via-sky-50 to-emerald-50 text-5xl">
        <span aria-hidden>🏝️</span><span aria-hidden>🌈</span><span aria-hidden>🧸</span>
      </div>
    );
  }
  return <div ref={mountRef} style={{ width: "100%", height: height ?? "100%" }} aria-hidden className="h-full w-full" />;
}

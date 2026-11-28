/* Home-page space hero. Plain JS (no React). Three.js loads from the CDN via the importmap in index.html.
   If anything fails (no WebGL, offline CDN, reduced motion) the hero falls back to a still dark screen. */
(() => {
  const root = document.getElementById("space");
  if (!root) return;
  const pin = root.querySelector(".space-pin"), canvas = root.querySelector("canvas");
  const title = root.querySelector(".space-title");
  const slides = [...root.querySelectorAll(".space-slide")];
  const bar = root.querySelector(".space-bar i"), count = root.querySelector(".space-count");
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const small = innerWidth < 720 || matchMedia("(pointer: coarse)").matches;

  /* split the title into letters; "Duniya" gets the accent colour */
  const word = title.textContent.trim();
  title.textContent = ""; title.setAttribute("aria-label", word);
  [...word].forEach((ch, i) => {
    const s = document.createElement("span");
    s.className = "tc" + (i >= word.length - 6 ? " d" : ""); s.textContent = ch;
    s.setAttribute("aria-hidden", "true"); s.style.setProperty("--i", i); title.appendChild(s);
  });
  requestAnimationFrame(() => requestAnimationFrame(() => root.classList.add("in")));

  if (reduce) { root.classList.add("static"); return; }

  /* scroll progress 0..1 through the runway */
  let progress = 0, step = -1;
  const onScroll = () => {
    const max = root.offsetHeight - pin.offsetHeight;
    const top = root.getBoundingClientRect().top - parseFloat(getComputedStyle(pin).top || 0);
    progress = Math.min(Math.max(max > 0 ? -top / max : 0, 0), 1);
    const n = progress < 0.34 ? 0 : progress < 0.7 ? 1 : 2;
    if (n !== step) {
      step = n; root.dataset.step = n;
      slides.forEach((s, i) => s.classList.toggle("on", i === n));
      count.textContent = "0" + (n + 1) + " / 03";
    }
    bar.style.width = progress * 100 + "%";
  };
  addEventListener("scroll", onScroll, { passive: true }); addEventListener("resize", onScroll); onScroll();

  const fail = (e) => { console.warn("[StartupDuniya] hero fallback:", e && e.message || e); root.classList.add("static"); };
  try { const t = document.createElement("canvas"); if (!(t.getContext("webgl2") || t.getContext("webgl"))) return fail("no WebGL"); } catch (e) { return fail(e); }

  (async () => {
    const THREE = await import("three");
    let composer = null;
    if (!small) {
      const [{ EffectComposer }, { RenderPass }, { UnrealBloomPass }] = await Promise.all([
        import("three/addons/postprocessing/EffectComposer.js"),
        import("three/addons/postprocessing/RenderPass.js"),
        import("three/addons/postprocessing/UnrealBloomPass.js")]);
      composer = { EffectComposer, RenderPass, UnrealBloomPass };
    }
    const W = () => pin.clientWidth, H = () => pin.clientHeight;
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000000, 0.00025);
    const camera = new THREE.PerspectiveCamera(75, W() / H(), 0.1, 2000);
    camera.position.set(0, 30, 300);
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: !small, alpha: false });
    renderer.setClearColor(0x0b0d1c, 1);   /* opaque canvas: a see-through one can white-out under bright additive glow */
    renderer.setSize(W(), H(), false);
    renderer.setPixelRatio(Math.min(devicePixelRatio, small ? 1.5 : 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 0.55;
    let comp = null;
    if (composer) {
      comp = new composer.EffectComposer(renderer);
      comp.addPass(new composer.RenderPass(scene, camera));
      comp.addPass(new composer.UnrealBloomPass(new THREE.Vector2(W(), H()), 0.55, 0.4, 0.88));
    }

    /* stars: three shells that rotate slowly at different speeds */
    const stars = [], N = small ? 1400 : 4000;
    for (let i = 0; i < 3; i++) {
      const g = new THREE.BufferGeometry(), pos = new Float32Array(N * 3), col = new Float32Array(N * 3), size = new Float32Array(N), c = new THREE.Color();
      for (let j = 0; j < N; j++) {
        const r = 200 + Math.random() * 800, th = Math.random() * Math.PI * 2, ph = Math.acos(Math.random() * 2 - 1);
        pos.set([r * Math.sin(ph) * Math.cos(th), r * Math.sin(ph) * Math.sin(th), r * Math.cos(ph)], j * 3);
        const k = Math.random();
        if (k < 0.7) c.setHSL(0, 0, 0.8 + Math.random() * 0.2); else if (k < 0.9) c.setHSL(0.08, 0.7, 0.75); else c.setHSL(0.72, 0.5, 0.8);
        col.set([c.r, c.g, c.b], j * 3); size[j] = Math.random() * 2 + 0.5;
      }
      g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
      g.setAttribute("color", new THREE.BufferAttribute(col, 3));
      g.setAttribute("size", new THREE.BufferAttribute(size, 1));
      const m = new THREE.ShaderMaterial({
        uniforms: { time: { value: 0 }, depth: { value: i } },
        vertexShader: `attribute float size; attribute vec3 color; varying vec3 vColor; uniform float time; uniform float depth;
          void main(){ vColor=color; vec3 p=position; float a=time*0.05*(1.0-depth*0.3);
            mat2 r=mat2(cos(a),-sin(a),sin(a),cos(a)); p.xy=r*p.xy;
            vec4 mv=modelViewMatrix*vec4(p,1.0); gl_PointSize=clamp(size*(300.0/-mv.z),0.0,12.0); gl_Position=projectionMatrix*mv; }`,
        fragmentShader: `varying vec3 vColor; void main(){ float d=length(gl_PointCoord-vec2(0.5)); if(d>0.5) discard;
          gl_FragColor=vec4(vColor,1.0-smoothstep(0.0,0.5,d)); }`,
        transparent: true, blending: THREE.AdditiveBlending, depthWrite: false });
      const p = new THREE.Points(g, m); scene.add(p); stars.push(p);
    }

    /* nebula: orange to violet, the logo colour into the site's violet */
    const nebula = new THREE.Mesh(new THREE.PlaneGeometry(8000, 4000, small ? 40 : 100, small ? 40 : 100), new THREE.ShaderMaterial({
      uniforms: { time: { value: 0 }, color1: { value: new THREE.Color(0xff6b1a) }, color2: { value: new THREE.Color(0x7c4dff) }, opacity: { value: 0.3 } },
      vertexShader: `varying vec2 vUv; varying float vE; uniform float time;
        void main(){ vUv=uv; vec3 p=position; float e=sin(p.x*0.01+time)*cos(p.y*0.01+time)*20.0; p.z+=e; vE=e;
          gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.0); }`,
      fragmentShader: `uniform vec3 color1; uniform vec3 color2; uniform float opacity; uniform float time; varying vec2 vUv; varying float vE;
        void main(){ float f=sin(vUv.x*10.0+time)*cos(vUv.y*10.0+time); vec3 c=mix(color1,color2,f*0.5+0.5);
          float a=opacity*(1.0-length(vUv-0.5)*2.0); a*=1.0+vE*0.01; gl_FragColor=vec4(c,max(a,0.0)); }`,
      transparent: true, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, depthWrite: false }));
    nebula.position.z = -1050; scene.add(nebula);

    /* mountain ridges (flat shapes that fade out as the camera passes) */
    const mountains = [[-50, 60, 0x1a1a2e, 1], [-100, 80, 0x16213e, 0.8], [-150, 100, 0x2a1f3d, 0.6], [-200, 120, 0x3a2236, 0.4]].map(([z, h, color, o], idx) => {
      const pts = [];
      for (let i = 0; i <= 50; i++) pts.push(new THREE.Vector2((i / 50 - 0.5) * 1000, Math.sin(i * 0.1) * h + Math.sin(i * 0.05) * h * 0.5 + Math.random() * h * 0.2 - 100));
      pts.push(new THREE.Vector2(5000, -300), new THREE.Vector2(-5000, -300));
      const m = new THREE.Mesh(new THREE.ShapeGeometry(new THREE.Shape(pts)), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: o, side: THREE.DoubleSide }));
      m.position.z = z; m.userData = { o, idx }; scene.add(m); return m;
    });

    /* warm rim glow around the scene */
    scene.add(new THREE.Mesh(new THREE.SphereGeometry(600, 32, 32), new THREE.ShaderMaterial({
      uniforms: { time: { value: 0 } },
      vertexShader: `varying vec3 vN; void main(){ vN=normalize(normalMatrix*normal); gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
      fragmentShader: `varying vec3 vN; uniform float time; void main(){ float i=pow(0.7-dot(vN,vec3(0.0,0.0,1.0)),2.0);
        vec3 a=vec3(1.0,0.5,0.25)*i*(sin(time*2.0)*0.1+0.9); gl_FragColor=vec4(a,i*0.25); }`,
      side: THREE.BackSide, blending: THREE.AdditiveBlending, transparent: true })));

    const camA = { x: 0, y: 30, z: 300 }, camB = { x: 0, y: 50, z: -420 }, cur = { ...camA };
    const resize = () => {
      camera.aspect = W() / H(); camera.updateProjectionMatrix();
      renderer.setSize(W(), H(), false); if (comp) comp.setSize(W(), H());
    };
    new ResizeObserver(resize).observe(pin);

    let visible = true, raf = 0;
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible && !raf) loop(); }).observe(root);
    const loop = () => {
      if (!visible || document.hidden) { raf = 0; return; }
      raf = requestAnimationFrame(loop);
      const t = performance.now() * 0.001;
      stars.forEach((s) => (s.material.uniforms.time.value = t));
      nebula.material.uniforms.time.value = t * 0.5;
      const e = progress * progress * (3 - 2 * progress);           // ease
      for (const k of ["x", "y", "z"]) cur[k] += (camA[k] + (camB[k] - camA[k]) * e - cur[k]) * 0.06;
      camera.position.set(cur.x + Math.sin(t * 0.1) * 2, cur.y + Math.cos(t * 0.15), cur.z);
      camera.lookAt(0, 10, -600);
      const fade = 1 - Math.min(Math.max((progress - 0.55) / 0.2, 0), 1);
      mountains.forEach((m, i) => {
        m.position.x = Math.sin(t * 0.1) * 2 * (1 + i * 0.5);
        m.position.y = 50 + Math.cos(t * 0.15) * (1 + i * 0.5);
        m.material.opacity = m.userData.o * fade; m.visible = fade > 0.01;
      });
      comp ? comp.render() : renderer.render(scene, camera);
    };
    document.addEventListener("visibilitychange", () => { if (!document.hidden && !raf) loop(); });
    loop();
  })().catch(fail);
})();

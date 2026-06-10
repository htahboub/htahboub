(function () {
  "use strict";

  var root = document.querySelector("[data-distort-background]");
  if (!root) return;

  var canvas = root.querySelector("canvas");
  var fallback = root.querySelector("img");
  var navbar = document.querySelector(".navbar");
  var src = root.getAttribute("data-bg-src");
  var sensitivityValue = parseFloat(root.getAttribute("data-sensitivity"));
  var sensitivity = Number.isFinite(sensitivityValue) ? Math.max(0, sensitivityValue) : 1;
  if (!canvas || !src) return;

  var fragmentShader = [
    "precision highp float;",
    "uniform float t;",
    "uniform vec2 r,imgSize,vel;",
    "uniform sampler2D tex;",
    "uniform float bands[12];",
    "uniform vec3 tint;",
    "uniform float tintStrength;",
    "varying vec2 vUv;",
    "float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}",
    "vec2 coverUV(vec2 uv){",
    "  float canvasAspect=r.x/r.y;",
    "  float imgAspect=imgSize.x/imgSize.y;",
    "  vec2 scale=canvasAspect>imgAspect?vec2(1.0,imgAspect/canvasAspect):vec2(canvasAspect/imgAspect,1.0);",
    "  return(uv-0.5)*scale+0.5;",
    "}",
    "void main(){",
    "  vec2 uv=coverUV(vUv);",
    "  float scanY=floor(vUv.y*r.y);",
    "  float bandF=vUv.y*12.0;",
    "  int bandIdx=int(floor(bandF));",
    "  float bandFrac=fract(bandF);",
    "  float strength=0.0;",
    "  for(int i=0;i<12;i++){if(i==bandIdx) strength=bands[i];}",
    "  float neighborStr=0.0;",
    "  int neighborIdx=bandFrac>.5?bandIdx+1:bandIdx-1;",
    "  for(int i=0;i<12;i++){if(i==neighborIdx) neighborStr=bands[i];}",
    "  float edgeBlend=abs(bandFrac-.5)*2.0;",
    "  edgeBlend*=edgeBlend;",
    "  strength=mix(strength,neighborStr,edgeBlend*.3);",
    "  float speed=length(vel);",
    "  float dirBlend=smoothstep(0.0,0.02,speed);",
    "  vec2 dir=speed>.0001?vel/speed:vec2(0);",
    "  dir*=dirBlend;",
    "  float rowSeed=h(vec2(scanY,floor(t*3.)+float(bandIdx)*7.));",
    "  float rowVar=mix(.4,1.0,rowSeed);",
    "  float ySmooth=vUv.y*6.0+t*0.7;",
    "  float yNoise=mix(h(vec2(floor(ySmooth),13.)),h(vec2(floor(ySmooth)+1.0,13.)),smoothstep(0.0,1.0,fract(ySmooth)));",
    "  float colVar=mix(.4,1.0,yNoise);",
    "  float tearShiftX=dir.x*strength*rowVar*0.15;",
    "  float tearShiftY=dir.y*strength*colVar*0.10;",
    "  float bandSeed=h(vec2(float(bandIdx),42.));",
    "  tearShiftX+=strength*(.5-bandSeed)*0.05;",
    "  float yJitter=mix(h(vec2(floor(ySmooth),73.)),h(vec2(floor(ySmooth)+1.0,73.)),smoothstep(0.0,1.0,fract(ySmooth)));",
    "  tearShiftY+=strength*(.5-yJitter)*0.035;",
    "  uv.x+=tearShiftX;",
    "  uv.y+=tearShiftY;",
    "  float sortGate=step(.5,strength)*step(.4,rowSeed);",
    "  uv.x+=dir.x*sortGate*strength*0.03;",
    "  uv.y+=dir.y*sortGate*strength*0.02;",
    "  float caX=abs(tearShiftX)*2.5+sortGate*strength*0.01;",
    "  float caY=abs(tearShiftY)*2.5+sortGate*strength*0.01;",
    "  float cr=texture2D(tex,vec2(uv.x+caX,uv.y+caY)).r;",
    "  float cg=texture2D(tex,uv).g;",
    "  float cb=texture2D(tex,vec2(uv.x-caX,uv.y-caY)).b;",
    "  vec3 col=vec3(cr,cg,cb);",
    "  float scan=.97+.03*sin(vUv.y*r.y*3.14159);",
    "  col*=mix(1.0,scan,strength);",
    "  float bandEdge=smoothstep(.02,.0,min(bandFrac,1.0-bandFrac));",
    "  col+=vec3(bandEdge*strength*.1);",
    "  col=mix(col,col*tint,tintStrength);",
    "  gl_FragColor=vec4(col,1.0);",
    "}"
  ].join("\n");

  var gl;
  try {
    gl = canvas.getContext("webgl", { alpha: true, antialias: false, premultipliedAlpha: false });
  } catch (error) {
    gl = null;
  }

  if (!gl) {
    root.classList.add("is-fallback");
    return;
  }

  function compile(type, source) {
    var shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      throw new Error(gl.getShaderInfoLog(shader) || "Shader compilation failed");
    }
    return shader;
  }

  var program;
  try {
    program = gl.createProgram();
    gl.attachShader(program, compile(gl.VERTEX_SHADER, "attribute vec2 a;varying vec2 vUv;void main(){vUv=vec2(a.x*.5+.5,.5-a.y*.5);gl_Position=vec4(a,0,1);}"));
    gl.attachShader(program, compile(gl.FRAGMENT_SHADER, fragmentShader));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      throw new Error(gl.getProgramInfoLog(program) || "Program linking failed");
    }
  } catch (error) {
    root.classList.add("is-fallback");
    return;
  }

  gl.useProgram(program);
  gl.clearColor(0, 0, 0, 0);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);

  var position = gl.getAttribLocation(program, "a");
  gl.enableVertexAttribArray(position);
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

  var uniforms = {
    time: gl.getUniformLocation(program, "t"),
    resolution: gl.getUniformLocation(program, "r"),
    imageSize: gl.getUniformLocation(program, "imgSize"),
    velocity: gl.getUniformLocation(program, "vel"),
    texture: gl.getUniformLocation(program, "tex"),
    tint: gl.getUniformLocation(program, "tint"),
    tintStrength: gl.getUniformLocation(program, "tintStrength"),
    bands: []
  };

  for (var i = 0; i < 12; i += 1) {
    uniforms.bands.push(gl.getUniformLocation(program, "bands[" + i + "]"));
  }

  var texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 255]));
  gl.uniform1i(uniforms.texture, 0);

  var state = {
    bandTargets: new Float32Array(12),
    bands: new Float32Array(12),
    hoverTarget: 0,
    imgW: 1,
    imgH: 1,
    mx: 0.5,
    my: 0.5,
    prevMx: 0.5,
    prevMy: 0.5,
    vx: 0,
    vy: 0
  };

  var image = new Image();
  image.onload = function () {
    state.imgW = image.naturalWidth || image.width || 1;
    state.imgH = image.naturalHeight || image.height || 1;
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    resize();
    drawFrame();
    requestAnimationFrame(function () {
      root.classList.add("is-ready");
      if (fallback) fallback.setAttribute("aria-hidden", "true");
    });
  };
  image.src = src;

  function resize() {
    var rect = canvas.getBoundingClientRect();
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.floor(rect.width * dpr));
    canvas.height = Math.max(1, Math.floor(rect.height * dpr));
    gl.viewport(0, 0, canvas.width, canvas.height);
  }

  function setPointer(clientX, clientY) {
    state.mx = clientX / Math.max(1, window.innerWidth);
    state.my = clientY / Math.max(1, window.innerHeight);
    state.hoverTarget = 1;
  }

  var damping = new Float32Array(12);
  for (var d = 0; d < 12; d += 1) damping[d] = 0.02 + 0.06 * Math.random();

  var started = performance.now();
  var frame = 0;
  var visible = !document.hidden;

  function drawFrame() {
    var speed = Math.sqrt(state.vx * state.vx + state.vy * state.vy);
    for (var band = 0; band < 12; band += 1) {
      var center = (band + 0.5) / 12;
      var proximity = Math.max(0, 1 - Math.abs(state.my - center) / 0.3);
      state.bandTargets[band] = sensitivity * state.hoverTarget * proximity * (0.4 + 0.6 * Math.min(speed, 1));
    }

    for (var b = 0; b < 12; b += 1) {
      var current = state.bands[b] || 0;
      var target = state.bandTargets[b] || 0;
      state.bands[b] = current + (target - current) * damping[b];
      if (state.bands[b] < 0.001) state.bands[b] = 0;
      gl.uniform1f(uniforms.bands[b], state.bands[b]);
    }

    gl.uniform1f(uniforms.time, (performance.now() - started) / 1000);
    gl.uniform2f(uniforms.resolution, canvas.width, canvas.height);
    gl.uniform2f(uniforms.imageSize, state.imgW, state.imgH);
    gl.uniform2f(uniforms.velocity, state.vx, state.vy);
    gl.uniform3f(uniforms.tint, 1, 1, 1);
    gl.uniform1f(uniforms.tintStrength, 0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  function render() {
    frame = visible ? requestAnimationFrame(render) : 0;

    state.hoverTarget += (0 - state.hoverTarget) * 0.015;
    var dx = state.mx - state.prevMx;
    var dy = state.my - state.prevMy;
    state.vx += (8 * dx * sensitivity - state.vx) * 0.1;
    state.vy += (8 * dy * sensitivity - state.vy) * 0.1;
    state.prevMx = state.mx;
    state.prevMy = state.my;

    drawFrame();
  }

  function start() {
    if (!frame && visible) frame = requestAnimationFrame(render);
  }

  function stop() {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
  }

  function updateNavbar() {
    if (!navbar) return;
    var progress = Math.min(Math.max(window.scrollY / 48, 0), 1);
    var mix = 12 + 38 * progress;
    navbar.style.setProperty("--distort-navbar-bg-mix", mix.toFixed(2) + "%");
  }

  window.addEventListener("resize", resize);
  window.addEventListener("scroll", updateNavbar, { passive: true });
  window.addEventListener("pointermove", function (event) {
    setPointer(event.clientX, event.clientY);
  }, { passive: true });
  window.addEventListener("pointerleave", function () {
    state.hoverTarget = 0;
  });
  document.addEventListener("visibilitychange", function () {
    visible = !document.hidden;
    if (visible) start();
    else stop();
  });

  resize();
  updateNavbar();
  start();
})();

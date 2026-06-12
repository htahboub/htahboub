(function () {
  "use strict";

  var canvas = document.getElementById("research-orb");
  if (!canvas) return;

  var useMobileOrb = window.matchMedia("(max-width: 790px), (pointer: coarse)").matches;
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function drawStaticOrb(targetCanvas, mode) {
    var size = 256;
    var ctx = targetCanvas.getContext("2d");
    if (!ctx) return false;

    targetCanvas.width = size;
    targetCanvas.height = size;
    targetCanvas.dataset.orbMode = mode;
    targetCanvas.dataset.orbTriangles = "0";
    ctx.clearRect(0, 0, size, size);
    ctx.fillStyle = "rgb(56, 148, 219)";

    for (var y = 20; y < 238; y += 4) {
      for (var x = 20; x < 238; x += 4) {
        var nx = (x - 128) / 108;
        var ny = (y - 128) / 108;
        var radius = Math.sqrt(nx * nx + ny * ny);
        if (radius > 1) continue;

        var ridge = Math.sin((nx * 3.2 + ny * 1.7) * 6.0) * 0.5 + 0.5;
        var crown = Math.max(0, 1 - Math.hypot(nx - 0.45, ny + 0.6) * 2.2);
        var lower = Math.max(0, 1 - Math.hypot(nx + 0.1, ny - 0.72) * 2.8);
        var edge = Math.max(0, 1 - radius);
        var density = 0.06 + ridge * 0.18 + crown * 0.72 + lower * 0.28 + edge * 0.14;
        var threshold = ((x * 13 + y * 7) % 64) / 64;
        if (density > threshold) ctx.fillRect(x, y, 1.6, 1.6);
      }
    }

    return true;
  }

  function replaceWithStaticOrb(mode) {
    var fallbackCanvas = canvas.cloneNode(false);
    canvas.parentNode.replaceChild(fallbackCanvas, canvas);
    canvas = fallbackCanvas;
    drawStaticOrb(canvas, mode);
  }

  if (reduceMotion) {
    drawStaticOrb(canvas, "static");
    return;
  }

  var gl = canvas.getContext("webgl", { alpha: true, premultipliedAlpha: false });
  if (!gl) gl = canvas.getContext("experimental-webgl", { alpha: true, premultipliedAlpha: false });
  if (!gl) {
    drawStaticOrb(canvas, "fallback");
    return;
  }

  var vertexShaderSource = "attribute vec3 position;\n\
\n\
uniform mat4 mvp;\n\
uniform mat4 model;\n\
uniform mat3 normal;\n\
uniform float time;\n\
\n\
varying float noiseAmt;\n\
varying float noiseAmt2;\n\
varying vec3 fragNrm;\n\
varying vec3 fragWorldPos;\n\
\n\
uniform vec2 mousePos;\n\
uniform bool mouseIn;\n\
\n\
vec4 permute(vec4 x) { return mod(((x * 34.) + 1.) * x, 289.); }\n\
float permute(float x) { return floor(mod(((x * 34.) + 1.) * x, 289.)); }\n\
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - .85373472095314 * r; }\n\
float taylorInvSqrt(float r) { return 1.79284291400159 - .85373472095314 * r; }\n\
\n\
vec4 grad4(float j, vec4 ip) {\n\
  const vec4 ones = vec4(1., 1., 1., -1.);\n\
  vec4 p, s;\n\
  p.xyz = floor(fract(vec3(j) * ip.xyz) * 7.) * ip.z - 1.;\n\
  p.w = 1.5 - dot(abs(p.xyz), ones.xyz);\n\
  s = vec4(lessThan(p, vec4(0.)));\n\
  p.xyz = p.xyz + (s.xyz * 2. - 1.) * s.www;\n\
  return p;\n\
}\n\
\n\
float snoise(vec4 v) {\n\
  const vec2 C = vec2(.138196601125010504, .309016994374947451);\n\
  vec4 i = floor(v + dot(v, C.yyyy));\n\
  vec4 x0 = v - i + dot(i, C.xxxx);\n\
  vec4 i0;\n\
  vec3 isX = step(x0.yzw, x0.xxx);\n\
  vec3 isYZ = step(x0.zww, x0.yyz);\n\
  i0.x = isX.x + isX.y + isX.z;\n\
  i0.yzw = 1. - isX;\n\
  i0.y += isYZ.x + isYZ.y;\n\
  i0.zw += 1. - isYZ.xy;\n\
  i0.z += isYZ.z;\n\
  i0.w += 1. - isYZ.z;\n\
  vec4 i3 = clamp(i0, 0., 1.);\n\
  vec4 i2 = clamp(i0 - 1., 0., 1.);\n\
  vec4 i1 = clamp(i0 - 2., 0., 1.);\n\
  vec4 x1 = x0 - i1 + 1. * C.xxxx;\n\
  vec4 x2 = x0 - i2 + 2. * C.xxxx;\n\
  vec4 x3 = x0 - i3 + 3. * C.xxxx;\n\
  vec4 x4 = x0 - 1. + 4. * C.xxxx;\n\
  i = mod(i, 289.);\n\
  float j0 = permute(permute(permute(permute(i.w) + i.z) + i.y) + i.x);\n\
  vec4 j1 = permute(permute(permute(permute(i.w + vec4(i1.w, i2.w, i3.w, 1.)) + i.z + vec4(i1.z, i2.z, i3.z, 1.)) + i.y + vec4(i1.y, i2.y, i3.y, 1.)) + i.x + vec4(i1.x, i2.x, i3.x, 1.));\n\
  vec4 ip = vec4(1. / 294., 1. / 49., 1. / 7., 0.);\n\
  vec4 p0 = grad4(j0, ip);\n\
  vec4 p1 = grad4(j1.x, ip);\n\
  vec4 p2 = grad4(j1.y, ip);\n\
  vec4 p3 = grad4(j1.z, ip);\n\
  vec4 p4 = grad4(j1.w, ip);\n\
  vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));\n\
  p0 *= norm.x;\n\
  p1 *= norm.y;\n\
  p2 *= norm.z;\n\
  p3 *= norm.w;\n\
  p4 *= taylorInvSqrt(dot(p4, p4));\n\
  vec3 m0 = max(.6 - vec3(dot(x0, x0), dot(x1, x1), dot(x2, x2)), 0.);\n\
  vec2 m1 = max(.6 - vec2(dot(x3, x3), dot(x4, x4)), 0.);\n\
  m0 = m0 * m0;\n\
  m1 = m1 * m1;\n\
  return 49. * (dot(m0 * m0, vec3(dot(p0, x0), dot(p1, x1), dot(p2, x2))) + dot(m1 * m1, vec2(dot(p3, x3), dot(p4, x4))));\n\
}\n\
\n\
float noise(vec3 x) {\n\
  float n1 = snoise(vec4(x, time)) * .5 + .5;\n\
  float n2 = snoise(vec4(x * 4., time)) * .5 + .5;\n\
  float n = mix(n1, n1 * n2 * n2, .25);\n\
  return n;\n\
}\n\
\n\
float displacement(float n) {\n\
  float m = mix(.65, .95, (sin(time) * .5 + .5));\n\
  return mix(m, 1., n);\n\
}\n\
\n\
vec3 calc(float phi, float theta) {\n\
  vec3 p = vec3(sin(theta) * cos(phi), sin(theta) * sin(phi), cos(theta));\n\
  p = normalize(p);\n\
  return p * displacement(noise(p));\n\
}\n\
\n\
void main() {\n\
  float phi = atan(position.y, position.x);\n\
  float theta = acos(position.z);\n\
  float e = .005;\n\
  float n = noise(position);\n\
  float d = displacement(n);\n\
  float rotationAngle = time * 0.1;\n\
  mat3 rotationMatrix = mat3(cos(rotationAngle), 0.0, sin(rotationAngle), 0.0, 1.0, 0.0, -sin(rotationAngle), 0.0, cos(rotationAngle));\n\
  vec3 P = rotationMatrix * position * d;\n\
  vec3 repulsionDir = vec3(mousePos.x, mousePos.y, P.z);\n\
  float distToMouse = length(P - repulsionDir);\n\
  float pushStrength = 0.03 / max(0.2, distToMouse * 1.);\n\
  P += normalize(P - repulsionDir) * pushStrength * float(mouseIn);\n\
  vec3 T = rotationMatrix * (calc(phi + e, theta) - position * d);\n\
  vec3 B = rotationMatrix * (calc(phi, theta - e) - position * d);\n\
  gl_Position = mvp * vec4(P, 1.);\n\
  noiseAmt = n;\n\
  noiseAmt2 = noise(position * 20.5);\n\
  fragNrm = normal * normalize(cross(T, B));\n\
  fragWorldPos = (model * vec4(P, 1.)).xyz;\n\
}";

  var fragmentShaderSource = "precision mediump float;\n\
varying float noiseAmt;\n\
varying float noiseAmt2;\n\
varying vec3 fragNrm;\n\
varying vec3 fragWorldPos;\n\
\n\
uniform vec3 lightDir;\n\
uniform vec3 eye;\n\
uniform vec3 ditherColor;\n\
\n\
float mod2(float a, float b) { return a - (b * floor(a / b)); }\n\
\n\
float indexMatrix8(int index) {\n\
  if (index == 0) return 0.; if (index == 1) return 32.; if (index == 2) return 8.; if (index == 3) return 40.;\n\
  if (index == 4) return 2.; if (index == 5) return 34.; if (index == 6) return 10.; if (index == 7) return 42.;\n\
  if (index == 8) return 48.; if (index == 9) return 16.; if (index == 10) return 56.; if (index == 11) return 24.;\n\
  if (index == 12) return 50.; if (index == 13) return 18.; if (index == 14) return 58.; if (index == 15) return 26.;\n\
  if (index == 16) return 12.; if (index == 17) return 44.; if (index == 18) return 4.; if (index == 19) return 36.;\n\
  if (index == 20) return 14.; if (index == 21) return 46.; if (index == 22) return 6.; if (index == 23) return 38.;\n\
  if (index == 24) return 60.; if (index == 25) return 28.; if (index == 26) return 52.; if (index == 27) return 20.;\n\
  if (index == 28) return 62.; if (index == 29) return 30.; if (index == 30) return 54.; if (index == 31) return 22.;\n\
  if (index == 32) return 3.; if (index == 33) return 35.; if (index == 34) return 11.; if (index == 35) return 43.;\n\
  if (index == 36) return 1.; if (index == 37) return 33.; if (index == 38) return 9.; if (index == 39) return 41.;\n\
  if (index == 40) return 51.; if (index == 41) return 19.; if (index == 42) return 59.; if (index == 43) return 27.;\n\
  if (index == 44) return 49.; if (index == 45) return 17.; if (index == 46) return 57.; if (index == 47) return 25.;\n\
  if (index == 48) return 15.; if (index == 49) return 47.; if (index == 50) return 7.; if (index == 51) return 39.;\n\
  if (index == 52) return 13.; if (index == 53) return 45.; if (index == 54) return 5.; if (index == 55) return 37.;\n\
  if (index == 56) return 63.; if (index == 57) return 31.; if (index == 58) return 55.; if (index == 59) return 23.;\n\
  if (index == 60) return 61.; if (index == 61) return 29.; if (index == 62) return 53.; if (index == 63) return 21.;\n\
}\n\
\n\
float indexValue() {\n\
  int x = int(mod2(gl_FragCoord.x, 8.));\n\
  int y = int(mod2(gl_FragCoord.y, 8.));\n\
  int index = (x + y * 8);\n\
  return float(indexMatrix8(index)) / 64.0;\n\
}\n\
\n\
float dither(vec3 color) {\n\
  highp float x = color.x;\n\
  highp float closestColor = (x < 0.5) ? 0.0 : 1.0;\n\
  highp float secondClosestColor = 1. - closestColor;\n\
  float d = indexValue();\n\
  float distance = abs(x - closestColor);\n\
  return (distance < d) ? closestColor : secondClosestColor;\n\
}\n\
\n\
float bell(float _min, float _max, float value) {\n\
  float mid = (_min + _max) / 2.;\n\
  return smoothstep(_min, mid, value) * smoothstep(_max, mid, value);\n\
}\n\
\n\
vec3 noiseColor(float n) {\n\
  vec3 col = vec3(.3686, 0., 0.) * smoothstep(.8, 0., n) +\n\
             vec3(.1059, .0627, .7255) * bell(.4, .7, n) +\n\
             vec3(.0627, .7255, .4471) * bell(.5, .8, n) +\n\
             vec3(0., 1., 1.) * smoothstep(.5, 1., n);\n\
  return col;\n\
}\n\
\n\
void main() {\n\
  vec3 nrm = normalize(fragNrm);\n\
  vec3 viewDir = normalize(eye - fragWorldPos);\n\
  vec3 col = noiseColor(noiseAmt);\n\
  float diffuseAmt = max(0.3, dot(nrm, lightDir));\n\
  vec3 diffuseCol = col * diffuseAmt * 0.9;\n\
  vec3 halfVec = normalize(viewDir + lightDir);\n\
  float specAmt = max(0., dot(nrm, halfVec));\n\
  specAmt = pow(specAmt, 15.);\n\
  vec3 rgbCol = diffuseCol + specAmt;\n\
  vec3 ditherInput = clamp(rgbCol * 1.04 + vec3(0.06), 0., 1.);\n\
  gl_FragColor = vec4(ditherColor, dither(ditherInput));\n\
}";

  function compile(type, source) {
    var shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      throw new Error(gl.getShaderInfoLog(shader) || "Shader compile failed");
    }
    return shader;
  }

  function createProgram() {
    var program = gl.createProgram();
    gl.attachShader(program, compile(gl.VERTEX_SHADER, vertexShaderSource));
    gl.attachShader(program, compile(gl.FRAGMENT_SHADER, fragmentShaderSource));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      throw new Error(gl.getProgramInfoLog(program) || "Program link failed");
    }
    return program;
  }

  function normalizePoint(p) {
    var length = Math.hypot(p[0], p[1], p[2]);
    p[0] /= length;
    p[1] /= length;
    p[2] /= length;
    return p;
  }

  function createIcosphere(subdivisions) {
    var phi = 0.5 + Math.sqrt(5) / 2;
    var positions = [
      [-1, phi, 0], [1, phi, 0], [-1, -phi, 0], [1, -phi, 0],
      [0, -1, phi], [0, 1, phi], [0, -1, -phi], [0, 1, -phi],
      [phi, 0, -1], [phi, 0, 1], [-phi, 0, -1], [-phi, 0, 1]
    ];
    var cells = [
      [0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11],
      [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8],
      [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9],
      [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1]
    ];

    function midpoint(a, b) {
      return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2];
    }

    for (var step = 0; step < subdivisions; step += 1) {
      var nextPositions = [];
      var nextCells = [];
      var indexByKey = {};

      function key(p) {
        return p[0].toPrecision(6) + "," + p[1].toPrecision(6) + "," + p[2].toPrecision(6);
      }

      function indexFor(p) {
        var k = key(p);
        if (indexByKey[k] === undefined) {
          indexByKey[k] = nextPositions.length;
          nextPositions.push(p);
        }
        return indexByKey[k];
      }

      for (var i = 0; i < cells.length; i += 1) {
        var cell = cells[i];
        var a = positions[cell[0]];
        var b = positions[cell[1]];
        var c = positions[cell[2]];
        var ab = midpoint(a, b);
        var bc = midpoint(b, c);
        var ca = midpoint(c, a);
        var ia = indexFor(a);
        var ib = indexFor(b);
        var ic = indexFor(c);
        var iab = indexFor(ab);
        var ibc = indexFor(bc);
        var ica = indexFor(ca);
        nextCells.push([ia, iab, ica], [ib, ibc, iab], [ic, ica, ibc], [iab, ibc, ica]);
      }

      positions = nextPositions;
      cells = nextCells;
    }

    for (var pIndex = 0; pIndex < positions.length; pIndex += 1) {
      normalizePoint(positions[pIndex]);
    }

    return { positions: positions, cells: cells };
  }

  function identity4() {
    return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
  }

  function multiply4(a, b) {
    var out = new Array(16);
    for (var row = 0; row < 4; row += 1) {
      for (var col = 0; col < 4; col += 1) {
        out[col * 4 + row] =
          a[0 * 4 + row] * b[col * 4 + 0] +
          a[1 * 4 + row] * b[col * 4 + 1] +
          a[2 * 4 + row] * b[col * 4 + 2] +
          a[3 * 4 + row] * b[col * 4 + 3];
      }
    }
    return out;
  }

  function perspective(fovy, aspect, near, far) {
    var f = 1 / Math.tan(fovy / 2);
    var nf = 1 / (near - far);
    return [f / aspect, 0, 0, 0, 0, f, 0, 0, 0, 0, (far + near) * nf, -1, 0, 0, (2 * far * near) * nf, 0];
  }

  function lookAt(eye, target, up) {
    var zx = eye[0] - target[0], zy = eye[1] - target[1], zz = eye[2] - target[2];
    var zLen = Math.hypot(zx, zy, zz);
    zx /= zLen; zy /= zLen; zz /= zLen;
    var xx = up[1] * zz - up[2] * zy;
    var xy = up[2] * zx - up[0] * zz;
    var xz = up[0] * zy - up[1] * zx;
    var xLen = Math.hypot(xx, xy, xz);
    xx /= xLen; xy /= xLen; xz /= xLen;
    var yx = zy * xz - zz * xy;
    var yy = zz * xx - zx * xz;
    var yz = zx * xy - zy * xx;
    return [
      xx, yx, zx, 0,
      xy, yy, zy, 0,
      xz, yz, zz, 0,
      -(xx * eye[0] + xy * eye[1] + xz * eye[2]),
      -(yx * eye[0] + yy * eye[1] + yz * eye[2]),
      -(zx * eye[0] + zy * eye[1] + zz * eye[2]),
      1
    ];
  }

  function setupPointer(signal) {
    var pointer = { x: 0, y: 0, inside: false };

    function update(clientX, clientY) {
      var rect = canvas.getBoundingClientRect();
      pointer.x = 2 * (clientX - rect.left) / rect.width - 1;
      pointer.y = 2 * (1 - (clientY - rect.top) / rect.height) - 1;
      pointer.inside = clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom;
    }

    canvas.addEventListener("mousemove", function (event) {
      update(event.clientX, event.clientY);
    }, { signal: signal });
    canvas.addEventListener("mouseenter", function () {
      pointer.inside = true;
    }, { signal: signal });
    canvas.addEventListener("mouseleave", function () {
      pointer.inside = false;
    }, { signal: signal });
    canvas.addEventListener("touchmove", function (event) {
      update(event.changedTouches[0].clientX, event.changedTouches[0].clientY);
      event.preventDefault();
    }, { signal: signal, passive: false });
    canvas.addEventListener("touchstart", function (event) {
      update(event.changedTouches[0].clientX, event.changedTouches[0].clientY);
    }, { signal: signal });
    canvas.addEventListener("touchend", function () {
      pointer.inside = false;
    }, { signal: signal });

    return pointer;
  }

  try {
    var controller = new AbortController();
    var pointer = setupPointer(controller.signal);
    var program = createProgram();
    var meshSubdivisions = useMobileOrb ? 5 : 6;
    var mesh = createIcosphere(meshSubdivisions);
    var flatPositions = new Float32Array(mesh.positions.flat());
    var flatCells = new Uint16Array(mesh.cells.flat());
    var positionBuffer = gl.createBuffer();
    var indexBuffer = gl.createBuffer();
    var positionLocation = gl.getAttribLocation(program, "position");
    var uniforms = {
      mvp: gl.getUniformLocation(program, "mvp"),
      model: gl.getUniformLocation(program, "model"),
      normal: gl.getUniformLocation(program, "normal"),
      time: gl.getUniformLocation(program, "time"),
      lightDir: gl.getUniformLocation(program, "lightDir"),
      mousePos: gl.getUniformLocation(program, "mousePos"),
      mouseIn: gl.getUniformLocation(program, "mouseIn"),
      eye: gl.getUniformLocation(program, "eye"),
      ditherColor: gl.getUniformLocation(program, "ditherColor")
    };
    var orbRenderScale = 0.94;
    var model = [
      orbRenderScale, 0, 0, 0,
      0, orbRenderScale, 0, 0,
      0, 0, orbRenderScale, 0,
      0, 0, 0, 1
    ];
    var normal = [1, 0, 0, 0, 1, 0, 0, 0, 1];
    var eye = [0, 0, 1.4];
    var ditherColor = [0.22, 0.58, 0.86];
    var animationFrame = null;
    var orbVisible = true;
    var pageVisible = !document.hidden;

    canvas.dataset.orbMode = "webgl";
    canvas.dataset.orbSubdivisions = String(meshSubdivisions);
    canvas.dataset.orbTriangles = String(flatCells.length / 3);

    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatPositions, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, flatCells, gl.STATIC_DRAW);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.disable(gl.CULL_FACE);
    gl.clearColor(0, 0, 0, 0);

    function resize() {
      canvas.width = 256;
      canvas.height = 256;
      gl.viewport(0, 0, canvas.width, canvas.height);
    }

    function render(now) {
      var time = now * 0.001;
      var proj = perspective(Math.PI / 2, 1, 0.01, 10);
      var view = lookAt(eye, [0, 0, 0], [0, 1, 0]);
      var mvp = multiply4(multiply4(proj, view), model);

      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.useProgram(program);
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      gl.enableVertexAttribArray(positionLocation);
      gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
      gl.uniformMatrix4fv(uniforms.mvp, false, new Float32Array(mvp));
      gl.uniformMatrix4fv(uniforms.model, false, new Float32Array(model));
      gl.uniformMatrix3fv(uniforms.normal, false, new Float32Array(normal));
      gl.uniform1f(uniforms.time, time);
      gl.uniform3fv(uniforms.lightDir, new Float32Array([1, 1, 0.3]));
      gl.uniform2fv(uniforms.mousePos, new Float32Array([pointer.x, pointer.y]));
      gl.uniform1i(uniforms.mouseIn, pointer.inside ? 1 : 0);
      gl.uniform3fv(uniforms.eye, new Float32Array(eye));
      gl.uniform3fv(uniforms.ditherColor, new Float32Array(ditherColor));
      gl.drawElements(gl.TRIANGLES, flatCells.length, gl.UNSIGNED_SHORT, 0);
      animationFrame = null;
      scheduleRender();
    }

    function scheduleRender() {
      if (!animationFrame && orbVisible && pageVisible && !reduceMotion) {
        animationFrame = window.requestAnimationFrame(render);
      }
    }

    function stopRender() {
      if (animationFrame) window.cancelAnimationFrame(animationFrame);
      animationFrame = null;
    }

    resize();
    if (reduceMotion) render(0);
    else scheduleRender();

    if ("IntersectionObserver" in window) {
      var observer = new IntersectionObserver(function (entries) {
        orbVisible = entries[0] && entries[0].isIntersecting;
        if (orbVisible) scheduleRender();
        else stopRender();
      }, { rootMargin: "128px" });
      observer.observe(canvas);
    }

    document.addEventListener("visibilitychange", function () {
      pageVisible = !document.hidden;
      if (pageVisible) scheduleRender();
      else stopRender();
    });

    window.addEventListener("pagehide", function () {
      stopRender();
      controller.abort();
    });
  } catch (error) {
    console.error("Unable to initialize research orb", error);
    replaceWithStaticOrb("fallback");
  }
})();

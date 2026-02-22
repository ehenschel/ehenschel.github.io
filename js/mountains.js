/* ============================================
   MINTAX — GEOMETRIC MOUNTAIN TERRAIN
   Three.js perspective ground-plane terrain
   Flat-shaded low-poly with gold wireframe + blue facets
   Five peaks diagonal: tallest top-right, smallest bottom-left
   ============================================ */

(function () {
    'use strict';

    /* ---------- Configuration ---------- */

    var CONFIG = {
        // Opacity
        fillOpacity: 0.015,
        wireColor: 0xC9A962,
        wireOpacity: 0.10,

        // Vertex colors
        colorLow:  { r: 26 / 255, g: 51 / 255, b: 80 / 255 },   // Navy #1A3350
        colorHigh: { r: 90 / 255, g: 127 / 255, b: 163 / 255 },  // Soft Blue #5A7FA3

        // Geometry
        segX: 80,
        segZ: 65,
        planeWidth: 70,
        planeDepth: 75,

        // Terrain — noise for surface texture on peaks
        noiseFreq: 0.07,
        noiseAmp: 0.3,
        baseFloor: 0.3,                     // Minimum height — wireframe visible everywhere

        // Camera
        camFOV: 60,
        camPos: { x: -5, y: 8, z: 16 },
        camLookAt: { x: 6, y: 1.5, z: -8 },

        // Animation — slow, water-like breathing
        animSpeed: 0.08,
        animAmp: 0.20
    };

    // Five mountain peaks: tallest top-right, smallest bottom-left
    var PEAKS = [
        { x: 22, z: -28, h: 8.0, r: 14 },
        { x: 12, z: -15, h: 6.0, r: 12 },
        { x: 0,  z: -2,  h: 4.5, r: 11 },
        { x: -12, z: 8,  h: 3.0, r: 10 },
        { x: -20, z: 18, h: 2.0, r: 9 }
    ];

    /* ---------- Noise ---------- */

    function hash(x, y) {
        var n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
        return n - Math.floor(n);
    }

    function smoothNoise(x, y) {
        var ix = Math.floor(x), iy = Math.floor(y);
        var fx = x - ix, fy = y - iy;
        fx = fx * fx * (3 - 2 * fx);
        fy = fy * fy * (3 - 2 * fy);
        var a = hash(ix, iy), b = hash(ix + 1, iy);
        var c = hash(ix, iy + 1), d = hash(ix + 1, iy + 1);
        return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
    }

    function fbm(x, y) {
        return smoothNoise(x, y) * 0.5
             + smoothNoise(x * 2, y * 2) * 0.25
             + smoothNoise(x * 4, y * 4) * 0.125
             + smoothNoise(x * 8, y * 8) * 0.0625;
    }

    /* ---------- Load Three.js ---------- */

    function loadThreeJS(cb) {
        if (window.THREE) { cb(); return; }
        var s = document.createElement('script');
        s.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
        s.crossOrigin = 'anonymous';
        s.onload = cb;
        s.onerror = function () {};
        document.head.appendChild(s);
    }

    /* ---------- Main ---------- */

    function init() {
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

        var THREE = window.THREE;
        var W = window.innerWidth, H = window.innerHeight;

        var scene = new THREE.Scene();

        var camera = new THREE.PerspectiveCamera(CONFIG.camFOV, W / H, 0.1, 200);
        camera.position.set(CONFIG.camPos.x, CONFIG.camPos.y, CONFIG.camPos.z);
        camera.lookAt(CONFIG.camLookAt.x, CONFIG.camLookAt.y, CONFIG.camLookAt.z);

        var renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        renderer.setSize(W, H);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setClearColor(0x000000, 0);

        var canvas = renderer.domElement;
        canvas.id = 'mountain-bg';
        canvas.setAttribute('aria-hidden', 'true');
        canvas.style.cssText = 'position:fixed;inset:0;width:100vw;height:100vh;z-index:1;pointer-events:none;'
            + '-webkit-mask-image:linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.4) 8%, black 18%, black 100%);'
            + 'mask-image:linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.4) 8%, black 18%, black 100%);';
        document.body.insertBefore(canvas, document.body.firstChild);

        // ---------- Build indexed geometry ----------

        var indexedGeo = new THREE.PlaneGeometry(
            CONFIG.planeWidth, CONFIG.planeDepth, CONFIG.segX, CONFIG.segZ
        );
        indexedGeo.rotateX(-Math.PI / 2);

        var iPos = indexedGeo.attributes.position;
        var halfW = CONFIG.planeWidth / 2;
        var halfD = CONFIG.planeDepth / 2;

        // Displace vertices — five explicit peaks + noise texture
        for (var i = 0; i < iPos.count; i++) {
            var x = iPos.getX(i);
            var z = iPos.getZ(i);

            // Sum Gaussian contributions from all five peaks
            var height = 0;
            for (var p = 0; p < PEAKS.length; p++) {
                var pk = PEAKS[p];
                var dx = x - pk.x;
                var dz = z - pk.z;
                var dist2 = dx * dx + dz * dz;
                height += pk.h * Math.exp(-dist2 / (2 * pk.r * pk.r));
            }

            // Add FBM noise for surface texture (scales with height)
            var noise = fbm(x * CONFIG.noiseFreq + 3, z * CONFIG.noiseFreq + 1);
            height += noise * CONFIG.noiseAmp * (0.5 + height * 0.15);

            // Base floor so wireframe is visible everywhere
            height = Math.max(height, CONFIG.baseFloor + noise * 0.2);

            iPos.setY(i, height);
        }

        // Vertex colors
        var iColors = new Float32Array(iPos.count * 3);
        var maxH = 0;
        for (var i = 0; i < iPos.count; i++) {
            var h = iPos.getY(i);
            if (h > maxH) maxH = h;
        }
        maxH = maxH || 1;
        for (var i = 0; i < iPos.count; i++) {
            var t = iPos.getY(i) / maxH;
            iColors[i * 3]     = CONFIG.colorLow.r + t * (CONFIG.colorHigh.r - CONFIG.colorLow.r);
            iColors[i * 3 + 1] = CONFIG.colorLow.g + t * (CONFIG.colorHigh.g - CONFIG.colorLow.g);
            iColors[i * 3 + 2] = CONFIG.colorLow.b + t * (CONFIG.colorHigh.b - CONFIG.colorLow.b);
        }
        indexedGeo.setAttribute('color', new THREE.BufferAttribute(iColors, 3));

        // ---------- Convert to non-indexed for flat-shaded facets ----------

        var geo = indexedGeo.toNonIndexed();
        var pos = geo.attributes.position;
        var colors = geo.attributes.color;

        for (var f = 0; f < pos.count; f += 3) {
            var r = (colors.getX(f) + colors.getX(f + 1) + colors.getX(f + 2)) / 3;
            var g = (colors.getY(f) + colors.getY(f + 1) + colors.getY(f + 2)) / 3;
            var b = (colors.getZ(f) + colors.getZ(f + 1) + colors.getZ(f + 2)) / 3;
            colors.setXYZ(f, r, g, b);
            colors.setXYZ(f + 1, r, g, b);
            colors.setXYZ(f + 2, r, g, b);
        }

        // Build base positions and height-based animation factors
        var basePos = new Float32Array(pos.count * 3);
        var diagFactors = new Float32Array(pos.count);
        var localMaxH = 0;
        for (var i = 0; i < pos.count; i++) {
            var h = pos.getY(i);
            if (h > localMaxH) localMaxH = h;
        }
        localMaxH = localMaxH || 1;
        for (var i = 0; i < pos.count; i++) {
            basePos[i * 3]     = pos.getX(i);
            basePos[i * 3 + 1] = pos.getY(i);
            basePos[i * 3 + 2] = pos.getZ(i);
            // Taller areas breathe more, flat areas barely move
            diagFactors[i] = 0.3 + 0.7 * (pos.getY(i) / localMaxH);
        }

        // Per-vertex animation parameters for organic breathing
        var animPhase = new Float32Array(pos.count);
        var animLocalSpeed = new Float32Array(pos.count);
        for (var i = 0; i < pos.count; i++) {
            var ax = basePos[i * 3], az = basePos[i * 3 + 2];
            animPhase[i] = smoothNoise(ax * 0.05 + 10, az * 0.05 + 10) * Math.PI * 4;
            animLocalSpeed[i] = 0.55 + smoothNoise(ax * 0.03 + 20, az * 0.03 + 20) * 0.45;
        }

        // Override bounding sphere
        var safeSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), 150);
        geo.boundingSphere = safeSphere;
        geo.computeBoundingSphere = function () { this.boundingSphere = safeSphere; };

        // ---------- Materials ----------

        var fillMat = new THREE.MeshBasicMaterial({
            vertexColors: true,
            transparent: true,
            opacity: CONFIG.fillOpacity,
            side: THREE.DoubleSide,
            depthWrite: false
        });

        // Wireframe with blue veins
        var wireGeo = new THREE.BufferGeometry();
        wireGeo.setAttribute('position', geo.attributes.position);
        wireGeo.boundingSphere = safeSphere;
        wireGeo.computeBoundingSphere = function () { this.boundingSphere = safeSphere; };

        var wireVertColors = new Float32Array(pos.count * 3);
        var goldR = 0xC9 / 255, goldG = 0xA9 / 255, goldB = 0x62 / 255;
        var blueR = 0x5A / 255, blueG = 0x7F / 255, blueB = 0xA3 / 255;
        for (var vi = 0; vi < pos.count; vi++) {
            var vx = basePos[vi * 3], vz = basePos[vi * 3 + 2];
            var vein = smoothNoise(vx * 0.12 + 50, vz * 0.12 + 50);
            vein = vein * vein * vein;
            var bMix = vein * 0.45;
            wireVertColors[vi * 3]     = goldR * (1 - bMix) + blueR * bMix;
            wireVertColors[vi * 3 + 1] = goldG * (1 - bMix) + blueG * bMix;
            wireVertColors[vi * 3 + 2] = goldB * (1 - bMix) + blueB * bMix;
        }
        wireGeo.setAttribute('color', new THREE.BufferAttribute(wireVertColors, 3));

        var wireMat = new THREE.MeshBasicMaterial({
            vertexColors: true,
            wireframe: true,
            transparent: true,
            opacity: CONFIG.wireOpacity,
            depthWrite: false
        });

        scene.add(new THREE.Mesh(geo, fillMat));
        scene.add(new THREE.Mesh(wireGeo, wireMat));

        // ---------- Animation — water-like breathing ----------

        var clock = new THREE.Clock();
        var running = true;

        function animate() {
            if (!running) return;
            requestAnimationFrame(animate);

            var t = clock.getElapsedTime();

            for (var i = 0; i < pos.count; i++) {
                var bx = basePos[i * 3];
                var by = basePos[i * 3 + 1];
                var bz = basePos[i * 3 + 2];
                var lt = t * CONFIG.animSpeed * animLocalSpeed[i];
                var ph = animPhase[i];
                // Water-like: smooth overlapping sine waves
                var w1 = Math.sin(lt + bx * 0.08 + ph);
                var w2 = Math.sin(lt * 0.7 + bz * 0.06 + ph * 0.5);
                var w3 = Math.sin(lt * 0.4 + bx * 0.04 + bz * 0.05 + ph * 1.2);
                var wave = (w1 * 0.6 + w2 * 0.3 + w3 * 0.1) * CONFIG.animAmp * diagFactors[i];
                var newY = by + wave;
                pos.setY(i, newY === newY ? newY : by);
            }
            pos.needsUpdate = true;
            geo.boundingSphere = safeSphere;

            renderer.render(scene, camera);
        }

        animate();

        // Resize
        window.addEventListener('resize', function () {
            W = window.innerWidth;
            H = window.innerHeight;
            camera.aspect = W / H;
            camera.updateProjectionMatrix();
            renderer.setSize(W, H);
        });

        // Pause when hidden
        document.addEventListener('visibilitychange', function () {
            if (document.hidden) {
                running = false;
            } else {
                running = true;
                clock.getDelta();
                animate();
            }
        });
    }

    /* ---------- Boot ---------- */

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () { loadThreeJS(init); });
    } else {
        loadThreeJS(init);
    }

})();

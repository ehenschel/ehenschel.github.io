/* ============================================
   MINTAX — GEOMETRIC MOUNTAIN TERRAIN
   Three.js perspective ground-plane terrain
   Flat-shaded low-poly with gold wireframe + blue facets
   Sharp peaks upper-right, gentle terrain elsewhere
   ============================================ */

(function () {
    'use strict';

    /* ---------- Configuration ---------- */

    var CONFIG = {
        // Opacity — subdued, fill reduced 20% more per Edward
        fillOpacity: 0.03,
        wireColor: 0xC9A962,
        wireOpacity: 0.16,

        // Vertex colors
        colorLow:  { r: 26 / 255, g: 51 / 255, b: 80 / 255 },   // Navy #1A3350
        colorHigh: { r: 90 / 255, g: 127 / 255, b: 163 / 255 },  // Soft Blue #5A7FA3

        // Geometry
        segX: 80,
        segZ: 50,
        planeWidth: 70,
        planeDepth: 55,

        // Terrain shape — sharp peaks zone with gentle terrain elsewhere
        noiseFreq: 0.07,
        peakHeight: 20.0,
        peakCenter: { x: 0.72, z: 0.62 },  // Where peaks concentrate (normalized 0-1)
        peakRadius: 0.25,                    // Gaussian spread (sigma)
        gentleFloor: 0.22,                   // 22% height in calm areas — rolling terrain across full viewport

        // Secondary terrain zones — spread mountain character beyond the main peak zone
        peakZones: [
            { x: 0.22, z: 0.28, radius: 0.18, strength: 0.55 },  // Left side, background
            { x: 0.52, z: 0.82, radius: 0.20, strength: 0.40 }   // Center, foreground
        ],

        // Ridge definition — creates distinct peaks without violent spikes
        ridgeFreq: 0.09,                     // Frequency for ridge detail
        ridgeMix: 0.40,                      // How much ridge vs smooth (0=all smooth, 1=all ridge)
        ridgeSharpness: 1.1,                 // Exponent: closer to 1 = natural peaks, >1.5 = spiky

        // Camera
        camFOV: 50,
        camPos: { x: -5, y: 0.8, z: 16 },
        camLookAt: { x: 6, y: 4.0, z: -10 },

        // Animation — visible breathing on peaks, calm elsewhere
        animSpeed: 0.28,
        animAmp: 1.2,

        // Blue vein overlay — sparse coarse wireframe in MinTax navy
        blueVeinColor: 0x2C4A6E,
        blueVeinOpacity: 0.05,
        veinSegX: 20,
        veinSegZ: 12
    };

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

    // Ridge noise — creates sharp V-shaped ridgelines instead of smooth hills
    // Uses abs(noise) inverted: valleys become peaks, creating mountain ridges
    function ridgeNoise(x, y) {
        var n = smoothNoise(x, y);
        n = 1.0 - Math.abs(2.0 * n - 1.0);  // Fold to create ridge
        return n * n;                          // Square for sharper peaks
    }

    function ridgeFBM(x, y) {
        var val = 0, amp = 0.5, freq = 1.0;
        for (var o = 0; o < 4; o++) {
            var r = ridgeNoise(x * freq, y * freq);
            val += r * amp;
            // Each octave gets weighted by previous for cascading ridges
            amp *= 0.45;
            freq *= 2.2;
        }
        return val;
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

        // Perspective camera — creates depth
        var camera = new THREE.PerspectiveCamera(CONFIG.camFOV, W / H, 0.1, 200);
        camera.position.set(CONFIG.camPos.x, CONFIG.camPos.y, CONFIG.camPos.z);
        camera.lookAt(CONFIG.camLookAt.x, CONFIG.camLookAt.y, CONFIG.camLookAt.z);

        // Renderer
        var renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        renderer.setSize(W, H);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setClearColor(0x000000, 0);

        var canvas = renderer.domElement;
        canvas.id = 'mountain-bg';
        canvas.setAttribute('aria-hidden', 'true');
        // On mobile: start canvas BELOW the header to avoid iOS Safari compositing the
        // WebGL layer with the fixed header (causes gray/frosted rendering on the pill).
        // On desktop: full viewport as before.
        var isMobile = W <= 900;
        var headerOffset = isMobile ? 72 : 0;
        canvas.style.cssText = 'position:fixed;top:' + headerOffset + 'px;left:0;right:0;bottom:0;width:100vw;height:' + (H - headerOffset) + 'px;z-index:1;pointer-events:none;'
            + '-webkit-mask-image:linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, black 12%, black 62%, rgba(0,0,0,0.5) 80%, transparent 95%);'
            + 'mask-image:linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, black 12%, black 62%, rgba(0,0,0,0.5) 80%, transparent 95%);';
        document.body.insertBefore(canvas, document.body.firstChild);

        // ---------- Build indexed geometry, displace, color ----------

        var indexedGeo = new THREE.PlaneGeometry(
            CONFIG.planeWidth, CONFIG.planeDepth, CONFIG.segX, CONFIG.segZ
        );
        indexedGeo.rotateX(-Math.PI / 2);  // Lay flat as ground

        var iPos = indexedGeo.attributes.position;
        var halfW = CONFIG.planeWidth / 2;
        var halfD = CONFIG.planeDepth / 2;

        // Displace vertices upward (Y)
        for (var i = 0; i < iPos.count; i++) {
            var x = iPos.getX(i);
            var z = iPos.getZ(i);

            var nx = (x + halfW) / CONFIG.planeWidth;
            var nz = (-z + halfD) / CONFIG.planeDepth;

            // Smooth terrain: rolling hills base (0-1 range)
            var smooth = fbm(x * CONFIG.noiseFreq + 3, z * CONFIG.noiseFreq + 1);

            // Ridge terrain: sharp V-shaped ridgelines (0-0.85 range)
            var ridge = ridgeFBM(x * CONFIG.ridgeFreq + 5, z * CONFIG.ridgeFreq + 2);
            ridge = Math.pow(ridge, CONFIG.ridgeSharpness);  // Sharpen the peaks

            // Blend smooth + ridge, then scale to peak height
            var terrain = smooth * (1.0 - CONFIG.ridgeMix) + ridge * CONFIG.ridgeMix;
            var mountain = terrain * CONFIG.peakHeight;

            // Add a few distinct peak anchors for mountain character
            mountain += Math.max(0, Math.sin(x * 0.15 + 2.0) * Math.sin(z * 0.18 - 1.0)) * 4.0;
            mountain += Math.max(0, Math.cos(x * 0.09 - 0.5) * Math.sin(z * 0.13 + 0.8)) * 3.0;

            // Gaussian peak zone: concentrated peaks behind carousel, gentle elsewhere
            var dx = nx - CONFIG.peakCenter.x;
            var dz = nz - CONFIG.peakCenter.z;
            var dist2 = dx * dx + dz * dz;
            var peakInfluence = Math.exp(-dist2 / (2 * CONFIG.peakRadius * CONFIG.peakRadius));
            var secondary = 0;
            for (var p = 0; p < CONFIG.peakZones.length; p++) {
                var zone = CONFIG.peakZones[p];
                var zdx = nx - zone.x, zdz = nz - zone.z;
                secondary += zone.strength * Math.exp(-(zdx * zdx + zdz * zdz) / (2 * zone.radius * zone.radius));
            }
            var factor = CONFIG.gentleFloor + (1.0 - CONFIG.gentleFloor) * Math.min(1.0, peakInfluence + secondary);

            var height = mountain * factor;
            if (!(height > 0)) height = 0;

            iPos.setY(i, height);
        }

        // Vertex colors on indexed geometry (will be flattened per-face below)
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

        // Flatten colors: each triangle face gets one uniform color (average of 3 vertices)
        for (var f = 0; f < pos.count; f += 3) {
            var r = (colors.getX(f) + colors.getX(f + 1) + colors.getX(f + 2)) / 3;
            var g = (colors.getY(f) + colors.getY(f + 1) + colors.getY(f + 2)) / 3;
            var b = (colors.getZ(f) + colors.getZ(f + 1) + colors.getZ(f + 2)) / 3;
            colors.setXYZ(f, r, g, b);
            colors.setXYZ(f + 1, r, g, b);
            colors.setXYZ(f + 2, r, g, b);
        }

        // Build base positions and diagonal factors for animation
        var basePos = new Float32Array(pos.count * 3);
        var diagFactors = new Float32Array(pos.count);
        for (var i = 0; i < pos.count; i++) {
            var x = pos.getX(i);
            var y = pos.getY(i);
            var z = pos.getZ(i);
            basePos[i * 3]     = x;
            basePos[i * 3 + 1] = y;
            basePos[i * 3 + 2] = z;

            var nx = (x + halfW) / CONFIG.planeWidth;
            var nz = (-z + halfD) / CONFIG.planeDepth;
            var dx = nx - CONFIG.peakCenter.x;
            var dz = nz - CONFIG.peakCenter.z;
            var dist2 = dx * dx + dz * dz;
            var peakInf = Math.exp(-dist2 / (2 * CONFIG.peakRadius * CONFIG.peakRadius));
            var secondary = 0;
            for (var p = 0; p < CONFIG.peakZones.length; p++) {
                var zone = CONFIG.peakZones[p];
                var zdx = nx - zone.x, zdz = nz - zone.z;
                secondary += zone.strength * Math.exp(-(zdx * zdx + zdz * zdz) / (2 * zone.radius * zone.radius));
            }
            diagFactors[i] = CONFIG.gentleFloor + (1.0 - CONFIG.gentleFloor) * Math.min(1.0, peakInf + secondary);
        }

        // Per-vertex breathing: spatially coherent phase offsets + speed variation
        // Low-freq noise ensures nearby vertices breathe in sync — organic, not random chaos
        var phaseOffsets = new Float32Array(pos.count);
        var speedScales  = new Float32Array(pos.count);
        for (var i = 0; i < pos.count; i++) {
            var bx = basePos[i * 3];
            var bz = basePos[i * 3 + 2];
            var nx = (bx + halfW) / CONFIG.planeWidth;
            var nz = (-bz + halfD) / CONFIG.planeDepth;
            // Phase: full 0–2π range so no two zones are in sync
            phaseOffsets[i] = smoothNoise(nx * 3.0 + 5.0, nz * 3.0 + 9.0) * Math.PI * 2.0;
            // Speed: 0.6–1.0 — some areas breathe slower, none faster than base
            speedScales[i]  = 0.6 + smoothNoise(nx * 2.0 + 11.0, nz * 2.0 + 13.0) * 0.4;
        }

        // Override bounding sphere computation to prevent NaN warning from animated geometry
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

        var wireMat = new THREE.MeshBasicMaterial({
            color: CONFIG.wireColor,
            wireframe: true,
            transparent: true,
            opacity: CONFIG.wireOpacity,
            depthWrite: false
        });

        scene.add(new THREE.Mesh(geo, fillMat));
        scene.add(new THREE.Mesh(geo, wireMat));

        // ---------- Blue vein overlay — coarse sparse wireframe ----------
        // A 20×12 mesh displaced to the same terrain shape, rendered in navy at low opacity.
        // Lower segment count means fewer, larger triangles — visible as distinct "vein" lines
        // over the denser gold wireframe beneath.

        var veinIndexed = new THREE.PlaneGeometry(
            CONFIG.planeWidth, CONFIG.planeDepth, CONFIG.veinSegX, CONFIG.veinSegZ
        );
        veinIndexed.rotateX(-Math.PI / 2);
        var vip = veinIndexed.attributes.position;

        for (var i = 0; i < vip.count; i++) {
            var vx = vip.getX(i), vz = vip.getZ(i);
            var vnx = (vx + halfW) / CONFIG.planeWidth;
            var vnz = (-vz + halfD) / CONFIG.planeDepth;
            var vsmooth = fbm(vx * CONFIG.noiseFreq + 3, vz * CONFIG.noiseFreq + 1);
            var vridge = ridgeFBM(vx * CONFIG.ridgeFreq + 5, vz * CONFIG.ridgeFreq + 2);
            vridge = Math.pow(vridge, CONFIG.ridgeSharpness);
            var vmountain = (vsmooth * (1.0 - CONFIG.ridgeMix) + vridge * CONFIG.ridgeMix) * CONFIG.peakHeight;
            vmountain += Math.max(0, Math.sin(vx * 0.15 + 2.0) * Math.sin(vz * 0.18 - 1.0)) * 4.0;
            vmountain += Math.max(0, Math.cos(vx * 0.09 - 0.5) * Math.sin(vz * 0.13 + 0.8)) * 3.0;
            var vdx = vnx - CONFIG.peakCenter.x, vdz2 = vnz - CONFIG.peakCenter.z;
            var vPeakInf = Math.exp(-(vdx * vdx + vdz2 * vdz2) / (2 * CONFIG.peakRadius * CONFIG.peakRadius));
            var vSec = 0;
            for (var p = 0; p < CONFIG.peakZones.length; p++) {
                var zone = CONFIG.peakZones[p];
                var zdx = vnx - zone.x, zdz = vnz - zone.z;
                vSec += zone.strength * Math.exp(-(zdx * zdx + zdz * zdz) / (2 * zone.radius * zone.radius));
            }
            var vFactor = CONFIG.gentleFloor + (1.0 - CONFIG.gentleFloor) * Math.min(1.0, vPeakInf + vSec);
            var vHeight = vmountain * vFactor;
            vip.setY(i, vHeight > 0 ? vHeight : 0);
        }

        var veinGeo = veinIndexed.toNonIndexed();
        var veinPos = veinGeo.attributes.position;
        veinGeo.boundingSphere = safeSphere;
        veinGeo.computeBoundingSphere = function () { this.boundingSphere = safeSphere; };

        var veinBase = new Float32Array(veinPos.count * 3);
        var veinDiag = new Float32Array(veinPos.count);
        for (var i = 0; i < veinPos.count; i++) {
            var vx = veinPos.getX(i), vy = veinPos.getY(i), vz = veinPos.getZ(i);
            veinBase[i * 3] = vx; veinBase[i * 3 + 1] = vy; veinBase[i * 3 + 2] = vz;
            var vnx = (vx + halfW) / CONFIG.planeWidth;
            var vnz = (-vz + halfD) / CONFIG.planeDepth;
            var vdx = vnx - CONFIG.peakCenter.x, vdz2 = vnz - CONFIG.peakCenter.z;
            var vPeakInf = Math.exp(-(vdx * vdx + vdz2 * vdz2) / (2 * CONFIG.peakRadius * CONFIG.peakRadius));
            var vSec = 0;
            for (var p = 0; p < CONFIG.peakZones.length; p++) {
                var zone = CONFIG.peakZones[p];
                var zdx = vnx - zone.x, zdz = vnz - zone.z;
                vSec += zone.strength * Math.exp(-(zdx * zdx + zdz * zdz) / (2 * zone.radius * zone.radius));
            }
            veinDiag[i] = CONFIG.gentleFloor + (1.0 - CONFIG.gentleFloor) * Math.min(1.0, vPeakInf + vSec);
        }

        var blueMat = new THREE.MeshBasicMaterial({
            color: CONFIG.blueVeinColor,
            wireframe: true,
            transparent: true,
            opacity: CONFIG.blueVeinOpacity,
            depthWrite: false
        });
        scene.add(new THREE.Mesh(veinGeo, blueMat));

        // ---------- Animation — visible breathing ----------

        var clock = new THREE.Clock();
        var running = true;

        function animate() {
            if (!running) return;
            requestAnimationFrame(animate);

            var t = clock.getElapsedTime();

            for (var i = 0; i < pos.count; i++) {
                var by = basePos[i * 3 + 1];
                var sp = CONFIG.animSpeed * speedScales[i];
                var ph = phaseOffsets[i];
                var wave = Math.sin(t * sp + ph)
                         * Math.cos(t * sp * 0.7 + ph * 0.7)
                         * CONFIG.animAmp * diagFactors[i];
                var newY = by + wave;
                pos.setY(i, newY === newY ? newY : by);
            }
            pos.needsUpdate = true;
            geo.boundingSphere = safeSphere;  // Re-assign to prevent NaN recomputation

            // Animate blue vein overlay — simple positional wave, coarser mesh
            for (var j = 0; j < veinPos.count; j++) {
                var vby = veinBase[j * 3 + 1];
                var vbx = veinBase[j * 3], vbz = veinBase[j * 3 + 2];
                var vwave = Math.sin(t * CONFIG.animSpeed * 0.9 + vbx * 0.1 + vbz * 0.08)
                          * CONFIG.animAmp * veinDiag[j];
                var vNewY = vby + vwave;
                veinPos.setY(j, vNewY === vNewY ? vNewY : vby);
            }
            veinPos.needsUpdate = true;
            veinGeo.boundingSphere = safeSphere;

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

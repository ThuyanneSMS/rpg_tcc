/**
 * theme.js — RPG-TCC Visual Theme System
 *
 * Public API  (window.ThemeSystem):
 *   getThemes()          — array of theme metadata
 *   applyTheme(id)       — instant DOM switch (no reload)
 *   saveTheme(id)        — apply + persist (localStorage + server)
 *   loadSavedTheme()     — restore from localStorage / server (async)
 *   initTheme()          — call once per page; also mounts floating picker
 *   getCurrentTheme()    — returns current data-theme value
 *   refreshPickerState() — sync active highlight after external call
 */

'use strict';

(function (global) {

    /* ----------------------------------------------------------
       THEMES METADATA
    ---------------------------------------------------------- */
    const THEMES = [
        { id:'default', name:'Padrão',       icon:'⚔️', description:'Visual clássico, sem animações. Tema base do jogo.', preview:'linear-gradient(135deg,#12100e,#24180a,#8a6420,#c8973a)' },
        { id:'dark',    name:'Escuridão',     icon:'🌑', description:'Trevas medievais, estrelas douradas.',            preview:'linear-gradient(135deg,#060608,#1a1520,#0d0c00)' },
        { id:'light',   name:'Pergaminho',    icon:'📜', description:'Manuscrito iluminado, textura envelhecida.',       preview:'linear-gradient(135deg,#d4b483,#e8d4a0,#c4a060)' },
        { id:'forest',  name:'Floresta',      icon:'🌲', description:'Dossel profundo, brisa entre as árvores.',          preview:'linear-gradient(135deg,#050e05,#1a5c20,#0a1e0a)' },
        { id:'cave',    name:'Caverna',       icon:'🪨', description:'Pedra cinza, estalactites, luz de tocha dourada.', preview:'linear-gradient(135deg,#1a1a1a,#2e2a22,#8a7055,#d4a855)' },
        { id:'snow',    name:'Neve',          icon:'❄️', description:'Montanhas nevadas, flocos caindo animados.',       preview:'linear-gradient(135deg,#c8dff0,#eef8ff,#b0d0e8)' },
        { id:'volcano', name:'Vulcão',        icon:'🌋', description:'Solo rachado, magma incandescente, brasas vivas.',  preview:'linear-gradient(135deg,#0a0200,#4a1400,#cc4400,#ff8800)' },
        { id:'shadow',  name:'Reino Sombrio', icon:'💀', description:'Crânios, névoa roxa, dimensão além do véu.',       preview:'linear-gradient(135deg,#030006,#200838,#8020bc,#c050f0)' }
    ];

    const VALID_IDS  = THEMES.map(t => t.id);
    const LS_KEY     = 'rpg_theme';
    const DEFAULT_ID = 'default';

    /* ----------------------------------------------------------
       CORE: instant DOM switch — no page reload
    ---------------------------------------------------------- */
    function applyTheme(id) {
        if (!VALID_IDS.includes(id)) id = DEFAULT_ID;
        document.documentElement.setAttribute('data-theme', id);
        _syncPickerActive(id);
        _updateFX(id);
    }

    /* ----------------------------------------------------------
       PERSIST: localStorage + server (fire-and-forget)
    ---------------------------------------------------------- */
    function saveTheme(id) {
        if (!VALID_IDS.includes(id)) id = DEFAULT_ID;
        applyTheme(id);
        localStorage.setItem(LS_KEY, id);
        _saveThemeToServer(id);
        _showToast(id);
    }

    async function _saveThemeToServer(id) {
        try {
            const token = localStorage.getItem('rpg_token');
            if (!token) return;
            await fetch('http://localhost:3000/api/auth/theme', {
                method:  'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
                body:    JSON.stringify({ theme: id })
            });
        } catch (_) { /* silent — localStorage is source of truth */ }
    }

    /* ----------------------------------------------------------
       LOAD: localStorage fast-path → then server reconcile
    ---------------------------------------------------------- */
    async function loadSavedTheme() {
        const local = localStorage.getItem(LS_KEY);
        applyTheme(VALID_IDS.includes(local) ? local : DEFAULT_ID);

        try {
            const token = localStorage.getItem('rpg_token');
            if (!token) return;
            const res  = await fetch('http://localhost:3000/api/auth/theme', {
                headers: { 'Authorization': 'Bearer ' + token }
            });
            if (!res.ok) return;
            const data = await res.json();
            if (data.theme && VALID_IDS.includes(data.theme)) {
                applyTheme(data.theme);
                localStorage.setItem(LS_KEY, data.theme);
            }
        } catch (_) { /* offline — localStorage value already applied */ }
    }

    /* ----------------------------------------------------------
       FX LAYER — animated particles per theme (snow / embers)
    ---------------------------------------------------------- */
    const FX_ID = '__rpg_fx__';
    let _fxTimer = null;
    let _fxTimer2 = null;

    function _updateFX(id) {
        if (_fxTimer)  { clearInterval(_fxTimer);  _fxTimer  = null; }
        if (_fxTimer2) { clearInterval(_fxTimer2); _fxTimer2 = null; }
        const old = document.getElementById(FX_ID);
        if (old) old.remove();
        const oldHoverGlow = document.getElementById('dark-hover-glow');
        if (oldHoverGlow) oldHoverGlow.remove();
        ['__rpg_castle__','__rpg_castle_L__','__rpg_castle_R__'].forEach(id => {
            const el = document.getElementById(id); if (el) el.remove();
        });
        if (!document.body) return;

        if (id === 'snow') {
            const div = document.createElement('div');
            div.id = FX_ID;
            document.body.appendChild(div);
            const FLAKES = ['\u2744','\u2745','\u2746','\u00b7','\u2022'];
            let count = 0;
            function spawnFlake() {
                if (count >= 60) return;
                count++;
                const el = document.createElement('span');
                el.className = 'fx-snow';
                el.textContent = FLAKES[Math.floor(Math.random() * FLAKES.length)];
                el.style.left = Math.random() * 100 + 'vw';
                el.style.fontSize = (8 + Math.random() * 14) + 'px';
                el.style.opacity  = 0.4 + Math.random() * 0.5;
                const dur = 8 + Math.random() * 14;
                el.style.animationDuration = dur + 's';
                el.style.animationDelay    = (Math.random() * -dur) + 's';
                el.addEventListener('animationend', () => { el.remove(); count--; });
                div.appendChild(el);
            }
            for (let i = 0; i < 40; i++) spawnFlake();
            _fxTimer = setInterval(spawnFlake, 600);
        }

        if (id === 'forest') {
            const div = document.createElement('div');
            div.id = FX_ID;
            document.body.appendChild(div);
            const LEAF_COLORS = ['#2a8c2e','#4aaa30','#80c040','#c87818','#b04010','#903010','#d4a020'];
            function spawnLeaf() {
                const el = document.createElement('div');
                el.className = 'fx-leaf';
                const sz = 8 + Math.random() * 14;
                el.style.left    = (-5 + Math.random() * 108) + 'vw';
                el.style.width   = sz + 'px';
                el.style.height  = (sz * 0.6) + 'px';
                el.style.background = LEAF_COLORS[Math.floor(Math.random() * LEAF_COLORS.length)];
                el.style.opacity = 0.55 + Math.random() * 0.4;
                const drift = 60 + Math.random() * 120; // wind blows right
                const spin  = (Math.random() < 0.5 ? 1 : -1) * (200 + Math.random() * 400);
                el.style.setProperty('--leaf-drift', drift + 'px');
                el.style.setProperty('--leaf-spin',  spin  + 'deg');
                const dur = 6 + Math.random() * 10;
                el.style.animationDuration = dur + 's';
                el.style.animationDelay    = (Math.random() * -dur) + 's';
                el.addEventListener('animationend', () => el.remove());
                div.appendChild(el);
            }
            for (let i = 0; i < 30; i++) spawnLeaf();
            _fxTimer = setInterval(spawnLeaf, 650);
        }

        if (id === 'cave') {
            const div = document.createElement('div');
            div.id = FX_ID;
            document.body.appendChild(div);
            // Irregular rock shapes via clip-path polygon
            const SHAPES = [
                'polygon(20% 0%, 80% 5%, 100% 30%, 95% 75%, 70% 100%, 25% 95%, 0% 65%, 5% 20%)',
                'polygon(35% 0%, 90% 10%, 100% 50%, 80% 95%, 30% 100%, 0% 70%, 10% 20%)',
                'polygon(15% 5%, 75% 0%, 100% 40%, 85% 90%, 40% 100%, 5% 75%, 0% 30%)',
                'polygon(50% 0%, 95% 20%, 100% 65%, 60% 100%, 10% 85%, 0% 40%, 25% 5%)',
                'polygon(25% 0%, 85% 8%, 100% 55%, 75% 100%, 20% 98%, 0% 55%, 8% 15%)'
            ];
            const COLORS = ['#8a9098','#7c8390','#98a0a8','#9098a0','#848c94'];
            function spawnRock() {
                const el = document.createElement('div');
                el.className = 'fx-rock';
                const sz = (8 + Math.random() * 18);
                el.style.left        = (Math.random() * 98) + 'vw';
                el.style.width       = sz + 'px';
                el.style.height      = (sz * (0.7 + Math.random() * 0.6)) + 'px';
                el.style.background  = COLORS[Math.floor(Math.random() * COLORS.length)];
                el.style.clipPath    = SHAPES[Math.floor(Math.random() * SHAPES.length)];
                const drift = ((Math.random() * 60) - 30);
                const spin  = (180 + Math.random() * 360) * (Math.random() < 0.5 ? 1 : -1);
                el.style.setProperty('--rock-drift', drift + 'px');
                el.style.setProperty('--rock-spin',  spin  + 'deg');
                const dur = 2.5 + Math.random() * 4;
                el.style.animationDuration = dur + 's';
                el.style.animationDelay    = (Math.random() * -2) + 's';
                el.addEventListener('animationend', () => el.remove());
                div.appendChild(el);
            }
            for (let i = 0; i < 12; i++) spawnRock();
            _fxTimer = setInterval(spawnRock, 800);
        }

        if (id === 'volcano') {
            const div = document.createElement('div');
            div.id = FX_ID;
            document.body.appendChild(div);
            const COLORS = ['#ff6600','#ff4400','#ff8800','#ffaa00','#ff2200'];
            function spawnEmber() {
                const el = document.createElement('span');
                el.className = 'fx-ember';
                el.style.left   = (5 + Math.random() * 90) + 'vw';
                const sz = (2 + Math.random() * 5) + 'px';
                el.style.width  = sz;
                el.style.height = sz;
                const c = COLORS[Math.floor(Math.random() * COLORS.length)];
                el.style.background = c;
                el.style.boxShadow  = '0 0 8px 2px ' + c;
                const dur = 3 + Math.random() * 6;
                el.style.animationDuration = dur + 's';
                el.style.animationDelay    = (Math.random() * -1) + 's';
                el.addEventListener('animationend', () => el.remove());
                div.appendChild(el);
            }
            for (let i = 0; i < 25; i++) spawnEmber();
            _fxTimer = setInterval(spawnEmber, 280);
        }

        // ================================================================
        //  ESCURIDÃO (dark) — night sky, moon, stars, mist, golden dust
        // ================================================================
        if (id === 'dark') {
            const div = document.createElement('div');
            div.id = FX_ID;
            document.body.appendChild(div);

            // Hover gradient overlay
            const hoverGlow = document.createElement('div');
            hoverGlow.id = 'dark-hover-glow';
            document.body.appendChild(hoverGlow);

            // ---- Moon — fixed upper-right, always visible ----
            (function buildMoon() {
                const moonSize = 110;
                const wrap = document.createElement('div');
                wrap.className = 'fx-moon';
                wrap.style.cssText = 'width:'+moonSize+'px;height:'+moonSize+'px;right:6vw;top:9vh;opacity:0;transition:opacity 3s ease;';
                const body = document.createElement('div');
                body.className = 'fx-moon-body';
                wrap.appendChild(body);
                div.appendChild(wrap);
                requestAnimationFrame(() => { wrap.style.opacity = '1'; });
            })();

            // ---- Mountain silhouette ----
            (function buildMountainScene() {
                const scene = document.createElement('div');
                scene.className = 'fx-darkscene';
                scene.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 160" preserveAspectRatio="xMidYMax meet" width="100%" height="100%">'
                    + '<defs>'
                    + '<radialGradient id="mtFog" cx="50%" cy="100%" r="60%"><stop offset="0%" stop-color="#1a0535" stop-opacity="0.4"/><stop offset="100%" stop-color="#07030f" stop-opacity="0"/></radialGradient>'
                    + '</defs>'
                    // distant mountains
                    + '<path d="M0,160 L0,120 L140,120 L280,70 L390,100 L520,42 L650,88 L790,28 L910,78 L1000,48 L1100,72 L1250,22 L1380,70 L1520,90 L1680,50 L1800,100 L1920,112 L1920,160 Z" fill="#150330" opacity="0.85"/>'
                    // foreground mountains
                    + '<path d="M0,160 L0,140 L200,140 L370,98 L480,122 L630,62 L740,100 L880,40 L960,22 L1040,44 L1170,88 L1290,55 L1420,102 L1560,122 L1720,98 L1920,138 L1920,160 Z" fill="#0d0520"/>'
                    // ground fog strip
                    + '<rect x="0" y="140" width="1920" height="20" fill="url(#mtFog)"/>'
                    + '</svg>';
                div.appendChild(scene);
            })();

            // ---- Stars ----
            (function buildStars() {
                for (let i = 0; i < 75; i++) {
                    const el = document.createElement('div');
                    el.className = 'fx-star';
                    const sz    = 1 + Math.random() * 2.5;
                    const x     = Math.random() * 99;
                    const y     = Math.random() * 68;
                    const dur   = 2.5 + Math.random() * 4;
                    const delay = Math.random() * 5;
                    const opLo  = (0.15 + Math.random() * 0.2).toFixed(2);
                    const opHi  = (0.6  + Math.random() * 0.4).toFixed(2);
                    el.style.cssText = ['width:'+sz+'px','height:'+sz+'px','left:'+x+'vw','top:'+y+'vh','--star-op-lo:'+opLo,'--star-op-hi:'+opHi,'animation-duration:'+dur+'s','animation-delay:'+(-delay)+'s'].join(';');
                    // some stars get a red cross-flare
                    if (Math.random() < 0.18) {
                        el.style.boxShadow = '0 0 '+Math.round(sz*3)+'px '+Math.round(sz)+'px rgba(200,30,30,0.8),'+(sz*4)+'px 0 '+(sz*2)+'px rgba(200,30,30,0.25),-'+(sz*4)+'px 0 '+(sz*2)+'px rgba(200,30,30,0.25)';
                    }
                    div.appendChild(el);
                }
            })();

            // ---- Dark mist wisps ----
            function spawnMist() {
                if (!document.getElementById(FX_ID)) return;
                const el = document.createElement('div');
                el.className = 'fx-nightmist';
                const w   = 28 + Math.random() * 40;
                const h   = 10 + Math.random() * 18;
                const y   = 5  + Math.random() * 80;
                const dur = 28 + Math.random() * 30;
                el.style.cssText = 'width:'+w+'vw;height:'+h+'vh;top:'+y+'vh;left:-'+w+'vw;animation-duration:'+dur+'s;';
                el.addEventListener('animationend', () => el.remove());
                div.appendChild(el);
            }
            for (let _mi = 0; _mi < 4; _mi++) setTimeout(spawnMist, _mi * 7000);
            setInterval(spawnMist, 12000);

            // ---- Golden dust particles ----
            function spawnGoldDust() {
                if (!document.getElementById(FX_ID)) return;
                const el = document.createElement('div');
                el.className = 'fx-golddust';
                const sz  = 1.5 + Math.random() * 2.5;
                const x   = Math.random() * 100;
                const y   = Math.random() * 30;
                const dy  = (50 + Math.random() * 40) + 'vh';
                const dx  = ((Math.random() * 14) - 7) + 'px';
                const dur = 12 + Math.random() * 16;
                el.style.cssText = ['width:'+sz+'px','height:'+sz+'px','left:'+x+'vw','top:'+y+'vh','--gd-dy:'+dy,'--gd-dx:'+dx,'animation-duration:'+dur+'s','animation-delay:'+(-Math.random()*8)+'s'].join(';');
                el.addEventListener('animationend', () => el.remove());
                div.appendChild(el);
            }
            for (let _gi = 0; _gi < 18; _gi++) setTimeout(spawnGoldDust, _gi * 600);
            _fxTimer = setInterval(spawnGoldDust, 1800);
        }

        if (id === 'shadow') {
            const div = document.createElement('div');
            div.id = FX_ID;
            document.body.appendChild(div);

            // ---- Castle panorama — full-width, z-index:-1 renders behind all UI ----
            // One SVG spanning the entire bottom; z-index:-1 keeps sidebar/buttons on top
            const castleWrap = document.createElement('div');
            castleWrap.id = '__rpg_castle_L__'; // reuse L id so cleanup works
            castleWrap.style.cssText = 'position:fixed;bottom:0;left:0;width:100%;height:260px;pointer-events:none;z-index:0;opacity:0.95;';
            castleWrap.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2400 260" preserveAspectRatio="xMidYMax meet" width="100%" height="100%">'
              + '<defs>'
              + '<radialGradient id="moonGlow" cx="50%" cy="0%" r="70%"><stop offset="0%" stop-color="#9040d0" stop-opacity="0.38"/><stop offset="100%" stop-color="#0e0820" stop-opacity="0"/></radialGradient>'
              + '<filter id="winGlow"><feGaussianBlur stdDeviation="3" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>'
              + '</defs>'
              + '<rect x="0" y="0" width="2400" height="260" fill="url(#moonGlow)"/>'
              + '<rect x="0" y="228" width="2400" height="32" fill="#2a1448"/>'
              // ══════ EXTRA LEFT WING ═══════════════════════════════════════════
              + '<rect x="0"   y="90"  width="90"  height="170" fill="#3a1860" stroke="#6020a0" stroke-width="1.5"/>'
              + '<rect x="0"   y="76"  width="14"  height="18"  fill="#3a1860" stroke="#6020a0" stroke-width="1"/>'
              + '<rect x="20"  y="76"  width="14"  height="18"  fill="#3a1860" stroke="#6020a0" stroke-width="1"/>'
              + '<rect x="40"  y="76"  width="14"  height="18"  fill="#3a1860" stroke="#6020a0" stroke-width="1"/>'
              + '<rect x="60"  y="76"  width="14"  height="18"  fill="#3a1860" stroke="#6020a0" stroke-width="1"/>'
              + '<rect x="12"  y="118" width="12"  height="20"  rx="6" fill="#dd77ff" opacity="1" filter="url(#winGlow)"/>'
              + '<rect x="44"  y="118" width="12"  height="20"  rx="6" fill="#bb55ee" opacity="1"  filter="url(#winGlow)"/>'
              + '<rect x="12"  y="170" width="12"  height="16"  rx="6" fill="#aa44dd" opacity="0.9"/>'
              + '<line x1="0" y1="148" x2="90" y2="148" stroke="#6020a0" stroke-width="1" opacity="0.75"/>'
              + '<rect x="90"  y="170" width="150" height="90"  fill="#321558" stroke="#5828a0" stroke-width="1"/>'
              + '<rect x="90"  y="158" width="14"  height="16"  fill="#321558" stroke="#5828a0" stroke-width="1"/>'
              + '<rect x="112" y="158" width="14"  height="16"  fill="#321558" stroke="#5828a0" stroke-width="1"/>'
              + '<rect x="134" y="158" width="14"  height="16"  fill="#321558" stroke="#5828a0" stroke-width="1"/>'
              + '<rect x="156" y="158" width="14"  height="16"  fill="#321558" stroke="#5828a0" stroke-width="1"/>'
              + '<rect x="178" y="158" width="14"  height="16"  fill="#321558" stroke="#5828a0" stroke-width="1"/>'
              + '<rect x="200" y="158" width="14"  height="16"  fill="#321558" stroke="#5828a0" stroke-width="1"/>'
              + '<rect x="222" y="158" width="14"  height="16"  fill="#321558" stroke="#5828a0" stroke-width="1"/>'
              + '<rect x="155" y="180" width="10"  height="14"  rx="5" fill="#cc66ff" opacity="0.95"/>'
              + '<rect x="240" y="110" width="100" height="150" fill="#442080" stroke="#7030b8" stroke-width="1.5"/>'
              + '<rect x="240" y="96"  width="14"  height="18"  fill="#442080" stroke="#7030b8" stroke-width="1"/>'
              + '<rect x="262" y="96"  width="14"  height="18"  fill="#442080" stroke="#7030b8" stroke-width="1"/>'
              + '<rect x="284" y="96"  width="14"  height="18"  fill="#442080" stroke="#7030b8" stroke-width="1"/>'
              + '<rect x="306" y="96"  width="16"  height="18"  fill="#442080" stroke="#7030b8" stroke-width="1"/>'
              + '<rect x="254" y="134" width="13"  height="22"  rx="6" fill="#ee88ff" opacity="1" filter="url(#winGlow)"/>'
              + '<rect x="284" y="134" width="13"  height="22"  rx="6" fill="#cc66ff" opacity="1" filter="url(#winGlow)"/>'
              + '<rect x="254" y="182" width="13"  height="18"  rx="6" fill="#bb55ee" opacity="0.9"/>'
              // ── left curtain wall ──
              + '<rect x="340" y="152" width="160" height="108" fill="#3c1c5c" stroke="#6028a0" stroke-width="1"/>'
              + '<rect x="340" y="140" width="14"  height="16"  fill="#3c1c5c" stroke="#6028a0" stroke-width="1"/>'
              + '<rect x="362" y="140" width="14"  height="16"  fill="#3c1c5c" stroke="#6028a0" stroke-width="1"/>'
              + '<rect x="384" y="140" width="14"  height="16"  fill="#3c1c5c" stroke="#6028a0" stroke-width="1"/>'
              + '<rect x="406" y="140" width="14"  height="16"  fill="#3c1c5c" stroke="#6028a0" stroke-width="1"/>'
              + '<rect x="428" y="140" width="14"  height="16"  fill="#3c1c5c" stroke="#6028a0" stroke-width="1"/>'
              + '<rect x="450" y="140" width="16"  height="16"  fill="#3c1c5c" stroke="#6028a0" stroke-width="1"/>'
              + '<rect x="395" y="165" width="10"  height="14"  rx="5" fill="#dd77ff" opacity="0.95"/>'
              // left far tower
              + '<rect x="500" y="60"  width="115" height="200" fill="#4a2870" stroke="#7030a8" stroke-width="1.5"/>'
              + '<rect x="500" y="44"  width="16"  height="20"  fill="#4a2870" stroke="#7030a8" stroke-width="1"/>'
              + '<rect x="522" y="44"  width="16"  height="20"  fill="#4a2870" stroke="#7030a8" stroke-width="1"/>'
              + '<rect x="544" y="44"  width="16"  height="20"  fill="#4a2870" stroke="#7030a8" stroke-width="1"/>'
              + '<rect x="566" y="44"  width="16"  height="20"  fill="#4a2870" stroke="#7030a8" stroke-width="1"/>'
              + '<rect x="588" y="44"  width="16"  height="20"  fill="#4a2870" stroke="#7030a8" stroke-width="1"/>'
              + '<rect x="518" y="90"  width="13"  height="22"  rx="6" fill="#ee88ff" opacity="1" filter="url(#winGlow)"/>'
              + '<rect x="552" y="90"  width="13"  height="22"  rx="6" fill="#cc66ff" opacity="1" filter="url(#winGlow)"/>'
              + '<rect x="518" y="148" width="13"  height="18"  rx="6" fill="#bb55ee" opacity="0.95"/>'
              + '<rect x="552" y="148" width="13"  height="18"  rx="6" fill="#ee88ff" opacity="0.9"/>'
              + '<line x1="500" y1="128" x2="615" y2="128" stroke="#7030a8" stroke-width="1" opacity="0.8"/>'
              + '<line x1="500" y1="185" x2="615" y2="185" stroke="#7030a8" stroke-width="1" opacity="0.8"/>'
              // second curtain wall
              + '<rect x="615" y="152" width="170" height="108" fill="#3c1c5c" stroke="#6028a0" stroke-width="1"/>'
              + '<rect x="615" y="140" width="14"  height="16"  fill="#3c1c5c" stroke="#6028a0" stroke-width="1"/>'
              + '<rect x="637" y="140" width="14"  height="16"  fill="#3c1c5c" stroke="#6028a0" stroke-width="1"/>'
              + '<rect x="659" y="140" width="14"  height="16"  fill="#3c1c5c" stroke="#6028a0" stroke-width="1"/>'
              + '<rect x="681" y="140" width="14"  height="16"  fill="#3c1c5c" stroke="#6028a0" stroke-width="1"/>'
              + '<rect x="703" y="140" width="14"  height="16"  fill="#3c1c5c" stroke="#6028a0" stroke-width="1"/>'
              + '<rect x="725" y="140" width="14"  height="16"  fill="#3c1c5c" stroke="#6028a0" stroke-width="1"/>'
              + '<rect x="747" y="140" width="16"  height="16"  fill="#3c1c5c" stroke="#6028a0" stroke-width="1"/>'
              + '<rect x="684" y="164" width="10"  height="14"  rx="5" fill="#dd77ff" opacity="0.95"/>'
              // left inner tower
              + '<rect x="785" y="90"  width="130" height="170" fill="#5a2890" stroke="#8840c0" stroke-width="1.5"/>'
              + '<rect x="785" y="76"  width="16"  height="18"  fill="#5a2890" stroke="#8840c0" stroke-width="1"/>'
              + '<rect x="809" y="76"  width="16"  height="18"  fill="#5a2890" stroke="#8840c0" stroke-width="1"/>'
              + '<rect x="833" y="76"  width="16"  height="18"  fill="#5a2890" stroke="#8840c0" stroke-width="1"/>'
              + '<rect x="857" y="76"  width="16"  height="18"  fill="#5a2890" stroke="#8840c0" stroke-width="1"/>'
              + '<rect x="881" y="76"  width="18"  height="18"  fill="#5a2890" stroke="#8840c0" stroke-width="1"/>'
              + '<rect x="804" y="115" width="14"  height="22"  rx="7" fill="#ee88ff" opacity="1" filter="url(#winGlow)"/>'
              + '<rect x="838" y="115" width="14"  height="22"  rx="7" fill="#cc66ff" opacity="1" filter="url(#winGlow)"/>'
              + '<rect x="872" y="115" width="14"  height="22"  rx="7" fill="#ee88ff" opacity="1" filter="url(#winGlow)"/>'
              + '<rect x="804" y="168" width="14"  height="18"  rx="7" fill="#bb55ee" opacity="0.95"/>'
              + '<rect x="872" y="168" width="14"  height="18"  rx="7" fill="#cc66ff" opacity="0.92"/>'
              + '<line x1="785" y1="148" x2="915" y2="148" stroke="#8840c0" stroke-width="1" opacity="0.8"/>'
              // third curtain wall
              + '<rect x="915" y="134" width="155" height="126" fill="#4a2278" stroke="#7030a8" stroke-width="1"/>'
              + '<rect x="915" y="122" width="14"  height="16"  fill="#4a2278" stroke="#7030a8" stroke-width="1"/>'
              + '<rect x="937" y="122" width="14"  height="16"  fill="#4a2278" stroke="#7030a8" stroke-width="1"/>'
              + '<rect x="959" y="122" width="14"  height="16"  fill="#4a2278" stroke="#7030a8" stroke-width="1"/>'
              + '<rect x="981" y="122" width="14"  height="16"  fill="#4a2278" stroke="#7030a8" stroke-width="1"/>'
              + '<rect x="1003" y="122" width="14" height="16"  fill="#4a2278" stroke="#7030a8" stroke-width="1"/>'
              + '<rect x="1025" y="122" width="14" height="16"  fill="#4a2278" stroke="#7030a8" stroke-width="1"/>'
              + '<rect x="1047" y="122" width="23" height="16"  fill="#4a2278" stroke="#7030a8" stroke-width="1"/>'
              + '<rect x="960"  y="150" width="10" height="14"  rx="5" fill="#dd77ff" opacity="0.95"/>'
              // left flanking spire
              + '<rect x="1070" y="30"  width="80"  height="230" fill="#4e2480" stroke="#8040c0" stroke-width="1.5"/>'
              + '<rect x="1070" y="14"  width="14"  height="20"  fill="#4e2480" stroke="#8040c0" stroke-width="1"/>'
              + '<rect x="1092" y="14"  width="14"  height="20"  fill="#4e2480" stroke="#8040c0" stroke-width="1"/>'
              + '<rect x="1114" y="14"  width="14"  height="20"  fill="#4e2480" stroke="#8040c0" stroke-width="1"/>'
              + '<rect x="1136" y="14"  width="14"  height="20"  fill="#4e2480" stroke="#8040c0" stroke-width="1"/>'
              + '<rect x="1084" y="60"  width="12"  height="20"  rx="6" fill="#ee88ff" opacity="1" filter="url(#winGlow)"/>'
              + '<rect x="1112" y="60"  width="12"  height="20"  rx="6" fill="#cc66ff" opacity="1" filter="url(#winGlow)"/>'
              + '<rect x="1084" y="112" width="12"  height="18"  rx="6" fill="#bb55ee" opacity="0.95"/>'
              + '<rect x="1112" y="112" width="12"  height="18"  rx="6" fill="#ee88ff" opacity="0.92"/>'
              // ── MAIN KEEP ──
              + '<rect x="1150" y="0"   width="300" height="260" fill="#6030a0" stroke="#9050d0" stroke-width="2"/>'
              + '<rect x="1150" y="-16" width="18"  height="20"  fill="#6030a0" stroke="#9050d0" stroke-width="1"/>'
              + '<rect x="1176" y="-16" width="18"  height="20"  fill="#6030a0" stroke="#9050d0" stroke-width="1"/>'
              + '<rect x="1202" y="-16" width="18"  height="20"  fill="#6030a0" stroke="#9050d0" stroke-width="1"/>'
              + '<rect x="1228" y="-16" width="18"  height="20"  fill="#6030a0" stroke="#9050d0" stroke-width="1"/>'
              + '<rect x="1254" y="-16" width="18"  height="20"  fill="#6030a0" stroke="#9050d0" stroke-width="1"/>'
              + '<rect x="1280" y="-16" width="18"  height="20"  fill="#6030a0" stroke="#9050d0" stroke-width="1"/>'
              + '<rect x="1306" y="-16" width="18"  height="20"  fill="#6030a0" stroke="#9050d0" stroke-width="1"/>'
              + '<rect x="1332" y="-16" width="18"  height="20"  fill="#6030a0" stroke="#9050d0" stroke-width="1"/>'
              + '<rect x="1358" y="-16" width="18"  height="20"  fill="#6030a0" stroke="#9050d0" stroke-width="1"/>'
              + '<rect x="1384" y="-16" width="18"  height="20"  fill="#6030a0" stroke="#9050d0" stroke-width="1"/>'
              + '<rect x="1410" y="-16" width="18"  height="20"  fill="#6030a0" stroke="#9050d0" stroke-width="1"/>'
              + '<rect x="1436" y="-16" width="14"  height="20"  fill="#6030a0" stroke="#9050d0" stroke-width="1"/>'
              + '<rect x="1172" y="22" width="14" height="24" rx="7" fill="#ffaaff" opacity="1" filter="url(#winGlow)"/>'
              + '<rect x="1206" y="22" width="14" height="24" rx="7" fill="#ee88ff" opacity="1" filter="url(#winGlow)"/>'
              + '<rect x="1240" y="22" width="14" height="24" rx="7" fill="#ffaaff" opacity="1" filter="url(#winGlow)"/>'
              + '<rect x="1274" y="22" width="14" height="24" rx="7" fill="#ffffff" opacity="0.95" filter="url(#winGlow)"/>'
              + '<rect x="1308" y="22" width="14" height="24" rx="7" fill="#ffaaff" opacity="1" filter="url(#winGlow)"/>'
              + '<rect x="1342" y="22" width="14" height="24" rx="7" fill="#ee88ff" opacity="1" filter="url(#winGlow)"/>'
              + '<rect x="1376" y="22" width="14" height="24" rx="7" fill="#ffaaff" opacity="1" filter="url(#winGlow)"/>'
              + '<rect x="1410" y="22" width="14" height="24" rx="7" fill="#dd77ff" opacity="1" filter="url(#winGlow)"/>'
              + '<rect x="1172" y="76" width="14" height="20" rx="7" fill="#cc66ff" opacity="0.95"/>'
              + '<rect x="1240" y="76" width="14" height="20" rx="7" fill="#ee88ff" opacity="0.95"/>'
              + '<rect x="1308" y="76" width="14" height="20" rx="7" fill="#cc66ff" opacity="0.95"/>'
              + '<rect x="1376" y="76" width="14" height="20" rx="7" fill="#ee88ff" opacity="0.95"/>'
              + '<path d="M1262,260 L1262,175 Q1300,142 1338,175 L1338,260" fill="#2a1248"/>'
              + '<line x1="1150" y1="120" x2="1450" y2="120" stroke="#9050d0" stroke-width="1" opacity="0.7"/>'
              + '<line x1="1150" y1="175" x2="1450" y2="175" stroke="#9050d0" stroke-width="1" opacity="0.7"/>'
              // right flanking spire
              + '<rect x="1450" y="30"  width="80"  height="230" fill="#4e2480" stroke="#8040c0" stroke-width="1.5"/>'
              + '<rect x="1450" y="14"  width="14"  height="20"  fill="#4e2480" stroke="#8040c0" stroke-width="1"/>'
              + '<rect x="1472" y="14"  width="14"  height="20"  fill="#4e2480" stroke="#8040c0" stroke-width="1"/>'
              + '<rect x="1494" y="14"  width="14"  height="20"  fill="#4e2480" stroke="#8040c0" stroke-width="1"/>'
              + '<rect x="1516" y="14"  width="14"  height="20"  fill="#4e2480" stroke="#8040c0" stroke-width="1"/>'
              + '<rect x="1464" y="60"  width="12"  height="20"  rx="6" fill="#cc66ff" opacity="1" filter="url(#winGlow)"/>'
              + '<rect x="1492" y="60"  width="12"  height="20"  rx="6" fill="#ee88ff" opacity="1" filter="url(#winGlow)"/>'
              + '<rect x="1464" y="112" width="12"  height="18"  rx="6" fill="#ee88ff" opacity="0.95"/>'
              + '<rect x="1492" y="112" width="12"  height="18"  rx="6" fill="#bb55ee" opacity="0.92"/>'
              // fourth curtain wall
              + '<rect x="1530" y="134" width="155" height="126" fill="#4a2278" stroke="#7030a8" stroke-width="1"/>'
              + '<rect x="1530" y="122" width="14"  height="16"  fill="#4a2278" stroke="#7030a8" stroke-width="1"/>'
              + '<rect x="1552" y="122" width="14"  height="16"  fill="#4a2278" stroke="#7030a8" stroke-width="1"/>'
              + '<rect x="1574" y="122" width="14"  height="16"  fill="#4a2278" stroke="#7030a8" stroke-width="1"/>'
              + '<rect x="1596" y="122" width="14"  height="16"  fill="#4a2278" stroke="#7030a8" stroke-width="1"/>'
              + '<rect x="1618" y="122" width="14"  height="16"  fill="#4a2278" stroke="#7030a8" stroke-width="1"/>'
              + '<rect x="1640" y="122" width="14"  height="16"  fill="#4a2278" stroke="#7030a8" stroke-width="1"/>'
              + '<rect x="1662" y="122" width="23"  height="16"  fill="#4a2278" stroke="#7030a8" stroke-width="1"/>'
              + '<rect x="1598" y="150" width="10"  height="14"  rx="5" fill="#dd77ff" opacity="0.95"/>'
              // right inner tower
              + '<rect x="1685" y="90"  width="130" height="170" fill="#5a2890" stroke="#8840c0" stroke-width="1.5"/>'
              + '<rect x="1685" y="76"  width="16"  height="18"  fill="#5a2890" stroke="#8840c0" stroke-width="1"/>'
              + '<rect x="1709" y="76"  width="16"  height="18"  fill="#5a2890" stroke="#8840c0" stroke-width="1"/>'
              + '<rect x="1733" y="76"  width="16"  height="18"  fill="#5a2890" stroke="#8840c0" stroke-width="1"/>'
              + '<rect x="1757" y="76"  width="16"  height="18"  fill="#5a2890" stroke="#8840c0" stroke-width="1"/>'
              + '<rect x="1781" y="76"  width="18"  height="18"  fill="#5a2890" stroke="#8840c0" stroke-width="1"/>'
              + '<rect x="1704" y="115" width="14"  height="22"  rx="7" fill="#ee88ff" opacity="1" filter="url(#winGlow)"/>'
              + '<rect x="1738" y="115" width="14"  height="22"  rx="7" fill="#cc66ff" opacity="1" filter="url(#winGlow)"/>'
              + '<rect x="1772" y="115" width="14"  height="22"  rx="7" fill="#ee88ff" opacity="1" filter="url(#winGlow)"/>'
              + '<rect x="1704" y="168" width="14"  height="18"  rx="7" fill="#bb55ee" opacity="0.95"/>'
              + '<rect x="1772" y="168" width="14"  height="18"  rx="7" fill="#cc66ff" opacity="0.92"/>'
              + '<line x1="1685" y1="148" x2="1815" y2="148" stroke="#8840c0" stroke-width="1" opacity="0.8"/>'
              // fifth curtain wall
              + '<rect x="1815" y="152" width="170" height="108" fill="#3c1c5c" stroke="#6028a0" stroke-width="1"/>'
              + '<rect x="1815" y="140" width="14"  height="16"  fill="#3c1c5c" stroke="#6028a0" stroke-width="1"/>'
              + '<rect x="1837" y="140" width="14"  height="16"  fill="#3c1c5c" stroke="#6028a0" stroke-width="1"/>'
              + '<rect x="1859" y="140" width="14"  height="16"  fill="#3c1c5c" stroke="#6028a0" stroke-width="1"/>'
              + '<rect x="1881" y="140" width="14"  height="16"  fill="#3c1c5c" stroke="#6028a0" stroke-width="1"/>'
              + '<rect x="1903" y="140" width="14"  height="16"  fill="#3c1c5c" stroke="#6028a0" stroke-width="1"/>'
              + '<rect x="1925" y="140" width="14"  height="16"  fill="#3c1c5c" stroke="#6028a0" stroke-width="1"/>'
              + '<rect x="1947" y="140" width="14"  height="16"  fill="#3c1c5c" stroke="#6028a0" stroke-width="1"/>'
              + '<rect x="1969" y="140" width="16"  height="16"  fill="#3c1c5c" stroke="#6028a0" stroke-width="1"/>'
              + '<rect x="1890" y="164" width="10"  height="14"  rx="5" fill="#ee88ff" opacity="0.95"/>'
              // right far tower
              + '<rect x="1985" y="60"  width="115" height="200" fill="#4a2870" stroke="#7030a8" stroke-width="1.5"/>'
              + '<rect x="1985" y="44"  width="16"  height="20"  fill="#4a2870" stroke="#7030a8" stroke-width="1"/>'
              + '<rect x="2007" y="44"  width="16"  height="20"  fill="#4a2870" stroke="#7030a8" stroke-width="1"/>'
              + '<rect x="2029" y="44"  width="16"  height="20"  fill="#4a2870" stroke="#7030a8" stroke-width="1"/>'
              + '<rect x="2051" y="44"  width="16"  height="20"  fill="#4a2870" stroke="#7030a8" stroke-width="1"/>'
              + '<rect x="2073" y="44"  width="16"  height="20"  fill="#4a2870" stroke="#7030a8" stroke-width="1"/>'
              + '<rect x="1999" y="90"  width="13"  height="22"  rx="6" fill="#ee88ff" opacity="1" filter="url(#winGlow)"/>'
              + '<rect x="2033" y="90"  width="13"  height="22"  rx="6" fill="#cc66ff" opacity="1" filter="url(#winGlow)"/>'
              + '<rect x="2067" y="90"  width="13"  height="22"  rx="6" fill="#ee88ff" opacity="1" filter="url(#winGlow)"/>'
              + '<rect x="1999" y="148" width="13"  height="18"  rx="6" fill="#bb55ee" opacity="0.95"/>'
              + '<rect x="2067" y="148" width="13"  height="18"  rx="6" fill="#cc66ff" opacity="0.92"/>'
              + '<line x1="1985" y1="128" x2="2100" y2="128" stroke="#7030a8" stroke-width="1" opacity="0.8"/>'
              + '<line x1="1985" y1="185" x2="2100" y2="185" stroke="#7030a8" stroke-width="1" opacity="0.8"/>'
              // connecting wall right
              + '<rect x="2100" y="170" width="150" height="90"  fill="#321558" stroke="#5828a0" stroke-width="1"/>'
              + '<rect x="2100" y="158" width="14"  height="16"  fill="#321558" stroke="#5828a0" stroke-width="1"/>'
              + '<rect x="2122" y="158" width="14"  height="16"  fill="#321558" stroke="#5828a0" stroke-width="1"/>'
              + '<rect x="2144" y="158" width="14"  height="16"  fill="#321558" stroke="#5828a0" stroke-width="1"/>'
              + '<rect x="2166" y="158" width="14"  height="16"  fill="#321558" stroke="#5828a0" stroke-width="1"/>'
              + '<rect x="2188" y="158" width="14"  height="16"  fill="#321558" stroke="#5828a0" stroke-width="1"/>'
              + '<rect x="2210" y="158" width="14"  height="16"  fill="#321558" stroke="#5828a0" stroke-width="1"/>'
              + '<rect x="2155" y="180" width="10"  height="14"  rx="5" fill="#cc66ff" opacity="0.95"/>'
              // ══════ EXTRA RIGHT WING ══════════════════════════════════════════
              + '<rect x="2250" y="110" width="100" height="150" fill="#442080" stroke="#7030b8" stroke-width="1.5"/>'
              + '<rect x="2250" y="96"  width="14"  height="18"  fill="#442080" stroke="#7030b8" stroke-width="1"/>'
              + '<rect x="2272" y="96"  width="14"  height="18"  fill="#442080" stroke="#7030b8" stroke-width="1"/>'
              + '<rect x="2294" y="96"  width="14"  height="18"  fill="#442080" stroke="#7030b8" stroke-width="1"/>'
              + '<rect x="2316" y="96"  width="16"  height="18"  fill="#442080" stroke="#7030b8" stroke-width="1"/>'
              + '<rect x="2264" y="134" width="13"  height="22"  rx="6" fill="#cc66ff" opacity="1" filter="url(#winGlow)"/>'
              + '<rect x="2294" y="134" width="13"  height="22"  rx="6" fill="#ee88ff" opacity="1" filter="url(#winGlow)"/>'
              + '<rect x="2264" y="182" width="13"  height="18"  rx="6" fill="#aa44dd" opacity="0.9"/>'
              + '<rect x="2310" y="90"  width="90"  height="170" fill="#3a1860" stroke="#6020a0" stroke-width="1.5"/>'
              + '<rect x="2310" y="76"  width="14"  height="18"  fill="#3a1860" stroke="#6020a0" stroke-width="1"/>'
              + '<rect x="2330" y="76"  width="14"  height="18"  fill="#3a1860" stroke="#6020a0" stroke-width="1"/>'
              + '<rect x="2350" y="76"  width="14"  height="18"  fill="#3a1860" stroke="#6020a0" stroke-width="1"/>'
              + '<rect x="2370" y="76"  width="14"  height="18"  fill="#3a1860" stroke="#6020a0" stroke-width="1"/>'
              + '<rect x="2322" y="118" width="12"  height="20"  rx="6" fill="#dd77ff" opacity="1" filter="url(#winGlow)"/>'
              + '<rect x="2354" y="118" width="12"  height="20"  rx="6" fill="#bb55ee" opacity="1"  filter="url(#winGlow)"/>'
              + '<rect x="2322" y="170" width="12"  height="16"  rx="6" fill="#aa44dd" opacity="0.9"/>'
              + '<line x1="2310" y1="148" x2="2400" y2="148" stroke="#6020a0" stroke-width="1" opacity="0.75"/>'
              + '</svg>';
            document.body.appendChild(castleWrap);

            // ---- Bats ----
            function spawnBat() {
                const el = document.createElement('div');
                el.className = 'fx-bat';
                const fromRight = Math.random() < 0.5;
                const sz = 22 + Math.random() * 26;
                el.style.width   = sz + 'px';
                el.style.height  = (sz * 0.58) + 'px';
                // Bats in purple/violet for visibility
                el.style.background = Math.random() < 0.6 ? '#b858f8' : '#8830d0';
                el.style.left    = fromRight ? '108vw' : (-sz) + 'px';
                el.style.top     = (5 + Math.random() * 55) + 'vh';
                const dist = (fromRight ? -1 : 1) * (115 + Math.random() * 10) + 'vw';
                const dy   = ((Math.random() * 18) - 9) + 'vh';
                el.style.setProperty('--bat-dx', dist);
                el.style.setProperty('--bat-dy', dy);
                const dur = 5 + Math.random() * 8;
                el.style.animationDuration = dur + 's';
                if (fromRight) el.style.transform = 'scaleX(-1)';
                el.addEventListener('animationend', () => el.remove());
                div.appendChild(el);
            }
            for (let i = 0; i < 5; i++) setTimeout(spawnBat, i * 900);
            _fxTimer = setInterval(spawnBat, 2200);

            // ---- Lightning (self-cleaning interval) ----
            const lightInt = setInterval(() => {
                if (!document.getElementById(FX_ID)) { clearInterval(lightInt); return; }
                const el = document.createElement('div');
                el.className = 'fx-lightning';
                el.style.left = (8 + Math.random() * 82) + 'vw';
                el.style.animationDuration = (0.22 + Math.random() * 0.28) + 's';
                el.addEventListener('animationend', () => el.remove());
                div.appendChild(el);
            }, 3500 + Math.floor(Math.random() * 4000));
        }

        // ================================================================
        //  PERGAMINHO (light) — escrita antiga + trilha de pontos
        // ================================================================
        if (id === 'light') {
            const div = document.createElement('div');
            div.id = FX_ID;
            div.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:0;overflow:hidden;';
            document.body.appendChild(div);

            // ---- Parchment grain overlay ----
            const grain = document.createElement('div');
            grain.className = 'fx-parchment-grain';
            div.appendChild(grain);

            // ================================================================
            //  ANCIENT TEXT — five dynamic size tiers
            // ================================================================
            const PHRASE_SETS = {
                sm:  ['ᚠᚢᚦ','ᛁᛏᛖᚱ','Via','ᛊᚨᚷᚨ','ᚷᛚᛟᚱ','lux','ᛏᛖᛗ'],
                md:  ['ᚠᚢᚦᚨᚱᚲ','Arcanum','Via Antiqua','ᛒᛖᚱᚷᚨᛗ','Signum Viae'],
                lg:  ['ᚠᚢᚦᚨᚱᚲᚷᚹ','Arcanum Itineris','ᛒᛖᚱᚷᚨᛗᛁᚾᚢᛗ','Veritas Aeterna','Lux in Tenebris'],
                xl:  ['ᚨᚱᚲᚨᚾᚢᛗ ᛁᛏᛖᚱ','Iter ad Gloriam','ᚺᛟᚾᛟᚱ ᛖᛏ ᚷᛚᛟᚱᛁᚨ','ᛏᛖᛗᛈᚢᛊ ᚠᚢᚷᛁᛏ'],
                xxl: ['ᚠ','ᚢ','ᚦ','ᚱ','ᛗ','ᚷ','ᛁ','ᛊ','ᚨ','ᛟ']
            };
            const SIZE_PX    = { sm:14, md:22,  lg:34,  xl:52,  xxl:82  };
            const SIZE_OP    = { sm:0.28, md:0.34, lg:0.41, xl:0.50, xxl:0.60 };
            const SIZE_SPEED = { sm:75,  md:110, lg:155, xl:200, xxl:440 };
            const SIZE_GLOW  = { sm:5,   md:8,   lg:12,  xl:18,  xxl:28  };
            const SIZE_KERN  = { sm:'2px', md:'3px', lg:'4px', xl:'6px', xxl:'10px' };

            function pickSize() {
                const r = Math.random() * 100;
                if (r < 34) return 'sm';
                if (r < 62) return 'md';
                if (r < 82) return 'lg';
                if (r < 94) return 'xl';
                return 'xxl';
            }

            // Margin slots + 3 centred slots (used only by xl / xxl)
            const SLOTS = [
                { top:'7%',  left:'0.8%',   rotate:'-1deg'   },
                { top:'7%',  right:'0.8%',  rotate:'1deg'    },
                { top:'19%', left:'0.8%',   rotate:'-0.6deg' },
                { top:'19%', right:'0.8%',  rotate:'0.7deg'  },
                { top:'32%', left:'0.8%',   rotate:'-1.1deg' },
                { top:'32%', right:'0.8%',  rotate:'0.5deg'  },
                { top:'47%', left:'0.8%',   rotate:'-0.8deg' },
                { top:'47%', right:'0.8%',  rotate:'1deg'    },
                { top:'61%', left:'0.8%',   rotate:'-0.7deg' },
                { top:'61%', right:'0.8%',  rotate:'0.8deg'  },
                { top:'10%', left:'50%',    rotate:'-0.3deg', center:true },
                { top:'38%', left:'50%',    rotate:'0.4deg',  center:true },
                { top:'64%', left:'50%',    rotate:'-0.5deg', center:true }
            ];
            const usedSlots = new Set();
            let phraseIdx = 0;

            function spawnQuillLine() {
                if (!document.getElementById(FX_ID)) return;
                const sz = pickSize();
                const eligible = sz === 'xl' || sz === 'xxl'
                    ? SLOTS.map((_,i) => i)
                    : SLOTS.map((_,i) => i).filter(i => !SLOTS[i].center);
                let slotIdx, att = 0;
                do { slotIdx = eligible[Math.floor(Math.random() * eligible.length)]; att++; }
                while (usedSlots.has(slotIdx) && att < 25);
                usedSlots.add(slotIdx);

                const phrases = PHRASE_SETS[sz];
                const phrase  = phrases[phraseIdx % phrases.length];
                phraseIdx++;
                const slot = SLOTS[slotIdx];

                const line = document.createElement('span');
                line.className = 'fx-quill-line fx-quill-' + sz;
                let posCSS = 'position:fixed;pointer-events:none;z-index:0;'
                    + 'font-family:"Palatino Linotype",Georgia,serif;white-space:nowrap;'
                    + 'font-size:' + SIZE_PX[sz] + 'px;'
                    + 'color:rgba(68,30,0,' + SIZE_OP[sz] + ');'
                    + 'letter-spacing:' + SIZE_KERN[sz] + ';'
                    + 'text-shadow:0 0 ' + SIZE_GLOW[sz] + 'px rgba(150,80,8,0.5);'
                    + 'opacity:0;transition:opacity ' + (sz === 'xxl' ? 2.2 : 1.3) + 's ease;';
                if (slot.center) {
                    posCSS += 'top:' + slot.top + ';left:' + slot.left + ';'
                        + 'transform:translateX(-50%) rotate(' + (slot.rotate||'0deg') + ');';
                } else {
                    // left or right anchor
                    Object.entries(slot)
                        .filter(([k]) => k !== 'rotate' && k !== 'center')
                        .forEach(([k,v]) => { posCSS += k + ':' + v + ';'; });
                    posCSS += 'transform:rotate(' + (slot.rotate||'0deg') + ');';
                }
                line.style.cssText = posCSS;
                line.textContent = '';
                div.appendChild(line);
                requestAnimationFrame(() => { line.style.opacity = '1'; });

                let ci = 0;
                const spd = SIZE_SPEED[sz] + Math.random() * 55;
                const typeInt = setInterval(() => {
                    if (!document.getElementById(FX_ID)) { clearInterval(typeInt); return; }
                    if (ci < phrase.length) { line.textContent += phrase[ci++]; }
                    else {
                        clearInterval(typeInt);
                        const hold = (sz === 'xxl' ? 10000 : sz === 'xl' ? 7500 : 5000) + Math.random() * 3000;
                        setTimeout(() => {
                            if (!line.isConnected) return;
                            line.style.transition = 'opacity 2.8s ease';
                            line.style.opacity = '0';
                            setTimeout(() => { line.remove(); usedSlots.delete(slotIdx); }, 2900);
                        }, hold);
                    }
                }, spd);
            }

            for (let i = 0; i < 6; i++) setTimeout(spawnQuillLine, i * 1100);
            _fxTimer = setInterval(spawnQuillLine, 3000);

            // ================================================================
            //  TRAIL PATH — SVG dashed line that draws itself segment by segment
            // ================================================================
            // Dash styles to vary between spawns
            const DASH_STYLES = [
                { dash:'6 10', w:'1.4', dot:'2.2' },
                { dash:'8 14', w:'1.2', dot:'2.0' },
                { dash:'5 9',  w:'1.6', dot:'2.4' },
                { dash:'9 15', w:'1.3', dot:'2.1' }
            ];

            // At most 2 route paths visible at once. Each slot picks a
            // fresh random vertical band every cycle — draw → hold → fade → repeat.
            function spawnRoutePath() {
                if (!document.getElementById(FX_ID)) return;

                const style = DASH_STYLES[Math.floor(Math.random() * DASH_STYLES.length)];
                // Random vertical position keeping path away from very top/bottom
                const topVh = 8 + Math.random() * 76;
                const opacity = 0.55 + Math.random() * 0.30;

                const svg = document.createElementNS('http://www.w3.org/2000/svg','svg');
                svg.setAttribute('class','fx-dash-path-svg');
                svg.style.cssText = 'position:fixed;left:0;top:' + topVh.toFixed(1) + 'vh;width:100%;height:110px;'
                    + 'pointer-events:none;z-index:0;overflow:visible;opacity:0;transition:opacity 2s ease;';
                svg.setAttribute('viewBox','0 0 1000 110');
                svg.setAttribute('preserveAspectRatio','none');

                // Some paths don't span the full width — adds variety
                const startFrac = Math.random() < 0.45 ? Math.random() * 0.20 : 0;
                const endFrac   = Math.random() < 0.40 ? 0.65 + Math.random() * 0.35 : 1;
                const numPts = 5 + Math.floor(Math.random() * 5);
                const pts = [];
                const baseY = 55 + (Math.random() * 18 - 9);
                for (let i = 0; i <= numPts; i++) {
                    const x = (startFrac + (i / numPts) * (endFrac - startFrac)) * 1000;
                    const y = baseY + Math.sin(i * 1.3 + Math.random() * 0.9) * 20 + (Math.random() * 7 - 3.5);
                    pts.push([x, y]);
                }
                let d = 'M ' + pts[0][0].toFixed(1) + ' ' + pts[0][1].toFixed(1);
                for (let i = 1; i < pts.length; i++) {
                    const p = pts[i-1], c = pts[i];
                    const cp1x = (p[0] + (c[0]-p[0])*0.35).toFixed(1);
                    const cp2x = (p[0] + (c[0]-p[0])*0.65).toFixed(1);
                    d += ' C '+cp1x+' '+p[1].toFixed(1)+' '+cp2x+' '+c[1].toFixed(1)+' '+c[0].toFixed(1)+' '+c[1].toFixed(1);
                }

                const pathEl = document.createElementNS('http://www.w3.org/2000/svg','path');
                pathEl.setAttribute('d', d);
                pathEl.setAttribute('fill','none');
                pathEl.setAttribute('stroke','rgba(90,46,0,' + opacity.toFixed(2) + ')');
                pathEl.setAttribute('stroke-width', style.w);
                pathEl.setAttribute('stroke-dasharray', style.dash);
                pathEl.setAttribute('stroke-linecap','round');
                pathEl.classList.add('fx-path-draw');
                svg.appendChild(pathEl);

                pts.forEach(([x,y]) => {
                    const c = document.createElementNS('http://www.w3.org/2000/svg','circle');
                    c.setAttribute('cx', x.toFixed(1));
                    c.setAttribute('cy', y.toFixed(1));
                    c.setAttribute('r', style.dot);
                    c.setAttribute('fill','rgba(105,52,0,0.32)');
                    c.classList.add('fx-path-node');
                    svg.appendChild(c);
                });

                div.appendChild(svg);

                // Draw duration — deliberate pacing, like a hand slowly tracing a map
                const drawDur = 6 + Math.random() * 5; // 6–11s
                requestAnimationFrame(() => {
                    svg.style.opacity = '1';
                    const len = pathEl.getTotalLength ? pathEl.getTotalLength() : 900;
                    pathEl.style.strokeDashoffset = String(len);
                    pathEl.style.animationName = 'pathReveal';
                    pathEl.style.animationDuration = drawDur + 's';
                    pathEl.style.animationTimingFunction = 'linear';
                    pathEl.style.animationFillMode = 'forwards';
                });

                // Short hold after finishing, then fade and respawn quickly
                const holdMs = (drawDur + 1 + Math.random() * 1.5) * 1000;
                setTimeout(() => {
                    if (!svg.isConnected) return;
                    svg.style.transition = 'opacity 1.8s ease';
                    svg.style.opacity = '0';
                    setTimeout(() => {
                        svg.remove();
                        // Short gap so a new route begins soon after
                        setTimeout(spawnRoutePath, 800 + Math.random() * 2000);
                    }, 1900);
                }, holdMs);
            }

            // 3 independent slots staggered so there's almost always a route being drawn
            setTimeout(spawnRoutePath, 600);
            setTimeout(spawnRoutePath, 4500);
            setTimeout(spawnRoutePath, 9000);

            // ================================================================
            //  MYSTIC SYMBOLS — appear near route waypoints then fade
            // ================================================================
            const MYSTIC_SYMS = [
                '✦','⊕','⊗','⁕','⌖','⍟','☽','☿','♆','⚶',
                'ᚠ','ᚢ','ᚦ','ᚱ','ᛗ','ᚷ','ᛁ','ᛊ','ᚨ','ᛟ',
                '∴','∵','⋆','※','◈','⬡','⏣','⌬'
            ];

            function spawnMysticSymbol() {
                if (!document.getElementById(FX_ID)) return;
                const sym = MYSTIC_SYMS[Math.floor(Math.random() * MYSTIC_SYMS.length)];
                const el = document.createElement('div');
                const sz = 14 + Math.random() * 26;          // 14–40px
                const x  = 3  + Math.random() * 94;           // 3–97vw
                const y  = 5  + Math.random() * 88;           // 5–93vh
                const rot = (Math.random() * 30 - 15) + 'deg';
                const op  = 0.18 + Math.random() * 0.28;
                el.textContent = sym;
                el.style.cssText = [
                    'position:fixed',
                    'left:'+x+'vw',
                    'top:'+y+'vh',
                    'font-size:'+sz+'px',
                    'font-family:"Palatino Linotype",serif',
                    'color:rgba(80,38,0,'+op.toFixed(2)+')',
                    'transform:rotate('+rot+')',
                    'pointer-events:none',
                    'z-index:0',
                    'opacity:0',
                    'transition:opacity 1.6s ease',
                    'text-shadow:0 0 8px rgba(180,120,40,0.3)'
                ].join(';');
                div.appendChild(el);
                requestAnimationFrame(() => { el.style.opacity = '1'; });
                // Hold then fade — longer than footprint dots
                const holdMs = 4000 + Math.random() * 6000;
                setTimeout(() => {
                    if (!el.isConnected) return;
                    el.style.transition = 'opacity 2s ease';
                    el.style.opacity = '0';
                    setTimeout(() => el.remove(), 2100);
                }, holdMs);
            }

            // Spawn a mystic symbol every ~2.2s — sparse enough to feel magical
            _fxTimer2 = setInterval(spawnMysticSymbol, 2200);
            // Seed a few immediately
            for (let _mi = 0; _mi < 4; _mi++) setTimeout(spawnMysticSymbol, _mi * 700);

            // ================================================================
            //  SCATTERED SYMBOLS — fully random position every spawn
            // ================================================================
            const FOOT_MARKS  = ['·','∘','◦','∙','⁘','⁙','✦','◆','◇','✧','∴','∵'];

            function spawnFootprint() {
                if (!document.getElementById(FX_ID)) return;
                const sym = FOOT_MARKS[Math.floor(Math.random() * FOOT_MARKS.length)];
                // Fully random scatter: anywhere on screen except centre band (10–90 vw, 10–90 vh)
                const x   = 4 + Math.random() * 92;
                const y   = 8 + Math.random() * 80;
                const sz  = 7 + Math.random() * 16;
                const op  = 0.10 + Math.random() * 0.22;
                const rot = (Math.random() * 40 - 20);

                const fp = document.createElement('span');
                fp.className = 'fx-trail-dot';
                fp.textContent = sym;
                fp.style.cssText = 'position:fixed;left:' + x + 'vw;top:' + y + 'vh;'
                    + 'font-size:' + sz + 'px;color:#6a3800;opacity:0;pointer-events:none;z-index:0;'
                    + 'transform:rotate(' + rot + 'deg);'
                    + 'transition:opacity 1.1s ease;text-shadow:0 0 4px rgba(150,80,0,0.28);';
                div.appendChild(fp);
                requestAnimationFrame(() => { fp.style.opacity = String(op); });

                const hold = 7000 + Math.random() * 5000;
                setTimeout(() => {
                    if (!fp.isConnected) return;
                    fp.style.transition = 'opacity 2.2s ease';
                    fp.style.opacity = '0';
                    setTimeout(() => fp.remove(), 2300);
                }, hold);
            }

            for (let i = 0; i < 16; i++) setTimeout(spawnFootprint, i * 210);
            const dotTimer = setInterval(spawnFootprint, 420);
            const _mo = new MutationObserver(() => {
                if (!document.getElementById(FX_ID)) { clearInterval(dotTimer); _mo.disconnect(); }
            });
            _mo.observe(document.body, { childList: true });
        }
    }

    /* ----------------------------------------------------------
       TOAST — visual feedback when theme is saved
    ---------------------------------------------------------- */
    const TOAST_ID = '__rpg_toast__';
    function _showToast(id) {
        const theme = THEMES.find(t => t.id === id);
        if (!theme || !document.body) return;
        const old = document.getElementById(TOAST_ID);
        if (old) old.remove();
        const el = document.createElement('div');
        el.id = TOAST_ID;
        el.textContent = theme.icon + '  Tema ' + theme.name + ' aplicado!';
        document.body.appendChild(el);
        setTimeout(() => { if (el.parentNode) el.remove(); }, 2700);
    }

    /* ----------------------------------------------------------
       INIT (LOGIN PAGE) — always forces default, no picker, no
       localStorage read. Call this ONLY on unauthenticated pages.
    ---------------------------------------------------------- */
    function initLoginPage() {
        // Strip any previously applied theme so the login page is always default
        document.documentElement.setAttribute('data-theme', DEFAULT_ID);
        _updateFX(DEFAULT_ID);
    }

    /* ----------------------------------------------------------
       INIT — call once; applies theme immediately + mounts widget
    ---------------------------------------------------------- */
    function initTheme() {
        // Synchronous fast-path to prevent any flash
        const local = localStorage.getItem(LS_KEY);
        applyTheme(VALID_IDS.includes(local) ? local : DEFAULT_ID);

        // Server reconcile
        loadSavedTheme();

        // Mount floating picker + FX after DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                _mountFloatingPicker();
                _updateFX(getCurrentTheme());
            });
        } else {
            _mountFloatingPicker();
            _updateFX(getCurrentTheme());
        }
    }

    /* ----------------------------------------------------------
       FLOATING PICKER WIDGET
    ---------------------------------------------------------- */
    const PICKER_ID  = '__rpg_theme_picker__';
    const TOGGLE_ID  = '__rpg_theme_toggle__';
    let   _mounted   = false;

    function _mountFloatingPicker() {
        if (_mounted || document.getElementById(PICKER_ID)) return;
        _mounted = true;

        // ---- Styles (scoped to widget) ----
        const style = document.createElement('style');
        style.textContent = `
            #${TOGGLE_ID} {
                position: fixed;
                bottom: 22px;
                right: 22px;
                z-index: 99999;
                width: 46px;
                height: 46px;
                border-radius: 50%;
                background: var(--accent-secondary, #b8860b);
                border: 2px solid var(--accent-primary, #f1c40f);
                color: #fff;
                font-size: 1.3em;
                cursor: pointer;
                box-shadow: 0 4px 16px rgba(0,0,0,0.5);
                display: flex;
                align-items: center;
                justify-content: center;
                transition: transform 0.2s, box-shadow 0.2s;
                user-select: none;
            }
            #${TOGGLE_ID}:hover {
                transform: scale(1.12);
                box-shadow: 0 6px 22px rgba(0,0,0,0.6);
            }
            #${PICKER_ID} {
                position: fixed;
                bottom: 78px;
                right: 22px;
                z-index: 99998;
                background: var(--bg-container, rgba(15,20,25,0.98));
                border: 2px solid var(--border-primary, #b8860b);
                border-radius: 12px;
                padding: 14px 12px 10px;
                width: 230px;
                box-shadow: 0 8px 40px rgba(0,0,0,0.7);
                display: none;
                flex-direction: column;
                gap: 6px;
                font-family: 'Merriweather', serif;
            }
            #${PICKER_ID}.open { display: flex; animation: _tpFadeUp 0.18s ease; }
            @keyframes _tpFadeUp {
                from { opacity: 0; transform: translateY(10px); }
                to   { opacity: 1; transform: translateY(0); }
            }
            #${PICKER_ID} .__tp-title {
                font-family: 'Cinzel', serif;
                color: var(--text-heading, #f1c40f);
                font-size: 0.75em;
                text-transform: uppercase;
                letter-spacing: 1px;
                margin-bottom: 6px;
                padding-bottom: 6px;
                border-bottom: 1px solid var(--border-secondary, #555);
            }
            #${PICKER_ID} .__tp-row {
                display: flex;
                align-items: center;
                gap: 10px;
                padding: 7px 10px;
                border-radius: 7px;
                cursor: pointer;
                border: 1px solid transparent;
                transition: background 0.15s, border-color 0.15s;
                color: var(--text-primary, #ecf0f1);
            }
            #${PICKER_ID} .__tp-row:hover {
                background: var(--menu-active-bg, rgba(241,196,15,0.1));
                border-color: var(--accent-primary, #f1c40f);
            }
            #${PICKER_ID} .__tp-row.__tp-active {
                background: var(--menu-active-bg, rgba(241,196,15,0.12));
                border-color: var(--accent-primary, #f1c40f);
                box-shadow: inset 0 0 8px rgba(241,196,15,0.15);
            }
            #${PICKER_ID} .__tp-swatch {
                width: 30px;
                height: 30px;
                border-radius: 50%;
                flex-shrink: 0;
                border: 2px solid rgba(255,255,255,0.3);
                box-shadow: 0 2px 6px rgba(0,0,0,0.5);
            }
            #${PICKER_ID} .__tp-row.__tp-active .__tp-swatch {
                border-color: var(--accent-primary, #f1c40f);
                box-shadow: 0 0 8px var(--accent-primary, #f1c40f);
            }
            #${PICKER_ID} .__tp-info { display: flex; flex-direction: column; gap: 1px; }
            #${PICKER_ID} .__tp-name {
                font-family: 'Cinzel', serif;
                font-size: 0.75em;
                font-weight: 700;
                color: var(--text-heading, #f1c40f);
            }
            #${PICKER_ID} .__tp-desc {
                font-size: 0.6em;
                color: var(--text-muted, #7f8c8d);
                line-height: 1.3;
            }
        `;
        document.head.appendChild(style);

        // ---- Panel ----
        const panel = document.createElement('div');
        panel.id = PICKER_ID;
        panel.innerHTML = '<div class="__tp-title">🎨 Tema Visual</div>' +
            THEMES.map(t => `
                <div class="__tp-row" data-theme-id="${t.id}" title="${t.description}">
                    <div class="__tp-swatch" style="background:${t.preview}"></div>
                    <div class="__tp-info">
                        <div class="__tp-name">${t.icon} ${t.name}</div>
                        <div class="__tp-desc">${t.description}</div>
                    </div>
                </div>
            `).join('');

        // ---- Toggle button ----
        const btn = document.createElement('button');
        btn.id          = TOGGLE_ID;
        btn.title       = 'Trocar tema visual';
        btn.textContent = '🎨';
        btn.setAttribute('aria-label', 'Abrir seletor de temas');

        document.body.appendChild(panel);
        document.body.appendChild(btn);

        // ---- Events ----
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = panel.classList.toggle('open');
            btn.title = isOpen ? 'Fechar seletor de temas' : 'Trocar tema visual';
            if (isOpen) _syncPickerActive(getCurrentTheme());
        });

        // Click on theme row → save immediately (real-time, no reload)
        panel.addEventListener('click', (e) => {
            const row = e.target.closest('.__tp-row');
            if (!row) return;
            _hoverPrev = null; // prevent mouseleave from reverting the chosen theme
            saveTheme(row.dataset.themeId);
            // Close panel after small delay so user sees the transition
            setTimeout(() => panel.classList.remove('open'), 280);
        });

        // Live preview on hover (reverts on mouse-leave if not clicked)
        let _hoverPrev = null;
        panel.addEventListener('mouseover', (e) => {
            const row = e.target.closest('.__tp-row');
            if (!row) return;
            if (_hoverPrev === null) _hoverPrev = getCurrentTheme();
            applyTheme(row.dataset.themeId); // preview only — not saved
        });
        panel.addEventListener('mouseleave', () => {
            if (_hoverPrev !== null) {
                applyTheme(_hoverPrev); // revert to current saved theme
                _hoverPrev = null;
            }
        });

        // Close on outside click
        document.addEventListener('click', (e) => {
            if (!panel.contains(e.target) && e.target !== btn) {
                panel.classList.remove('open');
                // Revert hover preview if panel closed mid-hover
                if (_hoverPrev !== null) { applyTheme(_hoverPrev); _hoverPrev = null; }
            }
        });

        // Initial active state
        _syncPickerActive(getCurrentTheme());
    }

    function _syncPickerActive(id) {
        const panel = document.getElementById(PICKER_ID);
        if (!panel) return;
        panel.querySelectorAll('.__tp-row').forEach(row => {
            row.classList.toggle('__tp-active', row.dataset.themeId === id);
        });
    }

    function refreshPickerState() {
        _syncPickerActive(getCurrentTheme());
    }

    function getCurrentTheme() {
        return document.documentElement.getAttribute('data-theme') || DEFAULT_ID;
    }

    /* ----------------------------------------------------------
       PUBLIC API
    ---------------------------------------------------------- */
    global.ThemeSystem = {
        getThemes:          () => [...THEMES],
        applyTheme,
        saveTheme,
        loadSavedTheme,
        initTheme,
        initLoginPage,
        getCurrentTheme,
        refreshPickerState
    };

}(window));

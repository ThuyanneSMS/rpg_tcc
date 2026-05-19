/**
 * RPG Web — Tutorial Interativo (Onboarding)
 * Sistema de tour guiado com spotlight, balões e barra de progresso.
 * Compatível com desktop e mobile.
 */

(function () {
    'use strict';

    /* =====================================================================
       CONFIGURATION — Steps definition
       Each step targets an element by selector and shows a balloon.
       position: 'right' | 'left' | 'bottom' | 'top' | 'center'
       ===================================================================== */
    const TUTORIAL_STEPS = [
        {
            id: 'status',
            selector: '#menu-status',
            icon: '👤',
            title: 'Perfil do Herói',
            desc: 'Aqui você acompanha o status completo do seu personagem: barra de vida, mana, experiência, nível e classe. Seu ponto de partida em cada aventura.',
            position: 'right',
        },
        {
            id: 'attributes',
            selector: '#pointsBadge',
            icon: '⚔️',
            title: 'Atributos & Pontos',
            desc: 'Distribua pontos de atributo para fortalecer seu herói! Aumente Força, Defesa, Velocidade ou Vida Máxima conforme seu estilo de jogo.',
            position: 'top',
        },
        {
            id: 'inventory',
            selector: '#menu-inventory',
            icon: '🎒',
            title: 'Inventário',
            desc: 'Gerencie todos os itens que seu herói carrega: equipamentos, poções, relíquias e tesouros encontrados ao longo das aventuras.',
            position: 'right',
        },
        {
            id: 'shop',
            selector: '#menu-shop',
            icon: '🛒',
            title: 'Mercador',
            desc: 'Visite o mercador para comprar e vender itens poderosos usando o ouro conquistado em batalha. Novos itens aparecem periodicamente!',
            position: 'right',
        },
        {
            id: 'battle',
            selector: '#menu-battle',
            icon: '🗡️',
            title: 'Missões & Batalha',
            desc: 'Enfrente monstros e complete missões para ganhar experiência, ouro e itens raros. Cada vitória aproxima você do topo do ranking!',
            position: 'right',
        },
        {
            id: 'map',
            selector: '#menu-map',
            icon: '🗺️',
            title: 'Mapa do Mundo',
            desc: 'Explore o Mapa de Ardenmoor! Clique nas regiões para ver detalhes, nível recomendado e dificuldade. Novas áreas se desbloqueiam conforme você evolui.',
            position: 'right',
        },
        {
            id: 'ranking',
            selector: '#menu-ranking',
            icon: '🏆',
            title: 'Ranking',
            desc: 'Confira o hall dos heróis mais poderosos da Guilda Escarlate. Suba as posições vencendo batalhas e construindo seu legado.',
            position: 'right',
        },
        {
            id: 'profile',
            selector: '#menu-profile',
            icon: '📋',
            title: 'Meus Dados',
            desc: 'Gerencie sua conta, altere nome de usuário e senha, e reinicie este tutorial quando quiser. Seus dados, seu controle.',
            position: 'right',
        },
        {
            id: 'inn',
            selector: '#btn-inn',
            icon: '🏡',
            title: 'Estalagem',
            desc: 'Quando seu herói estiver com vida baixa após batalhas intensas, descanse na Estalagem para recuperar toda a sua saúde por uma pequena quantia de ouro.',
            position: 'top',
        },
        {
            id: 'themes',
            selector: '#__rpg_theme_toggle__',
            icon: '🎨',
            title: 'Temas Visuais',
            desc: '<strong>Personalize o visual do jogo!</strong> Clique neste botão para abrir o seletor de temas. Os 8 temas disponíveis são:<br><br>'
                + '<span style="color:#c8973a">⚔️ Padrão</span> — Visual clássico dourado, sem animações.<br>'
                + '<span style="color:#b07aff">🌑 Escuridão</span> — Céu noturno, estrelas e lua roxa.<br>'
                + '<span style="color:#d4b483">📜 Pergaminho</span> — Papel envelhecido com runas e símbolos místicos.<br>'
                + '<span style="color:#6dcf70">🌲 Floresta</span> — Dossel verde com folhas caindo.<br>'
                + '<span style="color:#d4a855">🪨 Caverna</span> — Pedra e luz de tocha com brasas.<br>'
                + '<span style="color:#a0c8e8">❄️ Neve</span> — Montanhas nevadas e flocos animados.<br>'
                + '<span style="color:#ff8800">🌋 Vulcão</span> — Magma incandescente e chamas vivas.<br>'
                + '<span style="color:#d870ff">💀 Reino Sombrio</span> — Névoa roxa e castelo nas sombras.<br><br>'
                + 'O tema escolhido fica salvo no seu perfil e é aplicado em todas as telas.',
            position: 'top',
        },
    ];

    // Preference key — stored value is 'never' to permanently disable.
    // Absence of the key (or any other value) means "show every time".
    const STORAGE_PREF_KEY  = 'rpg_tutorial_pref';
    const STORAGE_STEP_KEY  = 'rpg_tutorial_step';

    /* =====================================================================
       STATE
       ===================================================================== */
    let currentStep = 0;
    let isRunning = false;
    let highlightedEl = null;
    let resizeTimer = null;
    // Cleanup function produced by ensureVisible(); restores hidden ancestors
    let forcedVisibleCleanup = null;

    /* =====================================================================
       INJECT HTML
       ===================================================================== */
    function buildHTML() {
        // Welcome screen
        const welcome = document.createElement('div');
        welcome.id = 'tutorial-welcome';
        welcome.innerHTML = `
        <div class="tutorial-card">
            <span class="big-icon">⚔️</span>
            <h2>Bem-vindo à Guilda!</h2>
            <p>Antes de começar sua aventura, deixe-nos guiá-lo pelas principais funcionalidades do jogo. O tutorial levará menos de 2 minutos.</p>
            <div class="tut-card-actions">
                <button class="tut-card-btn tut-card-btn-primary" id="tut-welcome-start">Iniciar Tutorial</button>
                <button class="tut-card-btn tut-card-btn-secondary" id="tut-welcome-skip">Pular, já conheço o sistema</button>
            </div>
        </div>`;
        document.body.appendChild(welcome);

        // Dark SVG overlay mask
        const svgNS = 'http://www.w3.org/2000/svg';
        const svg = document.createElementNS(svgNS, 'svg');
        svg.id = 'tutorial-mask-svg';
        svg.setAttribute('xmlns', svgNS);
        svg.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;z-index:9001;pointer-events:none;opacity:0;transition:opacity 0.4s ease;';

        const defs = document.createElementNS(svgNS, 'defs');

        // Glow filter
        const filter = document.createElementNS(svgNS, 'filter');
        filter.id = 'tutorial-glow-filter';
        filter.innerHTML = `
            <feGaussianBlur stdDeviation="6" result="blur"/>
            <feColorMatrix type="matrix" values="1 0.8 0 0 0  0.8 0.6 0 0 0  0 0 0 0 0  0 0 0 1.5 0" result="colored"/>
            <feMerge><feMergeNode in="colored"/><feMergeNode in="SourceGraphic"/></feMerge>`;

        // Clip path
        const clipPath = document.createElementNS(svgNS, 'clipPath');
        clipPath.id = 'tutorial-clip';
        const clipRect = document.createElementNS(svgNS, 'rect');
        clipRect.id = 'tutorial-clip-rect';
        clipRect.setAttribute('x', '0');
        clipRect.setAttribute('y', '0');
        clipRect.setAttribute('width', '0');
        clipRect.setAttribute('height', '0');
        clipRect.setAttribute('rx', '10');
        clipPath.appendChild(clipRect);

        defs.appendChild(filter);
        defs.appendChild(clipPath);
        svg.appendChild(defs);

        // Full-screen dark rect with a "hole"
        const maskGroup = document.createElementNS(svgNS, 'g');

        // Outer dark rect
        const darkRect = document.createElementNS(svgNS, 'rect');
        darkRect.id = 'tut-dark-rect';
        darkRect.setAttribute('x', '0');
        darkRect.setAttribute('y', '0');
        darkRect.setAttribute('width', '100%');
        darkRect.setAttribute('height', '100%');
        darkRect.setAttribute('fill', 'rgba(5,8,12,0.82)');
        maskGroup.appendChild(darkRect);

        // "Eraser" rect — same position as spotlight, uses destination-out
        const eraseRect = document.createElementNS(svgNS, 'rect');
        eraseRect.id = 'tut-erase-rect';
        eraseRect.setAttribute('x', '-999');
        eraseRect.setAttribute('y', '-999');
        eraseRect.setAttribute('width', '0');
        eraseRect.setAttribute('height', '0');
        eraseRect.setAttribute('rx', '12');
        eraseRect.setAttribute('fill', 'rgba(5,8,12,0.82)');
        maskGroup.appendChild(eraseRect);

        svg.appendChild(maskGroup);

        // Glow border rect (decorative)
        const glowRect = document.createElementNS(svgNS, 'rect');
        glowRect.id = 'tut-glow-rect';
        glowRect.setAttribute('x', '-999');
        glowRect.setAttribute('y', '-999');
        glowRect.setAttribute('width', '0');
        glowRect.setAttribute('height', '0');
        glowRect.setAttribute('rx', '12');
        glowRect.setAttribute('fill', 'none');
        glowRect.setAttribute('stroke', '#f1c40f');
        glowRect.setAttribute('stroke-width', '2.5');
        glowRect.setAttribute('opacity', '0.85');
        svg.appendChild(glowRect);

        document.body.appendChild(svg);

        // Main overlay interceptor (blocks clicks on dark area)
        const overlay = document.createElement('div');
        overlay.id = 'tutorial-overlay';
        document.body.appendChild(overlay);

        // Balloon
        const balloon = document.createElement('div');
        balloon.id = 'tutorial-balloon';
        balloon.innerHTML = `
        <div class="balloon-arrow" id="tut-arrow"></div>
        <div class="tutorial-step-badge" id="tut-badge">Passo 1 / ${TUTORIAL_STEPS.length}</div>
        <div class="tutorial-step-icon" id="tut-icon">⚔️</div>
        <div class="tutorial-title" id="tut-title"></div>
        <div class="tutorial-desc" id="tut-desc"></div>
        <div class="tutorial-progress-wrap">
            <div class="tutorial-progress-label">
                <span>Progresso</span>
                <span id="tut-pct">0%</span>
            </div>
            <div class="tutorial-progress-track">
                <div class="tutorial-progress-fill" id="tut-progress-fill" style="width:0%"></div>
            </div>
        </div>
        <div class="tutorial-actions">
            <button class="tut-btn tut-btn-prev" id="tut-btn-prev" disabled>◀ Voltar</button>
            <button class="tut-btn tut-btn-skip" id="tut-btn-skip" title="Pular tutorial">✕ Pular</button>
            <button class="tut-btn tut-btn-next" id="tut-btn-next">Próximo ▶</button>
        </div>`;
        document.body.appendChild(balloon);

        // Finish screen
        const finish = document.createElement('div');
        finish.id = 'tutorial-finish';
        finish.innerHTML = `
        <div class="tutorial-card">
            <span class="big-icon">🏅</span>
            <h2>Tutorial Concluído!</h2>
            <p>Você conhece as principais funcionalidades da Guilda Escarlate. Agora é hora de forjar sua lenda!</p>
            <div class="tut-card-actions">
                <button class="tut-card-btn tut-card-btn-primary" id="tut-finish-btn">⚔️ Começar Aventura</button>
                <button class="tut-card-btn tut-card-btn-secondary" id="tut-finish-never">Não mostrar mais o tutorial</button>
                <p style="font-size:0.74em;color:#55667a;margin-top:6px;">
                    Ao clicar em <strong style="color:#f1c40f">Começar Aventura</strong> o tutorial continuará aparecendo a cada entrada.
                    Você pode reativá-lo a qualquer momento em <strong style="color:#f1c40f">Meus Dados → Configurações</strong>.
                </p>
            </div>
        </div>`;
        document.body.appendChild(finish);
    }

    /* =====================================================================
       VISIBILITY HELPERS
       Temporarily reveal ancestors that are display:none so we can measure
       getBoundingClientRect() and position the spotlight correctly.
       ===================================================================== */

    /**
     * Walk up the ancestor chain, find every element that hides `el`
     * via display:none (inline or computed), reveal them, and return a
     * function that restores their original display values.
     */
    function ensureVisible(el) {
        const overrides = [];

        let node = el.parentElement;
        while (node && node !== document.body) {
            const computed = window.getComputedStyle(node).display;
            const inline   = node.style.display;
            if (computed === 'none') {
                // Store both inline value and computed so we can restore exactly
                overrides.push({ node, inline });
                // Use block, but respect flex/grid parents — peek at parent
                node.style.display = 'block';
            }
            node = node.parentElement;
        }

        return function cleanup() {
            overrides.forEach(({ node, inline }) => {
                node.style.display = inline; // restore to what it was ('' if unset)
            });
        };
    }

    /**
     * Returns true if el has a non-zero bounding rect (is visible and in the
     * layout flow).
     */
    function hasVisibleRect(el) {
        if (!el) return false;
        const r = el.getBoundingClientRect();
        return r.width > 0 && r.height > 0;
    }

    /* =====================================================================
       SPOTLIGHT HELPERS
       ===================================================================== */
    const PAD = 12; // padding around highlighted element

    function getSpotRect(el) {
        const r = el.getBoundingClientRect();
        return {
            x: r.left - PAD,
            y: r.top - PAD,
            w: r.width + PAD * 2,
            h: r.height + PAD * 2,
        };
    }

    function setSpotlight(el) {
        const { x, y, w, h } = getSpotRect(el);
        const eraseRect = document.getElementById('tut-erase-rect');
        const glowRect = document.getElementById('tut-glow-rect');

        // Animate via requestAnimationFrame for smooth transitions
        requestAnimationFrame(() => {
            if (eraseRect) {
                eraseRect.setAttribute('x', x);
                eraseRect.setAttribute('y', y);
                eraseRect.setAttribute('width', w);
                eraseRect.setAttribute('height', h);
            }
            if (glowRect) {
                glowRect.setAttribute('x', x);
                glowRect.setAttribute('y', y);
                glowRect.setAttribute('width', w);
                glowRect.setAttribute('height', h);
            }
        });
    }

    function clearSpotlight() {
        const eraseRect = document.getElementById('tut-erase-rect');
        const glowRect = document.getElementById('tut-glow-rect');
        if (eraseRect) { eraseRect.setAttribute('x', '-999'); eraseRect.setAttribute('width', '0'); }
        if (glowRect) { glowRect.setAttribute('x', '-999'); glowRect.setAttribute('width', '0'); }
    }

    /* =====================================================================
       BALLOON POSITIONING
       ===================================================================== */
    const BALLOON_MARGIN = 16;

    function positionBalloon(targetEl, preferredPos) {
        const balloon = document.getElementById('tutorial-balloon');
        const arrow = document.getElementById('tut-arrow');
        if (!balloon) return;

        balloon.classList.remove('visible');
        // Remove all arrow classes
        arrow.className = 'balloon-arrow';
        arrow.style.display = '';

        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const bw = balloon.offsetWidth || 380;
        const bh = balloon.offsetHeight || 300;

        // If element exists but has zero dimensions (hidden container) fall back
        // to centre positioning so the balloon is never stranded at 0,0.
        const rawRect = targetEl ? targetEl.getBoundingClientRect() : null;
        const elementIsVisible = rawRect && rawRect.width > 0 && rawRect.height > 0;
        const targetRect = elementIsVisible
            ? rawRect
            : { left: vw / 2, top: vh / 2, right: vw / 2, bottom: vh / 2, width: 0, height: 0 };
        const pos = (elementIsVisible ? preferredPos : 'center') || 'right';

        let top, left, arrowClass;

        if (pos === 'center' || !elementIsVisible) {
            top = (vh - bh) / 2;
            left = (vw - bw) / 2;
            arrowClass = '';
        } else if (pos === 'right') {
            left = targetRect.right + BALLOON_MARGIN;
            top = targetRect.top + targetRect.height / 2 - bh / 2;
            arrowClass = 'arrow-left';
            // Flip if out of viewport
            if (left + bw > vw - 10) {
                left = targetRect.left - bw - BALLOON_MARGIN;
                arrowClass = 'arrow-right';
            }
        } else if (pos === 'left') {
            left = targetRect.left - bw - BALLOON_MARGIN;
            top = targetRect.top + targetRect.height / 2 - bh / 2;
            arrowClass = 'arrow-right';
            if (left < 10) {
                left = targetRect.right + BALLOON_MARGIN;
                arrowClass = 'arrow-left';
            }
        } else if (pos === 'bottom') {
            top = targetRect.bottom + BALLOON_MARGIN;
            left = targetRect.left + targetRect.width / 2 - bw / 2;
            arrowClass = 'arrow-top';
            if (top + bh > vh - 10) {
                top = targetRect.top - bh - BALLOON_MARGIN;
                arrowClass = 'arrow-bottom';
            }
        } else if (pos === 'top') {
            top = targetRect.top - bh - BALLOON_MARGIN;
            left = targetRect.left + targetRect.width / 2 - bw / 2;
            arrowClass = 'arrow-bottom';
            if (top < 10) {
                top = targetRect.bottom + BALLOON_MARGIN;
                arrowClass = 'arrow-top';
            }
        }

        // Clamp within viewport
        top = Math.max(10, Math.min(top, vh - bh - 10));
        left = Math.max(10, Math.min(left, vw - bw - 10));

        balloon.style.top = top + 'px';
        balloon.style.left = left + 'px';

        if (arrowClass) arrow.classList.add(arrowClass);
        else arrow.style.display = 'none';

        // Show balloon with animation
        requestAnimationFrame(() => {
            balloon.classList.add('visible');
        });
    }

    /* =====================================================================
       RENDER STEP
       ===================================================================== */
    function renderStep(index) {
        const steps = getValidSteps();
        if (index < 0 || index >= steps.length) return;

        const step = steps[index];
        const total = steps.length;
        const pct = Math.round(((index + 1) / total) * 100);

        // Update badge / icon / texts
        document.getElementById('tut-badge').textContent = `Passo ${index + 1} / ${total}`;
        document.getElementById('tut-icon').textContent = step.icon;
        document.getElementById('tut-title').textContent = step.title;
        const descEl = document.getElementById('tut-desc');
        descEl.innerHTML = step.desc;
        // Left-align when the description contains HTML (e.g. a list)
        descEl.style.textAlign = step.desc.includes('<br>') ? 'left' : '';
        document.getElementById('tut-pct').textContent = pct + '%';
        document.getElementById('tut-progress-fill').style.width = pct + '%';

        // Buttons
        const prevBtn = document.getElementById('tut-btn-prev');
        const nextBtn = document.getElementById('tut-btn-next');
        prevBtn.disabled = index === 0;

        const isLast = index === total - 1;
        nextBtn.textContent = isLast ? 'Concluir ✓' : 'Próximo ▶';
        nextBtn.className = 'tut-btn ' + (isLast ? 'tut-btn-finish' : 'tut-btn-next');

        // Remove previous highlight and restore any hidden ancestors we forced open
        if (highlightedEl) {
            highlightedEl.classList.remove('tutorial-highlight');
            highlightedEl.style.zIndex = '';
            highlightedEl = null;
        }
        if (forcedVisibleCleanup) {
            forcedVisibleCleanup();
            forcedVisibleCleanup = null;
        }

        // Target element
        const targetEl = step.selector ? document.querySelector(step.selector) : null;
        if (targetEl) {
            // ---- Visibility guard ----
            // If the target lives inside a display:none ancestor (e.g. #charDetails)
            // its getBoundingClientRect() returns {0,0,0,0} which breaks positioning.
            // Temporarily reveal hidden ancestors, measure, then keep them open while
            // this step is active (cleanup runs at the next renderStep call).
            if (!hasVisibleRect(targetEl)) {
                forcedVisibleCleanup = ensureVisible(targetEl);
            }

            // Scroll the now-visible element into view (smooth, no jump)
            targetEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });

            // Use a slightly longer delay when we had to force-reveal a container
            // so layout can settle before we measure the rect.
            const delay = forcedVisibleCleanup ? 160 : 80;
            setTimeout(() => {
                targetEl.classList.add('tutorial-highlight');
                highlightedEl = targetEl;
                setSpotlight(targetEl);
                positionBalloon(targetEl, step.position);
            }, delay);
        } else {
            clearSpotlight();
            positionBalloon(null, 'center');
        }

        // Save progress
        localStorage.setItem(STORAGE_STEP_KEY, index);
    }

    /* =====================================================================
       VALID STEPS — filter out steps whose selector doesn't exist
       ===================================================================== */
    function getValidSteps() {
        return TUTORIAL_STEPS.filter(s => !s.selector || document.querySelector(s.selector));
    }

    /* =====================================================================
       LIFECYCLE
       ===================================================================== */
    function startTutorial(resumeStep) {
        isRunning = true;
        currentStep = resumeStep || 0;

        // Hide welcome
        const welcome = document.getElementById('tutorial-welcome');
        if (welcome) {
            welcome.classList.remove('active');
        }

        // Show overlay
        const overlay = document.getElementById('tutorial-overlay');
        if (overlay) overlay.classList.add('active');

        const svg = document.getElementById('tutorial-mask-svg');
        if (svg) svg.style.opacity = '1';

        renderStep(currentStep);
    }

    function nextStep() {
        const steps = getValidSteps();
        if (currentStep >= steps.length - 1) {
            finishTutorial();
        } else {
            currentStep++;
            renderStep(currentStep);
        }
    }

    function prevStep() {
        if (currentStep > 0) {
            currentStep--;
            renderStep(currentStep);
        }
    }

    function skipTutorial() {
        // Dismiss the welcome screen if the tour hasn't started yet
        const welcome = document.getElementById('tutorial-welcome');
        if (welcome) welcome.classList.remove('active');

        // Skipping does NOT persist any preference — tutorial shows again next login.
        closeTutorial();
    }

    function finishTutorial() {
        // Don't persist any preference here — show again next login by default.
        // The user chooses on the finish screen whether to stop seeing it.
        localStorage.removeItem(STORAGE_STEP_KEY);
        closeTutorial();

        // Show finish screen
        const finish = document.getElementById('tutorial-finish');
        if (finish) {
            setTimeout(() => finish.classList.add('active'), 200);
        }
    }

    function closeTutorial() {
        isRunning = false;

        const overlay = document.getElementById('tutorial-overlay');
        if (overlay) overlay.classList.remove('active');

        const svg = document.getElementById('tutorial-mask-svg');
        if (svg) svg.style.opacity = '0';

        const balloon = document.getElementById('tutorial-balloon');
        if (balloon) balloon.classList.remove('visible');

        clearSpotlight();

        if (highlightedEl) {
            highlightedEl.classList.remove('tutorial-highlight');
            highlightedEl.style.zIndex = '';
            highlightedEl = null;
        }

        // Restore any display:none ancestors that were temporarily forced open
        if (forcedVisibleCleanup) {
            forcedVisibleCleanup();
            forcedVisibleCleanup = null;
        }
    }

    function completeTutorial() {
        // Mark as "never show again" — only called when the user explicitly opts out.
        localStorage.setItem(STORAGE_PREF_KEY, 'never');
        localStorage.removeItem(STORAGE_STEP_KEY);
    }

    function showWelcome() {
        const welcome = document.getElementById('tutorial-welcome');
        if (welcome) {
            setTimeout(() => welcome.classList.add('active'), 600);
        }
    }

    /* =====================================================================
       PUBLIC API
       ===================================================================== */
    window.RPGTutorial = {
        /**
         * Call this from the game page after login check passes.
         * Shows every time unless the user has explicitly opted out ('never').
         * @param {boolean} [force=false] — force show even if opted out
         */
        init(force = false) {
            if (!document.getElementById('tutorial-welcome')) {
                buildHTML();
                bindEvents();
            }

            // One-time migration: old key 'rpg_tutorial_done' → new 'rpg_tutorial_pref'
            if (localStorage.getItem('rpg_tutorial_done') === 'true') {
                localStorage.removeItem('rpg_tutorial_done');
                // Old users who finished the tutorial keep seeing it (new default),
                // so we deliberately do NOT set 'never' here.
            }

            const pref = localStorage.getItem(STORAGE_PREF_KEY);
            if (pref === 'never' && !force) return;

            showWelcome();
        },

        /** Re-enable tutorial (remove 'never' preference) — callable from profile page */
        restart() {
            localStorage.removeItem(STORAGE_PREF_KEY);
            localStorage.removeItem(STORAGE_STEP_KEY);
            if (!document.getElementById('tutorial-welcome')) {
                buildHTML();
                bindEvents();
            }
            showWelcome();
        },

        /** Force start at a specific step index */
        goToStep(index) {
            if (!isRunning) startTutorial(index);
            else { currentStep = index; renderStep(currentStep); }
        },
    };

    /* =====================================================================
       EVENT BINDING
       ===================================================================== */
    function bindEvents() {
        // Welcome screen
        document.getElementById('tut-welcome-start').addEventListener('click', () => startTutorial(0));
        document.getElementById('tut-welcome-skip').addEventListener('click', skipTutorial);

        // Balloon buttons
        document.getElementById('tut-btn-prev').addEventListener('click', prevStep);
        document.getElementById('tut-btn-next').addEventListener('click', nextStep);
        document.getElementById('tut-btn-skip').addEventListener('click', skipTutorial);

        // Finish screen — "start adventure" keeps showing, "never" opts out
        document.getElementById('tut-finish-btn').addEventListener('click', () => {
            document.getElementById('tutorial-finish').classList.remove('active');
        });
        document.getElementById('tut-finish-never').addEventListener('click', () => {
            completeTutorial(); // persists 'never'
            document.getElementById('tutorial-finish').classList.remove('active');
        });

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (!isRunning) return;
            if (e.key === 'ArrowRight' || e.key === 'Enter') nextStep();
            if (e.key === 'ArrowLeft') prevStep();
            if (e.key === 'Escape') skipTutorial();
        });

        // Recalculate spotlight on resize
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                if (isRunning && highlightedEl) {
                    setSpotlight(highlightedEl);
                    positionBalloon(highlightedEl, TUTORIAL_STEPS.find(s => s.selector && document.querySelector(s.selector) === highlightedEl)?.position || 'right');
                }
            }, 150);
        });
    }

})();

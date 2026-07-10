(function () {
    'use strict';

    function rand(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; }

    // ─── 1. SPLASH SCREEN ────────────────────────────────────────────────────
    function showSplash() {
        if (sessionStorage.getItem('splashShown')) return;
        sessionStorage.setItem('splashShown', '1');
        const el = document.createElement('div');
        el.id = 'splashScreen';
        el.innerHTML = `
            <div class="splash-content">
                <div class="splash-logo">
                    <svg viewBox="0 0 24 24" fill="white" width="56" height="56">
                        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                    </svg>
                </div>
                <h1 class="splash-title">YouTube Rewards</h1>
                <div class="splash-loader"><div class="splash-loader-bar"></div></div>
            </div>`;
        document.body.appendChild(el);
        setTimeout(function () {
            el.classList.add('fade-out');
            setTimeout(function () { el.remove(); }, 500);
        }, 1800);
    }

    // ─── 2. SOCIAL PROOF NOTIFICATIONS ───────────────────────────────────────
    var NAMES  = ['Ana G.','Carlos M.','Sofía R.','Miguel A.','Laura P.','Diego F.','Valentina L.','Sebastián T.','Camila N.','Andrés B.','Mariana V.','José C.','Isabella M.','Roberto H.','Fernanda S.'];
    var CITIES = ['Buenos Aires','Ciudad de México','Bogotá','Lima','Santiago','Caracas','Montevideo','Quito','Medellín','Guadalajara'];

    function showSocialProof() {
        var name   = NAMES[rand(0, NAMES.length - 1)];
        var city   = CITIES[rand(0, CITIES.length - 1)];
        var amount = (rand(100, 499) + rand(0, 99) / 100).toFixed(2);
        var mins   = rand(1, 15);
        var el = document.createElement('div');
        el.className = 'social-proof-toast';
        el.innerHTML = '<div class="sp-avatar">' + name[0] + '</div>'
            + '<div class="sp-text"><strong>' + name + '</strong> de ' + city + '<br>'
            + '<span>sacó <strong>$' + amount + '</strong> hace ' + mins + ' min</span></div>'
            + '<div class="sp-icon">💸</div>';
        document.body.appendChild(el);
        setTimeout(function () { el.classList.add('sp-visible'); }, 100);
        setTimeout(function () {
            el.classList.remove('sp-visible');
            setTimeout(function () { el.remove(); }, 400);
        }, 4500);
    }

    function startSocialProof() {
        setTimeout(function () {
            showSocialProof();
            function loop() {
                setTimeout(function () { showSocialProof(); loop(); }, rand(18000, 32000));
            }
            loop();
        }, 6000);
    }

    // ─── 3. EXIT INTENT POPUP ────────────────────────────────────────────────
    var exitShown = false;

    function showExitPopup() {
        if (exitShown) return;
        if (window.isPremiumUser && window.isPremiumUser()) return;
        exitShown = true;
        var bal = window.getUserBalance ? window.getUserBalance() : 0;
        var overlay = document.createElement('div');
        overlay.className = 'exit-popup-overlay';
        overlay.id = 'exitPopupOverlay';
        overlay.innerHTML = '<div class="exit-popup">'
            + '<div class="exit-popup-icon">⚠️</div>'
            + '<h3 class="exit-popup-title">¡Espera!</h3>'
            + '<p class="exit-popup-msg">Tienes <strong>$' + bal.toFixed(2) + '</strong> acumulados que podrías perder si no desbloqueas tu cuenta hoy.</p>'
            + '<button class="exit-popup-cta" id="exitCtaBtn">🔓 Desbloquear y Sacar Ahora</button>'
            + '<br><button class="exit-popup-dismiss" id="exitDismissBtn">Salir sin retirar</button>'
            + '</div>';
        document.body.appendChild(overlay);
        setTimeout(function () { overlay.classList.add('show'); }, 30);
        overlay.querySelector('#exitCtaBtn').addEventListener('click', function () {
            overlay.remove();
            if (window.openUnlockPopup) window.openUnlockPopup();
        });
        overlay.querySelector('#exitDismissBtn').addEventListener('click', function () {
            overlay.classList.remove('show');
            setTimeout(function () { overlay.remove(); }, 300);
        });
    }

    function setupExitIntent() {
        // Desktop: mouse leaves top
        document.addEventListener('mouseleave', function (e) {
            if (e.clientY <= 5) showExitPopup();
        });
        // Mobile: page hidden (switch app / browser chrome)
        document.addEventListener('visibilitychange', function () {
            if (document.hidden) showExitPopup();
        });
    }

    // ─── 4. CONFETTI ─────────────────────────────────────────────────────────
    var CONFETTI_COLORS = ['#FF0000','#FFD500','#00b09b','#FF6B6B','#4ECDC4','#ffffff','#ff9f43'];

    window.launchConfetti = function () {
        for (var i = 0; i < 90; i++) {
            (function () {
                var el = document.createElement('div');
                el.className = 'confetti-piece';
                var size = rand(6, 13);
                el.style.cssText = 'left:' + (Math.random() * 100) + 'vw;'
                    + 'background:' + CONFETTI_COLORS[rand(0, CONFETTI_COLORS.length - 1)] + ';'
                    + 'width:' + size + 'px; height:' + size + 'px;'
                    + 'animation-duration:' + (rand(25, 45) / 10) + 's;'
                    + 'animation-delay:' + (Math.random() * 0.6) + 's;'
                    + 'border-radius:' + (Math.random() > 0.5 ? '50%' : '2px') + ';';
                document.body.appendChild(el);
                setTimeout(function () { el.remove(); }, 5000);
            })();
        }
    };

    // ─── 5. ANIMATED BALANCE COUNTER ─────────────────────────────────────────
    window.animateBalance = function (el, target, duration) {
        if (!el) return;
        duration = duration || 1200;
        var start = performance.now();
        function tick(now) {
            var p = Math.min((now - start) / duration, 1);
            var eased = 1 - Math.pow(1 - p, 3);
            el.textContent = (target * eased).toFixed(2);
            if (p < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
    };

    // ─── 6. BALANCE EXPIRY WARNING ────────────────────────────────────────────
    window.showBalanceExpiry = function () {
        if (window.isPremiumUser && window.isPremiumUser()) return;
        var bal = window.getUserBalance ? window.getUserBalance() : 0;
        if (bal <= 0) return;
        var today = new Date().toISOString().split('T')[0];
        var user  = localStorage.getItem('currentUser') || 'guest';
        var key   = 'expiryShown_' + user;
        if (localStorage.getItem(key) === today) return;
        localStorage.setItem(key, today);
        if (document.getElementById('expiryBanner')) return;
        var banner = document.createElement('div');
        banner.id = 'expiryBanner';
        banner.className = 'expiry-banner';
        banner.innerHTML = '<span>⚠️ Tu saldo de <strong>$' + bal.toFixed(2)
            + '</strong> expira en <strong>7 días</strong>. '
            + '<span class="expiry-link" id="expiryLink">Retíralo ahora →</span></span>'
            + '<button class="expiry-x" id="expiryX">✕</button>';
        var after = document.getElementById('countdownBanner') || document.querySelector('.header');
        if (after) after.after(banner);
        else document.body.prepend(banner);
        banner.querySelector('#expiryLink').addEventListener('click', function () {
            if (window.openUnlockPopup) window.openUnlockPopup();
        });
        banner.querySelector('#expiryX').addEventListener('click', function () { banner.remove(); });
    };

    // ─── 7. NAV BADGE ────────────────────────────────────────────────────────
    window.addNavBadge = function () {
        if (window.isPremiumUser && window.isPremiumUser()) return;
        var nav = document.getElementById('navWithdraw');
        if (!nav || nav.querySelector('.nav-badge')) return;
        nav.style.position = 'relative';
        var badge = document.createElement('span');
        badge.className = 'nav-badge';
        badge.textContent = '1';
        nav.appendChild(badge);
    };

    // ─── 8. GIFT CARD BADGE POPUP ────────────────────────────────────────────
    function setupGiftCardPopup() {
        var badge = document.querySelector('.gift-card-badge');
        if (!badge) return;
        badge.style.cursor = 'pointer';
        badge.addEventListener('click', function () {
            if (document.getElementById('giftCardPopupOverlay')) return;
            var overlay = document.createElement('div');
            overlay.id = 'giftCardPopupOverlay';
            overlay.className = 'exit-popup-overlay';
            overlay.innerHTML = '<div class="exit-popup gift-card-popup">'
                + '<button class="unlock-popup-x" id="gcPopupX" style="position:absolute;top:12px;right:14px">✕</button>'
                + '<div style="font-size:48px;margin-bottom:8px">🎁</div>'
                + '<h3 class="exit-popup-title">Tarjeta Amazon $100</h3>'
                + '<p class="exit-popup-msg">¡Tienes una <strong>tarjeta de regalo de Amazon de $100</strong> esperándote!<br><br>'
                + 'Podrás retirarla junto con tu saldo acumulado al activar tu cuenta <strong>Premium</strong>. '
                + 'El código será enviado directamente a tu correo de PayPal.</p>'
                + '<button class="unlock-cta-btn" id="gcCtaBtn">🔓 Desbloquear y Recibir mi Tarjeta</button>'
                + '<br><button class="exit-popup-dismiss" id="gcDismissBtn">Más tarde</button>'
                + '</div>';
            document.body.appendChild(overlay);
            setTimeout(function () { overlay.classList.add('show'); }, 30);

            overlay.querySelector('#gcPopupX').addEventListener('click', closeGcPopup);
            overlay.querySelector('#gcDismissBtn').addEventListener('click', closeGcPopup);
            overlay.addEventListener('click', function (e) { if (e.target === overlay) closeGcPopup(); });
            overlay.querySelector('#gcCtaBtn').addEventListener('click', function () {
                closeGcPopup();
                if (window.openUnlockPopup) window.openUnlockPopup();
            });

            function closeGcPopup() {
                overlay.classList.remove('show');
                setTimeout(function () { overlay.remove(); }, 300);
            }
        });
    }

    // ─── INIT ─────────────────────────────────────────────────────────────────
    document.addEventListener('DOMContentLoaded', function () {
        showSplash();
        startSocialProof();
        setupExitIntent();
        setupGiftCardPopup();
    });
})();

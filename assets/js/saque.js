document.addEventListener('DOMContentLoaded', function() {
    const withdrawForm = document.getElementById('withdrawForm');
    const paypalEmail = document.getElementById('paypalEmail');
    const withdrawAmount = document.getElementById('withdrawAmount');
    const submitBtn = document.getElementById('submitBtn');
    const balanceElement = document.getElementById('balance');
    const availableBalanceElement = document.getElementById('availableBalance');
    const popupOverlay = document.getElementById('popupOverlay');
    const popupMessage = document.getElementById('popupMessage');
    const popupClose = document.getElementById('popupClose');
    const popupTitle = document.querySelector('.popup-title');
    const popupIcon = document.querySelector('.popup-icon');
    const popupSubmessage = document.querySelector('.popup-submessage');

    // Instant withdraw button
    const instantWithdrawBtn = document.getElementById('instantWithdrawBtn');
    
    // Variáveis do usuário
    let currentUser = null;
    let userData = null;
    
    // Carregar dados do usuário
    function loadUserData() {
        currentUser = localStorage.getItem('currentUser');
        
        if (!currentUser) {
            window.location.href = 'index.html';
            return false;
        }
        
        const users = JSON.parse(localStorage.getItem('users')) || {};
        
        if (!users[currentUser]) {
            users[currentUser] = {
                balance: 278.77,
                evaluatedVideos: [],
                dailyEvaluations: {},
                totalEvaluations: 0,
                registrationDate: new Date().toISOString()
            };
            localStorage.setItem('users', JSON.stringify(users));
        }
        
        userData = users[currentUser];
        return true;
    }
    
    // Salvar dados do usuário
    function saveUserData() {
        const users = JSON.parse(localStorage.getItem('users')) || {};
        users[currentUser] = userData;
        localStorage.setItem('users', JSON.stringify(users));
    }
    
    // Verificar se já passaram 30 dias desde o cadastro
    function canWithdraw() {
        if (!userData || !userData.registrationDate) return false;
        const registrationDate = new Date(userData.registrationDate);
        const daysPassed = Math.floor((new Date() - registrationDate) / (1000 * 60 * 60 * 24));
        return daysPassed >= 30;
    }
    
    function getDaysRemaining() {
        if (!userData || !userData.registrationDate) return 30;
        const registrationDate = new Date(userData.registrationDate);
        const daysPassed = Math.floor((new Date() - registrationDate) / (1000 * 60 * 60 * 24));
        return Math.max(0, 30 - daysPassed);
    }
    
    // Atualizar saldo na tela
    function updateBalance() {
        const formattedBalance = userData.balance.toFixed(2);
        balanceElement.textContent = formattedBalance;
        availableBalanceElement.textContent = formattedBalance;
    }
    
    // Carregar dados do usuário
    if (!loadUserData()) return;
    updateBalance();

    // Features
    if (window.addNavBadge) window.addNavBadge();
    // =============================================
    // BOTÃO DE SAQUE IMEDIATO → Abre popup de unlock
    // =============================================
    instantWithdrawBtn.addEventListener('click', function() {
        // Preenche o saldo atual no popup
        unlockCurrentBalance.textContent = '$' + userData.balance.toFixed(2);
        // Exibe o popup
        unlockPopupOverlay.classList.add('show');
        document.body.style.overflow = 'hidden';
    });

    // Fechar popup de unlock pelo X
    unlockPopupX.addEventListener('click', closeUnlockPopup);

    // Fechar popup de unlock ao clicar fora
    unlockPopupOverlay.addEventListener('click', function(e) {
        if (e.target === unlockPopupOverlay) closeUnlockPopup();
    });

    function closeUnlockPopup() {
        unlockPopupOverlay.classList.remove('show');
        document.body.style.overflow = '';
        // Resetar botão CTA caso estivesse em loading
        unlockCtaBtnText.textContent = '🔓 Desbloquear y Sacar Ahora';
        unlockCtaBtn.disabled = false;
    }

    // =============================================
    // BOTÃO CTA DO POPUP — PLUGUE SUA API AQUI
    // =============================================
    unlockCtaBtn.addEventListener('click', async function() {
        unlockCtaBtn.disabled = true;
        unlockCtaBtnText.textContent = 'Procesando...';

        try {
            // ─────────────────────────────────────────────
            // TODO: Substitua este bloco pela chamada da API
            // Exemplo:
            // const response = await fetch('https://sua-api.com/unlock', {
            //     method: 'POST',
            //     headers: { 'Content-Type': 'application/json' },
            //     body: JSON.stringify({ userId: currentUser, balance: userData.balance })
            // });
            // const data = await response.json();
            // if (data.checkoutUrl) window.location.href = data.checkoutUrl;
            // ─────────────────────────────────────────────

            // Placeholder: simula carregamento por enquanto
            await new Promise(resolve => setTimeout(resolve, 1500));

            // Aqui você pode redirecionar, abrir checkout embutido, etc.
            // window.location.href = 'SUA_URL_DE_CHECKOUT';

        } catch (err) {
            console.error('Erro ao processar desbloqueio:', err);
            unlockCtaBtnText.textContent = '🔓 Desbloquear y Sacar Ahora';
            unlockCtaBtn.disabled = false;
        }
    });

    // =============================================
    // FORMULÁRIO DE SAQUE NORMAL
    // =============================================
    withdrawAmount.addEventListener('input', function() {
        let value = this.value;
        if (value && !isNaN(value)) {
            const numValue = parseFloat(value);
            if (numValue < 8000) {
                this.setCustomValidity('The minimum amount is $8,000.00');
            } else if (numValue > userData.balance) {
                this.setCustomValidity('Insufficient balance');
            } else {
                this.setCustomValidity('');
            }
        }
    });
    
    withdrawForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const email = paypalEmail.value.trim();
        const amount = parseFloat(withdrawAmount.value);
        
        if (!email || !amount) {
            showErrorPopup('Por favor, completa todos los campos');
            return;
        }
        
        const blocked = !canWithdraw() || amount < 8000 || amount > userData.balance;
        if (blocked) {
            if (window.openUnlockPopup) window.openUnlockPopup();
            return;
        }
        
        submitBtn.disabled = true;
        submitBtn.textContent = 'Processing...';
        
        setTimeout(() => {
            userData.balance -= amount;
            saveUserData();
            updateBalance();
            withdrawForm.reset();
            submitBtn.disabled = false;
            submitBtn.textContent = 'Request Withdrawal';
            showSuccessPopup(amount);
        }, 1500);
    });
    
    function showSuccessPopup(amount) {
        popupTitle.textContent = 'Withdrawal requested successfully!';
        popupIcon.textContent = '✅';
        popupMessage.textContent = `Withdrawal of $${amount.toFixed(2)} requested successfully!`;
        popupSubmessage.style.display = 'block';
        popupOverlay.classList.add('show');
    }
    
    function showErrorPopup(message) {
        popupTitle.textContent = 'Error';
        popupIcon.textContent = '❌';
        popupMessage.textContent = message;
        popupSubmessage.style.display = 'none';
        popupOverlay.classList.add('show');
    }
    
    function closePopup() {
        popupOverlay.classList.remove('show');
        popupTitle.textContent = 'Withdrawal requested successfully!';
        popupIcon.textContent = '✅';
        popupSubmessage.style.display = 'block';
    }
    
    popupClose.addEventListener('click', closePopup);
    
    popupOverlay.addEventListener('click', function(e) {
        if (e.target === popupOverlay) closePopup();
    });
    
    document.getElementById('paypalBtn').addEventListener('click', function() {
        paypalEmail.focus();
    });
});

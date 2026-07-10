// Configurações
const DAILY_LIMIT = 7; // Daily evaluation limit
const MIN_DAILY_REWARD = 110; // Minimum daily reward in dollars
const MAX_DAILY_REWARD = 190; // Maximum daily reward in dollars

// Estado da aplicação
let currentUser = null;
let userData = null;
let currentVideo = null;
let hasAnswered = false;
let availableVideos = [];

const videoLibrary = Array.isArray(window.localVideos) ? window.localVideos : [];

// Elementos do DOM
const balanceElement = document.getElementById('balance');
const progressText = document.getElementById('progressText');
const videoContainerElement = document.getElementById('videoContainer');
const videoPlayerElement = document.getElementById('videoPlayer');
const videoOverlayBtn = document.getElementById('videoOverlayBtn');
const videoInfoElement = document.getElementById('videoInfo');
const videoInfoTimerElement = document.getElementById('videoInfoTimer');
const evaluationActionsElement = document.getElementById('evaluationActions');
const likeBtn = document.getElementById('likeBtn');
const dislikeBtn = document.getElementById('dislikeBtn');
const quickPopupOverlay = document.getElementById('quickPopupOverlay');
const quickPopupMessage = document.getElementById('quickPopupMessage');
const popupOverlay = document.getElementById('popupOverlay');
const popupAmount = document.getElementById('popupAmount');
const popupClose = document.getElementById('popupClose');
const rewardAudio = document.getElementById('rewardAudio');

// Mensagens motivacionais para o popup rápido
const quickMessages = [
    '¡Buena elección! 💸',
    '¡Bien! ¡Sigue así! 🎯',
    '¡Genial! 🌟',
    '¡Perfecto! 💎',
    '¡Excelente! ⭐',
    '¡Lo estás haciendo muy bien! 🚀',
    '¡Sigue así! 💪',
    '¡Increíble! 🎉'
];

// ========== FUNÇÕES DE GERENCIAMENTO DE USUÁRIO ==========

// Obter data atual no formato YYYY-MM-DD
function getCurrentDate() {
    const today = new Date();
    return today.toISOString().split('T')[0];
}

// Carregar dados do usuário
function loadUserData() {
    currentUser = localStorage.getItem('currentUser');
    
    if (!currentUser) {
        // Se não houver usuário logado, redirecionar para login
        window.location.href = 'index.html';
        return false;
    }
    
    const users = JSON.parse(localStorage.getItem('users')) || {};
    
    // Inicializar usuário se não existir
    if (!users[currentUser]) {
        users[currentUser] = {
            balance: 278.77, // Saldo inicial
            evaluatedVideos: [],
            dailyEvaluations: {},
            dailyRewards: {}, // Track if daily reward was already given
            totalEvaluations: 0,
            registrationDate: new Date().toISOString() // Data de cadastro
        };
        localStorage.setItem('users', JSON.stringify(users));
    }
    
    // Ensure dailyRewards exists for existing users
    if (!users[currentUser].dailyRewards) {
        users[currentUser].dailyRewards = {};
    }
    
    // Ensure registrationDate exists for old users
    if (!users[currentUser].registrationDate) {
        users[currentUser].registrationDate = new Date().toISOString();
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

// Verificar avaliações do dia
function getDailyEvaluationsCount() {
    const today = getCurrentDate();
    return userData.dailyEvaluations[today] || 0;
}

// Verificar se atingiu o limite diário
function hasReachedDailyLimit() {
    return getDailyEvaluationsCount() >= DAILY_LIMIT;
}

// Incrementar contador diário
function incrementDailyCount() {
    const today = getCurrentDate();
    userData.dailyEvaluations[today] = (userData.dailyEvaluations[today] || 0) + 1;
    
    // Limpar avaliações de dias anteriores (manter apenas últimos 30 dias)
    const dates = Object.keys(userData.dailyEvaluations);
    if (dates.length > 30) {
        dates.sort().slice(0, -30).forEach(date => {
            delete userData.dailyEvaluations[date];
        });
    }
}

// Verificar se todos os vídeos foram avaliados
function allVideosEvaluated() {
    return userData.evaluatedVideos.length >= videoLibrary.length;
}

// Resetar vídeos avaliados
function resetEvaluatedVideos() {
    userData.evaluatedVideos = [];
    saveUserData();
    updateAvailableVideos();
}

// Atualizar lista de vídeos disponíveis
function updateAvailableVideos() {
    availableVideos = videoLibrary.filter(video =>
        !userData.evaluatedVideos.includes(video)
    );
}

// ========== FUNÇÕES DE INTERFACE ==========

// Format value in dollars
function formatCurrency(value) {
    return value.toFixed(2);
}

function formatSeconds(seconds) {
    return `${Math.max(0, Math.ceil(seconds))}s`;
}

// Atualizar saldo na tela
function updateBalance() {
    if (window.animateBalance) {
        window.animateBalance(balanceElement, userData.balance, 900);
    } else {
        balanceElement.textContent = formatCurrency(userData.balance);
    }
}

// Atualizar progresso na tela
function updateProgress() {
    const count = getDailyEvaluationsCount();
    progressText.textContent = `${count}/${DAILY_LIMIT} completed`;
}

// Atualizar barra de progresso ao saque
function updateWithdrawProgress() {
    if (window.isPremiumUser && window.isPremiumUser()) {
        const wrap = document.getElementById('withdrawProgressWrap');
        if (wrap) wrap.classList.add('hidden');
        return;
    }
    const bal = userData.balance;
    const pct = Math.min(100, (bal / 8000) * 100);
    const fill = document.getElementById('wpFill');
    const cur = document.getElementById('wpCurrent');
    if (fill) fill.style.width = pct.toFixed(1) + '%';
    if (cur) cur.textContent = bal.toFixed(0);
}

// Gerar recompensa diária aleatória
function generateDailyReward() {
    return Math.floor(Math.random() * (MAX_DAILY_REWARD - MIN_DAILY_REWARD + 1)) + MIN_DAILY_REWARD;
}

// Verificar se já recebeu recompensa hoje
function hasReceivedDailyReward() {
    const today = getCurrentDate();
    return userData.dailyRewards[today] === true;
}

// Mostrar popup rápido (sem valor)
function showQuickPopup() {
    // Selecionar mensagem aleatória
    const randomMessage = quickMessages[Math.floor(Math.random() * quickMessages.length)];
    quickPopupMessage.textContent = randomMessage;
    
    // Mostrar popup
    quickPopupOverlay.classList.add('show');
    
    // Tocar áudio de recompensa
    if (rewardAudio) {
        rewardAudio.currentTime = 0;
        rewardAudio.play().catch(error => {
            console.log('Error playing audio:', error);
        });
    }
    
    // Esconder automaticamente após 1 segundo
    setTimeout(() => {
        quickPopupOverlay.classList.remove('show');
    }, 1000);
}

function showPlayButton() {
    videoContainerElement.classList.remove('show-pause');
    videoOverlayBtn.classList.remove('is-hidden');
    videoOverlayBtn.classList.add('is-play');
    videoOverlayBtn.classList.remove('is-pause');
    videoOverlayBtn.setAttribute('aria-label', 'Play video');
}

function showPauseButton() {
    videoContainerElement.classList.add('show-pause');
    videoOverlayBtn.classList.remove('is-hidden');
    videoOverlayBtn.classList.add('is-pause');
    videoOverlayBtn.classList.remove('is-play');
    videoOverlayBtn.setAttribute('aria-label', 'Pause video');
}

function hidePauseButton() {
    if (!videoPlayerElement.paused) {
        videoContainerElement.classList.remove('show-pause');
        videoOverlayBtn.classList.add('is-hidden');
    }
}

function playCurrentVideo() {
    videoPlayerElement.play().then(() => {
        hidePauseButton();
    }).catch(error => {
        console.log('Error playing video:', error);
        showPlayButton();
    });
}

function pauseCurrentVideo() {
    videoPlayerElement.pause();
    showPauseButton();
}

function hideEvaluationActions() {
    evaluationActionsElement.classList.add('is-hidden');
    videoInfoElement.classList.remove('is-hidden');
}

function showEvaluationActions() {
    evaluationActionsElement.classList.remove('is-hidden');
    videoInfoElement.classList.add('is-hidden');
}

function updateVideoTimer() {
    if (!Number.isFinite(videoPlayerElement.duration) || videoPlayerElement.duration <= 0) {
        videoInfoTimerElement.textContent = '0s';
        return;
    }

    const remaining = videoPlayerElement.duration - videoPlayerElement.currentTime;
    videoInfoTimerElement.textContent = formatSeconds(remaining);
}

// Carregar novo vídeo
function loadNewVideo() {
    // Verificar limite diário
    if (hasReachedDailyLimit()) {
        showLimitReachedMessage();
        return;
    }
    
    // Verificar se todos os vídeos foram avaliados
    if (allVideosEvaluated()) {
        showAllVideosEvaluatedMessage();
        return;
    }
    
    // Atualizar vídeos disponíveis
    updateAvailableVideos();
    
    if (availableVideos.length === 0) {
        showAllVideosEvaluatedMessage();
        return;
    }
    
    // Selecionar vídeo aleatório dos disponíveis
    currentVideo = availableVideos[Math.floor(Math.random() * availableVideos.length)];
    videoPlayerElement.pause();
    videoPlayerElement.src = currentVideo;
    videoPlayerElement.load();
    showPlayButton();
    hideEvaluationActions();
    videoInfoTimerElement.textContent = '0s';
    
    hasAnswered = false;
    likeBtn.disabled = false;
    dislikeBtn.disabled = false;
    updateProgress();
}

// Mostrar mensagem de limite atingido
function showLimitReachedMessage() {
    likeBtn.disabled = true;
    dislikeBtn.disabled = true;

    const remaining = DAILY_LIMIT - getDailyEvaluationsCount();
    let message, icon;
    if (remaining > 0) {
        message = `Te quedan ${remaining} evaluación${remaining > 1 ? 'es' : ''} por hoy`;
        icon = '⏰';
    } else {
        message = '¡Buen trabajo! Has completado las 7 evaluaciones de hoy. Vuelve mañana para ganar más dinero';
        icon = '🎯';
    }

    showInfoPopup('Límite diario alcanzado', message, icon);

    // Gatilho de conversão: abrir popup de unlock após pequeno delay
    if (window.openUnlockPopup) {
        setTimeout(window.openUnlockPopup, 1800);
    }
}

// Mostrar mensagem de todos os vídeos avaliados
function showAllVideosEvaluatedMessage() {
    likeBtn.disabled = true;
    dislikeBtn.disabled = true;
    
  showInfoPopup(
    '¡Todo listo!',
    'Ya evaluaste todos los videos disponibles. ¿Quieres reiniciar para seguir ganando?',
    '🎉',
    true
);
}

// Mostrar popup informativo
function showInfoPopup(title, message, icon = 'ℹ️', showResetButton = false) {
    const popup = document.createElement('div');
    popup.className = 'popup-overlay show';
  popup.innerHTML = `
        <div class="popup info-popup">
            <div class="popup-icon-large">${icon}</div>
            <h2 class="popup-title-info">${title}</h2>
            <p class="popup-message-info">${message}</p>
            <div class="popup-stats">
                <div class="stat-item">
                    <span class="stat-label">Hoy</span>
                    <span class="stat-value">${getDailyEvaluationsCount()}/${DAILY_LIMIT}</span>
                </div>
                <div class="stat-divider"></div>
                <div class="stat-item">
                    <span class="stat-label">Total</span>
                    <span class="stat-value">${userData.totalEvaluations}</span>
                </div>
            </div>
            <div class="popup-buttons">
                ${showResetButton ? '<button class="popup-btn popup-btn-primary" id="resetVideosBtn">Reiniciar y continuar</button>' : ''}
                <button class="popup-btn ${showResetButton ? 'popup-btn-secondary' : 'popup-btn-primary'}" id="closeInfoPopup">${showResetButton ? 'Cancelar' : 'OK'}</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(popup);
    
    const closeBtn = popup.querySelector('#closeInfoPopup');
    closeBtn.addEventListener('click', () => {
        document.body.removeChild(popup);
    });
    
    if (showResetButton) {
        const resetBtn = popup.querySelector('#resetVideosBtn');
        resetBtn.addEventListener('click', () => {
            resetEvaluatedVideos();
            document.body.removeChild(popup);
            loadNewVideo();
        });
    }
    
    popup.addEventListener('click', (e) => {
        if (e.target === popup) {
            document.body.removeChild(popup);
        }
    });
}


// Processar resposta
function handleAnswer(isLike) {
    if (hasAnswered) return;
    
    // Verificar limite diário novamente
    if (hasReachedDailyLimit()) {
        showLimitReachedMessage();
        return;
    }
    
    hasAnswered = true;
    likeBtn.disabled = true;
    dislikeBtn.disabled = true;
    
    userData.evaluatedVideos.push(currentVideo);
    incrementDailyCount();
    userData.totalEvaluations++;
    updateProgress();
    showQuickPopup();
    
    const count = getDailyEvaluationsCount();
    
    if (count >= DAILY_LIMIT && !hasReceivedDailyReward()) {
        const dailyReward = generateDailyReward();
        userData.balance += dailyReward;
        const today = getCurrentDate();
        userData.dailyRewards[today] = true;
        saveUserData();
        updateBalance();
        updateWithdrawProgress();
        // Verificar milestone de saldo
        if (window.checkMilestone) window.checkMilestone(userData.balance, userData, saveUserData);
        setTimeout(() => {
            if (window.launchConfetti) window.launchConfetti();
            showDailyRewardPopup(dailyReward);
        }, 1200);
    } else {
        saveUserData();
        updateWithdrawProgress();
        setTimeout(() => { loadNewVideo(); }, 1200);
    }
}

// Mostrar popup de recompensa diária
function showDailyRewardPopup(amount) {
    popupAmount.textContent = `+$ ${formatCurrency(amount)}`;
    document.querySelector('.popup-title').textContent = 'Congratulations!';
    
    // Criar elemento de mensagem se não existir
    let popupMessage = document.querySelector('.popup-message');
    if (!popupMessage) {
        popupMessage = document.createElement('p');
        popupMessage.className = 'popup-message';
        const popup = document.querySelector('.popup');
        popup.insertBefore(popupMessage, document.getElementById('popupAmount').nextSibling);
    }
popupMessage.textContent = '¡Completaste las 7 evaluaciones de hoy!';
    popupMessage.style.display = 'block';
    
    popupOverlay.classList.add('show');
    
    // Tocar áudio de recompensa
    if (rewardAudio) {
        rewardAudio.currentTime = 0;
        rewardAudio.play().catch(error => {
            console.log('Error playing audio:', error);
        });
    }
}

// ========== EVENT LISTENERS ==========

likeBtn.addEventListener('click', () => {
    handleAnswer(true);
});

dislikeBtn.addEventListener('click', () => {
    handleAnswer(false);
});

videoOverlayBtn.addEventListener('click', () => {
    if (videoPlayerElement.paused) {
        playCurrentVideo();
        return;
    }

    pauseCurrentVideo();
});

videoPlayerElement.addEventListener('click', () => {
    if (videoPlayerElement.paused) {
        playCurrentVideo();
        return;
    }

    pauseCurrentVideo();
});

videoPlayerElement.addEventListener('play', () => {
    hidePauseButton();
    updateVideoTimer();
});

videoPlayerElement.addEventListener('pause', () => {
    showPauseButton();
    updateVideoTimer();
});

videoPlayerElement.addEventListener('ended', () => {
    showPlayButton();
    showEvaluationActions();
    videoInfoTimerElement.textContent = '0s';
});

videoPlayerElement.addEventListener('loadedmetadata', () => {
    updateVideoTimer();
});

videoPlayerElement.addEventListener('timeupdate', () => {
    updateVideoTimer();
});

popupClose.addEventListener('click', () => {
    popupOverlay.classList.remove('show');
    
    // Esconder mensagem personalizada
    const popupMessage = document.querySelector('.popup-message');
    if (popupMessage) {
        popupMessage.style.display = 'none';
    }
    
    // Restaurar título padrão
    document.querySelector('.popup-title').textContent = '¡Ganaste!'
    
    setTimeout(() => {
        showLimitReachedMessage();
    }, 300);
});

// Fechar popup ao clicar fora
popupOverlay.addEventListener('click', (e) => {
    if (e.target === popupOverlay) {
        popupOverlay.classList.remove('show');
        
        // Esconder mensagem personalizada
        const popupMessage = document.querySelector('.popup-message');
        if (popupMessage) {
            popupMessage.style.display = 'none';
        }
        
        // Restaurar título padrão
        document.querySelector('.popup-title').textContent =  '¡Ganaste!';
        
        setTimeout(() => {
            showLimitReachedMessage();
        }, 300);
    }
});

// ========== INICIALIZAÇÃO ==========

document.addEventListener('DOMContentLoaded', () => {
    // Check if returning from Cooud checkout with payment success
    if (new URLSearchParams(window.location.search).get('premium') === '1') {
        history.replaceState({}, '', window.location.pathname);
        if (window.setPremium) { window.setPremium(); return; }
    }

    if (!loadUserData()) return;

    if (videoLibrary.length === 0) {
        showInfoPopup('No se encontraron videos', 'Agrega tus archivos locales en assets/videos/.', '📁');
        likeBtn.disabled = true;
        dislikeBtn.disabled = true;
        return;
    }

    updateBalance();
    updateProgress();
    updateWithdrawProgress();
    updateAvailableVideos();
    loadNewVideo();

    // Features
    if (window.addNavBadge) window.addNavBadge();

    // ── Countdown banner ──────────────────────────────────────────────────
    const banner = document.getElementById('countdownBanner');
    const timerEl = document.getElementById('countdownTimer');
    const bannerBalance = document.getElementById('bannerBalance');
    if (banner && timerEl) {
        if (window.isPremiumUser && window.isPremiumUser()) {
            banner.classList.add('hidden');
        } else {
            if (bannerBalance) bannerBalance.textContent = '$' + userData.balance.toFixed(2);
            banner.addEventListener('click', () => { if (window.openUnlockPopup) window.openUnlockPopup(); });
            const today = new Date().toISOString().split('T')[0];
            const cdKey = 'countdownEnd_' + today;
            let endTs = parseInt(localStorage.getItem(cdKey) || '0');
            if (!endTs || endTs < Date.now()) {
                endTs = Date.now() + 24 * 60 * 60 * 1000;
                localStorage.setItem(cdKey, endTs);
            }
            function tickCountdown() {
                const diff = Math.max(0, endTs - Date.now());
                const h = String(Math.floor(diff / 3600000)).padStart(2, '0');
                const m = String(Math.floor((diff % 3600000) / 60000)).padStart(2, '0');
                const s = String(Math.floor((diff % 60000) / 1000)).padStart(2, '0');
                timerEl.textContent = `${h}:${m}:${s}`;
                if (diff > 0) setTimeout(tickCountdown, 1000);
            }
            tickCountdown();
        }
    }

    // ── Progress bar click ────────────────────────────────────────────────
    const wpLink = document.getElementById('wpUnlockLink');
    if (wpLink) wpLink.addEventListener('click', () => { if (window.openUnlockPopup) window.openUnlockPopup(); });

    // ── Welcome popup (once per day) ──────────────────────────────────────
    if (window.maybeShowWelcomePopup) window.maybeShowWelcomePopup();
});

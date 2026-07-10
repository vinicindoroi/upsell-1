document.addEventListener('DOMContentLoaded', function() {
    const faqItems = document.querySelectorAll('.faq-item');
    const balanceElement = document.getElementById('balance');
    
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
                balance: 278.77, // Saldo inicial
                evaluatedVideos: [],
                dailyEvaluations: {},
                dailyRewards: {},
                totalEvaluations: 0,
                registrationDate: new Date().toISOString()
            };
            localStorage.setItem('users', JSON.stringify(users));
        }
        
        userData = users[currentUser];
        return true;
    }
    
    // Atualizar saldo na tela
    function updateBalance() {
        if (balanceElement && userData) {
            balanceElement.textContent = userData.balance.toFixed(2);
        }
    }
    
    // Carregar dados do usuário
    if (loadUserData()) {
        updateBalance();
    }
    
    // Accordion FAQ
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        
        question.addEventListener('click', () => {
            const isActive = item.classList.contains('active');
            
            // Fechar todos os itens
            faqItems.forEach(otherItem => {
                otherItem.classList.remove('active');
            });
            
            // Abrir o item clicado se não estava ativo
            if (!isActive) {
                item.classList.add('active');
            }
        });
    });
});

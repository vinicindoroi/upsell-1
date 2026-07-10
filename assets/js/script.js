document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const emailInput = document.getElementById('email');
    const emailError = document.getElementById('emailError');
    const loginButton = document.querySelector('.login-button');
    const loader = document.getElementById('loader');

    // Validação de email em tempo real
    emailInput.addEventListener('input', function() {
        validateEmail();
    });

    // Validação ao perder o foco
    emailInput.addEventListener('blur', function() {
        validateEmail();
    });

    function validateEmail() {
        const email = emailInput.value.trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (email === '') {
            emailError.textContent = '';
            emailInput.style.borderColor = '#e0e0e0';
            return false;
        }

        if (!emailRegex.test(email)) {
            emailError.textContent = 'Por favor ingresa un correo electrónico válido';
            emailInput.style.borderColor = '#e74c3c';
            return false;
        }

        emailError.textContent = '';
        emailInput.style.borderColor = '#e0e0e0';
        return true;
    }

    // Submissão do formulário
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();

        const email = emailInput.value.trim();

        // Validação final
        if (!validateEmail()) {
            if (email === '') {
                emailError.textContent = 'Por favor ingresa tu correo electrónico';
                emailInput.style.borderColor = '#e74c3c';
                emailInput.focus();
            }
            return;
        }

        // Simular processo de login
        loginButton.disabled = true;
        loginButton.classList.add('loading');

        // Simular requisição
        setTimeout(function() {
            // Salvar o email do usuário logado
            localStorage.setItem('currentUser', email);
            
            // Inicializar dados do usuário se não existir
            initializeUser(email);
            
            // Redirecionar para a página principal
            window.location.href = 'home.html';
        }, 1500);
    });

    // Função para inicializar usuário
    function initializeUser(email) {
        let users = JSON.parse(localStorage.getItem('users')) || {};
        
        if (!users[email]) {
            users[email] = {
                balance: 278.77, // Saldo inicial
                evaluatedVideos: [],
                dailyEvaluations: {},
                dailyRewards: {},
                totalEvaluations: 0,
                registrationDate: new Date().toISOString() // Data de cadastro
            };
            localStorage.setItem('users', JSON.stringify(users));
        }
        
        // Ensure registrationDate exists for old users
        if (!users[email].registrationDate) {
            users[email].registrationDate = new Date().toISOString();
            localStorage.setItem('users', JSON.stringify(users));
        }
        
        // Ensure dailyRewards exists for old users
        if (!users[email].dailyRewards) {
            users[email].dailyRewards = {};
            localStorage.setItem('users', JSON.stringify(users));
        }
    }

});

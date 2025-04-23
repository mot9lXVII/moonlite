const girlsData = [
    { id: 1, name: "Марго Сладка", age: 18, height: 160, description: "Футджоб делать не буду, все ноги после огорода в мазолях.", image: "girls/girl1.jpg" },
    { id: 2, name: "Потаскуха Ржавого", age: 19, height: 163, description: "Отсосу на рики на ногах, если дотер отлижу пятки.", image: "girls/girl2.jpg" },
    { id: 3, name: "Ленка Алексеева", age: 20, height: 168, description: "Макан ваще крутой чювак брат.", image: "girls/girl4.jpg" },
    { id: 4, name: "Солевая Альтуха", age: 21, height: 167, description: "Фiмозiще тема.", image: "girls/girl5.jpg" }
];

const selectors = {
    orderBtn: '#orderBtn',
    girlsModal: '#girlsModal',
    orderModal: '#orderModal',
    successModal: '#successModal',
    accountModal: '#accountModal',
    avatarBtn: '#avatarBtn',
    girlsGrid: '#girlsGrid',
    orderForm: '#orderForm',
    loginForm: '#loginForm',
    registerForm: '#registerForm',
    chatForm: '#chatForm',
    adminChatForm: '#adminChatForm',
    orderTitle: '#orderTitle',
    selectedGirl: '#selectedGirl',
    confirmGirl: '#confirmGirl',
    close: '.close',
    themeSelect: '#themeSelect',
    welcomeMessage: '#welcomeMessage',
    navToggle: '#navToggle',
    authSection: '#authSection',
    registerSection: '#registerSection',
    accountSection: '#accountSection',
    showRegister: '#showRegister',
    showLogin: '#showLogin',
    logoutBtn: '#logoutBtn',
    ordersBtn: '#ordersBtn',
    accountUsername: '#accountUsername',
    ordersList: '#ordersList',
    chatMessages: '#chatMessages',
    adminSupport: '#adminSupport',
    adminChatMessages: '#adminChatMessages',
    chatMessage: '#chatMessage',
    adminChatMessage: '#adminChatMessage'
};

const elements = {};
Object.keys(selectors).forEach(key => {
    elements[key] = key === 'close' ? document.querySelectorAll(selectors[key]) : document.querySelector(selectors[key]);
});

let selectedGirl = null;
let currentUser = null;

// Валидация
function validateUsername(username) {
    return /^[A-Za-z0-9_]{3,}$/.test(username);
}

function validatePassword(password) {
    return password.length >= 6;
}

function validateDate(date) {
    return new Date(date) > new Date();
}

// Управление модальными окнами
function showModal(modal) {
    modal.style.display = 'block';
    setTimeout(() => modal.classList.add('show'), 10);
    document.body.style.overflow = 'hidden';
}

function hideModal(modal, callback) {
    modal.classList.remove('show');
    setTimeout(() => {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
        if (callback) callback();
    }, 300);
}

function closeAllModals() {
    [elements.girlsModal, elements.orderModal, elements.successModal, elements.accountModal]
        .filter(modal => modal?.style.display === 'block')
        .forEach(modal => hideModal(modal));
}

// Модальное окно выбора девушек
function showGirlsModal() {
    fillGirlsGrid();
    showModal(elements.girlsModal);
}

function fillGirlsGrid() {
    elements.girlsGrid.innerHTML = '';
    girlsData.forEach(girl => {
        const card = document.createElement('div');
        card.className = 'girl-card';
        card.innerHTML = `
            <img src="/static/images/${girl.image}" alt="${girl.name}" class="girl-photo" loading="lazy">
            <h3 class="girl-name">${girl.name}</h3>
            <p class="girl-details">${girl.age} лет, ${girl.height} см</p>
            <p class="girl-note">${girl.description}</p>
        `;
        card.addEventListener('click', () => {
            selectedGirl = girl;
            document.querySelectorAll('.girl-card').forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
        });
        elements.girlsGrid.appendChild(card);
    });
}

function showOrderForm(girl) {
    selectedGirl = girl;
    elements.orderTitle.textContent = `Оформление заказа: ${girl.name}`;
    elements.selectedGirl.innerHTML = `
        <img src="/static/images/${girl.image}" alt="${girl.name}">
        <div>
            <h3 class="girl-name">${girl.name}</h3>
            <p class="girl-details">${girl.age} лет, ${girl.height} см</p>
            <p class="girl-note">${girl.description}</p>
        </div>
    `;
    hideModal(elements.girlsModal, () => showModal(elements.orderModal));
}

// Личный кабинет и авторизация
function showAuthSection() {
    elements.authSection.style.display = 'block';
    elements.registerSection.style.display = 'none';
    elements.accountSection.style.display = 'none';
    showModal(elements.accountModal);
}

function showRegisterSection() {
    elements.authSection.style.display = 'none';
    elements.registerSection.style.display = 'block';
    elements.accountSection.style.display = 'none';
    showModal(elements.accountModal);
}

function showAccountSection(username, isAdmin) {
    elements.authSection.style.display = 'none';
    elements.registerSection.style.display = 'none';
    elements.accountSection.style.display = 'block';
    elements.accountUsername.textContent = username;
    elements.adminSupport.style.display = isAdmin ? 'block' : 'none';
    loadSupportMessages(isAdmin);
    showModal(elements.accountModal);
}

// Загрузка заказов
async function loadOrders() {
    try {
        const response = await fetch('/orders');
        const data = await response.json();
        if (data.status === 'success') {
            elements.ordersList.innerHTML = data.orders.length
                ? data.orders.map(order => `
                    <p>👧 ${order.girl} на ${order.date} (Статус: ${order.status})</p>
                `).join('')
                : '<p>У вас нет активных заказов.</p>';
        } else {
            alert(data.message);
        }
    } catch (error) {
        alert('Ошибка загрузки заказов');
    }
}

// Загрузка сообщений чата поддержки
async function loadSupportMessages(isAdmin) {
    try {
        const response = await fetch('/support');
        const data = await response.json();
        if (data.status === 'success') {
            const messages = data.messages.map(msg => `
                <div style="margin-bottom: 10px;">
                    <strong>${msg.is_admin_reply ? 'Админ' : msg.username}</strong> (${msg.timestamp}):
                    <p>${msg.message}</p>
                </div>
            `).join('');
            elements.chatMessages.innerHTML = messages;
            elements.adminChatMessages.innerHTML = messages;
            elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
            elements.adminChatMessages.scrollTop = elements.adminChatMessages.scrollHeight;
        } else {
            alert(data.message);
        }
    } catch (error) {
        alert('Ошибка загрузки сообщений');
    }
}

// Инициализация страницы
document.addEventListener('DOMContentLoaded', () => {
    // Темы
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.body.classList.add(`${savedTheme}-theme`);
    if (elements.themeSelect) {
        elements.themeSelect.value = savedTheme;
        elements.themeSelect.addEventListener('change', () => {
            const newTheme = elements.themeSelect.value;
            document.body.classList.remove('dark-theme', 'light-theme', 'blue-theme', 'green-theme', 'red-theme', 'purple-theme');
            document.body.classList.add(`${newTheme}-theme`);
            localStorage.setItem('theme', newTheme);
        });
    }

    // Кнопка заказа
    elements.orderBtn?.addEventListener('click', e => {
        e.preventDefault();
        showGirlsModal();
    });

    // Закрытие модалок
    elements.close?.forEach(btn => btn.addEventListener('click', closeAllModals));
    window.addEventListener('click', e => {
        if ([elements.girlsModal, elements.orderModal, elements.successModal, elements.accountModal].includes(e.target)) {
            closeAllModals();
        }
    });

    // Бургер-меню
    elements.navToggle?.addEventListener('click', () => {
        document.querySelector('.main-nav').classList.toggle('active');
    });

    // Плавная навигация
    document.querySelectorAll('[data-smooth-navigate]').forEach(link => {
        link.addEventListener('click', e => {
            e.preventDefault();
            document.body.classList.add('fade-out');
            setTimeout(() => window.location.href = link.getAttribute('href'), 300);
        });
    });

    // Выбор девушки
    elements.confirmGirl?.addEventListener('click', () => {
        if (selectedGirl) showOrderForm(selectedGirl);
    });

    // Открытие личного кабинета
    elements.avatarBtn?.addEventListener('click', async () => {
        try {
            const response = await fetch('/orders');
            const data = await response.json();
            if (data.status === 'success') {
                showAccountSection(currentUser || 'Пользователь', elements.adminSupport.style.display === 'block');
            } else {
                showAuthSection();
            }
        } catch (error) {
            showAuthSection();
        }
    });

    // Вход
    elements.loginForm?.addEventListener('submit', async e => {
        e.preventDefault();
        const username = document.getElementById('loginUsername').value.trim();
        const password = document.getElementById('loginPassword').value.trim();

        if (!validateUsername(username)) return alert('Имя пользователя: минимум 3 символа, только буквы, цифры, подчёркивания');
        if (!validatePassword(password)) return alert('Пароль: минимум 6 символов');

        try {
            const response = await fetch('/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const data = await response.json();
            if (data.status === 'success') {
                currentUser = username;
                showAccountSection(username, data.role === 'admin');
            } else {
                alert(data.message);
            }
        } catch (error) {
            alert('Ошибка входа');
        }
    });

    // Регистрация
    elements.registerForm?.addEventListener('submit', async e => {
        e.preventDefault();
        const username = document.getElementById('registerUsername').value.trim();
        const password = document.getElementById('registerPassword').value.trim();

        if (!validateUsername(username)) return alert('Имя пользователя: минимум 3 символа, только буквы, цифры, подчёркивания');
        if (!validatePassword(password)) return alert('Пароль: минимум 6 символов');

        try {
            const response = await fetch('/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const data = await response.json();
            if (data.status === 'success') {
                alert(data.message);
                showAuthSection();
            } else {
                alert(data.message);
            }
        } catch (error) {
            alert('Ошибка регистрации');
        }
    });

    // Переключение между входом и регистрацией
    elements.showRegister?.addEventListener('click', e => {
        e.preventDefault();
        showRegisterSection();
    });

    elements.showLogin?.addEventListener('click', e => {
        e.preventDefault();
        showAuthSection();
    });

    // Выход
    elements.logoutBtn?.addEventListener('click', async () => {
        try {
            const response = await fetch('/logout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            const data = await response.json();
            if (data.status === 'success') {
                currentUser = null;
                closeAllModals();
                alert(data.message);
            } else {
                alert(data.message);
            }
        } catch (error) {
            alert('Ошибка выхода');
        }
    });

    // Загрузка заказов
    elements.ordersBtn?.addEventListener('click', loadOrders);

    // Отправка сообщений в чат
    elements.chatForm?.addEventListener('submit', async e => {
        e.preventDefault();
        const message = elements.chatMessage.value.trim();
        if (!message) return;

        try {
            const response = await fetch('/support', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message })
            });
            const data = await response.json();
            if (data.status === 'success') {
                elements.chatMessage.value = '';
                loadSupportMessages(elements.adminSupport.style.display === 'block');
            } else {
                alert(data.message);
            }
        } catch (error) {
            alert('Ошибка отправки сообщения');
        }
    });

    // Отправка админ-сообщений
    elements.adminChatForm?.addEventListener('submit', async e => {
        e.preventDefault();
        const message = elements.adminChatMessage.value.trim();
        if (!message) return;

        try {
            const response = await fetch('/support', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message })
            });
            const data = await response.json();
            if (data.status === 'success') {
                elements.adminChatMessage.value = '';
                loadSupportMessages(true);
            } else {
                alert(data.message);
            }
        } catch (error) {
            alert('Ошибка отправки сообщения');
        }
    });

    // Оформление заказа
    elements.orderForm?.addEventListener('submit', async e => {
        e.preventDefault();
        const name = document.getElementById('clientName').value.trim();
        const date = document.getElementById('orderDate').value;
        const comment = document.getElementById('orderComment').value.trim();

        if (!name) return alert('Введите ваше имя');
        if (!validateDate(date)) return alert('Выберите дату и время в будущем');

        const formData = { girl: selectedGirl?.name, name, date, comment };

        try {
            const response = await fetch('/order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            const data = await response.json();
            if (data.status === 'success') {
                hideModal(elements.orderModal, () => {
                    showModal(elements.successModal);
                    elements.successModal.querySelector('.success-message').textContent = data.message;
                    setTimeout(() => hideModal(elements.successModal), 3000);
                });
                elements.orderForm.reset();
                elements.selectedGirl.innerHTML = '';
                selectedGirl = null;
            } else {
                alert(data.message);
            }
        } catch (error) {
            alert('Ошибка при отправке заказа');
        }
    });

    // Particles.js для десктопа
    if (window.innerWidth > 600) {
        particlesJS('particles-js', {
            particles: {
                number: { value: 60, density: { enable: true, value_area: 800 } },
                color: { value: '#58a6ff' },
                shape: { type: 'circle' },
                opacity: { value: 0.5, random: true },
                size: { value: 3, random: true },
                line_linked: { enable: false },
                move: { enable: true, speed: 2, direction: 'none', random: true }
            },
            interactivity: {
                detect_on: 'canvas',
                events: { onhover: { enable: true, mode: 'repulse' }, onclick: { enable: true, mode: 'push' } },
                modes: { repulse: { distance: 100, duration: 0.4 }, push: { particles_nb: 4 } }
            }
        });
    }
});
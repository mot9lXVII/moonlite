// Данные девушек
const girlsData = [
    {
        id: 1,
        name: "Марго Сладка",
        age: 18,
        height: 160,
        description: "Футджоб делать не буду, все ноги после огорода в мазолях.",
        image: "girls/girl1.jpg"
    },
    {
        id: 2,
        name: "Потаскуха Ржавого",
        age: 19,
        height: 163,
        description: "Отсосу на рики на ногах, если дотер отлижу пятки.",
        image: "girls/girl2.jpg"
    },
    {
        id: 3,
        name: "Ленка Алексеева",
        age: 20,
        height: 168,
        description: "Макан ваще крутой чювак брат.",
        image: "girls/girl4.jpg"
    },
    {
        id: 4,
        name: "Солевая Альтуха",
        age: 21,
        height: 167,
        description: "Фiмозiще тема.",
        image: "girls/girl5.jpg"
    }
];

// DOM элементы
const selectors = {
    orderBtn: '#orderBtn',
    girlsModal: '#girlsModal',
    orderModal: '#orderModal',
    successModal: '#successModal',
    girlsGrid: '#girlsGrid',
    orderForm: '#orderForm',
    orderTitle: '#orderTitle',
    selectedGirl: '#selectedGirl',
    confirmGirl: '#confirmGirl',
    close: '.close',
    themeSelect: '#themeSelect',
    welcomeMessage: '#welcomeMessage'
};

// Кэш элементов
const elements = {};
Object.keys(selectors).forEach(key => {
    elements[key] = document.querySelector(selectors[key]);
    if (key === 'close') elements[key] = document.querySelectorAll(selectors[key]);
});

// Текущая выбранная девушка
let selectedGirl = null;

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
    // Тема
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.body.classList.add(`${savedTheme}-theme`);
    if (elements.themeSelect) {
        elements.themeSelect.value = savedTheme;
        elements.themeSelect.addEventListener('change', () => {
            const newTheme = elements.themeSelect.value;
            document.body.classList.remove('light-theme', 'dark-theme');
            document.body.classList.add(`${newTheme}-theme`);
            localStorage.setItem('theme', newTheme);
        });
    }

    // Модалка заказа
    if (elements.orderBtn) {
        elements.orderBtn.addEventListener('click', e => {
            e.preventDefault();
            showGirlsModal();
        });
    }

    // Закрытие модалок
    if (elements.close) {
        elements.close.forEach(btn => btn.addEventListener('click', closeModals));
    }

    // Клик вне модалки
    window.addEventListener('click', e => {
        if ([elements.girlsModal, elements.orderModal, elements.successModal].includes(e.target)) {
            closeModals();
        }
    });

    // Плавные переходы
    document.querySelectorAll('[data-smooth-navigate]').forEach(link => {
        link.addEventListener('click', e => {
            e.preventDefault();
            document.body.classList.add('fade-out');
            setTimeout(() => {
                window.location.href = link.getAttribute('href');
            }, 300);
        });
    });

    // Сетка девушек
    if (elements.girlsGrid) {
        fillGirlsGrid();
    }

    // Подтверждение выбора девушки
    if (elements.confirmGirl) {
        elements.confirmGirl.addEventListener('click', () => {
            if (selectedGirl) {
                showOrderForm(selectedGirl);
            }
        });
    }

    // Форма заказа
    if (elements.orderForm) {
        elements.orderForm.addEventListener('submit', e => {
            e.preventDefault();
            const formData = {
                girl: selectedGirl?.name,
                name: document.getElementById('clientName').value,
                phone: document.getElementById('clientPhone').value,
                date: document.getElementById('orderDate').value,
                comment: document.getElementById('orderComment').value
            };
            console.log('Данные заказа:', formData);
            hideModal(elements.orderModal, () => {
                showModal(elements.successModal);
                setTimeout(() => hideModal(elements.successModal), 2000);
            });
            elements.orderForm.reset();
            elements.selectedGirl.innerHTML = '';
            selectedGirl = null;
        });
    }

    // Параллакс
    const welcomeContainer = document.querySelector('.welcome-container');
    if (welcomeContainer && window.innerWidth > 600) {
        document.addEventListener('mousemove', e => {
            const x = (window.innerWidth / 2 - e.clientX) / 50;
            const y = (window.innerHeight / 2 - e.clientY) / 50;
            welcomeContainer.style.transform = `translate(-50%, -50%) translate(${x}px, ${y}px)`;
        });
    }

    // Пасхалка
    if (elements.welcomeMessage) {
        elements.welcomeMessage.addEventListener('click', function() {
            this.style.animation = 'shake 0.4s ease';
            setTimeout(() => {
                this.style.animation = '';
                alert('Марго Сладка одобряет твой клик! 😜');
            }, 400);
        });
    }

    // Частицы
    const isMobile = window.innerWidth <= 600;
    particlesJS('particles-js', {
        particles: {
            number: { value: isMobile ? 30 : 60, density: { enable: true, value_area: 800 } },
            color: { value: '#58a6ff' },
            shape: { type: 'circle' },
            opacity: { value: 0.5, random: true },
            size: { value: 3, random: true },
            line_linked: { enable: false },
            move: { enable: true, speed: isMobile ? 1 : 2, direction: 'none', random: true }
        },
        interactivity: {
            detect_on: 'canvas',
            events: { onhover: { enable: !isMobile, mode: 'repulse' }, onclick: { enable: true, mode: 'push' } },
            modes: { repulse: { distance: 100, duration: 0.4 }, push: { particles_nb: 4 } }
        }
    });
});

// Показать модалку
function showModal(modal) {
    modal.style.display = 'block';
    setTimeout(() => modal.classList.add('show'), 10);
    document.body.style.overflow = 'hidden';
}

// Скрыть модалку
function hideModal(modal, callback) {
    modal.classList.remove('show');
    setTimeout(() => {
        modal.style.display = 'none';
        if (callback) callback();
        document.body.style.overflow = 'auto';
    }, 300);
}

// Показать девушек
function showGirlsModal() {
    fillGirlsGrid();
    showModal(elements.girlsModal);
}

// Показать форму заказа
function showOrderForm(girl) {
    selectedGirl = girl;
    elements.orderTitle.textContent = `Оформление заказа: ${girl.name}`;
    elements.selectedGirl.innerHTML = `
        <img src="{{ url_for('static', filename='images/${girl.image}') }}" alt="${girl.name}">
        <div>
            <h3 class="girl-name">${girl.name}</h3>
            <p class="girl-details">${girl.age} лет, ${girl.height} см</p>
            <p class="girl-note">${girl.description}</p>
        </div>
    `;
    hideModal(elements.girlsModal, () => showModal(elements.orderModal));
}

// Закрыть модалки
function closeModals() {
    [elements.girlsModal, elements.orderModal, elements.successModal].forEach(modal => {
        if (modal?.style.display === 'block') hideModal(modal);
    });
}

// Заполнить сетку девушек
function fillGirlsGrid() {
    elements.girlsGrid.innerHTML = '';
    girlsData.forEach(girl => {
        const girlCard = document.createElement('div');
        girlCard.className = 'girl-card';
        girlCard.innerHTML = `
            <img src="{{ url_for('static', filename='images/${girl.image}') }}" alt="${girl.name}" class="girl-photo" loading="lazy">
            <h3 class="girl-name">${girl.name}</h3>
            <p class="girl-details">${girl.age} лет, ${girl.height} см</p>
            <p class="girl-note">${girl.description}</p>
        `;
        girlCard.addEventListener('click', () => {
            selectedGirl = girl;
            document.querySelectorAll('.girl-card').forEach(card => card.classList.remove('selected'));
            girlCard.classList.add('selected');
        });
        elements.girlsGrid.appendChild(girlCard);
    });
}
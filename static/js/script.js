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
    telegramModal: '#telegramModal',
    telegramChatBtn: '#telegramChatBtn',
    girlsGrid: '#girlsGrid',
    orderForm: '#orderForm',
    orderTitle: '#orderTitle',
    selectedGirl: '#selectedGirl',
    confirmGirl: '#confirmGirl',
    close: '.close',
    themeSelect: '#themeSelect',
    welcomeMessage: '#welcomeMessage',
    navToggle: '#navToggle'
};

const elements = {};
Object.keys(selectors).forEach(key => {
    elements[key] = key === 'close' ? document.querySelectorAll(selectors[key]) : document.querySelector(selectors[key]);
});

let selectedGirl = null;

function validateUsername(username) {
    return username.match(/^@?[A-Za-z0-9_]{5,}$/);
}

function validateDate(date) {
    const selectedDate = new Date(date);
    const now = new Date();
    return selectedDate > now;
}

function showModal(modal) {
    modal.style.display = 'block';
    setTimeout(() => modal.classList.add('show'), 10);
    document.body.style.overflow = 'hidden';
}

function hideModal(modal, callback) {
    modal.classList.remove('show');
    setTimeout(() => {
        modal.style.display = 'none';
        if (callback) callback();
        document.body.style.overflow = 'auto';
    }, 300);
}

function showGirlsModal() {
    fillGirlsGrid();
    showModal(elements.girlsModal);
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

function closeModals() {
    [elements.girlsModal, elements.orderModal, elements.successModal, elements.telegramModal].forEach(modal => {
        if (modal?.style.display === 'block') hideModal(modal);
    });
}

function fillGirlsGrid() {
    elements.girlsGrid.innerHTML = '';
    girlsData.forEach(girl => {
        const girlCard = document.createElement('div');
        girlCard.className = 'girl-card';
        girlCard.innerHTML = `
            <img src="/static/images/${girl.image}" alt="${girl.name}" class="girl-photo" loading="lazy">
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

document.addEventListener('DOMContentLoaded', () => {
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

    if (elements.orderBtn) {
        elements.orderBtn.addEventListener('click', e => {
            e.preventDefault();
            showGirlsModal();
        });
    }

    elements.close?.forEach(btn => btn.addEventListener('click', closeModals));

    window.addEventListener('click', e => {
        if ([elements.girlsModal, elements.orderModal, elements.successModal, elements.telegramModal].includes(e.target)) {
            closeModals();
        }
    });

    if (elements.navToggle) {
        elements.navToggle.addEventListener('click', () => {
            document.querySelector('.main-nav').classList.toggle('active');
        });
    }

    document.querySelectorAll('[data-smooth-navigate]').forEach(link => {
        link.addEventListener('click', e => {
            e.preventDefault();
            document.body.classList.add('fade-out');
            setTimeout(() => {
                window.location.href = link.getAttribute('href');
            }, 300);
        });
    });

    if (elements.telegramChatBtn) {
        elements.telegramChatBtn.addEventListener('click', () => {
            showModal(elements.telegramModal);
        });
    }

    if (elements.girlsGrid) {
        fillGirlsGrid();
    }

    if (elements.confirmGirl) {
        elements.confirmGirl.addEventListener('click', () => {
            if (selectedGirl) {
                showOrderForm(selectedGirl);
            }
        });
    }

    if (elements.orderForm) {
        elements.orderForm.addEventListener('submit', async e => {
            e.preventDefault();
            const name = document.getElementById('clientName').value.trim();
            let telegram_username = document.getElementById('telegramUsername').value.trim();
            const date = document.getElementById('orderDate').value;
            const comment = document.getElementById('orderComment').value.trim();

            if (!name) return alert('Введите ваше имя');
            if (!validateUsername(telegram_username)) return alert('Введите корректный Telegram username (например, @Username)');
            if (!validateDate(date)) return alert('Выберите дату и время в будущем');

            if (!telegram_username.startsWith('@')) {
                telegram_username = `@${telegram_username}`;
            }

            const formData = { girl: selectedGirl?.name, name, telegram_username, date, comment };

            try {
                const response = await fetch('/order', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });
                const result = await response.json();
                if (result.status === 'success') {
                    hideModal(elements.orderModal, () => {
                        showModal(elements.successModal);
                        elements.successModal.querySelector('.success-message').textContent = result.message;
                        setTimeout(() => {
                            hideModal(elements.successModal);
                            showModal(elements.telegramModal);
                        }, 3000);
                    });
                    elements.orderForm.reset();
                    elements.selectedGirl.innerHTML = '';
                    selectedGirl = null;
                } else {
                    alert(result.message);
                }
            } catch (error) {
                alert('Ошибка при отправке заказа');
            }
        });
    }

    const isMobile = window.innerWidth <= 600;
    if (!isMobile) {
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
// Данные девушек
const girlsData = [
    {
        id: 1,
        name: "Марго Сладка",
        age: 18,
        height: 160,
        description: "VIP-обслуживание, футджоб не предлагать",
        image: "girl1.jpg"
    },
    {
        id: 2,
        name: "Потаскуха Ржавого",
        age: 19,
        height: 163,
        description: "Без ограничений",
        image: "girl2.jpg"
    },
    {
        id: 3,
        name: "Ленка Алексеева",
        age: 20,
        height: 168,
        description: "Вечерние встречи",
        image: "girl4.jpg"
    },
    {
        id: 4,
        name: "Солевая Альтуха",
        age: 21,
        height: 167,
        description: "Индивидуальный подход",
        image: "girl5.jpg"
    }
];

// DOM элементы
const orderBtn = document.getElementById('orderBtn');
const girlsModal = document.getElementById('girlsModal');
const orderModal = document.getElementById('orderModal');
const girlsGrid = document.getElementById('girlsGrid');
const orderForm = document.getElementById('orderForm');
const orderTitle = document.getElementById('orderTitle');
const closeButtons = document.querySelectorAll('.close');

// Текущая выбранная девушка
let selectedGirl = null;

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    // Обработчик кнопки "Заказать"
    orderBtn.addEventListener('click', showGirlsModal);

    // Обработчики закрытия модальных окон
    closeButtons.forEach(btn => {
        btn.addEventListener('click', closeModals);
    });

    // Закрытие при клике вне окна
    window.addEventListener('click', function(event) {
        if (event.target === girlsModal) {
            closeModals();
        }
        if (event.target === orderModal) {
            closeModals();
        }
    });

    // Плавные переходы между страницами
    document.querySelectorAll('[data-smooth-navigate]').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            document.body.classList.add('fade-out');
            setTimeout(() => {
                window.location.href = this.href;
            }, 500);
        });
    });

    // Заполняем сетку девушек
    fillGirlsGrid();
});

// Показать модальное окно с девушками
function showGirlsModal() {
    girlsModal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

// Показать модальное окно с формой заказа
function showOrderForm(girl) {
    selectedGirl = girl;
    orderTitle.textContent = `Оформление заказа: ${girl.name}`;
    girlsModal.style.display = 'none';
    orderModal.style.display = 'block';
}

// Закрыть все модальные окна
function closeModals() {
    girlsModal.style.display = 'none';
    orderModal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

// Заполнить сетку девушек карточками
function fillGirlsGrid() {
    girlsGrid.innerHTML = '';

    girlsData.forEach(girl => {
        const girlCard = document.createElement('div');
        girlCard.className = 'girl-card';
        girlCard.innerHTML = `
            <img src="{{ url_for('static', filename='images/girls/${girl.image}') }}" 
                 alt="${girl.name}" 
                 class="girl-photo">
            <h3 class="girl-name">${girl.name}</h3>
            <p class="girl-details">${girl.age} лет, ${girl.height} см</p>
            <p class="girl-note">${girl.description}</p>
        `;

        girlCard.addEventListener('click', () => showOrderForm(girl));
        girlsGrid.appendChild(girlCard);
    });
}

// Обработка отправки формы
orderForm.addEventListener('submit', function(e) {
    e.preventDefault();

    const formData = {
        girl: selectedGirl.name,
        name: document.getElementById('clientName').value,
        phone: document.getElementById('clientPhone').value,
        date: document.getElementById('orderDate').value,
        comment: document.getElementById('orderComment').value
    };

    // Здесь можно добавить отправку данных на сервер
    console.log('Данные заказа:', formData);

    alert(`Заказ на ${selectedGirl.name} оформлен!\nМы свяжемся с вами в ближайшее время.`);
    closeModals();
    orderForm.reset();
});
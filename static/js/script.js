// Функция для плавного перехода между страницами
function smoothNavigate(url, event) {
    if (event) event.preventDefault();

    // Анимация исчезновения
    document.body.classList.add('fade-out');

    // Переход после завершения анимации
    setTimeout(() => {
        window.location.href = url;
    }, 500);
}

// Инициализация после загрузки страницы
document.addEventListener('DOMContentLoaded', function() {
    // Добавляем обработчики для всех навигационных ссылок
    const navLinks = document.querySelectorAll('[data-smooth-navigate]');

    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            smoothNavigate(this.href, e);
        });
    });

    // Добавляем обработчики для обычных боксов (без ссылок)
    document.querySelectorAll('.box:not([data-smooth-navigate])').forEach(box => {
        box.addEventListener('click', function() {
            this.style.backgroundColor = '#1f6feb';
            setTimeout(() => {
                this.style.backgroundColor = '#161b22';
            }, 300);
        });
    });
});
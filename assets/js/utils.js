/* ========================================
   TECHFLOW - УТИЛИТЫ (utils.js)
   ======================================== */

// Форматирование даты
function formatDate(dateString) {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
        return 'Сегодня';
    } else if (date.toDateString() === yesterday.toDateString()) {
        return 'Вчера';
    }

    return date.toLocaleDateString('ru-RU', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// Получить эмодзи категории
function getCategoryEmoji(category) {
    const emojis = {
        ai: '🤖',
        gadgets: '📱',
        software: '💻',
        hardware: '🔧',
        crypto: '💰'
    };
    return emojis[category] || '📰';
}

// Преобразовать Markdown в HTML
function markdownToHtml(markdown) {
    let html = escapeHtml(markdown);

    // Заголовки
    html = html.replace(/^### (.*?)$/gm, '<h3>$1</h3>');
    html = html.replace(/^## (.*?)$/gm, '<h2>$1</h2>');
    html = html.replace(/^# (.*?)$/gm, '<h1>$1</h1>');

    // Жирный текст
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/__(.*?)__/g, '<strong>$1</strong>');

    // Курсив
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
    html = html.replace(/_(.*?)_/g, '<em>$1</em>');

    // Маркированные списки
    html = html.replace(/^- (.*?)$/gm, '<li>$1</li>');
    html = html.replace(/^• (.*?)$/gm, '<li>$1</li>');
    html = html.replace(/(<li>[\s\S]*?<\/li>)/s, '<ul>$1</ul>');

    // Нумерованные списки
    html = html.replace(/^\d+\. (.*?)$/gm, '<li>$1</li>');

    // Ссылки
    html = html.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

    // Блоки кода
    html = html.replace(/```(.*?)```/gs, '<pre><code>$1</code></pre>');

    // Горизонтальная линия
    html = html.replace(/^---$/gm, '<hr>');

    // Новые строки в параграфы
    html = html.split('\n\n').map(p => p.trim() ? `<p>${p}</p>` : '').join('');

    return html;
}

// Экранирование HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Генерация UUID
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0,
            v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// Валидация URL
function isValidUrl(string) {
    try {
        new URL(string);
        return true;
    } catch (_) {
        return false;
    }
}

// Копировать текст в буфер обмена
async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch (err) {
        console.error('Ошибка копирования:', err);
        return false;
    }
}

// Задержка (для async/await)
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Форматирование числа с тысячами
function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

// Получить время назад (e.g., "2 часа назад")
function getTimeAgo(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);

    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + ' лет назад';

    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + ' месяцев назад';

    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + ' дней назад';

    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + ' часов назад';

    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + ' минут назад';

    return Math.floor(seconds) + ' секунд назад';
}

// Проверка наличия объекта в массиве по ID
function findById(arr, id) {
    return arr.find(item => item.id === id);
}

// Удаление из массива по ID
function removeById(arr, id) {
    return arr.filter(item => item.id !== id);
}

// Дебаунс
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Throttle
function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}
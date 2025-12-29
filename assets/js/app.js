/* ========================================
   TECHFLOW - ГЛАВНОЕ ПРИЛОЖЕНИЕ (app.js)
   ======================================== */

let allNews = [];
let filteredNews = [];
let currentFilter = 'all';
let currentSort = 'date';
let currentPage = 1;
const newsPerPage = 6;
let comments = {};

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', () => {
    initApp();
    if (window.Telegram && window.Telegram.WebApp) {
        setupTelegramMiniApp();
    }
});

// Инициализация приложения
async function initApp() {
    try {
        // Загрузить новости
        await loadNews();
        // Загрузить комментарии
        await loadComments();
        // Отрисовать начальные данные
        renderFeaturedArticle();
        renderNews();
        // Слушатели событий
        setupEventListeners();
    } catch (error) {
        console.error('Ошибка инициализации:', error);
        showNotification('Ошибка при загрузке данных', 'error');
    }
}

// Загрузить новости из JSON
async function loadNews() {
    try {
        const response = await fetch('data/news.json');
        if (!response.ok) throw new Error('Ошибка загрузки новостей');
        allNews = await response.json();
        filteredNews = [...allNews];
    } catch (error) {
        console.error('Ошибка при загрузке новостей:', error);
        allNews = [];
        filteredNews = [];
    }
}

// Загрузить комментарии
async function loadComments() {
    try {
        const response = await fetch('data/comments.json');
        if (!response.ok) throw new Error('Ошибка загрузки комментариев');
        comments = await response.json();
    } catch (error) {
        console.error('Ошибка при загрузке комментариев:', error);
        comments = {};
    }
}

// Установка слушателей событий
function setupEventListeners() {
    // Поиск
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            if (query.length > 0) {
                filteredNews = allNews.filter(news =>
                    news.title.toLowerCase().includes(query) ||
                    news.excerpt.toLowerCase().includes(query)
                );
            } else {
                filteredNews = allNews.filter(n => n.category === currentFilter || currentFilter === 'all');
            }
            currentPage = 1;
            renderNews();
        });
    }

    // Закрытие модального по Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeNews();
        }
    });

    // Закрытие модального по клику вне его
    const modal = document.getElementById('newsModal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeNews();
            }
        });
    }
}

// Отрисовка избранной статьи
function renderFeaturedArticle() {
    const featured = allNews.find(n => n.featured);
    const section = document.getElementById('featuredSection');

    if (!featured || !section) return;

    section.innerHTML = `
        <article class="featured-article" onclick="openNews('${featured.id}')">
            <div>
                <div class="badge">${featured.category.toUpperCase()}</div>
                <h2>${escapeHtml(featured.title)}</h2>
                <p>${escapeHtml(featured.excerpt)}</p>
                <div style="margin-top: 20px;">
                    <button class="btn btn-primary">Читать полностью →</button>
                </div>
            </div>
            <img src="${featured.image}" alt="${escapeHtml(featured.title)}" style="object-fit: cover; border-radius: 8px;">
        </article>
    `;
}

// Фильтр новостей по категориям
function filterNews(category) {
    currentFilter = category;
    currentPage = 1;

    if (category === 'all') {
        filteredNews = [...allNews];
    } else {
        filteredNews = allNews.filter(n => n.category === category);
    }

    // Обновить кнопки фильтра
    document.querySelectorAll('.nav-link').forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('onclick').includes(`'${category}'`)) {
            btn.classList.add('active');
        }
    });

    renderNews();
}

// Сортировка новостей
function sortNews(sortType) {
    currentSort = sortType;
    currentPage = 1;

    if (sortType === 'date') {
        filteredNews.sort((a, b) => new Date(b.date) - new Date(a.date));
    } else if (sortType === 'popular') {
        filteredNews.sort((a, b) => (b.views || 0) - (a.views || 0));
    } else if (sortType === 'comments') {
        filteredNews.sort((a, b) => {
            const aComments = (comments[a.id] || []).length;
            const bComments = (comments[b.id] || []).length;
            return bComments - aComments;
        });
    }

    // Обновить кнопки сортировки
    document.querySelectorAll('.sort-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('onclick').includes(`'${sortType}'`)) {
            btn.classList.add('active');
        }
    });

    renderNews();
}

// Поиск новостей
function searchNews() {
    const query = document.getElementById('searchInput').value.toLowerCase();

    if (query.length === 0) {
        filteredNews = allNews.filter(n => n.category === currentFilter || currentFilter === 'all');
    } else {
        filteredNews = allNews.filter(news =>
            (news.title.toLowerCase().includes(query) ||
             news.excerpt.toLowerCase().includes(query) ||
             news.fullText.toLowerCase().includes(query)) &&
            (currentFilter === 'all' || news.category === currentFilter)
        );
    }

    currentPage = 1;
    renderNews();
}

// Отрисовка новостей в сетку
function renderNews() {
    const grid = document.getElementById('newsGrid');
    if (!grid) return;

    if (filteredNews.length === 0) {
        grid.innerHTML = `
            <div class="loading">
                <p>😔 Новости не найдены</p>
            </div>
        `;
        return;
    }

    // Пагинация
    const start = (currentPage - 1) * newsPerPage;
    const end = start + newsPerPage;
    const paginatedNews = filteredNews.slice(start, end);

    // Отрисовать карточки
    grid.innerHTML = paginatedNews.map(news => `
        <article class="news-card" onclick="openNews('${news.id}')">
            <img src="${news.image}" alt="${escapeHtml(news.title)}" class="news-image">
            <div class="news-content">
                <h3 class="news-title">${escapeHtml(news.title)}</h3>
                <p class="news-excerpt">${escapeHtml(news.excerpt)}</p>
                <div class="news-meta">
                    <span class="badge">${getCategoryEmoji(news.category)} ${news.category}</span>
                    <span>${formatDate(news.date)}</span>
                    <span>👁️ ${news.views || 0}</span>
                </div>
            </div>
        </article>
    `).join('');

    // Пагинация
    renderPagination();
}

// Отрисовка пагинации
function renderPagination() {
    const totalPages = Math.ceil(filteredNews.length / newsPerPage);
    const paginationDiv = document.getElementById('pagination');

    if (!paginationDiv || totalPages <= 1) {
        if (paginationDiv) paginationDiv.innerHTML = '';
        return;
    }

    let html = '';

    // Предыдущая страница
    if (currentPage > 1) {
        html += `<button onclick="changePage(${currentPage - 1})">← Назад</button>`;
    }

    // Номера страниц
    for (let i = Math.max(1, currentPage - 2); i <= Math.min(totalPages, currentPage + 2); i++) {
        if (i === currentPage) {
            html += `<button class="active" onclick="changePage(${i})">${i}</button>`;
        } else {
            html += `<button onclick="changePage(${i})">${i}</button>`;
        }
    }

    // Следующая страница
    if (currentPage < totalPages) {
        html += `<button onclick="changePage(${currentPage + 1})">Далее →</button>`;
    }

    paginationDiv.innerHTML = html;
}

// Смена страницы
function changePage(page) {
    currentPage = page;
    renderNews();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Открыть новость в модальном окне
function openNews(newsId) {
    const news = allNews.find(n => n.id === newsId);
    if (!news) return;

    // Увеличить счетчик просмотров
    if (!news.views) news.views = 0;
    news.views++;

    // Заполнить модальное окно
    document.getElementById('modalTitle').textContent = news.title;
    document.getElementById('modalImage').src = news.image;
    document.getElementById('modalCategory').textContent = news.category.toUpperCase();
    document.getElementById('modalDate').textContent = formatDate(news.date);
    document.getElementById('modalAuthor').textContent = news.author || 'TechFlow';

    // Преобразовать Markdown в HTML
    document.getElementById('modalText').innerHTML = markdownToHtml(news.fullText);

    // Источник
    if (news.source) {
        document.getElementById('modalSource').innerHTML = `
            <strong>📚 Источник:</strong><br>
            <a href="${news.source}" target="_blank" rel="noopener noreferrer">${news.source}</a>
        `;
    } else {
        document.getElementById('modalSource').innerHTML = '';
    }

    // Комментарии
    renderComments(newsId);

    // Показать модальное окно
    document.getElementById('newsModal').classList.add('active');
    document.body.style.overflow = 'hidden';
}

// Закрыть новость
function closeNews() {
    document.getElementById('newsModal').classList.remove('active');
    document.body.style.overflow = '';
}

// Отрисовать комментарии
function renderComments(newsId) {
    const commentsList = document.getElementById('commentsList');
    const newsComments = comments[newsId] || [];

    document.getElementById('commentsCount').textContent = newsComments.length;

    if (newsComments.length === 0) {
        commentsList.innerHTML = '<p style="color: var(--text-light); text-align: center;">Пока нет комментариев. Будьте первым!</p>';
        return;
    }

    commentsList.innerHTML = newsComments.map(comment => `
        <div class="comment">
            <div class="comment-author">${escapeHtml(comment.author)}</div>
            <div class="comment-text">${escapeHtml(comment.text)}</div>
            <div class="comment-date">${new Date(comment.date).toLocaleString('ru-RU')}</div>
        </div>
    `).join('');

    // Скролл к комментариям
    commentsList.scrollTop = 0;
}

// Добавить комментарий
async function addComment(event) {
    event.preventDefault();

    const newsId = getCurrentNewsId();
    if (!newsId) return;

    const author = document.getElementById('commentInput').value.trim();
    const text = document.querySelector('.comment-textarea').value.trim();

    if (!author || !text) {
        showNotification('Заполните все поля', 'error');
        return;
    }

    // Инициализировать массив комментариев если его нет
    if (!comments[newsId]) {
        comments[newsId] = [];
    }

    // Добавить комментарий
    const comment = {
        id: Date.now().toString(),
        author: author,
        text: text,
        date: new Date().toISOString()
    };

    comments[newsId].push(comment);

    // Сохранить в локальное хранилище (для текущей сессии)
    try {
        await saveComments();
    } catch (error) {
        console.error('Ошибка при сохранении комментария:', error);
    }

    // Очистить форму и обновить комментарии
    document.getElementById('commentForm').reset();
    renderComments(newsId);
    showNotification('Комментарий добавлен! 👍', 'success');
}

// Получить ID текущей новости
function getCurrentNewsId() {
    const title = document.getElementById('modalTitle').textContent;
    const news = allNews.find(n => n.title === title);
    return news ? news.id : null;
}

// Поделиться новостью
async function shareNews() {
    const newsId = getCurrentNewsId();
    const news = allNews.find(n => n.id === newsId);
    if (!news) return;

    const url = `${window.location.href}?news=${newsId}`;

    // Telegram Mini App
    if (window.Telegram && window.Telegram.WebApp) {
        window.Telegram.WebApp.shareToStory(
            'https://via.placeholder.com/150',
            {
                text: `${news.title} — читайте на TechFlow`,
                widget_link: { url: url }
            }
        );
        return;
    }

    // Web Share API
    if (navigator.share) {
        try {
            await navigator.share({
                title: news.title,
                text: news.excerpt,
                url: url
            });
        } catch (error) {
            if (error.name !== 'AbortError') {
                console.error('Ошибка при поделиться:', error);
            }
        }
    } else {
        showNotification('Функция поделиться недоступна в этом браузере', 'info');
    }
}

// Копировать ссылку
function copyLink() {
    const newsId = getCurrentNewsId();
    const url = `${window.location.href}${window.location.href.includes('?') ? '&' : '?'}news=${newsId}`;

    navigator.clipboard.writeText(url).then(() => {
        showNotification('Ссылка скопирована! 📋', 'success');
    }).catch(error => {
        console.error('Ошибка копирования:', error);
        showNotification('Ошибка при копировании', 'error');
    });
}

// Переключить поиск
function toggleSearch() {
    const searchBar = document.getElementById('searchBar');
    searchBar.classList.toggle('hidden');
    if (!searchBar.classList.contains('hidden')) {
        document.getElementById('searchInput').focus();
    }
}

// Перейти на админ панель
function goToAdmin() {
    window.location.href = 'admin.html';
}

// Setup Telegram Mini App
function setupTelegramMiniApp() {
    const tg = window.Telegram.WebApp;
    tg.ready();

    // Темные цвета если применяется
    if (tg.colorScheme === 'dark') {
        document.body.style.backgroundColor = '#1f1f1f';
    }

    // Кнопка закрытия Telegram
    tg.onEvent('closeInvoice', function(isSuccessful) {
        if (isSuccessful) {
            showNotification('Платеж успешен!', 'success');
        }
    });
}

// Сохранить комментарии
async function saveComments() {
    // В реальном приложении здесь должна быть синхронизация с GitHub API
    // Для сейчас просто сохраняем в памяти приложения
    localStorage.setItem('techflow_comments_temp', JSON.stringify(comments));
}

// Утилиты
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

    // Списки
    html = html.replace(/^• (.*?)$/gm, '<li>$1</li>');
    html = html.replace(/(<li>.*?<\/li>)/s, '<ul>$1</ul>');

    // Ссылки
    html = html.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

    // Новые строки
    html = html.replace(/\n\n/g, '</p><p>');
    html = '<p>' + html + '</p>';

    return html;
}

function showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.className = `notification ${type}`;
    notification.classList.remove('hidden');

    setTimeout(() => {
        notification.classList.add('hidden');
    }, 3000);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
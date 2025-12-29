/* ========================================
   TECHFLOW - АДМИН ПАНЕЛЬ (admin.js)
   ======================================== */

const ADMIN_PASSWORD_HASH = '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918'; // SHA256 of 'admin123'
const GITHUB_REPO_OWNER = 'YOUR_GITHUB_USERNAME';
const GITHUB_REPO_NAME = 'techflow-news';
const GITHUB_TOKEN = ''; // Будет установлен пользователем

let allNews = [];
let allComments = {};
let isLoggedIn = false;

// Инициализация
document.addEventListener('DOMContentLoaded', async () => {
    await loadNews();
    await loadComments();
    checkLoginStatus();
    setupEventListeners();
});

// Проверить статус входа
function checkLoginStatus() {
    const password = sessionStorage.getItem('admin_password');
    if (password && await verifyPassword(password)) {
        isLoggedIn = true;
        showAdminPanel();
    } else {
        showLoginForm();
    }
}

// Вход
async function login(event) {
    event.preventDefault();
    const password = document.getElementById('passwordInput').value;

    if (await verifyPassword(password)) {
        sessionStorage.setItem('admin_password', password);
        isLoggedIn = true;
        document.getElementById('loginSection').classList.add('hidden');
        showAdminPanel();
        showNotification('✅ Вы вошли в админ панель!', 'success');
    } else {
        document.getElementById('loginError').classList.remove('hidden');
        document.getElementById('loginError').textContent = '❌ Неверный пароль';
        document.getElementById('passwordInput').value = '';
    }
}

// Выход
function logout() {
    if (confirm('Вы уверены, что хотите выйти?')) {
        sessionStorage.removeItem('admin_password');
        isLoggedIn = false;
        document.getElementById('adminPanel').classList.add('hidden');
        document.getElementById('loginSection').classList.remove('hidden');
        document.getElementById('passwordInput').value = '';
        showNotification('👋 Вы вышли из админ панели', 'success');
    }
}

// Верификация пароля
async function verifyPassword(password) {
    const hash = await hashPassword(password);
    return hash === ADMIN_PASSWORD_HASH;
}

// SHA256 хеширование
async function hashPassword(str) {
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Показать админ панель
function showAdminPanel() {
    document.getElementById('adminPanel').classList.remove('hidden');
    document.getElementById('loginSection').classList.add('hidden');
    updateStats();
    renderNewsList();
}

// Показать форму входа
function showLoginForm() {
    document.getElementById('loginSection').classList.remove('hidden');
    document.getElementById('adminPanel').classList.add('hidden');
}

// Setup слушателей
function setupEventListeners() {
    // Форма новости
    const form = document.getElementById('newsForm');
    if (form) {
        form.addEventListener('submit', publishNews);
    }

    // Превью изображения
    const imageInput = document.getElementById('newsImage');
    if (imageInput) {
        imageInput.addEventListener('change', previewImage);
    }

    // Счетчик символов
    const excerptInput = document.getElementById('newsExcerpt');
    if (excerptInput) {
        excerptInput.addEventListener('input', (e) => {
            document.getElementById('excerptCount').textContent = `${e.target.value.length}/300`;
        });
    }

    // Поиск в управлении
    const searchInput = document.getElementById('searchManagement');
    if (searchInput) {
        searchInput.addEventListener('input', () => renderNewsList());
    }
}

// Переключение вкладок
function switchTab(tabName) {
    // Скрыть все вкладки
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    // Показать выбранную вкладку
    document.getElementById(tabName + 'Tab').classList.add('active');
    event.target.classList.add('active');
}

// Загрузить новости
async function loadNews() {
    try {
        const response = await fetch('data/news.json');
        if (!response.ok) throw new Error('Ошибка загрузки');
        allNews = await response.json();
    } catch (error) {
        console.error('Ошибка при загрузке новостей:', error);
        allNews = [];
    }
}

// Загрузить комментарии
async function loadComments() {
    try {
        const response = await fetch('data/comments.json');
        if (!response.ok) throw new Error('Ошибка загрузки');
        allComments = await response.json();
    } catch (error) {
        console.error('Ошибка при загрузке комментариев:', error);
        allComments = {};
    }
}

// Опубликовать новость
async function publishNews(event) {
    event.preventDefault();

    const news = {
        id: `news-${Date.now()}`,
        title: document.getElementById('newsTitle').value,
        excerpt: document.getElementById('newsExcerpt').value,
        fullText: document.getElementById('newsFullText').value,
        category: document.getElementById('newsCategory').value,
        image: document.getElementById('newsImage').value || 'https://via.placeholder.com/800x400',
        source: document.getElementById('newsSource').value,
        author: document.getElementById('newsAuthor').value || 'TechFlow',
        date: new Date().toISOString().split('T')[0],
        featured: document.getElementById('newsFeatured').checked,
        views: 0
    };

    // Добавить в массив
    allNews.unshift(news);

    // Сохранить в GitHub или локально
    try {
        await saveNews();
        showNotification('✅ Новость опубликована!', 'success');
        event.target.reset();
        document.getElementById('imagePreview').classList.add('hidden');
        renderNewsList();
        updateStats();
    } catch (error) {
        showNotification('❌ Ошибка при публикации', 'error');
        console.error(error);
    }
}

// Сохранить новости в GitHub
async function saveNews() {
    // Версия 1: Сохранение в локальное хранилище (быстро)
    localStorage.setItem('techflow_news', JSON.stringify(allNews));

    // Версия 2: Если есть GitHub Token, синхронизировать
    if (GITHUB_TOKEN) {
        try {
            await syncToGitHub();
        } catch (error) {
            console.warn('GitHub синхронизация не удалась, используем локальное хранилище:', error);
        }
    }
}

// Синхронизация с GitHub
async function syncToGitHub() {
    // Это требует GitHub Personal Access Token
    // В production используйте GitHub Actions для безопасности

    const path = 'data/news.json';
    const content = btoa(JSON.stringify(allNews, null, 2)); // Base64 encode

    // Получить текущий файл для получения SHA
    const getResponse = await fetch(
        `https://api.github.com/repos/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/contents/${path}`,
        {
            headers: {
                'Authorization': `token ${GITHUB_TOKEN}`,
                'Content-Type': 'application/json'
            }
        }
    );

    let sha = '';
    if (getResponse.ok) {
        const data = await getResponse.json();
        sha = data.sha;
    }

    // Обновить файл
    const response = await fetch(
        `https://api.github.com/repos/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/contents/${path}`,
        {
            method: 'PUT',
            headers: {
                'Authorization': `token ${GITHUB_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: `📰 Новость опубликована: ${allNews[0].title}`,
                content: content,
                sha: sha || undefined
            })
        }
    );

    if (!response.ok) {
        throw new Error(`GitHub API error: ${response.statusText}`);
    }
}

// Предпросмотр изображения
function previewImage() {
    const url = document.getElementById('newsImage').value;
    const preview = document.getElementById('imagePreview');

    if (url) {
        document.getElementById('previewImg').src = url;
        preview.classList.remove('hidden');
    } else {
        preview.classList.add('hidden');
    }
}

// Отрисовать список новостей
function renderNewsList() {
    const list = document.getElementById('newsList');
    const search = (document.getElementById('searchManagement')?.value || '').toLowerCase();

    let filtered = allNews;
    if (search) {
        filtered = allNews.filter(n => 
            n.title.toLowerCase().includes(search) ||
            n.excerpt.toLowerCase().includes(search)
        );
    }

    if (filtered.length === 0) {
        list.innerHTML = '<p>Новостей не найдено</p>';
        return;
    }

    list.innerHTML = filtered.map(news => `
        <div class="news-item">
            <div>
                <div class="news-item-title">${escapeHtml(news.title)}</div>
                <div class="news-item-meta">
                    ${news.date} | ${news.category} | ${(allComments[news.id] || []).length} комментариев
                </div>
            </div>
            <div class="news-item-actions">
                <button class="btn btn-secondary btn-small" onclick="editNews('${news.id}')">✏️ Редактировать</button>
                <button class="btn btn-danger btn-small" onclick="deleteNews('${news.id}')">🗑️ Удалить</button>
            </div>
        </div>
    `).join('');
}

// Редактировать новость
function editNews(newsId) {
    const news = allNews.find(n => n.id === newsId);
    if (!news) return;

    document.getElementById('editNewsId').value = newsId;
    document.getElementById('editTitle').value = news.title;
    document.getElementById('editExcerpt').value = news.excerpt;
    document.getElementById('editFullText').value = news.fullText;

    document.getElementById('editModal').classList.remove('hidden');
}

// Закрыть модальное окно редактирования
function closeEditModal() {
    document.getElementById('editModal').classList.add('hidden');
}

// Обновить новость
async function updateNews(event) {
    event.preventDefault();

    const newsId = document.getElementById('editNewsId').value;
    const news = allNews.find(n => n.id === newsId);

    if (!news) return;

    news.title = document.getElementById('editTitle').value;
    news.excerpt = document.getElementById('editExcerpt').value;
    news.fullText = document.getElementById('editFullText').value;

    try {
        await saveNews();
        showNotification('✅ Новость обновлена!', 'success');
        closeEditModal();
        renderNewsList();
    } catch (error) {
        showNotification('❌ Ошибка при обновлении', 'error');
    }
}

// Удалить новость
async function deleteNews(newsId) {
    if (!confirm('Вы уверены? Это действие нельзя отменить!')) return;

    allNews = allNews.filter(n => n.id !== newsId);

    try {
        await saveNews();
        showNotification('✅ Новость удалена', 'success');
        renderNewsList();
        updateStats();
    } catch (error) {
        showNotification('❌ Ошибка при удалении', 'error');
    }
}

// Загрузить шаблон
async function loadTemplate(templateName) {
    try {
        const response = await fetch('data/template.json');
        const templates = await response.json();
        const template = templates[templateName];

        if (template) {
            document.getElementById('newsTitle').value = template.title;
            document.getElementById('newsExcerpt').value = template.excerpt;
            document.getElementById('newsFullText').value = template.fullText;
            document.getElementById('newsCategory').value = template.category;
            switchTab('add');
            showNotification('✅ Шаблон загружен!', 'success');
        }
    } catch (error) {
        showNotification('❌ Ошибка при загрузке шаблона', 'error');
    }
}

// Обновить статистику
function updateStats() {
    const totalComments = Object.values(allComments).reduce((sum, arr) => sum + arr.length, 0);
    document.getElementById('totalNews').textContent = allNews.length;
    document.getElementById('totalComments').textContent = totalComments;
    document.getElementById('lastUpdate').textContent = new Date().toLocaleDateString('ru-RU');
}

// Экспортировать в JSON
function backupData() {
    const data = {
        news: allNews,
        comments: allComments,
        exportDate: new Date().toISOString()
    };

    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `techflow-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);

    showNotification('✅ Резервная копия создана!', 'success');
}

// Экспортировать в CSV
function exportCSV() {
    let csv = 'ID,Заголовок,Дата,Категория,Комментарии\n';

    allNews.forEach(news => {
        const comments = allComments[news.id]?.length || 0;
        csv += `"${news.id}","${news.title.replace(/"/g, '""')}","${news.date}","${news.category}","${comments}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `techflow-news-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    showNotification('✅ CSV экспортирован!', 'success');
}

// Очистить все комментарии
async function clearAllComments() {
    allComments = {};
    try {
        await saveComments();
        showNotification('✅ Все комментарии очищены!', 'success');
        updateStats();
    } catch (error) {
        showNotification('❌ Ошибка при очистке', 'error');
    }
}

// Сохранить комментарии
async function saveComments() {
    localStorage.setItem('techflow_comments', JSON.stringify(allComments));
}

// Утилиты
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
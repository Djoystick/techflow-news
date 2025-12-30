// ===== ПЕРЕМЕННЫЕ ГЛОБАЛЬНЫЕ =====
let allNews = [];
let allComments = {};
let currentView = 'grid'; // grid или list
let selectedCategory = 'all';

// ===== ЗАГРУЗКА ДАННЫХ ПРИ ЗАГРУЗКЕ СТРАНИЦЫ =====
document.addEventListener('DOMContentLoaded', function() {
    console.log('Page loaded, initializing...');
    
    // Загружаем новости
    loadNews();
    
    // Загружаем комментарии
    loadComments();
    
    // Инициализируем модальное окно
    initModal();
    
    // Отображаем новости
    setTimeout(() => {
        displayNews('all');
    }, 500);
});

// ===== ЗАГРУЗКА НОВОСТЕЙ ИЗ JSON =====
async function loadNews() {
    try {
        const response = await fetch('data/news.json');
        if (response.ok) {
            allNews = await response.json();
            console.log('✅ News loaded:', allNews.length, 'items');
        } else {
            console.error('❌ Failed to load news:', response.status);
            allNews = [];
        }
    } catch (error) {
        console.error('❌ Error loading news:', error.message);
        allNews = [];
    }
}

// ===== ЗАГРУЗКА КОММЕНТАРИЕВ ИЗ JSON =====
async function loadComments() {
    try {
        const response = await fetch('data/comments.json');
        if (response.ok) {
            allComments = await response.json();
            console.log('✅ Comments loaded');
        } else {
            console.error('❌ Failed to load comments');
            allComments = {};
        }
    } catch (error) {
        console.error('❌ Error loading comments:', error.message);
        allComments = {};
    }
}

// ===== ОТОБРАЖЕНИЕ НОВОСТЕЙ =====
function displayNews(category = 'all') {
    let newsToDisplay = allNews;
    
    // Фильтруем по категории
    if (category !== 'all') {
        newsToDisplay = allNews.filter(news => news.category === category);
        selectedCategory = category;
    } else {
        selectedCategory = 'all';
    }
    
    // Обновляем кнопки категорий
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.category === category) {
            btn.classList.add('active');
        }
    });
    
    // Отображаем новости
    const newsGrid = document.getElementById('newsGrid') || document.querySelector('.news-grid');
    if (!newsGrid) {
        console.error('❌ News grid element not found');
        return;
    }
    
    newsGrid.innerHTML = '';
    
    if (newsToDisplay.length === 0) {
        newsGrid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #999; padding: 40px;">Новостей не найдено</p>';
        return;
    }
    
    newsToDisplay.forEach(news => {
        const newsCard = createNewsCard(news);
        newsGrid.appendChild(newsCard);
    });
    
    console.log(`✅ Displayed ${newsToDisplay.length} news items`);
}

// ===== СОЗДАНИЕ КАРТОЧКИ НОВОСТИ =====
function createNewsCard(news) {
    const card = document.createElement('div');
    card.className = 'news-card';
    card.onclick = () => openNewsModal(news.id);
    
    const commentsCount = (allComments[news.id] || []).length;
    const badge = news.featured ? '<div class="news-badge">⭐ Featured</div>' : '';
    
    card.innerHTML = `
        <div class="news-image" style="position: relative;">
            <img src="${news.image || 'assets/images/default.jpg'}" alt="${news.title}" onerror="this.src='assets/images/default.jpg'">
            ${badge}
        </div>
        <div class="news-content">
            <div class="news-category">${getCategoryEmoji(news.category)} ${news.category}</div>
            <h3 class="news-title">${news.title}</h3>
            <p class="news-excerpt">${news.excerpt}</p>
            <div class="news-meta">
                <span>📅 ${news.date || new Date().toLocaleDateString()}</span>
                <span>💬 ${commentsCount}</span>
            </div>
            <div class="news-footer">
                <span class="news-author">By ${news.author}</span>
                <button class="read-btn">Читать →</button>
            </div>
        </div>
    `;
    
    return card;
}

// ===== ЭМОДЗИ КАТЕГОРИЙ =====
function getCategoryEmoji(category) {
    const emojis = {
        'ai': '🤖',
        'gadgets': '📱',
        'software': '💻',
        'hardware': '🔧',
        'crypto': '💰'
    };
    return emojis[category] || '📰';
}

// ===== МОДАЛЬНОЕ ОКНО - ИНИЦИАЛИЗАЦИЯ =====
function initModal() {
    const modal = document.getElementById('newsModal');
    
    if (!modal) {
        console.error('❌ Modal element not found!');
        return;
    }
    
    // Закрытие при клике на черный фон
    modal.addEventListener('click', function(event) {
        if (event.target === this) {
            closeModal();
        }
    });
    
    // Закрытие при нажатии ESC
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape' || event.keyCode === 27) {
            closeModal();
        }
    });
    
    // Закрытие при клике на кнопку X
    const closeBtn = modal.querySelector('.modal-close');
    if (closeBtn) {
        closeBtn.addEventListener('click', closeModal);
    }
    
    console.log('✅ Modal initialized');
}

// ===== МОДАЛЬНОЕ ОКНО - ОТКРЫТИЕ =====
function openNewsModal(newsId) {
    const news = allNews.find(n => n.id === newsId);
    
    if (!news) {
        console.error('❌ News not found:', newsId);
        return;
    }
    
    console.log('📖 Opening modal for:', news.title);
    
    // Получаем элементы
    const modalTitle = document.getElementById('modalTitle');
    const modalDate = document.getElementById('modalDate');
    const modalAuthor = document.getElementById('modalAuthor');
    const modalCategory = document.getElementById('modalCategory');
    const modalBody = document.getElementById('modalBody');
    const modalImage = document.getElementById('modalImage');
    const modalSource = document.getElementById('modalSource');
    
    // Проверяем что элементы существуют
    if (!modalTitle || !modalBody || !modalImage) {
        console.error('❌ Modal elements not found');
        return;
    }
    
    // Заполняем данные
    modalTitle.textContent = news.title || 'Без заголовка';
    modalDate.textContent = news.date || new Date().toLocaleDateString();
    modalAuthor.textContent = news.author || 'Автор неизвестен';
    modalCategory.textContent = getCategoryEmoji(news.category) + ' ' + (news.category || 'Новости');
    modalBody.innerHTML = news.fullText || news.excerpt || 'Содержание не доступно';
    
    // Загружаем изображение
    modalImage.src = news.image || 'assets/images/default.jpg';
    modalImage.alt = news.title;
    modalImage.onerror = function() {
        this.src = 'assets/images/default.jpg';
        console.warn('⚠️ Failed to load image:', news.image);
    };
    
    // Устанавливаем источник
    if (modalSource) {
        modalSource.href = news.source || '#';
        modalSource.target = '_blank';
    }
    
    // Открываем модальное окно
    const modal = document.getElementById('newsModal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        console.log('✅ Modal opened');
    }
}

// ===== МОДАЛЬНОЕ ОКНО - ЗАКРЫТИЕ =====
function closeModal() {
    const modal = document.getElementById('newsModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = 'auto';
        console.log('✅ Modal closed');
    }
}

// ===== СМЕНА ВИДА ОТОБРАЖЕНИЯ =====
function toggleView(view) {
    currentView = view;
    
    const newsGrid = document.querySelector('.news-grid');
    
    if (view === 'list') {
        newsGrid.style.gridTemplateColumns = '1fr';
    } else {
        newsGrid.style.gridTemplateColumns = 'repeat(auto-fill, minmax(280px, 1fr))';
    }
    
    // Обновляем кнопки
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    console.log('View changed to:', view);
}

// ===== ФИЛЬТРАЦИЯ ПО КАТЕГОРИЯМ =====
function filterByCategory(category) {
    displayNews(category);
}

// ===== ПОИСК =====
function searchNews(query) {
    const searchTerm = query.toLowerCase();
    const filtered = allNews.filter(news => 
        news.title.toLowerCase().includes(searchTerm) ||
        news.excerpt.toLowerCase().includes(searchTerm)
    );
    
    const newsGrid = document.querySelector('.news-grid');
    newsGrid.innerHTML = '';
    
    if (filtered.length === 0) {
        newsGrid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #999; padding: 40px;">Ничего не найдено</p>';
        return;
    }
    
    filtered.forEach(news => {
        const newsCard = createNewsCard(news);
        newsGrid.appendChild(newsCard);
    });
}

// ===== КОММЕНТАРИИ - ОТПРАВКА =====
function postComment(newsId, name, text) {
    if (!newsId || !name || !text) {
        alert('Пожалуйста, заполните все поля');
        return;
    }
    
    // Инициализируем массив если его нет
    if (!allComments[newsId]) {
        allComments[newsId] = [];
    }
    
    // Добавляем комментарий
    const comment = {
        id: 'comment-' + Date.now(),
        author: name,
        text: text,
        date: new Date().toLocaleString(),
        likes: 0
    };
    
    allComments[newsId].push(comment);
    
    console.log('✅ Comment posted:', comment);
    
    // Обновляем отображение
    displayComments(newsId);
    
    // Очищаем форму
    document.getElementById('commentAuthor').value = '';
    document.getElementById('commentText').value = '';
}

// ===== КОММЕНТАРИИ - ОТОБРАЖЕНИЕ =====
function displayComments(newsId) {
    const commentsList = document.getElementById('commentsList');
    if (!commentsList) return;
    
    const comments = allComments[newsId] || [];
    
    if (comments.length === 0) {
        commentsList.innerHTML = '<p style="color: #999; text-align: center;">Комментариев еще нет</p>';
        return;
    }
    
    commentsList.innerHTML = comments.map(comment => `
        <div class="comment">
            <div class="comment-author">${comment.author}</div>
            <div class="comment-text">${comment.text}</div>
            <div class="comment-time">${comment.date}</div>
        </div>
    `).join('');
}

// ===== ЗАГРУЗКА БОЛЬШЕ НОВОСТЕЙ =====
function loadMoreNews() {
    console.log('Loading more news...');
    // Эта функция используется при бесконечном скроле
    // Здесь можно добавить загрузку дополнительных новостей
}

// ===== ТЕМА САЙТА =====
function toggleTheme() {
    const html = document.documentElement;
    const isDark = html.getAttribute('data-theme') === 'dark';
    
    if (isDark) {
        html.removeAttribute('data-theme');
        localStorage.setItem('theme', 'light');
    } else {
        html.setAttribute('data-theme', 'dark');
        localStorage.setItem('theme', 'dark');
    }
    
    console.log('Theme changed to:', isDark ? 'light' : 'dark');
}

// ===== ЗАГРУЗКА СОХРАНЕННОЙ ТЕМЫ =====
function loadSavedTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
    }
}

// Загружаем тему при загрузке
loadSavedTheme();

// ===== ОБРАБОТКА КЛАВИШ =====
document.addEventListener('keydown', function(event) {
    // Поиск по Ctrl+K
    if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
        event.preventDefault();
        const searchInput = document.querySelector('input[placeholder*="Search"]');
        if (searchInput) searchInput.focus();
    }
});

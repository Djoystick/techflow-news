/* ========================================
   TECHFLOW - ХРАНИЛИЩЕ (storage.js)
   Управление данными без использования localStorage
   ======================================== */

class StorageManager {
    constructor() {
        this.cache = {
            news: [],
            comments: {}
        };
        this.isDirty = false;
    }

    // Загрузить новости с сервера
    async loadNews() {
        try {
            const response = await fetch('data/news.json');
            if (!response.ok) throw new Error('Ошибка загрузки');
            this.cache.news = await response.json();
            return this.cache.news;
        } catch (error) {
            console.error('Ошибка при загрузке новостей:', error);
            return [];
        }
    }

    // Загрузить комментарии с сервера
    async loadComments() {
        try {
            const response = await fetch('data/comments.json');
            if (!response.ok) throw new Error('Ошибка загрузки');
            this.cache.comments = await response.json();
            return this.cache.comments;
        } catch (error) {
            console.error('Ошибка при загрузке комментариев:', error);
            return {};
        }
    }

    // Получить все новости
    getNews() {
        return this.cache.news;
    }

    // Получить новость по ID
    getNewsById(id) {
        return this.cache.news.find(n => n.id === id);
    }

    // Добавить новость
    addNews(news) {
        this.cache.news.unshift(news);
        this.isDirty = true;
        return news;
    }

    // Обновить новость
    updateNews(id, updates) {
        const news = this.getNewsById(id);
        if (news) {
            Object.assign(news, updates);
            this.isDirty = true;
        }
        return news;
    }

    // Удалить новость
    deleteNews(id) {
        const index = this.cache.news.findIndex(n => n.id === id);
        if (index > -1) {
            this.cache.news.splice(index, 1);
            this.isDirty = true;
            return true;
        }
        return false;
    }

    // Получить все комментарии для новости
    getComments(newsId) {
        return this.cache.comments[newsId] || [];
    }

    // Добавить комментарий
    addComment(newsId, comment) {
        if (!this.cache.comments[newsId]) {
            this.cache.comments[newsId] = [];
        }
        this.cache.comments[newsId].push(comment);
        this.isDirty = true;
        return comment;
    }

    // Удалить комментарий
    deleteComment(newsId, commentId) {
        if (this.cache.comments[newsId]) {
            const index = this.cache.comments[newsId].findIndex(c => c.id === commentId);
            if (index > -1) {
                this.cache.comments[newsId].splice(index, 1);
                this.isDirty = true;
                return true;
            }
        }
        return false;
    }

    // Получить статистику
    getStats() {
        const totalNews = this.cache.news.length;
        const totalComments = Object.values(this.cache.comments)
            .reduce((sum, comments) => sum + comments.length, 0);
        const totalViews = this.cache.news
            .reduce((sum, news) => sum + (news.views || 0), 0);

        return {
            totalNews,
            totalComments,
            totalViews,
            averageViews: totalNews > 0 ? Math.round(totalViews / totalNews) : 0
        };
    }

    // Получить новости по категориям
    getNewsByCategory(category) {
        return this.cache.news.filter(n => n.category === category);
    }

    // Получить популярные новости
    getPopularNews(limit = 5) {
        return [...this.cache.news]
            .sort((a, b) => (b.views || 0) - (a.views || 0))
            .slice(0, limit);
    }

    // Получить избранные новости
    getFeaturedNews() {
        return this.cache.news.filter(n => n.featured);
    }

    // Поиск по запросу
    search(query) {
        const q = query.toLowerCase();
        return this.cache.news.filter(news =>
            news.title.toLowerCase().includes(q) ||
            news.excerpt.toLowerCase().includes(q) ||
            news.fullText?.toLowerCase().includes(q)
        );
    }

    // Очистить все данные
    clear() {
        this.cache = {
            news: [],
            comments: {}
        };
        this.isDirty = false;
    }

    // Экспортировать данные
    export() {
        return {
            version: '1.0.0',
            exportDate: new Date().toISOString(),
            data: this.cache
        };
    }

    // Импортировать данные
    import(data) {
        if (data && data.data) {
            this.cache = data.data;
            this.isDirty = false;
            return true;
        }
        return false;
    }
}

// Глобальный экземпляр
const storage = new StorageManager();
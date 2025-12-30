/**
 * 🔴 ГЛОБАЛЬНЫЙ ОБРАБОТЧИК ОШИБОК
 * Отображает ВСЕ ошибки на странице в виде парящей панели
 * + Логирует в localStorage для отладки
 */

(function() {
    // ============== КОНФИГ ==============
    const DEBUG_CONFIG = {
        SHOW_ON_ERROR: true,      // Показать панель при ошибке
        LOG_TO_STORAGE: true,     // Логировать в localStorage
        STORAGE_KEY: 'error-logs-debug',
        MAX_ERRORS: 50,           // Хранить последние 50 ошибок
        CONSOLE_PREFIX: '🔴 [ERROR-OVERLAY]'
    };

    // ============== ХРАНИЛИЩЕ ОШИБОК ==============
    const ErrorStorage = {
        add(error) {
            if (!DEBUG_CONFIG.LOG_TO_STORAGE) return;
            
            try {
                let errors = JSON.parse(localStorage.getItem(DEBUG_CONFIG.STORAGE_KEY) || '[]');
                
                errors.push({
                    timestamp: new Date().toLocaleTimeString('ru-RU'),
                    message: error.message,
                    stack: error.stack,
                    type: error.type || 'javascript',
                    source: error.filename || 'unknown',
                    line: error.lineno || 'unknown'
                });
                
                // Ограничиваем размер
                if (errors.length > DEBUG_CONFIG.MAX_ERRORS) {
                    errors = errors.slice(-DEBUG_CONFIG.MAX_ERRORS);
                }
                
                localStorage.setItem(DEBUG_CONFIG.STORAGE_KEY, JSON.stringify(errors));
            } catch (e) {
                console.log(DEBUG_CONFIG.CONSOLE_PREFIX, 'Ошибка при сохранении в localStorage:', e);
            }
        },

        getAll() {
            try {
                return JSON.parse(localStorage.getItem(DEBUG_CONFIG.STORAGE_KEY) || '[]');
            } catch (e) {
                return [];
            }
        },

        clear() {
            try {
                localStorage.removeItem(DEBUG_CONFIG.STORAGE_KEY);
            } catch (e) {
                console.log(DEBUG_CONFIG.CONSOLE_PREFIX, 'Ошибка при очистке:', e);
            }
        }
    };

    // ============== ПАНЕЛЬ ОШИБОК ==============
    let errorPanelCreated = false;

    function createErrorPanel() {
        if (errorPanelCreated) return;
        errorPanelCreated = true;

        // Стили
        const styles = `
            #error-overlay-panel {
                position: fixed;
                bottom: 20px;
                right: 20px;
                width: 400px;
                max-height: 500px;
                background: #1a1a1a;
                border: 2px solid #f44336;
                border-radius: 8px;
                box-shadow: 0 0 30px rgba(244, 67, 54, 0.3);
                z-index: 999999;
                font-family: 'Courier New', monospace;
                font-size: 12px;
                color: #f44336;
                overflow: hidden;
                display: flex;
                flex-direction: column;
            }

            #error-overlay-header {
                background: #f44336;
                color: white;
                padding: 10px 15px;
                font-weight: bold;
                cursor: pointer;
                user-select: none;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }

            #error-overlay-header:hover {
                background: #da190b;
            }

            #error-overlay-content {
                flex: 1;
                overflow-y: auto;
                padding: 10px;
                background: #0a0a0a;
            }

            .error-item {
                margin-bottom: 12px;
                padding: 8px;
                border-left: 3px solid #f44336;
                background: rgba(244, 67, 54, 0.05);
                border-radius: 3px;
            }

            .error-time {
                color: #4CAF50;
                font-size: 11px;
            }

            .error-message {
                color: #f44336;
                margin: 5px 0;
                word-break: break-word;
            }

            .error-stack {
                color: #b0b0b0;
                font-size: 10px;
                margin-top: 5px;
                max-height: 80px;
                overflow-y: auto;
            }

            #error-overlay-footer {
                border-top: 1px solid #404040;
                padding: 8px;
                background: #0a0a0a;
                display: flex;
                gap: 5px;
            }

            .error-btn {
                flex: 1;
                padding: 6px;
                background: #f44336;
                color: white;
                border: none;
                border-radius: 3px;
                cursor: pointer;
                font-size: 11px;
                font-weight: bold;
                transition: all 0.2s;
            }

            .error-btn:hover {
                background: #da190b;
            }

            .error-btn:active {
                transform: scale(0.95);
            }

            #error-count {
                background: #f44336;
                color: white;
                border-radius: 12px;
                padding: 2px 8px;
                font-size: 11px;
                font-weight: bold;
            }

            @media (max-width: 600px) {
                #error-overlay-panel {
                    width: calc(100vw - 40px);
                    bottom: 10px;
                    right: 10px;
                }
            }
        `;

        // Добавить стили
        const styleElement = document.createElement('style');
        styleElement.textContent = styles;
        document.head.appendChild(styleElement);

        // HTML панели
        const panel = document.createElement('div');
        panel.id = 'error-overlay-panel';
        panel.innerHTML = `
            <div id="error-overlay-header">
                <span>🔴 ОШИБКИ (<span id="error-count">0</span>)</span>
                <span id="error-toggle" style="cursor: pointer; font-size: 16px;">−</span>
            </div>
            <div id="error-overlay-content"></div>
            <div id="error-overlay-footer">
                <button class="error-btn" onclick="window.errorDebug.exportErrors()">📥 Экспорт</button>
                <button class="error-btn" onclick="window.errorDebug.clearErrors()">🗑️ Очистить</button>
                <button class="error-btn" onclick="window.errorDebug.togglePanel()">✖️ Закрыть</button>
            </div>
        `;

        document.body.appendChild(panel);

        // Обработчики
        document.getElementById('error-toggle').addEventListener('click', function() {
            const content = document.getElementById('error-overlay-content');
            const isHidden = content.style.display === 'none';
            content.style.display = isHidden ? 'block' : 'none';
            this.textContent = isHidden ? '−' : '+';
        });
    }

    function updateErrorPanel() {
        if (!errorPanelCreated) return;

        const errors = ErrorStorage.getAll();
        const container = document.getElementById('error-overlay-content');
        const count = document.getElementById('error-count');

        count.textContent = errors.length;

        if (errors.length === 0) {
            container.innerHTML = '<p style="color: #4CAF50; text-align: center; padding: 20px;">✅ Ошибок не найдено</p>';
            return;
        }

        container.innerHTML = errors.map((err, idx) => `
            <div class="error-item">
                <div class="error-time">⏰ ${err.timestamp}</div>
                <div class="error-message">📍 ${err.source}:${err.line}</div>
                <div class="error-message"><strong>${err.message}</strong></div>
                ${err.stack ? `<div class="error-stack">${err.stack.substring(0, 200)}...</div>` : ''}
            </div>
        `).join('');

        // Скролл в конец
        container.scrollTop = container.scrollHeight;
    }

    // ============== ГЛОБАЛЬНЫЕ ОБРАБОТЧИКИ ==============

    // 1️⃣ JavaScript ошибки
    window.addEventListener('error', function(event) {
        console.error(DEBUG_CONFIG.CONSOLE_PREFIX, 'JS Error:', event.message);
        
        ErrorStorage.add({
            message: event.message,
            stack: event.error?.stack || 'No stack trace',
            filename: event.filename,
            lineno: event.lineno,
            type: 'javascript'
        });

        if (DEBUG_CONFIG.SHOW_ON_ERROR) {
            createErrorPanel();
            updateErrorPanel();
        }
    });

    // 2️⃣ Promise rejection
    window.addEventListener('unhandledrejection', function(event) {
        console.error(DEBUG_CONFIG.CONSOLE_PREFIX, 'Promise Rejection:', event.reason);
        
        ErrorStorage.add({
            message: `Promise: ${event.reason?.message || String(event.reason)}`,
            stack: event.reason?.stack || 'No stack trace',
            type: 'promise'
        });

        if (DEBUG_CONFIG.SHOW_ON_ERROR) {
            createErrorPanel();
            updateErrorPanel();
        }
    });

    // 3️⃣ Console.error перехват
    const originalError = console.error;
    console.error = function(...args) {
        originalError.apply(console, args);
        
        ErrorStorage.add({
            message: args.map(arg => 
                typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
            ).join(' '),
            type: 'console.error'
        });

        if (DEBUG_CONFIG.SHOW_ON_ERROR) {
            createErrorPanel();
            updateErrorPanel();
        }
    };

    // ============== ПУБЛИЧНЫЙ API ==============
    window.errorDebug = {
        // Показать панель
        showPanel() {
            createErrorPanel();
            updateErrorPanel();
            console.log(DEBUG_CONFIG.CONSOLE_PREFIX, 'Панель ошибок открыта');
        },

        // Скрыть панель
        togglePanel() {
            const panel = document.getElementById('error-overlay-panel');
            if (panel) {
                panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
            }
        },

        // Получить все ошибки
        getErrors() {
            return ErrorStorage.getAll();
        },

        // Очистить
        clearErrors() {
            if (confirm('Очистить все ошибки?')) {
                ErrorStorage.clear();
                updateErrorPanel();
                console.log(DEBUG_CONFIG.CONSOLE_PREFIX, 'Ошибки очищены');
            }
        },

        // Экспорт
        exportErrors() {
            const errors = ErrorStorage.getAll();
            const text = errors.map(e => 
                `[${e.timestamp}] ${e.type.toUpperCase()}\n${e.message}\n${e.source}:${e.line}\n\n`
            ).join('');

            const element = document.createElement('a');
            element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
            element.setAttribute('download', `errors-${Date.now()}.txt`);
            element.style.display = 'none';
            document.body.appendChild(element);
            element.click();
            document.body.removeChild(element);

            console.log(DEBUG_CONFIG.CONSOLE_PREFIX, 'Ошибки экспортированы');
        },

        // Логирование переменной
        log(name, value) {
            const msg = `${name}: ${typeof value === 'object' ? JSON.stringify(value, null, 2) : value}`;
            console.log(DEBUG_CONFIG.CONSOLE_PREFIX, msg);
        }
    };

    // Старт
    console.log(DEBUG_CONFIG.CONSOLE_PREFIX, '✅ Глобальный обработчик ошибок инициализирован');
    console.log(DEBUG_CONFIG.CONSOLE_PREFIX, 'Используйте: window.errorDebug.showPanel()');
})();

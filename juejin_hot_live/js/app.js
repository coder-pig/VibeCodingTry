/**
 * 掘金微热榜前端应用
 * 实现掘金文章热榜的展示和分类切换功能
 */

// 全局变量
const categoryMap = {
    '综合': '1',
    '后端': '6809637769959178254',
    '前端': '6809637767543259144',
    'Android': '6809635626879549454',
    'iOS': '6809635626661445640',
    '人工智能': '6809637773935378440',
    '开发工具': '6809637771511070734',
    '代码人生': '6809637776263217160',
    '阅读': '6809637772874219534'
};

// DOM 元素
const articleListEl = document.getElementById('article-list');
const loadingEl = document.getElementById('loading');
const categoryListEl = document.getElementById('category-list');
const themeToggleEl = document.getElementById('theme-toggle');
const themeLightIconEl = document.getElementById('theme-icon-light');
const themeDarkIconEl = document.getElementById('theme-icon-dark');

// 当前选中的分类
let currentCategory = '1'; // 默认为综合

// 当前主题模式
let isDarkMode = false;

// 数据缓存对象
const dataCache = new Map();

// 缓存过期时间（毫秒）- 5分钟
const CACHE_EXPIRE_TIME = 5 * 60 * 1000;

/**
 * 初始化应用
 */
function initApp() {
    // 绑定分类点击事件
    categoryListEl.addEventListener('click', handleCategoryClick);
    
    // 绑定主题切换事件
    themeToggleEl.addEventListener('click', toggleTheme);
    
    // 初始化主题
    initTheme();
    
    // 加载默认分类的数据
    loadArticles(currentCategory);
}

/**
 * 初始化主题设置
 */
function initTheme() {
    // 从本地存储获取主题设置
    const savedTheme = localStorage.getItem('theme');
    
    // 检查系统偏好设置
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    // 确定初始主题
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
        isDarkMode = true;
        document.documentElement.setAttribute('data-theme', 'dark');
        updateThemeIcon();
    }
}

/**
 * 切换主题模式
 */
function toggleTheme() {
    isDarkMode = !isDarkMode;
    
    if (isDarkMode) {
        document.documentElement.setAttribute('data-theme', 'dark');
        localStorage.setItem('theme', 'dark');
    } else {
        document.documentElement.removeAttribute('data-theme');
        localStorage.setItem('theme', 'light');
    }
    
    updateThemeIcon();
}

/**
 * 更新主题图标显示
 */
function updateThemeIcon() {
    if (isDarkMode) {
        themeLightIconEl.style.display = 'none';
        themeDarkIconEl.style.display = 'block';
    } else {
        themeLightIconEl.style.display = 'block';
        themeDarkIconEl.style.display = 'none';
    }
}

/**
 * 处理分类点击事件
 * @param {Event} event - 点击事件对象
 */
function handleCategoryClick(event) {
    if (event.target.tagName === 'LI') {
        // 更新选中状态
        const categoryItems = categoryListEl.querySelectorAll('li');
        categoryItems.forEach(item => item.classList.remove('active'));
        event.target.classList.add('active');
        
        // 获取分类ID并加载数据
        const categoryId = event.target.getAttribute('data-category');
        currentCategory = categoryId;
        loadArticles(categoryId);
    }
}

/**
 * 检查缓存是否有效
 * @param {string} categoryId - 分类ID
 * @returns {Object|null} 缓存的数据或null
 */
function getCachedData(categoryId) {
    const cached = dataCache.get(categoryId);
    if (cached && (Date.now() - cached.timestamp) < CACHE_EXPIRE_TIME) {
        console.log(`从缓存加载分类 ${categoryId} 的数据 ✨`);
        return cached.data;
    }
    return null;
}

/**
 * 设置缓存数据
 * @param {string} categoryId - 分类ID
 * @param {Array} data - 文章数据
 */
function setCachedData(categoryId, data) {
    dataCache.set(categoryId, {
        data: data,
        timestamp: Date.now()
    });
    console.log(`已缓存分类 ${categoryId} 的数据 💾`);
}

/**
 * 加载指定分类的文章数据
 * @param {string} categoryId - 分类ID
 */
async function loadArticles(categoryId) {
    try {
        // 先检查缓存
        const cachedData = getCachedData(categoryId);
        if (cachedData) {
            renderArticles(cachedData);
            return;
        }
        
        // 显示加载中状态
        showLoading(true);
        
        // 使用 Gitee 的原始URL
        const giteeUrl = `https://gitee.com/coder-pig/juejin_file_save/raw/master/hot_articles/${categoryId}.json`;
        
        // 使用 CORS 代理解决跨域问题
        const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(giteeUrl)}`;
        console.log(`正在从 ${proxyUrl} 加载真实数据...`);
        
        // 直接从代理URL获取真实数据
        const response = await fetch(proxyUrl);
        
        if (!response.ok) {
            throw new Error(`HTTP请求失败! 状态码: ${response.status}`);
        }
        
        const articles = await response.json();
        console.log('真实数据加载成功！', articles);
        
        // 检查数据格式和内容
        if (!articles || !Array.isArray(articles) || articles.length === 0) {
            throw new Error('获取的数据格式不正确或为空');
        }
        
        // 缓存数据
        setCachedData(categoryId, articles);
        
        // 渲染文章列表
        renderArticles(articles);
        
    } catch (error) {
        console.error('加载文章失败:', error);
        articleListEl.innerHTML = `
            <div class="error-message">
                <h3>😅 数据加载失败</h3>
                <p>无法从远程服务器获取数据，请检查网络连接或稍后再试</p>
                <small>错误详情: ${error.message}</small>
                <br><br>
                <button onclick="loadArticles('${categoryId}')" style="padding: 8px 16px; background: var(--highlight-color); color: white; border: none; border-radius: 4px; cursor: pointer;">重试</button>
            </div>
        `;
    } finally {
        // 隐藏加载中状态
        showLoading(false);
    }
}



/**
 * 渲染文章列表
 * @param {Array} articles - 文章数据数组
 */
function renderArticles(articles) {
    // 清空现有内容
    articleListEl.innerHTML = '';
    
    // 检查是否有数据
    if (!articles || articles.length === 0) {
        articleListEl.innerHTML = '<div class="empty-message">该分类下暂无文章</div>';
        articleListEl.style.display = 'block';
        return;
    }
    
    let html = '';
    articles.forEach((article, index) => {
        // 使用ai_title，如果没有或为特定无效值则使用title
        const invalidTitles = ['', '无', '未获取到文章内容', '文章内容获取失败', "无法生成"];
        const title = (article.ai_title && !invalidTitles.includes(article.ai_title)) ? article.ai_title : article.title;
        const url = article.content_url || '';
        
        html += `
            <div class="article-card" data-url="${url}" style="--animation-order: ${index}">
                <h3 class="article-title">${title}</h3>
                <div class="article-author">
                    ${article.author_name || ''}
                    <div class="article-time">${article.publish_time || ''}</div>
                </div>
                <p class="article-desc">${article.ai_desc || ''}</p>
                <div class="article-meta">
                    <div class="article-stats">
                        <div class="stat-item">
                            <svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
                                <path d="M512 234.666667c-153.173333 0-277.333333 124.16-277.333333 277.333333 0 153.173333 124.16 277.333333 277.333333 277.333333 153.173333 0 277.333333-124.16 277.333333-277.333333C789.333333 358.826667 665.173333 234.666667 512 234.666667zM512 746.666667c-129.386667 0-234.666667-105.28-234.666667-234.666667 0-129.386667 105.28-234.666667 234.666667-234.666667 129.386667 0 234.666667 105.28 234.666667 234.666667C746.666667 641.386667 641.386667 746.666667 512 746.666667z" fill="currentColor"></path>
                                <path d="M512 362.666667c-82.346667 0-149.333333 66.986667-149.333333 149.333333 0 82.346667 66.986667 149.333333 149.333333 149.333333 82.346667 0 149.333333-66.986667 149.333333-149.333333C661.333333 429.653333 594.346667 362.666667 512 362.666667zM512 618.666667c-58.88 0-106.666667-47.786667-106.666667-106.666667 0-58.88 47.786667-106.666667 106.666667-106.666667 58.88 0 106.666667 47.786667 106.666667 106.666667C618.666667 570.88 570.88 618.666667 512 618.666667z" fill="currentColor"></path>
                            </svg>
                            <span>${article.view || 0}</span>
                        </div>
                        <div class="stat-item">
                            <svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
                                <path d="M512 128c-212.064 0-384 171.936-384 384 0 212.064 171.936 384 384 384 212.064 0 384-171.936 384-384C896 299.936 724.064 128 512 128zM512 832c-176.448 0-320-143.552-320-320 0-176.448 143.552-320 320-320 176.448 0 320 143.552 320 320C832 688.448 688.448 832 512 832z" fill="currentColor"></path>
                                <path d="M710.624 390.624c-12.512-12.512-32.736-12.512-45.248 0L512 543.936 358.624 390.624c-12.512-12.512-32.736-12.512-45.248 0s-12.512 32.736 0 45.248l176 176c6.24 6.24 14.432 9.376 22.624 9.376s16.384-3.136 22.624-9.376l176-176C723.136 423.36 723.136 403.136 710.624 390.624z" fill="currentColor"></path>
                            </svg>
                            <span>${article.like || 0}</span>
                        </div>
                        <div class="stat-item">
                            <svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
                                <path d="M896 138.667H128c-25.6 0-42.667 17.067-42.667 42.667v512c0 25.6 17.067 42.667 42.667 42.667h298.667l128 128c8.533 8.533 21.333 12.8 29.867 12.8 12.8 0 21.333-4.267 29.867-12.8l128-128H896c25.6 0 42.667-17.067 42.667-42.667V181.333c0-25.6-17.067-42.667-42.667-42.667z m-42.667 512H661.333c-12.8 0-21.333 4.267-29.867 12.8L512 782.933l-119.467-119.467c-8.533-8.533-17.067-12.8-29.867-12.8H170.667V224h682.667v426.667z" fill="currentColor"></path>
                            </svg>
                            <span>${article.comment_count || 0}</span>
                        </div>
                        <div class="stat-item">
                            <svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
                                <path d="M725.333333 192c-89.6 0-168.533333 44.8-213.333333 115.2C467.2 236.8 388.266667 192 298.666667 192 157.866667 192 42.666667 307.2 42.666667 448c0 253.866667 469.333333 512 469.333333 512s469.333333-256 469.333333-512c0-140.8-115.2-256-256-256z" fill="currentColor"></path>
                            </svg>
                            <span>${article.collect || 0}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    });
    
    articleListEl.innerHTML = html;
    // 保持CSS中定义的grid布局，不需要重新设置display
    
    // 添加点击事件
    document.querySelectorAll('.article-card').forEach(card => {
        card.addEventListener('click', () => {
            const url = card.getAttribute('data-url');
            if (url) {
                window.open(url, '_blank');
            }
        });
    });
    
    // 添加进入动画
    document.querySelectorAll('.article-card').forEach((card, index) => {
        setTimeout(() => {
            card.classList.add('visible');
        }, index * 100);
    });
    
    // 添加滚动监听，实现滚动时的动画效果
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1
    });
    
    document.querySelectorAll('.article-card').forEach(card => {
        observer.observe(card);
    });
}

/**
 * 显示或隐藏加载状态
 * @param {boolean} isLoading - 是否显示加载状态
 */
function showLoading(isLoading) {
    if (isLoading) {
        loadingEl.innerHTML = `
            <div class="spinner-container">
                <div class="spinner"></div>
                <div class="spinner-text">加载中...</div>
            </div>
        `;
        loadingEl.style.display = 'flex';
        articleListEl.style.display = 'none';
    } else {
        loadingEl.style.display = 'none';
        articleListEl.style.display = 'grid';
    }
}

// 页面加载完成后初始化应用
document.addEventListener('DOMContentLoaded', initApp);
/* ============================================
   AI 导航网站 - 主 JavaScript 文件
   Data-driven navigation for AI tools
   ============================================ */

// ======== 全局状态 ========
let siteData = null;

// ======== DOM 加载入口 ========
document.addEventListener('DOMContentLoaded', async () => {
  initNav();
  initScrollHeader();
  initFadeIn();
  markActiveNav();
  initSmoothScroll();
  enableExternalLinks();

  // 加载数据
  siteData = await loadData();
  if (!siteData) return;

  // 根据页面执行不同渲染
  const page = getPageName();

  if (page === 'index.html' || page === '') {
    renderStats();
    renderCategoryCards();
    renderFeaturedTools();
  } else if (page === 'tools.html') {
    renderToolsPage();
  } else if (page === 'tool-detail.html') {
    renderToolDetail();
  }

  // 渲染完成后再次绑定滚动渐显
  initFadeIn();

  // 隐藏加载遮罩
  const loadingEl = document.getElementById('loading');
  if (loadingEl) {
    loadingEl.style.display = 'none';
  }
});

// ======== 1. loadData() — 从 data.json 加载数据 ========
async function loadData() {
  // 自动检测相对路径：根目录用 data.json，子目录用 ../data.json
  const path = window.location.pathname;
  const inSubdir = path.includes('/pages/') || path.includes('/tools/');
  const basePath = inSubdir ? '../data.json' : 'data.json';

  try {
    const res = await fetch(basePath);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (e) {
    console.error('❌ AI 导航数据加载失败:', e);
    // 第二次尝试（备用路径）
    try {
      const fallback = inSubdir ? '../../data.json' : '../data.json';
      const res2 = await fetch(fallback);
      if (!res2.ok) throw new Error(`HTTP ${res2.status}`);
      return await res2.json();
    } catch (e2) {
      console.error('❌ 备用路径也失败:', e2);
      showLoadError();
      return null;
    }
  }
}

function showLoadError() {
  const containers = document.querySelectorAll('[data-render]');
  containers.forEach(el => {
    el.innerHTML = `
      <div class="load-error">
        <span class="load-error-icon">⚠️</span>
        <p>数据加载失败，请刷新页面重试</p>
      </div>`;
  });
}

// ======== 页面名称辅助 ========
function getPageName() {
  const path = window.location.pathname.split('/').pop() || '';
  return path;
}

// ======== 10. Nav 高亮当前页面 ========
function markActiveNav() {
  const current = getPageName() || 'index.html';
  document.querySelectorAll('.nav a, .nav-link').forEach(a => {
    const href = a.getAttribute('href');
    if (!href) return;
    const page = href.split('/').pop() || '';
    if (page === current || (current === 'index.html' && page === 'index.html') ||
        (current === '' && page === 'index.html')) {
      a.classList.add('active');
    }
  });
}

// ======== 8. 平滑滚动导航 ========
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const targetId = a.getAttribute('href');
      if (targetId === '#') return;
      const target = document.querySelector(targetId);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
}

// ======== 9. 移动端汉堡菜单切换 ========
function initNav() {
  const toggle = document.querySelector('.nav-toggle, .hamburger');
  const nav = document.querySelector('.nav, .nav-menu');
  if (!toggle || !nav) return;

  toggle.addEventListener('click', () => {
    toggle.classList.toggle('active');
    nav.classList.toggle('open');
    // 切换 aria-expanded
    const expanded = nav.classList.contains('open');
    toggle.setAttribute('aria-expanded', expanded);
  });

  // 点击导航链接后关闭菜单（移动端）
  nav.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      toggle.classList.remove('active');
      nav.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    });
  });

  // 点击外部区域关闭菜单
  document.addEventListener('click', e => {
    if (!toggle.contains(e.target) && !nav.contains(e.target)) {
      toggle.classList.remove('active');
      nav.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    }
  });
}

// ======== 滚动 Header 效果 ========
function initScrollHeader() {
  const header = document.querySelector('.header, .site-header');
  if (!header) return;

  window.addEventListener('scroll', () => {
    header.classList.toggle('scrolled', window.scrollY > 50);
  });
}

// ======== 7. 滚动渐显动画 (Intersection Observer) ========
function initFadeIn() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  });

  document.querySelectorAll('.fade-in, .card, .tool-card, .category-card, .stat-item, .section-title')
    .forEach(el => {
      if (!el.classList.contains('visible')) {
        el.classList.add('fade-in');
        observer.observe(el);
      }
    });
}

// ======== 外部链接新标签页 ========
function enableExternalLinks() {
  document.querySelectorAll('a[href^="http"]').forEach(a => {
    if (!a.getAttribute('target')) {
      a.setAttribute('target', '_blank');
      a.setAttribute('rel', 'noopener noreferrer');
    }
  });
}

// ================================================
//   4. 渲染统计数字
// ================================================
function renderStats() {
  const container = document.querySelector('[data-render="stats"]');
  if (!container || !siteData.site?.stats) return;

  const stats = siteData.site.stats;
  const statMap = {
    'tools': { icon: '🤖', label: '收录工具' },
    'categories': { icon: '📂', label: '分类' },
    'visitors': { icon: '👥', label: '月访问' }
  };

  container.innerHTML = Object.entries(stats).map(([key, value]) => {
    const info = statMap[key] || { icon: '📊', label: key };
    return `
      <div class="stat-item fade-in">
        <div class="stat-icon">${info.icon}</div>
        <div class="stat-number" data-target="${value}">${value}</div>
        <div class="stat-label">${info.label}</div>
      </div>`;
  }).join('');

  // 数字递增动画
  animateStats();
}

function animateStats() {
  document.querySelectorAll('.stat-number').forEach(el => {
    const text = el.getAttribute('data-target') || el.textContent;
    // 如果包含非数字字符（如 "50万+"），直接显示
    if (!/^\d+(\.\d+)?$/.test(text)) {
      el.textContent = text;
      return;
    }
    const target = parseInt(text);
    animateCounter(el, target);
  });
}

function animateCounter(el, target, duration = 1500) {
  let start = 0;
  const step = target / (duration / 16);
  const update = () => {
    start += step;
    if (start >= target) {
      el.textContent = target;
      return;
    }
    el.textContent = Math.floor(start);
    requestAnimationFrame(update);
  };
  update();
}

// ================================================
//   2. 渲染分类卡片网格
// ================================================
function renderCategoryCards() {
  const container = document.querySelector('[data-render="categories"]');
  if (!container || !siteData.categories) return;

  container.innerHTML = siteData.categories.map(cat => `
    <a href="tools.html?category=${cat.id}" class="category-card fade-in">
      <div class="category-card-icon">${cat.icon}</div>
      <h3 class="category-card-name">${cat.name}</h3>
      <p class="category-desc">${cat.description}</p>
      <span class="category-card-count">${countToolsByCategory(cat.id)} 个工具</span>
    </a>
  `).join('');
}

function countToolsByCategory(categoryId) {
  if (!siteData.tools) return 0;
  return siteData.tools.filter(t => t.category === categoryId).length;
}

// ================================================
//   3. 渲染特色/推荐工具卡片
// ================================================
function renderFeaturedTools() {
  const container = document.querySelector('[data-render="featured"]');
  if (!container || !siteData.tools) return;

  const featured = siteData.tools.filter(t => t.featured).slice(0, 8);

  container.innerHTML = featured.map(tool => `
    <a href="tool-detail.html?id=${tool.id}" class="tool-card featured-card fade-in">
      <div class="tool-card-header">
        <img class="tool-card-logo" src="${tool.logo}" alt="${tool.name}" loading="lazy">
        <div class="tool-card-rating">${renderStars(tool.rating)}</div>
      </div>
      <h3 class="tool-card-name">${tool.name}</h3>
      <p class="tool-card-desc">${truncateText(tool.description, 80)}</p>
      <div class="tool-card-footer">
        <span class="tool-card-pricing">${tool.pricing}</span>
        <span class="tag">${getCategoryName(tool.category)}</span>
      </div>
    </a>
  `).join('');
}

// ================================================
//   5. 工具列表页渲染 (tools.html)
// ================================================
function renderToolsPage() {
  // 渲染分类筛选器
  renderCategoryFilters();

  // 从 URL 读取分类参数
  const urlParams = new URLSearchParams(window.location.search);
  const initialCategory = urlParams.get('category') || 'all';

  // 设置初始筛选
  const filterBtn = document.querySelector(`.filter-btn[data-category="${initialCategory}"]`);
  if (filterBtn) {
    filterBtn.classList.add('active');
  } else {
    const allBtn = document.querySelector('.filter-btn[data-category="all"]');
    if (allBtn) allBtn.classList.add('active');
  }

  // 渲染工具
  renderFilteredTools(initialCategory);

  // 绑定搜索
  initToolSearch();

  // 绑定分类筛选按钮
  initCategoryFilter();
}

function renderCategoryFilters() {
  const container = document.querySelector('[data-render="category-filters"]');
  if (!container || !siteData.categories) return;

  container.innerHTML = `
    <button class="filter-btn active" data-category="all">全部</button>
    ${siteData.categories.map(cat => `
      <button class="filter-btn" data-category="${cat.id}">
        ${cat.icon} ${cat.name}
      </button>
    `).join('')}
  `;
}

function renderFilteredTools(category, searchTerm = '') {
  const container = document.querySelector('[data-render="tool-list"]');
  if (!container || !siteData.tools) return;

  let filtered = [...siteData.tools];

  // 分类筛选
  if (category && category !== 'all') {
    filtered = filtered.filter(t => t.category === category);
  }

  // 搜索筛选
  if (searchTerm && searchTerm.trim()) {
    const term = searchTerm.trim().toLowerCase();
    filtered = filtered.filter(t =>
      t.name.toLowerCase().includes(term) ||
      t.description.toLowerCase().includes(term)
    );
  }

  // 按评分排序（从高到低）
  filtered.sort((a, b) => b.rating - a.rating);

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <span class="empty-icon">🔍</span>
        <h3>没有找到匹配的工具</h3>
        <p>试试其他关键词或分类</p>
      </div>`;
    return;
  }

  container.innerHTML = filtered.map(tool => `
    <a href="tool-detail.html?id=${tool.id}" class="tool-card fade-in">
      <div class="tool-card-header">
        <img class="tool-card-logo" src="${tool.logo}" alt="${tool.name}" loading="lazy">
        <div class="tool-card-rating">${renderStars(tool.rating)} <span class="rating-number">${tool.rating}</span></div>
      </div>
      <h3 class="tool-card-name">${tool.name}</h3>
      <p class="tool-card-desc">${truncateText(tool.description, 100)}</p>
      <div class="tool-features-preview">
        ${tool.features.slice(0, 3).map(f => `<span class="feature-tag">${f}</span>`).join('')}
        ${tool.features.length > 3 ? `<span class="feature-tag more">+${tool.features.length - 3}</span>` : ''}
      </div>
      <div class="tool-card-footer">
        <span class="tool-card-pricing">${tool.pricing}</span>
        <span class="tag">${getCategoryName(tool.category)}</span>
      </div>
    </a>
  `).join('');
}

function initToolSearch() {
  const searchInput = document.querySelector('[data-render="tool-search"]');
  if (!searchInput) return;

  let debounceTimer;
  searchInput.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      const activeFilter = document.querySelector('.filter-btn.active');
      const category = activeFilter ? activeFilter.dataset.category : 'all';
      renderFilteredTools(category, searchInput.value);
      // 重新触发渐显动画
      initFadeIn();
    }, 300);
  });
}

function initCategoryFilter() {
  const container = document.querySelector('[data-render="category-filters"]');
  if (!container) return;

  container.addEventListener('click', e => {
    const btn = e.target.closest('.filter-btn');
    if (!btn) return;

    // 更新活跃状态
    container.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    const category = btn.dataset.category;
    const searchInput = document.querySelector('[data-render="tool-search"]');
    const searchTerm = searchInput ? searchInput.value : '';

    renderFilteredTools(category, searchTerm);
    // 重新触发渐显动画
    initFadeIn();
  });
}

// ================================================
//   6. 工具详情页渲染 (tool-detail.html)
// ================================================
function renderToolDetail() {
  const container = document.querySelector('[data-render="tool-detail"]');
  if (!container) return;

  // 从 URL 参数读取工具 ID
  const urlParams = new URLSearchParams(window.location.search);
  const toolId = urlParams.get('id');

  if (!toolId) {
    container.innerHTML = `
      <div class="empty-state">
        <span class="empty-icon">🔍</span>
        <h3>未指定工具</h3>
        <p>请从列表中选择一个工具查看详情</p>
        <a href="tools.html" class="btn-primary">返回工具列表</a>
      </div>`;
    return;
  }

  const tool = siteData.tools.find(t => t.id === toolId);

  if (!tool) {
    container.innerHTML = `
      <div class="empty-state">
        <span class="empty-icon">😕</span>
        <h3>工具未找到</h3>
        <p>未找到 ID 为 "${toolId}" 的工具</p>
        <a href="tools.html" class="btn-primary">返回工具列表</a>
      </div>`;
    return;
  }

  container.innerHTML = `
    <div class="tool-detail-wrapper fade-in">
      <!-- 面包屑导航 -->
      <nav class="breadcrumb">
        <a href="index.html">首页</a>
        <span class="breadcrumb-sep">›</span>
        <a href="tools.html">工具列表</a>
        <span class="breadcrumb-sep">›</span>
        <span class="breadcrumb-current">${tool.name}</span>
      </nav>

      <!-- 工具头部 -->
      <div class="detail-header">
        <img class="detail-logo" src="${tool.logo}" alt="${tool.name}">
        <div class="detail-header-info">
          <h1 class="detail-title">${tool.name}</h1>
          <div class="detail-meta">
            <span class="detail-category">${getCategoryName(tool.category)}</span>
            <div class="detail-rating">
              ${renderStars(tool.rating)}
              <span class="rating-number">${tool.rating}</span>
              <span class="rating-max">/ 5.0</span>
            </div>
          </div>
          <a href="${tool.url}" class="btn-primary detail-visit-btn" target="_blank" rel="noopener noreferrer">
            访问官网 ↗
          </a>
        </div>
      </div>

      <!-- 工具描述 -->
      <div class="detail-section">
        <h2 class="detail-section-title">工具简介</h2>
        <p class="detail-description">${tool.description}</p>
      </div>

      <!-- 特点标签列表 -->
      <div class="detail-section">
        <h2 class="detail-section-title">核心特点</h2>
        <div class="detail-features">
          ${tool.features.map(f => `<span class="detail-feature-tag">✅ ${f}</span>`).join('')}
        </div>
      </div>

      <!-- 定价信息 -->
      <div class="detail-section">
        <h2 class="detail-section-title">定价</h2>
        <div class="detail-pricing">
          <span class="pricing-icon">💰</span>
          <span class="pricing-text">${tool.pricing}</span>
        </div>
      </div>

      <!-- 评分 -->
      <div class="detail-section">
        <h2 class="detail-section-title">评分</h2>
        <div class="detail-rating-display">
          ${renderStars(tool.rating, 48)}
          <span class="rating-big">${tool.rating}</span>
          <span class="rating-max-big">/ 5.0</span>
        </div>
      </div>

      <!-- 访问按钮 -->
      <div class="detail-actions">
        <a href="${tool.url}" class="btn-primary btn-large" target="_blank" rel="noopener noreferrer">
          🚀 访问 ${tool.name} 官网
        </a>
        <a href="tools.html?category=${tool.category}" class="btn-secondary">
          查看同类工具
        </a>
      </div>
    </div>
  `;
}

// ================================================
//   评分星级渲染
//   ★ 满星, 半星, ☆ 空星
// ================================================
function renderStars(rating, size = 20) {
  const full = Math.floor(rating);
  const half = rating - full >= 0.25 && rating - full < 0.75;
  const quarter = rating - full >= 0.75 ? 1 : 0;
  const empty = 5 - full - (half ? 1 : 0) - (quarter ? 1 : 0);

  let stars = '';
  // 满星
  for (let i = 0; i < full; i++) {
    stars += '★';
  }
  // 半星或四舍五入到满星
  if (half) {
    stars += '★'; // 我们用小数值微调 —— 实际上用半星字符
  } else if (quarter) {
    stars += '★'; // 接近满星
  }
  // 空星
  for (let i = 0; i < empty; i++) {
    stars += '☆';
  }

  // 用 CSS 控制星标颜色
  return `<span class="stars" style="font-size:${size}px; color:#f59e0b; letter-spacing:2px;">${stars}</span>`;
}

// ================================================
//   辅助函数
// ================================================

function getCategoryName(categoryId) {
  if (!siteData.categories) return categoryId;
  const cat = siteData.categories.find(c => c.id === categoryId);
  return cat ? cat.name : categoryId;
}

function truncateText(text, maxLen = 100) {
  if (!text || text.length <= maxLen) return text || '';
  return text.slice(0, maxLen) + '…';
}

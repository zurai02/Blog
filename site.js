/* ============================================
   zurai02 blog — site.js (UPGRADED)
   Particles, typewriter, posts, admin, markdown
   ============================================ */

// ─── CONFIG ─────────────────────────────────
const CONFIG = {
  particleCount: window.matchMedia('(pointer: coarse)').matches ? 30 : 60,
  typewriterPhrases: [
    'building compilers.',
    'optimizing frames.',
    'writing Luazi.',
    'breaking limits.',
    'shipping code.'
  ],
  greetingMessages: {
    morning: 'good morning,',
    afternoon: 'good afternoon,',
    evening: 'good evening,',
    night: 'still awake?'
  }
};

// ─── PARTICLE SYSTEM ─────────────────────────
class ParticleSystem {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.particles = [];
    this.resize();
    this.init();
    this.animate();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.w = this.canvas.width;
    this.h = this.canvas.height;
  }

  init() {
    this.particles = [];
    for (let i = 0; i < CONFIG.particleCount; i++) {
      this.particles.push({
        x: Math.random() * this.w,
        y: Math.random() * this.h,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        radius: Math.random() * 2 + 0.5,
        opacity: Math.random() * 0.4 + 0.1,
        phase: Math.random() * Math.PI * 2
      });
    }
  }

  animate() {
    this.ctx.clearRect(0, 0, this.w, this.h);
    const time = Date.now() * 0.001;

    this.particles.forEach((p, i) => {
      p.x += p.vx;
      p.y += p.vy;

      if (p.x < 0) p.x = this.w;
      if (p.x > this.w) p.x = 0;
      if (p.y < 0) p.y = this.h;
      if (p.y > this.h) p.y = 0;

      const pulse = Math.sin(time * 1.5 + p.phase) * 0.15 + 0.85;
      const alpha = p.opacity * pulse;

      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      this.ctx.fillStyle = `rgba(124, 92, 255, ${alpha})`;
      this.ctx.fill();
    });

    // Draw connections
    for (let i = 0; i < this.particles.length; i++) {
      for (let j = i + 1; j < this.particles.length; j++) {
        const dx = this.particles[i].x - this.particles[j].x;
        const dy = this.particles[i].y - this.particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 120) {
          const alpha = (1 - dist / 120) * 0.08;
          this.ctx.beginPath();
          this.ctx.moveTo(this.particles[i].x, this.particles[i].y);
          this.ctx.lineTo(this.particles[j].x, this.particles[j].y);
          this.ctx.strokeStyle = `rgba(124, 92, 255, ${alpha})`;
          this.ctx.lineWidth = 0.5;
          this.ctx.stroke();
        }
      }
    }

    requestAnimationFrame(() => this.animate());
  }
}

// ─── TYPEWRITER ──────────────────────────────
class Typewriter {
  constructor(element, phrases, speed = 80, deleteSpeed = 40, pause = 2000) {
    this.el = element;
    this.phrases = phrases;
    this.speed = speed;
    this.deleteSpeed = deleteSpeed;
    this.pause = pause;
    this.phraseIndex = 0;
    this.charIndex = 0;
    this.isDeleting = false;
    this.tick();
  }

  tick() {
    const current = this.phrases[this.phraseIndex];
    if (this.isDeleting) {
      this.el.textContent = current.substring(0, this.charIndex - 1);
      this.charIndex--;
    } else {
      this.el.textContent = current.substring(0, this.charIndex + 1);
      this.charIndex++;
    }

    let delay = this.isDeleting ? this.deleteSpeed : this.speed;

    if (!this.isDeleting && this.charIndex === current.length) {
      delay = this.pause;
      this.isDeleting = true;
    } else if (this.isDeleting && this.charIndex === 0) {
      this.isDeleting = false;
      this.phraseIndex = (this.phraseIndex + 1) % this.phrases.length;
      delay = 500;
    }

    setTimeout(() => this.tick(), delay);
  }
}

// ─── GREETING ────────────────────────────────
function setGreeting() {
  const hour = new Date().getHours();
  let key = 'night';
  if (hour >= 5 && hour < 12) key = 'morning';
  else if (hour >= 12 && hour < 17) key = 'afternoon';
  else if (hour >= 17 && hour < 22) key = 'evening';

  const el = document.getElementById('greeting');
  if (el) el.textContent = CONFIG.greetingMessages[key];
}

// ─── POSTS DATA ──────────────────────────────
let postsData = [];
let adminCreds = { email: '', password: '' };

async function loadPosts() {
  try {
    const res = await fetch('posts.json');
    postsData = await res.json();
    if (!Array.isArray(postsData)) postsData = [];
    postsData.sort((a, b) => new Date(b.date) - new Date(a.date));
    return postsData;
  } catch (e) {
    console.error('Failed to load posts:', e);
    postsData = [];
    return [];
  }
}

// ─── SEARCH & FILTER ─────────────────────────
let currentFilter = '';
let currentSort = 'date-desc';
let currentTag = '';

function setupSearch() {
  const input = document.getElementById('search-input');
  const sortSelect = document.getElementById('sort-select');
  if (!input) return;

  input.addEventListener('input', (e) => {
    currentFilter = e.target.value.toLowerCase().trim();
    renderPosts();
  });

  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      currentSort = e.target.value;
      renderPosts();
    });
  }
}

function filterPosts(posts) {
  let filtered = posts;

  if (currentFilter) {
    filtered = filtered.filter(p =>
      p.title.toLowerCase().includes(currentFilter) ||
      p.content.toLowerCase().includes(currentFilter) ||
      p.tags.some(t => t.toLowerCase().includes(currentFilter))
    );
  }

  if (currentTag) {
    filtered = filtered.filter(p => p.tags.includes(currentTag));
  }

  return filtered;
}

function sortPosts(posts) {
  const sorted = [...posts];
  switch (currentSort) {
    case 'date-asc':
      sorted.sort((a, b) => new Date(a.date) - new Date(b.date));
      break;
    case 'title-asc':
      sorted.sort((a, b) => a.title.localeCompare(b.title));
      break;
    default:
      sorted.sort((a, b) => new Date(b.date) - new Date(a.date));
  }
  return sorted;
}

// ─── READ TIME ─────────────────────────────────
function getReadTime(content) {
  const words = content.trim().split(/\s+/).length;
  const minutes = Math.ceil(words / 200);
  return `${minutes} min read`;
}

// ─── POST CARD ─────────────────────────────────
function renderPostCard(post) {
  const excerpt = post.content
    .replace(/```[\s\S]*?```/g, '[code]')
    .replace(/[#*_`]/g, '')
    .substring(0, 140) + '...';

  const tagsHtml = post.tags.map(t => `<span class="tag">${t}</span>`).join('');

  return `
    <a href="post.html?id=${post.id}" class="post-card reveal">
      <div class="post-card-header">
        <span class="post-card-title">${escapeHtml(post.title)}</span>
        <span class="post-card-date">${post.date}</span>
      </div>
      <p class="post-card-excerpt">${escapeHtml(excerpt)}</p>
      <div class="post-card-tags">${tagsHtml}</div>
    </a>
  `;
}

// ─── TAG CLOUD ───────────────────────────────
function renderTagCloud(posts) {
  const cloud = document.getElementById('tag-cloud');
  if (!cloud) return;

  const tagCounts = {};
  posts.forEach(p => {
    p.tags.forEach(t => {
      tagCounts[t] = (tagCounts[t] || 0) + 1;
    });
  });

  const tags = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]);

  cloud.innerHTML = tags.map(([tag, count]) => {
    const active = tag === currentTag ? 'active' : '';
    return `<span class="tag ${active}" data-tag="${tag}" onclick="filterByTag('${tag}')">${tag} (${count})</span>`;
  }).join('');
}

function filterByTag(tag) {
  currentTag = currentTag === tag ? '' : tag;
  renderPosts();
}

// ─── RENDER POSTS ────────────────────────────
async function renderPosts() {
  let posts = await loadPosts();
  posts = filterPosts(posts);
  posts = sortPosts(posts);

  const grid = document.getElementById('posts-grid');
  const count = document.getElementById('post-count');
  const noResults = document.getElementById('no-results');
  if (!grid) return;

  if (count) count.textContent = `${posts.length} total`;

  if (posts.length === 0) {
    grid.innerHTML = '';
    if (noResults) noResults.style.display = 'block';
    return;
  }

  if (noResults) noResults.style.display = 'none';

  grid.innerHTML = posts.map(renderPostCard).join('');

  // Scroll reveal
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

  // Update tag cloud
  const allPosts = await loadPosts();
  renderTagCloud(allPosts);
}

// ─── SINGLE POST ─────────────────────────────
async function loadPost(postId) {
  if (!postId) { location.href = '/Blog'; return; }

  const posts = await loadPosts();
  const post = posts.find(p => p.id === postId);
  if (!post) {
    console.error('Post not found:', postId);
    location.href = '/Blog';
    return;
  }

  document.getElementById('page-title').textContent = `zurai02 — ${post.title}`;
  document.getElementById('post-title').textContent = post.title;
  document.getElementById('post-date').textContent = post.date;

  const readTime = getReadTime(post.content);
  const readEl = document.getElementById('post-readtime');
  if (readEl) readEl.textContent = readTime;

  document.getElementById('post-tags').innerHTML = post.tags
    .map(t => `<span class="tag">${t}</span>`).join('');
  document.getElementById('post-content').innerHTML = markdownToHtml(post.content);

  // Add copy buttons to code blocks
  document.querySelectorAll('.post-content pre').forEach(pre => {
    const wrapper = document.createElement('div');
    wrapper.className = 'code-block-wrapper';
    pre.parentNode.insertBefore(wrapper, pre);
    wrapper.appendChild(pre);

    const btn = document.createElement('button');
    btn.className = 'code-copy-btn';
    btn.textContent = 'Copy';
    btn.onclick = () => {
      navigator.clipboard.writeText(pre.textContent);
      btn.textContent = 'Copied!';
      btn.classList.add('copied');
      setTimeout(() => {
        btn.textContent = 'Copy';
        btn.classList.remove('copied');
      }, 2000);
    };
    wrapper.appendChild(btn);
  });

  // Prev / Next navigation
  const idx = posts.findIndex(p => p.id === postId);
  const prevEl = document.getElementById('prev-post');
  const nextEl = document.getElementById('next-post');

  if (prevEl && idx < posts.length - 1) {
    const prev = posts[idx + 1];
    prevEl.innerHTML = `<span>← Previous</span><strong>${escapeHtml(prev.title)}</strong>`;
    prevEl.href = `post.html?id=${prev.id}`;
  } else if (prevEl) {
    prevEl.style.display = 'none';
  }

  if (nextEl && idx > 0) {
    const next = posts[idx - 1];
    nextEl.innerHTML = `<span>Next →</span><strong>${escapeHtml(next.title)}</strong>`;
    nextEl.href = `post.html?id=${next.id}`;
  } else if (nextEl) {
    nextEl.style.display = 'none';
  }

  // Share links
  const shareUrl = encodeURIComponent(location.href);
  const shareText = encodeURIComponent(`${post.title} — zurai02`);

  const shareX = document.getElementById('share-x');
  if (shareX) shareX.href = `https://twitter.com/intent/tweet?url=${shareUrl}&text=${shareText}`;

  const shareReddit = document.getElementById('share-reddit');
  if (shareReddit) shareReddit.href = `https://reddit.com/submit?url=${shareUrl}&title=${shareText}`;

  const shareCopy = document.getElementById('share-copy');
  if (shareCopy) {
    shareCopy.addEventListener('click', (e) => {
      e.preventDefault();
      navigator.clipboard.writeText(location.href);
      shareCopy.textContent = 'Copied!';
      setTimeout(() => shareCopy.textContent = 'Copy Link', 2000);
    });
  }
}

// ─── MARKDOWN PARSER ─────────────────────────
function markdownToHtml(md) {
  // Escape HTML first
  let html = md
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Code blocks (must be before inline code)
  html = html.replace(/```(lz|luau)?\n?([\s\S]*?)```/g, '<pre><code>$2</code></pre>');

  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

  // Headers
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');

  // Bold and italic
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

  // Blockquote
  html = html.replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>');

  // Links [text](url)
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');

  // Horizontal rule
  html = html.replace(/^---$/gm, '<hr>');

  // Process paragraphs and lists line by line
  const lines = html.split('\n');
  let result = [];
  let inList = false;
  let listType = null;
  let listBuffer = [];

  function flushList() {
    if (listBuffer.length > 0) {
      result.push(`<${listType}>${listBuffer.join('')}</${listType}>`);
      listBuffer = [];
      inList = false;
      listType = null;
    }
  }

  for (let line of lines) {
    line = line.trim();
    if (!line) {
      flushList();
      continue;
    }

    // Skip if it's a block-level element already
    if (line.startsWith('<h') || line.startsWith('<pre') || line.startsWith('<blockquote') || line === '<hr>') {
      flushList();
      result.push(line);
      continue;
    }

    // Unordered list
    const ulMatch = line.match(/^- (.+)$/);
    // Ordered list
    const olMatch = line.match(/^\d+\. (.+)$/);

    if (ulMatch) {
      if (!inList || listType !== 'ul') {
        flushList();
        inList = true;
        listType = 'ul';
      }
      listBuffer.push(`<li>${ulMatch[1]}</li>`);
    } else if (olMatch) {
      if (!inList || listType !== 'ol') {
        flushList();
        inList = true;
        listType = 'ol';
      }
      listBuffer.push(`<li>${olMatch[1]}</li>`);
    } else {
      flushList();
      // Regular paragraph
      result.push(`<p>${line}</p>`);
    }
  }

  flushList();
  return result.join('\n');
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ─── ADMIN AUTH ──────────────────────────────
async function loadAdminConfig() {
  try {
    const res = await fetch('admin-config.json');
    if (res.ok) {
      const config = await res.json();
      adminCreds = config;
    }
  } catch (e) {
    console.log('No admin-config.json found, using defaults');
    adminCreds = {
      email: 'admin@zurai02.dev',
      password: 'changeme123'
    };
  }
}

async function attemptLogin() {
  if (!adminCreds.email) await loadAdminConfig();

  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  const errorEl = document.getElementById('login-error');

  if (email === adminCreds.email && password === adminCreds.password) {
    localStorage.setItem('zurai_admin', 'true');
    document.getElementById('admin-login').style.display = 'none';
    document.getElementById('admin-dashboard').style.display = 'block';
    await renderAdminPosts();
  } else {
    errorEl.textContent = 'invalid credentials';
    setTimeout(() => errorEl.textContent = '', 3000);
  }
}

async function renderAdminPosts() {
  const posts = await loadPosts();
  const list = document.getElementById('admin-posts-list');
  if (!list) return;

  if (posts.length === 0) {
    list.innerHTML = '<p class="no-posts">No posts yet. Create your first one!</p>';
    return;
  }

  list.innerHTML = posts.map(post => `
    <div class="admin-post-item">
      <div class="admin-post-info">
        <span class="admin-post-title">${escapeHtml(post.title)}</span>
        <span class="admin-post-date">${post.date} · ${post.id}</span>
      </div>
      <div class="admin-post-actions">
        <button class="btn-ghost btn-small" onclick="editPost('${post.id}')">edit</button>
        <button class="btn-ghost btn-small" onclick="deletePost('${post.id}')">delete</button>
      </div>
    </div>
  `).join('');
}

let editingId = null;

function showEditor(id = null) {
  editingId = id;
  const overlay = document.getElementById('editor-overlay');
  const label = document.getElementById('editor-title-label');
  const idField = document.getElementById('edit-id');
  overlay.style.display = 'flex';

  if (id) {
    label.textContent = 'edit post';
    idField.style.display = 'none';
    const post = postsData.find(p => p.id === id);
    if (post) {
      idField.value = post.id;
      document.getElementById('edit-title').value = post.title;
      document.getElementById('edit-date').value = post.date;
      document.getElementById('edit-tags').value = post.tags.join(', ');
      document.getElementById('edit-content').value = post.content;
    }
  } else {
    label.textContent = 'new post';
    idField.style.display = 'block';
    idField.value = '';
    document.getElementById('edit-title').value = '';
    document.getElementById('edit-date').value = new Date().toISOString().split('T')[0];
    document.getElementById('edit-tags').value = '';
    document.getElementById('edit-content').value = '';
  }
}

function closeEditor() {
  document.getElementById('editor-overlay').style.display = 'none';
  editingId = null;
}

function savePost() {
  const id = editingId || document.getElementById('edit-id').value.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  const title = document.getElementById('edit-title').value.trim();
  const date = document.getElementById('edit-date').value;
  const tags = document.getElementById('edit-tags').value.split(',').map(t => t.trim()).filter(Boolean);
  const content = document.getElementById('edit-content').value;

  if (!id) {
    alert('Post ID is required (used in the URL)');
    return;
  }
  if (!title) {
    alert('Title is required');
    return;
  }
  if (!content) {
    alert('Content is required');
    return;
  }

  if (!editingId && postsData.some(p => p.id === id)) {
    alert(`A post with ID "${id}" already exists. Use a different ID.`);
    return;
  }

  const existingIndex = postsData.findIndex(p => p.id === id);
  const newPost = { id, title, date: date || new Date().toISOString().split('T')[0], tags, content };

  if (existingIndex >= 0) {
    postsData[existingIndex] = newPost;
  } else {
    postsData.push(newPost);
  }

  postsData.sort((a, b) => new Date(b.date) - new Date(a.date));

  const blob = new Blob([JSON.stringify(postsData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'posts.json';
  a.click();
  URL.revokeObjectURL(url);

  closeEditor();
  renderAdminPosts();
  alert('posts.json downloaded. Replace the old one and redeploy to update your blog.');
}

function editPost(id) {
  showEditor(id);
}

function deletePost(id) {
  if (!confirm('Delete this post? This cannot be undone.')) return;
  postsData = postsData.filter(p => p.id !== id);

  const blob = new Blob([JSON.stringify(postsData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'posts.json';
  a.click();
  URL.revokeObjectURL(url);

  renderAdminPosts();
}

// ─── MOBILE NAV TOGGLE ─────────────────────────
function setupMobileNav() {
  const toggle = document.getElementById('nav-toggle');
  const links = document.getElementById('nav-links');
  if (!toggle || !links) return;

  toggle.addEventListener('click', () => {
    links.classList.toggle('open');
  });
}

// ─── INIT ────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // Particles
  const canvas = document.getElementById('particle-canvas');
  if (canvas) new ParticleSystem(canvas);

  // Greeting
  setGreeting();

  // Typewriter
  const tw = document.getElementById('typewriter');
  if (tw) new Typewriter(tw, CONFIG.typewriterPhrases);

  // Search & filters
  setupSearch();

  // Mobile nav
  setupMobileNav();

  // Render posts on index
  if (document.getElementById('posts-grid')) {
    renderPosts();
  }

  // Admin: load config and check login state
  if (document.getElementById('admin-login')) {
    loadAdminConfig().then(() => {
      if (localStorage.getItem('zurai_admin') === 'true') {
        document.getElementById('admin-login').style.display = 'none';
        document.getElementById('admin-dashboard').style.display = 'block';
        renderAdminPosts();
      }
    });

    const loginPw = document.getElementById('login-password');
    if (loginPw) {
      loginPw.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') attemptLogin();
      });
    }
  }
});

/* ============================================
   zurai02 blog — site.js (UPGRADED + GITHUB AUTH)
   Particles, typewriter, posts, admin, markdown, GitHub OAuth
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
  },
  github: {
    owner: 'zurai02',
    repo: 'Blog',
    path: 'posts.json'
  }
};

// ─── GITHUB AUTH HELPERS (shared) ────────────
function getGitHubUser() {
  try { return JSON.parse(localStorage.getItem('github_user') || 'null'); }
  catch { return null; }
}

function setGitHubUser(user) {
  if (user) localStorage.setItem('github_user', JSON.stringify(user));
  else localStorage.removeItem('github_user');
}

function getGitHubToken() {
  return localStorage.getItem('github_access_token') || '';
}

function setGitHubToken(token) {
  if (token) localStorage.setItem('github_access_token', token);
  else localStorage.removeItem('github_access_token');
}

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

// includeDrafts: when false (default), draft posts are stripped out —
// use this for anything the public sees. Pass true only for admin views
// or an admin previewing their own draft.
async function loadPosts(includeDrafts = false) {
  try {
    const res = await fetch('posts.json');
    let posts = await res.json();
    if (!Array.isArray(posts)) posts = [];
    if (!includeDrafts) posts = posts.filter(p => !p.draft);
    posts.sort((a, b) => new Date(b.date) - new Date(a.date));
    postsData = posts;
    return posts;
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
      p.tags.some(t => t.toLowerCase().includes(currentFilter)) ||
      (p.author && p.author.toLowerCase().includes(currentFilter))
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

  const authorHtml = post.author
    ? `<div class="post-card-author">
         <img src="${post.author_avatar || 'https://github.com/ghost.png'}" alt="" onerror="this.src='https://github.com/ghost.png'">
         <span>@${post.author}</span>
       </div>`
    : '';

  return `
    <a href="post.html?id=${post.id}" class="post-card reveal">
      ${authorHtml}
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

// ─── RENDER POSTS (public) ───────────────────
async function renderPosts() {
  let posts = await loadPosts(); // drafts excluded
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

  // Update tag cloud (public posts only)
  const allPosts = await loadPosts();
  renderTagCloud(allPosts);
}

// ─── SINGLE POST ─────────────────────────────
async function loadPost(postId) {
  if (!postId) { location.href = '/Blog'; return; }

  // An admin who's logged in on this browser can preview their own drafts
  // by visiting the post URL directly; everyone else only sees published posts.
  const isAdmin = localStorage.getItem('zurai_admin') === 'true';
  const posts = await loadPosts(isAdmin);
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

  // Author info
  const authorEl = document.getElementById('post-author');
  if (authorEl) {
    if (post.author) {
      authorEl.innerHTML = `
        <img src="${post.author_avatar || 'https://github.com/ghost.png'}" alt="" style="width:18px;height:18px;border-radius:50%;border:1px solid var(--border);margin-right:4px;" onerror="this.src='https://github.com/ghost.png'">
        <span>@${post.author}</span>
      `;
      authorEl.style.display = 'inline-flex';
    } else {
      authorEl.style.display = 'none';
    }
  }

  document.getElementById('post-tags').innerHTML = post.tags
    .map(t => `<span class="tag">${t}</span>`).join('');
  document.getElementById('post-content').innerHTML = markdownToHtml(post.content);

  const draftBanner = document.getElementById('draft-banner');
  if (draftBanner) draftBanner.style.display = post.draft ? 'block' : 'none';

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

// ─── GITHUB SYNC ──────────────────────────────
// Commits posts.json straight to github.com/<owner>/<repo> using the
// GitHub Contents API. Requires a personal access token with "repo" scope,
// entered by the admin. The token lives only in sessionStorage (this tab,
// this session) — it is never written into any file this app ships.

function getAdminGithubToken() {
  return sessionStorage.getItem('zurai_gh_token') || '';
}

function setAdminGithubToken(token) {
  if (token) sessionStorage.setItem('zurai_gh_token', token);
  else sessionStorage.removeItem('zurai_gh_token');
}

function connectGithub() {
  const input = document.getElementById('github-token-input');
  if (!input) return;
  const token = input.value.trim();
  if (!token) return;
  setAdminGithubToken(token);
  input.value = '';
  updateGithubStatusDisplay('token saved for this session ✓');
}

function disconnectGithub() {
  setAdminGithubToken('');
  updateGithubStatusDisplay('disconnected');
}

function updateGithubStatusDisplay(message) {
  const statusEl = document.getElementById('github-status');
  if (!statusEl) return;
  if (message) {
    statusEl.textContent = message;
    return;
  }
  statusEl.textContent = getAdminGithubToken()
    ? 'connected for this session'
    : 'not connected — saving will download posts.json instead';
}

// UTF-8 safe base64 encode (posts can contain non-ASCII characters)
function utf8ToBase64(str) {
  return btoa(unescape(encodeURIComponent(str)));
}

async function githubApiRequest(method, body) {
  const token = getAdminGithubToken();
  const url = `https://api.github.com/repos/${CONFIG.github.owner}/${CONFIG.github.repo}/contents/${CONFIG.github.path}`;
  const opts = {
    method,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github+json'
    }
  };
  if (body) {
    opts.headers['Content-Type'] = 'application/json';
    opts.body = JSON.stringify(body);
  }
  return fetch(url, opts);
}

async function getRemoteFileSha() {
  const res = await githubApiRequest('GET');
  if (res.status === 200) {
    const data = await res.json();
    return data.sha;
  }
  if (res.status === 404) return null;
  const err = await res.json().catch(() => ({}));
  throw new Error(err.message || `GitHub error ${res.status}`);
}

function downloadPostsJson() {
  const blob = new Blob([JSON.stringify(postsData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'posts.json';
  a.click();
  URL.revokeObjectURL(url);
}

// Commits the current in-memory postsData straight to posts.json on GitHub.
// Falls back to a local download if no token is set, or if the commit fails.
async function commitPostsToGithub(commitMessage) {
  const statusEl = document.getElementById('github-status');
  const token = getAdminGithubToken();

  if (!token) {
    if (statusEl) statusEl.textContent = 'no GitHub token set — downloading posts.json instead.';
    downloadPostsJson();
    return false;
  }

  if (statusEl) statusEl.textContent = 'syncing to GitHub…';

  try {
    const sha = await getRemoteFileSha();
    const content = utf8ToBase64(JSON.stringify(postsData, null, 2));
    const body = { message: commitMessage, content };
    if (sha) body.sha = sha;

    const res = await githubApiRequest('PUT', body);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `GitHub error ${res.status}`);
    }
    const data = await res.json();
    if (statusEl) {
      const shortSha = data.commit && data.commit.sha ? data.commit.sha.substring(0, 7) : '';
      statusEl.textContent = `synced ✓ ${shortSha ? '(commit ' + shortSha + ')' : ''}`;
      setTimeout(() => {
        if (statusEl.textContent.startsWith('synced')) updateGithubStatusDisplay();
      }, 4000);
    }
    return true;
  } catch (e) {
    console.error('GitHub sync failed:', e);
    if (statusEl) statusEl.textContent = `sync failed: ${e.message} — downloading posts.json instead.`;
    downloadPostsJson();
    return false;
  }
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
    updateGithubStatusDisplay();
  } else {
    errorEl.textContent = 'invalid credentials';
    setTimeout(() => errorEl.textContent = '', 3000);
  }
}

// ─── ADMIN POST LIST (includes drafts) ───────
let adminFilter = 'all'; // 'all' | 'published' | 'draft'

function setAdminFilter(filter) {
  adminFilter = filter;
  document.querySelectorAll('#admin-filter-tabs .tab').forEach(tab => {
    tab.classList.toggle('active', tab.dataset.filter === filter);
  });
  renderAdminPosts();
}

async function renderAdminPosts() {
  let posts = await loadPosts(true); // include drafts

  if (adminFilter === 'published') posts = posts.filter(p => !p.draft);
  if (adminFilter === 'draft') posts = posts.filter(p => p.draft);

  const list = document.getElementById('admin-posts-list');
  if (!list) return;

  if (posts.length === 0) {
    list.innerHTML = '<p class="no-posts">No posts here yet.</p>';
    return;
  }

  list.innerHTML = posts.map(post => `
    <div class="admin-post-item">
      <div class="admin-post-info">
        <span class="admin-post-title">
          ${escapeHtml(post.title)}
          ${post.draft ? '<span class="draft-badge">draft</span>' : ''}
          ${post.author ? `<span style="font-size:0.7rem;color:var(--text-dim);margin-left:0.5rem;">by @${post.author}</span>` : ''}
        </span>
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
      document.getElementById('edit-draft').checked = !!post.draft;
    }
  } else {
    label.textContent = 'new post';
    idField.style.display = 'block';
    idField.value = '';
    document.getElementById('edit-title').value = '';
    document.getElementById('edit-date').value = new Date().toISOString().split('T')[0];
    document.getElementById('edit-tags').value = '';
    document.getElementById('edit-content').value = '';
    // New posts default to draft so nothing publishes by accident.
    document.getElementById('edit-draft').checked = true;
  }
}

function closeEditor() {
  document.getElementById('editor-overlay').style.display = 'none';
  editingId = null;
}

async function savePost() {
  const id = editingId || document.getElementById('edit-id').value.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  const title = document.getElementById('edit-title').value.trim();
  const date = document.getElementById('edit-date').value;
  const tags = document.getElementById('edit-tags').value.split(',').map(t => t.trim()).filter(Boolean);
  const content = document.getElementById('edit-content').value;
  const draft = document.getElementById('edit-draft').checked;

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

  // Reload the full set (including drafts) so we don't clobber posts
  // that were filtered out of the currently-rendered admin view.
  await loadPosts(true);

  if (!editingId && postsData.some(p => p.id === id)) {
    alert(`A post with ID "${id}" already exists. Use a different ID.`);
    return;
  }

  const existingIndex = postsData.findIndex(p => p.id === id);
  const newPost = { id, title, date: date || new Date().toISOString().split('T')[0], tags, content, draft };

  if (existingIndex >= 0) {
    postsData[existingIndex] = newPost;
  } else {
    postsData.push(newPost);
  }

  postsData.sort((a, b) => new Date(b.date) - new Date(a.date));

  const commitMessage = existingIndex >= 0
    ? `Update post: ${title}`
    : `Add ${draft ? 'draft' : ''} post: ${title}`.replace('  ', ' ');

  await commitPostsToGithub(commitMessage);

  closeEditor();
  renderAdminPosts();
}

function editPost(id) {
  showEditor(id);
}

async function deletePost(id) {
  if (!confirm('Delete this post? This cannot be undone.')) return;

  await loadPosts(true);
  const post = postsData.find(p => p.id === id);
  postsData = postsData.filter(p => p.id !== id);

  await commitPostsToGithub(`Delete post: ${post ? post.title : id}`);

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
        updateGithubStatusDisplay();
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

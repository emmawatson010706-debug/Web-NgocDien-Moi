// ==========================================
// NGỌC ĐIỀN - MAIN.JS (Phiên bản Thái Lão Tối Ưu V3)
// Kết hợp ưu điểm phân trang, cache và giữ nguyên sức mạnh Admin
// ==========================================
const SUPABASE_URL = "https://twsmdblbrgvsctzsavni.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR3c21kYmxicmd2c2N0enNhdm5pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY5Njc1NDEsImV4cCI6MjA5MjU0MzU0MX0.pjrtm6g5e3z4XwffhANES55G0JNtcBXiLkA0_ZyeHC0";

let globalPosts = [];
let globalPostMap = new Map(); 
let isLoading = false;
let currentPage = 1;
const PAGE_SIZE = 9;

// ==========================================
// 1. TỐI ƯU HÓA: BỘ NHỚ ĐỆM (CACHE)
// ==========================================
const CACHE_KEY = 'ngocdien_posts_cache';
const CACHE_TTL = 5 * 60 * 1000; // 5 phút

function getCachedPosts() {
    try {
        const raw = localStorage.getItem(CACHE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (Date.now() - parsed.ts > CACHE_TTL) {
            localStorage.removeItem(CACHE_KEY);
            return null;
        }
        return parsed.data;
    } catch (e) { return null; }
}

function setCachedPosts(data) {
    try {
        localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), data }));
    } catch (e) { /* Bỏ qua lỗi bộ nhớ */ }
}

// ==========================================
// 2. GIAO DIỆN TẢI & BÁO LỖI (UI)
// ==========================================
function setLoading(id, msg) {
    const el = document.getElementById(id);
    if (el) el.innerHTML = `<div style="padding:24px; text-align:center; color:var(--ink-4); font-size:13px;"><div class="spinner" style="width:24px;height:24px;border:3px solid var(--border);border-top-color:var(--red);border-radius:50%;animation:spin 1s linear infinite;margin:0 auto 10px;"></div>${msg || 'Đang tải dữ liệu...'}</div>`;
}
function setError(id, msg) {
    const el = document.getElementById(id);
    if (el) el.innerHTML = `<div style="padding:24px; text-align:center; color:var(--red); font-size:13px; background:var(--red-pale); border-radius:var(--r-md); margin:8px 0;">⚠️ ${msg || 'Không thể kết nối với Đám mây. Vui lòng thử lại sau.'}</div>`;
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[m] || m));
}

// ==========================================
// 3. HÚT DỮ LIỆU (FETCH)
// ==========================================
async function fetchPostsFromSupabase(limit = 100, offset = 0) {
    const cached = getCachedPosts();
    if (cached && globalPosts.length === 0) {
        globalPosts = cached;
        rebuildMap();
        triggerRenders();
    }

    isLoading = true;
    try {
        const url = `${SUPABASE_URL}/rest/v1/posts?select=*&order=id.desc&limit=${limit}&offset=${offset}`;
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            }
        });
        
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const data = await response.json();
        globalPosts = data;
        rebuildMap();
        setCachedPosts(data);
        triggerRenders();
        return data;
    } catch (error) {
        console.error("Lỗi kết nối Supabase:", error);
        if (!globalPosts.length && cached) {
            globalPosts = cached;
            rebuildMap();
            triggerRenders();
        }
        setError('postsContainer', 'Mạng gián đoạn. Đang hiển thị dữ liệu lưu tạm.');
        return [];
    } finally {
        isLoading = false;
    }
}

function rebuildMap() {
    globalPostMap.clear();
    globalPosts.forEach(p => globalPostMap.set(String(p.id), p));
}

function triggerRenders() {
    if (typeof renderHero === 'function') renderHero();
    if (typeof initDynamicTicker === 'function') initDynamicTicker();
    if (typeof initAutoFeaturedNews === 'function') initAutoFeaturedNews();
    if (typeof initDynamicPodcast === 'function') initDynamicPodcast();
    if (typeof initTrendingPosts === 'function') initTrendingPosts();
    if (document.getElementById('postsContainer') && typeof displayPosts === 'function') displayPosts();
    if (document.getElementById('postDetail') && typeof displayPostDetail === 'function') displayPostDetail();
}

function getAllPosts() { return globalPosts; }
function getPostsByCategory(category) {
    return globalPosts.filter(p => p.category === category);
}

async function fetchPostById(id) {
    const cached = globalPostMap.get(String(id));
    if (cached) return cached;
    try {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/posts?id=eq.${id}&select=*`, {
            headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
        });
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const data = await res.json();
        if (data && data.length) {
            globalPostMap.set(String(data[0].id), data[0]);
            return data[0];
        }
    } catch (e) { console.error('fetchPostById error', e); }
    return null;
}

// ==========================================
// 4. MÔ-TƠ CHIA SẺ MẠNG XÃ HỘI
// ==========================================
window.shareToFB = function(postId) {
    const domain = "https://ngocdien.info.vn";
    const shareUrl = `${domain}/bai-viet.html?id=${postId}`;
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, 'fb-share', 'width=600,height=400');
};

window.shareToZalo = function(postId) {
    const domain = "https://ngocdien.info.vn";
    const shareUrl = `${domain}/bai-viet.html?id=${postId}`;
    window.open(`https://zalo.me/share?url=${encodeURIComponent(shareUrl)}`, 'zalo-share', 'width=600,height=500');
};

// ==========================================
// 5. CÁC HÀM VẼ GIAO DIỆN (RENDER)
// ==========================================
window.renderHero = function() {
    let posts = getPostsByCategory('gioi-thieu');
    if (!posts.length) return;
    let post = posts[0];
    let heroTitle = document.querySelector('#heroDynamic .hero-title');
    let heroLead = document.querySelector('#heroDynamic .hero-lead');
    if (heroTitle) heroTitle.innerHTML = escapeHtml(post.title);
    if (heroLead) {
        let plainText = post.content ? post.content.replace(/<\/[^>]+>/g, "").replace(/<[^>]+>/g,"") : "";
        heroLead.textContent = plainText.substring(0, 180) + '...';
    }
};

window.initDynamicTicker = function() {
    const tickerContainer = document.getElementById('dynamicTickerItems');
    if (!tickerContainer || !globalPosts.length) return;
    const tinTucPosts = getPostsByCategory('tin-tuc').slice(0, 6);
    if (!tinTucPosts.length) return;
    let spansHtml = tinTucPosts.map(post =>
        `<span style="cursor:pointer;" onclick="window.location.href='bai-viet.html?id=${post.id}'">${escapeHtml(post.title)}</span>`
    ).join('');
    tickerContainer.innerHTML = spansHtml + spansHtml;
};

window.initAutoFeaturedNews = function() {
    const container = document.getElementById('autoFeaturedNewsContainer');
    if (!container || !globalPosts.length) return;
    const featured = getPostsByCategory('tin-tuc').slice(0, 3);
    if (!featured.length) { container.innerHTML = ''; return; }
    
    let html = '';
    featured.forEach((post, idx) => {
        let plainText = post.content ? post.content.replace(/<\/[^>]+>/g, "").replace(/<[^>]+>/g,"") : '';
        let excerpt = escapeHtml(plainText.substring(0, 140)) + '...';
        if (idx === 0) {
            html += `
            <div class="card card-featured" style="cursor:pointer; position:relative;" onclick="window.location.href='bai-viet.html?id=${post.id}'">
                <div class="share-box">
                    <button class="btn-share fb" onclick="event.stopPropagation(); shareToFB('${post.id}')" title="Chia sẻ Facebook">
                        <svg viewBox="0 0 320 512"><path d="M275.9 330.7L293 218h-107.9v-73.2c0-31.2 14.8-61.7 64.6-61.7H296V10.1C280.9 6.8 245.6 0 203.2 0 109.1 0 46.9 56.6 46.9 161.7V218H-10v112.7h56.9v272.3h112.7V330.7h96.3z"/></svg>
                    </button>
                    <button class="btn-share zl" onclick="event.stopPropagation(); shareToZalo('${post.id}')" title="Chia sẻ Zalo"><span>Zalo</span></button>
                </div>
                <div class="card-thumb" style="background-image:url('${post.image && post.image.startsWith('http') ? escapeHtml(post.image) : (post.image && post.image.startsWith('data:image') ? escapeHtml(post.image) : '')}'); background-color:var(--cream-2); display:flex; align-items:center; justify-content:center; font-size:56px;">${(!post.image || post.image.startsWith('data:image')) ? '📰' : ''}</div>
                <div class="card-body">
                    <div class="card-meta"><span class="tag">${escapeHtml(post.category)}</span><span class="card-date">${escapeHtml(post.date)}</span></div>
                    <h3 class="card-title" style="font-family:var(--ff-head); font-size:20px; font-weight:700; line-height:1.35; margin-bottom:10px;">${escapeHtml(post.title)}</h3>
                    <p class="card-excerpt">${excerpt}</p>
                    <div class="card-footer"><a class="read-link">Đọc tiếp →</a></div>
                </div>
            </div>`;
        } else {
            html += `
            <div class="featured-side">
                <div class="card-list" style="cursor:pointer;" onclick="window.location.href='bai-viet.html?id=${post.id}'">
                    <div class="card-list-icon" style="background-image:url('${post.image && post.image.startsWith('http') ? escapeHtml(post.image) : ''}'); background-size:cover;">${(!post.image || post.image.startsWith('data:image')) ? '<span style="font-size:20px;">📰</span>' : ''}</div>
                    <div>
                        <div class="card-list-title"><a>${escapeHtml(post.title)}</a></div>
                        <div class="card-list-meta">📁 ${escapeHtml(post.category)} &nbsp;|&nbsp; 📅 ${escapeHtml(post.date)}</div>
                    </div>
                </div>
            </div>`;
        }
    });
    container.innerHTML = html;
};

window.initTrendingPosts = function() {
    const container = document.getElementById('dynamicTrendingPosts');
    if (!container || !globalPosts.length) return;
    let sorted = [...globalPosts].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 5);
    if (!sorted.length) { container.innerHTML = '<div style="font-size:12px;color:var(--ink-4);text-align:center;">Chưa có dữ liệu</div>'; return; }
    container.innerHTML = sorted.map((p, i) => `
        <div class="trend-item" style="cursor:pointer;" onclick="window.location.href='bai-viet.html?id=${p.id}'">
            <div class="trend-num">${i + 1}</div>
            <div>
                <div class="trend-title">${escapeHtml(p.title)}</div>
                <div class="trend-meta">🔥 ${p.views || 0} lượt xem</div>
            </div>
        </div>
    `).join('');
};

window.initDynamicPodcast = function() {
    const container = document.getElementById('dynamicPodcastSidebar');
    if (!container) return;
    container.innerHTML = `<div style="font-size:12px;color:var(--ink-4);text-align:center;padding:8px 0;">Đang đợi Admin xuất bản bản thu...</div>`;
};

// ==========================================
// 6. VẼ LƯỚI BÀI CHUNG VÀ PHÂN TRANG
// ==========================================
window.renderPosts = function(containerId, posts, limit = 50) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.style.display = "grid";
    container.style.gridTemplateColumns = "repeat(auto-fill, minmax(300px, 1fr))";
    container.style.gap = "24px";

    if (posts.length === 0) {
        container.innerHTML = '<p style="color:#9CA3AF; grid-column: 1/-1;">Chưa có bài viết nào.</p>';
        return;
    }
    let html = '';
    posts.slice(0, limit).forEach(post => {
        let plainText = post.content ? post.content.replace(/<\/?[^>]+(>|$)/g, "") : '';
        html += `
        <div class="card" style="cursor:pointer; position:relative;" onclick="window.location.href='bai-viet.html?id=${post.id}'">
            <div class="share-box">
                <button class="btn-share fb" onclick="event.stopPropagation(); shareToFB('${post.id}')" title="Chia sẻ Facebook">
                    <svg viewBox="0 0 320 512"><path d="M275.9 330.7L293 218h-107.9v-73.2c0-31.2 14.8-61.7 64.6-61.7H296V10.1C280.9 6.8 245.6 0 203.2 0 109.1 0 46.9 56.6 46.9 161.7V218H-10v112.7h56.9v272.3h112.7V330.7h96.3z"/></svg>
                </button>
                <button class="btn-share zl" onclick="event.stopPropagation(); shareToZalo('${post.id}')" title="Chia sẻ Zalo"><span>Zalo</span></button>
            </div>
            <div class="card-img">
                ${post.image && post.image.startsWith('data:image') ? `<img src="${escapeHtml(post.image)}" style="width:100%; height:100%; object-fit:cover;">` : escapeHtml(post.image || '📄')}
            </div>
            <div class="card-content">
                <h3><a style="color: inherit; text-decoration: none;">${escapeHtml(post.title)}</a></h3>
                <div class="meta">📁 ${escapeHtml(post.category)} &nbsp;|&nbsp; 📅 ${escapeHtml(post.date)}</div>
                <p style="margin-bottom: 15px; color: #666; font-size: 14px;">${escapeHtml(plainText.substring(0, 110))}...</p>
                <a class="read-more">Đọc tiếp →</a>
            </div>
        </div>`;
    });
    container.innerHTML = html;
};

// Xử lý riêng cho trang có phân trang (tin-tuc)
window.displayPosts = function() {
    const container = document.getElementById('postsContainer');
    if (!container) return;
    if (isLoading && !globalPosts.length) { setLoading('postsContainer', 'Đang tải bài viết...'); return; }
    if (!globalPosts.length) { setError('postsContainer', 'Chưa có bài viết nào.'); return; }

    // Kiểm tra xem trang có cần phân trang hay không
    const isTinTucPage = window.location.pathname.includes('tin-tuc');
    
    if (!isTinTucPage) {
        // Fallback: nếu không phải trang tin tức (vd le-hoi), mà lại gọi displayPosts()
        // thì ta sẽ thử gọi renderPosts cho toàn bộ bài viết của mục tương ứng
        let cat = 'le-hoi'; // Mặc định tạm
        if (window.location.pathname.includes('lich-su')) cat = 'lich-su';
        window.renderPosts('postsContainer', getPostsByCategory(cat));
        return;
    }

    const tinTuc = getPostsByCategory('tin-tuc');
    const total = tinTuc.length;
    const totalPages = Math.ceil(total / PAGE_SIZE) || 1;
    const start = (currentPage - 1) * PAGE_SIZE;
    const pageItems = tinTuc.slice(start, start + PAGE_SIZE);

    let html = '';
    if (!pageItems.length) {
        html = '<p style="color:var(--ink-4); text-align:center; padding:24px;">Chưa có bài viết trong mục này.</p>';
    } else {
        html += `<div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(300px,1fr)); gap:18px; margin-bottom:24px;">`;
        pageItems.forEach(post => {
            let plainText = post.content ? post.content.replace(/<\/[^>]+>/g, "").replace(/<[^>]+>/g,"") : '';
            let bg = (post.image && post.image.startsWith('http')) ? `background-image:url('${escapeHtml(post.image)}');` : '';
            let icon = (!post.image || post.image.startsWith('data:image')) ? '📰' : '';
            html += `
            <div class="card" style="cursor:pointer; position: relative;" onclick="window.location.href='bai-viet.html?id=${post.id}'">
                <div class="share-box">
                    <button class="btn-share fb" onclick="event.stopPropagation(); shareToFB('${post.id}')" title="Chia sẻ Facebook">
                        <svg viewBox="0 0 320 512"><path d="M275.9 330.7L293 218h-107.9v-73.2c0-31.2 14.8-61.7 64.6-61.7H296V10.1C280.9 6.8 245.6 0 203.2 0 109.1 0 46.9 56.6 46.9 161.7V218H-10v112.7h56.9v272.3h112.7V330.7h96.3z"/></svg>
                    </button>
                    <button class="btn-share zl" onclick="event.stopPropagation(); shareToZalo('${post.id}')" title="Chia sẻ Zalo"><span>Zalo</span></button>
                </div>
                <div style="height:180px; background-size:cover; background-position:center; ${bg} background-color:var(--cream-2); display:flex; align-items:center; justify-content:center; font-size:48px; border-bottom:1px solid var(--border-2);">${icon}</div>
                <div class="card-body">
                    <div class="card-meta"><span class="tag">${escapeHtml(post.category)}</span><span class="card-date">${escapeHtml(post.date)}</span></div>
                    <h3 style="font-family:var(--ff-head); font-size:16px; font-weight:700; line-height:1.4; margin-bottom:8px;">${escapeHtml(post.title)}</h3>
                    <p class="card-excerpt">${escapeHtml(plainText.substring(0, 120))}...</p>
                    <div class="card-footer"><span class="read-link">Đọc tiếp →</span></div>
                </div>
            </div>`;
        });
        html += `</div>`;

        if (totalPages > 1) {
            html += `<div style="display:flex; justify-content:center; gap:8px; margin:18px 0;">`;
            for (let i = 1; i <= totalPages; i++) {
                const active = i === currentPage ? 'background:var(--red); color:#fff; border-color:var(--red);' : 'background:var(--white); color:var(--ink); border-color:var(--border);';
                html += `<button onclick="window.changePage(${i})" style="width:36px; height:36px; border:1px solid; border-radius:var(--r-sm); font-weight:700; font-size:13px; cursor:pointer; ${active}">${i}</button>`;
            }
            html += `</div>`;
        }
    }
    container.innerHTML = html;
};

window.changePage = function(p) {
    currentPage = p;
    displayPosts();
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

// ==========================================
// 7. TRANG CHI TIẾT BÀI VIẾT (bai-viet.html)
// ==========================================
window.displayPostDetail = async function() {
    const container = document.getElementById('postDetail');
    const notFound = document.getElementById('postNotFound');
    if (!container) return;

    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    if (!id) { container.style.display='none'; if(notFound) notFound.style.display='block'; return; }

    setLoading('postDetail', 'Đang mở bài viết...');
    const post = await fetchPostById(id);
    if (!post) {
        container.style.display='none';
        if(notFound) notFound.style.display='block';
        return;
    }

    if(notFound) notFound.style.display='none';
    container.style.display='block';

    let formattedContent = post.content ? post.content.replace(/\n/g, '<br>') : '';
    let imgHtml = '';
    if (post.image && post.image.startsWith('data:image')) {
        imgHtml = `<img src="${escapeHtml(post.image)}" style="width:100%; border-radius:var(--r-md); margin-bottom:24px; box-shadow:var(--sh-sm);">`;
    } else if (post.image && post.image.startsWith('http')) {
        imgHtml = `<img src="${escapeHtml(post.image)}" style="width:100%; border-radius:var(--r-md); margin-bottom:24px; box-shadow:var(--sh-sm);">`;
    }

    const domain = "https://ngocdien.info.vn";
    const shareUrl = encodeURIComponent(`${domain}/bai-viet.html?id=${post.id}`);

    container.innerHTML = `
        <div style="max-width:780px; margin:0 auto;">
            <div style="display:flex; justify-content:space-between; align-items:center; padding:12px 0; border-bottom:1px solid var(--border-2); margin-bottom:24px; flex-wrap:wrap; gap:12px;">
                <div style="display:flex; gap:18px; font-size:13px; font-weight:700;">
                    <a href="index.html" style="color:var(--ink-3); text-decoration:none; display:flex; align-items:center; gap:6px;">🏠 Trang chủ</a>
                    <a href="javascript:history.back()" style="color:var(--red); text-decoration:none; display:flex; align-items:center; gap:6px;">⬅ Quay lại</a>
                </div>
                <div style="display:flex; gap:10px; align-items:center;">
                    <a href="https://www.facebook.com/sharer/sharer.php?u=${shareUrl}" target="_blank" title="Chia sẻ Facebook" style="width:32px;height:32px;background:#1877F2;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;font-size:16px;text-decoration:none;">f</a>
                    <a href="https://zalo.me/share?url=${shareUrl}" target="_blank" title="Chia sẻ Zalo" style="width:32px;height:32px;background:#0068FF;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;font-size:13px;font-weight:700;text-decoration:none;">Z</a>
                </div>
            </div>

            <h1 style="font-family:var(--ff-head); font-size:clamp(24px,3vw,34px); color:var(--red); margin-bottom:12px; line-height:1.25;">${escapeHtml(post.title)}</h1>
            <div style="font-size:12px; color:var(--ink-4); margin-bottom:24px; border-bottom:1px solid var(--border-2); padding-bottom:14px;">
                📅 ${escapeHtml(post.date)} &nbsp;|&nbsp; 👤 ${escapeHtml(post.author || 'Ban quản trị')} &nbsp;|&nbsp; 🔥 ${post.views || 0} lượt xem
            </div>

            ${imgHtml}
            <div style="font-size:16.5px; line-height:1.85; text-align:justify; color:var(--ink);">${formattedContent}</div>
        </div>
    `;

    try {
        fetch(`${SUPABASE_URL}/rest/v1/posts?id=eq.${post.id}`, {
            method: 'PATCH',
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=minimal'
            },
            body: JSON.stringify({ views: (post.views || 0) + 1 })
        });
    } catch(e){}
};

// ==========================================
// 8. TÍNH NĂNG QUẢN TRỊ VIÊN (ADMIN) - BẢO VỆ CHẶT CHẼ
// ==========================================
window.deletePost = async function(id) {
    if (confirm('Anh có chắc chắn muốn xóa bài viết này không?')) {
        try {
            const token = localStorage.getItem('supabase_admin_token');
            if (!token) throw new Error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");

            const response = await fetch(`${SUPABASE_URL}/rest/v1/posts?id=eq.${id}`, {
                method: 'DELETE',
                headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error("Xóa thất bại (Lỗi phân quyền)");
            
            alert('Đã xóa bài viết thành công!');
            localStorage.removeItem(CACHE_KEY); // Xóa cache
            globalPosts = [];
            await fetchPostsFromSupabase(); 
        } catch (error) {
            alert("Lỗi khi xóa bài: " + error.message);
        }
    }
};

window.currentEditId = null; 
window.editPost = function(id) {
    let posts = getAllPosts();
    let post = posts.find(p => p.id == id);
    if (post) {
        document.getElementById('title').value = post.title || '';
        document.getElementById('category').value = post.category || '';
        document.getElementById('content').value = post.content || '';
        document.getElementById('author').value = post.author || '';
        document.getElementById('imageUrl').value = post.image || '';
        
        if (post.image && post.image.startsWith('data:image')) {
            document.getElementById('imagePreview').innerHTML = `<img src="${post.image}" class="preview-img">`;
        } else {
            document.getElementById('imagePreview').innerHTML = '';
        }
        
        window.currentEditId = post.id;
        let btn = document.querySelector('#postForm button[type="submit"]');
        if (btn) {
            btn.innerHTML = 'Cập nhật bài viết lên Đám Mây';
            btn.style.background = '#FF8C00'; 
        }
        window.scrollTo(0, 0); 
    }
};

// ==========================================
// KHỞI ĐỘNG HỆ THỐNG
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    fetchPostsFromSupabase(100, 0);
});
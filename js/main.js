// main.js

// ==========================================
// THIẾT LẬP KẾT NỐI SUPABASE
// ==========================================
const SUPABASE_URL = "https://twsmdblbrgvsctzsavni.supabase.co"; // Đường link đại ca vừa lấy
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR3c21kYmxicmd2c2N0enNhdm5pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY5Njc1NDEsImV4cCI6MjA5MjU0MzU0MX0.pjrtm6g5e3z4XwffhANES55G0JNtcBXiLkA0_ZyeHC0"; // Mã bí mật đại ca vừa lấy

// Biến lưu trữ bài viết sau khi kéo từ Supabase về
let globalPosts = [];

// Hàm nòng cốt: Kéo dữ liệu từ kho Supabase về web
async function fetchPostsFromSupabase() {
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/posts?select=*&order=id.desc`, {
            method: 'GET',
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        globalPosts = data; // Lưu vào bộ nhớ tạm để các hàm khác dùng
        console.log("Đã tải dữ liệu từ Supabase thành công!", globalPosts.length, "bài viết.");
        
        // Sau khi tải xong dữ liệu, tự động chạy các hàm vẽ giao diện
        if(typeof renderHero==='function') renderHero();
        if(typeof initDynamicTicker==='function') initDynamicTicker();
        if(typeof initAutoFeaturedNews==='function') initAutoFeaturedNews();
        if(typeof initDynamicPodcast==='function') initDynamicPodcast();
        if(typeof initTrendingPosts==='function') initTrendingPosts();
        
        // Nếu đang ở các trang danh mục (tin tức, người ngọc điền...), gọi hàm hiển thị
        if (document.getElementById('postsContainer') && typeof displayPosts === 'function') {
            displayPosts();
        }

        return data;
    } catch (error) {
        console.error("Lỗi khi tải dữ liệu từ Supabase:", error);
        return [];
    }
}

// Thay thế hàm getAllPosts cũ bằng hàm đọc từ biến globalPosts
function getAllPosts() {
    return globalPosts;
}

// Hàm lấy bài theo danh mục
function getPostsByCategory(category) {
    let posts = getAllPosts();
    return posts.filter(p => p.category === category);
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

// ==========================================
// ĐÃ SỬA CHUẨN XÁC TÊN CLASS CSS CỦA ANH
// ==========================================
function renderNewsGrid(containerId, posts, limit = 6) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    // Tự động thêm Grid để các thẻ bài xếp ngang 3 cột đẹp mắt
    container.style.display = "grid";
    container.style.gridTemplateColumns = "repeat(auto-fill, minmax(300px, 1fr))";
    container.style.gap = "24px";

    if (posts.length === 0) {
        container.innerHTML = '<p style="color:#9CA3AF; grid-column: 1/-1;">Chưa có bài viết nào.</p>';
        return;
    }
    let html = '';
    posts.slice(0, limit).forEach(post => {
        // Lọc bỏ HTML (thẻ in đậm, đổi màu) để lấy tóm tắt sạch
        let plainText = post.content ? post.content.replace(/<\/?[^>]+(>|$)/g, "") : '';
        html += `
        <div class="card">
            <div class="card-img">
                ${post.image && post.image.startsWith('data:image') 
                  ? `<img src="${escapeHtml(post.image)}" style="width:100%; height:100%; object-fit:cover;">` 
                  : escapeHtml(post.image || '📄')}
            </div>
            <div class="card-content">
                <h3><a href="#" onclick="viewPost('${post.id}'); return false;" style="color: inherit; text-decoration: none;">${escapeHtml(post.title)}</a></h3>
                <div class="meta">📁 ${escapeHtml(post.category)} &nbsp;|&nbsp; 📅 ${escapeHtml(post.date)}</div>
                <p style="margin-bottom: 15px; color: #666; font-size: 14px;">${escapeHtml(plainText.substring(0, 110))}...</p>
                <a href="#" class="read-more" onclick="viewPost('${post.id}'); return false;">Đọc tiếp →</a>
            </div>
        </div>`;
    });
    container.innerHTML = html;
}

function renderPosts(containerId, posts, limit = 50) {
    renderNewsGrid(containerId, posts, limit);
}

// ==========================================
// KHUNG ĐỌC BÀI CHUYÊN NGHIỆP TRÊN TRANG
// ==========================================
window.viewPost = function(id) {
    let posts = getAllPosts();
    // Chú ý: Cần đổi == thành === và so sánh String nếu UUID của Supabase
    let post = posts.find(p => p.id == id);
    if (!post) {
        alert('Bài viết không tồn tại hoặc chưa tải xong. Vui lòng thử lại.'); return;
    }

    const hero = document.getElementById('heroDynamic'); 
    const pageLayout = document.querySelector('.page-layout'); 
    const postsContainer = document.getElementById('postsContainer'); 
    const pageTitle = document.querySelector('h1[style*="DA251D"]'); 
    const menuWrapper = document.querySelector('.menu-wrapper');

    let readingArea = document.getElementById('readingArea');
    if (!readingArea) {
        readingArea = document.createElement('div');
        readingArea.id = 'readingArea';
        const mainContainer = document.querySelector('.container:has(.page-layout), .container:has(#postsContainer)');
        if(mainContainer) {
            mainContainer.prepend(readingArea);
        } else {
            document.body.appendChild(readingArea);
        }
    }

    if (hero) hero.style.display = 'none';
    if (pageLayout) pageLayout.style.display = 'none';
    if (postsContainer) postsContainer.style.display = 'none';
    if (pageTitle) pageTitle.style.display = 'none';
    if (menuWrapper) menuWrapper.style.display = 'none';
    
    readingArea.style.display = 'block';

    let formattedContent = post.content ? post.content.replace(/\n/g, '<br>') : '';
    let shareUrl = encodeURIComponent(window.location.href);

    // Giao diện đã loại bỏ biến màu lạ, sử dụng đúng mã màu chuẩn
    readingArea.innerHTML = `
        <div style="max-width: 850px; margin: 0 auto; padding: 10px 0 60px;">
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 15px 0; border-bottom: 1px solid #EAEAEA; margin-bottom: 30px;">
                <div style="display: flex; gap: 20px;">
                    <a href="index.html" style="font-weight: 600; color: #666; display: flex; align-items: center; gap: 6px; text-decoration: none;">🏠 Trang chủ</a>
                    <a href="#" onclick="closeArticle(); return false;" style="font-weight: 700; color: #DA251D; display: flex; align-items: center; gap: 6px; text-decoration: none;">✖ Thoát</a>
                </div>
                <div style="display: flex; gap: 15px; align-items: center;">
                    <svg viewBox="0 0 24 24" style="width: 32px; height: 32px; cursor: pointer; transition: transform 0.2s;" onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'" onclick="window.open('https://www.facebook.com/sharer/sharer.php?u='+shareUrl)">
                        <circle cx="12" cy="12" r="12" fill="#1877F2"/>
                        <path d="M15 12h-2v7h-3v-7H8V9h2V7.6C10 5.5 11.2 4.3 13.3 4.3c.9 0 1.7.1 1.7.1v2h-1c-1 0-1.3.6-1.3 1.3V9h2.3l-.3 3z" fill="white"/>
                    </svg>
                    <svg viewBox="0 0 24 24" style="width: 32px; height: 32px; cursor: pointer; transition: transform 0.2s;" onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'" onclick="alert('Đã sao chép link! Anh có thể dán vào Zalo để chia sẻ.'); navigator.clipboard.writeText(window.location.href);">
                        <circle cx="12" cy="12" r="12" fill="#0068FF"/>
                        <path d="M7 7h10a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2z" fill="none" stroke="white" stroke-width="1.5"/>
                        <text x="7.5" y="15" fill="white" font-family="Arial, sans-serif" font-weight="bold" font-size="10">Z</text>
                    </svg>
                </div>
            </div>
            
            <h2 style="font-family: 'Times New Roman', serif; font-size: 34px; color: #DA251D; margin-bottom: 15px; line-height: 1.3;">${escapeHtml(post.title)}</h2>
            <div style="font-size: 13px; color: #9CA3AF; margin-bottom: 25px; border-bottom: 1px solid #EAEAEA; padding-bottom: 15px;">📅 ${escapeHtml(post.date)} &nbsp;|&nbsp; 👤 ${escapeHtml(post.author || 'Ban quản trị')}</div>
            
            ${post.image && post.image.startsWith('data:image') ? `<img src="${escapeHtml(post.image)}" style="width: 100%; border-radius: 12px; margin-bottom: 30px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">` : ''}
            
            <div style="font-size: 17px; line-height: 1.8; text-align: justify; color: #1A1A1A;">${formattedContent}</div>
        </div>
    `;
    window.scrollTo(0, 0);

    // Xử lý tăng View ngầm đẩy lên Supabase (không bắt buộc thành công)
    if (post.id) {
        fetch(`${SUPABASE_URL}/rest/v1/posts?id=eq.${post.id}`, {
            method: 'PATCH',
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=minimal'
            },
            body: JSON.stringify({ views: (post.views || 0) + 1 })
        }).catch(e => console.log("Không tăng được view", e));
    }
};

window.closeArticle = function() {
    const readingArea = document.getElementById('readingArea');
    const hero = document.getElementById('heroDynamic');
    const pageLayout = document.querySelector('.page-layout');
    const postsContainer = document.getElementById('postsContainer');
    const pageTitle = document.querySelector('h1[style*="DA251D"]');
    const menuWrapper = document.querySelector('.menu-wrapper');

    if (readingArea) readingArea.style.display = 'none';
    
    if (hero) hero.style.display = 'flex'; 
    if (pageLayout) pageLayout.style.display = 'grid'; 
    if (postsContainer) postsContainer.style.display = 'grid'; 
    if (pageTitle) pageTitle.style.display = 'block';
    if (menuWrapper) menuWrapper.style.display = 'block';
    
    window.scrollTo(0, 0);
};

// ==========================================
// CHỨC NĂNG SỬA/XÓA CỦA ADMIN BẰNG SUPABASE
// ==========================================
window.deletePost = async function(id) {
    if (confirm('Anh có chắc chắn muốn xóa bài viết này không?')) {
        try {
            const response = await fetch(`${SUPABASE_URL}/rest/v1/posts?id=eq.${id}`, {
                method: 'DELETE',
                headers: {
                    'apikey': SUPABASE_KEY,
                    'Authorization': `Bearer ${SUPABASE_KEY}`
                }
            });

            if (!response.ok) throw new Error("Xóa thất bại");
            
            alert('Đã xóa bài viết thành công!');
            await fetchPostsFromSupabase(); // Cập nhật lại danh sách ngay lập tức
            
        } catch (error) {
            alert("Có lỗi khi xóa bài: " + error.message);
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

window.renderHero = function() {
    let posts = getPostsByCategory('gioi-thieu');
    if (posts.length > 0) {
        let post = posts[0];
        let heroTitle = document.querySelector('#heroDynamic .hero-title');
        let heroLead = document.querySelector('#heroDynamic .hero-lead');
        if (heroTitle) heroTitle.innerHTML = escapeHtml(post.title);
        if (heroLead) {
            let plainText = post.content ? post.content.replace(/<\/?[^>]+(>|$)/g, "") : "";
            heroLead.innerHTML = escapeHtml(plainText.substring(0, 180)) + '...';
        }
    }
};

// ==========================================
// KHỞI ĐỘNG HỆ THỐNG (TỰ KÉO DATA KHI VÀO WEB)
// ==========================================
// Gọi hàm kéo dữ liệu ngay khi tải trang
fetchPostsFromSupabase();

// Đoạn initSampleData đã bị xóa vì giờ chúng ta xài dữ liệu thật từ đám mây
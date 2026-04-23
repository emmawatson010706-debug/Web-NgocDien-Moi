// main.js
function savePost(post) {
    let posts = JSON.parse(localStorage.getItem('ngocdien_posts')) || [];
    post.id = Date.now();
    post.date = new Date().toLocaleDateString('vi-VN');
    posts.unshift(post);
    localStorage.setItem('ngocdien_posts', JSON.stringify(posts));
    return true;
}

function getAllPosts() {
    return JSON.parse(localStorage.getItem('ngocdien_posts')) || [];
}

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
        let plainText = post.content.replace(/<\/?[^>]+(>|$)/g, "");
        html += `
        <div class="card">
            <div class="card-img">
                ${post.image && post.image.startsWith('data:image') 
                    ? `<img src="${escapeHtml(post.image)}" style="width:100%; height:100%; object-fit:cover;">` 
                    : escapeHtml(post.image || '📄')}
            </div>
            <div class="card-content">
                <h3><a href="#" onclick="viewPost(${post.id}); return false;" style="color: inherit; text-decoration: none;">${escapeHtml(post.title)}</a></h3>
                <div class="meta">📁 ${post.category} &nbsp;|&nbsp; 📅 ${post.date}</div>
                <p style="margin-bottom: 15px; color: #666; font-size: 14px;">${escapeHtml(plainText.substring(0, 110))}...</p>
                <a href="#" class="read-more" onclick="viewPost(${post.id}); return false;">Đọc tiếp →</a>
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
    let post = posts.find(p => p.id == id);
    if (!post) {
        alert('Bài viết không tồn tại.'); return;
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

    let formattedContent = post.content.replace(/\n/g, '<br>');
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
            <div style="font-size: 13px; color: #9CA3AF; margin-bottom: 25px; border-bottom: 1px solid #EAEAEA; padding-bottom: 15px;">📅 ${post.date} &nbsp;|&nbsp; 👤 ${escapeHtml(post.author || 'Ban quản trị')}</div>
            
            ${post.image && post.image.startsWith('data:image') ? `<img src="${escapeHtml(post.image)}" style="width: 100%; border-radius: 12px; margin-bottom: 30px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">` : ''}
            
            <div style="font-size: 17px; line-height: 1.8; text-align: justify; color: #1A1A1A;">${formattedContent}</div>
        </div>
    `;
    window.scrollTo(0, 0);
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
// CHỨC NĂNG SỬA/XÓA VÀ KẾT NỐI BANNER
// ==========================================
window.deletePost = function(id) {
    if (confirm('Anh có chắc chắn muốn xóa bài viết này không?')) {
        let posts = getAllPosts();
        posts = posts.filter(p => p.id != id);
        localStorage.setItem('ngocdien_posts', JSON.stringify(posts));
        if (typeof displayPosts === "function") displayPosts(); 
        alert('Đã xóa thành công!');
    }
};

window.currentEditId = null; 
window.editPost = function(id) {
    let posts = getAllPosts();
    let post = posts.find(p => p.id == id);
    if (post) {
        document.getElementById('title').value = post.title;
        document.getElementById('category').value = post.category;
        document.getElementById('content').value = post.content;
        document.getElementById('author').value = post.author;
        document.getElementById('imageUrl').value = post.image || '';
        
        if (post.image && post.image.startsWith('data:image')) {
            document.getElementById('imagePreview').innerHTML = `<img src="${post.image}" class="preview-img">`;
        } else {
            document.getElementById('imagePreview').innerHTML = '';
        }
        
        window.currentEditId = post.id;
        let btn = document.querySelector('#postForm button[type="submit"]');
        if (btn) {
            btn.innerHTML = 'Cập nhật bài viết';
            btn.style.background = '#FF8C00'; 
        }
        window.scrollTo(0, 0); 
    }
};

function initSampleData() {
    let posts = getAllPosts();
    if (posts.length === 0) {
        let samples = [
            { title: "Khánh thành nhà văn hóa xóm Ngọc Điền", category: "tin-tuc", content: "Công trình mới khang trang, đáp ứng nhu cầu sinh hoạt cộng đồng.", image: "🏠", author: "Ban quản trị" },
            { title: "Lễ hội cầu mùa năm 2026", category: "tin-tuc", content: "Phục dựng nghi lễ truyền thống, thu hút đông đảo bà con.", image: "🌾", author: "Ban lễ hội" },
            { title: "Ra mắt website lưu trữ số", category: "tin-tuc", content: "Chính thức đưa vào hoạt động kho tư liệu trực tuyến.", image: "💻", author: "Admin" },
            { title: "Liệt sỹ Nguyễn Văn A – Anh hùng tuổi 20", category: "nguoi-ngoc-dien", content: "Hy sinh tại chiến trường Quảng Trị.", image: "🎖️", author: "Ban liệt sỹ" },
            { title: "Mẹ Việt Nam Anh hùng Trần Thị B", category: "nguoi-ngoc-dien", content: "Mẹ có hai con là liệt sỹ.", image: "💐", author: "Hội phụ nữ" },
            { title: "Giáo sư Lê Văn C – Nhà khoa học", category: "nguoi-ngoc-dien", content: "Người con thành danh của xóm.", image: "👨‍🎓", author: "Hội khuyến học" },
            { title: "Đình làng Ngọc Điền", category: "di-tich", content: "Di tích cấp tỉnh, thờ thành hoàng làng.", image: "⛩️", author: "Ban di tích" },
            { title: "Hương ước 1883 – Bản gốc", category: "huong-uoc", content: "Quy định về hội họp, canh nông.", image: "📜", author: "Lưu trữ" },
            { title: "Những cơn mưa quê", category: "tan-man", content: "Bài viết tản mạn về mưa quê hương.", image: "🌧️", author: "Nguyễn Văn A" },
            { title: "Vầng trăng xóm vãi", category: "tho", content: "Bài thơ về trăng và tình làng.", image: "🌕", author: "Lê Thị B" },
            { title: "Chuyện bà Tám", category: "che-xanh", content: "Kỷ niệm đáng nhớ trong xóm.", image: "🍵", author: "Trần Văn C" },
            { title: "Đình làng Ngọc Điền - Giai thoại", category: "giai-thoai", content: "Câu chuyện kể về đình làng.", image: "📖", author: "Cao niên" },
            { title: "Họ Nguyễn xưa", category: "kham-pha", content: "Nghiên cứu về nguồn gốc họ Nguyễn.", image: "🔍", author: "Nhóm nghiên cứu" },
            { title: "Xây dựng nếp sống mới", category: "goc-nhin", content: "Góc nhìn về xây dựng xóm văn minh.", image: "🌱", author: "Mặt trận" }
        ];
        samples.forEach(p => {
            let post = { ...p, id: Date.now() + Math.random(), date: new Date().toLocaleDateString('vi-VN') };
            posts.push(post);
        });
        localStorage.setItem('ngocdien_posts', JSON.stringify(posts));
    }
}

if (getAllPosts().length === 0) {
    initSampleData();
}

window.renderHero = function() {
    let posts = getPostsByCategory('gioi-thieu');
    if (posts.length > 0) {
        let post = posts[0];
        let heroTitle = document.querySelector('#heroDynamic .hero-title');
        let heroLead = document.querySelector('#heroDynamic .hero-lead');
        if (heroTitle) heroTitle.innerHTML = escapeHtml(post.title);
        if (heroLead) {
            let plainText = post.content.replace(/<\/?[^>]+(>|$)/g, "");
            heroLead.innerHTML = escapeHtml(plainText.substring(0, 180)) + '...';
        }
    }
};
const API_URL = '/api';

        function escapeHtml(text) {
            if (text === null || text === undefined) return '';
            const str = String(text);
            const div = document.createElement('div');
            div.textContent = str;
            return div.innerHTML;
        }

        async function loadEventDetails() {
            const params = new URLSearchParams(window.location.search);
            const id = params.get('id');

            if (!id) {
                showError('Không tìm thấy mã bài viết.');
                return;
            }

            try {
                const response = await fetch(`${API_URL}/events/${id}`);
                const result = await response.json();

                if (!response.ok || !result.success) {
                    showError(result.error || 'Bài viết không tồn tại hoặc đã bị xóa.');
                    return;
                }

                renderEvent(result.data);
            } catch (error) {
                console.error('Error:', error);
                showError('Lỗi kết nối máy chủ. Vui lòng thử lại sau.');
            }
        }

        function normalizeImageUrl(url) {
            if (!url) return '/logo.jpg';
            const firstUrl = url.split(',')[0].trim();
            if (!firstUrl.startsWith('http')) return '/logo.jpg';
            return escapeHtml(firstUrl);
        }

        function renderEvent(event) {
            const wrapper = document.getElementById('event-content-wrapper');
            
            // Nếu không có ảnh, dùng ảnh mặc định phong cảnh chùa
            const defaultImage = 'https://images.unsplash.com/photo-1548625361-ec85303c7348?q=80&w=2070&auto=format&fit=crop';
            const bgImage = event.image_url ? normalizeImageUrl(event.image_url) : defaultImage;

            const urls = event.image_url ? event.image_url.split(',').map(u => u.trim()).filter(u => u.startsWith('http')) : [];
            let galleryHtml = '';
            if (urls.length > 1) {
                galleryHtml = `
                    <div class="event-gallery" style="margin: 30px 0; display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px;">
                        ${urls.map(url => `<img src="${escapeHtml(url)}" style="width: 100%; height: 250px; object-fit: cover; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);" alt="Hình ảnh sự kiện">`).join('')}
                    </div>
                `;
            }

            wrapper.innerHTML = `
                <div class="event-header" style="background-image: url('${bgImage}')">
                    <div class="event-header-content">
                        <h1 class="event-header-title">${escapeHtml(event.title)}</h1>
                        <div class="event-meta">
                            <span>📅 Ngày: ${escapeHtml(event.event_date)}</span>
                            <span>🏷️ ${escapeHtml(event.category)}</span>
                        </div>
                    </div>
                </div>
                <div class="event-body">
                    <p style="white-space: pre-wrap; margin-bottom: 20px;">${escapeHtml(event.description)}</p>
                    ${galleryHtml}
                    <a href="/index.html#activities" class="back-btn">← Quay lại danh sách hoạt động</a>
                </div>
            `;
        }

        function showError(message) {
            const wrapper = document.getElementById('event-content-wrapper');
            wrapper.innerHTML = `
                <div class="event-header" style="background: var(--color-pagoda-dark);">
                    <div class="event-header-content">
                        <h1 class="event-header-title">Đã xảy ra lỗi</h1>
                    </div>
                </div>
                <div class="event-body" style="text-align: center;">
                    <p style="color: #c62828; font-size: 1.2rem;">${escapeHtml(message)}</p>
                    <a href="/index.html" class="back-btn">← Về Trang Chủ</a>
                </div>
            `;
        }

        // Initialize
        document.addEventListener('DOMContentLoaded', loadEventDetails);
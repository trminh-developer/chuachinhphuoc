// =============================================================================
// Chùa Chính Phước — Admin Dashboard (admin.js)
// Kết nối API thực (Events, Gallery, Contacts), Audio dùng localStorage.
// =============================================================================

const API_URL = '/api';
let token = localStorage.getItem('adminToken');
let audios = [];

// ==================== Service Worker (PWA) ====================
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('../sw.js')
            .then(reg => console.log('Admin ServiceWorker registered!'))
            .catch(err => console.log('Admin ServiceWorker failed: ', err));
    });
}

// =============================================================================
// XSS Protection
// =============================================================================
function normalizeImageUrl(url) {
    if (!url) return '/logo.jpg';
    const trimmed = url.trim();
    if (!trimmed.startsWith('http')) {
        return '/logo.jpg';
    }
    return escapeHtml(trimmed);
}

function escapeHtml(text) {
    if (text === null || text === undefined) return '';
    const str = String(text);
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// =============================================================================
// Auth-Aware Fetch Wrapper
// Tự động xử lý 401 (token hết hạn) cho MỌI API call.
// =============================================================================
async function authFetch(url, options = {}) {
    if (!token) {
        logout();
        throw new Error('Chưa đăng nhập');
    }

    const headers = {
        ...(options.headers || {}),
        'Authorization': `Bearer ${token}`
    };

    // Thêm Content-Type nếu có body
    if (options.body && !headers['Content-Type']) {
        headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(url, { ...options, headers });

    if (response.status === 401) {
        showMessage('loginMessage', 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.', 'error');
        setTimeout(() => logout(), 1500);
        throw new Error('Token đã hết hạn');
    }

    return response;
}

// =============================================================================
// Initialization
// =============================================================================
if (token) {
    showDashboard();
    loadAllData();
} else {
    document.getElementById('loginContainer').style.display = 'flex';
}

// =============================================================================
// Authentication
// =============================================================================
document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();

    if (!username || !password) {
        showMessage('loginMessage', 'Vui lòng nhập username và password', 'error');
        return;
    }

    const loginBtn = e.target.querySelector('button[type="submit"]');
    if (loginBtn) {
        loginBtn.disabled = true;
        loginBtn.textContent = 'Đang đăng nhập...';
    }

    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (data.success && data.data && data.data.token) {
            token = data.data.token;
            localStorage.setItem('adminToken', token);
            showDashboard();
            loadAllData();
        } else {
            showMessage('loginMessage', data.error || 'Đăng nhập thất bại', 'error');
        }
    } catch (error) {
        console.error('❌ Login error:', error);
        showMessage('loginMessage', 'Lỗi kết nối: ' + error.message, 'error');
    } finally {
        if (loginBtn) {
            loginBtn.disabled = false;
            loginBtn.textContent = 'Đăng Nhập';
        }
    }
});

// =============================================================================
// File Upload Helper (Direct to Supabase Storage)
// =============================================================================
async function uploadToSupabase(file, progressCallback = null) {
    if (!file) return null;
    
    // 1. Get signed upload URL from backend
    const tokenRes = await authFetch(`${API_URL}/upload-token`, {
        method: 'POST',
        body: JSON.stringify({ filename: file.name })
    });
    const tokenData = await tokenRes.json();
    if (!tokenData.success) {
        throw new Error(tokenData.error || 'Lỗi lấy token upload');
    }
    
    const { signedUrl, token: uploadToken, publicUrl } = tokenData.data;

    // 2. Upload file directly to Supabase via PUT request using Signed URL
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('PUT', signedUrl, true);
        xhr.setRequestHeader('Authorization', `Bearer ${uploadToken}`);
        xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
        xhr.setRequestHeader('Cache-Control', 'max-age=3600');

        if (progressCallback) {
            xhr.upload.onprogress = (e) => {
                if (e.lengthComputable) {
                    const percent = Math.round((e.loaded / e.total) * 100);
                    progressCallback(percent);
                }
            };
        }

        xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                resolve(publicUrl);
            } else {
                reject(new Error(`Lỗi tải lên: ${xhr.statusText}`));
            }
        };

        xhr.onerror = () => reject(new Error('Lỗi mạng khi tải lên'));
        xhr.send(file);
    });
}

// =============================================================================
// Preview Image selected from input file
// =============================================================================
function handleImagePreview(inputId, previewContainerId) {
    const input = document.getElementById(inputId);
    const container = document.getElementById(previewContainerId);
    if (!input || !container) return;

    input.addEventListener('change', (e) => {
        container.innerHTML = ''; // Clear old preview
        const files = e.target.files;
        if (!files || files.length === 0) return;

        Array.from(files).forEach(file => {
            if (!file.type.startsWith('image/')) return;
            
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = document.createElement('img');
                img.src = e.target.result;
                img.style.width = '100px';
                img.style.height = '100px';
                img.style.objectFit = 'cover';
                img.style.borderRadius = '4px';
                img.style.border = '1px solid #ccc';
                container.appendChild(img);
            };
            reader.readAsDataURL(file);
        });
    });
}

function handleAudioPreview(inputId, previewContainerId) {
    const input = document.getElementById(inputId);
    const container = document.getElementById(previewContainerId);
    if (!input || !container) return;

    input.addEventListener('change', (e) => {
        container.innerHTML = '';
        const files = e.target.files;
        if (!files || files.length === 0) return;

        const file = files[0];
        if (!file.type.startsWith('audio/')) return;
        
        const audio = document.createElement('audio');
        audio.controls = true;
        audio.src = URL.createObjectURL(file);
        audio.style.width = '100%';
        container.appendChild(audio);
    });
}

// Gọi hàm preview cho Event và Gallery
document.addEventListener('DOMContentLoaded', () => {
    handleImagePreview('eventImageFile', 'eventImagePreview');
    handleImagePreview('imageFiles', 'galleryImagePreview');
    handleAudioPreview('audioFile', 'audioFilePreview');
});

// =============================================================================
// Events Management
// =============================================================================
document.getElementById('eventForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('eventId')?.value;
    const date = document.getElementById('eventDate')?.value.trim();
    const title = document.getElementById('eventTitle')?.value.trim();
    const description = document.getElementById('eventDescription')?.value.trim();
    const category = document.getElementById('eventCategory')?.value.trim();
    const fileInput = document.getElementById('eventImageFile');
    let imageUrl = document.getElementById('eventImageUrl')?.value.trim();

    if (!date || !title || !description || !category) {
        alert('Vui lòng điền đầy đủ thông tin.');
        return;
    }

    const dateRegex = /^\d{2}\/\d{2}\/\d{4}$/;
    if (!dateRegex.test(date)) {
        alert('Định dạng ngày phải là DD/MM/YYYY (vd: 01/01/2026)');
        return;
    }

    const submitBtn = document.getElementById('eventSubmitBtn');
    submitBtn.disabled = true;
    submitBtn.innerText = 'Đang xử lý...';

    try {
        if (fileInput && fileInput.files.length > 0) {
            submitBtn.innerText = 'Đang tải ảnh lên (0%)...';
            imageUrl = await uploadToSupabase(fileInput.files[0], (percent) => {
                submitBtn.innerText = `Đang tải ảnh lên (${percent}%)...`;
            });
        }

        const method = id ? 'PUT' : 'POST';
        const url = id ? `${API_URL}/events/${id}` : `${API_URL}/events`;
        
        const response = await authFetch(url, {
            method: method,
            body: JSON.stringify({ date, title, description, category, imageUrl })
        });

        const data = await response.json();

        if (data.success) {
            cancelEdit('event');
            loadEvents();
            alert(id ? '✅ Cập nhật thành công!' : '✅ Thêm thành công!');
        } else {
            alert('❌ Lỗi: ' + (data.error || 'Không xác định'));
        }
    } catch (error) {
        if (error.message === 'Token đã hết hạn') return;
        console.error('❌ Error saving event:', error);
        alert('❌ Lỗi kết nối: ' + error.message);
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerText = id ? 'Lưu Thay Đổi' : 'Thêm Hoạt Động';
    }
});

async function deleteEvent(id) {
    if (typeof id !== 'number' || isNaN(id) || id <= 0) {
        alert('ID không hợp lệ');
        return;
    }

    if (!confirm('Xác nhận xóa hoạt động này?')) return;

    try {
        const response = await authFetch(`${API_URL}/events/${id}`, {
            method: 'DELETE'
        });

        const data = await response.json();

        if (data.success) {
            loadEvents();
            alert('✅ Xóa hoạt động thành công!');
        } else {
            alert('❌ Lỗi: ' + (data.error || 'Không xác định'));
        }
    } catch (error) {
        if (error.message === 'Token đã hết hạn') return;
        console.error('❌ Error deleting event:', error);
        alert('❌ Lỗi kết nối: ' + error.message);
    }
}

async function loadEvents() {
    try {
        const response = await fetch(`${API_URL}/events`);
        const data = await response.json();
        const list = document.getElementById('eventsList');

        if (!list) return;

        if (!data.success || !data.data || data.data.length === 0) {
            list.innerHTML = '<p style="padding:20px;color:#999;">Chưa có hoạt động nào.</p>';
            return;
        }

        list.innerHTML = data.data.map(event => {
            let shortDesc = event.description || '';
            if (shortDesc.length > 120) {
                shortDesc = shortDesc.substring(0, 120) + '...';
            }
            return `
            <div class="item-card">
                ${event.image_url ? `<img class="img-preview" src="${normalizeImageUrl(event.image_url)}" alt="${escapeHtml(event.title)}" onerror="this.onerror=null; this.src='/logo.jpg';">` : ''}
                <span class="item-badge">${escapeHtml(event.category)}</span>
                <div class="item-title">${escapeHtml(event.title)}</div>
                <div class="item-desc">
                    <strong>Ngày:</strong> ${escapeHtml(event.event_date)}<br>
                    ${escapeHtml(shortDesc)}
                </div>
                <div class="item-actions">
                    <button class="btn-edit" onclick="editEvent(${event.id}, '${escapeHtml(event.event_date)}', '${escapeHtml(event.title)}', '${escapeHtml(event.category)}', '${escapeHtml(event.description).replace(/'/g, "\\'").replace(/\n/g, "\\n").replace(/\r/g, "")}', '${escapeHtml(event.image_url || '')}')">✏️ Sửa</button>
                    <button class="btn-delete" onclick="deleteEvent(${event.id})">🗑️ Xóa</button>
                </div>
            </div>
        `}).join('');
    } catch (error) {
        console.error('❌ Error loading events:', error);
        const list = document.getElementById('eventsList');
        if (list) {
            list.innerHTML = '<p style="color:#c00;">Lỗi tải dữ liệu. Vui lòng thử lại.</p>';
        }
    }
}

function editEvent(id, date, title, category, description, imageUrl) {
    document.getElementById('eventId').value = id;
    document.getElementById('eventDate').value = date;
    document.getElementById('eventTitle').value = title;
    document.getElementById('eventCategory').value = category;
    document.getElementById('eventDescription').value = description;
    document.getElementById('eventImageUrl').value = imageUrl || '';
    
    document.getElementById('eventFormTitle').innerText = 'Cập Nhật Hoạt Động';
    document.getElementById('eventSubmitBtn').innerText = 'Lưu Thay Đổi';
    document.getElementById('eventCancelBtn').style.display = 'inline-block';
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function cancelEdit(type) {
    if (type === 'event') {
        document.getElementById('eventForm').reset();
        document.getElementById('eventImagePreview').innerHTML = '';
        document.getElementById('eventId').value = '';
        document.getElementById('eventFormTitle').innerText = 'Thêm Hoạt Động Mới';
        document.getElementById('eventSubmitBtn').innerText = 'Thêm Hoạt Động';
        document.getElementById('eventCancelBtn').style.display = 'none';
    } else if (type === 'gallery') {
        document.getElementById('galleryForm').reset();
        document.getElementById('galleryImagePreview').innerHTML = '';
        document.getElementById('galleryId').value = '';
        document.getElementById('galleryFormTitle').innerText = 'Thêm Hình Ảnh Mới';
        document.getElementById('gallerySubmitBtn').innerText = 'Thêm Hình Ảnh';
        document.getElementById('galleryCancelBtn').style.display = 'none';
    } else if (type === 'audio') {
        document.getElementById('audioForm').reset();
        document.getElementById('audioFilePreview').innerHTML = '';
        document.getElementById('audioId').value = '';
        document.getElementById('audioFormTitle').innerText = 'Thêm Âm Thanh Mới';
        document.getElementById('audioSubmitBtn').innerText = 'Thêm Âm Thanh';
        document.getElementById('audioCancelBtn').style.display = 'none';
    }
}

// =============================================================================
// Gallery Management
// =============================================================================
document.getElementById('galleryForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('galleryId')?.value;
    const fileInput = document.getElementById('imageFiles');
    const inputUrl = document.getElementById('imageUrl')?.value.trim();
    const inputLabel = document.getElementById('imageLabel')?.value.trim();
    const order = parseInt(document.getElementById('imageOrder')?.value) || 0;

    const files = fileInput ? fileInput.files : [];

    if (!inputUrl && files.length === 0) {
        alert('Vui lòng chọn file ảnh hoặc dán URL.');
        return;
    }
    
    if (files.length === 0 && !inputLabel) {
        alert('Vui lòng nhập tiêu đề ảnh.');
        return;
    }

    const submitBtn = document.getElementById('gallerySubmitBtn');
    submitBtn.disabled = true;
    submitBtn.innerText = 'Đang xử lý...';

    try {
        let itemsToSave = [];

        // Nếu có chọn file upload
        if (files.length > 0) {
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                submitBtn.innerText = `Đang tải ảnh ${i+1}/${files.length} (0%)...`;
                
                const uploadedUrl = await uploadToSupabase(file, (percent) => {
                    submitBtn.innerText = `Đang tải ảnh ${i+1}/${files.length} (${percent}%)...`;
                });
                
                // Nếu người dùng nhập tiêu đề, ưu tiên dùng. Nếu tải nhiều, lấy tên file làm tiêu đề
                let label = inputLabel;
                if (!label || files.length > 1) {
                    label = file.name.replace(/\.[^/.]+$/, ""); // Xóa đuôi file
                }

                itemsToSave.push({ imageUrl: uploadedUrl, label, order: order + i });
            }
        } else {
            // Nếu dùng URL truyền thống
            itemsToSave.push({ imageUrl: inputUrl, label: inputLabel, order });
        }

        // Lưu vào CSDL
        for (let i = 0; i < itemsToSave.length; i++) {
            const item = itemsToSave[i];
            submitBtn.innerText = `Đang lưu CSDL ${i+1}/${itemsToSave.length}...`;
            
            // Nếu là chế độ edit (có id), chỉ sửa item đầu tiên
            const method = (id && i === 0) ? 'PUT' : 'POST';
            const url = (id && i === 0) ? `${API_URL}/gallery/${id}` : `${API_URL}/gallery`;

            const response = await authFetch(url, {
                method: method,
                body: JSON.stringify(item)
            });

            const data = await response.json();
            if (!data.success) {
                throw new Error(data.error || 'Lỗi khi lưu ảnh vào CSDL');
            }
        }

        cancelEdit('gallery');
        loadGallery();
        alert(id ? '✅ Cập nhật hình ảnh thành công!' : '✅ Thêm hình ảnh thành công!');
    } catch (error) {
        if (error.message === 'Token đã hết hạn') return;
        console.error('❌ Error saving gallery item:', error);
        alert('❌ Lỗi kết nối: ' + error.message);
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerText = id ? 'Lưu Thay Đổi' : 'Thêm Hình Ảnh';
    }
});

async function deleteGalleryItem(id) {
    if (typeof id !== 'number' || isNaN(id) || id <= 0) {
        alert('ID không hợp lệ');
        return;
    }

    if (!confirm('Xác nhận xóa hình ảnh này?')) return;

    try {
        const response = await authFetch(`${API_URL}/gallery/${id}`, {
            method: 'DELETE'
        });

        const data = await response.json();

        if (data.success) {
            loadGallery();
            alert('✅ Xóa hình ảnh thành công!');
        } else {
            alert('❌ Lỗi: ' + (data.error || 'Không xác định'));
        }
    } catch (error) {
        if (error.message === 'Token đã hết hạn') return;
        console.error('❌ Error deleting gallery item:', error);
        alert('❌ Lỗi kết nối: ' + error.message);
    }
}

async function loadGallery() {
    try {
        const response = await fetch(`${API_URL}/gallery`);
        const data = await response.json();
        const list = document.getElementById('galleryList');

        if (!list) return;

        if (!data.success || !data.data || data.data.length === 0) {
            list.innerHTML = '<p style="padding:20px;color:#999;">Chưa có hình ảnh nào.</p>';
            return;
        }

        list.innerHTML = data.data.map(item => `
            <div class="item-card">
                <img class="img-preview" src="${normalizeImageUrl(item.image_url)}"
                     alt="${escapeHtml(item.label)}"
                     onerror="this.onerror=null; this.src='/logo.jpg';">
                <div class="item-title">${escapeHtml(item.label)}</div>
                <div class="item-desc">Thứ tự: ${escapeHtml(item.order)}</div>
                <div class="item-actions">
                    <button class="btn-edit" onclick="editGallery(${item.id}, '${escapeHtml(item.image_url)}', '${escapeHtml(item.label)}', ${item.order})">✏️ Sửa</button>
                    <button class="btn-delete" onclick="deleteGalleryItem(${item.id})">🗑️ Xóa</button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('❌ Error loading gallery:', error);
        const list = document.getElementById('galleryList');
        if (list) {
            list.innerHTML = '<p style="color:#c00;">Lỗi tải dữ liệu. Vui lòng thử lại.</p>';
        }
    }
}

function editGallery(id, imageUrl, label, order) {
    document.getElementById('galleryId').value = id;
    document.getElementById('imageUrl').value = imageUrl;
    document.getElementById('imageLabel').value = label;
    document.getElementById('imageOrder').value = order;
    
    document.getElementById('galleryFormTitle').innerText = 'Cập Nhật Hình Ảnh';
    document.getElementById('gallerySubmitBtn').innerText = 'Lưu Thay Đổi';
    document.getElementById('galleryCancelBtn').style.display = 'inline-block';
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// =============================================================================
// Audio Management (localStorage — giữ nguyên cơ chế, bọc error handling)
// =============================================================================
document.getElementById('audioForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!token) {
        alert('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        logout();
        return;
    }

    const id = document.getElementById('audioId')?.value;
    const fileInput = document.getElementById('audioFile');
    let url = document.getElementById('audioUrl')?.value.trim();
    const title = document.getElementById('audioTitle')?.value.trim();
    const description = document.getElementById('audioDescription')?.value.trim();

    const file = fileInput ? fileInput.files[0] : null;

    if (!url && !file) {
        alert('Vui lòng chọn file âm thanh hoặc nhập URL.');
        return;
    }
    
    if (!title) {
        alert('Vui lòng nhập tiêu đề.');
        return;
    }

    const submitBtn = document.getElementById('audioSubmitBtn');
    submitBtn.disabled = true;
    submitBtn.innerText = 'Đang xử lý...';

    try {
        if (file) {
            submitBtn.innerText = 'Đang tải âm thanh (0%)...';
            url = await uploadToSupabase(file, (percent) => {
                submitBtn.innerText = `Đang tải âm thanh (${percent}%)...`;
            });
        }

        if (id) {
            // Update
            const index = audios.findIndex(a => a.id.toString() === id);
            if (index !== -1) {
                audios[index].url = url;
                audios[index].title = title;
                audios[index].description = description || '';
            }
        } else {
            // Create
            audios.push({
                id: Date.now(),
                url: url,
                title: title,
                description: description || ''
            });
        }
        
        localStorage.setItem('audios', JSON.stringify(audios));
        cancelEdit('audio');
        renderAudio();
        alert(id ? '✅ Cập nhật âm thanh thành công!' : '✅ Thêm âm thanh thành công!');
    } catch (error) {
        console.error('❌ Error saving audio:', error);
        alert('❌ Lỗi lưu dữ liệu: ' + error.message);
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerText = id ? 'Lưu Thay Đổi' : 'Thêm Âm Thanh';
    }
});

function loadAudio() {
    try {
        const stored = localStorage.getItem('audios');
        if (stored) {
            const parsed = JSON.parse(stored);
            // Validate parsed data is an array
            audios = Array.isArray(parsed) ? parsed : [];
        } else {
            audios = [];
        }
    } catch (error) {
        console.error('❌ Error loading audio from localStorage:', error);
        audios = [];
        // Dọn dẹp dữ liệu hỏng
        try {
            localStorage.removeItem('audios');
        } catch {
            // Bỏ qua nếu localStorage không khả dụng
        }
    }
    renderAudio();
}

function renderAudio() {
    const list = document.getElementById('audioList');
    if (!list) return;

    // Guard: token hết hạn → hiện thông báo
    if (!token) {
        list.innerHTML = '<p style="color:#c00;">Phiên đăng nhập đã hết hạn.</p>';
        return;
    }

    if (!audios || audios.length === 0) {
        list.innerHTML = '<p style="padding:20px;color:#999;">Chưa có âm thanh nào.</p>';
        return;
    }

    list.innerHTML = audios.map(audio => `
        <div class="item-card">
            <div class="item-title">${escapeHtml(audio.title)}</div>
            <div class="item-desc">${escapeHtml(audio.description || '')}</div>
            <audio controls style="width:100%; margin-bottom: 15px; outline:none; border-radius:30px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
                <source src="${escapeHtml(audio.url)}" type="audio/mpeg">
                Trình duyệt không hỗ trợ audio.
            </audio>
            <div class="item-actions">
                <button class="btn-edit" onclick="editAudio(${audio.id}, '${escapeHtml(audio.url)}', '${escapeHtml(audio.title)}', '${escapeHtml(audio.description || '').replace(/'/g, "\\'")}')">✏️ Sửa</button>
                <button class="btn-delete" onclick="deleteAudio(${audio.id})">🗑️ Xóa</button>
            </div>
        </div>
    `).join('');
}

function editAudio(id, url, title, description) {
    document.getElementById('audioId').value = id;
    document.getElementById('audioUrl').value = url;
    document.getElementById('audioTitle').value = title;
    document.getElementById('audioDescription').value = description;
    
    document.getElementById('audioFormTitle').innerText = 'Cập Nhật Âm Thanh';
    document.getElementById('audioSubmitBtn').innerText = 'Lưu Thay Đổi';
    document.getElementById('audioCancelBtn').style.display = 'inline-block';
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function deleteAudio(id) {
    // Date.now() trả về số lớn nhưng vẫn là finite number trong JS
    if (typeof id !== 'number' || isNaN(id) || id <= 0) {
        alert('ID không hợp lệ');
        return;
    }

    if (!confirm('Xác nhận xóa âm thanh này?')) return;

    try {
        audios = audios.filter(a => a.id !== id);
        localStorage.setItem('audios', JSON.stringify(audios));
        renderAudio();
        alert('✅ Xóa âm thanh thành công!');
    } catch (error) {
        console.error('❌ Error deleting audio:', error);
        alert('❌ Lỗi: ' + error.message);
    }
}

// =============================================================================
// Contacts Management
// =============================================================================
async function loadContacts() {
    try {
        const response = await authFetch(`${API_URL}/contacts`);
        const data = await response.json();
        const list = document.getElementById('contactsList');

        if (!list) return;

        if (!data.success || !data.data || data.data.length === 0) {
            list.innerHTML = '<p style="padding:20px;color:#999;">Chưa có liên hệ nào.</p>';
            return;
        }

        list.innerHTML = data.data.map(contact => `
            <div class="item">
                <div class="item-info">
                    <h3>${escapeHtml(contact.name)}</h3>
                    <p><strong>Email:</strong> <a href="mailto:${escapeHtml(contact.email)}">${escapeHtml(contact.email)}</a></p>
                    <p><strong>Điện thoại:</strong> ${escapeHtml(contact.phone || 'N/A')}</p>
                    <p><strong>Loại:</strong> ${escapeHtml(contact.type)}</p>
                    <p><strong>Tin nhắn:</strong> ${escapeHtml(contact.message)}</p>
                    <p style="font-size:12px;color:#999;margin-top:6px;">${new Date(contact.created_at).toLocaleString('vi-VN')}</p>
                </div>
                <button class="btn-delete" onclick="deleteContactItem(${Number(contact.id)})">Xóa</button>
            </div>
        `).join('');
    } catch (error) {
        if (error.message === 'Token đã hết hạn') return;
        console.error('❌ Error loading contacts:', error);
        const list = document.getElementById('contactsList');
        if (list) {
            list.innerHTML = '<p style="color:#c00;">Lỗi tải dữ liệu. Vui lòng thử lại.</p>';
        }
    }
}

async function deleteContactItem(id) {
    if (typeof id !== 'number' || isNaN(id) || id <= 0) {
        alert('ID không hợp lệ');
        return;
    }

    if (!confirm('Xác nhận xóa liên hệ này?')) return;

    try {
        const response = await authFetch(`${API_URL}/contacts/${id}`, {
            method: 'DELETE'
        });

        const data = await response.json();

        if (data.success) {
            loadContacts();
            alert('✅ Xóa liên hệ thành công!');
        } else {
            alert('❌ Lỗi: ' + (data.error || 'Không xác định'));
        }
    } catch (error) {
        if (error.message === 'Token đã hết hạn') return;
        console.error('❌ Error deleting contact:', error);
        alert('❌ Lỗi kết nối: ' + error.message);
    }
}

// =============================================================================
// Load All Data
// =============================================================================
function loadAllData() {
    loadEvents();
    loadGallery();
    loadAudio();
    loadContacts();
}

// =============================================================================
// UI Functions
// =============================================================================
function switchTab(tab) {
    const tabElement = document.getElementById(tab);
    if (!tabElement) return;

    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

    tabElement.classList.add('active');

    // Tìm nav-item tương ứng và set active
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(n => {
        if (n.getAttribute('onclick')?.includes(tab)) {
            n.classList.add('active');
        }
    });
}

function showDashboard() {
    const loginContainer = document.getElementById('loginContainer');
    const adminDashboard = document.getElementById('adminDashboard');

    if (loginContainer) loginContainer.style.display = 'none';
    if (adminDashboard) adminDashboard.style.display = 'flex';
}

function logout() {
    localStorage.removeItem('adminToken');
    token = null;
    audios = [];

    const loginContainer = document.getElementById('loginContainer');
    const adminDashboard = document.getElementById('adminDashboard');
    const loginForm = document.getElementById('loginForm');

    if (loginContainer) loginContainer.style.display = 'flex';
    if (adminDashboard) adminDashboard.style.display = 'none';
    if (loginForm) loginForm.reset();

    console.log('✅ Logged out successfully');
}

function showMessage(elementId, message, type) {
    const el = document.getElementById(elementId);
    if (!el) return;

    el.textContent = message;
    el.className = `message ${type}`;
    el.style.display = 'block';

    setTimeout(() => {
        el.className = 'message';
        el.style.display = 'none';
    }, 5000);
}

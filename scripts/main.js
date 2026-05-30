// =============================================================================
// Chùa Chính Phước — Client Frontend (main.js)
// Fetch dữ liệu từ API thực, không dùng mock data.
// =============================================================================

const API_URL = '/api';

// ==================== Mobile Menu ====================
const hamburger = document.getElementById('hamburger');
const navMenu = document.querySelector('.nav-menu');

if (hamburger) {
    hamburger.addEventListener('click', () => {
        navMenu.classList.toggle('active');
    });

    // Close menu when clicking on a nav link
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            navMenu.classList.remove('active');
        });
    });
}

// ==================== Utilities ====================
function escapeHtml(text) {
    if (text === null || text === undefined) return '';
    const str = String(text);
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// ==================== Loading Skeleton ====================
function showLoadingSkeleton(container, count) {
    if (!container) return;
    let skeletonHtml = '';
    for (let i = 0; i < count; i++) {
        skeletonHtml += `
            <div class="skeleton-card" style="
                background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
                background-size: 200% 100%;
                animation: shimmer 1.5s infinite;
                border-radius: 12px;
                min-height: 180px;
            "></div>
        `;
    }
    container.innerHTML = skeletonHtml;

    // Inject shimmer animation nếu chưa có
    if (!document.getElementById('shimmer-style')) {
        const style = document.createElement('style');
        style.id = 'shimmer-style';
        style.textContent = `
            @keyframes shimmer {
                0% { background-position: -200% 0; }
                100% { background-position: 200% 0; }
            }
        `;
        document.head.appendChild(style);
    }
}

// ==================== Load Events from API ====================
async function loadEvents() {
    const eventsContainer = document.getElementById('events-container');
    if (!eventsContainer) return;

    showLoadingSkeleton(eventsContainer, 3);

    try {
        const response = await fetch(`${API_URL}/events`);

        if (!response.ok) {
            console.error('Failed to fetch events:', response.status, response.statusText);
            eventsContainer.innerHTML = '<p style="color:#c00; padding:20px;">Không thể tải hoạt động. Vui lòng thử lại sau.</p>';
            return;
        }

        const result = await response.json();

        if (!result.success || !result.data || result.data.length === 0) {
            eventsContainer.innerHTML = '<p style="color:#999; padding:20px;">Chưa có hoạt động nào được đăng.</p>';
            return;
        }

        eventsContainer.innerHTML = '';
        result.data.forEach(event => {
            const eventCard = document.createElement('a');
            eventCard.href = `event.html?id=${event.id}`;
            eventCard.className = 'event-card';
            eventCard.style.textDecoration = 'none';
            eventCard.style.color = 'inherit';
            eventCard.style.display = 'flex';
            eventCard.style.flexDirection = 'column';

            // Truncate description to 100 characters
            let shortDesc = event.description || '';
            if (shortDesc.length > 100) {
                shortDesc = shortDesc.substring(0, 100) + '...';
            }

            // Fallback header: image if exists, else date banner
            const headerHtml = event.image_url 
                ? `<div class="event-image-header" style="height: 200px; position: relative; border-radius: 8px 8px 0 0; overflow: hidden; background-color: #2c3e2a;">
                       <img src="${escapeHtml(event.image_url)}" alt="Event Image" style="width: 100%; height: 100%; object-fit: cover; display: block;" onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1548625361-ec85303c7348?q=80&w=600&auto=format&fit=crop';">
                       <div style="position: absolute; bottom: 10px; right: 10px; background: rgba(0,0,0,0.6); color: white; padding: 4px 10px; border-radius: 4px; font-weight: bold;">
                           ${escapeHtml(event.event_date)}
                       </div>
                   </div>`
                : `<div class="event-date">${escapeHtml(event.event_date)}</div>`;

            eventCard.innerHTML = `
                ${headerHtml}
                <div class="event-content" style="flex: 1; display: flex; flex-direction: column;">
                    <h3 class="event-title">${escapeHtml(event.title)}</h3>
                    <p class="event-description" style="flex: 1;">${escapeHtml(shortDesc)}</p>
                    <div class="event-footer">
                        <span class="event-category">${escapeHtml(event.category)}</span>
                        <span class="event-link">Xem chi tiết →</span>
                    </div>
                </div>
            `;
            eventsContainer.appendChild(eventCard);
        });
    } catch (error) {
        console.error('❌ Error loading events:', error);
        if (eventsContainer) {
            eventsContainer.innerHTML = '<p style="color:#c00; padding:20px;">Lỗi kết nối. Vui lòng thử lại.</p>';
        }
    }
}

// ==================== Load Gallery from API ====================
async function loadGallery() {
    const galleryContainer = document.getElementById('gallery-container');
    if (!galleryContainer) return;

    showLoadingSkeleton(galleryContainer, 6);

    try {
        const response = await fetch(`${API_URL}/gallery`);

        if (!response.ok) {
            console.error('Failed to fetch gallery:', response.status, response.statusText);
            galleryContainer.innerHTML = '<p style="color:#c00; padding:20px;">Không thể tải thư viện ảnh. Vui lòng thử lại sau.</p>';
            return;
        }

        const result = await response.json();

        if (!result.success || !result.data || result.data.length === 0) {
            galleryContainer.innerHTML = '<p style="color:#999; padding:20px;">Chưa có hình ảnh nào.</p>';
            return;
        }

        galleryContainer.innerHTML = '';
        result.data.forEach((item) => {
            const galleryItem = document.createElement('div');
            galleryItem.className = 'gallery-item';
            galleryItem.innerHTML = `
                <img src="${escapeHtml(item.image_url)}" alt="${escapeHtml(item.label)}" loading="lazy" onerror="this.alt='Hình ảnh không tải được'">
                <div class="gallery-overlay">
                    <div class="gallery-label">${escapeHtml(item.label)}</div>
                </div>
            `;
            galleryContainer.appendChild(galleryItem);
        });
    } catch (error) {
        console.error('❌ Error loading gallery:', error);
        if (galleryContainer) {
            galleryContainer.innerHTML = '<p style="color:#c00; padding:20px;">Lỗi kết nối. Vui lòng thử lại.</p>';
        }
    }
}

// ==================== Scroll Reveal Effects ====================
function observeElements() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    // Observe tất cả cards hiện có tại thời điểm gọi
    document.querySelectorAll('.event-card, .teaching-card, .gallery-item').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
}

// ==================== Smooth Scroll Fix ====================
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (href !== '#' && document.querySelector(href)) {
            e.preventDefault();
            document.querySelector(href).scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// ==================== Contact Form ====================
const contactForm = document.getElementById('contactForm');
const formMessage = document.getElementById('formMessage');

if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const submitBtn = contactForm.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn ? submitBtn.textContent : '';

        const formData = {
            name: document.getElementById('name').value.trim(),
            email: document.getElementById('email').value.trim(),
            phone: document.getElementById('phone').value?.trim() || null,
            message: document.getElementById('message').value.trim(),
            type: document.getElementById('type').value
        };

        if (!formData.name || !formData.email || !formData.message) {
            if (formMessage) {
                formMessage.className = 'form-message error';
                formMessage.textContent = 'Vui lòng điền đầy đủ thông tin.';
                formMessage.style.display = 'block';
            }
            return;
        }

        // Disable button khi đang gửi
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Đang gửi...';
        }

        try {
            const response = await fetch(`${API_URL}/contact`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (response.ok && data.success) {
                formMessage.className = 'form-message success';
                formMessage.textContent = data.message || 'Cảm ơn bạn đã liên hệ. Chúng tôi sẽ phản hồi sớm!';
                formMessage.style.display = 'block';
                contactForm.reset();
                setTimeout(() => {
                    formMessage.style.display = 'none';
                }, 5000);
            } else {
                formMessage.className = 'form-message error';
                formMessage.textContent = data.error || 'Có lỗi xảy ra. Vui lòng thử lại.';
                formMessage.style.display = 'block';
            }
        } catch (error) {
            console.error('❌ Error submitting form:', error);
            formMessage.className = 'form-message error';
            formMessage.textContent = 'Không thể gửi tin nhắn. Vui lòng thử lại sau.';
            formMessage.style.display = 'block';
        } finally {
            // Re-enable button
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = originalBtnText;
            }
        }
    });
}

// ==================== Initialize ====================
document.addEventListener('DOMContentLoaded', async () => {
    // Fetch data song song
    await Promise.all([loadEvents(), loadGallery()]);

    // Gọi observeElements SAU KHI data đã render xong
    observeElements();
});

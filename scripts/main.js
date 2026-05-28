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

// ==================== Sample Data ====================
const eventsData = [
    {
        date: '15/08',
        title: 'Lễ Vu Lan',
        description: 'Tưởng nhớ những Phật tử đã từng mở chia, truyền kinh pháp cho chúng ta.',
        category: 'Lễ hội'
    },
    {
        date: '01/01',
        title: 'Tết Nguyên Đán',
        description: 'Kỷ niệm năm mới với các buổi tụng kinh và bài giảng Phật pháp đầu năm.',
        category: 'Tết'
    },
    {
        date: '08/04',
        title: 'Lễ Phật Đản',
        description: 'Kỷ niệm ngày Đức Phật Thích Ca Mâu Ni ra đời - ngày thiêng liêng của Phật giáo.',
        category: 'Lễ hội'
    },
    {
        date: '15/10',
        title: 'Thiền định chiều',
        description: 'Buổi thiền định lâu dài từ chiều đến tối, giúp tu tập sâu sắc hơn.',
        category: 'Tu tập'
    },
    {
        date: '28/03',
        title: 'Giảng kinh Pháp Hoa',
        description: 'Giáo sư giảng giải kinh Pháp Hoa - một trong những kinh điển quan trọng nhất của Phật giáo.',
        category: 'Giảng dạy'
    },
    {
        date: '09/06',
        title: 'Lễ Tam Bảo',
        description: 'Cúng dường Tam Bảo (Phật, Pháp, Tăng) trong không khí trang nghiêm và trang trọng.',
        category: 'Lễ tụng'
    }
];

const galleryData = [
    {
        src: 'assets/gallery-1.jpg',
        label: 'Sảnh chính'
    },
    {
        src: 'assets/gallery-2.jpg',
        label: 'Tượng Phật'
    },
    {
        src: 'assets/gallery-3.jpg',
        label: 'Khu vườn'
    },
    {
        src: 'assets/gallery-4.jpg',
        label: 'Cộng đồng tu tập'
    },
    {
        src: 'assets/gallery-5.jpg',
        label: 'Tiền sảnh'
    },
    {
        src: 'assets/gallery-6.jpg',
        label: 'Lễ hội'
    }
];

// ==================== Load Events ====================
function loadEvents() {
    const eventsContainer = document.getElementById('events-container');

    eventsData.forEach(event => {
        const eventCard = document.createElement('div');
        eventCard.className = 'event-card';
        eventCard.innerHTML = `
            <div class="event-date">${event.date}</div>
            <div class="event-content">
                <h3 class="event-title">${event.title}</h3>
                <p class="event-description">${event.description}</p>
                <div class="event-footer">
                    <span class="event-category">${event.category}</span>
                    <a href="#" class="event-link">Xem chi tiết →</a>
                </div>
            </div>
        `;
        eventsContainer.appendChild(eventCard);
    });
}

// ==================== Load Gallery ====================
function loadGallery() {
    const galleryContainer = document.getElementById('gallery-container');

    galleryData.forEach((item, index) => {
        const galleryItem = document.createElement('div');
        galleryItem.className = 'gallery-item';
        galleryItem.innerHTML = `
            <img src="${item.src}" alt="${item.label}" loading="lazy">
            <div class="gallery-overlay">
                <div class="gallery-label">${item.label}</div>
            </div>
        `;
        galleryContainer.appendChild(galleryItem);
    });
}

// ==================== Scroll Effects ====================
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

    // Observe all cards
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
        }
    });
});

// ==================== Initialize ====================
document.addEventListener('DOMContentLoaded', () => {
    loadEvents();
    loadGallery();
    observeElements();
});

// ==================== Contact Form ====================
const contactForm = document.getElementById('contactForm');
const formMessage = document.getElementById('formMessage');

if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = {
            name: document.getElementById('name').value,
            email: document.getElementById('email').value,
            phone: document.getElementById('phone').value || null,
            message: document.getElementById('message').value,
            type: document.getElementById('type').value
        };

        try {
            const response = await fetch('/api/contact', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (response.ok) {
                formMessage.className = 'form-message success';
                formMessage.textContent = data.message || 'Cảm ơn bạn đã liên hệ. Chúng tôi sẽ phản hồi sớm!';
                contactForm.reset();
                setTimeout(() => {
                    formMessage.style.display = 'none';
                }, 5000);
            } else {
                formMessage.className = 'form-message error';
                formMessage.textContent = data.error || 'Có lỗi xảy ra. Vui lòng thử lại.';
            }
        } catch (error) {
            console.error('Error submitting form:', error);
            formMessage.className = 'form-message error';
            formMessage.textContent = 'Không thể gửi tin nhắn. Vui lòng thử lại sau.';
        }
    });
}
const API_URL = '/api';
        let token = localStorage.getItem('adminToken');
        let audios = [];

        // Check if already logged in
        if (token) {
            showDashboard();
            loadAllData();
        }

        // Login form handler
        document.getElementById('loginForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;

            try {
                const response = await fetch(`${API_URL}/auth/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password })
                });

                if (!response.ok) {
                    throw new Error(`Server bảo trì hoặc phản hồi lỗi mã lỗi: ${response.status}`);
                }

                const data = await response.json();

                if (data.success) {
                    token = data.token;
                    localStorage.setItem('adminToken', token);
                    showDashboard();
                    loadAllData();
                } else {
                    showMessage('loginMessage', data.error, 'error');
                }
            } catch (error) {
                showMessage('loginMessage', 'Lỗi kết nối: ' + error.message, 'error');
            }
        });

        // Event form handler
        document.getElementById('eventForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const date = document.getElementById('eventDate').value;
            const title = document.getElementById('eventTitle').value;
            const description = document.getElementById('eventDescription').value;
            const category = document.getElementById('eventCategory').value;

            try {
                const response = await fetch(`${API_URL}/events`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ date, title, description, category })
                });

                const data = await response.json();

                if (data.success) {
                    document.getElementById('eventForm').reset();
                    loadEvents();
                    alert('Thêm hoạt động thành công!');
                } else {
                    alert('Lỗi: ' + data.error);
                }
            } catch (error) {
                alert('Lỗi kết nối: ' + error.message);
            }
        });

        // Gallery form handler
        document.getElementById('galleryForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const imageUrl = document.getElementById('imageUrl').value;
            const label = document.getElementById('imageLabel').value;
            const order = parseInt(document.getElementById('imageOrder').value);

            try {
                const response = await fetch(`${API_URL}/gallery`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ imageUrl, label, order })
                });

                const data = await response.json();

                if (data.success) {
                    document.getElementById('galleryForm').reset();
                    loadGallery();
                    alert('Thêm hình ảnh thành công!');
                } else {
                    alert('Lỗi: ' + data.error);
                }
            } catch (error) {
                alert('Lỗi kết nối: ' + error.message);
            }
        });

        // Audio form handler
        document.getElementById('audioForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const url = document.getElementById('audioUrl').value;
            const title = document.getElementById('audioTitle').value;
            const description = document.getElementById('audioDescription').value;

            audios.push({ id: Date.now(), url, title, description });
            localStorage.setItem('audios', JSON.stringify(audios));
            document.getElementById('audioForm').reset();
            loadAudio();
            alert('Thêm âm thanh thành công!');
        });

        async function loadEvents() {
            try {
                const response = await fetch(`${API_URL}/events`);
                const data = await response.json();
                const list = document.getElementById('eventsList');

                list.innerHTML = data.data.map(event => `
                    <div class="item">
                        <div class="item-info">
                            <h3>${event.title}</h3>
                            <p><strong>Ngày:</strong> ${event.date} | <strong>Danh mục:</strong> ${event.category}</p>
                            <p>${event.description}</p>
                        </div>
                    </div>
                `).join('');
            } catch (error) {
                console.error('Error loading events:', error);
            }
        }

        async function loadGallery() {
            try {
                const response = await fetch(`${API_URL}/gallery`);
                const data = await response.json();
                const list = document.getElementById('galleryList');

                list.innerHTML = data.data.map(item => `
                    <div class="item">
                        <div class="item-info">
                            <h3>${item.label}</h3>
                            <p><img src="${item.image_url}" style="max-width: 150px; border-radius: 5px; margin-top: 10px;" alt="${item.label}"></p>
                        </div>
                    </div>
                `).join('');
            } catch (error) {
                console.error('Error loading gallery:', error);
            }
        }

        function loadAudio() {
            audios = JSON.parse(localStorage.getItem('audios') || '[]');
            const list = document.getElementById('audioList');

            list.innerHTML = audios.map(audio => `
                <div class="item">
                    <div class="item-info">
                        <h3>${audio.title}</h3>
                        <p>${audio.description}</p>
                        <audio controls style="width: 100%; margin-top: 10px;">
                            <source src="${audio.url}" type="audio/mpeg">
                        </audio>
                    </div>
                    <button class="btn-delete" onclick="deleteAudio(${audio.id})">Xóa</button>
                </div>
            `).join('');
        }

        async function loadContacts() {
            try {
                const response = await fetch(`${API_URL}/contacts`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await response.json();
                const list = document.getElementById('contactsList');

                list.innerHTML = data.data.map(contact => `
                    <div class="item">
                        <div class="item-info">
                            <h3>${contact.name}</h3>
                            <p><strong>Email:</strong> ${contact.email}</p>
                            <p><strong>Điện thoại:</strong> ${contact.phone || 'N/A'}</p>
                            <p><strong>Loại:</strong> ${contact.type}</p>
                            <p><strong>Tin nhắn:</strong> ${contact.message}</p>
                            <p style="font-size: 12px; color: #999;">${new Date(contact.created_at).toLocaleString('vi-VN')}</p>
                        </div>
                    </div>
                `).join('');
            } catch (error) {
                console.error('Error loading contacts:', error);
            }
        }

        function loadAllData() {
            loadEvents();
            loadGallery();
            loadAudio();
            loadContacts();
        }

        function switchTab(tab) {
            // Hide all sections
            document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
            document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

            // Show selected section
            document.getElementById(tab).classList.add('active');
            event.target.classList.add('active');
        }

        function showDashboard() {
            document.getElementById('loginContainer').style.display = 'none';
            document.getElementById('adminDashboard').style.display = 'flex';
        }

        function logout() {
            localStorage.removeItem('adminToken');
            token = null;
            document.getElementById('loginContainer').style.display = 'flex';
            document.getElementById('adminDashboard').style.display = 'none';
            document.getElementById('loginForm').reset();
        }

        function showMessage(elementId, message, type) {
            const el = document.getElementById(elementId);
            el.textContent = message;
            el.className = `message ${type}`;
            setTimeout(() => {
                el.className = 'message';
            }, 5000);
        }

        function deleteAudio(id) {
            if (confirm('Xác nhận xóa âm thanh này?')) {
                audios = audios.filter(a => a.id !== id);
                localStorage.setItem('audios', JSON.stringify(audios));
                loadAudio();
            }
        }
# Chùa Chính Phước - Temple Website

A modern, responsive website for Chùa Chính Phước built with **Zen Modern** design philosophy. Combines traditional Vietnamese temple aesthetics with contemporary minimalist design.

## 🎨 Design Philosophy

- **Style**: Zen Modern (Thiền định hiện đại)
- **Color Palette**:
  - Background: Off-white (#F9F9F7)
  - Primary: Deep Forest Green (#2C3E30)
  - Accent: Antique Gold (#C5A059)
- **Typography**:
  - Titles: Merriweather (serif)
  - Body: Inter (sans-serif)

## 📁 Project Structure

```
pagoda-website/
├── index.html                 # Main HTML file
├── styles/
│   └── main.css              # All styling (responsive)
├── scripts/
│   └── main.js               # Frontend interactivity
├── src/
│   ├── server.ts             # Express server
│   └── database.ts           # Database operations
├── public/                    # Static assets (images, etc)
│   └── assets/
│       ├── hero-temple.jpg
│       ├── temple-about.jpg
│       └── gallery-*.jpg
├── package.json              # Dependencies
├── tsconfig.json            # TypeScript config
├── .env.example             # Environment variables template
└── README.md                # This file
```

## ✨ Features

- ✅ **Responsive Design** - Mobile-first approach (hamburger menu on mobile)
- ✅ **Fast Loading** - Optimized images, lazy loading
- ✅ **Events Management** - Dynamic event cards with categories
- ✅ **Gallery** - Masonry layout for temple images
- ✅ **Backend API** - Express.js with MySQL database
- ✅ **Database** - MySQL for storing events, gallery, and contacts
- ✅ **Type Safety** - Full TypeScript support
- ✅ **Accessibility** - Semantic HTML, proper contrast ratios

## 🚀 Getting Started

### Prerequisites

- Node.js (v14+)
- npm or yarn
- MySQL Server (v5.7+)

### Installation

1. **Clone or setup the project**
   ```bash
   cd pagoda-website
   npm install
   ```

2. **Configure Database**
   - Copy `.env.example` to `.env`
   - Update database credentials:
   ```bash
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_password
   DB_NAME=pagoda_website
   ```

3. **Create MySQL Database**
   ```sql
   CREATE DATABASE pagoda_website CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```

4. **Build TypeScript**
   ```bash
   npm run build
   ```

5. **Start the server**
   ```bash
   npm run dev        # Development with ts-node
   npm start          # Production
   ```

6. **Access the website**
   - Frontend: `http://localhost:3001`
   - API: `http://localhost:3001/api`

## 📡 API Endpoints

### Events
- `GET /api/events` - Get all events
- `POST /api/events` - Create new event

### Gallery
- `GET /api/gallery` - Get all gallery items

### Health Check
- `GET /health` - Server status

## 📊 Database Schema

Tables are auto-created on first run: events, gallery, contacts

## 🎯 Sections

### A. Header (Sticky Navigation)
- Logo on left
- Menu items: Home, About, Events, Teachings, Gallery, Contact
- Responsive hamburger menu for mobile

### B. Hero Section
- Full-screen background image (temple at dawn/dusk)
- Centered heading with tagline
- Call-to-action buttons

### C. About Section
- Image + text layout with statistics

### D. Events Section
- Card-based layout with date badges

### E. Teachings Section
- Three teaching cards with icons

### F. Gallery Section
- Masonry grid layout with lazy loading

### G. Footer
- Contact information, links, social media

## 🛠️ Development

```bash
npm run dev      # Development mode
npm run build    # Build TypeScript
npm start        # Production
```

## 📱 Responsive Breakpoints

- Mobile: < 480px
- Tablet: 480px - 768px  
- Desktop: > 768px

---

**Built with ❤️ for Chùa Chính Phước - Nơi hội tụ bình an**

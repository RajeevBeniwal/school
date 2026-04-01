# Govt. Girls High School Kagdana — Website

A fully static school website for **Govt. Girls High School Kagdana, Sirsa, Haryana**.  
No server required — works on **GitHub Pages**, Netlify, or any static host.

## 🚀 Deploying to GitHub Pages

1. Create a free GitHub account at [github.com](https://github.com)
2. Create a new repository (e.g. `gghs-kagdana`)
3. Upload all files from this folder to the repository
4. Go to **Settings → Pages → Source → Deploy from branch → main**
5. Your website will be live at: `https://your-username.github.io/gghs-kagdana/`

## 📄 Pages

| File | Description |
|------|-------------|
| `index.html` | Home page with hero, notices, activities |
| `about.html` | School overview, vision, facilities |
| `teachers.html` | Faculty profiles |
| `activities.html` | Activities & notices |
| `gallery.html` | 📸 **NEW** — Photo gallery with lightbox |
| `results.html` | Student results search |
| `admin.html` | Admin panel (password protected) |
| `style.css` | Shared stylesheet (Maroon & Gold theme) |
| `common.js` | Shared JS utilities |

## 🔐 Admin Panel

Access at: `yoursite.com/admin.html` (link in top-right corner of all pages)

**Default login:** `admin` / `admin123`

### Admin Features
- 📋 **Results** — Upload from Excel (.xlsx). Template includes: Roll No, SRN, Name, Class, Section, Father Name, **Mother Name**, **DOB**, Year, Subject marks
- 🖼️ **Gallery** — Add/Edit/Delete photos with title, category, description
- 📸 **Activities** — Post notices and school events
- 👩‍🏫 **Teachers** — Manage faculty profiles with photos
- 🖼️ **Logo** — Upload school logo image
- 📞 **Contact** — Update address, phone, email, hours
- 🔒 **Password** — Change admin password
- 💾 **Data** — Export/Import all data as JSON backup

## 💡 How Data Works

All data is stored in the browser's **localStorage** — no server or database needed.  
This means:
- Data is stored on the device where admin logs in
- To share data across devices, use **Export All Data (JSON)** and **Import Data (JSON)**
- Suitable for single-admin use on a dedicated school computer

## 📱 Features

- ✅ Mobile responsive
- ✅ Sticky navigation
- ✅ News ticker
- ✅ Hero image slider
- ✅ Gallery with lightbox viewer
- ✅ Excel result upload with preview
- ✅ Search results by Roll No, Name, or SRN
- ✅ Class-wise result table
- ✅ Print result cards
- ✅ Dynamic school logo
- ✅ Editable contact details

# 🎓 StudyArchive — Next-Gen Campus Study Resource & AI Learning Platform

[![Angular 21](https://img.shields.io/badge/Angular-21.0-dd0031?style=for-the-badge&logo=angular)](https://angular.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178c6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Firebase](https://img.shields.io/badge/Firebase-Firestore%20%26%20Hosting-ffca28?style=for-the-badge&logo=firebase)](https://firebase.google.com/)
[![Sass](https://img.shields.io/badge/SCSS-Design%20System-cc6699?style=for-the-badge&logo=sass)](https://sass-lang.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](LICENSE)

> **StudyArchive** is an intelligent, high-performance web platform built for university students to share lecture notes, exam cheat sheets, and academic resources. Features live real-time Firebase sync, an AI Study Companion trained dynamically on uploaded resources, gamified Scholar XP & Streak tracking, and 100% viewport responsiveness across mobile (Android/iOS), tablet, and desktop devices.

🌐 **Live Application**: [https://study-archive-moodle.web.app](https://study-archive-moodle.web.app)  
📦 **GitHub Repository**: [M20A03/StudyArchive](https://github.com/M20A03/StudyArchive.git)

---

## ✨ Key Features

- 🤖 **Dynamically Trained AI Study Companion**:
  - Embedded floating AI assistant widget with real-time Retrieval-Augmented Generation (RAG).
  - Automatically indexes uploaded PDF notes, formula sheets, and lecture slides.
  - Summarizes complex topics, generates exam flashcards, and crafts 3-day revision plans.

- 🏆 **Gamified Scholar XP & Streak System**:
  - Earn **+150 XP** for every uploaded study resource, **+5 XP** per resource download, and **+40 XP** per rated review.
  - Live progress bar tracks user level advancement from Level 1 Scholar upwards.
  - Active study streak counter (`🔥 Streak`) calculated dynamically from student activity.

- ⚡ **Real-Time Data Sync & Cloud Storage**:
  - Powered by **Google Cloud Firestore** with instant offline-first `localStorage` resilience.
  - Privacy level toggling (`Public` vs. `Private`) with real-time reactive updates across devices.

- 📄 **Document Quick Preview Sheet**:
  - Modal drawer preview allowing students to view resource metadata, tags, abstract synopsis, ratings, and download counts before downloading.

- 🌗 **Adaptive Dual Design System (Dark & Light Mode)**:
  - Curated, high-contrast dark glassmorphism and crisp, ergonomic light mode themes.
  - 100% WCAG AAA accessible text legibility across stat cards, activity feeds, and resource tables.

- 📱 **Mobile & Android Pixel Responsive Optimization**:
  - Touch-friendly hamburger navigation menu with translucent backdrop tap-to-dismiss functionality.
  - Compact responsive search box and touch-optimized buttons for seamless Android & iOS mobile usage.

---

## 🛠️ Technology Stack

- **Frontend**: Angular 21 (Standalone Components, Signals, RxJS Reactive Streams)
- **Styling**: SCSS (Custom Design System, Glassmorphism, Responsive Grid & Flex Layouts)
- **Authentication**: Firebase Authentication (Google Single Sign-In & Email Credentials)
- **Database & Sync**: Cloud Firestore (`onSnapshot` real-time listeners)
- **Deployment**: Firebase Hosting (Global CDN Edge Deployment)
- **Runtime**: Node.js v22.x

---

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed on your local system:
- **Node.js**: `v20.19.0+` or `v22.12.0+`
- **npm**: `v10.x+`
- **Angular CLI**: `v19.x` or `v21.x` (`npm install -g @angular/cli`)

### Installation & Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/M20A03/StudyArchive.git
   cd StudyArchive/campus-resource-platform
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the local development server**:
   ```bash
   ng serve
   # or
   npm run start
   ```
   Navigate to `http://localhost:4200/` in your browser.

4. **Build for Production**:
   ```bash
   ng build
   ```
   The production bundle will be generated in `dist/campus-resource-platform/browser`.

---

## ☁️ Deployment

### Deploying to Firebase Hosting

To deploy updates to Firebase Hosting, run:
```bash
# Build the Angular application
npm run build

# Deploy to Firebase
firebase deploy
```

---

## 📜 License

Distributed under the MIT License. See `LICENSE` for more information.

---

<p center="text-align">Made with ❤️ for students worldwide by <strong>M20A03</strong></p>

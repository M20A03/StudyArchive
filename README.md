<div align="center">

# 📚 StudyArchive

**Academic Resource Hub & Course Management Platform**

[![Firebase](https://img.shields.io/badge/Firebase-Hosted-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](https://straw-hats-7795d.web.app)
[![Angular](https://img.shields.io/badge/Angular-21-DD0031?style=for-the-badge&logo=angular&logoColor=white)](https://angular.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)

[**🔗 Live Demo**](https://straw-hats-7795d.web.app) · [**📖 Documentation**](#features) · [**🚀 Get Started**](#getting-started)

</div>

---

## ✨ Features

- 🔐 **Google Account Verification** — One-click Google Sign-In via Firebase Auth (optional, platform browsable as guest)
- 📤 **Resource Upload & Management** — Upload, organize, and share academic notes, assignments, and study materials
- 🔍 **Advanced Search** — Filter resources by subject, semester, branch, and privacy
- 🌗 **Dark & Light Mode** — Premium professional themes with smooth transitions
- 📊 **Dashboard Analytics** — Track uploads, downloads, ratings, and recent activity
- ⚡ **High Performance** — GPU-accelerated animations, zero-lag scrolling, and optimized rendering
- 📱 **Responsive Design** — Seamless experience across desktop, tablet, and mobile

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Angular 21, TypeScript 5.9, SCSS |
| **Backend** | Firebase (Firestore, Authentication, Hosting) |
| **Auth** | Firebase Auth with Google Provider |
| **Hosting** | Firebase Hosting |
| **Design** | Custom SCSS Design System, Inter Font |

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v20+)
- [Angular CLI](https://angular.dev/) (`npm i -g @angular/cli`)
- [Firebase CLI](https://firebase.google.com/docs/cli) (`npm i -g firebase-tools`)

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/StudyArchive.git
cd StudyArchive/campus-resource-platform

# Install dependencies
npm install

# Start development server
npm start
```

Visit `http://localhost:4200` to view the app.

### Firebase Setup

1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable **Authentication** → **Google Sign-In** provider
3. Enable **Cloud Firestore** database
4. Update `src/environments/environment.ts` with your Firebase config
5. Deploy: `firebase deploy`

---

## 📁 Project Structure

```
campus-resource-platform/
├── src/
│   ├── app/
│   │   ├── components/
│   │   │   ├── dashboard/         # Main dashboard & overview
│   │   │   ├── layout/            # Navbar & Sidebar
│   │   │   ├── login/             # Google Sign-In page
│   │   │   ├── signup/            # Google Account verification
│   │   │   ├── search/            # Resource search & filters
│   │   │   ├── resources/         # Upload & My Resources
│   │   │   └── shared/            # Reusable components
│   │   ├── services/              # UserService, ResourceService
│   │   ├── guards/                # Auth guard (optional)
│   │   └── app.routes.ts          # Application routing
│   ├── environments/              # Firebase configuration
│   ├── styles/                    # SCSS design system & variables
│   └── styles.scss                # Global styles
├── firebase.json                  # Firebase hosting config
└── package.json
```

---

## 🎨 Design System

- **Dark Mode**: Obsidian slate background (`#0b0f19`), elevated cards (`#1e293b`), indigo accents (`#6366f1`)
- **Light Mode**: Clean white canvas (`#f8fafc`), crisp cards (`#ffffff`), slate text hierarchy
- **Typography**: Inter (400–800 weights)
- **Animations**: GPU-accelerated transforms and opacity transitions
- **Icons**: Inline SVGs for zero-dependency rendering

---

## 👥 Team

Built by **Straw Hats** 🏴‍☠️

---

## 📄 License

This project is for educational purposes.

# Yimaru Academy LMS Admin Dashboard

A modern, feature-rich admin dashboard for managing Yimaru Academy's educational platform. Built with React, TypeScript, and Tailwind CSS.

## 🚀 Tech Stack

- **Framework**: React 19.2.0
- **Language**: TypeScript 5.9.3
- **Build Tool**: Vite 7.2.4
- **Routing**: React Router DOM 7.10.1
- **Styling**: Tailwind CSS 3.4.17
- **UI Components**: Radix UI
- **Icons**: Lucide React
- **State Management**: Zustand 5.0.9
- **Charts**: Recharts 3.6.0
- **Font**: Inter (via @fontsource/inter)

## 📁 Project Structure

```
src/
├── app/                    # Application configuration
│   └── AppRoutes.tsx       # Main routing configuration
├── assets/                 # Static assets (images, etc.)
├── components/            # Reusable components
│   ├── brand/             # Branding components
│   │   └── BrandLogo.tsx  # Yimaru Academy logo component
│   ├── dashboard/         # Dashboard-specific components
│   ├── sidebar/           # Sidebar navigation components
│   ├── topbar/            # Top navigation bar components
│   └── ui/                # Base UI components
│       ├── avatar.tsx
│       ├── badge.tsx
│       ├── button.tsx
│       ├── card.tsx
│       ├── dialog.tsx
│       ├── dropdown-menu.tsx
│       ├── file-upload.tsx
│       ├── input.tsx
│       ├── select.tsx
│       ├── separator.tsx
│       ├── stepper.tsx
│       ├── table.tsx
│       └── textarea.tsx
├── layouts/               # Layout components
│   └── AppLayout.tsx      # Main application layout
├── lib/                   # Utility functions
│   └── utils.ts           # Helper functions (cn, etc.)
├── pages/                 # Page components
│   ├── auth/              # Authentication pages
│   │   ├── LoginPage.tsx
│   │   ├── ForgotPasswordPage.tsx
│   │   └── VerificationPage.tsx
│   ├── analytics/         # Analytics pages
│   ├── content-management/ # Content management pages
│   │   ├── ContentManagementLayout.tsx
│   │   ├── ContentOverviewPage.tsx
│   │   ├── CoursesPage.tsx
│   │   ├── AddVideoPage.tsx
│   │   ├── SpeakingPage.tsx
│   │   ├── AddPracticePage.tsx
│   │   ├── PracticeDetailsPage.tsx
│   │   ├── PracticeMembersPage.tsx
│   │   ├── QuestionsPage.tsx
│   │   └── AddQuestionPage.tsx
│   ├── notifications/     # Notifications pages
│   ├── role-management/   # Role management pages
│   ├── user-log/          # User log pages
│   ├── user-management/   # User management pages
│   ├── DashboardPage.tsx
│   ├── NotFoundPage.tsx
│   └── PlaceholderPage.tsx
├── stores/                # State management (Zustand stores)
├── App.tsx                # Root App component
├── App.css                # App-specific styles
├── index.css              # Global styles and Tailwind directives
└── main.tsx               # Application entry point
```

## 🎨 UI Components

### Base Components (`src/components/ui/`)

- **Avatar** - User avatar display with fallback
- **Badge** - Status badges and labels
- **Button** - Primary, secondary, outline, ghost variants
- **Card** - Container component with header, content, footer
- **Dialog** - Modal dialogs using Radix UI
- **Dropdown Menu** - Context menus and dropdowns
- **File Upload** - File upload component
- **Input** - Text input fields
- **Select** - Dropdown select component
- **Separator** - Visual divider
- **Stepper** - Multi-step form indicator
- **Table** - Data table with header, body, footer
- **Textarea** - Multi-line text input

### Brand Components

- **BrandLogo** - Yimaru Academy logo with icon and text

### Layout Components

- **AppLayout** - Main application layout with sidebar and topbar
- **ContentManagementLayout** - Tabbed layout for content management
- **UserManagementLayout** - Layout for user management section
- **RoleManagementLayout** - Layout for role management section

## 📄 Pages & Features

### Authentication (`/auth`)

- **Login Page** (`/login`)
  - Email and password authentication
  - Password visibility toggle
  - Forgot password link
  
- **Forgot Password Page** (`/forgot-password`)
  - Email input for password reset
  - Back to login navigation
  
- **Verification Page** (`/verification`)
  - 5-digit code input with auto-focus
  - Resend timer countdown
  - Paste support for verification codes

### Dashboard (`/dashboard`)

- Main dashboard with overview statistics and charts

### Content Management (`/content`)

- **Overview** - Content management dashboard with quick access cards
- **Courses** (`/content/courses`)
  - Course listing and management
  - Add new video content
  
- **Speaking** (`/content/speaking`)
  - Speaking practice management
  - Add new practice sessions
  
- **Practice** (`/content/practices`)
  - Practice details and management
  - Practice members management
  
- **Questions** (`/content/questions`)
  - Question bank management
  - Search and filter functionality
  - Filter by type (Multiple Choice, Short Answer, True/False)
  - Filter by category and difficulty
  - Add/Edit questions with dynamic form behavior
  - Support for multiple question types

### User Management (`/users`)

- User dashboard
- User listing
- User registration
- User groups
- User detail pages

### Role Management (`/roles`)

- Role listing
- Add/Edit roles

### Notifications (`/notifications`)

- Notification management and settings

### User Log (`/user-log`)

- User activity logging and tracking

### Analytics (`/analytics`)

- Analytics dashboard with charts and metrics

## 🎯 Key Features

- **Responsive Design** - Mobile-first approach with Tailwind CSS
- **Type Safety** - Full TypeScript implementation
- **Modern UI** - Clean, professional design with consistent branding
- **Component Library** - Reusable UI components built on Radix UI
- **Routing** - Client-side routing with React Router
- **State Management** - Zustand for global state
- **Form Handling** - Dynamic forms with validation
- **Search & Filter** - Advanced filtering capabilities
- **Question Management** - Comprehensive question bank with multiple question types

## 🛠️ Getting Started 

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn


### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd Yimaru-Admin
```

2. Install dependencies
```bash
npm install
```

3. Start development server
```bash
npm run dev
```

4. Build for production
```bash
npm run build
```

5. Preview production build
```bash
npm run preview
```

## 📜 Available Scripts

- `npm run dev` - Start development server with hot module replacement
- `npm run build` - Build for production (TypeScript compilation + Vite build)
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build locally

## 🎨 Design System

### Colors

- **Brand Colors**: Purple palette (brand-50 to brand-600)
- **Gold**: Accent colors (gold-100 to gold-600)
- **Mint**: Secondary accent (mint-100 to mint-500)
- **Gray Scale**: Neutral colors (grayScale-50 to grayScale-600)

### Typography

- **Font Family**: Inter (via @fontsource/inter)
- **Font Weights**: 100, 200, 300, 400, 500, 600, 700, 800, 900

### Border Radius

- **Large**: 14px (--radius)
- **Medium**: calc(var(--radius) - 2px)
- **Small**: calc(var(--radius) - 4px)

## 🔐 Authentication Flow

1. User visits `/login`
2. Enters credentials
3. If forgot password, redirected to `/forgot-password`
4. After password reset, verification code sent
5. User enters code on `/verification` page
6. Upon successful verification, redirected to dashboard

## 📝 Question Types

The Questions management system supports three question types:

1. **Multiple Choice** - Multiple options with one correct answer
2. **Short Answer** - Text-based answer with validation
3. **True/False** - Binary choice questions

Each question type has dynamic form behavior that adapts based on selection.

## 🚧 Development Notes

- The project uses ESLint for code quality
- TypeScript strict mode is enabled
- Components follow a consistent naming convention
- UI components are built with accessibility in mind (Radix UI)
- State management uses Zustand for simplicity

## 📦 Dependencies

### Core Dependencies

- React & React DOM - UI framework
- React Router DOM - Client-side routing
- TypeScript - Type safety
- Tailwind CSS - Utility-first CSS framework
- Vite - Build tool and dev server

### UI Libraries

- Radix UI - Accessible component primitives
- Lucide React - Icon library
- Recharts - Chart library

### Utilities

- clsx & tailwind-merge - Class name utilities
- class-variance-authority - Component variant management
- Zustand - State management

## 📄 License

This project is private and proprietary.

---

Developed by Yaltopia Tech

Built with ❤️ for Yimaru Academy

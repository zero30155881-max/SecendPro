# GitHub Links - Link Sharing Platform

A modern, fast, and professional link sharing platform built with Next.js 15, TypeScript, Tailwind CSS, and PostgreSQL. Share and discover amazing resources with the community.

## 🚀 Features

- **Modern UI/UX**: Clean, responsive design with dark mode support
- **Fast Performance**: Built with Next.js 15 and optimized for speed
- **Database Integration**: PostgreSQL with Prisma ORM for reliable data storage
- **Link Management**: Create, edit, and delete shared links
- **Search & Filter**: Find links by title, description, or tags
- **Click Tracking**: Monitor link popularity and engagement
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile
- **SEO Optimized**: Built-in SEO with proper meta tags and Open Graph support

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React, TypeScript
- **Styling**: Tailwind CSS, Custom CSS
- **Database**: PostgreSQL
- **ORM**: Prisma
- **UI Components**: Custom components with Radix UI
- **Icons**: Lucide React
- **State Management**: React hooks

## 📋 Prerequisites

- Node.js 18+ and npm
- PostgreSQL database
- Git

## 🚀 Getting Started

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd github-link-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up the database**
   - Create a PostgreSQL database
   - Update the `.env` file with your database URL:
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/github_link_app?schema=public"
   ```

4. **Run database migrations**
   ```bash
   npx prisma generate
   npx prisma migrate dev
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
src/
├── app/                    # Next.js app router
│   ├── api/               # API routes
│   │   ├── links/         # Link management endpoints
│   │   └── [slug]/        # Individual link endpoints
│   ├── create/            # Create link page
│   ├── explore/           # Explore links page
│   ├── link/[slug]/       # Individual link detail page
│   ├── login/             # Login page
│   ├── register/          # Registration page
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/ui/         # Reusable UI components
├── lib/                   # Utility functions
│   ├── db.ts             # Database connection
│   └── utils.ts          # Helper functions
└── generated/prisma/      # Generated Prisma client
```

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npx prisma studio` - Open Prisma Studio
- `npx prisma generate` - Regenerate Prisma client
- `npx prisma migrate dev` - Create and apply migrations

## 🎨 Key Features

### Link Management
- Create new links with title, description, URL, and tags
- Edit existing links
- Delete unwanted links
- Track click counts

### Search & Discovery
- Search by title, description, or tags
- Filter by multiple tags
- Sort by date or popularity
- Pagination support

### User Experience
- Responsive design for all devices
- Dark mode support
- Smooth animations
- Loading states and error handling
- Professional UI with modern design

## 🔒 Authentication

The app includes login and registration pages, but authentication is currently simulated. In a production environment, you would:

1. Set up NextAuth.js or similar authentication
2. Connect to your preferred auth provider
3. Implement proper session management
4. Add user-specific features

## 🚀 Deployment

### Environment Variables for Production
```env
DATABASE_URL="your-production-database-url"
NEXTAUTH_SECRET="your-auth-secret"
NEXTAUTH_URL="https://yourdomain.com"
JWT_SECRET="your-jwt-secret"
```

### Deploy to Vercel
1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on push

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)
- Database powered by [PostgreSQL](https://postgresql.org/)
- Icons from [Lucide React](https://lucide.dev/)
- UI components inspired by [shadcn/ui](https://ui.shadcn.com/)
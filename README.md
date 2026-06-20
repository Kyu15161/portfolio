# Kinetic Photography Portfolio & CMS

A high-end, production-ready full-stack photography portfolio built using **Next.js App Router**, **TypeScript**, **Prisma ORM**, and **Tailwind CSS**. 

This application preserves 100% of the premium front-end physics and WebGL animations from the original design while adding a secure, password-protected CMS dashboard to manage the portfolio dynamically.

## Key Features

- **Dynamic WebGL Background**: Simplex 2D noise shader background that smoothly morphs its color uniform to match the dominant color of the currently hovered photo.
- **Magnetic Cursor**: Custom inertial cursor that follows the mouse with physics interpolation, expanding and displaying custom labels (`VIEW`) when hovering gallery images.
- **Asymmetrical Gallery Grid**: Asynchronous grid placement with technical EXIF detail overlays and velocity-based image scroll-tilt skewing.
- **Automated Media Pipeline**:
  - **Local Mode (Default)**: Automatically compresses images to WebP format (80% quality) and extracts the dominant color using `sharp` pixel analysis.
  - **Cloudinary Mode**: If Cloudinary credentials are set in the `.env` file, uploads images to Cloudinary with `f_auto,q_auto` parameters and fetches the dominant color directly from Cloudinary.
- **Brutalist CMS Portal (`/admin`)**:
  - Password protected (cookie session signature).
  - Batch upload selector with custom EXIF meta configuration.
  - Drag-and-drop row reordering using HTML5 drag-and-drop APIs with database transaction batch updates.
  - Inline editing of site settings (About text, contact, social navigation links).

---

## Getting Started

### 1. Installation
Install project dependencies:
```bash
npm install
```

### 2. Environment Configuration
Copy the environment template file:
```bash
cp .env.example .env
```
Open `.env` and configure:
- `JWT_SECRET`: Secret key for signing admin sessions.
- `ADMIN_PASSWORD_HASH`: SHA-256 hash of your admin password (default is `8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918` which corresponds to `"admin"`).
- *Optional* Cloudinary parameters (`CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`). Leave empty to fall back to local optimized storage.

### 3. Database Initialization
Initialize the local SQLite database (`dev.db`):
```bash
npx prisma db push
```

### 4. Running Locally
Run the development server:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the portfolio. Visit [http://localhost:3000/admin](http://localhost:3000/admin) to log into the CMS dashboard.

---

## Production Deployment (Vercel)

1. Connect your repository to Vercel.
2. In the Vercel dashboard, add your environment variables (`JWT_SECRET`, `ADMIN_PASSWORD_HASH`, and Cloudinary variables if using Cloudinary).
3. Connect a PostgreSQL database (e.g., Vercel Postgres, Neon) and configure the `DATABASE_URL` env variable. The application automatically detects PostgreSQL connection strings and instantiates the PG adapter on startup.
4. Deploy the project. The build command automatically triggers Prisma client compilation.

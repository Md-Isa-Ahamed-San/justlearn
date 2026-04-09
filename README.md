<div align="center">
  <a href="https,"_blank">
    <img src="https://i.ibb.co/G9pD3r2/logo.png" alt="logo" width="100" />
  </a>
  <h1 align="center">JustLearn LMS</h1>
  <p align="center">
    A feature-rich Learning Management System (LMS) built with modern web technologies to provide a seamless and engaging learning experience.
  </p>
  <p align="center">
    <a href="#✨-features">Features</a> •
    <a href="#-tech-stack">Tech Stack</a> •
    <a href="#-folder-structure">Folder Structure</a> •
    <a href="#-getting-started">Getting Started</a> •
    <a href="#-usage">Usage</a> •
    <a href="#-contributing">Contributing</a> •
    <a href="#-license">License</a> •
    <a href="#-contact">Contact</a>
  </p>
</div>

---

## ✨ Features

- **Role-Based User Management:**
  - **Student:** Enroll in courses, track progress, take quizzes, and earn certificates.
  - **Instructor:** Create and manage courses, design quizzes, and monitor student performance.
  - **Admin:** Oversee the platform, manage users, and view analytics.

- **Comprehensive Course Creation:**
  - **Structured Curriculum:** Organize courses into weeks and lessons for a clear learning path.
  - **Rich Content:** Upload video lessons, add downloadable attachments, and embed external resources.

- **Advanced Quiz Engine:**
  - **Versatile Questions:** Support for Multiple Choice, Short Answer, and Long Answer questions.
  - **AI-Powered Generation:** Automatically generate quizzes based on course content to save time.
  - **Anti-Cheating:** Enforce fullscreen mode, block copy/paste, and detect tab switching to ensure academic integrity.

- **Student Progress Tracking:**
  - **Visual Dashboards:** Monitor course completion rates, lesson progress, and quiz scores at a glance.
  - **Detailed Analytics:** Gain insights into student engagement and performance.

- **Interactive Live Sessions:**
  - **Real-Time Engagement:** Schedule and host live video sessions with students for interactive learning.
  - **Seamless Integration:** Integrated video conferencing for a smooth user experience.

- **Secure Authentication:**
  - **Flexible Login:** Support for traditional email/password login alongside OAuth providers like Google and GitHub.
  - **Protected Routes:** Secure access to different parts of the application based on user roles.

- **Certificate Generation:**
  - **Automated Issuance:** Automatically generate and issue certificates to students upon successful course completion.
  - **Customizable Templates:** Design custom certificate templates to match your branding.

## 🛠️ Tech Stack

- **Framework:** [Next.js](https://nextjs.org/) - For building modern, server-rendered React applications.
- **Database:** [MongoDB](https://www.mongodb.com/) with [Prisma](https://www.prisma.io/) - For a flexible, scalable database with a powerful ORM.
- **Authentication:** [NextAuth.js](https://next-auth.js.org/) - For simplified and secure authentication.
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) with [Shadcn UI](https://ui.shadcn.com/) - For a utility-first CSS framework and beautifully designed components.
- **Payments:** [Stripe](https://stripe.com/) - For secure and reliable payment processing.
- **Form Management:** [React Hook Form](https://react-hook-form.com/) & [Zod](https://zod.dev/) - For efficient and type-safe form validation.
- **AI:** [Groq SDK](https://wow.groq.com/) - For integrating high-performance AI-powered features.

## 📁 Folder Structure

```
.
├── app/                  # Next.js 13+ App Router, contains all routes and pages
├── assets/               # Static assets like images, fonts, etc.
├── components/           # Reusable React components
├── database-dummy-data/  # Dummy data for seeding the database
├── hooks/                # Custom React hooks
├── lib/                  # Utility functions and libraries
├── prisma/               # Prisma schema and database configuration
├── provider/             # React context providers
├── public/               # Publicly accessible files
├── queries/              # Database query functions
├── service/              # Business logic and services
├── utils/                # General utility functions
├── .gitignore
├── README.md
├── auth.config.js
├── auth.js
├── components.json
├── eslint.config.mjs
├── jsconfig.json
├── middleware.js
├── next.config.mjs
├── package-lock.json
├── package.json
├── postcss.config.js
└── tailwind.config.js
```

## 🚀 Getting Started

Follow these instructions to set up and run the project on your local machine.

### Prerequisites

- **Node.js:** v18 or later recommended.
- **npm** or **yarn**.
- **MongoDB:** A running instance (local or cloud).

### Installation

1.  **Clone the Repository:**
    ```bash
    git clone https://github.com/your-username/justlearn-lms.git
    cd justlearn-lms
    ```

2.  **Install Dependencies:**
    ```bash
    npm install
    ```

3.  **Set Up Environment Variables:**
    Create a `.env` file in the root of the project. You can use `.env.example` as a template.

    ```env
    # Database
    DATABASE_URL="your_mongodb_connection_string"

    # Authentication (NextAuth.js)
    AUTH_SECRET="your_auth_secret"
    AUTH_URL="http://localhost:3000"
    # Add Google/GitHub provider credentials if you use them
    # GOOGLE_CLIENT_ID="..."
    # GOOGLE_CLIENT_SECRET="..."

    # Stripe
    STRIPE_API_KEY="your_stripe_api_key"
    STRIPE_WEBHOOK_SECRET="your_stripe_webhook_secret"
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="your_stripe_publishable_key"
    
    # Groq AI
    GROQ_API_KEY="your_groq_api_key"
    ```

4.  **Push the Database Schema:**
    Sync your Prisma schema with your MongoDB database.
    ```bash
    npx prisma db push
    ```

## 🖥️ Usage

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the result.

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1.  **Fork the repository.**
2.  **Create a new branch** (`git checkout -b feature/your-feature-name`).
3.  **Make your changes.**
4.  **Commit your changes** (`git commit -m 'Add some feature'`).
5.  **Push to the branch** (`git push origin feature/your-feature-name`).
6.  **Open a pull request.**

Please make sure to **update tests** as appropriate and **run the linter** (`npm run lint`) before submitting a pull request.

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Contact

- **Your Name:** [Your Name](https://your-website.com)
- **Project Link:** [https://github.com/your-username/justlearn-lms](https://github.com/your-username/justlearn-lms)

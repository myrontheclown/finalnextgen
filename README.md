# ⚡ TestGen AI — Neural API Testing Platform

**TestGen AI** is a premium, Silicon Valley-grade API testing platform that leverages AI to automate testing, diagnostics, and structural inference for any API. It is designed to work with **zero configuration**, turning unstructured data into functional test suites within seconds.

![TestGen AI Dashboard](C:/Users/NIHAR/.gemini/antigravity/brain/9d77963d-1ced-4420-86b8-a1ecf1652039/testgen_ui_demo_1776791148893.webp)

## 🚀 Key Features

- **Neural Input Synthesis**: Provide any raw JSON or CSV URL. Our AI intelligently infers the API endpoints and synthesizes test cases, even from unstructured data.
- **Dynamic Targeting**: Hot-swap between Local, Staging, and Production environments with a single click in the Targeting Console.
- **Identity Vault**: Secure management of Bearer Tokens and API Keys with active status resolution.
- **AI-Powered Diagnostics**: Get human-readable explanations for API failures and performance bottlenecks.
- **Visual Analytics**: Glassmorphic dashboard with live termin-style execution logs and neural topology maps.

## 🛠️ Technology Stack

- **Frontend**: React, Vite, Tailwind CSS (v4), Framer Motion, Lucide Icons.
- **Backend**: Node.js, Express, Axios.
- **AI Engine**: OpenAI GPT-4o-mini API.
- **Parsing**: Swagger Parser, XLSX.

## 🏁 Quick Start

### 1. Clone & Install
```bash
git clone <your-repo-url>
cd technix-hackathon
npm install
cd backend && npm install
cd ../frontend && npm install
```

### 2. Configure Environment
Create a `.env` file in the `backend/` directory:
```env
OPENAI_API_KEY=your_key_here
PORT=5000
```

### 3. Run Platform
Return to the root directory and run:
```bash
npm run dev
```
The platform will be available at `http://localhost:5173`.

---

Built with ❤️ for the Technix Hackathon.

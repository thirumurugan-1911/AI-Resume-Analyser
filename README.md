# 🤖 ResumeAI — AI Resume Analyzer & ATS Score Checker

ResumeAI is a modern, user-friendly web application designed to help job seekers evaluate and improve their resumes. The platform provides an ATS-style resume score, job-role matching insights, keyword analysis, section-level feedback, and personalized recommendations through an interactive dashboard.

The project is built using **React and Vite** with a responsive dashboard interface and data visualizations powered by **Recharts**.

> **Project Status:** Frontend prototype / MVP.
> The current version uses mock AI-generated analysis data for demonstration. A production version can be connected to a backend AI service for real resume parsing and analysis.

---

## ✨ Features

### 📄 Resume Upload

* Upload resumes in **PDF** or **DOCX** format
* Drag-and-drop file upload
* Maximum supported file size: **5 MB**
* File type and size validation

### 🎯 Target Job Analysis

Users can specify:

* Target job role
* Optional job description

This allows the application to present job-specific resume insights and keyword matching information.

### 📊 ATS Score Analysis

The dashboard provides an ATS-style score out of 100 along with individual evaluations for:

* Formatting
* Keywords
* Skills
* Experience
* Education
* Resume structure
* Readability
* Achievements
* Keyword match

### 🔑 Keyword Analysis

ResumeAI displays:

* Keywords found in the resume
* Important missing keywords
* Job-description keyword matching
* Suggestions for improving ATS compatibility

### 📑 Section-Level Analysis

Individual resume sections are evaluated separately, including:

* Contact Information
* Professional Summary
* Technical Skills
* Experience
* Projects
* Education

Each section can include a score, detected issues, status, and improvement suggestions.

### 💡 Personalized Recommendations

The application categorizes resume improvements based on priority:

* 🔴 High Priority
* 🟡 Medium Priority
* 🟢 Low Priority

Recommendations may include adding measurable achievements, improving job-specific keywords, restructuring skills, tailoring the professional summary, and improving formatting.

### 🤖 AI Resume Assistant

An integrated assistant interface allows users to request help with common resume improvements such as:

* Improving a professional summary
* Finding stronger action verbs
* Writing achievement-oriented bullet points
* Improving project descriptions
* Identifying useful skills

### 📈 Resume Reports

Users can view their analyzed resumes along with:

* ATS score
* Job-match percentage
* Target role
* Analysis history
* Detailed reports

### 🔨 Resume Builder

The application also contains a simple resume builder with a live preview.

Users can enter information such as:

* Name and job title
* Email and phone
* Location
* LinkedIn
* GitHub
* Professional summary
* Skills

### 🌙 User Interface

* Clean dashboard design
* Collapsible sidebar
* Responsive layout
* Light/Dark mode toggle
* Interactive charts and progress indicators
* Simple navigation designed for beginner-friendly usage

---

## 🛠️ Tech Stack

| Technology | Purpose                         |
| ---------- | -------------------------------- |
| React      | Frontend user interface         |
| Vite       | Development and build tool      |
| JavaScript | Application logic               |
| Recharts   | Charts and score visualizations |
| CSS        | Styling and responsive UI       |
| Oxlint     | Code linting                    |

---

## 📂 Project Structure

```text
resume-analyzer/
│
├── public/
│   ├── favicon.svg
│   └── icons.svg
│
├── src/
│   ├── assets/
│   │   ├── hero.png
│   │   ├── react.svg
│   │   └── vite.svg
│   │
│   ├── AIResumeAnalyzer.jsx
│   ├── App.jsx
│   ├── index.css
│   └── main.jsx
│
├── .gitignore
├── .oxlintrc.json
├── index.html
├── package.json
├── package-lock.json
├── vite.config.js
└── README.md
```

---

## ⚙️ Installation

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR-USERNAME/resume-analyzer.git
```

### 2. Navigate to the Project

```bash
cd resume-analyzer
```

### 3. Install Dependencies

Make sure **Node.js and npm** are installed.

```bash
npm install
```

### 4. Start the Development Server

```bash
npm run dev
```

Vite will display a local development URL, typically:

```text
http://localhost:5173
```

Open it in your browser to use the application.

---

## 📦 Available Scripts

### Start Development Server

```bash
npm run dev
```

### Create Production Build

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

### Run Linter

```bash
npm run lint
```

---

## 🔄 Application Workflow

```text
Upload Resume
      ↓
Enter Target Job Role
      ↓
Add Job Description (Optional)
      ↓
Resume Analysis
      ↓
ATS Score Calculation
      ↓
Keyword & Skill Evaluation
      ↓
Section-Level Analysis
      ↓
Improvement Recommendations
      ↓
Detailed Resume Report
```

---

## 🧠 Current AI Implementation

The current project is designed as a frontend prototype.

The `callClaudeAPI()` function currently generates **mock analysis data** to demonstrate the complete user experience without requiring an external API or backend server.

This includes simulated:

* ATS scores
* Keyword matching
* Resume strengths
* Resume weaknesses
* Skill evaluations
* Section scores
* Improvement recommendations

Therefore, the current scores should **not be considered real ATS evaluations**.

For production use, the mock function should be replaced with a secure backend API that:

1. Extracts text from uploaded PDF/DOCX resumes.
2. Processes the target job description.
3. Sends the extracted information to an AI/LLM service.
4. Calculates structured ATS metrics.
5. Returns validated JSON results to the React frontend.

> API keys should never be stored directly in frontend React code.

---

## 🚀 Future Enhancements

Planned improvements for ResumeAI include:

* Real PDF and DOCX text extraction
* Backend API integration
* LLM-powered resume analysis
* More accurate ATS scoring algorithms
* Resume-to-job semantic matching
* User authentication
* Persistent analysis history
* Database integration
* Exportable PDF analysis reports
* Functional resume PDF generation
* Multiple ATS-friendly resume templates
* AI-powered resume rewriting
* Resume comparison
* Job-specific skill-gap analysis
* Cloud deployment

---

## 🎯 Project Objective

The main objective of ResumeAI is to make resume evaluation easier for students, freshers, and job seekers.

Instead of only providing a score, the platform aims to explain:

* What is good about the resume?
* What needs improvement?
* Which keywords are missing?
* How well does the resume match a target job?
* How can each section be improved?

This helps users make informed changes before submitting their resumes to employers.

---

## 🔐 Privacy

Resume privacy is an important consideration for the project.

The current frontend prototype does not implement permanent cloud resume storage. A production deployment should use secure server-side processing, encryption, access controls, appropriate retention policies, and transparent privacy practices when handling uploaded resumes.

---

## ⚠️ Disclaimer

ResumeAI provides resume improvement guidance and ATS-style scoring. Actual Applicant Tracking Systems use different algorithms, parsing techniques, ranking criteria, and employer-specific configurations.

Therefore, a score generated by this application should be treated as **guidance rather than a guarantee of selection or ATS performance**.

---

## 🤝 Contributing

Contributions, suggestions, and improvements are welcome.

To contribute:

```bash
# Fork the repository

# Create a new branch
git checkout -b feature/new-feature

# Commit your changes
git commit -m "Add new feature"

# Push the branch
git push origin feature/new-feature
```

Then create a Pull Request.

---

## 👨‍💻 Author

**Thirumurugan B**

B.E. Computer Science and Engineering
**Specialization: Artificial Intelligence & Machine Learning**

KPR Institute of Engineering and Technology

### Connect

* GitHub: Add your GitHub profile URL
* LinkedIn: Add your LinkedIn profile URL

---

## ⭐ Support

If you find this project useful, consider giving the repository a **⭐ star** on GitHub.

It helps support the project and encourages further development.

---

<p align="center">
  <b>Built with React ⚛️ | Vite ⚡ | AI 🤖</b>
</p>

<p align="center">
  Helping job seekers build stronger, ATS-friendly resumes.
</p>

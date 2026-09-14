import { useState, useRef, useCallback, useEffect } from "react";
import { RadialBarChart, RadialBar, PolarAngleAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from "recharts";

// ─── Constants ────────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: "🏠" },
  { id: "analyze", label: "Analyze Resume", icon: "📄" },
  { id: "report", label: "My Reports", icon: "📊" },
  { id: "builder", label: "Resume Builder", icon: "🔨" },
  { id: "settings", label: "Settings", icon: "⚙️" },
];

const ANALYSIS_STEPS = [
  "Reading resume content",
  "Extracting skills & keywords",
  "Checking ATS compatibility",
  "Matching job description",
  "Generating recommendations",
];

const SAMPLE_HISTORY = [
  { id: 1, name: "Software_Engineer_Resume.pdf", role: "Senior Software Engineer", ats: 82, match: 76, date: "2 days ago", status: "Analyzed" },
  { id: 2, name: "ML_Resume_v2.pdf", role: "Machine Learning Engineer", ats: 71, match: 68, date: "1 week ago", status: "Analyzed" },
  { id: 3, name: "DataScientist_CV.docx", role: "Data Scientist", ats: 88, match: 84, date: "2 weeks ago", status: "Analyzed" },
];

const SCORE_COLOR = (s) => s >= 90 ? "#22c55e" : s >= 80 ? "#3b82f6" : s >= 70 ? "#f59e0b" : s >= 60 ? "#f97316" : "#ef4444";
const SCORE_LABEL = (s) => s >= 90 ? "Excellent" : s >= 80 ? "Very Good" : s >= 70 ? "Good" : s >= 60 ? "Needs Improvement" : "Poor";

// ─── API Call (MOCKED FOR LOCAL PREVIEW) ────────────────────────────────────────
// The original version of this function called api.anthropic.com directly from
// the browser. That only works inside Claude.ai's artifact sandbox (which injects
// a key server-side) — in a normal app it fails with a CORS / missing-key error.
// This mock returns realistic fake data after a short delay so you can preview
// the whole UI without a backend. To wire up real analysis, replace this with a
// fetch() to your own backend endpoint that calls the Anthropic API server-side.
async function callClaudeAPI(systemPrompt, userMessage, onStream) {
  await new Promise((r) => setTimeout(r, 500)); // simulate network latency

  const roleMatch = userMessage.match(/role of "([^"]+)"/);
  const role = roleMatch ? roleMatch[1] : "the target role";
  const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

  const mock = {
    scores: {
      overall: rand(68, 90),
      formatting: rand(70, 95),
      keywords: rand(55, 85),
      skills: rand(65, 92),
      experience: rand(70, 90),
      education: rand(75, 95),
      structure: rand(70, 92),
      readability: rand(72, 95),
      achievements: rand(55, 85),
      keywordMatch: rand(50, 80),
    },
    summary: `This resume shows solid experience relevant to ${role}, but could better highlight quantified achievements and align keywords with the job description.`,
    strengths: [
      "Clear, chronological work history with consistent formatting",
      "Relevant technical skills listed prominently",
      "Education section is complete and well-formatted",
      "Contact information is easy to find",
      "Concise bullet points in most sections",
    ],
    weaknesses: [
      "Few bullet points include measurable results or metrics",
      "Some keywords from the job description are missing",
      "Professional summary is generic and could be tailored",
      "Skills section mixes soft and technical skills without grouping",
      "Some sections run longer than needed for an ATS scan",
    ],
    foundKeywords: ["Python", "SQL", "Communication", "Leadership", "Agile", "Git", "APIs", "Testing"],
    missingKeywords: ["Docker", "Kubernetes", "CI/CD", "Cloud (AWS/GCP)", "Stakeholder management", "Data pipelines"],
    skills: [
      { name: "Technical Skills", level: rand(60, 90) },
      { name: "Communication", level: rand(65, 92) },
      { name: "Leadership", level: rand(50, 85) },
      { name: "Problem Solving", level: rand(70, 95) },
      { name: "Domain Knowledge", level: rand(55, 88) },
    ],
    sections: [
      { name: "Contact Info", score: rand(85, 100), status: "Excellent", issues: [], suggestions: "No changes needed." },
      { name: "Professional Summary", score: rand(55, 80), status: "Needs Work", issues: ["Too generic, doesn't mention target role"], suggestions: "Tailor the summary to mention the specific role and top 2-3 achievements." },
      { name: "Technical Skills", score: rand(65, 90), status: "Good", issues: ["Missing a few in-demand keywords"], suggestions: "Add keywords from the job description that you genuinely have experience with." },
      { name: "Experience", score: rand(65, 88), status: "Good", issues: ["Bullet points lack quantified results"], suggestions: "Add numbers (%, $, time saved) to at least half of your bullet points." },
      { name: "Projects", score: rand(50, 85), status: "Needs Work", issues: ["Limited detail on technical contribution"], suggestions: "Describe your specific role and the tech stack used in each project." },
      { name: "Education", score: rand(80, 100), status: "Excellent", issues: [], suggestions: "Well formatted, no changes needed." },
    ],
    improvements: [
      { priority: "High", title: "Add measurable outcomes", desc: "Rewrite key bullet points to include specific metrics (e.g. 'reduced load time by 40%')." },
      { priority: "High", title: "Incorporate missing keywords", desc: "Naturally weave in relevant keywords from the job description to improve ATS keyword matching." },
      { priority: "Medium", title: "Tailor the summary", desc: "Customize your professional summary for each application to mention the target role directly." },
      { priority: "Medium", title: "Group your skills", desc: "Separate technical skills from soft skills into distinct, scannable groups." },
      { priority: "Low", title: "Tighten formatting", desc: "Trim overly long sections so the resume stays within 1-2 pages for easy scanning." },
    ],
  };

  const fullText = JSON.stringify(mock);
  if (onStream) onStream(fullText);
  return fullText;
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function ScoreCircle({ score, size = 140 }) {
  const data = [{ value: score, fill: SCORE_COLOR(score) }];
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart cx="50%" cy="50%" innerRadius="65%" outerRadius="90%" data={data} startAngle={90} endAngle={-270}>
          <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
          <RadialBar dataKey="value" cornerRadius={8} background={{ fill: "#e2e8f0" }} />
        </RadialBarChart>
      </ResponsiveContainer>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: size > 120 ? 28 : 20, fontWeight: 700, color: SCORE_COLOR(score) }}>{score}</span>
        <span style={{ fontSize: 11, color: "#64748b" }}>/ 100</span>
      </div>
    </div>
  );
}

function ProgressBar({ value, color = "#6366f1", height = 8 }) {
  return (
    <div style={{ background: "#e2e8f0", borderRadius: 99, height, overflow: "hidden" }}>
      <div style={{ width: `${value}%`, height: "100%", background: color, borderRadius: 99, transition: "width 0.8s ease" }} />
    </div>
  );
}

function Tag({ children, type = "found" }) {
  const colors = {
    found: { bg: "#dcfce7", text: "#166534" },
    missing: { bg: "#fee2e2", text: "#991b1b" },
    partial: { bg: "#fef9c3", text: "#854d0e" },
  };
  const c = colors[type];
  return (
    <span style={{ background: c.bg, color: c.text, fontSize: 12, fontWeight: 600, padding: "3px 10px", borderRadius: 99, display: "inline-block" }}>
      {children}
    </span>
  );
}

function Card({ children, style = {} }) {
  return (
    <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, padding: "20px 24px", ...style }}>
      {children}
    </div>
  );
}

function StatCard({ label, value, sub, color = "#6366f1" }) {
  return (
    <Card style={{ textAlign: "center", flex: 1, minWidth: 140 }}>
      <div style={{ fontSize: 28, fontWeight: 800, color }}>{value}</div>
      <div style={{ fontSize: 13, fontWeight: 600, color: "#1e293b", marginTop: 4 }}>{label}</div>
      {sub && <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>{sub}</div>}
    </Card>
  );
}

// ─── Dashboard Home ────────────────────────────────────────────────────────────
function DashboardHome({ onNavigate, reports }) {
  const latest = reports[0];
  const avgAts = reports.length ? Math.round(reports.reduce((s, r) => s + r.ats, 0) / reports.length) : null;
  const strengthLabel = latest ? SCORE_LABEL(latest.ats) : "—";

  return (
    <div>
      {/* Hero */}
      <Card style={{ background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)", border: "none", color: "#fff", marginBottom: 24 }}>
        <div style={{ maxWidth: 560 }}>
          <div style={{ fontSize: 13, fontWeight: 600, opacity: 0.8, marginBottom: 8, letterSpacing: "0.05em" }}>AI-POWERED CAREER TOOL</div>
          <h2 style={{ fontSize: 26, fontWeight: 800, margin: "0 0 10px", lineHeight: 1.3 }}>Improve Your Resume with AI</h2>
          <p style={{ margin: "0 0 20px", opacity: 0.85, lineHeight: 1.6, fontSize: 14 }}>
            Upload your resume, check ATS compatibility, discover missing skills, and get personalized recommendations to improve your chances of getting shortlisted.
          </p>
          <button onClick={() => onNavigate("analyze")} style={{ background: "#fff", color: "#6366f1", border: "none", borderRadius: 10, padding: "12px 24px", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
            Analyze My Resume →
          </button>
        </div>
      </Card>

      {/* Stats */}
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 28 }}>
        <StatCard label="ATS Score" value={latest ? latest.ats : "—"} sub={latest ? "Last analysis" : "No analyses yet"} color="#6366f1" />
        <StatCard label="Resume Strength" value={strengthLabel} sub={avgAts ? `Avg score ${avgAts}` : "Analyze a resume to start"} color="#22c55e" />
        <StatCard label="Job Match" value={latest ? `${latest.match}%` : "—"} sub={latest ? latest.role : "No analyses yet"} color="#3b82f6" />
        <StatCard label="Total Analyses" value={reports.length} sub={reports.length ? "Resumes analyzed" : "Analyze your first resume"} color="#f59e0b" />
      </div>

      {/* Recent */}
      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#1e293b" }}>Recent Analyses</h3>
          {reports.length > 0 && (
            <button onClick={() => onNavigate("report")} style={{ background: "transparent", border: "1px solid #e2e8f0", borderRadius: 8, padding: "6px 14px", fontSize: 12, fontWeight: 600, color: "#6366f1", cursor: "pointer" }}>View all</button>
          )}
        </div>
        {reports.length === 0 ? (
          <div style={{ textAlign: "center", padding: "32px 16px" }}>
            <div style={{ fontSize: 40, marginBottom: 10 }}>📭</div>
            <div style={{ fontSize: 14, color: "#64748b", marginBottom: 16 }}>No resumes analyzed yet.</div>
            <button onClick={() => onNavigate("analyze")} style={{ background: "#6366f1", color: "#fff", border: "none", borderRadius: 8, padding: "10px 20px", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>Analyze Your First Resume</button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {reports.slice(0, 3).map(r => (
              <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 16, padding: "14px 16px", background: "#f8fafc", borderRadius: 10 }}>
                <div style={{ fontSize: 28 }}>📄</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, color: "#1e293b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.name}</div>
                  <div style={{ fontSize: 12, color: "#64748b" }}>{r.role} · {r.date}</div>
                </div>
                <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 18, fontWeight: 800, color: SCORE_COLOR(r.ats) }}>{r.ats}</div>
                    <div style={{ fontSize: 10, color: "#94a3b8" }}>ATS</div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 18, fontWeight: 800, color: "#3b82f6" }}>{r.match}%</div>
                    <div style={{ fontSize: 10, color: "#94a3b8" }}>Match</div>
                  </div>
                  <button onClick={() => onNavigate("report")} style={{ background: "#6366f1", color: "#fff", border: "none", borderRadius: 8, padding: "6px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>View</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

// ─── Upload Page ───────────────────────────────────────────────────────────────
function UploadPage({ onAnalyze }) {
  const [file, setFile] = useState(null);
  const [role, setRole] = useState("");
  const [jd, setJD] = useState("");
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef();

  const handleFile = (f) => {
    if (!f) return;
    if (!["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"].includes(f.type) && !f.name.endsWith(".pdf") && !f.name.endsWith(".docx")) {
      setError("Only PDF and DOCX files are supported.");
      return;
    }
    if (f.size > 5 * 1024 * 1024) { setError("File must be under 5 MB."); return; }
    setError("");
    setFile(f);
  };

  const onDrop = useCallback((e) => {
    e.preventDefault(); setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  }, []);

  const canAnalyze = file && role.trim();

  return (
    <div style={{ maxWidth: 680, margin: "0 auto" }}>
      <h2 style={{ fontSize: 22, fontWeight: 800, color: "#1e293b", marginBottom: 6 }}>Analyze Your Resume</h2>
      <p style={{ color: "#64748b", marginBottom: 28, fontSize: 14 }}>Upload your latest resume for an AI-powered ATS analysis and personalized improvement suggestions.</p>

      {/* Upload zone */}
      <Card style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#1e293b", marginBottom: 14 }}>Upload Resume</div>
        {!file ? (
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            onClick={() => inputRef.current.click()}
            style={{
              border: `2px dashed ${dragging ? "#6366f1" : "#cbd5e1"}`,
              borderRadius: 12, padding: "40px 24px", textAlign: "center",
              background: dragging ? "#f0f0ff" : "#f8fafc", cursor: "pointer",
              transition: "all 0.2s"
            }}
          >
            <div style={{ fontSize: 40, marginBottom: 10 }}>☁️</div>
            <div style={{ fontWeight: 700, color: "#1e293b", marginBottom: 4 }}>Drag & Drop Resume</div>
            <div style={{ color: "#94a3b8", fontSize: 13, marginBottom: 14 }}>or</div>
            <div style={{ background: "#6366f1", color: "#fff", borderRadius: 8, padding: "10px 22px", fontWeight: 600, fontSize: 13, display: "inline-block" }}>Browse Files</div>
            <div style={{ marginTop: 14, fontSize: 12, color: "#94a3b8" }}>PDF, DOCX · max 5 MB</div>
            <input ref={inputRef} type="file" accept=".pdf,.docx" style={{ display: "none" }} onChange={e => handleFile(e.target.files[0])} />
          </div>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "16px", background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 10 }}>
            <span style={{ fontSize: 32 }}>✅</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, color: "#166534", fontSize: 14 }}>{file.name}</div>
              <div style={{ fontSize: 12, color: "#4ade80" }}>{(file.size / 1024).toFixed(0)} KB · Ready to analyze</div>
            </div>
            <button onClick={() => setFile(null)} style={{ background: "none", border: "none", color: "#dc2626", cursor: "pointer", fontSize: 20 }}>✕</button>
          </div>
        )}
        {error && <div style={{ color: "#dc2626", fontSize: 13, marginTop: 10 }}>⚠️ {error}</div>}
      </Card>

      {/* Role */}
      <Card style={{ marginBottom: 20 }}>
        <label style={{ fontSize: 14, fontWeight: 700, color: "#1e293b", display: "block", marginBottom: 10 }}>Target Job Role *</label>
        <input
          value={role} onChange={e => setRole(e.target.value)}
          placeholder="e.g. Machine Learning Engineer"
          style={{ width: "100%", padding: "12px 14px", border: "1px solid #e2e8f0", borderRadius: 10, fontSize: 14, outline: "none", boxSizing: "border-box" }}
        />
      </Card>

      {/* JD */}
      <Card style={{ marginBottom: 28 }}>
        <label style={{ fontSize: 14, fontWeight: 700, color: "#1e293b", display: "block", marginBottom: 10 }}>Job Description <span style={{ fontWeight: 400, color: "#94a3b8" }}>(optional but recommended)</span></label>
        <textarea
          value={jd} onChange={e => setJD(e.target.value)}
          placeholder="Paste the job description here to compare your resume against specific requirements..."
          rows={7}
          style={{ width: "100%", padding: "12px 14px", border: "1px solid #e2e8f0", borderRadius: 10, fontSize: 14, outline: "none", resize: "vertical", fontFamily: "inherit", boxSizing: "border-box" }}
        />
      </Card>

      <div style={{ display: "flex", gap: 12 }}>
        <button
          onClick={() => canAnalyze && onAnalyze({ file, role, jd })}
          disabled={!canAnalyze}
          style={{
            background: canAnalyze ? "#6366f1" : "#e2e8f0", color: canAnalyze ? "#fff" : "#94a3b8",
            border: "none", borderRadius: 10, padding: "14px 32px", fontWeight: 700, fontSize: 15,
            cursor: canAnalyze ? "pointer" : "not-allowed", transition: "all 0.2s"
          }}
        >
          Analyze Resume →
        </button>
        <button onClick={() => { setFile(null); setRole(""); setJD(""); setError(""); }}
          style={{ background: "transparent", border: "1px solid #e2e8f0", borderRadius: 10, padding: "14px 24px", fontWeight: 600, fontSize: 14, color: "#64748b", cursor: "pointer" }}>
          Clear
        </button>
      </div>
    </div>
  );
}

// ─── Progress Screen ───────────────────────────────────────────────────────────
function AnalysisProgress({ step }) {
  return (
    <div style={{ maxWidth: 480, margin: "60px auto", textAlign: "center" }}>
      <div style={{ fontSize: 56, marginBottom: 20 }}>🤖</div>
      <h3 style={{ fontSize: 20, fontWeight: 800, color: "#1e293b", marginBottom: 6 }}>Analyzing your resume...</h3>
      <p style={{ color: "#64748b", marginBottom: 36, fontSize: 14 }}>Our AI is working hard to give you the best insights.</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 12, textAlign: "left" }}>
        {ANALYSIS_STEPS.map((s, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 18px", background: i < step ? "#f0fdf4" : i === step ? "#f0f0ff" : "#f8fafc", borderRadius: 10, border: `1px solid ${i < step ? "#86efac" : i === step ? "#c4b5fd" : "#e2e8f0"}` }}>
            <div style={{ width: 28, height: 28, borderRadius: "50%", background: i < step ? "#22c55e" : i === step ? "#6366f1" : "#e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, color: i <= step ? "#fff" : "#94a3b8", flexShrink: 0 }}>
              {i < step ? "✓" : i === step ? "⟳" : i + 1}
            </div>
            <span style={{ fontSize: 14, fontWeight: 600, color: i < step ? "#166534" : i === step ? "#4338ca" : "#94a3b8" }}>{s}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Analysis Results ──────────────────────────────────────────────────────────
function ResultsPage({ analysis, fileName, role }) {
  const [activeTab, setActiveTab] = useState("overview");
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "keywords", label: "Keywords" },
    { id: "sections", label: "Sections" },
    { id: "improvements", label: "Improvements" },
    { id: "ai-assistant", label: "AI Assistant" },
  ];

  const scores = analysis?.scores || {};
  const atsScore = scores.overall || 75;
  const breakdowns = [
    { label: "Formatting", score: scores.formatting || 88, icon: "📐" },
    { label: "Keywords", score: scores.keywords || 72, icon: "🔑" },
    { label: "Skills Match", score: scores.skills || 80, icon: "⚡" },
    { label: "Experience", score: scores.experience || 76, icon: "💼" },
    { label: "Education", score: scores.education || 95, icon: "🎓" },
    { label: "Structure", score: scores.structure || 85, icon: "🏗️" },
    { label: "Readability", score: scores.readability || 82, icon: "📖" },
    { label: "Achievements", score: scores.achievements || 65, icon: "🏆" },
  ];

  const handleAIAssist = async () => {
    if (!aiPrompt.trim()) return;
    setAiLoading(true); setAiResponse("");
    try {
      await callClaudeAPI(
        `You are an expert resume coach. Help the user improve their resume for a ${role} position. Be specific, actionable, and concise. Format your response clearly.`,
        aiPrompt,
        (text) => setAiResponse(text)
      );
    } catch { setAiResponse("An error occurred. Please try again."); }
    setAiLoading(false);
  };

  const BarData = breakdowns.map(b => ({ name: b.label, score: b.score }));

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: "#1e293b", margin: "0 0 4px" }}>Resume Analysis Report</h2>
          <div style={{ fontSize: 13, color: "#64748b" }}>📄 {fileName} &nbsp;·&nbsp; 🎯 {role}</div>
        </div>
        <button style={{ background: "#6366f1", color: "#fff", border: "none", borderRadius: 10, padding: "10px 20px", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
          ⬇ Download Report
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 24, background: "#f1f5f9", borderRadius: 10, padding: 4 }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            style={{ flex: 1, padding: "10px 4px", fontSize: 13, fontWeight: 600, border: "none", borderRadius: 8, cursor: "pointer", background: activeTab === t.id ? "#fff" : "transparent", color: activeTab === t.id ? "#6366f1" : "#64748b", transition: "all 0.2s" }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <div>
          {/* Score hero */}
          <Card style={{ display: "flex", alignItems: "center", gap: 32, marginBottom: 20, flexWrap: "wrap" }}>
            <ScoreCircle score={atsScore} size={150} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: SCORE_COLOR(atsScore) }}>{SCORE_LABEL(atsScore)}</div>
              <div style={{ fontSize: 13, color: "#64748b", marginBottom: 12 }}>Estimated ATS Compatibility Score</div>
              <p style={{ fontSize: 14, color: "#475569", lineHeight: 1.6, margin: 0 }}>
                {analysis?.summary || "Your resume is well-structured and ATS-friendly. Improving keyword relevance and adding measurable achievements can increase your score further."}
              </p>
              <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 10, fontStyle: "italic" }}>
                ⚠️ Note: This is an estimated score. Real ATS systems vary in their ranking methodology.
              </div>
            </div>
          </Card>

          {/* Bar chart */}
          <Card style={{ marginBottom: 20 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: "#1e293b", marginBottom: 20 }}>Score Breakdown</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={BarData} layout="vertical" margin={{ left: 0 }}>
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={90} />
                <Tooltip formatter={(v) => [`${v}/100`]} />
                <Bar dataKey="score" radius={[0, 6, 6, 0]}>
                  {BarData.map((entry, i) => <Cell key={i} fill={SCORE_COLOR(entry.score)} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* Strengths & Weaknesses */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, flexWrap: "wrap" }}>
            <Card>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: "#1e293b", marginBottom: 14 }}>✅ What's Working</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {(analysis?.strengths || ["Clear education section", "Strong technical skills", "ATS-friendly formatting", "Relevant project experience", "Good use of industry terminology", "Clear contact information"]).map((s, i) => (
                  <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start", fontSize: 13, color: "#374151" }}>
                    <span style={{ color: "#22c55e", flexShrink: 0, marginTop: 1 }}>✓</span> {s}
                  </div>
                ))}
              </div>
            </Card>
            <Card>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: "#1e293b", marginBottom: 14 }}>⚠️ Areas to Improve</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {(analysis?.weaknesses || ["Professional summary is too generic", "Missing quantifiable achievements", "Missing key technical keywords", "Project descriptions lack impact", "No deployment/cloud tools listed", "Action verbs could be stronger"]).map((w, i) => (
                  <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start", fontSize: 13, color: "#374151" }}>
                    <span style={{ color: "#f59e0b", flexShrink: 0, marginTop: 1 }}>!</span> {w}
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Keywords Tab */}
      {activeTab === "keywords" && (
        <div>
          <Card style={{ marginBottom: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: "#1e293b", margin: 0 }}>Keyword Match</h3>
              <div style={{ fontSize: 22, fontWeight: 800, color: "#6366f1" }}>{scores.keywordMatch || 74}%</div>
            </div>
            <ProgressBar value={scores.keywordMatch || 74} color="#6366f1" height={10} />
          </Card>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
            <Card>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: "#166534", marginBottom: 14 }}>✓ Found Keywords</h3>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {(analysis?.foundKeywords || ["Python", "Machine Learning", "Pandas", "NumPy", "Data Analysis", "Git", "SQL", "TensorFlow", "Statistics", "Jupyter"]).map((k, i) => (
                  <Tag key={i} type="found">{k}</Tag>
                ))}
              </div>
            </Card>
            <Card>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: "#991b1b", marginBottom: 14 }}>✕ Missing Keywords</h3>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
                {(analysis?.missingKeywords || ["PyTorch", "Scikit-learn", "REST API", "Docker", "AWS", "Model Deployment", "MLflow", "Kubernetes"]).map((k, i) => (
                  <Tag key={i} type="missing">{k}</Tag>
                ))}
              </div>
              <div style={{ fontSize: 12, color: "#92400e", background: "#fef9c3", padding: "10px 12px", borderRadius: 8 }}>
                ⚠️ Only add these keywords if they genuinely represent your actual skills or experience.
              </div>
            </Card>
          </div>

          <Card>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: "#1e293b", marginBottom: 14 }}>Skills Proficiency</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {(analysis?.skills || [
                { name: "Python", level: 95 }, { name: "Machine Learning", level: 88 }, { name: "SQL", level: 72 },
                { name: "Deep Learning", level: 55 }, { name: "Cloud Computing", level: 30 }, { name: "MLOps/Deployment", level: 25 }
              ]).map((s, i) => (
                <div key={i}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>{s.name}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: SCORE_COLOR(s.level) }}>{s.level}%</span>
                  </div>
                  <ProgressBar value={s.level} color={SCORE_COLOR(s.level)} />
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Sections Tab */}
      {activeTab === "sections" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {(analysis?.sections || [
            { name: "Contact Info", score: 95, status: "Excellent", issues: [], suggestions: "All essential contact details are present and formatted correctly." },
            { name: "Professional Summary", score: 68, status: "Needs Work", issues: ["Too generic and does not highlight specific skills", "Missing target role alignment"], suggestions: "Add your specialization, 2–3 core technical strengths, and a clear statement of what value you bring. Example: 'AI and ML engineer with 2 years of hands-on experience in Python, deep learning, and data pipelines. Passionate about building production-ready ML systems.'" },
            { name: "Education", score: 95, status: "Excellent", issues: [], suggestions: "Education section is clear, complete, and well-formatted." },
            { name: "Technical Skills", score: 82, status: "Good", issues: ["Missing deployment and cloud tools", "Could be better organized by category"], suggestions: "Group skills into categories (Languages, Frameworks, Tools, Cloud). Add Docker, AWS, or Azure if you have experience." },
            { name: "Projects", score: 74, status: "Good", issues: ["Project descriptions lack measurable outcomes", "Missing tech stack details in some entries"], suggestions: "Add quantifiable results where possible. Replace 'Built a model' with 'Built a Random Forest model achieving 91% accuracy on a 50K-record dataset.'" },
            { name: "Experience", score: 70, status: "Needs Improvement", issues: ["Bullet points use weak verbs (worked on, helped with)", "No measurable impact stated"], suggestions: "Use strong action verbs: Developed, Implemented, Optimized, Automated. Add numbers or outcomes where available." },
          ]).map((s, i) => (
            <Card key={i}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#1e293b" }}>{s.name}</h3>
                  <span style={{ fontSize: 12, fontWeight: 600, color: SCORE_COLOR(s.score), background: `${SCORE_COLOR(s.score)}18`, padding: "2px 10px", borderRadius: 99 }}>{s.status}</span>
                </div>
                <div style={{ textAlign: "right" }}>
                  <ScoreCircle score={s.score} size={64} />
                </div>
              </div>
              {s.issues.length > 0 && (
                <div style={{ marginBottom: 10 }}>
                  {s.issues.map((issue, j) => <div key={j} style={{ fontSize: 13, color: "#dc2626", marginBottom: 4 }}>⚠️ {issue}</div>)}
                </div>
              )}
              <div style={{ fontSize: 13, color: "#475569", lineHeight: 1.6, background: "#f8fafc", padding: "12px 14px", borderRadius: 8 }}>
                💡 {s.suggestions}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Improvements Tab */}
      {activeTab === "improvements" && (
        <div>
          <Card style={{ marginBottom: 20 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: "#1e293b", marginBottom: 16 }}>Top Priority Improvements</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {(analysis?.improvements || [
                { priority: "High", title: "Add missing job-specific keywords", desc: "Include TensorFlow, PyTorch, Docker, AWS to increase keyword match score." },
                { priority: "High", title: "Improve professional summary", desc: "Rewrite to include your specialization, technical strengths, and target role." },
                { priority: "High", title: "Add measurable achievements", desc: "Quantify project outcomes with accuracy scores, dataset sizes, or business impact." },
                { priority: "Medium", title: "Strengthen project descriptions", desc: "Use stronger action verbs and include technology stack for each project." },
                { priority: "Medium", title: "Add deployment/cloud tools", desc: "Even basic experience with AWS, Docker, or MLflow significantly boosts match scores." },
                { priority: "Low", title: "Reduce repetitive wording", desc: "Vary your action verbs and avoid using the same phrases across bullet points." },
                { priority: "Low", title: "Add GitHub or portfolio link", desc: "A portfolio link increases credibility and gives recruiters proof of work." },
                { priority: "Low", title: "Certifications section", desc: "Consider adding relevant certifications like AWS ML, Google Cloud, or Coursera ML." },
              ]).map((imp, i) => (
                <div key={i} style={{ display: "flex", gap: 14, padding: "14px 16px", background: "#f8fafc", borderRadius: 10, borderLeft: `4px solid ${imp.priority === "High" ? "#ef4444" : imp.priority === "Medium" ? "#f59e0b" : "#22c55e"}` }}>
                  <div style={{ flexShrink: 0 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 99, background: imp.priority === "High" ? "#fee2e2" : imp.priority === "Medium" ? "#fef9c3" : "#dcfce7", color: imp.priority === "High" ? "#dc2626" : imp.priority === "Medium" ? "#854d0e" : "#166534" }}>{imp.priority}</span>
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13, color: "#1e293b", marginBottom: 3 }}>#{i + 1} {imp.title}</div>
                    <div style={{ fontSize: 13, color: "#64748b" }}>{imp.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* AI Assistant Tab */}
      {activeTab === "ai-assistant" && (
        <div>
          <Card style={{ marginBottom: 20 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: "#1e293b", marginBottom: 6 }}>AI Resume Assistant</h3>
            <p style={{ fontSize: 13, color: "#64748b", marginBottom: 18 }}>Ask the AI to help improve any part of your resume. Be specific for best results.</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
              {["Improve my professional summary", "Suggest stronger action verbs", "How to add achievements?", "Make my projects more impactful", "What skills should I add?"].map((q, i) => (
                <button key={i} onClick={() => setAiPrompt(q)} style={{ background: "#f0f0ff", border: "1px solid #c4b5fd", color: "#6366f1", borderRadius: 8, padding: "6px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>{q}</button>
              ))}
            </div>
            <textarea
              value={aiPrompt} onChange={e => setAiPrompt(e.target.value)}
              placeholder="Ask the AI for specific resume advice..."
              rows={4}
              style={{ width: "100%", padding: "12px 14px", border: "1px solid #e2e8f0", borderRadius: 10, fontSize: 14, fontFamily: "inherit", resize: "vertical", boxSizing: "border-box", outline: "none" }}
            />
            <button onClick={handleAIAssist} disabled={aiLoading || !aiPrompt.trim()}
              style={{ marginTop: 12, background: aiPrompt.trim() ? "#6366f1" : "#e2e8f0", color: aiPrompt.trim() ? "#fff" : "#94a3b8", border: "none", borderRadius: 10, padding: "12px 24px", fontWeight: 700, fontSize: 14, cursor: aiPrompt.trim() ? "pointer" : "not-allowed" }}>
              {aiLoading ? "Thinking..." : "Get AI Advice →"}
            </button>
          </Card>

          {(aiResponse || aiLoading) && (
            <Card>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: "#1e293b", margin: 0 }}>🤖 AI Response</h3>
                {aiResponse && <button onClick={() => navigator.clipboard?.writeText(aiResponse)} style={{ background: "none", border: "1px solid #e2e8f0", borderRadius: 6, padding: "4px 10px", fontSize: 12, cursor: "pointer", color: "#64748b" }}>Copy</button>}
              </div>
              {aiLoading && !aiResponse && <div style={{ color: "#94a3b8", fontSize: 14 }}>Generating response...</div>}
              {aiResponse && (
                <div style={{ fontSize: 14, color: "#374151", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
                  {aiResponse}
                </div>
              )}
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Reports Page ──────────────────────────────────────────────────────────────
function ReportsPage({ onNavigate, reports, onDelete }) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: "#1e293b", margin: "0 0 4px" }}>My Reports</h2>
          <p style={{ color: "#64748b", fontSize: 14, margin: 0 }}>View and manage your resume analysis history.</p>
        </div>
        <button onClick={() => onNavigate("analyze")} style={{ background: "#6366f1", color: "#fff", border: "none", borderRadius: 10, padding: "12px 22px", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
          + New Analysis
        </button>
      </div>
      {reports.length === 0 ? (
        <Card style={{ textAlign: "center", padding: "60px 24px" }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>📭</div>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: "#1e293b", marginBottom: 8 }}>No analyses yet</h3>
          <p style={{ color: "#64748b", marginBottom: 20, fontSize: 14 }}>Analyze your first resume to see results here.</p>
          <button onClick={() => onNavigate("analyze")} style={{ background: "#6366f1", color: "#fff", border: "none", borderRadius: 10, padding: "12px 24px", fontWeight: 700, cursor: "pointer" }}>Analyze Your First Resume</button>
        </Card>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {reports.map(r => (
            <Card key={r.id} style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
              <ScoreCircle score={r.ats} size={72} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: "#1e293b", marginBottom: 2 }}>{r.name}</div>
                <div style={{ fontSize: 13, color: "#64748b" }}>🎯 {r.role}</div>
                <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>📅 {r.date}</div>
              </div>
              <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: "#3b82f6" }}>{r.match}%</div>
                  <div style={{ fontSize: 11, color: "#94a3b8" }}>Job Match</div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => onNavigate("viewReport", r)} style={{ background: "#6366f1", color: "#fff", border: "none", borderRadius: 8, padding: "8px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>View</button>
                  <button style={{ background: "transparent", border: "1px solid #e2e8f0", borderRadius: 8, padding: "8px 14px", fontSize: 12, fontWeight: 600, color: "#64748b", cursor: "pointer" }}>⬇</button>
                  <button onClick={() => onDelete(r.id)} style={{ background: "#fee2e2", border: "none", borderRadius: 8, padding: "8px 14px", fontSize: 12, fontWeight: 600, color: "#dc2626", cursor: "pointer" }}>✕</button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Resume Builder ────────────────────────────────────────────────────────────
function ResumeBuilder() {
  const [data, setData] = useState({
    name: "", title: "", email: "", phone: "", location: "", linkedin: "", github: "",
    summary: "", education: [{ school: "", degree: "", year: "", gpa: "" }],
    experience: [{ company: "", role: "", duration: "", bullets: "" }],
    skills: "", projects: [{ name: "", tech: "", desc: "" }], certifications: ""
  });
  const update = (field, val) => setData(p => ({ ...p, [field]: val }));

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
      {/* Form */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <Card>
          <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 14, color: "#1e293b" }}>Personal Information</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[["name", "Full Name"], ["title", "Job Title"], ["email", "Email"], ["phone", "Phone"], ["location", "Location"], ["linkedin", "LinkedIn URL"], ["github", "GitHub URL"]].map(([key, label]) => (
              <input key={key} placeholder={label} value={data[key]} onChange={e => update(key, e.target.value)} style={{ padding: "10px 12px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, outline: "none" }} />
            ))}
          </div>
        </Card>
        <Card>
          <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 10, color: "#1e293b" }}>Professional Summary</h3>
          <textarea placeholder="Write a compelling 2–3 sentence summary..." value={data.summary} onChange={e => update("summary", e.target.value)} rows={4} style={{ width: "100%", padding: "10px 12px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, fontFamily: "inherit", resize: "vertical", boxSizing: "border-box", outline: "none" }} />
        </Card>
        <Card>
          <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 10, color: "#1e293b" }}>Skills</h3>
          <textarea placeholder="Python, Machine Learning, TensorFlow, SQL..." value={data.skills} onChange={e => update("skills", e.target.value)} rows={3} style={{ width: "100%", padding: "10px 12px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, fontFamily: "inherit", resize: "vertical", boxSizing: "border-box", outline: "none" }} />
        </Card>
      </div>

      {/* Preview */}
      <div>
        <Card style={{ fontFamily: "'Georgia', serif", minHeight: 600 }}>
          <div style={{ borderBottom: "2px solid #1e293b", paddingBottom: 12, marginBottom: 14 }}>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: "#1e293b", margin: "0 0 2px" }}>{data.name || "Your Name"}</h1>
            <div style={{ fontSize: 14, color: "#6366f1", fontWeight: 600 }}>{data.title || "Job Title"}</div>
            <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
              {[data.email, data.phone, data.location].filter(Boolean).join(" · ")}
            </div>
            {(data.linkedin || data.github) && (
              <div style={{ fontSize: 12, color: "#64748b" }}>{[data.linkedin, data.github].filter(Boolean).join(" · ")}</div>
            )}
          </div>
          {data.summary && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#6366f1", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>Summary</div>
              <p style={{ fontSize: 13, color: "#374151", lineHeight: 1.6, margin: 0 }}>{data.summary}</p>
            </div>
          )}
          {data.skills && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#6366f1", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>Skills</div>
              <p style={{ fontSize: 13, color: "#374151", margin: 0 }}>{data.skills}</p>
            </div>
          )}
          <div style={{ fontSize: 12, color: "#94a3b8", fontStyle: "italic", marginTop: 20 }}>
            Fill in the form to see your resume preview update in real time.
          </div>
        </Card>
        <button style={{ marginTop: 12, width: "100%", background: "#6366f1", color: "#fff", border: "none", borderRadius: 10, padding: "14px", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
          ⬇ Download as PDF
        </button>
      </div>
    </div>
  );
}

// ─── Main App ──────────────────────────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [analysisState, setAnalysisState] = useState("idle"); // idle | loading | done
  const [analysisStep, setAnalysisStep] = useState(0);
  const [analysisData, setAnalysisData] = useState(null);
  const [uploadInfo, setUploadInfo] = useState(null);
  const [theme, setTheme] = useState("light");
  const [reports, setReports] = useState([]);

  const goTo = (target, report) => {
    if (target === "viewReport" && report) {
      setUploadInfo({ fileName: report.name, role: report.role });
      setAnalysisData(report.fullAnalysis);
      setAnalysisState("done");
      setPage("analyze");
    } else {
      setPage(target);
    }
  };

  const handleDeleteReport = (id) => setReports(prev => prev.filter(r => r.id !== id));

  const handleAnalyze = async ({ file, role, jd }) => {
    setUploadInfo({ fileName: file.name, role });
    setAnalysisState("loading");
    setAnalysisStep(0);
    setPage("analyze");

    // Simulate step progression
    for (let i = 1; i <= 5; i++) {
      await new Promise(r => setTimeout(r, 600));
      setAnalysisStep(i);
    }

    // Call Claude API for real analysis
    try {
      const prompt = `Analyze this resume for the role of "${role}".
${jd ? `\nJob Description:\n${jd}` : ""}
\nResume file: ${file.name} (uploaded by user)

Please provide a comprehensive ATS analysis. Return ONLY valid JSON with this structure:
{
  "scores": {
    "overall": <number 60-95>,
    "formatting": <number>,
    "keywords": <number>,
    "skills": <number>,
    "experience": <number>,
    "education": <number>,
    "structure": <number>,
    "readability": <number>,
    "achievements": <number>,
    "keywordMatch": <number>
  },
  "summary": "<2 sentence summary of overall resume quality>",
  "strengths": ["<strength 1>", "<strength 2>", "<strength 3>", "<strength 4>", "<strength 5>"],
  "weaknesses": ["<weakness 1>", "<weakness 2>", "<weakness 3>", "<weakness 4>", "<weakness 5>"],
  "foundKeywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5", "keyword6", "keyword7", "keyword8"],
  "missingKeywords": ["missing1", "missing2", "missing3", "missing4", "missing5", "missing6"],
  "skills": [
    {"name": "skill1", "level": <number>},
    {"name": "skill2", "level": <number>},
    {"name": "skill3", "level": <number>},
    {"name": "skill4", "level": <number>},
    {"name": "skill5", "level": <number>}
  ],
  "sections": [
    {"name": "Contact Info", "score": <number>, "status": "<Excellent|Good|Needs Work|Poor>", "issues": [], "suggestions": "<suggestion>"},
    {"name": "Professional Summary", "score": <number>, "status": "<status>", "issues": ["<issue>"], "suggestions": "<specific suggestion>"},
    {"name": "Technical Skills", "score": <number>, "status": "<status>", "issues": ["<issue>"], "suggestions": "<suggestion>"},
    {"name": "Experience", "score": <number>, "status": "<status>", "issues": ["<issue>"], "suggestions": "<suggestion>"},
    {"name": "Projects", "score": <number>, "status": "<status>", "issues": ["<issue>"], "suggestions": "<suggestion>"},
    {"name": "Education", "score": <number>, "status": "<status>", "issues": [], "suggestions": "<suggestion>"}
  ],
  "improvements": [
    {"priority": "High", "title": "<title>", "desc": "<description>"},
    {"priority": "High", "title": "<title>", "desc": "<description>"},
    {"priority": "Medium", "title": "<title>", "desc": "<description>"},
    {"priority": "Medium", "title": "<title>", "desc": "<description>"},
    {"priority": "Low", "title": "<title>", "desc": "<description>"}
  ]
}`;

      const resultText = await callClaudeAPI(
        `You are an expert ATS resume analyzer. You provide accurate, honest, and actionable resume analysis. Never invent skills, experience, or credentials. Return only valid JSON.`,
        prompt,
        null
      );

      try {
        const cleanJson = resultText.replace(/```json|```/g, "").trim();
        const parsed = JSON.parse(cleanJson);
        setAnalysisData(parsed);

        // Save this analysis into the reports list
        setReports(prev => [
          {
            id: Date.now(),
            name: file.name,
            role,
            ats: parsed.scores?.overall ?? 0,
            match: parsed.scores?.keywordMatch ?? 0,
            date: "Just now",
            status: "Analyzed",
            fullAnalysis: parsed,
          },
          ...prev,
        ]);
      } catch {
        setAnalysisData(null); // will use defaults
      }
    } catch {
      setAnalysisData(null);
    }

    setAnalysisState("done");
  };

  const bg = theme === "dark" ? "#0f172a" : "#f1f5f9";
  const sidebarBg = theme === "dark" ? "#1e293b" : "#fff";
  const textPrimary = theme === "dark" ? "#f1f5f9" : "#1e293b";

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: bg, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      {/* Sidebar */}
      <div style={{
        width: sidebarOpen ? 240 : 0, flexShrink: 0, background: sidebarBg,
        borderRight: "1px solid #e2e8f0", display: "flex", flexDirection: "column",
        overflow: "hidden", transition: "width 0.25s ease"
      }}>
        <div style={{ padding: "20px 20px 16px", borderBottom: "1px solid #f1f5f9" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, background: "linear-gradient(135deg,#6366f1,#8b5cf6)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🤖</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: "#1e293b" }}>ResumeAI</div>
              <div style={{ fontSize: 10, color: "#94a3b8" }}>Career Assistant</div>
            </div>
          </div>
        </div>
        <nav style={{ flex: 1, padding: "12px 10px", display: "flex", flexDirection: "column", gap: 2 }}>
          {NAV_ITEMS.map(item => (
            <button key={item.id} onClick={() => { setPage(item.id); if (item.id !== "analyze") setAnalysisState("idle"); }}
              style={{
                display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 10, border: "none",
                background: page === item.id ? "#f0f0ff" : "transparent",
                color: page === item.id ? "#6366f1" : "#64748b", fontWeight: page === item.id ? 700 : 500,
                fontSize: 13, cursor: "pointer", width: "100%", textAlign: "left", transition: "all 0.15s"
              }}>
              <span style={{ fontSize: 16, width: 20, textAlign: "center" }}>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
        <div style={{ padding: "16px 12px", borderTop: "1px solid #f1f5f9" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", marginBottom: 8 }}>
            <div style={{ width: 34, height: 34, borderRadius: "50%", background: "#6366f1", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 13 }}>U</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#1e293b" }}>User</div>
              <div style={{ fontSize: 11, color: "#94a3b8" }}>Free Plan</div>
            </div>
          </div>
          <button onClick={() => setTheme(t => t === "light" ? "dark" : "light")} style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #e2e8f0", background: "transparent", fontSize: 12, color: "#64748b", cursor: "pointer" }}>
            {theme === "light" ? "🌙 Dark Mode" : "☀️ Light Mode"}
          </button>
        </div>
      </div>

      {/* Main */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        {/* Top bar */}
        <div style={{ background: "#fff", borderBottom: "1px solid #e2e8f0", padding: "14px 24px", display: "flex", alignItems: "center", gap: 16 }}>
          <button onClick={() => setSidebarOpen(o => !o)} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "#64748b" }}>☰</button>
          <div style={{ fontWeight: 700, fontSize: 15, color: "#1e293b", flex: 1 }}>
            {NAV_ITEMS.find(n => n.id === page)?.label || "Dashboard"}
          </div>
          <button onClick={() => { setPage("analyze"); setAnalysisState("idle"); }} style={{ background: "#6366f1", color: "#fff", border: "none", borderRadius: 8, padding: "8px 16px", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
            Analyze Resume
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, padding: "28px 32px", overflowY: "auto" }}>
          {page === "dashboard" && <DashboardHome onNavigate={(p) => setPage(p)} reports={reports} />}
          {page === "analyze" && analysisState === "idle" && <UploadPage onAnalyze={handleAnalyze} />}
          {page === "analyze" && analysisState === "loading" && <AnalysisProgress step={analysisStep} />}
          {page === "analyze" && analysisState === "done" && (
            <ResultsPage analysis={analysisData} fileName={uploadInfo?.fileName} role={uploadInfo?.role} />
          )}
          {page === "report" && <ReportsPage onNavigate={goTo} reports={reports} onDelete={handleDeleteReport} />}
          {page === "builder" && <ResumeBuilder />}
          {page === "settings" && (
            <Card style={{ maxWidth: 500 }}>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: "#1e293b", marginBottom: 20 }}>Settings</h2>
              <div style={{ fontSize: 14, color: "#64748b", marginBottom: 16 }}>🔒 Privacy: Your resume is processed securely and not retained beyond the current session.</div>
              <button style={{ background: "#fee2e2", color: "#dc2626", border: "none", borderRadius: 8, padding: "10px 20px", fontWeight: 600, fontSize: 13, cursor: "pointer", display: "block", marginBottom: 10 }}>Delete All Resumes</button>
              <button style={{ background: "#fee2e2", color: "#dc2626", border: "none", borderRadius: 8, padding: "10px 20px", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>Delete All Reports</button>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

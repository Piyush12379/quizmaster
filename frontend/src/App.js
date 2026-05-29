import React, { useState, useEffect, useCallback } from "react";
import confetti from "canvas-confetti";
import "./App.css";

const API_BASE = "/api";
const OPTION_LETTERS = ["A", "B", "C", "D"];
const TIMER_SECONDS  = 30;

function getGradeInfo(percentage) {
  if (percentage >= 90) return { label: "excellent", emoji: "🏆", grade: "S RANK — OUTSTANDING" };
  if (percentage >= 70) return { label: "good",      emoji: "🎯", grade: "A RANK — WELL DONE" };
  if (percentage >= 50) return { label: "average",   emoji: "📚", grade: "B RANK — KEEP GOING" };
  return                       { label: "poor",      emoji: "💪", grade: "C RANK — PRACTICE MORE" };
}

function LoadingScreen() {
  return (
    <div className="loading-screen">
      <div className="loader-box" aria-label="Loading" />
      <p className="loading-text">Fetching Questions…</p>
    </div>
  );
}

function ErrorScreen({ message, onRetry }) {
  return (
    <div className="error-screen">
      <div className="error-code">ERR</div>
      <p className="error-msg">{message}</p>
      <button className="btn btn-dark" onClick={onRetry}>↺ &nbsp;Retry</button>
    </div>
  );
}

function Header({ questionCount, user, onLogout }) {
  return (
    <header className="header">
      <div className="header-logo"><span>Q</span>UIZMASTER</div>
      <div className="header-actions" style={{display: 'flex', gap: '16px', alignItems: 'center'}}>
        {questionCount > 0 && (
          <div className="header-badge">{questionCount} Questions Loaded</div>
        )}
        {user && (
          <>
            <span style={{fontFamily: "var(--font-mono)", fontSize: "0.85rem", color: "var(--accent-cyan)"}}>{user.fullName || user.username}</span>
            {user.isAdmin && (
              <button onClick={() => onLogout(true)} style={{background: 'var(--accent-pink)', border: 'none', color: 'white', padding: '4px 10px', borderRadius: '4px', cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: '0.75rem'}}>Admin Panel</button>
            )}
            <button onClick={() => onLogout(false)} style={{background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: 'white', padding: '4px 10px', borderRadius: '4px', cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: '0.75rem'}}>Logout</button>
          </>
        )}
      </div>
    </header>
  );
}

function StartScreen({ questions, onStart, user }) {
  const categories = [...new Set(questions.map((q) => q.category))];
  return (
    <>
      <div className="hero">
        <div className="hero-tag">✦ Aptitude Prep Portal</div>
        <h2 style={{color: "var(--accent-green)", marginBottom: "16px", fontFamily: "var(--font-mono)", fontSize: "1.2rem"}}>Welcome, {user?.fullName || user?.username || 'Challenger'}!</h2>
        <h1>TEST YOUR<br /><em>KNOWLEDGE</em></h1>
        <p>Challenge yourself with aptitude questions covering C++, Data Structures, Linked Lists, OOP, and General Logic. Each answer is explained — learn as you go.</p>
        <button className="btn btn-primary btn-lg" onClick={onStart}>▶ &nbsp;Start Quiz</button>
      </div>
      <div className="start-stats">
        <div className="stat-box">
          <div className="stat-value">{questions.length}</div>
          <div className="stat-label">Questions</div>
        </div>
        <div className="stat-box">
          <div className="stat-value">{categories.length}</div>
          <div className="stat-label">Categories</div>
        </div>
        <div className="stat-box">
          <div className="stat-value">{TIMER_SECONDS}s</div>
          <div className="stat-label">Per Question</div>
        </div>
      </div>
    </>
  );
}

function QuestionTimer({ onTimeUp }) {
  const [timeLeft, setTimeLeft] = useState(TIMER_SECONDS);

  useEffect(() => {
    if (timeLeft <= 0) { onTimeUp(); return; }
    const tick = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(tick);
  }, [timeLeft, onTimeUp]);

  const timerClass =
    timeLeft > 15 ? "timer-green"  :
    timeLeft > 5  ? "timer-orange" : "timer-red";

  const fillPct = (timeLeft / TIMER_SECONDS) * 100;

  return (
    <div className={`timer-bar ${timerClass}`}>
      <div className="timer-icon">⏱</div>
      <div className="timer-track">
        <div className="timer-fill" style={{ width: `${fillPct}%` }} />
      </div>
      <div className="timer-count">{String(timeLeft).padStart(2, "0")}s</div>
    </div>
  );
}

function QuestionCard({ question, index, total, selectedIndex, onSelect, onTimeUp }) {
  const progress = (index / total) * 100;
  return (
    <div className="quiz-layout">
      <aside className="quiz-sidebar glass-panel">
        <div className="sidebar-group">
          <div className="question-meta-side">
            <span className="q-number">Q{String(index + 1).padStart(2, "0")}</span>
            <span className="q-category">{question.category}</span>
          </div>
          <div className={`q-difficulty-badge ${question.difficulty}`}>{question.difficulty}</div>
        </div>

        <div className="sidebar-group">
          <div className="progress-label">Progress <span style={{float:'right'}}>{index + 1} / {total}</span></div>
          <div className="progress-track" role="progressbar" aria-valuenow={index + 1} aria-valuemin={1} aria-valuemax={total}>
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <div className="sidebar-group">
          <div className="progress-label">Time Remaining</div>
          <QuestionTimer key={index} onTimeUp={onTimeUp} />
        </div>
      </aside>

      <main className="quiz-main glass-panel">
        <div className="question-body">
          {question.question.split("\n\n").map((part, idx) => (
            idx === 0 ? (
              <h2 key={idx} className="question-text-large">{part}</h2>
            ) : (
              <pre key={idx} className="question-code-block"><code>{part}</code></pre>
            )
          ))}
          <div className="options-grid-large" role="radiogroup" aria-label="Answer options">
            {question.options.map((opt, i) => (
              <button key={i} className={`option-btn option-large ${selectedIndex === i ? "selected" : ""}`}
                onClick={() => onSelect(i)} role="radio" aria-checked={selectedIndex === i}
                aria-label={`Option ${OPTION_LETTERS[i]}: ${opt}`}>
                <span className="option-letter">{OPTION_LETTERS[i]}</span>
                <span>{opt}</span>
              </button>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

function ScoreScreen({ scoreData, questions, answers, onRestart }) {
  const { score, total, percentage, results } = scoreData;
  const { label, emoji, grade } = getGradeInfo(percentage);

  useEffect(() => {
    if (percentage >= 70) {
      confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 }, colors: ['#00f0ff', '#ff0055', '#00e676', '#ffaa00'] });
    }
  }, [percentage]);
  return (
    <div className="score-screen">
      <div className={`score-hero ${label}`}>
        <div className="score-label">Your Final Score {emoji}</div>
        <div className="score-number">{score}/{total}</div>
        <div className="score-subtext">{percentage}% correct</div>
        <div className="score-grade">{grade}</div>
      </div>
      <div className="score-actions">
        <button className="btn btn-primary" onClick={onRestart}>↺ &nbsp;Try Again</button>
        <button className="btn btn-dark" onClick={() => window.scrollTo({ top: 600, behavior: "smooth" })}>↓ &nbsp;Review Answers</button>
      </div>
      <div className="results-list">
        {results.map((result, i) => {
          const q = questions.find((q) => q._id === result.questionId);
          if (!q) return null;
          const userIdx = answers[result.questionId];
          const isCorrect = result.correct;
          return (
            <div key={result.questionId} className="result-item">
              <div className="result-header">
                <span className="q-number">Q{String(i + 1).padStart(2, "0")}</span>
                <span className="q-category">{q.category}</span>
                <span className={`result-status ${isCorrect ? "correct" : "wrong"}`}>
                  {isCorrect ? "✓ Correct" : "✗ Wrong"}
                </span>
              </div>
              <div className="result-body">
                <div className="result-question">
                  {q.question.split("\n\n").map((part, idx) => (
                    idx === 0 ? <p key={idx}>{part}</p> : <pre key={idx} className="question-code-block-small"><code>{part}</code></pre>
                  ))}
                </div>
                <div className="result-answers">
                  {isCorrect ? (
                    <span className="answer-pill same">✓ Your answer: {OPTION_LETTERS[userIdx]} — {q.options[userIdx]}</span>
                  ) : (
                    <>
                      <span className="answer-pill user-answer">
                        ✗ You picked: {userIdx !== undefined ? OPTION_LETTERS[userIdx] : "—"}
                        {userIdx !== undefined ? ` — ${q.options[userIdx]}` : " (not answered)"}
                      </span>
                      <span className="answer-pill correct-answer">
                        ✓ Correct: {OPTION_LETTERS[result.correctIndex]} — {q.options[result.correctIndex]}
                      </span>
                    </>
                  )}
                </div>
                {result.explanation && (
                  <div className="result-explanation"><strong>Explanation: </strong>{result.explanation}</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <div className="score-actions">
        <button className="btn btn-primary" onClick={onRestart}>↺ &nbsp;Try Again</button>
      </div>
    </div>
  );
}

const PHASE = { AUTH: "auth", START: "start", QUIZ: "quiz", RESULT: "result", ADMIN: "admin" };

function AuthScreen({ isLogin, onToggle, onSubmit, error, success, loading }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isLogin) {
      onSubmit({ username, password });
    } else {
      onSubmit({ username, password, fullName, email });
    }
  };

  return (
    <div className="auth-screen">
      <div className="hero" style={{padding: "10px 0", marginTop: "0"}}>
        <div className="hero-tag" style={{marginBottom: "10px"}}>✦ Authentication</div>
        <h1 style={{fontSize: "clamp(1.8rem, 5vw, 3rem)", marginBottom: "10px"}}>{isLogin ? "WELCOME" : "JOIN"} <br /><em>{isLogin ? "BACK" : "US"}</em></h1>
        <p style={{marginBottom: "16px"}}>{isLogin ? "Log in to continue your aptitude preparation." : "Create an account to start practicing."}</p>
      </div>
      
      <form className="auth-form glass-panel" onSubmit={handleSubmit}>
        {error && <div className="auth-error">{error}</div>}
        {success && <div className="auth-success">{success}</div>}
        
        {!isLogin && (
          <>
            <div className="form-group">
              <label>Full Name</label>
              <input type="text" className="auth-input" value={fullName} onChange={e => setFullName(e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Email Address</label>
              <input type="email" className="auth-input" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
          </>
        )}
        
        <div className="form-group">
          <label>Username</label>
          <input type="text" className="auth-input" value={username} onChange={e => setUsername(e.target.value)} required />
        </div>
        <div className="form-group">
          <label>Password</label>
          <input type="password" className="auth-input" value={password} onChange={e => setPassword(e.target.value)} required />
        </div>
        <button type="submit" className="btn btn-primary btn-lg auth-btn" disabled={loading}>
          {loading ? "Please wait..." : (isLogin ? "▶ Login" : "▶ Register")}
        </button>
        <div className="auth-toggle">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <span onClick={onToggle} className="toggle-link">{isLogin ? "Register here" : "Login here"}</span>
        </div>
      </form>
    </div>
  );
}

function AdminDashboard() {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ category: "", difficulty: "Medium", question: "", options: ["", "", "", ""], correctIndex: 0, explanation: "" });

  const fetchAdminQuestions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/admin/questions`);
      const json = await res.json();
      if (json.success) setQuestions(json.data);
    } catch (err) { alert("Failed to fetch questions"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAdminQuestions(); }, [fetchAdminQuestions]);

  const handleOpenModal = (q = null) => {
    if (q) {
      setEditingId(q._id);
      setFormData({ category: q.category, difficulty: q.difficulty, question: q.question, options: [...q.options], correctIndex: q.correctIndex, explanation: q.explanation });
    } else {
      setEditingId(null);
      setFormData({ category: "General", difficulty: "Medium", question: "", options: ["", "", "", ""], correctIndex: 0, explanation: "" });
    }
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this question?")) return;
    try {
      const res = await fetch(`${API_BASE}/admin/questions/${id}`, { method: "DELETE" });
      if (res.ok) fetchAdminQuestions();
    } catch (err) { alert("Delete failed"); }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const method = editingId ? "PUT" : "POST";
    const url = editingId ? `${API_BASE}/admin/questions/${editingId}` : `${API_BASE}/admin/questions`;
    try {
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(formData) });
      if (res.ok) { setIsModalOpen(false); fetchAdminQuestions(); }
      else alert("Save failed");
    } catch (err) { alert("Save failed"); }
  };

  const updateOption = (index, value) => {
    const newOptions = [...formData.options];
    newOptions[index] = value;
    setFormData({ ...formData, options: newOptions });
  };

  return (
    <div className="admin-dashboard hero" style={{paddingTop: 0, maxWidth: '1000px', margin: '20px auto'}}>
      <div className="admin-header">
        <div>
          <h1 style={{fontSize: "2.5rem", marginBottom: "8px"}}>Admin <em style={{fontStyle:'normal', color:'var(--accent-pink)'}}>Dashboard</em></h1>
          <p style={{color: "var(--text-muted)"}}>Manage QuizMaster questions database.</p>
        </div>
        <div style={{display:'flex', gap:'16px'}}>
          <button className="btn btn-primary" onClick={() => handleOpenModal()}>+ New Question</button>
        </div>
      </div>
      
      {loading ? <LoadingScreen /> : (
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Category</th>
                <th>Question</th>
                <th>Correct Answer</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {questions.map(q => (
                <tr key={q._id}>
                  <td><span className={`q-difficulty-badge ${q.difficulty}`} style={{zoom: 0.8}}>{q.difficulty}</span><br/><span style={{fontSize:'0.8rem', opacity:0.7, fontFamily:'var(--font-mono)'}}>{q.category}</span></td>
                  <td style={{maxWidth: '300px'}}>{q.question.substring(0, 80)}{q.question.length > 80 ? '...' : ''}</td>
                  <td className="correct-opt">{q.options[q.correctIndex]}</td>
                  <td>
                    <div className="admin-actions">
                      <button className="btn-edit" onClick={() => handleOpenModal(q)}>Edit</button>
                      <button className="btn-danger" onClick={() => handleDelete(q._id)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isModalOpen && (
        <div className="admin-modal-overlay">
          <div className="admin-modal glass-panel">
            <h2>{editingId ? "Edit Question" : "New Question"}</h2>
            <form onSubmit={handleSave}>
              <div className="form-row">
                <div className="form-group">
                  <label>Category</label>
                  <input className="auth-input" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label>Difficulty</label>
                  <select className="auth-input" value={formData.difficulty} onChange={e => setFormData({...formData, difficulty: e.target.value})}>
                    <option value="Easy">Easy</option><option value="Medium">Medium</option><option value="Hard">Hard</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Question Text</label>
                <textarea className="auth-input" rows="3" value={formData.question} onChange={e => setFormData({...formData, question: e.target.value})} required />
              </div>
              <div className="form-group">
                <label>Options & Correct Answer</label>
                {formData.options.map((opt, i) => (
                  <div key={i} style={{display:'flex', gap:'8px', marginBottom:'8px', alignItems:'center'}}>
                    <input type="radio" name="correctIndex" checked={formData.correctIndex === i} onChange={() => setFormData({...formData, correctIndex: i})} />
                    <input className="auth-input" style={{flex: 1, padding:'8px'}} value={opt} onChange={e => updateOption(i, e.target.value)} required placeholder={`Option ${OPTION_LETTERS[i]}`} />
                  </div>
                ))}
              </div>
              <div className="form-group">
                <label>Explanation (Optional)</label>
                <textarea className="auth-input" rows="2" value={formData.explanation} onChange={e => setFormData({...formData, explanation: e.target.value})} />
              </div>
              <div className="admin-modal-actions">
                <button type="button" className="btn btn-dark" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-success">Save Question ✓</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [phase,      setPhase]      = useState(PHASE.AUTH);
  const [isLoginView, setIsLoginView] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [authSuccess, setAuthSuccess] = useState(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [questions,  setQuestions]  = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers,    setAnswers]    = useState({});
  const [scoreData,  setScoreData]  = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchQuestions = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res  = await fetch(`${API_BASE}/questions`);
      if (!res.ok) throw new Error(`Server responded with ${res.status}`);
      const json = await res.json();
      setQuestions(json.data || []);
    } catch (err) {
      setError(err.message || "Failed to load questions. Is the API running?");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchQuestions(); }, [fetchQuestions]);

  const handleAuth = async (credentials) => {
    setAuthLoading(true); setAuthError(null); setAuthSuccess(null);
    try {
      const endpoint = isLoginView ? "/login" : "/register";
      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials)
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Authentication failed");
      
      if (isLoginView) {
        setUser({ username: data.username, fullName: data.fullName, isAdmin: data.isAdmin });
        setPhase(data.isAdmin ? PHASE.ADMIN : PHASE.START);
      } else {
        setIsLoginView(true);
        setAuthSuccess("You've successfully registered! Please log in.");
      }
    } catch (err) {
      setAuthError(err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleStart = () => { setCurrentIdx(0); setAnswers({}); setScoreData(null); setPhase(PHASE.QUIZ); };
  const handleSelect = (optionIndex) => {
    const qId = questions[currentIdx]._id;
    setAnswers((prev) => ({ ...prev, [qId]: optionIndex }));
  };
  const handleNext = () => { if (currentIdx < questions.length - 1) setCurrentIdx((i) => i + 1); };
  const handlePrev = () => { if (currentIdx > 0) setCurrentIdx((i) => i - 1); };

  const handleSubmit = useCallback(async () => {
    setSubmitting(true);
    try {
      const payload = { answers: questions.map((q) => ({ questionId: q._id, selectedIndex: answers[q._id] ?? -1 })) };
      const res = await fetch(`${API_BASE}/submit`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (!res.ok) throw new Error(`Submit failed: ${res.status}`);
      const data = await res.json();
      setScoreData(data); setPhase(PHASE.RESULT);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) { alert("Submission failed: " + err.message); }
    finally { setSubmitting(false); }
  }, [questions, answers]);

  const handleTimeUp = useCallback(() => {
    if (currentIdx < questions.length - 1) { setCurrentIdx((i) => i + 1); }
    else { handleSubmit(); }
  }, [currentIdx, questions.length, handleSubmit]);

  const handleRestart = () => { setPhase(PHASE.START); window.scrollTo({ top: 0, behavior: "smooth" }); };

  const currentQuestion = questions[currentIdx];
  const selectedIndex   = currentQuestion ? answers[currentQuestion._id] : undefined;
  const isLast          = currentIdx === questions.length - 1;
  const answeredCount   = Object.keys(answers).length;

  return (
    <div className="app">
      <Header questionCount={questions.length} user={user} onLogout={(isAdminClick) => { 
        if (isAdminClick === true) setPhase(PHASE.ADMIN);
        else { setUser(null); setPhase(PHASE.AUTH); }
      }} />
      {loading && <LoadingScreen />}
      {!loading && error && <ErrorScreen message={error} onRetry={fetchQuestions} />}
      {!loading && !error && phase === PHASE.AUTH && (
        <AuthScreen 
          isLogin={isLoginView} 
          onToggle={() => { setIsLoginView(!isLoginView); setAuthError(null); setAuthSuccess(null); }} 
          onSubmit={handleAuth} 
          error={authError}
          success={authSuccess}
          loading={authLoading}
        />
      )}
      {!loading && !error && phase === PHASE.START && <StartScreen questions={questions} onStart={handleStart} user={user} />}
      {!loading && !error && phase === PHASE.QUIZ && currentQuestion && (
        <>
          <QuestionCard question={currentQuestion} index={currentIdx} total={questions.length}
            selectedIndex={selectedIndex} onSelect={handleSelect} onTimeUp={handleTimeUp} />
          <div className="quiz-nav">
            <button className="btn btn-dark" onClick={handlePrev} disabled={currentIdx === 0} style={{ opacity: currentIdx === 0 ? 0.4 : 1 }}>← Prev</button>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.8rem" }}>{answeredCount}/{questions.length} answered</span>
            {isLast ? (
              <button className="btn btn-success" onClick={handleSubmit} disabled={submitting}>{submitting ? "Submitting…" : "Submit Quiz ✓"}</button>
            ) : (
              <button className="btn btn-primary" onClick={handleNext}>Next →</button>
            )}
          </div>
        </>
      )}
      {!loading && !error && phase === PHASE.RESULT && scoreData && (
        <ScoreScreen scoreData={scoreData} questions={questions} answers={answers} onRestart={handleRestart} />
      )}
      {!loading && !error && phase === PHASE.ADMIN && user?.isAdmin && (
        <AdminDashboard />
      )}
      <footer className="footer">
        <span className="footer-text">© 2025 QuizMaster — Aptitude Prep Portal</span>
        <div className="footer-stack">
          <span className="stack-pill">React</span>
          <span className="stack-pill">Node</span>
          <span className="stack-pill">MongoDB</span>
          <span className="stack-pill">Docker</span>
        </div>
      </footer>
    </div>
  );
}

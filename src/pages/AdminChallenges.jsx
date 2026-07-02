import { useEffect, useMemo, useState } from "react";
import Sidebar from "../components/Sidebar";
import DashboardBackButton from "../components/DashboardBackButton";
import InlineLoader from "../components/InlineLoader";
import {
  createAdminChallenge,
  deleteAdminChallenge,
  getAdminChallenges,
  suggestAdminChallenge,
  updateAdminChallenge,
} from "../api/challengeApi";
import { FaCalendarAlt, FaMagic, FaPlus, FaRecycle, FaSearch, FaSeedling, FaTrash, FaTrophy } from "react-icons/fa";
import "./AdminChallenges.css";

const emptyForm = {
  title: "",
  description: "",
  score_reward: 60,
  category: "daily",
  difficulty: "easy",
  proof_instructions: "",
  validation_keywords_text: "",
  occasion_name: "",
  occasion_month: "",
  occasion_day: "",
  event_window_days: 2,
  icon: "leaf",
  is_active: true,
  ai_generated: false,
};

const categories = ["daily", "event", "waste", "water", "energy", "transport", "food", "nature", "shopping", "community"];
const icons = ["leaf", "recycle", "water", "bolt", "bike", "tree", "seedling", "ocean", "cleanup", "shopping", "food"];

const normalizeForm = (challenge) => ({
  ...emptyForm,
  ...challenge,
  validation_keywords_text: (challenge.validation_keywords || []).join(", "),
  occasion_month: challenge.occasion_month || "",
  occasion_day: challenge.occasion_day || "",
});

const toPayload = (form) => ({
  title: form.title,
  description: form.description,
  score_reward: Number(form.score_reward || 0),
  category: form.category || "daily",
  difficulty: form.difficulty || "easy",
  proof_instructions: form.proof_instructions || null,
  validation_keywords: form.validation_keywords_text
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean),
  occasion_name: form.occasion_name || null,
  occasion_month: form.occasion_month ? Number(form.occasion_month) : null,
  occasion_day: form.occasion_day ? Number(form.occasion_day) : null,
  event_window_days: Number(form.event_window_days || 0),
  icon: form.icon || "leaf",
  is_active: Boolean(form.is_active),
  ai_generated: Boolean(form.ai_generated),
});

export default function AdminChallenges() {
  const [data, setData] = useState({ challenges: [], stats: {} });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [aiContext, setAiContext] = useState({ topic: "", occasion_name: "", category: "daily", difficulty: "easy", notes: "" });

  const loadChallenges = async () => {
    const result = await getAdminChallenges({ search });
    setData(result);
  };

  useEffect(() => {
    const init = async () => {
      try {
        await loadChallenges();
      } catch (err) {
        console.error(err);
        setError(err?.response?.data?.message || "Failed to load challenges.");
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const filtered = useMemo(() => data.challenges || [], [data]);

  const updateField = (name, value) => setForm((prev) => ({ ...prev, [name]: value }));

  const resetForm = () => {
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleSearch = async (event) => {
    event.preventDefault();
    try {
      setLoading(true);
      await loadChallenges();
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (challenge) => {
    setEditingId(challenge.id);
    setForm(normalizeForm(challenge));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage("");
    setError("");

    try {
      setSaving(true);
      if (editingId) {
        await updateAdminChallenge(editingId, toPayload(form));
        setMessage("Challenge updated.");
      } else {
        await createAdminChallenge(toPayload(form));
        setMessage("Challenge created.");
      }
      resetForm();
      await loadChallenges();
    } catch (err) {
      console.error(err);
      const validation = err?.response?.data?.errors;
      const first = validation ? Object.values(validation).flat()[0] : null;
      setError(first || err?.response?.data?.message || "Failed to save challenge.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (challenge) => {
    if (!window.confirm(`Delete challenge: ${challenge.title}?`)) return;
    try {
      await deleteAdminChallenge(challenge.id);
      setMessage("Challenge deleted.");
      await loadChallenges();
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.message || "Failed to delete challenge.");
    }
  };

  const handleAiSuggest = async () => {
    setMessage("");
    setError("");
    try {
      setAiLoading(true);
      const response = await suggestAdminChallenge(aiContext);
      const suggestion = response.suggestion || {};
      setForm(normalizeForm({
        ...suggestion,
        occasion_name: aiContext.occasion_name || "",
        ai_generated: true,
        is_active: true,
      }));
      setEditingId(null);
      setMessage("AI suggestion added to the form. Review it, then save.");
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.message || "AI assist failed.");
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="admin-challenges-layout">
      <Sidebar />
      <main className="admin-challenges-main">
        <DashboardBackButton />
        <div className="admin-challenges-container">
          <section className="admin-challenges-hero">
            <div>
              <span><FaTrophy /> Challenge Management</span>
              <h1>Build AI-verified eco challenges</h1>
              <p>Create daily quests, date-based environmental event quests, and AI-assisted challenges that users prove with photos.</p>
            </div>
            <div className="admin-challenge-stats">
              <article><FaSeedling /><strong>{data.stats?.active || 0}</strong><small>Active</small></article>
              <article><FaCalendarAlt /><strong>{data.stats?.event_based || 0}</strong><small>Event based</small></article>
              <article><FaMagic /><strong>{data.stats?.ai_generated || 0}</strong><small>AI assisted</small></article>
            </div>
          </section>

          {(message || error) && <div className={`admin-challenge-alert ${error ? "error" : "success"}`}>{error || message}</div>}

          <section className="admin-challenge-workspace">
            <aside className="ai-assist-card">
              <div className="admin-card-title">
                <FaMagic />
                <div>
                  <h2>AI assist</h2>
                  <p>Generate a clear challenge draft for any eco topic or occasion.</p>
                </div>
              </div>

              <label>Topic<input value={aiContext.topic} placeholder="tree planting, zero waste, clean air..." onChange={(e) => setAiContext((p) => ({ ...p, topic: e.target.value }))} /></label>
              <label>Occasion name<input value={aiContext.occasion_name} placeholder="World Environment Day" onChange={(e) => setAiContext((p) => ({ ...p, occasion_name: e.target.value }))} /></label>
              <div className="two-fields">
                <label>Category<select value={aiContext.category} onChange={(e) => setAiContext((p) => ({ ...p, category: e.target.value }))}>{categories.map((c) => <option key={c} value={c}>{c}</option>)}</select></label>
                <label>Difficulty<select value={aiContext.difficulty} onChange={(e) => setAiContext((p) => ({ ...p, difficulty: e.target.value }))}><option>easy</option><option>medium</option><option>hard</option></select></label>
              </div>
              <label>Extra notes<textarea value={aiContext.notes} placeholder="Make it safe for students and easy to verify..." onChange={(e) => setAiContext((p) => ({ ...p, notes: e.target.value }))} /></label>
              <button className="ai-generate-btn" type="button" onClick={handleAiSuggest} disabled={aiLoading}>{aiLoading ? "Generating..." : "Generate challenge draft"}</button>
            </aside>

            <form className="challenge-editor-card" onSubmit={handleSubmit}>
              <div className="admin-card-title">
                <FaPlus />
                <div>
                  <h2>{editingId ? "Edit challenge" : "Add challenge"}</h2>
                  <p>Users will see five random active challenges each day.</p>
                </div>
              </div>

              <label>Title<input required value={form.title} onChange={(e) => updateField("title", e.target.value)} /></label>
              <label>Description<textarea required value={form.description} onChange={(e) => updateField("description", e.target.value)} /></label>
              <label>Proof instructions<textarea value={form.proof_instructions} onChange={(e) => updateField("proof_instructions", e.target.value)} /></label>
              <label>AI validation keywords<input value={form.validation_keywords_text} placeholder="bottle, reusable, water, desk" onChange={(e) => updateField("validation_keywords_text", e.target.value)} /></label>

              <div className="four-fields">
                <label>Reward<input type="number" min="1" max="1000" value={form.score_reward} onChange={(e) => updateField("score_reward", e.target.value)} /></label>
                <label>Category<select value={form.category} onChange={(e) => updateField("category", e.target.value)}>{categories.map((c) => <option key={c} value={c}>{c}</option>)}</select></label>
                <label>Difficulty<select value={form.difficulty} onChange={(e) => updateField("difficulty", e.target.value)}><option>easy</option><option>medium</option><option>hard</option></select></label>
                <label>Icon<select value={form.icon} onChange={(e) => updateField("icon", e.target.value)}>{icons.map((i) => <option key={i} value={i}>{i}</option>)}</select></label>
              </div>

              <div className="event-fields">
                <label>Eco occasion name<input value={form.occasion_name || ""} placeholder="International Day of Forests" onChange={(e) => updateField("occasion_name", e.target.value)} /></label>
                <label>Month<input type="number" min="1" max="12" value={form.occasion_month || ""} onChange={(e) => updateField("occasion_month", e.target.value)} /></label>
                <label>Day<input type="number" min="1" max="31" value={form.occasion_day || ""} onChange={(e) => updateField("occasion_day", e.target.value)} /></label>
                <label>Window<input type="number" min="0" max="14" value={form.event_window_days} onChange={(e) => updateField("event_window_days", e.target.value)} /></label>
              </div>

              <label className="toggle-line"><input type="checkbox" checked={form.is_active} onChange={(e) => updateField("is_active", e.target.checked)} /> Active challenge</label>

              <div className="editor-actions">
                <button type="submit" disabled={saving}>{saving ? "Saving..." : editingId ? "Save changes" : "Create challenge"}</button>
                {editingId && <button type="button" className="secondary" onClick={resetForm}>Cancel edit</button>}
              </div>
            </form>
          </section>

          <section className="admin-challenge-list-card">
            <div className="admin-list-header">
              <div>
                <h2>All challenges</h2>
                <p>Seeded daily and environmental calendar challenges are already included.</p>
              </div>
              <form onSubmit={handleSearch} className="admin-search-form">
                <FaSearch />
                <input value={search} placeholder="Search challenges..." onChange={(e) => setSearch(e.target.value)} />
                <button>Search</button>
              </form>
            </div>

            {loading ? <InlineLoader text="Loading challenges..." /> : (
              <div className="admin-challenge-table-wrap">
                <table className="admin-challenge-table">
                  <thead>
                    <tr>
                      <th>Challenge</th>
                      <th>Reward</th>
                      <th>Category</th>
                      <th>Occasion</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((challenge) => (
                      <tr key={challenge.id}>
                        <td><strong>{challenge.title}</strong><span>{challenge.description}</span></td>
                        <td>{challenge.score_reward}</td>
                        <td>{challenge.category} · {challenge.difficulty}</td>
                        <td>{challenge.occasion_name ? `${challenge.occasion_name} (${challenge.occasion_month}/${challenge.occasion_day})` : "Daily"}</td>
                        <td><em className={challenge.is_active ? "active" : "inactive"}>{challenge.is_active ? "Active" : "Inactive"}</em></td>
                        <td>
                          <button onClick={() => handleEdit(challenge)} type="button">Edit</button>
                          <button className="danger" onClick={() => handleDelete(challenge)} type="button"><FaTrash /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

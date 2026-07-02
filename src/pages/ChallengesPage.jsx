import { useEffect, useMemo, useState } from "react";
import Sidebar from "../components/Sidebar";
import DashboardBackButton from "../components/DashboardBackButton";
import InlineLoader from "../components/InlineLoader";
import {
  getChallengeHistory,
  getChallengeShareTargets,
  getDailyChallenges,
  shareCompletedChallenge,
  submitChallengeProof,
} from "../api/challengeApi";
import {
  FaBicycle,
  FaBolt,
  FaCalendarAlt,
  FaCamera,
  FaCheckCircle,
  FaChevronRight,
  FaClock,
  FaCloudUploadAlt,
  FaCommentDots,
  FaFire,
  FaImage,
  FaLeaf,
  FaMedal,
  FaRecycle,
  FaSeedling,
  FaShareAlt,
  FaShoppingBag,
  FaTimes,
  FaTint,
  FaTree,
  FaUtensils,
  FaWater,
} from "react-icons/fa";
import "./ChallengesPage.css";

const iconMap = {
  leaf: FaLeaf,
  recycle: FaRecycle,
  water: FaTint,
  bolt: FaBolt,
  bike: FaBicycle,
  tree: FaTree,
  seedling: FaSeedling,
  ocean: FaWater,
  cleanup: FaRecycle,
  shopping: FaShoppingBag,
  food: FaUtensils,
};

const formatDateLabel = (dateString) => {
  if (!dateString) return "Today";
  return new Date(dateString).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
};

const formatCountdown = (totalSeconds) => {
  const safe = Math.max(0, Number(totalSeconds || 0));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = safe % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
};

function ChallengeIcon({ name }) {
  const Icon = iconMap[name] || FaLeaf;
  return <Icon />;
}

function CalendarStrip({ markedDays = [] }) {
  const marked = useMemo(() => {
    return new Map((markedDays || []).map((day) => [day.date, day.completed_count || 1]));
  }, [markedDays]);

  const days = useMemo(() => {
    const result = [];
    const today = new Date();
    for (let i = 13; i >= 0; i -= 1) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const iso = d.toISOString().slice(0, 10);
      result.push({
        iso,
        day: d.getDate(),
        label: d.toLocaleDateString(undefined, { weekday: "short" }).slice(0, 2),
        done: marked.has(iso),
        count: marked.get(iso) || 0,
      });
    }
    return result;
  }, [marked]);

  return (
    <div className="challenge-calendar-strip">
      {days.map((day) => (
        <div className={`challenge-calendar-day ${day.done ? "done" : ""}`} key={day.iso} title={`${day.iso}${day.done ? ` · ${day.count} completed` : ""}`}>
          <span>{day.label}</span>
          <strong>{day.day}</strong>
        </div>
      ))}
    </div>
  );
}

function SubmissionModal({ modal, onClose, onFileChange, onSubmit, submitting }) {
  if (!modal?.challenge) return null;

  const { challenge, file, preview, error, result } = modal;
  const approved = result?.approved;

  return (
    <div className="challenge-modal-backdrop" onMouseDown={onClose}>
      <div className="challenge-submit-modal" onMouseDown={(event) => event.stopPropagation()}>
        <button className="challenge-modal-close" onClick={onClose} type="button">
          <FaTimes />
        </button>

        <div className="submit-modal-header">
          <div className="submit-modal-icon"><ChallengeIcon name={challenge.icon} /></div>
          <div>
            <span>AI Proof Check</span>
            <h2>{challenge.title}</h2>
            <p>{challenge.proof_instructions || "Upload a clear photo showing the completed action."}</p>
          </div>
        </div>

        <label className={`proof-drop-zone ${preview ? "has-preview" : ""}`}>
          {preview ? (
            <img src={preview} alt="Proof preview" />
          ) : (
            <div>
              <FaCloudUploadAlt />
              <strong>Choose a proof photo</strong>
              <span>Use one clear image that shows today’s completed action.</span>
            </div>
          )}
          <input type="file" accept="image/*" onChange={(event) => onFileChange(event.target.files?.[0] || null)} />
        </label>

        {file && <div className="selected-proof-name"><FaImage /> {file.name}</div>}

        {(error || result) && (
          <div className={`verification-popup-message ${approved ? "success" : "error"}`}>
            <strong>{approved ? "Verified" : "Could not verify yet"}</strong>
            <span>
              {error || result?.message || result?.analysis?.feedback || "AI could not verify this proof yet. Upload a clearer photo showing the completed action."}
            </span>
            {result?.score_awarded > 0 && (
              <em>+{result.score_awarded} score · x{Number(result.streak_multiplier || 1).toFixed(2)} streak</em>
            )}
          </div>
        )}

        <div className="submit-modal-actions">
          <button className="modal-secondary-btn" type="button" onClick={onClose}>Cancel</button>
          <button className="modal-primary-btn" type="button" disabled={!file || submitting || approved} onClick={onSubmit}>
            {submitting ? "AI checking..." : approved ? "Reward earned" : "Submit proof"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ShareModal({ modal, targets, onClose, onShare, sharing }) {
  const [targetType, setTargetType] = useState("community");
  const [targetId, setTargetId] = useState("");
  const [note, setNote] = useState("");

  useEffect(() => {
    if (!modal?.challenge) return;
    const firstCommunity = targets?.communities?.[0]?.id;
    const firstUser = targets?.users?.[0]?.id;
    if (firstCommunity) {
      setTargetType("community");
      setTargetId(String(firstCommunity));
    } else if (firstUser) {
      setTargetType("user");
      setTargetId(String(firstUser));
    } else {
      setTargetId("");
    }
    setNote("");
  }, [modal?.challenge, targets]);

  if (!modal?.challenge) return null;

  const list = targetType === "community" ? targets?.communities || [] : targets?.users || [];

  return (
    <div className="challenge-modal-backdrop" onMouseDown={onClose}>
      <div className="challenge-share-modal" onMouseDown={(event) => event.stopPropagation()}>
        <button className="challenge-modal-close" onClick={onClose} type="button"><FaTimes /></button>
        <div className="share-modal-preview">
          {modal.challenge.proof_image_url ? <img src={modal.challenge.proof_image_url} alt="Completed challenge" /> : <div><FaLeaf /></div>}
          <div>
            <span>Share completed challenge</span>
            <h2>{modal.challenge.title}</h2>
            <p>{modal.challenge.description}</p>
          </div>
        </div>

        <div className="share-type-toggle">
          <button className={targetType === "community" ? "active" : ""} onClick={() => setTargetType("community")} type="button">Community</button>
          <button className={targetType === "user" ? "active" : ""} onClick={() => setTargetType("user")} type="button">Private user</button>
        </div>

        <label className="share-field">
          <span>Choose where to share</span>
          <select value={targetId} onChange={(event) => setTargetId(event.target.value)}>
            {list.length === 0 && <option value="">No targets available</option>}
            {list.map((item) => (
              <option value={item.id} key={`${targetType}-${item.id}`}>{item.name}</option>
            ))}
          </select>
        </label>

        <label className="share-field">
          <span>Optional message</span>
          <textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="Add a short note..." />
        </label>

        {modal.error && <div className="verification-popup-message error"><strong>Sharing failed</strong><span>{modal.error}</span></div>}
        {modal.success && <div className="verification-popup-message success"><strong>Shared</strong><span>{modal.success}</span></div>}

        <div className="submit-modal-actions">
          <button className="modal-secondary-btn" type="button" onClick={onClose}>Close</button>
          <button
            className="modal-primary-btn"
            type="button"
            disabled={!targetId || sharing}
            onClick={() => onShare({ target_type: targetType, [`${targetType}_id`]: Number(targetId), note: note.trim() || undefined })}
          >
            {sharing ? "Sharing..." : "Share now"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ChallengesPage() {
  const [payload, setPayload] = useState(null);
  const [history, setHistory] = useState([]);
  const [targets, setTargets] = useState({ communities: [], users: [] });
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [submittingId, setSubmittingId] = useState(null);
  const [submitModal, setSubmitModal] = useState(null);
  const [shareModal, setShareModal] = useState(null);
  const [sharing, setSharing] = useState(false);
  const [secondsUntilReset, setSecondsUntilReset] = useState(0);

  const challenges = payload?.challenges || [];
  const summary = payload?.summary || {};
  const progress = useMemo(() => {
    const total = Number(summary.daily_total || 5);
    const done = Number(summary.completed_today || 0);
    return total ? Math.round((done / total) * 100) : 0;
  }, [summary]);

  const loadChallenges = async () => {
    const data = await getDailyChallenges();
    setPayload(data);
    return data;
  };

  const loadHistory = async () => {
    const data = await getChallengeHistory({ limit: 40 });
    setHistory(data.items || []);
  };

  const loadTargets = async () => {
    try {
      const data = await getChallengeShareTargets();
      setTargets({ communities: data.communities || [], users: data.users || [] });
    } catch (err) {
      console.error("Failed to load share targets", err);
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        setPageError("");
        await Promise.all([loadChallenges(), loadHistory(), loadTargets()]);
      } catch (err) {
        console.error(err);
        setPageError(err?.response?.data?.message || "Failed to load challenges.");
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  useEffect(() => {
    const updateCountdown = () => {
      const resetAt = payload?.reset_at ? new Date(payload.reset_at).getTime() : new Date().setHours(24, 0, 0, 0);
      setSecondsUntilReset(Math.max(0, Math.floor((resetAt - Date.now()) / 1000)));
    };
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [payload?.reset_at]);

  const openSubmitModal = (challenge) => {
    // Always start with a clean upload state. Completed proof images stay in history/cards,
    // but the submit popup should never reopen with the previous selected file.
    setSubmitModal({ challenge, file: null, preview: null, error: "", result: null });
  };

  const closeSubmitModal = () => {
    if (submitModal?.preview && submitModal?.file) URL.revokeObjectURL(submitModal.preview);
    setSubmitModal(null);
  };

  const handleModalFileChange = (file) => {
    setSubmitModal((prev) => {
      if (!prev) return prev;
      if (prev.preview && prev.file) URL.revokeObjectURL(prev.preview);
      return { ...prev, file, preview: file ? URL.createObjectURL(file) : null, error: "", result: null };
    });
  };

  const handleSubmit = async () => {
    if (!submitModal?.challenge) return;
    if (!submitModal.file) {
      setSubmitModal((prev) => ({ ...prev, error: "Choose a proof photo first." }));
      return;
    }

    try {
      setSubmittingId(submitModal.challenge.id);
      setSubmitModal((prev) => ({ ...prev, error: "", result: null }));
      const data = await submitChallengeProof(submitModal.challenge.id, submitModal.file);
      setSubmitModal((prev) => ({ ...prev, result: data, error: data.approved ? "" : data.message }));
      await Promise.all([loadChallenges(), loadHistory()]);
      window.dispatchEvent(new Event("notifications-updated"));
    } catch (err) {
      console.error(err);
      setSubmitModal((prev) => ({
        ...prev,
        error: err?.response?.data?.message || "AI could not verify this proof yet. Upload a clearer photo showing the completed action.",
      }));
    } finally {
      setSubmittingId(null);
    }
  };

  const openShareModal = (challenge) => {
    setShareModal({ challenge, error: "", success: "" });
  };

  const handleShare = async (sharePayload) => {
    if (!shareModal?.challenge?.user_challenge_id) return;

    try {
      setSharing(true);
      setShareModal((prev) => ({ ...prev, error: "", success: "" }));
      const data = await shareCompletedChallenge(shareModal.challenge.user_challenge_id, sharePayload);
      setShareModal((prev) => ({ ...prev, success: data.message || "Completed challenge shared." }));
      await loadHistory();
      window.dispatchEvent(new Event("notifications-updated"));
    } catch (err) {
      console.error(err);
      setShareModal((prev) => ({ ...prev, error: err?.response?.data?.message || "Failed to share challenge." }));
    } finally {
      setSharing(false);
    }
  };

  return (
    <div className="challenges-layout">
      <Sidebar />
      <main className="challenges-main">
        <DashboardBackButton />
        <div className="challenges-container">
          {loading ? (
            <InlineLoader text="Loading daily challenges..." subtext="Selecting five short eco actions for you." />
          ) : pageError ? (
            <div className="challenge-page-error">{pageError}</div>
          ) : (
            <>
              <section className="challenges-hero refined">
                <div className="challenges-hero-copy">
                  <span className="challenges-kicker"><FaMedal /> Daily Eco Quests</span>
                  <h1>Five small actions. Real impact today.</h1>
                  <p>
                    Each challenge is designed to be finished today and verified with one clear photo. Your streak increases the score you earn.
                  </p>
                </div>
                <div className="daily-progress-card">
                  <div className="progress-ring" style={{ "--progress": `${progress}%` }}>
                    <span>{progress}%</span>
                  </div>
                  <div>
                    <strong>{summary.completed_today || 0}/{summary.daily_total || 5} completed</strong>
                    <p>Level {summary.level || 1} · {summary.total_score || 0} score</p>
                  </div>
                </div>
              </section>

              <section className="challenge-widgets-grid">
                <article className="challenge-widget reset-widget">
                  <FaClock />
                  <span>Time until reset</span>
                  <strong>{formatCountdown(secondsUntilReset)}</strong>
                  <small>New 5 challenges at midnight</small>
                </article>
                <article className="challenge-widget streak-widget">
                  <FaFire />
                  <span>Daily streak</span>
                  <strong>{summary.streak_days || 0} days</strong>
                  <small>Next reward multiplier x{Number(summary.streak_multiplier || 1).toFixed(2)}</small>
                </article>
                <article className="challenge-widget calendar-widget">
                  <div className="calendar-widget-title"><FaCalendarAlt /><span>Green days</span><small>Last 14 days</small></div>
                  <CalendarStrip markedDays={summary.calendar_days || []} />
                </article>
              </section>

              <section className="daily-challenge-grid refined-grid">
                {challenges.map((challenge) => {
                  const isDone = challenge.status === "completed" || challenge.completed;

                  return (
                    <article key={challenge.user_challenge_id || challenge.id} className={`daily-challenge-card refined-card ${isDone ? "completed" : ""}`}>
                      <div className="challenge-card-top">
                        <div className="challenge-icon"><ChallengeIcon name={challenge.icon} /></div>
                        <div>
                          <div className="challenge-card-tags">
                            <span className={`difficulty-pill ${challenge.difficulty}`}>{challenge.difficulty}</span>
                            <span className="category-pill">{challenge.category}</span>
                          </div>
                          <h2>{challenge.title}</h2>
                        </div>
                      </div>

                      {challenge.occasion_name && <div className="occasion-badge">{challenge.occasion_name}</div>}

                      <p className="challenge-description">{challenge.description}</p>

                      <div className="proof-instructions">
                        <FaCamera />
                        <span>{challenge.proof_instructions || "Upload a clear photo showing that you completed the action today."}</span>
                      </div>

                      {isDone && challenge.proof_image_url && (
                        <div className="proof-preview compact-proof"><img src={challenge.proof_image_url} alt="Verified proof" /></div>
                      )}

                      <div className="challenge-card-footer enhanced-footer">
                        <div>
                          <div className="reward-pill"><FaMedal /> {challenge.score_reward} base</div>
                          <span className="multiplier-hint">Today: {challenge.estimated_reward_today || challenge.score_reward} score</span>
                        </div>
                        <button className={`open-submit-btn ${isDone ? "done" : ""}`} type="button" disabled={isDone} onClick={() => openSubmitModal(challenge)}>
                          {isDone ? <><FaCheckCircle /> Completed</> : <><FaCloudUploadAlt /> Upload proof</>}
                        </button>
                      </div>
                    </article>
                  );
                })}
              </section>

              <section className="challenge-history-section">
                <div className="history-section-header">
                  <div>
                    <span><FaCommentDots /> Challenge History</span>
                    <h2>Your verified eco posts</h2>
                    <p>Completed challenges are saved like posts with the proof image, title, description, score, and share action.</p>
                  </div>
                </div>

                {history.length === 0 ? (
                  <div className="challenge-history-empty">
                    <FaLeaf />
                    <h3>No completed challenge posts yet</h3>
                    <p>Finish a daily challenge and it will appear here.</p>
                  </div>
                ) : (
                  <div className="challenge-history-grid">
                    {history.map((item) => (
                      <article className="challenge-post-card" key={item.user_challenge_id || `${item.id}-${item.completed_at}`}>
                        <div className="challenge-post-image">
                          {item.proof_image_url ? <img src={item.proof_image_url} alt={item.title} /> : <div><FaLeaf /></div>}
                        </div>
                        <div className="challenge-post-body">
                          <div className="challenge-post-meta">
                            <span>{formatDateLabel(item.completed_at || item.assigned_for_date)}</span>
                            <strong>+{item.score_awarded || item.estimated_reward_today || item.score_reward} score</strong>
                          </div>
                          <h3>{item.title}</h3>
                          <p>{item.description}</p>
                          <button className="share-challenge-btn" type="button" onClick={() => openShareModal(item)}>
                            <FaShareAlt /> Share in chat <FaChevronRight />
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </section>
            </>
          )}
        </div>
      </main>

      <SubmissionModal
        modal={submitModal}
        onClose={closeSubmitModal}
        onFileChange={handleModalFileChange}
        onSubmit={handleSubmit}
        submitting={Boolean(submittingId)}
      />

      <ShareModal
        modal={shareModal}
        targets={targets}
        onClose={() => setShareModal(null)}
        onShare={handleShare}
        sharing={sharing}
      />
    </div>
  );
}

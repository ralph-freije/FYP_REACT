import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import DashboardBackButton from "../components/DashboardBackButton";
import InlineLoader from "../components/InlineLoader";
import {
  getDailyChallenge,
  getGameSummary,
  getLeaderboards,
  rerollDailyChallenge,
  submitChallengeProof,
} from "../api/gameApi";
import {
  FaBolt,
  FaCamera,
  FaCrown,
  FaFire,
  FaLeaf,
  FaMedal,
  FaRedo,
  FaTrophy,
  FaUsers,
} from "react-icons/fa";
import "./GamePage.css";

export default function GamePage() {
  const [summary, setSummary] = useState(null);
  const [leaderboards, setLeaderboards] = useState({ users: [], communities: [] });
  const [challenge, setChallenge] = useState(null);
  const [proofFile, setProofFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadGame = async () => {
    const [summaryData, leaderboardData] = await Promise.all([
      getGameSummary(),
      getLeaderboards(),
    ]);
    setSummary(summaryData);
    setLeaderboards(leaderboardData);
    setChallenge(summaryData.challenge || null);
  };

  useEffect(() => {
    const init = async () => {
      try {
        await loadGame();
      } catch (err) {
        console.error(err);
        setError("Failed to load game progress.");
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const handleGenerate = async () => {
    setError("");
    setSuccess("");
    try {
      setActionLoading(true);
      const data = await getDailyChallenge();
      setChallenge(data.challenge);
      await loadGame();
    } catch (err) {
      console.error(err);
      setError("Failed to generate challenge.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReroll = async () => {
    setError("");
    setSuccess("");
    try {
      setActionLoading(true);
      const data = await rerollDailyChallenge();
      setChallenge(data.challenge);
      setSuccess(data.message || "Challenge rerolled.");
    } catch (err) {
      console.error(err);
      setError("Failed to reroll challenge.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmitProof = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!challenge?.id || !proofFile) {
      setError("Choose a photo proof first.");
      return;
    }

    try {
      setActionLoading(true);
      const formData = new FormData();
      formData.append("proof", proofFile);
      const data = await submitChallengeProof(challenge.id, formData);
      setChallenge(data.challenge);
      setProofFile(null);
      setSuccess(data.message || "Proof submitted.");
      await loadGame();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to submit proof.");
    } finally {
      setActionLoading(false);
    }
  };

  const player = summary?.player || { eco_score: 0, eco_level: 1, level_progress: 0 };

  return (
    <div className="game-layout">
      <Sidebar />
      <main className="game-main">
        <DashboardBackButton />
        <div className="game-container">
          {loading ? (
            <InlineLoader text="Loading game hub..." subtext="Preparing your score, level, challenge, and leaderboards." />
          ) : (
            <>
              <header className="game-hero">
                <div>
                  <span className="game-kicker"><FaFire /> EcoTrack Game Mode</span>
                  <h1>Level up sustainable habits</h1>
                  <p>Personal goals, community goals, and photo challenges now reward EcoScore and levels.</p>
                </div>
                <div className="player-card">
                  <FaCrown />
                  <div>
                    <span>Level {player.eco_level}</span>
                    <strong>{player.eco_score} score</strong>
                    <div className="level-bar"><i style={{ width: `${player.level_progress || 0}%` }} /></div>
                  </div>
                </div>
              </header>

              {(error || success) && (
                <div className={`game-alert ${error ? "error" : "success"}`}>
                  {error || success}
                </div>
              )}

              <section className="game-stat-grid">
                <div><FaLeaf /><span>Active Goals</span><strong>{summary?.active_goals || 0}</strong></div>
                <div><FaTrophy /><span>Completed Goals</span><strong>{summary?.completed_goals || 0}</strong></div>
                <div><FaBolt /><span>Daily Challenge</span><strong>{challenge ? challenge.status : "Ready"}</strong></div>
              </section>

              <section className="game-grid">
                <div className="challenge-card">
                  <div className="game-section-title">
                    <div>
                      <h2>Daily Eco Challenge</h2>
                      <p>Generate one challenge per 24h. You can reroll it up to 3 times.</p>
                    </div>
                    <button onClick={handleGenerate} disabled={actionLoading}>Generate</button>
                  </div>

                  {challenge ? (
                    <div className="challenge-body">
                      <span className={`difficulty ${challenge.difficulty}`}>{challenge.difficulty}</span>
                      <h3>{challenge.title}</h3>
                      <p>{challenge.description}</p>
                      <div className="challenge-reward"><FaMedal /> {challenge.score_reward} score reward</div>
                      <div className="challenge-actions">
                        <button className="outline" onClick={handleReroll} disabled={actionLoading || challenge.rerolls_left <= 0 || challenge.status === "completed"}>
                          <FaRedo /> Reroll ({challenge.rerolls_left} left)
                        </button>
                      </div>

                      <form className="proof-form" onSubmit={handleSubmitProof}>
                        <label>
                          <FaCamera /> Upload proof photo
                          <input type="file" accept="image/*" onChange={(e) => setProofFile(e.target.files?.[0] || null)} />
                        </label>
                        <button disabled={actionLoading || challenge.status === "completed"}>
                          {challenge.status === "completed" ? "Completed" : "Submit for AI Check"}
                        </button>
                      </form>

                      {challenge.ai_verdict && <div className="ai-verdict">{challenge.ai_verdict}</div>}
                    </div>
                  ) : (
                    <div className="challenge-empty">
                      <FaTrophy />
                      <h3>No challenge generated yet</h3>
                      <p>Click generate to receive a simple, fun eco quest.</p>
                    </div>
                  )}
                </div>

                <div className="leaderboard-card">
                  <div className="game-section-title compact"><h2>User Leaderboard</h2><FaTrophy /></div>
                  <div className="leaderboard-list">
                    {(leaderboards.users || []).map((user) => (
                      <div key={user.id}>
                        <span>#{user.rank}</span>
                        <strong>{user.name}</strong>
                        <em>Lv {user.eco_level} · {user.eco_score}</em>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="leaderboard-card community-board">
                  <div className="game-section-title compact"><h2>Community Leaderboard</h2><FaUsers /></div>
                  <div className="leaderboard-list">
                    {(leaderboards.communities || []).map((community) => (
                      <div key={community.id}>
                        <span>#{community.rank}</span>
                        <strong>{community.name}</strong>
                        <em>{community.total_score} score</em>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

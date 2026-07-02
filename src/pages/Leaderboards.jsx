import { useEffect, useMemo, useState } from "react";
import Sidebar from "../components/Sidebar";
import DashboardBackButton from "../components/DashboardBackButton";
import InlineLoader from "../components/InlineLoader";
import UserAvatar from "../components/UserAvatar";
import { getLeaderboards } from "../api/leaderboardApi";
import {
  FaAward,
  FaBolt,
  FaBullseye,
  FaChartLine,
  FaLeaf,
  FaMedal,
  FaStar,
  FaTrophy,
  FaUsers,
} from "react-icons/fa";
import "./Leaderboards.css";

const rankLabel = (rank) => {
  if (rank === 1) return "Champion";
  if (rank === 2) return "Runner-up";
  if (rank === 3) return "Top 3";
  return `#${rank}`;
};

const ProgressRing = ({ value = 0, label = "LV" }) => {
  const progress = Math.min(100, Math.max(0, Number(value) || 0));

  return (
    <div className="lb-progress-ring" style={{ "--progress": `${progress}%` }}>
      <span>{label}</span>
    </div>
  );
};

const UserLeaderboardRow = ({ user, compact = false }) => (
  <div className={`lb-row user-lb-row rank-${user.rank || 0}`}>
    <div className="lb-rank-badge">
      {user.rank <= 3 ? <FaTrophy /> : <FaMedal />}
      <span>{user.rank}</span>
    </div>

    <UserAvatar
      src={user.profile_picture}
      name={user.name}
      className="lb-avatar"
    />

    <div className="lb-row-main">
      <div className="lb-name-line">
        <strong>{user.name}</strong>
        <span>{rankLabel(user.rank)}</span>
      </div>
      <p>
        Level {user.level || 1} · {Number(user.completed_goals || 0)} goals · {Number(user.completed_challenges || 0)} challenges
      </p>
      {!compact && (
        <div className="lb-level-bar">
          <div style={{ width: `${Math.min(100, Number(user.level_progress || 0))}%` }}></div>
        </div>
      )}
    </div>

    <div className="lb-score-pill">
      <FaBolt /> {Number(user.total_score || 0).toLocaleString()} pts
    </div>
  </div>
);

const CommunityLeaderboardRow = ({ community, compact = false }) => (
  <div className={`lb-row community-lb-row rank-${community.rank || 0}`}>
    <div className="lb-rank-badge community">
      {community.rank <= 3 ? <FaTrophy /> : <FaUsers />}
      <span>{community.rank}</span>
    </div>

    <div className="lb-community-avatar">
      {community.image ? <img src={community.image} alt={community.name} /> : <FaUsers />}
    </div>

    <div className="lb-row-main">
      <div className="lb-name-line">
        <strong>{community.name}</strong>
        <span>{rankLabel(community.rank)}</span>
      </div>
      <p>
        {Number(community.members_count || 0)} members · {Number(community.completed_goals || 0)} goal rewards · {Number(community.completed_challenges || 0)} challenge rewards
      </p>
      {!compact && (community.top_contributors || []).length > 0 && (
        <div className="lb-contributor-stack">
          {(community.top_contributors || []).slice(0, 4).map((contributor) => (
            <UserAvatar
              key={`${community.id}-${contributor.user_id}`}
              src={contributor.profile_picture}
              name={contributor.name}
              className="lb-mini-avatar"
              title={contributor.name}
            />
          ))}
        </div>
      )}
    </div>

    <div className="lb-score-pill community-score">
      <FaLeaf /> {Number(community.total_score || 0).toLocaleString()} pts
    </div>
  </div>
);

export default function Leaderboards() {
  const [leaderboards, setLeaderboards] = useState({
    users: [],
    communities: [],
    summary: {},
  });
  const [activeTab, setActiveTab] = useState("users");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadLeaderboards = async () => {
      try {
        const res = await getLeaderboards();
        setLeaderboards({
          users: res.data?.users || [],
          communities: res.data?.communities || [],
          summary: res.data?.summary || {},
        });
      } catch (err) {
        console.error(err);
        setError(err?.response?.data?.message || "Failed to load leaderboards.");
      } finally {
        setLoading(false);
      }
    };

    loadLeaderboards();
  }, []);

  const topUser = leaderboards.users?.[0];
  const topCommunity = leaderboards.communities?.[0];

  const totalVisibleScore = useMemo(() => {
    const userScore = (leaderboards.users || []).reduce(
      (sum, user) => sum + Number(user.total_score || 0),
      0
    );
    const communityScore = (leaderboards.communities || []).reduce(
      (sum, community) => sum + Number(community.total_score || 0),
      0
    );
    return { userScore, communityScore };
  }, [leaderboards]);

  return (
    <div className="leaderboards-layout">
      <Sidebar />

      <main className="leaderboards-main">
        <DashboardBackButton />

        <div className="leaderboards-container">
          <section className="leaderboards-hero">
            <div>
              <span className="leaderboards-kicker"><FaTrophy /> Score Leaderboards</span>
              <h1>EcoTrack Leaderboards</h1>
              <p>
                Rank users by EcoScore and communities by score earned from members’ completed goals and challenges.
              </p>
            </div>

            <div className="leaderboards-hero-ring">
              <ProgressRing value={topUser?.level_progress || 0} label={`LV ${topUser?.level || 1}`} />
              <div>
                <span>Top player</span>
                <strong>{topUser?.name || "No scores yet"}</strong>
                <p>{Number(topUser?.total_score || 0).toLocaleString()} pts</p>
              </div>
            </div>
          </section>

          {loading ? (
            <div className="leaderboard-loading-card">
              <InlineLoader
                text="Loading leaderboards..."
                subtext="Calculating scores, ranks, levels, and contributors."
              />
            </div>
          ) : error ? (
            <div className="leaderboard-error-card">{error}</div>
          ) : (
            <>
              <section className="leaderboard-stats-grid">
                <div className="leaderboard-stat-card">
                  <div className="leaderboard-stat-icon green"><FaUsers /></div>
                  <span>Ranked Users</span>
                  <strong>{Number(leaderboards.summary?.users_count || leaderboards.users.length).toLocaleString()}</strong>
                </div>

                <div className="leaderboard-stat-card">
                  <div className="leaderboard-stat-icon blue"><FaLeaf /></div>
                  <span>Ranked Communities</span>
                  <strong>{Number(leaderboards.summary?.communities_count || leaderboards.communities.length).toLocaleString()}</strong>
                </div>

                <div className="leaderboard-stat-card">
                  <div className="leaderboard-stat-icon orange"><FaBolt /></div>
                  <span>User Score Shown</span>
                  <strong>{Number(totalVisibleScore.userScore || 0).toLocaleString()}</strong>
                </div>

                <div className="leaderboard-stat-card">
                  <div className="leaderboard-stat-icon purple"><FaAward /></div>
                  <span>Community Score Shown</span>
                  <strong>{Number(totalVisibleScore.communityScore || 0).toLocaleString()}</strong>
                </div>
              </section>

              <section className="leaderboard-podium-grid">
                <div className="leaderboard-podium-card user-podium">
                  <div className="podium-heading">
                    <FaStar /> User Champion
                  </div>
                  {topUser ? (
                    <>
                      <UserAvatar src={topUser.profile_picture} name={topUser.name} className="podium-avatar" />
                      <h2>{topUser.name}</h2>
                      <p>Level {topUser.level || 1}</p>
                      <strong>{Number(topUser.total_score || 0).toLocaleString()} pts</strong>
                    </>
                  ) : (
                    <div className="leaderboard-empty-mini">No user scores yet.</div>
                  )}
                </div>

                <div className="leaderboard-podium-card community-podium">
                  <div className="podium-heading">
                    <FaLeaf /> Community Champion
                  </div>
                  {topCommunity ? (
                    <>
                      <div className="podium-community-avatar">
                        {topCommunity.image ? <img src={topCommunity.image} alt={topCommunity.name} /> : <FaUsers />}
                      </div>
                      <h2>{topCommunity.name}</h2>
                      <p>{Number(topCommunity.members_count || 0)} members</p>
                      <strong>{Number(topCommunity.total_score || 0).toLocaleString()} pts</strong>
                    </>
                  ) : (
                    <div className="leaderboard-empty-mini">No community scores yet.</div>
                  )}
                </div>
              </section>

              <section className="leaderboard-board-card">
                <div className="leaderboard-tabs">
                  <button
                    type="button"
                    className={activeTab === "users" ? "active" : ""}
                    onClick={() => setActiveTab("users")}
                  >
                    <FaMedal /> User Leaderboard
                  </button>
                  <button
                    type="button"
                    className={activeTab === "communities" ? "active" : ""}
                    onClick={() => setActiveTab("communities")}
                  >
                    <FaUsers /> Community Leaderboard
                  </button>
                </div>

                {activeTab === "users" ? (
                  <div className="leaderboard-list">
                    {leaderboards.users.length === 0 ? (
                      <div className="leaderboard-empty-state">
                        <FaBullseye />
                        <h3>No ranked users yet</h3>
                        <p>Complete goals or challenges to earn score and appear here.</p>
                      </div>
                    ) : (
                      leaderboards.users.map((user) => (
                        <UserLeaderboardRow key={user.user_id} user={user} />
                      ))
                    )}
                  </div>
                ) : (
                  <div className="leaderboard-list">
                    {leaderboards.communities.length === 0 ? (
                      <div className="leaderboard-empty-state">
                        <FaUsers />
                        <h3>No ranked communities yet</h3>
                        <p>Join communities and complete goals or challenges to start building a score.</p>
                      </div>
                    ) : (
                      leaderboards.communities.map((community) => (
                        <CommunityLeaderboardRow key={community.community_id} community={community} />
                      ))
                    )}
                  </div>
                )}
              </section>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

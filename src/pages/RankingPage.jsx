import { useEffect, useMemo, useState } from "react";
import { assertSupabase, isSupabaseConfigured } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import FriendCard from "../components/FriendCard";

export default function RankingPage() {
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [activeTab, setActiveTab] = useState("ranking");
  const [search, setSearch] = useState("");
  const [searchResult, setSearchResult] = useState(null);
  const [statusMessage, setStatusMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  const emptyText = useMemo(
    () =>
      activeTab === "ranking"
        ? "Aún no tienes amistades aceptadas. Invita a alguien para empezar el ranking."
        : "No tienes solicitudes pendientes por ahora.",
    [activeTab],
  );

  useEffect(() => {
    if (!user || !isSupabaseConfigured) {
      setLoading(false);
      return undefined;
    }

    const client = assertSupabase();

    async function loadRanking() {
      setLoading(true);

      try {
        const [outgoingAccepted, incomingAccepted, incomingPending] = await Promise.all([
          client.from("friendships").select("*").eq("user_id", user.id).eq("status", "accepted"),
          client.from("friendships").select("*").eq("friend_id", user.id).eq("status", "accepted"),
          client.from("friendships").select("*").eq("friend_id", user.id).eq("status", "pending"),
        ]);

        if (outgoingAccepted.error) throw outgoingAccepted.error;
        if (incomingAccepted.error) throw incomingAccepted.error;
        if (incomingPending.error) throw incomingPending.error;

        const friendIds = [
          ...(outgoingAccepted.data ?? []).map((row) => row.friend_id),
          ...(incomingAccepted.data ?? []).map((row) => row.user_id),
          user.id,
        ];

        const uniqueIds = [...new Set(friendIds)];
        const leaderboardResponse = await client
          .from("profiles")
          .select("id, username, avatar_url, total_points, current_streak")
          .in("id", uniqueIds)
          .order("total_points", { ascending: false });

        if (leaderboardResponse.error) throw leaderboardResponse.error;
        setLeaderboard(leaderboardResponse.data ?? []);

        const requesterIds = (incomingPending.data ?? []).map((row) => row.user_id);
        if (!requesterIds.length) {
          setPendingRequests([]);
        } else {
          const requesterProfiles = await client
            .from("profiles")
            .select("id, username, avatar_url, total_points, current_streak")
            .in("id", requesterIds);

          if (requesterProfiles.error) throw requesterProfiles.error;

          const profileMap = new Map((requesterProfiles.data ?? []).map((profile) => [profile.id, profile]));
          setPendingRequests(
            (incomingPending.data ?? [])
              .map((row) => ({
                ...row,
                requester: profileMap.get(row.user_id),
              }))
              .filter((row) => row.requester),
          );
        }
      } finally {
        setLoading(false);
      }
    }

    loadRanking();

    const channel = client
      .channel(`ranking:${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, loadRanking)
      .on("postgres_changes", { event: "*", schema: "public", table: "friendships" }, loadRanking)
      .subscribe();

    return () => {
      client.removeChannel(channel);
    };
  }, [user, reloadKey]);

  async function handleSearch(event) {
    event.preventDefault();
    setStatusMessage("");

    if (!search.trim() || !user) {
      return;
    }

    const client = assertSupabase();
    const { data, error } = await client
      .from("profiles")
      .select("id, username, avatar_url, total_points, current_streak")
      .ilike("username", search.trim().toLowerCase())
      .neq("id", user.id)
      .maybeSingle();

    if (error && error.code !== "PGRST116") {
      setStatusMessage(error.message);
      return;
    }

    if (!data) {
      setSearchResult(null);
      setStatusMessage("No encontramos a ese usuario.");
      return;
    }

    setSearchResult(data);
  }

  async function sendFriendRequest() {
    if (!searchResult || !user) {
      return;
    }

    const client = assertSupabase();
    const [direct, reverse] = await Promise.all([
      client
        .from("friendships")
        .select("id, status")
        .eq("user_id", user.id)
        .eq("friend_id", searchResult.id)
        .maybeSingle(),
      client
        .from("friendships")
        .select("id, status")
        .eq("user_id", searchResult.id)
        .eq("friend_id", user.id)
        .maybeSingle(),
    ]);

    if (direct.error && direct.error.code !== "PGRST116") throw direct.error;
    if (reverse.error && reverse.error.code !== "PGRST116") throw reverse.error;

    if (direct.data || reverse.data) {
      setStatusMessage("Ya existe una relación o solicitud entre ustedes.");
      return;
    }

    const { error } = await client.from("friendships").insert({
      user_id: user.id,
      friend_id: searchResult.id,
      status: "pending",
    });

    if (error) {
      setStatusMessage(error.message);
      return;
    }

    setStatusMessage(`Solicitud enviada a ${searchResult.username}.`);
    setSearchResult(null);
    setSearch("");
    setReloadKey((current) => current + 1);
  }

  async function acceptRequest(requestId) {
    const client = assertSupabase();
    const { error } = await client
      .from("friendships")
      .update({ status: "accepted" })
      .eq("id", requestId)
      .eq("friend_id", user.id);

    if (error) {
      setStatusMessage(error.message);
      return;
    }

    setStatusMessage("Solicitud aceptada.");
    setReloadKey((current) => current + 1);
  }

  async function rejectRequest(requestId) {
    const client = assertSupabase();
    const { error } = await client
      .from("friendships")
      .delete()
      .eq("id", requestId)
      .eq("friend_id", user.id);

    if (error) {
      setStatusMessage(error.message);
      return;
    }

    setStatusMessage("Solicitud rechazada.");
    setReloadKey((current) => current + 1);
  }

  if (!isSupabaseConfigured) {
    return (
      <section className="glass-card p-6 text-sm font-semibold text-slate-600 dark:text-slate-200">
        Configura Supabase para usar el ranking en tiempo real.
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <div className="glass-card p-6 sm:p-8">
        <p className="text-sm font-black uppercase tracking-[0.35em] text-slate-400">Comunidad</p>
        <h2 className="mt-3 text-4xl font-black text-slate-900 dark:text-white">Aprender también es social</h2>
        <p className="mt-4 max-w-3xl text-base font-semibold text-slate-500 dark:text-slate-300">
          Busca amigos por nombre de usuario, envía solicitudes y sigue sus puntos en tiempo real con Supabase Realtime.
        </p>

        <form onSubmit={handleSearch} className="mt-6 grid gap-3 sm:grid-cols-[1fr_auto]">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="w-full rounded-[20px] border border-slate-200 bg-white px-4 py-3 font-semibold outline-none transition focus:border-brand-blue dark:border-slate-700 dark:bg-slate-900"
            placeholder="Buscar por username"
          />
          <button
            type="submit"
            className="pill-button bg-slate-900 text-white hover:bg-slate-700 dark:bg-white dark:text-slate-900"
          >
            Buscar
          </button>
        </form>

        {searchResult ? (
          <div className="mt-4 rounded-[24px] border border-slate-200 p-4 dark:border-slate-700">
            <FriendCard friend={searchResult} />
            <button
              type="button"
              onClick={sendFriendRequest}
              className="pill-button mt-4 bg-brand-green text-slate-950 hover:brightness-110"
            >
              Enviar solicitud
            </button>
          </div>
        ) : null}

        {statusMessage ? (
          <p className="mt-4 text-sm font-semibold text-slate-500 dark:text-slate-300">{statusMessage}</p>
        ) : null}
      </div>

      <div className="flex gap-3 rounded-full bg-white/80 p-1 shadow-soft backdrop-blur dark:bg-slate-900/80">
        <button
          type="button"
          onClick={() => setActiveTab("ranking")}
          className={`pill-button flex-1 ${activeTab === "ranking" ? "bg-slate-900 text-white dark:bg-brand-green dark:text-slate-950" : "text-slate-500"}`}
        >
          Ranking
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("pending")}
          className={`pill-button flex-1 ${activeTab === "pending" ? "bg-slate-900 text-white dark:bg-brand-green dark:text-slate-950" : "text-slate-500"}`}
        >
          Solicitudes pendientes
        </button>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="glass-card p-6 text-sm font-semibold text-slate-500 dark:text-slate-300">
            Cargando datos del ranking...
          </div>
        ) : activeTab === "ranking" ? (
          leaderboard.length ? (
            leaderboard.map((friend) => (
              <FriendCard key={friend.id} friend={friend} isCurrentUser={friend.id === user.id} />
            ))
          ) : (
            <div className="glass-card p-6 text-sm font-semibold text-slate-500 dark:text-slate-300">{emptyText}</div>
          )
        ) : pendingRequests.length ? (
          pendingRequests.map((request) => (
            <div key={request.id} className="glass-card p-4">
              <FriendCard friend={request.requester} />
              <div className="mt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => acceptRequest(request.id)}
                  className="pill-button bg-brand-green text-slate-950 hover:brightness-110"
                >
                  Aceptar
                </button>
                <button
                  type="button"
                  onClick={() => rejectRequest(request.id)}
                  className="pill-button bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-white"
                >
                  Rechazar
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="glass-card p-6 text-sm font-semibold text-slate-500 dark:text-slate-300">{emptyText}</div>
        )}
      </div>
    </section>
  );
}

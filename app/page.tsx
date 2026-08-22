"use client";
import { useEffect, useRef, useState } from "react";
import { roomTopic, supabase } from "@/lib/supabase";
type View =
  | "live"
  | "activities"
  | "bank"
  | "courses"
  | "assignments"
  | "qna"
  | "gamehub"
  | "radar"
  | "reports"
  | "admin"
  | "integrations"
  | "settings";
type AppMode = "landing" | "teacher" | "student" | "student-dashboard";
type AuthIntent = "student" | "instructor";
type Identity = {
  id: string;
  email: string;
  fullName: string;
  role: AuthIntent;
};
type QuestionKind =
  | "choice"
  | "multiple"
  | "truefalse"
  | "open"
  | "ranking"
  | "scale"
  | "pin"
  | "code";
type AccessibilityPrefs = {
  contrast: boolean;
  large: boolean;
  motion: boolean;
  labels: boolean;
  readAloud: boolean;
  extraTime: boolean;
  focus: boolean;
  hints: boolean;
};
type GameType =
  | "Quiz"
  | "Anket"
  | "Kelime Bulutu"
  | "Takım Arenası"
  | "Hızlı Görev";
type Question = {
  q: string;
  a: string[];
  correct: number;
  corrects?: number[];
  seconds?: number;
  image?: string;
  kind?: QuestionKind;
  outcome?: string;
  bloom?: string;
  points?: number;
  pinX?: number;
  pinY?: number;
};
type Activity = {
  id: number | string;
  type: GameType;
  title: string;
  questions: number;
  plays: number;
  accent: string;
  content?: Question[];
  shuffle?: boolean;
};
const starters: Activity[] = [
  {
    id: 1,
    type: "Quiz",
    title: "Araştırma Yöntemleri",
    questions: 8,
    plays: 124,
    accent: "#d70926",
  },
  {
    id: 2,
    type: "Anket",
    title: "Ders Sonu Nabız",
    questions: 4,
    plays: 89,
    accent: "#6c4df6",
  },
  {
    id: 3,
    type: "Takım Arenası",
    title: "Sürdürülebilir Kampüs",
    questions: 5,
    plays: 72,
    accent: "#f5a524",
  },
  {
    id: 4,
    type: "Kelime Bulutu",
    title: "Üniversite Deneyimi",
    questions: 1,
    plays: 156,
    accent: "#159a80",
  },
];
const types: { type: GameType; icon: string; desc: string; color: string }[] = [
  {
    type: "Quiz",
    icon: "◆",
    desc: "Çoktan seçmeli sorular ve hız puanı",
    color: "#d70926",
  },
  {
    type: "Anket",
    icon: "▥",
    desc: "Sınıfın görüşünü anında ölç",
    color: "#6c4df6",
  },
  {
    type: "Kelime Bulutu",
    icon: "◌",
    desc: "Fikirleri canlı bulutta birleştir",
    color: "#159a80",
  },
  {
    type: "Takım Arenası",
    icon: "♛",
    desc: "Grupları karşı karşıya getir",
    color: "#f5a524",
  },
  {
    type: "Hızlı Görev",
    icon: "✦",
    desc: "Rastgele katılımcı ve süreli görev",
    color: "#ec4899",
  },
];
const validateParticipantName = (value: string) => {
  const clean = value.trim().replace(/\s+/g, " ");
  if (!clean) return "Görünen adını yazmalısın.";
  if (clean.length < 2) return "Görünen ad en az 2 karakter olmalı.";
  if (clean.length > 24) return "Görünen ad en fazla 24 karakter olabilir.";
  if (!/^[a-zA-ZçÇğĞıİöÖşŞüÜ0-9._ -]+$/.test(clean))
    return "Yalnızca harf, rakam, boşluk, nokta, tire ve alt çizgi kullan.";
  if ((clean.match(/[a-zA-ZçÇğĞıİöÖşŞüÜ]/g) || []).length < 2)
    return "Görünen ad en az iki harf içermeli.";
  if (/(.)\1{3,}/i.test(clean)) return "Aynı karakteri art arda kullanma.";
  const normalized = clean
    .toLocaleLowerCase("tr-TR")
    .replace(/[._ -]/g, "")
    .replace(/0/g, "o")
    .replace(/1/g, "i")
    .replace(/3/g, "e")
    .replace(/4/g, "a")
    .replace(/5/g, "s")
    .replace(/7/g, "t");
  const blocked = [
    "amk",
    "aq",
    "orospu",
    "siktir",
    "sik",
    "yarrak",
    "yarak",
    "amcik",
    "amcık",
    "got",
    "göt",
    "meme",
    "porno",
    "porn",
    "seks",
    "sex",
    "nude",
    "escort",
    "ibne",
    "pic",
    "piç",
    "kahpe",
    "gerizekali",
    "gerizekalı",
    "salak",
    "aptal",
  ];
  if (blocked.some((word) => normalized.includes(word)))
    return "Bu görünen ad sınıf güvenliği filtresine takıldı.";
  const reserved = [
    "admin",
    "yonetici",
    "yönetici",
    "moderator",
    "moderatör",
    "sistem",
  ];
  if (reserved.includes(normalized))
    return "Bu ad sistem rolleri için ayrılmıştır.";
  return "";
};
const quiz = [
  {
    q: "Bir araştırma hipotezinin temel özelliği nedir?",
    a: [
      "Test edilebilir olması",
      "Uzun olması",
      "Kesin doğru olması",
      "Kaynak içermemesi",
    ],
    correct: 0,
  },
  {
    q: "Akademik bir sunumun girişinde öncelik nedir?",
    a: [
      "Problemi çerçevelemek",
      "Tüm sonucu vermek",
      "Kaynakçayı okumak",
      "Süreyi doldurmak",
    ],
    correct: 0,
  },
  {
    q: "Takım çalışmasında psikolojik güven ne sağlar?",
    a: [
      "Fikir paylaşma cesareti",
      "Daha fazla hiyerarşi",
      "Daha uzun toplantı",
      "Bireysel rekabet",
    ],
    correct: 0,
  },
];
export default function Home() {
  const [mode, setMode] = useState<AppMode>("landing"),
    [view, setView] = useState<View>("live"),
    [activities, setActivities] = useState(starters),
    [builder, setBuilder] = useState(false),
    [editing, setEditing] = useState<Activity | null>(null),
    [playing, setPlaying] = useState<GameType | null>(null),
    [selected, setSelected] = useState(starters[0]),
    [code, setCode] = useState(""),
    [studentName, setStudentName] = useState(""),
    [toast, setToast] = useState(""),
    [identity, setIdentity] = useState<Identity | null>(null),
    [authLoading, setAuthLoading] = useState(true),
    [authOpen, setAuthOpen] = useState(false),
    [authIntent, setAuthIntent] = useState<AuthIntent>("student"),
    [authError, setAuthError] = useState(""),
    [notificationsOpen, setNotificationsOpen] = useState(false),
    [unread, setUnread] = useState(3),
    [accessibility, setAccessibility] = useState<AccessibilityPrefs>({
      contrast: false,
      large: false,
      motion: false,
      labels: true,
      readAloud: false,
      extraTime: false,
      focus: false,
      hints: false,
    });
  useEffect(() => {
    const resolveIdentity = async (
      user: {
        id: string;
        email?: string;
        user_metadata?: Record<string, unknown>;
      } | null,
    ) => {
      if (!user) {
        setIdentity(null);
        setAuthLoading(false);
        return;
      }
      const email = (user.email || "").trim().toLocaleLowerCase("tr-TR");
      if (!email.endsWith("@dogus.edu.tr")) {
        await supabase.auth.signOut();
        setAuthError(
          "Yalnızca @dogus.edu.tr uzantılı kurumsal hesaplar kabul edilir.",
        );
        setAuthOpen(true);
        setAuthLoading(false);
        return;
      }
      const { data: profile, error } = await supabase
        .from("dou_user_profiles")
        .select("role,full_name")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error || !profile) {
        setAuthError("Kurumsal profil hazırlanamadı. Lütfen tekrar deneyin.");
        setAuthOpen(true);
        setAuthLoading(false);
        return;
      }
      const fullName =
        profile.full_name ||
        String(
          user.user_metadata?.full_name || user.user_metadata?.name || "",
        ) ||
        email.split("@")[0].replace(/[._]/g, " ");
      const nextIdentity: Identity = {
        id: user.id,
        email,
        fullName,
        role: profile.role === "instructor" ? "instructor" : "student",
      };
      setIdentity(nextIdentity);
      setAuthOpen(false);
      setAuthError("");
      setStudentName(fullName.slice(0, 24));
      setAuthLoading(false);

      const pendingIntent = localStorage.getItem(
        "dou-auth-intent",
      ) as AuthIntent | null;
      const pendingJoin = sessionStorage.getItem("dou-pending-join");
      localStorage.removeItem("dou-auth-intent");
      if (pendingJoin) {
        sessionStorage.removeItem("dou-pending-join");
        setCode(pendingJoin);
        setMode("student");
      } else if (pendingIntent === "instructor") {
        if (nextIdentity.role === "instructor") setMode("teacher");
        else {
          setMode("student-dashboard");
          setAuthError(
            "Bu hesap öğrenci rolünde. Akademisyen yetkisini sistem yöneticisi tanımlar.",
          );
          setAuthOpen(true);
        }
      } else if (pendingIntent === "student") setMode("student-dashboard");
    };
    supabase.auth
      .getSession()
      .then(({ data }) => resolveIdentity(data.session?.user || null));
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        window.setTimeout(() => resolveIdentity(session?.user || null), 0);
      },
    );
    return () => authListener.subscription.unsubscribe();
  }, []);
  useEffect(() => {
    try {
      const saved = localStorage.getItem("dou-activities");
      if (saved) setActivities(JSON.parse(saved));
    } catch {}
    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!session?.user) return;
        const { data } = await supabase
          .from("dou_activities")
          .select("id,title,game_type,content,outcome_map")
          .eq("owner_id", session.user.id)
          .order("updated_at", { ascending: false });
        if (data?.length) {
          const restored: Activity[] = data.map((a, i) => ({
            id: a.id,
            title: a.title,
            type: a.game_type as GameType,
            content: Array.isArray(a.content) ? (a.content as Question[]) : [],
            questions: Array.isArray(a.content) ? a.content.length : 0,
            plays: 0,
            accent:
              types.find((t) => t.type === a.game_type)?.color ||
              ["#d70926", "#6c4df6", "#159a80"][i % 3],
            shuffle: Boolean(
              (a.outcome_map as { shuffle?: boolean } | null)?.shuffle,
            ),
          }));
          setActivities(restored);
          setSelected(restored[0]);
          notify(`${restored.length} bulut etkinliği geri yüklendi`);
        }
      },
    );
    return () => listener.subscription.unsubscribe();
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem("dou-activities", JSON.stringify(activities));
    } catch {}
  }, [activities]);
  useEffect(() => {
    document.body.classList.toggle("high-contrast", accessibility.contrast);
    document.body.classList.toggle("large-ui", accessibility.large);
    document.body.classList.toggle("reduce-motion", accessibility.motion);
    try {
      localStorage.setItem("dou-accessibility", JSON.stringify(accessibility));
    } catch {}
  }, [accessibility]);
  const notify = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(""), 2200);
  };
  const requestLogin = (intent: AuthIntent) => {
    setAuthIntent(intent);
    setAuthError("");
    setAuthOpen(true);
  };
  const signOut = async () => {
    await supabase.auth.signOut();
    setIdentity(null);
    setMode("landing");
    notify("Kurumsal oturum kapatıldı");
  };
  if (mode === "student")
    return (
      <StudentStage
        name={studentName}
        code={code || "481 209"}
        onExit={() => setMode(identity ? "student-dashboard" : "landing")}
      />
    );
  if (mode === "student-dashboard" && identity)
    return (
      <StudentDashboard
        identity={identity}
        code={code}
        setCode={setCode}
        join={() => {
          const clean = code.replace(/\s/g, "");
          if (!/^\d{5,6}$/.test(clean)) {
            notify("5 veya 6 haneli oturum kodunu gir");
            return;
          }
          setMode("student");
        }}
        exit={() => setMode("landing")}
        signOut={signOut}
        toast={toast}
      />
    );
  if (mode === "landing")
    return (
      <>
        <Landing
          code={code}
          setCode={setCode}
          name={identity?.fullName.slice(0, 24) || studentName}
          setName={setStudentName}
          identity={identity}
          studentLogin={() =>
            identity ? setMode("student-dashboard") : requestLogin("student")
          }
          teacher={() => {
            if (identity?.role === "instructor") setMode("teacher");
            else requestLogin("instructor");
          }}
          join={() => {
            const clean = code.replace(/\s/g, "");
            if (!/^\d{5,6}$/.test(clean)) {
              notify("5 veya 6 haneli oturum kodunu gir");
              return;
            }
            if (!identity) {
              sessionStorage.setItem("dou-pending-join", clean);
              requestLogin("student");
              return;
            }
            setStudentName(identity.fullName.slice(0, 24));
            setMode("student");
          }}
          toast={toast}
        />
        {authOpen && (
          <MicrosoftAuthDialog
            intent={authIntent}
            setIntent={setAuthIntent}
            loading={authLoading}
            error={authError}
            close={() => {
              setAuthOpen(false);
              setAuthError("");
            }}
          />
        )}
      </>
    );
  if (!identity || identity.role !== "instructor") {
    return (
      <main className="auth-guard">
        <div>
          <b>Akademisyen yetkisi gerekli</b>
          <button
            onClick={() => {
              setMode("landing");
              requestLogin("instructor");
            }}
          >
            Kurumsal girişe dön
          </button>
        </div>
      </main>
    );
  }
  return (
    <main className="app-shell">
      <Sidebar view={view} setView={setView} exit={() => setMode("landing")} />
      <section className="workspace">
        <header className="workspace-head">
          <div>
            <span className="overline">DOĞUŞ ÜNİVERSİTESİ · DERS AKTİF</span>
            <h1>
              {
                (
                  {
                    live: "Sınıf hazır. Oyunu başlatalım.",
                    activities: "Etkinlik stüdyosu",
                    bank: "Ortak soru bankası",
                    courses: "Dersler ve sınıflar",
                    assignments: "Ödevler ve bağımsız çalışmalar",
                    qna: "Canlı soru & cevap",
                    gamehub: "Oyunlaştırma merkezi",
                    radar: "DOU Öğrenme Radarı",
                    reports: "Ders raporları",
                    admin: "Kurumsal yönetim",
                    integrations: "Kurumsal bağlantılar",
                    settings: "Deneyim ayarları",
                  } as Record<View, string>
                )[view]
              }
            </h1>
          </div>
          <div className="head-actions">
            <div className="account-chip">
              <span>
                {identity.fullName.charAt(0).toLocaleUpperCase("tr-TR")}
              </span>
              <div>
                <b>{identity.fullName}</b>
                <small>Öğretim görevlisi</small>
              </div>
              <button onClick={signOut} aria-label="Oturumu kapat">
                ↪
              </button>
            </div>
            <button
              className="icon-button"
              aria-label="Bildirimleri aç"
              onClick={() => setNotificationsOpen((v) => !v)}
            >
              🔔{unread > 0 && <i>{unread}</i>}
            </button>
            <button
              className="soft-button"
              onClick={() => {
                setEditing(null);
                setBuilder(true);
              }}
            >
              ＋ Etkinlik oluştur
            </button>
            {notificationsOpen && (
              <div className="notification-center">
                <header>
                  <div>
                    <b>Bildirimler</b>
                    <small>{unread} okunmamış</small>
                  </div>
                  <button onClick={() => setNotificationsOpen(false)}>×</button>
                </header>
                <button className="notification-item">
                  <i className="n-live">●</i>
                  <span>
                    <b>Canlı oturum hazır</b>
                    <small>481 209 kodlu deneme sınıfı başlatılabilir.</small>
                    <em>Şimdi</em>
                  </span>
                </button>
                <button className="notification-item">
                  <i>◆</i>
                  <span>
                    <b>Yeni rapor oluştu</b>
                    <small>
                      Araştırma Yöntemleri etkinlik sonuçları hazır.
                    </small>
                    <em>12 dk önce</em>
                  </span>
                </button>
                <button className="notification-item">
                  <i>✦</i>
                  <span>
                    <b>Katılım yükseldi</b>
                    <small>Bu hafta sınıf katılımı %18 arttı.</small>
                    <em>Bugün</em>
                  </span>
                </button>
                <footer>
                  <button onClick={() => setUnread(0)}>
                    ✓ Tümünü okundu işaretle
                  </button>
                  <button
                    onClick={() => {
                      setView("reports");
                      setNotificationsOpen(false);
                    }}
                  >
                    Raporlara git →
                  </button>
                </footer>
              </div>
            )}
          </div>
        </header>
        {view === "live" && (
          <Live
            activities={activities}
            selected={selected}
            select={setSelected}
            play={setPlaying}
            notify={notify}
          />
        )}{" "}
        {view === "activities" && (
          <Library
            activities={activities}
            create={() => {
              setEditing(null);
              setBuilder(true);
            }}
            play={(a) => {
              setSelected(a);
              setPlaying(a.type);
            }}
            edit={(a) => {
              setEditing(a);
              setBuilder(true);
            }}
            duplicate={(a) => {
              const copy = {
                ...a,
                id: Date.now(),
                title: `${a.title} · Kopya`,
                plays: 0,
                content: a.content?.map((q) => ({ ...q, a: [...q.a] })),
              };
              setActivities((v) => [copy, ...v]);
              notify("Etkinlik çoğaltıldı");
            }}
            remove={(a) => {
              setActivities((v) => v.filter((x) => x.id !== a.id));
              if (selected.id === a.id) setSelected(starters[0]);
              notify("Etkinlik silindi");
            }}
          />
        )}
        {view === "reports" && <Reports />}
        {view === "bank" && (
          <QuestionBank
            add={(a) => {
              setActivities((v) => [{ ...a, id: Date.now() }, ...v]);
              notify("Şablon etkinliklerinize eklendi");
            }}
          />
        )}
        {view === "admin" && <AdminCenter />}
        {view === "courses" && <Courses notify={notify} />}
        {view === "assignments" && (
          <Assignments activities={activities} notify={notify} />
        )}
        {view === "qna" && <LiveQA />}
        {view === "gamehub" && <GameHub notify={notify} />}
        {view === "radar" && <LearningRadar />}
        {view === "integrations" && (
          <IntegrationCenter notify={notify} activities={activities} />
        )}
        {view === "settings" && (
          <Settings value={accessibility} setValue={setAccessibility} />
        )}
      </section>
      {builder && (
        <Builder
          initial={editing}
          close={() => setBuilder(false)}
          save={(a) => {
            setActivities((v) =>
              editing ? v.map((x) => (x.id === editing.id ? a : x)) : [a, ...v],
            );
            setBuilder(false);
            setView("activities");
            setEditing(null);
            notify(editing ? "Etkinlik güncellendi!" : "Etkinlik kaydedildi!");
          }}
        />
      )}
      {playing && (
        <Arena
          type={playing}
          title={selected.title}
          questions={selected.content || quiz}
          shuffle={selected.shuffle}
          close={() => setPlaying(null)}
        />
      )}{" "}
      {toast && <div className="toast">{toast}</div>}
    </main>
  );
}
function Sidebar({
  view,
  setView,
  exit,
}: {
  view: View;
  setView: (v: View) => void;
  exit: () => void;
}) {
  return (
    <aside className="sidebar">
      <Logo dark />
      <nav>
        <small className="nav-label">ÖĞRETİM</small>
        <button
          className={view === "live" ? "active" : ""}
          onClick={() => setView("live")}
        >
          <span>●</span>Canlı Ders
        </button>
        <button
          className={view === "courses" ? "active" : ""}
          onClick={() => setView("courses")}
        >
          <span>▣</span>Derslerim
        </button>
        <button
          className={view === "assignments" ? "active" : ""}
          onClick={() => setView("assignments")}
        >
          <span>✓</span>Ödevler
        </button>
        <small className="nav-label">CANLI ETKİLEŞİM</small>
        <button
          className={view === "qna" ? "active" : ""}
          onClick={() => setView("qna")}
        >
          <span>?</span>Soru & Cevap
        </button>
        <button
          className={view === "gamehub" ? "active" : ""}
          onClick={() => setView("gamehub")}
        >
          <span>♛</span>Oyun Merkezi
        </button>
        <small className="nav-label">İÇGÖRÜ</small>
        <button
          className={view === "radar" ? "active" : ""}
          onClick={() => setView("radar")}
        >
          <span>◎</span>Öğrenme Radarı
        </button>
        <button
          className={view === "activities" ? "active" : ""}
          onClick={() => setView("activities")}
        >
          <span>▦</span>Etkinliklerim
        </button>
        <button
          className={view === "bank" ? "active" : ""}
          onClick={() => setView("bank")}
        >
          <span>▧</span>Soru Bankası
        </button>
        <button
          className={view === "settings" ? "active" : ""}
          onClick={() => setView("settings")}
        >
          <span>⚙</span>Ayarlar
        </button>
        <button
          className={view === "integrations" ? "active" : ""}
          onClick={() => setView("integrations")}
        >
          <span>⇄</span>Entegrasyonlar
        </button>
        <button
          className={view === "reports" ? "active" : ""}
          onClick={() => setView("reports")}
        >
          <span>▤</span>Ders Raporları
        </button>
        <button
          className={view === "admin" ? "active" : ""}
          onClick={() => setView("admin")}
        >
          <span>◇</span>Yönetim
        </button>
      </nav>
      <div className="sidebar-tip">
        <b>PRO İPUCU</b>
        <p>Bir anketle başlayıp quizle bitirmek katılımı artırır.</p>
      </div>
      <div className="teacher-card">
        <span>İD</span>
        <div>
          <b>İlker Duran</b>
          <small>Öğretim görevlisi</small>
        </div>
        <button onClick={exit}>↗</button>
      </div>
    </aside>
  );
}
function Live({
  activities,
  selected,
  select,
  play,
  notify,
}: {
  activities: Activity[];
  selected: Activity;
  select: (a: Activity) => void;
  play: (t: GameType) => void;
  notify: (s: string) => void;
}) {
  const [students, setStudents] = useState(34);
  return (
    <>
      <div className="live-grid">
        <article className="room-card panel">
          <span className="live-pill">● OTURUM AÇIK</span>
          <small>KATILIM KODU</small>
          <strong>481 209</strong>
          <p>Öğrenciler telefonlarından bu kodla katılabilir.</p>
          <div className="join-row">
            <div>
              <i style={{ width: `${(students / 42) * 100}%` }} />
            </div>
            <b>{students} / 42</b>
            <button onClick={() => setStudents((v) => Math.min(42, v + 1))}>
              Demo katılımcı ekle
            </button>
          </div>
        </article>
        <article className="leader-card panel">
          <div className="panel-title">
            <span>♛</span>
            <div>
              <small>CANLI</small>
              <h3>Lider tablosu</h3>
            </div>
          </div>
          {[
            ["#12", 4820],
            ["#27", 4650],
            ["#08", 4390],
          ].map((x, i) => (
            <div className="leader" key={i}>
              <b>{i + 1}</b>
              <span>Katılımcı {x[0]}</span>
              <em>{x[1]} XP</em>
            </div>
          ))}
        </article>
      </div>
      <div className="section-heading">
        <div>
          <span className="overline">HIZLI BAŞLAT</span>
          <h2>Bugün ne oynuyoruz?</h2>
        </div>
        <span>Bir etkinlik seç, sınıfla anında başla.</span>
      </div>
      <div className="activity-cards">
        {activities.map((a) => (
          <button
            key={a.id}
            className={`activity-card ${selected.id === a.id ? "selected" : ""}`}
            onClick={() => select(a)}
            style={{ "--accent": a.accent } as React.CSSProperties}
          >
            <i>{types.find((g) => g.type === a.type)?.icon}</i>
            <span>
              <small>{a.type}</small>
              <b>{a.title}</b>
              <em>
                {a.questions} içerik · {a.plays} oynama
              </em>
            </span>
            <strong>→</strong>
          </button>
        ))}
      </div>
      <div className="launch-dock">
        <div>
          <i style={{ background: selected.accent }}>
            {types.find((g) => g.type === selected.type)?.icon}
          </i>
          <span>
            <small>BAŞLATILMAYA HAZIR</small>
            <b>{selected.title}</b>
          </span>
        </div>
        <div>
          <button
            className="outline"
            onClick={() => notify("Projeksiyon ön izlemesi hazır")}
          >
            Ön izle
          </button>
          <button className="primary" onClick={() => play(selected.type)}>
            Yarışmayı başlat →
          </button>
        </div>
      </div>
    </>
  );
}
function Library({
  activities,
  create,
  play,
  edit,
  duplicate,
  remove,
}: {
  activities: Activity[];
  create: () => void;
  play: (a: Activity) => void;
  edit: (a: Activity) => void;
  duplicate: (a: Activity) => void;
  remove: (a: Activity) => void;
}) {
  const [filter, setFilter] = useState("Tümü");
  const [search, setSearch] = useState("");
  const visible =
    filter === "Tümü"
      ? activities
      : activities.filter((a) => a.type === filter);
  const results = visible.filter((a) =>
    a.title
      .toLocaleLowerCase("tr-TR")
      .includes(search.toLocaleLowerCase("tr-TR")),
  );
  return (
    <>
      <div className="studio-banner">
        <div>
          <span className="overline">ETKİLEŞİM TASARLA</span>
          <h2>
            Dersi anlatma, <em>oynat.</em>
          </h2>
          <p>
            Sıfırdan oluştur veya hazır etkinliği düzenleyerek birkaç dakikada
            yayına al.
          </p>
          <button className="primary" onClick={create}>
            ＋ Yeni etkinlik oluştur
          </button>
        </div>
        <div className="orb">
          <span>◆</span>
          <i>♛</i>
          <b>◌</b>
        </div>
      </div>
      <div className="filter-row">
        {["Tümü", "Quiz", "Anket", "Kelime Bulutu", "Takım Arenası"].map(
          (x) => (
            <button
              key={x}
              className={filter === x ? "active" : ""}
              onClick={() => setFilter(x)}
            >
              {x}
            </button>
          ),
        )}
        <input
          className="library-search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Etkinlik ara…"
        />
      </div>
      <div className="library-grid">
        {results.map((a) => (
          <article className="library-card" key={a.id}>
            <div className="card-cover" style={{ background: a.accent }}>
              <span>{types.find((g) => g.type === a.type)?.icon}</span>
              <small>{a.type}</small>
            </div>
            <div>
              <h3>{a.title}</h3>
              <p>
                {a.questions} içerik · {a.plays} kez oynandı
              </p>
              <div>
                <button onClick={() => play(a)}>▶ Oynat</button>
                <button onClick={() => edit(a)}>Düzenle</button>
                <button onClick={() => duplicate(a)}>⧉</button>
                <button className="danger-action" onClick={() => remove(a)}>
                  ⌫
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
function Reports() {
  const weeks = [42, 58, 51, 76, 68, 91, 84];
  const [cloudStats, setCloudStats] = useState<{
    answers: number;
    accuracy: number;
    xp: number;
  } | null>(null);
  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      const { data: sessions } = await supabase
        .from("dou_sessions")
        .select("id")
        .eq("owner_id", data.user.id);
      if (!sessions?.length) return;
      const { data: responses } = await supabase
        .from("dou_responses")
        .select("is_correct,points")
        .in(
          "session_id",
          sessions.map((s) => s.id),
        );
      if (responses?.length)
        setCloudStats({
          answers: responses.length,
          accuracy: Math.round(
            (responses.filter((r) => r.is_correct).length / responses.length) *
              100,
          ),
          xp: responses.reduce((s, r) => s + (r.points || 0), 0),
        });
    });
  }, []);
  const downloadReport = () => {
    const csv =
      "Etkinlik,Katılım,Doğruluk,Memnuniyet\nAraştırma Yöntemleri,124,%82,4.8/5\nSürdürülebilir Kampüs,98,%74,4.6/5\nDers Sonu Nabız,89,%91,4.7/5";
    const link = document.createElement("a");
    link.href = URL.createObjectURL(
      new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" }),
    );
    link.download = "dou-dersaktif-raporu.csv";
    link.click();
    URL.revokeObjectURL(link.href);
  };
  return (
    <>
      <div className="metric-grid">
        {[
          [
            "Canlı yanıt",
            cloudStats ? cloudStats.answers.toLocaleString("tr-TR") : "1.284",
            cloudStats ? "Bulut verisi" : "+18%",
            "↗",
          ],
          [
            "Ortalama doğruluk",
            cloudStats ? `%${cloudStats.accuracy}` : "%76",
            cloudStats ? `${cloudStats.xp.toLocaleString("tr-TR")} XP` : "+6%",
            "◎",
          ],
          ["Tamamlanan etkinlik", "48", "+12", "◆"],
          ["Aktif öğrenci", "186", "+24", "●"],
        ].map((m, i) => (
          <article className="metric panel" key={m[0]}>
            <span className={`metric-icon m${i}`}>{m[3]}</span>
            <small>{m[0]}</small>
            <strong>{m[1]}</strong>
            <em>{m[2]} bu ay</em>
          </article>
        ))}
      </div>
      <div className="report-grid">
        <article className="chart-card panel">
          <div className="panel-title">
            <div>
              <small>SON 7 HAFTA</small>
              <h3>Katılım eğilimi</h3>
            </div>
            <b>+18%</b>
          </div>
          <div className="bar-chart">
            {weeks.map((h, i) => (
              <div key={i}>
                <i style={{ height: `${h}%` }}>
                  <span>{h}</span>
                </i>
                <small>H{i + 1}</small>
              </div>
            ))}
          </div>
        </article>
        <article className="donut-card panel">
          <div className="panel-title">
            <div>
              <small>ETKİNLİK DAĞILIMI</small>
              <h3>En sevilen formatlar</h3>
            </div>
          </div>
          <div className="donut">
            <div>
              <strong>%42</strong>
              <small>Quiz</small>
            </div>
          </div>
          <ul>
            <li>
              <i />
              Quiz <b>%42</b>
            </li>
            <li>
              <i className="purple" />
              Anket <b>%28</b>
            </li>
            <li>
              <i className="yellow" />
              Takım <b>%18</b>
            </li>
            <li>
              <i className="green" />
              Diğer <b>%12</b>
            </li>
          </ul>
        </article>
      </div>
      <article className="performance panel">
        <div className="panel-title">
          <div>
            <small>İÇERİK PERFORMANSI</small>
            <h3>Son etkinlikler</h3>
          </div>
          <button onClick={downloadReport}>Raporu indir ↓</button>
        </div>
        <div className="table">
          <div className="thead">
            <span>Etkinlik</span>
            <span>Katılım</span>
            <span>Doğruluk</span>
            <span>Memnuniyet</span>
          </div>
          {[
            ["Araştırma Yöntemleri", "124", 82, "4.8 / 5"],
            ["Sürdürülebilir Kampüs", "98", 74, "4.6 / 5"],
            ["Ders Sonu Nabız", "89", 91, "4.7 / 5"],
          ].map((r) => (
            <div className="trow" key={r[0]}>
              <span>
                <b>{r[0]}</b>
                <small>Canlı oturum</small>
              </span>
              <span>{r[1]}</span>
              <span>
                <i>
                  <em style={{ width: `${r[2]}%` }} />
                </i>
                {r[2]}%
              </span>
              <span>★ {r[3]}</span>
            </div>
          ))}
        </div>
      </article>
    </>
  );
}
function Courses({ notify }: { notify: (s: string) => void }) {
  const [query, setQuery] = useState("");
  const [courses, setCourses] = useState([
    {
      code: "BMT203",
      name: "Python Programlama",
      students: 42,
      progress: 78,
      color: "#d70926",
    },
    {
      code: "BMT311",
      name: "Sunucu İşletim Sistemleri",
      students: 36,
      progress: 64,
      color: "#6c4df6",
    },
    {
      code: "BMT218",
      name: "Görsel Programlama",
      students: 38,
      progress: 86,
      color: "#159a80",
    },
  ]);
  const add = () => {
    setCourses((v) => [
      ...v,
      {
        code: `DOU${200 + v.length}`,
        name: "Yeni Ders",
        students: 0,
        progress: 0,
        color: "#f5a524",
      },
    ]);
    notify("Yeni ders alanı oluşturuldu");
  };
  return (
    <>
      <div className="module-hero">
        <div>
          <span className="overline">AKADEMİK DÖNEM · 2026 GÜZ</span>
          <h2>Tüm sınıflar, tek akış.</h2>
          <p>Etkinlik, ödev ve öğrenme çıktısını ders bazında yönetin.</p>
        </div>
        <button className="primary" onClick={add}>
          ＋ Ders oluştur
        </button>
      </div>
      <div className="module-toolbar">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ders adı veya kodu ara…"
        />
        <span>{courses.length} aktif ders · 116 öğrenci</span>
      </div>
      <div className="course-grid">
        {courses
          .filter((c) =>
            `${c.code} ${c.name}`.toLowerCase().includes(query.toLowerCase()),
          )
          .map((c, i) => (
            <article className="course-card panel" key={c.code}>
              <div className="course-cover" style={{ background: c.color }}>
                <small>{c.code}</small>
                <b>0{i + 1}</b>
              </div>
              <div>
                <h3>{c.name}</h3>
                <p>
                  {c.students} öğrenci · {6 + i * 2} etkinlik
                </p>
                <label>
                  <span>Ders ilerlemesi</span>
                  <b>%{c.progress}</b>
                </label>
                <i>
                  <em
                    style={{ width: `${c.progress}%`, background: c.color }}
                  />
                </i>
                <button
                  onClick={() => notify(`${c.name} çalışma alanı açıldı`)}
                >
                  Dersi aç →
                </button>
              </div>
            </article>
          ))}
      </div>
    </>
  );
}
function Assignments({
  activities,
  notify,
}: {
  activities: Activity[];
  notify: (s: string) => void;
}) {
  const [items, setItems] = useState([
    {
      title: "Python Döngüleri Tekrarı",
      course: "BMT203",
      due: "25 Ağu",
      done: 34,
      total: 42,
      status: "Yayında",
    },
    {
      title: "Linux Yetkilendirme",
      course: "BMT311",
      due: "29 Ağu",
      done: 21,
      total: 36,
      status: "Yayında",
    },
    {
      title: "Arayüz Tasarım İlkeleri",
      course: "BMT218",
      due: "Taslak",
      done: 0,
      total: 38,
      status: "Taslak",
    },
  ]);
  const create = () => {
    const a = activities[0];
    setItems((v) => [
      {
        title: a?.title || "Yeni çalışma",
        course: "BMT203",
        due: "7 gün",
        done: 0,
        total: 42,
        status: "Taslak",
      },
      ...v,
    ]);
    notify("Etkinlik ödeve dönüştürüldü");
  };
  return (
    <>
      <div className="module-hero">
        <div>
          <span className="overline">KENDİ HIZINDA ÖĞRENME</span>
          <h2>Ders bittiğinde oyun devam eder.</h2>
          <p>
            Etkinlikleri ödeve çevirin, son tarih ve tamamlama durumunu izleyin.
          </p>
        </div>
        <button className="primary" onClick={create}>
          ＋ Etkinlikten ödev
        </button>
      </div>
      <div className="assignment-list panel">
        {items.map((x, i) => (
          <article key={i}>
            <span className={`status ${x.status === "Yayında" ? "live" : ""}`}>
              {x.status}
            </span>
            <div>
              <small>
                {x.course} · Son: {x.due}
              </small>
              <h3>{x.title}</h3>
            </div>
            <div className="assignment-progress">
              <b>
                {x.done}/{x.total}
              </b>
              <small>tamamladı</small>
              <i>
                <em
                  style={{
                    width: `${x.total ? (x.done / x.total) * 100 : 0}%`,
                  }}
                />
              </i>
            </div>
            <button onClick={() => notify("Ödev ayrıntıları açıldı")}>
              Yönet →
            </button>
          </article>
        ))}
      </div>
    </>
  );
}
type QAItem = {
  id: number;
  text: string;
  votes: number;
  answered: boolean;
  pinned: boolean;
};
function LiveQA() {
  const [text, setText] = useState("");
  const [moderationMessage, setModerationMessage] = useState("");
  const [items, setItems] = useState<QAItem[]>([
    {
      id: 1,
      text: "Final projesinde takım büyüklüğü kaç kişi olacak?",
      votes: 18,
      answered: false,
      pinned: true,
    },
    {
      id: 2,
      text: "Örnek kodları ders sonrasında paylaşacak mısınız?",
      votes: 12,
      answered: false,
      pinned: false,
    },
    {
      id: 3,
      text: "Bu konu vizede hangi ağırlıkta?",
      votes: 7,
      answered: true,
      pinned: false,
    },
  ]);
  const add = () => {
    if (!text.trim()) return;
    if (
      ["küfür", "salak", "aptal", "gerizekalı"].some((w) =>
        text.toLocaleLowerCase("tr-TR").includes(w),
      )
    ) {
      setModerationMessage("Soru sınıf güvenliği filtresine takıldı.");
      return;
    }
    setItems((v) => [
      {
        id: Date.now(),
        text: text.trim(),
        votes: 0,
        answered: false,
        pinned: false,
      },
      ...v,
    ]);
    setText("");
    setModerationMessage("");
  };
  return (
    <div className="qna-layout">
      <section>
        <div className="module-hero compact">
          <div>
            <span className="overline">ANONİM · MODERASYONLU</span>
            <h2>Her ses sınıfa ulaşsın.</h2>
            <p>Öğrenciler soru sorar, oylama en önemli konuyu üste taşır.</p>
          </div>
          <span className="live-pill">● CANLI</span>
        </div>
        <div className="ask-box">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && add()}
            placeholder="Demo öğrenci sorusu ekle…"
          />
          <button onClick={add}>Gönder</button>
        </div>
        {moderationMessage && (
          <div className="moderation-warning">⚠ {moderationMessage}</div>
        )}
        <div className="qa-list">
          {[...items]
            .sort(
              (a, b) =>
                Number(b.pinned) - Number(a.pinned) || b.votes - a.votes,
            )
            .map((q) => (
              <article className={q.pinned ? "pinned" : ""} key={q.id}>
                <button
                  className="vote"
                  onClick={() =>
                    setItems((v) =>
                      v.map((x) =>
                        x.id === q.id ? { ...x, votes: x.votes + 1 } : x,
                      ),
                    )
                  }
                >
                  ▲<b>{q.votes}</b>
                </button>
                <div>
                  {q.pinned && <small>📌 SABİTLENDİ</small>}
                  <p className={q.answered ? "answered" : ""}>{q.text}</p>
                  <span>Anonim öğrenci · şimdi</span>
                </div>
                <div className="qa-actions">
                  <button
                    onClick={() =>
                      setItems((v) =>
                        v.map((x) =>
                          x.id === q.id ? { ...x, pinned: !x.pinned } : x,
                        ),
                      )
                    }
                  >
                    📌
                  </button>
                  <button
                    onClick={() =>
                      setItems((v) =>
                        v.map((x) =>
                          x.id === q.id ? { ...x, answered: !x.answered } : x,
                        ),
                      )
                    }
                  >
                    ✓
                  </button>
                  <button
                    onClick={() =>
                      setItems((v) => v.filter((x) => x.id !== q.id))
                    }
                  >
                    ×
                  </button>
                </div>
              </article>
            ))}
        </div>
      </section>
      <aside className="qna-side panel">
        <span>OTURUM ÖZETİ</span>
        <strong>{items.length}</strong>
        <p>toplam soru</p>
        <b>{items.reduce((s, x) => s + x.votes, 0)} oy</b>
        <hr />
        <h3>Sınıf nabzı</h3>
        <div className="pulse-row">
          <span>👍 24</span>
          <span>🤔 8</span>
          <span>🐢 3</span>
        </div>
        <button
          onClick={() =>
            setItems((v) => v.map((x) => ({ ...x, answered: true })))
          }
        >
          Tümünü yanıtlandı yap
        </button>
      </aside>
    </div>
  );
}
function LearningRadar() {
  const outcomes = [
    {
      id: "ÖÇ-1",
      name: "Temel kavramları açıklar",
      value: 88,
      color: "#159a80",
    },
    { id: "ÖÇ-2", name: "Algoritma tasarlar", value: 71, color: "#6c4df6" },
    { id: "ÖÇ-3", name: "Çözümü uygular", value: 62, color: "#f5a524" },
    {
      id: "PÇ-4",
      name: "Etik ve güvenliği değerlendirir",
      value: 46,
      color: "#d70926",
    },
  ];
  const download = () => {
    const csv =
      "Çıktı,Başarı\n" + outcomes.map((x) => `${x.id},%${x.value}`).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(
      new Blob(["\ufeff" + csv], { type: "text/csv" }),
    );
    a.download = "dou-akreditasyon-kaniti.csv";
    a.click();
  };
  return (
    <>
      <div className="radar-hero">
        <div>
          <span className="overline">DOU'YA ÖZEL KARAR DESTEK</span>
          <h2>Öğrenme gerçekleşiyor mu?</h2>
          <p>
            Canlı cevapları ders çıktısı, program çıktısı ve Bloom düzeyinde
            anlamlı kanıta dönüştürür.
          </p>
        </div>
        <button className="outline" onClick={download}>
          Akreditasyon kanıtını indir ↓
        </button>
      </div>
      <div className="radar-grid">
        <article className="panel outcome-card">
          <div className="panel-title">
            <div>
              <small>ÖÇ / PÇ BAŞARI HARİTASI</small>
              <h3>Çıktı kapsama radarı</h3>
            </div>
            <b>Genel %67</b>
          </div>
          {outcomes.map((x) => (
            <div className="outcome" key={x.id}>
              <b>{x.id}</b>
              <span>
                {x.name}
                <i>
                  <em style={{ width: `${x.value}%`, background: x.color }} />
                </i>
              </span>
              <strong style={{ color: x.color }}>%{x.value}</strong>
            </div>
          ))}
        </article>
        <article className="panel bloom-card">
          <small>BLOOM DERİNLİĞİ</small>
          <h3>Sorular yalnızca ezber ölçmüyor.</h3>
          {[
            ["Hatırlama", 92],
            ["Anlama", 84],
            ["Uygulama", 68],
            ["Analiz", 55],
            ["Değerlendirme", 42],
            ["Yaratma", 28],
          ].map(([n, v], i) => (
            <div key={n as string}>
              <span>{n}</span>
              <i style={{ height: `${Number(v) / 1.2}px` }} />
              <b>%{v}</b>
            </div>
          ))}
        </article>
        <article className="panel misconception">
          <small>ERKEN UYARI</small>
          <h3>3 kavram yanılgısı yakalandı</h3>
          <div>
            <b>01</b>
            <span>
              <strong>Döngü koşulu ≠ sayaç</strong>
              <small>14 öğrenci aynı çeldiriciyi seçti.</small>
            </span>
          </div>
          <div>
            <b>02</b>
            <span>
              <strong>Yetki ve sahiplik karışıyor</strong>
              <small>ÖÇ-3 başarısı son iki oturumda düştü.</small>
            </span>
          </div>
          <button>5 dakikalık iyileştirme etkinliği oluştur →</button>
        </article>
        <article className="panel next-action">
          <span>✦ PEDAGOJİK ÖNERİ</span>
          <h3>
            Bir sonraki derse “Tahmin et → Çalıştır → Açıkla” takım turuyla
            başlayın.
          </h3>
          <p>
            Radara göre uygulama becerisi güçlü, değerlendirme düzeyi zayıf. Kod
            çıktısı ve akran açıklaması bu boşluğu hedefler.
          </p>
          <button>Öneriyi etkinliğe çevir</button>
        </article>
      </div>
    </>
  );
}
function GameHub({ notify }: { notify: (s: string) => void }) {
  const [season, setSeason] = useState(2);
  const [teams, setTeams] = useState([
    { name: "Algoritma Avcıları", xp: 8420, color: "#d70926", streak: 7 },
    { name: "Byte Birliği", xp: 7960, color: "#6c4df6", streak: 5 },
    { name: "Kernel Ekibi", xp: 7310, color: "#159a80", streak: 4 },
  ]);
  const boost = (i: number) => {
    setTeams((v) =>
      v.map((x, j) =>
        j === i ? { ...x, xp: x.xp + 250, streak: x.streak + 1 } : x,
      ),
    );
    notify("Takıma +250 XP sürpriz bonus verildi");
  };
  return (
    <>
      <div className="gamehub-hero">
        <div>
          <span>SEZON {season} · 18 GÜN KALDI</span>
          <h2>Öğrenme bir sınıf macerasına dönüşsün.</h2>
          <p>
            Seriler, takım ligleri, rozetler ve risk–ödül turları; not yerine
            ilerlemeyi görünür kılar.
          </p>
        </div>
        <button
          onClick={() => {
            setSeason((v) => v + 1);
            notify("Yeni sezon taslağı oluşturuldu");
          }}
        >
          ＋ Yeni sezon
        </button>
      </div>
      <div className="gamehub-grid">
        <section className="panel league">
          <div className="panel-title">
            <div>
              <small>TAKIM LİGİ</small>
              <h3>Haftanın sıralaması</h3>
            </div>
            <b>🔥 12 aktif seri</b>
          </div>
          {[...teams]
            .sort((a, b) => b.xp - a.xp)
            .map((t, i) => (
              <article key={t.name}>
                <strong>{i + 1}</strong>
                <i style={{ background: t.color }}>
                  {t.name.slice(0, 2).toUpperCase()}
                </i>
                <span>
                  <b>{t.name}</b>
                  <small>🔥 {t.streak} tur seri</small>
                </span>
                <em>{t.xp.toLocaleString("tr-TR")} XP</em>
                <button onClick={() => boost(teams.indexOf(t))}>Bonus</button>
              </article>
            ))}
        </section>
        <aside className="panel director-cards">
          <small>OYUN YÖNETMENİ</small>
          <h3>Canlı güç kartları</h3>
          {[
            ["⚡", "2X Seri", "Sonraki doğru cevap iki kat XP"],
            ["◐", "50:50", "İki yanlış şıkkı kaldır"],
            ["🛡", "Seri Kalkanı", "Bir yanlışta seri bozulmasın"],
            ["🎲", "Risk Turu", "Puanın %25'ini final sorusuna yatır"],
          ].map(([icon, title, desc]) => (
            <button
              key={title}
              onClick={() => notify(`${title} sıradaki tura eklendi`)}
            >
              <i>{icon}</i>
              <span>
                <b>{title}</b>
                <small>{desc}</small>
              </span>
              <em>＋</em>
            </button>
          ))}
        </aside>
        <section className="panel badge-vault">
          <div>
            <small>ROZET KASASI</small>
            <h3>Yetkinlik kanıtları</h3>
          </div>
          {[
            ["◆", "Algoritma Ustası", "120 / 150"],
            ["▣", "Takım Oyuncusu", "8 / 10"],
            ["◎", "Soru Kaşifi", "24 / 25"],
            ["♛", "Hafta Lideri", "Kazanıldı"],
          ].map(([i, n, p], x) => (
            <article className={x === 3 ? "earned" : ""} key={n}>
              <i>{i}</i>
              <b>{n}</b>
              <small>{p}</small>
            </article>
          ))}
        </section>
        <section className="panel mission">
          <span>HAFTALIK SINIF GÖREVİ</span>
          <h3>“Bir arkadaşına öğret” zinciri</h3>
          <p>
            Her takım bir kavramı 60 saniyede açıklar. Sınıf oylamasıyla en
            açıklayıcı örnek seçilir.
          </p>
          <div>
            <i>
              <em style={{ width: "72%" }} />
            </i>
            <b>72%</b>
          </div>
          <button onClick={() => notify("Görev canlı oturuma eklendi")}>
            Görevi başlat →
          </button>
        </section>
      </div>
    </>
  );
}
function IntegrationCenter({
  notify,
  activities,
}: {
  notify: (s: string) => void;
  activities: Activity[];
}) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const login = async () => {
    if (!email.includes("@")) {
      notify("Kurumsal e-posta adresini gir");
      return;
    }
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    });
    if (error) notify(error.message);
    else {
      setSent(true);
      notify("Güvenli giriş bağlantısı gönderildi");
    }
  };
  const [tested, setTested] = useState<string[]>([]);
  const test = (name: string) => {
    setTested((v) => (v.includes(name) ? v : [...v, name]));
    notify(`${name} bağlantı doğrulama akışı hazır`);
  };
  const syncCloud = async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) {
      notify("Önce kurumsal e-posta ile giriş yap");
      return;
    }
    const { error: removeError } = await supabase
      .from("dou_activities")
      .delete()
      .eq("owner_id", data.user.id);
    if (removeError) {
      notify("Bulut eşitleme başlatılamadı");
      return;
    }
    const { error } = await supabase.from("dou_activities").insert(
      activities.map((a) => ({
        owner_id: data.user!.id,
        title: a.title,
        game_type: a.type,
        content: a.content || [],
        outcome_map: { shuffle: a.shuffle || false },
      })),
    );
    notify(
      error
        ? "Bulut eşitlemede hata oluştu"
        : `${activities.length} etkinlik güvenli buluta eşitlendi`,
    );
  };
  return (
    <div className="integration-layout">
      <section>
        <div className="module-hero">
          <div>
            <span className="overline">KURUMSAL VERİ AKIŞI</span>
            <h2>Ders verisi yeniden girilmesin.</h2>
            <p>
              ÖBS, LMS ve kurumsal kimlik sağlayıcılarını güvenli bağlantı
              noktaları üzerinden eşleştirin.
            </p>
          </div>
          <div className="hero-sync">
            <span className="secure-badge">● KVKK ODAKLI</span>
            <button onClick={syncCloud}>☁ Etkinlikleri buluta eşitle</button>
          </div>
        </div>
        <div className="connector-grid">
          {[
            ["ÖBS / SIS", "Ders, şube ve öğrenci listesi", "⇄"],
            ["Moodle / LMS", "Etkinlik, ödev ve not aktarımı", "M"],
            ["Microsoft 365", "Kurumsal SSO ve Teams", "▦"],
            ["Google Workspace", "SSO ve Classroom", "G"],
            ["Excel / CSV", "Toplu öğrenci ve soru aktarımı", "X"],
            ["LTI 1.3", "Standart LMS araç bağlantısı", "LTI"],
          ].map(([name, desc, icon]) => (
            <article className="panel connector" key={name}>
              <i>{icon}</i>
              <div>
                <h3>{name}</h3>
                <p>{desc}</p>
              </div>
              <span className={tested.includes(name) ? "ready" : ""}>
                {tested.includes(name) ? "Doğrulandı" : "Yapılandırılmadı"}
              </span>
              <button onClick={() => test(name)}>
                {tested.includes(name) ? "Yeniden test et" : "Bağlantıyı kur"}
              </button>
            </article>
          ))}
        </div>
      </section>
      <aside className="panel auth-center">
        <span className="overline">AKADEMİSYEN OTURUMU</span>
        <h3>Şifresiz güvenli giriş</h3>
        <p>Kurumsal e-postaya tek kullanımlık giriş bağlantısı gönderilir.</p>
        {sent ? (
          <div className="auth-success">
            ✓ Bağlantı gönderildi.
            <small>E-postayı aynı cihazda açarak oturumu tamamlayın.</small>
          </div>
        ) : (
          <>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ad.soyad@dogus.edu.tr"
            />
            <button onClick={login}>Giriş bağlantısı gönder →</button>
          </>
        )}
        <hr />
        <small>
          Gerçek ÖBS/SSO bağlantısı için kurumun istemci kimliği, servis adresi
          ve yetkilendirmesi gerekir. Bu bilgiler eklenmeden öğrenci verisi
          aktarılmaz.
        </small>
      </aside>
    </div>
  );
}
function Settings({
  value,
  setValue,
}: {
  value: AccessibilityPrefs;
  setValue: (v: AccessibilityPrefs) => void;
}) {
  const options: Array<[keyof typeof value, string, string]> = [
    [
      "contrast",
      "Yüksek kontrast",
      "Metin ve kontrollerin ayrımını güçlendirir",
    ],
    [
      "large",
      "Büyük arayüz",
      "Projeksiyon ve düşük görüş için yazıları büyütür",
    ],
    ["motion", "Hareketi azalt", "Animasyon ve geçişleri sınırlar"],
    [
      "labels",
      "Renk + şekil etiketleri",
      "Cevapları yalnızca renkle ayırt etmez",
    ],
    [
      "readAloud",
      "Soruyu sesli oku",
      "Öğrenci ekranında Türkçe sesli okuma sunar",
    ],
    ["extraTime", "Bireysel ek süre", "Sorular için yüzde 50 ek süre tanımlar"],
    ["focus", "Odak modu", "Dikkat dağıtan puan ve efektleri azaltır"],
    ["hints", "Öğrenme ipuçları", "Zor sorularda kavramsal destek gösterir"],
  ];
  return (
    <div className="settings-grid">
      <section className="panel">
        <span className="overline">ERİŞİLEBİLİRLİK</span>
        <h2>Her öğrenci oyunda.</h2>
        <p>
          Bu tercihler bu cihazda saklanır ve tüm canlı oturumlara uygulanır.
        </p>
        {options.map(([key, title, desc]) => (
          <label className="setting-row" key={key}>
            <span>
              <b>{title}</b>
              <small>{desc}</small>
            </span>
            <input
              type="checkbox"
              checked={value[key]}
              onChange={(e) => setValue({ ...value, [key]: e.target.checked })}
            />
            <i />
          </label>
        ))}
      </section>
      <aside className="panel integration-card">
        <span className="overline">KURUMSAL HAZIRLIK</span>
        <h3>DOU dijital ekosistemi</h3>
        {[
          "ÖBS / LMS ders eşleme",
          "Kurumsal SSO",
          "KVKK uyumlu anonim katılım",
          "CSV ve akreditasyon dışa aktarımı",
        ].map((x, i) => (
          <div key={x}>
            <b>{i < 2 ? "Hazır" : "Aktif"}</b>
            <span>{x}</span>
          </div>
        ))}
        <small>
          ÖBS ve SSO bağlantısı kurum erişim bilgileriyle etkinleştirilir.
        </small>
      </aside>
    </div>
  );
}
function QuestionBank({ add }: { add: (a: Activity) => void }) {
  const [search, setSearch] = useState("");
  const [level, setLevel] = useState("Tümü");
  const samples: Activity[] = [
    {
      id: "tpl1",
      type: "Quiz",
      title: "Python · Döngüler ve Akış",
      questions: 6,
      plays: 342,
      accent: "#d70926",
      content: [
        {
          q: "range(5) hangi değerle başlar?",
          a: ["0", "1", "5", "-1"],
          correct: 0,
          kind: "choice",
          outcome: "ÖÇ-2",
          bloom: "Uygulama",
        },
      ],
    },
    {
      id: "tpl2",
      type: "Takım Arenası",
      title: "Linux · Yetki Laboratuvarı",
      questions: 5,
      plays: 188,
      accent: "#6c4df6",
      content: [
        {
          q: "En düşükten en yüksek yetkiye sırala",
          a: ["guest", "user", "sudo", "root"],
          correct: 0,
          kind: "ranking",
          outcome: "ÖÇ-3",
          bloom: "Analiz",
        },
      ],
    },
    {
      id: "tpl3",
      type: "Kelime Bulutu",
      title: "Siber Güvenlik · Risk Haritası",
      questions: 3,
      plays: 271,
      accent: "#159a80",
      content: [
        {
          q: "Bir kelimeyle en kritik güvenlik riski?",
          a: ["phishing", "zararlı yazılım", "zayıf parola", "insan hatası"],
          correct: 0,
          kind: "open",
          outcome: "PÇ-4",
          bloom: "Değerlendirme",
        },
      ],
    },
    {
      id: "tpl4",
      type: "Anket",
      title: "Ders Sonu Çıkış Bileti",
      questions: 4,
      plays: 514,
      accent: "#f5a524",
      content: [
        {
          q: "Bugünkü konuyu uygulayabilir misin?",
          a: ["Evet", "Kısmen", "Örnek gerekli", "Tekrar gerekli"],
          correct: 0,
          kind: "scale",
          outcome: "ÖÇ-1",
          bloom: "Anlama",
        },
      ],
    },
  ];
  const visible = samples.filter(
    (x) =>
      (level === "Tümü" || x.type === level) &&
      x.title
        .toLocaleLowerCase("tr-TR")
        .includes(search.toLocaleLowerCase("tr-TR")),
  );
  return (
    <>
      <div className="module-hero">
        <div>
          <span className="overline">AKADEMİSYEN ORTAK ALANI</span>
          <h2>Hazırla, paylaş, yeniden kullan.</h2>
          <p>
            DOU dersleri, öğrenme çıktıları ve Bloom düzeyleriyle etiketlenmiş
            etkinlik şablonları.
          </p>
        </div>
        <b className="bank-count">128 doğrulanmış içerik</b>
      </div>
      <div className="bank-toolbar">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Konu, ders veya kazanım ara…"
        />
        <select value={level} onChange={(e) => setLevel(e.target.value)}>
          <option>Tümü</option>
          <option>Quiz</option>
          <option>Anket</option>
          <option>Kelime Bulutu</option>
          <option>Takım Arenası</option>
        </select>
      </div>
      <div className="bank-grid">
        {visible.map((a) => (
          <article className="panel bank-card" key={a.id}>
            <div style={{ background: a.accent }}>
              <span>{types.find((t) => t.type === a.type)?.icon}</span>
              <small>DOU ONAYLI</small>
            </div>
            <section>
              <small>
                {a.type} · {a.content?.[0]?.outcome} · {a.content?.[0]?.bloom}
              </small>
              <h3>{a.title}</h3>
              <p>
                {a.questions} soru · {a.plays} kullanım
              </p>
              <button onClick={() => add(a)}>＋ Kütüphaneme ekle</button>
            </section>
          </article>
        ))}
      </div>
    </>
  );
}
function AdminCenter() {
  const departments = [
    ["İnternet ve Ağ Teknolojileri", 84, 76],
    ["Bilgisayar Programcılığı", 126, 81],
    ["Bilişim Güvenliği", 68, 72],
  ];
  return (
    <>
      <div className="admin-hero">
        <div>
          <span>KURUMSAL PİLOT · 2026 GÜZ</span>
          <h2>Katılımın akademik etkisini tek merkezden görün.</h2>
        </div>
        <button onClick={() => window.print()}>Yönetim özetini yazdır ↓</button>
      </div>
      <div className="metric-grid">
        {[
          ["Aktif akademisyen", "18", "+5"],
          ["Aktif öğrenci", "278", "%91 katılım"],
          ["Canlı oturum", "64", "Bu dönem"],
          ["MEDEK kanıtı", "142", "Otomatik"],
        ].map((x, i) => (
          <article className="metric panel" key={x[0]}>
            <span className={`metric-icon m${i}`}>◇</span>
            <small>{x[0]}</small>
            <strong>{x[1]}</strong>
            <em>{x[2]}</em>
          </article>
        ))}
      </div>
      <div className="admin-grid">
        <section className="panel">
          <div className="panel-title">
            <div>
              <small>PROGRAM PERFORMANSI</small>
              <h3>Katılım ve öğrenme başarısı</h3>
            </div>
          </div>
          {departments.map((d) => (
            <div className="department-row" key={d[0] as string}>
              <span>
                <b>{d[0]}</b>
                <small>{d[1]} öğrenci</small>
              </span>
              <i>
                <em style={{ width: `${d[2]}%` }} />
              </i>
              <strong>%{d[2]}</strong>
            </div>
          ))}
        </section>
        <aside className="panel audit-log">
          <small>SON İŞLEMLER</small>
          <h3>Denetim günlüğü</h3>
          {[
            ["16:42", "BMT203 raporu oluşturuldu"],
            ["15:18", "Yeni etkinlik ortak bankaya eklendi"],
            ["13:05", "42 öğrenci oturuma katıldı"],
            ["Dün", "ÖÇ-3 erken uyarısı üretildi"],
          ].map((x) => (
            <div key={x[1]}>
              <b>{x[0]}</b>
              <span>{x[1]}</span>
            </div>
          ))}
        </aside>
      </div>
    </>
  );
}
function Builder({
  close,
  save,
  initial,
}: {
  close: () => void;
  save: (a: Activity) => void;
  initial?: Activity | null;
}) {
  const blank = (): Question => ({
    q: "",
    a: ["", "", "", ""],
    correct: 0,
    seconds: 20,
    kind: "choice",
    outcome: "ÖÇ-1",
    bloom: "Uygulama",
    points: 1000,
  });
  const [type, setType] = useState<GameType>(initial?.type || "Quiz");
  const [title, setTitle] = useState(initial?.title || "");
  const [questions, setQuestions] = useState<Question[]>(
    initial?.content?.map((q) => ({ ...q, a: [...q.a] })) || [blank()],
  );
  const [active, setActive] = useState(0);
  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState("Orta");
  const [shuffle, setShuffle] = useState(initial?.shuffle ?? true);
  const [generatorOpen, setGeneratorOpen] = useState(false);
  const current = questions[active];
  const update = (next: Partial<Question>) =>
    setQuestions((all) =>
      all.map((q, i) => (i === active ? { ...q, ...next } : q)),
    );
  const add = () => {
    setQuestions((all) => [...all, blank()]);
    setActive(questions.length);
  };
  const duplicate = () => {
    setQuestions((all) => [...all, { ...current, a: [...current.a] }]);
    setActive(questions.length);
  };
  const remove = () => {
    if (questions.length === 1) return;
    setQuestions((all) => all.filter((_, i) => i !== active));
    setActive(Math.max(0, active - 1));
  };
  const generate = () => {
    const subject = topic.trim() || "Ders konusu";
    const lower = subject.toLocaleLowerCase("tr-TR");
    const pool = lower.includes("python")
      ? [
          {
            q: "Python'da bir döngüyü sonlandırmak için hangi ifade kullanılır?",
            a: ["break", "stop", "exit", "return all"],
            correct: 0,
          },
          {
            q: "range(5) ifadesi hangi değerle başlar?",
            a: ["0", "1", "5", "-1"],
            correct: 0,
          },
          {
            q: "Liste üzerinde gezinmek için en uygun yapı hangisidir?",
            a: ["for döngüsü", "class", "import", "try"],
            correct: 0,
          },
          {
            q: "while döngüsü ne zamana kadar çalışır?",
            a: [
              "Koşul doğruyken",
              "Bir kez",
              "Dosya açılana kadar",
              "Daima 10 kez",
            ],
            correct: 0,
          },
        ]
      : lower.includes("ağ") || lower.includes("network")
        ? [
            {
              q: "Bir ağdaki cihazları mantıksal olarak ayıran yapı hangisidir?",
              a: ["VLAN", "HDMI", "BIOS", "GPU"],
              correct: 0,
            },
            {
              q: "IP adresini otomatik dağıtan protokol hangisidir?",
              a: ["DHCP", "FTP", "SSH", "SMTP"],
              correct: 0,
            },
            {
              q: "Web trafiğinde güvenli bağlantı hangi protokolle sağlanır?",
              a: ["HTTPS", "HTTP", "TFTP", "ARP"],
              correct: 0,
            },
            {
              q: "Yerel ağ cihazlarını birbirine bağlayan temel cihaz hangisidir?",
              a: ["Switch", "Yazıcı", "Tarayıcı", "Klavye"],
              correct: 0,
            },
          ]
        : [
            {
              q: `${subject} konusunun temel amacı hangisidir?`,
              a: [
                "Kavramı doğru uygulamak",
                "Ezber yapmak",
                "Konuyu atlamak",
                "Süreyi doldurmak",
              ],
              correct: 0,
            },
            {
              q: `${subject} için en güvenilir öğrenme yöntemi hangisidir?`,
              a: [
                "Uygulama ve geri bildirim",
                "Yalnızca okumak",
                "Tahmin etmek",
                "Tekrar etmemek",
              ],
              correct: 0,
            },
            {
              q: `${subject} ile ilgili bir problemi çözerken ilk adım nedir?`,
              a: [
                "Problemi tanımlamak",
                "Sonucu yazmak",
                "Kaynağı kapatmak",
                "Rastgele seçim",
              ],
              correct: 0,
            },
            {
              q: `${subject} öğrenmesinde başarıyı ne gösterir?`,
              a: [
                "Bilgiyi yeni durumda kullanmak",
                "Metni kopyalamak",
                "Sadece dinlemek",
                "Soruyu geçmek",
              ],
              correct: 0,
            },
          ];
    setQuestions(
      pool.map((q) => ({
        ...q,
        seconds: difficulty === "Kolay" ? 30 : difficulty === "Zor" ? 15 : 20,
      })),
    );
    setTitle((old) => old || `${subject} · ${difficulty} Quiz`);
    setActive(0);
    setGeneratorOpen(false);
  };
  const makeTrueFalse = () => update({ a: ["Doğru", "Yanlış"], correct: 0 });
  const addImage = (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) return;
    if (file.size > 2_000_000) {
      alert("Görsel en fazla 2 MB olabilir.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => update({ image: String(reader.result) });
    reader.readAsDataURL(file);
  };
  const importQuestions = (file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const raw = String(reader.result || "");
        const parsed: Question[] = file.name.endsWith(".json")
          ? JSON.parse(raw)
          : raw
              .split(/\r?\n/)
              .slice(1)
              .filter(Boolean)
              .map((line) => {
                const [
                  q,
                  a1,
                  a2,
                  a3,
                  a4,
                  correct = "1",
                  outcome = "ÖÇ-1",
                  bloom = "Uygulama",
                ] = line.split(";");
                return {
                  q,
                  a: [a1, a2, a3, a4],
                  correct: Math.max(0, Number(correct) - 1),
                  seconds: 20,
                  kind: "choice",
                  outcome,
                  bloom,
                };
              });
        if (!Array.isArray(parsed) || !parsed.length) throw new Error();
        setQuestions(
          parsed.map((q) => ({
            ...blank(),
            ...q,
            a: q.a?.length ? q.a : ["", "", "", ""],
          })),
        );
        setActive(0);
      } catch {
        alert(
          "Dosya okunamadı. CSV ayırıcı olarak noktalı virgül kullanmalı veya geçerli JSON olmalı.",
        );
      }
    };
    reader.readAsText(file, "UTF-8");
  };
  const finish = () =>
    save({
      id: initial?.id || Date.now(),
      type,
      title: title.trim() || "Yeni Etkinlik",
      questions: questions.length,
      plays: initial?.plays || 0,
      accent: types.find((g) => g.type === type)?.color || "#d70926",
      content: questions.map((q, i) => ({
        ...q,
        q: q.q.trim() || `${i + 1}. soru`,
        a: q.a.map((a, j) => a.trim() || `${j + 1}. seçenek`),
      })),
      shuffle,
    });

  return (
    <div className="modal">
      <div className="builder advanced-builder">
        <header>
          <div>
            <span className="overline">ETKİNLİK STÜDYOSU · OTOMATİK KAYIT</span>
            <h2>Etkinliği tasarla</h2>
          </div>
          <div className="builder-top-actions">
            <button onClick={close}>×</button>
          </div>
        </header>
        <div className="builder-settings">
          <label>
            Etkinlik adı
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Örn. Python Döngüleri"
            />
          </label>
          <label>
            Oyun modu
            <select
              value={type}
              onChange={(e) => setType(e.target.value as GameType)}
            >
              {types.map((g) => (
                <option key={g.type}>{g.type}</option>
              ))}
            </select>
          </label>
          <button
            className="smart-generate-button"
            onClick={() => setGeneratorOpen((v) => !v)}
          >
            ✦ Akıllı soru üret
          </button>
          <label className="import-button">
            ⇧ CSV / JSON içe aktar
            <input
              type="file"
              accept=".csv,.json"
              onChange={(e) => importQuestions(e.target.files?.[0])}
            />
          </label>
        </div>
        {generatorOpen && (
          <div className="smart-generator">
            <div>
              <b>✦ Akıllı Quiz Taslağı</b>
              <small>Konuya göre düzenlenebilir dört soru oluşturur.</small>
            </div>
            <input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Örn. Python döngüleri, Ağ güvenliği…"
            />
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
            >
              <option>Kolay</option>
              <option>Orta</option>
              <option>Zor</option>
            </select>
            <button onClick={generate}>Taslağı oluştur →</button>
          </div>
        )}
        <div className="builder-workspace">
          <aside>
            <div>
              <b>SORULAR</b>
              <span>{questions.length}</span>
            </div>
            {questions.map((q, i) => (
              <button
                key={i}
                className={active === i ? "active" : ""}
                onClick={() => setActive(i)}
              >
                <b>{i + 1}</b>
                <span>{q.q || "Yeni soru"}</span>
                <small>{q.seconds || 20} sn</small>
              </button>
            ))}
            <button className="add-question" onClick={add}>
              ＋ Soru ekle
            </button>
          </aside>
          <section className="question-canvas">
            <div className="canvas-tools">
              <span>SORU {active + 1}</span>
              <label>
                Süre
                <select
                  value={current.seconds || 20}
                  onChange={(e) => update({ seconds: Number(e.target.value) })}
                >
                  {[10, 20, 30, 45, 60, 90].map((n) => (
                    <option key={n} value={n}>
                      {n} saniye
                    </option>
                  ))}
                </select>
              </label>
              <button onClick={duplicate}>⧉ Çoğalt</button>
              <button onClick={makeTrueFalse}>◐ Doğru/Yanlış</button>
              <button onClick={remove}>⌫ Sil</button>
            </div>
            <div className="question-meta-tools">
              <label>
                Soru tipi
                <select
                  value={current.kind || "choice"}
                  onChange={(e) =>
                    update({ kind: e.target.value as QuestionKind })
                  }
                >
                  {[
                    ["choice", "Çoktan seçmeli"],
                    ["multiple", "Çoklu doğru"],
                    ["truefalse", "Doğru / Yanlış"],
                    ["open", "Açık uçlu"],
                    ["ranking", "Sıralama"],
                    ["scale", "Ölçek"],
                    ["pin", "Görselde işaretle"],
                    ["code", "Kod çıktısı"],
                  ].map(([v, n]) => (
                    <option key={v} value={v}>
                      {n}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Öğrenme çıktısı
                <select
                  value={current.outcome || "ÖÇ-1"}
                  onChange={(e) => update({ outcome: e.target.value })}
                >
                  {["ÖÇ-1", "ÖÇ-2", "ÖÇ-3", "PÇ-4"].map((x) => (
                    <option key={x}>{x}</option>
                  ))}
                </select>
              </label>
              <label>
                Bloom düzeyi
                <select
                  value={current.bloom || "Uygulama"}
                  onChange={(e) => update({ bloom: e.target.value })}
                >
                  {[
                    "Hatırlama",
                    "Anlama",
                    "Uygulama",
                    "Analiz",
                    "Değerlendirme",
                    "Yaratma",
                  ].map((x) => (
                    <option key={x}>{x}</option>
                  ))}
                </select>
              </label>
            </div>
            <textarea
              className="question-title-input"
              value={current.q}
              onChange={(e) => update({ q: e.target.value })}
              placeholder="Sorunu veya görevini yaz…"
            />
            <div className="question-media">
              <label className="image-upload">
                ▧ Görsel ekle
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => addImage(e.target.files?.[0])}
                />
              </label>
              <span>JPG, PNG veya WEBP · en fazla 2 MB</span>
              {current.image && (
                <button onClick={() => update({ image: undefined })}>
                  Görseli kaldır
                </button>
              )}
            </div>
            {current.image && (
              <div
                className={`question-image-preview ${current.kind === "pin" ? "pin-editor" : ""}`}
                onClick={(e) => {
                  if (current.kind !== "pin") return;
                  const r = e.currentTarget.getBoundingClientRect();
                  update({
                    pinX: Math.round(((e.clientX - r.left) / r.width) * 100),
                    pinY: Math.round(((e.clientY - r.top) / r.height) * 100),
                  });
                }}
              >
                <img src={current.image} alt="Soru görseli ön izlemesi" />
                {current.kind === "pin" && (
                  <i
                    className="pin-target"
                    style={{
                      left: `${current.pinX ?? 50}%`,
                      top: `${current.pinY ?? 50}%`,
                    }}
                  >
                    ＋
                  </i>
                )}
              </div>
            )}
            <div className="answer-editor colorful">
              {current.a.map((a, i) => (
                <label
                  key={i}
                  className={`option-${i} ${(current.kind === "multiple" ? (current.corrects || [current.correct]).includes(i) : current.correct === i) ? "correct" : ""}`}
                >
                  <button
                    onClick={() =>
                      current.kind === "multiple"
                        ? update({
                            corrects: (
                              current.corrects || [current.correct]
                            ).includes(i)
                              ? (current.corrects || [current.correct]).filter(
                                  (x) => x !== i,
                                )
                              : [...(current.corrects || [current.correct]), i],
                          })
                        : update({ correct: i, corrects: [i] })
                    }
                  >
                    {optionMarks[i]}
                  </button>
                  <input
                    value={a}
                    onChange={(e) =>
                      update({
                        a: current.a.map((x, j) =>
                          j === i ? e.target.value : x,
                        ),
                      })
                    }
                    placeholder={`${i + 1}. cevap seçeneği`}
                  />
                  <i>
                    {(
                      current.kind === "multiple"
                        ? (current.corrects || [current.correct]).includes(i)
                        : current.correct === i
                    )
                      ? "✓ DOĞRU"
                      : ""}
                  </i>
                </label>
              ))}
            </div>
            <div className="builder-hint">
              💡 Doğru şıkkı seç, süreyi ayarla ve soldan yeni sorular ekle.
              Sorular cihazda otomatik saklanır.
            </div>
          </section>
        </div>
        <footer>
          <button className="outline" onClick={close}>
            ← Vazgeç
          </button>
          <span>
            {questions.length} soru · yaklaşık{" "}
            {Math.ceil(
              questions.reduce((s, q) => s + (q.seconds || 20), 0) / 60,
            )}{" "}
            dakika
          </span>
          <label className="shuffle-setting">
            <input
              type="checkbox"
              checked={shuffle}
              onChange={(e) => setShuffle(e.target.checked)}
            />{" "}
            Soruları karıştır
          </label>
          <button className="primary" onClick={finish}>
            Kaydet ve kütüphaneye ekle ✓
          </button>
        </footer>
      </div>
    </div>
  );
}
type GamePhase = "lobby" | "question" | "leaderboard" | "final";
type Player = {
  id: string;
  name: string;
  score: number;
  streak?: number;
  team?: "Kırmızı" | "Siyah";
};
const optionMarks = ["▲", "◆", "●", "■"];

function Arena({
  type,
  title,
  questions = quiz,
  shuffle = false,
  close,
}: {
  type: GameType;
  title: string;
  questions?: Question[];
  shuffle?: boolean;
  close: () => void;
}) {
  const [code] = useState(() =>
    String(Math.floor(100000 + Math.random() * 900000)),
  );
  const [phase, setPhase] = useState<GamePhase>("lobby");
  const [round, setRound] = useState(0);
  const [players, setPlayers] = useState<Player[]>([]);
  const [answers, setAnswers] = useState(0);
  const [answerStats, setAnswerStats] = useState([0, 0, 0, 0]);
  const [cloudWords, setCloudWords] = useState<
    { text: string; count: number }[]
  >([]);
  const [timeLeft, setTimeLeft] = useState(20);
  const [paused, setPaused] = useState(false);
  const [projection, setProjection] = useState(false);
  const [pulse, setPulse] = useState({
    understood: 0,
    repeat: 0,
    example: 0,
    question: 0,
  });
  const [gameQuestions] = useState(() =>
    shuffle ? [...questions].sort(() => Math.random() - 0.5) : questions,
  );
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const dbSessionRef = useRef<string | null>(null);
  const current = gameQuestions[round % gameQuestions.length];

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      const { data: session } = await supabase
        .from("dou_sessions")
        .insert({
          owner_id: data.user.id,
          join_code: code,
          status: "lobby",
          started_at: new Date().toISOString(),
        })
        .select("id")
        .single();
      if (session) dbSessionRef.current = session.id;
    });
    const channel = supabase.channel(roomTopic(code), {
      config: { presence: { key: "host" }, broadcast: { self: true } },
    });
    channelRef.current = channel;
    channel.on("presence", { event: "sync" }, () => {
      const state = channel.presenceState<Player>();
      const live = Object.values(state)
        .flat()
        .filter((p) => p.id !== "host");
      setPlayers((old) =>
        live.map((p) => ({
          ...p,
          name: validateParticipantName(p.name) ? "Katılımcı" : p.name,
          score: old.find((x) => x.id === p.id)?.score || 0,
        })),
      );
    });
    channel.on("broadcast", { event: "answer" }, ({ payload }) => {
      setAnswers((v) => v + 1);
      setAnswerStats((old) =>
        old.map((n, i) => (i === payload.answer ? n + 1 : n)),
      );
      if (payload.answerText)
        setCloudWords((old) => {
          const clean = String(payload.answerText).trim().slice(0, 40);
          const found = old.find(
            (w) =>
              w.text.toLocaleLowerCase("tr-TR") ===
              clean.toLocaleLowerCase("tr-TR"),
          );
          return found
            ? old.map((w) => (w === found ? { ...w, count: w.count + 1 } : w))
            : [...old, { text: clean, count: 1 }];
        });
      if (payload.correct)
        setPlayers((old) =>
          old.map((p) =>
            p.id === payload.id
              ? {
                  ...p,
                  score: p.score + payload.points,
                  streak: payload.streak,
                }
              : p,
          ),
        );
      if (dbSessionRef.current)
        supabase
          .from("dou_responses")
          .insert({
            session_id: dbSessionRef.current,
            participant_hash: payload.id,
            question_index: payload.round ?? 0,
            answer: { index: payload.answer },
            is_correct: payload.correct,
            points: payload.points,
          })
          .then(() => {});
    });
    channel.on("broadcast", { event: "pulse" }, ({ payload }) => {
      setPulse((old) => ({
        ...old,
        [payload.kind]: (old[payload.kind as keyof typeof old] || 0) + 1,
      }));
    });
    channel.subscribe((status) => {
      if (status === "SUBSCRIBED")
        channel.track({ id: "host", name: "Akademisyen", score: 0 });
    });
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const broadcast = (next: GamePhase, nextRound = round) => {
    setPhase(next);
    setRound(nextRound);
    setAnswers(0);
    setAnswerStats([0, 0, 0, 0]);
    setCloudWords([]);
    setTimeLeft(gameQuestions[nextRound % gameQuestions.length].seconds || 20);
    channelRef.current?.send({
      type: "broadcast",
      event: "game-state",
      payload: {
        phase: next,
        round: nextRound,
        title,
        type,
        question: gameQuestions[nextRound % gameQuestions.length],
        startedAt: Date.now(),
      },
    });
    if (dbSessionRef.current)
      supabase
        .from("dou_sessions")
        .update({
          status: next,
          ended_at: next === "final" ? new Date().toISOString() : null,
        })
        .eq("id", dbSessionRef.current)
        .then(() => {});
  };
  useEffect(() => {
    if (phase !== "question" || paused) return;
    const timer = window.setInterval(() => {
      setTimeLeft((value) => {
        if (value <= 1) {
          window.clearInterval(timer);
          window.setTimeout(() => broadcast("leaderboard"), 0);
          return 0;
        }
        return value - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [phase, round, paused]);
  const removePlayer = (id: string) => {
    setPlayers((all) => all.filter((p) => p.id !== id));
    channelRef.current?.send({
      type: "broadcast",
      event: "moderation",
      payload: { action: "remove", id },
    });
  };
  const sorted = [...players].sort((a, b) => b.score - a.score);

  return (
    <div className="modal arena-modal">
      <div
        className={`game-arena realtime-arena ${projection ? "projection-mode" : ""}`}
      >
        <header>
          <div>
            <span className="live-pill">● GERÇEK ZAMANLI</span>
            <h2>{title}</h2>
          </div>
          <div>
            <b>
              {code.slice(0, 3)} {code.slice(3)}
            </b>
            <button onClick={() => setProjection((v) => !v)}>
              {projection ? "Kontrole dön" : "▣ Projeksiyon"}
            </button>
            <button onClick={close}>Bitir ×</button>
          </div>
        </header>
        {phase === "lobby" && (
          <section className="host-lobby">
            <span className="overline">KATILIM KODU</span>
            <strong>
              {code.slice(0, 3)} {code.slice(3)}
            </strong>
            <h3>
              {players.length
                ? `${players.length} öğrenci hazır`
                : "Öğrenciler bekleniyor…"}
            </h3>
            <div className="player-chips">
              {players.map((p) => (
                <span key={p.id}>
                  ● {p.name}
                  <button
                    onClick={() => removePlayer(p.id)}
                    title="Katılımcıyı çıkar"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <button className="primary" onClick={() => broadcast("question")}>
              Oyunu başlat →
            </button>
          </section>
        )}
        {phase === "question" && (
          <section className="quiz-arena">
            <div className="host-controlbar">
              <button onClick={() => setPaused((v) => !v)}>
                {paused ? "▶ Devam et" : "Ⅱ Duraklat"}
              </button>
              <button onClick={() => setTimeLeft((v) => v + 10)}>
                ＋10 sn
              </button>
              <button
                onClick={() =>
                  channelRef.current?.send({
                    type: "broadcast",
                    event: "spotlight",
                    payload: { message: "Bu soruya dikkat!" },
                  })
                }
              >
                ✦ Dikkat çek
              </button>
              <span>{paused ? "Oyun duraklatıldı" : "Oyun devam ediyor"}</span>
            </div>
            <div className="quiz-meta">
              <span>
                SORU {round + 1} / {gameQuestions.length}
              </span>
              <b className={timeLeft <= 5 ? "timer-danger" : ""}>
                ⏱ {timeLeft} sn · {answers} yanıt
              </b>
            </div>
            {type === "Takım Arenası" && (
              <div className="team-scoreboard">
                <span>
                  🔴 Kırmızı{" "}
                  <b>
                    {players
                      .filter((p) => p.team === "Kırmızı")
                      .reduce((s, p) => s + p.score, 0)}{" "}
                    XP
                  </b>
                </span>
                <span>
                  ⚫ Siyah{" "}
                  <b>
                    {players
                      .filter((p) => p.team === "Siyah")
                      .reduce((s, p) => s + p.score, 0)}{" "}
                    XP
                  </b>
                </span>
              </div>
            )}
            <span className="interaction-label">
              {
                (
                  {
                    choice: "TEK SEÇİM",
                    multiple: "ÇOKLU DOĞRU",
                    truefalse: "DOĞRU / YANLIŞ",
                    open: "AÇIK UÇLU",
                    ranking: "SIRALAMA",
                    scale: "ÖLÇEK",
                    pin: "GÖRSELDE İŞARETLE",
                    code: "KOD ÇIKTISI",
                  } as Record<QuestionKind, string>
                )[current.kind || "choice"]
              }{" "}
              · {current.outcome || "ÖÇ-1"} · {current.bloom || "Uygulama"}
            </span>
            <h3>{current.q}</h3>
            {current.image && (
              <div className="game-question-image">
                <img src={current.image} alt="Soru görseli" />
              </div>
            )}
            {type === "Kelime Bulutu" ? (
              <div className="live-word-cloud">
                {cloudWords.length ? (
                  cloudWords.map((w, i) => (
                    <span
                      key={w.text}
                      style={{
                        fontSize: `${18 + Math.min(w.count * 7, 32)}px`,
                        color: ["#d70926", "#6c4df6", "#159a80", "#1d1d1b"][
                          i % 4
                        ],
                      }}
                    >
                      {w.text}
                    </span>
                  ))
                ) : (
                  <small>
                    Yanıtlar geldikçe kelime bulutu burada oluşacak…
                  </small>
                )}
              </div>
            ) : (
              <div>
                {current.a.map((a, i) => (
                  <button key={a} className={`game-option option-${i}`}>
                    <b>{optionMarks[i]}</b>
                    <span>{a}</span>
                    <small>
                      {answers
                        ? Math.round((answerStats[i] / answers) * 100)
                        : 0}
                      %
                    </small>
                  </button>
                ))}
              </div>
            )}
            <footer>
              <span>{players.length} bağlı öğrenci</span>
              <button onClick={() => broadcast("leaderboard")}>
                Cevapları kapat →
              </button>
            </footer>
            <div className="pulse-monitor">
              <b>DERS NABZI</b>
              <span>
                ✓ Anladım <strong>{pulse.understood}</strong>
              </span>
              <span>
                ↻ Tekrar <strong>{pulse.repeat}</strong>
              </span>
              <span>
                ◈ Örnek <strong>{pulse.example}</strong>
              </span>
              <span>
                ? Sorum var <strong>{pulse.question}</strong>
              </span>
            </div>
          </section>
        )}
        {phase === "leaderboard" && (
          <section className="live-board">
            <span className="overline">ARA SIRALAMA</span>
            <h3>🔥 Tahta değişti!</h3>
            {sorted.slice(0, 5).map((p, i) => (
              <div key={p.id} className={i === 0 ? "leader-first" : ""}>
                <b>{i + 1}</b>
                <span>
                  {p.name}
                  <small>
                    {p.streak && p.streak > 1
                      ? ` 🔥 ${p.streak} seri`
                      : i === 0
                        ? " 👑 Lider"
                        : ""}
                  </small>
                </span>
                <strong>{p.score.toLocaleString("tr-TR")} XP</strong>
              </div>
            ))}
            <button
              className="primary"
              onClick={() =>
                round + 1 < gameQuestions.length
                  ? broadcast("question", round + 1)
                  : broadcast("final")
              }
            >
              {round + 1 < gameQuestions.length
                ? "Sonraki soru →"
                : "Finali göster →"}
            </button>
          </section>
        )}
        {phase === "final" && (
          <section className="podium">
            <span>🏆</span>
            <h3>Yarışma tamamlandı!</h3>
            <div>
              {sorted.slice(0, 3).map((p, i) => (
                <article key={p.id} className={`place-${i + 1}`}>
                  <b>{i + 1}</b>
                  <strong>{p.name}</strong>
                  <small>{p.score} XP</small>
                </article>
              ))}
            </div>
            <button className="primary" onClick={close}>
              Raporu görüntüle →
            </button>
          </section>
        )}
      </div>
    </div>
  );
}

function StudentStage({
  name,
  code,
  onExit,
}: {
  name: string;
  code: string;
  onExit: () => void;
}) {
  const cleanCode = code.replace(/\s/g, "");
  const idRef = useRef(
    typeof window !== "undefined"
      ? localStorage.getItem(`dou-player-${cleanCode}`) || crypto.randomUUID()
      : `${Date.now()}`,
  );
  const [status, setStatus] = useState("Oturuma bağlanılıyor…");
  const [phase, setPhase] = useState<GamePhase>("lobby");
  const [round, setRound] = useState(0);
  const [question, setQuestion] = useState<Question>(quiz[0]);
  const [gameType, setGameType] = useState<GameType>("Quiz");
  const [answer, setAnswer] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [timeLeft, setTimeLeft] = useState(20);
  const [fiftyUsed, setFiftyUsed] = useState(false);
  const [hiddenOptions, setHiddenOptions] = useState<number[]>([]);
  const [spotlight, setSpotlight] = useState("");
  const [openText, setOpenText] = useState("");
  const [selectedMany, setSelectedMany] = useState<number[]>([]);
  const [rankOrder, setRankOrder] = useState<number[]>([0, 1, 2, 3]);
  const [inputError, setInputError] = useState("");
  const [supports, setSupports] = useState<Partial<AccessibilityPrefs>>({});
  const startedAtRef = useRef(Date.now());
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const team: "Kırmızı" | "Siyah" =
    idRef.current.charCodeAt(0) % 2 === 0 ? "Kırmızı" : "Siyah";

  useEffect(() => {
    try {
      setSupports(
        JSON.parse(localStorage.getItem("dou-accessibility") || "{}"),
      );
      localStorage.setItem(`dou-player-${cleanCode}`, idRef.current);
      const saved = JSON.parse(
        localStorage.getItem(`dou-progress-${cleanCode}`) || "null",
      );
      if (saved) {
        setScore(saved.score || 0);
        setStreak(saved.streak || 0);
      }
    } catch {}
  }, [cleanCode]);
  useEffect(() => {
    try {
      localStorage.setItem(
        `dou-progress-${cleanCode}`,
        JSON.stringify({ score, streak }),
      );
    } catch {}
  }, [cleanCode, score, streak]);

  useEffect(() => {
    const channel = supabase.channel(roomTopic(cleanCode), {
      config: { presence: { key: idRef.current } },
    });
    channelRef.current = channel;
    channel.on("broadcast", { event: "game-state" }, ({ payload }) => {
      setPhase(payload.phase);
      setRound(payload.round);
      if (payload.question) setQuestion(payload.question);
      if (payload.type) setGameType(payload.type);
      if (payload.question)
        setTimeLeft(
          Math.round(
            (payload.question.seconds || 20) * (supports.extraTime ? 1.5 : 1),
          ),
        );
      if (payload.startedAt) startedAtRef.current = payload.startedAt;
      setAnswer(null);
      setFeedback(null);
      setHiddenOptions([]);
      setSelectedMany([]);
      setOpenText("");
      setInputError("");
      if (payload.question?.kind === "ranking")
        setRankOrder(
          payload.question.a
            .map((_: string, i: number) => i)
            .sort(() => Math.random() - 0.5),
        );
    });
    channel.on("broadcast", { event: "moderation" }, ({ payload }) => {
      if (payload.action === "remove" && payload.id === idRef.current) onExit();
    });
    channel.on("broadcast", { event: "spotlight" }, ({ payload }) => {
      setSpotlight(payload.message);
      window.setTimeout(() => setSpotlight(""), 2200);
    });
    channel.subscribe((s) => {
      if (s === "SUBSCRIBED") {
        setStatus("Canlı odaya bağlandın");
        const safeName = validateParticipantName(name)
          ? "Katılımcı"
          : name.trim().replace(/\s+/g, " ");
        channel.track({
          id: idRef.current,
          name: safeName,
          score,
          team,
        });
      }
    });
    return () => {
      supabase.removeChannel(channel);
    };
  }, [cleanCode, name, supports.extraTime]);

  useEffect(() => {
    if (phase !== "question") return;
    const timer = window.setInterval(
      () => setTimeLeft((value) => Math.max(0, value - 1)),
      1000,
    );
    return () => window.clearInterval(timer);
  }, [phase, round]);

  const choose = (i: number, answerText?: string, forcedCorrect?: boolean) => {
    if (answer !== null) return;
    setAnswer(i);
    const correct =
      forcedCorrect ??
      (gameType === "Anket" ||
        gameType === "Kelime Bulutu" ||
        i === question.correct);
    const speedBonus = Math.max(
      0,
      400 - Math.floor((Date.now() - startedAtRef.current) / 25),
    );
    const nextStreak = correct ? streak + 1 : 0;
    const points = correct
      ? 600 + speedBonus + Math.min(nextStreak * 75, 375)
      : 0;
    setStreak(nextStreak);
    setFeedback(correct ? "correct" : "wrong");
    if (correct) setScore((v) => v + points);
    channelRef.current?.send({
      type: "broadcast",
      event: "answer",
      payload: {
        id: idRef.current,
        answer: i,
        correct,
        points,
        streak: nextStreak,
        round,
        answerText,
      },
    });
  };
  const submitText = () => {
    const clean = openText.trim();
    const blocked = ["küfür", "salak", "aptal", "gerizekalı"].some((w) =>
      clean.toLocaleLowerCase("tr-TR").includes(w),
    );
    if (!clean) {
      setInputError("Yanıtını yazmalısın.");
      return;
    }
    if (blocked) {
      setInputError("Bu ifade sınıf güvenliği filtresine takıldı.");
      return;
    }
    const exact =
      clean.toLocaleLowerCase("tr-TR") ===
      question.a[question.correct]?.trim().toLocaleLowerCase("tr-TR");
    choose(
      question.correct,
      clean,
      gameType === "Kelime Bulutu" || gameType === "Hızlı Görev" || exact,
    );
  };
  const submitMultiple = () => {
    const expected = [...(question.corrects || [question.correct])]
      .sort()
      .join(",");
    choose(
      question.correct,
      undefined,
      [...selectedMany].sort().join(",") === expected,
    );
  };
  const moveRank = (at: number, dir: number) =>
    setRankOrder((v) => {
      const n = [...v],
        to = at + dir;
      if (to < 0 || to >= n.length) return v;
      [n[at], n[to]] = [n[to], n[at]];
      return n;
    });
  const useFifty = () => {
    if (fiftyUsed || answer !== null) return;
    const wrong = question.a
      .map((_, i) => i)
      .filter((i) => i !== question.correct)
      .slice(0, 2);
    setHiddenOptions(wrong);
    setFiftyUsed(true);
  };
  const sendPulse = (kind: "understood" | "repeat" | "example" | "question") =>
    channelRef.current?.send({
      type: "broadcast",
      event: "pulse",
      payload: { kind, id: idRef.current },
    });
  const answerPin = (e: React.MouseEvent<HTMLDivElement>) => {
    if (answer !== null || question.kind !== "pin") return;
    const r = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * 100,
      y = ((e.clientY - r.top) / r.height) * 100;
    const distance = Math.hypot(
      x - (question.pinX ?? 50),
      y - (question.pinY ?? 50),
    );
    choose(distance <= 12 ? question.correct : -1);
  };

  return (
    <main className={`student-stage ${supports.focus ? "student-focus" : ""}`}>
      <header>
        <Logo dark />
        <span>
          Oturum <b>{cleanCode}</b>
        </span>
      </header>
      {phase === "lobby" ? (
        <section className="student-wait">
          <span className="pulse-dot">●</span>
          <h1>{name || "Katılımcı"}, oyundasın!</h1>
          <p>
            {status}
            <br />
            Akademisyenin yarışmayı başlatmasını bekle.
          </p>
          <strong>{score} XP</strong>
        </section>
      ) : phase === "question" ? (
        <section>
          {spotlight && <div className="spotlight-toast">✦ {spotlight}</div>}
          <div className="student-gamebar">
            <span>🔥 {streak} SERİ</span>
            <b>{score.toLocaleString("tr-TR")} XP</b>
            <span>
              {gameType === "Takım Arenası"
                ? `${team} Takım`
                : `SORU ${round + 1}`}
            </span>
          </div>
          <div className="timer">
            <i
              style={{
                width: `${Math.max(0, (timeLeft / (question.seconds || 20)) * 100)}%`,
              }}
            />
          </div>
          <div className={`student-countdown ${timeLeft <= 5 ? "danger" : ""}`}>
            {timeLeft}
          </div>
          <h1>{question.q}</h1>
          {supports.readAloud && (
            <button
              className="read-aloud"
              onClick={() => {
                speechSynthesis.cancel();
                speechSynthesis.speak(
                  new SpeechSynthesisUtterance(
                    `${question.q}. ${question.a.join(". ")}`,
                  ),
                );
              }}
            >
              🔊 Soruyu sesli oku
            </button>
          )}
          <span className="student-kind">
            {gameType === "Kelime Bulutu"
              ? "Tek kelimeyle katkı ver"
              : gameType === "Anket"
                ? "Görüşünü seç · doğru/yanlış yok"
                : gameType === "Takım Arenası"
                  ? "Takımın için puan kazan"
                  : gameType === "Hızlı Görev"
                    ? "Görevi tamamla ve yanıtla"
                    : (
                        {
                          choice: "Bir şık seç",
                          multiple: "Birden fazla şık seç",
                          truefalse: "Doğru mu, yanlış mı?",
                          open: "Kısa yanıtını yaz",
                          ranking: "Doğru sırayı seç",
                          scale: "Ölçekte değerlendir",
                          pin: "Görselde doğru noktayı bul",
                          code: "Kodun çıktısını seç",
                        } as Record<QuestionKind, string>
                      )[question.kind || "choice"]}
          </span>
          {question.image && (
            <div
              className={`student-question-image ${question.kind === "pin" ? "pin-play" : ""}`}
              onClick={answerPin}
            >
              <img src={question.image} alt="Soru görseli" />
            </div>
          )}
          <div className="powerups">
            <button onClick={useFifty} disabled={fiftyUsed}>
              ◐ 50:50 {fiftyUsed ? "kullanıldı" : "jokeri"}
            </button>
            <span>Doğru seri: 🔥 {streak}</span>
          </div>
          {supports.hints && (
            <div className="learning-hint">
              💡 İpucu: Sorudaki ana kavramı önce kendi cümlenle tanımlamayı
              dene.
            </div>
          )}
          {question.kind === "pin" ? (
            <div className="pin-instruction">
              Görsel üzerinde doğru olduğunu düşündüğün noktaya dokun.
            </div>
          ) : question.kind === "open" ||
            gameType === "Kelime Bulutu" ||
            gameType === "Hızlı Görev" ? (
            <div className="open-answer">
              <input
                value={openText}
                onChange={(e) => setOpenText(e.target.value)}
                placeholder="Yanıtını yaz…"
              />
              <button onClick={submitText}>Yanıtı kilitle →</button>
              {inputError && (
                <small className="input-error">{inputError}</small>
              )}
            </div>
          ) : question.kind === "multiple" ? (
            <div className="multi-answer-wrap">
              <div className="student-answers">
                {question.a.map((a, i) => (
                  <button
                    key={a}
                    className={`game-option option-${i} ${selectedMany.includes(i) ? "selected" : ""}`}
                    onClick={() =>
                      setSelectedMany((v) =>
                        v.includes(i) ? v.filter((x) => x !== i) : [...v, i],
                      )
                    }
                    disabled={answer !== null}
                  >
                    <b>{selectedMany.includes(i) ? "✓" : optionMarks[i]}</b>
                    <span>{a}</span>
                  </button>
                ))}
              </div>
              <button
                className="lock-answer"
                onClick={submitMultiple}
                disabled={!selectedMany.length || answer !== null}
              >
                Seçimleri kilitle →
              </button>
            </div>
          ) : question.kind === "ranking" ? (
            <div className="ranking-board">
              {rankOrder.map((item, i) => (
                <div key={item}>
                  <b>{i + 1}</b>
                  <span>{question.a[item]}</span>
                  <button
                    onClick={() => moveRank(i, -1)}
                    disabled={i === 0 || answer !== null}
                  >
                    ↑
                  </button>
                  <button
                    onClick={() => moveRank(i, 1)}
                    disabled={i === rankOrder.length - 1 || answer !== null}
                  >
                    ↓
                  </button>
                </div>
              ))}
              <button
                className="lock-answer"
                onClick={() =>
                  choose(
                    question.correct,
                    undefined,
                    rankOrder.every((x, i) => x === i),
                  )
                }
                disabled={answer !== null}
              >
                Sıralamayı kilitle →
              </button>
            </div>
          ) : question.kind === "scale" ? (
            <div className="scale-answer">
              {[1, 2, 3, 4, 5].map((n, i) => (
                <button
                  key={n}
                  onClick={() => choose(i)}
                  disabled={answer !== null}
                >
                  <b>{n}</b>
                  <span>{n === 1 ? "Hiç" : n === 5 ? "Tamamen" : ""}</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="student-answers">
              {question.a.map((a, i) => (
                <button
                  className={`game-option option-${i} ${answer === i ? "selected" : ""}`}
                  key={a}
                  onClick={() => choose(i)}
                  disabled={answer !== null}
                  style={
                    hiddenOptions.includes(i)
                      ? { visibility: "hidden" }
                      : undefined
                  }
                >
                  <b>{optionMarks[i]}</b>
                  <span>{a}</span>
                </button>
              ))}
            </div>
          )}
          {answer === null ? (
            <p>Yanıtını seç — ne kadar hızlıysan o kadar çok XP!</p>
          ) : (
            <div className={`answer-feedback ${feedback}`}>
              <b>{feedback === "correct" ? "✓ MUHTEŞEM!" : "× ÇOK YAKINDI!"}</b>
              <span>
                {feedback === "correct"
                  ? `Serin ${streak} oldu, hız bonusu kazandın!`
                  : "Doğru cevabı ekranda birlikte görelim."}
              </span>
            </div>
          )}
          <div className="student-pulse">
            <small>Dersin nasıl gidiyor?</small>
            <button onClick={() => sendPulse("understood")}>✓ Anladım</button>
            <button onClick={() => sendPulse("repeat")}>↻ Tekrar</button>
            <button onClick={() => sendPulse("example")}>◈ Örnek</button>
            <button onClick={() => sendPulse("question")}>? Sorum var</button>
          </div>
        </section>
      ) : (
        <section className="student-wait">
          <span>♛</span>
          <h1>
            {phase === "final" ? "Yarışma tamamlandı!" : "Sıralama ekranda"}
          </h1>
          <strong>{score} XP</strong>
          <p>Yeni tur için ekrana bak.</p>
        </section>
      )}
      <button className="back" onClick={onExit}>
        ← Oturumdan ayrıl
      </button>
    </main>
  );
}
function MicrosoftAuthDialog({
  intent,
  setIntent,
  loading,
  error,
  close,
}: {
  intent: AuthIntent;
  setIntent: (value: AuthIntent) => void;
  loading: boolean;
  error: string;
  close: () => void;
}) {
  const [connecting, setConnecting] = useState(false);
  const [localError, setLocalError] = useState("");
  const login = async () => {
    setConnecting(true);
    setLocalError("");
    localStorage.setItem("dou-auth-intent", intent);
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "azure",
      options: {
        scopes: "openid profile email",
        redirectTo: window.location.origin,
        queryParams: { prompt: "select_account" },
      },
    });
    if (oauthError) {
      localStorage.removeItem("dou-auth-intent");
      setLocalError(
        oauthError.message.includes("provider is not enabled")
          ? "Microsoft 365 bağlantısı henüz kurum yöneticisi tarafından etkinleştirilmedi."
          : oauthError.message,
      );
      setConnecting(false);
    }
  };
  return (
    <div
      className="auth-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-title"
    >
      <section className="microsoft-auth-card">
        <button
          className="auth-close"
          onClick={close}
          aria-label="Giriş penceresini kapat"
        >
          ×
        </button>
        <div className="auth-brand">
          <Logo />
          <span>Kurumsal erişim</span>
        </div>
        <div className="microsoft-mark" aria-hidden="true">
          <i />
          <i />
          <i />
          <i />
        </div>
        <span className="overline">DOĞUŞ ÜNİVERSİTESİ · MICROSOFT 365</span>
        <h2 id="auth-title">Okul hesabınla devam et</h2>
        <p>
          Şifre DOU DersAktif ile paylaşılmaz. Microsoft’un güvenli giriş
          ekranına yönlendirilirsin.
        </p>
        <div className="role-switch" role="tablist" aria-label="Giriş rolü">
          <button
            className={intent === "student" ? "active" : ""}
            onClick={() => setIntent("student")}
          >
            <span>🎓</span>
            <b>Öğrenci</b>
            <small>Etkinliklere katıl</small>
          </button>
          <button
            className={intent === "instructor" ? "active" : ""}
            onClick={() => setIntent("instructor")}
          >
            <span>◆</span>
            <b>Öğretim görevlisi</b>
            <small>Etkinlik oluştur</small>
          </button>
        </div>
        {(error || localError) && (
          <div className="auth-error">⚠ {error || localError}</div>
        )}
        <button
          className="microsoft-login"
          onClick={login}
          disabled={connecting || loading}
        >
          <span className="ms-icon">
            <i />
            <i />
            <i />
            <i />
          </span>
          {connecting
            ? "Microsoft’a bağlanıyor…"
            : "Microsoft 365 ile giriş yap"}
          <em>→</em>
        </button>
        <div className="auth-domain">
          <i>✓</i>
          <span>
            Yalnızca <b>@dogus.edu.tr</b> hesapları
          </span>
        </div>
        <small className="auth-role-note">
          Akademisyen yetkisi kurumsal yetki listesinden doğrulanır; kullanıcı
          rolünü kendisi değiştiremez.
        </small>
      </section>
    </div>
  );
}

function StudentDashboard({
  identity,
  code,
  setCode,
  join,
  exit,
  signOut,
  toast,
}: {
  identity: Identity;
  code: string;
  setCode: (value: string) => void;
  join: () => void;
  exit: () => void;
  signOut: () => void;
  toast: string;
}) {
  return (
    <main className="student-portal">
      <nav>
        <Logo />
        <div>
          <button onClick={exit}>Ana sayfa</button>
          <button className="portal-signout" onClick={signOut}>
            Çıkış yap
          </button>
        </div>
      </nav>
      <section className="student-portal-hero">
        <div>
          <span className="portal-kicker">● MICROSOFT 365 İLE DOĞRULANDI</span>
          <h1>
            Hazırsan sınıfa
            <br />
            <em>enerjini kat.</em>
          </h1>
          <p>
            Canlı quizlere, takım yarışlarına ve sınıf görevlerine kurumsal
            kimliğinle güvenle katıl.
          </p>
        </div>
        <aside className="portal-join-card">
          <span>CANLI OTURUMA KATIL</span>
          <h2>Tahtadaki kodu gir</h2>
          <input
            value={code}
            onChange={(e) =>
              setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
            }
            onKeyDown={(e) => e.key === "Enter" && join()}
            inputMode="numeric"
            placeholder="000 000"
            aria-label="Oturum kodu"
          />
          <button onClick={join}>
            Oyuna katıl <b>→</b>
          </button>
          <small>5 veya 6 haneli sınıf kodu</small>
        </aside>
      </section>
      <section className="student-profile-strip">
        <div className="student-avatar">
          {identity.fullName.charAt(0).toLocaleUpperCase("tr-TR")}
        </div>
        <div>
          <small>HOŞ GELDİN</small>
          <b>{identity.fullName}</b>
          <span>{identity.email}</span>
        </div>
        <i>Kurumsal öğrenci hesabı</i>
      </section>
      <section className="student-portal-grid">
        <article>
          <i>🔥</i>
          <div>
            <small>AKTİF SERİ</small>
            <strong>0 gün</strong>
            <span>İlk etkinliğinle seriyi başlat</span>
          </div>
        </article>
        <article>
          <i>◆</i>
          <div>
            <small>TOPLAM XP</small>
            <strong>0 XP</strong>
            <span>Puanların burada birikecek</span>
          </div>
        </article>
        <article>
          <i>♛</i>
          <div>
            <small>ROZETLER</small>
            <strong>0 rozet</strong>
            <span>Başarılarını görünür kıl</span>
          </div>
        </article>
      </section>
      <section className="portal-empty">
        <span>✦</span>
        <div>
          <h3>İlk sınıf maceran seni bekliyor.</h3>
          <p>
            Öğretim görevlisinin paylaştığı kodla katıldığın etkinlikler burada
            görünecek.
          </p>
        </div>
      </section>
      {toast && <div className="toast">{toast}</div>}
    </main>
  );
}

function Landing({
  code,
  setCode,
  name,
  setName,
  identity,
  studentLogin,
  teacher,
  join,
  toast,
}: {
  code: string;
  setCode: (v: string) => void;
  name: string;
  setName: (v: string) => void;
  identity: Identity | null;
  studentLogin: () => void;
  teacher: () => void;
  join: () => void;
  toast: string;
}) {
  const nameError = name ? validateParticipantName(name) : "";
  const submitOnEnter = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") join();
  };
  return (
    <main className="landing old-home">
      <nav className="topbar">
        <Logo />
        <div>
          <a href="#araclar">Etkinlikler</a>
          <a href="#nasil">Nasıl çalışır?</a>
          <button className="student-login-link" onClick={studentLogin}>
            {identity ? "Öğrenci panelim" : "Öğrenci girişi"}
          </button>
          <button className="ghost" onClick={teacher}>
            {identity?.role === "instructor"
              ? "Akademisyen panelim"
              : "Akademisyen girişi"}
          </button>
        </div>
      </nav>
      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow">
            <span>●</span> ÜNİVERSİTE SINIFLARI İÇİN
          </div>
          <h1>
            Bilgiyi anlat.
            <br />
            <em>Merakı harekete geçir.</em>
          </h1>
          <p>
            Dersin akademik ciddiyetini koruyan; quiz, anket ve takım
            yarışlarıyla öğrenciyi kararın, tartışmanın ve üretimin içine alan
            canlı sınıf platformu.
          </p>
          <div className="hero-actions">
            <button className="primary" onClick={teacher}>
              Canlı oturum oluştur →
            </button>
            <span>Kurulum yok · Tarayıcıdan katılım</span>
          </div>
        </div>
        <div className="hero-stage">
          <div className="hero-orbit orbit-one">◆</div>
          <div className="hero-orbit orbit-two">✦</div>
          <div className="floating-proof proof-score">
            <span>🔥 SERİ</span>
            <b>+1.240 XP</b>
            <small>3 doğru cevap</small>
          </div>
          <div className="floating-proof proof-live">
            <i>●</i>
            <span>
              <b>42 öğrenci</b>
              <small>şu an bağlı</small>
            </span>
          </div>
          <div className="join-card">
            <div className="campus-mark">
              ÜNİVERSİTE
              <br />
              <b>ETKİLEŞİM AĞI</b>
            </div>
            <div className="join-head">
              <span className="join-label">ÖĞRENCİ KATILIMI</span>
              <span className="join-live">
                <i /> CANLI
              </span>
            </div>
            <h2>Derse bağlan</h2>
            <p>
              Tahtadaki oturum kodunu gir, kurumsal Microsoft hesabınla katıl.
            </p>
            <div className="join-steps" aria-hidden="true">
              <b>1</b>
              <span>Kodu gir</span>
              <i />
              <b>2</b>
              <span>Adını yaz</span>
              <i />
              <b>3</b>
              <span>Oyundasın</span>
            </div>
            <div className="join-field">
              <label htmlFor="session-code">Oturum kodu</label>
              <input
                id="session-code"
                className="session-code-input"
                value={code}
                onChange={(e) =>
                  setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                onKeyDown={submitOnEnter}
                placeholder="000 000"
                inputMode="numeric"
                autoComplete="one-time-code"
                aria-label="5 veya 6 haneli oturum kodu"
              />
            </div>
            <div className="join-field">
              <label htmlFor="participant-name">Görünen ad</label>
              <input
                id="participant-name"
                className={
                  nameError
                    ? "participant-name-input invalid"
                    : "participant-name-input"
                }
                value={name}
                onChange={(e) => setName(e.target.value.slice(0, 24))}
                onKeyDown={submitOnEnter}
                placeholder="Microsoft profilinden alınacak"
                maxLength={24}
                autoComplete="name"
                aria-describedby="name-safety-rule"
                aria-invalid={Boolean(nameError)}
                readOnly
              />
              <small
                id="name-safety-rule"
                className={`name-rule ${nameError ? "invalid" : name ? "valid" : ""}`}
              >
                {identity
                  ? `✓ Microsoft 365 · ${identity.email}`
                  : nameError ||
                    (name
                      ? "✓ Görünen ad uygun"
                      : "Adın Microsoft 365 profilinden alınır")}
              </small>
            </div>
            <button onClick={join}>Oturuma katıl →</button>
            <small className="safe-name-note">
              <span>◆</span> Microsoft 365 doğrulaması · Güvenli ad filtresi
            </small>
          </div>
          <div className="mini-leader">
            <span>1</span>
            <i>İD</i>
            <b>İlker</b>
            <em>4.820 XP</em>
          </div>
        </div>
      </section>
      <section className="ticker">
        <div className="ticker-track">
          {[0, 1].map((n) => (
            <div key={n}>
              <span>◆ CANLI QUIZ</span>
              <span>◌ KELİME BULUTU</span>
              <span>▥ ANLIK ANKET</span>
              <span>♛ TAKIM ARENASI</span>
              <span>✦ HIZLI GÖREV</span>
              <span>◎ ÖĞRENME RADARI</span>
            </div>
          ))}
        </div>
      </section>
      <section className="live-proof-strip">
        <div>
          <strong>6 sn</strong>
          <span>ortalama katılım süresi</span>
        </div>
        <div>
          <strong>%91</strong>
          <span>sınıf içi aktif katılım</span>
        </div>
        <div>
          <strong>8+</strong>
          <span>etkileşim ve soru biçimi</span>
        </div>
        <div className="pulse-demo">
          <span>CANLI SINIF NABZI</span>
          <i>
            <em />
            <em />
            <em />
            <em />
            <em />
          </i>
        </div>
      </section>
      <section id="araclar" className="tools">
        <small>AKADEMİK ODAK, AKTİF KATILIM</small>
        <h2>
          Her ders için doğru
          <br />
          <em>etkileşim biçimi.</em>
        </h2>
        <div className="public-games">
          {types.map((g) => (
            <article key={g.type}>
              <i>{g.icon}</i>
              <span>
                <b>{g.type}</b>
                <small>{g.desc}</small>
              </span>
            </article>
          ))}
        </div>
      </section>
      <section id="nasil" className="steps">
        <div>
          <b>01</b>
          <h3>Oturumu oluştur</h3>
          <p>Dersine uygun etkinliği seç, kodu sınıfa yansıt.</p>
        </div>
        <div>
          <b>02</b>
          <h3>Sınıf bağlansın</h3>
          <p>Öğrenciler telefonlarından saniyeler içinde katılsın.</p>
        </div>
        <div>
          <b>03</b>
          <h3>Veriyi tartış</h3>
          <p>Yanıtları, eğilimleri ve puanları sınıfça değerlendirin.</p>
        </div>
      </section>
      <footer>
        <Logo />
        <p>Üniversite sınıflarında ölçülebilir katılım.</p>
        <span>© 2026 DOU DersAktif</span>
      </footer>
      {toast && <div className="toast">{toast}</div>}
    </main>
  );
}
function Logo({ dark = false }: { dark?: boolean }) {
  return (
    <div className={`logo wordmark ${dark ? "dark" : ""}`}>
      <b>DOU</b>
      <i>DersAktif</i>
    </div>
  );
}

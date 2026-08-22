"use client";
import { useEffect, useRef, useState } from "react";
import { roomTopic, supabase } from "@/lib/supabase";
type View = "live" | "activities" | "reports";
type GameType =
  | "Quiz"
  | "Anket"
  | "Kelime Bulutu"
  | "Takım Arenası"
  | "Hızlı Görev";
type Question = { q: string; a: string[]; correct: number; seconds?: number };
type Activity = {
  id: number;
  type: GameType;
  title: string;
  questions: number;
  plays: number;
  accent: string;
  content?: Question[];
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
  const [mode, setMode] = useState<"landing" | "teacher" | "student">(
      "landing",
    ),
    [view, setView] = useState<View>("live"),
    [activities, setActivities] = useState(starters),
    [builder, setBuilder] = useState(false),
    [playing, setPlaying] = useState<GameType | null>(null),
    [selected, setSelected] = useState(starters[0]),
    [code, setCode] = useState(""),
    [studentName, setStudentName] = useState(""),
    [toast, setToast] = useState("");
  useEffect(() => {
    try {
      const saved = localStorage.getItem("dou-activities");
      if (saved) setActivities(JSON.parse(saved));
    } catch {}
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem("dou-activities", JSON.stringify(activities));
    } catch {}
  }, [activities]);
  const notify = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(""), 2200);
  };
  if (mode === "student")
    return (
      <StudentStage
        name={studentName}
        code={code || "481 209"}
        onExit={() => setMode("landing")}
      />
    );
  if (mode === "landing")
    return (
      <Landing
        code={code}
        setCode={setCode}
        name={studentName}
        setName={setStudentName}
        teacher={() => setMode("teacher")}
        join={() =>
          code.length >= 5
            ? setMode("student")
            : notify("5 veya 6 haneli oturum kodunu gir")
        }
        toast={toast}
      />
    );
  return (
    <main className="app-shell">
      <Sidebar view={view} setView={setView} exit={() => setMode("landing")} />
      <section className="workspace">
        <header className="workspace-head">
          <div>
            <span className="overline">DOĞUŞ ÜNİVERSİTESİ · DERS AKTİF</span>
            <h1>
              {view === "live"
                ? "Sınıf hazır. Oyunu başlatalım."
                : view === "activities"
                  ? "Etkinlik stüdyosu"
                  : "Ders raporları"}
            </h1>
          </div>
          <div className="head-actions">
            <button
              className="icon-button"
              onClick={() => notify("Bildirimlerin güncel")}
            >
              ♢<i>3</i>
            </button>
            <button className="soft-button" onClick={() => setBuilder(true)}>
              ＋ Etkinlik oluştur
            </button>
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
            create={() => setBuilder(true)}
            play={(a) => {
              setSelected(a);
              setPlaying(a.type);
            }}
          />
        )}
        {view === "reports" && <Reports />}
      </section>
      {builder && (
        <Builder
          close={() => setBuilder(false)}
          save={(a) => {
            setActivities((v) => [a, ...v]);
            setBuilder(false);
            setView("activities");
            notify("Etkinlik kaydedildi!");
          }}
        />
      )}
      {playing && (
        <Arena
          type={playing}
          title={selected.title}
          questions={selected.content || quiz}
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
        <button
          className={view === "live" ? "active" : ""}
          onClick={() => setView("live")}
        >
          <span>●</span>Canlı Ders
        </button>
        <button
          className={view === "activities" ? "active" : ""}
          onClick={() => setView("activities")}
        >
          <span>▦</span>Etkinliklerim
        </button>
        <button
          className={view === "reports" ? "active" : ""}
          onClick={() => setView("reports")}
        >
          <span>▤</span>Ders Raporları
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
}: {
  activities: Activity[];
  create: () => void;
  play: (a: Activity) => void;
}) {
  const [filter, setFilter] = useState("Tümü");
  const visible =
    filter === "Tümü"
      ? activities
      : activities.filter((a) => a.type === filter);
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
      </div>
      <div className="library-grid">
        {visible.map((a) => (
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
                <button onClick={create}>Düzenle</button>
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
  return (
    <>
      <div className="metric-grid">
        {[
          ["Toplam katılım", "1.284", "+18%", "↗"],
          ["Ortalama doğruluk", "%76", "+6%", "◎"],
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
          <button onClick={() => alert("Demo raporu indirilmeye hazırlandı.")}>
            Raporu indir ↓
          </button>
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
function Builder({
  close,
  save,
}: {
  close: () => void;
  save: (a: Activity) => void;
}) {
  const [step, setStep] = useState(1),
    [type, setType] = useState<GameType>("Quiz"),
    [title, setTitle] = useState(""),
    [question, setQuestion] = useState(""),
    [answers, setAnswers] = useState(["", "", "", ""]),
    [correct, setCorrect] = useState(0);
  const finish = () =>
    save({
      id: Date.now(),
      type,
      title: title || "Yeni Etkinlik",
      questions: 1,
      plays: 0,
      accent: types.find((g) => g.type === type)?.color || "#d70926",
    });
  return (
    <div className="modal">
      <div className="builder">
        <header>
          <div>
            <span className="overline">ETKİNLİK STÜDYOSU</span>
            <h2>Yeni etkinlik oluştur</h2>
          </div>
          <button onClick={close}>×</button>
        </header>
        <div className="steps-line">
          <i className="done">1</i>
          <span />
          <i className={step >= 2 ? "done" : ""}>2</i>
          <span />
          <i className={step >= 3 ? "done" : ""}>3</i>
        </div>
        {step === 1 && (
          <section>
            <h3>Bir oyun biçimi seç</h3>
            <div className="type-grid">
              {types.map((g) => (
                <button
                  key={g.type}
                  className={type === g.type ? "active" : ""}
                  onClick={() => setType(g.type)}
                  style={{ "--accent": g.color } as React.CSSProperties}
                >
                  <i>{g.icon}</i>
                  <b>{g.type}</b>
                  <small>{g.desc}</small>
                </button>
              ))}
            </div>
            <label>
              Etkinlik adı
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Örn. Araştırma Yöntemleri Finali"
              />
            </label>
          </section>
        )}
        {step === 2 && (
          <section>
            <h3>İlk içeriğini ekle</h3>
            <label>
              Soru veya görev
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Sorunu buraya yaz..."
              />
            </label>
            {type === "Quiz" && (
              <div className="answer-editor">
                {answers.map((a, i) => (
                  <label key={i} className={correct === i ? "correct" : ""}>
                    <button onClick={() => setCorrect(i)}>
                      {String.fromCharCode(65 + i)}
                    </button>
                    <input
                      value={a}
                      onChange={(e) =>
                        setAnswers((v) =>
                          v.map((x, j) => (j === i ? e.target.value : x)),
                        )
                      }
                      placeholder={`${i + 1}. seçenek`}
                    />
                  </label>
                ))}
              </div>
            )}
            <div className="builder-hint">
              💡 Doğru seçeneğin harfine tıkla. Sonucu sınıfça tartış.
            </div>
          </section>
        )}
        {step === 3 && (
          <section className="publish-step">
            <span>✓</span>
            <h3>Etkinliğin hazır!</h3>
            <p>
              <b>{title || "Yeni Etkinlik"}</b>, {type} formatında kaydedilecek.
            </p>
            <div>
              <small>FORMAT</small>
              <b>{type}</b>
              <small>İÇERİK</small>
              <b>1 soru</b>
            </div>
          </section>
        )}
        <footer>
          <button
            className="outline"
            onClick={step === 1 ? close : () => setStep((v) => v - 1)}
          >
            ← {step === 1 ? "Vazgeç" : "Geri"}
          </button>
          {step < 3 ? (
            <button className="primary" onClick={() => setStep((v) => v + 1)}>
              Devam et →
            </button>
          ) : (
            <button className="primary" onClick={finish}>
              Kaydet ve bitir ✓
            </button>
          )}
        </footer>
      </div>
    </div>
  );
}
type GamePhase = "lobby" | "question" | "leaderboard" | "final";
type Player = { id: string; name: string; score: number };

function Arena({
  type,
  title,
  questions = quiz,
  close,
}: {
  type: GameType;
  title: string;
  questions?: Question[];
  close: () => void;
}) {
  const code = "481209";
  const [phase, setPhase] = useState<GamePhase>("lobby");
  const [round, setRound] = useState(0);
  const [players, setPlayers] = useState<Player[]>([]);
  const [answers, setAnswers] = useState(0);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const current = questions[round % questions.length];

  useEffect(() => {
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
          score: old.find((x) => x.id === p.id)?.score || 0,
        })),
      );
    });
    channel.on("broadcast", { event: "answer" }, ({ payload }) => {
      setAnswers((v) => v + 1);
      if (payload.correct)
        setPlayers((old) =>
          old.map((p) =>
            p.id === payload.id ? { ...p, score: p.score + payload.points } : p,
          ),
        );
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
    channelRef.current?.send({
      type: "broadcast",
      event: "game-state",
      payload: {
        phase: next,
        round: nextRound,
        title,
        type,
        question: questions[nextRound % questions.length],
      },
    });
  };
  const sorted = [...players].sort((a, b) => b.score - a.score);

  return (
    <div className="modal arena-modal">
      <div className="game-arena realtime-arena">
        <header>
          <div>
            <span className="live-pill">● GERÇEK ZAMANLI</span>
            <h2>{title}</h2>
          </div>
          <div>
            <b>
              {code.slice(0, 3)} {code.slice(3)}
            </b>
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
                <span key={p.id}>● {p.name}</span>
              ))}
            </div>
            <button className="primary" onClick={() => broadcast("question")}>
              Oyunu başlat →
            </button>
          </section>
        )}
        {phase === "question" && (
          <section className="quiz-arena">
            <div className="quiz-meta">
              <span>
                SORU {round + 1} / {questions.length}
              </span>
              <b>{answers} yanıt</b>
            </div>
            <h3>{current.q}</h3>
            <div>
              {current.a.map((a, i) => (
                <button
                  key={a}
                  className={i === current.correct ? "host-correct" : ""}
                >
                  <b>{String.fromCharCode(65 + i)}</b>
                  {a}
                </button>
              ))}
            </div>
            <footer>
              <span>{players.length} bağlı öğrenci</span>
              <button onClick={() => broadcast("leaderboard")}>
                Cevapları kapat →
              </button>
            </footer>
          </section>
        )}
        {phase === "leaderboard" && (
          <section className="live-board">
            <span className="overline">ARA SIRALAMA</span>
            <h3>Tahta değişti!</h3>
            {sorted.slice(0, 5).map((p, i) => (
              <div key={p.id}>
                <b>{i + 1}</b>
                <span>{p.name}</span>
                <strong>{p.score} XP</strong>
              </div>
            ))}
            <button
              className="primary"
              onClick={() =>
                round + 1 < questions.length
                  ? broadcast("question", round + 1)
                  : broadcast("final")
              }
            >
              {round + 1 < questions.length
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
    typeof crypto !== "undefined" ? crypto.randomUUID() : `${Date.now()}`,
  );
  const [status, setStatus] = useState("Oturuma bağlanılıyor…");
  const [phase, setPhase] = useState<GamePhase>("lobby");
  const [round, setRound] = useState(0);
  const [question, setQuestion] = useState<Question>(quiz[0]);
  const [answer, setAnswer] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    const channel = supabase.channel(roomTopic(cleanCode), {
      config: { presence: { key: idRef.current } },
    });
    channelRef.current = channel;
    channel.on("broadcast", { event: "game-state" }, ({ payload }) => {
      setPhase(payload.phase);
      setRound(payload.round);
      if (payload.question) setQuestion(payload.question);
      setAnswer(null);
    });
    channel.subscribe((s) => {
      if (s === "SUBSCRIBED") {
        setStatus("Canlı odaya bağlandın");
        channel.track({
          id: idRef.current,
          name: name || "Misafir öğrenci",
          score,
        });
      }
    });
    return () => {
      supabase.removeChannel(channel);
    };
  }, [cleanCode, name]);

  const choose = (i: number) => {
    if (answer !== null) return;
    setAnswer(i);
    const correct = i === question.correct;
    const points = correct ? 100 : 0;
    if (correct) setScore((v) => v + points);
    channelRef.current?.send({
      type: "broadcast",
      event: "answer",
      payload: { id: idRef.current, answer: i, correct, points },
    });
  };

  return (
    <main className="student-stage">
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
          <div className="quiz-meta">
            <span>◆ CANLI QUIZ</span>
            <span>{round + 1}</span>
          </div>
          <div className="timer">
            <i />
          </div>
          <h1>{question.q}</h1>
          <div className="student-answers">
            {question.a.map((a, i) => (
              <button
                className={answer === i ? "selected" : ""}
                key={a}
                onClick={() => choose(i)}
                disabled={answer !== null}
              >
                <b>{String.fromCharCode(65 + i)}</b>
                {a}
              </button>
            ))}
          </div>
          <p>
            {answer === null
              ? "Yanıtını seç — hız puan kazandırır."
              : answer === question.correct
                ? "Harika! +100 XP 🎉"
                : "Yanıtın kaydedildi. Sıradaki turda devam!"}
          </p>
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
function Landing({
  code,
  setCode,
  name,
  setName,
  teacher,
  join,
  toast,
}: {
  code: string;
  setCode: (v: string) => void;
  name: string;
  setName: (v: string) => void;
  teacher: () => void;
  join: () => void;
  toast: string;
}) {
  return (
    <main className="landing old-home">
      <nav className="topbar">
        <Logo />
        <div>
          <a href="#araclar">Etkinlikler</a>
          <a href="#nasil">Nasıl çalışır?</a>
          <button className="ghost" onClick={teacher}>
            Akademisyen girişi
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
        <div className="join-card">
          <div className="campus-mark">
            ÜNİVERSİTE
            <br />
            <b>ETKİLEŞİM AĞI</b>
          </div>
          <span className="join-label">ÖĞRENCİ KATILIMI</span>
          <h2>Derse bağlan</h2>
          <p>Tahtadaki altı haneli oturum kodunu gir.</p>
          <label>Oturum kodu</label>
          <input
            value={code}
            onChange={(e) =>
              setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
            }
            placeholder="000 000"
            inputMode="numeric"
          />
          <label>Görünen ad</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ad Soyad"
          />
          <button onClick={join}>Oturuma katıl →</button>
          <small>Öğrenci hesabı gerektirmez</small>
        </div>
      </section>
      <section className="ticker">
        <span>◆ CANLI QUIZ</span>
        <span>◌ KELİME BULUTU</span>
        <span>▥ ANLIK ANKET</span>
        <span>♛ TAKIM ARENASI</span>
        <span>✦ HIZLI GÖREV</span>
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

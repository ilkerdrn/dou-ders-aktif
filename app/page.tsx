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
type Question = {
  q: string;
  a: string[];
  correct: number;
  seconds?: number;
  image?: string;
};
type Activity = {
  id: number;
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
    [editing, setEditing] = useState<Activity | null>(null),
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
            <button
              className="soft-button"
              onClick={() => {
                setEditing(null);
                setBuilder(true);
              }}
            >
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
              <div className="question-image-preview">
                <img src={current.image} alt="Soru görseli ön izlemesi" />
              </div>
            )}
            <div className="answer-editor colorful">
              {current.a.map((a, i) => (
                <label
                  key={i}
                  className={`option-${i} ${current.correct === i ? "correct" : ""}`}
                >
                  <button onClick={() => update({ correct: i })}>
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
                  <i>{current.correct === i ? "✓ DOĞRU" : ""}</i>
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
type Player = { id: string; name: string; score: number; streak?: number };
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
  const [timeLeft, setTimeLeft] = useState(20);
  const [paused, setPaused] = useState(false);
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
  const current = gameQuestions[round % gameQuestions.length];

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
      setAnswerStats((old) =>
        old.map((n, i) => (i === payload.answer ? n + 1 : n)),
      );
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
            <h3>{current.q}</h3>
            {current.image && (
              <div className="game-question-image">
                <img src={current.image} alt="Soru görseli" />
              </div>
            )}
            <div>
              {current.a.map((a, i) => (
                <button key={a} className={`game-option option-${i}`}>
                  <b>{optionMarks[i]}</b>
                  <span>{a}</span>
                  <small>
                    {answers ? Math.round((answerStats[i] / answers) * 100) : 0}
                    %
                  </small>
                </button>
              ))}
            </div>
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
    typeof crypto !== "undefined" ? crypto.randomUUID() : `${Date.now()}`,
  );
  const [status, setStatus] = useState("Oturuma bağlanılıyor…");
  const [phase, setPhase] = useState<GamePhase>("lobby");
  const [round, setRound] = useState(0);
  const [question, setQuestion] = useState<Question>(quiz[0]);
  const [answer, setAnswer] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [timeLeft, setTimeLeft] = useState(20);
  const [fiftyUsed, setFiftyUsed] = useState(false);
  const [hiddenOptions, setHiddenOptions] = useState<number[]>([]);
  const [spotlight, setSpotlight] = useState("");
  const startedAtRef = useRef(Date.now());
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
      if (payload.question) setTimeLeft(payload.question.seconds || 20);
      if (payload.startedAt) startedAtRef.current = payload.startedAt;
      setAnswer(null);
      setFeedback(null);
      setHiddenOptions([]);
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

  useEffect(() => {
    if (phase !== "question") return;
    const timer = window.setInterval(
      () => setTimeLeft((value) => Math.max(0, value - 1)),
      1000,
    );
    return () => window.clearInterval(timer);
  }, [phase, round]);

  const choose = (i: number) => {
    if (answer !== null) return;
    setAnswer(i);
    const correct = i === question.correct;
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
      },
    });
  };
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
          {spotlight && <div className="spotlight-toast">✦ {spotlight}</div>}
          <div className="student-gamebar">
            <span>🔥 {streak} SERİ</span>
            <b>{score.toLocaleString("tr-TR")} XP</b>
            <span>SORU {round + 1}</span>
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
          {question.image && (
            <div className="student-question-image">
              <img src={question.image} alt="Soru görseli" />
            </div>
          )}
          <div className="powerups">
            <button onClick={useFifty} disabled={fiftyUsed}>
              ◐ 50:50 {fiftyUsed ? "kullanıldı" : "jokeri"}
            </button>
            <span>Doğru seri: 🔥 {streak}</span>
          </div>
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

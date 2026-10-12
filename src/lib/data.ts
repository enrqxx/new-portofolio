/**
 * Placeholder portfolio data.
 *
 * Ganti isi file ini dengan data kamu sendiri — nama, role, skills, projects,
 * experience, dan kontak. Semua section membaca dari sini.
 */

export const PLAYER = {
  name: "Yusyfi",
  // Role/profesi kamu
  role: "Web & Mobile Developer",
  // Foto kamu (avatar) — dipakai di section CHECK & SAVE screen
  avatar: "/img/avatar.jpeg",
  // LV (Love) — di Undertale ini adalah level kamu. Anggap saja "level karir".
  level: 12,
  // HP maksimum kamu
  maxHp: 92,
  hp: 92,
  // Senjata & armor simbolik
  weapon: "Laptop of Determination",
  armor: "Hoodie of Comfort",
  gold: 999,
};

// Dibuka saat pemain memilih "CHECK" di menu ACT.
export const ABOUT = {
  // Baris pertama khas Undertale: "* <NAME> — <role>"
  checkLine: "* A determined developer who builds things with care.",
  // Paragraf panjang untuk flavor text
  description:
    "Seorang developer yang percaya bahwa kode yang baik adalah kode yang berempati pada penggunanya. Senang membangun antarmuka yang ringan, cepat, dan menyenangkan dipakai. Saat tidak sedang ngoding, biasanya sedang main game, ngopi, atau keduanya sekaligus.",
  // Flavour text singkat di bawah nama (seperti flavor text enemy)
  flavorText: "* Smells like freshly brewed coffee.",
  stats: [
    { label: "ATK", value: 24, note: "Clean code & architecture" },
    { label: "DEF", value: 18, note: "Testing & type safety" },
    { label: "SPD", value: 30, note: "Fast iteration & shipping" },
    { label: "DEX", value: 21, note: "UI/UX attention to detail" },
  ],
};

// Section STATS — skill kamu ditampilkan seperti stats di game.
// icon memakai nama icon pixel yang ada di components/ui/icons.tsx
export const SKILLS = [
  { name: "TypeScript", level: 88, icon: "code" as const, note: "Type safety is determination" },
  { name: "React / Next.js", level: 90, icon: "atom" as const, note: "App Router & RSC" },
  { name: "Tailwind CSS", level: 85, icon: "palette" as const, note: "Utility-first styling" },
  { name: "Node.js", level: 75, icon: "server" as const, note: "APIs & tooling" },
  { name: "UI Design", level: 70, icon: "heart" as const, note: "Empathy-driven interfaces" },
  { name: "Git", level: 82, icon: "branch" as const, note: "Branch, rebase, repeat" },
  { name: "PHP", level: 80, icon: "php" as const, note: "The classic server-side" },
  { name: "Laravel", level: 78, icon: "laravel" as const, note: "Elegant PHP framework" },
  { name: "ExtJS", level: 72, icon: "extjs" as const, note: "Enterprise-grade UI components" },
  { name: "Python", level: 76, icon: "python" as const, note: "Scripts, data, and beyond" },
];

// Section ENCOUNTERS — project kamu ditampilkan seperti encounter musuh.
export type Project = {
  id: string;
  name: string;
  // Gaya nama enemy: uppercase, sedikit mengintimidasi tapi ramah
  enemyName: string;
  description: string;
  checkText: string;
  tags: string[];
  year: string;
  url?: string;
  // Warna aksen enemy ( Undertale enemy sprite berwarna )
  color: string;
};

export const PROJECTS: Project[] = [
  {
    id: "project-1",
    name: "Project One",
    enemyName: "THE FIRST ENCOUNTER",
    description: "Aplikasi web pertama yang benar-benar selesai dan dipakai orang",
    checkText:
      "* PROJECT ONE — Sebuah aplikasi web full-stack. Dibangun saat masih belajar, jadi kodenya berantakan tapi jujur. Purwakarta | Pratama Solusi Teknologi",
    tags: ["Codeigniter 3", "PHP", "MySQL"],
    year: "4 Months",
    url: "https://silapakprestasi-dpmptsp.purwakartakab.go.id/",
    color: "#ff4b4b",
  },
  {
    id: "project-2",
    name: "Project Two",
    enemyName: "THE SECOND BOSS",
    description: "Sebuah platform dengan fokus pada performa & Landing Page yang cepat.",
    checkText:
      "* PROJECT TWO — Platform yang mengutamakan kecepatan. Load time di bawah satu detik, atau setidaknya itulah targetnya, Jujur di sini tidak hanya IT Programmer saya sebagai IT Support Juga",
    tags: ["PHP", "WordPress"],
    year: "2025",
    url: "https://rsuasripurwakarta.com/",
    color: "#4b8bff",
  },
  {
    id: "project-4",
    name: "Project Three",
    enemyName: "THE TRUE FINAL BOSS",
    description: "Project terbesar & paling menantang yang pernah dikerjakan.",
    checkText:
      "* PROJECT THREE — Project paling besar. Banyak hal dipelajari, banyak bug dikalahkan, banyak kopi dihabiskan sampe sekarang :(",
    tags: ["Full-stack", "Teamwork", "Laravel", "PostgreSQL", "VueJS", "PHP"],
    year: "Now",
    url: "https://hub.scm.co.id/",
    color: "#b04bff",
  },
];

// Section JOURNEY — experience/pendidikan dalam bentuk dialog.
export type JourneyEntry = {
  id: string;
  year: string;
  title: string;
  place: string;
  text: string;
};

export const JOURNEY: JourneyEntry[] = [
  {
    id: "j1",
    year: "2018-2023",
    title: "Education",
    place: "College/ University",
    text: "* Bandung - University Pasundan | S1 Informatika",
  },
  {
    id: "j2",
    year: "3 Month",
    title: "First Job",
    place: "Freelance Full Stack Developer",
    text: "* Purwakarta | Pratama Solusi Teknologi",
  },
  {
    id: "j3",
    year: "2 Months",
    title: "Leveling Up",
    place: "Freelance Web Development",
    text: "* Pangandaran - IT Elementary School An-Nahar",
  },
  {
    id: "j4",
    year: "4 Months",
    title: "Grinding",
    place: "IT Programmer",
    text: "* RSU Asri - Purwakarta | Full Stack Developer",
  },
  {
    id: "j5",
    year: "2025 - Now",
    title: "Current Quest",
    place: "IT Web & Mobile Developer",
    text: "* PT Indosiar Visual Mandiri",
  },
];

// Section MERCY — kontak
export const CONTACT = {
  mercyText:
    "* Kamu bisa menghubunginya. Dia tidak akan menolak percakapan yang ramah.",
  spareLine: "* You feel like reaching out.",
  email: "hello@example.com",
  socials: [
    { label: "GITHUB", url: "https://github.com" },
    { label: "LINKEDIN", url: "https://linkedin.com" },
    { label: "TWITTER", url: "https://twitter.com" },
    { label: "EMAIL", url: "mailto:hello@example.com" },
  ],
};

// Teks pembuka SAVE screen
export const SAVE_SCREEN = {
  determination: "* You're filled with DETERMINATION.",
  prompt: "* Continue your story?",
};

// Baris pembuka hub — dipilih acak tiap kali masuk, supaya tidak
// selalu kalimat yang sama. {name} diganti dengan nama pemain.
export const HUB_LINES = [
  "* {name} stands at a crossroads. Where will you go?",
  "* {name} hears a faint melody. Which path calls to you?",
  "* The road splits in many directions. {name} hesitates...",
  "* A save point glows nearby. But first, pick a destination.",
  "* {name} feels a spark of determination. Where to next?",
  "* Something stirs in the distance. Choose your route.",
  "* {name} checks the map. There are places worth visiting.",
  "* The stars whisper directions. {name} listens closely.",
];

export function randomHubLine(): string {
  const line = HUB_LINES[Math.floor(Math.random() * HUB_LINES.length)];
  return line.replace("{name}", PLAYER.name);
}

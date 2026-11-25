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
  // File CV PDF — disimpan di folder public/
  cvUrl: "/MuhammadYusyfiFuada-CV.pdf",
  cvFileName: "MuhammadYusyfiFuada-CV.pdf",
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
    "A developer who believes great code starts with empathy for the people using it. I enjoy crafting interfaces that are fast, lightweight, and genuinely fun to use. When I'm not coding, I'm usually gaming, brewing coffee, or doing both at once.",
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
    name: "SiLapak Prestasi — DPMPTSP Purwakarta",
    enemyName: "SILAPAK PRESTASI",
    description: "A public-service web application shipped for DPMPTSP Purwakarta.",
    checkText:
      "* SILAPAK PRESTASI — Full-stack government service web app built with Pratama Solusi Teknologi in Purwakarta. Delivered end-to-end features used in daily operations.",
    tags: ["CodeIgniter 3", "PHP", "MySQL"],
    year: "2024",
    url: "https://silapakprestasi-dpmptsp.purwakartakab.go.id/",
    color: "#ff4b4b",
  },
  {
    id: "project-2",
    name: "RSU Asri Purwakarta",
    enemyName: "RSU ASRI WEB",
    description: "A fast, accessible hospital web platform focused on clear patient information.",
    checkText:
      "* RSU ASRI WEB — Performance-focused hospital website and landing page for RSU Asri Purwakarta, developed alongside hands-on IT support and infrastructure work.",
    tags: ["PHP", "WordPress"],
    year: "2025",
    url: "https://rsuasripurwakarta.com/",
    color: "#4b8bff",
  },
  {
    id: "project-3",
    name: "SCM Hub",
    enemyName: "SCM HUB",
    description: "The largest and most challenging enterprise platform I have worked on.",
    checkText:
      "* SCM HUB — Large-scale collaborative full-stack platform. Countless features shipped, tough bugs defeated, and plenty of coffee fueled the journey.",
    tags: ["Full-stack", "Laravel", "Vue.js", "PostgreSQL", "PHP"],
    year: "2025 – Present",
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
    year: "2018 – 2023",
    title: "Education",
    place: "Pasundan University, Bandung",
    text: "* B.Sc. in Informatics Engineering (S1 Informatika) — where the journey began.",
  },
  {
    id: "j2",
    year: "3 Months",
    title: "First Quest",
    place: "Freelance Full-Stack Developer",
    text: "* Pratama Solusi Teknologi, Purwakarta — built and shipped production web features.",
  },
  {
    id: "j3",
    year: "2 Months",
    title: "Leveling Up",
    place: "Freelance Web Developer",
    text: "* Elementary School An-Nahar, Pangandaran — developed web solutions for school operations.",
  },
  {
    id: "j4",
    year: "4 Months",
    title: "Grinding",
    place: "IT Programmer & Support",
    text: "* RSU Asri, Purwakarta — full-stack web development combined with hospital IT operations.",
  },
  {
    id: "j5",
    year: "2025 – Present",
    title: "Current Quest",
    place: "IT Web & Mobile Developer",
    text: "* PT Indosiar Visual Mandiri — building scalable web and mobile applications.",
  },
];

// Section MERCY — kontak
export const CONTACT = {
  mercyText:
    "Feel free to reach out. He never turns down a friendly conversation or a cool collaboration.",
  spareLine: "* You feel like reaching out.",
  email: "yusyfi.fuada@gmail.com",
  socials: [
    { label: "GITHUB", url: "https://github.com/enrqxx" },
    { label: "LINKEDIN", url: "https://www.linkedin.com/in/yusyfi-fuada/" },
    { label: "WHATSAPP", url: "https://api.whatsapp.com/send?phone=6281322601499&text=Hello,%20Yusyfi" },
    { label: "EMAIL", url: "mailto:yusyfi.fuada@gmail.com" },
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

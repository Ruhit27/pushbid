/** Names of the icons a Category can show. The UI maps each to a Lucide icon. */
export const ICON_KEYS = [
  "trophy", "megaphone", "search-check", "list-todo", "bot", "code", "bitcoin", "gamepad", "heart-pulse", "scale",
  "shopping-bag", "plane", "rocket", "building", "wand", "share", "graduation-cap", "user", "palette", "briefcase",
  "globe", "target", "shield-check", "newspaper", "house", "pen", "mic", "chart", "kanban", "shapes", "tag", "music",
  "utensils", "film", "car", "leaf", "camera", "dumbbell", "baby", "paw", "shirt", "hammer", "cloud", "database",
  "mail", "calendar", "coins", "sparkles", "image", "video", "users", "link", "store",
] as const;

export type IconKey = (typeof ICON_KEYS)[number];

/** The icon chosen for each seeded Category. */
const BY_SLUG: Record<string, IconKey> = {
  "leaderboards-attention": "trophy",
  "marketing-advertising": "megaphone",
  "seo-ai-visibility": "search-check",
  "productivity-personal-tools": "list-todo",
  "ai-agents-infrastructure": "bot",
  "developer-tools": "code",
  "crypto-web3-investing": "bitcoin",
  "games-entertainment": "gamepad",
  "health-fitness-wellness": "heart-pulse",
  "business-finance-legal": "scale",
  "ecommerce-retail": "shopping-bag",
  "travel-local-lifestyle": "plane",
  "directories-launch-discovery": "rocket",
  "agencies-studios-services": "building",
  "ai-media-generation": "wand",
  "social-media-creator-tools": "share",
  "education-learning": "graduation-cap",
  "people-profiles": "user",
  "design-creative": "palette",
  "hiring-jobs-careers": "briefcase",
  "domains-web-assets": "globe",
  "sales-lead-generation": "target",
  "security-privacy-compliance": "shield-check",
  "media-news": "newspaper",
  "real-estate-property": "house",
  "writing-content": "pen",
  "audio-voice-podcasting": "mic",
  analytics: "chart",
  "product-management": "kanban",
  other: "shapes",
};

/** Words in a Category name that suggest an icon, checked in order, for Categories added later. */
const BY_WORD: [RegExp, IconKey][] = [
  [/music|song|band|spotify/, "music"],
  [/food|drink|restaurant|recipe|cook|coffee/, "utensils"],
  [/pet|pets|dog|dogs|cat|cats|animal/, "paw"],
  [/film|movie|cinema|tv|streaming/, "film"],
  [/video|youtube/, "video"],
  [/photo|photography|camera/, "camera"],
  [/image|images|art|illustration/, "image"],
  [/car|cars|auto|automotive|vehicle/, "car"],
  [/climate|green|eco|sustainability|nature|garden/, "leaf"],
  [/fitness|gym|sport|sports|workout/, "dumbbell"],
  [/health|medical|wellness|care/, "heart-pulse"],
  [/kid|kids|baby|parenting|family/, "baby"],
  [/fashion|clothing|apparel|style/, "shirt"],
  [/tool|tools|hardware|diy|build/, "hammer"],
  [/cloud|hosting|server|devops/, "cloud"],
  [/data|database|api/, "database"],
  [/email|mail|newsletter/, "mail"],
  [/event|events|calendar|scheduling/, "calendar"],
  [/finance|money|fintech|payment|payments|bank/, "coins"],
  [/ai|ml|gpt|llm/, "sparkles"],
  [/community|social|dating|network/, "users"],
  [/link|links|url/, "link"],
  [/shop|store|ecommerce|retail/, "store"],
  [/game|games|gaming/, "gamepad"],
  [/travel|trip|hotel/, "plane"],
  [/education|learning|course|school/, "graduation-cap"],
  [/security|privacy/, "shield-check"],
  [/news|media|blog/, "newspaper"],
  [/design|creative/, "palette"],
  [/job|jobs|hiring|career|careers/, "briefcase"],
  [/marketing|ads|advertising/, "megaphone"],
  [/writing|content/, "pen"],
  [/podcast|audio|voice/, "mic"],
  [/analytics|metrics|stats/, "chart"],
  [/crypto|web3|nft|blockchain/, "bitcoin"],
  [/code|developer|dev|programming/, "code"],
  [/agent|agents|bot|bots|automation/, "bot"],
];

const WHOLE_WORD = BY_WORD.map(([pattern, icon]) => [new RegExp(`^(?:${pattern.source})$`), icon] as const);

/** The icon for a Category: the chosen one for seeded Categories, otherwise one guessed from its name. */
export function categoryIcon(slug: string, name: string): IconKey {
  const chosen = BY_SLUG[slug];
  if (chosen) return chosen;
  const words = name.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
  for (const [whole, icon] of WHOLE_WORD) {
    if (words.some((w) => whole.test(w))) return icon;
  }
  return "tag";
}

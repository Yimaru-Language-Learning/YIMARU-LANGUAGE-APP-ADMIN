/**
 * Profile field options seeded in backend `field_options` (migration 000069).
 * Admin UI shows labels; empty / OTHER / unknown / out-of-list values fall back to defaults.
 */

export const DEFAULT_USER_AGE_GROUP_CODE = "25_34"
export const DEFAULT_USER_OCCUPATION_CODE = "STUDENTS"
export const DEFAULT_USER_REGION_CODE = "ADDIS_ABABA"
export const DEFAULT_USER_EDUCATION_LEVEL_CODE = "HIGH_SCHOOL"
export const DEFAULT_USER_LEARNING_GOAL_CODE = "EVERYDAY_CONVERSATION"
export const DEFAULT_USER_LANGUAGE_CHALLENGE_CODE = "PRONUNCIATION"
export const DEFAULT_USER_LANGUAGE_GOAL_CODE = "LEARN_TO_SPEAK_ENGLISH"
export const DEFAULT_USER_FAVOURITE_TOPIC_CODE = "FOOD_COOKING"
export const DEFAULT_USER_COUNTRY_CODE = "ET"
export const DEFAULT_USER_KNOWLEDGE_LEVEL_CODE = "BEGINNER"

type ProfileFieldOption = { code: string; label: string }

const AGE_GROUP_OPTIONS: ProfileFieldOption[] = [
  { code: "UNDER_13", label: "Under 13" },
  { code: "13_17", label: "13–17" },
  { code: "18_24", label: "18–24" },
  { code: "25_34", label: "25–34" },
  { code: "35_44", label: "35–44" },
  { code: "45_54", label: "45–54" },
  { code: "55_PLUS", label: "55+" },
]

const OCCUPATION_OPTIONS: ProfileFieldOption[] = [
  { code: "STUDENTS", label: "Students (High school & University)" },
  { code: "JOB_SEEKERS", label: "Job Seekers / Fresh Graduates" },
  { code: "WORKING_PROFESSIONALS", label: "Working Professionals (Corporate/Office)" },
  { code: "GOVERNMENT_NGO", label: "Government & NGO Workers" },
  { code: "ENTREPRENEURS", label: "Entrepreneurs & Small Business Owners" },
  { code: "HOSPITALITY_TOURISM", label: "Hospitality & Tourism Workers" },
  { code: "FREELANCERS_REMOTE", label: "Freelancers / Remote Workers (Digital Economy)" },
]

const ETHIOPIA_REGION_OPTIONS: ProfileFieldOption[] = [
  { code: "ADDIS_ABABA", label: "Addis Ababa" },
  { code: "AFAR", label: "Afar" },
  { code: "AMHARA", label: "Amhara" },
  { code: "BENISHANGUL_GUMUZ", label: "Benishangul-Gumuz" },
  { code: "CENTRAL_ETHIOPIA", label: "Central Ethiopia" },
  { code: "DIRE_DAWA", label: "Dire Dawa" },
  { code: "GAMBELA", label: "Gambela" },
  { code: "HARARI", label: "Harari" },
  { code: "OROMIA", label: "Oromia" },
  { code: "SIDAMA", label: "Sidama" },
  { code: "SOMALI", label: "Somali" },
  { code: "SOUTH_ETHIOPIA", label: "South Ethiopia" },
  { code: "SOUTH_WEST_ETHIOPIA_PEOPLES", label: "South West Ethiopia Peoples" },
  { code: "TIGRAY", label: "Tigray" },
]

const EDUCATION_LEVEL_OPTIONS: ProfileFieldOption[] = [
  { code: "NO_FORMAL", label: "No formal education" },
  { code: "PRIMARY", label: "Primary school" },
  { code: "SECONDARY", label: "Secondary school" },
  { code: "HIGH_SCHOOL", label: "High school" },
  { code: "VOCATIONAL", label: "Vocational / technical" },
  { code: "BACHELOR", label: "Bachelor's degree" },
  { code: "MASTER", label: "Master's degree" },
  { code: "DOCTORATE", label: "Doctorate" },
]

const LEARNING_GOAL_OPTIONS: ProfileFieldOption[] = [
  { code: "EVERYDAY_CONVERSATION", label: "Everyday conversation" },
  { code: "WORK_CAREER", label: "Work and career" },
  { code: "ACADEMIC_STUDY", label: "Academic study" },
  { code: "TRAVEL", label: "Travel" },
  { code: "EXAM_PREP", label: "Exam preparation" },
  { code: "PERSONAL_GROWTH", label: "Personal growth" },
]

const LANGUAGE_CHALLENGE_OPTIONS: ProfileFieldOption[] = [
  { code: "PRONUNCIATION", label: "Pronunciation" },
  { code: "WORDS_GRAMMAR", label: "Finding words or grammar quickly" },
  { code: "CONFIDENCE", label: "Feeling nervous or lacking confidence" },
  { code: "ACCENTS_FAST_SPEECH", label: "Understanding accents or fast speech" },
]

const LANGUAGE_GOAL_OPTIONS: ProfileFieldOption[] = [
  { code: "LEARN_TO_SPEAK_ENGLISH", label: "Learn to Speak English" },
  { code: "PRACTICE_TO_SPEAK_ENGLISH", label: "Practice Speaking English" },
  { code: "SKILL_BASED_COURSES", label: "Skill-based Courses" },
]

const FAVOURITE_TOPIC_OPTIONS: ProfileFieldOption[] = [
  { code: "FOOD_COOKING", label: "Food & Cooking" },
  { code: "HOBBIES_SPORTS_MUSIC", label: "Hobbies, Sports, Music" },
  { code: "TECH_NEWS_BUSINESS", label: "Tech, News, Business" },
  { code: "TRAVEL_PLACES_CULTURE", label: "Travel, Places, Culture" },
]

const KNOWLEDGE_LEVEL_OPTIONS: ProfileFieldOption[] = [
  { code: "BEGINNER", label: "Beginner" },
  { code: "INTERMEDIATE", label: "Intermediate" },
  { code: "ADVANCED", label: "Advanced" },
]

/** ISO-style country codes from field_options seed (subset used for label lookup). */
const COUNTRY_OPTIONS: ProfileFieldOption[] = [
  { code: "AF", label: "Afghanistan" },
  { code: "AL", label: "Albania" },
  { code: "DZ", label: "Algeria" },
  { code: "AD", label: "Andorra" },
  { code: "AO", label: "Angola" },
  { code: "AR", label: "Argentina" },
  { code: "AM", label: "Armenia" },
  { code: "AU", label: "Australia" },
  { code: "AT", label: "Austria" },
  { code: "AZ", label: "Azerbaijan" },
  { code: "BH", label: "Bahrain" },
  { code: "BD", label: "Bangladesh" },
  { code: "BY", label: "Belarus" },
  { code: "BE", label: "Belgium" },
  { code: "BZ", label: "Belize" },
  { code: "BJ", label: "Benin" },
  { code: "BT", label: "Bhutan" },
  { code: "BO", label: "Bolivia" },
  { code: "BA", label: "Bosnia and Herzegovina" },
  { code: "BW", label: "Botswana" },
  { code: "BR", label: "Brazil" },
  { code: "BN", label: "Brunei" },
  { code: "BG", label: "Bulgaria" },
  { code: "BF", label: "Burkina Faso" },
  { code: "BI", label: "Burundi" },
  { code: "KH", label: "Cambodia" },
  { code: "CM", label: "Cameroon" },
  { code: "CA", label: "Canada" },
  { code: "TD", label: "Chad" },
  { code: "CL", label: "Chile" },
  { code: "CN", label: "China" },
  { code: "CO", label: "Colombia" },
  { code: "KM", label: "Comoros" },
  { code: "CG", label: "Congo" },
  { code: "CR", label: "Costa Rica" },
  { code: "HR", label: "Croatia" },
  { code: "CU", label: "Cuba" },
  { code: "CY", label: "Cyprus" },
  { code: "CZ", label: "Czech Republic" },
  { code: "DK", label: "Denmark" },
  { code: "DJ", label: "Djibouti" },
  { code: "DO", label: "Dominican Republic" },
  { code: "EC", label: "Ecuador" },
  { code: "EG", label: "Egypt" },
  { code: "SV", label: "El Salvador" },
  { code: "ER", label: "Eritrea" },
  { code: "EE", label: "Estonia" },
  { code: "SZ", label: "Eswatini" },
  { code: "ET", label: "Ethiopia" },
  { code: "FI", label: "Finland" },
  { code: "FR", label: "France" },
  { code: "GA", label: "Gabon" },
  { code: "GM", label: "Gambia" },
  { code: "GE", label: "Georgia" },
  { code: "DE", label: "Germany" },
  { code: "GH", label: "Ghana" },
  { code: "GR", label: "Greece" },
  { code: "GT", label: "Guatemala" },
  { code: "GN", label: "Guinea" },
  { code: "HT", label: "Haiti" },
  { code: "HN", label: "Honduras" },
  { code: "HU", label: "Hungary" },
  { code: "IS", label: "Iceland" },
  { code: "IN", label: "India" },
  { code: "ID", label: "Indonesia" },
  { code: "IR", label: "Iran" },
  { code: "IQ", label: "Iraq" },
  { code: "IE", label: "Ireland" },
  { code: "IL", label: "Israel" },
  { code: "IT", label: "Italy" },
  { code: "JM", label: "Jamaica" },
  { code: "JP", label: "Japan" },
  { code: "JO", label: "Jordan" },
  { code: "KZ", label: "Kazakhstan" },
  { code: "KE", label: "Kenya" },
  { code: "KW", label: "Kuwait" },
  { code: "KG", label: "Kyrgyzstan" },
  { code: "LA", label: "Laos" },
  { code: "LV", label: "Latvia" },
  { code: "LB", label: "Lebanon" },
  { code: "LR", label: "Liberia" },
  { code: "LY", label: "Libya" },
  { code: "LT", label: "Lithuania" },
  { code: "LU", label: "Luxembourg" },
  { code: "MG", label: "Madagascar" },
  { code: "MW", label: "Malawi" },
  { code: "MY", label: "Malaysia" },
  { code: "MV", label: "Maldives" },
  { code: "ML", label: "Mali" },
  { code: "MT", label: "Malta" },
  { code: "MX", label: "Mexico" },
  { code: "MD", label: "Moldova" },
  { code: "MC", label: "Monaco" },
  { code: "MN", label: "Mongolia" },
  { code: "MA", label: "Morocco" },
  { code: "MZ", label: "Mozambique" },
  { code: "MM", label: "Myanmar" },
  { code: "NA", label: "Namibia" },
  { code: "NP", label: "Nepal" },
  { code: "NL", label: "Netherlands" },
  { code: "NZ", label: "New Zealand" },
  { code: "NI", label: "Nicaragua" },
  { code: "NE", label: "Niger" },
  { code: "NG", label: "Nigeria" },
  { code: "KP", label: "North Korea" },
  { code: "NO", label: "Norway" },
  { code: "OM", label: "Oman" },
  { code: "PK", label: "Pakistan" },
  { code: "PA", label: "Panama" },
  { code: "PY", label: "Paraguay" },
  { code: "PE", label: "Peru" },
  { code: "PH", label: "Philippines" },
  { code: "PL", label: "Poland" },
  { code: "PT", label: "Portugal" },
  { code: "QA", label: "Qatar" },
  { code: "RO", label: "Romania" },
  { code: "RU", label: "Russia" },
  { code: "RW", label: "Rwanda" },
  { code: "SA", label: "Saudi Arabia" },
  { code: "SN", label: "Senegal" },
  { code: "RS", label: "Serbia" },
  { code: "SG", label: "Singapore" },
  { code: "SK", label: "Slovakia" },
  { code: "SI", label: "Slovenia" },
  { code: "SO", label: "Somalia" },
  { code: "ZA", label: "South Africa" },
  { code: "KR", label: "South Korea" },
  { code: "ES", label: "Spain" },
  { code: "LK", label: "Sri Lanka" },
  { code: "SD", label: "Sudan" },
  { code: "SE", label: "Sweden" },
  { code: "CH", label: "Switzerland" },
  { code: "SY", label: "Syria" },
  { code: "TW", label: "Taiwan" },
  { code: "TJ", label: "Tajikistan" },
  { code: "TZ", label: "Tanzania" },
  { code: "TH", label: "Thailand" },
  { code: "TN", label: "Tunisia" },
  { code: "TR", label: "Turkey" },
  { code: "UG", label: "Uganda" },
  { code: "UA", label: "Ukraine" },
  { code: "AE", label: "United Arab Emirates" },
  { code: "GB", label: "United Kingdom" },
  { code: "US", label: "United States" },
  { code: "UY", label: "Uruguay" },
  { code: "UZ", label: "Uzbekistan" },
  { code: "VE", label: "Venezuela" },
  { code: "VN", label: "Vietnam" },
  { code: "YE", label: "Yemen" },
  { code: "ZM", label: "Zambia" },
  { code: "ZW", label: "Zimbabwe" },
]

const REGION_ALIASES: Record<string, string> = {
  GAMBELA_PEOPLES_REGION: "GAMBELA",
  SOUTH_WEST_ETHIOPIA_PEOPLES_REGION: "SOUTH_WEST_ETHIOPIA_PEOPLES",
  SOUTHERN_NATIONS_NATIONALITIES_AND_PEOPLES_REGION: "SOUTH_ETHIOPIA",
}

function normalizeProfileFieldKey(value: string): string {
  return value
    .trim()
    .toUpperCase()
    .replace(/['’]/g, "")
    .replace(/[\s-]+/g, "_")
    .replace(/_+/g, "_")
}

function isCatchAllProfileValue(normalized: string): boolean {
  return (
    !normalized ||
    normalized === "OTHER" ||
    normalized === "UNKNOWN" ||
    normalized === "UNASSIGNED" ||
    normalized === "N_A" ||
    normalized === "NA"
  )
}

function labelForCode(options: ProfileFieldOption[], code: string): string {
  return options.find((o) => o.code === code)?.label ?? code
}

function resolveProfileFieldCode(
  raw: string | null | undefined,
  options: ProfileFieldOption[],
  defaultCode: string,
  aliases?: Record<string, string>,
): string {
  const trimmed = raw?.trim() ?? ""
  const normalized = normalizeProfileFieldKey(trimmed)
  if (isCatchAllProfileValue(normalized)) return defaultCode

  if (aliases?.[normalized]) return aliases[normalized]

  for (const opt of options) {
    if (opt.code === "OTHER") continue
    if (normalized === opt.code) return opt.code
    if (normalized === normalizeProfileFieldKey(opt.label)) return opt.code
  }

  const lower = trimmed.toLowerCase()
  for (const opt of options) {
    if (opt.code === "OTHER") continue
    if (lower === opt.label.toLowerCase()) return opt.code
  }

  return defaultCode
}

function displayProfileFieldLabel(
  raw: string | null | undefined,
  options: ProfileFieldOption[],
  defaultCode: string,
  aliases?: Record<string, string>,
): string {
  const code = resolveProfileFieldCode(raw, options, defaultCode, aliases)
  return labelForCode(options, code)
}

export function displayUserAgeGroup(raw: string | null | undefined): string {
  return displayProfileFieldLabel(raw, AGE_GROUP_OPTIONS, DEFAULT_USER_AGE_GROUP_CODE)
}

export function displayUserOccupation(raw: string | null | undefined): string {
  return displayProfileFieldLabel(raw, OCCUPATION_OPTIONS, DEFAULT_USER_OCCUPATION_CODE)
}

export function displayUserRegion(raw: string | null | undefined): string {
  return displayProfileFieldLabel(
    raw,
    ETHIOPIA_REGION_OPTIONS,
    DEFAULT_USER_REGION_CODE,
    REGION_ALIASES,
  )
}

export function displayUserEducationLevel(raw: string | null | undefined): string {
  return displayProfileFieldLabel(raw, EDUCATION_LEVEL_OPTIONS, DEFAULT_USER_EDUCATION_LEVEL_CODE)
}

export function displayUserLearningGoal(raw: string | null | undefined): string {
  return displayProfileFieldLabel(raw, LEARNING_GOAL_OPTIONS, DEFAULT_USER_LEARNING_GOAL_CODE)
}

export function displayUserLanguageChallenge(raw: string | null | undefined): string {
  return displayProfileFieldLabel(
    raw,
    LANGUAGE_CHALLENGE_OPTIONS,
    DEFAULT_USER_LANGUAGE_CHALLENGE_CODE,
  )
}

export function displayUserLanguageGoal(raw: string | null | undefined): string {
  return displayProfileFieldLabel(raw, LANGUAGE_GOAL_OPTIONS, DEFAULT_USER_LANGUAGE_GOAL_CODE)
}

export function displayUserFavouriteTopic(raw: string | null | undefined): string {
  return displayProfileFieldLabel(raw, FAVOURITE_TOPIC_OPTIONS, DEFAULT_USER_FAVOURITE_TOPIC_CODE)
}

export function displayUserCountry(raw: string | null | undefined): string {
  return displayProfileFieldLabel(raw, COUNTRY_OPTIONS, DEFAULT_USER_COUNTRY_CODE)
}

export function displayUserKnowledgeLevel(raw: string | null | undefined): string {
  return displayProfileFieldLabel(raw, KNOWLEDGE_LEVEL_OPTIONS, DEFAULT_USER_KNOWLEDGE_LEVEL_CODE)
}

/** Merge analytics rows that share the same display label (fixes OTHER→default duplicates). */
export function mergeAnalyticsRowsByDisplayLabel(
  rows: Array<{ label: string; count: number }>,
  formatLabel: (raw: string) => string,
): Array<{ label: string; count: number }> {
  const sums = new Map<string, number>()
  for (const row of rows) {
    const label = formatLabel(row.label)
    sums.set(label, (sums.get(label) ?? 0) + (row.count || 0))
  }
  return Array.from(sums.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
}

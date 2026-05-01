/**
 * Maps Discord locales to ISO 3166-1 alpha-3 country codes.
 * This is used by the API to normalize geographic data for the world map.
 */
const localeToCountryMap: Record<string, string> = {
  // English
  "en-US": "USA",
  "en-GB": "GBR",
  "en": "USA",
  
  // Chinese
  "zh-CN": "CHN",
  "zh-TW": "TWN",
  "zh": "CHN",
  
  // European
  "fr-FR": "FRA",
  "fr": "FRA",
  "de-DE": "DEU",
  "de": "DEU",
  "it-IT": "ITA",
  "it": "ITA",
  "es-ES": "ESP",
  "es": "ESP",
  "pt-BR": "BRA",
  "pt-PT": "PRT",
  "pt": "PRT",
  "ru-RU": "RUS",
  "ru": "RUS",
  "tr-TR": "TUR",
  "tr": "TUR",
  "uk-UA": "UKR",
  "uk": "UKR",
  "pl-PL": "POL",
  "pl": "POL",
  "nl-NL": "NLD",
  "nl": "NLD",
  "sv-SE": "SWE",
  "sv": "SWE",
  "no-NO": "NOR",
  "no": "NOR",
  "da-DK": "DNK",
  "da": "DNK",
  "fi-FI": "FIN",
  "fi": "FIN",
  "el-GR": "GRC",
  "el": "GRC",
  "ro-RO": "ROU",
  "ro": "ROU",
  "hu-HU": "HUN",
  "hu": "HUN",
  "cs-CZ": "CZE",
  "cs": "CZE",
  "bg-BG": "BGR",
  "bg": "BGR",
  "hr-HR": "HRV",
  "hr": "HRV",
  "lt-LT": "LTU",
  "lt": "LTU",
  
  // Asian
  "ja-JP": "JPN",
  "ja": "JPN",
  "ko-KR": "KOR",
  "ko": "KOR",
  "hi-IN": "IND",
  "hi": "IND",
  "vi-VN": "VNM",
  "vi": "VNM",
  "th-TH": "THA",
  "th": "THA",
  "id-ID": "IDN",
  "id": "IDN",
  
  // Others
  "ar-SA": "SAU",
  "ar": "SAU",
  "he-IL": "ISR",
  "he": "ISR",
};

/**
 * Resolves a country code from a Discord locale string.
 * @param locale The locale string (e.g. "en-US", "fr")
 * @returns ISO 3166-1 alpha-3 country code or null
 */
export const resolveCountryCode = (locale?: string | null): string | null => {
  if (!locale) return null;
  
  // Exact match
  if (localeToCountryMap[locale]) {
    return localeToCountryMap[locale];
  }
  
  // Prefix match (e.g. "en-US" -> "en")
  const prefix = locale.split('-')[0].toLowerCase();
  if (localeToCountryMap[prefix]) {
    return localeToCountryMap[prefix];
  }
  
  // Fallback for common prefixes if not in map
  const commonFallbacks: Record<string, string> = {
    'en': 'USA', // Default English to USA for map purposes if unspecified
    'fr': 'FRA',
    'de': 'DEU',
    'hi': 'IND',
    'zh': 'CHN',
    'ja': 'JPN',
    'ko': 'KOR',
    'ru': 'RUS',
    'pt': 'BRA',
    'it': 'ITA',
    'es': 'ESP',
  };
  
  return commonFallbacks[prefix] || null;
};

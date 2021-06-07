const langs = [
  {
    ISO: "afr",
    LANGUAGE: "Afrikaans",
  },
  {
    ISO: "amh",
    LANGUAGE: "Amharic",
  },
  {
    ISO: "ara",
    LANGUAGE: "Arabic",
  },
  {
    ISO: "hye",
    LANGUAGE: "Armenian",
  },
  {
    ISO: "asm",
    LANGUAGE: "Assamese",
  },
  {
    ISO: "ast",
    LANGUAGE: "Asturian",
  },
  {
    ISO: "azj",
    LANGUAGE: "Azerbaijani",
  },
  {
    ISO: "bel",
    LANGUAGE: "Belarusian",
  },
  {
    ISO: "ben",
    LANGUAGE: "Bengali",
  },
  {
    ISO: "bos",
    LANGUAGE: "Bosnian",
  },
  {
    ISO: "bul",
    LANGUAGE: "Bulgarian",
  },
  {
    ISO: "mya",
    LANGUAGE: "Burmese",
  },
  {
    ISO: "cat",
    LANGUAGE: "Catalan",
  },
  {
    ISO: "ceb",
    LANGUAGE: "Cebuano",
  },
  {
    ISO: "zho",
    LANGUAGE: "Chinese (Simplified)",
  },
  {
    ISO: "zho_simp",
    LANGUAGE: "Chinese (Simplified)",
  },
  {
    ISO: "zho_trad",
    LANGUAGE: "Chinese (Traditional)",
  },
  {
    ISO: "hrv",
    LANGUAGE: "Croatian",
  },
  {
    ISO: "ces",
    LANGUAGE: "Czech",
  },
  {
    ISO: "dan",
    LANGUAGE: "Danish",
  },
  {
    ISO: "nld",
    LANGUAGE: "Dutch",
  },
  {
    ISO: "eng",
    LANGUAGE: "English",
  },
  {
    ISO: "est",
    LANGUAGE: "Estonian",
  },
  {
    ISO: "tgl",
    LANGUAGE: "Filipino (Tagalog)",
  },
  {
    ISO: "fin",
    LANGUAGE: "Finnish",
  },
  {
    ISO: "fra",
    LANGUAGE: "French",
  },
  {
    ISO: "ful",
    LANGUAGE: "Fula",
  },
  {
    ISO: "glg",
    LANGUAGE: "Galician",
  },
  {
    ISO: "lug",
    LANGUAGE: "Ganda",
  },
  {
    ISO: "kat",
    LANGUAGE: "Georgian",
  },
  {
    ISO: "deu",
    LANGUAGE: "German",
  },
  {
    ISO: "ell",
    LANGUAGE: "Greek",
  },
  {
    ISO: "guj",
    LANGUAGE: "Gujarati",
  },
  {
    ISO: "hau",
    LANGUAGE: "Hausa",
  },
  {
    ISO: "heb",
    LANGUAGE: "Hebrew",
  },
  {
    ISO: "hin",
    LANGUAGE: "Hindi",
  },
  {
    ISO: "hun",
    LANGUAGE: "Hungarian",
  },
  {
    ISO: "isl",
    LANGUAGE: "Icelandic",
  },
  {
    ISO: "ibo",
    LANGUAGE: "Igbo",
  },
  {
    ISO: "ind",
    LANGUAGE: "Indonesian",
  },
  {
    ISO: "gle",
    LANGUAGE: "Irish",
  },
  {
    ISO: "ita",
    LANGUAGE: "Italian",
  },
  {
    ISO: "jpn",
    LANGUAGE: "Japanese",
  },
  {
    ISO: "jav",
    LANGUAGE: "Javanese",
  },
  {
    ISO: "kea",
    LANGUAGE: "Kabuverdianu",
  },
  {
    ISO: "kam",
    LANGUAGE: "Kamba",
  },
  {
    ISO: "kan",
    LANGUAGE: "Kannada",
  },
  {
    ISO: "kaz",
    LANGUAGE: "Kazakh",
  },
  {
    ISO: "khm",
    LANGUAGE: "Khmer",
  },
  {
    ISO: "kor",
    LANGUAGE: "Korean",
  },
  {
    ISO: "kir",
    LANGUAGE: "Kyrgyz",
  },
  {
    ISO: "lao",
    LANGUAGE: "Lao",
  },
  {
    ISO: "lav",
    LANGUAGE: "Latvian",
  },
  {
    ISO: "lin",
    LANGUAGE: "Lingala",
  },
  {
    ISO: "lit",
    LANGUAGE: "Lithuanian",
  },
  {
    ISO: "luo",
    LANGUAGE: "Luo",
  },
  {
    ISO: "ltz",
    LANGUAGE: "Luxembourgish",
  },
  {
    ISO: "mkd",
    LANGUAGE: "Macedonian",
  },
  {
    ISO: "msa",
    LANGUAGE: "Malay",
  },
  {
    ISO: "mal",
    LANGUAGE: "Malayalam",
  },
  {
    ISO: "mlt",
    LANGUAGE: "Maltese",
  },
  {
    ISO: "mri",
    LANGUAGE: "Māori",
  },
  {
    ISO: "mar",
    LANGUAGE: "Marathi",
  },
  {
    ISO: "mon",
    LANGUAGE: "Mongolian",
  },
  {
    ISO: "npi",
    LANGUAGE: "Nepali",
  },
  {
    ISO: "nso",
    LANGUAGE: "Northern Sotho",
  },
  {
    ISO: "nob",
    LANGUAGE: "Norwegian",
  },
  {
    ISO: "nya",
    LANGUAGE: "Nyanja",
  },
  {
    ISO: "oci",
    LANGUAGE: "Occitan",
  },
  {
    ISO: "ory",
    LANGUAGE: "Oriya",
  },
  {
    ISO: "orm",
    LANGUAGE: "Oromo",
  },
  {
    ISO: "pus",
    LANGUAGE: "Pashto",
  },
  {
    ISO: "fas",
    LANGUAGE: "Persian",
  },
  {
    ISO: "pol",
    LANGUAGE: "Polish",
  },
  {
    ISO: "por",
    LANGUAGE: "Portuguese (Brazil)",
  },
  {
    ISO: "pan",
    LANGUAGE: "Punjabi",
  },
  {
    ISO: "ron",
    LANGUAGE: "Romanian",
  },
  {
    ISO: "rus",
    LANGUAGE: "Russian",
  },
  {
    ISO: "srp",
    LANGUAGE: "Serbian",
  },
  {
    ISO: "sna",
    LANGUAGE: "Shona",
  },
  {
    ISO: "snd",
    LANGUAGE: "Sindhi",
  },
  {
    ISO: "slk",
    LANGUAGE: "Slovak",
  },
  {
    ISO: "slv",
    LANGUAGE: "Slovenian",
  },
  {
    ISO: "som",
    LANGUAGE: "Somali",
  },
  {
    ISO: "ckb",
    LANGUAGE: "Sorani Kurdish",
  },
  {
    ISO: "spa",
    LANGUAGE: "Spanish (Latin America)",
  },
  {
    ISO: "swh",
    LANGUAGE: "Swahili",
  },
  {
    ISO: "swe",
    LANGUAGE: "Swedish",
  },
  {
    ISO: "tgk",
    LANGUAGE: "Tajik",
  },
  {
    ISO: "tam",
    LANGUAGE: "Tamil",
  },
  {
    ISO: "tel",
    LANGUAGE: "Telugu",
  },
  {
    ISO: "tha",
    LANGUAGE: "Thai",
  },
  {
    ISO: "tur",
    LANGUAGE: "Turkish",
  },
  {
    ISO: "ukr",
    LANGUAGE: "Ukrainian",
  },
  {
    ISO: "umb",
    LANGUAGE: "Umbundu",
  },
  {
    ISO: "urd",
    LANGUAGE: "Urdu",
  },
  {
    ISO: "uzb",
    LANGUAGE: "Uzbek",
  },
  {
    ISO: "vie",
    LANGUAGE: "Vietnamese",
  },
  {
    ISO: "cym",
    LANGUAGE: "Welsh",
  },
  {
    ISO: "wol",
    LANGUAGE: "Wolof",
  },
  {
    ISO: "xho",
    LANGUAGE: "Xhosa",
  },
  {
    ISO: "yor",
    LANGUAGE: "Yoruba",
  },
  {
    ISO: "zul",
    LANGUAGE: "Zulu",
  },
];

export default langs;

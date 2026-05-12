let learnWords = [];
let learnIndex = 0;
let testWords = [];
let testIndex = 0;
let testCorrect = 0;
let missedWords = [];
let answered = false;
let currentTestSaved = false;
let knownWords = JSON.parse(localStorage.getItem("knownWords")) || [];
let currentTranslateSentence = null;
let translationProgress =
  JSON.parse(localStorage.getItem("translationProgress")) || {};
let xpToastTimeout = null;
let translationGradedThisSentence = false;
let currentLearnLesson = null;
let completedLessons =
  JSON.parse(localStorage.getItem("completedLessons")) || {};

let openedLessonBlocks =
  JSON.parse(localStorage.getItem("openedLessonBlocks")) || {};

document.addEventListener("DOMContentLoaded", () => {
  const hint = document.getElementById("alphabetViewHint");

  if (hint && localStorage.getItem("hasOpenedAlphabetReference") === "true") {
    hint.classList.add("hidden");
  }
});
document.addEventListener("DOMContentLoaded", () => {
  updatePracticeToolLocks();
  updateProfileAttention();
});


const REQUIRED_LESSONS = [
  "history",
  "alphabet",
  "pronunciation",
  "nouns",
  "cases",
  "howToRead"
];

const VOCAB_UNLOCK_LESSONS = [
  "history",
  "alphabet",
  "pronunciation"
];

let practiceToolsUnlocked =
  localStorage.getItem("practiceToolsUnlocked") === "true";

document.addEventListener("DOMContentLoaded", () => {
  const hint = document.getElementById("soundViewHint");

  if (hint && localStorage.getItem("hasOpenedSoundReference") === "true") {
    hint.classList.add("hidden");
  }
});
const PRACTICE_SENTENCES = [
 {
  id: "ch4-001",
  chapter: 4,
  greek: "θεὸς καὶ λόγος.",
  translation: "God and word.",
  wordBreakdown: [
    { greek: "θεός", meaning: "God", note: "Chapter 4 vocabulary." },
    { greek: "καί", meaning: "and", note: "Connects two words or ideas." },
    { greek: "λόγος", meaning: "word", note: "Chapter 4 vocabulary." }
  ],
  structure: "Noun + καί + Noun",
  explanation: "καί joins the two nouns together. This is a phrase, not a full sentence, because there is no verb."
},

{
  id: "ch4-002",
  chapter: 4,
  greek: "ἄνθρωπος καὶ θεός.",
  translation: "Man and God.",
  wordBreakdown: [
    { greek: "ἄνθρωπος", meaning: "man/person", note: "Chapter 4 vocabulary." },
    { greek: "καί", meaning: "and", note: "Connector." },
    { greek: "θεός", meaning: "God", note: "Chapter 4 vocabulary." }
  ],
  structure: "Noun + καί + Noun",
  explanation: "This helps practice recognizing two nouns joined by καί before full sentences are introduced."
},

{
  id: "ch4-003",
  chapter: 4,
  greek: "λόγος καὶ φωνή.",
  translation: "Word and voice.",
  wordBreakdown: [
    { greek: "λόγος", meaning: "word/message", note: "Chapter 4 vocabulary." },
    { greek: "καί", meaning: "and", note: "Connects the nouns." },
    { greek: "φωνή", meaning: "voice/sound", note: "Chapter 4 vocabulary." }
  ],
  structure: "Noun + καί + Noun",
  explanation: "λόγος and φωνή are related ideas, but they are different words. καί simply joins them without explaining the relationship."
},

{
  id: "ch4-004",
  chapter: 4,
  greek: "ζωὴ καὶ πνεῦμα.",
  translation: "Life and spirit.",
  wordBreakdown: [
    { greek: "ζωή", meaning: "life", note: "Chapter 4 vocabulary." },
    { greek: "καί", meaning: "and", note: "Connector." },
    { greek: "πνεῦμα", meaning: "spirit/wind/breath", note: "Chapter 4 vocabulary." }
  ],
  structure: "Noun + καί + Noun",
  explanation: "This phrase trains you to recognize vocabulary without needing a full sentence yet."
},

{
  id: "ch4-005",
  chapter: 4,
  greek: "καρδία καὶ ζωή.",
  translation: "Heart and life.",
  wordBreakdown: [
    { greek: "καρδία", meaning: "heart", note: "Chapter 4 vocabulary." },
    { greek: "καί", meaning: "and", note: "Connector." },
    { greek: "ζωή", meaning: "life", note: "Chapter 4 vocabulary." }
  ],
  structure: "Noun + καί + Noun",
  explanation: "Since there is no verb, the goal is simply to recognize the words and how καί connects them."
},

{
  id: "ch4-006",
  chapter: 4,
  greek: "προφήτης καὶ ἀπόστολος.",
  translation: "Prophet and apostle.",
  wordBreakdown: [
    { greek: "προφήτης", meaning: "prophet", note: "Chapter 4 vocabulary." },
    { greek: "καί", meaning: "and", note: "Connector." },
    { greek: "ἀπόστολος", meaning: "apostle/messenger", note: "Chapter 4 vocabulary." }
  ],
  structure: "Noun + καί + Noun",
  explanation: "Both nouns describe people or roles. καί joins them as two separate nouns."
},

{
  id: "ch4-007",
  chapter: 4,
  greek: "Πέτρος καὶ Παῦλος.",
  translation: "Peter and Paul.",
  wordBreakdown: [
    { greek: "Πέτρος", meaning: "Peter", note: "Chapter 4 vocabulary." },
    { greek: "καί", meaning: "and", note: "Connector." },
    { greek: "Παῦλος", meaning: "Paul", note: "Chapter 4 vocabulary." }
  ],
  structure: "Name + καί + Name",
  explanation: "Proper names work like nouns. Here καί joins two people together."
},

{
  id: "ch4-008",
  chapter: 4,
  greek: "Ἀβραὰμ καὶ Δαυίδ.",
  translation: "Abraham and David.",
  wordBreakdown: [
    { greek: "Ἀβραάμ", meaning: "Abraham", note: "Chapter 4 vocabulary." },
    { greek: "καί", meaning: "and", note: "Connector." },
    { greek: "Δαυίδ", meaning: "David", note: "Chapter 4 vocabulary." }
  ],
  structure: "Name + καί + Name",
  explanation: "This reinforces that names may not always change form, but they still function as nouns in Greek."
},

{
  id: "ch4-009",
  chapter: 4,
  greek: "Χριστὸς καὶ θεός.",
  translation: "Christ and God.",
  wordBreakdown: [
    { greek: "Χριστός", meaning: "Christ/Messiah", note: "Chapter 4 vocabulary." },
    { greek: "καί", meaning: "and", note: "Connector." },
    { greek: "θεός", meaning: "God", note: "Chapter 4 vocabulary." }
  ],
  structure: "Noun + καί + Noun",
  explanation: "καί connects Χριστός and θεός as two nouns. The phrase itself does not state an action."
},

{
  id: "ch4-010",
  chapter: 4,
  greek: "γραφή καὶ δόξα.",
  translation: "Scripture and glory.",
  wordBreakdown: [
    { greek: "γραφή", meaning: "writing/Scripture", note: "Chapter 4 vocabulary." },
    { greek: "καί", meaning: "and", note: "Connector." },
    { greek: "δόξα", meaning: "glory", note: "Chapter 4 vocabulary." }
  ],
  structure: "Noun + καί + Noun",
  explanation: "This is still a phrase, so the translation stays simple. The main skill is recognizing vocabulary and καί."
},

{
  id: "ch4-011",
  chapter: 4,
  greek: "κύριος καὶ κύριος.",
  translation: "Lord and Lord.",
  wordBreakdown: [
    { greek: "κύριος", meaning: "Lord", note: "Repeated vocabulary." },
    { greek: "καί", meaning: "and", note: "Connector." },
    { greek: "κύριος", meaning: "Lord", note: "Repeated vocabulary." }
  ],
  structure: "Repeated noun + καί + noun",
  explanation: "Focuses on recognizing κύριος quickly."
},{
  id: "ch4-012",
  chapter: 4,
  greek: "θεὸς καὶ κόσμος καὶ λόγος.",
  translation: "God and world and word.",
  wordBreakdown: [
    { greek: "θεός", meaning: "God", note: "Chapter 4 vocabulary." },
    { greek: "καί", meaning: "and", note: "Connector." },
    { greek: "κόσμος", meaning: "world", note: "Chapter 4 vocabulary." },
    { greek: "καί", meaning: "and", note: "Connector." },
    { greek: "λόγος", meaning: "word", note: "Chapter 4 vocabulary." }
  ],
  structure: "Noun + καί + Noun + καί + Noun",
  explanation: "Three nouns joined together with καί."
},

{
  id: "ch4-013",
  chapter: 4,
  greek: "λόγος καὶ κόσμος καὶ κύριος.",
  translation: "Word and world and Lord.",
  wordBreakdown: [
    { greek: "λόγος", meaning: "word", note: "Vocabulary word." },
    { greek: "καί", meaning: "and", note: "Connector." },
    { greek: "κόσμος", meaning: "world", note: "Vocabulary word." },
    { greek: "καί", meaning: "and", note: "Connector." },
    { greek: "κύριος", meaning: "Lord", note: "Vocabulary word." }
  ],
  structure: "Chain of nouns with καί",
  explanation: "Practices recognizing multiple vocabulary words together."
},

{
  id: "ch4-014",
  chapter: 4,
  greek: "κόσμος καὶ θεὸς καὶ κύριος.",
  translation: "World and God and Lord.",
  wordBreakdown: [
    { greek: "κόσμος", meaning: "world", note: "Vocabulary word." },
    { greek: "καί", meaning: "and", note: "Connector." },
    { greek: "θεός", meaning: "God", note: "Vocabulary word." },
    { greek: "καί", meaning: "and", note: "Connector." },
    { greek: "κύριος", meaning: "Lord", note: "Vocabulary word." }
  ],
  structure: "Chain of nouns with καί",
  explanation: "Reinforces recognition in different word order."
},

{
  id: "ch4-015",
  chapter: 4,
  greek: "κύριος καὶ λόγος καὶ κόσμος.",
  translation: "Lord and word and world.",
  wordBreakdown: [
    { greek: "κύριος", meaning: "Lord", note: "Vocabulary word." },
    { greek: "καί", meaning: "and", note: "Connector." },
    { greek: "λόγος", meaning: "word", note: "Vocabulary word." },
    { greek: "καί", meaning: "and", note: "Connector." },
    { greek: "κόσμος", meaning: "world", note: "Vocabulary word." }
  ],
  structure: "Chain of nouns with καί",
  explanation: "Same words, different order—important for recognition."
},

{
  id: "ch4-016",
  chapter: 4,
  greek: "θεὸς καὶ λόγος καὶ λόγος.",
  translation: "God and word and word.",
  wordBreakdown: [
    { greek: "θεός", meaning: "God", note: "Vocabulary word." },
    { greek: "καί", meaning: "and", note: "Connector." },
    { greek: "λόγος", meaning: "word", note: "Vocabulary word." },
    { greek: "καί", meaning: "and", note: "Connector." },
    { greek: "λόγος", meaning: "word", note: "Repeated vocabulary." }
  ],
  structure: "Mixed + repeated nouns",
  explanation: "Repetition strengthens recognition speed."
},

{
  id: "ch4-017",
  chapter: 4,
  greek: "κόσμος καὶ κόσμος καὶ λόγος.",
  translation: "World and world and word.",
  wordBreakdown: [
    { greek: "κόσμος", meaning: "world", note: "Repeated vocabulary." },
    { greek: "καί", meaning: "and", note: "Connector." },
    { greek: "κόσμος", meaning: "world", note: "Repeated vocabulary." },
    { greek: "καί", meaning: "and", note: "Connector." },
    { greek: "λόγος", meaning: "word", note: "Vocabulary word." }
  ],
  structure: "Repeated nouns with variation",
  explanation: "Helps reinforce κόσμος quickly."
},

{
  id: "ch4-018",
  chapter: 4,
  greek: "κύριος καὶ κύριος καὶ θεός.",
  translation: "Lord and Lord and God.",
  wordBreakdown: [
    { greek: "κύριος", meaning: "Lord", note: "Repeated vocabulary." },
    { greek: "καί", meaning: "and", note: "Connector." },
    { greek: "κύριος", meaning: "Lord", note: "Repeated vocabulary." },
    { greek: "καί", meaning: "and", note: "Connector." },
    { greek: "θεός", meaning: "God", note: "Vocabulary word." }
  ],
  structure: "Repeated + new noun",
  explanation: "Combines repetition with variation."
},

{
  id: "ch4-019",
  chapter: 4,
  greek: "λόγος καὶ λόγος καὶ κόσμος.",
  translation: "Word and word and world.",
  wordBreakdown: [
    { greek: "λόγος", meaning: "word", note: "Repeated vocabulary." },
    { greek: "καί", meaning: "and", note: "Connector." },
    { greek: "λόγος", meaning: "word", note: "Repeated vocabulary." },
    { greek: "καί", meaning: "and", note: "Connector." },
    { greek: "κόσμος", meaning: "world", note: "Vocabulary word." }
  ],
  structure: "Repeated noun pattern",
  explanation: "Builds recognition speed through repetition."
},

{
  id: "ch4-020",
  chapter: 4,
  greek: "θεὸς καὶ κόσμος καὶ κόσμος.",
  translation: "God and world and world.",
  wordBreakdown: [
    { greek: "θεός", meaning: "God", note: "Vocabulary word." },
    { greek: "καί", meaning: "and", note: "Connector." },
    { greek: "κόσμος", meaning: "world", note: "Repeated vocabulary." },
    { greek: "καί", meaning: "and", note: "Connector." },
    { greek: "κόσμος", meaning: "world", note: "Repeated vocabulary." }
  ],
  structure: "Mixed repetition",
  explanation: "Repetition reinforces quick identification of κόσμος."
},

{
  id: "ch4-021",
  chapter: 4,
  greek: "κύριος καὶ λόγος καὶ λόγος.",
  translation: "Lord and word and word.",
  wordBreakdown: [
    { greek: "κύριος", meaning: "Lord", note: "Vocabulary word." },
    { greek: "καί", meaning: "and", note: "Connector." },
    { greek: "λόγος", meaning: "word", note: "Repeated vocabulary." },
    { greek: "καί", meaning: "and", note: "Connector." },
    { greek: "λόγος", meaning: "word", note: "Repeated vocabulary." }
  ],
  structure: "Repeated noun pattern",
  explanation: "Final repetition set for strong memorization."
},

{
  id: "ch6-001",
  chapter: 6,
  greek: "ἡ ἀγάπη ἐστιν ἐν τῇ καρδίᾳ.",
  translation: "Love is in the heart.",
  wordBreakdown: [
    { greek: "ἡ ἀγάπη", meaning: "love", note: "Chapter 6 noun with the article." },
    { greek: "ἐστιν", meaning: "is", note: "Helper verb added to make a full sentence." },
    { greek: "ἐν", meaning: "in", note: "Chapter 6 preposition." },
    { greek: "τῇ καρδίᾳ", meaning: "the heart", note: "Location phrase using earlier vocab." }
  ],
  structure: "Subject → Verb → Prepositional Phrase",
  explanation: "ἐν shows location. The sentence says where love is: in the heart."
},

{
  id: "ch6-002",
  chapter: 6,
  greek: "ὁ θεὸς ἐστιν ἐν τῇ βασιλείᾳ.",
  translation: "God is in the kingdom.",
  wordBreakdown: [
    { greek: "ὁ θεός", meaning: "God", note: "Subject using earlier vocabulary." },
    { greek: "ἐστιν", meaning: "is", note: "Helper verb." },
    { greek: "ἐν", meaning: "in", note: "Chapter 6 preposition." },
    { greek: "τῇ βασιλείᾳ", meaning: "the kingdom", note: "Chapter 6 vocabulary." }
  ],
  structure: "Subject → Verb → Prepositional Phrase",
  explanation: "ἐν introduces the location, and βασιλεία gives the place: the kingdom."
},

{
  id: "ch6-003",
  chapter: 6,
  greek: "νῦν ὁ καιρός ἐστιν.",
  translation: "Now is the appointed time.",
  wordBreakdown: [
    { greek: "νῦν", meaning: "now", note: "Chapter 6 time word." },
    { greek: "ὁ καιρός", meaning: "the appointed time", note: "Chapter 6 vocabulary." },
    { greek: "ἐστιν", meaning: "is", note: "Helper verb." }
  ],
  structure: "Adverb → Subject → Verb",
  explanation: "νῦν points to the present moment, while καιρός refers to a time or season."
},

{
  id: "ch6-004",
  chapter: 6,
  greek: "τὸ ἔργον ἐστιν ἐν τῷ κόσμῳ.",
  translation: "The work is in the world.",
  wordBreakdown: [
    { greek: "τὸ ἔργον", meaning: "the work", note: "Chapter 6 noun with article." },
    { greek: "ἐστιν", meaning: "is", note: "Helper verb." },
    { greek: "ἐν", meaning: "in", note: "Chapter 6 preposition." },
    { greek: "τῷ κόσμῳ", meaning: "the world", note: "Earlier vocab used in a location phrase." }
  ],
  structure: "Subject → Verb → Prepositional Phrase",
  explanation: "The prepositional phrase ἐν τῷ κόσμῳ tells where the work is."
},

{
  id: "ch6-005",
  chapter: 6,
  greek: "ὁ λόγος οὐκ ἐστιν ἄλλος.",
  translation: "The word is not another.",
  wordBreakdown: [
    { greek: "ὁ λόγος", meaning: "the word", note: "Subject using earlier vocabulary." },
    { greek: "οὐκ", meaning: "not", note: "Form of οὐ before a vowel." },
    { greek: "ἐστιν", meaning: "is", note: "Helper verb." },
    { greek: "ἄλλος", meaning: "another/other", note: "Chapter 6 vocabulary." }
  ],
  structure: "Subject → Negative → Verb → Predicate",
  explanation: "οὐ negates the verb idea. οὐκ is the form used before a vowel sound."
},

{
  id: "ch6-006",
  chapter: 6,
  greek: "αὐτός ἐστιν ὁ λόγος.",
  translation: "He is the word.",
  wordBreakdown: [
    { greek: "αὐτός", meaning: "he", note: "Chapter 6 pronoun." },
    { greek: "ἐστιν", meaning: "is", note: "Helper verb." },
    { greek: "ὁ λόγος", meaning: "the word", note: "Predicate noun using earlier vocab." }
  ],
  structure: "Pronoun → Verb → Predicate Noun",
  explanation: "αὐτός can stand in place of a noun. Here it functions as the subject: he."
},

{
  id: "ch6-007",
  chapter: 6,
  greek: "ἡ ἀγάπη καὶ τὸ ἔργον ἐστιν ἐν τῇ βασιλείᾳ.",
  translation: "Love and the work are in the kingdom.",
  wordBreakdown: [
    { greek: "ἡ ἀγάπη", meaning: "love", note: "Chapter 6 vocabulary." },
    { greek: "καί", meaning: "and", note: "Connector from earlier vocab." },
    { greek: "τὸ ἔργον", meaning: "the work", note: "Chapter 6 vocabulary." },
    { greek: "ἐστιν", meaning: "is/are", note: "Helper verb." },
    { greek: "ἐν τῇ βασιλείᾳ", meaning: "in the kingdom", note: "Location phrase with Chapter 6 vocab." }
  ],
  structure: "Subject + καί + Subject → Verb → Prepositional Phrase",
  explanation: "καί joins two subjects, and ἐν τῇ βασιλείᾳ tells where they are."
},

{
  id: "ch6-008",
  chapter: 6,
  greek: "ὅτι ὁ θεός ἐστιν ἐν τῇ βασιλείᾳ.",
  translation: "Because God is in the kingdom.",
  wordBreakdown: [
    { greek: "ὅτι", meaning: "because/that", note: "Chapter 6 conjunction." },
    { greek: "ὁ θεός", meaning: "God", note: "Subject." },
    { greek: "ἐστιν", meaning: "is", note: "Helper verb." },
    { greek: "ἐν τῇ βασιλείᾳ", meaning: "in the kingdom", note: "Prepositional phrase." }
  ],
  structure: "ὅτι → Clause",
  explanation: "ὅτι can introduce a reason or a statement. Here it naturally reads as “because.”"
},

{
  id: "ch6-009",
  chapter: 6,
  greek: "ἡ ὥρα νῦν ἐστιν.",
  translation: "The hour is now.",
  wordBreakdown: [
    { greek: "ἡ ὥρα", meaning: "the hour", note: "Chapter 6 vocabulary." },
    { greek: "νῦν", meaning: "now", note: "Chapter 6 time word." },
    { greek: "ἐστιν", meaning: "is", note: "Helper verb." }
  ],
  structure: "Subject → Time Word → Verb",
  explanation: "νῦν gives the time idea. The sentence connects ὥρα with the present moment."
},

{
  id: "ch6-010",
  chapter: 6,
  greek: "ὁ θεὸς δέ ἐστιν ἀγάπη.",
  translation: "But God is love.",
  wordBreakdown: [
    { greek: "ὁ θεός", meaning: "God", note: "Subject." },
    { greek: "δέ", meaning: "but/and", note: "Chapter 6 connector." },
    { greek: "ἐστιν", meaning: "is", note: "Helper verb." },
    { greek: "ἀγάπη", meaning: "love", note: "Chapter 6 vocabulary." }
  ],
  structure: "Subject → δέ → Verb → Predicate Noun",
  explanation: "δέ connects this statement to a previous thought, often with a mild contrast like “but.”"
},

{
  id: "ch6-011",
  chapter: 6,
  greek: "ἡ ἀγάπη οὐκ ἐστιν ἄλλος λόγος.",
  translation: "Love is not another word.",
  wordBreakdown: [
    { greek: "ἡ ἀγάπη", meaning: "love", note: "Chapter 6 vocabulary." },
    { greek: "οὐκ", meaning: "not", note: "Negates the verb." },
    { greek: "ἐστιν", meaning: "is", note: "Helper verb." },
    { greek: "ἄλλος λόγος", meaning: "another word", note: "Chapter 6 word ἄλλος describing λόγος." }
  ],
  structure: "Subject → Negative → Verb → Predicate",
  explanation: "ἄλλος means “another of the same kind.” Here it describes λόγος."
},

{
  id: "ch6-012",
  chapter: 6,
  greek: "νῦν ὁ θεὸς ἐστιν ἐν τῷ κόσμῳ.",
  translation: "Now God is in the world.",
  wordBreakdown: [
    { greek: "νῦν", meaning: "now", note: "Chapter 6 time word." },
    { greek: "ὁ θεός", meaning: "God", note: "Subject." },
    { greek: "ἐστιν", meaning: "is", note: "Helper verb." },
    { greek: "ἐν τῷ κόσμῳ", meaning: "in the world", note: "Location phrase." }
  ],
  structure: "Time → Subject → Verb → Prepositional Phrase",
  explanation: "νῦν places the action in the present moment."
},

{
  id: "ch6-013",
  chapter: 6,
  greek: "τὸ ἔργον ἐστιν ἀγάπη.",
  translation: "The work is love.",
  wordBreakdown: [
    { greek: "τὸ ἔργον", meaning: "the work", note: "Chapter 6 vocabulary." },
    { greek: "ἐστιν", meaning: "is", note: "Helper verb." },
    { greek: "ἀγάπη", meaning: "love", note: "Chapter 6 vocabulary." }
  ],
  structure: "Subject → Verb → Predicate Noun",
  explanation: "The predicate noun explains what the subject is."
},

{
  id: "ch6-014",
  chapter: 6,
  greek: "ὁ καιρὸς ἐστιν νῦν.",
  translation: "The appointed time is now.",
  wordBreakdown: [
    { greek: "ὁ καιρός", meaning: "the appointed time", note: "Chapter 6 vocabulary." },
    { greek: "ἐστιν", meaning: "is", note: "Helper verb." },
    { greek: "νῦν", meaning: "now", note: "Chapter 6 time word." }
  ],
  structure: "Subject → Verb → Time",
  explanation: "καιρός emphasizes a specific or meaningful time, not just general time."
},

{
  id: "ch6-015",
  chapter: 6,
  greek: "ὁ θεὸς ἐστιν καὶ ἡ ἀγάπη ἐστιν.",
  translation: "God is and love is.",
  wordBreakdown: [
    { greek: "ὁ θεός ἐστιν", meaning: "God is", note: "First clause." },
    { greek: "καί", meaning: "and", note: "Connector." },
    { greek: "ἡ ἀγάπη ἐστιν", meaning: "love is", note: "Second clause." }
  ],
  structure: "Clause + καί + Clause",
  explanation: "Each clause repeats the same simple subject–verb structure."
},

{
  id: "ch6-016",
  chapter: 6,
  greek: "αὐτός ἐστιν ἐν τῷ κόσμῳ καὶ νῦν ἐστιν.",
  translation: "He is in the world and is now.",
  wordBreakdown: [
    { greek: "αὐτός", meaning: "he", note: "Chapter 6 pronoun." },
    { greek: "ἐστιν", meaning: "is", note: "Verb." },
    { greek: "ἐν τῷ κόσμῳ", meaning: "in the world", note: "Location phrase." },
    { greek: "καὶ νῦν ἐστιν", meaning: "and is now", note: "Second clause with time." }
  ],
  structure: "Clause + καί + Clause",
  explanation: "αὐτός functions as the subject, replacing a noun."
},

{
  id: "ch6-017",
  chapter: 6,
  greek: "ὅτι ἡ ἀγάπη ἐστιν ἐν τῇ καρδίᾳ.",
  translation: "Because love is in the heart.",
  wordBreakdown: [
    { greek: "ὅτι", meaning: "because/that", note: "Chapter 6 conjunction." },
    { greek: "ἡ ἀγάπη", meaning: "love", note: "Subject." },
    { greek: "ἐστιν", meaning: "is", note: "Verb." },
    { greek: "ἐν τῇ καρδίᾳ", meaning: "in the heart", note: "Location phrase." }
  ],
  structure: "ὅτι → Clause",
  explanation: "ὅτι introduces a reason or explanation."
},

{
  id: "ch6-018",
  chapter: 6,
  greek: "ὁ θεὸς ἐστιν ἐν τῇ βασιλείᾳ καὶ τὸ ἔργον ἐστιν.",
  translation: "God is in the kingdom and the work is.",
  wordBreakdown: [
    { greek: "ὁ θεὸς ἐστιν ἐν τῇ βασιλείᾳ", meaning: "God is in the kingdom", note: "Clause 1." },
    { greek: "καί", meaning: "and", note: "Connector." },
    { greek: "τὸ ἔργον ἐστιν", meaning: "the work is", note: "Clause 2." }
  ],
  structure: "Clause + καί + Clause",
  explanation: "The first clause gives location, while the second is a simple statement."
},

{
  id: "ch6-019",
  chapter: 6,
  greek: "οὐκ ἐστιν ἄλλος θεός.",
  translation: "There is not another God.",
  wordBreakdown: [
    { greek: "οὐκ", meaning: "not", note: "Negates the verb." },
    { greek: "ἐστιν", meaning: "is", note: "Verb." },
    { greek: "ἄλλος θεός", meaning: "another God", note: "Chapter 6 vocab with noun." }
  ],
  structure: "Negative → Verb → Predicate",
  explanation: "Greek often leaves the subject implied in simple statements like this."
},

{
  id: "ch6-020",
  chapter: 6,
  greek: "ὁ καιρὸς καὶ ἡ ὥρα ἐστιν νῦν.",
  translation: "The time and the hour are now.",
  wordBreakdown: [
    { greek: "ὁ καιρός", meaning: "the appointed time", note: "Chapter 6 vocabulary." },
    { greek: "καί", meaning: "and", note: "Connector." },
    { greek: "ἡ ὥρα", meaning: "the hour", note: "Chapter 6 vocabulary." },
    { greek: "ἐστιν", meaning: "is/are", note: "Verb." },
    { greek: "νῦν", meaning: "now", note: "Time word." }
  ],
  structure: "Subject + καί + Subject → Verb → Time",
  explanation: "Two subjects share the same verb and are both connected to νῦν."
},

{
  id: "ch7-001",
  chapter: 7,
  greek: "ὁ Ἰησοῦς ἐστιν κύριος.",
  translation: "Jesus is Lord.",
  wordBreakdown: [
    { greek: "ὁ Ἰησοῦς", meaning: "Jesus", note: "Chapter 7 vocabulary." },
    { greek: "ἐστιν", meaning: "is", note: "Helper verb." },
    { greek: "κύριος", meaning: "Lord", note: "Chapter 7 vocabulary." }
  ],
  structure: "Subject → Verb → Predicate",
  explanation: "κύριος describes who Jesus is. This is a basic identity statement."
},

{
  id: "ch7-002",
  chapter: 7,
  greek: "ὁ υἱὸς ἐστιν ἐν τῷ οὐρανῷ.",
  translation: "The son is in heaven.",
  wordBreakdown: [
    { greek: "ὁ υἱός", meaning: "the son", note: "Chapter 7 vocabulary." },
    { greek: "ἐστιν", meaning: "is", note: "Verb." },
    { greek: "ἐν τῷ οὐρανῷ", meaning: "in heaven", note: "Location phrase." }
  ],
  structure: "Subject → Verb → Prepositional Phrase",
  explanation: "οὐρανός refers to heaven, and ἐν shows location."
},

{
  id: "ch7-003",
  chapter: 7,
  greek: "ὁ θεὸς εἶπεν λόγον.",
  translation: "God said a word.",
  wordBreakdown: [
    { greek: "ὁ θεός", meaning: "God", note: "Subject." },
    { greek: "εἶπεν", meaning: "said", note: "Chapter 7 past tense verb." },
    { greek: "λόγον", meaning: "a word", note: "Object." }
  ],
  structure: "Subject → Verb → Object",
  explanation: "εἶπεν is past tense (“said”), unlike earlier present verbs."
},

{
  id: "ch7-004",
  chapter: 7,
  greek: "ὁ κύριος ἔχει ἐξουσίαν.",
  translation: "The Lord has authority.",
  wordBreakdown: [
    { greek: "ὁ κύριος", meaning: "the Lord", note: "Chapter 7 vocabulary." },
    { greek: "ἔχει", meaning: "has", note: "Verb from earlier chapters." },
    { greek: "ἐξουσίαν", meaning: "authority", note: "Chapter 7 vocabulary." }
  ],
  structure: "Subject → Verb → Object",
  explanation: "ἐξουσία means authority or power, something possessed."
},

{
  id: "ch7-005",
  chapter: 7,
  greek: "ἡ ἁμαρτία ἐστιν ἐν τῷ κόσμῳ.",
  translation: "Sin is in the world.",
  wordBreakdown: [
    { greek: "ἡ ἁμαρτία", meaning: "sin", note: "Chapter 7 vocabulary." },
    { greek: "ἐστιν", meaning: "is", note: "Verb." },
    { greek: "ἐν τῷ κόσμῳ", meaning: "in the world", note: "Location phrase." }
  ],
  structure: "Subject → Verb → Prepositional Phrase",
  explanation: "This shows where something exists using ἐν."
},

{
  id: "ch7-006",
  chapter: 7,
  greek: "σύ εἶ ὁ υἱός.",
  translation: "You are the son.",
  wordBreakdown: [
    { greek: "σύ", meaning: "you", note: "Chapter 7 pronoun." },
    { greek: "εἶ", meaning: "are", note: "Form of εἰμί." },
    { greek: "ὁ υἱός", meaning: "the son", note: "Predicate noun." }
  ],
  structure: "Pronoun → Verb → Predicate",
  explanation: "σύ is used for emphasis since Greek verbs already imply the subject."
},

{
  id: "ch7-007",
  chapter: 7,
  greek: "οὗτος ἐστιν ὁ κύριος.",
  translation: "This is the Lord.",
  wordBreakdown: [
    { greek: "οὗτος", meaning: "this", note: "Chapter 7 demonstrative." },
    { greek: "ἐστιν", meaning: "is", note: "Verb." },
    { greek: "ὁ κύριος", meaning: "the Lord", note: "Predicate noun." }
  ],
  structure: "Subject → Verb → Predicate",
  explanation: "οὗτος points to something specific: “this one.”"
},

{
  id: "ch7-008",
  chapter: 7,
  greek: "ὁ Ἰησοῦς εἰς τὸν κόσμον ἔρχεται.",
  translation: "Jesus comes into the world.",
  wordBreakdown: [
    { greek: "ὁ Ἰησοῦς", meaning: "Jesus", note: "Subject." },
    { greek: "εἰς", meaning: "into", note: "Chapter 7 preposition showing movement." },
    { greek: "τὸν κόσμον", meaning: "the world", note: "Object of εἰς." },
    { greek: "ἔρχεται", meaning: "comes", note: "Verb added for natural sentence." }
  ],
  structure: "Subject → Prepositional Phrase → Verb",
  explanation: "εἰς shows movement toward something, not just location."
},

{
  id: "ch7-009",
  chapter: 7,
  greek: "γὰρ ὁ θεὸς ἀγαπᾷ.",
  translation: "For God loves.",
  wordBreakdown: [
    { greek: "γάρ", meaning: "for", note: "Chapter 7 explanatory word." },
    { greek: "ὁ θεός", meaning: "God", note: "Subject." },
    { greek: "ἀγαπᾷ", meaning: "loves", note: "Verb." }
  ],
  structure: "γάρ → Clause",
  explanation: "γάρ introduces a reason or explanation."
},

{
  id: "ch7-010",
  chapter: 7,
  greek: "μή ἐστιν ἁμαρτία ἐν τῷ υἱῷ.",
  translation: "There is not sin in the son.",
  wordBreakdown: [
    { greek: "μή", meaning: "not", note: "Chapter 7 negative." },
    { greek: "ἐστιν", meaning: "is", note: "Verb." },
    { greek: "ἁμαρτία", meaning: "sin", note: "Subject idea." },
    { greek: "ἐν τῷ υἱῷ", meaning: "in the son", note: "Location phrase." }
  ],
  structure: "Negative → Verb → Subject → Phrase",
  explanation: "μή is another way to negate, often used differently than οὐ."
},

{
  id: "ch7-011",
  chapter: 7,
  greek: "ὁ οὐρανὸς ἐστιν ἡ βασιλεία.",
  translation: "Heaven is the kingdom.",
  wordBreakdown: [
    { greek: "ὁ οὐρανός", meaning: "heaven", note: "Chapter 7 vocabulary." },
    { greek: "ἐστιν", meaning: "is", note: "Verb." },
    { greek: "ἡ βασιλεία", meaning: "the kingdom", note: "Chapter 6 vocabulary." }
  ],
  structure: "Subject → Verb → Predicate",
  explanation: "Both nouns are connected by ἐστιν in an identity statement."
},

{
  id: "ch7-012",
  chapter: 7,
  greek: "ὁ υἱὸς εἶπεν λόγον.",
  translation: "The son said a word.",
  wordBreakdown: [
    { greek: "ὁ υἱός", meaning: "the son", note: "Subject." },
    { greek: "εἶπεν", meaning: "said", note: "Past verb." },
    { greek: "λόγον", meaning: "word", note: "Object." }
  ],
  structure: "Subject → Verb → Object",
  explanation: "This reinforces εἶπεν as a past tense action."
},

{
  id: "ch7-013",
  chapter: 7,
  greek: "ὁ κύριος ἐστιν ἐν τῷ οὐρανῷ καὶ ἐν τῷ κόσμῳ.",
  translation: "The Lord is in heaven and in the world.",
  wordBreakdown: [
    { greek: "ὁ κύριος", meaning: "the Lord", note: "Subject." },
    { greek: "ἐστιν", meaning: "is", note: "Verb." },
    { greek: "ἐν τῷ οὐρανῷ", meaning: "in heaven", note: "Phrase 1." },
    { greek: "καὶ ἐν τῷ κόσμῳ", meaning: "and in the world", note: "Phrase 2." }
  ],
  structure: "Subject → Verb → Phrase + καί Phrase",
  explanation: "καί connects two prepositional phrases."
},

{
  id: "ch7-014",
  chapter: 7,
  greek: "οὗτος ἐστιν ὁ υἱὸς καὶ ὁ κύριος.",
  translation: "This is the son and the Lord.",
  wordBreakdown: [
    { greek: "οὗτος", meaning: "this", note: "Subject." },
    { greek: "ἐστιν", meaning: "is", note: "Verb." },
    { greek: "ὁ υἱός καὶ ὁ κύριος", meaning: "the son and the Lord", note: "Predicate." }
  ],
  structure: "Subject → Verb → Predicate + καί",
  explanation: "The predicate includes two nouns joined by καί."
},

{
  id: "ch7-015",
  chapter: 7,
  greek: "ὁ θεὸς γὰρ ἔχει ἐξουσίαν.",
  translation: "For God has authority.",
  wordBreakdown: [
    { greek: "ὁ θεός", meaning: "God", note: "Subject." },
    { greek: "γάρ", meaning: "for", note: "Connector." },
    { greek: "ἔχει", meaning: "has", note: "Verb." },
    { greek: "ἐξουσίαν", meaning: "authority", note: "Object." }
  ],
  structure: "Subject → γάρ → Verb → Object",
  explanation: "γάρ explains or supports a previous idea."
},

{
  id: "ch7-016",
  chapter: 7,
  greek: "ὁ καιρὸς καὶ ἡ ὥρα ἐστιν.",
  translation: "The time and the hour are.",
  wordBreakdown: [
    { greek: "ὁ καιρός", meaning: "time", note: "Chapter 6 vocabulary." },
    { greek: "καί", meaning: "and", note: "Connector." },
    { greek: "ἡ ὥρα", meaning: "hour", note: "Chapter 6 vocabulary." },
    { greek: "ἐστιν", meaning: "is/are", note: "Verb." }
  ],
  structure: "Subject + καί + Subject → Verb",
  explanation: "Two subjects share one verb."
},

{
  id: "ch7-017",
  chapter: 7,
  greek: "ὁ Ἰησοῦς εἶπεν ὅτι ὁ θεὸς ἀγαπᾷ.",
  translation: "Jesus said that God loves.",
  wordBreakdown: [
    { greek: "ὁ Ἰησοῦς", meaning: "Jesus", note: "Subject." },
    { greek: "εἶπεν", meaning: "said", note: "Past verb." },
    { greek: "ὅτι", meaning: "that", note: "Clause marker." },
    { greek: "ὁ θεὸς ἀγαπᾷ", meaning: "God loves", note: "Clause." }
  ],
  structure: "Subject → Verb → ὅτι Clause",
  explanation: "ὅτι introduces what is being said."
},

{
  id: "ch7-018",
  chapter: 7,
  greek: "ὥστε ὁ υἱὸς ἐστιν κύριος.",
  translation: "Therefore the son is Lord.",
  wordBreakdown: [
    { greek: "ὥστε", meaning: "therefore", note: "Chapter 7 connector." },
    { greek: "ὁ υἱός", meaning: "the son", note: "Subject." },
    { greek: "ἐστιν", meaning: "is", note: "Verb." },
    { greek: "κύριος", meaning: "Lord", note: "Predicate." }
  ],
  structure: "ὥστε → Clause",
  explanation: "ὥστε introduces a result or conclusion."
},

{
  id: "ch7-019",
  chapter: 7,
  greek: "σύ εἶ ἐν τῇ βασιλείᾳ.",
  translation: "You are in the kingdom.",
  wordBreakdown: [
    { greek: "σύ", meaning: "you", note: "Subject." },
    { greek: "εἶ", meaning: "are", note: "Verb." },
    { greek: "ἐν τῇ βασιλείᾳ", meaning: "in the kingdom", note: "Phrase." }
  ],
  structure: "Subject → Verb → Phrase",
  explanation: "σύ adds emphasis even though the verb already implies 'you.'"
},

{
  id: "ch7-020",
  chapter: 7,
  greek: "οὐκ ἐστιν ἁμαρτία ἐν τῷ οὐρανῷ.",
  translation: "There is not sin in heaven.",
  wordBreakdown: [
    { greek: "οὐκ", meaning: "not", note: "Negates the verb." },
    { greek: "ἐστιν", meaning: "is", note: "Verb." },
    { greek: "ἁμαρτία", meaning: "sin", note: "Subject idea." },
    { greek: "ἐν τῷ οὐρανῷ", meaning: "in heaven", note: "Location phrase." }
  ],
  structure: "Negative → Verb → Subject → Phrase",
  explanation: "οὐκ negates the statement, showing something does not exist."
},


{
  id: "ch8-001",
  chapter: 8,
  greek: "ὁ Ἰησοῦς λέγει πρὸς τὸν ὄχλον.",
  translation: "Jesus speaks to the crowd.",
  wordBreakdown: [
    { greek: "ὁ Ἰησοῦς", meaning: "Jesus", note: "Subject." },
    { greek: "λέγει", meaning: "speaks", note: "Verb (related to λέγω)." },
    { greek: "πρός", meaning: "to", note: "Chapter 8 preposition showing direction." },
    { greek: "τὸν ὄχλον", meaning: "the crowd", note: "Chapter 8 vocabulary." }
  ],
  structure: "Subject → Verb → πρός Phrase",
  explanation: "πρός often shows direction toward someone."
},

{
  id: "ch8-002",
  chapter: 8,
  greek: "ὁ ὄχλος ἐστιν ἐν τῇ οἰκίᾳ.",
  translation: "The crowd is in the house.",
  wordBreakdown: [
    { greek: "ὁ ὄχλος", meaning: "the crowd", note: "Chapter 8 vocabulary." },
    { greek: "ἐστιν", meaning: "is", note: "Verb." },
    { greek: "ἐν τῇ οἰκίᾳ", meaning: "in the house", note: "Chapter 8 vocabulary." }
  ],
  structure: "Subject → Verb → Prepositional Phrase",
  explanation: "οἰκία refers to a house or home, used with ἐν for location."
},

{
  id: "ch8-003",
  chapter: 8,
  greek: "Ἰωάννης λέγει παραβολήν.",
  translation: "John speaks a parable.",
  wordBreakdown: [
    { greek: "Ἰωάννης", meaning: "John", note: "Chapter 8 vocabulary." },
    { greek: "λέγει", meaning: "speaks", note: "Verb." },
    { greek: "παραβολήν", meaning: "parable", note: "Chapter 8 vocabulary." }
  ],
  structure: "Subject → Verb → Object",
  explanation: "παραβολή is something spoken, so it fits naturally as the object of λέγει."
},

{
  id: "ch8-004",
  chapter: 8,
  greek: "ὁ θεὸς ἐστιν μετὰ τοῦ ἀνθρώπου.",
  translation: "God is with the man.",
  wordBreakdown: [
    { greek: "ὁ θεός", meaning: "God", note: "Subject." },
    { greek: "ἐστιν", meaning: "is", note: "Verb." },
    { greek: "μετά", meaning: "with", note: "Chapter 8 preposition." },
    { greek: "τοῦ ἀνθρώπου", meaning: "the man", note: "Object of the preposition." }
  ],
  structure: "Subject → Verb → μετά Phrase",
  explanation: "μετά with a genitive means “with” in the sense of association."
},

{
  id: "ch8-005",
  chapter: 8,
  greek: "ὁ υἱὸς ἐστὶν ἐκ τοῦ οὐρανοῦ.",
  translation: "The son is from heaven.",
  wordBreakdown: [
    { greek: "ὁ υἱός", meaning: "the son", note: "Subject." },
    { greek: "ἐστίν", meaning: "is", note: "Verb." },
    { greek: "ἐκ", meaning: "from/out of", note: "Chapter 8 preposition." },
    { greek: "τοῦ οὐρανοῦ", meaning: "heaven", note: "Source phrase." }
  ],
  structure: "Subject → Verb → ἐκ Phrase",
  explanation: "ἐκ shows origin or source."
},

{
  id: "ch8-006",
  chapter: 8,
  greek: "ὁ Ἰησοῦς λέγει πρὸς τὸν ὄχλον διὰ τὴν ἀγάπην.",
  translation: "Jesus speaks to the crowd because of love.",
  wordBreakdown: [
    { greek: "ὁ Ἰησοῦς", meaning: "Jesus", note: "Subject." },
    { greek: "λέγει", meaning: "speaks", note: "Verb." },
    { greek: "πρὸς τὸν ὄχλον", meaning: "to the crowd", note: "Direction phrase." },
    { greek: "διά", meaning: "because of", note: "Chapter 8 preposition." },
    { greek: "τὴν ἀγάπην", meaning: "love", note: "Reason." }
  ],
  structure: "Clause → πρός Phrase → διά Phrase",
  explanation: "διά can express reason: “because of.”"
},

{
  id: "ch8-007",
  chapter: 8,
  greek: "ὁ ἄνθρωπος ἐστὶν παρὰ τὸν κύριον.",
  translation: "The man is beside the Lord.",
  wordBreakdown: [
    { greek: "ὁ ἄνθρωπος", meaning: "the man", note: "Subject." },
    { greek: "ἐστίν", meaning: "is", note: "Verb." },
    { greek: "παρά", meaning: "beside/with", note: "Chapter 8 preposition." },
    { greek: "τὸν κύριον", meaning: "the Lord", note: "Object." }
  ],
  structure: "Subject → Verb → παρά Phrase",
  explanation: "παρά often means “beside” or “in the presence of.”"
},

{
  id: "ch8-008",
  chapter: 8,
  greek: "ὁ ὄχλος ἐστὶν ὑπὸ τοῦ θεοῦ.",
  translation: "The crowd is under God.",
  wordBreakdown: [
    { greek: "ὁ ὄχλος", meaning: "the crowd", note: "Subject." },
    { greek: "ἐστίν", meaning: "is", note: "Verb." },
    { greek: "ὑπό", meaning: "under/by", note: "Chapter 8 preposition." },
    { greek: "τοῦ θεοῦ", meaning: "God", note: "Object." }
  ],
  structure: "Subject → Verb → ὑπό Phrase",
  explanation: "ὑπό can show being under authority or control."
},

{
  id: "ch8-009",
  chapter: 8,
  greek: "ὁ Ἰησοῦς ἦν ἐν τῇ οἰκίᾳ.",
  translation: "Jesus was in the house.",
  wordBreakdown: [
    { greek: "ὁ Ἰησοῦς", meaning: "Jesus", note: "Subject." },
    { greek: "ἦν", meaning: "was", note: "Chapter 8 past tense of εἰμί." },
    { greek: "ἐν τῇ οἰκίᾳ", meaning: "in the house", note: "Location." }
  ],
  structure: "Subject → Past Verb → Prepositional Phrase",
  explanation: "ἦν is the past form of “is,” meaning “was.”"
},

{
  id: "ch8-010",
  chapter: 8,
  greek: "ὁ θεὸς λέγει ἵνα ὁ ἄνθρωπος πιστεύῃ.",
  translation: "God speaks so that the man may believe.",
  wordBreakdown: [
    { greek: "ὁ θεός", meaning: "God", note: "Subject." },
    { greek: "λέγει", meaning: "speaks", note: "Verb." },
    { greek: "ἵνα", meaning: "so that", note: "Chapter 8 purpose word." },
    { greek: "ὁ ἄνθρωπος πιστεύῃ", meaning: "the man may believe", note: "Purpose clause." }
  ],
  structure: "Clause → ἵνα Clause",
  explanation: "ἵνα introduces purpose: “so that.”"
},

{
  id: "ch8-011",
  chapter: 8,
  greek: "ἡ ἡμέρα ἐστὶν νῦν.",
  translation: "The day is now.",
  wordBreakdown: [
    { greek: "ἡ ἡμέρα", meaning: "the day", note: "Chapter 8 vocabulary." },
    { greek: "ἐστίν", meaning: "is", note: "Verb." },
    { greek: "νῦν", meaning: "now", note: "Time word." }
  ],
  structure: "Subject → Verb → Time",
  explanation: "ἡμέρα refers to a day, and νῦν places it in the present."
},

{
  id: "ch8-012",
  chapter: 8,
  greek: "ὁ θάνατος ἐστὶν ἐν τῷ κόσμῳ.",
  translation: "Death is in the world.",
  wordBreakdown: [
    { greek: "ὁ θάνατος", meaning: "death", note: "Chapter 8 vocabulary." },
    { greek: "ἐστίν", meaning: "is", note: "Verb." },
    { greek: "ἐν τῷ κόσμῳ", meaning: "in the world", note: "Location." }
  ],
  structure: "Subject → Verb → Prepositional Phrase",
  explanation: "This uses ἐν to show where something exists."
},

{
  id: "ch8-013",
  chapter: 8,
  greek: "ὁ Ἰησοῦς λέγει ἀλλὰ ὁ κόσμος οὐ πιστεύει.",
  translation: "Jesus speaks, but the world does not believe.",
  wordBreakdown: [
    { greek: "ὁ Ἰησοῦς λέγει", meaning: "Jesus speaks", note: "Clause 1." },
    { greek: "ἀλλά", meaning: "but", note: "Chapter 8 contrast word." },
    { greek: "ὁ κόσμος οὐ πιστεύει", meaning: "the world does not believe", note: "Clause 2." }
  ],
  structure: "Clause + ἀλλά + Clause",
  explanation: "ἀλλά introduces contrast between two ideas."
},

{
  id: "ch8-014",
  chapter: 8,
  greek: "ὁ Ἰωάννης ἐστὶν μετὰ τοῦ Ἰησοῦ.",
  translation: "John is with Jesus.",
  wordBreakdown: [
    { greek: "ὁ Ἰωάννης", meaning: "John", note: "Subject." },
    { greek: "ἐστίν", meaning: "is", note: "Verb." },
    { greek: "μετά", meaning: "with", note: "Preposition." },
    { greek: "τοῦ Ἰησοῦ", meaning: "Jesus", note: "Object." }
  ],
  structure: "Subject → Verb → μετά Phrase",
  explanation: "μετά shows association: being with someone."
},

{
  id: "ch8-015",
  chapter: 8,
  greek: "ὁ θεὸς λέγει διὰ τοῦ λόγου.",
  translation: "God speaks through the word.",
  wordBreakdown: [
    { greek: "ὁ θεός", meaning: "God", note: "Subject." },
    { greek: "λέγει", meaning: "speaks", note: "Verb." },
    { greek: "διά", meaning: "through", note: "Preposition." },
    { greek: "τοῦ λόγου", meaning: "the word", note: "Means or instrument." }
  ],
  structure: "Subject → Verb → διά Phrase",
  explanation: "διά can show the means by which something happens."
},

{
  id: "ch8-016",
  chapter: 8,
  greek: "ὁ ὄχλος ἐστὶν ἐκ τῆς οἰκίας.",
  translation: "The crowd is out of the house.",
  wordBreakdown: [
    { greek: "ὁ ὄχλος", meaning: "the crowd", note: "Subject." },
    { greek: "ἐστίν", meaning: "is", note: "Verb." },
    { greek: "ἐκ", meaning: "out of", note: "Preposition." },
    { greek: "τῆς οἰκίας", meaning: "the house", note: "Source." }
  ],
  structure: "Subject → Verb → ἐκ Phrase",
  explanation: "ἐκ shows movement or origin out of something."
},

{
  id: "ch8-017",
  chapter: 8,
  greek: "ὁ Ἰησοῦς λέγει πρὸς τὸν υἱὸν ἵνα ἔχῃ ζωήν.",
  translation: "Jesus speaks to the son so that he may have life.",
  wordBreakdown: [
    { greek: "ὁ Ἰησοῦς λέγει", meaning: "Jesus speaks", note: "Clause 1." },
    { greek: "πρὸς τὸν υἱόν", meaning: "to the son", note: "Direction." },
    { greek: "ἵνα", meaning: "so that", note: "Purpose word." },
    { greek: "ἔχῃ ζωήν", meaning: "he may have life", note: "Purpose clause." }
  ],
  structure: "Clause → πρός Phrase → ἵνα Clause",
  explanation: "ἵνα introduces the purpose of the action."
},

{
  id: "ch8-018",
  chapter: 8,
  greek: "ὁ Ἰησοῦς ἦν παρὰ τὸν θεόν.",
  translation: "Jesus was beside God.",
  wordBreakdown: [
    { greek: "ὁ Ἰησοῦς", meaning: "Jesus", note: "Subject." },
    { greek: "ἦν", meaning: "was", note: "Past verb." },
    { greek: "παρά", meaning: "beside", note: "Preposition." },
    { greek: "τὸν θεόν", meaning: "God", note: "Object." }
  ],
  structure: "Subject → Past Verb → παρά Phrase",
  explanation: "παρά shows closeness or presence beside someone."
},

{
  id: "ch8-019",
  chapter: 8,
  greek: "ὁ ἄνθρωπος ἐστὶν μετὰ τοῦ ὄχλου.",
  translation: "The man is with the crowd.",
  wordBreakdown: [
    { greek: "ὁ ἄνθρωπος", meaning: "the man", note: "Subject." },
    { greek: "ἐστίν", meaning: "is", note: "Verb." },
    { greek: "μετά", meaning: "with", note: "Preposition." },
    { greek: "τοῦ ὄχλου", meaning: "the crowd", note: "Object." }
  ],
  structure: "Subject → Verb → μετά Phrase",
  explanation: "μετά shows being together with others."
},

{
  id: "ch8-020",
  chapter: 8,
  greek: "ὁ θεὸς λέγει ὥστε ὁ ἄνθρωπος ζῇ.",
  translation: "God speaks, therefore the man lives.",
  wordBreakdown: [
    { greek: "ὁ θεός λέγει", meaning: "God speaks", note: "Clause 1." },
    { greek: "ὥστε", meaning: "therefore", note: "Result word." },
    { greek: "ὁ ἄνθρωπος ζῇ", meaning: "the man lives", note: "Clause 2." }
  ],
  structure: "Clause → ὥστε Clause",
  explanation: "ὥστε introduces a result or outcome."
},

{
  id: "ch9-001",
  chapter: 9,
  greek: "ὁ θεὸς ἐστιν ἀγαθός.",
  translation: "God is good.",
  wordBreakdown: [
    { greek: "ὁ θεός", meaning: "God", note: "Subject." },
    { greek: "ἐστιν", meaning: "is", note: "Verb." },
    { greek: "ἀγαθός", meaning: "good", note: "Chapter 9 adjective describing the subject." }
  ],
  structure: "Subject → Verb → Adjective",
  explanation: "The adjective agrees with the subject and describes what it is."
},

{
  id: "ch9-002",
  chapter: 9,
  greek: "ὁ Ἰησοῦς ἐστιν ἀγαπητός.",
  translation: "Jesus is beloved.",
  wordBreakdown: [
    { greek: "ὁ Ἰησοῦς", meaning: "Jesus", note: "Subject." },
    { greek: "ἐστιν", meaning: "is", note: "Verb." },
    { greek: "ἀγαπητός", meaning: "beloved", note: "Chapter 9 adjective." }
  ],
  structure: "Subject → Verb → Adjective",
  explanation: "ἀγαπητός describes the status of Jesus as “beloved.”"
},

{
  id: "ch9-003",
  chapter: 9,
  greek: "ἡ ζωή ἐστιν αἰώνιος.",
  translation: "The life is eternal.",
  wordBreakdown: [
    { greek: "ἡ ζωή", meaning: "life", note: "Subject." },
    { greek: "ἐστιν", meaning: "is", note: "Verb." },
    { greek: "αἰώνιος", meaning: "eternal", note: "Chapter 9 adjective." }
  ],
  structure: "Subject → Verb → Adjective",
  explanation: "αἰώνιος describes the quality of life as eternal."
},

{
  id: "ch9-004",
  chapter: 9,
  greek: "οἱ ἄνθρωποι ἀγαπῶσιν ἀλλήλους.",
  translation: "The people love one another.",
  wordBreakdown: [
    { greek: "οἱ ἄνθρωποι", meaning: "the people", note: "Subject." },
    { greek: "ἀγαπῶσιν", meaning: "love", note: "Verb." },
    { greek: "ἀλλήλους", meaning: "one another", note: "Chapter 9 reciprocal word." }
  ],
  structure: "Subject → Verb → Object",
  explanation: "ἀλλήλους shows mutual action between people."
},

{
  id: "ch9-005",
  chapter: 9,
  greek: "ὁ Ἰησοῦς ἀπεκρίθη καὶ λέγει λόγον.",
  translation: "Jesus answered and speaks a word.",
  wordBreakdown: [
    { greek: "ὁ Ἰησοῦς", meaning: "Jesus", note: "Subject." },
    { greek: "ἀπεκρίθη", meaning: "answered", note: "Chapter 9 past verb." },
    { greek: "καὶ λέγει λόγον", meaning: "and speaks a word", note: "Second action." }
  ],
  structure: "Clause + καί + Clause",
  explanation: "ἀπεκρίθη is a past response, followed by present speaking."
},

{
  id: "ch9-006",
  chapter: 9,
  greek: "ὁ δοῦλος ἐστιν πιστός.",
  translation: "The servant is faithful.",
  wordBreakdown: [
    { greek: "ὁ δοῦλος", meaning: "the servant", note: "Chapter 9 noun." },
    { greek: "ἐστιν", meaning: "is", note: "Verb." },
    { greek: "πιστός", meaning: "faithful", note: "Chapter 9 adjective." }
  ],
  structure: "Subject → Verb → Adjective",
  explanation: "πιστός describes character: faithful or trustworthy."
},

{
  id: "ch9-007",
  chapter: 9,
  greek: "ἐάν ὁ ἄνθρωπος πιστεύῃ, ἔχει ζωήν.",
  translation: "If the man believes, he has life.",
  wordBreakdown: [
    { greek: "ἐάν", meaning: "if", note: "Chapter 9 conditional word." },
    { greek: "ὁ ἄνθρωπος πιστεύῃ", meaning: "the man believes", note: "Condition." },
    { greek: "ἔχει ζωήν", meaning: "he has life", note: "Result." }
  ],
  structure: "ἐάν Clause → Result Clause",
  explanation: "ἐάν introduces a condition: “if.”"
},

{
  id: "ch9-008",
  chapter: 9,
  greek: "ὁ λόγος ἐστιν ἐμός.",
  translation: "The word is mine.",
  wordBreakdown: [
    { greek: "ὁ λόγος", meaning: "the word", note: "Subject." },
    { greek: "ἐστιν", meaning: "is", note: "Verb." },
    { greek: "ἐμός", meaning: "mine", note: "Chapter 9 possessive." }
  ],
  structure: "Subject → Verb → Possessive",
  explanation: "ἐμός shows possession: “mine.”"
},

{
  id: "ch9-009",
  chapter: 9,
  greek: "ἡ ἐντολή μου ἐστιν ἀγαθή.",
  translation: "My commandment is good.",
  wordBreakdown: [
    { greek: "ἡ ἐντολή", meaning: "the commandment", note: "Chapter 9 noun." },
    { greek: "μου", meaning: "my", note: "Possessive." },
    { greek: "ἐστιν", meaning: "is", note: "Verb." },
    { greek: "ἀγαθή", meaning: "good", note: "Adjective." }
  ],
  structure: "Subject + Possessive → Verb → Adjective",
  explanation: "μου shows possession and usually follows the noun."
},

{
  id: "ch9-010",
  chapter: 9,
  greek: "ὁ ἄνθρωπος ποιεῖ κακόν.",
  translation: "The man does evil.",
  wordBreakdown: [
    { greek: "ὁ ἄνθρωπος", meaning: "the man", note: "Subject." },
    { greek: "ποιεῖ", meaning: "does", note: "Verb." },
    { greek: "κακόν", meaning: "evil", note: "Chapter 9 adjective used as a noun." }
  ],
  structure: "Subject → Verb → Object",
  explanation: "Adjectives like κακός can function as nouns meaning “evil.”"
},

{
  id: "ch9-011",
  chapter: 9,
  greek: "ὁ κόσμος ἐστιν πονηρός.",
  translation: "The world is evil.",
  wordBreakdown: [
    { greek: "ὁ κόσμος", meaning: "the world", note: "Subject." },
    { greek: "ἐστιν", meaning: "is", note: "Verb." },
    { greek: "πονηρός", meaning: "evil", note: "Chapter 9 adjective." }
  ],
  structure: "Subject → Verb → Adjective",
  explanation: "πονηρός often emphasizes moral evil."
},

{
  id: "ch9-012",
  chapter: 9,
  greek: "ὁ νεκρὸς ἐστιν ἐν τῇ γῇ.",
  translation: "The dead one is in the earth.",
  wordBreakdown: [
    { greek: "ὁ νεκρός", meaning: "the dead person", note: "Chapter 9 adjective used as noun." },
    { greek: "ἐστιν", meaning: "is", note: "Verb." },
    { greek: "ἐν τῇ γῇ", meaning: "in the earth", note: "Location." }
  ],
  structure: "Subject → Verb → Prepositional Phrase",
  explanation: "νεκρός can function as a noun: “the dead one.”"
},

{
  id: "ch9-013",
  chapter: 9,
  greek: "ὁ Ἰησοῦς λέγει καθώς ὁ θεὸς λέγει.",
  translation: "Jesus speaks just as God speaks.",
  wordBreakdown: [
    { greek: "ὁ Ἰησοῦς λέγει", meaning: "Jesus speaks", note: "Clause 1." },
    { greek: "καθώς", meaning: "just as", note: "Comparison word." },
    { greek: "ὁ θεὸς λέγει", meaning: "God speaks", note: "Clause 2." }
  ],
  structure: "Clause + καθώς Clause",
  explanation: "καθώς introduces comparison: “just as.”"
},

{
  id: "ch9-014",
  chapter: 9,
  greek: "ὁ πρῶτος ἐστιν καὶ ὁ τρίτος ἐστιν.",
  translation: "The first is and the third is.",
  wordBreakdown: [
    { greek: "ὁ πρῶτος", meaning: "the first", note: "Chapter 9 adjective." },
    { greek: "ὁ τρίτος", meaning: "the third", note: "Chapter 9 adjective." }
  ],
  structure: "Clause + καί + Clause",
  explanation: "Ordinal numbers function like adjectives or nouns."
},

{
  id: "ch9-015",
  chapter: 9,
  greek: "ὁ δοῦλος ἐστιν ἐν τῇ οἰκίᾳ.",
  translation: "The servant is in the house.",
  wordBreakdown: [
    { greek: "ὁ δοῦλος", meaning: "the servant", note: "Subject." },
    { greek: "ἐν τῇ οἰκίᾳ", meaning: "in the house", note: "Location." }
  ],
  structure: "Subject → Verb → Phrase",
  explanation: "This reinforces δοῦλος as a common NT word."
},

{
  id: "ch9-016",
  chapter: 9,
  greek: "ὁ Ἰησοῦς λέγει ἐντολήν.",
  translation: "Jesus speaks a commandment.",
  wordBreakdown: [
    { greek: "ὁ Ἰησοῦς", meaning: "Jesus", note: "Subject." },
    { greek: "λέγει", meaning: "speaks", note: "Verb." },
    { greek: "ἐντολήν", meaning: "commandment", note: "Chapter 9 vocab." }
  ],
  structure: "Subject → Verb → Object",
  explanation: "ἐντολή is something spoken or given."
},

{
  id: "ch9-017",
  chapter: 9,
  greek: "ἐάν ὁ ἄνθρωπος ποιῇ ἀγαθόν, ἐστιν πιστός.",
  translation: "If the man does good, he is faithful.",
  wordBreakdown: [
    { greek: "ἐάν", meaning: "if", note: "Condition." },
    { greek: "ποιῇ ἀγαθόν", meaning: "does good", note: "Action." },
    { greek: "ἐστιν πιστός", meaning: "is faithful", note: "Result." }
  ],
  structure: "ἐάν Clause → Result",
  explanation: "ἀγαθός can function as “good” in action."
},

{
  id: "ch9-018",
  chapter: 9,
  greek: "ὁ λόγος μου ἐστιν ἀληθής.",
  translation: "My word is true.",
  wordBreakdown: [
    { greek: "ὁ λόγος μου", meaning: "my word", note: "Possession." },
    { greek: "ἐστιν", meaning: "is", note: "Verb." },
    { greek: "ἀληθής", meaning: "true", note: "Extra descriptive word added." }
  ],
  structure: "Subject + Possessive → Verb → Adjective",
  explanation: "μου follows the noun to show possession."
},

{
  id: "ch9-019",
  chapter: 9,
  greek: "ὁ θεὸς ἀγαπᾷ τοὺς ἀγαπητούς.",
  translation: "God loves the beloved.",
  wordBreakdown: [
    { greek: "ὁ θεός", meaning: "God", note: "Subject." },
    { greek: "ἀγαπᾷ", meaning: "loves", note: "Verb." },
    { greek: "τοὺς ἀγαπητούς", meaning: "the beloved", note: "Object." }
  ],
  structure: "Subject → Verb → Object",
  explanation: "ἀγαπητός can function as “beloved ones.”"
},

{
  id: "ch9-020",
  chapter: 9,
  greek: "ὁ θάνατος οὐκ ἐστιν αἰώνιος.",
  translation: "Death is not eternal.",
  wordBreakdown: [
    { greek: "ὁ θάνατος", meaning: "death", note: "Subject." },
    { greek: "οὐκ", meaning: "not", note: "Negation." },
    { greek: "ἐστιν", meaning: "is", note: "Verb." },
    { greek: "αἰώνιος", meaning: "eternal", note: "Adjective." }
  ],
  structure: "Subject → Negative → Verb → Adjective",
  explanation: "οὐκ negates the statement, denying the quality."
},

{
  id: "ch10-001",
  chapter: 10,
  greek: "ὁ θεὸς ἐστιν ἅγιος.",
  translation: "God is holy.",
  wordBreakdown: [
    { greek: "ὁ θεός", meaning: "God", note: "Subject." },
    { greek: "ἐστιν", meaning: "is", note: "Verb." },
    { greek: "ἅγιος", meaning: "holy", note: "Chapter 10 adjective." }
  ],
  structure: "Subject → Verb → Adjective",
  explanation: "ἅγιος describes holiness as a defining quality."
},

{
  id: "ch10-002",
  chapter: 10,
  greek: "εἰ ὁ ἄνθρωπος πιστεύει, ἔχει ζωήν.",
  translation: "If the man believes, he has life.",
  wordBreakdown: [
    { greek: "εἰ", meaning: "if", note: "Chapter 10 conditional word." },
    { greek: "ὁ ἄνθρωπος πιστεύει", meaning: "the man believes", note: "Condition." },
    { greek: "ἔχει ζωήν", meaning: "he has life", note: "Result." }
  ],
  structure: "εἰ Clause → Result Clause",
  explanation: "εἰ introduces a simple condition, similar to ἐάν."
},

{
  id: "ch10-003",
  chapter: 10,
  greek: "οὐδεὶς ἐστιν ἀγαθός.",
  translation: "No one is good.",
  wordBreakdown: [
    { greek: "οὐδείς", meaning: "no one", note: "Chapter 10 negative subject." },
    { greek: "ἐστιν", meaning: "is", note: "Verb." },
    { greek: "ἀγαθός", meaning: "good", note: "Adjective." }
  ],
  structure: "Negative Subject → Verb → Adjective",
  explanation: "οὐδείς already includes negation (“no one”)."
},

{
  id: "ch10-004",
  chapter: 10,
  greek: "πᾶς ἄνθρωπος ἁμαρτάνει.",
  translation: "Every man sins.",
  wordBreakdown: [
    { greek: "πᾶς ἄνθρωπος", meaning: "every man", note: "Chapter 10 universal word." },
    { greek: "ἁμαρτάνει", meaning: "sins", note: "Verb from earlier vocab." }
  ],
  structure: "Universal Subject → Verb",
  explanation: "πᾶς means “every” or “all,” making the statement universal."
},

{
  id: "ch10-005",
  chapter: 10,
  greek: "ἓν σῶμα ἐστιν.",
  translation: "There is one body.",
  wordBreakdown: [
    { greek: "ἓν", meaning: "one", note: "Chapter 10 number." },
    { greek: "σῶμα", meaning: "body", note: "Chapter 10 noun." },
    { greek: "ἐστιν", meaning: "is", note: "Verb." }
  ],
  structure: "Number → Noun → Verb",
  explanation: "εἷς/ἓν emphasizes unity or singularity."
},

{
  id: "ch10-006",
  chapter: 10,
  greek: "ἤδη ὁ καιρὸς ἐστιν.",
  translation: "Already the time is.",
  wordBreakdown: [
    { greek: "ἤδη", meaning: "already", note: "Chapter 10 time word." },
    { greek: "ὁ καιρός", meaning: "the time", note: "Subject." },
    { greek: "ἐστιν", meaning: "is", note: "Verb." }
  ],
  structure: "Adverb → Subject → Verb",
  explanation: "ἤδη emphasizes something has already happened or is present."
},

{
  id: "ch10-007",
  chapter: 10,
  greek: "τὸ ὄνομα τοῦ θεοῦ ἐστιν ἅγιον.",
  translation: "The name of God is holy.",
  wordBreakdown: [
    { greek: "τὸ ὄνομα", meaning: "the name", note: "Chapter 10 noun." },
    { greek: "τοῦ θεοῦ", meaning: "of God", note: "Genitive showing possession." },
    { greek: "ἐστιν", meaning: "is", note: "Verb." },
    { greek: "ἅγιον", meaning: "holy", note: "Adjective." }
  ],
  structure: "Subject → Possession → Verb → Adjective",
  explanation: "The genitive (“of God”) shows whose name it is."
},

{
  id: "ch10-008",
  chapter: 10,
  greek: "τίς ἐστιν ὁ κύριος;",
  translation: "Who is the Lord?",
  wordBreakdown: [
    { greek: "τίς", meaning: "who?", note: "Chapter 10 question word." },
    { greek: "ἐστιν", meaning: "is", note: "Verb." },
    { greek: "ὁ κύριος", meaning: "the Lord", note: "Subject." }
  ],
  structure: "Question Word → Verb → Subject",
  explanation: "τίς introduces a direct question."
},

{
  id: "ch10-009",
  chapter: 10,
  greek: "τις λέγει λόγον.",
  translation: "Someone speaks a word.",
  wordBreakdown: [
    { greek: "τις", meaning: "someone", note: "Chapter 10 indefinite word." },
    { greek: "λέγει", meaning: "speaks", note: "Verb." },
    { greek: "λόγον", meaning: "word", note: "Object." }
  ],
  structure: "Indefinite Subject → Verb → Object",
  explanation: "τις means “someone” or “a certain one.”"
},

{
  id: "ch10-010",
  chapter: 10,
  greek: "ὁ ἄνθρωπος ἐστὶν περὶ τοῦ λόγου.",
  translation: "The man is concerning the word.",
  wordBreakdown: [
    { greek: "ὁ ἄνθρωπος", meaning: "the man", note: "Subject." },
    { greek: "ἐστίν", meaning: "is", note: "Verb." },
    { greek: "περί", meaning: "about/concerning", note: "Chapter 10 preposition." },
    { greek: "τοῦ λόγου", meaning: "the word", note: "Object." }
  ],
  structure: "Subject → Verb → περί Phrase",
  explanation: "περί introduces the topic: “about something.”"
},

{
  id: "ch10-011",
  chapter: 10,
  greek: "ὁ ἄνθρωπος ἐστὶν σάρξ.",
  translation: "The man is flesh.",
  wordBreakdown: [
    { greek: "ὁ ἄνθρωπος", meaning: "the man", note: "Subject." },
    { greek: "ἐστίν", meaning: "is", note: "Verb." },
    { greek: "σάρξ", meaning: "flesh", note: "Chapter 10 noun." }
  ],
  structure: "Subject → Verb → Predicate",
  explanation: "σάρξ often refers to human nature or physical existence."
},

{
  id: "ch10-012",
  chapter: 10,
  greek: "ὁ Ἰησοῦς ἐστὶν σὺν τοῖς μαθηταῖς.",
  translation: "Jesus is with the disciples.",
  wordBreakdown: [
    { greek: "ὁ Ἰησοῦς", meaning: "Jesus", note: "Subject." },
    { greek: "ἐστίν", meaning: "is", note: "Verb." },
    { greek: "σύν", meaning: "with", note: "Chapter 10 preposition." },
    { greek: "τοῖς μαθηταῖς", meaning: "the disciples", note: "Object." }
  ],
  structure: "Subject → Verb → σύν Phrase",
  explanation: "σύν also means “with,” similar to μετά."
},

{
  id: "ch10-013",
  chapter: 10,
  greek: "τὸ τέκνον ἐστὶν ἐν τῇ οἰκίᾳ.",
  translation: "The child is in the house.",
  wordBreakdown: [
    { greek: "τὸ τέκνον", meaning: "the child", note: "Chapter 10 noun." },
    { greek: "ἐστίν", meaning: "is", note: "Verb." },
    { greek: "ἐν τῇ οἰκίᾳ", meaning: "in the house", note: "Location." }
  ],
  structure: "Subject → Verb → Phrase",
  explanation: "τέκνον refers to a child or descendant."
},

{
  id: "ch10-014",
  chapter: 10,
  greek: "εἰ μὴ ὁ θεὸς ἐστίν, οὐκ ἔστιν ζωή.",
  translation: "If not God is, there is no life.",
  wordBreakdown: [
    { greek: "εἰ μή", meaning: "if not/except", note: "Chapter 10 phrase." },
    { greek: "ὁ θεός ἐστίν", meaning: "God is", note: "Clause." },
    { greek: "οὐκ ἔστιν ζωή", meaning: "there is no life", note: "Result." }
  ],
  structure: "εἰ μή Clause → Result",
  explanation: "εἰ μή introduces an exception or condition."
},

{
  id: "ch10-015",
  chapter: 10,
  greek: "πᾶς ὁ κόσμος ἐστὶν πονηρός.",
  translation: "All the world is evil.",
  wordBreakdown: [
    { greek: "πᾶς ὁ κόσμος", meaning: "all the world", note: "Universal subject." },
    { greek: "ἐστίν", meaning: "is", note: "Verb." },
    { greek: "πονηρός", meaning: "evil", note: "Adjective." }
  ],
  structure: "Universal Subject → Verb → Adjective",
  explanation: "πᾶς emphasizes totality: all."
},

{
  id: "ch10-016",
  chapter: 10,
  greek: "τίς λέγει τὸ ὄνομα;",
  translation: "Who speaks the name?",
  wordBreakdown: [
    { greek: "τίς", meaning: "who?", note: "Question word." },
    { greek: "λέγει", meaning: "speaks", note: "Verb." },
    { greek: "τὸ ὄνομα", meaning: "the name", note: "Object." }
  ],
  structure: "Question → Verb → Object",
  explanation: "τίς asks for the identity of the subject."
},

{
  id: "ch10-017",
  chapter: 10,
  greek: "οὐδεὶς ἐστὶν πιστός ἐν τῇ σαρκί.",
  translation: "No one is faithful in the flesh.",
  wordBreakdown: [
    { greek: "οὐδείς", meaning: "no one", note: "Negative subject." },
    { greek: "ἐστίν", meaning: "is", note: "Verb." },
    { greek: "πιστός", meaning: "faithful", note: "Adjective." },
    { greek: "ἐν τῇ σαρκί", meaning: "in the flesh", note: "Phrase." }
  ],
  structure: "Negative Subject → Verb → Adjective → Phrase",
  explanation: "οὐδείς makes the whole statement negative."
},

{
  id: "ch10-018",
  chapter: 10,
  greek: "τις ἐστὶν ἐν τῷ οἴκῳ.",
  translation: "Someone is in the house.",
  wordBreakdown: [
    { greek: "τις", meaning: "someone", note: "Indefinite subject." },
    { greek: "ἐστίν", meaning: "is", note: "Verb." },
    { greek: "ἐν τῷ οἴκῳ", meaning: "in the house", note: "Location." }
  ],
  structure: "Indefinite Subject → Verb → Phrase",
  explanation: "τις introduces an unspecified person."
},

{
  id: "ch10-019",
  chapter: 10,
  greek: "ὁ ἄνθρωπος ἐστὶν σῶμα καὶ σάρξ.",
  translation: "The man is body and flesh.",
  wordBreakdown: [
    { greek: "ὁ ἄνθρωπος", meaning: "the man", note: "Subject." },
    { greek: "ἐστίν", meaning: "is", note: "Verb." },
    { greek: "σῶμα καὶ σάρξ", meaning: "body and flesh", note: "Predicate." }
  ],
  structure: "Subject → Verb → Predicate + καί",
  explanation: "Two predicate nouns describe the subject."
},

{
  id: "ch10-020",
  chapter: 10,
  greek: "ὁ θεὸς ἐστὶν σὺν τοῖς ἁγίοις.",
  translation: "God is with the saints.",
  wordBreakdown: [
    { greek: "ὁ θεός", meaning: "God", note: "Subject." },
    { greek: "ἐστίν", meaning: "is", note: "Verb." },
    { greek: "σύν", meaning: "with", note: "Preposition." },
    { greek: "τοῖς ἁγίοις", meaning: "the saints", note: "Chapter 10 vocab." }
  ],
  structure: "Subject → Verb → σύν Phrase",
  explanation: "ἅγιοι can mean “holy ones,” often translated “saints.”"
},

{
  id: "ch11-001",
  chapter: 11,
  greek: "ὁ ἀδελφὸς ἐστιν ἐν τῇ ἐκκλησίᾳ.",
  translation: "The brother is in the church.",
  wordBreakdown: [
    { greek: "ὁ ἀδελφός", meaning: "the brother", note: "Chapter 11 noun." },
    { greek: "ἐστιν", meaning: "is", note: "Verb." },
    { greek: "ἐν τῇ ἐκκλησίᾳ", meaning: "in the church", note: "Chapter 11 noun with location." }
  ],
  structure: "Subject → Verb → Prepositional Phrase",
  explanation: "ἐκκλησία refers to an assembly or church, often used for believers."
},

{
  id: "ch11-002",
  chapter: 11,
  greek: "ὁ ἀνὴρ ἐστὶν μετὰ τοῦ πατρός.",
  translation: "The man is with the father.",
  wordBreakdown: [
    { greek: "ὁ ἀνήρ", meaning: "the man", note: "Chapter 11 noun." },
    { greek: "ἐστίν", meaning: "is", note: "Verb." },
    { greek: "μετὰ τοῦ πατρός", meaning: "with the father", note: "Chapter 11 noun." }
  ],
  structure: "Subject → Verb → μετά Phrase",
  explanation: "ἀνήρ often refers to a man in a more specific or formal sense than ἄνθρωπος."
},

{
  id: "ch11-003",
  chapter: 11,
  greek: "ἡ ἐκκλησία ἔχει πίστιν καὶ ἐλπίδα.",
  translation: "The church has faith and hope.",
  wordBreakdown: [
    { greek: "ἡ ἐκκλησία", meaning: "the church", note: "Subject." },
    { greek: "ἔχει", meaning: "has", note: "Verb." },
    { greek: "πίστιν", meaning: "faith", note: "Chapter 11 noun." },
    { greek: "καὶ ἐλπίδα", meaning: "and hope", note: "Chapter 11 noun." }
  ],
  structure: "Subject → Verb → Object + καί + Object",
  explanation: "πίστις and ἐλπίς are often paired ideas in NT thought."
},

{
  id: "ch11-004",
  chapter: 11,
  greek: "ὁ θεὸς ἐστὶν φῶς.",
  translation: "God is light.",
  wordBreakdown: [
    { greek: "ὁ θεός", meaning: "God", note: "Subject." },
    { greek: "ἐστίν", meaning: "is", note: "Verb." },
    { greek: "φῶς", meaning: "light", note: "Chapter 11 noun." }
  ],
  structure: "Subject → Verb → Predicate",
  explanation: "φῶς is used metaphorically for purity and truth."
},

{
  id: "ch11-005",
  chapter: 11,
  greek: "ἡ χάρις τοῦ θεοῦ ἐστὶν ἀγαθή.",
  translation: "The grace of God is good.",
  wordBreakdown: [
    { greek: "ἡ χάρις", meaning: "grace", note: "Chapter 11 noun." },
    { greek: "τοῦ θεοῦ", meaning: "of God", note: "Possession." },
    { greek: "ἐστίν", meaning: "is", note: "Verb." },
    { greek: "ἀγαθή", meaning: "good", note: "Adjective." }
  ],
  structure: "Subject → Possession → Verb → Adjective",
  explanation: "χάρις often refers to undeserved favor."
},

{
  id: "ch11-006",
  chapter: 11,
  greek: "ἰδοὺ ὁ ἀδελφός ἐστιν ὧδε.",
  translation: "Behold, the brother is here.",
  wordBreakdown: [
    { greek: "ἰδού", meaning: "behold", note: "Attention word." },
    { greek: "ὁ ἀδελφός", meaning: "the brother", note: "Subject." },
    { greek: "ἐστίν", meaning: "is", note: "Verb." },
    { greek: "ὧδε", meaning: "here", note: "Chapter 11 adverb." }
  ],
  structure: "Attention → Clause",
  explanation: "ἰδού draws attention to what follows."
},

{
  id: "ch11-007",
  chapter: 11,
  greek: "ὁ πατὴρ καὶ ἡ μήτηρ ἐστιν ἐν τῇ οἰκίᾳ.",
  translation: "The father and the mother are in the house.",
  wordBreakdown: [
    { greek: "ὁ πατήρ", meaning: "the father", note: "Chapter 11 noun." },
    { greek: "ἡ μήτηρ", meaning: "the mother", note: "Chapter 11 noun." }
  ],
  structure: "Subject + καί + Subject → Verb → Phrase",
  explanation: "Family terms are common and follow normal noun patterns."
},

{
  id: "ch11-008",
  chapter: 11,
  greek: "ὑμεῖς ἐστε ἐν τῇ ἐκκλησίᾳ.",
  translation: "You are in the church.",
  wordBreakdown: [
    { greek: "ὑμεῖς", meaning: "you (plural)", note: "Chapter 11 pronoun." },
    { greek: "ἐστε", meaning: "are", note: "Plural verb." },
    { greek: "ἐν τῇ ἐκκλησίᾳ", meaning: "in the church", note: "Location." }
  ],
  structure: "Subject → Verb → Phrase",
  explanation: "ὑμεῖς is plural “you,” unlike σύ (singular)."
},

{
  id: "ch11-009",
  chapter: 11,
  greek: "ἡμεῖς ἔχομεν πίστιν.",
  translation: "We have faith.",
  wordBreakdown: [
    { greek: "ἡμεῖς", meaning: "we", note: "Chapter 11 pronoun." },
    { greek: "ἔχομεν", meaning: "have", note: "Verb." },
    { greek: "πίστιν", meaning: "faith", note: "Object." }
  ],
  structure: "Subject → Verb → Object",
  explanation: "ἡμεῖς explicitly states “we,” though the verb already implies it."
},

{
  id: "ch11-010",
  chapter: 11,
  greek: "ὁ θεὸς ἔχει θέλημα.",
  translation: "God has a will.",
  wordBreakdown: [
    { greek: "ὁ θεός", meaning: "God", note: "Subject." },
    { greek: "θέλημα", meaning: "will/desire", note: "Chapter 11 noun." }
  ],
  structure: "Subject → Verb → Object",
  explanation: "θέλημα refers to intention or desire."
},

{
  id: "ch11-011",
  chapter: 11,
  greek: "ὁ λόγος ἐστὶν ἔξω.",
  translation: "The word is outside.",
  wordBreakdown: [
    { greek: "ὁ λόγος", meaning: "the word", note: "Subject." },
    { greek: "ἔξω", meaning: "outside", note: "Chapter 11 adverb." }
  ],
  structure: "Subject → Verb → Adverb",
  explanation: "ἔξω describes position outside something."
},

{
  id: "ch11-012",
  chapter: 11,
  greek: "ὁ Ἰησοῦς ἐστὶν ἐπὶ τοῦ ὕδατος.",
  translation: "Jesus is on the water.",
  wordBreakdown: [
    { greek: "ἐπί", meaning: "on", note: "Chapter 11 preposition." },
    { greek: "ὕδατος", meaning: "water", note: "Chapter 11 noun." }
  ],
  structure: "Subject → Verb → ἐπί Phrase",
  explanation: "ἐπί can mean “on” or “upon.”"
},

{
  id: "ch11-013",
  chapter: 11,
  greek: "οὐδὲ ὁ ἄνθρωπος πιστεύει.",
  translation: "Nor does the man believe.",
  wordBreakdown: [
    { greek: "οὐδέ", meaning: "nor/not even", note: "Chapter 11 connector." }
  ],
  structure: "Connector → Clause",
  explanation: "οὐδέ continues a negative idea."
},

{
  id: "ch11-014",
  chapter: 11,
  greek: "ὁ ἀδελφὸς ἐστὶν καλός.",
  translation: "The brother is good.",
  wordBreakdown: [
    { greek: "καλός", meaning: "good/beautiful", note: "Chapter 11 adjective." }
  ],
  structure: "Subject → Verb → Adjective",
  explanation: "καλός emphasizes goodness or beauty."
},

{
  id: "ch11-015",
  chapter: 11,
  greek: "ἴδε τὸ τέκνον.",
  translation: "See the child.",
  wordBreakdown: [
    { greek: "ἴδε", meaning: "see/behold", note: "Command form." }
  ],
  structure: "Command → Object",
  explanation: "ἴδε is an imperative, telling someone to look."
},

{
  id: "ch11-016",
  chapter: 11,
  greek: "ὁ θεὸς δίδωσι χάριν.",
  translation: "God gives grace.",
  wordBreakdown: [
    { greek: "δίδωσι", meaning: "gives", note: "Verb added for natural sentence." },
    { greek: "χάριν", meaning: "grace", note: "Object." }
  ],
  structure: "Subject → Verb → Object",
  explanation: "χάρις is often something given."
},

{
  id: "ch11-017",
  chapter: 11,
  greek: "ὁ πατὴρ καὶ ὁ υἱὸς ἐστιν ἕν.",
  translation: "The father and the son are one.",
  wordBreakdown: [
    { greek: "ἕν", meaning: "one", note: "Unity." }
  ],
  structure: "Subject + καί + Subject → Verb → Predicate",
  explanation: "ἕν emphasizes unity or oneness."
},

{
  id: "ch11-018",
  chapter: 11,
  greek: "ἡ ἐκκλησία ἐστὶν φῶς ἐν τῷ κόσμῳ.",
  translation: "The church is light in the world.",
  wordBreakdown: [
    { greek: "φῶς", meaning: "light", note: "Metaphor." }
  ],
  structure: "Subject → Verb → Predicate → Phrase",
  explanation: "φῶς is used symbolically for truth or purity."
},

{
  id: "ch11-019",
  chapter: 11,
  greek: "ὁ ἄνθρωπος ζῇ ἐπὶ τῇ πίστει.",
  translation: "The man lives by faith.",
  wordBreakdown: [
    { greek: "ἐπί", meaning: "on/by", note: "Basis." }
  ],
  structure: "Subject → Verb → ἐπί Phrase",
  explanation: "ἐπί can indicate basis: living on something."
},

{
  id: "ch11-020",
  chapter: 11,
  greek: "ὧδε ἐστιν ὁ κύριος.",
  translation: "Here is the Lord.",
  wordBreakdown: [
    { greek: "ὧδε", meaning: "here", note: "Location word." }
  ],
  structure: "Adverb → Verb → Subject",
  explanation: "ὧδε emphasizes location: “here.”"
},

{
  id: "ch12-001",
  chapter: 12,
  greek: "ὁ διδάσκαλος λέγει πρὸς τὸν μαθητήν.",
  translation: "The teacher speaks to the disciple.",
  wordBreakdown: [
    { greek: "ὁ διδάσκαλος", meaning: "the teacher", note: "Chapter 12 noun." },
    { greek: "λέγει", meaning: "speaks", note: "Verb." },
    { greek: "πρὸς τὸν μαθητήν", meaning: "to the disciple", note: "Direction phrase." }
  ],
  structure: "Subject → Verb → πρός Phrase",
  explanation: "πρός shows the direction of the speaking: toward the disciple."
},

{
  id: "ch12-002",
  chapter: 12,
  greek: "ὁ μαθητὴς ἀκούει τὸν διδάσκαλον.",
  translation: "The disciple hears the teacher.",
  wordBreakdown: [
    { greek: "ὁ μαθητής", meaning: "the disciple", note: "Subject." },
    { greek: "ἀκούει", meaning: "hears", note: "Verb." },
    { greek: "τὸν διδάσκαλον", meaning: "the teacher", note: "Object." }
  ],
  structure: "Subject → Verb → Object",
  explanation: "The disciple is doing the action, and the teacher receives the action."
},

{
  id: "ch12-003",
  chapter: 12,
  greek: "εὐθὺς ὁ μαθητὴς ἀκούει.",
  translation: "Immediately the disciple hears.",
  wordBreakdown: [
    { greek: "εὐθύς", meaning: "immediately", note: "Chapter 12 adverb." },
    { greek: "ὁ μαθητής", meaning: "the disciple", note: "Subject." },
    { greek: "ἀκούει", meaning: "hears", note: "Verb." }
  ],
  structure: "Adverb → Subject → Verb",
  explanation: "εὐθύς adds urgency by telling when the action happens."
},

{
  id: "ch12-004",
  chapter: 12,
  greek: "ὁ μαθητὴς πάλιν βλέπει τὸ φῶς.",
  translation: "The disciple sees the light again.",
  wordBreakdown: [
    { greek: "ὁ μαθητής", meaning: "the disciple", note: "Subject." },
    { greek: "πάλιν", meaning: "again", note: "Chapter 12 adverb." },
    { greek: "βλέπει τὸ φῶς", meaning: "sees the light", note: "Verb + object." }
  ],
  structure: "Subject → Adverb → Verb → Object",
  explanation: "πάλιν shows that the action is repeated."
},

{
  id: "ch12-005",
  chapter: 12,
  greek: "μηδεὶς λέγει λόγον.",
  translation: "No one speaks a word.",
  wordBreakdown: [
    { greek: "μηδείς", meaning: "no one", note: "Chapter 12 negative subject." },
    { greek: "λέγει", meaning: "speaks", note: "Verb." },
    { greek: "λόγον", meaning: "a word", note: "Object." }
  ],
  structure: "Negative Subject → Verb → Object",
  explanation: "μηδείς already contains the idea of negation: “no one.”"
},

{
  id: "ch12-006",
  chapter: 12,
  greek: "ὁ μαθητὴς μόνος ἐστὶν ἐν τῇ οἰκίᾳ.",
  translation: "The disciple alone is in the house.",
  wordBreakdown: [
    { greek: "ὁ μαθητής", meaning: "the disciple", note: "Subject." },
    { greek: "μόνος", meaning: "alone/only", note: "Chapter 12 adjective." },
    { greek: "ἐστὶν ἐν τῇ οἰκίᾳ", meaning: "is in the house", note: "Verb + location." }
  ],
  structure: "Subject → Modifier → Verb → Phrase",
  explanation: "μόνος emphasizes that the disciple is alone."
},

{
  id: "ch12-007",
  chapter: 12,
  greek: "ὁ διδάσκαλος λέγει ὅπως ὁ μαθητὴς πιστεύῃ.",
  translation: "The teacher speaks so that the disciple may believe.",
  wordBreakdown: [
    { greek: "ὁ διδάσκαλος λέγει", meaning: "the teacher speaks", note: "Main clause." },
    { greek: "ὅπως", meaning: "so that", note: "Chapter 12 purpose word." },
    { greek: "ὁ μαθητὴς πιστεύῃ", meaning: "the disciple may believe", note: "Purpose clause." }
  ],
  structure: "Main Clause → ὅπως Clause",
  explanation: "ὅπως can introduce purpose, similar to ἵνα."
},

{
  id: "ch12-008",
  chapter: 12,
  greek: "οὖν ὁ μαθητὴς ἀκούει.",
  translation: "Therefore the disciple hears.",
  wordBreakdown: [
    { greek: "οὖν", meaning: "therefore/then", note: "Chapter 12 connector." },
    { greek: "ὁ μαθητής", meaning: "the disciple", note: "Subject." },
    { greek: "ἀκούει", meaning: "hears", note: "Verb." }
  ],
  structure: "Connector → Clause",
  explanation: "οὖν connects this sentence as a result or conclusion."
},

{
  id: "ch12-009",
  chapter: 12,
  greek: "ὁ ὀφθαλμὸς βλέπει τὸ φῶς.",
  translation: "The eye sees the light.",
  wordBreakdown: [
    { greek: "ὁ ὀφθαλμός", meaning: "the eye", note: "Chapter 12 noun." },
    { greek: "βλέπει", meaning: "sees", note: "Verb." },
    { greek: "τὸ φῶς", meaning: "the light", note: "Object." }
  ],
  structure: "Subject → Verb → Object",
  explanation: "ὀφθαλμός names the organ of sight, so it naturally pairs with seeing."
},

{
  id: "ch12-010",
  chapter: 12,
  greek: "ὁ πούς ἐστιν ἐπὶ τῆς ὁδοῦ.",
  translation: "The foot is on the road.",
  wordBreakdown: [
    { greek: "ὁ πούς", meaning: "the foot", note: "Chapter 12 noun." },
    { greek: "ἐστιν", meaning: "is", note: "Verb." },
    { greek: "ἐπὶ τῆς ὁδοῦ", meaning: "on the road", note: "Location phrase." }
  ],
  structure: "Subject → Verb → ἐπί Phrase",
  explanation: "ἐπί can show location: on or upon something."
},

{
  id: "ch12-011",
  chapter: 12,
  greek: "ὁ Ἰησοῦς λέγει ὑπὲρ τοῦ κόσμου.",
  translation: "Jesus speaks on behalf of the world.",
  wordBreakdown: [
    { greek: "ὁ Ἰησοῦς", meaning: "Jesus", note: "Subject." },
    { greek: "λέγει", meaning: "speaks", note: "Verb." },
    { greek: "ὑπὲρ τοῦ κόσμου", meaning: "on behalf of the world", note: "Chapter 12 prepositional phrase." }
  ],
  structure: "Subject → Verb → ὑπέρ Phrase",
  explanation: "ὑπέρ often means “on behalf of” or “for the sake of.”"
},

{
  id: "ch12-012",
  chapter: 12,
  greek: "ἕως τῆς ὥρας ὁ μαθητὴς μένει.",
  translation: "Until the hour, the disciple remains.",
  wordBreakdown: [
    { greek: "ἕως τῆς ὥρας", meaning: "until the hour", note: "Time phrase." },
    { greek: "ὁ μαθητής", meaning: "the disciple", note: "Subject." },
    { greek: "μένει", meaning: "remains", note: "Helper verb added for a natural sentence." }
  ],
  structure: "Time Phrase → Subject → Verb",
  explanation: "ἕως marks the endpoint of time: until something."
},

{
  id: "ch12-013",
  chapter: 12,
  greek: "ὅσοι μαθηταὶ ἀκούουσιν, πιστεύουσιν.",
  translation: "As many disciples as hear, believe.",
  wordBreakdown: [
    { greek: "ὅσοι μαθηταί", meaning: "as many disciples as", note: "Chapter 12 word with plural noun." },
    { greek: "ἀκούουσιν", meaning: "hear", note: "Verb." },
    { greek: "πιστεύουσιν", meaning: "believe", note: "Resulting action." }
  ],
  structure: "ὅσος Clause → Main Verb",
  explanation: "ὅσος can describe quantity: as many as."
},

{
  id: "ch12-014",
  chapter: 12,
  greek: "ὁ μαθητὴς μὲν ἀκούει, ὁ διδάσκαλος δὲ λέγει.",
  translation: "On the one hand, the disciple hears, but the teacher speaks.",
  wordBreakdown: [
    { greek: "μέν", meaning: "on the one hand", note: "Chapter 12 connector." },
    { greek: "δέ", meaning: "but/and", note: "Balancing connector." },
    { greek: "ὁ μαθητής / ὁ διδάσκαλος", meaning: "the disciple / the teacher", note: "Contrasted subjects." }
  ],
  structure: "Clause μέν → Clause δέ",
  explanation: "μέν often sets up a contrast or balance that δέ completes."
},

{
  id: "ch12-015",
  chapter: 12,
  greek: "ὁ διδάσκαλος πάλιν λέγει παραβολήν.",
  translation: "The teacher again speaks a parable.",
  wordBreakdown: [
    { greek: "ὁ διδάσκαλος", meaning: "the teacher", note: "Subject." },
    { greek: "πάλιν", meaning: "again", note: "Repeated action." },
    { greek: "λέγει παραβολήν", meaning: "speaks a parable", note: "Verb + object." }
  ],
  structure: "Subject → Adverb → Verb → Object",
  explanation: "πάλιν marks repetition of the speaking action."
},

{
  id: "ch12-016",
  chapter: 12,
  greek: "ὁ μαθητὴς ἐστὶν μόνος, ἀλλὰ ὁ κύριος ἐστὶν μετ᾽ αὐτοῦ.",
  translation: "The disciple is alone, but the Lord is with him.",
  wordBreakdown: [
    { greek: "ὁ μαθητής", meaning: "the disciple", note: "Subject 1." },
    { greek: "μόνος", meaning: "alone", note: "Chapter 12 adjective." },
    { greek: "ἀλλά", meaning: "but", note: "Contrast word." },
    { greek: "μετ᾽ αὐτοῦ", meaning: "with him", note: "Companionship phrase." }
  ],
  structure: "Clause + ἀλλά + Clause",
  explanation: "ἀλλά creates contrast between being alone and the Lord being with him."
},

{
  id: "ch12-017",
  chapter: 12,
  greek: "ὁ διδάσκαλος ἐστὶν ὑπὲρ τῶν μαθητῶν.",
  translation: "The teacher is on behalf of the disciples.",
  wordBreakdown: [
    { greek: "ὁ διδάσκαλος", meaning: "the teacher", note: "Subject." },
    { greek: "ὑπὲρ τῶν μαθητῶν", meaning: "on behalf of the disciples", note: "Chapter 12 phrase." }
  ],
  structure: "Subject → Verb → ὑπέρ Phrase",
  explanation: "ὑπέρ shows someone acting or standing for others."
},

{
  id: "ch12-018",
  chapter: 12,
  greek: "μηδεὶς ἐστὶν μόνος ἐν τῇ ἐκκλησίᾳ.",
  translation: "No one is alone in the church.",
  wordBreakdown: [
    { greek: "μηδείς", meaning: "no one", note: "Chapter 12 negative subject." },
    { greek: "μόνος", meaning: "alone", note: "Chapter 12 adjective." },
    { greek: "ἐν τῇ ἐκκλησίᾳ", meaning: "in the church", note: "Location phrase." }
  ],
  structure: "Negative Subject → Verb → Adjective → Phrase",
  explanation: "μηδείς makes the whole statement negative: no one."
},

{
  id: "ch12-019",
  chapter: 12,
  greek: "ὁ αἰὼν οὗτος οὐκ ἐστιν αἰώνιος.",
  translation: "This age is not eternal.",
  wordBreakdown: [
    { greek: "ὁ αἰών", meaning: "the age", note: "Chapter 12 noun." },
    { greek: "οὗτος", meaning: "this", note: "Demonstrative." },
    { greek: "οὐκ ἐστιν", meaning: "is not", note: "Negative verb." },
    { greek: "αἰώνιος", meaning: "eternal", note: "Adjective from earlier vocab." }
  ],
  structure: "Subject → Negative Verb → Adjective",
  explanation: "αἰών is a noun meaning age, while αἰώνιος describes something as eternal."
},

{
  id: "ch12-020",
  chapter: 12,
  greek: "οὖν ὁ διδάσκαλος λέγει ὅπως ὁ μαθητὴς βλέπῃ τὸ φῶς.",
  translation: "Therefore the teacher speaks so that the disciple may see the light.",
  wordBreakdown: [
    { greek: "οὖν", meaning: "therefore", note: "Connector." },
    { greek: "ὁ διδάσκαλος λέγει", meaning: "the teacher speaks", note: "Main clause." },
    { greek: "ὅπως", meaning: "so that", note: "Purpose word." },
    { greek: "ὁ μαθητὴς βλέπῃ τὸ φῶς", meaning: "the disciple may see the light", note: "Purpose clause." }
  ],
  structure: "οὖν + Main Clause → ὅπως Clause",
  explanation: "ὅπως introduces the purpose of the teacher’s speaking."
},

{
  id: "ch13-001",
  chapter: 13,
  greek: "ἡ γυνὴ ἐστὶν ἐν τῇ πόλει.",
  translation: "The woman is in the city.",
  wordBreakdown: [
    { greek: "ἡ γυνή", meaning: "the woman", note: "Chapter 13 noun." },
    { greek: "ἐστίν", meaning: "is", note: "Verb." },
    { greek: "ἐν τῇ πόλει", meaning: "in the city", note: "Chapter 13 noun." }
  ],
  structure: "Subject → Verb → Prepositional Phrase",
  explanation: "πόλις refers to a city, often used in narrative settings."
},

{
  id: "ch13-002",
  chapter: 13,
  greek: "ἡ δικαιοσύνη ἐστὶν ἀγαθή.",
  translation: "Righteousness is good.",
  wordBreakdown: [
    { greek: "ἡ δικαιοσύνη", meaning: "righteousness", note: "Chapter 13 noun." },
    { greek: "ἐστίν", meaning: "is", note: "Verb." },
    { greek: "ἀγαθή", meaning: "good", note: "Adjective." }
  ],
  structure: "Subject → Verb → Adjective",
  explanation: "δικαιοσύνη refers to rightness or moral goodness."
},

{
  id: "ch13-003",
  chapter: 13,
  greek: "οἱ δώδεκα μαθηταὶ εἰσίν.",
  translation: "The twelve disciples are.",
  wordBreakdown: [
    { greek: "οἱ δώδεκα μαθηταί", meaning: "the twelve disciples", note: "Chapter 13 number with noun." },
    { greek: "εἰσίν", meaning: "are", note: "Plural verb." }
  ],
  structure: "Subject → Verb",
  explanation: "δώδεκα is an indeclinable number meaning twelve."
},

{
  id: "ch13-004",
  chapter: 13,
  greek: "ὁ ἄνθρωπος βλέπει ἑαυτοῦ σῶμα.",
  translation: "The man sees his own body.",
  wordBreakdown: [
    { greek: "ὁ ἄνθρωπος", meaning: "the man", note: "Subject." },
    { greek: "βλέπει", meaning: "sees", note: "Verb." },
    { greek: "ἑαυτοῦ", meaning: "of himself", note: "Chapter 13 reflexive." },
    { greek: "σῶμα", meaning: "body", note: "Object." }
  ],
  structure: "Subject → Verb → Reflexive Phrase",
  explanation: "ἑαυτοῦ refers back to the subject: his own."
},

{
  id: "ch13-005",
  chapter: 13,
  greek: "ἐκεῖνος ἐστιν ὁ κύριος.",
  translation: "That one is the Lord.",
  wordBreakdown: [
    { greek: "ἐκεῖνος", meaning: "that one", note: "Chapter 13 demonstrative." },
    { greek: "ἐστιν", meaning: "is", note: "Verb." },
    { greek: "ὁ κύριος", meaning: "the Lord", note: "Predicate." }
  ],
  structure: "Subject → Verb → Predicate",
  explanation: "ἐκεῖνος points to something more distant: “that one.”"
},

{
  id: "ch13-006",
  chapter: 13,
  greek: "ὁ θεὸς ἢ ὁ κόσμος ἐστὶν πονηρός.",
  translation: "Either God or the world is evil.",
  wordBreakdown: [
    { greek: "ἤ", meaning: "or", note: "Chapter 13 connector." },
    { greek: "ὁ θεός / ὁ κόσμος", meaning: "God / the world", note: "Options." }
  ],
  structure: "Subject ἢ Subject → Verb → Predicate",
  explanation: "ἤ presents alternatives: either/or."
},

{
  id: "ch13-007",
  chapter: 13,
  greek: "κἀγὼ λέγω λόγον.",
  translation: "And I speak a word.",
  wordBreakdown: [
    { greek: "κἀγώ", meaning: "and I", note: "Chapter 13 combined form." },
    { greek: "λέγω", meaning: "speak", note: "Verb." },
    { greek: "λόγον", meaning: "word", note: "Object." }
  ],
  structure: "Subject → Verb → Object",
  explanation: "κἀγώ combines καί + ἐγώ for emphasis: “and I.”"
},

{
  id: "ch13-008",
  chapter: 13,
  greek: "μακάριος ὁ ἄνθρωπος ὁ πιστεύων.",
  translation: "Blessed is the man who believes.",
  wordBreakdown: [
    { greek: "μακάριος", meaning: "blessed", note: "Chapter 13 adjective." },
    { greek: "ὁ ἄνθρωπος", meaning: "the man", note: "Subject." },
    { greek: "ὁ πιστεύων", meaning: "the one believing", note: "Descriptive participle." }
  ],
  structure: "Adjective → Subject → Description",
  explanation: "μακάριος often begins statements of blessing."
},

{
  id: "ch13-009",
  chapter: 13,
  greek: "ὁ θεὸς ἐστιν μέγας.",
  translation: "God is great.",
  wordBreakdown: [
    { greek: "μέγας", meaning: "great", note: "Chapter 13 adjective." }
  ],
  structure: "Subject → Verb → Adjective",
  explanation: "μέγας emphasizes greatness or importance."
},

{
  id: "ch13-010",
  chapter: 13,
  greek: "ἡ πόλις ἐστὶν μεγάλη.",
  translation: "The city is large.",
  wordBreakdown: [
    { greek: "ἡ πόλις", meaning: "the city", note: "Subject." },
    { greek: "μεγάλη", meaning: "large", note: "Adjective form agreeing with πόλις." }
  ],
  structure: "Subject → Verb → Adjective",
  explanation: "Adjectives change form to match the noun."
},

{
  id: "ch13-011",
  chapter: 13,
  greek: "πολλοὶ ἄνθρωποι ἐν τῇ πόλει εἰσίν.",
  translation: "Many people are in the city.",
  wordBreakdown: [
    { greek: "πολλοί", meaning: "many", note: "Chapter 13 adjective." },
    { greek: "ἄνθρωποι", meaning: "people", note: "Subject." }
  ],
  structure: "Quantity → Subject → Verb → Phrase",
  explanation: "πολύς expresses quantity: many or much."
},

{
  id: "ch13-012",
  chapter: 13,
  greek: "πῶς ὁ ἄνθρωπος βλέπει;",
  translation: "How does the man see?",
  wordBreakdown: [
    { greek: "πῶς", meaning: "how?", note: "Chapter 13 question word." }
  ],
  structure: "Question Word → Clause",
  explanation: "πῶς asks about the manner of something."
},

{
  id: "ch13-013",
  chapter: 13,
  greek: "ὁ Ἰησοῦς ποιεῖ σημεῖον.",
  translation: "Jesus does a sign (miracle).",
  wordBreakdown: [
    { greek: "σημεῖον", meaning: "sign/miracle", note: "Chapter 13 noun." }
  ],
  structure: "Subject → Verb → Object",
  explanation: "σημεῖον often refers to a miracle that points to something."
},

{
  id: "ch13-014",
  chapter: 13,
  greek: "ὁ ἄνθρωπος ἀγαπᾷ ἑαυτόν.",
  translation: "The man loves himself.",
  wordBreakdown: [
    { greek: "ἑαυτόν", meaning: "himself", note: "Reflexive form." }
  ],
  structure: "Subject → Verb → Reflexive Object",
  explanation: "Reflexive pronouns show the action returns to the subject."
},

{
  id: "ch13-015",
  chapter: 13,
  greek: "ἡ γυνὴ ἐστὶν μακαρία.",
  translation: "The woman is blessed.",
  wordBreakdown: [
    { greek: "μακαρία", meaning: "blessed", note: "Adjective form." }
  ],
  structure: "Subject → Verb → Adjective",
  explanation: "μακάριος changes form to match the noun."
},

{
  id: "ch13-016",
  chapter: 13,
  greek: "ἐκεῖνοι εἰσὶν μαθηταί.",
  translation: "Those are disciples.",
  wordBreakdown: [
    { greek: "ἐκεῖνοι", meaning: "those", note: "Plural demonstrative." }
  ],
  structure: "Subject → Verb → Predicate",
  explanation: "ἐκεῖνος in plural refers to “those.”"
},

{
  id: "ch13-017",
  chapter: 13,
  greek: "ὁ θεὸς ἢ ὁ ἄνθρωπος λέγει.",
  translation: "Either God or the man speaks.",
  wordBreakdown: [
    { greek: "ἤ", meaning: "or", note: "Alternative." }
  ],
  structure: "Subject ἢ Subject → Verb",
  explanation: "ἤ sets up two possible subjects."
},

{
  id: "ch13-018",
  chapter: 13,
  greek: "ὁ κόσμος ἐστὶν πολύς.",
  translation: "The world is great/many.",
  wordBreakdown: [
    { greek: "πολύς", meaning: "much/many", note: "Descriptive." }
  ],
  structure: "Subject → Verb → Adjective",
  explanation: "πολύς can describe size or amount depending on context."
},

{
  id: "ch13-019",
  chapter: 13,
  greek: "κἀγὼ ἀκούω τὸν λόγον.",
  translation: "And I hear the word.",
  wordBreakdown: [
    { greek: "κἀγώ", meaning: "and I", note: "Emphatic subject." }
  ],
  structure: "Subject → Verb → Object",
  explanation: "κἀγώ emphasizes the speaker: “I also.”"
},

{
  id: "ch13-020",
  chapter: 13,
  greek: "μακάριοι οἱ πιστεύοντες καὶ ἀκούοντες.",
  translation: "Blessed are those who believe and hear.",
  wordBreakdown: [
    { greek: "μακάριοι", meaning: "blessed", note: "Plural form." },
    { greek: "οἱ πιστεύοντες", meaning: "those believing", note: "Group." },
    { greek: "καὶ ἀκούοντες", meaning: "and hearing", note: "Second action." }
  ],
  structure: "Adjective → Group → Actions",
  explanation: "Plural participles describe a group by what they do."
},

{
  id: "ch14-001",
  chapter: 14,
  greek: "ἡ ἀλήθεια ἐστὶν ἐν τῷ λόγῳ.",
  translation: "The truth is in the word.",
  wordBreakdown: [
    { greek: "ἡ ἀλήθεια", meaning: "the truth", note: "Chapter 14 noun." },
    { greek: "ἐστίν", meaning: "is", note: "Verb." },
    { greek: "ἐν τῷ λόγῳ", meaning: "in the word", note: "Location phrase." }
  ],
  structure: "Subject → Verb → Prepositional Phrase",
  explanation: "ἀλήθεια refers to truth as something real and revealed."
},

{
  id: "ch14-002",
  chapter: 14,
  greek: "ἡ εἰρήνη τοῦ θεοῦ ἐστὶν ἀγαθή.",
  translation: "The peace of God is good.",
  wordBreakdown: [
    { greek: "ἡ εἰρήνη", meaning: "peace", note: "Chapter 14 noun." },
    { greek: "τοῦ θεοῦ", meaning: "of God", note: "Possession." },
    { greek: "ἐστίν", meaning: "is", note: "Verb." },
    { greek: "ἀγαθή", meaning: "good", note: "Adjective." }
  ],
  structure: "Subject → Possession → Verb → Adjective",
  explanation: "εἰρήνη often refers to inner or relational peace."
},

{
  id: "ch14-003",
  chapter: 14,
  greek: "ὁ ἄνθρωπος ἐστὶν ἐνώπιον τοῦ θεοῦ.",
  translation: "The man is before God.",
  wordBreakdown: [
    { greek: "ἐνώπιον", meaning: "before/in the presence of", note: "Chapter 14 preposition." },
    { greek: "τοῦ θεοῦ", meaning: "God", note: "Object." }
  ],
  structure: "Subject → Verb → ἐνώπιον Phrase",
  explanation: "ἐνώπιον emphasizes being in someone’s presence."
},

{
  id: "ch14-004",
  chapter: 14,
  greek: "ἡ ἐπαγγελία ἐστὶν ἀληθής.",
  translation: "The promise is true.",
  wordBreakdown: [
    { greek: "ἡ ἐπαγγελία", meaning: "the promise", note: "Chapter 14 noun." },
    { greek: "ἀληθής", meaning: "true", note: "Descriptive adjective." }
  ],
  structure: "Subject → Verb → Adjective",
  explanation: "ἐπαγγελία refers to something promised, often by God."
},

{
  id: "ch14-005",
  chapter: 14,
  greek: "ἑπτὰ μαθηταὶ εἰσὶν ἐν τῇ πόλει.",
  translation: "Seven disciples are in the city.",
  wordBreakdown: [
    { greek: "ἑπτά", meaning: "seven", note: "Chapter 14 number." },
    { greek: "μαθηταί", meaning: "disciples", note: "Subject." }
  ],
  structure: "Number → Subject → Verb → Phrase",
  explanation: "Numbers like ἑπτά do not change form."
},

{
  id: "ch14-006",
  chapter: 14,
  greek: "ὁ θρόνος ἐστὶν ἐν τῷ οὐρανῷ.",
  translation: "The throne is in heaven.",
  wordBreakdown: [
    { greek: "ὁ θρόνος", meaning: "the throne", note: "Chapter 14 noun." },
    { greek: "ἐν τῷ οὐρανῷ", meaning: "in heaven", note: "Location." }
  ],
  structure: "Subject → Verb → Phrase",
  explanation: "θρόνος often symbolizes authority or rule."
},

{
  id: "ch14-007",
  chapter: 14,
  greek: "ἡ Ἰερουσαλὴμ ἐστὶν μεγάλη.",
  translation: "Jerusalem is great.",
  wordBreakdown: [
    { greek: "ἡ Ἰερουσαλήμ", meaning: "Jerusalem", note: "Chapter 14 proper noun." }
  ],
  structure: "Subject → Verb → Adjective",
  explanation: "Ἰερουσαλήμ is a key location in NT narrative."
},

{
  id: "ch14-008",
  chapter: 14,
  greek: "ὁ ἄνθρωπος λέγει κατὰ τοῦ λόγου.",
  translation: "The man speaks against the word.",
  wordBreakdown: [
    { greek: "κατά", meaning: "against", note: "Chapter 14 preposition." },
    { greek: "τοῦ λόγου", meaning: "the word", note: "Object." }
  ],
  structure: "Subject → Verb → κατά Phrase",
  explanation: "κατά can mean “against” depending on context."
},

{
  id: "ch14-009",
  chapter: 14,
  greek: "ἡ κεφαλὴ ἐστὶν ἐπὶ τοῦ σώματος.",
  translation: "The head is on the body.",
  wordBreakdown: [
    { greek: "ἡ κεφαλή", meaning: "the head", note: "Chapter 14 noun." },
    { greek: "τοῦ σώματος", meaning: "the body", note: "Object." }
  ],
  structure: "Subject → Verb → Phrase",
  explanation: "κεφαλή often also carries symbolic meaning (authority)."
},

{
  id: "ch14-010",
  chapter: 14,
  greek: "ὁ Ἰησοῦς ἐστιν ἡ ὁδός.",
  translation: "Jesus is the way.",
  wordBreakdown: [
    { greek: "ἡ ὁδός", meaning: "the way", note: "Chapter 14 noun." }
  ],
  structure: "Subject → Verb → Predicate",
  explanation: "ὁδός can refer to a literal road or a way of life."
},

{
  id: "ch14-011",
  chapter: 14,
  greek: "ὁ ἄνθρωπος ὅς πιστεύει ἔχει ζωήν.",
  translation: "The man who believes has life.",
  wordBreakdown: [
    { greek: "ὅς", meaning: "who", note: "Chapter 14 relative pronoun." }
  ],
  structure: "Subject → ὅς Clause → Verb",
  explanation: "ὅς introduces a relative clause describing the subject."
},

{
  id: "ch14-012",
  chapter: 14,
  greek: "ὅτε ὁ Ἰησοῦς λέγει, ὁ ὄχλος ἀκούει.",
  translation: "When Jesus speaks, the crowd hears.",
  wordBreakdown: [
    { greek: "ὅτε", meaning: "when", note: "Chapter 14 time word." }
  ],
  structure: "ὅτε Clause → Main Clause",
  explanation: "ὅτε introduces a time clause."
},

{
  id: "ch14-013",
  chapter: 14,
  greek: "οὕτως ὁ θεὸς ἀγαπᾷ τὸν κόσμον.",
  translation: "In this way God loves the world.",
  wordBreakdown: [
    { greek: "οὕτως", meaning: "thus/in this way", note: "Chapter 14 adverb." }
  ],
  structure: "Adverb → Subject → Verb → Object",
  explanation: "οὕτως explains how something is done."
},

{
  id: "ch14-014",
  chapter: 14,
  greek: "τὸ πλοῖον ἐστὶν ἐν τῇ θαλάσσῃ.",
  translation: "The boat is in the sea.",
  wordBreakdown: [
    { greek: "τὸ πλοῖον", meaning: "the boat", note: "Chapter 14 noun." },
    { greek: "τῇ θαλάσσῃ", meaning: "the sea", note: "Location." }
  ],
  structure: "Subject → Verb → Phrase",
  explanation: "πλοῖον is often used in gospel narratives."
},

{
  id: "ch14-015",
  chapter: 14,
  greek: "ὁ θεὸς λέγει ῥῆμα.",
  translation: "God speaks a word (saying).",
  wordBreakdown: [
    { greek: "ῥῆμα", meaning: "word/saying", note: "Chapter 14 noun." }
  ],
  structure: "Subject → Verb → Object",
  explanation: "ῥῆμα often emphasizes a spoken word."
},

{
  id: "ch14-016",
  chapter: 14,
  greek: "ὁ πατὴρ τε καὶ ὁ υἱὸς ἐστιν ἕν.",
  translation: "The father and the son are one.",
  wordBreakdown: [
    { greek: "τε καί", meaning: "both...and", note: "Chapter 14 connector." }
  ],
  structure: "Subject τε καί Subject → Verb → Predicate",
  explanation: "τε...καί links two items closely together."
},

{
  id: "ch14-017",
  chapter: 14,
  greek: "ἡ χεὶρ ἐστὶν ἐπὶ τῆς κεφαλῆς.",
  translation: "The hand is on the head.",
  wordBreakdown: [
    { greek: "ἡ χείρ", meaning: "the hand", note: "Chapter 14 noun." }
  ],
  structure: "Subject → Verb → Phrase",
  explanation: "χείρ refers to hand or arm."
},

{
  id: "ch14-018",
  chapter: 14,
  greek: "ἡ ψυχὴ ἐστὶν ἐν τῷ σώματι.",
  translation: "The soul is in the body.",
  wordBreakdown: [
    { greek: "ἡ ψυχή", meaning: "the soul/life", note: "Chapter 14 noun." }
  ],
  structure: "Subject → Verb → Phrase",
  explanation: "ψυχή refers to life, self, or soul."
},

{
  id: "ch14-019",
  chapter: 14,
  greek: "ὁ ἄνθρωπος ὅς βλέπει τὸ φῶς πιστεύει.",
  translation: "The man who sees the light believes.",
  wordBreakdown: [
    { greek: "ὅς", meaning: "who", note: "Relative clause marker." }
  ],
  structure: "Subject → ὅς Clause → Verb",
  explanation: "The relative clause adds detail about the subject."
},

{
  id: "ch14-020",
  chapter: 14,
  greek: "ὅτε ὁ θεὸς λέγει, οὕτως ἐστιν.",
  translation: "When God speaks, it is so.",
  wordBreakdown: [
    { greek: "ὅτε", meaning: "when", note: "Time clause marker." },
    { greek: "ὁ θεὸς λέγει", meaning: "God speaks", note: "Clause." },
    { greek: "οὕτως", meaning: "thus/in this way", note: "Chapter 14 adverb." },
    { greek: "ἐστιν", meaning: "is", note: "Helper verb." }
  ],
  structure: "ὅτε Clause → Result Clause",
  explanation: "οὕτως shows the manner/result: what God says is so."
},

{
  id: "ch16-001",
  chapter: 16,
  greek: "ὁ ἄνθρωπος ἀκούει τὸν λόγον.",
  translation: "The man hears the word.",
  wordBreakdown: [
    { greek: "ὁ ἄνθρωπος", meaning: "the man", note: "Subject." },
    { greek: "ἀκούει", meaning: "hears", note: "Chapter 16 verb." },
    { greek: "τὸν λόγον", meaning: "the word", note: "Object." }
  ],
  structure: "Subject → Verb → Object",
  explanation: "ἀκούω can mean hear, listen, or even obey depending on context."
},

{
  id: "ch16-002",
  chapter: 16,
  greek: "ὁ μαθητὴς βλέπει τὸ φῶς.",
  translation: "The disciple sees the light.",
  wordBreakdown: [
    { greek: "βλέπει", meaning: "sees", note: "Chapter 16 verb." }
  ],
  structure: "Subject → Verb → Object",
  explanation: "βλέπω refers to physical sight or perception."
},

{
  id: "ch16-003",
  chapter: 16,
  greek: "ὁ ἄνθρωπος ἔχει ζωήν.",
  translation: "The man has life.",
  wordBreakdown: [
    { greek: "ἔχει", meaning: "has", note: "Chapter 16 verb." }
  ],
  structure: "Subject → Verb → Object",
  explanation: "ἔχω is one of the most common verbs: to have or possess."
},

{
  id: "ch16-004",
  chapter: 16,
  greek: "ὁ θεὸς λύει τὸν ἄνθρωπον.",
  translation: "God sets the man free.",
  wordBreakdown: [
    { greek: "λύει", meaning: "sets free/loosens", note: "Chapter 16 verb." }
  ],
  structure: "Subject → Verb → Object",
  explanation: "λύω can mean to loose, release, or set free."
},

{
  id: "ch16-005",
  chapter: 16,
  greek: "ὁ νόμος ἐστὶν ἀγαθός.",
  translation: "The law is good.",
  wordBreakdown: [
    { greek: "ὁ νόμος", meaning: "the law", note: "Chapter 16 noun." }
  ],
  structure: "Subject → Verb → Adjective",
  explanation: "νόμος refers to law or guiding principle."
},

{
  id: "ch16-006",
  chapter: 16,
  greek: "ὅπου ὁ θεὸς ἐστίν, ἐκεῖ ἐστὶν ζωή.",
  translation: "Where God is, there is life.",
  wordBreakdown: [
    { greek: "ὅπου", meaning: "where", note: "Chapter 16 connector." },
    { greek: "ἐκεῖ", meaning: "there", note: "Location counterpart." }
  ],
  structure: "ὅπου Clause → Result Clause",
  explanation: "ὅπου introduces a location-based clause: where something happens."
},

{
  id: "ch16-007",
  chapter: 16,
  greek: "ὁ ἄνθρωπος πιστεύει τῷ θεῷ.",
  translation: "The man believes God.",
  wordBreakdown: [
    { greek: "πιστεύει", meaning: "believes", note: "Chapter 16 verb." }
  ],
  structure: "Subject → Verb → Object",
  explanation: "πιστεύω expresses trust or belief directed toward someone."
},

{
  id: "ch16-008",
  chapter: 16,
  greek: "τὸ πρόσωπον τοῦ ἀνθρώπου ἐστὶν καλόν.",
  translation: "The face of the man is good.",
  wordBreakdown: [
    { greek: "τὸ πρόσωπον", meaning: "the face", note: "Chapter 16 noun." }
  ],
  structure: "Subject → Possession → Verb → Adjective",
  explanation: "πρόσωπον refers to face or outward appearance."
},

{
  id: "ch16-009",
  chapter: 16,
  greek: "τότε ὁ μαθητὴς πιστεύει.",
  translation: "Then the disciple believes.",
  wordBreakdown: [
    { greek: "τότε", meaning: "then", note: "Chapter 16 time word." }
  ],
  structure: "Adverb → Subject → Verb",
  explanation: "τότε marks sequence: what happens next."
},

{
  id: "ch16-010",
  chapter: 16,
  greek: "ὁ τυφλὸς βλέπει τὸ φῶς.",
  translation: "The blind man sees the light.",
  wordBreakdown: [
    { greek: "ὁ τυφλός", meaning: "the blind man", note: "Chapter 16 adjective used as noun." }
  ],
  structure: "Subject → Verb → Object",
  explanation: "τυφλός can function as “blind person.”"
},

{
  id: "ch16-011",
  chapter: 16,
  greek: "ἡ χαρὰ ἐστὶν ἐν τῇ καρδίᾳ.",
  translation: "Joy is in the heart.",
  wordBreakdown: [
    { greek: "ἡ χαρά", meaning: "joy", note: "Chapter 16 noun." }
  ],
  structure: "Subject → Verb → Phrase",
  explanation: "χαρά expresses inner joy or delight."
},

{
  id: "ch16-012",
  chapter: 16,
  greek: "ὁ ἄνθρωπος ἀκούει καὶ πιστεύει.",
  translation: "The man hears and believes.",
  wordBreakdown: [
    { greek: "ἀκούει / πιστεύει", meaning: "hears / believes", note: "Two Chapter 16 verbs." }
  ],
  structure: "Subject → Verb + καί + Verb",
  explanation: "καί connects two actions performed by the same subject."
},

{
  id: "ch16-013",
  chapter: 16,
  greek: "ὁ μαθητὴς βλέπει καὶ ἔχει χαράν.",
  translation: "The disciple sees and has joy.",
  wordBreakdown: [
    { greek: "βλέπει", meaning: "sees", note: "Verb." },
    { greek: "ἔχει χαράν", meaning: "has joy", note: "Second action." }
  ],
  structure: "Subject → Verb + καί + Verb + Object",
  explanation: "Combines perception (seeing) with result (joy)."
},

{
  id: "ch16-014",
  chapter: 16,
  greek: "ὅπου ὁ μαθητὴς ἀκούει, ἐκεῖ πιστεύει.",
  translation: "Where the disciple hears, there he believes.",
  wordBreakdown: [
    { greek: "ὅπου", meaning: "where", note: "Location clause." },
    { greek: "ἐκεῖ", meaning: "there", note: "Corresponding result." }
  ],
  structure: "ὅπου Clause → Result Clause",
  explanation: "Links place with resulting action."
},

{
  id: "ch16-015",
  chapter: 16,
  greek: "ὁ θεὸς ἔχει νόμον καὶ χάριν.",
  translation: "God has law and grace.",
  wordBreakdown: [
    { greek: "νόμον", meaning: "law", note: "Chapter 16 noun." },
    { greek: "χάριν", meaning: "grace", note: "Earlier vocab." }
  ],
  structure: "Subject → Verb → Object + καί + Object",
  explanation: "Combines two key theological ideas."
},

{
  id: "ch16-016",
  chapter: 16,
  greek: "ὁ ἄνθρωπος ἐστὶν τυφλός, ἀλλὰ βλέπει.",
  translation: "The man is blind, but he sees.",
  wordBreakdown: [
    { greek: "τυφλός", meaning: "blind", note: "Adjective." },
    { greek: "ἀλλά", meaning: "but", note: "Contrast." }
  ],
  structure: "Clause + ἀλλά + Clause",
  explanation: "ἀλλά introduces contrast between two ideas."
},

{
  id: "ch16-017",
  chapter: 16,
  greek: "τότε ὁ ἄνθρωπος ἀκούει τὸ ῥῆμα.",
  translation: "Then the man hears the saying.",
  wordBreakdown: [
    { greek: "ῥῆμα", meaning: "word/saying", note: "Object." }
  ],
  structure: "Adverb → Subject → Verb → Object",
  explanation: "τότε places the action in sequence."
},

{
  id: "ch16-018",
  chapter: 16,
  greek: "ὁ μαθητὴς ἔχει χαρὰν μεγάλην.",
  translation: "The disciple has great joy.",
  wordBreakdown: [
    { greek: "χαρὰν μεγάλην", meaning: "great joy", note: "Object with adjective." }
  ],
  structure: "Subject → Verb → Object + Adjective",
  explanation: "Adjectives follow and describe the noun."
},

{
  id: "ch16-019",
  chapter: 16,
  greek: "ὁ θεὸς βλέπει τὸ πρόσωπον τοῦ ἀνθρώπου.",
  translation: "God sees the face of the man.",
  wordBreakdown: [
    { greek: "πρόσωπον", meaning: "face", note: "Chapter 16 noun." }
  ],
  structure: "Subject → Verb → Object → Possession",
  explanation: "Adds a genitive phrase for clarity: whose face."
},

{
  id: "ch16-020",
  chapter: 16,
  greek: "ὅπου ὁ θεὸς ἐστίν, τότε ἐστὶν χαρά.",
  translation: "Where God is, then there is joy.",
  wordBreakdown: [
    { greek: "ὅπου", meaning: "where", note: "Clause starter." },
    { greek: "τότε", meaning: "then", note: "Result word." }
  ],
  structure: "ὅπου Clause → τότε Clause",
  explanation: "Combines place (ὅπου) with result (τότε)."
},

{
  id: "ch17-001",
  chapter: 17,
  greek: "ὁ θεὸς ἀγαπᾷ τὸν κόσμον.",
  translation: "God loves the world.",
  wordBreakdown: [
    { greek: "ὁ θεός", meaning: "God", note: "Subject." },
    { greek: "ἀγαπᾷ", meaning: "loves", note: "Chapter 17 verb." },
    { greek: "τὸν κόσμον", meaning: "the world", note: "Object." }
  ],
  structure: "Subject → Verb → Object",
  explanation: "ἀγαπάω expresses committed or sacrificial love."
},

{
  id: "ch17-002",
  chapter: 17,
  greek: "ὁ ἄνθρωπος ζητεῖ τὸν θεόν.",
  translation: "The man seeks God.",
  wordBreakdown: [
    { greek: "ζητεῖ", meaning: "seeks", note: "Chapter 17 verb." }
  ],
  structure: "Subject → Verb → Object",
  explanation: "ζητέω can mean seek, pursue, or desire."
},

{
  id: "ch17-003",
  chapter: 17,
  greek: "ὁ Ἰησοῦς καλεῖ τοὺς μαθητάς.",
  translation: "Jesus calls the disciples.",
  wordBreakdown: [
    { greek: "καλεῖ", meaning: "calls", note: "Chapter 17 verb." }
  ],
  structure: "Subject → Verb → Object",
  explanation: "καλέω can mean call, name, or invite."
},

{
  id: "ch17-004",
  chapter: 17,
  greek: "ὁ μαθητὴς λαλεῖ τὸν λόγον.",
  translation: "The disciple speaks the word.",
  wordBreakdown: [
    { greek: "λαλεῖ", meaning: "speaks", note: "Chapter 17 verb." }
  ],
  structure: "Subject → Verb → Object",
  explanation: "λαλέω often emphasizes speaking or talking."
},

{
  id: "ch17-005",
  chapter: 17,
  greek: "ὁ ἄνθρωπος οἶδα τὸν θεόν.",
  translation: "The man knows God.",
  wordBreakdown: [
    { greek: "οἶδα", meaning: "knows", note: "Chapter 17 verb." }
  ],
  structure: "Subject → Verb → Object",
  explanation: "οἶδα refers to knowledge or understanding."
},

{
  id: "ch17-006",
  chapter: 17,
  greek: "ὁ θεὸς ποιεῖ ἔργον μέγα.",
  translation: "God does a great work.",
  wordBreakdown: [
    { greek: "ποιεῖ", meaning: "does/makes", note: "Chapter 17 verb." },
    { greek: "ἔργον μέγα", meaning: "a great work", note: "Object with adjective." }
  ],
  structure: "Subject → Verb → Object + Adjective",
  explanation: "ποιέω is a very general verb meaning to do or make."
},

{
  id: "ch17-007",
  chapter: 17,
  greek: "ὁ μαθητὴς τηρεῖ τὴν ἐντολήν.",
  translation: "The disciple keeps the commandment.",
  wordBreakdown: [
    { greek: "τηρεῖ", meaning: "keeps/observes", note: "Chapter 17 verb." }
  ],
  structure: "Subject → Verb → Object",
  explanation: "τηρέω often means to keep or obey something."
},

{
  id: "ch17-008",
  chapter: 17,
  greek: "ὁ θεὸς πληροῖ τὴν ἐπαγγελίαν.",
  translation: "God fulfills the promise.",
  wordBreakdown: [
    { greek: "πληροῖ", meaning: "fulfills", note: "Chapter 17 verb." },
    { greek: "τὴν ἐπαγγελίαν", meaning: "the promise", note: "Object." }
  ],
  structure: "Subject → Verb → Object",
  explanation: "πληρόω means to complete or bring something to fulfillment."
},

{
  id: "ch17-009",
  chapter: 17,
  greek: "ὁ ἄνθρωπος βλέπει δαιμόνιον.",
  translation: "The man sees a demon.",
  wordBreakdown: [
    { greek: "δαιμόνιον", meaning: "demon", note: "Chapter 17 noun." }
  ],
  structure: "Subject → Verb → Object",
  explanation: "δαιμόνιον refers to an unclean spirit."
},

{
  id: "ch17-010",
  chapter: 17,
  greek: "ὁ μαθητὴς ζητεῖ πλείω σοφίαν.",
  translation: "The disciple seeks more wisdom.",
  wordBreakdown: [
    { greek: "πλείων", meaning: "more", note: "Chapter 17 comparative." }
  ],
  structure: "Subject → Verb → Object",
  explanation: "πλείων expresses comparison: more or greater."
},

{
  id: "ch17-011",
  chapter: 17,
  greek: "ὅταν ὁ ἄνθρωπος ἀκούῃ, πιστεύει.",
  translation: "Whenever the man hears, he believes.",
  wordBreakdown: [
    { greek: "ὅταν", meaning: "whenever", note: "Chapter 17 time connector." }
  ],
  structure: "ὅταν Clause → Result Clause",
  explanation: "ὅταν introduces repeated or general time: whenever."
},

{
  id: "ch17-012",
  chapter: 17,
  greek: "ὁ θεὸς ἀγαπᾷ καὶ καλεί.",
  translation: "God loves and calls.",
  wordBreakdown: [
    { greek: "ἀγαπᾷ / καλεῖ", meaning: "loves / calls", note: "Two Chapter 17 verbs." }
  ],
  structure: "Subject → Verb + καί + Verb",
  explanation: "καί connects two actions done by the same subject."
},

{
  id: "ch17-013",
  chapter: 17,
  greek: "ὁ μαθητὴς λαλεῖ καὶ διδάσκει.",
  translation: "The disciple speaks and teaches.",
  wordBreakdown: [
    { greek: "λαλεῖ", meaning: "speaks", note: "Verb." },
    { greek: "διδάσκει", meaning: "teaches", note: "Added helper verb." }
  ],
  structure: "Subject → Verb + καί + Verb",
  explanation: "Combines two speaking-related actions."
},

{
  id: "ch17-014",
  chapter: 17,
  greek: "ὁ ἄνθρωπος οἶδα καὶ βλέπει.",
  translation: "The man knows and sees.",
  wordBreakdown: [
    { greek: "οἶδα / βλέπει", meaning: "knows / sees", note: "Two verbs." }
  ],
  structure: "Subject → Verb + καί + Verb",
  explanation: "Links knowledge with perception."
},

{
  id: "ch17-015",
  chapter: 17,
  greek: "ὁ θεὸς ποιεῖ καὶ πληροῖ.",
  translation: "God does and fulfills.",
  wordBreakdown: [
    { greek: "ποιεῖ / πληροῖ", meaning: "does / fulfills", note: "Verbs." }
  ],
  structure: "Subject → Verb + καί + Verb",
  explanation: "Shows action followed by completion."
},

{
  id: "ch17-016",
  chapter: 17,
  greek: "ὁ μαθητὴς τηρεῖ καὶ ἀγαπᾷ.",
  translation: "The disciple keeps and loves.",
  wordBreakdown: [
    { greek: "τηρεῖ / ἀγαπᾷ", meaning: "keeps / loves", note: "Verbs." }
  ],
  structure: "Subject → Verb + καί + Verb",
  explanation: "Common NT pattern: obedience and love together."
},

{
  id: "ch17-017",
  chapter: 17,
  greek: "ὁ ἄνθρωπος ζητεῖ καὶ εὑρίσκει.",
  translation: "The man seeks and finds.",
  wordBreakdown: [
    { greek: "ζητεῖ", meaning: "seeks", note: "Verb." },
    { greek: "εὑρίσκει", meaning: "finds", note: "Added common verb." }
  ],
  structure: "Subject → Verb + καί + Verb",
  explanation: "Shows pursuit followed by result."
},

{
  id: "ch17-018",
  chapter: 17,
  greek: "ὅταν ὁ θεὸς λέγῃ, ὁ ἄνθρωπος ἀκούει.",
  translation: "Whenever God speaks, the man hears.",
  wordBreakdown: [
    { greek: "ὅταν", meaning: "whenever", note: "Time connector." }
  ],
  structure: "ὅταν Clause → Result Clause",
  explanation: "Shows repeated relationship between actions."
},

{
  id: "ch17-019",
  chapter: 17,
  greek: "ὁ μαθητὴς ἔχει χαρὰν καὶ πίστιν.",
  translation: "The disciple has joy and faith.",
  wordBreakdown: [
    { greek: "ἔχει", meaning: "has", note: "Verb." }
  ],
  structure: "Subject → Verb → Object + καί + Object",
  explanation: "Combines internal qualities as possessions."
},

{
  id: "ch17-020",
  chapter: 17,
  greek: "ὅταν ὁ μαθητὴς τηρῇ τὴν ἐντολήν, ἔχει ζωήν.",
  translation: "Whenever the disciple keeps the commandment, he has life.",
  wordBreakdown: [
    { greek: "ὅταν", meaning: "whenever", note: "Clause starter." },
    { greek: "τηρῇ", meaning: "keeps", note: "Verb." }
  ],
  structure: "ὅταν Clause → Result Clause",
  explanation: "Combines condition + result in a repeated pattern."
},

{
  id: "ch18-001",
  chapter: 18,
  greek: "ὁ Ἰησοῦς ἀποκρίνεται τῷ ὄχλῳ.",
  translation: "Jesus answers the crowd.",
  wordBreakdown: [
    { greek: "ὁ Ἰησοῦς", meaning: "Jesus", note: "Subject." },
    { greek: "ἀποκρίνεται", meaning: "answers", note: "Chapter 18 verb." },
    { greek: "τῷ ὄχλῳ", meaning: "the crowd", note: "The one being answered." }
  ],
  structure: "Subject → Verb → Object",
  explanation: "ἀποκρίνομαι means to answer or respond, often after someone speaks."
},

{
  id: "ch18-002",
  chapter: 18,
  greek: "δεῖ τὸν μαθητὴν ἀκούειν.",
  translation: "It is necessary for the disciple to hear.",
  wordBreakdown: [
    { greek: "δεῖ", meaning: "it is necessary", note: "Chapter 18 verb." },
    { greek: "τὸν μαθητήν", meaning: "the disciple", note: "Person who must act." },
    { greek: "ἀκούειν", meaning: "to hear", note: "Helper infinitive from ἀκούω." }
  ],
  structure: "δεῖ → Person → Infinitive",
  explanation: "δεῖ is often followed by an infinitive to show what must happen."
},

{
  id: "ch18-003",
  chapter: 18,
  greek: "ὁ ἄνθρωπος δύναται πιστεύειν.",
  translation: "The man is able to believe.",
  wordBreakdown: [
    { greek: "ὁ ἄνθρωπος", meaning: "the man", note: "Subject." },
    { greek: "δύναται", meaning: "is able", note: "Chapter 18 verb." },
    { greek: "πιστεύειν", meaning: "to believe", note: "Helper infinitive from πιστεύω." }
  ],
  structure: "Subject → δύναται → Infinitive",
  explanation: "δύναμαι usually pairs with an infinitive to show ability."
},

{
  id: "ch18-004",
  chapter: 18,
  greek: "ὁ κύριος ἔρχεται εἰς τὸν τόπον.",
  translation: "The Lord comes into the place.",
  wordBreakdown: [
    { greek: "ὁ κύριος", meaning: "the Lord", note: "Subject." },
    { greek: "ἔρχεται", meaning: "comes", note: "Chapter 18 verb." },
    { greek: "εἰς τὸν τόπον", meaning: "into the place", note: "Direction phrase." }
  ],
  structure: "Subject → Verb → εἰς Phrase",
  explanation: "ἔρχομαι shows coming or going, and εἰς marks direction toward a place."
},

{
  id: "ch18-005",
  chapter: 18,
  greek: "ὁ μαθητὴς πορεύεται ἐν τῇ ὁδῷ.",
  translation: "The disciple goes on the way.",
  wordBreakdown: [
    { greek: "ὁ μαθητής", meaning: "the disciple", note: "Subject." },
    { greek: "πορεύεται", meaning: "goes/proceeds", note: "Chapter 18 verb." },
    { greek: "ἐν τῇ ὁδῷ", meaning: "on the way", note: "Location/path phrase." }
  ],
  structure: "Subject → Verb → Prepositional Phrase",
  explanation: "πορεύομαι can mean to go, travel, or live/walk in a certain way."
},

{
  id: "ch18-006",
  chapter: 18,
  greek: "νὺξ ἐστὶν ἐν τῷ κόσμῳ.",
  translation: "Night is in the world.",
  wordBreakdown: [
    { greek: "νύξ", meaning: "night", note: "Chapter 18 noun." },
    { greek: "ἐστίν", meaning: "is", note: "Verb." },
    { greek: "ἐν τῷ κόσμῳ", meaning: "in the world", note: "Location phrase." }
  ],
  structure: "Subject → Verb → Prepositional Phrase",
  explanation: "νύξ means night and can be used literally or symbolically."
},

{
  id: "ch18-007",
  chapter: 18,
  greek: "ὅστις πιστεύει ἔχει ζωήν.",
  translation: "Whoever believes has life.",
  wordBreakdown: [
    { greek: "ὅστις", meaning: "whoever", note: "Chapter 18 relative word." },
    { greek: "πιστεύει", meaning: "believes", note: "Verb." },
    { greek: "ἔχει ζωήν", meaning: "has life", note: "Main idea." }
  ],
  structure: "ὅστις Clause → Main Clause",
  explanation: "ὅστις makes the statement general: whoever does this."
},

{
  id: "ch18-008",
  chapter: 18,
  greek: "ὁ Ἰησοῦς συνάγει τοὺς μαθητάς.",
  translation: "Jesus gathers the disciples.",
  wordBreakdown: [
    { greek: "ὁ Ἰησοῦς", meaning: "Jesus", note: "Subject." },
    { greek: "συνάγει", meaning: "gathers together", note: "Chapter 18 verb." },
    { greek: "τοὺς μαθητάς", meaning: "the disciples", note: "Object." }
  ],
  structure: "Subject → Verb → Object",
  explanation: "συνάγω means to gather together or bring people together."
},

{
  id: "ch18-009",
  chapter: 18,
  greek: "ὁ τόπος ἐστὶν καλός.",
  translation: "The place is good.",
  wordBreakdown: [
    { greek: "ὁ τόπος", meaning: "the place", note: "Chapter 18 noun." },
    { greek: "ἐστίν", meaning: "is", note: "Verb." },
    { greek: "καλός", meaning: "good", note: "Adjective." }
  ],
  structure: "Subject → Verb → Adjective",
  explanation: "τόπος refers to a place or location."
},

{
  id: "ch18-010",
  chapter: 18,
  greek: "ὡς ὁ διδάσκαλος λέγει, ὁ μαθητὴς ἀκούει.",
  translation: "As the teacher speaks, the disciple hears.",
  wordBreakdown: [
    { greek: "ὡς", meaning: "as/when", note: "Chapter 18 connector." },
    { greek: "ὁ διδάσκαλος λέγει", meaning: "the teacher speaks", note: "First clause." },
    { greek: "ὁ μαθητὴς ἀκούει", meaning: "the disciple hears", note: "Main clause." }
  ],
  structure: "ὡς Clause → Main Clause",
  explanation: "ὡς can connect ideas by comparison or timing, depending on context."
},

{
  id: "ch18-011",
  chapter: 18,
  greek: "δεῖ ἡμᾶς τηρεῖν τὴν ἐντολήν.",
  translation: "It is necessary for us to keep the commandment.",
  wordBreakdown: [
    { greek: "δεῖ", meaning: "it is necessary", note: "Chapter 18 verb." },
    { greek: "ἡμᾶς", meaning: "us", note: "Helper pronoun form from ἡμεῖς." },
    { greek: "τηρεῖν", meaning: "to keep", note: "Helper infinitive from τηρέω." },
    { greek: "τὴν ἐντολήν", meaning: "the commandment", note: "Object." }
  ],
  structure: "δεῖ → Person → Infinitive → Object",
  explanation: "δεῖ often uses an infinitive to show the necessary action."
},

{
  id: "ch18-012",
  chapter: 18,
  greek: "ὁ ἄνθρωπος οὐ δύναται βλέπειν τὸ φῶς.",
  translation: "The man is not able to see the light.",
  wordBreakdown: [
    { greek: "ὁ ἄνθρωπος", meaning: "the man", note: "Subject." },
    { greek: "οὐ δύναται", meaning: "is not able", note: "Negated Chapter 18 verb." },
    { greek: "βλέπειν", meaning: "to see", note: "Helper infinitive from βλέπω." },
    { greek: "τὸ φῶς", meaning: "the light", note: "Object." }
  ],
  structure: "Subject → Negative + δύναται → Infinitive → Object",
  explanation: "δύναμαι plus an infinitive expresses ability or inability."
},

{
  id: "ch18-013",
  chapter: 18,
  greek: "ὅταν ὁ κύριος ἔρχηται, ὁ δοῦλος ἀποκρίνεται.",
  translation: "Whenever the Lord comes, the servant answers.",
  wordBreakdown: [
    { greek: "ὅταν", meaning: "whenever", note: "Time connector." },
    { greek: "ὁ κύριος ἔρχηται", meaning: "the Lord comes", note: "Time clause." },
    { greek: "ὁ δοῦλος ἀποκρίνεται", meaning: "the servant answers", note: "Main clause." }
  ],
  structure: "ὅταν Clause → Main Clause",
  explanation: "ὅταν marks repeated time: whenever the action happens."
},

{
  id: "ch18-014",
  chapter: 18,
  greek: "ὁ Ἰησοῦς ἔρχεται νυκτός.",
  translation: "Jesus comes by night.",
  wordBreakdown: [
    { greek: "ὁ Ἰησοῦς", meaning: "Jesus", note: "Subject." },
    { greek: "ἔρχεται", meaning: "comes", note: "Chapter 18 verb." },
    { greek: "νυκτός", meaning: "by night", note: "Form from νύξ." }
  ],
  structure: "Subject → Verb → Time Phrase",
  explanation: "νυκτός is a form of νύξ used to express time: by night."
},

{
  id: "ch18-015",
  chapter: 18,
  greek: "ὅστις ἀκούει τὸν λόγον, οὗτος πιστεύει.",
  translation: "Whoever hears the word, this one believes.",
  wordBreakdown: [
    { greek: "ὅστις", meaning: "whoever", note: "Chapter 18 relative word." },
    { greek: "ἀκούει τὸν λόγον", meaning: "hears the word", note: "Relative clause." },
    { greek: "οὗτος πιστεύει", meaning: "this one believes", note: "Main clause." }
  ],
  structure: "ὅστις Clause → οὗτος Clause",
  explanation: "ὅστις sets up a general person, and οὗτος points back to that person."
},

{
  id: "ch18-016",
  chapter: 18,
  greek: "ὁ Ἰωάννης πορεύεται εἰς τὴν πόλιν.",
  translation: "John goes into the city.",
  wordBreakdown: [
    { greek: "ὁ Ἰωάννης", meaning: "John", note: "Subject." },
    { greek: "πορεύεται", meaning: "goes", note: "Chapter 18 verb." },
    { greek: "εἰς τὴν πόλιν", meaning: "into the city", note: "Direction phrase." }
  ],
  structure: "Subject → Verb → εἰς Phrase",
  explanation: "πορεύομαι describes going or traveling, and εἰς gives the destination."
},

{
  id: "ch18-017",
  chapter: 18,
  greek: "ὁ κύριος συνάγει τὴν ἐκκλησίαν ἐν τῷ τόπῳ.",
  translation: "The Lord gathers the church in the place.",
  wordBreakdown: [
    { greek: "ὁ κύριος", meaning: "the Lord", note: "Subject." },
    { greek: "συνάγει", meaning: "gathers", note: "Chapter 18 verb." },
    { greek: "τὴν ἐκκλησίαν", meaning: "the church", note: "Object." },
    { greek: "ἐν τῷ τόπῳ", meaning: "in the place", note: "Location phrase." }
  ],
  structure: "Subject → Verb → Object → Prepositional Phrase",
  explanation: "συνάγω takes an object: the group being gathered."
},

{
  id: "ch18-018",
  chapter: 18,
  greek: "ὡς ὁ θεὸς ἀγαπᾷ, οὕτως ὁ μαθητὴς ἀγαπᾷ.",
  translation: "As God loves, so the disciple loves.",
  wordBreakdown: [
    { greek: "ὡς", meaning: "as", note: "Comparison word." },
    { greek: "ὁ θεὸς ἀγαπᾷ", meaning: "God loves", note: "Pattern clause." },
    { greek: "οὕτως", meaning: "so/in this way", note: "Matching comparison word." },
    { greek: "ὁ μαθητὴς ἀγαπᾷ", meaning: "the disciple loves", note: "Main clause." }
  ],
  structure: "ὡς Clause → οὕτως Clause",
  explanation: "ὡς and οὕτως work together: as something happens, so something else happens."
},

{
  id: "ch18-019",
  chapter: 18,
  greek: "ὁ ἀδελφὸς ἔρχεται πρὸς τὸν ἀδελφόν.",
  translation: "The brother comes to the brother.",
  wordBreakdown: [
    { greek: "ὁ ἀδελφός", meaning: "the brother", note: "Subject." },
    { greek: "ἔρχεται", meaning: "comes", note: "Chapter 18 verb." },
    { greek: "πρὸς τὸν ἀδελφόν", meaning: "to the brother", note: "Direction phrase." }
  ],
  structure: "Subject → Verb → πρός Phrase",
  explanation: "πρός shows direction toward a person."
},

{
  id: "ch18-020",
  chapter: 18,
  greek: "δεῖ τὸν δοῦλον πορεύεσθαι ἐν τῇ ὁδῷ.",
  translation: "It is necessary for the servant to go on the way.",
  wordBreakdown: [
    { greek: "δεῖ", meaning: "it is necessary", note: "Chapter 18 verb." },
    { greek: "τὸν δοῦλον", meaning: "the servant", note: "Person who must act." },
    { greek: "πορεύεσθαι", meaning: "to go", note: "Infinitive from πορεύομαι." },
    { greek: "ἐν τῇ ὁδῷ", meaning: "on the way", note: "Path phrase." }
  ],
  structure: "δεῖ → Person → Infinitive → Phrase",
  explanation: "δεῖ plus an infinitive shows obligation or necessity."
},

{
  id: "ch19-001",
  chapter: 19,
  greek: "ὁ βασιλεὺς ἐστὶν ἐν τῇ πόλει.",
  translation: "The king is in the city.",
  wordBreakdown: [
    { greek: "ὁ βασιλεύς", meaning: "the king", note: "Chapter 19 noun." },
    { greek: "ἐστίν", meaning: "is", note: "Verb." },
    { greek: "ἐν τῇ πόλει", meaning: "in the city", note: "Location phrase." }
  ],
  structure: "Subject → Verb → Prepositional Phrase",
  explanation: "βασιλεύς means king and often appears in kingdom or authority contexts."
},

{
  id: "ch19-002",
  chapter: 19,
  greek: "ὁ θεὸς γεννᾷ ζωήν.",
  translation: "God produces life.",
  wordBreakdown: [
    { greek: "ὁ θεός", meaning: "God", note: "Subject." },
    { greek: "γεννᾷ", meaning: "produces/begets", note: "Chapter 19 verb." },
    { greek: "ζωήν", meaning: "life", note: "Object." }
  ],
  structure: "Subject → Verb → Object",
  explanation: "γεννάω can mean beget, give birth to, or produce depending on context."
},

{
  id: "ch19-003",
  chapter: 19,
  greek: "ὁ ἄνθρωπος ζῇ ἐν τῷ κόσμῳ.",
  translation: "The man lives in the world.",
  wordBreakdown: [
    { greek: "ὁ ἄνθρωπος", meaning: "the man", note: "Subject." },
    { greek: "ζῇ", meaning: "lives", note: "Chapter 19 verb." },
    { greek: "ἐν τῷ κόσμῳ", meaning: "in the world", note: "Location phrase." }
  ],
  structure: "Subject → Verb → Prepositional Phrase",
  explanation: "ζάω means to live and can refer to physical or spiritual life."
},

{
  id: "ch19-004",
  chapter: 19,
  greek: "ὁ Ἰησοῦς ἦν ἐν τῇ Ἰουδαίᾳ.",
  translation: "Jesus was in Judea.",
  wordBreakdown: [
    { greek: "ὁ Ἰησοῦς", meaning: "Jesus", note: "Subject." },
    { greek: "ἦν", meaning: "was", note: "Past form of εἰμί." },
    { greek: "ἐν τῇ Ἰουδαίᾳ", meaning: "in Judea", note: "Chapter 19 place name." }
  ],
  structure: "Subject → Past Verb → Location",
  explanation: "Ἰουδαία is a place name, so it naturally appears in location phrases."
},

{
  id: "ch19-005",
  chapter: 19,
  greek: "ὁ Ἰουδαῖος ἀκούει τὸν λόγον.",
  translation: "The Jew hears the word.",
  wordBreakdown: [
    { greek: "ὁ Ἰουδαῖος", meaning: "the Jew", note: "Chapter 19 noun/adjective." },
    { greek: "ἀκούει", meaning: "hears", note: "Verb." },
    { greek: "τὸν λόγον", meaning: "the word", note: "Object." }
  ],
  structure: "Subject → Verb → Object",
  explanation: "Ἰουδαῖος can describe someone Jewish or function as a noun: a Jew."
},

{
  id: "ch19-006",
  chapter: 19,
  greek: "ὁ θεὸς ἀγαπᾷ τὸν Ἰσραήλ.",
  translation: "God loves Israel.",
  wordBreakdown: [
    { greek: "ὁ θεός", meaning: "God", note: "Subject." },
    { greek: "ἀγαπᾷ", meaning: "loves", note: "Verb." },
    { greek: "τὸν Ἰσραήλ", meaning: "Israel", note: "Chapter 19 proper noun." }
  ],
  structure: "Subject → Verb → Object",
  explanation: "Ἰσραήλ is a proper name and refers to Israel."
},

{
  id: "ch19-007",
  chapter: 19,
  greek: "ὁ καρπὸς ἐστὶν καλός.",
  translation: "The fruit is good.",
  wordBreakdown: [
    { greek: "ὁ καρπός", meaning: "the fruit", note: "Chapter 19 noun." },
    { greek: "ἐστίν", meaning: "is", note: "Verb." },
    { greek: "καλός", meaning: "good", note: "Adjective." }
  ],
  structure: "Subject → Verb → Adjective",
  explanation: "καρπός can mean literal fruit or the result of something."
},

{
  id: "ch19-008",
  chapter: 19,
  greek: "ὁ θεὸς ἐστὶν μείζων τοῦ ἀνθρώπου.",
  translation: "God is greater than man.",
  wordBreakdown: [
    { greek: "ὁ θεός", meaning: "God", note: "Subject." },
    { greek: "ἐστίν", meaning: "is", note: "Verb." },
    { greek: "μείζων", meaning: "greater", note: "Chapter 19 comparative adjective." },
    { greek: "τοῦ ἀνθρώπου", meaning: "than man", note: "Comparison phrase." }
  ],
  structure: "Subject → Verb → Comparative → Genitive",
  explanation: "μείζων is comparative, meaning greater or larger."
},

{
  id: "ch19-009",
  chapter: 19,
  greek: "ὅλος ὁ κόσμος ἀκούει.",
  translation: "The whole world hears.",
  wordBreakdown: [
    { greek: "ὅλος", meaning: "whole/entire", note: "Chapter 19 adjective." },
    { greek: "ὁ κόσμος", meaning: "the world", note: "Subject." },
    { greek: "ἀκούει", meaning: "hears", note: "Verb." }
  ],
  structure: "Adjective → Subject → Verb",
  explanation: "ὅλος emphasizes the entirety of the noun."
},

{
  id: "ch19-010",
  chapter: 19,
  greek: "ὁ δοῦλος προσκυνεῖ τῷ βασιλεῖ.",
  translation: "The servant worships the king.",
  wordBreakdown: [
    { greek: "ὁ δοῦλος", meaning: "the servant", note: "Subject." },
    { greek: "προσκυνεῖ", meaning: "worships/bows down", note: "Chapter 19 verb." },
    { greek: "τῷ βασιλεῖ", meaning: "the king", note: "Object of worship." }
  ],
  structure: "Subject → Verb → Object",
  explanation: "προσκυνέω means to worship or bow down before someone."
},

{
  id: "ch19-011",
  chapter: 19,
  greek: "ὁ βασιλεὺς λέγει πρὸς τὸν δοῦλον.",
  translation: "The king speaks to the servant.",
  wordBreakdown: [
    { greek: "ὁ βασιλεύς", meaning: "the king", note: "Subject." },
    { greek: "λέγει", meaning: "speaks", note: "Verb." },
    { greek: "πρὸς τὸν δοῦλον", meaning: "to the servant", note: "Direction phrase." }
  ],
  structure: "Subject → Verb → πρός Phrase",
  explanation: "πρός shows the direction of the speaking."
},

{
  id: "ch19-012",
  chapter: 19,
  greek: "ὁ ἄνθρωπος ζῇ διὰ τὸν λόγον.",
  translation: "The man lives because of the word.",
  wordBreakdown: [
    { greek: "ὁ ἄνθρωπος", meaning: "the man", note: "Subject." },
    { greek: "ζῇ", meaning: "lives", note: "Chapter 19 verb." },
    { greek: "διὰ τὸν λόγον", meaning: "because of the word", note: "Reason phrase." }
  ],
  structure: "Subject → Verb → διά Phrase",
  explanation: "διά can show reason: because of something."
},

{
  id: "ch19-013",
  chapter: 19,
  greek: "ὁ καρπὸς ἐστὶν ἐκ τοῦ ἔργου.",
  translation: "The fruit is from the work.",
  wordBreakdown: [
    { greek: "ὁ καρπός", meaning: "the fruit/result", note: "Chapter 19 noun." },
    { greek: "ἐστίν", meaning: "is", note: "Verb." },
    { greek: "ἐκ τοῦ ἔργου", meaning: "from the work", note: "Source phrase." }
  ],
  structure: "Subject → Verb → ἐκ Phrase",
  explanation: "καρπός can mean the result that comes from an action."
},

{
  id: "ch19-014",
  chapter: 19,
  greek: "ὁ Ἰουδαῖος πορεύεται εἰς Ἰερουσαλήμ.",
  translation: "The Jew goes to Jerusalem.",
  wordBreakdown: [
    { greek: "ὁ Ἰουδαῖος", meaning: "the Jew", note: "Subject." },
    { greek: "πορεύεται", meaning: "goes", note: "Verb." },
    { greek: "εἰς Ἰερουσαλήμ", meaning: "to Jerusalem", note: "Direction phrase." }
  ],
  structure: "Subject → Verb → εἰς Phrase",
  explanation: "εἰς shows movement toward a destination."
},

{
  id: "ch19-015",
  chapter: 19,
  greek: "ὁ βασιλεὺς ἐστὶν ἐπὶ τοῦ θρόνου.",
  translation: "The king is on the throne.",
  wordBreakdown: [
    { greek: "ὁ βασιλεύς", meaning: "the king", note: "Subject." },
    { greek: "ἐστίν", meaning: "is", note: "Verb." },
    { greek: "ἐπὶ τοῦ θρόνου", meaning: "on the throne", note: "Location/authority phrase." }
  ],
  structure: "Subject → Verb → ἐπί Phrase",
  explanation: "A king on a throne pictures rule or authority."
},

{
  id: "ch19-016",
  chapter: 19,
  greek: "ὁ θεὸς γεννᾷ καρπὸν ἀγαθόν.",
  translation: "God produces good fruit.",
  wordBreakdown: [
    { greek: "ὁ θεός", meaning: "God", note: "Subject." },
    { greek: "γεννᾷ", meaning: "produces", note: "Chapter 19 verb." },
    { greek: "καρπὸν ἀγαθόν", meaning: "good fruit", note: "Object with adjective." }
  ],
  structure: "Subject → Verb → Object + Adjective",
  explanation: "γεννάω can describe producing something, not only physical birth."
},

{
  id: "ch19-017",
  chapter: 19,
  greek: "ὁ Ἰησοῦς ἐστὶν βασιλεὺς τοῦ Ἰσραήλ.",
  translation: "Jesus is king of Israel.",
  wordBreakdown: [
    { greek: "ὁ Ἰησοῦς", meaning: "Jesus", note: "Subject." },
    { greek: "ἐστίν", meaning: "is", note: "Verb." },
    { greek: "βασιλεὺς", meaning: "king", note: "Chapter 19 noun." },
    { greek: "τοῦ Ἰσραήλ", meaning: "of Israel", note: "Possession/relationship phrase." }
  ],
  structure: "Subject → Verb → Predicate → Genitive",
  explanation: "The genitive phrase explains whose king is being described."
},

{
  id: "ch19-018",
  chapter: 19,
  greek: "ὅτε ὁ βασιλεὺς ἔρχεται, ὁ ὄχλος προσκυνεῖ.",
  translation: "When the king comes, the crowd worships.",
  wordBreakdown: [
    { greek: "ὅτε", meaning: "when", note: "Time clause marker." },
    { greek: "ὁ βασιλεὺς ἔρχεται", meaning: "the king comes", note: "Time clause." },
    { greek: "ὁ ὄχλος προσκυνεῖ", meaning: "the crowd worships", note: "Main clause." }
  ],
  structure: "ὅτε Clause → Main Clause",
  explanation: "ὅτε introduces when the main action happens."
},

{
  id: "ch19-019",
  chapter: 19,
  greek: "ὁ Ἰουδαῖος ἔχει νόμον καὶ ἐπαγγελίαν.",
  translation: "The Jew has law and promise.",
  wordBreakdown: [
    { greek: "ὁ Ἰουδαῖος", meaning: "the Jew", note: "Subject." },
    { greek: "ἔχει", meaning: "has", note: "Verb." },
    { greek: "νόμον καὶ ἐπαγγελίαν", meaning: "law and promise", note: "Objects." }
  ],
  structure: "Subject → Verb → Object + καί + Object",
  explanation: "καί connects two things possessed by the subject."
},

{
  id: "ch19-020",
  chapter: 19,
  greek: "ὁ καρπὸς τῆς δικαιοσύνης ἐστὶν εἰρήνη.",
  translation: "The fruit of righteousness is peace.",
  wordBreakdown: [
    { greek: "ὁ καρπός", meaning: "the fruit/result", note: "Chapter 19 noun." },
    { greek: "τῆς δικαιοσύνης", meaning: "of righteousness", note: "Genitive phrase." },
    { greek: "ἐστίν", meaning: "is", note: "Verb." },
    { greek: "εἰρήνη", meaning: "peace", note: "Predicate noun." }
  ],
  structure: "Subject → Genitive → Verb → Predicate",
  explanation: "καρπός can mean result, so the phrase means the result of righteousness."
},

{
  id: "ch20-001",
  chapter: 20,
  greek: "ὁ Ἰησοῦς αἴρει τὴν ἁμαρτίαν.",
  translation: "Jesus takes away sin.",
  wordBreakdown: [
    { greek: "ὁ Ἰησοῦς", meaning: "Jesus", note: "Subject." },
    { greek: "αἴρει", meaning: "takes away", note: "Chapter 20 verb." },
    { greek: "τὴν ἁμαρτίαν", meaning: "sin", note: "Object." }
  ],
  structure: "Subject → Verb → Object",
  explanation: "αἴρω can mean lift up, take up, or take away depending on context."
},

{
  id: "ch20-002",
  chapter: 20,
  greek: "ὁ βασιλεὺς ἀποκτείνει τὸν δοῦλον.",
  translation: "The king kills the servant.",
  wordBreakdown: [
    { greek: "ὁ βασιλεύς", meaning: "the king", note: "Subject." },
    { greek: "ἀποκτείνει", meaning: "kills", note: "Chapter 20 verb." },
    { greek: "τὸν δοῦλον", meaning: "the servant", note: "Object." }
  ],
  structure: "Subject → Verb → Object",
  explanation: "ἀποκτείνω is a direct action verb and normally takes an object."
},

{
  id: "ch20-003",
  chapter: 20,
  greek: "ὁ θεὸς ἀποστέλλει τὸν ἄγγελον.",
  translation: "God sends the angel.",
  wordBreakdown: [
    { greek: "ὁ θεός", meaning: "God", note: "Subject." },
    { greek: "ἀποστέλλει", meaning: "sends", note: "Chapter 20 verb." },
    { greek: "τὸν ἄγγελον", meaning: "the angel", note: "Object." }
  ],
  structure: "Subject → Verb → Object",
  explanation: "ἀποστέλλω means to send someone out with purpose."
},

{
  id: "ch20-004",
  chapter: 20,
  greek: "ὁ Ἰωάννης βαπτίζει τὸν ἄνθρωπον.",
  translation: "John baptizes the man.",
  wordBreakdown: [
    { greek: "ὁ Ἰωάννης", meaning: "John", note: "Subject." },
    { greek: "βαπτίζει", meaning: "baptizes", note: "Chapter 20 verb." },
    { greek: "τὸν ἄνθρωπον", meaning: "the man", note: "Object." }
  ],
  structure: "Subject → Verb → Object",
  explanation: "βαπτίζω takes the person being baptized as its object."
},

{
  id: "ch20-005",
  chapter: 20,
  greek: "ὁ μαθητὴς γινώσκει τὴν ἀλήθειαν.",
  translation: "The disciple knows the truth.",
  wordBreakdown: [
    { greek: "ὁ μαθητής", meaning: "the disciple", note: "Subject." },
    { greek: "γινώσκει", meaning: "knows/comes to know", note: "Chapter 20 verb." },
    { greek: "τὴν ἀλήθειαν", meaning: "the truth", note: "Object." }
  ],
  structure: "Subject → Verb → Object",
  explanation: "γινώσκω often emphasizes knowing, learning, or coming to understand."
},

{
  id: "ch20-006",
  chapter: 20,
  greek: "ἡ γλῶσσα λαλεῖ λόγον.",
  translation: "The tongue speaks a word.",
  wordBreakdown: [
    { greek: "ἡ γλῶσσα", meaning: "the tongue/language", note: "Chapter 20 noun." },
    { greek: "λαλεῖ", meaning: "speaks", note: "Verb." },
    { greek: "λόγον", meaning: "word", note: "Object." }
  ],
  structure: "Subject → Verb → Object",
  explanation: "γλῶσσα can mean either the physical tongue or a language."
},

{
  id: "ch20-007",
  chapter: 20,
  greek: "ὁ θεὸς ἐγείρει τὸν νεκρόν.",
  translation: "God raises the dead one.",
  wordBreakdown: [
    { greek: "ὁ θεός", meaning: "God", note: "Subject." },
    { greek: "ἐγείρει", meaning: "raises up", note: "Chapter 20 verb." },
    { greek: "τὸν νεκρόν", meaning: "the dead one", note: "Object." }
  ],
  structure: "Subject → Verb → Object",
  explanation: "ἐγείρω can mean raise up or wake, and often appears in resurrection contexts."
},

{
  id: "ch20-008",
  chapter: 20,
  greek: "ὁ Ἰησοῦς ἐκβάλλει τὸ δαιμόνιον.",
  translation: "Jesus casts out the demon.",
  wordBreakdown: [
    { greek: "ὁ Ἰησοῦς", meaning: "Jesus", note: "Subject." },
    { greek: "ἐκβάλλει", meaning: "casts out", note: "Chapter 20 verb." },
    { greek: "τὸ δαιμόνιον", meaning: "the demon", note: "Object." }
  ],
  structure: "Subject → Verb → Object",
  explanation: "ἐκβάλλω often means to cast out or drive out."
},

{
  id: "ch20-009",
  chapter: 20,
  greek: "ἐκεῖ ὁ λαὸς ἀκούει τὸν λόγον.",
  translation: "There the people hear the word.",
  wordBreakdown: [
    { greek: "ἐκεῖ", meaning: "there", note: "Chapter 20 location word." },
    { greek: "ὁ λαός", meaning: "the people", note: "Chapter 20 noun." },
    { greek: "ἀκούει", meaning: "hears", note: "Verb." },
    { greek: "τὸν λόγον", meaning: "the word", note: "Object." }
  ],
  structure: "Location → Subject → Verb → Object",
  explanation: "ἐκεῖ tells where the action happens."
},

{
  id: "ch20-010",
  chapter: 20,
  greek: "ὁ θεὸς κρίνει τὸν κόσμον.",
  translation: "God judges the world.",
  wordBreakdown: [
    { greek: "ὁ θεός", meaning: "God", note: "Subject." },
    { greek: "κρίνει", meaning: "judges", note: "Chapter 20 verb." },
    { greek: "τὸν κόσμον", meaning: "the world", note: "Object." }
  ],
  structure: "Subject → Verb → Object",
  explanation: "κρίνω can mean judge, decide, or evaluate."
},

{
  id: "ch20-011",
  chapter: 20,
  greek: "ὁ μαθητὴς μένει ἐν τῇ οἰκίᾳ.",
  translation: "The disciple remains in the house.",
  wordBreakdown: [
    { greek: "ὁ μαθητής", meaning: "the disciple", note: "Subject." },
    { greek: "μένει", meaning: "remains", note: "Chapter 20 verb." },
    { greek: "ἐν τῇ οἰκίᾳ", meaning: "in the house", note: "Location phrase." }
  ],
  structure: "Subject → Verb → Prepositional Phrase",
  explanation: "μένω means remain, stay, or abide."
},

{
  id: "ch20-012",
  chapter: 20,
  greek: "ὁ ἄνθρωπος ὁρᾷ τὸ σημεῖον.",
  translation: "The man sees the sign.",
  wordBreakdown: [
    { greek: "ὁ ἄνθρωπος", meaning: "the man", note: "Subject." },
    { greek: "ὁρᾷ", meaning: "sees/notices", note: "Chapter 20 verb." },
    { greek: "τὸ σημεῖον", meaning: "the sign", note: "Object." }
  ],
  structure: "Subject → Verb → Object",
  explanation: "ὁράω often means see, notice, or experience."
},

{
  id: "ch20-013",
  chapter: 20,
  greek: "ἡ σοφία ἐστὶν ἀγαθή.",
  translation: "Wisdom is good.",
  wordBreakdown: [
    { greek: "ἡ σοφία", meaning: "wisdom", note: "Chapter 20 noun." },
    { greek: "ἐστίν", meaning: "is", note: "Verb." },
    { greek: "ἀγαθή", meaning: "good", note: "Adjective." }
  ],
  structure: "Subject → Verb → Adjective",
  explanation: "σοφία refers to wisdom or understanding."
},

{
  id: "ch20-014",
  chapter: 20,
  greek: "τὸ στόμα λαλεῖ ἐκ τῆς καρδίας.",
  translation: "The mouth speaks from the heart.",
  wordBreakdown: [
    { greek: "τὸ στόμα", meaning: "the mouth", note: "Chapter 20 noun." },
    { greek: "λαλεῖ", meaning: "speaks", note: "Verb." },
    { greek: "ἐκ τῆς καρδίας", meaning: "from the heart", note: "Source phrase." }
  ],
  structure: "Subject → Verb → ἐκ Phrase",
  explanation: "ἐκ shows source: where the speaking comes from."
},

{
  id: "ch20-015",
  chapter: 20,
  greek: "ὁ Ἰησοῦς σῴζει τὸν λαόν.",
  translation: "Jesus saves the people.",
  wordBreakdown: [
    { greek: "ὁ Ἰησοῦς", meaning: "Jesus", note: "Subject." },
    { greek: "σῴζει", meaning: "saves", note: "Chapter 20 verb." },
    { greek: "τὸν λαόν", meaning: "the people", note: "Object." }
  ],
  structure: "Subject → Verb → Object",
  explanation: "σῴζω means save, rescue, or deliver."
},

{
  id: "ch20-016",
  chapter: 20,
  greek: "ὁ θεὸς ἀποστέλλει καὶ σῴζει.",
  translation: "God sends and saves.",
  wordBreakdown: [
    { greek: "ὁ θεός", meaning: "God", note: "Subject." },
    { greek: "ἀποστέλλει", meaning: "sends", note: "Chapter 20 verb." },
    { greek: "καὶ σῴζει", meaning: "and saves", note: "Second Chapter 20 verb." }
  ],
  structure: "Subject → Verb + καί + Verb",
  explanation: "καί links two actions done by the same subject."
},

{
  id: "ch20-017",
  chapter: 20,
  greek: "ὅτε ὁ Ἰησοῦς βλέπει τὸν λαόν, γινώσκει τὴν καρδίαν.",
  translation: "When Jesus sees the people, he knows the heart.",
  wordBreakdown: [
    { greek: "ὅτε", meaning: "when", note: "Time clause marker." },
    { greek: "βλέπει τὸν λαόν", meaning: "sees the people", note: "First action." },
    { greek: "γινώσκει τὴν καρδίαν", meaning: "knows the heart", note: "Main clause." }
  ],
  structure: "ὅτε Clause → Main Clause",
  explanation: "ὅτε sets the time for the main action."
},

{
  id: "ch20-018",
  chapter: 20,
  greek: "ὁ λαὸς μένει ἐκεῖ καὶ ἀκούει.",
  translation: "The people remain there and hear.",
  wordBreakdown: [
    { greek: "ὁ λαός", meaning: "the people", note: "Chapter 20 noun." },
    { greek: "μένει", meaning: "remains", note: "Chapter 20 verb." },
    { greek: "ἐκεῖ", meaning: "there", note: "Chapter 20 location word." },
    { greek: "καὶ ἀκούει", meaning: "and hears", note: "Second action." }
  ],
  structure: "Subject → Verb → Location + καί + Verb",
  explanation: "ἐκεῖ gives the location, while καί adds a second action."
},

{
  id: "ch20-019",
  chapter: 20,
  greek: "ὁ ἄγγελος αἴρει τὸ παιδίον.",
  translation: "The angel takes up the child.",
  wordBreakdown: [
    { greek: "ὁ ἄγγελος", meaning: "the angel", note: "Subject." },
    { greek: "αἴρει", meaning: "takes up", note: "Chapter 20 verb." },
    { greek: "τὸ παιδίον", meaning: "the child", note: "Helper noun from later vocab used naturally here." }
  ],
  structure: "Subject → Verb → Object",
  explanation: "αἴρω can describe lifting or taking something up."
},

{
  id: "ch20-020",
  chapter: 20,
  greek: "ὁ Ἰησοῦς βαπτίζει ἐν ὕδατι καὶ σῴζει τὸν λαόν.",
  translation: "Jesus baptizes in water and saves the people.",
  wordBreakdown: [
    { greek: "ὁ Ἰησοῦς", meaning: "Jesus", note: "Subject." },
    { greek: "βαπτίζει ἐν ὕδατι", meaning: "baptizes in water", note: "Baptism phrase." },
    { greek: "καὶ σῴζει τὸν λαόν", meaning: "and saves the people", note: "Second action." }
  ],
  structure: "Subject → Verb Phrase + καί + Verb → Object",
  explanation: "The sentence joins two actions with καί: baptizing and saving."
},

{
  id: "ch21-001",
  chapter: 21,
  greek: "ὁ μαθητὴς ἀκολουθεῖ τῷ Ἰησοῦ.",
  translation: "The disciple follows Jesus.",
  wordBreakdown: [
    { greek: "ὁ μαθητής", meaning: "the disciple", note: "Subject." },
    { greek: "ἀκολουθεῖ", meaning: "follows", note: "Chapter 21 verb." },
    { greek: "τῷ Ἰησοῦ", meaning: "Jesus", note: "The one being followed." }
  ],
  structure: "Subject → Verb → Object",
  explanation: "ἀκολουθέω often takes the person being followed."
},

{
  id: "ch21-002",
  chapter: 21,
  greek: "ὁ διδάσκαλος διδάσκει τὸν λαόν.",
  translation: "The teacher teaches the people.",
  wordBreakdown: [
    { greek: "ὁ διδάσκαλος", meaning: "the teacher", note: "Subject." },
    { greek: "διδάσκει", meaning: "teaches", note: "Chapter 21 verb." },
    { greek: "τὸν λαόν", meaning: "the people", note: "Object." }
  ],
  structure: "Subject → Verb → Object",
  explanation: "διδάσκω takes the person being taught as its object."
},

{
  id: "ch21-003",
  chapter: 21,
  greek: "ὁ μαθητὴς ἐπερωτᾷ τὸν κύριον.",
  translation: "The disciple questions the Lord.",
  wordBreakdown: [
    { greek: "ὁ μαθητής", meaning: "the disciple", note: "Subject." },
    { greek: "ἐπερωτᾷ", meaning: "questions", note: "Chapter 21 verb." },
    { greek: "τὸν κύριον", meaning: "the Lord", note: "Object." }
  ],
  structure: "Subject → Verb → Object",
  explanation: "ἐπερωτάω can imply asking more strongly or questioning."
},

{
  id: "ch21-004",
  chapter: 21,
  greek: "ὁ ἄνθρωπος ἐρωτᾷ τὸν θεόν.",
  translation: "The man asks God.",
  wordBreakdown: [
    { greek: "ὁ ἄνθρωπος", meaning: "the man", note: "Subject." },
    { greek: "ἐρωτᾷ", meaning: "asks/requests", note: "Chapter 21 verb." },
    { greek: "τὸν θεόν", meaning: "God", note: "Object." }
  ],
  structure: "Subject → Verb → Object",
  explanation: "ἐρωτάω is often a more gentle asking compared to ἐπερωτάω."
},

{
  id: "ch21-005",
  chapter: 21,
  greek: "ὁ ἄνθρωπος θέλει ζωήν.",
  translation: "The man desires life.",
  wordBreakdown: [
    { greek: "ὁ ἄνθρωπος", meaning: "the man", note: "Subject." },
    { greek: "θέλει", meaning: "desires/wants", note: "Chapter 21 verb." },
    { greek: "ζωήν", meaning: "life", note: "Object." }
  ],
  structure: "Subject → Verb → Object",
  explanation: "θέλω expresses desire, will, or intention."
},

{
  id: "ch21-006",
  chapter: 21,
  greek: "ὁ μαθητὴς περιπατεῖ ἐν τῇ ὁδῷ.",
  translation: "The disciple walks on the way.",
  wordBreakdown: [
    { greek: "ὁ μαθητής", meaning: "the disciple", note: "Subject." },
    { greek: "περιπατεῖ", meaning: "walks/lives", note: "Chapter 21 verb." },
    { greek: "ἐν τῇ ὁδῷ", meaning: "on the way", note: "Path phrase." }
  ],
  structure: "Subject → Verb → Prepositional Phrase",
  explanation: "περιπατέω can mean physical walking or a way of life."
},

{
  id: "ch21-007",
  chapter: 21,
  greek: "ὁ λαὸς ἐστὶν ἐν τῇ συναγωγῇ.",
  translation: "The people are in the synagogue.",
  wordBreakdown: [
    { greek: "ὁ λαός", meaning: "the people", note: "Subject." },
    { greek: "ἐστίν", meaning: "are", note: "Verb." },
    { greek: "ἐν τῇ συναγωγῇ", meaning: "in the synagogue", note: "Chapter 21 noun." }
  ],
  structure: "Subject → Verb → Prepositional Phrase",
  explanation: "συναγωγή refers to a gathering place for teaching and worship."
},

{
  id: "ch21-008",
  chapter: 21,
  greek: "ὁ Φαρισαῖος ἀκούει τὸν λόγον.",
  translation: "The Pharisee hears the word.",
  wordBreakdown: [
    { greek: "ὁ Φαρισαῖος", meaning: "the Pharisee", note: "Chapter 21 noun." },
    { greek: "ἀκούει", meaning: "hears", note: "Verb." },
    { greek: "τὸν λόγον", meaning: "the word", note: "Object." }
  ],
  structure: "Subject → Verb → Object",
  explanation: "Φαρισαῖος refers to a religious leader group in the NT."
},

{
  id: "ch21-009",
  chapter: 21,
  greek: "ὁ χρόνος ἐστὶν καλός.",
  translation: "The time is good.",
  wordBreakdown: [
    { greek: "ὁ χρόνος", meaning: "time", note: "Chapter 21 noun." },
    { greek: "ἐστίν", meaning: "is", note: "Verb." },
    { greek: "καλός", meaning: "good", note: "Adjective." }
  ],
  structure: "Subject → Verb → Adjective",
  explanation: "χρόνος refers to time in a general sense."
},

{
  id: "ch21-010",
  chapter: 21,
  greek: "ὁ μαθητὴς ἀκολουθεῖ καὶ περιπατεῖ.",
  translation: "The disciple follows and walks.",
  wordBreakdown: [
    { greek: "ἀκολουθεῖ", meaning: "follows", note: "Verb." },
    { greek: "περιπατεῖ", meaning: "walks", note: "Verb." }
  ],
  structure: "Subject → Verb + καί + Verb",
  explanation: "Links following with walking/living as a pattern of life."
},

{
  id: "ch21-011",
  chapter: 21,
  greek: "ὁ διδάσκαλος θέλει διδάσκειν.",
  translation: "The teacher wants to teach.",
  wordBreakdown: [
    { greek: "θέλει", meaning: "wants", note: "Chapter 21 verb." },
    { greek: "διδάσκειν", meaning: "to teach", note: "Helper infinitive from διδάσκω." }
  ],
  structure: "Subject → θέλει → Infinitive",
  explanation: "θέλω often pairs with an infinitive to show what someone desires to do."
},

{
  id: "ch21-012",
  chapter: 21,
  greek: "ὁ μαθητὴς ἐρωτᾷ καὶ ἀκούει.",
  translation: "The disciple asks and hears.",
  wordBreakdown: [
    { greek: "ἐρωτᾷ", meaning: "asks", note: "Verb." },
    { greek: "ἀκούει", meaning: "hears", note: "Verb." }
  ],
  structure: "Subject → Verb + καί + Verb",
  explanation: "Shows interaction: asking followed by listening."
},

{
  id: "ch21-013",
  chapter: 21,
  greek: "ὁ Φαρισαῖος ἐπερωτᾷ τὸν Ἰησοῦν.",
  translation: "The Pharisee questions Jesus.",
  wordBreakdown: [
    { greek: "ὁ Φαρισαῖος", meaning: "the Pharisee", note: "Subject." },
    { greek: "ἐπερωτᾷ", meaning: "questions", note: "Verb." },
    { greek: "τὸν Ἰησοῦν", meaning: "Jesus", note: "Object." }
  ],
  structure: "Subject → Verb → Object",
  explanation: "Often used in dialogue situations."
},

{
  id: "ch21-014",
  chapter: 21,
  greek: "ὁ λαὸς περιπατεῖ ἐν τῷ φωτί.",
  translation: "The people walk in the light.",
  wordBreakdown: [
    { greek: "ὁ λαός", meaning: "the people", note: "Subject." },
    { greek: "περιπατεῖ", meaning: "walks/lives", note: "Verb." },
    { greek: "ἐν τῷ φωτί", meaning: "in the light", note: "Location/figurative phrase." }
  ],
  structure: "Subject → Verb → Prepositional Phrase",
  explanation: "περιπατέω is often used figuratively for how someone lives."
},

{
  id: "ch21-015",
  chapter: 21,
  greek: "ὁ χρόνος ἔρχεται καὶ ἀλλάσσει.",
  translation: "Time comes and changes.",
  wordBreakdown: [
    { greek: "ὁ χρόνος", meaning: "time", note: "Subject." },
    { greek: "ἔρχεται", meaning: "comes", note: "Verb." },
    { greek: "ἀλλάσσει", meaning: "changes", note: "Helper verb (not in Chapter 21), common Greek verb meaning 'to change'." }
  ],
  structure: "Subject → Verb + καί + Verb",
  explanation: "Adds a helper verb to show progression: time comes and brings change."
},

{
  id: "ch21-016",
  chapter: 21,
  greek: "ὁ μαθητὴς θέλει ἀκολουθεῖν τῷ κυρίῳ.",
  translation: "The disciple wants to follow the Lord.",
  wordBreakdown: [
    { greek: "θέλει", meaning: "wants", note: "Verb." },
    { greek: "ἀκολουθεῖν", meaning: "to follow", note: "Infinitive from ἀκολουθέω." }
  ],
  structure: "Subject → θέλει → Infinitive → Object",
  explanation: "θέλω + infinitive expresses desire toward an action."
},

{
  id: "ch21-017",
  chapter: 21,
  greek: "ὁ διδάσκαλος διδάσκει ἐν τῇ συναγωγῇ.",
  translation: "The teacher teaches in the synagogue.",
  wordBreakdown: [
    { greek: "ὁ διδάσκαλος", meaning: "the teacher", note: "Subject." },
    { greek: "διδάσκει", meaning: "teaches", note: "Verb." },
    { greek: "ἐν τῇ συναγωγῇ", meaning: "in the synagogue", note: "Location phrase." }
  ],
  structure: "Subject → Verb → Prepositional Phrase",
  explanation: "Adds location to the teaching action."
},

{
  id: "ch21-018",
  chapter: 21,
  greek: "ὅτε ὁ Ἰησοῦς διδάσκει, ὁ λαὸς ἀκούει.",
  translation: "When Jesus teaches, the people hear.",
  wordBreakdown: [
    { greek: "ὅτε", meaning: "when", note: "Time clause marker." }
  ],
  structure: "ὅτε Clause → Main Clause",
  explanation: "Shows timing relationship between actions."
},

{
  id: "ch21-019",
  chapter: 21,
  greek: "ὁ μαθητὴς ἐρωτᾷ τὸν διδάσκαλον περὶ τοῦ λόγου.",
  translation: "The disciple asks the teacher about the word.",
  wordBreakdown: [
    { greek: "περὶ τοῦ λόγου", meaning: "about the word", note: "Topic phrase." }
  ],
  structure: "Subject → Verb → Object → περὶ Phrase",
  explanation: "περί introduces the topic being discussed."
},

{
  id: "ch21-020",
  chapter: 21,
  greek: "ὁ Φαρισαῖος θέλει κρίνειν τὸν ἄνθρωπον.",
  translation: "The Pharisee wants to judge the man.",
  wordBreakdown: [
    { greek: "θέλει", meaning: "wants", note: "Verb." },
    { greek: "κρίνειν", meaning: "to judge", note: "Infinitive from κρίνω." }
  ],
  structure: "Subject → θέλει → Infinitive → Object",
  explanation: "Shows desire followed by intended action."
},

{
  id: "ch22-001",
  chapter: 22,
  greek: "ὁ ἄνθρωπος ἀποθνῄσκει ἐν τῇ γῇ.",
  translation: "The man dies on the earth.",
  wordBreakdown: [
    { greek: "ὁ ἄνθρωπος", meaning: "the man", note: "Subject." },
    { greek: "ἀποθνῄσκει", meaning: "dies", note: "Chapter 22 verb." },
    { greek: "ἐν τῇ γῇ", meaning: "on the earth", note: "Location phrase." }
  ],
  structure: "Subject → Verb → Prepositional Phrase",
  explanation: "ἀποθνῄσκω means to die and is used for physical death."
},

{
  id: "ch22-002",
  chapter: 22,
  greek: "ὁ μαθητὴς λαμβάνει ἄρτον.",
  translation: "The disciple receives bread.",
  wordBreakdown: [
    { greek: "ὁ μαθητής", meaning: "the disciple", note: "Subject." },
    { greek: "λαμβάνει", meaning: "receives/takes", note: "Chapter 22 verb." },
    { greek: "ἄρτον", meaning: "bread", note: "Chapter 22 noun." }
  ],
  structure: "Subject → Verb → Object",
  explanation: "λαμβάνω often means take or receive something given."
},

{
  id: "ch22-003",
  chapter: 22,
  greek: "ὁ ἄνθρωπος βάλλει λίθον εἰς τὴν γῆν.",
  translation: "The man throws a stone into the ground.",
  wordBreakdown: [
    { greek: "βάλλει", meaning: "throws", note: "Chapter 22 verb." },
    { greek: "λίθον", meaning: "stone", note: "Helper noun (not in this chapter)." }
  ],
  structure: "Subject → Verb → Object → εἰς Phrase",
  explanation: "βάλλω often includes direction using εἰς."
},

{
  id: "ch22-004",
  chapter: 22,
  greek: "ἡ γῆ ἐστὶν ἀγαθή.",
  translation: "The land is good.",
  wordBreakdown: [
    { greek: "ἡ γῆ", meaning: "the earth/land", note: "Chapter 22 noun." },
    { greek: "ἐστίν", meaning: "is", note: "Verb." },
    { greek: "ἀγαθή", meaning: "good", note: "Adjective." }
  ],
  structure: "Subject → Verb → Adjective",
  explanation: "γῆ can mean earth, land, or region depending on context."
},

{
  id: "ch22-005",
  chapter: 22,
  greek: "ὁ λόγος γίνεται ζωή.",
  translation: "The word becomes life.",
  wordBreakdown: [
    { greek: "ὁ λόγος", meaning: "the word", note: "Subject." },
    { greek: "γίνεται", meaning: "becomes", note: "Chapter 22 verb." },
    { greek: "ζωή", meaning: "life", note: "Predicate." }
  ],
  structure: "Subject → Verb → Predicate",
  explanation: "γίνομαι expresses becoming or happening."
},

{
  id: "ch22-006",
  chapter: 22,
  greek: "ὁ μαθητὴς εἰσέρχεται εἰς τὴν οἰκίαν.",
  translation: "The disciple enters the house.",
  wordBreakdown: [
    { greek: "εἰσέρχεται", meaning: "enters", note: "Chapter 22 verb." }
  ],
  structure: "Subject → Verb → εἰς Phrase",
  explanation: "εἰσέρχομαι means to go into something."
},

{
  id: "ch22-007",
  chapter: 22,
  greek: "ὁ ἄνθρωπος ἐξέρχεται ἐκ τῆς πόλεως.",
  translation: "The man goes out of the city.",
  wordBreakdown: [
    { greek: "ἐξέρχεται", meaning: "goes out", note: "Chapter 22 verb." }
  ],
  structure: "Subject → Verb → ἐκ Phrase",
  explanation: "ἐξέρχομαι shows movement out from a place."
},

{
  id: "ch22-008",
  chapter: 22,
  greek: "ὁ μαθητὴς ἔτι ἀκούει τὸν λόγον.",
  translation: "The disciple still hears the word.",
  wordBreakdown: [
    { greek: "ἔτι", meaning: "still/yet", note: "Chapter 22 adverb." }
  ],
  structure: "Subject → Adverb → Verb → Object",
  explanation: "ἔτι emphasizes continuation: still or yet."
},

{
  id: "ch22-009",
  chapter: 22,
  greek: "ὁ ἄνθρωπος εὑρίσκει τὴν ἀλήθειαν.",
  translation: "The man finds the truth.",
  wordBreakdown: [
    { greek: "εὑρίσκει", meaning: "finds", note: "Chapter 22 verb." }
  ],
  structure: "Subject → Verb → Object",
  explanation: "εὑρίσκω often pairs naturally with seeking (ζητέω)."
},

{
  id: "ch22-010",
  chapter: 22,
  greek: "ὁ μαθητὴς λαμβάνει καὶ δίδωσιν.",
  translation: "The disciple receives and gives.",
  wordBreakdown: [
    { greek: "λαμβάνει", meaning: "receives", note: "Verb." },
    { greek: "δίδωσιν", meaning: "gives", note: "Helper verb (common NT word)." }
  ],
  structure: "Subject → Verb + καί + Verb",
  explanation: "Shows receiving and then giving as connected actions."
},

{
  id: "ch22-011",
  chapter: 22,
  greek: "οὔτε ὁ ἄνθρωπος οὔτε ὁ μαθητὴς βλέπει.",
  translation: "Neither the man nor the disciple sees.",
  wordBreakdown: [
    { greek: "οὔτε...οὔτε", meaning: "neither...nor", note: "Chapter 22 structure." }
  ],
  structure: "οὔτε Subject οὔτε Subject → Verb",
  explanation: "οὔτε…οὔτε connects two negatives together."
},

{
  id: "ch22-012",
  chapter: 22,
  greek: "ὁ ἄνθρωπος προσέρχεται τῷ κυρίῳ.",
  translation: "The man comes to the Lord.",
  wordBreakdown: [
    { greek: "προσέρχεται", meaning: "comes to", note: "Chapter 22 verb." }
  ],
  structure: "Subject → Verb → Object",
  explanation: "προσέρχομαι emphasizes approaching someone."
},

{
  id: "ch22-013",
  chapter: 22,
  greek: "ὁ μαθητὴς προσεύχεται τῷ θεῷ.",
  translation: "The disciple prays to God.",
  wordBreakdown: [
    { greek: "προσεύχεται", meaning: "prays", note: "Chapter 22 verb." }
  ],
  structure: "Subject → Verb → Object",
  explanation: "προσεύχομαι is used for prayer directed toward God."
},

{
  id: "ch22-014",
  chapter: 22,
  greek: "τὸ πῦρ καίει τὴν γῆν.",
  translation: "The fire burns the land.",
  wordBreakdown: [
    { greek: "τὸ πῦρ", meaning: "the fire", note: "Chapter 22 noun." },
    { greek: "καίει", meaning: "burns", note: "Helper verb (common Greek verb)." }
  ],
  structure: "Subject → Verb → Object",
  explanation: "Adds a helper verb to show the effect of fire."
},

{
  id: "ch22-015",
  chapter: 22,
  greek: "ὁ μαθητὴς εἰσέρχεται καὶ ἐξέρχεται.",
  translation: "The disciple enters and goes out.",
  wordBreakdown: [
    { greek: "εἰσέρχεται / ἐξέρχεται", meaning: "enters / goes out", note: "Chapter 22 verbs." }
  ],
  structure: "Subject → Verb + καί + Verb",
  explanation: "Shows opposite movements together."
},

{
  id: "ch22-016",
  chapter: 22,
  greek: "ὁ ἄνθρωπος γίγνεται σοφός.",
  translation: "The man becomes wise.",
  wordBreakdown: [
    { greek: "γίγνεται", meaning: "becomes", note: "Chapter 22 verb." },
    { greek: "σοφός", meaning: "wise", note: "From σοφία." }
  ],
  structure: "Subject → Verb → Adjective",
  explanation: "γίνομαι + adjective shows a change of state."
},

{
  id: "ch22-017",
  chapter: 22,
  greek: "ὁ λαὸς ἔτι μένει ἐκεῖ.",
  translation: "The people still remain there.",
  wordBreakdown: [
    { greek: "ἔτι", meaning: "still", note: "Adverb." },
    { greek: "μένει", meaning: "remains", note: "Verb." },
    { greek: "ἐκεῖ", meaning: "there", note: "Location." }
  ],
  structure: "Subject → Adverb → Verb → Location",
  explanation: "Combines continuation (ἔτι) with location (ἐκεῖ)."
},

{
  id: "ch22-018",
  chapter: 22,
  greek: "ὅταν ὁ μαθητὴς προσεύχηται, ὁ θεὸς ἀκούει.",
  translation: "Whenever the disciple prays, God hears.",
  wordBreakdown: [
    { greek: "ὅταν", meaning: "whenever", note: "Time clause marker." }
  ],
  structure: "ὅταν Clause → Main Clause",
  explanation: "Shows repeated relationship between actions."
},

{
  id: "ch22-019",
  chapter: 22,
  greek: "ὁ ἄνθρωπος λαμβάνει πῦρ καὶ βάλλει εἰς τὴν γῆν.",
  translation: "The man takes fire and throws it into the ground.",
  wordBreakdown: [
    { greek: "λαμβάνει", meaning: "takes", note: "Verb." },
    { greek: "πῦρ", meaning: "fire", note: "Object." },
    { greek: "βάλλει", meaning: "throws", note: "Verb." }
  ],
  structure: "Subject → Verb → Object + καί + Verb → Phrase",
  explanation: "Combines sequential actions using καί."
},

{
  id: "ch22-020",
  chapter: 22,
  greek: "ὁ θεὸς σῴζει καὶ γίγνεται ἐν τῷ λαῷ.",
  translation: "God saves and is present among the people.",
  wordBreakdown: [
    { greek: "σῴζει", meaning: "saves", note: "Verb." },
    { greek: "γίγνεται", meaning: "is/becomes", note: "Chapter 22 verb." }
  ],
  structure: "Subject → Verb + καί + Verb → Phrase",
  explanation: "γίνομαι can describe being or becoming present in a situation."
},

{
  id: "ch23-001",
  chapter: 23,
  greek: "ὁ μαθητὴς ἀπέρχεται ἐκ τῆς πόλεως.",
  translation: "The disciple departs from the city.",
  wordBreakdown: [
    { greek: "ὁ μαθητής", meaning: "the disciple", note: "Subject." },
    { greek: "ἀπέρχεται", meaning: "departs/goes away", note: "Chapter 23 verb." },
    { greek: "ἐκ τῆς πόλεως", meaning: "from the city", note: "Source phrase." }
  ],
  structure: "Subject → Verb → ἐκ Phrase",
  explanation: "ἀπέρχομαι emphasizes going away from a place."
},

{
  id: "ch23-002",
  chapter: 23,
  greek: "ὁ βασιλεὺς ἄρχει τοῦ λαοῦ.",
  translation: "The king rules the people.",
  wordBreakdown: [
    { greek: "ὁ βασιλεύς", meaning: "the king", note: "Subject." },
    { greek: "ἄρχει", meaning: "rules", note: "Chapter 23 verb." },
    { greek: "τοῦ λαοῦ", meaning: "the people", note: "Those being ruled." }
  ],
  structure: "Subject → Verb → Object",
  explanation: "ἄρχω can mean rule or begin depending on context."
},

{
  id: "ch23-003",
  chapter: 23,
  greek: "ὁ ἄνθρωπος γράφει λόγον.",
  translation: "The man writes a word.",
  wordBreakdown: [
    { greek: "γράφει", meaning: "writes", note: "Chapter 23 verb." }
  ],
  structure: "Subject → Verb → Object",
  explanation: "γράφω means to write or record."
},

{
  id: "ch23-004",
  chapter: 23,
  greek: "ὁ θεὸς δοξάζει τὸν υἱόν.",
  translation: "God glorifies the Son.",
  wordBreakdown: [
    { greek: "δοξάζει", meaning: "glorifies", note: "Chapter 23 verb." }
  ],
  structure: "Subject → Verb → Object",
  explanation: "δοξάζω means to honor, glorify, or praise."
},

{
  id: "ch23-005",
  chapter: 23,
  greek: "ὁ μαθητὴς κηρύσσει τὸ εὐαγγέλιον.",
  translation: "The disciple proclaims the gospel.",
  wordBreakdown: [
    { greek: "κηρύσσει", meaning: "proclaims/preaches", note: "Chapter 23 verb." },
    { greek: "τὸ εὐαγγέλιον", meaning: "the gospel", note: "Object." }
  ],
  structure: "Subject → Verb → Object",
  explanation: "κηρύσσω refers to public proclamation."
},

{
  id: "ch23-006",
  chapter: 23,
  greek: "ὁ ἄνθρωπος πίνει ὕδωρ.",
  translation: "The man drinks water.",
  wordBreakdown: [
    { greek: "πίνει", meaning: "drinks", note: "Chapter 23 verb." },
    { greek: "ὕδωρ", meaning: "water", note: "Object." }
  ],
  structure: "Subject → Verb → Object",
  explanation: "πίνω is used for drinking."
},

{
  id: "ch23-007",
  chapter: 23,
  greek: "ἡ δύναμις τοῦ θεοῦ ἐστὶν μεγάλη.",
  translation: "The power of God is great.",
  wordBreakdown: [
    { greek: "ἡ δύναμις", meaning: "power", note: "Chapter 23 noun." },
    { greek: "τοῦ θεοῦ", meaning: "of God", note: "Possession." }
  ],
  structure: "Subject → Genitive → Verb → Adjective",
  explanation: "δύναμις can mean power or miracle-working power."
},

{
  id: "ch23-008",
  chapter: 23,
  greek: "ὁ μαθητὴς ἀπέρχεται καὶ κηρύσσει.",
  translation: "The disciple departs and proclaims.",
  wordBreakdown: [
    { greek: "ἀπέρχεται", meaning: "departs", note: "Verb." },
    { greek: "κηρύσσει", meaning: "proclaims", note: "Verb." }
  ],
  structure: "Subject → Verb + καί + Verb",
  explanation: "Shows sequence: going and then proclaiming."
},

{
  id: "ch23-009",
  chapter: 23,
  greek: "ὁ ἄνθρωπος γράφει καὶ διδάσκει.",
  translation: "The man writes and teaches.",
  wordBreakdown: [
    { greek: "γράφει", meaning: "writes", note: "Verb." },
    { greek: "διδάσκει", meaning: "teaches", note: "Helper verb (from earlier vocab)." }
  ],
  structure: "Subject → Verb + καί + Verb",
  explanation: "Combines writing with teaching."
},

{
  id: "ch23-010",
  chapter: 23,
  greek: "διὸ ὁ μαθητὴς πιστεύει.",
  translation: "Therefore the disciple believes.",
  wordBreakdown: [
    { greek: "διό", meaning: "therefore", note: "Chapter 23 connector." }
  ],
  structure: "Connector → Subject → Verb",
  explanation: "διό introduces a conclusion or result."
},

{
  id: "ch23-011",
  chapter: 23,
  greek: "ὁ θεὸς δοξάζει καὶ σῴζει.",
  translation: "God glorifies and saves.",
  wordBreakdown: [
    { greek: "δοξάζει", meaning: "glorifies", note: "Verb." },
    { greek: "σῴζει", meaning: "saves", note: "Verb." }
  ],
  structure: "Subject → Verb + καί + Verb",
  explanation: "Two actions done by the same subject."
},

{
  id: "ch23-012",
  chapter: 23,
  greek: "ὁ βασιλεὺς ἄρχει καὶ κρίνει.",
  translation: "The king rules and judges.",
  wordBreakdown: [
    { greek: "ἄρχει", meaning: "rules", note: "Verb." },
    { greek: "κρίνει", meaning: "judges", note: "Verb." }
  ],
  structure: "Subject → Verb + καί + Verb",
  explanation: "Shows authority through ruling and judging."
},

{
  id: "ch23-013",
  chapter: 23,
  greek: "ὁ μαθητὴς πίνει καὶ λαμβάνει.",
  translation: "The disciple drinks and receives.",
  wordBreakdown: [
    { greek: "πίνει", meaning: "drinks", note: "Verb." },
    { greek: "λαμβάνει", meaning: "receives", note: "Verb." }
  ],
  structure: "Subject → Verb + καί + Verb",
  explanation: "Combines physical and receiving actions."
},

{
  id: "ch23-014",
  chapter: 23,
  greek: "ἡ δύναμις γίνεται ἐν τῷ λαῷ.",
  translation: "Power happens among the people.",
  wordBreakdown: [
    { greek: "ἡ δύναμις", meaning: "power", note: "Subject." },
    { greek: "γίνεται", meaning: "happens/becomes", note: "Verb." }
  ],
  structure: "Subject → Verb → Prepositional Phrase",
  explanation: "γίνομαι can describe something happening or coming into being."
},

{
  id: "ch23-015",
  chapter: 23,
  greek: "ὁ μαθητὴς γράφει περὶ τοῦ λόγου.",
  translation: "The disciple writes about the word.",
  wordBreakdown: [
    { greek: "γράφει", meaning: "writes", note: "Verb." },
    { greek: "περὶ τοῦ λόγου", meaning: "about the word", note: "Topic phrase." }
  ],
  structure: "Subject → Verb → περὶ Phrase",
  explanation: "περί introduces the topic of writing."
},

{
  id: "ch23-016",
  chapter: 23,
  greek: "ὁ θεὸς ἄρχει ἐν τῷ κόσμῳ.",
  translation: "God rules in the world.",
  wordBreakdown: [
    { greek: "ἄρχει", meaning: "rules", note: "Verb." }
  ],
  structure: "Subject → Verb → Prepositional Phrase",
  explanation: "Adds location to ruling authority."
},

{
  id: "ch23-017",
  chapter: 23,
  greek: "διὸ ὁ ἄνθρωπος δοξάζει τὸν θεόν.",
  translation: "Therefore the man glorifies God.",
  wordBreakdown: [
    { greek: "διό", meaning: "therefore", note: "Connector." },
    { greek: "δοξάζει", meaning: "glorifies", note: "Verb." }
  ],
  structure: "Connector → Subject → Verb → Object",
  explanation: "Shows cause and response."
},

{
  id: "ch23-018",
  chapter: 23,
  greek: "ὁ μαθητὴς ἀπέρχεται ἐν χρόνῳ.",
  translation: "The disciple departs in time.",
  wordBreakdown: [
    { greek: "ὁ μαθητής", meaning: "the disciple", note: "Subject." },
    { greek: "ἀπέρχεται", meaning: "departs", note: "Verb." },
    { greek: "ἐν χρόνῳ", meaning: "in time", note: "Time phrase." }
  ],
  structure: "Subject → Verb → Time Phrase",
  explanation: "χρόνος refers to time in general."
},

{
  id: "ch23-019",
  chapter: 23,
  greek: "ὁ λαὸς κηρύσσει καὶ δοξάζει.",
  translation: "The people proclaim and glorify.",
  wordBreakdown: [
    { greek: "κηρύσσει", meaning: "proclaims", note: "Verb." },
    { greek: "δοξάζει", meaning: "glorifies", note: "Verb." }
  ],
  structure: "Subject → Verb + καί + Verb",
  explanation: "Shows two public actions done by the people."
},

{
  id: "ch23-020",
  chapter: 23,
  greek: "ὅτε ὁ μαθητὴς γράφει, ὁ λαὸς ἀκούει.",
  translation: "When the disciple writes, the people hear.",
  wordBreakdown: [
    { greek: "ὅτε", meaning: "when", note: "Time clause marker." }
  ],
  structure: "ὅτε Clause → Main Clause",
  explanation: "Shows timing between writing and hearing."
},

{
  id: "ch24-001",
  chapter: 24,
  greek: "ὁ Ἰησοῦς ἄγει τὸν μαθητήν.",
  translation: "Jesus leads the disciple.",
  wordBreakdown: [
    { greek: "ὁ Ἰησοῦς", meaning: "Jesus", note: "Subject." },
    { greek: "ἄγει", meaning: "leads/brings", note: "Chapter 24 verb." },
    { greek: "τὸν μαθητήν", meaning: "the disciple", note: "Object." }
  ],
  structure: "Subject → Verb → Object",
  explanation: "ἄγω can mean lead, bring, or arrest depending on context."
},

{
  id: "ch24-002",
  chapter: 24,
  greek: "τὸ αἷμα ἐστὶν ἐν τῇ γῇ.",
  translation: "The blood is on the ground.",
  wordBreakdown: [
    { greek: "τὸ αἷμα", meaning: "the blood", note: "Chapter 24 noun." },
    { greek: "ἐστίν", meaning: "is", note: "Verb." },
    { greek: "ἐν τῇ γῇ", meaning: "on/in the ground", note: "Location phrase." }
  ],
  structure: "Subject → Verb → Prepositional Phrase",
  explanation: "γῆ can mean earth, land, or ground depending on context."
},

{
  id: "ch24-003",
  chapter: 24,
  greek: "ἕκαστος μαθητὴς ἀκούει τὸν λόγον.",
  translation: "Each disciple hears the word.",
  wordBreakdown: [
    { greek: "ἕκαστος", meaning: "each/every", note: "Chapter 24 adjective." },
    { greek: "μαθητής", meaning: "disciple", note: "Noun being described." },
    { greek: "ἀκούει τὸν λόγον", meaning: "hears the word", note: "Verb + object." }
  ],
  structure: "Each + Subject → Verb → Object",
  explanation: "ἕκαστος focuses on each individual member of a group."
},

{
  id: "ch24-004",
  chapter: 24,
  greek: "ὁ ἄνθρωπος λαμβάνει τὸ ἱμάτιον.",
  translation: "The man receives the garment.",
  wordBreakdown: [
    { greek: "ὁ ἄνθρωπος", meaning: "the man", note: "Subject." },
    { greek: "λαμβάνει", meaning: "receives/takes", note: "Verb." },
    { greek: "τὸ ἱμάτιον", meaning: "the garment", note: "Chapter 24 noun." }
  ],
  structure: "Subject → Verb → Object",
  explanation: "ἱμάτιον refers to a garment or outer clothing."
},

{
  id: "ch24-005",
  chapter: 24,
  greek: "ὁ κύριος ἐστὶν ἐπὶ τοῦ ὄρους.",
  translation: "The Lord is on the mountain.",
  wordBreakdown: [
    { greek: "ὁ κύριος", meaning: "the Lord", note: "Subject." },
    { greek: "ἐστίν", meaning: "is", note: "Verb." },
    { greek: "ἐπὶ τοῦ ὄρους", meaning: "on the mountain", note: "Chapter 24 location phrase." }
  ],
  structure: "Subject → Verb → ἐπί Phrase",
  explanation: "ὄρος means mountain or hill, often used for important teaching scenes."
},

{
  id: "ch24-006",
  chapter: 24,
  greek: "ὁ μαθητὴς ὑπάγει ἐκ τῆς πόλεως.",
  translation: "The disciple departs from the city.",
  wordBreakdown: [
    { greek: "ὁ μαθητής", meaning: "the disciple", note: "Subject." },
    { greek: "ὑπάγει", meaning: "departs/goes away", note: "Chapter 24 verb." },
    { greek: "ἐκ τῆς πόλεως", meaning: "from the city", note: "Source phrase." }
  ],
  structure: "Subject → Verb → ἐκ Phrase",
  explanation: "ὑπάγω usually means to go away or depart."
},

{
  id: "ch24-007",
  chapter: 24,
  greek: "ὁ ἄνθρωπος φοβεῖται τὸν θάνατον.",
  translation: "The man fears death.",
  wordBreakdown: [
    { greek: "ὁ ἄνθρωπος", meaning: "the man", note: "Subject." },
    { greek: "φοβεῖται", meaning: "fears", note: "Chapter 24 verb." },
    { greek: "τὸν θάνατον", meaning: "death", note: "Object." }
  ],
  structure: "Subject → Verb → Object",
  explanation: "φοβέομαι is middle/passive in form but often translates actively: “I fear.”"
},

{
  id: "ch24-008",
  chapter: 24,
  greek: "ὁ λαὸς χαίρει ἐν τῇ χαρᾷ.",
  translation: "The people rejoice in joy.",
  wordBreakdown: [
    { greek: "ὁ λαός", meaning: "the people", note: "Subject." },
    { greek: "χαίρει", meaning: "rejoices", note: "Chapter 24 verb." },
    { greek: "ἐν τῇ χαρᾷ", meaning: "in joy", note: "Related noun phrase." }
  ],
  structure: "Subject → Verb → Prepositional Phrase",
  explanation: "χαίρω is the verb form related to χαρά, meaning joy."
},

{
  id: "ch24-009",
  chapter: 24,
  greek: "ὁ βασιλεὺς ἄγει τὸν λαόν εἰς τὴν πόλιν.",
  translation: "The king leads the people into the city.",
  wordBreakdown: [
    { greek: "ὁ βασιλεύς", meaning: "the king", note: "Subject." },
    { greek: "ἄγει", meaning: "leads", note: "Chapter 24 verb." },
    { greek: "τὸν λαόν", meaning: "the people", note: "Object." },
    { greek: "εἰς τὴν πόλιν", meaning: "into the city", note: "Direction phrase." }
  ],
  structure: "Subject → Verb → Object → εἰς Phrase",
  explanation: "ἄγω can take both an object and a direction phrase."
},

{
  id: "ch24-010",
  chapter: 24,
  greek: "ἕκαστος ἀδελφὸς ἔχει ἱμάτιον.",
  translation: "Each brother has a garment.",
  wordBreakdown: [
    { greek: "ἕκαστος ἀδελφός", meaning: "each brother", note: "Subject phrase." },
    { greek: "ἔχει", meaning: "has", note: "Verb." },
    { greek: "ἱμάτιον", meaning: "garment", note: "Object." }
  ],
  structure: "Each + Subject → Verb → Object",
  explanation: "ἕκαστος makes the statement apply individually to each person."
},

{
  id: "ch24-011",
  chapter: 24,
  greek: "ὁ Ἰησοῦς ἄγει τοὺς μαθητὰς εἰς τὸ ὄρος.",
  translation: "Jesus leads the disciples to the mountain.",
  wordBreakdown: [
    { greek: "ὁ Ἰησοῦς", meaning: "Jesus", note: "Subject." },
    { greek: "ἄγει", meaning: "leads", note: "Chapter 24 verb." },
    { greek: "τοὺς μαθητάς", meaning: "the disciples", note: "Object." },
    { greek: "εἰς τὸ ὄρος", meaning: "to the mountain", note: "Direction phrase." }
  ],
  structure: "Subject → Verb → Object → εἰς Phrase",
  explanation: "εἰς shows movement toward the mountain."
},

{
  id: "ch24-012",
  chapter: 24,
  greek: "ὅτε ὁ κύριος λέγει, ὁ μαθητὴς οὐ φοβεῖται.",
  translation: "When the Lord speaks, the disciple does not fear.",
  wordBreakdown: [
    { greek: "ὅτε", meaning: "when", note: "Time clause marker." },
    { greek: "ὁ κύριος λέγει", meaning: "the Lord speaks", note: "Time clause." },
    { greek: "οὐ φοβεῖται", meaning: "does not fear", note: "Negated Chapter 24 verb." }
  ],
  structure: "ὅτε Clause → Main Clause",
  explanation: "οὐ negates φοβεῖται, showing the disciple does not fear."
},

{
  id: "ch24-013",
  chapter: 24,
  greek: "ὁ ἄνθρωπος βλέπει αἷμα καὶ φοβεῖται.",
  translation: "The man sees blood and fears.",
  wordBreakdown: [
    { greek: "βλέπει", meaning: "sees", note: "Verb." },
    { greek: "αἷμα", meaning: "blood", note: "Chapter 24 noun." },
    { greek: "φοβεῖται", meaning: "fears", note: "Chapter 24 verb." }
  ],
  structure: "Subject → Verb → Object + καί + Verb",
  explanation: "καί connects the seeing with the response of fear."
},

{
  id: "ch24-014",
  chapter: 24,
  greek: "ὁ μαθητὴς ὑπάγει, ἀλλὰ ὁ ἀδελφὸς μένει.",
  translation: "The disciple departs, but the brother remains.",
  wordBreakdown: [
    { greek: "ὁ μαθητὴς ὑπάγει", meaning: "the disciple departs", note: "First clause." },
    { greek: "ἀλλά", meaning: "but", note: "Contrast word." },
    { greek: "ὁ ἀδελφὸς μένει", meaning: "the brother remains", note: "Second clause." }
  ],
  structure: "Clause + ἀλλά + Clause",
  explanation: "ἀλλά contrasts departing with remaining."
},

{
  id: "ch24-015",
  chapter: 24,
  greek: "ἕκαστος ἄνθρωπος χαίρει ἐν τῷ κυρίῳ.",
  translation: "Each man rejoices in the Lord.",
  wordBreakdown: [
    { greek: "ἕκαστος ἄνθρωπος", meaning: "each man/person", note: "Subject phrase." },
    { greek: "χαίρει", meaning: "rejoices", note: "Chapter 24 verb." },
    { greek: "ἐν τῷ κυρίῳ", meaning: "in the Lord", note: "Sphere/source phrase." }
  ],
  structure: "Each + Subject → Verb → Phrase",
  explanation: "ἐν can show the sphere or basis of rejoicing."
},

{
  id: "ch24-016",
  chapter: 24,
  greek: "ὁ Ἰησοῦς λαμβάνει τὸ ἱμάτιον καὶ ὑπάγει.",
  translation: "Jesus takes the garment and departs.",
  wordBreakdown: [
    { greek: "λαμβάνει", meaning: "takes", note: "Verb." },
    { greek: "τὸ ἱμάτιον", meaning: "the garment", note: "Object." },
    { greek: "ὑπάγει", meaning: "departs", note: "Chapter 24 verb." }
  ],
  structure: "Subject → Verb → Object + καί + Verb",
  explanation: "καί connects a taken object with the next action."
},

{
  id: "ch24-017",
  chapter: 24,
  greek: "ὁ μαθητὴς φοβεῖται τὸ πῦρ.",
  translation: "The disciple fears the fire.",
  wordBreakdown: [
    { greek: "ὁ μαθητής", meaning: "the disciple", note: "Subject." },
    { greek: "φοβεῖται", meaning: "fears", note: "Chapter 24 verb." },
    { greek: "τὸ πῦρ", meaning: "the fire", note: "Object." }
  ],
  structure: "Subject → Verb → Object",
  explanation: "φοβέομαι takes the thing feared as its object."
},

{
  id: "ch24-018",
  chapter: 24,
  greek: "ὁ κύριος ἄγει τὸν λαὸν ἀπὸ τοῦ ὄρους.",
  translation: "The Lord leads the people from the mountain.",
  wordBreakdown: [
    { greek: "ὁ κύριος", meaning: "the Lord", note: "Subject." },
    { greek: "ἄγει", meaning: "leads", note: "Chapter 24 verb." },
    { greek: "τὸν λαόν", meaning: "the people", note: "Object." },
    { greek: "ἀπὸ τοῦ ὄρους", meaning: "from the mountain", note: "Source phrase." }
  ],
  structure: "Subject → Verb → Object → ἀπό Phrase",
  explanation: "ἀπό shows the place from which the movement begins."
},

{
  id: "ch24-019",
  chapter: 24,
  greek: "ἕκαστος δοῦλος ὑπάγει εἰς τὸν τόπον.",
  translation: "Each servant departs to the place.",
  wordBreakdown: [
    { greek: "ἕκαστος δοῦλος", meaning: "each servant", note: "Subject phrase." },
    { greek: "ὑπάγει", meaning: "departs", note: "Chapter 24 verb." },
    { greek: "εἰς τὸν τόπον", meaning: "to the place", note: "Direction phrase." }
  ],
  structure: "Each + Subject → Verb → Direction Phrase",
  explanation: "ἕκαστος keeps the focus on each individual servant."
},

{
  id: "ch24-020",
  chapter: 24,
  greek: "ὁ λαὸς χαίρει, ὅτι ὁ βασιλεὺς ἄγει αὐτούς.",
  translation: "The people rejoice because the king leads them.",
  wordBreakdown: [
    { greek: "ὁ λαὸς χαίρει", meaning: "the people rejoice", note: "Main clause." },
    { greek: "ὅτι", meaning: "because", note: "Reason marker." },
    { greek: "ὁ βασιλεὺς ἄγει αὐτούς", meaning: "the king leads them", note: "Reason clause." }
  ],
  structure: "Main Clause → ὅτι Clause",
  explanation: "ὅτι explains the reason for the rejoicing."
},

{
  id: "ch25-001",
  chapter: 25,
  greek: "ὁ μαθητὴς αἰτεῖ τὸν ἄρτον.",
  translation: "The disciple asks for bread.",
  wordBreakdown: [
    { greek: "ὁ μαθητής", meaning: "the disciple", note: "Subject." },
    { greek: "αἰτεῖ", meaning: "asks/demands", note: "Chapter 25 verb." },
    { greek: "τὸν ἄρτον", meaning: "the bread", note: "Object." }
  ],
  structure: "Subject → Verb → Object",
  explanation: "αἰτέω often means to ask for something directly."
},

{
  id: "ch25-002",
  chapter: 25,
  greek: "ὁ ἄνθρωπος μαρτυρεῖ περὶ τῆς ἀληθείας.",
  translation: "The man testifies about the truth.",
  wordBreakdown: [
    { greek: "μαρτυρεῖ", meaning: "testifies", note: "Chapter 25 verb." },
    { greek: "περὶ τῆς ἀληθείας", meaning: "about the truth", note: "Topic phrase." }
  ],
  structure: "Subject → Verb → περὶ Phrase",
  explanation: "μαρτυρέω means to bear witness or testify."
},

{
  id: "ch25-003",
  chapter: 25,
  greek: "ὁ μαθητὴς θέλει μᾶλλον ἀκολουθεῖν.",
  translation: "The disciple wants rather to follow.",
  wordBreakdown: [
    { greek: "θέλει", meaning: "wants", note: "Verb." },
    { greek: "μᾶλλον", meaning: "rather/more", note: "Chapter 25 adverb." },
    { greek: "ἀκολουθεῖν", meaning: "to follow", note: "Infinitive." }
  ],
  structure: "Subject → Verb → μᾶλλον → Infinitive",
  explanation: "μᾶλλον compares preference: rather or more."
},

{
  id: "ch25-004",
  chapter: 25,
  greek: "ὁ ἄνθρωπος αἰτεῖ καὶ λαμβάνει.",
  translation: "The man asks and receives.",
  wordBreakdown: [
    { greek: "αἰτεῖ", meaning: "asks", note: "Chapter 25 verb." },
    { greek: "λαμβάνει", meaning: "receives", note: "Verb." }
  ],
  structure: "Subject → Verb + καί + Verb",
  explanation: "Shows a natural sequence: asking followed by receiving."
},

{
  id: "ch25-005",
  chapter: 25,
  greek: "ὁ μάρτυς μαρτυρεῖ τὸν λόγον.",
  translation: "The witness testifies to the word.",
  wordBreakdown: [
    { greek: "ὁ μάρτυς", meaning: "the witness", note: "Helper noun (related to μαρτυρέω)." },
    { greek: "μαρτυρεῖ", meaning: "testifies", note: "Chapter 25 verb." },
    { greek: "τὸν λόγον", meaning: "the word", note: "Object." }
  ],
  structure: "Subject → Verb → Object",
  explanation: "μαρτυρέω often connects with the idea of witness."
},

{
  id: "ch25-006",
  chapter: 25,
  greek: "ὁ μαθητὴς αἰτεῖ ἐν πίστει.",
  translation: "The disciple asks in faith.",
  wordBreakdown: [
    { greek: "αἰτεῖ", meaning: "asks", note: "Chapter 25 verb." },
    { greek: "ἐν πίστει", meaning: "in faith", note: "Manner phrase." }
  ],
  structure: "Subject → Verb → Prepositional Phrase",
  explanation: "ἐν can describe the manner in which something is done."
},

{
  id: "ch25-007",
  chapter: 25,
  greek: "ὁ ἄνθρωπος μᾶλλον φοβεῖται τὸν θάνατον.",
  translation: "The man fears death more.",
  wordBreakdown: [
    { greek: "μᾶλλον", meaning: "more/rather", note: "Chapter 25 adverb." },
    { greek: "φοβεῖται", meaning: "fears", note: "Verb." }
  ],
  structure: "Subject → μᾶλλον → Verb → Object",
  explanation: "μᾶλλον modifies the verb, intensifying the action."
},

{
  id: "ch25-008",
  chapter: 25,
  greek: "ὁ μαθητὴς μαρτυρεῖ καὶ διδάσκει.",
  translation: "The disciple testifies and teaches.",
  wordBreakdown: [
    { greek: "μαρτυρεῖ", meaning: "testifies", note: "Chapter 25 verb." },
    { greek: "διδάσκει", meaning: "teaches", note: "Verb." }
  ],
  structure: "Subject → Verb + καί + Verb",
  explanation: "Links witness and teaching as related actions."
},

{
  id: "ch25-009",
  chapter: 25,
  greek: "ὁ ἄνθρωπος αἰτεῖ τὸν θεὸν περὶ ζωῆς.",
  translation: "The man asks God about life.",
  wordBreakdown: [
    { greek: "αἰτεῖ", meaning: "asks", note: "Chapter 25 verb." },
    { greek: "περὶ ζωῆς", meaning: "about life", note: "Topic phrase." }
  ],
  structure: "Subject → Verb → Object → περὶ Phrase",
  explanation: "περί introduces the subject of the request."
},

{
  id: "ch25-010",
  chapter: 25,
  greek: "ὁ μαθητὴς θέλει μᾶλλον μαρτυρεῖν.",
  translation: "The disciple wants rather to testify.",
  wordBreakdown: [
    { greek: "θέλει", meaning: "wants", note: "Verb." },
    { greek: "μᾶλλον", meaning: "rather", note: "Chapter 25 adverb." },
    { greek: "μαρτυρεῖν", meaning: "to testify", note: "Infinitive." }
  ],
  structure: "Subject → Verb → μᾶλλον → Infinitive",
  explanation: "Shows preference toward testifying."
},

{
  id: "ch25-011",
  chapter: 25,
  greek: "ὁ θεὸς ἀκούει ὅταν ὁ ἄνθρωπος αἰτεῖ.",
  translation: "God hears whenever the man asks.",
  wordBreakdown: [
    { greek: "ὅταν", meaning: "whenever", note: "Time clause marker." },
    { greek: "αἰτεῖ", meaning: "asks", note: "Chapter 25 verb." }
  ],
  structure: "Main Clause → ὅταν Clause",
  explanation: "ὅταν introduces repeated or general time."
},

{
  id: "ch25-012",
  chapter: 25,
  greek: "ὁ μαθητὴς μᾶλλον ἀκολουθεῖ τῷ κυρίῳ.",
  translation: "The disciple follows the Lord more.",
  wordBreakdown: [
    { greek: "μᾶλλον", meaning: "more", note: "Chapter 25 adverb." }
  ],
  structure: "Subject → μᾶλλον → Verb → Object",
  explanation: "μᾶλλον shows increase or stronger degree."
},

{
  id: "ch25-013",
  chapter: 25,
  greek: "ὁ ἄνθρωπος μαρτυρεῖ τὴν ἀλήθειαν καὶ πιστεύει.",
  translation: "The man testifies to the truth and believes.",
  wordBreakdown: [
    { greek: "μαρτυρεῖ", meaning: "testifies", note: "Verb." },
    { greek: "πιστεύει", meaning: "believes", note: "Verb." }
  ],
  structure: "Subject → Verb → Object + καί + Verb",
  explanation: "Combines testimony with belief."
},

{
  id: "ch25-014",
  chapter: 25,
  greek: "ὁ μαθητὴς αἰτεῖ καὶ προσεύχεται.",
  translation: "The disciple asks and prays.",
  wordBreakdown: [
    { greek: "αἰτεῖ", meaning: "asks", note: "Chapter 25 verb." },
    { greek: "προσεύχεται", meaning: "prays", note: "Verb." }
  ],
  structure: "Subject → Verb + καί + Verb",
  explanation: "Prayer and asking are closely related actions."
},

{
  id: "ch25-015",
  chapter: 25,
  greek: "ὁ ἄνθρωπος μᾶλλον ἀγαπᾷ τὸ φῶς.",
  translation: "The man loves the light more.",
  wordBreakdown: [
    { greek: "μᾶλλον", meaning: "more", note: "Chapter 25 adverb." },
    { greek: "ἀγαπᾷ", meaning: "loves", note: "Verb." }
  ],
  structure: "Subject → μᾶλλον → Verb → Object",
  explanation: "μᾶλλον strengthens the degree of love."
},

{
  id: "ch25-016",
  chapter: 25,
  greek: "διὸ ὁ μαθητὴς μαρτυρεῖ.",
  translation: "Therefore the disciple testifies.",
  wordBreakdown: [
    { greek: "διό", meaning: "therefore", note: "Connector." },
    { greek: "μαρτυρεῖ", meaning: "testifies", note: "Chapter 25 verb." }
  ],
  structure: "Connector → Subject → Verb",
  explanation: "διό introduces a result or conclusion."
},

{
  id: "ch25-017",
  chapter: 25,
  greek: "ὁ μαθητὴς θέλει μᾶλλον ζῆν.",
  translation: "The disciple wants rather to live.",
  wordBreakdown: [
    { greek: "θέλει", meaning: "wants", note: "Verb." },
    { greek: "μᾶλλον", meaning: "rather", note: "Chapter 25 adverb." },
    { greek: "ζῆν", meaning: "to live", note: "Infinitive." }
  ],
  structure: "Subject → Verb → μᾶλλον → Infinitive",
  explanation: "Shows preference toward life."
},

{
  id: "ch25-018",
  chapter: 25,
  greek: "ὁ ἄνθρωπος αἰτεῖ ἵνα λαμβάνῃ.",
  translation: "The man asks in order that he may receive.",
  wordBreakdown: [
    { greek: "ἵνα", meaning: "in order that", note: "Purpose marker." },
    { greek: "λαμβάνῃ", meaning: "he may receive", note: "Verb (subjunctive idea)." }
  ],
  structure: "Subject → Verb → ἵνα Clause",
  explanation: "ἵνα introduces purpose or result."
},

{
  id: "ch25-019",
  chapter: 25,
  greek: "ὁ μαθητὴς μαρτυρεῖ περὶ τοῦ κυρίου καὶ διδάσκει.",
  translation: "The disciple testifies about the Lord and teaches.",
  wordBreakdown: [
    { greek: "μαρτυρεῖ", meaning: "testifies", note: "Verb." },
    { greek: "περὶ τοῦ κυρίου", meaning: "about the Lord", note: "Topic phrase." },
    { greek: "διδάσκει", meaning: "teaches", note: "Verb." }
  ],
  structure: "Subject → Verb → περὶ Phrase + καί + Verb",
  explanation: "Combines testimony about the Lord with teaching."
},

{
  id: "ch25-020",
  chapter: 25,
  greek: "ὁ ἄνθρωπος αἰτεῖ, καὶ ὁ θεὸς μᾶλλον δίδωσιν.",
  translation: "The man asks, and God gives more.",
  wordBreakdown: [
    { greek: "αἰτεῖ", meaning: "asks", note: "Chapter 25 verb." },
    { greek: "μᾶλλον", meaning: "more", note: "Chapter 25 adverb." },
    { greek: "δίδωσιν", meaning: "gives", note: "Helper verb." }
  ],
  structure: "Clause + καί + Clause",
  explanation: "Shows a response: asking leads to greater giving."
},

{
  id: "ch27-001",
  chapter: 27,
  greek: "ὁ Ἰησοῦς ἀναβαίνει εἰς τὸ ὄρος.",
  translation: "Jesus goes up to the mountain.",
  wordBreakdown: [
    { greek: "ὁ Ἰησοῦς", meaning: "Jesus", note: "Subject." },
    { greek: "ἀναβαίνει", meaning: "goes up", note: "Chapter 27 verb." },
    { greek: "εἰς τὸ ὄρος", meaning: "to the mountain", note: "Direction phrase." }
  ],
  structure: "Subject → Verb → εἰς Phrase",
  explanation: "ἀναβαίνω shows upward movement, often toward a higher place."
},

{
  id: "ch27-002",
  chapter: 27,
  greek: "ὁ ἀρχιερεὺς λέγει τὸν λόγον.",
  translation: "The high priest speaks the word.",
  wordBreakdown: [
    { greek: "ὁ ἀρχιερεύς", meaning: "the high priest", note: "Chapter 27 noun." },
    { greek: "λέγει", meaning: "speaks", note: "Verb." },
    { greek: "τὸν λόγον", meaning: "the word", note: "Object." }
  ],
  structure: "Subject → Verb → Object",
  explanation: "ἀρχιερεύς refers to the chief religious leader."
},

{
  id: "ch27-003",
  chapter: 27,
  greek: "ὁ μαθητὴς κάθηται ἐν τῇ οἰκίᾳ.",
  translation: "The disciple sits in the house.",
  wordBreakdown: [
    { greek: "κάθηται", meaning: "sits", note: "Chapter 27 verb." },
    { greek: "ἐν τῇ οἰκίᾳ", meaning: "in the house", note: "Location phrase." }
  ],
  structure: "Subject → Verb → Prepositional Phrase",
  explanation: "κάθημαι can mean to sit or dwell somewhere."
},

{
  id: "ch27-004",
  chapter: 27,
  greek: "δύο μαθηταὶ ἀκολουθοῦσιν τῷ κυρίῳ.",
  translation: "Two disciples follow the Lord.",
  wordBreakdown: [
    { greek: "δύο", meaning: "two", note: "Chapter 27 number." },
    { greek: "μαθηταί", meaning: "disciples", note: "Subject." },
    { greek: "ἀκολουθοῦσιν", meaning: "follow", note: "Verb." }
  ],
  structure: "Number + Subject → Verb → Object",
  explanation: "δύο specifies the number of the subject."
},

{
  id: "ch27-005",
  chapter: 27,
  greek: "ὁ ἄνθρωπος βλέπει τὸν δεξιὸν τόπον.",
  translation: "The man sees the right place.",
  wordBreakdown: [
    { greek: "δεξιόν", meaning: "right", note: "Chapter 27 adjective." },
    { greek: "τόπον", meaning: "place", note: "Object." }
  ],
  structure: "Subject → Verb → Adjective + Object",
  explanation: "δεξιός describes position or direction."
},

{
  id: "ch27-006",
  chapter: 27,
  greek: "ὁ μαθητὴς βλέπει ἕτερον ἄνθρωπον.",
  translation: "The disciple sees another man.",
  wordBreakdown: [
    { greek: "ἕτερον", meaning: "another/different", note: "Chapter 27 adjective." }
  ],
  structure: "Subject → Verb → Adjective + Object",
  explanation: "ἕτερος often means another of a different kind."
},

{
  id: "ch27-007",
  chapter: 27,
  greek: "ὁ μαθητὴς εὐαγγελίζει τὸν λαόν.",
  translation: "The disciple preaches the good news to the people.",
  wordBreakdown: [
    { greek: "εὐαγγελίζει", meaning: "preaches good news", note: "Chapter 27 verb." }
  ],
  structure: "Subject → Verb → Object",
  explanation: "εὐαγγελίζω means to proclaim the gospel."
},

{
  id: "ch27-008",
  chapter: 27,
  greek: "ὁ ἄνθρωπος θεωρεῖ τὸ σημεῖον.",
  translation: "The man observes the sign.",
  wordBreakdown: [
    { greek: "θεωρεῖ", meaning: "observes", note: "Chapter 27 verb." }
  ],
  structure: "Subject → Verb → Object",
  explanation: "θεωρέω implies attentive or careful seeing."
},

{
  id: "ch27-009",
  chapter: 27,
  greek: "ὁ Ἰησοῦς ἐστὶν ἐν Ἱεροσολύμοις.",
  translation: "Jesus is in Jerusalem.",
  wordBreakdown: [
    { greek: "Ἱεροσόλυμα", meaning: "Jerusalem", note: "Chapter 27 place name." }
  ],
  structure: "Subject → Verb → Location",
  explanation: "Ἱεροσόλυμα is a key NT location."
},

{
  id: "ch27-010",
  chapter: 27,
  greek: "ὁ μαθητὴς καταβαίνει ἐκ τοῦ ὄρους.",
  translation: "The disciple goes down from the mountain.",
  wordBreakdown: [
    { greek: "καταβαίνει", meaning: "goes down", note: "Chapter 27 verb." }
  ],
  structure: "Subject → Verb → ἐκ Phrase",
  explanation: "καταβαίνω is the opposite of ἀναβαίνω."
},

{
  id: "ch27-011",
  chapter: 27,
  greek: "ὁ τόπος ἐστὶν οὗ ὁ μαθητὴς μένει.",
  translation: "The place is where the disciple remains.",
  wordBreakdown: [
    { greek: "οὗ", meaning: "where", note: "Chapter 27 relative word." }
  ],
  structure: "Subject → Verb → Relative Clause",
  explanation: "οὗ introduces a location-based clause."
},

{
  id: "ch27-012",
  chapter: 27,
  greek: "ὁ Ἰησοῦς παρακαλεῖ τὸν μαθητήν.",
  translation: "Jesus encourages the disciple.",
  wordBreakdown: [
    { greek: "παρακαλεῖ", meaning: "encourages/urges", note: "Chapter 27 verb." }
  ],
  structure: "Subject → Verb → Object",
  explanation: "παρακαλέω can mean encourage, urge, or comfort."
},

{
  id: "ch27-013",
  chapter: 27,
  greek: "ὁ ἄνθρωπος πείθει τὸν φίλον.",
  translation: "The man persuades the friend.",
  wordBreakdown: [
    { greek: "πείθει", meaning: "persuades", note: "Chapter 27 verb." }
  ],
  structure: "Subject → Verb → Object",
  explanation: "πείθω means to convince or persuade."
},

{
  id: "ch27-014",
  chapter: 27,
  greek: "τρεῖς μαθηταὶ ἀκολουθοῦσιν.",
  translation: "Three disciples follow.",
  wordBreakdown: [
    { greek: "τρεῖς", meaning: "three", note: "Chapter 27 number." }
  ],
  structure: "Number + Subject → Verb",
  explanation: "τρεῖς specifies a group of three."
},

{
  id: "ch27-015",
  chapter: 27,
  greek: "ὁ μαθητὴς ἀναβαίνει καὶ θεωρεῖ.",
  translation: "The disciple goes up and observes.",
  wordBreakdown: [
    { greek: "ἀναβαίνει", meaning: "goes up", note: "Verb." },
    { greek: "θεωρεῖ", meaning: "observes", note: "Verb." }
  ],
  structure: "Subject → Verb + καί + Verb",
  explanation: "Links movement with observation."
},

{
  id: "ch27-016",
  chapter: 27,
  greek: "ὁ ἄνθρωπος κάθηται καὶ γράφει.",
  translation: "The man sits and writes.",
  wordBreakdown: [
    { greek: "κάθηται", meaning: "sits", note: "Verb." },
    { greek: "γράφει", meaning: "writes", note: "Helper verb." }
  ],
  structure: "Subject → Verb + καί + Verb",
  explanation: "Shows two related actions."
},

{
  id: "ch27-017",
  chapter: 27,
  greek: "δύο ἄνθρωποι καταβαίνουσιν εἰς τὴν πόλιν.",
  translation: "Two men go down into the city.",
  wordBreakdown: [
    { greek: "δύο", meaning: "two", note: "Number." },
    { greek: "καταβαίνουσιν", meaning: "go down", note: "Verb." }
  ],
  structure: "Number + Subject → Verb → εἰς Phrase",
  explanation: "Combines number with directional movement."
},

{
  id: "ch27-018",
  chapter: 27,
  greek: "ὅτε ὁ μαθητὴς θεωρεῖ, πιστεύει.",
  translation: "When the disciple sees, he believes.",
  wordBreakdown: [
    { greek: "ὅτε", meaning: "when", note: "Time marker." }
  ],
  structure: "ὅτε Clause → Main Clause",
  explanation: "Shows a natural sequence: seeing leads to believing."
},

{
  id: "ch27-019",
  chapter: 27,
  greek: "ὁ Ἰησοῦς παρακαλεῖ καὶ πείθει τὸν λαόν.",
  translation: "Jesus encourages and persuades the people.",
  wordBreakdown: [
    { greek: "παρακαλεῖ", meaning: "encourages", note: "Verb." },
    { greek: "πείθει", meaning: "persuades", note: "Verb." }
  ],
  structure: "Subject → Verb + καί + Verb → Object",
  explanation: "Combines encouragement with persuasion."
},

{
  id: "ch27-020",
  chapter: 27,
  greek: "ὁ μαθητὴς εὐαγγελίζει, καὶ ὁ λαὸς χαίρει.",
  translation: "The disciple proclaims the good news, and the people rejoice.",
  wordBreakdown: [
    { greek: "εὐαγγελίζει", meaning: "preaches good news", note: "Verb." },
    { greek: "χαίρει", meaning: "rejoices", note: "Verb." }
  ],
  structure: "Clause + καί + Clause",
  explanation: "Shows response: proclamation leads to rejoicing."
},

{
  id: "ch28-001",
  chapter: 28,
  greek: "ὁ μαθητὴς ἀσπάζεται τὸν ἀδελφόν.",
  translation: "The disciple greets the brother.",
  wordBreakdown: [
    { greek: "ὁ μαθητής", meaning: "the disciple", note: "Subject." },
    { greek: "ἀσπάζεται", meaning: "greets", note: "Chapter 28 verb." },
    { greek: "τὸν ἀδελφόν", meaning: "the brother", note: "Object." }
  ],
  structure: "Subject → Verb → Object",
  explanation: "ἀσπάζομαι is commonly used for greeting or welcoming someone."
},

{
  id: "ch28-002",
  chapter: 28,
  greek: "ὁ γραμματεὺς γράφει τὸν νόμον.",
  translation: "The scribe writes the law.",
  wordBreakdown: [
    { greek: "ὁ γραμματεύς", meaning: "the scribe", note: "Chapter 28 noun." },
    { greek: "γράφει", meaning: "writes", note: "Verb." },
    { greek: "τὸν νόμον", meaning: "the law", note: "Object." }
  ],
  structure: "Subject → Verb → Object",
  explanation: "γραμματεύς refers to a learned writer or expert in the law."
},

{
  id: "ch28-003",
  chapter: 28,
  greek: "ὁ ἄνθρωπος ἔφη τὸν λόγον.",
  translation: "The man said the word.",
  wordBreakdown: [
    { greek: "ἔφη", meaning: "he said", note: "Chapter 28 verb." }
  ],
  structure: "Subject → Verb → Object",
  explanation: "ἔφη is a common past tense verb for speaking."
},

{
  id: "ch28-004",
  chapter: 28,
  greek: "ὁ Ἰησοῦς ἐστὶν ἐν τῷ ἱερῷ.",
  translation: "Jesus is in the temple.",
  wordBreakdown: [
    { greek: "τὸ ἱερόν", meaning: "the temple", note: "Chapter 28 noun." }
  ],
  structure: "Subject → Verb → Prepositional Phrase",
  explanation: "ἱερόν refers to the temple complex."
},

{
  id: "ch28-005",
  chapter: 28,
  greek: "ὁ ἄνθρωπος κράζει πρὸς τὸν κύριον.",
  translation: "The man cries out to the Lord.",
  wordBreakdown: [
    { greek: "κράζει", meaning: "cries out", note: "Chapter 28 verb." },
    { greek: "πρὸς τὸν κύριον", meaning: "to the Lord", note: "Direction phrase." }
  ],
  structure: "Subject → Verb → πρός Phrase",
  explanation: "κράζω expresses loud or urgent crying out."
},

{
  id: "ch28-006",
  chapter: 28,
  greek: "οὐχὶ ὁ μαθητὴς ἀκολουθεῖ;",
  translation: "Does not the disciple follow?",
  wordBreakdown: [
    { greek: "οὐχί", meaning: "not", note: "Chapter 28 negation (often expecting yes)." }
  ],
  structure: "Negation → Subject → Verb (Question)",
  explanation: "οὐχί is often used in questions expecting a positive answer."
},

{
  id: "ch28-007",
  chapter: 28,
  greek: "τὸ παιδίον βλέπει τὸ φῶς.",
  translation: "The child sees the light.",
  wordBreakdown: [
    { greek: "τὸ παιδίον", meaning: "the child", note: "Chapter 28 noun." }
  ],
  structure: "Subject → Verb → Object",
  explanation: "παιδίον refers to a young child or infant."
},

{
  id: "ch28-008",
  chapter: 28,
  greek: "ὁ ἄνθρωπος σπείρει σπέρμα ἐν τῇ γῇ.",
  translation: "The man sows seed in the ground.",
  wordBreakdown: [
    { greek: "σπείρει", meaning: "sows", note: "Chapter 28 verb." },
    { greek: "σπέρμα", meaning: "seed", note: "Helper noun." }
  ],
  structure: "Subject → Verb → Object → Prepositional Phrase",
  explanation: "σπείρω is commonly used in agricultural and parable contexts."
},

{
  id: "ch28-009",
  chapter: 28,
  greek: "ὁ μαθητὴς ἀσπάζεται καὶ χαίρει.",
  translation: "The disciple greets and rejoices.",
  wordBreakdown: [
    { greek: "ἀσπάζεται", meaning: "greets", note: "Verb." },
    { greek: "χαίρει", meaning: "rejoices", note: "Verb." }
  ],
  structure: "Subject → Verb + καί + Verb",
  explanation: "Links greeting with joy."
},

{
  id: "ch28-010",
  chapter: 28,
  greek: "ὁ γραμματεὺς ἔφη καὶ διδάσκει.",
  translation: "The scribe spoke and teaches.",
  wordBreakdown: [
    { greek: "ἔφη", meaning: "said", note: "Past verb." },
    { greek: "διδάσκει", meaning: "teaches", note: "Verb." }
  ],
  structure: "Subject → Verb + καί + Verb",
  explanation: "Shows speaking followed by teaching."
},

{
  id: "ch28-011",
  chapter: 28,
  greek: "ὁ ἄνθρωπος κράζει, ὅτι φοβεῖται.",
  translation: "The man cries out because he fears.",
  wordBreakdown: [
    { greek: "ὅτι", meaning: "because", note: "Reason marker." }
  ],
  structure: "Main Clause → ὅτι Clause",
  explanation: "ὅτι explains the reason for crying out."
},

{
  id: "ch28-012",
  chapter: 28,
  greek: "τὸ παιδίον σπείρει καὶ βλέπει τὸν καρπόν.",
  translation: "The child sows and sees the fruit.",
  wordBreakdown: [
    { greek: "σπείρει", meaning: "sows", note: "Verb." },
    { greek: "καρπόν", meaning: "fruit", note: "Object." }
  ],
  structure: "Subject → Verb + καί + Verb → Object",
  explanation: "Connects sowing with the result (fruit)."
},

{
  id: "ch28-013",
  chapter: 28,
  greek: "οὐχὶ ὁ κύριος λέγει τὴν ἀλήθειαν;",
  translation: "Does not the Lord speak the truth?",
  wordBreakdown: [
    { greek: "οὐχί", meaning: "not", note: "Question negation." }
  ],
  structure: "Negation → Subject → Verb → Object",
  explanation: "οὐχί expects a “yes” answer."
},

{
  id: "ch28-014",
  chapter: 28,
  greek: "ὁ μαθητὴς ἀσπάζεται τὸ παιδίον καὶ διδάσκει.",
  translation: "The disciple greets the child and teaches.",
  wordBreakdown: [
    { greek: "ἀσπάζεται", meaning: "greets", note: "Verb." },
    { greek: "παιδίον", meaning: "child", note: "Object." }
  ],
  structure: "Subject → Verb → Object + καί + Verb",
  explanation: "Combines relational action with teaching."
},

{
  id: "ch28-015",
  chapter: 28,
  greek: "ὁ ἄνθρωπος σπείρει ἐν τῇ γῇ καὶ χαίρει.",
  translation: "The man sows in the ground and rejoices.",
  wordBreakdown: [
    { greek: "σπείρει", meaning: "sows", note: "Verb." },
    { greek: "χαίρει", meaning: "rejoices", note: "Verb." }
  ],
  structure: "Subject → Verb → Phrase + καί + Verb",
  explanation: "Shows action followed by emotional response."
},

{
  id: "ch28-016",
  chapter: 28,
  greek: "ὁ γραμματεὺς θεωρεῖ τὸ ἱερόν.",
  translation: "The scribe observes the temple.",
  wordBreakdown: [
    { greek: "θεωρεῖ", meaning: "observes", note: "Verb." },
    { greek: "τὸ ἱερόν", meaning: "the temple", note: "Object." }
  ],
  structure: "Subject → Verb → Object",
  explanation: "θεωρέω emphasizes attentive observation."
},

{
  id: "ch28-017",
  chapter: 28,
  greek: "ὁ ἄνθρωπος κράζει καὶ αἰτεῖ βοήθειαν.",
  translation: "The man cries out and asks for help.",
  wordBreakdown: [
    { greek: "κράζει", meaning: "cries out", note: "Verb." },
    { greek: "αἰτεῖ", meaning: "asks", note: "Verb." },
    { greek: "βοήθειαν", meaning: "help", note: "Helper noun." }
  ],
  structure: "Subject → Verb + καί + Verb → Object",
  explanation: "Shows urgent request through two verbs."
},

{
  id: "ch28-018",
  chapter: 28,
  greek: "ὅτε τὸ παιδίον βλέπει, κράζει.",
  translation: "When the child sees, it cries out.",
  wordBreakdown: [
    { greek: "ὅτε", meaning: "when", note: "Time marker." }
  ],
  structure: "ὅτε Clause → Main Clause",
  explanation: "Shows a natural reaction: seeing leads to crying out."
},

{
  id: "ch28-019",
  chapter: 28,
  greek: "ὁ μαθητὴς σπείρει καὶ εὑρίσκει καρπόν.",
  translation: "The disciple sows and finds fruit.",
  wordBreakdown: [
    { greek: "σπείρει", meaning: "sows", note: "Verb." },
    { greek: "εὑρίσκει", meaning: "finds", note: "Verb." }
  ],
  structure: "Subject → Verb + καί + Verb → Object",
  explanation: "Shows cause and result in simple form."
},

{
  id: "ch28-020",
  chapter: 28,
  greek: "ὁ λαὸς κράζει, καὶ ὁ κύριος ἀκούει.",
  translation: "The people cry out, and the Lord hears.",
  wordBreakdown: [
    { greek: "κράζει", meaning: "cries out", note: "Verb." },
    { greek: "ἀκούει", meaning: "hears", note: "Verb." }
  ],
  structure: "Clause + καί + Clause",
  explanation: "Shows response: crying out leads to being heard."
},

{
  id: "ch29-001",
  chapter: 29,
  greek: "ὁ μαθητὴς δέχεται τὸν λόγον.",
  translation: "The disciple receives the word.",
  wordBreakdown: [
    { greek: "ὁ μαθητής", meaning: "the disciple", note: "Subject." },
    { greek: "δέχεται", meaning: "receives", note: "Chapter 29 verb." },
    { greek: "τὸν λόγον", meaning: "the word", note: "Object." }
  ],
  structure: "Subject → Verb → Object",
  explanation: "δέχομαι often means to receive or accept something."
},

{
  id: "ch29-002",
  chapter: 29,
  greek: "ὁ ἄνθρωπος δοκεῖ σοφός.",
  translation: "The man seems wise.",
  wordBreakdown: [
    { greek: "δοκεῖ", meaning: "seems/thinks", note: "Chapter 29 verb." },
    { greek: "σοφός", meaning: "wise", note: "Adjective." }
  ],
  structure: "Subject → Verb → Adjective",
  explanation: "δοκέω often means “it seems” or expresses appearance."
},

{
  id: "ch29-003",
  chapter: 29,
  greek: "ὁ μαθητὴς ἐσθίει ἄρτον.",
  translation: "The disciple eats bread.",
  wordBreakdown: [
    { greek: "ἐσθίει", meaning: "eats", note: "Chapter 29 verb." },
    { greek: "ἄρτον", meaning: "bread", note: "Object." }
  ],
  structure: "Subject → Verb → Object",
  explanation: "ἐσθίω is the common verb for eating."
},

{
  id: "ch29-004",
  chapter: 29,
  greek: "ὁ θεὸς πέμπει τὸν ἄγγελον.",
  translation: "God sends the angel.",
  wordBreakdown: [
    { greek: "πέμπει", meaning: "sends", note: "Chapter 29 verb." },
    { greek: "τὸν ἄγγελον", meaning: "the angel", note: "Object." }
  ],
  structure: "Subject → Verb → Object",
  explanation: "πέμπω means to send with purpose."
},

{
  id: "ch29-005",
  chapter: 29,
  greek: "ὁ ἄνθρωπος φέρει τὸ ὕδωρ.",
  translation: "The man carries the water.",
  wordBreakdown: [
    { greek: "φέρει", meaning: "carries/bears", note: "Chapter 29 verb." },
    { greek: "τὸ ὕδωρ", meaning: "the water", note: "Object." }
  ],
  structure: "Subject → Verb → Object",
  explanation: "φέρω often means to carry or bring something."
},

{
  id: "ch29-006",
  chapter: 29,
  greek: "ὁ μαθητὴς δέχεται καὶ πιστεύει.",
  translation: "The disciple receives and believes.",
  wordBreakdown: [
    { greek: "δέχεται", meaning: "receives", note: "Verb." },
    { greek: "πιστεύει", meaning: "believes", note: "Verb." }
  ],
  structure: "Subject → Verb + καί + Verb",
  explanation: "Shows receiving followed by belief."
},

{
  id: "ch29-007",
  chapter: 29,
  greek: "ὁ ἄνθρωπος δοκεῖ ἀγαθός καὶ δίκαιος.",
  translation: "The man seems good and righteous.",
  wordBreakdown: [
    { greek: "δοκεῖ", meaning: "seems", note: "Verb." },
    { greek: "ἀγαθός καὶ δίκαιος", meaning: "good and righteous", note: "Adjectives." }
  ],
  structure: "Subject → Verb → Adjective + καί + Adjective",
  explanation: "δοκέω describes outward appearance or perception."
},

{
  id: "ch29-008",
  chapter: 29,
  greek: "ὁ μαθητὴς ἐσθίει καὶ πίνει.",
  translation: "The disciple eats and drinks.",
  wordBreakdown: [
    { greek: "ἐσθίει", meaning: "eats", note: "Verb." },
    { greek: "πίνει", meaning: "drinks", note: "Verb." }
  ],
  structure: "Subject → Verb + καί + Verb",
  explanation: "Common pairing of eating and drinking."
},

{
  id: "ch29-009",
  chapter: 29,
  greek: "ὁ Ἰησοῦς πέμπει τοὺς μαθητάς.",
  translation: "Jesus sends the disciples.",
  wordBreakdown: [
    { greek: "πέμπει", meaning: "sends", note: "Chapter 29 verb." },
    { greek: "τοὺς μαθητάς", meaning: "the disciples", note: "Object." }
  ],
  structure: "Subject → Verb → Object",
  explanation: "πέμπω often takes a person being sent."
},

{
  id: "ch29-010",
  chapter: 29,
  greek: "ὁ ἄνθρωπος φέρει καρπὸν ἀγαθόν.",
  translation: "The man bears good fruit.",
  wordBreakdown: [
    { greek: "φέρει", meaning: "bears/carries", note: "Chapter 29 verb." },
    { greek: "καρπὸν ἀγαθόν", meaning: "good fruit", note: "Object + adjective." }
  ],
  structure: "Subject → Verb → Object + Adjective",
  explanation: "φέρω can also mean to produce or bear fruit."
},

{
  id: "ch29-011",
  chapter: 29,
  greek: "ὁ μαθητὴς δέχεται τὸν λόγον καὶ διδάσκει.",
  translation: "The disciple receives the word and teaches.",
  wordBreakdown: [
    { greek: "δέχεται", meaning: "receives", note: "Verb." },
    { greek: "διδάσκει", meaning: "teaches", note: "Verb." }
  ],
  structure: "Subject → Verb → Object + καί + Verb",
  explanation: "Receiving leads into teaching."
},

{
  id: "ch29-012",
  chapter: 29,
  greek: "ὁ ἄνθρωπος δοκεῖ μᾶλλον σοφός.",
  translation: "The man seems more wise.",
  wordBreakdown: [
    { greek: "δοκεῖ", meaning: "seems", note: "Verb." },
    { greek: "μᾶλλον", meaning: "more", note: "Adverb." }
  ],
  structure: "Subject → Verb → μᾶλλον → Adjective",
  explanation: "μᾶλλον increases the degree of the adjective."
},

{
  id: "ch29-013",
  chapter: 29,
  greek: "ὁ μαθητὴς ἐσθίει ἐν τῇ οἰκίᾳ.",
  translation: "The disciple eats in the house.",
  wordBreakdown: [
    { greek: "ἐσθίει", meaning: "eats", note: "Verb." },
    { greek: "ἐν τῇ οἰκίᾳ", meaning: "in the house", note: "Location phrase." }
  ],
  structure: "Subject → Verb → Prepositional Phrase",
  explanation: "Adds location to the eating action."
},

{
  id: "ch29-014",
  chapter: 29,
  greek: "ὁ θεὸς πέμπει καὶ σῴζει.",
  translation: "God sends and saves.",
  wordBreakdown: [
    { greek: "πέμπει", meaning: "sends", note: "Verb." },
    { greek: "σῴζει", meaning: "saves", note: "Verb." }
  ],
  structure: "Subject → Verb + καί + Verb",
  explanation: "Shows two connected divine actions."
},

{
  id: "ch29-015",
  chapter: 29,
  greek: "ὁ ἄνθρωπος φέρει τὸν σταυρόν.",
  translation: "The man carries the cross.",
  wordBreakdown: [
    { greek: "φέρει", meaning: "carries", note: "Verb." },
    { greek: "σταυρόν", meaning: "cross", note: "Helper noun." }
  ],
  structure: "Subject → Verb → Object",
  explanation: "φέρω can describe physical carrying or bearing."
},

{
  id: "ch29-016",
  chapter: 29,
  greek: "ὅτε ὁ μαθητὴς δέχεται, χαίρει.",
  translation: "When the disciple receives, he rejoices.",
  wordBreakdown: [
    { greek: "ὅτε", meaning: "when", note: "Time marker." }
  ],
  structure: "ὅτε Clause → Main Clause",
  explanation: "Receiving leads to joy."
},

{
  id: "ch29-017",
  chapter: 29,
  greek: "ὁ μαθητὴς πέμπει καὶ ἀκολουθεῖ.",
  translation: "The disciple sends and follows.",
  wordBreakdown: [
    { greek: "πέμπει", meaning: "sends", note: "Verb." },
    { greek: "ἀκολουθεῖ", meaning: "follows", note: "Verb." }
  ],
  structure: "Subject → Verb + καί + Verb",
  explanation: "Shows two coordinated actions."
},

{
  id: "ch29-018",
  chapter: 29,
  greek: "ὁ ἄνθρωπος δοκεῖ καὶ λέγει τὴν ἀλήθειαν.",
  translation: "The man seems and speaks the truth.",
  wordBreakdown: [
    { greek: "δοκεῖ", meaning: "seems", note: "Verb." },
    { greek: "λέγει", meaning: "speaks", note: "Verb." }
  ],
  structure: "Subject → Verb + καί + Verb → Object",
  explanation: "Combines perception with speech."
},

{
  id: "ch29-019",
  chapter: 29,
  greek: "ὁ μαθητὴς φέρει καρπὸν καὶ δόξαν.",
  translation: "The disciple bears fruit and glory.",
  wordBreakdown: [
    { greek: "φέρει", meaning: "bears", note: "Verb." },
    { greek: "καρπὸν καὶ δόξαν", meaning: "fruit and glory", note: "Objects." }
  ],
  structure: "Subject → Verb → Object + καί + Object",
  explanation: "φέρω can describe producing results."
},

{
  id: "ch29-020",
  chapter: 29,
  greek: "ὁ ἄνθρωπος δέχεται, καὶ ὁ θεὸς πέμπει.",
  translation: "The man receives, and God sends.",
  wordBreakdown: [
    { greek: "δέχεται", meaning: "receives", note: "Verb." },
    { greek: "πέμπει", meaning: "sends", note: "Verb." }
  ],
  structure: "Clause + καί + Clause",
  explanation: "Shows interaction between human response and divine action."
},

{
  id: "ch30-001",
  chapter: 30,
  greek: "ὁ πρεσβύτερος λέγει τὸν λόγον.",
  translation: "The elder speaks the word.",
  wordBreakdown: [
    { greek: "ὁ πρεσβύτερος", meaning: "the elder", note: "Chapter 30 noun." },
    { greek: "λέγει", meaning: "speaks", note: "Verb." },
    { greek: "τὸν λόγον", meaning: "the word", note: "Object." }
  ],
  structure: "Subject → Verb → Object",
  explanation: "πρεσβύτερος refers to an older leader or elder in a community."
},

{
  id: "ch30-002",
  chapter: 30,
  greek: "ὁ μαθητὴς οὐ πιστεύει μηδὲ ἀκούει.",
  translation: "The disciple does not believe nor hear.",
  wordBreakdown: [
    { greek: "οὐ", meaning: "not", note: "Negation." },
    { greek: "μηδέ", meaning: "nor/not even", note: "Chapter 30 connector." }
  ],
  structure: "Subject → οὐ Verb μηδὲ Verb",
  explanation: "μηδέ joins negative ideas: not...nor."
},

{
  id: "ch30-003",
  chapter: 30,
  greek: "ὁ πρεσβύτερος διδάσκει καὶ γράφει.",
  translation: "The elder teaches and writes.",
  wordBreakdown: [
    { greek: "πρεσβύτερος", meaning: "elder", note: "Subject." }
  ],
  structure: "Subject → Verb + καί + Verb",
  explanation: "Shows two roles of the elder: teaching and writing."
},

{
  id: "ch30-004",
  chapter: 30,
  greek: "ὁ ἄνθρωπος οὐ λέγει μηδὲ γράφει.",
  translation: "The man does not speak nor write.",
  wordBreakdown: [
    { greek: "μηδέ", meaning: "nor", note: "Chapter 30 connector." }
  ],
  structure: "Subject → οὐ Verb μηδὲ Verb",
  explanation: "μηδέ continues the negation from οὐ."
},

{
  id: "ch30-005",
  chapter: 30,
  greek: "ὁ πρεσβύτερος βλέπει τὸν μαθητήν.",
  translation: "The elder sees the disciple.",
  wordBreakdown: [
    { greek: "ὁ πρεσβύτερος", meaning: "the elder", note: "Subject." }
  ],
  structure: "Subject → Verb → Object",
  explanation: "Simple subject–verb–object structure with new vocabulary."
},

{
  id: "ch30-006",
  chapter: 30,
  greek: "ὁ μαθητὴς οὐ ἀκολουθεῖ μηδὲ μένει.",
  translation: "The disciple does not follow nor remain.",
  wordBreakdown: [
    { greek: "μηδέ", meaning: "nor", note: "Chapter 30 connector." }
  ],
  structure: "Subject → οὐ Verb μηδὲ Verb",
  explanation: "μηδέ links two negative actions together."
},

{
  id: "ch30-007",
  chapter: 30,
  greek: "ὁ πρεσβύτερος γράφει περὶ τοῦ θεοῦ.",
  translation: "The elder writes about God.",
  wordBreakdown: [
    { greek: "πρεσβύτερος", meaning: "elder", note: "Subject." },
    { greek: "περὶ τοῦ θεοῦ", meaning: "about God", note: "Topic phrase." }
  ],
  structure: "Subject → Verb → περὶ Phrase",
  explanation: "περί introduces the topic of writing."
},

{
  id: "ch30-008",
  chapter: 30,
  greek: "ὁ ἄνθρωπος οὐ βλέπει μηδὲ ἀκούει.",
  translation: "The man does not see nor hear.",
  wordBreakdown: [
    { greek: "οὐ", meaning: "not", note: "Negation." },
    { greek: "μηδέ", meaning: "nor", note: "Connector." }
  ],
  structure: "Subject → οὐ Verb μηδὲ Verb",
  explanation: "A very common NT-style double negation pattern."
},

{
  id: "ch30-009",
  chapter: 30,
  greek: "ὁ πρεσβύτερος καὶ ὁ μαθητὴς λέγουσιν.",
  translation: "The elder and the disciple speak.",
  wordBreakdown: [
    { greek: "ὁ πρεσβύτερος καὶ ὁ μαθητής", meaning: "the elder and the disciple", note: "Compound subject." }
  ],
  structure: "Subject + καί + Subject → Verb",
  explanation: "καί joins two subjects into one plural idea."
},

{
  id: "ch30-010",
  chapter: 30,
  greek: "ὁ μαθητὴς οὐ γράφει μηδὲ διδάσκει.",
  translation: "The disciple does not write nor teach.",
  wordBreakdown: [
    { greek: "μηδέ", meaning: "nor", note: "Chapter 30 connector." }
  ],
  structure: "Subject → οὐ Verb μηδὲ Verb",
  explanation: "Both actions are negated together."
},

{
  id: "ch30-011",
  chapter: 30,
  greek: "ὁ πρεσβύτερος δέχεται τὸν λόγον καὶ χαίρει.",
  translation: "The elder receives the word and rejoices.",
  wordBreakdown: [
    { greek: "δέχεται", meaning: "receives", note: "Verb." },
    { greek: "χαίρει", meaning: "rejoices", note: "Verb." }
  ],
  structure: "Subject → Verb → Object + καί + Verb",
  explanation: "Receiving the word leads to joy."
},

{
  id: "ch30-012",
  chapter: 30,
  greek: "ὁ ἄνθρωπος οὐ πιστεύει μηδὲ δοκεῖ.",
  translation: "The man does not believe nor seem.",
  wordBreakdown: [
    { greek: "δοκεῖ", meaning: "seems", note: "Verb." },
    { greek: "μηδέ", meaning: "nor", note: "Connector." }
  ],
  structure: "Subject → οὐ Verb μηδὲ Verb",
  explanation: "μηδέ continues the negative idea across verbs."
},

{
  id: "ch30-013",
  chapter: 30,
  greek: "ὁ πρεσβύτερος ἀναβαίνει εἰς τὸ ὄρος.",
  translation: "The elder goes up to the mountain.",
  wordBreakdown: [
    { greek: "ἀναβαίνει", meaning: "goes up", note: "Verb." }
  ],
  structure: "Subject → Verb → εἰς Phrase",
  explanation: "Uses earlier verb with new subject vocabulary."
},

{
  id: "ch30-014",
  chapter: 30,
  greek: "ὁ μαθητὴς οὐ ἐσθίει μηδὲ πίνει.",
  translation: "The disciple does not eat nor drink.",
  wordBreakdown: [
    { greek: "μηδέ", meaning: "nor", note: "Connector." }
  ],
  structure: "Subject → οὐ Verb μηδὲ Verb",
  explanation: "Classic paired verbs under one negation."
},

{
  id: "ch30-015",
  chapter: 30,
  greek: "ὁ πρεσβύτερος θεωρεῖ καὶ διδάσκει.",
  translation: "The elder observes and teaches.",
  wordBreakdown: [
    { greek: "θεωρεῖ", meaning: "observes", note: "Verb." },
    { greek: "διδάσκει", meaning: "teaches", note: "Verb." }
  ],
  structure: "Subject → Verb + καί + Verb",
  explanation: "Shows observation leading into instruction."
},

{
  id: "ch30-016",
  chapter: 30,
  greek: "ὁ ἄνθρωπος οὐ λέγει μηδὲ ἀποκρίνεται.",
  translation: "The man does not speak nor answer.",
  wordBreakdown: [
    { greek: "ἀποκρίνεται", meaning: "answers", note: "Verb." }
  ],
  structure: "Subject → οὐ Verb μηδὲ Verb",
  explanation: "Two forms of speech both negated."
},

{
  id: "ch30-017",
  chapter: 30,
  greek: "ὁ πρεσβύτερος πέμπει καὶ γράφει.",
  translation: "The elder sends and writes.",
  wordBreakdown: [
    { greek: "πέμπει", meaning: "sends", note: "Verb." },
    { greek: "γράφει", meaning: "writes", note: "Verb." }
  ],
  structure: "Subject → Verb + καί + Verb",
  explanation: "Two leadership-type actions."
},

{
  id: "ch30-018",
  chapter: 30,
  greek: "ὅτε ὁ μαθητὴς ἀκούει, οὐ πιστεύει μηδέ.",
  translation: "When the disciple hears, he does not even believe.",
  wordBreakdown: [
    { greek: "ὅτε", meaning: "when", note: "Time marker." },
    { greek: "μηδέ", meaning: "not even", note: "Chapter 30 usage." }
  ],
  structure: "ὅτε Clause → Negative Clause",
  explanation: "μηδέ can intensify negation as “not even.”"
},

{
  id: "ch30-019",
  chapter: 30,
  greek: "ὁ πρεσβύτερος καὶ ὁ μαθητὴς οὐ λέγουσιν μηδέ.",
  translation: "The elder and the disciple do not even speak.",
  wordBreakdown: [
    { greek: "μηδέ", meaning: "not even", note: "Emphatic negation." }
  ],
  structure: "Compound Subject → οὐ Verb → μηδέ",
  explanation: "μηδέ here strengthens the negation."
},

{
  id: "ch30-020",
  chapter: 30,
  greek: "ὁ πρεσβύτερος λέγει, καὶ ὁ λαὸς οὐ ἀκούει μηδέ.",
  translation: "The elder speaks, and the people do not even hear.",
  wordBreakdown: [
    { greek: "μηδέ", meaning: "not even", note: "Emphatic negation." }
  ],
  structure: "Clause + καί + Negative Clause",
  explanation: "Contrasts speaking with total lack of response."
},

{
  id: "ch31-001",
  chapter: 31,
  greek: "ὁ ἄνθρωπος βλέπει λίθον.",
  translation: "The man sees a stone.",
  wordBreakdown: [
    { greek: "ὁ ἄνθρωπος", meaning: "the man", note: "Subject." },
    { greek: "βλέπει", meaning: "sees", note: "Verb." },
    { greek: "λίθον", meaning: "stone", note: "Chapter 31 noun (object)." }
  ],
  structure: "Subject → Verb → Object",
  explanation: "λίθος means stone and often appears in physical or metaphorical contexts."
},

{
  id: "ch31-002",
  chapter: 31,
  greek: "τοιοῦτος ἐστὶν ὁ λόγος.",
  translation: "Such is the word.",
  wordBreakdown: [
    { greek: "τοιοῦτος", meaning: "such/of such a kind", note: "Chapter 31 adjective." },
    { greek: "ὁ λόγος", meaning: "the word", note: "Subject." }
  ],
  structure: "Predicate → Verb → Subject",
  explanation: "τοιοῦτος describes the nature or kind of something."
},

{
  id: "ch31-003",
  chapter: 31,
  greek: "ὁ μαθητὴς φέρει λίθον.",
  translation: "The disciple carries a stone.",
  wordBreakdown: [
    { greek: "φέρει", meaning: "carries", note: "Verb." },
    { greek: "λίθον", meaning: "stone", note: "Object." }
  ],
  structure: "Subject → Verb → Object",
  explanation: "φέρω often describes carrying or bearing something physical."
},

{
  id: "ch31-004",
  chapter: 31,
  greek: "τοιοῦτος ὁ ἄνθρωπος πιστεύει.",
  translation: "Such a man believes.",
  wordBreakdown: [
    { greek: "τοιοῦτος ὁ ἄνθρωπος", meaning: "such a man", note: "Subject phrase." },
    { greek: "πιστεύει", meaning: "believes", note: "Verb." }
  ],
  structure: "Adjective + Subject → Verb",
  explanation: "τοιοῦτος modifies the noun to describe its kind."
},

{
  id: "ch31-005",
  chapter: 31,
  greek: "ὁ ἄνθρωπος βάλλει λίθον.",
  translation: "The man throws a stone.",
  wordBreakdown: [
    { greek: "βάλλει", meaning: "throws", note: "Verb." },
    { greek: "λίθον", meaning: "stone", note: "Object." }
  ],
  structure: "Subject → Verb → Object",
  explanation: "βάλλω commonly means to throw or cast."
},

{
  id: "ch31-006",
  chapter: 31,
  greek: "τοιοῦτος ἐστὶν ὁ μαθητής καὶ ὁ ἀδελφός.",
  translation: "Such is the disciple and the brother.",
  wordBreakdown: [
    { greek: "τοιοῦτος", meaning: "such", note: "Adjective." }
  ],
  structure: "Predicate → Verb → Subject + καί + Subject",
  explanation: "τοιοῦτος can apply to multiple people together."
},

{
  id: "ch31-007",
  chapter: 31,
  greek: "ὁ μαθητὴς βλέπει λίθον καὶ φοβεῖται.",
  translation: "The disciple sees a stone and fears.",
  wordBreakdown: [
    { greek: "λίθον", meaning: "stone", note: "Object." },
    { greek: "φοβεῖται", meaning: "fears", note: "Verb." }
  ],
  structure: "Subject → Verb → Object + καί + Verb",
  explanation: "Links seeing with an emotional reaction."
},

{
  id: "ch31-008",
  chapter: 31,
  greek: "τοιοῦτος λόγος διδάσκει τὸν λαόν.",
  translation: "Such a word teaches the people.",
  wordBreakdown: [
    { greek: "τοιοῦτος λόγος", meaning: "such a word", note: "Subject phrase." }
  ],
  structure: "Adjective + Subject → Verb → Object",
  explanation: "τοιοῦτος emphasizes the kind or quality of the word."
},

{
  id: "ch31-009",
  chapter: 31,
  greek: "ὁ ἄνθρωπος φέρει λίθους.",
  translation: "The man carries stones.",
  wordBreakdown: [
    { greek: "λίθους", meaning: "stones", note: "Plural of Chapter 31 noun." }
  ],
  structure: "Subject → Verb → Object",
  explanation: "Plural form shows multiple stones."
},

{
  id: "ch31-010",
  chapter: 31,
  greek: "τοιοῦτος ἐστὶν ὁ θεός.",
  translation: "Such is God.",
  wordBreakdown: [
    { greek: "τοιοῦτος", meaning: "such", note: "Adjective." }
  ],
  structure: "Predicate → Verb → Subject",
  explanation: "Used to describe the nature or character of God."
},

{
  id: "ch31-011",
  chapter: 31,
  greek: "ὁ μαθητὴς βάλλει λίθον καὶ φεύγει.",
  translation: "The disciple throws a stone and flees.",
  wordBreakdown: [
    { greek: "βάλλει", meaning: "throws", note: "Verb." },
    { greek: "λίθον", meaning: "stone", note: "Object." },
    { greek: "φεύγει", meaning: "flees", note: "Helper verb." }
  ],
  structure: "Subject → Verb → Object + καί + Verb",
  explanation: "Shows action followed by reaction."
},

{
  id: "ch31-012",
  chapter: 31,
  greek: "τοιοῦτος ὁ λόγος χαίρει τὴν ψυχήν.",
  translation: "Such a word gladdens the soul.",
  wordBreakdown: [
    { greek: "τοιοῦτος ὁ λόγος", meaning: "such a word", note: "Subject." },
    { greek: "ψυχήν", meaning: "soul", note: "Object." }
  ],
  structure: "Adjective + Subject → Verb → Object",
  explanation: "Describes the effect of a certain kind of word."
},

{
  id: "ch31-013",
  chapter: 31,
  greek: "ὁ ἄνθρωπος οὐ φέρει λίθον.",
  translation: "The man does not carry a stone.",
  wordBreakdown: [
    { greek: "οὐ", meaning: "not", note: "Negation." },
    { greek: "λίθον", meaning: "stone", note: "Object." }
  ],
  structure: "Subject → οὐ Verb → Object",
  explanation: "Simple negation of carrying."
},

{
  id: "ch31-014",
  chapter: 31,
  greek: "τοιοῦτος ὁ μαθητὴς οὐ πιστεύει.",
  translation: "Such a disciple does not believe.",
  wordBreakdown: [
    { greek: "τοιοῦτος", meaning: "such", note: "Adjective." }
  ],
  structure: "Adjective + Subject → οὐ Verb",
  explanation: "Describes a type of disciple by behavior."
},

{
  id: "ch31-015",
  chapter: 31,
  greek: "ὁ μαθητὴς βλέπει λίθον καὶ φέρει αὐτόν.",
  translation: "The disciple sees a stone and carries it.",
  wordBreakdown: [
    { greek: "λίθον", meaning: "stone", note: "Object." },
    { greek: "φέρει αὐτόν", meaning: "carries it", note: "Verb + pronoun." }
  ],
  structure: "Subject → Verb → Object + καί + Verb",
  explanation: "αὐτόν refers back to λίθον."
},

{
  id: "ch31-016",
  chapter: 31,
  greek: "τοιοῦτος ἐστὶν ὁ τρόπος.",
  translation: "Such is the way/manner.",
  wordBreakdown: [
    { greek: "τοιοῦτος", meaning: "such", note: "Adjective." },
    { greek: "τρόπος", meaning: "way/manner", note: "Helper noun." }
  ],
  structure: "Predicate → Verb → Subject",
  explanation: "Used to describe manner or way of something."
},

{
  id: "ch31-017",
  chapter: 31,
  greek: "ὁ ἄνθρωπος βάλλει λίθους εἰς τὴν γῆν.",
  translation: "The man throws stones into the ground.",
  wordBreakdown: [
    { greek: "βάλλει", meaning: "throws", note: "Verb." },
    { greek: "λίθους", meaning: "stones", note: "Object." }
  ],
  structure: "Subject → Verb → Object → εἰς Phrase",
  explanation: "Shows movement toward a location."
},

{
  id: "ch31-018",
  chapter: 31,
  greek: "ὅτε ὁ μαθητὴς βλέπει λίθον, φοβεῖται.",
  translation: "When the disciple sees a stone, he fears.",
  wordBreakdown: [
    { greek: "ὅτε", meaning: "when", note: "Time marker." }
  ],
  structure: "ὅτε Clause → Main Clause",
  explanation: "Shows cause or sequence."
},

{
  id: "ch31-019",
  chapter: 31,
  greek: "τοιοῦτος ὁ λόγος καὶ ἡ ἀλήθεια.",
  translation: "Such is the word and the truth.",
  wordBreakdown: [
    { greek: "τοιοῦτος", meaning: "such", note: "Adjective." }
  ],
  structure: "Predicate → Subject + καί + Subject",
  explanation: "Applies to multiple connected ideas."
},

{
  id: "ch31-020",
  chapter: 31,
  greek: "ὁ μαθητὴς φέρει λίθον, καὶ ὁ ἄνθρωπος βλέπει.",
  translation: "The disciple carries a stone, and the man sees.",
  wordBreakdown: [
    { greek: "φέρει", meaning: "carries", note: "Verb." },
    { greek: "βλέπει", meaning: "sees", note: "Verb." }
  ],
  structure: "Clause + καί + Clause",
  explanation: "Shows two related actions from different subjects."
},

{
  id: "ch32-001",
  chapter: 32,
  greek: "ὁ ἄνθρωπος δίκαιός ἐστιν.",
  translation: "The man is righteous.",
  wordBreakdown: [
    { greek: "ὁ ἄνθρωπος", meaning: "the man", note: "Subject." },
    { greek: "δίκαιος", meaning: "righteous/just", note: "Chapter 32 adjective." },
    { greek: "ἐστίν", meaning: "is", note: "Linking verb." }
  ],
  structure: "Subject → Predicate Adjective → Verb",
  explanation: "δίκαιος describes moral character—righteous or just."
},

{
  id: "ch32-002",
  chapter: 32,
  greek: "ὁ μαθητὴς μέλλει ἀκολουθεῖν.",
  translation: "The disciple is about to follow.",
  wordBreakdown: [
    { greek: "μέλλει", meaning: "is about to", note: "Chapter 32 verb." },
    { greek: "ἀκολουθεῖν", meaning: "to follow", note: "Infinitive." }
  ],
  structure: "Subject → μέλλει → Infinitive",
  explanation: "μέλλω is followed by an infinitive to show something about to happen."
},

{
  id: "ch32-003",
  chapter: 32,
  greek: "ὁ θεὸς δίκαιός ἐστιν καὶ ἀγαθός.",
  translation: "God is righteous and good.",
  wordBreakdown: [
    { greek: "δίκαιος", meaning: "righteous", note: "Adjective." },
    { greek: "ἀγαθός", meaning: "good", note: "Adjective." }
  ],
  structure: "Subject → Predicate Adjective + καί + Adjective → Verb",
  explanation: "Multiple adjectives describe the subject’s character."
},

{
  id: "ch32-004",
  chapter: 32,
  greek: "ὁ ἄνθρωπος μέλλει λέγειν τὸν λόγον.",
  translation: "The man is about to speak the word.",
  wordBreakdown: [
    { greek: "μέλλει", meaning: "is about to", note: "Verb." },
    { greek: "λέγειν", meaning: "to speak", note: "Infinitive." }
  ],
  structure: "Subject → μέλλει → Infinitive → Object",
  explanation: "μέλλω expresses imminent action."
},

{
  id: "ch32-005",
  chapter: 32,
  greek: "ὁ μαθητὴς δίκαιος καὶ πιστός ἐστιν.",
  translation: "The disciple is righteous and faithful.",
  wordBreakdown: [
    { greek: "δίκαιος", meaning: "righteous", note: "Chapter 32 adjective." },
    { greek: "πιστός", meaning: "faithful", note: "Adjective." }
  ],
  structure: "Subject → Adjective + καί + Adjective → Verb",
  explanation: "Combines moral and relational qualities."
},

{
  id: "ch32-006",
  chapter: 32,
  greek: "ὁ μαθητὴς μέλλει γράφειν.",
  translation: "The disciple is about to write.",
  wordBreakdown: [
    { greek: "μέλλει", meaning: "is about to", note: "Verb." },
    { greek: "γράφειν", meaning: "to write", note: "Infinitive." }
  ],
  structure: "Subject → μέλλει → Infinitive",
  explanation: "Simple μέλλω + infinitive construction."
},

{
  id: "ch32-007",
  chapter: 32,
  greek: "ὁ ἄνθρωπος οὐ δίκαιός ἐστιν.",
  translation: "The man is not righteous.",
  wordBreakdown: [
    { greek: "οὐ", meaning: "not", note: "Negation." },
    { greek: "δίκαιος", meaning: "righteous", note: "Adjective." }
  ],
  structure: "Subject → οὐ → Predicate Adjective → Verb",
  explanation: "Negates the quality being described."
},

{
  id: "ch32-008",
  chapter: 32,
  greek: "ὁ μαθητὴς μέλλει ἐσθίειν καὶ πίνειν.",
  translation: "The disciple is about to eat and drink.",
  wordBreakdown: [
    { greek: "μέλλει", meaning: "is about to", note: "Verb." },
    { greek: "ἐσθίειν καὶ πίνειν", meaning: "to eat and drink", note: "Infinitives." }
  ],
  structure: "Subject → μέλλει → Infinitive + καί + Infinitive",
  explanation: "μέλλω can govern multiple infinitives."
},

{
  id: "ch32-009",
  chapter: 32,
  greek: "ὁ πρεσβύτερος δίκαιος καὶ σοφός ἐστιν.",
  translation: "The elder is righteous and wise.",
  wordBreakdown: [
    { greek: "πρεσβύτερος", meaning: "elder", note: "Subject." },
    { greek: "δίκαιος καὶ σοφός", meaning: "righteous and wise", note: "Adjectives." }
  ],
  structure: "Subject → Adjective + καί + Adjective → Verb",
  explanation: "Describes character and wisdom together."
},

{
  id: "ch32-010",
  chapter: 32,
  greek: "ὁ ἄνθρωπος μέλλει φέρειν λίθον.",
  translation: "The man is about to carry a stone.",
  wordBreakdown: [
    { greek: "μέλλει", meaning: "is about to", note: "Verb." },
    { greek: "φέρειν", meaning: "to carry", note: "Infinitive." },
    { greek: "λίθον", meaning: "stone", note: "Object." }
  ],
  structure: "Subject → μέλλει → Infinitive → Object",
  explanation: "Combines Chapter 32 verb with earlier vocabulary."
},

{
  id: "ch32-011",
  chapter: 32,
  greek: "ὁ μαθητὴς δίκαιος ἐστίν, καὶ ὁ ἀδελφὸς πιστεύει.",
  translation: "The disciple is righteous, and the brother believes.",
  wordBreakdown: [
    { greek: "δίκαιος", meaning: "righteous", note: "Adjective." },
    { greek: "πιστεύει", meaning: "believes", note: "Verb." }
  ],
  structure: "Clause + καί + Clause",
  explanation: "Connects a state with an action."
},

{
  id: "ch32-012",
  chapter: 32,
  greek: "ὁ ἄνθρωπος μέλλει ἀναβαίνειν εἰς τὸ ὄρος.",
  translation: "The man is about to go up to the mountain.",
  wordBreakdown: [
    { greek: "μέλλει", meaning: "is about to", note: "Verb." },
    { greek: "ἀναβαίνειν", meaning: "to go up", note: "Infinitive." }
  ],
  structure: "Subject → μέλλει → Infinitive → εἰς Phrase",
  explanation: "Shows imminent upward movement."
},

{
  id: "ch32-013",
  chapter: 32,
  greek: "ὁ μαθητὴς οὐ μέλλει φεύγειν.",
  translation: "The disciple is not about to flee.",
  wordBreakdown: [
    { greek: "οὐ", meaning: "not", note: "Negation." },
    { greek: "μέλλει", meaning: "is about to", note: "Verb." }
  ],
  structure: "Subject → οὐ → μέλλει → Infinitive",
  explanation: "Negates an expected or impending action."
},

{
  id: "ch32-014",
  chapter: 32,
  greek: "τοιοῦτος ὁ ἄνθρωπος δίκαιός ἐστιν.",
  translation: "Such a man is righteous.",
  wordBreakdown: [
    { greek: "τοιοῦτος", meaning: "such", note: "Adjective." },
    { greek: "δίκαιος", meaning: "righteous", note: "Adjective." }
  ],
  structure: "Adjective + Subject → Predicate Adjective → Verb",
  explanation: "Describes both type and character."
},

{
  id: "ch32-015",
  chapter: 32,
  greek: "ὁ μαθητὴς μέλλει διδάσκειν καὶ γράφειν.",
  translation: "The disciple is about to teach and write.",
  wordBreakdown: [
    { greek: "μέλλει", meaning: "is about to", note: "Verb." },
    { greek: "διδάσκειν καὶ γράφειν", meaning: "to teach and write", note: "Infinitives." }
  ],
  structure: "Subject → μέλλει → Infinitive + καί + Infinitive",
  explanation: "Shows multiple planned actions."
},

{
  id: "ch32-016",
  chapter: 32,
  greek: "ὁ ἄνθρωπος δοκεῖ δίκαιος εἶναι.",
  translation: "The man seems to be righteous.",
  wordBreakdown: [
    { greek: "δοκεῖ", meaning: "seems", note: "Verb." },
    { greek: "εἶναι", meaning: "to be", note: "Infinitive." }
  ],
  structure: "Subject → δοκεῖ → Infinitive → Predicate Adjective",
  explanation: "δοκέω can introduce an infinitive construction."
},

{
  id: "ch32-017",
  chapter: 32,
  greek: "ὁ μαθητὴς μέλλει ἀσπάζεσθαι τὸν ἀδελφόν.",
  translation: "The disciple is about to greet the brother.",
  wordBreakdown: [
    { greek: "μέλλει", meaning: "is about to", note: "Verb." },
    { greek: "ἀσπάζεσθαι", meaning: "to greet", note: "Infinitive." }
  ],
  structure: "Subject → μέλλει → Infinitive → Object",
  explanation: "Uses middle verb in infinitive form."
},

{
  id: "ch32-018",
  chapter: 32,
  greek: "ὅτε ὁ ἄνθρωπος δίκαιος ἐστίν, χαίρει.",
  translation: "When the man is righteous, he rejoices.",
  wordBreakdown: [
    { greek: "ὅτε", meaning: "when", note: "Time marker." }
  ],
  structure: "ὅτε Clause → Main Clause",
  explanation: "Links character with resulting joy."
},

{
  id: "ch32-019",
  chapter: 32,
  greek: "ὁ μαθητὴς μέλλει πέμπειν τοὺς ἀδελφούς.",
  translation: "The disciple is about to send the brothers.",
  wordBreakdown: [
    { greek: "μέλλει", meaning: "is about to", note: "Verb." },
    { greek: "πέμπειν", meaning: "to send", note: "Infinitive." }
  ],
  structure: "Subject → μέλλει → Infinitive → Object",
  explanation: "Shows imminent action directed toward others."
},

{
  id: "ch32-020",
  chapter: 32,
  greek: "ὁ θεὸς δίκαιός ἐστιν, καὶ ὁ λαὸς μέλλει πιστεύειν.",
  translation: "God is righteous, and the people are about to believe.",
  wordBreakdown: [
    { greek: "δίκαιος", meaning: "righteous", note: "Adjective." },
    { greek: "μέλλει πιστεύειν", meaning: "are about to believe", note: "Verb + infinitive." }
  ],
  structure: "Clause + καί + Clause",
  explanation: "Connects God’s character with human response."
},

{
  id: "ch33-001",
  chapter: 33,
  greek: "ὁ ἄνθρωπος ἀπόλλυται.",
  translation: "The man perishes.",
  wordBreakdown: [
    { greek: "ὁ ἄνθρωπος", meaning: "the man", note: "Subject." },
    { greek: "ἀπόλλυται", meaning: "perishes", note: "Chapter 33 verb (middle form)." }
  ],
  structure: "Subject → Verb",
  explanation: "ἀπόλλυμι can mean to destroy (active) or perish (middle)."
},

{
  id: "ch33-002",
  chapter: 33,
  greek: "ὁ κύριος ἀπόλλυσι τὸν ἐχθρόν.",
  translation: "The Lord destroys the enemy.",
  wordBreakdown: [
    { greek: "ἀπόλλυσι", meaning: "destroys", note: "Chapter 33 verb (active)." },
    { greek: "τὸν ἐχθρόν", meaning: "the enemy", note: "Object." }
  ],
  structure: "Subject → Verb → Object",
  explanation: "Active form shows causing destruction."
},

{
  id: "ch33-003",
  chapter: 33,
  greek: "ὁ ἄνθρωπος ἀπολύει τὸν δοῦλον.",
  translation: "The man releases the servant.",
  wordBreakdown: [
    { greek: "ἀπολύει", meaning: "releases", note: "Chapter 33 verb." },
    { greek: "τὸν δοῦλον", meaning: "the servant", note: "Object." }
  ],
  structure: "Subject → Verb → Object",
  explanation: "ἀπολύω means to release, send away, or dismiss."
},

{
  id: "ch33-004",
  chapter: 33,
  greek: "εἴτε ὁ μαθητὴς πιστεύει εἴτε οὐ πιστεύει.",
  translation: "Whether the disciple believes or does not believe.",
  wordBreakdown: [
    { greek: "εἴτε...εἴτε", meaning: "whether...or", note: "Chapter 33 structure." }
  ],
  structure: "εἴτε Clause → εἴτε Clause",
  explanation: "εἴτε…εἴτε presents two alternatives."
},

{
  id: "ch33-005",
  chapter: 33,
  greek: "ὁ μαθητὴς ἀπόλλυται καὶ φοβεῖται.",
  translation: "The disciple perishes and fears.",
  wordBreakdown: [
    { greek: "ἀπόλλυται", meaning: "perishes", note: "Verb." },
    { greek: "φοβεῖται", meaning: "fears", note: "Verb." }
  ],
  structure: "Subject → Verb + καί + Verb",
  explanation: "Links destruction with emotional response."
},

{
  id: "ch33-006",
  chapter: 33,
  greek: "ὁ κύριος ἀπολύει τοὺς μαθητάς.",
  translation: "The Lord releases the disciples.",
  wordBreakdown: [
    { greek: "ἀπολύει", meaning: "releases", note: "Chapter 33 verb." },
    { greek: "τοὺς μαθητάς", meaning: "the disciples", note: "Object." }
  ],
  structure: "Subject → Verb → Object",
  explanation: "Common use: dismissing or sending away."
},

{
  id: "ch33-007",
  chapter: 33,
  greek: "ὁ ἄνθρωπος οὐ ἀπόλλυται.",
  translation: "The man does not perish.",
  wordBreakdown: [
    { greek: "οὐ", meaning: "not", note: "Negation." }
  ],
  structure: "Subject → οὐ → Verb",
  explanation: "Negates the idea of perishing."
},

{
  id: "ch33-008",
  chapter: 33,
  greek: "ὁ μαθητὴς ἀπολύει καὶ ἀκολουθεῖ.",
  translation: "The disciple releases and follows.",
  wordBreakdown: [
    { greek: "ἀπολύει", meaning: "releases", note: "Verb." },
    { greek: "ἀκολουθεῖ", meaning: "follows", note: "Verb." }
  ],
  structure: "Subject → Verb + καί + Verb",
  explanation: "Shows two sequential actions."
},

{
  id: "ch33-009",
  chapter: 33,
  greek: "εἴτε ὁ ἄνθρωπος λέγει εἴτε σιωπᾷ.",
  translation: "Whether the man speaks or is silent.",
  wordBreakdown: [
    { greek: "εἴτε...εἴτε", meaning: "whether...or", note: "Structure." }
  ],
  structure: "εἴτε Clause → εἴτε Clause",
  explanation: "Presents two possible actions."
},

{
  id: "ch33-010",
  chapter: 33,
  greek: "ὁ θεὸς ἀπόλλυσι καὶ σῴζει.",
  translation: "God destroys and saves.",
  wordBreakdown: [
    { greek: "ἀπόλλυσι", meaning: "destroys", note: "Verb." },
    { greek: "σῴζει", meaning: "saves", note: "Verb." }
  ],
  structure: "Subject → Verb + καί + Verb",
  explanation: "Contrasts destruction and salvation."
},

{
  id: "ch33-011",
  chapter: 33,
  greek: "ὁ μαθητὴς ἀπολύει τὸν ἀδελφόν καὶ χαίρει.",
  translation: "The disciple releases the brother and rejoices.",
  wordBreakdown: [
    { greek: "ἀπολύει", meaning: "releases", note: "Verb." },
    { greek: "χαίρει", meaning: "rejoices", note: "Verb." }
  ],
  structure: "Subject → Verb → Object + καί + Verb",
  explanation: "Shows release followed by joy."
},

{
  id: "ch33-012",
  chapter: 33,
  greek: "ὁ ἄνθρωπος ἀπόλλυται διὰ τὴν ἁμαρτίαν.",
  translation: "The man perishes because of sin.",
  wordBreakdown: [
    { greek: "ἀπόλλυται", meaning: "perishes", note: "Verb." },
    { greek: "διὰ τὴν ἁμαρτίαν", meaning: "because of sin", note: "Cause phrase." }
  ],
  structure: "Subject → Verb → διὰ Phrase",
  explanation: "διὰ can show cause or reason."
},

{
  id: "ch33-013",
  chapter: 33,
  greek: "εἴτε ὁ μαθητὴς ἀκούει εἴτε οὐ ἀκούει.",
  translation: "Whether the disciple hears or does not hear.",
  wordBreakdown: [
    { greek: "εἴτε...εἴτε", meaning: "whether...or", note: "Structure." }
  ],
  structure: "εἴτε Clause → εἴτε Clause",
  explanation: "Presents two opposite possibilities."
},

{
  id: "ch33-014",
  chapter: 33,
  greek: "ὁ κύριος ἀπολύει καὶ πέμπει.",
  translation: "The Lord releases and sends.",
  wordBreakdown: [
    { greek: "ἀπολύει", meaning: "releases", note: "Verb." },
    { greek: "πέμπει", meaning: "sends", note: "Verb." }
  ],
  structure: "Subject → Verb + καί + Verb",
  explanation: "Closely related actions: releasing and sending."
},

{
  id: "ch33-015",
  chapter: 33,
  greek: "ὁ ἄνθρωπος ἀπόλλυται, καὶ ὁ θεὸς σῴζει.",
  translation: "The man perishes, and God saves.",
  wordBreakdown: [
    { greek: "ἀπόλλυται", meaning: "perishes", note: "Verb." },
    { greek: "σῴζει", meaning: "saves", note: "Verb." }
  ],
  structure: "Clause + καί + Clause",
  explanation: "Strong contrast between human condition and divine action."
},

{
  id: "ch33-016",
  chapter: 33,
  greek: "ὁ μαθητὴς οὐ ἀπολύει τὸν φίλον.",
  translation: "The disciple does not release the friend.",
  wordBreakdown: [
    { greek: "οὐ", meaning: "not", note: "Negation." },
    { greek: "ἀπολύει", meaning: "releases", note: "Verb." }
  ],
  structure: "Subject → οὐ → Verb → Object",
  explanation: "Simple negation of action."
},

{
  id: "ch33-017",
  chapter: 33,
  greek: "ὁ ἄνθρωπος ἀπόλλυσι τοὺς λίθους.",
  translation: "The man destroys the stones.",
  wordBreakdown: [
    { greek: "ἀπόλλυσι", meaning: "destroys", note: "Verb." },
    { greek: "τοὺς λίθους", meaning: "the stones", note: "Object." }
  ],
  structure: "Subject → Verb → Object",
  explanation: "Active form: causing destruction."
},

{
  id: "ch33-018",
  chapter: 33,
  greek: "ὅτε ὁ μαθητὴς ἀπολύει, χαίρει.",
  translation: "When the disciple releases, he rejoices.",
  wordBreakdown: [
    { greek: "ὅτε", meaning: "when", note: "Time marker." }
  ],
  structure: "ὅτε Clause → Main Clause",
  explanation: "Shows cause or sequence."
},

{
  id: "ch33-019",
  chapter: 33,
  greek: "εἴτε ὁ ἄνθρωπος ζῇ εἴτε ἀπόλλυται.",
  translation: "Whether the man lives or perishes.",
  wordBreakdown: [
    { greek: "εἴτε...εἴτε", meaning: "whether...or", note: "Structure." }
  ],
  structure: "εἴτε Clause → εἴτε Clause",
  explanation: "Classic contrast: life vs. destruction."
},

{
  id: "ch33-020",
  chapter: 33,
  greek: "ὁ θεὸς ἀπολύει, καὶ ὁ λαὸς ἀκολουθεῖ.",
  translation: "God releases, and the people follow.",
  wordBreakdown: [
    { greek: "ἀπολύει", meaning: "releases", note: "Verb." },
    { greek: "ἀκολουθεῖ", meaning: "follows", note: "Verb." }
  ],
  structure: "Clause + καί + Clause",
  explanation: "Shows response to divine action."
},

{
  id: "ch34-001",
  chapter: 34,
  greek: "ὁ θεὸς δίδωσι χάριν.",
  translation: "God gives grace.",
  wordBreakdown: [
    { greek: "ὁ θεός", meaning: "God", note: "Subject." },
    { greek: "δίδωσι", meaning: "gives", note: "Chapter 34 verb." },
    { greek: "χάριν", meaning: "grace", note: "Object." }
  ],
  structure: "Subject → Verb → Object",
  explanation: "δίδωμι is the basic verb for giving something to someone."
},

{
  id: "ch34-002",
  chapter: 34,
  greek: "τὸ ἔθνος ἀκούει τὸ εὐαγγέλιον.",
  translation: "The nation hears the gospel.",
  wordBreakdown: [
    { greek: "τὸ ἔθνος", meaning: "the nation/Gentile people", note: "Chapter 34 noun." },
    { greek: "ἀκούει", meaning: "hears", note: "Verb." },
    { greek: "τὸ εὐαγγέλιον", meaning: "the gospel", note: "Object." }
  ],
  structure: "Subject → Verb → Object",
  explanation: "ἔθνος can mean nation, and in plural often refers to Gentiles."
},

{
  id: "ch34-003",
  chapter: 34,
  greek: "οἱ λοιποὶ μαθηταὶ μένουσιν ἐν τῇ οἰκίᾳ.",
  translation: "The remaining disciples stay in the house.",
  wordBreakdown: [
    { greek: "οἱ λοιποί", meaning: "the remaining/rest", note: "Chapter 34 adjective used with a group." },
    { greek: "μαθηταί", meaning: "disciples", note: "Noun being described." },
    { greek: "μένουσιν", meaning: "remain/stay", note: "Verb." }
  ],
  structure: "Adjective + Subject → Verb → Phrase",
  explanation: "λοιπός describes what remains from a larger group."
},

{
  id: "ch34-004",
  chapter: 34,
  greek: "Μωϋσῆς γράφει τὸν νόμον.",
  translation: "Moses writes the law.",
  wordBreakdown: [
    { greek: "Μωϋσῆς", meaning: "Moses", note: "Chapter 34 proper noun." },
    { greek: "γράφει", meaning: "writes", note: "Verb." },
    { greek: "τὸν νόμον", meaning: "the law", note: "Object." }
  ],
  structure: "Subject → Verb → Object",
  explanation: "Μωϋσῆς is a proper name and often appears connected with the law."
},

{
  id: "ch34-005",
  chapter: 34,
  greek: "ὁ ἄνθρωπος παραδίδωσι τὸν φίλον.",
  translation: "The man hands over the friend.",
  wordBreakdown: [
    { greek: "ὁ ἄνθρωπος", meaning: "the man", note: "Subject." },
    { greek: "παραδίδωσι", meaning: "hands over/betrays", note: "Chapter 34 verb." },
    { greek: "τὸν φίλον", meaning: "the friend", note: "Object; helper noun." }
  ],
  structure: "Subject → Verb → Object",
  explanation: "παραδίδωμι can mean to hand over, and in betrayal contexts, to betray."
},

{
  id: "ch34-006",
  chapter: 34,
  greek: "ὁ μαθητὴς πίπτει ἐπὶ τὴν γῆν.",
  translation: "The disciple falls upon the ground.",
  wordBreakdown: [
    { greek: "ὁ μαθητής", meaning: "the disciple", note: "Subject." },
    { greek: "πίπτει", meaning: "falls", note: "Chapter 34 verb." },
    { greek: "ἐπὶ τὴν γῆν", meaning: "upon the ground", note: "Direction/location phrase." }
  ],
  structure: "Subject → Verb → ἐπί Phrase",
  explanation: "πίπτω means to fall, often followed by a phrase showing where."
},

{
  id: "ch34-007",
  chapter: 34,
  greek: "ὁ λόγος ὑπάρχει ἐν τῇ καρδίᾳ.",
  translation: "The word exists in the heart.",
  wordBreakdown: [
    { greek: "ὁ λόγος", meaning: "the word", note: "Subject." },
    { greek: "ὑπάρχει", meaning: "exists/is present", note: "Chapter 34 verb." },
    { greek: "ἐν τῇ καρδίᾳ", meaning: "in the heart", note: "Location phrase." }
  ],
  structure: "Subject → Verb → Prepositional Phrase",
  explanation: "ὑπάρχω means to exist or be present."
},

{
  id: "ch34-008",
  chapter: 34,
  greek: "ὁ θεὸς δίδωσι ζωήν τῷ λαῷ.",
  translation: "God gives life to the people.",
  wordBreakdown: [
    { greek: "ὁ θεός", meaning: "God", note: "Subject." },
    { greek: "δίδωσι", meaning: "gives", note: "Chapter 34 verb." },
    { greek: "ζωήν", meaning: "life", note: "Thing given." },
    { greek: "τῷ λαῷ", meaning: "to the people", note: "Recipient." }
  ],
  structure: "Subject → Verb → Thing Given → Recipient",
  explanation: "δίδωμι can include both the gift and the recipient."
},

{
  id: "ch34-009",
  chapter: 34,
  greek: "τὰ ἔθνη πιστεύουσιν τῷ θεῷ.",
  translation: "The nations believe God.",
  wordBreakdown: [
    { greek: "τὰ ἔθνη", meaning: "the nations/Gentiles", note: "Plural form of Chapter 34 noun." },
    { greek: "πιστεύουσιν", meaning: "believe", note: "Plural verb." },
    { greek: "τῷ θεῷ", meaning: "God", note: "Object of trust." }
  ],
  structure: "Subject → Verb → Object",
  explanation: "Plural ἔθνη often means the Gentiles or nations."
},

{
  id: "ch34-010",
  chapter: 34,
  greek: "οἱ λοιποὶ ἀκούουσιν καὶ χαίρουσιν.",
  translation: "The rest hear and rejoice.",
  wordBreakdown: [
    { greek: "οἱ λοιποί", meaning: "the rest/remaining ones", note: "Chapter 34 adjective used as a noun." },
    { greek: "ἀκούουσιν", meaning: "hear", note: "Plural verb." },
    { greek: "χαίρουσιν", meaning: "rejoice", note: "Plural verb." }
  ],
  structure: "Subject → Verb + καί + Verb",
  explanation: "λοιπός can stand alone as a noun: the rest."
},

{
  id: "ch34-011",
  chapter: 34,
  greek: "Μωϋσῆς παραδίδωσι τὸν νόμον τῷ λαῷ.",
  translation: "Moses hands over the law to the people.",
  wordBreakdown: [
    { greek: "Μωϋσῆς", meaning: "Moses", note: "Subject." },
    { greek: "παραδίδωσι", meaning: "hands over/delivers", note: "Chapter 34 verb." },
    { greek: "τὸν νόμον", meaning: "the law", note: "Thing handed over." },
    { greek: "τῷ λαῷ", meaning: "to the people", note: "Recipient." }
  ],
  structure: "Subject → Verb → Thing Given → Recipient",
  explanation: "παραδίδωμι can describe handing something over or delivering tradition."
},

{
  id: "ch34-012",
  chapter: 34,
  greek: "ὁ μαθητὴς πίπτει καὶ προσεύχεται.",
  translation: "The disciple falls and prays.",
  wordBreakdown: [
    { greek: "πίπτει", meaning: "falls", note: "Chapter 34 verb." },
    { greek: "προσεύχεται", meaning: "prays", note: "Verb." }
  ],
  structure: "Subject → Verb + καί + Verb",
  explanation: "Falling can introduce a posture of prayer or worship."
},

{
  id: "ch34-013",
  chapter: 34,
  greek: "ἡ χάρις ὑπάρχει ἐν τῇ ἐκκλησίᾳ.",
  translation: "Grace exists in the church.",
  wordBreakdown: [
    { greek: "ἡ χάρις", meaning: "grace", note: "Subject." },
    { greek: "ὑπάρχει", meaning: "exists/is present", note: "Chapter 34 verb." },
    { greek: "ἐν τῇ ἐκκλησίᾳ", meaning: "in the church", note: "Location phrase." }
  ],
  structure: "Subject → Verb → Location",
  explanation: "ὑπάρχω emphasizes presence or existence."
},

{
  id: "ch34-014",
  chapter: 34,
  greek: "ὁ θεὸς δίδωσι σοφίαν καὶ χαράν.",
  translation: "God gives wisdom and joy.",
  wordBreakdown: [
    { greek: "δίδωσι", meaning: "gives", note: "Chapter 34 verb." },
    { greek: "σοφίαν καὶ χαράν", meaning: "wisdom and joy", note: "Objects given." }
  ],
  structure: "Subject → Verb → Object + καί + Object",
  explanation: "καί links two things being given by the same subject."
},

{
  id: "ch34-015",
  chapter: 34,
  greek: "ὁ ἄνθρωπος παραδίδωσι τὸν Ἰησοῦν.",
  translation: "The man betrays Jesus.",
  wordBreakdown: [
    { greek: "ὁ ἄνθρωπος", meaning: "the man", note: "Subject." },
    { greek: "παραδίδωσι", meaning: "betrays/hands over", note: "Chapter 34 verb." },
    { greek: "τὸν Ἰησοῦν", meaning: "Jesus", note: "Object." }
  ],
  structure: "Subject → Verb → Object",
  explanation: "In betrayal contexts, παραδίδωμι means to hand someone over."
},

{
  id: "ch34-016",
  chapter: 34,
  greek: "τὸ ἔθνος πίπτει διὰ τὴν ἁμαρτίαν.",
  translation: "The nation falls because of sin.",
  wordBreakdown: [
    { greek: "τὸ ἔθνος", meaning: "the nation", note: "Subject." },
    { greek: "πίπτει", meaning: "falls", note: "Chapter 34 verb." },
    { greek: "διὰ τὴν ἁμαρτίαν", meaning: "because of sin", note: "Reason phrase." }
  ],
  structure: "Subject → Verb → διά Phrase",
  explanation: "διά can show cause: the reason something happens."
},

{
  id: "ch34-017",
  chapter: 34,
  greek: "οἱ λοιποὶ μαθηταὶ λαμβάνουσι τὸν ἄρτον.",
  translation: "The remaining disciples receive the bread.",
  wordBreakdown: [
    { greek: "οἱ λοιποὶ μαθηταί", meaning: "the remaining disciples", note: "Subject phrase." },
    { greek: "λαμβάνουσι", meaning: "receive", note: "Plural verb." },
    { greek: "τὸν ἄρτον", meaning: "the bread", note: "Object." }
  ],
  structure: "Adjective + Subject → Verb → Object",
  explanation: "λοιπός describes the portion left from a larger group."
},

{
  id: "ch34-018",
  chapter: 34,
  greek: "ὅπου ὁ θεὸς δίδωσι χάριν, ἐκεῖ χαρά ὑπάρχει.",
  translation: "Where God gives grace, there joy exists.",
  wordBreakdown: [
    { greek: "ὅπου", meaning: "where", note: "Location clause marker." },
    { greek: "δίδωσι χάριν", meaning: "gives grace", note: "Chapter 34 verb + object." },
    { greek: "ἐκεῖ", meaning: "there", note: "Corresponding location word." },
    { greek: "ὑπάρχει", meaning: "exists", note: "Chapter 34 verb." }
  ],
  structure: "ὅπου Clause → ἐκεῖ Clause",
  explanation: "ὅπου and ἐκεῖ work together: where something is true, there something follows."
},

{
  id: "ch34-019",
  chapter: 34,
  greek: "Μωϋσῆς δίδωσι λόγον, ἀλλὰ ὁ Ἰησοῦς δίδωσι ζωήν.",
  translation: "Moses gives a word, but Jesus gives life.",
  wordBreakdown: [
    { greek: "Μωϋσῆς δίδωσι λόγον", meaning: "Moses gives a word", note: "First clause." },
    { greek: "ἀλλά", meaning: "but", note: "Contrast marker." },
    { greek: "ὁ Ἰησοῦς δίδωσι ζωήν", meaning: "Jesus gives life", note: "Second clause." }
  ],
  structure: "Clause + ἀλλά + Clause",
  explanation: "ἀλλά creates contrast between the two clauses."
},

{
  id: "ch34-020",
  chapter: 34,
  greek: "ὁ λαὸς πίπτει, ἀλλὰ ὁ θεὸς δίδωσι χάριν.",
  translation: "The people fall, but God gives grace.",
  wordBreakdown: [
    { greek: "ὁ λαὸς πίπτει", meaning: "the people fall", note: "First clause." },
    { greek: "ἀλλά", meaning: "but", note: "Contrast marker." },
    { greek: "ὁ θεὸς δίδωσι χάριν", meaning: "God gives grace", note: "Second clause." }
  ],
  structure: "Clause + ἀλλά + Clause",
  explanation: "The contrast shows human failure followed by divine giving."
},

{
  id: "ch35-001",
  chapter: 35,
  greek: "ὁ ἄνθρωπος ἀνίσταται.",
  translation: "The man rises.",
  wordBreakdown: [
    { greek: "ὁ ἄνθρωπος", meaning: "the man", note: "Subject." },
    { greek: "ἀνίσταται", meaning: "rises", note: "Chapter 35 verb (middle)." }
  ],
  structure: "Subject → Verb",
  explanation: "ἀνίστημι in the middle often means to rise or stand up."
},

{
  id: "ch35-002",
  chapter: 35,
  greek: "ὁ μαθητὴς ἀνοίγει τὴν θύραν.",
  translation: "The disciple opens the door.",
  wordBreakdown: [
    { greek: "ἀνοίγει", meaning: "opens", note: "Chapter 35 verb." },
    { greek: "θύραν", meaning: "door", note: "Helper noun." }
  ],
  structure: "Subject → Verb → Object",
  explanation: "ἀνοίγω means to open something physically or metaphorically."
},

{
  id: "ch35-003",
  chapter: 35,
  greek: "ὁ θεὸς ἀφίησι τὰς ἁμαρτίας.",
  translation: "God forgives sins.",
  wordBreakdown: [
    { greek: "ἀφίησι", meaning: "forgives", note: "Chapter 35 verb." },
    { greek: "τὰς ἁμαρτίας", meaning: "sins", note: "Object." }
  ],
  structure: "Subject → Verb → Object",
  explanation: "ἀφίημι commonly means to forgive or release."
},

{
  id: "ch35-004",
  chapter: 35,
  greek: "ὁ κύριος δείκνυσι τὸν δρόμον.",
  translation: "The Lord shows the way.",
  wordBreakdown: [
    { greek: "δείκνυσι", meaning: "shows", note: "Chapter 35 verb." },
    { greek: "δρόμον", meaning: "way/path", note: "Helper noun." }
  ],
  structure: "Subject → Verb → Object",
  explanation: "δείκνυμι means to show or make something known."
},

{
  id: "ch35-005",
  chapter: 35,
  greek: "ὁ μαθητὴς ἀγαπᾷ τοὺς ἰδίους ἀδελφούς.",
  translation: "The disciple loves his own brothers.",
  wordBreakdown: [
    { greek: "ἰδίους", meaning: "one’s own", note: "Chapter 35 adjective." },
    { greek: "ἀδελφούς", meaning: "brothers", note: "Object." }
  ],
  structure: "Subject → Verb → Adjective + Object",
  explanation: "ἴδιος emphasizes personal belonging or relationship."
},

{
  id: "ch35-006",
  chapter: 35,
  greek: "ὁ ἄνθρωπος ἵστησι τὸν λίθον.",
  translation: "The man sets the stone.",
  wordBreakdown: [
    { greek: "ἵστησι", meaning: "sets/causes to stand", note: "Chapter 35 verb." },
    { greek: "λίθον", meaning: "stone", note: "Object." }
  ],
  structure: "Subject → Verb → Object",
  explanation: "ἵστημι can mean to stand or to cause something to stand."
},

{
  id: "ch35-007",
  chapter: 35,
  greek: "ὁ Ἰησοῦς ἵσταται ἐν μέσῳ τῶν μαθητῶν.",
  translation: "Jesus stands in the midst of the disciples.",
  wordBreakdown: [
    { greek: "ἵσταται", meaning: "stands", note: "Middle form of ἵστημι." },
    { greek: "ἐν μέσῳ", meaning: "in the midst", note: "Chapter 35 phrase." }
  ],
  structure: "Subject → Verb → Prepositional Phrase",
  explanation: "μέσος is often used in phrases like “in the midst.”"
},

{
  id: "ch35-008",
  chapter: 35,
  greek: "ὁ μαθητὴς τίθησι τὸν ἄρτον ἐπὶ τὴν τράπεζαν.",
  translation: "The disciple places the bread on the table.",
  wordBreakdown: [
    { greek: "τίθησι", meaning: "places", note: "Chapter 35 verb." },
    { greek: "ἄρτον", meaning: "bread", note: "Object." }
  ],
  structure: "Subject → Verb → Object → ἐπί Phrase",
  explanation: "τίθημι means to put or place something."
},

{
  id: "ch35-009",
  chapter: 35,
  greek: "ὁ ἄνθρωπος φημὶ τὴν ἀλήθειαν.",
  translation: "The man says the truth.",
  wordBreakdown: [
    { greek: "φημί", meaning: "I say", note: "Chapter 35 verb." }
  ],
  structure: "Subject → Verb → Object",
  explanation: "φημί is a common verb for saying or declaring."
},

{
  id: "ch35-010",
  chapter: 35,
  greek: "ὁ μαθητὴς ἀνίσταται καὶ ἀκολουθεῖ.",
  translation: "The disciple rises and follows.",
  wordBreakdown: [
    { greek: "ἀνίσταται", meaning: "rises", note: "Verb." },
    { greek: "ἀκολουθεῖ", meaning: "follows", note: "Verb." }
  ],
  structure: "Subject → Verb + καί + Verb",
  explanation: "Rising often precedes action."
},

{
  id: "ch35-011",
  chapter: 35,
  greek: "ὁ κύριος ἀνοίγει τὰς ὀφθαλμούς.",
  translation: "The Lord opens the eyes.",
  wordBreakdown: [
    { greek: "ἀνοίγει", meaning: "opens", note: "Verb." },
    { greek: "ὀφθαλμούς", meaning: "eyes", note: "Object." }
  ],
  structure: "Subject → Verb → Object",
  explanation: "Can be literal or metaphorical (understanding)."
},

{
  id: "ch35-012",
  chapter: 35,
  greek: "ὁ θεὸς ἀφίησι καὶ σώζει.",
  translation: "God forgives and saves.",
  wordBreakdown: [
    { greek: "ἀφίησι", meaning: "forgives", note: "Verb." },
    { greek: "σώζει", meaning: "saves", note: "Verb." }
  ],
  structure: "Subject → Verb + καί + Verb",
  explanation: "Links forgiveness with salvation."
},

{
  id: "ch35-013",
  chapter: 35,
  greek: "ὁ ἄνθρωπος δείκνυσι τὸν λόγον τῷ μαθητῇ.",
  translation: "The man shows the word to the disciple.",
  wordBreakdown: [
    { greek: "δείκνυσι", meaning: "shows", note: "Verb." },
    { greek: "τὸν λόγον", meaning: "the word", note: "Object." },
    { greek: "τῷ μαθητῇ", meaning: "to the disciple", note: "Recipient." }
  ],
  structure: "Subject → Verb → Object → Recipient",
  explanation: "δείκνυμι can include both what is shown and to whom."
},

{
  id: "ch35-014",
  chapter: 35,
  greek: "οἱ μαθηταὶ ἀγαπῶσι τοὺς ἰδίους φίλους.",
  translation: "The disciples love their own friends.",
  wordBreakdown: [
    { greek: "ἰδίους", meaning: "their own", note: "Adjective." }
  ],
  structure: "Subject → Verb → Adjective + Object",
  explanation: "ἴδιος emphasizes personal connection."
},

{
  id: "ch35-015",
  chapter: 35,
  greek: "ὁ Ἰησοῦς ἵσταται ἐν μέσῳ καὶ λέγει.",
  translation: "Jesus stands in the midst and speaks.",
  wordBreakdown: [
    { greek: "ἵσταται", meaning: "stands", note: "Verb." },
    { greek: "ἐν μέσῳ", meaning: "in the midst", note: "Phrase." }
  ],
  structure: "Subject → Verb → Phrase + καί + Verb",
  explanation: "Common narrative structure."
},

{
  id: "ch35-016",
  chapter: 35,
  greek: "ὁ μαθητὴς τίθησι τὴν χεῖρα ἐπὶ τὸν ἄνθρωπον.",
  translation: "The disciple places the hand on the man.",
  wordBreakdown: [
    { greek: "τίθησι", meaning: "places", note: "Verb." },
    { greek: "χεῖρα", meaning: "hand", note: "Object." }
  ],
  structure: "Subject → Verb → Object → ἐπί Phrase",
  explanation: "τίθημι is often used for deliberate placement."
},

{
  id: "ch35-017",
  chapter: 35,
  greek: "ὁ ἄνθρωπος φημὶ καὶ γράφει.",
  translation: "The man speaks and writes.",
  wordBreakdown: [
    { greek: "φημί", meaning: "says/speaks", note: "Verb." }
  ],
  structure: "Subject → Verb + καί + Verb",
  explanation: "Combines speaking and writing."
},

{
  id: "ch35-018",
  chapter: 35,
  greek: "ὅτε ὁ μαθητὴς ἀνίσταται, ἀκολουθεῖ.",
  translation: "When the disciple rises, he follows.",
  wordBreakdown: [
    { greek: "ὅτε", meaning: "when", note: "Time marker." }
  ],
  structure: "ὅτε Clause → Main Clause",
  explanation: "Sequence of actions."
},

{
  id: "ch35-019",
  chapter: 35,
  greek: "ὁ θεὸς ἀνοίγει καὶ δείκνυσι τὴν ἀλήθειαν.",
  translation: "God opens and shows the truth.",
  wordBreakdown: [
    { greek: "ἀνοίγει", meaning: "opens", note: "Verb." },
    { greek: "δείκνυσι", meaning: "shows", note: "Verb." }
  ],
  structure: "Subject → Verb + καί + Verb → Object",
  explanation: "Opening often precedes revealing."
},

{
  id: "ch35-020",
  chapter: 35,
  greek: "ὁ μαθητὴς ἀφίησι τὸν ἀδελφόν, καὶ ὁ θεὸς χαίρει.",
  translation: "The disciple forgives the brother, and God rejoices.",
  wordBreakdown: [
    { greek: "ἀφίησι", meaning: "forgives", note: "Verb." },
    { greek: "χαίρει", meaning: "rejoices", note: "Verb." }
  ],
  structure: "Clause + καί + Clause",
  explanation: "Shows relational forgiveness followed by divine response."
}
];

let translateSentences = [];
let translateIndex = 0;
let currentSentence = null;


const screens = [
  "homeScreen",
  "newLearnMenu",
  "learnMenu",
  "learnScreen",
  "translateMenu",
  "translateScreen",
  "testMenu",
  "testScreen",
  "resultsScreen",
  "progressScreen",
  "settingsScreen"
];

function showScreen(id) {
  closeLearnSideMenu();

  screens.forEach(screen => {
    const el = document.getElementById(screen);
    if (el) el.classList.remove("active");
  });

  const target = document.getElementById(id);
  if (target) target.classList.add("active");
  
}

function showHome() {
  showScreen("homeScreen");

  document.body.classList.toggle("home-active", screenId === "homeScreen");
}


function getChapters() {
  return [...new Set(VOCAB
    .map(w => w.chapter)
    .filter(ch => ch !== undefined)
  )].sort((a, b) => a - b);
}

function buildChapterCheckboxes(containerId, name) {
  const container = document.getElementById(containerId);
  container.innerHTML = "";

  getChapters().forEach((chapter, index) => {
    const displayChapter = index + 1;
    const label = document.createElement("label");

    label.innerHTML = `
      <input type="checkbox" name="${name}" value="${chapter}" />
      ${displayChapter}
    `;

    const input = label.querySelector("input");

    if (input.checked) label.classList.add("selected");

    input.addEventListener("change", () => {
      label.classList.toggle("selected", input.checked);
    });

    container.appendChild(label);
  });
}

function getSelectedChapters(name) {
  return [...document.querySelectorAll(`input[name="${name}"]:checked`)]
    .map(input => Number(input.value));
}

function setAllChapters(name, checked) {
  const inputs = document.querySelectorAll(`input[name="${name}"]`);

  inputs.forEach(input => {
    input.checked = checked;

    const label = input.closest("label");
    if (label) {
      label.classList.toggle("selected", checked);
    }
  });
}

function showLearnMenu() {
  buildChapterCheckboxes("learnChapterList", "learnChapter");
  showScreen("learnMenu");
}

function startLearning(customWords = null) {
  if (customWords) {
    learnWords = customWords;
  } else {
    const chapters = getSelectedChapters("learnChapter");
    learnWords = VOCAB.filter(word => chapters.includes(word.chapter));
  }

  learnIndex = 0;

  if (learnWords.length === 0) {
    alert("Choose at least one chapter.");
    return;
  }

  showScreen("learnScreen");
  renderLearnCard();
}
function renderLearnCard() {
  const word = learnWords[learnIndex];

  document.getElementById("learnGreek").textContent = word.greek;
  document.getElementById("learnMeaning").textContent = word.meaning;
  document.getElementById("learnProgress").textContent = `${learnIndex + 1} / ${learnWords.length}`;
  document.getElementById("learnCard").classList.remove("flipped");

  document.getElementById("swipeHint").style.display = learnIndex === 0 ? "block" : "none";
}

function flipCard() {
  document.getElementById("learnCard").classList.toggle("flipped");
}

function nextLearnCard() {
  const card = document.getElementById("learnCard");

  if (learnIndex < learnWords.length - 1) {
    card.classList.add("slide-out");

    setTimeout(() => {
      learnIndex++;
      renderLearnCard();
      card.classList.remove("slide-out");

      if (learnIndex === learnWords.length - 1) {
        const finishedChapter = learnWords[0]?.chapter;

        if (finishedChapter) {
          awardVocabChapterXP(finishedChapter);
        }
      }
    }, 180);
  }
}

function prevLearnCard() {
  if (learnIndex > 0) {
    const card = document.getElementById("learnCard");

    card.classList.add("slide-out");

    setTimeout(() => {
      learnIndex--;
      renderLearnCard();
      card.classList.remove("slide-out");
    }, 180);
  }
}

let startX = 0;
let endX = 0;

const learnCard = document.getElementById("learnCard");

learnCard.addEventListener("touchstart", e => {
  startX = e.touches[0].clientX;
});

learnCard.addEventListener("touchend", e => {
  endX = e.changedTouches[0].clientX;
  const diff = startX - endX;

  if (diff > 50) nextLearnCard();
  if (diff < -50) prevLearnCard();
});

function showTestMenu() {
  buildChapterCheckboxes("testChapterList", "testChapter");
  showScreen("testMenu");
}

function startTest() {
  const amount = Number(document.getElementById("testAmount").value);
  const chapters = getSelectedChapters("testChapter");
  const focusMode = document.getElementById("focusMode").checked;

  if (chapters.length === 0) {
    alert("Choose at least one chapter.");
    return;
  }

  let pool = VOCAB.filter(word => chapters.includes(word.chapter));

  pool = pool.filter(word => !knownWords.includes(word.id));

  if (pool.length === 0) {
    alert("No words left to test — you've marked all selected chapter words as known.");
    return;
  }

  if (focusMode) {
    const weakWords = getWeakWords(pool);

    if (weakWords.length === 0) {
      alert("You do not have weak words yet. Take a normal test first.");
      return;
    }

    pool = weakWords;
  }

  if (focusMode) {
    testWords = pool.slice(0, Math.min(amount, pool.length));
  } else {
    testWords = shuffle(pool).slice(0, Math.min(amount, pool.length));
  }

  testIndex = 0;
  testCorrect = 0;
  missedWords = [];
  answered = false;
  currentTestSaved = false;

  showScreen("testScreen");
  renderTestWord();
}

function renderTestWord() {
  const word = testWords[testIndex];

  document.getElementById("testGreek").textContent = word.greek;
  document.getElementById("testProgress").textContent = `${testIndex + 1} / ${testWords.length}`;
  document.getElementById("answerInput").value = "";
  document.getElementById("feedback").textContent = "";
  document.getElementById("feedback").className = "feedback";
  document.getElementById("answerInput").disabled = false;
  document.getElementById("answerInput").focus();

  answered = false;
}

function submitAnswer() {
  if (answered) {
    nextTestWord();
    return;
  }

  const word = testWords[testIndex];
  const userAnswer = document.getElementById("answerInput").value;
  const correct = isCorrect(userAnswer, word.meaning);

  const feedback = document.getElementById("feedback");

  if (correct) {
    testCorrect++;
    feedback.textContent = "Correct!";
    feedback.classList.add("correct");
    updateWordStats(word.id, true);
  } else {
    feedback.textContent = `Incorrect. Answer: ${word.meaning}`;
    feedback.classList.add("incorrect");
    missedWords.push(word);
    updateWordStats(word.id, false);
  }

  document.getElementById("answerInput").disabled = true;
  answered = true;

  setTimeout(() => {
    nextTestWord();
  }, correct ? 700 : 1600);
}

function nextTestWord() {
  if (testIndex < testWords.length - 1) {
    testIndex++;
    renderTestWord();
  } else {
    finishTest();
  }
}

document.getElementById("answerInput").addEventListener("keydown", e => {
  if (e.key === "Enter") {
    submitAnswer();
  }
});

function finishTest() {
   if (currentTestSaved) return;
  currentTestSaved = true;

  saveTestScore(testCorrect, testWords.length);

  document.getElementById("scoreResult").textContent =
    `${testCorrect} / ${testWords.length}`;

  const missedContainer = document.getElementById("missedWords");

  if (missedWords.length === 0) {
    missedContainer.innerHTML = "<p>You did not miss any words.</p>";
  } else {
    missedContainer.innerHTML = "<h3>Words to review</h3>";
    missedWords.forEach(word => {
      const div = document.createElement("div");
      div.className = "review-word";
      div.innerHTML = `<strong>${word.greek}</strong><br>${word.meaning}`;
      missedContainer.appendChild(div);
    });
  }
  awardTestXP();
  showScreen("resultsScreen");
}

function awardTestXP() {

  const earnedXP = testCorrect * 7;

  if (earnedXP > 0) {
    addXP(
      earnedXP,
      `${testCorrect} correct test answers!`,
      true
    );
  }

  if (testWords.length > 0 && testCorrect === testWords.length) {
    addXP(25, "Perfect test bonus!", true);

    unlockAchievement("firstPerfectTest");
  }
}

function awardVocabChapterXP(chapter) {
  const key = `vocabChapterXP_${chapter}`;

  if (localStorage.getItem(key) === "true") return;

  localStorage.setItem(key, "true");

  addXP(75, `You finished Chapter ${getDisplayChapterNumber(Number(chapter))} vocab!`, true);
  unlockAchievement("firstVocabChapter");
}

function studyMissedWords() {
  if (missedWords.length === 0) return;
  learnWords = missedWords;
  learnIndex = 0;
  showScreen("learnScreen");
  renderLearnCard();
}

function normalize(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[.,;:!?]/g, "")
    .replace(/\s+/g, " ");
}

function splitUserAnswers(input) {
  return input
    .split(/[,;]/)
    .map(answer => normalize(answer))
    .filter(Boolean);
}

function splitCorrectAnswers(meaning) {
  return meaning
    .split(/[,;]/)
    .map(answer => normalize(answer))
    .filter(Boolean);
}

function isCorrect(userInput, meaning) {
  const userAnswers = splitUserAnswers(userInput);
  const correctAnswers = splitCorrectAnswers(meaning);

  return userAnswers.some(userAnswer =>
    correctAnswers.some(correctAnswer =>
      userAnswer === correctAnswer
    )
  );
}

function shuffle(array) {
  return [...array].sort(() => Math.random() - 0.5);
}

function getStats() {
  return JSON.parse(localStorage.getItem("greekVocabStats")) || {
    tests: [],
    words: {}
  };
}

function saveStats(stats) {
  localStorage.setItem("greekVocabStats", JSON.stringify(stats));
}

function updateWordStats(wordId, wasCorrect) {
  const stats = getStats();

  if (!stats.words[wordId]) {
    stats.words[wordId] = { correct: 0, wrong: 0 };
  }

  if (wasCorrect) {
    stats.words[wordId].correct++;
  } else {
    stats.words[wordId].wrong++;
  }

  saveStats(stats);
}

function saveTestScore(correct, total) {
  if (!total || total <= 0) return;

  const stats = getStats();

  stats.tests.push({
    correct: Number(correct),
    total: Number(total),
    percent: Math.round((correct / total) * 100),
    date: new Date().toLocaleString()
  });

  saveStats(stats);
}

function getWeakWords(pool) {
  const stats = getStats();

  return pool
    .map(word => {
      const wordStats = stats.words[word.id];
      if (!wordStats) return null;

      const attempts = wordStats.correct + wordStats.wrong;
      if (attempts === 0) return null;

      const accuracy = wordStats.correct / attempts;
      const isWeak = wordStats.wrong >= 2 || accuracy < 0.7;

      if (!isWeak) return null;

      return {
        ...word,
        weakScore: calculateWeakScore(wordStats.correct, wordStats.wrong)
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.weakScore - a.weakScore);
}

function calculateWeakScore(correct, wrong) {
  const attempts = correct + wrong;
  const accuracy = attempts === 0 ? 1 : correct / attempts;

  return wrong * 2 + (1 - accuracy) * 5;
}

function showProgress() {
  const stats = getStats();
  const container = document.getElementById("progressStats");

  const totalTests = stats.tests.length;
  const latest = totalTests > 0 ? stats.tests[stats.tests.length - 1] : null;
  const best = totalTests > 0 ? Math.max(...stats.tests.map(t => t.percent)) : null;
  const average = totalTests > 0
    ? Math.round(stats.tests.reduce((sum, t) => sum + t.percent, 0) / totalTests)
    : null;

  const hardest = Object.entries(stats.words)
    .map(([id, stat]) => {
      const word = VOCAB.find(w => w && w.id === Number(id));
      if (!word) return null;

      return {
        word,
        wrong: stat.wrong || 0,
        correct: stat.correct || 0
      };
    })
    .filter(item => item && item.wrong > 0)
    .sort((a, b) => b.wrong - a.wrong)
    .slice(0, 10);

  const translationByChapter = {};

  Object.values(translationProgress).forEach(item => {
    if (!translationByChapter[item.chapter]) {
      translationByChapter[item.chapter] = {
        got: 0,
        almost: 0,
        missed: 0,
        attempts: 0,
        sentencesPracticed: 0
      };
    }

    translationByChapter[item.chapter].got += item.got || 0;
    translationByChapter[item.chapter].almost += item.almost || 0;
    translationByChapter[item.chapter].missed += item.missed || 0;
    translationByChapter[item.chapter].attempts += item.attempts || 0;
    translationByChapter[item.chapter].sentencesPracticed++;
  });

  let html = `
  <button class="collapse-btn progress-collapse-btn" onclick="toggleProgressSection('testProgressSection', this)">
  <span>Vocab Tests</span>
  
</button>
  <div id="testProgressSection" class="collapse-content">
`;

  if (totalTests === 0) {
    html += `<p>No vocabulary tests taken yet.</p>`;
  } else {
    html += `
      <p><strong>Total tests:</strong> ${totalTests}</p>
      <p><strong>Latest score:</strong> ${latest.percent}%</p>
      <p><strong>Best score:</strong> ${best}%</p>
      <p><strong>Average score:</strong> ${average}%</p>

      <h3>Most missed words</h3>
    `;

    if (hardest.length === 0) {
      html += "<p>No missed words yet.</p>";
    } else {
      hardest.forEach(item => {
        html += `
          <div class="review-word">
            <strong>${item.word.greek}</strong><br>
            ${item.word.meaning}<br>
            Missed: ${item.wrong}
          </div>
        `;
      });
    }
  }

 html += `
  </div>

  <button class="collapse-btn progress-collapse-btn" onclick="toggleProgressSection('translationProgressSection', this)">
  <span>Translations</span>
</button>
  <div id="translationProgressSection" class="collapse-content">
`;

  const chapters = Object.entries(translationByChapter)
    .sort((a, b) => Number(a[0]) - Number(b[0]));

  if (chapters.length === 0) {
    html += `<p>No translation practice saved yet.</p>`;
  } else {
    chapters.forEach(([chapter, data]) => {
      const strong = data.got;
      const needsWork = data.almost + data.missed;
      const gotPercent = Math.round((data.got / data.attempts) * 100);

      let message = "Needs more practice.";
      if (data.attempts >= 5 && gotPercent >= 80) {
        message = "Doing pretty good here.";
      } else if (data.attempts >= 5 && gotPercent >= 60) {
        message = "Getting there.";
      }

      html += `
        <div class="review-word">
          <h3>Chapter ${getDisplayChapterNumber(Number(chapter))}</h3>
          <p><strong>Attempts:</strong> ${data.attempts}</p>
          <p><strong>Sentences practiced:</strong> ${data.sentencesPracticed}</p>
          <p><strong>Got it:</strong> ${data.got}</p>
          <p><strong>Almost:</strong> ${data.almost}</p>
          <p><strong>Missed it:</strong> ${data.missed}</p>
          <p><strong>Got it rate:</strong> ${gotPercent}%</p>
          <p><strong>Status:</strong> ${message}</p>
        </div>
      `;
    });
  }
html += `</div>`;
  container.innerHTML = html;
  showScreen("progressScreen");
}

function showSettings() {
  showScreen("settingsScreen");
}

function resetTestData() {
  const confirmed = confirm(
    "Are you sure?\n\nThis will permanently reset all test scores, progress stats, weak-word tracking, and known words. This cannot be undone."
  );

  if (!confirmed) return;

  localStorage.removeItem("greekVocabStats");
  localStorage.removeItem("knownWords");

  knownWords = [];

  alert("Test data and known words have been reset.");
  showHome();
}
function toggleDarkMode() {
  const isDark = document.getElementById("darkModeToggle").checked;

  if (isDark) {
    localStorage.setItem("darkMode", "true");
    localStorage.setItem("appTheme", "midnight");
    applyAppTheme("midnight");
  } else {
    localStorage.setItem("darkMode", "false");
    localStorage.setItem("appTheme", "parchment");
    applyAppTheme("parchment");
  }
}


const APP_THEMES = {
  parchment: {
    primary: "#efe4c8",
    light: "#f8f3e7",
    secondary: "#243447",
    accent: "#c8a24a",
    card: "rgba(255, 252, 242, 0.92)",
    border: "#d6c49a",
    text: "#1f2933",
    muted: "#5f6c7b",
    buttonText: "#ffffff"
  },

  midnight: {
    primary: "#111827",
    light: "#1f2937",
    secondary: "#334155",
    accent: "#93c5fd",
    card: "rgba(31, 41, 55, 0.94)",
    border: "#475569",
    text: "#f8fafc",
    muted: "#cbd5e1",
    buttonText: "#ffffff"
  },

  royal: {
    primary: "#dbeafe",
    light: "#eff6ff",
    secondary: "#1d4ed8",
    accent: "#f59e0b",
    card: "rgba(255, 255, 255, 0.88)",
    border: "#93c5fd",
    text: "#172033",
    muted: "#475569",
    buttonText: "#ffffff"
  },

  emerald: {
    primary: "#dff7ec",
    light: "#f0fdf4",
    secondary: "#047857",
    accent: "#d97706",
    card: "rgba(255, 255, 255, 0.86)",
    border: "#86efac",
    text: "#14342b",
    muted: "#4b635b",
    buttonText: "#ffffff"
  },

  crimson: {
    primary: "#fff1f2",
    light: "#fff7ed",
    secondary: "#9f1239",
    accent: "#f59e0b",
    card: "rgba(255, 255, 255, 0.88)",
    border: "#fda4af",
    text: "#30151c",
    muted: "#6b4b52",
    buttonText: "#ffffff"
  },

  violet: {
    primary: "#f3e8ff",
    light: "#faf5ff",
    secondary: "#6d28d9",
    accent: "#d6a700",
    card: "rgba(255, 255, 255, 0.88)",
    border: "#c4b5fd",
    text: "#241733",
    muted: "#62516f",
    buttonText: "#ffffff"
  },

  slate: {
    primary: "#e2e8f0",
    light: "#f8fafc",
    secondary: "#334155",
    accent: "#0ea5e9",
    card: "rgba(255, 255, 255, 0.9)",
    border: "#cbd5e1",
    text: "#0f172a",
    muted: "#475569",
    buttonText: "#ffffff"
  },

  olive: {
    primary: "#ece8d9",
    light: "#faf8ef",
    secondary: "#4d5d2f",
    accent: "#b45309",
    card: "rgba(255, 252, 242, 0.9)",
    border: "#c7bea0",
    text: "#25291c",
    muted: "#62664b",
    buttonText: "#ffffff"
  },
orange: {
  primary: "#fff1e7",
  light: "#fff8f1",
  secondary: "#ea580c",
  accent: "#fb923c",
  card: "rgba(255, 252, 247, 0.95)",
  border: "#fed7aa",
  text: "#2f1b0c",
  muted: "#7c4a24",
  buttonText: "#ffffff"
},

pink: {
  primary: "#fff1f7",
  light: "#fff8fb",
  secondary: "#db2777",
  accent: "#f472b6",
  card: "rgba(255, 250, 253, 0.95)",
  border: "#fbcfe8",
  text: "#3b1025",
  muted: "#7a294f",
  buttonText: "#ffffff"
},

teal: {
  primary: "#ecfeff",
  light: "#f8ffff",
  secondary: "#0f766e",
  accent: "#2dd4bf",
  card: "rgba(248, 255, 255, 0.95)",
  border: "#99f6e4",
  text: "#123532",
  muted: "#3f6f68",
  buttonText: "#ffffff"
},

sand: {
  primary: "#f5ead7",
  light: "#fffaf0",
  secondary: "#92400e",
  accent: "#d97706",
  card: "rgba(255, 250, 240, 0.95)",
  border: "#e7cda8",
  text: "#2d2115",
  muted: "#6b5a45",
  buttonText: "#ffffff"
},


moss: {
  primary: "#ddebd7",
  light: "#f5fbf1",
  secondary: "#355e3b",
  accent: "#e3b341",
  card: "rgba(247,252,244,0.95)",
  border: "#9fbc9c",
  text: "#1d2b20",
  muted: "#5f7362",
  buttonText: "#ffffff"
},

storm: {
  primary: "#d6dde8",
  light: "#f3f6fb",
  secondary: "#334155",
  accent: "#60a5fa",
  card: "rgba(248,251,255,0.94)",
  border: "#aebed3",
  text: "#18222d",
  muted: "#586575",
  buttonText: "#ffffff"
},

coffee: {
  primary: "#f2e3d5",
  light: "#fff8f2",
  secondary: "#7b4b2a",
  accent: "#f59e0b",
  card: "rgba(255,250,244,0.95)",
  border: "#d8b89a",
  text: "#2d1e15",
  muted: "#725747",
  buttonText: "#ffffff"
},

forest: {
  primary: "#d9f0e2",
  light: "#f4fcf7",
  secondary: "#14532d",
  accent: "#34d399",
  card: "rgba(246,253,248,0.95)",
  border: "#8cc7a3",
  text: "#173126",
  muted: "#557566",
  buttonText: "#ffffff"
},

obsidian: {
  primary: "#151821",
  light: "#1f2430",
  secondary: "#0b1120",
  accent: "#facc15",
  card: "rgba(26,30,40,0.97)",
  border: "#374151",
  text: "#f9fafb",
  muted: "#9ca3af",
  buttonText: "#ffffff"
},

wine: {
  primary: "#f8e4ea",
  light: "#fff5f7",
  secondary: "#881337",
  accent: "#fb7185",
  card: "rgba(255,248,250,0.95)",
  border: "#efb6c3",
  text: "#3b1020",
  muted: "#7b4a59",
  buttonText: "#ffffff"
},

ocean: {
  primary: "#dff4fb",
  light: "#f4fcff",
  secondary: "#0369a1",
  accent: "#38bdf8",
  card: "rgba(247,253,255,0.95)",
  border: "#93d5ec",
  text: "#123040",
  muted: "#4f7282",
  buttonText: "#ffffff"
},

charcoal: {
  primary: "#23272f",
  light: "#313641",
  secondary: "#111827",
  accent: "#f97316",
  card: "rgba(35,39,47,0.97)",
  border: "#4b5563",
  text: "#f8fafc",
  muted: "#cbd5e1",
  buttonText: "#ffffff"
},

antique: {
  primary: "#f4e7cf",
  light: "#fffaf0",
  secondary: "#8b5e34",
  accent: "#d97706",
  card: "rgba(255,251,243,0.95)",
  border: "#dcc29a",
  text: "#332417",
  muted: "#74614b",
  buttonText: "#ffffff"
},

glacier: {
  primary: "#e3f3ff",
  light: "#f6fbff",
  secondary: "#2563eb",
  accent: "#7dd3fc",
  card: "rgba(250,254,255,0.95)",
  border: "#abd8f0",
  text: "#172b3a",
  muted: "#5e7685",
  buttonText: "#ffffff"
}
};

function applyAppTheme(themeName) {
  const theme = APP_THEMES[themeName] || APP_THEMES.parchment;

  document.documentElement.style.setProperty("--primary-color", theme.primary);
  document.documentElement.style.setProperty("--primary-light", theme.light);
  document.documentElement.style.setProperty("--secondary-color", theme.secondary);
  document.documentElement.style.setProperty("--accent-color", theme.accent);
  document.documentElement.style.setProperty("--card-color", theme.card);
  document.documentElement.style.setProperty("--border-color", theme.border);
  document.documentElement.style.setProperty("--font-color", theme.text);
  document.documentElement.style.setProperty("--muted-color", theme.muted);
  document.documentElement.style.setProperty("--btn-text-color", theme.buttonText);

  document.body.classList.toggle("dark", themeName === "midnight");

  document.querySelectorAll(".theme-preset").forEach(btn => {
    btn.classList.toggle("selected", btn.classList.contains(themeName));
  });
}

function setAppTheme(themeName) {
  localStorage.setItem("appTheme", themeName);
  localStorage.removeItem("primaryColor");
  localStorage.removeItem("secondaryColor");
  localStorage.removeItem("fontColor");

  applyAppTheme(themeName);
}




// load saved preference
window.addEventListener("load", () => {
  const savedTheme = localStorage.getItem("appTheme") || "royal";
  const isDark = savedTheme === "midnight";

  const toggle = document.getElementById("darkModeToggle");
  if (toggle) toggle.checked = isDark;

  localStorage.setItem("darkMode", isDark ? "true" : "false");

  applyAppTheme(savedTheme);
});

function getReadableButtonTextColor(buttonColor) {
  const hex = buttonColor.replace("#", "");

  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  const brightness = (r * 299 + g * 587 + b * 114) / 1000;

  return brightness > 150 ? "#1f2933" : "#ffffff";
}



function toggleResetSection() {
  const el = document.getElementById("resetContent");
  el.classList.toggle("open");
}

function toggleTranslationResetSection() {
  const section = document.getElementById("translationResetContent");
  if (!section) return;

  section.classList.toggle("open");
}
function showInfoModal() {
  const modal = document.getElementById("infoModal");
  if (modal) modal.classList.add("open");
}

function hideInfoModal() {
  const modal = document.getElementById("infoModal");
  if (modal) modal.classList.remove("open");

  updateProfileAttention();
}

function closeInfoModal(event) {
  if (event.target.id === "infoModal") {
    hideInfoModal();
  }
}

function showLearnInfoModal() {
  const modal = document.getElementById("learnInfoModal");
  if (modal) modal.classList.add("open");
}

function hideLearnInfoModal() {
  const modal = document.getElementById("learnInfoModal");
  if (modal) modal.classList.remove("open");
}

function closeLearnInfoModal(event) {
  if (event.target.id === "learnInfoModal") {
    hideLearnInfoModal();
  }
}

function showTranslateMenu() {
  buildChapterCheckboxes("translateChapterList", "translateChapter");
  showScreen("translateMenu");
}

function startTranslatePractice() {
  const selectedChapters = getSelectedChapters("translateChapter");

  if (selectedChapters.length === 0) {
    alert("Choose at least one chapter.");
    return;
  }

  translateSentences = PRACTICE_SENTENCES.filter(sentence =>
  selectedChapters.includes(sentence.chapter)
);

  if (translateSentences.length === 0) {
    alert("No practice sentences have been added for those chapters yet.");
    return;
  }

  translateSentences = shuffle(translateSentences);
  translateIndex = 0;

  showScreen("translateScreen");
  renderTranslateSentence();
}

function renderTranslateSentence() {
  currentSentence = translateSentences[translateIndex];

  document.getElementById("translateProgress").textContent =
    `${translateIndex + 1} / ${translateSentences.length}`;

  document.getElementById("translateGreek").textContent = currentSentence.greek;
  document.getElementById("translateInput").value = "";
  document.getElementById("translateInput").disabled = false;

  document.getElementById("translationReveal").classList.remove("open");
  document.getElementById("translationExplanation").classList.remove("open");
  document.getElementById("translationExplanation").innerHTML = "";

  document.getElementById("revealTranslateBtn").style.display = "block";

  translationGradedThisSentence = false;

const gradeButtons = document.getElementById("translationGradeButtons");
const gradeSaved = document.getElementById("translationGradeSaved");

if (gradeButtons) {
  gradeButtons.style.display = "grid";
  gradeButtons.querySelectorAll("button").forEach(btn => {
    btn.disabled = false;
  });
}

if (gradeSaved) {
  gradeSaved.textContent = "";
}
}

function revealTranslation() {
  const userAnswer = document.getElementById("translateInput").value.trim();

  document.getElementById("userTranslationText").textContent =
    userAnswer || "No answer typed.";

  document.getElementById("suggestedTranslationText").textContent =
    currentSentence.translation;

  document.getElementById("translateInput").disabled = true;
  document.getElementById("translationReveal").classList.add("open");
  document.getElementById("revealTranslateBtn").style.display = "none";
}

let translationXPCount =
  Number(localStorage.getItem("translationXPCount")) || 0;

function gradeTranslation(result) {
  if (!currentSentence || translationGradedThisSentence) return;

  const id = currentSentence.id;

  if (!translationProgress[id]) {
    translationProgress[id] = {
      chapter: currentSentence.chapter,
      got: 0,
      almost: 0,
      missed: 0,
      attempts: 0
    };
  }

  translationProgress[id][result]++;
  translationProgress[id].attempts++;

  localStorage.setItem("translationProgress", JSON.stringify(translationProgress));

  translationGradedThisSentence = true;

  const gradeButtons = document.getElementById("translationGradeButtons");
  const gradeSaved = document.getElementById("translationGradeSaved");

  if (gradeButtons) {
    gradeButtons.querySelectorAll("button").forEach(btn => {
      btn.disabled = true;
    });
  }

  if (gradeSaved) {
    gradeSaved.textContent = "Saved!";
  }

  let xpAmount = 0;

  if (result === "got") xpAmount = 15;
  if (result === "almost") xpAmount = 8;
  if (result === "missed") xpAmount = 3;

  addXP(xpAmount, "Translation practice saved!", false);

  translationXPCount++;
  localStorage.setItem("translationXPCount", translationXPCount);

  if (translationXPCount % 5 === 0) {
    addXP(50, "You completed 5 translation practices!", true);

    unlockAchievement("firstFiveTranslations");
  }
}

function toggleTranslationExplanation() {
  const explanationBox = document.getElementById("translationExplanation");

  if (explanationBox.classList.contains("open")) {
    explanationBox.classList.remove("open");
    return;
  }

  const breakdownHtml = currentSentence.wordBreakdown
    .map(item => `
      <div class="breakdown-row">
        <strong>${item.greek}</strong>
        <span>${item.meaning}</span>
        <small>${item.note}</small>
      </div>
    `)
    .join("");

  explanationBox.innerHTML = `
    <h3>Why this translation works</h3>

    <div class="structure-pill">${currentSentence.structure}</div>

    <div class="word-breakdown">
      ${breakdownHtml}
    </div>

    <p>${currentSentence.explanation}</p>
  `;

  explanationBox.classList.add("open");
}

function nextTranslateSentence() {
  if (translateIndex < translateSentences.length - 1) {
    translateIndex++;
  } else {
    translateIndex = 0;
    translateSentences = shuffle(translateSentences);
  }

  renderTranslateSentence();
}

function showTranslateInfoModal() {
  const modal = document.getElementById("translateInfoModal");
  if (modal) modal.classList.add("open");
}

function hideTranslateInfoModal() {
  const modal = document.getElementById("translateInfoModal");
  if (modal) modal.classList.remove("open");
}

function closeTranslateInfoModal(event) {
  if (event.target.id === "translateInfoModal") {
    hideTranslateInfoModal();
  }
}
function toggleProgressSection(id, button) {
  const section = document.getElementById(id);
  if (!section) return;

  section.classList.toggle("open");

  if (button) {
    button.classList.toggle("open");
  }
}
function resetTranslationData() {
  const confirmReset = confirm(
    "Are you sure you want to reset all translation progress? This cannot be undone."
  );

  if (!confirmReset) return;

  localStorage.removeItem("translationProgress");
  translationProgress = {};

  const section = document.getElementById("translationResetContent");
  if (section) section.classList.remove("open");

  alert("Translation progress has been reset.");
}

function toggleLessonResetSection() {
  document.getElementById("lessonResetContent").classList.toggle("open");
}

function markWordAsKnown() {
  const currentWord = testWords[testIndex];
  testCorrect++;


  if (!currentWord) return;

  if (!knownWords.includes(currentWord.id)) {
    knownWords.push(currentWord.id);
    localStorage.setItem("knownWords", JSON.stringify(knownWords));
  }

  nextTestWord(); // skip it immediately
}
function updateKnownButton() {
  const currentWord = testWords[testIndex];
  const btn = document.getElementById("knownBtn");

  if (!btn || !currentWord) return;

  btn.textContent = knownWords.includes(currentWord.id)
    ? "Marked as Known ✓"
    : "I know this word";
}
function showKnownWordsModal() {
  const content = document.getElementById("knownWordsContent");

  if (knownWords.length === 0) {
    content.innerHTML = `
      <p>
        When you mark a word as <strong>I know this word</strong>, it will be removed
        from future tests so you can focus on words you still need to practice.
      </p>

      <p>
        Once you mark words as known, they will appear here.
      </p>
    `;
  } else {
    content.innerHTML = knownWords
      .map(id => VOCAB.find(word => word.id === id))
      .filter(Boolean)
      .map(word => `
        <div class="known-word-row">
          <div>
            <strong>${word.greek}</strong><br>
            <span>${word.meaning}</span>
          </div>

          <button class="known-remove-btn" onclick="removeKnownWord('${word.id}')">
            ×
          </button>
        </div>
      `)
      .join("");
  }

  document.getElementById("knownWordsModal").classList.add("open");
}

function hideKnownWordsModal() {
  document.getElementById("knownWordsModal").classList.remove("open");
}

function closeKnownWordsModal(event) {
  if (event.target.id === "knownWordsModal") {
    hideKnownWordsModal();
  }
}

function removeKnownWord(wordId) {
  knownWords = knownWords.filter(id => String(id) !== String(wordId));
  localStorage.setItem("knownWords", JSON.stringify(knownWords));
  showKnownWordsModal();
}

function hideKnownWordsModal() {
  document.getElementById("knownWordsModal").classList.remove("open");
}

function closeKnownWordsModal(event) {
  if (event.target.id === "knownWordsModal") {
    hideKnownWordsModal();
  }
}




const learnLessonTitles = {
  history: "NT Greek Overview",
  alphabet: "Greek Alphabet",
  pronunciation: "Pronunciation",
  nouns: "Noun System",
  cases: "Case Endings",
  howToRead: "How to Read Greek"
};

function toggleLearnSideMenu(event) {
  if (event) event.stopPropagation();

  const menu = document.getElementById("learnSideMenu");
  const overlay = document.getElementById("learnSideOverlay");

  menu.classList.toggle("open");
  overlay.classList.toggle("open");
}

function closeLearnSideMenu() {
  const menu = document.getElementById("learnSideMenu");
  const overlay = document.getElementById("learnSideOverlay");

  if (menu) menu.classList.remove("open");
  if (overlay) overlay.classList.remove("open");
}

function showLearnLesson(lesson) {
  const dashboard = document.getElementById("learnDashboard");

  if (dashboard) dashboard.style.display = "none";

  document.querySelectorAll(".learn-lesson").forEach(section => {
    section.classList.remove("active");
  });

  const lessonSection = document.getElementById(lesson + "Lesson");

  if (!lessonSection) {
    console.warn("Missing lesson section:", lesson + "Lesson");
    return;
  }

  lessonSection.classList.add("active");
  currentLearnLesson = lesson;

  updateLessonTopBar(lesson);

  restoreOpenedLessonBlocks(lessonSection, lesson);
  updateCompleteLessonButton(lesson);

  closeLearnSideMenu();
}

  setTimeout(() => {
  const menuBtn = document.getElementById('learnMenuBtn');
  if (menuBtn) {
    menuBtn.classList.add('menu-hint');
  }
}, 500);

function showNewLearnMenu() {
  
  showScreen("newLearnMenu");

  const overlay = document.getElementById("learnWelcomeOverlay");

  if (overlay && localStorage.getItem("hasSeenLearnWelcome") !== "true") {
    overlay.classList.add("open");
  }
}

function closeLearnWelcome() {
  localStorage.setItem("hasSeenLearnWelcome", "true");

  const overlay = document.getElementById("learnWelcomeOverlay");
  if (overlay) overlay.classList.remove("open");
}
document.addEventListener("DOMContentLoaded", () => {
  const hasSeenHomeIntro = localStorage.getItem("hasSeenHomeIntro");

  if (!hasSeenHomeIntro) {
    showInfoModal();
    localStorage.setItem("hasSeenHomeIntro", "true");
  }
});
function showLearnInfo() {
  const overlay = document.getElementById("learnWelcomeOverlay");
  if (overlay) {
    overlay.classList.add("open");
  }
}
function showLearnDashboard() {
  const dashboard = document.getElementById("learnDashboard");
  const title = document.getElementById("learnLessonTitle");
  const action = document.getElementById("learnTopAction");

  document.querySelectorAll(".learn-lesson").forEach(section => {
    section.classList.remove("active");
  });

  if (dashboard) dashboard.style.display = "block";

  currentLearnLesson = null;

  if (title) title.textContent = "Lessons";

  if (action) {
    action.innerHTML = `<span class="material-symbols-outlined">info</span>`;
    action.title = "Info";
    action.onclick = showLearnInfo;
  }
}
function handleLearnBack() {
  if (currentLearnLesson) {
    showLearnDashboard();
  } else {
    showHome();
  }
}


function toggleLessonBlock(block) {
  const lesson = block.closest(".learn-lesson");

  if (!lesson) {
    block.classList.toggle("open");
    return;
  }

  const wasAlreadyOpen = block.classList.contains("open");

  lesson.querySelectorAll(".lesson-block").forEach(otherBlock => {
    if (otherBlock !== block && otherBlock.classList.contains("open")) {
      otherBlock.classList.remove("open");
      markLessonBlockOpened(lesson, otherBlock);
    }
  });

  block.classList.toggle("open");

  // Mark it as opened immediately the first time they open it
  if (block.classList.contains("open")) {
    markLessonBlockOpened(lesson, block);
    block.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  // If they manually close it, keep it marked too
  if (wasAlreadyOpen) {
    markLessonBlockOpened(lesson, block);
  }

  updateCompleteLessonButton(getLessonIdFromSection(lesson));
}
function getLessonIdFromSection(lessonSection) {
  return lessonSection.id.replace("Lesson", "");
}

function markLessonBlockOpened(lessonSection, block) {
  const lessonId = getLessonIdFromSection(lessonSection);
  const blocks = Array.from(lessonSection.querySelectorAll(".lesson-block"));
  const blockIndex = blocks.indexOf(block);

  if (blockIndex === -1) return;

  //  THIS makes the checkmark appear immediately
  block.classList.add("visited");

  if (!openedLessonBlocks[lessonId]) {
    openedLessonBlocks[lessonId] = [];
  }

  if (!openedLessonBlocks[lessonId].includes(blockIndex)) {
    openedLessonBlocks[lessonId].push(blockIndex);
  }

  localStorage.setItem("openedLessonBlocks", JSON.stringify(openedLessonBlocks));

  updateCompleteLessonButton(lessonId);
}

function restoreOpenedLessonBlocks(lessonSection, lessonId) {
  const opened = openedLessonBlocks[lessonId] || [];

  lessonSection.querySelectorAll(".lesson-block").forEach((block, index) => {
    if (opened.includes(index)) {
      block.classList.add("visited");
    }
  });
}

function hasOpenedAllLessonBlocks(lessonId) {
  const lessonSection = document.getElementById(lessonId + "Lesson");
  if (!lessonSection) return false;

  const totalBlocks = lessonSection.querySelectorAll(".lesson-block").length;
  const openedCount = openedLessonBlocks[lessonId]?.length || 0;

  return totalBlocks > 0 && openedCount >= totalBlocks;
}

function updateCompleteLessonButton(lessonId) {
  const btn = document.querySelector(`[data-complete-lesson="${lessonId}"]`);
  const message = document.querySelector(`[data-complete-message="${lessonId}"]`);

  if (!btn) return;

  const ready = hasOpenedAllLessonBlocks(lessonId);
  const completed = completedLessons[lessonId] === true;

  btn.disabled = !ready || completed;

  if (completed) {
    btn.textContent = "Lesson Completed ✓";
    if (message) message.textContent = "Nice work — this lesson is marked complete.";
  } else if (ready) {
    btn.textContent = "Complete Lesson";
    if (message) message.textContent = "You opened every section. You can complete the lesson now.";
  } else {
    btn.textContent = "Complete Lesson";
    if (message) message.textContent = "Open every lesson section before completing this lesson.";
  }
}

function completeLesson(lessonId) {
  if (completedLessons[lessonId] === true) return;
  if (!hasOpenedAllLessonBlocks(lessonId)) return;

  const wasVocabUnlocked = vocabLessonsCompleted();
  const wasAllComplete = allRequiredLessonsCompleted();

  completedLessons[lessonId] = true;
  localStorage.setItem("completedLessons", JSON.stringify(completedLessons));

  const completeBtn = document.querySelector(`[data-complete-lesson="${lessonId}"]`);
  const completeMsg = document.querySelector(`[data-complete-message="${lessonId}"]`);

  if (completeBtn) {
    completeBtn.disabled = true;
    completeBtn.textContent = "Completed";
    completeBtn.classList.add("completed");
  }

  if (completeMsg) {
    completeMsg.textContent = "Lesson completed!";
  }

  updateLessonCompletionUI();
  updatePracticeToolLocks();

  const nowVocabUnlocked = vocabLessonsCompleted();
  const nowAllComplete = allRequiredLessonsCompleted();

  addXP(100, "Lesson completed!", true);

  if (!wasVocabUnlocked && nowVocabUnlocked) {
    showVocabUnlockedModal();
    return;
  }

  if (!wasAllComplete && nowAllComplete) {
    practiceToolsUnlocked = true;
    localStorage.setItem("practiceToolsUnlocked", "true");
    updatePracticeToolLocks();
    showAllLessonsCompleteModal();
    return;
  }

  showLessonCompleteModal(lessonId);
  unlockAchievement("firstLesson");
}

function updateLessonCompletionUI() {
  document.querySelectorAll("[data-lesson-status]").forEach(status => {
    const lessonId = status.dataset.lessonStatus;
    const isCompleted = completedLessons[lessonId] === true;

    status.innerHTML = isCompleted
      ? `<span class="lesson-check">✓</span> Completed`
      : `<span class="lesson-not-complete">○</span> Not completed`;

    status.classList.toggle("completed", isCompleted);
  });
}

function resetLessonData() {
  const confirmed = confirm(
    "Are you sure?\n\nThis will reset all lesson completion data and opened lesson sections. This cannot be undone."
  );

  if (!confirmed) return;

  localStorage.removeItem("completedLessons");
  localStorage.removeItem("openedLessonBlocks");

  completedLessons = {};
  openedLessonBlocks = {};

  document.querySelectorAll(".lesson-block").forEach(block => {
    block.classList.remove("visited", "open");
  });

  updateLessonCompletionUI();

  alert("Lesson data has been reset.");
  showHome();
}


function revealAnswer(eventOrButton, maybeButton) {
  const event = maybeButton ? eventOrButton : null;
  const btn = maybeButton || eventOrButton;

  if (event && event.stopPropagation) {
    event.stopPropagation();
  }

  if (!btn) return;

  const card = btn.closest(".check-card");
  const answerRow = btn.closest(".answer-row");
  const interactive = btn.closest(".lesson-interactive");

  if (card) {
    card.classList.add("revealed");

    const checkAnswer = card.querySelector(".check-answer");
    if (checkAnswer) checkAnswer.classList.add("visible");
  }

  if (answerRow) {
    const answerText = answerRow.querySelector(".answer-text");
    if (answerText) answerText.classList.add("visible");
  }

  if (!card && !answerRow && interactive) {
    const answer =
      interactive.querySelector(".answer-text") ||
      interactive.querySelector(".check-answer");

    if (answer) answer.classList.add("visible");
  }

  btn.textContent = "Revealed";
  btn.disabled = true;
}
function toggleAlphabetReference(event) {
  event.stopPropagation();

  const reference = document.getElementById("alphabetReference");
  if (!reference) return;

  reference.classList.toggle("open");
}
function showAlphabetModal(event) {
  if (event) event.stopPropagation();

  currentAlphabetPage = 0;
  changeAlphabetPage(0);
  document.getElementById("alphabetModal").classList.add("open");

  localStorage.setItem("hasOpenedAlphabetReference", "true");

  const hint = document.getElementById("alphabetViewHint");
  if (hint) hint.classList.add("hidden");
}

function hideAlphabetModal() {
  document.getElementById("alphabetModal").classList.remove("open");
}

function closeAlphabetModal(event) {
  if (event.target.id === "alphabetModal") {
    hideAlphabetModal();
  }
}

function showSoundModal(event) {
  if (event) event.stopPropagation();

  document.getElementById("soundModal").classList.add("open");

  localStorage.setItem("hasOpenedSoundReference", "true");

  const hint = document.getElementById("soundViewHint");
  if (hint) hint.classList.add("hidden");
}

function hideSoundModal() {
  document.getElementById("soundModal").classList.remove("open");
}

function closeSoundModal(event) {
  if (event.target.id === "soundModal") {
    hideSoundModal();
  }
}

function showLessonCompleteModal(lessonId) {
  const modal = document.getElementById("lessonCompleteModal");
  const nextBtn = document.getElementById("nextLessonBtn");

  modal.classList.add("active");

  nextBtn.onclick = () => {
    hideLessonCompleteModal();
    showLearnDashboard();
  };
}

function hideLessonCompleteModal() {
  document.getElementById("lessonCompleteModal").classList.remove("active");
}

function showLessonCheatSheet(title, content) {
  document.getElementById("lessonCheatTitle").textContent = title;
  document.getElementById("lessonCheatContent").innerHTML = content;
  document.getElementById("lessonCheatModal").classList.add("open");
}

function hideLessonCheatSheet() {
  document.getElementById("lessonCheatModal").classList.remove("open");
}

function closeLessonCheatSheet(event) {
  if (event.target.id === "lessonCheatModal") {
    hideLessonCheatSheet();
  }
}

function showOverviewCheatSheet() {
  showLessonCheatSheet(
    "Lesson 1 Cheat Sheet",
    `
      <p class="cheat-intro">
        This is a quick reference for the key ideas in this lesson.  
        It is not meant to replace the lesson—just to help you review quickly.
      </p>

      <div class="cheat-list">
        <div><strong>Koine Greek</strong><span>Means “common” Greek.</span></div>
        <div><strong>NT Language</strong><span>The New Testament was written in everyday Greek.</span></div>
        <div><strong>Main Goal</strong><span>Understand what is written more clearly.</span></div>
        <div><strong>Not a Hidden Code</strong><span>Greek gives clarity, not secret meaning.</span></div>
      </div>
    `
  );
}

function showNounCheatSheet() {
  showLessonCheatSheet(
    "Lesson 4 Cheat Sheet",
    `
      <p class="cheat-intro">
        This is a quick reference for the key ideas in this lesson.  
        It helps you review patterns—not replace learning them step-by-step.
      </p>

      <div class="cheat-list">
        <div><strong>Noun</strong><span>Person, place, thing, or idea.</span></div>
        <div><strong>Subject</strong><span>The one doing the action.</span></div>
        <div><strong>Object</strong><span>The one receiving the action.</span></div>
        <div><strong>-ος</strong><span>Usually points to the subject.</span></div>
        <div><strong>-ον</strong><span>Usually points to the object.</span></div>
        <div><strong>Articles</strong><span>Match the noun and help confirm its role.</span></div>
      </div>
    `
  );
}

function showHowToReadCheatSheet() {
  showLessonCheatSheet(
    "Lesson 6 Cheat Sheet",
    `
      <p class="cheat-intro">
        Use this as a quick reading checklist. Do not try to translate everything at once.
        Slow down, find the pieces, then build the meaning.
      </p>

      <div class="cheat-list">
        <div>
          <strong>1. Find the verb</strong>
          <span>Look for the main action or statement. Example: ἐστιν = is.</span>
        </div>

        <div>
          <strong>2. Find the subject</strong>
          <span>Ask: who or what is the sentence about?</span>
        </div>

        <div>
          <strong>3. Group words together</strong>
          <span>Article + noun usually belong together. Example: ὁ θεός = God.</span>
        </div>

        <div>
          <strong>4. Notice endings</strong>
          <span>Endings help show the word’s role in the sentence.</span>
        </div>

        <div>
          <strong>5. Build the meaning</strong>
          <span>Put the pieces together after you recognize them.</span>
        </div>

        <div>
          <strong>Big rule</strong>
          <span>Do not start with “What does the whole sentence mean?” Start with “What pieces do I recognize?”</span>
        </div>
      </div>
    `
  );
}

function updateLessonTopBar(lesson) {
  const title = document.getElementById("learnLessonTitle");
  const action = document.getElementById("learnTopAction");

  if (!title || !action) return;

  const lessonNumbers = {
    history: "Lesson 1",
    alphabet: "Lesson 2",
    pronunciation: "Lesson 3",
    nouns: "Lesson 4",
    cases: "Lesson 5",
    howToRead: "Lesson 6"
  };

  title.innerHTML = `
    <span class="top-lesson-kicker">${lessonNumbers[lesson] || "Lesson"}</span>
    <span class="top-lesson-title">${learnLessonTitles[lesson] || "Lesson"}</span>
  `;

  if (lesson === "history") {
    action.innerHTML = `<span class="material-symbols-outlined">description</span>`;
    action.title = "Cheat Sheet";
    action.onclick = showOverviewCheatSheet;
  } else if (lesson === "alphabet") {
    action.innerHTML = `Ω`;
    action.title = "Alphabet Reference";
    action.onclick = showAlphabetModal;
  } else if (lesson === "pronunciation") {
    action.innerHTML = `Ω`;
    action.title = "Sound Reference";
    action.onclick = showSoundModal;
  } else if (lesson === "nouns") {
  action.innerHTML = `<span class="material-symbols-outlined">description</span>`;
  action.title = "Cheat Sheet";
  action.onclick = showNounCheatSheet;
} else if (lesson === "cases") {
  action.innerHTML = `<span class="material-symbols-outlined">table_chart</span>`;
  action.title = "Paradigms";
  action.onclick = openParadigmModal;
} else if (lesson === "howToRead") {
  action.innerHTML = `<span class="material-symbols-outlined">description</span>`;
  action.title = "Cheat Sheet";
  action.onclick = showHowToReadCheatSheet;
} else {
  action.innerHTML = `<span class="material-symbols-outlined">info</span>`;
  action.title = "Info";
  action.onclick = showLearnInfo;
}
}

function openCaseChartModal(event) {
  event.stopPropagation();
  document.getElementById("caseChartModal").classList.add("open");
}

function closeCaseChartModal() {
  document.getElementById("caseChartModal").classList.remove("open");
}

let currentParadigmPage = 0;

const paradigmTitles = [
  "Case Ending Chart",
  "Article Paradigm",
  "λόγος Full Paradigm"
];

function openParadigmModal(event) {
  if (event) event.stopPropagation();
  currentParadigmPage = 0;
  updateParadigmPage();
  document.getElementById("paradigmModal").classList.add("open");
}

function closeParadigmModal() {
  document.getElementById("paradigmModal").classList.remove("open");
}

function changeParadigmPage(direction) {
  currentParadigmPage += direction;

  if (currentParadigmPage < 0) currentParadigmPage = 2;
  if (currentParadigmPage > 2) currentParadigmPage = 0;

  updateParadigmPage();
}

function updateParadigmPage() {
  document.querySelectorAll(".paradigm-page").forEach((page, index) => {
    page.classList.toggle("active", index === currentParadigmPage);
  });

  const title = document.getElementById("paradigmModalTitle");
  if (title) title.textContent = paradigmTitles[currentParadigmPage];

  const dots = document.getElementById("paradigmPageDots");
  if (dots) {
    dots.textContent = ["○", "○", "○"]
      .map((dot, index) => index === currentParadigmPage ? "●" : dot)
      .join(" ");
  }
}

let currentAlphabetPage = 0;

function changeAlphabetPage(direction) {
  currentAlphabetPage += direction;

  if (currentAlphabetPage < 0) currentAlphabetPage = 1;
  if (currentAlphabetPage > 1) currentAlphabetPage = 0;

  document.querySelectorAll("#alphabetModal .alphabet-page").forEach((page, index) => {
    page.classList.toggle("active", index === currentAlphabetPage);
  });

  const dots = document.getElementById("alphabetPageDots");
  if (dots) {
    dots.textContent = currentAlphabetPage === 0 ? "● ○" : "○ ●";
  }

  const title = document.getElementById("alphabetModalTitle");
  const subtitle = document.getElementById("alphabetModalSubtitle");

  if (title) title.textContent = currentAlphabetPage === 0 ? "Greek Alphabet" : "Greek Diphthongs";
  if (subtitle) {
    subtitle.textContent =
      currentAlphabetPage === 0
        ? "Quick reference for letter shapes and names."
        : "Quick reference for vowel pairs that make one sound.";
  }
}

let currentAlphabetPageL3 = 0;

function showAlphabetModalLesson3() {
  currentAlphabetPageL3 = 0;
  updateAlphabetPageL3();
  document.getElementById("alphabetModalLesson3").classList.add("open");
}

function hideAlphabetModalLesson3() {
  document.getElementById("alphabetModalLesson3").classList.remove("open");
}

function closeAlphabetModalLesson3(e) {
  if (e.target.id === "alphabetModalLesson3") {
    hideAlphabetModalLesson3();
  }
}

function changeAlphabetPageL3(direction) {
  currentAlphabetPageL3 += direction;

  if (currentAlphabetPageL3 < 0) currentAlphabetPageL3 = 1;
  if (currentAlphabetPageL3 > 1) currentAlphabetPageL3 = 0;

  updateAlphabetPageL3();
}

function updateAlphabetPageL3() {
  document.querySelectorAll(".alphabet-page-l3").forEach((page, index) => {
    page.classList.toggle("active", index === currentAlphabetPageL3);
  });

  document.getElementById("alphabetDotsL3").textContent =
    currentAlphabetPageL3 === 0 ? "● ○" : "○ ●";

  document.getElementById("alphabetModalTitleL3").textContent =
    currentAlphabetPageL3 === 0 ? "Greek Alphabet" : "Greek Diphthongs";

  document.getElementById("alphabetModalSubtitleL3").textContent =
    currentAlphabetPageL3 === 0
      ? "Quick reference for letter shapes and names."
      : "Vowel pairs that form one sound.";
}

function allRequiredLessonsCompleted() {
  return REQUIRED_LESSONS.every(lessonId => completedLessons[lessonId] === true);
}

function arePracticeToolsUnlocked() {
  return practiceToolsUnlocked || allRequiredLessonsCompleted();
}

function tryOpenLockedFeature(feature) {
  if (!isFeatureUnlocked(feature)) {
    shakeLockedButton(feature);
    showLockedFeatureModal();
    return;
  }

  const btnMap = {
    vocab: "vocabHomeBtn",
    translate: "translateHomeBtn",
    test: "testHomeBtn"
  };

  const btnId = btnMap[feature];
  localStorage.setItem(`openedUnlocked_${btnId}`, "true");
  updatePracticeToolLocks();

  if (feature === "vocab") showLearnMenu();
  if (feature === "translate") showTranslateMenu();
  if (feature === "test") showTestMenu();
}

function shakeLockedButton(feature) {
  const btnMap = {
    vocab: "vocabHomeBtn",
    translate: "translateHomeBtn",
    test: "testHomeBtn"
  };

  const btn = document.getElementById(btnMap[feature]);
  if (!btn) return;

  btn.classList.remove("lock-shake");
  void btn.offsetWidth;
  btn.classList.add("lock-shake");

  setTimeout(() => {
    btn.classList.remove("lock-shake");
  }, 500);
}

function showLockedFeatureModal() {
  const modal = document.getElementById("lockedFeatureModal");
  const lock = modal?.querySelector(".big-lock");

  if (!modal) return;

updateLockedModalProgress();

  modal.classList.add("open");

  if (lock) {
    lock.classList.remove("lock-shake");
    void lock.offsetWidth;
    lock.classList.add("lock-shake");
  }

  
}

function hideLockedFeatureModal() {
  document.getElementById("lockedFeatureModal")?.classList.remove("open");
}

function closeLockedFeatureModal(event) {
  if (event.target.id === "lockedFeatureModal") {
    hideLockedFeatureModal();
  }
}

function unlockPracticeToolsManually() {
  const modal = document.getElementById("lockedFeatureModal");
  const lock = modal?.querySelector(".big-lock");

  if (lock) {
    lock.classList.remove("lock-shake");
    lock.classList.add("break-open");
  }

  setTimeout(() => {
    practiceToolsUnlocked = true;
    localStorage.setItem("practiceToolsUnlocked", "true");

    hideLockedFeatureModal();
    updatePracticeToolLocks();

    if (lock) lock.classList.remove("break-open");
  }, 650);
}

function updatePracticeToolLocks() {
  const featureMap = {
    vocabHomeBtn: "vocab",
    translateHomeBtn: "translate",
    testHomeBtn: "test"
  };

  Object.keys(featureMap).forEach(id => {
    const btn = document.getElementById(id);
    if (!btn) return;

    const feature = featureMap[id];
    const unlocked = isFeatureUnlocked(feature);

    btn.classList.toggle("unlocked", unlocked);

    const icon = btn.querySelector(".lock-icon");

    if (icon) {
      const openedKey = `openedUnlocked_${id}`;
      const alreadyOpened = localStorage.getItem(openedKey) === "true";

      if (unlocked && alreadyOpened) {
        icon.style.display = "none";
      } else {
        icon.style.display = "";
        icon.textContent = unlocked ? "lock_open" : "lock";
      }
    }
  });
}

function showAllLessonsCompleteModal() {
  const modal = document.getElementById("allLessonsCompleteModal");
  if (modal) modal.classList.add("open");
}

function hideAllLessonsCompleteModal() {
  document.getElementById("allLessonsCompleteModal")?.classList.remove("open");
}

function closeAllLessonsCompleteModal(event) {
  if (event.target.id === "allLessonsCompleteModal") {
    hideAllLessonsCompleteModal();
  }
}
function updateLockedModalProgress() {
  const completedCount = REQUIRED_LESSONS.filter(
    lessonId => completedLessons[lessonId] === true
  ).length;

  const progressPercent = Math.round(
    (completedCount / REQUIRED_LESSONS.length) * 100
  );

  const progressAngle = progressPercent * 3.6;

  const lock = document.querySelector("#lockedFeatureModal .progress-lock");
  const text = document.getElementById("lessonUnlockProgressText");

  if (lock) {
    lock.style.setProperty("--lesson-progress-angle", `${progressAngle}deg`);
  }

  if (text) {
    text.textContent = `Progress ${progressPercent}%`;
  }
}

function vocabLessonsCompleted() {
  return VOCAB_UNLOCK_LESSONS.every(lessonId => completedLessons[lessonId] === true);

  unlockAchievement("allLessonsComplete");
}

function isFeatureUnlocked(feature) {
  if (practiceToolsUnlocked) return true;

  if (feature === "vocab") {
    return vocabLessonsCompleted();
  }

  return allRequiredLessonsCompleted();
}
function showVocabUnlockedModal() {

  unlockAchievement("vocabUnlocked");
  const modal = document.getElementById("vocabUnlockedModal");
  if (modal) modal.classList.add("open");
}

function hideVocabUnlockedModal() {
  document.getElementById("vocabUnlockedModal")?.classList.remove("open");
}

function closeVocabUnlockedModal(event) {
  if (event.target.id === "vocabUnlockedModal") {
    hideVocabUnlockedModal();
  }
}

let profileData = JSON.parse(localStorage.getItem("profileData")) || {
  firstName: "",
  lastName: "",
  color: "#d4a93a",
  xp: 0,
  isCreated: false,
  greekExperience: "new"
};

function showProfileMenu() {
  updateProfileUI();

  document.getElementById("profileModal")?.classList.add("open");

}

function hideProfileMenu() {
  document.getElementById("profileModal")?.classList.remove("open");
}

function closeProfileModal(event) {
  if (event.target.id === "profileModal") {
    hideProfileMenu();
  }
}

function saveProfileName() {
  const firstInput = document.getElementById("profileFirstNameInput");
  const lastInput = document.getElementById("profileLastNameInput");

  if (!firstInput || !lastInput) return;

  const firstName = firstInput.value.trim();
  const lastName = lastInput.value.trim();

  firstInput.classList.remove("input-error");
  lastInput.classList.remove("input-error");

  if (!firstName || !lastName) {
    if (!firstName) firstInput.classList.add("input-error");
    if (!lastName) lastInput.classList.add("input-error");

    showProfileValidationMessage("Please enter both your first and last name.");
    return;
  }

  profileData.firstName = firstName;
  profileData.lastName = lastName;
  profileData.isCreated = true;

  if (profileData.greekExperience === "basic") {
    practiceToolsUnlocked = true;
    localStorage.setItem("practiceToolsUnlocked", "true");
    updatePracticeToolLocks();
  }

  unlockAchievement("profileCreated");
  saveProfileData();
  updateProfileUI();
updateProfileAttention();
maybeShowNotificationPromptAfterProfile();
  const message = document.getElementById("profileValidationMessage");
  if (message) message.remove();
}


function showProfileValidationMessage(message) {
  let messageBox = document.getElementById("profileValidationMessage");

  if (!messageBox) {
    messageBox = document.createElement("p");
    messageBox.id = "profileValidationMessage";
    messageBox.className = "profile-validation-message";

    const saveBtn = document.getElementById("saveProfileBtn");
    saveBtn.insertAdjacentElement("beforebegin", messageBox);
  }

  messageBox.textContent = message;
}

function setProfileColor(color) {
  const firstInput = document.getElementById("profileFirstNameInput");
  const lastInput = document.getElementById("profileLastNameInput");

  if (firstInput) {
    profileData.firstName = firstInput.value.trim();
  }

  if (lastInput) {
    profileData.lastName = lastInput.value.trim();
  }

  profileData.color = color;

  saveProfileData();
  updateProfileUI();
}
 
function openCustomProfileColor() {
  const picker = document.getElementById("customProfileColorInput");
  if (!picker) return;

  picker.value = profileData.color || "#4f8cff";
  picker.click();
}

function saveProfileData() {
  localStorage.setItem("profileData", JSON.stringify(profileData));
}

const PROFILE_RANKS = [
  { xp: 0, title: "Beginner", desc: "Starting your Koine Greek journey." },
  { xp: 250, title: "Letter Reader", desc: "Greek letters are becoming familiar." },
  { xp: 600, title: "Word Builder", desc: "Vocabulary recognition is taking shape." },
  { xp: 1000, title: "Phrase Reader", desc: "You are beginning to read connected Greek." },
  { xp: 1500, title: "Text Apprentice", desc: "You can follow basic Greek structure." },
  { xp: 2200, title: "Koine Reader", desc: "You are reading with growing confidence." },
  { xp: 3000, title: "NT Greek Reader", desc: "You are steadily working with New Testament Greek." },
  { xp: 4000, title: "Greek Interpreter", desc: "You are reading with structure, context, and care." }
];

function getProfileTitleFromXP(xp) {
  let currentRank = PROFILE_RANKS[0];

  PROFILE_RANKS.forEach(rank => {
    if (xp >= rank.xp) {
      currentRank = rank;
    }
  });

  return currentRank.title;
}

function getProfileTitle() {
  return getProfileTitleFromXP(profileData.xp || 0);
}

function getNextTitleXP(xp) {
  const nextRank = PROFILE_RANKS.find(rank => xp < rank.xp);
  return nextRank ? nextRank.xp : null;
}

function getPreviousTitleXP(xp) {
  let previousXP = 0;

  PROFILE_RANKS.forEach(rank => {
    if (xp >= rank.xp) {
      previousXP = rank.xp;
    }
  });

  return previousXP;
}

function getProfileTitle() {
  return getProfileTitleFromXP(profileData.xp || 0);
}

function updateProfileUI() {
  const fullName =
    `${profileData.firstName || ""} ${profileData.lastName || ""}`.trim();

  const displayName = fullName || "Create Profile";

  document.getElementById("profileDisplayName").textContent = displayName;

  document.getElementById("profileTitle").textContent =
    profileData.isCreated ? getProfileTitle() : "Set up your Greek profile";

  const xpText = document.getElementById("profileXPText");
  if (xpText) {
    xpText.textContent = `${profileData.xp} XP`;
  }

  const firstInput = document.getElementById("profileFirstNameInput");
  const lastInput = document.getElementById("profileLastNameInput");

const newGreekBtn = document.getElementById("newGreekBtn");
const basicGreekBtn = document.getElementById("basicGreekBtn");

if (newGreekBtn && basicGreekBtn) {
  newGreekBtn.classList.toggle("selected", profileData.greekExperience !== "basic");
  basicGreekBtn.classList.toggle("selected", profileData.greekExperience === "basic");
}


  if (firstInput) firstInput.value = profileData.firstName || "";
  if (lastInput) lastInput.value = profileData.lastName || "";

  document.documentElement.style.setProperty(
    "--profile-color",
    profileData.color
  );

  const fill = document.getElementById("xpFill");

  if (fill) {
    const fill = document.getElementById("xpFill");

if (fill) {
  const currentXP = profileData.xp || 0;
  const previousLevelXP = getPreviousTitleXP(currentXP);
  const nextLevelXP = getNextTitleXP(currentXP);

  if (nextLevelXP === null) {
    fill.style.width = "100%";
  } else {
    const levelRange = nextLevelXP - previousLevelXP;
    const currentProgress = currentXP - previousLevelXP;
    const percent = Math.min((currentProgress / levelRange) * 100, 100);

    fill.style.width = `${percent}%`;
  }
}
  }

  const setupFields = document.getElementById("profileSetupFields");
  const saveBtn = document.getElementById("saveProfileBtn");

  if (setupFields) {
    setupFields.style.display = profileData.isCreated ? "none" : "block";
  }

  if (saveBtn) {
  saveBtn.style.display = profileData.isCreated ? "none" : "block";
}


const completedLessonCount = REQUIRED_LESSONS.filter(
  lessonId => completedLessons[lessonId] === true
).length;

const lessonsStat = document.getElementById("profileLessonsStat");
const vocabStat = document.getElementById("profileVocabStat");
const translationsStat = document.getElementById("profileTranslationsStat");
const testsStat = document.getElementById("profileTestsStat");
const knownWordsStat = document.getElementById("profileKnownWordsStat");
const timeStat = document.getElementById("profileTimeStat");

if (lessonsStat) lessonsStat.textContent = `${completedLessonCount} / ${REQUIRED_LESSONS.length}`;
if (vocabStat) vocabStat.textContent = getCompletedVocabChaptersCount();
if (translationsStat) translationsStat.textContent = getTranslationAttemptsCount();
if (testsStat) testsStat.textContent = getTestsCompletedCount();
if (knownWordsStat) knownWordsStat.textContent = knownWords.length;
if (timeStat) timeStat.textContent = formatStudyTime(totalStudySeconds);


const journeySection = document.getElementById("profileJourneySection");
const settingsBtn = document.getElementById("profileSettingsBtn");
const resetBtn = document.getElementById("profileResetBtn");

if (journeySection) {
  journeySection.style.display = profileData.isCreated ? "block" : "none";
}

if (settingsBtn) {
  settingsBtn.style.display = profileData.isCreated ? "block" : "none";
}

if (resetBtn) {
  resetBtn.style.display = profileData.isCreated ? "block" : "none";
}


updateProfileAttention();
updateNotificationButtonUI();
}

function resetAllAppData() {
  if (!confirm("Reset ALL app data? This cannot be undone.")) {
    return;
  }

  localStorage.clear();
  location.reload();
}
function openSettingsFromProfile() {
  hideProfileMenu();
  showSettings();
}

function updateProfileAttention() {
  const profileBtn = document.getElementById("profileButton");
  const profileNewsBadge = document.getElementById("profileNewsBadge");
  const profileFocusOverlay = document.getElementById("profileFocusOverlay");

  if (!profileBtn) return;

  const needsProfile = profileData?.isCreated !== true;
  const hasUnreadUpdate = localStorage.getItem("hasUnreadUpdate") === "true";

  profileBtn.classList.toggle("profile-attention", needsProfile);
  profileBtn.classList.toggle("profile-pulse", needsProfile);
  profileBtn.classList.toggle("has-news-update", hasUnreadUpdate);

  if (profileFocusOverlay) {
    profileFocusOverlay.classList.toggle("hidden", !needsProfile);
  }

  if (profileNewsBadge) {
    profileNewsBadge.classList.toggle("hidden", !hasUnreadUpdate);
  }
}

function getNextTitleXP(xp) {
  const levels = [250, 600, 1000, 1500, 2200, 3000, 4000];

  for (const level of levels) {
    if (xp < level) return level;
  }

  return null;
}

function getPreviousTitleXP(xp) {
  const levels = [0, 250, 600, 1000, 1500, 2200, 3000, 4000];

  let previous = 0;

  for (const level of levels) {
    if (xp >= level) previous = level;
  }

  return previous;
}

function addXP(amount, reason = "Progress made", showModal = true) {
  if (!profileData) return;

  const oldXP = profileData.xp || 0;
  const oldTitle = getProfileTitleFromXP(oldXP);

  profileData.xp = oldXP + amount;

  const newXP = profileData.xp;
  const newTitle = getProfileTitleFromXP(newXP);

  saveProfileData();
  updateProfileUI();

  if (showModal) {
    showXPModal({
      amount,
      reason,
      oldXP,
      newXP,
      oldTitle,
      newTitle
    });
  }
}

function showXPModal(data) {
  const modal = document.getElementById("xpModal");
  if (!modal) return;

  const reasonText = document.getElementById("xpReasonText");
  const earnedText = document.getElementById("xpEarnedText");
  const titleChange = document.getElementById("xpTitleChange");
  const fill = document.getElementById("xpModalFill");
  const progressText = document.getElementById("xpModalProgressText");

  if (reasonText) reasonText.textContent = data.reason;
  if (earnedText) earnedText.textContent = `+${data.amount} XP`;

  if (titleChange) {
    titleChange.textContent =
      data.oldTitle !== data.newTitle
        ? `${data.oldTitle} → ${data.newTitle}`
        : data.newTitle;
  }

  const previousLevelXP = getPreviousTitleXP(data.newXP);
  const nextLevelXP = getNextTitleXP(data.newXP);

  if (fill && progressText) {
    if (nextLevelXP === null) {
      fill.style.width = "100%";
      progressText.textContent = "Highest title reached!";
    } else {
      const levelRange = nextLevelXP - previousLevelXP;
      const currentProgress = data.newXP - previousLevelXP;
      const percent = Math.min((currentProgress / levelRange) * 100, 100);

      fill.style.width = "0%";

      setTimeout(() => {
        fill.style.width = `${percent}%`;
      }, 80);

      progressText.textContent =
        `${currentProgress} / ${levelRange} XP to next title`;
    }
  }

  modal.classList.add("open");

  const ring = document.querySelector(".xp-ring-progress");

if (ring) {
  ring.classList.remove("animate");
  ring.style.strokeDashoffset = "0";

  void ring.offsetWidth;

  ring.classList.add("animate");
}

  clearTimeout(xpToastTimeout);

  xpToastTimeout = setTimeout(() => {
    hideXPModal();
  }, 9000);
}

function hideXPModal() {
  clearTimeout(xpToastTimeout);

  const toast = document.getElementById("xpModal");
  const ring = document.querySelector(".xp-ring-progress");

  if (toast) {
    toast.classList.remove("open");
  }

  if (ring) {
    ring.classList.remove("animate");
    ring.style.strokeDashoffset = "0";

    void ring.offsetWidth;
  }
}

function closeXPModal(event) {
  if (event.target.id === "xpModal") {
    hideXPModal();
  }
}

function openProfileFromXPToast() {
  hideXPModal();
  showProfileMenu();
}

let appStartTime = Date.now();
let totalStudySeconds =
  Number(localStorage.getItem("totalStudySeconds")) || 0;

setInterval(() => {
  totalStudySeconds += 10;
  localStorage.setItem("totalStudySeconds", totalStudySeconds);
}, 10000);

function formatStudyTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  }

  return `${minutes}m`;
}

function getCompletedVocabChaptersCount() {
  return Object.keys(localStorage)
    .filter(key => key.startsWith("vocabChapterXP_"))
    .length;
}

function getTranslationAttemptsCount() {
  return Object.values(translationProgress || {}).reduce((total, item) => {
    return total + (item.attempts || 0);
  }, 0);
}

function getTestsCompletedCount() {
  const scores = JSON.parse(localStorage.getItem("testScores")) || [];
  return scores.length;
}

function previewProfileName() {
  const firstInput = document.getElementById("profileFirstNameInput");
  const lastInput = document.getElementById("profileLastNameInput");

  const firstName = firstInput?.value.trim() || "";
  const lastName = lastInput?.value.trim() || "";

  const fullName = `${firstName} ${lastName}`.trim();

  const displayName = document.getElementById("profileDisplayName");

  if (displayName) {
    displayName.textContent = fullName || "Create Profile";
  }
}

function selectGreekExperience(type) {
  profileData.greekExperience = type;

  document.getElementById("newGreekBtn")?.classList.toggle("selected", type === "new");
  document.getElementById("basicGreekBtn")?.classList.toggle("selected", type === "basic");
}

function showBasicsInfoModal() {
  document.getElementById("basicsInfoModal")?.classList.add("open");
}

function hideBasicsInfoModal() {
  document.getElementById("basicsInfoModal")?.classList.remove("open");
}

function closeBasicsInfoModal(event) {
  if (event.target.id === "basicsInfoModal") {
    hideBasicsInfoModal();
  }
}

let achievements =
  JSON.parse(localStorage.getItem("achievements")) || [];

const ACHIEVEMENT_DATA = {
  profileCreated: {
    icon: "👤",
    title: "Profile Created",
    desc: "Started your Greek learning journey."
  },

  firstLesson: {
    icon: "📘",
    title: "First Lesson Complete",
    desc: "Completed your first Greek lesson."
  },

  vocabUnlocked: {
    icon: "📚",
    title: "Vocab Unlocked",
    desc: "Completed the first three lessons."
  },

  allLessonsComplete: {
    icon: "🏛️",
    title: "Training Complete",
    desc: "Completed all beginner Greek lessons."
  },

  firstPerfectTest: {
    icon: "🎯",
    title: "Perfect Test",
    desc: "Got every word right on a test."
  },

  firstVocabChapter: {
    icon: "📝",
    title: "First Vocab Chapter",
    desc: "Finished your first full vocab chapter."
  },

  firstFiveTranslations: {
    icon: "🔤",
    title: "Translation Starter",
    desc: "Completed 5 translation practices."
  }
};
function unlockAchievement(id) {
  if (achievements.includes(id)) return;

  achievements.push(id);
  localStorage.setItem("achievements", JSON.stringify(achievements));
}

function showAchievementsModal() {
  renderAchievements();
  document.getElementById("achievementsModal")?.classList.add("open");
}

function hideAchievementsModal() {
  document.getElementById("achievementsModal")?.classList.remove("open");
}

function closeAchievementsModal(event) {
  if (event.target.id === "achievementsModal") {
    hideAchievementsModal();
  }
}

function renderAchievements() {
  const list = document.getElementById("achievementsList");
  if (!list) return;

  if (achievements.length === 0) {
    list.innerHTML = `<div class="achievement-icon">
  <span class="material-symbols-outlined achievement-symbol">
    ${item.icon}
  </span>
</div>`;
    return;
  }

  list.innerHTML = "";

  achievements.forEach(id => {
    const item = ACHIEVEMENT_DATA[id];
    if (!item) return;

    const div = document.createElement("div");
    div.className = "achievement-item";
    div.innerHTML = `
      <div class="achievement-icon">${item.icon}</div>
      <div>
        <strong>${item.title}</strong>
        <small>${item.desc}</small>
      </div>
    `;
    list.appendChild(div);
  });
}

function getDisplayChapterNumber(mounceChapter) {
  const chapterMap = {
    4: 1,
    6: 2,
    7: 3,
    8: 4,
    9: 5,
    10: 6,
    11: 7,
    12: 8,
    13: 9,
    14: 10,
    15: 11,
    16: 12,
    17: 13,
    18: 14,
    19: 15,
    20: 16,
    21: 17,
    22: 18,
    23: 19,
    24: 20,
    25: 21,
    26: 22,
    27: 23,
    28: 24,
    29: 25,
    30: 26,
    31: 27,
    32: 28,
    33: 29,
    34: 30,
    35: 31
  };

  return chapterMap[mounceChapter] || mounceChapter;
}

function openCustomProfileColor() {
  document.getElementById("customProfileColorInput")?.click();
}

function showRanksModal() {
  renderRanksList();
  document.getElementById("ranksModal")?.classList.add("open");
}

function hideRanksModal() {
  document.getElementById("ranksModal")?.classList.remove("open");
}

function closeRanksModal(event) {
  if (event.target.id === "ranksModal") {
    hideRanksModal();
  }
}

function renderRanksList() {
  const list = document.getElementById("ranksList");
  if (!list) return;

  const currentXP = profileData.xp || 0;

  list.innerHTML = "";

  PROFILE_RANKS.forEach(rank => {
    const unlocked = currentXP >= rank.xp;

    const div = document.createElement("div");
    div.className = `rank-item ${unlocked ? "unlocked" : "locked"}`;

    div.innerHTML = `
      <div class="rank-medal">
        <span class="material-symbols-outlined">
          ${unlocked ? "military_tech" : "lock"}
        </span>
      </div>

      <div>
        <strong>${rank.title}</strong>
        <small>${rank.xp} XP • ${rank.desc}</small>
      </div>
    `;

    list.appendChild(div);
  });
}

function backToProfileFromProgress() {
  showScreen("homeScreen");
  showProfileMenu();
}

/* =========================
   PWA INSTALL + UPDATE LOGIC
========================= */
/* 
Instructions
Every time you update the app

Change these two places:

In app.js
const APP_VERSION = "1.0.1";

Update notes:

const UPDATE_NOTES = [
  "Added new lesson content.",
  "Improved profile design.",
  "Fixed progress screen behavior."
];
In service-worker.js
const CACHE_NAME = "basic-greek-trainer-v1.0.1";

That forces the app to refresh its cached files.
*/
const APP_VERSION = "1.1.3";

const UPDATE_NOTES = [
 "added iphone push notifications",
"added study reminder onboarding",
"added notification settings controls",
"fixed notification save state",
"improved app startup speed",
"fixed theme loading flash",
"improved modal scrolling visuals",
"removed bouncing scroll indicator",
"improved theme loading behavior",
"fixed caching stability issues",
"updated pronunciation explanations",
"lesson polish and UI cleanup",
"bug fixes"

];

let deferredInstallPrompt = null;

function isRunningAsInstalledApp() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true
  );
}

function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./service-worker.js").catch((error) => {
      console.warn("Service worker registration failed:", error);
    });
  }
}

function isMobileDevice() {
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

function shouldShowInstallModal() {
  const dismissed = localStorage.getItem("installPromptDismissed") === "true";

  return (
    isMobileDevice() &&
    !isRunningAsInstalledApp() &&
    !dismissed
  );
}

function closeInstallAppModal(event) {
  // Do nothing.
  // This prevents the modal from closing when someone accidentally taps outside it.
}

function showInstallAppModal() {
  const modal = document.getElementById("installAppModal");
  if (!modal) return;

  backToInstallChoices();
  modal.classList.add("open");
}

function hideInstallAppModal() {
  const modal = document.getElementById("installAppModal");
  if (!modal) return;

  modal.classList.remove("open");
}


function showInstallSteps(device) {
  const choiceView = document.getElementById("installChoiceView");
  const iphoneSteps = document.getElementById("iphoneInstallSteps");
  const androidSteps = document.getElementById("androidInstallSteps");

  if (!choiceView || !iphoneSteps || !androidSteps) return;

  choiceView.classList.add("hidden");
  iphoneSteps.classList.add("hidden");
  androidSteps.classList.add("hidden");

  if (device === "iphone") {
    iphoneSteps.classList.remove("hidden");
  }

  if (device === "android") {
    androidSteps.classList.remove("hidden");

    const installBtn = document.getElementById("androidInstallBtn");
    if (installBtn && deferredInstallPrompt) {
      installBtn.classList.remove("hidden");
    }
  }
}

function backToInstallChoices() {
  const choiceView = document.getElementById("installChoiceView");
  const iphoneSteps = document.getElementById("iphoneInstallSteps");
  const androidSteps = document.getElementById("androidInstallSteps");
  const installBtn = document.getElementById("androidInstallBtn");

  if (choiceView) choiceView.classList.remove("hidden");
  if (iphoneSteps) iphoneSteps.classList.add("hidden");
  if (androidSteps) androidSteps.classList.add("hidden");
  if (installBtn) installBtn.classList.add("hidden");
}

function dismissInstallModalForever() {
  localStorage.setItem("installPromptDismissed", "true");
  hideInstallAppModal();
}

window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  deferredInstallPrompt = event;
});

async function triggerAndroidInstall() {
  if (!deferredInstallPrompt) return;

  deferredInstallPrompt.prompt();
  await deferredInstallPrompt.userChoice;

  deferredInstallPrompt = null;
  dismissInstallModalForever();
}

function checkForAppUpdateModal() {
  const lastSeenVersion = localStorage.getItem("lastSeenAppVersion");

  if (lastSeenVersion !== APP_VERSION) {
    localStorage.setItem("hasUnreadUpdate", "true");
  }

  updateProfileAttention();
}

function hideUpdateModal() {
  const modal = document.getElementById("updateModal");
  if (!modal) return;

  modal.classList.remove("open");
  updateProfileAttention();
}

function closeUpdateModal(event) {
  if (event.target.id === "updateModal") {
    hideUpdateModal();
  }
}

document.addEventListener("DOMContentLoaded", () => {
  registerServiceWorker();
syncOneSignalPushState();
  setTimeout(() => {
    if (shouldShowInstallModal()) {
      showInstallAppModal();
    }
  }, 700);

  setTimeout(() => {
    checkForAppUpdateModal();
  }, 1000);

  const tryAppBtn = document.getElementById("tryAppVersionBtn");

  if (tryAppBtn) {
    const shouldShow =
      isMobileDevice() &&
      !isRunningAsInstalledApp();

    tryAppBtn.classList.toggle("hidden", !shouldShow);
  }
});


document.addEventListener("DOMContentLoaded", () => {
  updateLessonCompletionUI();

  REQUIRED_LESSONS.forEach(lessonId => {
    updateCompleteLessonButton(lessonId);
  });

  updatePracticeToolLocks();
});


function closeSettingsMenu() {
  showScreen("homeScreen");
  showProfileMenu();
}
function openNewsFromProfile() {
  const modal = document.getElementById("updateModal");
  const title = document.getElementById("updateModalTitle");
  const notes = document.getElementById("updateModalNotes");

  if (!modal || !title || !notes) return;

  title.textContent = `What’s New in Version ${APP_VERSION}`;

  notes.innerHTML = `
    <ul class="update-notes-list">
      ${UPDATE_NOTES.map((note) => `<li>${note}</li>`).join("")}
    </ul>
  `;

  localStorage.setItem("lastSeenAppVersion", APP_VERSION);
  localStorage.setItem("hasUnreadUpdate", "false");

  updateProfileAttention();

  modal.classList.add("open");
}


 const BIBLE_GREEK_FACTS = [
   "Matthew begins the New Testament with a genealogy connecting Jesus to Abraham and David.",
  "Mark is the shortest Gospel and frequently uses words like immediately to keep the narrative moving quickly.",
  "Luke and Acts were written by the same author and form one continuous historical account.",
  "John begins his Gospel before creation itself: In the beginning was the Word.",
  "Each Gospel ends with the resurrection of Jesus Christ.",
  "Only Matthew mentions the wise men visiting Jesus.",
  "Only Luke records the parable of the prodigal son.",
  "Only John records Jesus turning water into wine.",
  "Jesus asked over 300 questions throughout the Gospels.",
  "The shortest verse in many English Bibles is Jesus wept in John 11:35.",
  "Pilate asked Jesus, What is truth? in John 18.",
  "Jesus wrote directly on the ground only one recorded time in Scripture.",
  "The Sermon on the Mount spans Matthew chapters 5 through 7.",
  "The Beatitudes begin with the word blessed repeated multiple times.",
  "Jesus often taught using ordinary objects like seeds, lamps, bread, fish, coins, and vineyards.",
  "Many parables begin with phrases like The kingdom of heaven is like...",
  "Jesus calmed a storm simply by speaking.",
  "Jesus fed thousands with a few loaves and fish more than once.",
  "Peter walked on water briefly before beginning to sink.",
  "Jesus slept during a violent storm while experienced fishermen panicked.",
  "The disciples sometimes misunderstood Jesus even after witnessing miracles.",
  "Thomas is remembered for doubting, yet later directly called Jesus My Lord and my God.",
  "Judas Iscariot was one of the twelve disciples before betraying Jesus.",
  "The rooster crowing became a permanent reminder of Peter denying Jesus three times.",
  "The Gospels record women being the first witnesses of the resurrection.",
  "Jesus appeared to over 500 people after His resurrection according to 1 Corinthians 15.",
  "Acts begins where the Gospel accounts end: after the resurrection.",
  "Acts 1:8 gives the geographic movement of the whole book: Jerusalem, Judea, Samaria, and the ends of the earth.",
  "The Day of Pentecost in Acts 2 involved people hearing the message in their own languages.",
  "Paul was originally known as Saul.",
  "Paul’s conversion happened while traveling to Damascus.",
  "Paul wrote letters from prison that still strongly emphasize joy and hope.",
  "Philippians repeatedly mentions joy even though Paul was imprisoned.",
  "Romans is Paul’s longest letter in the New Testament.",
  "Philemon is Paul’s shortest surviving letter.",
  "1 Corinthians deals with real church problems like division, pride, lawsuits, and misuse of spiritual gifts.",
  "Galatians was written with such urgency that Paul said even an angel should not preach a different gospel.",
  "Ephesians describes believers as the body of Christ.",
  "Hebrews contains many comparisons showing Christ is better.",
  "James uses vivid imagery like a ship rudder, wildfire, mirror, and vapor.",
  "Revelation begins with letters addressed to seven real churches.",
  "The final chapter of the New Testament ends with Jesus saying, Surely I am coming quickly.",
  "The first words of Jesus recorded in Matthew are Follow Me.",
  "The final prayer of the Bible is Even so, come, Lord Jesus.",
  "Jesus quoted the Old Testament frequently during His ministry.",
  "During temptation in the wilderness, Jesus answered Satan with Scripture each time.",
  "The New Testament contains history, letters, prophecy, songs, prayers, sermons, and eyewitness testimony.",
  "Many New Testament letters were intended to be read aloud publicly.",
  "Paul sometimes used scribes to help write his letters.",
  "Several New Testament writers directly identified themselves by name in their openings.",
  "Luke specifically says he carefully investigated eyewitness accounts.",
  "John says he wrote his Gospel so people would believe Jesus is the Christ.",
  "The Gospel of John records seven major sign miracles before the resurrection.",
  "John also records several I AM statements from Jesus.",
  "The phrase fear not appears repeatedly when angels speak to people.",
  "Jesus often withdrew to pray before major moments.",
  "The Mount of Olives appears repeatedly during the final week before the crucifixion.",
  "Jesus was crucified between two criminals.",
  "One criminal mocked Jesus while the other defended Him.",
  "The temple veil tore from top to bottom after Jesus died.",
  "Roman soldiers cast lots for Jesus’ clothing.",
  "After the resurrection, some disciples initially failed to recognize Jesus.",
  "The road to Emmaus account shows Jesus explaining Scripture about Himself.",
  "Acts records multiple imprisonments, trials, shipwrecks, and rescue events.",
  "Paul survived a shipwreck and then a snake bite in Acts 28.",
  "The Bereans were praised for checking Scripture daily.",
  "The book of Acts ends with Paul preaching in Rome.",
  "Not every apostle wrote a New Testament book.",
  "The New Testament contains 27 books.",
  "Four different men wrote Gospel accounts about Jesus.",
  "Luke was not one of the twelve apostles.",
  "Mark closely associated with Peter according to early church history.",
  "The New Testament repeatedly uses eyewitness language like we saw and we heard.",
  "The word gospel literally means good news.",
  "Christ means Messiah or Anointed One.",
  "Jesus means The Lord saves.",
  "The name Emmanuel means God with us.",
  "The title Son of Man is one of Jesus’ favorite ways to refer to Himself.",
  "The title Lamb of God first appears in John chapter 1.",
  "John the Baptist said Jesus must increase, but I must decrease.",
  "Jesus called fishermen, tax collectors, and ordinary workers to follow Him.",
  "Matthew was a tax collector before becoming a disciple.",
  "Zacchaeus climbed a tree just to see Jesus.",
  "Nicodemus came to Jesus at night.",
  "Lazarus had already been dead four days before Jesus raised him.",
  "Jesus cursed a fig tree shortly before entering Jerusalem.",
  "Children were specifically welcomed by Jesus.",
  "Jesus washed the disciples’ feet during the final supper.",
  "The disciples argued about who was greatest even near the end of Jesus’ ministry.",
  "Peter cut off a servant’s ear during Jesus’ arrest.",
  "Jesus healed that servant’s ear immediately afterward.",
  "Pilate publicly washed his hands before the crowd.",
  "Barabbas was released instead of Jesus.",
  "The inscription above Jesus’ cross identified Him as King of the Jews.",
  "After the resurrection, Jesus cooked food for disciples by the sea.",
  "The final chapter of John ends mentioning there were many more things Jesus did that were not written down.",
  "Paul frequently used athletic imagery like running races and fighting battles.",
  "Paul compared the church to a human body with many members.",
  "James says the tongue can direct a life like a rudder directs a ship.",
  "Peter described Satan as a roaring lion seeking someone to devour.",
  "John frequently contrasts light and darkness.",
  "Revelation describes a future city with no need for the sun because God gives it light.",
  "The final word in many English New Testaments is Amen.",
  "Jesus is directly called both the Alpha and Omega in Revelation.",
  "The New Testament begins with a genealogy and ends with a promise of Jesus’ return.",
  "The very first public command of Jesus in Matthew is repent.",
  "The final command of Jesus in Matthew is to make disciples of all nations.",
  "Paul named many ordinary believers individually throughout his letters.",
  "The book of Acts contains multiple speeches and sermons preserved in detail.",
  "Jesus frequently used questions to teach people rather than only giving direct answers.",
  "Some people followed Jesus for miracles while others followed for truth.",
  "The Pharisees and Sadducees often disagreed with each other even while opposing Jesus.",
  "The resurrection is emphasized in every Gospel account.",
  "The empty tomb is one of the central turning points of the New Testament."
];


function isInstalledAppMode() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true
  );
}

function formatSessionLength(milliseconds) {
  const minutes = Math.max(1, Math.round(milliseconds / 60000));

  if (minutes < 60) {
    return `${minutes} minute${minutes === 1 ? "" : "s"}`;
  }

  const hours = Math.floor(minutes / 60);
  const leftoverMinutes = minutes % 60;

  if (leftoverMinutes === 0) {
    return `${hours} hour${hours === 1 ? "" : "s"}`;
  }

  return `${hours} hour${hours === 1 ? "" : "s"} and ${leftoverMinutes} minute${leftoverMinutes === 1 ? "" : "s"}`;
}

function maybeShowWelcomeBackModal() {
  const TEST_WELCOME_BACK = true; // change to true to test in browser

  const alreadyShownThisSession =
    sessionStorage.getItem("welcomeBackShown") === "true";

  const lastSessionLength = Number(localStorage.getItem("lastSessionLength") || 0);

  if (
    !profileData?.isCreated ||
    alreadyShownThisSession ||
    lastSessionLength <= 0 ||
    (!TEST_WELCOME_BACK && !isInstalledAppMode())
  ) {
    return;
  }

  const firstName = profileData.firstName || "friend";
  let randomFact =
  BIBLE_GREEK_FACTS[Math.floor(Math.random() * BIBLE_GREEK_FACTS.length)];

const lastFact = localStorage.getItem("lastWelcomeBackFact");

if (BIBLE_GREEK_FACTS.length > 1) {
  while (randomFact === lastFact) {
    randomFact =
      BIBLE_GREEK_FACTS[Math.floor(Math.random() * BIBLE_GREEK_FACTS.length)];
  }
}

localStorage.setItem("lastWelcomeBackFact", randomFact);

  document.getElementById("welcomeBackTitle").textContent =
    `Welcome back, ${firstName}!`;

  document.getElementById("welcomeBackSession").textContent =
    `Last time, you studied for about ${formatSessionLength(lastSessionLength)}.`;

  document.getElementById("welcomeBackFact").textContent = randomFact;

  document.getElementById("welcomeBackModal")?.classList.add("open");
  sessionStorage.setItem("welcomeBackShown", "true");
}

function hideWelcomeBackModal() {
  document.getElementById("welcomeBackModal")?.classList.remove("open");
}

window.addEventListener("load", () => {
  if (!sessionStorage.getItem("sessionStartedAt")) {
    sessionStorage.setItem("sessionStartedAt", Date.now().toString());
  }

  setTimeout(maybeShowWelcomeBackModal, 700);
});

window.addEventListener("pagehide", () => {
  if (!profileData?.isCreated) return;

  const startedAt = Number(sessionStorage.getItem("sessionStartedAt") || Date.now());
  const sessionLength = Date.now() - startedAt;

  localStorage.setItem("lastSessionLength", sessionLength.toString());
});

function openInstallModalFromProfile() {
  showInstallAppModal();
}

function showProfileFocus() {
  const overlay = document.getElementById("profileFocusOverlay");
  const profileBtn = document.getElementById("profileButton");

  overlay?.classList.remove("hidden");
  profileBtn?.classList.add("profile-pulse");
}

function hideProfileFocus() {
  const overlay = document.getElementById("profileFocusOverlay");
  const profileBtn = document.getElementById("profileButton");

  overlay?.classList.add("hidden");
  profileBtn?.classList.remove("profile-pulse");
}

function completeProfileFocusIfProfileMade() {
  if (profileData?.isCreated === true) {
    hideProfileFocus();
    localStorage.setItem("hasSeenProfileFocus", "true");
  }
}





function getPushStatus() {
  return localStorage.getItem("pushNotificationsEnabled") === "true";
}

function updateNotificationButtonUI() {
  const btn = document.getElementById("profileNotificationBtn");
  const text = document.getElementById("profileNotificationBtnText");
  const icon = btn?.querySelector(".material-symbols-outlined");

  if (!btn || !text) return;

  const enabled = getPushStatus();

  text.textContent = enabled ? "Disable Study Reminders" : "Enable Study Reminders";
  if (icon) icon.textContent = enabled ? "notifications_off" : "notifications";
  btn.classList.toggle("notifications-enabled", enabled);
}

function showNotificationPromptModal() {
  document.getElementById("notificationPromptModal")?.classList.add("open");
}

function hideNotificationPromptModal() {
  document.getElementById("notificationPromptModal")?.classList.remove("open");
}

function closeNotificationPromptModal(event) {
  if (event.target.id === "notificationPromptModal") {
    hideNotificationPromptModal();
  }
}

function dismissNotificationPrompt() {
  localStorage.setItem("notificationPromptDismissed", "true");
  hideNotificationPromptModal();
}

function maybeShowNotificationPromptAfterProfile() {
  const enabled = localStorage.getItem("pushNotificationsEnabled") === "true";
  const dismissed = localStorage.getItem("notificationPromptDismissed") === "true";

  if (!profileData?.isCreated) return;
  if (enabled || dismissed) return;
  if (!isInstalledAppMode()) return;

  setTimeout(() => {
    showNotificationPromptModal();
  }, 600);
}
function openNotificationSettings() {
  if (!isInstalledAppMode()) {
    alert("For notifications, open the installed app from your Home Screen first.");
    return;
  }

  const enabled = getPushStatus();

  if (enabled) {
    disablePushNotifications();
  } else {
    showNotificationPromptModal();
  }
}


async function disablePushNotifications() {
  if (!window.OneSignalDeferred) {
    alert("Notifications are still loading.");
    return;
  }

  const confirmed = confirm(
    "Disable Greek study reminders and notifications?"
  );

  if (!confirmed) return;

  window.OneSignalDeferred.push(async function (OneSignal) {
    try {
      await OneSignal.User.PushSubscription.optOut();

      localStorage.setItem("pushNotificationsEnabled", "false");

      updateNotificationButtonUI();

      alert("Study reminders disabled.");
    } catch (error) {
      console.error(error);
      alert("Could not disable notifications.");
    }
  });
}


async function enablePushNotifications() {
  if (!isInstalledAppMode()) {
    alert("For notifications, open the installed app from your Home Screen first.");
    return;
  }

  if (!window.OneSignalDeferred) {
    alert("Notifications are still loading. Try again in a moment.");
    return;
  }

  window.OneSignalDeferred.push(async function (OneSignal) {
    try {
      await OneSignal.Notifications.requestPermission();

      const permission = OneSignal.Notifications.permission;

      if (permission !== true) {
        localStorage.setItem("pushNotificationsEnabled", "false");
        updateNotificationButtonUI();
        alert("Notifications were not enabled.");
        return;
      }

      await OneSignal.User.PushSubscription.optIn();

      const optedIn = OneSignal.User.PushSubscription.optedIn === true;

      if (optedIn) {
        localStorage.setItem("pushNotificationsEnabled", "true");
        localStorage.removeItem("notificationPromptDismissed");
        hideNotificationPromptModal();
        updateNotificationButtonUI();
        alert("Notifications enabled!");
      } else {
        localStorage.setItem("pushNotificationsEnabled", "false");
        updateNotificationButtonUI();
        alert("Permission granted, but OneSignal subscription did not complete. Try again.");
      }
    } catch (error) {
      console.error("Notification permission error:", error);
      alert("Notifications could not be enabled on this device.");
    }
  });
}

function syncOneSignalPushState() {
  if (!window.OneSignalDeferred) return;

  window.OneSignalDeferred.push(function (OneSignal) {
    try {
      const permission = OneSignal.Notifications.permission === true;
      const optedIn = OneSignal.User.PushSubscription.optedIn === true;

      const enabled = permission && optedIn;

      localStorage.setItem("pushNotificationsEnabled", enabled ? "true" : "false");
      updateNotificationButtonUI();

      OneSignal.User.PushSubscription.addEventListener("change", function (event) {
        const nowEnabled =
          OneSignal.Notifications.permission === true &&
          event.current.optedIn === true;

        localStorage.setItem("pushNotificationsEnabled", nowEnabled ? "true" : "false");
        updateNotificationButtonUI();

        console.log("OneSignal subscription changed:", event.current);
      });
    } catch (error) {
      console.warn("Could not sync OneSignal push state:", error);
    }
  });
}



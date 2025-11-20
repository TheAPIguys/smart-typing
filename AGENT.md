# Logseq Smart-Type Plugin


**Predictive text and intelligent autocomplete for Logseq, powered by a local SQLite learning engine.**

**Logseq Smart-Type** is a productivity plugin designed to increase typing speed and reduce repetitive keystrokes. Inspired by the autocomplete features in VS Code and Microsoft Outlook, it offers context-aware word suggestions that learn from your usage patterns.
- ## ✨ Key Features
- **⚡ Instant Autocomplete:** As you type, a lightweight popup suggests possible word completions in real-time.
- **🧠 Smart Learning Engine:** Unlike static dictionaries, Smart-Type tracks which words you select. It uses a local **SQLite database** to maintain a frequency count (`regular_used`), ensuring your most-used words always appear at the top of the list.
- **⌨️ Keyboard-First Navigation:** Keep your hands on the keyboard.
	- **Type** to trigger suggestions.
	- **Up/Down Arrows** to navigate the list (VS Code style).
	- **Tab** to insert the selected word.
- **🔒 Local & Fast:** All data is stored locally in a highly optimized SQLite database. No API calls, no internet required, and zero latency.
  
  ---
# Logseq Smart-Type Plugin

Predictive text and intelligent autocomplete for Logseq, powered by a local SQLite learning engine.

Logseq Smart-Type is a productivity plugin designed to increase typing speed and reduce repetitive keystrokes. Inspired by the autocomplete features in VS Code and Microsoft Outlook, it offers context-aware word suggestions that learn from your usage patterns.

## ✨ Key Features

- ⚡ **Instant Autocomplete:** As you type, a lightweight popup suggests possible word completions in real-time.
- 🧠 **Deep Learning Engine:** Unlike simple frequency lists, Smart-Type uses a sophisticated ranking algorithm:
  - **Context Awareness:** Predicts the next word based on the previous word (e.g., typing "Artificial" suggests "Intelligence").
  - **Recency Bias:** Prioritizes words you have used in the last 7 days, adapting to your current projects.
  - **Typo Tolerance:** Smart fallback logic catches mistakes (e.g., `rewolve` → `resolve`).
- ⌨️ **Keyboard-First Navigation:** Keep your hands on the keyboard.
  - Type to trigger suggestions.
  - Up/Down Arrows to navigate the list (VS Code style).
  - Tab to insert the selected word.
- 🔍 **Graph Scanning:** Indexes your existing Logseq pages to learn your personal jargon, project names, and proper nouns.
- 🔒 **Local & Fast:** All data is stored locally in a highly optimized SQLite database (~446k English words). No API calls, no internet required, and zero latency.

## 🚀 How It Works

### 1. The Trigger

The plugin listens to input events in the main Logseq editor. When a user types a character sequence (e.g., `re`), the plugin triggers a Tiered Search Strategy.

### 2. The Ranking Logic (Tier 1: Context & Recency)

The plugin first attempts an exact match query that combines Bigram probability (what usually follows the previous word) and Recency (what you used recently).

-- Simplified logic for Tier 1 Search

```sql
SELECT word, 
       (regular_used + (CASE WHEN last_used > NOW - 7 DAYS THEN 50 ELSE 0 END)) as score
FROM dictionary
WHERE word LIKE 'input%'
UNION
SELECT next_word, (frequency * 10) as score
FROM bigrams
WHERE prev_word = 'previous_word'
ORDER BY score DESC
LIMIT 5;
```

### 3. The Fallback Logic (Tier 2: Typos)

If Tier 1 returns no results, the plugin triggers a "fuzzy search" to catch typos (e.g., `rewolve`). It uses a permissive matching strategy to find words that are distinctively similar to your input.

### 4. The Learning Loop

Every time you press Tab to accept a suggestion, the plugin updates the database to reinforce that choice:

-- 1. Update Word Stats

```sql
UPDATE dictionary 
SET regular_used = regular_used + 1, last_used_timestamp = NOW()
WHERE word = 'selected_word';
```

-- 2. Learn Context (Bigram)

```sql
INSERT INTO bigrams (prev_word, next_word) 
VALUES ('previous_word', 'selected_word')
ON CONFLICT DO UPDATE SET frequency = frequency + 1;
```

## 🎮 Usage Guide

- **Start Typing:** Begin typing in any block (e.g., type `bec`).
- **See Suggestions:** A floating box appears near your cursor.
- **Navigate:**
  - The first option is auto-highlighted.
  - Press `Arrow Down` to select `becoming`.
- **Complete:** Press `Tab`. The text `bec` is instantly replaced with `becoming`.

## 🛠 Technical Architecture

- **Frontend:** TypeScript & Logseq Plugin API (DOM manipulation for the overlay).
- **Backend/Storage:** SQLite (via `sql.js` / WASM) for high-performance reads/writes.
- **Database:** Pre-loaded with English-Words (~446k entries) and extended via user graph scanning.
- **Performance:** Uses specific indexing on `word`, `regular_used`, and `bigrams` to ensure queries run in milliseconds.

Learn More: For details on Logseq plugin development, see _An Intro to Making Logseq Plugins_.

## 📦 Installation

*(Note: Instructions for when the plugin is released)*

1. Open Logseq.
2. Go to **Settings > Plugins > Marketplace**.
3. Search for **Smart-Type**.
4. Click **Install**.

## 🗺 Roadmap

- [x] Initial Release: Basic dictionary import + SQLite integration.
- [x] Graph Scanning: Feature to scan the user's existing Logseq graph to pre-populate the dictionary.
- [x] Context Awareness: Suggest words based on the previous word (Bigram probability).
- [ ] Snippet Expansion: Use the engine to expand shortcuts (e.g., typing `@@date` inserts today's date).
- [ ] Subject Dictionaries: Toggleable packs for Medical, Legal, or Coding vocabulary.

## 📄 License

MIT License
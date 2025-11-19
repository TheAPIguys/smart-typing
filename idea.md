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
- ## 🚀 How It Works
- ### 1. The Trigger
  
  The plugin listens to input events in the main Logseq editor. When a user types a character sequence (e.g., `th`), the plugin queries the internal database.
- ### 2. The Ranking Logic (SQLite)
  
  The core of the plugin is a SQLite query that prioritizes words you actually use. The database schema tracks a `regular_used` integer for every word.
  
  <!----><!----><!----><!----><!----><!---->
  
  SQL
  
  <!----><!---->
  
  <!---->
  
  <!---->
  
  ```
  -- Pseudo-query logic used by the plugin
  SELECT word 
  FROM dictionary 
  WHERE word LIKE 'user_input%' 
  ORDER BY regular_used DESC, word ASC 
  LIMIT 5;
  ```
  
  <!---->
  
  <!----><!----><!----><!----><!----><!----><!----><!----><!----><!----><!----><!----><!----><!----><!----><!----><!----><!----><!----><!----><!----><!----><!----><!----><!----><!----><!----><!----><!----><!----><!----><!----><!----><!----><!----><!----><!----><!----><!----><!----><!----><!----><!----><!----><!----><!----><!---->
- ### 3. The Learning Loop
  
  Every time you press **Tab** to accept a suggestion, the plugin updates the database to reinforce that choice:
  
  <!----><!----><!----><!----><!----><!---->
  
  SQL
  
  <!----><!---->
  
  <!---->
  
  <!---->
  
  ```
  UPDATE dictionary 
  SET regular_used = regular_used + 1 
  WHERE word = 'selected_word';
  ```
  
  <!---->
  
  <!----><!----><!----><!----><!----><!----><!----><!----><!----><!----><!----><!----><!----><!----><!----><!----><!----><!----><!----><!----><!----><!----><!----><!----><!----><!----><!----><!----><!----><!----><!----><!----><!----><!----><!----><!----><!----><!----><!----><!----><!----><!----><!----><!----><!----><!----><!---->
  
  ---
- ## 🎮 Usage Guide
- **Start Typing:** Begin typing in any block (e.g., type `bec`).
- **See Suggestions:** A floating box appears near your cursor with suggestions:
	- `because`
	- `becoming`
	- `became`
- **Navigate:**
	- The first option is auto-highlighted.
	- Press `Arrow Down` to select `becoming`.
- **Complete:** Press `Tab`. The text `bec` is instantly replaced with `becoming`.
  
  ---
- ## 🛠 Technical Architecture
- **Frontend:** TypeScript & Logseq Plugin API (DOM manipulation for the overlay).
- **Backend/Storage:** SQLite (via `sql.js` or similar WASM wrapper) for high-performance reads/writes.
- **Performance:** Uses specific indexing on the `word` and `regular_used` columns to ensure queries run in milliseconds, even with a database of 100,000+ words.
- Info about plugin building in Logseq find: {{video }}](https://www.youtube.com/watch?v=57h7te3NvJg)
-
- ---
- ## 📦 Installation
  
  *(Note: Instructions for when the plugin is released)*
- Open Logseq.
- Go to **Settings > Plugins > Marketplace**.
- Search for **Smart-Type**.
- Click **Install**.
  
  ---
- ## 🗺 Roadmap
- [ ] **Initial Release:** Basic dictionary import + SQLite integration.
- [] **Words English** link [english-Words](https://github.com/dwyl/english-words)
- [ ] **Graph Scanning:** Feature to scan the user's existing Logseq graph to pre-populate the dictionary with custom jargon and proper nouns.
- [ ] **Context Awareness:** Suggest words based on the *previous* word (Bigram probability).
  
  ---
- ## 📄 License
  
  MIT License
-
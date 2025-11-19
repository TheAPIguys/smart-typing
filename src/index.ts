import "@logseq/libs";
import { initDatabase, getSuggestions, learnWord } from "./database";

const main = async () => {
  console.log("Smart-Type plugin loaded");

  await initDatabase();

  // UI for the popup (simplified)
  logseq.provideStyle(`
    .smart-type-popup {
      position: absolute;
      background: var(--ls-primary-background-color);
      border: 1px solid var(--ls-border-color);
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      z-index: 9999;
      padding: 4px;
      border-radius: 4px;
    }
    .smart-type-item {
      padding: 4px 8px;
      cursor: pointer;
    }
    .smart-type-item.active {
      background: var(--ls-selection-background-color);
      color: var(--ls-selection-text-color);
    }
  `);

  // This is where we would hook into the editor.
  // Since Logseq's API for real-time keystroke interception is limited in plugins,
  // we might need to use a specific trigger or experimental APIs.
  // For demonstration, we'll log when the plugin is ready.

  logseq.Editor.registerSlashCommand(
    "Smart Type: Learn Selection",
    async () => {
      const selected = await logseq.Editor.getSelectedBlocks();
      if (selected) {
        selected.forEach((block) => {
          const words = block.content.split(/\s+/);
          words.forEach((w) => learnWord(w));
        });
        logseq.UI.showMsg("Learned words from selection!");
      }
    }
  );

  // Example of how we might query suggestions (programmatically for now)
  // In a real implementation, you'd want to bind this to a keypress or input event
  // if the API allows, or use a specific shortcut to trigger "Complete".
  logseq.App.registerCommandPalette(
    {
      key: "smart-type-suggest",
      label: "Smart Type: Suggest",
      keybinding: {
        mode: "global",
        binding: "mod+space",
      },
    },
    async () => {
      // Get current block content and cursor position (if possible)
      const block = await logseq.Editor.getCurrentBlock();
      if (block) {
        // This is a simplification. We'd need the cursor position to know the current word.
        // Assuming the last word for demo:
        const words = block.content.split(/\s+/);
        const lastWord = words[words.length - 1];

        const suggestions = getSuggestions(lastWord);
        if (suggestions.length > 0) {
          logseq.UI.showMsg(`Suggestions: ${suggestions.join(", ")}`);
          // Here you would show the popup UI
        } else {
          logseq.UI.showMsg("No suggestions found.");
        }
      }
    }
  );
};

logseq.ready(main).catch(console.error);

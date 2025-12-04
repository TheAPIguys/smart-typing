import "@logseq/libs";
import { initDatabase, getSuggestions, learnWord } from "./database";

const main = async () => {
  console.log("Smart-Type plugin loaded");

  await initDatabase();

  // State for suggestions
  let currentSuggestions: string[] = [];
  let selectedIndex = 0;
  let currentWord = "";
  let isPopupVisible = false;
  let lastPopupLeft = 0;
  let lastPopupTop = 0;
  let isInserting = false; // Flag to pause polling during insertion

  // UI for the popup - inline styles work better with provideUI
  logseq.provideStyle(`
    .smart-type-popup {
      animation: smarttype-fadein 0.15s ease-out;
    }
    @keyframes smarttype-fadein {
      from {
        opacity: 0;
        transform: translateY(-4px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    .smart-type-item {
      padding: 6px 10px;
      cursor: pointer;
      color: var(--ls-primary-text-color);
      transition: background 0.1s ease;
    }
    .smart-type-item:hover,
    .smart-type-item.active {
      background: var(--ls-selection-background-color);
      color: var(--ls-selection-text-color);
    }
  `);

  // Helper for debouncing events (keeping for potential future use)
  // let debounceTimer: any;
  // const debounce = (func: Function, delay: number) => {
  //   return (...args: any[]) => {
  //     clearTimeout(debounceTimer);
  //     debounceTimer = setTimeout(() => func(...args), delay);
  //   };
  // };

  // Function to render the suggestion popup
  const showSuggestionPopup = (
    suggestions: string[],
    left: number,
    top: number,
    animate: boolean = true
  ) => {
    // Store position for navigation updates
    lastPopupLeft = left;
    lastPopupTop = top;

    // Build the suggestion items HTML with current selection
    const items = suggestions
      .map(
        (s, i) =>
          `<div class="smart-type-item ${
            i === selectedIndex ? "active" : ""
          }" data-suggestion="${s}">${s}</div>`
      )
      .join("");

    // Only add animation class on first show
    const animationStyle = animate
      ? "animation: smarttype-fadein 0.15s ease-out;"
      : "";

    // Use provideUI with explicit positioning
    logseq.provideUI({
      key: "smart-type-popup",
      template: `<div class="smart-type-popup" style="background: var(--ls-primary-background-color); border: 1px solid var(--ls-border-color); box-shadow: 0 4px 6px rgba(0,0,0,0.1); padding: 4px; border-radius: 4px; min-width: 150px; ${animationStyle}">${items}</div>`,
      style: {
        position: "fixed",
        left: `${left}px`,
        top: `${top}px`,
        zIndex: "999",
        width: "auto",
      },
      attrs: {
        title: "",
      },
    });
    isPopupVisible = true;
  };

  // Function to close the popup
  const closePopup = () => {
    logseq.provideUI({ key: "smart-type-popup", template: "" });
    isPopupVisible = false;
    currentSuggestions = [];
    selectedIndex = 0;
    currentWord = "";
  };

  // Function to insert the selected suggestion
  const insertSuggestion = async (suggestion: string) => {
    // Prevent multiple calls
    if (isInserting) {
      console.log("Already inserting, skipping");
      return;
    }

    console.log(
      "insertSuggestion called:",
      suggestion,
      "currentWord:",
      currentWord
    );

    if (!currentWord || !suggestion) {
      console.log("Aborting: no currentWord or suggestion");
      return;
    }

    // Set flag to prevent polling and duplicate calls
    isInserting = true;

    // Store the word length before we clear it
    const wordLen = currentWord.length;

    // Close popup to reset state
    closePopup();

    try {
      // Get the block and cursor position to calculate what to replace
      // We need to remove the typed characters and replace with full suggestion

      const cursor = await logseq.Editor.getEditingCursorPosition();
      const block = await logseq.Editor.getCurrentBlock();

      if (!cursor || !block) {
        console.log("Could not get cursor or block");
        isInserting = false;
        return;
      }

      const pos = cursor.pos;
      const content = block.content;

      // Replace the word: everything before the word + suggestion + everything after cursor
      const beforeWord = content.substring(0, pos - wordLen);
      const afterCursor = content.substring(pos);
      const newContent = beforeWord + suggestion + " " + afterCursor;

      console.log("Replacing content:", {
        pos,
        wordLen,
        beforeWord,
        afterCursor,
        newContent,
      });

      // Exit editing, update, then re-enter at new position
      await logseq.Editor.exitEditingMode(false);
      await logseq.Editor.updateBlock(block.uuid, newContent);

      // Re-enter editing mode at position after the inserted word
      const newCursorPos = beforeWord.length + suggestion.length + 1; // +1 for space
      await logseq.Editor.editBlock(block.uuid, { pos: newCursorPos });

      // Update tracking to prevent polling issues
      lastContent = newContent;
      lastBlockUuid = block.uuid;

      console.log("Insertion complete - replaced with:", suggestion);
    } catch (err) {
      console.error("Insert failed:", err);
    } finally {
      // Re-enable polling after a delay
      setTimeout(() => {
        isInserting = false;
      }, 300);
    }
  };

  // Register keyboard shortcuts for navigation (using mod+ to avoid conflicts)
  // mod+j = move down, mod+k = move up, mod+l = select (vim-like)
  logseq.App.registerCommandShortcut(
    { binding: "mod+j" },
    async () => {
      if (!isPopupVisible || currentSuggestions.length === 0) return;

      selectedIndex = (selectedIndex + 1) % currentSuggestions.length;

      // Re-render popup with new selection (no animation)
      showSuggestionPopup(
        currentSuggestions,
        lastPopupLeft,
        lastPopupTop,
        false
      );
    },
    { key: "smart-type-down", label: "Smart Type: Next suggestion" }
  );

  logseq.App.registerCommandShortcut(
    { binding: "mod+k" },
    async () => {
      if (!isPopupVisible || currentSuggestions.length === 0) return;

      selectedIndex =
        selectedIndex === 0 ? currentSuggestions.length - 1 : selectedIndex - 1;

      // Re-render popup with new selection (no animation)
      showSuggestionPopup(
        currentSuggestions,
        lastPopupLeft,
        lastPopupTop,
        false
      );
    },
    { key: "smart-type-up", label: "Smart Type: Previous suggestion" }
  );

  logseq.App.registerCommandShortcut(
    { binding: "mod+'" },
    async () => {
      if (!isPopupVisible || currentSuggestions.length === 0) return;

      await insertSuggestion(currentSuggestions[selectedIndex]);
    },
    { key: "smart-type-select", label: "Smart Type: Accept suggestion" }
  );

  // Main logic to check for suggestions
  const checkSuggestions = async () => {
    const block = await logseq.Editor.getCurrentBlock();
    if (!block) {
      return;
    }

    const cursor = await logseq.Editor.getEditingCursorPosition();
    if (!cursor) {
      return;
    }

    const pos = cursor.pos;
    const rect = cursor.rect;
    const left = rect ? rect.left : cursor.left;
    const top = rect ? rect.bottom + 5 : cursor.top + 20;

    // Get the word being typed
    const textBeforeCursor = block.content.substring(0, pos);
    const match = textBeforeCursor.match(/(\w+)$/);
    const word = match ? match[0] : "";

    if (word.length < 2) {
      closePopup();
      return;
    }

    // Only reset selection if the word changed
    if (word !== currentWord) {
      currentWord = word;
      selectedIndex = 0;
    }

    const suggestions = getSuggestions(word);
    if (suggestions.length > 0) {
      currentSuggestions = suggestions;
      showSuggestionPopup(suggestions, left, top);
    } else {
      closePopup();
    }
  };

  // Track the last known content to detect changes
  let lastContent = "";
  let lastBlockUuid = "";

  // Use polling as the primary mechanism since onInputSelectionEnd doesn't fire reliably
  setInterval(async () => {
    // Skip polling if we're in the middle of inserting
    if (isInserting) return;

    try {
      const isEditing = await logseq.Editor.checkEditing();
      if (!isEditing) {
        // Not editing, close popup if open
        if (lastContent !== "") {
          closePopup();
          lastContent = "";
          lastBlockUuid = "";
        }
        return;
      }

      const block = await logseq.Editor.getCurrentBlock();
      if (!block) return;

      // Only trigger if content has changed
      if (block.uuid !== lastBlockUuid || block.content !== lastContent) {
        lastBlockUuid = block.uuid;
        lastContent = block.content;
        await checkSuggestions();
      }
    } catch (e) {
      // Silently ignore polling errors
    }
  }, 150); // Poll every 150ms for responsiveness

  // Also try the event listener as a backup (in case it works in some Logseq versions)
  try {
    logseq.Editor.onInputSelectionEnd(() => {
      checkSuggestions();
    });
  } catch (err) {
    console.error("Failed to register onInputSelectionEnd", err);
  }

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

/**
 * AUDIENCE TOGGLE
 * ---------------
 * Homepage "Why it matters for" cards (Educators / Educator-Authors /
 * Authors) each have a `.audience-toggle` button. Clicking one reveals its
 * four-feature breakdown in the single shared `#audience-panel` below the
 * card row — clicking the open button again, or a different one, closes or
 * swaps the content. Only one `[data-audience-content]` block is unhidden at
 * a time; `aria-expanded` on the buttons keeps state in sync for
 * screen readers.
 */
function init(): void {
  const toggles = document.querySelectorAll<HTMLButtonElement>('.audience-toggle');
  const panel = document.getElementById('audience-panel');
  if (!panel || toggles.length === 0) return;

  const contents = panel.querySelectorAll<HTMLElement>('[data-audience-content]');

  toggles.forEach((toggle) => {
    toggle.addEventListener('click', () => {
      const audience = toggle.dataset.audience;
      const wasExpanded = toggle.getAttribute('aria-expanded') === 'true';

      toggles.forEach((t) => t.setAttribute('aria-expanded', 'false'));
      contents.forEach((content) => {
        content.hidden = true;
      });

      if (wasExpanded) {
        panel.hidden = true;
        return;
      }

      const content = panel.querySelector<HTMLElement>(
        `[data-audience-content="${audience}"]`,
      );
      if (!content) return;

      toggle.setAttribute('aria-expanded', 'true');
      content.hidden = false;
      panel.hidden = false;
    });
  });
}

init();

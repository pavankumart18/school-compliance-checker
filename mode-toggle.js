(function () {
  const STORAGE_KEY = 'complianceiqDemoMode';
  const PAGE_TARGETS = {
    'index.html': { named: 'index.html', school: 'index-anonymous.html' },
    'index-anonymous.html': { named: 'index.html', school: 'index-anonymous.html' },
    'story.html': { named: 'story.html', school: 'story-anonymous.html' },
    'story-anonymous.html': { named: 'story.html', school: 'story-anonymous.html' },
    'Compliance-story.html': { named: 'Compliance-story.html', school: 'Compliance-story-anonymous.html' },
    'Compliance-story-anonymous.html': { named: 'Compliance-story.html', school: 'Compliance-story-anonymous.html' }
  };

  function currentFileName() {
    const parts = window.location.pathname.replace(/\\/g, '/').split('/');
    return parts[parts.length - 1] || 'index.html';
  }

  function currentDemoMode(fileName) {
    return fileName.indexOf('-anonymous.html') !== -1 ? 'school' : 'named';
  }

  function targetFor(mode, fileName) {
    const targets = PAGE_TARGETS[fileName] || PAGE_TARGETS['index.html'];
    return targets[mode];
  }

  window.addEventListener('DOMContentLoaded', () => {
    const fileName = currentFileName();
    const mode = currentDemoMode(fileName);
    const toggles = Array.from(document.querySelectorAll('[data-demo-toggle]'));
    if (toggles.length === 0) return;

    toggles.forEach(toggle => {
      const input = toggle.querySelector('input[type="checkbox"]');
      if (!input) return;

      toggle.setAttribute('data-mode', mode);
      input.checked = mode === 'named';
      input.setAttribute('aria-checked', String(mode === 'named'));

      try {
        window.sessionStorage.setItem(STORAGE_KEY, mode);
      } catch (error) {
        // Ignore storage issues and keep the toggle functional.
      }

      input.addEventListener('change', () => {
        const nextMode = input.checked ? 'named' : 'school';
        toggle.setAttribute('data-mode', nextMode);
        input.setAttribute('aria-checked', String(nextMode === 'named'));

        try {
          window.sessionStorage.setItem(STORAGE_KEY, nextMode);
        } catch (error) {
          // Ignore storage issues and continue navigating.
        }

        const target = targetFor(nextMode, fileName);
        if (fileName === target) return;
        window.location.href = target;
      });
    });
  });
})();

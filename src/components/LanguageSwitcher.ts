/**
 * Language Switcher Web Component
 * Allows users to switch between available locales
 */
export class LanguageSwitcher extends HTMLElement {
  private currentLocale: string = 'en';
  private availableLocales = [
    { code: 'en', label: 'English' },
    { code: 'es', label: 'Español' },
    { code: 'fr', label: 'Français' },
  ];

  connectedCallback() {
    this.currentLocale = this.dataset.currentLocale || 'en';
    this.render();
    this.attachEventListeners();
  }

  render() {
    this.innerHTML = `
      <div class="language-switcher">
        <button class="language-button" aria-label="Switch language">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M7 2a1 1 0 011 1v1h3a1 1 0 110 2H9.578a18.87 18.87 0 01-1.724 4.78c.29.354.596.696.914 1.026a1 1 0 11-1.44 1.389c-.188-.196-.373-.396-.554-.6a19.098 19.098 0 01-3.107 3.567 1 1 0 01-1.334-1.49 17.087 17.087 0 003.13-3.733 18.992 18.992 0 01-1.487-2.494 1 1 0 111.79-.89c.234.47.489.928.764 1.372.417-.934.752-1.913.997-2.927H3a1 1 0 110-2h3V3a1 1 0 011-1zm6 6a1 1 0 01.894.553l2.991 5.982a.869.869 0 01.02.037l.99 1.98a1 1 0 11-1.79.895L15.383 16h-4.764l-.723 1.447a1 1 0 11-1.788-.894l.99-1.98.019-.038 2.99-5.982A1 1 0 0113 8zm-1.382 6h2.764L13 11.236 11.618 14z" clip-rule="evenodd" />
          </svg>
          <span class="current-language">${this.currentLocale.toUpperCase()}</span>
        </button>
        <ul class="language-menu" role="menu" hidden>
          ${this.availableLocales.map(locale => `
            <li role="none">
              <a
                role="menuitem"
                href="${this.getLocalizedPath(locale.code)}"
                data-locale="${locale.code}"
                ${locale.code === this.currentLocale ? 'aria-current="true"' : ''}
              >
                ${locale.label}
              </a>
            </li>
          `).join('')}
        </ul>
      </div>
    `;
  }

  attachEventListeners() {
    const button = this.querySelector('.language-button');
    const menu = this.querySelector('.language-menu');

    button?.addEventListener('click', () => {
      const isHidden = menu?.hasAttribute('hidden');
      if (isHidden) {
        menu?.removeAttribute('hidden');
      } else {
        menu?.setAttribute('hidden', '');
      }
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
      if (!this.contains(e.target as Node)) {
        menu?.setAttribute('hidden', '');
      }
    });
  }

  getLocalizedPath(locale: string): string {
    const currentPath = window.location.pathname;
    
    // Remove current locale prefix if any
    const pathWithoutLocale = currentPath.replace(/^\/(en|es|fr)(\/|$)/, '/');
    
    // Add new locale prefix (except for default 'en')
    if (locale === 'en') {
      return pathWithoutLocale || '/';
    }
    
    return `/${locale}${pathWithoutLocale}`;
  }
}

// Register the custom element
if (typeof customElements !== 'undefined') {
  customElements.define('language-switcher', LanguageSwitcher);
}

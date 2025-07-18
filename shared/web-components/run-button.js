/**
 * Run Button Web Component
 * Simple button that triggers code execution via parent utilities
 */

class RunButton extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.resource = null;
  }

  connectedCallback() {
    this.render();
    this.setupEventListeners();
  }

  /**
   * Set the resource this button should operate on
   * @param {Object} resource - File resource object
   */
  setResource(resource) {
    this.resource = resource;
    this.updateButtonText();
  }

  render() {
    const style = `
      <style>
        .run-btn {
          background: #16a34a;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          font-family: inherit;
          font-size: 12px;
          cursor: pointer;
          transition: background-color 0.2s;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .run-btn:hover {
          background: #15803d;
        }

        .run-btn:active {
          background: #166534;
        }

        .run-btn:disabled {
          background: #6b7280;
          cursor: not-allowed;
        }

        .run-icon {
          font-size: 14px;
        }
      </style>
    `;

    const html = `
      ${style}
      <button class="run-btn" id="runBtn">
        <span class="run-icon">▶️</span>
        <span class="btn-text">Run Code</span>
      </button>
    `;

    this.shadowRoot.innerHTML = html;
  }

  setupEventListeners() {
    const button = this.shadowRoot.getElementById('runBtn');
    
    button.addEventListener('click', () => {
      this.runCode();
    });
  }

  runCode() {
    if (!this.resource) {
      console.warn('⚠️ No resource set for run button');
      return;
    }

    // Access parent window utilities
    if (window.parent && window.parent.spiralLens) {
      window.parent.spiralLens.runCode(this.resource);
    } else {
      console.error('❌ Spiral Lens utilities not available');
      alert('Code execution utilities not available');
    }
  }

  updateButtonText() {
    const btnText = this.shadowRoot.querySelector('.btn-text');
    if (btnText && this.resource) {
      const langName = this.getLangName(this.resource.lang);
      btnText.textContent = `Run ${langName}`;
    }
  }

  getLangName(lang) {
    const langMap = {
      '.js': 'JS',
      '.jsx': 'JSX', 
      '.ts': 'TS',
      '.py': 'Python',
      '.html': 'HTML'
    };
    return langMap[lang] || 'Code';
  }
}

// Register the custom element
customElements.define('run-button', RunButton);

// Export for module usage
export { RunButton };
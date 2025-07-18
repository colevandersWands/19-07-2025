/**
 * Trace Button Web Component
 * Button that triggers code tracing via parent utilities
 */

class TraceButton extends HTMLElement {
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
    this.updateVisibility();
  }

  render() {
    const style = `
      <style>
        .trace-btn {
          background: #7c3aed;
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

        .trace-btn:hover {
          background: #6d28d9;
        }

        .trace-btn:active {
          background: #5b21b6;
        }

        .trace-btn:disabled {
          background: #6b7280;
          cursor: not-allowed;
        }

        .trace-btn.hidden {
          display: none;
        }

        .trace-icon {
          font-size: 14px;
        }
      </style>
    `;

    const html = `
      ${style}
      <button class="trace-btn" id="traceBtn">
        <span class="trace-icon">🔍</span>
        <span class="btn-text">Trace</span>
      </button>
    `;

    this.shadowRoot.innerHTML = html;
  }

  setupEventListeners() {
    const button = this.shadowRoot.getElementById('traceBtn');
    
    button.addEventListener('click', () => {
      this.traceCode();
    });
  }

  traceCode() {
    if (!this.resource) {
      console.warn('⚠️ No resource set for trace button');
      return;
    }

    // Access parent window utilities
    if (window.parent && window.parent.spiralLens) {
      const traceData = window.parent.spiralLens.trace(this.resource);
      
      // Optionally create a trace table with the data
      if (traceData) {
        window.parent.spiralLens.createTraceTable(traceData);
      }
    } else {
      console.error('❌ Spiral Lens utilities not available');
      alert('Trace utilities not available');
    }
  }

  updateVisibility() {
    const button = this.shadowRoot.getElementById('traceBtn');
    if (button && this.resource) {
      // Only show trace button for languages that support tracing
      const traceable = ['.js', '.jsx', '.ts', '.py'];
      const isTraceable = traceable.includes(this.resource.lang);
      
      if (isTraceable) {
        button.classList.remove('hidden');
      } else {
        button.classList.add('hidden');
      }
    }
  }
}

// Register the custom element
customElements.define('trace-button', TraceButton);

// Export for module usage
export { TraceButton };
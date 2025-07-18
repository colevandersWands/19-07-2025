/**
 * SL1 Trace System Loader
 * Handles the complex loading of SL1 trace dependencies
 */

import { state } from './data/state.js';
import { config } from './data/config.js';
import { ADVICE } from './advice/index.js';
import { pointcut } from './pointcut.js';
import { print } from './lib/trace-log.js';
import { walk } from './estree-walker/index.js';

// Global loading state
window.traceSystemLoading = false;
window.traceSystemLoaded = false;
window.traceSystemError = null;

// Load trace system with proper dependency order
async function loadTraceSystem() {
  if (window.traceSystemLoaded) {
    return true;
  }

  if (window.traceSystemLoading) {
    // Wait for current loading to complete
    return new Promise((resolve) => {
      const checkLoaded = () => {
        if (window.traceSystemLoaded) {
          resolve(true);
        } else if (window.traceSystemError) {
          resolve(false);
        } else {
          setTimeout(checkLoaded, 100);
        }
      };
      checkLoaded();
    });
  }

  window.traceSystemLoading = true;

  try {
    // console.log('🔄 Loading SL1 trace system...');

    // Check if aran-build.js globals are available
    if (!window.Aran || !window.Astring || !window.Acorn) {
      throw new Error('Aran build dependencies not available');
    }

    // Wait for all modules to load
    // const modules = await Promise.all([
    //   modulePromises.state,
    //   modulePromises.config,
    //   modulePromises.advice,
    //   modulePromises.pointcut,
    //   modulePromises.traceLog,
    //   modulePromises.walker,
    // ]);

    // Extract the loaded modules
    // const [
    //   stateModule,
    //   configModule,
    //   adviceModule,
    //   pointcutModule,
    //   traceLogModule,
    //   walkerModule,
    // ] = modules;

    // Make modules globally available
    window.traceModules = {
      state,
      config,
      ADVICE,
      pointcut,
      print,
      walk,
    };

    // Create the trace function
    window.trace = (code) => {
      // console.log('🔍 Starting SL1 trace execution');

      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.onload = () => {
        try {
          const { state, config, ADVICE, pointcut } = window.traceModules;

          iframe.contentWindow.ADVICE = ADVICE;
          iframe.contentWindow.aran = window.Aran({ namespace: 'ADVICE' });
          const aran = iframe.contentWindow.aran;

          state.aran = iframe.contentWindow.aran;
          state.window = iframe.contentWindow;
          iframe.contentWindow.console = console;

          const settedUp = aran.setup();
          const generated = window.Astring.generate(settedUp);

          if (!iframe.contentWindow.ADVICE.builtins) {
            const setupScript = document.createElement('script');
            setupScript.innerHTML = generated;
            iframe.contentDocument.body.appendChild(setupScript);
          }

          iframe.contentWindow.ADVICE.builtins.global.console = console;

          // Inner trace function
          iframe.contentWindow.trace = (code) => {
            state.scopeDepth = 1;
            state.blockLabels = [];
            state.loggedSteps = 0;
            state.callExpressions = [];
            state.code = code;

            let estree1;
            try {
              estree1 = window.Acorn.parse(code, { locations: true });
            } catch (err) {
              console.log('%c-> creation phase error:', 'font-weight:bold;');
              document.body.removeChild(iframe);
              eval(code);
              return;
            }

            // Remove debugger statements
            const deDebuggered = window.traceModules.walk(estree1, {
              enter(node, parent, prop, index) {
                if (node.type === 'CallExpression') {
                  state.callExpressions.push(node);
                } else if (node.type === 'DebuggerStatement') {
                  const nullNode = window.Acorn.parse('null').body[0];
                  nullNode.start = node.start;
                  nullNode.end = node.end;
                  nullNode.expression.start = node.start;
                  nullNode.expression.end = node.end;
                  this.replace(nullNode);
                }
              },
            });

            state.hoisted = [];
            let estree2 = aran.weave(deDebuggered, pointcut);

            const instrumented = window.Astring.generate(estree2);
            state.loggedSteps = 1;

            try {
              iframe.contentWindow.eval(instrumented);
            } catch (err) {
              console.error('Trace execution error:', err);
            }

            // Clean up iframe after execution
            setTimeout(() => {
              if (iframe.parentNode) {
                document.body.removeChild(iframe);
              }
            }, 1000);
          };

          iframe.contentWindow.trace(code);
        } catch (error) {
          console.error('Trace setup error:', error);
          if (iframe.parentNode) {
            document.body.removeChild(iframe);
          }
        }
      };

      // Add allow-modals for prompt/alert/confirm to work in traced code
      // The iframe is hidden and temporary, so this is acceptable for tracing
      iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-modals');
      document.body.appendChild(iframe);
    };

    window.traceSystemLoaded = true;
    window.traceSystemLoading = false;
    // console.log('✅ SL1 trace system loaded successfully');
    return true;
  } catch (error) {
    console.error('❌ Failed to load SL1 trace system:', error);
    window.traceSystemError = error;
    window.traceSystemLoading = false;
    return false;
  }
}

// Auto-load when script runs
loadTraceSystem();

// Export for manual loading
window.loadTraceSystem = loadTraceSystem;

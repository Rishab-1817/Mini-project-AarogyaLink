(function (window, document) {
  // Usage:
  // 1) Set a global config object before loading this script, e.g.:
  //    window.DOCTOR_BOT_CONFIG = {
  //      assistantId: 'ae3149bf-85fd-4e58-898c-6ba1cd44241b',
  //      publicKey: '3f316145-e21e-4681-9bf0-7479538e1e33',
  //      projectId: 'fed07d8a-bd81-4046-8278-eced5eb7ed11',
  //      scriptUrl: 'https://static.readdy.ai/assistant/widget.umd.js'
  //    };
  // 2) Then include this script or call window.initDoctorBot(config)

  function showFallback() {
    var container = document.getElementById('chatbot-container');
    if (container) container.style.display = 'block';
  }

  function initDoctorBot(cfg) {
    try {
      if (!cfg) {
        console.warn('DoctorBot: missing config object. Provide window.DOCTOR_BOT_CONFIG or pass config to initDoctorBot.');
        showFallback();
        return;
      }

      var assistantId = cfg.assistantId || '';
      var publicKey = cfg.publicKey || '';
      var projectId = cfg.projectId || '';
      var scriptUrl = cfg.scriptUrl || 'https://static.readdy.ai/assistant/widget.umd.js';

      if (!assistantId || !publicKey) {
        console.warn('DoctorBot: assistantId or publicKey missing in config. Falling back to iframe.');
        showFallback();
        return;
      }

      // Create custom element vapi-widget
      var vapiWidget = document.createElement('vapi-widget');
      vapiWidget.setAttribute('assistant-id', assistantId);
      vapiWidget.setAttribute('public-key', publicKey);
      vapiWidget.setAttribute('cta-title', cfg.ctaTitle || '👨‍⚕️ DoctorBot');
      vapiWidget.setAttribute('size', cfg.size || 'compact');
      vapiWidget.setAttribute('mode', cfg.mode || 'chat');
      vapiWidget.setAttribute('voice-show-transcript', cfg.voiceShowTranscript ? 'true' : 'false');
      vapiWidget.setAttribute('title', cfg.title || 'DoctorBot - Your Healthcare Assistant');

      document.body.appendChild(vapiWidget);

      // Load provider script
      var script = document.createElement('script');
      script.src = scriptUrl;
      script.async = true;
      document.body.appendChild(script);

      // If the script fails to load, show fallback iframe
      script.addEventListener('error', function () {
        console.warn('DoctorBot: provider script failed to load — showing iframe fallback.');
        showFallback();
      });

      // Optional: timeout to show fallback if script doesn't initialize
      var fallbackTimeout = setTimeout(function () {
        // If widget didn't register, show fallback
        // We check presence of vapi-widget in DOM and assume provider would enhance it
        if (!window.VAPI_WIDGET_INITIALIZED) {
          console.warn('DoctorBot: widget did not initialize within timeout — showing fallback.');
          showFallback();
        }
      }, cfg.timeoutMs || 8000);

      // If provider script sets a global flag when ready, you can clear the timeout.
      // Example provider integration could set window.VAPI_WIDGET_INITIALIZED = true when ready.

    } catch (err) {
      console.error('DoctorBot: initialization error', err);
      showFallback();
    }
  }

  // Expose initializer
  window.initDoctorBot = initDoctorBot;

  // Auto-init if global config exists
  if (window.DOCTOR_BOT_CONFIG) {
    initDoctorBot(window.DOCTOR_BOT_CONFIG);
  }

})(window, document);
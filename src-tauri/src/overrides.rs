use tauri::Webview;
use url::Url;

pub fn handle_page_load(window: &Webview, url: &Url) {
    if url.as_str().contains("ntfy") {
        let _ = window.eval(
      r#"
      (() => {
        try {
          const styleId = 'ntfy-desktop-cleanup-style';

          if (!document.getElementById(styleId)) {
            const style = document.createElement('style');
            style.id = styleId;
            style.textContent = ".MuiAlert-root, .MuiListSubheader-root { display: none !important; }";
            document.head.appendChild(style);
          }

          const fixText = () => {
            const elements = document.querySelectorAll('.MuiTypography-root');

            elements.forEach((el) => {
              if (el.textContent === 'All notifications') {
                el.textContent = 'Notifications';
              }
            });
          };

          fixText();
          setTimeout(fixText, 500);
          setTimeout(fixText, 1500);
        } catch (error) {
          console.error('ntfy cleanup failed', error);
        }

        try {
          if (window.__TAURI__ && !window.__TAURI__.__ntfyHooked) {
            window.__TAURI__.__ntfyHooked = true;
            const originalLog = console.log;

            const seen = new Set();
            console.log = function (...args) {
              try {
                const message = args.join(' ');

                if (
                  message.includes('[Connection') &&
                  message.includes('Message received from server:')
                ) {
                  const jsonStart = message.indexOf('{');

                  if (jsonStart !== -1) {
                    const jsonString = message.slice(jsonStart);

                    try {
                      const data = JSON.parse(jsonString);

                      if (
                        data.event === 'message' &&
                        typeof data.message === 'string' &&
                        !data.message.startsWith('{')
                      ) {
                        const key = `${data.id}-${data.time}-${data.topic}`;

                        if (seen.has(key)) return;

                        seen.add(key);

                        if (seen.size > 500) {
                          seen.clear();
                        }

                        const clean = (msg) =>
                          msg
                            ?.replace(/\n\n+/g, '\n')
                            .replace(/â¯/g, ' ')
                            .trim();

                        window.__TAURI__.event.emit('ntfy_notification', {
                          title: data.title || data.topic || 'ntfy',
                          body: clean(data.message),
                        });
                      }
                    } catch (e) {}
                  }
                }
              } catch {
                // Ignore any errors in the interception logic
              }
              originalLog.apply(console, args);
            };
          }
        } catch (error) {
          console.error('ntfy notification interception failed', error);
        }
      })();
      "#
    );
    }
}

use tauri::Webview;

pub fn handle_page_load(window: &Webview) {
    let _ = window.eval(
        r#"
        (() => {
          try {
            const styleId = 'ntfy-style';

            if (!document.getElementById(styleId)) {
              const style = document.createElement('style');

              style.id = styleId;
              style.textContent = `
                .MuiAlert-root,
                .MuiListSubheader-root {
                  display: none !important;
                }
              `;

              document.head.appendChild(style);
            }

            if (!window.__NTFY_EXTERNAL_LINKS__) {
              window.__NTFY_EXTERNAL_LINKS__ = true;

              document.addEventListener(
                'click',
                async (e) => {
                  const link = e.target?.closest?.('a[href]');

                  if (!link) return;

                  try {
                    const url = new URL(link.href);

                    if (url.host === window.location.host) {
                      return;
                    }

                    e.preventDefault();

                    await window.__TAURI_INTERNALS__.invoke(
                      'plugin:opener|open_url',
                      {
                        url: url.href,
                      }
                    );
                  } catch (error) {
                    console.error('ntfy: Failed to open external link', error);
                  }
                },
                true
              );
            }

            const fixText = () => {
              const elements = document.querySelectorAll('.MuiTypography-root');

              elements.forEach((el) => {
                const text = el.textContent?.trim();

                if (text === 'All notifications') {
                  el.textContent = 'Notifications';
                }

                if (text === 'Publish notification') {
                  el.textContent = 'Publish';
                }

                if (text === 'Subscribe to topic') {
                  el.textContent = 'Subscribe';
                }

                if (text === 'Documentation') {
                  el.closest('.MuiListItemButton-root')
                    ?.style.setProperty('display', 'none', 'important');
                }
              });
            };

            fixText();

            setTimeout(fixText, 500);
            setTimeout(fixText, 1500);
            setTimeout(fixText, 3000);

            if (!window.__NTFY_PATCH__) {
              window.__NTFY_PATCH__ = true;

              window.__NTFY_SEEN__ ??= new Set();

              const seen = window.__NTFY_SEEN__;

              const emitNotification = (data) => {
                try {
                  if (
                    !data ||
                    data.event !== 'message' ||
                    typeof data.message !== 'string'
                  ) {
                    return;
                  }

                  if (data.message.startsWith('{')) {
                    return;
                  }

                  const key = `${data.id}-${data.time}-${data.topic}`;

                  if (seen.has(key)) {
                    return;
                  }

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
                } catch (error) {
                  console.error('ntfy: Failed to emit notification', error);
                }
              };

              if (window.WebSocket) {
                const OriginalWebSocket = window.WebSocket;

                window.WebSocket = class extends OriginalWebSocket {
                  constructor(url, protocols) {
                    super(url, protocols);

                    this.addEventListener('message', (event) => {
                      if (typeof event.data !== 'string') {
                        return;
                      }

                      try {
                        const data = JSON.parse(event.data);

                        emitNotification(data);
                      } catch {}
                    });
                  }
                };
              }

              console.log('ntfy: Listeners attached');
            }
          } catch (error) {
            console.error('ntfy: Failed to attach listeners', error);
          }
        })();
        "#,
    );
}

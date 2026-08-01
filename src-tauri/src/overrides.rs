use tauri::Webview;

pub fn handle_page_load(window: &Webview) {
    let _ = window.eval(
        r#"
        (() => {
          try {
            const invoke = (command, args = {}) =>
              window.__TAURI_INTERNALS__?.invoke(command, args);

            const scheduleSyncComplete = (delay = 750) => {
              clearTimeout(window.__NTFY_SYNC_COMPLETE_TIMER__);

              window.__NTFY_SYNC_COMPLETE_TIMER__ = setTimeout(() => {
                invoke('complete_websocket', {
                  pageUrl: window.location.href,
                })?.catch((error) => {
                  console.error('ntfy: Failed to complete WebSocket sync', error);
                });
              }, delay);
            };

            const ntfyCheck = () => {
              const ogUrl = document
                .querySelector('meta[property="og:url"]')
                ?.getAttribute('content')
                ?.trim()
                ?.replace(/\/$/, '');

              return ogUrl === 'https://ntfy.sh';
            };

            const isNtfyPage = ntfyCheck();

            if (isNtfyPage) {
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
                  async (event) => {
                    const link = event.target?.closest?.('a[href]');

                    if (!link) return;

                    try {
                      const url = new URL(link.href);

                      if (url.host === window.location.host) {
                        return;
                      }

                      event.preventDefault();

                      await invoke('plugin:opener|open_url', {
                        url: url.href,
                      });
                    } catch (error) {
                      console.error('ntfy: Failed to open external link', error);
                    }
                  },
                  true
                );
              }

              const fixText = () => {
                const elements = document.querySelectorAll('.MuiTypography-root');

                elements.forEach((element) => {
                  const text = element.textContent?.trim();

                  if (text === 'All notifications') {
                    element.textContent = 'Notifications';
                  }

                  if (text === 'Publish notification') {
                    element.textContent = 'Publish';
                  }

                  if (text === 'Subscribe to topic') {
                    element.textContent = 'Subscribe';
                  }

                  if (text === 'Documentation') {
                    element
                      .closest('.MuiListItemButton-root')
                      ?.style.setProperty('display', 'none', 'important');
                  }
                });
              };

              fixText();

              setTimeout(fixText, 500);
              setTimeout(fixText, 1500);
              setTimeout(fixText, 3000);
            }

            if (!window.__NTFY_PATCH__ && window.WebSocket) {
              window.__NTFY_PATCH__ = true;
              window.__NTFY_UNLOADING__ = false;
              window.__NTFY_SEEN__ ??= new Set();

              window.addEventListener(
                'beforeunload',
                () => {
                  window.__NTFY_UNLOADING__ = true;
                },
                { once: true }
              );

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

                  const clean = (message) =>
                    message
                      ?.replace(/\n\n+/g, '\n')
                      .replace(/â¯/g, ' ')
                      .trim();

                  window.__TAURI__.event.emit('ntfy_notification', {
                    id: data.id || null,
                    message: clean(data.message),
                    time: data.time || null,
                    title: data.title || data.topic || 'ntfy',
                    topic: data.topic || '',
                  });
                } catch (error) {
                  console.error('ntfy: Failed to emit notification', error);
                }
              };

              const isNtfySocket = (value) => {
                try {
                  const socketUrl = new URL(value, window.location.href);
                  const protocolValid =
                    socketUrl.protocol === 'ws:' || socketUrl.protocol === 'wss:';

                  const topicPath = socketUrl.pathname.endsWith('/ws')
                    ? socketUrl.pathname.slice(0, -3)
                    : '';

                  return protocolValid && topicPath.split('/').some(Boolean);
                } catch {
                  return false;
                }
              };

              const OriginalWebSocket = window.WebSocket;

              window.WebSocket = class extends OriginalWebSocket {
                constructor(url, protocols) {
                  super(url, protocols);

                  if (!isNtfySocket(this.url)) {
                    return;
                  }

                  this.__NTFY_BACKGROUND_URL__ = this.url;

                  invoke('sync_websocket', { url: this.url })
                    ?.then(() => scheduleSyncComplete())
                    .catch((error) => {
                      console.error('ntfy: Failed to sync WebSocket with Rust', error);
                    });

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

                close(code, reason) {
                  if (
                    !window.__NTFY_UNLOADING__ &&
                    this.__NTFY_BACKGROUND_URL__
                  ) {
                    invoke('unsync_websocket', {
                      url: this.__NTFY_BACKGROUND_URL__,
                    })
                      ?.then(() => scheduleSyncComplete())
                      .catch((error) => {
                        console.error(
                          'ntfy: Failed to remove Rust WebSocket sync',
                          error
                        );
                      });
                  }

                  return super.close(code, reason);
                }
              };

              console.log('ntfy: WebSocket handover attached');
            }

            scheduleSyncComplete(1500);
          } catch (error) {
            console.error('ntfy: Failed to attach listeners', error);
          }
        })();
        "#,
    );
}

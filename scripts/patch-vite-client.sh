#!/bin/sh
# Patch Vite client to prevent full-page reload on WebSocket reconnection.
# The Kubernetes proxy drops idle WS connections after ~30-60s.
# Vite reconnects and calls location.reload() — this patch skips that.

VITE_CLIENT="node_modules/vite/dist/client/client.mjs"

if [ -f "$VITE_CLIENT" ]; then
  if grep -q "await waitForSuccessfulPing" "$VITE_CLIENT" && grep -q "location.reload();" "$VITE_CLIENT"; then
    sed -i 's|await waitForSuccessfulPing(url.href);\n\t\t\t\t\tlocation.reload();|await waitForSuccessfulPing(url.href);\n\t\t\t\t\tconsole.debug("[vite] reconnected after WS drop — skipping reload");|' "$VITE_CLIENT" 2>/dev/null
    # Fallback: use python for multiline replacement
    python3 -c "
content = open('$VITE_CLIENT', 'r').read()
old = 'await waitForSuccessfulPing(url.href);\n\t\t\t\t\tlocation.reload();'
new = 'await waitForSuccessfulPing(url.href);\n\t\t\t\t\tconsole.debug(\"[vite] reconnected after WS drop — skipping reload\");'
if old in content:
    content = content.replace(old, new, 1)
    open('$VITE_CLIENT', 'w').write(content)
    print('Vite client patched: WS reconnect reload disabled')
else:
    print('Vite client already patched or pattern changed')
" 2>/dev/null
  fi
fi

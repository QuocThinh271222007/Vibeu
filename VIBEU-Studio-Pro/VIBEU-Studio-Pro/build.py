"""Build the self-contained HTML using only files in this package (Python 3)."""
from pathlib import Path
import json
ROOT=Path(__file__).resolve().parent
html=(ROOT/'src/shell.html').read_text()
sets=json.loads((ROOT/'src/data.json').read_text())
previews=json.loads((ROOT/'src/previews.json').read_text())
values={'DATA':'const SETS='+json.dumps(sets,ensure_ascii=False)+';const PREVIEWS='+json.dumps(previews)+';','ENGINE':(ROOT/'src/engine.js').read_text(),'PRESETS':(ROOT/'src/presets.js').read_text(),'APP':(ROOT/'src/app.js').read_text()}
for key,value in values.items():html=html.replace('/*__'+key+'__*/',value.replace('</script','<\\/script'))
(ROOT/'index.html').write_text(html)
print('Built index.html:',len(html),'characters')

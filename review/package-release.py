"""Package the static runtime only, without test data or backups."""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
import hashlib
import json

root = Path(__file__).resolve().parent.parent
runtime = [root / name for name in ['index.html','manifest.json','sw.js']]
for folder in ['css','js','icons','audio']:
    runtime.extend(sorted(p for p in (root / folder).rglob('*') if p.is_file()))
archive = root / 'review' / 'yalla-english-ready.zip'
with ZipFile(archive,'w',ZIP_DEFLATED) as bundle:
    for source in runtime:
        bundle.write(source,source.relative_to(root).as_posix())
with ZipFile(archive) as bundle:
    assert bundle.testzip() is None
    assert 'index.html' in bundle.namelist()
    assert all(f'audio/letters/{letter}.wav' in bundle.namelist() for letter in 'ABCDEFGHIJKLMNOPQRSTUVWXYZ')
manifest = {'archive':archive.name, 'sha256':hashlib.sha256(archive.read_bytes()).hexdigest(), 'files':[
    {'path':p.relative_to(root).as_posix(),'sha256':hashlib.sha256(p.read_bytes()).hexdigest()}
    for p in runtime
]}
(root / 'review' / 'release-manifest.json').write_text(json.dumps(manifest,indent=2,ensure_ascii=False),encoding='utf-8')
print(f'Packaged {len(runtime)} runtime files; archive verified: {archive.name} ({archive.stat().st_size:,} bytes)')

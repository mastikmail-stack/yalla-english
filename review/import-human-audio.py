"""Import licensed human recordings; exact text only. Never synthesize or stitch words.

Network access is limited to Wikimedia and Tatoeba. Original metadata is cached
for audit; distributable source/author/license metadata accompanies every clip.
"""
from pathlib import Path
from urllib.request import Request, urlopen
from urllib.error import HTTPError
from urllib.parse import urlencode, urlparse
from concurrent.futures import ThreadPoolExecutor
import json, hashlib, re, html, subprocess, time

ROOT = Path(__file__).resolve().parent.parent
CACHE = ROOT / 'review/audio-sources'
OUTPUT = ROOT / 'audio/human'
CACHE.mkdir(exist_ok=True)
OUTPUT.mkdir(exist_ok=True)
AGENT = 'YallaEnglishAudioImport/1.0 (https://github.com/mastikmail-stack/yalla-english)'
ALLOWED = {'commons.wikimedia.org','upload.wikimedia.org','api.tatoeba.org','audio.tatoeba.org','tatoeba.org'}

def fetch(url):
    if urlparse(url).hostname not in ALLOWED:
        raise ValueError('Unapproved source host')
    request = Request(url, headers={'User-Agent': AGENT})
    for attempt in range(4):
        try:
            with urlopen(request, timeout=20) as response:
                return response.read()
        except HTTPError as error:
            if error.code == 429 and attempt < 3:
                time.sleep(4 * (attempt+1))
                continue
            raise RuntimeError(str(error) + ' ' + error.read(300).decode('utf-8','replace')) from error

def cached_json(url):
    file = CACHE / (hashlib.sha256(url.encode()).hexdigest() + '.json')
    if not file.exists():
        data = fetch(url)
        json.loads(data)
        file.write_bytes(data)
    return json.loads(file.read_bytes())

def clean(value):
    return html.unescape(re.sub('<[^>]*>', '', value or '')).strip()

def norm(value):
    return re.sub(r'[^a-z0-9\s\x27]', '', value.lower().replace('’', "'")).strip()

def convert(source_url, key):
    name = hashlib.sha256(key.encode()).hexdigest()[:20]
    original = CACHE / (name + '.source')
    target = OUTPUT / (name + '.mp3')
    if not original.exists():
        original.write_bytes(fetch(source_url))
    if not target.exists():
        subprocess.run(['ffmpeg','-v','error','-y','-i',str(original),'-map_metadata','-1','-ac','1','-ar','44100','-af','loudnorm=I=-19:TP=-2:LRA=7','-codec:a','libmp3lame','-b:a','96k',str(target)],check=True)
    return {'file':target.relative_to(ROOT).as_posix(),'sha256':hashlib.sha256(target.read_bytes()).hexdigest()}

def common_record(page, text):
    info = page.get('imageinfo', [None])[0]
    if not info:
        return None
    metadata = info.get('extmetadata', {})
    get = lambda key: clean(metadata.get(key, {}).get('value',''))
    license = get('LicenseShortName')
    if not (license == 'Public domain' or re.fullmatch(r'CC (?:BY(?:-SA)?|0) [1234]\.0', license) or license == 'CC BY-SA 2.5'):
        return None
    if get('Restrictions'):
        return None
    return {'text':text,'source':info['descriptionurl'],'author':get('Artist') or get('Credit'),
            'license':license,'licenseUrl':get('LicenseUrl') or 'https://creativecommons.org/publicdomain/mark/1.0/',
            'recording':'human','changes':'Converted to MP3, mono, loudness normalized; no speech synthesized.',
            **convert(info['url'], page['title'])}

inventory = json.loads((CACHE / 'inventory.json').read_text(encoding='utf-8'))
words = sorted(set(item['text'] for item in inventory if item['type']=='word' and not re.fullmatch('[A-Z]',item['text'])))
manifest = {}
errors = []
title_words = {'File:En-us-' + word.lower().replace(' ', '_') + '.ogg':word for word in words}
# Use a specifically named American letter recording for Z, rather than an
# ambiguous "zed or zee" ending in the full alphabet source.
title_words['File:En-us-z.ogg'] = 'Z'
titles = list(title_words)
for offset in range(0,len(titles),40):
    url = 'https://commons.wikimedia.org/w/api.php?' + urlencode({'action':'query','format':'json','prop':'imageinfo','iiprop':'url|extmetadata','titles':'|'.join(titles[offset:offset+40])})
    response = cached_json(url)
    normalized = {entry['to']:entry['from'] for entry in response.get('query',{}).get('normalized',[])}
    for page in response.get('query',{}).get('pages',{}).values():
        title = normalized.get(page['title'], page['title'])
        text = title_words.get(title)
        if text is None:
            continue
        try:
            item = common_record(page,text)
            if item: manifest[text] = item
        except Exception as error:
            errors.append({'text':text,'error':str(error)})
            if len(errors) < 4: print('Source problem: '+text+' '+str(error),flush=True)
    (CACHE / 'partial-import.json').write_text(json.dumps({'recordings':manifest,'errors':errors},ensure_ascii=False,indent=2),encoding='utf-8')
    print(f'Wikimedia: {min(offset+40,len(titles))}/{len(titles)} candidates, {len(manifest)} licensed recordings',flush=True)

def tatoeba(text):
    query = {'lang':'eng','q':'"'+text.replace('"','')+'"','has_audio':'yes','include':'audios','is_unapproved':'no','limit':'30','sort':'relevance'}
    response = cached_json('https://api.tatoeba.org/v1/sentences?' + urlencode(query))
    candidates = []
    for sentence in response.get('data',[]):
        if norm(sentence['text']) != norm(text):
            continue
        for audio in sentence.get('audios',[]):
            license = audio.get('licence','')
            if license not in ['CC0 1.0','CC BY 4.0','CC BY 3.0','CC BY 2.0','CC BY-SA 4.0','CC BY-SA 3.0']:
                continue
            candidates.append((sentence,audio))
    # CK's corpus is explicitly used for English learning. Still keep exact text
    # checks, author, license, and source; never label these as listening-approved.
    candidates.sort(key=lambda entry: entry[1]['author'] != 'CK')
    if not candidates:
        return None
    sentence,audio = candidates[0]
    license = audio['licence']
    license_url = 'https://creativecommons.org/publicdomain/zero/1.0/' if license == 'CC0 1.0' else 'https://creativecommons.org/licenses/'+('by-sa' if 'BY-SA' in license else 'by')+'/'+license.split()[-1]+'/'
    return {'text':text,'source':'https://tatoeba.org/en/sentences/show/'+str(sentence['id']),
            'author':audio['author'],'attributionUrl':audio.get('attribution_url'),'license':license,'licenseUrl':license_url,
            'recording':'human','sourceText':sentence['text'],'changes':'Converted to MP3, mono, loudness normalized; no speech synthesized.',
            **convert(audio['download_url'], 'tatoeba:'+str(audio['id']))}

remaining = sorted(set(item['text'] for item in inventory if item['type']!='letter' and item['text'] not in manifest and not re.fullmatch('[A-Z]',item['text'])))
def lookup(text):
    try: return text,tatoeba(text),None
    except Exception as error: return text,None,str(error)
with ThreadPoolExecutor(max_workers=3) as pool:
    for count,(text,item,error) in enumerate(pool.map(lookup,remaining),1):
        if item: manifest[text] = item
        if error:
            errors.append({'text':text,'error':error})
            if count < 4: print('Sentence problem: '+text+' '+error,flush=True)
        if count%20==0: print(f'Tatoeba: {count}/{len(remaining)}, total {len(manifest)} licensed recordings',flush=True)

(ROOT / 'audio/human/manifest.json').write_text(json.dumps({'recordings':manifest},ensure_ascii=False,indent=2),encoding='utf-8')
missing = [item for item in inventory if item['type']!='letter' and item['text'] not in manifest and not re.fullmatch('[A-Z]',item['text'])]
(CACHE / 'import-result.json').write_text(json.dumps({'recordings':len(manifest),'missing':missing,'errors':errors},ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({'recordings':len(manifest),'missing':len(missing),'errors':len(errors)}),flush=True)

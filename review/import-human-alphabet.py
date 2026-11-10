"""Split a public-domain human alphabet recording at measured silent gaps.

The source ends with both names for Z; use a separately identified US Z recording
for that letter. This is editing human audio, not speech generation.
"""
from pathlib import Path
import subprocess, re, json, hashlib
ROOT=Path(__file__).resolve().parent.parent
source=ROOT/'review/audio-sources/English_alphabet_woman.oga'
result=subprocess.run(['ffmpeg','-hide_banner','-i',str(source),'-af','silencedetect=noise=-35dB:d=0.25','-f','null','-'],capture_output=True,text=True,check=True)
starts=[float(x) for x in re.findall(r'silence_end: ([\d.]+)',result.stderr)]
ends=[float(x) for x in re.findall(r'silence_start: ([\d.]+)',result.stderr)][1:]
intervals=[(start,end) for start,end in zip(starts,ends) if end-start>0.15]
assert len(intervals)==27, intervals
manifest_path=ROOT/'audio/letters/manifest.json'
old=json.loads(manifest_path.read_text(encoding='utf-8-sig'))
phones={x['letter']:x['ipa'] for x in old['letters']}
z_source=ROOT/'review/audio-sources/z.ogg'
assert z_source.exists(), 'The explicitly identified American Z recording is required.'
letters=[]
for i,letter in enumerate('ABCDEFGHIJKLMNOPQRSTUVWXYZ'):
    target=ROOT/'audio/letters'/f'{letter}.wav'
    if letter=='Z':
        args=['-i',str(z_source)]
        attribution={'source':'https://commons.wikimedia.org/wiki/File:En-us-z.ogg','author':'Dvortygirl','license':'CC BY-SA 3.0','licenseUrl':'https://creativecommons.org/licenses/by-sa/3.0/','changes':'Converted to mono WAV and loudness normalized. This adapted recording is distributed under CC BY-SA 3.0.'}
    else:
        start,end=intervals[i]
        begin=max(0,start-0.12)
        args=['-ss',str(begin),'-t',str(end+0.22-begin),'-i',str(source)]
        attribution={'source':'https://commons.wikimedia.org/wiki/File:English_alphabet_woman.oga','author':'Wikifriends','license':'Public domain','licenseUrl':'https://creativecommons.org/publicdomain/mark/1.0/',
            'sourceStart':round(begin,4),'sourceEnd':round(end+0.22,4),'changes':'Excerpted at silence boundaries, converted to mono WAV, loudness normalized.'}
    subprocess.run(['ffmpeg','-v','error','-y',*args,'-map_metadata','-1','-ac','1','-ar','22050','-af','loudnorm=I=-19:TP=-2:LRA=7','-c:a','pcm_s16le',str(target)],check=True)
    letters.append({'letter':letter,'ipa':phones[letter],'file':letter+'.wav','sha256':hashlib.sha256(target.read_bytes()).hexdigest(),'recording':'human',**attribution})
manifest_path.write_text(json.dumps({'method':'Human recordings; no generated speech','letters':letters},indent=2,ensure_ascii=False),encoding='utf-8')
print('Imported 26 human letter-name recordings.')

import json,re,subprocess,sys,zipfile
from pathlib import Path
from verify_apk import verify
signed,unsigned,signer=sys.argv[1:]
report=verify(signed);verify(unsigned)
output=subprocess.check_output([signer,'verify','--verbose','--print-certs',signed],text=True)
expected=Path('release/signing-certificate.sha256').read_text().strip().lower()
match=re.search(r'Signer #1 certificate SHA-256 digest:\s*([0-9a-f]+)',output,re.I)
assert match and match.group(1).lower()==expected,'Signer does not match the permanent public certificate'
assert 'Number of signers: 1' in output
assert re.search(r'Verified using v2 scheme.*:\s*true',output)
assert re.search(r'Verified using v3 scheme.*:\s*true',output)
a,b=zipfile.ZipFile(signed),zipfile.ZipFile(unsigned)
def content(z):return {n:z.read(n) for n in z.namelist() if not n.startswith('META-INF/') and not n.endswith('/')}
assert content(a)==content(b),'The signed APK does not match the code built by this workflow'
report['signer_certificate_sha256']=expected;report['v2_signature']=True;report['v3_signature']=True
Path('Flink-Sicherheitspruefung.json').write_text(json.dumps(report,indent=2)+'\n')
print(output);print('Signed APK matches this source build and the pinned release certificate.')

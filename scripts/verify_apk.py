"""Inspect the compiled APK, not only the source manifest."""
import hashlib,json,struct,sys,zipfile
from pathlib import Path

def manifest_tags(data):
 u16=lambda o:struct.unpack_from('<H',data,o)[0]
 u32=lambda o:struct.unpack_from('<I',data,o)[0]
 strings=[];offset=8;tags=[]
 while offset<len(data):
  kind,header,size=struct.unpack_from('<HHI',data,offset)
  if size<8 or offset+size>len(data):raise ValueError('Invalid binary XML chunk')
  if kind==1:
   count=u32(offset+8);flags=u32(offset+16);start=u32(offset+20)
   for i in range(count):
    pos=offset+start+u32(offset+header+i*4)
    if flags&0x100:
     def length(p):
      a=data[p];return ((((a&127)<<8)|data[p+1]),p+2) if a&128 else (a,p+1)
     _,pos=length(pos);n,pos=length(pos);strings.append(data[pos:pos+n].decode('utf-8'))
    else:
     n=u16(pos);pos+=2
     if n&0x8000:n=((n&32767)<<16)|u16(pos);pos+=2
     strings.append(data[pos:pos+2*n].decode('utf-16-le'))
  elif kind==0x102:
   name=strings[u32(offset+20)];attr_start=u16(offset+24);attr_size=u16(offset+26);count=u16(offset+28);attrs={}
   for i in range(count):
    p=offset+16+attr_start+i*attr_size;key=strings[u32(p+4)];raw=u32(p+8);typ=data[p+15];val=u32(p+16)
    attrs[key]=strings[raw] if raw!=0xffffffff else bool(val) if typ==0x12 else strings[val] if typ==3 else val
   tags.append((name,attrs))
  offset+=size
 return tags

def verify(path):
 z=zipfile.ZipFile(path);tags=manifest_tags(z.read('AndroidManifest.xml'))
 app=next(a for n,a in tags if n=='application');meta=next(a for n,a in tags if n=='manifest');sdk=next(a for n,a in tags if n=='uses-sdk')
 assert meta['package']=='de.flink.einmaleins'
 assert app.get('debuggable',False) is False,'Debug mode is enabled'
 assert app.get('testOnly',False) is False,'Test-only APK'
 assert app['allowBackup'] is False,'Backup enabled'
 assert app['usesCleartextTraffic'] is False,'Cleartext traffic enabled'
 assert 'dataExtractionRules' in app and app.get('fullBackupContent') in [False,0],'Missing backup restrictions'
 permissions=[a.get('name') for n,a in tags if n.startswith('uses-permission')]
 assert not permissions,f'Unexpected permissions: {permissions}'
 assert not any(n in ['service','receiver','provider'] for n,a in tags),'Unexpected exported component surface'
 activities=[a for n,a in tags if n=='activity'];assert len(activities)==1 and activities[0]['name']=='de.flink.einmaleins.MainActivity'
 assert sdk['minSdkVersion']==23 and sdk['targetSdkVersion']>=35
 assert not any(n.lower().endswith(('.jks','.keystore','.p12','.key')) or 'signing-config.json' in n for n in z.namelist()),'Private signing material in APK'
 html=z.read('assets/index.html').decode();assert 'Content-Security-Policy' in html and "connect-src 'none'" in html
 assert b'addJavascriptInterface' not in z.read('assets/app.js')
 report={'package':meta['package'],'version':meta['versionName'],'version_code':meta['versionCode'],'min_sdk':sdk['minSdkVersion'],'target_sdk':sdk['targetSdkVersion'],'debuggable':False,'test_only':False,'permissions':permissions,'allow_backup':False,'cleartext_traffic':False,'sha256':hashlib.sha256(Path(path).read_bytes()).hexdigest()}
 return report

if __name__=='__main__':
 report=verify(sys.argv[1]);print(json.dumps(report,indent=2))
 if len(sys.argv)>2:Path(sys.argv[2]).write_text(json.dumps(report,indent=2)+'\n')

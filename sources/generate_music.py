from pathlib import Path
import shutil,json,math,subprocess,wave
import numpy as np

OUT=Path(__file__).resolve().parents[1]
for p in ['assets/audio','assets/sequences']:(OUT/p).mkdir(parents=True,exist_ok=True)
SR=24000
SCENES=[['Primer resplandor','Líneas que despiertan','Encuentro de luz','Ondas ascendentes','Coronas en movimiento','Diálogo entre torres','Cascada de color','Respirar la plaza','Espirales envolventes','El cielo se abre','Celebración','Firma de luz'],['La plaza late','Pulso de bienvenida','Apertura de color','Elevación','Ritmo orbital','Pregunta y respuesta','Cintas en carrera','Pausa violeta','Giro de energía','Doble expansión','Todos al ritmo','Gran final'],['La hora azul','Nace una aurora','Horizonte luminoso','Mareas de luz','Cúpulas celestes','Ecos en el espacio','Lluvia suave','Silencio azul','El despertar','Bóvedas de color','Un mismo cielo','Luz para encontrarnos']]
CONFIG=[('encuentro','Encuentro dorado',100,'Lounge · cálido y elegante','gold',[50,57,55,52],[0,4,7,11,14]),('pulso','Pulso de la plaza',120,'House · color y celebración','party',[45,53,48,55],[0,3,7,10,14]),('aurora','Aurora nocturna',108,'Cinemático · azul, turquesa y violeta','aurora',[50,46,53,48],[0,3,7,10,14])]
EFFECTS=[['rise','breathe','bloom','waves','orbit','dialogue','cascade','breathe','helix','bloom','waves','finale'],['rise','dialogue','bloom','helix','orbit','waves','cascade','breathe','dialogue','orbit','helix','finale'],['breathe','rise','bloom','waves','helix','dialogue','cascade','breathe','waves','orbit','bloom','finale']]
tracks=[]
for idx,(tid,title,bpm,theme,palette,roots,scale) in enumerate(CONFIG):
    beat=60/bpm; bar=beat*4; duration=48*bar
    cues=[dict(name=SCENES[idx][i],start=round(i*4*bar,6),end=round((i+1)*4*bar,6),effect=EFFECTS[idx][i],palette=palette) for i in range(12)]
    track=dict(id=tid,title=title,bpm=bpm,duration=duration,ignitionAt=8*bar,theme=theme,palette=palette,audio=f'assets/audio/{tid}.mp3',audioWav=f'assets/audio/{tid}.wav',cues=cues)
    tracks.append(track)
    target=OUT/track['audio']
    if target.exists():continue
    rng=np.random.default_rng(810+idx)
    n=round(duration*SR);music=np.zeros((n,2),np.float32);drums=np.zeros_like(music)
    cache={}
    def add(s,at,amp,pan=0,dest=None):
        arr=music if dest is None else dest
        start=round(at*SR);count=min(len(s),n-start)
        if count<=0:return
        pan=(pan+1)*math.pi/4
        arr[start:start+count,0]+=s[:count]*amp*math.cos(pan)
        arr[start:start+count,1]+=s[:count]*amp*math.sin(pan)
    def tone(note,dur,kind):
        key=(note,round(dur,4),kind)
        if key in cache:return cache[key]
        t=np.arange(round(dur*SR),dtype=np.float32)/SR;f=440*2**((note-69)/12)
        if kind=='pad':
            s=(np.sin(2*np.pi*f*t)+.3*np.sin(2*np.pi*f*1.002*t)+.18*np.sin(2*np.pi*f*2*t))*.52
            env=np.minimum(t/.35,1)*np.minimum((dur-t)/.6,1)
        elif kind=='bass':
            s=np.sin(2*np.pi*f*t)+.25*np.sin(4*np.pi*f*t);env=(1-np.exp(-t*120))*np.exp(-t*4)*np.minimum((dur-t)/.04,1)
        elif kind=='bell':
            s=np.sin(2*np.pi*f*t)+.28*np.sin(2*np.pi*f*2*t)*np.exp(-t*3)+.1*np.sin(2*np.pi*f*3*t)*np.exp(-t*7)
            env=(1-np.exp(-t*200))*np.exp(-t*2.8)*np.minimum((dur-t)/.05,1)
        else:
            s=np.sin(2*np.pi*f*t)+.2*np.sin(2*np.pi*f*2*t);env=(1-np.exp(-t*85))*np.exp(-t*5)*np.minimum((dur-t)/.04,1)
        cache[key]=(s*env).astype(np.float32);return cache[key]
    def note(p,at,dur,amp,pan=0,kind='bell'):add(tone(p,dur,kind),at,amp,pan)
    def drum(kind,at,amp):
        dur={'kick':.32,'clap':.16,'hat':.07,'crash':1.4}[kind];t=np.arange(round(dur*SR))/SR
        noise=rng.normal(0,.55,len(t));high=noise-np.convolve(noise,np.ones(8)/8,'same')
        if kind=='kick':s=np.sin(2*np.pi*(49*t+2.8*(1-np.exp(-t*35))))*np.exp(-t*13)
        elif kind=='clap':s=high*np.exp(-t*30)*.55+np.sin(2*np.pi*180*t)*np.exp(-t*34)*.12
        elif kind=='hat':s=high*np.exp(-t*62)*.24
        else:s=high*np.exp(-t*3)*.22
        add(s,at,amp,.2 if kind=='hat' else 0,drums)
    # Original instrumental themes: 48 bars, with intro / opening / interlude / finale.
    motifs=[[7,11,14,11,4,7,2,0],[0,7,10,14,10,7,3,7],[14,10,7,3,7,10,0,3]]
    for b in range(48):
        root=roots[(b//2)%4];minor=idx>0
        chord=[root,root+(3 if minor else 4),root+7,root+10 if minor else root+11]
        energetic=(8<=b<28 or 36<=b<47);amp=.075 if energetic else .055
        for j,p in enumerate(chord):note(p,b*bar,bar*1.04,amp,(j-1.5)/2,'pad')
        if b>=4:
            for k in range(4):
                note(root-12,b*bar+k*beat,beat*.8,.18 if energetic else .09,0,'bass')
                if energetic or (idx==0 and b>=8):drum('kick',b*bar+k*beat,.42 if idx==1 else .29)
                elif b>=4 and k%2==0:drum('kick',b*bar+k*beat,.2)
                if k%2==1 and energetic:drum('clap',b*bar+k*beat,.26)
                if b>=8:drum('hat',b*bar+(k+.5)*beat,.22 if energetic else .12)
        if b>=8:
            for k in range(8 if energetic else 4):
                p=chord[(k+b//4)%4]+12
                note(p,b*bar+k*beat*(.5 if energetic else 1),beat*.85,.065,math.sin(k*1.7)*.65,'pluck')
        if b>=2:
            for k in range(4):
                offset=motifs[idx][(k+(b%2)*4)%8]
                note(root+12+offset,b*bar+k*beat,beat*1.5,.13 if energetic else .10,math.sin(b+k)*.3)
        if b in [8,16,24,36,40,44]:drum('crash',b*bar,.42)
        if b in [7,35,43]:
            t=np.arange(round(bar*SR))/SR;s=rng.normal(0,.12,len(t))*(t/bar)**2
            add(s,b*bar,.17)
    # Stereo tempo delay, subtle room reflections, sidechain, fade and headroom.
    dry=music.copy()
    for delay,gain in [(beat*.75,.17),(beat*1.5,.09),(.067,.05),(.127,.04)]:
        d=round(delay*SR);music[d:,0]+=dry[:-d,1]*gain;music[d:,1]+=dry[:-d,0]*gain
    t=np.arange(n)/SR;duck=1-.20*np.exp(-np.mod(t,beat)*20)
    mix=music*duck[:,None]+drums
    mix=np.tanh(mix*1.3);mix*=.88/max(.01,float(np.max(np.abs(mix))))
    fade=np.minimum(t/1.5,1)*np.minimum((duration-t)/3.5,1);mix*=fade[:,None]
    wav=OUT/track['audioWav']
    with wave.open(str(wav),'wb') as f:f.setnchannels(2);f.setsampwidth(2);f.setframerate(SR);f.writeframes((mix*32767).astype('<i2').tobytes())
    subprocess.run(['ffmpeg','-y','-loglevel','error','-i',str(wav),'-c:a','libmp3lame','-b:a','160k',str(target)],check=True)
    print(json.dumps(dict(track=tid,duration=duration,peak=float(np.max(np.abs(mix))),rms=float(np.sqrt(np.mean(mix**2))))),flush=True)
data=dict(schema='lightman/joker-plaza-shows/v1',tracks=tracks,musicCredit='Tres composiciones instrumentales originales sintetizadas para Jockey Plaza. Sin grabaciones, samples ni voces de terceros.')
(OUT/'tracks.json').write_text(json.dumps(data,ensure_ascii=False,indent=2),encoding='utf-8')
(OUT/'tracks-data.js').write_text('window.TRACKS='+json.dumps(data,ensure_ascii=False)+';',encoding='utf-8')

print('Project assets ready:',OUT,flush=True)

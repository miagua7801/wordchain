"""홈 화면 아이콘 만들기: python tools/make-icon.py → icons/icon-180.png, icon-192.png, icon-512.png
청록 바탕에 글자 블록 두 개가 이어진 모양(흰 'E' → 주황 'E', 끝말잇기)."""
from PIL import Image, ImageDraw, ImageFont
S=1024
img=Image.new('RGB',(S,S),'#0f6e7a'); d=ImageDraw.Draw(img)
f=ImageFont.truetype('C:/Windows/Fonts/arialbd.ttf',400)
def tile(x,y,w,fill,ink,ch,rot):
    t=Image.new('RGBA',(w,w),(0,0,0,0)); td=ImageDraw.Draw(t)
    td.rounded_rectangle((0,0,w-1,w-1),radius=w//5,fill=fill)
    td.text((w/2,w/2+8),ch,font=f,fill=ink,anchor='mm')
    t=t.rotate(rot,resample=Image.BICUBIC,expand=True)
    sh=Image.new('RGBA',t.size,(0,0,0,0)); sh.paste((0,0,0,70),mask=t.split()[3]); 
    img.paste(sh,(x+10,y+18),sh); img.paste(t,(x,y),t)
tile(150,230,430,'#ffffff','#17323f','E',6)
tile(440,400,430,'#e9a23b','#2a1a00','E',-6)
for n in (180,192,512): img.resize((n,n),Image.LANCZOS).save(f'icons/icon-{n}.png')
print('icons/ done')

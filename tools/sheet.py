import sys,pathlib
from PIL import Image
D=pathlib.Path(__file__).resolve().parent.parent/'shots'
tag,cols,scale,out=sys.argv[1],int(sys.argv[2]),float(sys.argv[3]),sys.argv[4]
names=sys.argv[5:]
ims=[Image.open(D/f'{tag}-{n}.png') for n in names]
w,h=int(ims[0].width*scale),int(ims[0].height*scale)
rows=(len(ims)+cols-1)//cols
S=Image.new('RGB',(cols*w+(cols-1)*8,rows*h+(rows-1)*8),'white')
for i,im in enumerate(ims):
    S.paste(im.resize((w,h)),((i%cols)*(w+8),(i//cols)*(h+8)))
S.save(D/out);print(D/out,S.size)

import re,matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib import font_manager as fm
from matplotlib.patches import FancyBboxPatch,FancyArrowPatch
from matplotlib.path import Path
import matplotlib.patches as mp
for f in ["NotoSansSC-Regular.otf","NotoSansSC-Bold.otf"]: fm.fontManager.addfont("/workspace/work/vmrt/fonts/"+f)
plt.rcParams["font.family"]="Noto Sans SC"
exec(open("gen.py").read().split("L=[")[0])  # mods, E
names={k:v.replace("<br>","\n") for m,ns in mods.items() for k,v in ns}
modof={k:m for m,ns in mods.items() for k,_ in ns}
order={"C":["C1","C2","C3","C4","C5","C7","C6","C8","C9","C10","C11"],
"B":["B3","B1","B2","B4","B5","B6","B7","B8","B9","B10","B11","B12","B13"],
"A":["A1","A2","A3","A4","A5","A7","A6","A8","A11","A12","A10","A9","A13","A14","A16","A17","A15","A18","A19","A20","A21"],
"E":["E1","E2","E3","E4","E5","E6","E8","E7","E9","E10"],
"D":["D1","D2","D5","D3","D4","D6","D7","D8","D9","D10"]}
lanes=["C","B","A","E","D"]
col={"A":("#e8f1fb","#2b5c8a"),"B":("#fdeee6","#b5562b"),"C":("#eaf6ec","#2f7a45"),"D":("#fbf6e2","#9a7b1c"),"E":("#f1ebfa","#6a46a0")}
title={"A":"必修1 分子与细胞","B":"必修2 遗传与进化","C":"选必1 稳态与调节","D":"选必2 生物与环境","E":"选必3 生物技术与工程"}
LX=11.0; BW=3.6; BH=1.05; TOP=0; H=21*2.0
pos={}
for li,l in enumerate(lanes):
    ns=order[l]; n=len(ns)
    for i,k in enumerate(ns):
        y=-(i+0.5)*H/n
        pos[k]=(li*LX,y)
W=4*LX
fig_h=H+4+16
fig=plt.figure(figsize=((W+11)/2.0,fig_h/2.0),dpi=110)
ax=fig.add_axes([0,0,1,1]); ax.set_xlim(-6,W+5); ax.set_ylim(-H-17.5,3.5); ax.axis("off")
fig.patch.set_facecolor("#faf8f2")
ax.text(W/2,2.6,"高中生物 知识点关联图（五本书一张图）",ha="center",va="center",fontsize=34,weight="bold",color="#1d2b44")
ax.text(W/2,1.5,"实线 = 同一本书里的联系　　彩色虚线 + 编号 = 跨书联系（编号含义见底部清单，综合大题最爱考这些）",ha="center",fontsize=17,color="#555")
for li,l in enumerate(lanes):
    x=li*LX
    ax.add_patch(FancyBboxPatch((x-BW/2-0.6,-H-0.3),BW+1.2,H+0.5,boxstyle="round,pad=0.1,rounding_size=0.5",fc=col[l][0],ec="none",alpha=0.45,zorder=0))
    ax.text(x,0.55,title[l],ha="center",fontsize=21,weight="bold",color=col[l][1])
# edges
cross=[];inner=[]
for a,b,t in E:
    (cross if modof[a]!=modof[b] else inner).append((a,b,t))
lanekey=lambda k:k[0]
def bez(p0,p1,p2,p3,**kw):
    return mp.PathPatch(Path([p0,p1,p2,p3],[Path.MOVETO,Path.CURVE4,Path.CURVE4,Path.CURVE4]),fill=False,**kw)
def pt(p0,p1,p2,p3,t):
    import numpy as np
    return tuple((1-t)**3*np.array(p0)+3*(1-t)**2*t*np.array(p1)+3*(1-t)*t**2*np.array(p2)+t**3*np.array(p3))
# inner
side_toggle={}
for a,b,t in inner:
    xa,ya=pos[a]; xb,yb=pos[b]; l=lanekey(a)
    ia,ib=order[l].index(a),order[l].index(b)
    c=col[l][1]
    if abs(ia-ib)==1:
        y0,y1=(ya-BH/2,yb+BH/2) if ya>yb else (ya+BH/2,yb-BH/2)
        ax.add_patch(FancyArrowPatch((xa,y0),(xb,y1),arrowstyle="-|>",mutation_scale=16,color=c,lw=1.6,zorder=2))
        if t: ax.text(xa+0.12,(y0+y1)/2,t,fontsize=10.5,color=c,va="center",ha="left",zorder=5,bbox=dict(fc="#ffffffcc",ec="none",pad=0.5))
    else:
        s=side_toggle.get(l,1); side_toggle[l]=-s
        dx=BW/2; bulge=0.9+0.35*abs(ia-ib)
        p0=(xa+s*dx,ya); p3=(xb+s*dx,yb)
        p1=(xa+s*(dx+bulge),ya); p2=(xb+s*(dx+bulge),yb)
        ax.add_patch(bez(p0,p1,p2,p3,ec=c,lw=1.5,zorder=2))
        ax.add_patch(FancyArrowPatch(pt(p0,p1,p2,p3,0.93),p3,arrowstyle="-|>",mutation_scale=14,color=c,lw=1.5,zorder=2))
        if t:
            mx,my=pt(p0,p1,p2,p3,0.5)
            ax.text(mx,my,t,fontsize=10.5,color=c,ha="center",va="center",zorder=5,bbox=dict(fc="#ffffffdd",ec="none",pad=0.5))
# cross
circ="①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮⑯⑰⑱⑲⑳"
import numpy as np
lines=[]
for n,(a,b,t) in enumerate(cross,1):
    xa,ya=pos[a]; xb,yb=pos[b]; c=col[lanekey(a)][1]
    s=1 if xb>xa else -1
    p0=(xa+s*BW/2,ya); p3=(xb-s*BW/2,yb)
    d=abs(xb-xa)
    p1=(p0[0]+s*d*0.35,ya); p2=(p3[0]-s*d*0.35,yb)
    ax.add_patch(bez(p0,p1,p2,p3,ec=c,lw=1.7,ls=(0,(5,3)),alpha=0.75,zorder=1))
    ax.add_patch(FancyArrowPatch(pt(p0,p1,p2,p3,0.96),p3,arrowstyle="-|>",mutation_scale=15,color=c,lw=1.5,zorder=3))
    tt=(0.35+0.3*(n%2)) if d<=LX else (0.18+0.08*(n%3))
    mx,my=pt(p0,p1,p2,p3,tt)
    ax.text(mx,my,str(n),fontsize=11,weight="bold",color="white",ha="center",va="center",zorder=6,bbox=dict(boxstyle="circle,pad=0.25",fc=c,ec="white",lw=1))
    lines.append((n,a,b,t,c))
# nodes
for k,(x,y) in pos.items():
    l=lanekey(k)
    ax.add_patch(FancyBboxPatch((x-BW/2,y-BH/2),BW,BH,boxstyle="round,pad=0.02,rounding_size=0.2",fc="white",ec=col[l][1],lw=2,zorder=4))
    ax.text(x,y,names[k],ha="center",va="center",fontsize=14,color="#1d2b44",zorder=7,linespacing=1.15)
# legend list
y0=-H-1.6
ax.text(-3.5,y0,"跨书联系清单（编号对应图中彩色圆圈；箭头方向 = 前面的知识是后面的基础）",fontsize=19,weight="bold",color="#1d2b44",va="top")
ncol=3; per=(len(lines)+ncol-1)//ncol
for i,(n,a,b,t,c) in enumerate(lines):
    cx=-3.5+(i//per)*(W+7)/ncol; cy=y0-1.3-(i%per)*1.12
    ax.text(cx,cy,str(n),fontsize=11,weight="bold",color="white",ha="center",va="center",bbox=dict(boxstyle="circle,pad=0.25",fc=c,ec="none"))
    ax.text(cx+0.6,cy,f"{names[a].replace(chr(10),'')} → {names[b].replace(chr(10),'')}：{t}",fontsize=13.5,va="center",color="#222")
fig.savefig("06-生物知识点关联图.png",facecolor=fig.get_facecolor())
print(len(cross),len(inner))

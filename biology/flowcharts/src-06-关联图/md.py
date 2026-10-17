exec(open("gen.py").read().split("L=[")[0])
names={k:v.replace("<br>"," ") for m,ns in mods.items() for k,v in ns}
modof={k:m for m,ns in mods.items() for k,_ in ns}
short={m:m.split()[0] for m in mods}
cross=[(a,b,t) for a,b,t in E if modof[a]!=modof[b]]
num={(a,b):i for i,(a,b,t) in enumerate(cross,1)}
def ref(k,here): 
    return f"**{names[k]}**" + ("" if modof[k]==here else f"（{short[modof[k]]}）")
o=["# 高中生物 知识点关联图（Markdown 版）","",
"> 和图片版内容完全一样：五本书 65 个知识点、103 条联系（其中 37 条跨书，标 🔗 和编号，编号与图片里的彩色圆圈一致）。",
"> 读法：**⬅ 要先懂** = 学这个点之前要会的；**➡ 会用到** = 这个点后面会在哪里再出现。","",
"![知识点关联图](../flowcharts/06-生物知识点关联图.png)","","## 目录"]
for i,m in enumerate(mods,1): o.append(f"{i}. [{m}](#{i}-{m.replace(' ','-')})")
o.append("")
for i,(m,ns) in enumerate(mods.items(),1):
    o+= [f"## {i}. {m}",""]
    for k,_ in ns:
        ins=[(a,t) for a,b,t in E if b==k]; outs=[(b,t) for a,b,t in E if a==k]
        o.append(f"### {names[k]}")
        if not ins and not outs: o.append("- （独立知识点）")
        for a,t in ins:
            tag=f" 🔗{num[(a,k)]}" if modof[a]!=m else ""
            o.append(f"- ⬅ 要先懂 {ref(a,m)}{('：'+t) if t else ''}{tag}")
        for b,t in outs:
            tag=f" 🔗{num[(k,b)]}" if modof[b]!=m else ""
            o.append(f"- ➡ 会用到 {ref(b,m)}{('：'+t) if t else ''}{tag}")
        o.append("")
o+=["## 跨书联系速查（37 条）","","| 编号 | 从 | → 到 | 怎么联系 |","|---|---|---|---|"]
for (a,b,t) in cross:
    o.append(f"| {num[(a,b)]} | {names[a]}（{short[modof[a]]}） | {names[b]}（{short[modof[b]]}） | {t} |")
o+=["","## 树状总览（按书 → 知识点 → 指向）","","```text"]
for m,ns in mods.items():
    o.append(m)
    for j,(k,_) in enumerate(ns):
        last=j==len(ns)-1; o.append(("└── " if last else "├── ")+names[k])
        outs=[(b,t) for a,b,t in E if a==k]
        for q,(b,t) in enumerate(outs):
            pre=("    " if last else "│   ")+("└─▶ " if q==len(outs)-1 else "├─▶ ")
            o.append(pre+names[b]+("" if modof[b]==m else f"〔{short[modof[b]]}〕")+(f"  ({t})" if t else ""))
    o.append("")
o.append("```")
open("06-生物知识点关联图.md","w").write("\n".join(o)+"\n")
print(len(o))

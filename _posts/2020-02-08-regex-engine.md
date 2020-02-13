---
layout: postmal
title:  "റെഗുലർ എക്സ്പ്രെഷൻ എൻജിൻ നിർമിക്കാം"
date:   2020-02-08
description: "റെഗുലർ എക്സ്പ്രെഷൻ എൻജിൻ നിർമിക്കാം"
categories: malcom

tags:
  - മലയാളം
  - പ്രോഗ്രാമിംഗ്
---

പ്രോഗ്രാമിംഗിലെ അവിഭാജ്യ ഘടകമാണ് റെഗുലർ എക്സ്പ്രെഷൻ. പാറ്റേൺ സെർച്ചിംഗ്, ഇൻപുട് വാലിഡേഷൻ
തുടങ്ങി ഒരുപാട് കാര്യങ്ങള്‍ റെഗുലർ എക്സ്പ്രെഷൻ ഉപയോഗിച്ച് എളുപ്പത്തില്‍ ചെയ്യാൻ കഴിയുന്നു.

{% include figure.html
    src="https://imgs.xkcd.com/comics/regular_expressions.png"
    title="XKCD Comic"
    caption="XKCD Comic"
%}

## പ്രവർത്തന തത്വം
[ഫൈനൈറ്റ് സ്റ്റേറ്റ് മെഷീൻ](https://en.wikipedia.org/wiki/Finite-state_machine) ആണ്
റെഗുലർ എക്സ്പ്രെഷൻ എൻജിൻറെ അടിസ്ഥാനമെന്ന് പറയാം. ഇൻപുടിനനുസരിച്ച് ഒരു അവസ്ഥയില്‍ നിന്ന്
മറ്റൊന്നിലേക്ക് മാറുന്ന ഒരു നിശ്ചിത എണ്ണം അവസ്ഥകളുള്ള (States) അബ്സ്ട്രാക്റ്റ് മെഷീനാണ് FSM.

{% include figure.html
    src="simple-state-machine.webp"
    title="ഫൈനൈറ്റ് സ്റ്റേറ്റ് മെഷീൻ"
    caption="ഫൈനൈറ്റ് സ്റ്റേറ്റ് മെഷീൻ"
%}




#### അവലംബം
1. [wikipedia.org](https://ml.wikipedia.org)

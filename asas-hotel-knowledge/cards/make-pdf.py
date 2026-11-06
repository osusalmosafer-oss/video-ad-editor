import json,os
from PIL import Image
d=os.path.dirname(os.path.abspath(__file__))
idx=json.load(open(os.path.join(d,'hotels-index.json'),encoding='utf-8'))
pages=[Image.open(os.path.join(d,h['image'] or f"card-{h['slug']}.png")).convert('RGB') for h in idx]
pages[0].save(os.path.join(d,'hotels-all.pdf'),save_all=True,append_images=pages[1:],resolution=100)
print(len(pages),'pages')

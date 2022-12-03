---
layout: home
limit: 10
show_excerpts: true
entries_layout: list
redirect_from:
  - /Ryan-DowlingSoka-808f52788ead40478ca3030376d135c8
---

# Hello there!

I'm Ryan a technical artist whose been around here for a while. I'm mostly here to help others, and try to make some great games at the same time.

If you've found me for work reasons my [resume](./resume/) is right up there.

If you've found me to learn about some stuff see below!

---
# Tools

{% include bookmark.html
    url="https://www.unrealengine.com/marketplace/en-US/product/get-relief-rcsm-generator"
    author="Ryan DowlingSoka | Unreal Engine Marketplace"
    image="/assets/images/bookmarks/193113816-fd32e625-baa5-4cf6-be1f-3610d36b22dd.jpg"
    title="\"Get Relief!\" a Relaxed Cone Step Map Generator"
    description="Convert any flat texture to one with depth, all you need is a heightmap, the tool will take care of the rest." %}

{% include bookmark.html
    url="https://github.com/Ryan-DowlingSoka/RedTechArtTools"
    author="Ryan DowlingSoka | Github"
    image="/assets/images/bookmarks/mph.activate_plugin.png"
    title="Red Tech Art Tools"
    description="A variety of useful tools for tech-art in Unreal Engine. Shared with the MIT license." %}

<br/>

---
# Unreal Engine

I also post a lot about Unreal Engine specific topics, which you can find here:

{% capture unreal_items %}
  {% include documents-collection.html collection='unreal' sort_order='reverse' sort_by = 'date' %}
{% endcapture %}

{% include colcade-grid.html items = unreal_items %}
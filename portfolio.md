---
title: Portfolio
layout: page
permalink: /portfolio/
collection: portfolio
sort_order: reverse
sort_by: date
show_excerpts: false
show_date: false
redirect_from:
  - /f6b8bc56f2884b91a3675343cea11e50
---

A collection of professional work, not exhaustive, but this is some of the stuff I've done.

{% capture items %}
  {% include documents-collection.html collection='portfolio' sort_order='reverse' sort_by = 'date' %}
{% endcapture %}

{% include colcade-grid.html items = items %}
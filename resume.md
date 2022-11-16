---
layout: page
title:  "Resume"
date:   2022-11-10 21:34:51 -0800
categories: about
---

<div style="display:flex;flex-wrap:wrap;align-items: center;" markdown="1">

<div markdown="1" style="
    flex: 1 1 35em;
">

> Experienced Technical Artist with a demonstrated history of working in the AAA video game industry. Skilled in Unreal Engine 4, Unity, Houdini, C#, C++, Python, and HLSL/GLSL. Strong arts and design professional, focused on engine tooling, rendering techniques, material and shader work, and procedural content.  

</div>

<div markdown="1" style="
    flex: 0 0 15em;
    padding: 0 0em 0 1em;
">

{% include socials.md %}

</div>

</div>

<hr/>

## 🎮 Games

<div style="display:flex; flex-wrap:wrap" markdown="1">

{%- for game in site.data.resume.games -%}

<div markdown="1" class="flex-resume-games">

![{{game.title}}](../images/resume/{{game.image}}){: .align-left}

### {{game.title}}
{: .no-margin}

<p>{{game.role}}<br/><span class="faded-text-color">{{game.studio}}</span></p>

</div>
{%- endfor -%}

</div>

<hr/>

## 👩🏻‍💻 Work Experience

<div style="display:flex; flex-direction:column" markdown="1">

{%- for job in site.data.resume.jobs -%}

### {{job.title}}
{: .no-margin}

<p><span class="faded-text-color"> {{job.studio}}
<i>{{job.location}}, {{job.dates}}</i> </span> <br/>
{{job.description}}
</p>

{%- endfor -%}

</div>

<hr/>

## 📚 Education

### Bachelor of Fine Art in Visual Effects
{: .no-margin}

<p><span class="faded-text-color"> 2008-2012 </span> <br/> Savannah College of Art and Design </p>

<hr/>

## 🤹‍♀️ Expertise

Unreal Engine, Unity, Frostbite, Houdini, Substance Designer, HLSL/GLSL, C++, C#, Photography, World Building, Game Design, Python, Material Networks, Shaders, Pipeline Tools
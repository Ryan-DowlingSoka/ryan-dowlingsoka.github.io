---
title: "Gears 5: Volumetric Ice Lighting"
date: 2022-01-25
image:
  responsive: true
  path: "/portfolio/gears-5-ice-shaders/ryan-dowlingsoka-ryandow-volumetric-interiorlighting.jpg"
  #header: "/portfolio/gears-5-ice-shaders/ryan-dowlingsoka-ryandow-volumetric-interiorlighting.jpg"
  thumbnail: "/portfolio/gears-5-ice-shaders/ryan-dowlingsoka-ryandow-volumetric-interiorlighting.jpg"
redirect_from:
  - /Gears-5-Ice-Shader-Volumetric-Lighting-3cfe2186f2e3485988f5b8d3e5fae196
---
{% include image.html url="./ryan-dowlingsoka-loop-2-volumetric-interior-lighting-aep-6.gif" alt="Ice shader with volumetric lighting" responsive=false class="align-center" %}

{% include video.html url="./ryandow-volumetric-interiorlighting.(2160p).mp4" %}{:. align-center}

{% include video.html url="./ryandow-volumetric-interiorlighting_demo.(2160p).mp4" %}{:. align-center}

Considering some levels were completely covered in ice and the high performance requirements of Gears 5, the ice could not be translucent, nor use subsurface scattering. This made creating a believable interpretation of ice a challenge.

To solve the challenge, I modified our base shaders to allow the material graph to sample the volumetric lightmaps that are typically used to light dynamic objects. Our team would then sample the lighting a second time at some distance behind the surface to simulate transmittance.

Our incredible lighting team would then add point lights throughout the level that would bake into our volumetric lightmaps to simulate light transmittance through the ice.

I was responsible for the lighting technique, parallax features, and material optimizations.

Material work, modelling, and texturing:  
[Stef Velzeboer](https://www.artstation.com/stefvelzeboer)  
[Kurt Kupser](https://www.artstation.com/virtualvagabond)  
[Clinton Crumpler](https://www.artstation.com/ccrumpler)  
[Akio Kimoto](https://www.artstation.com/kimoto)
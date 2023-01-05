---
title: "Custom Wireframe Material using Geometry Scripting for Barycentric UVs"
date: 2022-08-26
image:
  responsive: true
  path: "/unreal/wireframe-barycentric-coords/barycentric-header.png"
  #header: "/unreal/wireframe-barycentric-coords/barycentric-header.png"
  thumbnail: "/unreal/wireframe-barycentric-coords/barycentric-header.png"
redirect_from:
  - /Custom-Wireframe-Material-using-Geometry-Scripting-for-Barycentric-UVs-6ef76c1949a84e1193ebabad535b4089
---

> Learn how to create a wireframe shader using barycentric coordinates and geometry scripting.

{% include video.html video="./wireframe_tool.mp4" %}{: .align-center}

So you want to make a fancy wireframe material so you do some internet searching. Maybe you come across Cat Like Coding’s excellent tutorial on the subject for unity:

{% include bookmark.html
    url="https://catlikecoding.com/unity/tutorials/advanced-rendering/flat-and-wireframe-shading/"
    author="Cat Like Coding"
    image="/assets/images/bookmarks/tutorial-image.jpg"
    icon="https://catlikecoding.com/catlike-coding-logo.svg"
    title="Flat and Wireframe Shading"
    description="This tutorial covers how to add support for flat shading and showing the wireframe of a mesh. It uses advanced rendering techniques and assumes you're familiar with the material covered in the Rendering series." %}{: .align-center}


But you aren’t using Unity, you are using Unreal, and at the time of this post, we don’t have access to geometry shaders easily.

Luckily we recently have a new(ish) tool that is almost as good. **Geometry Scripting.**

The crux of Cat Like Coding’s tutorial is that we need to get the **[Barycentric Coordinates](https://en.wikipedia.org/wiki/Barycentric_coordinate_system)** for each triangle into the pixel shader. Just like them, we are going to put these into a texture coordinate. Unlike them, we are going to make a tool to do this in the editor instead of having a geometry shader do it at runtime.

You could go do the same thing in your content tool, like Maya or Blender, but that isn’t fun. What is fun is doing it in the editor in a right-click menu.

Learn how to make your own below, or get my version from my [github](https://github.com/Ryan-DowlingSoka/RedTechArtTools).

## Create an Asset Action

First you need to create an asset action, make sure it is an Editor Utility Blueprint by creating it through the submenu.

{% include image.html url="./Untitled.png" alt="Untitled" link="./Untitled.png" %}{: .align-center}
Override the GetSupportedClass function and set it to only return StaticMesh.

We are going to make two new functions. The exposed function **Add Barycentric UVs**, and an internal function **AddBarycentricUVs_Internal.**

## Add Barycentric UVs

This function will be exposed to the right-click menu on static meshes, so give it a good description. Because we want the user to be able to change which UV Set the barycentric uvs will be added to, make sure you also add an integer input value named **Target UV Set.**

{% include image.html url="./Untitled%201.png" alt="Untitled" link="./Untitled%201.png" %}{: .align-center}
The function itself is pretty simple, it simply gets the selected assets, loops over them and gets all the Static Mesh assets in the selection set, and calls the internal function on them.

{% include image.html url="./Untitled%202.png" alt="Untitled" link="./Untitled%202.png" %}{: .align-center}  
[Add Barycentric UVs \| Click here to get this graph.](https://dev.epicgames.com/community/snippets/gxK/unreal-engine-add-barycentric-uvs)

## AddBarycentricUVs_Internal

This function does all the heavy lifting. But the premise is pretty straight forward.

- For each LOD of the selected mesh:
    - Copy the LOD into a Dynamic Mesh.
    - Iterate over all the triangles in the Dynamic Mesh
    - Set Each Triangle to have UVs of (0,0),(1,0),(0,1) [Order doesn’t matter for this.]
    - Copy the Dynamic Mesh back into the LOD of the selected mesh.

{% include image.html url="./Untitled%203.png" alt="Untitled" link="./Untitled%203.png" %}  
Get the number of LODS, loop from 0 to 1-Number of Lods.

{% include image.html url="./Untitled%204.png" alt="Untitled" link="./Untitled%204.png" %}  
Request Dynamic Mesh from the Dynamic Mesh Pool.
Copy the LOD from the Static Mesh into the Dynamic Mesh.
If the number of UVs is less than or equal to the target UV number then add a new UV set.

{% include image.html url="./Untitled%205.png" alt="Untitled" link="./Untitled%205.png" %}  
Get all the triangles in a triangle UV Set, store the (Length of the list -1) for another ForLoop.
For each ID: If the ID is valid, set the UVs to (1,0) (0,1) (0,0).
Once done, copy the dynamic mesh back into the static mesh.  
[AddBarycentricUVs_Internal \| Click here to get this graph.](https://dev.epicgames.com/community/snippets/D4B/unreal-engine-addbarycentricuvs_internal)

## Custom Wireframe Material

To use these UVs to create a custom wireframe material, you have to understand the basics of Barycentric coordinates. In the simplest terms, the coordinates tell you how far you are from each vertex as a percentage. These coordinates always add up to one, so while we only have two of the coordinates interpolated into our UVs, we can find the third by doing `1.0 - X - Y`

Once we have that, we can use `smoothstep` to remap these coordinates into a sharp wireframe.

Below is the material graph, and a transcription into HLSL which may be more readable to some.

{% include image.html url="./Untitled%206.png" alt="Untitled" link="./Untitled%206.png" %}{: .align-center}

```hlsl
float LINE_THICKNESS = 2.0;
float MIN_THICKNESS = 0.05;
float3 baryCoords = float3(TexCoord[2], (1.0 - TexCoord[2].R - TexCoord[2].G)) ;
float baryCoordsMin = min(baryCoords.R, baryCoords.G, baryCoords.B);
float mask = min(fwidth(baryCoordsMin), MIN_THICKNESS) * LINE_THICKNESS;
float mask_min = mask * 2.0;
float emissive_color = smoothstep(mask_min, mask, baryCoordsMin);
```  
[M_BarycentricCoordWireframe \| Click here to get this graph.](https://dev.epicgames.com/community/snippets/0GE/unreal-engine-m_barycentriccoordwireframe)

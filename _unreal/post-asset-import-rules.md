---
title: "#notGDC-2023: Unreal Post Asset Import Actions"
date: 2023-03-20
---

> Three different ways to improve what happens after you import assets into your project, python, cpp, and blueprint approaches.

{% include toc %}

Something that goes a long way, especially on bigger projects, is removing uncertainty about what settings should be applied to different assets. Sometimes a global setting applied to all assets of a given type can work, but other times more nuance is needed. Typically this nuance is done with naming conditions. Unreal doesn't provide a built-in way to quickly apply *Rules* to an asset when it is imported, but it does give us everything we need to build our own such systems. In this page I go over three different approaches that mirror each other, but use different technologies and have different pros and cons. For two of those approaches I have also set up MIT Licensed code repos for you to plunder at your leisure. Lets get started.

<div style="background-image: url(/assets/images/bookmarks/repeatingbg.webp);
    background-repeat: repeat;
    background-position: center; padding:1em; border-radius: 10px">
<a href="https://notgdc.io">
<img src="/assets/images/bookmarks/notgdc-logotype.svg" style="box-shadow:none" alt="#notGDC : 2023 : march 20 - 24 : a game development non-conference for everyone!"/>
</a>
</div>
<br/>

> This post and repositories were created for the [#notGDC-2023](https://notgdc.io) non-conference there are other amazing bits of content available at the site, be sure to check it out!

## The Pattern

I've built a few of these systems before and I have a pattern I like to follow, it is a pattern where `Rules` are applied to a particular unreal class type. Each `Rule` is made up of one or more `Queries` which are functionally tests on the imported file, and when true apply `Actions` specific settings changes, or other arbitrary logic we want run when the queries pass.

In unreal, the `UImportSubsystem` holds a few important delegates, most importantly `OnAssetPostImport`, which is a multicast delegate you can bind to in any of the three languages.

🤔 It is important to realize that `OnAssetPostImport` runs for imports and **Re**imports.
{: .notice--warning}

I like to make a manager singleton (or subsystem if in C++) that stores a dictionary of all registered rules, keyed by class type. Then that manager binds to the delegate and then fires all the rules in order.

Each rule tests the asset against its queries, optionally requiring all queries to pass or only a single query, and then applies all of its associated actions.

### What about reimports⁉

Unreal unfortunately doesn't have a global state for whether a current import was a reimport or not. Each `factory` implements its own logic to detect this eventuality. So it can be difficult to mirror all that logic. This is mostly because each single source file might produce one or more `.uasset` files in unreal. 🙀

The Interchange plugin which is aiming to replace the default unreal implementation for all asset importing and exporting has an interface to determine if we are dealing with a reimport or not, but if you aren't using the plugin then you have to roll your own solution.

My tendency is to use a simple, if not foolproof, solution of setting an `Asset Metadata Tag` on the asset saying it has had the import rules applied already. If that asset has that metadata already, then we know it is a reimport and can choose to run our rules or not.

## Python, C++, or Blueprints?

Unreal provides us multiple ways to build systems, so if you are interested in building a pipeline for manipulating recently imported assets you first have to decide which framework you want to use. Each framework has different benefits and drawbacks and it is important to realize you aren't necessarily limited to just one.

There are three big options though, Python, C++, and Blueprints. You have everything you need to build an import manipulation pipeline in any of them.

Let's quickly cover some of the benefits and difficulties with each.

### Python

When building an import pipeline with python you have available to you everything that blueprint has, plus some additions, and the wealth of all of pythons key features.

An example configuration might look something like this:

```python
from ImporterRules import *
import unreal

importer_rules_manager.register_rules(
    class_type = unreal.Texture2D,
    rules = [
        # The first rule is simple, it takes any textures ending with _n and applies the flip_green_channel property as false.
        # You might do something like this if you want to switch from DirectX to OpenGL normals.
        # There is only one rule, so the requires_all parameter is irrelevant.
        Rule(
            queries=[
                SourcePath(file_name_ends_with="_n"),
            ],
            actions=[SetEditorProperties(flip_green_channel=False)],
        ),        
        # This second rule shows how you can put several queries together. Because the requires_all parameter is 'False'
        # this rule will fire if ANY of the source path queries are true. So if the texture ends with _n, _o, _h, _r, _m
        # then this rule will remove the sRGB property from those textures.
        Rule(
            queries=[
                SourcePath(file_name_ends_with="_n"),
                SourcePath(file_name_ends_with="_o"),
                SourcePath(file_name_ends_with="_h"),
                SourcePath(file_name_ends_with="_r"),
                SourcePath(file_name_ends_with="_m"),
            ],
            actions=[SetEditorProperties(srgb=False)],
            requires_all=False
        ),
    ]
)
```

I've made an example (working!) github repository for a fully python solution that supports the above, you can check it out here:

{% include bookmark.html
    url="https://github.com/Ryan-DowlingSoka/UnrealImporterRules-Python"
    author="Ryan DowlingSoka"
    image="/assets/images/bookmarks/image_processing20220801-17461-1m9zilq.png"
    title="Asset Importer Rules - Python Edition"
    description="This repo is an example of how you can use python to do rules based modifications to assets post import" %}

#### Benefits of using Python

* For python trained technical artists, it might be extremely familiar working in python.
* Iteration time is quick, especially if you use a good IDE like VSCode or PyCharm [Python IDE tips here!](/unreal/python-in-unreal.html)
* Some of the easiest to use string manipulation tools.
* Keeps things out of accidentally shipping code automatically, and really lets the Tech Art team safely own these systems.

#### Disadvantages of using Python

* Although python _can_ instantiate and create unreal classes with the `@unreal.uclass` attribute, due to loading time issues this is a really poor option and is not recommended. This means you can't easily get a native UI in python, nor can you create derived blueprints for the less python-savvy team members.
* Configuration is only somewhat supported in python, there are lots of different options to handle multiple projects running different rules, but ultimately you have to roll your own system.
* No visual configuration can hide away where the work is being done in your system, creating a knowledge bottleneck around who owns the python configuration for asset importing.
* It isn't simplistic to know whether the asset is being imported for the first time or being reimported.

### C++ with Blueprints

Building your own native solution is also viable, this gives you the largest range of options on how your system works.

An example configuration might look something like this:

{% include image.html
    url="./notgdc-asset-importer-rules-editor-settings.png"
    alt="Image of the editor settings part of the Unreal Engine Project settings showing a rules file registered to the Texture2D class."
    class="align-center"
    %}

{% include image.html
    url="./notgdc-asset-importer-rules-editor-settings-example.png"
    alt="Image of a single example rule, showing a single query checking if the source name ends with _d and if so applying the Set Editor Properties action srgb = True."
    class="align-center"
    %}

This is very similar to the python version, but it is in editor and has a GUI! Here is a single query just checking if the asset's basename ends with _d and if so sets the srgb to True through a generic python function embedded in a blueprint action.

I've also built an example plugin (also working) to build this framework out!

{% include bookmark.html
    url="https://github.com/Ryan-DowlingSoka/UnrealImporterRules-CPP"
    author="Ryan DowlingSoka"
    image="/assets/images/bookmarks/image_processing20220801-17461-1m9zilq.png"
    title="Asset Importer Rules - C++ Edition"
    description="This repo is an example of how you can use C++ and Blueprints to build an post-import asset pipeline." %}

#### Benefits of using C++ and Blueprints

* C++ gives you access to the best visual configurations for your systems, it allows you to use the built in details panels and developer settings, but also opens up the possibility for details and properties customizations. With enough time and effort you can create some really great workflows for working with this system.
* By nature this will most likely feel the most natural to your users if they are familiar with unreal.
* Building in C++ with blueprints in mind means you can have the best of both worlds, your programmer types can live inside of C++ and build systemic solutions, actions, and queries for your tools while your more artistic technical artists can keep their work encapsulated nicely in a blueprints system.
* When something isn't exposed to blueprints, you already have a C++ backing to expose it.

#### Disadvantages of using C++ and Blueprints

* Not all types are available to blueprints, making some interfaces require C++ support to really create good user experiences for.
* Setting arbitrary properties is just simpler in python, so creating generic "set any editor properties" ux is challenging.
* Still not simplistic to handle the reimport/import step. Handling all cases is still a difficulty.

### Just Blueprints using the Interchange Plugin

The Interchange plugin in Unreal Engine 5.0 creates the opportunity to create fully blueprint-able pipelines for pre-import and post-import actions.

Here is how a similar configuration could look using this plugin:

{% include image.html
    url="./notgdc-asset-importer-rules-interchange-settings.png"
    alt="Image of the editor settings part of the Unreal Engine Project settings showing a interchange pipeline added to the Texture array."
    class="align-center"
    %}

{% include image.html
    url="./notgdc-asset-importer-rules-interchange-graph.png"
    link="./notgdc-asset-importer-rules-interchange-graph.png"
    alt="Image of the editor settings part of the Unreal Engine Project settings showing a rules file registered to the Texture2D class."
    caption="Click the image for the full graph."
    class="align-center"
    %}

The Interchange system lets you add pre and post blueprint steps to any import type, so configuring a naming convention means handling that blueprint logic in the event graph of a new pipeline class.

I have not made a working example for the interchange system as it doesn't match my preferences, but hopefully the above screenshots will give you an idea on where and how to start.

#### Benefits of using the Interchange Plugin and Blueprints

* The interchange plugin lets you customize the Import dialog of different file types, hiding or disabling options you don't want set, or lets you change defaults.
* The interchange plugins blueprint pipeline interface has done the hard work of determining if you are reimporting an asset or not, and as such it is trivial to branch behaviors if so.
* Because of the design pattern where Pre-Import and Post-Import are handled together, it is easy to do certain reimport style behaviors, such as maintaining information from before the reimport and re-applying it to the result.
* The interchange plugin seems to be a focus of Epic, so it likely will benefit from other improvements overtime.

#### Disadvantages of using the Interchange Plugin and Blueprints

* The interchange plugin currently expects a series of pipelines applied to different import types. It has no additional built in 'queries' or 'rules' that determine which pipelines are run other than import type. You can build your own system but it likely will need to be done inline in the blueprints, and likely be bespoke.  
  
   To elaborate this likely means reimplementing search criteria like "file path ends with" multiple times in different blueprints, or at the very least means you are hard coding search patterns into the graph.  

   You could build up a hierarchy of blueprint pipeline classes but it won't have the cleanliness of a purely data driven design.
* Little documentation and the data you might want access too can be heavily nested.
* Blueprints have trouble accessing all data types, and so somethings like getting the Import Asset Data can be difficult to get to purely in blueprints.

### Why not all three?

I mean, sure. You can use all three together. There is a world where you trigger off of the Interchange Plugin and through a blueprint interface a completely data driven design that can call blueprints, C++, or python code. But maintaining such a system might be a challenge.

In the end I think my tendency will be to lean towards the python, with a potential c++ backing when necessary, but any of the options are strong ones and you should lean in to your teams strengths whenever possible.

Here are the links to the example repositories again, and notGDC!

* [https://github.com/Ryan-DowlingSoka/UnrealImporterRules-Python](https://github.com/Ryan-DowlingSoka/UnrealImporterRules-Python)
* [https://github.com/Ryan-DowlingSoka/UnrealImporterRules-CPP](https://github.com/Ryan-DowlingSoka/UnrealImporterRules-CPP)
* [https://notgdc.io](https://notgdc.io)

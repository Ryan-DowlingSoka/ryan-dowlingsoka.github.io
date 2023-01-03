---
title: "Batch Rename Editor Widget Tutorial"
date: 2021-03-10
image:
  responsive: false
  path: "/unreal/batch-rename-tool/BatchRename_Reel.gif"
  thumbnail: "/unreal/batch-rename-tool/BatchRename_Reel.gif"
  video: "/unreal/batch-rename-tool/BatchRename_Reel.mp4"
redirect_from:
  - /Batch-Rename-Editor-Widget-Tutorial-a563eda059c9405bb3123954e036f58a
  - /Batch-Rename-Tutorial-a563eda059c9405bb3123954e036f58a
---

> Learn how to create a mass actor/asset batch rename tool using Editor Utility Widgets. 

Renaming lots of objects in unreal is a bit unwieldy. If you aren’t a scripter it can be large pain. This tool is very similar to one I built for use in production at The Coalition.

It has a few goals:

- Rename many actors or assets.
- Find/replace style renaming, useful for fixing naming issues.
- Number selections, and start from an arbitrary number point.
- Numbering can have arbitrary padding amounts (e.g. 001 vs 0001)
- Renames can be done manually in a list form, speeding up manual entry.
- Can enable or disable individual renames.
- Can undo/redo renames.

### Source Files:

[BlueprintWidgetsV01.zip](./BlueprintWidgetsV01.zip)

# Episode 1 - General Layout

{% include youtube.html aspect_ratio="1.777" video="FQO45KTKOhI" %}{: .align-center}

This episode covers the general layout of the tool, including the powerful **Details Views** and **Dynamic Entry Box**.

<blockquote markdown="1">

💡 In the above video we setup a **Details View**, which is one of the most powerful widgets in the Editor Utility Widget toolset, but one that is a bit un-intuitive.

{% include image.html url="./Untitled.png" link=true alt="Untitled" %}{: .align-center}

It works by displaying the details (same as in the world outliner for example) of any given **UObject**. But you must first assign the **UObject** in the graph. Doing so in **Preconstruct** will even show you what the details view will look like in the **Design View**.

{% include image.html url="./Untitled%201.png" link=true alt="Untitled" %}{: .align-center}

This powerful widget can be customized, to filter by category or by names of individual parameters.

It has some bugs, doesn’t work cleanly with all actor types, and has some limitations, but for quick native unreal feeling UIs there isn’t a faster and easier way to bind lots of parameters together all at once.

</blockquote>

<blockquote markdown="1">

💡 We also setup a **Dynamic Entry Box,** which is a simple way to create dynamic lists, it allows you to easily create an unknown number of entries at runtime.

It isn’t perfect though, the results aren’t virtualized, meaning that if you have hundreds of items you will likely experience framerate issues.

If you need to work with hundreds to thousands of items you should use the **List View** instead, which is a bit more of a hassle to deal with. In those cases you will need to create a widget that you add the **User Object List Entry** interface to.

{% include image.html url="./Untitled%202.png" link=true alt="Untitled" %}{: .align-center}

After adding the interface, you need to ‘massage’ the data from the model to the view, since the elements are virtualized they can’t store information about themselves directly and you must implement the **On List Item Object Set** interface event to get access to the data the item is currently showing.

{% include image.html url="./Untitled%203.png" link=true alt="Untitled" %}{: .align-center}

For many tools, this level of complexity isn’t necessary or worth it, but know your use-case. If this rename tool needs to be able to work on a world’s worth of objects at once the **Dynamic Entry Box** isn’t going to cut it, so think ahead and implement the **List View** version instead.

</blockquote>

## Episode 2 - Blueprints and Python

{% include youtube.html aspect_ratio="1.777" video="-ai64uouOkI" %}{: .align-center}

This episode covers the majority of the code behind, including the find and replace algorithm written in python.

<blockquote markdown="1">

💡 Python, **eval**, and **fstrings.**

Seasoned python writers of you out there might be throwing up the alarm bells from this episode given the use of **eval()** to handle our variable mapping in python. The reason for this is because as a shortcut I’m making use of the **fstring** features in python 3.0. These features allow converting `MyActor_{index + 10:03}` from something like `MyActor_0` to `MyActor_010`

The padding and the ability to do simple math equations is a really powerful feature, and one that I’d rather not have to re-develop so I’m piggybacking on the work done in python itself.

But to do so, I have to make a dubious decision. I need to use **eval** on the user inputted find and replace patterns.

This is dubious, because it means a bad actor could write a potentially dangerous bit of code in the find pattern and python will dutifully execute it.

You may find this too egregious of a risk, and in that case I leave redeveloping these features as an exercise for the reader. In my opinion, however, if an external attacker has access to write something dangerous in the find pattern field, then they also have access to write something dangerous in the python console in unreal. So this doesn’t seem like an increase in risk.

Still, I find it is worth the reminder: What you should **never** do is use **eval** on any user generated content that comes from the internet, and in general you should never attempt to run any bit of user generated content as code in a shipping product.

</blockquote>

For reference here is the python code used in this episode (with the *resolved_find_pattern*, fixed)

```python
import re

name = name_var
index = index_var

resolved_find_pattern = eval( "f'"+find_pattern+"'") if allow_wildcards else find_pattern
resolved_replace_pattern = eval( "f'"+replace_pattern+"'") if allow_wildcards else replace_pattern

flags = 0 if case_sensitive else re.IGNORECASE

if from_right:
    output = re.sub(
        pattern=resolved_find_pattern[::-1],
        repl=resolved_replace_pattern[::-1],
        string=source_string[::-1],
        count=count,
        flags=flags,
    )[::-1]
else:
    output = re.sub(
        pattern=resolved_find_pattern,
        repl=resolved_replace_pattern,
        string=source_string,
        count=count,
        flags=flags,
    )
```

## Episode 3 - Finishing Up & Actor Actions

{% include youtube.html aspect_ratio="1.777" video="Vw5oXF6n8hk" %}{: .align-center}

This episode covers the last bit of blueprint scripting (the actual renaming), and adds a sheen of polish to the experience. It also covers Asset Actions and Actor Actions.

<blockquote markdown="1">

💡 **Asset Actions** and **Actor Actions** don’t have to be Editor Utility Blueprints, but I recommend you make them so.

First off, this usually sets each function to be defaulted to “**Execute in Editor**” and secondly, perhaps most importantly, it gets you access to the **Editor Utility Subsystem**, which is necessary for spawning **Editor Utility Widgets**.

</blockquote>
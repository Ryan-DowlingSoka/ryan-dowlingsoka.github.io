---
title: "Python in Unreal Tips"
date: 2022-06-13
image: 
  responsive: true
  path: "/unreal/python-in-unreal/header.png"
  thumbnail: "/unreal/python-in-unreal/header.png"
---

> Make the most out of using Python in Unreal Engine. Learn how to setup Auto-Complete, do asynchronous loops, handle slow tasks and other various tips.

A big part of being efficient when making tools, is having a good workspace setup. I’ve spent a lot of time getting my python workspace *just right,* and so hopefully I can help you not have to spend so long figuring it all out.

{% include toc %}

## Setting up Unreal for Python

This is just the instructions to follow from the UDN.
I’ve embedded it here.

[https://docs.unrealengine.com/5.0/en-US/scripting-the-unreal-editor-using-python/](https://docs.unrealengine.com/5.0/en-US/scripting-the-unreal-editor-using-python/)

The important parts:

- Enable the **Python Scripting Plugin**
- Enable the **Editor Scripting Utilities Plugin**
- Restart the EditorW
- Go to **Editor Settings** and **Enable Python Developer Mode**
- Restart the Editor

## VS Code Workspace

The UDN docs are pretty good, but there are a few more things I like to do as part of my VSCode setup.

[https://docs.unrealengine.com/5.0/en-US/setting-up-autocomplete-for-unreal-editor-python-scripting/](https://docs.unrealengine.com/5.0/en-US/setting-up-autocomplete-for-unreal-editor-python-scripting/)

### Relative instead of absolute paths

The UDN docs show you can use absolute paths, but presumably you’d like to share this setup with the rest of your team. Luckily relative paths work. To calculate the correct relative path you need to go up from wherever your workspace file / settings files are located.

For example, I tend to work in plugins, and so have my vscode workspace live in the plugin folder inside of a .vscode subfolder.

```csv
E:\epic\Projects\LyraStarterGame\Plugins\RyanDowlingSoka\RedTechArtTools
```
{: .notice--code}

![Untitled](./Untitled.png)

My workspace is usually a stub, with just a path saying go up one level.

```json
E:\epic\Projects\LyraStarterGame\Plugins\RyanDowlingSoka\RedTechArtTools\.vscode\RedTechArtTools.code-workspace
{
	"folders": [
		{
			"path": ".."
		}
	]
}
```

I then store all the actual settings in the settings.json in this folder.

```json
E:\epic\Projects\LyraStarterGame\Plugins\RyanDowlingSoka\RedTechArtTools\.vscode\settings.json
{
	"python.analysis.extraPaths": ["..\\..\\..\\Intermediate\\PythonStub"],
	"python.autoComplete.extraPaths": ["..\\..\\..\\Intermediate\\PythonStub"],
	"python.defaultInterpreterPath": 
		"..\\..\\..\\..\\..\\UE_5.0\\Engine\\Binaries\\ThirdParty\\Python3\\Win64\\python.exe"
}
```

So to get to the python stub, lets compare the source path and the target paths. We need to go up one level for each folder from the ‘root’ of our workspace to the LyraStarterGame (or your project name) folder. Then we dive back down to the Intermediate\PythonStub folder.


```csv
E:\epic\Projects\LyraStarterGame\Intermediate\PythonStub
E:\epic\Projects\LyraStarterGame\Plugins\RyanDowlingSoka\RedTechArtTools
E:\epic\Projects\LyraStarterGame\	 ..\			 ..\			 ..\
```
{: .notice--code}

We do the same thing for the default interpreter path. (Note: This part is optional, but I like to be certain that I’m using the same python versions that the engine will be using.)

In my case I use the ue5.0 from the launcher, and have it sit next to my projects folder.

```csv
E:\epic\UE_5.0\Engine\Binaries\ThirdParty\Python3\Win64\python.exe
E:\epic\Projects\LyraStarterGame\Plugins\RyanDowlingSoka\RedTechArtTools
E:\epic\	  ..\			 ..\	 ..\			 ..\			..\
```
{: .notice--code}

So I need to go up five levels to get to the \epic\ folder before diving back down into the Binaries folder.

To check if you have the right paths, look at the bottom right corner of VSCode to see which python version is being used.

![Untitled](./Untitled%201.png)

To ensure you have the right path to the stub file, you can load any python file in your workspace and mouse over “import unreal” it should say (module) unreal

![Untitled](./Untitled%202.png)

### Auto Formatting with Black

I’ve become a huge proponent of auto-formatting. I’m not going to convince you, if you hate it, but my favorite python formatter is Black. It does a really good job and is customizable enough if you have particulars.

To setup black, start by adding the following to your settings or workspace file:

```json
"python.formatting.provider": "black"
```

Then go to any python file and press **Shift+Alt+F**, Black will ask to install.
 

![Untitled](./Untitled%203.png)

Each user of the vscode workspace will have to do this.

We can then setup our Black to better fit our desires. Here is my configuration (in the settings.json file) feel free to make changes based on your taste.

```json
"python.formatting.provider": "black",
	"python.formatting.blackArgs": ["--line-length", "119"],
	"[python]" : {
		"editor.defaultFormatter": null,
		"editor.insertSpaces": true,
		"editor.tabSize": 4,
		"editor.formatOnSave": true
	}
```

Now whenever I save I get that sweet sweet auto-formatted goodness. It also serves as a hint, if things don’t auto-format on save, that is a good sign I have a syntax error somewhere, since Black requires the code do its basic compile to format.

### Forcing multi-line in black.

One of the best features of black is how it handles multi-lines, it does a great job of splitting lines up really smartly. But sometimes it is nice to ensure a line be split into multiple ones even if it would technically fit within the max line length.

Luckily Black has a a really easy way to do this. Just add a trailing comma to any list and it will automatically convert it into a multi-line list.

![Untitled](./Untitled%204.png)

![Untitled](./Untitled%205.png)

### Getting the most out of Intellisense

VSCode uses Pylance, a wrapper of Pyright. This is a really good Python3 intellisense engine, fast, flexible, and really smart. Yet, as we know, python is duck typed. Variables could be anything, and could change at anytime. This makes pylance’s job incredibly hard, and so we need to give it some help so it can help us.

This means using typehints. 

[https://docs.python.org/3/library/typing.html](https://docs.python.org/3/library/typing.html)

Type hints are great, so here is a refresher.

- When defining a function you can define what type the arguments and outputs are.

```python
def foobar( foo:str, bar:bool ) -> bool:
```

Now when calling `foobar()` pylance knows the output should be a bool.

What’s more, it can help us validate that we are writing the code we think we are writing.

In your settings.json you can set pylance to do typechecking.

```json
"python.analysis.typeCheckingMode": "basic"
```

Now if we make a simple mistake:

![Untitled](./Untitled%206.png)

This is super cool! 

### Using cast to fix type hint errors

This section is out of date and unneeded with UE 5.1. Click here to expand.
{: .collapsible}

<div markdown="1" class="collapsed-content">

🥳 UE5 Main has proper type hints! Soon all these workarounds won’t be necessary.
[https://github.com/EpicGames/UnrealEngine/commit/ec3db1b24ccac9ac92564001d30dd7136d7963ac](https://github.com/EpicGames/UnrealEngine/commit/ec3db1b24ccac9ac92564001d30dd7136d7963ac)
{: .notice--success }

Unfortunately unreal didn’t implement type hints properly in their stub file, so it’s just a bit wrong. Almost everything returns →None so pylance is convinced you will be making mistakes constantly.

You can get around this by using some of the cool typing features like `cast` and `Optional`

```python
def get_first_level_actor_name() -> str:
	eas = cast(unreal.EditorActorSubsystem, unreal.get_editor_subsystem(unreal.EditorActorSubsystem))
	if eas:
		actors = cast(List[unreal.Actor], eas.get_all_level_actors())
		if actors:
			return cast(str, actors[0].get_path_name())
	return ""
```

The docstrings for the stub file say what each function should return, so we can use the cast(type, variable) syntax from the typing module to tell pylance what to expect.

But why go through this effort? Well if we do this, then we know what each variable is, and if we know what each variable is then pylance can tell us what each variable can do.

{% include video.html video="./intellisense.mp4" %}

Say goodbye to going to the reference documentation, say hello to the world at your fingertips. 😊

#### Understanding `cast`
{: .no_toc}

If you are familiar with C++ or specifically unreal you might have an intuitive understanding of `cast`. `cast` in unreal land, checks to see if a pointer is of the type you specify, and if so returns that pointer with the knowledge that it is infact that class.

`cast` in python **does not do that**. `cast` in python is purely for the benefit of type-hinting and type checkers like pylance. If you use cast like this, then pylance is convinced 100% that what you say is true and that the variable in question *is* *always* the type you specify. At runtime, `cast` does nothing, and your code will fail if you try to do something with an invalid type.

Luckily, we can make our own unreal_cast which does what we want.

#### Making an Unreal style `unreal_cast`
{: .no_toc}

I recommend making a module named `Helpers` or something similar in your project. Here is what mine looks like:

```python
## Copyright (c) 2022 Ryan DowlingSoka - MIT License - See LICENSE file for more.

"""Helper module for misc utilities."""

from typing import TypeVar, Optional, cast
import unreal

T = TypeVar("T", bound=unreal.Object)

def unreal_cast(unreal_type: type[T], object: unreal.Object) -> Optional[T]:
	"""An unreal static_cast style cast. Returns None if the unreal.Object is not an instance of the given class."""
	if isinstance(object, unreal_type):
		return object
	else:
		return None
```

Then I can use that instead.

```python
def get_first_point_light_color() -> unreal.LinearColor:
	eas = cast(unreal.EditorActorSubsystem, unreal.get_editor_subsystem(unreal.EditorActorSubsystem))
	if eas:
		actors = cast(List[unreal.Actor], eas.get_all_level_actors())
		for actor in actors:
			light = unreal_cast(unreal.PointLight, actor)
			if light:
				return light.get_light_color()
	return cast(unreal.LinearColor, unreal.LinearColor.BLACK)
```

Now if the `actor` isn’t actually a point light, then the `light` variable will be `None`

![Untitled](./Untitled%207.png)

</div>

## Doing cool unreal things with python

### Progress Dialogs

Taken from UDN, but with a cast to make intellisense work nicely.

```python
import unreal

total_frames = 100
text_label = "Working!"
with unreal.ScopedSlowTask(total_frames, text_label) as slow_task:
	slow_task = cast(unreal.ScopedSlowTask, slow_task)
	slow_task.make_dialog(True)
	for i in range(total_frames):
		if slow_task.should_cancel():
			break
		slow_task.enter_progress_frame(1)
```

![Untitled](./Untitled%208.png)

### Doing *stuff* async

To work asynchronously in unreal, the easiest way is to attach yourself to the slate tick.

```python
unreal.register_slate_post_tick_callback(callable)
```

🤔 In actuality, this isn’t async on another thread, but instead just doing your work over multiple frames on the main thread.
{: .notice--primary}

```python
class MyClass(object):
	def __init__(self) -> None:
		self.frame_count = 0
		self.max_count = 1000

	def start(self) -> None:
		self.slate_post_tick_handle = unreal.register_slate_post_tick_callback(self.tick)
		self.frame_count = 0

	def tick(self, delta_time: float) -> None:
		print(self.frame_count)
		self.frame_count += 1
		if self.frame_count >= self.max_count:
			unreal.unregister_slate_post_tick_callback(self.slate_post_tick_handle)

test = MyClass()
test.start()
```

### Using breakpoints and debugging in VSCode

Epic has setup a script so you can set breakpoints called `debugpy_unreal.py`

It has instructions on how to use it in the file, and it totally works.

```python
## Copyright Epic Games, Inc. All Rights Reserved.

'''
	Utility script to debug the embedded UnrealEngine Python interpreter using debugpy in VS Code.

	Usage:
		1) import debugpy_unreal into Python within the UE Editor.
		2) If debugpy has not yet been installed, run debugpy_unreal.install_debugpy().
		3) Run debugpy_unreal.start() to begin a debug session, using the same port that you will use to attach your debugger (5678 is the default for VS Code).
		4) Attach your debugger from VS Code (see the "launch.json" configuration below).
		5) Run debugpy_unreal.breakpoint() to instruct the attached debugger to breakpoint on the next statement executed.
		   This can be run prior to running any script you want to debug from VS Code, as long as VS Code is still attached and script execution was continued.
	
	VS Code "launch.json" Configuration:
		{
			"name": "UnrealEngine Python",
			"type": "python",
			"request": "attach",
			"connect": {
				"host": "localhost",
				"port": 5678
			},
			"redirectOutput": true
		}
	
	Notes:
		* redirectOutput must be set to true in your debugger configuration to avoid hanging both the debugger and the UE Editor.
		* You may see some errors for "This version of python seems to be incorrectly compiled"; these can be ignored.
'''
```

![Untitled](./Untitled%209.png)

It is magical.
---
title: "Material Parameters Helper: Odds and Ends"
date: 2022-05-15
image: 
  responsive: true
  path: "/unreal/material-parameters-helper/mph.header.png"
  #header: "/unreal/material-parameters-helper/mph.header.png"
  thumbnail: "/unreal/material-parameters-helper/mph.header.png"
redirect_from:
  - /Material-Parameters-Helper-Odds-and-Ends-42352d29db0a452d95c5c4a0fa388e5e
---

> A tool to help with managing massive amounts of material parameters across numerous nested material functions.

{% include youtube.html aspect_ratio="1.652777" video="M9s-ld-ldrs" %}{: .align-center}

> [RedTechArtTools @ Github](https://github.com/Ryan-DowlingSoka/RedTechArtTools)

I’ve released an open-source plugin called [RedTechArtTools](https://github.com/Ryan-DowlingSoka/RedTechArtTools) (I’m bad at naming things, and my initials are RED, so what’ya’gonna’do). The first major thing in this plugin is the Material Parameters Helper.

This is a tool I conceived of an implemented a version of while at The Coalition. When I left I immediately missed not having it. So the only thing to do was to make it from scratch.
While the core design is pretty similar, I rebuilt the tool with a lot more polish, and tried out a few new bits and bobs to improve the user experience.

In this blog post I want to go over some of the more interesting technical details.

## Technical Design Overview

Roughly the tool works like so:

- Take a target material interface (so material instance, or base material)
- Find the base material for that interface
- Recursively iterate over all nodes and find all material parameters.
    - I use `GetAllExpressionsInMaterialAndFunctionsOfType<UMaterialExpression>()` and test `Expression->bIsParameter` and just return those. Parameter Expressions don’t have a common base, so this is the method you have to use.
- Create an object for each expression parameter, and add the item to a ListView
- Create a set of MaterialFunctions that are the owners of each parameter.
- Filter the list of expressions by a search function, whenever the search field updates see if the expression contains the string in the group or parameter name.
- Filter the list of expressions by the list of material functions, which have an enabled or disabled option.
- When properties change, use a Blueprint Library to modify the expression nodes directly.
    - This is a lot of handwritten UFunction Blueprint Wrappers. A macro would be perfect if you could make UFunctions with them, but you can’t, so a bit tedious. Could be a nice addition to the engine tbh.
- On Save and Apply save all modified material functions and materials, and recompile the used material.
    
    {% include image.html url="./Untitled.png" alt="Untitled" link=true %}{: .align-center}
    

## Blueprint Library Functions

### FRedMaterialParameterInfo

Not everything I need for this tool is available just with blueprints. The main thing is that the FMaterialParameterMetadata isn’t a UStruct, let alone a BlueprintType. So the core of the code I’ve written is creating a wrapper for this data.

This data is the glue that allows all these parameter expressions, who have different inheritance hierarchies, to work seamlessly with the Editor UI. Everything that makes up a *parameter* is in this metadata. Well, except for the Name and type, but that I slam into my wrapper as well.

```cpp
USTRUCT(BlueprintType)
struct REDTECHARTTOOLSEDITOR_API FRedMaterialParameterInfo
{
   GENERATED_BODY()

   FRedMaterialParameterInfo() = default;

   explicit FRedMaterialParameterInfo(UMaterialExpression* InExpression)
   {
      if (!IsValid(InExpression))
         return;

      OwningMaterialExpression = InExpression;
      ParameterName = InExpression->GetParameterName();
      ParameterType = InExpression->GetParameterType();
      InExpression->GetParameterValue(ParameterInfo);
   }

   UPROPERTY()
   TWeakObjectPtr<UMaterialExpression> OwningMaterialExpression = nullptr;

/** Parameter Name for the given material expression. Modify with caution.*/
UPROPERTY()
   FName ParameterName = NAME_None;

   EMaterialParameterType ParameterType = EMaterialParameterType::None;

   FMaterialParameterMetadata ParameterInfo;
};
```

`GetParameterValue` is a bit misnamed in my opinion, because what it returns isn’t just the value or current default of the parameter, but all the data that describes the parameter that the editor needs.

Then, and I went a bit overboard here because I didn’t yet know what I’d really need, I exposed every property in `FMaterialParameterMetadata` to blueprints.

For example sort priority, this becomes a blueprint callable function that just extracts the `SortPriority` from the parameter metadata in the wrapper.

```cpp
UFUNCTION(BlueprintCallable, Category=MaterialExpressions)
static int32 GetMaterialParameter_SortPriority(
    UPARAM(ref) const FRedMaterialParameterInfo& Info);
```

```cpp
int32 URedMaterialParameterBlueprintLibrary::GetMaterialParameter_SortPriority(
    const FRedMaterialParameterInfo& Info)
{
   return Info.ParameterInfo.SortPriority;
}
```

Then there are also matching set functions, these set the info, but also update the expression.

```cpp
void URedMaterialParameterBlueprintLibrary::SetMaterialParameter_SortPriority(
    FRedMaterialParameterInfo& Info,
    int32 SortPriority)
{
   Info.ParameterInfo.SortPriority = SortPriority;
   if (auto* Expression = Info.OwningMaterialExpression.Get())
   {
      Expression->Modify();
      Expression->SetParameterValue(Info.ParameterName, Info.ParameterInfo,
EMaterialExpressionSetParameterValueFlags::NoUpdateExpressionGuid |
EMaterialExpressionSetParameterValueFlags::AssignGroupAndSortPriority);
   }
}
```

<blockquote>

🤔 If you are a discerning individual, you have spotted a flaw in this pattern. What if the expression changes after the wrapper is constructed outside of these blueprint functions?

Well then things are bad, or I guess they could be. We won’t see the change in the wrapper so we might stomp over those changes.

Maybe we don’t need the wrapper at all.

You are probably right. We could skip the wrapper, keep all the functions, and have them work off of the expression directly by calling `GetParameterValue` directly each time. Maybe I’ll change it to work that way someday. Maybe.

</blockquote>

### Open and Focus Material Expression

One of the coolest (IMO) features I have in the tool is that when you click on the function name below each parameter description, the tool opens the material (or material function) that contains that expression and focuses it directly. This is a pretty easy bit of code to write, and could be used in other tools.

```cpp
bool URedMaterialParameterBlueprintLibrary::OpenAndFocusMaterialExpression(
    UMaterialExpression* MaterialExpression)
{
   if (UObject* OwningObject = GetMaterialExpression_OwningObject(MaterialExpression))
   {
      if (auto* AssetEditorSubsystem = GEditor->GetEditorSubsystem<UAssetEditorSubsystem>())
      {
         if (AssetEditorSubsystem->OpenEditorForAsset(OwningObject))
         {
            if (const auto MaterialEditorInstance = StaticCastSharedPtr<IMaterialEditor>(
                  FToolkitManager::Get().FindEditorForAsset(OwningObject)))
            {
               MaterialEditorInstance->FocusWindow(OwningObject);
               MaterialEditorInstance->JumpToExpression(MaterialExpression);
            }
         }
      }
   }
   return false;
}
```

### String Sorting

As far as I’m aware, there aren’t any good blueprint sorting options. FString, though, already has a whole slew of sorting overloads. I’ve exposed them to blueprints as a set of comparisons.

```cpp
bool URedTechArtToolsBlueprintLibrary::AlphaNumericLessThan(FString& A, FString& B)
{
   return A < B;
}

bool URedTechArtToolsBlueprintLibrary::AlphaNumericLessThanOrEqual(FString& A, FString& B)
{
   return A <= B;
}

bool URedTechArtToolsBlueprintLibrary::AlphaNumericGreaterThan(FString& A, FString& B)
{
   return A > B;
}

bool URedTechArtToolsBlueprintLibrary::AlphaNumericGreaterThanOrEqual(FString& A, FString& B)
{
   return A >= B;
}
```

As an example, I use this to sort the expressions in a way that matches their outputs in the material instance. The sorting scheme is:

- Sort by Group (Alphanumeric sorting, using the functions above.)
- Sort by Sort Priority (Integer sorting.)
- Sort by Name (Alphanumeric sorting)

I chose to do a naïve sort, just a simple, go through the list and insert when it doesn’t match. You could do smarter sorts, if you want. But the number of expressions is relatively small even in the biggest uber materials, so honestly I like to keep it simple. 

{% include image.html url="./Untitled%201.png" alt="Untitled" link=true %}{: .align-center}

The function is pretty straight forward, but would be cleaner looking in C++ for sure. The algorithm can be described like this.

- Cache the new expression’s group, sort priority, and name.
- Go over every other expression in the list.
- If the new expression group is higher than the current one, we insert there. Because we are going linearly over an already sorted list, this is safe.
- If it isn’t, but the two groups match, then we check the sort priority, and do the same thing for the parameter name.
- Whenever we insert we can exit the function early.

This pattern is definitely not optimal, but again, it is really simple and can be described in a single screenshot of the blueprint graph, so I call it a win.

### Update Material Parameter Expression GUID

This is a rare, but important issue to understand when working with material functions. When you **duplicate** a material function that has **material parameters** in it the GUID of the material functions do not get updated. As long as the name doesn’t change, this isn’t any issue. But the GUID is used to handle renames. So if there are two material functions with the same GUID but different names, they will be treated as one material parameter.

So during post-load the material system will get confused and discard one of the parameter names. The order of which one is discarded is basically undefined.

Ideally all material parameter expressions have a unique GUID. Also ideally (for safety) each material parameter name should be placed **only once** across all material functions. Use **named reroutes** and function outputs to get around this. Another good option is to wrap Material Parameters inside of a Material Function, then that material function can be placed an unlimited number of times without any danger.

Anyway the ability to fix a GUID in unreal is limited. You basically have to delete and recreate the material parameter. Somewhat a nightmare. So the tool is setup to identify the issue, and offer a button to fix it.

{% include image.html url="./Untitled%202.png" alt="Untitled" link=true %}{: .align-center}

To detect these GUIDs I loop over all the current material expressions and store their GUIDs in the set. If the GUID would be added a second time, we mark the element as having a GUID error. We don’t bother to check to see if the names match since even though it is technically alright to have the same GUID and parameter name, it is destined to become an issue later.

{% include image.html url="./Untitled%203.png" alt="Untitled" link=true %}{: .align-center}

I chose to not mark both, but just the latest one because it is a simpler pattern.

The New GUID button calls the blueprint library function to update them. I don’t allow raw edits to the GUID, which matches the protections UE has put around them.

```cpp
void URedMaterialParameterBlueprintLibrary::UpdateMaterialParameter_ExpressionGUID(
    FRedMaterialParameterInfo& Info)
{
   if (auto* Expression = Info.OwningMaterialExpression.Get())
   {
      Expression->Modify();
      Expression->UpdateParameterGuid(true, true);
      Info.ParameterInfo.ExpressionGuid = Expression->GetParameterExpressionId();
   }
}
```

## UI/UX Goodies

### Details View of the Expression

One of the biggest improvements to this version of the tool is that I exposed the material expression to the tool directly. This couldn’t be easier.

I used the **Expandable Area** widget with the quick info in the Header, and in the Body I added **Details View**

{% include image.html url="./Untitled%204.png" alt="Untitled" link=true %}{: .align-center}

When the **List View** object is set, I set the Details View object to the Material Expression immediately.

{% include image.html url="./Untitled%205.png" alt="Untitled" link=true %}{: .align-center}

<blockquote>

🤔 **Wait a second.** Why is the **List Item Object** an **Editor Utility Widget** of the same class as the view?

Okay, you caught me. I’m lazy. So my data model is the same class as my widget. This is.... not ideal. But I like not having another class so I do these data crimes.

Does this sometimes confuse me and I forget to get the data from the Data Model and instead get the data on the widget? Yes. Am I going to stop doing it this way to prevent this? No. You can’t make me.

If this were a runtime tool I would ~~*probably*~~ absolutely not do this.

</blockquote>

{% include image.html url="./Untitled%206.png" alt="Untitled" link=true %}{: .align-center}

Because the details view is directly modifying the object, we get all of this great customization and settings for free. One slight tidbit. When you change the Name, Group, or Sort Priority in the details view, I do not resort the list. This is because maintaining the expansion state was going to be a bit of a pain. An improved version of this tool would detect if one of those properties changed, do the resort, and restore the expansion state so you can continue working automatically.

I might do that later.

### Sorting, Jumping To, and Highlighting Expressions

There are two times where the expression list might change rapidly and the tool highlights the target node.

{% include video.html url="./mph.parameter_panel.main.mp4" width="1000px" %}{: .align-center}

The first time is when the list is resorted. When the Group, Name or Sort Priority field changes I run an Update Sort Location blueprint node.

{% include image.html url="./Untitled%207.png" alt="Untitled" link=true %}{: .align-center}

Here we remove the element from the list, and re-add it with the **Add Expression Item Sorted** function from before. We re-filter the list (more on that later) too.

But since the list might scroll quickly, I wanted to do two things. I wanted the element to flash a color, so it can be easily found, and in the case where the user pressed **Enter** I wanted to restore focus to the current field.

Importantly doing this constructs a new widget, so we lose the direct link to that widget. To get it back I put a short delay so that the element can be scrolled into view, and then loop over the currently displayed entry widgets and find the selected one.

{% include image.html url="./Untitled%208.png" alt="Untitled" link=true %}{: .align-center}

With it found we flash the highlight (play a quick animation) and set the keyboard focus.

{% include image.html url="./Untitled%209.png" alt="Untitled" link=true %}{: .align-center}

I do a similar thing from the function list. In the function list I list all material expressions, and when you click on one of the expressions it

{% include video.html url="./mph.function_list.mp4" width="1006px" %}{: .align-center}

The only difference here, is that with the function list, I’m not using the selected item, instead I am looping over all the expressions items to find the one with the matching Material Expression. I scroll that one into view, delay, and then play its highlight.

### Filtering the Expression List

The function list serves a second purpose, hiding expressions we don’t need. There also is a search bar now. Both of these run at the same time.

{% include image.html url="./Untitled%2010.png" alt="Untitled" link=true %}{: .align-center}

The structure of this is pretty reasonable. We create a second **Filtered List** array for the elements, and rush through all the elements of our primary list. For each expression we check the state of the **Function List** to see what the enabled state of the matching function is.

Once we’ve set the collapsed state based on the Function List we then process the filter search bar.

We do this with a pretty naïve substring check. We could do some better fuzzy searching at some point.

{% include image.html url="./Untitled%2011.png" alt="Untitled" link=true %}{: .align-center}

Notably if the filter is empty, then we treat that as the expression should be filled.

For performance considerations that should probably be done as a branch before the checking of the substrings. Huh, something for me to fix later.

<blockquote>

💡 I want to improve the filters by adding parameter type filters too, or just searching the parameter type. So this function will get upgraded to allow you to search for all **scalar** or **texture** parameters easily.

</blockquote>

Another little goody is the checkbox above the function list which shows and toggles the state of all the item checkboxes. At the end of the first image in this section you can see how this is done. We go over the entire function list one last time and check to see if each item’s enabled state matches the previous. If it does then at the end we set the “check all” box to the same value, if it doesn’t then we set the checkbox to **undetermined**.

### Filter Bar

I wanted the filter bar to be a capsule like the search bar in the content browser. Luckily UMG makes this super easy.

{% include image.html url="./Untitled%2012.png" alt="Untitled" link="./Untitled%2012.png" %}{: .align-center}

{% include image.html url="./Untitled%2013.png" alt="Untitled" link="./Untitled%2013.png" %}{: .align-center}

### Multiline Editable Text Boxes : Enter to Submit

My default in the Multiline Editable Text Box, the Enter key adds another line. Ctrl+Enter, Shift+Enter all don’t change a thing. The widget class has a slate option to allow a modifier key for a new line, but this isn’t exposed to UMG.

{% include video.html url="./mph.parameter_list.multiline.mp4" width="602px" %}{: .align-center}

I solved this by creating my own subclass. In my MultiLineEditableTextBox I added a **bShiftEnterForNewLine** property and added this to the **ModiferKeyForNewLine** slate property.

```cpp
TSharedRef<SWidget> URedMultiLineEditableTextBox::RebuildWidget()
{
// Copied from UMultiLineEditableTextBox may get out of date.
   // Ideally this should use Super::RebuildWidget and modify it there,
   // but i'm not sure that is possible. >_>

MyEditableTextBlock = SNew(SMultiLineEditableTextBox)
   .Style(&WidgetStyle)
   .TextStyle(&TextStyle)
   .AllowContextMenu(AllowContextMenu)
   .IsReadOnly(bIsReadOnly)
//    .MinDesiredWidth(MinimumDesiredWidth)
//    .Padding(Padding)
//    .IsCaretMovedWhenGainFocus(IsCaretMovedWhenGainFocus)
//    .SelectAllTextWhenFocused(SelectAllTextWhenFocused)
//    .RevertTextOnEscape(RevertTextOnEscape)
//    .ClearKeyboardFocusOnCommit(ClearKeyboardFocusOnCommit)
//    .SelectAllTextOnCommit(SelectAllTextOnCommit)
.VirtualKeyboardOptions(VirtualKeyboardOptions)
   .VirtualKeyboardDismissAction(VirtualKeyboardDismissAction)
   .OnTextChanged(BIND_UOBJECT_DELEGATE(FOnTextChanged, HandleOnTextChanged))
   .OnTextCommitted(BIND_UOBJECT_DELEGATE(FOnTextCommitted, HandleOnTextCommitted))
   .ModiferKeyForNewLine(bShiftEnterForNewLine ? EModifierKey::Shift : EModifierKey::None);

   return MyEditableTextBlock.ToSharedRef();
}

```

This unified the behaviors between the different fields and made working with descriptions feel a lot more natural. (This is the same behavior the description box in the Material Editor uses by default.)

<blockquote>

🤔 I tried to make the key an enum instead of just shift , and it is possible, but the code was getting messy because EModifierKey is not a UENUM() so it can’t be a UPROPERTY(). I would’ve had to make my own enum likely to expose it as a dropdown. If I was going to make a pull request to add this behavior to the default UMultilineEditableTextBox then I’d probably do that work.

</blockquote>

### Common UI Decorator Labels

{% include image.html url="./Untitled%2014.png" alt="Untitled" link=true %}{: .align-center}

Here you might notice that the labels are very small, and *very* close to their widgets. I used the new Common UI Visual Attachment widget to place these and ensure they didn’t add extra space or padding.

{% include image.html url="./Untitled%2015.png" alt="Untitled" link=true %}{: .align-center}

These can be a little finicky and are subject to issues if the layout changes dramatically, but are nice when things need to be tightly packed.

## Bye for now!

This is all for now. I think I’ll likely make some improvements to this tool and others in the future, and if anything else interesting comes up I’ll add it here!

You can get the tool and any future ones from the [github link](https://github.com/Ryan-DowlingSoka/RedTechArtTools) at the top of the page.

[Everything on this page is licensed under the MIT License.](https://github.com/Ryan-DowlingSoka/RedTechArtTools/blob/main/LICENSE)
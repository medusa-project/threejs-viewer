Follow these steps to include the 3D model into your own PDF:

 1) Copy your PDF into this folder

 2) Open the PDF with Adobe Acrobat (not Adobe Reader)

 3) From the menu bar, select: Tools > Advanced Editing > 3D Tool

 4) Click and drag out a rectange where you want the 3D model to appear
    (be sure to leave about a half inch below the rectangle for the toolbar!)

 5) Click the top Browse... button, and select the .U3D file in this folder

 6) Click the dialog OK button (for large models there will be a significant
    delay before the dialog goes away)

 7) The 3D model will appear on the page in a red box, right-click in this box, 
    and choose Properties... from the menu

 8) Change "Enable 3D When" drop-down list to "The page containing the
    annotation is opened".

 9) Un-check the "Enable default 3D interaction" checkbox.

10) Click the dialog Close button

11) From the menu bar, select: Advanced > JavaScript > Document JavaScripts...

12) In the Script Name: field, type STRATA

13) Click the Add... button

14) Using Windows Explorer, find this folder, and open the file UI.TXT

15) Type Ctrl-A Ctrl-C to copy this entire file to your system Clipboard

16) Go back to Acrobat, and type Ctrl-A Ctrl-V to paste this code into the
    JavaScript Editor window

17) Click the dialog Close button

18) From the menu bar, select: Tools > Basic > Hand Tool
    If there are animation scripts in the model, these will appear

19) From the menu bar, select: File > Save

20) If necessary, you can move the menu items and toolbar around the page.
    From the menu bar, select: Tools > Advanced Editing > Select Object Tool

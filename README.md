# SprigganTS

Cross platform, event-driven pixel art games running in your browser.

Currently undergoing specification.

## Features

### Fully event-driven animation and input

SprigganTS has no "render loop"; code only runs:

- At startup.
- When animations complete.
- When the user clicks or taps sprites or presses buttons.

This means that the browser or host can choose how best to schedule animations/etc. to get the best performance and battery life.
However, it is not a good fit for every game; physics-driven simulations requiring continuous iterations or "ticks" are better served by other engines.

### Integrated content pipeline

Content is built and packaged as part of the source code's build process.

                                                   .----------------------.
                                                  | Build started manually |
                                                   '----------------------'
                                                               |
     .-------------.   .----------------.   .---------------.  |
    | Content added | | Content modified | | Content removed | |  .----------------.   .-------------------.   .------------------.
     '-------------'   '----------------'   '---------------'  | | TypeScript added | | TypeScript modified | | TypeScript removed |
            |                   |                   |          |  '----------------'   '-------------------'   '------------------'
             '-----------------.|.-----------------'----------'|           |                     |                       |
                                |                              |.---------'---------------------'-----------------------'
                     .----------------------.                  |
                     |   Content rebuilt    |                  |
                     '----------------------'                  |
                                |                              |
                     .----------------------.                  |
                     |   Content packaged   |                  |
                     '----------------------'                  |
                                |                              |
                     .----------------------.                  |
                     | TypeScript generated |                  |
                     '----------------------'                  |
                                |                              |
                                 '----------------------------.|
                                                               |
                                                    .---------------------.
                                                    | TypeScript compiled |
                                                    '---------------------'
                                                               |
                                                    .---------------------.
                                                    | JavaScript minified |
                                                    '---------------------'
                                                               |
                                                     .-------------------.
                                                    |   Build completed   |
                                                     '-------------------'
                                                               
#### Code Metadata Generation

TypeScript is generated for every asset.  This means that your game code is aware of every asset, at compile-time.  Missing, or incorrectly named assets are detected before the game runs and raised as errors by the TypeScript compiler.

#### Packaging

All content needed to play the game is packaged into few, slightly larger files.  These are pre-loaded at start-up, ensuring that the game does not crash, even if played from a server through an unstable network connection.

Non-critical content (backgrounds, music, etc.) is loaded as-required.  It will be missing if the connection drops, but the game will continue playing.

#### Content Types

##### Sprites

Small, animatable pieces of pixel art.  Packed into a single sheet, or "atlas", which is loaded at start-up.
There may be small differences in how these are aligned depending upon browser/device.

##### Backgrounds

Large images which cover the entire screen, sitting behind the sprites.  These may be animated.  These are loaded on-demand; a black background will be shown if the background cannot be loaded.

As such, no information required to play the game should be in the background.

##### Sounds

Short sound effects which are played as "fire-and-forget".  Loaded on-demand; may only start playing after a delay, or not at all if cannot be loaded.  If played from startup, mobile devices will not play until the user taps due to browser restrictions.

##### Music

Looping music tracks.  One is played at a time.  Loaded on-demand; may only start playing after a delay, or not at all if cannot be loaded.  If played from startup, mobile devices will not play until the user taps due to browser restrictions.  Additionally, many browsers will "skip" when the track should loop.

As such:

- Do not attempt to synchronize the music and gameplay.
- Do not make it neccessary to hear the music to play the game.
- A half second of silence at the start and end of the music is recommended to prevent a skip on loop.
- Music should ramp up smoothly to avoid jarring starts if playback is delayed by loading.

#### Included Integrations

Please note that these integrations are not created, endorsed or supported by the third party applications' developers or publishers.
These integrations may only work with a narrow selection of versions or platforms.

| Application | Version                 | Content Types        | File extensions              |
| ----------- | ----------------------- | -------------------- | ---------------------------- |
| Aseprite    | 1.2-beta11              | Sprites, Backgrounds | .sprite.ase, .background.ase |
| FL Studio   | 12.4.1 Build 4 (32 Bit) | Sounds, Music        | .sound.flp, .music.flp       |

### Compatability

A combination of compatability fallbacks and in-depth manual testing means that games which do not directly use browser APIs should "just work".

#### Input Devices

Currently, only mouse clicks and touchscreen taps on sprites and backgrounds are supported.
This is to ensure maximum compatability between desktop and mobile devices.

Gamepad input is planned, but not currently implemented.

#### Tested Hosts

This is based on the Hydride techdemo of SprigganJS, the previous iteration of this engine, which is implemented similarly.

| Browser           | Version                | Platform                                                   | Version               | Mouse              | Touch              | Graphics                       | Animation           | Sound                                          | Music                                  |
| ----------------- | ---------------------- | ---------------------------------------------------------- | --------------------- |:------------------:|:------------------:|:------------------------------:|:-------------------:|:----------------------------------------------:|:--------------------------------------:|
| Chrome            | 59.0.3071.115 (64-bit) | Windows 10 Home                                            | 1703                  | :heavy_check_mark: | :question:         | Rare seams between sprites     | :heavy_check_mark:  | :heavy_check_mark:                             | May skip on loop                       |
| Firefox           | 54.0.1 (32-bit)        | Windows 10 Home                                            | 1703                  | :heavy_check_mark: | :question:         | Frequent seams between sprites | :heavy_check_mark:  | Occasional skips with many simultaneous sounds | May skip on loop                       |
| Edge              | 40.15063.0.0           | Windows 10 Home                                            | 1703                  | :heavy_check_mark: | :question:         | Slight blurring of pixel art   | :heavy_check_mark:  | :heavy_check_mark:                             | May skip on loop                       |
| Internet Explorer | 11.413.15063.0         | Windows 10 Home                                            | 1703                  | :heavy_check_mark: | :question:         | Rare seams between sprites     | :heavy_check_mark:  | :heavy_check_mark:                             | May skip on loop                       |
| Internet Explorer | 10.0.9200.17148        | Windows 7 Enterprise (under VirtualBox on Windows 10 Home) | Service Pack 1 (1703) | :heavy_check_mark: | :question:         | Rare seams between sprites     | Low frame-rate      | :heavy_check_mark:                             | May skip on loop                       |
| Internet Explorer | 9.0.8112.16421         | Windows 7 Enterprise (under VirtualBox on Windows 10 Home) | Service Pack 1 (1703) | :heavy_check_mark: | :question:         | Rare seams between sprites     | Low frame-rate      | :x:                                            | :x:                                    |
| Internet Explorer | 8.0.7601.17513         | Windows 7 Enterprise (under VirtualBox on Windows 10 Home) | Service Pack 1 (1703) | :heavy_check_mark: | :question:         | Rare seams between sprites     | Low frame-rate      | :x:                                            | :x:                                    |
| Chrome            | 59.0.3071.125          | Android  (Wileyfox Swift)                                  | 7.1.1 (N6F26Y)        | :question:         | :heavy_check_mark: | Rare seams between sprites     | :heavy_check_mark:  | Only after first tap                           | Only after first tap; may skip on loop |
| Firefox           | 54.0.1                 | Android  (Wileyfox Swift)                                  | 7.1.1 (N6F26Y)        | :question:         | :heavy_check_mark: | Frequent seams between sprites | Animations may skip | Only after first tap                           | Only after first tap; may skip on loop |

### Debugging

Three aspects of SprigganTS make it easy to debug your games.

- The scene graph directly translates to DOM elements, which can be inspected using your browser's debugger.
- The lack of a "render loop" greatly reduces the "noise" visible in timeline views due to callbacks tied to the monitor's refresh rate.
- TypeScript and the generation of code metadata from assets mean that errors are caught before the game starts.

## Developing Games

### Build

NPM is used as a simple build system, while Visual Studio Code is used as an IDE.

- Install NodeJS (LTS is recommended). https://nodejs.org/en/download/
- Install Git.  https://git-scm.com/downloads
- Add Aseprite's Aseprite.exe to the PATH variable. https://en.wikipedia.org/wiki/PATH_(variable)
- Add FL Studio's FL.exe to the PATH variable. https://en.wikipedia.org/wiki/PATH_(variable)
- Fork and clone this repository to your machine.  https://help.github.com/articles/cloning-a-repository/

#### Via Visual Studio Code

- Install Visual Studio Code. https://code.visualstudio.com/Download
- Open Visual Studio Code.
- File -> Open Folder.
- Enter the folder where you cloned your repository, and click Select Folder.
- Press Ctrl+Shift+B.
- The build will start and run.  This may take a few minutes.
- You should be able to test the game by navigating to http://localhost:3333 in your browser.
- Any changes you make should automatically rebuild the game in the background.  You will need to refresh your browser to see them.

#### Via CLI

There are two available NPM scripts which build the game:

##### Build once

    npm install
    
Installs all dependencies, and places a build in the Build directory.

##### Build on changes

    npm run-script develop
    
Installs all dependencies, and places a build in the Build directory every time a file is changed.
It can be played at http://localhost:3333 in your browser.

### TypeScript API

The entry point for the TypeScript application is Source/Entry.ts.  The "StartGame" function will be executed when all content required to play the game has been loaded.

All methods in the API are "bound", meaning that it is safe to directly call them:

    // No wrapping function required here.
    Content.Battle.Sky.Day.Play(Content.Battle.Sky.Sunset[0].Play)

Additionally, the minification pass has been configured to compress property names.  As such:

    { a: 3, b: 4, c: 5 }["b"]

May not work.  However, quoted property names will be preserved, so the following will work:

    { "a": 3, "b": 4, "c": 5 }["b"]

#### Configuration

At the top of Source/Engine/Entry.ts is a reference to Source/Engine/Configuration.ts.  This file is shared between the runtime engine and build process, and defines:

##### ResolutionX

The number of horizontal pixels in the "emulated" screen.

##### ResolutionY

The number of vertical pixels in the "emulated" screen.

#### Content

The build process will generate the file Source/Content.ts.  This contains an object hierarchy mimicking your directory structure (and often the records inside the content files), with objects containing the associated metadata.

Directories containing only consecutive numbers will be turned into arrays.

For instance, the following directory structure:

    '-Source
      '- Battle
         |'- Sky.background.ase (contains an animation containing Day/0 and Day/1, and single frame animations Sunset/0 and Sunset/1)
         |'- Character.sprite.ase (contains single frame animations Idle, Walk/A and Walk/B)
         |'- Theme.music.flp
          '- Effects.sound.flp (contains mixer channels Sword, Ouch)
         
Will produce the following object:

    const Content = {
        Battle: {
            Sky: {
                Day: [new BackgroundFrame(...), new BackgroundFrame(...)],
                Sunset: [new BackgroundFrame(...), new BackgroundFrame(...)]
            },
            Character: {
                Idle: new SpriteFrame(...),
                Walk: {
                    A: new SpriteFrame(...),
                    B: new SpriteFrame(...)
                }
            }
            Theme: new Music(...),
            Effects: {
                Sword: new Sound(...),
                Ouch: new Sound(...)
            }
        }
    }
    
##### Metadata Types

These are not intended to be constructed by your game code.

###### SpriteFrame

A single still image which may be applied to a sprite.

    // Number of seconds.
    Content.Battle.Character.Idle.Duration
	
	// See below for an example of applying a SpriteFrame to a Sprite.

###### BackgroundFrame

A single still image which is shown behind all sprites, filling the virtual screen.

    // If these fail to load, the background will be black.
    // The following methods interrupt the previously playing animation.

    Content.Battle.Sky.Day.Play()
    
    Content.Battle.Sky.Day.Play(() => console.log("Called when finished"))
    
    Content.Battle.Sky.Day.Loop()

###### Sound

A "fire-and-forget" sound.

    // Number of seconds.
    Content.Battle.Effects.Sword.Duration

    // This may do nothing on some platforms.
    Content.Battle.Effects.Sword.Play()

###### Music

A looping music track.  

	// This may be delayed while it loads.
	// It may do nothing on some platforms.
	Content.Battle.Theme.Loop()

#### Scene Graph

SprigganTS uses a scene graph when rendering.  This runs at a fixed "emulated" resolution.

All objects are drawn by walking the tree depth first, nodes ordered by when they were added to the parent.  That is:

    |'-Viewport A
    | |'-Group AA
    | | |'-Drawn behind everything else.  Added before the below.
    | |  '-Drawn behind group AB.  Added after the above.
    |  '-Group AB
    |    '-Drawn on top of group AA, but behind group B.
     '-Viewport B
       '-Drawn on top of everything else.
      
By default, scene graph objects are added to the root of the scene graph.

The origin of a viewport is its top left corner.

##### Viewport

A scene root, which is positioned relative to the screen's actual borders.

    // "Left", "Middle", "Right"; default is "Middle" when not given.
    const horizontalAlignment = "Left"

    // "Top", "Middle", "Bottom"; default is "Middle" when not given.
    const verticalAlignment = "Top"

    // When true, the viewport is cropped; anything which leaves the "emulated screen" is trimmed to the "emulated screen".
    // Otherwise, sprites/etc. may be seen outside of the ResolutionX/ResolutionY box; this may be desirable, but may mean things which leave the scene do not.
    // Defaults to true when not set.
    const crop = false

    new Viewport(horizontalAlignment, verticalAlignment, crop)

    new Viewport(horizontalAlignment, verticalAlignment, crop, () => console.log("Called when any child of the viewport or their children are clicked or tapped"))

##### Sprite

A visible object, which displays a SpriteFrame.

    new Sprite(parentViewportOrGroup)

    new Sprite(parentViewportOrGroup, () => console.log("Called when the sprite is clicked or tapped"))

    // The following methods interrupt the previously playing animation.
    
    new Sprite(...).Play(Content.Character.Idle)
    
    new Sprite(...).Play(Content.Character.Idle, () => console.log("Called when finished, but not if interrupted"))
    
    new Sprite(...).Loop(Content.Character.Idle)
    
##### Group

An invisible object, which can contain other scene graph objects. These can be used for:

- Grouping individual sprites into a single "object".
- Grouping scene graph objects into layers, for z-ordering.
- Grouping objects which should be paused together.

    new Group(parentViewportOrGroup)

    new Group(parentViewportOrGroup, () => console.log("Called when any child of the group or their children are clicked or tapped"))

##### Common Methods

The following methods exist on most scene graph objects:

    // Movement functions interrupt any previous motion.
    // Child scene objects, and their scene objects, will move with ours.

    // Moves to 25 emulated pixels right of the origin of our container, 34 down of the origin of our container, immediately.
    groupOrSprite.Move(25, 34) 
    
    // Moves from the current position to 25 emulated pixels right of the origin of our container, 34 down of the origin of our container, over 0.6 seconds.

    groupOrSprite.MoveOver(25, 34, 0.6)
    
    groupOrSprite.MoveOver(25, 34, 0.6, () => console.log("Called when finished, but not if interrupted.")
    
    // Moves from the current position to 25 emulated pixels right of the origin of our container, 34 down of the origin of our container, at 250 emulated pixels/second.
    groupOrSprite.MoveAt(25, 34, 250) 

    groupOrSprite.MoveAt(25, 34, 250, () => console.log("Called when finished, but not if interrupted.")
    
    // Temporarily removes the scene graph object and its children from the scene graph, hiding them and ignoring clicks/taps (what lies underneath will accept them instead).
    // Animations may continue while hidden, and trigger events.
    // No effect if already hidden.
    viewportGroupOrSprite.Hide()
    
    // Undoes .Hide().
    // No effect if not hidden.
    viewportGroupOrSprite.Show()
    
    // Temporarily freezes all animation and motion in the scene graph object and its children.
    // Does not count as an interruption.
    // Clicks will still be accepted.
    // No effect if already paused.
    viewportGroupOrSprite.Pause()
    
    // Undoes .Pause().
    // No effect if not paused.
    viewportGroupOrSprite.Resume()
    
    // Permanently removes the scene graph object and its children from the scene graph, hiding them and ignoring clicks/taps (what lies underneath will accept them instead).
    // Animations will not continue, and events will not be triggered.
    viewportGroupOrSprite.Delete()
    
    // Gets the (possibly non-integer) number of emulated pixels the scene graph object is right of its parent's origin.
    groupOrSprite.X()
    
    // Gets the (possibly non-integer) number of emulated pixels the scene graph object is below its parent's origin.
    groupOrSprite.Y()
    
#### Events

The following classes exist to help organize events in your game logic.

##### Once

Only calls listeners on the first call to Raise().
Listeners added after Raise() are called immediately.

    const once = new EventOnce<() => void>()
    once.Listen(() => console.log("Logged second"))
    once.Listen(() => console.log("Logged third"))
    console.log("Logged first")
    once.Raise()
    once.Listen(() => console.log("Logged fourth"))
    console.log("Logged last")
    once.Raise()
    
##### Recurring

Calls listeners once on every call to Raise().
Listeners added after calling Raise() are not called until the next call to Raise().
    
    const recurring = new EventRecurring<() => void>()
    recurring.Listen(() => console.log("Logged second and fifth"))
    recurring.Listen(() => console.log("Logged third and sixth"))
    console.log("Logged first")
    recurring.Raise()
    console.log("Logged fourth")
    recurring.Listen(() => console.log("Logged seventh"))
    recurring.Raise()
    console.log("Logged last")
    
#### Timers

Although SprigganTS uses setTimeout and setInterval under the hood, it only uses these to trigger an internal event queue, to ensure that the order of events is deterministic regardless of browser or device.
These types use this event queue, so it is recommended to use them over setTimeout and setInterval directly.

##### Once

    const once = new Timers.Once(
        0.4, 
        // The following arguments are optional; specify undefined to not include them.
        () => console.log("Called after 0.4 seconds if not cancelled or paused"),
        (elapsedSeconds, elapsedUnitInterval) => console.log("Called when cancelled before completing"),
        (elapsedSeconds, elapsedUnitInterval) => console.log("Called periodically during the timer"),
        (elapsedSeconds, elapsedUnitInterval) => console.log("Called when paused"),
        (elapsedSeconds, elapsedUnitInterval) => console.log("Called when resumed")
    )

    once.Cancel()

    once.Pause()

    once.Resume()

    once.DurationSeconds
    once.Paused()
    once.Completed()
    once.Cancelled()
    once.ElapsedSeconds()
    once.ElapsedUnitInterval() // Returns 0 at the start, and 1 at the end.

##### Recurring
    
    const recurring = new TimerRecurring(0.4, () => console.log("Called every 0.4 seconds"))

    const recurring = new TimerRecurring(0.4, () => console.log("Called every 0.4 seconds"), (elapsedSecondsThisLoop, elapsedUnitIntervalThisLoop, totalElapsedSeconds, totalElapsedUnitInterval) => console.log("Called when stopped"))
    
    const recurring = new TimerRecurring(0.4, () => console.log("Called every 0.4 seconds"), (elapsedSecondsThisLoop, elapsedUnitIntervalThisLoop, totalElapsedSeconds, totalElapsedUnitInterval) => console.log("Called when stopped"), (elapsedSecondsThisLoop, elapsedUnitIntervalThisLoop, totalElapsedSeconds, totalElapsedUnitInterval) => console.log("Called periodically during the timer"))

    const recurring = new TimerRecurring(0.4, undefined, (elapsedSecondsThisLoop, elapsedUnitIntervalThisLoop, totalElapsedSeconds, totalElapsedUnitInterval) => console.log("Called when stopped"))
    
    const recurring = new TimerRecurring(0.4, undefined, (elapsedSecondsThisLoop, elapsedUnitIntervalThisLoop, totalElapsedSeconds, totalElapsedUnitInterval) => console.log("Called when stopped"), (elapsedSecondsThisLoop, elapsedUnitIntervalThisLoop, totalElapsedSeconds, totalElapsedUnitInterval) => console.log("Called periodically during the timer"))
    
    const recurring = new TimerRecurring(0.4, () => console.log("Called every 0.4 seconds"))

    const recurring = new TimerRecurring(0.4, () => console.log("Called every 0.4 seconds"), (elapsedSecondsThisLoop, elapsedUnitIntervalThisLoop, totalElapsedSeconds, totalElapsedUnitInterval) => console.log("Called when stopped"))
    
    const recurring = new TimerRecurring(0.4, () => console.log("Called every 0.4 seconds"), (elapsedSecondsThisLoop, elapsedUnitIntervalThisLoop, totalElapsedSeconds, totalElapsedUnitInterval) => console.log("Called when stopped"), (elapsedSecondsThisLoop, elapsedUnitIntervalThisLoop, totalElapsedSeconds, totalElapsedUnitInterval) => console.log("Called periodically during the timer"))
    
    const recurring = new TimerRecurring(0.4, undefined, undefined, (elapsedSecondsThisLoop, elapsedUnitIntervalThisLoop, totalElapsedSeconds, totalElapsedUnitInterval) => console.log("Called periodically during the timer"))
    
    recurring.Stop()

#### Font

A simplistic bitmap font system is included, which generates sets of Sprites.

    // This creates a bitmap font using the sprites a, b and c for characters a, b and c respectively.
    // These will be looped, so characters can be animated.
    // There are 2 emulated pixels between each line of text.
    // Characters are 10 emulated pixels high (so lines are 12 emulated pixels high).
    // There is 1 emulated pixel between each character horizontally.
    // All characters are assumed to be 8 emulated pixels wide, except the letter b, which is 16.
    const font = new Font({ 
        a: new SpriteFrame(...),
        b: new SpriteFrame(...),
        c: new SpriteFrame(...),
        ...
    }, 2, 10, 1, 8, {
        b: 16
    })

    // "Left", "Middle", "Right"; default is "Left" when not given.
    const horizontalAlignment = "Left"

    // "Top", "Middle", "Bottom"; default is "Top" when not given.
    const verticalAlignment = "Top"

    // Pixels between the left of the container and the anchor of the written text.
    // Default is 0 when not given.
    const leftPixels = 320

    // Pixels between the top of the container and the anchor of the written text.
    // Default is 0 when not given.
    const topPixels = 240

    font.Write(group, "Hello World!\nThis is on a subsequent line.\n\tThis is indented.", horizontalAlignment, verticalAlignment, leftPixels, topPixels)

    // Returns the number of emulated pixels needed to write the string horizontally.
    font.CalculateWidth("Hello World!\nThis is on a subsequent line.\n\tThis is indented.")

    // Returns the number of emulated pixels needed to write the string vertically.
    font.CalculateHeight("Hello World!\nThis is on a subsequent line.\n\tThis is indented.")

    // Returns the given string, with extra newlines to wrap it to 24 horizontal emulated pixels.
    font.Wrap("Hello World!\nThis is on a subsequent line.\n\tThis is indented.", 24)

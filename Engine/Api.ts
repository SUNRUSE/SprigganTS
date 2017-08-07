/** A sprite frame, imported from non-code content. */
declare abstract class SpriteFrame { }

/** A background frame, imported from non-code content. */
declare abstract class BackgroundFrame { }

/** A sound effect, imported from non-code content. */
declare abstract class Sound { }

/** A music track, imported from non-code content. */
declare abstract class Music { }

/** A line of dialog, imported from non-code content. */
declare abstract class Dialog { }

/** Describes the horizontal (left-to-right) alignment of an object. */
declare const enum HorizontalAlignment {
    /** The object is aligned to the left edge. */
    Left,

    /** The object is aligned between the left and right edges. */
    Middle,

    /** The object is aligned to the right edge. */
    Right
}

/** Describes the vertical (top-to-bottom) alignment of an object. */
declare const enum VerticalAlignment {
    /** The object is aligned to the top edge. */
    Top,

    /** The object is aligned between the top and bottom edges. */
    Middle,

    /** The object is aligned to the bottom edge. */
    Bottom
}

declare class Viewport {
    /** A "root" of the scene graph, which can be docked to screen borders.  The size of the virtual screen.
     * @param {?HorizonalAlignment} horizontalAlignment The horizontal alignment of the viewport relative to the screen or window.  Defaults to HorizontalAlignment.Middle.
     * @param {?VerticalAlignment} verticalAlignment The vertical alignment of the viewport relative to the screen or window.  Defaults to VerticalAlignment.Middle.
     * @param {?boolean} crop When true, children of the viewport will be "cropped" to its borders, including click actions.  When false, the borders of the viewport do not crop its children.  Defaults to false.
    */
    constructor(horizontalAlignment?: HorizontalAlignment, verticalAlignment?: VerticalAlignment, crop?: boolean)

    /** Pauses this Viewport and all its children; motion and animation will be paused until this Viewport is .Resume()-d.
     * Clicks will still trigger actions.
     * @returns {Viewport} This Viewport, for chaining method calls "fluently" (.Move(...).Pause(...)).
    */
    Pause(): Viewport

    /** Resumes this Viewport and all its children which are not themselves paused; motion and animation will resume from where they were .Pause()-d.
     * @returns {Viewport} This Viewport, for chaining method calls "fluently" (.Move(...).Pause(...)).
    */
    Resume(): Viewport

    /** Hides this Viewport and all its children; clicks will not trigger actions or block underlying scene objects being clicked until .Show()-n.
     * @returns {Viewport} This Viewport, for chaining method calls "fluently" (.Move(...).Pause(...)).
    */
    Hide(): Viewport

    /** Shows this Viewport and all its children which are not themselves hidden.
     * @returns {Viewport} This Viewport, for chaining method calls "fluently" (.Move(...).Pause(...)).
    */
    Show(): Viewport

    /** Removes this Viewport and all its children from the scene graph. */
    Delete(): void
}

declare class Group {
    /** An invisible grouping of Group and/or Sprite scene objects. 
     * @param {Viewport | Group} parent The parent scene object to add the new Group to.
    */
    constructor(parent: Viewport | Group)

    /** Pauses this Group and all its children; motion and animation will be paused until this Group is Resume -d.
     * Clicks will still trigger actions.
     * @returns {Group} This Group, for chaining method calls "fluently" (.Move(...).Pause(...)).
    */
    Pause(): Group

    /** Resumes this Group and all its children which are not themselves paused; motion and animation will resume from where they were .Pause()-d.
     * @returns {Group} This Group, for chaining method calls "fluently" (.Move(...).Pause(...)).
    */
    Resume(): Group

    /** Hides this Group and all its children; clicks will not trigger actions or block underlying scene objects being clicked until .Show()-n.
     * @returns {Group} This Group, for chaining method calls "fluently" (.Move(...).Pause(...)).
    */
    Hide(): Group

    /** Shows this Group and all its children which are not themselves hidden.
     * @returns {Group} This Group, for chaining method calls "fluently" (.Move(...).Pause(...)).
    */
    Show(): Group

    /** Moves this Group to a specified location immediately. 
     * @param {integer} virtualPixelsFromLeft The number of virtual pixels to place this Group to the right of the parent scene object's origin.
     * @param {integer} virtualPixelsFromTop The number of virtual pixels to place this Group below the parent scene object's origin.
     * @returns {Group} This Group, for chaining method calls "fluently" (.Move(...).Pause(...)).
    */
    Move(virtualPixelsFromLeft: number, virtualPixelsFromTop: number): Group

    /** Moves this Group from its current location to a specified location over the course of a set duration.  Initially paused if this Group is .Pause()-d.
     * @param {integer} virtualPixelsFromLeft The number of virtual pixels to place this Group to the right of the parent scene object's origin.
     * @param {integer} virtualPixelsFromTop The number of virtual pixels to place this Group below the parent scene object's origin.
     * @param {float} durationSeconds The number of seconds to take to reach the destination.
     * @param {?function} onArrival An optional callback to execute if and when this Group reaches the specified destination.
     * @returns {Group} This Group, for chaining method calls "fluently" (.Move(...).Pause(...)).
    */
    MoveOver(virtualPixelsFromLeft: number, virtualPixelsFromTop: number, durationSeconds: number, onArrival?: () => void): Group

    /** Moves this Group from its current location to a specified location at a set speed.  Initially paused if this Group is .Pause()-d.
     * @param {integer} virtualPixelsFromLeft The number of virtual pixels to place this Group to the right of the parent scene object's origin.
     * @param {integer} virtualPixelsFromTop The number of virtual pixels to place this Group below the parent scene object's origin.
     * @param {float} pixelsPerSecond The number of pixels to cover per second.
     * @param {?function} onArrival An optional callback to execute if and when this Group reaches the specified destination.
     * @returns {Group} This Group, for chaining method calls "fluently" (.Move(...).Pause(...)).
    */
    MoveAt(virtualPixelsFromLeft: number, virtualPixelsFromTop: number, pixelsPerSecond: number, onArrival?: () => void): Group

    /** Removes this Group and all its children from the scene graph. */
    Delete(): void

    /** Plays a Sound from this Group, using positional audio if available.
     * @param {Sound} sound The Sound to play.
     * @returns {Group} This Group, for chaining method calls "fluently" (.Move(...).Pause(...)).
     */
    PlaySound(sound: Sound): Group

    /** Plays a line of Dialog from this Group, using positional audio if available.
     * @param {Dialog} dialog The Dialog to play.
     * @returns {Group} This Group, for chaining method calls "fluently" (.Move(...).Pause(...)).
     */
    PlayDialog(dialog: Dialog): Group
}

declare class Sprite {
    /** Displays a SpriteFrame inside a Viewport or Group. 
     * @param {Viewport | Group} parent The parent scene object to add the new Sprite to.
    */
    constructor(parent: Viewport | Group)

    /** Pauses this Sprite; motion and animation will be paused until this Group is Resume -d.
     * @returns {Group} This Group, for chaining method calls "fluently" (.Move(...).Pause(...)).
    */
    Pause(): Group

    /** Resumes this Sprite; motion and animation will resume from where they were .Pause()-d.
     * @returns {Group} This Group, for chaining method calls "fluently" (.Move(...).Pause(...)).
    */
    Resume(): Group

    /** Hides this Sprite; clicks will not trigger actions or block underlying scene objects being clicked until .Show()-n.
     * @returns {Sprite} This Sprite, for chaining method calls "fluently" (.Move(...).Pause(...)).
    */
    Hide(): Sprite

    /** Shows this Sprite.
     * @returns {Sprite} This Sprite, for chaining method calls "fluently" (.Move(...).Pause(...)).
    */
    Show(): Sprite

    /** Plays a non-looping animation.  If no subsequent animation is played, the last frame remains visible.  Initially paused if this Sprite is .Pause()-d.
     * @param {SpriteFrame | SpriteFrame[]} animation An animation of one or more frames to play.
     * @param {?function} onCompletion An optional callback to execute if and when the animation completes.
     * @returns {Sprite} This Sprite, for chaining method calls "fluently" (.Move(...).Pause(...)).
     */
    Play(animation: SpriteFrame | SpriteFrame[], onCompletion?: () => void): Sprite

    /** Plays a looping animation.  Initially paused if this Sprite is .Pause()-d.
     * @param {SpriteFrame | SpriteFrame[]} animation An animation of one or more frames to play.
     * @returns {Sprite} This Sprite, for chaining method calls "fluently" (.Move(...).Pause(...)).
     */
    Loop(animation: SpriteFrame | SpriteFrame[]): Sprite

    /** Moves this Sprite to a specified location immediately. 
     * @param {integer} virtualPixelsFromLeft The number of virtual pixels to place this Sprite to the right of the parent scene object's origin.
     * @param {integer} virtualPixelsFromTop The number of virtual pixels to place this Sprite below the parent scene object's origin.
     * @returns {Sprite} This Sprite, for chaining method calls "fluently" (.Move(...).Pause(...)).
    */
    Move(virtualPixelsFromLeft: number, virtualPixelsFromTop: number): Sprite

    /** Moves this Sprite from its current location to a specified location over the course of a set duration.  Initially paused if this Sprite is .Pause()-d.
     * @param {integer} virtualPixelsFromLeft The number of virtual pixels to place this Sprite to the right of the parent scene object's origin.
     * @param {integer} virtualPixelsFromTop The number of virtual pixels to place this Sprite below the parent scene object's origin.
     * @param {float} durationSeconds The number of seconds to take to reach the destination.
     * @param {?function} onArrival An optional callback to execute if and when this Sprite reaches the specified destination.
     * @returns {Sprite} This Sprite, for chaining method calls "fluently" (.Move(...).Pause(...)).
    */
    MoveOver(virtualPixelsFromLeft: number, virtualPixelsFromTop: number, durationSeconds: number, onArrival?: () => void): Sprite

    /** Moves this Sprite from its current location to a specified location at a set speed.  Initially paused if this Sprite is .Pause()-d.
     * @param {integer} virtualPixelsFromLeft The number of virtual pixels to place this Sprite to the right of the parent scene object's origin.
     * @param {integer} virtualPixelsFromTop The number of virtual pixels to place this Sprite below the parent scene object's origin.
     * @param {float} pixelsPerSecond The number of pixels to cover per second.
     * @param {?function} onArrival An optional callback to execute if and when this Sprite reaches the specified destination.
     * @returns {Sprite} This Sprite, for chaining method calls "fluently" (.Move(...).Pause(...)).
    */
    MoveAt(virtualPixelsFromLeft: number, virtualPixelsFromTop: number, pixelsPerSecond: number, onArrival?: () => void): Sprite

    /** Removes this Sprite from the scene graph. */
    Delete(): void

    /** Plays a Sound from this Sprite, using positional audio if available.
     * @param {Sound} sound The Sound to play.
     * @returns {Sprite} This Sprite, for chaining method calls "fluently" (.Move(...).Pause(...)).
     */
    PlaySound(sound: Sound): Sprite

    /** Plays a line of Dialog from this Sprite, using positional audio if available.
     * @param {Dialog} dialog The Dialog to play.
     * @returns {Sprite} This Sprite, for chaining method calls "fluently" (.Move(...).Pause(...)).
     */
    PlayDialog(dialog: Dialog): Sprite
}

/** A single image, drawn behind all scene objects.  Any area not covered by the background or a scene object is black. */
declare namespace Background {
    /** Plays a looping animation.  If no subsequent animation is played, the last frame remains visible.  Initially paused if .Pause()-d.
     * @param {Background | Background[]} animation An animation of one or more frames to play.
     */
    function Set(animation: SpriteFrame | SpriteFrame[]): void

    /** If a background was previously Set, it is removed. */
    function Remove(): void

    /** Pauses the animation Set. */
    function Pause(): void

    /** Resumes the animation Set and then .Pause()-d. */
    function Resume(): void
}

/** The types of transitions which may be applied. */
declare const enum TransitionType {
    /** The screen fades to black to perform a transition. */
    FadeToBlack,

    /** The screen fades to white to perform a transition. */
    FadeToWhite
}

/** Enters a transition, used to change scene.  An error will occur if this is called while a previous transition is in progress.  Input is blocked while entering or exiting a transition.
 * @param {TransitionType} type The TransitionType to perform.
 * @param {float} enterDurationSeconds The number of seconds to spend entering the transition.
 * @param {float} exitDurationSeconds The number of seconds to spend entering the transition.
 * @param {Function} call A function to call between the enter and exit phases of the transition; perform the actual scene change here.
 */
declare function Transition(type: TransitionType, enterDurationSeconds: number, exitDurationSeconds: number, call: () => void): void

/** A single looping track. */
declare namespace Music {
    /** Plays music.  If the music specified is already playing, nothing happens.  If other music is already playing, that music is stopped first. 
     * @param {Music} The music to play.
    */
    function Set(music: Music): void

    /** Stops the currently playing music, if any. */
    function Stop(): void
}

/** Executes a function after a delay.  Similar to setTimeout.
 * @param {float} durationSeconds The number of seconds to wait.
 * @param {Function} call The function to call after the specified delay.
 */
declare function After(durationSeconds: number, call: () => void): void
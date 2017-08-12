/// <reference path="Api.ts" />

/** An implementation of [].indexOf(); needed for platforms which do not include .indexOf(). 
 * @param {T[]} list The list to search for an item.
 * @param {T} item The item to find..
 * @returns {integer} The index of the first instance of the item in the list, if any, else, -1.
*/
declare function IndexOf<T>(list: T[], item: T): number

/** Removes every instance of an item from a list.
 * @param {T[]} list The list to remove an item from.
 * @param {T} item The item to remove.
 */
declare function Remove<T>(list: T[], item: T): void

/** Determines whether a list contains an item.
 * @param {T[]} list The list to search for an item.
 * @param {T} item The item to find.
 * @returns {boolean} True when the list contains the item at least once, otherwise, false.
 */
declare function Contains<T>(list: T[], item: T): boolean

/** Linearly interpolates between two values.
 * @param {float} from The value to interpolate from (when byUnitInterval is 0).
 * @param {float} to The value to interpolate to (when byUnitInterval is 1).
 * @param {float} byUnitInterval The "alpha", where 0 is from and 1 is to.
 * @returns {float} The linear interpolation between the given values.
 */
declare function Mix(from: number, to: number, byUnitInterval: number): number

/** Calculates the square of the distance between two points in 2D space.
 * @param {float} x1 The first dimension of the first point.
 * @param {float} y1 The second dimension of the first point.
 * @param {float} x2 The first dimension of the second point.
 * @param {float} y2 The second dimension of the second point.
 * @returns {float} The square of the distance between the given points.
 */
declare function DistanceSquared(x1: number, y1: number, x2: number, y2: number): number

/** Calculates the distance between two points in 2D space.
 * @param {float} x1 The first dimension of the first point.
 * @param {float} y1 The second dimension of the first point.
 * @param {float} x2 The first dimension of the second point.
 * @param {float} y2 The second dimension of the second point.
 * @returns {float} The distance between the given points.
 */
declare function Distance(x1: number, y1: number, x2: number, y2: number): number

/** An event which can only fire once, and remembers that it has been fired. */
declare class OneTimeEvent<T extends Function> {
    /** Listens to this OneTimeEvent.  If this has already been raised, the callback is fired immediately before returning.  No effect if the listener was previously added (and not subsequently removed before this OneTimeEvent was raised).
     * @param {Function} listener The callback to execute when this OneTimeEvent is raised, or immediately if it already has been.
     */
    Listen(listener: T): void

    /** Removes a callback previously added using Listen.  No effect once raised or if the callback was never added or was subsequently removed.
     * @param {Function} listener The callback to un-Listen.
     */
    Unlisten(listener: T): void

    /** Raises this OneTimeEvent, invoking all listening callbacks.  No effect if already raised. */
    readonly Raise: T
}

/** An event which can fire an unlimited number of times. */
declare class RecurringEvent<T extends Function> {
    /** Listens to this RecurringEvent.  No effect if the listener was previously added (and not subsequently removed). 
     * @param {Function} listener The callback to execute when this RecurringEvent is raised.
     */
    Listen(listener: T): void

    /** Removes a callback previously added using Listen.  No effect if the callback was never added or was subsequently removed.
     * @param {Function} listener The callback to un-Listen.
     */
    Unlisten(listener: T): void

    /** Raises this RecurringEvent, invoking all listening callbacks. */
    readonly Raise: T
}

declare class Font {
    /** A container for SpriteFrames representing a bitmap font, including kerning data.
     * @param {{ [character: string]: SpriteFrame }} characterSpriteFrames A map of characters to SpriteFrames to draw.  The origin should be the lefthand edge of the character at the cap height.  Missing characters will be treated as whitespace.
     * @param {integer} lineSpacingVirtualPixels The number of virtual pixels between each line of text.
     * @param {integer} capHeightVirtualPixels The number of virtual pixels between the top and bottom of a typical capital letter.
     * @param {integer} kerningVirtualPixels The number of virtual pixels between characters horizontally.
     * @param {integer} defaultCharacterWidthVirtualPixels The number of virtual pixels wide characters are considered unless explicitly overridden.
     * @param {{ [character: string]: number }} characterWidthVirtualPixelsOverrides A map of characters to overrides for defaultCharacterWidthVirtualPixels for those specific characters.
     */
    constructor(
        characterSpriteFrames: { [character: string]: SpriteFrame },
        lineSpacingVirtualPixels: number,
        capHeightVirtualPixels: number,
        kerningVirtualPixels: number,
        defaultCharacterWidthVirtualPixels: number,
        characterWidthVirtualPixelsOverrides: { [character: string]: number }
    )

    /** Writes given text to a scene object as static sprites using this Font.
     * @param {Viewport | Group} parent The scene object to write the given text to.
     * @param {string} text The text to write.
     * @param {HorizontalAlignment} horizontalAlignment The horizontal alignment of the text; Middle and Right will extend left of the given position.  Defaults to Left.
     * @param {VerticalAlignment} verticalAlignment The vertical alignment of the text; Middle and Bottom will extend above the given position.  Defaults to Top.
     * @param {integer} leftVirtualPixels The number of horizontal virtual pixels between the point text is drawn from and the origin of the parent scene object.  Defaults to 0.
     * @param {integer} topVirtualPixels The number of vertical virtual pixels between the point text is drawn from and the origin of the parent scene object.  Defaults to 0.
     */
    Write(parent: Viewport | Group, text: string, horizontalAlignment?: HorizontalAlignment, verticalAlignment?: VerticalAlignment, leftVirtualPixels?: number, topVirtualPixels?: number): void

    /** Calculates the width of a given string in virtual pixels when rendered using this Font.
     * @param {string} text The text to calculate the width of when rendered using this Font.
     * @returns {integer} The width of the given string in virtual pixels when rendered using this font.
     */
    WidthVirtualPixels(text: string): number

    /** Calculates the height of a given string in virtual pixels when rendered using this Font.
     * @param {string} text The text to calculate the height of when rendered using this Font.
     * @returns {integer} The height of the given string in virtual pixels when rendered using this font.
     */
    HeightVirtualPixels(text: string): number

    /** Inserts line breaks to wrap a given string to a given number of virtual pixels in width when rendered using this Font.
     * @param {string} text The text to wrap.
     * @param {integer} widthVirtualPixels The number of horizontal virtual pixels to wrap the text to.
     * @returns {string} The given text, including line breaks to wrap it to the given number of virtual pixels in width when rendered using this Font.
     */
    Wrap(text: string, widthVirtualPixels: number): string
}
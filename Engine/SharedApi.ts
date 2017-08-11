/// <reference path="Api.ts" />

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
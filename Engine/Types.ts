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

// This is a workaround for JSON https://github.com/Microsoft/TypeScript/issues/3496#issuecomment-128553540
/** This type is part of Json, and is required to implement Json under TypeScript. */
interface JsonArray extends Array<Json> { }

/** Defines types which can be serialized to JSON. */
type Json = string | number | boolean | JsonArray | { [x: string]: Json; } | null

/** The types of transitions which may be applied. */
declare const enum TransitionType {
    /** The screen fades to black to perform a transition. */
    FadeToBlack,

    /** The screen fades to white to perform a transition. */
    FadeToWhite
}
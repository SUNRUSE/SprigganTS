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

/** Defines the entry or exit of a transition. */
type TransitionStep = {
    /** The number of seconds spent during this step of the transition. */
    readonly DurationSeconds: number

    /** The rectangles to draw during this transition. */
    readonly Rectangles: {
        /** The state of this rectangle at the start of this step.  All values are linearly interpolated. */
        readonly From: TransitionStepRectangleKeyFrame
        /** The state of this rectangle at the end of this step.  All values are linearly interpolated. */
        readonly To: TransitionStepRectangleKeyFrame
    }[]
}

/** Defines the state of a transition rectangle at the start or end of a step. */
type TransitionStepRectangleKeyFrame = {
    /** The position of the rectangle's left border, where -1 is the screen's left border, and 1 is the screen's right border. */
    readonly LeftSignedUnitInterval: number

    /** The position of the rectangle's right border, where -1 is the screen's left border, and 1 is the screen's right border. */
    readonly RightSignedUnitInterval: number

    /** The position of the rectangle's top border, where -1 is the screen's top border, and 1 is the screen's bottom border. */
    readonly TopSignedUnitInterval: number

    /** The position of the rectangle's bottom border, where -1 is the screen's top border, and 1 is the screen's bottom border. */
    readonly BottomSignedUnitInterval: number

    /** The intensity of the red channel, where 0 is fully off and 1 is fully on. */
    readonly RedUnitInterval: number

    /** The intensity of the green channel, where 0 is fully off and 1 is fully on. */
    readonly GreenUnitInterval: number

    /** The intensity of the blue channel, where 0 is fully off and 1 is fully on. */
    readonly BlueUnitInterval: number

    /** The opacity of the rectangle, where 0 is fully transparent and 1 is fully opaque. */
    readonly OpacityUnitInterval: number
}
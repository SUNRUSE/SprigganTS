/// <reference path="Fonts/Big.ts" />
/// <reference path="Buttons.ts" />
/// <reference path="SharedTransitionSteps.ts" />
/// <reference path="DemoMenu.ts" />

Transition({
    DurationSeconds: 0,
    Rectangles: []
}, FadeInTransitionStep, () => DemoMenu())
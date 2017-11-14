const FadeOutTransitionStep: TransitionStep = {
    DurationSeconds: 0.25,
    Rectangles: [{
        From: {
            LeftSignedUnitInterval: -1,
            RightSignedUnitInterval: 1,
            BottomSignedUnitInterval: 1,
            TopSignedUnitInterval: -1,
            RedUnitInterval: 0,
            GreenUnitInterval: 0,
            BlueUnitInterval: 0,
            OpacityUnitInterval: 0
        },
        To: {
            LeftSignedUnitInterval: -1,
            RightSignedUnitInterval: 1,
            BottomSignedUnitInterval: 1,
            TopSignedUnitInterval: -1,
            RedUnitInterval: 0,
            GreenUnitInterval: 0,
            BlueUnitInterval: 0,
            OpacityUnitInterval: 1
        }
    }]
}

const FadeInTransitionStep: TransitionStep = {
    DurationSeconds: 0.25,
    Rectangles: [{
        From: {
            LeftSignedUnitInterval: -1,
            RightSignedUnitInterval: 1,
            BottomSignedUnitInterval: 1,
            TopSignedUnitInterval: -1,
            RedUnitInterval: 0,
            GreenUnitInterval: 0,
            BlueUnitInterval: 0,
            OpacityUnitInterval: 1
        },
        To: {
            LeftSignedUnitInterval: -1,
            RightSignedUnitInterval: 1,
            BottomSignedUnitInterval: 1,
            TopSignedUnitInterval: -1,
            RedUnitInterval: 0,
            GreenUnitInterval: 0,
            BlueUnitInterval: 0,
            OpacityUnitInterval: 0
        }
    }]
}
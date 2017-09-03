new Demo("Transitions", (group) => {
    Background.Set(Content.Demos.Transitions.Background)
    let transitions = 0
    let textGroup: Group | undefined
    function RefreshText() {
        if (textGroup) textGroup.Delete()
        textGroup = new Group(group)
        FontBig.Write(textGroup, `You have seen ${transitions++} transition(s).`, HorizontalAlignment.Middle, VerticalAlignment.Middle, WidthVirtualPixels / 2, HeightVirtualPixels / 2)
    }
    RefreshText()

    const transitionTypes = [{
        Label: "Fade Out",
        Entry: {
            DurationSeconds: 0.5,
            Rectangles: [{
                From: {
                    LeftSignedUnitInterval: -1,
                    RightSignedUnitInterval: 1,
                    TopSignedUnitInterval: -1,
                    BottomSignedUnitInterval: 1,
                    RedUnitInterval: 0,
                    GreenUnitInterval: 0,
                    BlueUnitInterval: 0,
                    OpacityUnitInterval: 0
                },
                To: {
                    LeftSignedUnitInterval: -1,
                    RightSignedUnitInterval: 1,
                    TopSignedUnitInterval: -1,
                    BottomSignedUnitInterval: 1,
                    RedUnitInterval: 0,
                    GreenUnitInterval: 0,
                    BlueUnitInterval: 0,
                    OpacityUnitInterval: 1
                }
            }]
        },
        Exit: {
            DurationSeconds: 0.5,
            Rectangles: [{
                From: {
                    LeftSignedUnitInterval: -1,
                    RightSignedUnitInterval: 1,
                    TopSignedUnitInterval: -1,
                    BottomSignedUnitInterval: 1,
                    RedUnitInterval: 0,
                    GreenUnitInterval: 0,
                    BlueUnitInterval: 0,
                    OpacityUnitInterval: 1
                },
                To: {
                    LeftSignedUnitInterval: -1,
                    RightSignedUnitInterval: 1,
                    TopSignedUnitInterval: -1,
                    BottomSignedUnitInterval: 1,
                    RedUnitInterval: 0,
                    GreenUnitInterval: 0,
                    BlueUnitInterval: 0,
                    OpacityUnitInterval: 0
                }
            }]
        }
    }, {
        Label: "Curtains",
        Entry: {
            DurationSeconds: 0.5,
            Rectangles: [{
                From: {
                    LeftSignedUnitInterval: -1,
                    RightSignedUnitInterval: -1,
                    TopSignedUnitInterval: -1,
                    BottomSignedUnitInterval: 1,
                    RedUnitInterval: 0,
                    GreenUnitInterval: 0,
                    BlueUnitInterval: 0,
                    OpacityUnitInterval: 1
                },
                To: {
                    LeftSignedUnitInterval: -1,
                    RightSignedUnitInterval: 0,
                    TopSignedUnitInterval: -1,
                    BottomSignedUnitInterval: 1,
                    RedUnitInterval: 0,
                    GreenUnitInterval: 0,
                    BlueUnitInterval: 0,
                    OpacityUnitInterval: 1
                }
            }, {
                From: {
                    LeftSignedUnitInterval: 1,
                    RightSignedUnitInterval: 1,
                    TopSignedUnitInterval: -1,
                    BottomSignedUnitInterval: 1,
                    RedUnitInterval: 0,
                    GreenUnitInterval: 0,
                    BlueUnitInterval: 0,
                    OpacityUnitInterval: 1
                },
                To: {
                    LeftSignedUnitInterval: 0,
                    RightSignedUnitInterval: 1,
                    TopSignedUnitInterval: -1,
                    BottomSignedUnitInterval: 1,
                    RedUnitInterval: 0,
                    GreenUnitInterval: 0,
                    BlueUnitInterval: 0,
                    OpacityUnitInterval: 1
                }
            }]
        },
        Exit: {
            DurationSeconds: 0.5,
            Rectangles: [{
                From: {
                    LeftSignedUnitInterval: -1,
                    RightSignedUnitInterval: 0,
                    TopSignedUnitInterval: -1,
                    BottomSignedUnitInterval: 1,
                    RedUnitInterval: 0,
                    GreenUnitInterval: 0,
                    BlueUnitInterval: 0,
                    OpacityUnitInterval: 1
                },
                To: {
                    LeftSignedUnitInterval: -1,
                    RightSignedUnitInterval: -1,
                    TopSignedUnitInterval: -1,
                    BottomSignedUnitInterval: 1,
                    RedUnitInterval: 0,
                    GreenUnitInterval: 0,
                    BlueUnitInterval: 0,
                    OpacityUnitInterval: 1
                }
            }, {
                From: {
                    LeftSignedUnitInterval: 0,
                    RightSignedUnitInterval: 1,
                    TopSignedUnitInterval: -1,
                    BottomSignedUnitInterval: 1,
                    RedUnitInterval: 0,
                    GreenUnitInterval: 0,
                    BlueUnitInterval: 0,
                    OpacityUnitInterval: 1
                },
                To: {
                    LeftSignedUnitInterval: 1,
                    RightSignedUnitInterval: 1,
                    TopSignedUnitInterval: -1,
                    BottomSignedUnitInterval: 1,
                    RedUnitInterval: 0,
                    GreenUnitInterval: 0,
                    BlueUnitInterval: 0,
                    OpacityUnitInterval: 1
                }
            }]
        }
    }, {
        Label: "TV",
        Entry: {
            DurationSeconds: 0.5,
            Rectangles: [{
                From: {
                    LeftSignedUnitInterval: -1,
                    RightSignedUnitInterval: 1,
                    TopSignedUnitInterval: -1,
                    BottomSignedUnitInterval: 1,
                    RedUnitInterval: 0,
                    GreenUnitInterval: 0,
                    BlueUnitInterval: 0,
                    OpacityUnitInterval: 1
                },
                To: {
                    LeftSignedUnitInterval: -1,
                    RightSignedUnitInterval: 1,
                    TopSignedUnitInterval: -1,
                    BottomSignedUnitInterval: 1,
                    RedUnitInterval: 0,
                    GreenUnitInterval: 0,
                    BlueUnitInterval: 0,
                    OpacityUnitInterval: 1
                }
            }, {
                From: {
                    LeftSignedUnitInterval: -1,
                    RightSignedUnitInterval: -0.75,
                    TopSignedUnitInterval: -1,
                    BottomSignedUnitInterval: 0.5,
                    RedUnitInterval: 1,
                    GreenUnitInterval: 1,
                    BlueUnitInterval: 1,
                    OpacityUnitInterval: 1
                },
                To: {
                    LeftSignedUnitInterval: -1,
                    RightSignedUnitInterval: -0.75,
                    TopSignedUnitInterval: 0,
                    BottomSignedUnitInterval: 0,
                    RedUnitInterval: 0,
                    GreenUnitInterval: 0,
                    BlueUnitInterval: 0,
                    OpacityUnitInterval: 1
                }
            }, {
                From: {
                    LeftSignedUnitInterval: -0.75,
                    RightSignedUnitInterval: -0.5,
                    TopSignedUnitInterval: -1,
                    BottomSignedUnitInterval: 0.5,
                    RedUnitInterval: 1,
                    GreenUnitInterval: 1,
                    BlueUnitInterval: 0,
                    OpacityUnitInterval: 1
                },
                To: {
                    LeftSignedUnitInterval: -0.75,
                    RightSignedUnitInterval: -0.5,
                    TopSignedUnitInterval: 0,
                    BottomSignedUnitInterval: 0,
                    RedUnitInterval: 0,
                    GreenUnitInterval: 0,
                    BlueUnitInterval: 0,
                    OpacityUnitInterval: 1
                }
            }, {
                From: {
                    LeftSignedUnitInterval: -0.5,
                    RightSignedUnitInterval: -0.25,
                    TopSignedUnitInterval: -1,
                    BottomSignedUnitInterval: 0.5,
                    RedUnitInterval: 0,
                    GreenUnitInterval: 1,
                    BlueUnitInterval: 1,
                    OpacityUnitInterval: 1
                },
                To: {
                    LeftSignedUnitInterval: -0.5,
                    RightSignedUnitInterval: -0.25,
                    TopSignedUnitInterval: 0,
                    BottomSignedUnitInterval: 0,
                    RedUnitInterval: 0,
                    GreenUnitInterval: 0,
                    BlueUnitInterval: 0,
                    OpacityUnitInterval: 1
                }
            }, {
                From: {
                    LeftSignedUnitInterval: -0.25,
                    RightSignedUnitInterval: 0,
                    TopSignedUnitInterval: -1,
                    BottomSignedUnitInterval: 0.5,
                    RedUnitInterval: 0,
                    GreenUnitInterval: 1,
                    BlueUnitInterval: 0,
                    OpacityUnitInterval: 1
                },
                To: {
                    LeftSignedUnitInterval: -0.25,
                    RightSignedUnitInterval: 0,
                    TopSignedUnitInterval: 0,
                    BottomSignedUnitInterval: 0,
                    RedUnitInterval: 0,
                    GreenUnitInterval: 0,
                    BlueUnitInterval: 0,
                    OpacityUnitInterval: 1
                }
            }, {
                From: {
                    LeftSignedUnitInterval: 0,
                    RightSignedUnitInterval: 0.25,
                    TopSignedUnitInterval: -1,
                    BottomSignedUnitInterval: 0.5,
                    RedUnitInterval: 1,
                    GreenUnitInterval: 0,
                    BlueUnitInterval: 1,
                    OpacityUnitInterval: 1
                },
                To: {
                    LeftSignedUnitInterval: 0,
                    RightSignedUnitInterval: 0.25,
                    TopSignedUnitInterval: 0,
                    BottomSignedUnitInterval: 0,
                    RedUnitInterval: 0,
                    GreenUnitInterval: 0,
                    BlueUnitInterval: 0,
                    OpacityUnitInterval: 1
                }
            }, {
                From: {
                    LeftSignedUnitInterval: 0.25,
                    RightSignedUnitInterval: 0.5,
                    TopSignedUnitInterval: -1,
                    BottomSignedUnitInterval: 0.5,
                    RedUnitInterval: 1,
                    GreenUnitInterval: 0,
                    BlueUnitInterval: 0,
                    OpacityUnitInterval: 1
                },
                To: {
                    LeftSignedUnitInterval: 0.25,
                    RightSignedUnitInterval: 0.5,
                    TopSignedUnitInterval: 0,
                    BottomSignedUnitInterval: 0,
                    RedUnitInterval: 0,
                    GreenUnitInterval: 0,
                    BlueUnitInterval: 0,
                    OpacityUnitInterval: 1
                }
            }, {
                From: {
                    LeftSignedUnitInterval: 0.5,
                    RightSignedUnitInterval: 0.75,
                    TopSignedUnitInterval: -1,
                    BottomSignedUnitInterval: 0.5,
                    RedUnitInterval: 0,
                    GreenUnitInterval: 0,
                    BlueUnitInterval: 1,
                    OpacityUnitInterval: 1
                },
                To: {
                    LeftSignedUnitInterval: 0.5,
                    RightSignedUnitInterval: 0.75,
                    TopSignedUnitInterval: 0,
                    BottomSignedUnitInterval: 0,
                    RedUnitInterval: 0,
                    GreenUnitInterval: 0,
                    BlueUnitInterval: 0,
                    OpacityUnitInterval: 1
                }
            }, {
                From: {
                    LeftSignedUnitInterval: -1,
                    RightSignedUnitInterval: -0.75,
                    TopSignedUnitInterval: 0.5,
                    BottomSignedUnitInterval: 0.75,
                    RedUnitInterval: 0,
                    GreenUnitInterval: 0,
                    BlueUnitInterval: 1,
                    OpacityUnitInterval: 1
                },
                To: {
                    LeftSignedUnitInterval: -1,
                    RightSignedUnitInterval: -0.75,
                    TopSignedUnitInterval: 0,
                    BottomSignedUnitInterval: 0,
                    RedUnitInterval: 0,
                    GreenUnitInterval: 0,
                    BlueUnitInterval: 0,
                    OpacityUnitInterval: 1
                }
            }, {
                From: {
                    LeftSignedUnitInterval: -0.5,
                    RightSignedUnitInterval: -0.25,
                    TopSignedUnitInterval: 0.5,
                    BottomSignedUnitInterval: 0.75,
                    RedUnitInterval: 1,
                    GreenUnitInterval: 0,
                    BlueUnitInterval: 1,
                    OpacityUnitInterval: 1
                },
                To: {
                    LeftSignedUnitInterval: -0.5,
                    RightSignedUnitInterval: -0.25,
                    TopSignedUnitInterval: 0,
                    BottomSignedUnitInterval: 0,
                    RedUnitInterval: 0,
                    GreenUnitInterval: 0,
                    BlueUnitInterval: 0,
                    OpacityUnitInterval: 1
                }
            }, {
                From: {
                    LeftSignedUnitInterval: 0,
                    RightSignedUnitInterval: 0.25,
                    TopSignedUnitInterval: 0.5,
                    BottomSignedUnitInterval: 0.75,
                    RedUnitInterval: 0,
                    GreenUnitInterval: 1,
                    BlueUnitInterval: 1,
                    OpacityUnitInterval: 1
                },
                To: {
                    LeftSignedUnitInterval: 0,
                    RightSignedUnitInterval: 0.25,
                    TopSignedUnitInterval: 0,
                    BottomSignedUnitInterval: 0,
                    RedUnitInterval: 0,
                    GreenUnitInterval: 0,
                    BlueUnitInterval: 0,
                    OpacityUnitInterval: 1
                }
            }, {
                From: {
                    LeftSignedUnitInterval: 0.5,
                    RightSignedUnitInterval: 0.75,
                    TopSignedUnitInterval: 0.5,
                    BottomSignedUnitInterval: 0.75,
                    RedUnitInterval: 0.5,
                    GreenUnitInterval: 0.5,
                    BlueUnitInterval: 0.5,
                    OpacityUnitInterval: 1
                },
                To: {
                    LeftSignedUnitInterval: 0.5,
                    RightSignedUnitInterval: 0.75,
                    TopSignedUnitInterval: 0,
                    BottomSignedUnitInterval: 0,
                    RedUnitInterval: 0,
                    GreenUnitInterval: 0,
                    BlueUnitInterval: 0,
                    OpacityUnitInterval: 1
                }
            }, {
                From: {
                    LeftSignedUnitInterval: 0.75,
                    RightSignedUnitInterval: 1,
                    TopSignedUnitInterval: 0.5,
                    BottomSignedUnitInterval: 0.75,
                    RedUnitInterval: 1,
                    GreenUnitInterval: 1,
                    BlueUnitInterval: 1,
                    OpacityUnitInterval: 1
                },
                To: {
                    LeftSignedUnitInterval: 0.75,
                    RightSignedUnitInterval: 1,
                    TopSignedUnitInterval: 0,
                    BottomSignedUnitInterval: 0,
                    RedUnitInterval: 0,
                    GreenUnitInterval: 0,
                    BlueUnitInterval: 0,
                    OpacityUnitInterval: 1
                }
            }]
        },
        Exit: {
            DurationSeconds: 0.125,
            Rectangles: [{
                From: {
                    LeftSignedUnitInterval: -1,
                    RightSignedUnitInterval: 1,
                    TopSignedUnitInterval: 0,
                    BottomSignedUnitInterval: 0,
                    RedUnitInterval: 1,
                    GreenUnitInterval: 1,
                    BlueUnitInterval: 1,
                    OpacityUnitInterval: 1
                },
                To: {
                    LeftSignedUnitInterval: -1,
                    RightSignedUnitInterval: 1,
                    TopSignedUnitInterval: -1,
                    BottomSignedUnitInterval: 1,
                    RedUnitInterval: 1,
                    GreenUnitInterval: 1,
                    BlueUnitInterval: 1,
                    OpacityUnitInterval: 0
                }
            }, {
                From: {
                    LeftSignedUnitInterval: -1,
                    RightSignedUnitInterval: 1,
                    TopSignedUnitInterval: -1,
                    BottomSignedUnitInterval: 0,
                    RedUnitInterval: 0,
                    GreenUnitInterval: 0,
                    BlueUnitInterval: 0,
                    OpacityUnitInterval: 1
                },
                To: {
                    LeftSignedUnitInterval: -1,
                    RightSignedUnitInterval: 1,
                    TopSignedUnitInterval: -1,
                    BottomSignedUnitInterval: -1,
                    RedUnitInterval: 0,
                    GreenUnitInterval: 0,
                    BlueUnitInterval: 0,
                    OpacityUnitInterval: 1
                }
            }, {
                From: {
                    LeftSignedUnitInterval: -1,
                    RightSignedUnitInterval: 1,
                    TopSignedUnitInterval: 0,
                    BottomSignedUnitInterval: 1,
                    RedUnitInterval: 0,
                    GreenUnitInterval: 0,
                    BlueUnitInterval: 0,
                    OpacityUnitInterval: 1
                },
                To: {
                    LeftSignedUnitInterval: -1,
                    RightSignedUnitInterval: 1,
                    TopSignedUnitInterval: 1,
                    BottomSignedUnitInterval: 1,
                    RedUnitInterval: 0,
                    GreenUnitInterval: 0,
                    BlueUnitInterval: 0,
                    OpacityUnitInterval: 1
                }
            }]
        }
    }]
    for (const transitionType of transitionTypes) {
        const buttonGroup = new Group(group, () => {
            staticSprite.Play(Content.Buttons.Narrow.Pressed)
            Transition(transitionType.Entry, transitionType.Exit, RefreshText)
        })
        buttonGroup.Move(IndexOf(transitionTypes, transitionType) * (WidthVirtualPixels - ButtonNarrowWidth) / (transitionTypes.length - 1) + ButtonNarrowWidth / 2, HeightVirtualPixels - ButtonHeight / 2)
        const staticSprite = new Sprite(buttonGroup)
        staticSprite.Loop(Content.Buttons.Narrow.Unpressed)
        FontBig.Write(buttonGroup, transitionType.Label, HorizontalAlignment.Middle, VerticalAlignment.Middle)
    }

    return () => { Background.Remove() }
})
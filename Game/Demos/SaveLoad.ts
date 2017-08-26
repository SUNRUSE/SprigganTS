new Demo("Save and Load", (group) => {
    type Saved = { OpenedTimes: number }

    const loaded = Load<Saved>("Name")
    const data = loaded || { OpenedTimes: 0 }
    data.OpenedTimes++
    const saved = Save("Name", data)

    let text = `This demo has been opened ${data.OpenedTimes} time(s).\n\nThis persists between runs.`
    if (!loaded) text += "\n\nA previous save could not be loaded."
    if (!saved) text += "\n\nThis information could not be saved."

    FontBig.Write(group, text, HorizontalAlignment.Middle, VerticalAlignment.Middle, WidthVirtualPixels / 2, HeightVirtualPixels / 2)

    return () => { }
})
function SaveLoadDemo() {
    const middleViewport = new Viewport()

    type Saved = { OpenedTimes: number }

    const loaded = Load<Saved>("Name")
    const data = loaded || { OpenedTimes: 0 }
    data.OpenedTimes++
    const saved = Save("Name", data)

    let text = ""
    if (SaveAndLoadAvailable())
        text += "Save and load should be available."
    else
        text += "Save and load are not available."
    text += `\n\nThis demo has been opened ${data.OpenedTimes} time(s).\n\nThis should persist between runs.`
    if (!loaded) text += "\n\nA previous save could not be loaded."
    if (!saved) text += "\n\nThis information could not be saved."

    FontBig.Write(middleViewport, text, HorizontalAlignment.Middle, VerticalAlignment.Middle, WidthVirtualPixels / 2, HeightVirtualPixels / 2)

    return () => middleViewport.Delete()
}
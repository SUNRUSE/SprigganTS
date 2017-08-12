class Font {
    readonly CharacterSpriteFrames: { [character: string]: SpriteFrame }
    readonly LineSpacingVirtualPixels: number
    readonly CapHeightVirtualPixels: number
    readonly KerningVirtualPixels: number
    readonly DefaultCharacterWidthVirtualPixels: number
    readonly CharacterWidthVirtualPixelsOverrides: { [character: string]: number }

    constructor(
        characterSpriteFrames: { [character: string]: SpriteFrame },
        lineSpacingVirtualPixels: number,
        capHeightVirtualPixels: number,
        kerningVirtualPixels: number,
        defaultCharacterWidthVirtualPixels: number,
        characterWidthVirtualPixelsOverrides: { [character: string]: number }
    ) {
        this.CharacterSpriteFrames = characterSpriteFrames
        this.LineSpacingVirtualPixels = lineSpacingVirtualPixels
        this.CapHeightVirtualPixels = capHeightVirtualPixels
        this.KerningVirtualPixels = kerningVirtualPixels
        this.DefaultCharacterWidthVirtualPixels = defaultCharacterWidthVirtualPixels
        this.CharacterWidthVirtualPixelsOverrides = characterWidthVirtualPixelsOverrides
    }

    Write(to: Viewport | Group, text: string, horizontalAlignment: HorizontalAlignment = HorizontalAlignment.Left, verticalAlignment: VerticalAlignment = VerticalAlignment.Top, leftVirtualPixels = 0, topVirtualPixels = 0): void {
        switch (verticalAlignment) {
            case VerticalAlignment.Middle:
                topVirtualPixels -= this.HeightVirtualPixels(text) / 2
                break
            case VerticalAlignment.Bottom:
                topVirtualPixels -= this.HeightVirtualPixels(text)
                break
        }
        if (horizontalAlignment == HorizontalAlignment.Left) {
            let trackX = leftVirtualPixels
            for (let i = 0; i < text.length; i++) {
                const character = text.charAt(i)
                if (character == "\n") {
                    trackX = leftVirtualPixels
                    topVirtualPixels += this.CapHeightVirtualPixels
                    topVirtualPixels += this.LineSpacingVirtualPixels
                } else {
                    const spriteFrame = this.CharacterSpriteFrames[character]
                    if (spriteFrame) AddStaticSprite(to, spriteFrame, trackX, topVirtualPixels)
                    let width = this.CharacterWidthVirtualPixelsOverrides[character]
                    if (width === undefined) width = this.DefaultCharacterWidthVirtualPixels
                    trackX += width
                    trackX += this.KerningVirtualPixels
                }
            }
        } else {
            let lineWidth = 0
            let lineStarted = 0
            for (let i = 0; i <= text.length; i++) {
                const character = i < text.length ? text.charAt(i) : "\n"
                if (character == "\n") {
                    let trackX = leftVirtualPixels - lineWidth / (horizontalAlignment == HorizontalAlignment.Middle ? 2 : 1)
                    for (let j = lineStarted; j < i; j++) {
                        const drawCharacter = text.charAt(j)
                        const spriteFrame = this.CharacterSpriteFrames[drawCharacter]
                        if (spriteFrame) AddStaticSprite(to, spriteFrame, trackX, topVirtualPixels)
                        let width = this.CharacterWidthVirtualPixelsOverrides[drawCharacter]
                        if (width === undefined) width = this.DefaultCharacterWidthVirtualPixels
                        trackX += width
                        trackX += this.KerningVirtualPixels
                    }
                    lineWidth = 0
                    lineStarted = i + 1
                    topVirtualPixels += this.CapHeightVirtualPixels
                    topVirtualPixels += this.LineSpacingVirtualPixels
                } else {
                    let width = this.CharacterWidthVirtualPixelsOverrides[character]
                    if (width === undefined) width = this.DefaultCharacterWidthVirtualPixels
                    lineWidth += width
                    if (i != lineStarted) lineWidth += this.KerningVirtualPixels
                }
            }
        }
    }

    WidthVirtualPixels(text: string): number {
        let thisLine = 0
        let thisLineIncludingWhitespace = 0
        let firstCharacterOnLine = true
        let widest = 0
        for (let i = 0; i < text.length; i++) {
            const character = text.charAt(i)
            if (character == "\n") {
                widest = Math.max(thisLine, widest)
                firstCharacterOnLine = true
                thisLineIncludingWhitespace = 0
                thisLine = 0
            } else {
                let width = this.CharacterWidthVirtualPixelsOverrides[character]
                if (width === undefined) width = this.DefaultCharacterWidthVirtualPixels
                thisLineIncludingWhitespace += width
                if (!firstCharacterOnLine) thisLineIncludingWhitespace += this.KerningVirtualPixels
                firstCharacterOnLine = false
                if (this.CharacterSpriteFrames[character]) thisLine = thisLineIncludingWhitespace
            }
        }
        return Math.max(thisLine, widest)
    }

    HeightVirtualPixels(text: string): number {
        let lines = 0
        let linesIncludingBlank = 1
        for (let i = 0; i < text.length; i++) {
            const character = text.charAt(i)
            if (character == "\n") {
                linesIncludingBlank++
            } else {
                if (this.CharacterSpriteFrames[character]) lines = linesIncludingBlank
            }
        }
        return lines * this.CapHeightVirtualPixels + (Math.max(0, lines - 1) * this.LineSpacingVirtualPixels)
    }

    Wrap(text: string, widthVirtualPixels: number): string {
        let lineWidth = 0
        let wordWidth = 0
        let word = ""
        let output = ""
        for (let i = 0; i < text.length; i++) {
            const character = text.charAt(i)
            if (character == "\n") {
                lineWidth = 0
                wordWidth = 0
                output += word
                output += "\n"
                word = ""
            } else {
                let characterWidth = this.CharacterWidthVirtualPixelsOverrides[character]
                if (characterWidth === undefined) characterWidth = this.DefaultCharacterWidthVirtualPixels
                if (this.CharacterSpriteFrames[character]) {
                    if (lineWidth + wordWidth + characterWidth > widthVirtualPixels) {
                        if (word || lineWidth) {
                            if (lineWidth && wordWidth + characterWidth < widthVirtualPixels) {
                                output += "\n"
                                word += character
                                wordWidth += characterWidth + this.KerningVirtualPixels
                            } else {
                                output += word
                                output += "\n"
                                if (character != "-") output += "-"
                                word = character
                                let dashWidth = this.CharacterWidthVirtualPixelsOverrides["-"]
                                if (dashWidth === undefined) dashWidth = this.DefaultCharacterWidthVirtualPixels
                                wordWidth = characterWidth + dashWidth + this.KerningVirtualPixels
                            }
                        } else {
                            output += character
                            output += "\n"
                        }
                        lineWidth = 0
                    } else {
                        if (IndexOf(["-", "+", "=", ";", ":", "@", "#", "~", ",", "."], character) != -1) {
                            output += word
                            output += character
                            lineWidth += wordWidth + characterWidth + this.KerningVirtualPixels
                            word = ""
                            wordWidth = 0
                        } else {
                            wordWidth += characterWidth + this.KerningVirtualPixels
                            word += character
                        }
                    }
                } else {
                    if (word) {
                        lineWidth += wordWidth
                        output += word
                        word = ""
                        wordWidth = 0
                    }
                    if (lineWidth + characterWidth > widthVirtualPixels) {
                        output += "\n"
                        lineWidth = 0
                    } else {
                        output += character
                        lineWidth += characterWidth + this.KerningVirtualPixels
                    }
                }
            }
        }
        if (word) output += word
        return output
    }
}
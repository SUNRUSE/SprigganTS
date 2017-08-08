class Font {
    readonly CharacterSpriteFrames: { [character: string]: SpriteFrame | SpriteFrame[] }
    readonly LineSpacingPixels: number
    readonly LineHeightPixels: number
    readonly CharacterSpacingPixels: number
    readonly DefaultCharacterWidth: number
    readonly CharacterWidthOverrides: { [character: string]: number }

    constructor(
        characterSpriteFrames: { [character: string]: SpriteFrame | SpriteFrame[] },
        lineSpacingPixels: number,
        lineHeightPixels: number,
        characterSpacingPixels: number,
        defaultCharacterWidth: number,
        characterWidthOverrides: { [character: string]: number }
    ) {
        this.CharacterSpriteFrames = characterSpriteFrames
        this.LineSpacingPixels = lineSpacingPixels
        this.LineHeightPixels = lineHeightPixels
        this.CharacterSpacingPixels = characterSpacingPixels
        this.DefaultCharacterWidth = defaultCharacterWidth
        this.CharacterWidthOverrides = characterWidthOverrides
    }

    readonly Write = (to: Scene.Viewport | Scene.Group, text: string, horizontalAlignment: HorizontalAlignment = "Left", verticalAlignment: VerticalAlignment = "Top", x = 0, y = 0) => {
        switch (verticalAlignment) {
            case "Middle":
                y -= this.CalculateHeight(text) / 2
                break
            case "Bottom":
                y -= this.CalculateHeight(text)
                break
        }
        if (horizontalAlignment == "Left") {
            let trackX = x
            for (let i = 0; i < text.length; i++) {
                const character = text.charAt(i)
                if (character == "\n") {
                    trackX = x
                    y += this.LineHeightPixels
                    y += this.LineSpacingPixels
                } else {
                    const spriteFrame = this.CharacterSpriteFrames[character]
                    if (spriteFrame) {
                        const sprite = new Scene.Sprite(to)
                        sprite.Loop(spriteFrame)
                        sprite.Move(trackX, y)
                    }
                    let width = this.CharacterWidthOverrides[character]
                    if (width === undefined) width = this.DefaultCharacterWidth
                    trackX += width
                    trackX += this.CharacterSpacingPixels
                }
            }
        } else {
            let lineWidth = 0
            let lineStarted = 0
            for (let i = 0; i <= text.length; i++) {
                const character = i < text.length ? text.charAt(i) : "\n"
                if (character == "\n") {
                    let trackX = x - lineWidth / (horizontalAlignment == "Middle" ? 2 : 1)
                    for (let j = lineStarted; j < i; j++) {
                        const drawCharacter = text.charAt(j)
                        const spriteFrame = this.CharacterSpriteFrames[drawCharacter]
                        if (spriteFrame) {
                            const sprite = new Scene.Sprite(to)
                            sprite.Loop(spriteFrame)
                            sprite.Move(trackX, y)
                        }
                        let width = this.CharacterWidthOverrides[drawCharacter]
                        if (width === undefined) width = this.DefaultCharacterWidth
                        trackX += width
                        trackX += this.CharacterSpacingPixels
                    }
                    lineWidth = 0
                    lineStarted = i + 1
                    y += this.LineHeightPixels
                    y += this.LineSpacingPixels
                } else {
                    let width = this.CharacterWidthOverrides[character]
                    if (width === undefined) width = this.DefaultCharacterWidth
                    lineWidth += width
                    if (i != lineStarted) lineWidth += this.CharacterSpacingPixels
                }
            }
        }
    }

    readonly CalculateWidth = (text: string) => {
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
                let width = this.CharacterWidthOverrides[character]
                if (width === undefined) width = this.DefaultCharacterWidth
                thisLineIncludingWhitespace += width
                if (!firstCharacterOnLine) thisLineIncludingWhitespace += this.CharacterSpacingPixels
                firstCharacterOnLine = false
                if (this.CharacterSpriteFrames[character]) thisLine = thisLineIncludingWhitespace
            }
        }
        return Math.max(thisLine, widest)
    }

    readonly CalculateHeight = (text: string) => {
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
        return lines * this.LineHeightPixels + (Math.max(0, lines - 1) * this.LineSpacingPixels)
    }

    readonly Wrap = (text: string, width: number) => {
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
                let characterWidth = this.CharacterWidthOverrides[character]
                if (characterWidth === undefined) characterWidth = this.DefaultCharacterWidth
                if (this.CharacterSpriteFrames[character]) {
                    if (lineWidth + wordWidth + characterWidth > width) {
                        if (word || lineWidth) {
                            if (lineWidth && wordWidth + characterWidth < width) {
                                output += "\n"
                                word += character
                                wordWidth += characterWidth + this.CharacterSpacingPixels
                            } else {
                                output += word
                                output += "\n"
                                if (character != "-") output += "-"
                                word = character
                                let dashWidth = this.CharacterWidthOverrides["-"]
                                if (dashWidth === undefined) dashWidth = this.DefaultCharacterWidth
                                wordWidth = characterWidth + dashWidth + this.CharacterSpacingPixels
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
                            lineWidth += wordWidth + characterWidth + this.CharacterSpacingPixels
                            word = ""
                            wordWidth = 0
                        } else {
                            wordWidth += characterWidth + this.CharacterSpacingPixels
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
                    if (lineWidth + characterWidth > width) {
                        output += "\n"
                        lineWidth = 0
                    } else {
                        output += character
                        lineWidth += characterWidth + this.CharacterSpacingPixels
                    }
                }
            }
        }
        if (word) output += word
        return output
    }
}
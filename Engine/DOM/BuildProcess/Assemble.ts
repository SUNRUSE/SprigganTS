import { Error } from "./../../../BuildContent/Misc"
import { Build, Configuration, PackedSpriteFrame, PackedBackgroundFrame } from "./../../../BuildContent/Types"
import { GenerateCodeFromContentTree, GenerateContentTreeFromBuild } from "./../../../BuildContent/Tree"

import cpr = require("cpr")
import fs = require("fs")
import path = require("path")
const rimraf = require("rimraf")
import mkdirp = require("mkdirp")
import uglifyjs = require("uglify-js")
const domprops = require("uglify-js/tools/domprops")
const favicons = require("favicons")

DeleteExistingAssembledDirectory()

function DeleteExistingAssembledDirectory() {
    console.info("Deleting the contents of \"Temp/Assembled/DOM\" if it exists...")
    rimraf("Temp/Assembled/DOM/*", (err: any) => {
        Error(err)
        ReadContent()
    })
}

let Build: Build

function ReadContent() {
    console.info("Reading content... (Temp/Content/Index.json)")
    fs.readFile("Temp/Content/Index.json", "utf8", (err, data) => {
        Error(err)
        Build = JSON.parse(data)
        ReadConfiguration()
    })
}

let Configuration: Configuration

function ReadConfiguration() {
    console.info("Reading configuration file... (Game/Configuration.json)")
    fs.readFile("Game/Configuration.json", "utf8", (err, data) => {
        Error(err)
        Configuration = JSON.parse(data)
        GenerateHeader()
    })
}

let Header: string

function GenerateHeader() {
    console.info("Generating header...")
    Header = `var WidthVirtualPixels = ${Configuration.VirtualWidth}
var HeightVirtualPixels = ${Configuration.VirtualHeight}
var ContentSpritesWidth = ${Build.PackingHeaders.sprite.AtlasWidthPixels}
var ContentSpritesHeight = ${Build.PackingHeaders.sprite.AtlasHeightPixels}`
    ReadDOMEngine()
}

let DOMEngine: string

function ReadDOMEngine() {
    console.info("Reading DOM engine JavaScript...")
    fs.readFile("Temp/Scripts/Engine/DOM.js", "utf8", (err, data) => {
        Error(err)
        DOMEngine = data
        GenerateContent()
    })
}

let Content: string

function GenerateContent() {
    console.info("Generating content scripts...")
    Content = GenerateCodeFromContentTree(GenerateContentTreeFromBuild(Build), false, {
        sprite: (spriteFrame: PackedSpriteFrame) => spriteFrame.Empty ? `new EmptySpriteFrame(${spriteFrame.DurationSeconds})` : `new SpriteFrame(${spriteFrame.AtlasLeftPixels}, ${spriteFrame.AtlasTopPixels}, ${spriteFrame.WidthPixels}, ${spriteFrame.HeightPixels}, ${spriteFrame.OffsetLeftPixels}, ${spriteFrame.OffsetTopPixels}, ${spriteFrame.DurationSeconds})`,
        background: (backgroundFrame: PackedBackgroundFrame) => backgroundFrame.Empty ? `new EmptyBackgroundFrame(${backgroundFrame.DurationSeconds})` : `new BackgroundFrame(${backgroundFrame.Id}, ${backgroundFrame.WidthPixels}, ${backgroundFrame.HeightPixels}, ${backgroundFrame.DurationSeconds})`
    })
    ReadGame()
}

let Game: string

function ReadGame() {
    console.info("Reading game JavaScript...")
    fs.readFile("Temp/Scripts/Game/Index.js", "utf8", (err, data) => {
        Error(err)
        Game = data
        ConcatenateScripts()
    })
}

let ConcatenatedScripts: string

function ConcatenateScripts() {
    console.info("Concatenating scripts...")
    ConcatenatedScripts = `${Header}
${DOMEngine}
${Content}
function StartGame() {
${Game}
}
SetLoadingMessage("Starting scripts, please wait...")`
    MinifyScripts()
}

function MinifyScripts() {
    if (process.env.NODE_ENV != "production") {
        console.info("Skipping script minification as not building for production")
    } else {
        console.info("Minifying scripts...")
        ConcatenatedScripts = uglifyjs.minify(ConcatenatedScripts, {
            compress: true,
            mangle: {
                toplevel: true,
                properties: {
                    keep_quoted: true,
                    builtins: true,
                    reserved: domprops
                }
            },
            ie8: true
        } as any /* TODO: type definitions missing options */).code
    }
    CreateAssembledDirectory()
}

function CreateAssembledDirectory() {
    console.info("Creating \"Temp/Assembled/DOM\" if it does not exist...")
    mkdirp("Temp/Assembled/DOM", err => {
        Error(err)
        CreateScript()
    })
}

function CreateScript() {
    console.info("Writing \"Temp/Assembled/DOM/index.js\"...")
    fs.writeFile("Temp/Assembled/DOM/index.js", ConcatenatedScripts, "utf8", err => {
        Error(err)
        GenerateFavicons()
    })
}

let Favicons: {
    readonly images: {
        readonly name: string
        readonly contents: Buffer
    }[]
    readonly files: {
        readonly name: string
        readonly contents: string
    }[]
    readonly html: string[]
} = {
        images: [],
        files: [],
        html: []
    }

function GenerateFavicons() {
    if (process.env.NODE_ENV != "production") {
        console.info("Skipping favicon generation as not building for production")
        CreateHtml()
    } else {
        console.info("Generating favicons...")
        favicons("./Game/icon.png", {
            appName: Configuration.Name,
            appDescription: null,
            developerName: null,
            developerUrl: null,
            background: "#000",
            theme_color: "#000",
            path: "",
            display: "standalone",
            orientation: "landscape",
            start_url: "/",
            version: "1.0",
            logging: false,
            online: false,
            preferOnline: false,
            icons: {
                android: true,
                appleIcon: true,
                appleStartup: true,
                coast: { offset: 25 },
                favicons: true,
                firefox: true,
                windows: true,
                yandex: true
            }
        }, (err: any, response: any) => {
            Error(err)
            Favicons = response
            let writtenImages = 0
            let writtenFiles = 0
            for (const image of Favicons.images) fs.writeFile(path.join("Temp/Assembled/DOM", image.name), image.contents, err => {
                Error(err)
                writtenImages++
                CheckDone()
            })
            for (const file of Favicons.files) fs.writeFile(path.join("Temp/Assembled/DOM", file.name), file.contents, "utf8", err => {
                Error(err)
                writtenFiles++
                CheckDone()
            })
            CheckDone()
            function CheckDone() {
                console.log(`Written ${writtenImages}/${Favicons.images.length} images and ${writtenFiles}/${Favicons.files.length} files`)
                if (writtenImages != Favicons.images.length) return
                if (writtenFiles < Favicons.files.length) return
                CreateHtml()
            }
        })
    }
}

function CreateHtml() {
    console.info("Creating index.html...")
    fs.writeFile("Temp/Assembled/DOM/index.html", `<!DOCTYPE html>
<html>

<head>
    ${Favicons.html.join("\n")}
    <title>${process.env.NODE_ENV != "production" ? "DEVELOPMENT BUILD of " : ""}${Configuration.Name}</title>
    <meta name="viewport" content="initial-scale=1, minimum-scale=1, maximum-scale=1, width=device-width, height=device-height, user-scalable=no">
</head>

<body style="background: black; color: white; font-family: sans-serif; user-select: none; cursor: default; overflow: hidden">
    <div id="LoadingMessage" style="font-size: 0.5cm; position: absolute; top: 50%; margin-top: -0.5em; line-height: 1em; left: 0; text-align: center; width: 100%;">Loading, please wait...</div>
    ${process.env.NODE_ENV != "production" ? "<blink style=\"z-index: 1; font-size: 5vmin; text-shadow: 0.0cm 0.0625cm 0.125cm black; position: absolute; left: 0; top: 0; pointer-events: none; opacity: 0.8; filter: alpha(opacity=80); animation: blink 1s step-end infinite\">DEVELOPMENT BUILD</blink><style>@keyframes blink {  67% { opacity: 0 }}</style>" : ""}
    <script src="index.js"></script>
</body>

</html>`, "utf8", err => {
            Error(err)
            CopySprites()
        })
}

function CopySprites() {
    console.info("Copying sprites...")
    cpr("Temp/Content/Packed/sprite/Atlas.png", "Temp/Assembled/DOM/sprites.png", {}, err => {
        Error(err)
        CopyBackgrounds()
    })
}

function CopyBackgrounds() {
    console.info("Copying backgrounds...")
    cpr("Temp/Content/Packed/background", "Temp/Assembled/DOM/backgrounds", {}, err => {
        Error(err)
        Done()
    })
}

function Done() {
    console.info("Done")
}
require("./Sprite/Imports/Aseprite")
require("./Sprite/Imports/Png")
require("./Background/Imports/Aseprite")
require("./Background/Imports/Png")
import { GenerateContentTreeFromBuild, GenerateCodeFromContentTree } from "./Tree"

import fs = require("fs")
import path = require("path")
const rimraf = require("rimraf")
import mkdirp = require("mkdirp")
import { ContentTypes } from "./ContentType"
import { Error, EndsWith } from "./Misc"
import { Build } from "./Types"

const imagemin = require("imagemin")
const imageminPngcrush = require("imagemin-pngcrush")

const Build: Build = {
    LastModified: {},
    ImportedContent: {},
    PackingHeaders: {},
    PackedContent: {}
}

FindFiles()

function FindFiles() {
    console.info("Finding files in the Game directory...")
    Recurse("Game", CheckForPreviousBuild)
    function Recurse(directory: string, then: () => void) {
        fs.readdir(directory, (err, filesOrDirectories) => {
            Error(err)
            function CheckNextFileOrDirectory() {
                const fileOrDirectory = filesOrDirectories.pop()
                if (!fileOrDirectory)
                    then()
                else {
                    const fullPath = path.join(directory, fileOrDirectory as string)
                    fs.stat(fullPath, (err, stats) => {
                        Error(err)
                        if (stats.isFile()) {
                            for (const contentType of ContentTypes) {
                                for (const contentTypeImport of contentType.ContentTypeImports) {
                                    if (EndsWith(fullPath, `.${contentType.FirstExtension}.${contentTypeImport.SecondExtension}`)) {
                                        Build.LastModified[fullPath] = stats.mtime.getTime()
                                    }
                                }
                            }
                            CheckNextFileOrDirectory()
                        } else if (stats.isDirectory()) Recurse(fullPath, CheckNextFileOrDirectory)
                        else CheckNextFileOrDirectory()
                    })
                }
            }
            CheckNextFileOrDirectory()
        })
    }
}

let PreviousBuild: Build = {
    LastModified: {},
    ImportedContent: {},
    PackingHeaders: {},
    PackedContent: {}
}

function CheckForPreviousBuild() {
    console.info("Checking for a previous build (Temp/Content/Index.json)...")
    fs.readFile("Temp/Content/Index.json", "utf8", (err, data) => {
        if (err && err.code == "ENOENT") {
            console.info("Previous build not completed, deleting the \"Temp/Content\" directory...")
            rimraf("Temp/Content", (err: any) => {
                Error(err)
                CompareBuilds()
            })
        }
        else {
            let failed = true
            try {
                PreviousBuild = JSON.parse(data)
                failed = false
            } catch (e) { }
            if (failed) {
                console.info("JSON file from previous build corrupted, deleting the \"Temp/Content\" directory...")
                rimraf("Temp/Content", (err: any) => {
                    Error(err)
                    CompareBuilds()
                })
            } else {
                console.info("Deleting \"Temp/Content/Index.json\" to mark build as incomplete...")
                fs.unlink("Temp/Content/Index.json", (err) => {
                    Error(err)
                    CompareBuilds()
                })
            }
        }
    })
}

let FilesCreated: string[] = []
let FilesModified: string[] = []
let FilesDeleted: string[] = []

function CompareBuilds() {
    console.info("Comparing builds...")
    for (const filename in PreviousBuild.LastModified) if (!Build.LastModified[filename]) {
        console.log(`"${filename}" has been deleted.`)
        FilesDeleted.push(filename)
    }

    for (const filename in PreviousBuild.LastModified) if (Build.LastModified[filename]) {
        if (PreviousBuild.LastModified[filename] == Build.LastModified[filename]) {
            console.log(`"${filename}" has NOT been modified between ${PreviousBuild.LastModified[filename]} and ${Build.LastModified[filename]}.`)
            for (const contentType of ContentTypes) for (const contentTypeImport of contentType.ContentTypeImports) {
                if (EndsWith(filename, `.${contentType.FirstExtension}.${contentTypeImport.SecondExtension}`)) {
                    if (!Build.ImportedContent[contentType.FirstExtension]) Build.ImportedContent[contentType.FirstExtension] = {}
                    if (!Build.ImportedContent[contentType.FirstExtension][filename]) Build.ImportedContent[contentType.FirstExtension][filename] = PreviousBuild.ImportedContent[contentType.FirstExtension][filename]
                }
            }
        } else {
            console.log(`"${filename}" has been modified between ${PreviousBuild.LastModified[filename]} and ${Build.LastModified[filename]}.`)
            FilesModified.push(filename)
        }
    }

    for (const filename in Build.LastModified) if (!PreviousBuild.LastModified[filename]) {
        console.log(`"${filename}" was created at ${Build.LastModified[filename]}.`)
        FilesCreated.push(filename)
    }

    DeleteTempFoldersForDeletedOrModifiedContent()
}

function DeleteTempFoldersForDeletedOrModifiedContent() {
    console.info("Deleting temporary folders for modified or deleted content...")
    const remaining = FilesModified.concat(FilesDeleted)
    TakeNext()
    function TakeNext() {
        const filename = remaining.pop()
        if (!filename) {
            ImportContent()
        } else {
            const directory = path.join("Temp", "Content", "Imported", filename)
            console.log(`Deleting "${directory}"...`)
            rimraf(directory, (err: any) => {
                Error(err)
                TakeNext()
            })
        }
    }
}

function ImportContent() {
    let remainingToImport = FilesModified.length + FilesCreated.length
    if (!remainingToImport) {
        console.info("There is nothing to import")
        Pack()
    } else {
        console.info("Importing content...")
        for (const filename of FilesModified.concat(FilesCreated)) {
            mkdirp(path.join("Temp", "Content", "Imported", filename), (err) => {
                Error(err)
                for (const contentType of ContentTypes) {
                    for (const contentTypeImport of contentType.ContentTypeImports) {
                        if (EndsWith(filename, `.${contentType.FirstExtension}.${contentTypeImport.SecondExtension}`)) {
                            contentTypeImport.Import(filename, imported => {
                                Build.ImportedContent[contentType.FirstExtension] = Build.ImportedContent[contentType.FirstExtension] || {}
                                Build.ImportedContent[contentType.FirstExtension][filename] = imported
                                remainingToImport--
                                console.info(`Imported "${filename}", ${remainingToImport} remaining...`)
                                if (!remainingToImport) Pack()
                            })
                        }
                    }
                }
            })
        }
    }
}

function Pack() {
    console.info("Checking for content types which require packing...")
    let remainingContentTypes = ContentTypes.length
    for (const contentType of ContentTypes) {
        let changed = false
        for (const contentTypeImport of contentType.ContentTypeImports) {
            for (const filename of FilesCreated.concat(FilesModified).concat(FilesDeleted)) {
                if (EndsWith(filename, `.${contentType.FirstExtension}.${contentTypeImport.SecondExtension}`)) {
                    changed = true
                }
            }
            if (changed) break
        }
        if (!changed) {
            console.info(`Content type ${contentType.FirstExtension} has not changed`)
            Build.PackingHeaders[contentType.FirstExtension] = PreviousBuild.PackingHeaders[contentType.FirstExtension] || {}
            Build.PackedContent[contentType.FirstExtension] = PreviousBuild.PackedContent[contentType.FirstExtension] || {}
            ContentTypeCompleted()
        } else {
            console.info(`Content type ${contentType.FirstExtension} has changed, packing...`)
            console.log("Deleting temporary directory...")
            rimraf(path.join("Temp", "Content", "Packed", contentType.FirstExtension), (err: any) => {
                Error(err)
                console.log("Creating temporary directory...")
                mkdirp(path.join("Temp", "Content", "Packed", contentType.FirstExtension), (err) => {
                    Error(err)
                    console.log("Collapsing content and running content-type-specific packing process...")
                    const collapsed: { [contentName: string]: any } = {}
                    for (const filename in Build.ImportedContent[contentType.FirstExtension]) {
                        for (const contentName in Build.ImportedContent[contentType.FirstExtension][filename]) {
                            collapsed[contentName] = Build.ImportedContent[contentType.FirstExtension][filename][contentName]
                        }
                    }
                    contentType.Pack(collapsed, (header, packed) => {
                        console.info(`Content type ${contentType.FirstExtension} has been packed`)
                        Build.PackingHeaders[contentType.FirstExtension] = header
                        Build.PackedContent[contentType.FirstExtension] = packed
                        ContentTypeCompleted()
                    })
                })
            })
        }
    }
    function ContentTypeCompleted() {
        remainingContentTypes--
        if (!remainingContentTypes) MinifyImages()
    }
}

function MinifyImages() {
    if (process.env.NODE_ENV != "production") {
        console.info("Skipping image minification as not building for production")
        GenerateTypes()
    } else {
        console.info("Finding images to minify...")

        const images: string[] = []

        const Recurse = function (directory: string, then: () => void) {
            fs.readdir(directory, (err, filesOrDirectories) => {
                Error(err)
                function CheckNextFileOrDirectory() {
                    const fileOrDirectory = filesOrDirectories.pop()
                    if (!fileOrDirectory)
                        then()
                    else {
                        const fullPath = path.join(directory, fileOrDirectory as string)
                        fs.stat(fullPath, (err, stats) => {
                            Error(err)
                            if (stats.isFile()) {
                                if (EndsWith(fullPath, ".png")) images.push(fullPath)
                                CheckNextFileOrDirectory()
                            } else if (stats.isDirectory()) Recurse(fullPath, CheckNextFileOrDirectory)
                            else CheckNextFileOrDirectory()
                        })
                    }
                }
                CheckNextFileOrDirectory()
            })
        }

        Recurse("Temp/Content/Packed", () => {
            console.info("Minifying images...")
            let remaining = images.length
            for (const image of images) imagemin([image], path.dirname(image), { plugins: [imageminPngcrush({ reduce: true })] })
                .catch(Error)
                .then(() => {
                    console.log(`Minified "${image}"`)
                    remaining--
                    if (!remaining) GenerateTypes()
                })

            if (!remaining) GenerateTypes()
        })
    }
}

function GenerateTypes() {
    console.info("Generating types...")
    const types = GenerateCodeFromContentTree(GenerateContentTreeFromBuild(Build), true, {
        sprite: () => "SpriteFrame",
        background: () => "BackgroundFrame"
    })

    console.info("Writing types to \"Temp/Content/Types.ts\"...")
    fs.writeFile("Temp/Content/Types.ts", types, "utf8", (err) => {
        Error(err);
        WriteBuild()
    })
}

function WriteBuild() {
    console.info("Writing build file... (Temp/Content/Index.json)")
    fs.writeFile("Temp/Content/Index.json", JSON.stringify(Build), "utf8", (err) => {
        Error(err);
        Done()
    })
}

function Done() {
    console.info("Build complete.")
}
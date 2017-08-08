import { ContentType, Error, ContentTypes, EndsWith, Build } from "./Misc"
import "./Sprite"
import "./Background"

import fs = require("fs")
import path = require("path")
const rimraf = require("rimraf")

new ContentType(".sound.flp", (filename, then) => then(), then => then("", []))
new ContentType(".music.flp", (filename, then) => then(), then => then("", []))

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
                            for (const extension in ContentTypes) {
                                if (EndsWith(fullPath, extension)) {
                                    Build.LastModified[fullPath] = stats.mtime.getTime()
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
    AdditionalGeneratedCode: {},
    PackedContent: {}
}

function CheckForPreviousBuild() {
    console.info("Checking for a previous build (Temp/LastBuild.json)...")
    fs.readFile("Temp/LastBuild.json", "utf8", (err, data) => {
        if (err && err.code == "ENOENT") {
            console.info("Previous build not completed, deleting the Temp directory...")
            rimraf("Temp", (err: any) => {
                Error(err)
                EnsureTempFolderExists()
            })
        }
        else {
            let failed = true
            try {
                PreviousBuild = JSON.parse(data)
                failed = false
            } catch (e) { }
            if (failed) {
                console.info("JSON file from previous build corrupted, deleting the Temp directory...")
                rimraf("Temp", (err: any) => {
                    Error(err)
                    EnsureTempFolderExists()
                })
            } else {
                console.info("Deleting Temp/LastBuild.json to mark build as incomplete...")
                fs.unlink("Temp/LastBuild.json", (err) => {
                    Error(err)
                    EnsureTempFolderExists()
                })
            }
        }
    })
}

function EnsureTempFolderExists() {
    console.info("Checking that Temp exists...")
    fs.stat("Temp", (err, stats) => {
        if (err && err.code == "ENOENT") {
            console.info("Creating...")
            fs.mkdir("Temp", (err) => {
                Error(err)
                console.info("Created.")
                CompareBuilds()
            })
        } else {
            Error(err)
            console.info("The Temp directory already exists.")
            CompareBuilds()
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
        if (PreviousBuild.LastModified[filename] == Build.LastModified[filename])
            console.log(`"${filename}" has NOT been modified between ${PreviousBuild.LastModified[filename]} and ${Build.LastModified[filename]}.`)
        else {
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
            RunConversions()
        } else {
            const directory = `Temp/${filename}`
            console.log(`Deleting "${directory}"...`)
            rimraf(directory, (err: any) => {
                Error(err)
                TakeNext()
            })
        }
    }
}

function RunConversions() {
    console.info("Running conversions...")
    const remaining = FilesCreated.concat(FilesModified)
    TakeNext()
    function TakeNext() {
        const filename = remaining.pop()
        if (!filename) {
            Pack()
        } else {
            for (const extension in ContentTypes) {
                if (EndsWith(filename, extension)) {
                    console.log(`Converting "${filename}"...`)
                    ContentTypes[extension].Convert(filename, TakeNext)
                }
            }
        }
    }
}

function Pack() {
    console.info("Checking for content types which require packing...")
    const remaining = Object.keys(ContentTypes)
    TakeNext()
    function TakeNext() {
        const extension = remaining.pop()
        if (extension) {
            let requiresPacking = false
            for (const filename of FilesCreated.concat(FilesModified).concat(FilesDeleted)) {
                if (!EndsWith(filename, extension)) continue
                requiresPacking = true
                break
            }
            if (!requiresPacking) {
                console.info(`No content with extension ${extension} has changed, no packing required`)
                Build.AdditionalGeneratedCode[extension] = PreviousBuild.AdditionalGeneratedCode[extension] || ""
                Build.PackedContent[extension] = PreviousBuild.PackedContent[extension] || []
                TakeNext()
            } else {
                console.info(`Content with extension ${extension} has changed, packing...`)
                ContentTypes[extension].Pack((additionalGeneratedCode, packedContent) => {
                    Build.AdditionalGeneratedCode[extension] = additionalGeneratedCode
                    Build.PackedContent[extension] = packedContent
                    TakeNext()
                })
            }
        } else GenerateTypeScriptTree()
    }
}

type ContentTreeDirectory = {
    readonly Type: "Directory"
    readonly Children: { [name: string]: ContentTree }
}
type ContentTree = ContentTreeDirectory | {
    readonly Type: "Content"
    readonly GeneratedCode: string
}
const root: ContentTreeDirectory = { Type: "Directory", Children: {} }

function GenerateTypeScriptTree() {
    console.info("Generating TypeScript tree...")
    for (const extension in Build.PackedContent) for (const content of Build.PackedContent[extension]) {
        const fragments: string[] = []
        let remaining = content.Path
        let currentFragment = ""
        while (remaining) {
            const character = remaining.slice(0, 1)
            remaining = remaining.slice(1)
            if (character == "/" || character == "\\") {
                // Fonts can sometimes have a "/" or "\" character, which should be kept as a path (a///b == a / b).
                if (currentFragment) {
                    fragments.push(currentFragment)
                    currentFragment = ""
                } else {
                    // This handles:
                    // a/ = a /
                    // a// = a //
                    // a/// = a ///
                    // a//// = a ////
                    // a/b = a b
                    // a//b = a b
                    // a///b = a / b
                    // a////b = a // b
                    // a/////b = a /// b
                    currentFragment = character
                    while (remaining.slice(0, 1) == "/" || remaining.slice(0, 1) == "\\") {
                        currentFragment += remaining.slice(0, 1)
                        remaining = remaining.slice(1)
                    }
                    if (remaining) {
                        if (currentFragment.length > 1) fragments.push(currentFragment.slice(0, -1))
                    } else
                        fragments.push(currentFragment)
                    currentFragment = ""
                }
            } else currentFragment += character
        }
        if (currentFragment) fragments.push(currentFragment)

        // Skip "Game".
        let directory = root
        for (const fragment of fragments.slice(1, -1)) {
            const next = directory.Children[fragment]
            if (next) {
                if (next.Type != "Directory")
                    Error(`Part of "${content.Path}" exists as both a directory and content; do you have directories which clash with file contents?`)
                else
                    directory = next
            } else {
                const next: ContentTreeDirectory = {
                    Type: "Directory",
                    Children: {}
                }
                directory.Children[fragment] = next
                directory = next
            }
        }

        if (directory.Children[fragments[fragments.length - 1]]) Error(`"${content.Path}" is defined more than once; do you have overlapping names?`)

        directory.Children[fragments[fragments.length - 1]] = {
            Type: "Content",
            GeneratedCode: content.GeneratedCode
        }
    }
    GenerateTypeScriptSource()
}

let GeneratedTypeScriptSource = ""

function GenerateTypeScriptSource() {
    console.info("Generating TypeScript source...")

    for (const extension in Build.AdditionalGeneratedCode) GeneratedTypeScriptSource += Build.AdditionalGeneratedCode[extension]

    GeneratedTypeScriptSource += `\nconst Content = ${RecurseDirectory(root, "")}`

    function RecurseChild(child: ContentTree, tabs: string) {
        if (child.Type == "Directory")
            return RecurseDirectory(child, tabs)
        else
            return child.GeneratedCode
    }

    function RecurseDirectory(directory: ContentTreeDirectory, tabs: string) {
        const sequentialNumbers: ContentTree[] = []
        while (directory.Children[sequentialNumbers.length]) sequentialNumbers.push(directory.Children[sequentialNumbers.length])
        let output = ""
        if (Object.keys(directory.Children).length == sequentialNumbers.length) {
            output += "[\n"
            for (const child of sequentialNumbers) {
                output += `${tabs}\t${RecurseChild(child, `${tabs}\t`)}`
                if (child != sequentialNumbers[sequentialNumbers.length - 1]) output += ","
                output += "\n"
            }
            output += `${tabs}]`
        } else {
            output += "{\n"
            let remaining = Object.keys(directory.Children).length
            for (const child in directory.Children) {
                // Invalid property names are quoted.
                // Additionally, as Uglify will not mangle quoted named, single character names are quoted too.
                // This should not make any difference to its compression efforts as it's just one charatcer, but means font characters will be preserved.
                output += `${tabs}\t${/^[A-Za-z_][0-9A-Za-z_]+$/.test(child) ? child : JSON.stringify(child)}: ${RecurseChild(directory.Children[child], `${tabs}\t`)}`
                if (--remaining) output += ","
                output += "\n"
            }
            output += `${tabs}}`
        }
        return output
    }
    DeleteExistingTypeScriptFile()
}

function DeleteExistingTypeScriptFile() {
    console.info("Checking whether a TypeScript file already exists...")
    fs.stat("Temp/Content.ts", (err) => {
        if (err && err.code == "ENOENT") {
            console.info("No TypeScript file exists.")
            WriteTypeScriptFile()
        } else {
            Error(err)
            fs.unlink("Temp/Content.ts", (err) => {
                Error(err)
                WriteTypeScriptFile()
            })
        }
    })
}

function WriteTypeScriptFile() {
    console.info("Writing TypeScript...")
    fs.writeFile("Temp/Content.ts", GeneratedTypeScriptSource, "utf8", (err) => {
        Error(err)
        GenerateBuild()
    })
}

function GenerateBuild() {
    console.info("Writing build file...")
    fs.writeFile("Temp/LastBuild.json", JSON.stringify(Build), "utf8", (err) => {
        Error(err);
        Done()
    })
}

function Done() {
    console.info("Build complete.")
}
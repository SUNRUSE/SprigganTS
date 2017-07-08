import fs = require("fs")
import mkdirp = require("mkdirp")
import path = require("path")
import child_process = require("child_process")

function Error(message: any) {
    if (!message) return
    console.error(message)
    process.exit(1)
}

function EndsWith(str: string, endsWith: string): boolean {
    if (str.length < endsWith.length) return false
    if (str.slice(str.length - endsWith.length) != endsWith) return false
    return true
}

const ContentTypes: { [extension: string]: ContentType } = {}

class ContentType {
    constructor(public readonly Extension: string, public readonly Convert: (filename: string, then: () => void) => void, public readonly Pack: (then: () => void) => void) {
        ContentTypes[Extension] = this
    }
}

new ContentType(".sprite.ase", (filename, then) => {
    mkdirp(`Temp/${filename}`, err => {
        Error(err)
        child_process.spawn("aseprite", ["--batch", filename, "--data", `Temp/${filename}/data.json`, "--list-tags", "--format", "json-array", "--sheet", `Temp/${filename}/Sheet.png`, "--trim", "--sheet-pack"]).on("exit", status => {
            if (status != 0) Error(`Failed to invoke Aseprite to convert sprite "${filename}"`)
            then()
        })
    })
}, then => then())
new ContentType(".background.ase", (filename, then) => then(), then => then())
new ContentType(".sound.flp", (filename, then) => then(), then => then())
new ContentType(".music.flp", (filename, then) => then(), then => then())

function RemoveExtension(filename: string): string {
    filename = filename.slice(0, filename.lastIndexOf("."))
    return filename.slice(0, filename.lastIndexOf("."))
}

const Build: { [filename: string]: number } = {}

FindFiles()

function FindFiles() {
    console.info("Finding files in the Source directory...")
    Recurse("Source", CheckForPreviousBuild)
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
                                    Build[fullPath] = stats.mtime.getTime()
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

let PreviousBuild: { [filename: string]: number } = {}

function CheckForPreviousBuild() {
    console.info("Checking for a previous build (Temp/LastBuild.json)...")
    fs.readFile("Temp/LastBuild.json", "utf8", (err, data) => {
        if (err && err.code == "ENOENT") {
            console.info("Previous build not completed, deleting the Temp directory...")
            fs.rmdir("Temp", (err) => {
                if (err && err.code == "ENOENT") {
                    console.info("There was no Temp directory to delete.")
                } else Error(err)
                EnsureTempFolderExists()
            })
        }
        else {
            PreviousBuild = JSON.parse(data)
            console.info("Deleting Temp/LastBuild.json to mark build as incomplete...")
            fs.unlink("Temp/LastBuild.json", (err) => {
                Error(err)
                EnsureTempFolderExists()
            })
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
    for (const filename in PreviousBuild) if (!Build[filename]) {
        console.log(`"${filename}" has been deleted.`)
        FilesDeleted.push(filename)
    }

    for (const filename in PreviousBuild) if (Build[filename]) {
        if (PreviousBuild[filename] == Build[filename])
            console.log(`"${filename}" has NOT been modified between ${PreviousBuild[filename]} and ${Build[filename]}.`)
        else {
            console.log(`"${filename}" has been modified between ${PreviousBuild[filename]} and ${Build[filename]}.`)
            FilesModified.push(filename)
        }
    }

    for (const filename in Build) if (!PreviousBuild[filename]) {
        console.log(`"${filename}" was created at ${Build[filename]}.`)
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
            const directory = RemoveExtension(filename)
            console.log(`Deleting "${directory}"...`)
            TakeNext()
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
        var extension = remaining.pop()
        if (extension) {
            var requiresPacking = false
            for (const filename of FilesCreated.concat(FilesModified).concat(FilesDeleted)) {
                if (!EndsWith(filename, extension)) continue
                requiresPacking = true
                break
            }
            if (!requiresPacking) {
                console.info(`No content with extension ${extension} has changed, no packing required`)
                TakeNext()
            } else {
                console.info(`Content with extension ${extension} has changed, packing...`)
                ContentTypes[extension].Pack(TakeNext)
            }
        } else GenerateBuild()
    }
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
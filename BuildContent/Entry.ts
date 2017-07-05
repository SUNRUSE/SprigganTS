import fs = require("fs")
import path = require("path")

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
    constructor(public readonly Extension: string) {
        ContentTypes[Extension] = this
    }
}

new ContentType(".sprite.ase")
new ContentType(".background.ase")
new ContentType(".sound.flp")
new ContentType(".music.flp")

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

    GenerateBuild()
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
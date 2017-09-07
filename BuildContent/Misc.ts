import fs = require("fs")
import path = require("path")
const imagemin = require("imagemin")
const imageminPngcrush = require("imagemin-pngcrush")

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

function RemoveExtension(filename: string): string {
    return filename.slice(0, filename.lastIndexOf("."))
}

function MinifyImages(root: string, then: () => void) {
    if (process.env.NODE_ENV != "production") {
        console.info("Skipping image minification as not building for production")
        then()
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

        Recurse(root, () => {
            console.info("Minifying images...")
            let remaining = images.length
            for (const image of images) imagemin([image], path.dirname(image), { plugins: [imageminPngcrush({ reduce: true })] })
                .catch(Error)
                .then(() => {
                    console.log(`Minified "${image}"`)
                    remaining--
                    if (!remaining) then()
                })

            if (!remaining) then()
        })
    }
}

export { Error, EndsWith, RemoveExtension, MinifyImages }
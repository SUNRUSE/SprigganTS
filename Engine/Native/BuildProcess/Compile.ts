console.info("Compiling native engine...")

import { Error } from "./../../../BuildContent/Misc"
import child_process = require("child_process")

const gccArguments: string[] = []

switch (process.env.NODE_ENV) {
    case "production":
        console.info("Compiling for production")
        gccArguments.push("-O2")
        break

    case "development":
        console.info("Compiling for development")
        break

    default: Error(`Unexpected environment "${process.env.NODE_ENV}"`)
}

switch (process.platform) {
    case "win32":
        console.info("Compiling for win32...")
        gccArguments.unshift("./Engine/Native/Win32.c")
        gccArguments.push("-o", "./Temp/Assembled/Native/spriggantsnativeengine.exe")
        gccArguments.push("-lopengl32", "-lgdi32")
        const spawned = child_process.spawn("gcc", gccArguments)
        spawned.stdout.on("data", chunk => console.log(chunk instanceof Buffer ? chunk.toString() : chunk))
        spawned.stderr.on("data", chunk => console.error(chunk instanceof Buffer ? chunk.toString() : chunk))
        spawned.on("exit", status => {
            if (status) Error(`GCC failed with status code "${status}"`)
            console.info("Compiled native engine")
        })
        break

    default: Error(`Unable to compile for platform "${process.platform}"`)
}
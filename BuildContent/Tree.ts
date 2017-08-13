import { Error } from "./Misc"
import { Build } from "./Types"

type ContentTreeDirectory = {
    readonly Type: "Directory"
    readonly Children: { [name: string]: ContentTree }
}

type ContentTree = ContentTreeDirectory | {
    readonly Type: "Content"
    readonly FirstExtension: string
    readonly PackedContent: any
}

function GenerateContentTreeFromBuild(build: Build): ContentTreeDirectory {
    const output: ContentTreeDirectory = { Type: "Directory", Children: {} }
    console.info("Generating content tree...")
    for (const firstExtension in build.PackedContent) for (const contentName in build.PackedContent[firstExtension]) {
        const fragments: string[] = []
        let remaining = contentName
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
        let directory = output
        for (const fragment of fragments.slice(1, -1)) {
            const next = directory.Children[fragment]
            if (next) {
                if (next.Type != "Directory")
                    Error(`Part of "${contentName}" exists as both a directory and content; do you have directories which clash with file contents?`)
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

        if (directory.Children[fragments[fragments.length - 1]]) Error(`"${contentName}" is defined more than once; do you have overlapping names?`)

        directory.Children[fragments[fragments.length - 1]] = {
            Type: "Content",
            FirstExtension: firstExtension,
            PackedContent: build.PackedContent[firstExtension][contentName]
        }
    }
    return output
}

function GenerateCodeFromContentTree(tree: ContentTreeDirectory, ambient: boolean, codeGenerators: { [firstExtension: string]: (packedContent: any) => string }): string {
    console.info("Generating code from content tree...")

    let output = ""

    let first = true
    for (const child in tree.Children) {
        if (!/^[A-Za-z_][0-9A-Za-z_]+$/.test(child)) Error(`Content or directories named \"${child}\" cannot be in the root as this is not a valid JavaScript identifier`)
        if (!first) output += "\n\n"
        first = false
        if (ambient) {
            output += `declare const ${child}: ${RecurseChild(tree.Children[child], "")}`
        } else {
            output += `const ${child} = ${RecurseChild(tree.Children[child], "")}`
        }
    }

    function RecurseChild(child: ContentTree, tabs: string) {
        if (child.Type == "Directory")
            return RecurseDirectory(child, tabs)
        else
            return codeGenerators[child.FirstExtension](child.PackedContent)
    }

    function RecurseDirectory(directory: ContentTreeDirectory, tabs: string) {
        const sequentialNumbers: ContentTree[] = []
        while (directory.Children[sequentialNumbers.length]) sequentialNumbers.push(directory.Children[sequentialNumbers.length])
        let recursedOutput = ""
        if (Object.keys(directory.Children).length == sequentialNumbers.length) {
            recursedOutput += "[\n"
            for (const child of sequentialNumbers) {
                recursedOutput += `${tabs}\t${RecurseChild(child, `${tabs}\t`)}`
                if (child != sequentialNumbers[sequentialNumbers.length - 1]) recursedOutput += ","
                recursedOutput += "\n"
            }
            recursedOutput += `${tabs}]`
        } else {
            recursedOutput += "{\n"
            let remaining = Object.keys(directory.Children).length
            for (const child of Object.keys(directory.Children).sort()) {
                // Invalid property names are quoted.
                // Additionally, as Uglify will not mangle quoted names, single character names are quoted too.
                // This should not make any difference to its compression efforts as it's just one character, but means font characters will be preserved.
                recursedOutput += `${tabs}\t${ambient ? "readonly" : ""} ${/^[A-Za-z_][0-9A-Za-z_]+$/.test(child) ? child : JSON.stringify(child)}: ${RecurseChild(directory.Children[child], `${tabs}\t`)}`
                if (--remaining) recursedOutput += ","
                recursedOutput += "\n"
            }
            recursedOutput += `${tabs}}`
        }
        return recursedOutput
    }
    return output
}

export { ContentTree, ContentTreeDirectory, GenerateContentTreeFromBuild, GenerateCodeFromContentTree }
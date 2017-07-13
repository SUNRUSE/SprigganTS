function ModifyLoadingMessage(callback: (element: HTMLElement) => void) {
    const element = document.getElementById("LoadingMessage")
    if (!element) return
    callback(element)
}

function SetLoadingMessage(message: string) {
    ModifyLoadingMessage(element => {
        element.innerText = message
        element.textContent = message
    })
}

function RemoveLoadingMessage() {
    ModifyLoadingMessage(element => document.body.removeChild(element))
}

SetLoadingMessage("Loading scripts, please wait...")
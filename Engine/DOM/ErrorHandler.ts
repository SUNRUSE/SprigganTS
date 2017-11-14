onerror = function () {
    SceneRoot.Instance.Delete()
    CallbackQueue.length = 0
    InternalInvoke()
    alert.apply(window, arguments)
}
void *STSPerformMalloc(size_t size, const char *message)
{
    void *allocation = malloc(size);
    if (!allocation)
        STSPlatformRaiseError(message);
    return allocation;
}

void STSPerformRealloc(size_t size, void **pointer, const char *message)
{
    if (size)
    {
        *pointer = realloc(*pointer, size);
        if (!*pointer)
            STSPlatformRaiseError(message);
    }
    else
    {
        if (!*pointer)
            return;
        free(*pointer);
        *pointer = NULL;
    }
}
void STSPerformAppend(STSArray *array, size_t size, void *item)
{
    STSReallocSize(size, &array->Items, array->Count + 1);
    memcpy(array->Items + array->Count * size, item, size);
    array->Count++;
}

void STSPerformRemoveByValue(STSArray *array, size_t size, void *item)
{
    while (true)
    {
        int index = STSPerformIndexOf(array, size, item);
        if (index == -1)
            return;
        STSPerformRemoveByIndex(array, size, index);
    }
}

void STSPerformRemoveByIndex(STSArray *array, size_t size, size_t index)
{
    memmove(array->Items + index * size, array->Items + (index + 1) * size, (array->Count - index - 1) * size);
    array->Count--;
    STSReallocSize(size, &array->Items, array->Count);
}

int STSPerformIndexOf(STSArray *array, size_t size, void *item)
{
    for (size_t i = 0; i < array->Count; i++)
        if (memcmp(array->Items + i * size, item, size) == 0)
            return i;
    return -1;
}
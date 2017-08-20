typedef struct STSArray
{
    size_t Count;
    void *Items;
} STSArray;

#define STS_EMPTY     \
    {                 \
        .Count = 0,   \
        .Items = NULL \
    }

#define STSAppend(array, type, item) STSPerformAppend(array, sizeof(type), &item);
void STSPerformAppend(STSArray *array, size_t size, void *item);

#define STSRemoveByValue(array, type, item) STSPerformRemoveByValue(array, sizeof(type), &item);
void STSPerformRemoveByValue(STSArray *array, size_t size, void *item);

#define STSRemoveByIndex(array, type, index) STSPerformRemoveByIndex(array, sizeof(type), index);
void STSPerformRemoveByIndex(STSArray *array, size_t size, size_t index);

#define STSIndexOf(array, type, item) STSIndexOf(array, sizeof(type), &item);
int STSPerformIndexOf(STSArray *array, size_t size, void *item);

#define STSForEach(array, type, callback, ...)                  \
    {                                                           \
        STSArray *_a = (array);                                 \
        for (size_t _b = 0; _b < _a->Count; _b++)               \
            (callback)(((type *)_a->Items)[_b], ##__VA_ARGS__); \
    }

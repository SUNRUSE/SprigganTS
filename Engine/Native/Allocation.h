#define STSMalloc(type, count) (type *)STSPerformMalloc(sizeof(type) * (count), "Failed to allocate memory on line " STS_TO_STRING(__LINE__) " of file \"" __FILE__ "\"")

void *STSPerformMalloc(size_t size, const char *message);

#define STSRealloc(type, pointer, count) STSPerformRealloc(sizeof(type) * (count), pointer, "Failed to reallocate memory on line " STS_TO_STRING(__LINE__) " of file " __FILE__)
#define STSReallocSize(size, pointer, count) STSPerformRealloc((size) * (count), pointer, "Failed to reallocate memory on line " STS_TO_STRING(__LINE__) " of file " __FILE__)

void STSPerformRealloc(size_t size, void **pointer, const char *message);
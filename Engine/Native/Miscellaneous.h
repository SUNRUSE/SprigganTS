// Converts a numeric constant to a string constant, such as STS_TO_STRING(__LINE__).  From https://stackoverflow.com/a/5459929/2439932
#define STS_TO_STRING_HELPER(number) #number
#define STS_TO_STRING(number) STS_TO_STRING_HELPER(number)

#define STS_FLAG_SET(data, flag) (data & flag)
#define STS_FLAG_NOT_SET(data, flag) (!(data & flag))
#define STS_SET_FLAG(data, flag) data |= flag
#define STS_CLEAR_FLAG(data, flag) data &= ~flag

#define STSRaiseError(text) STSPlatformRaiseError("Runtime error on line " STS_TO_STRING(__LINE__) " of file \"" __FILE__ "\": " text "; the engine will now stop.")
void STSPlatformRaiseError(const char *text);

float STSMinFloat(float a, float b);
float STSMaxFloat(float a, float b);

typedef uint64_t STSUniqueId;
#define STS_FIRST_UNIQUE_ID 0
#define STS_LAST_UNIQUE_ID UINT64_MAX
#define STS_NULL_UNIQUE_ID UINT64_MAX
STSUniqueId STSNextUniqueId(STSUniqueId *counter);
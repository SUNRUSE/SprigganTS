float STSMinFloat(float a, float b)
{
    return a < b ? a : b;
}

float STSMaxFloat(float a, float b)
{
    return a > b ? a : b;
}

STSUniqueId STSNextUniqueId(STSUniqueId *counter)
{
    STSUniqueId id = *counter;
    if (id == STS_LAST_UNIQUE_ID)
        STSRaiseError("The available unique IDs have been exhausted");
    (*counter)++;
    return id;
}
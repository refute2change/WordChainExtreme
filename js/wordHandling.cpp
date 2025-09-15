#include <string>

bool oneLetterDiffer(const std::string& word1, const std::string& word2)
{
    if (word1.length() != word2.length()) return false;
    int diffCount = 0;
    for (size_t i = 0; i < word1.length(); ++i) {
        if (word1[i] != word2[i]) {
            ++diffCount;
            if (diffCount > 1) return false;
        }
    }
    return diffCount == 1;
}
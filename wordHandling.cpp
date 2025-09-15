#include <string>
#include <emscripten/bind.h>
#include <fstream>
using namespace emscripten;

bool oneLetterDiffer(const std::string& word1, const std::string& word2) {
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

void readWordsFromFile() {
    std::fstream file("answers/3letters.txt", std::ios::in);
    std::string word;
    while (!file.eof()) {
        file >> word;
        // For demonstration, we just print the words to the console
        // In a real application, you might want to store them in a data structure
        printf("%s\n", word.c_str());
    }
}

EMSCRIPTEN_BINDINGS(word_handling) {
    function("oneLetterDiffer", &oneLetterDiffer);
    function("readWordsFromFile", &readWordsFromFile);
}

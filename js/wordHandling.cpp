#include <emscripten/bind.h>
#include <string>
#include <vector>
#include <unordered_map>
#include <queue>
#include <unordered_set>

using namespace emscripten;
using namespace std;

bool differsByOne(const string &a, const string &b) {
    if (a.size() != b.size()) return false;
    int diff = 0;
    for (size_t i = 0; i < a.size(); i++)
        if (a[i] != b[i] && ++diff > 1) return false;
    return diff == 1;
}

struct State {
    string word;
    unordered_map<char,int> inv;
};

string makeKey(const string &word, const unordered_map<char,int> &inv) {
    string k = word + "|";
    for (auto &p : inv) k += p.first + to_string(p.second);
    return k;
}

bool canReach(const string &start,
              const string &target,
              vector<string> dict,
              val jsInventory)
{
    unordered_map<char,int> baseInv;
    auto keys = jsInventory.call<val>("keys");
    int len = keys["length"].as<int>();
    for (int i = 0; i < len; i++) {
        string k = keys[i].as<string>();
        int count = jsInventory[k].as<int>();
        baseInv[k[0]] = count;
    }

    queue<State> q;
    unordered_set<string> visited;

    q.push({start, baseInv});

    while (!q.empty()) {
        State cur = q.front(); q.pop();
        if (cur.word == target) return true;

        string key = makeKey(cur.word, cur.inv);
        if (visited.count(key)) continue;
        visited.insert(key);

        for (auto &next : dict) {
            if (!differsByOne(cur.word, next)) continue;

            // find the new letter
            char newLetter = 0;
            for (size_t i=0;i<cur.word.size();i++)
                if (cur.word[i] != next[i]) { newLetter = toupper(next[i]); break; }

            if (cur.inv[newLetter] > 0) {
                auto newInv = cur.inv;
                newInv[newLetter]--;
                q.push({next, newInv});
            }
        }
    }

    return false;
}

EMSCRIPTEN_BINDINGS(my_module) {
    function("canReach", &canReach);
}

/*
  artichoke: Unix archiver (ar) implementation with Node.js.
  Copyright 2016 Sam Saint-Pettersen.

  Native add-on.

  Dual licensed under the GPL and MIT licenses;
  see GPL-LICENSE and MIT-LICENSE respectively.
*/

#include <iostream> // !

#include <string>
#include <fstream>
#include <sstream>
#include <vector>
#include <regex>
#include <cstdio>
#include <cstring>
using namespace std;

class ArEntry {
private:
    string file;
    int modified;
    int owner;
    int group;
    int mode;
    int size;

public:
    ArEntry(string file, int modified, int owner, int group, int mode, int size) {
        this->file = file;
        this->modified = modified;
        this->owner = owner;
        this->group = group;
        this->mode = mode;
        this->size = size;
    }

    string get_file() {
        return file;
    }

    int get_modified() {
        return modified;
    }

    int get_owner() {
        return owner;
    }

    int get_group() {
        return group;
    }

    int get_mode() {
        return mode;
    }

    int get_size() {
        return size;
    }
};

vector<string> split(string str, char delimiter) {
    vector<string> internal;
    stringstream ss(str);
    string token;
    while(getline(ss, token, delimiter)) {
        internal.push_back(token);
    }
    return internal;
}

string pad_data(int n, string data) {
    string padded = data;
    for(int i = 0; i < (int)(n - data.length()); i++) {
        padded.append(" ");
    }
    return padded;
}

void write_ar_entries(string archive, vector<ArEntry> entries) {
    /**
     * COMMON AR FORMAT SPECIFICATION
     * (0) Global header
     * (a) Filename in ASCII [0:16]
     * (b) File modification timestamp (Decimal) [16:12]
     * (c) Owner ID (Decimal) [28:6]
     * (d) Group ID (Decimal) [34:6]
     * (e) File mode (Octal) [40:8]
     * (f) File size in bytes (Decimal) [48:10]
     * (g) Magic number ("0x60 0x0A") [58:2]
    */
    ostringstream header;
    ostringstream data;
    ofstream ar;
    ar.open(archive.c_str(), ofstream::out | ofstream::binary);
    header << "!<arch>" << (char)0x0A; // (0)
    for(int i = 0; i < (int)entries.size(); i++) {
        ostringstream contents;
        string filename = entries[i].get_file();
        ifstream input;
        input.open(filename.c_str(), ios::binary);
        contents << input.rdbuf();
        input.close();
        stringstream f;
        f << filename << "/";
        data << pad_data(16, f.str()); // (a)
        data << pad_data(12, to_string(entries[i].get_modified())); // (b)
        data << pad_data(6, to_string(entries[i].get_owner())); // (c)
        data << pad_data(6, to_string(entries[i].get_group())); // (d)
        data << pad_data(8, to_string(entries[i].get_mode())); // (e)
        data << pad_data(10, to_string(entries[i].get_size())); // (f)
        data << (char)0x60 << (char)0x0A; // (g)
        data << contents.str();
    }
    ar << header.str() << data.str();
    ar.close();
}

bool check_archive(string ar) {
    bool valid = true;
    string signature;
    for(auto i = 0; i < 7; i++) {
      signature += ar[i];
    }
    if(strcmp(signature.c_str(), "!<arch>") != 0) {
      valid = false;
    }
    return valid;
}

void read_ar_entries(string archive) {
    string foobar = "!<arch> some dummy header!";
    cout << check_archive(foobar) << endl;
}

int write_archive(string archive, string manifest) {
    vector<ArEntry> entries;
    string l;
    ifstream f(manifest.c_str());
    while(getline(f, l)) {
        vector<string> entry = split(l, ':');
        entries.push_back(
        ArEntry(entry[0], stoi(entry[1]), stoi(entry[2]),
        stoi(entry[3]), stoi(entry[4]), stoi(entry[5])));
    }
    f.close();
    write_ar_entries(archive, entries);
    remove(manifest.c_str());
    return 0;
}

int read_archive(string archive) {
    read_ar_entries(archive);
    return 0;
}

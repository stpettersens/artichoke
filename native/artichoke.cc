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
    std::string file;
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

bool check_archive(vector<unsigned char> ar) {
  bool valid = true;
  string signature;
  for(auto i = 0; i < 7; i++) {
    signature += ar.at(i);
  }
  if(strcmp(signature.c_str(), "!<arch>") != 0) {
    valid = false;
  }
  return valid;
}

void read_ar_entries(string archive, int verbose) {
  streampos fileSize;
  ifstream f(archive.c_str(), ios::binary | ios::in);
  f.seekg(0, std::ios::end);
  fileSize = f.tellg();
  f.seekg(0, std::ios::beg);
  vector<unsigned char> ar(fileSize);
  vector<unsigned char> iheaders;
  vector<unsigned char> idata;
  f.read((char*) &ar[0], (int)fileSize);
  f.close();
  if(check_archive(ar)) {
    for(auto i = 8; i < (int)ar.size(); i++) {
      if(ar[i] != '`') {
        iheaders.push_back(ar[i]);
      }
      idata.push_back(ar[i]);
    }

    //cout << idata.at(0) << endl; // TODO: Remove this.
    //cout << std::hex << (int)idata.at(0) << endl << endl; // TODO: Remove this.

    string hpattern = "([\\w\\-\\\\./]+)\\s*(\\d{10})\\s{2}(\\d{4})\\s{2}(\\d{4})"; //.*";
    hpattern.append("\\s{2}(\\d{6})\\s{2}(\\d{1,4}).*");
    string mheaders;
    for(unsigned char c : iheaders) {
      mheaders += c;
    }
    iheaders.clear(); // Clear iheaders vector as done with it.

    vector<string> filenames;
    vector<int> timestamps;
    vector<int> owners;
    vector<int> groups;
    vector<int> fmodes;
    vector<int> fsizes;
    vector<string> headers = split(mheaders, '\n');
    regex p(hpattern);
    for(string header: headers) {
      smatch m;
      if(regex_search(header, m, p)) {
        filenames.push_back(m[1].str());
        timestamps.push_back(stoi(m[2].str()));
        owners.push_back(stoi(m[3].str()));
        groups.push_back(stoi(m[4].str()));
        fmodes.push_back(stoi(m[5].str()));
        fsizes.push_back(stoi(m[6].str()));
      }
    }

    // TODO: Remove this block except for headers.clear();
    for(int i = 0; i < (int)filenames.size(); i++) {
      cout << filenames.at(i) << endl;
      cout << timestamps.at(i) << endl;
      cout << owners.at(i) << endl;
      cout << groups.at(i) << endl;
      cout << fmodes.at(i) << endl;
      cout << fsizes.at(i) << endl;
      cout << endl;
    }
    headers.clear(); // Clear headers vector as done with it.
  }
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

int read_archive(string archive, int verbose) {
    cout << verbose << endl << endl; // !TODO Remove this.
    read_ar_entries(archive, verbose);
    return 0;
}

#include <iostream>
#include <string>
#include <regex>
using namespace std;

int main() {
  string hpattern = "\\d{10}"; //([\\w\\-\\\\./]+)\\s*(\\d{10})\\s{2}(\\d{4})\\s{2}(\\d{4})"; //.*";
  //hpattern.append("\\s{2}(\\d{6})\\s{2}(\\d{1,4}).*");

  string header = "debian-binary/  123456789  1234  1234  1234  123456  12";
  regex p(hpattern);

  //smatch m;
  //bool a = regex_match(header, m, p);
  //cout << a << endl;
  return 0;
}

#include <iostream>
#include <string>
#include <regex>
using namespace std;

int main() {
  string hpattern = "([\\w\\-\\\\./]+)\\s*(\\d{10})\\s{2}(\\d{4})\\s{2}(\\d{4})";
  hpattern.append("\\s{2}(\\d{6})\\s{2}(\\d{1,4}).*");

  string header = "debian-binary/  1466544559  1000  1000  100664  6643";
  regex p(hpattern);

  smatch m;
  bool im = regex_search(header, m, p);
  cout << im << endl;
  if(regex_search(header, m, p)) {
    cout << m[0].str() << endl;
  }
  return 0;
}

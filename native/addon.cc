/*
  artichoke: Unix archiver (ar) implementation with Node.js.
  Copyright 2016 Sam Saint-Pettersen.

  Native add-on.

  Dual licensed under the GPL and MIT licenses;
  see GPL-LICENSE and MIT-LICENSE respectively.
*/

#include <nan.h>
#include <string>
#include "artichoke.hpp"

void export_write_archive(const Nan::FunctionCallbackInfo<v8::Value>& info) {
  if (info.Length() < 2) {
    Nan::ThrowTypeError("artichoke-native: Wrong number of arguments");
    return;
  }

  if (!info[0]->IsString() || !info[1]->IsString()) {
    Nan::ThrowTypeError("artichoke-native: Arguments should be string, string");
    return;
  }

  v8::String::Utf8Value archive(info[0]->ToString());
  v8::String::Utf8Value manifest(info[1]->ToString());
  v8::Local<v8::Number> code = Nan::New(
  write_archive(std::string(*archive), std::string(*manifest)));

  info.GetReturnValue().Set(code);
}

void export_read_archive(const Nan::FunctionCallbackInfo<v8::Value>& info) {
  if (info.Length() < 1) {
      Nan::ThrowTypeError("artichoke-native: Wrong number of arguments");
      return;
  }

  if (!info[0]->IsString()) {
      Nan::ThrowTypeError("artichoke-native: Argument should be string");
      return;
  }

  v8::String::Utf8Value archive(info[0]->ToString());
  v8::Local<v8::Number> code = Nan::New(
  read_archive(std::string(*archive)));

  info.GetReturnValue().Set(code);
}

void init(v8::Local<v8::Object> exports) {
  exports->Set(Nan::New("write_archive").ToLocalChecked(),
  Nan::New<v8::FunctionTemplate>(export_write_archive)->GetFunction());
  exports->Set(Nan::New("read_archive").ToLocalChecked(),
  Nan::New<v8::FunctionTemplate>(export_read_archive)->GetFunction());
}

NODE_MODULE(addon, init)

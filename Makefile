CC = g++
TARGET = pattern

make:
	$(CC) --std=c++11 $(TARGET).cc -o $(TARGET)

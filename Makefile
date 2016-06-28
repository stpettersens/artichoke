CC = g++
SWITCHES = --std=c++11
TARGET = pattern

make:
	$(CC) $(SWITCHES) $(TARGET).cc -o $(TARGET)

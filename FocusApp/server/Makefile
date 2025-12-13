# Makefile for FocusApp Server (Linux/WSL)

CC = gcc
CFLAGS = -Wall -Wextra -O2 -pthread
LDFLAGS = -pthread

COMMON_DIR = ../common
SERVER_DIR = .

COMMON_SRC = $(COMMON_DIR)/utils.c
SERVER_SRC = $(SERVER_DIR)/main.c $(SERVER_DIR)/handlers.c

COMMON_OBJ = $(COMMON_SRC:.c=.o)
SERVER_OBJ = $(SERVER_SRC:.c=.o)

TARGET = FocusServer

all: $(TARGET)

$(TARGET): $(COMMON_OBJ) $(SERVER_OBJ)
	@echo "Linking $(TARGET)..."
	$(CC) -o $@ $^ $(LDFLAGS)
	@echo "Build complete: $(TARGET)"

%.o: %.c
	@echo "Compiling $<..."
	$(CC) $(CFLAGS) -I$(COMMON_DIR) -I$(SERVER_DIR) -c $< -o $@

clean:
	@echo "Cleaning build files..."
	rm -f $(COMMON_OBJ) $(SERVER_OBJ) $(TARGET)

run: $(TARGET)
	./$(TARGET)

.PHONY: all clean run

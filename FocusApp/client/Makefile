# Makefile for FocusApp Client (Linux / POSIX)

CC = gcc
CFLAGS = -Wall -Wextra -O2 -pthread
LDFLAGS = -pthread

# Directories
COMMON_DIR = ../common
CLIENT_DIR = .

# Source files
COMMON_SRC = $(COMMON_DIR)/utils.c
CLIENT_SRC = $(CLIENT_DIR)/network.c $(CLIENT_DIR)/base64.c $(CLIENT_DIR)/main.c

# Object files
COMMON_OBJ = $(COMMON_SRC:.c=.o)
CLIENT_OBJ = $(CLIENT_SRC:.c=.o)

# Output executable
TARGET = FocusClient

# Default target
all: $(TARGET)

# Build executable
$(TARGET): $(COMMON_OBJ) $(CLIENT_OBJ)
	@echo "Linking $(TARGET)..."
	$(CC) -o $@ $^ $(LDFLAGS)
	@echo "Build complete: $(TARGET)"

# Compile C files to object files
%.o: %.c
	@echo "Compiling $<..."
	$(CC) $(CFLAGS) -I$(COMMON_DIR) -I$(CLIENT_DIR) -c $< -o $@

# Clean build artifacts
clean:
	@echo "Cleaning build files..."
	rm -f $(COMMON_OBJ) $(CLIENT_OBJ) $(TARGET)

# Run the application
run: $(TARGET)
	@echo "Running $(TARGET)..."
	./$(TARGET)

# Help target
help:
	@echo "FocusApp Client Makefile (Linux)"
	@echo "========================"
	@echo "Targets:"
	@echo "  all     - Build the application (default)"
	@echo "  clean   - Remove build artifacts"
	@echo "  run     - Build and run the application"
	@echo "  help    - Show this help message"
	@echo ""
	@echo "Requirements:"
	@echo "  - GCC, pthreads"
	@echo "  - Server running on localhost:8080"

.PHONY: all clean run help

#!/bin/bash

# Function to display colored messages
print_info() {
    echo -e "\033[34m[INFO] $1\033[0m"
}

print_error() {
    echo -e "\033[31m[ERROR] $1\033[0m"
}

print_success() {
    echo -e "\033[32m[SUCCESS] $1\033[0m"
}

# Check if required commands exist
check_commands() {
    for cmd in ollama node npm; do
        if ! command -v $cmd &> /dev/null; then
            print_error "$cmd is not installed. Please install it first."
            exit 1
        fi
    done
}

# Start Ollama if not running
start_ollama() {
    print_info "Checking Ollama service..."
    
    if ! curl -s http://localhost:11434/api/tags &> /dev/null; then
        print_info "Ollama service is not running. Starting it now..."
        open -a Ollama
        sleep 5
        
        if ! curl -s http://localhost:11434/api/tags &> /dev/null; then
            print_error "Failed to start Ollama service. Please check if it's installed correctly."
            exit 1
        fi
    fi
    
    print_success "Ollama service is running"
}

# Start backend server
start_backend() {
    print_info "Starting backend server..."
    
    # Kill any existing backend processes
    pkill -f "node server.js" 2>/dev/null || true
    
    # Start backend in background
    node server.js &
    BACKEND_PID=$!
    
    # Wait for backend to start
    print_info "Waiting for backend to start..."
    sleep 3
    
    # Verify backend is running
    if ! curl -s http://localhost:3000/api/models &> /dev/null; then
        print_error "Backend server failed to start properly"
        exit 1
    fi
    
    print_success "Backend server is running"
}

# Start frontend
start_frontend() {
    print_info "Starting frontend..."
    
    # Kill any existing frontend processes
    pkill -f "vite" 2>/dev/null || true
    
    # Start frontend
    npm run dev &
    FRONTEND_PID=$!
    
    print_info "Frontend starting..."
}

# Cleanup function
cleanup() {
    print_info "Cleaning up..."
    
    # Kill backend
    if [ -n "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null || true
    fi
    
    # Kill frontend
    if [ -n "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null || true
    fi
}

# Main script
main() {
    trap cleanup EXIT
    
    check_commands
    start_ollama
    start_backend
    start_frontend
    
    print_success "All services started successfully!"
    print_info "Access the application at http://localhost:5173"
    
    # Keep script running to catch signals
    while true; do
        sleep 1
    done
}

# Execute main
main

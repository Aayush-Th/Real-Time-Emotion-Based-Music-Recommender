from app import app


if __name__ == "__main__":
    # Run without the reloader to avoid platform-specific socket issues on Windows
    app.run(host="0.0.0.0", port=5000, debug=False, use_reloader=False)
    

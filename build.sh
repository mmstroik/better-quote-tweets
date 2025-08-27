#!/bin/bash

# Build script for creating browser-specific packages

# Create dist directory if it doesn't exist
mkdir -p dist/chrome dist/firefox

# Build Chrome extension
echo "Building Chrome extension..."
rm -rf dist/chrome/*
cp -r src/chrome/* dist/chrome/
mkdir -p dist/chrome/common
cp -r src/common/* dist/chrome/common/
# Update paths in Chrome manifest to be relative
sed -i 's|"../common/|"common/|g' dist/chrome/manifest.json
sed -i "s|'../common/|'common/|g" dist/chrome/background.js

# Build Firefox extension
echo "Building Firefox extension..."
rm -rf dist/firefox/*
cp -r src/firefox/* dist/firefox/
mkdir -p dist/firefox/common
cp -r src/common/* dist/firefox/common/
# Update paths in Firefox manifest to be relative
sed -i 's|"../common/|"common/|g' dist/firefox/manifest.json

# Create zip files for distribution
echo "Creating distribution packages..."
cd dist/chrome && zip -r ../chrome-extension.zip * && cd ../..
cd dist/firefox && zip -r ../firefox-extension.zip * && cd ../..

echo "Build complete!"
echo "Chrome extension: dist/chrome-extension.zip"
echo "Firefox extension: dist/firefox-extension.zip"
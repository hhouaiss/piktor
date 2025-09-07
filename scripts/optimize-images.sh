#!/bin/bash
# Image Optimization Script for Piktor Gallery
# This script optimizes gallery images for web delivery and GitHub storage

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
GALLERY_DIR="$PROJECT_ROOT/public/gallery"
TEMP_DIR="$PROJECT_ROOT/tmp/gallery-optimization"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if sips is available (macOS)
if ! command -v sips &> /dev/null; then
    log_error "sips command not found. This script requires macOS with sips utility."
    exit 1
fi

# Function to optimize a single image
optimize_image() {
    local input_file="$1"
    local output_file="$2"
    local width="$3"
    local height="$4"
    local quality="${5:-80}"
    
    log_info "Optimizing: $(basename "$input_file")"
    
    # Get original file size
    local original_size=$(stat -f%z "$input_file" 2>/dev/null || echo "0")
    
    # Optimize the image
    sips -z "$height" "$width" -s format jpeg -s formatOptions "$quality" "$input_file" --out "$output_file" >/dev/null 2>&1
    
    # Get optimized file size
    local optimized_size=$(stat -f%z "$output_file" 2>/dev/null || echo "0")
    
    # Calculate savings
    local savings=$((original_size - optimized_size))
    local percent_savings=$((savings * 100 / original_size))
    
    log_success "  $(numfmt --to=iec-i --suffix=B $original_size) → $(numfmt --to=iec-i --suffix=B $optimized_size) (${percent_savings}% reduction)"
}

# Main optimization function
optimize_gallery() {
    log_info "Starting gallery optimization..."
    
    # Create temporary directory
    mkdir -p "$TEMP_DIR/before" "$TEMP_DIR/after"
    
    # Optimal dimensions for web display (aspect ratio preserved)
    local optimal_width=936
    local optimal_height=490
    local jpeg_quality=80
    
    # Process before images
    if [ -d "$GALLERY_DIR/before" ]; then
        log_info "Optimizing 'before' images..."
        for img in "$GALLERY_DIR/before"/*.{jpg,jpeg,png,JPG,JPEG,PNG} 2>/dev/null; do
            [ -f "$img" ] || continue
            local filename=$(basename "$img")
            local name_without_ext="${filename%.*}"
            optimize_image "$img" "$TEMP_DIR/before/${name_without_ext}.jpg" "$optimal_width" "$optimal_height" "$jpeg_quality"
        done
    fi
    
    # Process after images
    if [ -d "$GALLERY_DIR/after" ]; then
        log_info "Optimizing 'after' images..."
        for img in "$GALLERY_DIR/after"/*.{jpg,jpeg,png,JPG,JPEG,PNG} 2>/dev/null; do
            [ -f "$img" ] || continue
            local filename=$(basename "$img")
            local name_without_ext="${filename%.*}"
            optimize_image "$img" "$TEMP_DIR/after/${name_without_ext}.jpg" "$optimal_width" "$optimal_height" "$jpeg_quality"
        done
    fi
    
    # Calculate total savings
    local original_total=$(find "$GALLERY_DIR" -name "*.jpg" -o -name "*.jpeg" -o -name "*.png" -o -name "*.JPG" -o -name "*.JPEG" -o -name "*.PNG" 2>/dev/null | xargs stat -f%z 2>/dev/null | awk '{sum += $1} END {print sum}')
    local optimized_total=$(find "$TEMP_DIR" -name "*.jpg" 2>/dev/null | xargs stat -f%z 2>/dev/null | awk '{sum += $1} END {print sum}')
    
    local total_savings=$((original_total - optimized_total))
    local total_percent=$((total_savings * 100 / original_total))
    
    log_success "Total optimization: $(numfmt --to=iec-i --suffix=B $original_total) → $(numfmt --to=iec-i --suffix=B $optimized_total) (${total_percent}% reduction)"
    
    return 0
}

# Function to backup and replace gallery
replace_gallery() {
    log_info "Backing up original gallery and replacing with optimized version..."
    
    # Backup original gallery
    if [ -d "$GALLERY_DIR" ]; then
        local backup_dir="$PROJECT_ROOT/public/gallery-backup-$(date +%Y%m%d-%H%M%S)"
        mv "$GALLERY_DIR" "$backup_dir"
        log_success "Original gallery backed up to: $backup_dir"
    fi
    
    # Move optimized gallery to final location
    mv "$TEMP_DIR" "$GALLERY_DIR"
    log_success "Gallery replaced with optimized versions"
}

# Function to update page.tsx file references
update_file_references() {
    log_info "Updating file references to use .jpg extensions..."
    
    local page_file="$PROJECT_ROOT/src/app/page.tsx"
    if [ -f "$page_file" ]; then
        # Update any .png references to .jpg in the gallery paths
        sed -i '' 's|/gallery/after/\([^"]*\)\.png|/gallery/after/\1.jpg|g' "$page_file"
        sed -i '' 's|/gallery/before/\([^"]*\)\.png|/gallery/before/\1.jpg|g' "$page_file"
        log_success "Updated file references in page.tsx"
    fi
}

# Function to validate GitHub size limits
validate_github_limits() {
    log_info "Validating GitHub size limits..."
    
    local max_file_size=$((100 * 1024 * 1024))  # 100MB
    local warn_file_size=$((50 * 1024 * 1024))   # 50MB warning
    local large_files_found=false
    
    find "$GALLERY_DIR" -type f -name "*.jpg" | while read -r file; do
        local file_size=$(stat -f%z "$file" 2>/dev/null || echo "0")
        if [ "$file_size" -gt "$max_file_size" ]; then
            log_error "File too large for GitHub: $(basename "$file") ($(numfmt --to=iec-i --suffix=B $file_size))"
            large_files_found=true
        elif [ "$file_size" -gt "$warn_file_size" ]; then
            log_warning "Large file detected: $(basename "$file") ($(numfmt --to=iec-i --suffix=B $file_size))"
        fi
    done
    
    if [ "$large_files_found" = true ]; then
        log_error "Some files exceed GitHub's size limits. Consider further optimization."
        exit 1
    else
        log_success "All files are within GitHub size limits"
    fi
}

# Main execution
main() {
    log_info "Piktor Gallery Image Optimization Script"
    log_info "========================================"
    
    # Check if gallery directory exists
    if [ ! -d "$GALLERY_DIR" ]; then
        log_error "Gallery directory not found: $GALLERY_DIR"
        exit 1
    fi
    
    # Run optimization
    optimize_gallery
    
    # Ask user confirmation before replacing
    echo
    read -p "Replace current gallery with optimized versions? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        replace_gallery
        update_file_references
        validate_github_limits
        
        log_success "Gallery optimization completed successfully!"
        log_info "You can now commit the optimized images to GitHub."
        log_info "Run: git add public/gallery/ && git commit -m 'Optimize gallery images for web performance'"
    else
        log_info "Optimization completed but not applied. Optimized files are in: $TEMP_DIR"
    fi
}

# Run main function
main "$@"
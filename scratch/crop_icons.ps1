[Reflection.Assembly]::LoadWithPartialName("System.Drawing") | Out-Null

$srcPath = ".\app-musteri\public\logo-icon.png"
if (-not (Test-Path $srcPath)) {
    Write-Error "Source file not found at $srcPath"
    exit 1
}

# Copy the original file as backup just in case
$backupPath = ".\scratch\logo-icon-backup.png"
Copy-Item $srcPath $backupPath -Force
Write-Host "Backup created at $backupPath"

$bmp = New-Object System.Drawing.Bitmap($srcPath)

# Bounding box coordinates determined from analysis:
# minX=158, maxX=356, minY=116, maxY=394
# centerX = 257, centerY = 255
# We crop a 300x300 square centered around (257, 255)
$size = 300
$cropX = 257 - 150
$cropY = 255 - 150

Write-Host "Cropping source image: size=$size, cropX=$cropX, cropY=$cropY"

$cropRect = New-Object System.Drawing.Rectangle($cropX, $cropY, $size, $size)
$croppedBmp = $bmp.Clone($cropRect, $bmp.PixelFormat)
$bmp.Dispose()

# Destination paths
$destPaths = @(
    ".\app-musteri\public\logo-icon.png",
    ".\app-musteri\app\icon.png",
    ".\app-musteri\app\favicon.ico",
    ".\app-hizmetveren\app\icon.png",
    ".\app-hizmetveren\app\favicon.ico"
)

foreach ($dest in $destPaths) {
    # Ensure directory exists
    $dir = Split-Path $dest
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
    }
    
    # Save the cropped bitmap
    if (Test-Path $dest) {
        Remove-Item $dest -Force
    }
    $croppedBmp.Save($dest, [System.Drawing.Imaging.ImageFormat]::Png)
    Write-Host "Saved cropped icon to: $dest"
}

$croppedBmp.Dispose()
Write-Host "All icons cropped and updated successfully!"

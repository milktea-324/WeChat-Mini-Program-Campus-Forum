param(
    [string]$FolderPath = ".",
    [int]$StartNumber = 0,
    [switch]$DryRun
)

$FolderPath = (Resolve-Path -LiteralPath $FolderPath).Path

$files = Get-ChildItem -LiteralPath $FolderPath -File

$existingPngNumbers = $files |
    Where-Object {
        $_.Extension -ieq ".png" -and $_.BaseName -match '^\d+$'
    } |
    ForEach-Object {
        [int]$_.BaseName
    }

if ($StartNumber -le 0) {
    if ($existingPngNumbers.Count -gt 0) {
        $StartNumber = ($existingPngNumbers | Measure-Object -Maximum).Maximum + 1
    } else {
        $StartNumber = 1
    }
}

Write-Host "Folder: $FolderPath"
Write-Host "Start number: $StartNumber"

if ($DryRun) {
    Write-Host "DryRun mode: no files will be renamed."
}

$jpgFiles = $files |
    Where-Object {
        $_.Extension -ieq ".jpg"
    } |
    Sort-Object Name

if ($jpgFiles.Count -eq 0) {
    Write-Host "No .jpg files found."
    exit
}

$currentNumber = $StartNumber

foreach ($file in $jpgFiles) {
    $newName = "$currentNumber.png"
    $newPath = Join-Path $FolderPath $newName

    while (Test-Path -LiteralPath $newPath) {
        Write-Host "Target exists, skip number: $newName"
        $currentNumber++
        $newName = "$currentNumber.png"
        $newPath = Join-Path $FolderPath $newName
    }

    Write-Host "$($file.Name) -> $newName"

    if (-not $DryRun) {
        Rename-Item -LiteralPath $file.FullName -NewName $newName
    }

    $currentNumber++
}

Write-Host "Done."
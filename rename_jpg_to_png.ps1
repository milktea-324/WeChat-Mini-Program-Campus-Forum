<#
.SYNOPSIS
    将当前目录下所有 .jpg 文件按数字顺序重命名为 .png
.DESCRIPTION
    仅处理当前层级，不递归子文件夹。
    自动检测现有数字 .png 的最大编号，从其后开始命名。
    若需手动指定起始编号，请修改下面的 $StartNumber 并设置 $AutoDetect = $false。
#>

# ========== 用户可修改区域 ==========
$StartNumber = 1       # 手动指定起始编号（仅在 $AutoDetect = $false 时生效）
$AutoDetect = $true    # $true: 自动检测已有最大编号； $false: 强制从 $StartNumber 开始
# ====================================

$targetDir = Get-Location

# 获取当前目录所有 .jpg 文件
$jpgFiles = Get-ChildItem -Path $targetDir -Filter *.jpg -File
if ($jpgFiles.Count -eq 0) {
    Write-Host "未找到 .jpg 文件，脚本退出。"
    exit
}

# 自动检测已有数字 .png 的最大编号
if ($AutoDetect) {
    $maxNum = 0
    $existingPng = Get-ChildItem -Path $targetDir -Filter *.png -File
    foreach ($f in $existingPng) {
        $base = [System.IO.Path]::GetFileNameWithoutExtension($f.Name)
        if ($base -match '^\d+$') {
            $num = [int]$base
            if ($num -gt $maxNum) { $maxNum = $num }
        }
    }
    $StartNumber = $maxNum + 1
}

Write-Host "将从编号 $StartNumber 开始重命名 $($jpgFiles.Count) 个文件..."

# 按名称排序保证处理顺序一致
$jpgFiles = $jpgFiles | Sort-Object Name
$counter = $StartNumber

foreach ($file in $jpgFiles) {
    do {
        $newName = "$counter.png"
        $newPath = Join-Path $targetDir $newName
        if (Test-Path $newPath) {
            Write-Host "警告: $newName 已存在，编号自动递增..."
            $counter++
        } else {
            break
        }
    } while ($true)

    Rename-Item -Path $file.FullName -NewName $newName
    Write-Host "$($file.Name) -> $newName"
    $counter++
}

Write-Host "完成！"
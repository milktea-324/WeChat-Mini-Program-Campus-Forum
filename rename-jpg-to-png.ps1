param(
    # 要处理的文件夹路径
    [string]$FolderPath = ".",

    # 手动指定起始编号。
    # 默认 0 表示自动识别当前最大 png 编号，并从 最大编号 + 1 开始。
    [int]$StartNumber = 0,

    # 预览模式：只显示会改成什么，不真正修改
    [switch]$DryRun
)

# 转换为绝对路径
$FolderPath = Resolve-Path -LiteralPath $FolderPath

# 获取当前文件夹内所有一级文件，不包含子文件夹
$files = Get-ChildItem -LiteralPath $FolderPath -File

# 找出当前已有的数字命名 png 文件，例如 1.png、25.png
$existingPngNumbers = $files |
    Where-Object {
        $_.Extension -ieq ".png" -and $_.BaseName -match '^\d+$'
    } |
    ForEach-Object {
        [int]$_.BaseName
    }

# 自动计算起始编号
if ($StartNumber -le 0) {
    if ($existingPngNumbers.Count -gt 0) {
        $StartNumber = ($existingPngNumbers | Measure-Object -Maximum).Maximum + 1
    } else {
        $StartNumber = 1
    }
}

Write-Host "处理文件夹：$FolderPath"
Write-Host "起始编号：$StartNumber"

if ($DryRun) {
    Write-Host "当前为预览模式，不会真正修改文件。"
}

# 获取要修改的 jpg 文件，仅限一级目录
# 按文件名排序，避免顺序混乱
$jpgFiles = $files |
    Where-Object {
        $_.Extension -ieq ".jpg"
    } |
    Sort-Object Name

if ($jpgFiles.Count -eq 0) {
    Write-Host "没有找到 .jpg 文件。"
    exit
}

$currentNumber = $StartNumber

foreach ($file in $jpgFiles) {
    $newName = "$currentNumber.png"
    $newPath = Join-Path $FolderPath $newName

    # 防止覆盖已有文件
    while (Test-Path -LiteralPath $newPath) {
        Write-Host "目标文件已存在，跳过编号：$newName"
        $currentNumber++
        $newName = "$currentNumber.png"
        $newPath = Join-Path $FolderPath $newName
    }

    Write-Host "$($file.Name)  ->  $newName"

    if (-not $DryRun) {
        Rename-Item -LiteralPath $file.FullName -NewName $newName
    }

    $currentNumber++
}

Write-Host "完成。"
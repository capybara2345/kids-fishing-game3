Add-Type -AssemblyName System.Drawing

$base = Join-Path $PSScriptRoot '..\public\assets\creatures'
$base = [System.IO.Path]::GetFullPath($base)

if (!(Test-Path $base)) {
  New-Item -ItemType Directory -Path $base -Force | Out-Null
}

function Save-Placeholder {
  param(
    [string]$FileName,
    [scriptblock]$Draw
  )

  $path = Join-Path $base $FileName
  $bmp = New-Object System.Drawing.Bitmap 128, 128
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $g.Clear([System.Drawing.Color]::FromArgb(0, 0, 0, 0))
  & $Draw $g
  $g.Dispose()
  $bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
  $bmp.Dispose()
  Write-Output "created $path"
}

Save-Placeholder 'shark.png' {
  param($g)
  $body = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 92, 103, 115))
  $belly = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 221, 226, 232))
  $fin = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 52, 58, 64))
  $eye = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::White)
  $pupil = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::Black)
  $g.FillEllipse($body, 18, 44, 88, 34)
  $g.FillEllipse($belly, 34, 52, 58, 18)
  $g.FillPolygon($fin, @(
    [System.Drawing.Point]::new(8, 58),
    [System.Drawing.Point]::new(34, 42),
    [System.Drawing.Point]::new(34, 74)
  ))
  $g.FillPolygon($fin, @(
    [System.Drawing.Point]::new(58, 28),
    [System.Drawing.Point]::new(72, 18),
    [System.Drawing.Point]::new(74, 36)
  ))
  $g.FillEllipse($eye, 88, 50, 10, 10)
  $g.FillEllipse($pupil, 91, 52, 5, 5)
}

Save-Placeholder 'golden_fish.png' {
  param($g)
  $gold = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 255, 212, 59))
  $shine = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(180, 255, 255, 255))
  $tail = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 255, 236, 153))
  $eye = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::White)
  $pupil = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::Black)
  $g.FillPolygon($tail, @(
    [System.Drawing.Point]::new(12, 64),
    [System.Drawing.Point]::new(36, 44),
    [System.Drawing.Point]::new(36, 84)
  ))
  $g.FillEllipse($gold, 34, 46, 72, 36)
  $g.FillEllipse($shine, 52, 52, 22, 12)
  $g.FillEllipse($eye, 86, 56, 10, 10)
  $g.FillEllipse($pupil, 89, 58, 5, 5)
}

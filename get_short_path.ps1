$fso = New-Object -ComObject Scripting.FileSystemObject
$folder = $fso.GetFolder($env:USERPROFILE)
Write-Output $folder.ShortPath

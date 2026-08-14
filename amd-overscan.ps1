$ErrorActionPreference = "SilentlyContinue"

Write-Output "--- CLAVES DEL DRIVER AMD (clase display) ---"
$base = "HKLM:\SYSTEM\CurrentControlSet\Control\Class\{4d36e968-e325-11ce-bfc1-08002be10318}"
Get-ChildItem $base -ErrorAction SilentlyContinue | ForEach-Object {
    $k = $_
    $name = $null
    $d = Get-ItemProperty $k.PSPath -ErrorAction SilentlyContinue
    if ($d) { $name = $d."DriverDesc" }
    Write-Output ("== {0} ({1}) ==" -f $k.PSChildName, $name)
    if ($d) {
        $d.PSObject.Properties | Where-Object {
            $_.Name -match "OverScan|Overscan|Scaling|Scale|DA_|DAL|Custom|Mode|Res|Timing" -and $_.Name -notmatch "^PS"
        } | ForEach-Object {
            $v = $_.Value
            if ($v -is [byte[]]) { $v = "byte[{0}]" -f $v.Length }
            Write-Output ("  {0} = {1}" -f $_.Name, $v)
        }
    }
}

Write-Output "--- BUSQUEDA GLOBAL (valores con Overscan en el class key) ---"
Get-ChildItem $base -Recurse -ErrorAction SilentlyContinue | ForEach-Object {
    $p = Get-ItemProperty $_.PSPath -ErrorAction SilentlyContinue
    if ($p) {
        $p.PSObject.Properties | Where-Object { $_.Name -match "OverScan|Overscan" -and $_.Name -notmatch "^PS" } | ForEach-Object {
            Write-Output ("{0} :: {1} = {2}" -f $_.Name, $_.Name, $_.Value)
        }
    }
}

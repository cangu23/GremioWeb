param(
    [double]$GreenScale = 1.0,
    [double]$BlueScale = 0.80
)
$ErrorActionPreference = "Stop"

Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;

[StructLayout(LayoutKind.Sequential, CharSet = CharSet.Ansi)]
public struct RAMP {
    [MarshalAs(UnmanagedType.ByValArray, SizeConst = 256)]
    public ushort[] Red;
    [MarshalAs(UnmanagedType.ByValArray, SizeConst = 256)]
    public ushort[] Green;
    [MarshalAs(UnmanagedType.ByValArray, SizeConst = 256)]
    public ushort[] Blue;
}

public class G {
    [DllImport("gdi32.dll", CharSet = CharSet.Unicode)]
    public static extern IntPtr CreateDC(string lpszDriver, string lpszDevice, string lpszOutput, IntPtr lpInitData);
    [DllImport("gdi32.dll")]
    public static extern int DeleteDC(IntPtr hdc);
    [DllImport("gdi32.dll")]
    public static extern bool SetDeviceGammaRamp(IntPtr hDC, ref RAMP lpRamp);
    [DllImport("gdi32.dll")]
    public static extern bool GetDeviceGammaRamp(IntPtr hDC, ref RAMP lpRamp);
}
"@

Add-Type -AssemblyName System.Windows.Forms
Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;
[StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]
public struct DEVMODE {
    [MarshalAs(UnmanagedType.ByValTStr, SizeConst = 32)] public string dmDeviceName;
    public short dmSpecVersion; public short dmDriverVersion; public short dmSize; public short dmDriverExtra;
    public int dmFields; public int dmPositionX; public int dmPositionY; public int dmDisplayOrientation; public int dmDisplayFixedOutput;
    public short dmColor; public short dmDuplex; public short dmYResolution; public short dmTTOption; public short dmCollate;
    [MarshalAs(UnmanagedType.ByValTStr, SizeConst = 32)] public string dmFormName;
    public short dmLogPixels; public int dmBitsPerPel; public int dmPelsWidth; public int dmPelsHeight;
    public int dmDisplayFlags; public int dmDisplayFrequency; public int dmICMMethod; public int dmICMIntent;
    public int dmMediaType; public int dmDitherType; public int dmReserved1; public int dmReserved2;
    public int dmPanningWidth; public int dmPanningHeight;
}
public class D2 {
    [DllImport("user32.dll", CharSet = CharSet.Unicode)]
    public static extern int EnumDisplaySettings(string deviceName, int modeNum, ref DEVMODE devMode);
}
"@

# Detectar el LG: el que esta en 768x1360 / 1360x768 (el vertical)
$lg = $null
foreach ($s in [System.Windows.Forms.Screen]::AllScreens) {
    $d = New-Object DEVMODE
    $d.dmSize = [System.Int16][System.Runtime.InteropServices.Marshal]::SizeOf([type][DEVMODE])
    [D2]::EnumDisplaySettings($s.DeviceName, -1, [ref]$d) | Out-Null
    if (($d.dmPelsWidth -eq 768 -and $d.dmPelsHeight -eq 1360) -or ($d.dmPelsWidth -eq 1360 -and $d.dmPelsHeight -eq 768)) {
        $lg = $s.DeviceName
    }
}
if ($null -eq $lg) { Write-Error "No se encontro el LG (768x1360/1360x768)"; exit 1 }
Write-Output "LG detectado: $lg"

# Construir la tabla gamma: R al 100%, G y B ajustables
$ramp = New-Object RAMP
$ramp.Red = New-Object 'System.UInt16[]' 256
$ramp.Green = New-Object 'System.UInt16[]' 256
$ramp.Blue = New-Object 'System.UInt16[]' 256
for ($i = 0; $i -lt 256; $i++) {
    $ramp.Red[$i] = [uint16][math]::Round($i * 257)
    $ramp.Green[$i] = [uint16][math]::Round($i * 257 * $GreenScale)
    $ramp.Blue[$i] = [uint16][math]::Round($i * 257 * $BlueScale)
}

$hdc = [G]::CreateDC("DISPLAY", $lg, $null, [IntPtr]::Zero)
if ($hdc -eq [IntPtr]::Zero) { Write-Error "No se pudo obtener el DC de $lg"; exit 1 }
$ok = [G]::SetDeviceGammaRamp($hdc, [ref]$ramp)
[G]::DeleteDC($hdc)
if (-not $ok) { Write-Error "SetDeviceGammaRamp fallo (probablemente AMD Custom Color lo esta pisando)"; exit 1 }

# Verificar
$check = New-Object RAMP
$hdc2 = [G]::CreateDC("DISPLAY", $lg, $null, [IntPtr]::Zero)
$got = [G]::GetDeviceGammaRamp($hdc2, [ref]$check)
[G]::DeleteDC($hdc2)
if ($got) {
    Write-Output ("Verificacion: R[128]={0} G[128]={1} B[128]={2}" -f $check.Red[128], $check.Green[128], $check.Blue[128])
} else {
    Write-Output "No se pudo leer la tabla para verificar."
}

Write-Output ("Aplicado: verde al {0}%, azul al {1}% en el LG" -f [math]::Round($GreenScale * 100), [math]::Round($BlueScale * 100))

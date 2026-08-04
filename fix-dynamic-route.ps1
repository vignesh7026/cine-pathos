# Run this from your project root: E:\mood-movies\mood-movies
# Usage:  powershell -ExecutionPolicy Bypass -File fix-dynamic-route.ps1
#
# PowerShell's -Path parameter treats [ and ] as wildcard characters, which
# can silently break creating/writing to a folder literally named "[id]".
# This script uses .NET's IO APIs directly (CreateDirectory / WriteAllText),
# which take literal paths and are immune to that globbing behavior.

$folder = Join-Path (Get-Location) "app\api\profiles\[id]"
$file = Join-Path $folder "route.ts"

[System.IO.Directory]::CreateDirectory($folder) | Out-Null

$content = @'
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { deleteProfile } from "@/lib/profileStore";

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  await deleteProfile(params.id, userId);

  const cookieStore = cookies();
  if (cookieStore.get("activeProfileId")?.value === params.id) {
    cookieStore.delete("activeProfileId");
  }

  return NextResponse.json({ success: true });
}
'@

[System.IO.File]::WriteAllText($file, $content, [System.Text.Encoding]::UTF8)

Write-Host "Verifying folder actually exists with literal name [id]..."
$check = Get-ChildItem -LiteralPath "app\api\profiles" -Force
$check | ForEach-Object { Write-Host " -" $_.Name }

Write-Host ""
Write-Host "Wrote: app\api\profiles\[id]\route.ts"
Write-Host "Now restart your dev server (Ctrl+C, then npm run dev)."

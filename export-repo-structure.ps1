# ==========================================
# EXPORT REPO STRUCTURE + FILE CONTENT
# Saves repo tree and contents to repo_snapshot.txt
# ==========================================

$OutputFile = "repo_snapshot.txt"

# Clear previous output
if (Test-Path $OutputFile) {
    Remove-Item $OutputFile
}

"REPOSITORY SNAPSHOT" | Out-File $OutputFile
"Generated: $(Get-Date)" | Out-File $OutputFile -Append
"==========================================" | Out-File $OutputFile -Append
"" | Out-File $OutputFile -Append


# ------------------------------------------
# 1. Print Folder Structure
# ------------------------------------------

"FOLDER STRUCTURE" | Out-File $OutputFile -Append
"------------------------------------------" | Out-File $OutputFile -Append

tree /F | Out-File $OutputFile -Append

"" | Out-File $OutputFile -Append
"" | Out-File $OutputFile -Append


# ------------------------------------------
# 2. Export All File Contents
# ------------------------------------------

"FILE CONTENTS" | Out-File $OutputFile -Append
"==========================================" | Out-File $OutputFile -Append
"" | Out-File $OutputFile -Append

Get-ChildItem -Recurse -File | ForEach-Object {

    $FilePath = $_.FullName

    "------------------------------------------" | Out-File $OutputFile -Append
    "FILE: $FilePath" | Out-File $OutputFile -Append
    "------------------------------------------" | Out-File $OutputFile -Append

    try {
        Get-Content $FilePath | Out-File $OutputFile -Append
    }
    catch {
        "[Unable to read file]" | Out-File $OutputFile -Append
    }

    "" | Out-File $OutputFile -Append
}

"EXPORT COMPLETE" | Out-File $OutputFile -Append
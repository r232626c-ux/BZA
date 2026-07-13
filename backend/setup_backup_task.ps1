#Requires -RunAsAdministrator

<#
.SYNOPSIS
    Sets up daily automated backup for BIOZONE database
.DESCRIPTION
    Creates a Windows Task Scheduler task to run daily database backups
#>

$TaskName = "BIOZONE Daily Backup"
$ScriptPath = "$PSScriptRoot\backup_db.bat"
$WorkingDirectory = "$PSScriptRoot"

# Check if task already exists
$existingTask = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
if ($existingTask) {
    Write-Host "Task '$TaskName' already exists. Removing it first..."
    Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
}

# Create new scheduled task
$action = New-ScheduledTaskAction -Execute $ScriptPath -WorkingDirectory $WorkingDirectory
$trigger = New-ScheduledTaskTrigger -Daily -At 2AM
$settings = New-ScheduledTaskSettingsSet -RunOnlyIfNetworkAvailable -RestartOnFailure -RestartCount 3 -RestartInterval (New-TimeSpan -Minutes 1)

Register-ScheduledTask -TaskName $TaskName -Action $action -Trigger $trigger -Settings $settings -Description "Daily backup of BIOZONE PostgreSQL database" -RunLevel Highest

Write-Host "Daily backup task created successfully!"
Write-Host "Task will run daily at 2:00 AM"
Write-Host "You can manage this task in Task Scheduler (taskschd.msc)"
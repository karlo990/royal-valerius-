# School PC backup agent

Keeps a copy of everything in the hub on the office PC and in Google Drive, and
puts the data back if the Space restarts empty.

1. Install Python 3 (python.org; tick "Add to PATH") and Google Drive for desktop.
2. Unzip this folder, e.g. to `C:\RoyalCrest\sync`.
3. Double-click **setup.bat** (or `python karlissa_sync.py setup`) and enter:
   - Hub address: `https://davincii-code-karlissa.hf.space`
   - Sync key: the `SYNC_KEY` secret of the Space
   - Folder: a Google Drive folder, e.g. `G:\My Drive\Royal Crest Backups`
4. Double-click **install.bat** so the agent starts with Windows, then **run.bat**.

It checks every 5 minutes and downloads a new zip only when something changed.
Log: `karlissa_sync.log`. Status: `python karlissa_sync.py status`.
Restore a specific zip: `python karlissa_sync.py restore "path\to\backup.zip"`.

The zips hold learners' records and parents' phone numbers. Keep the folder private.

# File Search

This extension allows you to search for files and folders on your computer. Search for "Search files" and press enter to open the file search view. Enter a search term to find files and folders. Press enter to open the selected file.

The File Search extension uses `mdfind` (on macOS), Everything (on Windows) and `ffs` of FPC File Search (on Linux) under the hood to do the file search.

![example](example.png)

## Requirements

### Windows

Make sure you have Everything and the Everything Command-line Interface installed and running.

#### Setup guide

1. Download Everything and the Everything Command-line Interface from here https://www.voidtools.com/downloads/

2. Put all together into a directory of your choice (e.g. C:\Program Files\Everything)

3. Start Everything and make sure it starts with Windows (Everything settings under General)

4. Open Ueli Settings and activate the File Search extension under the Extensions

5. Enter the Everything CLI Path from above (e.g. C:\Program Files\Everything\es.exe)

6. Open Ueli and search for "Search files", press Enter and type what you are searching for.

### macOS

On macOS you don't have to install any third-party tools. Just make sure the spotlight indexing service is up-and-running.

### Linux

On Linux the extension uses `ffs`, the command line program of FPC File Search. FPC File Search must be installed and its index must exist (`ffs --status`). Keep the program running, so the index stays up to date.

`ffs` is looked up in this order: the file path from the settings, `~/.local/bin/ffs`, `ffs` from the `PATH`.

On Linux the file search is also part of the main search window:

- Type a search term (at least 3 characters by default): a few files are shown in their own group "Files" below the regular search results.
- Type `f <search term>` to search files only. The prefix `f` can be changed in the settings.

The following options can be added to the search term, in the main search window and in the file search view:

| Option                   | Meaning                                                                               |
| ------------------------ | ------------------------------------------------------------------------------------- |
| `n:50`                   | up to 50 results for this search                                                      |
| `~`, `~/folder`          | only below the home folder or this folder                                             |
| `in:~/folder`, `in:/etc` | only below this folder, can be given more than once                                   |
| `in:/`                   | everywhere, even if search folders are set in the settings                            |
| `changed:today`          | modification time: `today`, `yesterday`, `7d`, `2h`, `year`, `2025-01-01..2025-03-31` |
| `size:+10M`              | file size: `+10M` (larger), `-100K` (smaller), `0`, `1M..10M`                         |
| `kind:docs`              | `docs`, `images`, `audio`, `video`, `archives`, `source`, `programs`                  |
| `type:folder`            | folders only, `type:file` files only                                                  |
| `sort:time`              | `name`, `path`, `size`, `time`; `sort:-time` reverses the order (newest first)        |

Examples: `f invoice ~ n:50`, `f kind:docs changed:7d sort:-time`, `f size:+1G sort:-size`. With a filter (`changed`, `size`, `kind`) no search term is needed. Folders given in the search term replace the search folders from the settings for this search and can't contain spaces.

The search term uses the syntax of FPC File Search, for example:

| Search term     | Meaning                                   |
| --------------- | ----------------------------------------- |
| `inv 2024`      | both parts are in the name                |
| `*.pdf`         | wildcards: the whole name must match      |
| `!tmp`          | exclude names containing "tmp"            |
| `projects/ inv` | a part with `/` applies to the whole path |
| `ext:pdf;docx`  | file extensions                           |

## Settings

- Max search result items: the maximum number of search result items that are shown. The lower this number the faster the search.
- (Windows) Everything CLI file path: the file path to the Everything Command-line Interface `es.exe`.
- (Linux) ffs file path: the file path to `ffs`. Leave it empty to find it automatically.
- (Linux) Search folders: only search below these folders, one folder per line, `~` is the home folder. Empty means the whole index.
- (Linux) Excluded folders: leave out these folders and everything below, one folder per line.
- (Linux) Prefix: the prefix to search files only in the main search window.
- (Linux) Show files in the main search: adds file search results to the regular search results.
- (Linux) Max file results in the main search: the maximum number of files that are added to the regular search results.
- (Linux) Min search term length for files in the main search: shorter search terms don't start a file search.

## About this extension

Author: [Oliver Schwendener](https://github.com/oliverschwendener)

Supported operating systems:

- Windows
- macOS
- Linux

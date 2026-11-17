# Changes in this fork

This fork of [Ueli](https://github.com/oliverschwendener/ueli) adds a fast file search on Linux and a few smaller things for the Linux desktop. Everything else is unchanged; see [README.md](README.md) for Ueli itself.

The changes live on the branch `feature/linux-file-search-ffs`.

## File search on Linux

Upstream Ueli has no file search on Linux. This fork fills the gap with `ffs`, the command line program of FPC File Search, which answers a search over the whole file index in a fraction of a second.

**Requirement:** FPC File Search must be installed, its index must exist (`ffs --status`), and the program should be running so the index stays up to date. FPC File Search is not public yet, so for now this part is only useful to people who have it.

To switch it on, open the settings, go to "Extensions" and enable "File Search".

| What you type               | What you get                                                                  |
| --------------------------- | ----------------------------------------------------------------------------- |
| `invoice`                   | the regular results, and below them a group "Files" with a few matching files |
| `f invoice`                 | files only                                                                    |
| "Search files", then a term | the file search view, which also shows the folder of each file                |

Options can be added to the search term:

| Option          | Meaning                                                                               |
| --------------- | ------------------------------------------------------------------------------------- |
| `n:50`          | up to 50 results                                                                      |
| `~`, `~/folder` | only below the home folder or this folder                                             |
| `in:/etc`       | only below this folder, can be given more than once                                   |
| `in:/`          | everywhere, even if search folders are set in the settings                            |
| `changed:today` | modification time: `today`, `yesterday`, `7d`, `2h`, `year`, `2025-01-01..2025-03-31` |
| `size:+10M`     | file size: `+10M` (larger), `-100K` (smaller), `0`, `1M..10M`                         |
| `kind:docs`     | `docs`, `images`, `audio`, `video`, `archives`, `source`, `programs`                  |
| `type:folder`   | folders only, `type:file` files only                                                  |
| `sort:-time`    | `name`, `path`, `size`, `time`; a leading `-` reverses the order                      |

The search term itself uses the syntax of FPC File Search: `inv 2024` (both parts in the name), `*.pdf`, `!tmp`, `ext:pdf;odt`, `projects/ inv`.

The question mark button at the bottom left of the search window shows these examples. The prefix, the number of results, the search folders and the path to `ffs` can be changed in the settings of the extension. Details: [docs/Extensions/FileSearch/README.md](docs/Extensions/FileSearch/README.md).

## Start menu entry (Linux)

In the settings under "General":

- **Start menu entry:** creates or removes the entry in the application menu. It is the file `~/.local/share/applications/ueli.desktop`. A file with that name that was not created by Ueli is never changed or removed.
- **Name of the start menu entry:** the name under which Ueli is found in the menu.

When Ueli runs from the source folder, the entry starts the last build (`npm run build`), not the development mode, and it starts Electron with `--no-sandbox`. The reason: distributions like Ubuntu don't let the Electron binary from `node_modules` set up its sandbox, so it would abort at startup. An installed package keeps the sandbox.

## Smaller changes

- **Window position and size:** the search window comes back where it was and as large as it was. If that place is no longer on a connected display, it starts centered with the default size.
- **Tray icon on Linux:** the colored logo instead of the plain white or black one.
- **File search view:** an answer to an older search term can no longer replace the results of the current one.

## For extension authors

Two additions to the extension interface, both optional:

- `getAsyncSearchResultItems(searchTerm)`: return items for the main search window that take a moment to resolve, for example by asking an external program. Ueli calls it debounced, drops outdated answers and shows the items in their own group. With `exclusive: true` only these items are shown.
- `showDetailsInCompactLayout` on a search result item: show its details next to the name in the compact list layout.

## Build and run

Node.js 24 is required.

```
npm install
npm run dev      # development mode
npm run build    # build used by the start menu entry
npm run check    # type check, lint, format check, tests
```

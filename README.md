# clxOS

> ##### Unfinished
>
> - [Demo](https://clxrityxyz-git-os-clxritys-projects.vercel.app/)

An OS/desktop like-design for a web page.

- Heavily inspired and influenced by [@DustinBrett](https://github.com/DustinBrett)'s [daedalOS](https://github.com/DustinBrett/daedalOS)

---

#### Previous error stack:

```
"ENOENT"
errno : 2
message : "Error: ENOENT: No such file or directory., '/desktop'"
path : "/desktop"
stack
"Error\n    at new ApiError (http://localhost:3000/_next/static/chunks/node_modules_browserfs_dist_browserfs_dc55a234.js:107:38)\n    at ApiError.FileError (http://localhost:3000/_next/static/chunks/node_modules_browserfs_dist_browserfs_dc55a234.js:129:32)\n    at ApiError.ENOENT (http://localhost:3000/_next/static/chunks/node_modules_browserfs_dist_browserfs_dc55a234.js:132:37)\n    at XmlHttpRequest.stat (http://localhost:3000/_next/static/chunks/node_modules_browserfs_dist_browserfs_dc55a234.js:12005:48)\n    at http://localhost:3000/_next/static/chunks/node_modules_browserfs_dist_browserfs_dc55a234.js:10020:50\n    at noError (http://localhost:3000/_next/static/chunks/node_modules_browserfs_dist_browserfs_dc55a234.js:7560:25)\n    at http://localhost:3000/_next/static/chunks/node_modules_browserfs_dist_browserfs_dc55a234.js:8159:33\n    at noError (http://localhost:3000/_next/static/chunks/node_modules_browserfs_dist_browserfs_dc55a234.js:7560:25)\n    at http://localhost:3000/_next/static/chunks/node_modules_browserfs_dist_browserfs_dc55a234.js:8334:33\n    at handleDirectoryListings (http://localhost:3000/_next/static/chunks/node_modules_browserfs_dist_browserfs_dc55a234.js:8302:33)\n    at http://localhost:3000/_next/static/chunks/node_modules_browserfs_dist_browserfs_dc55a234.js:8315:45\n    at http://localhost:3000/_next/static/chunks/node_modules_browserfs_dist_browserfs_dc55a234.js:8366:41\n    at r.onsuccess (http://localhost:3000/_next/static/chunks/node_modules_browserfs_dist_browserfs_dc55a234.js:8628:33)"
syscall
:
""
```

##### Checked items are considered to be working as intended & unchecked items are possible causes of the error stack above.

- Coming from [useFiles](./hooks/useFiles.tsx)
  - > Unable to read directory `/desktop` from within `/public`.
  - `fs` is defined within [useFileSystem](./hooks//useFileSystem.tsx)
    - Where the [`fileSystemConfig`](./config/index.ts) is passed to `configure` from [browserfs](https://github.com/jvilk/BrowserFS/tree/master)
      - > **Note**: browserfs is apparently deprecated
    - [ ] Using `readdir` from `fs` to read the directory `/desktop`, the callback function returns the error (if present (it is)) and the array of files.
      - Array empty
      - Error thrown
- [x] [FileManager](./components/system/FileManager.tsx) is rendered with the directory passed to it from the main page.
  - Returns an ordered list that maps through the directory
    - [ ] With a callback function that returns the file(s)
      - The file is deconstructed into a `path` and `title` and passed into the [`FileEntry`](./components/system/FileManager.tsx)
        - Which extracts the `icon` and `pid` from [useFileInfo](./hooks/useFileInfo.tsx) from the path

###### But then I moved the publicFileSystemIndex into the public/desktop directory...

- When I set the directory to `/` it returns the files within [fileSystemConfig](./config/index.ts)'s [publicFileSystemIndex](./public/desktop/public.json)
  - [x] [FileManager](./components/system/FileManager.tsx) is rendered with the directory passed to it from the main page. - Returns an ordered list that maps through the directory
    - [x] With a callback function that returns the file(s)
      - The file is deconstructed into a `path` and `title` and passed into the [`FileEntry`](./components/system/FileManager.tsx)
      - [ ] Which extracts the `icon` and `pid` from [useFileInfo](./hooks/useFileInfo.tsx) from the path
      - [ ] The error is thrown within [useFileInfo](./hooks//useFileInfo.tsx) where no file system is available.
        - [x] `fs` is defined within [useFileSystem](./hooks//useFileSystem.tsx)
              ...
        - [ ] Errors are thrown that [getShortcut](./util/shortcut.ts) cannot use `toString()` on `undefined`.
  - [ ] **Error in console**: `HEAD http://localhost:3000/Main.url 404 (Not Found)`

> **Summary**: The error is thrown when the file system is not available to the `useFileInfo` hook. Therefore the files are not openable and the `pid` is not available to the `FileEntry` component (within [FileManager](./components/system/FileManager.tsx)).
> But this folder structure was the only way I could get it to work at all at this point.

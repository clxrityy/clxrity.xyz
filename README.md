# img.clxrity.xyz

Standalone Node 24+ CLI for uploading, listing, and deleting publicly hosted images and videos, backed by Cloudflare R2. A small read-only Cloudflare Worker supplies rich share-link previews; raw media remains served directly by R2.

**The media is public.** Removing file metadata does not anonymize visible/audio content, your chosen public filename, or the server's upload time.

## Commands

```bash
pnpm upload ~/path/to/image
pnpm upload ~/path/to/image sunset
pnpm run list --limit 10
pnpm run remove sunset.jpg
```

after a [global install](#global-install), the same commands become:

```bash
clxrity-img upload ~/path/to/image
clxrity-img upload ~/Movies/clip.mov clip --color coral --title coral --description
clxrity-img upload ~/Movies/clip.mp4 --color
clxrity-img list --limit 10
clxrity-img remove sunset.jpg
```

successful uploads print two labeled lines: a share link and a raw URL.

```txt
Share: https://img.clxrity.xyz/s/clip.mp4
Raw: https://img.clxrity.xyz/clip.mp4
```

> [!TIP]
>
> The share link requires the Worker setup [below](#preview-worker-setup). Existing raw URLs remain unchanged, including direct video playback, HEAD, and byte-range seeking.

### Preview flags

| Flag | Meaning |
| --- | --- |
| omitted | inherit the configured default |
| `--color coral` | use a CSS named color, `blurple`, `#RGB`, or `#RRGGBB` |
| `--color` / `--color transparent` / `--color ""` | transparent: omit the color hint |
| `--title "My title"` | replace the title; `--title ""` clears a configured title |
| `--description "My description"` | replace the description |
| `--description` / `--description ""` | clear a configured description |

### User config

you can also place a JSON config file at:

- `$XDG_CONFIG_HOME/clxrity-img/config.json`, or
- `~/.config/clxrity-img/config.json`

example:

```json
{
  "r2AccountId": "your-cloudflare-account-id",
  "r2AccessKeyId": "your-r2-access-key-id",
  "r2SecretAccessKey": "your-r2-secret-access-key",
  "r2Bucket": "your-r2-bucket-name",
  "publicBaseUrl": "https://img.clxrity.xyz",
  "embedDefaults": {
    "color": "blurple",
    "title": "",
    "description": ""
  },
  "videoLimits": {
    "maxBytes": 104857600,
    "maxDurationSeconds": 600,
    "timeoutSeconds": 600
  }
}
```

```bash
chmod 700 ~/.config/clxrity-img
chmod 600 ~/.config/clxrity-img/config.json
```

### Listing

`list` shows the latest 20 objects by default. Use `--limit N`, `--all`, `--prefix sunset`, or `--json`. `--all` and `--limit` are mutually exclusive. text times include the timezone; JSON uses UTC ISO timestamps. the displayed filename is the authoritative removable ID (including its extension).

### Supported inputs

<details>
  <summary>videos</summary>

- install **[FFmpeg](https://ffmpeg.org/)** and [**FFprobe**](https://ffmpeg.org/ffprobe.html) on `PATH`, with `libx264` and AAC support.

macOS:
```bash
brew install ffmpeg
```

- MOV / MP4 -> MP4, fully re-encoded H.264/yuv420p with optional AAC audio and faststart.
- default **100 MiB** input/output, **10 minutes** duration, **10 minutes** processing timeout; configurable through `videoLimits` above.
- safety guards: at most **33,177,600 pixels/frame** and **120 fps**. invalid/corrupt files and HDR/unsupported transfer characteristics are rejected rather than silently changed.
- preserve resolution, orientation, aspect, frame rate, and audio, except padding odd dimensions for codec compatibility. encoding is lossy; no automatic downscaling or silent truncation.
- remove source global/stream descriptive tags, author/device/location/dates, chapters, attachments, telemetry/timecode and extra streams. only a generic `clxrity-img` software/encoder marker is added; structural codec/timing/color fields remain necessary.
- each video receives a scrubbed JPEG poster. preview title/description/color stay in object metadata, not in the file.

</details>

<details>
  <summary>images</summary>

original identifying EXIF/GPS/XMP/IPTC metadata is stripped. JPEG receives fresh generic software metadata; PNG receives only a generic software text marker. GIF may omit the marker. existing GIF animation timing and loops are preserved.

#### Limits

- **100 MiB** per image
- **512** frames
- **60-second** processing timeout
- **100 million** cumulative decoded pixels

##### Same output format (re-encoded, not byte-for-byte unchanged)

- JPEG / JPG
- PNG
- GIF

##### Converted for compatibility

- SVG -> PNG
- WebP -> PNG
- AVIF -> PNG
- TIFF -> PNG
- Animated WebP -> GIF

</details>

### Development

```bash
pnpm install
pnpm typecheck
pnpm test
pnpm build
pnpm verify:package
pnpm worker:test
pnpm worker:typecheck
```

### Global install

```bash
pnpm install
pnpm build
npm link --ignore-scripts
clxrity-img --version
```

> [!TIP]
> 
> to exercise an actual package/global-bin install without touching your real global packages or shell config: `pnpm verify:package --install`. it creates and removes a temporary isolated installation, may download dependencies, and contacts no image bucket.

---

#### References

- [R2 custom domains](https://developers.cloudflare.com/r2/buckets/public-buckets/)
- [R2 credentials](https://developers.cloudflare.com/r2/api/s3/tokens/)
- [consistency/caching](https://developers.cloudflare.com/r2/reference/consistency/)
- [Sharp formats](https://sharp.pixelplumbing.com/install/).

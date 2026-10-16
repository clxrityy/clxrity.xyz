# img.clxrity.xyz

standalone CLI for uploading, listing, and deleting publicly hosted images at `img.clxrity.xyz`, backed by a Cloudflare R2 bucket.

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
clxrity-img list --limit 10
clxrity-img remove sunset.jpg
```

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
  "publicBaseUrl": "https://img.clxrity.xyz"
}
```

```bash
chmod 700 ~/.config/clxrity-img
chmod 600 ~/.config/clxrity-img/config.json
```

### Listing

`list` shows the latest 20 objects by default. Use `--limit N`, `--all`, `--prefix sunset`, or `--json`. `--all` and `--limit` are mutually exclusive. text times include the timezone; JSON uses UTC ISO timestamps. the displayed filename is the authoritative removable ID (including its extension).

## Supported inputs

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

## Development

```bash
pnpm install
pnpm typecheck
pnpm test
pnpm build
pnpm verify:package
```

## Global install

```bash
pnpm install
pnpm build
npm link --ignore-scripts
clxrity-img --version
```

> [!TIP]
> 
> to exercise an actual package/global-bin install without touching your real global packages or shell config: `pnpm verify:package --install`. It creates and removes a temporary isolated installation, may download dependencies, and contacts no image bucket.

---

### References

- [R2 custom domains](https://developers.cloudflare.com/r2/buckets/public-buckets/)
- [R2 credentials](https://developers.cloudflare.com/r2/api/s3/tokens/)
- [consistency/caching](https://developers.cloudflare.com/r2/reference/consistency/)
- [Sharp formats](https://sharp.pixelplumbing.com/install/).

# Third-Party Notices

## antigravity-usage

Portions of `src/antigravity/` are derived from:

- Repository: https://github.com/skainguyen1412/antigravity-usage
- Upstream commit: `1b6dc0bb8d59b899a7601a25c8e2d921008823df 0.2.9`
- Original license: MIT

The derived code has been modified for `agy-monitor`, including quota window normalization, cache/source diagnostics, and security hardening. The Google Desktop OAuth Client ID and Client Secret fallback are intentionally shared by the upstream project in `src/google/oauth.ts`; `agy-monitor` keeps environment-variable overrides for custom clients.

## License Text

```text
MIT License

Copyright (c) 2024 Antigravity Usage Contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

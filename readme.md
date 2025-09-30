To run this project

run this cmd and copy the websocket uri

![Ref Image](/assets/image.png)

```windows
"C:\Program Files\Google\Chrome\Application\chrome.exe" --remote-debugging-port=9222 --user-data-dir="C:\path\to\remote-profile" --allow-file-access-from-files
```

```linux
/usr/bin/google-chrome-stable --remote-debugging-port=9222 --user-data-dir=remote-profile --allow-file-access-from-files
```

```macos
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --remote-debugging-port=9222 --no-first-run --no-default-browser-check --user-data-dir=$(mktemp -d -t 'chrome-remote_data_dir')
```

Finally

```bash
// Linux or Mac
export APP_ID=""
export GEMINI_API_KEY=""

// windows
$env:APP_ID=""
$env GEMINI_API_KEY=""
```


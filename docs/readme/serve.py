"""Local-only README art studio. Serves the current build without modifying it."""
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote, urlsplit
import argparse

ROOT = Path(__file__).resolve().parents[2]
class Handler(SimpleHTTPRequestHandler):
    def translate_path(self, path):
        route = unquote(urlsplit(path).path)
        if route.startswith('/simple-music-player/'):
            relative = route.removeprefix('/simple-music-player/')
            target = (ROOT / 'dist' / relative).resolve()
            if not target.is_relative_to(ROOT / 'dist'):
                return str(ROOT / 'dist' / 'index.html')
            if not target.is_file() and not target.is_dir():
                return str(ROOT / 'dist' / 'index.html')
            return str(target)
        return super().translate_path(path)
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--port', type=int, default=8768)
    args = parser.parse_args()
    import os
    os.chdir(ROOT)
    print(f'README studio: http://127.0.0.1:{args.port}/docs/readme/studio.html', flush=True)
    ThreadingHTTPServer(('127.0.0.1', args.port), Handler).serve_forever()

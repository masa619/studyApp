import json
from django.conf import settings

def load_vite_manifest():
    try:
        with open(settings.MANIFEST_PATH) as f:
            manifest = json.load(f)

            return {
                'main_js': manifest['src/main.tsx']['file'],
                'main_css': manifest['src/main.tsx']['css'][0] if manifest['src/main.tsx'].get('css') else None
            }
    except FileNotFoundError:
        return {'main_js': '', 'main_css': ''} 
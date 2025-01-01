import os
from django.core.wsgi import get_wsgi_application
from dotenv import load_dotenv

# 本番環境の.envファイルを読み込む
load_dotenv()

# 環境変数が設定されていない場合は本番環境をデフォルトとする
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'studyapp.settings.production')

application = get_wsgi_application()

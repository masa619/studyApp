import environ
env = environ.Env()
environ.Env.read_env()  # .envファイルから環境変数を読み込む

bind = env('BIND_ADDRESS', default='unix:/Users/shipro/Projects/studyApp/studyApp.sock')
workers = 3  # 適切な数に調整
worker_class = 'sync'
timeout = 120
errorlog = '/mnt/ironwolf1/nas/logs/gunicorn/studyApp/error.log'
accesslog = '/mnt/ironwolf1/nas/logs/gunicorn/studyApp/access.log'
loglevel = 'info'
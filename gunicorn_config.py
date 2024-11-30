bind = 'unix:/home/masa619/projects/studyApp/studyApp.sock'
workers = 1  # 適切な数に調整
worker_class = 'sync'
timeout = 120
errorlog = '/mnt/ironwolf1/nas/logs/gunicorn/studyApp/error.log'
accesslog = '/mnt/ironwolf1/nas/logs/gunicorn/studyApp/access.log'
loglevel = 'info'
import os
from sqlalchemy import create_engine, event
from sqlalchemy.orm import declarative_base, sessionmaker
from app.config import settings

db_url = settings.DATABASE_URL

if db_url.startswith('sqlite:///'):
    path_part = db_url.replace('sqlite:///', '')
    if path_part.startswith('./'):
        path_part = path_part[2:]
    
    if not os.path.isabs(path_part):
        # Resolve relative to project root
        root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
        abs_path = os.path.abspath(os.path.join(root_dir, path_part))
        os.makedirs(os.path.dirname(abs_path), exist_ok=True)
        # Use forward slashes for sqlite url
        clean_path = abs_path.replace(os.sep, '/')
        db_url = f'sqlite:///{clean_path}'

connect_args = {'check_same_thread': False} if db_url.startswith('sqlite') else {}

engine = create_engine(db_url, connect_args=connect_args, echo=False)

if db_url.startswith('sqlite'):
    @event.listens_for(engine, 'connect')
    def set_sqlite_pragma(dbapi_connection, connection_record):
        cursor = dbapi_connection.cursor()
        cursor.execute('PRAGMA foreign_keys=ON;')
        cursor.close()

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

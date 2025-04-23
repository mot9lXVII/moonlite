from flask import Flask, render_template, request, jsonify, session, redirect, url_for
from flask_cors import CORS
import sqlite3
import bcrypt
import logging
import os

app = Flask(__name__)
CORS(app)
app.secret_key = os.getenv('SECRET_KEY', 'super-secret-key')

logging.basicConfig(format='%(asctime)s - %(name)s - %(levelname)s - %(message)s', level=logging.INFO)
logger = logging.getLogger(__name__)

def init_db():
    with sqlite3.connect('orders.db') as conn:
        cursor = conn.cursor()
        # Проверяем текущую структуру таблицы users
        cursor.execute("PRAGMA table_info(users)")
        columns = [col[1] for col in cursor.fetchall()]

        if 'username' not in columns:
            # Создаём временную таблицу с правильной структурой
            cursor.execute('''
                CREATE TABLE users_temp (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    username TEXT NOT NULL UNIQUE,
                    password TEXT NOT NULL,
                    role TEXT DEFAULT 'user'
                )
            ''')
            # Копируем данные, присваивая временные username (например, user_<id>)
            cursor.execute('SELECT id, password, role FROM users')
            for row in cursor.fetchall():
                temp_username = f"user_{row[0]}"  # Временный уникальный username
                cursor.execute('INSERT INTO users_temp (id, username, password, role) VALUES (?, ?, ?, ?)',
                              (row[0], temp_username, row[1], row[2] or 'user'))
            # Удаляем старую таблицу и переименовываем временную
            cursor.execute('DROP TABLE users')
            cursor.execute('ALTER TABLE users_temp RENAME TO users')
        else:
            # Если username есть, создаём таблицу, если не существует
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    username TEXT NOT NULL UNIQUE,
                    password TEXT NOT NULL,
                    role TEXT DEFAULT 'user'
                )
            ''')

        # Проверяем остальные столбцы
        cursor.execute("PRAGMA table_info(users)")
        columns = [col[1] for col in cursor.fetchall()]
        if 'password' not in columns:
            cursor.execute('ALTER TABLE users ADD COLUMN password TEXT NOT NULL')
        if 'role' not in columns:
            cursor.execute('ALTER TABLE users ADD COLUMN role TEXT DEFAULT "user"')

        # Таблица заказов
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS orders (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT NOT NULL,
                name TEXT NOT NULL,
                girl TEXT,
                date TEXT NOT NULL,
                comment TEXT,
                status TEXT DEFAULT 'pending',
                FOREIGN KEY (username) REFERENCES users (username)
            )
        ''')
        # Таблица сообщений чата
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS support_messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT NOT NULL,
                message TEXT NOT NULL,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                is_admin_reply BOOLEAN DEFAULT FALSE
            )
        ''')
        conn.commit()

        # Создаём админа
        admin_username = 'mot9lXVII'
        admin_password = '1337motya'.encode('utf-8')
        hashed_password = bcrypt.hashpw(admin_password, bcrypt.gensalt())
        try:
            cursor.execute('INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
                          (admin_username, hashed_password, 'admin'))
            conn.commit()
        except sqlite3.IntegrityError:
            pass  # Админ уже существует

init_db()

def is_authenticated():
    return 'username' in session

def is_admin():
    return is_authenticated() and session.get('role') == 'admin'

@app.route('/')
def index():
    return render_template('index.html', authenticated=is_authenticated(), is_admin=is_admin())

@app.route('/girls')
def girls():
    return render_template('girls.html')

@app.route('/boys')
def boys():
    return render_template('boys.html')

@app.route('/reviews')
def reviews():
    return render_template('reviews.html')

@app.route('/services')
def services():
    return render_template('services.html')

@app.route('/workers')
def workers():
    return render_template('workers.html')

@app.route('/settings')
def settings():
    return render_template('settings.html')

@app.route('/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        username = data.get('username')
        password = data.get('password')

        if not username or not password:
            return jsonify({'status': 'error', 'message': 'Введите имя пользователя и пароль'}), 400

        hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
        with sqlite3.connect('orders.db') as conn:
            cursor = conn.cursor()
            cursor.execute('INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
                          (username, hashed_password, 'user'))
            conn.commit()
        return jsonify({'status': 'success', 'message': 'Регистрация успешна! Войдите в аккаунт.'})
    except sqlite3.IntegrityError:
        return jsonify({'status': 'error', 'message': 'Имя пользователя уже занято'}), 400
    except Exception as e:
        logger.error(f"Register error: {e}")
        return jsonify({'status': 'error', 'message': str(e)}), 400

@app.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        username = data.get('username')
        password = data.get('password')

        with sqlite3.connect('orders.db') as conn:
            cursor = conn.cursor()
            cursor.execute('SELECT password, role FROM users WHERE username = ?', (username,))
            user = cursor.fetchone()

        if user and bcrypt.checkpw(password.encode('utf-8'), user[0]):
            session['username'] = username
            session['role'] = user[1]
            return jsonify({'status': 'success', 'message': 'Вход успешен!', 'role': user[1]})
        return jsonify({'status': 'error', 'message': 'Неверное имя пользователя или пароль'}), 401
    except Exception as e:
        logger.error(f"Login error: {e}")
        return jsonify({'status': 'error', 'message': str(e)}), 400

@app.route('/logout', methods=['POST'])
def logout():
    session.pop('username', None)
    session.pop('role', None)
    return jsonify({'status': 'success', 'message': 'Выход успешен'})

@app.route('/order', methods=['POST'])
def order():
    if not is_authenticated():
        return jsonify({'status': 'error', 'message': 'Авторизуйтесь для оформления заказа'}), 401
    try:
        data = request.get_json()
        girl = data.get('girl')
        name = data.get('name')
        date = data.get('date')
        comment = data.get('comment')
        username = session['username']

        with sqlite3.connect('orders.db') as conn:
            cursor = conn.cursor()
            cursor.execute('''
                INSERT INTO orders (username, name, girl, date, comment, status)
                VALUES (?, ?, ?, ?, ?, ?)
            ''', (username, name, girl, date, comment, 'pending'))
            conn.commit()

        return jsonify({'status': 'success', 'message': 'Заказ принят!'})
    except Exception as e:
        logger.error(f"Order error: {e}")
        return jsonify({'status': 'error', 'message': str(e)}), 400

@app.route('/orders', methods=['GET'])
def get_orders():
    if not is_authenticated():
        return jsonify({'status': 'error', 'message': 'Авторизуйтесь для просмотра заказов'}), 401
    try:
        with sqlite3.connect('orders.db') as conn:
            cursor = conn.cursor()
            cursor.execute('SELECT girl, date, status FROM orders WHERE username = ?',
                          (session['username'],))
            orders = cursor.fetchall()
        return jsonify({'status': 'success', 'orders': [{'girl': o[0], 'date': o[1], 'status': o[2]} for o in orders]})
    except Exception as e:
        logger.error(f"Get orders error: {e}")
        return jsonify({'status': 'error', 'message': str(e)}), 400

@app.route('/support', methods=['POST'])
def send_support_message():
    if not is_authenticated():
        return jsonify({'status': 'error', 'message': 'Авторизуйтесь для отправки сообщения'}), 401
    try:
        data = request.get_json()
        message = data.get('message')
        is_admin_reply = is_admin()

        with sqlite3.connect('orders.db') as conn:
            cursor = conn.cursor()
            cursor.execute('INSERT INTO support_messages (username, message, is_admin_reply) VALUES (?, ?, ?)',
                          (session['username'], message, is_admin_reply))
            conn.commit()
        return jsonify({'status': 'success', 'message': 'Сообщение отправлено'})
    except Exception as e:
        logger.error(f"Support message error: {e}")
        return jsonify({'status': 'error', 'message': str(e)}), 400

@app.route('/support', methods=['GET'])
def get_support_messages():
    if not is_authenticated():
        return jsonify({'status': 'error', 'message': 'Авторизуйтесь для просмотра чата'}), 401
    try:
        with sqlite3.connect('orders.db') as conn:
            cursor = conn.cursor()
            if is_admin():
                cursor.execute('SELECT username, message, timestamp, is_admin_reply FROM support_messages ORDER BY timestamp')
            else:
                cursor.execute('SELECT username, message, timestamp, is_admin_reply FROM support_messages WHERE username = ? OR is_admin_reply = 1 ORDER BY timestamp',
                              (session['username'],))
            messages = cursor.fetchall()
        return jsonify({'status': 'success', 'messages': [{'username': m[0], 'message': m[1], 'timestamp': m[2], 'is_admin_reply': m[3]} for m in messages]})
    except Exception as e:
        logger.error(f"Get support messages error: {e}")
        return jsonify({'status': 'error', 'message': str(e)}), 400

if __name__ == '__main__':
    app.run(debug=True)

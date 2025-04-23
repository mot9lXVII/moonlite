from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
import sqlite3
import os
from telegram import Bot
from telegram.ext import Application, CommandHandler, ContextTypes
import asyncio
import logging
import requests

app = Flask(__name__)
CORS(app)

# Настройки Telegram
TELEGRAM_BOT_TOKEN = os.getenv('TELEGRAM_BOT_TOKEN', '7289784871:AAGq3ff8VJXvR4Q8cbewCJIJYpdbJJofoEI')
telegram_bot = Bot(token=TELEGRAM_BOT_TOKEN)

# Настройка логирования
logging.basicConfig(format='%(asctime)s - %(name)s - %(levelname)s - %(message)s', level=logging.INFO)
logger = logging.getLogger(__name__)

# Инициализация базы данных
def init_db():
    with sqlite3.connect('orders.db') as conn:
        cursor = conn.cursor()
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS orders (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                telegram_username TEXT NOT NULL,
                telegram_id TEXT,
                girl TEXT,
                date TEXT NOT NULL,
                comment TEXT,
                status TEXT DEFAULT 'pending'
            )
        ''')
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS users (
                telegram_id TEXT PRIMARY KEY,
                telegram_username TEXT NOT NULL,
                name TEXT
            )
        ''')
        conn.commit()

init_db()

# Получение Telegram ID по username
def get_telegram_id(username):
    try:
        response = requests.get(f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/getChat?chat_id={username}")
        result = response.json()
        if result.get('ok'):
            return str(result['result']['id'])
        return None
    except Exception as e:
        logger.error(f"Error getting Telegram ID for {username}: {e}")
        return None

# Telegram: обработка команды /start
async def start(update, context: ContextTypes.DEFAULT_TYPE):
    telegram_id = str(update.effective_user.id)
    username = update.effective_user.username or "Unknown"
    
    # Сохраняем пользователя в базе
    with sqlite3.connect('orders.db') as conn:
        cursor = conn.cursor()
        cursor.execute('INSERT OR REPLACE INTO users (telegram_id, telegram_username) VALUES (?, ?)', 
                      (telegram_id, f"@{username}"))
        conn.commit()

    # Получаем заказы пользователя
    with sqlite3.connect('orders.db') as conn:
        cursor = conn.cursor()
        cursor.execute('SELECT girl, date, status FROM orders WHERE telegram_id = ? OR telegram_username = ?', 
                      (telegram_id, f"@{username}"))
        orders = cursor.fetchall()

    if orders:
        message = "Ваши активные заказы:\n" + "\n".join([f"👧 {order[0]} на {order[1]} (Статус: {order[2]})" for order in orders])
    else:
        message = "У вас пока нет заказов. Оформите заказ на сайте!"
    
    await update.message.reply_text(message)

# Инициализация Telegram бота
async def setup_bot():
    application = await Application.builder().token(TELEGRAM_BOT_TOKEN).build()
    application.add_handler(CommandHandler("start", start))
    await application.initialize()
    await application.start()
    await application.updater.start_polling()
    return application

# Запускаем бота в отдельном потоке
loop = asyncio.get_event_loop()
loop.create_task(setup_bot())

# Отправка уведомления в Telegram
async def send_telegram_message(telegram_id, message):
    try:
        await telegram_bot.send_message(chat_id=telegram_id, text=message)
        return True
    except Exception as e:
        logger.error(f"Error sending Telegram message: {e}")
        return False

@app.route('/')
def index():
    return render_template('index.html')

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

@app.route('/order', methods=['POST'])
def order():
    try:
        data = request.get_json()
        girl = data.get('girl')
        name = data.get('name')
        telegram_username = data.get('telegram_username')
        date = data.get('date')
        comment = data.get('comment')

        if not telegram_username.startswith('@'):
            telegram_username = f"@{telegram_username}"

        # Получаем Telegram ID
        telegram_id = get_telegram_id(telegram_username)

        # Сохраняем заказ в базе
        with sqlite3.connect('orders.db') as conn:
            cursor = conn.cursor()
            cursor.execute('''
                INSERT INTO orders (name, telegram_username, telegram_id, girl, date, comment, status)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ''', (name, telegram_username, telegram_id, girl, date, comment, 'pending'))
            conn.commit()

        # Обновляем данные пользователя
        if telegram_id:
            with sqlite3.connect('orders.db') as conn:
                cursor = conn.cursor()
                cursor.execute('INSERT OR REPLACE INTO users (telegram_id, telegram_username, name) VALUES (?, ?, ?)', 
                             (telegram_id, telegram_username, name))
                conn.commit()

        # Отправляем уведомление в Telegram, если диалог начат
        message = f"Здравствуйте, {name}! Ваш заказ на {date} ({girl}) успешно принят. Статус: pending"
        if telegram_id:
            success = asyncio.run(send_telegram_message(telegram_id, message))
            if success:
                return jsonify({'status': 'success', 'message': 'Заказ принят! Проверьте Telegram.'})
            else:
                return jsonify({'status': 'success', 'message': 'Заказ принят. Напишите /start боту, чтобы получить уведомления.'})
        return jsonify({'status': 'success', 'message': 'Заказ принят. Напишите /start боту, чтобы получить уведомления.'})

    except Exception as e:
        logger.error(f"Order error: {e}")
        return jsonify({'status': 'error', 'message': str(e)}), 400

if __name__ == '__main__':
    app.run(debug=True)
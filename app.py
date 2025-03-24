from flask import Flask, render_template, send_from_directory

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/services')
def services():
    return render_template('services.html')

@app.route('/girls')
def girls():
    return render_template('girls.html')

@app.route('/reviews')
def reviews():
    return render_template('reviews.html')

@app.route('/workers')
def workers():
    return render_template('workers.html')

# Маршруты для статических файлов
@app.route('/static/images/workers/<path:filename>')
def worker_images(filename):
    return send_from_directory('static/images/workers', filename)

@app.route('/static/css/<path:filename>')
def css_files(filename):
    return send_from_directory('static/css', filename)

@app.route('/static/js/<path:filename>')
def js_files(filename):
    return send_from_directory('static/js', filename)

if __name__ == '__main__':
    app.run(debug=True)
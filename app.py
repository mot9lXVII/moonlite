from flask import Flask, render_template

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/girls')
def girls():
    return render_template('girls.html')

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

if __name__ == '__main__':
    app.run(debug=True)
import subprocess
from flask import Flask, jsonify, request
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
from flask import request
from flask_jwt_extended import JWTManager, jwt_required, create_access_token, get_jwt_identity

app = Flask(__name__)

CORS(app)  
app.config["SQLALCHEMY_DATABASE_URI"] = f"sqlite:///database.db"
app.config['JWT_SECRET_KEY'] = 'viet'
jwt = JWTManager(app)

db = SQLAlchemy(app)


class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(100), unique=True, nullable=False)
    password_hash = db.Column(db.String(100), nullable=False)
    is_admin = db.Column(db.Boolean, default=False)  

    def __init__(self, username, password, is_admin=False):  
        self.username = username
        self.password_hash = generate_password_hash(password)
        self.is_admin = is_admin
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)


@app.route("/login", methods=["POST"])
def login():
    data = request.json
    username = data.get("username")
    password = data.get("password")

    user = User.query.filter_by(username=username).first()

    if user and user.check_password(password):
        access_token = create_access_token(identity=user.id)
        return jsonify(access_token=access_token), 200
    else:
        return jsonify({"message": "Invalid username or password"}), 401

@app.route('/protected', methods=['GET'])
@jwt_required()
def protected():
    current_user = get_jwt_identity()
    return jsonify(logged_in_as=current_user), 200

# Endpoint để xử lý yêu cầu đăng ký
@app.route("/register", methods=["POST"])
def register():
    data = request.json
    username = data.get("username")
    password = data.get("password")

    if len(username) < 4:
        return jsonify({"message": "tên đăng nhập phải lớn hơn 4 kí tự"}), 400
    if len(password) < 6:
        return jsonify({"message": "Mật khẩu phải ít nhất 6 kí tự"}), 400

    # Kiểm tra xem tên người dùng đã tồn tại chưa
    existing_user = User.query.filter_by(username=username).first()
    if existing_user:
        return jsonify({"message": "Tên đăng nhập đã tồn tại"}), 400
    new_user = User(username=username, password=password)
    db.session.add(new_user)
    db.session.commit()

    return jsonify({"message": "Đăng ký thành công"}), 200

@app.route("/users", methods=["GET"])
def get_users():
    users = User.query.all()
    user_data = []
    for user in users:
        user_data.append({
            "id": user.id,
            "username": user.username,
            "is_admin": user.is_admin
        })
    return jsonify(user_data)

@app.route("/users", methods=["POST"])
def create_user():
    data = request.json
    username = data.get("username")
    password = data.get("password")
    is_admin = data.get("is_admin", False)

    if not username or not password:
        return jsonify({"message": "Tên đăng nhập và mật khẩu không được để trống"}), 400

    existing_user = User.query.filter_by(username=username).first()
    if existing_user:
        return jsonify({"message": "Tên đăng nhập đã tồn tại"}), 400

    new_user = User(username=username, password=password, is_admin=is_admin)
    db.session.add(new_user)
    db.session.commit()

    return jsonify({"message": "Người dùng đã được tạo thành công"}), 201

@app.route("/users/<int:user_id>", methods=["PUT"])
def update_user(user_id):
    data = request.json
    username = data.get("username")
    password = data.get("password")
    is_admin = data.get("is_admin")

    user = User.query.get(user_id)
    if not user:
        return jsonify({"message": "Người dùng không tồn tại"}), 404

    if username:
        user.username = username
    if password:
        user.password_hash = generate_password_hash(password)
    if is_admin is not None:
        user.is_admin = is_admin

    db.session.commit()
    return jsonify({"message": "Người dùng đã được cập nhật thành công"}), 200

@app.route("/users/<int:user_id>", methods=["DELETE"])
def delete_user(user_id):
    user = User.query.get(user_id)
    if not user:
        return jsonify({"message": "Người dùng không tồn tại"}), 404

    db.session.delete(user)
    db.session.commit()
    return jsonify({"message": "Người dùng đã được xóa thành công"}), 200

@app.route("/check-admin-status", methods=["GET", "OPTIONS"])  
def check_admin_status():
    if request.method == "OPTIONS":  # Xử lý yêu cầu OPTIONS
        response = app.make_default_options_response()
    else:  # Xử lý yêu cầu GET
        response = jsonify({"isAdmin": False})  
    return response

class ProductResult(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(1000))
    img = db.Column(db.String(1000))
    url = db.Column(db.String(1000))
    price = db.Column(db.Float)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    search_text = db.Column(db.String(255))
    source = db.Column(db.String(255))

    def __init__(self, name, img, url, price, search_text, source):
        self.name = name
        self.url = url
        self.img = img
        self.price = price
        self.search_text = search_text
        self.source = source

    


class TrackedProducts(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(1000))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    tracked = db.Column(db.Boolean, default=True)

    def __init__(self, name, tracked=True):
        self.name = name
        self.tracked = tracked


@app.route("/results", methods=["POST"])
def submit_results():
    results = request.json.get("data")
    search_text = request.json.get("search_text")
    source = request.json.get("source")

    for result in results:
        product_result = ProductResult(
            name=result["name"],
            url=result["url"],
            img=result["img"],
            price=result["price"],
            search_text=search_text,
            source=source,
        )
        db.session.add(product_result)

    db.session.commit()
    response = {"message": "Received data successfully"}
    return jsonify(response), 200

#trả về danh sách các từ khóa tìm kiếm duy nhất đã được lưu trong cơ sở dữ liệu.
@app.route("/unique_search_texts", methods=["GET"])
def get_unique_search_texts():
    unique_search_texts = db.session.query(ProductResult.search_text).distinct().all()
    unique_search_texts = [text[0] for text in unique_search_texts]
    return jsonify(unique_search_texts)


@app.route("/results")
def get_product_results():
    search_text = request.args.get("search_text")
    results = (
        ProductResult.query.filter_by(search_text=search_text)
        .order_by(ProductResult.created_at.desc())
        .all()
    )

    product_dict = {}
    for result in results:
        url = result.url
        if url not in product_dict:
            product_dict[url] = {
                "name": result.name,
                "url": result.url,
                "img": result.img,
                "source": result.source,
                "created_at": result.created_at,
                "priceHistory": [],
            }
        product_dict[url]["priceHistory"].append(
            {"price": result.price, "date": result.created_at}
        )

    formatted_results = list(product_dict.values())

    return jsonify(formatted_results)


@app.route("/all-results", methods=["GET"])
def get_results():
    results = ProductResult.query.all()
    product_results = []
    for result in results:
        product_results.append(
            {
                "name": result.name,
                "url": result.url,
                "price": result.price,
                "img": result.img,
                "date": result.created_at,
                "created_at": result.created_at,
                "search_text": result.search_text,
                "source": result.source,
            }
        )

    return jsonify(product_results)


@app.route("/start-scraper", methods=["POST"])
def start_scraper():
    url = request.json.get("url")
    search_text = request.json.get("search_text")

    if url not in ["https://amazon.ca", "https://ebay.ca"]:
        return jsonify({"message": "Invalid URL"}), 400  # Thông báo URL không hợp lệ

    # Chạy scraper theo URL tương ứng
    if url == "https://amazon.ca":
        scraper_command = f'python ./scraper/__init__.py {url} "{search_text}" /results'
    elif url == "https://ebay.ca":
        scraper_command = f'python ./scraper/__init__.py {url} "{search_text}" /results'

    subprocess.Popen(scraper_command, shell=True)

    response = {"message": "Scraper started successfully"}
    return jsonify(response), 200


@app.route("/add-tracked-product", methods=["POST"])
def add_tracked_product():
    name = request.json.get("name")
    tracked_product = TrackedProducts(name=name)
    db.session.add(tracked_product)
    db.session.commit()

    response = {
        "message": "Thêm sản phẩm thành công",
        "id": tracked_product.id,
    }
    return jsonify(response), 200


@app.route("/tracked-product/<int:product_id>", methods=["PUT"])
def toggle_tracked_product(product_id):
    tracked_product = TrackedProducts.query.get(product_id)
    if tracked_product is None:
        response = {"message": "Tracked product not found"}
        return jsonify(response), 404

    tracked_product.tracked = not tracked_product.tracked
    db.session.commit()

    response = {"message": "Tracked product toggled successfully"}
    return jsonify(response), 200


@app.route("/tracked-products", methods=["GET"])
def get_tracked_products():
    tracked_products = TrackedProducts.query.all()

    results = []
    for product in tracked_products:
        results.append(
            {
                "id": product.id,
                "name": product.name,
                "created_at": product.created_at,
                "tracked": product.tracked,
            }
        )

    return jsonify(results), 200


@app.route("/update-tracked-products", methods=["POST"])
def update_tracked_products():
    tracked_products = TrackedProducts.query.all()
    data = request.json
    url = data.get("url")  # Nhận URL từ frontend
    #url = "https://amazon.ca"
    product_names = []
    for tracked_product in tracked_products:
        name = tracked_product.name
        if not tracked_product.tracked:
            continue

        command = f'python ./scraper/__init__.py {url} "{name}" /results'
        subprocess.Popen(command, shell=True)
        product_names.append(name)

    response = {
        "message": "Scrapers started successfully",
        "products": product_names,
    }
    return jsonify(response), 200


@app.route("/delete-by-search-text", methods=["DELETE"])
def delete_by_search_text():
    try:
        search_text = request.args.get("search_text")

        deleted_rows = ProductResult.query.filter_by(search_text=search_text).delete()

        # Commit thay đổi vào database
        db.session.commit()

        response = {
            "message": f"Deleted {deleted_rows} rows with search_text: {search_text}",
        }
        return jsonify(response), 200

    except Exception as e:
        print("Error:", str(e))
        response = {
            "message": "Failed to delete rows. Please try again.",
        }
        return jsonify(response), 500


@app.route("/delete-untracked-products", methods=["DELETE"])
def delete_untracked_products():

    untracked_products = TrackedProducts.query.filter_by(tracked=False).all()
    for product in untracked_products:
        db.session.delete(product)
    db.session.commit()

    response = {"message": "Untracked products deleted successfully"}
    return jsonify(response), 200


if __name__ == "__main__":
    with app.app_context():
        db.create_all()
    app.run()

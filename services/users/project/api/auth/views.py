# _*_ coding: utf-8 _*_
__author__ = 'taylor'
__date__ = '2019/4/15 11:29 PM'

from flask import Blueprint, request, make_response, jsonify
from flask.views import MethodView

from project import db
from project.api.models import User, BlacklistToken


auth_blueprint = Blueprint('auth', __name__)


class RegisterAPI(MethodView):
    """
    用户注册 Resource
    """

    def post(self):
        post_data = request.get_json()
        user = User.query.filter_by(email=post_data.get('email')).first()
        if not user:
            try:
                user = User(
                    username=post_data.get('username'),
                    email=post_data.get('email')
                )
                password = post_data.get('password')
                user.set_password(password)
                print(f'password_hash: {user.password_hash}')

                db.session.add(user)
                db.session.commit()

                auth_token = user.encode_auth_token()
                responseObject = {
                    'status': 'success',
                    'message': '注册成功.',
                    'auth_token': auth_token.decode()
                }
                return make_response(jsonify(responseObject)), 201
            except Exception as e:
                responseObject = {
                    'status': 'fail',
                    'message': '出错了，请重试.'
                }
                return make_response(jsonify(responseObject)), 401
        else:
            responseObject = {
                'status': 'fail',
                'message': '用户已存在，请登录.',
            }
            return make_response(jsonify(responseObject)), 202


class LoginAPI(MethodView):
    """
    User Login Resource
    """
    def post(self):
        # get the post data
        post_data = request.get_json()
        try:
            # fetch the user data
            user = User.query.filter_by(
                email=post_data.get('email')
            ).first()
            if user and user.check_password(post_data.get('password')):
                auth_token = user.encode_auth_token()
                if auth_token:
                    response_obj = {
                        'status': 'success',
                        'message': '登录成功.',
                        'auth_token': auth_token.decode(),
                        'currentAuthority': 'user'
                    }
                    return make_response(jsonify(response_obj)), 200
            else:
                response_obj = {
                    'status': 'fail',
                    'message': '用户不存在.'
                }
                return make_response(jsonify(response_obj)), 404
        except Exception as e:
            print(e)
            response_obj = {
                'status': 'fail',
                'message': '请重试'
            }
            return make_response(jsonify(response_obj)), 500


class UserAPI(MethodView):
    """
    User Resource
    """
    def get(self):
        # get the auth token
        auth_header = request.headers.get('Authorization')
        if auth_header:
            try:
                auth_token = auth_header.split(" ")[1]
            except IndexError:
                responseObject = {
                    'status': 'fail',
                    'message': 'Bearer token malformed.'
                }
                return make_response(jsonify(responseObject)), 401
        else:
            auth_token = ''
        if auth_token:
            resp = User.decode_auth_token(auth_token)
            if not isinstance(resp, str):
                user = User.query.filter_by(id=resp).first()
                response_obj = {
                    'status': 'success',
                    'data': {
                        'user_id': user.id,
                        'name': user.username,
                        'avatar': user.avatar(20),
                        'email': user.email,
                        'active': user.active,
                        'created_date': user.created_date,
                        'currentAuthority': 'user'
                    }
                }
                return make_response(jsonify(response_obj)), 200
            response_obj = {
                'status': 'fail',
                'message': resp
            }
            return make_response(jsonify(response_obj)), 401
        else:
            response_obj = {
                'status': 'fail',
                'message': '请提供有效token.'
            }
            return make_response(jsonify(response_obj)), 401


class LogoutAPI(MethodView):
    """
    Logout Resource
    """
    def post(self):
        # get auth token
        auth_header = request.headers.get('Authorization')
        if auth_header:
            auth_token = auth_header.split(' ')[1]
        else:
            auth_token = ''
        if auth_token:
            response = User.decode_auth_token(auth_token)
            if not isinstance(response, str):
                # mark the token as blacklisted
                blacklist_token = BlacklistToken(auth_token)
                try:
                    # insert the token
                    db.session.add(blacklist_token)
                    db.session.commit()
                    response_obj = {
                        'status': 'success',
                        'message': '登出成功.'
                    }
                    return make_response(jsonify(response_obj)), 200
                except Exception as e:
                    response_obj = {
                        'status': 'fail',
                        'message': e
                    }
                    return make_response(jsonify(response_obj)), 200
            else:
                response_obj = {
                    'status': 'fail',
                    'message': response
                }
                return make_response(jsonify(response_obj)), 401
        else:
            response_obj = {
                'status': 'fail',
                'message': '请提供有效token.'
            }
            return make_response(jsonify(response_obj)), 403


# define the API resources
registration_view = RegisterAPI.as_view('register_api')
login_view = LoginAPI.as_view('login_api')
user_view = UserAPI.as_view('user_api')
logout_view = LogoutAPI.as_view('logout_api')

# add Rules for API Endpoints
auth_blueprint.add_url_rule(
    '/auth/register',
    view_func=registration_view,
    methods=['POST']
)

auth_blueprint.add_url_rule(
    '/auth/login',
    view_func=login_view,
    methods=['POST']
)

auth_blueprint.add_url_rule(
    '/auth/status',
    view_func=user_view,
    methods=['GET']
)
auth_blueprint.add_url_rule(
    '/auth/logout',
    view_func=logout_view,
    methods=['POST']
)
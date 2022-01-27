from flask import Flask, jsonify, request, send_file
from flask.views import MethodView
from flask_cors import CORS
from .api import UserAPI, PromptAPI, AudioAPI
from .file_system import audio_dir
from .db import DB
import json

app = Flask(__name__)
CORS(app)

user_api = UserAPI()
audio_api = AudioAPI()
prompt_api = PromptAPI()


class Users(MethodView):

    def get(self):
        uuid = request.args.get('uuid')
        user = user_api.get_user(uuid)
        if user.success:
            return jsonify(success=True, message="success", data=user.data)
        else:
            return jsonify(success=False, message=user.message)

    def post(self):
        user = request.get_json(force=True)
        res = user_api.save_user(user)
        if res.success:
            return jsonify(success=True, message="succesfully saved user")
        else:
            return jsonify(success=False, message=res.message)


class Audio(MethodView):

    def save_audio(self, uuid: str, prompt: str, data: bytes) -> jsonify:
        self.data=[]
        res = audio_api.save_audio(data, uuid, prompt)
        if res.success:
            self.data.append(res)
            return jsonify(success=True, message="sucessfully saved audio")
        else:
            return jsonify(
                success=False,
                message="did not sucessfully save audio"
            )

    def get_audio_len(self, data: bytes) -> jsonify:
        res = audio_api.get_audio_len(data)
        if res.success:
            return jsonify(success=True, data=res.data)
        else:
            return jsonify(success=False, message="error occured in server")
    
    def update_audio(uuid, prompt, data, last_id):
        pass

    def post(self):
        data = request.data
        uuid = request.args.get('uuid')
        prompt = request.args.get('prompt')
        get_len = request.args.get('get_len')
        # last_id = request.args.get('last_id')
        # if uuid and prompt and last_id:
        #     print("im here")
        #     return self.update_audio(uuid, prompt, data)
        if uuid and prompt:
            return self.save_audio(uuid, prompt, data)
        elif uuid and get_len:
            return self.get_audio_len(data)
        else:
            return jsonify(
                success=False,
                message="missing prompt or uuid query param"
            )


class Prompts(MethodView):

    def get(self):
        uuid = request.args.get('uuid')
        prompts = prompt_api.get_prompt(uuid)
        if prompts.success:
            return jsonify(success=True, data=prompts.data)
        else:
            return jsonify(success=False, messsage="failed to get prompt")


# registering apis
user_view = Users.as_view('user')
app.add_url_rule(
    '/api/user/',
    view_func=user_view,
    methods=['POST', 'GET']
)

audio_view = Audio.as_view('audio')
app.add_url_rule(
    '/api/audio/',
    view_func=audio_view,
    methods=['POST', 'GET']
)

prompt_view = Prompts.as_view('prompt')
app.add_url_rule(
    '/api/prompt/',
    view_func=prompt_view,
    methods=['GET']
)

# Here my changes
@app.route('/api/get_file', methods=['POST'])
def post_file():
    prompt = json.loads(request.data).get('prompt')
    id = json.loads(request.data).get('id')
    uuid = json.loads(request.data).get('uuid')
    path_to_file = f"{audio_dir}{uuid}/{prompt}.wav"
    # print("uuid, id: ",prompt," ", id, " ", uuid, " ", path_to_file)
    return send_file(
        path_to_file,
        mimetype="audio/wav", 
        as_attachment=True, 
        attachment_filename=f"{prompt}.wav")


@app.route('/api/get-last-usermodel', methods=['POST'])
def get_usermodel():
    # import pdb; pdb.set_trace()
    uuid = request.get_json().get('uuid')
    id = request.get_json().get('id')
    print("get meta data: ", uuid, " ", id)
    return DB.get_usermodel(uuid, id)


@app.route('/api/get-current-id', methods=['POST'])
def get_current_id():
    return DB.get_current_id()
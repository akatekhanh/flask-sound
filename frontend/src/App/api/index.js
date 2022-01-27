const apiRoot = "http://localhost:5000/";

export const postAudio = (audio, prompt, uuid, lastId) => {
    console.log("lsat id: ", lastId)
    return fetch(apiRoot + `api/audio/?uuid=${uuid}&prompt=${prompt}&last_id=${lastId}`, {
        method: "POST",
        body: audio,
        headers: {
            "Content-Type": "audio/wav"
        }
    })
};

export const getPrompt = uuid => {
    return fetch(apiRoot + `api/prompt/?uuid=${uuid}`, {
        method: "GET"
    });
};

export const getUser = uuid => {
    return fetch(apiRoot + `api/user/?uuid=${uuid}`, {
        method: 'GET'
    })
}

export const getAudioLen = (uuid, audio) => {
    return fetch(apiRoot + `api/audio/?uuid=${uuid}&get_len=True`, {
        method: "POST",
        body: audio,
        headers: {
            "Content-Type": "audio/wav"
        }
    })
}

export const createUser = (uuid, name) => {
    const data = {
        uuid: uuid,
        user_name: name
    }
    return fetch(apiRoot + `api/user/`, {
        method: 'POST',
        body: JSON.stringify(data),
        headers: {
            "Accept": "application/json",
            "Content-Type": "application/json"
        }
    })
}

export const getPreviousFile = (id,uuid, prompt) => {
    return fetch(apiRoot + `api/get_file`, {
        method: "POST",
        body: JSON.stringify({
            id: id,
            uuid: uuid,
            prompt: prompt
        }),
        headers: {
            "Content-Type": "audio/wav"
        }
    })
}


export const getPreviousMeta = (uuid, id) => {
    return fetch(apiRoot + `api/get-last-usermodel`, {
        method: "POST",
        body: JSON.stringify({
            uuid:uuid, 
            id: id
        }),
        headers: {
            "Accept": "application/json",
            "Content-Type": "application/json"
        }
    })
}

export const getCurrentId = () => {
    return fetch(apiRoot + `api/get-current-id`, {
        method: "POST",
        headers: {
            "Accept": "application/json",
            "Content-Type": "application/json"
        }
    })

}
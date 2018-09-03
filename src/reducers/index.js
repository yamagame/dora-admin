import { combineReducers } from 'redux'
import Play from './speech'
import 'whatwg-fetch'
import io from 'socket.io-client'

//const Dora = require('dora');

export const fontSize = (payload) => {
  var size = (payload.width < payload.height) ? payload.width : payload.height;
  return parseInt(size*0.6/10, 10);
}

const AsyncStorage = {
  getItem: function(key, defaultValue) {
    const value = localStorage.getItem(key);
    return (value !== null) ? JSON.parse(value).data : defaultValue;
  },
  setItem: function(key, value) {
    localStorage.setItem(key, JSON.stringify({ data: value }));
  },
}

var socket = null;

export const types = {
  PARAMS: 'PARAMS',
  LAYOUT: 'LAYOUT',
}

const algorithmPlay = new Play();
//const dora = new Dora();

const initialState = {
  name: '',
  adminFilename: '出席表示',
  clientId: '',
  members: [],
  adminPage: '出席',
  adminQuizId: '',
  adminStartTime: '',
  adminPlayerName: '',
  fontSize: fontSize({
    width: window.innerWidth,
    height: window.innerHeight,
  }),
}

const setValues = (state = initialState, action) => {
  if (action.type === types.PARAMS) {
    return {
      ...state,
      ...action.payload,
    }
  }
  if (action.type === types.LAYOUT) {
    return {
      ...state,
      ...action.payload,
    }
  }
  return state;
}

export const reducers = combineReducers({
  app: setValues,
})

export const initialData = (params, callback) => async (dispatch, getState) => {
  const payload = {
    ...initialState,
    ...params,
    width: window.innerWidth,
    height: window.innerHeight,
  }
  let signature = null;
  let user_id = null;
  payload.fontSize = fontSize(payload);
  // socket = socketIO;
  await Promise.all(Object.keys(initialState).map(async (key) => {
    payload[key] = await AsyncStorage.getItem(key, payload[key]);
  }));
  try {
    {
      let response = await fetch('/access-token', {
        method: 'POST',
      });
      if (response.ok) {
        let data = await response.json();
        signature = data.signature;
        user_id = data.user_id;
        dispatch({
          type: types.PARAMS,
          payload: {
            user_id,
            signature,
          },
        });
      }
    }
    payload.adminFilename = '出席表示';
    payload.adminPage = '出席';
    if (payload.name) {
      {
        let response = await fetch('/scenario', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            action: 'list',
            name: payload.name,
          })
        })
        let data = await response.json();
        if (data && data.items) {
          payload.items = data.items;
        }
      }
      {
        let response = await fetch('/scenario', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            action: 'load',
            name: 'admin-user',
            filename: '出席CSV',
          })
        })
        let data = await response.json();
        if (data && data.text) {
          payload.text = data.text;
        }
      }
      {
        let response = await fetch('/result', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            type: 'answers',
            quizId: null,
            startTime: null,
          })
        })
        let data = await response.json();
        payload.result = data;
      }
    }
    dispatch({
      type: types.PARAMS,
      payload,
    });
    {
      const payload_ = {
        name: payload.name,
        clientId: payload.clientId,
        time: new Date(),
        user_id,
        signature,
      }
      callback(payload_);
    }
  } catch(err) {
    console.log(err);
  }
}

export const createSocket = () => {
  socket = io();
  return socket;
}

export const playSpeech = (message, callback) => async (dispatch, getState) => {
  const node = {
    log: () => {},
  }
  const msg = {
    robotHost: socket,
  }
  const params = {
    message,
    algorithm: '',
  }
  if (message.trim() === '') {
    if (callback) callback(null, null);
  } else {
    algorithmPlay.request(node, msg, params, function(err, res) {
      if (callback) callback(err, res);
    });
  }
}

export const stopSpeech = (callback) => async (dispatch, getState) => {
  const node = {
    log: () => {},
  }
  algorithmPlay.stop(node, socket, function(err, res) {
    if (callback) callback(err, res);
  });
}

export const playScenario = (filename, range, callback) => async (dispatch, getState) => {
  const { name } = getState().app;
  let response = await fetch('/command', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      type: 'scenario',
      action: 'play',
      name,
      filename,
      range,
    })
  })
  let data = await response.json();
  if (callback) callback(null);
}

export const stopScenario = (callback) => async (dispatch, getState) => {
  const { name, } = getState().app;
  let response = await fetch('/command', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      type: 'scenario',
      action: 'stop',
    })
  })
  let data = await response.json();
  if (callback) callback(null);
}

export const save = (message, callback) => async (dispatch, getState) => {
  const { name, adminFilename } = getState().app;
  let response = await fetch('/scenario', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      action: 'save',
      name: 'admin-user',
      text: message,
      filename: adminFilename,
    })
  })
  let data = await response.json();
  if (callback) callback(null);
}

export const load = (option, callback) => async (dispatch, getState) => {
  const payload = {
  }
  const { name, adminFilename } = getState().app;
  let response = await fetch('/scenario', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      action: 'load',
      name: 'admin-user',
      filename: (option.filename) ? option.filename : adminFilename,
    })
  })
  if (response.ok) {
    let data = await response.json();
    if (data && typeof data.text !== 'undefined') {
      payload.text = data.text;
    } else {
      payload.text = '';
    }
    dispatch({
      type: types.PARAMS,
      payload,
    });
    if (callback) callback(null, payload.text);
    return;
  }
  if (callback) callback(null, '');
}

export const list = (callback) => async (dispatch, getState) => {
  const payload = {
  }
  const { name, } = getState().app;
  let response = await fetch('/scenario', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      action: 'list',
      name,
    })
  })
  if (response.ok) {
    let data = await response.json();
    if (data && data.items) {
      payload.items = data.items;
    }
    dispatch({
      type: types.PARAMS,
      payload,
    });
  }
  if (callback) callback(null);
}

export const changeLayout = (payload) => async (dispatch, getState) => {
  dispatch({
    type: types.LAYOUT,
    payload: {
      ...payload,
      fontSize: fontSize(payload),
    },
  });
}

export const setParams = (payload, callback) => async (dispatch, getState) => {
  await Promise.all(Object.keys(payload).map(async (key) => {
    await AsyncStorage.setItem(key, payload[key]);
  }));
  dispatch({
    type: types.PARAMS,
    payload,
  });
  if (callback) callback();
}

export const sendEntry = (callback) => async (dispatch, getState) => {
  const { app: { name, clientId, user_id, signature, } } = getState();
  const payload = {
    name,
    clientId,
    time: new Date(),
    user_id,
    signature,
  }
  socket.emit('quiz', payload);
  dispatch({
    type: types.PARAMS,
    payload: {
    },
  });
  if (callback) callback();
}

export const quizCommand = (payload, callback) => async (dispatch, getState) => {
  const { app: { name, } } = getState();
  payload = ((obj) => {
    const t = {};
    [
      'type',
      'action',
      'time',
      'pages',
      'sideImage',
      'choices',
      'fontScale',
      'question',
      'answers',
      'messages',
      'links',
      'entry',
      'title',
      'photo',
      'name',
      'pageNumber',
      'quizAnswers',
      'quizId',
      'quizStartTime',
      'sheet',
      'members',
    ].forEach( key => {
      if (typeof obj[key] !== 'undefined') {
        t[key] = obj[key];
      }
    })
    return t;
  })(payload);
  if (!payload.name || payload.name === name) {
    await Promise.all(Object.keys(payload).map(async (key) => {
      await AsyncStorage.setItem(key, payload[key]);
    }));
    dispatch({
      type: types.PARAMS,
      payload,
    });
  }
  if (callback) callback();
}

export const loadResult = (quizId, startTime, playerName, callback) => async (dispatch, getState) => {
  let response = await fetch('/result', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      type: 'answers',
      quizId: quizId,
      startTime: startTime,
    })
  })
  if (response.ok) {
    let result = await response.json();
    dispatch({
      type: types.PARAMS,
      payload: {
        result,
        adminQuizId: quizId,
        adminStartTime: startTime,
        adminPlayerName: playerName,
      }
    });
  }
  if (callback) callback();
}

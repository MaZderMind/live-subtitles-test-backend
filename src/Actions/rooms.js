// @flow
import _ from 'lodash';
import { addSuccess } from '../Services/notifications';
import { createAction } from 'redux-actions';
import { joinRoom as joinRoomSocket, leaveRoom as leaveRoomSocket } from '../Services/socket';
import { List, Map } from 'immutable';
import axios from 'axios';
import moment from 'moment';

function convertTalk(talk: RawTalk): Talk {
  // $FlowFixMe
  return {
    ...talk,
    date: moment(talk.date),
    duration: moment.duration(talk.duration),
  };
}


export const checkLines = createAction('CHECK_LINES', () => {});

export const fetchRooms = createAction('FETCH_ROOMS', async () => {
  const rooms = (await axios.get('/rooms')).data;
  let roomMap = Map();
  _.each(rooms, r => {
    roomMap = roomMap.set(r.id, r);
  });
  return roomMap;
});

export const saveRoom = createAction('SAVE_ROOM', async (rawRoom) => {
  let room;
  if (rawRoom.id) {
    room = (await axios.put(`/rooms/${rawRoom.id}`, {
      name: rawRoom.name,
    })).data;
  } else {
    room = (await axios.post('/rooms', { room: rawRoom })).data;
  }
  addSuccess({ message: 'Successfully saved' });
  return room;
});

export const createRoom = createAction('CREATE_ROOM', async () => ({
    name: '',
    isNew: true,
  }));

export const deleteRoom = createAction('DELETE_ROOM', async (room) => {
  if (!room.isNew) {
    await axios.delete(`/rooms/${room.id}`);
  }
  addSuccess({ message: 'Successfully deleted' });
  return room;
});

function joinRoomCheck(roomId) {
  joinRoomSocket(roomId);
}

let joinRoomTimeout;
export const joinRoom = createAction('JOIN_ROOM', async (roomId: number) => {
  if (!Number.isInteger(roomId)) {
    return {};
  }
  joinRoomSocket(roomId);
  if (joinRoomTimeout) {
    clearTimeout(joinRoomTimeout);
  }
  joinRoomTimeout = setTimeout(() => joinRoomCheck(roomId), 2500);
  const joinInformation = (await axios.get(`/rooms/${roomId}/join`)).data;
  let userInRoom: Map<number, ClientUser> = Map();
  joinInformation.userInRoom.forEach(u => {
    userInRoom = userInRoom.set(u.id, u);
  });
  joinInformation.userInRoom = userInRoom;
  joinInformation.lines = List(joinInformation.lines);
  return joinInformation;
});

export const leaveRoom = createAction('LEAVE_ROOM', roomId => {
  if (!Number.isInteger(roomId)) {
    return {};
  }
  leaveRoomSocket(roomId);
  if (joinRoomTimeout) {
    clearTimeout(joinRoomTimeout);
  }
  return roomId;
});

function lineUpdateFunc(roomId: number, userId: ?number, text: string, color: ?string, timeout: ?Date) {
  return {
    roomId,
    userId,
    text,
    color,
    timeout,
  };
}

export const lineUpdate = createAction('LINE_UPDATE', lineUpdateFunc);

export const newLine = createAction('NEW_LINE', lineUpdateFunc);

export const userJoined = createAction('USER_JOINED', (roomId, user) => ({
  roomId,
  user,
}));

export const userLeft = createAction('USER_LEFT', (roomId, user) => ({
  roomId,
  user,
}));

export const joinReadRoom = createAction('JOIN_READ_ROOM', async (roomId: number) => {
  if (!Number.isInteger(roomId)) {
    return {};
  }
  joinRoomSocket(roomId);
  const joinInformation = (await axios.get(`/rooms/${roomId}/joinRead`)).data;
  joinInformation.lines = List(joinInformation.lines);
  if (joinInformation.lines.size <= 0) {
    getNextTalk(roomId);
  }
  return joinInformation;
});

export const leaveReadRoom = createAction('LEAVE_READ_ROOM', () => {});

export const lockRoom = createAction('LOCK_ROOM', async (roomId, locked) => (await axios.put(`/rooms/${roomId}`, {
    locked,
  })).data);

export const speechLockRoom = createAction('SPEECH_LOCK_ROOM', async (roomId, speechLocked) => (await axios.put(`/rooms/${roomId}`, {
    speechLocked,
  })).data);

export const updateRoom = createAction('UPDATE_ROOM', async room => room);

export const setShortcut = createAction('SET_SHORTCUT', (key, shortcut) => {
  localStorage[`sc${key}`] = shortcut;
  return {
    key,
    shortcut,
  };
});

export const getNextTalk = createAction('GET_NEXT_TALK', async (roomId: number) => {
  const nextTalk = (await axios.get(`/nextTalk/${roomId}`)).data;
  return {
    nextTalk: convertTalk(nextTalk),
  };
});

export const reconnected = createAction('RECONNECTED', async () => {
  const room: ?Room = global.store.getState().currentRoom;
  const write = global.store.getState().write;
  if (room) {
    if (write) {
      joinRoom(room.id);
    } else {
      joinReadRoom(room.id);
    }
  }
});

export const changeReadColor = createAction('CHANGE_READ_COLOR', ({ gradient, color, backgroundColor, enableGradient }: { gradient?: string, color?: string, backgroundColor?: string, enableGradient?: bool }) => {
  const newState = {};
  if (gradient != null) {
    localStorage.setItem('gradientColor', gradient);
    newState.gradientColor = gradient;
  }
  if (backgroundColor != null) {
    localStorage.setItem('readbgColor', backgroundColor);
    newState.readBackgroundColor = backgroundColor;
  }
  if (color != null) {
    localStorage.setItem('readColor', color);
    newState.readColor = color;
  }
  if (enableGradient != null) {
    localStorage.setItem('readGradient', JSON.stringify(enableGradient));
    newState.readGradient = enableGradient;
  }
  return newState;
});

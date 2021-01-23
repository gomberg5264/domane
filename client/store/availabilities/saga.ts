import { EntityId } from '@reduxjs/toolkit';
import { selectors as domainsSelectors, name as domainsSliceName } from '@store/domains/slice';
import getConfig from 'next/config';
import { eventChannel } from 'redux-saga';
import { call, delay, fork, put, select, take, takeLatest } from 'redux-saga/effects';
import { selectors, upsert } from './slice';
import isNode from 'detect-node';
import ReconnectingWebSocket from 'reconnecting-websocket';

const { publicRuntimeConfig } = getConfig();
const { API_URL } = publicRuntimeConfig;

let ws: ReconnectingWebSocket;

function createEventChannel() {
  return eventChannel((emit) => {
    ws.addEventListener('message', (lastMessage) => {
      try {
        const data = JSON.parse(lastMessage?.data);
        if (data?.domain) {
          return emit({ data });
        }
      } catch (e) {
        console.debug(e);
      }
    });

    return () => ws.close();
  });
}

function* setupConnection() {
  if (isNode) return;

  const wsURL = API_URL.replace('http', 'ws');
  ws = new ReconnectingWebSocket(`${wsURL}/ws/availabilities`);

  const channel = yield call(createEventChannel);
  while (true) {
    const { data } = yield take(channel);
    yield put(upsert(data));
  }
}

function* sendMessages() {
  yield delay(500);

  const ids: EntityId[] = yield select(domainsSelectors.selectIds);
  const domains = yield select(domainsSelectors.selectEntities);
  const availabilities = yield select(selectors.selectEntities);

  ids
    .filter((id) => typeof availabilities[domains[id].domain]?.isAvailable === 'undefined')
    .forEach((id) => ws.send(domains[id].domain));
}

export default function* rootSaga() {
  yield fork(setupConnection);
  yield takeLatest(`${domainsSliceName}/fetchDataSuccess`, sendMessages);
}

export const APPEND_DATA = "APPEND_DATA";
export const APPEND_PENDING_DATA = "APPEND_PENDING_DATA";
export const HANDLE_PENDING_DATA = "HANDLE_PENDING_DATA";

import { REFERENCE_URL } from "@env";

import { getDate } from "../../helper/datecalc";
import firebase from "../../firebase";

export const appendData = (payload) => {
  return async (dispatch) => {
    try {
      payload.date = getDate();

      const image = await fetch(payload.image);
      const blob = await image.blob();
      const ref = firebase.storage().ref(`${"images/"}${payload.date}`);
      await ref.put(blob);
      const url = await firebase
        .storage()
        .ref(`${"images/"}${payload.date}`)
        .getDownloadURL();

      const response = await fetch(REFERENCE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload }),
      });

      const resData = await response.json();

      await dispatch({ type: APPEND_DATA, payload: payload });
    } catch (err) {}
  };
};

export const appendPendingData = (payload) => {
  return async (dispatch, getState) => {
    //adding to pending data
    try {
      payload.date = getDate();

      await dispatch({ type: APPEND_PENDING_DATA, payload: payload });
    } catch (err) {}
  };
};

export const handlePendingData = (index) => {
  return async (dispatch, getState) => {
    try {
      const pendingData = getState().dataReducer.pendingData;

      //adding to firebase, then removing it from globalState
      const payload = pendingData[index];

      const image = await fetch(payload.image);
      const blob = await image.blob();
      const ref = firebase.storage().ref(`${"images/"}${payload.date}`);
      await ref.put(blob);
      const url = await firebase
        .storage()
        .ref(`${"images/"}${payload.date}`)
        .getDownloadURL();

      const response = await fetch(REFERENCE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload }),
      });

      await dispatch({ type: HANDLE_PENDING_DATA });
    } catch (err) {}
  };
};

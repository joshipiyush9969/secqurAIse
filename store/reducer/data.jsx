import {
  APPEND_DATA,
  APPEND_PENDING_DATA,
  HANDLE_PENDING_DATA,
} from "../action/data";

const initialState = {
  pendingData: [],
  storedData: [],
};

export default (state = initialState, action) => {
  switch (action.type) {
    case APPEND_DATA:
      return { ...state, storedData: [...state.storedData, action.payload] };
    case APPEND_PENDING_DATA: {
      return {
        ...state,
        pendingData: [...state.pendingData, action.payload],
        storedData: [...state.storedData, action.payload],
      };
    }
    case HANDLE_PENDING_DATA: {
      const updatedPendingData = state.pendingData.slice(1);
      return { ...state, pendingData: updatedPendingData };
    }
    default:
      return state;
  }
};

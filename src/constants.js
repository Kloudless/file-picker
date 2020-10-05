// TODO: send events with the below constants instead of hard coded string

export const EVENTS = {
  SUCCESS: 'success',
  CANCEL: 'cancel',
  ERROR: 'error',
  OPEN: 'open',
  LOAD: 'load',
  CLOSE: 'close',
  SELECTED: 'selected',
  ADD_ACCOUNT: 'addAccount',
  DELETE_ACCOUNT: 'deleteAccount',
  START_FILE_UPLOAD: 'startFileUpload',
  FINISH_FILE_UPLOAD: 'finishFileUpload',
  LOGOUT: 'logout',
  DROP: 'drop',
};

export const EVENTS_LIST = Object.values(EVENTS);

export const VIEW_EVENTS = {
  DROPZONE_CLICKED: 'dropzoneClicked',
  GET_OAUTH_PARAMS: 'GET_OAUTH_PARAMS',
  INIT_CLOSE: 'INIT_CLOSE',
};

export const LOADER_INTERNAL_EVENTS = {
  DATA: 'DATA',
  INIT: 'INIT',
  LOGOUT: 'LOGOUT',
  LOGOUT_DELETE_ACCOUNT: 'LOGOUT:DELETE_ACCOUNT',
  CALLBACK: 'CALLBACK',
  CLOSING: 'CLOSING',
};

/**
 * A map to list out loader features and minimum supported version
 * Warning: In general, we should avoid doing b/c incompatible changes as
 *          there might be apps using older version of loaders.
 *          Extend this map only when necessary.
 *
 * MAP FORMAT: {[FEATURE NAME]: [LAST UNSUPPORTED VERSION]}
 *
 * Record "last unsupported version" because we only know the next version
 * number before rollout.
 */
export const LOADER_FEATURES = {
  /**
   * loader can handle unknown events, older versions don't handle
   * unknown events well, sending them could cause script errors
   */
  CAN_HANDLE_UNKNOWN_EVENTS: '2.5.1',
};

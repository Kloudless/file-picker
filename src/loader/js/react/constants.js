export const EVENT_HANDLER_MAPPING = {
  success: 'onSuccess',
  cancel: 'onCancel',
  error: 'onError',
  open: 'onOpen',
  load: 'onLoad',
  close: 'onClose',
  selected: 'onSelected',
  addAccount: 'onAddAccount',
  deleteAccount: 'onDeleteAccount',
  startFileUpload: 'onStartFileUpload',
  finishFileUpload: 'onFinishFileUpload',
  logout: 'onLogout',
};

export const DROPZONE_EVENT_HANDLER_MAPPING = {
  ...EVENT_HANDLER_MAPPING,
  dropzoneClicked: 'onClick',
  drop: 'onDrop',
};

export const EVENT_HANDLERS = Object.values(EVENT_HANDLER_MAPPING);

export const DROPZONE_EVENT_HANDLERS = Object.values(
  DROPZONE_EVENT_HANDLER_MAPPING,
);
